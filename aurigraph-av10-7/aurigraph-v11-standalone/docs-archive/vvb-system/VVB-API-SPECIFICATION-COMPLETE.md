# VVB API Specification - Complete Reference
## Story AV11-601-05: Virtual Validator Board Multi-Signature Approval System

**Version**: 1.0
**Sprint**: Dec 24-29, 2025
**Status**: Architecture Planning
**Last Updated**: December 23, 2025

---

## 1. API OVERVIEW

### 1.1 Base URL

```
Development: http://localhost:9003/api/v12/vvb
Staging: https://staging.dlt.aurigraph.io/api/v12/vvb
Production: https://dlt.aurigraph.io/api/v12/vvb
```

### 1.2 Authentication

All endpoints require Bearer token authentication via Keycloak/OAuth2:

```
Authorization: Bearer <JWT_TOKEN>

JWT Token Claims:
├─ sub: User ID (required)
├─ preferred_username: Username (required)
├─ email: User email (optional)
├─ roles: Array of roles
│  └─ Examples: ["VVB_VALIDATOR", "VVB_ADMIN", "ADMIN"]
└─ realm_access: Keycloak realm roles
```

### 1.3 Content Types

```
Request: application/json
Response: application/json
Charset: UTF-8
```

### 1.4 Rate Limiting

```
Rate Limit: 1,000 requests per minute per user
Headers:
├─ X-RateLimit-Limit: 1000
├─ X-RateLimit-Remaining: 999
└─ X-RateLimit-Reset: 1705334400

Exceeded: Return 429 Too Many Requests
Retry-After: <seconds-until-reset>
```

### 1.5 Error Response Format

```json
{
    "error": {
        "code": "INVALID_REQUEST",
        "message": "Detailed error message",
        "timestamp": "2025-01-15T10:30:00Z",
        "traceId": "req-abc123def456",
        "path": "/api/v12/vvb/validate"
    }
}
```

---

## 2. ENDPOINT SPECIFICATIONS

### ENDPOINT 1: Submit for Validation

```
POST /api/v12/vvb/validate
```

**Purpose**: Submit a token version for VVB approval

**Authentication**: Required (any authenticated user)

**Request**:

```json
{
    "changeType": "SECONDARY_TOKEN_CREATE",
    "description": "Create new fractional equity token for Property ABC",
    "submitterId": "user@aurigraph.io",
    "tokenData": {
        "tokenId": "secondary-tok-001",
        "parentTokenId": "primary-tok-001",
        "tokenType": "EQUITY_FRACTIONAL",
        "totalValue": 1000000,
        "fractionSize": 1000
    },
    "metadata": {
        "source": "web_portal",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
    }
}
```

**Request Field Descriptions**:

| Field | Type | Required | Length | Description |
|-------|------|----------|--------|---|
| changeType | string | Yes | 100 | Operation type (enum) |
| description | string | Yes | 1000 | Human-readable description |
| submitterId | string | Yes | 255 | Submitter identifier |
| tokenData | object | Yes | - | Payload for change |
| metadata | object | No | - | Optional audit metadata |

**Valid Change Types**:

```
SECONDARY_TOKEN_CREATE    → Approval Type: STANDARD (1 VVB_VALIDATOR)
SECONDARY_TOKEN_RETIRE    → Approval Type: ELEVATED (1 ADMIN + 1 VALIDATOR)
SECONDARY_TOKEN_SUSPEND   → Approval Type: ELEVATED
SECONDARY_TOKEN_REACTIVE  → Approval Type: STANDARD
PRIMARY_TOKEN_RETIRE      → Approval Type: CRITICAL (2 ADMIN + 1 VALIDATOR)
PRIMARY_TOKEN_BURN        → Approval Type: CRITICAL
COMPOSITE_TOKEN_CREATE    → Approval Type: ELEVATED
BRIDGE_CROSS_CHAIN        → Approval Type: CRITICAL
```

**Response** (202 Accepted):

