/**
 * Token Registry Service
 * Manages tokens created by smart contracts, including metadata, balances, and transfers
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../core/logger');

class TokenRegistry extends EventEmitter {
    constructor(dltIntegration, contractRegistry) {
        super();
        this.dltIntegration = dltIntegration;
        this.contractRegistry = contractRegistry;
        this.tokens = new Map();
        this.holders = new Map();
        this.transactions = new Map();
        this.tokenMetadata = new Map();
        this.registryPath = path.join(__dirname, 'token-registry');
        
        // Token standards
        this.TOKEN_STANDARDS = {
            ERC20: 'erc20',
            ERC721: 'erc721',
            ERC1155: 'erc1155',
            EQUITY: 'equity',
            UTILITY: 'utility',
            GOVERNANCE: 'governance',
            STABLECOIN: 'stablecoin',
            SYNTHETIC: 'synthetic'
        };
        
        // Token states
        this.TOKEN_STATES = {
            CREATED: 'created',
            ACTIVE: 'active',
            PAUSED: 'paused',
            FROZEN: 'frozen',
            BURNED: 'burned',
            MIGRATED: 'migrated'
        };
    }

    async initialize() {
        try {
            logger.info('🪙 Initializing Token Registry...');
            
            // Create directory structure
            await this.createDirectoryStructure();
            
            // Load existing tokens
            await this.loadTokens();
            
            // Load token holders
            await this.loadTokenHolders();
            
            // Load transaction history
            await this.loadTransactionHistory();
            
            // Subscribe to contract events
            this.subscribeToContractEvents();
            
            this.emit('token-registry-initialized');
            logger.info('✅ Token Registry initialized successfully', {
                tokensLoaded: this.tokens.size,
                holdersLoaded: this.holders.size
            });
            
            return {
                success: true,
                tokensLoaded: this.tokens.size,
                holdersLoaded: this.holders.size,
                supportedStandards: Object.keys(this.TOKEN_STANDARDS)
            };
        } catch (error) {
            logger.error('❌ Failed to initialize Token Registry', { error: error.message });
            throw error;
        }
    }

    async createDirectoryStructure() {
        const directories = [
            this.registryPath,
            path.join(this.registryPath, 'tokens'),
            path.join(this.registryPath, 'holders'),
            path.join(this.registryPath, 'transactions'),
            path.join(this.registryPath, 'metadata')
        ];
        
        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                logger.info(`📁 Created token registry directory: ${dir}`);
            }
        }
    }

    async registerToken(tokenData) {
        try {
            const {
                contractAddress,
                name,
                symbol,
                standard,
                decimals = 18,
                totalSupply,
                description,
                website,
                logo,
                metadata = {},
                creator,
                createdBlock,
                tags = []
            } = tokenData;

            // Validate token data
            this.validateTokenData(tokenData);

            const tokenId = this.generateTokenId(contractAddress, symbol);
            const token = {
                id: tokenId,
                contractAddress: contractAddress.toLowerCase(),
                name,
                symbol: symbol.toUpperCase(),
                standard,
                decimals,
                totalSupply: totalSupply.toString(),
                description,
                website,
                logo,
                metadata,
                creator,
                createdBlock,
                tags,
                state: this.TOKEN_STATES.CREATED,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                holders: 0,
                transactions: 0,
                marketData: {
                    price: null,
                    priceChange24h: null,
                    volume24h: null,
                    marketCap: null,
                    liquidity: null
                },
                compliance: {
                    kycRequired: false,
                    amlCompliant: false,
                    jurisdictionRestrictions: [],
                    regulatoryApprovals: []
                }
            };

            // Store token
            this.tokens.set(tokenId, token);
            
            // Initialize holder tracking
            this.holders.set(tokenId, new Map());
            
            // Save to file system
            await this.saveToken(token);
            
            this.emit('token-registered', token);
            logger.info(`🪙 Token registered: ${name} (${symbol})`, { tokenId, contractAddress });

            return token;
        } catch (error) {
            logger.error('❌ Failed to register token', { error: error.message });
            throw error;
        }
    }

    async updateTokenHolder(tokenId, holderAddress, balance, operation = 'update') {
        try {
            const token = this.tokens.get(tokenId);
            if (!token) {
                throw new Error(`Token not found: ${tokenId}`);
            }

            const tokenHolders = this.holders.get(tokenId);
            const previousBalance = tokenHolders.get(holderAddress) || '0';
            
            if (operation === 'update') {
                tokenHolders.set(holderAddress, balance.toString());
            } else if (operation === 'add') {
                const newBalance = BigInt(previousBalance) + BigInt(balance);
                tokenHolders.set(holderAddress, newBalance.toString());
            } else if (operation === 'subtract') {
                const newBalance = BigInt(previousBalance) - BigInt(balance);
                if (newBalance < 0n) {
                    throw new Error('Insufficient balance for subtraction');
                }
                tokenHolders.set(holderAddress, newBalance.toString());
            }

            // Update holder count
            const nonZeroHolders = Array.from(tokenHolders.values()).filter(balance => BigInt(balance) > 0n);
            token.holders = nonZeroHolders.length;
            token.updatedAt = new Date().toISOString();

            // Save updated data
            await this.saveToken(token);
            await this.saveTokenHolders(tokenId);

            this.emit('holder-updated', { tokenId, holderAddress, balance, previousBalance });
            
            return {
                tokenId,
                holderAddress,
                newBalance: tokenHolders.get(holderAddress),
                previousBalance,
                totalHolders: token.holders
            };
        } catch (error) {
            logger.error('❌ Failed to update token holder', { error: error.message });
            throw error;
        }
    }

    async recordTransaction(transactionData) {
        try {
            const {
                tokenId,
                transactionHash,
                blockNumber,
                from,
                to,
                amount,
                type = 'transfer',
                timestamp,
                gasUsed,
                gasPrice,
                metadata = {}
            } = transactionData;

            const txId = `${tokenId}-${transactionHash}`;
            const transaction = {
                id: txId,
                tokenId,
                transactionHash,
                blockNumber,
                from: from?.toLowerCase(),
                to: to?.toLowerCase(),
                amount: amount.toString(),
                type,
                timestamp: timestamp || new Date().toISOString(),
                gasUsed,
                gasPrice,
                metadata,
                confirmed: true
            };

            // Store transaction
            if (!this.transactions.has(tokenId)) {
                this.transactions.set(tokenId, new Map());
            }
            this.transactions.get(tokenId).set(txId, transaction);

            // Update token transaction count
            const token = this.tokens.get(tokenId);
            if (token) {
                token.transactions += 1;
                token.updatedAt = new Date().toISOString();
                await this.saveToken(token);
            }

            // Update holder balances based on transaction
            if (type === 'transfer' && from && to) {
                if (from !== '0x0000000000000000000000000000000000000000') {
                    await this.updateTokenHolder(tokenId, from, amount, 'subtract');
                }
                if (to !== '0x0000000000000000000000000000000000000000') {
                    await this.updateTokenHolder(tokenId, to, amount, 'add');
                }
            } else if (type === 'mint' && to) {
                await this.updateTokenHolder(tokenId, to, amount, 'add');
            } else if (type === 'burn' && from) {
                await this.updateTokenHolder(tokenId, from, amount, 'subtract');
            }

            // Save transaction
            await this.saveTransaction(transaction);

            this.emit('transaction-recorded', transaction);
            logger.debug(`📝 Transaction recorded: ${transactionHash}`, { tokenId, type, amount });

            return transaction;
        } catch (error) {
            logger.error('❌ Failed to record transaction', { error: error.message });
            throw error;
        }
    }

    async getTokenInfo(tokenId) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error(`Token not found: ${tokenId}`);
        }

        const holders = this.holders.get(tokenId) || new Map();
        const transactions = this.transactions.get(tokenId) || new Map();

        return {
            ...token,
            holdersList: Array.from(holders.entries()).map(([address, balance]) => ({
                address,
                balance,
                percentage: this.calculateHolderPercentage(balance, token.totalSupply)
            })),
            recentTransactions: Array.from(transactions.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)
        };
    }

    async getTokensByContract(contractAddress) {
        return Array.from(this.tokens.values())
            .filter(token => token.contractAddress === contractAddress.toLowerCase());
    }

    async getTokensByStandard(standard) {
        return Array.from(this.tokens.values())
            .filter(token => token.standard === standard);
    }

    async getHolderTokens(holderAddress) {
        const result = [];
        const lowerHolderAddress = holderAddress.toLowerCase();

        for (const [tokenId, holders] of this.holders.entries()) {
            const balance = holders.get(lowerHolderAddress);
            if (balance && BigInt(balance) > 0n) {
                const token = this.tokens.get(tokenId);
                if (token) {
                    result.push({
                        ...token,
                        balance,
                        percentage: this.calculateHolderPercentage(balance, token.totalSupply)
                    });
                }
            }
        }

        return result;
    }

    async getTokenStatistics() {
        const tokens = Array.from(this.tokens.values());
        const totalTransactions = Array.from(this.transactions.values())
            .reduce((sum, txMap) => sum + txMap.size, 0);

        return {
            total: tokens.length,
            byStandard: this.groupBy(tokens, 'standard'),
            byState: this.groupBy(tokens, 'state'),
            totalHolders: tokens.reduce((sum, token) => sum + token.holders, 0),
            totalTransactions,
            topTokensByHolders: tokens
                .sort((a, b) => b.holders - a.holders)
                .slice(0, 10)
                .map(token => ({
                    name: token.name,
                    symbol: token.symbol,
                    holders: token.holders,
                    transactions: token.transactions
                })),
            marketOverview: {
                totalMarketCap: tokens.reduce((sum, token) => {
                    return sum + (token.marketData.marketCap || 0);
                }, 0),
                averagePrice: this.calculateAveragePrice(tokens),
                totalVolume24h: tokens.reduce((sum, token) => {
                    return sum + (token.marketData.volume24h || 0);
                }, 0)
            }
        };
    }

    async updateTokenMetadata(tokenId, metadata) {
        try {
            const token = this.tokens.get(tokenId);
            if (!token) {
                throw new Error(`Token not found: ${tokenId}`);
            }

            token.metadata = { ...token.metadata, ...metadata };
            token.updatedAt = new Date().toISOString();

            await this.saveToken(token);
            
            this.emit('token-metadata-updated', { tokenId, metadata });
            logger.info(`📝 Token metadata updated: ${token.symbol}`, { tokenId });

            return token;
        } catch (error) {
            logger.error('❌ Failed to update token metadata', { error: error.message });
            throw error;
        }
    }

    async updateMarketData(tokenId, marketData) {
        try {
            const token = this.tokens.get(tokenId);
            if (!token) {
                throw new Error(`Token not found: ${tokenId}`);
            }

            token.marketData = { ...token.marketData, ...marketData };
            token.updatedAt = new Date().toISOString();

            await this.saveToken(token);
            
            this.emit('market-data-updated', { tokenId, marketData });
            
            return token;
        } catch (error) {
            logger.error('❌ Failed to update market data', { error: error.message });
            throw error;
        }
    }

    async pauseToken(tokenId, reason = '') {
        return this.updateTokenState(tokenId, this.TOKEN_STATES.PAUSED, { reason });
    }

    async resumeToken(tokenId) {
        return this.updateTokenState(tokenId, this.TOKEN_STATES.ACTIVE);
    }

    async freezeToken(tokenId, reason = '') {
        return this.updateTokenState(tokenId, this.TOKEN_STATES.FROZEN, { reason });
    }

    async updateTokenState(tokenId, newState, metadata = {}) {
        try {
            const token = this.tokens.get(tokenId);
            if (!token) {
                throw new Error(`Token not found: ${tokenId}`);
            }

            const previousState = token.state;
            token.state = newState;
            token.updatedAt = new Date().toISOString();
            token.stateMetadata = metadata;

            await this.saveToken(token);

            this.emit('token-state-changed', { tokenId, previousState, newState });
            logger.info(`🔄 Token state changed: ${token.symbol}`, { tokenId, previousState, newState });

            return token;
        } catch (error) {
            logger.error('❌ Failed to update token state', { error: error.message });
            throw error;
        }
    }

    subscribeToContractEvents() {
        // Subscribe to contract registry events to auto-register tokens
        this.contractRegistry.on('contract-deployed', async (contract) => {
            try {
                // Check if it's a token contract
                if (this.isTokenContract(contract)) {
                    await this.autoRegisterTokenFromContract(contract);
                }
            } catch (error) {
                logger.error('❌ Failed to auto-register token from contract', { error: error.message });
            }
        });
    }

    isTokenContract(contract) {
        const tokenCategories = ['tokenization', 'equity', 'defi'];
        const template = this.contractRegistry.templates.get(contract.templateId);
        return template && tokenCategories.includes(template.category);
    }

    async autoRegisterTokenFromContract(contract) {
        try {
            const template = this.contractRegistry.templates.get(contract.templateId);
            if (!template) return;

            // Extract token information from deployment metadata
            const tokenData = {
                contractAddress: contract.address,
                name: contract.metadata.companyName || contract.name,
                symbol: contract.metadata.companySymbol || contract.name.toUpperCase(),
                standard: this.determineTokenStandard(template),
                decimals: contract.metadata.decimals || 18,
                totalSupply: contract.metadata.totalShares || contract.metadata.totalSupply || '0',
                description: `Auto-registered token from ${template.name} contract`,
                creator: contract.deployer,
                createdBlock: contract.blockNumber,
                tags: ['auto-registered', template.category]
            };

            await this.registerToken(tokenData);
            logger.info(`🤖 Auto-registered token from contract: ${contract.name}`, { 
                contractId: contract.id, 
                tokenSymbol: tokenData.symbol 
            });
        } catch (error) {
            logger.error('❌ Failed to auto-register token', { error: error.message });
        }
    }

    determineTokenStandard(template) {
        const name = template.name.toLowerCase();
        if (name.includes('equity')) return this.TOKEN_STANDARDS.EQUITY;
        if (name.includes('erc721')) return this.TOKEN_STANDARDS.ERC721;
        if (name.includes('erc1155')) return this.TOKEN_STANDARDS.ERC1155;
        if (name.includes('governance')) return this.TOKEN_STANDARDS.GOVERNANCE;
        return this.TOKEN_STANDARDS.ERC20; // Default
    }

    // Helper methods
    validateTokenData(tokenData) {
        const required = ['contractAddress', 'name', 'symbol', 'standard', 'totalSupply'];
        for (const field of required) {
            if (!tokenData[field]) {
                throw new Error(`Token validation failed: ${field} is required`);
            }
        }

        if (!Object.values(this.TOKEN_STANDARDS).includes(tokenData.standard)) {
            throw new Error(`Invalid token standard: ${tokenData.standard}`);
        }
    }

    generateTokenId(contractAddress, symbol) {
        const hash = crypto.createHash('sha256')
            .update(`${contractAddress.toLowerCase()}-${symbol.toUpperCase()}`)
            .digest('hex')
            .substr(0, 16);
        return `token-${hash}`;
    }

    calculateHolderPercentage(balance, totalSupply) {
        if (BigInt(totalSupply) === 0n) return '0.00';
        const percentage = (BigInt(balance) * 10000n) / BigInt(totalSupply);
        return (Number(percentage) / 100).toFixed(2);
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'unknown';
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    calculateAveragePrice(tokens) {
        const pricesWithData = tokens.filter(token => token.marketData.price !== null);
        if (pricesWithData.length === 0) return 0;
        const sum = pricesWithData.reduce((sum, token) => sum + token.marketData.price, 0);
        return sum / pricesWithData.length;
    }

    // File operations
    async saveToken(token) {
        const filePath = path.join(this.registryPath, 'tokens', `${token.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(token, null, 2));
    }

    async saveTokenHolders(tokenId) {
        const holders = this.holders.get(tokenId);
        if (holders) {
            const holdersData = Object.fromEntries(holders);
            const filePath = path.join(this.registryPath, 'holders', `${tokenId}.json`);
            await fs.writeFile(filePath, JSON.stringify(holdersData, null, 2));
        }
    }

    async saveTransaction(transaction) {
        const filePath = path.join(this.registryPath, 'transactions', `${transaction.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(transaction, null, 2));
    }

    async loadTokens() {
        try {
            const tokensDir = path.join(this.registryPath, 'tokens');
            const files = await fs.readdir(tokensDir);
            
            for (const file of files.filter(f => f.endsWith('.json'))) {
                try {
                    const filePath = path.join(tokensDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const token = JSON.parse(content);
                    this.tokens.set(token.id, token);
                } catch (error) {
                    logger.warn(`⚠️ Failed to load token ${file}: ${error.message}`);
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Tokens directory not found: ${error.message}`);
        }
    }

    async loadTokenHolders() {
        try {
            const holdersDir = path.join(this.registryPath, 'holders');
            const files = await fs.readdir(holdersDir);
            
            for (const file of files.filter(f => f.endsWith('.json'))) {
                try {
                    const filePath = path.join(holdersDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const holdersData = JSON.parse(content);
                    const tokenId = file.replace('.json', '');
                    this.holders.set(tokenId, new Map(Object.entries(holdersData)));
                } catch (error) {
                    logger.warn(`⚠️ Failed to load holders ${file}: ${error.message}`);
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Holders directory not found: ${error.message}`);
        }
    }

    async loadTransactionHistory() {
        try {
            const transactionsDir = path.join(this.registryPath, 'transactions');
            const files = await fs.readdir(transactionsDir);
            
            for (const file of files.filter(f => f.endsWith('.json'))) {
                try {
                    const filePath = path.join(transactionsDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const transaction = JSON.parse(content);
                    
                    if (!this.transactions.has(transaction.tokenId)) {
                        this.transactions.set(transaction.tokenId, new Map());
                    }
                    this.transactions.get(transaction.tokenId).set(transaction.id, transaction);
                } catch (error) {
                    logger.warn(`⚠️ Failed to load transaction ${file}: ${error.message}`);
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Transactions directory not found: ${error.message}`);
        }
    }
}

module.exports = TokenRegistry;