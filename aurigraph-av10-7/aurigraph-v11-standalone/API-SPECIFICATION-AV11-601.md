# API Specification: Secondary Token Versioning
## AV11-601 Complete REST API Documentation

**Format**: OpenAPI 3.0 Compatible
**Version**: 1.0.0
**Date**: December 23, 2025
**Base URL**: `http://localhost:9003/api/v12`

---

## 1. API OVERVIEW

### Base Information
- **Title**: Secondary Token Versioning API
- **Version**: 1.0.0
- **Description**: RESTful API for managing secondary token versions with VVB validation and audit trails
- **Contact**: dev@aurigraph.io
- **License**: Proprietary

### Authentication
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Scope**: `secondary-tokens:manage`, `secondary-tokens:read`

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`

---

## 2. ENDPOINTS

### 2.1 Create New Version

#### Endpoint
```
POST /secondary-tokens/{tokenId}/versions
```

#### Description
Create a new version of a secondary token. If critical change type, VVB validation required before activation.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | UUID | Yes | Secondary token ID |

#### Request Body

**Content-Type**: `application/json`

```json
{
  "parentTokenId": "uuid",
  "tokenType": "INCOME_STREAM|COLLATERAL|ROYALTY",
  "faceValue": "100.50",
  "owner": "owner@example.com",
  "content": {
    "description": "Ownership document",
    "metadata": {
      "year": 2025,
      "taxId": "12-3456789"
    }
  },
  "changeType": "CRITICAL|INFORMATIONAL|METADATA"
}
```

#### Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "entity": {
    "versionId": "uuid",
    "secondaryTokenId": "uuid",
    "versionNumber": 1,
    "status": "CREATED|PENDING_VVB|APPROVED|ACTIVE|REJECTED",
    "tokenType": "INCOME_STREAM",
    "owner": "owner@example.com",
    "faceValue": "100.50",
    "changeType": "CRITICAL",
    "createdAt": "2025-02-10T14:30:00Z",
    "merkleHash": "0x123abc...",
    "vvbStatus": "PENDING",
    "vvbApprovedAt": null
  },
  "timestamp": 1676027400000
}
```

#### Error Responses

**400 Bad Request**: Invalid input
```json
{
  "error": "Invalid parentTokenId: must be UUID format",
  "timestamp": 1676027400000
}
```

**404 Not Found**: Token not found
```json
{
  "error": "Secondary token not found: invalid-token-id",
  "timestamp": 1676027400000
}
```

**409 Conflict**: Parent token is retired
```json
{
  "error": "Cannot create version: parent primary token is retired",
  "timestamp": 1676027400000
}
```

#### Performance
- **P50**: 15ms
- **P99**: 50ms
- **Timeout**: 5s

#### Example Request
```bash
curl -X POST http://localhost:9003/api/v12/secondary-tokens/abc-123/versions \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "parentTokenId": "def-456",
    "tokenType": "OWNERSHIP",
    "owner": "jane@example.com",
    "content": {"metadata": {"year": 2025}}
  }'
```

---

### 2.2 List All Versions

#### Endpoint
```
GET /secondary-tokens/{tokenId}/versions
```

#### Description
Retrieve all versions of a secondary token, ordered by version number (ascending).

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | UUID | Yes | Secondary token ID |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | STRING | - | Filter by status (CREATED, ACTIVE, REPLACED, ARCHIVED) |
| `skip` | INT | 0 | Number of results to skip (pagination) |
| `limit` | INT | 100 | Max results to return (1-1000) |
| `sort` | STRING | `version_asc` | Sort order (version_asc, version_desc, created_asc, created_desc) |

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "entity": {
    "tokenId": "abc-123",
    "versions": [
      {
        "versionId": "uuid",
        "versionNumber": 1,
        "status": "REPLACED",
        "owner": "john@example.com",
        "createdAt": "2025-01-15T10:00:00Z",
        "replacedAt": "2025-02-10T14:30:00Z",
        "merkleHash": "0x123abc...",
        "vvbStatus": "APPROVED"
      },
      {
        "versionId": "uuid",
        "versionNumber": 2,
        "status": "ACTIVE",
        "owner": "jane@example.com",
        "createdAt": "2025-02-10T14:30:00Z",
        "merkleHash": "0x456def...",
        "vvbStatus": "APPROVED"
      }
    ],
    "count": 2,
    "total": 5,
    "skip": 0,
    "limit": 100
  },
  "timestamp": 1676027400000
}
```

#### Error Responses

**404 Not Found**: Token not found
```json
{
  "error": "Secondary token not found: abc-123",
  "timestamp": 1676027400000
}
```

**400 Bad Request**: Invalid query parameter
```json
{
  "error": "Invalid status filter: unknown_status",
  "timestamp": 1676027400000
}
```

#### Performance
- **P50**: 5ms
- **P99**: 20ms (with index)

#### Example Request
```bash
curl "http://localhost:9003/api/v12/secondary-tokens/abc-123/versions?status=ACTIVE&limit=50" \
  -H "Authorization: Bearer token"
