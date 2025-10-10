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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AIModel, AIOptimizationMetrics, PredictiveAnalytics } from '../../types/comprehensive';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const AIOptimizationControls: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [metrics, setMetrics] = useState<AIOptimizationMetrics | null>(null);
  const [predictions, setPredictions] = useState<PredictiveAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // AI model configurations
  const [consensusOptEnabled, setConsensusOptEnabled] = useState<boolean>(true);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState<boolean>(true);
  const [loadBalancingEnabled, setLoadBalancingEnabled] = useState<boolean>(true);
  const [learningRate, setLearningRate] = useState<number>(0.001);
  const [batchSize, setBatchSize] = useState<number>(64);

  // Fetch AI models and metrics
  const fetchAIData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls to AIOptimizationService.java
      const mockModels = generateMockModels();
      const mockMetrics = generateMockMetrics();
      const mockPredictions = generateMockPredictions();

      setModels(mockModels);
      setMetrics(mockMetrics);
      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();

    const interval = setInterval(() => {
      fetchAIData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle model retraining
  const handleRetrain = (modelId: string) => {
    console.log('Retraining model:', modelId);
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
        return <Tag icon={config[status].icon} color={config[status].color}>{status.toUpperCase()}</Tag>;
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
        <Button size="small" onClick={() => handleRetrain(record.id)} disabled={record.status === 'training'}>
          Retrain
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>AI Optimization Controls</Title>
      <Text type="secondary">Machine learning models for consensus optimization and predictive analytics</Text>

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
                <Tag color={predictions.predictions.networkLoad === 'low' ? 'green' : predictions.predictions.networkLoad === 'high' ? 'orange' : 'red'}>
                  {predictions.predictions.networkLoad.toUpperCase()}
                </Tag>
              </Text>
              <Text>
                <strong>Consensus Stability:</strong> {(predictions.predictions.consensusStability * 100).toFixed(1)}%
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
                            Leader Selection Accuracy: {(metrics.consensusOptimization.leaderSelectionAccuracy * 100).toFixed(1)}%
                          </Text>
                          <Text type="secondary">
                            Consensus Latency Reduction: {metrics.consensusOptimization.consensusLatencyReduction.toFixed(1)}%
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
                        <Text>Throughput Increase: +{metrics.transactionOrdering.throughputIncrease.toFixed(1)}%</Text>
                        <Text>Latency Reduction: -{metrics.transactionOrdering.latencyReduction.toFixed(1)}%</Text>
                        <Text>Ordering Accuracy: {(metrics.transactionOrdering.orderingAccuracy * 100).toFixed(1)}%</Text>
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="Model Hyperparameters">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text>Learning Rate: {learningRate}</Text>
                    <Slider min={0.0001} max={0.01} step={0.0001} value={learningRate} onChange={setLearningRate} />
                  </Col>
                  <Col span={12}>
                    <Text>Batch Size: {batchSize}</Text>
                    <Slider min={16} max={256} step={16} value={batchSize} onChange={setBatchSize} />
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
                      <Statistic title="Anomalies Detected" value={metrics.anomalyDetection.anomaliesDetected} prefix={<WarningOutlined />} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="False Positive Rate" value={metrics.anomalyDetection.falsePositiveRate} precision={2} suffix="%" />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="Detection Latency" value={metrics.anomalyDetection.detectionLatency} precision={0} suffix="ms" />
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
                      <Statistic title="Node Utilization" value={metrics.loadBalancing.nodeUtilization * 100} precision={1} suffix="%" />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="Distribution Efficiency" value={metrics.loadBalancing.distributionEfficiency * 100} precision={1} suffix="%" />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic title="Rebalance Events" value={metrics.loadBalancing.rebalanceEvents} />
                    </Card>
                  </Col>
                </Row>
              )}
            </Space>
          </TabPane>

          <TabPane tab="Model Management" key="models">
            <Table columns={columns} dataSource={models} loading={loading} rowKey="id" pagination={false} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Mock data generators
const generateMockModels = (): AIModel[] => [
  {
    id: 'model-1',
    name: 'Consensus Optimizer',
    type: 'consensus',
    status: 'active',
    accuracy: 0.95 + Math.random() * 0.04,
    lastTrainedAt: new Date(Date.now() - 3600000).toISOString(),
    version: 'v2.3.1',
    parameters: { learningRate: 0.001, batchSize: 64 },
  },
  {
    id: 'model-2',
    name: 'Transaction Ordering AI',
    type: 'transaction-ordering',
    status: 'active',
    accuracy: 0.92 + Math.random() * 0.05,
    lastTrainedAt: new Date(Date.now() - 7200000).toISOString(),
    version: 'v1.8.5',
    parameters: { learningRate: 0.001, batchSize: 128 },
  },
  {
    id: 'model-3',
    name: 'Anomaly Detector',
    type: 'anomaly-detection',
    status: 'active',
    accuracy: 0.97 + Math.random() * 0.02,
    lastTrainedAt: new Date(Date.now() - 1800000).toISOString(),
    version: 'v3.1.0',
    parameters: { learningRate: 0.0005, batchSize: 32 },
  },
  {
    id: 'model-4',
    name: 'Load Balancer',
    type: 'load-balancing',
    status: 'training',
    accuracy: 0.88 + Math.random() * 0.08,
    lastTrainedAt: new Date(Date.now() - 10800000).toISOString(),
    version: 'v1.5.2',
    parameters: { learningRate: 0.001, batchSize: 64 },
  },
];

const generateMockMetrics = (): AIOptimizationMetrics => ({
  consensusOptimization: {
    predictedTps: 2300000 + Math.random() * 200000,
    optimizationGain: 15 + Math.random() * 10,
    leaderSelectionAccuracy: 0.95 + Math.random() * 0.04,
    consensusLatencyReduction: 20 + Math.random() * 10,
  },
  transactionOrdering: {
    throughputIncrease: 12 + Math.random() * 8,
    latencyReduction: 18 + Math.random() * 7,
    orderingAccuracy: 0.93 + Math.random() * 0.05,
  },
  anomalyDetection: {
    anomaliesDetected: Math.floor(Math.random() * 50) + 10,
    falsePositiveRate: Math.random() * 2,
    detectionLatency: 50 + Math.random() * 30,
    threatsBlocked: Math.floor(Math.random() * 20) + 5,
  },
  loadBalancing: {
    nodeUtilization: 0.75 + Math.random() * 0.2,
    distributionEfficiency: 0.85 + Math.random() * 0.1,
    rebalanceEvents: Math.floor(Math.random() * 100) + 50,
  },
});

const generateMockPredictions = (): PredictiveAnalytics => ({
  timestamp: new Date().toISOString(),
  predictions: {
    nextHourTps: 2200000 + Math.random() * 300000,
    nextHourLatency: 10 + Math.random() * 5,
    networkLoad: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    consensusStability: 0.92 + Math.random() * 0.07,
    suggestedActions: [
      'Consider scaling validator count to handle predicted load',
      'Monitor network latency in next 30 minutes',
    ],
  },
});

export default AIOptimizationControls;
