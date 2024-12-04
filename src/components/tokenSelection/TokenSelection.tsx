// TokenSelection.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import TokenPopup from '../tokenPopup/TokenPopup';
import Settings from '../other/Settings';
import { formatQuote } from './QuoteFormater';
import './TokenSelection.css';
import { useTokenInfoAndBalance } from '../../utils/tokens/fetchTokenInfo';
import QuoteResponse from '../quoteDisplay/QuoteResponse';
import { useActiveAccount } from 'thirdweb/react';
import { Token } from '../../types';

interface Chain {
  id: string;
  name: string;
  logoURI: string;
}

type TokenSelectionProps = {
  onFindBestRoute: (quoteRequest: any) => void;
  streamActive: boolean;
  setStreamActive: (active: boolean) => void;
  quoteParams: any;
  onBestQuoteUpdate: (quote: any) => void;
  bestQuote: any;
  handleSwapClick: () => void;
  isToggleOn: boolean;
  onToggleChange: (newToggleState: boolean) => void;
};

const TokenSelection: React.FC<TokenSelectionProps> = ({
  onFindBestRoute,
  streamActive,
  setStreamActive,
  quoteParams,
  onBestQuoteUpdate,
  bestQuote,
  handleSwapClick,
  isToggleOn,
  onToggleChange,
}) => {
  const navigate = useNavigate();
  const account = useActiveAccount();

  // State Variables
  const [isFromPopupOpen, setIsFromPopupOpen] = useState(false);
  const [isToPopupOpen, setIsToPopupOpen] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedFromToken, setSelectedFromToken] = useState<Token | null>(null);
  const [selectedFromChain, setSelectedFromChain] = useState<Chain | null>(null);
  const [fetchedBalance, setFetchedBalance] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null);
  const [selectedToChain, setSelectedToChain] = useState<Chain | null>(null);
  const [amount, setAmount] = useState('');
  const [amountInSmallestUnit, setAmountInSmallestUnit] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [slippage, setSlippage] = useState('');
  const [dApps, setDApps] = useState<any[]>([]);
  const [hasMovedToOriginalPosition, setHasMovedToOriginalPosition] = useState(false);
  const memoizedQuoteParams = useMemo(() => quoteParams, [quoteParams]);

  // Refs for Popups and Timers
  const settingsRef = useRef<HTMLDivElement>(null);
  const fromPopupRef = useRef<HTMLDivElement>(null);
  const toPopupRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<string>(amount); 
  const amountIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = () => {
    onToggleChange(!isToggleOn);
  };

  useEffect(() => {
    console.log("Toggle state updated:", isToggleOn);
  }, [isToggleOn]);

  const { getTokenInfoAndBalance } = useTokenInfoAndBalance();

  const findBestRoute = useCallback(
    async (currentAmount: string) => {
      if (selectedFromToken && selectedToToken && selectedFromChain && selectedToChain) {
        onBestQuoteUpdate(null); // Reset bestQuote when starting a new fetch
        setStreamActive(true);
        const latestQuote = await formatQuote(
          { ...selectedFromToken, chainId: selectedFromChain.id },
          { ...selectedToToken, chainId: selectedToChain.id },
          currentAmount,
          receiverAddress,
          slippage,
          dApps,
          account
        );
        if (latestQuote) {
          onFindBestRoute(JSON.parse(latestQuote));
        } else {
          setStreamActive(false);
        }
      }
    },
    [
      selectedFromToken,
      selectedToToken,
      selectedFromChain,
      selectedToChain,
      receiverAddress,
      slippage,
      dApps,
      account,
      setStreamActive,
      onFindBestRoute,
      onBestQuoteUpdate,
    ]
  );
  useEffect(() => {
    console.log('bestQuote prop in TokenSelection changed:', bestQuote);
  }, [bestQuote]);
  
  // Update amountRef whenever amount changes
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  const findBestRouteRef = useRef(findBestRoute);

  // Update the ref whenever findBestRoute changes
  useEffect(() => {
    findBestRouteRef.current = findBestRoute;
  }, [findBestRoute]);

  // Function to clear all idle timers
  const clearIdleTimers = useCallback(() => {
    if (amountIdleTimerRef.current) {
      clearTimeout(amountIdleTimerRef.current);
      amountIdleTimerRef.current = null;
    }
    if (tokenIdleTimerRef.current) {
      clearTimeout(tokenIdleTimerRef.current);
      tokenIdleTimerRef.current = null;
    }
  }, []);

  // Function to set idle timer after amount input (1 second)
  const setAmountIdle = useCallback(() => {
    if (amountIdleTimerRef.current) clearTimeout(amountIdleTimerRef.current);
    amountIdleTimerRef.current = setTimeout(() => {
      // Use the latest findBestRoute from ref
      findBestRouteRef.current(amountRef.current);
    }, 1000); // 1 second
  }, []);

  // Function to set idle timer after token selection (2 seconds)
  const setTokenIdle = useCallback(() => {
    if (tokenIdleTimerRef.current) clearTimeout(tokenIdleTimerRef.current);
    tokenIdleTimerRef.current = setTimeout(() => {
      // Use the latest findBestRoute from ref
      findBestRouteRef.current(amountRef.current);
    }, 2000); // 2 seconds
  }, []);

  // Effect to hide popups on initial mount
  useEffect(() => {
    if (fromPopupRef.current) fromPopupRef.current.style.display = 'none';
    if (toPopupRef.current) toPopupRef.current.style.display = 'none';
    if (settingsRef.current) {
      const images = settingsRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (img.dataset.src) new Image().src = img.dataset.src;
      });
    }
  }, []);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      clearIdleTimers();
    };
  }, [clearIdleTimers]);

  // Function to toggle Settings Visibility
  const toggleSettingsVisibility = useCallback(() => {
    // When opening settings, clear idle timers
    clearIdleTimers();
    setSettingsVisible(prev => !prev);
  }, [clearIdleTimers]);

  // Function to toggle Popups
  const togglePopup = useCallback(
    (
      popupRef: React.RefObject<HTMLDivElement>,
      isOpen: boolean,
      setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      if (!isOpen) {
        // When opening popups, clear idle timers
        clearIdleTimers();
      }
      setIsOpen(prev => !prev);
      if (popupRef.current) popupRef.current.style.display = isOpen ? 'none' : 'block';
    },
    [clearIdleTimers]
  );

  // Function to handle Settings Update
  const handleSettingsUpdate = useCallback(
    ({
      receiverAddress: newReceiverAddress,
      slippage: newSlippage,
      dApps: newDApps,
    }: {
      receiverAddress: string;
      slippage: string;
      dApps: any[];
    }) => {
      // Only update if there's an actual change to prevent unnecessary re-renders
      setReceiverAddress(prev => (prev !== newReceiverAddress ? newReceiverAddress : prev));
      setSlippage(prev => (prev !== newSlippage ? newSlippage : prev));
      setDApps(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newDApps)) {
          return newDApps;
        }
        return prev;
      });
    },
    []
  );

  // Function to update URL with query parameters
  const updateURL = useCallback(
    (
      fromChainId: string,
      fromTokenAddress: string,
      toChainId: string,
      toTokenAddress: string
    ) => {
      navigate(
        `?fromChain=${fromChainId}&fromToken=${fromTokenAddress}&toChain=${toChainId}&toToken=${toTokenAddress}`
      );
    },
    [navigate]
  );

  // Function to check if two tokens are the same
  const isSameToken = useCallback(
    (
      token1: Token | null,
      chain1: Chain | null,
      token2: Token | null,
      chain2: Chain | null
    ) =>
      token1 &&
      chain1 &&
      token2 &&
      chain2 &&
      token1.address.toLowerCase() === token2.address.toLowerCase() &&
      chain1.id === chain2.id,
    []
  );

  // Function to fetch token balance
  const fetchBalance = useCallback(
    async (chain: Chain, tokenAddress: string) => {
      setBalanceLoading(true);
      const tokenInfo = await getTokenInfoAndBalance(chain, tokenAddress);
      if (tokenInfo) {
        setSelectedFromToken(prevToken => ({
          ...(prevToken || {}),
          ...tokenInfo,
          address: tokenAddress,
        }) as Token);
        setFetchedBalance(tokenInfo.balanceReadable);
      } else {
        setFetchedBalance('');
      }
      setBalanceLoading(false);
    },
    [getTokenInfoAndBalance]
  );

  /**
   * Handle "From" Token Selection
   */
  const handleSelectFromToken = useCallback(
    async (token: Token, chain: Chain) => {
      if (selectedToToken && selectedToChain && isSameToken(token, chain, selectedToToken, selectedToChain)) {
        if (selectedFromToken && selectedFromChain) {
          // Swap "From" and "To" tokens
          const previousFromToken = selectedFromToken;
          const previousFromChain = selectedFromChain;
          setSelectedFromToken(token);
          setSelectedFromChain(chain);
          setSelectedToToken(previousFromToken);
          setSelectedToChain(previousFromChain);
        } else {
          // Only set "From" and clear "To"
          setSelectedFromToken(token);
          setSelectedFromChain(chain);
          setSelectedToToken(null);
          setSelectedToChain(null);
        }
        setTokenIdle();
        return;
      }

      if (selectedFromToken && isSameToken(token, chain, selectedFromToken, selectedFromChain)) {
        // User selected the same token in "From" again, clear it
        setSelectedFromToken(null);
        setSelectedFromChain(null);
        setFetchedBalance('');
        updateURL('', '', selectedToChain?.id || '', selectedToToken?.address || '');
        clearIdleTimers();
        return;
      }

      // Otherwise, set "From" to new token
      setSelectedFromToken(token);
      setSelectedFromChain(chain);
      setFetchedBalance('');
      setBalanceLoading(true);
      updateURL(chain.id, token.address, selectedToChain?.id || '', selectedToToken?.address || '');
      await fetchBalance(chain, token.address);
      // Start idle timer
      setTokenIdle();
    },
    [
      isSameToken,
      selectedToToken,
      selectedToChain,
      selectedFromToken,
      selectedFromChain,
      updateURL,
      fetchBalance,
      setTokenIdle,
      clearIdleTimers,
    ]
  );

  /**
   * Handle "To" Token Selection
   */
  const handleSelectToToken = useCallback(
    async (token: Token, chain: Chain) => {
      if (selectedFromToken && selectedFromChain && isSameToken(token, chain, selectedFromToken, selectedFromChain)) {
        if (selectedToToken && selectedToChain) {
          // Swap "To" and "From" tokens
          const previousToToken = selectedToToken;
          const previousToChain = selectedToChain;
          setSelectedToToken(token);
          setSelectedToChain(chain);
          setSelectedFromToken(previousToToken);
          setSelectedFromChain(previousToChain);
        } else {
          // Only set "To" and clear "From"
          setSelectedToToken(token);
          setSelectedToChain(chain);
          setSelectedFromToken(null);
          setSelectedFromChain(null);
        }
        setTokenIdle();
        return;
      }

      if (selectedToToken && isSameToken(token, chain, selectedToToken, selectedToChain)) {
        // User selected the same token in "To" again, clear it
        setSelectedToToken(null);
        setSelectedToChain(null);
        updateURL(selectedFromChain?.id || '', selectedFromToken?.address || '', '', '');
        clearIdleTimers();
        return;
      }

      // Otherwise, set "To" to new token
      setSelectedToToken(token);
      setSelectedToChain(chain);
      updateURL(
        selectedFromChain?.id || '',
        selectedFromToken?.address || '',
        chain.id,
        token.address
      );
      // Start idle timer
      setTokenIdle();
    },
    [
      isSameToken,
      selectedFromToken,
      selectedFromChain,
      selectedToToken,
      selectedToChain,
      updateURL,
      setTokenIdle,
      clearIdleTimers,
    ]
  );

  /**
   * Handle Amount Input Change
   */
  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (/^\d*\.?\d*$/.test(value)) {
        setAmount(value);
        amountRef.current = value; // Update ref synchronously
        if (selectedFromToken && selectedFromToken.decimals) {
          try {
            const amountInSmallestUnit = ethers.utils.parseUnits(value || '0', selectedFromToken.decimals);
            setAmountInSmallestUnit(amountInSmallestUnit.toString());
          } catch (error) {
            setAmountInSmallestUnit('');
          }
        }
        // Clear existing amount idle timer and set a new one
        setAmountIdle();
      }
    },
    [selectedFromToken, setAmountIdle]
  );

  /**
   * Set Maximum Amount
   */
  const setMaxAmount = useCallback(() => {
    setAmount(fetchedBalance);
    amountRef.current = fetchedBalance; // Update ref synchronously
    if (selectedFromToken && selectedFromToken.decimals) {
      try {
        const amountInSmallestUnit = ethers.utils.parseUnits(fetchedBalance, selectedFromToken.decimals);
        setAmountInSmallestUnit(amountInSmallestUnit.toString());
      } catch (error) {
        setAmountInSmallestUnit('');
      }
    }
    if (parseFloat(fetchedBalance) > 0) {
      findBestRoute(fetchedBalance);
    }
  }, [fetchedBalance, selectedFromToken, findBestRoute]);

  /**
   * Get Decimal Places for Formatting
   */
  const getDecimalPlaces = useCallback((tokenPrice: number) => {
    return Math.floor(tokenPrice).toString().length + 2;
  }, []);

  /**
   * Format Balance
   */
  const formatBalance = useCallback((balance: string, tokenPrice: number) => {
    const decimalPlaces = getDecimalPlaces(tokenPrice);
    const balanceNum = parseFloat(balance);
    return balanceNum.toFixed(decimalPlaces).replace(/\.?0+$/, '');
  }, [getDecimalPlaces]);

  /**
   * Format Balance Display
   */
  const formatBalanceDisplay = useCallback((balance: string, tokenPrice: number) => {
    const formattedBalance = formatBalance(balance, tokenPrice);
    return formattedBalance.length > 10 ? formattedBalance.substring(0, 10) + '...' : formattedBalance;
  }, [formatBalance]);

  /**
   * Format USD Value
   */
  const formatUSDValue = useCallback((value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }), []);

  /**
   * Handle Best Quote Update
   */
  const handleBestQuoteUpdate = useCallback(
    (quote: any) => {
      onBestQuoteUpdate(quote);
      setStreamActive(false);
      // Do NOT open TransactionContainer automatically
    },
    [onBestQuoteUpdate, setStreamActive]
  );

  /**
   * Handle Quote Click (User selects a quote)
   */
  const handleQuoteClick = useCallback(
    (quote: any) => {
      onBestQuoteUpdate(quote);
      setStreamActive(false);
      handleSwapClick(); // Open TransactionContainer
    },
    [onBestQuoteUpdate, setStreamActive, handleSwapClick]
  );

  /**
   * Handle "Find Best Route" Button Click
   */
  const handleFindBestRouteClick = useCallback(() => {
    if (amount) {
      onBestQuoteUpdate(null); // Reset bestQuote when fetching again
      findBestRoute(amount);
      setHasMovedToOriginalPosition(true);
    }
  }, [amount, findBestRoute, onBestQuoteUpdate]);

  /**
   * Handle "Swap" Button Click
   */
  const handleSwapClickInternal = useCallback(() => {
    if (bestQuote) {
      handleSwapClick(); // Call the prop function
    }
  }, [bestQuote, handleSwapClick]);

  /**
   * Validate URL
   */
  const isValidUrl = useCallback((string: string) => {
    try {
      new URL(string);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  /**
   * Switch Tokens Function
   */
  const switchTokens = useCallback(async () => {
    // When switching tokens, clear idle timers
    clearIdleTimers();
    const newFromToken = selectedToToken;
    const newFromChain = selectedToChain;
    const newToToken = selectedFromToken;
    const newToChain = selectedFromChain;
    setSelectedFromToken(newFromToken);
    setSelectedFromChain(newFromChain);
    setSelectedToToken(newToToken);
    setSelectedToChain(newToChain);
    updateURL(
      newFromChain?.id || '',
      newFromToken?.address || '',
      newToChain?.id || '',
      newToToken?.address || ''
    );
    if (newFromChain && newFromToken) {
      await fetchBalance(newFromChain, newFromToken.address);
      // Start idle timer for token change
      setTokenIdle();
    }
  }, [
    selectedToToken,
    selectedToChain,
    selectedFromToken,
    selectedFromChain,
    updateURL,
    fetchBalance,
    clearIdleTimers,
    setTokenIdle,
  ]);

  /**
   * Function to Render Selected Token
   */
  const renderSelectedToken = useCallback(
    (token: Token, chain: Chain) => (
      <div className="token-selection-selected-info">
        <div className="token-selection-token-image">
          {token.logoURI && isValidUrl(token.logoURI) ? (
            <img src={token.logoURI} alt={token.symbol} />
          ) : (
            <div
              style={{
                backgroundColor: '#ccc',
                color: '#fff',
                borderRadius: '50%',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {token.symbol.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="token-selection-token-details">
          <div className="token-selection-token-symbol">{token.symbol}</div>
          <div className="token-selection-chain-name">{chain.name}</div>
        </div>
        <div className="token-selection-selected-chain">
          <img src={chain.logoURI} alt={chain.name} />
        </div>
      </div>
    ),
    [isValidUrl]
  );

  /**
   * Compute Token Value in USD
   */
  const getTokenValueInUSD = useMemo(() => {
    if (
      !selectedFromToken ||
      !selectedFromToken.priceUSD ||
      !amount ||
      isNaN(parseFloat(amount))
    )
      return null;
    const tokenPrice = parseFloat(selectedFromToken.priceUSD);
    const tokenAmount = parseFloat(amount);
    const valueInUSD = tokenPrice * tokenAmount;
    return formatUSDValue(valueInUSD);
  }, [selectedFromToken, amount, formatUSDValue]);

  /**
   * Effect to adjust container position based on stream activity
   */
  useEffect(() => {
    if (streamActive) setHasMovedToOriginalPosition(true);
  }, [streamActive]);

  /**
   * Container Styling
   */
  const containerStyle = {
    position: 'absolute' as const,
    left: hasMovedToOriginalPosition ? 'calc(50% - 350px)' : 'calc(50% - 179px)',
    top: '390px',
    transform: 'translateY(-50%)',
    transition: 'left 0.3s ease-in-out',
  };

  /**
   * Refetch Balance Handler
   */
  const handleRefetchBalance = useCallback(() => {
    if (selectedFromChain && selectedFromToken) {
      fetchBalance(selectedFromChain, selectedFromToken.address);
    }
  }, [selectedFromChain, selectedFromToken, fetchBalance]);

  return (
    <div className="token-selection-main-container" style={containerStyle}>
      <div className="token-selection-toggle-container">
        <img
          src="/images/rocket.png"
          alt="Rocket"
          className={`token-selection-rocket-icon ${isToggleOn ? 'active' : ''}`}
          title="Speed up"
        />
        <div
          className={`token-selection-toggle ${isToggleOn ? 'active' : ''}`}
          onClick={handleToggle}
        >
          <div className="token-selection-toggle-slider" />
        </div>
        <div className="token-selection-tooltip-container">
    <div className="token-selection-question-mark">?</div>
    <div className="token-selection-tooltip">
      By enabling this, the whole transaction process will be initiated immediately.
      You will be prompted to change network, increase allowance, and send transaction
      without needing to click buttons below.
    </div>
  </div>
      </div>
      <button
        className="token-selection-refetch-button"
        onClick={() => {
          onBestQuoteUpdate(null); // Reset bestQuote
          if (amount) {
            findBestRoute(amount);
          }
        }}
        title="Refetch Quote"
        aria-label="Refetch Quote"
      >
      </button>
      <div className="token-selection-settings-icon" onClick={toggleSettingsVisibility} >
        
      </div>
      <div
        ref={settingsRef}
        style={{
          display: settingsVisible ? 'block' : 'none',
          position: 'absolute',
          top: '100%',
          right: 0,
          zIndex: 1000,
        }}
      >
        <Settings
          isOpen={true}
          onClose={toggleSettingsVisibility}
          onUpdate={handleSettingsUpdate}
        />
      </div>
      <div
        className="token-selection-horizontal-container"
        onClick={() => togglePopup(fromPopupRef, isFromPopupOpen, setIsFromPopupOpen)}
      >
        <div className="token-selection-label">From:</div>
        <div className="token-selection-selector">
          {selectedFromToken && selectedFromChain ? (
            renderSelectedToken(selectedFromToken, selectedFromChain)
          ) : (
            'Select Token and Chain'
          )}
        </div>
      </div>
      <div className="token-switch-button" onClick={switchTokens}>
        {/* Switch icon */}
      </div>
      <div
        className="token-selection-horizontal-container"
        onClick={() => togglePopup(toPopupRef, isToPopupOpen, setIsToPopupOpen)}
      >
        <div className="token-selection-label">To:</div>
        <div className="token-selection-selector">
          {selectedToToken && selectedToChain ? (
            renderSelectedToken(selectedToToken, selectedToChain)
          ) : (
            'Select Token and Chain'
          )}
        </div>
      </div>
      <div className="token-selection-horizontal-container">
        <div className="token-selection-label">Amount:</div>
        <div className="token-selection-balance-display">
          {fetchedBalance && !balanceLoading && (
            <span>{formatBalanceDisplay(fetchedBalance, parseFloat(selectedFromToken?.priceUSD || '0'))}</span>
          )}
          {selectedFromToken && (
            <button onClick={setMaxAmount}>max</button>
          )}
          {balanceLoading ? (
            <div className="loading-spinner" />
          ) : (
            fetchedBalance && (
              <button className="refetch-button" onClick={handleRefetchBalance} title="Refetch Balance" aria-label="Refetch Balance">
                  <svg viewBox="0 0 24 24">
                      <path d="M17.65 6.35A7.958 7.958 0 0012 4V1L7 6l5 5V7c2.21 0 4.16.9 5.65 2.35l1.4-1.4zM6.35 17.65A7.958 7.958 0 0012 20v3l5-5-5-5v3c-2.21 0-4.16-.9-5.65-2.35l-1.4 1.4z"/>
                  </svg>
              </button>
            )
          )}
        </div>
        <input
          type="text"
          className="token-selection-amount-input"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount"
        />
        <div className="token-selection-usd-value">
          {getTokenValueInUSD !== null ? getTokenValueInUSD : ''}
        </div>
      </div>
      <button
  className="token-selection-find-route-button"
  onClick={() => {
    if (streamActive) {
      // Optionally disable the button or show a message
    } else if (bestQuote) {
      handleSwapClickInternal(); // Proceed to transaction
    } else if (amount) {
      onBestQuoteUpdate(null); // Reset bestQuote
      findBestRoute(amount);   // Fetch new quotes
      setHasMovedToOriginalPosition(true);
    }
  }}
>
  {streamActive ? 'Searching best route' : bestQuote ? 'Swap' : 'Find best route'}
</button>
      <QuoteResponse
        streamActive={streamActive}
        params={memoizedQuoteParams}
        setStreamActive={setStreamActive}
        onBestQuoteUpdate={handleBestQuoteUpdate}
        onQuoteClick={handleQuoteClick}
      />
      <div ref={fromPopupRef}>
        <TokenPopup
          onClose={() => togglePopup(fromPopupRef, isFromPopupOpen, setIsFromPopupOpen)}
          onSelectToken={(token: Token, chain: Chain) => handleSelectFromToken(token, chain)}
        />
      </div>
      <div ref={toPopupRef}>
        <TokenPopup
          onClose={() => togglePopup(toPopupRef, isToPopupOpen, setIsToPopupOpen)}
          onSelectToken={(token: Token, chain: Chain) => handleSelectToToken(token, chain)}
        />
      </div>
    </div>
  );
};

export default TokenSelection;
