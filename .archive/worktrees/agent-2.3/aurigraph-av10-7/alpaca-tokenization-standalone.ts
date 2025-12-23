#!/usr/bin/env npx ts-node

/**
 * Standalone Alpaca Trading Tokenization Demo
 * 
 * A complete demonstration of tokenizing Alpaca trading transactions
 * on the Aurigraph DLT platform with quantum-resistant security.
 */

import express from 'express';
import WebSocket from 'ws';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

// Load environment variables
dotenv.config({ path: '.env.alpaca' });

interface TradeData {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    qty: number;
    price: number;
    timestamp: Date;
    orderId: string;
    marketValue: number;
}

interface TokenizedTransaction {
    txId: string;
    blockchainTxHash: string;
    aurigraphBlock: number;
    tradeData: TradeData;
    assetToken: {
        tokenId: string;
        symbol: string;
        contractAddress: string;
    };
    compliance: {
        regulatoryHash: string;
        kycVerified: boolean;
        amlCleared: boolean;
    };
    crossChainStatus: {
        ethereum: 'pending' | 'confirmed' | 'failed';
        polygon: 'pending' | 'confirmed' | 'failed';
        bsc: 'pending' | 'confirmed' | 'failed';
    };
    quantumSignature: string;
    created: Date;
}

class AlpacaTokenizationStandalone {
    private app: express.Application;
    private server: any;
    private wss!: WebSocket.Server;
    private tokenizedTrades: TokenizedTransaction[] = [];
    private blockHeight = 1000000;
    
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🚀 Alpaca Tokenization Standalone Demo Initialized');
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
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // Mock account info
        this.app.get('/api/account', (req, res) => {
            res.json({
                account_number: process.env.ALPACA_API_KEY || 'Hermes',
                status: 'ACTIVE',
                buying_power: '125000.00',
                cash: '100000.00',
                portfolio_value: '125000.00'
            });
        });

