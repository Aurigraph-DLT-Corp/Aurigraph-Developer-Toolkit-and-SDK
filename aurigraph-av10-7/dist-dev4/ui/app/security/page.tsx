'use client';

import { useState, useEffect } from 'react';
import MetricCard from '../../components/MetricCard';
import { 
  Shield, 
  Key, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function SecurityPage() {
  const [quantumStatus, setQuantumStatus] = useState({
    level: 5,
    algorithms: ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'SPHINCS+'],
    keysGenerated: 15847,
    signaturesVerified: 2841035,
    encryptionOperations: 1284792,
  });

  const [zkMetrics, setZkMetrics] = useState({
    proofsGenerated: 847291,
    proofsVerified: 847285,
    aggregationRatio: 0.97,
    computeTime: 12.4,
  });

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      level: 'info',
      message: 'Quantum key rotation completed successfully',
      timestamp: '2025-09-01T10:15:00Z',
      resolved: true,
    },
    {
      id: '2', 
      level: 'info',
      message: 'Zero-knowledge proof verification rate: 99.9%',
      timestamp: '2025-09-01T10:10:00Z',
      resolved: true,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuantumStatus(prev => ({
        ...prev,
        keysGenerated: prev.keysGenerated + Math.floor(Math.random() * 10),
        signaturesVerified: prev.signaturesVerified + Math.floor(Math.random() * 100),
        encryptionOperations: prev.encryptionOperations + Math.floor(Math.random() * 50),
      }));

      setZkMetrics(prev => ({
        ...prev,
        proofsGenerated: prev.proofsGenerated + Math.floor(Math.random() * 20),
        proofsVerified: prev.proofsVerified + Math.floor(Math.random() * 20),
        computeTime: 10 + Math.random() * 10,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
          <Shield className="w-8 h-8 mr-3 text-blue-400" />
          Quantum Security Center
        </h1>
        <p className="text-gray-400">Post-quantum cryptography and zero-knowledge privacy monitoring</p>
      </div>

      {/* Quantum Cryptography Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Quantum Security Level"
          value={`Level ${quantumStatus.level}`}
          subtitle="NIST Post-Quantum Standard"
          icon={Shield}
          className="ring-2 ring-blue-500/50"
        />
        
        <MetricCard
          title="Keys Generated"
          value={quantumStatus.keysGenerated}
          subtitle="Quantum-safe key pairs"
          icon={Key}
          trend="up"
        />
        
        <MetricCard
          title="Signatures Verified"
          value={quantumStatus.signaturesVerified}
          subtitle="CRYSTALS-Dilithium signatures"
          icon={CheckCircle}
          trend="up"
        />
        
        <MetricCard
          title="Encryption Operations"
          value={quantumStatus.encryptionOperations}
          subtitle="CRYSTALS-Kyber encryptions"
          icon={Lock}
          trend="up"
        />
      </div>

      {/* Zero-Knowledge Metrics */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-purple-400" />
          Zero-Knowledge Proof System
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{zkMetrics.proofsGenerated.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Proofs Generated</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{zkMetrics.proofsVerified.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Proofs Verified</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{(zkMetrics.aggregationRatio * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Aggregation Rate</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{zkMetrics.computeTime.toFixed(1)}ms</div>
            <div className="text-sm text-gray-400">Avg Compute Time</div>
          </div>
        </div>
      </div>

      {/* Cryptographic Algorithms */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-white mb-6">Active Cryptographic Algorithms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quantumStatus.algorithms.map((algo, index) => (
            <div key={algo} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{algo}</h4>
                <div className="status-indicator status-active">Active</div>
              </div>
              <div className="text-sm text-gray-400">
                {index === 0 && 'Key Encapsulation Mechanism'}
                {index === 1 && 'Digital Signature Algorithm'}
                {index === 2 && 'Hash-based Signature Scheme'}
              </div>
              <div className="mt-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                <span className="text-xs text-green-400">Quantum Resistant</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Alerts */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
            Security Alerts & Events
          </h3>
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {securityAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getAlertColor(alert.level)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getAlertIcon(alert.level)}
                  <span className="text-sm text-white">{alert.message}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}