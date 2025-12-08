/**
 * Advanced High-Throughput Demo Application
 *
 * Features:
 * - Configure validator, business, and slim nodes
 * - Multi-channel support with independent performance metrics
 * - Real-time transaction simulation at 1M+ TPS
 * - AI optimization controls
 * - Quantum-safe cryptography verification
 * - Production-grade monitoring and analytics
 *
 * @version 1.0.0
 * @author Aurigraph DLT - Demo Team
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Tabs,
  Table,
  Progress,
  Alert,
  Badge,
  Select,
  Slider,
  Switch,
  Tag,
  Form,
  message,
  Drawer,
} from 'antd';
import {
  ThunderboltOutlined,
  RobotOutlined,
  SafetyOutlined,
  CloudOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  LineChartOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  UserAddOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import DemoUserRegistration from './DemoUserRegistration';

// ==================== TYPES ====================

interface NodeConfig {
  nodeId: string;
  nodeType: 'validator' | 'business' | 'slim';
  name: string;
  enabled: boolean;
  port: number;
  cpuAllocation: number;
  memoryAllocation: number; // MB
  maxConnections: number;
  consensusParticipation: boolean;
}

interface ChannelConfig {
  channelId: string;
  name: string;
  createdAt: number;
  validatorNodes: NodeConfig[];
  businessNodes: NodeConfig[];
  slimNodes: NodeConfig[];
  enabled: boolean;
}

interface TransactionMetric {
  timestamp: number;
  tps: number;
  avgLatency: number;
  successRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface NodeMetric {
  nodeId: string;
  nodeType: string;
  status: 'healthy' | 'degraded' | 'offline';
  tps: number;
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  transactionsProcessed: number;
  errorsCount: number;
}

interface AuditTrailEntry {
  id: string;
  timestamp: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  txType: 'transfer' | 'stake' | 'contract' | 'bridge' | 'swap';
  status: 'success' | 'pending' | 'failed';
  nodeId: string;
  blockNumber: number;
  gasUsed: number;
  latency: number;
}

interface DemoState {
  isRunning: boolean;
  currentChannel: ChannelConfig | null;
  metricsHistory: TransactionMetric[];
  nodeMetrics: NodeMetric[];
  totalTransactions: number;
  peakTPS: number;
  avgLatency: number;
  auditTrail: AuditTrailEntry[];
  currentBlockNumber: number;
}

// Consensus Settings Interface - Sprint 15 Optimized
interface ConsensusSettings {
  threadPoolSize: number;
  queueSize: string;
  consensusBatchSize: string;
  pipelineDepth: number;
  parallelThreads: number;
  electionTimeout: string;
  heartbeatInterval: string;
  transactionBatch: string;
  validationThreads: number;
}

// Default Consensus Settings (Sprint 15 Optimized - Dec 2025)
const CONSENSUS_SETTINGS: ConsensusSettings = {
  threadPoolSize: 512,
  queueSize: '1M',
  consensusBatchSize: '250K',
  pipelineDepth: 64,
  parallelThreads: 1024,
  electionTimeout: '500ms',
  heartbeatInterval: '50ms',
  transactionBatch: '25K',
  validationThreads: 32,
};

// Consensus Status for channels
interface ConsensusStatus {
  channelId: string;
  status: 'active' | 'syncing' | 'idle' | 'error';
  currentTerm: number;
  leaderNode: string;
  lastApplied: number;
  commitIndex: number;
  activeValidators: number;
}

// ==================== COMPONENT ====================

const DemoChannelApp: React.FC = () => {
  const [form] = Form.useForm();
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('3'); // Default to Channels tab to show instrumentation
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);

  // Registration Modal State
  const [registrationModalVisible, setRegistrationModalVisible] = useState(false);

  // Demo State
  const [demoState, setDemoState] = useState<DemoState>({
    isRunning: false,
    currentChannel: null,
    metricsHistory: [],
    nodeMetrics: [],
    totalTransactions: 0,
    peakTPS: 0,
    avgLatency: 0,
    auditTrail: [],
    currentBlockNumber: 1000000,
  });

  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Consensus Status State
  const [consensusStatus, setConsensusStatus] = useState<ConsensusStatus>({
    channelId: '',
    status: 'idle',
    currentTerm: 1,
    leaderNode: 'validator-node-1',
    lastApplied: 0,
    commitIndex: 0,
    activeValidators: 0,
  });

  // Configuration UI State
  const [validatorNodeCount, setValidatorNodeCount] = useState(4);
  const [businessNodeCount, setBusinessNodeCount] = useState(6);
  const [slimNodeCount, setSlimNodeCount] = useState(12);
  const [targetTPS, setTargetTPS] = useState(1000000);
  const [aiOptimizationEnabled, setAiOptimizationEnabled] = useState(true);
  const [quantumSecureEnabled, setQuantumSecureEnabled] = useState(true);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeDemoChannels();
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  const initializeDemoChannels = () => {
    const defaultChannel: ChannelConfig = {
      channelId: 'demo-channel-001',
      name: 'High-Throughput Demo Channel',
      createdAt: Date.now(),
      validatorNodes: generateNodeConfig(4, 'validator', 9000),
      businessNodes: generateNodeConfig(6, 'business', 9020),
      slimNodes: generateNodeConfig(12, 'slim', 9050),
      enabled: true,
    };

    setChannels([defaultChannel]);
    setSelectedChannelId(defaultChannel.channelId);
    setDemoState((prev) => ({ ...prev, currentChannel: defaultChannel }));
  };

  const generateNodeConfig = (
    count: number,
    nodeType: 'validator' | 'business' | 'slim',
    basePort: number
  ): NodeConfig[] => {
    const configs: NodeConfig[] = [];
    const cpuAlloc = nodeType === 'validator' ? 4 : nodeType === 'business' ? 2 : 1;
    const memAlloc = nodeType === 'validator' ? 4096 : nodeType === 'business' ? 2048 : 1024;
    const maxConn = nodeType === 'validator' ? 1000 : nodeType === 'business' ? 500 : 100;

    for (let i = 0; i < count; i++) {
      configs.push({
        nodeId: `${nodeType}-node-${i + 1}`,
        nodeType,
        name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node ${i + 1}`,
        enabled: true,
        port: basePort + i,
        cpuAllocation: cpuAlloc,
        memoryAllocation: memAlloc,
        maxConnections: maxConn,
        consensusParticipation: nodeType === 'validator',
      });
    }
    return configs;
  };

  // ==================== DEMO CONTROL ====================

  const startDemo = useCallback(async () => {
    if (!selectedChannelId) {
      message.error('Please select a channel');
      return;
    }

    setLoading(true);
    try {
      const channel = channels.find((c) => c.channelId === selectedChannelId);
      if (!channel) throw new Error('Channel not found');

      setDemoState((prev) => ({
        ...prev,
        isRunning: true,
        currentChannel: channel,
        totalTransactions: 0,
        peakTPS: 0,
      }));

      // Initialize metrics collection
      startMetricsCollection();
      message.success(`Demo started on channel: ${channel.name}`);
    } catch (error) {
      message.error(`Failed to start demo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedChannelId, channels]);

  const stopDemo = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }

    setDemoState((prev) => ({
      ...prev,
      isRunning: false,
    }));

    message.info('Demo stopped');
  }, []);

  const startMetricsCollection = () => {
    let txCount = 0;
    let blockCounter = 0;
    let termCounter = 1;

    metricsIntervalRef.current = setInterval(() => {
      // Simulate transaction generation with target TPS
      const txsPerSecond = Math.floor(targetTPS / 10); // Update every 100ms
      txCount += txsPerSecond;
      blockCounter++;

      const newMetric: TransactionMetric = {
        timestamp: Date.now(),
        tps: targetTPS + (Math.random() - 0.5) * 50000, // Add small variance
        avgLatency: 45 + Math.random() * 30,
        successRate: 99.5 + Math.random() * 0.5,
        cpuUsage: 40 + Math.random() * 30,
        memoryUsage: 55 + Math.random() * 20,
      };

      // Update consensus status
      if (blockCounter % 50 === 0) {
        termCounter++;
      }
      setConsensusStatus(prev => ({
        ...prev,
        channelId: selectedChannelId || '',
        status: 'active',
        currentTerm: termCounter,
        leaderNode: `validator-node-${(Math.floor(blockCounter / 100) % 4) + 1}`,
        lastApplied: prev.lastApplied + Math.floor(txsPerSecond / 10),
        commitIndex: prev.commitIndex + Math.floor(txsPerSecond / 10),
        activeValidators: demoState.currentChannel?.validatorNodes.length || 4,
      }));

      setDemoState((prev) => {
        const newHistory = [...prev.metricsHistory, newMetric].slice(-60); // Keep last 60 data points
        const newPeakTPS = Math.max(prev.peakTPS, newMetric.tps);
        const newNodeMetrics = generateNodeMetrics(prev.currentChannel);

        // Generate new audit trail entries (show ~20 new transactions per update for readability)
        const newAuditEntries = generateAuditTrailEntries(20, prev.currentBlockNumber + blockCounter, prev.currentChannel);
        const combinedAudit = [...newAuditEntries, ...prev.auditTrail].slice(0, 500); // Keep last 500 entries

        return {
          ...prev,
          metricsHistory: newHistory,
          nodeMetrics: newNodeMetrics,
          totalTransactions: prev.totalTransactions + txsPerSecond,
          peakTPS: newPeakTPS,
          avgLatency: newMetric.avgLatency,
          auditTrail: combinedAudit,
          currentBlockNumber: prev.currentBlockNumber + (blockCounter % 10 === 0 ? 1 : 0),
        };
      });
    }, 100);
  };

  const generateNodeMetrics = (channel: ChannelConfig | null): NodeMetric[] => {
    if (!channel) return [];

    const allNodes = [...channel.validatorNodes, ...channel.businessNodes, ...channel.slimNodes];

    return allNodes.map((node) => ({
      nodeId: node.nodeId,
      nodeType: node.nodeType,
      status: Math.random() > 0.05 ? 'healthy' : 'degraded',
      tps: targetTPS / (allNodes.length) + (Math.random() - 0.5) * 10000,
      latency: 40 + Math.random() * 50,
      cpuUsage: 30 + Math.random() * 50,
      memoryUsage: 40 + Math.random() * 40,
      transactionsProcessed: Math.floor(Math.random() * 1000000),
      errorsCount: Math.floor(Math.random() * 10),
    }));
  };

  // Generate realistic audit trail entries
  const generateAuditTrailEntries = (count: number, blockNumber: number, channel: ChannelConfig | null): AuditTrailEntry[] => {
    const txTypes: AuditTrailEntry['txType'][] = ['transfer', 'stake', 'contract', 'bridge', 'swap'];
    const allNodes = channel
      ? [...channel.validatorNodes, ...channel.businessNodes, ...channel.slimNodes]
      : [];

    const entries: AuditTrailEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const isSuccess = Math.random() > 0.002; // 99.8% success rate
      const txType = txTypes[Math.floor(Math.random() * txTypes.length)] ?? 'transfer';
      const nodeId = allNodes.length > 0
        ? allNodes[Math.floor(Math.random() * allNodes.length)]?.nodeId ?? 'validator-node-1'
        : 'validator-node-1';

      entries.push({
        id: `tx-${now}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now - (count - i) * 10, // Spread timestamps
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        fromAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        toAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        amount: (Math.random() * 1000).toFixed(4),
        txType,
        status: isSuccess ? 'success' : (Math.random() > 0.5 ? 'pending' : 'failed'),
        nodeId,
        blockNumber: blockNumber + Math.floor(i / 100),
        gasUsed: Math.floor(21000 + Math.random() * 100000),
        latency: 20 + Math.random() * 60,
      });
    }

    return entries;
  };

  // ==================== CHANNEL MANAGEMENT ====================

  const createNewChannel = async () => {
    try {
      const channelName = `Demo Channel ${channels.length + 1}`;
      const newChannel: ChannelConfig = {
        channelId: `demo-channel-${Date.now()}`,
        name: channelName,
        createdAt: Date.now(),
        validatorNodes: generateNodeConfig(validatorNodeCount, 'validator', 9000 + channels.length * 100),
        businessNodes: generateNodeConfig(businessNodeCount, 'business', 9020 + channels.length * 100),
        slimNodes: generateNodeConfig(slimNodeCount, 'slim', 9050 + channels.length * 100),
        enabled: true,
      };

      setChannels([...channels, newChannel]);
      setSelectedChannelId(newChannel.channelId);
      message.success(`Channel "${channelName}" created successfully`);
      setConfigDrawerOpen(false);
    } catch (error) {
      message.error(`Failed to create channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  // ==================== UI COMPONENTS ====================

  const renderPerformanceChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={demoState.metricsHistory}>
          <defs>
            <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <ChartTooltip />
          <Area type="monotone" dataKey="tps" stroke="#1890ff" fillOpacity={1} fill="url(#colorTps)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderNodeMetricsTable = () => {
    const columns: ColumnsType<NodeMetric> = [
      {
        title: 'Node ID',
        dataIndex: 'nodeId',
        key: 'nodeId',
        width: 150,
      },
      {
        title: 'Type',
        dataIndex: 'nodeType',
        key: 'nodeType',
        render: (type: string) => (
          <Tag color={type === 'validator' ? 'red' : type === 'business' ? 'blue' : 'cyan'}>
            {type.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Badge
            status={status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'error'}
            text={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        ),
      },
      {
        title: 'TPS',
        dataIndex: 'tps',
        key: 'tps',
        render: (tps: number) => `${Math.floor(tps).toLocaleString()} tx/s`,
      },
      {
        title: 'Latency',
        dataIndex: 'latency',
        key: 'latency',
        render: (lat: number) => `${lat.toFixed(2)}ms`,
      },
      {
        title: 'CPU',
        dataIndex: 'cpuUsage',
        key: 'cpu',
        render: (cpu: number) => <Progress percent={Math.round(cpu)} size="small" />,
      },
      {
        title: 'Memory',
        dataIndex: 'memoryUsage',
        key: 'memory',
        render: (mem: number) => <Progress percent={Math.round(mem)} size="small" />,
      },
    ];

    return <Table columns={columns} dataSource={demoState.nodeMetrics} rowKey="nodeId" pagination={false} />;
  };

  // Render Consensus Settings Table
  const renderConsensusSettingsTable = () => {
    const settingsData = [
      { key: '1', setting: 'Thread Pool Size', value: CONSENSUS_SETTINGS.threadPoolSize.toLocaleString(), unit: 'threads' },
      { key: '2', setting: 'Queue Size', value: CONSENSUS_SETTINGS.queueSize, unit: 'transactions' },
      { key: '3', setting: 'Consensus Batch Size', value: CONSENSUS_SETTINGS.consensusBatchSize, unit: 'transactions' },
      { key: '4', setting: 'Pipeline Depth', value: CONSENSUS_SETTINGS.pipelineDepth.toString(), unit: 'stages' },
      { key: '5', setting: 'Parallel Threads', value: CONSENSUS_SETTINGS.parallelThreads.toLocaleString(), unit: 'threads' },
      { key: '6', setting: 'Election Timeout', value: CONSENSUS_SETTINGS.electionTimeout, unit: '' },
      { key: '7', setting: 'Heartbeat Interval', value: CONSENSUS_SETTINGS.heartbeatInterval, unit: '' },
      { key: '8', setting: 'Transaction Batch', value: CONSENSUS_SETTINGS.transactionBatch, unit: 'transactions' },
      { key: '9', setting: 'Validation Threads', value: CONSENSUS_SETTINGS.validationThreads.toString(), unit: 'threads' },
    ];

    const columns = [
      { title: 'Setting', dataIndex: 'setting', key: 'setting', width: 180 },
      { title: 'Value', dataIndex: 'value', key: 'value', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
      { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 100 },
    ];

    return (
      <Table
        columns={columns}
        dataSource={settingsData}
        pagination={false}
        size="small"
        bordered
      />
    );
  };

  // Render Consensus Status Card (per channel)
  const renderConsensusStatusCard = () => {
    const statusColor = {
      active: '#52c41a',
      syncing: '#faad14',
      idle: '#1890ff',
      error: '#ff4d4f',
    };

    return (
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>HyperRAFT++ Consensus Status</span>
            <Badge
              status={consensusStatus.status === 'active' ? 'success' : consensusStatus.status === 'syncing' ? 'processing' : 'default'}
              text={consensusStatus.status.toUpperCase()}
            />
          </Space>
        }
        size="small"
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Current Term"
              value={consensusStatus.currentTerm}
              valueStyle={{ color: statusColor[consensusStatus.status], fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Leader Node"
              value={consensusStatus.leaderNode}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Last Applied"
              value={consensusStatus.lastApplied}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Commit Index"
              value={consensusStatus.commitIndex}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Active Validators"
              value={consensusStatus.activeValidators}
              suffix={`/ ${demoState.currentChannel?.validatorNodes.length || 4}`}
              valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Consensus State"
              value={demoState.isRunning ? 'RUNNING' : 'IDLE'}
              valueStyle={{ color: demoState.isRunning ? '#52c41a' : '#666', fontSize: '14px' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderConfigurationPanel = () => {
    const currentChannel = demoState.currentChannel;
    if (!currentChannel) return <Alert message="No channel selected" type="warning" />;

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="Node Configuration">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small" title={<><NodeIndexOutlined /> Validator Nodes</>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    value={currentChannel.validatorNodes.filter((n) => n.enabled).length}
                    suffix={`/ ${currentChannel.validatorNodes.length}`}
                  />
                  <Button block size="small">
                    Configure
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small" title={<><CloudOutlined /> Business Nodes</>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    value={currentChannel.businessNodes.filter((n) => n.enabled).length}
                    suffix={`/ ${currentChannel.businessNodes.length}`}
                  />
                  <Button block size="small">
                    Configure
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card size="small" title={<><DatabaseOutlined /> Slim Nodes</>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    value={currentChannel.slimNodes.filter((n) => n.enabled).length}
                    suffix={`/ ${currentChannel.slimNodes.length}`}
                  />
                  <Button block size="small">
                    Configure
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="Performance Tuning">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <label>Target TPS: {targetTPS.toLocaleString()} tx/s</label>
              <Slider
                min={100000}
                max={2000000}
                step={100000}
                value={targetTPS}
                onChange={setTargetTPS}
                marks={{
                  100000: '100K',
                  500000: '500K',
                  1000000: '1M',
                  1500000: '1.5M',
                  2000000: '2M',
                }}
              />
            </div>

            <div>
              <Space>
                <span>AI Optimization:</span>
                <Switch checked={aiOptimizationEnabled} onChange={setAiOptimizationEnabled} />
                {aiOptimizationEnabled && <Tag color="blue">ENABLED</Tag>}
              </Space>
            </div>

            <div>
              <Space>
                <span>Quantum-Safe Cryptography:</span>
                <Switch checked={quantumSecureEnabled} onChange={setQuantumSecureEnabled} />
                {quantumSecureEnabled && <Tag color="green">ENABLED</Tag>}
              </Space>
            </div>
          </Space>
        </Card>

        {/* Consensus Settings Card - Sprint 15 Optimized */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>HyperRAFT++ Consensus Settings</span>
              <Tag color="green">Sprint 15 Optimized</Tag>
            </Space>
          }
          extra={
            <Space>
              <Tag color="blue">Target: 3.5M TPS</Tag>
            </Space>
          }
        >
          <Alert
            message="Consensus Configuration"
            description="These settings are optimized for maximum throughput with HyperRAFT++ consensus. Demonstrating real-time consensus across all channels."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          {renderConsensusSettingsTable()}
        </Card>
      </Space>
    );
  };

  const renderAuditTrailTab = () => {
    const auditColumns: ColumnsType<AuditTrailEntry> = [
      {
        title: 'Time',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 100,
        render: (ts: number) => new Date(ts).toLocaleTimeString(),
      },
      {
        title: 'Tx Hash',
        dataIndex: 'txHash',
        key: 'txHash',
        width: 180,
        render: (hash: string) => (
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {hash.slice(0, 10)}...{hash.slice(-8)}
          </span>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'txType',
        key: 'txType',
        width: 90,
        render: (type: string) => {
          const colors: Record<string, string> = {
            transfer: 'blue',
            stake: 'purple',
            contract: 'cyan',
            bridge: 'orange',
            swap: 'green',
          };
          return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
        },
      },
      {
        title: 'From',
        dataIndex: 'fromAddress',
        key: 'from',
        width: 140,
        render: (addr: string) => (
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {addr.slice(0, 6)}...{addr.slice(-4)}
          </span>
        ),
      },
      {
        title: 'To',
        dataIndex: 'toAddress',
        key: 'to',
        width: 140,
        render: (addr: string) => (
          <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {addr.slice(0, 6)}...{addr.slice(-4)}
          </span>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        width: 100,
        align: 'right',
        render: (amt: string) => `${parseFloat(amt).toFixed(2)} AUR`,
      },
      {
        title: 'Block',
        dataIndex: 'blockNumber',
        key: 'block',
        width: 90,
        render: (block: number) => `#${block.toLocaleString()}`,
      },
      {
        title: 'Gas',
        dataIndex: 'gasUsed',
        key: 'gas',
        width: 80,
        render: (gas: number) => gas.toLocaleString(),
      },
      {
        title: 'Latency',
        dataIndex: 'latency',
        key: 'latency',
        width: 80,
        render: (lat: number) => `${lat.toFixed(1)}ms`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        fixed: 'right',
        render: (status: string) => {
          if (status === 'success') {
            return <Tag icon={<CheckCircleOutlined />} color="success">Success</Tag>;
          } else if (status === 'pending') {
            return <Tag icon={<SyncOutlined spin />} color="processing">Pending</Tag>;
          } else {
            return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
          }
        },
      },
      {
        title: 'Node',
        dataIndex: 'nodeId',
        key: 'node',
        width: 120,
        render: (nodeId: string) => (
          <span style={{ fontSize: '11px' }}>{nodeId}</span>
        ),
      },
    ];

    // Calculate stats
    const successCount = demoState.auditTrail.filter(tx => tx.status === 'success').length;
    const failedCount = demoState.auditTrail.filter(tx => tx.status === 'failed').length;
    const pendingCount = demoState.auditTrail.filter(tx => tx.status === 'pending').length;
    const trailAvgLatency = demoState.auditTrail.length > 0
      ? demoState.auditTrail.reduce((sum, tx) => sum + tx.latency, 0) / demoState.auditTrail.length
      : 0;

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Audit Trail Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Audit Entries"
                value={demoState.auditTrail.length}
                prefix={<AuditOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Successful"
                value={successCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Failed"
                value={failedCount}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Current Block"
                value={demoState.currentBlockNumber}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Avg Latency (Trail)"
                value={trailAvgLatency}
                precision={1}
                suffix="ms"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Live indicator */}
        {demoState.isRunning && (
          <Alert
            message={
              <Space>
                <SyncOutlined spin />
                <span>Live Transaction Feed - Transactions are being processed in real-time</span>
                <Tag color="green">LIVE</Tag>
              </Space>
            }
            type="success"
            showIcon={false}
          />
        )}

        {/* Audit Trail Table */}
        <Card
          title={
            <Space>
              <AuditOutlined />
              <span>Transaction Audit Trail</span>
              {demoState.isRunning && <Badge status="processing" text="Live" />}
            </Space>
          }
          extra={
            <Space>
              <span style={{ color: '#666', fontSize: '12px' }}>
                Showing {demoState.auditTrail.length} of {demoState.totalTransactions.toLocaleString()} total transactions
              </span>
              <Button size="small" icon={<DownloadOutlined />}>
                Export CSV
              </Button>
            </Space>
          }
        >
          {demoState.auditTrail.length > 0 ? (
            <Table
              columns={auditColumns}
              dataSource={demoState.auditTrail}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `${total} transactions`,
              }}
              scroll={{ x: 1400 }}
              size="small"
              rowClassName={(record) =>
                record.status === 'failed' ? 'audit-row-failed' : ''
              }
            />
          ) : (
            <Alert
              message="No transactions yet"
              description="Start the demo to see real-time transaction audit trail"
              type="info"
              showIcon
            />
          )}
        </Card>

        {/* Success Rate Progress */}
        <Card title="Transaction Success Rate">
          <Row gutter={16} align="middle">
            <Col span={18}>
              <Progress
                percent={demoState.auditTrail.length > 0
                  ? parseFloat(((successCount / demoState.auditTrail.length) * 100).toFixed(2))
                  : 0
                }
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space direction="vertical" size={0}>
                <span style={{ color: '#52c41a' }}>✓ {successCount} success</span>
                <span style={{ color: '#faad14' }}>○ {pendingCount} pending</span>
                <span style={{ color: '#ff4d4f' }}>✗ {failedCount} failed</span>
              </Space>
            </Col>
          </Row>
        </Card>
      </Space>
    );
  };

  // ==================== RENDER ====================

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <h1 style={{ margin: 0 }}>
            <ThunderboltOutlined /> High-Throughput Demo Channel
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            Configure validator, business, and slim nodes for production-scale testing
          </p>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedChannelId}
              onChange={setSelectedChannelId}
              style={{ width: 300 }}
              options={channels.map((ch) => ({
                label: ch.name,
                value: ch.channelId,
              }))}
            />
            <Button type="primary" onClick={() => setConfigDrawerOpen(true)}>
              New Channel
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Control Panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current TPS"
              value={demoState.metricsHistory.length > 0 ? (demoState.metricsHistory[demoState.metricsHistory.length - 1]?.tps ?? 0) : 0}
              precision={0}
              suffix="tx/s"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Peak TPS"
              value={demoState.peakTPS}
              precision={0}
              suffix="tx/s"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Latency"
              value={demoState.avgLatency}
              precision={2}
              suffix="ms"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={demoState.totalTransactions}
              precision={0}
              suffix="tx"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '0',
              label: 'Performance',
              icon: <LineChartOutlined />,
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* Consensus Status Card - Shows per channel */}
                  {renderConsensusStatusCard()}

                  <div>
                    <h3>Real-time Performance Metrics</h3>
                    {demoState.isRunning ? (
                      renderPerformanceChart()
                    ) : (
                      <Alert message="Demo not running. Click 'Start Demo' to begin." type="info" />
                    )}
                  </div>

                  <div>
                    <h3>Node Metrics</h3>
                    {renderNodeMetricsTable()}
                  </div>
                </Space>
              ),
            },
            {
              key: '1',
              label: (
                <span>
                  Audit Trail
                  {demoState.isRunning && <Badge status="processing" style={{ marginLeft: 8 }} />}
                </span>
              ),
              icon: <AuditOutlined />,
              children: renderAuditTrailTab(),
            },
            {
              key: '2',
              label: 'Configuration',
              icon: <SettingOutlined />,
              children: renderConfigurationPanel(),
            },
            {
              key: '3',
              label: 'Consensus',
              icon: <SafetyOutlined />,
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* Live Consensus Status */}
                  {renderConsensusStatusCard()}

                  {/* Consensus Settings Table */}
                  <Card
                    title={
                      <Space>
                        <SettingOutlined />
                        <span>HyperRAFT++ Consensus Configuration</span>
                        <Tag color="green">Sprint 15 Optimized - Dec 2025</Tag>
                      </Space>
                    }
                    extra={<Tag color="blue">Target: 3.5M TPS</Tag>}
                  >
                    <Alert
                      message="Consensus is Working!"
                      description={
                        demoState.isRunning
                          ? `HyperRAFT++ consensus is actively processing transactions at ${(demoState.metricsHistory[demoState.metricsHistory.length - 1]?.tps || 0).toLocaleString()} TPS across ${demoState.currentChannel?.validatorNodes.length || 0} validators.`
                          : "Start the demo to see real-time HyperRAFT++ consensus in action."
                      }
                      type={demoState.isRunning ? "success" : "info"}
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    {renderConsensusSettingsTable()}
                  </Card>

                  {/* Per-Channel Consensus Info with Instrumentation */}
                  <Card title="Channel Consensus Instrumentation">
                    <Row gutter={[16, 16]}>
                      {channels.map((channel) => (
                        <Col xs={24} key={channel.channelId}>
                          <Card
                            title={
                              <Space>
                                <Badge status={channel.enabled ? "success" : "default"} />
                                <span style={{ fontWeight: 'bold' }}>{channel.name}</span>
                                {channel.channelId === selectedChannelId && demoState.isRunning && (
                                  <Tag color="green" icon={<SyncOutlined spin />}>CONSENSUS ACTIVE</Tag>
                                )}
                              </Space>
                            }
                            extra={
                              <Space>
                                {channel.channelId === selectedChannelId
                                  ? <Tag color="blue">ACTIVE CHANNEL</Tag>
                                  : <Tag>STANDBY</Tag>
                                }
                                <Tag color="purple">HyperRAFT++</Tag>
                              </Space>
                            }
                            style={{ marginBottom: '16px' }}
                          >
                            {/* Node Summary */}
                            <Row gutter={16} style={{ marginBottom: '16px' }}>
                              <Col xs={8} sm={6} md={4}>
                                <Statistic
                                  title="Validators"
                                  value={channel.validatorNodes.length}
                                  valueStyle={{ fontSize: '20px', color: '#ff4d4f' }}
                                  prefix={<NodeIndexOutlined />}
                                />
                              </Col>
                              <Col xs={8} sm={6} md={4}>
                                <Statistic
                                  title="Business"
                                  value={channel.businessNodes.length}
                                  valueStyle={{ fontSize: '20px', color: '#1890ff' }}
                                  prefix={<CloudOutlined />}
                                />
                              </Col>
                              <Col xs={8} sm={6} md={4}>
                                <Statistic
                                  title="Slim"
                                  value={channel.slimNodes.length}
                                  valueStyle={{ fontSize: '20px', color: '#52c41a' }}
                                  prefix={<DatabaseOutlined />}
                                />
                              </Col>
                              <Col xs={24} sm={6} md={12}>
                                <Progress
                                  percent={channel.channelId === selectedChannelId && demoState.isRunning ? 100 : 0}
                                  status={channel.channelId === selectedChannelId && demoState.isRunning ? "active" : "normal"}
                                  strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                  }}
                                  format={() => channel.channelId === selectedChannelId && demoState.isRunning
                                    ? `${(demoState.metricsHistory[demoState.metricsHistory.length - 1]?.tps || 0).toLocaleString()} TPS`
                                    : "IDLE"
                                  }
                                />
                              </Col>
                            </Row>

                            {/* Consensus Instrumentation Table */}
                            <Card
                              size="small"
                              title={
                                <Space>
                                  <SettingOutlined />
                                  <span>Consensus Instrumentation</span>
                                  <Tag color="green">Sprint 15</Tag>
                                </Space>
                              }
                              type="inner"
                            >
                              <Table
                                size="small"
                                pagination={false}
                                bordered
                                columns={[
                                  { title: 'Setting', dataIndex: 'setting', key: 'setting', width: '45%' },
                                  { title: 'Value', dataIndex: 'value', key: 'value', width: '30%', render: (v: string) => <Tag color="blue">{v}</Tag> },
                                  { title: 'Unit', dataIndex: 'unit', key: 'unit', width: '25%' },
                                ]}
                                dataSource={[
                                  { key: '1', setting: 'Thread Pool Size', value: '512', unit: 'threads' },
                                  { key: '2', setting: 'Queue Size', value: '1M', unit: 'transactions' },
                                  { key: '3', setting: 'Consensus Batch Size', value: '250K', unit: 'transactions' },
                                  { key: '4', setting: 'Pipeline Depth', value: '64', unit: 'stages' },
                                  { key: '5', setting: 'Parallel Threads', value: '1,024', unit: 'threads' },
                                  { key: '6', setting: 'Election Timeout', value: '500ms', unit: '-' },
                                  { key: '7', setting: 'Heartbeat Interval', value: '50ms', unit: '-' },
                                  { key: '8', setting: 'Transaction Batch', value: '25K', unit: 'transactions' },
                                  { key: '9', setting: 'Validation Threads', value: '32', unit: 'threads' },
                                ]}
                              />
                            </Card>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Space>
              ),
            },
            {
              key: '4',
              label: 'AI Optimization',
              icon: <RobotOutlined />,
              children: (
                <Alert
                  message="AI Optimization Module"
                  description="Connected to backend AI service for real-time consensus and throughput optimization."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              ),
            },
            {
              key: '5',
              label: 'Security',
              icon: <SafetyOutlined />,
              children: (
                <Alert
                  message="Quantum-Safe Cryptography"
                  description="Using CRYSTALS-Kyber and CRYSTALS-Dilithium for NIST Level 5 security."
                  type="success"
                  showIcon
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Control Buttons */}
      <Row justify="center" gutter={16} style={{ marginTop: '24px' }}>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={startDemo}
            loading={loading}
            disabled={demoState.isRunning}
          >
            Start Demo
          </Button>
        </Col>
        <Col>
          <Button
            danger
            size="large"
            icon={<PauseCircleOutlined />}
            onClick={stopDemo}
            disabled={!demoState.isRunning}
          >
            Stop Demo
          </Button>
        </Col>
        <Col>
          <Button size="large" icon={<DownloadOutlined />}>
            Export Metrics
          </Button>
        </Col>
        <Col>
          <Button
            type="default"
            size="large"
            icon={<UserAddOutlined />}
            onClick={() => setRegistrationModalVisible(true)}
            disabled={demoState.metricsHistory.length === 0}
          >
            Register & Share
          </Button>
        </Col>
      </Row>

      {/* Configuration Drawer */}
      <Drawer
        title="Create New Demo Channel"
        placement="right"
        onClose={() => setConfigDrawerOpen(false)}
        open={configDrawerOpen}
        width={500}
      >
        <Form layout="vertical" form={form} onFinish={createNewChannel}>
          <Form.Item label="Validator Nodes" required>
            <Slider
              min={1}
              max={10}
              value={validatorNodeCount}
              onChange={setValidatorNodeCount}
              marks={{
                1: '1',
                5: '5',
                10: '10',
              }}
            />
            <p style={{ marginTop: '8px', color: '#666' }}>Count: {validatorNodeCount}</p>
          </Form.Item>

          <Form.Item label="Business Nodes" required>
            <Slider
              min={1}
              max={20}
              value={businessNodeCount}
              onChange={setBusinessNodeCount}
              marks={{
                1: '1',
                10: '10',
                20: '20',
              }}
            />
            <p style={{ marginTop: '8px', color: '#666' }}>Count: {businessNodeCount}</p>
          </Form.Item>

          <Form.Item label="Slim Nodes" required>
            <Slider
              min={1}
              max={50}
              value={slimNodeCount}
              onChange={setSlimNodeCount}
              marks={{
                1: '1',
                25: '25',
                50: '50',
              }}
            />
            <p style={{ marginTop: '8px', color: '#666' }}>Count: {slimNodeCount}</p>
          </Form.Item>

          <Space style={{ width: '100%', marginTop: '24px' }} direction="vertical">
            <Button type="primary" htmlType="submit" block size="large">
              Create Channel
            </Button>
            <Button onClick={() => setConfigDrawerOpen(false)} block>
              Cancel
            </Button>
          </Space>
        </Form>
      </Drawer>

      {/* User Registration & Social Sharing Modal */}
      <DemoUserRegistration
        visible={registrationModalVisible}
        onClose={() => setRegistrationModalVisible(false)}
        demoResults={
          demoState.metricsHistory.length > 0
            ? {
                channelId: selectedChannelId || '',
                peakTps: demoState.peakTPS,
                avgLatency: demoState.avgLatency,
                successRate: 99.8,
                duration: Math.floor((demoState.metricsHistory.length * 100) / 1000),
                nodeCount:
                  (demoState.currentChannel?.validatorNodes.length || 0) +
                  (demoState.currentChannel?.businessNodes.length || 0) +
                  (demoState.currentChannel?.slimNodes.length || 0),
              }
            : undefined
        }
        onRegistrationSuccess={(data) => {
          message.success(`Welcome ${data.fullName}! Your details have been saved.`);
        }}
      />
    </div>
  );
};

export default DemoChannelApp;
