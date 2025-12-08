/**
 * Exchange gRPC Service
 *
 * Provides gRPC-Web client for cryptocurrency exchange data streaming.
 * Uses HTTP/2 for better performance and Protocol Buffers for efficient serialization.
 *
 * Note: Until gRPC-Web is fully integrated, this service uses HTTP/2 REST polling
 * with JSON that matches the gRPC message format. The migration to full gRPC-Web
 * requires:
 * 1. Envoy proxy for gRPC-Web transcoding
 * 2. Generated TypeScript clients from proto files
 *
 * Current Implementation: HTTP/2 REST + JSON (gRPC-compatible format)
 * Target Implementation: gRPC-Web with protobuf-ts
 *
 * @version 1.0.0 (Dec 8, 2025)
 */

import type {
  CryptoExchangeName,
  CryptoExchangeData,
} from '../types/dataSources';

// API base URL (HTTP/2)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9003';
const GRPC_ENDPOINT = `${API_BASE_URL}/api/v11/exchanges`;

// Exchange enum mapping (matches proto Exchange enum)
export enum Exchange {
  EXCHANGE_UNSPECIFIED = 0,
  BINANCE = 1,
  COINBASE = 2,
  KRAKEN = 3,
  OKX = 4,
  BYBIT = 5,
  HUOBI = 6,
}

// Trade side enum (matches proto TradeSide enum)
export enum TradeSide {
  SIDE_UNSPECIFIED = 0,
  BUY = 1,
  SELL = 2,
}

// Trading pair (matches proto TradingPair message)
export interface TradingPair {
  base: string;
  quote: string;
}

// Ticker data (matches proto TickerData message)
export interface TickerData {
  exchange: Exchange;
  pair: TradingPair;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
  exchangeTimestamp?: string;
}

// Trade data (matches proto TradeData message)
export interface TradeData {
  exchange: Exchange;
  pair: TradingPair;
  tradeId: string;
  price: number;
  amount: number;
  side: TradeSide;
  timestamp: number;
  quoteAmount?: number;
}

// Service metrics (matches proto MetricsResponse message)
export interface ServiceMetrics {
  messagesReceived: number;
  tickersProcessed: number;
  tradesProcessed: number;
  orderBooksProcessed: number;
  activeConnections: number;
  uptimeSeconds: number;
}

// Exchange info (matches proto ExchangeInfoResponse message)
export interface ExchangeInfo {
  exchange: Exchange;
  name: string;
  restEndpoint: string;
  grpcEndpoint: string;
  availablePairs: TradingPair[];
  makerFeePercent: number;
  takerFeePercent: number;
  isConnected: boolean;
  lastUpdate: number;
}

/**
 * Exchange gRPC Service
 *
 * Provides type-safe access to crypto exchange data via gRPC-compatible HTTP/2.
 */
class ExchangeGrpcService {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, ((data: TickerData) => void)[]> = new Map();

  // ==========================================================================
  // Unary RPCs (Single request/response)
  // ==========================================================================

  /**
   * Get ticker data for a trading pair
   * gRPC equivalent: rpc GetTicker(TickerRequest) returns (TickerResponse)
   */
  async getTicker(exchange: CryptoExchangeName, pair: TradingPair): Promise<TickerData> {
    const pairStr = `${pair.base}-${pair.quote}`;
    const response = await fetch(`${GRPC_ENDPOINT}/${exchange}/ticker/${pairStr}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ticker: ${response.statusText}`);
    }

