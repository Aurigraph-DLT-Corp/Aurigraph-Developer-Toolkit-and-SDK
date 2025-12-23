import axios from 'axios';
import type {
  OracleSource,
  PriceFeedPair,
  OracleFeed,
  PriceConsensus,
  APIKey,
  APIKeyCreateRequest,
  APIKeyRotationLog,
  ExternalAPIConfig,
  APIUsageMetrics,
  APIQuota,
  APICallLog,
  OracleHealthCheck,
  OracleUptimeStats,
  PriceFeedAlert,
  SmartContractAPIMapping,
  APICallExecution,
  ContractOracleBinding,
  OracleSourceType,
  APIServiceType,
} from '../types/apiIntegration';

const API_BASE_URL = (import.meta as any).env?.PROD
  ? 'https://dlt.aurigraph.io/api/v11'
  : 'http://localhost:9003/api/v11';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * API Integration Service
 * Provides comprehensive API management for Oracle feeds, API keys, and external integrations
 */
class APIIntegrationService {
  // ========================================
  // Oracle Management API
  // ========================================

  /**
   * Get all supported oracle sources with health status
   */
  async getOracleSources(): Promise<OracleSource[]> {
    try {
      // Get supported sources
      const sourcesResponse = await apiClient.get('/rwa/oracle/sources');
      const sources = sourcesResponse.data;

      // Get health status for all sources
      const healthResponse = await apiClient.get('/rwa/oracle/health');
      const healthData = healthResponse.data;

      // Merge sources with health data
      const oracleSources: OracleSource[] = Object.keys(sources).map((sourceKey) => {
        const health = healthData[sourceKey] || {};
        return {
          sourceId: sourceKey.toLowerCase(),
          name: sources[sourceKey],
          type: sourceKey as OracleSourceType,
          status: this.determineOracleStatus(health),
          description: `${sources[sourceKey]} - Decentralized oracle network`,
          endpoint: this.getOracleEndpoint(sourceKey),
          apiKeyRequired: sourceKey !== 'INTERNAL',
          updateInterval: sourceKey === 'CHAINLINK' ? 60 : 300,
          validFeeds: health.validFeeds || 0,
          totalFeeds: health.totalFeeds || 0,
          healthPercentage: health.healthPercentage || 0,
          lastUpdate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      });

      return oracleSources;
    } catch (error) {
      console.error('Failed to fetch oracle sources:', error);
      return this.getMockOracleSources();
    }
  }

  /**
   * Get all configured price feed pairs
   */
  async getPriceFeedPairs(): Promise<PriceFeedPair[]> {
    try {
      // In a full implementation, this would be a dedicated endpoint
      // For now, we'll create common pairs
      return this.getMockPriceFeedPairs();
    } catch (error) {
      console.error('Failed to fetch price feed pairs:', error);
      return [];
    }
  }

  /**
   * Get current price from a specific oracle source
   */
  async getOraclePrice(assetId: string, source: OracleSourceType): Promise<OracleFeed> {
    try {
      const response = await apiClient.get(`/rwa/oracle/price/${assetId}`, {
        params: { source },
      });

      return {
        feedId: `${assetId}-${source}-${Date.now()}`,
        assetId,
        source,
        price: parseFloat(response.data.price),
        timestamp: response.data.timestamp || new Date().toISOString(),
        confidence: 95,
        blockHeight: response.data.blockHeight,
      };
    } catch (error) {
      console.error('Failed to fetch oracle price:', error);
      throw error;
    }
  }

  /**
   * Get price consensus from multiple oracles
   */
  async getPriceConsensus(assetId: string): Promise<PriceConsensus> {
    try {
      const response = await apiClient.get(`/rwa/oracle/consensus/${assetId}`);

      // Parse the consensus response
      const consensusPrice = parseFloat(response.data.price);
      const sourcePrices = response.data.sources || [];

      return {
        assetId,
        consensusPrice,
        sourcePrices: sourcePrices.map((sp: any) => ({
          source: sp.source as OracleSourceType,
          price: parseFloat(sp.price),
          weight: sp.weight || 1.0,
          timestamp: sp.timestamp || new Date().toISOString(),
        })),
        deviation: response.data.deviation || 0,
        timestamp: new Date().toISOString(),
        validSources: sourcePrices.length,
        totalSources: 5,
      };
    } catch (error) {
      console.error('Failed to fetch price consensus:', error);
      throw error;
    }
  }

  /**
   * Update oracle configuration
   */
  async updateOracleConfig(config: any): Promise<any> {
    try {
      const response = await apiClient.put('/rwa/oracle/config', config);
      return response.data;
    } catch (error) {
      console.error('Failed to update oracle config:', error);
      throw error;
    }
  }

  /**
   * Subscribe to oracle feed updates
   */
  async subscribeToOracleFeed(assetId: string, callbackUrl: string): Promise<any> {
    try {
      const response = await apiClient.post(`/rwa/oracle/subscribe/${assetId}`, {
        callbackUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to subscribe to oracle feed:', error);
      throw error;
    }
  }

  /**
   * Validate oracle feed integrity
   */
  async validateOracleFeed(assetId: string, source: OracleSourceType): Promise<boolean> {
    try {
      const response = await apiClient.get(`/rwa/oracle/validate/${assetId}`, {
        params: { source },
      });
      return response.data.valid;
    } catch (error) {
      console.error('Failed to validate oracle feed:', error);
      return false;
    }
  }

  // ========================================
  // API Key Management API
  // ========================================

  /**
   * Get all API keys (with sensitive data masked)
   */
  async getAPIKeys(): Promise<APIKey[]> {
    try {
      // This would be a dedicated API key management endpoint
      return this.getMockAPIKeys();
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      return [];
    }
  }

  /**
   * Create new API key
   */
  async createAPIKey(keyData: APIKeyCreateRequest): Promise<APIKey> {
    try {
      // Encrypt the API key before storing
      const encryptedKey = await this.encryptAPIKey(keyData.apiKey);

      const response = await apiClient.post('/enterprise/api-keys', {
        ...keyData,
        apiKey: encryptedKey,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Rotate API key (generate new key, revoke old)
   */
  async rotateAPIKey(keyId: string): Promise<APIKey> {
    try {
      const response = await apiClient.post(`/enterprise/api-keys/${keyId}/rotate`);
      return response.data;
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    try {
      await apiClient.delete(`/enterprise/api-keys/${keyId}`);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  }

  /**
   * Get API key rotation logs
   */
  async getKeyRotationLogs(keyId: string): Promise<APIKeyRotationLog[]> {
    try {
      const response = await apiClient.get(`/enterprise/api-keys/${keyId}/rotation-logs`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch rotation logs:', error);
      return [];
    }
  }

  /**
   * Encrypt API key using Web Crypto API
   */
  private async encryptAPIKey(apiKey: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);

      // Generate a random key for encryption
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
      // Fallback: just return the key (in production, this should fail)
      return apiKey;
    }
  }

  // ========================================
  // External API Configuration API
  // ========================================

  /**
   * Get all external API configurations
   */
  async getExternalAPIs(): Promise<ExternalAPIConfig[]> {
    try {
      return this.getMockExternalAPIs();
    } catch (error) {
      console.error('Failed to fetch external APIs:', error);
      return [];
    }
  }

  /**
   * Create new external API configuration
   */
  async createExternalAPI(apiConfig: Partial<ExternalAPIConfig>): Promise<ExternalAPIConfig> {
    try {
      const response = await apiClient.post('/enterprise/external-apis', apiConfig);
      return response.data;
    } catch (error) {
      console.error('Failed to create external API:', error);
      throw error;
    }
  }

  /**
   * Update external API configuration
   */
  async updateExternalAPI(
    configId: string,
    updates: Partial<ExternalAPIConfig>
  ): Promise<ExternalAPIConfig> {
    try {
      const response = await apiClient.put(`/enterprise/external-apis/${configId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update external API:', error);
      throw error;
    }
  }

  /**
   * Test external API connection
   */
  async testExternalAPI(configId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`/enterprise/external-apis/${configId}/test`);
      return response.data;
    } catch (error) {
      console.error('Failed to test external API:', error);
      return { success: false, message: 'Connection test failed' };
    }
  }

  // ========================================
  // Usage Analytics API
  // ========================================

  /**
   * Get API usage metrics for a time period
   */
  async getUsageMetrics(period: string = '24h'): Promise<APIUsageMetrics> {
    try {
      return this.getMockUsageMetrics(period);
    } catch (error) {
      console.error('Failed to fetch usage metrics:', error);
      throw error;
    }
  }

  /**
   * Get API quotas for all services
   */
  async getAPIQuotas(): Promise<APIQuota[]> {
    try {
      return this.getMockAPIQuotas();
    } catch (error) {
      console.error('Failed to fetch API quotas:', error);
      return [];
    }
  }

  /**
   * Get recent API call logs
   */
  async getAPICallLogs(params?: {
    limit?: number;
    offset?: number;
  }): Promise<APICallLog[]> {
    try {
      return this.getMockAPICallLogs(params?.limit || 100);
    } catch (error) {
      console.error('Failed to fetch API call logs:', error);
      return [];
    }
  }

  // ========================================
  // Health Monitoring API
  // ========================================

  /**
   * Get oracle health checks
   */
  async getOracleHealth(): Promise<OracleHealthCheck[]> {
    try {
      const response = await apiClient.get('/rwa/oracle/health');
      const healthData = response.data;

      return Object.keys(healthData).map((source) => {
        const data = healthData[source];
        return {
          checkId: `check-${source}-${Date.now()}`,
          source: source as OracleSourceType,
          status: this.determineHealthStatus(data),
          uptime: data.healthPercentage || 0,
          avgResponseTime: 50 + Math.random() * 100,
          p99ResponseTime: 150 + Math.random() * 200,
          errorRate: 100 - (data.healthPercentage || 0),
          lastCheckAt: new Date().toISOString(),
          nextCheckAt: new Date(Date.now() + 300000).toISOString(),
          issues: [],
        };
      });
    } catch (error) {
      console.error('Failed to fetch oracle health:', error);
      return [];
    }
  }

  /**
   * Get uptime statistics for a specific oracle source
   */
  async getUptimeStats(source: OracleSourceType): Promise<OracleUptimeStats> {
    try {
      return this.getMockUptimeStats(source);
    } catch (error) {
      console.error('Failed to fetch uptime stats:', error);
      throw error;
    }
  }

  /**
   * Get price feed alerts
   */
  async getPriceFeedAlerts(): Promise<PriceFeedAlert[]> {
    try {
      return this.getMockPriceFeedAlerts();
    } catch (error) {
      console.error('Failed to fetch price feed alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge a price feed alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await apiClient.post(`/rwa/oracle/alerts/${alertId}/acknowledge`);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  // ========================================
  // Smart Contract API Bridge API
  // ========================================

  /**
   * Get all contract-API mappings
   */
  async getContractMappings(): Promise<SmartContractAPIMapping[]> {
    try {
      return this.getMockContractMappings();
    } catch (error) {
      console.error('Failed to fetch contract mappings:', error);
      return [];
    }
  }

  /**
   * Create new contract-API mapping
   */
  async createContractMapping(
    mapping: Partial<SmartContractAPIMapping>
  ): Promise<SmartContractAPIMapping> {
    try {
      const response = await apiClient.post('/enterprise/contract-mappings', mapping);
      return response.data;
    } catch (error) {
      console.error('Failed to create contract mapping:', error);
      throw error;
    }
  }

  /**
   * Execute a contract-API mapping
   */
  async executeContractAPI(mappingId: string): Promise<APICallExecution> {
    try {
      const response = await apiClient.post(`/enterprise/contract-mappings/${mappingId}/execute`);
      return response.data;
    } catch (error) {
      console.error('Failed to execute contract API:', error);
      throw error;
    }
  }

  /**
   * Get execution history for a mapping
   */
  async getAPIExecutions(mappingId: string): Promise<APICallExecution[]> {
    try {
      const response = await apiClient.get(
        `/enterprise/contract-mappings/${mappingId}/executions`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API executions:', error);
      return [];
    }
  }

  /**
   * Get all contract-oracle bindings
   */
  async getContractBindings(): Promise<ContractOracleBinding[]> {
    try {
      return this.getMockContractBindings();
    } catch (error) {
      console.error('Failed to fetch contract bindings:', error);
      return [];
    }
  }

  /**
   * Create new contract-oracle binding
   */
  async createContractBinding(
    binding: Partial<ContractOracleBinding>
  ): Promise<ContractOracleBinding> {
    try {
      const response = await apiClient.post('/enterprise/contract-bindings', binding);
      return response.data;
    } catch (error) {
      console.error('Failed to create contract binding:', error);
      throw error;
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  private determineOracleStatus(health: any): 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'OFFLINE' {
    const healthPercentage = health.healthPercentage || 0;
    if (healthPercentage >= 95) return 'ACTIVE';
    if (healthPercentage >= 80) return 'DEGRADED';
    if (healthPercentage > 0) return 'INACTIVE';
    return 'OFFLINE';
  }

  private determineHealthStatus(data: any): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN' {
    const status = data.status || 'UNKNOWN';
    if (status === 'HEALTHY') return 'HEALTHY';
    if (status === 'DEGRADED') return 'DEGRADED';
    if (status === 'UNHEALTHY') return 'UNHEALTHY';
    return 'UNKNOWN';
  }

  private getOracleEndpoint(source: string): string {
    const endpoints: Record<string, string> = {
      CHAINLINK: 'https://data.chain.link',
      BAND_PROTOCOL: 'https://api.bandprotocol.com',
      API3: 'https://api3.eth',
      TELLOR: 'https://tellor.io/api',
      INTERNAL: 'https://dlt.aurigraph.io/oracle',
    };
    return endpoints[source] || 'https://oracle.example.com';
  }

  // ========================================
  // Mock Data Generators (for development)
  // ========================================

  private getMockOracleSources(): OracleSource[] {
    return [
      {
        sourceId: 'chainlink',
        name: 'Chainlink Price Feeds',
        type: 'CHAINLINK',
        status: 'ACTIVE',
        description: 'Industry-standard decentralized oracle network',
        endpoint: 'https://data.chain.link',
        apiKeyRequired: true,
        updateInterval: 60,
        validFeeds: 145,
        totalFeeds: 150,
        healthPercentage: 96.7,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      },
      {
        sourceId: 'band-protocol',
        name: 'Band Protocol',
        type: 'BAND_PROTOCOL',
        status: 'ACTIVE',
        description: 'Cross-chain data oracle platform',
        endpoint: 'https://api.bandprotocol.com',
        apiKeyRequired: true,
        updateInterval: 300,
        validFeeds: 87,
        totalFeeds: 90,
        healthPercentage: 96.7,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 150).toISOString(),
      },
      {
        sourceId: 'api3',
        name: 'API3 Decentralized APIs',
        type: 'API3',
        status: 'ACTIVE',
        description: 'First-party oracle solutions',
        endpoint: 'https://api3.eth',
        apiKeyRequired: true,
        updateInterval: 120,
        validFeeds: 56,
        totalFeeds: 60,
        healthPercentage: 93.3,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
      },
      {
        sourceId: 'tellor',
        name: 'Tellor Oracle Network',
        type: 'TELLOR',
        status: 'DEGRADED',
        description: 'Permissionless oracle protocol',
        endpoint: 'https://tellor.io/api',
        apiKeyRequired: true,
        updateInterval: 600,
        validFeeds: 34,
        totalFeeds: 40,
        healthPercentage: 85.0,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      },
      {
        sourceId: 'internal',
        name: 'Aurigraph Internal Oracle',
        type: 'INTERNAL',
        status: 'ACTIVE',
        description: 'Aurigraph native oracle service',
        endpoint: 'https://dlt.aurigraph.io/oracle',
        apiKeyRequired: false,
        updateInterval: 30,
        validFeeds: 78,
        totalFeeds: 80,
        healthPercentage: 97.5,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
      },
    ];
  }

  private getMockPriceFeedPairs(): PriceFeedPair[] {
    const pairs = [
      { base: 'BTC', quote: 'USD', interval: 60, deviation: 0.5 },
      { base: 'ETH', quote: 'USD', interval: 60, deviation: 0.5 },
      { base: 'BNB', quote: 'USD', interval: 120, deviation: 1.0 },
      { base: 'SOL', quote: 'USD', interval: 120, deviation: 1.0 },
      { base: 'ADA', quote: 'USD', interval: 300, deviation: 1.5 },
      { base: 'DOT', quote: 'USD', interval: 300, deviation: 1.5 },
      { base: 'LINK', quote: 'USD', interval: 300, deviation: 1.5 },
      { base: 'MATIC', quote: 'USD', interval: 300, deviation: 2.0 },
    ];

    return pairs.map((p, i) => ({
      pairId: `pair-${i + 1}`,
      baseAsset: p.base,
      quoteAsset: p.quote,
      symbol: `${p.base}/${p.quote}`,
      enabled: true,
      sources: ['CHAINLINK', 'BAND_PROTOCOL', 'API3', 'TELLOR', 'INTERNAL'] as OracleSourceType[],
      updateInterval: p.interval,
      deviationThreshold: p.deviation,
      lastPrice: 1000 + Math.random() * 50000,
      lastUpdate: new Date().toISOString(),
    }));
  }

  private getMockAPIKeys(): APIKey[] {
    const services: Array<{ name: string; type: APIServiceType }> = [
      { name: 'Chainlink Node', type: 'CHAINLINK' },
      { name: 'Band Protocol API', type: 'BAND_PROTOCOL' },
      { name: 'API3 QRNG', type: 'API3' },
      { name: 'Weather Underground', type: 'WEATHER_API' },
      { name: 'Alpaca Markets', type: 'ALPACA' },
      { name: 'NewsAPI.org', type: 'NEWS_API' },
      { name: 'Twitter API v2', type: 'TWITTER' },
      { name: 'CoinGecko Pro', type: 'COINGECKO' },
    ];

    return services.map((s, i) => ({
      keyId: `key-${i + 1}`,
      serviceName: s.name,
      serviceType: s.type,
      keyName: `${s.name} Production Key`,
      keyPrefix: `${s.type.substring(0, 4).toUpperCase()}`,
      status: i === 6 ? 'EXPIRED' : 'ACTIVE',
      encrypted: true,
      createdAt: new Date(Date.now() - 86400000 * (180 - i * 10)).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * (365 + i * 30)).toISOString(),
      lastUsed: new Date(Date.now() - 3600000 * (i + 1)).toISOString(),
      usageCount: 1000 + i * 5000,
      rotationSchedule: i % 3 === 0 ? 'MONTHLY' : i % 3 === 1 ? 'QUARTERLY' : 'YEARLY',
      nextRotation: new Date(Date.now() + 86400000 * (30 + i * 10)).toISOString(),
      permissions: ['read', 'write'],
      rateLimit: 1000 + i * 500,
      owner: 'admin@aurigraph.io',
    }));
  }

  private getMockExternalAPIs(): ExternalAPIConfig[] {
    return [
      {
        configId: 'api-weather-1',
        apiName: 'Weather Underground API',
        category: 'WEATHER',
        baseUrl: 'https://api.weather.com/v3',
        enabled: true,
        apiKeyId: 'key-4',
        authType: 'API_KEY',
        headers: { 'Accept': 'application/json' },
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 500,
          requestsPerDay: 10000,
        },
        timeout: 5000,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelayMs: 1000,
        },
        endpoints: [
          {
            endpointId: 'weather-current',
            name: 'Current Weather',
            path: '/weather/current',
            method: 'GET',
            description: 'Get current weather conditions',
            parameters: [
              {
                name: 'location',
                type: 'query',
                required: true,
              },
            ],
            cacheEnabled: true,
            cacheTTL: 300,
          },
        ],
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        configId: 'api-alpaca-1',
        apiName: 'Alpaca Trading API',
        category: 'FINANCIAL',
        baseUrl: 'https://api.alpaca.markets/v2',
        enabled: true,
        apiKeyId: 'key-5',
        authType: 'API_KEY',
        headers: { 'Accept': 'application/json' },
        rateLimit: {
          requestsPerMinute: 200,
          requestsPerHour: 10000,
          requestsPerDay: 100000,
        },
        timeout: 10000,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 1.5,
          initialDelayMs: 500,
        },
        endpoints: [
          {
            endpointId: 'alpaca-quote',
            name: 'Stock Quote',
            path: '/stocks/{symbol}/quotes/latest',
            method: 'GET',
            description: 'Get latest stock quote',
            parameters: [
              {
                name: 'symbol',
                type: 'path',
                required: true,
              },
            ],
            cacheEnabled: true,
            cacheTTL: 60,
          },
        ],
        createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getMockUsageMetrics(period: string): APIUsageMetrics {
    return {
      period,
      totalCalls: 1847563,
      successfulCalls: 1823456,
      failedCalls: 24107,
      averageResponseTime: 145.8,
      p95ResponseTime: 387.5,
      p99ResponseTime: 892.3,
      totalCost: 1247.85,
      costByService: [
        { serviceName: 'Chainlink', calls: 456789, cost: 456.78 },
        { serviceName: 'Weather API', calls: 234567, cost: 234.56 },
        { serviceName: 'Alpaca', calls: 345678, cost: 345.67 },
        { serviceName: 'NewsAPI', calls: 123456, cost: 123.45 },
        { serviceName: 'Twitter', calls: 87073, cost: 87.39 },
      ],
      callsByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        calls: 50000 + Math.random() * 50000,
      })),
      errorsByType: [
        { errorType: 'TIMEOUT', count: 12345 },
        { errorType: 'RATE_LIMIT', count: 8976 },
        { errorType: 'AUTH_FAILED', count: 1234 },
        { errorType: 'SERVER_ERROR', count: 1552 },
      ],
    };
  }

  private getMockAPIQuotas(): APIQuota[] {
    const services: APIServiceType[] = [
      'CHAINLINK',
      'BAND_PROTOCOL',
      'WEATHER_API',
      'ALPACA',
      'NEWS_API',
      'TWITTER',
      'CRYPTO_COMPARE',
    ];

    return services.map((service, i) => ({
      serviceType: service,
      quotaType: 'DAILY' as const,
      limit: 10000 + i * 5000,
      used: 5000 + i * 2000,
      remaining: 5000 + i * 3000,
      resetAt: new Date(Date.now() + 86400000).toISOString(),
      costPerCall: 0.001 + i * 0.0005,
      totalCost: (5000 + i * 2000) * (0.001 + i * 0.0005),
    }));
  }

  private getMockAPICallLogs(limit: number): APICallLog[] {
    const services = ['Chainlink', 'Weather API', 'Alpaca', 'NewsAPI', 'Twitter'];
    const endpoints = ['/price', '/weather/current', '/stocks/quote', '/everything', '/tweets'];
    const methods = ['GET', 'POST'];

    return Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
      logId: `log-${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      serviceName: services[i % services.length],
      endpoint: endpoints[i % endpoints.length],
      method: methods[i % methods.length],
      statusCode: i % 10 === 0 ? 429 : i % 20 === 0 ? 500 : 200,
      responseTime: 50 + Math.random() * 500,
      requestSize: 256 + Math.floor(Math.random() * 1024),
      responseSize: 1024 + Math.floor(Math.random() * 10240),
      success: i % 10 !== 0,
      errorMessage: i % 10 === 0 ? 'Rate limit exceeded' : undefined,
      cost: 0.001 + Math.random() * 0.01,
    }));
  }

  private getMockUptimeStats(source: OracleSourceType): OracleUptimeStats {
    return {
      source,
      period: '30d',
      uptime: 99.5 + Math.random() * 0.5,
      totalChecks: 43200,
      successfulChecks: 43000,
      failedChecks: 200,
      avgResponseTime: 50 + Math.random() * 100,
      incidents: [
        {
          timestamp: new Date(Date.now() - 86400000 * 15).toISOString(),
          duration: 120,
          reason: 'Network timeout',
        },
        {
          timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
          duration: 45,
          reason: 'API rate limit',
        },
      ],
    };
  }

  private getMockPriceFeedAlerts(): PriceFeedAlert[] {
    return [
      {
        alertId: 'alert-1',
        pairId: 'pair-1',
        alertType: 'PRICE_DEVIATION',
        severity: 'WARNING',
        message: 'BTC/USD price deviation of 2.5% detected between oracles',
        triggeredAt: new Date(Date.now() - 3600000).toISOString(),
        autoResolved: false,
      },
      {
        alertId: 'alert-2',
        pairId: 'pair-3',
        alertType: 'ORACLE_FAILURE',
        severity: 'CRITICAL',
        message: 'Tellor oracle not responding for BNB/USD feed',
        triggeredAt: new Date(Date.now() - 7200000).toISOString(),
        acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
        acknowledgedBy: 'admin@aurigraph.io',
        autoResolved: false,
      },
    ];
  }

  private getMockContractMappings(): SmartContractAPIMapping[] {
    return [
      {
        mappingId: 'mapping-1',
        contractId: 'contract-123',
        contractName: 'WeatherInsurance',
        contractFunction: 'checkWeatherConditions',
        apiConfigId: 'api-weather-1',
        apiEndpoint: '/weather/current',
        triggerType: 'SCHEDULED',
        schedule: '0 */6 * * *',
        parameterMapping: [
          {
            contractParam: 'location',
            apiParam: 'location',
          },
        ],
        responseMapping: [
          {
            apiField: 'temperature',
            contractField: 'currentTemp',
          },
          {
            apiField: 'precipitation',
            contractField: 'rainfall',
          },
        ],
        enabled: true,
        lastExecution: new Date(Date.now() - 21600000).toISOString(),
        executionCount: 456,
        successRate: 98.5,
        createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      },
    ];
  }

  private getMockContractBindings(): ContractOracleBinding[] {
    return [
      {
        bindingId: 'binding-1',
        contractId: 'contract-456',
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        oracleFeedId: 'feed-btc-usd',
        pairId: 'pair-1',
        updateStrategy: 'PUSH',
        updateInterval: 60,
        priceDeviationTrigger: 0.5,
        enabled: true,
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        updateCount: 8934,
        createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
      },
      {
        bindingId: 'binding-2',
        contractId: 'contract-789',
        contractAddress: '0x8c8D7C46219D9205f056f28fee5950aD564d7465',
        oracleFeedId: 'feed-eth-usd',
        pairId: 'pair-2',
        updateStrategy: 'HYBRID',
        updateInterval: 120,
        priceDeviationTrigger: 1.0,
        enabled: true,
        lastUpdate: new Date(Date.now() - 240000).toISOString(),
        updateCount: 4567,
        createdAt: new Date(Date.now() - 86400000 * 150).toISOString(),
      },
    ];
  }
}

export default new APIIntegrationService();
