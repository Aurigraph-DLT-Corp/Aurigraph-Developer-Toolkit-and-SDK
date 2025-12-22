import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Typography,
  Divider,
  Space,
  message,
  Breadcrumb,
  Tag,
  Tooltip,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  FolderOpenOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { enterpriseSettingsService, RWATSettings } from '../../services/EnterpriseSettingsService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const RWATAssetSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<RWATSettings | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await enterpriseSettingsService.getAdvancedSettings();
      setSettings(data.rwatSettings);
      form.setFieldsValue(data.rwatSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      message.error('Failed to load enterprise settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (values: RWATSettings) => {
    setSaving(true);
    try {
      await enterpriseSettingsService.updateAdvancedSettings({ rwatSettings: values });
      message.success('RWAT Asset settings updated successfully');
      setSettings(values);
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>Administration</Breadcrumb.Item>
        <Breadcrumb.Item>Settings</Breadcrumb.Item>
        <Breadcrumb.Item>RWAT Asset Path</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>
            <FolderOpenOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            RWAT Asset Configuration
          </Title>
          <Text type="secondary">
            Configure local filesystem paths and security parameters for Real-World Assets.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      <Alert
        message="System Path Configuration"
        description="These settings control how files associated with tokenized real-world assets are stored on the server. Ensure the prescribed paths have appropriate write permissions for the application process."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={settings || {}}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card
              title={
                <span>
                  <SettingOutlined style={{ marginRight: '8px' }} />
                  Storage Parameters
                </span>
              }
              bordered={false}
              className="premium-card"
              style={{ marginBottom: '24px' }}
            >
              <Form.Item
                name="assetStoragePath"
                label={
                  <span>
                    Asset Storage Path
                    <Tooltip title="Absolute or relative path where RWAT asset files will be stored.">
                      <InfoCircleOutlined style={{ marginLeft: '8px', color: '#8c8c8c' }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true, message: 'Please enter the storage path' }]}
              >
                <Input prefix={<FolderOpenOutlined />} placeholder="e.g. data/rwat-assets" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="maxAssetSizeMB"
                    label="Max Asset Size (MB)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={1} max={10240} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="allowedExtensions"
                    label="Allowed Extensions"
                    rules={[{ required: true }]}
                  >
                    <Select mode="tags" style={{ width: '100%' }} placeholder="Select or type extensions">
                      <Option value="pdf">PDF</Option>
                      <Option value="png">PNG</Option>
                      <Option value="jpg">JPG</Option>
                      <Option value="doc">DOC</Option>
                      <Option value="docx">DOCX</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <span>
                  <SafetyCertificateOutlined style={{ marginRight: '8px' }} />
                  Security & Versioning
                </span>
              }
              bordered={false}
              className="premium-card"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="versioningEnabled"
                    label="Enable Asset Versioning"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    Keep historical versions of asset documents when updated.
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="encryptionEnabled"
                    label="At-Rest Encryption"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    Encrypt all asset files before writing to the filesystem.
                  </Paragraph>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title="Current Path Status"
              bordered={false}
              className="premium-card"
              style={{ height: '100%' }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <FileProtectOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <Title level={4}>Directory Active</Title>
                <Tag color="success">Writable</Tag>
                <Tag color="processing">Persistent</Tag>
              </div>
              <Divider />
              <div style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text type="secondary">Total Assets:</Text>
                  <Text strong>1,452</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text type="secondary">Storage Used:</Text>
                  <Text strong>12.4 GB</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text type="secondary">Available Space:</Text>
                  <Text strong>487.6 GB</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Last Backup:</Text>
                  <Text strong>2 hours ago</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default RWATAssetSettings;
