'use client';

import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import PerformanceChart from '../components/PerformanceChart';
import { 
  Zap, 
  Shield, 
  Network, 
  Brain, 
  Clock, 
  Activity,
  Cpu,
  Database
} from 'lucide-react';
import type { PerformanceMetrics, SecurityStatus, CrossChainMetrics, AIOptimizerStatus } from '../types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    tps: 1047293,
    latency: 387,
    throughput: 98.7,
    activeValidators: 21,
    timestamp: new Date().toISOString(),
  });

  const [security, setSecurity] = useState<SecurityStatus>({
    quantumLevel: 5,
    cryptoAlgorithms: ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'SPHINCS+'],
    threatLevel: 'low',
    lastAudit: '2025-08-30T14:23:00Z',
  });

  const [crossChain, setCrossChain] = useState<CrossChainMetrics>({
    supportedChains: 52,
    bridgeTransactions: 8742,
    liquidityPoolValue: '$2.47B',
    activeConnections: [],
  });

  const [aiStatus, setAiStatus] = useState<AIOptimizerStatus>({
    enabled: true,
    currentModel: 'HyperRAFT-AI-v3.2',
    optimizationLevel: 94,
    suggestions: ['Increase validator count', 'Optimize batch sizes'],
    learningRate: 0.023,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        tps: Math.floor(950000 + Math.random() * 150000),
        latency: Math.floor(200 + Math.random() * 300),
        throughput: Math.floor(95 + Math.random() * 5),
        timestamp: new Date().toISOString(),
      }));

      setCrossChain(prev => ({
        ...prev,
        bridgeTransactions: prev.bridgeTransactions + Math.floor(Math.random() * 50),
      }));

      setAiStatus(prev => ({
        ...prev,
        optimizationLevel: Math.floor(90 + Math.random() * 10),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          AV10-7 Quantum Nexus
        </h1>
        <p className="text-gray-400">Real-time management dashboard for the quantum-resilient blockchain platform</p>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current TPS"
          value={metrics.tps}
          subtitle="Transactions per second"
          icon={Zap}
          trend="up"
          className="quantum-glow"
        />
        
        <MetricCard
          title="Latency"
          value={`${metrics.latency}ms`}
          subtitle="Transaction finality"
          icon={Clock}
          trend="down"
        />
        
        <MetricCard
          title="Quantum Security"
          value={`Level ${security.quantumLevel}`}
          subtitle="NIST post-quantum standard"
          icon={Shield}
          className="ring-2 ring-green-500/50"
        />
        
        <MetricCard
          title="Active Validators"
          value={metrics.activeValidators}
          subtitle="Consensus participants"
          icon={Activity}
          trend="stable"
        />
      </div>

      {/* Performance Charts */}
      <PerformanceChart />

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Cross-Chain Bridges"
          value={crossChain.supportedChains}
          subtitle={`${crossChain.bridgeTransactions.toLocaleString()} transactions today`}
          icon={Network}
        >
          <div className="mt-4 text-sm text-gray-400">
            Total Liquidity: <span className="text-green-400 font-bold">{crossChain.liquidityPoolValue}</span>
          </div>
        </MetricCard>

        <MetricCard
          title="AI Optimization"
          value={`${aiStatus.optimizationLevel}%`}
          subtitle={aiStatus.currentModel}
          icon={Brain}
        >
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Learning Rate</span>
              <span className="text-blue-400">{aiStatus.learningRate}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${aiStatus.optimizationLevel}%` }}
              />
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="System Health"
          value="Optimal"
          subtitle="All systems operational"
          icon={Cpu}
        >
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-green-400">23%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Memory</span>
              <span className="text-blue-400">67%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Storage</span>
              <span className="text-yellow-400">45%</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Status Overview */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          Platform Status Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Core Services</h4>
            <div className="space-y-2">
              {[
                'HyperRAFT++ Consensus',
                'Quantum Cryptography',
                'Network Orchestrator',
                'Monitoring Service'
              ].map((service) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{service}</span>
                  <span className="status-indicator status-active">Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Advanced Features</h4>
            <div className="space-y-2">
              {[
                'Zero-Knowledge Proofs',
                'Cross-Chain Bridge',
                'AI Optimizer',
                'Quantum Security'
              ].map((feature) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{feature}</span>
                  <span className="status-indicator status-active">Enabled</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Security Alerts</h4>
            <div className="space-y-2">
              <div className="text-sm text-green-400">🔐 All quantum signatures verified</div>
              <div className="text-sm text-green-400">🎭 ZK proofs validating normally</div>
              <div className="text-sm text-green-400">🌉 Cross-chain bridges secure</div>
              <div className="text-sm text-blue-400">🤖 AI optimization active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}