package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Active Contract - Binds to Composite Token with Workflow, Business Rules, and RBAC
 *
 * The Active Contract is the operational layer that binds to a Composite Token and provides:
 * - Workflow state machine (DRAFT -> PENDING_APPROVAL -> ACTIVE -> TERMINATED)
 * - Business rules engine for asset-class specific operations
 * - Role-Based Access Control (RBAC) for permissions
 * - Traceability links back to tokens
 * - Registry listing
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-01
 */
public class ActiveContract {

    // Identity
    private String contractId;
    private String compositeTokenId;  // Reference to bound CompositeToken
    private int version;              // Contract version
    private String previousVersionId; // Link to previous version

    // Ownership
    private String ownerAddress;
    private String representativeAddress;  // Authorized representative

    // Status and Workflow
    private ContractStatus status;
    private List<WorkflowTransition> workflowHistory;

    // Effective Dates
    private Instant createdAt;
    private Instant effectiveDate;
    private Instant expirationDate;
    private Instant lastUpdated;

    // VVB Verification
    private boolean vvbVerified;
    private String vvbVerifierId;
    private Instant vvbVerifiedAt;

    // Business Rules
    private List<BusinessRule> businessRules;
    private String ruleTemplateId;  // Which rule template was used

    // RBAC
    private Map<String, ContractRole> roleAssignments;  // Address -> Role
    private List<AuditEntry> accessAuditLog;

    // Metadata and Traceability
    private Map<String, Object> metadata;
    private List<TraceabilityLink> traceabilityLinks;
    private String registryId;  // Which registry this is listed in

    /**
     * Contract Status Enum - Workflow States
     * DRAFT -> PENDING_APPROVAL -> ACTIVE -> TERMINATED
     *                             ↓ ↑
     *                          SUSPENDED
     */
    public enum ContractStatus {
        DRAFT("Initial creation state"),
        PENDING_APPROVAL("Awaiting VVB verification"),
        ACTIVE("Contract is active and operational"),
        SUSPENDED("Temporarily suspended"),
        TERMINATED("Contract has ended");

        private final String description;
        ContractStatus(String description) { this.description = description; }
        public String getDescription() { return description; }
    }

    /**
     * Contract Roles for RBAC
     */
    public enum ContractRole {
        OWNER("Full control over contract", Set.of(Permission.values())),
        REPRESENTATIVE("Can act on behalf of owner", Set.of(
            Permission.VIEW, Permission.EDIT, Permission.APPROVE, Permission.DELEGATE
        )),
        VERIFIER("Can verify and approve", Set.of(
            Permission.VIEW, Permission.VERIFY, Permission.APPROVE
        )),
        VIEWER("Read-only access", Set.of(Permission.VIEW)),
        ADMIN("Administrative access", Set.of(
            Permission.VIEW, Permission.EDIT, Permission.ADMIN
        ));

        private final String description;
        private final Set<Permission> permissions;

        ContractRole(String description, Set<Permission> permissions) {
            this.description = description;
            this.permissions = permissions;
        }

        public String getDescription() { return description; }
        public Set<Permission> getPermissions() { return permissions; }
        public boolean hasPermission(Permission permission) { return permissions.contains(permission); }
    }

    /**
     * Permissions
     */
    public enum Permission {
        VIEW,       // View contract details
        EDIT,       // Edit contract terms
        APPROVE,    // Approve workflow transitions
        VERIFY,     // VVB verification
        DELEGATE,   // Delegate access to others
        TRANSFER,   // Transfer ownership
        TERMINATE,  // Terminate contract
        ADMIN       // Administrative functions
    }

    /**
     * Workflow Transition Record
     */
    public static class WorkflowTransition {
        private ContractStatus fromStatus;
        private ContractStatus toStatus;
        private String initiatedBy;
        private String reason;
        private Instant timestamp;
        private Map<String, Object> data;

        public WorkflowTransition(ContractStatus from, ContractStatus to, String initiatedBy, String reason) {
            this.fromStatus = from;
            this.toStatus = to;
            this.initiatedBy = initiatedBy;
            this.reason = reason;
            this.timestamp = Instant.now();
            this.data = new HashMap<>();
        }

