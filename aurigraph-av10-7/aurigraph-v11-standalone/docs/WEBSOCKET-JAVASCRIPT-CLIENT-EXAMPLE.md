# WebSocket JavaScript/TypeScript Client Example

This document provides examples of using the Aurigraph V11 WebSocket API in JavaScript and TypeScript applications.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Authentication](#authentication)
3. [Channel Subscriptions](#channel-subscriptions)
4. [React Integration](#react-integration)
5. [TypeScript Support](#typescript-support)
6. [Production Configuration](#production-configuration)

## Basic Usage

### Vanilla JavaScript

```javascript
// Simple WebSocket connection
const ws = new WebSocket('ws://localhost:9003/ws/v11');

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
};
```

### WebSocket Wrapper Class

```javascript
class AurigraphWebSocket {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.authenticated = false;
        this.messageQueue = [];
        this.subscriptions = new Map();
        this.reconnectAttempt = 0;
        this.maxReconnectAttempts = 100;
        this.backoffDelays = [1000, 2000, 4000, 8000, 16000, 30000];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempt = 0;
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.authenticated = false;
                this.scheduleReconnect();
            };
        });
    }

    handleMessage(data) {
        const message = JSON.parse(data);

        switch (message.type) {
            case 'auth_response':
                if (message.status === 'success') {
                    this.authenticated = true;
                    console.log('Authentication successful');
                    this.restoreSubscriptions();
                    this.deliverQueuedMessages();
                } else {
                    console.error('Authentication failed:', message.message);
                }
                break;

            case 'subscribe_response':
                console.log('Subscription confirmed:', message.channel);
                break;

            case 'message':
                this.handleChannelMessage(message);
                break;

            case 'ping':
                this.send({ type: 'pong', timestamp: Date.now() });
                break;

            case 'error':
                console.error('Server error:', message.message);
                break;
        }
    }

    handleChannelMessage(message) {
        const handler = this.subscriptions.get(message.channel);
        if (handler) {
            handler(message.data);
        }
    }

    async authenticate(token) {
        await this.send({
            type: 'auth',
            token: token
        });
    }

    subscribe(channel, handler, filter = null, priority = 0) {
        this.subscriptions.set(channel, handler);

        const message = {
            type: 'subscribe',
            channel: channel,
            priority: priority
        };

        if (filter) {
            message.filter = filter;
        }

        this.send(message);
    }

    unsubscribe(channel) {
        this.subscriptions.delete(channel);
        this.send({
            type: 'unsubscribe',
            channel: channel
        });
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            // Queue message for later delivery
            this.messageQueue.push(message);
        }
    }

    deliverQueuedMessages() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    restoreSubscriptions() {
        for (const [channel, handler] of this.subscriptions) {
            this.subscribe(channel, handler);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempt >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        const delayIndex = Math.min(this.reconnectAttempt, this.backoffDelays.length - 1);
        const delay = this.backoffDelays[delayIndex];

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);

        setTimeout(() => {
            this.reconnectAttempt++;
            this.connect();
        }, delay);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
```

## Authentication

### Login and Connect

```javascript
// Login to get JWT token
async function loginAndConnect() {
    // Step 1: Login
    const response = await fetch('http://localhost:9003/api/v11/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'user@example.com',
            password: 'securePassword123'
        })
    });

    const { token } = await response.json();
    console.log('Obtained JWT token');

    // Step 2: Connect to WebSocket
    const ws = new AurigraphWebSocket('ws://localhost:9003/ws/v11');
    await ws.connect();

    // Step 3: Authenticate
    await ws.authenticate(token);

    return ws;
}

// Usage
loginAndConnect().then(ws => {
    console.log('Connected and authenticated');

    // Subscribe to channels
    ws.subscribe('transactions', (data) => {
        console.log('Transaction:', data);
    });
});
```

## Channel Subscriptions

### Subscribe to Real-Time Analytics

```javascript
ws.subscribe('analytics', (metrics) => {
    console.log('Real-Time Metrics:');
    console.log(`  TPS: ${metrics.tps.toFixed(2)}`);
    console.log(`  Validators: ${metrics.validators}`);
    console.log(`  Pending TX: ${metrics.pendingTransactions}`);
    console.log(`  Block Height: ${metrics.blockHeight}`);
    console.log(`  Health: ${metrics.networkHealth}`);
    console.log(`  CPU: ${metrics.resources.cpuUsage}`);
    console.log(`  Memory: ${metrics.resources.memoryUsage}`);
});
```

### Subscribe to Transactions with Filter

```javascript
// Only receive pending transactions
ws.subscribe('transactions', (transaction) => {
    console.log(`Pending TX: ${transaction.id} (${transaction.amount})`);
}, 'status:pending', 5);
```

### Multiple Channel Subscriptions

```javascript
// Transactions
ws.subscribe('transactions', (tx) => {
    updateTransactionList(tx);
});

// Blocks
ws.subscribe('blocks', (block) => {
    updateBlockList(block);
});

// Bridge Events
ws.subscribe('bridge', (transfer) => {
    updateBridgeStatus(transfer);
}, 'chainId:ethereum');

// Network Health
ws.subscribe('analytics', (metrics) => {
    updateDashboard(metrics);
});
```

## React Integration

### Custom Hook for WebSocket

```jsx
import { useState, useEffect, useCallback } from 'react';

function useAurigraphWebSocket(url, token) {
    const [ws, setWs] = useState(null);
    const [connected, setConnected] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const websocket = new AurigraphWebSocket(url);

        websocket.connect().then(() => {
            setConnected(true);
            setWs(websocket);

            if (token) {
                websocket.authenticate(token).then(() => {
                    setAuthenticated(true);
                });
            }
        });

        return () => {
            websocket.disconnect();
        };
    }, [url, token]);

    const subscribe = useCallback((channel, handler, filter, priority) => {
        if (ws && authenticated) {
            ws.subscribe(channel, handler, filter, priority);
        }
    }, [ws, authenticated]);

    const unsubscribe = useCallback((channel) => {
        if (ws) {
            ws.unsubscribe(channel);
        }
    }, [ws]);

    return { connected, authenticated, subscribe, unsubscribe };
}

// Usage in React component
function RealTimeAnalytics() {
    const { connected, authenticated, subscribe } = useAurigraphWebSocket(
        'ws://localhost:9003/ws/v11',
        localStorage.getItem('jwt_token')
    );

    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        if (authenticated) {
            subscribe('analytics', (data) => {
                setMetrics(data);
            });
        }
    }, [authenticated, subscribe]);

    if (!connected) {
        return <div>Connecting...</div>;
    }

    if (!authenticated) {
        return <div>Authenticating...</div>;
    }

    if (!metrics) {
        return <div>Waiting for data...</div>;
    }

    return (
        <div>
            <h2>Real-Time Analytics</h2>
            <p>TPS: {metrics.tps.toFixed(2)}</p>
            <p>Validators: {metrics.validators}</p>
            <p>Health: {metrics.networkHealth}</p>
        </div>
    );
}
```

### React Context Provider

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children, url, token }) {
    const [ws, setWs] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const websocket = new AurigraphWebSocket(url);

        websocket.connect().then(() => {
            setConnected(true);
            setWs(websocket);

            if (token) {
                websocket.authenticate(token);
            }
        });

        return () => websocket.disconnect();
    }, [url, token]);

    return (
        <WebSocketContext.Provider value={{ ws, connected }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    return useContext(WebSocketContext);
}

// Usage
function App() {
    const token = localStorage.getItem('jwt_token');

    return (
        <WebSocketProvider url="ws://localhost:9003/ws/v11" token={token}>
            <Dashboard />
        </WebSocketProvider>
    );
}

function Dashboard() {
    const { ws, connected } = useWebSocket();
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (ws && connected) {
            ws.subscribe('transactions', (tx) => {
                setTransactions(prev => [tx, ...prev].slice(0, 10));
            });
        }
    }, [ws, connected]);

    return (
        <div>
            <h2>Recent Transactions</h2>
            {transactions.map(tx => (
                <div key={tx.id}>{tx.id}: {tx.amount}</div>
            ))}
        </div>
    );
}
```

## TypeScript Support

### Type Definitions

```typescript
// types.ts
export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

export interface AuthMessage extends WebSocketMessage {
    type: 'auth';
    token: string;
}

export interface SubscribeMessage extends WebSocketMessage {
    type: 'subscribe';
    channel: string;
    filter?: string;
    priority?: number;
}

export interface ChannelMessage extends WebSocketMessage {
    type: 'message';
    channel: string;
    data: any;
    timestamp: number;
}

export interface RealTimeMetrics {
    timestamp: string;
    tps: number;
    validators: number;
    pendingTransactions: number;
    blockHeight: number;
    networkHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    bridge: {
        totalTransfers: number;
        pendingTransfers: number;
        activeChains: number;
    };
    resources: {
        cpuUsage: string;
        memoryUsage: string;
        diskUsage: string;
    };
}

export interface Transaction {
    id: string;
    sender: string;
    receiver: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: string;
}

export type MessageHandler<T = any> = (data: T) => void;
```

### TypeScript WebSocket Wrapper

```typescript
// websocket.ts
import { WebSocketMessage, MessageHandler, RealTimeMetrics, Transaction } from './types';

export class AurigraphWebSocket {
    private ws: WebSocket | null = null;
    private authenticated = false;
    private subscriptions = new Map<string, MessageHandler>();
    private messageQueue: WebSocketMessage[] = [];

    constructor(private url: string) {}

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.authenticated = false;
            };
        });
    }

    private handleMessage(message: WebSocketMessage): void {
        switch (message.type) {
            case 'auth_response':
                this.handleAuthResponse(message);
                break;
            case 'message':
                this.handleChannelMessage(message);
                break;
            case 'ping':
                this.send({ type: 'pong', timestamp: Date.now() });
                break;
        }
    }

    private handleAuthResponse(message: any): void {
        if (message.status === 'success') {
            this.authenticated = true;
            this.deliverQueuedMessages();
        }
    }

    private handleChannelMessage(message: any): void {
        const handler = this.subscriptions.get(message.channel);
        if (handler) {
            handler(message.data);
        }
    }

    async authenticate(token: string): Promise<void> {
        await this.send({ type: 'auth', token });
    }

    subscribe<T = any>(
        channel: string,
        handler: MessageHandler<T>,
        filter?: string,
        priority = 0
    ): void {
        this.subscriptions.set(channel, handler);
        this.send({
            type: 'subscribe',
            channel,
            filter,
            priority
        });
    }

    unsubscribe(channel: string): void {
        this.subscriptions.delete(channel);
        this.send({ type: 'unsubscribe', channel });
    }

    private send(message: WebSocketMessage): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    private deliverQueuedMessages(): void {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()!;
            this.send(message);
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
    }
}
```

### Usage with TypeScript

```typescript
import { AurigraphWebSocket } from './websocket';
import { RealTimeMetrics, Transaction } from './types';

