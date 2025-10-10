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
  DataSourceType,
} from '../types/dataSources';

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
    const sentiments: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
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
    const authors = ['@TechNews', '@MarketWatch', '@CryptoInsider', '@FinanceDaily', '@BlockchainPro'];
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
}

// Export singleton instance
export const dataSourceService = new DataSourceService();
export default DataSourceService;
