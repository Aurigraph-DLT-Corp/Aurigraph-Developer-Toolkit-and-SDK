/**
 * Spatial Dashboard Component
 *
 * 2D/3D node visualization dashboard
 */

import { Card, Empty, Space } from 'antd';
import { useAppSelector } from '../../hooks/useRedux';
import { selectNodesArray, selectSpatialViewMode } from '../../store/selectors';
import SystemMetricsCards from './SystemMetricsCards';

export const SpatialDashboard = () => {
  const nodes = useAppSelector(selectNodesArray);
  const viewMode = useAppSelector(selectSpatialViewMode);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* System Metrics Cards */}
      <SystemMetricsCards />

      {/* Spatial Visualization */}
      <Card title={`Spatial View (${viewMode.toUpperCase()})`} style={{ minHeight: 500 }}>
        <Empty
          description={
            nodes.length === 0
              ? 'No nodes created. Add nodes to visualize the network.'
              : 'Spatial visualization will be implemented with D3.js or Three.js'
          }
        />
        <div style={{ marginTop: 16, fontSize: '12px', color: '#8c8c8c' }}>
          Total Nodes: {nodes.length}
        </div>
      </Card>
    </Space>
  );
};

export default SpatialDashboard;
