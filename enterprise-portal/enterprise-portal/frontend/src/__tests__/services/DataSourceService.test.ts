/**
 * Data Source Service Tests
 *
 * Tests for DataSourceService including external API integrations,
 * mock fallbacks, rate limiting, and data transformation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DataSourceService from '../../services/DataSourceService';
import type {
  WeatherDataSource,
  AlpacaDataSource,
  NewsDataSource,
  TwitterDataSource,
  CryptoDataSource,
  CryptoExchangeDataSource,
  WeatherData,
  AlpacaData,
  NewsData,
  TwitterData,
  CryptoData,
  CryptoExchangeData,
} from '../../types/dataSources';

describe('DataSourceService', () => {
  let service: DataSourceService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    service = new DataSourceService(false); // Start with real mode
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Demo Mode', () => {
    it('should initialize in demo mode by default', () => {
      const demoService = new DataSourceService();
      expect(demoService).toBeDefined();
    });

    it('should allow toggling demo mode', () => {
      expect(service).toBeDefined();
      service.setDemoMode(true);
      expect(service).toBeDefined();
      service.setDemoMode(false);
      expect(service).toBeDefined();
    });

    it('should return mock data in demo mode', async () => {
      service.setDemoMode(true);

      const weatherSource: WeatherDataSource = {
        type: 'weather',
        location: 'New York',
        units: 'metric',
      };

      const result = await service.fetchData(weatherSource);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('humidity');
    });
  });

  describe('Weather Data', () => {
    it('should fetch weather data successfully', async () => {
      const mockWeatherResponse = {
        name: 'New York',
        main: {
          temp: 20.5,
          humidity: 65,
          pressure: 1013,
        },
        wind: {
          speed: 5.5,
        },
        weather: [
          {
            main: 'Clear',
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      });

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'New York',
        units: 'metric',
      };

      const result = (await service.fetchData(dataSource)) as WeatherData;

      expect(result.location).toBe('New York');
      expect(result.temperature).toBe(20.5);
      expect(result.humidity).toBe(65);
      expect(result.condition).toBe('Clear');
    });

    it('should fallback to mock data when API key is missing', async () => {
      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'London',
        units: 'metric',
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = (await service.fetchData(dataSource)) as WeatherData;

      expect(result).toBeDefined();
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('temperature');

      consoleSpy.mockRestore();
    });

    it('should handle weather API errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API Error'));

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'Paris',
        units: 'metric',
      };

      const result = (await service.fetchData(dataSource)) as WeatherData;

      // Should fallback to mock data
      expect(result).toBeDefined();
      expect(result).toHaveProperty('location');
    });
  });

  describe('Alpaca Stock Data', () => {
    it('should fetch Alpaca stock data successfully', async () => {
      const mockQuoteResponse = {
        quote: {
          ap: 150.25,
          bp: 150.20,
          t: '2025-01-01T00:00:00Z',
        },
      };

      const mockSnapshotResponse = {
        dailyBar: {
          c: 150.25,
          o: 148.00,
          v: 1000000,
        },
        prevDailyBar: {
          c: 148.00,
        },
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuoteResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSnapshotResponse,
        });

      const dataSource: AlpacaDataSource = {
        type: 'alpaca',
        symbols: ['AAPL'],
      };

      const result = (await service.fetchData(dataSource)) as AlpacaData;

      expect(result.symbol).toBe('AAPL');
      expect(result.price).toBe(150.25);
      expect(result.volume).toBe(1000000);
      expect(result.change).toBeCloseTo(2.25, 2);
    });

    it('should fallback to mock data when API credentials are missing', async () => {
      const dataSource: AlpacaDataSource = {
        type: 'alpaca',
        symbols: ['GOOGL'],
      };

      const result = (await service.fetchData(dataSource)) as AlpacaData;

      expect(result).toBeDefined();
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('price');
    });
  });

  describe('News Data', () => {
    it('should fetch news data successfully', async () => {
      const mockNewsResponse = {
        articles: [
          {
            title: 'Markets surge on positive economic data',
            description: 'Stock markets rally as economic indicators improve',
            source: { name: 'Reuters' },
            url: 'https://example.com/article',
            publishedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsResponse,
      });

      const dataSource: NewsDataSource = {
        type: 'newsapi',
        query: 'blockchain',
        language: 'en',
      };

      const result = (await service.fetchData(dataSource)) as NewsData;

      expect(result.title).toBe('Markets surge on positive economic data');
      expect(result.source).toBe('Reuters');
      expect(result.sentiment).toBe('positive'); // Based on keywords
    });

    it('should analyze sentiment correctly', async () => {
      const mockNewsResponse = {
        articles: [
          {
            title: 'Market crash raises concerns',
            description: 'Bearish trends dominate trading',
            source: { name: 'Bloomberg' },
            url: 'https://example.com/article',
            publishedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsResponse,
      });

      const dataSource: NewsDataSource = {
        type: 'newsapi',
        query: 'stocks',
        language: 'en',
      };

      const result = (await service.fetchData(dataSource)) as NewsData;

      expect(result.sentiment).toBe('negative'); // Based on keywords
    });

    it('should handle empty news results', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [] }),
      });

      const dataSource: NewsDataSource = {
        type: 'newsapi',
        query: 'xyz123',
        language: 'en',
      };

      const result = (await service.fetchData(dataSource)) as NewsData;

      // Should fallback to mock data
      expect(result).toBeDefined();
    });
  });

  describe('Twitter Data', () => {
    it('should fetch Twitter data successfully', async () => {
      const mockTwitterResponse = {
        data: [
          {
            id: '123456',
            text: 'Exciting developments in blockchain technology!',
            created_at: '2025-01-01T00:00:00Z',
            author_id: 'user123',
            public_metrics: {
              like_count: 1000,
              retweet_count: 500,
            },
          },
        ],
        includes: {
          users: [
            {
              id: 'user123',
              username: 'TechNews',
            },
          ],
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTwitterResponse,
      });

      const dataSource: TwitterDataSource = {
        type: 'twitter',
        keywords: ['blockchain'],
      };

      const result = (await service.fetchData(dataSource)) as TwitterData;

      expect(result.id).toBe('123456');
      expect(result.text).toBe('Exciting developments in blockchain technology!');
      expect(result.author).toBe('@TechNews');
      expect(result.likes).toBe(1000);
      expect(result.sentiment).toBe('positive');
    });

    it('should fallback when bearer token is missing', async () => {
      const dataSource: TwitterDataSource = {
        type: 'twitter',
        keywords: ['crypto'],
      };

      const result = (await service.fetchData(dataSource)) as TwitterData;

      expect(result).toBeDefined();
      expect(result).toHaveProperty('text');
    });
  });

  describe('Crypto Data', () => {
    it('should fetch crypto data from CoinGecko successfully', async () => {
      const mockCryptoResponse = {
        bitcoin: {
          usd: 45000,
          usd_market_cap: 850000000000,
          usd_24h_vol: 25000000000,
          usd_24h_change: 2.5,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCryptoResponse,
      });

      const dataSource: CryptoDataSource = {
        type: 'crypto',
        symbols: ['bitcoin'],
        currency: 'usd',
      };

      const result = (await service.fetchData(dataSource)) as CryptoData;

      expect(result.symbol).toBe('BITCOIN');
      expect(result.price).toBe(45000);
      expect(result.marketCap).toBe(850000000000);
      expect(result.change24h).toBe(2.5);
    });

    it('should work without API key (free tier)', async () => {
      const mockCryptoResponse = {
        ethereum: {
          usd: 3000,
          usd_market_cap: 350000000000,
          usd_24h_vol: 15000000000,
          usd_24h_change: -1.5,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCryptoResponse,
      });

      const dataSource: CryptoDataSource = {
        type: 'crypto',
        symbols: ['ethereum'],
        currency: 'usd',
      };

      const result = (await service.fetchData(dataSource)) as CryptoData;

      expect(result.symbol).toBe('ETHEREUM');
      expect(result.price).toBe(3000);
    });
  });

  describe('Crypto Exchange Data', () => {
    it('should fetch Binance data successfully', async () => {
      const mockTickerResponse = {
        lastPrice: '97500.00',
        bidPrice: '97499.00',
        askPrice: '97501.00',
        volume: '25000',
        highPrice: '98000.00',
        lowPrice: '97000.00',
        priceChange: '500.00',
        priceChangePercent: '0.52',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTickerResponse,
      });

      const dataSource: CryptoExchangeDataSource = {
        type: 'crypto-exchange',
        exchangeName: 'binance',
        tradingPairs: ['BTC/USDT'],
        includeOrderBook: false,
        includeTradeHistory: false,
      };

      const result = (await service.fetchData(dataSource)) as CryptoExchangeData;

      expect(result.ticker).toBeDefined();
      expect(result.ticker.exchange).toBe('binance');
      expect(result.ticker.pair).toBe('BTC/USDT');
      expect(result.ticker.lastPrice).toBe(97500);
    });

    it('should fetch Binance with order book', async () => {
      const mockTickerResponse = {
        lastPrice: '97500.00',
        bidPrice: '97499.00',
        askPrice: '97501.00',
        volume: '25000',
        highPrice: '98000.00',
        lowPrice: '97000.00',
        priceChange: '500.00',
        priceChangePercent: '0.52',
      };

      const mockOrderBookResponse = {
        bids: [
          ['97499.00', '1.5'],
          ['97498.00', '2.0'],
        ],
        asks: [
          ['97501.00', '1.8'],
          ['97502.00', '2.2'],
        ],
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTickerResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrderBookResponse,
        });

      const dataSource: CryptoExchangeDataSource = {
        type: 'crypto-exchange',
        exchangeName: 'binance',
        tradingPairs: ['BTC/USDT'],
        includeOrderBook: true,
        includeTradeHistory: false,
      };

      const result = (await service.fetchData(dataSource)) as CryptoExchangeData;

      expect(result.orderBook).toBeDefined();
      expect(result.orderBook?.bids).toHaveLength(2);
      expect(result.orderBook?.asks).toHaveLength(2);
    });

    it('should fallback to mock data on exchange API error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API Error'));

      const dataSource: CryptoExchangeDataSource = {
        type: 'crypto-exchange',
        exchangeName: 'binance',
        tradingPairs: ['ETH/USDT'],
        includeOrderBook: false,
        includeTradeHistory: false,
      };

      const result = (await service.fetchData(dataSource)) as CryptoExchangeData;

      // Should return mock data
      expect(result).toBeDefined();
      expect(result.ticker).toBeDefined();
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate valid mock weather data', async () => {
      service.setDemoMode(true);

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'Tokyo',
        units: 'metric',
      };

      const result = (await service.fetchData(dataSource)) as WeatherData;

      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('temperature');
      expect(result).toHaveProperty('humidity');
      expect(result).toHaveProperty('pressure');
      expect(result).toHaveProperty('windSpeed');
      expect(result).toHaveProperty('condition');
      expect(result).toHaveProperty('timestamp');

      expect(typeof result.temperature).toBe('number');
      expect(result.temperature).toBeGreaterThan(0);
    });

    it('should generate valid mock stock data', async () => {
      service.setDemoMode(true);

      const dataSource: AlpacaDataSource = {
        type: 'alpaca',
        symbols: ['TSLA'],
      };

      const result = (await service.fetchData(dataSource)) as AlpacaData;

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('change');
      expect(result).toHaveProperty('changePercent');

      expect(typeof result.price).toBe('number');
      expect(result.price).toBeGreaterThan(0);
    });

    it('should generate valid mock crypto exchange data', async () => {
      service.setDemoMode(true);

      const dataSource: CryptoExchangeDataSource = {
        type: 'crypto-exchange',
        exchangeName: 'binance',
        tradingPairs: ['BTC/USDT'],
        includeOrderBook: false,
        includeTradeHistory: false,
      };

      const result = (await service.fetchData(dataSource)) as CryptoExchangeData;

      expect(result.ticker).toBeDefined();
      expect(result.ticker.pair).toBe('BTC/USDT');
      expect(result.ticker.lastPrice).toBeGreaterThan(0);
      expect(result.ticker.bidPrice).toBeLessThan(result.ticker.lastPrice);
      expect(result.ticker.askPrice).toBeGreaterThan(result.ticker.lastPrice);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'Berlin',
        units: 'metric',
      };

      const result = await service.fetchData(dataSource);

      // Should fallback to mock data
      expect(result).toBeDefined();
    });

    it('should handle invalid data source types', async () => {
      const invalidSource = {
        type: 'invalid-type',
      } as any;

      await expect(service.fetchData(invalidSource)).rejects.toThrow();
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetchMock.mockRejectedValueOnce(new Error('API Error'));

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'Sydney',
        units: 'metric',
      };

      await service.fetchData(dataSource);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Transformation', () => {
    it('should transform weather API response correctly', async () => {
      const mockResponse = {
        name: 'Paris',
        main: { temp: 18.5, humidity: 70, pressure: 1015 },
        wind: { speed: 3.5 },
        weather: [{ main: 'Cloudy' }],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const dataSource: WeatherDataSource = {
        type: 'weather',
        location: 'Paris',
        units: 'metric',
      };

      const result = (await service.fetchData(dataSource)) as WeatherData;

      expect(result.location).toBe('Paris');
      expect(result.temperature).toBe(18.5);
      expect(result.humidity).toBe(70);
      expect(result.pressure).toBe(1015);
      expect(result.windSpeed).toBe(3.5);
      expect(result.condition).toBe('Cloudy');
    });

    it('should calculate stock price changes correctly', async () => {
      const mockQuoteResponse = { quote: { ap: 200, bp: 199.5, t: '2025-01-01T00:00:00Z' } };
      const mockSnapshotResponse = {
        dailyBar: { c: 200, o: 190, v: 500000 },
        prevDailyBar: { c: 190 },
      };

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => mockQuoteResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockSnapshotResponse });

      const dataSource: AlpacaDataSource = {
        type: 'alpaca',
        symbols: ['MSFT'],
      };

      const result = (await service.fetchData(dataSource)) as AlpacaData;

      expect(result.change).toBeCloseTo(10, 2);
      expect(result.changePercent).toBeCloseTo(5.26, 2);
    });
  });
});
