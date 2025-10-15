/**
 * Aurigraph DLT Landing Page
 *
 * Showcase landing page highlighting performance, benefits, and use cases
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, Space, Tag } from 'antd';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  BankOutlined,
  ShoppingOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  BarChartOutlined,
  ApiOutlined,
  LockOutlined,
  RobotOutlined,
  DashboardOutlined,
  FireOutlined,
  TrophyOutlined,
  StarOutlined,
} from '@ant-design/icons';
import './LandingPage.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const [animatedTPS, setAnimatedTPS] = useState(0);

  // Animate TPS counter on mount
  useEffect(() => {
    const targetTPS = 2000000;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetTPS / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetTPS) {
        setAnimatedTPS(targetTPS);
        clearInterval(timer);
      } else {
        setAnimatedTPS(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="blockchain-grid"></div>
          <div className="pulse-circle pulse-1"></div>
          <div className="pulse-circle pulse-2"></div>
          <div className="pulse-circle pulse-3"></div>
        </div>

        <div className="hero-content">
          <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
            <Col xs={24} lg={20} xl={16}>
              <div className="text-center">
                <Title level={1} className="hero-title">
                  <FireOutlined className="hero-icon" />
                  Aurigraph DLT
                </Title>
                <Title level={2} className="hero-subtitle">
                  Next-Generation Blockchain Infrastructure
                </Title>
                <Paragraph className="hero-description" style={{ fontSize: '18px', maxWidth: '800px', margin: '0 auto 40px' }}>
                  High-performance distributed ledger technology delivering <strong>2M+ TPS</strong> with
                  quantum-resistant security, AI-powered consensus, and enterprise-grade reliability.
                </Paragraph>

                {/* Performance Badges */}
                <Space size="large" wrap style={{ marginBottom: '40px' }}>
                  <Tag icon={<ThunderboltOutlined />} color="gold" style={{ padding: '8px 16px', fontSize: '16px' }}>
                    2M+ TPS
                  </Tag>
                  <Tag icon={<SafetyOutlined />} color="green" style={{ padding: '8px 16px', fontSize: '16px' }}>
                    Quantum-Resistant
                  </Tag>
                  <Tag icon={<RobotOutlined />} color="blue" style={{ padding: '8px 16px', fontSize: '16px' }}>
                    AI-Optimized
                  </Tag>
                  <Tag icon={<LockOutlined />} color="purple" style={{ padding: '8px 16px', fontSize: '16px' }}>
                    NIST Level 5
                  </Tag>
                </Space>

                {/* CTA Buttons */}
                <Space size="large" wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DashboardOutlined />}
                    style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
                  >
                    View Dashboard
                  </Button>
                  <Button
                    size="large"
                    icon={<ApiOutlined />}
                    style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
                  >
                    API Documentation
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Performance Metrics Section */}
      <section className="metrics-section" style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #001529 0%, #002140 100%)' }}>
        <Row justify="center">
          <Col xs={24} lg={20} xl={18}>
            <div className="text-center" style={{ marginBottom: '60px' }}>
              <Title level={2} style={{ color: '#fff' }}>
                <TrophyOutlined style={{ marginRight: '12px', color: '#faad14' }} />
                Unmatched Performance
              </Title>
              <Paragraph style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
                Industry-leading throughput and minimal latency for mission-critical applications
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="metric-card" bordered={false}>
                  <Statistic
                    title={<span style={{ fontSize: '16px' }}>Throughput</span>}
                    value={animatedTPS.toLocaleString()}
                    suffix="TPS"
                    prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14', fontSize: '32px', fontWeight: 'bold' }}
                  />
                  <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                    Target: 2M+ transactions per second
                  </Paragraph>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="metric-card" bordered={false}>
                  <Statistic
                    title={<span style={{ fontSize: '16px' }}>Finality</span>}
                    value="<100"
                    suffix="ms"
                    prefix={<RocketOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
                  />
                  <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                    Sub-second transaction confirmation
                  </Paragraph>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="metric-card" bordered={false}>
                  <Statistic
                    title={<span style={{ fontSize: '16px' }}>Uptime</span>}
                    value="99.999"
                    suffix="%"
                    prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff', fontSize: '32px', fontWeight: 'bold' }}
                  />
                  <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                    Five nines availability guarantee
                  </Paragraph>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="metric-card" bordered={false}>
                  <Statistic
                    title={<span style={{ fontSize: '16px' }}>Latency (P99)</span>}
                    value="<50"
                    suffix="ms"
                    prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1', fontSize: '32px', fontWeight: 'bold' }}
                  />
                  <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                    99th percentile response time
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* Key Features Section */}
      <section className="features-section" style={{ padding: '80px 24px', background: '#fff' }}>
        <Row justify="center">
          <Col xs={24} lg={20} xl={18}>
            <div className="text-center" style={{ marginBottom: '60px' }}>
              <Title level={2}>
                <StarOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                Enterprise-Grade Features
              </Title>
              <Paragraph style={{ fontSize: '16px', color: 'rgba(0,0,0,0.65)' }}>
                Built for the most demanding enterprise applications
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <SafetyOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={4}>Quantum-Resistant Security</Title>
                  <Paragraph>
                    NIST Level 5 post-quantum cryptography with CRYSTALS-Dilithium signatures and
                    CRYSTALS-Kyber key encapsulation for future-proof security.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>CRYSTALS-Dilithium signatures</li>
                    <li>CRYSTALS-Kyber KEM</li>
                    <li>256-bit quantum security</li>
                    <li>Hardware security module integration</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={4}>AI-Powered Consensus</Title>
                  <Paragraph>
                    HyperRAFT++ consensus algorithm enhanced with machine learning for
                    adaptive optimization and predictive transaction ordering.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>ML-based consensus tuning</li>
                    <li>Anomaly detection</li>
                    <li>Predictive load balancing</li>
                    <li>Online learning capabilities</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <GlobalOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
                  <Title level={4}>Cross-Chain Interoperability</Title>
                  <Paragraph>
                    Seamless asset transfers and communication across multiple blockchain networks
                    with secure bridge protocols and atomic swaps.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>Multi-chain asset transfers</li>
                    <li>Atomic cross-chain swaps</li>
                    <li>Bridge adapters for major chains</li>
                    <li>Unified liquidity pools</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <BankOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
                  <Title level={4}>Real-World Asset Tokenization</Title>
                  <Paragraph>
                    Tokenize physical assets including real estate, commodities, art, and more
                    with compliance tracking and regulatory frameworks.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>Asset fractional ownership</li>
                    <li>KYC/AML compliance</li>
                    <li>Third-party verification</li>
                    <li>Regulatory compliance tracking</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <ApiOutlined style={{ fontSize: '48px', color: '#13c2c2', marginBottom: '16px' }} />
                  <Title level={4}>Smart Contract Platform</Title>
                  <Paragraph>
                    Deploy and execute Ricardian contracts that combine human-readable legal
                    agreements with machine-executable smart contracts.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>Ricardian contract support</li>
                    <li>Multi-language smart contracts</li>
                    <li>Automated contract execution</li>
                    <li>Formal verification tools</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card className="feature-card" hoverable bordered={false}>
                  <CloudServerOutlined style={{ fontSize: '48px', color: '#eb2f96', marginBottom: '16px' }} />
                  <Title level={4}>Enterprise Integration</Title>
                  <Paragraph>
                    Production-ready with Java 21, Quarkus framework, and GraalVM native compilation
                    for minimal resource footprint and maximum performance.
                  </Paragraph>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(0,0,0,0.65)' }}>
                    <li>Java 21 virtual threads</li>
                    <li>Sub-second native startup</li>
                    <li>gRPC + HTTP/2 protocols</li>
                    <li>Kubernetes-native deployment</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section" style={{ padding: '80px 24px', background: '#f0f2f5' }}>
        <Row justify="center">
          <Col xs={24} lg={20} xl={18}>
            <div className="text-center" style={{ marginBottom: '60px' }}>
              <Title level={2}>
                <RocketOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
                Real-World Use Cases
              </Title>
              <Paragraph style={{ fontSize: '16px', color: 'rgba(0,0,0,0.65)' }}>
                Powering innovation across industries
              </Paragraph>
            </div>

            <Row gutter={[32, 32]}>
              <Col xs={24} lg={12}>
                <Card className="use-case-card" bordered={false}>
                  <Space align="start" size="large">
                    <BankOutlined style={{ fontSize: '40px', color: '#1890ff' }} />
                    <div>
                      <Title level={4}>Financial Services</Title>
                      <Paragraph>
                        High-frequency trading, cross-border payments, securities settlement,
                        and digital asset custody with institutional-grade security and compliance.
                      </Paragraph>
                      <Space wrap>
                        <Tag>Securities Trading</Tag>
                        <Tag>Payment Processing</Tag>
                        <Tag>Asset Custody</Tag>
                        <Tag>DeFi Protocols</Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="use-case-card" bordered={false}>
                  <Space align="start" size="large">
                    <ShoppingOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                    <div>
                      <Title level={4}>Supply Chain Management</Title>
                      <Paragraph>
                        End-to-end traceability, provenance tracking, inventory management,
                        and smart contract automation for global supply chains.
                      </Paragraph>
                      <Space wrap>
                        <Tag>Product Traceability</Tag>
                        <Tag>Logistics Tracking</Tag>
                        <Tag>Quality Assurance</Tag>
                        <Tag>Authenticity Verification</Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="use-case-card" bordered={false}>
                  <Space align="start" size="large">
                    <MedicineBoxOutlined style={{ fontSize: '40px', color: '#eb2f96' }} />
                    <div>
                      <Title level={4}>Healthcare & Life Sciences</Title>
                      <Paragraph>
                        Secure patient data management, clinical trial tracking, pharmaceutical
                        supply chain, and interoperable health records with HIPAA compliance.
                      </Paragraph>
                      <Space wrap>
                        <Tag>Medical Records</Tag>
                        <Tag>Drug Traceability</Tag>
                        <Tag>Clinical Trials</Tag>
                        <Tag>HIPAA Compliant</Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="use-case-card" bordered={false}>
                  <Space align="start" size="large">
                    <CarOutlined style={{ fontSize: '40px', color: '#faad14' }} />
                    <div>
                      <Title level={4}>Automotive & IoT</Title>
                      <Paragraph>
                        Connected vehicle ecosystems, autonomous vehicle coordination,
                        maintenance records, and IoT device management with real-time data processing.
                      </Paragraph>
                      <Space wrap>
                        <Tag>Vehicle History</Tag>
                        <Tag>IoT Integration</Tag>
                        <Tag>Fleet Management</Tag>
                        <Tag>Smart Contracts</Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* Technology Stack Section */}
      <section className="tech-stack-section" style={{ padding: '80px 24px', background: '#001529', color: '#fff' }}>
        <Row justify="center">
          <Col xs={24} lg={20} xl={18}>
            <div className="text-center" style={{ marginBottom: '60px' }}>
              <Title level={2} style={{ color: '#fff' }}>
                <CloudServerOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                Modern Technology Stack
              </Title>
              <Paragraph style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
                Built on cutting-edge technologies for maximum performance and reliability
              </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">☕</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>Java 21</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Virtual Threads
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">⚡</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>Quarkus</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Reactive Framework
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">🚀</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>GraalVM</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Native Compilation
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">📡</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>gRPC</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Protocol Buffers
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">🔒</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>CRYSTALS</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Quantum-Resistant
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">🤖</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>TensorFlow</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    AI Optimization
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">☸️</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>Kubernetes</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    Cloud Native
                  </Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="tech-item text-center">
                  <div className="tech-icon">🐘</div>
                  <Text style={{ color: '#fff', display: 'block', marginTop: '12px' }}>LevelDB</Text>
                  <Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                    State Storage
                  </Text>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{ padding: '100px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <Row justify="center">
          <Col xs={24} lg={16} className="text-center">
            <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
              Ready to Build on Aurigraph DLT?
            </Title>
            <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.95)', marginBottom: '40px' }}>
              Join the future of enterprise blockchain with unmatched performance, security, and scalability.
            </Paragraph>
            <Space size="large" wrap>
              <Button
                type="primary"
                size="large"
                ghost
                icon={<DashboardOutlined />}
                style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
              >
                Get Started
              </Button>
              <Button
                size="large"
                ghost
                icon={<ApiOutlined />}
                style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
              >
                View Documentation
              </Button>
            </Space>
          </Col>
        </Row>
      </section>

      {/* Footer */}
      <section className="landing-footer" style={{ padding: '40px 24px', background: '#000', color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
        <Row justify="center">
          <Col xs={24}>
            <Space split="|" size="large" wrap>
              <a href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.65)' }}>
                GitHub
              </a>
              <a href="https://aurigraphdlt.atlassian.net" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.65)' }}>
                JIRA
              </a>
              <span>API Documentation</span>
              <span>White Paper</span>
              <span>Contact</span>
            </Space>
            <Paragraph style={{ marginTop: '24px', color: 'rgba(255,255,255,0.45)' }}>
              © 2025 Aurigraph DLT. All rights reserved. | Version 11.0.0
            </Paragraph>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default LandingPage;
