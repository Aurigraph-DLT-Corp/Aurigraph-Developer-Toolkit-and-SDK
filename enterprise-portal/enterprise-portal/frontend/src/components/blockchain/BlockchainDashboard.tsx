/**
 * Blockchain Dashboard Component
 *
 * Central hub for accessing all blockchain management features across
 * different blockchain networks and protocols.
 *
 * Features:
 * - Overview of all blockchain managers
 * - Quick access to each manager
 * - Network status and statistics
 * - Feature discovery
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tabs,
  Tag,
  Statistic,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  DollarOutlined,
  FilterOutlined,
  BgColorsOutlined,
  LinkOutlined,
  DatabaseOutlined,
  BlockOutlined,
} from '@ant-design/icons';
import ERC20TokenManager from './ERC20TokenManager';
import EventFilterExplorer from './EventFilterExplorer';
import BitcoinUTXOManager from './BitcoinUTXOManager';
import CosmosChainManager from './CosmosChainManager';
import SolanaManager from './SolanaManager';
import SubstrateManager from './SubstrateManager';
import { BLOCKCHAIN_NETWORKS } from './index';

interface ManagerCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  chains: string[];
  features: string[];
}

const BlockchainDashboard: React.FC = () => {
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  const managers: ManagerCard[] = [
    {
      id: 'erc20',
      name: 'ERC20 Token Manager',
      description: 'Manage ERC20 tokens across EVM-compatible networks',
      icon: <DollarOutlined />,
      component: ERC20TokenManager,
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'],
      features: ['token-list', 'balance-query', 'token-details'],
    },
    {
      id: 'events',
      name: 'Event Filter & Explorer',
      description: 'Query and filter blockchain events with advanced filtering',
      icon: <FilterOutlined />,
      component: EventFilterExplorer,
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
      features: ['event-filtering', 'historical-events', 'event-stats'],
    },
    {
      id: 'utxo',
      name: 'Bitcoin UTXO Manager',
      description: 'Manage UTXOs for Bitcoin, Litecoin, and other UTXO chains',
      icon: <BlockOutlined />,
      component: BitcoinUTXOManager,
      chains: ['bitcoin', 'bitcoin-testnet', 'litecoin', 'dogecoin'],
      features: ['utxo-query', 'fee-estimation', 'address-validation'],
    },
    {
      id: 'cosmos',
      name: 'Cosmos Chain Manager',
      description: 'Manage accounts and transactions across Cosmos ecosystem',
      icon: <DatabaseOutlined />,
      component: CosmosChainManager,
      chains: ['cosmoshub', 'osmosis', 'akash', 'juno', 'stargaze'],
      features: ['account-query', 'transaction-send', 'denomination-handling'],
    },
    {
      id: 'solana',
      name: 'Solana Manager',
      description: 'Manage Solana accounts and SOL transfers',
      icon: <LinkOutlined />,
      component: SolanaManager,
      chains: ['solana-mainnet', 'solana-testnet', 'solana-devnet'],
      features: ['account-connection', 'sol-transfer', 'transaction-tracking'],
    },
    {
      id: 'substrate',
      name: 'Substrate Manager',
      description: 'Manage accounts and extrinsics on Substrate-based chains',
      icon: <BgColorsOutlined />,
      component: SubstrateManager,
      chains: ['polkadot', 'kusama', 'acala', 'moonbeam'],
      features: ['account-query', 'extrinsic-submit', 'runtime-metadata'],
    },
  ];

  const selectedManagerData = managers.find((m) => m.id === selectedManager);
  const SelectedComponent = selectedManagerData?.component;

  // Network statistics
  const networkStats = {
    total: Object.keys(BLOCKCHAIN_NETWORKS).length,
    evmNetworks: Object.values(BLOCKCHAIN_NETWORKS).filter((n) => n.type === 'evm').length,
    utxoNetworks: Object.values(BLOCKCHAIN_NETWORKS).filter((n) => n.type === 'utxo').length,
    cosmosNetworks: Object.values(BLOCKCHAIN_NETWORKS).filter((n) => n.type === 'cosmos').length,
    solanaNetworks: Object.values(BLOCKCHAIN_NETWORKS).filter((n) => n.type === 'solana').length,
    substrateNetworks: Object.values(BLOCKCHAIN_NETWORKS).filter((n) => n.type === 'substrate')
      .length,
  };

  if (selectedManagerData && SelectedComponent) {
    return (
      <div style={{ padding: '24px' }}>
        <Button
          type="default"
          onClick={() => setSelectedManager(null)}
          style={{ marginBottom: '16px' }}
        >
          ← Back to Dashboard
        </Button>
        <SelectedComponent />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Blockchain Dashboard</span>}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Supported Networks"
              value={networkStats.total}
              prefix={<BlockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Ethereum, Polygon, Arbitrum, Optimism, BSC">
              <Statistic
                title="EVM Networks"
                value={networkStats.evmNetworks}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Bitcoin, Litecoin, Dogecoin">
              <Statistic
                title="UTXO Networks"
                value={networkStats.utxoNetworks}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Cosmos Hub, Osmosis, Akash, Juno, Stargaze">
              <Statistic
                title="Cosmos Networks"
                value={networkStats.cosmosNetworks}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Mainnet, Testnet, Devnet">
              <Statistic
                title="Solana Clusters"
                value={networkStats.solanaNetworks}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Tooltip title="Polkadot, Kusama, Acala, Moonbeam">
              <Statistic
                title="Substrate Chains"
                value={networkStats.substrateNetworks}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
        </Row>
        <Divider />
        <p style={{ fontSize: '14px', color: '#666' }}>
          Phase 11 SDK Integration: Multi-blockchain RPC support for EVM, UTXO, Cosmos, Solana, and
          Substrate ecosystems.
        </p>
      </Card>

      <div style={{ marginBottom: '24px' }}>
        <h2>Blockchain Managers</h2>
        <Row gutter={[16, 16]}>
          {managers.map((manager) => (
            <Col key={manager.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                style={{ height: '100%', cursor: 'pointer' }}
                onClick={() => setSelectedManager(manager.id)}
                cover={
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '40px',
                    }}
                  >
                    {manager.icon}
                  </div>
                }
              >
                <Card.Meta
                  title={manager.name}
                  description={manager.description}
                  style={{ marginBottom: '12px' }}
                />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>Networks:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {manager.chains.slice(0, 3).map((chain) => (
                        <Tag key={chain} color="blue" style={{ marginBottom: '4px' }}>
                          {chain}
                        </Tag>
                      ))}
                      {manager.chains.length > 3 && (
                        <Tag style={{ marginBottom: '4px' }}>+{manager.chains.length - 3}</Tag>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Features:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {manager.features.map((feature) => (
                        <Badge
                          key={feature}
                          status="success"
                          text={feature}
                          style={{ display: 'block', marginBottom: '4px' }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    block
                    onClick={() => setSelectedManager(manager.id)}
                    style={{ marginTop: '12px' }}
                  >
                    Open Manager
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Card title="Supported Blockchain Ecosystems" style={{ marginTop: '24px' }}>
        <Tabs
          items={[
            {
              key: 'evm',
              label: 'EVM Networks',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    {Object.entries(BLOCKCHAIN_NETWORKS)
                      .filter(([, net]) => net.type === 'evm')
                      .map(([key, network]) => (
                        <Col key={key} xs={24} sm={12} md={6}>
                          <Card size="small">
                            <h4>{network.name}</h4>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              Chain ID: {(network as any).chainId}
                            </p>
                            <a href={network.blockExplorer} target="_blank" rel="noreferrer">
                              View on Explorer
                            </a>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'utxo',
              label: 'UTXO Networks',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    {Object.entries(BLOCKCHAIN_NETWORKS)
                      .filter(([, net]) => net.type === 'utxo')
                      .map(([key, network]) => (
                        <Col key={key} xs={24} sm={12} md={6}>
                          <Card size="small">
                            <h4>{network.name}</h4>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              Type: {(network as any).network}
                            </p>
                            <a href={network.blockExplorer} target="_blank" rel="noreferrer">
                              View on Explorer
                            </a>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'cosmos',
              label: 'Cosmos Networks',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    {Object.entries(BLOCKCHAIN_NETWORKS)
                      .filter(([, net]) => net.type === 'cosmos')
                      .map(([key, network]) => (
                        <Col key={key} xs={24} sm={12} md={6}>
                          <Card size="small">
                            <h4>{network.name}</h4>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              Chain: {(network as any).chainId}
                            </p>
                            <a href={network.blockExplorer} target="_blank" rel="noreferrer">
                              View on Explorer
                            </a>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'solana',
              label: 'Solana Networks',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    {Object.entries(BLOCKCHAIN_NETWORKS)
                      .filter(([, net]) => net.type === 'solana')
                      .map(([key, network]) => (
                        <Col key={key} xs={24} sm={12} md={6}>
                          <Card size="small">
                            <h4>{network.name}</h4>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              Cluster: {(network as any).cluster}
                            </p>
                            <a href={network.blockExplorer} target="_blank" rel="noreferrer">
                              View on Explorer
                            </a>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'substrate',
              label: 'Substrate Networks',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    {Object.entries(BLOCKCHAIN_NETWORKS)
                      .filter(([, net]) => net.type === 'substrate')
                      .map(([key, network]) => (
                        <Col key={key} xs={24} sm={12} md={6}>
                          <Card size="small">
                            <h4>{network.name}</h4>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                              SS58: {(network as any).ss58Prefix}
                            </p>
                            <a href={network.blockExplorer} target="_blank" rel="noreferrer">
                              View on Explorer
                            </a>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default BlockchainDashboard;
