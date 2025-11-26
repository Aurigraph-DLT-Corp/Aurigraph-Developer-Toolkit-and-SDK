/**
 * Basic WebSocket Client Example
 *
 * Demonstrates how to use the AurigraphWebSocketClient for real-time
 * transaction monitoring.
 *
 * @author WebSocket Development Agent (WDA)
 * @since V11.6.0 (Sprint 16 - AV11-486)
 */

import { AurigraphWebSocketClient, ConnectionState } from '../src/client/AurigraphWebSocketClient';

async function main() {
    console.log('=== Aurigraph WebSocket Client Example ===\n');

    // Create WebSocket client
    const client = new AurigraphWebSocketClient({
        url: 'wss://dlt.aurigraph.io/ws/transactions',
        token: 'your-jwt-token-here', // Replace with actual token
        reconnect: true,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        debug: true
    });

    // Set up event listeners
    client.on('connected', () => {
        console.log('✅ Connected to Aurigraph WebSocket server');
        console.log('Connection stats:', client.getStats());
    });

    client.on('disconnected', () => {
        console.log('❌ Disconnected from server');
    });

    client.on('stateChange', ({ oldState, newState }) => {
        console.log(`🔄 State changed: ${oldState} -> ${newState}`);
    });

    client.on('error', (error) => {
        console.error('⚠️  Error:', error);
    });

    client.on('circuitBreakerOpen', () => {
        console.warn('🚫 Circuit breaker opened - connection attempts temporarily blocked');
    });

    client.on('circuitBreakerClosed', () => {
        console.log('✅ Circuit breaker closed - connection attempts resumed');
    });

    client.on('heartbeat', () => {
        console.log('💓 Heartbeat received');
    });

    try {
        // Connect to server
        console.log('Connecting to WebSocket server...');
        await client.connect();

        // Subscribe to transactions channel
        console.log('\nSubscribing to "transactions" channel...');
        const unsubscribe = client.subscribe('transactions', (message) => {
            console.log('📨 Received transaction:', JSON.stringify(message, null, 2));
        });

        // Subscribe to consensus channel
        console.log('Subscribing to "consensus" channel...');
        client.subscribe('consensus', (message) => {
            console.log('🔐 Consensus update:', JSON.stringify(message, null, 2));
        });

        // Subscribe to network channel
        console.log('Subscribing to "network" channel...');
        client.subscribe('network', (message) => {
            console.log('🌐 Network event:', JSON.stringify(message, null, 2));
        });

        // Send a test message
        console.log('\nSending test message...');
        await client.send({
            type: 'MESSAGE' as any,
            channel: 'system',
            data: {
                action: 'ping',
                timestamp: Date.now()
            }
        });

        // Make a request with response
        console.log('\nMaking request...');
        try {
            const response = await client.request({
                type: 'MESSAGE' as any,
                data: {
                    action: 'getStats'
                }
            }, 5000);
            console.log('📊 Response:', response);
        } catch (error: any) {
            console.error('Request failed:', error.message);
        }

        // Display connection statistics every 10 seconds
        setInterval(() => {
            const stats = client.getStats();
            console.log('\n📈 Connection Statistics:', {
                state: stats.state,
                reconnectAttempts: stats.reconnectAttempts,
                queuedMessages: stats.queuedMessages,
                subscriptions: stats.subscriptions,
                pendingRequests: stats.pendingRequests,
                circuitBreakerOpen: stats.circuitBreakerOpen,
                lastHeartbeat: new Date(stats.lastHeartbeat).toISOString()
            });
        }, 10000);

        // Keep the connection alive
        console.log('\n⏳ Connection established. Press Ctrl+C to exit.\n');

        // Example: Unsubscribe after 60 seconds
        setTimeout(() => {
            console.log('\n🔕 Unsubscribing from transactions channel...');
            unsubscribe();
        }, 60000);

        // Graceful shutdown on SIGINT
        process.on('SIGINT', () => {
            console.log('\n\n👋 Shutting down gracefully...');
            client.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to establish connection:', error);
        process.exit(1);
    }
}

// Run the example
main().catch(console.error);

/**
 * Example Output:
 *
 * === Aurigraph WebSocket Client Example ===
 *
 * Connecting to WebSocket server...
 * [AurigraphWebSocketClient] WebSocket connected
 * 🔄 State changed: CONNECTING -> CONNECTED
 * ✅ Connected to Aurigraph WebSocket server
 * Connection stats: { state: 'CONNECTED', ... }
 *
 * Subscribing to "transactions" channel...
 * [AurigraphWebSocketClient] Subscribing to channel: transactions
 * Subscribing to "consensus" channel...
 * [AurigraphWebSocketClient] Subscribing to channel: consensus
 * Subscribing to "network" channel...
 * [AurigraphWebSocketClient] Subscribing to channel: network
 *
 * Sending test message...
 * [AurigraphWebSocketClient] Sent message: { type: 'MESSAGE', ... }
 *
 * Making request...
 * [AurigraphWebSocketClient] Sent message: { type: 'MESSAGE', ... }
 * 📊 Response: { ... }
 *
 * 💓 Heartbeat received
 * 📨 Received transaction: {
 *   "transactionId": "tx_123",
 *   "amount": 1000,
 *   ...
 * }
 *
 * 📈 Connection Statistics: {
 *   state: 'CONNECTED',
 *   reconnectAttempts: 0,
 *   queuedMessages: 0,
 *   subscriptions: 3,
 *   pendingRequests: 0,
 *   circuitBreakerOpen: false,
 *   lastHeartbeat: '2025-11-25T...'
 * }
 *
 * ⏳ Connection established. Press Ctrl+C to exit.
 */
