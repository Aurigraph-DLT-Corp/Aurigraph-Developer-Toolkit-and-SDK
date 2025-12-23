/**
 * Smart Contract Registry View
 *
 * View and manage smart contracts in the registry
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tooltip,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRegistry, SmartContract } from '../hooks/useRegistry';
import { ContractStatus, STATUS_COLORS, PAGINATION_DEFAULTS } from '../utils/assetConstants';
import { formatDateTime, formatRelativeTime, formatContractStatus, truncateHash } from '../utils/formatters';

const { TextArea } = Input;
const { Option } = Select;

const SmartContractRegistryView: React.FC = () => {
  // Hooks
  const {
    contracts,
    loading,
    error,
    total,
    getSmartContracts,
    getSmartContractStats,
    getSmartContractDetails,
    createSmartContract,
    updateSmartContract,
  } = useRegistry({ enableWebSocket: true });

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULTS.PAGE_SIZE);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deployed: 0,
    paused: 0,
    deprecated: 0,
  });
  const [form] = Form.useForm();

  /**
   * Load contracts
   */
  const loadContracts = async () => {
    try {
      await getSmartContracts(currentPage, pageSize);
      const statsData = await getSmartContractStats();
      setStats(statsData);
    } catch (err: any) {
      message.error(err.message || 'Failed to load contracts');
    }
  };

  /**
   * Handle view details
   */
  const handleViewDetails = async (contract: SmartContract) => {
    try {
      const details = await getSmartContractDetails(contract.contractId);
      setSelectedContract(details);
      setDetailsModalVisible(true);
    } catch (err: any) {
      message.error(err.message || 'Failed to load contract details');
    }
  };

  /**
   * Handle create contract
   */
  const handleCreateContract = async () => {
    try {
      const values = await form.validateFields();
      await createSmartContract(values);
      message.success('Smart contract created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      loadContracts();
    } catch (err: any) {
      if (err.errorFields) {
        // Validation error
        return;
      }
      message.error(err.message || 'Failed to create contract');
    }
  };

  /**
   * Table columns
   */
  const columns: ColumnsType<SmartContract> = [
    {
      title: 'Contract ID',
      dataIndex: 'contractId',
      key: 'contractId',
      width: 120,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{truncateHash(text, 8, 4)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 150,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{truncateHash(text, 10, 6)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ContractStatus) => (
        <Tag color={STATUS_COLORS[status]}>{formatContractStatus(status)}</Tag>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: 'Linked Assets',
      dataIndex: 'linkedAssets',
      key: 'linkedAssets',
      width: 120,
      align: 'center',
      render: (assets: string[]) => (
        <Tag color="blue">{assets?.length || 0}</Tag>
      ),
    },
    {
      title: 'Deployed By',
      dataIndex: 'deployedBy',
      key: 'deployedBy',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Deployed At',
      dataIndex: 'deployedAt',
      key: 'deployedAt',
      width: 150,
      sorter: (a, b) => new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime(),
      render: (date) => (
        <Tooltip title={formatDateTime(date)}>
          <span>{formatRelativeTime(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              message.info('Edit functionality coming soon');
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * Initial load
   */
  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Total" value={stats.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Active" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Deployed" value={stats.deployed} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Paused" value={stats.paused} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic title="Deprecated" value={stats.deprecated} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Contract
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadContracts}>
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        {error && (
          <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
            Error: {error.message}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="contractId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: PAGINATION_DEFAULTS.PAGE_SIZE_OPTIONS.map(String),
            showTotal: (total) => `Total ${total} contracts`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || PAGINATION_DEFAULTS.PAGE_SIZE);
            },
          }}
          locale={{
            emptyText: <Empty description="No contracts found" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Contract Modal */}
      <Modal
        title="Create Smart Contract"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateContract}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Contract Name"
            name="name"
            rules={[{ required: true, message: 'Please enter contract name' }]}
          >
            <Input placeholder="Enter contract name" />
          </Form.Item>

          <Form.Item
            label="Contract Address"
            name="address"
            rules={[
              { required: true, message: 'Please enter contract address' },
              { min: 40, message: 'Invalid address format' },
            ]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Form.Item
            label="Code Hash"
            name="codeHash"
            rules={[{ required: true, message: 'Please enter code hash' }]}
          >
            <Input placeholder="Enter code hash" />
          </Form.Item>

          <Form.Item
            label="Version"
            name="version"
            rules={[{ required: true, message: 'Please enter version' }]}
          >
            <Input placeholder="1.0.0" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              {Object.values(ContractStatus).map((status) => (
                <Option key={status} value={status}>
                  {formatContractStatus(status)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Metadata" name="metadata">
            <TextArea rows={4} placeholder='{"key": "value"}' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Contract Details Modal */}
      <Modal
        title="Smart Contract Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedContract && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Contract ID">
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {selectedContract.contractId}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              <strong>{selectedContract.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {selectedContract.address}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Code Hash">
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {truncateHash(selectedContract.codeHash, 20, 10)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[selectedContract.status]}>
                {formatContractStatus(selectedContract.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Version">{selectedContract.version}</Descriptions.Item>
            <Descriptions.Item label="Linked Assets">
              {selectedContract.linkedAssets?.length || 0} assets
              {selectedContract.linkedAssets && selectedContract.linkedAssets.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {selectedContract.linkedAssets.map((assetId) => (
                    <Tag key={assetId} style={{ marginTop: '4px' }}>
                      <LinkOutlined /> {truncateHash(assetId, 8, 4)}
                    </Tag>
                  ))}
                </div>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Deployed By">{selectedContract.deployedBy}</Descriptions.Item>
            <Descriptions.Item label="Deployed At">
              {formatDateTime(selectedContract.deployedAt)}
            </Descriptions.Item>
            {selectedContract.metadata && (
              <Descriptions.Item label="Metadata">
                <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                  {JSON.stringify(selectedContract.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SmartContractRegistryView;
