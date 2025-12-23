#!/usr/bin/env npx ts-node

/**
 * Alpaca Markets API Integration V2
 * Complete integration with proper authentication and live trading capabilities
 */

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

interface AlpacaConfig {
    apiKey: string;
    secretKey: string;
    paper: boolean;
    dataFeed?: 'iex' | 'sip';
}

interface AlpacaAccount {
    id: string;
    account_number: string;
    status: string;
    currency: string;
    buying_power: string;
    cash: string;
    portfolio_value: string;
    pattern_day_trader: boolean;
    trading_blocked: boolean;
    transfers_blocked: boolean;
    account_blocked: boolean;
    created_at: string;
    trade_suspended_by_user: boolean;
    multiplier: string;
    shorting_enabled: boolean;
    equity: string;
    last_equity: string;
    long_market_value: string;
    short_market_value: string;
    initial_margin: string;
    maintenance_margin: string;
    sma: string;
    daytrade_count: number;
    crypto_status: string;
}

interface AlpacaOrder {
    id: string;
    client_order_id: string;
    created_at: string;
    updated_at: string;
    submitted_at: string;
    filled_at: string | null;
    expired_at: string | null;
    canceled_at: string | null;
    failed_at: string | null;
    replaced_at: string | null;
    replaced_by: string | null;
    replaces: string | null;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional: string | null;
    qty: string;
    filled_qty: string;
    filled_avg_price: string | null;
    order_class: string;
    order_type: string;
    type: string;
    side: 'buy' | 'sell';
    time_in_force: string;
    limit_price: string | null;
    stop_price: string | null;
    status: string;
    extended_hours: boolean;
    legs: any[] | null;
}

interface AlpacaPosition {
    asset_id: string;
    symbol: string;
    exchange: string;
    asset_class: string;
    avg_entry_price: string;
    qty: string;
    qty_available: string;
    side: 'long' | 'short';
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    unrealized_intraday_pl: string;
    unrealized_intraday_plpc: string;
    current_price: string;
    lastday_price: string;
    change_today: string;
}

export class AlpacaIntegrationV2 extends EventEmitter {
    private client: AxiosInstance;
    private wsClient: WebSocket | null = null;
    private config: AlpacaConfig;
    private baseURL: string;
    private wsURL: string;
    private isAuthenticated: boolean = false;
    
    constructor(config: AlpacaConfig) {
        super();
        this.config = config;
        
        // Set URLs based on paper/live trading
        this.baseURL = config.paper 
            ? 'https://paper-api.alpaca.markets'
            : 'https://api.alpaca.markets';
            
        this.wsURL = config.paper
            ? 'wss://stream.data.alpaca.markets/v2'
            : 'wss://stream.data.alpaca.markets/v2';
        
        // Initialize HTTP client
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'APCA-API-KEY-ID': config.apiKey,
                'APCA-API-SECRET-KEY': config.secretKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔧 Alpaca Integration V2 Initialized');
        console.log(`📍 Mode: ${config.paper ? 'Paper Trading' : 'Live Trading'}`);
    }
    
    /**
     * Test authentication and connection
     */
    async authenticate(): Promise<boolean> {
        try {
            const response = await this.client.get('/v2/account');
            this.isAuthenticated = true;
            console.log('✅ Alpaca authentication successful');
            console.log(`📊 Account: ${response.data.account_number}`);
            this.emit('authenticated', response.data);
            return true;
        } catch (error: any) {
            console.error('❌ Alpaca authentication failed:', error.response?.data || error.message);
            this.isAuthenticated = false;
            this.emit('authenticationFailed', error);
            return false;
        }
    }
    
