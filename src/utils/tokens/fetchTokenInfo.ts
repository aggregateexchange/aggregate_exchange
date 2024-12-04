import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { useTokenStore } from '../../store/useTokenStore';
import { useStore } from '../../store/useStore';

export const useTokenInfoAndBalance = () => {
  const account = useActiveAccount();
  const { tokens } = useTokenStore();
  const { networks } = useStore();

  const getTokenInfoAndBalance = async (chain: any, tokenAddress: string) => {
    console.log(chain, tokenAddress);

    if (!chain || !chain.rpcUrls || chain.rpcUrls.length === 0) {
      console.error('Invalid chain data or missing RPC URLs:', chain);
      return null;
    }

    const chainId = chain.id;
    const userAddress = account?.address;

    // Check if the token exists in the store
    const storedToken = tokens[chainId]?.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase());

    if (storedToken) {
      console.log('Token found in store:', storedToken);
      const balanceReadable = userAddress ? await fetchBalance(chain, tokenAddress, userAddress, storedToken.decimals) : '0';
      return {
        tokenSymbol: storedToken.symbol,
        decimals: storedToken.decimals,
        balanceReadable
      };
    }

    // If token not found in store, fetch from network
    console.log('Token not found in store. Fetching from network...');
    const rpcUrl = chain.rpcUrls[Math.floor(Math.random() * chain.rpcUrls.length)];
    console.log(`Using RPC URL: ${rpcUrl} for fetching token information`);

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      const balanceReadable = userAddress ? await fetchNativeBalance(provider, userAddress) : '0';
      return {
        tokenSymbol: chain.nativeTokenSymbol,
        decimals: 18,
        balanceReadable
      };
    } else {
      try {
        const tokenABI = [
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address owner) view returns (uint)"
        ];

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
        
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        const balanceReadable = userAddress ? await fetchBalance(chain, tokenAddress, userAddress, decimals) : '0';

        // Add the new token to the store
        useTokenStore.getState().addToken(chainId, {
          address: tokenAddress,
          chainId,
          symbol,
          decimals,
          name: symbol,
          coinKey: symbol.toLowerCase(),
          logoURI: '',
          priceUSD: '0',
        });

        return {
          tokenSymbol: symbol,
          decimals,
          balanceReadable
        };
      } catch (error) {
        console.error('An error occurred while fetching ERC20 token information:', error);
        return null;
      }
    }
  };

  const fetchBalance = async (chain: any, tokenAddress: string, userAddress: string, decimals: number): Promise<string> => {
    const rpcUrl = chain.rpcUrls[Math.floor(Math.random() * chain.rpcUrls.length)];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      return fetchNativeBalance(provider, userAddress);
    } else {
      const tokenABI = ["function balanceOf(address owner) view returns (uint)"];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const balanceWei = await tokenContract.balanceOf(userAddress);
      return ethers.utils.formatUnits(balanceWei, decimals);
    }
  };

  const fetchNativeBalance = async (provider: ethers.providers.JsonRpcProvider, userAddress: string): Promise<string> => {
    try {
      const balanceWei = await provider.getBalance(userAddress);
      return ethers.utils.formatEther(balanceWei);
    } catch (error) {
      console.error('An error occurred while fetching native token balance:', error);
      return '0';
    }
  };

  return { getTokenInfoAndBalance };
};