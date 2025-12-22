## Guardrails & Operational Constraints

### Performance Guardrails

**TPS Thresholds**:
- **Critical Alert**: < 500K TPS (immediate investigation required)
- **Warning**: < 750K TPS (optimization needed)
- **Healthy**: ≥ 776K TPS (current baseline)
- **Target**: ≥ 2M TPS (production goal)

**Latency Guardrails**:
- **Critical**: p99 > 200ms (service degradation)
- **Warning**: p99 > 100ms (optimization needed)
- **Healthy**: p50 < 50ms, p95 < 100ms, p99 < 150ms
- **Target**: p50 < 10ms, p95 < 25ms, p99 < 50ms

**Resource Utilization**:
- **CPU**: < 80% sustained (auto-scale trigger at 70%)
- **Memory**: < 80% of allocated (JVM/native)
- **Disk I/O**: < 70% capacity (queue monitoring)
- **Network**: < 75% bandwidth (congestion prevention)

### Security Guardrails

**Cryptographic Standards**:
- **Mandatory**: NIST Level 5 quantum-resistant cryptography
- **Prohibited**: SHA-1, MD5, DES, RSA < 4096 bits
- **Required**: CRYSTALS-Dilithium (signatures), CRYSTALS-Kyber (encryption)
- **Key Rotation**: Every 90 days for production keys

**API Security**:
- **Rate Limiting**: 1000 req/min per IP (adjustable)
- **Authentication**: OAuth 2.0 + JWT mandatory
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS 1.3 minimum, no downgrade allowed

**Access Control**:
- **Admin Actions**: Require 2FA + audit log
- **Sensitive Operations**: Multi-signature approval
- **Key Storage**: Hardware security modules (HSM) only
- **Backup Encryption**: AES-256-GCM mandatory

### Consensus Guardrails

**HyperRAFT++ Constraints**:
- **Minimum Nodes**: 3 (dev), 5 (staging), 7+ (production)
- **Quorum**: Simple majority (n/2 + 1)
- **Leader Election Timeout**: 150-300ms
- **Heartbeat Interval**: 50ms
- **Log Replication**: Parallel with batching

**Byzantine Fault Tolerance**:
- **Max Faulty Nodes**: f < n/3 (where n = total nodes)
- **Network Partition**: Minority partition halts (safety over liveness)
- **Recovery**: Automatic within 5 seconds
- **Consistency**: Strong consistency, no eventual consistency mode

### Data Integrity Guardrails

**Transaction Validation**:
- **Signature Verification**: 100% mandatory (no exceptions)
- **Nonce Validation**: Strict sequential enforcement
- **Balance Checks**: Pre-transaction validation required
- **Gas Limits**: Enforced with abort on exceed
- **Smart Contract**: Gas metering + execution timeout (30s max)

**Block Validation**:
- **Merkle Root**: Must match all transactions
- **Previous Hash**: Must reference valid parent block
- **Timestamp**: Within 10-second drift tolerance
- **Size Limit**: 10MB maximum (configurable)
- **Transaction Count**: 10K max per block (current)

**State Management**:
- **Checkpoints**: Every 1000 blocks
- **Backup**: Hourly incremental, daily full
- **Retention**: 90 days minimum, 365 days recommended
- **Verification**: Merkle tree proofs for all state transitions

### Availability Guardrails

**Uptime Requirements**:
- **Development**: 95% SLA
- **Staging**: 99% SLA
- **Production**: 99.99% SLA (52 minutes downtime/year max)

**Failover**:
- **Detection**: < 10 seconds (health check interval: 5s)
- **Promotion**: < 30 seconds (leader election)
- **Recovery**: < 2 minutes (full service restoration)
- **Replication**: 3x minimum (different availability zones)

**Disaster Recovery**:
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 15 minutes
- **Backup Locations**: 3 geographically distributed
- **Restoration Testing**: Monthly

### Scalability Guardrails

**Horizontal Scaling**:
- **Auto-Scale Trigger**: 70% CPU or memory for 5 minutes
- **Scale-Up**: Add 2 nodes minimum per event
- **Scale-Down**: Remove 1 node max per event (safety)
- **Cool-Down Period**: 10 minutes between scaling events
- **Maximum Nodes**: 1000 per cluster

**Vertical Scaling**:
- **CPU**: 2-32 cores (production), 1-8 cores (dev)
- **Memory**: 4GB-64GB (production), 2GB-16GB (dev)
- **Storage**: 100GB-10TB (auto-expand)
- **Network**: 1Gbps-100Gbps

### API Guardrails

**Request Limits**:
- **Anonymous**: 100 req/min
- **Authenticated**: 1000 req/min
- **Premium**: 10,000 req/min
- **Burst**: 2x sustained rate for 10 seconds

**Response Time SLA**:
- **Read Operations**: < 100ms (p95)
- **Write Operations**: < 500ms (p95)
- **Batch Operations**: < 5s (p95)
- **Complex Queries**: < 2s (p95)

**Payload Limits**:
- **Request Body**: 10MB maximum
- **Response Body**: 50MB maximum
- **WebSocket Frame**: 1MB maximum
- **File Upload**: 100MB maximum

### Migration Guardrails

**V10 → V11 Migration Rules**:
- **Parallel Operation**: Both must run until 100% V11 validation
- **Traffic Split**: Gradual 10% → 25% → 50% → 75% → 100%
- **Rollback**: Automated if error rate > 1% for 5 minutes
- **Data Consistency**: Zero data loss tolerance
- **Backward Compatibility**: Maintain V10 API for 6 months post-migration

**Feature Parity**:
- **Consensus**: V11 must match V10 finality guarantees
- **Cryptography**: V11 must exceed V10 security level
- **Performance**: V11 must achieve ≥ V10 TPS before cutover
- **APIs**: All V10 endpoints must have V11 equivalents

### Monitoring & Alerting Guardrails

**Metrics Collection**:
- **Frequency**: Every 10 seconds (critical metrics)
- **Retention**: 30 days high-resolution, 1 year aggregated
- **Dashboards**: Real-time updates (5-second refresh)
- **Anomaly Detection**: ML-based with 95% accuracy target

**Alert Levels**:
- **P0 (Critical)**: Immediate page-out, < 5 minute response
- **P1 (High)**: Notify on-call, < 15 minute response
- **P2 (Medium)**: Email/Slack, < 1 hour response
- **P3 (Low)**: Ticket creation, next business day

**Alert Fatigue Prevention**:
- **Max Alerts**: 10 per hour per service
- **Grouping**: Similar alerts consolidated
- **Auto-Resolution**: 5 minutes of healthy state
- **Escalation**: P2 → P1 if unresolved for 1 hour

### Testing Guardrails

**Code Coverage**:
- **Unit Tests**: ≥ 80% line coverage mandatory
- **Integration Tests**: ≥ 70% critical path coverage
- **E2E Tests**: 100% user flow coverage
- **Performance Tests**: Every release with TPS validation

**Test Environments**:
- **Development**: No guardrails (experimental)
- **Staging**: Production-like constraints (90% of prod)
- **Pre-Production**: Identical to production
- **Production**: Full guardrails enforced

**Load Testing**:
- **Frequency**: Before every major release
- **Duration**: Minimum 24-hour sustained load
- **Target**: 150% of expected production load
- **Pass Criteria**: < 0.1% error rate, no memory leaks

### Compliance Guardrails

**Regulatory Requirements**:
- **Data Privacy**: GDPR, CCPA compliant
- **Financial**: AML/KYC integration required for RWA
- **Audit Logging**: Immutable, tamper-proof, 7-year retention
- **Right to be Forgotten**: Pseudonymization support

**Security Audits**:
- **Frequency**: Quarterly (external), monthly (internal)
- **Scope**: Full codebase, infrastructure, dependencies
- **Vulnerabilities**: P0/P1 must be fixed within 48 hours
- **Penetration Testing**: Bi-annually by certified firm

### Operational Guardrails

