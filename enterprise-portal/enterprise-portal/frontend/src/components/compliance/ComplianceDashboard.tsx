/**
 * Compliance Dashboard Component
 * Real-time compliance monitoring and reporting
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Divider,
  Progress,
  Timeline,
  Empty,
  Spin,
  Tabs,
  List,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationOutlined,
  SafetyOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

interface ComplianceMetric {
  name: string;
  value: number;
  target: number;
  status: 'success' | 'warning' | 'error';
}

interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface ComplianceRecord {
  id: string;
  tokenId: string;
  jurisdiction: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  lastCheckDate: string;
  nextCheckDate: string;
  verifiedBy: string;
  complianceRate: number;
}

interface ComplianceDashboardProps {
  refreshInterval?: number;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  refreshInterval = 30000,
}) => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState('metrics');

  // Mock data loading
  useEffect(() => {
    const loadComplianceData = async () => {
      try {
        setLoading(true);

        // Mock metrics
        setMetrics([
          {
            name: 'Identity Verification Rate',
            value: 98,
            target: 100,
            status: 'success',
          },
          {
            name: 'Transfer Approval Rate',
            value: 96,
            target: 95,
            status: 'success',
          },
          {
            name: 'Compliance Check Pass Rate',
            value: 94,
            target: 98,
            status: 'warning',
          },
          {
            name: 'OFAC Cache Hit Rate',
            value: 87,
            target: 90,
            status: 'warning',
          },
        ]);

        // Mock alerts
        setAlerts([
          {
            id: '1',
            type: 'warning',
            title: 'Low Compliance Check Pass Rate',
            description: 'Compliance check pass rate has dropped to 94%. Investigate potential issues.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            resolved: false,
          },
          {
            id: '2',
            type: 'info',
            title: 'OFAC Sanctions Update',
            description: 'OFAC sanctions list has been updated with 5 new entries.',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            resolved: true,
          },
          {
            id: '3',
            type: 'critical',
            title: 'High Rejection Rate Detected',
            description: 'Transfer rejection rate has increased to 8% for token RWAT-001.',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            resolved: false,
          },
        ]);

        // Mock compliance records
        setRecords([
          {
            id: '1',
            tokenId: 'RWAT-001',
            jurisdiction: 'US',
            status: 'compliant',
            lastCheckDate: new Date(Date.now() - 86400000).toISOString(),
            nextCheckDate: new Date(Date.now() + 604800000).toISOString(),
            verifiedBy: 'Compliance Officer',
            complianceRate: 98,
          },
          {
            id: '2',
            tokenId: 'RWAT-002',
            jurisdiction: 'EU',
            status: 'compliant',
            lastCheckDate: new Date(Date.now() - 172800000).toISOString(),
            nextCheckDate: new Date(Date.now() + 432000000).toISOString(),
            verifiedBy: 'External Auditor',
            complianceRate: 100,
          },
          {
            id: '3',
            tokenId: 'RWAT-003',
            jurisdiction: 'UK',
            status: 'pending',
            lastCheckDate: new Date(Date.now() - 259200000).toISOString(),
            nextCheckDate: new Date(Date.now() + 86400000).toISOString(),
            verifiedBy: 'Pending',
            complianceRate: 85,
          },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load compliance data:', error);
        setLoading(false);
      }
    };

    loadComplianceData();
    const interval = setInterval(loadComplianceData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const metricsColumns = [
    {
      title: 'Metric',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <span>
          {value}% <ArrowUpOutlined style={{ color: 'green', marginLeft: 8 }} />
        </span>
      ),
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
      render: (target: number) => `${target}%`,
    },
    {
      title: 'Progress',
      dataIndex: ['value', 'target'],
      key: 'progress',
      render: (_: any, record: ComplianceMetric) => (
        <Progress percent={record.value} size="small" status={record.status as any} />
      ),
    },
  ];

  const recordsColumns = [
    {
      title: 'Token ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (tokenId: string) => <Tag color="blue">{tokenId}</Tag>,
    },
    {
      title: 'Jurisdiction',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap = {
          compliant: 'green',
          non_compliant: 'red',
          pending: 'orange',
        };
        return <Tag color={colorMap as any}>{status}</Tag>;
      },
    },
    {
      title: 'Compliance Rate',
      dataIndex: 'complianceRate',
      key: 'complianceRate',
      render: (rate: number) => <Progress percent={rate} size="small" />,
    },
    {
      title: 'Last Check',
      dataIndex: 'lastCheckDate',
      key: 'lastCheckDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => <Button type="link" size="small">Details</Button>,
    },
  ];

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <SafetyOutlined style={{ fontSize: 20 }} />
            Compliance Dashboard
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => {}}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />}>Export Report</Button>
          </Space>
        }
      >
        {/* System Status */}
        <Alert
          message="System Status: Operational"
          description="All compliance checks are running normally. Last update: 2 minutes ago."
          type="success"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />

        {/* Key Metrics */}
        <h3>Key Performance Indicators</h3>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Active Tokens"
                value={records.length}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Compliant Tokens"
                value={records.filter(r => r.status === 'compliant').length}
                suffix={`/ ${records.length}`}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Active Alerts"
                value={activeAlerts.length}
                prefix={<ExclamationOutlined />}
                valueStyle={{ color: activeAlerts.length > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="Avg Compliance Rate"
                value={
                  records.length > 0
                    ? Math.round(records.reduce((sum, r) => sum + r.complianceRate, 0) / records.length)
                    : 0
                }
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Tabs */}
        <Tabs
          activeKey={selectedTab}
          onChange={setSelectedTab}
          items={[
            {
              key: 'metrics',
              label: 'Compliance Metrics',
              children: (
                <Spin spinning={loading}>
                  <Table
                    dataSource={metrics}
                    columns={metricsColumns}
                    pagination={false}
                    rowKey="name"
                    size="small"
                  />
                </Spin>
              ),
            },
            {
              key: 'tokens',
              label: 'Token Compliance Status',
              children: (
                <Spin spinning={loading}>
                  <Table
                    dataSource={records}
                    columns={recordsColumns}
                    pagination={{ pageSize: 10 }}
                    rowKey="id"
                    size="small"
                  />
                </Spin>
              ),
            },
            {
              key: 'alerts',
              label: (
                <span>
                  Alerts <Tag color="red">{activeAlerts.length}</Tag>
                </span>
              ),
              children: (
                <Spin spinning={loading}>
                  {activeAlerts.length > 0 ? (
                    <div>
                      <h4>Active Alerts</h4>
                      <List
                        dataSource={activeAlerts}
                        renderItem={(alert) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                alert.type === 'critical' ? (
                                  <ExclamationOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                                ) : (
                                  <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />
                                )
                              }
                              title={alert.title}
                              description={
                                <>
                                  {alert.description}
                                  <br />
                                  <small>{new Date(alert.timestamp).toLocaleString()}</small>
                                </>
                              }
                            />
                            <Button type="link" size="small">Acknowledge</Button>
                          </List.Item>
                        )}
                      />
                    </div>
                  ) : (
                    <Alert message="No active alerts" type="success" showIcon />
                  )}

                  <Divider />

                  <h4>Resolved Alerts</h4>
                  {resolvedAlerts.length > 0 ? (
                    <Timeline
                      items={resolvedAlerts.map((alert) => ({
                        children: (
                          <p>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                            {alert.title}
                            <br />
                            <small>{new Date(alert.timestamp).toLocaleString()}</small>
                          </p>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty description="No resolved alerts" />
                  )}
                </Spin>
              ),
            },
            {
              key: 'reports',
              label: 'Compliance Reports',
              children: (
                <div>
                  <List
                    dataSource={[
                      {
                        title: 'Monthly Compliance Report',
                        date: 'November 2025',
                        status: 'Available',
                      },
                      {
                        title: 'Quarterly KYC/AML Report',
                        date: 'Q3 2025',
                        status: 'Available',
                      },
                      {
                        title: 'Transfer Compliance Analysis',
                        date: 'October 2025',
                        status: 'Available',
                      },
                    ]}
                    renderItem={(report) => (
                      <List.Item
                        extra={<Button type="link" icon={<DownloadOutlined />}>Download</Button>}
                      >
                        <List.Item.Meta
                          title={report.title}
                          description={`Period: ${report.date}`}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ComplianceDashboard;
