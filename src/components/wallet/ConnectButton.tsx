import React from 'react';
import { ConnectButton } from 'thirdweb/react';
import { createWallet, walletConnect } from 'thirdweb/wallets';
import { useThirdwebClient } from '../../contexts/ThirdwebClientProvider';
import { WalletInfo } from './WalletInfo';
import { defineChain } from "thirdweb";

const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  walletConnect(),
  createWallet('com.trustwallet.app'),
  createWallet('app.phantom'),
];

const polygon = defineChain({
  id: 137,
});

export const CustomConnectButton: React.FC = () => {
  const client = useThirdwebClient();

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
      <ConnectButton
        client={client}
        wallets={wallets}
        theme="dark"
        connectButton={{ label: 'Connect Wallet' }}
        connectModal={{
          size: 'compact',
          title: 'Select Wallet',
          titleIcon: '',
          showThirdwebBranding: false,
        }}
        chains={[polygon]}
      />
      <WalletInfo />
    </div>
  );
};
