/**
 * Redux Store Configuration
 *
 * Configures Redux Toolkit store with:
 * - Demo app slice (nodes, metrics, charts, WebSocket state)
 * - Settings slice (theme, notifications, performance, external feeds)
 * - Redux DevTools integration
 * - Redux Persist for state persistence
 * - TypeScript support
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

import demoAppReducer from './demoAppSlice';
import settingsReducer from './settingsSlice';
import type { RootState } from '../types/state';

// ============================================================================
// Redux Persist Configuration
// ============================================================================

/**
 * Persist configuration for settings
 * - Persists theme, notifications, performance, external feeds
 * - Uses localStorage for web persistence
 */
const settingsPersistConfig = {
  key: 'settings',
  storage,
  whitelist: [
    'theme',
    'notifications',
    'performance',
    'externalFeeds',
    'apiBaseUrl',
    'wsUrl',
    'demoMode',
  ],
};

/**
 * Persist configuration for demo app
 * - Only persists selected node and active dashboard
 * - Does NOT persist nodes, metrics, or chart data (runtime state)
 */
const demoAppPersistConfig = {
  key: 'demoApp',
  storage,
  whitelist: ['selectedNodeId', 'activeDashboard', 'spatialViewMode', 'demoMode'],
};

// ============================================================================
// Root Reducer
// ============================================================================

const rootReducer = combineReducers({
  demoApp: persistReducer(demoAppPersistConfig, demoAppReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
});

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

// ============================================================================
// Persistor
// ============================================================================

export const persistor = persistStore(store);

// ============================================================================
// TypeScript Types
// ============================================================================

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Infer RootState from store (alternative to importing from types)
export type { RootState };

// ============================================================================
// Hooks (Re-export for convenience)
// ============================================================================

// Note: These hooks should be defined in a separate hooks file to avoid circular dependencies
// For now, we export the store and types. Hooks will be created in src/hooks/useRedux.ts
