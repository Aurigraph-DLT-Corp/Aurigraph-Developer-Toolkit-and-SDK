/**
 * Simulation Warning Component
 *
 * Displays a clear warning banner when demo is running in simulation mode
 * with dummy/mock data instead of real blockchain data.
 *
 * @version 1.0.0
 * @author Aurigraph DLT Team
 */

import React from 'react';
import { Alert, Space, Tag, Button, Tooltip } from 'antd';
import {
  WarningOutlined,
  ExperimentOutlined,
  ApiOutlined,
  SyncOutlined,
} from '@ant-design/icons';

export interface SimulationWarningProps {
  /** Whether the demo is currently running */
  isRunning?: boolean;
  /** Whether we're connected to real backend */
  isLiveMode?: boolean;
  /** Callback to attempt switching to live mode */
  onTryLiveMode?: () => void;
  /** Show compact version */
  compact?: boolean;
}

/**
 * Displays warning that demo data is simulated, not real blockchain data
 */
export const SimulationWarning: React.FC<SimulationWarningProps> = ({
  isRunning = false,
  isLiveMode = false,
  onTryLiveMode,
  compact = false,
}) => {
  if (isLiveMode) {
    return (
      <Alert
        message={
          <Space>
            <ApiOutlined />
            <span>Live Mode Active</span>
            <Tag color="green">Connected to V11 Backend</Tag>
          </Space>
        }
        description="Showing real-time data from Aurigraph V11 blockchain."
        type="success"
        showIcon
        icon={<ApiOutlined />}
        style={{ marginBottom: compact ? 8 : 16 }}
      />
    );
  }

  return (
    <Alert
      message={
        <Space wrap>
          <WarningOutlined />
          <span style={{ fontWeight: 'bold' }}>Simulation Mode</span>
          <Tag color="orange" icon={<ExperimentOutlined />}>
            DEMO DATA
          </Tag>
          {isRunning && (
            <Tag color="blue" icon={<SyncOutlined spin />}>
              SIMULATING
            </Tag>
          )}
        </Space>
      }
      description={
        compact ? (
          "Data shown is simulated for demonstration purposes."
        ) : (
          <div>
            <p style={{ marginBottom: 8 }}>
              <strong>This demo is running in simulation mode.</strong> All data displayed is
              generated locally for demonstration purposes and does not represent real blockchain
              transactions or consensus activity.
            </p>
            <ul style={{ marginBottom: 8, paddingLeft: 20 }}>
              <li>TPS metrics are simulated with random variance</li>
              <li>Transaction hashes are randomly generated (not real)</li>
              <li>Consensus status is simulated (no actual nodes)</li>
              <li>External API data (QuantConnect, Weather, News) is mocked</li>
            </ul>
            {onTryLiveMode && (
              <Tooltip title="Attempt to connect to the V11 backend for real data">
                <Button
                  type="primary"
                  size="small"
                  icon={<ApiOutlined />}
                  onClick={onTryLiveMode}
                >
                  Try Live Mode
                </Button>
              </Tooltip>
            )}
          </div>
        )
      }
      type="warning"
      showIcon
      icon={<ExperimentOutlined />}
      style={{ marginBottom: compact ? 8 : 16 }}
    />
  );
};

/**
 * Inline simulation indicator tag for use in headers/titles
 */
export const SimulationTag: React.FC<{ isLive?: boolean }> = ({ isLive = false }) => {
  if (isLive) {
    return (
      <Tooltip title="Connected to real V11 backend">
        <Tag color="green" icon={<ApiOutlined />}>
          LIVE
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Using simulated data - not connected to real blockchain">
      <Tag color="orange" icon={<ExperimentOutlined />}>
        SIMULATION
      </Tag>
    </Tooltip>
  );
};

/**
 * Data source indicator for individual metrics
 */
export const DataSourceIndicator: React.FC<{
  source: 'simulated' | 'live' | 'cached' | 'fallback';
  label?: string;
}> = ({ source, label }) => {
  const config = {
    simulated: { color: 'orange', icon: <ExperimentOutlined />, text: 'Simulated' },
    live: { color: 'green', icon: <ApiOutlined />, text: 'Live' },
    cached: { color: 'blue', icon: <SyncOutlined />, text: 'Cached' },
    fallback: { color: 'default', icon: <WarningOutlined />, text: 'Fallback' },
  };

  const { color, icon, text } = config[source];

  return (
    <Tooltip title={`Data source: ${text}${label ? ` - ${label}` : ''}`}>
      <Tag color={color} icon={icon} style={{ fontSize: '10px' }}>
        {label || text}
      </Tag>
    </Tooltip>
  );
};

export default SimulationWarning;
