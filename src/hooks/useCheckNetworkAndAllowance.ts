// src/hooks/useCheckNetworkAndAllowance.tsx
import { useStore } from '../store/useStore';
import { useCallback } from 'react';
import { useActiveWalletChain, useActiveWalletConnectionStatus, useActiveAccount } from 'thirdweb/react';

export const useCheckNetworkAndAllowance = () => {
  const networks = useStore((state) => state.networks);
  const loadingNetworks = useStore((state) => state.loadingNetworks);
  const chain = useActiveWalletChain();
  const connectionStatus = useActiveWalletConnectionStatus();
  const account = useActiveAccount();

  const checkNetworkAndAllowance = useCallback(async (quote: any, dappsData: any): Promise<any> => {
    console.log('Connection Status:', connectionStatus);

    if (loadingNetworks) {
      console.log('Networks are still loading...');
      return { networkStatus: 'loading', fromNetwork: null, toNetwork: null, dapp: null };
    }

    if (quote) {
      console.log('Received quote:');
      printJSON(quote);

      const fromChainId = Number(quote.fromChainId);
      const toChainId = Number(quote.toChainId);

      const fromNetwork = Object.values(networks).find(network => network.id === fromChainId);
      const toNetwork = Object.values(networks).find(network => network.id === toChainId);

      console.log('fromNetwork:', fromNetwork);
      console.log('toNetwork:', toNetwork);

      const dapp = dappsData[quote.tool];
      console.log('dapp:', dapp);

      const isWalletConnected = ['connected', 'connecting'].includes(connectionStatus);
      const isFromAddressValid = account && account.address !== '0x1234C3AF916070b92C3857b818f6BA95Ee3297f6';

      if (!isWalletConnected || !chain || !isFromAddressValid) {
        console.log('Wallet is not connected, chain is undefined, or address is invalid!');
        return { networkStatus: 'wallet_not_connected', fromNetwork, toNetwork, dapp };
      }

      if (chain.id !== fromChainId) {
        console.log(`Current chain ID (${chain.id}) does not match quote's fromChainId (${fromChainId}). Waiting for network switch.`);
        return { networkStatus: 'wrong_network', fromNetwork, toNetwork, dapp };
      } else {
        console.log('Network is correct.');
        return { networkStatus: 'correct_network', fromNetwork, toNetwork, dapp };
      }
    } else {
      return { networkStatus: 'idle', fromNetwork: null, toNetwork: null, dapp: null };
    }
  }, [loadingNetworks, networks, connectionStatus, chain, account]);

  return { checkNetworkAndAllowance };
};

function printJSON(jsonData: any): void {
  const replacer = (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value;
  const jsonStr = JSON.stringify(jsonData, replacer, 2);
  const formattedStr = (jsonStr || '').replace(/\\n/g, '\n');
  console.log(formattedStr);
}
