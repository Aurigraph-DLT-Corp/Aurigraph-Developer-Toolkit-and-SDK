/**
 * Redux Store Configuration
 *
 * Configures the Redux store with:
 * - Lead slice for lead management state
 * - Demo slice for demo scheduling state
 * - Middleware for async thunk handling
 * - Type exports for useSelector/useDispatch hooks
 */

import { configureStore } from '@reduxjs/toolkit';
import leadReducer from './slices/leadSlice';
import demoReducer from './slices/demoSlice';

export const store = configureStore({
  reducer: {
    leads: leadReducer,
    demos: demoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date serialization errors for ZonedDateTime fields
        ignoredActions: ['leads/fetchAllLeads/fulfilled', 'demos/fetchPending/fulfilled'],
        ignoredPaths: ['leads.leads', 'demos.demos'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
