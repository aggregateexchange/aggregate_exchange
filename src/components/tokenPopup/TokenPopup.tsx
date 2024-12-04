import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Web3 from 'web3';
import { Copy, ExternalLink } from 'lucide-react';
import ChainPopup from './ChainPopup';
import { useStore } from '../../store/useStore';
import { useActiveWalletChain } from 'thirdweb/react';
import { useTokenInfoAndBalance } from '../../utils/tokens/fetchTokenInfo';
import searchTokens from '../../utils/tokens/searchTokens';
import './TokenPopup.css';

type TokenPopupProps = {
  onClose: () => void;
  onSelectToken: (token: any, chain: any) => void;
};

const TokenPopup: React.FC<TokenPopupProps> = ({ onClose, onSelectToken }) => {
  const { networks, tokens, loadingNetworks, loadingBalances } = useStore(state => ({
    networks: state.networks,
    tokens: state.tokens,
    loadingNetworks: state.loadingNetworks,
    loadingBalances: state.loadingBalances,
  }));
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [displayedTokens, setDisplayedTokens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChainPopup, setShowChainPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mainContainerChains, setMainContainerChains] = useState<any[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  const { getTokenInfoAndBalance } = useTokenInfoAndBalance();
  const chain = useActiveWalletChain();

  const blockExplorerUrls = useMemo(() => {
    const urls: { [chainId: number]: string } = {};
    Object.values(networks).forEach((network: any) => {
      if (network.metamask && network.metamask.blockExplorerUrls && network.metamask.blockExplorerUrls.length > 0) {
        urls[network.id] = network.metamask.blockExplorerUrls[0];
      }
    });
    return urls;
  }, [networks]);

  const getTokenExternalLink = useCallback((token: any) => {
    const explorerUrl = blockExplorerUrls[token.chainId];
    if (explorerUrl) {
      return `${explorerUrl}address/${token.address}`;
    }
    return '';
  }, [blockExplorerUrls]);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (!loadingNetworks) {
      const chainId = chain?.id;
      if (chainId !== undefined) {
        handleSelectChain(chainId.toString());
      } else {
        handleSelectChain('1'); // Default to chain ID 1
      }
    }
  }, [chain, loadingNetworks]);

  useEffect(() => {
    if (!loadingNetworks) {
      const initialChains = Object.values(networks).slice(0, 9);
      setMainContainerChains(initialChains);
    }
  }, [networks, loadingNetworks]);

  const updateDisplayedTokensWithExternalLinks = useCallback((tokens: any[]) => {
    return tokens.map(token => ({
      ...token,
      externalLink: getTokenExternalLink(token),
    }));
  }, [getTokenExternalLink]);

  useEffect(() => {
    if (!selectedChain) return;

    const updatedTokens = tokens[selectedChain.id] ?? [];
    updatedTokens.sort((a: any, b: any) => {
      if (a.address === '0x0000000000000000000000000000000000000000') return -1;
      if (b.address === '0x0000000000000000000000000000000000000000') return 1;
      return (parseFloat(b.balance || '0') - parseFloat(a.balance || '0'));
    });

    if (searchTerm) {
      const filteredTokens = searchTokens(selectedChain.id, searchTerm);
      setDisplayedTokens(updateDisplayedTokensWithExternalLinks(filteredTokens.slice(0, 20)));
    } else {
      setDisplayedTokens(updateDisplayedTokensWithExternalLinks(updatedTokens.slice(0, 20)));
    }
  }, [tokens, selectedChain, searchTerm, updateDisplayedTokensWithExternalLinks]);

  const handleSelectChain = (chainId: string) => {
    const numericChainId = parseInt(chainId, 10);
    if (isNaN(numericChainId)) {
      console.error("Conversion to numeric chainId failed:", chainId);
      return;
    }

    const chain = Object.values(networks).find((network: any) => network.id === numericChainId);
    if (!chain) {
      console.error("Failed to find the chain for ID:", numericChainId);
      return;
    }

    setSelectedChain(chain);
    const tokensData = tokens[chain.id] ? tokens[chain.id] : [];
    if (searchTerm) {
      const filteredTokens = searchTokens(chain.id, searchTerm);
      setDisplayedTokens(updateDisplayedTokensWithExternalLinks(filteredTokens.slice(0, 20)));
    } else {
      setDisplayedTokens(updateDisplayedTokensWithExternalLinks(tokensData.slice(0, 20)));
    }

    if (showChainPopup) {
      setMainContainerChains((prevChains: any) => {
        if (prevChains.some((c: any) => c.id === chain.id)) {
          return prevChains;
        } else {
          const newChains = [chain, ...prevChains.slice(1)];
          return newChains;
        }
      });
    }
  };

  const loadMoreTokens = useCallback(() => {
    if (loading || !selectedChain || !tokens[selectedChain.id] || searchTerm) return;
    setLoading(true);
    const nextTokens = tokens[selectedChain.id].slice(displayedTokens.length, displayedTokens.length + 20);
    setDisplayedTokens((prevTokens: any) => [...prevTokens, ...updateDisplayedTokensWithExternalLinks(nextTokens)]);
    setLoading(false);
  }, [loading, selectedChain, displayedTokens.length, tokens, searchTerm, updateDisplayedTokensWithExternalLinks]);

  const lastTokenElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && selectedChain && !searchTerm) {
        loadMoreTokens();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadMoreTokens, searchTerm, selectedChain]);

  const handleTokenClick = (token: any) => {
    if (!onSelectToken || !selectedChain) {
      console.error("No chain selected or onSelectToken callback is undefined");
      return;
    }
    onSelectToken(token, selectedChain);
    onClose();
  };

  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchTerm(value);
    if (!selectedChain) return;

    if (Web3.utils.isAddress(value) && !tokens[selectedChain.id]?.some((token: any) => token.address.toLowerCase() === value.toLowerCase())) {
      setLoading(true);
      const tokenInfo = await getTokenInfoAndBalance(selectedChain, value);
      setLoading(false);
      if (tokenInfo) {
        const formattedToken = {
          symbol: tokenInfo.tokenSymbol,
          address: value,
          balanceReadable: tokenInfo.balanceReadable,
          chainId: selectedChain.id,
        };
        setDisplayedTokens(updateDisplayedTokensWithExternalLinks([formattedToken]));
      } else {
        setDisplayedTokens([]);
      }
    } else {
      const filteredTokens = searchTokens(selectedChain.id, value);
      setDisplayedTokens(updateDisplayedTokensWithExternalLinks(filteredTokens.slice(0, 20)));
    }
  };

  const formatBalance = (balance: string, priceUSD: string) => {
    const nonDecimalCount = priceUSD.split('.')[0].length;
    const decimalPlaces = nonDecimalCount + 4;
    return parseFloat(balance).toFixed(decimalPlaces);
  };

  const formatValue = (balance: string, priceUSD: string) => {
    const value = parseFloat(balance) * parseFloat(priceUSD);
    return value.toFixed(2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const isChainLoading = (chainId: string) => {
    return loadingBalances[`${chainId}-chain`] || false;
  };

  if (loadingNetworks) {
    return <div>Loading networks...</div>;
  }

  return (
    <div className="from-token-popup-popup-overlay">
      <div className="from-token-popup-popup-container">
        <button className="from-token-popup-close-button" onClick={onClose}>×</button>
        <div className="from-token-popup-chain-images">
          {mainContainerChains.map((chain) => (
            <div
              key={chain.id}
              className={`from-token-popup-chain-image ${selectedChain && chain.id === selectedChain.id ? 'selected' : ''}`}
              onClick={() => handleSelectChain(chain.id.toString())}
            >
              <img src={chain.logoURI.startsWith('http') ? chain.logoURI : `${process.env.PUBLIC_URL}/${chain.logoURI}`} alt={chain.name} />
            </div>
          ))}
          {Object.values(networks).length - mainContainerChains.length > 0 && (
            <div className="from-token-popup-chain-image more-button" onClick={() => setShowChainPopup(true)}>
              +{Object.values(networks).length - mainContainerChains.length}
            </div>
          )}
        </div>
        <input
          type="text"
          className="from-token-popup-search-bar"
          placeholder="Search by token name or address"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="from-token-popup-token-list">
          {displayedTokens.map((token, index) => (
            <div
              key={`${token.symbol}-${token.address}`}
              ref={displayedTokens.length === index + 1 ? lastTokenElementRef : null}
              className="from-token-popup-token-item"
              onClick={() => handleTokenClick(token)}
            >
              <div className="from-token-popup-token-image">
                {token.logoURI ? (
                  <img src={token.logoURI.startsWith('http') ? token.logoURI : `${process.env.PUBLIC_URL}/${token.logoURI}`} alt={token.symbol} />
                ) : (
                  <div className="from-token-popup-token-placeholder">{token.symbol[0]}</div>
                )}
              </div>
              <div className="from-token-popup-token-info">
                <div className="from-token-popup-token-symbol">{token.symbol}</div>
                <div className="from-token-popup-token-detail">
                  <span className="from-token-popup-token-name">{token.name}</span>
                  <div className="from-token-popup-token-address-container">
                    <span className="from-token-popup-token-address">{shortenAddress(token.address)}</span>
                  </div>
                </div>
              </div>
              {isChainLoading(selectedChain.id.toString()) ? (
                <div className="loader"></div>
              ) : (
                <>
                  {token.balance && token.priceUSD && parseFloat(token.balance) > 0 && (
                    <>
                      <div className="from-token-popup-balance-readable">
                        {formatBalance(token.balance, token.priceUSD)}
                      </div>
                      <div className="from-token-popup-balance-value">
                        ${formatValue(token.balance, token.priceUSD)}
                      </div>
                    </>
                  )}
                </>
              )}
              <ExternalLink
                className="from-token-popup-external-icon"
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  openExternalLink(token.externalLink);
                }}
              />
              <Copy
                className="from-token-popup-copy-icon"
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(token.address);
                }}
              />
            </div>
          ))}
          {loading && <div className="from-token-popup-loading">Loading more tokens...</div>}
        </div>
      </div>
      {showChainPopup && (
      <ChainPopup 
        onClose={() => setShowChainPopup(false)} 
        onSelectChain={(chainId: string) => { 
          handleSelectChain(chainId); 
          setShowChainPopup(false); 
        }} 
        chains={Object.values(networks)} 
      />
    )}
    </div>
  );
};

export default TokenPopup;