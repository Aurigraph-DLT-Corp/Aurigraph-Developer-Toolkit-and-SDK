/**
 * RWAT Tokenization Form Component
 * Advanced form for tokenizing real-world assets with multi-step workflow
 */

import React, { useState, useCallback } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Steps,
  Card,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  Checkbox,
  DatePicker,
  Modal,
  Table,
  Empty,
} from 'antd';
import {
  FileAddOutlined,
  SafetyOutlined,
  GoldOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { AssetTokenizeRequest, AssetDocument, ComplianceInfo, AssetMetadata, AssetCategory } from '../../types/rwat';

const ASSET_CATEGORIES: AssetCategory[] = [
  'real_estate',
  'commodities',
  'art',
  'carbon_credits',
  'bonds',
  'equities',
  'precious_metals',
  'collectibles',
  'intellectual_property',
  'other',
];

const COMPLIANCE_JURISDICTIONS = [
  'US',
  'UK',
  'EU',
  'SINGAPORE',
  'HONG_KONG',
  'JAPAN',
  'AUSTRALIA',
  'CANADA',
];

interface TokenizationStep {
  title: string;
  description: string;
}

interface RWATTokenizationFormProps {
  onSubmit?: (data: AssetTokenizeRequest) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<AssetTokenizeRequest>;
}

const RWATTokenizationForm: React.FC<RWATTokenizationFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<AssetDocument[]>(initialData?.documents || []);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<AssetTokenizeRequest> | null>(null);

  const steps: TokenizationStep[] = [
    {
      title: 'Asset Details',
      description: 'Basic information about the asset',
    },
    {
      title: 'Tokenization Settings',
      description: 'Configure token parameters',
    },
    {
      title: 'Compliance & Documents',
      description: 'Compliance requirements and documentation',
    },
    {
      title: 'Review & Confirm',
      description: 'Review and submit tokenization request',
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleDocumentUpload = useCallback((file: UploadFile) => {
    const newDoc: AssetDocument = {
      id: `doc_${Date.now()}`,
      type: (file.name?.split('.')[0] as any) || 'other',
      name: file.name || 'Document',
      url: file.response?.url || '',
      hash: file.response?.hash || '',
      uploadedAt: new Date().toISOString(),
    };
    setDocuments([...documents, newDoc]);
    return false; // Prevent default upload behavior
  }, [documents]);

  const handleDocumentRemove = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  const handlePreview = () => {
    const formData = form.getFieldsValue();
    setPreviewData(formData);
    setPreviewModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const tokenizationRequest: AssetTokenizeRequest = {
        name: values.assetName,
        category: values.category,
        description: values.description,
        owner: values.owner,
        custodian: values.custodian,
        value: values.assetValue,
        valueCurrency: values.currency || 'USD',
        totalShares: values.totalShares,
        tokenSymbol: values.tokenSymbol,
        compliance: {
          kycRequired: values.kycRequired,
          amlVerified: values.amlVerified,
          accreditedInvestorsOnly: values.accreditedInvestorsOnly,
          jurisdictions: values.jurisdictions || [],
          complianceDocuments: documents
            .filter(d => d.type === 'compliance')
            .map(d => d.url),
        },
        metadata: {
          location: values.location,
          legalDescription: values.legalDescription,
          serialNumber: values.serialNumber,
          condition: values.condition,
          certifications: values.certifications,
        },
      };

      if (onSubmit) {
        await onSubmit(tokenizationRequest);
        Modal.success({
          title: 'Asset Tokenization Submitted',
          content: 'Your asset tokenization request has been successfully submitted for processing.',
        });
        form.resetFields();
        setCurrentStep(0);
        setDocuments([]);
      }
    } catch (error) {
      Modal.error({
        title: 'Tokenization Failed',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const documentColumns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AssetDocument) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} />
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDocumentRemove(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Card title="RWAT Tokenization Wizard" extra={<Tag color="gold">V1.0</Tag>}>
        <Steps current={currentStep} items={steps} onChange={handleStepChange} />

        <Divider />

        <Form form={form} layout="vertical" initialValues={initialData}>
          {/* Step 1: Asset Details */}
          {currentStep === 0 && (
            <div>
              <h3>
                <GoldOutlined /> Asset Information
              </h3>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="assetName"
                    label="Asset Name"
                    rules={[{ required: true, message: 'Asset name is required' }]}
                  >
                    <Input placeholder="e.g., Commercial Property - NYC" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="category"
                    label="Asset Category"
                    rules={[{ required: true, message: 'Category is required' }]}
                  >
                    <Select
                      placeholder="Select asset category"
                      options={ASSET_CATEGORIES.map(cat => ({
                        label: cat.replace(/_/g, ' ').toUpperCase(),
                        value: cat,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="Asset Description"
                rules={[{ required: true, message: 'Description is required' }]}
              >
                <Input.TextArea rows={3} placeholder="Detailed description of the asset" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="owner"
                    label="Asset Owner"
                    rules={[{ required: true, message: 'Owner is required' }]}
                  >
                    <Input placeholder="Owner name or entity" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="custodian" label="Custodian (Optional)">
                    <Input placeholder="Custodian name or entity" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="assetValue"
                    label="Asset Value"
                    rules={[{ required: true, message: 'Asset value is required' }]}
                  >
                    <InputNumber min={0} placeholder="Enter asset value" prefix="$" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                    initialValue="USD"
                  >
                    <Select
                      options={[
                        { label: 'USD', value: 'USD' },
                        { label: 'EUR', value: 'EUR' },
                        { label: 'GBP', value: 'GBP' },
                        { label: 'JPY', value: 'JPY' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="location"
                    label="Asset Location"
                  >
                    <Input placeholder="Physical location of asset" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="serialNumber"
                    label="Serial Number / ID"
                  >
                    <Input placeholder="Unique identifier for asset" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={24}>
                  <Form.Item
                    name="legalDescription"
                    label="Legal Description"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Legal description (e.g., property deed)"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button type="primary" onClick={() => handleStepChange(1)}>
                  Next: Tokenization Settings
                </Button>
                {onCancel && <Button onClick={onCancel}>Cancel</Button>}
              </Space>
            </div>
          )}

          {/* Step 2: Tokenization Settings */}
          {currentStep === 1 && (
            <div>
              <h3>Token Configuration</h3>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="tokenSymbol"
                    label="Token Symbol"
                    rules={[{ required: true, message: 'Token symbol is required' }]}
                  >
                    <Input
                      placeholder="e.g., PROP-001"
                      maxLength={10}
                      showCount
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="totalShares"
                    label="Total Shares"
                    rules={[{ required: true, message: 'Total shares is required' }]}
                  >
                    <InputNumber min={1} placeholder="Total number of shares" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="pricePerShare"
                label="Price Per Share (Calculated)"
              >
                <InputNumber disabled prefix="$" />
              </Form.Item>

              <Divider />

              <Space>
                <Button onClick={() => handleStepChange(0)}>
                  Back to Asset Details
                </Button>
                <Button type="primary" onClick={() => handleStepChange(2)}>
                  Next: Compliance
                </Button>
              </Space>
            </div>
          )}

          {/* Step 3: Compliance & Documents */}
          {currentStep === 2 && (
            <div>
              <h3>
                <SafetyOutlined /> Compliance & Documentation
              </h3>

              <Card size="small" style={{ marginBottom: 16 }} title="Compliance Requirements">
                <Form.Item name="kycRequired" valuePropName="checked" initialValue={true}>
                  <Checkbox>KYC (Know Your Customer) Required</Checkbox>
                </Form.Item>

                <Form.Item name="amlVerified" valuePropName="checked" initialValue={false}>
                  <Checkbox>AML (Anti-Money Laundering) Verified</Checkbox>
                </Form.Item>

                <Form.Item
                  name="accreditedInvestorsOnly"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Checkbox>Accredited Investors Only</Checkbox>
                </Form.Item>

                <Form.Item
                  name="jurisdictions"
                  label="Applicable Jurisdictions"
                >
                  <Select
                    mode="multiple"
                    placeholder="Select applicable jurisdictions"
                    options={COMPLIANCE_JURISDICTIONS.map(j => ({
                      label: j,
                      value: j,
                    }))}
                  />
                </Form.Item>
              </Card>

              <Card size="small" title="Documents">
                <Upload
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  beforeUpload={handleDocumentUpload}
                  maxCount={10}
                >
                  <Button icon={<FileAddOutlined />}>Upload Document</Button>
                </Upload>

                {documents.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <Table
                      dataSource={documents}
                      columns={documentColumns}
                      pagination={false}
                      size="small"
                      rowKey="id"
                    />
                  </div>
                ) : (
                  <Empty description="No documents uploaded" style={{ marginTop: 16 }} />
                )}
              </Card>

              <Divider />

              <Space>
                <Button onClick={() => handleStepChange(1)}>Back to Tokenization</Button>
                <Button type="primary" onClick={() => handleStepChange(3)}>
                  Next: Review & Confirm
                </Button>
              </Space>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 3 && (
            <div>
              <h3>
                <CheckCircleOutlined /> Review Tokenization Request
              </h3>

              <Button
                type="dashed"
                onClick={handlePreview}
                style={{ marginBottom: 16 }}
              >
                Preview Full Details
              </Button>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Asset Summary">
                    <p>
                      <strong>Name:</strong> {form.getFieldValue('assetName')}
                    </p>
                    <p>
                      <strong>Category:</strong> {form.getFieldValue('category')}
                    </p>
                    <p>
                      <strong>Value:</strong> ${form.getFieldValue('assetValue')}
                    </p>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Token Summary">
                    <p>
                      <strong>Symbol:</strong> {form.getFieldValue('tokenSymbol')}
                    </p>
                    <p>
                      <strong>Total Shares:</strong> {form.getFieldValue('totalShares')}
                    </p>
                    <p>
                      <strong>Documents:</strong> {documents.length} attached
                    </p>
                  </Card>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button onClick={() => handleStepChange(2)}>Back to Compliance</Button>
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={handleSubmit}
                  icon={<CheckCircleOutlined />}
                >
                  Submit Tokenization Request
                </Button>
                {onCancel && <Button onClick={onCancel}>Cancel</Button>}
              </Space>
            </div>
          )}
        </Form>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Tokenization Request Preview"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <pre style={{ maxHeight: 400, overflow: 'auto', backgroundColor: '#f5f5f5', padding: 12 }}>
          {JSON.stringify(previewData, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default RWATTokenizationForm;
