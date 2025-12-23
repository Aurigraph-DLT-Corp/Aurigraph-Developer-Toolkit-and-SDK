/**
 * User Management Component
 *
 * Provides CRUD operations for user management with role-based access control
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Switch,
  Typography,
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { User, mockUsers, mockRoles } from '../types/user';

const { Option } = Select;
const { Title } = Typography;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form] = Form.useForm();

  // Load users from localStorage or use mock data
  useEffect(() => {
    const storedUsers = localStorage.getItem('aurigraph_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
      setFilteredUsers(parsedUsers);
    } else {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      localStorage.setItem('aurigraph_users', JSON.stringify(mockUsers));
    }
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [searchText, filterRole, filterStatus, users]);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('aurigraph_users', JSON.stringify(newUsers));
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleDeleteUser = (userId: string) => {
    const newUsers = users.filter((user) => user.id !== userId);
    saveUsers(newUsers);
    message.success('User deleted successfully');
  };

  const handleToggleStatus = (userId: string) => {
    const newUsers = users.map((user) => {
      if (user.id === userId) {
        return {
          ...user,
          status: user.status === 'active' ? ('inactive' as const) : ('active' as const),
        };
      }
      return user;
    });
    saveUsers(newUsers);
    message.success('User status updated successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        // Update existing user
        const newUsers = users.map((user) =>
          user.id === editingUser.id ? { ...user, ...values } : user
        );
        saveUsers(newUsers);
        message.success('User updated successfully');
      } else {
        // Add new user
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };
        saveUsers([...users, newUser]);
        message.success('User added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      render: (text) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: mockRoles.map((role) => ({ text: role.name, value: role.name })),
      onFilter: (value, record) => record.role === value,
      render: (role: string) => {
        const color = role === 'Admin' ? 'red' : role === 'DevOps' ? 'blue' : 'green';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      sorter: (a, b) => (a.department || '').localeCompare(b.department || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string, record: User) => (
        <Space>
          <Tag
            icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            color={status === 'active' ? 'success' : 'default'}
          >
            {status.toUpperCase()}
          </Tag>
          <Switch
            size="small"
            checked={status === 'active'}
            onChange={() => handleToggleStatus(record.id)}
          />
        </Space>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      sorter: (a, b) => (a.lastLogin || '').localeCompare(b.lastLogin || ''),
      render: (text) => text || 'Never',
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
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeUsers = users.filter((u) => u.status === 'active').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <TeamOutlined /> User Management
      </Title>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Manage user accounts, roles, and permissions for the Aurigraph Enterprise Portal.
      </p>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={users.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={inactiveUsers}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Role"
              value={filterRole}
              onChange={setFilterRole}
            >
              <Option value="all">All Roles</Option>
              {mockRoles.map((role) => (
                <Option key={role.id} value={role.name}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<UserAddOutlined />} onClick={handleAddUser} size="large">
              Add User
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} users`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={editingUser ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@aurigraph.io" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              {mockRoles.map((role) => (
                <Option key={role.id} value={role.name}>
                  {role.name} - {role.description}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="department" label="Department">
            <Input placeholder="Enter department (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
