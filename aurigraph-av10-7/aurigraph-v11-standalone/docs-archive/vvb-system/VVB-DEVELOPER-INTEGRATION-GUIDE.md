# VVB Approval System - Developer Integration Guide

**Document Version:** 1.0
**Last Updated:** December 23, 2025
**Target Audience:** Java/Quarkus Developers, Integration Architects
**Status:** Production-Ready

---

## Quick Start

This guide teaches developers how to integrate VVB approval workflow into token versioning systems.

### 5-Minute Overview

```java
// 1. Inject VVB validator
@Inject
VVBValidator vvbValidator;

// 2. Submit token version for approval
VVBApprovalResult result = vvbValidator.validateTokenVersion(
    versionId,
    new VVBValidationRequest("SECONDARY_TOKEN_CREATE", "dev@aurigraph.io")
).await().indefinitely();

// 3. Check status
if (result.getStatus() == VVBApprovalStatus.PENDING_VVB) {
    // Wait for approver votes
}

// 4. When approved, execute change
vvbValidator.executeApprovedVersion(versionId);
```

---

## Table of Contents

1. [Integration Patterns](#integration-patterns)
2. [CDI Event Hooks](#cdi-event-hooks)
3. [State Machine Integration](#state-machine-integration)
4. [Custom Validators](#custom-validators)
5. [Custom Consensus Rules](#custom-consensus-rules)
6. [Testing Integration](#testing-integration)
7. [Performance Tuning](#performance-tuning)
8. [Debugging Tips](#debugging-tips)

---

## Integration Patterns

### Pattern 1: Synchronous Approval (Wait for Decision)

Use when token creation is time-sensitive and blocking is acceptable.

```java
@Path("/tokens/secondary")
public class SecondaryTokenResource {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    TokenCreationService tokenCreationService;

    @POST
    @Transactional
    public Response createSecondaryToken(SecondaryTokenRequest request) {
        // 1. Create token version (not yet active)
        TokenVersion version = tokenCreationService.createVersion(request);

        // 2. Submit for VVB approval
        VVBValidationRequest vvbRequest = new VVBValidationRequest(
            "SECONDARY_TOKEN_CREATE",
            request.getSubmittedBy()
        );

        VVBApprovalResult approval = vvbValidator.validateTokenVersion(
            version.getId(),
            vvbRequest
        ).await().indefinitely();  // Block for result

        // 3. Check result
        if (approval.getStatus() == VVBApprovalStatus.PENDING_VVB) {
            return Response.status(202)  // Accepted
                .entity(new PartialResponseDto(
                    version.getId(),
                    "Awaiting VVB approval",
                    approval.getRequiredApprovers()
                ))
                .build();
        }

        // Should not reach here (approval is async)
        return Response.status(400).entity("Unexpected state").build();
    }
}
```

### Pattern 2: Asynchronous Approval (Fire & Forget)

Use when token versioning can proceed independently and check approval later.

```java
@Path("/tokens/secondary")
public class SecondaryTokenResource {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    Event<TokenApprovalRequiredEvent> approvalEvent;

    @Inject
    TokenVersioningService versioningService;

    @POST
    @Transactional
    public Response createSecondaryTokenAsync(SecondaryTokenRequest request) {
        // 1. Create version
        TokenVersion version = versioningService.createVersion(request);

        // 2. Submit for approval (async)
        vvbValidator.validateTokenVersion(
            version.getId(),
            new VVBValidationRequest("SECONDARY_TOKEN_CREATE", request.getSubmittedBy())
        ).subscribe().with(
            result -> {
                // Success: approval recorded
                approvalEvent.fireAsync(new TokenApprovalRequiredEvent(
                    version.getId(),
                    result.getRequiredApprovers()
                ));
            },
            error -> {
                // Failure: log and notify
                Log.errorf("VVB validation failed: %s", error.getMessage());
                approvalEvent.fireAsync(new TokenApprovalFailedEvent(version.getId(), error));
            }
        );

        // 3. Return immediately with version ID
        return Response.status(202)  // Accepted
            .entity(new VersionCreatedResponse(
                version.getId(),
                "Token version created. Awaiting VVB approval."
            ))
            .build();
    }
}
```

### Pattern 3: Conditional Approval (Bypass for Low-Risk)

Use when some changes can skip approval based on risk assessment.

```java
@Transactional
public void updateTokenVersion(TokenVersion version) {
    // Check if change requires approval
    boolean requiresApproval = shouldRequireApproval(version);

    if (!requiresApproval) {
        // Low-risk change: proceed directly
        version.setState(TokenState.ACTIVE);
        versionRepository.persist(version);
        return;
    }

    // High-risk change: require approval
    VVBValidator validator = CDI.current().select(VVBValidator.class).get();
    VVBApprovalResult result = validator.validateTokenVersion(
        version.getId(),
        new VVBValidationRequest(determineChangeType(version), "system@aurigraph.io")
    ).await().indefinitely();

    if (result.getStatus() == VVBApprovalStatus.PENDING_VVB) {
        version.setState(TokenState.PENDING_APPROVAL);
    }
}

private boolean shouldRequireApproval(TokenVersion version) {
    // Bypass approval for:
    // - Minor attribute updates
    // - Low financial impact changes
    // - Routine maintenance

    return version.getChangeImpact() > RiskThreshold.MEDIUM;
}
```

---

## CDI Event Hooks

VVB fires CDI events at critical points. Subscribe to handle approvals/rejections.

### Event Types

#### 1. VVBApprovalEvent (When Approval Recorded)

```java
import jakarta.enterprise.event.Observes;

@ApplicationScoped
public class ApprovalEventListener {

    @Inject
    TokenActivationService activationService;

    /**
     * Fired when a token version is approved by consensus
     */
    public void onApprovalComplete(
        @Observes VVBApprovalEvent event) {

        Log.infof("Token %s approved", event.getVersionId());

        // Proceed with execution
        activationService.activateVersion(
            event.getVersionId(),
            event.getApprovedBy()
        );
    }
}
```

#### 2. Token Approved Event

```java
@ApplicationScoped
public class TokenApprovedListener {

    @Inject
    RevenueStreamService revenueService;

    @Inject
    NotificationService notificationService;

    /**
     * Custom CDI event: fired when token version approved
     */
    public void onTokenApproved(
        @Observes TokenApprovedEvent event) {

        // Setup revenue stream
        revenueService.initializeRevenueStream(
            event.getTokenId(),
            event.getMetadata().getRevenueConfig()
        );

        // Notify stakeholders
        notificationService.notifyApprovalComplete(
            event.getTokenId(),
            event.getApprovers()
        );
    }
}
```

#### 3. Token Rejected Event

```java
@ApplicationScoped
public class TokenRejectedListener {

    @Inject
    AuditService auditService;

    /**
     * Fired when token version rejected
     */
    public void onTokenRejected(
        @Observes TokenRejectedEvent event) {

        Log.warnf("Token %s rejected: %s",
            event.getTokenId(),
            event.getRejectionReason());

        // Log for compliance
        auditService.logRejection(
            event.getTokenId(),
            event.getRejectedBy(),
            event.getRejectionReason()
        );

        // Notify submitter
        emailService.sendRejectionNotice(
            event.getSubmittedBy(),
            event.getRejectionReason()
        );
    }
}
```

#### 4. Governance Violation Event

```java
@ApplicationScoped
public class GovernanceViolationListener {

    @Inject
    ComplianceService complianceService;

    /**
     * Fired when governance rules prevent operation
     */
    public void onGovernanceViolation(
        @Observes LifecycleGovernanceEvent event) {

        Log.warnf("Governance violation: %s", event.getDescription());

        // Log for audit trail
        complianceService.logGovernanceViolation(
            event.getTokenId(),
            event.getEventType(),
            event.getBlockingTokens()
        );
    }
}
```

### Firing Custom Events

Fire events to integrate VVB with downstream systems:

```java
@ApplicationScoped
public class TokenVersioningService {

    @Inject
    Event<TokenApprovedEvent> tokenApprovedEvent;

    @Inject
    Event<TokenRejectedEvent> tokenRejectedEvent;

    @Transactional
    public void onApprovalComplete(UUID versionId) {
        TokenVersion version = versionRepository.findById(versionId);

        // Fire custom event
        tokenApprovedEvent.fireAsync(new TokenApprovedEvent(
            versionId,
            version.getTokenId(),
            version.getMetadata(),
            "approver@aurigraph.io"
        ));
    }

    @Transactional
    public void onApprovalRejected(UUID versionId, String reason) {
        // Fire rejection event
        tokenRejectedEvent.fireAsync(new TokenRejectedEvent(
            versionId,
            reason,
            "validator@aurigraph.io"
        ));
    }
}
```

---

## State Machine Integration

VVB integrates with token lifecycle state machines. Understand state transitions.

### Token Version States

```
CREATED
  |
  v
PENDING_APPROVAL (submitted to VVB)
  |
  +---> APPROVED (VVB consensus reached)
  |       |
  |       v
  |     EXECUTING (change being applied)
  |       |
  |       v
  |     ACTIVE (change completed)
  |
  +---> REJECTED (VVB rejected)
         |
         v
       FAILED (rejected by governance or approvers)
```

### Integrating with TokenLifecycleGovernance

The TokenLifecycleGovernance service enforces cascading governance rules.

```java
@ApplicationScoped
public class TokenRetirementService {

    @Inject
    TokenLifecycleGovernance governance;

    @Inject
    VVBValidator vvbValidator;

    @Transactional
    public Uni<Boolean> canRetirePrimaryToken(String primaryTokenId) {
        // First check governance
        return governance.validateRetirement(primaryTokenId)
            .flatMap(validation -> {
                if (!validation.isValid()) {
                    Log.warnf("Cannot retire: %s", validation.getReason());
                    return Uni.createFrom().item(false);
                }

                // If governance OK, submit for VVB approval
                return vvbValidator.validateTokenVersion(
                    UUID.randomUUID(),
                    new VVBValidationRequest("PRIMARY_TOKEN_RETIRE", "system@aurigraph.io")
                ).map(result -> result.getStatus() == VVBApprovalStatus.PENDING_VVB);
            });
    }
}
```

### Listening to Governance Events

```java
@ApplicationScoped
public class GovernanceEnforcer {

    /**
     * React to governance violations
     */
    public void onRetirementBlocked(
        @Observes LifecycleGovernanceEvent event) {

        if (event.getEventType() == GovernanceEventType.RETIREMENT_BLOCKED) {
            List<String> blockingTokens = event.getBlockingTokens();

            Log.warnf("Cannot retire token. Blocking children: %s",
                blockingTokens);

            // Implement cascade notification
            blockingTokens.forEach(childId ->
                notifyChildTokenStatus(childId)
            );
        }
    }
}
```

---

## Custom Validators

Extend VVB with custom validation logic before approval.

### Creating Custom Validators

```java
@ApplicationScoped
public class CustomTokenValidator {

    @Inject
    RegulatoryComplianceService regulatoryService;

    @Inject
    RiskAssessmentService riskService;

    /**
     * Validate token against custom business rules
     */
    public Uni<CustomValidationResult> validateToken(TokenVersion version) {
        return Uni.combine().all()
            // 1. Check regulatory compliance
            .unis(
                regulatoryService.validateCompliance(version),

                // 2. Assess risk
                riskService.assessRisk(version),

                // 3. Check business rules
                validateBusinessRules(version)
            )
            .asTuple()
            .map(tuple -> {
                boolean compliant = tuple.getItem1();
                RiskLevel risk = tuple.getItem2();
                boolean businessValid = tuple.getItem3();

                return new CustomValidationResult(
                    compliant && businessValid,
                    generateValidationReport(compliant, risk, businessValid)
                );
            });
    }

    private Uni<Boolean> validateBusinessRules(TokenVersion version) {
        return Uni.createFrom().item(() -> {
            // Custom validation logic
            if (version.getAssetValue() > MAX_SINGLE_TOKEN_VALUE) {
                return false;
            }
            if (!isApprovedAssetType(version.getTokenType())) {
                return false;
            }
            return true;
        });
    }
}
```

### Integrating Custom Validators with VVB

```java
@ApplicationScoped
public class EnhancedTokenCreationService {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    CustomTokenValidator customValidator;

    @Transactional
    public Uni<VVBApprovalResult> createTokenWithCustomValidation(
        TokenVersion version) {

        // 1. Run custom validators first
        return customValidator.validateToken(version)
            .flatMap(customResult -> {
                if (!customResult.isValid()) {
                    Log.warnf("Custom validation failed: %s",
                        customResult.getReport());
                    return Uni.createFrom().failure(
                        new ValidationException(customResult.getReport())
                    );
                }

                // 2. If custom validation OK, submit to VVB
                return vvbValidator.validateTokenVersion(
                    version.getId(),
                    new VVBValidationRequest(
                        "SECONDARY_TOKEN_CREATE",
                        version.getCreatedBy()
                    )
                );
            });
    }
}
```

---

## Custom Consensus Rules

Modify approval requirements based on token attributes.

### Dynamic Approval Rules

```java
@ApplicationScoped
public class DynamicApprovalRulesService {

    /**
     * Determine approval tier based on token characteristics
     */
    public VVBApprovalType determineApprovalTier(
        String changeType,
        TokenVersion version) {

        // CRITICAL tier for high-value changes
        if (changeType.equals("PRIMARY_TOKEN_RETIRE")) {
            return VVBApprovalType.CRITICAL;
        }

        // ELEVATED for medium-value secondary token changes
        if (version.getAssetValue() > THRESHOLD_ELEVATED) {
            return VVBApprovalType.ELEVATED;
        }

        // STANDARD for low-value changes
        return VVBApprovalType.STANDARD;
    }

    /**
     * Custom consensus threshold: require higher approval for risky changes
     */
    public double getConsensusThreshold(TokenVersion version) {
        if (version.getRiskLevel() == RiskLevel.HIGH) {
            return 0.8;  // 4/5 instead of 2/3
        }
        if (version.getRiskLevel() == RiskLevel.CRITICAL) {
            return 1.0;  // Unanimous approval required
        }
        return 0.666;  // Default 2/3 + 1
    }
}
```

### Override Default Rules

```java
@ApplicationScoped
public class CustomRuleEngine {

    @Inject
    DynamicApprovalRulesService dynamicRules;

    @Inject
    VVBValidator vvbValidator;

    @Transactional
    public Uni<VVBApprovalResult> submitWithCustomRules(
        TokenVersion version,
        String changeType) {

        // Determine approval tier dynamically
        VVBApprovalType approvalTier =
            dynamicRules.determineApprovalTier(changeType, version);

        VVBValidationRequest request = new VVBValidationRequest(
            changeType,
            version.getCreatedBy()
        );

        // Set custom approval tier
        request.setOverrideApprovalType(approvalTier);

        // Submit with overridden rules
        return vvbValidator.validateTokenVersion(
            version.getId(),
            request
        );
    }
}
```

---

## Testing Integration

### Unit Testing VVB Integration

```java
@QuarkusTest
public class VVBIntegrationTest {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    TokenCreationService tokenService;

    @Test
    public void testStandardApprovalFlow() {
        // 1. Create token version
        TokenVersion version = tokenService.createVersion(
            new TokenRequest("fractional")
        );

        // 2. Submit for VVB approval
        VVBApprovalResult result = vvbValidator.validateTokenVersion(
            version.getId(),
            new VVBValidationRequest("SECONDARY_TOKEN_CREATE", "dev@test.io")
        ).await().indefinitely();

        // 3. Assert approval pending
        assertThat(result.getStatus())
            .isEqualTo(VVBApprovalStatus.PENDING_VVB);
        assertThat(result.getRequiredApprovers())
            .hasSize(1);

        // 4. Approver votes
        VVBApprovalResult approval = vvbValidator.approveTokenVersion(
            version.getId(),
            "approver@test.io"
        ).await().indefinitely();

        // 5. Assert approved
        assertThat(approval.getStatus())
            .isEqualTo(VVBApprovalStatus.APPROVED);
    }

    @Test
    public void testGovernanceEnforcement() {
        // Create primary token with active secondary
        String primaryId = "primary-token-1";
        String secondaryId = "secondary-token-1";

        // Register secondary as active
        governance.registerSecondaryToken(
            primaryId, secondaryId, TokenStatus.ACTIVE
        );

        // Try to retire primary
        Uni<GovernanceValidation> validation =
            governance.validateRetirement(primaryId);

        // Assert retirement blocked
        GovernanceValidation result = validation
            .await().indefinitely();
        assertThat(result.isValid()).isFalse();
        assertThat(result.getBlockingTokens())
            .contains(secondaryId);
    }
}
```

### Integration Testing with Mock Approvers

```java
@QuarkusTest
public class ApprovalWorkflowTest {

    @Inject
    VVBValidator vvbValidator;

    @Test
    public void testMultiApproverConsensus() {
        UUID versionId = UUID.randomUUID();

        // Submit for CRITICAL approval (3 required)
        VVBApprovalResult submitted = vvbValidator.validateTokenVersion(
            versionId,
            new VVBValidationRequest("PRIMARY_TOKEN_RETIRE", "admin@test.io")
        ).await().indefinitely();

        assertThat(submitted.getStatus())
            .isEqualTo(VVBApprovalStatus.PENDING_VVB);
        assertThat(submitted.getRequiredApprovers()).hasSize(3);

        // Approver 1: vote APPROVED
        vvbValidator.approveTokenVersion(
            versionId, "approver1@test.io"
        ).await().indefinitely();

        // Approver 2: vote APPROVED
        vvbValidator.approveTokenVersion(
            versionId, "approver2@test.io"
        ).await().indefinitely();

        // Approver 3: vote APPROVED -> Consensus reached
        VVBApprovalResult consensus = vvbValidator.approveTokenVersion(
            versionId, "approver3@test.io"
        ).await().indefinitely();

        assertThat(consensus.getStatus())
            .isEqualTo(VVBApprovalStatus.APPROVED);
    }

    @Test
    public void testRejectionBreaksConsensus() {
        UUID versionId = UUID.randomUUID();

        // Submit for ELEVATED approval (2 required)
        vvbValidator.validateTokenVersion(
            versionId,
            new VVBValidationRequest("TOKEN_SUSPENSION", "admin@test.io")
        ).await().indefinitely();

        // Approver 1: vote APPROVED
        vvbValidator.approveTokenVersion(
            versionId, "approver1@test.io"
        ).await().indefinitely();

        // Approver 2: vote REJECTED
        VVBApprovalResult rejected = vvbValidator.rejectTokenVersion(
            versionId, "Insufficient documentation"
        ).await().indefinitely();

        assertThat(rejected.getStatus())
            .isEqualTo(VVBApprovalStatus.REJECTED);
    }
}
```

### Testing Event Listeners

```java
@QuarkusTest
public class EventListenerTest {

    @Inject
    VVBValidator vvbValidator;

    @Inject
    EventCapture eventCapture;

    @Test
    public void testApprovalEventFired() {
        UUID versionId = UUID.randomUUID();

        // Setup event capture
        eventCapture.startCapturing(VVBApprovalEvent.class);

        // Trigger approval
        vvbValidator.validateTokenVersion(
            versionId,
            new VVBValidationRequest("SECONDARY_TOKEN_CREATE", "dev@test.io")
        ).await().indefinitely();

        vvbValidator.approveTokenVersion(
            versionId, "approver@test.io"
        ).await().indefinitely();

        // Assert event fired
        List<VVBApprovalEvent> events = eventCapture.getEvents();
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getVersionId())
            .isEqualTo(versionId);
    }
}
```

---

## Performance Tuning

### Optimization Strategies

#### 1. Batch Approval Processing

```java
@ApplicationScoped
public class BatchApprovalProcessor {

    @Inject
    VVBValidator vvbValidator;

    /**
     * Process multiple approvals in single batch
     */
    public Uni<List<VVBApprovalResult>> batchApprove(
        List<BatchApprovalRequest> requests) {

        // Group by approver for efficient processing
        Map<String, List<BatchApprovalRequest>> byApprover =
            requests.stream()
                .collect(Collectors.groupingBy(r -> r.getApprover()));

        // Process each approver's votes in parallel
        return Uni.combine().all()
            .unis(
                byApprover.entrySet().stream()
                    .map(entry -> processApproverBatch(
                        entry.getKey(),
                        entry.getValue()
                    ))
                    .collect(Collectors.toList())
            )
            .combinedWith(lists -> {
                return lists.stream()
                    .flatMap(l -> ((List<VVBApprovalResult>) l).stream())
                    .collect(Collectors.toList());
            });
    }

    private Uni<List<VVBApprovalResult>> processApproverBatch(
        String approver,
        List<BatchApprovalRequest> requests) {

        return Uni.combine().all()
            .unis(
                requests.stream()
                    .map(r -> vvbValidator.approveTokenVersion(
                        r.getVersionId(),
                        approver
                    ))
                    .collect(Collectors.toList())
            )
            .combinedWith(list -> (List<VVBApprovalResult>) list);
    }
}
```

#### 2. Cache Approval Rules

```java
@ApplicationScoped
public class CachedApprovalRules {

    private final Map<String, VVBApprovalRule> ruleCache =
        new ConcurrentHashMap<>();

    @Inject
    VVBValidator vvbValidator;

    /**
     * Cache rules for 1 hour
     */
    @CachePut(cacheName = "approval-rules")
    @Scheduled(every = "1h")
    public void refreshRuleCache() {
        // Reload rules from database
        Map<String, VVBApprovalRule> freshRules =
            vvbValidator.getAllApprovalRules();
        ruleCache.clear();
        ruleCache.putAll(freshRules);
    }

    public VVBApprovalRule getRule(String changeType) {
        return ruleCache.get(changeType);
    }
}
```

#### 3. Pagination for Large Approval Lists

```java
@Path("/approvals")
public class PaginatedApprovalResource {

    @Inject
    VVBValidator vvbValidator;

    @GET
    public Response listApprovalsWithPagination(
        @QueryParam("pageSize") @DefaultValue("20") int pageSize,
        @QueryParam("pageNumber") @DefaultValue("0") int pageNumber) {

        // Use paginated query
        PageResult<VVBValidationStatus> page =
            vvbValidator.getPaginatedValidations(pageNumber, pageSize);

        return Response.ok(page).build();
    }
}
```

### Monitoring Performance

```java
@ApplicationScoped
public class VVBPerformanceMonitor {

    @Inject
    MeterRegistry meterRegistry;

    public <T> Uni<T> trackMetrics(
        String operation,
        Uni<T> uni) {

        Timer.Sample sample = Timer.start(meterRegistry);

        return uni
            .onItem().invoke(item -> {
                sample.stop(Timer.builder("vvb." + operation)
                    .publishPercentiles(0.5, 0.99)
                    .register(meterRegistry));
            });
    }
}

// Usage
VVBApprovalResult result = monitor.trackMetrics(
    "approval_submission",
    vvbValidator.validateTokenVersion(versionId, request)
).await().indefinitely();
```

---

## Debugging Tips

### Enable Debug Logging

```properties
# application.properties
quarkus.log.category."io.aurigraph.v11.token.vvb".level=DEBUG
quarkus.log.category."io.aurigraph.v11.token.vvb.VVBValidator".level=TRACE
```

### Trace a Single Request

```java
// Add diagnostic headers
@ApplicationScoped
public class DebugTokenCreationService {

    @Inject
    VVBValidator vvbValidator;

    public Uni<VVBApprovalResult> createTokenWithDebug(
        TokenVersion version) {

        UUID requestId = UUID.randomUUID();
        Log.infof("[%s] Starting token creation", requestId);

        return vvbValidator.validateTokenVersion(
            version.getId(),
            new VVBValidationRequest("SECONDARY_TOKEN_CREATE", "dev@test.io")
        )
        .onItem().invoke(result ->
            Log.infof("[%s] VVB submission result: %s", requestId, result)
        )
        .onFailure().invoke(error ->
            Log.errorf("[%s] VVB submission failed: %s", requestId, error)
        );
    }
}
```

### Check Validation Status Directly

```java
// Query VVB state directly for debugging
@GET
@Path("/debug/approval/{id}")
public Response debugApprovalStatus(@PathParam("id") String versionId) {
    VVBValidationStatus status = vvbValidator.getValidationStatus(
        UUID.fromString(versionId)
    );

    return Response.ok()
        .entity(new DebugResponse(
            status.getVersionId(),
            status.getCurrentStatus(),
            status.getRequiredApprovers(),
            status.getApprovedBy(),
            status.getRejectedBy(),
            status.getCreatedAt(),
            status.getExpiresAt()
        ))
        .build();
}
```

---

## Related Documentation

- **System Guide:** `VVB-APPROVAL-SYSTEM-GUIDE.md`
- **API Reference:** `VVB-APPROVAL-API-REFERENCE.md`
- **Operations Guide:** `VVB-DEPLOYMENT-OPERATIONS-GUIDE.md`

---

**Document Version:** 1.0
**Last Updated:** December 23, 2025
**Status:** Production-Ready