```json
{
    "versionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING_VVB",
    "approvalType": "STANDARD",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "createdAt": "2025-01-15T10:30:00Z",
    "pendingApprovers": [
        "John_Smith"
    ],
    "requiredApprovers": [
        "John_Smith"
    ],
    "timeoutDeadline": "2025-01-22T10:30:00Z",
    "message": "Token submitted for VVB approval. Awaiting decision from 1 approver."
}
```

**Response Field Descriptions**:

| Field | Type | Description |
|-------|------|---|
| versionId | UUID | Unique ID for this version (used in other endpoints) |
| status | string | Current status (PENDING_VVB, APPROVED, REJECTED, TIMEOUT) |
| approvalType | string | Approval type from rule (STANDARD, ELEVATED, CRITICAL) |
| changeType | string | The change type submitted |
| createdAt | ISO8601 | Submission timestamp |
| pendingApprovers | array | Approvers who haven't voted yet |
| requiredApprovers | array | All approvers needed (role-based) |
| timeoutDeadline | ISO8601 | When approval expires (7 days by default) |
| message | string | Human-readable status message |

**Error Responses**:

```json
// 400 Bad Request - Invalid change type
{
    "error": {
        "code": "INVALID_CHANGE_TYPE",
        "message": "Change type 'INVALID_TYPE' not recognized",
        "validTypes": ["SECONDARY_TOKEN_CREATE", "..."]
    }
}

// 401 Unauthorized - Missing JWT
{
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Missing or invalid Authorization header"
    }
}

// 422 Unprocessable Entity - Parent token not found
{
    "error": {
        "code": "PARENT_TOKEN_NOT_FOUND",
        "message": "Primary token 'primary-tok-001' does not exist"
    }
}

// 409 Conflict - Token already has pending approval
{
    "error": {
        "code": "APPROVAL_ALREADY_PENDING",
        "message": "Token 'secondary-tok-001' already has pending approval (version: 550e8400-...)"
    }
}
```

**Performance**: <100ms (typical), <500ms (worst case with slow DB)

**Example with cURL**:

```bash
curl -X POST http://localhost:9003/api/v12/vvb/validate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "changeType": "SECONDARY_TOKEN_CREATE",
    "description": "Create fractional token",
    "submitterId": "user@aurigraph.io",
    "tokenData": {
      "tokenId": "secondary-001",
      "parentTokenId": "primary-001",
      "tokenType": "EQUITY_FRACTIONAL"
    }
  }'
```

---

### ENDPOINT 2: Approve Token Version

```
POST /api/v12/vvb/{versionId}/approve
```

**Purpose**: Vote to approve a pending token version

**Authentication**: Required (VVB_VALIDATOR or VVB_ADMIN role)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| versionId | UUID | Yes | Version ID from validation response |

**Request**:

```json
{
    "approverId": "John_Smith",
    "comments": "Compliance check passed. All requirements met.",
    "signature": "BASE64_ENCODED_SIGNATURE"
}
```

**Request Field Descriptions**:

| Field | Type | Required | Length | Description |
|-------|------|----------|--------|---|
| approverId | string | Yes | 255 | Approver identifier (must match validator name) |
| comments | string | No | 1000 | Optional approval comment |
| signature | string | No | 4KB | Cryptographic signature (future) |

**Response** (200 OK):

```json
{
    "versionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "APPROVED",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "approvalType": "STANDARD",
    "consensusReached": true,
    "consensusType": "UNANIMOUS",
    "receivedApprovals": 1,
    "requiredApprovals": 1,
    "votes": [
        {
            "approverId": "John_Smith",
            "decision": "APPROVED",
            "comments": "Compliance check passed...",
            "approvedAt": "2025-01-15T10:32:00Z"
        }
    ],
    "message": "All required approvals received. Token will be activated.",
    "affectedTokens": ["secondary-tok-001"],
    "activationTime": "2025-01-15T10:32:05Z"
}
```

**Response Field Descriptions**:

