# External API Integrations Documentation

This document describes the external API integrations implemented in the J4C Enterprise Portal frontend for real-time data sources.

## Overview

The `DataSourceService` (`src/services/DataSourceService.ts`) provides unified access to multiple external APIs with automatic fallback to mock data when API keys are not configured or when APIs are unavailable.

## Architecture

### Fallback Strategy
- **Primary**: Real API calls when credentials are configured
- **Fallback**: Mock data generation when APIs are unavailable
- **Demo Mode**: Explicit mock-only mode for testing

### Error Handling
- All API calls wrapped in try-catch blocks
- Console warnings for missing API keys
- Automatic fallback to mock data on errors
- Graceful degradation for rate limit errors

## API Integrations

### 1. OpenWeatherMap API

**Purpose**: Real-time weather data

**Configuration**:
```env
VITE_WEATHER_API_KEY=your_openweathermap_api_key
```

**API Details**:
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Documentation**: https://openweathermap.org/api
- **Free Tier**: 60 calls/minute, 1,000,000 calls/month
- **Rate Limits**: Monitored by response headers

**Data Structure**:
```typescript
interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  condition: string;
  timestamp: string;
}
```

**Usage Example**:
```typescript
const dataSource: WeatherDataSource = {
  type: 'weather',
  location: 'New York',
  units: 'metric', // or 'imperial'
  // ... other config
};
```

---

### 2. Alpaca Markets API

**Purpose**: Stock market data (quotes, bars, trades)

**Configuration**:
```env
VITE_ALPACA_API_KEY=your_alpaca_api_key
VITE_ALPACA_API_SECRET=your_alpaca_api_secret
```

**API Details**:
- **Endpoint**: `https://data.alpaca.markets/v2/stocks`
- **Documentation**: https://alpaca.markets/docs/api-documentation/
- **Free Tier**: Market data available with free account
- **Authentication**: API Key + Secret in headers

**Data Structure**:
```typescript
interface AlpacaData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  change: number;
  changePercent: number;
}
```

**Usage Example**:
```typescript
const dataSource: AlpacaDataSource = {
  type: 'alpaca',
  symbols: ['AAPL', 'GOOGL'],
  dataType: 'quotes', // or 'trades', 'bars'
  // ... other config
};
```

**Notes**:
- Requires both API key and secret
- Market hours: 9:30 AM - 4:00 PM ET
- After-hours data available

---

### 3. NewsAPI

**Purpose**: Latest news articles and headlines

**Configuration**:
```env
VITE_NEWSAPI_KEY=your_newsapi_key
```

**API Details**:
- **Endpoint**: `https://newsapi.org/v2/everything` or `top-headlines`
- **Documentation**: https://newsapi.org/docs
- **Free Tier**: 100 requests/day (delayed 24 hours)
- **Rate Limits**: Strict on free tier

**Data Structure**:
```typescript
interface NewsData {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
```

**Usage Example**:
```typescript
const dataSource: NewsDataSource = {
  type: 'newsapi',
  query: 'blockchain',
  language: 'en',
  category: 'technology', // optional
  // ... other config
};
```

**Sentiment Analysis**:
- Basic keyword-based sentiment analysis
- Can be enhanced with ML models
- Categories: positive, negative, neutral

---

### 4. Twitter/X API v2

**Purpose**: Real-time tweets and social sentiment

**Configuration**:
```env
VITE_TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

**API Details**:
- **Endpoint**: `https://api.twitter.com/2/tweets/search/recent`
- **Documentation**: https://developer.twitter.com/en/docs/twitter-api
- **Free Tier**: Essential access (500k tweets/month)
- **Authentication**: Bearer token

**Data Structure**:
```typescript
interface TwitterData {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  likes: number;
  retweets: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
```

**Usage Example**:
```typescript
const dataSource: TwitterDataSource = {
  type: 'twitter',
  keywords: ['blockchain', 'DLT'],
  language: 'en',
  // ... other config
};
```

