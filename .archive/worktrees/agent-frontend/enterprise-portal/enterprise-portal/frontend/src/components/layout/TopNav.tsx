/**
 * Optimized Top Navigation Component
 *
 * Features:
 * - Sticky header with smooth scrolling
 * - Smart search with quick access
 * - Breadcrumb navigation
 * - Quick action buttons
 * - User profile with theme toggle
 * - Responsive design for mobile/tablet
 * - Performance optimized with memoization
 */

import { useMemo, useState, useCallback } from 'react';
import {
  Layout,
  Menu,
  Badge,
  Button,
  Space,
  Avatar,
  Dropdown,
  Tooltip,
  Breadcrumb,
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
import type { MenuProps, AutoCompleteProps, BreadcrumbProps } from 'antd';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { toggleThemeMode } from '../../store/settingsSlice';
import { selectThemeMode } from '../../store/selectors';
import '../styles/TopNav.css';

interface TopNavProps {
  navMenuItems: MenuProps['items'];
  selectedKey: string;
  onMenuClick: (key: string) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  breadcrumbItems?: BreadcrumbProps['items'];
  onSearch?: (value: string) => void;
}

const { Header: AntHeader } = Layout;

export const TopNav = ({
  navMenuItems,
  selectedKey,
  onMenuClick,
  notificationCount = 0,
  onNotificationClick,
  user = { name: 'Admin User', role: 'Administrator' },
  breadcrumbItems,
  onSearch,
}: TopNavProps) => {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const isDarkMode = themeMode === 'dark';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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

    return flattenMenuItems(navMenuItems);
  }, [navMenuItems]);

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
      onMenuClick(value);
      setSearchValue('');
    },
    [onMenuClick]
  );

  // Quick actions for common tasks
  const quickActions: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'dashboard',
        label: 'Dashboard',
      },
      {
        key: 'transactions',
        label: 'Transactions',
      },
      {
        key: 'validators',
        label: 'Validators',
      },
      {
        key: 'users',
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
            }}
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
            v4.5.0
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <div style={navContainerStyle} className="nav-menu-desktop">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={navMenuItems}
            onClick={(e) => onMenuClick(e.key)}
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
            <Dropdown menu={{ items: quickActions, onClick: (e) => onMenuClick(e.key) }}>
              <Button type="text" icon={<MenuOutlined style={{ fontSize: '18px' }} />} className="topnav-icon-btn" />
            </Dropdown>
          </Tooltip>

          {/* User Profile Dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 0' }} className="user-profile">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user.avatar}
                style={{
                  backgroundColor: '#1890ff',
                  cursor: 'pointer',
                }}
              />
              <div className="user-info">
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{user.role}</div>
              </div>
            </Space>
          </Dropdown>
        </Space>

        {/* Mobile Menu Toggle */}
        <Button
          type="text"
          icon={
            mobileMenuOpen ? (
              <CloseOutlined style={{ fontSize: '18px' }} />
            ) : (
              <MenuOutlined style={{ fontSize: '18px' }} />
            )
          }
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="topnav-mobile-toggle"
          style={{ display: 'none', marginLeft: '8px' }}
        />
      </AntHeader>

      {/* Breadcrumb Navigation */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: isDarkMode ? '#141414' : '#fafafa',
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            position: 'sticky',
            top: 64,
            zIndex: 999,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: isDarkMode ? '#141414' : '#f5f5f5',
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
          className="topnav-mobile-menu"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={navMenuItems}
            onClick={(e) => {
              onMenuClick(e.key);
              setMobileMenuOpen(false);
            }}
            style={{
              border: 'none',
              background: 'transparent',
            }}
          />
        </div>
      )}

      {/* Floating Action Button for Quick Help */}
      <FloatButton
        icon={<QuestionOutlined />}
        type="primary"
        tooltip="Help & Documentation"
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </>
  );
};

export default TopNav;
