# Quantum Security V12 API Documentation

## Overview

The Quantum Security V12 API provides comprehensive quantum-resistant security and cryptographic management for the Aurigraph DLT Platform. These endpoints implement NIST-standardized post-quantum cryptographic algorithms and security monitoring capabilities.

**Base Path**: `/api/v12`

**Authentication**: Requires quantum-resistant digital signature authentication

**Rate Limiting**: Applied per endpoint to prevent abuse

---

## Endpoints

### 1. GET `/api/v12/crypto/algorithms`

List all supported post-quantum cryptographic algorithms.

#### Description
Returns comprehensive information about NIST-standardized quantum-resistant algorithms including CRYSTALS-Dilithium, CRYSTALS-Kyber, SPHINCS+, and FALCON.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `algorithm_type` | string | No | Filter by algorithm type (`signature`, `key_exchange`, `encryption`, `hash`) |
| `min_security_level` | integer | No | Minimum NIST security level (1-5) |
| `recommended_only` | boolean | No | Show only recommended algorithms (default: false) |

#### Response Schema
```json
{
  "algorithms": [
    {
      "name": "CRYSTALS-Dilithium",
      "type": "signature",
      "security_level": 2,
      "key_size": 2528,
      "signature_size": 2420,
      "performance": {
        "keygen_ms": 0.05,
        "sign_ms": 0.08,
        "verify_ms": 0.04,
        "ops_per_second": 12500
      },
      "description": "NIST-selected digital signature algorithm...",
      "standardized": true,
      "recommended": true
    }
  ],
  "total_count": 10,
  "timestamp": "2024-12-16T10:30:00Z"
}
```

#### NIST Security Levels
- **Level 1**: Equivalent to AES-128 (128-bit security)
- **Level 2**: Collision resistance of SHA-256 (256-bit security)
- **Level 3**: Equivalent to AES-192 (192-bit security)
- **Level 4**: Collision resistance of SHA-384 (384-bit security)
- **Level 5**: Equivalent to AES-256 (256-bit security)

#### Example Request
```bash
curl -X GET "https://api.aurigraph.io/api/v12/crypto/algorithms?algorithm_type=signature&min_security_level=3"
```

#### Example Response
```json
{
  "algorithms": [
    {
      "name": "CRYSTALS-Dilithium-3",
      "type": "signature",
      "security_level": 3,
      "key_size": 4000,
      "signature_size": 3293,
      "performance": {
        "keygen_ms": 0.08,
        "sign_ms": 0.12,
        "verify_ms": 0.06,
        "ops_per_second": 8333
      },
      "description": "Higher security variant of Dilithium with NIST security level 3...",
      "standardized": true,
      "recommended": true
    }
  ],
  "total_count": 1,
  "timestamp": "2024-12-16T10:30:00Z"
}
```

---

### 2. GET `/api/v12/security/quantum-status`

Get current quantum security status and configuration.

#### Description
Returns comprehensive information about active quantum-resistant configuration, key rotation schedule, threat assessment, and operational metrics.

#### Response Schema
```json
{
  "enabled": true,
  "algorithm": "CRYSTALS-Dilithium",
  "security_level": 3,
  "key_rotation_due": "2025-03-15T00:00:00Z",
  "last_rotation": "2024-12-15T00:00:00Z",
  "threat_level": "low",
  "last_audit": "2024-12-09T00:00:00Z",
  "active_keys": 5,
  "total_operations": 1250000,
  "uptime_seconds": 2592000
}
```

#### Threat Levels
- **LOW**: Normal operations, no detected threats
- **MODERATE**: Minor anomalies detected
- **ELEVATED**: Suspicious activity detected
- **HIGH**: Active threats detected
- **CRITICAL**: System under attack or compromised

#### Example Request
```bash
curl -X GET "https://api.aurigraph.io/api/v12/security/quantum-status"
```

---

### 3. POST `/api/v12/security/key-rotation`

Trigger quantum-resistant key rotation.

#### Description
Performs automatic key rotation for quantum-resistant cryptographic keys. Critical for maintaining long-term security against quantum attacks.

#### Request Schema
```json
{
  "algorithm": "CRYSTALS-Dilithium-5",
  "reason": "scheduled_rotation",
  "immediate": false
}
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `algorithm` | string | No | Algorithm to use for new key (defaults to current) |
| `reason` | string | Yes | Reason for rotation (audit trail) |
| `immediate` | boolean | No | Immediate rotation flag (default: false) |

#### Response Schema
```json
{
  "rotation_id": "550e8400-e29b-41d4-a716-446655440000",
  "old_key_id": "450e8400-e29b-41d4-a716-446655440001",
  "new_key_id": "650e8400-e29b-41d4-a716-446655440002",
  "algorithm": "CRYSTALS-Dilithium-5",
  "completed_at": "2024-12-16T10:30:00Z",
  "duration_ms": 150.5
}
```

#### Rotation Process
1. Generate new quantum-resistant keypair
2. Transition period with dual-key support
3. Update all dependent systems
4. Archive old key securely
5. Update audit logs

#### Best Practices
- Rotate keys every 90 days minimum
- Immediate rotation if compromise suspected
- Document rotation reason in audit trail
- Verify key distribution to all nodes

#### Rate Limiting
Maximum 10 rotations per hour per node.

#### Example Request
```bash
curl -X POST "https://api.aurigraph.io/api/v12/security/key-rotation" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "scheduled_90_day_rotation",
    "immediate": false
  }'
