/**
 * Footer Component
 *
 * Application footer with copyright and system status
 */

import { Layout, Space, Typography, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

interface FooterProps {
  version?: string;
  buildTime?: string;
  systemStatus?: 'healthy' | 'degraded' | 'critical';
}

export const Footer = ({ version = '2.1.0', buildTime, systemStatus = 'healthy' }: FooterProps) => {
  const statusConfig = {
    healthy: {
      color: 'success',
      icon: <CheckCircleOutlined />,
      text: 'All Systems Operational',
    },
    degraded: {
      color: 'warning',
      icon: <ClockCircleOutlined />,
      text: 'Degraded Performance',
    },
    critical: {
      color: 'error',
      icon: <ClockCircleOutlined />,
      text: 'System Issues Detected',
    },
  };

  const status = statusConfig[systemStatus];

  return (
    <AntFooter
      style={{
        textAlign: 'center',
        background: '#f0f2f5',
        padding: '16px 50px',
        borderTop: '1px solid #d9d9d9',
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* System Status */}
        <div>
          <Tag color={status.color} icon={status.icon}>
            {status.text}
          </Tag>
        </div>

        {/* Version and Build Info */}
        <Space split="|" size="small">
          <Text type="secondary">Version {version}</Text>
          {buildTime && <Text type="secondary">Built {buildTime}</Text>}
          <Link href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT" target="_blank">
            GitHub
          </Link>
          <Link href="https://aurigraphdlt.atlassian.net" target="_blank">
            JIRA
          </Link>
        </Space>

        {/* Copyright */}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          © {new Date().getFullYear()} Aurigraph DLT Corp. All rights reserved. |{' '}
          <Link href="https://claude.com/claude-code" target="_blank" style={{ fontSize: '12px' }}>
            🤖 Generated with Claude Code
          </Link>
        </Text>
      </Space>
    </AntFooter>
  );
};

export default Footer;
