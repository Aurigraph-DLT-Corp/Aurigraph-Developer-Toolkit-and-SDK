/**
 * Empty State Component
 *
 * User-friendly empty states for various scenarios:
 * - No data available
 * - Feature under development
 * - API endpoint not available
 * - No results found
 */

import React, { ReactNode } from 'react';
import { Empty, Button, Typography, Space, Card, Tag } from 'antd';
import {
  InboxOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  ApiOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export type EmptyStateType =
  | 'no-data'
  | 'feature-unavailable'
  | 'api-unavailable'
  | 'no-results'
  | 'coming-soon'
  | 'under-development'
  | 'api-error';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string | ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  showCard?: boolean;
  style?: React.CSSProperties;
}

/**
 * Empty State Component with predefined types
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  onRetry,
  showCard = false,
  style,
}) => {
  // Predefined configurations for different empty state types
  const configs: Record<
    EmptyStateType,
    {
      icon: ReactNode;
      title: string;
      description: string | ReactNode;
      status?: 'info' | 'warning' | 'error';
    }
  > = {
    'no-data': {
      icon: <InboxOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
      title: 'No Data Available',
      description: 'There is no data to display at this time.',
    },
    'feature-unavailable': {
      icon: <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14' }} />,
      title: 'Feature Temporarily Unavailable',
      description:
        'This feature is currently unavailable. Backend API endpoint is not responding. Please try again later.',
      status: 'warning',
    },
    'api-unavailable': {
      icon: <ApiOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />,
      title: 'API Endpoint Not Available',
      description: (
        <Space direction="vertical" align="center">
          <Text>The backend API endpoint for this feature is not yet implemented.</Text>
          <Tag color="orange">Status: 404 Not Found</Tag>
        </Space>
      ),
      status: 'error',
    },
    'no-results': {
      icon: <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
      title: 'No Results Found',
      description: 'Try adjusting your search or filter criteria.',
    },
    'coming-soon': {
      icon: <RocketOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
      title: 'Coming Soon',
      description: (
        <Space direction="vertical" align="center">
          <Text>This feature is currently under development.</Text>
          <Tag color="blue" icon={<ClockCircleOutlined />}>
            Expected in next release
          </Tag>
        </Space>
      ),
      status: 'info',
    },
    'under-development': {
      icon: <RocketOutlined style={{ fontSize: 64, color: '#722ed1' }} />,
      title: 'Under Development',
      description: (
        <Space direction="vertical" align="center">
          <Text>This feature is being actively developed.</Text>
          <Tag color="purple">Backend API in progress</Tag>
        </Space>
      ),
      status: 'info',
    },
    'api-error': {
      icon: <ExclamationCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />,
      title: 'Failed to Load Data',
      description: (
        <Space direction="vertical" align="center">
          <Text>Unable to fetch data from the backend API.</Text>
          <Text type="secondary">The service may be temporarily unavailable.</Text>
        </Space>
      ),
      status: 'error',
    },
  };

  const config = configs[type];
  const finalIcon = icon || config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;

  const emptyContent = (
    <Empty
      image={finalIcon}
      imageStyle={{ height: 80 }}
      description={
        <Space direction="vertical" style={{ marginTop: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>
            {finalTitle}
          </Text>
          {typeof finalDescription === 'string' ? (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {finalDescription}
            </Paragraph>
          ) : (
            finalDescription
          )}
        </Space>
      }
      style={{ padding: '40px 20px', ...style }}
    >
      {action || (onRetry && (
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRetry}
          style={{ marginTop: '16px' }}
        >
          Retry
        </Button>
      ))}
    </Empty>
  );

  if (showCard) {
    return <Card>{emptyContent}</Card>;
  }

  return emptyContent;
};

/**
 * Specific Empty State Components for common use cases
 */
export const NoDataEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-data" {...props} />
);

export const FeatureUnavailableEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="feature-unavailable" {...props} />
);

export const ApiUnavailableEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="api-unavailable" {...props} />
);

export const NoResultsEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="no-results" {...props} />
);

export const ComingSoonEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="coming-soon" {...props} />
);

export const UnderDevelopmentEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="under-development" {...props} />
);

export const ApiErrorEmpty: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="api-error" {...props} />
);

export default EmptyState;
