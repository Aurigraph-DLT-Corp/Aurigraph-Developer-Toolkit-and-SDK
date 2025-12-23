/**
 * AI Optimization Controls Component
 *
 * ML model tuning, consensus optimization, and predictive analytics
 * Connects to ai/AIOptimizationService.java backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Switch,
  Slider,
  Button,
  Space,
  Tag,
  Progress,
  Alert,
  Typography,
  Tabs,
  Table,
} from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  AIModel,
  AIOptimizationMetrics,
  PredictiveAnalytics,
} from '../../types/comprehensive';
import ErrorBoundary from '../common/ErrorBoundary';
import { StatsCardSkeleton, CardSkeleton } from '../common/LoadingSkeleton';
import { UnderDevelopmentEmpty, ApiErrorEmpty } from '../common/EmptyState';
import { isFeatureEnabled } from '../../config/featureFlags';
import { handleApiError, isNotFoundError, type ApiError } from '../../utils/apiErrorHandler';
import { comprehensivePortalService } from '../../services/ComprehensivePortalService';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const AIOptimizationControls: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [metrics, setMetrics] = useState<AIOptimizationMetrics | null>(null);
  const [predictions, setPredictions] = useState<PredictiveAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Feature flag check
  const isFeatureAvailable = isFeatureEnabled('aiOptimization');

  // AI model configurations
  const [consensusOptEnabled, setConsensusOptEnabled] = useState<boolean>(true);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState<boolean>(true);
  const [loadBalancingEnabled, setLoadBalancingEnabled] = useState<boolean>(true);
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [batchSize, setBatchSize] = useState<number>(64);

  // Fetch AI models and metrics
  const fetchAIData = async () => {
    setLoading(true);
    setError(null);

    try {
      // CRITICAL: NO MOCK DATA - Only real backend API calls
      const [modelsData, metricsData, predictionsData] = await Promise.all([
        comprehensivePortalService.getAIModels(),
        comprehensivePortalService.getAIMetrics(),
        comprehensivePortalService.getPredictiveAnalytics(),
      ]);

      setModels(modelsData);
      setMetrics(metricsData);
      setPredictions(predictionsData as PredictiveAnalytics);
    } catch (err) {
      const apiError = handleApiError(err, {
        customMessage: 'Failed to load AI optimization data',
      });
      setError(apiError);

      // If 404, feature is not available yet
      if (isNotFoundError(apiError)) {
        console.warn('AI Optimization API endpoints not implemented yet');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if feature is enabled
    if (isFeatureAvailable) {
      fetchAIData();

      const interval = setInterval(() => {
        fetchAIData();
      }, 30000); // Reduced frequency to 30s for AI data

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isFeatureAvailable]);

  // Handle model retraining
  const handleRetrain = (_modelId: string) => {
    // TODO: Implement retraining API call
  };

  // Model table columns
  const columns: ColumnsType<AIModel> = [
    {
      title: 'Model',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Tag color="blue">{record.type}</Tag>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: AIModel['status']) => {
        const config = {
          active: { color: 'success', icon: <CheckCircleOutlined /> },
          training: { color: 'processing', icon: <SyncOutlined spin /> },
          disabled: { color: 'default', icon: <WarningOutlined /> },
        };
        return (
          <Tag icon={config[status].icon} color={config[status].color}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => (
        <div>
          <Text strong>{(accuracy * 100).toFixed(1)}%</Text>
          <Progress percent={accuracy * 100} size="small" showInfo={false} strokeColor="#52c41a" />
        </div>
      ),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Last Trained',
      dataIndex: 'lastTrainedAt',
      key: 'lastTrainedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => handleRetrain(record.id)}
          disabled={record.status === 'training'}
        >
          Retrain
        </Button>
      ),
    },
  ];

  // Feature not available
  if (!isFeatureAvailable) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>AI Optimization Controls</Title>
          <Text type="secondary">
            Machine learning models for consensus optimization and predictive analytics
          </Text>
          <Card style={{ marginTop: '24px' }}>
            <UnderDevelopmentEmpty
              title="AI Optimization Under Development"
              description="The AI Optimization backend API is currently being developed. Machine learning features will be available in an upcoming release."
            />
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (loading && models.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>AI Optimization Controls</Title>
          <Text type="secondary">
            Machine learning models for consensus optimization and predictive analytics
          </Text>
          <div style={{ marginTop: '24px' }}>
            <StatsCardSkeleton count={4} />
            <Card style={{ marginTop: '24px' }}>
              <CardSkeleton />
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Error state with retry
  if (error && !loading && models.length === 0) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '24px' }}>
          <Title level={2}>AI Optimization Controls</Title>
          <Text type="secondary">
            Machine learning models for consensus optimization and predictive analytics
          </Text>
          <Card style={{ marginTop: '24px' }}>
            {isNotFoundError(error) ? (
              <UnderDevelopmentEmpty
                title="AI Optimization API Not Available"
                description="The backend API endpoint for AI optimization is not yet implemented. This feature is coming soon."
                onRetry={fetchAIData}
              />
            ) : (
              <ApiErrorEmpty
                title="Failed to Load AI Data"
                description={error.details || 'Unable to fetch AI optimization data from the backend API.'}
                onRetry={fetchAIData}
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
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>AI Optimization Controls</Title>
            <Text type="secondary">
              Machine learning models for consensus optimization and predictive analytics
            </Text>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={fetchAIData} loading={loading}>
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Error Alert (non-blocking) */}
        {error && models.length > 0 && (
          <Alert
            message="Connection Issue"
            description="Unable to fetch latest AI data. Showing cached data."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" onClick={fetchAIData}>
                Retry
              </Button>
            }
          />
        )}

        {/* AI Status Overview */}
        <Row gutter={[16, 16]} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Models"
              value={models.filter((m) => m.status === 'active').length}
              suffix={`/ ${models.length}`}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Predicted TPS"
              value={metrics?.consensusOptimization.predictedTps || 0}
              precision={0}
              suffix="tx/s"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Optimization Gain"
              value={metrics?.consensusOptimization.optimizationGain || 0}
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
              title="Threats Blocked"
              value={metrics?.anomalyDetection.threatsBlocked || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Predictive Analytics */}
      {predictions && (
        <Alert
          message="Predictive Analytics"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                <strong>Next Hour TPS Prediction:</strong>{' '}
                {predictions.predictions.nextHourTps.toFixed(0)} tx/s
              </Text>
              <Text>
                <strong>Network Load:</strong>{' '}
                <Tag
                  color={
                    predictions.predictions.networkLoad === 'low'
                      ? 'green'
                      : predictions.predictions.networkLoad === 'high'
                        ? 'orange'
                        : 'red'
                  }
                >
                  {predictions.predictions.networkLoad.toUpperCase()}
                </Tag>
              </Text>
              <Text>
                <strong>Consensus Stability:</strong>{' '}
                {(predictions.predictions.consensusStability * 100).toFixed(1)}%
              </Text>
              {predictions.predictions.suggestedActions.length > 0 && (
                <div>
                  <strong>Suggested Actions:</strong>
                  <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                    {predictions.predictions.suggestedActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Space>
          }
          type="info"
          showIcon
          icon={<LineChartOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* AI Configuration Tabs */}
      <Card>
        <Tabs defaultActiveKey="consensus">
          <TabPane tab="Consensus Optimization" key="consensus">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="Enable Consensus Optimization">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Text>AI-Driven Leader Selection:</Text>
                        <Switch checked={consensusOptEnabled} onChange={setConsensusOptEnabled} />
                      </Space>
                      {metrics && (
                        <>
                          <Text type="secondary">
                            Leader Selection Accuracy:{' '}
                            {(metrics.consensusOptimization.leaderSelectionAccuracy * 100).toFixed(
                              1
                            )}
                            %
                          </Text>
                          <Text type="secondary">
                            Consensus Latency Reduction:{' '}
                            {metrics.consensusOptimization.consensusLatencyReduction.toFixed(1)}%
                          </Text>
                        </>
                      )}
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Transaction Ordering">
                    {metrics && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text>
                          Throughput Increase: +
                          {metrics.transactionOrdering.throughputIncrease.toFixed(1)}%
                        </Text>
                        <Text>
                          Latency Reduction: -
                          {metrics.transactionOrdering.latencyReduction.toFixed(1)}%
                        </Text>
                        <Text>
                          Ordering Accuracy:{' '}
                          {(metrics.transactionOrdering.orderingAccuracy * 100).toFixed(1)}%
                        </Text>
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="Model Hyperparameters">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text>Learning Rate: {learningRate}</Text>
                    <Slider
                      min={0.0001}
                      max={0.01}
                      step={0.0001}
                      value={learningRate}
                      onChange={setLearningRate}
                    />
                  </Col>
                  <Col span={12}>
                    <Text>Batch Size: {batchSize}</Text>
                    <Slider
                      min={16}
                      max={256}
                      step={16}
                      value={batchSize}
                      onChange={setBatchSize}
                    />
                  </Col>
                </Row>
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="Anomaly Detection" key="anomaly">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card size="small" title="Enable Anomaly Detection">
                <Switch checked={anomalyDetectionEnabled} onChange={setAnomalyDetectionEnabled} />
              </Card>

              {metrics && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Anomalies Detected"
                        value={metrics.anomalyDetection.anomaliesDetected}
                        prefix={<WarningOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="False Positive Rate"
                        value={metrics.anomalyDetection.falsePositiveRate}
                        precision={2}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Detection Latency"
                        value={metrics.anomalyDetection.detectionLatency}
                        precision={0}
                        suffix="ms"
                      />
                    </Card>
                  </Col>
                </Row>
              )}
            </Space>
          </TabPane>

          <TabPane tab="Load Balancing" key="loadbalancing">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card size="small" title="Enable AI Load Balancing">
                <Switch checked={loadBalancingEnabled} onChange={setLoadBalancingEnabled} />
              </Card>

              {metrics && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Node Utilization"
                        value={metrics.loadBalancing.nodeUtilization * 100}
                        precision={1}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Distribution Efficiency"
                        value={metrics.loadBalancing.distributionEfficiency * 100}
                        precision={1}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Rebalance Events"
                        value={metrics.loadBalancing.rebalanceEvents}
                      />
                    </Card>
                  </Col>
                </Row>
              )}
            </Space>
          </TabPane>

          <TabPane tab="Model Management" key="models">
            <Table
              columns={columns}
              dataSource={models}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>
      </div>
    </ErrorBoundary>
  );
};

export default AIOptimizationControls;
