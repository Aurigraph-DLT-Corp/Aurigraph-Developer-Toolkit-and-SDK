/**
 * Breadcrumb Navigation Component
 *
 * Displays the current navigation path with clickable breadcrumbs
 * Automatically generated from the current route
 */

import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useBreadcrumbs, useNavigation } from '../context/NavigationContext';
import { RouteDefinition } from '../routes/routes';

/**
 * Breadcrumb navigation component
 */
export const Breadcrumb: React.FC = () => {
  const breadcrumbs = useBreadcrumbs();
  const { navigate } = useNavigation();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  /**
   * Handle breadcrumb click
   */
  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  /**
   * Render a breadcrumb item
   */
  const renderBreadcrumbItem = (breadcrumb: RouteDefinition, isLast: boolean) => {
    const key = breadcrumb.path;

    // Don't render as clickable if it's the last item (current page)
    if (isLast) {
      return (
        <AntBreadcrumb.Item key={key}>
          {breadcrumb.breadcrumbLabel || breadcrumb.label}
        </AntBreadcrumb.Item>
      );
    }

    // Render as clickable link
    return (
      <AntBreadcrumb.Item key={key}>
        <a
          onClick={() => handleBreadcrumbClick(breadcrumb.path)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
          title={`Navigate to ${breadcrumb.breadcrumbLabel || breadcrumb.label}`}
        >
          {breadcrumb.breadcrumbLabel || breadcrumb.label}
        </a>
      </AntBreadcrumb.Item>
    );
  };

  return (
    <div style={{ marginBottom: '16px', padding: '8px 0' }}>
      <AntBreadcrumb separator=">">
        <AntBreadcrumb.Item>
          <a
            onClick={() => handleBreadcrumbClick('/')}
            style={{ cursor: 'pointer' }}
            title="Go to Home"
          >
            <HomeOutlined />
          </a>
        </AntBreadcrumb.Item>
        {breadcrumbs.map((breadcrumb) => {
          // Skip home breadcrumb as we already rendered it
          if (breadcrumb.path === '/') {
            return null;
          }

          const isLast = breadcrumbs[breadcrumbs.length - 1]?.path === breadcrumb.path;
          return renderBreadcrumbItem(breadcrumb, isLast);
        })}
      </AntBreadcrumb>
    </div>
  );
};

export default Breadcrumb;
