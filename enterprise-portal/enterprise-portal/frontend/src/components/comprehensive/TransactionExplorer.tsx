/**
 * Transaction Explorer Component
 *
 * Real-time transaction listing with advanced search, filtering, and pagination
 * Connects to Phase2BlockchainResource.java backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Drawer,
  Descriptions,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Transaction, TransactionFilter } from '../../types/comprehensive';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const TransactionExplorer: React.FC = () => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Statistics
  const [stats, setStats] = useState({
    totalTransactions: 0,
    confirmedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    currentTps: 0,
    avgConfirmationTime: 0,
  });

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to Phase2BlockchainResource.java
      // const response = await fetch(`/api/v11/blockchain/transactions?${queryParams}`);
      // const data = await response.json();

      // Mock data for demonstration
      const mockTransactions = generateMockTransactions(pagination.pageSize);
      setTransactions(mockTransactions);
      setPagination({
        ...pagination,
        total: 150000, // Mock total
      });

      // Update statistics
      setStats({
        totalTransactions: 150000,
        confirmedTransactions: 142500,
        pendingTransactions: 5250,
        failedTransactions: 2250,
        currentTps: 2150000 + Math.random() * 100000,
        avgConfirmationTime: 250 + Math.random() * 50,
      });
    } catch (error) {
      message.error('Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and real-time updates
  useEffect(() => {
    fetchTransactions();

    // Set up WebSocket for real-time updates
    // TODO: Connect to WebSocket endpoint
    // const ws = new WebSocket('ws://localhost:9003/api/v11/blockchain/ws');

    const interval = setInterval(() => {
      fetchTransactions();
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval);
      // ws.close();
    };
  }, [pagination.current, pagination.pageSize, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Implement search logic
  };

  // Handle transaction detail view
  const showTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDrawerVisible(true);
  };

  // Table columns configuration
  const columns: ColumnsType<Transaction> = [
    {
      title: 'Transaction Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 180,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Text copyable={{ text: hash }}>
            {hash.substring(0, 8)}...{hash.substring(hash.length - 6)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: 'Transfer', value: 'transfer' },
        { text: 'Mint', value: 'mint' },
        { text: 'Burn', value: 'burn' },
        { text: 'Stake', value: 'stake' },
        { text: 'Unstake', value: 'unstake' },
        { text: 'Contract', value: 'contract' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type: Transaction['type']) => {
        const colors: Record<Transaction['type'], string> = {
          transfer: 'blue',
          mint: 'green',
          burn: 'red',
          stake: 'purple',
          unstake: 'orange',
          contract: 'cyan',
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: Transaction['status']) => {
        const config = {
          confirmed: { icon: <CheckCircleOutlined />, color: 'success', text: 'Confirmed' },
          pending: { icon: <LoadingOutlined />, color: 'processing', text: 'Pending' },
          failed: { icon: <CloseCircleOutlined />, color: 'error', text: 'Failed' },
        };
        return (
          <Tag icon={config[status].icon} color={config[status].color}>
            {config[status].text}
          </Tag>
        );
      },
    },
    {
      title: 'Block Height',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      width: 120,
      sorter: (a, b) => a.blockHeight - b.blockHeight,
      render: (height: number) => <Text>{height.toLocaleString()}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      sorter: (a, b) => a.amount - b.amount,
      render: (amount: number) => <Text strong>{amount.toFixed(6)} AUR</Text>,
    },
    {
      title: 'Fee',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      render: (fee: number) => <Text type="secondary">{fee.toFixed(6)} AUR</Text>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {dayjs(timestamp).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showTransactionDetail(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Transaction Explorer</h1>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Real-time transaction monitoring with advanced search and filtering capabilities
      </p>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current TPS"
              value={stats.currentTps}
              precision={0}
              suffix="tx/s"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingTransactions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Confirmation"
              value={stats.avgConfirmationTime}
              precision={0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Input
                placeholder="Search by hash or address"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Transaction Type"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('type', value)}
              >
                <Select.Option value="transfer">Transfer</Select.Option>
                <Select.Option value="mint">Mint</Select.Option>
                <Select.Option value="burn">Burn</Select.Option>
                <Select.Option value="stake">Stake</Select.Option>
                <Select.Option value="unstake">Unstake</Select.Option>
                <Select.Option value="contract">Contract</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Status"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Select.Option value="confirmed">Confirmed</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="failed">Failed</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates) {
                    handleFilterChange('startDate', dates[0]?.toISOString());
                    handleFilterChange('endDate', dates[1]?.toISOString());
                  }
                }}
              />
            </Col>
            <Col xs={24} sm={12} lg={2}>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTransactions}
                loading={loading}
                block
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total.toLocaleString()} transactions`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Transaction Detail Drawer */}
      <Drawer
        title="Transaction Details"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedTransaction && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Transaction Hash">
              <Text copyable>{selectedTransaction.hash}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedTransaction.status === 'confirmed' ? 'success' : 'processing'}>
                {selectedTransaction.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Block Height">
              {selectedTransaction.blockHeight.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag>{selectedTransaction.type.toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="From">
              <Text copyable>{selectedTransaction.from}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="To">
              <Text copyable>{selectedTransaction.to}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong>{selectedTransaction.amount.toFixed(6)} AUR</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Fee">
              {selectedTransaction.fee.toFixed(6)} AUR
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              {selectedTransaction.size.toLocaleString()} bytes
            </Descriptions.Item>
            <Descriptions.Item label="Confirmations">
              <Badge count={selectedTransaction.confirmations} showZero color="#52c41a" />
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(selectedTransaction.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Signature">
              <Text copyable ellipsis style={{ maxWidth: 600 }}>
                {selectedTransaction.signature}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

// Mock data generator for demonstration
const generateMockTransactions = (count: number): Transaction[] => {
  const types: Transaction['type'][] = ['transfer', 'mint', 'burn', 'stake', 'unstake', 'contract'];
  const statuses: Transaction['status'][] = ['confirmed', 'pending', 'failed'];

  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${Date.now()}-${i}`,
    hash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    blockHeight: 1500000 - i,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    type: types[Math.floor(Math.random() * types.length)] as Transaction['type'],
    status: statuses[Math.floor(Math.random() * statuses.length)] as Transaction['status'],
    from: `0x${Math.random().toString(16).substring(2, 42)}`,
    to: `0x${Math.random().toString(16).substring(2, 42)}`,
    amount: Math.random() * 10000,
    fee: Math.random() * 0.1,
    gasUsed: Math.floor(Math.random() * 100000),
    gasLimit: 200000,
    signature: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    size: Math.floor(Math.random() * 1000) + 200,
    confirmations: Math.floor(Math.random() * 100),
  }));
};

export default TransactionExplorer;
