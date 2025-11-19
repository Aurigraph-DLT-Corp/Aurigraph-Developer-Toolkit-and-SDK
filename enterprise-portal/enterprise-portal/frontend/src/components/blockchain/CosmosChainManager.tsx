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
  Steps,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  SendOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface AccountBalance {
  denom: string;
  amount: string;
}

interface CosmosAccount {
  address: string;
  sequence: number;
  accountNumber: string;
  balances: AccountBalance[];
}

interface TransactionStatus {
  txHash: string;
  height: number;
  confirmed: boolean;
  code: number;
  logs: string;
  gasUsed: string;
  gasWanted: string;
}

const CosmosChainManager: React.FC = () => {
  const [account, setAccount] = useState<CosmosAccount | null>(null);
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('cosmoshub');
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [txStep, setTxStep] = useState(0);

  const chains = [
    { label: 'Cosmos Hub', value: 'cosmoshub' },
    { label: 'Osmosis', value: 'osmosis' },
    { label: 'Akash', value: 'akash' },
    { label: 'Juno', value: 'juno' },
    { label: 'Stargaze', value: 'stargaze' },
  ];

  const denominationInfo: Record<string, { symbol: string; decimals: number }> = {
    uatom: { symbol: 'ATOM', decimals: 6 },
    uosmo: { symbol: 'OSMO', decimals: 6 },
    uakt: { symbol: 'AKT', decimals: 6 },
    ujuno: { symbol: 'JUNO', decimals: 6 },
    ustars: { symbol: 'STARS', decimals: 6 },
  };

  // Fetch account information
  const fetchAccount = async (cosmosAddress: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/cosmos/account/${cosmosAddress}`,
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

  // Submit transaction
  const submitTransaction = async (values: any) => {
    setLoading(true);
    setTxStep(1);
    try {
      // Step 1: Validate transaction
      const validateResp = await axios.post(
        `/api/v11/blockchain/cosmos/validate-tx`,
        {
          fromAddress: account?.address,
          toAddress: values.toAddress,
          amount: values.amount,
          denom: values.denom,
          chain: selectedChain,
        }
      );

      if (validateResp.data.valid) {
        setTxStep(2);

        // Step 2: Submit transaction
        const submitResp = await axios.post(
          `/api/v11/blockchain/cosmos/submit-tx`,
          {
            tx: validateResp.data.txJson,
            chain: selectedChain,
          }
        );

        setTxStep(3);
        message.success(`Transaction submitted: ${submitResp.data.txHash}`);
        setTransactions([submitResp.data, ...transactions]);
        form.resetFields();
      }
    } catch (error) {
      message.error('Transaction submission failed');
      setTxStep(0);
    } finally {
      setLoading(false);
    }
  };

  const txColumns = [
    {
      title: 'TX Hash',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (text: string) => (
        <code style={{ fontSize: '11px' }}>
          {text.substring(0, 16)}...{text.substring(text.length - 16)}
        </code>
      ),
    },
    {
      title: 'Height',
      dataIndex: 'height',
      key: 'height',
    },
    {
      title: 'Status',
      dataIndex: 'confirmed',
      key: 'confirmed',
      render: (confirmed: boolean) => (
        <Badge
          status={confirmed ? 'success' : 'processing'}
          text={confirmed ? 'Confirmed' : 'Pending'}
        />
      ),
    },
    {
      title: 'Gas',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      render: (used: string, record: TransactionStatus) => (
        `${used} / ${record.gasWanted}`
      ),
    },
  ];

  const formatBalance = (amount: string, denom: string) => {
    const info = denominationInfo[denom];
    if (!info) return amount;
    const formatted = (parseFloat(amount) / Math.pow(10, info.decimals)).toFixed(4);
    return `${formatted} ${info.symbol}`;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>Cosmos Chain Manager</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedChain}
              onChange={setSelectedChain}
              style={{ width: '150px' }}
              options={chains}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => setIsAccountModalVisible(true)}
            >
              Query Account
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
                  label: 'Account Details',
                  children: (
                    <>
                      <Alert
                        message="Account Information"
                        description={`Address: ${account.address}`}
                        type="info"
                        closable
                        style={{ marginBottom: '16px' }}
                      />
                      <Row gutter={16} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Sequence #"
                            value={account.sequence}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Account #"
                            value={account.accountNumber}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Total Balances"
                            value={account.balances.length}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      <h3>Balances</h3>
                      <Table
                        dataSource={account.balances}
                        columns={[
                          {
                            title: 'Denomination',
                            dataIndex: 'denom',
                            key: 'denom',
                            render: (denom: string) => (
                              <Tag>{denom.toUpperCase()}</Tag>
                            ),
                          },
                          {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount: string, record: AccountBalance) =>
                              formatBalance(amount, record.denom),
                          },
                        ]}
                        rowKey="denom"
                        pagination={false}
                        size="small"
                      />
                    </>
                  ),
                },
                {
                  key: '2',
                  label: 'Send Transaction',
                  children: (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={submitTransaction}
                    >
                      <Form.Item
                        label="Recipient Address"
                        name="toAddress"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="cosmos1..." />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Amount"
                            name="amount"
                            rules={[{ required: true }]}
                          >
                            <Input type="number" placeholder="1.5" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label="Denomination"
                            name="denom"
                            rules={[{ required: true }]}
                          >
                            <Select
                              placeholder="Select token"
                              options={account.balances.map((b) => ({
                                label: b.denom.toUpperCase(),
                                value: b.denom,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {txStep > 0 && (
                        <>
                          <Divider />
                          <Steps
                            current={txStep - 1}
                            items={[
                              { title: 'Validate', description: 'Checking transaction' },
                              { title: 'Submit', description: 'Broadcasting to network' },
                              { title: 'Complete', description: 'Transaction sent' },
                            ]}
                          />
                        </>
                      )}

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
                        rowKey="txHash"
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>No transactions</p>
                      </div>
                    )
                  ),
                },
              ]}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Select a chain and query an account to get started</p>
            </div>
          )}
        </Spin>
      </Card>

      {/* Account Query Modal */}
      <Modal
        title="Query Cosmos Account"
        visible={isAccountModalVisible}
        onCancel={() => setIsAccountModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Cosmos Address" required>
            <Input
              placeholder="cosmos1..."
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
                message.error('Please enter an address');
              }
            }}
          >
            Query Account
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CosmosChainManager;
