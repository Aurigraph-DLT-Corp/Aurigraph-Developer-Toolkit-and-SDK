#!/usr/bin/env npx ts-node

/**
 * HMS Transaction Stream Service
 * 
 * Real-time monitoring and tokenization of all Hermes trading activity
 * with automated Aurigraph DLT integration
 */

import express from 'express';
import WebSocket from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

interface HMSStreamConfig {
    port: number;
    wsPort: number;
    autoTokenize: boolean;
    streamInterval: number;
    aurigraphEndpoint: string;
}

interface StreamedTransaction {
    id: string;
    type: 'trade' | 'order' | 'position_update' | 'balance_update';
    timestamp: Date;
    data: any;
    tokenizationStatus: 'pending' | 'processing' | 'completed' | 'failed';
    aurigraphBlock?: number;
    processingTime?: number;
}

class HMSTransactionStream extends EventEmitter {
    private config: HMSStreamConfig;
    private app: express.Application;
    private server: any;
    private wss!: WebSocket.Server;
    private streamedTransactions: StreamedTransaction[] = [];
    private isStreaming: boolean = false;
    private streamInterval: any;
    private stats = {
        totalStreamed: 0,
        totalTokenized: 0,
        avgProcessingTime: 0,
        uptime: Date.now()
    };
    
    // Simulated Hermes account state
    private hermesAccount = {
        accountNumber: 'HMS_DEMO_001',
        portfolioValue: 125000,
        buyingPower: 50000,
        cash: 50000,
        positions: new Map<string, any>(),
        pendingOrders: new Map<string, any>(),
        completedOrders: [] as any[]
    };
    
