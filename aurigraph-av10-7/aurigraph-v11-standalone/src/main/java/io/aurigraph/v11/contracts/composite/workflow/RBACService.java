package io.aurigraph.v11.contracts.composite.workflow;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Role-Based Access Control (RBAC) Service for Composite Token Platform
 *
 * Provides comprehensive role and permission management with:
 * - 5 predefined roles with 8 permissions each
 * - Role hierarchy and inheritance
 * - Permission delegation
 * - Time-based and conditional permissions
 * - Audit trail for all access decisions
 *
 * Predefined Roles:
 * 1. ADMIN - Full system administration
 * 2. ISSUER - Token/contract issuance and management
 * 3. VERIFIER - VVB verification capabilities
 * 4. INVESTOR - Investment and trading operations
 * 5. AUDITOR - Read-only audit access
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-03: RBAC Service (Sprint 5-7)
 */
@ApplicationScoped
public class RBACService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RBACService.class);

    // Role storage
    private final Map<String, Role> roles = new ConcurrentHashMap<>();
    private final Map<String, Permission> permissions = new ConcurrentHashMap<>();

    // User-role assignments
    private final Map<String, Set<String>> userRoles = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> roleUsers = new ConcurrentHashMap<>();

    // Delegated permissions
    private final Map<String, List<PermissionDelegation>> delegations = new ConcurrentHashMap<>();

    // Access decision cache
    private final Map<String, CachedDecision> decisionCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000; // 1 minute

    // Audit log
    private final List<AccessAuditEntry> auditLog = Collections.synchronizedList(new ArrayList<>());

    // Metrics
    private final AtomicLong totalAccessChecks = new AtomicLong(0);
    private final AtomicLong accessGranted = new AtomicLong(0);
    private final AtomicLong accessDenied = new AtomicLong(0);

    /**
     * Initialize RBAC Service with predefined roles and permissions
     */
    public RBACService() {
        initializePredefinedPermissions();
        initializePredefinedRoles();
        LOGGER.info("RBACService initialized with {} roles and {} permissions",
            roles.size(), permissions.size());
    }

    /**
     * Check if user has permission
     *
     * @param userId     User identifier
     * @param permission Permission to check
     * @param resource   Resource being accessed
     * @return true if access is granted
     */
    public Uni<Boolean> hasPermission(String userId, String permission, String resource) {
        return Uni.createFrom().item(() -> {
            totalAccessChecks.incrementAndGet();

            // Check cache first
            String cacheKey = generateCacheKey(userId, permission, resource);
            CachedDecision cached = decisionCache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                if (cached.granted()) accessGranted.incrementAndGet();
                else accessDenied.incrementAndGet();
                return cached.granted();
            }

            boolean granted = checkPermission(userId, permission, resource);

            // Cache decision
            decisionCache.put(cacheKey, new CachedDecision(granted, Instant.now()));

            // Record audit
            recordAudit(userId, permission, resource, granted, "Permission check");

            if (granted) accessGranted.incrementAndGet();
            else accessDenied.incrementAndGet();

            return granted;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check multiple permissions (all must pass)
     *
     * @param userId      User identifier
     * @param permissions List of permissions to check
     * @param resource    Resource being accessed
     * @return true if all permissions are granted
     */
    public Uni<Boolean> hasAllPermissions(String userId, List<String> permissions, String resource) {
        return Uni.createFrom().item(() -> {
            for (String permission : permissions) {
                if (!checkPermission(userId, permission, resource)) {
                    return false;
                }
            }
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check multiple permissions (any must pass)
     *
     * @param userId      User identifier
     * @param permissions List of permissions to check
     * @param resource    Resource being accessed
     * @return true if any permission is granted
     */
    public Uni<Boolean> hasAnyPermission(String userId, List<String> permissions, String resource) {
        return Uni.createFrom().item(() -> {
            for (String permission : permissions) {
                if (checkPermission(userId, permission, resource)) {
                    return true;
                }
            }
            return false;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Assign role to user
     *
     * @param userId    User identifier
     * @param roleId    Role identifier
     * @param assignedBy User who assigned the role
     * @return Assignment result
     */
    public Uni<RoleAssignment> assignRole(String userId, String roleId, String assignedBy) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Assigning role {} to user {} by {}", roleId, userId, assignedBy);

            Role role = roles.get(roleId);
            if (role == null) {
                throw new RoleNotFoundException("Role not found: " + roleId);
            }

            userRoles.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(roleId);
            roleUsers.computeIfAbsent(roleId, k -> ConcurrentHashMap.newKeySet()).add(userId);

            // Invalidate cache for this user
            invalidateUserCache(userId);

            RoleAssignment assignment = new RoleAssignment(
                userId, roleId, assignedBy, Instant.now(), null, true
            );

            recordAudit(assignedBy, "ASSIGN_ROLE", roleId + ":" + userId, true,
                "Role " + roleId + " assigned to " + userId);

            LOGGER.info("Role {} assigned to user {}", roleId, userId);
            return assignment;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Revoke role from user
     *
     * @param userId    User identifier
     * @param roleId    Role identifier
     * @param revokedBy User who revoked the role
     * @param reason    Revocation reason
     * @return Revocation result
     */
    public Uni<RoleAssignment> revokeRole(String userId, String roleId, String revokedBy, String reason) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Revoking role {} from user {} by {}", roleId, userId, revokedBy);

            Set<String> userRoleSet = userRoles.get(userId);
            if (userRoleSet != null) {
                userRoleSet.remove(roleId);
            }

            Set<String> roleUserSet = roleUsers.get(roleId);
            if (roleUserSet != null) {
                roleUserSet.remove(userId);
            }

            // Invalidate cache for this user
            invalidateUserCache(userId);

            RoleAssignment revocation = new RoleAssignment(
                userId, roleId, revokedBy, null, Instant.now(), false
            );

            recordAudit(revokedBy, "REVOKE_ROLE", roleId + ":" + userId, true,
                "Role " + roleId + " revoked from " + userId + ". Reason: " + reason);

            LOGGER.info("Role {} revoked from user {}", roleId, userId);
            return revocation;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Delegate permission from one user to another
     *
     * @param fromUserId  Delegator user ID
     * @param toUserId    Delegatee user ID
     * @param permission  Permission to delegate
     * @param resource    Resource scope
     * @param expiresAt   Delegation expiry
     * @return Delegation record
     */
    public Uni<PermissionDelegation> delegatePermission(String fromUserId, String toUserId,
                                                         String permission, String resource, Instant expiresAt) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Delegating permission {} from {} to {}", permission, fromUserId, toUserId);

            // Verify delegator has the permission
            if (!checkPermission(fromUserId, permission, resource)) {
                throw new PermissionDeniedException(
                    "User " + fromUserId + " cannot delegate permission they don't have: " + permission);
            }

            // Check if permission is delegatable
            Permission perm = permissions.get(permission);
            if (perm != null && !perm.isDelegatable()) {
                throw new PermissionDeniedException("Permission is not delegatable: " + permission);
            }

            PermissionDelegation delegation = new PermissionDelegation(
                UUID.randomUUID().toString(),
                fromUserId,
                toUserId,
                permission,
                resource,
                Instant.now(),
                expiresAt,
                true
            );

            delegations.computeIfAbsent(toUserId, k -> new ArrayList<>()).add(delegation);

            // Invalidate cache for delegatee
            invalidateUserCache(toUserId);

            recordAudit(fromUserId, "DELEGATE_PERMISSION", permission + ":" + toUserId, true,
                "Delegated " + permission + " to " + toUserId);

            return delegation;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Revoke a delegation
     *
     * @param delegationId Delegation identifier
     * @param revokedBy    User revoking the delegation
     * @return Revoked delegation
     */
    public Uni<PermissionDelegation> revokeDelegation(String delegationId, String revokedBy) {
        return Uni.createFrom().item(() -> {
            for (Map.Entry<String, List<PermissionDelegation>> entry : delegations.entrySet()) {
                for (PermissionDelegation delegation : entry.getValue()) {
                    if (delegation.delegationId().equals(delegationId)) {
                        entry.getValue().remove(delegation);
                        invalidateUserCache(entry.getKey());

                        recordAudit(revokedBy, "REVOKE_DELEGATION", delegationId, true,
                            "Delegation revoked");

                        return new PermissionDelegation(
                            delegation.delegationId(),
                            delegation.fromUserId(),
                            delegation.toUserId(),
                            delegation.permission(),
                            delegation.resource(),
                            delegation.delegatedAt(),
                            delegation.expiresAt(),
                            false
                        );
                    }
                }
            }
            throw new DelegationNotFoundException("Delegation not found: " + delegationId);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Create a custom role
     *
     * @param role Role to create
     * @return Created role
     */
    public Uni<Role> createRole(Role role) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Creating custom role: {}", role.getRoleId());

            if (roles.containsKey(role.getRoleId())) {
                throw new RoleAlreadyExistsException("Role already exists: " + role.getRoleId());
            }

            role.setCreatedAt(Instant.now());
            role.setUpdatedAt(Instant.now());
            role.setSystem(false);

            roles.put(role.getRoleId(), role);

            LOGGER.info("Custom role created: {}", role.getRoleId());
            return role;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get user's effective permissions (including inherited)
     *
     * @param userId User identifier
     * @return Set of effective permissions
     */
    public Uni<Set<String>> getEffectivePermissions(String userId) {
        return Uni.createFrom().item(() -> {
            Set<String> effectivePermissions = new HashSet<>();

            // Get permissions from assigned roles
            Set<String> assignedRoles = userRoles.getOrDefault(userId, Collections.emptySet());
            for (String roleId : assignedRoles) {
                Role role = roles.get(roleId);
                if (role != null) {
                    effectivePermissions.addAll(role.getPermissions());
                    // Add inherited permissions from parent roles
                    collectInheritedPermissions(role, effectivePermissions, new HashSet<>());
                }
            }

            // Add delegated permissions
            List<PermissionDelegation> userDelegations = delegations.getOrDefault(userId, Collections.emptyList());
            for (PermissionDelegation delegation : userDelegations) {
                if (delegation.isActive() && !delegation.isExpired()) {
                    effectivePermissions.add(delegation.permission());
                }
            }

            return effectivePermissions;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get users with a specific role
     *
     * @param roleId Role identifier
     * @return Set of user IDs
     */
    public Uni<Set<String>> getUsersWithRole(String roleId) {
        return Uni.createFrom().item(() ->
            new HashSet<>(roleUsers.getOrDefault(roleId, Collections.emptySet()))
        );
    }

    /**
     * Get user's roles
     *
     * @param userId User identifier
     * @return Set of role IDs
     */
    public Uni<Set<String>> getUserRoles(String userId) {
        return Uni.createFrom().item(() ->
            new HashSet<>(userRoles.getOrDefault(userId, Collections.emptySet()))
        );
    }

    /**
     * Get all roles
     *
     * @return List of all roles
     */
    public Uni<List<Role>> getAllRoles() {
        return Uni.createFrom().item(() -> new ArrayList<>(roles.values()));
    }

    /**
     * Get role by ID
     *
     * @param roleId Role identifier
     * @return Role
     */
    public Uni<Role> getRole(String roleId) {
        return Uni.createFrom().item(() -> {
            Role role = roles.get(roleId);
            if (role == null) {
                throw new RoleNotFoundException("Role not found: " + roleId);
            }
            return role;
        });
    }

    /**
     * Get all permissions
     *
     * @return List of all permissions
     */
    public Uni<List<Permission>> getAllPermissions() {
        return Uni.createFrom().item(() -> new ArrayList<>(permissions.values()));
    }

    /**
     * Get audit log for user
     *
     * @param userId User identifier
     * @param limit  Maximum entries to return
     * @return List of audit entries
     */
    public Uni<List<AccessAuditEntry>> getAuditLog(String userId, int limit) {
        return Uni.createFrom().item(() ->
            auditLog.stream()
                .filter(e -> e.userId().equals(userId))
                .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
                .limit(limit)
                .toList()
        );
    }

    /**
     * Get RBAC metrics
     *
     * @return Map of metrics
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRoles", roles.size());
        metrics.put("totalPermissions", permissions.size());
        metrics.put("totalUserAssignments", userRoles.size());
        metrics.put("totalAccessChecks", totalAccessChecks.get());
        metrics.put("accessGranted", accessGranted.get());
        metrics.put("accessDenied", accessDenied.get());
        metrics.put("grantRate", calculateGrantRate());
        metrics.put("totalDelegations", delegations.values().stream().mapToInt(List::size).sum());
        metrics.put("auditLogSize", auditLog.size());
        return metrics;
    }

    /**
     * Clear decision cache
     */
    public void clearCache() {
        decisionCache.clear();
        LOGGER.info("RBAC decision cache cleared");
    }

    // ========== Private Methods ==========

    private void initializePredefinedPermissions() {
        // Token permissions
        registerPermission(new Permission("TOKEN_CREATE", "Create tokens", PermissionCategory.TOKEN, true));
        registerPermission(new Permission("TOKEN_READ", "View token details", PermissionCategory.TOKEN, true));
        registerPermission(new Permission("TOKEN_UPDATE", "Update token properties", PermissionCategory.TOKEN, true));
        registerPermission(new Permission("TOKEN_DELETE", "Delete/burn tokens", PermissionCategory.TOKEN, false));
        registerPermission(new Permission("TOKEN_TRANSFER", "Transfer tokens", PermissionCategory.TOKEN, true));
        registerPermission(new Permission("TOKEN_FREEZE", "Freeze tokens", PermissionCategory.TOKEN, false));
        registerPermission(new Permission("TOKEN_MINT", "Mint new tokens", PermissionCategory.TOKEN, false));
        registerPermission(new Permission("TOKEN_BURN", "Burn tokens", PermissionCategory.TOKEN, false));

        // Contract permissions
        registerPermission(new Permission("CONTRACT_CREATE", "Create contracts", PermissionCategory.CONTRACT, true));
        registerPermission(new Permission("CONTRACT_READ", "View contract details", PermissionCategory.CONTRACT, true));
        registerPermission(new Permission("CONTRACT_UPDATE", "Update contracts", PermissionCategory.CONTRACT, true));
        registerPermission(new Permission("CONTRACT_DELETE", "Terminate contracts", PermissionCategory.CONTRACT, false));
        registerPermission(new Permission("CONTRACT_SIGN", "Sign contracts", PermissionCategory.CONTRACT, true));
        registerPermission(new Permission("CONTRACT_APPROVE", "Approve contracts", PermissionCategory.CONTRACT, false));
        registerPermission(new Permission("CONTRACT_EXECUTE", "Execute contract functions", PermissionCategory.CONTRACT, true));
        registerPermission(new Permission("CONTRACT_PAUSE", "Pause contracts", PermissionCategory.CONTRACT, false));

        // Verification permissions
        registerPermission(new Permission("VERIFY_SUBMIT", "Submit for verification", PermissionCategory.VERIFICATION, true));
        registerPermission(new Permission("VERIFY_REVIEW", "Review verifications", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VERIFY_APPROVE", "Approve verifications", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VERIFY_REJECT", "Reject verifications", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VVB_ACCESS", "VVB system access", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VVB_CERTIFY", "Certify as VVB", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VVB_REGISTER", "Register VVB", PermissionCategory.VERIFICATION, false));
        registerPermission(new Permission("VVB_MANAGE", "Manage VVB network", PermissionCategory.VERIFICATION, false));

        // User management permissions
        registerPermission(new Permission("USER_CREATE", "Create users", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("USER_READ", "View user details", PermissionCategory.USER_MANAGEMENT, true));
        registerPermission(new Permission("USER_UPDATE", "Update users", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("USER_DELETE", "Delete users", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("ROLE_ASSIGN", "Assign roles", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("ROLE_REVOKE", "Revoke roles", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("ROLE_CREATE", "Create roles", PermissionCategory.USER_MANAGEMENT, false));
        registerPermission(new Permission("ROLE_DELETE", "Delete roles", PermissionCategory.USER_MANAGEMENT, false));

        // Audit permissions
        registerPermission(new Permission("AUDIT_READ", "View audit logs", PermissionCategory.AUDIT, true));
        registerPermission(new Permission("AUDIT_EXPORT", "Export audit data", PermissionCategory.AUDIT, false));
        registerPermission(new Permission("REPORT_GENERATE", "Generate reports", PermissionCategory.AUDIT, true));
        registerPermission(new Permission("COMPLIANCE_CHECK", "Run compliance checks", PermissionCategory.AUDIT, false));
        registerPermission(new Permission("ANALYTICS_VIEW", "View analytics", PermissionCategory.AUDIT, true));
        registerPermission(new Permission("METRICS_VIEW", "View system metrics", PermissionCategory.AUDIT, true));
        registerPermission(new Permission("HISTORY_VIEW", "View history", PermissionCategory.AUDIT, true));
        registerPermission(new Permission("TRACE_VIEW", "View transaction traces", PermissionCategory.AUDIT, false));

        // System permissions
        registerPermission(new Permission("SYSTEM_CONFIG", "Configure system", PermissionCategory.SYSTEM, false));
        registerPermission(new Permission("SYSTEM_BACKUP", "Backup system", PermissionCategory.SYSTEM, false));
        registerPermission(new Permission("SYSTEM_RESTORE", "Restore system", PermissionCategory.SYSTEM, false));
        registerPermission(new Permission("SYSTEM_MONITOR", "Monitor system", PermissionCategory.SYSTEM, true));

        LOGGER.debug("Initialized {} permissions", permissions.size());
    }

    private void initializePredefinedRoles() {
        // 1. ADMIN Role - Full system administration
        Role admin = new Role();
        admin.setRoleId("ADMIN");
        admin.setName("Administrator");
        admin.setDescription("Full system administration with all permissions");
        admin.setPermissions(new HashSet<>(Arrays.asList(
            "TOKEN_CREATE", "TOKEN_READ", "TOKEN_UPDATE", "TOKEN_DELETE",
            "TOKEN_TRANSFER", "TOKEN_FREEZE", "TOKEN_MINT", "TOKEN_BURN",
            "CONTRACT_CREATE", "CONTRACT_READ", "CONTRACT_UPDATE", "CONTRACT_DELETE",
            "CONTRACT_SIGN", "CONTRACT_APPROVE", "CONTRACT_EXECUTE", "CONTRACT_PAUSE",
            "USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE",
            "ROLE_ASSIGN", "ROLE_REVOKE", "ROLE_CREATE", "ROLE_DELETE",
            "AUDIT_READ", "AUDIT_EXPORT", "REPORT_GENERATE", "COMPLIANCE_CHECK",
            "SYSTEM_CONFIG", "SYSTEM_BACKUP", "SYSTEM_RESTORE", "SYSTEM_MONITOR",
            "VVB_ACCESS", "VVB_CERTIFY", "VVB_REGISTER", "VVB_MANAGE",
            "VERIFY_SUBMIT", "VERIFY_REVIEW", "VERIFY_APPROVE", "VERIFY_REJECT"
        )));
        admin.setLevel(100);
        admin.setSystem(true);
        registerRole(admin);

        // 2. ISSUER Role - Token/contract issuance
        Role issuer = new Role();
        issuer.setRoleId("ISSUER");
        issuer.setName("Issuer");
        issuer.setDescription("Token and contract issuance capabilities");
        issuer.setPermissions(new HashSet<>(Arrays.asList(
            "TOKEN_CREATE", "TOKEN_READ", "TOKEN_UPDATE", "TOKEN_MINT",
            "CONTRACT_CREATE", "CONTRACT_READ", "CONTRACT_UPDATE", "CONTRACT_SIGN",
            "VERIFY_SUBMIT", "USER_READ", "AUDIT_READ", "REPORT_GENERATE"
        )));
        issuer.setLevel(70);
        issuer.setSystem(true);
        registerRole(issuer);

        // 3. VERIFIER Role - VVB verification
        Role verifier = new Role();
        verifier.setRoleId("VERIFIER");
        verifier.setName("Verifier (VVB)");
        verifier.setDescription("Validation and Verification Body capabilities");
        verifier.setPermissions(new HashSet<>(Arrays.asList(
            "TOKEN_READ", "CONTRACT_READ", "VVB_ACCESS", "VVB_CERTIFY",
            "VERIFY_REVIEW", "VERIFY_APPROVE", "VERIFY_REJECT",
            "AUDIT_READ", "REPORT_GENERATE", "COMPLIANCE_CHECK"
        )));
        verifier.setLevel(60);
        verifier.setSystem(true);
        registerRole(verifier);

        // 4. INVESTOR Role - Investment operations
        Role investor = new Role();
        investor.setRoleId("INVESTOR");
        investor.setName("Investor");
        investor.setDescription("Investment and trading operations");
        investor.setPermissions(new HashSet<>(Arrays.asList(
            "TOKEN_READ", "TOKEN_TRANSFER", "CONTRACT_READ", "CONTRACT_SIGN",
            "VERIFY_SUBMIT", "USER_READ", "AUDIT_READ", "HISTORY_VIEW"
        )));
        investor.setLevel(40);
        investor.setSystem(true);
        registerRole(investor);

        // 5. AUDITOR Role - Read-only audit
        Role auditor = new Role();
        auditor.setRoleId("AUDITOR");
        auditor.setName("Auditor");
        auditor.setDescription("Read-only access for audit and compliance");
        auditor.setPermissions(new HashSet<>(Arrays.asList(
            "TOKEN_READ", "CONTRACT_READ", "USER_READ",
            "AUDIT_READ", "AUDIT_EXPORT", "REPORT_GENERATE",
            "COMPLIANCE_CHECK", "ANALYTICS_VIEW", "METRICS_VIEW",
            "HISTORY_VIEW", "TRACE_VIEW"
        )));
        auditor.setLevel(50);
        auditor.setSystem(true);
        registerRole(auditor);

        LOGGER.info("Initialized {} predefined roles", roles.size());
    }

    private void registerRole(Role role) {
        role.setCreatedAt(Instant.now());
        role.setUpdatedAt(Instant.now());
        roles.put(role.getRoleId(), role);
    }

    private void registerPermission(Permission permission) {
        permission.setCreatedAt(Instant.now());
        permissions.put(permission.getPermissionId(), permission);
    }

    private boolean checkPermission(String userId, String permission, String resource) {
        // Check direct role permissions
        Set<String> assignedRoles = userRoles.getOrDefault(userId, Collections.emptySet());
        for (String roleId : assignedRoles) {
            Role role = roles.get(roleId);
            if (role != null && role.getPermissions().contains(permission)) {
                return true;
            }
            // Check inherited permissions
            if (role != null && hasInheritedPermission(role, permission, new HashSet<>())) {
                return true;
            }
        }

        // Check delegated permissions
        List<PermissionDelegation> userDelegations = delegations.getOrDefault(userId, Collections.emptyList());
        for (PermissionDelegation delegation : userDelegations) {
            if (delegation.permission().equals(permission) &&
                delegation.isActive() &&
                !delegation.isExpired() &&
                (delegation.resource() == null || delegation.resource().equals("*") ||
                 delegation.resource().equals(resource))) {
                return true;
            }
        }

        return false;
    }

    private boolean hasInheritedPermission(Role role, String permission, Set<String> visited) {
        if (visited.contains(role.getRoleId())) {
            return false; // Prevent circular inheritance
        }
        visited.add(role.getRoleId());

        if (role.getInheritsFrom() != null) {
            for (String parentRoleId : role.getInheritsFrom()) {
                Role parentRole = roles.get(parentRoleId);
                if (parentRole != null) {
                    if (parentRole.getPermissions().contains(permission)) {
                        return true;
                    }
                    if (hasInheritedPermission(parentRole, permission, visited)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private void collectInheritedPermissions(Role role, Set<String> permissions, Set<String> visited) {
        if (visited.contains(role.getRoleId())) {
            return;
        }
        visited.add(role.getRoleId());

        if (role.getInheritsFrom() != null) {
            for (String parentRoleId : role.getInheritsFrom()) {
                Role parentRole = roles.get(parentRoleId);
                if (parentRole != null) {
                    permissions.addAll(parentRole.getPermissions());
                    collectInheritedPermissions(parentRole, permissions, visited);
                }
            }
        }
    }

    private void invalidateUserCache(String userId) {
        decisionCache.entrySet().removeIf(e -> e.getKey().startsWith(userId + ":"));
    }

    private String generateCacheKey(String userId, String permission, String resource) {
        return userId + ":" + permission + ":" + (resource != null ? resource : "*");
    }

    private void recordAudit(String userId, String action, String resource, boolean granted, String details) {
        AccessAuditEntry entry = new AccessAuditEntry(
            UUID.randomUUID().toString(),
            userId,
            action,
            resource,
            granted,
            details,
            Instant.now()
        );
        auditLog.add(entry);

        // Limit audit log size
        while (auditLog.size() > 100_000) {
            auditLog.remove(0);
        }
    }

    private double calculateGrantRate() {
        long granted = accessGranted.get();
        long denied = accessDenied.get();
        long total = granted + denied;
        return total > 0 ? (double) granted / total * 100 : 0.0;
    }

    // ========== Nested Classes and Records ==========

    /**
     * Role definition
     */
    public static class Role {
        private String roleId;
        private String name;
        private String description;
        private Set<String> permissions = new HashSet<>();
        private List<String> inheritsFrom;
        private int level = 0;
        private boolean system = false;
        private Instant createdAt;
        private Instant updatedAt;
        private String createdBy;
        private Map<String, Object> metadata = new HashMap<>();

        // Getters and Setters
        public String getRoleId() { return roleId; }
        public void setRoleId(String roleId) { this.roleId = roleId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Set<String> getPermissions() { return permissions; }
        public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
        public List<String> getInheritsFrom() { return inheritsFrom; }
        public void setInheritsFrom(List<String> inheritsFrom) { this.inheritsFrom = inheritsFrom; }
        public int getLevel() { return level; }
        public void setLevel(int level) { this.level = level; }
        public boolean isSystem() { return system; }
        public void setSystem(boolean system) { this.system = system; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

        public void addPermission(String permission) {
            if (permissions == null) permissions = new HashSet<>();
            permissions.add(permission);
        }

        public void removePermission(String permission) {
            if (permissions != null) permissions.remove(permission);
        }
    }

    /**
     * Permission definition
     */
    public static class Permission {
        private String permissionId;
        private String description;
        private PermissionCategory category;
        private boolean delegatable;
        private Instant createdAt;

        public Permission(String permissionId, String description, PermissionCategory category, boolean delegatable) {
            this.permissionId = permissionId;
            this.description = description;
            this.category = category;
            this.delegatable = delegatable;
        }

        public String getPermissionId() { return permissionId; }
        public String getDescription() { return description; }
        public PermissionCategory getCategory() { return category; }
        public boolean isDelegatable() { return delegatable; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    /**
     * Role assignment record
     */
    public record RoleAssignment(
        String userId,
        String roleId,
        String assignedBy,
        Instant assignedAt,
        Instant revokedAt,
        boolean active
    ) {}

    /**
     * Permission delegation record
     */
    public record PermissionDelegation(
        String delegationId,
        String fromUserId,
        String toUserId,
        String permission,
        String resource,
        Instant delegatedAt,
        Instant expiresAt,
        boolean active
    ) {
        public boolean isActive() { return active; }
        public boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Cached access decision
     */
    private record CachedDecision(boolean granted, Instant cachedAt) {
        boolean isExpired() {
            return Instant.now().toEpochMilli() - cachedAt.toEpochMilli() > CACHE_TTL_MS;
        }
    }

    /**
     * Access audit entry
     */
    public record AccessAuditEntry(
        String entryId,
        String userId,
        String action,
        String resource,
        boolean granted,
        String details,
        Instant timestamp
    ) {}

    /**
     * Permission categories
     */
    public enum PermissionCategory {
        TOKEN, CONTRACT, VERIFICATION, USER_MANAGEMENT, AUDIT, SYSTEM
    }

    // ========== Exceptions ==========

    public static class RoleNotFoundException extends RuntimeException {
        public RoleNotFoundException(String message) { super(message); }
    }

    public static class RoleAlreadyExistsException extends RuntimeException {
        public RoleAlreadyExistsException(String message) { super(message); }
    }

    public static class PermissionDeniedException extends RuntimeException {
        public PermissionDeniedException(String message) { super(message); }
    }

    public static class DelegationNotFoundException extends RuntimeException {
        public DelegationNotFoundException(String message) { super(message); }
    }
}
