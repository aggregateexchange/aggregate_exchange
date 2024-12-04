//src/contexts/ThirdwebClientProvider.tsx
import React, { createContext, useContext } from 'react';
import { createThirdwebClient, ThirdwebClient } from 'thirdweb';

const client = createThirdwebClient({
  clientId: '89cebe1c7b1c9cc8617c544d355ad6ac',
});

const ThirdwebClientContext = createContext<ThirdwebClient | null>(null);

export const useThirdwebClient = () => {
  const context = useContext(ThirdwebClientContext);
  if (!context) {
    throw new Error('useThirdwebClient must be used within a ThirdwebClientProvider');
  }
  return context;
};

interface ThirdwebClientProviderProps {
  children: React.ReactNode;
}

export const ThirdwebClientProvider: React.FC<ThirdwebClientProviderProps> = ({ children }) => {
  return (
    <ThirdwebClientContext.Provider value={client}>
      {children}
    </ThirdwebClientContext.Provider>
  );
};
