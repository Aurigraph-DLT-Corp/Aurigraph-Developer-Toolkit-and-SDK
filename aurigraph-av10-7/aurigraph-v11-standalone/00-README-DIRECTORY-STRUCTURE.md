# Aurigraph V12 - ISO 27001 Compliant Directory Structure

## Overview
This repository has been restructured to comply with ISO 27001:2022 information security management standards. The directory structure implements security controls addressing access control (A.9), operations security (A.12), communications security (A.13), system development (A.14), and compliance (A.18).

## Directory Structure

### 01-source/
**Purpose**: Application source code with strict access control
**ISO 27001 Controls**: A.14.2 (Security in development), A.9.4 (System access control)
**Contents**:
- `main/` - Production application code
  - `java/` - Java source files
  - `resources/` - Application resources, configurations
  - `docker/` - Docker-related application files
  - `proto/` - Protocol Buffer definitions
- `test/` - Test source code
- `proto/` - gRPC/Protocol Buffer interface definitions

**Access Level**: Developers only
**Git Tracking**: Fully tracked

### 02-config/
**Purpose**: Configuration management with environment separation
**ISO 27001 Controls**: A.12.1 (Operational procedures), A.14.1 (Security in development)
**Contents**:
- `dev/` - Development environment configuration
- `staging/` - Staging environment configuration
- `prod/` - Production environment configuration (restricted access)
- `common/` - Shared configuration templates

**Access Level**:
- dev/: Developers
- staging/: Developers + QA
- prod/: Operations team only

**Security Notes**:
- No secrets or credentials allowed
- Environment-specific files must use templates
- Production configs require peer review

### 03-secrets/
**Purpose**: Secure storage for cryptographic materials and credentials
**ISO 27001 Controls**: A.10 (Cryptography), A.9.4 (System access)
**Contents**:
- `keys/` - Cryptographic keys (HSM-backed in production)
- `certificates/` - TLS/SSL certificates
- `credentials/` - Service account credentials
- `vault-config/` - HashiCorp Vault or similar configuration

**Access Level**: Operations team + Security team only
**Git Tracking**: EXCLUDED from version control
**Security Notes**:
- All contents must be encrypted at rest
- Use external secret management in production (Vault, AWS Secrets Manager)
- Key rotation every 90 days
- Access logged to audit trail

### 04-documentation/
**Purpose**: Technical and operational documentation
**ISO 27001 Controls**: A.12.1 (Documented procedures), A.16 (Information security incident management)
**Contents**:
- `architecture/` - System architecture and design documents
- `api/` - API specifications and documentation
- `development/` - Development guides and standards
- `operations/` - Operational procedures and runbooks
- `compliance/` - Compliance documentation
- `security/` - Security policies and procedures
- `user-guides/` - End-user documentation

**Access Level**: Context-dependent (public, internal, confidential)
**Git Tracking**: Tracked (excluding confidential compliance docs)

### 05-deployment/
**Purpose**: Infrastructure as Code and deployment automation
**ISO 27001 Controls**: A.12.1 (Change management), A.14.2 (Secure SDLC)
**Contents**:
- `docker/` - Dockerfile configurations
- `kubernetes/` - K8s manifests and Helm charts
- `terraform/` - Infrastructure as Code
- `ansible/` - Configuration management
- `scripts/` - Deployment and automation scripts
- `ci-cd/` - CI/CD pipeline definitions

**Access Level**: DevOps team
**Git Tracking**: Tracked (secrets excluded)
**Security Notes**:
- All scripts require code review
- Production deployments require approval
- Secrets injected at runtime only

### 06-security/
**Purpose**: Security management documentation and processes
**ISO 27001 Controls**: A.5 (Information security policies), A.16 (Incident management)
**Contents**:
- `policies/` - Information security policies
- `procedures/` - Security procedures and guidelines
- `incident-response/` - Incident response plans and playbooks
- `vulnerability-assessments/` - Security assessment reports
- `penetration-tests/` - Pen test results (confidential)
- `security-reviews/` - Code and architecture security reviews

**Access Level**: Security team + Management
**Git Tracking**: Policies tracked, confidential results excluded
**Security Notes**:
- Regular reviews required (quarterly minimum)
- Incident response tested annually
- Vulnerability assessments quarterly

### 07-compliance/
**Purpose**: Regulatory compliance and audit documentation
**ISO 27001 Controls**: A.18 (Compliance), A.9.4 (Access logging)
**Contents**:
- `iso27001/` - ISO 27001 compliance documentation
- `gdpr/` - GDPR compliance records
- `soc2/` - SOC 2 compliance materials
- `audit-logs/` - Centralized audit trails
- `certifications/` - Compliance certificates
- `evidence/` - Compliance evidence collection

**Access Level**: Compliance team + Auditors only
**Git Tracking**: Templates tracked, actual logs excluded
**Security Notes**:
- Audit logs retained for 7 years minimum
- Access requires business justification
- Regular compliance audits

### 08-monitoring/
**Purpose**: System monitoring, logging, and observability
**ISO 27001 Controls**: A.12.4 (Logging and monitoring), A.16 (Incident management)
**Contents**:
- `logs/` - Application and system logs
- `metrics/` - Performance metrics and time-series data
- `alerts/` - Alert configurations and history
- `dashboards/` - Monitoring dashboard definitions
- `reports/` - Operational reports

**Access Level**: Operations team + SRE
**Git Tracking**: Configurations tracked, log data excluded
**Security Notes**:
- Logs rotated and archived
- Security events trigger alerts
- Log integrity protected

