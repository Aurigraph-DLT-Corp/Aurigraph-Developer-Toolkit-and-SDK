/**
 * External API Tokenization Dashboard
 *
 * Allows users to:
 * - Configure external API sources
 * - Tokenize API data into blockchain transactions
 * - Feed tokenized data to channels
 * - Store in LevelDB for slim nodes
 * - Monitor tokenization in real-time
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Table,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Tabs,
  Badge,
  Descriptions,
  Alert,
  Switch,
  InputNumber,
} from 'antd';
import { API_BASE_URL } from '../../utils/constants';
import {
  ApiOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface APISource {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  channel: string;
  status: 'active' | 'paused' | 'error';
  pollInterval: number; // seconds
  lastFetch?: string;
  totalTokenized: number;
  errorCount: number;
}

interface TokenizedTransaction {
  id: string;
  sourceId: string;
  sourceName: string;
  channel: string;
  timestamp: string;
  dataHash: string;
  size: number;
  status: 'pending' | 'stored' | 'failed';
  leveldbPath?: string;
}

interface ChannelStats {
  channelId: string;
  name: string;
  transactionCount: number;
  totalSize: number;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

const ExternalAPITokenization: React.FC = () => {
  const [apiSources, setApiSources] = useState<APISource[]>([]);
  const [tokenizedTxs, setTokenizedTxs] = useState<TokenizedTransaction[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TokenizedTransaction | null>(null);
  const [form] = Form.useForm();
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds

  // Statistics
  const [stats, setStats] = useState({
    totalSources: 0,
    activeSources: 0,
    totalTokenized: 0,
    totalStored: 0,
    avgTPS: 0,
    errorRate: 0,
  });

  // Fetch API sources
  const fetchAPISources = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokenization/sources`);
      if (!response.ok) {
        // Use mock data if endpoint not available yet
        const mockSources: APISource[] = [
          {
            id: 'src-1',
            name: 'Weather API',
            url: 'https://api.openweathermap.org/data/2.5/weather?q=London',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            channel: 'weather-data',
            status: 'active',
            pollInterval: 60,
            lastFetch: new Date().toISOString(),
            totalTokenized: 1250,
            errorCount: 5,
          },
          {
            id: 'src-2',
            name: 'Stock Market Feed',
            url: 'https://api.example.com/stocks/AAPL',
            method: 'GET',
            headers: { Authorization: 'Bearer xxx' },
            channel: 'stock-prices',
            status: 'active',
            pollInterval: 30,
            lastFetch: new Date(Date.now() - 25000).toISOString(),
            totalTokenized: 3420,
            errorCount: 0,
          },
          {
            id: 'src-3',
            name: 'IoT Sensor Data',
            url: 'https://iot.example.com/sensors/temp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'API-Key': 'xxx' },
            channel: 'iot-sensors',
            status: 'paused',
            pollInterval: 10,
            lastFetch: new Date(Date.now() - 300000).toISOString(),
            totalTokenized: 15240,
            errorCount: 120,
          },
        ];
        setApiSources(mockSources);
        return;
      }
      const data = await response.json();
      setApiSources(data.sources || []);
    } catch (error) {
      console.error('Failed to fetch API sources:', error);
    }
  }, []);

  // Fetch tokenized transactions
  const fetchTokenizedTransactions = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tokenization/transactions?limit=50`
      );
      if (!response.ok) {
        // Use mock data
        const mockTxs: TokenizedTransaction[] = [
          {
            id: 'tx-1',
            sourceId: 'src-1',
            sourceName: 'Weather API',
            channel: 'weather-data',
            timestamp: new Date().toISOString(),
            dataHash: '0x3f2a4b8c9d1e5f6a...',
            size: 1024,
            status: 'stored',
            leveldbPath: '/data/slim-node-1/weather-data/block-12345',
          },
          {
            id: 'tx-2',
            sourceId: 'src-2',
            sourceName: 'Stock Market Feed',
            channel: 'stock-prices',
            timestamp: new Date(Date.now() - 15000).toISOString(),
            dataHash: '0x7a8b9c1d2e3f4g5h...',
            size: 512,
            status: 'stored',
            leveldbPath: '/data/slim-node-2/stock-prices/block-12346',
          },
          {
            id: 'tx-3',
            sourceId: 'src-1',
            sourceName: 'Weather API',
            channel: 'weather-data',
            timestamp: new Date(Date.now() - 45000).toISOString(),
            dataHash: '0x9c1d2e3f4g5h6i7j...',
            size: 1120,
            status: 'pending',
          },
        ];
        setTokenizedTxs(mockTxs);
        return;
      }
      const data = await response.json();
      setTokenizedTxs(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch tokenized transactions:', error);
    }
  }, []);

  // Fetch channel statistics
  const fetchChannelStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokenization/channels/stats`);
      if (!response.ok) {
        // Use mock data
        const mockChannelStats: ChannelStats[] = [
          {
            channelId: 'weather-data',
            name: 'Weather Data Channel',
            transactionCount: 1250,
            totalSize: 1280000,
            lastUpdated: new Date().toISOString(),
            status: 'active',
          },
          {
            channelId: 'stock-prices',
            name: 'Stock Prices Channel',
            transactionCount: 3420,
            totalSize: 1751040,
            lastUpdated: new Date(Date.now() - 25000).toISOString(),
            status: 'active',
          },
          {
            channelId: 'iot-sensors',
            name: 'IoT Sensors Channel',
            transactionCount: 15240,
            totalSize: 15605760,
            lastUpdated: new Date(Date.now() - 300000).toISOString(),
            status: 'inactive',
          },
        ];
        setChannelStats(mockChannelStats);
        return;
      }
      const data = await response.json();
      setChannelStats(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channel stats:', error);
    }
  }, []);

  // Calculate statistics
  useEffect(() => {
    const totalSources = apiSources.length;
    const activeSources = apiSources.filter((s) => s.status === 'active').length;
    const totalTokenized = apiSources.reduce((sum, s) => sum + s.totalTokenized, 0);
    const totalStored = tokenizedTxs.filter((tx) => tx.status === 'stored').length;
    const errorRate =
      (apiSources.reduce((sum, s) => sum + s.errorCount, 0) / (totalTokenized || 1)) * 100;

    setStats({
      totalSources,
      activeSources,
      totalTokenized,
      totalStored,
      avgTPS: totalTokenized / 3600, // Assuming 1 hour window
      errorRate: parseFloat(errorRate.toFixed(2)),
    });
  }, [apiSources, tokenizedTxs]);

  // Real-time updates
  useEffect(() => {
    const fetchAll = () => {
      fetchAPISources();
      fetchTokenizedTransactions();
      fetchChannelStats();
    };

    fetchAll();

    if (realTimeEnabled) {
      const interval = setInterval(fetchAll, refreshInterval * 1000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [
    realTimeEnabled,
    refreshInterval,
    fetchAPISources,
    fetchTokenizedTransactions,
    fetchChannelStats,
  ]);

  // Add new API source
  const handleAddSource = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tokenization/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          url: values.url,
          method: values.method,
          headers: JSON.parse(values.headers || '{}'),
          channel: values.channel,
          pollInterval: values.pollInterval,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add API source');
      }

      message.success(`API source "${values.name}" added successfully`);
      setModalVisible(false);
      form.resetFields();
      await fetchAPISources();
    } catch (error) {
      message.error(
        `Failed to add API source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle source status
  const toggleSourceStatus = async (sourceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(
        `${API_BASE_URL}/tokenization/sources/${sourceId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update source status');
      }

      message.success(`Source ${newStatus === 'active' ? 'activated' : 'paused'}`);
      await fetchAPISources();
    } catch (error) {
      message.error(
        `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Delete API source
  const deleteSource = async (sourceId: string) => {
    Modal.confirm({
      title: 'Delete API Source',
      content:
        'Are you sure you want to delete this API source? All tokenized data will remain in the blockchain.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/tokenization/sources/${sourceId}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to delete source');
          }

          message.success('API source deleted successfully');
          await fetchAPISources();
        } catch (error) {
          message.error(
            `Failed to delete source: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      },
    });
  };

  // View transaction details
  const viewTransactionDetails = (tx: TokenizedTransaction) => {
    setSelectedTransaction(tx);
    setViewModalVisible(true);
  };

  // Columns for API Sources table
  const sourceColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, _record: APISource) => (
        <Space>
          <ApiOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag color={method === 'GET' ? 'blue' : method === 'POST' ? 'green' : 'orange'}>
          {method}
        </Tag>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => <Tag color="purple">{channel}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          icon={
            status === 'active' ? (
              <CheckCircleOutlined />
            ) : status === 'paused' ? (
              <PauseCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === 'active' ? 'success' : status === 'paused' ? 'default' : 'error'}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Poll Interval',
      dataIndex: 'pollInterval',
      key: 'pollInterval',
      render: (seconds: number) => `${seconds}s`,
    },
    {
      title: 'Tokenized',
      dataIndex: 'totalTokenized',
      key: 'totalTokenized',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'Errors',
      dataIndex: 'errorCount',
      key: 'errorCount',
      render: (count: number) => <Tag color={count > 0 ? 'error' : 'success'}>{count}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: APISource) => (
        <Space>
          <Button
            size="small"
            icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => toggleSourceStatus(record.id, record.status)}
          >
            {record.status === 'active' ? 'Pause' : 'Start'}
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteSource(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Columns for Tokenized Transactions table
  const txColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Source',
      dataIndex: 'sourceName',
      key: 'sourceName',
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => <Tag color="purple">{channel}</Tag>,
    },
    {
      title: 'Data Hash',
      dataIndex: 'dataHash',
      key: 'dataHash',
      ellipsis: true,
      render: (hash: string) => <code style={{ fontSize: '12px' }}>{hash}</code>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          icon={
            status === 'stored' ? (
              <CheckCircleOutlined />
            ) : status === 'pending' ? (
              <ClockCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === 'stored' ? 'success' : status === 'pending' ? 'processing' : 'error'}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TokenizedTransaction) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => viewTransactionDetails(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          <ApiOutlined /> External API Tokenization
        </h1>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Tokenize external API data, feed to channels, and store in LevelDB with real-time
          monitoring
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Sources"
              value={stats.totalSources}
              prefix={<ApiOutlined />}
              suffix={`/ ${stats.activeSources} active`}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Tokenized"
              value={stats.totalTokenized}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Stored in LevelDB"
              value={stats.totalStored}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg TPS"
              value={stats.avgTPS.toFixed(2)}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Error Rate"
              value={stats.errorRate}
              suffix="%"
              valueStyle={{ color: stats.errorRate > 5 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Real-time</span>
            </div>
            <Switch
              checked={realTimeEnabled}
              onChange={setRealTimeEnabled}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
            {realTimeEnabled && (
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  min={1}
                  max={60}
                  value={refreshInterval}
                  onChange={(value) => setRefreshInterval(value || 5)}
                  addonAfter="s"
                  size="small"
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Alert for real-time status */}
      {realTimeEnabled && (
        <Alert
          message={`Real-time monitoring active (refresh every ${refreshInterval}s)`}
          type="info"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="sources">
        <TabPane
          tab={
            <span>
              <ApiOutlined />
              API Sources
            </span>
          }
          key="sources"
        >
          <div style={{ marginBottom: '16px' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Add API Source
            </Button>
            <Button
              icon={<ReloadOutlined />}
              style={{ marginLeft: '8px' }}
              onClick={() => fetchAPISources()}
            >
              Refresh
            </Button>
          </div>

          <Table
            dataSource={apiSources}
            columns={sourceColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              Tokenized Transactions
            </span>
          }
          key="transactions"
        >
          <div style={{ marginBottom: '16px' }}>
            <Button icon={<ReloadOutlined />} onClick={() => fetchTokenizedTransactions()}>
              Refresh
            </Button>
          </div>

          <Table
            dataSource={tokenizedTxs}
            columns={txColumns}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              Channel Statistics
            </span>
          }
          key="channels"
        >
          <Row gutter={16}>
            {channelStats.map((channel) => (
              <Col span={8} key={channel.channelId} style={{ marginBottom: '16px' }}>
                <Card
                  title={
                    <Space>
                      <Badge status={channel.status === 'active' ? 'success' : 'default'} />
                      {channel.name}
                    </Space>
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Channel ID">{channel.channelId}</Descriptions.Item>
                    <Descriptions.Item label="Transactions">
                      {channel.transactionCount.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Size">
                      {(channel.totalSize / 1024 / 1024).toFixed(2)} MB
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                      {new Date(channel.lastUpdated).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Configuration
            </span>
          }
          key="config"
        >
          <Card title="Tokenization Configuration">
            <Form layout="vertical">
              <Form.Item
                label="Default Poll Interval (seconds)"
                help="How often to fetch data from APIs"
              >
                <InputNumber min={1} max={3600} defaultValue={60} style={{ width: '200px' }} />
              </Form.Item>

              <Form.Item label="LevelDB Storage Path" help="Base path for storing tokenized data">
                <Input defaultValue="/data/slim-nodes/" style={{ width: '400px' }} />
              </Form.Item>

              <Form.Item label="Max Concurrent API Calls">
                <InputNumber min={1} max={100} defaultValue={10} style={{ width: '200px' }} />
              </Form.Item>

              <Form.Item label="Retry Failed Calls">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item label="Enable Compression">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item>
                <Button type="primary">Save Configuration</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>

      {/* Add API Source Modal */}
      <Modal
        title="Add External API Source"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleAddSource}>
          <Form.Item
            label="Source Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a source name' }]}
          >
            <Input placeholder="e.g., Weather API" />
          </Form.Item>

          <Form.Item
            label="API URL"
            name="url"
            rules={[
              { required: true, message: 'Please enter the API URL' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input placeholder="https://api.example.com/data" />
          </Form.Item>

          <Form.Item
            label="HTTP Method"
            name="method"
            rules={[{ required: true, message: 'Please select an HTTP method' }]}
            initialValue="GET"
          >
            <Select>
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Headers (JSON)" name="headers" help="Enter HTTP headers as JSON object">
            <TextArea
              rows={3}
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer xxx"}'
            />
          </Form.Item>

          <Form.Item
            label="Channel Name"
            name="channel"
            rules={[{ required: true, message: 'Please enter a channel name' }]}
          >
            <Input placeholder="e.g., weather-data" />
          </Form.Item>

          <Form.Item
            label="Poll Interval (seconds)"
            name="pollInterval"
            rules={[{ required: true, message: 'Please enter poll interval' }]}
            initialValue={60}
          >
            <InputNumber min={1} max={3600} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Source
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        title="Transaction Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedTransaction && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Transaction ID">{selectedTransaction.id}</Descriptions.Item>
            <Descriptions.Item label="Source">{selectedTransaction.sourceName}</Descriptions.Item>
            <Descriptions.Item label="Channel">
              <Tag color="purple">{selectedTransaction.channel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(selectedTransaction.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Data Hash">
              <code>{selectedTransaction.dataHash}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              {(selectedTransaction.size / 1024).toFixed(2)} KB
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                icon={
                  selectedTransaction.status === 'stored' ? (
                    <CheckCircleOutlined />
                  ) : selectedTransaction.status === 'pending' ? (
                    <ClockCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )
                }
                color={
                  selectedTransaction.status === 'stored'
                    ? 'success'
                    : selectedTransaction.status === 'pending'
                      ? 'processing'
                      : 'error'
                }
              >
                {selectedTransaction.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {selectedTransaction.leveldbPath && (
              <Descriptions.Item label="LevelDB Path">
                <code>{selectedTransaction.leveldbPath}</code>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ExternalAPITokenization;
