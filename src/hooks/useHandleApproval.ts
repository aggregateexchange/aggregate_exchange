// useHandleApproval.ts
import { makeTransactionRequest } from '../utils/api/requestTransaction';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { useTransactionHandler } from '../hooks/useTransactionHandler';
import { useCheckAllowance } from '../components/wallet/checkAllowance';
import { useActiveWalletConnectionStatus } from 'thirdweb/react';

export const useHandleApproval = () => {
  const { sendTxAndWait } = useTransactionHandler();
  const { checkAllowance } = useCheckAllowance();
  const connectionStatus = useActiveWalletConnectionStatus();

  const handleApproval = async (
    quote: any,
    dapp: any,
    setApprovalStatus: any,
    setQuote: any,
    setErrorMessage: any,
    setIsGasEstimationError: any, // Added parameter
    fromNetwork: any,
    setTransactionHash: any,
    setTransactionStatus: any
  ): Promise<void> => {
    if (!['connected', 'connecting'].includes(connectionStatus)) {
      console.log('Wallet is not connected!');
      setApprovalStatus('Please connect wallet first');
      return;
    }

    if (quote && dapp) {
      console.log('Approval parameters:');
      printJSON({
        tokenAddress: quote.fromToken.address,
        spenderAddress: quote.approvalAddress,
        amount: new BigNumber(quote.fromAmount),
      });
      setApprovalStatus('Waiting for Allowance');

      try {
        const allowanceStatus = await checkAllowance(
          quote.fromToken.address,
          quote.fromAmount,
          quote.approvalAddress
        );

        if (allowanceStatus === 'Sufficient allowance' || allowanceStatus === true) {
          await handleTransaction(
            quote,
            dapp,
            setApprovalStatus,
            setQuote,
            setErrorMessage,
            setIsGasEstimationError, // Pass the new parameter
            fromNetwork,
            setTransactionHash,
            setTransactionStatus
          );
          return;
        } else {
          console.log('Allowance insufficient after approval attempt.');
          setErrorMessage('Transaction unsuccessful'); // Set generic error message
          setIsGasEstimationError(false); // Not a gas estimation error
          setApprovalStatus('Swap');
          setTransactionStatus('failure');
          return;
        }
      } catch (error: any) {
        console.error('Error during allowance check or approval:', error);

        // Generic error message for all allowance or approval errors
        setErrorMessage('Transaction unsuccessful'); // Generic error
        setIsGasEstimationError(false); // Not a gas estimation error
        setApprovalStatus('Swap');
        setTransactionStatus('failure');
        return;
      }
    }
  };

  const handleTransaction = async (
    quote: any,
    dapp: any,
    setApprovalStatus: any,
    setQuote: any,
    setErrorMessage: any,
    setIsGasEstimationError: any, // Added parameter
    fromNetwork: any,
    setTransactionHash: any,
    setTransactionStatus: any
  ) => {
    setApprovalStatus('Waiting for new quote');
    console.log('Passing to makeTransactionRequest:');
    printJSON(quote);

    try {
      const response = await makeTransactionRequest(quote);
      console.log('API Response:');
      printJSON(response);

      if (
        !response ||
        !response.success ||
        !response.data ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        throw new Error('Invalid response format from API');
      }

      const newQuote = response.data[0];
      console.log('New Quote:');
      printJSON(newQuote);

      if (!newQuote || !newQuote.data || !newQuote.data.transaction) {
        throw new Error('Transaction object is missing in the quote');
      }

      const transaction = newQuote.data.transaction;
      setQuote(newQuote);
      setApprovalStatus('Estimating gas');

      console.log('Transaction for gas estimation:');
      printJSON(transaction);

      try {
        const gasEstimate = await estimateGas(transaction, fromNetwork);
        if (gasEstimate) {
          setApprovalStatus('Sending transaction');
          const gasEstimateBN = new BigNumber(gasEstimate);
          const adjustedGas = gasEstimateBN.multipliedBy(1.5).integerValue(BigNumber.ROUND_UP);
          transaction.gas = '0x' + adjustedGas.toString(16);
          console.log('Sending transaction information', transaction);

          const txResponse = await sendTxAndWait(transaction);
          if (txResponse.success) {
            setTransactionStatus('success');
            setTransactionHash(txResponse.transactionHash);
          } else {
            setTransactionStatus('failure');
            setErrorMessage('Transaction unsuccessful'); // Generic error
            setIsGasEstimationError(false); // Not a gas estimation error
          }
          setApprovalStatus('Swap');
        } else {
          // **Set Specific Error Message for Gas Estimation Failure**
          setErrorMessage('This quote is no longer available, please select a different quote');
          setIsGasEstimationError(true); // Indicate gas estimation failure
          setApprovalStatus('Swap');
          setTransactionStatus('failure'); // Indicate transaction failure
          setQuote(null);
        }
      } catch (gasError: any) {
        console.error('Gas estimation error:', gasError);
        // **Set Specific Error Message for Gas Estimation Failure**
        setErrorMessage('This quote is no longer available, please select a different quote');
        setIsGasEstimationError(true); // Indicate gas estimation failure
        setApprovalStatus('Swap');
        setTransactionStatus('failure'); // Indicate transaction failure
        setQuote(null);
      }
    } catch (error: any) {
      console.error('Error getting new quote or sending transaction:', error);
      if (error.message === 'Gas estimation failed') {
        // **Set Specific Error Message for Gas Estimation Failure**
        setErrorMessage('This quote is no longer available, please select a different quote');
        setIsGasEstimationError(true); // Indicate gas estimation failure
        setQuote(null);
      } else {
        setErrorMessage('Transaction unsuccessful'); // Generic error
        setIsGasEstimationError(false); // Not a gas estimation error
      }
      setApprovalStatus('Swap');
      setTransactionStatus('failure'); // Indicate transaction failure
    }
  };

  const estimateGas = async (transaction: any, fromNetwork: any): Promise<any> => {
    if (!fromNetwork || !fromNetwork.rpcUrls || fromNetwork.rpcUrls.length === 0) {
      throw new Error('No RPC URLs provided');
    }

    const rpcUrl = fromNetwork.rpcUrls[0];
    console.log(`Using RPC URL: ${rpcUrl} for gas estimation`);
    console.log(`Network Details: ${JSON.stringify(fromNetwork)}`);

    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl)); // Use the first RPC URL
    try {
      const gasEstimate = await web3.eth.estimateGas({
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
      });
      console.log('Estimated Gas:', gasEstimate);
      return gasEstimate;
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      throw new Error('Gas estimation failed'); // Throw specific error
    }
  };

  return { handleApproval, handleTransaction };
};

function printJSON(jsonData: any): void {
  const replacer = (key: string, value: any) =>
    typeof value === 'bigint'
      ? value.toString() + 'n'
      : value instanceof BigNumber
      ? value.toString()
      : value; // Convert BigInt and BigNumber to string
  const jsonStr = JSON.stringify(jsonData, replacer, 2);
  const formattedStr = (jsonStr || '').replace(/\\n/g, '\n');
  console.log(formattedStr);
}