### 09-testing/
**Purpose**: Test suites, test data, and quality assurance
**ISO 27001 Controls**: A.14.2 (System testing), A.14.3 (Test data protection)
**Contents**:
- `unit/` - Unit test suites
- `integration/` - Integration tests
- `e2e/` - End-to-end tests
- `performance/` - Performance and load tests
- `security/` - Security tests (SAST, DAST)
- `test-data/` - Test datasets (anonymized)
- `test-reports/` - Test execution reports

**Access Level**: Development + QA teams
**Git Tracking**: Tests tracked, sensitive test data excluded
**Security Notes**:
- No production data in tests
- Test data must be anonymized
- Security tests run on every build

### 10-build/
**Purpose**: Build artifacts and release management
**ISO 27001 Controls**: A.14.2 (Secure development), A.12.1 (Change control)
**Contents**:
- `artifacts/` - Compiled binaries and build outputs
- `releases/` - Versioned release packages
- `packages/` - Distribution packages
- `native-builds/` - GraalVM native executables

**Access Level**: CI/CD system + Release managers
**Git Tracking**: Excluded (artifacts stored in artifact repository)
**Security Notes**:
- All artifacts signed
- Build provenance tracked
- Vulnerability scanning required

### 11-archive/
**Purpose**: Historical data and deprecated components
**ISO 27001 Controls**: A.18.1 (Records management)
**Contents**:
- `old-versions/` - Previous system versions
- `deprecated/` - Deprecated code and features
- `backups/` - Configuration and data backups

**Access Level**: Restricted (read-only)
**Git Tracking**: Partial (major versions only)
**Security Notes**:
- Retention policy enforced
- Regular cleanup required
- Access requires justification

### 12-tools/
**Purpose**: Development and operational utilities
**ISO 27001 Controls**: A.14.2 (Development tools)
**Contents**:
- `scripts/` - Utility scripts
- `utilities/` - Helper tools
- `generators/` - Code and config generators
- `validators/` - Validation and verification tools

**Access Level**: Development + Operations teams
**Git Tracking**: Fully tracked
**Security Notes**:
- Tools must be reviewed
- No hard-coded credentials
- Version controlled

## Security Best Practices

### Access Control
1. **Principle of Least Privilege**: Users have minimum necessary access
2. **Role-Based Access Control (RBAC)**: Access granted by role
3. **Regular Access Reviews**: Quarterly review of permissions
4. **Separation of Duties**: Production access separated from development

### Data Protection
1. **Encryption at Rest**: Secrets and sensitive data encrypted
2. **Encryption in Transit**: TLS 1.3 for all communications
3. **Data Classification**: All data classified (Public, Internal, Confidential, Restricted)
4. **Data Retention**: Compliance with regulatory requirements

### Change Management
1. **Version Control**: All code and IaC in Git
2. **Code Review**: Mandatory peer review for all changes
3. **Testing**: Automated testing before deployment
4. **Approval**: Production changes require approval

### Monitoring & Logging
1. **Centralized Logging**: All security events logged
2. **Log Integrity**: Logs protected from tampering
3. **Real-time Monitoring**: Security events monitored 24/7
4. **Incident Response**: Documented response procedures

## Compliance Mapping

### ISO 27001:2022 Controls
- **A.5**: Information security policies → 06-security/policies/
- **A.9**: Access control → 03-secrets/, access logs in 07-compliance/
- **A.10**: Cryptography → 03-secrets/, 01-source/crypto/
- **A.12**: Operations security → 08-monitoring/, 05-deployment/
- **A.13**: Communications security → TLS configs in 02-config/
- **A.14**: System development → 01-source/, 09-testing/, 10-build/
- **A.16**: Incident management → 06-security/incident-response/
- **A.18**: Compliance → 07-compliance/

### GDPR Requirements
- **Article 25**: Privacy by design → Development standards in 04-documentation/
- **Article 30**: Records of processing → 07-compliance/gdpr/
- **Article 32**: Security measures → 06-security/
- **Article 33**: Breach notification → 06-security/incident-response/

### SOC 2 Trust Principles
- **Security**: 06-security/, 03-secrets/
- **Availability**: 08-monitoring/, 05-deployment/
- **Confidentiality**: 03-secrets/, access controls
- **Processing Integrity**: 09-testing/, 10-build/
- **Privacy**: 07-compliance/gdpr/

## Migration Notes

This structure was created on 2025-11-25 as part of the V12 ISO 27001 compliance initiative. Files were reorganized from the previous flat structure into this hierarchical, security-focused layout.

### Key Changes
1. Source code separated from configuration
2. Secrets excluded from version control
3. Environment-specific configuration separation
4. Comprehensive security and compliance directories
5. Enhanced .gitignore for data protection

### Migration Impact
- **pom.xml**: Update source directory references
- **CI/CD**: Update pipeline paths
- **Documentation**: Update all path references
- **Scripts**: Update deployment script paths

## Quick Reference

```bash
# Source code
cd 01-source/main/java/

# Configuration
cd 02-config/dev/  # or staging/, prod/

# Build and deploy
cd 05-deployment/docker/
./build.sh

# View logs
cd 08-monitoring/logs/

# Run tests
cd 09-testing/
./run-tests.sh

# Check compliance
cd 07-compliance/audit-logs/
```

## Contact & Support

- **Security Team**: security@aurigraph.io
- **Compliance Team**: compliance@aurigraph.io
- **DevOps Team**: devops@aurigraph.io

## Document Control

- **Version**: 1.0
- **Last Updated**: 2025-11-25
- **Next Review**: 2026-02-25 (Quarterly)
- **Owner**: Platform Architecture Team
- **Classification**: Internal

---

For detailed information on each directory, refer to the README.md file within that directory.
