import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Select,
  Timeline,
  Empty,
  Divider,
} from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface BlockchainEvent {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  logIndex: number;
  contractAddress: string;
  eventSignature: string;
  eventData: string[];
  indexedData: Record<string, string>;
  timestamp: number;
  eventType: string;
}

interface EventFilter {
  contractAddress?: string;
  eventSignatures: string[];
  fromBlock?: number;
  toBlock?: number;
}

const EventFilterExplorer: React.FC = () => {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedEvent, setSelectedEvent] = useState<BlockchainEvent | null>(null);
  const [eventStats, setEventStats] = useState({
    total: 0,
    transfer: 0,
    approval: 0,
    custom: 0,
  });

  const commonEventSignatures = [
    { label: 'Transfer(address,address,uint256)', value: 'Transfer(address,address,uint256)' },
    { label: 'Approval(address,address,uint256)', value: 'Approval(address,address,uint256)' },
    { label: 'Swap(address,uint256,uint256,uint256,uint256,address)', value: 'Swap' },
    { label: 'LiquidityAdd (Mint)', value: 'LiquidityAdd' },
  ];

  // Query historical events
  const queryEvents = async (filters: EventFilter) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v11/blockchain/events/query`,
        filters
      );
      setEvents(response.data || []);
      updateEventStats(response.data || []);
      message.success(`Found ${response.data?.length || 0} events`);
      setIsFilterModalVisible(false);
    } catch (error) {
      message.error('Failed to query events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateEventStats = (eventList: BlockchainEvent[]) => {
    const stats = {
      total: eventList.length,
      transfer: eventList.filter((e) => e.eventType === 'TRANSFER').length,
      approval: eventList.filter((e) => e.eventType === 'APPROVAL').length,
      custom: eventList.filter((e) => e.eventType === 'CUSTOM').length,
    };
    setEventStats(stats);
  };

  const handleFilterSubmit = async (values: any) => {
    const filters: EventFilter = {
      eventSignatures: values.eventSignatures || [],
      contractAddress: values.contractAddress,
      fromBlock: values.fromBlock ? parseInt(values.fromBlock) : undefined,
      toBlock: values.toBlock ? parseInt(values.toBlock) : undefined,
    };
    await queryEvents(filters);
  };

  const columns = [
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (text: string) => {
        const colors: Record<string, string> = {
          TRANSFER: 'blue',
          APPROVAL: 'green',
          CUSTOM: 'orange',
          CUSTOM_CREATED: 'purple',
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: 'Event Signature',
      dataIndex: 'eventSignature',
      key: 'eventSignature',
      render: (text: string) => (
        <code style={{ fontSize: '12px' }}>{text.substring(0, 50)}...</code>
      ),
    },
    {
      title: 'Block #',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      width: 100,
    },
    {
      title: 'Contract',
      dataIndex: 'contractAddress',
      key: 'contractAddress',
      render: (text: string) => (
        <code style={{ fontSize: '11px' }}>
          {text.substring(0, 10)}...{text.substring(text.length - 8)}
        </code>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: number) => new Date(ts).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: BlockchainEvent) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedEvent(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>Event Filter & Explorer</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => setIsFilterModalVisible(true)}
            >
              Query Events
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setEvents([]);
                setEventStats({
                  total: 0,
                  transfer: 0,
                  approval: 0,
                  custom: 0,
                });
              }}
            >
              Clear
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Total Events"
                value={eventStats.total}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Transfer Events"
                value={eventStats.transfer}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Approval Events"
                value={eventStats.approval}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Custom Events"
                value={eventStats.custom}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
          <Divider />

          {events.length > 0 ? (
            <Table
              columns={columns}
              dataSource={events}
              rowKey="transactionHash"
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 1200 }}
            />
          ) : (
            <Empty
              description="No events queried yet"
              style={{ marginTop: '40px' }}
            />
          )}
        </Spin>
      </Card>

      {/* Filter Modal */}
      <Modal
        title="Query Blockchain Events"
        visible={isFilterModalVisible}
        onCancel={() => setIsFilterModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
        >
          <Form.Item
            label="Event Type"
            name="eventSignatures"
            rules={[{ required: true, message: 'Please select at least one event type' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select event types to filter"
              options={commonEventSignatures}
            />
          </Form.Item>

          <Form.Item
            label="Contract Address (Optional)"
            name="contractAddress"
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="From Block"
                name="fromBlock"
              >
                <Input type="number" placeholder="Latest" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="To Block"
                name="toBlock"
              >
                <Input type="number" placeholder="Latest" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" block htmlType="submit" loading={loading}>
            Query Events
          </Button>
        </Form>
      </Modal>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          title="Event Details"
          visible={!!selectedEvent}
          onCancel={() => setSelectedEvent(null)}
          footer={null}
          width={800}
        >
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <>
                    <p>
                      <strong>Transaction Hash:</strong>
                    </p>
                    <code>{selectedEvent.transactionHash}</code>
                  </>
                ),
              },
              {
                color: 'green',
                children: (
                  <>
                    <p>
                      <strong>Block Information:</strong>
                    </p>
                    <p>Block #: {selectedEvent.blockNumber}</p>
                    <p>Block Hash: {selectedEvent.blockHash}</p>
                  </>
                ),
              },
              {
                color: 'orange',
                children: (
                  <>
                    <p>
                      <strong>Event Details:</strong>
                    </p>
                    <p>Type: {selectedEvent.eventType}</p>
                    <p>Signature: {selectedEvent.eventSignature}</p>
                    <p>Log Index: {selectedEvent.logIndex}</p>
                  </>
                ),
              },
              {
                color: 'purple',
                children: (
                  <>
                    <p>
                      <strong>Contract:</strong>
                    </p>
                    <code>{selectedEvent.contractAddress}</code>
                  </>
                ),
              },
              {
                color: 'red',
                children: (
                  <>
                    <p>
                      <strong>Timestamp:</strong>
                    </p>
                    <p>{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  </>
                ),
              },
            ]}
          />

          {selectedEvent.indexedData && Object.keys(selectedEvent.indexedData).length > 0 && (
            <>
              <Divider />
              <h4>Indexed Parameters:</h4>
              {Object.entries(selectedEvent.indexedData).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <strong>{key}:</strong> <code>{value}</code>
                </div>
              ))}
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default EventFilterExplorer;
