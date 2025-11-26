/**
 * Aurigraph WebSocket Client
 *
 * Enterprise-grade WebSocket client with:
 * - Automatic reconnection with exponential backoff
 * - Message queue during disconnection
 * - Type-safe message handling
 * - Promise-based API
 * - EventEmitter for real-time updates
 * - Circuit breaker pattern
 * - Connection state management
 * - Heartbeat mechanism
 *
 * @author WebSocket Development Agent (WDA)
 * @since V11.6.0 (Sprint 16 - AV11-486)
 */

import EventEmitter from 'events';

// WebSocket Protocol Types
export enum WebSocketMessageType {
    HEARTBEAT = 'heartbeat',
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    MESSAGE = 'message',
    ERROR = 'error',
    ACK = 'ack',
    PING = 'ping',
    PONG = 'pong'
}

export enum WebSocketErrorCode {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
    SERVER_ERROR = 'SERVER_ERROR',
    INVALID_MESSAGE = 'INVALID_MESSAGE',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN'
}

export enum ConnectionState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    RECONNECTING = 'RECONNECTING',
    DISCONNECTING = 'DISCONNECTING',
    FAILED = 'FAILED'
}

export interface WebSocketMessage {
    type: WebSocketMessageType;
    id?: string;
    channel?: string;
    data?: any;
    timestamp?: number;
    error?: WebSocketError;
}

export interface WebSocketError {
    code: WebSocketErrorCode;
    message: string;
    details?: any;
}

export interface ConnectionOptions {
    url: string;
    token?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectInterval?: number;
    reconnectDecay?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    messageQueueSize?: number;
    debug?: boolean;
}

export interface SubscriptionOptions {
    channel: string;
    onMessage: (message: any) => void;
    onError?: (error: WebSocketError) => void;
}

/**
 * Aurigraph WebSocket Client
 */
