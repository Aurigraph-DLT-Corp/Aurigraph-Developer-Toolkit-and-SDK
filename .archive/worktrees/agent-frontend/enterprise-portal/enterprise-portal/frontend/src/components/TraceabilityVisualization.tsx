/**
 * Traceability Visualization Component
 *
 * Simple timeline visualization for asset ownership flow
 * (D3.js integration can be added later for advanced visualizations)
 */

import React from 'react';
import { Card, Timeline, Tag, Empty } from 'antd';
import { NodeIndexOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { OwnershipRecord } from '../hooks/useAssetTraceability';
import { formatDateTime, formatRelativeTime, formatCurrency } from '../utils/formatters';

interface TraceabilityVisualizationProps {
  records: OwnershipRecord[];
  assetName?: string;
  currency?: string;
}

const TraceabilityVisualization: React.FC<TraceabilityVisualizationProps> = ({
  records,
  assetName,
  currency = 'USD',
}) => {
  if (!records || records.length === 0) {
    return (
      <Card>
        <Empty description="No ownership history available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <NodeIndexOutlined /> Ownership Flow Visualization
        </span>
      }
    >
      {assetName && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
          <strong>Asset:</strong> {assetName}
        </div>
      )}

      <Timeline mode="alternate">
        {/* Initial state (creation) */}
        <Timeline.Item
          color="green"
          dot={<UserOutlined style={{ fontSize: '16px' }} />}
          label={
            <div style={{ fontSize: '12px' }}>
              <strong>Asset Created</strong>
              <br />
              {formatDateTime(records[records.length - 1].timestamp)}
            </div>
          }
        >
          <Card size="small" style={{ maxWidth: '300px' }}>
            <div>
              <Tag color="green">Initial Owner</Tag>
              <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                {records[records.length - 1].previousOwner}
              </div>
            </div>
          </Card>
        </Timeline.Item>

        {/* Ownership transfers */}
        {records
          .slice()
          .reverse()
          .map((record, index) => (
            <Timeline.Item
              key={record.recordId}
              color={index === records.length - 1 ? 'blue' : 'gray'}
              dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
              label={
                <div style={{ fontSize: '12px' }}>
                  <strong>Transfer #{records.length - index}</strong>
                  <br />
                  {formatDateTime(record.timestamp)}
                  <br />
                  <span style={{ color: '#8c8c8c' }}>{formatRelativeTime(record.timestamp)}</span>
                </div>
              }
            >
              <Card
                size="small"
                style={{
                  maxWidth: '300px',
                  background: index === records.length - 1 ? '#e6f7ff' : undefined,
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <Tag color="red">From</Tag>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>{record.previousOwner}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Tag color="green">To</Tag>
                  <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {record.newOwner}
                  </div>
                </div>
                {record.transferPrice && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#f0f2f5', borderRadius: '4px' }}>
                    <strong>Price:</strong> {formatCurrency(record.transferPrice, currency)}
                  </div>
                )}
                {record.notes && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#595959',
                      fontStyle: 'italic',
                      borderLeft: '3px solid #d9d9d9',
                      paddingLeft: '8px',
                    }}
                  >
                    {record.notes}
                  </div>
                )}
                {record.transactionHash && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#8c8c8c',
                    }}
                  >
                    Tx: {record.transactionHash.substring(0, 16)}...
                  </div>
                )}
              </Card>
            </Timeline.Item>
          ))}

        {/* Current state */}
        <Timeline.Item
          color="green"
          dot={<UserOutlined style={{ fontSize: '16px' }} />}
          label={
            <div style={{ fontSize: '12px' }}>
              <strong>Current Owner</strong>
            </div>
          }
        >
          <Card size="small" style={{ maxWidth: '300px', background: '#f6ffed' }}>
            <div>
              <Tag color="green">Current Owner</Tag>
              <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{records[0].newOwner}</div>
            </div>
          </Card>
        </Timeline.Item>
      </Timeline>

      {/* Stats Summary */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fafafa',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ textAlign: 'center', margin: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{records.length}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Total Transfers</div>
        </div>
        <div style={{ textAlign: 'center', margin: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
            {new Set([...records.map((r) => r.previousOwner), ...records.map((r) => r.newOwner)]).size}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Unique Owners</div>
        </div>
        <div style={{ textAlign: 'center', margin: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
            {records.filter((r) => r.transferPrice).length}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Paid Transfers</div>
        </div>
      </div>
    </Card>
  );
};

export default TraceabilityVisualization;
