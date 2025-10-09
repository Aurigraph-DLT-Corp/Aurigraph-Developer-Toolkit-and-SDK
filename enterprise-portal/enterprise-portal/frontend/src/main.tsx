/**
 * Main Entry Point for Aurigraph Enterprise Portal
 *
 * Initializes React application with strict mode
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error handling for React 18
if (!document.getElementById('root')) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