**Change Management**:
- **Code Review**: 2 approvals minimum (senior engineer + architect)
- **Deployment**: Blue-green with smoke tests
- **Rollback**: Single command, < 5 minutes
- **Communication**: 24-hour notice for breaking changes

**Incident Response**:
- **Detection**: Automated monitoring (< 1 minute)
- **Triage**: On-call engineer (< 5 minutes)
- **Resolution**: Based on priority (P0: < 1 hour)
- **Post-Mortem**: Within 48 hours, action items tracked

**Documentation**:
- **API Docs**: Auto-generated from code (OpenAPI/gRPC)
- **Architecture Docs**: Updated with every major change
- **Runbooks**: For all common operations
- **Knowledge Base**: Updated within 24 hours of resolution

### Cost Guardrails

**Resource Budgets**:
- **Compute**: $5K/month (dev), $50K/month (prod)
- **Storage**: $1K/month (dev), $10K/month (prod)
- **Network**: $500/month (dev), $5K/month (prod)
- **Total**: $20K/month (dev), $200K/month (prod)

**Cost Optimization**:
- **Auto-shutdown**: Dev environments after 6 PM
- **Reserved Instances**: 70% of baseline capacity
- **Spot Instances**: Allowed for non-critical workloads
- **Review**: Monthly cost analysis and optimization

### Deprecation Policy

**V10 Deprecation Timeline**:
1. **Announcement**: 6 months before V11 GA
2. **Parallel Operation**: 6 months post-V11 GA
3. **Deprecation Notice**: All APIs marked deprecated
4. **Support End**: 12 months post-V11 GA
5. **Decommission**: 18 months post-V11 GA

**Feature Deprecation**:
- **Notice**: 3 months minimum
- **Migration Guide**: Provided with alternatives
- **Support Period**: 6 months post-deprecation
- **Breaking Changes**: Major version bump only

---

## Appendix

### Technology Decisions

**Why Java 21 for V11?**
- Virtual threads for massive concurrency
- Strong typing and tooling
- GraalVM native compilation
- Enterprise-grade ecosystem
- Superior performance for high-TPS workloads

**Why Quarkus?**
- Kubernetes-native framework
- Sub-second startup time
- Low memory footprint
- Reactive programming support
- Excellent GraalVM integration

**Why HyperRAFT++?**
- Proven consensus algorithm (RAFT)
- Enhanced with parallel log replication
- AI-driven optimization
- Deterministic finality
- Byzantine fault tolerance

### Performance Benchmarks

**V11 Native vs JVM Mode**:
| Metric | Native | JVM |
|--------|--------|-----|
| Startup | 0.8s | 3.2s |
| Memory | 245MB | 512MB |
| Throughput | 776K TPS | 650K TPS |
| Latency (p99) | 45ms | 78ms |

### Related Documentation
- `/CLAUDE.md` - Project configuration
- `/PROJECT_PLAN.md` - Development plan
- `/AURIGRAPH-TEAM-AGENTS.md` - Agent framework
- `/SOPs/` - Standard operating procedures

---

## Key Updates (November 3, 2025)

### Performance Clarification
- **Current Baseline**: 776K TPS (production-verified)
- **ML Optimization Peak**: 3.0M TPS (Sprint 5 benchmarks, not sustained)
- **Whitepaper Target**: 2M+ TPS (roadmap goal)

### Migration Progress
- **Phase 1**: 100% complete (core structure, REST API, JWT auth)
- **Phase 2**: 50% complete (50% of core services implemented)
- **Phase 3**: 0% complete (full production optimization pending)

### Critical Gaps Identified
1. **API Endpoint Coverage**: 19.6% (9/46 endpoints)
2. **WebSocket Support**: In progress
3. **E2E Testing**: 0%
4. **Multi-Cloud**: 10%
5. **Documentation**: Multiple outdated versions

---

**Document Version**: 1.1.0
**Last Updated**: 2025-11-03
**Maintainer**: Aurigraph DLT Core Team
**Next Review**: After Sprint 13 completion (November 14, 2025)
