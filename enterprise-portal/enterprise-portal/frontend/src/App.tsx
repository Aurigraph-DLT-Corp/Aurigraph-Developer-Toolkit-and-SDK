/**
 * Main Application Component
 *
 * Root component with dropdown navigation menu
 * No sidebar - clean top navigation bar with organized dropdowns
 */

import { useMemo } from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
import { Routes, Route } from 'react-router-dom';
import { useAppSelector } from './hooks/useRedux';
import { selectThemeMode } from './store/selectors';
import TopNavRouter from './components/layout/TopNavRouter';
import { routes } from './routes/routes';
import Breadcrumb from './components/Breadcrumb';

const { Content, Footer } = Layout;

function App() {
  // Redux state for theme
  const themeMode = useAppSelector(selectThemeMode);
  const isDarkMode = themeMode === 'dark';

  const user = {
    name: 'Admin User',
    role: 'System Administrator',
  };

  // Build nav menu items from routes (memoized to avoid unnecessary recalculations)
  const navMenuItems = useMemo(() => {
    const categories: Record<string, any[]> = {};

    routes.forEach(route => {
      // Skip home route
      if (route.path === '/') return;

      // Skip routes without categories
      if (!route.category || route.parent) return;

      if (!categories[route.category]) {
        categories[route.category] = [];
      }

      categories[route.category]?.push({
        key: route.path,
        label: route.label,
        icon: route.icon ? `icon-${route.icon}` : undefined,
        title: route.description,
      });
    });

    // Category display labels
    const categoryLabels: Record<string, string> = {
      demo: 'Live Demo',
      blockchain: 'Blockchain',
      contracts: 'Smart Contracts',
      tokenization: 'RWA Tokenization',
      banking: 'Banking & Trade Finance',
      compliance: 'Compliance & Security',
      registries: 'Registries & Traceability',
      ai: 'AI & Optimization',
      integration: 'Integration',
      admin: 'Administration',
    };

    return Object.entries(categories).map(([category, items]) => ({
      key: category,
      label: categoryLabels[category] || category,
      children: items,
    }));
  }, []);

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
        {/* React Router Enhanced Top Navigation */}
        <TopNavRouter
          navMenuItems={navMenuItems}
          notificationCount={3}
          onNotificationClick={() => console.log('Notifications clicked')}
          user={user}
          onSearch={(value) => console.log('Search:', value)}
        />

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
            {/* Breadcrumb Navigation */}
            <Breadcrumb />

            {/* React Router Routes */}
            <Routes>
              {routes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Routes>
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
            Aurigraph DLT Enterprise Portal v5.0.0 | System Status:{' '}
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Healthy</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            © 2025 Aurigraph DLT. Enterprise Blockchain Platform v12.0.0
          </div>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
