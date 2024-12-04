import { useNetworkSwitcher } from '../hooks/useNetworkSwitcher';
import { useActiveWalletChain } from 'thirdweb/react';

export const useHandleNetworkSwitch = () => {
  const { switchNetwork } = useNetworkSwitcher();
  const chain = useActiveWalletChain();

  const handleNetworkSwitch = async (fromNetwork: any, quote: any): Promise<string> => {
    if (fromNetwork) {
      await switchNetwork(fromNetwork.id);
      if (!chain || chain.id !== quote.fromChainId) {
        return 'wrong_network';
      } else {
        return 'correct_network';
      }
    }
    return 'idle';
  };

  return { handleNetworkSwitch };
};