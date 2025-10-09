/**
 * System Metrics Cards Component
 *
 * Displays 4 key metric cards: TPS, Latency, Active Nodes, System Health
 */

import { Card, Row, Col, Statistic, Badge } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/useRedux';
import {
  selectPerformanceSummary,
  selectNodesCountByType,
  selectSystemHealth,
} from '../../store/selectors';

export const SystemMetricsCards = () => {
  const performanceSummary = useAppSelector(selectPerformanceSummary);
  const nodesCount = useAppSelector(selectNodesCountByType);
  const systemHealth = useAppSelector(selectSystemHealth);

  const healthConfig = {
    healthy: { color: 'success', text: 'Healthy' },
    degraded: { color: 'warning', text: 'Degraded' },
    critical: { color: 'error', text: 'Critical' },
  };

  const health = healthConfig[systemHealth.overall];

  return (
    <Row gutter={[16, 16]}>
      {/* TPS Card */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Current TPS"
            value={performanceSummary.currentTps}
            precision={0}
            prefix={<ThunderboltOutlined />}
            suffix="tx/s"
            valueStyle={{ color: '#1890ff' }}
          />
          <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
            Avg: {performanceSummary.avgTps.toFixed(0)} | Peak:{' '}
            {performanceSummary.peakTps.toFixed(0)}
          </div>
        </Card>
      </Col>

      {/* Latency Card */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Avg Latency"
            value={performanceSummary.avgLatency}
            precision={2}
            prefix={<ClockCircleOutlined />}
            suffix="ms"
            valueStyle={{ color: '#52c41a' }}
          />
          <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
            Total Transactions: {performanceSummary.totalTransactions.toLocaleString()}
          </div>
        </Card>
      </Col>

      {/* Active Nodes Card */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Nodes"
            value={nodesCount.total}
            prefix={<ClusterOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
          <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
            CH: {nodesCount.channel} | VAL: {nodesCount.validator} | BUS: {nodesCount.business} |
            SLIM: {nodesCount.slim}
          </div>
        </Card>
      </Col>

      {/* System Health Card */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="System Health"
            value={health.text}
            prefix={<CheckCircleOutlined />}
            valueStyle={{
              color: health.color === 'success' ? '#52c41a' : health.color === 'warning' ? '#faad14' : '#f5222d',
            }}
          />
          <div style={{ marginTop: 8, fontSize: '12px' }}>
            <Badge status={systemHealth.database ? 'success' : 'error'} text="DB" />
            {' | '}
            <Badge status={systemHealth.consensus ? 'success' : 'error'} text="Consensus" />
            {' | '}
            <Badge status={systemHealth.websocket ? 'success' : 'error'} text="WS" />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SystemMetricsCards;
