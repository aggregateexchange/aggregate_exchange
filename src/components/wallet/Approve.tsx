import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useSendTransaction } from 'thirdweb/react';
import { useThirdwebClient } from '../../contexts/ThirdwebClientProvider';
import { useActiveWalletChain, useActiveAccount } from 'thirdweb/react';
import { eth_gasPrice, eth_estimateGas, getRpcClient } from 'thirdweb/rpc';

const maxUint256 = ethers.constants.MaxUint256;

export const useApprove = () => {
  const client = useThirdwebClient();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const activeChain = useActiveWalletChain();
  const account = useActiveAccount();

  const approveSpender = useCallback(
    async (tokenAddress: string, spender: string) => {
      if (!activeChain || !account) {
        throw new Error('Active chain or wallet is not available.');
      }
  
      const rpcRequest = getRpcClient({ client, chain: activeChain });
      const contract = new ethers.Contract(tokenAddress, [
        'function approve(address spender, uint256 amount) public returns (bool)'
      ], new ethers.providers.JsonRpcProvider(activeChain.rpc));
  
      const data: `0x${string}` = contract.interface.encodeFunctionData('approve', [spender, maxUint256]) as `0x${string}`;
      if (!data.startsWith("0x")) {
        throw new Error("Data must start with '0x'");
      }
  
      const tx = {
        to: tokenAddress,
        from: account.address,
        data,
      };
  
      try {
        const gasPrice = await eth_gasPrice(rpcRequest);
        const gasEstimate = await eth_estimateGas(rpcRequest, {
          to: tx.to,
          from: tx.from,
          data: tx.data,
        });
  
        // Convert gasPrice and gasEstimate to BigInt
        const finalTx = {
          ...tx,
          chain: activeChain,
          client,
          gas: BigInt(gasEstimate),
          gasPrice: BigInt(gasPrice),
        };
  
        const transactionResponse = await sendTransaction(finalTx);
        const provider = new ethers.providers.JsonRpcProvider(activeChain.rpc);
        const receipt = await provider.waitForTransaction(transactionResponse.transactionHash);
        console.log("Transaction successful", receipt);
        if (receipt && receipt.status === 1) {
          return true; // Transaction confirmed
        }
  
        return receipt; // Return the receipt for further inspection if needed
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 4001) {
          console.error('Transaction cancelled by user');
          return 'Transaction cancelled by user';
        }
        console.error('Approval transaction failed:', error);
        throw error;
      }
    },
    [activeChain, sendTransaction, client, account]
  );
  
  return { approveSpender };
  
};
