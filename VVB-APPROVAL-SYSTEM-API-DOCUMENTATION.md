# VVB Approval System - API Documentation

**Version**: 1.0.0
**Base URL**: `https://dlt.aurigraph.io/api/v11`
**Authentication**: OAuth 2.0 Bearer Token + JWT
**Status**: Production Ready (Story 5-6)

---

## Overview

The VVB Approval System provides consensus-based approval workflow for secondary token operations. It implements a >2/3 validator consensus model with event-driven architecture for audit trail compliance.

**Key Features**:
- Real-time validator voting on token version changes
- Automatic consensus detection and execution
- Complete audit trail with event sourcing
- Performance optimization with caching and batch processing
- State machine validation for workflow integrity

---

## API Endpoints

### 1. Create Approval Request

**Endpoint**: `POST /approvals`

**Description**: Initiates a new approval request for a secondary token version change.

**Request Body**:
```json
{
  "versionId": "123e4567-e89b-12d3-a456-426614174000",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "description": "Create new derivative token backed by real-world asset",
  "totalValidators": 15,
  "expiryDeadline": "2025-12-31T23:59:59Z"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "versionId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "CREATED",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "description": "Create new derivative token backed by real-world asset",
  "totalValidators": 15,
  "approvedByCount": 0,
  "approvalThresholdPercentage": 66.67,
  "requiredApprovals": 11,
  "createdAt": "2025-12-24T05:00:00Z",
  "expiryDeadline": "2025-12-31T23:59:59Z",
  "approvers": []
}
```

**Status Codes**:
- `201 Created`: Approval request created successfully
- `400 Bad Request`: Invalid parameters
- `409 Conflict`: Version already has pending approval

---

### 2. Submit Validator Vote

**Endpoint**: `POST /approvals/{approvalId}/vote`

**Description**: Submit a validator's vote (APPROVE or REJECT) for an approval request.

**Path Parameters**:
- `approvalId` (UUID): The approval request ID

**Request Body**:
```json
{
  "validatorId": "validator-node-1",
  "choice": "APPROVE",
  "reason": "Version changes reviewed and meet requirements"
}
```

**Response** (200 OK):
```json
{
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "validatorId": "validator-node-1",
  "choice": "APPROVE",
  "timestamp": "2025-12-24T05:30:00Z",
  "consensusReached": false,
  "currentApprovals": 1,
  "requiredApprovals": 11
}
```

**Status Codes**:
- `200 OK`: Vote recorded successfully
- `400 Bad Request`: Invalid validator or choice
- `404 Not Found`: Approval not found
- `409 Conflict`: Voting window closed or validator already voted
- `410 Gone`: Voting deadline exceeded

---

### 3. Get Approval Status

**Endpoint**: `GET /approvals/{approvalId}`

**Description**: Retrieve current status and vote count for an approval request.

**Path Parameters**:
- `approvalId` (UUID): The approval request ID

