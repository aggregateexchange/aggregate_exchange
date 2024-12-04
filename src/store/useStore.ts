// src/store/useStore.ts
import { create } from 'zustand';
import { Network, Balance, Token, Dapp } from '../types';

interface StoreState {
  networks: { [key: string]: Network };
  balances: Balance[];
  tokens: { [chainId: string]: Token[] };
  dapps: { [key: string]: Dapp };
  loadingNetworks: boolean;
  loadingBalances: { [key: string]: boolean }; // New state for loading balances
  setNetworks: (networks: { [key: string]: Network }) => void;
  setLoadingNetworks: (loading: boolean) => void;
  setBalances: (balances: Balance[] | ((prevBalances: Balance[]) => Balance[])) => void;
  setTokens: (tokens: { [chainId: string]: Token[] }) => void;
  setDapps: (dapps: { [key: string]: Dapp }) => void;
  setLoadingBalance: (chainId: string, key: string, isLoading: boolean) => void; // New function
}

export const useStore = create<StoreState>((set) => ({
  networks: {},
  balances: [],
  tokens: {},
  dapps: {},
  loadingNetworks: true,
  loadingBalances: {}, // Initialize the new state
  setNetworks: (networks) => set({ networks, loadingNetworks: false }),
  setLoadingNetworks: (loading) => set({ loadingNetworks: loading }),
  setBalances: (balances) =>
    set((state) => ({
      balances: typeof balances === 'function' ? balances(state.balances) : balances,
    })),
  setTokens: (tokens) => set({ tokens }),
  setDapps: (dapps) => set({ dapps }),
  setLoadingBalance: (chainId, key, isLoading) => // New function implementation
    set((state) => ({
      loadingBalances: {
        ...state.loadingBalances,
        [`${chainId}-${key}`]: isLoading,
      },
    })),
}));