/**
 * Integrated Transaction Explorer Component
 *
 * Real-time transaction listing with live data from Aurigraph V11 API
 * Advanced search, filtering, and pagination
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Tooltip,
  Drawer,
  Descriptions,
  Typography,
  message,
  Alert,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { aurigraphAPI, Transaction } from '../../services/AurigraphAPIService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface TransactionStats {
  totalTransactions: number;
  confirmedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  currentTps: number;
  avgConfirmationTime: number;
}

const TransactionExplorerIntegrated: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHash, setSearchHash] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    confirmedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    currentTps: 0,
    avgConfirmationTime: 0,
  });

  /**
   * Fetch transactions and metrics from API
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions and metrics in parallel
      const [txs, met] = await Promise.all([
        aurigraphAPI.getTransactions(pagination.pageSize),
        aurigraphAPI.getBlockchainMetrics(),
      ]);

      setTransactions(txs);

      // Calculate statistics
      const confirmed = txs.filter((t) => t.status === 'CONFIRMED').length;
      const pending = txs.filter((t) => t.status === 'PENDING').length;
      const failed = txs.filter((t) => t.status === 'FAILED').length;

      setStats({
        totalTransactions: txs.length,
        confirmedTransactions: confirmed,
        pendingTransactions: pending,
        failedTransactions: failed,
        currentTps: met?.tps || 0,
        avgConfirmationTime: met?.averageBlockTime || 0,
      });

      setPagination((prev) => ({
        ...prev,
        total: txs.length,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and set up polling
  useEffect(() => {
    fetchData();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [pagination.pageSize]);

  // Filter transactions based on search and status
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      !searchHash ||
      tx.hash.toLowerCase().includes(searchHash.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchHash.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchHash.toLowerCase());

    const matchesStatus = !statusFilter || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table columns
  const columns: ColumnsType<Transaction> = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 160,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Text code>{hash.substring(0, 20)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: 130,
      render: (from: string) => (
        <Tooltip title={from}>
          <Text code>{from.substring(0, 16)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      width: 130,
      render: (to: string) => (
        <Tooltip title={to}>
          <Text code>{to.substring(0, 16)}...</Text>
        </Tooltip>
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
      title: 'Fee',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      render: (fee: string) => <Text type="secondary">{fee} AUR</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let icon = <ExclamationCircleOutlined />;
        let color = 'default';

        if (status === 'CONFIRMED') {
          icon = <CheckCircleOutlined />;
          color = 'green';
        } else if (status === 'PENDING') {
          icon = <ClockCircleOutlined />;
          color = 'blue';
        } else if (status === 'FAILED') {
          icon = <CloseCircleOutlined />;
          color = 'red';
        }

        return (
          <Tag icon={icon} color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Block',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      width: 80,
      render: (height: number) => (height > 0 ? <Text>{height}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          <Text>{dayjs(timestamp).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedTransaction(record);
            setDrawerVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Transaction Explorer
        </Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          message="Error Loading Transactions"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Confirmed"
              value={stats.confirmedTransactions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingTransactions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failedTransactions}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Current TPS"
              value={Math.floor(stats.currentTps)}
              suffix="TPS"
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Avg Confirmation"
              value={Math.floor(stats.avgConfirmationTime)}
              suffix="ms"
              valueStyle={{ color: '#13c2c2', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Typography.Text strong>Filters</Typography.Text>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Input.Search
                placeholder="Search by hash, from address, or to address..."
                prefix={<SearchOutlined />}
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                options={[
                  { label: 'Confirmed', value: 'CONFIRMED' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Failed', value: 'FAILED' },
                ]}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Transactions Table */}
      <Card title={`Recent Transactions (${filteredTransactions.length})`}>
        {filteredTransactions.length === 0 && !loading ? (
          <Empty description="No transactions found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTransactions.map((tx) => ({
              ...tx,
              key: tx.hash,
            }))}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              },
            }}
            size="small"
          />
        )}
      </Card>

      {/* Transaction Detail Drawer */}
      <Drawer
        title="Transaction Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedTransaction && (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                label: 'Hash',
                children: <Text code>{selectedTransaction.hash}</Text>,
              },
              {
                label: 'From Address',
                children: <Text code>{selectedTransaction.from}</Text>,
              },
              {
                label: 'To Address',
                children: <Text code>{selectedTransaction.to}</Text>,
              },
              {
                label: 'Amount',
                children: <Text strong>{selectedTransaction.amount} AUR</Text>,
              },
              {
                label: 'Fee',
                children: <Text>{selectedTransaction.fee} AUR</Text>,
              },
              {
                label: 'Gas Price',
                children: <Text>{selectedTransaction.gasPrice}</Text>,
              },
              {
                label: 'Gas Used',
                children: <Text>{selectedTransaction.gasUsed}</Text>,
              },
              {
                label: 'Nonce',
                children: <Text>{selectedTransaction.nonce}</Text>,
              },
              {
                label: 'Status',
                children: <Tag color={selectedTransaction.status === 'CONFIRMED' ? 'green' : 'blue'}>{selectedTransaction.status}</Tag>,
              },
              {
                label: 'Block Height',
                children: <Text>{selectedTransaction.blockHeight || 'Pending'}</Text>,
              },
              {
                label: 'Timestamp',
                children: <Text>{new Date(selectedTransaction.timestamp).toLocaleString()}</Text>,
              },
              {
                label: 'Time Ago',
                children: <Text>{dayjs(selectedTransaction.timestamp).fromNow()}</Text>,
              },
              ...(selectedTransaction.contractAddress
                ? [
                    {
                      label: 'Contract Address',
                      children: <Text code>{selectedTransaction.contractAddress}</Text>,
                    },
                  ]
                : []),
              ...(selectedTransaction.data
                ? [
                    {
                      label: 'Data',
                      children: <Text code>{selectedTransaction.data.substring(0, 50)}...</Text>,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TransactionExplorerIntegrated;
