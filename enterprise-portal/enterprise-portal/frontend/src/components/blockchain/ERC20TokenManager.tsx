import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  WalletOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface ERC20Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  balance?: string;
  chainId?: string;
}

interface TokenBalance {
  tokenAddress: string;
  walletAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
}

const ERC20TokenManager: React.FC = () => {
  const [tokens, setTokens] = useState<ERC20Token[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedChain] = useState('ethereum');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedToken, setSelectedToken] = useState<ERC20Token | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  // Fetch ERC20 tokens
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/erc20/tokens?chain=${selectedChain}`
      );
      setTokens(response.data || []);
      message.success('Tokens loaded successfully');
    } catch (error) {
      message.error('Failed to load tokens');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token balance
  const fetchTokenBalance = async (token: ERC20Token, wallet: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v11/blockchain/erc20/balance`,
        {
          contractAddress: token.address,
          walletAddress: wallet,
          chainId: selectedChain,
        }
      );
      message.success(`Balance: ${response.data.balance} ${token.symbol}`);
      setBalances([...balances, response.data]);
    } catch (error) {
      message.error('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  // Query token details
  const queryTokenDetails = async (tokenAddress: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/erc20/${tokenAddress}?chain=${selectedChain}`
      );
      const token = response.data;
      setSelectedToken(token);
      form.setFieldsValue({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
      });
    } catch (error) {
      message.error('Failed to query token details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [selectedChain]);

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text: string) => (
        <Tooltip title={text}>
          <code style={{ fontSize: '12px' }}>
            {text.substring(0, 10)}...{text.substring(text.length - 8)}
          </code>
        </Tooltip>
      ),
    },
    {
      title: 'Decimals',
      dataIndex: 'decimals',
      key: 'decimals',
      align: 'center' as const,
    },
    {
      title: 'Total Supply',
      dataIndex: 'totalSupply',
      key: 'totalSupply',
      render: (text: string) => (
        <span>{parseFloat(text).toLocaleString()}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ERC20Token) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => queryTokenDetails(record.address)}
          >
            Details
          </Button>
          <Button
            type="default"
            size="small"
            icon={<WalletOutlined />}
            onClick={() => {
              setSelectedToken(record);
              setIsModalVisible(true);
            }}
          >
            Balance
          </Button>
        </Space>
      ),
    },
  ];

  const balanceColumns = [
    {
      title: 'Token Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Wallet Address',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
      render: (text: string) => (
        <code style={{ fontSize: '12px' }}>
          {text.substring(0, 10)}...{text.substring(text.length - 8)}
        </code>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (text: string, record: TokenBalance) => (
        <strong>
          {(parseFloat(text) / Math.pow(10, record.decimals)).toFixed(4)}
        </strong>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Badge status="success" text="Active" />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>ERC20 Token Manager</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Search tokens..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '200px' }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={fetchTokens}>
              Refresh
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Tokens"
                value={tokens.length}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Tracked Balances"
                value={balances.length}
                prefix={<WalletOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Network"
                value={selectedChain.toUpperCase()}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
          <Divider />
          <Table
            columns={columns}
            dataSource={tokens.filter(
              (token) =>
                token.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
                token.name.toLowerCase().includes(searchText.toLowerCase())
            )}
            rowKey="address"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Spin>
      </Card>

      {/* Balance Query Modal */}
      <Modal
        title={`Query Balance - ${selectedToken?.symbol}`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Wallet Address" required>
            <Input
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </Form.Item>
          <Button
            type="primary"
            block
            loading={loading}
            onClick={() => {
              if (selectedToken && walletAddress) {
                fetchTokenBalance(selectedToken, walletAddress);
              } else {
                message.error('Please fill all fields');
              }
            }}
          >
            Query Balance
          </Button>
        </Form>
      </Modal>

      {/* Token Balances */}
      {balances.length > 0 && (
        <Card
          title="Token Balances"
          style={{ marginTop: '24px' }}
          extra={
            <Button
              danger
              size="small"
              onClick={() => setBalances([])}
              icon={<DeleteOutlined />}
            >
              Clear
            </Button>
          }
        >
          <Table
            columns={balanceColumns}
            dataSource={balances}
            rowKey={(record) => `${record.tokenAddress}-${record.walletAddress}`}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Card>
      )}

      {/* Token Details Modal */}
      {selectedToken && (
        <Modal
          title={`Token Details - ${selectedToken.name}`}
          visible={!!selectedToken}
          onCancel={() => setSelectedToken(null)}
          footer={null}
        >
          <Form layout="vertical">
            <Form.Item label="Token Address">
              <Input value={selectedToken.address} readOnly />
            </Form.Item>
            <Form.Item label="Symbol">
              <Input value={selectedToken.symbol} readOnly />
            </Form.Item>
            <Form.Item label="Name">
              <Input value={selectedToken.name} readOnly />
            </Form.Item>
            <Form.Item label="Decimals">
              <Input value={selectedToken.decimals} readOnly />
            </Form.Item>
            <Form.Item label="Total Supply">
              <Input
                value={parseFloat(selectedToken.totalSupply).toLocaleString()}
                readOnly
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ERC20TokenManager;
