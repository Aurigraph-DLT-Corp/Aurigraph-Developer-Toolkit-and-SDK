# 07-compliance/ - Regulatory Compliance & Audit

## Purpose
This directory contains all regulatory compliance documentation, audit trails, and evidence collection in compliance with ISO 27001:2022 control A.18 (Compliance with legal and contractual requirements).

## Directory Structure

```
07-compliance/
├── iso27001/                   # ISO 27001:2022 compliance
│   ├── statement-of-applicability.md
│   ├── risk-assessment.md
│   ├── risk-treatment-plan.md
│   ├── control-evidence/
│   ├── internal-audits/
│   ├── management-reviews/
│   └── templates/
├── gdpr/                       # GDPR compliance (EU Regulation 2016/679)
│   ├── records-of-processing.md
│   ├── data-protection-impact-assessments/
│   ├── data-subject-requests/
│   ├── breach-notifications/
│   ├── privacy-notices/
│   └── templates/
├── soc2/                       # SOC 2 Type II compliance
│   ├── system-description.md
│   ├── control-matrix.md
│   ├── evidence-collection/
│   ├── audit-reports/
│   └── templates/
├── audit-logs/                 # Centralized audit trail
│   ├── access-logs/
│   ├── change-logs/
│   ├── security-logs/
│   ├── compliance-logs/
│   └── .gitkeep
├── certifications/            # Compliance certificates
│   ├── iso27001-certificate.pdf
│   ├── soc2-report.pdf
│   └── README.md
├── evidence/                  # Compliance evidence collection
│   ├── Q1-2025/
│   ├── Q2-2025/
│   ├── Q3-2025/
│   ├── Q4-2025/
│   └── templates/
└── README.md                  # This file
```

## ISO 27001:2022 Compliance

### Statement of Applicability (SOA)
**Location**: `iso27001/statement-of-applicability.md`
**Purpose**: Documents which ISO 27001 controls are applicable and implemented.

**Status**: 93 controls assessed
- Applicable: 87 controls
- Not Applicable: 6 controls
- Implemented: 82 controls (94%)
- In Progress: 5 controls (6%)

### Key ISO 27001 Controls

| Control | Title | Status | Evidence Location |
|---------|-------|--------|-------------------|
| A.5.1 | Policies for information security | ✅ Implemented | 06-security/policies/ |
| A.9.2 | User access management | ✅ Implemented | audit-logs/access-logs/ |
| A.9.4 | System access control | ✅ Implemented | 01-source/security/ |
| A.10.1 | Cryptographic controls | ✅ Implemented | 01-source/crypto/ |
| A.12.1 | Operational procedures | ✅ Implemented | 04-documentation/operations/ |
| A.12.4 | Logging and monitoring | ✅ Implemented | 08-monitoring/ |
| A.13.1 | Network security | ✅ Implemented | 02-config/prod/network/ |
| A.14.2 | Security in development | ✅ Implemented | 01-source/, 09-testing/ |
| A.16.1 | Incident management | ✅ Implemented | 06-security/incident-response/ |
| A.18.1 | Compliance | ✅ Implemented | This directory |

### Risk Assessment
**Location**: `iso27001/risk-assessment.md`
**Frequency**: Annually (or after significant changes)
**Methodology**: ISO 27005:2022

**Risk Categories**:
1. Information Security Risks
2. Operational Risks
3. Compliance Risks
4. Third-Party Risks
5. Technology Risks

**Risk Matrix**:
```
Impact →     Low    Medium    High    Critical
Likelihood
High         🟡      🟠        🔴      🔴
Medium       🟢      🟡        🟠      🔴
Low          🟢      🟢        🟡      🟠
```

### Internal Audits
**Frequency**: Quarterly
**Scope**: All ISO 27001 controls
**Auditors**: Internal audit team or external consultant

**Audit Schedule 2025**:
- Q1: January 15-31
- Q2: April 15-30
- Q3: July 15-31
- Q4: October 15-31

### Management Review
**Frequency**: Quarterly
**Attendees**: Executive team, CISO, Compliance Officer
**Agenda**: Security metrics, incidents, audit findings, risk changes

## GDPR Compliance

### Article 30: Records of Processing Activities
**Location**: `gdpr/records-of-processing.md`
**Purpose**: Document all personal data processing activities.

