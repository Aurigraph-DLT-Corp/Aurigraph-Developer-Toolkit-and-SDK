import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import dashboardReducer from './dashboardSlice'
import performanceReducer from './performanceSlice'
import transactionReducer from './transactionSlice'
import rwaReducer from './rwaSlice'
import apiIntegrationReducer from './apiIntegrationSlice'
import transactionAnalyticsReducer from './transactionAnalyticsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    performance: performanceReducer,
    transactions: transactionReducer,
    rwa: rwaReducer,
    apiIntegration: apiIntegrationReducer,
    transactionAnalytics: transactionAnalyticsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch