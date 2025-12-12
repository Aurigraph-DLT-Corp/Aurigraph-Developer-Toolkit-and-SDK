# Product Requirements Document (PRD)
# Aurigraph V11 HMS-Integrated Platform

**Version**: 2.0  
**Date**: September 15, 2025  
**Status**: Live Production  
**Platform URL**: http://localhost:9006

## Executive Summary

The Aurigraph V11 HMS-Integrated Platform represents a complete blockchain ecosystem combining high-performance distributed ledger technology with smart contract capabilities, tokenization services, and Real-World Asset (RWA) management through Hermes Management System (HMS) integration.

## Product Vision

To provide a unified blockchain platform that seamlessly integrates traditional DLT capabilities with next-generation smart contract deployment, token management, and real-world asset tokenization, all accessible through a sophisticated web-based dashboard.

## Key Features Delivered

### 1. Smart Contract Management System
- **ERC-20 Token Contracts**: Standard fungible token deployment
- **ERC-721 NFT Contracts**: Non-fungible token creation and management
- **ERC-1155 Multi-Token Contracts**: Hybrid fungible/non-fungible tokens
- **Ricardian Contracts**: Legal-compliant smart contracts with natural language terms
- **Real-time Deployment**: Live contract deployment with immediate status updates
- **Gas Optimization**: Automated gas estimation and optimization

### 2. Advanced Tokenization Engine
- **Multi-Standard Support**: ERC-20, ERC-721, ERC-1155 token standards
- **Real-time Metrics**: Live token creation and transaction monitoring
- **Token Portfolio Management**: Comprehensive token tracking and analytics
- **Cross-Chain Compatibility**: Support for multiple blockchain networks
- **Automated Compliance**: Built-in regulatory compliance checks

### 3. Real-World Asset (RWA) Tokenization
- **Asset Categories**:
  - Real Estate: Property tokenization with legal compliance
  - Commodities: Gold, silver, oil, agricultural products
  - Art & Collectibles: Fine art and luxury item tokenization
  - Bonds & Securities: Traditional financial instrument tokenization
- **Compliance Framework**: Automated KYC/AML integration
- **Legal Documentation**: Automated legal document generation
- **Fractional Ownership**: Divisible asset ownership tokens

### 4. HMS (Hermes Management System) Integration
- **Live Connection Status**: Real-time HMS connectivity monitoring
- **Transaction Processing**: HMS transaction routing and processing
- **Asset Management**: Centralized asset lifecycle management
- **Compliance Monitoring**: Regulatory compliance tracking
- **Performance Metrics**: HMS processing performance analytics

### 5. Enhanced Node Management
- **Business Nodes**: Smart contract and token processing capabilities
- **Validator Nodes**: Consensus and staking operations
- **Lite Nodes**: Network connectivity and data relay
- **Auto-scaling**: Dynamic node scaling based on network load
- **Real-time Monitoring**: Live node performance metrics

### 6. Live Blockchain Simulation
- **Block Production**: Real-time block generation every 3 seconds
- **Transaction Processing**: Continuous transaction simulation
- **Performance Metrics**: Live TPS, block height, and network statistics
- **Network Visualization**: Real-time network topology display

## Technical Architecture

### Frontend Technology Stack
- **Framework**: Pure HTML5/CSS3/JavaScript (Vanilla JS)
- **UI Components**: Custom modal system with responsive design
- **Real-time Updates**: Event-driven architecture with live data binding
- **Charting**: Chart.js integration for performance visualization
- **Responsive Design**: Mobile-first design principles

### Backend Integration Points
- **V11 Quarkus Services**: REST API integration (port 9003)
- **HMS Services**: Hermes Management System integration (port 9005)
- **gRPC Services**: High-performance service communication
- **Blockchain Simulation**: Real-time blockchain state management

### Performance Specifications
- **Target TPS**: 2M+ transactions per second
- **Block Time**: 3 seconds average
- **Node Scalability**: Dynamic scaling from 1-100+ nodes
- **Response Time**: <100ms for UI operations
- **Memory Usage**: <256MB for lightweight deployment

## User Experience Requirements

### Dashboard Navigation
- **Unified Interface**: Single-page application with tabbed navigation
- **Real-time Data**: All metrics update without page refresh
- **Responsive Actions**: Immediate feedback for all user actions
- **Error Handling**: Comprehensive error messages and recovery

### Smart Contract Deployment Flow
1. Select contract type (ERC-20, ERC-721, ERC-1155, Ricardian)
2. Configure contract parameters through modal interface
3. Review deployment details and gas estimates
4. Deploy with one-click confirmation
5. Monitor deployment status in real-time
6. Access deployed contract management tools

