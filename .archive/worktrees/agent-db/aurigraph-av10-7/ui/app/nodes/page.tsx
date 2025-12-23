'use client';

import { useState, useEffect } from 'react';
import MetricCard from '../../components/MetricCard';
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive,
  Wifi,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { NodeInfo } from '../../types';

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 21,
    activeValidators: 19,
    observerNodes: 2,
    totalStake: '12.4M AV10',
    networkHealth: 98.7,
  });

  useEffect(() => {
    // Initialize validator nodes
    const initialNodes: NodeInfo[] = Array.from({ length: 21 }, (_, i) => ({
      nodeId: `validator-${i + 1}`,
      version: '10.7.0',
      uptime: `${Math.floor(Math.random() * 30 + 1)}d ${Math.floor(Math.random() * 24)}h`,
      role: i < 19 ? 'validator' : 'observer',
      status: Math.random() > 0.05 ? 'online' : 'syncing',
    }));
    
    setNodes(initialNodes);

    // Update node stats periodically
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        status: Math.random() > 0.02 ? 'online' : node.status,
      })));

      setNetworkStats(prev => ({
        ...prev,
        networkHealth: Math.floor(96 + Math.random() * 4),
        activeValidators: Math.floor(18 + Math.random() * 3),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'syncing': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'syncing': return <RotateCcw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const handleNodeAction = (nodeId: string, action: string) => {
    console.log(`${action} node ${nodeId}`);
    // In a real implementation, this would call the API
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Activity className="w-8 h-8 mr-3 text-green-400" />
          Validator Network Management
        </h1>
        <p className="text-gray-400">Monitor and control AV10-7 validator nodes and network health</p>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Nodes"
          value={networkStats.totalNodes}
          subtitle="Network participants"
          icon={Server}
        />
        
        <MetricCard
          title="Active Validators"
          value={networkStats.activeValidators}
          subtitle="Consensus participants"
          icon={Activity}
          trend="stable"
          className="ring-2 ring-green-500/50"
        />
        
        <MetricCard
          title="Observer Nodes"
          value={networkStats.observerNodes}
          subtitle="Read-only nodes"
          icon={Eye}
        />
        
        <MetricCard
          title="Total Stake"
          value={networkStats.totalStake}
          subtitle="Staked tokens"
          icon={Cpu}
          trend="up"
        />
        
        <MetricCard
          title="Network Health"
          value={`${networkStats.networkHealth}%`}
          subtitle="Overall performance"
          icon={Wifi}
          className="ring-2 ring-blue-500/50"
        />
      </div>

      {/* Validator Nodes Grid */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Validator Nodes</h3>
          <div className="flex items-center space-x-2">
            <button className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1">
              <Play className="w-3 h-3" />
              <span>Start All</span>
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1">
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nodes.map((node) => (
            <div key={node.nodeId} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(node.status)}
                  <span className="font-medium text-white">{node.nodeId}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  node.role === 'validator' ? 'bg-blue-600 text-blue-100' : 'bg-gray-600 text-gray-100'
                }`}>
                  {node.role}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white">{node.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-green-400">{node.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`capitalize font-medium ${getStatusColor(node.status)}`}>
                    {node.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleNodeAction(node.nodeId, 'restart')}
                    className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-gray-600 rounded"
                    title="Restart"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleNodeAction(node.nodeId, 'settings')}
                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded"
                    title="Settings"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-4 bg-green-500 rounded-sm" title="CPU: Normal" />
                    <div className="w-2 h-4 bg-blue-500 rounded-sm" title="Memory: Normal" />
                    <div className="w-2 h-4 bg-yellow-500 rounded-sm" title="Disk: Moderate" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Configuration */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Network Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Consensus Parameters</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Block Time</span>
                <span className="text-white">500ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Validator Threshold</span>
                <span className="text-white">67% (14/21)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Max Block Size</span>
                <span className="text-white">32MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Parallel Threads</span>
                <span className="text-white">256</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Security Settings</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Quantum Security</span>
                <span className="text-green-400">Level 5 ✅</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">ZK Proofs Required</span>
                <span className="text-green-400">Enabled ✅</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Multi-Party Computation</span>
                <span className="text-green-400">Active ✅</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Homomorphic Encryption</span>
                <span className="text-green-400">Enabled ✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}