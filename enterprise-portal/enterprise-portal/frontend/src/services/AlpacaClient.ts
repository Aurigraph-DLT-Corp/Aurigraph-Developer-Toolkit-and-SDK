/**
 * Alpaca Markets API Client
 *
 * REST API client for Alpaca Markets stock data with retry logic and rate limiting
 *
 * @see https://alpaca.markets/docs/api-references/market-data-api/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { AlpacaStockQuote, AlpacaStockBar } from '../types/api';

export interface AlpacaClientConfig {
  baseUrl?: string;
  apiKey: string;
  secretKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AlpacaQuoteParams {
  symbols: string[];
  feed?: 'iex' | 'sip';
}

export interface AlpacaBarsParams {
  symbols: string[];
  timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
  start?: string; // ISO 8601 format
  end?: string; // ISO 8601 format
  limit?: number;
  feed?: 'iex' | 'sip';
}

/**
 * Alpaca Markets API Client
 */
export class AlpacaClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;
  private lastRequestTime: number = 0;
  private readonly rateLimitPerMinute: number = 200; // requests per minute

  constructor(config: AlpacaClientConfig) {
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.client = axios.create({
      baseURL: config.baseUrl ?? 'https://data.alpaca.markets',
      timeout: config.timeout ?? 10000,
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.secretKey,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Alpaca API Error:', error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Rate limiting - wait if necessary to avoid exceeding API limits
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / this.rateLimitPerMinute; // ms between requests

    if (timeSinceLastRequest < minInterval) {
      await new Promise((resolve) => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<T> {
    await this.applyRateLimit();

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await this.client.get<T>(url, { params });
        return response.data;
      } catch (error) {
        if (attempt < this.retryAttempts - 1) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
          );
        } else {
          throw error;
        }
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  /**
   * Get latest quotes for symbols
   *
   * @param params - Quote parameters
   * @returns Latest quotes for requested symbols
   */
  async getLatestQuotes(params: AlpacaQuoteParams): Promise<Record<string, AlpacaStockQuote>> {
    const symbols = params.symbols.join(',');
    const response = await this.fetchWithRetry<{ quotes: Record<string, any> }>(
      '/v2/stocks/quotes/latest',
      {
        symbols,
        feed: params.feed ?? 'iex',
      }
    );

    // Transform response to match our interface
    const quotes: Record<string, AlpacaStockQuote> = {};
    for (const [symbol, data] of Object.entries(response.quotes)) {
      quotes[symbol] = {
        symbol,
        ask: data.ap,
        askSize: data.as,
        bid: data.bp,
        bidSize: data.bs,
        timestamp: data.t,
      };
    }

    return quotes;
  }

  /**
   * Get historical bars (candlestick data) for symbols
   *
   * @param params - Bars parameters
   * @returns Historical bar data for requested symbols
   */
  async getBars(params: AlpacaBarsParams): Promise<Record<string, AlpacaStockBar[]>> {
    const symbols = params.symbols.join(',');
    const response = await this.fetchWithRetry<{ bars: Record<string, any[]> }>(
      '/v2/stocks/bars',
      {
        symbols,
        timeframe: params.timeframe,
        start: params.start,
        end: params.end,
        limit: params.limit ?? 100,
        feed: params.feed ?? 'iex',
      }
    );

    // Transform response to match our interface
    const bars: Record<string, AlpacaStockBar[]> = {};
    for (const [symbol, barData] of Object.entries(response.bars)) {
      bars[symbol] = barData.map((bar) => ({
        symbol,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        timestamp: bar.t,
      }));
    }

    return bars;
  }

  /**
   * Get latest trade for a symbol
   *
   * @param symbol - Stock symbol
   * @returns Latest trade data
   */
  async getLatestTrade(symbol: string): Promise<any> {
    return this.fetchWithRetry(`/v2/stocks/${symbol}/trades/latest`);
  }

  /**
   * Get snapshot for symbols (quote, trade, bars)
   *
   * @param symbols - Stock symbols
   * @returns Snapshot data for requested symbols
   */
  async getSnapshots(symbols: string[]): Promise<Record<string, any>> {
    const symbolsStr = symbols.join(',');
    return this.fetchWithRetry(`/v2/stocks/snapshots`, { symbols: symbolsStr });
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data || error.message;

      switch (status) {
        case 401:
          return new Error('Alpaca API: Unauthorized - check your API keys');
        case 403:
          return new Error('Alpaca API: Forbidden - insufficient permissions');
        case 429:
          return new Error('Alpaca API: Rate limit exceeded - try again later');
        case 500:
          return new Error('Alpaca API: Internal server error');
        default:
          return new Error(`Alpaca API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      return new Error('Alpaca API: No response from server - check your network connection');
    } else {
      // Error setting up request
      return new Error(`Alpaca API: ${error.message}`);
    }
  }
}

// Export singleton instance (requires configuration)
let alpacaClientInstance: AlpacaClient | null = null;

export const initializeAlpacaClient = (config: AlpacaClientConfig): AlpacaClient => {
  alpacaClientInstance = new AlpacaClient(config);
  return alpacaClientInstance;
};

export const getAlpacaClient = (): AlpacaClient => {
  if (!alpacaClientInstance) {
    throw new Error('AlpacaClient not initialized. Call initializeAlpacaClient first.');
  }
  return alpacaClientInstance;
};

export default AlpacaClient;
