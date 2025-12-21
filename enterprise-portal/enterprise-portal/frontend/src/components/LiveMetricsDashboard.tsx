/**
 * Live Metrics Dashboard Component
 *
 * Displays real-time performance metrics via gRPC streaming
 * - TPS (Transactions Per Second)
 * - Network latency
 * - Memory usage
 * - CPU usage
 * - Connection status
 *
 * Migrated from WebSocket to gRPC streaming (V12)
 */

import { useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Space,
  Alert,
  Spin,
  Progress,
  Empty,
} from 'antd';
import {
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { useMetricsStream } from '../hooks/useGrpcStream';
import { updatePerformanceMetrics, setError } from '../store/liveDataSlice';
import type { RootState } from '../types/state';

const LiveMetricsDashboard = () => {
  const dispatch = useAppDispatch();
  const { performanceMetrics } = useAppSelector(
    (state: RootState) => state.liveData
  );

  // Use gRPC streaming instead of WebSocket
  const { data: metrics, status, error, isConnected } = useMetricsStream({
    autoConnect: true,
    updateIntervalMs: 1000,
  });

  const isConnecting = status === 'connecting';

  // Update Redux store when gRPC stream data arrives
  useEffect(() => {
    if (metrics) {
      dispatch(
        updatePerformanceMetrics({
          tps: metrics.value || 0,
          avgTps: metrics.statistics?.avg || metrics.value || 0,
          peakTps: metrics.statistics?.max || metrics.value || 0,
          totalTransactions: metrics.statistics?.sampleCount || 0,
          activeTransactions: 0,
          pendingTransactions: 0,
          avgLatencyMs: 0,
          p95LatencyMs: metrics.statistics?.p95 || 0,
          p99LatencyMs: metrics.statistics?.p99 || 0,
          memoryUsageMb: 0,
          cpuUsagePercent: 0,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [metrics, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      dispatch(setError({ channel: 'metrics', error: error.message }));
    }
  }, [error, dispatch]);

  const displayMetrics = performanceMetrics;

  // Alias for backward compatibility with template
  const metricsData = displayMetrics;

  // Format TPS for display
  const formatTps = (tps: number) => {
    if (tps >= 1000000) {
      return (tps / 1000000).toFixed(2) + 'M';
    } else if (tps >= 1000) {
      return (tps / 1000).toFixed(2) + 'K';
    }
    return tps.toFixed(0);
  };

  // Determine metric colors
  const getTpsColor = (tps: number) => {
    if (tps >= 2000000) return '#52c41a'; // Green - excellent
    if (tps >= 1500000) return '#1890ff'; // Blue - good
    if (tps >= 1000000) return '#faad14'; // Orange - fair
    return '#f5222d'; // Red - poor
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Connection Status */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <Badge
              status={isConnected ? 'success' : 'error'}
              text={isConnected ? 'Connected to Metrics Stream' : 'Disconnected'}
            />
          </Col>
          <Col xs={24} sm={12}>
            {isConnecting && <Spin size="small" style={{ marginRight: 8 }} />}
            <span style={{ fontSize: 12, color: '#666' }}>
              {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'No data'}
            </span>
          </Col>
        </Row>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert
          message="Metrics Error"
          description={error?.message}
          type="error"
          showIcon
          closable
        />
      )}

      {/* Loading State */}
      {isConnecting && !metrics && (
        <Card>
          <Spin tip="Connecting to metrics stream..." />
        </Card>
      )}

      {/* Main Metrics */}
      {metrics ? (
        <>
          {/* TPS Row */}
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderLeft: `4px solid ${getTpsColor(metrics.tps)}`,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255,255,255,0.85)' }}>Current TPS</span>
                  }
                  value={formatTps(metrics.tps)}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: 'white', fontSize: 28 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Average TPS"
                  value={formatTps(metrics.avgTps)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Peak TPS"
                  value={formatTps(metrics.peakTps)}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Transactions"
                  value={metrics.totalTransactions}
                  formatter={(value) => formatTps(value as number)}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Transaction States */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Active Transactions"
                  value={metrics.activeTransactions}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Pending Transactions"
                  value={metrics.pendingTransactions}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Transactions"
                  value={metrics.totalTransactions}
                  formatter={(value) => formatTps(value as number)}
                />
              </Card>
            </Col>
          </Row>

          {/* Latency Metrics */}
          <Card title="Latency Analysis">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Average Latency"
                  value={metrics.avgLatencyMs.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="P95 Latency"
                  value={metrics.p95LatencyMs.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="P99 Latency"
                  value={metrics.p99LatencyMs.toFixed(2)}
                  suffix="ms"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>

          {/* System Resources */}
          <Card title="System Resources">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span>Memory Usage</span>
                    <span style={{ float: 'right', fontWeight: 'bold' }}>
                      {metrics.memoryUsageMb.toFixed(0)} MB
                    </span>
                  </div>
                  <Progress
                    percent={Math.min((metrics.memoryUsageMb / 1024) * 100, 100)}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span>CPU Usage</span>
                    <span style={{ float: 'right', fontWeight: 'bold' }}>
                      {metrics.cpuUsagePercent.toFixed(1)} %
                    </span>
                  </div>
                  <Progress
                    percent={Math.min(metrics.cpuUsagePercent, 100)}
                    strokeColor={
                      metrics.cpuUsagePercent > 80
                        ? '#f5222d'
                        : metrics.cpuUsagePercent > 60
                          ? '#faad14'
                          : '#52c41a'
                    }
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* Last Update */}
          <Card size="small" style={{ textAlign: 'center', color: '#666' }}>
            <small>
              Last update: {new Date(metrics.timestamp).toLocaleTimeString()}
            </small>
          </Card>
        </>
      ) : (
        <Empty description="Waiting for metrics data..." />
      )}
    </Space>
  );
};

export default LiveMetricsDashboard;
