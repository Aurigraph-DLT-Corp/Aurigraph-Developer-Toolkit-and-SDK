# Aurigraph V11 Security Scanning Scripts

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintainer**: Security Team

---

## Overview

This directory contains automated security scanning scripts for Aurigraph V11. These scripts help maintain security compliance and identify vulnerabilities across the platform.

## Available Scripts

### 1. SSL Certificate Validator (`ssl-certificate-validator.sh`)

**Purpose**: Validate SSL/TLS certificate configuration and security settings

**Usage**:
```bash
./ssl-certificate-validator.sh <domain> [port]
./ssl-certificate-validator.sh dlt.aurigraph.io
./ssl-certificate-validator.sh dlt.aurigraph.io 443
```

**Tests Performed**:
- SSL/TLS connectivity
- TLS version enforcement (TLS 1.3)
- Weak protocol detection (SSLv2, SSLv3, TLS 1.0, TLS 1.1)
- Strong cipher suite validation
- Certificate validity period
- Certificate chain verification
- Common Name/SAN matching
- Public key size (minimum 2048-bit)
- Signature algorithm strength
- OCSP stapling
- HSTS header presence
- HTTP to HTTPS redirect
- Perfect Forward Secrecy (PFS)
- TLS compression disabled (CRIME attack prevention)
- Heartbleed vulnerability check

**Requirements**:
- `openssl`
- `curl`
- `nmap` (optional, for enhanced testing)
- `jq` (optional, for SSL Labs API integration)

**Output**:
- Console output with color-coded results (PASS/FAIL/WARNING)
- Exit code 0 if all critical tests pass, 1 otherwise

**Example Output**:
```
================================
Aurigraph V11 SSL/TLS Certificate Validator
================================
Domain: dlt.aurigraph.io
Port: 443
Date: Tue Nov 12 18:50:00 UTC 2025

Testing: SSL/TLS connectivity to dlt.aurigraph.io:443... ✓ PASS
Testing: TLS version (minimum 1.3)... ✓ PASS
ℹ Info: TLS version: TLSv1.3
Testing: Weak TLS protocols... ✓ PASS
...

================================
Test Summary
================================
Passed:  14
Warned:  1
Failed:  0

✓ All critical tests passed!
```

---

### 2. Dependency Vulnerability Scanner (`dependency-vulnerability-scanner.sh`)

**Purpose**: Scan Java (Maven) and Node.js (NPM) dependencies for known vulnerabilities

**Usage**:
```bash
./dependency-vulnerability-scanner.sh [--maven|--npm|--docker|--all]

# Scan all dependencies
./dependency-vulnerability-scanner.sh --all

# Scan only Maven dependencies
./dependency-vulnerability-scanner.sh --maven

# Scan only NPM dependencies
./dependency-vulnerability-scanner.sh --npm

# Scan Docker images
./dependency-vulnerability-scanner.sh --docker
```

**Scanning Methods**:

**Maven (Java/Quarkus)**:
- Maven dependency tree analysis
- OWASP Dependency-Check (CVE database)
- Trivy vulnerability scanner

**NPM (Enterprise Portal)**:
- npm audit (built-in)
- Trivy vulnerability scanner

**Docker**:
- Trivy image scanner

**Requirements**:
- `mvn` (Maven 3.9+)
- `npm` (Node.js 20+)
- `docker` (for Docker image scanning)
- `trivy` (recommended) - Install: `brew install trivy` (macOS) or `apt install trivy` (Linux)
- `jq` (for JSON parsing)

**Output**:
- Individual scan reports (JSON + text)
- Consolidated security report (Markdown)
- Reports saved to: `/security-reports/dependency-scans/`

**Report Files**:
```
security-reports/dependency-scans/
├── maven-dependency-tree-<timestamp>.txt
├── dependency-check-report.html
├── trivy-maven-<timestamp>.json
├── npm-audit-<timestamp>.json
├── trivy-npm-<timestamp>.json
├── trivy-docker-<image>-<timestamp>.json
└── CONSOLIDATED_SECURITY_REPORT_<timestamp>.md
```

**Example Output**:
```
================================
Maven Vulnerability Summary
================================
Critical: 0
High: 2
Medium: 5
Low: 8

================================
Scan Complete
================================
✓ All critical vulnerabilities addressed!

Reports saved to: /security-reports/dependency-scans/
```

---

### 3. Configuration Audit (`configuration-audit.sh`)

**Purpose**: Audit configuration files for security misconfigurations and hardcoded secrets

**Usage**:
```bash
./configuration-audit.sh
```

**Files Audited**:
- `application.properties` (Quarkus configuration)
- `pom.xml` (Maven dependencies)
- `docker-compose.yml` (Container configuration)
- `nginx.conf` (Reverse proxy settings)
- `.env` files (Environment variables)

**Checks Performed**:
- Hardcoded secrets/passwords
- TLS/SSL configuration
- CORS policies
- Debug mode in production
- Database password security
- HSM (Hardware Security Module) usage
- Outdated dependencies
- Privileged containers
- Resource limits
- Read-only filesystems
- Security headers (HSTS, CSP, etc.)
- Rate limiting
- Environment variable exposure

