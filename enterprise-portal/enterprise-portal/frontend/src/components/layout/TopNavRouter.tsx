/**
 * React Router Enhanced Top Navigation Component
 *
 * Drop-in replacement for TopNav that integrates with React Router v6
 * Maintains all original functionality while adding URL-based navigation
 *
 * Features:
 * - Sticky header with smooth scrolling
 * - Smart search with quick access
 * - Breadcrumb navigation via NavigationContext
 * - Quick action buttons
 * - User profile with theme toggle
 * - Responsive design for mobile/tablet
 * - Performance optimized with memoization
 * - React Router v6 integration (useNavigate, useLocation)
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Badge,
  Button,
  Space,
  Avatar,
  Dropdown,
  Tooltip,
  AutoComplete,
  FloatButton,
} from 'antd';
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  QuestionOutlined,
} from '@ant-design/icons';
import type { MenuProps, AutoCompleteProps } from 'antd';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { toggleThemeMode } from '../../store/settingsSlice';
import { selectThemeMode } from '../../store/selectors';
import { useNavigation } from '../../context/NavigationContext';
import { routes } from '../../routes/routes';
import '../styles/TopNav.css';

interface TopNavRouterProps {
  navMenuItems: MenuProps['items'];
  notificationCount?: number;
  onNotificationClick?: () => void;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onSearch?: (value: string) => void;
}

const { Header: AntHeader } = Layout;

/**
 * Helper function to convert route definitions to menu items
 */
