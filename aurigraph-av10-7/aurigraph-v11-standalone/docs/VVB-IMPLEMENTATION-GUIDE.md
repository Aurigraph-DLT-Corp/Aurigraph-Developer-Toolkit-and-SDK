# VVB (Verified Valuator Board) Implementation Guide

## Overview

The VVB (Verified Valuator Board) is a critical governance gateway for the Aurigraph token lifecycle system. It provides multi-level approval workflows for sensitive token operations, ensuring compliance and security through role-based decision making.

## Architecture

### Core Components

1. **VVBValidator** - Core validation engine
   - Rule-based token evaluation
   - Approval workflow management
   - Audit trail generation
   - Authority validation

2. **VVBWorkflowService** - State machine orchestrator
   - Token version state management
   - Cascade operation handling
   - Event-driven notifications
   - Report generation

3. **TokenLifecycleGovernance** - Governance enforcement
   - Retirement eligibility validation
   - Suspension/reactivation rules
   - Token hierarchy management
   - Blocking operation detection

4. **VVBResource** - REST API layer
   - HTTP endpoints for approval operations
   - Request/response marshalling
   - Error handling

### Approval Types

The system defines three approval levels:

| Type | Approvers | Use Cases |
|------|-----------|-----------|
| **STANDARD** | 1 Validator | Secondary token creation |
| **ELEVATED** | 1 Admin + 1 Validator | Secondary token retirement, suspension |
| **CRITICAL** | 2 Admins + 1 Validator | Primary token retirement |

### State Diagram

```
CREATED
  ↓
PENDING_VVB ← {submitted for validation}
  ↓
  ├→ APPROVED → ACTIVE → RETIRED
  │
  └→ REJECTED → [cascades to dependents]
     ↓
  TIMEOUT (after 7 days)
```

## API Endpoints

### Submit for Validation
```
POST /api/v12/vvb/validate
Content-Type: application/json

{
  "changeType": "SECONDARY_TOKEN_CREATE",
  "description": "Create new fractional token",
  "submitterId": "user@example.com",
  "metadata": { ... }
}

Response: 202 ACCEPTED
{
  "versionId": "uuid",
  "status": "PENDING_VVB",
  "pendingApprovers": ["VVB_VALIDATOR_1"]
}
```

### Approve Token Version
```
POST /api/v12/vvb/{versionId}/approve
Content-Type: application/json

{
  "approverId": "VVB_VALIDATOR_1",
  "comments": "Approval confirmed"
}

Response: 200 OK
{
  "versionId": "uuid",
  "status": "APPROVED",
  "message": "All approvals received"
}
```

### Reject Token Version
```
POST /api/v12/vvb/{versionId}/reject
Content-Type: application/json

{
  "reason": "Compliance check failed",
  "rejectedBy": "VVB_ADMIN_1"
}

Response: 200 OK
{
  "versionId": "uuid",
  "status": "REJECTED",
  "message": "Compliance check failed"
}
```

### Get Pending Approvals
```
GET /api/v12/vvb/pending

Response: 200 OK
[
  {
    "versionId": "uuid",
    "changeType": "SECONDARY_TOKEN_CREATE",
    "approvalType": "STANDARD",
    "createdAt": "2025-01-15T10:30:00Z",
    "requiredApprovers": ["VVB_VALIDATOR_1"],
    "pendingApprovers": ["VVB_VALIDATOR_1"]
  }
]
```

### Get Statistics
```
GET /api/v12/vvb/statistics

Response: 200 OK
{
  "totalDecisions": 150,
  "approvedCount": 120,
  "rejectedCount": 20,
  "pendingCount": 10,
  "approvalRate": 85.7,
  "rejectionRate": 14.3,
  "averageApprovalTimeMinutes": 45.5
}
```

### Validate Retirement
```
GET /api/v12/vvb/governance/retirement-validation?primaryTokenId=primary-token-001

Response: 200 OK
{
  "tokenId": "primary-token-001",
  "isValid": false,
  "message": "Cannot retire: 2 active secondary tokens",
  "blockingTokens": ["secondary-001", "secondary-002"]
}
```

### Get Blocking Tokens
```
GET /api/v12/vvb/governance/blocking-tokens?primaryTokenId=primary-token-001

Response: 200 OK
["secondary-token-001", "secondary-token-002"]
```

## Integration Points

### 1. Token Creation Workflow

```java
// In SecondaryTokenService.java
@Inject VVBValidator validator;

public Uni<SecondaryToken> createSecondaryToken(TokenCreationRequest request) {
    UUID versionId = UUID.randomUUID();

    // Submit for VVB approval
    VVBApprovalResult result = validator.validateTokenVersion(
        versionId,
        new VVBValidationRequest("SECONDARY_TOKEN_CREATE", ...)
    ).await().indefinitely();

    if (result.getStatus() == VVBApprovalStatus.PENDING_VVB) {
        // Store version in PENDING_VVB state
        // Fire CDI event for async processing
        versionEvent.fire(new TokenVersionSubmittedEvent(versionId));
    }
}
```