**Output**:
- Console output with severity levels (CRITICAL/HIGH/MEDIUM/LOW/INFO)
- Detailed report saved to: `/security-reports/config-audits/`

**Severity Levels**:
- **CRITICAL**: Immediate action required (e.g., hardcoded passwords)
- **HIGH**: Security risk that should be addressed soon (e.g., weak TLS)
- **MEDIUM**: Best practice violation (e.g., missing HSTS)
- **LOW**: Minor issue or improvement (e.g., verbose logging)
- **INFO**: Informational item (e.g., manual checks required)

**Example Output**:
```
================================
Aurigraph V11 Configuration Security Audit
================================

[CRITICAL] Database password hardcoded in configuration file
[HIGH] HSTS header not configured
[MEDIUM] Resource limits (mem_limit, cpus) not fully configured
✓ No SNAPSHOT dependencies
✓ TLS 1.3 enforced

================================
Audit Summary
================================
Critical Issues: 1
High Issues: 1
Medium Issues: 3
Low Issues: 0
Informational: 5

Full report: /security-reports/config-audits/config-audit-<timestamp>.txt
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1' # Weekly on Mondays at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Java 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Trivy
        run: |
          sudo apt-get install -y wget apt-transport-https gnupg lsb-release
          wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
          echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
          sudo apt-get update
          sudo apt-get install -y trivy

      - name: Run Dependency Vulnerability Scan
        run: |
          cd security-scripts
          ./dependency-vulnerability-scanner.sh --all

      - name: Run Configuration Audit
        run: |
          cd security-scripts
          ./configuration-audit.sh

      - name: Upload Security Reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: security-reports/

      - name: Fail on Critical/High Vulnerabilities
        run: |
          if [ $? -ne 0 ]; then
            echo "Security scan failed. Review reports."
            exit 1
          fi
```

---

## Scheduled Scans

### Cron Job Setup (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add scheduled scans

# Daily dependency scan at 2 AM
0 2 * * * /path/to/Aurigraph-DLT/security-scripts/dependency-vulnerability-scanner.sh --all

# Weekly configuration audit on Mondays at 3 AM
0 3 * * 1 /path/to/Aurigraph-DLT/security-scripts/configuration-audit.sh

# Monthly SSL certificate check on 1st of each month at 4 AM
0 4 1 * * /path/to/Aurigraph-DLT/security-scripts/ssl-certificate-validator.sh dlt.aurigraph.io
```

---

## Report Storage

All security reports are saved to:
```
Aurigraph-DLT/
└── security-reports/
    ├── dependency-scans/
    │   ├── maven-dependency-tree-<timestamp>.txt
    │   ├── dependency-check-report.html
    │   ├── trivy-maven-<timestamp>.json
    │   ├── npm-audit-<timestamp>.json
    │   └── CONSOLIDATED_SECURITY_REPORT_<timestamp>.md
    └── config-audits/
        └── config-audit-<timestamp>.txt
```

**Note**: Add `security-reports/` to `.gitignore` to prevent committing sensitive vulnerability data.

---

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
# Make scripts executable
chmod +x security-scripts/*.sh
```

**2. Command Not Found (openssl, curl, etc.)**
```bash
# macOS (Homebrew)
brew install openssl curl nmap trivy jq

# Ubuntu/Debian
sudo apt install openssl curl nmap jq
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt update && sudo apt install trivy
```

**3. Maven Build Failures**
```bash
# Clean and rebuild
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean install -DskipTests
```

**4. SSL Certificate Validator Fails on macOS**
```bash
# macOS uses LibreSSL by default, which may not support all tests
# Install OpenSSL via Homebrew
brew install openssl
export PATH="/usr/local/opt/openssl/bin:$PATH"
```

---

## Best Practices

1. **Run scans regularly**: Weekly minimum, daily recommended
2. **Review all CRITICAL and HIGH findings**: Within 24 hours
3. **Triage vulnerabilities**: Create JIRA tickets for remediation
4. **Track remediation**: Update tickets and re-scan after fixes
5. **Integrate with CI/CD**: Automated scans on every PR and merge
6. **Archive reports**: Retain for compliance audits (minimum 1 year)
7. **Update suppressions**: Use `dependency-check-suppressions.xml` for false positives

---

## Compliance Requirements

These scripts support the following compliance frameworks:

- **GDPR**: Data protection and security controls
- **SOC 2 Type II**: Security monitoring and vulnerability management
- **HIPAA**: Technical safeguards (if processing PHI)
- **PCI DSS**: Vulnerability scanning and configuration hardening

See:
- `/SECURITY_HARDENING_GUIDE.md`
- `/COMPLIANCE_CHECKLIST.md`

---

## Support

For issues or questions:
- **Security Team**: security@aurigraph.io
- **Documentation**: `/SECURITY_HARDENING_GUIDE.md`
- **Compliance**: compliance@aurigraph.io

---

## Changelog

### Version 1.0.0 (2025-11-12)
- Initial release
- SSL certificate validator
- Dependency vulnerability scanner (Maven + NPM)
- Configuration audit script
- Docker image scanning support
- Trivy integration

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintainer**: Security Team
