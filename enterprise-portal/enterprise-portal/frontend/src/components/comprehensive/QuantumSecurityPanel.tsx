/**
 * Quantum Security Panel Component
 *
 * Quantum-resistant crypto status, key management, and security metrics
 * Connects to crypto/QuantumCryptoService.java backend API
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Progress,
  Alert,
  Space,
  Tooltip,
  Badge,
  Typography,
  Tabs,
  Modal,
} from 'antd';
import {
  SafetyOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  SecurityScanOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  QuantumSecurityStatus,
  CryptoKey,
  SecurityMetrics,
  SecurityAudit,
} from '../../types/comprehensive';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const QuantumSecurityPanel: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<QuantumSecurityStatus | null>(null);
  const [keys, setKeys] = useState<CryptoKey[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rotateKeyModalVisible, setRotateKeyModalVisible] = useState<boolean>(false);

  // Fetch security data
  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls to QuantumCryptoService.java
      setSecurityStatus(generateMockSecurityStatus());
      setKeys(generateMockKeys(10));
      setMetrics(generateMockMetrics());
      setAudits(generateMockAudits(5));
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();

    const interval = setInterval(() => {
      fetchSecurityData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle key rotation
  const handleKeyRotation = () => {
    setRotateKeyModalVisible(true);
  };

  const confirmKeyRotation = () => {
    console.log('Rotating keys...');
    // TODO: Implement key rotation API call
    setRotateKeyModalVisible(false);
  };

  // Key table columns
  const keyColumns: ColumnsType<CryptoKey> = [
    {
      title: 'Key ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }}>{id.substring(0, 12)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: CryptoKey['type']) => {
        const colors = { signing: 'blue', encryption: 'green', hybrid: 'purple' };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Algorithm',
      dataIndex: 'algorithm',
      key: 'algorithm',
      width: 180,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: CryptoKey['status']) => {
        const config = {
          active: { icon: <CheckCircleOutlined />, color: 'success' },
          expired: { icon: <ClockCircleOutlined />, color: 'error' },
          revoked: { icon: <ExclamationCircleOutlined />, color: 'warning' },
        };
        return <Tag icon={config[status].icon} color={config[status].color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Usage Count',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 120,
      render: (count: number) => <Badge count={count} showZero color="#1890ff" />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 150,
      render: (date?: string) => (date ? new Date(date).toLocaleDateString() : 'Never'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button size="small" danger disabled={record.status !== 'active'}>
          Revoke
        </Button>
      ),
    },
  ];

  // Audit table columns
  const auditColumns: ColumnsType<SecurityAudit> = [
    {
      title: 'Audit ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SecurityAudit['status']) => {
        const colors = { passed: 'green', failed: 'red', warning: 'orange' };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Findings',
      key: 'findings',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.findings.critical > 0 && <Badge count={record.findings.critical} style={{ backgroundColor: '#ff4d4f' }} />}
          {record.findings.high > 0 && <Badge count={record.findings.high} style={{ backgroundColor: '#ff7a45' }} />}
          {record.findings.medium > 0 && <Badge count={record.findings.medium} style={{ backgroundColor: '#ffa940' }} />}
          {record.findings.low > 0 && <Badge count={record.findings.low} style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Quantum Security Panel</Title>
      <Text type="secondary">Post-quantum cryptography monitoring and key management</Text>

      {/* Security Status Alert */}
      {securityStatus && (
        <Alert
          message={`Security Status: ${securityStatus.status.toUpperCase()}`}
          description={
            <Space direction="vertical">
              <Text>
                <strong>Algorithm:</strong> {securityStatus.algorithm} (NIST Level {securityStatus.securityLevel})
              </Text>
              <Text>
                <strong>Quantum Resistant:</strong>{' '}
                {securityStatus.quantumResistant ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}{' '}
                {securityStatus.quantumResistant ? 'Yes' : 'No'}
              </Text>
              <Text>
                <strong>Last Audit:</strong> {new Date(securityStatus.lastAudit).toLocaleDateString()}
              </Text>
              {securityStatus.vulnerabilities > 0 && (
                <Text type="danger">
                  <ExclamationCircleOutlined /> {securityStatus.vulnerabilities} vulnerabilities detected
                </Text>
              )}
            </Space>
          }
          type={securityStatus.status === 'secure' ? 'success' : securityStatus.status === 'warning' ? 'warning' : 'error'}
          showIcon
          icon={<SecurityScanOutlined />}
          style={{ marginTop: '24px', marginBottom: '24px' }}
        />
      )}

      {/* Security Metrics */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Signatures"
                value={metrics.totalSignatures}
                prefix={<KeyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Signature Time"
                value={metrics.avgSignatureTime}
                precision={2}
                suffix="ms"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Failed Verifications"
                value={metrics.failedVerifications}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: metrics.failedVerifications > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Attacks Blocked"
                value={metrics.quantumAttemptsBlocked}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card title="Cryptographic Performance" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Average Encryption Time: {metrics.avgEncryptionTime.toFixed(2)}ms</Text>
                <Progress percent={Math.min((50 / metrics.avgEncryptionTime) * 100, 100)} strokeColor="#1890ff" />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Average Verification Time: {metrics.avgVerificationTime.toFixed(2)}ms</Text>
                <Progress percent={Math.min((30 / metrics.avgVerificationTime) * 100, 100)} strokeColor="#52c41a" />
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Tabs for different security sections */}
      <Card>
        <Tabs defaultActiveKey="keys">
          <TabPane tab="Cryptographic Keys" key="keys">
            <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
              <Button type="primary" icon={<LockOutlined />} onClick={handleKeyRotation}>
                Rotate All Keys
              </Button>
              <Alert
                message="Key Management Best Practices"
                description="Keys are automatically rotated every 90 days. Manual rotation is recommended after security audits or suspected compromise."
                type="info"
                showIcon
              />
            </Space>
            <Table
              columns={keyColumns}
              dataSource={keys}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          <TabPane tab="Security Audits" key="audits">
            <Table
              columns={auditColumns}
              dataSource={audits}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px' }}>
                    <Title level={5}>Recommendations</Title>
                    <ul>
                      {record.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                ),
              }}
            />
          </TabPane>

          <TabPane tab="Algorithm Info" key="algorithms">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="CRYSTALS-Dilithium" size="small">
                  <Space direction="vertical">
                    <Text><strong>Type:</strong> Digital Signature</Text>
                    <Text><strong>Security Level:</strong> NIST Level 5</Text>
                    <Text><strong>Key Size:</strong> 2592 bytes (public), 4864 bytes (private)</Text>
                    <Text><strong>Signature Size:</strong> 4627 bytes</Text>
                    <Text><strong>Performance:</strong> Fast signing and verification</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="CRYSTALS-Kyber" size="small">
                  <Space direction="vertical">
                    <Text><strong>Type:</strong> Key Encapsulation</Text>
                    <Text><strong>Security Level:</strong> NIST Level 5</Text>
                    <Text><strong>Public Key:</strong> 1568 bytes</Text>
                    <Text><strong>Ciphertext:</strong> 1568 bytes</Text>
                    <Text><strong>Performance:</strong> Efficient encryption/decryption</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Key Rotation Confirmation Modal */}
      <Modal
        title="Confirm Key Rotation"
        open={rotateKeyModalVisible}
        onOk={confirmKeyRotation}
        onCancel={() => setRotateKeyModalVisible(false)}
        okText="Confirm Rotation"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="Warning"
          description="Key rotation will generate new cryptographic keys for all active key pairs. This operation cannot be undone. All existing signatures will remain valid, but new operations will use the new keys."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <Text>Are you sure you want to proceed with key rotation?</Text>
      </Modal>
    </div>
  );
};

