// useNetworkSwitcher.tsx
import { useEffect, useCallback, useState } from 'react';
import { useSwitchActiveWalletChain, useActiveWalletChain } from 'thirdweb/react';
import { useStore } from '../store/useStore';

export const useNetworkSwitcher = () => {
  const { networks } = useStore();
  const switchChain = useSwitchActiveWalletChain();
  const activeWalletChain = useActiveWalletChain();
  const [desiredChainId, setDesiredChainId] = useState<number | null>(null);
  const [networkSwitchStatus, setNetworkSwitchStatus] = useState<string>('idle');
  const [switchPromise, setSwitchPromise] = useState<{
    resolve: () => void;
    reject: (error: any) => void;
  } | null>(null);

  const switchNetwork = useCallback(
    async (chainId: number) => {
      if (Object.keys(networks).length > 0) {
        const network = Object.values(networks).find((network) => network.id === chainId);
        if (network) {
          setDesiredChainId(chainId);
          setNetworkSwitchStatus('switching');

          return new Promise<void>(async (resolve, reject) => {
            setSwitchPromise({ resolve, reject });
            try {
              await switchChain({
                id: network.id,
                rpc: network.rpcUrls[0],
                nativeCurrency: network.nativeToken,
                blockExplorers: network.metamask.blockExplorerUrls.map((url: string) => ({
                  name: network.name,
                  url,
                })),
                name: network.name,
              });
            } catch (error: unknown) {
              if (typeof error === 'object' && error !== null && 'code' in error) {
                if ((error as { code: number }).code === 4001) {
                  console.error('User rejected the request.');
                  setNetworkSwitchStatus('rejected');
                } else {
                  console.error('An error occurred while switching the network:', error);
                  setNetworkSwitchStatus('failed');
                }
              } else {
                console.error('An unknown error occurred:', error);
                setNetworkSwitchStatus('failed');
              }
              setDesiredChainId(null);
              if (switchPromise) {
                switchPromise.reject(error);
                setSwitchPromise(null);
              }
            }
          });
        }
      }
    },
    [networks, switchChain]
  );

  useEffect(() => {
    if (desiredChainId !== null && activeWalletChain && activeWalletChain.id === desiredChainId) {
      console.log(`Switched to the correct network with chain ID: ${activeWalletChain.id}`);
      setNetworkSwitchStatus('success');
      setDesiredChainId(null);
      if (switchPromise) {
        switchPromise.resolve();
        setSwitchPromise(null);
      }
    }
  }, [activeWalletChain, desiredChainId, switchPromise]);

  return { switchNetwork, networkSwitchStatus };
};
