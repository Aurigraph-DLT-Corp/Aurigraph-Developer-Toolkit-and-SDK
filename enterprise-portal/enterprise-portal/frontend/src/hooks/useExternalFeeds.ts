/**
 * useExternalFeeds Hook
 *
 * Custom React hooks for external data feeds (Alpaca, Weather, Twitter, CoinGecko)
 * Provides data fetching with loading, error, and success states
 *
 * Usage:
 * const { data, loading, error, refetch } = useStockData(['AAPL', 'GOOGL']);
 * const { data, loading, error } = useWeatherData({ location: 'New York' });
 * const { data, loading, error } = useCryptoData(['bitcoin', 'ethereum']);
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAlpacaClient,
  getWeatherClient,
  getTwitterClient,
  getCoinGeckoClient,
  type AlpacaBarsParams,
  type WeatherParams,
  type TwitterSearchParams,
  type SimplePriceParams,
  type CoinPrice,
} from '../services';
import type {
  AlpacaStockQuote,
  AlpacaStockBar,
  WeatherApiResponse,
  TwitterApiResponse,
} from '../types/api';

/**
 * Base hook result interface
 */
interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching stock quotes from Alpaca
 *
 * @param symbols - Array of stock symbols (e.g., ['AAPL', 'GOOGL'])
 * @param options - Hook options (enabled, pollingInterval)
 */
export const useStockQuotes = (
  symbols: string[],
  options?: { enabled?: boolean; pollingInterval?: number }
): UseQueryResult<Record<string, AlpacaStockQuote>> => {
  const [data, setData] = useState<Record<string, AlpacaStockQuote> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbols || symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getAlpacaClient();
      const result = await client.getLatestQuotes({ symbols });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stock quotes'));
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (options?.enabled === false) return undefined;

    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.enabled, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching stock bars (candlestick data) from Alpaca
 *
 * @param params - Bar parameters (symbols, timeframe, etc.)
 */
export const useStockBars = (
  params: AlpacaBarsParams
): UseQueryResult<Record<string, AlpacaStockBar[]>> => {
  const [data, setData] = useState<Record<string, AlpacaStockBar[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params.symbols || params.symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getAlpacaClient();
      const result = await client.getBars(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stock bars'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching weather data from OpenWeatherMap
 *
 * @param params - Weather query parameters (location or coordinates)
 * @param options - Hook options (pollingInterval)
 */
export const useWeatherData = (
  params: WeatherParams,
  options?: { pollingInterval?: number }
): UseQueryResult<WeatherApiResponse> => {
  const [data, setData] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getWeatherClient();
      const result = await client.getCurrentWeather(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch weather data'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for searching tweets from Twitter
 *
 * @param params - Twitter search parameters
 */
export const useTwitterSearch = (
  params: TwitterSearchParams
): UseQueryResult<TwitterApiResponse> => {
  const [data, setData] = useState<TwitterApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!params.query) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getTwitterClient();
      const result = await client.searchRecentTweets(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tweets'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching cryptocurrency prices from CoinGecko
 *
 * @param coinIds - Array of coin IDs (e.g., ['bitcoin', 'ethereum'])
 * @param options - Hook options (vsCurrencies, pollingInterval)
 */
export const useCryptoPrice = (
  coinIds: string[],
  options?: {
    vsCurrencies?: string[];
    includeMarketCap?: boolean;
    include24hrVol?: boolean;
    include24hrChange?: boolean;
    pollingInterval?: number;
  }
): UseQueryResult<Record<string, Record<string, number>>> => {
  const [data, setData] = useState<Record<string, Record<string, number>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!coinIds || coinIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getCoinGeckoClient();
      const params: SimplePriceParams = {
        ids: coinIds,
        vsCurrencies: options?.vsCurrencies,
        includeMarketCap: options?.includeMarketCap,
        include24hrVol: options?.include24hrVol,
        include24hrChange: options?.include24hrChange,
      };
      const result = await client.getSimplePrice(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch crypto prices'));
    } finally {
      setLoading(false);
    }
  }, [coinIds, options]);

  useEffect(() => {
    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching detailed cryptocurrency market data from CoinGecko
 *
 * @param coinIds - Optional array of coin IDs to filter
 * @param options - Hook options (vsCurrency, perPage, page)
 */
export const useCryptoMarkets = (
  coinIds?: string[],
  options?: {
    vsCurrency?: string;
    perPage?: number;
    page?: number;
  }
): UseQueryResult<CoinPrice[]> => {
  const [data, setData] = useState<CoinPrice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getCoinGeckoClient();
      const result = await client.getCoinMarkets(
        options?.vsCurrency,
        coinIds,
        options?.perPage,
        options?.page
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch crypto markets'));
    } finally {
      setLoading(false);
    }
  }, [coinIds, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Combined hook for stock data (quotes and simple stats)
 * Convenience hook for common use case
 */
export const useStockData = (
  symbols: string[],
  options?: { pollingInterval?: number }
) => {
  const quotes = useStockQuotes(symbols, options);

  return {
    quotes: quotes.data,
    loading: quotes.loading,
    error: quotes.error,
    refetch: quotes.refetch,
  };
};

/**
 * Combined hook for crypto data (prices and market info)
 * Convenience hook for common use case
 */
export const useCryptoData = (
  coinIds: string[],
  options?: {
    vsCurrencies?: string[];
    pollingInterval?: number;
  }
) => {
  const prices = useCryptoPrice(coinIds, {
    ...options,
    includeMarketCap: true,
    include24hrVol: true,
    include24hrChange: true,
  });

  return {
    prices: prices.data,
    loading: prices.loading,
    error: prices.error,
    refetch: prices.refetch,
  };
};

export default {
  useStockQuotes,
  useStockBars,
  useStockData,
  useWeatherData,
  useTwitterSearch,
  useCryptoPrice,
  useCryptoMarkets,
  useCryptoData,
};
