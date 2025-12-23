#!/usr/bin/env ts-node

import { Logger } from './src/core/Logger';
import { VizorRealtimeDashboard } from './src/monitoring/VizorRealtimeDashboard';

const logger = new Logger('SimpleMonitoring');

async function startSimpleMonitoring() {
  logger.info('');
  logger.info('🚀═══════════════════════════════════════════════════════');
  logger.info('🎯 AURIGRAPH VIZOR MONITORING DASHBOARD');
  logger.info('🚀═══════════════════════════════════════════════════════');
  logger.info('');
  
  try {
    const vizorRealtimeDashboard = new VizorRealtimeDashboard();
    
    logger.info('🎨 Starting Vizor Real-time Dashboard...');
    await vizorRealtimeDashboard.start(3038);
    
    logger.info('');
    logger.info('✅═══════════════════════════════════════════════════════');
    logger.info('🎉 VIZOR DASHBOARD OPERATIONAL');
    logger.info('✅═══════════════════════════════════════════════════════');
    logger.info('');
    
    logger.info('🌐 Access Point:');
    logger.info('   • Vizor Real-time Dashboard: http://localhost:3038');
    logger.info('');
    
    logger.info('🎯 Live Integration:');
    logger.info('   • Connecting to Demo System:  localhost:3051');
    logger.info('   • Connecting to Management:   localhost:3040');
    logger.info('   • Real-time metrics:          Active');
    logger.info('   • WebSocket updates:          Enabled');
    logger.info('');
    
    logger.info('🔧 AV11 Platform Features:');
    logger.info('   • AV11-22: Digital Twins monitoring');
    logger.info('   • AV11-24: Compliance framework integration');
    logger.info('   • AV11-26: AI analytics and predictions');
    logger.info('   • AV11-32: Node density optimization');
    logger.info('   • Quantum security metrics (Level 6)');
    logger.info('   • Cross-chain bridge monitoring');
    logger.info('   • RWA asset tracking');
    logger.info('');
    
    logger.info('📝 Note: Dashboard connects to demo system if available on port 3051');
    logger.info('🚀═══════════════════════════════════════════════════════');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('');
      logger.info('🛑 Shutting down Vizor dashboard...');
      
      try {
        await vizorRealtimeDashboard.stop();
        logger.info('✅ Vizor dashboard stopped gracefully');
        process.exit(0);
      } catch (error) {
        logger.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error(`Failed to start Vizor dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

startSimpleMonitoring().catch(console.error);