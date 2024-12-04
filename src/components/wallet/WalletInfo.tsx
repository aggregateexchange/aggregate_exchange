//src/components/wallet/WalletInfo.tsx
import { useEffect } from 'react';
import { 
  useActiveWallet, 
  useActiveWalletChain, 
  useActiveAccount,
  useActiveWalletConnectionStatus
} from 'thirdweb/react';

export const WalletInfo: React.FC = () => {
  const wallet = useActiveWallet();
  const chain = useActiveWalletChain();
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();

  useEffect(() => {
    if (wallet && chain && account) {
      console.log('Wallet Information:');
      console.log('Wallet ID:', wallet.id);
      console.log(`(${chain.id})`);
      console.log('Account Address:', account.address);
      console.log('Connection Status:', connectionStatus);
    } else {
      console.log('Connection Status:', connectionStatus);
      console.log('No wallet connected');
    }
  }, [wallet, chain, account, connectionStatus]);

  return null; // No need to render anything
};
