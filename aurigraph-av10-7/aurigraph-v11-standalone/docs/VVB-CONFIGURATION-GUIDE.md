# VVB Configuration Guide

## Setup Instructions

### 1. Database Configuration

#### PostgreSQL Setup

```sql
-- Create VVB-specific role (optional, for security)
CREATE ROLE vvb_service WITH LOGIN PASSWORD 'secure_password';
GRANT USAGE ON SCHEMA public TO vvb_service;

-- Run migrations automatically via Flyway
-- V30__create_vvb_validators.sql
-- V31__create_vvb_audit_trail.sql
```

#### Quarkus Configuration

Add to `application.properties`:

```properties
# VVB Configuration
aurigraph.vvb.approval-timeout-days=7
aurigraph.vvb.cascade-notifications=true
aurigraph.vvb.audit-level=FULL

# Database connection (if using separate connection pool)
quarkus.datasource.vvb.db-kind=postgresql
quarkus.datasource.vvb.username=vvb_service
quarkus.datasource.vvb.password=${VVB_DB_PASSWORD}
quarkus.datasource.vvb.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph
```

### 2. Approver Role Configuration

#### Via SQL

```sql
-- Insert VVB validators
INSERT INTO vvb_validators (name, role, approval_authority, active) VALUES
    ('John_Smith', 'VVB_VALIDATOR', 'STANDARD', TRUE),
    ('Alice_Johnson', 'VVB_VALIDATOR', 'STANDARD', TRUE),
    ('Bob_Admin', 'VVB_ADMIN', 'ELEVATED', TRUE),
    ('Carol_SuperAdmin', 'VVB_ADMIN', 'ELEVATED', TRUE);

-- Insert approval rules
INSERT INTO vvb_approval_rules (change_type, requires_vvb, role_required, approval_type) VALUES
    ('SECONDARY_TOKEN_CREATE', TRUE, 'VVB_VALIDATOR', 'STANDARD'),
    ('SECONDARY_TOKEN_RETIRE', TRUE, 'VVB_ADMIN', 'ELEVATED'),
    ('PRIMARY_TOKEN_RETIRE', TRUE, 'VVB_ADMIN', 'CRITICAL');
```

#### Via REST API (Future)

```bash
curl -X POST http://localhost:9003/api/v12/vvb/config/validators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John_Smith",
    "role": "VVB_VALIDATOR",
    "approvalAuthority": "STANDARD"
  }'
```

### 3. Timeout Policies

#### Configuration in VVBValidator

Default values in code:
- Approval timeout: 7 days
- Configurable via environment variable

```java
// In VVBValidator.java
private static final long APPROVAL_TIMEOUT_DAYS = 7; // Changeable

// Or from config:
@ConfigProperty(name = "aurigraph.vvb.approval-timeout-days", defaultValue = "7")
long approvalTimeoutDays;
```

#### Environment Variables

```bash
export QUARKUS_AURIGRAPH_VVB_APPROVAL_TIMEOUT_DAYS=14
export QUARKUS_AURIGRAPH_VVB_CASCADE_NOTIFICATIONS=true
export QUARKUS_AURIGRAPH_VVB_AUDIT_LEVEL=DETAILED
```

### 4. Notification Setup

#### CDI Event Listening

```java
@ApplicationScoped
public class VVBNotificationListener {

    @Inject
    EmailService emailService;

    public void onApprovalDecision(@Observes VVBApprovalEvent event) {
        if (event.getStatus() == VVBApprovalStatus.APPROVED) {
            emailService.send(
                "approval-notification@company.com",
                "Token Approved: " + event.getVersionId(),
                "The token has been approved and will be activated."
            );
        }
    }

    public void onApprovalTimeout(@Observes VVBApprovalEvent event) {
        if (event.getStatus() == VVBApprovalStatus.TIMEOUT) {
            emailService.send(
                "approvals@company.com",
                "ALERT: Approval Timeout",
                "Token " + event.getVersionId() + " approval expired"
            );
        }
    }
}
```

#### Scheduled Timeout Handler

```java
@ApplicationScoped
public class VVBTimeoutScheduler {

    @Inject
    VVBWorkflowService workflowService;

    @Inject
    VVBValidator validator;

    @Scheduled(cron = "0 0 */6 * * ?") // Every 6 hours
    void checkForTimeouts() {
        List<VVBValidator.VVBValidationStatus> pending = validator.getPendingApprovals()
            .await().indefinitely();

        pending.stream()
            .filter(status -> isTimedOut(status))
            .forEach(status -> {
                workflowService.handleApprovalTimeout(status.getVersionId())
                    .await().indefinitely();
            });
    }

    private boolean isTimedOut(VVBValidator.VVBValidationStatus status) {
        Instant deadline = status.getCreatedAt().plus(7, ChronoUnit.DAYS);
        return Instant.now().isAfter(deadline);
    }
}
```

### 5. Integration with Token Services

#### Secondary Token Service

```java
@ApplicationScoped
public class SecondaryTokenService {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    Event<TokenSubmittedForApprovalEvent> submittedEvent;

    @Transactional
    public Uni<SecondaryToken> createToken(TokenCreationRequest request) {
        UUID versionId = UUID.randomUUID();

        // Submit for VVB approval
        VVBApprovalResult result = vvbValidator.validateTokenVersion(
            versionId,
            new VVBValidationRequest("SECONDARY_TOKEN_CREATE", ...)
        ).await().indefinitely();

        if (result.isPending()) {
            // Fire event for async listeners
            submittedEvent.fire(new TokenSubmittedForApprovalEvent(versionId));
        }

        return storeTokenVersion(versionId, result);
    }

    public void onTokenApproved(@Observes VVBApprovalEvent event) {
        if (event.getStatus() == VVBApprovalStatus.APPROVED) {
            // Activate the token
            activateToken(event.getVersionId());
        }
    }
}
```

