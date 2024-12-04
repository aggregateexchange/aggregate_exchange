// TransactionContainer.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import './TransactionContainer.css';
import BigNumber from 'bignumber.js';
import Modal from 'react-modal';
import { useStore } from '../../store/useStore';
import { Network, Dapp } from '../../types';
import { useCheckNetworkAndAllowance } from '../../hooks/useCheckNetworkAndAllowance';
import { useHandleApproval } from '../../hooks/useHandleApproval';
import { useNetworkSwitcher } from '../../hooks/useNetworkSwitcher';
import { useActiveAccount, useActiveWalletConnectionStatus, useActiveWalletChain } from 'thirdweb/react';
import { useCheckBalance } from '../wallet/checkBalance';

type Quote = any;

interface TransactionContainerProps {
  quote: Quote;
  onBack: () => void;
  isToggleOn: boolean; // Added isToggleOn prop
}

const TransactionContainer: React.FC<TransactionContainerProps> = ({ quote, onBack, isToggleOn }) => {
  const { dapps } = useStore((state) => ({
    dapps: state.dapps,
  }));

  const { checkNetworkAndAllowance } = useCheckNetworkAndAllowance();
  const { handleApproval } = useHandleApproval();
  const { switchNetwork, networkSwitchStatus } = useNetworkSwitcher();
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const { checkBalance } = useCheckBalance();

  const [fromNetwork, setFromNetwork] = useState<Network | null>(null);
  const [toNetwork, setToNetwork] = useState<Network | null>(null);
  const [dapp, setDapp] = useState<Dapp | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('idle');
  const [approvalStatus, setApprovalStatus] = useState<string>('Swap');
  const [currentQuote, setCurrentQuote] = useState<Quote>(quote);
  const [confirmedQuote, setConfirmedQuote] = useState<Quote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isGasEstimationError, setIsGasEstimationError] = useState<boolean>(false); // New state
  const [showWarning, setShowWarning] = useState<boolean>(false);

  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [isContainerVisible, setIsContainerVisible] = useState<boolean>(true);
  const [balanceChecked, setBalanceChecked] = useState<boolean>(false);
  const [isBalanceCheckPending, setIsBalanceCheckPending] = useState<boolean>(false);
  const [isNetworkCorrect, setIsNetworkCorrect] = useState<boolean>(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [transactionCompleted, setTransactionCompleted] = useState<boolean>(false); // New state

  const activeChain = useActiveWalletChain();

  const prevConnectionStatus = useRef(connectionStatus);

  // Helper function to extract quote data
  const getQuoteData = (quote: any) => (quote && quote.data ? quote.data : quote);

  const initialize = useCallback(async (quote: any) => {
    const quoteData = getQuoteData(quote);
    const { networkStatus, fromNetwork, toNetwork, dapp } = await checkNetworkAndAllowance(quoteData, dapps);
    setNetworkStatus(networkStatus);
    setFromNetwork(fromNetwork);
    setToNetwork(toNetwork);
    setDapp(dapp);
    setIsNetworkCorrect(networkStatus === 'correct_network');

    if (networkStatus === 'wallet_not_connected') {
      setApprovalStatus('Please connect wallet first');
    } else if (networkStatus === 'wrong_network') {
      setApprovalStatus('Change Network');
    } else {
      // Don't set to 'Swap' here, let the balance check determine the status
      setBalanceChecked(false);
    }
  }, [dapps, checkNetworkAndAllowance]);

  useEffect(() => {
    setCurrentQuote(quote);
    setShowWarning(false);
    setBalanceChecked(false);
    setTransactionCompleted(false); // Reset flag for new quote
    setErrorMessage(''); // Reset error message
    setIsGasEstimationError(false); // Reset gas estimation error flag
    initialize(quote);
  }, [quote, initialize]);

  useEffect(() => {
    if (activeChain && fromNetwork && activeChain.id !== fromNetwork.id) {
      setNetworkStatus('wrong_network');
    } else if (activeChain && fromNetwork && activeChain.id === fromNetwork.id) {
      setNetworkStatus('correct_network');
    }
  }, [activeChain, fromNetwork]);

  useEffect(() => {
    if (networkSwitchStatus === 'success') {
      setNetworkStatus('correct_network');
      setIsNetworkCorrect(true);
      setIsNetworkSwitching(false);
      // Trigger balance check after network switch
      setBalanceChecked(false);
    } else if (networkSwitchStatus === 'rejected' || networkSwitchStatus === 'failed') {
      setNetworkStatus('wrong_network');
      setIsNetworkCorrect(false);
      setApprovalStatus('Change Network');
      setIsNetworkSwitching(false);
    }
  }, [networkSwitchStatus]);

  useEffect(() => {
    const verifyBalance = async () => {
      const quoteData = getQuoteData(currentQuote);
      if (account && fromNetwork && isNetworkCorrect && !balanceChecked && !isBalanceCheckPending && !isNetworkSwitching) {
        setIsBalanceCheckPending(true);

        const balance = await checkBalance(
          quoteData.fromToken.address,
          account.address,
          fromNetwork
        );

        console.log('Balance:', balance);

        if (balance && new BigNumber(balance).isGreaterThanOrEqualTo(quoteData.fromAmount)) {
          console.log('Sufficient balance');
          setApprovalStatus('Swap');
        } else {
          console.log('Insufficient balance');
          setApprovalStatus('Insufficient balance');
        }
        setBalanceChecked(true);
        setIsBalanceCheckPending(false);
      }
    };

    verifyBalance();
  }, [account, fromNetwork, currentQuote, checkBalance, isNetworkCorrect, balanceChecked, isNetworkSwitching]);

  useEffect(() => {
    if (
      (prevConnectionStatus.current === 'connected' && connectionStatus === 'disconnected') ||
      (prevConnectionStatus.current === 'disconnected' && connectionStatus === 'connected')
    ) {
      setIsContainerVisible(false);
      setModalIsOpen(false);
      onBack();
    }
    prevConnectionStatus.current = connectionStatus;
  }, [connectionStatus, onBack]);

  const formatAmount = (amount: number, decimals: number) => {
    const fullAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
    // Limit the decimal places to a maximum of 12
    return fullAmount.toFixed(12).replace(/\.?0+$/, "");
  };

  const formatTransactionHash = (hash: string) => {
    return `${hash.slice(0, 5)}...${hash.slice(-5)}`;
  };

  const handleNetworkSwitchClick = async () => {
    try {
      if (fromNetwork) {
        setIsNetworkSwitching(true);
        await switchNetwork(fromNetwork.id);
        setIsNetworkSwitching(false);
      } else {
        setErrorMessage('Transaction unsuccessful'); // Generic error
      }
    } catch (error) {
      console.error('Network switch error:', error);
      setErrorMessage('Transaction unsuccessful'); // Generic error
      setIsGasEstimationError(false); // Not a gas estimation error
      setIsNetworkSwitching(false);
    }
  };

  const handleSwapClick = async () => {
    if (approvalStatus === 'Please connect wallet first' || approvalStatus === 'Insufficient balance') {
      return;
    }

    setErrorMessage('');
    setApprovalStatus('Initializing');
    setShowWarning(false);
    setIsSwapping(true); // Start swapping

    try {
      if (networkStatus === 'wrong_network') {
        await handleNetworkSwitchClick();
      }

      if (activeChain?.id !== fromNetwork?.id) {
        console.error(`Chain mismatch: current ${activeChain?.id}, expected ${fromNetwork?.id}`);
        setErrorMessage('Transaction unsuccessful'); // Generic error
        setIsGasEstimationError(false); // Not a gas estimation error
        setApprovalStatus('Swap');
        setIsSwapping(false); // End swapping due to error
        setTransactionCompleted(true); // Prevent re-triggering
        return;
      }

      await handleApproval(
        currentQuote,
        dapp,
        setApprovalStatus,
        (newQuote: Quote) => {
          const newQuoteData = getQuoteData(newQuote);
          const currentQuoteData = getQuoteData(currentQuote);
          if (newQuoteData && currentQuoteData && newQuoteData.toAmount < currentQuoteData.toAmount) {
            setShowWarning(true);
          }
          setCurrentQuote(newQuote);
          setConfirmedQuote(newQuote);
        },
        setErrorMessage,
        setIsGasEstimationError, // Pass the new state setter
        fromNetwork,
        setTransactionHash,
        async (status: string) => {
          setTransactionStatus(status);
          if (status === 'success' || status === 'failure') {
            setIsSwapping(false); // End swapping
            setIsContainerVisible(false);
            setModalIsOpen(true);
            setTransactionCompleted(true); // Prevent re-triggering
          }
        }
      );
    } catch (error) {
      console.error('Approval error:', error);
      setErrorMessage('Transaction unsuccessful'); // Generic error
      setIsGasEstimationError(false); // Not a gas estimation error
      setApprovalStatus('Swap');
      setIsSwapping(false); // End swapping due to error
      setTransactionCompleted(true); // Prevent re-triggering

      // Handle failure
      setTransactionStatus('failure');
      setIsContainerVisible(false);
      setModalIsOpen(true);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    onBack();
  };

  const quoteData = getQuoteData(currentQuote);
  const isLoading = isNetworkSwitching || isSwapping;

  // Automatically initiate steps when toggle is on
  useEffect(() => {
    const initiateProcess = async () => {
      if (
        isToggleOn &&
        isContainerVisible && // Ensure container is visible
        !isNetworkSwitching &&
        !isSwapping &&
        !errorMessage &&
        !transactionCompleted // Prevent re-triggering
      ) {
        if (networkStatus === 'wrong_network') {
          await handleNetworkSwitchClick();
        } else if (networkStatus === 'correct_network' && approvalStatus === 'Swap' && balanceChecked) {
          await handleSwapClick();
        }
      }
    };

    initiateProcess();
  }, [
    isToggleOn,
    networkStatus,
    approvalStatus,
    isNetworkSwitching,
    isSwapping,
    balanceChecked,
    errorMessage,
    transactionCompleted, // Include transactionCompleted
    isContainerVisible, // Include container visibility
  ]);

  return (
    <>
      {isContainerVisible && (
        <div className="transaction-transaction-container">
          <button className="transaction-back-button" onClick={onBack}>←</button>
          <div className="transaction-swap-box">
            {/* Remove error message display here if you only want it in the modal */}
            {!errorMessage && (
              quoteData && fromNetwork && toNetwork && dapp ? (
                <>
                  <div className="transaction-token-container">
                    {quoteData.fromToken.logoURI && (
                      <img src={quoteData.fromToken.logoURI} alt={quoteData.fromToken.symbol} className="transaction-token-image" />
                    )}
                    <div className="transaction-token-info">
                      <div className="transaction-token-amount">
                        {formatAmount(quoteData.fromAmount, quoteData.fromToken.decimals)}
                      </div>
                      <div className="transaction-token-symbol">
                        {quoteData.fromToken.symbol} on {fromNetwork.name}
                      </div>
                    </div>
                    {fromNetwork.logoURI && (
                      <img src={fromNetwork.logoURI} alt={fromNetwork.name} className="transaction-chain-image" />
                    )}
                  </div>
                  <div className="transaction-dapp-container">
                    <div className="transaction-dapp">
                      {dapp.imageURI && (
                        <img src={dapp.imageURI} alt={dapp.name} className="transaction-dapp-image" />
                      )}
                      <span>{dapp.name}</span>
                    </div>
                  </div>
                  <div className="transaction-token-container">
                    {quoteData.toToken.logoURI && (
                      <img src={quoteData.toToken.logoURI} alt={quoteData.toToken.symbol} className="transaction-token-image" />
                    )}
                    <div className="transaction-token-info">
                      <div className="transaction-token-amount">
                        {formatAmount(quoteData.toAmount, quoteData.toToken.decimals)}
                      </div>
                      <div className="transaction-token-symbol">
                        {quoteData.toToken.symbol} on {toNetwork.name}
                      </div>
                    </div>
                    {toNetwork.logoURI && (
                      <img src={toNetwork.logoURI} alt={toNetwork.name} className="transaction-chain-image" />
                    )}
                  </div>
                </>
              ) : (
                <div className="transaction-placeholder">
                  Select a quote to see the details.
                </div>
              )
            )}
          </div>
          {showWarning && (
            <div className="transaction-swap-notice">
              Output amount changed with new quote!
            </div>
          )}
          <div className="swap-button-container-transaction" style={{ position: 'relative', display: 'inline-block' }}>
            {networkStatus === 'wrong_network' ? (
              <button className="transaction-swap-button" onClick={handleNetworkSwitchClick} disabled={isNetworkSwitching || isToggleOn}>
                {isNetworkSwitching ? 'Switching network...' : 'Change Network'}
              </button>
            ) : (
              <button
                className="transaction-swap-button"
                onClick={handleSwapClick}
                disabled={
                  approvalStatus === 'Please connect wallet first' ||
                  approvalStatus === 'Insufficient balance' ||
                  isNetworkSwitching ||
                  isToggleOn
                }
              >
                {isSwapping ? 'Processing...' : approvalStatus}
              </button>
            )}
            {isLoading && <div className="quote-response-loader-transaction"></div>}
          </div>
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Transaction Status"
        className="transaction-modal"
        overlayClassName="transaction-modal-overlay"
      >
        {transactionStatus === 'success' ? (
          <div className="transaction-modal-content">
            <p className="success-message">Transaction Successful</p>
            {confirmedQuote && (
              <>
                <p>{`${quoteData.fromToken.symbol} ${formatAmount(quoteData.fromAmount, quoteData.fromToken.decimals)} to ${quoteData.toToken.symbol} ${formatAmount(quoteData.toAmount, quoteData.toToken.decimals)}`}</p>
                <p>Transaction Hash: <a href={`${fromNetwork?.metamask.blockExplorerUrls[0]}tx/${transactionHash}`} target="_blank" rel="noopener noreferrer">{formatTransactionHash(transactionHash)}</a></p>
              </>
            )}
            <button onClick={closeModal}>OK</button>
          </div>
        ) : transactionStatus === 'failure' ? (
          <div className="transaction-modal-content">
            {/* **Display the Specific Error Message if Gas Estimation Failed, Otherwise Generic Message** */}
            {isGasEstimationError ? (
              <p className="failure-message">This quote is no longer available, please select a different quote.</p>
            ) : (
              <p className="failure-message">Transaction unsuccessful.</p>
            )}
            <button onClick={closeModal}>OK</button>
          </div>
        ) : null}
      </Modal>
    </>
  );
};

export default TransactionContainer;
