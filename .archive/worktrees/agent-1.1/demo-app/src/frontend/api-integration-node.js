/**
 * API Integration Node - External Data Sources
 * Supports: Alpaca Market Data, Weather APIs, etc.
 * Epic: AV11-192, Tasks: AV11-197, AV11-198
 */

class APIIntegrationNode {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = 'api-integration';
        this.provider = config.config.provider; // 'alpaca', 'openweathermap', etc.

        this.config = {
            apiKey: config.config.apiKey || '',
            apiSecret: config.config.apiSecret || '',
            endpoint: config.config.endpoint || '',
            updateFrequency: config.config.updateFrequency || 5000,
            rateLimit: config.config.rateLimit || 60, // requests per minute
            retryAttempts: config.config.retryAttempts || 3,
            locations: config.config.locations || []
        };

        // State
        this.state = 'DISCONNECTED';
        this.enabled = true;
        this.connectionAttempts = 0;
        this.lastUpdate = null;
        this.currentData = null;

        // Metrics
        this.metrics = {
            feedRate: 0,
            totalDataPoints: 0,
            apiCalls: 0,
            apiErrors: 0,
            quotaUsed: 0,
            quotaRemaining: 0,
            latency: 0,
            uptime: 0,
            successRate: 100.0
        };

        // Rate limiting
        this.rateLimiter = {
            requests: [],
            maxPerMinute: this.config.rateLimit,
            window: 60000 // 1 minute in ms
        };

        // Polling interval
        this.pollingInterval = null;
        this.metricsInterval = null;
        this.startTime = Date.now();
        this.listeners = new Map();

