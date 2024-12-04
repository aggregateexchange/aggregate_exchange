// src/utils/api/ProcessNetworks.ts
import { fetchChainsData } from './api';
import { useStore } from '../../store/useStore';
import { Network } from '../../types';

export const processNetworkData = async () => {
    const { setLoadingNetworks, setNetworks } = useStore.getState();
    setLoadingNetworks(true);

    const rawData = await fetchChainsData();
    if (!rawData) {
        setLoadingNetworks(false);
        return {};
    }

    const networkStore: { [key: string]: Network } = {};

    rawData.chains.forEach((network: any) => {
        if (!networkStore[network.key]) {
            networkStore[network.key] = {
                key: network.key,
                chainType: network.chainType,
                name: network.name,
                coin: network.coin,
                id: network.id,
                mainnet: network.mainnet,
                logoURI: network.logoURI,
                tokenlistUrl: network.tokenlistUrl,
                multicallAddress: network.multicallAddress,
                rpcUrls: network.metamask.rpcUrls,
                nativeTokenSymbol: network.nativeToken.symbol,
                nativeTokenLogoURI: network.nativeToken.logoURI,
                metamask: { ...network.metamask },
                nativeToken: { ...network.nativeToken }
            };

            if (network.faucetUrls) {
                networkStore[network.key].faucetUrls = network.faucetUrls;
            }
        }
    });

    console.log("Processed Network Data:", networkStore);
    setNetworks(networkStore);
    return networkStore;
};