```

---

### 2.3 Get Specific Version

#### Endpoint
```
GET /secondary-tokens/{tokenId}/versions/{versionId}
```

#### Description
Retrieve details of a specific version including full content and audit trail.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | UUID | Yes | Secondary token ID |
| `versionId` | UUID | Yes | Version ID |

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "entity": {
    "versionId": "uuid",
    "secondaryTokenId": "abc-123",
    "versionNumber": 2,
    "status": "ACTIVE",
    "tokenType": "INCOME_STREAM",
    "owner": "jane@example.com",
    "faceValue": "150.00",
    "content": {
      "description": "Ownership transfer",
      "metadata": {
        "year": 2025,
        "transferReason": "inheritance"
      }
    },
    "createdBy": "admin@example.com",
    "createdAt": "2025-02-10T14:30:00Z",
    "replacedAt": null,
    "replacedBy": null,
    "merkleHash": "0x456def...",
    "vvbStatus": "APPROVED",
    "vvbApprovedAt": "2025-02-10T14:35:00Z",
    "vvbResultHash": "0x789ghi...",
    "merkleProof": {
      "version": "uuid",
      "index": 2,
      "siblings": [
        "0x123abc...",
        "0x456def..."
      ],
      "root": "0x789ghi..."
    }
  },
  "timestamp": 1676027400000
}
```

#### Error Responses

**404 Not Found**: Version not found
```json
{
  "error": "Version not found: invalid-version-id",
  "timestamp": 1676027400000
}
```

#### Performance
- **P50**: 3ms
- **P99**: 10ms (cache hit)

---

### 2.4 Replace Version

#### Endpoint
```
POST /secondary-tokens/{tokenId}/versions/{versionId}/replace
```

#### Description
Create a new version to replace the current active version. Critical changes require VVB validation.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | UUID | Yes | Secondary token ID |
| `versionId` | UUID | Yes | Version ID to replace |

#### Request Body

```json
{
  "newContent": {
    "description": "Updated ownership",
    "metadata": {
      "year": 2025,
      "owner": "bob@example.com"
    }
  },
  "changeType": "CRITICAL",
  "reason": "Inheritance transfer approved"
}
```

#### Response

**Status Code**: `202 Accepted` (for CRITICAL with VVB) or `200 OK` (for INFORMATIONAL)

```json
{
  "success": true,
  "entity": {
    "previousVersion": {
      "versionNumber": 2,
      "status": "REPLACED",
      "owner": "jane@example.com"
    },
    "newVersion": {
      "versionId": "uuid",
      "versionNumber": 3,
      "status": "PENDING_VVB",
      "owner": "bob@example.com",
      "createdAt": "2025-02-15T10:00:00Z",
      "vvbStatus": "PENDING"
    },
    "message": "Version replacement submitted for VVB approval. Check audit trail for status updates."
  },
  "timestamp": 1676027400000
}
```

#### Webhook Callback (After VVB Approval)

When VVB approves, the following happens automatically:
1. New version status transitions to ACTIVE
2. Old version status transitions to REPLACED
3. Audit trail events created
4. Merkle proof updated
5. Optional webhook sent to configured endpoint:

```json
{
  "event": "version.replacement.approved",
  "tokenId": "abc-123",
  "previousVersionId": "uuid",
  "newVersionId": "uuid",
  "vvbApprovalHash": "0x789ghi...",
  "timestamp": "2025-02-15T10:05:00Z"
}
```

#### Error Responses

**409 Conflict**: Not the active version
```json
{
  "error": "Can only replace the active version. Active version is: new-version-id",
  "timestamp": 1676027400000
}
```

**503 Service Unavailable**: VVB validator unavailable
```json
{
  "error": "VVB validation service unavailable. Request queued for retry.",
  "timestamp": 1676027400000,
  "retryAfter": 60
}
```

