/**
 * topology-api.js - Topology API Client
 *
 * Sprint 10-11 Implementation (AV11-605-04)
 * REST API and WebSocket client for Token Topology
 *
 * Features:
 * - REST API client for topology data
 * - WebSocket event handling for real-time updates
 * - Caching and optimization
 * - Error handling and retry logic
 *
 * @author J4C Development Agent
 * @version 12.2.0
 * @since AV11-605-04
 */

(function(global) {
  'use strict';

  // Configuration
  const CONFIG = {
    baseUrl: '/api/v12/topology',
    compositeTokensUrl: '/api/v11/rwa/tokens/composite',
    wsUrl: null, // Will be set dynamically
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheTTL: 60000 // 1 minute
  };

  // Simple cache implementation
  const cache = {
    data: new Map(),
    timestamps: new Map(),

    get(key) {
      if (!CONFIG.cacheEnabled) return null;
      const timestamp = this.timestamps.get(key);
      if (!timestamp || Date.now() - timestamp > CONFIG.cacheTTL) {
        this.data.delete(key);
        this.timestamps.delete(key);
        return null;
      }
      return this.data.get(key);
    },

    set(key, value) {
      if (!CONFIG.cacheEnabled) return;
      this.data.set(key, value);
      this.timestamps.set(key, Date.now());
    },

    clear() {
      this.data.clear();
      this.timestamps.clear();
    }
  };

  // HTTP client with retry logic
  async function fetchWithRetry(url, options = {}, attempts = CONFIG.retryAttempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    const fetchOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (attempts > 1 && !error.name?.includes('Abort')) {
        console.warn(`Retrying request to ${url}, attempts remaining: ${attempts - 1}`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        return fetchWithRetry(url, options, attempts - 1);
      }

      throw error;
    }
  }

  // TopologyAPI object
  const TopologyAPI = {
    /**
     * Get topology for a composite token
     *
     * @param {string} compositeId - Composite token ID
     * @param {Object} options - Request options
     * @param {number} options.depth - Depth of topology (default: 4)
     * @param {boolean} options.includeVerifiers - Include VVB verifiers
     * @param {string} options.format - Response format ('standard', 'd3', 'vis-network')
     * @returns {Promise<Object>} Topology data
     */
    async getTopology(compositeId, options = {}) {
      const { depth = 4, includeVerifiers = true, format = 'd3' } = options;

      // Check cache first
      const cacheKey = `topology:${compositeId}:${depth}:${includeVerifiers}:${format}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('Returning cached topology for:', compositeId);
        return cached;
      }

      // Build URL based on format
      let url = `${CONFIG.baseUrl}/${compositeId}`;
      if (format === 'd3') {
        url = `${CONFIG.baseUrl}/${compositeId}/d3`;
      } else if (format === 'vis-network') {
        url = `${CONFIG.baseUrl}/${compositeId}/vis-network`;
      }

      const params = new URLSearchParams();
      params.append('depth', depth);
      params.append('includeVerifiers', includeVerifiers);

      try {
        const data = await fetchWithRetry(`${url}?${params}`);
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Failed to fetch topology:', error);
        throw error;
      }
    },

    /**
     * Get node details
     *
     * @param {string} compositeId - Composite token ID
     * @param {string} nodeId - Node ID
     * @returns {Promise<Object>} Node details
     */
    async getNodeDetails(compositeId, nodeId) {
      const cacheKey = `node:${compositeId}:${nodeId}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      try {
        const data = await fetchWithRetry(
          `${CONFIG.baseUrl}/${compositeId}/node/${nodeId}`
        );
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        console.error('Failed to fetch node details:', error);
        throw error;
      }
    },

    /**
     * Get node edges
     *
     * @param {string} compositeId - Composite token ID
     * @param {string} nodeId - Node ID
     * @returns {Promise<Object>} Node edges
     */
    async getNodeEdges(compositeId, nodeId) {
      try {
        return await fetchWithRetry(
          `${CONFIG.baseUrl}/${compositeId}/node/${nodeId}/edges`
        );
      } catch (error) {
        console.error('Failed to fetch node edges:', error);
        throw error;
      }
    },

    /**
     * Get node children
     *
     * @param {string} compositeId - Composite token ID
     * @param {string} nodeId - Node ID
     * @returns {Promise<Object>} Child nodes
     */
    async getNodeChildren(compositeId, nodeId) {
      try {
        return await fetchWithRetry(
          `${CONFIG.baseUrl}/${compositeId}/node/${nodeId}/children`
        );
      } catch (error) {
        console.error('Failed to fetch node children:', error);
        throw error;
      }
    },

    /**
     * Get topology statistics
     *
     * @param {string} compositeId - Composite token ID
     * @returns {Promise<Object>} Topology statistics
     */
    async getStats(compositeId) {
      try {
        return await fetchWithRetry(`${CONFIG.baseUrl}/${compositeId}/stats`);
      } catch (error) {
        console.error('Failed to fetch topology stats:', error);
        throw error;
      }
    },

    /**
     * Find path between two nodes
     *
     * @param {string} compositeId - Composite token ID
     * @param {string} fromNode - Source node ID
     * @param {string} toNode - Target node ID
     * @returns {Promise<Object>} Path information
     */
    async findPath(compositeId, fromNode, toNode) {
      try {
        const params = new URLSearchParams();
        params.append('from', fromNode);
        params.append('to', toNode);

        return await fetchWithRetry(
          `${CONFIG.baseUrl}/${compositeId}/path?${params}`
        );
      } catch (error) {
        console.error('Failed to find path:', error);
        throw error;
      }
    },

    /**
     * Get topologies by owner address
     *
     * @param {string} ownerAddress - Owner wallet address
     * @returns {Promise<Object>} Owner's topologies
     */
    async getTopologiesByOwner(ownerAddress) {
      try {
        return await fetchWithRetry(
          `${CONFIG.baseUrl}/by-owner/${ownerAddress}`
        );
      } catch (error) {
        console.error('Failed to fetch topologies by owner:', error);
        throw error;
      }
    },

    /**
     * Get topology for a contract
     *
     * @param {string} contractId - Contract ID
     * @param {number} depth - Depth of topology
     * @returns {Promise<Object>} Contract topology
     */
    async getContractTopology(contractId, depth = 4) {
      try {
        const params = new URLSearchParams();
        params.append('depth', depth);

        return await fetchWithRetry(
          `${CONFIG.baseUrl}/contract/${contractId}?${params}`
        );
      } catch (error) {
        console.error('Failed to fetch contract topology:', error);
        throw error;
      }
    },

    /**
     * Get list of composite tokens
     *
     * @returns {Promise<Array>} List of composite tokens
     */
    async getCompositeTokens() {
      const cacheKey = 'composite-tokens';
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      try {
        const data = await fetchWithRetry(CONFIG.compositeTokensUrl);
        const tokens = data.tokens || data || [];
        cache.set(cacheKey, tokens);
        return tokens;
      } catch (error) {
        console.error('Failed to fetch composite tokens:', error);
        // Return empty array instead of throwing
        return [];
      }
    },

    /**
     * Check topology service health
     *
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
      try {
        return await fetchWithRetry(`${CONFIG.baseUrl}/health`);
      } catch (error) {
        console.error('Topology service health check failed:', error);
        return { status: 'unhealthy', error: error.message };
      }
    },

    /**
     * Clear the cache
     */
    clearCache() {
      cache.clear();
      console.log('Topology cache cleared');
    }
  };

  // WebSocket Manager for real-time updates
  const TopologyWebSocket = {
    ws: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    listeners: new Map(),
    subscriptions: new Set(),

    /**
     * Connect to WebSocket server
     *
     * @param {Object} options - Connection options
     * @returns {Promise<void>}
     */
    connect(options = {}) {
      return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = options.url || `${protocol}//${window.location.host}/topology-ws`;

        try {
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            console.log('TopologyWebSocket connected');
            this.reconnectAttempts = 0;

            // Resubscribe to previous subscriptions
            this.subscriptions.forEach(compositeId => {
              this.subscribe(compositeId);
            });

            this.emit('connected');
            resolve();
          };

          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          };

          this.ws.onclose = (event) => {
            console.log('TopologyWebSocket closed:', event.code, event.reason);
            this.emit('disconnected', { code: event.code, reason: event.reason });
            this.attemptReconnect();
          };

          this.ws.onerror = (error) => {
            console.error('TopologyWebSocket error:', error);
            this.emit('error', error);
            reject(error);
          };
        } catch (error) {
          console.error('Failed to create WebSocket:', error);
          reject(error);
        }
      });
    },

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
      if (this.ws) {
        this.ws.close(1000, 'Client disconnect');
        this.ws = null;
      }
      this.subscriptions.clear();
    },

    /**
     * Subscribe to topology updates for a composite token
     *
     * @param {string} compositeId - Composite token ID
     */
    subscribe(compositeId) {
      this.subscriptions.add(compositeId);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'SUBSCRIBE',
          compositeId: compositeId
        });
        console.log('Subscribed to topology updates for:', compositeId);
      }
    },

    /**
     * Unsubscribe from topology updates
     *
     * @param {string} compositeId - Composite token ID
     */
    unsubscribe(compositeId) {
      this.subscriptions.delete(compositeId);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'UNSUBSCRIBE',
          compositeId: compositeId
        });
        console.log('Unsubscribed from topology updates for:', compositeId);
      }
    },

    /**
     * Send message to WebSocket server
     *
     * @param {Object} message - Message to send
     */
    send(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket not connected, message not sent:', message);
      }
    },

    /**
     * Handle incoming WebSocket message
     *
     * @param {Object} message - Received message
     */
    handleMessage(message) {
      switch (message.type) {
        case 'TOPOLOGY_UPDATE':
          this.emit('topologyUpdate', message);
          cache.clear(); // Invalidate cache on updates
          break;

        case 'NODE_ADDED':
          this.emit('nodeAdded', message);
          break;

        case 'NODE_UPDATED':
          this.emit('nodeUpdated', message);
          break;

        case 'NODE_REMOVED':
          this.emit('nodeRemoved', message);
          break;

        case 'EDGE_ADDED':
          this.emit('edgeAdded', message);
          break;

        case 'EDGE_REMOVED':
          this.emit('edgeRemoved', message);
          break;

        case 'VERIFICATION_UPDATE':
          this.emit('verificationUpdate', message);
          break;

        case 'PING':
          this.send({ type: 'PONG' });
          break;

        case 'ERROR':
          console.error('WebSocket error message:', message.error);
          this.emit('error', message);
          break;

        default:
          console.log('Unknown WebSocket message type:', message.type);
          this.emit('message', message);
      }
    },

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('reconnectFailed');
        return;
      }

      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    },

    /**
     * Add event listener
     *
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
    },

    /**
     * Remove event listener
     *
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
      }
    },

    /**
     * Emit event to listeners
     *
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in ${event} listener:`, error);
          }
        });
      }
    },

    /**
     * Check if connected
     *
     * @returns {boolean} Connection status
     */
    isConnected() {
      return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
  };

  // Export to global scope
  global.TopologyAPI = TopologyAPI;
  global.TopologyWebSocket = TopologyWebSocket;

  console.log('TopologyAPI v12.2.0 loaded');

})(typeof window !== 'undefined' ? window : this);
