/**
 * Network Configuration Panel
 *
 * Enhanced configuration panel with:
 * - Odd validator count enforcement (BFT consensus)
 * - Multiple slim nodes streaming external API data
 * - 24-hour demo session persistence
 * - Auto-distribution of data sources across slim nodes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Select,
  Space,
  Typography,
  Divider,
  message,
  Tag,
  Alert,
  Progress,
  Statistic,
  Row,
  Col,
  Badge,
  Input,
  Modal,
} from 'antd';
import {
  NodeIndexOutlined,
  SafetyOutlined,
  ShopOutlined,
  ApiOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloudOutlined,
  StockOutlined,
  ReadOutlined,
  TwitterOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import {
  updateNetworkConfig,
  addDataSource,
  removeDataSource,
  startDemoSession,
  endDemoSession,
  autoDistributeDataSources,
  clearExpiredDemoSession,
} from '../../store/demoAppSlice';
import type { NetworkConfig, DataSourceType, AnyDataSource, SlimNodeMapping } from '../../types/dataSources';
import { DATA_SOURCE_TEMPLATES } from '../../types/dataSources';

const { Title, Text } = Typography;
const { Option } = Select;
const { Countdown } = Statistic;

const DATA_SOURCE_ICONS: Record<DataSourceType, React.ReactNode> = {
  weather: <CloudOutlined />,
  alpaca: <StockOutlined />,
  newsapi: <ReadOutlined />,
  twitter: <TwitterOutlined />,
  crypto: <DollarOutlined />,
  'crypto-exchange': <DollarOutlined />,
  stock: <StockOutlined />,
  forex: <DollarOutlined />,
  custom: <ApiOutlined />,
};

const DATA_SOURCE_COLORS: Record<DataSourceType, string> = {
  weather: 'blue',
  alpaca: 'green',
  newsapi: 'orange',
  twitter: 'cyan',
  crypto: 'gold',
  'crypto-exchange': 'lime',
  stock: 'purple',
  forex: 'magenta',
  custom: 'default',
};

// Odd numbers for validator selection (BFT consensus requires 2f+1)
const ODD_VALIDATOR_OPTIONS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

export const NetworkConfigPanel = () => {
  const dispatch = useAppDispatch();
  const networkConfig = useAppSelector((state) => state.demoApp.networkConfig);

  const [selectedDataSourceType, setSelectedDataSourceType] = useState<DataSourceType>('weather');
  const [isApplying, setIsApplying] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);

  // Check for expired sessions on mount
  useEffect(() => {
    dispatch(clearExpiredDemoSession());
  }, [dispatch]);

  // Calculate time remaining for demo session
  const getTimeRemaining = useCallback(() => {
    if (!networkConfig?.demoSession?.expiresAt) return null;
    const expiresAt = new Date(networkConfig.demoSession.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, expiresAt - now);
  }, [networkConfig?.demoSession?.expiresAt]);

  const handleValidatorCountChange = (value: number | null) => {
    if (value !== null) {
      // Ensure it's odd for BFT consensus
      const oddValue = value % 2 === 0 ? value + 1 : value;
      dispatch(updateNetworkConfig({ validators: oddValue }));
    }
  };

  const handleNodeCountChange = (field: keyof NetworkConfig, value: number | null) => {
    if (value !== null && value >= 0) {
      dispatch(updateNetworkConfig({ [field]: value }));
    }
  };

  const handleAddDataSource = () => {
    const template = DATA_SOURCE_TEMPLATES[selectedDataSourceType];
    const newDataSource: AnyDataSource = {
      id: `ds-${selectedDataSourceType}-${Date.now()}`,
      type: selectedDataSourceType,
      name: template.name || `${selectedDataSourceType} source`,
      description: template.description || '',
      enabled: true,
      updateInterval: template.updateInterval || 60000,
    } as AnyDataSource;

    // Add type-specific properties based on type
    if (selectedDataSourceType === 'weather') {
      (newDataSource as any).location = 'New York';
      (newDataSource as any).units = 'metric';
    } else if (selectedDataSourceType === 'alpaca') {
      (newDataSource as any).symbols = ['AAPL', 'GOOGL', 'TSLA'];
      (newDataSource as any).dataType = 'quotes';
    } else if (selectedDataSourceType === 'newsapi') {
      (newDataSource as any).query = 'blockchain cryptocurrency';
      (newDataSource as any).language = 'en';
      (newDataSource as any).category = 'business';
    } else if (selectedDataSourceType === 'twitter') {
      (newDataSource as any).keywords = ['blockchain', 'DLT', 'tokenization'];
      (newDataSource as any).language = 'en';
    } else if (selectedDataSourceType === 'crypto') {
      (newDataSource as any).symbols = ['BTC', 'ETH', 'SOL'];
      (newDataSource as any).currency = 'USD';
    } else if (selectedDataSourceType === 'stock') {
      (newDataSource as any).symbols = ['AAPL', 'MSFT', 'AMZN'];
    } else if (selectedDataSourceType === 'forex') {
      (newDataSource as any).pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY'];
    }

    dispatch(addDataSource(newDataSource));
    message.success(`Added ${template.name} data source`);
  };

  const handleRemoveDataSource = (id: string) => {
    dispatch(removeDataSource(id));
    message.success('Data source removed');
  };

  const handleAutoDistribute = () => {
    dispatch(autoDistributeDataSources());
    message.success('Data sources distributed across slim nodes');
  };

  const handleStartSession = () => {
    if (!sessionName.trim()) {
      message.error('Please enter a session name');
      return;
    }
    dispatch(startDemoSession({ name: sessionName }));
    setShowStartModal(false);
    setSessionName('');
    message.success('Demo session started! Data will persist for 24 hours.');
  };

  const handleEndSession = () => {
    Modal.confirm({
      title: 'End Demo Session?',
      content: 'This will stop the current session. Session data will be preserved until expiration.',
      okText: 'End Session',
      okType: 'danger',
      onOk: () => {
        dispatch(endDemoSession());
        message.info('Demo session ended');
      },
    });
  };

  const handleApplyConfiguration = async () => {
    setIsApplying(true);

    try {
      if (!networkConfig) {
        message.error('No network configuration available');
        return;
      }

      if (networkConfig.channels < 1) {
        message.error('At least 1 channel is required');
        return;
      }

      if (networkConfig.validators < 1) {
        message.error('At least 1 validator node is required');
        return;
      }

      // Validate odd validator count
      if (networkConfig.validators % 2 === 0) {
        message.warning('Validators adjusted to odd number for BFT consensus');
        dispatch(updateNetworkConfig({ validators: networkConfig.validators + 1 }));
      }

      // Auto-distribute if data sources exist
      if (networkConfig.dataSources.length > 0 && networkConfig.slimNodes > 0) {
        dispatch(autoDistributeDataSources());
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success(
        `Network configured: ${networkConfig.channels} channel(s), ${networkConfig.validators} validator(s) (BFT), ` +
          `${networkConfig.businessNodes} business node(s), ${networkConfig.slimNodes} slim node(s), ` +
          `${networkConfig.dataSources.length} data source(s)`
      );
    } catch (error) {
      message.error('Failed to apply configuration');
      console.error('Configuration error:', error);
    } finally {
      setIsApplying(false);
    }
  };

  if (!networkConfig) {
    return (
      <Card>
        <Text type="secondary">Network configuration not available</Text>
      </Card>
    );
  }

  const demoSession = networkConfig.demoSession;
  const timeRemaining = getTimeRemaining();

  return (
    <div>
      {/* Demo Session Card */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Demo Session (24-Hour Persistence)</span>
            {demoSession?.isActive && <Badge status="processing" text="Active" />}
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          demoSession?.isActive ? (
            <Button danger icon={<StopOutlined />} onClick={handleEndSession}>
              End Session
            </Button>
          ) : (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setShowStartModal(true)}>
              Start Session
            </Button>
          )
        }
      >
        {demoSession?.isActive ? (
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Session Name" value={demoSession.name} />
            </Col>
            <Col span={6}>
              <Statistic title="Total Transactions" value={demoSession.totalTransactions} />
            </Col>
            <Col span={6}>
              <Statistic title="Peak TPS" value={demoSession.peakTps} suffix="TPS" />
            </Col>
            <Col span={6}>
              {timeRemaining && timeRemaining > 0 && (
                <Countdown
                  title="Time Remaining"
                  value={Date.now() + timeRemaining}
                  format="HH:mm:ss"
                />
              )}
            </Col>
          </Row>
        ) : (
          <Alert
            message="No Active Session"
            description="Start a demo session to enable 24-hour data persistence. All transactions, metrics, and node states will be preserved."
            type="info"
            showIcon
          />
        )}

        {demoSession && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Session Created: {new Date(demoSession.createdAt).toLocaleString()}
            </Text>
            <br />
            <Text type="secondary">
              Expires: {new Date(demoSession.expiresAt).toLocaleString()}
            </Text>
            {timeRemaining && (
              <Progress
                percent={Math.round((1 - timeRemaining / (24 * 60 * 60 * 1000)) * 100)}
                size="small"
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        )}
      </Card>

      {/* Network Configuration Card */}
      <Card
        title={
          <Space>
            <NodeIndexOutlined />
            <span>Network Configuration</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form layout="vertical">
          {/* Node Topology */}
          <Title level={5}>Node Topology</Title>

          {/* BFT Consensus Alert */}
          <Alert
            message="BFT Consensus Requirement"
            description="Validator count must be odd (3, 5, 7, etc.) for Byzantine Fault Tolerant consensus. This ensures 2f+1 nodes can reach consensus even with f faulty nodes."
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Form.Item
              label={
                <Space>
                  <NodeIndexOutlined /> Channel Nodes
                </Space>
              }
            >
              <InputNumber
                min={1}
                max={10}
                value={networkConfig.channels}
                onChange={(value) => handleNodeCountChange('channels', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <SafetyOutlined /> Validator Nodes
                  <Tag color="orange">Must be ODD</Tag>
                </Space>
              }
              help="Select an odd number for BFT consensus (2f+1 requirement)"
            >
              <Select
                value={networkConfig.validators}
                onChange={handleValidatorCountChange}
                style={{ width: '100%' }}
              >
                {ODD_VALIDATOR_OPTIONS.map((num) => (
                  <Option key={num} value={num}>
                    {num} Validators {num >= 3 ? `(tolerates ${Math.floor((num - 1) / 2)} failures)` : '(minimum)'}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <ShopOutlined /> Business Nodes
                </Space>
              }
            >
              <InputNumber
                min={0}
                max={50}
                value={networkConfig.businessNodes}
                onChange={(value) => handleNodeCountChange('businessNodes', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <ApiOutlined /> Slim Nodes
                  <Tag color="blue">External API Streaming</Tag>
                </Space>
              }
              help="Slim nodes can stream data from external APIs (stocks, crypto, weather, etc.)"
            >
              <InputNumber
                min={0}
                max={100}
                value={networkConfig.slimNodes}
                onChange={(value) => handleNodeCountChange('slimNodes', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          <Divider />

          {/* Data Sources for Slim Nodes */}
          <Title level={5}>
            <Space>
              <ThunderboltOutlined />
              External API Data Sources for Slim Nodes
            </Space>
          </Title>

          <Alert
            message="External Data Streaming"
            description={`Configure external APIs to stream real-time data through ${networkConfig.slimNodes} slim nodes. Data sources will be automatically distributed across nodes.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Form.Item label="Add Data Source">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  value={selectedDataSourceType}
                  onChange={setSelectedDataSourceType}
                  style={{ flex: 1 }}
                >
                  {Object.entries(DATA_SOURCE_TEMPLATES).map(([type, template]) => (
                    <Option key={type} value={type}>
                      <Space>
                        {DATA_SOURCE_ICONS[type as DataSourceType]}
                        {template.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDataSource}>
                  Add
                </Button>
              </Space.Compact>
            </Form.Item>

            {networkConfig.dataSources.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Active Data Sources ({networkConfig.dataSources.length})</Text>
                  <Button
                    type="dashed"
                    icon={<LinkOutlined />}
                    onClick={handleAutoDistribute}
                    disabled={networkConfig.slimNodes === 0}
                  >
                    Auto-Distribute to Slim Nodes
                  </Button>
                </div>

                <Space direction="vertical" style={{ width: '100%' }}>
                  {networkConfig.dataSources.map((dataSource) => (
                    <Card
                      key={dataSource.id}
                      size="small"
                      extra={
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveDataSource(dataSource.id)}
                        />
                      }
                    >
                      <Space direction="vertical" size="small">
                        <Space>
                          {DATA_SOURCE_ICONS[dataSource.type]}
                          <Text strong>{dataSource.name}</Text>
                          <Tag color={DATA_SOURCE_COLORS[dataSource.type]}>{dataSource.type}</Tag>
                          <Badge status="processing" text="Streaming" />
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dataSource.description}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Update interval: {dataSource.updateInterval / 1000}s
                        </Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </>
            )}

            {networkConfig.dataSources.length === 0 && (
              <Alert
                message="No Data Sources"
                description="Add external data sources to enable real-time data streaming through slim nodes. This simulates real-world data flowing into the blockchain network."
                type="info"
                showIcon
              />
            )}
          </Space>

          {/* Slim Node Mappings */}
          {networkConfig.slimNodeMappings.length > 0 && (
            <>
              <Divider />
              <Title level={5}>
                <Space>
                  <LinkOutlined />
                  Slim Node → Data Source Mappings
                </Space>
              </Title>

              <Row gutter={[8, 8]}>
                {networkConfig.slimNodeMappings.map((mapping: SlimNodeMapping) => (
                  <Col span={8} key={mapping.slimNodeId}>
                    <Card size="small" title={mapping.slimNodeId}>
                      <Space direction="vertical" size="small">
                        <Badge
                          status={mapping.isStreaming ? 'processing' : 'default'}
                          text={mapping.isStreaming ? 'Streaming' : 'Idle'}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Sources: {mapping.dataSourceIds.length}
                        </Text>
                        {mapping.dataSourceIds.map((dsId) => {
                          const ds = networkConfig.dataSources.find((d) => d.id === dsId);
                          return ds ? (
                            <Tag key={dsId} color={DATA_SOURCE_COLORS[ds.type]} style={{ fontSize: 10 }}>
                              {ds.type}
                            </Tag>
                          ) : null;
                        })}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          <Divider />

          {/* Apply Configuration Button */}
          <Button
            type="primary"
            size="large"
            block
            loading={isApplying}
            onClick={handleApplyConfiguration}
            icon={<SyncOutlined />}
          >
            Apply Network Configuration
          </Button>

          {/* Configuration Summary */}
          <Card size="small" style={{ marginTop: 16, background: '#f0f2f5' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Total Nodes"
                  value={
                    networkConfig.channels +
                    networkConfig.validators +
                    networkConfig.businessNodes +
                    networkConfig.slimNodes
                  }
                />
              </Col>
              <Col span={6}>
                <Statistic title="Validators (Odd)" value={networkConfig.validators} />
              </Col>
              <Col span={6}>
                <Statistic title="Data Sources" value={networkConfig.dataSources.length} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Fault Tolerance"
                  value={Math.floor((networkConfig.validators - 1) / 2)}
                  suffix="nodes"
                />
              </Col>
            </Row>
          </Card>
        </Form>
      </Card>

      {/* Start Session Modal */}
      <Modal
        title="Start Demo Session"
        open={showStartModal}
        onOk={handleStartSession}
        onCancel={() => setShowStartModal(false)}
        okText="Start 24-Hour Session"
      >
        <Form layout="vertical">
          <Form.Item label="Session Name" required>
            <Input
              placeholder="e.g., High Throughput Demo - Dec 8"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </Form.Item>
          <Alert
            message="24-Hour Persistence"
            description="All demo data including transactions, metrics, and node states will be preserved for 24 hours from session start."
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
};

export default NetworkConfigPanel;