const buildMenuItemsFromRoutes = (): MenuProps['items'] => {
  const categories: Record<string, MenuProps['items']> = {};

  routes.forEach(route => {
    // Skip home route
    if (route.path === '/') return;

    // Skip routes without categories for now
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

  // Convert to menu structure with categories as submenus
  const categoryLabels: Record<string, string> = {
    demo: 'Live Demo',
    blockchain: 'Blockchain',
    contracts: 'Smart Contracts',
    tokenization: 'Tokenization',
    rwat: 'RWAT Assets',
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
};

export const TopNavRouter = ({
  navMenuItems,
  notificationCount = 0,
  onNotificationClick,
  user = { name: 'Admin User', role: 'Administrator' },
  onSearch,
}: TopNavRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const navigationContext = useNavigation();

  const isDarkMode = themeMode === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>(location.pathname);

  // Update selected key when location changes
  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  // Use provided menu items or generate from routes
  const menuItems = useMemo(
    () => navMenuItems || buildMenuItemsFromRoutes(),
    [navMenuItems]
  );

  // User menu items
  const userMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
      {
        type: 'divider',
      },
      {
        key: 'theme',
        icon: <SettingOutlined />,
        label: isDarkMode ? 'Light Theme' : 'Dark Theme',
        onClick: () => dispatch(toggleThemeMode()),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        danger: true,
      },
    ],
    [isDarkMode, dispatch]
  );

  // Generate search options from menu items
  const searchOptions: AutoCompleteProps['options'] = useMemo(() => {
    const flattenMenuItems = (items: MenuProps['items']): AutoCompleteProps['options'] => {
      const result: AutoCompleteProps['options'] = [];

      const traverse = (items: MenuProps['items']) => {
        items?.forEach((item: any) => {
          if (item.type !== 'divider' && item.label) {
            const label = typeof item.label === 'string' ? item.label : '';

            result.push({
              label: label,
              value: item.key,
            });
          }

          if (item.children) {
            traverse(item.children);
          }
        });
      };

      traverse(items);
      return result;
    };

    return flattenMenuItems(menuItems);
  }, [menuItems]);

  // Handle navigation using React Router
  const handleMenuClick = useCallback(
    (key: string) => {
      // Navigate using React Router
      navigate(key);
      navigationContext.navigate(key);
      setSelectedKey(key);
      setMobileMenuOpen(false);
    },
    [navigate, navigationContext]
  );

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  // Handle search selection
  const handleSearchSelect = useCallback(
    (value: string) => {
      handleMenuClick(value);
      setSearchValue('');
    },
    [handleMenuClick]
  );

  // Quick actions for common tasks
  const quickActions: MenuProps['items'] = useMemo(
    () => [
      {
        key: '/dashboard',
        label: 'Dashboard',
      },
      {
        key: '/transactions',
        label: 'Transactions',
      },
      {
        key: '/validators',
        label: 'Validators',
      },
      {
        key: '/admin/users',
        label: 'Users',
      },
    ],
    []
  );

  // Responsive header style
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: isDarkMode ? '#001529' : '#fff',
    borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '200px',
  };

  const navContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginLeft: '24px',
    minWidth: 0,
  };

  return (
    <>
      <AntHeader style={headerStyle}>
        {/* Logo Section */}
        <div style={logoStyle}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1890ff',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              cursor: 'pointer',
            }}
            onClick={() => handleMenuClick('/')}
            title="Go to Home"
          >
            <span>Aurigraph DLT</span>
            <span style={{ fontSize: '11px', fontWeight: 'normal', verticalAlign: 'sub' }}>
              Enterprise
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: isDarkMode ? '#8c8c8c' : '#595959',
              whiteSpace: 'nowrap',
              display: 'none',
            }}
            className="version-display"
          >
            v4.6.0
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <div style={navContainerStyle} className="nav-menu-desktop">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={(e) => handleMenuClick(e.key)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              minWidth: 0,
            }}
            className="topnav-menu"
          />
        </div>

        {/* Search Bar */}
        <AutoComplete
          value={searchValue}
          onChange={handleSearch}
          onSelect={handleSearchSelect}
          options={searchOptions}
          placeholder="Search..."
          allowClear
          filterOption={(inputValue, option) => {
            const label = typeof option?.label === 'string' ? option.label : '';
            return label.toLowerCase().includes(inputValue.toLowerCase());
          }}
          style={{
            width: '200px',
            marginRight: '16px',
          }}
          className="topnav-search"
        />

        {/* User Actions */}
        <Space size="middle" style={{ marginRight: '8px' }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <Badge count={notificationCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                onClick={onNotificationClick}
                className="topnav-icon-btn"
              />
            </Badge>
          </Tooltip>

          {/* Quick Actions */}
          <Tooltip title="Quick Actions">
            <Dropdown menu={{ items: quickActions, onClick: (e) => handleMenuClick(e.key) }}>
              <Button type="text" icon={<MenuOutlined style={{ fontSize: '18px' }} />} className="topnav-icon-btn" />
            </Dropdown>
          </Tooltip>

          {/* Help */}
          <Tooltip title="Help">
            <Button type="text" icon={<QuestionOutlined style={{ fontSize: '18px' }} />} className="topnav-icon-btn" />
          </Tooltip>

          {/* User Profile Dropdown */}
          <Dropdown menu={{ items: userMenuItems }}>
            <Button
              type="text"
              style={{
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              className="topnav-user-btn"
            >
              <Avatar icon={<UserOutlined />} size="small" />
              <span style={{ fontSize: '12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </span>
            </Button>
          </Dropdown>
        </Space>

        {/* Mobile Menu Toggle */}
        <Button
          type="text"
          icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="topnav-mobile-menu-btn"
          style={{ display: 'none' }}
        />
      </AntHeader>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div style={{ background: isDarkMode ? '#141414' : '#fafafa', padding: '8px 0' }}>
          <Menu
            mode="vertical"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={(e) => handleMenuClick(e.key)}
            style={{
              border: 'none',
              background: 'transparent',
            }}
            className="topnav-menu-mobile"
          />
        </div>
      )}

      {/* Help Float Button */}
      <FloatButton
        icon={<QuestionOutlined />}
        type="primary"
        style={{ right: 24 }}
        tooltip={<div>Help & Support</div>}
      />
    </>
  );
};

export default TopNavRouter;
