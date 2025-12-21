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

// gRPC Stream hooks (V12)
export {
  useGrpcStream,
  useTransactionStream,
  useMetricsStream,
  useConsensusStream,
  useValidatorStream,
  useNetworkStream,
  useMultiGrpcStream,
  type StreamType,
  type StreamStatus,
  type ConnectionStatus,
  type UseGrpcStreamOptions,
  type UseGrpcStreamReturn,
  type UseMultiGrpcStreamOptions,
  type UseMultiGrpcStreamReturn,
  type TransactionEvent,
  type MetricEvent,
  type ConsensusEvent,
  type ValidatorEvent,
  type NetworkEvent,
} from './useGrpcStream';
