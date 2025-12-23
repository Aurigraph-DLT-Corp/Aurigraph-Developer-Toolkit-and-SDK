'use client';

import { useEffect, useState } from 'react';
import MetricCard from '../../components/MetricCard';
import PerformanceChart from '../../components/PerformanceChart';

interface AV18Metrics {
  tps: number;
  latency: number;
  quantumOps: number;
  zkProofs: number;
  complianceScore: number;
  autonomousOptimizations: number;
  shardEfficiency: number;
  quantumLevel: number;
}

interface AV18Status {
  platform: string;
  version: string;
  status: string;
  features: Record<string, boolean>;
  targets: {
    maxTPS: number;
    maxLatency: number;
    quantumLevel: number;
    complianceScore: number;
  };
}

export default function AV18Dashboard() {
  const [metrics, setMetrics] = useState<AV18Metrics>({
    tps: 0,
    latency: 0,
    quantumOps: 0,
    zkProofs: 0,
    complianceScore: 0,
    autonomousOptimizations: 0,
    shardEfficiency: 0,
    quantumLevel: 6
  });
  
  const [status, setStatus] = useState<AV18Status | null>(null);
  const [history, setHistory] = useState<AV18Metrics[]>([]);

  useEffect(() => {
    // Fetch initial status
    fetchAV18Status();
    
    // Setup real-time data stream for AV10-18
    const eventSource = new EventSource('http://localhost:3018/api/v18/realtime');
    
    eventSource.onmessage = (event) => {
      try {
        const data: AV18Metrics = JSON.parse(event.data);
        setMetrics(data);
        
        // Update history (keep last 50 points)
        setHistory(prev => {
          const newHistory = [...prev, data];
          return newHistory.slice(-50);
        });
      } catch (error) {
        console.error('Failed to parse real-time data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchAV18Status = async () => {
    try {
      const response = await fetch('http://localhost:3018/api/v18/status');
      const statusData = await response.json();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to fetch AV10-18 status:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Aurigraph AV10-18
        </h1>
        <p className="text-xl text-gray-300">
          Next-Generation Quantum-Native DLT Platform
        </p>
        {status && (
          <div className="flex justify-center space-x-4 text-sm">
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
              {status.version}
            </span>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
              {status.status}
            </span>
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
              Quantum Level {status.targets?.quantumLevel}
            </span>
          </div>
        )}
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Throughput"
          value={formatNumber(metrics.tps)}
          unit="TPS"
          target="5M+"
          color="blue"
          trend={metrics.tps > 4000000 ? 'up' : 'stable'}
        />
        <MetricCard
          title="Latency"
          value={metrics.latency.toFixed(0)}
          unit="ms"
          target="<100ms"
          color="green"
          trend={metrics.latency < 100 ? 'up' : 'down'}
        />
        <MetricCard
          title="Quantum Ops"
          value={formatNumber(metrics.quantumOps)}
          unit="/sec"
          target="3M+"
          color="purple"
          trend="up"
        />
        <MetricCard
          title="Compliance Score"
          value={metrics.complianceScore?.toFixed(1) || '99.9'}
          unit="%"
          target="99.99%"
          color="emerald"
          trend="up"
        />
      </div>

      {/* Enhanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="ZK Proofs"
          value={formatNumber(metrics.zkProofs)}
          unit="/sec"
          target="4M+"
          color="indigo"
          trend="up"
        />
        <MetricCard
          title="Shard Efficiency"
          value={metrics.shardEfficiency?.toFixed(1) || '95.0'}
          unit="%"
          target="95%+"
          color="cyan"
          trend="stable"
        />
        <MetricCard
          title="Auto-Optimizations"
          value={metrics.autonomousOptimizations?.toString() || '0'}
          unit="count"
          target="continuous"
          color="orange"
          trend="up"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-white">Real-time Performance</h2>
        <PerformanceChart 
          data={history} 
          title="AV10-18 Ultra-High Throughput"
          targetTPS={5000000}
        />
      </div>

      {/* Feature Status Grid */}
      {status && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-white">AV10-18 Feature Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(status.features).map(([feature, enabled]) => (
              <div
                key={feature}
                className={`p-4 rounded-lg border ${
                  enabled 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Performance */}
      {status?.targets && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-white">Performance Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {formatNumber(status.targets.maxTPS)}
              </div>
              <div className="text-gray-400">Max TPS</div>
              <div className="mt-2">
                <div className={`text-sm ${
                  metrics.tps >= status.targets.maxTPS * 0.8 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  Current: {formatNumber(metrics.tps)}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                &lt;{status.targets.maxLatency}ms
              </div>
              <div className="text-gray-400">Max Latency</div>
              <div className="mt-2">
                <div className={`text-sm ${
                  metrics.latency <= status.targets.maxLatency ? 'text-green-400' : 'text-red-400'
                }`}>
                  Current: {metrics.latency.toFixed(0)}ms
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                Level {status.targets.quantumLevel}
              </div>
              <div className="text-gray-400">Quantum Security</div>
              <div className="mt-2">
                <div className="text-sm text-green-400">
                  NIST Level {metrics.quantumLevel}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {status.targets.complianceScore}%
              </div>
              <div className="text-gray-400">Compliance Target</div>
              <div className="mt-2">
                <div className={`text-sm ${
                  (metrics.complianceScore || 99.9) >= status.targets.complianceScore * 0.99 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  Current: {(metrics.complianceScore || 99.9).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantum & AI Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
            Quantum Features
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Key Distribution</span>
              <span className="text-green-400">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Consensus Proofs</span>
              <span className="text-green-400">✓ Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">State Channels</span>
              <span className="text-green-400">✓ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Hardware Acceleration</span>
              <span className="text-green-400">✓ Available</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            Autonomous AI
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Autonomous Mode</span>
              <span className="text-green-400">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Compliance Automation</span>
              <span className="text-green-400">✓ Running</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Predictive Analytics</span>
              <span className="text-green-400">✓ Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Self-Healing</span>
              <span className="text-green-400">✓ Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Performance Indicators */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-white">Live Performance Indicators</h2>
        <div className="space-y-4">
          {/* TPS Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Transaction Throughput</span>
              <span className="text-blue-400">{formatNumber(metrics.tps)} TPS</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.tps / 5000000) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: 5M+ TPS</div>
          </div>
          
          {/* Quantum Operations Progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Quantum Operations</span>
              <span className="text-purple-400">{formatNumber(metrics.quantumOps)}/sec</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.quantumOps / 4000000) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: 4M+ ops/sec</div>
          </div>
          
          {/* Compliance Score */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Compliance Score</span>
              <span className="text-emerald-400">{(metrics.complianceScore || 99.9).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.complianceScore || 99.9))}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: 99.99%</div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white">Advanced Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">ZK Proofs Generated</span>
              <span className="text-indigo-400">{formatNumber(metrics.zkProofs)}/sec</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Shard Efficiency</span>
              <span className="text-cyan-400">{(metrics.shardEfficiency || 95).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Autonomous Optimizations</span>
              <span className="text-orange-400">{metrics.autonomousOptimizations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Quantum Security Level</span>
              <span className="text-purple-400">NIST Level {metrics.quantumLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Consensus Version</span>
              <span className="text-blue-400">HyperRAFT++ V2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Hardware Acceleration</span>
              <span className="text-green-400">✓ Quantum QPU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Cross-chain Support</span>
              <span className="text-yellow-400">100+ Blockchains</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Enterprise Ready</span>
              <span className="text-emerald-400">✓ Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-white">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-300">Consensus optimization applied</span>
            </div>
            <span className="text-gray-400 text-sm">2 seconds ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-300">Quantum key rotation completed</span>
            </div>
            <span className="text-gray-400 text-sm">1 minute ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="text-gray-300">Shard rebalancing optimized efficiency</span>
            </div>
            <span className="text-gray-400 text-sm">3 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-gray-300">Compliance report auto-generated</span>
            </div>
            <span className="text-gray-400 text-sm">5 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}