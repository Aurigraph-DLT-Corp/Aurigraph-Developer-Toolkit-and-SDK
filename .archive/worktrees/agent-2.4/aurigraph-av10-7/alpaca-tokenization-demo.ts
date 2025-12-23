#!/usr/bin/env npx ts-node

/**
 * Alpaca Trading Transaction Tokenization Demo
 * 
 * This demo showcases how Aurigraph DLT can tokenize real-world trading transactions
 * from Alpaca Markets API, creating immutable blockchain records with:
 * - Trade execution data
 * - Asset tokenization
 * - Compliance tracking
 * - Real-time settlement
 * - Cross-chain bridge capabilities
 */

import express from 'express';
import WebSocket from 'ws';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

// Alpaca API Configuration
interface AlpacaConfig {
    baseUrl: string;
    apiKeyId: string;
    secretKey: string;
    paperTrading: boolean;
}

// Trading Transaction Types
interface TradeTransaction {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    qty: number;
    price: number;
    timestamp: Date;
    orderId: string;
    clientOrderId?: string;
    commission?: number;
}

interface TokenizedTrade {
    transactionId: string;
    blockchainTxHash: string;
    tradeData: TradeTransaction;
    tokenMetadata: {
        assetToken: string;
        tradeToken: string;
        complianceHash: string;
        aurigraphBlock: number;
    };
    crossChainStatus: {
        ethereum: 'pending' | 'confirmed' | 'failed';
        polygon: 'pending' | 'confirmed' | 'failed';
        bsc: 'pending' | 'confirmed' | 'failed';
    };
    quantumSignature: string;
    timestamp: Date;
}

class AlpacaTokenizationDemo {
    private app: express.Application;
    private server: any;
    private wss: WebSocket.Server;
    private alpacaConfig: AlpacaConfig;
    private tokenizedTrades: TokenizedTrade[] = [];
    private aurigraphBlockHeight = 1000000; // Starting block height
    
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        // Initialize Alpaca configuration (use environment variables in production)
        this.alpacaConfig = {
            baseUrl: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
            apiKeyId: process.env.ALPACA_API_KEY || 'DEMO_KEY_ALPACA_TOKENIZATION',
            secretKey: process.env.ALPACA_SECRET_KEY || 'DEMO_SECRET_TOKENIZATION_2024',
            paperTrading: true
        };
        
