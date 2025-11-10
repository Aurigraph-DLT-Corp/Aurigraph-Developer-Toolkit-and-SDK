/**
 * Login Page
 *
 * Provides user authentication interface with:
 * - Username/password form
 * - Error handling and messages
 * - Loading state
 * - Session persistence
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Spin, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { loginAsync } from '../store/authSlice';
import type { RootState } from '../types/state';
import './Login.css';

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [localError, setLocalError] = useState<string | null>(null);

  const { isLoading, error, isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/home');
  }

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      setLocalError(null);
      const result = await dispatch(loginAsync(values));

      if (loginAsync.fulfilled.match(result)) {
        message.success('Login successful!');
        // Navigation happens via authenticated state check
      } else {
        setLocalError(result.payload as string);
        message.error(result.payload as string);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setLocalError(errorMsg);
      message.error(errorMsg);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLocalError(null);
      // Demo account for testing
      const result = await dispatch(
        loginAsync({
          username: 'admin',
          password: 'password123',
        })
      );

      if (loginAsync.fulfilled.match(result)) {
        message.success('Demo login successful!');
      } else {
        setLocalError(result.payload as string);
        message.error(result.payload as string);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Demo login failed';
      setLocalError(errorMsg);
      message.error(errorMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="animated-bg">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="login-content">
        <Card
          className="login-card"
          style={{
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="login-header">
            <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ThunderboltOutlined />
                <span>Aurigraph</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>Enterprise Portal</h2>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                Blockchain Management & Analytics Platform
              </p>
            </Space>
          </div>

          {(error || localError) && (
            <Alert
              message={error || localError}
              type="error"
              showIcon
              closable
              onClose={() => {
                setLocalError(null);
              }}
              style={{ marginBottom: 24 }}
            />
          )}

          <Spin spinning={isLoading}>
            <Form
              form={form}
              layout="vertical"
              size="large"
              onFinish={handleLogin}
              disabled={isLoading}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: 'Please enter your username' },
                  { min: 3, message: 'Username must be at least 3 characters' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isLoading}
                style={{ marginTop: 8, marginBottom: 12 }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <Button
                block
                size="large"
                onClick={handleDemoLogin}
                disabled={isLoading}
                style={{ marginBottom: 16 }}
              >
                Try Demo Account
              </Button>
            </Form>
          </Spin>

          <div className="login-footer">
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', margin: 0 }}>
              Demo Credentials: admin / password123
            </p>
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', margin: '8px 0 0 0' }}>
              Secure session-based authentication
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
