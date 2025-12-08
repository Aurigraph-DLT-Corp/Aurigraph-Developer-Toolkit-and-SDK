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
  | 'custom';

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
  | CustomDataSource;

export type AnyDataPayload = WeatherData | AlpacaData | NewsData | TwitterData | CryptoData;

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
  custom: {
    type: 'custom',
    name: 'Custom API',
    description: 'Custom API endpoint',
    updateInterval: 60000, // 1 minute
  },
};