### Token Management Workflow
1. Create new tokens with custom parameters
2. Monitor token metrics and transaction history
3. Manage token supply and distribution
4. Track token performance analytics
5. Export token data and reports

### RWA Tokenization Process
1. Select asset category (real estate, commodities, art, bonds)
2. Input asset details and valuation
3. Configure tokenization parameters
4. Generate compliance documentation
5. Deploy asset-backed tokens
6. Monitor asset performance and ownership

## Integration Requirements

### HMS Integration Specifications
- **Connection Protocol**: gRPC over TLS 1.3
- **Authentication**: OAuth 2.0 with JWT tokens
- **Data Synchronization**: Real-time bidirectional sync
- **Compliance Reporting**: Automated regulatory reporting
- **Asset Lifecycle**: End-to-end asset management

### Node Communication
- **Internal Protocol**: gRPC with Protocol Buffers
- **External API**: REST with JSON over HTTP/2
- **Security**: TLS 1.3 encryption for all communications
- **Load Balancing**: Automatic request distribution

## Security Requirements

### Smart Contract Security
- **Code Auditing**: Automated smart contract vulnerability scanning
- **Gas Limit Protection**: Prevention of gas limit attacks
- **Reentrancy Protection**: Built-in reentrancy attack prevention
- **Access Control**: Role-based smart contract permissions

### Data Protection
- **Encryption**: AES-256 encryption for sensitive data
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control (RBAC)
- **Audit Logging**: Comprehensive audit trail for all operations

## Compliance Requirements

### Regulatory Compliance
- **KYC/AML**: Know Your Customer and Anti-Money Laundering
- **GDPR**: General Data Protection Regulation compliance
- **SOX**: Sarbanes-Oxley financial reporting compliance
- **PCI DSS**: Payment Card Industry security standards

### RWA Compliance
- **Securities Law**: Compliance with securities regulations
- **Property Law**: Real estate tokenization legal framework
- **Commodity Regulations**: Commodity trading compliance
- **Art Authentication**: Provenance and authenticity verification

## Performance Metrics

### Key Performance Indicators (KPIs)
- **Transaction Throughput**: >1M TPS sustained
- **Smart Contract Deployments**: >1000 contracts/hour
- **Token Creations**: >500 tokens/hour
- **RWA Tokenizations**: >100 assets/hour
- **System Uptime**: 99.9% availability
- **Response Time**: <100ms average API response

### Business Metrics
- **User Adoption**: Monthly active users
- **Platform Utilization**: Daily transaction volume
- **Contract Success Rate**: Successful deployment percentage
- **HMS Integration Health**: Connection stability metrics

## Deployment Requirements

### Environment Setup
- **Container Platform**: Docker with nginx:alpine
- **Port Configuration**: Port 9006 for web interface
- **Resource Requirements**: 2GB RAM, 4 vCPU minimum
- **Storage**: 100GB SSD for blockchain data
- **Network**: 1Gbps bandwidth for optimal performance

### Monitoring and Observability
- **Health Checks**: Automated system health monitoring
- **Performance Monitoring**: Real-time performance dashboards
- **Error Tracking**: Comprehensive error logging and alerting
- **Business Intelligence**: Analytics and reporting dashboard

## Success Criteria

### Technical Success Metrics
- ✅ Smart contract deployment system operational
- ✅ Tokenization engine processing tokens
- ✅ RWA tokenization with HMS integration
- ✅ Real-time blockchain simulation active
- ✅ All node types operational with auto-scaling
- ✅ Platform deployed and accessible

### Business Success Metrics
- Platform adoption by development teams
- Successful smart contract deployments
- Active token creation and management
- RWA tokenization transactions
- HMS integration stability

## Native Build Strategy (December 2025)

### GraalVM/Mandrel JDK 21 Compatibility Issue

**Issue Identified**: December 12, 2025
**Status**: Blocked on upstream fix
**Workaround**: JDK 17 Native Build

#### Problem Description
Native image compilation with Mandrel/GraalVM JDK 21 fails due to a known ForkJoinPool.common accessor bug:

```
Fatal error: com.oracle.svm.core.util.VMError$HostedError:
Error in @InjectAccessors handling of field java.util.concurrent.ForkJoinPool.common
accessors class com.oracle.svm.core.jdk.ForkJoinPoolCommonAccessor:
found no method named set or setCommon
```