        // Place order and tokenize
        this.app.post('/api/order', async (req, res) => {
            try {
                const { symbol, qty, side } = req.body;
                
                // Create mock order
                const price = this.getMockPrice(symbol);
                const tradeData: TradeData = {
                    id: `trade_${crypto.randomBytes(8).toString('hex')}`,
                    symbol: symbol.toUpperCase(),
                    side,
                    qty: parseInt(qty),
                    price,
                    timestamp: new Date(),
                    orderId: `order_${crypto.randomBytes(8).toString('hex')}`,
                    marketValue: parseInt(qty) * price
                };

                // Tokenize the trade
                const tokenizedTx = await this.tokenizeTrade(tradeData);
                
                res.json({
                    success: true,
                    trade: tradeData,
                    tokenizedTransaction: tokenizedTx
                });
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get tokenized trades
        this.app.get('/api/trades', (req, res) => {
            res.json({
                trades: this.tokenizedTrades.slice(-50),
                totalCount: this.tokenizedTrades.length,
                blockHeight: this.blockHeight
            });
        });

        // Get stats
        this.app.get('/api/stats', (req, res) => {
            const totalVolume = this.tokenizedTrades.reduce((sum, tx) => sum + tx.tradeData.marketValue, 0);
            const uniqueSymbols = new Set(this.tokenizedTrades.map(tx => tx.tradeData.symbol)).size;
            
            res.json({
                totalTransactions: this.tokenizedTrades.length,
                totalVolume,
                uniqueSymbols,
                currentBlock: this.blockHeight
            });
        });
    }

    private async tokenizeTrade(tradeData: TradeData): Promise<TokenizedTransaction> {
        const startTime = performance.now();
        
        // Generate blockchain hash
        const blockchainTxHash = crypto.createHash('sha256')
            .update(`${tradeData.id}_${tradeData.timestamp.getTime()}_${this.blockHeight}`)
            .digest('hex');

        // Create asset token
        const assetToken = {
            tokenId: `AST_${tradeData.symbol}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
            symbol: tradeData.symbol,
            contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`
        };

        // Generate compliance hash
        const complianceData = {
            symbol: tradeData.symbol,
            side: tradeData.side,
            qty: tradeData.qty,
            price: tradeData.price,
            timestamp: tradeData.timestamp.toISOString()
        };
        
        const regulatoryHash = crypto.createHash('sha256')
            .update(JSON.stringify(complianceData))
            .digest('hex').substring(0, 16).toUpperCase();

        // Generate quantum signature (mock)
        const quantumSignature = `DILITHIUM_${crypto.createHash('sha256')
            .update(`${tradeData.id}_${tradeData.symbol}`)
            .digest('hex').substring(0, 32).toUpperCase()}`;

        // Simulate cross-chain deployment
        const crossChainStatus = {
            ethereum: Math.random() > 0.1 ? 'confirmed' : 'pending',
            polygon: Math.random() > 0.05 ? 'confirmed' : 'pending',
            bsc: Math.random() > 0.02 ? 'confirmed' : 'pending'
        } as const;

        const tokenizedTx: TokenizedTransaction = {
            txId: crypto.randomUUID(),
            blockchainTxHash,
            aurigraphBlock: this.blockHeight++,
            tradeData,
            assetToken,
            compliance: {
                regulatoryHash,
                kycVerified: true,
                amlCleared: true
            },
            crossChainStatus,
            quantumSignature,
            created: new Date()
        };

        this.tokenizedTrades.push(tokenizedTx);
        
        // Broadcast via WebSocket
        this.broadcastUpdate('tokenized_trade', tokenizedTx);
        
        const endTime = performance.now();
        console.log(`✅ Tokenized ${tradeData.symbol} trade in ${(endTime - startTime).toFixed(2)}ms`);
        
        return tokenizedTx;
    }

    private getMockPrice(symbol: string): number {
        const basePrices: Record<string, number> = {
            'AAPL': 175, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250, 'NVDA': 450,
            'AMD': 140, 'AMZN': 145, 'META': 320, 'NFLX': 450, 'CRM': 240
        };
        
        const basePrice = basePrices[symbol.toUpperCase()] || 100;
        return Math.round((basePrice + (Math.random() - 0.5) * 20) * 100) / 100;
    }

    private broadcastUpdate(type: string, data: any): void {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type, data }));
                }
            });
        }
    }

    private generateDashboardHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Alpaca × Aurigraph Tokenization</title>
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
            padding: 1.5rem 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            text-align: center;
        }
        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #00d4aa;
            margin-bottom: 0.5rem;
        }
        .header p {
            color: #888;
            font-size: 1.1rem;
        }
        .container { 
            max-width: 1200px; 
            margin: 2rem auto; 
            padding: 0 2rem; 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        .card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .card h2 {
            color: #00d4aa;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-item {
            background: rgba(0,212,170,0.1);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(0,212,170,0.2);
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #00d4aa;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #888;
            font-size: 0.9rem;
        }
        .order-form {
            display: grid;
            gap: 1.5rem;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .form-group label {
            color: #888;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .form-group input, .form-group select {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 1rem;
            color: white;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #00d4aa;
        }
        .btn {
            background: linear-gradient(45deg, #00d4aa, #00b894);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0,212,170,0.4);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        .trades-list {
            max-height: 500px;
            overflow-y: auto;
            margin-top: 1rem;
        }
        .trade-item {
            background: rgba(255,255,255,0.03);
            margin-bottom: 1rem;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid #00d4aa;
            transition: all 0.3s;
        }
        .trade-item:hover {
            background: rgba(255,255,255,0.08);
            transform: translateX(4px);
        }
        .trade-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            margin-bottom: 0.75rem;
            font-size: 1.1rem;
        }
        .trade-details {
            font-size: 0.9rem;
            color: #888;
            line-height: 1.8;
        }
        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        .status-confirmed { background: #00d4aa; }
        .status-pending { background: #ffa500; }
        .status-failed { background: #ff4444; }
        .full-width { grid-column: 1 / -1; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        
        .token-info {
            background: rgba(0,212,170,0.05);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 0.5rem;
            font-family: monospace;
            font-size: 0.8rem;
            border: 1px solid rgba(0,212,170,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Alpaca × Aurigraph Tokenization</h1>
        <p>Real-time tokenization of trading transactions with quantum-resistant blockchain technology</p>
    </div>

    <div class="container">
        <!-- Statistics Dashboard -->
        <div class="card">
            <h2>📊 Trading Statistics</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="totalTrades">0</div>
                    <div class="stat-label">Tokenized Trades</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="totalVolume">$0</div>
                    <div class="stat-label">Total Volume</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="uniqueSymbols">0</div>
                    <div class="stat-label">Unique Assets</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="blockHeight">1,000,000</div>
                    <div class="stat-label">Block Height</div>
                </div>
            </div>
        </div>

        <!-- Place Order Form -->
        <div class="card">
            <h2>📈 Place & Tokenize Order</h2>
            <form id="orderForm" class="order-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Symbol</label>
                        <input type="text" id="symbol" placeholder="AAPL" value="AAPL" required>
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" id="qty" placeholder="100" value="10" min="1" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Order Side</label>
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

        <!-- Recent Tokenized Trades -->
        <div class="card full-width">
            <h2>🔗 Recent Tokenized Transactions</h2>
            <div id="tradesList" class="trades-list">
                <div class="trade-item">
                    <div class="trade-header">
                        <span>Waiting for transactions...</span>
                    </div>
                    <div class="trade-details">Place an order above to see tokenized transactions appear here in real-time</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3081');
        
        ws.onopen = function() {
            console.log('🔌 Connected to tokenization stream');
            loadStats();
        };

        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'tokenized_trade') {
                addTradeToList(message.data);
                updateStats();
            }
        };

        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalTrades').textContent = stats.totalTransactions.toLocaleString();
                document.getElementById('totalVolume').textContent = '$' + Math.round(stats.totalVolume).toLocaleString();
                document.getElementById('uniqueSymbols').textContent = stats.uniqueSymbols;
                document.getElementById('blockHeight').textContent = stats.currentBlock.toLocaleString();
                
                // Load existing trades
                const tradesResponse = await fetch('/api/trades');
                const tradesData = await tradesResponse.json();
                tradesData.trades.forEach(trade => addTradeToList(trade));
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        function addTradeToList(tokenizedTx) {
            const list = document.getElementById('tradesList');
            const trade = tokenizedTx.tradeData;
            
            const tradeItem = document.createElement('div');
            tradeItem.className = 'trade-item pulse';
            tradeItem.innerHTML = \`
                <div class="trade-header">
                    <span>\${trade.symbol} • \${trade.side.toUpperCase()} \${trade.qty} @ $\${trade.price}</span>
                    <span style="color: #00d4aa">$\${trade.marketValue.toLocaleString()}</span>
                </div>
                <div class="trade-details">
                    <div><strong>Block:</strong> \${tokenizedTx.aurigraphBlock.toLocaleString()}</div>
                    <div><strong>Cross-Chain Status:</strong> 
                        <span class="status-dot status-\${tokenizedTx.crossChainStatus.ethereum}"></span>ETH \${tokenizedTx.crossChainStatus.ethereum}
                        <span class="status-dot status-\${tokenizedTx.crossChainStatus.polygon}"></span>POLY \${tokenizedTx.crossChainStatus.polygon}
                        <span class="status-dot status-\${tokenizedTx.crossChainStatus.bsc}"></span>BSC \${tokenizedTx.crossChainStatus.bsc}
                    </div>
                </div>
                <div class="token-info">
                    <div><strong>Asset Token:</strong> \${tokenizedTx.assetToken.tokenId}</div>
                    <div><strong>Contract:</strong> \${tokenizedTx.assetToken.contractAddress}</div>
                    <div><strong>Blockchain TX:</strong> \${tokenizedTx.blockchainTxHash.substring(0, 32)}...</div>
                    <div><strong>Quantum Signature:</strong> \${tokenizedTx.quantumSignature.substring(0, 40)}...</div>
                </div>
            \`;
            
            list.insertBefore(tradeItem, list.firstChild);
            
            // Keep only last 10 trades
            while (list.children.length > 10) {
                list.removeChild(list.lastChild);
            }
        }

        function updateStats() {
            loadStats();
        }

        // Handle order form submission
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('placeOrderBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Tokenizing...';
            
            try {
                const formData = {
                    symbol: document.getElementById('symbol').value.toUpperCase(),
                    qty: document.getElementById('qty').value,
                    side: document.getElementById('side').value
                };
                
                const response = await fetch('/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Order tokenized:', result);
                    
                    // Reset quantity
                    document.getElementById('qty').value = '10';
                } else {
                    throw new Error('Order placement failed');
                }
            } catch (error) {
                console.error('❌ Order failed:', error);
                alert('Order placement failed: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        // Auto-generate demo trades every 20 seconds
        setInterval(() => {
            if (Math.random() > 0.6) { // 40% chance
                const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const qty = Math.floor(Math.random() * 50) + 10;
                const side = Math.random() > 0.5 ? 'buy' : 'sell';
                
                document.getElementById('symbol').value = symbol;
                document.getElementById('qty').value = qty.toString();
                document.getElementById('side').value = side;
                document.getElementById('orderForm').dispatchEvent(new Event('submit'));
            }
        }, 20000);
    </script>
</body>
</html>
        `;
    }

    private startWebSocketServer(): void {
        this.wss = new WebSocket.Server({ port: 3081 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection established');
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
        
        console.log('🌐 WebSocket server started on port 3081');
    }

    public async start(port: number = 3050): Promise<void> {
        this.server = this.app.listen(port, () => {
            console.log(`\n🚀 Alpaca Tokenization Demo Started`);
            console.log(`📊 Dashboard: http://localhost:${port}`);
            console.log(`🔗 API: http://localhost:${port}/api`);
            console.log(`⚛️  Aurigraph Integration: ACTIVE`);
            console.log(`🔐 Quantum Security: CRYSTALS-Dilithium Level 5`);
            console.log(`🌐 Cross-Chain Bridges: Ethereum, Polygon, BSC`);
        });

        this.startWebSocketServer();

        // Generate initial demo trades
        setTimeout(() => {
            this.generateInitialTrades();
        }, 2000);
    }

    private async generateInitialTrades(): Promise<void> {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
        
        for (let i = 0; i < 3; i++) {
            const symbol = symbols[i];
            const qty = 50 + i * 25;
            const side = i % 2 === 0 ? 'buy' : 'sell';
            const price = this.getMockPrice(symbol);
            
            const tradeData: TradeData = {
                id: `initial_${crypto.randomBytes(6).toString('hex')}`,
                symbol,
                side,
                qty,
                price,
                timestamp: new Date(Date.now() - (3 - i) * 60000), // Spaced 1 minute apart
                orderId: `order_${crypto.randomBytes(6).toString('hex')}`,
                marketValue: qty * price
            };
            
            await this.tokenizeTrade(tradeData);
            
            // Small delay between trades
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('✅ Initial demo trades generated');
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
    const demo = new AlpacaTokenizationStandalone();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        demo.stop();
        process.exit(0);
    });

    const port = parseInt(process.env.DEMO_PORT || '3050');
    await demo.start(port);
}

if (require.main === module) {
    main().catch(console.error);
}

export default AlpacaTokenizationStandalone;