/**
 * Data Source Service
 *
 * Service for fetching data from external APIs (Weather, Alpaca, NewsAPI, X/Twitter, etc.)
 */

import type {
  AnyDataSource,
  AnyDataPayload,
  WeatherData,
  AlpacaData,
  NewsData,
  TwitterData,
  CryptoData,
  CryptoExchangeData,
  CryptoExchangeDataSource,
  CryptoExchangeTickerData,
  CryptoExchangeTradeData,
  CryptoExchangeOrderBookData,
  CryptoExchangeName,
  DataSourceType,
} from '../types/dataSources';
import { CRYPTO_EXCHANGE_REST_ENDPOINTS } from '../types/dataSources';

class DataSourceService {
  private demoMode: boolean;

  constructor(demoMode: boolean = true) {
    this.demoMode = demoMode;
  }

  /**
   * Enable or disable demo mode
   */
  setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
  }

  /**
   * Fetch data from a data source
   */
  async fetchData(dataSource: AnyDataSource): Promise<AnyDataPayload> {
    if (this.demoMode) {
      return this.generateMockData(dataSource.type);
    }

    switch (dataSource.type) {
      case 'weather':
        return this.fetchWeatherData(dataSource);
      case 'alpaca':
        return this.fetchAlpacaData(dataSource);
      case 'newsapi':
        return this.fetchNewsData(dataSource);
      case 'twitter':
        return this.fetchTwitterData(dataSource);
      case 'crypto':
        return this.fetchCryptoData(dataSource);
      case 'crypto-exchange':
        return this.fetchCryptoExchangeData(dataSource as CryptoExchangeDataSource);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  // ==========================================================================
  // Real Data Fetching Methods (to be implemented with actual API keys)
  // ==========================================================================

  private async fetchWeatherData(_dataSource: AnyDataSource): Promise<WeatherData> {
    // TODO: Implement actual OpenWeatherMap API call
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`);
    // return await response.json();
    return this.generateMockData('weather') as WeatherData;
  }

  private async fetchAlpacaData(_dataSource: AnyDataSource): Promise<AlpacaData> {
    // TODO: Implement actual Alpaca API call
    // const response = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
    //   headers: { 'APCA-API-KEY-ID': apiKey }
    // });
    return this.generateMockData('alpaca') as AlpacaData;
  }

  private async fetchNewsData(_dataSource: AnyDataSource): Promise<NewsData> {
    // TODO: Implement actual NewsAPI call
    // const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`);
    return this.generateMockData('newsapi') as NewsData;
  }

  private async fetchTwitterData(_dataSource: AnyDataSource): Promise<TwitterData> {
    // TODO: Implement actual Twitter API call
    // const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${query}`, {
    //   headers: { 'Authorization': `Bearer ${bearerToken}` }
    // });
    return this.generateMockData('twitter') as TwitterData;
  }

  private async fetchCryptoData(_dataSource: AnyDataSource): Promise<CryptoData> {
    // TODO: Implement actual CoinGecko API call
    // const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    return this.generateMockData('crypto') as CryptoData;
  }

  /**
   * Fetch real-time data from crypto exchanges
   */
  private async fetchCryptoExchangeData(dataSource: CryptoExchangeDataSource): Promise<CryptoExchangeData> {
    const { exchangeName, tradingPairs, includeOrderBook, includeTradeHistory } = dataSource;
    const baseUrl = CRYPTO_EXCHANGE_REST_ENDPOINTS[exchangeName];
    const pair = tradingPairs[0] || 'BTC/USDT';

    try {
      switch (exchangeName) {
        case 'binance':
          return this.fetchBinanceData(baseUrl, pair, includeOrderBook, includeTradeHistory);
        case 'coinbase':
          return this.fetchCoinbaseData(baseUrl, pair, includeOrderBook, includeTradeHistory);
        case 'kraken':
          return this.fetchKrakenData(baseUrl, pair, includeOrderBook, includeTradeHistory);
        default:
          // Fallback to mock for unsupported exchanges
          return this.generateMockCryptoExchange(exchangeName, pair);
      }
    } catch (error) {
      console.error(`Error fetching ${exchangeName} data:`, error);
      return this.generateMockCryptoExchange(exchangeName, pair);
    }
  }

  /**
   * Fetch data from Binance exchange
   */
  private async fetchBinanceData(
    baseUrl: string,
    pair: string,
    includeOrderBook: boolean,
    includeTradeHistory: boolean
  ): Promise<CryptoExchangeData> {
    const symbol = pair.replace('/', ''); // BTC/USDT -> BTCUSDT

    // Fetch ticker
    const tickerResponse = await fetch(`${baseUrl}/ticker/24hr?symbol=${symbol}`);
    const tickerData = await tickerResponse.json();

    const ticker: CryptoExchangeTickerData = {
      exchange: 'binance',
      pair,
      lastPrice: parseFloat(tickerData.lastPrice),
      bidPrice: parseFloat(tickerData.bidPrice),
      askPrice: parseFloat(tickerData.askPrice),
      volume24h: parseFloat(tickerData.volume),
      high24h: parseFloat(tickerData.highPrice),
      low24h: parseFloat(tickerData.lowPrice),
      change24h: parseFloat(tickerData.priceChange),
      changePercent24h: parseFloat(tickerData.priceChangePercent),
      timestamp: new Date().toISOString(),
    };

    const result: CryptoExchangeData = { ticker };

    // Fetch order book if requested
    if (includeOrderBook) {
      const orderBookResponse = await fetch(`${baseUrl}/depth?symbol=${symbol}&limit=10`);
      const orderBookData = await orderBookResponse.json();
      result.orderBook = {
        exchange: 'binance',
        pair,
        bids: orderBookData.bids.map((b: string[]) => ({ price: parseFloat(b[0] ?? '0'), amount: parseFloat(b[1] ?? '0') })),
        asks: orderBookData.asks.map((a: string[]) => ({ price: parseFloat(a[0] ?? '0'), amount: parseFloat(a[1] ?? '0') })),
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch recent trades if requested
    if (includeTradeHistory) {
      const tradesResponse = await fetch(`${baseUrl}/trades?symbol=${symbol}&limit=10`);
      const tradesData = await tradesResponse.json();
      result.recentTrades = tradesData.map((t: { id: number; price: string; qty: string; isBuyerMaker: boolean; time: number }) => ({
        exchange: 'binance' as CryptoExchangeName,
        pair,
        price: parseFloat(t.price),
        amount: parseFloat(t.qty),
        side: t.isBuyerMaker ? 'sell' : 'buy',
        timestamp: new Date(t.time).toISOString(),
        tradeId: t.id.toString(),
      }));
    }

    return result;
  }

  /**
   * Fetch data from Coinbase exchange
   */
  private async fetchCoinbaseData(
    baseUrl: string,
    pair: string,
    includeOrderBook: boolean,
    includeTradeHistory: boolean
  ): Promise<CryptoExchangeData> {
    const productId = pair.replace('/', '-'); // BTC/USD -> BTC-USD

    // Fetch ticker
    const tickerResponse = await fetch(`${baseUrl}/products/${productId}/ticker`);
    const tickerData = await tickerResponse.json();

    // Fetch stats for 24h data
    const statsResponse = await fetch(`${baseUrl}/products/${productId}/stats`);
    const statsData = await statsResponse.json();

    const ticker: CryptoExchangeTickerData = {
      exchange: 'coinbase',
      pair,
      lastPrice: parseFloat(tickerData.price),
      bidPrice: parseFloat(tickerData.bid),
      askPrice: parseFloat(tickerData.ask),
      volume24h: parseFloat(statsData.volume),
      high24h: parseFloat(statsData.high),
      low24h: parseFloat(statsData.low),
      change24h: parseFloat(tickerData.price) - parseFloat(statsData.open),
      changePercent24h: ((parseFloat(tickerData.price) - parseFloat(statsData.open)) / parseFloat(statsData.open)) * 100,
      timestamp: new Date().toISOString(),
    };

    const result: CryptoExchangeData = { ticker };

    // Fetch order book if requested
    if (includeOrderBook) {
      const orderBookResponse = await fetch(`${baseUrl}/products/${productId}/book?level=2`);
      const orderBookData = await orderBookResponse.json();
      result.orderBook = {
        exchange: 'coinbase',
        pair,
        bids: orderBookData.bids.slice(0, 10).map((b: string[]) => ({ price: parseFloat(b[0] ?? '0'), amount: parseFloat(b[1] ?? '0') })),
        asks: orderBookData.asks.slice(0, 10).map((a: string[]) => ({ price: parseFloat(a[0] ?? '0'), amount: parseFloat(a[1] ?? '0') })),
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch recent trades if requested
    if (includeTradeHistory) {
      const tradesResponse = await fetch(`${baseUrl}/products/${productId}/trades?limit=10`);
      const tradesData = await tradesResponse.json();
      result.recentTrades = tradesData.map((t: { trade_id: number; price: string; size: string; side: string; time: string }) => ({
        exchange: 'coinbase' as CryptoExchangeName,
        pair,
        price: parseFloat(t.price),
        amount: parseFloat(t.size),
        side: t.side as 'buy' | 'sell',
        timestamp: t.time,
        tradeId: t.trade_id.toString(),
      }));
    }

    return result;
  }

  /**
   * Fetch data from Kraken exchange
   */
  private async fetchKrakenData(
    baseUrl: string,
    pair: string,
    includeOrderBook: boolean,
    includeTradeHistory: boolean
  ): Promise<CryptoExchangeData> {
    const krakenPair = pair.replace('/', ''); // BTC/USD -> BTCUSD

    // Fetch ticker
    const tickerResponse = await fetch(`${baseUrl}/Ticker?pair=${krakenPair}`);
    const tickerData = await tickerResponse.json();
    const tickerKey = Object.keys(tickerData.result ?? {})[0] ?? '';
    const t = tickerData.result?.[tickerKey] ?? {};

    const ticker: CryptoExchangeTickerData = {
      exchange: 'kraken',
      pair,
      lastPrice: parseFloat(t.c[0]),
      bidPrice: parseFloat(t.b[0]),
      askPrice: parseFloat(t.a[0]),
      volume24h: parseFloat(t.v[1]),
      high24h: parseFloat(t.h[1]),
      low24h: parseFloat(t.l[1]),
      change24h: parseFloat(t.c[0]) - parseFloat(t.o),
      changePercent24h: ((parseFloat(t.c[0]) - parseFloat(t.o)) / parseFloat(t.o)) * 100,
      timestamp: new Date().toISOString(),
    };

    const result: CryptoExchangeData = { ticker };

    // Fetch order book if requested
    if (includeOrderBook) {
      const orderBookResponse = await fetch(`${baseUrl}/Depth?pair=${krakenPair}&count=10`);
      const orderBookData = await orderBookResponse.json();
      const obKey = Object.keys(orderBookData.result ?? {})[0] ?? '';
      const ob = orderBookData.result?.[obKey] ?? { bids: [], asks: [] };
      result.orderBook = {
        exchange: 'kraken',
        pair,
        bids: ob.bids.map((b: string[]) => ({ price: parseFloat(b[0] ?? '0'), amount: parseFloat(b[1] ?? '0') })),
        asks: ob.asks.map((a: string[]) => ({ price: parseFloat(a[0] ?? '0'), amount: parseFloat(a[1] ?? '0') })),
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch recent trades if requested
    if (includeTradeHistory) {
      const tradesResponse = await fetch(`${baseUrl}/Trades?pair=${krakenPair}&count=10`);
      const tradesData = await tradesResponse.json();
      const trKey = Object.keys(tradesData.result).find(k => k !== 'last') || '';
      const trades = tradesData.result[trKey] || [];
      result.recentTrades = trades.map((t: [string, string, string, string, string, string], idx: number) => ({
        exchange: 'kraken' as CryptoExchangeName,
        pair,
        price: parseFloat(t[0]),
        amount: parseFloat(t[1]),
        side: t[3] === 'b' ? 'buy' : 'sell',
        timestamp: new Date(parseFloat(t[2]) * 1000).toISOString(),
        tradeId: idx.toString(),
      }));
    }

    return result;
  }

  // ==========================================================================
  // Mock Data Generators (Demo Mode)
  // ==========================================================================

  private generateMockData(type: DataSourceType): AnyDataPayload {
    switch (type) {
      case 'weather':
        return this.generateMockWeather();
      case 'alpaca':
      case 'stock':
        return this.generateMockAlpaca();
      case 'newsapi':
        return this.generateMockNews();
      case 'twitter':
        return this.generateMockTwitter();
      case 'crypto':
        return this.generateMockCrypto();
      case 'crypto-exchange':
        return this.generateMockCryptoExchange('binance', 'BTC/USDT');
      default:
        return this.generateMockWeather();
    }
  }

  private generateMockWeather(): WeatherData {
    const locations = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'];
    const conditions = ['Clear', 'Cloudy', 'Rainy', 'Sunny', 'Partly Cloudy'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)] || 'New York';
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)] || 'Clear';

    return {
      location: randomLocation,
      temperature: Math.random() * 30 + 10, // 10-40°C
      humidity: Math.random() * 60 + 30, // 30-90%
      pressure: Math.random() * 50 + 980, // 980-1030 hPa
      windSpeed: Math.random() * 20, // 0-20 m/s
      condition: randomCondition,
      timestamp: new Date().toISOString(),
    };
  }

  private generateMockAlpaca(): AlpacaData {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)] || 'AAPL';
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 20;

    return {
      symbol: randomSymbol,
      price: basePrice,
      volume: Math.floor(Math.random() * 10000000),
      timestamp: new Date().toISOString(),
      change: change,
      changePercent: (change / basePrice) * 100,
    };
  }

  private generateMockNews(): NewsData {
    const titles = [
      'Markets surge on positive economic data',
      'Tech sector shows strong growth',
      'Global economy rebounds amid recovery',
      'Innovation drives market momentum',
      'Investors optimistic about future prospects',
    ];
    const sources = ['Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'Financial Times'];
    const sentiments: Array<'positive' | 'negative' | 'neutral'> = [
      'positive',
      'negative',
      'neutral',
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)] || 'Market news';
    const randomSource = sources[Math.floor(Math.random() * sources.length)] || 'Reuters';
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)] || 'neutral';

    return {
      title: randomTitle,
      description: 'Latest market news and financial updates from around the world.',
      source: randomSource,
      url: 'https://example.com/news',
      publishedAt: new Date().toISOString(),
      sentiment: randomSentiment,
    };
  }

  private generateMockTwitter(): TwitterData {
    const tweets = [
      'Exciting developments in blockchain technology!',
      'Markets showing strong bullish trends today',
      'Innovation driving the future of finance',
      'Crypto adoption continues to grow worldwide',
      'Tech stocks leading market gains',
    ];
    const authors = [
      '@TechNews',
      '@MarketWatch',
      '@CryptoInsider',
      '@FinanceDaily',
      '@BlockchainPro',
    ];
    const randomTweet = tweets[Math.floor(Math.random() * tweets.length)] || 'Blockchain news';
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)] || '@TechNews';

    return {
      id: Math.random().toString(36).substring(7),
      text: randomTweet,
      author: randomAuthor,
      timestamp: new Date().toISOString(),
      likes: Math.floor(Math.random() * 10000),
      retweets: Math.floor(Math.random() * 1000),
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
    };
  }

  private generateMockCrypto(): CryptoData {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT'];
    const basePrices: Record<string, number> = {
      BTC: 45000,
      ETH: 3000,
      BNB: 350,
      ADA: 1.2,
      DOT: 25,
    };

    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)] || 'BTC';
    const basePrice = basePrices[randomSymbol] || 45000;
    const variation = (Math.random() - 0.5) * 0.1;

    return {
      symbol: randomSymbol,
      price: basePrice * (1 + variation),
      marketCap: basePrice * 1000000000 * (1 + variation),
      volume24h: basePrice * 50000000,
      change24h: variation * 100,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate mock crypto exchange data for demo mode
   */
  private generateMockCryptoExchange(exchange: CryptoExchangeName, pair: string): CryptoExchangeData {
    // Base prices for common pairs
    const basePrices: Record<string, number> = {
      'BTC/USDT': 97500,
      'ETH/USDT': 3850,
      'BNB/USDT': 720,
      'SOL/USDT': 235,
      'XRP/USDT': 2.45,
      'ADA/USDT': 1.15,
      'DOT/USDT': 9.80,
      'DOGE/USDT': 0.42,
      'BTC/USD': 97500,
      'ETH/USD': 3850,
    };

    const basePrice = basePrices[pair] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // 2% variation
    const currentPrice = basePrice * (1 + variation);
    const spread = currentPrice * 0.0001; // 0.01% spread

    const ticker: CryptoExchangeTickerData = {
      exchange,
      pair,
      lastPrice: currentPrice,
      bidPrice: currentPrice - spread,
      askPrice: currentPrice + spread,
      volume24h: Math.random() * 50000 + 10000,
      high24h: currentPrice * 1.03,
      low24h: currentPrice * 0.97,
      change24h: basePrice * variation,
      changePercent24h: variation * 100,
      timestamp: new Date().toISOString(),
    };

    // Generate mock order book
    const orderBook: CryptoExchangeOrderBookData = {
      exchange,
      pair,
      bids: Array.from({ length: 10 }, (_, i) => ({
        price: currentPrice - spread * (i + 1) * 2,
        amount: Math.random() * 5 + 0.1,
      })),
      asks: Array.from({ length: 10 }, (_, i) => ({
        price: currentPrice + spread * (i + 1) * 2,
        amount: Math.random() * 5 + 0.1,
      })),
      timestamp: new Date().toISOString(),
    };

    // Generate mock recent trades
    const recentTrades: CryptoExchangeTradeData[] = Array.from({ length: 10 }, (_, i) => ({
      exchange,
      pair,
      price: currentPrice * (1 + (Math.random() - 0.5) * 0.001),
      amount: Math.random() * 2 + 0.01,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      tradeId: `${exchange}-${Date.now()}-${i}`,
    }));

    return {
      ticker,
      orderBook,
      recentTrades,
    };
  }
}

// Export singleton instance
export const dataSourceService = new DataSourceService();
export default DataSourceService;