| Field | Type | Description |
|-------|------|---|
| status | string | Current status (should be APPROVED if consensus reached) |
| consensusReached | boolean | Whether quorum has been reached |
| consensusType | string | Type of consensus (UNANIMOUS, MAJORITY, SUPERMAJORITY) |
| receivedApprovals | integer | Number of approvals received so far |
| requiredApprovals | integer | Total approvals needed |
| votes | array | All votes recorded so far |
| affectedTokens | array | Tokens affected by approval (will be activated) |
| activationTime | ISO8601 | When token will be activated (if approved) |

**Error Responses**:

```json
// 404 Not Found - Version doesn't exist
{
    "error": {
        "code": "VERSION_NOT_FOUND",
        "message": "Version '550e8400-...' does not exist"
    }
}

// 409 Conflict - Version already decided
{
    "error": {
        "code": "APPROVAL_ALREADY_DECIDED",
        "message": "Version already has status 'APPROVED'. Cannot modify."
    }
}

// 403 Forbidden - Approver unauthorized
{
    "error": {
        "code": "UNAUTHORIZED_APPROVER",
        "message": "Approver 'unknown_user' not found or not authorized for this approval type"
    }
}

// 409 Conflict - Duplicate vote
{
    "error": {
        "code": "ALREADY_VOTED",
        "message": "Approver 'John_Smith' already voted on this version"
    }
}

// 410 Gone - Approval timed out
{
    "error": {
        "code": "APPROVAL_TIMED_OUT",
        "message": "Approval deadline passed (2025-01-22T10:30:00Z)"
    }
}
```

**Performance**: <50ms (typical), <100ms (with cascade events)

**Example with cURL**:

```bash
curl -X POST http://localhost:9003/api/v12/vvb/550e8400-e29b-41d4-a716-446655440000/approve \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approverId": "John_Smith",
    "comments": "Approved after compliance review"
  }'
```

---

### ENDPOINT 3: Reject Token Version

```
POST /api/v12/vvb/{versionId}/reject
```

**Purpose**: Vote to reject a pending token version (triggers cascade)

**Authentication**: Required (VVB_VALIDATOR or VVB_ADMIN role)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| versionId | UUID | Yes | Version ID from validation response |

**Request**:

```json
{
    "approverId": "John_Smith",
    "reason": "Security: Token exceeds risk threshold for single holder",
    "severity": "ERROR",
    "recommendedAction": "Reduce token value or add co-signers"
}
```

**Request Field Descriptions**:

| Field | Type | Required | Length | Description |
|-------|------|----------|--------|---|
| approverId | string | Yes | 255 | Rejecting approver identifier |
| reason | string | Yes | 1000 | Reason for rejection (required) |
| severity | string | No | 20 | Error severity (ERROR, CRITICAL) |
| recommendedAction | string | No | 500 | Recommended remediation |

**Response** (200 OK):

```json
{
    "versionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "REJECTED",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "rejectedBy": "John_Smith",
    "reason": "Security: Token exceeds risk threshold for single holder",
    "rejectedAt": "2025-01-15T10:35:00Z",
    "affectedTokens": [
        {
            "tokenId": "secondary-tok-001",
            "previousStatus": "PENDING_VVB",
            "newStatus": "REJECTED",
            "cascadeReason": "Parent rejection"
        },
        {
            "tokenId": "composite-tok-001",
            "previousStatus": "PENDING_VVB",
            "newStatus": "REJECTED",
            "cascadeReason": "Child dependency rejected"
        }
    ],
    "cascadeCount": 2,
    "message": "Token rejected. 2 dependent tokens cascaded to REJECTED status."
}
```

**Response Field Descriptions**:

| Field | Type | Description |
|-------|------|---|
| status | string | Should be REJECTED |
| rejectedBy | string | The approver who rejected |
| rejectedAt | ISO8601 | When rejection was recorded |
| affectedTokens | array | Tokens affected by cascade |
| cascadeCount | integer | How many tokens were cascaded |

**Cascade Behavior**:

When a token is rejected:
1. Find all dependent tokens (children in token hierarchy)
2. Mark each child as REJECTED with cascade reason
3. Fire CascadeRejectionEvent for each child
4. Notify submitter of cascaded rejections
5. Log cascade events to vvb_timeline

**Error Responses**:

