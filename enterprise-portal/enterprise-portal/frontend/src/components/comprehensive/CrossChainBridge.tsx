/**
 * Cross-Chain Bridge Component
 *
 * Bridge status, cross-chain transfers, and supported chains management
 * Connects to bridge/CrossChainBridgeService.java backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Progress,
  Alert,
  Steps,
  Typography,
  Tooltip,
  Badge,
} from 'antd';
import {
  SwapOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  SendOutlined,
  LinkOutlined,
  WarningOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  BridgeStatus,
  CrossChainTransfer,
  SupportedChain,
  BridgeMetrics,
} from '../../types/comprehensive';

const { Text, Title } = Typography;
const { Step } = Steps;

const CrossChainBridge: React.FC = () => {
  const [bridges, setBridges] = useState<BridgeStatus[]>([]);
  const [transfers, setTransfers] = useState<CrossChainTransfer[]>([]);
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [metrics, setMetrics] = useState<BridgeMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [transferModalVisible, setTransferModalVisible] = useState<boolean>(false);
  const [selectedTransfer, setSelectedTransfer] = useState<CrossChainTransfer | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [transferForm] = Form.useForm();

  // Fetch bridge data
  const fetchBridgeData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls to CrossChainBridgeService.java
      setBridges(generateMockBridges());
      setTransfers(generateMockTransfers(20));
      setSupportedChains(generateMockChains());
      setMetrics(generateMockMetrics());
    } catch (error) {
      console.error('Error fetching bridge data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBridgeData();

    const interval = setInterval(() => {
      fetchBridgeData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle new transfer
  const handleNewTransfer = () => {
    setTransferModalVisible(true);
  };

  const handleTransferSubmit = async (values: any) => {
    console.log('Creating transfer:', values);
    // TODO: Implement transfer creation API call
    setTransferModalVisible(false);
    transferForm.resetFields();
  };

  // Show transfer details
  const showTransferDetail = (transfer: CrossChainTransfer) => {
    setSelectedTransfer(transfer);
    setDetailModalVisible(true);
  };

  // Get transfer status step
  const getTransferStep = (status: CrossChainTransfer['status']): number => {
    const steps = { initiated: 0, locked: 1, verified: 2, completed: 3, failed: 1, refunded: 1 };
    return steps[status] || 0;
  };

  // Bridge columns
  const bridgeColumns: ColumnsType<BridgeStatus> = [
    {
      title: 'Bridge',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <LinkOutlined />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.sourceChain} ↔ {record.targetChain}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: BridgeStatus['status']) => {
        const config = {
          active: { icon: <CheckCircleOutlined />, color: 'success' },
          paused: { icon: <WarningOutlined />, color: 'warning' },
          maintenance: { icon: <SyncOutlined spin />, color: 'processing' },
          offline: { icon: <WarningOutlined />, color: 'error' },
        };
        return <Tag icon={config[status].icon} color={config[status].color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'TVL',
      dataIndex: 'totalValueLocked',
      key: 'totalValueLocked',
      render: (tvl: number) => <Text strong>${(tvl / 1000000).toFixed(2)}M</Text>,
    },
    {
      title: 'Transfers',
      dataIndex: 'totalTransfers',
      key: 'totalTransfers',
      render: (count: number) => <Badge count={count} showZero color="#1890ff" />,
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <div>
          <Text>{(rate * 100).toFixed(1)}%</Text>
          <Progress percent={rate * 100} size="small" showInfo={false} strokeColor="#52c41a" />
        </div>
      ),
    },
    {
      title: 'Avg Time',
      dataIndex: 'averageTransferTime',
      key: 'averageTransferTime',
      render: (time: number) => <Text>{Math.floor(time / 60)}m {time % 60}s</Text>,
    },
  ];

  // Transfer columns
  const transferColumns: ColumnsType<CrossChainTransfer> = [
    {
      title: 'Transfer ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Route',
      key: 'route',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tag color="blue">{record.sourceChain}</Tag>
          <SwapOutlined />
          <Tag color="green">{record.targetChain}</Tag>
        </Space>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 150,
      render: (_, record) => (
        <Text strong>
          {record.amount.toFixed(4)} {record.token}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: CrossChainTransfer['status']) => {
        const config = {
          initiated: { color: 'processing', icon: <ClockCircleOutlined /> },
          locked: { color: 'processing', icon: <SyncOutlined spin /> },
          verified: { color: 'processing', icon: <CheckCircleOutlined /> },
          completed: { color: 'success', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', icon: <WarningOutlined /> },
          refunded: { color: 'warning', icon: <WarningOutlined /> },
        };
        return <Tag icon={config[status].icon} color={config[status].color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const progress = (record.confirmations / record.requiredConfirmations) * 100;
        return (
          <Tooltip title={`${record.confirmations}/${record.requiredConfirmations} confirmations`}>
            <Progress percent={progress} size="small" status={record.status === 'completed' ? 'success' : 'active'} />
          </Tooltip>
        );
      },
    },
    {
      title: 'Time',
      dataIndex: 'initiatedAt',
      key: 'initiatedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleTimeString(),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button size="small" type="link" onClick={() => showTransferDetail(record)}>
          View
        </Button>
      ),
    },
  ];

  // Chain columns
  const chainColumns: ColumnsType<SupportedChain> = [
    {
      title: 'Chain',
      key: 'chain',
      render: (_, record) => (
        <Space>
          <GlobalOutlined />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary">{record.network}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: SupportedChain['status']) => {
        const config = {
          connected: { color: 'success', icon: <CheckCircleOutlined /> },
          disconnected: { color: 'error', icon: <WarningOutlined /> },
          syncing: { color: 'processing', icon: <SyncOutlined spin /> },
        };
        return <Tag icon={config[status].icon} color={config[status].color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Block Height',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      render: (height: number) => height.toLocaleString(),
    },
    {
      title: 'Bridge Fee',
      dataIndex: 'bridgeFee',
      key: 'bridgeFee',
      render: (fee: number) => `${fee}%`,
    },
    {
      title: 'Supported Tokens',
      dataIndex: 'supportedTokens',
      key: 'supportedTokens',
      render: (tokens: string[]) => <Badge count={tokens.length} color="#1890ff" />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Cross-Chain Bridge</Title>
      <Text type="secondary">Transfer assets securely across different blockchain networks</Text>

      {/* Bridge Metrics */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px', marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Value Locked"
                value={metrics.totalValueLocked / 1000000}
                precision={2}
                prefix="$"
                suffix="M"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="24h Transfers"
                value={metrics.totalTransfers24h}
                prefix={<SwapOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={metrics.successRate * 100}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Transfer Time"
                value={Math.floor(metrics.averageTransferTime / 60)}
                suffix="min"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* New Transfer Button */}
      <Space style={{ marginBottom: '24px' }}>
        <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleNewTransfer}>
          New Transfer
        </Button>
      </Space>

      {/* Bridge Status */}
      <Card title="Active Bridges" style={{ marginBottom: '24px' }}>
        <Table
          columns={bridgeColumns}
          dataSource={bridges}
          loading={loading}
          rowKey="bridgeId"
          pagination={false}
        />
      </Card>

      {/* Recent Transfers */}
      <Card title="Recent Transfers">
        <Table
          columns={transferColumns}
          dataSource={transfers}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Supported Chains */}
      <Card title="Supported Chains" style={{ marginTop: '24px' }}>
        <Table
          columns={chainColumns}
          dataSource={supportedChains}
          loading={loading}
          rowKey="chainId"
          pagination={false}
        />
      </Card>

      {/* New Transfer Modal */}
      <Modal
        title="Create Cross-Chain Transfer"
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={transferForm} layout="vertical" onFinish={handleTransferSubmit}>
          <Form.Item label="Source Chain" name="sourceChain" rules={[{ required: true }]}>
            <Select placeholder="Select source chain">
              {supportedChains.map((chain) => (
                <Select.Option key={chain.chainId} value={chain.chainId}>
                  {chain.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Target Chain" name="targetChain" rules={[{ required: true }]}>
            <Select placeholder="Select target chain">
              {supportedChains.map((chain) => (
                <Select.Option key={chain.chainId} value={chain.chainId}>
                  {chain.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Token" name="token" rules={[{ required: true }]}>
            <Select placeholder="Select token">
              <Select.Option value="AUR">AUR</Select.Option>
              <Select.Option value="ETH">ETH</Select.Option>
              <Select.Option value="BTC">BTC</Select.Option>
              <Select.Option value="USDC">USDC</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="Enter amount" />
          </Form.Item>

          <Form.Item label="Recipient Address" name="recipient" rules={[{ required: true }]}>
            <Input placeholder="0x..." />
          </Form.Item>

          <Alert
            message="Transfer Fee"
            description="A bridge fee of 0.1% will be applied to this transfer. Estimated time: 5-10 minutes."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setTransferModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Initiate Transfer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Transfer Detail Modal */}
      <Modal
        title="Transfer Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTransfer && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Steps current={getTransferStep(selectedTransfer.status)} status={selectedTransfer.status === 'failed' ? 'error' : 'process'}>
              <Step title="Initiated" description="Transfer started" />
              <Step title="Locked" description="Funds locked" />
              <Step title="Verified" description="Transaction verified" />
              <Step title="Completed" description="Transfer complete" />
            </Steps>

            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text><strong>Transfer ID:</strong> <Text copyable>{selectedTransfer.id}</Text></Text>
                <Text><strong>Route:</strong> {selectedTransfer.sourceChain} → {selectedTransfer.targetChain}</Text>
                <Text><strong>Amount:</strong> {selectedTransfer.amount.toFixed(4)} {selectedTransfer.token}</Text>
                <Text><strong>Fee:</strong> {selectedTransfer.fee.toFixed(4)} {selectedTransfer.token}</Text>
                <Text><strong>Status:</strong> <Tag>{selectedTransfer.status.toUpperCase()}</Tag></Text>
                <Text><strong>Progress:</strong> {selectedTransfer.confirmations}/{selectedTransfer.requiredConfirmations} confirmations</Text>
                {selectedTransfer.sourceTransaction && (
                  <Text><strong>Source TX:</strong> <Text copyable>{selectedTransfer.sourceTransaction}</Text></Text>
                )}
                {selectedTransfer.targetTransaction && (
                  <Text><strong>Target TX:</strong> <Text copyable>{selectedTransfer.targetTransaction}</Text></Text>
                )}
                <Text><strong>Initiated:</strong> {new Date(selectedTransfer.initiatedAt).toLocaleString()}</Text>
                {selectedTransfer.estimatedCompletionTime && (
                  <Text><strong>Estimated Completion:</strong> {new Date(selectedTransfer.estimatedCompletionTime).toLocaleString()}</Text>
                )}
              </Space>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

// Mock data generators
const generateMockBridges = (): BridgeStatus[] => [
  {
    bridgeId: 'bridge-1',
    name: 'Aurigraph ↔ Ethereum',
    status: 'active',
    sourceChain: 'Aurigraph',
    targetChain: 'Ethereum',
    totalValueLocked: 45000000,
    totalTransfers: 12543,
    averageTransferTime: 420,
    successRate: 0.995,
    lastTransferAt: new Date().toISOString(),
  },
  {
    bridgeId: 'bridge-2',
    name: 'Aurigraph ↔ BSC',
    status: 'active',
    sourceChain: 'Aurigraph',
    targetChain: 'BSC',
    totalValueLocked: 28000000,
    totalTransfers: 8934,
    averageTransferTime: 360,
    successRate: 0.998,
    lastTransferAt: new Date().toISOString(),
  },
  {
    bridgeId: 'bridge-3',
    name: 'Aurigraph ↔ Polygon',
    status: 'maintenance',
    sourceChain: 'Aurigraph',
    targetChain: 'Polygon',
    totalValueLocked: 15000000,
    totalTransfers: 5421,
    averageTransferTime: 300,
    successRate: 0.992,
  },
];

const generateMockTransfers = (count: number): CrossChainTransfer[] => {
  const chains = ['Aurigraph', 'Ethereum', 'BSC', 'Polygon'];
  const tokens = ['AUR', 'ETH', 'BTC', 'USDC'];
  const statuses: CrossChainTransfer['status'][] = ['initiated', 'locked', 'verified', 'completed'];

  return Array.from({ length: count }, (_, i) => {
    const sourceChainIndex = Math.floor(Math.random() * chains.length);
    let targetChainIndex = Math.floor(Math.random() * chains.length);
    // Ensure source and target are different
    while (targetChainIndex === sourceChainIndex) {
      targetChainIndex = Math.floor(Math.random() * chains.length);
    }

    return {
      id: `transfer-${Math.random().toString(36).substring(2, 15)}`,
      bridgeId: `bridge-${(i % 3) + 1}`,
      sourceChain: chains[sourceChainIndex] || 'Aurigraph',
      targetChain: chains[targetChainIndex] || 'Ethereum',
      sourceTransaction: `0x${Math.random().toString(16).substring(2)}`,
      targetTransaction: Math.random() > 0.5 ? `0x${Math.random().toString(16).substring(2)}` : undefined,
      status: (statuses[Math.floor(Math.random() * statuses.length)] || 'initiated') as CrossChainTransfer['status'],
      token: tokens[Math.floor(Math.random() * tokens.length)] || 'AUR',
      amount: Math.random() * 100 + 1,
      sender: `0x${Math.random().toString(16).substring(2, 42)}`,
      recipient: `0x${Math.random().toString(16).substring(2, 42)}`,
      fee: Math.random() * 0.5,
      initiatedAt: new Date(Date.now() - i * 300000).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date(Date.now() - i * 300000 + 600000).toISOString() : undefined,
      confirmations: Math.floor(Math.random() * 30),
      requiredConfirmations: 30,
    };
  });
};

const generateMockChains = (): SupportedChain[] => [
  {
    chainId: 'aurigraph',
    name: 'Aurigraph',
    network: 'mainnet',
    status: 'connected',
    blockHeight: 1500250,
    avgBlockTime: 2.5,
    nativeToken: 'AUR',
    supportedTokens: ['AUR', 'ETH', 'BTC', 'USDC', 'USDT'],
    bridgeFee: 0.1,
    minTransferAmount: 0.01,
    maxTransferAmount: 1000000,
  },
  {
    chainId: 'ethereum',
    name: 'Ethereum',
    network: 'mainnet',
    status: 'connected',
    blockHeight: 18500000,
    avgBlockTime: 12,
    nativeToken: 'ETH',
    supportedTokens: ['ETH', 'AUR', 'USDC', 'USDT'],
    bridgeFee: 0.15,
    minTransferAmount: 0.001,
    maxTransferAmount: 100000,
  },
  {
    chainId: 'bsc',
    name: 'Binance Smart Chain',
    network: 'mainnet',
    status: 'connected',
    blockHeight: 32500000,
    avgBlockTime: 3,
    nativeToken: 'BNB',
    supportedTokens: ['BNB', 'AUR', 'ETH', 'USDC'],
    bridgeFee: 0.1,
    minTransferAmount: 0.01,
    maxTransferAmount: 500000,
  },
];

const generateMockMetrics = (): BridgeMetrics => ({
  totalBridges: 3,
  activeBridges: 2,
  totalValueLocked: 88000000,
  totalTransfers24h: 1243,
  totalVolume24h: 12500000,
  averageTransferTime: 380,
  successRate: 0.996,
  failedTransfers24h: 5,
});

export default CrossChainBridge;
