//src/utils/tokens/searchTokens.ts
import Fuse, { IFuseOptions, FuseResult, FuseOptionKey } from 'fuse.js';
import { Token } from '../../types';
import { useStore } from '../../store/useStore';

let fuseMap: { [chainId: number]: Fuse<Token> } = {};

const buildFuse = (chainId: number, tokens: Token[]) => {
  const options: IFuseOptions<Token> = {
    keys: ['symbol', 'address', 'name'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
  };

  const keys = options.keys as FuseOptionKey<Token>[]; // Ensure keys are defined and not undefined
  const index = Fuse.createIndex(keys, tokens);
  fuseMap[chainId] = new Fuse(tokens, options, index);
};

const initializeFuse = (chainId: number) => {
  const { tokens } = useStore.getState();
  const chainTokens = tokens[chainId] || [];
  buildFuse(chainId, chainTokens);
};

const searchTokens = (chainId: number, query: string): Token[] => {
  // Always initialize or reinitialize the Fuse index with the latest tokens
  initializeFuse(chainId);

  if (!query) {
    // If no query is provided, return all tokens for the given chainId
    const { tokens } = useStore.getState();
    return tokens[chainId] || [];
  }

  // Normalize query for comparison
  const normalizedQuery = query.toLowerCase();

  // Perform separate searches for 'symbol', 'name', and 'address'
  const symbolResults = fuseMap[chainId].search({ $or: [{ symbol: normalizedQuery }] });
  const nameResults = fuseMap[chainId].search({ $or: [{ name: normalizedQuery }] });
  const addressResults = fuseMap[chainId].search({ $or: [{ address: normalizedQuery }] });

  // Function to remove duplicates
  const removeDuplicates = (arr: FuseResult<Token>[]) => {
    const seen = new Set();
    return arr.filter(result => {
      const key = result.item.address; // Use address as the unique key
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Combine and remove duplicates while preserving order
  const combinedResults = [
    ...symbolResults,
    ...nameResults,
    ...addressResults
  ];

  const uniqueResults = removeDuplicates(combinedResults);

  // Split results into three groups according to original logic
  const resultsWithBalance = uniqueResults.filter(result => result.item.balance);
  const resultsStartingWithQuery = uniqueResults.filter(result => 
    !result.item.balance &&
    (result.item.symbol.toLowerCase().startsWith(normalizedQuery) || 
    result.item.name.toLowerCase().startsWith(normalizedQuery))
  );
  const resultsContainingQuery = uniqueResults.filter(result => 
    !result.item.balance &&
    !result.item.symbol.toLowerCase().startsWith(normalizedQuery) &&
    !result.item.name.toLowerCase().startsWith(normalizedQuery) &&
    (result.item.symbol.toLowerCase().includes(normalizedQuery) || 
    result.item.name.toLowerCase().includes(normalizedQuery) || 
    result.item.address.toLowerCase().includes(normalizedQuery))
  );

  // Combine the sorted results
  const finalResults = [...resultsWithBalance, ...resultsStartingWithQuery, ...resultsContainingQuery];

  return finalResults.map(result => result.item);
};

export default searchTokens;
