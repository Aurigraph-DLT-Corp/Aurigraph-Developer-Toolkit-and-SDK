/**
 * Asset Details Panel
 *
 * Side panel displaying asset details, ownership history, and transfer functionality
 */

import React, { useState } from 'react';
import {
  Descriptions,
  Timeline,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Tag,
  Divider,
  Collapse,
  Empty,
  Tooltip,
} from 'antd';
import {
  SwapOutlined,
  HistoryOutlined,
  FileTextOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Asset, AssetHistory, AssetTransferRequest } from '../hooks/useAssetTraceability';
import { ASSET_TYPE_LABELS, STATUS_COLORS } from '../utils/assetConstants';
import {
  formatCurrency,
  formatAssetStatus,
  formatDateTime,
  formatRelativeTime,
  truncateHash,
} from '../utils/formatters';

const { Panel } = Collapse;
const { TextArea } = Input;

interface AssetDetailsPanelProps {
  asset: Asset;
  history: AssetHistory | null;
  onTransfer: (request: AssetTransferRequest) => void;
}

const AssetDetailsPanel: React.FC<AssetDetailsPanelProps> = ({ asset, history, onTransfer }) => {
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [form] = Form.useForm();

  /**
   * Handle transfer submit
   */
  const handleTransferSubmit = async () => {
    try {
      const values = await form.validateFields();
      onTransfer({
        assetId: asset.assetId,
        newOwner: values.newOwner,
        transferPrice: values.transferPrice,
        notes: values.notes,
      });
      setTransferModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div>
      {/* Asset Details */}
      <Descriptions
        title="Asset Information"
        bordered
        column={1}
        size="small"
        style={{ marginBottom: '24px' }}
      >
        <Descriptions.Item label="Asset ID">
          <Tooltip title={asset.assetId}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {truncateHash(asset.assetId, 16, 8)}
            </span>
          </Tooltip>
        </Descriptions.Item>
        <Descriptions.Item label="Asset Name">
          <strong>{asset.assetName}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag color="blue">{ASSET_TYPE_LABELS[asset.type]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Valuation">
          <strong style={{ fontSize: '16px', color: '#52c41a' }}>
            {formatCurrency(asset.valuation, asset.currency)}
          </strong>
        </Descriptions.Item>
        <Descriptions.Item label="Current Owner">{asset.currentOwner}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[asset.status]}>{formatAssetStatus(asset.status)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created">{formatDateTime(asset.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {formatDateTime(asset.updatedAt)}
          <span style={{ marginLeft: '8px', color: '#8c8c8c' }}>
            ({formatRelativeTime(asset.updatedAt)})
          </span>
        </Descriptions.Item>
      </Descriptions>

      {/* Transfer Button */}
      {asset.status === 'ACTIVE' && (
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={() => setTransferModalVisible(true)}
          block
          style={{ marginBottom: '24px' }}
        >
          Transfer Asset
        </Button>
      )}

      <Divider />

      {/* Ownership History */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>
          <HistoryOutlined /> Ownership History
        </h3>

        {history && history.ownershipRecords.length > 0 ? (
          <Timeline mode="left">
            {history.ownershipRecords.map((record, index) => (
              <Timeline.Item
                key={record.recordId}
                color={index === 0 ? 'green' : 'blue'}
                dot={index === 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              >
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>{formatDateTime(record.timestamp)}</strong>
                    <br />
                    <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                      {formatRelativeTime(record.timestamp)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color="red">From: {record.previousOwner}</Tag>
                    <br />
                    <Tag color="green" style={{ marginTop: '4px' }}>
                      To: {record.newOwner}
                    </Tag>
                  </div>
                  {record.transferPrice && (
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Price: </strong>
                      {formatCurrency(record.transferPrice, asset.currency)}
                    </div>
                  )}
                  {record.transactionHash && (
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      <LinkOutlined /> {truncateHash(record.transactionHash, 10, 8)}
                    </div>
                  )}
                  {record.notes && (
                    <div style={{ marginTop: '8px', color: '#595959', fontStyle: 'italic' }}>
                      {record.notes}
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="No ownership history available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      {/* Audit Trail */}
      {history && history.auditTrail && history.auditTrail.length > 0 && (
        <>
          <Divider />
          <Collapse ghost>
            <Panel
              header={
                <span>
                  <FileTextOutlined /> Audit Trail ({history.auditTrail.length} entries)
                </span>
              }
              key="audit"
            >
              <Timeline mode="left">
                {history.auditTrail.map((entry, index) => (
                  <Timeline.Item key={index} color="gray">
                    <div>
                      <strong>{entry.action}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {entry.actor} - {formatDateTime(entry.timestamp)}
                      </span>
                      {entry.details && (
                        <pre
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '11px',
                            overflow: 'auto',
                          }}
                        >
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Panel>
          </Collapse>
        </>
      )}

      {/* Metadata */}
      {asset.metadata && Object.keys(asset.metadata).length > 0 && (
        <>
          <Divider />
          <Collapse ghost>
            <Panel header="Additional Metadata" key="metadata">
              <pre
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(asset.metadata, null, 2)}
              </pre>
            </Panel>
          </Collapse>
        </>
      )}

      {/* Transfer Modal */}
      <Modal
        title="Transfer Asset"
        open={transferModalVisible}
        onCancel={() => {
          setTransferModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setTransferModalVisible(false);
              form.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleTransferSubmit}>
            Transfer
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="New Owner Address"
            name="newOwner"
            rules={[
              { required: true, message: 'Please enter the new owner address' },
              { min: 10, message: 'Address must be at least 10 characters' },
            ]}
          >
            <Input placeholder="Enter new owner wallet address" />
          </Form.Item>

          <Form.Item
            label={`Transfer Price (${asset.currency})`}
            name="transferPrice"
            rules={[{ required: false }]}
          >
            <InputNumber
              placeholder="Enter transfer price"
              style={{ width: '100%' }}
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes" rules={[{ required: false }]}>
            <TextArea
              placeholder="Add any notes about this transfer (optional)"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div
            style={{
              padding: '12px',
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '4px',
            }}
          >
            <strong>Asset to Transfer:</strong>
            <br />
            {asset.assetName} ({ASSET_TYPE_LABELS[asset.type]})
            <br />
            <strong>Current Value:</strong> {formatCurrency(asset.valuation, asset.currency)}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetDetailsPanel;
