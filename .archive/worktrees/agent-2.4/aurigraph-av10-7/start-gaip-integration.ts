#!/usr/bin/env ts-node
/**
 * Start GAIP Integration Server
 * 
 * Launches the GAIP-Aurigraph integration server for capturing and recording
 * AI analysis datapoints on the blockchain.
 */

import { GAIPIntegrationServer } from './src/integration/GAIPIntegrationServer';
import { Logger } from './src/core/Logger';

const logger = new Logger('GAIPLauncher');

async function startGAIPIntegration() {
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('     GAIP-Aurigraph DLT Integration Server v1.0.0');
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('🔗 Bridging AI Intelligence with Blockchain Immutability');
    logger.info('');

    try {
        // Configure server
        const config = {
            port: parseInt(process.env.GAIP_PORT || '3005'),
            gaipEndpoint: process.env.GAIP_ENDPOINT || 'http://localhost:3000',
            gaipApiKey: process.env.GAIP_API_KEY || 'demo-api-key',
            aurigraphNodeUrl: process.env.AURIGRAPH_NODE || 'http://localhost:8181',
            aurigraphChainId: process.env.AURIGRAPH_CHAIN || 'aurigraph-av10',
            corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
            enableWebSocket: process.env.ENABLE_WS !== 'false',
            enableMetrics: process.env.ENABLE_METRICS !== 'false'
        };

        // Create and start server
        const server = new GAIPIntegrationServer(config);
        await server.start();

        logger.info('');
        logger.info('📊 Service Endpoints:');
        logger.info(`   • REST API:     http://localhost:${config.port}/api/v1/gaip`);
        logger.info(`   • WebSocket:    ws://localhost:${config.port}/api/v1/gaip/stream`);
        logger.info(`   • Health:       http://localhost:${config.port}/health`);
        logger.info(`   • Metrics:      http://localhost:${config.port}/metrics`);
        logger.info(`   • Docs:         http://localhost:${config.port}/api/v1/docs`);
        logger.info('');
        logger.info('🔐 Authentication:');
        logger.info('   • Header:       x-gaip-api-key');
        logger.info('   • Agent ID:     x-gaip-agent-id');
        logger.info('');
        logger.info('⚡ Features Enabled:');
        logger.info(`   • Real-time Streaming:    ${config.enableWebSocket ? '✅' : '❌'}`);
        logger.info(`   • Prometheus Metrics:     ${config.enableMetrics ? '✅' : '❌'}`);
        logger.info(`   • Quantum Encryption:     ✅`);
        logger.info(`   • Zero-Knowledge Proofs:  ✅`);
        logger.info(`   • Cross-Chain Verify:     ✅`);
        logger.info('');
        logger.info('📡 Integration Status:');
        logger.info(`   • GAIP Endpoint:    ${config.gaipEndpoint}`);
        logger.info(`   • Aurigraph Node:   ${config.aurigraphNodeUrl}`);
        logger.info(`   • Chain ID:         ${config.aurigraphChainId}`);
        logger.info('');
        logger.info('═══════════════════════════════════════════════════════════════');
        logger.info('✨ GAIP Integration Server is ready to capture AI analyses!');
        logger.info('═══════════════════════════════════════════════════════════════');

        // Show example usage
        setTimeout(() => {
            logger.info('');
            logger.info('📝 Example Usage:');
            logger.info('');
            logger.info('1. Start an analysis:');
            logger.info('   curl -X POST http://localhost:3005/api/v1/gaip/analysis/start \\');
            logger.info('     -H "x-gaip-api-key: your-api-key" \\');
            logger.info('     -H "Content-Type: application/json" \\');
            logger.info('     -d \'{"name": "Test Analysis", "description": "Demo"}\'');
            logger.info('');
            logger.info('2. Capture a datapoint:');
            logger.info('   curl -X POST http://localhost:3005/api/v1/gaip/datapoint \\');
            logger.info('     -H "x-gaip-api-key: your-api-key" \\');
            logger.info('     -H "x-gaip-agent-id: agent-001" \\');
            logger.info('     -d \'{"analysisId": "...", "value": {...}}\'');
            logger.info('');
            logger.info('3. Complete analysis:');
            logger.info('   curl -X POST http://localhost:3005/api/v1/gaip/analysis/{id}/complete \\');
            logger.info('     -H "x-gaip-api-key: your-api-key" \\');
            logger.info('     -d \'{"results": {...}}\'');
            logger.info('');
            logger.info('💡 To run the example analysis:');
            logger.info('   npx ts-node src/integration/examples/GAIPAnalysisExample.ts');
            logger.info('');
        }, 2000);

        // Handle shutdown
        process.on('SIGINT', async () => {
            logger.info('\n🛑 Shutting down GAIP Integration Server...');
            await server.stop();
            logger.info('✅ Server stopped gracefully');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('\n🛑 Received SIGTERM, shutting down...');
            await server.stop();
            process.exit(0);
        });

    } catch (error) {
        logger.error(`Failed to start GAIP Integration Server: ${error}`);
        process.exit(1);
    }
}

// Start the server
startGAIPIntegration().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});