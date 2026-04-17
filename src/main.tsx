import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import ErrorBoundary from './components/app/ErrorBoundary';
import { DealCycleProvider } from './context/DealCycleContext';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { ShopProvider } from './context/ShopContext';
import { TelemetryProvider } from './context/TelemetryContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <TelemetryProvider>
          <AuthProvider>
            <LocaleProvider>
              <DealCycleProvider>
                <ShopProvider>
                  <App />
                </ShopProvider>
              </DealCycleProvider>
            </LocaleProvider>
          </AuthProvider>
        </TelemetryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
