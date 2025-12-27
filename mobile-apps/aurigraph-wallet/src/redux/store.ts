/**
 * Redux Store Configuration
 * Centralized state management for the wallet app
 */

import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'

// Reducers
import walletReducer from './slices/walletSlice'
import authReducer from './slices/authSlice'
import transactionsReducer from './slices/transactionsSlice'

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['wallet', 'auth'], // Only persist these reducers
}

// Persist the root reducer
const persistedReducer = persistReducer(persistConfig, (state, action) => {
  return {
    wallet: walletReducer(state?.wallet, action),
    auth: authReducer(state?.auth, action),
    transactions: transactionsReducer(state?.transactions, action),
  }
})

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

// Create persistor
export const persistor = persistStore(store)

// Redux type definitions
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Async thunk type helper
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

export default store
