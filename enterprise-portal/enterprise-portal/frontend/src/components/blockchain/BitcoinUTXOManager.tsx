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
  InputNumber,
  Select,
  Divider,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  CalculatorOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface UTXO {
  txid: string;
  vout: number;
  amount: number;
  address: string;
  confirmations: number;
  blockTime: number;
  spendable: boolean;
}

interface FeeEstimate {
  txSize: number;
  feeRate: number;
  totalFee: number;
  estimatedTime: string;
}

const BitcoinUTXOManager: React.FC = () => {
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [feeEstimates, setFeeEstimates] = useState<FeeEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('bitcoin');
  const [isUTXOModalVisible, setIsUTXOModalVisible] = useState(false);

  const chains = [
    { label: 'Bitcoin Mainnet', value: 'bitcoin' },
    { label: 'Bitcoin Testnet', value: 'bitcoin-testnet' },
    { label: 'Litecoin', value: 'litecoin' },
    { label: 'Dogecoin', value: 'dogecoin' },
  ];

  // Fetch UTXOs for address
  const fetchUTXOs = async (address: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v11/blockchain/utxo/address/${address}`,
        { params: { chain: selectedChain } }
      );
      setUtxos(response.data || []);
      message.success(`Found ${response.data?.length || 0} UTXOs`);
    } catch (error) {
      message.error('Failed to fetch UTXOs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Estimate transaction fee
  const estimateFee = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v11/blockchain/utxo/estimate-fee`,
        {
          inputCount: values.inputCount,
          outputCount: values.outputCount,
          isSegWit: values.isSegWit,
          feeRates: values.feeRates || ['low', 'medium', 'high'],
          chain: selectedChain,
        }
      );
      setFeeEstimates(response.data || []);
      message.success('Fee estimates calculated');
    } catch (error) {
      message.error('Failed to estimate fees');
    } finally {
      setLoading(false);
    }
  };

  // Validate address format
  const validateAddress = async (address: string) => {
    try {
      const response = await axios.get(
        `/api/v11/blockchain/utxo/validate-address/${address}`,
        { params: { chain: selectedChain } }
      );
      if (response.data.valid) {
        message.success(
          `Valid ${response.data.addressType} address`
        );
      } else {
        message.error('Invalid address format');
      }
      return response.data;
    } catch (error) {
      message.error('Address validation failed');
      return null;
    }
  };

  const utxoColumns = [
    {
      title: 'TXID',
      dataIndex: 'txid',
      key: 'txid',
      width: 200,
      render: (text: string) => (
        <code style={{ fontSize: '11px' }}>
          {text.substring(0, 16)}...{text.substring(text.length - 16)}
        </code>
      ),
    },
    {
      title: 'VOUT',
      dataIndex: 'vout',
      key: 'vout',
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Amount (BTC)',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text: number) => (text / 100000000).toFixed(8),
      align: 'right' as const,
    },
    {
      title: 'Confirmations',
      dataIndex: 'confirmations',
      key: 'confirmations',
      width: 120,
      render: (conf: number) => (
        <Badge
          count={conf}
          style={{
            backgroundColor: conf > 6 ? '#52c41a' : '#faad14',
          }}
        />
      ),
    },
    {
      title: 'Spendable',
      dataIndex: 'spendable',
      key: 'spendable',
      width: 100,
      render: (spendable: boolean) => (
        <Tag color={spendable ? 'green' : 'red'}>
          {spendable ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Age (blocks)',
      dataIndex: 'blockTime',
      key: 'blockTime',
      width: 100,
      render: (time: number) => Math.floor((Date.now() - time) / 600000),
    },
  ];

  const feeColumns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (text: string) => (
        <Tag color={text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'blue'}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Fee Rate (sat/byte)',
      dataIndex: 'feeRate',
      key: 'feeRate',
    },
    {
      title: 'Total Fee',
      dataIndex: 'totalFee',
      key: 'totalFee',
      render: (text: number) => `${text} satoshis`,
    },
    {
      title: 'Est. Time',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
    },
  ];

  const totalValue = utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
  const spendableCount = utxos.filter((u) => u.spendable).length;

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <WalletOutlined />
            <span>Bitcoin UTXO Manager</span>
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
              icon={<PlusOutlined />}
              onClick={() => setIsUTXOModalVisible(true)}
            >
              Query UTXOs
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'UTXO List',
                children: (
                  <>
                    <Row gutter={16} style={{ marginBottom: '24px' }}>
                      <Col xs={24} sm={6}>
                        <Statistic
                          title="Total UTXOs"
                          value={utxos.length}
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <Statistic
                          title="Spendable"
                          value={spendableCount}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <Statistic
                          title="Total Value (BTC)"
                          value={(totalValue / 100000000).toFixed(4)}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={24} sm={6}>
                        <Statistic
                          title="Avg. Age"
                          value={Math.floor(
                            utxos.reduce((sum, u) => sum + u.confirmations, 0) /
                              (utxos.length || 1)
                          )}
                          suffix="blocks"
                        />
                      </Col>
                    </Row>
                    <Divider />
                    {utxos.length > 0 ? (
                      <Table
                        columns={utxoColumns}
                        dataSource={utxos}
                        rowKey={(record) => `${record.txid}-${record.vout}`}
                        pagination={{ pageSize: 10 }}
                        size="small"
                        scroll={{ x: 1000 }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>No UTXOs loaded. Query an address above.</p>
                      </div>
                    )}
                  </>
                ),
              },
              {
                key: '2',
                label: 'Fee Estimation',
                children: (
                  <>
                    <Form layout="vertical" onFinish={estimateFee}>
                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Input Count"
                            name="inputCount"
                            rules={[{ required: true }]}
                          >
                            <InputNumber min={1} placeholder="2" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            label="Output Count"
                            name="outputCount"
                            rules={[{ required: true }]}
                          >
                            <InputNumber min={1} placeholder="2" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Form.Item label="Use SegWit?" name="isSegWit">
                            <Select
                              options={[
                                { label: 'Yes', value: true },
                                { label: 'No', value: false },
                              ]}
                              placeholder="Select"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button
                        type="primary"
                        icon={<CalculatorOutlined />}
                        htmlType="submit"
                        loading={loading}
                      >
                        Calculate Fees
                      </Button>
                    </Form>

                    {feeEstimates.length > 0 && (
                      <>
                        <Divider />
                        <Table
                          columns={feeColumns}
                          dataSource={feeEstimates}
                          rowKey="priority"
                          pagination={false}
                          size="small"
                        />
                      </>
                    )}
                  </>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      {/* UTXO Query Modal */}
      <Modal
        title="Query UTXOs for Address"
        visible={isUTXOModalVisible}
        onCancel={() => setIsUTXOModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Wallet Address" required>
            <Input
              placeholder="1A1z7agoat..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              block
              loading={loading}
              onClick={() => {
                if (walletAddress) {
                  fetchUTXOs(walletAddress);
                } else {
                  message.error('Please enter an address');
                }
              }}
            >
              Query UTXOs
            </Button>
            <Button
              onClick={() => validateAddress(walletAddress)}
              loading={loading}
            >
              Validate Address
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default BitcoinUTXOManager;