#### Performance
- **P50**: 20ms (INFORMATIONAL)
- **P99**: 50ms (CRITICAL with VVB submission)

---

### 2.5 Archive Version

#### Endpoint
```
POST /secondary-tokens/{tokenId}/versions/{versionId}/archive
```

#### Description
Mark a version as archived (moved to cold storage after retention period).

#### Request Body

```json
{
  "reason": "Retention policy: 7 years exceeded"
}
```

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "entity": {
    "versionId": "uuid",
    "versionNumber": 1,
    "status": "ARCHIVED",
    "archivedAt": "2025-12-23T10:00:00Z",
    "archivedTo": "s3://cold-storage/aurigraph/archived/...",
    "archiveHash": "0x123abc..."
  },
  "timestamp": 1676027400000
}
```

#### Error Responses

**400 Bad Request**: Cannot archive active version
```json
{
  "error": "Cannot archive active version. Archive only replaced or expired versions.",
  "timestamp": 1676027400000
}
```

#### Performance
- **P50**: 100ms (local), 5-10s (cold storage)
- **P99**: 200ms (local), 30s (cold storage)

---

### 2.6 Get Audit Trail

#### Endpoint
```
GET /secondary-tokens/{tokenId}/audit-trail
```

#### Description
Retrieve complete audit trail for a secondary token and all its versions.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | ISO8601 | - | Start of date range (inclusive) |
| `endDate` | ISO8601 | - | End of date range (inclusive) |
| `actor` | STRING | - | Filter by actor (user who made change) |
| `eventType` | STRING | - | Filter by event type |
| `skip` | INT | 0 | Pagination offset |
| `limit` | INT | 1000 | Max results (1-10000) |

#### Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "entity": {
    "tokenId": "abc-123",
    "events": [
      {
        "eventId": "uuid",
        "versionId": "uuid",
        "eventType": "VERSION_CREATED",
        "actor": "admin@example.com",
        "timestamp": "2025-01-15T10:00:00Z",
        "fromState": null,
        "toState": "CREATED",
        "reason": "Initial ownership document",
        "metadata": {
          "versionNumber": 1,
          "content_hash": "0x123abc..."
        },
        "eventHash": "0x456def..."
      },
      {
        "eventId": "uuid",
        "versionId": "uuid",
        "eventType": "VVB_APPROVED",
        "actor": "vvb_validator@aurigraph.io",
        "timestamp": "2025-01-15T10:30:00Z",
        "fromState": "PENDING_VVB",
        "toState": "ACTIVE",
        "reason": "Ownership verified",
        "metadata": {
          "vvb_approval_hash": "0x789ghi...",
          "merkle_root_before": "0x...",
          "merkle_root_after": "0x..."
        },
        "eventHash": "0x321cba..."
      }
    ],
    "count": 2,
    "total": 25,
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T23:59:59Z"
  },
  "timestamp": 1676027400000
}
```

#### Audit Event Types
- `VERSION_CREATED`: New version created
- `VERSION_ACTIVATED`: Version became active
- `VERSION_REPLACED`: Version was replaced by newer
- `VERSION_ARCHIVED`: Version archived
- `VVB_SUBMITTED`: Submitted to VVB validator
- `VVB_APPROVED`: VVB approval received
- `VVB_REJECTED`: VVB rejection received
- `VVB_TIMEOUT`: VVB validation timed out

#### Performance
- **P50**: 30ms (recent events, cached)
- **P99**: 100ms (full range scan)
- **For 10k events**: <1s

#### Example Request
```bash
curl "http://localhost:9003/api/v12/secondary-tokens/abc-123/audit-trail?startDate=2025-01-01&endDate=2025-02-28&eventType=VVB_APPROVED" \
  -H "Authorization: Bearer token"
```

---

### 2.7 Generate Compliance Report

#### Endpoint
```
GET /secondary-tokens/{tokenId}/audit-trail/report
```

#### Description
Generate compliance report in multiple formats (PDF, CSV, JSON) with full audit trail.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | STRING | `json` | Report format: pdf, csv, json |
| `startDate` | ISO8601 | - | Range start |
| `endDate` | ISO8601 | - | Range end |
| `includeArchived` | BOOLEAN | true | Include archived versions |
| `includeMetadata` | BOOLEAN | true | Include full metadata |

#### Response

