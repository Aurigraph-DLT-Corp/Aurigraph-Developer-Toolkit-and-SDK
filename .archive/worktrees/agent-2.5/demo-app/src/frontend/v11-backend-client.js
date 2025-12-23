/**
 * Aurigraph V11 Backend API Client
 * Epic: AV11-192, Task: AV11-204
 * Handles all communication with the Aurigraph V11 Java/Quarkus backend
 */

class V11BackendClient {
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || 'http://localhost:9003',
            apiPrefix: config.apiPrefix || '/api/v11',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000
        };

        this.metrics = {
            requestsSent: 0,
            requestsSuccessful: 0,
            requestsFailed: 0,
            averageResponseTime: 0,
            lastRequestTime: null
        };

        this.cache = new Map();
        this.cacheExpiry = 5000; // 5 seconds
    }

    /**
     * Get full API URL
     */
    _getUrl(endpoint) {
        return `${this.config.baseUrl}${this.config.apiPrefix}${endpoint}`;
    }

    /**
     * Make HTTP request with retry logic
     */
    async _request(method, endpoint, data = null, options = {}) {
        const url = this._getUrl(endpoint);
        const startTime = Date.now();

        this.metrics.requestsSent++;

        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(data);
        }

        let lastError;
        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const response = await fetch(url, {
                    ...requestOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const responseTime = Date.now() - startTime;
                this._updateMetrics(true, responseTime);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                return { success: true, data: result, responseTime };

            } catch (error) {
                lastError = error;
                console.warn(`Request attempt ${attempt + 1} failed:`, error.message);

                if (attempt < this.config.retryAttempts - 1) {
                    await this._delay(this.config.retryDelay * (attempt + 1));
                }
            }
        }

        this._updateMetrics(false, Date.now() - startTime);
        return {
            success: false,
            error: lastError.message,
            responseTime: Date.now() - startTime
        };
    }

    /**
     * Update request metrics
     */
    _updateMetrics(success, responseTime) {
        if (success) {
            this.metrics.requestsSuccessful++;
        } else {
            this.metrics.requestsFailed++;
        }

        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
        this.metrics.lastRequestTime = Date.now();
    }

    /**
     * Delay helper for retry logic
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get cached data if available and not expired
     */
    _getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cache data
     */
    _setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // ===========================
    // V11 API Endpoints
    // ===========================

    /**
     * Get system health status
     */
    async getHealth() {
        const cached = this._getCached('health');
        if (cached) return { success: true, data: cached };

        const result = await this._request('GET', '/health');
        if (result.success) {
            this._setCache('health', result.data);
        }
        return result;
    }

    /**
     * Get system information
     */
    async getInfo() {
        const cached = this._getCached('info');
        if (cached) return { success: true, data: cached };

        const result = await this._request('GET', '/info');
        if (result.success) {
            this._setCache('info', result.data);
        }
        return result;
    }

    /**
     * Get performance statistics
     */
    async getPerformance() {
        return await this._request('GET', '/performance');
    }

    /**
     * Get transaction statistics
     */
    async getStats() {
        return await this._request('GET', '/stats');
    }

    /**
     * Submit transaction to the network
     */
    async submitTransaction(transaction) {
        return await this._request('POST', '/transactions', transaction);
    }

    /**
     * Get transaction by ID
     */
    async getTransaction(transactionId) {
        return await this._request('GET', `/transactions/${transactionId}`);
    }

    /**
     * Get recent transactions
     */
    async getRecentTransactions(limit = 10) {
        return await this._request('GET', `/transactions?limit=${limit}`);
    }

    /**
     * Get node information
     */
    async getNode(nodeId) {
        return await this._request('GET', `/nodes/${nodeId}`);
    }

    /**
     * Get all nodes
     */
    async getNodes() {
        return await this._request('GET', '/nodes');
    }

    /**
     * Get consensus state
     */
    async getConsensusState() {
        return await this._request('GET', '/consensus/state');
    }

    /**
     * Get blockchain height
     */
    async getBlockchainHeight() {
        return await this._request('GET', '/blockchain/height');
    }

    /**
     * Get block by height
     */
    async getBlock(height) {
        return await this._request('GET', `/blockchain/blocks/${height}`);
    }

    /**
     * Get recent blocks
     */
    async getRecentBlocks(limit = 10) {
        return await this._request('GET', `/blockchain/blocks?limit=${limit}`);
    }

    /**
     * Trigger performance test
     */
    async runPerformanceTest(config = {}) {
        return await this._request('POST', '/performance/test', config);
    }

    /**
     * Get AI optimization metrics
     */
    async getAIMetrics() {
        return await this._request('GET', '/ai/metrics');
    }

    /**
     * Get quantum cryptography status
     */
    async getQuantumCryptoStatus() {
        return await this._request('GET', '/crypto/quantum/status');
    }

    /**
     * Get cross-chain bridge statistics
     */
    async getBridgeStats() {
        return await this._request('GET', '/bridge/stats');
    }

    /**
     * Get HMS integration status
     */
    async getHMSStatus() {
        return await this._request('GET', '/hms/status');
    }

    /**
     * Stream system metrics (using Server-Sent Events if available)
     */
    async streamMetrics(callback) {
        const url = this._getUrl('/metrics/stream');

        try {
            const eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callback({ success: true, data: data });
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                eventSource.close();
                callback({ success: false, error: 'Stream closed' });
            };

            return {
                success: true,
                close: () => eventSource.close()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get client metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            successRate: this.metrics.requestsSent > 0
                ? ((this.metrics.requestsSuccessful / this.metrics.requestsSent) * 100).toFixed(2)
                : 0
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            requestsSent: 0,
            requestsSuccessful: 0,
            requestsFailed: 0,
            averageResponseTime: 0,
            lastRequestTime: null
        };
    }

    /**
     * Check if V11 backend is available
     */
    async isAvailable() {
        try {
            const result = await this.getHealth();
            return result.success;
        } catch (error) {
            return false;
        }
    }

    /**
     * Batch requests
     */
    async batchRequest(requests) {
        const results = await Promise.allSettled(
            requests.map(req => this._request(req.method, req.endpoint, req.data))
        );

        return results.map((result, index) => ({
            request: requests[index],
            ...result.value
        }));
    }

    /**
     * Poll for updates
     */
    startPolling(endpoint, interval, callback) {
        const pollId = setInterval(async () => {
            const result = await this._request('GET', endpoint);
            callback(result);
        }, interval);

        return {
            stop: () => clearInterval(pollId)
        };
    }

    /**
     * Get configuration
     */
    getConfig() {
        return {
            ...this.config
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = V11BackendClient;
}
