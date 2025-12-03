/**
 * WebSocketConfig.ts
 * Central configuration and connection management for WebSocket endpoints
 *
 * Features:
 * - Connection pooling and management
 * - Global connection status
 * - Health monitoring
 * - Event broadcasting
 */

// ============================================================================
// TYPES
// ============================================================================

export type WebSocketEndpoint =
  | 'metrics'
  | 'transactions'
  | 'validators'
  | 'consensus'
  | 'network'

export interface WebSocketConnection {
  endpoint: WebSocketEndpoint
  url: string
  ws: WebSocket | null
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  reconnectAttempts: number
  lastError: string | null
  lastConnected: number | null
  lastDisconnected: number | null
}

export interface GlobalWebSocketStatus {
  totalConnections: number
  activeConnections: number
  failedConnections: number
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  connections: Map<WebSocketEndpoint, WebSocketConnection>
}

export type WebSocketEventCallback = (endpoint: WebSocketEndpoint, status: string) => void

// ============================================================================
// CONFIGURATION
// ============================================================================

export const WS_CONFIG = {
  // Base URLs
  baseUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:9003',
  secureBaseUrl: process.env.REACT_APP_WSS_URL || 'wss://dlt.aurigraph.io',

  // Endpoints
  endpoints: {
    metrics: '/ws/metrics',
    transactions: '/ws/transactions',
    validators: '/ws/validators',
    consensus: '/ws/consensus',
    network: '/ws/network'
  } as Record<WebSocketEndpoint, string>,

  // Reconnection settings
  reconnect: {
    enabled: true,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    multiplier: 2,
    maxAttempts: 10
  },

  // Timeouts
  timeouts: {
    connection: 5000, // 5 seconds
    ping: 30000, // 30 seconds
    message: 10000 // 10 seconds
  },

  // Feature flags
  features: {
    autoReconnect: true,
    batchUpdates: true,
    compressionEnabled: false,
    heartbeatEnabled: true
  }
}

// ============================================================================
// CONNECTION MANAGER
// ============================================================================

class WebSocketManager {
  private connections: Map<WebSocketEndpoint, WebSocketConnection> = new Map()
  private eventCallbacks: Set<WebSocketEventCallback> = new Set()
  private heartbeatIntervals: Map<WebSocketEndpoint, NodeJS.Timeout> = new Map()

  /**
   * Get the full WebSocket URL for an endpoint
   */
  getWebSocketUrl(endpoint: WebSocketEndpoint, secure: boolean = false): string {
    const baseUrl = secure ? WS_CONFIG.secureBaseUrl : WS_CONFIG.baseUrl
    const path = WS_CONFIG.endpoints[endpoint]
    return `${baseUrl}${path}`
  }

  /**
   * Register a connection
   */
  registerConnection(endpoint: WebSocketEndpoint, ws: WebSocket): void {
    const connection: WebSocketConnection = {
      endpoint,
      url: this.getWebSocketUrl(endpoint),
      ws,
      status: 'CONNECTING',
      reconnectAttempts: 0,
      lastError: null,
      lastConnected: null,
      lastDisconnected: null
    }

    this.connections.set(endpoint, connection)
    this.notifyListeners(endpoint, 'CONNECTING')
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(
    endpoint: WebSocketEndpoint,
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR',
    error?: string
  ): void {
    const connection = this.connections.get(endpoint)
    if (!connection) return

    connection.status = status
    if (error) connection.lastError = error

    if (status === 'CONNECTED') {
      connection.lastConnected = Date.now()
      connection.reconnectAttempts = 0
      this.startHeartbeat(endpoint)
    } else if (status === 'DISCONNECTED' || status === 'ERROR') {
      connection.lastDisconnected = Date.now()
      this.stopHeartbeat(endpoint)
    }

    this.notifyListeners(endpoint, status)
  }

  /**
   * Increment reconnection attempts
   */
  incrementReconnectAttempts(endpoint: WebSocketEndpoint): number {
    const connection = this.connections.get(endpoint)
    if (!connection) return 0

    connection.reconnectAttempts++
    return connection.reconnectAttempts
  }

  /**
   * Get connection info
   */
  getConnection(endpoint: WebSocketEndpoint): WebSocketConnection | undefined {
    return this.connections.get(endpoint)
  }

  /**
   * Get global status
   */
  getGlobalStatus(): GlobalWebSocketStatus {
    const total = this.connections.size
    const active = Array.from(this.connections.values()).filter(
      c => c.status === 'CONNECTED'
    ).length
    const failed = Array.from(this.connections.values()).filter(
      c => c.status === 'ERROR'
    ).length

    let overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY'

    if (total === 0) {
      overallHealth = 'CRITICAL'
    } else {
      const healthRatio = active / total

      if (healthRatio < 0.5) {
        overallHealth = 'CRITICAL'
      } else if (healthRatio < 0.8) {
        overallHealth = 'DEGRADED'
      }
    }

    return {
      totalConnections: total,
      activeConnections: active,
      failedConnections: failed,
      overallHealth,
      connections: new Map(this.connections)
    }
  }

  /**
   * Subscribe to connection events
   */
  subscribe(callback: WebSocketEventCallback): () => void {
    this.eventCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.eventCallbacks.delete(callback)
    }
  }

  /**
   * Notify all listeners of connection status change
   */
  private notifyListeners(endpoint: WebSocketEndpoint, status: string): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(endpoint, status)
      } catch (err) {
        console.error('Error in WebSocket event callback:', err)
      }
    })
  }

  /**
   * Start heartbeat for a connection
   */
  private startHeartbeat(endpoint: WebSocketEndpoint): void {
    if (!WS_CONFIG.features.heartbeatEnabled) return

    // Clear existing heartbeat if any
    this.stopHeartbeat(endpoint)

    const interval = setInterval(() => {
      const connection = this.connections.get(endpoint)
      if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat(endpoint)
        return
      }

      try {
        connection.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      } catch (err) {
        console.error(`Heartbeat failed for ${endpoint}:`, err)
        this.stopHeartbeat(endpoint)
      }
    }, WS_CONFIG.timeouts.ping)

    this.heartbeatIntervals.set(endpoint, interval)
  }

  /**
   * Stop heartbeat for a connection
   */
  private stopHeartbeat(endpoint: WebSocketEndpoint): void {
    const interval = this.heartbeatIntervals.get(endpoint)
    if (interval) {
      clearInterval(interval)
      this.heartbeatIntervals.delete(endpoint)
    }
  }

  /**
   * Close a connection
   */
  closeConnection(endpoint: WebSocketEndpoint): void {
    const connection = this.connections.get(endpoint)
    if (!connection) return

    this.stopHeartbeat(endpoint)

    if (connection.ws) {
      connection.ws.close()
    }

    this.connections.delete(endpoint)
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    this.connections.forEach((_, endpoint) => {
      this.closeConnection(endpoint)
    })
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, any> {
    const status = this.getGlobalStatus()

    return {
      timestamp: new Date().toISOString(),
      globalStatus: status,
      config: WS_CONFIG,
      connections: Array.from(this.connections.entries()).map(([endpoint, conn]) => ({
        endpoint,
        status: conn.status,
        reconnectAttempts: conn.reconnectAttempts,
        lastConnected: conn.lastConnected,
        lastDisconnected: conn.lastDisconnected,
        lastError: conn.lastError
      }))
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const webSocketManager = new WebSocketManager()

// Export for debugging
if (typeof window !== 'undefined') {
  ;(window as any).__webSocketManager = webSocketManager
}
