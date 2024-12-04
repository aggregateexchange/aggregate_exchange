//checkbalance.tsx
import { ethers } from 'ethers';

export const useCheckBalance = () => {
  const checkBalance = async (tokenAddress: string, walletAddress: string, fromNetwork: any): Promise<string | false> => {
    try {
      if (!fromNetwork || !fromNetwork.rpcUrls || fromNetwork.rpcUrls.length === 0) {
        throw new Error('Invalid network configuration.');
      }

      const rpcUrl = fromNetwork.rpcUrls[0];
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      if (tokenAddress === ethers.constants.AddressZero) {
        const balance = await provider.getBalance(walletAddress);
        return balance.toString(); // Return balance in wei
      } else {
        const erc20Contract = new ethers.Contract(
          tokenAddress,
          [
            // ERC20 ABI to fetch balance
            "function balanceOf(address owner) view returns (uint256)"
          ],
          provider
        );
        const balance = await erc20Contract.balanceOf(walletAddress);
        return balance.toString(); // Return balance in wei
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return false;
    }
  };

  return { checkBalance };
};
