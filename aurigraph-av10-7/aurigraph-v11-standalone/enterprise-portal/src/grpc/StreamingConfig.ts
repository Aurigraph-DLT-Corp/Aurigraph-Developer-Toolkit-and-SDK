/**
 * StreamingConfig.ts
 * Configuration for WebSocket to gRPC-Web migration
 *
 * This configuration allows gradual migration from WebSocket to gRPC-Web
 * with feature flags to enable/disable each streaming endpoint.
 *
 * Migration Strategy:
 * 1. Both protocols are available simultaneously
 * 2. Feature flags control which protocol is used
 * 3. Can rollback to WebSocket if issues arise
 * 4. Once stable, deprecate WebSocket endpoints
 */

// ============================================================================
// TYPES
// ============================================================================

export type StreamProtocol = 'websocket' | 'grpc-web' | 'auto'

export interface StreamEndpointConfig {
  protocol: StreamProtocol
  enabled: boolean
  fallbackToWebSocket: boolean
}

export interface StreamingConfig {
  // Global settings
  defaultProtocol: StreamProtocol
  enableFallback: boolean
  debug: boolean

  // Per-endpoint configuration
  endpoints: {
    metrics: StreamEndpointConfig
    consensus: StreamEndpointConfig
    validators: StreamEndpointConfig
    network: StreamEndpointConfig
    transactions: StreamEndpointConfig
    analytics: StreamEndpointConfig
  }

  // WebSocket configuration (legacy)
  websocket: {
    baseUrl: string
    secureBaseUrl: string
    reconnectEnabled: boolean
    maxReconnectAttempts: number
  }

  // gRPC-Web configuration (new)
  grpcWeb: {
    baseUrl: string
    secureBaseUrl: string
    timeout: number
    maxReconnectAttempts: number
  }
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  // Use gRPC-Web by default in production, auto-detect in development
  defaultProtocol: isProduction ? 'grpc-web' : 'auto',
  enableFallback: true,
  debug: isDevelopment,

  endpoints: {
    metrics: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    },
    consensus: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    },
    validators: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    },
    network: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    },
    transactions: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    },
    analytics: {
      protocol: 'grpc-web',
      enabled: true,
      fallbackToWebSocket: true
    }
  },

  websocket: {
    baseUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:9003',
    secureBaseUrl: import.meta.env.VITE_WSS_URL || 'wss://dlt.aurigraph.io',
    reconnectEnabled: true,
    maxReconnectAttempts: 10
  },

  grpcWeb: {
    // Use secure URL in production, localhost for development
    baseUrl: import.meta.env.VITE_GRPC_WEB_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://dlt.aurigraph.io/grpc-web' : 'http://localhost:8080'),
    secureBaseUrl: import.meta.env.VITE_GRPC_WEB_SECURE_URL || 'https://dlt.aurigraph.io/grpc-web',
    timeout: 30000,
    maxReconnectAttempts: 10
  }
}

// ============================================================================
// STREAMING CONFIG MANAGER
// ============================================================================

class StreamingConfigManager {
  private config: StreamingConfig
  private listeners: Set<(config: StreamingConfig) => void> = new Set()

  constructor(initialConfig: StreamingConfig = DEFAULT_STREAMING_CONFIG) {
    this.config = { ...initialConfig }

    // Auto-detect protocol based on environment
    if (this.config.defaultProtocol === 'auto') {
      this.config.defaultProtocol = this.detectBestProtocol()
    }

    // Apply URL based on environment
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:'
      const isProduction = window.location.hostname === 'dlt.aurigraph.io'

      if (isProduction) {
        this.config.websocket.baseUrl = this.config.websocket.secureBaseUrl
        this.config.grpcWeb.baseUrl = this.config.grpcWeb.secureBaseUrl
      } else if (isSecure) {
        // Local HTTPS development
        this.config.websocket.baseUrl = this.config.websocket.secureBaseUrl.replace('dlt.aurigraph.io', window.location.host)
        this.config.grpcWeb.baseUrl = this.config.grpcWeb.secureBaseUrl.replace('dlt.aurigraph.io', window.location.host)
      }
    }
  }

  /**
   * Detect the best protocol based on browser capabilities
   */
  private detectBestProtocol(): StreamProtocol {
    // Check if browser supports HTTP/2 (required for gRPC-Web efficiency)
    // Most modern browsers support HTTP/2, so default to gRPC-Web
    const supportsHttp2 = typeof window !== 'undefined' && 'fetch' in window

    if (supportsHttp2) {
      return 'grpc-web'
    }

    return 'websocket'
  }

  /**
   * Get current configuration
   */
  getConfig(): StreamingConfig {
    return { ...this.config }
  }

  /**
   * Get configuration for a specific endpoint
   */
  getEndpointConfig(endpoint: keyof StreamingConfig['endpoints']): StreamEndpointConfig {
    return { ...this.config.endpoints[endpoint] }
  }

  /**
   * Check if gRPC-Web should be used for an endpoint
   */
  shouldUseGrpcWeb(endpoint: keyof StreamingConfig['endpoints']): boolean {
    const endpointConfig = this.config.endpoints[endpoint]

    if (!endpointConfig.enabled) {
      return false
    }

    return endpointConfig.protocol === 'grpc-web' ||
           (endpointConfig.protocol === 'auto' && this.config.defaultProtocol === 'grpc-web')
  }

  /**
   * Update endpoint configuration
   */
  setEndpointProtocol(endpoint: keyof StreamingConfig['endpoints'], protocol: StreamProtocol): void {
    this.config.endpoints[endpoint].protocol = protocol
    this.notifyListeners()
  }

  /**
   * Enable/disable fallback
   */
  setFallbackEnabled(enabled: boolean): void {
    this.config.enableFallback = enabled
    this.notifyListeners()
  }

  /**
   * Enable/disable debug mode
   */
  setDebug(enabled: boolean): void {
    this.config.debug = enabled
    this.notifyListeners()
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: StreamingConfig) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of configuration change
   */
  private notifyListeners(): void {
    const config = this.getConfig()
    this.listeners.forEach(listener => listener(config))
  }

  /**
   * Get WebSocket URL for an endpoint
   */
  getWebSocketUrl(endpoint: string): string {
    const baseUrl = this.config.websocket.baseUrl
    const paths: Record<string, string> = {
      metrics: '/ws/metrics',
      consensus: '/ws/consensus',
      validators: '/ws/validators',
      network: '/ws/network',
      transactions: '/ws/transactions'
    }
    return `${baseUrl}${paths[endpoint] || ''}`
  }

  /**
   * Get gRPC-Web URL
   */
  getGrpcWebUrl(): string {
    return this.config.grpcWeb.baseUrl
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics(): Record<string, any> {
    return {
      config: this.config,
      environment: {
        isDevelopment,
        isProduction,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown'
      },
      endpoints: Object.entries(this.config.endpoints).map(([name, config]) => ({
        name,
        protocol: config.protocol,
        enabled: config.enabled,
        useGrpcWeb: this.shouldUseGrpcWeb(name as keyof StreamingConfig['endpoints'])
      }))
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const streamingConfig = new StreamingConfigManager()

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__streamingConfig = streamingConfig
}

export default streamingConfig
