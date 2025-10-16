/**
 * Validator Dashboard Component
 *
 * Validator management, performance metrics, and staking controls
 * Connects to Phase2ValidatorResource.java for validator data
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Tooltip,
  Badge,
  Alert,
  Typography,
} from 'antd';
import {
  NodeIndexOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  LockOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Validator, StakingInfo } from '../../types/comprehensive';
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { UnderDevelopmentEmpty, ApiErrorEmpty } from '../common/EmptyState';
import { isFeatureEnabled } from '../../config/featureFlags';
import { handleApiError, isNotFoundError, type ApiError } from '../../utils/apiErrorHandler';
import { comprehensivePortalService } from '../../services/ComprehensivePortalService';

const { Text, Title } = Typography;

const ValidatorDashboard: React.FC = () => {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [stakeModalVisible, setStakeModalVisible] = useState<boolean>(false);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [stakeForm] = Form.useForm();

  // Feature flag check
  const isFeatureAvailable = isFeatureEnabled('validatorDashboard');

  // Staking information
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    totalStaked: 0,
    totalValidators: 0,
    activeValidators: 0,
    minStakeRequired: 0,
    unbondingPeriod: 0,
    averageApr: 0,
    stakingRatio: 0,
  });

  // Fetch validators from backend
  const fetchValidators = async () => {
    setLoading(true);
    setError(null);

    try {
      // CRITICAL: NO MOCK DATA - Only real backend API calls
      const validatorsData = await comprehensivePortalService.getValidators();
      const stakingInfoData = await comprehensivePortalService.getStakingInfo();

      setValidators(validatorsData);
      setStakingInfo(stakingInfoData as StakingInfo);
    } catch (err) {
      const apiError = handleApiError(err, {
        customMessage: 'Failed to load validator data',
      });
      setError(apiError);

      // If 404, feature is not available yet
      if (isNotFoundError(apiError)) {
        console.warn('Validator API endpoints not implemented yet');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if feature is enabled
    if (isFeatureAvailable) {
      fetchValidators();

      const interval = setInterval(() => {
        fetchValidators();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isFeatureAvailable]);

  // Handle staking
  const handleStake = (validator: Validator) => {
    setSelectedValidator(validator);
    setStakeModalVisible(true);
  };

  const handleStakeSubmit = async (_values: any) => {
    // TODO: Implement staking API call
    setStakeModalVisible(false);
    stakeForm.resetFields();
  };

  // Table columns
  const columns: ColumnsType<Validator> = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      sorter: (a, b) => a.rank - b.rank,
      render: (rank: number) => {
        let icon = null;
        if (rank === 1) icon = <TrophyOutlined style={{ color: '#FFD700' }} />;
        else if (rank === 2) icon = <TrophyOutlined style={{ color: '#C0C0C0' }} />;
        else if (rank === 3) icon = <TrophyOutlined style={{ color: '#CD7F32' }} />;
        return (
          <Space>
            {icon}
            <Text strong>#{rank}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Validator',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.id}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Jailed', value: 'jailed' },
        { text: 'Unbonding', value: 'unbonding' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: Validator['status']) => {
        const config = {
          active: { icon: <CheckCircleOutlined />, color: 'success', text: 'Active' },
          inactive: { icon: <PauseCircleOutlined />, color: 'default', text: 'Inactive' },
          jailed: { icon: <CloseCircleOutlined />, color: 'error', text: 'Jailed' },
          unbonding: { icon: <LockOutlined />, color: 'warning', text: 'Unbonding' },
        };
        return (
          <Tag icon={config[status].icon} color={config[status].color}>
            {config[status].text}
          </Tag>
        );
      },
    },
    {
      title: 'Voting Power',
      dataIndex: 'votingPower',
      key: 'votingPower',
      width: 150,
      sorter: (a, b) => a.votingPower - b.votingPower,
      render: (power: number) => (
        <div>
          <Text strong>{power.toFixed(2)}%</Text>
          <Progress percent={power} size="small" showInfo={false} strokeColor="#1890ff" />
        </div>
      ),
    },
    {
      title: 'Total Stake',
      dataIndex: 'totalStake',
      key: 'totalStake',
      width: 140,
      sorter: (a, b) => a.totalStake - b.totalStake,
      render: (stake: number) => <Text>{(stake / 1000000).toFixed(2)}M AUR</Text>,
    },
    {
      title: 'Commission',
      dataIndex: 'commission',
      key: 'commission',
      width: 100,
      render: (commission: number) => <Text>{commission}%</Text>,
    },
    {
      title: 'APR',
      dataIndex: 'apr',
      key: 'apr',
      width: 100,
      sorter: (a, b) => a.apr - b.apr,
      render: (apr: number) => (
        <Text strong style={{ color: apr > 15 ? '#52c41a' : '#1890ff' }}>
          {apr.toFixed(1)}%
        </Text>
      ),
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 120,
      sorter: (a, b) => a.uptime - b.uptime,
      render: (uptime: number) => (
        <Tooltip title={`${uptime.toFixed(2)}% uptime`}>
          <Progress
            percent={uptime}
            size="small"
            strokeColor={uptime > 99 ? '#52c41a' : uptime > 95 ? '#faad14' : '#ff4d4f'}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Blocks Proposed',
      dataIndex: 'blocksProposed',
      key: 'blocksProposed',
      width: 130,
      sorter: (a, b) => a.blocksProposed - b.blocksProposed,
      render: (blocks: number) => <Badge count={blocks} showZero color="#52c41a" />,
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleStake(record)}
            disabled={record.status !== 'active'}
          >
            Stake
          </Button>
        </Space>
      ),
    },
  ];

  // Feature not available
  if (!isFeatureAvailable) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Validator Dashboard</Title>
          <Text type="secondary">Manage validators and stake your tokens to earn rewards</Text>
          <Card style={{ marginTop: '24px' }}>
            <UnderDevelopmentEmpty
              title="Validator Dashboard Under Development"
              description="The Validator Dashboard backend API is currently being developed. This feature will be available in an upcoming release."
            />
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (loading && validators.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Validator Dashboard</Title>
          <Text type="secondary">Manage validators and stake your tokens to earn rewards</Text>
          <div style={{ marginTop: '24px' }}>
            <StatsCardSkeleton count={4} />
            <Card style={{ marginTop: '24px' }}>
              <TableSkeleton rows={10} columns={8} />
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Error state with retry
  if (error && !loading) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>Validator Dashboard</Title>
          <Text type="secondary">Manage validators and stake your tokens to earn rewards</Text>
          <Card style={{ marginTop: '24px' }}>
            {isNotFoundError(error) ? (
              <UnderDevelopmentEmpty
                title="Validator API Not Available"
                description="The backend API endpoint for validator data is not yet implemented. This feature is coming soon."
                onRetry={fetchValidators}
              />
            ) : (
              <ApiErrorEmpty
                title="Failed to Load Validators"
                description={error.details || 'Unable to fetch validator data from the backend API.'}
                onRetry={fetchValidators}
              />
            )}
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Validator Dashboard</Title>
        <Text type="secondary">Manage validators and stake your tokens to earn rewards</Text>

        {/* Error Alert (non-blocking) */}
        {error && validators.length > 0 && (
          <Alert
            message="Connection Issue"
            description="Unable to fetch latest validator data. Showing cached data."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={fetchValidators}>
                Retry
              </Button>
            }
          />
        )}

        {/* Staking Overview */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Staked"
              value={stakingInfo.totalStaked / 1000000}
              precision={2}
              suffix="M AUR"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Validators"
              value={stakingInfo.activeValidators}
              suffix={`/ ${stakingInfo.totalValidators}`}
              prefix={<NodeIndexOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average APR"
              value={stakingInfo.averageApr}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Staking Ratio"
              value={stakingInfo.stakingRatio * 100}
              precision={1}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Staking Info Alert */}
      <Alert
        message="Staking Information"
        description={
          <Space direction="vertical" size="small">
            <Text>
              <strong>Minimum Stake:</strong> {stakingInfo.minStakeRequired.toLocaleString()} AUR
            </Text>
            <Text>
              <strong>Unbonding Period:</strong> {stakingInfo.unbondingPeriod} days
            </Text>
            <Text>
              <strong>Reward Distribution:</strong> Every epoch (approximately 24 hours)
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Validators Table */}
      <Card title="Validators">
        <Table
          columns={columns}
          dataSource={validators}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Staking Modal */}
      <Modal
        title={`Stake to ${selectedValidator?.name || 'Validator'}`}
        open={stakeModalVisible}
        onCancel={() => setStakeModalVisible(false)}
        footer={null}
      >
        <Form form={stakeForm} layout="vertical" onFinish={handleStakeSubmit}>
          <Alert
            message="Validator Information"
            description={
              selectedValidator && (
                <Space direction="vertical" size="small">
                  <Text>
                    <strong>Commission:</strong> {selectedValidator.commission}%
                  </Text>
                  <Text>
                    <strong>Current APR:</strong> {selectedValidator.apr.toFixed(1)}%
                  </Text>
                  <Text>
                    <strong>Uptime:</strong> {selectedValidator.uptime.toFixed(2)}%
                  </Text>
                </Space>
              )
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="Amount to Stake"
            name="amount"
            rules={[
              { required: true, message: 'Please enter stake amount' },
              {
                type: 'number',
                min: stakingInfo.minStakeRequired,
                message: `Minimum stake is ${stakingInfo.minStakeRequired.toLocaleString()} AUR`,
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter amount"
              suffix="AUR"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item label="Lock Period" name="lockPeriod" initialValue="flexible">
            <Select>
              <Select.Option value="flexible">Flexible (Standard APR)</Select.Option>
              <Select.Option value="30d">30 Days (+2% APR Bonus)</Select.Option>
              <Select.Option value="90d">90 Days (+5% APR Bonus)</Select.Option>
              <Select.Option value="180d">180 Days (+10% APR Bonus)</Select.Option>
            </Select>
          </Form.Item>

          <Alert
            message={`Unbonding Period: ${stakingInfo.unbondingPeriod} days`}
            description="After unstaking, your tokens will be locked for the unbonding period before you can withdraw them."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStakeModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<LockOutlined />}>
                Confirm Stake
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </ErrorBoundary>
  );
};

// Mock data generator - DEPRECATED (kept for reference only)
// CRITICAL: This is NOT used anymore - all data comes from real backend API
const generateMockValidators = (count: number): Validator[] => {
  const statuses: Validator['status'][] = [
    'active',
    'active',
    'active',
    'active',
    'inactive',
    'jailed',
  ];

  return Array.from({ length: count }, (_, i) => {
    const totalStake = Math.random() * 10000000 + 1000000;
    const votingPower = (totalStake / 50000000) * 100;

    return {
      id: `validator-${i.toString().padStart(2, '0')}`,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      name: `Validator ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)] as Validator['status'],
      votingPower,
      commission: Math.floor(Math.random() * 10) + 5,
      totalStake,
      selfStake: totalStake * (0.1 + Math.random() * 0.3),
      delegatorCount: Math.floor(Math.random() * 500) + 50,
      uptime: 95 + Math.random() * 4.9,
      blocksProposed: Math.floor(Math.random() * 10000) + 1000,
      blocksSigned: Math.floor(Math.random() * 50000) + 10000,
      missedBlocks: Math.floor(Math.random() * 100),
      slashingEvents: Math.floor(Math.random() * 3),
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      apr: 10 + Math.random() * 10,
      rank: i + 1,
    };
  });
};

export default ValidatorDashboard;