```json
// 400 Bad Request - Missing reason
{
    "error": {
        "code": "MISSING_REASON",
        "message": "Reason field is required for rejection"
    }
}

// 404 Not Found - Version doesn't exist
{
    "error": {
        "code": "VERSION_NOT_FOUND",
        "message": "Version '550e8400-...' does not exist"
    }
}

// 403 Forbidden - Not authorized to reject
{
    "error": {
        "code": "INSUFFICIENT_AUTHORITY",
        "message": "Approver role insufficient to reject CRITICAL approval"
    }
}

// 409 Conflict - Already decided
{
    "error": {
        "code": "APPROVAL_ALREADY_DECIDED",
        "message": "Cannot reject: version already has status 'APPROVED'"
    }
}
```

**Performance**: <50ms (vote recording), <500ms (cascade execution)

**Example with cURL**:

```bash
curl -X POST http://localhost:9003/api/v12/vvb/550e8400-e29b-41d4-a716-446655440000/reject \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approverId": "John_Smith",
    "reason": "Security compliance check failed"
  }'
```

---

### ENDPOINT 4: Get Approval Details

```
GET /api/v12/vvb/{versionId}/details
```

**Purpose**: Retrieve detailed approval status and voting history

**Authentication**: Required (any authenticated user)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| versionId | UUID | Yes | Version ID |

**Query Parameters**: None

**Response** (200 OK):

```json
{
    "versionId": "550e8400-e29b-41d4-a716-446655440000",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "status": "PENDING_VVB",
    "approvalType": "STANDARD",
    "submitterId": "user@aurigraph.io",
    "submittedAt": "2025-01-15T10:30:00Z",
    "deadline": "2025-01-22T10:30:00Z",
    "timeRemaining": "7d 0h",
    "progress": {
        "required": 1,
        "approved": 0,
        "rejected": 0,
        "pending": 1,
        "abstained": 0
    },
    "consensus": {
        "reached": false,
        "type": null,
        "reachableAt": "2025-01-15T10:32:00Z"
    },
    "requiredApprovers": [
        {
            "id": "John_Smith",
            "role": "VVB_VALIDATOR",
            "authority": "STANDARD",
            "status": "PENDING",
            "expectedAt": "2025-01-15T11:30:00Z"
        }
    ],
    "votes": [],
    "timeline": [
        {
            "eventId": "evt-001",
            "eventType": "SUBMITTED",
            "timestamp": "2025-01-15T10:30:00Z",
            "actor": "SYSTEM",
            "details": {
                "approval_type": "STANDARD",
                "required_count": 1
            }
        }
    ],
    "metadata": {
        "source": "web_portal",
        "ipAddress": "192.168.1.1"
    }
}
```

**Error Responses**:

```json
// 404 Not Found
{
    "error": {
        "code": "VERSION_NOT_FOUND",
        "message": "Version '550e8400-...' does not exist"
    }
}
```

**Performance**: <20ms

**Example with cURL**:

