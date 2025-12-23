/**
 * Role Management Component
 *
 * Provides CRUD operations for role management with granular permission control
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Checkbox,
  Typography,
  Descriptions,
  Collapse,
  Alert,
} from 'antd';
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Role, Permission, mockRoles, DEFAULT_PERMISSIONS } from '../types/user';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [form] = Form.useForm();

  // Load roles from localStorage or use mock data
  useEffect(() => {
    const storedRoles = localStorage.getItem('aurigraph_roles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    } else {
      setRoles(mockRoles);
      localStorage.setItem('aurigraph_roles', JSON.stringify(mockRoles));
    }
  }, []);

  const saveRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
    localStorage.setItem('aurigraph_roles', JSON.stringify(newRoles));
  };

  const handleAddRole = () => {
    setEditingRole(null);
    form.resetFields();
    setPermissions(DEFAULT_PERMISSIONS);
    setIsModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.isSystemRole) {
      message.warning('System roles cannot be modified');
      return;
    }
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    setPermissions(role.permissions);
    setIsModalVisible(true);
  };

  const handleViewRole = (role: Role) => {
    setViewingRole(role);
    setIsViewModalVisible(true);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.isSystemRole) {
      message.error('System roles cannot be deleted');
      return;
    }
    if (role?.userCount && role.userCount > 0) {
      message.error('Cannot delete role with active users');
      return;
    }
    const newRoles = roles.filter((r) => r.id !== roleId);
    saveRoles(newRoles);
    message.success('Role deleted successfully');
  };

  const handlePermissionChange = (moduleIndex: number, action: string, checked: boolean) => {
    const newPermissions = [...permissions];
    const currentPermission = newPermissions[moduleIndex];
    if (currentPermission) {
      newPermissions[moduleIndex] = {
        module: currentPermission.module,
        actions: {
          ...currentPermission.actions,
          [action]: checked,
        },
      };
      setPermissions(newPermissions);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRole) {
        // Update existing role
        const newRoles = roles.map((role) =>
          role.id === editingRole.id ? { ...role, ...values, permissions } : role
        );
        saveRoles(newRoles);
        message.success('Role updated successfully');
      } else {
        // Add new role
        const newRole: Role = {
          id: Date.now().toString(),
          ...values,
          permissions,
          userCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
          isSystemRole: false,
        };
        saveRoles([...roles, newRole]);
        message.success('Role created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Space>
          <SafetyCertificateOutlined />
          <strong>{text}</strong>
          {record.isSystemRole && (
            <Tag color="blue" icon={<LockOutlined />}>
              System
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, record) => {
        const enabledCount = record.permissions.reduce((count, perm) => {
          const actionCount = Object.values(perm.actions).filter((v) => v === true).length;
          return count + actionCount;
        }, 0);
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {enabledCount} Enabled
          </Tag>
        );
      },
    },
    {
      title: 'User Count',
      dataIndex: 'userCount',
      key: 'userCount',
      sorter: (a, b) => a.userCount - b.userCount,
      render: (count) => (
        <Space>
          <TeamOutlined />
          {count}
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleViewRole(record)}>
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
            disabled={record.isSystemRole}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Role"
            description={
              record.userCount > 0
                ? 'This role has active users and cannot be deleted'
                : 'Are you sure you want to delete this role?'
            }
            onConfirm={() => handleDeleteRole(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.isSystemRole || record.userCount > 0}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.isSystemRole || record.userCount > 0}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalPermissions = DEFAULT_PERMISSIONS.reduce((count, perm) => {
    return count + Object.keys(perm.actions).length;
  }, 0);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SafetyCertificateOutlined /> Role Management
      </Title>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Define and manage roles with granular permission control for different user types.
      </p>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Roles"
              value={roles.length}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="System Roles"
              value={roles.filter((r) => r.isSystemRole).length}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={roles.reduce((sum, r) => sum + r.userCount, 0)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Alert
              message="System roles (Admin, User, DevOps) are protected and cannot be modified or deleted."
              type="info"
              showIcon
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole} size="large">
              Create Role
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Roles Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} roles`,
          }}
        />
      </Card>

      {/* Add/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText={editingRole ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe the purpose and responsibilities of this role"
            />
          </Form.Item>

          <Form.Item label="Permissions">
            <Alert
              message={`Configure granular permissions for this role. Total ${totalPermissions} permissions available.`}
              type="info"
              style={{ marginBottom: '16px' }}
            />
            <Collapse defaultActiveKey={['0']}>
              {permissions.map((permission, index) => {
                const enabledActions = Object.entries(permission.actions).filter(
                  ([_, value]) => value
                ).length;
                const totalActions = Object.keys(permission.actions).length;

                return (
                  <Panel
                    header={
                      <Space>
                        <strong>{permission.module}</strong>
                        <Tag color={enabledActions > 0 ? 'green' : 'default'}>
                          {enabledActions}/{totalActions} enabled
                        </Tag>
                      </Space>
                    }
                    key={index.toString()}
                  >
                    <Row gutter={[16, 8]}>
                      {Object.entries(permission.actions).map(([action, checked]) => (
                        <Col span={12} key={action}>
                          <Checkbox
                            checked={checked}
                            onChange={(e) =>
                              handlePermissionChange(index, action, e.target.checked)
                            }
                          >
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Panel>
                );
              })}
            </Collapse>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Role Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined />
            {viewingRole?.name}
            {viewingRole?.isSystemRole && (
              <Tag color="blue" icon={<LockOutlined />}>
                System Role
              </Tag>
            )}
          </Space>
        }
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {viewingRole && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Description" span={2}>
                {viewingRole.description}
              </Descriptions.Item>
              <Descriptions.Item label="Users Assigned">
                <Space>
                  <TeamOutlined />
                  {viewingRole.userCount}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{viewingRole.createdAt}</Descriptions.Item>
              <Descriptions.Item label="Type" span={2}>
                {viewingRole.isSystemRole ? (
                  <Tag color="blue" icon={<LockOutlined />}>
                    System Role (Protected)
                  </Tag>
                ) : (
                  <Tag color="green">Custom Role</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Title level={4}>Permissions</Title>
            <Collapse>
              {viewingRole.permissions.map((permission, index) => {
                const enabledActions = Object.entries(permission.actions).filter(
                  ([_, value]) => value
                );

                return (
                  <Panel
                    header={
                      <Space>
                        <strong>{permission.module}</strong>
                        <Tag color={enabledActions.length > 0 ? 'green' : 'default'}>
                          {enabledActions.length}/{Object.keys(permission.actions).length} enabled
                        </Tag>
                      </Space>
                    }
                    key={index.toString()}
                  >
                    <Row gutter={[16, 8]}>
                      {Object.entries(permission.actions).map(([action, checked]) => (
                        <Col span={12} key={action}>
                          <Space>
                            {checked ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <Text type="secondary">✗</Text>
                            )}
                            <Text type={checked ? undefined : 'secondary'}>
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </Text>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  </Panel>
                );
              })}
            </Collapse>
          </>
        )}
      </Modal>
    </div>
  );
};

export default RoleManagement;