```

---

### 4. GET `/api/v12/security/audit-log`

Get security audit log with filtering and pagination.

#### Description
Comprehensive audit trail of all security-related events including key operations, signatures, encryption, authentication, and security alerts.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string | No | Start date (ISO 8601) |
| `end_date` | string | No | End date (ISO 8601) |
| `event_type` | string | No | Filter by event type |
| `severity` | string | No | Filter by severity level |
| `actor` | string | No | Filter by actor |
| `page` | integer | No | Page number (default: 1) |
| `size` | integer | No | Page size (default: 50, max: 1000) |

#### Event Types
- `key_generation`: New cryptographic key generated
- `key_rotation`: Cryptographic key rotated
- `signature_created`: Digital signature created
- `signature_verified`: Digital signature verified
- `encryption`: Data encrypted
- `decryption`: Data decrypted
- `authentication`: User/system authentication
- `authorization`: Access control decision
- `vulnerability_scan`: Security vulnerability scan
- `security_alert`: Security alert triggered

#### Severity Levels
- `critical`: Critical security event
- `high`: High severity event
- `medium`: Medium severity event
- `low`: Low severity event
- `info`: Informational event

#### Response Schema
```json
{
  "events": [
    {
      "event_id": "750e8400-e29b-41d4-a716-446655440003",
      "timestamp": "2024-12-16T10:30:00Z",
      "type": "key_rotation",
      "actor": "admin:security-team",
      "details": {
        "reason": "scheduled_rotation",
        "old_key_age_days": 90
      },
      "severity": "info",
      "ip_address": "10.0.1.50",
      "success": true
    }
  ],
  "total_count": 1500,
  "page": 1,
  "page_size": 50,
  "has_more": true
}
```

#### Compliance
- Logs retained for 7 years (regulatory compliance)
- Tamper-proof with blockchain anchoring
- Encrypted at rest with quantum-resistant encryption
- Real-time replication to audit database

#### Example Request
```bash
curl -X GET "https://api.aurigraph.io/api/v12/security/audit-log?event_type=key_rotation&page=1&size=100"
```

---

### 5. POST `/api/v12/security/vulnerabilities`

Run comprehensive security vulnerability scan.

#### Description
Performs automated security scanning across quantum cryptographic implementation, key management, API security, dependencies, and configurations.

#### Response Schema
```json
{
  "scan_id": "850e8400-e29b-41d4-a716-446655440004",
  "status": "completed",
  "started_at": "2024-12-16T10:30:00Z",
  "completed_at": "2024-12-16T10:35:00Z",
  "duration_ms": 45000.5,
  "findings": [
    {
      "finding_id": "950e8400-e29b-41d4-a716-446655440005",
      "severity": "medium",
      "component": "API Gateway",
      "category": "Rate Limiting",
      "description": "Rate limiting not enforced on all quantum cryptography endpoints...",
      "remediation": "Implement rate limiting on /api/v12/security/key-rotation endpoint...",
      "cvss_score": 5.3,
      "affected_versions": ["v12.0.0"],
      "discovered_at": "2024-12-16T10:30:00Z"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 2,
    "info": 1,
    "total": 5
  }
}
```

#### Scan Coverage
- Post-quantum cryptography implementation
- Key storage and rotation mechanisms
- Certificate validation
- TLS/SSL configuration
- Authentication and authorization
- Input validation
- SQL injection vectors
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Dependency vulnerabilities (CVEs)
- Misconfigurations

#### Severity Levels (CVSS v3.1)
- **CRITICAL**: 9.0-10.0 - Immediate action required
- **HIGH**: 7.0-8.9 - Action required within 24 hours
- **MEDIUM**: 4.0-6.9 - Action required within 7 days
- **LOW**: 0.1-3.9 - Action required within 30 days
- **INFO**: 0.0 - Informational only

#### Rate Limiting
Maximum 1 scan per hour to prevent resource exhaustion.

#### Example Request
```bash
curl -X POST "https://api.aurigraph.io/api/v12/security/vulnerabilities"
```

---

### 6. GET `/api/v12/crypto/performance`

Get real-time cryptographic performance metrics.

#### Description
Returns performance statistics for quantum-resistant operations including key generation, signing, verification, and encryption throughput.

#### Response Schema
```json
{
  "algorithm": "CRYSTALS-Dilithium",
  "security_level": 3,
  "operations": {
    "total": 1250000,
    "signatures": 850000,
    "verifications": 350000,
    "key_generations": 50,
    "encryptions": 50000
  },
  "performance": {
    "avg_sign_ms": 0.08,
    "avg_verify_ms": 0.04,
    "avg_keygen_ms": 0.05,
    "signatures_per_second": 12500,
    "verifications_per_second": 25000
  },
  "timestamp": "2024-12-16T10:30:00Z"
}
```

#### Example Request
```bash
curl -X GET "https://api.aurigraph.io/api/v12/crypto/performance"
```

---

## Supported Quantum Algorithms

### CRYSTALS-Dilithium
**Type**: Digital Signature
**NIST Status**: Selected (2022)
**Security Levels**: 2, 3, 5
**Key Sizes**: 2528, 4000, 4864 bytes
**Signature Sizes**: 2420, 3293, 4595 bytes
**Performance**: 12,500 signatures/second (Level 2)
**Recommended**: Yes

**Use Cases**: Transaction signing, block validation, consensus voting

### CRYSTALS-Kyber
**Type**: Key Encapsulation Mechanism
**NIST Status**: Selected (2022)
**Security Levels**: 1, 3, 5
**Key Sizes**: 1632, 2400, 3168 bytes
**Performance**: 20,000 operations/second (Level 1)
**Recommended**: Yes

**Use Cases**: Secure channel establishment, peer-to-peer encryption

### SPHINCS+
**Type**: Stateless Hash-based Signature
**NIST Status**: Selected (2022)
**Security Levels**: 1, 3, 5
**Key Sizes**: 64 bytes
**Signature Sizes**: 17,088+ bytes
**Performance**: 40 signatures/second (fast variant)
**Recommended**: No (performance constraints)

**Use Cases**: Long-term archival signatures, root certificate signing

### FALCON
**Type**: Digital Signature (NTRU Lattices)
**NIST Status**: Selected (2022)
**Security Levels**: 1, 5
**Key Sizes**: 1281, 2305 bytes
**Signature Sizes**: 666, 1280 bytes
**Performance**: 2,222 signatures/second (Level 1)
**Recommended**: Yes

**Use Cases**: Compact signatures, bandwidth-constrained environments

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid parameter: min_security_level must be between 1 and 5"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Quantum signature authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "reason",
      "message": "Field required"
    }
  ]
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 10 key rotations per hour.",
  "retry_after": 3600
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| GET `/crypto/algorithms` | 100 requests | 1 minute |
| GET `/security/quantum-status` | 60 requests | 1 minute |
| POST `/security/key-rotation` | 10 requests | 1 hour |
| GET `/security/audit-log` | 30 requests | 1 minute |
| POST `/security/vulnerabilities` | 1 request | 1 hour |
| GET `/crypto/performance` | 60 requests | 1 minute |

---

## Authentication

All V12 endpoints require quantum-resistant signature authentication:

1. Generate request signature using CRYSTALS-Dilithium
2. Include signature in `X-Quantum-Signature` header
3. Include public key fingerprint in `X-Public-Key-ID` header
4. Include timestamp in `X-Request-Timestamp` header

**Example Headers**:
```
X-Quantum-Signature: base64-encoded-signature
X-Public-Key-ID: 550e8400-e29b-41d4-a716-446655440000
X-Request-Timestamp: 2024-12-16T10:30:00Z
```

---

## Best Practices

### Security
1. Rotate keys every 90 days minimum
2. Use security level 3+ for high-value transactions
3. Enable audit logging for all operations
4. Run vulnerability scans monthly
5. Monitor threat level continuously

### Performance
1. Use CRYSTALS-Dilithium for signatures (best balance)
2. Use CRYSTALS-Kyber for key exchange
3. Cache public keys to reduce verification time
4. Batch signature verifications when possible
5. Monitor performance metrics regularly

### Compliance
1. Retain audit logs for 7 years
2. Document all key rotations
3. Respond to high/critical vulnerabilities within SLA
4. Maintain NIST compliance for all algorithms
5. Regular security assessments

---

## Support

For questions or issues with the Quantum Security V12 API:

- **Documentation**: https://docs.aurigraph.io/quantum-security-v12
- **API Status**: https://status.aurigraph.io
- **Support Email**: security@aurigraph.io
- **Security Issues**: security-reports@aurigraph.io (PGP encouraged)

---

## Version History

### v12.0.0 (2024-12-16)
- Initial release of Quantum Security V12 API
- NIST post-quantum algorithm support
- Comprehensive audit logging
- Automated vulnerability scanning
- Real-time performance metrics

---

**Last Updated**: December 16, 2024
**API Version**: v12.0.0
**Quantum Security Level**: NIST Level 3 (default)
