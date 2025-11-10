/**
 * Live Transaction Feed Component
 *
 * Displays real-time transaction updates from WebSocket
 * - Transaction list with latest updates at top
 * - Status indicators (pending, confirmed, failed)
 * - Connection status display
 * - Auto-scrolling to newest transactions
 */

import { useMemo, useEffect } from 'react';
import { Table, Tag, Space, Card, Statistic, Row, Col, Empty, Spin, Alert, Badge } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  addTransaction,
  updateTransaction,
  setConnectionState,
  setError,
} from '../store/liveDataSlice';
import type { RootState } from '../store/index';
import type { Transaction as LiveTransaction } from '../store/liveDataSlice';

const LiveTransactionFeed = () => {
  const dispatch = useAppDispatch();
  const { transactions, connectionStates, errors } = useAppSelector(
    (state: RootState) => state.liveData
  );

  const { isConnected, isConnecting, error } = useWebSocket('transactions', {
    onMessage: (event) => {
      try {
        const data = event.data as any;

        // Handle transaction update
        if (data.id) {
          const transaction: LiveTransaction = {
            id: data.id,
            from: data.from || 'Unknown',
            to: data.to || 'Unknown',
            amount: data.amount || 0,
            hash: data.hash || '',
            blockHeight: data.blockHeight || 0,
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || 'pending',
            fee: data.fee || 0,
            gasUsed: data.gasUsed,
          };

          // Update or add transaction
          const existing = transactions.find((t) => t.id === transaction.id);
          if (existing) {
            dispatch(updateTransaction(transaction));
          } else {
            dispatch(addTransaction(transaction));
          }
        }
      } catch (err: any) {
        console.error('Error processing transaction message:', err);
        dispatch(setError({ channel: 'transactions', error: err.message }));
      }
    },
    onConnect: () => {
      dispatch(setConnectionState({ channel: 'transactions', connected: true }));
      dispatch(setError({ channel: 'transactions', error: null }));
    },
    onDisconnect: () => {
      dispatch(setConnectionState({ channel: 'transactions', connected: false }));
    },
    onError: (err) => {
      dispatch(setError({ channel: 'transactions', error: err.message }));
    },
  });

  // Update connection state if WebSocket state changes
  useEffect(() => {
    if (isConnected) {
      dispatch(setConnectionState({ channel: 'transactions', connected: true }));
    }
  }, [isConnected, dispatch]);

  // Prepare table data
  const tableData = useMemo(() => {
    return transactions.map((tx) => ({
      ...tx,
      key: tx.id,
      amountDisplay: `${tx.amount.toFixed(4)} AUR`,
      feeDisplay: `${tx.fee.toFixed(6)} AUR`,
    }));
  }, [transactions]);

  // Status color mapping
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Confirmed
          </Tag>
        );
      case 'pending':
        return (
          <Tag icon={<ClockCircleOutlined />} color="processing">
            Pending
          </Tag>
        );
      case 'failed':
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Failed
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 150,
      render: (hash: string) => (
        <code style={{ fontSize: 11, color: '#666' }}>{hash.substring(0, 12)}...</code>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: 120,
      render: (from: string) => <code style={{ fontSize: 11 }}>{from.substring(0, 10)}...</code>,
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      width: 120,
      render: (to: string) => <code style={{ fontSize: 11 }}>{to.substring(0, 10)}...</code>,
    },
    {
      title: 'Amount',
      dataIndex: 'amountDisplay',
      key: 'amount',
      width: 100,
      align: 'right' as const,
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: 'Fee',
      dataIndex: 'feeDisplay',
      key: 'fee',
      width: 100,
      align: 'right' as const,
      sorter: (a: any, b: any) => a.fee - b.fee,
    },
    {
      title: 'Block',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      width: 80,
      align: 'right' as const,
      sorter: (a: any, b: any) => a.blockHeight - b.blockHeight,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
      },
      sorter: (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
  ];

  // Statistics
  const stats = useMemo(() => {
    const confirmed = transactions.filter((t) => t.status === 'confirmed').length;
    const pending = transactions.filter((t) => t.status === 'pending').length;
    const failed = transactions.filter((t) => t.status === 'failed').length;
    const totalAmount = transactions
      .filter((t) => t.status === 'confirmed')
      .reduce((sum, t) => sum + t.amount, 0);

    return { confirmed, pending, failed, totalAmount };
  }, [transactions]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Connection Status */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Badge
              status={isConnected ? 'success' : 'error'}
              text={isConnected ? 'Connected' : 'Disconnected'}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              WebSocket Status
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Statistic title="Total Transactions" value={transactions.length} valueStyle={{}} />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic title="Confirmed" value={stats.confirmed} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#faad14' }} />
        </Col>
      </Row>

      {/* Error Message */}
      {(error || errors.transactions) && (
        <Alert
          message="WebSocket Error"
          description={error?.message || errors.transactions}
          type="error"
          showIcon
          closable
        />
      )}

      {/* Loading State */}
      {isConnecting && (
        <Card>
          <Spin tip="Connecting to transaction stream..." />
        </Card>
      )}

      {/* Transaction Table */}
      <Card
        title={
          <Space>
            <span>Live Transaction Feed</span>
            {isConnected && (
              <Badge status="success" text="Live" style={{ marginLeft: 16 }} />
            )}
          </Space>
        }
        extra={
          <Space size="small">
            <span style={{ fontSize: 12, color: '#666' }}>
              {transactions.length} transactions
            </span>
          </Space>
        }
      >
        {transactions.length === 0 ? (
          <Empty description="No transactions yet" />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: true }}
            size="small"
            loading={isConnecting}
          />
        )}
      </Card>

      {/* Statistics Summary */}
      {transactions.length > 0 && (
        <Card title="Transaction Summary">
          <Row gutter={16}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Confirmed"
                value={stats.confirmed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#faad14' }} />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic title="Failed" value={stats.failed} valueStyle={{ color: '#f5222d' }} />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Total Volume"
                value={stats.totalAmount.toFixed(2)}
                suffix="AUR"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>
      )}
    </Space>
  );
};

export default LiveTransactionFeed;
