/**
 * Channel Node Implementation
 * Handles message routing and network communication
 * Epic: AV11-192, Task: AV11-194
 */

class ChannelNode {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = 'channel';
        this.config = {
            maxConnections: config.maxConnections || 100,
            routingAlgorithm: config.routingAlgorithm || 'round-robin',
            bufferSize: config.bufferSize || 10000,
            timeout: config.timeout || 30000
        };

        // State
        this.state = 'IDLE';
        this.connections = new Map();
        this.messageQueue = [];
        this.routingIndex = 0;
        this.metrics = {
            activeConnections: 0,
            throughput: 0,
            routingEfficiency: 100.0,
            totalMessagesSent: 0,
            totalMessagesReceived: 0,
            errors: 0
        };

        this.messageHistory = [];
        this.startTime = Date.now();
        this.listeners = new Map();

        this._startMetricsCollection();
    }

    async initialize() {
        this.state = 'CONNECTED';
        this.emit('state-change', { state: this.state });
        return true;
    }

    async start() {
        if (this.state !== 'CONNECTED') {
            throw new Error('Node must be in CONNECTED state to start');
        }
        this.state = 'ROUTING';
        this.emit('state-change', { state: this.state });
        this._processQueue();
        return true;
    }

    addConnection(nodeId, nodeType) {
        if (this.connections.size >= this.config.maxConnections) {
            this.state = 'OVERLOAD';
            this.emit('state-change', { state: this.state });
            throw new Error(`Max connections reached`);
        }

        this.connections.set(nodeId, {
            id: nodeId,
            type: nodeType,
            connected: true,
            messageCount: 0,
            lastActivity: Date.now()
        });

        this.metrics.activeConnections = this.connections.size;
        this.emit('connection-added', { nodeId, nodeType });
    }

    async routeMessage(message) {
        if (!message || !message.to) {
            this.metrics.errors++;
            throw new Error('Invalid message format');
        }

        this.messageQueue.push({
            ...message,
            queuedAt: Date.now()
        });

        this.metrics.totalMessagesReceived++;

        if (this.state === 'ROUTING') {
            this._processQueue();
        }
    }

    _processQueue() {
        while (this.messageQueue.length > 0 && this.state === 'ROUTING') {
            const message = this.messageQueue.shift();

            try {
                const destination = this._selectDestination(message);

                if (destination) {
                    this._sendMessage(destination, message);
                    this.metrics.totalMessagesSent++;
                } else {
                    this.messageQueue.unshift(message);
                    break;
                }
            } catch (error) {
                this.metrics.errors++;
                this.emit('error', { error, message });
            }
        }

        const sent = this.metrics.totalMessagesSent;
        const received = this.metrics.totalMessagesReceived;
        this.metrics.routingEfficiency = received > 0 ? (sent / received * 100).toFixed(2) : 100.0;
    }

    _selectDestination(message) {
        if (message.to && this.connections.has(message.to)) {
            return message.to;
        }

        const targetType = message.targetType || 'validator';
        const available = Array.from(this.connections.entries())
            .filter(([id, conn]) => conn.type === targetType && conn.connected)
            .map(([id, conn]) => ({ id, ...conn }));

        if (available.length === 0) {
            return null;
        }

        switch (this.config.routingAlgorithm) {
            case 'round-robin':
                const selected = available[this.routingIndex % available.length];
                this.routingIndex++;
                return selected.id;

            case 'least-connections':
                const leastLoaded = available.reduce((min, node) =>
                    node.messageCount < min.messageCount ? node : min
                );
                return leastLoaded.id;

            default:
                return available[0].id;
        }
    }

    _sendMessage(destinationId, message) {
        const connection = this.connections.get(destinationId);
        connection.messageCount++;
        connection.lastActivity = Date.now();

        this.emit('message-sent', {
            from: this.id,
            to: destinationId,
            message: message,
            timestamp: Date.now()
        });
    }

    _startMetricsCollection() {
        setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = (now - this.startTime) / 1000;
            this.metrics.throughput = Math.round(this.metrics.totalMessagesSent / elapsedSeconds);

            this.messageHistory.push({
                timestamp: now,
                throughput: this.metrics.throughput
            });

            if (this.messageHistory.length > 60) {
                this.messageHistory.shift();
            }

            this.emit('metrics-update', { metrics: this.getMetrics() });
        }, 1000);
    }

    getMetrics() {
        return {
            ...this.metrics,
            queueDepth: this.messageQueue.length,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            messageHistory: this.messageHistory.slice(-60)
        };
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            state: this.state,
            config: this.config,
            metrics: this.getMetrics(),
            connections: Array.from(this.connections.values())
        };
    }

    pause() {
        if (this.state === 'ROUTING') {
            this.state = 'CONNECTED';
            this.emit('state-change', { state: this.state });
        }
    }

    resume() {
        if (this.state === 'CONNECTED') {
            this.state = 'ROUTING';
            this.emit('state-change', { state: this.state });
            this._processQueue();
        }
    }

    async stop() {
        this.state = 'DISCONNECTED';
        this.connections.clear();
        this.messageQueue = [];
        this.emit('state-change', { state: this.state });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChannelNode;
}
