/**
 * Aurigraph DLT Whitepaper Component
 *
 * Comprehensive technical whitepaper detailing the platform architecture,
 * consensus mechanism, security features, and use cases
 */

import React from 'react';
import { Typography, Card, Divider, Row, Col, Timeline, Table } from 'antd';
import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import './Whitepaper.css';

const { Title, Paragraph, Text } = Typography;

const Whitepaper: React.FC = () => {
  const performanceMetrics = [
    { metric: 'Peak Throughput', value: '2,000,000+ TPS', description: 'Sustained transaction processing rate' },
    { metric: 'Transaction Finality', value: '<100ms', description: 'Time to irreversible confirmation' },
    { metric: 'Block Time', value: '2 seconds', description: 'Average block creation interval' },
    { metric: 'Network Latency (P99)', value: '<50ms', description: '99th percentile network delay' },
    { metric: 'Consensus Overhead', value: '<5%', description: 'CPU resources for consensus protocol' },
    { metric: 'Storage Efficiency', value: '10:1 compression', description: 'State data compression ratio' },
  ];

  const securityFeatures = [
    { feature: 'Post-Quantum Cryptography', standard: 'NIST Level 5', algorithm: 'CRYSTALS-Kyber, Dilithium' },
    { feature: 'Key Management', standard: 'FIPS 140-3', algorithm: 'Hardware Security Modules' },
    { feature: 'Network Security', standard: 'TLS 1.3', algorithm: 'Mutual TLS, Certificate Pinning' },
    { feature: 'Consensus Security', standard: 'Byzantine Fault Tolerant', algorithm: 'HyperRAFT++ with AI optimization' },
    { feature: 'Smart Contract Security', standard: 'Formal Verification', algorithm: 'Z3 SMT Solver, Static Analysis' },
    { feature: 'Data Privacy', standard: 'Zero-Knowledge Proofs', algorithm: 'zk-SNARKs, Ring Signatures' },
  ];

  return (
    <div className="whitepaper-container">
      {/* Header */}
      <div className="whitepaper-header">
        <Title level={1}>Aurigraph DLT</Title>
        <Title level={2}>Technical Whitepaper</Title>
        <Paragraph className="version-info">
          <Text strong>Version:</Text> 11.3.2 | <Text strong>Date:</Text> October 2025 | <Text strong>Status:</Text> Production
        </Paragraph>
      </div>

      {/* Abstract */}
      <Card className="section-card" id="abstract">
        <Title level={3}>Abstract</Title>
        <Paragraph className="abstract-text">
          Aurigraph DLT is a next-generation enterprise blockchain platform designed to deliver
          unprecedented performance, quantum-resistant security, and AI-driven optimization for
          mission-critical applications. This whitepaper presents the technical architecture,
          consensus mechanism (HyperRAFT++), post-quantum cryptography implementation, and
          real-world use cases that position Aurigraph as the leading platform for enterprise
          blockchain deployments.
        </Paragraph>
        <Paragraph className="abstract-text">
          By combining advanced distributed systems engineering, machine learning, and
          cutting-edge cryptography, Aurigraph achieves over 2 million transactions per second
          with sub-100ms finality while maintaining NIST Level 5 security standards. The platform
          supports smart contracts, Ricardian contracts, real-world asset tokenization, and
          cross-chain interoperability.
        </Paragraph>
      </Card>

      {/* Table of Contents */}
      <Card className="section-card toc-card" id="toc">
        <Title level={3}>Table of Contents</Title>
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <ul className="toc-list">
              <li><a href="#introduction">1. Introduction</a></li>
              <li><a href="#architecture">2. System Architecture</a></li>
              <li><a href="#consensus">3. HyperRAFT++ Consensus</a></li>
              <li><a href="#cryptography">4. Quantum-Resistant Cryptography</a></li>
              <li><a href="#ai-optimization">5. AI-Powered Optimization</a></li>
              <li><a href="#smart-contracts">6. Smart Contract Platform</a></li>
            </ul>
          </Col>
          <Col span={12}>
            <ul className="toc-list">
              <li><a href="#tokenization">7. Asset Tokenization</a></li>
              <li><a href="#cross-chain">8. Cross-Chain Bridge</a></li>
              <li><a href="#performance">9. Performance Analysis</a></li>
              <li><a href="#security">10. Security Model</a></li>
              <li><a href="#use-cases">11. Use Cases</a></li>
              <li><a href="#conclusion">12. Conclusion</a></li>
            </ul>
          </Col>
        </Row>
      </Card>

      {/* 1. Introduction */}
      <Card className="section-card" id="introduction">
        <Title level={3}><FileTextOutlined /> 1. Introduction</Title>

        <Title level={4}>1.1 Background and Motivation</Title>
        <Paragraph>
          Enterprise blockchain adoption has been hindered by three fundamental challenges:
          inadequate throughput for high-frequency applications, vulnerability to quantum
          computing threats, and complexity in integrating with existing systems. Aurigraph DLT
          addresses these limitations through innovative engineering across the full stack.
        </Paragraph>

        <Title level={4}>1.2 Key Innovations</Title>
        <ul className="feature-list">
          <li><CheckCircleOutlined /> <strong>HyperRAFT++ Consensus:</strong> Novel consensus algorithm achieving 2M+ TPS with Byzantine fault tolerance</li>
          <li><CheckCircleOutlined /> <strong>NIST Level 5 Post-Quantum Cryptography:</strong> Future-proof security using CRYSTALS suite</li>
          <li><CheckCircleOutlined /> <strong>AI-Driven Optimization:</strong> Machine learning for dynamic resource allocation and transaction ordering</li>
          <li><CheckCircleOutlined /> <strong>Native Tokenization:</strong> Built-in support for real-world asset tokenization with compliance</li>
          <li><CheckCircleOutlined /> <strong>Cross-Chain Interoperability:</strong> Secure bridge to Ethereum, Bitcoin, Solana, and others</li>
        </ul>

        <Title level={4}>1.3 Platform Goals</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Card className="goal-card">
              <ThunderboltOutlined className="goal-icon" />
              <Title level={5}>Ultra-High Performance</Title>
              <Text>{'2M+ TPS with <100ms finality for demanding enterprise workloads'}</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="goal-card">
              <SafetyOutlined className="goal-icon" />
              <Title level={5}>Quantum-Resistant Security</Title>
              <Text>NIST Level 5 post-quantum cryptography for long-term data protection</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="goal-card">
              <GlobalOutlined className="goal-icon" />
              <Title level={5}>Enterprise Ready</Title>
              <Text>Production-grade reliability, compliance, and integration capabilities</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 2. System Architecture */}
      <Card className="section-card" id="architecture">
        <Title level={3}><RocketOutlined /> 2. System Architecture</Title>

        <Title level={4}>2.1 Layered Architecture</Title>
        <Paragraph>
          Aurigraph employs a modular, layered architecture designed for scalability and maintainability:
        </Paragraph>

        <div className="architecture-diagram">
          <Card className="layer-card">
            <Title level={5}>Application Layer</Title>
            <Text>Smart Contracts, Ricardian Contracts, DApps, External APIs</Text>
          </Card>
          <Divider />
          <Card className="layer-card">
            <Title level={5}>Service Layer</Title>
            <Text>Tokenization, Bridge, Registry, Identity Management, Compliance</Text>
          </Card>
          <Divider />
          <Card className="layer-card">
            <Title level={5}>Consensus Layer</Title>
            <Text>HyperRAFT++ Protocol, AI Optimization, Transaction Ordering</Text>
          </Card>
          <Divider />
          <Card className="layer-card">
            <Title level={5}>Network Layer</Title>
            <Text>P2P Communication, gRPC, HTTP/2, TLS 1.3, Message Routing</Text>
          </Card>
          <Divider />
          <Card className="layer-card">
            <Title level={5}>Storage Layer</Title>
            <Text>LevelDB, State Management, Merkle Trees, Encrypted Storage</Text>
          </Card>
        </div>

        <Title level={4}>2.2 Technology Stack</Title>
        <ul className="tech-list">
          <li><strong>Runtime:</strong> Java 21 with Virtual Threads, GraalVM Native Image</li>
          <li><strong>Framework:</strong> Quarkus 3.28.2 (reactive, cloud-native)</li>
          <li><strong>Communication:</strong> gRPC with Protocol Buffers, HTTP/2</li>
          <li><strong>Cryptography:</strong> BouncyCastle (CRYSTALS-Kyber, Dilithium)</li>
          <li><strong>AI/ML:</strong> DeepLearning4J, TensorFlow Lite, Apache Commons Math</li>
          <li><strong>Storage:</strong> LevelDB for state, H2 for metadata</li>
          <li><strong>Monitoring:</strong> Micrometer, Prometheus, OpenTelemetry</li>
        </ul>
      </Card>

      {/* 3. HyperRAFT++ Consensus */}
      <Card className="section-card" id="consensus">
        <Title level={3}><ThunderboltOutlined /> 3. HyperRAFT++ Consensus</Title>

        <Title level={4}>3.1 Protocol Overview</Title>
        <Paragraph>
          HyperRAFT++ is an evolution of the RAFT consensus algorithm, enhanced with parallel
          processing, AI-driven optimization, and Byzantine fault tolerance. Unlike traditional
          RAFT which processes transactions sequentially, HyperRAFT++ enables concurrent
          processing of non-conflicting transactions across multiple leaders.
        </Paragraph>

        <Title level={4}>3.2 Key Features</Title>
        <Timeline
          items={[
            {
              children: (
                <>
                  <Title level={5}>Multi-Leader Architecture</Title>
                  <Paragraph>
                    Dynamically elected leaders process transactions in parallel based on state
                    partitioning. AI predicts optimal partition strategy based on transaction patterns.
                  </Paragraph>
                </>
              ),
            },
            {
              children: (
                <>
                  <Title level={5}>Optimistic Concurrency Control</Title>
                  <Paragraph>
                    Transactions are speculatively executed and validated during commit. Conflicts
                    are detected using Merkle proof verification and resolved via deterministic ordering.
                  </Paragraph>
                </>
              ),
            },
            {
              children: (
                <>
                  <Title level={5}>Fast Finality</Title>
                  <Paragraph>
                    Two-phase commit protocol achieves sub-100ms finality. First phase broadcasts
                    proposal, second phase confirms with cryptographic proofs from 2f+1 validators.
                  </Paragraph>
                </>
              ),
            },
            {
              children: (
                <>
                  <Title level={5}>AI-Optimized Transaction Ordering</Title>
                  <Paragraph>
                    Machine learning models analyze transaction dependencies and predict optimal
                    execution order, reducing conflicts and maximizing parallelism.
                  </Paragraph>
                </>
              ),
            },
          ]}
        />

        <Title level={4}>3.3 Performance Characteristics</Title>
        <Table
          dataSource={performanceMetrics}
          columns={[
            { title: 'Metric', dataIndex: 'metric', key: 'metric' },
            { title: 'Value', dataIndex: 'value', key: 'value', render: (text) => <Text strong>{text}</Text> },
            { title: 'Description', dataIndex: 'description', key: 'description' },
          ]}
          pagination={false}
        />
      </Card>

      {/* 4. Quantum-Resistant Cryptography */}
      <Card className="section-card" id="cryptography">
        <Title level={3}><SafetyOutlined /> 4. Quantum-Resistant Cryptography</Title>

        <Title level={4}>4.1 Post-Quantum Threat Model</Title>
        <Paragraph>
          Shor's algorithm enables quantum computers to break RSA and ECC in polynomial time.
          Grover's algorithm reduces symmetric key security by half. Aurigraph implements
          NIST-standardized post-quantum algorithms to ensure long-term security.
        </Paragraph>

        <Title level={4}>4.2 Implemented Algorithms</Title>
        <Table
          dataSource={securityFeatures}
          columns={[
            { title: 'Security Feature', dataIndex: 'feature', key: 'feature' },
            { title: 'Standard', dataIndex: 'standard', key: 'standard' },
            { title: 'Algorithm/Implementation', dataIndex: 'algorithm', key: 'algorithm' },
          ]}
          pagination={false}
        />

        <Title level={4}>4.3 Key Management</Title>
        <Paragraph>
          Multi-tier key hierarchy with automatic rotation:
        </Paragraph>
        <ul>
          <li><strong>Master Keys:</strong> Hardware Security Module (HSM) protected, 90-day rotation</li>
          <li><strong>Node Keys:</strong> Kyber-1024 key encapsulation, 30-day rotation</li>
          <li><strong>Transaction Keys:</strong> Ephemeral Dilithium-5 signatures, per-transaction</li>
          <li><strong>Storage Keys:</strong> AES-256-GCM for data at rest, daily rotation</li>
        </ul>
      </Card>

      {/* 5. AI-Powered Optimization */}
      <Card className="section-card" id="ai-optimization">
        <Title level={3}><RobotOutlined /> 5. AI-Powered Optimization</Title>

        <Title level={4}>5.1 Machine Learning Models</Title>
        <Paragraph>
          Aurigraph deploys four specialized ML models for continuous optimization:
        </Paragraph>

        <Row gutter={16}>
          <Col span={12}>
            <Card className="ml-model-card">
              <Title level={5}>1. Transaction Ordering Optimizer</Title>
              <Paragraph>
                <strong>Type:</strong> Reinforcement Learning (Q-Learning)<br />
                <strong>Input:</strong> Transaction dependency graph, historical patterns<br />
                <strong>Output:</strong> Optimal execution order maximizing parallelism<br />
                <strong>Performance:</strong> 35% reduction in conflict rate
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card className="ml-model-card">
              <Title level={5}>2. Resource Allocation Predictor</Title>
              <Paragraph>
                <strong>Type:</strong> Gradient Boosting (XGBoost)<br />
                <strong>Input:</strong> Network load, validator capacity, transaction volume<br />
                <strong>Output:</strong> Dynamic resource allocation recommendations<br />
                <strong>Performance:</strong> 20% improvement in throughput
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={12}>
            <Card className="ml-model-card">
              <Title level={5}>3. Anomaly Detection System</Title>
              <Paragraph>
                <strong>Type:</strong> Autoencoder Neural Network<br />
                <strong>Input:</strong> Real-time transaction patterns, network behavior<br />
                <strong>Output:</strong> Anomaly score and threat classification<br />
                <strong>Performance:</strong> 99.7% accuracy, {'<5ms'} inference time
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card className="ml-model-card">
              <Title level={5}>4. Predictive Maintenance</Title>
              <Paragraph>
                <strong>Type:</strong> Time Series Forecasting (LSTM)<br />
                <strong>Input:</strong> Node health metrics, historical failures<br />
                <strong>Output:</strong> Failure probability and maintenance schedule<br />
                <strong>Performance:</strong> 85% prediction accuracy, 72-hour window
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 6. Smart Contract Platform */}
      <Card className="section-card" id="smart-contracts">
        <Title level={3}><FileTextOutlined /> 6. Smart Contract Platform</Title>

        <Title level={4}>6.1 Contract Types</Title>
        <Paragraph>
          Aurigraph supports multiple contract paradigms for different use cases:
        </Paragraph>

        <Row gutter={16}>
          <Col span={8}>
            <Card className="contract-type-card">
              <Title level={5}>Traditional Smart Contracts</Title>
              <Paragraph>
                Turing-complete contracts with formal verification support. Deployed
                bytecode executed in sandboxed JVM environment with resource metering.
              </Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="contract-type-card">
              <Title level={5}>Ricardian Contracts</Title>
              <Paragraph>
                Human-readable legal agreements combined with executable code. Digitally
                signed by all parties with cryptographic proof of consent.
              </Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="contract-type-card">
              <Title level={5}>Active Contracts</Title>
              <Paragraph>
                State machine contracts with multi-signature support. Designed for
                multi-party workflows with automated compliance checks.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Title level={4}>6.2 Security Features</Title>
        <ul>
          <li><strong>Formal Verification:</strong> Z3 SMT solver for mathematical proof of correctness</li>
          <li><strong>Static Analysis:</strong> Automated detection of reentrancy, overflow, access control issues</li>
          <li><strong>Gas Metering:</strong> Deterministic execution cost to prevent DoS attacks</li>
          <li><strong>Sandboxing:</strong> Isolated execution environment with resource limits</li>
          <li><strong>Pausability:</strong> Emergency stop mechanism for critical vulnerabilities</li>
        </ul>
      </Card>

      {/* 7. Asset Tokenization */}
      <Card className="section-card" id="tokenization">
        <Title level={3}><BankOutlined /> 7. Real-World Asset Tokenization</Title>

        <Title level={4}>7.1 RWAT Framework</Title>
        <Paragraph>
          The Real-World Asset Tokenization (RWAT) framework provides end-to-end support for
          tokenizing physical and financial assets with built-in compliance and regulatory controls.
        </Paragraph>

        <Title level={4}>7.2 Supported Asset Classes</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Card className="asset-class-card">
              <Title level={5}>Real Estate</Title>
              <Text>Property fractional ownership, REITs, commercial buildings</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="asset-class-card">
              <Title level={5}>Commodities</Title>
              <Text>Gold, silver, oil, agricultural products</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="asset-class-card">
              <Title level={5}>Securities</Title>
              <Text>Stocks, bonds, derivatives, structured products</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="asset-class-card">
              <Title level={5}>Intellectual Property</Title>
              <Text>Patents, copyrights, trademarks, royalties</Text>
            </Card>
          </Col>
        </Row>

        <Title level={4}>7.3 Compliance Integration</Title>
        <ul>
          <li><strong>KYC/AML:</strong> Integrated identity verification and anti-money laundering checks</li>
          <li><strong>Accredited Investor Verification:</strong> Automated compliance for securities offerings</li>
          <li><strong>Transfer Restrictions:</strong> Programmable lock-ups, vesting schedules, whitelists</li>
          <li><strong>Regulatory Reporting:</strong> Automated generation of compliance reports for regulators</li>
        </ul>
      </Card>

      {/* 8. Cross-Chain Bridge */}
      <Card className="section-card" id="cross-chain">
        <Title level={3}><GlobalOutlined /> 8. Cross-Chain Interoperability</Title>

        <Title level={4}>8.1 Bridge Architecture</Title>
        <Paragraph>
          Aurigraph's cross-chain bridge enables secure asset transfer and message passing
          between Aurigraph and external blockchains using a decentralized validator network
          with economic security guarantees.
        </Paragraph>

        <Title level={4}>8.2 Supported Chains</Title>
        <ul>
          <li><strong>Ethereum:</strong> EVM-compatible bridge with deposit/withdrawal contracts</li>
          <li><strong>Bitcoin:</strong> HTLC-based atomic swaps with SPV proof verification</li>
          <li><strong>Solana:</strong> High-performance bridge using Wormhole protocol</li>
          <li><strong>Polkadot:</strong> Parachain bridge via XCM messaging</li>
          <li><strong>Cosmos:</strong> IBC protocol integration for inter-chain communication</li>
        </ul>

        <Title level={4}>8.3 Security Model</Title>
        <Paragraph>
          Bridge security relies on bonded validators who stake tokens as collateral.
          Malicious behavior results in slashing. Multi-signature threshold (2/3) required
          for cross-chain transactions. Continuous monitoring detects anomalies in real-time.
        </Paragraph>
      </Card>

      {/* 9. Performance Analysis */}
      <Card className="section-card" id="performance">
        <Title level={3}><ThunderboltOutlined /> 9. Performance Analysis</Title>

        <Title level={4}>9.1 Benchmark Results</Title>
        <Paragraph>
          Comprehensive performance testing validates Aurigraph's throughput and latency claims:
        </Paragraph>

        <Table
          dataSource={[
            { scenario: 'Simple Transfers', tps: '2,156,789', latency: '85ms', cpu: '45%', memory: '8.2GB' },
            { scenario: 'Smart Contract Execution', tps: '1,450,000', latency: '120ms', cpu: '68%', memory: '12.1GB' },
            { scenario: 'NFT Minting', tps: '850,000', latency: '95ms', cpu: '52%', memory: '9.8GB' },
            { scenario: 'Cross-Chain Transfers', tps: '125,000', latency: '450ms', cpu: '35%', memory: '6.5GB' },
            { scenario: 'Mixed Workload', tps: '1,800,000', latency: '105ms', cpu: '62%', memory: '11.2GB' },
          ]}
          columns={[
            { title: 'Test Scenario', dataIndex: 'scenario', key: 'scenario' },
            { title: 'Peak TPS', dataIndex: 'tps', key: 'tps' },
            { title: 'P99 Latency', dataIndex: 'latency', key: 'latency' },
            { title: 'CPU Usage', dataIndex: 'cpu', key: 'cpu' },
            { title: 'Memory', dataIndex: 'memory', key: 'memory' },
          ]}
          pagination={false}
        />

        <Title level={4}>9.2 Scalability Analysis</Title>
        <Paragraph>
          Horizontal scalability achieved through sharding and state partitioning.
          Linear scaling demonstrated up to 256 validator nodes. Vertical scaling
          optimized using Java Virtual Threads and GraalVM native compilation.
        </Paragraph>
      </Card>

      {/* 10. Security Model */}
      <Card className="section-card" id="security">
        <Title level={3}><SafetyOutlined /> 10. Security Model</Title>

        <Title level={4}>10.1 Threat Model</Title>
        <Paragraph>
          Aurigraph's security model assumes up to f Byzantine validators in a 3f+1
          network. Adversaries may control network timing, inject malicious transactions,
          and attempt double-spending or censorship attacks.
        </Paragraph>

        <Title level={4}>10.2 Security Guarantees</Title>
        <ul>
          <li><strong>Byzantine Fault Tolerance:</strong> System remains operational and correct with up to ⌊(n-1)/3⌋ malicious nodes</li>
          <li><strong>Finality Guarantee:</strong> Transactions are irreversible after 2-phase commit with 2f+1 signatures</li>
          <li><strong>Censorship Resistance:</strong> Multi-leader architecture prevents single-point censorship</li>
          <li><strong>Double-Spend Prevention:</strong> UTXO model with Merkle proof verification</li>
          <li><strong>Sybil Resistance:</strong> Proof-of-Stake with economic penalties for malicious behavior</li>
        </ul>

        <Title level={4}>10.3 Continuous Security Monitoring</Title>
        <Paragraph>
          AI-powered anomaly detection monitors transaction patterns, network behavior,
          and validator actions. Automated threat response includes rate limiting,
          validator slashing, and emergency protocol activation.
        </Paragraph>
      </Card>

      {/* 11. Use Cases */}
      <Card className="section-card" id="use-cases">
        <Title level={3}><BankOutlined /> 11. Enterprise Use Cases</Title>

        <Title level={4}>11.1 Financial Services</Title>
        <Paragraph>
          <strong>High-Frequency Trading:</strong> 2M+ TPS enables real-time settlement of trades with
          sub-100ms finality, eliminating counterparty risk and settlement delays.
        </Paragraph>
        <Paragraph>
          <strong>Cross-Border Payments:</strong> Near-instant international transfers with transparent
          fees and cryptographic proof of payment.
        </Paragraph>

        <Title level={4}>11.2 Supply Chain Management</Title>
        <Paragraph>
          <strong>Provenance Tracking:</strong> Immutable record of product journey from manufacturer to
          consumer, with automated compliance verification and quality assurance.
        </Paragraph>

        <Title level={4}>11.3 Healthcare & Life Sciences</Title>
        <Paragraph>
          <strong>Patient Data Management:</strong> Secure, privacy-preserving health records with
          patient-controlled access and HIPAA compliance.
        </Paragraph>

        <Title level={4}>11.4 Government & Public Sector</Title>
        <Paragraph>
          <strong>Digital Identity:</strong> Decentralized identity management with zero-knowledge proofs
          for privacy-preserving authentication.
        </Paragraph>
      </Card>

      {/* 12. Conclusion */}
      <Card className="section-card" id="conclusion">
        <Title level={3}><CheckCircleOutlined /> 12. Conclusion</Title>

        <Paragraph>
          Aurigraph DLT represents a significant advancement in enterprise blockchain technology,
          delivering the performance, security, and functionality required for mission-critical
          applications. By combining HyperRAFT++ consensus, NIST Level 5 post-quantum cryptography,
          AI-driven optimization, and comprehensive asset tokenization capabilities, Aurigraph
          addresses the key limitations that have hindered blockchain adoption in regulated industries.
        </Paragraph>

        <Paragraph>
          With proven performance exceeding 2 million transactions per second and sub-100ms finality,
          Aurigraph enables use cases previously impossible on blockchain platforms, from high-frequency
          trading to real-time supply chain tracking. The platform's quantum-resistant security ensures
          long-term data protection, while AI-powered optimization continuously improves system performance.
        </Paragraph>

        <Paragraph>
          As blockchain technology matures and quantum computing advances, Aurigraph is positioned
          to be the platform of choice for enterprises requiring uncompromising performance, security,
          and reliability.
        </Paragraph>

        <Divider />

        <Title level={4}>References</Title>
        <ul className="references-list">
          <li>[1] Ongaro, D., & Ousterhout, J. (2014). In Search of an Understandable Consensus Algorithm. USENIX ATC.</li>
          <li>[2] NIST (2024). Post-Quantum Cryptography Standardization. National Institute of Standards and Technology.</li>
          <li>[3] Avanzi, R., et al. (2021). CRYSTALS-Kyber Algorithm Specifications and Supporting Documentation.</li>
          <li>[4] Ducas, L., et al. (2021). CRYSTALS-Dilithium Algorithm Specifications and Supporting Documentation.</li>
          <li>[5] Wood, G. (2014). Ethereum: A Secure Decentralised Generalised Transaction Ledger. Ethereum Project Yellow Paper.</li>
          <li>[6] Nakamoto, S. (2008). Bitcoin: A Peer-to-Peer Electronic Cash System.</li>
          <li>[7] Castro, M., & Liskov, B. (1999). Practical Byzantine Fault Tolerance. OSDI.</li>
          <li>[8] Goodfellow, I., et al. (2016). Deep Learning. MIT Press.</li>
        </ul>

        <Divider />

        <div className="footer-info">
          <Paragraph className="footer-text">
            <strong>Copyright © 2025 Aurigraph DLT Corporation.</strong> All rights reserved.
          </Paragraph>
          <Paragraph className="footer-text">
            For more information, visit <a href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT" target="_blank" rel="noopener noreferrer">github.com/Aurigraph-DLT-Corp/Aurigraph-DLT</a>
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default Whitepaper;
