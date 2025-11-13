/**
 * Demo User Registration Component
 *
 * Handles user registration with company and contact details
 * Allows users to share demo results to social media
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Divider,
  Space,
  Row,
  Col,
  Card,
  Typography,
} from 'antd';
import {
  LinkedinOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { highThroughputDemoService } from '../../services/HighThroughputDemoService';

const { Paragraph } = Typography;

interface RegistrationData {
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  country: string;
}

interface DemoResults {
  channelId: string;
  peakTps: number;
  avgLatency: number;
  successRate: number;
  duration: number;
  nodeCount: number;
}

interface DemoUserRegistrationProps {
  visible: boolean;
  onClose: () => void;
  demoResults?: DemoResults;
  onRegistrationSuccess?: (data: RegistrationData) => void;
}

const DemoUserRegistration: React.FC<DemoUserRegistrationProps> = ({
  visible,
  onClose,
  demoResults,
  onRegistrationSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');

  const handleRegistration = async (values: RegistrationData) => {
    setLoading(true);
    try {
      // Register user
      const response = await highThroughputDemoService.registerDemoUser({
        ...values,
        demoMetrics: demoResults || undefined,
      });

      if (response.success) {
        // Generate shareable link
        const link = `${window.location.origin}/demo-result/${response.registrationId}`;
        setShareableLink(link);
        setRegistrationComplete(true);
        message.success('Registration successful! You can now share your results.');

        if (onRegistrationSuccess) {
          onRegistrationSuccess(values);
        }
      } else {
        message.error('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Error during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSocialShareText = (): string => {
    if (!demoResults) return '';

    return `I just tested the Aurigraph DLT high-throughput demo! 🚀\n\nResults:\n✨ Peak TPS: ${demoResults.peakTps.toLocaleString()}\n⚡ Avg Latency: ${demoResults.avgLatency.toFixed(2)}ms\n✅ Success Rate: ${demoResults.successRate.toFixed(2)}%\n\nTry it yourself and join the next generation of blockchain! #Aurigraph #Blockchain #Web3`;
  };

  const shareToSocialMedia = (platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram') => {
    const text = generateSocialShareText();
    const encodedText = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(shareableLink);

    let shareUrl = '';

    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, but we'll copy the text
        message.info('Instagram share: Copy the link and share in your Instagram bio or stories');
        navigator.clipboard.writeText(`${text}\n\nResults: ${shareableLink}`);
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    message.success('Link copied to clipboard!');
  };

  const handleClose = () => {
    if (registrationComplete) {
      setRegistrationComplete(false);
      form.resetFields();
      setShareableLink('');
    }
    onClose();
  };

  return (
    <Modal
      title={registrationComplete ? 'Share Your Demo Results' : 'Register for Demo Access'}
      visible={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
      centered
      className="demo-registration-modal"
    >
      {!registrationComplete ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegistration}
          autoComplete="off"
        >
          <Paragraph style={{ marginBottom: 24 }}>
            Register to track your demo results and share them on social media
          </Paragraph>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="John Doe" size="large" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="john@example.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Company Name"
            name="company"
            rules={[{ required: true, message: 'Please enter your company name' }]}
          >
            <Input placeholder="Your Company" size="large" />
          </Form.Item>

          <Form.Item
            label="Job Title"
            name="jobTitle"
            rules={[{ required: true, message: 'Please enter your job title' }]}
          >
            <Input placeholder="e.g., Blockchain Engineer, CTO, Product Manager" size="large" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="+1 (555) 000-0000" size="large" />
          </Form.Item>

          <Form.Item
            label="Country"
            name="country"
            rules={[{ required: true, message: 'Please select your country' }]}
          >
            <Input placeholder="United States" size="large" />
          </Form.Item>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleClose} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={() => form.submit()}
            >
              Register & Continue
            </Button>
          </Space>
        </Form>
      ) : (
        <div>
          {/* Success Message */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <CheckCircleOutlined
              style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}
            />
            <Paragraph style={{ fontSize: 16, fontWeight: 500 }}>
              Registration Successful!
            </Paragraph>
            <Paragraph style={{ color: '#666' }}>
              Your demo results have been saved. Share your achievement with your network!
            </Paragraph>
          </div>

          {/* Demo Results Summary */}
          {demoResults && (
            <Card style={{ marginBottom: 24, background: '#fafafa' }}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                      {demoResults.peakTps.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Peak TPS</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {demoResults.avgLatency.toFixed(2)}ms
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Avg Latency</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {demoResults.successRate.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Success Rate</div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                      {demoResults.nodeCount}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Total Nodes</div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Shareable Link */}
          <div style={{ marginBottom: 24 }}>
            <Paragraph style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
              Your Shareable Link:
            </Paragraph>
            <div
              style={{
                display: 'flex',
                gap: 8,
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
              }}
            >
              <Input
                value={shareableLink}
                readOnly
                size="large"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={copyLink}
                size="large"
              >
                Copy
              </Button>
            </div>
          </div>

          <Divider />

          {/* Social Media Sharing */}
          <Paragraph style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
            Share on Social Media:
          </Paragraph>

          <Space wrap style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              size="large"
              icon={<LinkedinOutlined />}
              onClick={() => shareToSocialMedia('linkedin')}
              style={{ background: '#0A66C2' }}
            >
              LinkedIn
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<FacebookOutlined />}
              onClick={() => shareToSocialMedia('facebook')}
              style={{ background: '#1877F2' }}
            >
              Facebook
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<TwitterOutlined />}
              onClick={() => shareToSocialMedia('twitter')}
              style={{ background: '#000000' }}
            >
              X (Twitter)
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<InstagramOutlined />}
              onClick={() => shareToSocialMedia('instagram')}
              style={{ background: '#E4405F' }}
            >
              Instagram
            </Button>
          </Space>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button type="primary" size="large" onClick={handleClose}>
              Done
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default DemoUserRegistration;
