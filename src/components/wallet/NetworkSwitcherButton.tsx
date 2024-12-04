import React, { useState } from 'react';
import { useNetworkSwitcher } from '../../hooks/useNetworkSwitcher';
import { useStore } from '../../store/useStore';
import './NetworkSwitcherButton.css'; // For styling the dropdown list

export const NetworkSwitcherButton: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { switchNetwork, networkSwitchStatus } = useNetworkSwitcher();
  const { networks } = useStore();

  const handleNetworkChange = (chainId: number) => {
    switchNetwork(chainId);
    setDropdownOpen(false);
  };

  return (
    <div className="network-switcher-container">
      <button
        className="network-switcher-button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        Change Network
      </button>

      {dropdownOpen && (
        <ul className="network-list">
          {Object.values(networks).map((network) => (
            <li key={network.id} onClick={() => handleNetworkChange(network.id)}>
              <img src={network.logoURI} alt={network.name} className="network-logo" />
              {network.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