**For JSON Format (Status 200)**:
```json
{
  "success": true,
  "entity": {
    "report": {
      "tokenId": "abc-123",
      "generatedAt": "2025-02-23T14:30:00Z",
      "period": {
        "startDate": "2025-01-01",
        "endDate": "2025-12-31"
      },
      "summary": {
        "totalVersions": 5,
        "activeSince": "2025-02-10T14:30:00Z",
        "lastModified": "2025-02-15T10:00:00Z",
        "vvbApprovalsRequired": 3,
        "vvbApprovalsReceived": 3,
        "vvbRejections": 0
      },
      "versions": [
        {
          "versionNumber": 1,
          "owner": "john@example.com",
          "createdDate": "2025-01-15",
          "replacedDate": "2025-02-10",
          "vvbApprovalDate": "2025-01-15",
          "status": "REPLACED"
        },
        // ... more versions
      ],
      "audit_events": [
        // ... full audit trail
      ]
    },
    "format": "json",
    "signature": "0x123abc...signature"
  },
  "timestamp": 1676027400000
}
```

**For CSV Format (Status 200)**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit-trail-abc-123.csv"

Version,Owner,CreatedDate,ReplacedDate,VVBApprovalDate,Status
1,john@example.com,2025-01-15,2025-02-10,2025-01-15,REPLACED
2,jane@example.com,2025-02-10,,2025-02-10,ACTIVE
3,bob@example.com,2025-02-15,,PENDING,PENDING_VVB
```

**For PDF Format (Status 200)**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="audit-trail-abc-123.pdf"

[PDF binary content]
- Ownership history
- Audit trail timeline
- VVB approval proofs
- Digital signature
```

#### Error Responses

**414 Unsupported Media Type**: Invalid format
```json
{
  "error": "Unsupported report format: xml. Supported: pdf, csv, json",
  "timestamp": 1676027400000
}
```

#### Performance
- **JSON**: <100ms
- **CSV**: <200ms (up to 10k rows)
- **PDF**: <5s (with formatting)

#### Example Requests
```bash
# JSON export
curl "http://localhost:9003/api/v12/secondary-tokens/abc-123/audit-trail/report?format=json" \
  -H "Authorization: Bearer token" > audit.json

# PDF export
curl "http://localhost:9003/api/v12/secondary-tokens/abc-123/audit-trail/report?format=pdf" \
  -H "Authorization: Bearer token" > audit.pdf

# CSV export for tax purposes
curl "http://localhost:9003/api/v12/secondary-tokens/abc-123/audit-trail/report?format=csv&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer token" > tax-report-2025.csv
```

---

## 3. DATA MODELS

### VersionResponse
```json
{
  "versionId": "uuid",
  "secondaryTokenId": "uuid",
  "versionNumber": 1,
  "status": "CREATED|PENDING_VVB|APPROVED|ACTIVE|REPLACED|ARCHIVED|REJECTED",
  "tokenType": "INCOME_STREAM|COLLATERAL|ROYALTY",
  "owner": "owner@example.com",
  "faceValue": "100.50",
  "content": {...},
  "createdBy": "admin@example.com",
  "createdAt": "2025-01-15T10:00:00Z",
  "replacedAt": "2025-02-10T14:30:00Z",
  "replacedBy": "uuid",
  "merkleHash": "0x123abc...",
  "vvbStatus": "PENDING|APPROVED|REJECTED|TIMEOUT",
  "vvbApprovedAt": "2025-01-15T10:30:00Z",
  "vvbResultHash": "0x789ghi..."
}
```

### AuditEventResponse
```json
{
  "eventId": "uuid",
  "secondaryTokenId": "uuid",
  "versionId": "uuid",
  "eventType": "VERSION_CREATED|VERSION_ACTIVATED|VERSION_REPLACED|VVB_APPROVED|...",
  "actor": "user@example.com",
  "timestamp": "2025-01-15T10:00:00Z",
  "fromState": "CREATED",
  "toState": "ACTIVE",
  "reason": "Ownership transfer approved",
  "metadata": {
    "versionNumber": 1,
    "content_hash": "0x123abc..."
  },
  "eventHash": "0x456def..."
}
```

### MerkleProofResponse
```json
{
  "versionId": "uuid",
  "versionNumber": 1,
  "tokenHash": "0x123abc...",
  "siblings": [
    "0x456def...",
    "0x789ghi..."
  ],
  "root": "0x000aaa...",
  "proof": {
    "path": [1, 0, 1],
    "hash": "0x123abc..."
  }
}
```

---

