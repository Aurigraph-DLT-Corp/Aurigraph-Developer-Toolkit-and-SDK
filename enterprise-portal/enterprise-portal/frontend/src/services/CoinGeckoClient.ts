/**
 * CoinGecko API Client
 *
 * REST API client for CoinGecko cryptocurrency price data with retry logic and caching
 *
 * @see https://www.coingecko.com/en/api/documentation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface CoinGeckoClientConfig {
  baseUrl?: string;
  apiKey?: string; // Optional - for Pro API
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheTimeout?: number; // Cache timeout in milliseconds
}

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_date: string;
  last_updated: string;
}

export interface SimplePriceParams {
  ids: string[]; // Coin IDs (e.g., ['bitcoin', 'ethereum'])
  vsCurrencies?: string[]; // Default: ['usd']
  includeMarketCap?: boolean;
  include24hrVol?: boolean;
  include24hrChange?: boolean;
  includeLastUpdatedAt?: boolean;
}

export interface MarketChartParams {
  coinId: string;
  vsCurrency?: string; // Default: 'usd'
  days: number | 'max'; // 1, 7, 14, 30, 90, 180, 365, 'max'
  interval?: 'daily'; // Optional - auto-granularity if not specified
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * CoinGecko API Client
 */
export class CoinGeckoClient {
  private client: AxiosInstance;
  private retryAttempts: number;
  private retryDelay: number;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout: number;
  private lastRequestTime: number = 0;
  private readonly rateLimitPerMinute: number = 10; // requests per minute for free tier

  constructor(config: CoinGeckoClientConfig) {
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.cacheTimeout = config.cacheTimeout ?? 2 * 60 * 1000; // 2 minutes default

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided (for Pro tier)
    if (config.apiKey) {
      headers['x-cg-pro-api-key'] = config.apiKey;
    }

    this.client = axios.create({
      baseURL: config.baseUrl ?? 'https://api.coingecko.com/api/v3',
      timeout: config.timeout ?? 10000,
      headers,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('CoinGecko API Error:', error.message);
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
   * Get cache key for request
   */
  private getCacheKey(url: string, params?: Record<string, any>): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  /**
   * Check if cached data is still valid
   */
  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    params?: Record<string, any>,
    useCache: boolean = true
  ): Promise<T> {
    // Check cache first if enabled
    if (useCache) {
      const cacheKey = this.getCacheKey(url, params);
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    await this.applyRateLimit();

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await this.client.get<T>(url, { params });

        // Cache the response if caching is enabled
        if (useCache) {
          const cacheKey = this.getCacheKey(url, params);
          this.setCachedData(cacheKey, response.data);
        }

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
   * Get simple price data for coins
   *
   * @param params - Price query parameters
   * @returns Price data for requested coins
   */
  async getSimplePrice(params: SimplePriceParams): Promise<Record<string, Record<string, number>>> {
    const queryParams: Record<string, any> = {
      ids: params.ids.join(','),
      vs_currencies: (params.vsCurrencies ?? ['usd']).join(','),
      include_market_cap: params.includeMarketCap ?? false,
      include_24hr_vol: params.include24hrVol ?? false,
      include_24hr_change: params.include24hrChange ?? false,
      include_last_updated_at: params.includeLastUpdatedAt ?? false,
    };

    return this.fetchWithRetry('/simple/price', queryParams);
  }

  /**
   * Get detailed coin market data
   *
   * @param vsCurrency - Target currency (default: 'usd')
   * @param coinIds - Optional array of coin IDs to filter
   * @param perPage - Results per page (max 250)
   * @param page - Page number
   * @returns Array of coin market data
   */
  async getCoinMarkets(
    vsCurrency: string = 'usd',
    coinIds?: string[],
    perPage: number = 100,
    page: number = 1
  ): Promise<CoinPrice[]> {
    const params: Record<string, any> = {
      vs_currency: vsCurrency,
      per_page: perPage,
      page,
      order: 'market_cap_desc',
      sparkline: false,
    };

    if (coinIds && coinIds.length > 0) {
      params.ids = coinIds.join(',');
    }

    return this.fetchWithRetry('/coins/markets', params);
  }

  /**
   * Get historical market data for a coin
   *
   * @param params - Market chart parameters
   * @returns Historical price, market cap, and volume data
   */
  async getMarketChart(params: MarketChartParams): Promise<{
    prices: [number, number][]; // [timestamp, price]
    market_caps: [number, number][];
    total_volumes: [number, number][];
  }> {
    const queryParams: Record<string, any> = {
      vs_currency: params.vsCurrency ?? 'usd',
      days: params.days.toString(),
    };

    if (params.interval) {
      queryParams.interval = params.interval;
    }

    return this.fetchWithRetry(
      `/coins/${params.coinId}/market_chart`,
      queryParams,
      false // Don't cache historical data
    );
  }

  /**
   * Get detailed coin data
   *
   * @param coinId - Coin ID
   * @returns Detailed coin information
   */
  async getCoinDetails(coinId: string): Promise<any> {
    return this.fetchWithRetry(`/coins/${coinId}`, {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    });
  }

  /**
   * Get list of all supported coins
   *
   * @returns List of coins with id, symbol, and name
   */
  async getCoinsList(): Promise<Array<{ id: string; symbol: string; name: string }>> {
    return this.fetchWithRetry('/coins/list');
  }

  /**
   * Search for coins, categories, and markets
   *
   * @param query - Search query
   * @returns Search results
   */
  async search(query: string): Promise<any> {
    return this.fetchWithRetry('/search', { query }, false);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
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
          return new Error('CoinGecko API: Unauthorized - check your API key');
        case 404:
          return new Error('CoinGecko API: Coin not found');
        case 429:
          return new Error('CoinGecko API: Rate limit exceeded - try again later');
        case 500:
          return new Error('CoinGecko API: Internal server error');
        default:
          return new Error(`CoinGecko API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      return new Error('CoinGecko API: No response from server - check your network connection');
    } else {
      // Error setting up request
      return new Error(`CoinGecko API: ${error.message}`);
    }
  }
}

// Export singleton instance (requires configuration)
let coinGeckoClientInstance: CoinGeckoClient | null = null;

export const initializeCoinGeckoClient = (config: CoinGeckoClientConfig = {}): CoinGeckoClient => {
  coinGeckoClientInstance = new CoinGeckoClient(config);
  return coinGeckoClientInstance;
};

export const getCoinGeckoClient = (): CoinGeckoClient => {
  if (!coinGeckoClientInstance) {
    throw new Error('CoinGeckoClient not initialized. Call initializeCoinGeckoClient first.');
  }
  return coinGeckoClientInstance;
};

export default CoinGeckoClient;
