# Quantum Security V12 API - Quick Start Guide

## Overview

The Quantum Security V12 API provides post-quantum cryptographic security for Aurigraph DLT. This guide helps you get started quickly.

## Quick Access URLs

**Base URL**: `http://localhost:8000/api/v12` (development)
**Production**: `https://api.aurigraph.io/api/v12`

**API Documentation**: `http://localhost:8000/api/docs`

## 5 Core Endpoints

### 1. List Quantum Algorithms
```bash
# Get all algorithms
curl http://localhost:8000/api/v12/crypto/algorithms

# Get signature algorithms only
curl http://localhost:8000/api/v12/crypto/algorithms?algorithm_type=signature

# Get high-security algorithms (Level 3+)
curl http://localhost:8000/api/v12/crypto/algorithms?min_security_level=3
```

**Response**:
```json
{
  "algorithms": [...],
  "total_count": 10,
  "timestamp": "2024-12-16T10:30:00Z"
}
```

### 2. Check Security Status
```bash
curl http://localhost:8000/api/v12/security/quantum-status
```

**Response**:
```json
{
  "enabled": true,
  "algorithm": "CRYSTALS-Dilithium",
  "security_level": 3,
  "threat_level": "low",
  "active_keys": 5,
  "total_operations": 1250000
}
```

### 3. Rotate Cryptographic Keys
```bash
curl -X POST http://localhost:8000/api/v12/security/key-rotation \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "scheduled_rotation",
    "immediate": false
  }'
```

**Response**:
```json
{
  "rotation_id": "550e8400-e29b-41d4-a716-446655440000",
  "old_key_id": "450e8400-...",
  "new_key_id": "650e8400-...",
  "algorithm": "CRYSTALS-Dilithium",
  "completed_at": "2024-12-16T10:30:00Z",
  "duration_ms": 150.5
}
```

### 4. View Audit Logs
```bash
# Recent events
curl http://localhost:8000/api/v12/security/audit-log

# Filter by event type
curl http://localhost:8000/api/v12/security/audit-log?event_type=key_rotation

# Pagination
curl http://localhost:8000/api/v12/security/audit-log?page=1&size=100
```

**Response**:
```json
{
  "events": [...],
  "total_count": 1500,
  "page": 1,
  "page_size": 50,
  "has_more": true
}
```

### 5. Run Security Scan
```bash
curl -X POST http://localhost:8000/api/v12/security/vulnerabilities
```

**Response**:
```json
{
  "scan_id": "850e8400-...",
  "status": "completed",
  "findings": [...],
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

## Bonus: Performance Metrics
```bash
curl http://localhost:8000/api/v12/crypto/performance
```

**Response**:
```json
{
  "algorithm": "CRYSTALS-Dilithium",
  "operations": {
    "total": 1250000,
    "signatures": 850000,
    "verifications": 350000
  },
  "performance": {
    "avg_sign_ms": 0.08,
    "avg_verify_ms": 0.04,
    "signatures_per_second": 12500,
    "verifications_per_second": 25000
  }
}
```

## Python Client Example

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v12"

# 1. Get algorithms
response = requests.get(f"{BASE_URL}/crypto/algorithms")
algorithms = response.json()
print(f"Found {algorithms['total_count']} algorithms")

# 2. Check security status
response = requests.get(f"{BASE_URL}/security/quantum-status")
status = response.json()
print(f"Security Level: {status['security_level']}")
print(f"Threat Level: {status['threat_level']}")

# 3. Trigger key rotation
response = requests.post(
    f"{BASE_URL}/security/key-rotation",
    json={
        "reason": "scheduled_rotation",
        "immediate": False
    }
)
rotation = response.json()
print(f"Rotation ID: {rotation['rotation_id']}")

# 4. Get audit log
response = requests.get(
    f"{BASE_URL}/security/audit-log",
    params={"page": 1, "size": 50}
)
audit_log = response.json()
print(f"Total events: {audit_log['total_count']}")

# 5. Run vulnerability scan
response = requests.post(f"{BASE_URL}/security/vulnerabilities")
scan = response.json()
print(f"Scan ID: {scan['scan_id']}")
print(f"Findings: {scan['summary']['total']}")

# 6. Get performance metrics
response = requests.get(f"{BASE_URL}/crypto/performance")
perf = response.json()
print(f"Signatures/sec: {perf['performance']['signatures_per_second']}")
```

## JavaScript/TypeScript Client Example

