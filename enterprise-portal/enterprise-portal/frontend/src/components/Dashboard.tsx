/**
 * Main Dashboard Component
 *
 * Overview dashboard for the Aurigraph Enterprise Portal
 */

import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  NodeIndexOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../hooks/useRedux';
import { selectSystemMetrics, selectWsConnected } from '../store/selectors';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const systemMetrics = useAppSelector(selectSystemMetrics);
  const wsConnected = useAppSelector(selectWsConnected);

  // Mock data for recent activity
  const recentActivity = [
    {
      key: '1',
      timestamp: new Date().toLocaleTimeString(),
      event: 'System Started',
      status: 'success',
    },
    {
      key: '2',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
      event: 'Health Check Passed',
      status: 'success',
    },
    {
      key: '3',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      event: 'Configuration Updated',
      status: 'info',
    },
  ];

  const activityColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
    },
    {
      title: 'Event',
      dataIndex: 'event',
      key: 'event',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'blue'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  // Mock data for Ricardian/Active Contracts
  const ricardianContracts = [
    {
      key: '1',
      contractId: 'RC-2025-001',
      title: 'Real Estate Asset Token',
      status: 'active',
      createdAt: '2025-10-08',
      activeContracts: 25,
    },
    {
      key: '2',
      contractId: 'RC-2025-002',
      title: 'Supply Chain Agreement',
      status: 'active',
      createdAt: '2025-10-05',
      activeContracts: 12,
    },
    {
      key: '3',
      contractId: 'RC-2025-003',
      title: 'Carbon Credit Token',
      status: 'pending',
      createdAt: '2025-10-09',
      activeContracts: 0,
    },
  ];

  const contractColumns = [
    {
      title: 'Contract ID',
      dataIndex: 'contractId',
      key: 'contractId',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Active Contracts',
      dataIndex: 'activeContracts',
      key: 'activeContracts',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  // Mock data for Registries
  const registries = [
    {
      key: '1',
      name: 'Asset Registry',
      type: 'Real-World Assets',
      totalRecords: 1247,
      lastUpdated: '2 min ago',
      status: 'healthy',
    },
    {
      key: '2',
      name: 'Identity Registry',
      type: 'KYC/AML',
      totalRecords: 3891,
      lastUpdated: '5 min ago',
      status: 'healthy',
    },
    {
      key: '3',
      name: 'Token Registry',
      type: 'Digital Assets',
      totalRecords: 567,
      lastUpdated: '1 min ago',
      status: 'healthy',
    },
    {
      key: '4',
      name: 'Contract Registry',
      type: 'Smart Contracts',
      totalRecords: 89,
      lastUpdated: '10 min ago',
      status: 'syncing',
    },
  ];

  const registryColumns = [
    {
      title: 'Registry Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Total Records',
      dataIndex: 'totalRecords',
      key: 'totalRecords',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'healthy' ? 'green' : 'blue'} icon={status === 'syncing' ? <SyncOutlined spin /> : undefined}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Enterprise Portal Dashboard</h1>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Welcome to the Aurigraph V11 Enterprise Portal. Monitor your blockchain
        platform performance and manage your infrastructure.
      </p>

      {/* System Status Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current TPS"
              value={systemMetrics.performance?.tps || 0}
              precision={0}
              prefix={<ThunderboltOutlined />}
              suffix="tx/s"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Latency"
              value={systemMetrics.performance?.avgLatencyMs || 0}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="ms"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Nodes"
              value={systemMetrics.network?.activeNodes || 0}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Status"
              value={wsConnected ? 'Online' : 'Offline'}
              prefix={
                wsConnected ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ color: '#faad14' }} />
                )
              }
              valueStyle={{
                color: wsConnected ? '#52c41a' : '#faad14',
                fontSize: '20px',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* System Information */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Platform Information" bordered={false}>
            <p>
              <strong>Version:</strong> Aurigraph V11 11.0.0
            </p>
            <p>
              <strong>Runtime:</strong> Java 21 / Quarkus 3.26.2
            </p>
            <p>
              <strong>Consensus:</strong> HyperRAFT++
            </p>
            <p>
              <strong>Cryptography:</strong> Quantum-Resistant (CRYSTALS-Dilithium)
            </p>
            <p>
              <strong>Target TPS:</strong> 2M+
            </p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" bordered={false}>
            <Table
              dataSource={recentActivity}
              columns={activityColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Ricardian/Active Contracts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <FileTextOutlined /> Ricardian Contracts → Active Contracts
              </span>
            }
            extra={
              <Tag color="green">
                {ricardianContracts.reduce((sum, c) => sum + c.activeContracts, 0)} Active
              </Tag>
            }
            bordered={false}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Total Ricardian Contracts"
                    value={ricardianContracts.length}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Active Contract Instances"
                    value={ricardianContracts.reduce((sum, c) => sum + c.activeContracts, 0)}
                    prefix={<SafetyOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Statistic
                    title="Conversion Rate"
                    value={98.5}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Progress percent={98.5} size="small" status="active" />
                </Card>
              </Col>
            </Row>
            <Table
              dataSource={ricardianContracts}
              columns={contractColumns}
              pagination={false}
              size="small"
            />
            <div style={{ marginTop: '12px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <FileTextOutlined /> Ricardian contracts are human-readable legal agreements that are automatically converted to executable smart contracts.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Registries */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <DatabaseOutlined /> Enterprise Registries
              </span>
            }
            extra={
              <Tag color="blue">
                {registries.reduce((sum, r) => sum + r.totalRecords, 0).toLocaleString()} Total Records
              </Tag>
            }
            bordered={false}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Active Registries"
                    value={registries.length}
                    prefix={<DatabaseOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Asset Records"
                    value={registries.find((r) => r.name === 'Asset Registry')?.totalRecords || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Identity Records"
                    value={registries.find((r) => r.name === 'Identity Registry')?.totalRecords || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Token Records"
                    value={registries.find((r) => r.name === 'Token Registry')?.totalRecords || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
            <Table
              dataSource={registries}
              columns={registryColumns}
              pagination={false}
              size="small"
            />
            <div style={{ marginTop: '12px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <DatabaseOutlined /> Registries provide immutable records for assets, identities, tokens, and contracts across the Aurigraph platform.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Links */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Quick Links" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <a
                  href="https://dlt.aurigraph.io/q/health"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Backend Health Check
                </a>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <a
                  href="https://dlt.aurigraph.io/q/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Prometheus Metrics
                </a>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <a
                  href="https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JIRA Board
                </a>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <a
                  href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