**Processing Activities**:
1. User Account Management
2. Transaction Processing
3. API Access Logging
4. Analytics and Monitoring
5. Customer Support

### Data Protection Impact Assessments (DPIA)
**Location**: `gdpr/data-protection-impact-assessments/`
**Trigger**: High-risk processing activities
**Required For**:
- Large-scale processing of special categories
- Systematic monitoring
- Automated decision-making
- Processing of vulnerable individuals' data

### Data Subject Rights
**Location**: `gdpr/data-subject-requests/`

**Supported Rights** (GDPR Articles 15-22):
1. Right to Access (Article 15)
2. Right to Rectification (Article 16)
3. Right to Erasure (Article 17)
4. Right to Restriction (Article 18)
5. Right to Data Portability (Article 20)
6. Right to Object (Article 21)

**Response SLA**: 30 days (extendable by 60 days)

### Breach Notification
**Location**: `gdpr/breach-notifications/`
**Requirements**:
- Notify supervisory authority within 72 hours (Article 33)
- Notify affected individuals without undue delay (Article 34)
- Document all breaches (even if not notified)

**Breach Assessment Criteria**:
- Type of personal data
- Number of individuals affected
- Potential consequences
- Likelihood of harm

## SOC 2 Compliance

### Trust Service Principles

#### Security (All Engagements)
**Controls**: Access control, encryption, monitoring, incident response
**Evidence**: `soc2/evidence-collection/security/`

#### Availability
**Target**: 99.9% uptime
**Evidence**: Monitoring dashboards, incident logs
**Location**: `08-monitoring/metrics/`

#### Processing Integrity
**Controls**: Input validation, error handling, reconciliation
**Evidence**: Test results, code reviews
**Location**: `09-testing/test-reports/`

#### Confidentiality
**Controls**: Data classification, encryption, access controls
**Evidence**: Policy documents, configuration files
**Location**: `06-security/policies/`

#### Privacy (Optional)
**Controls**: Privacy notices, data subject rights, data retention
**Evidence**: GDPR compliance documentation
**Location**: `gdpr/`

### System Description
**Location**: `soc2/system-description.md`
**Includes**:
- System overview
- Infrastructure
- Software components
- Boundaries
- Security controls

### Control Matrix
**Location**: `soc2/control-matrix.md`
**Format**:

| Control ID | Control Description | Testing Procedure | Evidence | Status |
|------------|-------------------|-------------------|----------|--------|
| CC6.1 | Logical access controls | Review user access reports | audit-logs/access-logs/ | ✅ |
| CC6.6 | Encryption at rest and in transit | Review encryption configs | 02-config/prod/ | ✅ |
| CC7.2 | Security incident management | Review incident logs | 06-security/incident-response/ | ✅ |

## Audit Logs

### Centralized Audit Trail
**Location**: `audit-logs/`
**Retention**: 7 years (or per regulatory requirement)
**Format**: JSON structured logs
**Protection**: Write-once, tamper-evident

### Log Categories

#### Access Logs
**Location**: `audit-logs/access-logs/`
**Contents**:
- Authentication events (login, logout, failed attempts)
- Authorization decisions
- Administrative access
- Privileged operations
- Access reviews

**Schema**:
```json
{
  "timestamp": "2025-11-25T10:30:00Z",
  "event_type": "authentication",
  "action": "login",
  "user_id": "user@example.com",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "result": "success",
  "mfa_used": true,
  "session_id": "abc123...",
  "geo_location": "US/California"
}
```

#### Change Logs
**Location**: `audit-logs/change-logs/`
**Contents**:
- Configuration changes
- Code deployments
- User permission changes
- Policy updates
- Infrastructure modifications

#### Security Logs
**Location**: `audit-logs/security-logs/`
**Contents**:
- Security events
- Vulnerability detections
- Intrusion attempts
- Firewall blocks
- Anomaly detections

#### Compliance Logs
**Location**: `audit-logs/compliance-logs/`
**Contents**:
- Compliance events
- Policy violations
- Access reviews
- Training completions
- Audit activities

### Log Monitoring
- **Real-time**: Security events
- **Daily**: Access patterns
- **Weekly**: Compliance checks
- **Monthly**: Comprehensive review

## Evidence Collection

### Evidence Types
1. **Screenshots**: System configurations, dashboards
2. **Reports**: Test results, scan outputs, metrics
3. **Documents**: Policies, procedures, sign-offs
4. **Logs**: Audit trails, access logs
5. **Artifacts**: Code reviews, tickets, approvals

### Collection Schedule
- **Continuous**: Automated log collection
- **Weekly**: Test reports, scan results
- **Monthly**: Metrics, dashboards, reviews
- **Quarterly**: Comprehensive evidence package

### Evidence Organization
**Structure**: `evidence/Q[1-4]-YYYY/[control-id]/`

Example:
```
evidence/
├── Q4-2025/
│   ├── A.9.2-Access-Management/
│   │   ├── access-review-oct-2025.pdf
│   │   ├── new-user-approvals.csv
│   │   └── terminated-user-access-removal.xlsx
│   ├── A.12.4-Logging-Monitoring/
│   │   ├── log-retention-evidence.pdf
│   │   ├── security-alert-dashboard.png
│   │   └── log-review-report-q4.pdf
│   └── ...
```

## Certifications

### Current Certifications
1. **ISO 27001:2022**
   - Certificate Number: ISO27001-2025-XXXX
   - Issued: 2025-01-15
   - Expires: 2028-01-14
   - Certifying Body: BSI Group

2. **SOC 2 Type II**
   - Report Period: 2024-01-01 to 2024-12-31
   - Issued: 2025-02-28
   - Auditor: [Accounting Firm Name]
   - Opinion: Unqualified

### Upcoming Certifications
- SOC 2 Type II (Annual renewal)
- ISO 27001 Surveillance Audit (2026-01)
- PCI DSS Level 1 (If processing cards)

## Compliance Calendar

### Quarterly Activities
- Internal audits
- Management reviews
- Risk assessments updates
- Evidence collection
- Compliance training

### Annual Activities
- External audits
- Policy reviews
- Comprehensive risk assessment
- Certification renewals
- Third-party assessments

### Continuous Activities
- Audit log collection
- Security monitoring
- Incident management
- Change management
- Access reviews

## Regulatory Requirements

### Data Protection Regulations
- **GDPR** (EU): General Data Protection Regulation
- **CCPA** (California): California Consumer Privacy Act
- **LGPD** (Brazil): Lei Geral de Proteção de Dados

### Industry Standards
- **ISO 27001:2022**: Information security management
- **ISO 27701:2019**: Privacy information management
- **SOC 2**: Service organization controls
- **NIST CSF**: Cybersecurity Framework
- **PCI DSS**: Payment Card Industry Data Security Standard

### Reporting Obligations
- GDPR breaches: 72 hours to supervisory authority
- Material changes: Notify certifying bodies
- Annual reports: Submit to stakeholders
- Regulatory inquiries: Respond within deadline

## Contact Information

### Internal Contacts
- **Compliance Officer**: compliance@aurigraph.io
- **Data Protection Officer**: dpo@aurigraph.io
- **CISO**: ciso@aurigraph.io
- **Legal Counsel**: legal@aurigraph.io

### External Contacts
- **ISO Certifying Body**: BSI Group - certification@bsigroup.com
- **SOC 2 Auditor**: [Auditing Firm] - audit@firm.com
- **Legal Advisor**: [Law Firm] - attorney@lawfirm.com
- **Regulatory Authority**: [Your jurisdiction's data protection authority]

## Access Control

**Access Level**: Compliance Team + Auditors + Executive Management

**Document Classification**:
- Compliance templates: Internal
- Audit reports: Confidential
- Certifications: Public (after approval)
- Audit logs: Restricted
- Evidence: Confidential

## Related Documentation

- [Security Policies](../06-security/README.md)
- [Monitoring & Audit Logs](../08-monitoring/README.md)
- [Security Reviews](../06-security/security-reviews/)

## Document Control

- **Version**: 1.0
- **Classification**: Internal
- **Owner**: Compliance Officer
- **Last Updated**: 2025-11-25
- **Next Review**: 2026-02-25 (Quarterly)

---

For compliance inquiries: compliance@aurigraph.io
For data protection requests: dpo@aurigraph.io
