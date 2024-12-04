import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { fetchAllTokenBalances } from '../components/balance/fetchTokenBalance';
import { processNetworkData } from '../utils/api/ProcessNetworks';
import { fetchTokensData } from '../utils/api/api';
import { useStore } from '../store/useStore';
import useBalanceEffect from '../hooks/useBalanceEffect';
import useProcessDapps from '../utils/api/ProcessDapps';

interface TokenData {
  [chainId: string]: Array<{
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    name: string;
    coinKey: string;
    logoURI: string;
    priceUSD: string;
  }>;
}

interface Data {
  tokens: TokenData;
  nativeBalances: any;
  tokenBalances: any;
}

interface DataContextProps {
  data: Data | null;
  loading: boolean;
  error: any;
}

interface DataProviderProps {
  children: ReactNode;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [networkDataProcessed, setNetworkDataProcessed] = useState(false);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const { networks, setTokens } = useStore();
  const { loading: dappsLoading, error: dappsError } = useProcessDapps();

  // Process network data
  useEffect(() => {
    const processNetworks = async () => {
      if (!networkDataProcessed) {
        try {
          console.log('Processing network data...');
          await processNetworkData();
          setNetworkDataProcessed(true);
          console.log('Network data processed successfully');
        } catch (err) {
          console.error('Error processing network data:', err);
          setError(err);
        }
      }
    };

    processNetworks();
  }, [networkDataProcessed]);

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      if (networkDataProcessed && !tokensLoaded) {
        try {
          setLoading(true);
          console.log('Fetching tokens data...');
          const tokenData = await fetchTokensData();
          if (tokenData && tokenData.tokens) {
            setTokens(tokenData.tokens);
            setData({ tokens: tokenData.tokens, nativeBalances: [], tokenBalances: {} });
            setTokensLoaded(true);
            console.log('Tokens data fetched successfully');
          } else {
            throw new Error('Failed to fetch token data');
          }
        } catch (err) {
          console.error('Error fetching tokens data:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTokens();
  }, [networkDataProcessed, tokensLoaded, setTokens]);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (
        connectionStatus === 'connected' &&
        account?.address &&
        Object.keys(networks).length > 0 &&
        data?.tokens &&
        tokensLoaded
      ) {
        console.log('Fetching balances...');
        try {
          setLoading(true);
          await fetchAllTokenBalances(account.address, data.tokens);
          console.log('Balances fetched successfully');
        } catch (err) {
          console.error('Error fetching balances:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalances();
  }, [connectionStatus, account, networks, data?.tokens, tokensLoaded]);

  // Use the balance effect hook to trigger sorting
  useBalanceEffect();

  return (
    <DataContext.Provider value={{ data, loading: loading || dappsLoading, error: error || dappsError }}>
      {children}
    </DataContext.Provider>
  );
};
