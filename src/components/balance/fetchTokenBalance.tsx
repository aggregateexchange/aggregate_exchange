//src/components/balance/fetchTokenBalance.tsx
import { ethers } from 'ethers';
import { useStore } from '../../store/useStore';
import { Balance, Network } from '../../types';

// Multicall ABI
const MULTICALL_ABI = [
  {
    constant: true,
    inputs: [
      {
        components: [
          { name: 'target', type: 'address' },
          { name: 'callData', type: 'bytes' }
        ],
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate',
    outputs: [
      { name: 'blockNumber', type: 'uint256' },
      { name: 'returnData', type: 'bytes[]' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

// ERC20 Token ABI (balanceOf function)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

// Delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to validate Ethereum addresses
const isValidAddress = (address: string): boolean => {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

interface TokenData {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  coinKey: string;
  logoURI: string;
  priceUSD: string;
}

export const fetchTokenBalance = async (
  rpcUrl: string,
  multicallAddress: string,
  tokenAddresses: string[],
  walletAddress: string
): Promise<ethers.BigNumber[]> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const multicallContract = new ethers.Contract(multicallAddress, MULTICALL_ABI, provider);

  // Separate ETH address from token addresses
  const ethAddresses = tokenAddresses.filter(address => address === '0x0000000000000000000000000000000000000000');
  const erc20Addresses = tokenAddresses.filter(address => address !== '0x0000000000000000000000000000000000000000');

  const ethBalancesPromises = ethAddresses.map(async () => provider.getBalance(walletAddress));
  const ethBalances = await Promise.all(ethBalancesPromises);

  const calls = erc20Addresses.map((address) => {
    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
    const callData = tokenContract.interface.encodeFunctionData('balanceOf', [walletAddress]);
    return {
      target: address,
      callData
    };
  });

  const { returnData } = await multicallContract.aggregate(calls);
  const erc20Balances = returnData.map((data: string, index: number) => {
    const tokenContract = new ethers.Contract(erc20Addresses[index], ERC20_ABI, provider);
    const decodedData = tokenContract.interface.decodeFunctionResult('balanceOf', data);
    return decodedData[0];
  });

  // Combine ETH and ERC20 balances
  const balances = [...ethBalances, ...erc20Balances];
  return balances;
};

export const fetchAllTokenBalances = async (walletAddress: string, tokenData: { [chainId: string]: TokenData[] }): Promise<void> => {
  const { networks, setBalances, setLoadingBalance } = useStore.getState();

  console.log(`Starting to fetch balances for wallet: ${walletAddress}`);

  const fetchBalancesForNetwork = async (network: Network, tokenAddresses: string[], retries = 1): Promise<Balance[]> => {
    if (retries === 0) {
      return [];
    }

    try {
      const balances = await fetchTokenBalance(network.rpcUrls[0], network.multicallAddress, tokenAddresses, walletAddress);
      return balances
        .map((balance, i) => {
          const tokenInfo = tokenData[network.id]?.find((t: TokenData) => t.address.toLowerCase() === tokenAddresses[i].toLowerCase());
          if (tokenInfo && !balance.isZero()) {
            return {
              chainId: network.id,
              address: tokenAddresses[i],
              balance: ethers.utils.formatUnits(balance, tokenInfo.decimals)
            };
          }
          return null;
        })
        .filter((balance): balance is Balance => balance !== null);
    } catch (error) {
      console.error(`Error fetching balances for network ${network.name} (Chain ID: ${network.id}). Retries left: ${retries - 1}`, error);
      await delay(300);
      return fetchBalancesForNetwork(network, tokenAddresses, retries - 1);
    }
  };

  const allBalances: Balance[] = [];

  const balancePromises = Object.keys(networks).map(async (key) => {
    const network: Network = networks[key];
    const networkTokenData = tokenData[network.id];

    if (!networkTokenData) {
      console.log(`No token data found for network ${network.name} (Chain ID: ${network.id})`);
      return;
    }

    // Set loading state for the entire chain
    setLoadingBalance(network.id.toString(), 'chain', true);

    const validTokenAddresses = networkTokenData
      .map((token: TokenData) => token.address)
      .filter((address: string) => isValidAddress(address));

    const uniqueTokenAddresses = Array.from(new Set(validTokenAddresses));

    const tokenBatches = [];
    const batchSize = 800;

    for (let i = 0; i < uniqueTokenAddresses.length; i += batchSize) {
      tokenBatches.push(uniqueTokenAddresses.slice(i, i + batchSize));
    }

    try {
      for (let i = 0; i < tokenBatches.length; i++) {
        const batch = tokenBatches[i];
        await delay(i * 130); // Introduce 130 ms delay between batch starts
        const batchBalances = await fetchBalancesForNetwork(network, batch);
        allBalances.push(...batchBalances);
        if (batchBalances.length > 0) {
          setBalances(prevBalances => [...prevBalances, ...batchBalances]);
        }
      }
    } finally {
      // Set loading state to false for the chain, regardless of success or failure
      setLoadingBalance(network.id.toString(), 'chain', false);
    }
  });

  await Promise.all(balancePromises);

  if (allBalances.length > 0) {
    setBalances(allBalances);
  } else {
    console.log('No non-zero balances found across all networks');
  }

  console.log('Finished fetching all token balances');
};