export class AurigraphWebSocketClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private options: Required<ConnectionOptions>;
    private state: ConnectionState = ConnectionState.DISCONNECTED;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private messageQueue: WebSocketMessage[] = [];
    private subscriptions = new Map<string, Set<(message: any) => void>>();
    private pendingMessages = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
    private lastHeartbeat: number = 0;

    // Circuit breaker state
    private failureCount = 0;
    private circuitBreakerThreshold = 5;
    private circuitBreakerTimeout = 60000; // 1 minute
    private circuitBreakerResetTime: number | null = null;

    constructor(options: ConnectionOptions) {
        super();

        // Set default options
        this.options = {
            url: options.url,
            token: options.token || '',
            reconnect: options.reconnect !== false,
            reconnectInterval: options.reconnectInterval || 1000,
            maxReconnectInterval: options.maxReconnectInterval || 30000,
            reconnectDecay: options.reconnectDecay || 1.5,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            heartbeatInterval: options.heartbeatInterval || 30000,
            messageQueueSize: options.messageQueueSize || 100,
            debug: options.debug || false
        };
    }

    /**
     * Connect to WebSocket server
     */
    public async connect(): Promise<void> {
        if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
            this.log('Already connected or connecting');
            return Promise.resolve();
        }

        // Check circuit breaker
        if (this.isCircuitBreakerOpen()) {
            const error = {
                code: WebSocketErrorCode.CIRCUIT_BREAKER_OPEN,
                message: 'Circuit breaker is open, connection blocked'
            };
            this.emit('error', error);
            return Promise.reject(error);
        }

        return new Promise((resolve, reject) => {
            this.setState(ConnectionState.CONNECTING);

            // Build WebSocket URL with token
            const url = this.buildWebSocketUrl();

            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    this.log('WebSocket connected');
                    this.setState(ConnectionState.CONNECTED);
                    this.reconnectAttempts = 0;
                    this.failureCount = 0;
                    this.circuitBreakerResetTime = null;
                    this.startHeartbeat();
                    this.flushMessageQueue();
                    this.emit('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    this.log('WebSocket error:', error);
                    this.recordFailure();
                    this.emit('error', {
                        code: WebSocketErrorCode.CONNECTION_FAILED,
                        message: 'WebSocket connection error',
                        details: error
                    });
                };

                this.ws.onclose = (event) => {
                    this.log('WebSocket closed:', event.code, event.reason);
                    this.handleDisconnect();

                    if (event.code !== 1000 && this.options.reconnect) {
                        this.scheduleReconnect();
                    }
                };

                // Connection timeout
                const timeout = setTimeout(() => {
                    if (this.state === ConnectionState.CONNECTING) {
                        this.ws?.close();
                        reject({
                            code: WebSocketErrorCode.NETWORK_TIMEOUT,
                            message: 'Connection timeout'
                        });
                    }
                }, 10000);

                this.ws.addEventListener('open', () => clearTimeout(timeout));

            } catch (error) {
                this.log('Failed to create WebSocket:', error);
                this.recordFailure();
                reject({
                    code: WebSocketErrorCode.CONNECTION_FAILED,
                    message: 'Failed to create WebSocket connection',
                    details: error
                });
            }
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    public disconnect(): void {
        this.log('Disconnecting WebSocket');
        this.setState(ConnectionState.DISCONNECTING);
        this.stopHeartbeat();
        this.clearReconnectTimer();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.setState(ConnectionState.DISCONNECTED);
        this.emit('disconnected');
    }

    /**
     * Subscribe to a channel
     */
    public subscribe(channel: string, onMessage: (message: any) => void): () => void {
        this.log('Subscribing to channel:', channel);

        // Add to local subscriptions
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
        }
        this.subscriptions.get(channel)!.add(onMessage);

        // Send subscribe message to server
        this.send({
            type: WebSocketMessageType.SUBSCRIBE,
            channel,
            timestamp: Date.now()
        });

        // Return unsubscribe function
        return () => this.unsubscribe(channel, onMessage);
    }

    /**
     * Unsubscribe from a channel
     */
    public unsubscribe(channel: string, onMessage?: (message: any) => void): void {
        this.log('Unsubscribing from channel:', channel);

        const handlers = this.subscriptions.get(channel);
        if (!handlers) {
            return;
        }

        if (onMessage) {
            handlers.delete(onMessage);
            if (handlers.size === 0) {
                this.subscriptions.delete(channel);
            }
        } else {
            this.subscriptions.delete(channel);
        }

        // Send unsubscribe message to server
        if (!handlers || handlers.size === 0) {
            this.send({
                type: WebSocketMessageType.UNSUBSCRIBE,
                channel,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Send message to server
     */
    public send(message: WebSocketMessage): Promise<void> {
        return new Promise((resolve, reject) => {
            // Add message ID for tracking
            if (!message.id) {
                message.id = this.generateMessageId();
            }

            if (!message.timestamp) {
                message.timestamp = Date.now();
            }

            // Check if connected
            if (this.state !== ConnectionState.CONNECTED || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
                // Queue message if reconnection is enabled
                if (this.options.reconnect) {
                    this.queueMessage(message);
                    resolve();
                } else {
                    reject({
                        code: WebSocketErrorCode.CONNECTION_FAILED,
                        message: 'WebSocket not connected'
                    });
                }
                return;
            }

            try {
                const payload = JSON.stringify(message);
                this.ws.send(payload);
                this.log('Sent message:', message);
                resolve();
            } catch (error) {
                this.log('Failed to send message:', error);
                reject({
                    code: WebSocketErrorCode.SERVER_ERROR,
                    message: 'Failed to send message',
                    details: error
                });
            }
        });
    }

    /**
     * Send message and wait for response
     */
    public async request(message: WebSocketMessage, timeout: number = 5000): Promise<any> {
        return new Promise((resolve, reject) => {
            const messageId = message.id || this.generateMessageId();
            message.id = messageId;

            // Set up response handler
            const timeoutHandle = setTimeout(() => {
                this.pendingMessages.delete(messageId);
                reject({
                    code: WebSocketErrorCode.NETWORK_TIMEOUT,
                    message: 'Request timeout'
                });
            }, timeout);

            this.pendingMessages.set(messageId, {
                resolve,
                reject,
                timeout: timeoutHandle
            });

            // Send message
            this.send(message).catch(reject);
        });
    }

    /**
     * Get current connection state
     */
    public getState(): ConnectionState {
        return this.state;
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.state === ConnectionState.CONNECTED &&
               this.ws !== null &&
               this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection statistics
     */
    public getStats() {
        return {
            state: this.state,
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            subscriptions: this.subscriptions.size,
            pendingRequests: this.pendingMessages.size,
            failureCount: this.failureCount,
            circuitBreakerOpen: this.isCircuitBreakerOpen(),
            lastHeartbeat: this.lastHeartbeat
        };
    }

    /**
     * Handle incoming message
     */
    private handleMessage(data: string): void {
        try {
            const message: WebSocketMessage = JSON.parse(data);
            this.log('Received message:', message);

            switch (message.type) {
                case WebSocketMessageType.HEARTBEAT:
                    this.lastHeartbeat = Date.now();
                    this.emit('heartbeat', message);
                    break;

                case WebSocketMessageType.PONG:
                    this.lastHeartbeat = Date.now();
                    break;

                case WebSocketMessageType.MESSAGE:
                    if (message.channel) {
                        this.handleChannelMessage(message.channel, message.data);
                    }
                    this.emit('message', message);
                    break;

                case WebSocketMessageType.ACK:
                    if (message.id) {
                        this.handleAcknowledgement(message.id, message.data);
                    }
                    break;

                case WebSocketMessageType.ERROR:
                    this.emit('error', message.error);
                    if (message.id) {
                        this.handleAcknowledgement(message.id, null, message.error);
                    }
                    break;

                default:
                    this.log('Unknown message type:', message.type);
            }
        } catch (error) {
            this.log('Failed to parse message:', error);
            this.emit('error', {
                code: WebSocketErrorCode.INVALID_MESSAGE,
                message: 'Failed to parse message',
                details: error
            });
        }
    }

    /**
     * Handle channel message
     */
    private handleChannelMessage(channel: string, data: any): void {
        const handlers = this.subscriptions.get(channel);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    this.log('Error in message handler:', error);
                }
            });
        }
    }

    /**
     * Handle message acknowledgement
     */
    private handleAcknowledgement(messageId: string, data: any, error?: WebSocketError): void {
        const pending = this.pendingMessages.get(messageId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingMessages.delete(messageId);

            if (error) {
                pending.reject(error);
            } else {
                pending.resolve(data);
            }
        }
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(): void {
        this.stopHeartbeat();
        this.setState(ConnectionState.DISCONNECTED);
        this.emit('disconnected');

        // Reject all pending messages
        this.pendingMessages.forEach(pending => {
            clearTimeout(pending.timeout);
            pending.reject({
                code: WebSocketErrorCode.CONNECTION_FAILED,
                message: 'Connection lost'
            });
        });
        this.pendingMessages.clear();
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            this.log('Max reconnection attempts reached');
            this.setState(ConnectionState.FAILED);
            this.emit('failed');
            return;
        }

        this.setState(ConnectionState.RECONNECTING);
        this.reconnectAttempts++;

        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.reconnectAttempts - 1),
            this.options.maxReconnectInterval
        );

        this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.log('Attempting reconnection');
            this.connect().catch(error => {
                this.log('Reconnection failed:', error);
                this.scheduleReconnect();
            });
        }, delay);
    }

    /**
     * Clear reconnection timer
     */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.lastHeartbeat = Date.now();

        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected()) {
                this.send({
                    type: WebSocketMessageType.PING,
                    timestamp: Date.now()
                }).catch(error => {
                    this.log('Failed to send heartbeat:', error);
                });

                // Check if last heartbeat was too long ago
                const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
                if (timeSinceLastHeartbeat > this.options.heartbeatInterval * 2) {
                    this.log('Heartbeat timeout, reconnecting');
                    this.ws?.close();
                }
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * Stop heartbeat mechanism
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Queue message for later sending
     */
    private queueMessage(message: WebSocketMessage): void {
        if (this.messageQueue.length >= this.options.messageQueueSize) {
            this.messageQueue.shift(); // Remove oldest message
            this.log('Message queue full, dropping oldest message');
        }
        this.messageQueue.push(message);
        this.log('Message queued, queue size:', this.messageQueue.length);
    }

    /**
     * Flush queued messages
     */
    private flushMessageQueue(): void {
        if (this.messageQueue.length === 0) {
            return;
        }

        this.log('Flushing message queue, size:', this.messageQueue.length);

        const messages = [...this.messageQueue];
        this.messageQueue = [];

        messages.forEach(message => {
            this.send(message).catch(error => {
                this.log('Failed to send queued message:', error);
                this.queueMessage(message); // Re-queue on failure
            });
        });
    }

    /**
     * Build WebSocket URL with token
     */
    private buildWebSocketUrl(): string {
        const url = new URL(this.options.url);
        if (this.options.token) {
            url.searchParams.append('token', this.options.token);
        }
        return url.toString();
    }

    /**
     * Set connection state
     */
    private setState(state: ConnectionState): void {
        const oldState = this.state;
        this.state = state;
        this.emit('stateChange', { oldState, newState: state });
    }

    /**
     * Record connection failure
     */
    private recordFailure(): void {
        this.failureCount++;
        if (this.failureCount >= this.circuitBreakerThreshold) {
            this.circuitBreakerResetTime = Date.now() + this.circuitBreakerTimeout;
            this.log('Circuit breaker opened');
            this.emit('circuitBreakerOpen');
        }
    }

    /**
     * Check if circuit breaker is open
     */
    private isCircuitBreakerOpen(): boolean {
        if (this.circuitBreakerResetTime === null) {
            return false;
        }

        if (Date.now() >= this.circuitBreakerResetTime) {
            // Reset circuit breaker
            this.failureCount = 0;
            this.circuitBreakerResetTime = null;
            this.log('Circuit breaker closed');
            this.emit('circuitBreakerClosed');
            return false;
        }

        return true;
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log debug messages
     */
    private log(...args: any[]): void {
        if (this.options.debug) {
            console.log('[AurigraphWebSocketClient]', ...args);
        }
    }
}

export default AurigraphWebSocketClient;
