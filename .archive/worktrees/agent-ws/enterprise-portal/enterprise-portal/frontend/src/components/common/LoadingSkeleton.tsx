/**
 * Loading Skeleton Components
 *
 * Provides placeholder loading states for better perceived performance
 * Shows skeleton screens while data is being fetched from backend
 */

import React from 'react';
import { Card, Skeleton, Row, Col, Table } from 'antd';
import type { SkeletonProps } from 'antd';

interface LoadingSkeletonProps extends SkeletonProps {
  type?: 'card' | 'table' | 'stats' | 'list' | 'form';
  rows?: number;
  columns?: number;
}

/**
 * Card Loading Skeleton
 */
export const CardSkeleton: React.FC<SkeletonProps> = (props) => (
  <Card>
    <Skeleton active paragraph={{ rows: 4 }} {...props} />
  </Card>
);

/**
 * Stats Card Loading Skeleton
 */
export const StatsCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <Row gutter={[16, 16]}>
    {Array.from({ length: count }, (_, i) => (
      <Col key={i} xs={24} sm={12} lg={24 / count}>
        <Card>
          <Skeleton active paragraph={{ rows: 1 }} />
        </Card>
      </Col>
    ))}
  </Row>
);

/**
 * Table Loading Skeleton
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  const dataSource = Array.from({ length: rows }, (_, i) => ({ key: i }));
  const tableColumns = Array.from({ length: columns }, (_, i) => ({
    key: i,
    dataIndex: `col${i}`,
    render: () => <Skeleton.Input active size="small" block />,
  }));

  return <Table dataSource={dataSource} columns={tableColumns} pagination={false} />;
};

/**
 * List Loading Skeleton
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ padding: '16px' }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{ marginBottom: '16px' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    ))}
  </div>
);

/**
 * Form Loading Skeleton
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div style={{ padding: '16px' }}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} style={{ marginBottom: '24px' }}>
        <Skeleton.Input active size="small" block style={{ marginBottom: '8px' }} />
        <Skeleton.Input active size="default" block />
      </div>
    ))}
  </div>
);

/**
 * Dashboard Loading Skeleton
 */
export const DashboardSkeleton: React.FC = () => (
  <div style={{ padding: '24px' }}>
    <Skeleton.Input active size="large" block style={{ marginBottom: '24px', width: '300px' }} />
    <StatsCardSkeleton count={4} />
    <Card style={{ marginTop: '24px' }}>
      <TableSkeleton rows={10} columns={6} />
    </Card>
  </div>
);

/**
 * Main Loading Skeleton Component
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  rows = 5,
  columns = 5,
  ...props
}) => {
  switch (type) {
    case 'card':
      return <CardSkeleton {...props} />;
    case 'table':
      return <TableSkeleton rows={rows} columns={columns} />;
    case 'stats':
      return <StatsCardSkeleton count={columns} />;
    case 'list':
      return <ListSkeleton count={rows} />;
    case 'form':
      return <FormSkeleton fields={rows} />;
    default:
      return <CardSkeleton {...props} />;
  }
};

export default LoadingSkeleton;
