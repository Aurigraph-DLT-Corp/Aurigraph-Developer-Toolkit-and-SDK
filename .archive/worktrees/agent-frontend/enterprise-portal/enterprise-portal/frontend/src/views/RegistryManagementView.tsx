/**
 * Registry Management View
 *
 * Unified search interface across all 5 registry types
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Tabs,
  Statistic,
  message,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TeamOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TabsProps } from 'antd';
import { useRegistry } from '../hooks/useRegistry';
import { RegistryType, REGISTRY_TYPE_LABELS } from '../utils/assetConstants';
import RegistrySearchResults from '../components/RegistrySearchResults';
import SmartContractRegistryView from './SmartContractRegistryView';
import ComplianceRegistryView from './ComplianceRegistryView';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RegistryManagementView: React.FC = () => {
  // Hooks
  const { searchRegistries, loading, error, searchResults, total } = useRegistry({
    enableWebSocket: true,
  });

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistryType, setSelectedRegistryType] = useState<RegistryType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState('search');

  /**
   * Handle search
   */
  const handleSearch = async () => {
    try {
      await searchRegistries({
        query: searchQuery || undefined,
        registryType: selectedRegistryType,
        status: filterStatus,
        fromDate: dateRange?.[0]?.toISOString(),
        toDate: dateRange?.[1]?.toISOString(),
        page: currentPage,
        pageSize,
      });
    } catch (err: any) {
      message.error(err.message || 'Failed to search registries');
    }
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    setSearchQuery('');
    setSelectedRegistryType(undefined);
    setFilterStatus(undefined);
    setDateRange(null);
    setCurrentPage(1);
  };

  /**
   * Tab items
   */
  const tabItems: TabsProps['items'] = [
    {
      key: 'search',
      label: (
        <span>
          <SearchOutlined /> Unified Search
        </span>
      ),
      children: (
        <div>
          {/* Search Filters */}
          <Card style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={16} align="middle">
                <Col xs={24} md={8}>
                  <Search
                    placeholder="Search across all registries..."
                    allowClear
                    enterButton
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={handleSearch}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col xs={12} md={5}>
                  <Select
                    placeholder="Registry Type"
                    allowClear
                    style={{ width: '100%' }}
                    value={selectedRegistryType}
                    onChange={(value) => setSelectedRegistryType(value)}
                  >
                    {Object.entries(REGISTRY_TYPE_LABELS).map(([key, label]) => (
                      <Option key={key} value={key}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={12} md={5}>
                  <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: '100%' }}
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value)}
                  >
                    <Option value="ACTIVE">Active</Option>
                    <Option value="INACTIVE">Inactive</Option>
                    <Option value="PENDING">Pending</Option>
                    <Option value="DEPLOYED">Deployed</Option>
                    <Option value="VALID">Valid</Option>
                    <Option value="EXPIRED">Expired</Option>
                  </Select>
                </Col>
                <Col xs={24} md={6}>
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleSearch}>
                      Search
                    </Button>
                    <Button onClick={handleReset}>Reset</Button>
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <RangePicker
                    style={{ width: '100%' }}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as any)}
                    format="YYYY-MM-DD"
                  />
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Search Results */}
          <RegistrySearchResults
            results={searchResults}
            total={total}
            loading={loading}
            error={error}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      ),
    },
    {
      key: 'smart-contract',
      label: (
        <span>
          <FileTextOutlined /> Smart Contracts
        </span>
      ),
      children: <SmartContractRegistryView />,
    },
    {
      key: 'compliance',
      label: (
        <span>
          <SafetyOutlined /> Compliance
        </span>
      ),
      children: <ComplianceRegistryView />,
    },
    {
      key: 'asset',
      label: (
        <span>
          <DatabaseOutlined /> Assets
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <h3>Asset Registry</h3>
            <p style={{ color: '#8c8c8c' }}>Asset Registry view coming soon</p>
          </div>
        </Card>
      ),
    },
    {
      key: 'identity',
      label: (
        <span>
          <TeamOutlined /> Identity
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <h3>Identity Registry</h3>
            <p style={{ color: '#8c8c8c' }}>Identity Registry view coming soon</p>
          </div>
        </Card>
      ),
    },
    {
      key: 'transaction',
      label: (
        <span>
          <SwapOutlined /> Transactions
        </span>
      ),
      children: (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <SwapOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <h3>Transaction Registry</h3>
            <p style={{ color: '#8c8c8c' }}>Transaction Registry view coming soon</p>
          </div>
        </Card>
      ),
    },
  ];

  /**
   * Initial load
   */
  useEffect(() => {
    if (activeTab === 'search') {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, activeTab]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Registry Management</h2>
        <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
          Search and manage records across all blockchain registries
        </p>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Smart Contracts"
                value={0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Compliance Certs"
                value={0}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Assets"
                value={0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Identities"
                value={0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Transactions"
                value={0}
                prefix={<SwapOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Total Records"
                value={total}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        type="card"
      />
    </div>
  );
};

export default RegistryManagementView;
