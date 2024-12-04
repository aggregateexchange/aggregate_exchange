import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ChainPopup.css';

type ChainPopupProps = {
  onClose: any;
  onSelectChain: any;
  chains: any[];
};

const ChainPopup: React.FC<ChainPopupProps> = ({ onClose, onSelectChain, chains }) => {
  const [displayedChains, setDisplayedChains] = useState<any[]>(chains);
  const [searchTerm, setSearchTerm] = useState<any>('');
  const popupRef = useRef<any>(null);

  const filterChains = useCallback((term: any) => {
    return chains.filter((chain: any) =>
      chain.name.toLowerCase().includes(term.toLowerCase())
    );
  }, [chains]);

  const handleSearchChange = (event: any) => {
    const { value } = event.target;
    setSearchTerm(value);
    setDisplayedChains(filterChains(value)); // Update displayedChains based on the search term
  };

  const handleClickOutside = (event: any) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="chain-popup-popup-overlay" onClick={handleClickOutside}>
      <div className="chain-popup-popup-container" ref={popupRef} onClick={e => e.stopPropagation()}>
        <input
          type="text"
          className="chain-popup-search-bar"
          placeholder="Search by chain name"
          onChange={handleSearchChange}
          value={searchTerm}
          onClick={e => e.stopPropagation()}
        />
        <div className="chain-popup-chain-list">
          {displayedChains.map((chain: any) => (
            <div
              key={chain.name}
              className="chain-popup-chain-item"
              onClick={e => {
                e.stopPropagation();
                onSelectChain(chain.id.toString());
                onClose();
              }}
            >
              <img src={chain.logoURI} alt={chain.name} className="chain-popup-chain-image" />
              <div className="chain-popup-chain-info">
                <div className="chain-popup-chain-name">{chain.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChainPopup;
