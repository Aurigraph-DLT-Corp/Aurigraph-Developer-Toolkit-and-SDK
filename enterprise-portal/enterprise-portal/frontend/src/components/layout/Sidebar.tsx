/**
 * Sidebar Component
 *
 * Navigation menu for switching between dashboards and demo app views
 */

import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  SettingOutlined,
  ApiOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  activeKey?: string;
  onMenuClick?: (key: string) => void;
}

export const Sidebar = ({
  collapsed = false,
  onCollapse,
  activeKey = 'spatial-dashboard',
  onMenuClick,
}: SidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(collapsed);

  const handleCollapse = (value: boolean) => {
    setInternalCollapsed(value);
    onCollapse?.(value);
  };

  const menuItems: MenuItem[] = [
    {
      key: 'dashboards',
      icon: <DashboardOutlined />,
      label: 'Dashboards',
      children: [
        {
          key: 'spatial-dashboard',
          icon: <ClusterOutlined />,
          label: 'Spatial View',
        },
        {
          key: 'vizor-dashboard',
          icon: <LineChartOutlined />,
          label: 'Vizor Charts',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'nodes',
      icon: <AppstoreOutlined />,
      label: 'Node Management',
      children: [
        {
          key: 'channel-nodes',
          icon: <ApiOutlined />,
          label: 'Channel Nodes',
        },
        {
          key: 'validator-nodes',
          icon: <ThunderboltOutlined />,
          label: 'Validator Nodes',
        },
        {
          key: 'business-nodes',
          icon: <DashboardOutlined />,
          label: 'Business Nodes',
        },
        {
          key: 'slim-nodes',
          icon: <AppstoreOutlined />,
          label: 'Slim Nodes',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    onMenuClick?.(key);
  };

  return (
    <Sider
      collapsible
      collapsed={internalCollapsed}
      onCollapse={handleCollapse}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
      trigger={
        internalCollapsed ? (
          <MenuUnfoldOutlined style={{ fontSize: '16px' }} />
        ) : (
          <MenuFoldOutlined style={{ fontSize: '16px' }} />
        )
      }
    >
      {/* Logo/Branding */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.2)',
          margin: '16px',
          borderRadius: '8px',
        }}
      >
        {!internalCollapsed ? (
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
            🚀 Aurigraph DLT
          </div>
        ) : (
          <div style={{ color: '#fff', fontSize: '24px' }}>🚀</div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[activeKey]}
        defaultOpenKeys={['dashboards', 'nodes']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
