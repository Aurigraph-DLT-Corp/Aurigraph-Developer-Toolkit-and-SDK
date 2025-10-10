/**
 * Demo App Main Container Component
 *
 * Main container for the Real-Time Node Visualization Demo App
 */

import { Tabs } from 'antd';
import { AppstoreOutlined, LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { selectActiveDashboard } from '../../store/selectors';
import { setActiveDashboard } from '../../store/demoAppSlice';
import SpatialDashboard from './SpatialDashboard';
import VizorDashboard from './VizorDashboard';
import NetworkConfigPanel from './NetworkConfigPanel';

const { TabPane } = Tabs;

export const DemoApp = () => {
  const dispatch = useAppDispatch();
  const activeDashboard = useAppSelector(selectActiveDashboard);

  const handleTabChange = (key: string) => {
    dispatch(setActiveDashboard(key as 'spatial' | 'vizor' | 'config'));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Tabs activeKey={activeDashboard} onChange={handleTabChange} size="large">
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              Network Config
            </span>
          }
          key="config"
        >
          <NetworkConfigPanel />
        </TabPane>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined />
              Spatial View
            </span>
          }
          key="spatial"
        >
          <SpatialDashboard />
        </TabPane>
        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              Vizor Charts
            </span>
          }
          key="vizor"
        >
          <VizorDashboard />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DemoApp;
