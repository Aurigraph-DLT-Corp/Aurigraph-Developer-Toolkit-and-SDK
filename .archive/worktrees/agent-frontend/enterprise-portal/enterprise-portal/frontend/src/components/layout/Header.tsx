/**
 * Header Component
 *
 * Top navigation bar with branding, user profile, and notifications
 */

import { Layout, Avatar, Badge, Dropdown, Space, Typography } from 'antd';
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  notificationCount: number;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  onNotificationsClick?: () => void;
}

export const Header = ({
  user,
  notificationCount,
  onSettingsClick,
  onLogoutClick,
  onNotificationsClick,
}: HeaderProps) => {
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: onSettingsClick,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogoutClick,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        zIndex: 999,
      }}
    >
      <div>
        <Typography.Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          Aurigraph Enterprise Portal
        </Typography.Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Real-Time Node Visualization Demo App
        </Text>
      </div>

      <Space size="large">
        {/* Notifications */}
        <Badge count={notificationCount} size="small">
          <BellOutlined
            style={{ fontSize: '20px', cursor: 'pointer' }}
            onClick={onNotificationsClick}
          />
        </Badge>

        {/* User Menu */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              src={user.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{user.role}</div>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
