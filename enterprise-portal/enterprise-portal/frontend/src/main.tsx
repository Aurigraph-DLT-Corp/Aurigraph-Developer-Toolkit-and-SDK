/**
 * Main Entry Point for Aurigraph Enterprise Portal
 *
 * Initializes React application with:
 * - Redux store with Redux Toolkit
 * - Redux Persist for state persistence
 * - React StrictMode for development
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import App from './App';
import './index.css';

// Error handling for React 18
if (!document.getElementById('root')) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
