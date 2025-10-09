/**
 * Main Dashboard Component
 *
 * Overview dashboard for the Aurigraph Enterprise Portal
 */

import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  NodeIndexOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../hooks/useRedux';
import { selectSystemMetrics, selectWsConnected } from '../store/selectors';

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
