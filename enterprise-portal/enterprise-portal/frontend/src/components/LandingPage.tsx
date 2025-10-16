/**
 * Landing Page Component
 *
 * Displays Aurigraph DLT platform features, benefits, and use cases
 * Provides entry point to the enterprise portal
 */

import React, { useEffect, useState } from 'react';
import { Button, Card, Row, Col, Typography, Badge, Statistic } from 'antd';
import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

interface LandingPageProps {
  onEnterPortal: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal }) => {
  const [tpsCounter, setTpsCounter] = useState(0);

  // Animate TPS counter from 0 to 2M
  useEffect(() => {
    const targetTps = 2000000;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetTps / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetTps) {
        setTpsCounter(targetTps);
        clearInterval(timer);
      } else {
        setTpsCounter(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
      title: 'Ultra-High Performance',
      description: 'Process over 2 million transactions per second with sub-100ms finality, powered by HyperRAFT++ consensus algorithm and AI-driven optimization.',
      metrics: ['2M+ TPS', '<100ms Finality', '99.999% Uptime']
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: 'Quantum-Resistant Security',
      description: 'Future-proof your blockchain infrastructure with NIST Level 5 post-quantum cryptography using CRYSTALS-Kyber and Dilithium algorithms.',
      metrics: ['NIST Level 5', 'CRYSTALS-Kyber', 'Dilithium Signatures']
    },
    {
      icon: <RobotOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: 'AI-Powered Optimization',
      description: 'Machine learning algorithms continuously optimize consensus, transaction ordering, and resource allocation for peak performance.',
      metrics: ['ML Optimization', 'Predictive Ordering', 'Anomaly Detection']
    },
    {
      icon: <GlobalOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      title: 'Cross-Chain Interoperability',
      description: 'Seamlessly connect with Ethereum, Bitcoin, Solana, and other major blockchains through our advanced cross-chain bridge technology.',
      metrics: ['Multi-Chain', 'Bridge Protocol', 'Asset Transfer']
    },
    {
      icon: <BankOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
      title: 'Real-World Asset Tokenization',
      description: 'Tokenize physical assets, commodities, and securities with built-in compliance, KYC/AML integration, and regulatory frameworks.',
      metrics: ['Asset Tokenization', 'KYC/AML', 'Compliance']
    },
    {
      icon: <RocketOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
      title: 'Smart Contract Platform',
      description: 'Deploy and manage smart contracts with Ricardian contract support, formal verification, and enterprise-grade tooling.',
      metrics: ['Smart Contracts', 'Ricardian Contracts', 'Formal Verification']
    }
  ];

  const useCases = [
    {
      title: 'Financial Services',
      description: 'High-frequency trading, payment processing, DeFi applications, and cross-border settlements with institutional-grade security.',
      industries: ['Banking', 'Trading', 'DeFi', 'Payments']
    },
    {
      title: 'Supply Chain Management',
      description: 'End-to-end traceability, provenance tracking, and automated compliance for global supply chains.',
      industries: ['Logistics', 'Manufacturing', 'Retail', 'Food Safety']
    },
    {
      title: 'Healthcare & Life Sciences',
      description: 'Secure patient data management, clinical trial tracking, and pharmaceutical supply chain integrity.',
      industries: ['Healthcare', 'Pharmaceuticals', 'Clinical Research', 'Insurance']
    },
    {
      title: 'Automotive & IoT',
      description: 'Vehicle identity management, autonomous vehicle coordination, and IoT device authentication at scale.',
      industries: ['Automotive', 'IoT', 'Smart Cities', 'Transportation']
    }
  ];

  const performanceMetrics = [
    { title: 'Throughput', value: tpsCounter, suffix: ' TPS', color: '#faad14' },
    { title: 'Finality', value: 100, suffix: ' ms', prefix: '<', color: '#52c41a' },
    { title: 'Uptime', value: 99.999, suffix: '%', color: '#1890ff' },
    { title: 'Latency (P99)', value: 50, suffix: ' ms', prefix: '<', color: '#722ed1' }
  ];

  const techStack = [
    'Java 21',
    'Quarkus',
    'GraalVM',
    'gRPC',
    'CRYSTALS',
    'TensorFlow',
    'Kubernetes',
    'LevelDB'
  ];

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="blockchain-grid"></div>
      <div className="pulse-circle pulse-1"></div>
      <div className="pulse-circle pulse-2"></div>
      <div className="pulse-circle pulse-3"></div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <Badge.Ribbon text="NIST Level 5 Certified" color="gold" className="cert-badge">
            <div className="hero-text">
              <Title level={1} className="hero-title">
                Aurigraph DLT
              </Title>
              <Title level={2} className="hero-subtitle">
                Next-Generation Enterprise Blockchain Platform
              </Title>
              <Paragraph className="hero-description">
                The world's fastest quantum-resistant blockchain platform with AI-powered consensus,
                delivering 2M+ TPS for mission-critical enterprise applications.
              </Paragraph>

              <div className="hero-badges">
                <Badge count="2M+ TPS" style={{ backgroundColor: '#faad14' }} />
                <Badge count="Quantum-Resistant" style={{ backgroundColor: '#52c41a' }} />
                <Badge count="AI-Optimized" style={{ backgroundColor: '#1890ff' }} />
                <Badge count="Multi-Chain" style={{ backgroundColor: '#722ed1' }} />
              </div>

              <div className="hero-cta">
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={onEnterPortal}
                  className="portal-button"
                >
                  Access Enterprise Portal
                </Button>
                <Button
                  size="large"
                  icon={<RocketOutlined />}
                  href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT"
                  target="_blank"
                  className="docs-button"
                >
                  View Documentation
                </Button>
              </div>
            </div>
          </Badge.Ribbon>
        </div>

        {/* Performance Metrics */}
        <div className="performance-section">
          <Row gutter={[24, 24]}>
            {performanceMetrics.map((metric, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card className="performance-card" hoverable>
                  <Statistic
                    title={metric.title}
                    value={metric.value}
                    suffix={metric.suffix}
                    prefix={metric.prefix}
                    valueStyle={{ color: metric.color, fontSize: '32px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <Title level={2} className="section-title">Platform Features</Title>
        <Paragraph className="section-description">
          Enterprise-grade blockchain infrastructure with cutting-edge technology
        </Paragraph>

        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon">{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph>{feature.description}</Paragraph>
                <div className="feature-metrics">
                  {feature.metrics.map((metric, idx) => (
                    <Badge
                      key={idx}
                      count={metric}
                      style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                    />
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Use Cases Section */}
      <div className="use-cases-section">
        <Title level={2} className="section-title">Industry Use Cases</Title>
        <Paragraph className="section-description">
          Powering mission-critical applications across industries
        </Paragraph>

        <Row gutter={[32, 32]}>
          {useCases.map((useCase, index) => (
            <Col xs={24} md={12} key={index}>
              <Card className="use-case-card" hoverable>
                <CheckCircleOutlined className="check-icon" />
                <Title level={4}>{useCase.title}</Title>
                <Paragraph>{useCase.description}</Paragraph>
                <div className="industry-tags">
                  {useCase.industries.map((industry, idx) => (
                    <Text key={idx} className="industry-tag">
                      {industry}
                    </Text>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Technology Stack */}
      <div className="tech-stack-section">
        <Title level={2} className="section-title">Built with Modern Technology</Title>
        <Paragraph className="section-description">
          Leveraging the latest advancements in distributed systems and cryptography
        </Paragraph>

        <div className="tech-stack-grid">
          {techStack.map((tech, index) => (
            <Card key={index} className="tech-card" hoverable>
              <Text strong>{tech}</Text>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="cta-section">
        <Card className="cta-card">
          <Title level={3}>Ready to Experience the Future of Blockchain?</Title>
          <Paragraph>
            Access the Enterprise Portal to explore our platform's capabilities,
            monitor real-time performance, and manage your blockchain infrastructure.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={onEnterPortal}
            className="cta-button"
          >
            Enter Enterprise Portal
          </Button>
        </Card>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <Paragraph className="footer-text">
          © 2025 Aurigraph DLT. Enterprise Blockchain Platform v11.3.1
        </Paragraph>
        <Paragraph className="footer-links">
          <a href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
          <a href="https://aurigraphdlt.atlassian.net" target="_blank" rel="noopener noreferrer">
            JIRA
          </a>
          {' · '}
          <a href="https://dlt.aurigraph.io" target="_blank" rel="noopener noreferrer">
            Production
          </a>
        </Paragraph>
      </div>
    </div>
  );
};

export default LandingPage;
