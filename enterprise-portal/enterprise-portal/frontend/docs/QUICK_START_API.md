# Quick Start: External API Integration

## 5-Minute Setup Guide

This guide will get you up and running with external API integrations in less than 5 minutes.

## Step 1: Copy Environment File (30 seconds)

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend
cp .env.example .env.development
```

## Step 2: Choose Your APIs (2 minutes)

You can use any combination of these APIs. All are **optional** - the system will use mock data for any API without credentials.

### Option A: Use Mock Data Only (Fastest)
**No setup required!** The application works out of the box with demo data.

```env
# Leave all API keys empty in .env.development
VITE_WEATHER_API_KEY=
VITE_ALPACA_API_KEY=
# ... etc
```

### Option B: Add Real APIs (Choose one or more)

#### Weather Data (Easiest - 2 min setup)
1. Visit: https://openweathermap.org/api
2. Click "Sign Up" → Create free account
3. Go to "API Keys" tab → Copy your key
4. Add to `.env.development`:
```env
VITE_WEATHER_API_KEY=your_key_here
```

#### Cryptocurrency Data (No signup required!)
CoinGecko works without an API key:
```env
VITE_COINGECKO_API_KEY=
# Leave empty - will work automatically!
```

#### Stock Market Data (5 min setup)
1. Visit: https://alpaca.markets/
2. Sign up → Go to "Paper Trading" dashboard
3. Generate API Key & Secret
4. Add to `.env.development`:
```env
VITE_ALPACA_API_KEY=your_key_here
VITE_ALPACA_API_SECRET=your_secret_here
```

#### News Data (2 min setup)
1. Visit: https://newsapi.org/register
2. Register → Copy API key
3. Add to `.env.development`:
```env
VITE_NEWSAPI_KEY=your_key_here
```

#### Twitter/X Data (15 min setup - requires approval)
1. Visit: https://developer.twitter.com/
2. Apply for developer account (requires approval)
3. Create app → Generate bearer token
4. Add to `.env.development`:
```env
VITE_TWITTER_BEARER_TOKEN=your_token_here
```

## Step 3: Start Development Server (1 minute)

```bash
npm run dev
```

Visit: http://localhost:5173

## Step 4: Verify Integration (1 minute)

1. Open browser developer console (F12)
2. Navigate to data source configuration
3. Look for console messages:
   - ✅ Success: No warnings
   - ⚠️ Fallback: "API key not configured, falling back to mock data"
   - ❌ Error: "Error fetching [service] data: [details]"

## Testing Your Setup

### Test Real API
```typescript
// In browser console
const service = new DataSourceService(false); // false = real APIs
service.setDemoMode(false);

// Test weather
const weatherData = await service.fetchData({
  type: 'weather',
  location: 'New York',
  units: 'metric'
});
console.log(weatherData);
```

### Test Mock Data
```typescript
// In browser console
const service = new DataSourceService(true); // true = mock data
service.setDemoMode(true);

const mockData = await service.fetchData({
  type: 'weather',
  location: 'New York'
});
console.log(mockData);
```

## Common Issues

### Issue: "API key not configured"
**Solution**: Check that your `.env.development` file has the correct key name and value.

```bash
# Verify your env file
cat .env.development | grep VITE_WEATHER_API_KEY
```

### Issue: "CORS policy blocked"
**Solution**: Some APIs require backend proxy. Use the provided mock data or configure a proxy server.

### Issue: "429 Too Many Requests"
**Solution**: You've hit rate limits. Wait a few minutes or increase the `updateInterval` in your data source configuration.

```typescript
// Increase update interval to 10 minutes
const dataSource = {
  type: 'weather',
  updateInterval: 600000, // 10 minutes instead of 5
  // ...
};
```

### Issue: API returns unexpected data
**Solution**: Check the API documentation - response formats may have changed. The code will fallback to mock data automatically.

## Quick Reference

### Environment Variables
```env
# Required for each API (all optional)
VITE_WEATHER_API_KEY=           # OpenWeatherMap
VITE_ALPACA_API_KEY=            # Alpaca Markets
VITE_ALPACA_API_SECRET=         # Alpaca Markets Secret
VITE_NEWSAPI_KEY=               # NewsAPI
VITE_TWITTER_BEARER_TOKEN=      # Twitter/X
VITE_COINGECKO_API_KEY=         # CoinGecko (optional)
```

### API Rate Limits (Free Tiers)
| API | Limit | Notes |
|-----|-------|-------|
| OpenWeatherMap | 60/min | Very generous |
| Alpaca | 200/min | Good for testing |
| NewsAPI | 100/day | Limited daily |
| Twitter | 500k/month | Tweet search |
| CoinGecko | 10-50/min | No key needed |

### Update Intervals (Recommended)
```typescript
const intervals = {
  weather: 300000,    // 5 min
  stock: 60000,       // 1 min
  news: 600000,       // 10 min
  twitter: 120000,    // 2 min
  crypto: 60000,      // 1 min
};
```

## Next Steps

### Learn More
- 📖 [Full API Documentation](./EXTERNAL_API_INTEGRATIONS.md)
- 📋 [Implementation Summary](./API_INTEGRATION_SUMMARY.md)
- 🔧 [Troubleshooting Guide](./EXTERNAL_API_INTEGRATIONS.md#troubleshooting)

### Advanced Setup
1. Configure production environment (`.env.production`)
2. Set up monitoring for API health
3. Implement response caching
4. Configure rate limit alerts

### Production Deployment
1. Obtain production API keys (separate from dev)
2. Set environment variables on hosting platform
3. Enable monitoring and logging
4. Test all integrations in staging first

## Support

- **Quick Questions**: Check the [Troubleshooting section](./EXTERNAL_API_INTEGRATIONS.md#troubleshooting)
- **Detailed Info**: See [Full Documentation](./EXTERNAL_API_INTEGRATIONS.md)
- **Issues**: Contact Aurigraph DevOps team

## Tips for Best Experience

1. **Start Small**: Enable one API at a time to test
2. **Use Mock Data**: Perfect for development and demos
3. **Monitor Usage**: Keep an eye on rate limits
4. **Rotate Keys**: Change keys periodically for security
5. **Read Docs**: Each API has quirks - check their docs

## Example: Complete Setup for Weather + Crypto

```bash
# 1. Setup environment
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend
cp .env.example .env.development

# 2. Edit .env.development
# Add these lines:
# VITE_WEATHER_API_KEY=abc123your_openweathermap_key
# VITE_COINGECKO_API_KEY= (leave empty, works without it)

# 3. Start dev server
npm run dev

# 4. Test in browser console
# Open http://localhost:5173
# Open DevTools (F12)
# Check for warnings - should only see warnings for APIs you didn't configure
```

**Done!** You now have real weather data and cryptocurrency prices flowing into your application.

---

**Setup Time**: 5-15 minutes depending on which APIs you choose
**Difficulty**: Easy
**Cost**: $0 (all free tiers)