// Mock data generators
const generateMockSecurityStatus = (): QuantumSecurityStatus => ({
  algorithm: 'CRYSTALS-Dilithium',
  securityLevel: 5,
  keyStrength: 256,
  quantumResistant: true,
  lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  vulnerabilities: Math.random() > 0.9 ? 1 : 0,
  status: Math.random() > 0.95 ? 'warning' : 'secure',
});

const generateMockKeys = (count: number): CryptoKey[] => {
  const types: CryptoKey['type'][] = ['signing', 'encryption', 'hybrid'];
  const algorithms = ['CRYSTALS-Dilithium', 'CRYSTALS-Kyber', 'SPHINCS+'];
  const statuses: CryptoKey['status'][] = ['active', 'active', 'active', 'expired'];

  return Array.from({ length: count }, (_, i) => ({
    id: `key-${Math.random().toString(36).substring(2, 15)}`,
    type: (types[i % types.length] || 'signing') as CryptoKey['type'],
    algorithm: algorithms[i % algorithms.length] || 'CRYSTALS-Dilithium',
    publicKey: `0x${Math.random().toString(16).substring(2)}...`,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    status: (statuses[Math.floor(Math.random() * statuses.length)] || 'active') as CryptoKey['status'],
    usageCount: Math.floor(Math.random() * 100000),
    lastUsed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateMockMetrics = (): SecurityMetrics => ({
  totalSignatures: Math.floor(Math.random() * 1000000) + 500000,
  totalEncryptions: Math.floor(Math.random() * 500000) + 250000,
  avgSignatureTime: 2 + Math.random() * 3,
  avgEncryptionTime: 5 + Math.random() * 5,
  avgVerificationTime: 1.5 + Math.random() * 2,
  avgDecryptionTime: 4 + Math.random() * 4,
  failedVerifications: Math.floor(Math.random() * 10),
  quantumAttemptsBlocked: Math.floor(Math.random() * 50),
});

const generateMockAudits = (count: number): SecurityAudit[] => {
  const types: SecurityAudit['type'][] = ['key-rotation', 'vulnerability-scan', 'penetration-test', 'compliance'];
  const statuses: SecurityAudit['status'][] = ['passed', 'passed', 'warning'];

  return Array.from({ length: count }, (_, i) => ({
    id: `audit-${i + 1}`,
    timestamp: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: types[i % types.length] as SecurityAudit['type'],
    status: statuses[Math.floor(Math.random() * statuses.length)] as SecurityAudit['status'],
    findings: {
      critical: Math.floor(Math.random() * 2),
      high: Math.floor(Math.random() * 3),
      medium: Math.floor(Math.random() * 5),
      low: Math.floor(Math.random() * 10),
    },
    recommendations: [
      'Update key rotation policy to 60 days',
      'Implement additional monitoring for quantum attacks',
      'Review access control policies',
    ],
  }));
};

export default QuantumSecurityPanel;