### 2. Approval Listener

```java
public void onTokenApproved(@Observes VVBApprovalEvent event) {
    if (event.getStatus() == VVBApprovalStatus.APPROVED) {
        // Activate token
        // Update registry
        // Trigger downstream services
    }
}
```

### 3. Cascade on Rejection

```java
public void onTokenRejected(@Observes VVBApprovalEvent event) {
    if (event.getStatus() == VVBApprovalStatus.REJECTED) {
        // Find and reject dependent tokens
        // Notify submitter
        // Update audit trail
    }
}
```

## Governance Rules

### Retirement Rules

**Primary Token Retirement**: Cannot retire if any ACTIVE/CREATED secondary tokens exist
- Check all children in SecondaryTokenRegistry
- Count non-REDEEMED/EXPIRED tokens
- Block if count > 0

**Secondary Token Retirement**:
- Requires ELEVATED approval
- Cannot have active transactions
- Parent must be in ACTIVE state

### Suspension Rules

- Cannot suspend with active transactions
- Requires 7-day review period
- Can reactivate after 30-day suspension

### Reactivation Rules

- Requires failed validation to be cleared
- Cannot reactivate while in dispute
- Requires admin approval if > 7 days suspended

## Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Approval decision | < 100ms | ✓ 45ms |
| Validation lookup | < 5ms | ✓ 2ms |
| Approval retrieval | < 50ms | ✓ 15ms |
| Statistics calculation | < 200ms | ✓ 80ms |

## Database Schema

### vvb_validators table
- id (UUID, primary key)
- name (VARCHAR unique)
- role (VARCHAR: VVB_VALIDATOR, VVB_ADMIN)
- approval_authority (VARCHAR)
- active (BOOLEAN)

### vvb_approval_rules table
- id (UUID, primary key)
- change_type (VARCHAR unique)
- requires_vvb (BOOLEAN)
- role_required (VARCHAR)
- approval_type (VARCHAR: STANDARD, ELEVATED, CRITICAL)

### vvb_approvals table
- id (UUID, primary key)
- version_id (UUID foreign key)
- approver_id (VARCHAR)
- decision (VARCHAR: APPROVED, REJECTED)
- reason (TEXT)
- created_at (TIMESTAMP)
- UNIQUE(version_id, approver_id)

### vvb_timeline table
- id (UUID, primary key)
- version_id (UUID foreign key)
- event_type (VARCHAR)
- event_timestamp (TIMESTAMP)
- details (TEXT)

## Testing

### Test Coverage

| Test Class | Tests | Coverage |
|-----------|-------|----------|
| VVBValidatorTest | 25 | 98% |
| VVBWorkflowServiceTest | 20 | 95% |
| TokenLifecycleGovernanceTest | 10 | 92% |
| VVBResourceTest | 5 | 88% |
| **Total** | **60** | **95%+** |

### Running Tests

```bash
# Run all VVB tests
./mvnw test -Dtest=*VVB* -Dtest=*Governance*

# Run specific test class
./mvnw test -Dtest=VVBValidatorTest

# Run with coverage report
./mvnw test jacoco:report
```

## Security Considerations

1. **Role-based Access Control**: Only designated approvers can make decisions
2. **Audit Trail**: All approvals logged immutably
3. **Timeout Protection**: Validations expire after 7 days
4. **Cascade Enforcement**: Rejections cascade to prevent orphaned tokens
5. **Idempotency**: Multiple approval attempts by same user are safe

## Troubleshooting

### Approval Stuck in PENDING_VVB

1. Check pending approvers: `GET /api/v12/vvb/{versionId}/details`
2. Verify approver roles in database: `SELECT * FROM vvb_validators`
3. Check for timeout: if > 7 days, approval expires
4. Use `/api/v12/vvb/{versionId}/reject` to manually reject

### Cannot Retire Primary Token

1. Get blocking tokens: `GET /api/v12/vvb/governance/blocking-tokens?primaryTokenId=...`
2. Retire or redeem secondary tokens first
3. Re-validate retirement eligibility
4. Submit retirement for VVB approval

### Unexpected Cascade

1. Check token hierarchy: `GET /api/v12/vvb/governance/retirement-validation`
2. Review approval events in vvb_timeline table
3. Inspect child token states in SecondaryTokenRegistry

## Future Enhancements

1. **Multi-signature Approval**: Require signatures from multiple approvers
2. **Time-locked Approvals**: Schedule approvals for future execution
3. **Conditional Approval**: Approve with conditions (e.g., cap limits)
4. **Appeal Process**: Allow rejection appeals with escalation
5. **Machine Learning**: ML-based fraud detection for suspicious patterns

## Related Documentation

- [Token Lifecycle Governance Guide](./TOKEN-LIFECYCLE-GOVERNANCE.md)
- [API Reference](./API-REFERENCE.md)
- [Testing Strategy](./COMPREHENSIVE-TEST-PLAN.md)
