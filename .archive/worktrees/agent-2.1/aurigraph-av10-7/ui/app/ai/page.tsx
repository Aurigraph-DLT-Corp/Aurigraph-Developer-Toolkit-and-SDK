'use client';

import { useState, useEffect } from 'react';
import MetricCard from '../../components/MetricCard';
import { 
  Brain, 
  TrendingUp,
  Cpu,
  Activity,
  Target,
  Zap,
  BarChart3,
  Settings,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';
import type { AIOptimizerStatus } from '../../types';

export default function AIOptimizerPage() {
  const [aiStatus, setAiStatus] = useState<AIOptimizerStatus>({
    enabled: true,
    currentModel: 'HyperRAFT-AI-v3.2',
    optimizationLevel: 94,
    suggestions: [
      'Increase validator batch size to 512 for higher throughput',
      'Optimize consensus round timing based on network latency',
      'Reduce ZK proof generation overhead by 15%',
      'Implement dynamic load balancing for cross-chain bridges'
    ],
    learningRate: 0.023
  });

  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 96.8,
    predictionLatency: 12,
    throughputGain: '+18.5%',
    errorReduction: '23.4%'
  });

  const [optimizationHistory, setOptimizationHistory] = useState([
    {
      timestamp: '2025-09-01T08:15:32Z',
      action: 'Consensus Round Optimization',
      improvement: '+2.3% TPS',
      confidence: 97.2
    },
    {
      timestamp: '2025-09-01T08:12:15Z',
      action: 'Validator Selection Tuning',
      improvement: '-15ms Latency',
      confidence: 94.8
    },
    {
      timestamp: '2025-09-01T08:09:44Z',
      action: 'ZK Proof Batch Size Adjustment',
      improvement: '+5.1% Efficiency',
      confidence: 91.5
    },
    {
      timestamp: '2025-09-01T08:06:23Z',
      action: 'Cross-Chain Route Optimization',
      improvement: '+12% Bridge Speed',
      confidence: 89.3
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAiStatus(prev => ({
        ...prev,
        optimizationLevel: Math.min(99.9, prev.optimizationLevel + (Math.random() - 0.5) * 2),
        learningRate: Math.max(0.001, Math.min(0.1, prev.learningRate + (Math.random() - 0.5) * 0.005))
      }));

      setModelMetrics(prev => ({
        ...prev,
        accuracy: Math.min(99.9, Math.max(90, prev.accuracy + (Math.random() - 0.5) * 1)),
        predictionLatency: Math.max(5, Math.min(25, prev.predictionLatency + (Math.random() - 0.5) * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleAI = () => {
    setAiStatus(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Brain className="w-8 h-8 mr-3 text-purple-400 animate-pulse" />
          AI Optimizer Control Center
        </h1>
        <p className="text-gray-400">Machine learning powered consensus and performance optimization</p>
      </div>

      {/* AI Status Controls */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">AI Optimizer Status</h3>
          <button 
            onClick={toggleAI}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aiStatus.enabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {aiStatus.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{aiStatus.enabled ? 'Pause AI' : 'Start AI'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">{aiStatus.currentModel}</div>
            <div className="text-sm text-gray-400">Current Model</div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${aiStatus.enabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className={aiStatus.enabled ? 'text-green-400' : 'text-red-400'}>
                {aiStatus.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">{aiStatus.optimizationLevel.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Optimization Level</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${aiStatus.optimizationLevel}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">{aiStatus.learningRate.toFixed(3)}</div>
            <div className="text-sm text-gray-400">Learning Rate</div>
            <div className="text-xs text-blue-400">Adaptive adjustment active</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Model Accuracy"
          value={`${modelMetrics.accuracy.toFixed(1)}%`}
          subtitle="Prediction accuracy"
          icon={Target}
          trend="up"
          className="ring-2 ring-green-500/50"
        />
        
        <MetricCard
          title="Prediction Latency"
          value={`${modelMetrics.predictionLatency}ms`}
          subtitle="AI response time"
          icon={Zap}
          trend="down"
        />
        
        <MetricCard
          title="Throughput Gain"
          value={modelMetrics.throughputGain}
          subtitle="Performance improvement"
          icon={TrendingUp}
          trend="up"
          className="ring-2 ring-blue-500/50"
        />
        
        <MetricCard
          title="Error Reduction"
          value={modelMetrics.errorReduction}
          subtitle="Consensus error decrease"
          icon={Activity}
          trend="down"
        />
      </div>

      {/* AI Suggestions */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Optimization Suggestions
        </h3>
        
        <div className="space-y-3">
          {aiStatus.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="p-1 bg-purple-600 rounded">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">{suggestion}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Confidence: {90 + Math.floor(Math.random() * 10)}% | Impact: {['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]}
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 border border-blue-600 rounded">
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization History */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Optimizations</h3>
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Optimization</th>
                <th className="text-left py-2">Improvement</th>
                <th className="text-left py-2">Confidence</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {optimizationHistory.map((optimization, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 text-gray-400">
                    {new Date(optimization.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3">
                    <span className="text-white">{optimization.action}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-green-400 font-medium">{optimization.improvement}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-blue-400">{optimization.confidence.toFixed(1)}%</span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900 text-green-300">
                      Applied
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-400" />
            Model Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Learning Rate</span>
              <input 
                type="range" 
                min="0.001" 
                max="0.1" 
                step="0.001"
                value={aiStatus.learningRate}
                onChange={(e) => setAiStatus(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                className="w-32"
              />
              <span className="text-sm text-blue-400">{aiStatus.learningRate.toFixed(3)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Optimization Target</span>
              <select className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white">
                <option value="throughput">Max Throughput</option>
                <option value="latency">Min Latency</option>
                <option value="balanced">Balanced</option>
                <option value="security">Security First</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Training Mode</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Online</button>
                <button className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-xs">Offline</button>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-green-400" />
            Model Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Training Epochs</span>
              <span className="text-sm text-blue-400">2,847</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Model Size</span>
              <span className="text-sm text-blue-400">847 MB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Parameters</span>
              <span className="text-sm text-blue-400">12.3M</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Last Update</span>
              <span className="text-sm text-gray-400">2 minutes ago</span>
            </div>
            
            <div className="pt-2 border-t border-gray-600">
              <div className="flex items-center space-x-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400">Model retraining scheduled in 6 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}