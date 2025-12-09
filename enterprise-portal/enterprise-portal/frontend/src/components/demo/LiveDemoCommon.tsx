/**
 * Live Demo Common Components
 *
 * Reusable UI components for all live demo pages
 * Provides consistent styling and behavior across demo applications
 *
 * @version 1.0.0
 * @author Aurigraph DLT Team
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Table,
  Typography,
  Button,
  Space,
  Tooltip,
  Badge,
  Alert,
  Spin,
  Switch,
} from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  WifiOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

// ============================================================================
// TYPES
// ============================================================================

export interface DemoMetrics {
  tps: number;
  peakTps: number;
  avgLatency: number;
  successRate: number;
  totalTransactions: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export interface NodeStatus {
  id: string;
  name: string;
  type: 'validator' | 'business' | 'slim';
  status: 'healthy' | 'degraded' | 'offline';
  tps: number;
  latency: number;
  lastSeen: number;
}

export interface Transaction {
  id: string;
  hash: string;
  type: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

export interface ExternalAPIData {
  source: 'quantconnect' | 'weather' | 'news' | 'oracle';
  data: Record<string, any>;
  timestamp: number;
  status: 'live' | 'simulated' | 'error';
}

// ============================================================================
// LIVE DEMO METRICS DISPLAY
// ============================================================================

export interface LiveDemoMetricsProps {
  metrics: DemoMetrics;
  isLive?: boolean;
  loading?: boolean;
}

export const LiveDemoMetrics: React.FC<LiveDemoMetricsProps> = ({
  metrics,
  isLive = false,
  loading = false,
}) => {
  const formatTPS = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>Performance Metrics</span>
          {isLive ? (
            <Tag color="green" icon={<ApiOutlined />}>LIVE</Tag>
          ) : (
            <Tag color="orange" icon={<ExperimentOutlined />}>SIMULATED</Tag>
          )}
        </Space>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Current TPS"
            value={formatTPS(metrics.tps)}
            prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Peak TPS"
            value={formatTPS(metrics.peakTps)}
            prefix={<LineChartOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Avg Latency"
            value={metrics.avgLatency.toFixed(1)}
            suffix="ms"
            prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Success Rate"
            value={metrics.successRate.toFixed(2)}
            suffix="%"
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: metrics.successRate >= 99 ? '#52c41a' : '#ff4d4f' }}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Total Transactions"
            value={metrics.totalTransactions.toLocaleString()}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={12} sm={8} md={6}>
          <div>
            <Text type="secondary">Memory Usage</Text>
            <Progress
              percent={metrics.memoryUsage}
              status={metrics.memoryUsage > 80 ? 'exception' : 'active'}
              size="small"
            />
          </div>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <div>
            <Text type="secondary">CPU Usage</Text>
            <Progress
              percent={metrics.cpuUsage}
              status={metrics.cpuUsage > 80 ? 'exception' : 'active'}
              size="small"
            />
          </div>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title="Uptime"
            value={Math.floor(metrics.uptime / 60)}
            suffix="min"
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );
};

// ============================================================================
// DEMO CONTROLS
// ============================================================================

export interface LiveDemoControlsProps {
  isRunning: boolean;
  isLiveMode: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset?: () => void;
  onToggleLiveMode?: (isLive: boolean) => void;
  targetTPS?: number;
  onTargetTPSChange?: (tps: number) => void;
  loading?: boolean;
}

export const LiveDemoControls: React.FC<LiveDemoControlsProps> = ({
  isRunning,
  isLiveMode,
  onStart,
  onStop,
  onReset,
  onToggleLiveMode,
  targetTPS = 1000000,
  onTargetTPSChange,
  loading = false,
}) => {
  return (
    <Card
      title={
        <Space>
          <NodeIndexOutlined />
          <span>Demo Controls</span>
          {isRunning && <Badge status="processing" text="Running" />}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Row gutter={16} align="middle">
          <Col>
            <Button
              type="primary"
              size="large"
              icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={isRunning ? onStop : onStart}
              loading={loading}
              danger={isRunning}
            >
              {isRunning ? 'Stop Demo' : 'Start Demo'}
            </Button>
          </Col>
          {onReset && (
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={onReset}
                disabled={isRunning}
              >
                Reset
              </Button>
            </Col>
          )}
          {onToggleLiveMode && (
            <Col>
              <Space>
                <Text>Live Mode:</Text>
                <Tooltip title={isLiveMode ? 'Using real API data' : 'Using simulated data'}>
                  <Switch
                    checked={isLiveMode}
                    onChange={onToggleLiveMode}
                    checkedChildren="Live"
                    unCheckedChildren="Sim"
                  />
                </Tooltip>
              </Space>
            </Col>
          )}
        </Row>

        {!isLiveMode && (
          <Alert
            message="Simulation Mode Active"
            description="Demo is using simulated data. Toggle 'Live Mode' to connect to real backend APIs."
            type="warning"
            showIcon
            icon={<ExperimentOutlined />}
          />
        )}
      </Space>
    </Card>
  );
};

// ============================================================================
// NODE STATUS DISPLAY
// ============================================================================

export interface LiveDemoNodeStatusProps {
  nodes: NodeStatus[];
  loading?: boolean;
}

export const LiveDemoNodeStatus: React.FC<LiveDemoNodeStatusProps> = ({
  nodes,
  loading = false,
}) => {
  const getStatusColor = (status: NodeStatus['status']) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'orange';
      case 'offline': return 'red';
      default: return 'default';
    }
  };

  const getTypeColor = (type: NodeStatus['type']) => {
    switch (type) {
      case 'validator': return 'blue';
      case 'business': return 'purple';
      case 'slim': return 'cyan';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Node',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: NodeStatus) => (
        <Space>
          <Badge status={record.status === 'healthy' ? 'success' : record.status === 'degraded' ? 'warning' : 'error'} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: NodeStatus['type']) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: NodeStatus['status']) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'TPS',
      dataIndex: 'tps',
      key: 'tps',
      render: (tps: number) => tps.toLocaleString(),
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: number) => `${latency.toFixed(1)}ms`,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <CloudServerOutlined />
          <span>Node Status</span>
          <Tag color="blue">{nodes.length} nodes</Tag>
        </Space>
      }
    >
      <Table
        dataSource={nodes}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        loading={loading}
      />
    </Card>
  );
};

// ============================================================================
// TRANSACTION FEED
// ============================================================================

export interface LiveDemoTransactionFeedProps {
  transactions: Transaction[];
  maxItems?: number;
  loading?: boolean;
}

export const LiveDemoTransactionFeed: React.FC<LiveDemoTransactionFeedProps> = ({
  transactions,
  maxItems = 10,
  loading = false,
}) => {
  const displayTransactions = transactions.slice(0, maxItems);

  const columns = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Text code copyable={{ text: hash }}>
            {hash.substring(0, 10)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: (from: string) => (
        <Text code>{from.substring(0, 8)}...</Text>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: (to: string) => (
        <Text code>{to.substring(0, 8)}...</Text>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `${value.toLocaleString()} AUR`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Transaction['status']) => (
        <Tag color={status === 'success' ? 'green' : status === 'pending' ? 'blue' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>Live Transaction Feed</span>
          {loading && <Spin size="small" />}
        </Space>
      }
    >
      <Table
        dataSource={displayTransactions}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        loading={loading}
      />
    </Card>
  );
};

// ============================================================================
// EXTERNAL API DATA DISPLAY
// ============================================================================

export interface LiveDemoAPIDataProps {
  apiData: ExternalAPIData[];
  loading?: boolean;
}

export const LiveDemoAPIData: React.FC<LiveDemoAPIDataProps> = ({
  apiData,
  loading = false,
}) => {
  const getSourceIcon = (source: ExternalAPIData['source']) => {
    switch (source) {
      case 'quantconnect': return <LineChartOutlined />;
      case 'weather': return <CloudServerOutlined />;
      case 'news': return <WifiOutlined />;
      case 'oracle': return <ApiOutlined />;
      default: return <DatabaseOutlined />;
    }
  };

  const getSourceColor = (source: ExternalAPIData['source']) => {
    switch (source) {
      case 'quantconnect': return '#6366f1';
      case 'weather': return '#06b6d4';
      case 'news': return '#8b5cf6';
      case 'oracle': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <Card
      title={
        <Space>
          <ApiOutlined />
          <span>External API Data</span>
        </Space>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {apiData.map((api, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              size="small"
              style={{ borderColor: getSourceColor(api.source) }}
              title={
                <Space>
                  {getSourceIcon(api.source)}
                  <Text strong style={{ textTransform: 'capitalize' }}>{api.source}</Text>
                  <Tag color={api.status === 'live' ? 'green' : api.status === 'simulated' ? 'orange' : 'red'}>
                    {api.status.toUpperCase()}
                  </Tag>
                </Space>
              }
            >
              <pre style={{ fontSize: '11px', margin: 0, maxHeight: 100, overflow: 'auto' }}>
                {JSON.stringify(api.data, null, 2)}
              </pre>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Updated: {new Date(api.timestamp).toLocaleTimeString()}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

// ============================================================================
// CONSENSUS STATUS DISPLAY
// ============================================================================

export interface ConsensusStatus {
  term: number;
  leaderId: string;
  commitIndex: number;
  lastApplied: number;
  state: 'leader' | 'follower' | 'candidate';
  voters: number;
  quorum: boolean;
}

export interface LiveDemoConsensusProps {
  consensus: ConsensusStatus;
  isLive?: boolean;
  loading?: boolean;
}

export const LiveDemoConsensus: React.FC<LiveDemoConsensusProps> = ({
  consensus,
  isLive = false,
  loading = false,
}) => {
  const getStateColor = (state: ConsensusStatus['state']) => {
    switch (state) {
      case 'leader': return 'green';
      case 'follower': return 'blue';
      case 'candidate': return 'orange';
      default: return 'default';
    }
  };

  return (
    <Card
      title={
        <Space>
          <NodeIndexOutlined />
          <span>HyperRAFT++ Consensus</span>
          {isLive ? (
            <Tag color="green">LIVE</Tag>
          ) : (
            <Tag color="orange">SIMULATED</Tag>
          )}
        </Space>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Term" value={consensus.term} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Commit Index" value={consensus.commitIndex} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Last Applied" value={consensus.lastApplied} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="Voters" value={consensus.voters} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <div>
            <Text type="secondary">State</Text>
            <div>
              <Tag color={getStateColor(consensus.state)} style={{ marginTop: 8 }}>
                {consensus.state.toUpperCase()}
              </Tag>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <div>
            <Text type="secondary">Quorum</Text>
            <div>
              <Tag color={consensus.quorum ? 'green' : 'red'} style={{ marginTop: 8 }}>
                {consensus.quorum ? 'ACHIEVED' : 'NOT MET'}
              </Tag>
            </div>
          </div>
        </Col>
        <Col xs={24}>
          <Text type="secondary">Leader ID: </Text>
          <Text code copyable>{consensus.leaderId}</Text>
        </Col>
      </Row>
    </Card>
  );
};

// ============================================================================
// DEMO HEADER
// ============================================================================

export interface LiveDemoHeaderProps {
  title: string;
  subtitle?: string;
  isRunning: boolean;
  isLive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const LiveDemoHeader: React.FC<LiveDemoHeaderProps> = ({
  title,
  subtitle,
  isRunning,
  isLive,
  onStart,
  onStop,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <Space>
              <ThunderboltOutlined />
              {title}
              {isLive ? (
                <Tag color="green" icon={<ApiOutlined />}>LIVE</Tag>
              ) : (
                <Tag color="orange" icon={<ExperimentOutlined />}>SIMULATION</Tag>
              )}
            </Space>
          </Title>
          {subtitle && <Text type="secondary">{subtitle}</Text>}
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={isRunning ? onStop : onStart}
            danger={isRunning}
          >
            {isRunning ? 'Stop Demo' : 'Start Demo'}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

// Export all components
export default {
  LiveDemoMetrics,
  LiveDemoControls,
  LiveDemoNodeStatus,
  LiveDemoTransactionFeed,
  LiveDemoAPIData,
  LiveDemoConsensus,
  LiveDemoHeader,
};
