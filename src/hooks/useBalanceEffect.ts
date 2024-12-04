// src/hooks/useBalanceEffect.ts
import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import sortTokens from '../utils/tokens/sortTokens';

const useBalanceEffect = () => {
  const { balances } = useStore();
  const previousBalancesRef = useRef<{ [chainId: number]: string }>({});

  useEffect(() => {
    const previousBalances = previousBalancesRef.current;
    const currentBalances = balances.reduce<{ [chainId: number]: string }>((acc, balance) => {
      acc[balance.chainId] = (acc[balance.chainId] || "") + balance.address + balance.balance;
      return acc;
    }, {});

    const changedChainIds = new Set<number>();

    Object.keys(currentBalances).forEach(chainId => {
      if (currentBalances[Number(chainId)] !== previousBalances[Number(chainId)]) {
        changedChainIds.add(Number(chainId));
      }
    });

    if (changedChainIds.size > 0) {
      sortTokens(changedChainIds);
    }

    previousBalancesRef.current = currentBalances;
  }, [balances]);
};

export default useBalanceEffect;
