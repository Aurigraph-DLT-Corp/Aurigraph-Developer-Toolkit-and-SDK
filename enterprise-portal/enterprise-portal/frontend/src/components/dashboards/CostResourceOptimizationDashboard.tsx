/**
 * Cost & Resource Optimization Dashboard
 *
 * JIRA: AV11-320
 *
 * Displays resource usage metrics, cost breakdown, optimization recommendations,
 * utilization trends, cost projections, and underutilized resource identification.
 */

import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Progress,
  Alert,
  Tag,
  Typography,
  Tabs,
  Tooltip,
  Badge,
  Space,
  Divider,
} from 'antd';
import {
  DollarOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  HddOutlined,
  WifiOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// Type definitions
interface ResourceUsage {
  key: string;
  resource: string;
  current: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
}

interface CostBreakdown {
  key: string;
  service: string;
  dailyCost: number;
  monthlyCost: number;
  percentageOfTotal: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

interface OptimizationRecommendation {
  key: string;
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'implemented';
}

interface UnderutilizedResource {
  key: string;
  resource: string;
  type: string;
  utilization: number;
  allocatedCost: number;
  recommendedAction: string;
  potentialSavings: number;
}

interface UtilizationTrend {
  key: string;
  timestamp: string;
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

// Mock data for resource usage
const mockResourceUsage: ResourceUsage[] = [
  {
    key: '1',
    resource: 'CPU',
    current: 67,
    max: 100,
    unit: '%',
    trend: 'up',
    status: 'healthy',
  },
  {
    key: '2',
    resource: 'Memory',
    current: 12.4,
    max: 32,
    unit: 'GB',
    trend: 'stable',
    status: 'healthy',
  },
  {
    key: '3',
    resource: 'Storage',
    current: 890,
    max: 2000,
    unit: 'GB',
    trend: 'up',
    status: 'warning',
  },
  {
    key: '4',
    resource: 'Network Bandwidth',
    current: 450,
    max: 1000,
    unit: 'Mbps',
    trend: 'down',
    status: 'healthy',
  },
];

// Mock data for cost breakdown
const mockCostBreakdown: CostBreakdown[] = [
  {
    key: '1',
    service: 'Consensus Engine (HyperRAFT++)',
    dailyCost: 85.50,
    monthlyCost: 2565.00,
    percentageOfTotal: 32,
    trend: 'stable',
    category: 'Core Infrastructure',
  },
  {
    key: '2',
    service: 'Validator Nodes',
    dailyCost: 62.30,
    monthlyCost: 1869.00,
    percentageOfTotal: 23,
    trend: 'up',
    category: 'Core Infrastructure',
  },
  {
    key: '3',
    service: 'Quantum-Resistant Crypto',
    dailyCost: 45.20,
    monthlyCost: 1356.00,
    percentageOfTotal: 17,
    trend: 'stable',
    category: 'Security',
  },
  {
    key: '4',
    service: 'Smart Contract Execution',
    dailyCost: 38.75,
    monthlyCost: 1162.50,
    percentageOfTotal: 14,
    trend: 'down',
    category: 'Compute',
  },
  {
    key: '5',
    service: 'Merkle Tree Registry',
    dailyCost: 22.15,
    monthlyCost: 664.50,
    percentageOfTotal: 8,
    trend: 'up',
    category: 'Storage',
  },
  {
    key: '6',
    service: 'API Gateway & Load Balancer',
    dailyCost: 15.80,
    monthlyCost: 474.00,
    percentageOfTotal: 6,
    trend: 'stable',
    category: 'Networking',
  },
];

// Mock data for optimization recommendations
const mockOptimizationRecommendations: OptimizationRecommendation[] = [
  {
    key: '1',
    title: 'Enable Auto-scaling for Validator Nodes',
    description:
      'Implement dynamic scaling based on transaction volume to reduce idle node costs during low-traffic periods.',
    potentialSavings: 380,
    priority: 'high',
    impact: 'high',
    effort: 'medium',
    status: 'pending',
  },
  {
    key: '2',
    title: 'Optimize Merkle Proof Caching',
    description:
      'Implement intelligent caching for frequently accessed Merkle proofs to reduce storage I/O and compute costs.',
    potentialSavings: 245,
    priority: 'medium',
    impact: 'medium',
    effort: 'low',
    status: 'in_progress',
  },
  {
    key: '3',
    title: 'Consolidate Idle Registry Instances',
    description:
      'Merge underutilized registry instances during off-peak hours to optimize resource allocation.',
    potentialSavings: 175,
    priority: 'medium',
    impact: 'medium',
    effort: 'medium',
    status: 'pending',
  },
  {
    key: '4',
    title: 'Implement Batch Transaction Processing',
    description:
      'Group similar transactions for batch processing to reduce per-transaction overhead and improve efficiency.',
    potentialSavings: 320,
    priority: 'high',
    impact: 'high',
    effort: 'high',
    status: 'pending',
  },
  {
    key: '5',
    title: 'Switch to Reserved Capacity Pricing',
    description:
      'Convert on-demand resources to reserved capacity for predictable workloads with 40% savings.',
    potentialSavings: 890,
    priority: 'high',
    impact: 'high',
    effort: 'low',
    status: 'implemented',
  },
];

// Mock data for underutilized resources
const mockUnderutilizedResources: UnderutilizedResource[] = [
  {
    key: '1',
    resource: 'Backup Validator Node #3',
    type: 'Compute',
    utilization: 12,
    allocatedCost: 185.00,
    recommendedAction: 'Scale down or consolidate',
    potentialSavings: 140,
  },
  {
    key: '2',
    resource: 'Archive Storage Pool B',
    type: 'Storage',
    utilization: 23,
    allocatedCost: 95.00,
    recommendedAction: 'Migrate to cold storage',
    potentialSavings: 72,
  },
  {
    key: '3',
    resource: 'Test Environment Cluster',
    type: 'Compute',
    utilization: 8,
    allocatedCost: 220.00,
    recommendedAction: 'Shutdown during off-hours',
    potentialSavings: 165,
  },
  {
    key: '4',
    resource: 'Staging API Servers',
    type: 'Compute',
    utilization: 15,
    allocatedCost: 125.00,
    recommendedAction: 'Reduce instance size',
    potentialSavings: 85,
  },
];

// Mock utilization trend data (last 7 days)
const mockUtilizationTrends: UtilizationTrend[] = [
  { key: '1', timestamp: 'Dec 14', cpu: 62, memory: 45, storage: 42, network: 38 },
  { key: '2', timestamp: 'Dec 15', cpu: 58, memory: 48, storage: 43, network: 42 },
  { key: '3', timestamp: 'Dec 16', cpu: 71, memory: 52, storage: 44, network: 55 },
  { key: '4', timestamp: 'Dec 17', cpu: 65, memory: 49, storage: 44, network: 48 },
  { key: '5', timestamp: 'Dec 18', cpu: 78, memory: 55, storage: 45, network: 52 },
  { key: '6', timestamp: 'Dec 19', cpu: 69, memory: 51, storage: 45, network: 45 },
  { key: '7', timestamp: 'Dec 20', cpu: 67, memory: 53, storage: 45, network: 47 },
];

const CostResourceOptimizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Calculate totals and metrics
  const totalDailyCost = useMemo(
    () => mockCostBreakdown.reduce((sum, item) => sum + item.dailyCost, 0),
    []
  );

  const totalMonthlyCost = useMemo(
    () => mockCostBreakdown.reduce((sum, item) => sum + item.monthlyCost, 0),
    []
  );

  const totalPotentialSavings = useMemo(
    () =>
      mockOptimizationRecommendations
        .filter((r) => r.status !== 'implemented')
        .reduce((sum, item) => sum + item.potentialSavings, 0),
    []
  );

  const implementedSavings = useMemo(
    () =>
      mockOptimizationRecommendations
        .filter((r) => r.status === 'implemented')
        .reduce((sum, item) => sum + item.potentialSavings, 0),
    []
  );

  const underutilizedSavings = useMemo(
    () => mockUnderutilizedResources.reduce((sum, item) => sum + item.potentialSavings, 0),
    []
  );

  // Resource usage columns
  const resourceUsageColumns = [
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => (
        <Space>
          {text === 'CPU' && <ThunderboltOutlined style={{ color: '#1890ff' }} />}
          {text === 'Memory' && <HddOutlined style={{ color: '#722ed1' }} />}
          {text === 'Storage' && <DatabaseOutlined style={{ color: '#52c41a' }} />}
          {text === 'Network Bandwidth' && <WifiOutlined style={{ color: '#faad14' }} />}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: unknown, record: ResourceUsage) => (
        <div style={{ minWidth: 180 }}>
          <Progress
            percent={Math.round((record.current / record.max) * 100)}
            size="small"
            status={record.status === 'critical' ? 'exception' : record.status === 'warning' ? 'active' : 'normal'}
            strokeColor={
              record.status === 'critical' ? '#f5222d' : record.status === 'warning' ? '#faad14' : '#52c41a'
            }
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.current} / {record.max} {record.unit}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => {
        const icon =
          trend === 'up' ? (
            <ArrowUpOutlined style={{ color: '#f5222d' }} />
          ) : trend === 'down' ? (
            <ArrowDownOutlined style={{ color: '#52c41a' }} />
          ) : (
            <span style={{ color: '#1890ff' }}>-</span>
          );
        return (
          <Space>
            {icon}
            <Text>{trend.charAt(0).toUpperCase() + trend.slice(1)}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'healthy' ? 'green' : status === 'warning' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  // Cost breakdown columns
  const costBreakdownColumns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag
          color={
            category === 'Core Infrastructure'
              ? 'blue'
              : category === 'Security'
                ? 'purple'
                : category === 'Compute'
                  ? 'cyan'
                  : category === 'Storage'
                    ? 'green'
                    : 'orange'
          }
        >
          {category}
        </Tag>
      ),
    },
    {
      title: 'Daily Cost',
      dataIndex: 'dailyCost',
      key: 'dailyCost',
      render: (cost: number) => <Text>${cost.toFixed(2)}</Text>,
      sorter: (a: CostBreakdown, b: CostBreakdown) => a.dailyCost - b.dailyCost,
    },
    {
      title: 'Monthly Cost',
      dataIndex: 'monthlyCost',
      key: 'monthlyCost',
      render: (cost: number) => <Text strong>${cost.toFixed(2)}</Text>,
      sorter: (a: CostBreakdown, b: CostBreakdown) => a.monthlyCost - b.monthlyCost,
    },
    {
      title: '% of Total',
      dataIndex: 'percentageOfTotal',
      key: 'percentageOfTotal',
      render: (percent: number) => (
        <Progress percent={percent} size="small" style={{ minWidth: 100 }} />
      ),
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => {
        if (trend === 'up') return <Tag icon={<RiseOutlined />} color="red">Rising</Tag>;
        if (trend === 'down') return <Tag icon={<FallOutlined />} color="green">Decreasing</Tag>;
        return <Tag color="blue">Stable</Tag>;
      },
    },
  ];

  // Optimization recommendations columns
  const recommendationColumns = [
    {
      title: 'Recommendation',
      key: 'recommendation',
      render: (_: unknown, record: OptimizationRecommendation) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: 'Savings/mo',
      dataIndex: 'potentialSavings',
      key: 'potentialSavings',
      render: (savings: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${savings.toFixed(0)}
        </Text>
      ),
      sorter: (a: OptimizationRecommendation, b: OptimizationRecommendation) =>
        a.potentialSavings - b.potentialSavings,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>
          {priority.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value: React.Key | boolean, record: OptimizationRecommendation) => record.priority === value,
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: string) => (
        <Tag color={impact === 'high' ? 'green' : impact === 'medium' ? 'blue' : 'default'}>
          {impact.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Effort',
      dataIndex: 'effort',
      key: 'effort',
      render: (effort: string) => (
        <Tag color={effort === 'low' ? 'green' : effort === 'medium' ? 'orange' : 'red'}>
          {effort.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'implemented')
          return (
            <Badge status="success" text="Implemented" />
          );
        if (status === 'in_progress')
          return (
            <Badge status="processing" text="In Progress" />
          );
        return <Badge status="default" text="Pending" />;
      },
    },
  ];

  // Underutilized resources columns
  const underutilizedColumns = [
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization: number) => (
        <Space>
          <Progress
            percent={utilization}
            size="small"
            status="exception"
            style={{ width: 80 }}
            format={(percent) => `${percent}%`}
          />
          <Tooltip title="Low utilization - optimization recommended">
            <WarningOutlined style={{ color: '#faad14' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Allocated Cost/mo',
      dataIndex: 'allocatedCost',
      key: 'allocatedCost',
      render: (cost: number) => <Text>${cost.toFixed(2)}</Text>,
    },
    {
      title: 'Recommended Action',
      dataIndex: 'recommendedAction',
      key: 'recommendedAction',
      render: (action: string) => (
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <Text>{action}</Text>
        </Space>
      ),
    },
    {
      title: 'Potential Savings/mo',
      dataIndex: 'potentialSavings',
      key: 'potentialSavings',
      render: (savings: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${savings.toFixed(0)}
        </Text>
      ),
    },
  ];

  // Utilization trend columns
  const trendColumns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'CPU %',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (value: number) => (
        <Progress percent={value} size="small" strokeColor="#1890ff" style={{ width: 80 }} />
      ),
    },
    {
      title: 'Memory %',
      dataIndex: 'memory',
      key: 'memory',
      render: (value: number) => (
        <Progress percent={value} size="small" strokeColor="#722ed1" style={{ width: 80 }} />
      ),
    },
    {
      title: 'Storage %',
      dataIndex: 'storage',
      key: 'storage',
      render: (value: number) => (
        <Progress percent={value} size="small" strokeColor="#52c41a" style={{ width: 80 }} />
      ),
    },
    {
      title: 'Network %',
      dataIndex: 'network',
      key: 'network',
      render: (value: number) => (
        <Progress percent={value} size="small" strokeColor="#faad14" style={{ width: 80 }} />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DollarOutlined style={{ marginRight: 12 }} />
        Cost & Resource Optimization Dashboard
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        Monitor resource usage, analyze costs, and discover optimization opportunities for the
        Aurigraph V11 platform.
      </Text>

      {/* Summary Alert */}
      <Alert
        message="Optimization Opportunity Detected"
        description={
          <span>
            You can save up to <strong>${totalPotentialSavings.toFixed(0)}/month</strong> by
            implementing pending recommendations. Already saved{' '}
            <strong>${implementedSavings.toFixed(0)}/month</strong> through implemented
            optimizations.
          </span>
        }
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginBottom: '24px' }}
      />

      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Daily Cost"
              value={totalDailyCost}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Cost"
              value={totalMonthlyCost}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Potential Monthly Savings"
              value={totalPotentialSavings}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <Tooltip title="Savings from pending recommendations">
                  <CheckCircleOutlined style={{ fontSize: 14, marginLeft: 4 }} />
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Underutilized Resources"
              value={mockUnderutilizedResources.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={
                <Tooltip title={`Potential savings: $${underutilizedSavings}/mo`}>
                  <WarningOutlined style={{ fontSize: 14, marginLeft: 4 }} />
                </Tooltip>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <CloudServerOutlined />
              Resource Usage
            </span>
          }
          key="overview"
        >
          <Row gutter={[16, 16]}>
            {/* Resource Usage Summary Cards */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="CPU Utilization"
                  value={67}
                  suffix="%"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress percent={67} size="small" strokeColor="#1890ff" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Memory Usage"
                  value={38.75}
                  suffix="%"
                  prefix={<HddOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Progress percent={38.75} size="small" strokeColor="#722ed1" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Storage Usage"
                  value={44.5}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress percent={44.5} size="small" strokeColor="#52c41a" status="active" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Network Usage"
                  value={45}
                  suffix="%"
                  prefix={<WifiOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <Progress percent={45} size="small" strokeColor="#faad14" />
              </Card>
            </Col>

            {/* Resource Usage Table */}
            <Col xs={24}>
              <Card title="Detailed Resource Metrics" bordered={false}>
                <Table
                  dataSource={mockResourceUsage}
                  columns={resourceUsageColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Cost Breakdown
            </span>
          }
          key="costs"
        >
          <Row gutter={[16, 16]}>
            {/* Cost Projections */}
            <Col xs={24} md={12}>
              <Card
                title={
                  <span>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Cost Projections
                  </span>
                }
                bordered={false}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Weekly Projection"
                      value={totalDailyCost * 7}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Monthly Projection"
                      value={totalMonthlyCost}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Quarterly Projection"
                      value={totalMonthlyCost * 3}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Annual Projection"
                      value={totalMonthlyCost * 12}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Cost by Category */}
            <Col xs={24} md={12}>
              <Card
                title={
                  <span>
                    <ApiOutlined style={{ marginRight: 8 }} />
                    Cost by Category
                  </span>
                }
                bordered={false}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text>Core Infrastructure</Text>
                  <Progress percent={55} strokeColor="#1890ff" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text>Security</Text>
                  <Progress percent={17} strokeColor="#722ed1" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text>Compute</Text>
                  <Progress percent={14} strokeColor="#13c2c2" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text>Storage</Text>
                  <Progress percent={8} strokeColor="#52c41a" />
                </div>
                <div>
                  <Text>Networking</Text>
                  <Progress percent={6} strokeColor="#faad14" />
                </div>
              </Card>
            </Col>

            {/* Cost Breakdown Table */}
            <Col xs={24}>
              <Card title="Service Cost Breakdown" bordered={false}>
                <Table
                  dataSource={mockCostBreakdown}
                  columns={costBreakdownColumns}
                  pagination={false}
                  size="small"
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                          <Text strong>Total</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} />
                        <Table.Summary.Cell index={2}>
                          <Text strong>${totalDailyCost.toFixed(2)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <Text strong>${totalMonthlyCost.toFixed(2)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          <Progress percent={100} size="small" />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BulbOutlined />
              Recommendations
            </span>
          }
          key="recommendations"
        >
          <Row gutter={[16, 16]}>
            {/* Recommendation Summary */}
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="Pending Recommendations"
                  value={mockOptimizationRecommendations.filter((r) => r.status === 'pending').length}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="In Progress"
                  value={mockOptimizationRecommendations.filter((r) => r.status === 'in_progress').length}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="Implemented Savings"
                  value={implementedSavings}
                  precision={0}
                  prefix="$"
                  suffix="/mo"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>

            {/* Recommendations Table */}
            <Col xs={24}>
              <Card title="Optimization Recommendations" bordered={false}>
                <Table
                  dataSource={mockOptimizationRecommendations}
                  columns={recommendationColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <WarningOutlined />
              Underutilized Resources
            </span>
          }
          key="underutilized"
        >
          <Row gutter={[16, 16]}>
            {/* Underutilized Summary */}
            <Col xs={24}>
              <Alert
                message="Underutilized Resources Detected"
                description={
                  <span>
                    {mockUnderutilizedResources.length} resources are running below 25% utilization.
                    Optimizing these could save <strong>${underutilizedSavings.toFixed(0)}/month</strong>.
                  </span>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            </Col>

            {/* Underutilized Resources Table */}
            <Col xs={24}>
              <Card title="Underutilized Resources" bordered={false}>
                <Table
                  dataSource={mockUnderutilizedResources}
                  columns={underutilizedColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <RiseOutlined />
              Utilization Trends
            </span>
          }
          key="trends"
        >
          <Row gutter={[16, 16]}>
            {/* Trend Summary */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Avg CPU (7 days)"
                  value={67}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Avg Memory (7 days)"
                  value={50}
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Avg Storage (7 days)"
                  value={44}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Avg Network (7 days)"
                  value={47}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>

            {/* Trends Table */}
            <Col xs={24}>
              <Card title="7-Day Utilization Trends" bordered={false}>
                <Table
                  dataSource={mockUtilizationTrends}
                  columns={trendColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Footer Info */}
      <Divider />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          Last updated: {new Date().toLocaleString()} | Data refreshes every 5 minutes
        </Text>
      </div>
    </div>
  );
};

export default CostResourceOptimizationDashboard;
