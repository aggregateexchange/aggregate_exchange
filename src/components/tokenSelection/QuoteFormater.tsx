import { BigNumber } from 'bignumber.js';

/**
 * Formats a quote based on the provided token information, amount, receiver address, slippage, and DApps.
 * @param {any} fromToken - The token object for the "From" token.
 * @param {any} toToken - The token object for the "To" token.
 * @param {any} amount - The amount to be converted.
 * @param {any} receiverAddress - Receiver's address (if provided, otherwise an empty string).
 * @param {any} slippage - Slippage value as a number.
 * @param {any[]} dApps - Array of strings representing enabled dApps.
 * @param {any} account - The account object containing the address.
 * @returns {any} - The formatted quote object.
 */
export const formatQuote = async (fromToken: any, toToken: any, amount: any, receiverAddress = '', slippage: any, dApps: any, account: any) => {
  if (!fromToken || !toToken || !amount) {
    return null; // Ensure all parameters are provided
  }
  console.log('From Token quoteFormater:', fromToken);
  console.log('To Token quoteFormater:', toToken);
  // Use test address if account is not connected
  const userAddress = account && account.address ? account.address : '0x1234C3AF916070b92C3857b818f6BA95Ee3297f6';

  const decimalsMultiplier = new BigNumber(10).exponentiatedBy(fromToken.decimals);
  const formattedAmount = new BigNumber(amount).multipliedBy(decimalsMultiplier).toFixed(); // Convert to fixed decimal string format

  const quote = {
    fromChainId: Number(fromToken.chainId),
    fromAddress: userAddress,
    amount: formattedAmount, // This ensures amount is a string in plain number format
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
    toAddress: receiverAddress || userAddress, // Use receiverAddress if provided, otherwise default to userAddress
    toChainId: Number(toToken.chainId),
    options: {
      slippage: slippage || 1, // Default to 1 if not provided
      dapps: dApps || [],
    }
  };

  const formattedQuote = JSON.stringify(quote);
  console.log('Formatted Quote:', formattedQuote); // Log the formatted quote for demonstration purposes
  return formattedQuote;
};
