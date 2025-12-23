'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Monitor,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Calendar,
  Zap,
  Clock,
  Activity
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface VizorWidget {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'gauge' | 'table' | 'heatmap';
  data: any[];
  query: string;
}

interface VizorDashboard {
  id: string;
  name: string;
  widgets: VizorWidget[];
  refreshInterval: number;
}

export default function VizorPage() {
  const [selectedDashboard, setSelectedDashboard] = useState('platform-overview');
  const [dashboards, setDashboards] = useState<VizorDashboard[]>([]);
  const [realtimeData, setRealtimeData] = useState({
    tps: 1050000,
    consensusLatency: 245,
    channelTransactions: 4750,
    validatorCount: 21
  });

  useEffect(() => {
    // Initialize default dashboards
    const defaultDashboards: VizorDashboard[] = [
      {
        id: 'platform-overview',
        name: 'Platform Overview',
        refreshInterval: 5000,
        widgets: [
          {
            id: 'tps-performance',
            title: 'TPS Performance',
            type: 'line',
            query: 'platform_tps',
            data: generateTPSData()
          },
          {
            id: 'consensus-latency',
            title: 'Consensus Latency',
            type: 'bar',
            query: 'consensus_latency_ms',
            data: generateLatencyData()
          },
          {
            id: 'validator-distribution',
            title: 'Validator Distribution',
            type: 'table',
            query: 'validator_status',
            data: generateValidatorData()
          }
        ]
      },
      {
        id: 'consensus-monitoring',
        name: 'HyperRAFT Consensus',
        refreshInterval: 3000,
        widgets: [
          {
            id: 'consensus-rounds',
            title: 'Consensus Rounds/sec',
            type: 'line',
            query: 'consensus_rounds_per_second',
            data: generateConsensusData()
          },
          {
            id: 'validator-participation',
            title: 'Validator Participation',
            type: 'bar',
            query: 'validator_participation_rate',
            data: generateParticipationData()
          }
        ]
      },
      {
        id: 'channel-monitoring',
        name: 'Channel Transactions',
        refreshInterval: 2000,
        widgets: [
          {
            id: 'channel-tps',
            title: 'Channel TPS',
            type: 'line',
            query: 'channel_transactions_per_second',
            data: generateChannelTPSData()
          },
          {
            id: 'encryption-ops',
            title: 'Encryption Operations',
            type: 'bar',
            query: 'channel_encryption_operations',
            data: generateEncryptionData()
          }
        ]
      }
    ];

    setDashboards(defaultDashboards);

    // Update real-time data
    const interval = setInterval(() => {
      setRealtimeData({
        tps: Math.floor(950000 + Math.random() * 150000),
        consensusLatency: Math.floor(200 + Math.random() * 200),
        channelTransactions: Math.floor(4000 + Math.random() * 2000),
        validatorCount: 21
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const generateTPSData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      tps: Math.floor(900000 + Math.random() * 200000),
      target: 1000000
    }));
  };

  const generateLatencyData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      validator: `V-${i + 1}`,
      latency: Math.floor(150 + Math.random() * 200),
      target: 500
    }));
  };

  const generateValidatorData = () => {
    return Array.from({ length: 21 }, (_, i) => ({
      id: `validator-${i + 1}`,
      stake: Math.floor(500000 + Math.random() * 1000000),
      status: Math.random() > 0.05 ? 'online' : 'syncing',
      channels: Math.floor(2 + Math.random() * 3),
      uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`
    }));
  };

  const generateConsensusData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      time: `${String(23 - i).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      rounds: Math.floor(80 + Math.random() * 40),
      successful: Math.floor(75 + Math.random() * 40)
    }));
  };

  const generateParticipationData = () => {
    return Array.from({ length: 21 }, (_, i) => ({
      validator: `V-${i + 1}`,
      participation: Math.floor(85 + Math.random() * 15),
      votes: Math.floor(100 + Math.random() * 200)
    }));
  };

  const generateChannelTPSData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${String(i * 2).padStart(2, '0')}:00`,
      'channel-alpha': Math.floor(30000 + Math.random() * 20000),
      'channel-beta': Math.floor(25000 + Math.random() * 15000),
      'channel-gamma': Math.floor(20000 + Math.random() * 10000)
    }));
  };

  const generateEncryptionData = () => {
    return [
      { name: 'CRYSTALS-Kyber', value: 45, color: '#3B82F6' },
      { name: 'CRYSTALS-Dilithium', value: 35, color: '#8B5CF6' },
      { name: 'SPHINCS+', value: 20, color: '#10B981' }
    ];
  };

  const currentDashboard = dashboards.find(d => d.id === selectedDashboard);

  const renderWidget = (widget: VizorWidget) => {
    switch (widget.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Line type="monotone" dataKey="tps" stroke="#3B82F6" strokeWidth={2} dot={false} />
              {widget.data[0]?.target && (
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="validator" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Bar dataKey="latency" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="text-left py-2">Validator</th>
                  <th className="text-left py-2">Stake</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Channels</th>
                  <th className="text-left py-2">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {widget.data.slice(0, 10).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 text-blue-400">{row.id}</td>
                    <td className="py-2 text-white">{row.stake.toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.status === 'online' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-300">{row.channels}</td>
                    <td className="py-2 text-gray-400">{row.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div className="text-gray-400">Widget type not supported</div>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 mr-3 text-blue-400" />
          Vizor Monitoring Dashboards
        </h1>
        <p className="text-gray-400">Real-time monitoring and reporting for AV10-7 platform performance</p>
      </div>

      {/* Real-time Status Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xl font-bold text-white">{realtimeData.tps.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Current TPS</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">{realtimeData.consensusLatency}ms</div>
              <div className="text-xs text-gray-400">Consensus Latency</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Monitor className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-xl font-bold text-white">{realtimeData.channelTransactions.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Channel Transactions</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-xl font-bold text-white">{realtimeData.validatorCount}</div>
              <div className="text-xs text-gray-400">Active Validators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Selection */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Select Dashboard</h3>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => setSelectedDashboard(dashboard.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDashboard === dashboard.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {dashboard.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Widgets */}
      {currentDashboard && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{currentDashboard.name}</h2>
            <div className="text-sm text-gray-400">
              Auto-refresh: {currentDashboard.refreshInterval / 1000}s
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentDashboard.widgets.map((widget) => (
              <div key={widget.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-400">{widget.query}</div>
                    <Settings className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-pointer" />
                  </div>
                </div>
                
                <div className="h-80">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div className="text-left">
              <div className="text-white font-medium">Generate Report</div>
              <div className="text-xs text-gray-400">Create custom time-range report</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors">
            <Filter className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <div className="text-white font-medium">Configure Alerts</div>
              <div className="text-xs text-gray-400">Setup monitoring thresholds</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition-colors">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div className="text-left">
              <div className="text-white font-medium">Performance Analysis</div>
              <div className="text-xs text-gray-400">Deep-dive analytics</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}