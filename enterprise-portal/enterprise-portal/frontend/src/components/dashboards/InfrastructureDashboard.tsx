/**
 * Infrastructure Monitoring Dashboard Component
 *
 * Displays real-time infrastructure status:
 * - Local and remote server health
 * - Docker container status
 * - System metrics (CPU, memory, disk)
 * - Service port status
 * - Deployment triggers
 *
 * @author Aurigraph DLT - Infrastructure Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Tag,
  Badge,
  Space,
  Tooltip,
  Typography,
  Progress,
  Alert,
  Button,
  Tabs,
  Divider,
  List,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  CloudServerOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DatabaseOutlined,
  HddOutlined,
  ApiOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  DesktopOutlined,
  ReloadOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// ============================================================================
// Type Definitions
// ============================================================================

export type ServerHealth = 'healthy' | 'degraded' | 'unhealthy';
export type ServerStatus = 'online' | 'offline';

export interface Server {
  id: string;
  host: string;
  port: number;
  health: ServerHealth;
  status: ServerStatus;
  latency: number;
  httpStatus: number;
  message: string;
  lastCheck: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
  cpu: string;
  memory: string;
  memoryLimit: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number;
    model: string;
  };
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapMax: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  hostname: string;
  timestamp: string;
}

export interface InfrastructureOverview {
  environment: {
    hostname: string;
    os: string;
    osVersion: string;
    javaVersion: string;
    javaVendor: string;
    timezone: string;
    locale: string;
  };
  resources: {
    cpuCores: number;
    cpuLoad: number;
    heapUsed: number;
    heapMax: number;
    memoryUsed: number;
    memoryTotal: number;
  };
  servers: {
    list: Server[];
    healthy: number;
    total: number;
  };
  uptime: {
    milliseconds: number;
    formatted: string;
  };
  timestamp: string;
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = '/api/v12/infrastructure';

async function fetchOverview(): Promise<InfrastructureOverview> {
  const response = await fetch(`${API_BASE}/overview`);
  if (!response.ok) throw new Error('Failed to fetch overview');
  return response.json();
}

async function fetchServers(): Promise<{ servers: Server[]; summary: any }> {
  const response = await fetch(`${API_BASE}/servers`);
  if (!response.ok) throw new Error('Failed to fetch servers');
  return response.json();
}

async function fetchContainers(): Promise<{ containers: Container[]; total: number; running: number }> {
  const response = await fetch(`${API_BASE}/docker/containers`);
  if (!response.ok) throw new Error('Failed to fetch containers');
  return response.json();
}

async function fetchMetrics(): Promise<SystemMetrics> {
  const response = await fetch(`${API_BASE}/metrics`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

async function triggerDeployment(profile: string): Promise<any> {
  const response = await fetch(`${API_BASE}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  });
  return response.json();
}

// ============================================================================
// Helper Components
// ============================================================================

const HealthBadge: React.FC<{ health: ServerHealth }> = ({ health }) => {
  const config = {
    healthy: { color: 'success', icon: <CheckCircleOutlined />, text: 'Healthy' },
    degraded: { color: 'warning', icon: <ExclamationCircleOutlined />, text: 'Degraded' },
    unhealthy: { color: 'error', icon: <CloseCircleOutlined />, text: 'Unhealthy' },
  };
  const { color, icon, text } = config[health] || config.unhealthy;
  return (
    <Tag color={color} icon={icon}>
      {text}
    </Tag>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isOnline = status === 'online' || status === 'running';
  return (
    <Badge
      status={isOnline ? 'success' : 'error'}
      text={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  percentage?: number;
}> = ({ title, value, suffix, icon, color, percentage }) => (
  <Card size="small" style={{ height: '100%' }}>
    <Statistic
      title={
        <Space>
          {icon}
          {title}
        </Space>
      }
      value={value}
      suffix={suffix}
      valueStyle={{ color }}
    />
    {percentage !== undefined && (
      <Progress
        percent={Math.round(percentage)}
        size="small"
        strokeColor={percentage > 80 ? '#ff4d4f' : percentage > 60 ? '#faad14' : '#52c41a'}
        showInfo={false}
      />
    )}
  </Card>
);

// ============================================================================
// Main Component
// ============================================================================

const InfrastructureDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<InfrastructureOverview | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [overviewData, serversData, containersData, metricsData] = await Promise.all([
        fetchOverview(),
        fetchServers(),
        fetchContainers(),
        fetchMetrics(),
      ]);
      setOverview(overviewData);
      setServers(serversData.servers);
      setContainers(containersData.containers);
      setMetrics(metricsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDeploy = async (profile: string) => {
    setDeploying(true);
    try {
      const result = await triggerDeployment(profile);
      if (result.success) {
        message.success('Deployment triggered successfully!');
        setDeployModalVisible(false);
      } else {
        message.error(result.error || 'Deployment failed');
      }
    } catch (err: any) {
      message.error('Failed to trigger deployment: ' + err.message);
    } finally {
      setDeploying(false);
    }
  };

  // Server columns
  const serverColumns: ColumnsType<Server> = [
    {
      title: 'Server',
      dataIndex: 'id',
      key: 'id',
      render: (id: string, record: Server) => (
        <Space>
          <CloudServerOutlined />
          <Text strong>{id}</Text>
          <Text type="secondary">({record.host})</Text>
        </Space>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'health',
      key: 'health',
      render: (health: ServerHealth) => <HealthBadge health={health} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: number) => (
        <Text type={latency > 500 ? 'danger' : latency > 200 ? 'warning' : undefined}>
          {latency}ms
        </Text>
      ),
    },
    {
      title: 'HTTP Status',
      dataIndex: 'httpStatus',
      key: 'httpStatus',
      render: (status: number) => (
        <Tag color={status >= 200 && status < 300 ? 'green' : status >= 400 ? 'red' : 'default'}>
          {status || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Last Check',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
      render: (time: string) => (
        <Tooltip title={time}>
          <Text type="secondary">
            {new Date(time).toLocaleTimeString()}
          </Text>
        </Tooltip>
      ),
    },
  ];

  // Container columns
  const containerColumns: ColumnsType<Container> = [
    {
      title: 'Container',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <DatabaseOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu: string) => <Tag color="blue">{cpu}</Tag>,
    },
    {
      title: 'Memory',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory: string, record: Container) => (
        <Tooltip title={`Limit: ${record.memoryLimit}`}>
          <Tag color="purple">{memory}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      ellipsis: true,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} md={6} key={i}>
              <StatsCardSkeleton />
            </Col>
          ))}
        </Row>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load infrastructure data"
        description={error}
        showIcon
        action={
          <Button onClick={() => loadData()}>Retry</Button>
        }
      />
    );
  }

  const healthyServers = servers.filter((s) => s.health === 'healthy').length;
  const runningContainers = containers.filter((c) => c.status === 'running').length;

  return (
    <ErrorBoundary>
      <div style={{ padding: 24 }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <SettingOutlined /> Infrastructure Dashboard
            </Title>
            <Text type="secondary">
              Monitor local and remote infrastructure health
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={() => loadData(true)}
                loading={refreshing}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => setDeployModalVisible(true)}
              >
                Deploy
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Summary Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Servers"
              value={healthyServers}
              suffix={`/ ${servers.length}`}
              icon={<CloudServerOutlined />}
              color={healthyServers === servers.length ? '#52c41a' : '#faad14'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Containers"
              value={runningContainers}
              suffix={`/ ${containers.length}`}
              icon={<DatabaseOutlined />}
              color={runningContainers === containers.length ? '#52c41a' : '#faad14'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="CPU Usage"
              value={Math.round(metrics?.cpu?.usage || 0)}
              suffix="%"
              icon={<ThunderboltOutlined />}
              color="#1890ff"
              percentage={metrics?.cpu?.usage}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard
              title="Memory"
              value={metrics?.memory?.used || 0}
              suffix="MB"
              icon={<HddOutlined />}
              color="#722ed1"
              percentage={metrics?.memory?.percentage}
            />
          </Col>
        </Row>

        {/* Environment Info */}
        {overview && (
          <Card size="small" style={{ marginBottom: 24 }}>
            <Row gutter={[24, 8]}>
              <Col>
                <Space>
                  <DesktopOutlined />
                  <Text strong>Host:</Text>
                  <Text>{overview.environment.hostname}</Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <GlobalOutlined />
                  <Text strong>OS:</Text>
                  <Text>{overview.environment.os} {overview.environment.osVersion}</Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <SafetyCertificateOutlined />
                  <Text strong>Java:</Text>
                  <Text>{overview.environment.javaVersion}</Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <ClockCircleOutlined />
                  <Text strong>Uptime:</Text>
                  <Text type="success">{overview.uptime.formatted}</Text>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Tabs for Servers and Containers */}
        <Tabs defaultActiveKey="servers">
          <TabPane
            tab={
              <span>
                <CloudServerOutlined />
                Servers ({servers.length})
              </span>
            }
            key="servers"
          >
            <Table
              dataSource={servers}
              columns={serverColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                Containers ({containers.length})
              </span>
            }
            key="containers"
          >
            <Table
              dataSource={containers}
              columns={containerColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <ApiOutlined />
                System Metrics
              </span>
            }
            key="metrics"
          >
            {metrics && (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card title="CPU">
                    <Statistic
                      title="Usage"
                      value={metrics.cpu.usage.toFixed(1)}
                      suffix="%"
                    />
                    <Divider />
                    <Text type="secondary">Cores: {metrics.cpu.cores}</Text>
                    <br />
                    <Text type="secondary">Load Average: {metrics.cpu.loadAverage.toFixed(2)}</Text>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card title="Memory">
                    <Statistic
                      title="Used"
                      value={metrics.memory.used}
                      suffix={`/ ${metrics.memory.total} MB`}
                    />
                    <Progress
                      percent={Math.round(metrics.memory.percentage)}
                      strokeColor={
                        metrics.memory.percentage > 80 ? '#ff4d4f' :
                        metrics.memory.percentage > 60 ? '#faad14' : '#52c41a'
                      }
                    />
                    <Divider />
                    <Text type="secondary">Heap: {metrics.memory.heapUsed} / {metrics.memory.heapMax} MB</Text>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card title="Disk">
                    <Statistic
                      title="Used"
                      value={metrics.disk.used}
                      suffix={`/ ${metrics.disk.total} GB`}
                    />
                    <Progress
                      percent={Math.round(metrics.disk.percentage)}
                      strokeColor={
                        metrics.disk.percentage > 90 ? '#ff4d4f' :
                        metrics.disk.percentage > 70 ? '#faad14' : '#52c41a'
                      }
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </TabPane>
        </Tabs>

        {/* Deploy Modal */}
        <Modal
          title="Trigger Deployment"
          open={deployModalVisible}
          onCancel={() => setDeployModalVisible(false)}
          footer={null}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Select deployment profile:</Text>
            <Button
              block
              icon={<RocketOutlined />}
              onClick={() => handleDeploy('platform')}
              loading={deploying}
            >
              Platform (Full Stack)
            </Button>
            <Button
              block
              icon={<ApiOutlined />}
              onClick={() => handleDeploy('backend')}
              loading={deploying}
            >
              Backend Only
            </Button>
            <Button
              block
              icon={<GlobalOutlined />}
              onClick={() => handleDeploy('frontend')}
              loading={deploying}
            >
              Frontend Only
            </Button>
          </Space>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default InfrastructureDashboard;
