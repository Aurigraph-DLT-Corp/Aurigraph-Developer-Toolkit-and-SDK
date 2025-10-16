/**
 * Block Explorer Component
 *
 * Block details, chain visualization, and consensus status monitoring
 * Connects to Phase2BlockchainResource.java for block data and HyperRAFTConsensusService.java for consensus metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Timeline,
  Progress,
  Tag,
  Button,
  Drawer,
  Descriptions,
  Typography,
  Space,
  Badge,
  Tooltip,
} from 'antd';
import {
  BlockOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Block, ChainInfo } from '../../types/comprehensive';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const BlockExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [chainInfo, setChainInfo] = useState<ChainInfo>({
    currentHeight: 0,
    totalBlocks: 0,
    totalTransactions: 0,
    avgBlockTime: 0,
    avgBlockSize: 0,
    avgTransactionsPerBlock: 0,
    chainStartTime: '',
    lastBlockTime: '',
    syncStatus: 'synced',
  });

  // Consensus metrics
  const [consensusMetrics, setConsensusMetrics] = useState({
    currentTerm: 0,
    leaderNodeId: '',
    activeValidators: 0,
    consensusState: 'IDLE' as 'IDLE' | 'PROPOSING' | 'VOTING' | 'COMMITTING',
    avgFinalityMs: 0,
    blockHeight: 0,
  });

  // Fetch blocks from backend
  const fetchBlocks = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v11/blockchain/blocks?limit=20');
      // const data = await response.json();

      const mockBlocks = generateMockBlocks(20);
      setBlocks(mockBlocks);

      // Update chain info
      setChainInfo({
        currentHeight: 1500250,
        totalBlocks: 1500250,
        totalTransactions: 52380954,
        avgBlockTime: 2.5,
        avgBlockSize: 15234,
        avgTransactionsPerBlock: 35,
        chainStartTime: '2024-01-01T00:00:00Z',
        lastBlockTime: new Date().toISOString(),
        syncStatus: 'synced',
      });

      // Update consensus metrics
      setConsensusMetrics({
        currentTerm: 1542,
        leaderNodeId: 'validator-03',
        activeValidators: 10,
        consensusState: Math.random() > 0.7 ? 'PROPOSING' : 'IDLE',
        avgFinalityMs: 250 + Math.random() * 100,
        blockHeight: 1500250,
      });
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();

    const interval = setInterval(() => {
      fetchBlocks();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Show block details
  const showBlockDetail = (block: Block) => {
    setSelectedBlock(block);
    setDrawerVisible(true);
  };

  // Table columns
  const columns: ColumnsType<Block> = [
    {
      title: 'Height',
      dataIndex: 'height',
      key: 'height',
      width: 120,
      render: (height: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          #{height.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 180,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Text copyable={{ text: hash }}>
            {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Transactions',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      width: 120,
      render: (count: number) => <Badge count={count} showZero color="#52c41a" />,
    },
    {
      title: 'Validator',
      dataIndex: 'validatorId',
      key: 'validatorId',
      width: 140,
      render: (id: string) => <Tag color="purple">{id}</Tag>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: 'Gas Used',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      width: 130,
      render: (gasUsed: number, record) => (
        <div>
          <Text>{gasUsed.toLocaleString()}</Text>
          <Progress
            percent={(gasUsed / record.gasLimit) * 100}
            size="small"
            showInfo={false}
            strokeColor="#1890ff"
          />
        </div>
      ),
    },
    {
      title: 'Finality',
      dataIndex: 'finalityMs',
      key: 'finalityMs',
      width: 100,
      render: (ms: number) => (
        <Text type={ms < 300 ? 'success' : 'warning'}>{ms.toFixed(0)}ms</Text>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp: string) => (
        <Tooltip title={new Date(timestamp).toLocaleString()}>{dayjs(timestamp).fromNow()}</Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showBlockDetail(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Block Explorer</Title>
      <Text type="secondary">
        Real-time blockchain monitoring with HyperRAFT++ consensus insights
      </Text>

      {/* Chain Statistics */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Height"
              value={chainInfo.currentHeight}
              prefix={<BlockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={chainInfo.totalTransactions}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Block Time"
              value={chainInfo.avgBlockTime}
              precision={1}
              suffix="s"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sync Status"
              value={chainInfo.syncStatus.toUpperCase()}
              prefix={
                chainInfo.syncStatus === 'synced' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <SyncOutlined spin style={{ color: '#1890ff' }} />
                )
              }
              valueStyle={{
                color: chainInfo.syncStatus === 'synced' ? '#52c41a' : '#1890ff',
                fontSize: '20px',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Consensus Metrics */}
      <Card title="HyperRAFT++ Consensus Status" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Current Term"
              value={consensusMetrics.currentTerm}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Leader Node"
              value={consensusMetrics.leaderNodeId}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Active Validators"
              value={consensusMetrics.activeValidators}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="Consensus State"
              value={consensusMetrics.consensusState}
              valueStyle={{
                color: consensusMetrics.consensusState === 'PROPOSING' ? '#faad14' : '#52c41a',
                fontSize: '18px',
              }}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Text type="secondary">Average Finality Latency: </Text>
            <Text strong style={{ color: '#1890ff' }}>
              {consensusMetrics.avgFinalityMs.toFixed(0)}ms
            </Text>
            <Progress
              percent={(300 - consensusMetrics.avgFinalityMs) / 3}
              strokeColor="#52c41a"
              style={{ marginTop: '8px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Recent Blocks Table */}
      <Card
        title="Recent Blocks"
        extra={
          <Button icon={<SyncOutlined />} onClick={fetchBlocks} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={blocks}
          loading={loading}
          rowKey="height"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Block Detail Drawer */}
      <Drawer
        title="Block Details"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedBlock && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Block Height">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  #{selectedBlock.height.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Block Hash">
                <Text copyable>{selectedBlock.hash}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Previous Hash">
                <Text copyable>
                  <LinkOutlined /> {selectedBlock.previousHash}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Merkle Root">
                <Text copyable>{selectedBlock.merkleRoot}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="State Root">
                <Text copyable>{selectedBlock.stateRoot}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {new Date(selectedBlock.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Validator">
                <Tag color="purple">{selectedBlock.validatorId}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Consensus Term">
                {selectedBlock.consensusTerm}
              </Descriptions.Item>
              <Descriptions.Item label="Transaction Count">
                <Badge count={selectedBlock.transactionCount} showZero color="#52c41a" />
              </Descriptions.Item>
              <Descriptions.Item label="Block Size">
                {(selectedBlock.size / 1024).toFixed(2)} KB
              </Descriptions.Item>
              <Descriptions.Item label="Gas Used / Limit">
                <Space>
                  <Text>{selectedBlock.gasUsed.toLocaleString()}</Text>
                  <Text type="secondary">/ {selectedBlock.gasLimit.toLocaleString()}</Text>
                  <Progress
                    percent={(selectedBlock.gasUsed / selectedBlock.gasLimit) * 100}
                    size="small"
                    style={{ width: 100 }}
                  />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Finality Time">
                <Text
                  strong
                  style={{ color: selectedBlock.finalityMs < 300 ? '#52c41a' : '#faad14' }}
                >
                  {selectedBlock.finalityMs.toFixed(0)}ms
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Recent blocks timeline preview */}
            <Card title="Block Chain" size="small">
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong>Block #{selectedBlock.height}</Text>
                        <br />
                        <Text type="secondary">Current</Text>
                      </>
                    ),
                  },
                  {
                    color: 'blue',
                    children: (
                      <>
                        <Text>Block #{selectedBlock.height - 1}</Text>
                        <br />
                        <Text type="secondary">
                          {selectedBlock.previousHash.substring(0, 16)}...
                        </Text>
                      </>
                    ),
                  },
                  {
                    color: 'gray',
                    children: <Text type="secondary">Previous blocks...</Text>,
                  },
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

// Mock data generator
const generateMockBlocks = (count: number): Block[] => {
  return Array.from({ length: count }, (_, i) => ({
    height: 1500250 - i,
    hash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    previousHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    timestamp: new Date(Date.now() - i * 2500).toISOString(),
    transactionCount: Math.floor(Math.random() * 50) + 10,
    validatorId: `validator-${(i % 10).toString().padStart(2, '0')}`,
    merkleRoot: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    stateRoot: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    size: Math.floor(Math.random() * 50000) + 10000,
    gasUsed: Math.floor(Math.random() * 8000000) + 1000000,
    gasLimit: 10000000,
    consensusTerm: 1542 - Math.floor(i / 100),
    finalityMs: 200 + Math.random() * 150,
  }));
};

export default BlockExplorer;