        // Getters
        public ContractStatus getFromStatus() { return fromStatus; }
        public ContractStatus getToStatus() { return toStatus; }
        public String getInitiatedBy() { return initiatedBy; }
        public String getReason() { return reason; }
        public Instant getTimestamp() { return timestamp; }
        public Map<String, Object> getData() { return data; }
    }

    /**
     * Business Rule
     */
    public static class BusinessRule {
        private String ruleId;
        private String ruleName;
        private RuleType ruleType;
        private String condition;  // Rule condition expression
        private String action;     // Action to take when condition is met
        private boolean active;
        private boolean autoExecute;  // Whether to auto-execute when conditions are met
        private int priority;
        private Map<String, Object> parameters;

        public enum RuleType {
            VALIDATION,  // Validates data/operations
            CONDITION,   // Checks conditions for workflow
            ACTION,      // Triggers actions
            CONSTRAINT   // Enforces constraints
        }

        public BusinessRule(String ruleId, String ruleName, RuleType ruleType) {
            this.ruleId = ruleId;
            this.ruleName = ruleName;
            this.ruleType = ruleType;
            this.active = true;
            this.priority = 0;
            this.parameters = new HashMap<>();
        }

        // Getters and setters
        public String getRuleId() { return ruleId; }
        public String getRuleName() { return ruleName; }
        public RuleType getRuleType() { return ruleType; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public boolean isAutoExecute() { return autoExecute; }
        public void setAutoExecute(boolean autoExecute) { this.autoExecute = autoExecute; }
        public int getPriority() { return priority; }
        public void setPriority(int priority) { this.priority = priority; }
        public Map<String, Object> getParameters() { return parameters; }
    }

    /**
     * Audit Entry for access logging
     */
    public static class AuditEntry {
        private String entryId;
        private String userAddress;
        private String action;
        private Permission permission;
        private boolean allowed;
        private Instant timestamp;
        private String details;

        public AuditEntry(String userAddress, String action, Permission permission, boolean allowed) {
            this.entryId = UUID.randomUUID().toString();
            this.userAddress = userAddress;
            this.action = action;
            this.permission = permission;
            this.allowed = allowed;
            this.timestamp = Instant.now();
        }

