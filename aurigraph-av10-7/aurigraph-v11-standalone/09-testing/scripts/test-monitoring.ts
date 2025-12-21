import { PrometheusExporter } from './src/monitoring/PrometheusExporter';

async function testMonitoring() {
  console.log('🧪 Testing Prometheus Monitoring Integration...\n');
  
  const exporter = new PrometheusExporter();
  
  // Start the metrics server
  await exporter.start(9090);
  
  // Simulate platform metrics
  console.log('📊 Simulating platform metrics...');
  
  // Update various metrics
  exporter.updateTPS(1054327);
  exporter.updateBlockHeight(125439);
  exporter.updateActiveNodes('VALIDATOR', 3);
  exporter.updateActiveNodes('FULL', 12);
  exporter.updateActiveNodes('LIGHT', 45);
  exporter.updateQuantumSecurityLevel(6);
  exporter.updateNTRUEncryptions(850);
  
  // Record some transactions
  for (let i = 0; i < 100; i++) {
    exporter.incrementTransactions('standard', 'success');
    exporter.recordTransactionLatency(Math.random() * 500 + 100);
  }
  
  // Smart contract metrics
  exporter.incrementContractsCreated('ricardian', 'template-1');
  exporter.updateContractVerification('contract-001', 95);
  exporter.updateGovernanceProposals('active', 3);
  exporter.updateGovernanceProposals('passed', 12);
  
  // RWA metrics
  exporter.updateTokenizedAssets('real-estate', 'US', 45);
  exporter.updateTokenizedAssets('carbon-credits', 'EU', 120);
  exporter.updateComplianceScore('US', 'real-estate', 98);
  
  // Cross-chain metrics
  exporter.updateSupportedChains(50);
  exporter.incrementBridgeTransactions('ethereum', 'solana');
  exporter.updateBridgeVolume('ethereum', 1250000);
  
  // AI metrics
  exporter.incrementAIOptimizations('consensus');
  exporter.updateAIPerformanceGain('tps', 15.5);
  exporter.updateAIPredictionsAccuracy('latency', 92);
  
  console.log('\n✅ Metrics updated successfully!');
  console.log('\n📈 Metrics available at: http://localhost:9090/metrics');
  console.log('📊 Health check at: http://localhost:9090/health\n');
  
  // Keep the server running
  console.log('Press Ctrl+C to stop the monitoring server...');
}

testMonitoring().catch(console.error);