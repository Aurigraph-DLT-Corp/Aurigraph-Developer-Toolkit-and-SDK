/**
 * Compliance Registry View
 *
 * View and manage compliance certifications with expiry alerts
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Empty,
  message,
} from 'antd';
import {
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRegistry, ComplianceCertification, ComplianceAlert } from '../hooks/useRegistry';
import {
  ComplianceStatus,
  ComplianceLevel,
  STATUS_COLORS,
  PAGINATION_DEFAULTS,
  COMPLIANCE_THRESHOLDS,
} from '../utils/assetConstants';
import {
  formatDateTime,
  formatRelativeTime,
  formatComplianceStatus,
  formatComplianceLevel,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired,
} from '../utils/formatters';

const ComplianceRegistryView: React.FC = () => {
  // Hooks
  const {
    certifications,
    complianceAlerts,
    loading,
    error,
    total,
    getComplianceCertifications,
    getComplianceMetrics,
    getComplianceAlerts,
  } = useRegistry({ enableWebSocket: true });

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULTS.PAGE_SIZE);
  const [metrics, setMetrics] = useState({
    totalCertifications: 0,
    validCertifications: 0,
    expiringSoon: 0,
    expired: 0,
    averageComplianceScore: 0,
  });

  /**
   * Load certifications
   */
  const loadCertifications = async () => {
    try {
      await getComplianceCertifications(currentPage, pageSize);
      const metricsData = await getComplianceMetrics();
      setMetrics(metricsData);
      await getComplianceAlerts();
    } catch (err: any) {
      message.error(err.message || 'Failed to load certifications');
    }
  };

  /**
   * Get expiry status
   */
  const getExpiryStatus = (expiresAt: string): {
    status: ComplianceStatus;
    days: number;
    color: string;
  } => {
    const days = daysUntilExpiry(expiresAt);

    if (isExpired(expiresAt)) {
      return { status: ComplianceStatus.EXPIRED, days, color: STATUS_COLORS[ComplianceStatus.EXPIRED] };
    }

    if (isExpiringSoon(expiresAt, COMPLIANCE_THRESHOLDS.CRITICAL_EXPIRY_DAYS)) {
      return { status: ComplianceStatus.EXPIRING_SOON, days, color: '#ff4d4f' };
    }

    if (isExpiringSoon(expiresAt, COMPLIANCE_THRESHOLDS.EXPIRY_WARNING_DAYS)) {
      return { status: ComplianceStatus.EXPIRING_SOON, days, color: STATUS_COLORS[ComplianceStatus.EXPIRING_SOON] };
    }

    return { status: ComplianceStatus.VALID, days, color: STATUS_COLORS[ComplianceStatus.VALID] };
  };

  /**
   * Table columns
   */
  const columns: ColumnsType<ComplianceCertification> = [
    {
      title: 'Certification ID',
      dataIndex: 'certificationId',
      key: 'certificationId',
      width: 120,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text.substring(0, 12)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: ComplianceLevel) => (
        <Tag color="purple">{formatComplianceLevel(level)}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ComplianceStatus) => (
        <Tag color={STATUS_COLORS[status]}>{formatComplianceStatus(status)}</Tag>
      ),
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Issued By',
      dataIndex: 'issuedBy',
      key: 'issuedBy',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Issued At',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 130,
      render: (date) => (
        <Tooltip title={formatDateTime(date)}>
          <span>{formatRelativeTime(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Expires At',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      sorter: (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      render: (date) => {
        const { status, days, color } = getExpiryStatus(date);
        return (
          <div>
            <div style={{ marginBottom: '4px' }}>{formatDateTime(date)}</div>
            <Tag color={color} icon={days < 0 ? <CloseCircleOutlined /> : days <= 7 ? <WarningOutlined /> : <CheckCircleOutlined />}>
              {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
            </Tag>
          </div>
        );
      },
    },
  ];

  /**
   * Initial load
   */
  useEffect(() => {
    loadCertifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  /**
   * Get critical alerts count
   */
  const criticalAlertsCount = complianceAlerts.filter((alert) => alert.level === 'critical').length;

  return (
    <div>
      {/* Metrics */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Certifications"
              value={metrics.totalCertifications}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Valid"
              value={metrics.validCertifications}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={metrics.expiringSoon}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Expired"
              value={metrics.expired}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Compliance Score"
              value={metrics.averageComplianceScore}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={complianceAlerts.length}
              prefix={<BellOutlined />}
              valueStyle={{ color: criticalAlertsCount > 0 ? '#f5222d' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {complianceAlerts.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {complianceAlerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.alertId}
              message={alert.message}
              description={`${formatDateTime(alert.timestamp)} - Certification ID: ${alert.certificationId}`}
              type={alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warning' : 'info'}
              showIcon
              closable
              style={{ marginBottom: '8px' }}
              icon={
                alert.level === 'critical' ? (
                  <CloseCircleOutlined />
                ) : alert.level === 'warning' ? (
                  <WarningOutlined />
                ) : (
                  <BellOutlined />
                )
              }
            />
          ))}
          {complianceAlerts.length > 3 && (
            <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: '12px' }}>
              +{complianceAlerts.length - 3} more alerts
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCertifications}>
            Refresh
          </Button>
          <Badge count={criticalAlertsCount} offset={[10, 0]}>
            <Button icon={<BellOutlined />}>
              View All Alerts
            </Button>
          </Badge>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        {error && (
          <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
            Error: {error.message}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={certifications}
          rowKey="certificationId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: PAGINATION_DEFAULTS.PAGE_SIZE_OPTIONS.map(String),
            showTotal: (total) => `Total ${total} certifications`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || PAGINATION_DEFAULTS.PAGE_SIZE);
            },
          }}
          locale={{
            emptyText: <Empty description="No certifications found" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            const { status } = getExpiryStatus(record.expiresAt);
            if (status === ComplianceStatus.EXPIRED) return 'row-expired';
            if (status === ComplianceStatus.EXPIRING_SOON) return 'row-expiring-soon';
            return '';
          }}
        />
      </Card>

      <style>{`
        .row-expired {
          background-color: #fff1f0 !important;
        }
        .row-expiring-soon {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  );
};

export default ComplianceRegistryView;
