# VVB Approval API Reference - Complete Endpoint Documentation

**Document Version:** 1.0
**Last Updated:** December 23, 2025
**API Version:** v12
**Status:** Production-Ready

---

## Quick Reference

### Base URLs
```
Development:  http://localhost:9003/api/v12/vvb/approvals
Production:   https://dlt.aurigraph.io/api/v12/vvb/approvals
```

### Authentication
All endpoints require JWT bearer token:
```
Authorization: Bearer <jwt-token>
```

### Response Format
All responses are JSON with status codes:
- **2xx** - Success
- **4xx** - Client error
- **5xx** - Server error

---

## Table of Contents
1. [Endpoint Reference](#endpoint-reference)
2. [Request/Response DTOs](#requestresponse-dtos)
3. [Error Codes](#error-codes)
4. [Examples](#examples)
5. [Rate Limiting](#rate-limiting)
6. [Pagination](#pagination)
7. [Filtering](#filtering)

---

## Endpoint Reference

### 1. Create Approval Request

Creates a new approval request for a token version change.

**HTTP Method:** `POST`
**Endpoint:** `/api/v12/vvb/approvals`
**Authentication:** Required (JWT with vvb:submitter claim)
**Content-Type:** `application/json`

#### Request Body

```json
{
  "tokenVersionId": "550e8400-e29b-41d4-a716-446655440000",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "submittedBy": "developer@aurigraph.io",
  "description": "Create secondary token for RWA fractional ownership",
  "tokenDetails": {
    "primaryTokenId": "550e8400-e29b-41d4-a716-446655440001",
    "tokenType": "FRACTIONAL_OWNERSHIP",
    "assetValue": "1000000.00",
    "attributes": {
      "fractionCount": 1000,
      "minFraction": 10,
      "transferable": true
    }
  },
  "metadata": {
    "jiraTicket": "AV11-601-05",
    "businessJustification": "Enable secondary RWA market",
    "riskLevel": "LOW",
    "department": "Tokenization"
  }
}
```

#### Request Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-----------|---------|
| tokenVersionId | UUID | Yes | Token version identifier | "550e8400-e29b-41d4-a716-446655440000" |
| changeType | String | Yes | Type of change (enum) | "SECONDARY_TOKEN_CREATE" |
| submittedBy | String | Yes | Email of submitter | "developer@aurigraph.io" |
| description | String | No | Human-readable description | "Create secondary token..." |
| tokenDetails | Object | No | Token metadata | See nested fields |
| tokenDetails.primaryTokenId | UUID | No | Parent token (if applicable) | "550e8400..." |
| tokenDetails.tokenType | String | No | Token classification | "FRACTIONAL_OWNERSHIP" |
| tokenDetails.assetValue | Decimal | No | Value in base currency | "1000000.00" |
| tokenDetails.attributes | Map | No | Custom attributes | {"fractionCount": 1000} |
| metadata | Map | No | Business context | {"jiraTicket": "AV11-601-05"} |

#### Valid Change Types

```
SECONDARY_TOKEN_CREATE      - Create new secondary token
SECONDARY_TOKEN_RETIRE      - Retire active secondary token
SECONDARY_TOKEN_ACTIVATE    - Activate secondary token
SECONDARY_TOKEN_REDEEM      - Redeem secondary token
PRIMARY_TOKEN_CREATE        - Create primary token
PRIMARY_TOKEN_RETIRE        - Retire primary token
TOKEN_SUSPENSION            - Suspend any token
TOKEN_REACTIVATION          - Reactivate suspended token
TOKEN_TRANSFER              - Transfer token ownership
TOKEN_UPGRADE               - Upgrade token version
```

#### Response (201 Created)

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING_VVB",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "approvalType": "STANDARD",
  "requiredApprovers": ["approver1@aurigraph.io"],
  "approvalsReceived": [],
  "rejections": [],
  "submittedBy": "developer@aurigraph.io",
  "submittedAt": "2025-12-23T10:30:00Z",
  "expiresAt": "2025-12-30T10:30:00Z",
  "timeoutDays": 7,
  "message": "Approval request created. Awaiting VVB validator approval.",
  "links": {
    "self": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002",
    "vote": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002/vote",
    "status": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002"
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid request
```json
{
  "error": "ERR_VVB_001",
  "message": "Invalid change type: UNKNOWN_TYPE",
  "timestamp": "2025-12-23T10:30:00Z"
}
```

**409 Conflict** - Approval already exists
```json
{
  "error": "ERR_VVB_002",
  "message": "Version 550e8400... already under approval",
  "existingRequestId": "550e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2025-12-23T10:30:00Z"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "error": "ERR_VVB_008",
  "message": "User does not have vvb:submitter claim",
  "timestamp": "2025-12-23T10:30:00Z"
}
```

---

### 2. Submit Approval Vote

Records an approval or rejection vote for a pending request.

**HTTP Method:** `POST`
**Endpoint:** `/api/v12/vvb/approvals/{id}/vote`
**Authentication:** Required (JWT with vvb:approver claim)
**Path Parameters:**
- `{id}` - Request ID (UUID)

#### Request Body - Approval

```json
{
  "decision": "APPROVED",
  "approverIdentifier": "validator1@aurigraph.io",
  "comments": "Validated against governance rules. Compliant with RWA regulations.",
  "approvalMetadata": {
    "validationDate": "2025-12-23T10:35:00Z",
    "validatedBy": "John Smith",
    "complianceChecks": {
      "regulatoryReview": true,
      "securityAudit": true,
      "riskAssessment": "LOW"
    }
  }
}
```

#### Request Body - Rejection

```json
{
  "decision": "REJECTED",
  "approverIdentifier": "validator1@aurigraph.io",
  "comments": "Fraction count exceeds regulatory limit (500 max). Please resubmit with 400 fractions.",
  "rejectionCategory": "REGULATORY_VIOLATION"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-----------|
| decision | Enum | Yes | APPROVED \| REJECTED |
| approverIdentifier | String | Yes | Email/ID of approver |
| comments | String | No | Vote justification (max 1000 chars) |
| approvalMetadata | Object | No | Optional validation details (APPROVED only) |
| rejectionCategory | String | No | Category for rejection (REJECTED only) |

#### Valid Rejection Categories
```
REGULATORY_VIOLATION  - Violates regulatory requirements
SECURITY_CONCERN      - Security issue identified
TECHNICAL_ISSUE       - Technical/architectural problem
BUSINESS_MISALIGNMENT - Doesn't align with business
INSUFFICIENT_DATA     - Need more information
COST_CONCERN          - Budget/resource issue
OTHER                 - Other reason
```

#### Response (200 OK) - Vote Recorded

```json
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING_VVB",
  "decision": "APPROVED",
  "recordedBy": "validator1@aurigraph.io",
  "votedAt": "2025-12-23T10:35:00Z",
  "approvalsReceived": 1,
  "approvalsRequired": 1,
  "remainingApprovers": [],
  "message": "Vote recorded. All approvals received. Ready for execution."
}
```

#### Response (200 OK) - Consensus Reached

```json
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "APPROVED",
  "allApprovalsReceived": true,
  "consensusResult": "APPROVED",
  "votedAt": "2025-12-23T10:40:00Z",
  "approvalSummary": {
    "totalRequired": 1,
    "totalApproved": 1,
    "totalRejected": 0
  },
  "message": "Token version APPROVED by consensus. Ready for execution."
}
```

#### Error Responses

**404 Not Found** - Request not found
```json
{
  "error": "ERR_VVB_005",
  "message": "Request 550e8400... not found",
  "timestamp": "2025-12-23T10:35:00Z"
}
```

**403 Forbidden** - Insufficient authority
```json
{
  "error": "ERR_VVB_003",
  "message": "User role VVB_VALIDATOR cannot approve ELEVATED tier changes",
  "requiredRole": "VVB_ADMIN",
  "timestamp": "2025-12-23T10:35:00Z"
}
```

**409 Conflict** - Already voted or expired
```json
{
  "error": "ERR_VVB_004",
  "message": "Request expired (7-day timeout exceeded)",
  "expiresAt": "2025-12-30T10:30:00Z",
  "timestamp": "2025-12-23T10:35:00Z"
}
```

---

### 3. Get Approval Status

Retrieves current status of an approval request.

**HTTP Method:** `GET`
**Endpoint:** `/api/v12/vvb/approvals/{id}`
**Authentication:** Required (JWT with vvb:approver or vvb:submitter claim)
**Path Parameters:**
- `{id}` - Request ID (UUID)

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-----------|
| includeAudit | boolean | Include full audit trail (default: false) |
| includeMetadata | boolean | Include business metadata (default: true) |

#### Response (200 OK)

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "APPROVED",
  "changeType": "SECONDARY_TOKEN_CREATE",
  "approvalType": "STANDARD",
  "requiredApprovers": ["approver1@aurigraph.io"],
  "approvalsReceived": ["approver1@aurigraph.io"],
  "rejections": [],
  "submittedBy": "developer@aurigraph.io",
  "submittedAt": "2025-12-23T10:30:00Z",
  "approvedAt": "2025-12-23T10:35:00Z",
  "expiresAt": "2025-12-30T10:30:00Z",
  "metadata": {
    "jiraTicket": "AV11-601-05",
    "businessJustification": "Enable secondary RWA market",
    "riskLevel": "LOW",
    "department": "Tokenization"
  },
  "approvalRecords": [
    {
      "approverIdentifier": "approver1@aurigraph.io",
      "decision": "APPROVED",
      "comments": "Validated. Compliant with regulations.",
      "timestamp": "2025-12-23T10:35:00Z",
      "recordId": "550e8400-e29b-41d4-a716-446655440003"
    }
  ],
  "timelineEvents": [
    {
      "event": "SUBMITTED",
      "timestamp": "2025-12-23T10:30:00Z",
      "actor": "developer@aurigraph.io"
    },
    {
      "event": "VOTE_RECORDED",
      "timestamp": "2025-12-23T10:35:00Z",
      "actor": "approver1@aurigraph.io",
      "decision": "APPROVED"
    },
    {
      "event": "APPROVED",
      "timestamp": "2025-12-23T10:35:00Z",
      "actor": "system"
    }
  ]
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "ERR_VVB_005",
  "message": "Request 550e8400... not found",
  "timestamp": "2025-12-23T10:35:00Z"
}
```

---

### 4. List Approvals

Lists all approval requests with filtering and pagination.

**HTTP Method:** `GET`
**Endpoint:** `/api/v12/vvb/approvals`
**Authentication:** Required
**Query Parameters:**
- See [Filtering](#filtering) section

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-----------|
| status | string | all | PENDING_VVB, APPROVED, REJECTED, EXPIRED, CANCELLED |
| approver | string | - | Filter by approver email |
| submitter | string | - | Filter by submitter email |
| changeType | string | - | Filter by change type |
| dateFrom | ISO-8601 | - | Start date for range |
| dateTo | ISO-8601 | - | End date for range |
| pageSize | integer | 20 | Results per page (max: 100) |
| pageNumber | integer | 0 | Page offset (0-indexed) |
| sortBy | string | submittedAt | Sort field |
| sortOrder | string | desc | asc or desc |

#### Response (200 OK)

```json
{
  "totalCount": 42,
  "pageNumber": 0,
  "pageSize": 20,
  "totalPages": 3,
  "approvals": [
    {
      "requestId": "550e8400-e29b-41d4-a716-446655440002",
      "versionId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING_VVB",
      "changeType": "SECONDARY_TOKEN_CREATE",
      "approvalType": "STANDARD",
      "submittedBy": "developer@aurigraph.io",
      "submittedAt": "2025-12-23T10:30:00Z",
      "expiresAt": "2025-12-30T10:30:00Z",
      "approvalsProgress": "0/1",
      "links": {
        "self": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002",
        "vote": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002/vote"
      }
    },
    {
      "requestId": "550e8400-e29b-41d4-a716-446655440003",
      "versionId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "APPROVED",
      "changeType": "TOKEN_SUSPENSION",
      "approvalType": "ELEVATED",
      "submittedBy": "admin@aurigraph.io",
      "submittedAt": "2025-12-23T11:00:00Z",
      "approvedAt": "2025-12-23T11:30:00Z",
      "approvalsProgress": "2/2",
      "links": {
        "self": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440003",
        "execute": "/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440003/execute"
      }
    }
  ],
  "links": {
    "first": "/api/v12/vvb/approvals?pageNumber=0&pageSize=20",
    "next": "/api/v12/vvb/approvals?pageNumber=1&pageSize=20",
    "last": "/api/v12/vvb/approvals?pageNumber=2&pageSize=20"
  }
}
```

---

### 5. Execute Approved Change

Executes a token version change after approval.

**HTTP Method:** `PUT`
**Endpoint:** `/api/v12/vvb/approvals/{id}/execute`
**Authentication:** Required (JWT with vvb:executor or vvb:admin claim)
**Path Parameters:**
- `{id}` - Request ID (UUID)

#### Request Body

```json
{
  "executedBy": "system@aurigraph.io",
  "executionContext": {
    "environment": "production",
    "scheduledTime": "2025-12-23T15:00:00Z",
    "notificationEmails": ["stakeholder@aurigraph.io"]
  }
}
```

#### Response (200 OK)

```json
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "EXECUTED",
  "executedAt": "2025-12-23T10:45:00Z",
  "executedBy": "system@aurigraph.io",
  "executionDetails": {
    "tokenCreated": true,
    "registryUpdated": true,
    "eventsPublished": 3,
    "executionTimeMs": 125
  },
  "message": "Token version change executed successfully.",
  "downstreamEvents": [
    {
      "eventType": "TokenCreatedEvent",
      "timestamp": "2025-12-23T10:45:00Z",
      "status": "PUBLISHED"
    },
    {
      "eventType": "TokenActivatedEvent",
      "timestamp": "2025-12-23T10:45:01Z",
      "status": "PUBLISHED"
    }
  ]
}
```

#### Error Responses

**400 Bad Request** - Not in APPROVED state
```json
{
  "error": "ERR_VVB_009",
  "message": "Version not in APPROVED state. Current status: PENDING_VVB",
  "currentStatus": "PENDING_VVB",
  "timestamp": "2025-12-23T10:45:00Z"
}
```

**409 Conflict** - Already executed
```json
{
  "error": "ERR_VVB_010",
  "message": "Version already executed at 2025-12-23T10:45:00Z",
  "executedAt": "2025-12-23T10:45:00Z",
  "timestamp": "2025-12-23T10:50:00Z"
}
```

---

### 6. Cancel Approval Request

Cancels a pending approval request.

**HTTP Method:** `DELETE`
**Endpoint:** `/api/v12/vvb/approvals/{id}`
**Authentication:** Required (JWT with vvb:submitter claim - original submitter only)
**Path Parameters:**
- `{id}` - Request ID (UUID)

#### Request Body

```json
{
  "cancelledBy": "developer@aurigraph.io",
  "reason": "Project requirements changed. Token creation not needed.",
  "notifyApprovers": true
}
```

#### Response (200 OK)

```json
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "CANCELLED",
  "cancelledAt": "2025-12-23T10:50:00Z",
  "cancelledBy": "developer@aurigraph.io",
  "reason": "Project requirements changed. Token creation not needed.",
  "message": "Approval request cancelled successfully."
}
```

#### Error Responses

**403 Forbidden** - Not original submitter
```json
{
  "error": "ERR_VVB_011",
  "message": "Only original submitter can cancel requests",
  "originalSubmitter": "developer@aurigraph.io",
  "attemptedBy": "other@aurigraph.io",
  "timestamp": "2025-12-23T10:50:00Z"
}
```

**409 Conflict** - Already executed
```json
{
  "error": "ERR_VVB_012",
  "message": "Cannot cancel executed request",
  "status": "EXECUTED",
  "executedAt": "2025-12-23T10:45:00Z",
  "timestamp": "2025-12-23T10:50:00Z"
}
```

---

## Request/Response DTOs

### VVBApprovalRequestDto

```java
public class VVBApprovalRequestDto {
    public String tokenVersionId;              // UUID as string
    public String changeType;                  // Change type enum
    public String submittedBy;                 // Email address
    public String description;                 // Optional description
    public TokenDetailsDto tokenDetails;       // Optional nested object
    public Map<String, String> metadata;       // Optional key-value pairs
    public ApprovalPriorityDto priority;       // Optional priority info
}
```

### VVBApprovalResponseDto

```java
public class VVBApprovalResponseDto {
    public String requestId;                   // Generated UUID
    public String versionId;                   // From request
    public String status;                      // Current status
    public String changeType;                  // From request
    public String approvalType;                // STANDARD/ELEVATED/CRITICAL
    public List<String> requiredApprovers;     // List of approver emails
    public List<String> approvalsReceived;     // Who has approved
    public List<String> rejections;            // Who rejected
    public Instant submittedAt;                // Submission timestamp
    public Instant approvedAt;                 // Approval timestamp (null if not approved)
    public Instant expiresAt;                  // Expiration timestamp
    public String message;                     // Human-readable message
    public Map<String, String> links;          // HATEOAS links
}
```

### VVBVoteDto

```java
public class VVBVoteDto {
    public String decision;                    // APPROVED or REJECTED
    public String approverIdentifier;          // Email of voter
    public String comments;                    // Optional justification
    public String rejectionCategory;           // Only for rejections
    public Map<String, Object> approvalMetadata; // Only for approvals
}
```

### TokenDetailsDto

```java
public class TokenDetailsDto {
    public String primaryTokenId;              // Parent token (if applicable)
    public String tokenType;                   // Token classification
    public String assetValue;                  // Decimal value as string
    public Map<String, Object> attributes;     // Custom attributes
}
```

### VVBApprovalRecordDto (in detailed response)

```java
public class VVBApprovalRecordDto {
    public String recordId;                    // Unique record UUID
    public String approverIdentifier;          // Who voted
    public String decision;                    // APPROVED or REJECTED
    public String comments;                    // Vote justification
    public Instant timestamp;                  // Vote timestamp
    public String rejectionCategory;           // Category if rejected
}
```

---

## Error Codes

### Complete Error Code Reference

| Code | HTTP Status | Category | Message | Resolution |
|------|------------|----------|---------|-----------|
| ERR_VVB_001 | 400 | Validation | Invalid change type | Use valid change type from enum |
| ERR_VVB_002 | 409 | Conflict | Approval already exists for version | Cancel existing or wait for completion |
| ERR_VVB_003 | 403 | Authorization | Insufficient authority for approval tier | Use higher-authority approver |
| ERR_VVB_004 | 410 | Timeout | Request expired (7-day timeout) | Resubmit new request |
| ERR_VVB_005 | 404 | NotFound | Request ID not found | Verify correct request ID |
| ERR_VVB_006 | 409 | Governance | Governance violation (parent-child) | Resolve blocking tokens first |
| ERR_VVB_007 | 400 | Validation | Missing required metadata | Add required fields and retry |
| ERR_VVB_008 | 403 | Authorization | User lacks vvb:submitter claim | Verify JWT has required claims |
| ERR_VVB_009 | 400 | State | Version not in APPROVED state | Wait for approval or check status |
| ERR_VVB_010 | 409 | Conflict | Version already executed | Cannot execute twice |
| ERR_VVB_011 | 403 | Authorization | Only submitter can cancel | Contact original submitter |
| ERR_VVB_012 | 409 | Conflict | Cannot cancel executed request | Request already executed |
| ERR_VVB_013 | 401 | Authentication | Invalid JWT token | Provide valid bearer token |
| ERR_VVB_014 | 429 | RateLimit | Rate limit exceeded | Wait before retry |
| ERR_VVB_015 | 500 | Server | Database connection failed | Check database health |

### Error Response Format

All errors follow standard format:

```json
{
  "error": "ERR_VVB_XXX",
  "message": "Human-readable error message",
  "timestamp": "2025-12-23T10:30:00Z",
  "details": {
    "fieldName": "Additional context",
    "suggestion": "Recommended action"
  }
}
```

---

## Examples

### Example 1: Full Approval Workflow (Single Approver)

**Step 1: Submit Request**
```bash
curl -X POST http://localhost:9003/api/v12/vvb/approvals \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenVersionId": "550e8400-e29b-41d4-a716-446655440000",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "submittedBy": "dev@aurigraph.io",
    "description": "Create secondary token"
  }'
```

**Response (201):**
```
requestId: 550e8400-e29b-41d4-a716-446655440002
status: PENDING_VVB
approvalType: STANDARD
requiredApprovers: ["validator@aurigraph.io"]
```

**Step 2: Query Status**
```bash
curl http://localhost:9003/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer $JWT"
```

**Step 3: Approver Votes**
```bash
curl -X POST http://localhost:9003/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002/vote \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "approverIdentifier": "validator@aurigraph.io",
    "comments": "Validated. Approved."
  }'
```

**Response (200):**
```
status: APPROVED
message: "All approvals received. Ready for execution."
```

**Step 4: Execute Change**
```bash
curl -X PUT http://localhost:9003/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002/execute \
  -H "Authorization: Bearer $JWT" \
  -d '{"executedBy": "system@aurigraph.io"}'
```

---

### Example 2: Rejection Workflow

**Step 1: Submit Request (same as above)**

**Step 2: Approver Rejects**
```bash
curl -X POST http://localhost:9003/api/v12/vvb/approvals/550e8400-e29b-41d4-a716-446655440002/vote \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "decision": "REJECTED",
    "approverIdentifier": "validator@aurigraph.io",
    "comments": "Fraction count exceeds limit",
    "rejectionCategory": "REGULATORY_VIOLATION"
  }'
```

**Response (200):**
```
status: REJECTED
message: "Token version REJECTED. Resubmit after resolving issues."
```

---

### Example 3: Multi-Approver Workflow (Critical)

**Step 1: Submit Request**
```
changeType: PRIMARY_TOKEN_RETIRE
Requires: 3 approvals (CRITICAL tier)
```

**Step 2: Approver 1 Votes APPROVED (10:35)**
```
approvalsReceived: 1
status: PENDING_VVB
message: "Awaiting 2 more approvals"
```

**Step 3: Approver 2 Votes APPROVED (10:40)**
```
approvalsReceived: 2
status: PENDING_VVB
message: "Awaiting 1 more approval"
```

**Step 4: Approver 3 Votes APPROVED (10:45)**
```
approvalsReceived: 3
status: APPROVED
message: "Consensus reached. Ready for execution."
```

---

### Example 4: Listing Pending Approvals for User

```bash
curl "http://localhost:9003/api/v12/vvb/approvals?approver=validator@aurigraph.io&status=PENDING_VVB&pageSize=10" \
  -H "Authorization: Bearer $JWT"
```

**Response:**
```json
{
  "totalCount": 5,
  "pageSize": 10,
  "approvals": [
    {
      "requestId": "550e8400...",
      "status": "PENDING_VVB",
      "changeType": "SECONDARY_TOKEN_CREATE",
      "submittedBy": "dev@aurigraph.io",
      "expiresAt": "2025-12-30T10:30:00Z"
    }
  ]
}
```

---

## Rate Limiting

### Rate Limit Configuration

| Limit Type | Value | Applies To |
|-----------|-------|-----------|
| Requests per minute | 100 | All users |
| Pending requests per user | 20 | Per submitter |
| Votes per hour | 500 | Per approver |
| Batch operations | 5 concurrent | Per user |

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1703331600

Retry-After: 60  (if rate limited)
```

### Handling Rate Limits

```bash
# Check if rate limited (429 response)
if [ $HTTP_CODE -eq 429 ]; then
  RETRY_AFTER=$(curl -I | grep Retry-After | awk '{print $2}')
  sleep $RETRY_AFTER
  # Retry request
fi
```

---

## Pagination

### Query Parameters

| Parameter | Type | Default | Range |
|-----------|------|---------|-------|
| pageNumber | int | 0 | 0-9999 |
| pageSize | int | 20 | 1-100 |

### Response Format

```json
{
  "totalCount": 42,
  "pageNumber": 0,
  "pageSize": 20,
  "totalPages": 3,
  "approvals": [...],
  "links": {
    "first": "/api/v12/vvb/approvals?pageNumber=0",
    "next": "/api/v12/vvb/approvals?pageNumber=1",
    "last": "/api/v12/vvb/approvals?pageNumber=2"
  }
}
```

### Pagination Best Practices

1. Use default pageSize=20 for most queries
2. Include Link headers in responses (HATEOAS)
3. Cache totalCount (refreshed every hour)
4. Use cursor-based pagination for large datasets (future)

---

## Filtering

### Simple Filters

```
?status=PENDING_VVB
?approver=validator@aurigraph.io
?submitter=dev@aurigraph.io
?changeType=SECONDARY_TOKEN_CREATE
```

### Date Range Filters

```
?dateFrom=2025-12-01&dateTo=2025-12-31

Format: ISO-8601 (YYYY-MM-DD or RFC-3339)
```

### Combined Filters

```
GET /api/v12/vvb/approvals?status=PENDING_VVB&approver=admin@aurigraph.io&dateFrom=2025-12-01&pageSize=50
```

### Sorting

```
?sortBy=submittedAt&sortOrder=desc
?sortBy=approvalType&sortOrder=asc

Valid sortBy fields:
- submittedAt (default)
- approvalType
- changeType
- status
```

---

## Related Documentation

- **System Guide:** `VVB-APPROVAL-SYSTEM-GUIDE.md`
- **Developer Integration:** `VVB-DEVELOPER-INTEGRATION-GUIDE.md`
- **Operations Guide:** `VVB-DEPLOYMENT-OPERATIONS-GUIDE.md`

---

**API Version:** 1.0
**Last Updated:** December 23, 2025
**Status:** Production-Ready
