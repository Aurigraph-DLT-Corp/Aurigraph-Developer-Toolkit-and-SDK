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
  Modal,
  Table,
  Empty,
  message,
  Progress,
} from 'antd';
import {
  FileAddOutlined,
  SafetyOutlined,
  GoldOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  FileTextOutlined,
  LinkOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import type { AssetTokenizeRequest, AssetDocument, AssetCategory } from '../../types/rwat';

// API base URL for file uploads
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dlt.aurigraph.io';

// Contract template types for RWA tokenization
interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  contractType: 'RICARDIAN' | 'SMART' | 'HYBRID';
  jurisdiction: string;
  requiredFields: string[];
}

// Predefined contract templates for RWA
const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tpl-real-estate-001',
    name: 'Real Estate Tokenization Agreement',
    description: 'Standard agreement for tokenizing real estate assets with fractional ownership',
    category: 'real_estate',
    contractType: 'HYBRID',
    jurisdiction: 'US',
    requiredFields: ['propertyAddress', 'legalDescription', 'valuation'],
  },
  {
    id: 'tpl-commodity-001',
    name: 'Commodity Asset Agreement',
    description: 'Agreement for tokenizing physical commodities with warehouse receipts',
    category: 'commodities',
    contractType: 'HYBRID',
    jurisdiction: 'INTERNATIONAL',
    requiredFields: ['commodityType', 'quantity', 'storageLocation'],
  },
  {
    id: 'tpl-securities-001',
    name: 'Security Token Offering (STO)',
    description: 'SEC-compliant security token agreement for equity tokenization',
    category: 'equities',
    contractType: 'SMART',
    jurisdiction: 'US',
    requiredFields: ['companyName', 'shareClass', 'totalShares'],
  },
  {
    id: 'tpl-art-001',
    name: 'Art & Collectibles Agreement',
    description: 'Tokenization agreement for fine art and collectibles with provenance tracking',
    category: 'art',
    contractType: 'HYBRID',
    jurisdiction: 'INTERNATIONAL',
    requiredFields: ['artistName', 'title', 'provenance'],
  },
  {
    id: 'tpl-carbon-001',
    name: 'Carbon Credit Tokenization',
    description: 'Agreement for tokenizing verified carbon credits with VVB attestation',
    category: 'carbon_credits',
    contractType: 'SMART',
    jurisdiction: 'INTERNATIONAL',
    requiredFields: ['projectId', 'vintageYear', 'verifier'],
  },
  {
    id: 'tpl-ip-001',
    name: 'Intellectual Property License',
    description: 'Tokenization of IP rights including patents, trademarks, and copyrights',
    category: 'intellectual_property',
    contractType: 'RICARDIAN',
    jurisdiction: 'US',
    requiredFields: ['ipType', 'registrationNumber', 'owner'],
  },
  {
    id: 'tpl-trade-finance-001',
    name: 'Trade Finance Instrument',
    description: 'Tokenization of trade finance instruments like LC, BG, and invoices',
    category: 'trade_finance',
    contractType: 'HYBRID',
    jurisdiction: 'INTERNATIONAL',
    requiredFields: ['instrumentType', 'issuingBank', 'beneficiary'],
  },
  {
    id: 'tpl-custom-001',
    name: 'Custom Contract Upload',
    description: 'Upload your own Ricardian contract (PDF, DOC, DOCX)',
    category: 'custom',
    contractType: 'RICARDIAN',
    jurisdiction: 'CUSTOM',
    requiredFields: [],
  },
];

// Selected contract state
interface SelectedContract {
  templateId: string;
  template: ContractTemplate | null;
  customContractFile: AssetDocument | null;
  bindingType: 'OWNS' | 'CONTROLS' | 'REFERENCES' | 'MONITORS';
  parties: ContractParty[];
}

