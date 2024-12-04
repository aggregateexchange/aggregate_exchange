import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThirdwebProvider } from 'thirdweb/react';
import App from './App';
import './index.css';
import { DataProvider } from './contexts/DataContext';
import { ThirdwebClientProvider } from './contexts/ThirdwebClientProvider';

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThirdwebProvider>
      <ThirdwebClientProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ThirdwebClientProvider>
    </ThirdwebProvider>
  </BrowserRouter>
);