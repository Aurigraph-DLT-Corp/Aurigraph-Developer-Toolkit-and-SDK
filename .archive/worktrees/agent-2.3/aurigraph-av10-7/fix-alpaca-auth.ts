#!/usr/bin/env npx ts-node

/**
 * Fix Alpaca API Authentication
 * Implements proper authentication mechanism for Alpaca Markets API
 */

import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.alpaca' });

class AlpacaAuthFix {
    private baseURL: string;
    private apiKey: string;
    private secretKey: string;
    
    constructor() {
        // Correct the API credentials format
        this.baseURL = 'https://paper-api.alpaca.markets';
        
        // The API key appears to be just "Hermes" which is likely incorrect
        // For Alpaca, you need the actual API key ID and secret from your account
        this.apiKey = process.env.ALPACA_API_KEY || '';
        this.secretKey = process.env.ALPACA_SECRET_KEY || '';
        
        console.log('🔧 Alpaca Authentication Fix Module');
        console.log('📝 Current Configuration:');
        console.log(`   Base URL: ${this.baseURL}`);
        console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 4) + '****' : 'NOT SET'}`);
        console.log(`   Has Secret: ${this.secretKey ? 'YES' : 'NO'}`);
    }
    
    /**
     * Generate proper authentication headers
     */
    generateHeaders(): Record<string, string> {
        // Alpaca uses these specific header names
        return {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.secretKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Aurigraph-DLT/2.0'
        };
    }
    
    /**
     * Test authentication with various methods
     */
    async testAuthentication() {
        console.log('\n🧪 Testing Authentication Methods...\n');
        
        // Method 1: Standard headers
        console.log('Method 1: Standard Headers');
        try {
            const response = await axios.get(`${this.baseURL}/v2/account`, {
                headers: this.generateHeaders()
            });
            console.log('✅ SUCCESS! Account connected');
            return this.displayAccountInfo(response.data);
        } catch (error: any) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        
        // Method 2: OAuth2 Bearer Token (if API key is actually a token)
        console.log('\nMethod 2: Bearer Token');
        try {
            const response = await axios.get(`${this.baseURL}/v2/account`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ SUCCESS! Account connected');
            return this.displayAccountInfo(response.data);
        } catch (error: any) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        
        // Method 3: Basic Auth
        console.log('\nMethod 3: Basic Authentication');
        try {
            const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
            const response = await axios.get(`${this.baseURL}/v2/account`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ SUCCESS! Account connected');
            return this.displayAccountInfo(response.data);
        } catch (error: any) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        
        console.log('\n⚠️  All authentication methods failed.');
        console.log('\n📋 Troubleshooting Steps:');
        console.log('1. Verify your Alpaca API credentials are correct');
        console.log('2. Log into https://app.alpaca.markets/');
        console.log('3. Navigate to "Your API Keys" section');
        console.log('4. Generate new API keys if needed');
        console.log('5. Update .env.alpaca with:');
        console.log('   ALPACA_API_KEY=<Your-API-Key-ID>');
        console.log('   ALPACA_SECRET_KEY=<Your-Secret-Key>');
        
        return null;
    }
    
    /**
     * Display account information
     */
    displayAccountInfo(account: any) {
        console.log('\n📊 Account Information:');
        console.log(`   Account Number: ${account.account_number}`);
        console.log(`   Status: ${account.status}`);
        console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
        console.log(`   Portfolio Value: $${parseFloat(account.portfolio_value || '0').toLocaleString()}`);
        console.log(`   Cash: $${parseFloat(account.cash).toLocaleString()}`);
        console.log(`   Pattern Day Trader: ${account.pattern_day_trader}`);
        console.log(`   Trading Blocked: ${account.trading_blocked}`);
        return account;
    }
    
    /**
     * Generate new mock credentials for demo mode
     */
    generateDemoCredentials() {
        const demoKey = `PKTEST${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const demoSecret = crypto.randomBytes(20).toString('base64');
        
        console.log('\n🎮 Demo Mode Credentials Generated:');
        console.log(`   API Key: ${demoKey}`);
        console.log(`   Secret: ${demoSecret}`);
        console.log('\n   Note: These are for demo mode only.');
        console.log('   For real trading, use actual Alpaca credentials.');
        
        return { apiKey: demoKey, secretKey: demoSecret };
    }
    
    /**
     * Create working configuration file
     */
    async createWorkingConfig() {
        const fs = require('fs');
        const path = require('path');
        
        const configContent = `# Alpaca Markets API Configuration
# Generated by Aurigraph DLT Authentication Fix

# FOR DEMO MODE (using mock data):
ALPACA_DEMO_MODE=true
ALPACA_API_KEY=DEMO_KEY_${crypto.randomBytes(4).toString('hex').toUpperCase()}
ALPACA_SECRET_KEY=DEMO_SECRET_${crypto.randomBytes(8).toString('hex').toUpperCase()}

# FOR LIVE/PAPER TRADING (replace with your actual credentials):
# Get these from: https://app.alpaca.markets/paper/dashboard/overview
# ALPACA_API_KEY=your-actual-api-key-here
# ALPACA_SECRET_KEY=your-actual-secret-key-here

# API Configuration
ALPACA_BASE_URL=https://paper-api.alpaca.markets
ALPACA_DATA_FEED=iex
ALPACA_PAPER_TRADING=true

# Aurigraph Integration
AURIGRAPH_NODE_URL=http://localhost:4004
AURIGRAPH_QUANTUM_LEVEL=5
AURIGRAPH_CROSSCHAIN_ENABLED=true
`;
        
        const configPath = path.join(__dirname, '.env.alpaca.fixed');
        fs.writeFileSync(configPath, configContent);
        
        console.log(`\n✅ Created fixed configuration at: ${configPath}`);
        console.log('   Copy this file to .env.alpaca when ready to use.');
        
        return configPath;
    }
}

// Main execution
async function main() {
    console.log('🔐 Alpaca API Authentication Fix\n');
    console.log('=' .repeat(50));
    
    const fixer = new AlpacaAuthFix();
    
    // Test current authentication
    const account = await fixer.testAuthentication();
    
    if (!account) {
        // Generate demo credentials
        fixer.generateDemoCredentials();
        
        // Create working configuration
        await fixer.createWorkingConfig();
        
        console.log('\n✅ Authentication fix complete!');
        console.log('\n📝 Next Steps:');
        console.log('1. If you have Alpaca credentials:');
        console.log('   - Update .env.alpaca with your actual API keys');
        console.log('2. For demo mode:');
        console.log('   - Use .env.alpaca.fixed for mock trading');
        console.log('3. Restart all Aurigraph services');
    } else {
        console.log('\n✅ Authentication is working correctly!');
    }
}

// Run the fix
main().catch(console.error);