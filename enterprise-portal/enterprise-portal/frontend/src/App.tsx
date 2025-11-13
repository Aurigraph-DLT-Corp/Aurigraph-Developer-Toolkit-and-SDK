/**
 * Main Application Component
 *
 * Root component with dropdown navigation menu
 * No sidebar - clean top navigation bar with organized dropdowns
 */

import { useState } from 'react';
import { Layout, ConfigProvider, theme, Menu, Dropdown, Space, Avatar, Badge, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  SafetyOutlined,
  SwapOutlined,
  FileTextOutlined,
  GoldOutlined,
  AppstoreOutlined,
  DollarOutlined,
  FileAddOutlined,
  ApiOutlined,
  BankOutlined,
  HomeOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  DownOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from './hooks/useRedux';
import { toggleThemeMode } from './store/settingsSlice';
import { selectThemeMode } from './store/selectors';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Monitoring from './components/Monitoring';
import DemoApp from './components/demo-app/DemoApp';
import TransactionExplorer from './components/comprehensive/TransactionExplorer';
import BlockExplorer from './components/comprehensive/BlockExplorer';
import ValidatorDashboard from './components/comprehensive/ValidatorDashboard';
import AIOptimizationControls from './components/comprehensive/AIOptimizationControls';
import QuantumSecurityPanel from './components/comprehensive/QuantumSecurityPanel';
import CrossChainBridge from './components/comprehensive/CrossChainBridge';
import ActiveContracts from './components/comprehensive/ActiveContracts';
import SmartContractRegistry from './components/comprehensive/SmartContractRegistry';
import TokenizationRegistry from './components/comprehensive/TokenizationRegistry';
import Tokenization from './components/comprehensive/Tokenization';
import RicardianContractUpload from './components/comprehensive/RicardianContractUpload';
import ExternalAPITokenization from './components/comprehensive/ExternalAPITokenization';
import RWATRegistry from './components/comprehensive/RWATRegistry';
import Whitepaper from './components/comprehensive/Whitepaper';
import UserManagement from './components/UserManagement';
import RWATTokenizationForm from './components/rwat/RWATTokenizationForm';
import MerkleTreeRegistry from './components/registry/MerkleTreeRegistry';
import ComplianceDashboard from './components/compliance/ComplianceDashboard';

const { Header, Content, Footer } = Layout;

function App() {
  const [activeKey, setActiveKey] = useState('home');

  // Redux state and actions
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const isDarkMode = themeMode === 'dark';

  const user = {
    name: 'Admin User',
    role: 'System Administrator',
  };

  // User menu dropdown
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'theme',
      icon: <SettingOutlined />,
      label: 'Toggle Theme',
      onClick: () => dispatch(toggleThemeMode()),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => console.log('Logout clicked'),
    },
  ];

  // Main navigation menu items - Reorganized for better UX
  const navMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: 'blockchain',
      icon: <BlockOutlined />,
      label: 'Blockchain',
      children: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
        {
          key: 'transactions',
          icon: <ThunderboltOutlined />,
          label: 'Transactions',
        },
        {
          key: 'blocks',
          icon: <BlockOutlined />,
          label: 'Blocks',
        },
        {
          key: 'validators',
          icon: <NodeIndexOutlined />,
          label: 'Validators',
        },
        {
          type: 'divider',
        },
        {
          key: 'monitoring',
          icon: <LineChartOutlined />,
          label: 'Monitoring',
        },
        {
          key: 'demo',
          icon: <ExperimentOutlined />,
          label: 'Network Topology',
        },
      ],
    },
    {
      key: 'rwat',
      icon: <GoldOutlined />,
      label: 'RWA Tokenization',
      children: [
        {
          key: 'rwat-tokenization',
          icon: <FileAddOutlined />,
          label: 'Create RWAT Token',
        },
        {
          key: 'tokenization',
          icon: <GoldOutlined />,
          label: 'Standard Tokenization',
        },
        {
          type: 'divider',
        },
        {
          key: 'token-registry',
          icon: <DollarOutlined />,
          label: 'Token Registry',
        },
        {
          key: 'rwat',
          icon: <BankOutlined />,
          label: 'RWA Registry',
        },
      ],
    },
    {
      key: 'smart-contracts',
      icon: <FileTextOutlined />,
      label: 'Smart Contracts',
      children: [
        {
          key: 'contracts-registry',
          icon: <FileTextOutlined />,
          label: 'Contract Registry',
        },
        {
          key: 'active-contracts',
          icon: <AppstoreOutlined />,
          label: 'Active Contracts',
        },
        {
          key: 'document-converter',
          icon: <FileAddOutlined />,
          label: 'Ricardian Converter',
        },
      ],
    },
    {
      key: 'compliance',
      icon: <SecurityScanOutlined />,
      label: 'Compliance & Security',
      children: [
        {
          key: 'compliance-dashboard',
          icon: <SafetyOutlined />,
          label: 'Compliance Dashboard',
        },
        {
          key: 'compliance-reports',
          icon: <FileTextOutlined />,
          label: 'Compliance Reports',
        },
        {
          type: 'divider',
        },
        {
          key: 'security',
          icon: <SafetyOutlined />,
          label: 'Quantum Security',
        },
        {
          key: 'merkle-tree',
          icon: <FolderOutlined />,
          label: 'Merkle Tree Registry',
        },
      ],
    },
    {
      key: 'ai-optimization',
      icon: <RobotOutlined />,
      label: 'AI & Optimization',
      children: [
        {
          key: 'ai',
          icon: <RobotOutlined />,
          label: 'AI Optimization',
        },
        {
          key: 'ai-metrics',
          icon: <LineChartOutlined />,
          label: 'AI Metrics',
        },
        {
          key: 'consensus-optimization',
          icon: <NodeIndexOutlined />,
          label: 'Consensus Tuning',
        },
      ],
    },
    {
      key: 'integration',
      icon: <SwapOutlined />,
      label: 'Integration',
      children: [
        {
          key: 'bridge',
          icon: <SwapOutlined />,
          label: 'Cross-Chain Bridge',
        },
        {
          key: 'api-tokenization',
          icon: <ApiOutlined />,
          label: 'API Endpoints',
        },
      ],
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Administration',
      children: [
        {
          key: 'users',
          icon: <TeamOutlined />,
          label: 'User Management',
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'System Settings',
        },
        {
          key: 'token-list',
          icon: <AppstoreOutlined />,
          label: 'Token Directory',
        },
      ],
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    setActiveKey(e.key);
  };

  // Render content based on active key
  const renderContent = () => {
    switch (activeKey) {
      case 'home':
        return <LandingPage onAccessPortal={(key) => setActiveKey(key || 'dashboard')} />;
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionExplorer />;
      case 'blocks':
        return <BlockExplorer />;
      case 'validators':
        return <ValidatorDashboard />;
      case 'ai':
        return <AIOptimizationControls />;
      case 'security':
        return <QuantumSecurityPanel />;
      case 'bridge':
        return <CrossChainBridge />;
      case 'contracts-registry':
        return <SmartContractRegistry />;
      case 'document-converter':
        return <RicardianContractUpload />;
      case 'active-contracts':
        return <ActiveContracts />;
      case 'tokenization':
        return <Tokenization />;
      case 'rwat-tokenization':
        return <RWATTokenizationForm />;
      case 'token-registry':
        return <TokenizationRegistry />;
      case 'api-tokenization':
        return <ExternalAPITokenization />;
      case 'rwat':
        return <RWATRegistry />;
      case 'compliance-dashboard':
        return <ComplianceDashboard />;
      case 'compliance-reports':
        return (
          <div style={{ padding: '24px' }}>
            <h1>Compliance Reports</h1>
            <p>Detailed compliance reports and regulatory documentation.</p>
          </div>
        );
      case 'merkle-tree':
        return <MerkleTreeRegistry />;
      case 'token-list':
        return (
          <div style={{ padding: '24px' }}>
            <h1>Token Directory</h1>
            <p>Complete list of all tokenized assets across the platform.</p>
          </div>
        );
      case 'monitoring':
        return <Monitoring />;
      case 'demo':
        return <DemoApp />;
      case 'whitepaper':
        return <Whitepaper />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return (
          <div style={{ padding: '24px' }}>
            <h1>System Settings</h1>
            <p>Portal settings and configuration options will appear here.</p>
          </div>
        );
      case 'ai-metrics':
        return (
          <div style={{ padding: '24px' }}>
            <h1>AI Metrics Dashboard</h1>
            <p>Real-time AI optimization performance metrics and analytics.</p>
          </div>
        );
      case 'consensus-optimization':
        return (
          <div style={{ padding: '24px' }}>
            <h1>Consensus Tuning</h1>
            <p>HyperRAFT++ consensus algorithm optimization and configuration.</p>
          </div>
        );
      default:
        return <LandingPage />;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* Top Navigation Header */}
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: isDarkMode ? '#001529' : '#fff',
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          {/* Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1890ff',
              }}
            >
              Aurigraph DLT
            </div>
            <div
              style={{
                fontSize: '12px',
                color: isDarkMode ? '#8c8c8c' : '#595959',
              }}
            >
              Enterprise Portal v4.3.0
            </div>
          </div>

          {/* Navigation Menu */}
          <Menu
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={navMenuItems}
            onClick={handleMenuClick}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              marginLeft: '24px',
            }}
          />

          {/* User Actions */}
          <Space size="large">
            <Badge count={3}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                onClick={() => console.log('Notifications clicked')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.name}</span>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            padding: '24px',
            minHeight: 280,
            background: isDarkMode ? '#141414' : '#f0f2f5',
          }}
        >
          <div
            style={{
              background: isDarkMode ? '#1f1f1f' : '#fff',
              padding: '24px',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 170px)',
            }}
          >
            {renderContent()}
          </div>
        </Content>

        {/* Footer */}
        <Footer
          style={{
            textAlign: 'center',
            background: isDarkMode ? '#001529' : '#fff',
            borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
          }}
        >
          <div>
            Aurigraph DLT Enterprise Portal v4.3.0 | System Status:{' '}
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Healthy</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            © 2025 Aurigraph DLT. Enterprise Blockchain Platform v11.3.1
          </div>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