    /**
     * Get account information
     */
    async getAccount(): Promise<AlpacaAccount> {
        try {
            const response = await this.client.get('/v2/account');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get account: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get all positions
     */
    async getPositions(): Promise<AlpacaPosition[]> {
        try {
            const response = await this.client.get('/v2/positions');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get positions: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get a specific position
     */
    async getPosition(symbol: string): Promise<AlpacaPosition> {
        try {
            const response = await this.client.get(`/v2/positions/${symbol}`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get position for ${symbol}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get orders
     */
    async getOrders(params?: {
        status?: 'open' | 'closed' | 'all';
        limit?: number;
        after?: string;
        until?: string;
        direction?: 'asc' | 'desc';
        nested?: boolean;
        symbols?: string;
    }): Promise<AlpacaOrder[]> {
        try {
            const response = await this.client.get('/v2/orders', { params });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get orders: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Place an order
     */
    async placeOrder(params: {
        symbol: string;
        qty?: number;
        notional?: number;
        side: 'buy' | 'sell';
        type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
        time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
        limit_price?: number;
        stop_price?: number;
        trail_price?: number;
        trail_percent?: number;
        extended_hours?: boolean;
        client_order_id?: string;
        order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
        take_profit?: any;
        stop_loss?: any;
    }): Promise<AlpacaOrder> {
        try {
            const response = await this.client.post('/v2/orders', params);
            this.emit('orderPlaced', response.data);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to place order: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Cancel an order
     */
    async cancelOrder(orderId: string): Promise<void> {
        try {
            await this.client.delete(`/v2/orders/${orderId}`);
            this.emit('orderCanceled', orderId);
        } catch (error: any) {
            throw new Error(`Failed to cancel order: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Cancel all orders
     */
    async cancelAllOrders(): Promise<void> {
        try {
            await this.client.delete('/v2/orders');
            this.emit('allOrdersCanceled');
        } catch (error: any) {
            throw new Error(`Failed to cancel all orders: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get market data for a symbol
     */
    async getLatestTrade(symbol: string): Promise<any> {
        try {
            const response = await this.client.get(`/v2/stocks/${symbol}/trades/latest`, {
                params: { feed: this.config.dataFeed || 'iex' }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get latest trade for ${symbol}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get latest quote for a symbol
     */
    async getLatestQuote(symbol: string): Promise<any> {
        try {
            const response = await this.client.get(`/v2/stocks/${symbol}/quotes/latest`, {
                params: { feed: this.config.dataFeed || 'iex' }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get latest quote for ${symbol}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get bars (candlestick data)
     */
    async getBars(symbol: string, params: {
        timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
        start: string;
        end?: string;
        limit?: number;
        page_limit?: number;
        adjustment?: 'raw' | 'split' | 'dividend' | 'all';
        feed?: 'iex' | 'sip';
    }): Promise<any> {
        try {
            const response = await this.client.get(`/v2/stocks/${symbol}/bars`, {
                params: { ...params, feed: params.feed || this.config.dataFeed || 'iex' }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get bars for ${symbol}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Connect to WebSocket for real-time data
     */
    connectWebSocket(symbols: string[]): void {
        if (this.wsClient) {
            console.log('⚠️ WebSocket already connected');
            return;
        }
        
        this.wsClient = new WebSocket(this.wsURL);
        
        this.wsClient.on('open', () => {
            console.log('🔌 Alpaca WebSocket connected');
            
            // Authenticate
            this.wsClient!.send(JSON.stringify({
                action: 'auth',
                key: this.config.apiKey,
                secret: this.config.secretKey
            }));
        });
        
        this.wsClient.on('message', (data: Buffer) => {
            try {
                const messages = JSON.parse(data.toString());
                
                if (Array.isArray(messages)) {
                    messages.forEach(msg => this.handleWebSocketMessage(msg));
                } else {
                    this.handleWebSocketMessage(messages);
                }
            } catch (error) {
                console.error('❌ WebSocket message parse error:', error);
            }
        });
        
        this.wsClient.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.emit('wsError', error);
        });
        
        this.wsClient.on('close', () => {
            console.log('🔌 WebSocket disconnected');
            this.wsClient = null;
            this.emit('wsDisconnected');
        });
    }
    
    private handleWebSocketMessage(message: any): void {
        switch (message.T) {
            case 'success':
                console.log('✅ WebSocket authenticated');
                this.emit('wsAuthenticated');
                break;
            case 'error':
                console.error('❌ WebSocket error:', message);
                this.emit('wsError', message);
                break;
            case 't': // Trade
                this.emit('trade', message);
                break;
            case 'q': // Quote
                this.emit('quote', message);
                break;
            case 'b': // Bar
                this.emit('bar', message);
                break;
            default:
                this.emit('message', message);
        }
    }
    
    /**
     * Subscribe to symbols for real-time data
     */
    subscribeToSymbols(symbols: string[], types: ('trades' | 'quotes' | 'bars')[] = ['trades']): void {
        if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return;
        }
        
        const subscription: any = { action: 'subscribe' };
        
        if (types.includes('trades')) {
            subscription.trades = symbols;
        }
        if (types.includes('quotes')) {
            subscription.quotes = symbols;
        }
        if (types.includes('bars')) {
            subscription.bars = symbols;
        }
        
        this.wsClient.send(JSON.stringify(subscription));
        console.log(`📊 Subscribed to ${symbols.join(', ')} for ${types.join(', ')}`);
    }
    
    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket(): void {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = null;
        }
    }
    
    /**
     * Get account portfolio history
     */
    async getPortfolioHistory(params?: {
        period?: string;
        timeframe?: string;
        date_end?: string;
        extended_hours?: boolean;
    }): Promise<any> {
        try {
            const response = await this.client.get('/v2/account/portfolio/history', { params });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get portfolio history: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get clock (market hours)
     */
    async getClock(): Promise<any> {
        try {
            const response = await this.client.get('/v2/clock');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get clock: ${error.response?.data?.message || error.message}`);
        }
    }
    
    /**
     * Get calendar (trading days)
     */
    async getCalendar(params?: {
        start?: string;
        end?: string;
    }): Promise<any> {
        try {
            const response = await this.client.get('/v2/calendar', { params });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get calendar: ${error.response?.data?.message || error.message}`);
        }
    }
}

// Test function
async function testAlpacaIntegration() {
    // Load environment variables
    require('dotenv').config({ path: '.env.alpaca' });
    
    const alpaca = new AlpacaIntegrationV2({
        apiKey: process.env.ALPACA_API_KEY || '',
        secretKey: process.env.ALPACA_SECRET_KEY || '',
        paper: true,
        dataFeed: 'iex'
    });
    
    console.log('\n🧪 Testing Alpaca Integration V2...\n');
    
    // Test authentication
    const isAuthenticated = await alpaca.authenticate();
    
    if (isAuthenticated) {
        try {
            // Get account info
            const account = await alpaca.getAccount();
            console.log('\n📊 Account Info:');
            console.log(`  Account Number: ${account.account_number}`);
            console.log(`  Status: ${account.status}`);
            console.log(`  Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
            console.log(`  Portfolio Value: $${parseFloat(account.portfolio_value).toLocaleString()}`);
            
            // Get positions
            const positions = await alpaca.getPositions();
            console.log(`\n📈 Positions: ${positions.length}`);
            positions.forEach(pos => {
                console.log(`  ${pos.symbol}: ${pos.qty} shares @ $${pos.avg_entry_price}`);
            });
            
            // Get recent orders
            const orders = await alpaca.getOrders({ status: 'all', limit: 5 });
            console.log(`\n📝 Recent Orders: ${orders.length}`);
            orders.forEach(order => {
                console.log(`  ${order.symbol}: ${order.side} ${order.qty} @ ${order.order_type}`);
            });
            
            // Get market data
            const quote = await alpaca.getLatestQuote('AAPL');
            console.log('\n💹 AAPL Latest Quote:');
            console.log(`  Bid: $${quote.quote.bp} x ${quote.quote.bs}`);
            console.log(`  Ask: $${quote.quote.ap} x ${quote.quote.as}`);
            
            // Check market hours
            const clock = await alpaca.getClock();
            console.log('\n🕐 Market Status:');
            console.log(`  Is Open: ${clock.is_open}`);
            console.log(`  Next Open: ${clock.next_open}`);
            console.log(`  Next Close: ${clock.next_close}`);
            
        } catch (error: any) {
            console.error('❌ Test failed:', error.message);
        }
    } else {
        console.log('\n⚠️ Authentication failed. Please check your credentials.');
        console.log('Ensure you have set the correct API key and secret in .env.alpaca');
    }
}

// Run test if executed directly
if (require.main === module) {
    testAlpacaIntegration().catch(console.error);
}

export default AlpacaIntegrationV2;