/**
 * WebSocket Service
 *
 * Manages real-time connections to V11 backend WebSocket endpoints:
 * - /ws/transactions - Real-time transaction updates
 * - /ws/validators - Validator status changes
 * - /ws/consensus - Consensus protocol events
 * - /ws/network - Network topology updates
 * - /ws/metrics - Performance metrics streaming
 * - /ws/channels - Multi-channel updates
 * - /api/v11/live/stream - Unified live data stream
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Message type routing
 * - Subscription-based event handling
 * - Connection state tracking
 * - Graceful error handling
 */

import { WS_URL, WS_RECONNECT_INTERVAL, WS_MAX_RECONNECT_ATTEMPTS } from '../utils/constants';

export type WebSocketChannel =
  | 'transactions'
  | 'validators'
  | 'consensus'
  | 'network'
  | 'metrics'
  | 'channels'
  | 'live-stream';

export type WebSocketMessageType =
  | 'transaction'
  | 'validator'
  | 'consensus'
  | 'network'
  | 'metric'
  | 'channel'
  | 'error'
  | 'connected'
  | 'disconnected';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  channel: WebSocketChannel;
  data: any;
  timestamp: string;
  messageId?: string;
}

export interface WebSocketEvent {
  type?: WebSocketMessageType;
  channel: WebSocketChannel;
  data: any;
  timestamp: string;
}

type MessageListener = (message: WebSocketEvent) => void;

class WebSocketService {
  private wsUrl: string;
  private connections: Map<WebSocketChannel, WebSocket> = new Map();
  private listeners: Map<WebSocketChannel, Set<MessageListener>> = new Map();
  private reconnectAttempts: Map<WebSocketChannel, number> = new Map();
  private reconnectTimers: Map<WebSocketChannel, NodeJS.Timeout> = new Map();
  private connectionStates: Map<WebSocketChannel, 'connecting' | 'connected' | 'disconnected'> = new Map();

  constructor(baseUrl: string = WS_URL) {
    this.wsUrl = baseUrl;
    this.initializeChannels();
  }

  /**
   * Initialize all channel listeners maps
   */
  private initializeChannels() {
    const channels: WebSocketChannel[] = [
      'transactions',
      'validators',
      'consensus',
      'network',
      'metrics',
      'channels',
      'live-stream',
    ];

    channels.forEach((channel) => {
      this.listeners.set(channel, new Set());
      this.reconnectAttempts.set(channel, 0);
      this.connectionStates.set(channel, 'disconnected');
    });
  }

