// src/components/balance/fetchNativeBalance.ts
import { ethers } from 'ethers';
import { useStore } from '../../store/useStore';
import { Balance } from '../../types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const fetchNativeBalance = async (rpcUrl: string, address: string) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
};

export const fetchAllNativeBalances = async (address: string): Promise<Balance[]> => {
  const { networks, setBalances } = useStore.getState();
  
  const balancePromises = Object.keys(networks).map(async (key) => {
    const network = networks[key];
    try {
      const balance = await fetchNativeBalance(network.rpcUrls[0], address);
      const formattedBalance: Balance = {
        chainId: network.id,
        address: ZERO_ADDRESS,
        balance: balance,
      };
      //console.log(`Fetched balance for network ${network.name} (Chain ID: ${network.id}): ${formattedBalance.balance} ${network.nativeTokenSymbol}`);
      return formattedBalance;
    } catch (error) {
      //console.error(`Error fetching balance for network ${network.name}:`, error);
      return null;
    }
  });

  const balances = await Promise.all(balancePromises);
  const filteredBalances = balances.filter(balance => balance !== null) as Balance[];
  
  setBalances(filteredBalances);
  return filteredBalances;
};