        // Provider-specific configurations
        this.providerConfig = this._getProviderConfig();
    }

    _getProviderConfig() {
        const configs = {
            'alpaca': {
                name: 'Alpaca Market Data',
                dataType: 'stock_price',
                symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'],
                endpoint: this.config.endpoint || 'https://data.alpaca.markets/v2',
                authHeader: 'APCA-API-KEY-ID',
                authSecretHeader: 'APCA-API-SECRET-KEY'
            },
            'openweathermap': {
                name: 'OpenWeatherMap',
                dataType: 'weather',
                locations: this.config.locations.length > 0
                    ? this.config.locations
                    : ['New York', 'London', 'Tokyo', 'Singapore'],
                endpoint: this.config.endpoint || 'https://api.openweathermap.org/data/2.5',
                authParam: 'appid'
            },
            'twitter': {
                name: 'X.com (Twitter) Social Feed',
                dataType: 'social_media',
                topics: this.config.topics || ['#blockchain', '#crypto', '#DeFi', '#Web3', '#Aurigraph'],
                endpoint: this.config.endpoint || 'https://api.twitter.com/2',
                authHeader: 'Authorization',
                authType: 'Bearer'
            }
        };

        return configs[this.provider] || {};
    }

    async initialize() {
        this.state = 'CONNECTING';
        this.emit('state-change', { state: this.state });

        // Validate API credentials
        const isValid = await this._validateCredentials();

        if (isValid) {
            this.state = 'ACTIVE';
            this.emit('state-change', { state: this.state });
            this.emit('connection-established', { provider: this.provider });
            return true;
        } else {
            this.state = 'DISCONNECTED';
            this.metrics.apiErrors++;
            this.emit('state-change', { state: this.state });
            this.emit('error', { message: 'Failed to validate API credentials' });
            return false;
        }
    }

    async _validateCredentials() {
        // In demo mode, simulate credential validation
        return new Promise((resolve) => {
            setTimeout(() => {
                // Check if demo keys or real keys
                const isDemoKey = this.config.apiKey.includes('DEMO') ||
                                 this.config.apiKey === '' ||
                                 this.config.apiKey.length < 10;

                if (isDemoKey) {
                    // Demo mode - always succeed
                    this.emit('info', { message: `Running in DEMO mode for ${this.provider}` });
                }
                resolve(true);
            }, 500);
        });
    }

    async start() {
        if (this.state !== 'ACTIVE') {
            await this.initialize();
        }

        this.enabled = true;
        this.state = 'STREAMING';
        this.emit('state-change', { state: this.state });

        // Start data polling
        this._startPolling();

        // Start metrics collection
        this._startMetricsCollection();

        return true;
    }

    _startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        this.pollingInterval = setInterval(async () => {
            if (this.enabled && this.state === 'STREAMING') {
                await this._fetchData();
            }
        }, this.config.updateFrequency);

        // Immediate first fetch
        this._fetchData();
    }

    async _fetchData() {
        // Check rate limit
        if (!this._checkRateLimit()) {
            this.emit('rate-limited', {
                provider: this.provider,
                quotaUsed: this.metrics.quotaUsed
            });
            return;
        }

        const startTime = Date.now();

        try {
            let data;

            if (this.provider === 'alpaca') {
                data = await this._fetchAlpacaData();
            } else if (this.provider === 'openweathermap') {
                data = await this._fetchWeatherData();
            } else if (this.provider === 'twitter') {
                data = await this._fetchTwitterData();
            }

            // Calculate latency
            this.metrics.latency = Date.now() - startTime;
            this.metrics.apiCalls++;
            this.metrics.totalDataPoints += data ? data.length || 1 : 0;
            this.lastUpdate = Date.now();
            this.currentData = data;

            // Update success rate
            this.metrics.successRate = (
                ((this.metrics.apiCalls - this.metrics.apiErrors) / this.metrics.apiCalls) * 100
            ).toFixed(2);

            this.emit('data-received', {
                provider: this.provider,
                dataType: this.providerConfig.dataType,
                data: data,
                timestamp: this.lastUpdate
            });

            // Record rate limit usage
            this._recordRequest();

        } catch (error) {
            this.metrics.apiErrors++;
            this.metrics.successRate = (
                ((this.metrics.apiCalls - this.metrics.apiErrors) / Math.max(this.metrics.apiCalls, 1)) * 100
            ).toFixed(2);

            this.emit('error', {
                provider: this.provider,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async _fetchAlpacaData() {
        // Simulated Alpaca market data
        // In production, this would make real API calls to Alpaca
        const isDemoMode = this.config.apiKey.includes('DEMO') || this.config.apiKey === '';

        if (isDemoMode) {
            // Generate simulated market data
            return this.providerConfig.symbols.map(symbol => ({
                symbol: symbol,
                price: this._generateStockPrice(symbol),
                volume: Math.floor(Math.random() * 10000000),
                change: (Math.random() * 10 - 5).toFixed(2),
                changePercent: (Math.random() * 5 - 2.5).toFixed(2),
                timestamp: Date.now()
            }));
        } else {
            // Real API call would go here
            // const response = await fetch(`${this.config.endpoint}/stocks/quotes/latest`, {
            //     headers: {
            //         [this.providerConfig.authHeader]: this.config.apiKey,
            //         [this.providerConfig.authSecretHeader]: this.config.apiSecret
            //     }
            // });
            // return await response.json();

            // For now, return demo data even with real keys
            return this.providerConfig.symbols.map(symbol => ({
                symbol: symbol,
                price: this._generateStockPrice(symbol),
                volume: Math.floor(Math.random() * 10000000),
                change: (Math.random() * 10 - 5).toFixed(2),
                changePercent: (Math.random() * 5 - 2.5).toFixed(2),
                timestamp: Date.now()
            }));
        }
    }

    _generateStockPrice(symbol) {
        // Generate realistic-looking stock prices
        const basePrices = {
            'AAPL': 175,
            'GOOGL': 140,
            'MSFT': 380,
            'AMZN': 145,
            'TSLA': 250,
            'META': 320,
            'NVDA': 480,
            'AMD': 125
        };

        const basePrice = basePrices[symbol] || 100;
        const variance = basePrice * 0.02; // 2% variance
        return (basePrice + (Math.random() * variance * 2 - variance)).toFixed(2);
    }

    async _fetchWeatherData() {
        // Simulated weather data
        // In production, this would make real API calls to OpenWeatherMap
        const isDemoMode = this.config.apiKey.includes('DEMO') || this.config.apiKey === '';

        if (isDemoMode) {
            // Generate simulated weather data
            return this.providerConfig.locations.map(location => ({
                location: location,
                temperature: (Math.random() * 30 + 10).toFixed(1), // 10-40°C
                humidity: Math.floor(Math.random() * 60 + 30), // 30-90%
                pressure: Math.floor(Math.random() * 50 + 990), // 990-1040 hPa
                windSpeed: (Math.random() * 20).toFixed(1), // 0-20 m/s
                description: this._getRandomWeather(),
                timestamp: Date.now()
            }));
        } else {
            // Real API call would go here
            // const promises = this.providerConfig.locations.map(location =>
            //     fetch(`${this.config.endpoint}/weather?q=${location}&appid=${this.config.apiKey}`)
            // );
            // const responses = await Promise.all(promises);
            // return await Promise.all(responses.map(r => r.json()));

            // For now, return demo data
            return this.providerConfig.locations.map(location => ({
                location: location,
                temperature: (Math.random() * 30 + 10).toFixed(1),
                humidity: Math.floor(Math.random() * 60 + 30),
                pressure: Math.floor(Math.random() * 50 + 990),
                windSpeed: (Math.random() * 20).toFixed(1),
                description: this._getRandomWeather(),
                timestamp: Date.now()
            }));
        }
    }

    _getRandomWeather() {
        const conditions = [
            'Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds',
            'Light rain', 'Moderate rain', 'Thunderstorm', 'Snow',
            'Mist', 'Fog'
        ];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    async _fetchTwitterData() {
        // Simulated Twitter/X.com social media data
        // In production, this would make real API calls to Twitter API v2
        const isDemoMode = this.config.apiKey.includes('DEMO') ||
                          this.config.apiKey === '' ||
                          this.config.apiKey === 'demo_token';

        if (isDemoMode) {
            // Generate simulated social media posts
            const sentimentOptions = ['positive', 'neutral', 'negative'];
            const usernames = ['@CryptoWhale', '@BlockchainDev', '@DeFiTrader', '@Web3Builder', '@AurigraphFan'];

            return this.providerConfig.topics.map(topic => {
                const sentiment = sentimentOptions[Math.floor(Math.random() * sentimentOptions.length)];
                const sentimentScore = sentiment === 'positive' ?
                    (Math.random() * 0.5 + 0.5) : // 0.5 to 1.0
                    sentiment === 'negative' ?
                    (Math.random() * 0.5) : // 0.0 to 0.5
                    (Math.random() * 0.2 + 0.4); // 0.4 to 0.6

                return {
                    topic: topic,
                    username: usernames[Math.floor(Math.random() * usernames.length)],
                    text: this._generateMockTweet(topic),
                    likes: Math.floor(Math.random() * 10000),
                    retweets: Math.floor(Math.random() * 5000),
                    replies: Math.floor(Math.random() * 1000),
                    sentiment: sentiment,
                    sentimentScore: sentimentScore.toFixed(2),
                    engagement: Math.floor(Math.random() * 100000),
                    timestamp: Date.now()
                };
            });
        } else {
            // Real API call would go here
            // const response = await fetch(`${this.config.endpoint}/tweets/search/recent`, {
            //     headers: {
            //         'Authorization': `Bearer ${this.config.apiKey}`
            //     },
            //     params: { query: this.providerConfig.topics.join(' OR ') }
            // });
            // return await response.json();

            // For now, return demo data even with real keys
            return this.providerConfig.topics.map(topic => ({
                topic: topic,
                username: '@DemoUser',
                text: `Demo tweet about ${topic}`,
                likes: Math.floor(Math.random() * 1000),
                retweets: Math.floor(Math.random() * 500),
                replies: Math.floor(Math.random() * 100),
                sentiment: 'neutral',
                sentimentScore: 0.5,
                engagement: Math.floor(Math.random() * 10000),
                timestamp: Date.now()
            }));
        }
    }

    _generateMockTweet(topic) {
        const templates = [
            `Just saw amazing developments in ${topic}! The future is here 🚀`,
            `${topic} is revolutionizing the industry. Incredible progress!`,
            `Breaking: Major update in ${topic} space. This changes everything`,
            `Analyzing ${topic} trends - looking bullish for Q4`,
            `${topic} adoption growing faster than expected. Exciting times!`,
            `New research on ${topic} shows promising results`,
            `${topic} community is absolutely crushing it today`,
            `Deep dive into ${topic} - here's what you need to know`,
            `${topic} hitting new milestones. Innovation at its best`,
            `The ${topic} ecosystem continues to expand rapidly`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    _checkRateLimit() {
        const now = Date.now();

        // Remove requests older than the window
        this.rateLimiter.requests = this.rateLimiter.requests.filter(
            timestamp => now - timestamp < this.rateLimiter.window
        );

        // Check if we're under the limit
        if (this.rateLimiter.requests.length >= this.rateLimiter.maxPerMinute) {
            this.metrics.quotaUsed = this.rateLimiter.requests.length;
            this.metrics.quotaRemaining = 0;
            return false;
        }

        this.metrics.quotaUsed = this.rateLimiter.requests.length;
        this.metrics.quotaRemaining = this.rateLimiter.maxPerMinute - this.rateLimiter.requests.length;
        return true;
    }

    _recordRequest() {
        this.rateLimiter.requests.push(Date.now());
    }

    _startMetricsCollection() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }

        this.metricsInterval = setInterval(() => {
            // Calculate feed rate (data points per second)
            const uptime = (Date.now() - this.startTime) / 1000;
            this.metrics.uptime = Math.round(uptime);
            this.metrics.feedRate = (this.metrics.totalDataPoints / uptime).toFixed(2);

            this.emit('metrics-update', { metrics: this.getMetrics() });
        }, 1000);
    }

    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            this.state = 'STREAMING';
            this._startPolling();
        } else {
            this.state = 'ACTIVE';
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }
        }

        this.emit('state-change', { state: this.state });
        this.emit('toggle', { enabled: this.enabled });
    }

    async stop() {
        this.enabled = false;
        this.state = 'DISCONNECTED';

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        this.emit('state-change', { state: this.state });
        this.emit('stopped', { provider: this.provider });
    }

    getMetrics() {
        return {
            ...this.metrics,
            lastUpdate: this.lastUpdate,
            updateFrequency: this.config.updateFrequency,
            provider: this.provider,
            dataType: this.providerConfig.dataType
        };
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            provider: this.provider,
            state: this.state,
            enabled: this.enabled,
            config: this.config,
            metrics: this.getMetrics(),
            currentData: this.currentData
        };
    }

    getCurrentData() {
        return this.currentData;
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIIntegrationNode;
}
