// src/hooks/useTransactionHandler.tsx
import { useCallback } from 'react';
import { useSendTransaction } from 'thirdweb/react';
import { useThirdwebClient } from '../contexts/ThirdwebClientProvider';
import { useActiveWalletChain } from 'thirdweb/react';
import { eth_gasPrice, getRpcClient } from 'thirdweb/rpc';
import { ethers } from 'ethers';

// Utility function to convert to hex string
const toHexString = (value: any): `0x${string}` => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value as `0x${string}`;
  }
  return ethers.BigNumber.from(value).toHexString() as `0x${string}`;
};

export const useTransactionHandler = () => {
  const client = useThirdwebClient();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const activeChain = useActiveWalletChain();

  const sendTxAndWait = useCallback(
    async (tx: any) => {
      try {
        console.log('Active Chain:', activeChain);
        console.log('Transaction Data:', tx);

        if (!activeChain) {
          throw new Error('No active chain found');
        }

        const rpcRequest = getRpcClient({ client, chain: activeChain });
        const provider = new ethers.providers.JsonRpcProvider(activeChain.rpc);

        // Fetch gas price and estimate gas in parallel
        const [gasPrice, gasEstimate] = await Promise.all([
          eth_gasPrice(rpcRequest),
          provider.estimateGas({
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: toHexString(tx.value),
          }).then((gasEstimate) => {
            console.log('Estimated Gas:', gasEstimate.toString());
            // Multiply the gas estimate by 1.5
            return gasEstimate.mul(ethers.BigNumber.from(15)).div(ethers.BigNumber.from(10));
          }),
        ]);

        console.log('Fetched Gas Price:', gasPrice.toString());
        console.log('Adjusted Gas Estimate:', gasEstimate.toString());

        const finalTx = {
          ...tx,
          chain: activeChain,
          client,
          gas: toHexString(gasEstimate),
          gasPrice: toHexString(gasPrice),
        };

        console.log('Final Transaction Object:', finalTx);

        const transactionResponse = await sendTransaction(finalTx);

        console.log('Transaction Response:', transactionResponse);

        const receipt = await provider.waitForTransaction(transactionResponse.transactionHash);

        console.log('Transaction Receipt:', receipt);

        if (receipt && receipt.status === 1) {
          return { success: true, transactionHash: transactionResponse.transactionHash };
        }
        
        return { success: false, error: 'Transaction failed' };
        
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 4001) {
          console.error('Transaction cancelled by user');
          return { success: false, error: 'Transaction cancelled by user' };
        }
        console.error('Transaction failed:', error);
        return { success: false, error: 'Transaction failed' };
      }
    },
    [activeChain, sendTransaction, client]
  );

  return { sendTxAndWait, activeChain };
};