async function main() {
    const ws = new AurigraphWebSocket('ws://localhost:9003/ws/v11');
    await ws.connect();
    await ws.authenticate('your_jwt_token');

    // Type-safe subscription to analytics
    ws.subscribe<RealTimeMetrics>('analytics', (metrics) => {
        console.log(`TPS: ${metrics.tps.toFixed(2)}`);
        console.log(`Validators: ${metrics.validators}`);
        console.log(`Health: ${metrics.networkHealth}`);
    });

    // Type-safe subscription to transactions
    ws.subscribe<Transaction>('transactions', (tx) => {
        console.log(`Transaction ${tx.id}: ${tx.amount}`);
    });
}

main();
```

## Production Configuration

### Environment-Based Configuration

```javascript
// config.js
const config = {
    development: {
        wsUrl: 'ws://localhost:9003/ws/v11',
        apiUrl: 'http://localhost:9003/api/v11'
    },
    production: {
        wsUrl: 'wss://dlt.aurigraph.io/ws/v11',
        apiUrl: 'https://dlt.aurigraph.io/api/v11'
    }
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
```

### Secure WebSocket Connection

```javascript
import config from './config';

// Use wss:// for production (secure WebSocket)
const ws = new AurigraphWebSocket(config.wsUrl);

// Get token from secure storage
const token = localStorage.getItem('jwt_token');

ws.connect().then(() => {
    ws.authenticate(token);
});
```

### Error Handling

```javascript
ws.connect()
    .then(() => ws.authenticate(token))
    .catch((error) => {
        console.error('Connection failed:', error);
        // Show error UI to user
        showErrorNotification('Failed to connect to real-time service');
    });
```

## Complete Example: Real-Time Dashboard

```html
<!DOCTYPE html>
<html>
<head>
    <title>Aurigraph Real-Time Dashboard</title>
    <style>
        .metric { padding: 10px; margin: 5px; border: 1px solid #ccc; }
        .healthy { background-color: #90EE90; }
        .degraded { background-color: #FFD700; }
        .critical { background-color: #FF6347; }
    </style>
</head>
<body>
    <h1>Aurigraph Real-Time Dashboard</h1>
    <div id="status">Connecting...</div>
    <div id="metrics"></div>
    <div id="transactions"></div>

    <script>
        const ws = new AurigraphWebSocket('ws://localhost:9003/ws/v11');

        ws.connect()
            .then(() => {
                document.getElementById('status').innerText = 'Connected';
                return ws.authenticate('your_jwt_token');
            })
            .then(() => {
                document.getElementById('status').innerText = 'Authenticated';

                // Subscribe to analytics
                ws.subscribe('analytics', (metrics) => {
                    const metricsHtml = `
                        <div class="metric ${metrics.networkHealth.toLowerCase()}">
                            <h3>Network Metrics</h3>
                            <p>TPS: ${metrics.tps.toFixed(2)}</p>
                            <p>Validators: ${metrics.validators}</p>
                            <p>Pending TX: ${metrics.pendingTransactions}</p>
                            <p>Block Height: ${metrics.blockHeight}</p>
                            <p>Health: ${metrics.networkHealth}</p>
                        </div>
                    `;
                    document.getElementById('metrics').innerHTML = metricsHtml;
                });

                // Subscribe to transactions
                ws.subscribe('transactions', (tx) => {
                    const txHtml = `<div>TX: ${tx.id} (${tx.amount})</div>`;
                    document.getElementById('transactions').innerHTML =
                        txHtml + document.getElementById('transactions').innerHTML;
                });
            });
    </script>
</body>
</html>
```

## Resources

- [WebSocket Integration Guide](WEBSOCKET-INTEGRATION-GUIDE.md)
- [Java Client Example](WEBSOCKET-JAVA-CLIENT-EXAMPLE.md)
- [API Documentation](https://dlt.aurigraph.io/q/swagger-ui)
- [Enterprise Portal](https://dlt.aurigraph.io)
