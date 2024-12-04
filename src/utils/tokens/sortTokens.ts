import { useStore } from '../../store/useStore';
import { Balance, Token } from '../../types';

const sortTokens = (changedChainIds: Set<number>) => {
  const { balances, tokens, setTokens } = useStore.getState();

  if (changedChainIds.size === 0) {
    console.log("No changes detected. Skipping token sorting.");
    return;
  }

  const newTokens = { ...tokens };

  changedChainIds.forEach(chainId => {
    console.log(`Sorting tokens for network ${chainId}`);

    // Delete all balances for the given chain ID
    if (newTokens[chainId]) {
      newTokens[chainId] = newTokens[chainId].map(token => {
        const { balance, ...rest } = token;
        return rest; // Remove balance from the token
      });
    }

    const chainBalances = balances.filter(balance => balance.chainId === chainId);
    const tokenMap: { [address: string]: Balance } = {};

    chainBalances.forEach(balance => {
      if (balance.balance !== '0') {
        tokenMap[balance.address.toLowerCase()] = balance;
      }
    });

    const sortedTokens: Token[] = [];
    const tokensWithoutBalance: Token[] = [];

    // Handle zero address token first
    const zeroAddressToken = newTokens[chainId].find(token => token.address === '0x0000000000000000000000000000000000000000');
    if (zeroAddressToken) {
      const zeroAddressBalance = tokenMap['0x0000000000000000000000000000000000000000'];
      if (zeroAddressBalance) {
        sortedTokens.push({
          ...zeroAddressToken,
          balance: zeroAddressBalance.balance
        });
      } else {
        tokensWithoutBalance.push(zeroAddressToken);
      }
    }

    // Handle other tokens
    newTokens[chainId].forEach(token => {
      if (token.address !== '0x0000000000000000000000000000000000000000') {
        const balance = tokenMap[token.address.toLowerCase()];
        if (balance) {
          sortedTokens.push({
            ...token,
            balance: balance.balance
          });
        } else {
          tokensWithoutBalance.push(token);
        }
      }
    });

    // Combine sorted tokens with tokens without balance
    newTokens[chainId] = [...sortedTokens, ...tokensWithoutBalance];

    console.log(`Sorted ${sortedTokens.length} tokens with non-zero balance for network ${chainId}`);
  });

  setTokens(newTokens);
};

export default sortTokens;
