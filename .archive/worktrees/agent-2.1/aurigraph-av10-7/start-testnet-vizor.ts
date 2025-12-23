import { VizorSimpleDashboard } from './src/monitoring/VizorSimpleDashboard';

async function startTestnetVizor() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Starting Aurigraph TEST Channel Vizor Dashboard');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('🏗️ TEST Channel Configuration:');
  console.log('   • 5 Validator Nodes (VAL-001 to VAL-005)');
  console.log('   • 20 Basic Nodes (FULL, LIGHT, ARCHIVE, BRIDGE)');
  console.log('   • HyperRAFT++ Consensus');
  console.log('   • Quantum Security Level 6');
  console.log('   • Target: 1M+ TPS');
  console.log('');
  
  const dashboard = new VizorSimpleDashboard();
  await dashboard.start(3038);
  
  console.log('');
  console.log('🎯 Simulated Network Activity:');
  console.log('   • Real-time TPS fluctuation around 1M');
  console.log('   • Live transaction generation');
  console.log('   • Node status monitoring');
  console.log('   • Consensus round visualization');
  console.log('');
  console.log('🔗 Access Dashboard:');
  console.log('   http://localhost:3038');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ Vizor Dashboard Active - Monitoring TEST Channel');
  console.log('   Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════════════════════');
}

startTestnetVizor().catch(console.error);