**Notes**:
- Requires Twitter Developer account
- Rate limits apply per 15-minute window
- Recent search: last 7 days only

---

### 5. CoinGecko API

**Purpose**: Cryptocurrency prices and market data

**Configuration**:
```env
VITE_COINGECKO_API_KEY=your_coingecko_api_key  # Optional
```

**API Details**:
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Documentation**: https://www.coingecko.com/en/api/documentation
- **Free Tier**: Available without API key (rate limited)
- **Demo Tier**: Higher rate limits with API key

**Data Structure**:
```typescript
interface CryptoData {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
}
```

**Usage Example**:
```typescript
const dataSource: CryptoDataSource = {
  type: 'crypto',
  symbols: ['bitcoin', 'ethereum'], // lowercase coin IDs
  currency: 'usd',
  // ... other config
};
```

**Coin ID Mapping**:
- BTC → bitcoin
- ETH → ethereum
- BNB → binancecoin
- ADA → cardano
- DOT → polkadot

---

### 6. Crypto Exchange APIs (Direct)

**Purpose**: Real-time exchange data (Binance, Coinbase, Kraken)

**Configuration**:
No API keys required for public endpoints

**API Details**:
- **Binance**: `https://api.binance.com/api/v3`
- **Coinbase**: `https://api.exchange.coinbase.com`
- **Kraken**: `https://api.kraken.com/0/public`

**Data Structure**:
```typescript
interface CryptoExchangeData {
  ticker: CryptoExchangeTickerData;
  orderBook?: CryptoExchangeOrderBookData;
  recentTrades?: CryptoExchangeTradeData[];
}
```

**Usage Example**:
```typescript
const dataSource: CryptoExchangeDataSource = {
  type: 'crypto-exchange',
  exchangeName: 'binance',
  tradingPairs: ['BTC/USDT', 'ETH/USDT'],
  includeOrderBook: true,
  includeTradeHistory: true,
  // ... other config
};
```

**Notes**:
- Public endpoints don't require authentication
- Rate limits vary by exchange
- Real-time WebSocket connections available separately

---

## Rate Limiting

### Best Practices

1. **Respect API Limits**
   - Implement exponential backoff
   - Cache responses when appropriate
   - Use WebSockets for real-time data when available

2. **Update Intervals**
   - Weather: 5 minutes (300000ms)
   - Stock: 1 minute (60000ms)
   - News: 10 minutes (600000ms)
   - Twitter: 2 minutes (120000ms)
   - Crypto: 1 minute (60000ms)
   - Exchange: 1 second (1000ms) for real-time

3. **Error Handling**
   ```typescript
   if (response.status === 429) {
     // Rate limited - wait and retry
     const retryAfter = response.headers.get('Retry-After');
     await delay(retryAfter ? parseInt(retryAfter) * 1000 : 60000);
   }
   ```

### Rate Limit Summary

| API | Free Tier Limit | Notes |
|-----|----------------|-------|
| OpenWeatherMap | 60 calls/min | Per API key |
| Alpaca | 200 requests/min | Per account |
| NewsAPI | 100 requests/day | Delayed 24h |
| Twitter | 500k tweets/month | Per app |
| CoinGecko | 10-50 calls/min | Without key |
| Exchanges | Varies | Public endpoints |

---

## Setup Instructions

