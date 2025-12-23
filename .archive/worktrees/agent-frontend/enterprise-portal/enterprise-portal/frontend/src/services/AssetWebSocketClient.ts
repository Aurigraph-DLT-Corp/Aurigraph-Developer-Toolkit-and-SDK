/**
 * Asset & Registry WebSocket Client
 *
 * Handles WebSocket connections for real-time asset traceability and registry updates
 */

import { WS_URL, WS_RECONNECT_INTERVAL, WS_MAX_RECONNECT_ATTEMPTS } from '../utils/constants';
import { WS_ENDPOINTS } from '../utils/assetConstants';

export type AssetWSMessage = {
  type: 'asset_updated' | 'asset_transferred' | 'ownership_changed' | 'status_changed';
  assetId: string;
  timestamp: string;
  data: any;
};

export type RegistryWSMessage = {
  type: 'registry_updated' | 'contract_deployed' | 'compliance_alert' | 'certification_expiring';
  registryType: string;
  timestamp: string;
  data: any;
};

export type ComplianceWSMessage = {
  type: 'alert' | 'expiry_warning' | 'certification_renewed' | 'certification_revoked';
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
  data: any;
};

type WSMessageHandler<T> = (message: T) => void;

interface WebSocketConnection {
  socket: WebSocket | null;
  handlers: Set<WSMessageHandler<any>>;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  isIntentionallyClosed: boolean;
}

class AssetWebSocketClient {
  private connections: Map<string, WebSocketConnection> = new Map();
  private baseUrl: string;

  constructor() {
    this.baseUrl = WS_URL;
  }

  /**
   * Connect to asset traceability WebSocket
   */
  connectToAssetTraceability(traceId: string, handler: WSMessageHandler<AssetWSMessage>): () => void {
    const endpoint = WS_ENDPOINTS.ASSET_TRACEABILITY(traceId);
    return this.connect(endpoint, handler);
  }

  /**
   * Connect to registry WebSocket
   */
  connectToRegistry(registryType: string, handler: WSMessageHandler<RegistryWSMessage>): () => void {
    const endpoint = WS_ENDPOINTS.REGISTRY(registryType);
    return this.connect(endpoint, handler);
  }

  /**
   * Connect to compliance alerts WebSocket
   */
  connectToComplianceAlerts(handler: WSMessageHandler<ComplianceWSMessage>): () => void {
    const endpoint = WS_ENDPOINTS.COMPLIANCE_ALERTS;
    return this.connect(endpoint, handler);
  }

  /**
   * Connect to asset updates WebSocket
   */
  connectToAssetUpdates(handler: WSMessageHandler<AssetWSMessage>): () => void {
    const endpoint = WS_ENDPOINTS.ASSET_UPDATES;
    return this.connect(endpoint, handler);
  }

  /**
   * Generic connect method
   */
  private connect<T>(endpoint: string, handler: WSMessageHandler<T>): () => void {
    // Get or create connection
    let connection = this.connections.get(endpoint);

    if (!connection) {
      connection = {
        socket: null,
        handlers: new Set(),
        reconnectAttempts: 0,
        reconnectTimer: null,
        isIntentionallyClosed: false,
      };
      this.connections.set(endpoint, connection);
    }

    // Add handler
    connection.handlers.add(handler);

    // Create socket if not exists or closed
    if (!connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
      this.createSocket(endpoint);
    }

    // Return unsubscribe function
    return () => {
      const conn = this.connections.get(endpoint);
      if (conn) {
        conn.handlers.delete(handler);

        // Close connection if no more handlers
        if (conn.handlers.size === 0) {
          this.disconnect(endpoint);
        }
      }
    };
  }

