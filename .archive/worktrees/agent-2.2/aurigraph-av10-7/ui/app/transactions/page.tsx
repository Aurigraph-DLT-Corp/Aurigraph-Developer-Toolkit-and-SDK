'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import type { Transaction } from '../../types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrivate, setFilterPrivate] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    // Generate sample transactions
    const generateTransaction = (): Transaction => {
      const isPrivate = Math.random() > 0.6;
      const isCrossChain = Math.random() > 0.7;
      const statuses = ['confirmed', 'pending', 'failed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)] as Transaction['status'];
      
      return {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        amount: (Math.random() * 10000).toFixed(2),
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        status,
        zkPrivate: isPrivate,
        crossChain: isCrossChain ? {
          sourceChain: 'ethereum',
          targetChain: 'solana'
        } : undefined,
      };
    };

    const initialTxs = Array.from({ length: 50 }, generateTransaction);
    setTransactions(initialTxs);

    // Add new transactions periodically
    const interval = setInterval(() => {
      const newTx = generateTransaction();
      setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchQuery === '' || 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterPrivate || tx.zkPrivate;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Search className="w-8 h-8 mr-3 text-cyan-400" />
          Transaction Explorer
        </h1>
        <p className="text-gray-400">Explore blockchain transactions with zero-knowledge privacy controls</p>
      </div>

      {/* Search and Filters */}
      <div className="metric-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by hash, address, or amount..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilterPrivate(!filterPrivate)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterPrivate 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {filterPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>ZK Private Only</span>
            </button>
            
            <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Recent Transactions ({filteredTransactions.length})
          </h3>
          <div className="text-sm text-gray-400">
            Showing latest transactions • Updates every 3s
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-3">Hash</th>
                <th className="text-left py-3">From/To</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Privacy</th>
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Time</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 20).map((tx) => (
                <tr key={tx.hash} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-400 text-xs">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(tx.hash)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="space-y-1">
                      <div className="font-mono text-xs text-gray-300">
                        {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                      </div>
                      <div className="font-mono text-xs text-gray-300">
                        {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <span className="text-white font-medium">{tx.amount} AV10</span>
                  </td>
                  
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tx.status)}
                      <span className={`capitalize font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="flex items-center space-x-1">
                      {tx.zkPrivate ? (
                        <>
                          <EyeOff className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 text-xs">Private</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400 text-xs">Public</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3">
                    {tx.crossChain ? (
                      <div className="flex items-center space-x-1">
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-400 text-xs">Cross-chain</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Standard</span>
                    )}
                  </td>
                  
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  
                  <td className="py-3">
                    <button 
                      onClick={() => setSelectedTx(tx)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Transaction Hash</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-blue-400">{selectedTx.hash}</span>
                  <button 
                    onClick={() => copyToClipboard(selectedTx.hash)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">From</label>
                  <div className="font-mono text-white mt-1">{selectedTx.from}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">To</label>
                  <div className="font-mono text-white mt-1">{selectedTx.to}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Amount</label>
                  <div className="text-white font-medium mt-1">{selectedTx.amount} AV10</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className={`font-medium mt-1 capitalize ${getStatusColor(selectedTx.status)}`}>
                    {selectedTx.status}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Privacy</label>
                  <div className="mt-1">
                    {selectedTx.zkPrivate ? (
                      <span className="text-purple-400">🎭 ZK Private</span>
                    ) : (
                      <span className="text-gray-400">👁️ Public</span>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedTx.crossChain && (
                <div className="bg-gray-700 rounded-lg p-4 border border-cyan-500/30">
                  <h4 className="text-white font-medium mb-2 flex items-center">
                    <ArrowRightLeft className="w-4 h-4 mr-2 text-cyan-400" />
                    Cross-Chain Transfer
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Source Chain</span>
                      <div className="text-cyan-400 capitalize">{selectedTx.crossChain.sourceChain}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Target Chain</span>
                      <div className="text-cyan-400 capitalize">{selectedTx.crossChain.targetChain}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedTx.zkPrivate && (
                <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                  <h4 className="text-white font-medium mb-2 flex items-center">
                    <EyeOff className="w-4 h-4 mr-2 text-purple-400" />
                    Zero-Knowledge Privacy
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Proof Type</span>
                      <div className="text-purple-400">zk-SNARK</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Privacy Level</span>
                      <div className="text-purple-400">Complete</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-purple-300">
                    ⚡ Transaction details are cryptographically hidden while maintaining verifiability
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400">Timestamp</label>
                <div className="text-white mt-1">{new Date(selectedTx.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}