    const data = await response.json();
    return this.convertToTickerData(data, exchange, pair);
  }

  /**
   * Get multiple tickers from an exchange
   * gRPC equivalent: Batched GetTicker calls
   */
  async getMultipleTickers(exchange: CryptoExchangeName, pairs: TradingPair[]): Promise<TickerData[]> {
    const pairsStr = pairs.map(p => `${p.base}-${p.quote}`).join(',');
    const response = await fetch(`${GRPC_ENDPOINT}/${exchange}/tickers?pairs=${pairsStr}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tickers: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tickers?.map((t: any) => this.convertToTickerData(t, exchange, {
      base: t.pair?.split('/')[0] || '',
      quote: t.pair?.split('/')[1] || '',
    })) || [];
  }

  /**
   * Get exchange info
   * gRPC equivalent: rpc GetExchangeInfo(ExchangeInfoRequest) returns (ExchangeInfoResponse)
   */
  async getExchangeInfo(exchange: CryptoExchangeName): Promise<ExchangeInfo> {
    const response = await fetch(`${GRPC_ENDPOINT}/${exchange}/info`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get service metrics
   * gRPC equivalent: rpc GetServiceMetrics(MetricsRequest) returns (MetricsResponse)
   */
  async getServiceMetrics(): Promise<ServiceMetrics> {
    const response = await fetch(`${GRPC_ENDPOINT}/metrics`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    return response.json();
  }

  // ==========================================================================
  // Streaming RPCs (Server-side streaming via polling)
  // ==========================================================================

  /**
   * Stream ticker updates (HTTP/2 polling implementation)
   * gRPC equivalent: rpc StreamTickers(TickerStreamRequest) returns (stream TickerData)
   *
   * Note: This uses polling as a fallback. When gRPC-Web is integrated,
   * this will use server streaming with Envoy proxy.
   */
  streamTickers(
    exchange: CryptoExchangeName,
    pairs: TradingPair[],
    onData: (ticker: TickerData) => void,
    intervalMs: number = 1000
  ): () => void {
    const key = `${exchange}:${pairs.map(p => `${p.base}/${p.quote}`).join(',')}`;

    // Add listener
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(onData);

    // Start polling if not already running
    if (!this.pollingIntervals.has(key)) {
      const poll = async () => {
        try {
          const tickers = await this.getMultipleTickers(exchange, pairs);
          const listeners = this.listeners.get(key) || [];
          tickers.forEach(ticker => {
            listeners.forEach(listener => listener(ticker));
          });
        } catch (error) {
          console.error(`Error polling ${exchange}:`, error);
        }
      };

      // Initial poll
      poll();

      // Set up interval
      const interval = setInterval(poll, intervalMs);
      this.pollingIntervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key) || [];
      const index = listeners.indexOf(onData);
      if (index > -1) {
        listeners.splice(index, 1);
      }

      // Stop polling if no more listeners
      if (listeners.length === 0) {
        const interval = this.pollingIntervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(key);
        }
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Connect to exchange for streaming
   * gRPC equivalent: Part of subscription management
   */
  async connectToExchange(exchange: CryptoExchangeName, pairs: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${GRPC_ENDPOINT}/${exchange}/connect`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pairs }),
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to connect to ${exchange}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from exchange
   */
  async disconnectFromExchange(exchange: CryptoExchangeName): Promise<boolean> {
    try {
      const response = await fetch(`${GRPC_ENDPOINT}/${exchange}/disconnect`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to disconnect from ${exchange}:`, error);
      return false;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private convertToTickerData(
    data: any,
    exchange: CryptoExchangeName,
    pair: TradingPair
  ): TickerData {
    return {
      exchange: this.exchangeNameToEnum(exchange),
      pair,
      lastPrice: data.lastPrice || data.last_price || data.ticker?.lastPrice || 0,
      bidPrice: data.bidPrice || data.bid_price || data.ticker?.bidPrice || 0,
      askPrice: data.askPrice || data.ask_price || data.ticker?.askPrice || 0,
      volume24h: data.volume24h || data.volume_24h || data.ticker?.volume24h || 0,
      high24h: data.high24h || data.high_24h || data.ticker?.high24h || 0,
      low24h: data.low24h || data.low_24h || data.ticker?.low24h || 0,
      change24h: data.change24h || data.change_24h || data.ticker?.change24h || 0,
      changePercent24h: data.changePercent24h || data.change_percent_24h || data.ticker?.changePercent24h || 0,
      timestamp: data.timestamp || Date.now(),
      exchangeTimestamp: data.exchangeTimestamp || data.exchange_timestamp,
    };
  }

  private exchangeNameToEnum(name: CryptoExchangeName): Exchange {
    switch (name) {
      case 'binance': return Exchange.BINANCE;
      case 'coinbase': return Exchange.COINBASE;
      case 'kraken': return Exchange.KRAKEN;
      case 'okx': return Exchange.OKX;
      case 'bybit': return Exchange.BYBIT;
      case 'huobi': return Exchange.HUOBI;
      default: return Exchange.EXCHANGE_UNSPECIFIED;
    }
  }

  /**
   * Convert TickerData to CryptoExchangeData format for compatibility
   */
  toExchangeData(ticker: TickerData): CryptoExchangeData {
    const exchangeName = this.enumToExchangeName(ticker.exchange);
    const pair = `${ticker.pair.base}/${ticker.pair.quote}`;

    return {
      ticker: {
        exchange: exchangeName,
        pair,
        lastPrice: ticker.lastPrice,
        bidPrice: ticker.bidPrice,
        askPrice: ticker.askPrice,
        volume24h: ticker.volume24h,
        high24h: ticker.high24h,
        low24h: ticker.low24h,
        change24h: ticker.change24h,
        changePercent24h: ticker.changePercent24h,
        timestamp: new Date(ticker.timestamp).toISOString(),
      },
    };
  }

  private enumToExchangeName(exchange: Exchange): CryptoExchangeName {
    switch (exchange) {
      case Exchange.BINANCE: return 'binance';
      case Exchange.COINBASE: return 'coinbase';
      case Exchange.KRAKEN: return 'kraken';
      case Exchange.OKX: return 'okx';
      case Exchange.BYBIT: return 'bybit';
      case Exchange.HUOBI: return 'huobi';
      default: return 'binance';
    }
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const exchangeGrpcService = new ExchangeGrpcService();
export default ExchangeGrpcService;
