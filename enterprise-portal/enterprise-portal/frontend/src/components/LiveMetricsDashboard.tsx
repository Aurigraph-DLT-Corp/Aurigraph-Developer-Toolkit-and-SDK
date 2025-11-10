/**
 * Live Metrics Dashboard Component
 *
 * Displays real-time performance metrics from WebSocket
 * - TPS (Transactions Per Second)
 * - Network latency
 * - Memory usage
 * - CPU usage
 * - Connection status
 */

import { useMemo } from 'react';
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
  Divider,
  Empty,
} from 'antd';
import {
  ThunderboltOutlined,
  CloudServerOutlined,
  CopyOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { useWebSocket } from '../hooks/useWebSocket';
import { updatePerformanceMetrics, setConnectionState, setError } from '../store/liveDataSlice';
import type { RootState } from '../store/index';

const LiveMetricsDashboard = () => {
  const dispatch = useAppDispatch();
  const { performanceMetrics, connectionStates, errors } = useAppSelector(
    (state: RootState) => state.liveData
  );

  const { isConnected, isConnecting, error } = useWebSocket('metrics', {
    onMessage: (event) => {
      try {
        const data = event.data as any;
        if (data.tps !== undefined) {
          dispatch(
            updatePerformanceMetrics({
              tps: data.tps,
              avgTps: data.avgTps || data.tps,
              peakTps: data.peakTps || data.tps,
              totalTransactions: data.totalTransactions || 0,
              activeTransactions: data.activeTransactions || 0,
              pendingTransactions: data.pendingTransactions || 0,
              avgLatencyMs: data.avgLatencyMs || 0,
              p95LatencyMs: data.p95LatencyMs || 0,
              p99LatencyMs: data.p99LatencyMs || 0,
              memoryUsageMb: data.memoryUsageMb || 0,
              cpuUsagePercent: data.cpuUsagePercent || 0,
              timestamp: data.timestamp || new Date().toISOString(),
            })
          );
        }
      } catch (err: any) {
        console.error('Error processing metrics message:', err);
        dispatch(setError({ channel: 'metrics', error: err.message }));
      }
    },
    onConnect: () => {
      dispatch(setConnectionState({ channel: 'metrics', connected: true }));
      dispatch(setError({ channel: 'metrics', error: null }));
    },
    onDisconnect: () => {
      dispatch(setConnectionState({ channel: 'metrics', connected: false }));
    },
    onError: (err) => {
      dispatch(setError({ channel: 'metrics', error: err.message }));
    },
  });

  const metrics = performanceMetrics;

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
      {(error || errors.metrics) && (
        <Alert
          message="Metrics Error"
          description={error?.message || errors.metrics}
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
