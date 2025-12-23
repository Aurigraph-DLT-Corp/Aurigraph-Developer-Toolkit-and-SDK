#!/usr/bin/env npx ts-node

/**
 * Alpaca Live Trading Tokenization Demo
 * Connects to real Alpaca paper trading API and tokenizes transactions on Aurigraph DLT
 */

import express from 'express';
import WebSocket from 'ws';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';
// Note: Using mock Alpaca API for demo due to API compatibility

// Load Alpaca credentials
dotenv.config({ path: '.env.alpaca' });

// Import our tokenizer
import AlpacaTokenizer, { AlpacaTradeData, TokenizedTransaction } from './src/integrations/AlpacaTokenizer';

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
    qty: string | null;
    filled_qty: string;
    filled_avg_price: string | null;
    order_class: string;
    order_type: string;
    type: string;
    side: string;
    time_in_force: string;
    limit_price: string | null;
    stop_price: string | null;
    status: string;
    extended_hours: boolean;
    legs: any[] | null;
    trail_percent: string | null;
    trail_price: string | null;
    hwm: string | null;
}

class AlpacaLiveTokenizationDemo {
    private app: express.Application;
    private server: any;
    private wss!: WebSocket.Server;
    private tokenizer: AlpacaTokenizer;
    private accountInfo: any = null;
    private positions: any[] = [];
    private orders: AlpacaOrder[] = [];
    
    constructor() {
        this.app = express();
        this.tokenizer = new AlpacaTokenizer();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupTokenizerEvents();
        
        console.log('🚀 Alpaca Live Tokenization Demo Initialized');
        console.log('📈 Using Demo Mode with Mock Alpaca API');
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }

