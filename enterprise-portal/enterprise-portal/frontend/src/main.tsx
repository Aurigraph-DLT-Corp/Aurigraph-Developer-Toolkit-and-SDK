/**
 * Main Entry Point for Aurigraph Enterprise Portal
 *
 * Initializes React application with:
 * - Redux store with Redux Toolkit
 * - Redux Persist for state persistence
 * - React StrictMode for development
 * - Console Logger for error suppression
 */

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Spin } from 'antd';
import { store, persistor } from './store';
import { NavigationProvider } from './context/NavigationContext';
import App from './App';
import './index.css';

// Initialize console logger to suppress expected development warnings
import './utils/consoleLogger';

// Error handling for React 18
if (!document.getElementById('root')) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <NavigationProvider>
            <Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                  <Spin size="large" tip="Loading..." />
                </div>
              }
            >
              <App />
            </Suspense>
          </NavigationProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
