# Access Control Policy

## Document Information
- **Document ID**: SEC-POL-001
- **Version**: 1.0
- **Effective Date**: 2025-11-25
- **Review Date**: 2026-11-25
- **Owner**: CISO
- **Classification**: Internal
- **ISO 27001 Control**: A.9 (Access Control)

## 1. Purpose

This policy establishes the requirements and procedures for managing access to Aurigraph DLT information systems, applications, and data. It ensures that access is granted based on business need and the principle of least privilege, in compliance with ISO 27001:2022 control A.9.

## 2. Scope

This policy applies to:
- All employees, contractors, and third-party users
- All information systems and applications
- All data and information assets
- All access methods (local, remote, cloud, API)

## 3. Policy Statements

### 3.1 Principle of Least Privilege
- Users shall be granted the minimum access rights necessary to perform their job functions
- Access shall be based on business need and role requirements
- Excessive permissions shall be promptly removed

### 3.2 Role-Based Access Control (RBAC)
- Access rights shall be assigned based on predefined roles
- Roles shall be documented with clear access privileges
- Users may have multiple roles only when justified

### 3.3 User Access Management

#### 3.3.1 Access Provisioning
- All access requests must be approved by the user's manager
- Privileged access requires additional approval from the security team
- Production access requires separate justification and approval
- Access must be granted within 24 hours of approval

#### 3.3.2 Access Modification
- Changes to access rights require the same approval as initial provisioning
- Temporary elevated access must have an expiration date
- All access changes must be logged

#### 3.3.3 Access Revocation
- Access must be revoked immediately upon termination
- Access for departing employees must be revoked on their last day
- Contractor access expires automatically at contract end
- Unused accounts must be disabled after 90 days of inactivity

### 3.4 Authentication Requirements

#### 3.4.1 Multi-Factor Authentication (MFA)
- MFA is required for:
  - All remote access
  - All privileged accounts
  - All production system access
  - All administrative functions
  - All API access with sensitive operations

#### 3.4.2 Password Requirements
- Minimum length: 14 characters
- Complexity: Must include uppercase, lowercase, numbers, special characters
- No reuse of last 12 passwords
- Password expiration: Every 90 days
- No default passwords allowed
- Passwords must not be shared

#### 3.4.3 Service Account Management
- Service accounts must be tied to specific applications or services
- Service accounts must use certificate-based or token-based authentication
- Service account credentials must be stored in a secure vault
- Service account passwords must rotate every 90 days

### 3.5 Privileged Access Management

#### 3.5.1 Definition of Privileged Access
- System administrator accounts
- Database administrator accounts
- Security administrator accounts
- Root/administrator access
- Access to production systems
- Access to sensitive data (PII, financial, health)

#### 3.5.2 Privileged Access Controls
- Privileged accounts must be separate from standard user accounts
- Privileged sessions must be logged and monitored
- Privileged access must use jump hosts or PAM systems
- Privileged access requires approval and justification
- Emergency privileged access requires post-event review

### 3.6 Access Reviews

#### 3.6.1 Regular Access Reviews
- User access rights shall be reviewed quarterly
- Managers must certify access for their team members
- Privileged access reviewed monthly
- Findings must be remediated within 14 days

#### 3.6.2 Event-Driven Reviews
- Access review after role change
- Access review after system changes
- Access review after security incidents
- Access review during audits

### 3.7 Remote Access

#### 3.7.1 Requirements
- Must use approved VPN or zero-trust network access
- Must use corporate-managed devices only
- Must enable endpoint security (antivirus, EDR)
- Must use encrypted connections (TLS 1.3+)
- Personal devices prohibited for production access

#### 3.7.2 Remote Privileged Access
- Additional approval required
- Session recording mandatory
- Time-limited access
- Restricted IP ranges where possible

### 3.8 Third-Party Access

#### 3.8.1 Vendor and Partner Access
- Must have signed NDA and data processing agreement
- Access limited to specific systems and data
- Access monitored and logged
- Access reviewed monthly
- Access automatically expires (max 90 days)

#### 3.8.2 Contractor Access
- Same requirements as employees
- Sponsor (employee) must justify access
- Access terminated with contract
- No privileged access without additional approval

### 3.9 API Access Control

#### 3.9.1 Authentication
- OAuth 2.0 or API keys required
- API keys must rotate every 90 days
- Client certificates for sensitive APIs
- Rate limiting enforced

#### 3.9.2 Authorization
- Scope-based authorization (principle of least privilege)
- Different access levels (read, write, admin)
- API access logged and monitored

## 4. Roles and Responsibilities

### 4.1 Users
- Protect credentials and access devices
- Report lost or compromised credentials immediately
- Use access only for authorized purposes
- Comply with all access control requirements

### 4.2 Managers
- Approve access requests for team members
- Conduct quarterly access reviews
- Report terminated employees promptly
- Ensure team compliance with policy

### 4.3 Security Team
- Implement and maintain access control systems
- Review and approve privileged access requests
- Monitor access logs for anomalies
- Conduct access audits
- Provide guidance on access control

### 4.4 IT Operations
- Provision and deprovision access
- Implement technical access controls
- Maintain identity and access management (IAM) systems
- Support MFA implementation

### 4.5 CISO
- Overall responsibility for access control
- Policy approval and updates
- Escalation point for access issues
- Report to executive management

## 5. Compliance

### 5.1 Violations
Violations of this policy may result in:
- Immediate access revocation
- Disciplinary action up to and including termination
- Legal action for unauthorized access
- Notification to law enforcement if criminal activity suspected

### 5.2 Monitoring and Auditing
- All access events shall be logged
- Logs reviewed regularly for anomalies
- Access compliance audited quarterly
- Findings reported to management

### 5.3 Exceptions
- Exceptions to this policy require CISO approval
- Exceptions must be documented with justification
- Exceptions reviewed quarterly
- Compensating controls required

## 6. Related Documents

- Password Policy (SEC-POL-002)
- Remote Access Procedure (SEC-PROC-001)
- Privileged Access Management Procedure (SEC-PROC-002)
- Acceptable Use Policy (SEC-POL-003)
- Access Review Procedure (SEC-PROC-003)

## 7. Definitions

- **Least Privilege**: Granting the minimum access necessary to perform a function
- **MFA**: Multi-Factor Authentication using two or more authentication factors
- **Privileged Access**: Access with elevated permissions beyond normal users
- **RBAC**: Role-Based Access Control where permissions are assigned to roles
- **Service Account**: Non-human account used by applications or services

## 8. Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-11-25 | CISO | Initial policy creation |

## 9. Approval

**Approved By**:
- Chief Information Security Officer (CISO)
- Chief Technology Officer (CTO)
- Chief Compliance Officer (CCO)

**Next Review Date**: 2026-11-25

---

**For questions or clarifications**: security@aurigraph.io
**To report access violations**: incident@aurigraph.io
