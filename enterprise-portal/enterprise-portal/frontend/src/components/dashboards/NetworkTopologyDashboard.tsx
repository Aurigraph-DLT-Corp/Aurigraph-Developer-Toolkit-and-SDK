/**
 * Network Topology Dashboard Component
 *
 * Displays network nodes (validators, business nodes, integration nodes)
 * with health status, connection counts, latency metrics, and geographic distribution.
 *
 * JIRA Ticket: AV11-319
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
  Drawer,
  Descriptions,
  Progress,
  Alert,
  Button,
  Tabs,
  Divider,
  List,
} from 'antd';
import {
  NodeIndexOutlined,
  ApiOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  LinkOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { UnderDevelopmentEmpty, ApiErrorEmpty } from '../common/EmptyState';
import { isFeatureEnabled } from '../../config/featureFlags';
import { handleApiError, isNotFoundError, type ApiError } from '../../utils/apiErrorHandler';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// ============================================================================
// Type Definitions
// ============================================================================

export type NodeType = 'validator' | 'business' | 'integration';
export type NodeHealth = 'healthy' | 'degraded' | 'unhealthy';
export type NodeStatus = 'online' | 'offline' | 'syncing' | 'maintenance';

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  health: NodeHealth;
  status: NodeStatus;
  ipAddress: string;
  port: number;
  region: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  connectionCount: number;
  maxConnections: number;
  avgLatencyMs: number;
  uptimePercent: number;
  lastSeenAt: string;
  version: string;
  consensusParticipation: number;
  blocksProduced: number;
  transactionsProcessed: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  bandwidthIn: number;
  bandwidthOut: number;
}

export interface NodeConnection {
  sourceId: string;
  targetId: string;
  latencyMs: number;
  status: 'active' | 'inactive' | 'degraded';
  bandwidth: number;
  packetLoss: number;
}

export interface RegionStats {
  region: string;
  nodeCount: number;
  healthyCount: number;
  avgLatency: number;
  totalConnections: number;
}

export interface NetworkTopologyStats {
  totalNodes: number;
  validatorNodes: number;
  businessNodes: number;
  integrationNodes: number;
  healthyNodes: number;
  degradedNodes: number;
  unhealthyNodes: number;
  totalConnections: number;
  avgNetworkLatency: number;
  networkUptime: number;
  consensusHealth: number;
}

// ============================================================================
// Mock Data Generator
// ============================================================================

const generateMockNodes = (): NetworkNode[] => {
  const regions = [
    { region: 'North America', country: 'United States', cities: ['New York', 'San Francisco', 'Chicago', 'Dallas', 'Seattle'] },
    { region: 'Europe', country: 'Germany', cities: ['Frankfurt', 'Berlin', 'Munich'] },
    { region: 'Europe', country: 'United Kingdom', cities: ['London', 'Manchester'] },
    { region: 'Asia Pacific', country: 'Singapore', cities: ['Singapore'] },
    { region: 'Asia Pacific', country: 'Japan', cities: ['Tokyo', 'Osaka'] },
    { region: 'Asia Pacific', country: 'Australia', cities: ['Sydney', 'Melbourne'] },
    { region: 'South America', country: 'Brazil', cities: ['Sao Paulo'] },
  ];

  const nodeTypes: NodeType[] = ['validator', 'business', 'integration'];
  const nodes: NetworkNode[] = [];

  let nodeIndex = 0;
  regions.forEach((regionData) => {
    regionData.cities.forEach((city) => {
      const nodeType: NodeType = nodeTypes[nodeIndex % 3] ?? 'business';
      const healthRandom = Math.random();
      const health: NodeHealth = healthRandom > 0.85 ? 'unhealthy' : healthRandom > 0.7 ? 'degraded' : 'healthy';
      const statusRandom = Math.random();
      const status: NodeStatus = health === 'unhealthy'
        ? (statusRandom > 0.5 ? 'offline' : 'maintenance')
        : health === 'degraded'
          ? 'syncing'
          : 'online';

      nodes.push({
        id: `node-${String(nodeIndex + 1).padStart(3, '0')}`,
        name: `${city}-${nodeType.charAt(0).toUpperCase()}${nodeType.slice(1)}-${String(nodeIndex + 1).padStart(2, '0')}`,
        type: nodeType,
        health,
        status,
        ipAddress: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        port: 26656 + (nodeIndex % 10),
        region: regionData.region,
        country: regionData.country,
        city,
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        connectionCount: Math.floor(Math.random() * 50) + 10,
        maxConnections: 100,
        avgLatencyMs: Math.floor(Math.random() * 150) + 20,
        uptimePercent: health === 'healthy' ? 99 + Math.random() : health === 'degraded' ? 90 + Math.random() * 8 : Math.random() * 50 + 30,
        lastSeenAt: new Date(Date.now() - Math.floor(Math.random() * 60000)).toISOString(),
        version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 5)}`,
        consensusParticipation: nodeType === 'validator' ? 95 + Math.random() * 5 : 0,
        blocksProduced: nodeType === 'validator' ? Math.floor(Math.random() * 10000) + 1000 : 0,
        transactionsProcessed: Math.floor(Math.random() * 100000) + 10000,
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 50) + 30,
        diskUsage: Math.floor(Math.random() * 40) + 20,
        bandwidthIn: Math.floor(Math.random() * 500) + 100,
        bandwidthOut: Math.floor(Math.random() * 400) + 80,
      });
      nodeIndex++;
    });
  });

  return nodes;
};

const generateMockConnections = (nodes: NetworkNode[]): NodeConnection[] => {
  const connections: NodeConnection[] = [];
  nodes.forEach((node, i) => {
    const connectionCount = Math.min(node.connectionCount, nodes.length - 1);
    const connectedIndices = new Set<number>();

    while (connectedIndices.size < connectionCount) {
      const targetIndex = Math.floor(Math.random() * nodes.length);
      if (targetIndex !== i) {
        connectedIndices.add(targetIndex);
      }
    }

    connectedIndices.forEach((targetIndex) => {
      const target = nodes[targetIndex];
      if (target) {
        connections.push({
          sourceId: node.id,
          targetId: target.id,
          latencyMs: Math.floor(Math.random() * 200) + 10,
          status: Math.random() > 0.9 ? 'degraded' : Math.random() > 0.95 ? 'inactive' : 'active',
          bandwidth: Math.floor(Math.random() * 1000) + 100,
          packetLoss: Math.random() * 2,
        });
      }
    });
  });

  return connections;
};

const calculateNetworkStats = (nodes: NetworkNode[], connections: NodeConnection[]): NetworkTopologyStats => {
  const validatorNodes = nodes.filter(n => n.type === 'validator');
  const businessNodes = nodes.filter(n => n.type === 'business');
  const integrationNodes = nodes.filter(n => n.type === 'integration');
  const healthyNodes = nodes.filter(n => n.health === 'healthy');
  const degradedNodes = nodes.filter(n => n.health === 'degraded');
  const unhealthyNodes = nodes.filter(n => n.health === 'unhealthy');

  const avgLatency = connections.length > 0
    ? connections.reduce((sum, c) => sum + c.latencyMs, 0) / connections.length
    : 0;

  const avgUptime = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + n.uptimePercent, 0) / nodes.length
    : 0;

  const avgConsensus = validatorNodes.length > 0
    ? validatorNodes.reduce((sum, n) => sum + n.consensusParticipation, 0) / validatorNodes.length
    : 0;

  return {
    totalNodes: nodes.length,
    validatorNodes: validatorNodes.length,
    businessNodes: businessNodes.length,
    integrationNodes: integrationNodes.length,
    healthyNodes: healthyNodes.length,
    degradedNodes: degradedNodes.length,
    unhealthyNodes: unhealthyNodes.length,
    totalConnections: connections.length,
    avgNetworkLatency: Math.round(avgLatency),
    networkUptime: Math.round(avgUptime * 100) / 100,
    consensusHealth: Math.round(avgConsensus * 100) / 100,
  };
};

const calculateRegionStats = (nodes: NetworkNode[]): RegionStats[] => {
  const regionMap = new Map<string, { nodes: NetworkNode[]; connections: number }>();

  nodes.forEach(node => {
    const existing = regionMap.get(node.region) || { nodes: [], connections: 0 };
    existing.nodes.push(node);
    existing.connections += node.connectionCount;
    regionMap.set(node.region, existing);
  });

  return Array.from(regionMap.entries()).map(([region, data]) => ({
    region,
    nodeCount: data.nodes.length,
    healthyCount: data.nodes.filter(n => n.health === 'healthy').length,
    avgLatency: Math.round(data.nodes.reduce((sum, n) => sum + n.avgLatencyMs, 0) / data.nodes.length),
    totalConnections: data.connections,
  }));
};

// ============================================================================
// Helper Components
// ============================================================================

const HealthBadge: React.FC<{ health: NodeHealth }> = ({ health }) => {
  const config = {
    healthy: { color: 'success', icon: <CheckCircleOutlined />, text: 'Healthy' },
    degraded: { color: 'warning', icon: <ExclamationCircleOutlined />, text: 'Degraded' },
    unhealthy: { color: 'error', icon: <CloseCircleOutlined />, text: 'Unhealthy' },
  };

  const { color, icon, text } = config[health];
  return (
    <Tag icon={icon} color={color}>
      {text}
    </Tag>
  );
};

const StatusBadge: React.FC<{ status: NodeStatus }> = ({ status }) => {
  const config = {
    online: { color: 'green', text: 'Online' },
    offline: { color: 'red', text: 'Offline' },
    syncing: { color: 'blue', text: 'Syncing' },
    maintenance: { color: 'orange', text: 'Maintenance' },
  };

  const { color, text } = config[status];
  return <Badge status={color as 'success' | 'error' | 'processing' | 'warning'} text={text} />;
};

const NodeTypeTag: React.FC<{ type: NodeType }> = ({ type }) => {
  const config = {
    validator: { color: 'purple', icon: <SafetyCertificateOutlined />, text: 'Validator' },
    business: { color: 'blue', icon: <TeamOutlined />, text: 'Business' },
    integration: { color: 'cyan', icon: <ApiOutlined />, text: 'Integration' },
  };

  const { color, icon, text } = config[type];
  return (
    <Tag icon={icon} color={color}>
      {text}
    </Tag>
  );
};

// ============================================================================
// Node Details Drawer
// ============================================================================

interface NodeDetailsDrawerProps {
  node: NetworkNode | null;
  visible: boolean;
  onClose: () => void;
  connections: NodeConnection[];
}

const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({ node, visible, onClose, connections }) => {
  if (!node) return null;

  const nodeConnections = connections.filter(
    c => c.sourceId === node.id || c.targetId === node.id
  );

  const activeConnections = nodeConnections.filter(c => c.status === 'active').length;
  const avgConnectionLatency = nodeConnections.length > 0
    ? Math.round(nodeConnections.reduce((sum, c) => sum + c.latencyMs, 0) / nodeConnections.length)
    : 0;

  return (
    <Drawer
      title={
        <Space>
          <CloudServerOutlined />
          <span>{node.name}</span>
          <HealthBadge health={node.health} />
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
    >
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Node ID">{node.id}</Descriptions.Item>
            <Descriptions.Item label="Type"><NodeTypeTag type={node.type} /></Descriptions.Item>
            <Descriptions.Item label="Status"><StatusBadge status={node.status} /></Descriptions.Item>
            <Descriptions.Item label="Version">{node.version}</Descriptions.Item>
            <Descriptions.Item label="IP Address">{node.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="Port">{node.port}</Descriptions.Item>
            <Descriptions.Item label="Last Seen" span={2}>
              {new Date(node.lastSeenAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Location</Divider>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Region">{node.region}</Descriptions.Item>
            <Descriptions.Item label="Country">{node.country}</Descriptions.Item>
            <Descriptions.Item label="City" span={2}>{node.city}</Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Performance</Divider>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Statistic
                title="Uptime"
                value={node.uptimePercent}
                precision={2}
                suffix="%"
                valueStyle={{ color: node.uptimePercent > 99 ? '#52c41a' : node.uptimePercent > 95 ? '#faad14' : '#ff4d4f' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Avg Latency"
                value={node.avgLatencyMs}
                suffix="ms"
                valueStyle={{ color: node.avgLatencyMs < 50 ? '#52c41a' : node.avgLatencyMs < 100 ? '#faad14' : '#ff4d4f' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Transactions Processed"
                value={node.transactionsProcessed}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Connections"
                value={node.connectionCount}
                suffix={`/ ${node.maxConnections}`}
              />
            </Col>
          </Row>

          {node.type === 'validator' && (
            <>
              <Divider orientation="left">Consensus Stats</Divider>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Consensus Participation"
                    value={node.consensusParticipation}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Blocks Produced"
                    value={node.blocksProduced}
                    formatter={(value) => value?.toLocaleString()}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </>
          )}
        </TabPane>

        <TabPane tab="Resources" key="resources">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title="CPU Usage">
              <Progress
                percent={node.cpuUsage}
                strokeColor={node.cpuUsage > 80 ? '#ff4d4f' : node.cpuUsage > 60 ? '#faad14' : '#52c41a'}
                status={node.cpuUsage > 90 ? 'exception' : 'normal'}
              />
            </Card>
            <Card size="small" title="Memory Usage">
              <Progress
                percent={node.memoryUsage}
                strokeColor={node.memoryUsage > 80 ? '#ff4d4f' : node.memoryUsage > 60 ? '#faad14' : '#52c41a'}
                status={node.memoryUsage > 90 ? 'exception' : 'normal'}
              />
            </Card>
            <Card size="small" title="Disk Usage">
              <Progress
                percent={node.diskUsage}
                strokeColor={node.diskUsage > 80 ? '#ff4d4f' : node.diskUsage > 60 ? '#faad14' : '#52c41a'}
                status={node.diskUsage > 90 ? 'exception' : 'normal'}
              />
            </Card>
            <Card size="small" title="Bandwidth">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Inbound"
                    value={node.bandwidthIn}
                    suffix="MB/s"
                    prefix={<SyncOutlined spin={node.status === 'syncing'} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Outbound"
                    value={node.bandwidthOut}
                    suffix="MB/s"
                  />
                </Col>
              </Row>
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="Connections" key="connections">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Total Connections" value={nodeConnections.length} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Active"
                  value={activeConnections}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Avg Latency"
                  value={avgConnectionLatency}
                  suffix="ms"
                />
              </Col>
            </Row>
            <Divider />
            <List
              size="small"
              dataSource={nodeConnections.slice(0, 20)}
              renderItem={(conn) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<LinkOutlined />}
                    title={
                      <Space>
                        <Text code>{conn.sourceId === node.id ? conn.targetId : conn.sourceId}</Text>
                        <Badge
                          status={conn.status === 'active' ? 'success' : conn.status === 'degraded' ? 'warning' : 'error'}
                          text={conn.status}
                        />
                      </Space>
                    }
                    description={`Latency: ${conn.latencyMs}ms | Bandwidth: ${conn.bandwidth} KB/s | Packet Loss: ${conn.packetLoss.toFixed(2)}%`}
                  />
                </List.Item>
              )}
            />
          </Space>
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const NetworkTopologyDashboard: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [stats, setStats] = useState<NetworkTopologyStats | null>(null);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Feature flag check - using consensusMetrics as it's closest to network topology
  const isFeatureAvailable = isFeatureEnabled('consensusMetrics');

  // Fetch network topology data
  const fetchNetworkTopology = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Using mock data as the backend API is not yet implemented
      // In production, this would call: await comprehensivePortalService.getNetworkTopology();
      const mockNodes = generateMockNodes();
      const mockConnections = generateMockConnections(mockNodes);
      const mockStats = calculateNetworkStats(mockNodes, mockConnections);
      const mockRegionStats = calculateRegionStats(mockNodes);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setNodes(mockNodes);
      setConnections(mockConnections);
      setStats(mockStats);
      setRegionStats(mockRegionStats);
    } catch (err) {
      const apiError = handleApiError(err, {
        customMessage: 'Failed to load network topology data',
      });
      setError(apiError);

      if (isNotFoundError(apiError)) {
        console.warn('Network Topology API endpoints not implemented yet');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFeatureAvailable) {
      fetchNetworkTopology();

      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchNetworkTopology();
      }, 30000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isFeatureAvailable, fetchNetworkTopology]);

  // Handle node click
  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    setDrawerVisible(true);
  };

  // Filter nodes by type
  const getFilteredNodes = (): NetworkNode[] => {
    if (activeTab === 'all') return nodes;
    return nodes.filter(n => n.type === activeTab);
  };

  // Table columns for nodes
  const columns: ColumnsType<NetworkNode> = [
    {
      title: 'Node',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <Button type="link" onClick={() => handleNodeClick(record)} style={{ padding: 0 }}>
          <Space>
            <CloudServerOutlined />
            <div>
              <Text strong>{name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.id}</Text>
            </div>
          </Space>
        </Button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Validator', value: 'validator' },
        { text: 'Business', value: 'business' },
        { text: 'Integration', value: 'integration' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type: NodeType) => <NodeTypeTag type={type} />,
    },
    {
      title: 'Health',
      dataIndex: 'health',
      key: 'health',
      width: 110,
      filters: [
        { text: 'Healthy', value: 'healthy' },
        { text: 'Degraded', value: 'degraded' },
        { text: 'Unhealthy', value: 'unhealthy' },
      ],
      onFilter: (value, record) => record.health === value,
      render: (health: NodeHealth) => <HealthBadge health={health} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: [
        { text: 'Online', value: 'online' },
        { text: 'Offline', value: 'offline' },
        { text: 'Syncing', value: 'syncing' },
        { text: 'Maintenance', value: 'maintenance' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: NodeStatus) => <StatusBadge status={status} />,
    },
    {
      title: 'Location',
      key: 'location',
      width: 180,
      render: (_, record) => (
        <Tooltip title={`${record.city}, ${record.country}`}>
          <Space>
            <EnvironmentOutlined />
            <Text>{record.region}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Connections',
      dataIndex: 'connectionCount',
      key: 'connectionCount',
      width: 120,
      sorter: (a, b) => a.connectionCount - b.connectionCount,
      render: (count: number, record) => (
        <Tooltip title={`${count} of ${record.maxConnections} max connections`}>
          <Progress
            percent={(count / record.maxConnections) * 100}
            size="small"
            format={() => count}
            strokeColor={count / record.maxConnections > 0.8 ? '#faad14' : '#52c41a'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Latency',
      dataIndex: 'avgLatencyMs',
      key: 'avgLatencyMs',
      width: 100,
      sorter: (a, b) => a.avgLatencyMs - b.avgLatencyMs,
      render: (latency: number) => (
        <Tag color={latency < 50 ? 'green' : latency < 100 ? 'orange' : 'red'}>
          {latency} ms
        </Tag>
      ),
    },
    {
      title: 'Uptime',
      dataIndex: 'uptimePercent',
      key: 'uptimePercent',
      width: 120,
      sorter: (a, b) => a.uptimePercent - b.uptimePercent,
      render: (uptime: number) => (
        <Tooltip title={`${uptime.toFixed(2)}% uptime`}>
          <Progress
            percent={uptime}
            size="small"
            strokeColor={uptime > 99 ? '#52c41a' : uptime > 95 ? '#faad14' : '#ff4d4f'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Consensus',
      dataIndex: 'consensusParticipation',
      key: 'consensusParticipation',
      width: 120,
      sorter: (a, b) => a.consensusParticipation - b.consensusParticipation,
      render: (consensus: number, record) => (
        record.type === 'validator' ? (
          <Tooltip title={`${consensus.toFixed(2)}% participation rate`}>
            <Progress
              percent={consensus}
              size="small"
              strokeColor="#722ed1"
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        )
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => <Tag>{version}</Tag>,
    },
  ];

  // Region table columns
  const regionColumns: ColumnsType<RegionStats> = [
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => (
        <Space>
          <GlobalOutlined />
          <Text strong>{region}</Text>
        </Space>
      ),
    },
    {
      title: 'Nodes',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      sorter: (a, b) => a.nodeCount - b.nodeCount,
    },
    {
      title: 'Healthy',
      key: 'health',
      render: (_, record) => (
        <Space>
          <Text style={{ color: '#52c41a' }}>{record.healthyCount}</Text>
          <Text type="secondary">/ {record.nodeCount}</Text>
        </Space>
      ),
    },
    {
      title: 'Avg Latency',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      sorter: (a, b) => a.avgLatency - b.avgLatency,
      render: (latency: number) => (
        <Tag color={latency < 50 ? 'green' : latency < 100 ? 'orange' : 'red'}>
          {latency} ms
        </Tag>
      ),
    },
    {
      title: 'Connections',
      dataIndex: 'totalConnections',
      key: 'totalConnections',
      sorter: (a, b) => a.totalConnections - b.totalConnections,
      render: (count: number) => count.toLocaleString(),
    },
  ];

  // Feature not available
  if (!isFeatureAvailable) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Network Topology</Title>
          <Text type="secondary">Monitor network nodes, connections, and geographic distribution</Text>
          <Card style={{ marginTop: '24px' }}>
            <UnderDevelopmentEmpty
              title="Network Topology Dashboard Under Development"
              description="The Network Topology Dashboard backend API is currently being developed. This feature will be available in an upcoming release."
            />
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (loading && nodes.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Network Topology</Title>
          <Text type="secondary">Monitor network nodes, connections, and geographic distribution</Text>
          <div style={{ marginTop: '24px' }}>
            <StatsCardSkeleton count={4} />
            <Card style={{ marginTop: '24px' }}>
              <TableSkeleton rows={10} columns={8} />
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Error state with retry
  if (error && !loading) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Network Topology</Title>
          <Text type="secondary">Monitor network nodes, connections, and geographic distribution</Text>
          <Card style={{ marginTop: '24px' }}>
            {isNotFoundError(error) ? (
              <UnderDevelopmentEmpty
                title="Network Topology API Not Available"
                description="The backend API endpoint for network topology data is not yet implemented. This feature is coming soon."
                onRetry={fetchNetworkTopology}
              />
            ) : (
              <ApiErrorEmpty
                title="Failed to Load Network Topology"
                description={error.details || 'Unable to fetch network topology data from the backend API.'}
                onRetry={fetchNetworkTopology}
              />
            )}
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Network Topology</Title>
        <Text type="secondary">Monitor network nodes, connections, and geographic distribution</Text>

        {/* Error Alert (non-blocking) */}
        {error && nodes.length > 0 && (
          <Alert
            message="Connection Issue"
            description="Unable to fetch latest network topology data. Showing cached data."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={fetchNetworkTopology}>
                Retry
              </Button>
            }
          />
        )}

        {/* Network Overview Stats */}
        {stats && (
          <Row gutter={[16, 16]} style={{ marginTop: '24px', marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Nodes"
                  value={stats.totalNodes}
                  prefix={<NodeIndexOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={
                    <Tooltip title={`${stats.validatorNodes} Validators, ${stats.businessNodes} Business, ${stats.integrationNodes} Integration`}>
                      <Space style={{ fontSize: '12px', marginLeft: '8px' }}>
                        <Badge status="processing" text={`V:${stats.validatorNodes}`} />
                      </Space>
                    </Tooltip>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Node Health"
                  value={stats.healthyNodes}
                  suffix={`/ ${stats.totalNodes}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Space style={{ marginTop: '8px' }}>
                  <Tag color="warning">{stats.degradedNodes} Degraded</Tag>
                  <Tag color="error">{stats.unhealthyNodes} Unhealthy</Tag>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Connections"
                  value={stats.totalConnections}
                  prefix={<LinkOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Avg Network Latency"
                  value={stats.avgNetworkLatency}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: stats.avgNetworkLatency < 100 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Additional Stats Row */}
        {stats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Network Uptime"
                  value={stats.networkUptime}
                  precision={2}
                  suffix="%"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: stats.networkUptime > 99 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Consensus Health"
                  value={stats.consensusHealth}
                  precision={2}
                  suffix="%"
                  prefix={<SafetyCertificateOutlined />}
                  valueStyle={{ color: stats.consensusHealth > 95 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Validator Nodes"
                  value={stats.validatorNodes}
                  suffix={`active`}
                  prefix={<SafetyCertificateOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Geographic Distribution */}
        <Card title="Geographic Distribution" style={{ marginBottom: '24px' }}>
          <Table
            columns={regionColumns}
            dataSource={regionStats}
            rowKey="region"
            pagination={false}
            size="small"
          />
        </Card>

        {/* Nodes Table */}
        <Card
          title="Network Nodes"
          extra={
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              style={{ marginBottom: 0 }}
            >
              <TabPane tab={`All (${nodes.length})`} key="all" />
              <TabPane tab={`Validators (${nodes.filter(n => n.type === 'validator').length})`} key="validator" />
              <TabPane tab={`Business (${nodes.filter(n => n.type === 'business').length})`} key="business" />
              <TabPane tab={`Integration (${nodes.filter(n => n.type === 'integration').length})`} key="integration" />
            </Tabs>
          }
        >
          <Table
            columns={columns}
            dataSource={getFilteredNodes()}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} nodes` }}
            scroll={{ x: 1400 }}
            onRow={(record) => ({
              onClick: () => handleNodeClick(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>

        {/* Node Details Drawer */}
        <NodeDetailsDrawer
          node={selectedNode}
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          connections={connections}
        />
      </div>
    </ErrorBoundary>
  );
};

export default NetworkTopologyDashboard;