### 1. Copy Environment File
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend
cp .env.example .env.development
```

### 2. Obtain API Keys

**OpenWeatherMap**:
1. Visit https://openweathermap.org/api
2. Sign up for free account
3. Generate API key from dashboard
4. Add to `.env.development`

**Alpaca Markets**:
1. Visit https://alpaca.markets/
2. Create account (no payment required)
3. Generate API key and secret from dashboard
4. Add both to `.env.development`

**NewsAPI**:
1. Visit https://newsapi.org/
2. Register for free developer account
3. Copy API key from account page
4. Add to `.env.development`

**Twitter/X**:
1. Visit https://developer.twitter.com/
2. Apply for developer account
3. Create app and generate bearer token
4. Add to `.env.development`

**CoinGecko**:
1. Visit https://www.coingecko.com/en/api
2. Optional: Sign up for demo API key
3. Works without key but with lower limits
4. Add to `.env.development` if obtained

### 3. Configure Environment
```env
# Example .env.development
VITE_WEATHER_API_KEY=abc123...
VITE_ALPACA_API_KEY=PK123...
VITE_ALPACA_API_SECRET=SK456...
VITE_NEWSAPI_KEY=xyz789...
VITE_TWITTER_BEARER_TOKEN=AAAA...
VITE_COINGECKO_API_KEY=CG-abc123...
```

### 4. Test Integration
```bash
npm run dev
```

Navigate to the data source configuration in the UI and verify real data is being fetched.

---

## Testing

### Test with Mock Data
```typescript
import { dataSourceService } from './services/DataSourceService';

// Enable demo mode
dataSourceService.setDemoMode(true);

// All API calls will return mock data
const weatherData = await dataSourceService.fetchData(weatherDataSource);
```

### Test with Real APIs
```typescript
// Disable demo mode (requires API keys)
dataSourceService.setDemoMode(false);

// Will attempt real API calls
const weatherData = await dataSourceService.fetchData(weatherDataSource);
```

### Test Fallback Behavior
```typescript
// Remove API key temporarily
delete process.env.VITE_WEATHER_API_KEY;

// Should automatically fall back to mock data
const weatherData = await dataSourceService.fetchData(weatherDataSource);
```

---

## Troubleshooting

### Common Issues

**1. API Key Not Working**
- Verify key is correctly copied (no extra spaces)
- Check if key has necessary permissions
- Confirm key is active and not expired

**2. Rate Limit Errors**
```
Error: 429 Too Many Requests
```
- Wait for rate limit window to reset
- Increase update intervals
- Consider upgrading API plan

**3. CORS Errors**
```
Error: CORS policy blocked
```
- Use backend proxy for APIs with CORS restrictions
- Check if API requires specific headers
- Consider using server-side API calls

**4. Invalid Response Format**
- Verify API endpoint URL is correct
- Check API version (some APIs have versioned endpoints)
- Review API documentation for changes

### Debug Mode

Enable debug logging:
```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

This will log:
- API request URLs
- Response status codes
- Error details
- Fallback triggers

---

## Future Enhancements

### Planned Features
1. **Response Caching**: Reduce API calls with intelligent caching
2. **Retry Logic**: Exponential backoff for failed requests
3. **Rate Limit Tracking**: Monitor and display rate limit status
4. **API Health Dashboard**: Real-time status of all integrations
5. **WebSocket Support**: Real-time streaming for supported APIs
6. **Advanced Sentiment**: ML-based sentiment analysis
7. **Multi-Language**: Support for non-English data sources
8. **Custom Transformers**: User-defined data transformation pipelines

### API Wishlist
- Bloomberg API (enterprise)
- Reuters API (enterprise)
- Alpha Vantage (stock data)
- Finnhub (financial data)
- Coinbase Advanced Trade API
- Polygon.io (market data)

---

## Security Considerations

### API Key Protection
- Never commit API keys to version control
- Use `.env` files (in `.gitignore`)
- Rotate keys periodically
- Use environment-specific keys (dev/prod)

### Rate Limit Protection
- Implement request throttling
- Cache responses appropriately
- Monitor usage metrics
- Set up alerts for approaching limits

### Data Validation
- Validate all API responses
- Sanitize user inputs in queries
- Handle malformed data gracefully
- Log suspicious activity

---

## Support

For issues or questions:
- Check API provider documentation
- Review error logs in browser console
- Contact Aurigraph support team
- Reference this documentation

## References

- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [Alpaca Markets API Docs](https://alpaca.markets/docs/)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [Twitter API v2 Docs](https://developer.twitter.com/en/docs/twitter-api)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [Coinbase API Docs](https://docs.cloud.coinbase.com/exchange/docs)
- [Kraken API Docs](https://docs.kraken.com/rest/)
