/**
 * Quantum Security Panel Component
 *
 * Quantum-resistant crypto status, key management, and security metrics
 * Connects to crypto/QuantumCryptoService.java backend API - NO MOCK DATA
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
  message,
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
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  QuantumSecurityStatus,
  CryptoKey,
  SecurityMetrics,
  SecurityAudit,
} from '../../types/comprehensive';
import { comprehensivePortalService } from '../../services/ComprehensivePortalService';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const QuantumSecurityPanel: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<QuantumSecurityStatus | null>(null);
  const [keys, setKeys] = useState<CryptoKey[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rotateKeyModalVisible, setRotateKeyModalVisible] = useState<boolean>(false);
  const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch security data from REAL backend API
  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data from REAL backend APIs - NO MOCK DATA
      const [statusData, keysData, metricsData, auditsData] = await Promise.all([
        comprehensivePortalService.getSecurityStatus(),
        comprehensivePortalService.getCryptoKeys(),
        comprehensivePortalService.getSecurityMetrics(),
        comprehensivePortalService.getSecurityAudits(),
      ]);

      setSecurityStatus(statusData);
      setKeys(keysData);
      setMetrics(metricsData);
      setAudits(auditsData);

      message.success('Security data loaded from backend');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch security data';
      setError(errorMessage);
      message.error(`Backend API error: ${errorMessage}`);
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();

    const interval = setInterval(() => {
      fetchSecurityData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle key rotation - REAL backend API call
  const handleKeyRotation = () => {
    setRotateKeyModalVisible(true);
  };

  const confirmKeyRotation = async () => {
    try {
      setLoading(true);
      await comprehensivePortalService.rotateKeys();
      message.success('Keys rotated successfully');
      setRotateKeyModalVisible(false);
      // Refresh data after rotation
      await fetchSecurityData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Key rotation failed';
      message.error(`Key rotation failed: ${errorMessage}`);
      console.error('Key rotation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle vulnerability scan - REAL backend API call
  const handleVulnerabilityScan = () => {
    setScanModalVisible(true);
  };

  const confirmVulnerabilityScan = async () => {
    try {
      setIsScanning(true);
      setScanModalVisible(false);
      message.loading('Running vulnerability scan...', 0);

      // Call REAL backend vulnerability scan API
      const response = await fetch('http://localhost:9003/api/v11/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      message.destroy();
      message.success(`Vulnerability scan completed: ${result.findings || 'No issues found'}`);

      // Refresh audits after scan
      await fetchSecurityData();
    } catch (err) {
      message.destroy();
      const errorMessage = err instanceof Error ? err.message : 'Vulnerability scan failed';
      message.error(`Scan failed: ${errorMessage}`);
      console.error('Vulnerability scan error:', err);
    } finally {
      setIsScanning(false);
    }
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
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={2}>Quantum Security Panel</Title>
          <Text type="secondary">Post-quantum cryptography monitoring and key management</Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={fetchSecurityData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              danger
              icon={<SecurityScanOutlined />}
              onClick={handleVulnerabilityScan}
              loading={isScanning}
            >
              Run Vulnerability Scan
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Backend API Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Security Status Alert */}
      {securityStatus && (
        <Alert
          message={`Security Status: ${securityStatus.status?.toUpperCase() || 'UNKNOWN'}`}
          description={
            <Space direction="vertical">
              <Text>
                <strong>Algorithm:</strong> {securityStatus.algorithm || 'N/A'} (NIST Level {securityStatus.securityLevel || 'N/A'})
              </Text>
              <Text>
                <strong>Quantum Resistant:</strong>{' '}
                {securityStatus.quantumResistant ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}{' '}
                {securityStatus.quantumResistant ? 'Yes' : 'No'}
              </Text>
              <Text>
                <strong>Last Audit:</strong> {securityStatus.lastAudit ? new Date(securityStatus.lastAudit).toLocaleDateString() : 'Never'}
              </Text>
              {(securityStatus.vulnerabilities || 0) > 0 && (
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
                value={metrics.totalSignatures || 0}
                prefix={<KeyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Signature Time"
                value={metrics.avgSignatureTime || 0}
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
                value={metrics.failedVerifications || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: (metrics.failedVerifications || 0) > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Attacks Blocked"
                value={metrics.quantumAttemptsBlocked || 0}
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
                <Text>Average Encryption Time: {(metrics.avgEncryptionTime || 0).toFixed(2)}ms</Text>
                <Progress percent={Math.min((50 / (metrics.avgEncryptionTime || 1)) * 100, 100)} strokeColor="#1890ff" />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>Average Verification Time: {(metrics.avgVerificationTime || 0).toFixed(2)}ms</Text>
                <Progress percent={Math.min((30 / (metrics.avgVerificationTime || 1)) * 100, 100)} strokeColor="#52c41a" />
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
              <Button type="primary" icon={<LockOutlined />} onClick={handleKeyRotation} loading={loading}>
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
                      {(record.recommendations || []).map((rec, i) => (
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
        confirmLoading={loading}
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

      {/* Vulnerability Scan Confirmation Modal */}
      <Modal
        title="Run Vulnerability Scan"
        open={scanModalVisible}
        onOk={confirmVulnerabilityScan}
        onCancel={() => setScanModalVisible(false)}
        okText="Start Scan"
        okButtonProps={{ danger: true }}
        confirmLoading={isScanning}
      >
        <Alert
          message="Security Scan"
          description="This will perform a comprehensive vulnerability scan of all quantum cryptographic implementations, checking for known vulnerabilities, weak keys, and security misconfigurations."
          type="info"
          showIcon
          icon={<SecurityScanOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <Text>The scan may take several minutes to complete. Do you want to proceed?</Text>
      </Modal>
    </div>
  );
};

export default QuantumSecurityPanel;
