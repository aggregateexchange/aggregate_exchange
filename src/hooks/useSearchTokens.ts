// src/hooks/useSearchTokens.ts
import { useState, useEffect } from 'react';
import searchTokens from '../utils/tokens/searchTokens';
import { Token } from '../types';

const useSearchTokens = (chainId: number, query: string): Token[] => {
  const [results, setResults] = useState<Token[]>([]);

  useEffect(() => {
    if (query) {
      const searchResults = searchTokens(chainId, query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [chainId, query]);

  return results;
};

export default useSearchTokens;
