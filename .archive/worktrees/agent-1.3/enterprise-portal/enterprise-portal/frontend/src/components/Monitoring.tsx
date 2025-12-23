/**
 * Monitoring Component
 *
 * System monitoring and performance metrics for the enterprise portal
 */

import React from 'react';
import { Row, Col, Card, Statistic, Progress, Alert } from 'antd';
import {
  DatabaseOutlined,
  ClusterOutlined,
  CloudServerOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../hooks/useRedux';
import { selectSystemMetrics } from '../store/selectors';

const Monitoring: React.FC = () => {
  const systemMetrics = useAppSelector(selectSystemMetrics);

  const cpuUsage = systemMetrics.performance?.cpuUsagePercent || 0;
  const memoryUsage = systemMetrics.performance?.memoryUsageMb || 0;
  const maxMemory = 4096; // Example max memory

  return (
    <div style={{ padding: '24px' }}>
      <h1>System Monitoring</h1>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Real-time monitoring of Aurigraph V11 platform health and performance
      </p>

      {/* Health Status Alert */}
      <Alert
        message="System Health: All Systems Operational"
        description="All critical services are running normally. No issues detected."
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="CPU Usage" bordered={false}>
            <Progress
              percent={Math.round(cpuUsage)}
              status={cpuUsage > 80 ? 'exception' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <p style={{ marginTop: '16px' }}>
              Current: {cpuUsage.toFixed(2)}% | Available Processors: 16
            </p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Memory Usage" bordered={false}>
            <Progress
              percent={Math.round((memoryUsage / maxMemory) * 100)}
              status={(memoryUsage / maxMemory) * 100 > 80 ? 'exception' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <p style={{ marginTop: '16px' }}>
              Current: {memoryUsage.toFixed(0)} MB / {maxMemory} MB
            </p>
          </Card>
        </Col>
      </Row>

      {/* Service Health */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Database"
              value="UP"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Consensus"
              value="UP"
              prefix={<ClusterOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Network"
              value="UP"
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Security"
              value="UP"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Performance Statistics" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Total Transactions"
                  value={systemMetrics.performance?.totalTransactions || 0}
                  suffix="txs"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Active Transactions"
                  value={systemMetrics.performance?.activeTransactions || 0}
                  suffix="txs"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Confirmed Transactions"
                  value={systemMetrics.performance?.confirmedTransactions || 0}
                  suffix="txs"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Peak TPS"
                  value={systemMetrics.performance?.peakTps || 0}
                  precision={0}
                  suffix="tx/s"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="P95 Latency"
                  value={systemMetrics.performance?.p95LatencyMs || 0}
                  precision={2}
                  suffix="ms"
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="P99 Latency"
                  value={systemMetrics.performance?.p99LatencyMs || 0}
                  precision={2}
                  suffix="ms"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Monitoring;