## 4. HTTP STATUS CODES

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, POST with INFORMATIONAL change |
| 201 | Created | Successful version creation |
| 202 | Accepted | Async VVB validation submitted |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Cannot replace non-active version, state conflict |
| 422 | Unprocessable | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unexpected server error |
| 503 | Service Unavailable | VVB validator down, database unavailable |

---

## 5. ERROR HANDLING

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid parentTokenId: must be UUID format",
    "details": {
      "field": "parentTokenId",
      "value": "invalid-123",
      "constraint": "UUID"
    }
  },
  "timestamp": 1676027400000,
  "requestId": "req-12345678"
}
```

### Error Codes
- `INVALID_INPUT`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Business logic conflict
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Authorization failed
- `UNAVAILABLE`: Service dependency unavailable
- `INTERNAL_ERROR`: Unexpected server error

---

## 6. RATE LIMITING

### Limits
- **Unauthenticated**: 10 requests/minute per IP
- **Authenticated**: 1000 requests/minute per user
- **Burst**: 100 requests/second (5-second window)

### Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1676027400
```

---

## 7. PAGINATION

### Query Parameters
```
skip=0&limit=100&sort=created_desc
```

### Response
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "skip": 0,
    "limit": 100,
    "pages": 3,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 8. VERSIONING

### API Version Strategy
- **URL Versioning**: `/api/v12` (current version)
- **Breaking Changes**: New version `/api/v13`
- **Backward Compatibility**: Minimum 2 versions supported
- **Deprecation**: 6-month notice before version removal

---

## 9. SECURITY

### Authentication
- JWT Bearer tokens
- Token expiration: 24 hours
- Refresh tokens: 30 days

### Encryption
- In-transit: TLS 1.3
- At-rest: AES-256 (sensitive data)
- Audit logs: Not encrypted (compliance requirement)

### Data Validation
- All inputs validated against schema
- XSS prevention: HTML escaping
- SQL injection: Parameterized queries
- CSRF: Token-based validation

---

## 10. MONITORING & OBSERVABILITY

### Metrics Exported
- `api.request.duration` (histogram, ms)
- `api.request.count` (counter)
- `api.error.count` (counter by error code)
- `vvb.validation.duration` (histogram)
- `audit.event.count` (counter)
- `version.creation.duration` (histogram)

### Logging
- All requests: `DEBUG` level
- Errors: `ERROR` level
- Important events: `INFO` level
- Performance: `WARN` if >P99 threshold

---

## 11. OPENAPI SPECIFICATION

See OpenAPI/Swagger file: `openapi-v12-secondary-tokens.yaml`

### Swagger UI
- **URL**: `http://localhost:9003/swagger-ui`
- **OpenAPI JSON**: `http://localhost:9003/openapi.json`

### Client Code Generation
```bash
# Generate Java client
openapi-generator generate -i openapi-v12-secondary-tokens.yaml -g java -o client/

# Generate TypeScript client
openapi-generator generate -i openapi-v12-secondary-tokens.yaml -g typescript -o client-ts/
```

---

## 12. INTEGRATION EXAMPLES

### Python Example
```python
import requests
import json

API_BASE = "http://localhost:9003/api/v12"
TOKEN = "your-jwt-token"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Create new version
response = requests.post(
    f"{API_BASE}/secondary-tokens/abc-123/versions",
    headers=headers,
    json={
        "owner": "jane@example.com",
        "content": {"metadata": {"year": 2025}}
    }
)

version = response.json()["entity"]
print(f"Created version {version['versionNumber']}: {version['versionId']}")

# Get audit trail
response = requests.get(
    f"{API_BASE}/secondary-tokens/abc-123/audit-trail?format=json",
    headers=headers
)

audit_trail = response.json()["entity"]
print(f"Audit trail has {audit_trail['count']} events")
```

### cURL Examples
```bash
# Create version
curl -X POST http://localhost:9003/api/v12/secondary-tokens/abc-123/versions \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"owner": "jane@example.com", "content": {}}'

# Get versions
curl http://localhost:9003/api/v12/secondary-tokens/abc-123/versions \
  -H "Authorization: Bearer token"

# Replace version
curl -X POST http://localhost:9003/api/v12/secondary-tokens/abc-123/versions/def-456/replace \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"newContent": {}, "changeType": "CRITICAL"}'

# Get audit trail (PDF)
curl http://localhost:9003/api/v12/secondary-tokens/abc-123/audit-trail/report?format=pdf \
  -H "Authorization: Bearer token" \
  -o audit.pdf
```

---

This API specification is production-ready and fully documents all versioning operations, error handling, performance targets, and security requirements.

