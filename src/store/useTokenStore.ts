// src/store/useTokenStore.ts
import { create } from 'zustand';
import { Token } from '../types';

interface TokenStoreState {
  tokens: { [chainId: string]: Token[] };
  setTokens: (tokens: { [chainId: string]: Token[] }) => void;
  addToken: (chainId: number, token: Token) => void;
}

export const useTokenStore = create<TokenStoreState>((set) => ({
  tokens: {},
  setTokens: (tokens) => set({ tokens }),
  addToken: (chainId, token) =>
    set((state) => {
      const chainTokens = state.tokens[chainId] || [];
      const updatedChainTokens = [...chainTokens, token];
      return { tokens: { ...state.tokens, [chainId]: updatedChainTokens } };
    }),
}));