    constructor(config: Partial<HMSStreamConfig> = {}) {
        super();
        this.config = {
            port: config.port || 3060,
            wsPort: config.wsPort || 3083,
            autoTokenize: config.autoTokenize !== false,
            streamInterval: config.streamInterval || 5000,
            aurigraphEndpoint: config.aurigraphEndpoint || 'http://localhost:4004'
        };
        
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeHermesSimulation();
        
        console.log('🌊 HMS Transaction Stream Service Initialized');
    }
    
    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }
    
    private setupRoutes(): void {
        // Stream dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateStreamDashboard());
        });
        
        // Stream control endpoints
        this.app.post('/api/stream/start', (req, res) => {
            this.startStreaming();
            res.json({ success: true, message: 'Streaming started' });
        });
        
        this.app.post('/api/stream/stop', (req, res) => {
            this.stopStreaming();
            res.json({ success: true, message: 'Streaming stopped' });
        });
        
        this.app.get('/api/stream/status', (req, res) => {
            res.json({
                isStreaming: this.isStreaming,
                stats: this.getStats(),
                account: this.getAccountSummary()
            });
        });
        
        // Get stream history
        this.app.get('/api/stream/transactions', (req, res) => {
            const limit = parseInt(req.query.limit as string) || 100;
            res.json({
                transactions: this.streamedTransactions.slice(-limit),
                total: this.streamedTransactions.length
            });
        });
        
        // Simulate order placement
        this.app.post('/api/stream/simulate-order', (req, res) => {
            const { symbol, qty, side, type = 'market' } = req.body;
            const order = this.simulateOrderExecution(symbol, qty, side, type);
            res.json({ success: true, order });
        });
        
        // Get current positions
        this.app.get('/api/stream/positions', (req, res) => {
            res.json(Array.from(this.hermesAccount.positions.values()));
        });
        
        // Analytics endpoint
        this.app.get('/api/stream/analytics', (req, res) => {
            res.json(this.generateAnalytics());
        });
    }
    
    private initializeHermesSimulation(): void {
        // Initialize with some positions
        const initialPositions = [
            { symbol: 'AAPL', qty: 100, avgPrice: 175.50, currentPrice: 178.25 },
            { symbol: 'GOOGL', qty: 50, avgPrice: 140.00, currentPrice: 142.30 },
            { symbol: 'MSFT', qty: 75, avgPrice: 380.00, currentPrice: 385.50 },
            { symbol: 'TSLA', qty: 25, avgPrice: 250.00, currentPrice: 245.75 }
        ];
        
        initialPositions.forEach(pos => {
            this.hermesAccount.positions.set(pos.symbol, {
                ...pos,
                marketValue: pos.qty * pos.currentPrice,
                unrealizedPL: (pos.currentPrice - pos.avgPrice) * pos.qty,
                lastUpdated: new Date()
            });
        });
        
        console.log('📊 Initialized HMS account with', initialPositions.length, 'positions');
    }
    
    private startStreaming(): void {
        if (this.isStreaming) {
            console.log('⚠️ Streaming already active');
            return;
        }
        
        this.isStreaming = true;
        console.log('🌊 Starting HMS transaction stream...');
        
        // Start the main streaming loop
        this.streamInterval = setInterval(() => {
            this.generateStreamActivity();
        }, this.config.streamInterval);
        
        // Generate initial activity
        this.generateStreamActivity();
        
        this.emit('streamStarted');
    }
    
    private stopStreaming(): void {
        if (!this.isStreaming) {
            console.log('⚠️ Streaming not active');
            return;
        }
        
        this.isStreaming = false;
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
        }
        
        console.log('🛑 HMS transaction stream stopped');
        this.emit('streamStopped');
    }
    
    private async generateStreamActivity(): Promise<void> {
        const activities = [
            () => this.generateMarketDataUpdate(),
            () => this.generateOrderActivity(),
            () => this.generatePositionUpdate(),
            () => this.generateBalanceUpdate()
        ];
        
        // Randomly select 1-3 activities
        const numActivities = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numActivities; i++) {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            await activity();
        }
    }
    
    private async generateMarketDataUpdate(): Promise<void> {
        const positions = Array.from(this.hermesAccount.positions.values());
        if (positions.length === 0) return;
        
        const position = positions[Math.floor(Math.random() * positions.length)];
        const priceChange = (Math.random() - 0.5) * 2; // -1% to +1%
        const newPrice = position.currentPrice * (1 + priceChange / 100);
        
        position.currentPrice = Math.round(newPrice * 100) / 100;
        position.marketValue = position.qty * position.currentPrice;
        position.unrealizedPL = (position.currentPrice - position.avgPrice) * position.qty;
        position.lastUpdated = new Date();
        
        const update: StreamedTransaction = {
            id: crypto.randomUUID(),
            type: 'position_update',
            timestamp: new Date(),
            data: {
                symbol: position.symbol,
                currentPrice: position.currentPrice,
                marketValue: position.marketValue,
                unrealizedPL: position.unrealizedPL,
                priceChange: priceChange
            },
            tokenizationStatus: 'pending'
        };
        
        await this.processTransaction(update);
    }
    
    private async generateOrderActivity(): Promise<void> {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'AMZN', 'META'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        const qty = Math.floor(Math.random() * 50) + 10;
        
        const order = this.simulateOrderExecution(symbol, qty, side, 'market');
        
        const transaction: StreamedTransaction = {
            id: crypto.randomUUID(),
            type: 'order',
            timestamp: new Date(),
            data: order,
            tokenizationStatus: 'pending'
        };
        
        await this.processTransaction(transaction);
    }
    
    private simulateOrderExecution(symbol: string, qty: number, side: string, type: string): any {
        const basePrice = {
            'AAPL': 175, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250,
            'NVDA': 450, 'AMD': 140, 'AMZN': 145, 'META': 320
        }[symbol] || 100;
        
        const price = basePrice + (Math.random() - 0.5) * 10;
        const marketValue = qty * price;
        
        const order = {
            orderId: `HMS_ORD_${crypto.randomBytes(8).toString('hex')}`,
            symbol,
            side,
            qty,
            type,
            price: Math.round(price * 100) / 100,
            marketValue: Math.round(marketValue * 100) / 100,
            status: 'filled',
            filledAt: new Date(),
            commission: Math.round(marketValue * 0.001 * 100) / 100
        };
        
        // Update positions
        if (side === 'buy') {
            const position = this.hermesAccount.positions.get(symbol);
            if (position) {
                const totalQty = position.qty + qty;
                const totalCost = (position.qty * position.avgPrice) + (qty * price);
                position.qty = totalQty;
                position.avgPrice = totalCost / totalQty;
                position.currentPrice = price;
                position.marketValue = totalQty * price;
                position.unrealizedPL = (price - position.avgPrice) * totalQty;
            } else {
                this.hermesAccount.positions.set(symbol, {
                    symbol,
                    qty,
                    avgPrice: price,
                    currentPrice: price,
                    marketValue,
                    unrealizedPL: 0,
                    lastUpdated: new Date()
                });
            }
            this.hermesAccount.cash -= marketValue + order.commission;
        } else {
            const position = this.hermesAccount.positions.get(symbol);
            if (position && position.qty >= qty) {
                position.qty -= qty;
                if (position.qty === 0) {
                    this.hermesAccount.positions.delete(symbol);
                } else {
                    position.marketValue = position.qty * price;
                    position.unrealizedPL = (price - position.avgPrice) * position.qty;
                }
                this.hermesAccount.cash += marketValue - order.commission;
            }
        }
        
        this.hermesAccount.completedOrders.push(order);
        return order;
    }
    
    private async generatePositionUpdate(): Promise<void> {
        // Update portfolio value
        let totalValue = this.hermesAccount.cash;
        this.hermesAccount.positions.forEach(pos => {
            totalValue += pos.marketValue;
        });
        this.hermesAccount.portfolioValue = Math.round(totalValue * 100) / 100;
        
        const update: StreamedTransaction = {
            id: crypto.randomUUID(),
            type: 'position_update',
            timestamp: new Date(),
            data: {
                portfolioValue: this.hermesAccount.portfolioValue,
                positionsCount: this.hermesAccount.positions.size,
                topPosition: Array.from(this.hermesAccount.positions.values())
                    .sort((a, b) => b.marketValue - a.marketValue)[0]
            },
            tokenizationStatus: 'pending'
        };
        
        await this.processTransaction(update);
    }
    
    private async generateBalanceUpdate(): Promise<void> {
        const update: StreamedTransaction = {
            id: crypto.randomUUID(),
            type: 'balance_update',
            timestamp: new Date(),
            data: {
                cash: this.hermesAccount.cash,
                buyingPower: this.hermesAccount.buyingPower,
                portfolioValue: this.hermesAccount.portfolioValue
            },
            tokenizationStatus: 'pending'
        };
        
        await this.processTransaction(update);
    }
    
    private async processTransaction(transaction: StreamedTransaction): Promise<void> {
        const startTime = performance.now();
        
        try {
            transaction.tokenizationStatus = 'processing';
            this.streamedTransactions.push(transaction);
            this.stats.totalStreamed++;
            
            if (this.config.autoTokenize) {
                // Simulate tokenization
                await this.tokenizeTransaction(transaction);
                transaction.tokenizationStatus = 'completed';
                transaction.aurigraphBlock = 2000000 + this.stats.totalTokenized;
                transaction.processingTime = performance.now() - startTime;
                this.stats.totalTokenized++;
                
                // Update average processing time
                this.stats.avgProcessingTime = 
                    (this.stats.avgProcessingTime * (this.stats.totalTokenized - 1) + transaction.processingTime) 
                    / this.stats.totalTokenized;
            }
            
            // Broadcast update
            this.broadcastTransaction(transaction);
            
            console.log(`📡 Streamed ${transaction.type}: ${transaction.id.substring(0, 8)}... [${transaction.processingTime?.toFixed(2)}ms]`);
            
        } catch (error) {
            console.error('❌ Failed to process transaction:', error);
            transaction.tokenizationStatus = 'failed';
        }
    }
    
    private async tokenizeTransaction(transaction: StreamedTransaction): Promise<void> {
        // Simulate tokenization delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        
        // In production, this would call the actual Aurigraph tokenization API
        transaction.aurigraphBlock = 2000000 + this.stats.totalTokenized;
    }
    
    private broadcastTransaction(transaction: StreamedTransaction): void {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'stream_update',
                        data: transaction,
                        timestamp: new Date()
                    }));
                }
            });
        }
    }
    
    private getStats() {
        return {
            ...this.stats,
            uptimeSeconds: Math.floor((Date.now() - this.stats.uptime) / 1000),
            transactionsPerMinute: this.stats.totalStreamed / Math.max(1, (Date.now() - this.stats.uptime) / 60000)
        };
    }
    
    private getAccountSummary() {
        return {
            accountNumber: this.hermesAccount.accountNumber,
            portfolioValue: this.hermesAccount.portfolioValue,
            cash: this.hermesAccount.cash,
            buyingPower: this.hermesAccount.buyingPower,
            positionsCount: this.hermesAccount.positions.size,
            recentOrdersCount: this.hermesAccount.completedOrders.length
        };
    }
    
    private generateAnalytics() {
        const positions = Array.from(this.hermesAccount.positions.values());
        const orders = this.hermesAccount.completedOrders.slice(-100);
        
        return {
            portfolio: {
                totalValue: this.hermesAccount.portfolioValue,
                positions: positions.length,
                topGainer: positions.reduce((best, pos) => 
                    pos.unrealizedPL > (best?.unrealizedPL || 0) ? pos : best, null),
                topLoser: positions.reduce((worst, pos) => 
                    pos.unrealizedPL < (worst?.unrealizedPL || 0) ? pos : worst, null)
            },
            trading: {
                totalOrders: orders.length,
                buyOrders: orders.filter(o => o.side === 'buy').length,
                sellOrders: orders.filter(o => o.side === 'sell').length,
                totalVolume: orders.reduce((sum, o) => sum + o.marketValue, 0),
                totalCommissions: orders.reduce((sum, o) => sum + o.commission, 0)
            },
            streaming: {
                totalStreamed: this.stats.totalStreamed,
                totalTokenized: this.stats.totalTokenized,
                tokenizationRate: this.stats.totalTokenized / Math.max(1, this.stats.totalStreamed),
                avgProcessingTime: Math.round(this.stats.avgProcessingTime * 100) / 100
            }
        };
    }
    
    private generateStreamDashboard(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌊 HMS Transaction Stream Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            padding: 2rem;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        .controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        .btn {
            padding: 1rem 2rem;
            border-radius: 10px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1rem;
        }
        .btn-start {
            background: linear-gradient(135deg, #00d4aa, #00b894);
            color: white;
        }
        .btn-stop {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h2 {
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            margin-bottom: 1rem;
        }
        .metric-label {
            opacity: 0.8;
        }
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
        }
        .stream-log {
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 1rem;
        }
        .stream-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            border-left: 4px solid;
            font-family: monospace;
            font-size: 0.9rem;
        }
        .stream-item.order { border-left-color: #00d4aa; }
        .stream-item.position_update { border-left-color: #7b68ee; }
        .stream-item.balance_update { border-left-color: #ffa500; }
        .stream-item.trade { border-left-color: #00bcd4; }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }
        .status-active { background: #00d4aa; }
        .status-inactive { background: #ff6b6b; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .full-width { grid-column: 1 / -1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌊 HMS Transaction Stream Monitor</h1>
        <p>Real-time monitoring and tokenization of Hermes trading activity</p>
        <div class="controls">
            <button class="btn btn-start" onclick="startStream()">▶️ Start Stream</button>
            <button class="btn btn-stop" onclick="stopStream()">⏸️ Stop Stream</button>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h2>📊 Stream Statistics</h2>
            <div class="metric">
                <span class="metric-label">Status</span>
                <span class="metric-value">
                    <span id="streamStatus" class="status-indicator status-inactive"></span>
                    <span id="streamStatusText">Inactive</span>
                </span>
            </div>
            <div class="metric">
                <span class="metric-label">Total Streamed</span>
                <span class="metric-value" id="totalStreamed">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Total Tokenized</span>
                <span class="metric-value" id="totalTokenized">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Avg Processing</span>
                <span class="metric-value" id="avgProcessing">0ms</span>
            </div>
        </div>

        <div class="card">
            <h2>💼 HMS Account</h2>
            <div class="metric">
                <span class="metric-label">Portfolio Value</span>
                <span class="metric-value" id="portfolioValue">$0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Cash Balance</span>
                <span class="metric-value" id="cashBalance">$0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Positions</span>
                <span class="metric-value" id="positionsCount">0</span>
            </div>
            <div class="metric">
                <span class="metric-label">Recent Orders</span>
                <span class="metric-value" id="ordersCount">0</span>
            </div>
        </div>

        <div class="card full-width">
            <h2>📡 Live Transaction Stream</h2>
            <div id="streamLog" class="stream-log">
                <div class="stream-item">Waiting for stream to start...</div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3083');
        let isStreaming = false;
        
        ws.onopen = function() {
            console.log('🔌 Connected to HMS stream');
            updateStatus();
        };
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'stream_update') {
                addStreamItem(message.data);
                updateStatus();
            }
        };
        
        async function startStream() {
            const response = await fetch('/api/stream/start', { method: 'POST' });
            if (response.ok) {
                isStreaming = true;
                updateStatus();
            }
        }
        
        async function stopStream() {
            const response = await fetch('/api/stream/stop', { method: 'POST' });
            if (response.ok) {
                isStreaming = false;
                updateStatus();
            }
        }
        
        async function updateStatus() {
            const response = await fetch('/api/stream/status');
            const data = await response.json();
            
            isStreaming = data.isStreaming;
            document.getElementById('streamStatus').className = 'status-indicator ' + (isStreaming ? 'status-active' : 'status-inactive');
            document.getElementById('streamStatusText').textContent = isStreaming ? 'Active' : 'Inactive';
            
            document.getElementById('totalStreamed').textContent = data.stats.totalStreamed.toLocaleString();
            document.getElementById('totalTokenized').textContent = data.stats.totalTokenized.toLocaleString();
            document.getElementById('avgProcessing').textContent = data.stats.avgProcessingTime.toFixed(2) + 'ms';
            
            document.getElementById('portfolioValue').textContent = '$' + data.account.portfolioValue.toLocaleString();
            document.getElementById('cashBalance').textContent = '$' + data.account.cash.toLocaleString();
            document.getElementById('positionsCount').textContent = data.account.positionsCount;
            document.getElementById('ordersCount').textContent = data.account.recentOrdersCount;
        }
        
        function addStreamItem(transaction) {
            const log = document.getElementById('streamLog');
            const item = document.createElement('div');
            item.className = 'stream-item ' + transaction.type;
            
            const time = new Date(transaction.timestamp).toLocaleTimeString();
            let details = '';
            
            if (transaction.type === 'order') {
                details = \`\${transaction.data.side.toUpperCase()} \${transaction.data.qty} \${transaction.data.symbol} @ $\${transaction.data.price}\`;
            } else if (transaction.type === 'position_update') {
                details = \`Portfolio: $\${transaction.data.portfolioValue?.toLocaleString() || 'N/A'}\`;
            } else if (transaction.type === 'balance_update') {
                details = \`Cash: $\${transaction.data.cash?.toLocaleString() || 'N/A'}\`;
            }
            
            item.innerHTML = \`
                <strong>[\${time}]</strong> \${transaction.type.toUpperCase()}
                <br>\${details}
                <br>Status: \${transaction.tokenizationStatus} | Block: \${transaction.aurigraphBlock || 'pending'}
            \`;
            
            log.insertBefore(item, log.firstChild);
            
            // Keep only last 50 items
            while (log.children.length > 50) {
                log.removeChild(log.lastChild);
            }
        }
        
        // Auto-refresh every 5 seconds
        setInterval(updateStatus, 5000);
        updateStatus();
    </script>
</body>
</html>
        `;
    }
    
    private startWebSocketServer(): void {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New stream client connected');
            
            ws.on('close', () => {
                console.log('🔌 Stream client disconnected');
            });
        });
        
        console.log(`🌐 Stream WebSocket server started on port ${this.config.wsPort}`);
    }
    
    public async start(): Promise<void> {
        this.server = this.app.listen(this.config.port, () => {
            console.log(`\n🌊 HMS Transaction Stream Service Started`);
            console.log(`📊 Dashboard: http://localhost:${this.config.port}`);
            console.log(`🔗 API: http://localhost:${this.config.port}/api`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
            console.log(`⚙️  Auto-Tokenization: ${this.config.autoTokenize ? 'ENABLED' : 'DISABLED'}`);
            console.log(`📈 Stream Interval: ${this.config.streamInterval}ms`);
        });
        
        this.startWebSocketServer();
        
        // Auto-start streaming after 2 seconds
        setTimeout(() => {
            console.log('🚀 Auto-starting transaction stream...');
            this.startStreaming();
        }, 2000);
    }
    
    public stop(): void {
        this.stopStreaming();
        
        if (this.server) {
            this.server.close();
            console.log('🛑 Stream server stopped');
        }
        if (this.wss) {
            this.wss.close();
            console.log('🛑 Stream WebSocket stopped');
        }
    }
}

// Main execution
async function main() {
    const stream = new HMSTransactionStream({
        port: parseInt(process.env.STREAM_PORT || '3060'),
        wsPort: parseInt(process.env.STREAM_WS_PORT || '3083'),
        autoTokenize: true,
        streamInterval: 3000
    });
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down HMS stream...');
        stream.stop();
        process.exit(0);
    });
    
    await stream.start();
}

if (require.main === module) {
    main().catch(console.error);
}

export default HMSTransactionStream;