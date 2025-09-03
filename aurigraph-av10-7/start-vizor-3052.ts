import { VizorRealtimeDashboard } from './src/monitoring/VizorRealtimeDashboard';

async function startVizorDashboard() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Starting Aurigraph Vizor Real-time Dashboard');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const dashboard = new VizorRealtimeDashboard();
  await dashboard.start(3052);
  
  console.log('');
  console.log('📊 Dashboard Features:');
  console.log('   • Real-time TPS monitoring (1M+ TPS)');
  console.log('   • Live transaction flow visualization');
  console.log('   • Network node topology');
  console.log('   • Blockchain visualization');
  console.log('   • Quantum security metrics');
  console.log('   • Smart contract activity');
  console.log('   • RWA tokenization tracking');
  console.log('   • Cross-chain bridge monitoring');
  console.log('   • AI optimization metrics');
  console.log('');
  console.log('🎨 Visual Components:');
  console.log('   • Animated network particle system');
  console.log('   • Real-time charts (TPS, Latency, RWA, Quantum)');
  console.log('   • Live transaction feed');
  console.log('   • Node status monitoring');
  console.log('   • Blockchain block visualization');
  console.log('');
  console.log('🔗 Access Points:');
  console.log('   Dashboard: http://localhost:3052');
  console.log('   WebSocket: ws://localhost:3053');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ Vizor Dashboard is running!');
  console.log('   Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════════════════════');
}

startVizorDashboard().catch(console.error);