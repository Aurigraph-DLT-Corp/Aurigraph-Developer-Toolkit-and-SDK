#!/usr/bin/env npx ts-node

/**
 * Test Alpaca API Authentication
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.alpaca' });

async function testAlpacaConnection() {
    console.log('🔧 Testing Alpaca API Connection...');
    console.log('API Key:', process.env.ALPACA_API_KEY);
    console.log('Base URL:', process.env.ALPACA_BASE_URL);
    
    const configs = [
        {
            name: 'Config 1: Standard Headers',
            baseURL: 'https://paper-api.alpaca.markets',
            headers: {
                'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
            }
        },
        {
            name: 'Config 2: With /v2 in URL',
            baseURL: 'https://paper-api.alpaca.markets/v2',
            headers: {
                'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
            }
        },
        {
            name: 'Config 3: Alternative Auth',
            baseURL: 'https://paper-api.alpaca.markets',
            headers: {
                'Authorization': `Bearer ${process.env.ALPACA_API_KEY}:${process.env.ALPACA_SECRET_KEY}`
            }
        }
    ];

    for (const config of configs) {
        console.log(`\n📝 Testing ${config.name}...`);
        try {
            const response = await axios.get(`${config.baseURL}/v2/account`, {
                headers: config.headers
            });
            
            console.log('✅ SUCCESS! Account connected:');
            console.log('Account Number:', response.data.account_number);
            console.log('Status:', response.data.status);
            console.log('Buying Power:', response.data.buying_power);
            console.log('Portfolio Value:', response.data.portfolio_value);
            
            return response.data;
        } catch (error: any) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.response?.statusText || error.message}`);
            if (error.response?.data) {
                console.log('Error details:', error.response.data);
            }
        }
    }
    
    console.log('\n🔄 Trying mock data fallback...');
    return {
        account_number: 'DEMO_HERMES',
        status: 'ACTIVE',
        buying_power: '100000.00',
        portfolio_value: '100000.00'
    };
}

async function main() {
    const account = await testAlpacaConnection();
    console.log('\n📊 Final Result:', account);
}

main().catch(console.error);