/**
 * Streaming Data Dashboard Component
 * JIRA: AV11-314
 *
 * Displays real-time streaming data feeds with:
 * - gRPC stream connection status (migrated from WebSocket in V12)
 * - Live transaction stream with filtering
 * - Data throughput metrics (messages/sec, bytes/sec)
 * - Data source selector (transactions, blocks, events)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Statistic,
  Space,
  Alert,
  Spin,
  Select,
  Input,
  Tag,
  Empty,
  Tooltip,
  Button,
  Switch,
} from 'antd';
import {
  ThunderboltOutlined,
  ApiOutlined,
  FilterOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  BlockOutlined,
  BellOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { useTransactionStream, useMultiGrpcStream } from '../../hooks/useGrpcStream';
import {
  addTransaction,
  clearTransactions,
  setError,
  setConnectionState,
} from '../../store/liveDataSlice';
import type { RootState } from '../../types/state';
import type { Transaction } from '../../store/liveDataSlice';

// ============================================================================
// Types
// ============================================================================

type DataSourceType = 'transactions' | 'blocks' | 'events';

interface StreamingMetrics {
  messagesPerSecond: number;
  bytesPerSecond: number;
  totalMessages: number;
  totalBytes: number;
  avgMessageSize: number;
  peakMessagesPerSecond: number;
  lastMessageTime: string;
}

interface BlockData {
  height: number;
  hash: string;
  timestamp: string;
  transactionCount: number;
  size: number;
  proposer: string;
}

interface EventData {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

interface StreamMessage {
  type: 'transaction' | 'block' | 'event';
  data: Transaction | BlockData | EventData;
  timestamp: string;
  size?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DATA_SOURCE_OPTIONS = [
  { value: 'transactions', label: 'Transactions', icon: <ThunderboltOutlined /> },
  { value: 'blocks', label: 'Blocks', icon: <BlockOutlined /> },
  { value: 'events', label: 'Events', icon: <BellOutlined /> },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  confirmed: 'green',
  failed: 'red',
  info: 'blue',
  warning: 'orange',
  error: 'red',
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(0);
};

const truncateHash = (hash: string, length: number = 8): string => {
  if (!hash || hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};

// ============================================================================
// Component
// ============================================================================

const StreamingDataDashboard: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const { transactions, connectionStates, errors } = useAppSelector(
    (state: RootState) => state.liveData
  );

  // Local state
  const [dataSource, setDataSource] = useState<DataSourceType>('transactions');
  const [isPaused, setIsPaused] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [streamingMetrics, setStreamingMetrics] = useState<StreamingMetrics>({
    messagesPerSecond: 0,
    bytesPerSecond: 0,
    totalMessages: 0,
    totalBytes: 0,
    avgMessageSize: 0,
    peakMessagesPerSecond: 0,
    lastMessageTime: new Date().toISOString(),
  });

  // Metrics tracking refs
  const metricsWindowRef = React.useRef<{ timestamp: number; size: number }[]>([]);
  const METRICS_WINDOW_MS = 1000; // 1 second window for rate calculation

  // Calculate real-time metrics
  const updateMetrics = useCallback((messageSize: number) => {
    const now = Date.now();

    // Add new message to window
    metricsWindowRef.current.push({ timestamp: now, size: messageSize });

    // Remove messages older than window
    metricsWindowRef.current = metricsWindowRef.current.filter(
      (m) => now - m.timestamp < METRICS_WINDOW_MS
    );

    // Calculate metrics
    const messagesInWindow = metricsWindowRef.current.length;
    const bytesInWindow = metricsWindowRef.current.reduce((sum, m) => sum + m.size, 0);

    setStreamingMetrics((prev) => {
      const newTotal = prev.totalMessages + 1;
      const newTotalBytes = prev.totalBytes + messageSize;
      const newMps = messagesInWindow;

      return {
        messagesPerSecond: newMps,
        bytesPerSecond: bytesInWindow,
        totalMessages: newTotal,
        totalBytes: newTotalBytes,
        avgMessageSize: newTotalBytes / newTotal,
        peakMessagesPerSecond: Math.max(prev.peakMessagesPerSecond, newMps),
        lastMessageTime: new Date().toISOString(),
      };
    });
  }, []);

  // gRPC streaming connection (migrated from WebSocket in V12)
  const {
    data: streamData,
    status,
    error,
    isConnected,
    connect,
    disconnect,
  } = useTransactionStream({
    autoConnect: true,
    updateIntervalMs: 100,
  });

  const isConnecting = status === 'connecting';

  // Handle incoming stream data
  useEffect(() => {
    if (!streamData || isPaused) return;

    try {
      const messageSize = JSON.stringify(streamData).length;
      updateMetrics(messageSize);

      // Handle transaction data from gRPC stream
      if (streamData.transactionHash) {
        const txData: Transaction = {
          id: streamData.eventId || streamData.transactionHash,
          from: streamData.fromAddress || 'Unknown',
          to: streamData.toAddress || 'Unknown',
          amount: parseFloat(streamData.amount) || 0,
          hash: streamData.transactionHash || '',
          blockHeight: streamData.blockHeight || 0,
          timestamp: new Date().toISOString(),
          status: streamData.status === 'CONFIRMED' ? 'confirmed' :
                  streamData.status === 'FAILED' ? 'failed' : 'pending',
          fee: 0,
          gasUsed: streamData.gasUsed,
        };
        dispatch(addTransaction(txData));
      }
    } catch (err: any) {
      console.error('Error processing streaming message:', err);
      dispatch(setError({ channel: 'channels', error: err.message }));
    }
  }, [streamData, dispatch, isPaused, updateMetrics]);

  // Update connection state in Redux
  useEffect(() => {
    dispatch(setConnectionState({ channel: 'liveStream', connected: isConnected }));
  }, [isConnected, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      dispatch(setError({ channel: 'channels', error: error.message }));
    }
  }, [error, dispatch]);

  // Update metrics display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      metricsWindowRef.current = metricsWindowRef.current.filter(
        (m) => now - m.timestamp < METRICS_WINDOW_MS
      );

      const messagesInWindow = metricsWindowRef.current.length;
      const bytesInWindow = metricsWindowRef.current.reduce((sum, m) => sum + m.size, 0);

      setStreamingMetrics((prev) => ({
        ...prev,
        messagesPerSecond: messagesInWindow,
        bytesPerSecond: bytesInWindow,
      }));
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, []);

  // Filter data based on search and status
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesText =
        !filterText ||
        tx.id.toLowerCase().includes(filterText.toLowerCase()) ||
        tx.hash.toLowerCase().includes(filterText.toLowerCase()) ||
        tx.from.toLowerCase().includes(filterText.toLowerCase()) ||
        tx.to.toLowerCase().includes(filterText.toLowerCase());

      const matchesStatus = !filterStatus || tx.status === filterStatus;

      return matchesText && matchesStatus;
    });
  }, [transactions, filterText, filterStatus]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter((block) => {
      return (
        !filterText ||
        block.hash.toLowerCase().includes(filterText.toLowerCase()) ||
        block.proposer.toLowerCase().includes(filterText.toLowerCase()) ||
        block.height.toString().includes(filterText)
      );
    });
  }, [blocks, filterText]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesText =
        !filterText ||
        event.message.toLowerCase().includes(filterText.toLowerCase()) ||
        event.source.toLowerCase().includes(filterText.toLowerCase()) ||
        event.type.toLowerCase().includes(filterText.toLowerCase());

      const matchesStatus = !filterStatus || event.severity === filterStatus;

      return matchesText && matchesStatus;
    });
  }, [events, filterText, filterStatus]);

  // Handle clear data
  const handleClearData = useCallback(() => {
    dispatch(clearTransactions());
    setBlocks([]);
    setEvents([]);
    setStreamingMetrics({
      messagesPerSecond: 0,
      bytesPerSecond: 0,
      totalMessages: 0,
      totalBytes: 0,
      avgMessageSize: 0,
      peakMessagesPerSecond: 0,
      lastMessageTime: new Date().toISOString(),
    });
    metricsWindowRef.current = [];
  }, [dispatch]);

  // Handle reconnect
  const handleReconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 500);
  }, [connect, disconnect]);

  // Table columns for transactions
  const transactionColumns: ColumnsType<Transaction> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {new Date(timestamp).toLocaleTimeString()}
        </Tooltip>
      ),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <code>{truncateHash(id, 6)}</code>
        </Tooltip>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: 120,
      render: (from: string) => (
        <Tooltip title={from}>
          <code>{truncateHash(from, 6)}</code>
        </Tooltip>
      ),
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      width: 120,
      render: (to: string) => (
        <Tooltip title={to}>
          <code>{truncateHash(to, 6)}</code>
        </Tooltip>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (amount: number) => formatNumber(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Block',
      dataIndex: 'blockHeight',
      key: 'blockHeight',
      width: 80,
      align: 'right',
      render: (height: number) => (height > 0 ? formatNumber(height) : '-'),
    },
  ];

  // Table columns for blocks
  const blockColumns: ColumnsType<BlockData> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {new Date(timestamp).toLocaleTimeString()}
        </Tooltip>
      ),
    },
    {
      title: 'Height',
      dataIndex: 'height',
      key: 'height',
      width: 100,
      render: (height: number) => <strong>{formatNumber(height)}</strong>,
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 150,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <code>{truncateHash(hash, 8)}</code>
        </Tooltip>
      ),
    },
    {
      title: 'Transactions',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      width: 100,
      align: 'right',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      align: 'right',
      render: (size: number) => formatBytes(size),
    },
    {
      title: 'Proposer',
      dataIndex: 'proposer',
      key: 'proposer',
      width: 120,
      render: (proposer: string) => (
        <Tooltip title={proposer}>
          <code>{truncateHash(proposer, 6)}</code>
        </Tooltip>
      ),
    },
  ];

  // Table columns for events
  const eventColumns: ColumnsType<EventData> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>
          {new Date(timestamp).toLocaleTimeString()}
        </Tooltip>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (severity: string) => (
        <Tag color={STATUS_COLORS[severity] || 'default'}>{severity.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Tooltip title={source}>
          <code>{truncateHash(source, 8)}</code>
        </Tooltip>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <Tooltip title={message}>
          <span>{message}</span>
        </Tooltip>
      ),
    },
  ];

  // Get current data and columns based on data source
  const getCurrentData = () => {
    switch (dataSource) {
      case 'transactions':
        return { data: filteredTransactions, columns: transactionColumns };
      case 'blocks':
        return { data: filteredBlocks, columns: blockColumns };
      case 'events':
        return { data: filteredEvents, columns: eventColumns };
      default:
        return { data: [], columns: [] };
    }
  };

  const { data: currentData, columns: currentColumns } = getCurrentData();

  // Get status filter options based on data source
  const getStatusOptions = () => {
    switch (dataSource) {
      case 'transactions':
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'failed', label: 'Failed' },
        ];
      case 'events':
        return [
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Warning' },
          { value: 'error', label: 'Error' },
        ];
      default:
        return [];
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Connection Status Card */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Space>
              <Badge
                status={isConnected ? 'success' : isConnecting ? 'processing' : 'error'}
                text={
                  isConnected
                    ? 'Connected to Live Stream'
                    : isConnecting
                      ? 'Connecting...'
                      : 'Disconnected'
                }
              />
              {isConnecting && <Spin size="small" />}
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <ApiOutlined style={{ color: isConnected ? '#52c41a' : '#f5222d' }} />
              <span style={{ fontSize: 12, color: '#666' }}>
                Last update:{' '}
                {streamingMetrics.lastMessageTime
                  ? new Date(streamingMetrics.lastMessageTime).toLocaleTimeString()
                  : 'N/A'}
              </span>
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title={isPaused ? 'Resume stream' : 'Pause stream'}>
                <Button
                  type={isPaused ? 'primary' : 'default'}
                  icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </Tooltip>
              <Tooltip title="Reconnect">
                <Button icon={<ReloadOutlined />} onClick={handleReconnect} />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Error Alert */}
      {(error || errors.channels) && (
        <Alert
          message="Stream Error"
          description={error?.message || errors.channels}
          type="error"
          showIcon
          closable
        />
      )}

      {/* Throughput Metrics */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Messages/sec"
              value={streamingMetrics.messagesPerSecond}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Throughput"
              value={formatBytes(streamingMetrics.bytesPerSecond)}
              suffix="/sec"
              prefix={<CloudDownloadOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Messages"
              value={formatNumber(streamingMetrics.totalMessages)}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Peak Rate"
              value={streamingMetrics.peakMessagesPerSecond}
              suffix="msg/s"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Data Source Selector and Filters */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Space>
              <span>Data Source:</span>
              <Select
                value={dataSource}
                onChange={(value) => {
                  setDataSource(value);
                  setFilterStatus(null);
                }}
                style={{ width: 160 }}
                options={DATA_SOURCE_OPTIONS}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Input
              placeholder="Search..."
              prefix={<FilterOutlined />}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              {getStatusOptions().length > 0 && (
                <Select
                  placeholder="Filter by status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 140 }}
                  allowClear
                  options={getStatusOptions()}
                />
              )}
              <Tooltip title="Clear all data">
                <Button danger onClick={handleClearData}>
                  Clear
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Live Data Stream Table */}
      <Card
        title={
          <Space>
            {DATA_SOURCE_OPTIONS.find((opt) => opt.value === dataSource)?.icon}
            <span>Live {dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Stream</span>
            <Badge
              count={currentData.length}
              overflowCount={999}
              style={{ backgroundColor: '#1890ff' }}
            />
            {isPaused && <Tag color="orange">PAUSED</Tag>}
          </Space>
        }
        extra={
          <Space>
            <span style={{ fontSize: 12, color: '#666' }}>
              Avg size: {formatBytes(streamingMetrics.avgMessageSize)}
            </span>
            <Switch
              checkedChildren="Auto-scroll"
              unCheckedChildren="Manual"
              defaultChecked
              size="small"
            />
          </Space>
        }
      >
        {isConnecting && currentData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Connecting to live stream..." />
          </div>
        ) : currentData.length === 0 ? (
          <Empty
            description={
              isPaused
                ? 'Stream paused. Click Resume to continue receiving data.'
                : 'Waiting for data...'
            }
          />
        ) : (
          <Table
            columns={currentColumns as ColumnsType<any>}
            dataSource={currentData}
            rowKey={(record: any) => record.id || record.hash || record.height}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `${total} items`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 800 }}
            style={{ marginTop: 8 }}
          />
        )}
      </Card>

      {/* Stream Statistics */}
      <Card size="small" style={{ textAlign: 'center', color: '#666' }}>
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <span>Total Data: {formatBytes(streamingMetrics.totalBytes)}</span>
          <span>Avg Message: {formatBytes(streamingMetrics.avgMessageSize)}</span>
          <span>
            Connection:{' '}
            {connectionStates.liveStream || isConnected ? (
              <Badge status="success" text="Active" />
            ) : (
              <Badge status="error" text="Inactive" />
            )}
          </span>
        </Space>
      </Card>
    </Space>
  );
};

export default StreamingDataDashboard;
