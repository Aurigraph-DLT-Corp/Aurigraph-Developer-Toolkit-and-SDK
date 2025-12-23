/**
 * Aurigraph V11 API Client
 * Provides centralized API access to V11 backend services
 *
 * Base URL: https://dlt.aurigraph.io/api/v11/
 * Fallback: http://localhost:9003/api/v11/
 */

class V11ApiClient {
    constructor(config = {}) {
        // API Configuration
        this.baseUrl = config.baseUrl || 'https://dlt.aurigraph.io/api/v11/legacy';
        this.fallbackUrl = config.fallbackUrl || 'http://localhost:9003/api/v11/legacy';
        this.timeout = config.timeout || 10000; // 10 seconds
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;

        // State management
        this.useFallback = false;
        this.isOnline = true;
        this.lastHealthCheck = null;
        this.healthCheckInterval = null;

        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            lastError: null
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize the API client
     */
    async init() {
        console.log('[V11 API Client] Initializing...');

        // Check initial health
        await this.healthCheck();

        // Start periodic health checks (every 30 seconds)
        this.healthCheckInterval = setInterval(() => {
            this.healthCheck();
        }, 30000);

        console.log('[V11 API Client] Initialized successfully');
    }

    /**
     * Perform health check on the API
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            const response = await this.request('/health', {
                method: 'GET',
                skipRetry: true
            });

            const latency = Date.now() - startTime;

            if (response && response.status === 'HEALTHY') {
                this.isOnline = true;
                this.lastHealthCheck = {
                    timestamp: new Date(),
                    status: 'healthy',
                    latency: latency,
                    version: response.version,
                    uptime: response.uptimeSeconds
                };

                console.log(`[V11 API Client] Health check passed (${latency}ms) - Version: ${response.version}`);
                return true;
            }
        } catch (error) {
            this.isOnline = false;
            this.lastHealthCheck = {
                timestamp: new Date(),
                status: 'unhealthy',
                error: error.message
            };

            console.warn('[V11 API Client] Health check failed:', error.message);

            // Try fallback URL
            if (!this.useFallback) {
                console.log('[V11 API Client] Switching to fallback URL...');
                this.useFallback = true;
                return await this.healthCheck();
            }
        }

        return false;
    }

    /**
     * Make an API request with automatic retry and fallback
     */
    async request(endpoint, options = {}) {
        const url = (this.useFallback ? this.fallbackUrl : this.baseUrl) + endpoint;
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        if (options.body) {
            requestOptions.body = JSON.stringify(options.body);
        }

        let lastError = null;
        const maxAttempts = options.skipRetry ? 1 : this.retryAttempts;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                this.metrics.totalRequests++;
                const startTime = Date.now();

                const response = await fetch(url, requestOptions);

                const latency = Date.now() - startTime;
                this.updateAverageLatency(latency);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.metrics.successfulRequests++;

                return data;

            } catch (error) {
                lastError = error;
                this.metrics.failedRequests++;
                this.metrics.lastError = error.message;

                console.warn(`[V11 API Client] Request failed (attempt ${attempt}/${maxAttempts}):`, error.message);

                // If first attempt failed and not using fallback, try fallback
                if (attempt === 1 && !this.useFallback && !options.skipRetry) {
                    console.log('[V11 API Client] Trying fallback URL...');
                    this.useFallback = true;
                    continue;
                }

                // Wait before retry
                if (attempt < maxAttempts) {
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        // All attempts failed
        throw lastError || new Error('Request failed');
    }

    /**
     * Get system information
     */
    async getSystemInfo() {
        return await this.request('/info');
    }

    /**
     * Get system health status
     */
    async getHealth() {
        return await this.request('/health');
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStats() {
        return await this.request('/stats');
    }

    /**
     * Get system status (comprehensive)
     */
    async getSystemStatus() {
        return await this.request('/system/status');
    }

    /**
     * Run performance test
     */
    async runPerformanceTest(iterations = 100000, threads = 256) {
        return await this.request(`/performance?iterations=${iterations}&threads=${threads}`);
    }

    /**
     * Run ultra-high throughput test
     */
    async runUltraHighThroughputTest(iterations = 1000000) {
        return await this.request('/performance/ultra-throughput', {
            method: 'POST',
            body: { iterations }
        });
    }

    /**
     * Run SIMD-optimized batch test
     */
    async runSIMDBatchTest(batchSize = 500000) {
        return await this.request('/performance/simd-batch', {
            method: 'POST',
            body: { batchSize }
        });
    }

    /**
     * Run adaptive batch test
     */
    async runAdaptiveBatchTest(requestCount = 1000000) {
        return await this.request('/performance/adaptive-batch', {
            method: 'POST',
            body: { requestCount }
        });
    }

    /**
     * Get API client metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
                : 0,
            isOnline: this.isOnline,
            currentUrl: this.useFallback ? this.fallbackUrl : this.baseUrl,
            lastHealthCheck: this.lastHealthCheck
        };
    }

    /**
     * Update average latency (exponential moving average)
     */
    updateAverageLatency(latency) {
        if (this.metrics.averageLatency === 0) {
            this.metrics.averageLatency = latency;
        } else {
            // EMA with alpha = 0.3
            this.metrics.averageLatency = (0.3 * latency) + (0.7 * this.metrics.averageLatency);
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destroy the client and cleanup
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        console.log('[V11 API Client] Destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = V11ApiClient;
}
