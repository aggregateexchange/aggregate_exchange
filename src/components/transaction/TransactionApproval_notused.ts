//TransactionApproval.ts

import { makeTransactionRequest } from '../../utils/api/requestTransaction';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { useStore } from '../../store/useStore';
import { useNetworkSwitcher } from '../../hooks/useNetworkSwitcher';
import { useActiveWalletChain, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { useTransactionHandler } from '../../hooks/useTransactionHandler';
import { useCheckAllowance } from '../../components/wallet/checkAllowance';

export const checkNetworkAndAllowance = async (quote: any, dappsData: any): Promise<any> => {
  const { networks } = useStore.getState();
  const chain = useActiveWalletChain();
  const connectionStatus = useActiveWalletConnectionStatus();

  console.log('Connection Status:', connectionStatus);

  if (quote) {
    console.log('Received quote:');
    printJSON(quote);

    const fromNetwork = networks[quote.fromChainId];
    const toNetwork = networks[quote.toChainId];

    printJSON(fromNetwork);
    printJSON(toNetwork);

    const dapp = dappsData[quote.tool];
    printJSON(dapp);

    if (!['connected', 'connecting'].includes(connectionStatus) || !chain) {
      console.log('Wallet is not connected or chain is undefined!');
      return { networkStatus: 'failed', fromNetwork, toNetwork, dapp };
    }

    if (chain.id !== quote.fromChainId) {
      return { networkStatus: 'wrong_network', fromNetwork, toNetwork, dapp };
    } else {
      return { networkStatus: 'correct_network', fromNetwork, toNetwork, dapp };
    }
  } else {
    return { networkStatus: 'idle', fromNetwork: null, toNetwork: null, dapp: null };
  }
};

export const handleNetworkSwitch = async (fromNetwork: any, quote: any): Promise<string> => {
  const { switchNetwork } = useNetworkSwitcher();
  const chain = useActiveWalletChain();

  if (fromNetwork) {
    switchNetwork(fromNetwork.id);
    if (!chain || chain.id !== quote.fromChainId) {
      return 'wrong_network';
    } else {
      return 'correct_network';
    }
  }
  return 'idle';
};

export const handleApproval = async (
  quote: any,
  dapp: any,
  setApprovalStatus: any,
  setQuote: any,
  setErrorMessage: any,
  fromNetwork: any,
  setTransactionHash: any,
  setTransactionStatus: any
): Promise<void> => {
  const { sendTxAndWait } = useTransactionHandler();
  const { checkAllowance } = useCheckAllowance();
  const connectionStatus = useActiveWalletConnectionStatus();

  if (!['connected', 'connecting'].includes(connectionStatus)) {
    console.log('Wallet is not connected!');
    setApprovalStatus('Swap');
    return;
  }

  if (quote && dapp) {
    console.log('Approval parameters:');
    printJSON({
      tokenAddress: quote.fromToken.address,
      spenderAddress: quote.approvalAddress,
      amount: new BigNumber(quote.fromAmount),
    });
    setApprovalStatus('Waiting for allowance');

    const allowanceStatus = await checkAllowance(
      quote.fromToken.address,
      quote.fromAmount,
      quote.approvalAddress
    );
    
    if (allowanceStatus === 'Sufficient allowance') {
      setApprovalStatus('Waiting for new quote');
      console.log('Passing to makeTransactionRequest:');
      printJSON(quote);
      try {
        const newQuote = await makeTransactionRequest(quote);
        console.log('New Quote:');
        printJSON(newQuote);
        setQuote(newQuote);
        setApprovalStatus('Estimating gas');

        // Estimate gas
        const gasEstimate = await estimateGas(newQuote.transaction, fromNetwork?.rpcUrls);
        if (gasEstimate) {
          setApprovalStatus('Sending transaction');
          const gasEstimateBN = new BigNumber(gasEstimate);
          const adjustedGas = gasEstimateBN.multipliedBy(1.5).integerValue(BigNumber.ROUND_UP); // Multiply the estimated gas by 1.5 and round up
          newQuote.transaction.gas = '0x' + adjustedGas.toString(16); // Convert to hex string
          console.log('Sending transaction information', newQuote.transaction);

          const txResponse = await sendTxAndWait(newQuote.transaction);
          if (txResponse.success) {
            setTransactionStatus('success');
            setTransactionHash(txResponse.transactionHash);
          } else {
            setTransactionStatus('failure');
            setErrorMessage(txResponse.error || 'Transaction failed');
          }
          setApprovalStatus('Swap');
        } else {
          throw new Error('Gas estimation failed');
        }
      } catch (error: any) {
        console.error('Error getting new quote or sending transaction:', error);
        if (error.message === 'Gas estimation failed') {
          setErrorMessage('Sorry, but gas estimation failed. Please select new quote as we want to protect your assets');
          setQuote(null); // Clear the current quote to display the error message
        } else {
          setErrorMessage(error.message);
        }
        setApprovalStatus('Swap');
      }
    } else {
      setApprovalStatus('Swap');
      console.log('Allowance insufficient, approval process initiated');
    }
  }
};

const estimateGas = async (transaction: any, rpcUrls?: string[]): Promise<any> => {
  if (!rpcUrls || rpcUrls.length === 0) {
    throw new Error('No RPC URLs provided');
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrls[0])); // Use the first RPC URL
  try {
    const gasEstimate = await web3.eth.estimateGas({
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
    });
    return gasEstimate;
  } catch (error: any) {
    console.error('Gas estimation error:', error);
    return null;
  }
};

/**
 * Helper function to print JSON data in a more copy-friendly format.
 * Handles BigInt serialization.
 * @param {Object} jsonData - The JSON data to print.
 */
function printJSON(jsonData: any): void {
  const replacer = (value: any) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value instanceof BigNumber ? value.toString() : value; // Convert BigInt and BigNumber to string
  const jsonStr = JSON.stringify(jsonData, replacer, 2);
  const formattedStr = jsonStr.replace(/\\n/g, '\n');
  console.log(formattedStr);
}
