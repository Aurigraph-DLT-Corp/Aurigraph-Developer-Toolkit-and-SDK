/**
 * Services Barrel Export
 *
 * Central export point for all service clients and APIs
 */

// V11 Backend Service - REST API client for Aurigraph V11 backend
export {
  default as V11BackendService,
  v11BackendService,
  type Transaction,
  type Block,
  type Validator,
  type TransactionFilters,
  type BlockFilters,
  type PaginationParams,
  type SubmitTransactionRequest,
  type SubmitTransactionResponse,
} from './V11BackendService';

// Alpaca Markets API Client - Stock market data
export {
  default as AlpacaClient,
  initializeAlpacaClient,
  getAlpacaClient,
  type AlpacaClientConfig,
  type AlpacaQuoteParams,
  type AlpacaBarsParams,
} from './AlpacaClient';

// OpenWeatherMap API Client - Weather data
export {
  default as WeatherClient,
  initializeWeatherClient,
  getWeatherClient,
  type WeatherClientConfig,
  type WeatherParams,
} from './WeatherClient';

// Twitter (X.com) API v2 Client - Social media data
export {
  default as TwitterClient,
  initializeTwitterClient,
  getTwitterClient,
  type TwitterClientConfig,
  type TwitterSearchParams,
  type TwitterTimelineParams,
} from './TwitterClient';

// CoinGecko API Client - Cryptocurrency price data
export {
  default as CoinGeckoClient,
  initializeCoinGeckoClient,
  getCoinGeckoClient,
  type CoinGeckoClientConfig,
  type SimplePriceParams,
  type MarketChartParams,
  type CoinPrice,
} from './CoinGeckoClient';

// gRPC-Web Service - Real-time streaming (V12 - replaces WebSocket)
export {
  grpcService,
  default as GrpcService,
  type StreamRequest,
  type TransactionEvent,
  type MetricEvent,
  type ConsensusEvent,
  type ValidatorEvent,
  type NetworkEvent,
  type StreamEvent,
  type StreamType,
  type ConnectionStatus,
  type StreamSubscription,
  type StreamConfig,
} from './grpcService';