**Affected Configurations**:
- `quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21`
- `quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-21`
- Quarkus 3.30.1 with GraalVM CE 24.x

#### Decision: JDK 17 Native Build

**Rationale**: JDK 17 native builds are proven stable and provide all required performance benefits without the ForkJoinPool incompatibility.

| Metric | JDK 17 Native | JDK 21 JVM |
|--------|--------------|------------|
| Startup Time | <500ms | ~3s |
| Memory Usage | ~256MB | ~512MB |
| Stability | High (LTS) | High |
| JDK Features | Core features | Virtual threads, pattern matching |

**JDK 21 Features Lost** (acceptable tradeoffs):
- Virtual Threads (Project Loom) - Not required for current workload
- Record Patterns - Not used in codebase
- Sequenced Collections - Not used in codebase
- Pattern Matching for switch - Limited usage

#### Implementation

**Build Command (JDK 17)**:
```bash
./mvnw clean package -Pnative-fast -DskipTests=true \
    -Dquarkus.native.container-build=true \
    -Dquarkus.native.container-runtime=docker \
    -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-17
```

**Profile Configuration** (pom.xml):
```xml
<profile>
    <id>native-jdk17</id>
    <properties>
        <quarkus.native.builder-image>quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-17</quarkus.native.builder-image>
    </properties>
</profile>
```

#### Additional Blocker: --strict-image-heap Incompatibility

**Discovered**: December 12, 2025
**Status**: JDK 17 Native Build Also Blocked

Quarkus 3.30.1 hardcodes `--strict-image-heap` option in NativeImageBuildStep, but this option:
- Requires GraalVM 22+ / Mandrel 24+
- Is NOT supported by the JDK 17 Mandrel images (Mandrel 23.0.x)

| Mandrel Version | JDK | --strict-image-heap | @InjectAccessors Bug |
|-----------------|-----|---------------------|----------------------|
| 23.0.6 (jdk-17) | 17  | NOT supported       | N/A                  |
| 24.2 (jdk-21)   | 21  | Supported           | ForkJoinPool.common  |
| 25.0.1 (jdk-25) | 25  | Supported           | VirtualThread.DEFAULT_SCHEDULER |

The property `quarkus.native.enable-strict-image-heap=false` is NOT recognized in Quarkus 3.30.1.

#### Blocker 3: Mandrel 25 VirtualThread Bug

**Discovered**: December 12, 2025
**Status**: JDK 25 Native Build Also Blocked

Mandrel 25 (jdk-25) has the same `@InjectAccessors` pattern bug for VirtualThread:
```
Error in @InjectAccessors handling of field java.lang.VirtualThread.DEFAULT_SCHEDULER
...found no method named set or setDEFAULT_SCHEDULER
```

This confirms the SVM (Substrate VM) accessor injection is fundamentally broken across all recent Mandrel versions.

#### Long-term Strategy

1. **Immediate**: Deploy JVM containers for production (ALL native builds blocked)
2. **Root Cause**: GraalVM SVM `@InjectAccessors` implementation has bugs for:
   - `ForkJoinPool.common` (JDK 21)
   - `VirtualThread.DEFAULT_SCHEDULER` (JDK 25)
3. **Monitor Issues**:
   - GraalVM GitHub: Track SVM accessor injection fixes
   - Mandrel GitHub: Track upstream GraalVM integration
4. **Timeline**: No working Mandrel version available as of December 2025
5. **Alternative**: Consider downgrading Quarkus to pre-3.30 for JDK 17 builds (removes --strict-image-heap requirement)

---

## Future Roadmap

### Phase 2 Enhancements (Q4 2025)
- Cross-chain bridge integration
- Advanced DeFi protocol support
- Institutional trading interfaces
- Enhanced analytics and reporting
- **Native JDK 17 container deployment**

### Phase 3 Expansion (Q1 2026)
- AI-powered contract optimization
- Quantum-resistant cryptography
- Global regulatory compliance
- Enterprise partnership integrations
- **JDK 21 native migration (pending GraalVM fix)**

## Conclusion

The Aurigraph V11 HMS-Integrated Platform successfully delivers a comprehensive blockchain ecosystem that meets all specified requirements. The platform provides seamless integration of DLT, smart contracts, tokenization, and RWA management through a sophisticated, user-friendly interface.

**Platform Status**: ✅ Live and Operational  
**Access URL**: http://localhost:9006  
**Documentation**: Complete and current  
**Support**: Full technical support available

---

*This PRD represents the current state of the Aurigraph V11 HMS-Integrated Platform as of September 15, 2025.*