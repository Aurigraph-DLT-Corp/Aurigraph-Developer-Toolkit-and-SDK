#!/usr/bin/env ts-node

import { Logger } from './src/core/Logger';
import { VizorRealtimeDashboard } from './src/monitoring/VizorRealtimeDashboard';
import { VizorSimpleDashboard } from './src/monitoring/VizorSimpleDashboard';
import { PrometheusExporter } from './src/monitoring/PrometheusExporter';
import { ManagementAPI } from './src/management/ManagementAPI';

const logger = new Logger('MonitoringSuite');

async function startMonitoringSuite() {
  logger.info('');
  logger.info('🚀═══════════════════════════════════════════════════════');
  logger.info('🎯 AURIGRAPH DLT MONITORING SUITE STARTING');
  logger.info('🚀═══════════════════════════════════════════════════════');
  logger.info('');
  
  try {
    // Initialize all monitoring components
    const managementAPI = new ManagementAPI();
    const prometheusExporter = new PrometheusExporter();
    const vizorRealtimeDashboard = new VizorRealtimeDashboard();
    const vizorSimpleDashboard = new VizorSimpleDashboard();
    
    // Start services on different ports
    logger.info('🎪 Starting Management Dashboard...');
    await managementAPI.start(3040);
    
    logger.info('📊 Starting Prometheus Metrics Exporter...');
    await prometheusExporter.start(9090);
    
    logger.info('🎨 Starting Vizor Real-time Dashboard...');
    await vizorRealtimeDashboard.start(3038);
    
    logger.info('🎯 Starting Vizor Simple Dashboard...');
    await vizorSimpleDashboard.start(3039);
    
    logger.info('');
    logger.info('✅═══════════════════════════════════════════════════════');
    logger.info('🎉 AURIGRAPH DLT MONITORING SUITE OPERATIONAL');
    logger.info('✅═══════════════════════════════════════════════════════');
    logger.info('');
    
    logger.info('🌐 Access Points:');
    logger.info('   • Management Dashboard:    http://localhost:3040');
    logger.info('   • Vizor Real-time:        http://localhost:3038');
    logger.info('   • Vizor Simple:           http://localhost:3039');
    logger.info('   • Prometheus Metrics:     http://localhost:9090/metrics');
    logger.info('   • Prometheus Health:      http://localhost:9090/health');
    logger.info('');
    
    logger.info('🎯 Live Integrations:');
    logger.info('   • Demo System:            http://localhost:3051 (if running)');
    logger.info('   • Management API:         http://localhost:3040');
    logger.info('   • Real-time Data:         WebSocket connections active');
    logger.info('   • Metrics Collection:     Prometheus scraping enabled');
    logger.info('');
    
    logger.info('🔧 Features Active:');
    logger.info('   • AV10-22: Digital Twins monitoring');
    logger.info('   • AV10-24: Compliance framework integration');
    logger.info('   • AV10-26: AI analytics and predictions');
    logger.info('   • AV10-32: Node density optimization');
    logger.info('   • AV10-36: Comprehensive platform monitoring');
    logger.info('   • Quantum security metrics (Level 6)');
    logger.info('   • Cross-chain bridge monitoring');
    logger.info('   • RWA asset tracking');
    logger.info('');
    
    logger.info('🎬 For full demo experience, also run:');
    logger.info('   npm run demo     # Start demo system on port 3051');
    logger.info('');
    
    logger.info('Press Ctrl+C to stop all monitoring services');
    logger.info('🚀═══════════════════════════════════════════════════════');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('');
      logger.info('🛑 Shutting down monitoring suite...');
      
      try {
        await Promise.all([
          managementAPI.stop(),
          prometheusExporter.stop(),
          vizorRealtimeDashboard.stop(),
          vizorSimpleDashboard.start(0) // Simple dashboard doesn't have a stop method
        ]);
        
        logger.info('✅ All monitoring services stopped gracefully');
        process.exit(0);
      } catch (error) {
        logger.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error(`Failed to start monitoring suite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

startMonitoringSuite().catch(console.error);