  /**
   * Create WebSocket connection
   */
  private createSocket(endpoint: string): void {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[AssetWebSocket] Connecting to ${url}`);

      const socket = new WebSocket(url);
      connection.socket = socket;
      connection.isIntentionallyClosed = false;

      socket.onopen = () => {
        console.log(`[AssetWebSocket] Connected to ${endpoint}`);
        connection.reconnectAttempts = 0;

        // Notify all handlers about connection
        connection.handlers.forEach((handler) => {
          handler({ type: 'connected', timestamp: new Date().toISOString() } as any);
        });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`[AssetWebSocket] Message from ${endpoint}:`, message);

          // Broadcast to all handlers
          connection.handlers.forEach((handler) => {
            handler(message);
          });
        } catch (error) {
          console.error(`[AssetWebSocket] Failed to parse message:`, error);
        }
      };

      socket.onerror = (error) => {
        console.error(`[AssetWebSocket] Error on ${endpoint}:`, error);

        // Notify handlers about error
        connection.handlers.forEach((handler) => {
          handler({
            type: 'error',
            timestamp: new Date().toISOString(),
            data: { error: 'WebSocket error' },
          } as any);
        });
      };

      socket.onclose = (event) => {
        console.log(`[AssetWebSocket] Disconnected from ${endpoint}`, event.code, event.reason);

        // Notify handlers about disconnection
        connection.handlers.forEach((handler) => {
          handler({
            type: 'disconnected',
            timestamp: new Date().toISOString(),
            data: { code: event.code, reason: event.reason },
          } as any);
        });

        // Attempt reconnection if not intentionally closed
        if (!connection.isIntentionallyClosed && connection.reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
          connection.reconnectAttempts++;
          console.log(
            `[AssetWebSocket] Reconnecting to ${endpoint} (attempt ${connection.reconnectAttempts}/${WS_MAX_RECONNECT_ATTEMPTS})`
          );

          connection.reconnectTimer = setTimeout(() => {
            this.createSocket(endpoint);
          }, WS_RECONNECT_INTERVAL);
        } else if (connection.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
          console.error(`[AssetWebSocket] Max reconnection attempts reached for ${endpoint}`);
        }
      };
    } catch (error) {
      console.error(`[AssetWebSocket] Failed to create socket for ${endpoint}:`, error);
    }
  }

  /**
   * Disconnect from endpoint
   */
  disconnect(endpoint: string): void {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    console.log(`[AssetWebSocket] Disconnecting from ${endpoint}`);

    connection.isIntentionallyClosed = true;

    // Clear reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
      connection.reconnectTimer = null;
    }

    // Close socket
    if (connection.socket) {
      connection.socket.close(1000, 'Client disconnecting');
      connection.socket = null;
    }

    // Clear handlers
    connection.handlers.clear();

    // Remove connection
    this.connections.delete(endpoint);
  }

  /**
   * Disconnect all connections
   */
  disconnectAll(): void {
    console.log('[AssetWebSocket] Disconnecting all connections');
    const endpoints = Array.from(this.connections.keys());
    endpoints.forEach((endpoint) => this.disconnect(endpoint));
  }

  /**
   * Send message to endpoint
   */
  send(endpoint: string, message: any): boolean {
    const connection = this.connections.get(endpoint);
    if (!connection || !connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
      console.warn(`[AssetWebSocket] Cannot send message - not connected to ${endpoint}`);
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[AssetWebSocket] Failed to send message to ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Check if connected to endpoint
   */
  isConnected(endpoint: string): boolean {
    const connection = this.connections.get(endpoint);
    return !!connection && !!connection.socket && connection.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(endpoint: string): {
    connected: boolean;
    reconnectAttempts: number;
    handlerCount: number;
  } {
    const connection = this.connections.get(endpoint);
    if (!connection) {
      return {
        connected: false,
        reconnectAttempts: 0,
        handlerCount: 0,
      };
    }

    return {
      connected: !!connection.socket && connection.socket.readyState === WebSocket.OPEN,
      reconnectAttempts: connection.reconnectAttempts,
      handlerCount: connection.handlers.size,
    };
  }
}

// Export singleton instance
export const assetWebSocketClient = new AssetWebSocketClient();
export default assetWebSocketClient;
