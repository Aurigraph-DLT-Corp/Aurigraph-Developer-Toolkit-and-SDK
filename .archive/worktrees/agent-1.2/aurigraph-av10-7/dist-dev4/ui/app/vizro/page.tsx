'use client';

import { useState, useEffect } from 'react';
import VizroRealtimeChart from '../../components/VizroRealtimeChart';
import { 
  BarChart3, 
  Activity, 
  Brain, 
  Globe, 
  Sparkles, 
  Shield,
  Zap,
  Eye,
  Network,
  TrendingUp
} from 'lucide-react';

interface QuantumMetrics {
  totalTransactions: number;
  avgProcessingTime: number;
  consciousnessDetections: number;
  evolutionEvents: number;
  universeUtilization: number;
  ethicsValidations: number;
}

export default function VizroDashboard() {
  const [metrics, setMetrics] = useState<QuantumMetrics>({
    totalTransactions: 0,
    avgProcessingTime: 0,
    consciousnessDetections: 0,
    evolutionEvents: 0,
    universeUtilization: 0,
    ethicsValidations: 0
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Simulate real metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 100),
        avgProcessingTime: 200 + Math.random() * 300,
        consciousnessDetections: prev.consciousnessDetections + (Math.random() > 0.7 ? 1 : 0),
        evolutionEvents: prev.evolutionEvents + (Math.random() > 0.9 ? 1 : 0),
        universeUtilization: 60 + Math.random() * 40,
        ethicsValidations: prev.ethicsValidations + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: any) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            📊 Vizro Realtime Analytics
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Advanced Quantum Nexus Monitoring & Visualization Platform
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              isLive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isLive ? 'Live Monitoring' : 'Paused'}
              </span>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions.toLocaleString()}
            subtitle="Processed today"
            icon={Zap}
            trend="up"
            color="blue"
          />
          
          <MetricCard
            title="Avg Processing"
            value={`${metrics.avgProcessingTime.toFixed(0)}ms`}
            subtitle="Transaction time"
            icon={Activity}
            trend="down"
            color="green"
          />
          
          <MetricCard
            title="Consciousness"
            value={metrics.consciousnessDetections}
            subtitle="Entities detected"
            icon={Brain}
            trend="up"
            color="purple"
          />
          
          <MetricCard
            title="Evolution Events"
            value={metrics.evolutionEvents}
            subtitle="Protocol upgrades"
            icon={Sparkles}
            trend="stable"
            color="cyan"
          />
          
          <MetricCard
            title="Universe Usage"
            value={`${metrics.universeUtilization.toFixed(1)}%`}
            subtitle="Parallel processing"
            icon={Globe}
            trend="up"
            color="indigo"
          />
          
          <MetricCard
            title="Ethics Checks"
            value={metrics.ethicsValidations}
            subtitle="Validations passed"
            icon={Shield}
            trend="up"
            color="emerald"
          />
        </div>

        {/* Realtime Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VizroRealtimeChart
            title="Quantum Coherence Level"
            dataKey="coherence"
            color="#3B82F6"
            maxDataPoints={30}
            updateInterval={3000}
          />
          
          <VizroRealtimeChart
            title="Reality Stability Index"
            dataKey="realityStability"
            color="#10B981"
            maxDataPoints={30}
            updateInterval={3000}
          />
          
          <VizroRealtimeChart
            title="Consciousness Activity"
            dataKey="consciousnessLevel"
            color="#8B5CF6"
            maxDataPoints={30}
            updateInterval={4000}
          />
          
          <VizroRealtimeChart
            title="Parallel Universe Count"
            dataKey="parallelUniverses"
            color="#06B6D4"
            maxDataPoints={30}
            updateInterval={5000}
          />
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Evolution Timeline */}
          <div className="xl:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
              Protocol Evolution Timeline
            </h3>
            <div className="space-y-4">
              {[
                { gen: 2, time: '2 min ago', mutation: 'improve-consciousness-detection', fitness: 62.1 },
                { gen: 1, time: '15 min ago', mutation: 'optimize-consensus-threshold', fitness: 58.7 },
                { gen: 0, time: '1 hour ago', mutation: 'initial-deployment', fitness: 55.0 }
              ].map((evolution, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 text-sm font-bold">{evolution.gen}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{evolution.mutation}</div>
                      <div className="text-gray-400 text-xs">{evolution.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium">{evolution.fitness}</div>
                    <div className="text-gray-400 text-xs">fitness</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              System Health
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Quantum Cores', status: 'Optimal', value: 98 },
                { name: 'Consciousness AI', status: 'Active', value: 94 },
                { name: 'Ethics Engine', status: 'Monitoring', value: 100 },
                { name: 'Reality Anchor', status: 'Stable', value: 97 },
                { name: 'Evolution Engine', status: 'Learning', value: 89 }
              ].map((system, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{system.name}</span>
                    <span className="text-green-400">{system.status}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${system.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>🌌 Quantum Nexus Vizro Dashboard - Real-time monitoring of consciousness-aware blockchain technology</p>
          <p className="mt-1">Powered by AV10-7 Revolutionary Platform | Last updated: {new Date().toLocaleString()}</p>
        </div>

      </div>
    </div>
  );
}
