import React, { useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Spin,
  Space,
  Badge,
  Tag,
  Row,
  Col,
  Statistic,
  Select,
  Divider,
  Tabs,
  Alert,
} from 'antd';
import {
  SendOutlined,
  WalletOutlined,
  LinkOutlined,
  FileTextOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface Balance {
  free: string;
  reserved: string;
  frozen: string;
}

interface SubstrateAccount {
  address: string;
  nonce: number;
  balance: Balance;
  chainId?: string;
}

interface ExtrinsicStatus {
  hash: string;
  blockNumber: number;
  timestamp: number;
  status: string;
  palletName: string;
  functionName: string;
  dispatchClass: string;
  events: string[];
}

interface RuntimeMetadata {
  version: number;
  palletCount: number;
  pallets: Array<{
    name: string;
    index: number;
    functionCount: number;
  }>;
}

const SubstrateManager: React.FC = () => {
  const [account, setAccount] = useState<SubstrateAccount | null>(null);
  const [extrinsics, setExtrinsics] = useState<ExtrinsicStatus[]>([]);
  const [runtimeMetadata, setRuntimeMetadata] = useState<RuntimeMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('polkadot');
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isMetadataModalVisible, setIsMetadataModalVisible] = useState(false);
  const [form] = Form.useForm();

  const chains = [
    { label: 'Polkadot', value: 'polkadot' },
    { label: 'Kusama', value: 'kusama' },
    { label: 'Acala', value: 'acala' },
    { label: 'Moonbeam', value: 'moonbeam' },
  ];

  // Fetch account information
  const fetchAccount = async (substrateAddress: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/substrate/account/${substrateAddress}`,
        { params: { chain: selectedChain } }
      );
      setAccount(response.data);
      message.success('Account loaded successfully');
      setIsAccountModalVisible(false);
    } catch (error) {
      message.error('Failed to fetch account');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Submit extrinsic transaction
  const submitExtrinsic = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v11/blockchain/substrate/submit-tx`,
        {
          senderAddress: account?.address,
          recipientAddress: values.recipientAddress,
          amount: values.amount,
          palletName: values.palletName,
          functionName: values.functionName,
          chain: selectedChain,
        }
      );

      message.success(`Extrinsic submitted: ${response.data.hash}`);
      setExtrinsics([response.data, ...extrinsics]);
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit extrinsic');
    } finally {
      setLoading(false);
    }
  };

  // Query runtime metadata
  const queryRuntimeMetadata = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/substrate/runtime-metadata`,
        { params: { chain: selectedChain } }
      );
      setRuntimeMetadata(response.data);
      setIsMetadataModalVisible(true);
      message.success('Runtime metadata loaded');
    } catch (error) {
      message.error('Failed to fetch runtime metadata');
    } finally {
      setLoading(false);
    }
  };

  // Validate SS58 address format
  const validateSS58Address = async (substrateAddress: string) => {
    try {
      const response = await axios.get(
        `/api/v11/blockchain/substrate/validate-address/${substrateAddress}`,
        { params: { chain: selectedChain } }
      );
      if (response.data.valid) {
        message.success(
          `Valid SS58 address for ${response.data.chainName} (prefix: ${response.data.prefix})`
        );
      } else {
        message.error('Invalid SS58 address format');
      }
      return response.data;
    } catch (error) {
      message.error('Address validation failed');
      return null;
    }
  };

  const extrinsicColumns = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (text: string) => (
        <code style={{ fontSize: '11px' }}>
          {text.substring(0, 16)}...{text.substring(text.length - 16)}
        </code>
      ),
    },
    {
      title: 'Pallet',
      dataIndex: 'palletName',
      key: 'palletName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Function',
      dataIndex: 'functionName',
      key: 'functionName',
      render: (text: string) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: 'Block #',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'Finalized' ? 'success' : 'processing'}
          text={status}
        />
      ),
    },
  ];

  const formatBalance = (amount: string) => {
    return (parseFloat(amount) / Math.pow(10, 10)).toFixed(4);
  };

  const totalBalance = account
    ? parseFloat(account.balance.free) +
      parseFloat(account.balance.reserved) +
      parseFloat(account.balance.frozen)
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>Substrate Manager</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedChain}
              onChange={setSelectedChain}
              style={{ width: '140px' }}
              options={chains}
            />
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => setIsAccountModalVisible(true)}
            >
              Connect
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={queryRuntimeMetadata}
            >
              Metadata
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {account ? (
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: '1',
                  label: 'Account',
                  children: (
                    <>
                      <Alert
                        message="Connected Account"
                        description={`${account.address.substring(0, 10)}...${account.address.substring(
                          account.address.length - 10
                        )}`}
                        type="success"
                        closable
                        style={{ marginBottom: '16px' }}
                      />
                      <Row gutter={16} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={6}>
                          <Statistic
                            title="Free Balance"
                            value={formatBalance(account.balance.free)}
                            suffix="DOT"
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col xs={24} sm={6}>
                          <Statistic
                            title="Reserved"
                            value={formatBalance(account.balance.reserved)}
                            suffix="DOT"
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Col>
                        <Col xs={24} sm={6}>
                          <Statistic
                            title="Frozen"
                            value={formatBalance(account.balance.frozen)}
                            suffix="DOT"
                            valueStyle={{ color: '#f5222d' }}
                          />
                        </Col>
                        <Col xs={24} sm={6}>
                          <Statistic
                            title="Total"
                            value={formatBalance(totalBalance.toString())}
                            suffix="DOT"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Statistic
                            title="Account Nonce"
                            value={account.nonce}
                            prefix={<BgColorsOutlined />}
                          />
                        </Col>
                        <Col xs={24} sm={12}>
                          <Statistic
                            title="Network"
                            value={selectedChain.toUpperCase()}
                            valueStyle={{ fontSize: '14px' }}
                          />
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: '2',
                  label: 'Send Extrinsic',
                  children: (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={submitExtrinsic}
                    >
                      <Form.Item
                        label="Recipient Address"
                        name="recipientAddress"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="1XXXXXX..." />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Amount (planck)"
                            name="amount"
                            rules={[{ required: true }]}
                          >
                            <Input type="number" placeholder="1000000000" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Pallet"
                            name="palletName"
                            rules={[{ required: true }]}
                          >
                            <Select
                              placeholder="e.g., Balances"
                              options={[
                                { label: 'Balances', value: 'Balances' },
                                { label: 'Utility', value: 'Utility' },
                                { label: 'Democracy', value: 'Democracy' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Function"
                            name="functionName"
                            rules={[{ required: true }]}
                          >
                            <Select
                              placeholder="e.g., transfer"
                              options={[
                                { label: 'transfer', value: 'transfer' },
                                { label: 'transfer_keep_alive', value: 'transfer_keep_alive' },
                                { label: 'batch', value: 'batch' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        icon={<SendOutlined />}
                      >
                        Submit Extrinsic
                      </Button>
                    </Form>
                  ),
                },
                {
                  key: '3',
                  label: 'Extrinsics',
                  children: (
                    extrinsics.length > 0 ? (
                      <Table
                        columns={extrinsicColumns}
                        dataSource={extrinsics}
                        rowKey="hash"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>No extrinsics submitted</p>
                      </div>
                    )
                  ),
                },
              ]}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Connect a Substrate account to get started</p>
            </div>
          )}
        </Spin>
      </Card>

      {/* Account Connection Modal */}
      <Modal
        title="Connect Substrate Account"
        visible={isAccountModalVisible}
        onCancel={() => setIsAccountModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Substrate Address" required>
            <Input
              placeholder="1XXXXXX..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} direction="vertical">
            <Button
              type="primary"
              block
              loading={loading}
              onClick={() => {
                if (address) {
                  fetchAccount(address);
                } else {
                  message.error('Please enter an address');
                }
              }}
            >
              Connect Account
            </Button>
            <Button
              block
              onClick={() => validateSS58Address(address)}
              loading={loading}
            >
              Validate Address
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Runtime Metadata Modal */}
      {runtimeMetadata && (
        <Modal
          title="Runtime Metadata"
          visible={isMetadataModalVisible}
          onCancel={() => setIsMetadataModalVisible(false)}
          footer={null}
          width={700}
        >
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Metadata Version"
                value={runtimeMetadata.version}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Pallet Count"
                value={runtimeMetadata.palletCount}
              />
            </Col>
          </Row>
          <Divider />
          <h3>Pallets</h3>
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (text: string) => <Tag color="blue">{text}</Tag>,
              },
              {
                title: 'Index',
                dataIndex: 'index',
                key: 'index',
                width: 80,
              },
              {
                title: 'Functions',
                dataIndex: 'functionCount',
                key: 'functionCount',
                width: 100,
              },
            ]}
            dataSource={runtimeMetadata.pallets}
            rowKey="name"
            pagination={false}
            size="small"
          />
        </Modal>
      )}
    </div>
  );
};

export default SubstrateManager;