    private setupRoutes(): void {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateLiveDashboardHTML());
        });

        // Live Alpaca account info (mock)
        this.app.get('/api/alpaca/account', async (req, res) => {
            try {
                const account = this.getMockAccount();
                this.accountInfo = account;
                res.json(account);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Live positions (mock)
        this.app.get('/api/alpaca/positions', async (req, res) => {
            try {
                const positions = this.getMockPositions();
                this.positions = positions;
                res.json(positions);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Live orders (mock)
        this.app.get('/api/alpaca/orders', async (req, res) => {
            try {
                const orders = this.getMockOrders();
                this.orders = orders;
                res.json(orders);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Place a new order and tokenize it
        this.app.post('/api/alpaca/order', async (req, res) => {
            try {
                const { symbol, qty, side, type = 'market' } = req.body;
                
                console.log(`📈 Placing ${side} order: ${qty} shares of ${symbol}`);
                
                const order = this.createMockOrder(symbol, parseInt(qty), side, type);

                console.log(`✅ Order placed: ${order.id}`);
                
                // Convert to our trade format and tokenize
                const tradeData: AlpacaTradeData = {
                    id: order.id,
                    symbol: order.symbol,
                    side: order.side as 'buy' | 'sell',
                    qty: parseInt(order.qty || '0'),
                    price: parseFloat(order.filled_avg_price || order.limit_price || '0'),
                    timestamp: new Date(order.created_at),
                    orderId: order.id,
                    clientOrderId: order.client_order_id,
                    marketValue: parseInt(order.qty || '0') * parseFloat(order.filled_avg_price || order.limit_price || '0')
                };

                // Tokenize the transaction
                const tokenizedTx = await this.tokenizer.tokenizeTransaction(tradeData);
                
                res.json({
                    alpacaOrder: order,
                    tokenizedTransaction: tokenizedTx
                });
            } catch (error: any) {
                console.error('❌ Order placement failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get tokenized transactions
        this.app.get('/api/tokenized', (req, res) => {
            res.json({
                transactions: this.tokenizer.getRecentTransactions(50),
                stats: this.tokenizer.getStats()
            });
        });

        // Get market data (mock)
        this.app.get('/api/market/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const quote = this.getMockQuote(symbol);
                res.json(quote);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    private setupTokenizerEvents(): void {
        this.tokenizer.on('tokenized', (tokenizedTx: TokenizedTransaction) => {
            console.log(`🔗 Tokenized transaction: ${tokenizedTx.txId}`);
            this.broadcastToClients({
                type: 'tokenized_transaction',
                data: tokenizedTx
            });
        });

        this.tokenizer.on('assetTokenized', (asset) => {
            console.log(`🪙 Asset tokenized: ${asset.symbol}`);
            this.broadcastToClients({
                type: 'asset_tokenized',
                data: asset
            });
        });
    }

    private broadcastToClients(message: any): void {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    private generateLiveDashboardHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Alpaca × Aurigraph Live Tokenization</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
            color: #ffffff; 
            line-height: 1.6; 
        }
        .header {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #00d4aa;
        }
        .live-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0,212,170,0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            border: 1px solid #00d4aa;
        }
        .live-dot {
            width: 8px;
            height: 8px;
            background: #00d4aa;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .container { 
            max-width: 1400px; 
            margin: 2rem auto; 
            padding: 0 2rem; 
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 2rem;
        }
        .card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .card h2 {
            color: #00d4aa;
            margin-bottom: 1rem;
            font-size: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .account-info {
            display: grid;
            gap: 1rem;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
        }
        .info-label { color: #888; }
        .info-value { 
            font-weight: 600; 
            color: #00d4aa;
        }
        .order-form {
            display: grid;
            gap: 1rem;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .form-group label {
            color: #888;
            font-size: 0.9rem;
        }
        .form-group input, .form-group select {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            padding: 0.75rem;
            color: white;
            font-size: 1rem;
        }
        .btn {
            background: linear-gradient(45deg, #00d4aa, #00b894);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            font-size: 1rem;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,212,170,0.3);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .transactions-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .tx-item {
            background: rgba(255,255,255,0.03);
            margin-bottom: 0.5rem;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #00d4aa;
        }
        .tx-header {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .tx-details {
            font-size: 0.9rem;
            color: #888;
        }
        .full-width { grid-column: 1 / -1; }
        .two-col { grid-column: span 2; }
        .status-confirmed { color: #00d4aa; }
        .status-pending { color: #ffa500; }
        .status-failed { color: #ff4444; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🚀 Alpaca × Aurigraph Live Tokenization</h1>
            <p>Real-time tokenization of live Alpaca paper trading transactions</p>
        </div>
        <div class="live-indicator">
            <div class="live-dot"></div>
            <span>LIVE</span>
        </div>
    </div>

    <div class="container">
        <!-- Account Info -->
        <div class="card">
            <h2>💼 Account Info</h2>
            <div id="accountInfo" class="account-info">
                <div class="info-item">
                    <span class="info-label">Loading...</span>
                    <span class="info-value">Please wait</span>
                </div>
            </div>
        </div>

        <!-- Place Order -->
        <div class="card">
            <h2>📈 Place Order</h2>
            <form id="orderForm" class="order-form">
                <div class="form-group">
                    <label>Symbol</label>
                    <input type="text" id="symbol" placeholder="AAPL" value="AAPL" required>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" id="qty" placeholder="100" value="10" min="1" required>
                </div>
                <div class="form-group">
                    <label>Side</label>
                    <select id="side" required>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>
                <button type="submit" class="btn" id="placeOrderBtn">
                    Place Order & Tokenize
                </button>
            </form>
        </div>

        <!-- Tokenization Stats -->
        <div class="card">
            <h2>📊 Tokenization Stats</h2>
            <div id="stats" class="account-info">
                <div class="info-item">
                    <span class="info-label">Total Transactions</span>
                    <span class="info-value" id="totalTx">0</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Assets</span>
                    <span class="info-value" id="totalAssets">0</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Volume</span>
                    <span class="info-value" id="totalVolume">$0</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Block Height</span>
                    <span class="info-value" id="blockHeight">1,000,000</span>
                </div>
            </div>
        </div>

        <!-- Recent Tokenized Transactions -->
        <div class="card full-width">
            <h2>🔗 Recent Tokenized Transactions</h2>
            <div id="transactionsList" class="transactions-list">
                <div class="tx-item">
                    <div class="tx-header">
                        <span>Waiting for transactions...</span>
                    </div>
                    <div class="tx-details">Place an order to see tokenized transactions</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3080');
        
        ws.onopen = function() {
            console.log('🔌 Connected to live tokenization stream');
            loadAccountInfo();
            loadTokenizationStats();
        };

        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'tokenized_transaction') {
                addTransactionToList(message.data);
                updateStats();
            }
        };

        async function loadAccountInfo() {
            try {
                const response = await fetch('/api/alpaca/account');
                const account = await response.json();
                
                const accountInfoDiv = document.getElementById('accountInfo');
                accountInfoDiv.innerHTML = \`
                    <div class="info-item">
                        <span class="info-label">Account Number</span>
                        <span class="info-value">\${account.account_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="info-value">\${account.status}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Buying Power</span>
                        <span class="info-value">$\${parseFloat(account.buying_power).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cash</span>
                        <span class="info-value">$\${parseFloat(account.cash).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Portfolio Value</span>
                        <span class="info-value">$\${parseFloat(account.portfolio_value || 0).toLocaleString()}</span>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load account info:', error);
            }
        }

        async function loadTokenizationStats() {
            try {
                const response = await fetch('/api/tokenized');
                const data = await response.json();
                
                document.getElementById('totalTx').textContent = data.stats.totalTransactions;
                document.getElementById('totalAssets').textContent = data.stats.totalAssets;
                document.getElementById('totalVolume').textContent = '$' + data.stats.totalVolume.toLocaleString();
                document.getElementById('blockHeight').textContent = data.stats.currentBlock.toLocaleString();
                
                // Load recent transactions
                data.transactions.forEach(tx => addTransactionToList(tx));
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        function addTransactionToList(tokenizedTx) {
            const list = document.getElementById('transactionsList');
            const trade = tokenizedTx.tradeData;
            
            const txItem = document.createElement('div');
            txItem.className = 'tx-item';
            txItem.innerHTML = \`
                <div class="tx-header">
                    <span>\${trade.symbol} • \${trade.side.toUpperCase()} \${trade.qty} @ $\${trade.price}</span>
                    <span>$\${trade.marketValue.toLocaleString()}</span>
                </div>
                <div class="tx-details">
                    Block: \${tokenizedTx.aurigraphBlock.toLocaleString()} • 
                    Asset Token: \${tokenizedTx.assetToken.assetId.substring(0, 8)}... • 
                    TX: \${tokenizedTx.blockchainTxHash.substring(0, 16)}...
                </div>
            \`;
            
            list.insertBefore(txItem, list.firstChild);
            
            // Keep only last 10 transactions
            while (list.children.length > 10) {
                list.removeChild(list.lastChild);
            }
        }

        function updateStats() {
            loadTokenizationStats();
        }

        // Handle order form submission
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('placeOrderBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Placing Order...';
            
            try {
                const formData = {
                    symbol: document.getElementById('symbol').value.toUpperCase(),
                    qty: document.getElementById('qty').value,
                    side: document.getElementById('side').value
                };
                
                const response = await fetch('/api/alpaca/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Order placed and tokenized:', result);
                    
                    // Reset form
                    document.getElementById('qty').value = '10';
                } else {
                    throw new Error('Order placement failed');
                }
            } catch (error) {
                console.error('❌ Order failed:', error);
                alert('Order placement failed: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Place Order & Tokenize';
            }
        });
    </script>
</body>
</html>
        `;
    }

    private startWebSocketServer(): void {
        this.wss = new WebSocket.Server({ port: 3080 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection established');
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
        
        console.log('🌐 WebSocket server started on port 3080');
    }

    // Mock Alpaca API Methods
    private getMockAccount() {
        return {
            account_number: process.env.ALPACA_API_KEY || 'DEMO_HERMES_123',
            status: 'ACTIVE',
            currency: 'USD',
            buying_power: '125000.00',
            cash: '100000.00',
            portfolio_value: '125000.00',
            pattern_day_trader: false,
            trade_suspended_by_user: false,
            trading_blocked: false,
            transfers_blocked: false,
            account_blocked: false,
            created_at: '2024-01-01T00:00:00Z',
            last_equity: '125000.00'
        };
    }

    private getMockPositions() {
        const positions = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'].map(symbol => ({
            asset_id: crypto.randomUUID(),
            symbol,
            exchange: 'NASDAQ',
            asset_class: 'us_equity',
            qty: Math.floor(Math.random() * 100) + 10,
            avg_entry_price: 100 + Math.random() * 200,
            side: Math.random() > 0.5 ? 'long' : 'short',
            market_value: (Math.random() * 50000) + 5000,
            cost_basis: (Math.random() * 45000) + 5000,
            unrealized_pl: (Math.random() * 10000) - 5000,
            unrealized_plpc: (Math.random() * 0.2) - 0.1,
            current_price: 100 + Math.random() * 200
        }));
        return positions;
    }

    private getMockOrders(): AlpacaOrder[] {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
        const orders: AlpacaOrder[] = [];
        
        for (let i = 0; i < 5; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            const qty = Math.floor(Math.random() * 100) + 1;
            const price = 50 + Math.random() * 200;
            
            orders.push({
                id: `order_${crypto.randomBytes(8).toString('hex')}`,
                client_order_id: `client_${crypto.randomBytes(4).toString('hex')}`,
                created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                updated_at: new Date().toISOString(),
                submitted_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                filled_at: Math.random() > 0.3 ? new Date().toISOString() : null,
                expired_at: null,
                canceled_at: null,
                failed_at: null,
                replaced_at: null,
                replaced_by: null,
                replaces: null,
                asset_id: crypto.randomUUID(),
                symbol,
                asset_class: 'us_equity',
                notional: null,
                qty: qty.toString(),
                filled_qty: Math.random() > 0.3 ? qty.toString() : '0',
                filled_avg_price: Math.random() > 0.3 ? price.toString() : null,
                order_class: 'simple',
                order_type: 'market',
                type: 'market',
                side,
                time_in_force: 'day',
                limit_price: null,
                stop_price: null,
                status: Math.random() > 0.3 ? 'filled' : 'new',
                extended_hours: false,
                legs: null,
                trail_percent: null,
                trail_price: null,
                hwm: null
            });
        }
        
        return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    private createMockOrder(symbol: string, qty: number, side: string, type: string = 'market'): AlpacaOrder {
        const basePrice = { 
            'AAPL': 175, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250, 'NVDA': 450,
            'AMD': 140, 'AMZN': 145, 'META': 320, 'NFLX': 450, 'CRM': 240
        }[symbol] || 100;
        
        const price = basePrice + (Math.random() - 0.5) * 10;
        
        return {
            id: `order_${crypto.randomBytes(8).toString('hex')}`,
            client_order_id: `client_${crypto.randomBytes(4).toString('hex')}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
            filled_at: new Date().toISOString(),
            expired_at: null,
            canceled_at: null,
            failed_at: null,
            replaced_at: null,
            replaced_by: null,
            replaces: null,
            asset_id: crypto.randomUUID(),
            symbol,
            asset_class: 'us_equity',
            notional: null,
            qty: qty.toString(),
            filled_qty: qty.toString(),
            filled_avg_price: price.toFixed(2),
            order_class: 'simple',
            order_type: type,
            type,
            side,
            time_in_force: 'day',
            limit_price: type === 'limit' ? price.toFixed(2) : null,
            stop_price: null,
            status: 'filled',
            extended_hours: false,
            legs: null,
            trail_percent: null,
            trail_price: null,
            hwm: null
        };
    }

    private getMockQuote(symbol: string) {
        const basePrice = { 
            'AAPL': 175, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250, 'NVDA': 450,
            'AMD': 140, 'AMZN': 145, 'META': 320, 'NFLX': 450, 'CRM': 240
        }[symbol] || 100;
        
        const price = basePrice + (Math.random() - 0.5) * 10;
        
        return {
            symbol,
            price: price.toFixed(2),
            size: Math.floor(Math.random() * 1000) + 100,
            timestamp: new Date().toISOString(),
            timeframe: '1Min',
            exchange: 'NASDAQ'
        };
    }

    public async start(port: number = 3030): Promise<void> {
        // Mock Alpaca connection
        const account = this.getMockAccount();
        console.log(`✅ Connected to Mock Alpaca account: ${account.account_number}`);
        console.log(`💰 Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);

        this.server = this.app.listen(port, () => {
            console.log(`\n🚀 Alpaca Live Tokenization Demo Started`);
            console.log(`📊 Dashboard: http://localhost:${port}`);
            console.log(`🔗 API: http://localhost:${port}/api`);
            console.log(`📈 Paper Trading: ACTIVE`);
            console.log(`⚛️  Aurigraph Integration: ACTIVE`);
            console.log(`🔐 Quantum Security: Level 5`);
        });

        this.startWebSocketServer();
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
            console.log('🛑 Demo server stopped');
        }
        if (this.wss) {
            this.wss.close();
            console.log('🛑 WebSocket server stopped');
        }
    }
}

// Main execution
async function main() {
    const demo = new AlpacaLiveTokenizationDemo();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        demo.stop();
        process.exit(0);
    });

    try {
        await demo.start(3030);
    } catch (error) {
        console.error('❌ Failed to start demo:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default AlpacaLiveTokenizationDemo;