#### Primary Token Registry

```java
@ApplicationScoped
public class PrimaryTokenRegistry {

    @Inject
    TokenLifecycleGovernance governance;

    public Uni<Boolean> canRetire(String primaryTokenId) {
        TokenLifecycleGovernance.GovernanceValidation validation = governance
            .validateRetirement(primaryTokenId)
            .await().indefinitely();

        return Uni.createFrom().item(validation.isValid());
    }

    @Transactional
    public void registerSecondaryToken(String primaryTokenId, String secondaryTokenId) {
        governance.registerSecondaryToken(
            primaryTokenId,
            secondaryTokenId,
            TokenLifecycleGovernance.TokenStatus.CREATED
        );
    }
}
```

## Monitoring and Observability

### Metrics to Track

```java
// In VVBValidator
@Counted(name = "vvb.approvals.total")
@Timed(name = "vvb.approval.duration")
public Uni<VVBApprovalResult> approveTokenVersion(...) {
    // Implementation
}
```

### Prometheus Metrics

```
# HELP vvb_approvals_total Total number of VVB approvals
# TYPE vvb_approvals_total counter
vvb_approvals_total{decision="approved"} 120
vvb_approvals_total{decision="rejected"} 20

# HELP vvb_approval_duration_ms Duration of approval in milliseconds
# TYPE vvb_approval_duration_ms histogram
vvb_approval_duration_ms_bucket{le="50"} 85
vvb_approval_duration_ms_bucket{le="100"} 95
vvb_approval_duration_ms_bucket{le="500"} 100
```

### Logging Configuration

```properties
# application.properties
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph.v11.token.vvb".level=DEBUG

# Enable structured logging for VVB
quarkus.log.console.format=%d{ISO8601} %-5p [\%X{vvb.request.id}] %C - %m%n
```

## Security Best Practices

### 1. Role-Based Access Control

```java
@ApplicationScoped
public class VVBSecurityService {

    public boolean canApprove(String userId, VVBValidator.VVBApprovalType type) {
        // Check user's role from IAM/Keycloak
        String userRole = keycloakService.getUserRole(userId);

        return switch(type) {
            case STANDARD -> userRole.equals("VVB_VALIDATOR") ||
                           userRole.equals("VVB_ADMIN");
            case ELEVATED -> userRole.equals("VVB_ADMIN");
            case CRITICAL -> userRole.equals("VVB_ADMIN");
        };
    }
}
```

### 2. Audit Trail Enforcement

All VVB operations are logged to database:
- Approval decisions
- Rejection reasons
- Timeout events
- Cascade operations

```sql
SELECT * FROM vvb_timeline
WHERE version_id = 'uuid-here'
ORDER BY event_timestamp DESC;
```

### 3. API Security

```java
@ApplicationScoped
public class VVBResource {

    @POST
    @Path("/approve")
    @RolesAllowed({"VVB_VALIDATOR", "VVB_ADMIN"})
    public Response approveTokenVersion(...) {
        // Implementation
    }
}
```

## Troubleshooting

### Issue: Validators Not Found

**Symptoms**: All approval requests return "Unknown approver"

**Solution**:
```sql
SELECT * FROM vvb_validators WHERE active = true;
-- If empty, run: INSERT INTO vvb_validators...
```

### Issue: Timeout Not Triggering

**Symptoms**: Approvals remain PENDING_VVB indefinitely

**Solution**:
1. Check scheduler is running: `SELECT * FROM vvb_timeline WHERE event_type = 'TIMEOUT'`
2. Verify timeout configuration in application.properties
3. Check logs for scheduler errors
4. Manually trigger: `POST /api/v12/vvb/{versionId}/timeout` (admin only)

### Issue: Cascade Not Working

**Symptoms**: Child tokens not marked as REJECTED after parent rejection

**Solution**:
1. Verify parent-child relationships in token registry
2. Check cascade handler is registered: `@Observes VVBApprovalEvent`
3. Review vvb_timeline for cascade events
4. Check logs for CDI event firing errors

## Performance Tuning

### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
CREATE INDEX idx_vvb_timeline_version_id ON vvb_timeline(version_id);
CREATE INDEX idx_vvb_timeline_event_timestamp ON vvb_timeline(event_timestamp);
CREATE INDEX idx_vvb_approvals_version_id ON vvb_approvals(version_id);
CREATE INDEX idx_vvb_approvals_approver_id ON vvb_approvals(approver_id);
```

### Connection Pool

```properties
quarkus.datasource.max-size=20
quarkus.datasource.min-size=5
quarkus.datasource.acquisition-timeout=3s
```

### Caching

VVB Statistics are cached per date range. Clear cache if rules change:

```java
@Inject
VVBWorkflowService workflowService;

public void refreshCache() {
    // Cache is in-memory; refresh by restarting or clearing manually
    // workflowService.clearStatisticsCache();
}
```

## Related Documentation

- [VVB Implementation Guide](./VVB-IMPLEMENTATION-GUIDE.md)
- [API Reference](./API-REFERENCE.md)
- [Database Schema](./DATABASE-SCHEMA.md)
