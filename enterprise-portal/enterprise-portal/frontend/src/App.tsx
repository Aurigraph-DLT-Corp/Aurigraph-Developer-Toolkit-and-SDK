/**
 * Main Application Component
 *
 * Root component that sets up the application layout with Ant Design Layout system
 * Integrates with Redux for state management
 */

import { useState } from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
import { Header, Sidebar, Footer } from '@components/layout';
import { useAppSelector, useAppDispatch } from './hooks/useRedux';
import { toggleThemeMode } from './store/settingsSlice';
import { selectThemeMode } from './store/selectors';
import DemoApp from './components/demo-app/DemoApp';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('spatial-dashboard');

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
    console.log('Active view:', key);
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
            {/* Demo App */}
            <DemoApp />
          </Content>

          <Footer version="2.1.0" systemStatus="healthy" />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
