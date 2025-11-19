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
  Row,
  Col,
  Statistic,
  Select,
  Tabs,
  Alert,
} from 'antd';
import {
  SendOutlined,
  WalletOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface SolanaAccount {
  address: string;
  lamports: number;
  executable: boolean;
  owner: string;
  rentEpoch: number;
}

interface SolanaTransaction {
  signature: string;
  slot: number;
  confirmed: boolean;
  err?: string;
}

const SolanaManager: React.FC = () => {
  const [account, setAccount] = useState<SolanaAccount | null>(null);
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('mainnet');
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [form] = Form.useForm();

  const clusters = [
    { label: 'Mainnet Beta', value: 'mainnet' },
    { label: 'Testnet', value: 'testnet' },
    { label: 'Devnet', value: 'devnet' },
  ];

  // Fetch account info
  const fetchAccount = async (publicKey: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/solana/account/${publicKey}`,
        { params: { cluster: selectedCluster } }
      );
      setAccount(response.data);
      message.success('Account loaded');
    } catch (error) {
      message.error('Failed to fetch account');
    } finally {
      setLoading(false);
    }
  };

  // Submit transaction
  const submitTransaction = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v11/blockchain/solana/send-transaction`,
        {
          fromPublicKey: account?.address,
          toPublicKey: values.toPublicKey,
          lamports: values.lamports,
          cluster: selectedCluster,
        }
      );
      message.success(`Transaction sent: ${response.data.signature}`);
      setTransactions([response.data, ...transactions]);
      form.resetFields();
    } catch (error) {
      message.error('Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  const txColumns = [
    {
      title: 'Signature',
      dataIndex: 'signature',
      key: 'signature',
      render: (text: string) => (
        <code style={{ fontSize: '11px' }}>
          {text.substring(0, 16)}...{text.substring(text.length - 16)}
        </code>
      ),
    },
    {
      title: 'Slot',
      dataIndex: 'slot',
      key: 'slot',
    },
    {
      title: 'Status',
      dataIndex: 'confirmed',
      key: 'confirmed',
      render: (confirmed: boolean, record: SolanaTransaction) => (
        <Badge
          status={confirmed ? 'success' : record.err ? 'error' : 'processing'}
          text={confirmed ? 'Confirmed' : record.err ? 'Failed' : 'Pending'}
        />
      ),
    },
  ];

  const solBalance = account ? (account.lamports / 1e9).toFixed(4) : '0';

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>Solana Manager</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedCluster}
              onChange={setSelectedCluster}
              style={{ width: '140px' }}
              options={clusters}
            />
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => setIsAccountModalVisible(true)}
            >
              Connect
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
                        description={`${account.address.substring(0, 10)}...${account.address.substring(account.address.length - 10)}`}
                        type="success"
                        closable
                        style={{ marginBottom: '16px' }}
                      />
                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Balance (SOL)"
                            value={solBalance}
                            valueStyle={{ color: '#14f195' }}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Rent Epoch"
                            value={account.rentEpoch}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Executable"
                            value={account.executable ? 'Yes' : 'No'}
                            valueStyle={{
                              color: account.executable ? '#52c41a' : '#faad14',
                            }}
                          />
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: '2',
                  label: 'Send SOL',
                  children: (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={submitTransaction}
                    >
                      <Form.Item
                        label="Recipient Public Key"
                        name="toPublicKey"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Enter Solana address" />
                      </Form.Item>

                      <Form.Item
                        label="Amount (SOL)"
                        name="lamports"
                        rules={[{ required: true }]}
                      >
                        <Input
                          type="number"
                          placeholder="0.1"
                          step="0.001"
                        />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        icon={<SendOutlined />}
                      >
                        Send Transaction
                      </Button>
                    </Form>
                  ),
                },
                {
                  key: '3',
                  label: 'Transactions',
                  children: (
                    transactions.length > 0 ? (
                      <Table
                        columns={txColumns}
                        dataSource={transactions}
                        rowKey="signature"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>No transactions yet</p>
                      </div>
                    )
                  ),
                },
              ]}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Connect a Solana wallet to get started</p>
            </div>
          )}
        </Spin>
      </Card>

      {/* Account Connection Modal */}
      <Modal
        title="Connect Solana Account"
        visible={isAccountModalVisible}
        onCancel={() => setIsAccountModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Public Key" required>
            <Input
              placeholder="Enter your Solana public key"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Form.Item>
          <Button
            type="primary"
            block
            loading={loading}
            onClick={() => {
              if (address) {
                fetchAccount(address);
              } else {
                message.error('Please enter a public key');
              }
            }}
          >
            Connect Account
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SolanaManager;
