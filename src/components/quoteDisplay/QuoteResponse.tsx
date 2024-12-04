// QuoteResponse.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useStore } from '../../store/useStore';
import { makeRequest } from '../../utils/api/requestQuotes';
import BigNumber from 'bignumber.js';
import './QuoteResponse.css';

type QuoteResponseProps = {
  streamActive: boolean;
  params: Record<string, any>;
  setStreamActive: (active: boolean) => void;
  onBestQuoteUpdate: (quote: any) => void;
  onQuoteClick?: (quote: any) => void;
};

const QuoteResponse: React.FC<QuoteResponseProps> = ({
  streamActive,
  params,
  setStreamActive,
  onBestQuoteUpdate,
  onQuoteClick,
}) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [streamEnded, setStreamEnded] = useState<boolean>(false);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [containerHeight, setContainerHeight] = useState<number>(100);

  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteItemRef = useRef<HTMLDivElement>(null);

  const account = useActiveAccount();
  const dappsData = useStore((state: any) => state.dapps);
  const tokensData = useStore((state: any) => state.tokens);

  const previousAccountRef = useRef<string | undefined>(account?.address);

  // Ref to store the latest quotes
  const quotesRef = useRef<any[]>([]);

  // Constants for styling
  const QUOTE_ITEM_HEIGHT = 70; // Height of a single quote item
  const QUOTE_ITEM_MARGIN = 10; // Margin between quote items
  const MAX_CONTAINER_HEIGHT = 500; // Maximum height of the container
  const MIN_CONTAINER_HEIGHT = 80; // Minimum height of the container

  // Effect to reset quotes when account changes
  useEffect(() => {
    if (account?.address !== previousAccountRef.current) {
      console.log('Account changed. Resetting quotes.');
      setQuotes([]);
      quotesRef.current = [];
      setFetchAttempted(false);
      setStreamEnded(false);
      previousAccountRef.current = account?.address;
    }
  }, [account]);

  // Effect to handle visibility and animation based on stream status
  useEffect(() => {
    if (streamActive) {
      // Start fade-in
      setIsVisible(true);
      console.log('Stream active. Showing quote container.');

      // Start animation after a short delay
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        console.log('Animation started.');
      }, 200); // 200ms delay

      // Clear any existing visibility timeout
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    } else {
      // Start fade-out
      setIsAnimating(false); // Stop animation immediately
      console.log('Stream inactive. Starting fade-out.');

      visibilityTimeoutRef.current = setTimeout(() => {
        if (quotes.length === 0) {
          setIsVisible(false);
          setStreamEnded(true);
          console.log('No quotes available. Hiding quote container.');
        }
      }, 300); // Match CSS transition duration for fade-out
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [streamActive, quotes]);

  // Effect to adjust container height based on the number of quotes
  useEffect(() => {
    const totalItemHeight = QUOTE_ITEM_HEIGHT + QUOTE_ITEM_MARGIN;
    const contentHeight = quotes.length * totalItemHeight + QUOTE_ITEM_MARGIN;
    const newHeight = Math.max(MIN_CONTAINER_HEIGHT, Math.min(contentHeight, MAX_CONTAINER_HEIGHT));
    setContainerHeight(newHeight);
    console.log(`Container height set to ${newHeight}px based on ${quotes.length} quotes.`);
  }, [quotes]);

  // Utility functions
  const formatAmount = (amount: number, decimals: number, priceUSD: string) => {
    const adjustedAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
    const precision = getPrecision(priceUSD);
    return adjustedAmount.toFixed(precision);
  };

  const calculateFullPrecisionPriceInUSD = (amount: number, priceUSD: number, decimals: number): BigNumber => {
    const adjustedAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
    return adjustedAmount.multipliedBy(priceUSD);
  };

  const getPrecision = (priceUSD: string) => {
    if (!priceUSD) return 2; // Default precision if priceUSD is not available
    const nonDecimalDigits = priceUSD.split('.')[0].length;
    return nonDecimalDigits + 2;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const calculateAdditionalFee = (quote: any): BigNumber | null => {
    if (!quote || !quote.transaction) return null;

    let additionalFee = new BigNumber(0);

    if (quote.fromToken.address === '0x0000000000000000000000000000000000000000') {
      additionalFee = new BigNumber(quote.transaction.value).minus(new BigNumber(quote.fromAmount));
    } else {
      additionalFee = new BigNumber(quote.transaction.value);
    }

    return additionalFee.isGreaterThan(0) ? additionalFee.dividedBy(new BigNumber(10).pow(18)) : null;
  };

  const getFeeTokenData = (chainId: number) => {
    const chainTokens = tokensData[chainId] || [];
    return chainTokens.find((token: any) => token.address === '0x0000000000000000000000000000000000000000');
  };

  const calculateFeeInUSD = (additionalFee: BigNumber, feeToken: any): string => {
    return additionalFee.multipliedBy(feeToken.priceUSD).toFixed(2); // Display with 2 decimals
  };

  // Handler for receiving and processing new quotes
  const handleNewQuote = (parsedQuote: any) => {
    try {
      // Calculate net value in USD
      const tokenPriceUSD = parseFloat(parsedQuote.toToken.priceUSD || '0');
      const valueInUSD = calculateFullPrecisionPriceInUSD(parsedQuote.toAmount, tokenPriceUSD, parsedQuote.toToken.decimals);

      const additionalFee = calculateAdditionalFee(parsedQuote);
      const feeToken = additionalFee ? getFeeTokenData(parsedQuote.fromToken.chainId) : null;
      const feeInUSD = additionalFee && feeToken ? new BigNumber(calculateFeeInUSD(additionalFee, feeToken)) : new BigNumber(0);

      const netValueInUSD = valueInUSD.minus(feeInUSD);

      // Debugging: Log calculated values
      console.log('Received Quote:', parsedQuote);
      console.log('Value in USD:', valueInUSD.toFixed());
      console.log('Fee in USD:', feeInUSD.toFixed());
      console.log('Net Value in USD:', netValueInUSD.toFixed());

      // Optionally handle negative net values
      if (netValueInUSD.isLessThanOrEqualTo(0)) {
        console.warn('Quote has non-positive net value and will be excluded:', parsedQuote);
        return; // Exclude this quote from being displayed
      }

      // Attach netValueInUSD to the quote for sorting and display
      const quoteWithNetValue = {
        ...parsedQuote,
        netValueInUSD, // BigNumber
      };

      // **Update quotesRef.current immediately**
      quotesRef.current = [...quotesRef.current, quoteWithNetValue];
      // Sort quotesRef.current based on netValueInUSD in descending order
      quotesRef.current.sort((a, b) => {
        return b.netValueInUSD.comparedTo(a.netValueInUSD); // Descending order
      });

      // Update quotes state
      setQuotes([...quotesRef.current]);
    } catch (error) {
      console.error('Error processing new quote:', parsedQuote, error);
    }
  };

  // Effect to handle the quote stream
  useEffect(() => {
    if (!streamActive || !params || Object.keys(params).length === 0) return;

    // Reset quotes
    console.log('Initiating new quote stream.');
    setQuotes([]);
    quotesRef.current = [];
    setFetchAttempted(true);
    setStreamEnded(false);

    // Initiate the quote stream
    const stream = makeRequest(params);

    // Attach event listeners
    stream.on('newQuote', (newQuote: string) => {
      try {
        const parsedQuote = JSON.parse(newQuote);
        handleNewQuote(parsedQuote);
      } catch (error) {
        console.error('Error parsing quote:', newQuote, error);
      }
    });

    stream.on('end', () => {
      console.log('Quote stream ended.');
      setStreamActive(false);
      setStreamEnded(true);
      const latestQuotes = quotesRef.current;
      console.log('Quotes at stream end:', latestQuotes);
      if (latestQuotes.length > 0) {
        const bestQuote = latestQuotes[0]; // First quote is the best due to sorting
        console.log('Best Quote:', bestQuote);
        onBestQuoteUpdate(bestQuote); // Notify App.tsx of the best quote
      } else {
        console.log('No quotes received from the stream.');
        onBestQuoteUpdate(null); // Ensure bestQuote is reset if no quotes are found
      }
    });

    stream.on('error', (error: any) => {
      console.error('Stream error:', error);
      setStreamActive(false);
      setStreamEnded(true);
      onBestQuoteUpdate(null); // Ensure bestQuote is reset if an error occurs
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('Cleaning up quote stream listeners.');
      stream.removeAllListeners();
    };
  }, [streamActive, params, setStreamActive, onBestQuoteUpdate]);

  // Handler for user clicking on a quote
  const handleQuoteClickInternal = (quote: any) => {
    console.log('User selected quote:', quote);
    if (onQuoteClick) {
      onQuoteClick(quote);
    }
  };

  return (
    <div
      className={`quote-response-quote-container ${isVisible ? 'visible' : ''}`}
      ref={containerRef}
      style={{ height: `${containerHeight}px` }}
    >
      <div className="quote-response-content" style={{ position: 'relative', height: '100%' }}>
        {/* Loader - Always Rendered with Visibility and Animation Controlled via Classes */}
        <div className={`quote-response-loader ${isVisible && isAnimating ? 'animate visible' : ''}`}></div>

        {/* Render each quote */}
        {quotes
          .filter((quote) => quote.toAmount > 0)
          .map((quote, index) => {
            const additionalFee = calculateAdditionalFee(quote);
            const feeToken = additionalFee ? getFeeTokenData(quote.fromToken.chainId) : null;
            const feeInUSD = additionalFee && feeToken ? calculateFeeInUSD(additionalFee, feeToken) : null;
            const netValueInUSD = quote.netValueInUSD.isFinite() ? quote.netValueInUSD : new BigNumber(0);

            return (
              <div
                key={`${quote.tool}-${quote.toAmount}-${index}`}
                className={`quote-response-quote-item ${streamEnded && index === 0 ? 'quote-response-highlight' : ''}`}
                onClick={() => handleQuoteClickInternal(quote)}
                ref={index === 0 ? quoteItemRef : null}
                style={{
                  position: 'absolute',
                  top: `${index * (QUOTE_ITEM_HEIGHT + QUOTE_ITEM_MARGIN) + QUOTE_ITEM_MARGIN}px`,
                  height: `${QUOTE_ITEM_HEIGHT}px`,
                  left: '10px',
                  right: '10px',
                }}
              >
                {/* Display DApp Image or Placeholder */}
                {dappsData[quote.tool] && dappsData[quote.tool].imageURI ? (
                  <img
                    src={dappsData[quote.tool].imageURI}
                    alt={quote.tool}
                    className="quote-response-dex-image"
                  />
                ) : (
                  <div className="quote-response-token-placeholder">{quote.tool}</div>
                )}

                {/* Quote Details */}
                <div className="quote-response-content-container">
                  <div className="quote-response-top-content">
                    {/* Token Image */}
                    {quote.toToken && isValidUrl(quote.toToken.logoURI) ? (
                      <img
                        src={quote.toToken.logoURI}
                        alt={quote.toToken.symbol}
                        className="quote-response-token-image"
                      />
                    ) : null}

                    {/* Amount */}
                    <div className="quote-response-quote-amount">
                      {quote.toToken ? formatAmount(quote.toAmount, quote.toToken.decimals, quote.toToken.priceUSD) : 'N/A'}
                    </div>

                    {/* Additional Fee */}
                    {feeInUSD && (
                      <div
                        className="quote-response-additional-fee"
                        data-tooltip={`Provider Fee: ${additionalFee!.toFixed(15)} ${feeToken!.symbol}\nFee in USD: $${feeInUSD}`}
                      >
                        Fee: ${feeInUSD}
                      </div>
                    )}
                  </div>

                  {/* Bottom Content */}
                  <div className="quote-response-bottom-content">
                    <div className="quote-response-quote-tool">
                      {dappsData[quote.tool] ? dappsData[quote.tool].name : quote.tool}
                    </div>
                    <div className="quote-response-price-usd">
                      ${netValueInUSD.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Message when no quotes are available */}
        {fetchAttempted && streamEnded && quotes.length === 0 && (
          <div className="quote-response-no-quotes">
            No quotes available. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteResponse;