interface ContractParty {
  id: string;
  name: string;
  role: 'ISSUER' | 'CUSTODIAN' | 'ASSET_MANAGER' | 'VALIDATOR' | 'INVESTOR';
  address: string;
  kycVerified: boolean;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  'real_estate',
  'commodities',
  'art',
  'digital_art',
  'carbon_credits',
  'bonds',
  'equities',
  'precious_metals',
  'collectibles',
  'intellectual_property',
  'patent',
  'trademark',
  'copyright',
  'nft',
  // Banking & Trade Finance
  'trade_finance',
  'deposits',
  'loans',
  'invoice_factoring',
  'supply_chain_finance',
  'treasury',
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
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<AssetTokenizeRequest> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Contract binding state
  const [selectedContract, setSelectedContract] = useState<SelectedContract>({
    templateId: '',
    template: null,
    customContractFile: null,
    bindingType: 'CONTROLS',
    parties: [],
  });
  const [contractUploading, setContractUploading] = useState(false);
  const [bindingContract, setBindingContract] = useState(false);

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
      title: 'Contract Binding',
      description: 'Select or upload contract template',
    },
    {
      title: 'Review & Confirm',
      description: 'Review and submit tokenization request',
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  // Custom file upload handler that actually uploads to backend
  const customUpload = useCallback(async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'assets');

    // Get token symbol for organizing files (if available)
    const tokenSymbol = form.getFieldValue('tokenSymbol');
    if (tokenSymbol) {
      formData.append('tokenId', tokenSymbol);
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          onProgress?.({ percent });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);

            // Determine document type from filename
            const fileName = file.name || 'Document';
            const extension = fileName.split('.').pop()?.toLowerCase() || '';
            let docType = 'other';
            if (['pdf', 'doc', 'docx'].includes(extension)) {
              docType = 'compliance';
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
              docType = 'image';
            }

            const newDoc: AssetDocument = {
              id: response.id || `doc_${Date.now()}`,
              type: docType as any,
              name: fileName,
              // Use filesystem path from backend response
              url: response.path || response.storedName || '',
              hash: response.hash || '', // Hash may not be returned by filesystem storage
              uploadedAt: response.uploadedAt || new Date().toISOString(),
            };

            setDocuments(prev => [...prev, newDoc]);
            onSuccess?.(response, xhr);
            message.success(`${fileName} uploaded successfully`);
          } catch (parseError) {
            console.error('Failed to parse upload response:', parseError);
            onError?.(new Error('Invalid response from server'));
            message.error('Upload failed: Invalid server response');
          }
        } else {
          const errorMsg = xhr.responseText || `Upload failed with status ${xhr.status}`;
          console.error('Upload failed:', errorMsg);
          onError?.(new Error(errorMsg));
          message.error(`Upload failed: ${xhr.status === 413 ? 'File too large' : 'Server error'}`);
        }
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        console.error('Upload network error');
        onError?.(new Error('Network error during upload'));
        message.error('Upload failed: Network error. Please check your connection.');
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.open('POST', `${API_BASE_URL}/api/v12/uploads/assets`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload exception:', error);
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
      message.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setUploading(false);
      setUploadProgress(0);
    }
  }, [form]);

  // Validate file before upload
  const beforeUpload = useCallback((file: RcFile) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    const isAllowedType = allowedTypes.includes(file.type) ||
      /\.(pdf|doc|docx|jpg|jpeg|png|gif)$/i.test(file.name);

    if (!isAllowedType) {
      message.error('Only PDF, DOC, DOCX, JPG, PNG, and GIF files are allowed');
      return Upload.LIST_IGNORE;
    }

    const maxSizeMB = 50;
    const isWithinSize = file.size / 1024 / 1024 < maxSizeMB;

    if (!isWithinSize) {
      message.error(`File must be smaller than ${maxSizeMB}MB`);
      return Upload.LIST_IGNORE;
    }

    return true;
  }, []);

  const handleDocumentRemove = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  // Handle contract template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = CONTRACT_TEMPLATES.find(t => t.id === templateId) || null;
    setSelectedContract(prev => ({
      ...prev,
      templateId,
      template,
      customContractFile: templateId === 'tpl-custom-001' ? prev.customContractFile : null,
    }));
  }, []);

  // Handle custom contract upload
  const customContractUpload = useCallback(async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;

    setContractUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'assets');

    const tokenSymbol = form.getFieldValue('tokenSymbol');
    if (tokenSymbol) {
      formData.append('tokenId', `${tokenSymbol}-CONTRACT`);
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.({ percent });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const fileName = file.name || 'Contract';

            const contractDoc: AssetDocument = {
              id: response.id || `contract_${Date.now()}`,
              type: 'contract' as any,
              name: fileName,
              url: response.path || response.storedName || '',
              hash: response.hash || '',
              uploadedAt: response.uploadedAt || new Date().toISOString(),
            };

            setSelectedContract(prev => ({
              ...prev,
              customContractFile: contractDoc,
            }));

            onSuccess?.(response, xhr);
            message.success(`Contract "${fileName}" uploaded successfully`);
          } catch (parseError) {
            onError?.(new Error('Invalid response from server'));
            message.error('Contract upload failed: Invalid server response');
          }
        } else {
          onError?.(new Error(`Upload failed with status ${xhr.status}`));
          message.error('Contract upload failed');
        }
        setContractUploading(false);
      };

      xhr.onerror = () => {
        onError?.(new Error('Network error'));
        message.error('Contract upload failed: Network error');
        setContractUploading(false);
      };

      xhr.open('POST', `${API_BASE_URL}/api/v12/uploads/assets`);
      xhr.send(formData);

    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
      message.error('Contract upload failed');
      setContractUploading(false);
    }
  }, [form]);

  // Create contract-asset binding via API
  const createContractAssetBinding = useCallback(async (assetId: string, contractId: string) => {
    try {
      setBindingContract(true);
      const values = form.getFieldsValue();

      const bindingRequest = {
        contractId: contractId,
        contractName: selectedContract.template?.name || 'Custom Contract',
        assetId: assetId,
        assetName: values.assetName,
        assetType: values.category,
        assetValuation: values.assetValue,
        assetCurrency: values.currency || 'USD',
        bindingType: selectedContract.bindingType,
        tokenId: values.tokenSymbol,
        tokenSymbol: values.tokenSymbol,
        totalShares: values.totalShares,
        issuer: values.owner,
        custodian: values.custodian,
        metadata: {
          templateId: selectedContract.templateId,
          contractType: selectedContract.template?.contractType,
          jurisdiction: selectedContract.template?.jurisdiction,
          documentHashes: documents.map(d => d.hash).filter(Boolean),
          customContractHash: selectedContract.customContractFile?.hash,
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/v12/traceability/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bindingRequest),
      });

      if (!response.ok) {
        throw new Error(`Binding failed: ${response.status}`);
      }

      const result = await response.json();
      message.success('Asset successfully bound to contract');
      return result;
    } catch (error) {
      console.error('Contract binding failed:', error);
      message.error('Failed to bind asset to contract');
      throw error;
    } finally {
      setBindingContract(false);
    }
  }, [form, selectedContract, documents]);

  // Get recommended templates based on asset category
  const getRecommendedTemplates = useCallback(() => {
    const category = form.getFieldValue('category');
    if (!category) return CONTRACT_TEMPLATES;

    // Sort templates - matching category first, then others
    return [...CONTRACT_TEMPLATES].sort((a, b) => {
      if (a.category === category && b.category !== category) return -1;
      if (a.category !== category && b.category === category) return 1;
      if (a.id === 'tpl-custom-001') return 1; // Custom always last
      if (b.id === 'tpl-custom-001') return -1;
      return 0;
    });
  }, [form]);

  const handlePreview = () => {
    const formData = form.getFieldsValue();
    setPreviewData(formData);
    setPreviewModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();

      // Step 1: Register Primary Token in Asset Registry
      message.loading({ content: 'Registering primary token...', key: 'tokenization' });

      const primaryTokenRequest = {
        tokenSymbol: values.tokenSymbol,
        tokenType: 'PRIMARY',
        assetName: values.assetName,
        category: values.category,
        description: values.description,
        owner: values.owner,
        custodian: values.custodian,
        totalSupply: values.totalShares,
        valuation: values.assetValue,
        currency: values.currency || 'USD',
        metadata: {
          location: values.location,
          legalDescription: values.legalDescription,
          serialNumber: values.serialNumber,
        },
      };

      const primaryResponse = await fetch(`${API_BASE_URL}/api/v12/registries/asset/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(primaryTokenRequest),
      });

      let primaryToken = { tokenId: `${values.tokenSymbol}-PRIMARY-${Date.now()}` };
      if (primaryResponse.ok) {
        primaryToken = await primaryResponse.json();
      }

      // Step 2: Register Secondary Tokens (Fractional Shares)
      message.loading({ content: 'Creating secondary tokens...', key: 'tokenization' });

      const secondaryTokenRequest = {
        primaryTokenId: primaryToken.tokenId,
        tokenSymbol: `${values.tokenSymbol}-SHR`,
        tokenType: 'SECONDARY',
        totalShares: values.totalShares,
        pricePerShare: values.assetValue / values.totalShares,
        currency: values.currency || 'USD',
        transferable: true,
        divisible: true,
        compliance: {
          kycRequired: values.kycRequired,
          amlVerified: values.amlVerified,
          accreditedInvestorsOnly: values.accreditedInvestorsOnly,
          jurisdictions: values.jurisdictions || [],
        },
      };

      const secondaryResponse = await fetch(`${API_BASE_URL}/api/v12/registries/secondary/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secondaryTokenRequest),
      });

      let secondaryToken = { tokenId: `${values.tokenSymbol}-SECONDARY-${Date.now()}` };
      if (secondaryResponse.ok) {
        secondaryToken = await secondaryResponse.json();
      }

      // Step 3: Create Composite Token (Contract-Bound Wrapper)
      message.loading({ content: 'Creating composite token...', key: 'tokenization' });

      const compositeTokenRequest = {
        primaryTokenId: primaryToken.tokenId,
        secondaryTokenId: secondaryToken.tokenId,
        tokenSymbol: `${values.tokenSymbol}-CPT`,
        tokenType: 'COMPOSITE',
        contractTemplateId: selectedContract.templateId,
        contractType: selectedContract.template?.contractType || 'RICARDIAN',
        bindingType: selectedContract.bindingType,
        jurisdiction: selectedContract.template?.jurisdiction || 'INTERNATIONAL',
        customContractHash: selectedContract.customContractFile?.hash,
        documentHashes: documents.map(d => d.hash).filter(Boolean),
      };

      const compositeResponse = await fetch(`${API_BASE_URL}/api/v12/registries/composite/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compositeTokenRequest),
      });

      let compositeToken = { tokenId: `${values.tokenSymbol}-COMPOSITE-${Date.now()}` };
      if (compositeResponse.ok) {
        compositeToken = await compositeResponse.json();
      }

      // Step 4: Create Contract-Asset Binding
      message.loading({ content: 'Binding contract to asset...', key: 'tokenization' });

      const contractId = selectedContract.templateId === 'tpl-custom-001'
        ? `CUSTOM-${Date.now()}`
        : selectedContract.templateId;

      await createContractAssetBinding(primaryToken.tokenId, contractId);

      // Step 5: Submit full tokenization request
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
          // Registry references stored in customFields
          customFields: {
            primaryTokenId: primaryToken.tokenId,
            secondaryTokenId: secondaryToken.tokenId,
            compositeTokenId: compositeToken.tokenId,
            contractBinding: {
              templateId: selectedContract.templateId,
              templateName: selectedContract.template?.name,
              bindingType: selectedContract.bindingType,
              customContractHash: selectedContract.customContractFile?.hash,
            },
          },
        },
      };

      if (onSubmit) {
        await onSubmit(tokenizationRequest);
      }

      message.destroy('tokenization');
      Modal.success({
        title: 'Asset Tokenization Complete',
        width: 600,
        content: (
          <div>
            <p>Your asset has been successfully tokenized with the following registrations:</p>
            <div style={{ marginTop: 16 }}>
              <p><strong>Primary Token:</strong> <Tag color="green">{primaryToken.tokenId}</Tag></p>
              <p><strong>Secondary Tokens:</strong> <Tag color="blue">{values.totalShares} shares</Tag></p>
              <p><strong>Composite Token:</strong> <Tag color="orange">{compositeToken.tokenId}</Tag></p>
              <p><strong>Contract Binding:</strong> <Tag color="purple">{selectedContract.template?.name || 'Custom'}</Tag></p>
            </div>
          </div>
        ),
      });

      form.resetFields();
      setCurrentStep(0);
      setDocuments([]);
      setSelectedContract({
        templateId: '',
        template: null,
        customContractFile: null,
        bindingType: 'CONTROLS',
        parties: [],
      });

    } catch (error) {
      message.destroy('tokenization');
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
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  customRequest={customUpload}
                  beforeUpload={beforeUpload}
                  maxCount={10}
                  showUploadList={false}
                  disabled={uploading}
                >
                  <Button icon={uploading ? <LoadingOutlined /> : <FileAddOutlined />} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </Upload>
                {uploading && (
                  <Progress percent={uploadProgress} size="small" style={{ marginTop: 8 }} />
                )}

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
                  Next: Contract Binding
                </Button>
              </Space>
            </div>
          )}

          {/* Step 4: Contract Binding */}
          {currentStep === 3 && (
            <div>
              <h3>
                <FileTextOutlined /> Contract Binding
              </h3>
              <p style={{ color: '#666', marginBottom: 16 }}>
                Select a contract template or upload your own Ricardian contract to bind with this asset.
              </p>

              {/* Contract Template Selection */}
              <Card size="small" title="Select Contract Template" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  {getRecommendedTemplates().map((template) => {
                    const isSelected = selectedContract.templateId === template.id;
                    const isRecommended = template.category === form.getFieldValue('category');

                    return (
                      <Col xs={24} sm={12} key={template.id}>
                        <Card
                          size="small"
                          hoverable
                          onClick={() => handleTemplateSelect(template.id)}
                          style={{
                            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            backgroundColor: isSelected ? '#e6f7ff' : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong>{template.name}</strong>
                              {isRecommended && <Tag color="green" style={{ marginLeft: 8 }}>Recommended</Tag>}
                              <Tag color={
                                template.contractType === 'SMART' ? 'blue' :
                                template.contractType === 'HYBRID' ? 'purple' : 'orange'
                              } style={{ marginLeft: 4 }}>
                                {template.contractType}
                              </Tag>
                            </div>
                            {isSelected && <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
                          </div>
                          <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
                            {template.description}
                          </p>
                          <div style={{ marginTop: 8 }}>
                            <Tag>{template.jurisdiction}</Tag>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Card>

              {/* Custom Contract Upload (shown when custom template selected) */}
              {selectedContract.templateId === 'tpl-custom-001' && (
                <Card size="small" title="Upload Custom Contract" style={{ marginBottom: 16 }}>
                  <Upload
                    accept=".pdf,.doc,.docx"
                    customRequest={customContractUpload}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    showUploadList={false}
                    disabled={contractUploading}
                  >
                    <Button
                      icon={contractUploading ? <LoadingOutlined /> : <FileAddOutlined />}
                      disabled={contractUploading}
                    >
                      {contractUploading ? 'Uploading...' : 'Upload Contract (PDF, DOC, DOCX)'}
                    </Button>
                  </Upload>

                  {selectedContract.customContractFile && (
                    <Card size="small" style={{ marginTop: 12, backgroundColor: '#f6ffed' }}>
                      <Space>
                        <FileTextOutlined style={{ color: '#52c41a' }} />
                        <span>{selectedContract.customContractFile.name}</span>
                        <Tag color="green">Uploaded</Tag>
                        {selectedContract.customContractFile.hash && (
                          <Tag color="blue">
                            <CopyOutlined /> Hash: {selectedContract.customContractFile.hash.substring(0, 12)}...
                          </Tag>
                        )}
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => setSelectedContract(prev => ({ ...prev, customContractFile: null }))}
                        />
                      </Space>
                    </Card>
                  )}
                </Card>
              )}

              {/* Binding Configuration */}
              {selectedContract.templateId && (
                <Card size="small" title={<><LinkOutlined /> Binding Configuration</>} style={{ marginBottom: 16 }}>
                  <Form.Item label="Binding Type" style={{ marginBottom: 12 }}>
                    <Select
                      value={selectedContract.bindingType}
                      onChange={(value) => setSelectedContract(prev => ({ ...prev, bindingType: value }))}
                      options={[
                        { label: 'CONTROLS - Contract controls asset operations', value: 'CONTROLS' },
                        { label: 'OWNS - Contract represents asset ownership', value: 'OWNS' },
                        { label: 'REFERENCES - Contract references asset data', value: 'REFERENCES' },
                        { label: 'MONITORS - Contract monitors asset metrics', value: 'MONITORS' },
                      ]}
                    />
                  </Form.Item>

                  {selectedContract.template && (
                    <div style={{ padding: 12, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <strong>Contract Type:</strong>
                          <div><Tag color="purple">{selectedContract.template.contractType}</Tag></div>
                        </Col>
                        <Col span={8}>
                          <strong>Jurisdiction:</strong>
                          <div><Tag>{selectedContract.template.jurisdiction}</Tag></div>
                        </Col>
                        <Col span={8}>
                          <strong>Category:</strong>
                          <div><Tag color="blue">{selectedContract.template.category.replace(/_/g, ' ').toUpperCase()}</Tag></div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card>
              )}

              {/* Validation Message */}
              {!selectedContract.templateId && (
                <div style={{ textAlign: 'center', padding: 24, backgroundColor: '#fffbe6', borderRadius: 4 }}>
                  <SafetyOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <p style={{ margin: '8px 0 0 0' }}>Please select a contract template to proceed</p>
                </div>
              )}

              <Divider />

              <Space>
                <Button onClick={() => handleStepChange(2)}>Back to Compliance</Button>
                <Button
                  type="primary"
                  onClick={() => handleStepChange(4)}
                  disabled={!selectedContract.templateId || (selectedContract.templateId === 'tpl-custom-001' && !selectedContract.customContractFile)}
                >
                  Next: Review & Confirm
                </Button>
              </Space>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 4 && (
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
                <Col xs={24} sm={8}>
                  <Card size="small" title="Asset Summary">
                    <p>
                      <strong>Name:</strong> {form.getFieldValue('assetName')}
                    </p>
                    <p>
                      <strong>Category:</strong> {form.getFieldValue('category')?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p>
                      <strong>Value:</strong> ${form.getFieldValue('assetValue')?.toLocaleString()}
                    </p>
                    <p>
                      <strong>Owner:</strong> {form.getFieldValue('owner')}
                    </p>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="Token Summary">
                    <p>
                      <strong>Symbol:</strong> <Tag color="blue">{form.getFieldValue('tokenSymbol')}</Tag>
                    </p>
                    <p>
                      <strong>Total Shares:</strong> {form.getFieldValue('totalShares')?.toLocaleString()}
                    </p>
                    <p>
                      <strong>Documents:</strong> {documents.length} attached
                    </p>
                    <p>
                      <strong>Token Type:</strong> <Tag color="gold">PRIMARY</Tag>
                    </p>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="Contract Binding">
                    <p>
                      <strong>Template:</strong> {selectedContract.template?.name || 'Custom Contract'}
                    </p>
                    <p>
                      <strong>Type:</strong>{' '}
                      <Tag color={
                        selectedContract.template?.contractType === 'SMART' ? 'blue' :
                        selectedContract.template?.contractType === 'HYBRID' ? 'purple' : 'orange'
                      }>
                        {selectedContract.template?.contractType || 'RICARDIAN'}
                      </Tag>
                    </p>
                    <p>
                      <strong>Binding:</strong> <Tag color="green">{selectedContract.bindingType}</Tag>
                    </p>
                    {selectedContract.customContractFile && (
                      <p>
                        <strong>Contract File:</strong> {selectedContract.customContractFile.name}
                      </p>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Registry Integration Section */}
              <Card size="small" title="Token Registry Integration" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f6ffed', borderRadius: 4 }}>
                      <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>PRIMARY TOKEN</Tag>
                      <p style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                        Main asset token registered in Asset Registry
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                        {form.getFieldValue('tokenSymbol')}
                      </p>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                      <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>SECONDARY TOKENS</Tag>
                      <p style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                        Fractional shares for investor distribution
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                        {form.getFieldValue('totalShares')?.toLocaleString()} shares
                      </p>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#fff7e6', borderRadius: 4 }}>
                      <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>COMPOSITE TOKEN</Tag>
                      <p style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                        Contract-bound asset wrapper
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                        {form.getFieldValue('tokenSymbol')}-CPT
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Compliance Summary */}
              <Card size="small" title="Compliance Status" style={{ marginTop: 16 }}>
                <Space wrap>
                  {form.getFieldValue('kycRequired') && <Tag color="green">KYC Required</Tag>}
                  {form.getFieldValue('amlVerified') && <Tag color="green">AML Verified</Tag>}
                  {form.getFieldValue('accreditedInvestorsOnly') && <Tag color="blue">Accredited Only</Tag>}
                  {form.getFieldValue('jurisdictions')?.map((j: string) => (
                    <Tag key={j}>{j}</Tag>
                  ))}
                </Space>
              </Card>

              <Divider />

              <Space>
                <Button onClick={() => handleStepChange(3)}>Back to Contract Binding</Button>
                <Button
                  type="primary"
                  size="large"
                  loading={loading || bindingContract}
                  onClick={handleSubmit}
                  icon={<CheckCircleOutlined />}
                >
                  {bindingContract ? 'Binding Contract...' : 'Submit Tokenization Request'}
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
