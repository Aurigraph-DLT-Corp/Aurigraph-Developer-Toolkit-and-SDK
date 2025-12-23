/**
 * WebSocket Communication Manager
 * Epic: AV11-192, Task: AV11-203
 * Handles real-time bidirectional communication with backend services
 */

class WebSocketManager {
    constructor(config = {}) {
        this.config = {
            url: config.url || 'ws://localhost:9003/ws',
            reconnectInterval: config.reconnectInterval || 3000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            heartbeatInterval: config.heartbeatInterval || 30000,
            messageQueueSize: config.messageQueueSize || 100,
            autoConnect: config.autoConnect !== false
        };

        this.ws = null;
        this.connectionState = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.messageQueue = [];
        this.messageHandlers = new Map();
        this.eventEmitter = new EventTarget();
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            bytesSent: 0,
            bytesReceived: 0,
            connectionAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0,
            averageLatency: 0,
            lastMessageTime: null
        };

        // Auto-connect if configured
        if (this.config.autoConnect) {
            this.connect();
        }
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.connectionState === 'CONNECTED' || this.connectionState === 'CONNECTING') {
            console.log('WebSocket already connected or connecting');
            return;
        }

        this.connectionState = 'CONNECTING';
        this.metrics.connectionAttempts++;

        try {
            this.ws = new WebSocket(this.config.url);

            this.ws.onopen = this._handleOpen.bind(this);
            this.ws.onmessage = this._handleMessage.bind(this);
            this.ws.onerror = this._handleError.bind(this);
            this.ws.onclose = this._handleClose.bind(this);

            this.emit('connecting', { url: this.config.url });
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.metrics.failedConnections++;
            this._scheduleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this._clearReconnectTimer();
        this._clearHeartbeatTimer();
        this.connectionState = 'DISCONNECTED';
        this.emit('disconnected', { reason: 'manual' });
    }

    /**
     * Send message to server
     */
    send(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: Date.now(),
            id: this._generateMessageId()
        };

        if (this.connectionState !== 'CONNECTED') {
            // Queue message if not connected
            if (this.messageQueue.length < this.config.messageQueueSize) {
                this.messageQueue.push(message);
                console.log(`Message queued (${this.messageQueue.length} in queue)`);
            } else {
                console.warn('Message queue full, dropping message');
            }
            return false;
        }

        try {
            const messageStr = JSON.stringify(message);
            this.ws.send(messageStr);

            this.metrics.messagesSent++;
            this.metrics.bytesSent += messageStr.length;

            this.emit('message-sent', { message });
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    /**
     * Register message handler for specific message type
     */
    on(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }

    /**
     * Remove message handler
     */
    off(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     */
    emit(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        this.eventEmitter.dispatchEvent(event);
    }

    /**
     * Add event listener
     */
    addEventListener(eventType, handler) {
        this.eventEmitter.addEventListener(eventType, handler);
    }

    /**
     * Remove event listener
     */
    removeEventListener(eventType, handler) {
        this.eventEmitter.removeEventListener(eventType, handler);
    }

    /**
     * Get connection state
     */
    getState() {
        return {
            connectionState: this.connectionState,
            reconnectAttempts: this.reconnectAttempts,
            messageQueueSize: this.messageQueue.length,
            url: this.config.url
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            queuedMessages: this.messageQueue.length
        };
    }

    /**
     * Handle WebSocket open event
     */
    _handleOpen(event) {
        console.log('WebSocket connected:', this.config.url);
        this.connectionState = 'CONNECTED';
        this.reconnectAttempts = 0;
        this.metrics.successfulConnections++;

        this._clearReconnectTimer();
        this._startHeartbeat();

        this.emit('connected', { url: this.config.url });

        // Send queued messages
        this._flushMessageQueue();
    }

    /**
     * Handle WebSocket message event
     */
    _handleMessage(event) {
        try {
            const message = JSON.parse(event.data);

            this.metrics.messagesReceived++;
            this.metrics.bytesReceived += event.data.length;
            this.metrics.lastMessageTime = Date.now();

            // Calculate latency if message has timestamp
            if (message.timestamp) {
                const latency = Date.now() - message.timestamp;
                this.metrics.averageLatency =
                    (this.metrics.averageLatency * 0.9) + (latency * 0.1);
            }

            // Handle heartbeat response
            if (message.type === 'pong') {
                return;
            }

            // Emit generic message event
            this.emit('message', { message });

            // Call registered handlers for this message type
            if (this.messageHandlers.has(message.type)) {
                const handlers = this.messageHandlers.get(message.type);
                handlers.forEach(handler => {
                    try {
                        handler(message.data, message);
                    } catch (error) {
                        console.error(`Error in message handler for ${message.type}:`, error);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket error event
     */
    _handleError(event) {
        console.error('WebSocket error:', event);
        this.emit('error', { error: event });
    }

    /**
     * Handle WebSocket close event
     */
    _handleClose(event) {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connectionState = 'DISCONNECTED';

        this._clearHeartbeatTimer();

        this.emit('closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });

        // Attempt reconnection if not a clean close
        if (!event.wasClean) {
            this.metrics.failedConnections++;
            this._scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            this.emit('reconnect-failed', {
                attempts: this.reconnectAttempts
            });
            return;
        }

        this.connectionState = 'RECONNECTING';
        this.reconnectAttempts++;

        const delay = this.config.reconnectInterval * Math.min(this.reconnectAttempts, 5);

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        this.emit('reconnecting', {
            attempt: this.reconnectAttempts,
            delay: delay
        });

        this._clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    _startHeartbeat() {
        this._clearHeartbeatTimer();

        this.heartbeatTimer = setInterval(() => {
            if (this.connectionState === 'CONNECTED') {
                this.send('ping', { timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Clear reconnect timer
     */
    _clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Clear heartbeat timer
     */
    _clearHeartbeatTimer() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Flush queued messages
     */
    _flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            const messageStr = JSON.stringify(message);

            try {
                this.ws.send(messageStr);
                this.metrics.messagesSent++;
                this.metrics.bytesSent += messageStr.length;
                console.log('Sent queued message:', message.type);
            } catch (error) {
                console.error('Failed to send queued message:', error);
                // Put message back in queue
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    /**
     * Generate unique message ID
     */
    _generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Subscribe to node updates
     */
    subscribeToNodeUpdates(nodeId) {
        this.send('subscribe', {
            channel: 'node-updates',
            nodeId: nodeId
        });
    }

    /**
     * Unsubscribe from node updates
     */
    unsubscribeFromNodeUpdates(nodeId) {
        this.send('unsubscribe', {
            channel: 'node-updates',
            nodeId: nodeId
        });
    }

    /**
     * Subscribe to system metrics
     */
    subscribeToMetrics() {
        this.send('subscribe', {
            channel: 'system-metrics'
        });
    }

    /**
     * Request node state
     */
    requestNodeState(nodeId) {
        this.send('request', {
            resource: 'node-state',
            nodeId: nodeId
        });
    }

    /**
     * Broadcast transaction
     */
    broadcastTransaction(transaction) {
        this.send('transaction', {
            transaction: transaction
        });
    }

    /**
     * Request system health
     */
    requestSystemHealth() {
        this.send('request', {
            resource: 'system-health'
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}
