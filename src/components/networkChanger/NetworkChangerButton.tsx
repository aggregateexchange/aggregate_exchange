import React, { useState, useEffect, useRef } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { useStore } from '../../store/useStore';
import { useHandleNetworkSwitch } from '../../hooks/useHandleNetworkSwitch';
import './NetworkChangerButton.css';

const NetworkChangerButton: React.FC = () => {
  // Move all hooks to the top level
  const chain = useActiveWalletChain();
  const { networks } = useStore();
  const { handleNetworkSwitch } = useHandleNetworkSwitch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the current network from the store using chain.id
  const currentNetwork = chain
    ? Object.values(networks).find((network) => network.id === chain.id)
    : null;

  const availableNetworks = Object.values(networks);

  // Filtered networks based on search query
  const filteredNetworks = availableNetworks.filter(network =>
    network.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    setError(null);
    setSearchQuery('');
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
    setSwitchingNetwork(null);
    setError(null);
    setSearchQuery('');
  };

  const handleNetworkClick = async (network: any) => {
    if (!chain) return;
    setSwitchingNetwork(network.name);
    setError(null);
    try {
      const status = await handleNetworkSwitch(network, { fromChainId: chain.id });
      if (status === 'success' || status === 'correct_network') {
        handleCloseDropdown();
      } else if (status === 'wrong_network') {
        setError('Failed to switch to the selected network.');
      }
    } catch (err) {
      setError('An error occurred while switching networks.');
      console.error(err);
    } finally {
      setSwitchingNetwork(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleCloseDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle Esc key to close dropdown
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isDropdownOpen]);

  // If wallet is not connected, return null
  if (!chain) {
    return null;
  }

  return (
    <div className="network-changer-container" ref={dropdownRef}>
      <button
        className="network-changer-button"
        onClick={handleToggleDropdown}
        title={currentNetwork ? `Current Network: ${currentNetwork.name}` : 'Switch Network'}
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        {currentNetwork ? (
          <>
            <img src={currentNetwork.logoURI} alt={currentNetwork.name} className="network-logo" />
            <span className="network-name">{currentNetwork.name}</span>
          </>
        ) : (
          <span className="network-name">Unsupported network</span>
        )}
      </button>

      {isDropdownOpen && (
        <div className={`network-dropdown ${isDropdownOpen ? 'open' : ''}`} role="menu">
          <input
            type="text"
            className="network-search-input"
            placeholder="Search networks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search networks"
          />
          {filteredNetworks.length > 0 ? (
            filteredNetworks.map((network) => (
              <button
                key={network.id}
                className={`network-item ${network.id === chain.id ? 'active' : ''}`}
                onClick={() => handleNetworkClick(network)}
                disabled={switchingNetwork === network.name}
                role="menuitem"
              >
                <img src={network.logoURI} alt={network.name} className="network-logo" />
                <span className="network-name">{network.name}</span>
                {switchingNetwork === network.name && <span className="loading-spinner">⏳</span>}
              </button>
            ))
          ) : (
            <div className="error-message">No networks found.</div>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default NetworkChangerButton;