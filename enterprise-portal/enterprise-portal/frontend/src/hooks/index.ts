/**
 * Custom React Hooks Barrel Export
 *
 * Central export point for all custom React hooks
 */

// Redux hooks
export { useAppDispatch, useAppSelector } from './useRedux';

// V11 Backend API hooks
export {
  useHealth,
  useSystemInfo,
  usePerformanceMetrics,
  useStats,
  useTransactions,
  useBlocks,
  useValidators,
  useSubmitTransaction,
  useDashboard,
} from './useV11Backend';

// WebSocket hooks
export {
  useWebSocket,
  type UseWebSocketOptions,
  type UseWebSocketResult,
} from './useWebSocket';

// External feeds hooks (Alpaca, Weather, Twitter, CoinGecko)
export {
  useStockQuotes,
  useStockBars,
  useStockData,
  useWeatherData,
  useTwitterSearch,
  useCryptoPrice,
  useCryptoMarkets,
  useCryptoData,
} from './useExternalFeeds';

// Auth hook
export { useAuth } from './useAuth';

// Query params hook
export { useQueryParams } from './useQueryParams';

// Live Demo Data hook (AV11-567)
export {
  useLiveDemoData,
  type LiveDemoDataState,
  type UseLiveDemoDataOptions,
  type UseLiveDemoDataReturn,
} from './useLiveDemoData';
