/**
 * Main Application Component
 *
 * Root component that sets up the application layout with Ant Design Layout system
 * Integrates with Redux for state management
 */

import { useState } from 'react';
import { Layout, ConfigProvider, theme, Tabs } from 'antd';
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
} from '@ant-design/icons';
import { Header, Sidebar, Footer } from '@components/layout';
import { useAppSelector, useAppDispatch } from './hooks/useRedux';
import { toggleThemeMode } from './store/settingsSlice';
import { selectThemeMode } from './store/selectors';
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
// TODO: Fix missing dependencies (ChannelService, contractsApi) before enabling
// import SmartContractRegistry from './components/comprehensive/SmartContractRegistry';
import TokenizationRegistry from './components/comprehensive/TokenizationRegistry';
import Tokenization from './components/comprehensive/Tokenization';
import RicardianContractUpload from './components/comprehensive/RicardianContractUpload';
import ExternalAPITokenization from './components/comprehensive/ExternalAPITokenization';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('spatial-dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redux state and actions
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const isDarkMode = themeMode === 'dark';

  const user = {
    name: 'Admin User',
    role: 'System Administrator',
  };

  const handleMenuClick = (key: string) => {
    setActiveView(key);
    // Map sidebar menu to tabs
    if (key === 'spatial-dashboard' || key === 'vizor-dashboard') {
      setActiveTab('demo');
    } else if (key === 'performance-metrics') {
      setActiveTab('monitoring');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Toggle theme as a demo of Redux integration
    dispatch(toggleThemeMode());
  };

  const handleLogoutClick = () => {
    console.log('Logout clicked');
    // TODO: Implement logout
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked');
    // TODO: Open notifications drawer
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
        <Sidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          activeKey={activeView}
          onMenuClick={handleMenuClick}
        />

        <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
          <Header
            user={user}
            notificationCount={3}
            onSettingsClick={handleSettingsClick}
            onLogoutClick={handleLogoutClick}
            onNotificationsClick={handleNotificationsClick}
          />

          <Content
            style={{
              margin: '24px 16px',
              minHeight: 280,
              background: isDarkMode ? '#141414' : '#fff',
              borderRadius: '8px',
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              style={{ padding: '0 24px' }}
              items={[
                {
                  key: 'dashboard',
                  label: (
                    <span>
                      <DashboardOutlined />
                      Dashboard
                    </span>
                  ),
                  children: <Dashboard />,
                },
                {
                  key: 'transactions',
                  label: (
                    <span>
                      <ThunderboltOutlined />
                      Transactions
                    </span>
                  ),
                  children: <TransactionExplorer />,
                },
                {
                  key: 'blocks',
                  label: (
                    <span>
                      <BlockOutlined />
                      Blocks
                    </span>
                  ),
                  children: <BlockExplorer />,
                },
                {
                  key: 'validators',
                  label: (
                    <span>
                      <NodeIndexOutlined />
                      Validators
                    </span>
                  ),
                  children: <ValidatorDashboard />,
                },
                {
                  key: 'ai',
                  label: (
                    <span>
                      <RobotOutlined />
                      AI Optimization
                    </span>
                  ),
                  children: <AIOptimizationControls />,
                },
                {
                  key: 'security',
                  label: (
                    <span>
                      <SafetyOutlined />
                      Security
                    </span>
                  ),
                  children: <QuantumSecurityPanel />,
                },
                {
                  key: 'bridge',
                  label: (
                    <span>
                      <SwapOutlined />
                      Bridge
                    </span>
                  ),
                  children: <CrossChainBridge />,
                },
                {
                  key: 'contracts',
                  label: (
                    <span>
                      <FileTextOutlined />
                      Smart Contracts
                    </span>
                  ),
                  children: <div style={{padding: '20px'}}>Smart Contract Registry - Under Development</div>,
                  // TODO: Re-enable when dependencies are fixed
                  // children: <SmartContractRegistry />,
                },
                {
                  key: 'document-converter',
                  label: (
                    <span>
                      <FileAddOutlined />
                      Document Converter
                    </span>
                  ),
                  children: <RicardianContractUpload />,
                },
                {
                  key: 'active-contracts',
                  label: (
                    <span>
                      <AppstoreOutlined />
                      Active Contracts
                    </span>
                  ),
                  children: <ActiveContracts />,
                },
                {
                  key: 'tokenization',
                  label: (
                    <span>
                      <GoldOutlined />
                      Tokenization
                    </span>
                  ),
                  children: <Tokenization />,
                },
                {
                  key: 'token-registry',
                  label: (
                    <span>
                      <DollarOutlined />
                      Token Registry
                    </span>
                  ),
                  children: <TokenizationRegistry />,
                },
                {
                  key: 'api-tokenization',
                  label: (
                    <span>
                      <ApiOutlined />
                      API Tokenization
                    </span>
                  ),
                  children: <ExternalAPITokenization />,
                },
                {
                  key: 'monitoring',
                  label: (
                    <span>
                      <LineChartOutlined />
                      Monitoring
                    </span>
                  ),
                  children: <Monitoring />,
                },
                {
                  key: 'demo',
                  label: (
                    <span>
                      <ExperimentOutlined />
                      Node Visualization
                    </span>
                  ),
                  children: <DemoApp />,
                },
                {
                  key: 'settings',
                  label: (
                    <span>
                      <SettingOutlined />
                      Settings
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '24px' }}>
                      <h1>Settings</h1>
                      <p>Portal settings and configuration options will appear here.</p>
                    </div>
                  ),
                },
              ]}
            />
          </Content>

          <Footer version="4.1.0" systemStatus="healthy" />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
