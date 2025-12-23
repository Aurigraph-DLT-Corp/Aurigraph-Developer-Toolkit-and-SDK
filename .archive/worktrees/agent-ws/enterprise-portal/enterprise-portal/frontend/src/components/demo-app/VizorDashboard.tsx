/**
 * Vizor Dashboard Component
 *
 * Real-time charts dashboard with TPS, latency, consensus, and transactions
 */

import { Row, Col, Space } from 'antd';
import TPSChart from './charts/TPSChart';
import SystemMetricsCards from './SystemMetricsCards';

export const VizorDashboard = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* System Metrics Cards */}
      <SystemMetricsCards />

      {/* Charts Grid */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <TPSChart />
        </Col>
      </Row>
    </Space>
  );
};

export default VizorDashboard;
