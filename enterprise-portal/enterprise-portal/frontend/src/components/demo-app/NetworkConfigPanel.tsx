/**
 * Network Configuration Panel
 *
 * Allows users to configure the network topology and data sources for slim nodes
 */

import { useState } from 'react';
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
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { updateNetworkConfig, addDataSource, removeDataSource } from '../../store/demoAppSlice';
import type { NetworkConfig, DataSourceType, AnyDataSource } from '../../types/dataSources';
import { DATA_SOURCE_TEMPLATES } from '../../types/dataSources';

const { Title, Text } = Typography;
const { Option } = Select;

const DATA_SOURCE_ICONS: Record<DataSourceType, React.ReactNode> = {
  weather: <CloudOutlined />,
  alpaca: <StockOutlined />,
  newsapi: <ReadOutlined />,
  twitter: <TwitterOutlined />,
  crypto: <DollarOutlined />,
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
  stock: 'purple',
  forex: 'magenta',
  custom: 'default',
};

export const NetworkConfigPanel = () => {
  const dispatch = useAppDispatch();
  const networkConfig = useAppSelector((state) => state.demoApp.networkConfig);

  const [selectedDataSourceType, setSelectedDataSourceType] = useState<DataSourceType>('weather');
  const [isApplying, setIsApplying] = useState(false);

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
      (newDataSource as any).symbols = ['AAPL'];
      (newDataSource as any).dataType = 'quotes';
    } else if (selectedDataSourceType === 'newsapi') {
      (newDataSource as any).query = 'technology';
      (newDataSource as any).language = 'en';
      (newDataSource as any).category = 'business';
    } else if (selectedDataSourceType === 'twitter') {
      (newDataSource as any).keywords = ['blockchain'];
      (newDataSource as any).language = 'en';
    } else if (selectedDataSourceType === 'crypto') {
      (newDataSource as any).symbols = ['BTC'];
      (newDataSource as any).currency = 'USD';
    }

    dispatch(addDataSource(newDataSource));
    message.success(`Added ${template.name} data source`);
  };

  const handleRemoveDataSource = (id: string) => {
    dispatch(removeDataSource(id));
    message.success('Data source removed');
  };

  const handleApplyConfiguration = async () => {
    setIsApplying(true);

    try {
      // Validate configuration
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

      // Simulate configuration application
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success(
        `Network configured: ${networkConfig.channels} channel(s), ${networkConfig.validators} validator(s), ` +
          `${networkConfig.businessNodes} business node(s), ${networkConfig.slimNodes} slim node(s), ` +
          `${networkConfig.dataSources.length} data source(s)`
      );

      // TODO: Actually generate nodes based on configuration
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

  return (
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
        {/* Node Count Configuration */}
        <Title level={5}>Node Topology</Title>
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
              </Space>
            }
          >
            <InputNumber
              min={1}
              max={20}
              value={networkConfig.validators}
              onChange={(value) => handleNodeCountChange('validators', value)}
              style={{ width: '100%' }}
            />
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
              </Space>
            }
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

        {/* Data Source Configuration */}
        <Title level={5}>Data Sources for Slim Nodes</Title>

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
            <Form.Item label="Active Data Sources">
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
            </Form.Item>
          )}

          {networkConfig.dataSources.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No data sources configured. Add data sources to feed data to slim nodes.
            </Text>
          )}
        </Space>

        <Divider />

        {/* Apply Configuration Button */}
        <Button
          type="primary"
          size="large"
          block
          loading={isApplying}
          onClick={handleApplyConfiguration}
          icon={<NodeIndexOutlined />}
        >
          Apply Network Configuration
        </Button>

        {/* Configuration Summary */}
        <Card size="small" style={{ marginTop: 16, background: '#f0f2f5' }}>
          <Space direction="vertical" size="small">
            <Text strong>Configuration Summary:</Text>
            <Text>
              • Total Nodes:{' '}
              {networkConfig.channels +
                networkConfig.validators +
                networkConfig.businessNodes +
                networkConfig.slimNodes}
            </Text>
            <Text>• Data Sources: {networkConfig.dataSources.length}</Text>
            <Text>
              • Slim Nodes with Data:{' '}
              {networkConfig.slimNodes > 0 && networkConfig.dataSources.length > 0 ? 'Yes' : 'No'}
            </Text>
          </Space>
        </Card>
      </Form>
    </Card>
  );
};

export default NetworkConfigPanel;
