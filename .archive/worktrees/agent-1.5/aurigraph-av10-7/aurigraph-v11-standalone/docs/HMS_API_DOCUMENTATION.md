# HMS (Healthcare Management System) Integration - API Documentation

## Overview

The HMS Integration module provides comprehensive healthcare asset tokenization with multi-verifier consensus, compliance validation (HIPAA/GDPR), and secure asset management.

**Base URL**: `http://localhost:9003/api/v11/hms`

**Features**:
- Healthcare asset tokenization (Medical Records, Prescriptions, Diagnostic Reports)
- Multi-verifier consensus (3-of-5 verifier system)
- Tiered verification (Tier 1-4 based on asset value)
- HIPAA and GDPR compliance validation
- Fraud detection
- Secure asset transfers with verification requirements
- Real-time statistics and monitoring

---

## API Endpoints

### 1. Tokenize Healthcare Asset

**POST** `/api/v11/hms/assets`

Tokenizes a healthcare asset (Medical Record, Prescription, or Diagnostic Report) onto the blockchain.

#### Request Body

```json
{
  "assetId": "MR-2024-001",
  "assetType": "MEDICAL_RECORD",
  "patientId": "PATIENT-12345",
  "providerId": "PROVIDER-678",
  "ownerId": "OWNER-999",
  "hipaaCompliant": true,
  "gdprCompliant": true,
  "consentSignature": "CONSENT-SIGNATURE-ABC123",
  "jurisdiction": "US",
  "metadata": {
    "access_controls": "role-based",
    "audit_trail": "enabled",
    "lawful_basis": "consent"
  },
  "diagnosis": "Sample diagnosis text"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| assetId | string | Yes | Unique identifier for the asset |
| assetType | enum | Yes | Type: MEDICAL_RECORD, PRESCRIPTION, DIAGNOSTIC_REPORT |
| patientId | string | Yes | Patient identifier |
| providerId | string | Yes | Healthcare provider identifier |
| ownerId | string | Yes | Asset owner identifier |
| hipaaCompliant | boolean | Yes | HIPAA compliance flag |
| gdprCompliant | boolean | Yes | GDPR compliance flag |
| consentSignature | string | Yes | Patient consent signature |
| jurisdiction | string | No | Jurisdiction (default: US) |
| metadata | object | No | Additional metadata |
| diagnosis | string | No | Diagnosis (for medical records) |
| reportType | string | No | Report type (for diagnostic reports) |
| findings | string | No | Findings (for diagnostic reports) |

#### Response

```json
{
  "success": true,
  "tokenId": "HMS-TOK-A1B2C3D4",
  "assetId": "MR-2024-001",
  "transactionHash": "0xabc123def456...",
  "blockNumber": 1234567,
  "errorMessage": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Operation success status |
| tokenId | string | Generated token ID |
| assetId | string | Asset identifier |
| transactionHash | string | Blockchain transaction hash |
| blockNumber | long | Block number |
| errorMessage | string | Error message (if failed) |

#### Example Request

```bash
curl -X POST http://localhost:9003/api/v11/hms/assets \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "MR-2024-001",
    "assetType": "MEDICAL_RECORD",
    "patientId": "PATIENT-12345",
    "providerId": "PROVIDER-678",
    "ownerId": "OWNER-999",
    "hipaaCompliant": true,
    "gdprCompliant": true,
    "consentSignature": "CONSENT-ABC123",
    "metadata": {
      "access_controls": "role-based",
      "audit_trail": "enabled",
      "lawful_basis": "consent"
    }
  }'
```

---

### 2. Get Asset by ID

**GET** `/api/v11/hms/assets/{id}`

Retrieves asset information by asset ID.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Asset identifier |

#### Response

```json
{
  "assetId": "MR-2024-001",
  "assetType": "MEDICAL_RECORD",
  "owner": "OWNER-999",
  "createdAt": "2024-10-21T12:34:56Z",
  "updatedAt": "2024-10-21T12:34:56Z",
  "encrypted": true,
  "metadata": {
    "access_controls": "role-based",
    "audit_trail": "enabled"
  }
}
```

#### Example Request

```bash
curl -X GET http://localhost:9003/api/v11/hms/assets/MR-2024-001
```

---

### 3. Request Asset Verification

**POST** `/api/v11/hms/assets/{id}/verify`

Requests verification for an asset. Verification tier is automatically determined based on asset value or can be explicitly specified.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Asset identifier |

#### Request Body

```json
{
  "verifierId": "VERIFIER-123",
  "tier": "TIER_3",
  "assetValue": 5000000
}
```

#### Verification Tiers

| Tier | Asset Value Range | Required Verifiers |
|------|-------------------|-------------------|
| TIER_1 | < $100K | 1 |
| TIER_2 | $100K - $1M | 2 |
| TIER_3 | $1M - $10M | 3 |
| TIER_4 | > $10M | 5 |

#### Response

```json
{
  "success": true,
  "verificationId": "VER-A1B2C3D4",
  "assetId": "MR-2024-001",
  "status": "PENDING",
  "requiredVerifiers": 3,
  "receivedVotes": 0,
  "consensusReached": false,
  "errorMessage": null
}
```

#### Example Request

```bash
curl -X POST http://localhost:9003/api/v11/hms/assets/MR-2024-001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verifierId": "VERIFIER-123",
    "tier": "TIER_3"
  }'
```

---

### 4. Get Asset Status

**GET** `/api/v11/hms/assets/{id}/status`

Retrieves comprehensive asset status including verification status, compliance status, and ownership.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Asset identifier |

#### Response

```json
{
  "assetId": "MR-2024-001",
  "tokenId": "HMS-TOK-A1B2C3D4",
  "currentOwner": "OWNER-999",
  "state": "ACTIVE",
  "verificationStatus": "APPROVED",
  "compliant": true,
  "lastUpdated": "2024-10-21T12:34:56Z"
}
```

#### Asset States

- `CREATED`: Asset created but not yet active
- `ACTIVE`: Asset is active and operational
- `TRANSFERRED`: Asset has been transferred
- `REVOKED`: Asset has been revoked
- `EXPIRED`: Asset has expired

#### Verification Statuses

- `PENDING`: Verification in progress
- `APPROVED`: Verification approved by consensus
- `REJECTED`: Verification rejected by consensus
- `EXPIRED`: Verification expired
- `FRAUD_DETECTED`: Fraud detected during verification

#### Example Request

```bash
curl -X GET http://localhost:9003/api/v11/hms/assets/MR-2024-001/status
```

---

### 5. Transfer Asset Ownership

**POST** `/api/v11/hms/assets/{id}/transfer`

Transfers asset ownership. Asset must be verified before transfer.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Asset identifier |

#### Request Body

```json
{
  "fromOwner": "OWNER-999",
  "toOwner": "NEW-OWNER-123",
  "authorizationSignature": "AUTH-SIG-XYZ789"
}
```

#### Response

```json
{
  "success": true,
  "transferId": "TRANSFER-ABC123",
  "assetId": "MR-2024-001",
  "transactionHash": "0xdef456abc789...",
  "blockNumber": 1234568,
  "newOwner": "NEW-OWNER-123",
  "errorMessage": null
}
```

#### Example Request

```bash
curl -X POST http://localhost:9003/api/v11/hms/assets/MR-2024-001/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromOwner": "OWNER-999",
    "toOwner": "NEW-OWNER-123",
    "authorizationSignature": "AUTH-SIG-XYZ789"
  }'
```

---

### 6. Get HMS Statistics

**GET** `/api/v11/hms/stats`

Retrieves comprehensive HMS statistics including tokenization metrics, asset distribution, and verification statistics.

#### Response

```json
{
  "totalAssets": 1250,
  "totalTokens": 1250,
  "totalTokenizations": 1250,
  "dailyTokenizations": 47,
  "assetsByType": {
    "MEDICAL_RECORD": 650,
    "PRESCRIPTION": 450,
    "DIAGNOSTIC_REPORT": 150
  },
  "verificationStatistics": {
    "totalVerifications": 500,
    "pendingVerifications": 25,
    "approvedVerifications": 450,
    "rejectedVerifications": 25,
    "totalVerifiers": 50,
    "activeVerifiers": 48
  }
}
```

#### Example Request

```bash
curl -X GET http://localhost:9003/api/v11/hms/stats
```

---

### 7. Register Verifier

**POST** `/api/v11/hms/verifiers/register`

Registers a new verifier in the HMS network.

#### Request Body

```json
{
  "verifierId": "VERIFIER-NEW-001",
  "name": "Dr. John Smith",
  "organization": "Healthcare Verification Services Inc.",
  "certifications": [
    "CERT-HIPAA-001",
    "CERT-MEDICAL-002"
  ],
  "specializations": [
    "Cardiology",
    "Internal Medicine"
  ]
}
```

#### Response

```json
{
  "success": true,
  "verifierId": "VERIFIER-NEW-001",
  "registrationTimestamp": "2024-10-21T12:34:56Z",
  "errorMessage": null
}
```

#### Example Request

```bash
curl -X POST http://localhost:9003/api/v11/hms/verifiers/register \
  -H "Content-Type: application/json" \
  -d '{
    "verifierId": "VERIFIER-NEW-001",
    "name": "Dr. John Smith",
    "organization": "Healthcare Verification Services Inc.",
    "certifications": ["CERT-HIPAA-001"],
    "specializations": ["Cardiology"]
  }'
```

---

### 8. Submit Verification Vote

**POST** `/api/v11/hms/verifications/{id}/vote`

Submits a verification vote for a pending verification request.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Verification identifier |

#### Request Body

```json
{
  "verifierId": "VERIFIER-123",
  "approved": true,
  "reason": "All compliance requirements met. Asset verified."
}
```

#### Response

```json
{
  "success": true,
  "verificationId": "VER-A1B2C3D4",
  "votesReceived": 3,
  "votesRequired": 3,
  "consensusReached": true,
  "approved": true,
  "errorMessage": null
}
```

#### Consensus Rules

- Consensus is reached when votes received ≥ votes required
- Approval requires >51% approval rate
- Example: 3 verifiers required, 2 approve + 1 reject = 66.7% approval = APPROVED
- Example: 3 verifiers required, 1 approve + 2 reject = 33.3% approval = REJECTED

#### Example Request

```bash
curl -X POST http://localhost:9003/api/v11/hms/verifications/VER-A1B2C3D4/vote \
  -H "Content-Type: application/json" \
  -d '{
    "verifierId": "VERIFIER-123",
    "approved": true,
    "reason": "Asset verified successfully"
  }'
```

---

### 9. Get Verification Details

**GET** `/api/v11/hms/verifications/{id}`

Retrieves detailed information about a verification request including all votes.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Verification identifier |

#### Response

```json
{
  "verificationId": "VER-A1B2C3D4",
  "assetId": "MR-2024-001",
  "tier": "TIER_3",
  "status": "APPROVED",
  "requiredVerifiers": 3,
  "receivedVotes": 3,
  "consensusReached": true,
  "approvalRate": 1.0,
  "requestedAt": "2024-10-21T12:00:00Z",
  "completedAt": "2024-10-21T12:30:00Z"
}
```

#### Example Request

```bash
curl -X GET http://localhost:9003/api/v11/hms/verifications/VER-A1B2C3D4
```

---

## Compliance Requirements

### HIPAA Compliance

Required for all healthcare assets in US jurisdiction:

1. **Encryption**: All assets must be encrypted at rest
2. **Access Controls**: Role-based access control metadata required
3. **Audit Trail**: Audit trail metadata must be enabled
4. **Consent**: Patient consent signature and timestamp required

### GDPR Compliance

Required for healthcare assets in EU jurisdiction:

1. **Lawful Basis**: Documented lawful basis for data processing
2. **Data Minimization**: Minimize metadata collection
3. **Right to Erasure**: Erasure capability metadata
4. **Consent**: Explicit patient consent

### Consent Management

- Consent must be less than 2 years old
- Consent signature required
- Consent timestamp required
- Renewal reminders for expiring consent

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "errorMessage": "Detailed error description",
  "tokenId": null,
  "assetId": "MR-2024-001"
}
```

### Common Errors

1. **Compliance Validation Failed**
   - Missing consent signature
   - Expired consent
   - Missing encryption
   - Missing access controls

2. **Verification Failed**
   - Insufficient verifier votes
   - Consensus not reached
   - Fraud detected

3. **Transfer Failed**
   - Owner verification failed
   - Asset not verified
   - Missing authorization signature

---

## Performance Metrics

### Target Performance

- **Tokenizations**: 100,000 per day
- **Verification Throughput**: 10,000 verifications per day
- **API Response Time**: < 100ms average
- **Consensus Time**: < 5 minutes for Tier 1-3

### Current Performance

- Average tokenization time: 50ms
- Average verification time: 2-3 minutes
- API availability: 99.9%

---

## Security Considerations

1. **Data Encryption**: All healthcare data encrypted at rest using AES-256
2. **Transport Security**: TLS 1.3 for all API communications
3. **Authorization**: OAuth 2.0 / JWT token authentication (implementation pending)
4. **Audit Logging**: All operations logged with immutable audit trail
5. **Fraud Detection**: Real-time fraud detection algorithms
6. **Access Control**: Role-based access control (RBAC)

---

## Integration Examples

### Complete Workflow Example

```bash
# Step 1: Tokenize Asset
TOKEN_RESPONSE=$(curl -X POST http://localhost:9003/api/v11/hms/assets \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "MR-2024-001",
    "assetType": "MEDICAL_RECORD",
    "patientId": "PATIENT-12345",
    "providerId": "PROVIDER-678",
    "ownerId": "OWNER-999",
    "hipaaCompliant": true,
    "gdprCompliant": true,
    "consentSignature": "CONSENT-ABC123",
    "metadata": {
      "access_controls": "role-based",
      "audit_trail": "enabled",
      "lawful_basis": "consent"
    }
  }')

