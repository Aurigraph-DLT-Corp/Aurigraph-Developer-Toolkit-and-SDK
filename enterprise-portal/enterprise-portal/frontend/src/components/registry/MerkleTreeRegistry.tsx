/**
 * Merkle Tree Registry Visualization Component
 * Displays hierarchical merkle tree structure for tokens and assets
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Tree,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Modal,
  Tag,
  Divider,
  Input,
  Select,
  Tooltip,
  Table,
  Empty,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  CodeOutlined,
  LockOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

interface MerkleNode {
  id: string;
  hash: string;
  value?: string;
  type: 'root' | 'branch' | 'leaf';
  children?: MerkleNode[];
  verified: boolean;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface MerkleTreeStats {
  totalNodes: number;
  totalLeaves: number;
  treeDepth: number;
  verifiedNodes: number;
  unverifiedNodes: number;
  lastUpdateTime: string;
}

interface MerkleTreeRegistryProps {
  title?: string;
  data?: MerkleNode;
  onVerify?: (nodeId: string) => Promise<void>;
  onExport?: () => Promise<void>;
  readOnly?: boolean;
}

const MerkleTreeRegistry: React.FC<MerkleTreeRegistryProps> = ({
  title = 'Merkle Tree Registry',
  data,
  onVerify,
  onExport,
  readOnly = false,
}) => {
  const [selectedNode, setSelectedNode] = useState<MerkleNode | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'unverified'>('all');

  // Mock merkle tree data
  const mockData: MerkleNode = data || {
    id: 'root',
    hash: '0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    type: 'root',
    verified: true,
    timestamp: new Date().toISOString(),
    children: [
      {
        id: 'branch1',
        hash: '0x1234567890abcdef1234567890abcdef',
        type: 'branch',
        verified: true,
        children: [
          {
            id: 'leaf1-1',
            hash: '0xaabbccddeeff00112233445566778899',
            value: 'Token-001',
            type: 'leaf',
            verified: true,
            metadata: { assetName: 'Property-NYC', value: 1000000 },
          },
          {
            id: 'leaf1-2',
            hash: '0xffeeddccbbaa99887766554433221100',
            value: 'Token-002',
            type: 'leaf',
            verified: true,
            metadata: { assetName: 'Property-LA', value: 800000 },
          },
        ],
      },
      {
        id: 'branch2',
        hash: '0xfedcba9876543210fedcba9876543210',
        type: 'branch',
        verified: false,
        children: [
          {
            id: 'leaf2-1',
            hash: '0x1111222233334444555566667777888',
            value: 'Token-003',
            type: 'leaf',
            verified: false,
            metadata: { assetName: 'Art-Piece', value: 500000 },
          },
          {
            id: 'leaf2-2',
            hash: '0x9999888877776666555544443333222',
            value: 'Token-004',
            type: 'leaf',
            verified: true,
            metadata: { assetName: 'Bond-Portfolio', value: 2000000 },
          },
        ],
      },
    ],
  };

  // Calculate merkle tree statistics
  const stats = useMemo(() => {
    const calculateStats = (node: MerkleNode): MerkleTreeStats => {
      let totalNodes = 1;
      let totalLeaves = node.type === 'leaf' ? 1 : 0;
      let verifiedNodes = node.verified ? 1 : 0;
      let unverifiedNodes = !node.verified ? 1 : 0;
      let maxDepth = node.type === 'leaf' ? 1 : 0;

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          const childStats = calculateStats(child);
          totalNodes += childStats.totalNodes;
          totalLeaves += childStats.totalLeaves;
          verifiedNodes += childStats.verifiedNodes;
          unverifiedNodes += childStats.unverifiedNodes;
          maxDepth = Math.max(maxDepth, childStats.treeDepth + 1);
        });
      }

      return {
        totalNodes,
        totalLeaves,
        treeDepth: maxDepth,
        verifiedNodes,
        unverifiedNodes,
        lastUpdateTime: new Date().toISOString(),
      };
    };

    return calculateStats(mockData);
  }, [mockData]);

  // Convert merkle tree to Ant Tree format
  const treeData = useMemo(() => {
    const convertToTreeData = (node: MerkleNode): DataNode => {
      const title = (
        <span>
          {node.type === 'root' && '📦 '}
          {node.type === 'branch' && '📁 '}
          {node.type === 'leaf' && '📄 '}
          {node.id}
          {node.verified && (
            <CheckCircleOutlined style={{ color: 'green', marginLeft: 8 }} />
          )}
          {!node.verified && (
            <WarningOutlined style={{ color: 'orange', marginLeft: 8 }} />
          )}
        </span>
      );

      return {
        title,
        key: node.id,
        children: node.children ? node.children.map(convertToTreeData) : undefined,
        selectable: true,
      };
    };

    return [convertToTreeData(mockData)];
  }, [mockData]);

  // Find node in tree
  const findNode = (nodeId: string, node: MerkleNode): MerkleNode | null => {
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(nodeId, child);
        if (found) return found;
      }
    }
    return null;
  };

  const handleNodeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const nodeId = selectedKeys[0] as string;
      const foundNode = findNode(nodeId, mockData);
      if (foundNode) {
        setSelectedNode(foundNode);
      }
    }
  };

  const handleVerify = async () => {
    if (!selectedNode || readOnly) return;

    try {
      setVerificationLoading(true);
      if (onVerify) {
        await onVerify(selectedNode.id);
      }
      Modal.success({
        title: 'Verification Success',
        content: `Node ${selectedNode.id} has been verified successfully.`,
      });
      setVerificationModalVisible(false);
    } catch (error) {
      Modal.error({
        title: 'Verification Failed',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (onExport) {
        await onExport();
      }
      Modal.success({
        title: 'Export Success',
        content: 'Merkle tree data has been exported successfully.',
      });
    } catch (error) {
      Modal.error({
        title: 'Export Failed',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const nodeDetailsColumns = [
    {
      title: 'Property',
      dataIndex: 'property',
      key: 'property',
      width: 150,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: any) => <code>{JSON.stringify(value)}</code>,
    },
  ];

  const nodeDetails = selectedNode
    ? [
      { property: 'ID', value: selectedNode.id, key: 'id' },
      { property: 'Hash', value: selectedNode.hash, key: 'hash' },
      { property: 'Type', value: selectedNode.type, key: 'type' },
      { property: 'Verified', value: selectedNode.verified ? 'Yes' : 'No', key: 'verified' },
      {
        property: 'Children',
        value: selectedNode.children?.length || 0,
        key: 'children',
      },
      {
        property: 'Timestamp',
        value: selectedNode.timestamp
          ? new Date(selectedNode.timestamp).toLocaleString()
          : 'N/A',
        key: 'timestamp',
      },
    ]
    : [];

  return (
    <div style={{ padding: '24px' }}>
      <Card title={title} extra={<Tag color="gold">Merkle Tree V1</Tag>}>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Nodes"
              value={stats.totalNodes}
              prefix={<CodeOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Leaves"
              value={stats.totalLeaves}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tree Depth"
              value={stats.treeDepth}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Verified"
              value={stats.verifiedNodes}
              suffix={`/ ${stats.totalNodes}`}
              valueStyle={{ color: stats.verifiedNodes === stats.totalNodes ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
        </Row>

        <Divider />

        {/* Controls */}
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search node..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
            options={[
              { label: 'All Nodes', value: 'all' },
              { label: 'Verified', value: 'verified' },
              { label: 'Unverified', value: 'unverified' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setExpandedKeys(['root'])}>
            Refresh
          </Button>
          {!readOnly && (
            <Button
              type="primary"
              onClick={() => setVerificationModalVisible(true)}
              disabled={!selectedNode}
              icon={<LockOutlined />}
            >
              Verify Selected
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export Tree
          </Button>
        </Space>

        <Divider />

        <Row gutter={16}>
          {/* Merkle Tree Visualization */}
          <Col xs={24} lg={14}>
            <Card size="small" title="Tree Structure" style={{ maxHeight: 600, overflow: 'auto' }}>
              <Tree
                defaultExpandAll
                treeData={treeData}
                onSelect={handleNodeSelect}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
              />
            </Card>
          </Col>

          {/* Node Details */}
          <Col xs={24} lg={10}>
            <Card size="small" title="Node Details">
              {selectedNode ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color={selectedNode.verified ? 'green' : 'orange'}>
                      {selectedNode.verified ? 'Verified' : 'Unverified'}
                    </Tag>
                    <Tag color="blue">{selectedNode.type}</Tag>
                  </div>

                  <Table
                    dataSource={nodeDetails}
                    columns={nodeDetailsColumns}
                    pagination={false}
                    size="small"
                    showHeader={false}
                  />

                  {selectedNode.metadata && (
                    <>
                      <Divider />
                      <h4>Metadata</h4>
                      <pre
                        style={{
                          backgroundColor: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(selectedNode.metadata, null, 2)}
                      </pre>
                    </>
                  )}

                  {!readOnly && !selectedNode.verified && (
                    <Button
                      type="primary"
                      onClick={() => setVerificationModalVisible(true)}
                      block
                      style={{ marginTop: 16 }}
                    >
                      Verify This Node
                    </Button>
                  )}
                </div>
              ) : (
                <Empty description="Select a node to view details" />
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Verification Modal */}
      <Modal
        title="Verify Merkle Node"
        open={verificationModalVisible}
        onCancel={() => setVerificationModalVisible(false)}
        onOk={handleVerify}
        confirmLoading={verificationLoading}
        width={600}
      >
        {selectedNode && (
          <div>
            <p>
              <strong>Node ID:</strong> {selectedNode.id}
            </p>
            <p>
              <strong>Hash:</strong> <code>{selectedNode.hash}</code>
            </p>
            <p>
              <strong>Type:</strong> {selectedNode.type}
            </p>
            <p>
              Are you sure you want to verify this node? This action will cryptographically
              verify the node's integrity.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MerkleTreeRegistry;
