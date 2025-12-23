/**
 * Asset Traceability View
 *
 * Main view for asset traceability with search, filtering, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Drawer,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAssetTraceability, Asset, AssetSearchParams } from '../hooks/useAssetTraceability';
import {
  AssetType,
  AssetStatus,
  ASSET_TYPE_LABELS,
  STATUS_COLORS,
  PAGINATION_DEFAULTS,
} from '../utils/assetConstants';
import {
  formatCurrency,
  formatAssetStatus,
  formatDateTime,
  formatRelativeTime,
  exportToCSV,
} from '../utils/formatters';
import AssetDetailsPanel from '../components/AssetDetailsPanel';

const { Search } = Input;
const { Option } = Select;

const AssetTraceabilityView: React.FC = () => {
  // Hooks
  const {
    assets,
    loading,
    error,
    total,
    searchAssets,
    getAsset,
    getAssetHistory,
    transferAsset,
    selectedAsset,
    assetHistory,
    setSelectedAsset,
  } = useAssetTraceability({ enableWebSocket: true });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AssetType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<AssetStatus | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULTS.PAGE_SIZE);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    recentTransfers: 0,
  });

  /**
   * Load assets
   */
  const loadAssets = async () => {
    const params: AssetSearchParams = {
      query: searchQuery || undefined,
      type: filterType,
      status: filterStatus,
      page: currentPage,
      pageSize,
    };

    try {
      const result = await searchAssets(params);

      // Calculate stats
      const totalValue = result.assets.reduce((sum, asset) => sum + (asset.valuation || 0), 0);
      const activeAssets = result.assets.filter((a) => a.status === AssetStatus.ACTIVE).length;

      setStats({
        totalAssets: result.total,
        totalValue,
        activeAssets,
        recentTransfers: result.assets.filter((a) => a.status === AssetStatus.TRANSFERRED).length,
      });
    } catch (err: any) {
      message.error(err.message || 'Failed to load assets');
    }
  };

  /**
   * Handle search
   */
  const handleSearch = () => {
    setCurrentPage(1);
    loadAssets();
  };

  /**
   * Handle view details
   */
  const handleViewDetails = async (asset: Asset) => {
    try {
      await getAsset(asset.assetId);
      await getAssetHistory(asset.assetId);
      setDrawerVisible(true);
    } catch (err: any) {
      message.error(err.message || 'Failed to load asset details');
    }
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    const exportData = assets.map((asset) => ({
      AssetID: asset.assetId,
      Name: asset.assetName,
      Type: ASSET_TYPE_LABELS[asset.type],
      Valuation: asset.valuation,
      Currency: asset.currency,
      Owner: asset.currentOwner,
      Status: formatAssetStatus(asset.status),
      Created: formatDateTime(asset.createdAt),
      Updated: formatDateTime(asset.updatedAt),
    }));

    exportToCSV(exportData, `assets-${Date.now()}.csv`);
    message.success('Assets exported successfully');
  };

  /**
   * Table columns
   */
  const columns: ColumnsType<Asset> = [
    {
      title: 'Asset ID',
      dataIndex: 'assetId',
      key: 'assetId',
      width: 120,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text.substring(0, 12)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Asset Name',
      dataIndex: 'assetName',
      key: 'assetName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: AssetType) => <Tag color="blue">{ASSET_TYPE_LABELS[type]}</Tag>,
    },
    {
      title: 'Valuation',
      dataIndex: 'valuation',
      key: 'valuation',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.valuation - b.valuation,
      render: (value, record) => formatCurrency(value, record.currency),
    },
    {
      title: 'Current Owner',
      dataIndex: 'currentOwner',
      key: 'currentOwner',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: AssetStatus) => (
        <Tag color={STATUS_COLORS[status]}>{formatAssetStatus(status)}</Tag>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date) => (
        <Tooltip title={formatDateTime(date)}>
          <span>{formatRelativeTime(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === AssetStatus.ACTIVE && (
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                setSelectedAsset(record);
                // Would open transfer modal here
                message.info('Transfer functionality coming soon');
              }}
            >
              Transfer
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /**
   * Initial load
   */
  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filterType, filterStatus]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Asset Traceability</h2>
        <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
          Track and trace asset ownership and transfer history in real-time
        </p>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Assets"
                value={stats.totalAssets}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Value"
                value={stats.totalValue}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Assets"
                value={stats.activeAssets}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Recent Transfers"
                value={stats.recentTransfers}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Search
                placeholder="Search assets by name, ID, or owner..."
                allowClear
                enterButton
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by Type"
                allowClear
                style={{ width: '100%' }}
                value={filterType}
                onChange={(value) => setFilterType(value)}
                suffixIcon={<FilterOutlined />}
              >
                {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                suffixIcon={<FilterOutlined />}
              >
                {Object.values(AssetStatus).map((status) => (
                  <Option key={status} value={status}>
                    {formatAssetStatus(status)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button icon={<ReloadOutlined />} onClick={loadAssets}>
                  Refresh
                </Button>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        {error && (
          <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
            Error: {error.message}
          </div>
        )}

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={assets}
            rowKey="assetId"
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: PAGINATION_DEFAULTS.PAGE_SIZE_OPTIONS.map(String),
              showTotal: (total) => `Total ${total} assets`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || PAGINATION_DEFAULTS.PAGE_SIZE);
              },
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No assets found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Asset Details Drawer */}
      <Drawer
        title="Asset Details"
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        {selectedAsset && (
          <AssetDetailsPanel
            asset={selectedAsset}
            history={assetHistory}
            onTransfer={(request) => {
              transferAsset(request)
                .then(() => {
                  message.success('Asset transferred successfully');
                  setDrawerVisible(false);
                  loadAssets();
                })
                .catch((err) => {
                  message.error(err.message || 'Failed to transfer asset');
                });
            }}
          />
        )}
      </Drawer>
    </div>
  );
};

export default AssetTraceabilityView;
