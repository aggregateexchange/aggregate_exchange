import { useActiveAccount } from 'thirdweb/react';
import { formatQuote as formatQuoteUtil } from '../components/tokenSelection/QuoteFormater';
import { useState, useEffect } from 'react';

export const useFormattedQuote = (
  fromToken: any,
  toToken: any,
  amount: any,
  receiverAddress: any,
  slippage: any,
  dApps: any,
  fromTokenDecimals: number
) => {
  const [quote, setQuote] = useState<string | null>(null);
  const account = useActiveAccount();

  useEffect(() => {
    const updateQuote = async () => {
      if (fromToken && toToken && amount) {
        const formattedQuote = await formatQuoteUtil(
          fromToken,
          toToken,
          amount,
          receiverAddress,
          slippage,
          dApps,
          account
        );
        setQuote(formattedQuote);
      }
    };

    if (fromToken && toToken && amount) {
      updateQuote();
    }
  }, [fromToken, toToken, amount, receiverAddress, slippage, dApps, account, fromTokenDecimals]);

  return quote;
};