```bash
curl -X GET http://localhost:9003/api/v12/vvb/550e8400-e29b-41d4-a716-446655440000/details \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### ENDPOINT 5: List Pending Approvals

```
GET /api/v12/vvb/pending
```

**Purpose**: Get pending approvals for authenticated user

**Authentication**: Required (VVB_VALIDATOR or VVB_ADMIN)

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|---|
| page | integer | 0 | Page number (0-indexed) |
| limit | integer | 50 | Results per page (max 100) |
| sortBy | string | createdAt | Sort field (createdAt, deadline, type) |
| sortOrder | string | DESC | Sort order (ASC, DESC) |

**Response** (200 OK):

```json
{
    "data": [
        {
            "versionId": "550e8400-e29b-41d4-a716-446655440000",
            "changeType": "SECONDARY_TOKEN_CREATE",
            "approvalType": "STANDARD",
            "submitterId": "user1@aurigraph.io",
            "createdAt": "2025-01-15T10:30:00Z",
            "deadline": "2025-01-22T10:30:00Z",
            "daysRemaining": 7,
            "requiredApprovers": ["John_Smith"],
            "pendingApprovers": ["John_Smith"],
            "description": "Create new fractional equity token for Property ABC",
            "priority": "NORMAL"
        },
        {
            "versionId": "660f9511-f40c-42e5-b827-557766551111",
            "changeType": "PRIMARY_TOKEN_RETIRE",
            "approvalType": "CRITICAL",
            "submitterId": "user2@aurigraph.io",
            "createdAt": "2025-01-14T09:00:00Z",
            "deadline": "2025-01-21T09:00:00Z",
            "daysRemaining": 6,
            "requiredApprovers": ["Bob_Admin", "Carol_SuperAdmin", "John_Smith"],
            "pendingApprovers": ["Bob_Admin", "Carol_SuperAdmin", "John_Smith"],
            "description": "Retire primary token for completed project",
            "priority": "HIGH"
        }
    ],
    "pagination": {
        "page": 0,
        "limit": 50,
        "total": 2,
        "pages": 1
    }
}
```

**Performance**: <50ms

**Example with cURL**:

```bash
curl -X GET "http://localhost:9003/api/v12/vvb/pending?page=0&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### ENDPOINT 6: VVB Statistics

```
GET /api/v12/vvb/statistics
```

**Purpose**: Get approval statistics and metrics

**Authentication**: Required (any authenticated user)

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|---|
| startDate | ISO8601 | 30 days ago | Start of date range |
| endDate | ISO8601 | today | End of date range |
| approvalType | string | all | Filter by type (STANDARD, ELEVATED, CRITICAL, all) |

**Response** (200 OK):

```json
{
    "period": {
        "startDate": "2024-12-16T00:00:00Z",
        "endDate": "2025-01-15T23:59:59Z",
        "daysInPeriod": 31
    },
    "summary": {
        "totalSubmitted": 150,
        "totalApproved": 120,
        "totalRejected": 20,
        "totalPending": 10,
        "approvalRate": 85.7,
        "rejectionRate": 14.3,
        "pendingRate": 0.0
    },
    "byApprovalType": {
        "STANDARD": {
            "submitted": 80,
            "approved": 70,
            "rejected": 10,
            "approvalRate": 87.5
        },
        "ELEVATED": {
            "submitted": 50,
            "approved": 40,
            "rejected": 10,
            "approvalRate": 80.0
        },
        "CRITICAL": {
            "submitted": 20,
            "approved": 10,
            "rejected": 0,
            "approvalRate": 100.0
        }
    },
    "timingMetrics": {
        "averageApprovalTimeMinutes": 45.5,
        "minApprovalTimeMinutes": 2,
        "maxApprovalTimeMinutes": 120,
        "p50ApprovalTimeMinutes": 30,
        "p95ApprovalTimeMinutes": 95,
        "p99ApprovalTimeMinutes": 119
    },
    "topApprovers": [
        {
            "approverId": "John_Smith",
            "role": "VVB_VALIDATOR",
            "decisionsCount": 45,
            "averageResponseTimeMinutes": 35,
            "rejectionRate": 15.6
        },
        {
            "approverId": "Alice_Johnson",
            "role": "VVB_VALIDATOR",
            "decisionsCount": 42,
            "averageResponseTimeMinutes": 38,
            "rejectionRate": 14.3
        }
    ],
    "changeTypeBreakdown": {
        "SECONDARY_TOKEN_CREATE": {
            "count": 80,
            "approvalRate": 87.5
        },
        "SECONDARY_TOKEN_RETIRE": {
            "count": 40,
            "approvalRate": 80.0
        },
        "PRIMARY_TOKEN_RETIRE": {
            "count": 20,
            "approvalRate": 100.0
        }
    }
}
```

**Performance**: <100ms (cached, updated hourly)

**Example with cURL**:

```bash
curl -X GET "http://localhost:9003/api/v12/vvb/statistics?startDate=2024-12-16&endDate=2025-01-15" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### ENDPOINT 7: Retirement Validation

```
GET /api/v12/vvb/governance/retirement-validation
```

**Purpose**: Validate if primary token can retire

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| primaryTokenId | string | Yes | Primary token ID to check |

**Response** (200 OK):

```json
{
    "primaryTokenId": "primary-tok-001",
    "canRetire": false,
    "message": "Cannot retire: 2 active secondary tokens",
    "blockingTokens": [
        {
            "tokenId": "secondary-tok-001",
            "tokenType": "EQUITY_FRACTIONAL",
            "status": "ACTIVE",
            "createdAt": "2025-01-10T14:00:00Z",
            "holders": 5
        },
        {
            "tokenId": "secondary-tok-002",
            "tokenType": "DEBT_OBLIGATION",
            "status": "ACTIVE",
            "createdAt": "2025-01-11T15:00:00Z",
            "holders": 3
        }
    ],
    "recommendation": "Retire or redeem the above secondary tokens first",
    "governance": {
        "primaryStatus": "ACTIVE",
        "activeSecondaryCount": 2,
        "redeemableSecondaryCount": 0,
        "expiredSecondaryCount": 0
    }
}
```

**Response when retirement is allowed**:

```json
{
    "primaryTokenId": "primary-tok-001",
    "canRetire": true,
    "message": "Token is eligible for retirement",
    "blockingTokens": [],
    "governance": {
        "primaryStatus": "ACTIVE",
        "activeSecondaryCount": 0,
        "redeemableSecondaryCount": 2,
        "expiredSecondaryCount": 1
    }
}
```

**Error Responses**:

```json
// 404 Not Found - Token doesn't exist
{
    "error": {
        "code": "TOKEN_NOT_FOUND",
        "message": "Primary token 'primary-tok-001' does not exist"
    }
}
```

**Performance**: <5ms (indexed query)

**Example with cURL**:

```bash
curl -X GET "http://localhost:9003/api/v12/vvb/governance/retirement-validation?primaryTokenId=primary-tok-001" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### ENDPOINT 8: Get Blocking Tokens

```
GET /api/v12/vvb/governance/blocking-tokens
```

**Purpose**: Get list of child tokens preventing primary retirement

**Authentication**: Required

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|---|
| primaryTokenId | string | Yes | Primary token ID |
| includeDetails | boolean | No | Include detailed token info |

**Response** (200 OK):

```json
{
    "primaryTokenId": "primary-tok-001",
    "blockingTokenCount": 2,
    "blockingTokens": [
        "secondary-tok-001",
        "secondary-tok-002"
    ]
}
```

**Response with details**:

```json
{
    "primaryTokenId": "primary-tok-001",
    "blockingTokenCount": 2,
    "blockingTokens": [
        {
            "tokenId": "secondary-tok-001",
            "tokenType": "EQUITY_FRACTIONAL",
            "status": "ACTIVE",
            "totalHolders": 5,
            "totalSupply": 1000000,
            "createdAt": "2025-01-10T14:00:00Z"
        },
        {
            "tokenId": "secondary-tok-002",
            "tokenType": "DEBT_OBLIGATION",
            "status": "ACTIVE",
            "totalHolders": 3,
            "totalSupply": 500000,
            "createdAt": "2025-01-11T15:00:00Z"
        }
    ]
}
```

**Performance**: <5ms

**Example with cURL**:

```bash
curl -X GET "http://localhost:9003/api/v12/vvb/governance/blocking-tokens?primaryTokenId=primary-tok-001" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 3. OPENAPI/SWAGGER SPECIFICATION

### 3.1 OpenAPI 3.0 Spec Fragment

```yaml
openapi: 3.0.3
info:
  title: VVB Approval API
  version: 1.0.0
  description: Virtual Validator Board multi-signature approval system