```typescript
const BASE_URL = "http://localhost:8000/api/v12";

// 1. Get algorithms
const algorithms = await fetch(`${BASE_URL}/crypto/algorithms`)
  .then(r => r.json());
console.log(`Found ${algorithms.total_count} algorithms`);

// 2. Check security status
const status = await fetch(`${BASE_URL}/security/quantum-status`)
  .then(r => r.json());
console.log(`Security Level: ${status.security_level}`);

// 3. Trigger key rotation
const rotation = await fetch(`${BASE_URL}/security/key-rotation`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: "scheduled_rotation",
    immediate: false
  })
}).then(r => r.json());
console.log(`Rotation ID: ${rotation.rotation_id}`);

// 4. Get audit log
const auditLog = await fetch(
  `${BASE_URL}/security/audit-log?page=1&size=50`
).then(r => r.json());
console.log(`Total events: ${auditLog.total_count}`);

// 5. Run vulnerability scan
const scan = await fetch(`${BASE_URL}/security/vulnerabilities`, {
  method: 'POST'
}).then(r => r.json());
console.log(`Scan ID: ${scan.scan_id}`);
console.log(`Findings: ${scan.summary.total}`);

// 6. Get performance metrics
const perf = await fetch(`${BASE_URL}/crypto/performance`)
  .then(r => r.json());
console.log(`Signatures/sec: ${perf.performance.signatures_per_second}`);
```

## Key Concepts

### NIST Security Levels
- **Level 1**: AES-128 equivalent (128-bit security)
- **Level 2**: SHA-256 collision resistance
- **Level 3**: AES-192 equivalent (192-bit security) ⭐ **RECOMMENDED**
- **Level 4**: SHA-384 collision resistance
- **Level 5**: AES-256 equivalent (256-bit security)

### Recommended Algorithms
- **Signatures**: CRYSTALS-Dilithium (best balance)
- **Key Exchange**: CRYSTALS-Kyber (fastest)
- **Compact Signatures**: FALCON (smallest size)
- **Long-term Security**: SPHINCS+ (hash-based)

### Threat Levels
- **LOW**: Normal operations ✅
- **MODERATE**: Minor anomalies ⚠️
- **ELEVATED**: Suspicious activity 🔶
- **HIGH**: Active threats 🔴
- **CRITICAL**: System compromised 🚨

## Common Use Cases

### 1. Monitor Security Health
```bash
# Check status every minute
watch -n 60 'curl -s http://localhost:8000/api/v12/security/quantum-status | jq'
```

### 2. Scheduled Key Rotation
```bash
# Rotate keys (run via cron every 90 days)
curl -X POST http://localhost:8000/api/v12/security/key-rotation \
  -H "Content-Type: application/json" \
  -d '{"reason": "scheduled_90_day_rotation", "immediate": false}'
```

### 3. Security Compliance Report
```bash
# Get recent security events
curl -s "http://localhost:8000/api/v12/security/audit-log?page=1&size=1000" \
  | jq '.events[] | select(.severity == "high" or .severity == "critical")'
```

### 4. Performance Monitoring
```bash
# Monitor crypto performance
curl -s http://localhost:8000/api/v12/crypto/performance \
  | jq '{algorithm, signatures_per_sec: .performance.signatures_per_second}'
```

### 5. Vulnerability Management
```bash
# Run scan and check for critical issues
scan_result=$(curl -s -X POST http://localhost:8000/api/v12/security/vulnerabilities)
critical_count=$(echo $scan_result | jq '.summary.critical')
if [ "$critical_count" -gt 0 ]; then
  echo "⚠️ CRITICAL vulnerabilities found: $critical_count"
fi
```

## Testing

Run the test suite:
```bash
# All quantum security tests
pytest tests/api/test_quantum_security.py -v

# Specific test class
pytest tests/api/test_quantum_security.py::TestQuantumAlgorithmsEndpoint -v

# With coverage
pytest tests/api/test_quantum_security.py --cov=app.api.quantum_security
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/crypto/algorithms` | 100 req | 1 min |
| `/security/quantum-status` | 60 req | 1 min |
| `/security/key-rotation` | 10 req | 1 hour |
| `/security/audit-log` | 30 req | 1 min |
| `/security/vulnerabilities` | 1 req | 1 hour |
| `/crypto/performance` | 60 req | 1 min |

## Interactive API Documentation

Visit the interactive docs:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

Try endpoints directly in your browser!

## Troubleshooting

### Import Error
```bash
# Make sure you're in the correct directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-fastapi

# Verify module exists
ls -la app/api/quantum_security.py
```

### Server Not Running
```bash
# Start the FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

### Rate Limited
```
HTTP 429: Rate limit exceeded
```
Wait for the rate limit window to reset, or contact admin for rate limit increase.

## Best Practices

1. **Use Level 3+ for production**: Better quantum resistance
2. **Rotate keys every 90 days**: Maintain security
3. **Monitor audit logs**: Detect anomalies early
4. **Run monthly scans**: Stay ahead of vulnerabilities
5. **Cache performance metrics**: Reduce API calls

## Support

- **Documentation**: See `QUANTUM_SECURITY_V12_API.md` for full details
- **Issues**: Report at https://github.com/aurigraph-dlt/issues
- **Security**: security@aurigraph.io

---

**Quick Reference Created**: December 16, 2024
**API Version**: v12.0.0
