// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Modal from 'react-modal';
import TokenSelection from './components/tokenSelection/TokenSelection';
import TransactionContainer from './components/transaction/TransactionContainer';
import FAQ from './components/other/FAQ';
import Logo from './components/other/Logo';
import { CustomConnectButton } from './components/wallet/ConnectButton';
import NetworkChangerButton from './components/networkChanger/NetworkChangerButton';
import SwaggerDocs from './swagger/SwaggerDocs';
import './App.css';

function App() {
  const [streamActive, setStreamActive] = useState(false);
  const [quoteParams, setQuoteParams] = useState(null);
  const [bestQuote, setBestQuote] = useState(null);
  const [isTransactionOpen, setIsTransactionOpen] = useState<boolean>(false);
  const [hasMovedToOriginalPosition, setHasMovedToOriginalPosition] = useState(false);

  // Initialize isToggleOn from localStorage
  const [isToggleOn, setIsToggleOn] = useState(() => {
    const savedToggleState = localStorage.getItem('isToggleOn');
    return savedToggleState === 'true'; // Convert string to boolean
  });

  const containerRef = useRef(null);

  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  useEffect(() => {
    console.log('bestQuote state in App.tsx changed:', bestQuote);
  }, [bestQuote]);

  // Update localStorage whenever isToggleOn changes
  useEffect(() => {
    localStorage.setItem('isToggleOn', String(isToggleOn));
  }, [isToggleOn]);

  const handleFindBestRoute = (quoteRequest: any) => {
    setQuoteParams(quoteRequest);
    setStreamActive(true);
    setHasMovedToOriginalPosition(true);
    console.log("Best route search initiated:", quoteRequest);
  };

  const handleBestQuoteUpdate = (quote: any) => {
    console.log("Best quote received:", quote);
    setBestQuote(quote ? { ...quote } : null);
    setStreamActive(false);
  };

  const handleSwapClick = () => {
    if (bestQuote) {
      setIsTransactionOpen(true);
    }
  };

  const handleCloseTransaction = () => {
    setIsTransactionOpen(false);
  };

  // Update isToggleOn state and localStorage
  const handleToggleChange = (newToggleState: boolean) => {
    setIsToggleOn(newToggleState);
    // localStorage is updated via useEffect
  };

  const blackBackgroundStyle = {
    position: 'absolute' as const,
    top: '120px',
    left: hasMovedToOriginalPosition ? 'calc(50% - 359px)' : 'calc(50% - 188px)',
    width: hasMovedToOriginalPosition ? '718px' : '376px',
    height: '560px',
    backgroundColor: 'rgb(5, 5, 15)',
    borderRadius: 'var(--border-radius)',
    zIndex: -1,
    transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div ref={containerRef} className="scrollable-container">
            <div className="container">
              <div style={blackBackgroundStyle}></div>

              <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
                <CustomConnectButton />
              </div>

              <div style={{ position: 'fixed', top: 20, right: 320, zIndex: 1000 }}>
                <NetworkChangerButton />
              </div>

              <div className="header">
                <Logo />
              </div>
              <div className="mainContent">
                <TokenSelection
                  onFindBestRoute={handleFindBestRoute}
                  streamActive={streamActive}
                  setStreamActive={setStreamActive}
                  quoteParams={quoteParams}
                  onBestQuoteUpdate={handleBestQuoteUpdate}
                  bestQuote={bestQuote}
                  handleSwapClick={handleSwapClick}
                  isToggleOn={isToggleOn}
                  onToggleChange={handleToggleChange}
                />
              </div>
              {isTransactionOpen && bestQuote && (
                <TransactionContainer
                  quote={bestQuote}
                  onBack={handleCloseTransaction}
                  isToggleOn={isToggleOn}
                />
              )}
              <div className="faqSection">
                <FAQ />
              </div>
              <div className="bottom-spacer"></div>
            </div>
          </div>
        }
      />
      <Route path="/swagger-api" element={<SwaggerDocs />} />
    </Routes>
  );
}

export default App;
