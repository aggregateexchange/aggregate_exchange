// src/utils/api/ProcessTokens.ts
import { fetchTokensData } from './api';
import { useStore } from '../../store/useStore';

export const loadAndProcessTokens = async () => {
    const rawData = await fetchTokensData();
    const tokenStore: { [chainId: string]: any[] } = {};
    if (rawData && rawData.tokens) {
        Object.entries(rawData.tokens).forEach(([chainId, tokens]: [string, any]) => {
            tokenStore[chainId] = tokens.map((token: any) => ({
                address: token.address,
                chainId: parseInt(chainId),
                symbol: token.symbol,
                decimals: token.decimals,
                name: token.name,
                logoURI: token.logoURI,
                priceUSD: token.priceUSD
            }));
        });
    }
    const { setTokens } = useStore.getState();
    setTokens(tokenStore);
    return tokenStore;
};