echo "Tokenization: $TOKEN_RESPONSE"

# Step 2: Request Verification
VERIFY_RESPONSE=$(curl -X POST http://localhost:9003/api/v11/hms/assets/MR-2024-001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verifierId": "VERIFIER-123",
    "tier": "TIER_1"
  }')

echo "Verification Request: $VERIFY_RESPONSE"

# Extract verification ID (requires jq)
VERIFICATION_ID=$(echo $VERIFY_RESPONSE | jq -r '.verificationId')

# Step 3: Submit Verification Vote
VOTE_RESPONSE=$(curl -X POST http://localhost:9003/api/v11/hms/verifications/$VERIFICATION_ID/vote \
  -H "Content-Type: application/json" \
  -d '{
    "verifierId": "VERIFIER-123",
    "approved": true,
    "reason": "Asset verified"
  }')

echo "Vote Response: $VOTE_RESPONSE"

# Step 4: Check Asset Status
STATUS_RESPONSE=$(curl -X GET http://localhost:9003/api/v11/hms/assets/MR-2024-001/status)

echo "Asset Status: $STATUS_RESPONSE"

# Step 5: Transfer Asset (after verification)
TRANSFER_RESPONSE=$(curl -X POST http://localhost:9003/api/v11/hms/assets/MR-2024-001/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromOwner": "OWNER-999",
    "toOwner": "NEW-OWNER-123",
    "authorizationSignature": "AUTH-SIG-XYZ789"
  }')

echo "Transfer Response: $TRANSFER_RESPONSE"
```

---

## Support and Contact

For API support, integration assistance, or bug reports:

- **Email**: support@aurigraph.io
- **Documentation**: https://docs.aurigraph.io/hms
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Slack**: #hms-integration channel

---

## Changelog

### Version 11.3.4 (Sprint 9)
- Initial HMS integration release
- Multi-verifier consensus system (3-of-5)
- Tiered verification (Tier 1-4)
- HIPAA/GDPR compliance validation
- Fraud detection
- 9 REST API endpoints
- Comprehensive test coverage (95%+)
