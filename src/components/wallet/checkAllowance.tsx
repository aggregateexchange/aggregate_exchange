// src/components/wallet/checkAllowance.tsx
import { ethers } from 'ethers';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { getRpcClient, eth_call } from 'thirdweb/rpc';
import { useThirdwebClient } from '../../contexts/ThirdwebClientProvider';
import { useApprove } from './Approve';

const maxUint256 = ethers.constants.MaxUint256;

export const useCheckAllowance = () => {
  const client = useThirdwebClient();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { approveSpender } = useApprove();

  const checkAllowance = async (
    tokenAddress: string,
    amount: string,
    spender: string
  ): Promise<string | boolean> => {
    if (!account || !activeChain) {
      throw new Error('Wallet not connected or chain not active');
    }

    let allowance: ethers.BigNumber;

    if (spender === 'none' || tokenAddress.toLowerCase() === ethers.constants.AddressZero.toLowerCase()) {
      // Approval not required; set allowance to maxUint256
      allowance = maxUint256;
    } else {
      const rpcRequest = getRpcClient({ client, chain: activeChain });

      const data: `0x${string}` = new ethers.utils.Interface([
        'function allowance(address owner, address spender) view returns (uint256)',
      ]).encodeFunctionData('allowance', [account.address, spender]) as `0x${string}`;

      if (!data.startsWith('0x')) {
        throw new Error("Data must start with '0x'");
      }

      const result = await eth_call(rpcRequest, {
        to: tokenAddress,
        data,
      });

      if (!result || result === '0x') {
        throw new Error('Failed to get allowance');
      }

      allowance = ethers.BigNumber.from(result);
    }

    const amountBN = ethers.BigNumber.from(amount);

    if (amountBN.gt(allowance)) {
      try {
        await approveSpender(tokenAddress, spender);
        return true;
      } catch (error) {
        // Throw the error to be caught by handleApproval
        throw error;
      }
    } else {
      return 'Sufficient allowance';
    }
  };

  return { checkAllowance };
};
