/**
 * Registry Search Results Component
 *
 * Reusable component to display aggregated search results from multiple registries
 */

import React from 'react';
import { Card, Table, Tag, Empty, Button, Tooltip } from 'antd';
import { ExportOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { REGISTRY_TYPE_LABELS, PAGINATION_DEFAULTS } from '../utils/assetConstants';
import { formatDateTime, formatRelativeTime, exportToCSV, snakeToTitleCase } from '../utils/formatters';

interface RegistrySearchResultsProps {
  results: any[];
  total: number;
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const RegistrySearchResults: React.FC<RegistrySearchResultsProps> = ({
  results,
  total,
  loading,
  error,
  page,
  pageSize,
  onPageChange,
}) => {
  /**
   * Handle export
   */
  const handleExport = () => {
    const exportData = results.map((result) => ({
      RegistryType: result.registryType ? REGISTRY_TYPE_LABELS[result.registryType as keyof typeof REGISTRY_TYPE_LABELS] : 'Unknown',
      ID: result.id || result.contractId || result.certificationId || result.assetId || 'N/A',
      Name: result.name || result.assetName || 'N/A',
      Status: result.status || 'N/A',
      Created: result.createdAt ? formatDateTime(result.createdAt) : 'N/A',
      Updated: result.updatedAt ? formatDateTime(result.updatedAt) : 'N/A',
    }));

    exportToCSV(exportData, `registry-search-results-${Date.now()}.csv`);
  };

  /**
   * Get registry type color
   */
  const getRegistryTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'smart-contract': 'blue',
      'compliance': 'green',
      'asset': 'purple',
      'identity': 'orange',
      'transaction': 'cyan',
    };
    return colors[type] || 'default';
  };

  /**
   * Table columns
   */
  const columns: ColumnsType<any> = [
    {
      title: 'Registry Type',
      dataIndex: 'registryType',
      key: 'registryType',
      width: 150,
      render: (type: string) => (
        <Tag color={getRegistryTypeColor(type)}>
          {type ? REGISTRY_TYPE_LABELS[type as keyof typeof REGISTRY_TYPE_LABELS] || type : 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'ID',
      key: 'id',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        const id = record.id || record.contractId || record.certificationId || record.assetId || 'N/A';
        return (
          <Tooltip title={id}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {id.length > 20 ? `${id.substring(0, 16)}...` : id}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Name/Type',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (_, record) => {
        const name = record.name || record.assetName || record.type || 'N/A';
        return <Tooltip title={name}>{name}</Tooltip>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (!status) return <Tag>Unknown</Tag>;

        const statusColors: Record<string, string> = {
          ACTIVE: 'green',
          VALID: 'green',
          DEPLOYED: 'blue',
          INACTIVE: 'gray',
          EXPIRED: 'red',
          PAUSED: 'orange',
          PENDING: 'gold',
        };

        return <Tag color={statusColors[status] || 'default'}>{snakeToTitleCase(status)}</Tag>;
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 250,
      ellipsis: true,
      render: (_, record) => {
        // Display relevant fields based on registry type
        const details: string[] = [];

        if (record.address) details.push(`Address: ${record.address.substring(0, 10)}...`);
        if (record.owner) details.push(`Owner: ${record.owner}`);
        if (record.currentOwner) details.push(`Owner: ${record.currentOwner}`);
        if (record.issuedBy) details.push(`Issued By: ${record.issuedBy}`);
        if (record.level) details.push(`Level: ${snakeToTitleCase(record.level)}`);
        if (record.valuation) details.push(`Value: $${record.valuation.toLocaleString()}`);

        return (
          <Tooltip title={details.join(' | ')}>
            <span style={{ fontSize: '12px', color: '#595959' }}>
              {details.slice(0, 2).join(' | ')}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt || a.deployedAt || a.issuedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.deployedAt || b.issuedAt || 0).getTime();
        return dateA - dateB;
      },
      render: (date, record) => {
        const actualDate = date || record.deployedAt || record.issuedAt;
        if (!actualDate) return 'N/A';

        return (
          <Tooltip title={formatDateTime(actualDate)}>
            <span>{formatRelativeTime(actualDate)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateA - dateB;
      },
      render: (date) => {
        if (!date) return 'N/A';
        return (
          <Tooltip title={formatDateTime(date)}>
            <span>{formatRelativeTime(date)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            console.log('View details for:', record);
            // Would navigate to specific registry view or open modal
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Search Results"
      extra={
        results.length > 0 && (
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export
          </Button>
        )
      }
    >
      {error && (
        <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
          Error: {error.message}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={results}
        rowKey={(record) => record.id || record.contractId || record.certificationId || record.assetId || Math.random().toString()}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: PAGINATION_DEFAULTS.PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total) => `Total ${total} results across all registries`,
          onChange: onPageChange,
        }}
        locale={{
          emptyText: (
            <Empty
              description="No results found. Try adjusting your search criteria."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        scroll={{ x: 1200 }}
      />

      {/* Summary */}
      {results.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fafafa',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#595959',
          }}
        >
          <strong>Search Summary:</strong> Showing {results.length} of {total} results
          {results.length > 0 && (
            <>
              {' - '}
              Registry Types:{' '}
              {Array.from(new Set(results.map((r) => r.registryType)))
                .map((type) => REGISTRY_TYPE_LABELS[type as keyof typeof REGISTRY_TYPE_LABELS] || type)
                .join(', ')}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default RegistrySearchResults;
