import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Collapse,
  Badge,
  Tooltip,
} from 'antd';
import {
  LinkOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './MerkleRegistryViewer.css';

interface RegistryStats {
  rootHash: string;
  entryCount: number;
  treeHeight: number;
  lastUpdate: string;
  rebuildCount: number;
  totalUpdates: number;
  totalTokens: number;
  apiCount: number;
  lastFeedUpdate: number;
}

interface SimulationMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: string;
  peakTPS: string;
  averageLatency: string;
  blockHeight: number;
}

interface MerkleRegistryStatus {
  rootHash: string;
  registeredDataFeeds: number;
  totalTokens: number;
  lastUpdate: number;
}

interface SimulationStatus {
  channelId: string;
  channelName: string;
  status: string;
  duration: number;
  config: {
    validatorNodes: number;
    businessNodes: number;
    slimNodes: number;
  };
  metrics: SimulationMetrics;
  merkleRegistry: MerkleRegistryStatus;
}

interface DataFeed {
  id: string;
  name: string;
  endpoint: string;
  dataType: string;
  lastUpdate: number;
}

interface DataToken {
  tokenId: string;
  feedId: string;
  feedName: string;
  dataType: string;
  createdAt: string;
  updatedAt: string;
}

const MerkleRegistryViewer: React.FC<{ channelId?: string }> = ({ channelId }) => {
  const [registryStats, setRegistryStats] = useState<RegistryStats | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);
  const [dataFeeds, setDataFeeds] = useState<DataFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [feedTokens, setFeedTokens] = useState<DataToken[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'https://dlt.aurigraph.io/api/v11/demo/registry';

  // Fetch simulation status
  const fetchSimulationStatus = async () => {
    if (!channelId) return;
    try {
      const response = await axios.get(`${API_BASE}/simulation/${channelId}`);
      if (response.data.success) {
        setSimulationStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching simulation status:', error);
    }
  };

  // Fetch registry statistics
  const fetchRegistryStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      if (response.data.success) {
        setRegistryStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching registry stats:', error);
    }
  };

  // Fetch data feeds
  const fetchDataFeeds = async () => {
    try {
      const response = await axios.get(`${API_BASE}/feeds`);
      if (response.data.success) {
        setDataFeeds(response.data.data.feeds || []);
      }
    } catch (error) {
      console.error('Error fetching data feeds:', error);
    }
  };

  // Fetch feed tokens
  const fetchFeedTokens = async (feedId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/feeds/${feedId}/tokens`);
      if (response.data.success) {
        setFeedTokens(response.data.data.tokens || []);
      }
    } catch (error) {
      console.error('Error fetching feed tokens:', error);
    }
  };

  // Initial load and setup interval
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      Promise.all([fetchSimulationStatus(), fetchRegistryStats(), fetchDataFeeds()])
        .finally(() => setLoading(false));
    };

    loadData();

    // Set up auto-refresh every 3 seconds
    const interval = setInterval(loadData, 3000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [channelId]);

  // Handle feed selection
  const handleFeedSelect = (feedId: string) => {
    setSelectedFeed(feedId);
    fetchFeedTokens(feedId);
  };

  // Data feeds table columns
  const feedsColumns = [
    {
      title: 'API Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Data Type',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.substring(0, 30)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: DataFeed) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleFeedSelect(record.id)}
        >
          View Tokens
        </Button>
      ),
    },
  ];

  // Feed tokens table columns
  const tokensColumns = [
    {
      title: 'Token ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (text: string) => (
        <Tooltip title={text}>
          <code>{text.substring(0, 20)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Data Type',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <div className="merkle-registry-viewer">
      <h2>
        <LinkOutlined /> Merkle Tree Registry - Real-Time Data Feed Tokenization
      </h2>

      {/* Simulation Config */}
      {simulationStatus && (
        <Card className="simulation-config-card" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Channel Name"
                value={simulationStatus.channelName}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Status</div>
                <Badge status={simulationStatus.status === 'running' ? 'processing' : 'success'} text={simulationStatus.status === 'running' ? 'Running' : 'Completed'} />
              </div>
            </Col>
            <Col span={8}>
              <Statistic
                title="Duration"
                value={simulationStatus.duration}
                suffix="sec"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>

          {/* Node Configuration */}
          <Row gutter={16} style={{ marginTop: '20px' }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Validator Nodes"
                  value={simulationStatus.config.validatorNodes}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Business Nodes"
                  value={simulationStatus.config.businessNodes}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Slim Nodes"
                  value={simulationStatus.config.slimNodes}
                  prefix={<LinkOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="API Data Feeds"
                  value={5}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Transaction Metrics */}
      {simulationStatus && (
        <Card title="Transaction Metrics" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Transactions"
                value={simulationStatus.metrics.totalTransactions}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Successful"
                value={simulationStatus.metrics.successfulTransactions}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Success Rate"
                value={simulationStatus.metrics.successRate}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Peak TPS"
                value={simulationStatus.metrics.peakTPS}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '15px' }}>
            <Col span={8}>
              <Statistic
                title="Average Latency"
                value={simulationStatus.metrics.averageLatency}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Block Height"
                value={simulationStatus.metrics.blockHeight}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Failed Transactions"
                value={simulationStatus.metrics.failedTransactions}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Merkle Registry Status */}
      {registryStats && (
        <Card title="Merkle Tree Registry Status" style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Tokens"
                value={registryStats.totalTokens}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Registered APIs"
                value={registryStats.apiCount}
                prefix={<ApiOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tree Height"
                value={registryStats.treeHeight}
                prefix={<LinkOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Total Rebuilds"
                value={registryStats.rebuildCount}
              />
            </Col>
          </Row>

          {/* Merkle Root Hash */}
          <div style={{ marginTop: '20px' }}>
            <h4>Current Merkle Root Hash</h4>
            <code
              style={{
                padding: '10px',
                background: '#f0f0f0',
                borderRadius: '4px',
                display: 'block',
                wordBreak: 'break-all',
                fontSize: '12px',
              }}
            >
              {registryStats.rootHash}
            </code>
          </div>
        </Card>
      )}

      {/* Data Feeds & Tokens */}
      <Card
        title="External API Data Feeds & Tokenization"
        style={{ marginBottom: '20px' }}
      >
        <Collapse
          items={[
            {
              key: '1',
              label: (
                <span>
                  <ApiOutlined /> Data Feeds ({dataFeeds.length})
                </span>
              ),
              children: (
                <Table
                  columns={feedsColumns}
                  dataSource={dataFeeds}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  loading={loading}
                />
              ),
            },
            {
              key: '2',
              label: (
                <span>
                  <LinkOutlined /> Data Feed Tokens ({feedTokens.length})
                </span>
              ),
              children: selectedFeed ? (
                <Table
                  columns={tokensColumns}
                  dataSource={feedTokens}
                  rowKey="tokenId"
                  pagination={false}
                  size="small"
                  loading={loading}
                />
              ) : (
                <p style={{ color: '#999' }}>
                  Select a data feed to view tokenized data
                </p>
              ),
            },
          ]}
        />
      </Card>

      {/* Real-Time Update Info */}
      <Card type="inner" style={{ background: '#f6f8fb', borderColor: '#1890ff' }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>Real-time updates enabled - refreshing every 3 seconds</span>
        </Space>
      </Card>
    </div>
  );
};

export default MerkleRegistryViewer;