**Query Parameters**:
- `includeVotes` (boolean, default: false): Include list of all votes
- `includeAudit` (boolean, default: false): Include audit trail

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "versionId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "IN_VOTING",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "description": "Create new derivative token",
  "totalValidators": 15,
  "approvedByCount": 8,
  "rejectedByCount": 0,
  "requiredApprovals": 11,
  "approvalThresholdPercentage": 66.67,
  "consensusReached": false,
  "createdAt": "2025-12-24T05:00:00Z",
  "expiryDeadline": "2025-12-31T23:59:59Z",
  "votes": [
    {
      "validatorId": "validator-node-1",
      "choice": "APPROVE",
      "timestamp": "2025-12-24T05:30:00Z"
    },
    {
      "validatorId": "validator-node-2",
      "choice": "APPROVE",
      "timestamp": "2025-12-24T05:31:00Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Approval status retrieved
- `404 Not Found`: Approval not found

---

### 4. Get Consensus Status

**Endpoint**: `GET /approvals/{approvalId}/consensus`

**Description**: Check if consensus has been reached and get consensus details.

**Path Parameters**:
- `approvalId` (UUID): The approval request ID

**Response** (200 OK - Consensus Reached):
```json
{
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "consensusReached": true,
  "approvalStatus": "CONSENSUS_REACHED",
  "totalApprovals": 11,
  "totalRejections": 0,
  "requiredApprovals": 11,
  "consensusPercentage": 100.0,
  "consensusReachedAt": "2025-12-24T06:00:00Z",
  "result": {
    "decision": "APPROVED",
    "confidenceScore": 0.987,
    "executionRecommendation": "EXECUTE_IMMEDIATELY"
  }
}
```

**Response** (200 OK - Voting In Progress):
```json
{
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "consensusReached": false,
  "approvalStatus": "IN_VOTING",
  "totalApprovals": 8,
  "totalRejections": 0,
  "requiredApprovals": 11,
  "currentPercentage": 53.3,
  "timeRemaining": "6 days 18 hours",
  "result": null
}
```

**Status Codes**:
- `200 OK`: Consensus status retrieved
- `404 Not Found`: Approval not found

---

### 5. Execute Approval

**Endpoint**: `POST /approvals/{approvalId}/execute`

**Description**: Execute the approved token version change. Only available after consensus is reached.

**Path Parameters**:
- `approvalId` (UUID): The approval request ID

**Request Body**:
```json
{
  "executedBy": "system-admin",
  "executionNotes": "Automated execution after consensus"
}
```

**Response** (200 OK):
```json
{
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "versionId": "123e4567-e89b-12d3-a456-426614174000",
  "executionStatus": "EXECUTED",
  "executedBy": "system-admin",
  "executedAt": "2025-12-24T07:00:00Z",
  "transactionHash": "0x1234567890abcdef...",
  "blockNumber": 1234567
}
```

**Status Codes**:
- `200 OK`: Approval executed successfully
- `400 Bad Request`: Cannot execute - consensus not reached
- `404 Not Found`: Approval not found
- `409 Conflict`: Already executed or rejected

---

### 6. List Approvals

**Endpoint**: `GET /approvals`

**Description**: List all approval requests with optional filtering.

**Query Parameters**:
- `status` (string): Filter by status (CREATED, IN_VOTING, CONSENSUS_REACHED, EXECUTED, REJECTED)
- `versionId` (UUID): Filter by token version
- `page` (integer, default: 1): Page number
- `pageSize` (integer, default: 20): Items per page
- `sortBy` (string, default: createdAt): Sort field (createdAt, status, approvedByCount)
- `sortOrder` (string, default: DESC): Sort order (ASC, DESC)

**Response** (200 OK):
```json
{
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "approvals": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "versionId": "123e4567-e89b-12d3-a456-426614174000",
      "status": "EXECUTED",
      "changeType": "SECONDARY_TOKEN_CREATE",
      "approvedByCount": 11,
      "totalValidators": 15,
      "createdAt": "2025-12-24T05:00:00Z",
      "executedAt": "2025-12-24T07:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Approvals list retrieved
- `400 Bad Request`: Invalid filter parameters

---

### 7. Get Approval Audit Trail

**Endpoint**: `GET /approvals/{approvalId}/audit`

**Description**: Retrieve complete audit trail for an approval request with all events.

**Path Parameters**:
- `approvalId` (UUID): The approval request ID

**Response** (200 OK):
```json
{
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "auditTrail": [
    {
      "timestamp": "2025-12-24T05:00:00Z",
      "eventType": "APPROVAL_REQUEST_CREATED",
      "actor": "system",
      "description": "Approval request created for version change"
    },
    {
      "timestamp": "2025-12-24T05:30:00Z",
      "eventType": "VOTE_SUBMITTED",
      "actor": "validator-node-1",
      "description": "APPROVE vote submitted",
      "voteChoice": "APPROVE"
    },
    {
      "timestamp": "2025-12-24T06:00:00Z",
      "eventType": "CONSENSUS_REACHED",
      "actor": "system",
      "description": "Consensus reached with 11/11 approvals"
    },
    {
      "timestamp": "2025-12-24T07:00:00Z",
      "eventType": "APPROVAL_EXECUTED",
      "actor": "system-admin",
      "description": "Approval executed successfully"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Audit trail retrieved
- `404 Not Found`: Approval not found

---

## Data Models

### ApprovalStatus Enum
```
CREATED          - Initial state, waiting for voting to begin
IN_VOTING        - Validators can submit votes
CONSENSUS_REACHED - Threshold met, ready for execution
EXECUTED         - Terminal state, changes applied
REJECTED         - Terminal state, approval denied
```

### ChangeType Enum
```
SECONDARY_TOKEN_CREATE     - Create new secondary token
SECONDARY_TOKEN_RETIRE     - Retire secondary token
SECONDARY_TOKEN_MODIFY     - Modify existing secondary token
PRIMARY_TOKEN_RETIRE       - Retire primary token
COMPOSITE_TOKEN_RESTRUCTURE - Restructure composite token
```

### VoteChoice Enum
```
APPROVE  - Validator approves the change
REJECT   - Validator rejects the change
ABSTAIN  - Validator abstains from voting
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message",
    "timestamp": "2025-12-24T05:00:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `APPROVAL_NOT_FOUND` | 404 | Approval ID does not exist |
| `INVALID_STATE_TRANSITION` | 409 | State transition is not valid |
| `VOTING_WINDOW_CLOSED` | 410 | Voting deadline has expired |
| `DUPLICATE_VOTE` | 409 | Validator has already voted |
| `THRESHOLD_NOT_MET` | 400 | Consensus threshold not met for execution |
| `INVALID_VOTE_CHOICE` | 400 | Vote choice is not valid (APPROVE/REJECT) |
| `UNAUTHORIZED` | 401 | Authentication token missing or invalid |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |

---

## Authentication

All endpoints require OAuth 2.0 Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required Scopes
- `approve:read` - Read approval status
- `approve:vote` - Submit validator votes
- `approve:execute` - Execute approvals

---

## Rate Limiting

Rate limits per authenticated user:

- **Standard**: 1000 requests/hour
- **Vote Submission**: 100 votes/hour
- **Approval Creation**: 50 approvals/hour

**Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1703396400
```

---

## Consensus Calculation

Consensus is reached when:

**Approval Count** ≥ **⌈(2/3 × Total Validators) + 0.01⌉**

### Examples

| Total Validators | Required Approvals | Percentage |
|------------------|-------------------|-----------|
| 3 | 3 | 100% |
| 5 | 4 | 80% |
| 15 | 11 | 73.3% |
| 21 | 15 | 71.4% |
| 100 | 67 | 67% |

---

## Webhooks (Optional)

Subscribe to approval events:

```json
POST /approvals/webhooks
{
  "url": "https://your-system.com/webhook",
  "events": ["CONSENSUS_REACHED", "APPROVAL_EXECUTED"],
  "retryPolicy": "EXPONENTIAL_BACKOFF"
}
```

**Webhook Payload**:
```json
{
  "event": "CONSENSUS_REACHED",
  "timestamp": "2025-12-24T06:00:00Z",
  "approvalId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "consensusReachedAt": "2025-12-24T06:00:00Z",
    "totalApprovals": 11,
    "requiredApprovals": 11
  }
}
```

---

## Performance Metrics

The VVB Approval System includes built-in performance tracking:

**Metrics Available**:
- Cache hit rate for consensus calculations
- Average approval processing time
- Validator response times
- Batch processing efficiency

**Endpoint**: `GET /approvals/metrics`

```json
{
  "cacheHitRate": 0.87,
  "averageProcessingTimeMs": 234,
  "totalApprovalsProcessed": 15234,
  "activeApprovals": 42,
  "batchOperationEfficiency": 0.92
}
```

---

## Implementation Status

- ✅ Core approval workflow
- ✅ Validator voting system
- ✅ Consensus detection
- ✅ Event-driven audit trail
- ✅ REST API endpoints
- ✅ Performance optimization
- ✅ State machine validation
- ⏳ Webhook integration (Sprint 7)
- ⏳ GraphQL API (Sprint 8)

---

## Support

For issues or questions:
- **Email**: support@aurigraph.io
- **Docs**: https://docs.aurigraph.io
- **Status**: https://status.aurigraph.io