        console.log('🚀 Alpaca Tokenization Demo Initialized');
        console.log(`📊 Mode: ${this.alpacaConfig.paperTrading ? 'Paper Trading' : 'Live Trading'}`);
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });
    }

    private setupRoutes(): void {
        // Serve demo dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // Get tokenized trades
        this.app.get('/api/tokenized-trades', (req, res) => {
            res.json({
                trades: this.tokenizedTrades.slice(-50), // Last 50 trades
                totalCount: this.tokenizedTrades.length,
                aurigraphBlockHeight: this.aurigraphBlockHeight
            });
        });

        // Manual trade tokenization endpoint
        this.app.post('/api/tokenize-trade', async (req, res) => {
            try {
                const trade: TradeTransaction = req.body;
                const tokenizedTrade = await this.tokenizeTrade(trade);
                res.json(tokenizedTrade);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Alpaca account info (mock for demo)
        this.app.get('/api/alpaca/account', (req, res) => {
            res.json(this.getMockAccountInfo());
        });

        // Get trade history from Alpaca (mock data for demo)
        this.app.get('/api/alpaca/trades', (req, res) => {
            res.json(this.getMockTradeHistory());
        });

        // Cross-chain bridge status
        this.app.get('/api/crosschain/status', (req, res) => {
            res.json(this.getCrossChainStatus());
        });
    }

    private async tokenizeTrade(trade: TradeTransaction): Promise<TokenizedTrade> {
        const startTime = performance.now();
        
        // Generate blockchain transaction hash
        const blockchainTxHash = crypto.createHash('sha256')
            .update(`${trade.id}-${trade.timestamp}-${this.aurigraphBlockHeight}`)
            .digest('hex');

        // Create asset and trade tokens
        const assetToken = this.generateAssetToken(trade.symbol);
        const tradeToken = this.generateTradeToken(trade);
        
        // Generate compliance hash
        const complianceHash = this.generateComplianceHash(trade);
        
        // Create quantum-resistant signature
        const quantumSignature = this.generateQuantumSignature(trade);
        
        // Simulate cross-chain bridge deployment
        const crossChainStatus = await this.deployCrossChain(blockchainTxHash);
        
        const tokenizedTrade: TokenizedTrade = {
            transactionId: crypto.randomUUID(),
            blockchainTxHash,
            tradeData: trade,
            tokenMetadata: {
                assetToken,
                tradeToken,
                complianceHash,
                aurigraphBlock: this.aurigraphBlockHeight++
            },
            crossChainStatus,
            quantumSignature,
            timestamp: new Date()
        };

        // Store the tokenized trade
        this.tokenizedTrades.push(tokenizedTrade);
        
        // Broadcast to WebSocket clients
        this.broadcastTrade(tokenizedTrade);
        
        const endTime = performance.now();
        console.log(`✅ Tokenized trade ${trade.id} in ${(endTime - startTime).toFixed(2)}ms`);
        
        return tokenizedTrade;
    }

    private generateAssetToken(symbol: string): string {
        return `AST_${symbol}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    }

    private generateTradeToken(trade: TradeTransaction): string {
        return `TRD_${trade.side.toUpperCase()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    }

    private generateComplianceHash(trade: TradeTransaction): string {
        const complianceData = {
            symbol: trade.symbol,
            side: trade.side,
            qty: trade.qty,
            price: trade.price,
            timestamp: trade.timestamp.toISOString(),
            regulatoryFlags: ['FINRA_COMPLIANT', 'SEC_REGISTERED', 'CFTC_APPROVED']
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(complianceData))
            .digest('hex').substring(0, 16).toUpperCase();
    }

    private generateQuantumSignature(trade: TradeTransaction): string {
        // Simulate CRYSTALS-Dilithium signature (actual implementation would use real crypto)
        const data = `${trade.id}${trade.symbol}${trade.qty}${trade.price}`;
        return `QS_DILITHIUM_${crypto.createHash('sha256').update(data).digest('hex').substring(0, 32).toUpperCase()}`;
    }

    private async deployCrossChain(txHash: string): Promise<TokenizedTrade['crossChainStatus']> {
        // Simulate cross-chain deployment with different confirmation speeds
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ethereum: Math.random() > 0.1 ? 'confirmed' : 'pending',
                    polygon: Math.random() > 0.05 ? 'confirmed' : 'pending',
                    bsc: Math.random() > 0.02 ? 'confirmed' : 'pending'
                });
            }, 100);
        });
    }

    private broadcastTrade(tokenizedTrade: TokenizedTrade): void {
        if (this.wss) {
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'tokenized_trade',
                        data: tokenizedTrade
                    }));
                }
            });
        }
    }

    private getMockAccountInfo() {
        return {
            account_number: 'DEMO123456789',
            status: 'ACTIVE',
            currency: 'USD',
            buying_power: 500000.00,
            cash: 100000.00,
            portfolio_value: 750000.00,
            pattern_day_trader: false,
            trade_suspended_by_user: false,
            trading_blocked: false,
            transfers_blocked: false,
            account_blocked: false,
            created_at: '2024-01-01T00:00:00Z',
            last_equity: 750000.00,
            tokenization_enabled: true,
            aurigraph_integration: 'ACTIVE',
            quantum_security_level: 5
        };
    }

    private getMockTradeHistory(): TradeTransaction[] {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'AMZN', 'META'];
        const trades: TradeTransaction[] = [];
        
        for (let i = 0; i < 20; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            const qty = Math.floor(Math.random() * 1000) + 1;
            const price = 50 + Math.random() * 500;
            
            trades.push({
                id: `trade_${crypto.randomBytes(8).toString('hex')}`,
                symbol,
                side,
                qty,
                price: Math.round(price * 100) / 100,
                timestamp: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
                orderId: `order_${crypto.randomBytes(6).toString('hex')}`,
                commission: Math.round(qty * price * 0.001 * 100) / 100 // 0.1% commission
            });
        }
        
        return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    private getCrossChainStatus() {
        const chains = ['ethereum', 'polygon', 'bsc', 'avalanche', 'solana'];
        const status = {};
        
        chains.forEach(chain => {
            status[chain] = {
                connected: Math.random() > 0.1,
                blockHeight: Math.floor(Math.random() * 1000000) + 10000000,
                avgConfirmTime: Math.random() * 30 + 5, // 5-35 seconds
                bridgeBalance: Math.random() * 10000,
                dailyVolume: Math.random() * 1000000
            };
        });
        
        return status;
    }

    private generateDashboardHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alpaca × Aurigraph Tokenization Demo</title>
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
        }
        .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #00d4aa;
        }
        .header p {
            color: #888;
            margin-top: 0.5rem;
        }
        .container { 
            max-width: 1400px; 
            margin: 2rem auto; 
            padding: 0 2rem; 
            display: grid;
            grid-template-columns: 1fr 1fr;
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
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-item {
            background: rgba(0,212,170,0.1);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(0,212,170,0.2);
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #00d4aa;
        }
        .stat-label {
            color: #888;
            font-size: 0.9rem;
        }
        .trade-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .trade-item {
            background: rgba(255,255,255,0.03);
            margin-bottom: 0.5rem;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #00d4aa;
        }
        .trade-header {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
        }
        .trade-details {
            font-size: 0.9rem;
            color: #888;
            margin-top: 0.5rem;
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        .status-confirmed { background: #00d4aa; }
        .status-pending { background: #ffa500; }
        .status-failed { background: #ff4444; }
        .btn {
            background: linear-gradient(45deg, #00d4aa, #00b894);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,212,170,0.3);
        }
        .full-width { grid-column: 1 / -1; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .pulse { animation: pulse 2s infinite; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Alpaca × Aurigraph Tokenization Demo</h1>
        <p>Real-time tokenization of trading transactions with quantum-resistant blockchain technology</p>
    </div>

    <div class="container">
        <div class="card">
            <h2>📊 Trading Statistics</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="totalTrades">0</div>
                    <div class="stat-label">Tokenized Trades</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="blockHeight">1,000,000</div>
                    <div class="stat-label">Block Height</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="dailyVolume">$0</div>
                    <div class="stat-label">Daily Volume</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="crossChainTx">0</div>
                    <div class="stat-label">Cross-Chain Tx</div>
                </div>
            </div>
            <button class="btn" onclick="generateMockTrade()">Generate Mock Trade</button>
        </div>

        <div class="card">
            <h2>🔗 Cross-Chain Status</h2>
            <div id="crossChainStatus">
                <div class="trade-item">
                    <div class="trade-header">
                        <span><span class="status-indicator status-confirmed"></span>Ethereum</span>
                        <span>Block: 19,234,567</span>
                    </div>
                    <div class="trade-details">Avg Confirm: 12s • Bridge Balance: 1,234 ETH</div>
                </div>
                <div class="trade-item">
                    <div class="trade-header">
                        <span><span class="status-indicator status-confirmed"></span>Polygon</span>
                        <span>Block: 52,198,432</span>
                    </div>
                    <div class="trade-details">Avg Confirm: 3s • Bridge Balance: 45,678 MATIC</div>
                </div>
                <div class="trade-item">
                    <div class="trade-header">
                        <span><span class="status-indicator status-pending"></span>BSC</span>
                        <span>Block: 35,876,234</span>
                    </div>
                    <div class="trade-details">Avg Confirm: 5s • Bridge Balance: 2,345 BNB</div>
                </div>
            </div>
        </div>

        <div class="card full-width">
            <h2>📈 Recent Tokenized Trades</h2>
            <div id="tradesList" class="trade-list">
                <div class="trade-item pulse">
                    <div class="trade-header">
                        <span>AAPL • BUY 100 @ $175.50</span>
                        <span>$17,550</span>
                    </div>
                    <div class="trade-details">
                        Token: AST_AAPL_A1B2C3D4 • Block: 1,000,001 • 
                        <span class="status-indicator status-confirmed"></span>ETH Confirmed
                        <span class="status-indicator status-confirmed"></span>POLY Confirmed
                        <span class="status-indicator status-pending"></span>BSC Pending
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:3080');
        let tradeCount = 0;
        let dailyVolume = 0;
        let crossChainCount = 0;

        ws.onopen = function() {
            console.log('🔌 Connected to Aurigraph tokenization stream');
            loadInitialData();
        };

        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'tokenized_trade') {
                addTradeToList(message.data);
                updateStats();
            }
        };

        function loadInitialData() {
            fetch('/api/tokenized-trades')
                .then(response => response.json())
                .then(data => {
                    data.trades.forEach(trade => addTradeToList(trade));
                    document.getElementById('blockHeight').textContent = data.aurigraphBlockHeight.toLocaleString();
                    updateStats();
                });
        }

        function addTradeToList(tokenizedTrade) {
            const tradesList = document.getElementById('tradesList');
            const trade = tokenizedTrade.tradeData;
            
            const tradeItem = document.createElement('div');
            tradeItem.className = 'trade-item pulse';
            tradeItem.innerHTML = \`
                <div class="trade-header">
                    <span>\${trade.symbol} • \${trade.side.toUpperCase()} \${trade.qty} @ $\${trade.price}</span>
                    <span>$\${(trade.qty * trade.price).toLocaleString()}</span>
                </div>
                <div class="trade-details">
                    Token: \${tokenizedTrade.tokenMetadata.assetToken} • Block: \${tokenizedTrade.tokenMetadata.aurigraphBlock.toLocaleString()} • 
                    <span class="status-indicator status-\${tokenizedTrade.crossChainStatus.ethereum}"></span>ETH \${tokenizedTrade.crossChainStatus.ethereum}
                    <span class="status-indicator status-\${tokenizedTrade.crossChainStatus.polygon}"></span>POLY \${tokenizedTrade.crossChainStatus.polygon}
                    <span class="status-indicator status-\${tokenizedTrade.crossChainStatus.bsc}"></span>BSC \${tokenizedTrade.crossChainStatus.bsc}
                </div>
            \`;
            
            tradesList.insertBefore(tradeItem, tradesList.firstChild);
            
            // Remove old trades (keep last 10)
            while (tradesList.children.length > 10) {
                tradesList.removeChild(tradesList.lastChild);
            }
            
            // Update counters
            tradeCount++;
            dailyVolume += trade.qty * trade.price;
            if (tokenizedTrade.crossChainStatus.ethereum === 'confirmed' || 
                tokenizedTrade.crossChainStatus.polygon === 'confirmed' || 
                tokenizedTrade.crossChainStatus.bsc === 'confirmed') {
                crossChainCount++;
            }
        }

        function updateStats() {
            document.getElementById('totalTrades').textContent = tradeCount.toLocaleString();
            document.getElementById('dailyVolume').textContent = '$' + dailyVolume.toLocaleString();
            document.getElementById('crossChainTx').textContent = crossChainCount.toLocaleString();
        }

        function generateMockTrade() {
            const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'AMZN', 'META'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            const qty = Math.floor(Math.random() * 1000) + 1;
            const price = 50 + Math.random() * 500;
            
            const mockTrade = {
                id: 'trade_' + Math.random().toString(36).substr(2, 9),
                symbol: symbol,
                side: side,
                qty: qty,
                price: Math.round(price * 100) / 100,
                timestamp: new Date().toISOString(),
                orderId: 'order_' + Math.random().toString(36).substr(2, 9)
            };

            fetch('/api/tokenize-trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockTrade)
            })
            .then(response => response.json())
            .then(data => {
                console.log('✅ Trade tokenized:', data.transactionId);
            })
            .catch(error => console.error('❌ Tokenization failed:', error));
        }

        // Auto-generate demo trades every 10 seconds
        setInterval(() => {
            if (Math.random() > 0.3) { // 70% chance
                generateMockTrade();
            }
        }, 10000);
    </script>
</body>
</html>
        `;
    }

    private startWebSocketServer(): void {
        this.wss = new WebSocket.Server({ port: 3080 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection established');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    if (data.type === 'ping') {
                        ws.send(JSON.stringify({ type: 'pong' }));
                    }
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
        
        console.log('🌐 WebSocket server started on port 3080');
    }

    private startMockTradeGeneration(): void {
        // Generate mock trades periodically for demo
        setInterval(async () => {
            if (Math.random() > 0.4) { // 60% chance every interval
                const mockTrade = this.generateRandomTrade();
                await this.tokenizeTrade(mockTrade);
            }
        }, 15000); // Every 15 seconds
    }

    private generateRandomTrade(): TradeTransaction {
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'AMZN', 'META', 'NFLX', 'CRM'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        const qty = Math.floor(Math.random() * 1000) + 1;
        const basePrice = { 
            'AAPL': 175, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250, 'NVDA': 450,
            'AMD': 140, 'AMZN': 145, 'META': 320, 'NFLX': 450, 'CRM': 240
        }[symbol] || 100;
        const price = basePrice + (Math.random() - 0.5) * 20; // ±$10 variation

        return {
            id: `trade_${crypto.randomBytes(8).toString('hex')}`,
            symbol,
            side,
            qty,
            price: Math.round(price * 100) / 100,
            timestamp: new Date(),
            orderId: `order_${crypto.randomBytes(6).toString('hex')}`,
            commission: Math.round(qty * price * 0.001 * 100) / 100
        };
    }

    public async start(port: number = 3030): Promise<void> {
        this.server = this.app.listen(port, () => {
            console.log(`\n🚀 Alpaca Tokenization Demo Server Started`);
            console.log(`📊 Dashboard: http://localhost:${port}`);
            console.log(`🔗 API Endpoint: http://localhost:${port}/api`);
            console.log(`⚛️  Aurigraph Integration: ACTIVE`);
            console.log(`🔐 Quantum Security: CRYSTALS-Dilithium Level 5`);
            console.log(`🌐 Cross-Chain Bridges: Ethereum, Polygon, BSC`);
        });

        this.startWebSocketServer();
        this.startMockTradeGeneration();

        // Generate some initial demo trades
        setTimeout(async () => {
            console.log('🎬 Generating initial demo trades...');
            for (let i = 0; i < 5; i++) {
                const mockTrade = this.generateRandomTrade();
                await this.tokenizeTrade(mockTrade);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
            console.log('✅ Initial demo trades generated');
        }, 2000);
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
            console.log('🛑 Alpaca Tokenization Demo stopped');
        }
        if (this.wss) {
            this.wss.close();
            console.log('🛑 WebSocket server stopped');
        }
    }
}

// Main execution
async function main() {
    const demo = new AlpacaTokenizationDemo();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Alpaca Tokenization Demo...');
        demo.stop();
        process.exit(0);
    });

    // Start the demo
    await demo.start(3030);
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { AlpacaTokenizationDemo, TradeTransaction, TokenizedTrade };