        // Getters
        public String getEntryId() { return entryId; }
        public String getUserAddress() { return userAddress; }
        public String getAction() { return action; }
        public Permission getPermission() { return permission; }
        public boolean isAllowed() { return allowed; }
        public Instant getTimestamp() { return timestamp; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    /**
     * Traceability Link
     */
    public static class TraceabilityLink {
        private String linkId;
        private String targetType;  // CompositeToken, PrimaryToken, SecondaryToken
        private String targetId;
        private String relationship; // BINDS_TO, DERIVES_FROM, VERIFIES
        private Instant createdAt;

        public TraceabilityLink(String targetType, String targetId, String relationship) {
            this.linkId = UUID.randomUUID().toString();
            this.targetType = targetType;
            this.targetId = targetId;
            this.relationship = relationship;
            this.createdAt = Instant.now();
        }

        // Getters
        public String getLinkId() { return linkId; }
        public String getTargetType() { return targetType; }
        public String getTargetId() { return targetId; }
        public String getRelationship() { return relationship; }
        public Instant getCreatedAt() { return createdAt; }
    }

    // Private constructor - use builder
    private ActiveContract() {
        this.version = 1;
        this.status = ContractStatus.DRAFT;
        this.workflowHistory = new ArrayList<>();
        this.businessRules = new ArrayList<>();
        this.roleAssignments = new HashMap<>();
        this.accessAuditLog = new ArrayList<>();
        this.metadata = new HashMap<>();
        this.traceabilityLinks = new ArrayList<>();
        this.createdAt = Instant.now();
        this.lastUpdated = Instant.now();
    }

    /**
     * Builder pattern
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private ActiveContract contract = new ActiveContract();

        public Builder contractId(String contractId) {
            contract.contractId = contractId;
            return this;
        }

        public Builder compositeTokenId(String compositeTokenId) {
            contract.compositeTokenId = compositeTokenId;
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            contract.ownerAddress = ownerAddress;
            // Automatically assign owner role
            contract.roleAssignments.put(ownerAddress, ContractRole.OWNER);
            return this;
        }

        public Builder representativeAddress(String representativeAddress) {
            contract.representativeAddress = representativeAddress;
            if (representativeAddress != null) {
                contract.roleAssignments.put(representativeAddress, ContractRole.REPRESENTATIVE);
            }
            return this;
        }

        public Builder effectiveDate(Instant effectiveDate) {
            contract.effectiveDate = effectiveDate;
            return this;
        }

        public Builder expirationDate(Instant expirationDate) {
            contract.expirationDate = expirationDate;
            return this;
        }

        public Builder ruleTemplateId(String ruleTemplateId) {
            contract.ruleTemplateId = ruleTemplateId;
            return this;
        }

        public Builder registryId(String registryId) {
            contract.registryId = registryId;
            return this;
        }

        public ActiveContract build() {
            if (contract.contractId == null) {
                contract.contractId = "AC-" + UUID.randomUUID().toString().substring(0, 8) +
                                     "-" + System.currentTimeMillis() % 100000;
            }
            // Add creation transition
            contract.workflowHistory.add(new WorkflowTransition(
                null, ContractStatus.DRAFT, contract.ownerAddress, "Contract created"
            ));
            return contract;
        }
    }

    // ==================== Workflow Methods ====================

    /**
     * Transition workflow state
     */
    public boolean transition(ContractStatus newStatus, String initiatedBy, String reason) {
        if (!canTransitionTo(newStatus)) {
            return false;
        }

        // Check permission
        if (!hasPermission(initiatedBy, Permission.APPROVE)) {
            auditAccess(initiatedBy, "transition:" + newStatus, Permission.APPROVE, false);
            return false;
        }

        WorkflowTransition transition = new WorkflowTransition(this.status, newStatus, initiatedBy, reason);
        this.workflowHistory.add(transition);
        this.status = newStatus;
        this.lastUpdated = Instant.now();

        auditAccess(initiatedBy, "transition:" + newStatus, Permission.APPROVE, true);
        return true;
    }

    /**
     * Check if transition is valid
     */
    public boolean canTransitionTo(ContractStatus newStatus) {
        return switch (status) {
            case DRAFT -> newStatus == ContractStatus.PENDING_APPROVAL;
            case PENDING_APPROVAL -> newStatus == ContractStatus.ACTIVE || newStatus == ContractStatus.DRAFT;
            case ACTIVE -> newStatus == ContractStatus.SUSPENDED || newStatus == ContractStatus.TERMINATED;
            case SUSPENDED -> newStatus == ContractStatus.ACTIVE || newStatus == ContractStatus.TERMINATED;
            case TERMINATED -> false; // Terminal state
        };
    }

    /**
     * Submit for approval
     */
    public boolean submitForApproval(String initiatedBy) {
        return transition(ContractStatus.PENDING_APPROVAL, initiatedBy, "Submitted for VVB verification");
    }

    /**
     * Activate contract (requires VVB verification)
     */
    public boolean activate(String initiatedBy) {
        if (!vvbVerified) {
            return false;
        }
        return transition(ContractStatus.ACTIVE, initiatedBy, "VVB verified and activated");
    }

    /**
     * Suspend contract
     */
    public boolean suspend(String initiatedBy, String reason) {
        return transition(ContractStatus.SUSPENDED, initiatedBy, reason);
    }

    /**
     * Resume from suspension
     */
    public boolean resume(String initiatedBy, String reason) {
        return transition(ContractStatus.ACTIVE, initiatedBy, reason);
    }

    /**
     * Terminate contract
     */
    public boolean terminate(String initiatedBy, String reason) {
        if (!hasPermission(initiatedBy, Permission.TERMINATE)) {
            auditAccess(initiatedBy, "terminate", Permission.TERMINATE, false);
            return false;
        }
        return transition(ContractStatus.TERMINATED, initiatedBy, reason);
    }

    // ==================== VVB Verification ====================

    /**
     * Record VVB verification
     */
    public void recordVVBVerification(String verifierId, boolean approved) {
        if (approved) {
            this.vvbVerified = true;
            this.vvbVerifierId = verifierId;
            this.vvbVerifiedAt = Instant.now();
        }
        this.lastUpdated = Instant.now();
    }

    // ==================== RBAC Methods ====================

    /**
     * Assign role to address
     */
    public void assignRole(String address, ContractRole role, String assignedBy) {
        if (!hasPermission(assignedBy, Permission.DELEGATE)) {
            auditAccess(assignedBy, "assignRole:" + address, Permission.DELEGATE, false);
            return;
        }
        roleAssignments.put(address, role);
        auditAccess(assignedBy, "assignRole:" + address + ":" + role, Permission.DELEGATE, true);
        lastUpdated = Instant.now();
    }

    /**
     * Remove role from address
     */
    public void removeRole(String address, String removedBy) {
        if (!hasPermission(removedBy, Permission.DELEGATE)) {
            return;
        }
        roleAssignments.remove(address);
        lastUpdated = Instant.now();
    }

    /**
     * Check if address has specific permission
     */
    public boolean hasPermission(String address, Permission permission) {
        ContractRole role = roleAssignments.get(address);
        if (role == null) {
            return false;
        }
        return role.hasPermission(permission);
    }

    /**
     * Get role for address
     */
    public ContractRole getRole(String address) {
        return roleAssignments.get(address);
    }

    /**
     * Audit access attempt
     */
    private void auditAccess(String address, String action, Permission permission, boolean allowed) {
        AuditEntry entry = new AuditEntry(address, action, permission, allowed);
        accessAuditLog.add(entry);
    }

    // ==================== Business Rules ====================

    /**
     * Add business rule
     */
    public void addBusinessRule(BusinessRule rule) {
        businessRules.add(rule);
        lastUpdated = Instant.now();
    }

    /**
     * Remove business rule
     */
    public void removeBusinessRule(String ruleId) {
        businessRules.removeIf(r -> r.getRuleId().equals(ruleId));
        lastUpdated = Instant.now();
    }

    /**
     * Get active rules by type
     */
    public List<BusinessRule> getActiveRulesByType(BusinessRule.RuleType type) {
        return businessRules.stream()
            .filter(r -> r.isActive() && r.getRuleType() == type)
            .sorted(Comparator.comparingInt(BusinessRule::getPriority).reversed())
            .toList();
    }

    // ==================== Traceability ====================

    /**
     * Add traceability link
     */
    public void addTraceabilityLink(String targetType, String targetId, String relationship) {
        traceabilityLinks.add(new TraceabilityLink(targetType, targetId, relationship));
        lastUpdated = Instant.now();
    }

    /**
     * Get navigation path to token
     */
    public List<TraceabilityLink> getNavigationPath() {
        return new ArrayList<>(traceabilityLinks);
    }

    // ==================== Getters ====================

    public String getContractId() { return contractId; }
    public String getCompositeTokenId() { return compositeTokenId; }
    public int getVersion() { return version; }
    public String getPreviousVersionId() { return previousVersionId; }
    public String getOwnerAddress() { return ownerAddress; }
    public String getRepresentativeAddress() { return representativeAddress; }
    public ContractStatus getStatus() { return status; }
    public List<WorkflowTransition> getWorkflowHistory() { return workflowHistory; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getEffectiveDate() { return effectiveDate; }
    public Instant getExpirationDate() { return expirationDate; }
    public Instant getLastUpdated() { return lastUpdated; }
    public boolean isVvbVerified() { return vvbVerified; }
    public String getVvbVerifierId() { return vvbVerifierId; }
    public Instant getVvbVerifiedAt() { return vvbVerifiedAt; }
    public List<BusinessRule> getBusinessRules() { return businessRules; }
    public String getRuleTemplateId() { return ruleTemplateId; }
    public Map<String, ContractRole> getRoleAssignments() { return roleAssignments; }
    public List<AuditEntry> getAccessAuditLog() { return accessAuditLog; }
    public Map<String, Object> getMetadata() { return metadata; }
    public List<TraceabilityLink> getTraceabilityLinks() { return traceabilityLinks; }
    public String getRegistryId() { return registryId; }

    // Setters for mutable fields
    public void setOwnerAddress(String ownerAddress) {
        this.ownerAddress = ownerAddress;
        this.roleAssignments.put(ownerAddress, ContractRole.OWNER);
        this.lastUpdated = Instant.now();
    }

    public void setRepresentativeAddress(String representativeAddress) {
        if (this.representativeAddress != null) {
            this.roleAssignments.remove(this.representativeAddress);
        }
        this.representativeAddress = representativeAddress;
        if (representativeAddress != null) {
            this.roleAssignments.put(representativeAddress, ContractRole.REPRESENTATIVE);
        }
        this.lastUpdated = Instant.now();
    }
}
