/**
 * Integrated Dashboard Component
 *
 * Real-time dashboard with live data from Aurigraph V11 API
 * Displays blockchain metrics, recent blocks, transactions, validators, and system health
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography, Spin, Alert, Button, Space } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { aurigraphAPI, BlockchainMetrics, Block, Transaction, Validator, ConsensusStatus } from '../services/AurigraphAPIService';

const { Text, Title } = Typography;

interface DashboardState {
  loading: boolean;
  error: string | null;
  metrics: BlockchainMetrics | null;
  blocks: Block[];
  transactions: Transaction[];
  validators: Validator[];
  consensusStatus: ConsensusStatus | null;
  lastUpdated: Date | null;
}

const DashboardIntegrated: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    metrics: null,
    blocks: [],
    transactions: [],
    validators: [],
    consensusStatus: null,
    lastUpdated: null,
  });

  /**
   * Fetch all dashboard data from API
   */
  const fetchDashboardData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel
      const [metrics, blocks, transactions, validators, consensusStatus] = await Promise.all([
        aurigraphAPI.getBlockchainMetrics(),
        aurigraphAPI.getBlocks(10),
        aurigraphAPI.getTransactions(10),
        aurigraphAPI.getValidators(),
        aurigraphAPI.getConsensusStatus(),
      ]);

      setState({
        loading: false,
        error: null,
        metrics,
        blocks,
        transactions,
        validators,
        consensusStatus,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(fetchDashboardData, 5000);

    return () => clearInterval(interval);
  }, []);

  // Block columns
  const blockColumns = [
    {
      title: 'Height',
      dataIndex: 'height',
      key: 'height',
      width: 80,
      render: (height: number) => <Text strong>{height}</Text>,
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 150,
      render: (hash: string) => <Text code>{hash.substring(0, 16)}...</Text>,
    },
    {
      title: 'Transactions',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      width: 80,
    },
    {
      title: 'Proposer',
      dataIndex: 'proposer',
      key: 'proposer',
      width: 100,
      render: (proposer: string) => <Text code>{proposer.substring(0, 12)}...</Text>,
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: string) => <Text>{new Date(timestamp).toLocaleTimeString()}</Text>,
    },
  ];

  // Transaction columns
  const transactionColumns = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 150,
      render: (hash: string) => <Text code>{hash.substring(0, 16)}...</Text>,
    },
    {
      title: 'From → To',
      key: 'addresses',
      width: 200,
      render: (_: any, record: Transaction) => (
        <Text code>
          {record.from.substring(0, 8)}... → {record.to.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: string) => <Text strong>{amount} AUR</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === 'CONFIRMED') color = 'green';
        else if (status === 'PENDING') color = 'blue';
        else if (status === 'FAILED') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: string) => <Text>{new Date(timestamp).toLocaleTimeString()}</Text>,
    },
  ];

  // Validator columns
  const validatorColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 150,
      render: (address: string) => <Text code>{address.substring(0, 16)}...</Text>,
    },
    {
      title: 'Stake',
      dataIndex: 'stake',
      key: 'stake',
      width: 100,
      render: (stake: string) => <Text>{stake} AUR</Text>,
    },
    {
      title: 'Voting Power',
      dataIndex: 'votingPower',
      key: 'votingPower',
      width: 120,
      render: (votingPower: number) => (
        <Progress type="circle" percent={votingPower} width={40} />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : status === 'INACTIVE' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 100,
      render: (uptime: number) => <Text>{uptime}%</Text>,
    },
  ];

  const { metrics, blocks, transactions, validators, consensusStatus, error, loading, lastUpdated } = state;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Aurigraph V11 Dashboard
        </Title>
        <Space>
          <Text type="secondary">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="Error Loading Dashboard"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && !metrics && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      )}

      {metrics && (
        <>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Transactions/sec"
                  value={metrics.tps}
                  prefix={<ThunderboltOutlined />}
                  suffix="TPS"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Transactions"
                  value={metrics.totalTransactions}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Blocks"
                  value={metrics.totalBlocks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Network Health"
                  value={metrics.networkHealth}
                  suffix="%"
                  prefix={<SafetyOutlined />}
                  valueStyle={{ color: metrics.networkHealth > 80 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={8}>
              <Card title="Consensus">
                <Statistic
                  title="Algorithm"
                  value={consensusStatus?.algorithm || 'N/A'}
                  valueStyle={{ fontSize: '16px' }}
                />
                <Statistic
                  title="Current Term"
                  value={consensusStatus?.currentTerm || 0}
                  valueStyle={{ fontSize: '16px', marginTop: '12px' }}
                />
                <Statistic
                  title="Active Validators"
                  value={consensusStatus?.activeValidators || 0}
                  valueStyle={{ fontSize: '16px', marginTop: '12px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Performance">
                <Statistic
                  title="Avg Block Time"
                  value={metrics.averageBlockTime}
                  suffix="ms"
                  valueStyle={{ fontSize: '16px' }}
                />
                <Statistic
                  title="Avg Latency"
                  value={metrics.averageLatency}
                  suffix="ms"
                  valueStyle={{ fontSize: '16px', marginTop: '12px' }}
                />
                <Statistic
                  title="Finality"
                  value={metrics.finality}
                  suffix="ms"
                  valueStyle={{ fontSize: '16px', marginTop: '12px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Network Status">
                <Statistic
                  title="Active Validators"
                  value={metrics.activationValidators}
                  valueStyle={{ fontSize: '16px' }}
                />
                <Statistic
                  title="Uptime"
                  value={metrics.uptime}
                  suffix="%"
                  valueStyle={{ fontSize: '16px', marginTop: '12px' }}
                />
                <Progress percent={metrics.uptime} status={metrics.uptime > 99 ? 'success' : 'normal'} />
              </Card>
            </Col>
          </Row>

          {/* Recent Blocks */}
          <Card title={`Recent Blocks (${blocks.length})`} style={{ marginBottom: '24px' }}>
            <Table
              columns={blockColumns}
              dataSource={blocks.map((block) => ({ ...block, key: block.hash }))}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>

          {/* Recent Transactions */}
          <Card title={`Recent Transactions (${transactions.length})`} style={{ marginBottom: '24px' }}>
            <Table
              columns={transactionColumns}
              dataSource={transactions.map((tx) => ({ ...tx, key: tx.hash }))}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>

          {/* Validators */}
          <Card title={`Active Validators (${validators.length})`}>
            <Table
              columns={validatorColumns}
              dataSource={validators.map((v) => ({ ...v, key: v.id }))}
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardIntegrated;
