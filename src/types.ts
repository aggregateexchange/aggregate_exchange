// src/types.ts
export interface Network {
    key: string;
    chainType: string;
    name: string;
    coin: string;
    id: number;
    mainnet: boolean;
    logoURI: string;
    tokenlistUrl: string;
    multicallAddress: string;
    rpcUrls: string[];
    nativeTokenSymbol: string;
    nativeTokenLogoURI: string;
    metamask: any;
    nativeToken: any;
    faucetUrls?: string[];
  }
  
  export interface Balance {
    chainId: number;
    address: string;
    balance: string;
  }
  
  export interface Token {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    name: string;
    coinKey: string;
    logoURI: string;
    priceUSD?: string;
    balance?: string;
  }

  export interface Dapp {
    name: string;
    bridge: boolean;
    supportedChains: string[];
    imageURI: string;
  }