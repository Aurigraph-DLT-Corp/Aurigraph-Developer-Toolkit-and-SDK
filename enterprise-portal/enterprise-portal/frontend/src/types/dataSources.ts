/**
 * External Data Source Types
 *
 * Types for external API integrations (Weather, Alpaca, NewsAPI, X/Twitter, etc.)
 */

export type DataSourceType =
  | 'weather'
  | 'alpaca'
  | 'newsapi'
  | 'twitter'
  | 'crypto'
  | 'stock'
  | 'forex'
  | 'crypto-exchange'
  | 'custom';

// Supported Crypto Exchanges
export type CryptoExchangeName = 'binance' | 'coinbase' | 'kraken' | 'huobi' | 'okx' | 'bybit';

export interface DataSourceConfig {
  id: string;
  type: DataSourceType;
  name: string;
  description: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  updateInterval: number; // milliseconds
  lastUpdate?: string;
}

// Weather Data Source
export interface WeatherDataSource extends DataSourceConfig {
  type: 'weather';
  location: string;
  units: 'metric' | 'imperial';
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  condition: string;
  timestamp: string;
}

// Alpaca Trading Data Source
export interface AlpacaDataSource extends DataSourceConfig {
  type: 'alpaca';
  symbols: string[]; // e.g., ['AAPL', 'GOOGL']
  dataType: 'trades' | 'quotes' | 'bars';
}

export interface AlpacaData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  change: number;
  changePercent: number;
}

// NewsAPI Data Source
export interface NewsDataSource extends DataSourceConfig {
  type: 'newsapi';
  query: string;
  language: string;
  category: string;
}

export interface NewsData {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Twitter/X Data Source
export interface TwitterDataSource extends DataSourceConfig {
  type: 'twitter';
  keywords: string[];
  language: string;
}

export interface TwitterData {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  likes: number;
  retweets: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Crypto Data Source
export interface CryptoDataSource extends DataSourceConfig {
  type: 'crypto';
  symbols: string[]; // e.g., ['BTC', 'ETH']
  currency: string; // e.g., 'USD'
}

export interface CryptoData {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
}

// Crypto Exchange Data Source (Real-time exchange streams)
export interface CryptoExchangeDataSource extends DataSourceConfig {
  type: 'crypto-exchange';
  exchangeName: CryptoExchangeName;
  tradingPairs: string[]; // e.g., ['BTC/USDT', 'ETH/USDT']
  includeOrderBook: boolean;
  includeTradeHistory: boolean;
  wsEndpoint?: string; // WebSocket endpoint for real-time data
  apiSecret?: string; // For authenticated endpoints
}

export interface CryptoExchangeTradeData {
  exchange: CryptoExchangeName;
  pair: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  timestamp: string;
  tradeId: string;
}

export interface CryptoExchangeTickerData {
  exchange: CryptoExchangeName;
  pair: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: string;
}

export interface CryptoExchangeOrderBookData {
  exchange: CryptoExchangeName;
  pair: string;
  bids: Array<{ price: number; amount: number }>;
  asks: Array<{ price: number; amount: number }>;
  timestamp: string;
}

export interface CryptoExchangeData {
  ticker: CryptoExchangeTickerData;
  recentTrades?: CryptoExchangeTradeData[];
  orderBook?: CryptoExchangeOrderBookData;
}

// Custom Data Source
export interface CustomDataSource extends DataSourceConfig {
  type: 'custom';
  endpoint: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
}

export type AnyDataSource =
  | WeatherDataSource
  | AlpacaDataSource
  | NewsDataSource
  | TwitterDataSource
  | CryptoDataSource
  | CryptoExchangeDataSource
  | CustomDataSource;

export type AnyDataPayload = WeatherData | AlpacaData | NewsData | TwitterData | CryptoData | CryptoExchangeData;

// Demo Session Persistence
export interface DemoSession {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string; // 24 hours from creation
  isActive: boolean;
  totalTransactions: number;
  peakTps: number;
}

// Slim Node to Data Source Mapping
export interface SlimNodeMapping {
  slimNodeId: string;
  dataSourceIds: string[]; // Multiple data sources per slim node
  isStreaming: boolean;
  lastStreamedAt?: string;
}

// Network Configuration
export interface NetworkConfig {
  channels: number;
  validators: number; // Must be odd for BFT consensus (3, 5, 7, 9, etc.)
  businessNodes: number;
  slimNodes: number;
  dataSources: AnyDataSource[];
  slimNodeMappings: SlimNodeMapping[]; // Link slim nodes to data sources
  demoSession: DemoSession | null; // 24-hour persistence
}

// Slim Node with Data Source
export interface SlimNodeDataConfig {
  nodeId: string;
  dataSourceId: string;
  dataSourceType: DataSourceType;
  enabled: boolean;
  lastData?: AnyDataPayload;
}

// Available Data Source Templates
export const DATA_SOURCE_TEMPLATES: Record<DataSourceType, Partial<DataSourceConfig>> = {
  weather: {
    type: 'weather',
    name: 'Weather API',
    description: 'Real-time weather data from OpenWeatherMap',
    updateInterval: 300000, // 5 minutes
  },
  alpaca: {
    type: 'alpaca',
    name: 'Alpaca Trading',
    description: 'Stock market data from Alpaca Markets',
    updateInterval: 60000, // 1 minute
  },
  newsapi: {
    type: 'newsapi',
    name: 'News API',
    description: 'Latest news articles from NewsAPI',
    updateInterval: 600000, // 10 minutes
  },
  twitter: {
    type: 'twitter',
    name: 'X/Twitter Feed',
    description: 'Real-time tweets from X (Twitter)',
    updateInterval: 120000, // 2 minutes
  },
  crypto: {
    type: 'crypto',
    name: 'Cryptocurrency',
    description: 'Crypto prices from CoinGecko',
    updateInterval: 60000, // 1 minute
  },
  stock: {
    type: 'stock',
    name: 'Stock Market',
    description: 'Stock prices and market data',
    updateInterval: 60000, // 1 minute
  },
  forex: {
    type: 'forex',
    name: 'Forex Exchange',
    description: 'Foreign exchange rates',
    updateInterval: 60000, // 1 minute
  },
  'crypto-exchange': {
    type: 'crypto-exchange',
    name: 'Crypto Exchange Stream',
    description: 'Real-time cryptocurrency exchange data (Binance, Coinbase, Kraken, etc.)',
    updateInterval: 1000, // 1 second for real-time
  },
  custom: {
    type: 'custom',
    name: 'Custom API',
    description: 'Custom API endpoint',
    updateInterval: 60000, // 1 minute
  },
};

// Crypto Exchange WebSocket Endpoints
export const CRYPTO_EXCHANGE_WS_ENDPOINTS: Record<CryptoExchangeName, string> = {
  binance: 'wss://stream.binance.com:9443/ws',
  coinbase: 'wss://ws-feed.exchange.coinbase.com',
  kraken: 'wss://ws.kraken.com',
  huobi: 'wss://api.huobi.pro/ws',
  okx: 'wss://ws.okx.com:8443/ws/v5/public',
  bybit: 'wss://stream.bybit.com/v5/public/spot',
};

// Crypto Exchange REST API Endpoints
export const CRYPTO_EXCHANGE_REST_ENDPOINTS: Record<CryptoExchangeName, string> = {
  binance: 'https://api.binance.com/api/v3',
  coinbase: 'https://api.exchange.coinbase.com',
  kraken: 'https://api.kraken.com/0/public',
  huobi: 'https://api.huobi.pro',
  okx: 'https://www.okx.com/api/v5',
  bybit: 'https://api.bybit.com/v5',
};
