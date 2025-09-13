'use client';

import { useState, useEffect } from 'react';
import MetricCard from '../../components/MetricCard';
import { 
  Network, 
  ArrowRightLeft, 
  Coins, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  RotateCcw
} from 'lucide-react';
import type { ChainConnection } from '../../types';

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'text-blue-400' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'text-purple-400' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'text-yellow-400' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', color: 'text-red-400' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: 'text-green-400' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', color: 'text-pink-400' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', color: 'text-indigo-400' },
  { id: 'near', name: 'NEAR', symbol: 'NEAR', color: 'text-cyan-400' },
  { id: 'algorand', name: 'Algorand', symbol: 'ALGO', color: 'text-orange-400' },
];

export default function CrossChainPage() {
  const [connections, setConnections] = useState<ChainConnection[]>([]);
  const [bridgeMetrics, setBridgeMetrics] = useState({
    totalVolume: '$2.47B',
    dailyTransactions: 8742,
    avgFee: '0.023%',
    successRate: 99.94,
  });

  const [recentTransfers, setRecentTransfers] = useState([
    {
      id: '0x1a2b3c...',
      sourceChain: 'ethereum',
      targetChain: 'solana',
      asset: 'USDC',
      amount: '50,000',
      status: 'completed',
      timestamp: '2025-09-01T10:15:32Z'
    },
    {
      id: '0x4d5e6f...',
      sourceChain: 'polygon',
      targetChain: 'avalanche',
      asset: 'WETH',
      amount: '12.5',
      status: 'pending',
      timestamp: '2025-09-01T10:14:18Z'
    },
    {
      id: '0x7g8h9i...',
      sourceChain: 'bsc',
      targetChain: 'ethereum',
      asset: 'USDT',
      amount: '25,000',
      status: 'completed',
      timestamp: '2025-09-01T10:13:45Z'
    },
  ]);

  useEffect(() => {
    // Initialize chain connections
    const initialConnections: ChainConnection[] = SUPPORTED_CHAINS.map(chain => ({
      chainId: chain.id,
      name: chain.name,
      status: Math.random() > 0.1 ? 'connected' : 'syncing',
      blockHeight: Math.floor(Math.random() * 1000000) + 18000000,
      lastSync: new Date(Date.now() - Math.random() * 60000).toISOString(),
    }));
    
    setConnections(initialConnections);

    // Update metrics periodically
    const interval = setInterval(() => {
      setBridgeMetrics(prev => ({
        ...prev,
        dailyTransactions: prev.dailyTransactions + Math.floor(Math.random() * 10),
      }));

      setConnections(prev => prev.map(conn => ({
        ...conn,
        blockHeight: conn.blockHeight + Math.floor(Math.random() * 3),
        lastSync: Math.random() > 0.8 ? new Date().toISOString() : conn.lastSync,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'syncing': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Network className="w-8 h-8 mr-3 text-purple-400" />
          Cross-Chain Bridge Management
        </h1>
        <p className="text-gray-400">Monitor and manage interoperability across 50+ blockchain networks</p>
      </div>

      {/* Bridge Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Volume"
          value={bridgeMetrics.totalVolume}
          subtitle="24h bridge volume"
          icon={Coins}
          trend="up"
          className="ring-2 ring-green-500/50"
        />
        
        <MetricCard
          title="Daily Transfers"
          value={bridgeMetrics.dailyTransactions}
          subtitle="Cross-chain transactions"
          icon={ArrowRightLeft}
          trend="up"
        />
        
        <MetricCard
          title="Success Rate"
          value={`${bridgeMetrics.successRate}%`}
          subtitle="Bridge reliability"
          icon={CheckCircle}
          className="ring-2 ring-blue-500/50"
        />
        
        <MetricCard
          title="Average Fee"
          value={bridgeMetrics.avgFee}
          subtitle="Bridge transaction cost"
          icon={TrendingUp}
          trend="down"
        />
      </div>

      {/* Chain Connections Status */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Connected Chains</h3>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Chain</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => {
            const chainInfo = SUPPORTED_CHAINS.find(c => c.id === connection.chainId);
            return (
              <div key={connection.chainId} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connection.status === 'connected' ? 'bg-green-500' : 
                      connection.status === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
                    } animate-pulse`} />
                    <span className="font-medium text-white">{connection.name}</span>
                    <span className={chainInfo?.color}>{chainInfo?.symbol}</span>
                  </div>
                  {getStatusIcon(connection.status)}
                </div>
                
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Block Height</span>
                    <span className="text-blue-400">{connection.blockHeight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Sync</span>
                    <span>{new Date(connection.lastSync).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={`capitalize ${
                      connection.status === 'connected' ? 'text-green-400' :
                      connection.status === 'syncing' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {connection.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Bridge Transactions */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Bridge Transactions</h3>
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-2">Transaction</th>
                <th className="text-left py-2">Route</th>
                <th className="text-left py-2">Asset</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {recentTransfers.map((transfer) => {
                const sourceChain = SUPPORTED_CHAINS.find(c => c.id === transfer.sourceChain);
                const targetChain = SUPPORTED_CHAINS.find(c => c.id === transfer.targetChain);
                
                return (
                  <tr key={transfer.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3">
                      <span className="font-mono text-blue-400">{transfer.id}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className={sourceChain?.color}>{sourceChain?.name}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span className={targetChain?.color}>{targetChain?.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-white">{transfer.asset}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-white">{transfer.amount}</span>
                    </td>
                    <td className="py-3">
                      <span className={`capitalize font-medium ${getTransferStatusColor(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(transfer.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}