servers:
  - url: https://dlt.aurigraph.io/api/v12/vvb
    description: Production
  - url: https://staging.dlt.aurigraph.io/api/v12/vvb
    description: Staging
  - url: http://localhost:9003/api/v12/vvb
    description: Development

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  /validate:
    post:
      summary: Submit token for VVB approval
      operationId: validateToken
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationRequest'
      responses:
        '202':
          description: Accepted for approval
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResponse'
        '400':
          description: Invalid request
        '401':
          description: Unauthorized
      security:
        - bearerAuth: []

  /{versionId}/approve:
    post:
      summary: Vote to approve
      operationId: approveVersion
      parameters:
        - name: versionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalRequest'
      responses:
        '200':
          description: Approval recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalResponse'
      security:
        - bearerAuth: []

  /{versionId}/reject:
    post:
      summary: Vote to reject
      operationId: rejectVersion
      parameters:
        - name: versionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RejectionRequest'
      responses:
        '200':
          description: Rejection recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RejectionResponse'
      security:
        - bearerAuth: []
```

---

## 4. RATE LIMITING

### 4.1 Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 1000        (requests per minute)
X-RateLimit-Remaining: 999     (remaining in current window)
X-RateLimit-Reset: 1705334400  (Unix timestamp when limit resets)
X-RateLimit-Retry-After: 30    (seconds to wait if limited)
```

### 4.2 429 Too Many Requests

When rate limit is exceeded:

```json
{
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Rate limit exceeded: 1000 requests per minute",
        "retryAfter": 30
    }
}
```

---

## 5. ERROR CODE REFERENCE

| Code | HTTP | Description |
|------|------|---|
| INVALID_REQUEST | 400 | Request body is malformed or missing required fields |
| INVALID_CHANGE_TYPE | 400 | Change type not recognized |
| MISSING_REASON | 400 | Rejection reason is required |
| INVALID_APPROVER | 400 | Approver ID format invalid |
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| INSUFFICIENT_AUTHORITY | 403 | User role insufficient for operation |
| UNAUTHORIZED_APPROVER | 403 | Approver not authorized for approval type |
| VERSION_NOT_FOUND | 404 | Specified version doesn't exist |
| TOKEN_NOT_FOUND | 404 | Specified token doesn't exist |
| APPROVAL_ALREADY_DECIDED | 409 | Version already approved/rejected |
| ALREADY_VOTED | 409 | Approver already voted on this version |
| APPROVAL_ALREADY_PENDING | 409 | Token already has pending approval |
| APPROVAL_TIMED_OUT | 410 | Approval deadline has passed |
| PARENT_TOKEN_NOT_FOUND | 422 | Parent token referenced in request doesn't exist |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |

---

## 6. INTEGRATION WITH CLIENT LIBRARIES

### 6.1 JavaScript/TypeScript (Example)

```typescript
import axios from 'axios';

const vvbClient = axios.create({
    baseURL: 'https://dlt.aurigraph.io/api/v12/vvb',
    headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
    }
});

// Submit for validation
const response = await vvbClient.post('/validate', {
    changeType: 'SECONDARY_TOKEN_CREATE',
    description: 'Create fractional token',
    submitterId: 'user@example.com',
    tokenData: { ... }
});

const versionId = response.data.versionId;

// Approve
const approvalResponse = await vvbClient.post(
    `/${versionId}/approve`,
    {
        approverId: 'John_Smith',
        comments: 'Approved'
    }
);

// Get details
const details = await vvbClient.get(`/${versionId}/details`);
```

### 6.2 Java/Quarkus (Example)

```java
@Path("/api/v12/vvb")
public class VVBClient {

    @Inject
    RestClient restClient;

    public ValidationResponse validate(ValidationRequest request) {
        return restClient
            .post("/validate", request, ValidationResponse.class)
            .await().indefinitely();
    }

    public ApprovalResponse approve(UUID versionId, ApprovalRequest request) {
        return restClient
            .post("/" + versionId + "/approve", request, ApprovalResponse.class)
            .await().indefinitely();
    }
}
```

---

## 7. RELATED DOCUMENTATION

- `VVB-ARCHITECTURE-FINAL-DESIGN.md` - System architecture
- `VVB-DATABASE-SCHEMA-DETAILED.md` - Database design
- `VVB-IMPLEMENTATION-CRITICAL-PATH.md` - Implementation timeline

---

**API Version**: 1.0
**Spec Date**: December 23, 2025
**Last Updated**: December 23, 2025
