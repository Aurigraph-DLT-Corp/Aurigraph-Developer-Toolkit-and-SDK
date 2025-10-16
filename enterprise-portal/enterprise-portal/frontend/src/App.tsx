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

  // Main navigation menu items
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
      ],
    },
    {
      key: 'ai-security',
      icon: <SafetyOutlined />,
      label: 'AI & Security',
      children: [
        {
          key: 'ai',
          icon: <RobotOutlined />,
          label: 'AI Optimization',
        },
        {
          key: 'security',
          icon: <SafetyOutlined />,
          label: 'Quantum Security',
        },
      ],
    },
    {
      key: 'contracts',
      icon: <FileTextOutlined />,
      label: 'Smart Contracts',
      children: [
        {
          key: 'contracts-registry',
          icon: <FileTextOutlined />,
          label: 'Contract Registry',
        },
        {
          key: 'document-converter',
          icon: <FileAddOutlined />,
          label: 'Document Converter',
        },
        {
          key: 'active-contracts',
          icon: <AppstoreOutlined />,
          label: 'Active Contracts',
        },
      ],
    },
    {
      key: 'assets',
      icon: <GoldOutlined />,
      label: 'Asset Management',
      children: [
        {
          key: 'tokenization',
          icon: <GoldOutlined />,
          label: 'Tokenization',
        },
        {
          key: 'token-registry',
          icon: <DollarOutlined />,
          label: 'Token Registry',
        },
        {
          key: 'rwat',
          icon: <BankOutlined />,
          label: 'RWAT Registry',
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
          label: 'API Tokenization',
        },
      ],
    },
    {
      key: 'system',
      icon: <ExperimentOutlined />,
      label: 'System',
      children: [
        {
          key: 'monitoring',
          icon: <LineChartOutlined />,
          label: 'Monitoring',
        },
        {
          key: 'demo',
          icon: <ExperimentOutlined />,
          label: 'Node Visualization',
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Settings',
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
        return <LandingPage />;
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
      case 'token-registry':
        return <TokenizationRegistry />;
      case 'api-tokenization':
        return <ExternalAPITokenization />;
      case 'rwat':
        return <RWATRegistry />;
      case 'monitoring':
        return <Monitoring />;
      case 'demo':
        return <DemoApp />;
      case 'settings':
        return (
          <div style={{ padding: '24px' }}>
            <h1>Settings</h1>
            <p>Portal settings and configuration options will appear here.</p>
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
              Enterprise Portal v4.2.0
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
            Aurigraph DLT Enterprise Portal v4.2.0 | System Status:{' '}
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