  /**
   * Connect to a WebSocket channel
   */
  async connect(channel: WebSocketChannel): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if already connected
        const existing = this.connections.get(channel);
        if (existing && existing.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        // Mark as connecting
        this.connectionStates.set(channel, 'connecting');

        // Determine endpoint URL
        const endpoint = this.getEndpoint(channel);
        const wsEndpoint = `${this.wsUrl}${endpoint}`;

        console.log(`🔌 Connecting to WebSocket: ${channel} → ${wsEndpoint}`);

        const ws = new WebSocket(wsEndpoint);

        ws.onopen = () => {
          console.log(`✅ WebSocket connected: ${channel}`);
          this.connectionStates.set(channel, 'connected');
          this.reconnectAttempts.set(channel, 0);
          this.notifyListeners(channel, {
            type: 'connected',
            channel: channel,
            data: { channel, timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          });
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(channel, message);
          } catch (error) {
            console.error(`Error parsing WebSocket message on ${channel}:`, error);
          }
        };

        ws.onerror = (error) => {
          console.error(`❌ WebSocket error on ${channel}:`, error);
          this.connectionStates.set(channel, 'disconnected');
          reject(error);
        };

        ws.onclose = () => {
          console.log(`🔌 WebSocket closed: ${channel}`);
          this.connectionStates.set(channel, 'disconnected');
          this.connections.delete(channel);
          this.notifyListeners(channel, {
            type: 'disconnected',
            channel: channel,
            data: { channel, timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          });

          // Attempt to reconnect
          this.attemptReconnect(channel);
        };

        this.connections.set(channel, ws);
      } catch (error) {
        console.error(`Failed to connect to ${channel}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from a WebSocket channel
   */
  disconnect(channel: WebSocketChannel): void {
    const ws = this.connections.get(channel);
    if (ws) {
      ws.close();
      this.connections.delete(channel);
    }

    const timer = this.reconnectTimers.get(channel);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(channel);
    }

    this.connectionStates.set(channel, 'disconnected');
    console.log(`🔌 Disconnected from ${channel}`);
  }

  /**
   * Disconnect from all channels
   */
  disconnectAll(): void {
    const channels: WebSocketChannel[] = Array.from(this.connections.keys());
    channels.forEach((channel) => this.disconnect(channel));
  }

  /**
   * Subscribe to messages on a channel
   */
  subscribe(channel: WebSocketChannel, listener: MessageListener): () => void {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      listeners.add(listener);

      // Auto-connect if not already connected
      if (!this.connections.has(channel)) {
        this.connect(channel).catch((error) => {
          console.error(`Failed to auto-connect to ${channel}:`, error);
        });
      }

      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    }

    return () => {};
  }

  /**
   * Get connection state for a channel
   */
  getConnectionState(channel: WebSocketChannel): 'connecting' | 'connected' | 'disconnected' {
    return this.connectionStates.get(channel) || 'disconnected';
  }

  /**
   * Get all connection states
   */
  getConnectionStates(): Record<WebSocketChannel, 'connecting' | 'connected' | 'disconnected'> {
    const states: Record<string, any> = {};
    this.connectionStates.forEach((state, channel) => {
      states[channel] = state;
    });
    return states;
  }

  /**
   * Send a message to a channel (if connected)
   */
  send(channel: WebSocketChannel, data: any): boolean {
    const ws = this.connections.get(channel);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ channel, data, timestamp: new Date().toISOString() }));
      return true;
    }
    console.warn(`Cannot send message to ${channel} - not connected`);
    return false;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Get the WebSocket endpoint for a channel
   */
  private getEndpoint(channel: WebSocketChannel): string {
    switch (channel) {
      case 'transactions':
        return '/ws/transactions';
      case 'validators':
        return '/ws/validators';
      case 'consensus':
        return '/ws/consensus';
      case 'network':
        return '/ws/network';
      case 'metrics':
        return '/ws/metrics';
      case 'channels':
        return '/ws/channels';
      case 'live-stream':
        return '/api/v11/live/stream';
      default:
        return '/ws/unknown';
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(channel: WebSocketChannel, message: WebSocketMessage): void {
    const event: WebSocketEvent = {
      channel: message.channel || channel,
      data: message.data,
      timestamp: message.timestamp || new Date().toISOString(),
    };

    this.notifyListeners(message.channel || channel, event);
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(channel: WebSocketChannel, event: WebSocketEvent): void {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${channel}:`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect to a channel with exponential backoff
   */
  private attemptReconnect(channel: WebSocketChannel): void {
    const attempts = this.reconnectAttempts.get(channel) || 0;

    if (attempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `❌ Max reconnection attempts reached for ${channel} (${WS_MAX_RECONNECT_ATTEMPTS})`
      );
      return;
    }

    // Check if there are any listeners for this channel
    const listeners = this.listeners.get(channel);
    if (!listeners || listeners.size === 0) {
      return; // No listeners, don't reconnect
    }

    // Calculate backoff delay
    const delay = Math.min(
      WS_RECONNECT_INTERVAL * Math.pow(2, attempts),
      WS_RECONNECT_INTERVAL * 32 // Max 32x backoff
    );

    console.log(
      `⏰ Reconnecting to ${channel} in ${delay}ms (attempt ${attempts + 1}/${WS_MAX_RECONNECT_ATTEMPTS})`
    );

    const timer = setTimeout(() => {
      this.reconnectAttempts.set(channel, attempts + 1);
      this.connect(channel).catch((error) => {
        console.error(`Reconnection failed for ${channel}:`, error);
      });
    }, delay);

    this.reconnectTimers.set(channel, timer);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default WebSocketService;
