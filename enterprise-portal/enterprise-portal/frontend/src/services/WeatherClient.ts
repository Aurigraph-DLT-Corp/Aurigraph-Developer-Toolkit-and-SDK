/**
 * OpenWeatherMap API Client
 *
 * REST API client for OpenWeatherMap weather data with retry logic and caching
 *
 * @see https://openweathermap.org/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { WeatherApiResponse } from '../types/api';

export interface WeatherClientConfig {
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheTimeout?: number; // Cache timeout in milliseconds
}

export interface WeatherParams {
  location?: string; // City name
  lat?: number; // Latitude
  lon?: number; // Longitude
  units?: 'metric' | 'imperial' | 'standard';
  lang?: string;
}

interface CacheEntry {
  data: WeatherApiResponse;
  timestamp: number;
}

/**
 * OpenWeatherMap API Client
 */
export class WeatherClient {
  private client: AxiosInstance;
  private apiKey: string;
  private retryAttempts: number;
  private retryDelay: number;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout: number;
  private lastRequestTime: number = 0;
  private readonly rateLimitPerMinute: number = 60; // requests per minute

  constructor(config: WeatherClientConfig) {
    this.apiKey = config.apiKey;
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.cacheTimeout = config.cacheTimeout ?? 5 * 60 * 1000; // 5 minutes default

    this.client = axios.create({
      baseURL: config.baseUrl ?? 'https://api.openweathermap.org/data/2.5',
      timeout: config.timeout ?? 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Weather API Error:', error.message);
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
  private getCacheKey(params: WeatherParams): string {
    if (params.lat && params.lon) {
      return `${params.lat},${params.lon}`;
    }
    return params.location || 'default';
  }

  /**
   * Check if cached data is still valid
   */
  private getCachedData(key: string): WeatherApiResponse | null {
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
  private setCachedData(key: string, data: WeatherApiResponse): void {
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
    params?: Record<string, any>
  ): Promise<T> {
    await this.applyRateLimit();

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await this.client.get<T>(url, {
          params: {
            ...params,
            appid: this.apiKey,
          },
        });
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
   * Get current weather data
   *
   * @param params - Weather query parameters
   * @returns Current weather data
   */
  async getCurrentWeather(params: WeatherParams): Promise<WeatherApiResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Build query parameters
    const queryParams: Record<string, any> = {
      units: params.units ?? 'metric',
      lang: params.lang ?? 'en',
    };

    if (params.lat !== undefined && params.lon !== undefined) {
      queryParams.lat = params.lat;
      queryParams.lon = params.lon;
    } else if (params.location) {
      queryParams.q = params.location;
    } else {
      throw new Error('Either location name or coordinates (lat, lon) must be provided');
    }

    // Fetch data
    const response = await this.fetchWithRetry<any>('/weather', queryParams);

    // Transform response to match our interface
    const weatherData: WeatherApiResponse = {
      location: {
        name: response.name,
        country: response.sys.country,
        lat: response.coord.lat,
        lon: response.coord.lon,
      },
      current: {
        temp: response.main.temp,
        feels_like: response.main.feels_like,
        humidity: response.main.humidity,
        pressure: response.main.pressure,
        wind_speed: response.wind.speed,
        wind_deg: response.wind.deg,
        clouds: response.clouds.all,
        weather: response.weather,
      },
      timestamp: new Date(response.dt * 1000).toISOString(),
    };

    // Cache the data
    this.setCachedData(cacheKey, weatherData);

    return weatherData;
  }

  /**
   * Get weather forecast
   *
   * @param params - Weather query parameters
   * @returns Weather forecast data (5 day / 3 hour)
   */
  async getForecast(params: WeatherParams): Promise<any> {
    const queryParams: Record<string, any> = {
      units: params.units ?? 'metric',
      lang: params.lang ?? 'en',
    };

    if (params.lat !== undefined && params.lon !== undefined) {
      queryParams.lat = params.lat;
      queryParams.lon = params.lon;
    } else if (params.location) {
      queryParams.q = params.location;
    } else {
      throw new Error('Either location name or coordinates (lat, lon) must be provided');
    }

    return this.fetchWithRetry('/forecast', queryParams);
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
          return new Error('Weather API: Unauthorized - check your API key');
        case 404:
          return new Error('Weather API: Location not found');
        case 429:
          return new Error('Weather API: Rate limit exceeded - try again later');
        case 500:
          return new Error('Weather API: Internal server error');
        default:
          return new Error(`Weather API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      return new Error('Weather API: No response from server - check your network connection');
    } else {
      // Error setting up request
      return new Error(`Weather API: ${error.message}`);
    }
  }
}

// Export singleton instance (requires configuration)
let weatherClientInstance: WeatherClient | null = null;

export const initializeWeatherClient = (config: WeatherClientConfig): WeatherClient => {
  weatherClientInstance = new WeatherClient(config);
  return weatherClientInstance;
};

export const getWeatherClient = (): WeatherClient => {
  if (!weatherClientInstance) {
    throw new Error('WeatherClient not initialized. Call initializeWeatherClient first.');
  }
  return weatherClientInstance;
};

export default WeatherClient;
