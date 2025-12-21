package io.aurigraph.v11.compliance.soc2;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Access Control Audit Service
 *
 * Provides comprehensive access control logging and documentation for SOC 2 compliance.
 * Implements logging for:
 *
 * - User access logging (CC6.1, CC6.2)
 * - Permission change tracking (CC6.3)
 * - Authentication event logging (CC6.1)
 * - Session management audit (CC6.1, CC6.6)
 * - Privileged access monitoring (CC6.3, CC6.7)
 *
 * This module maintains an immutable audit trail suitable for regulatory
 * examination and compliance reporting.
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class AccessControlAudit {

    @Inject
    SOC2AuditTrail soc2AuditTrail;

    // Audit event storage
    private final List<UserAccessEvent> userAccessEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<PermissionChangeEvent> permissionChangeEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<AuthenticationEvent> authenticationEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<SessionEvent> sessionEvents = Collections.synchronizedList(new ArrayList<>());
    private final List<PrivilegedAccessEvent> privilegedAccessEvents = Collections.synchronizedList(new ArrayList<>());

    // Active sessions tracking
    private final Map<String, ActiveSession> activeSessions = new ConcurrentHashMap<>();

    // User access history
    private final Map<String, List<UserAccessEvent>> userAccessHistory = new ConcurrentHashMap<>();

    // Permission snapshots for change tracking
    private final Map<String, UserPermissionSnapshot> permissionSnapshots = new ConcurrentHashMap<>();

    // Event counter
    private final AtomicLong eventCounter = new AtomicLong(0);

    // Thresholds for alerts
    private static final int FAILED_LOGIN_THRESHOLD = 5;
    private static final Duration SESSION_MAX_DURATION = Duration.ofHours(12);
    private static final Duration IDLE_SESSION_TIMEOUT = Duration.ofMinutes(30);

    // ============ User Access Logging ============

    /**
     * Log user access event
     */
    public UserAccessEvent logUserAccess(String userId, String resource, AccessType accessType,
            String sourceIp, boolean success, Map<String, Object> additionalInfo) {

        Log.debugf("Logging user access: %s accessed %s (%s)", userId, resource, accessType);

        UserAccessEvent event = new UserAccessEvent();
        event.setEventId(generateEventId("UA"));
        event.setUserId(userId);
        event.setResource(resource);
        event.setAccessType(accessType);
        event.setSourceIp(sourceIp);
        event.setSuccess(success);
        event.setTimestamp(Instant.now());
        event.setAdditionalInfo(additionalInfo != null ? new HashMap<>(additionalInfo) : new HashMap<>());

        // Determine if this is a sensitive resource
        boolean sensitive = isSensitiveResource(resource);
        event.setSensitiveResource(sensitive);

        userAccessEvents.add(event);
        userAccessHistory.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);

        // Also log to SOC2 audit trail
        if (soc2AuditTrail != null) {
            Map<String, Object> details = new HashMap<>(event.getAdditionalInfo());
            details.put("accessType", accessType.name());
            details.put("success", success);
            details.put("sourceIp", sourceIp);
            soc2AuditTrail.logDataAccess(userId, resource, accessType.name(), 1, details);
        }

        // Check for anomalies
        checkAccessAnomalies(event);

        return event;
    }

    /**
     * Log bulk resource access
     */
    public UserAccessEvent logBulkAccess(String userId, String resourceType, int recordCount,
            AccessType accessType, String sourceIp) {

        Map<String, Object> info = new HashMap<>();
        info.put("recordCount", recordCount);
        info.put("bulkOperation", true);

        return logUserAccess(userId, resourceType, accessType, sourceIp, true, info);
    }

    // ============ Permission Change Tracking ============

    /**
     * Log permission change event
     */
    public PermissionChangeEvent logPermissionChange(String targetUserId, String changedBy,
            PermissionChangeType changeType, String permission, String scope,
            String justification) {

        Log.infof("Logging permission change: %s changed %s permission for %s",
            changedBy, permission, targetUserId);

        PermissionChangeEvent event = new PermissionChangeEvent();
        event.setEventId(generateEventId("PC"));
        event.setTargetUserId(targetUserId);
        event.setChangedBy(changedBy);
        event.setChangeType(changeType);
        event.setPermission(permission);
        event.setScope(scope);
        event.setJustification(justification);
        event.setTimestamp(Instant.now());

        // Capture before/after state
        UserPermissionSnapshot currentSnapshot = permissionSnapshots.get(targetUserId);
        if (currentSnapshot != null) {
            event.setPreviousPermissions(new HashSet<>(currentSnapshot.getPermissions()));
        }

        // Update snapshot
        updatePermissionSnapshot(targetUserId, permission, changeType);

        UserPermissionSnapshot newSnapshot = permissionSnapshots.get(targetUserId);
        if (newSnapshot != null) {
            event.setNewPermissions(new HashSet<>(newSnapshot.getPermissions()));
        }

        // Determine if this is a privileged change
        boolean privileged = isPrivilegedPermission(permission);
        event.setPrivilegedChange(privileged);

        permissionChangeEvents.add(event);

        // Log to SOC2 audit trail
        if (soc2AuditTrail != null && privileged) {
            Map<String, Object> details = new HashMap<>();
            details.put("targetUser", targetUserId);
            details.put("permission", permission);
            details.put("changeType", changeType.name());
            soc2AuditTrail.logSecurityEvent(
                SOC2AuditTrail.SecurityEventType.PRIVILEGE_ESCALATION,
                changedBy, permission, changeType.name(), details);
        }

        return event;
    }

    /**
     * Log role assignment
     */
    public PermissionChangeEvent logRoleAssignment(String targetUserId, String changedBy,
            String roleName, boolean granted, String justification) {

        PermissionChangeType changeType = granted ?
            PermissionChangeType.ROLE_GRANTED : PermissionChangeType.ROLE_REVOKED;

        return logPermissionChange(targetUserId, changedBy, changeType,
            "ROLE:" + roleName, "USER", justification);
    }

    // ============ Authentication Event Logging ============

    /**
     * Log authentication event
     */
    public AuthenticationEvent logAuthentication(String userId, AuthenticationMethod method,
            boolean success, String sourceIp, String userAgent, String failureReason) {

        Log.debugf("Logging authentication: %s via %s (%s)",
            userId, method, success ? "success" : "failure");

        AuthenticationEvent event = new AuthenticationEvent();
        event.setEventId(generateEventId("AUTH"));
        event.setUserId(userId);
        event.setMethod(method);
        event.setSuccess(success);
        event.setSourceIp(sourceIp);
        event.setUserAgent(userAgent);
        event.setFailureReason(failureReason);
        event.setTimestamp(Instant.now());

        // Check for MFA
        event.setMfaUsed(method == AuthenticationMethod.MFA ||
            method == AuthenticationMethod.BIOMETRIC);

        authenticationEvents.add(event);

        // Log to SOC2 audit trail
        if (soc2AuditTrail != null) {
            soc2AuditTrail.logAuthentication(userId, method.name(), success,
                sourceIp, userAgent);
        }

        // Check for brute force attempts
        checkBruteForceAttempts(userId, sourceIp, success);

        return event;
    }

    /**
     * Log password change
     */
    public AuthenticationEvent logPasswordChange(String userId, boolean success,
            String changedBy, boolean adminReset) {

        AuthenticationEvent event = new AuthenticationEvent();
        event.setEventId(generateEventId("PWD"));
        event.setUserId(userId);
        event.setMethod(adminReset ?
            AuthenticationMethod.ADMIN_RESET : AuthenticationMethod.PASSWORD_CHANGE);
        event.setSuccess(success);
        event.setTimestamp(Instant.now());

        Map<String, Object> details = new HashMap<>();
        details.put("changedBy", changedBy);
        details.put("adminReset", adminReset);
        event.setAdditionalDetails(details);

        authenticationEvents.add(event);

        return event;
    }

    // ============ Session Management Audit ============

    /**
     * Log session creation
     */
    public SessionEvent logSessionCreation(String userId, String sessionId, String sourceIp,
            String userAgent, SessionType sessionType) {

        Log.debugf("Logging session creation: %s for user %s", sessionId, userId);

        SessionEvent event = new SessionEvent();
        event.setEventId(generateEventId("SESS"));
        event.setSessionId(sessionId);
        event.setUserId(userId);
        event.setEventType(SessionEventType.CREATED);
        event.setSessionType(sessionType);
        event.setSourceIp(sourceIp);
        event.setUserAgent(userAgent);
        event.setTimestamp(Instant.now());

        sessionEvents.add(event);

        // Track active session
        ActiveSession session = new ActiveSession();
        session.setSessionId(sessionId);
        session.setUserId(userId);
        session.setSessionType(sessionType);
        session.setSourceIp(sourceIp);
        session.setCreatedAt(Instant.now());
        session.setLastActivity(Instant.now());
        activeSessions.put(sessionId, session);

        return event;
    }

    /**
     * Log session activity
     */
    public void updateSessionActivity(String sessionId) {
        ActiveSession session = activeSessions.get(sessionId);
        if (session != null) {
            session.setLastActivity(Instant.now());
        }
    }

    /**
     * Log session termination
     */
    public SessionEvent logSessionTermination(String sessionId, SessionTerminationReason reason) {
        Log.debugf("Logging session termination: %s (%s)", sessionId, reason);

        ActiveSession session = activeSessions.remove(sessionId);

        SessionEvent event = new SessionEvent();
        event.setEventId(generateEventId("SESS"));
        event.setSessionId(sessionId);
        event.setEventType(SessionEventType.TERMINATED);
        event.setTerminationReason(reason);
        event.setTimestamp(Instant.now());

        if (session != null) {
            event.setUserId(session.getUserId());
            event.setSessionType(session.getSessionType());
            event.setSourceIp(session.getSourceIp());

            // Calculate session duration
            Duration duration = Duration.between(session.getCreatedAt(), Instant.now());
            event.setSessionDuration(duration);
        }

        sessionEvents.add(event);

        return event;
    }

    /**
     * Check for expired or idle sessions
     */
    public List<ActiveSession> checkExpiredSessions() {
        List<ActiveSession> expiredSessions = new ArrayList<>();
        Instant now = Instant.now();

        for (ActiveSession session : activeSessions.values()) {
            // Check maximum duration
            if (Duration.between(session.getCreatedAt(), now).compareTo(SESSION_MAX_DURATION) > 0) {
                expiredSessions.add(session);
                logSessionTermination(session.getSessionId(), SessionTerminationReason.MAX_DURATION);
                continue;
            }

            // Check idle timeout
            if (Duration.between(session.getLastActivity(), now).compareTo(IDLE_SESSION_TIMEOUT) > 0) {
                expiredSessions.add(session);
                logSessionTermination(session.getSessionId(), SessionTerminationReason.IDLE_TIMEOUT);
            }
        }

        return expiredSessions;
    }

    // ============ Privileged Access Monitoring ============

    /**
     * Log privileged access event
     */
    public PrivilegedAccessEvent logPrivilegedAccess(String userId, PrivilegedActionType actionType,
            String target, String justification, Map<String, Object> actionDetails) {

        Log.infof("Logging privileged access: %s performed %s on %s",
            userId, actionType, target);

        PrivilegedAccessEvent event = new PrivilegedAccessEvent();
        event.setEventId(generateEventId("PRIV"));
        event.setUserId(userId);
        event.setActionType(actionType);
        event.setTarget(target);
        event.setJustification(justification);
        event.setTimestamp(Instant.now());
        event.setActionDetails(actionDetails != null ? new HashMap<>(actionDetails) : new HashMap<>());

        // Determine risk level
        event.setRiskLevel(determineRiskLevel(actionType));

        // Check if approval was required and obtained
        boolean approvalRequired = isApprovalRequired(actionType);
        event.setApprovalRequired(approvalRequired);

        privilegedAccessEvents.add(event);

        // Alert on high-risk actions
        if (event.getRiskLevel() == RiskLevel.HIGH || event.getRiskLevel() == RiskLevel.CRITICAL) {
            triggerPrivilegedAccessAlert(event);
        }

        return event;
    }

    /**
     * Log admin console access
     */
    public PrivilegedAccessEvent logAdminConsoleAccess(String userId, String consoleType,
            String sourceIp) {

        Map<String, Object> details = new HashMap<>();
        details.put("consoleType", consoleType);
        details.put("sourceIp", sourceIp);

        return logPrivilegedAccess(userId, PrivilegedActionType.ADMIN_CONSOLE_ACCESS,
            consoleType, "Admin access", details);
    }

    /**
     * Log database direct access
     */
    public PrivilegedAccessEvent logDatabaseAccess(String userId, String database,
            String queryType, String justification) {

        Map<String, Object> details = new HashMap<>();
        details.put("database", database);
        details.put("queryType", queryType);

        return logPrivilegedAccess(userId, PrivilegedActionType.DATABASE_DIRECT_ACCESS,
            database, justification, details);
    }

    /**
     * Log configuration change
     */
    public PrivilegedAccessEvent logConfigurationChange(String userId, String configName,
            String previousValue, String newValue, String justification) {

        Map<String, Object> details = new HashMap<>();
        details.put("configName", configName);
        details.put("previousValue", maskSensitiveValue(previousValue));
        details.put("newValue", maskSensitiveValue(newValue));

        return logPrivilegedAccess(userId, PrivilegedActionType.CONFIGURATION_CHANGE,
            configName, justification, details);
    }

    // ============ Query Methods ============

    /**
     * Get user access events by user
     */
    public List<UserAccessEvent> getUserAccessEvents(String userId) {
        return userAccessHistory.getOrDefault(userId, new ArrayList<>());
    }

    /**
     * Get user access events by time range
     */
    public List<UserAccessEvent> getUserAccessEvents(Instant startTime, Instant endTime) {
        return userAccessEvents.stream()
            .filter(e -> !e.getTimestamp().isBefore(startTime) &&
                        !e.getTimestamp().isAfter(endTime))
            .toList();
    }

    /**
     * Get permission change events for a user
     */
    public List<PermissionChangeEvent> getPermissionChanges(String userId) {
        return permissionChangeEvents.stream()
            .filter(e -> userId.equals(e.getTargetUserId()))
            .toList();
    }

    /**
     * Get authentication events
     */
    public List<AuthenticationEvent> getAuthenticationEvents(String userId,
            Instant startTime, Instant endTime) {
        return authenticationEvents.stream()
            .filter(e -> userId.equals(e.getUserId()) &&
                !e.getTimestamp().isBefore(startTime) &&
                !e.getTimestamp().isAfter(endTime))
            .toList();
    }

    /**
     * Get failed authentication attempts
     */
    public List<AuthenticationEvent> getFailedAuthentications(String userId) {
        return authenticationEvents.stream()
            .filter(e -> userId.equals(e.getUserId()) && !e.isSuccess())
            .toList();
    }

    /**
     * Get active sessions
     */
    public List<ActiveSession> getActiveSessions() {
        return new ArrayList<>(activeSessions.values());
    }

    /**
     * Get active sessions for user
     */
    public List<ActiveSession> getUserActiveSessions(String userId) {
        return activeSessions.values().stream()
            .filter(s -> userId.equals(s.getUserId()))
            .toList();
    }

    /**
     * Get privileged access events
     */
    public List<PrivilegedAccessEvent> getPrivilegedAccessEvents(Instant startTime, Instant endTime) {
        return privilegedAccessEvents.stream()
            .filter(e -> !e.getTimestamp().isBefore(startTime) &&
                        !e.getTimestamp().isAfter(endTime))
            .toList();
    }

    /**
     * Get current user permissions
     */
    public Optional<UserPermissionSnapshot> getUserPermissions(String userId) {
        return Optional.ofNullable(permissionSnapshots.get(userId));
    }

    /**
     * Get access control statistics
     */
    public AccessControlStats getStats() {
        AccessControlStats stats = new AccessControlStats();

        stats.setTotalAccessEvents(userAccessEvents.size());
        stats.setTotalPermissionChanges(permissionChangeEvents.size());
        stats.setTotalAuthenticationEvents(authenticationEvents.size());
        stats.setTotalSessionEvents(sessionEvents.size());
        stats.setTotalPrivilegedAccessEvents(privilegedAccessEvents.size());
        stats.setActiveSessionCount(activeSessions.size());

        // Authentication success rate
        long successfulAuths = authenticationEvents.stream()
            .filter(AuthenticationEvent::isSuccess)
            .count();
        if (!authenticationEvents.isEmpty()) {
            stats.setAuthenticationSuccessRate(successfulAuths * 100.0 / authenticationEvents.size());
        }

        // Privileged access by risk level
        Map<RiskLevel, Long> byRiskLevel = privilegedAccessEvents.stream()
            .collect(Collectors.groupingBy(PrivilegedAccessEvent::getRiskLevel,
                Collectors.counting()));
        stats.setPrivilegedAccessByRiskLevel(byRiskLevel);

        stats.setGeneratedAt(Instant.now());
        return stats;
    }

    /**
     * Generate access control audit report
     */
    public AccessControlReport generateAuditReport(String userId, Instant startTime, Instant endTime) {
        AccessControlReport report = new AccessControlReport();
        report.setReportId("ACR-" + System.currentTimeMillis());
        report.setUserId(userId);
        report.setPeriodStart(startTime);
        report.setPeriodEnd(endTime);
        report.setGeneratedAt(Instant.now());

        // Collect all events for the user in the time range
        report.setAccessEvents(userAccessEvents.stream()
            .filter(e -> (userId == null || userId.equals(e.getUserId())) &&
                !e.getTimestamp().isBefore(startTime) &&
                !e.getTimestamp().isAfter(endTime))
            .toList());

        report.setPermissionChanges(permissionChangeEvents.stream()
            .filter(e -> (userId == null || userId.equals(e.getTargetUserId())) &&
                !e.getTimestamp().isBefore(startTime) &&
                !e.getTimestamp().isAfter(endTime))
            .toList());

        report.setAuthenticationEvents(authenticationEvents.stream()
            .filter(e -> (userId == null || userId.equals(e.getUserId())) &&
                !e.getTimestamp().isBefore(startTime) &&
                !e.getTimestamp().isAfter(endTime))
            .toList());

        report.setPrivilegedAccessEvents(privilegedAccessEvents.stream()
            .filter(e -> (userId == null || userId.equals(e.getUserId())) &&
                !e.getTimestamp().isBefore(startTime) &&
                !e.getTimestamp().isAfter(endTime))
            .toList());

        // Current permission snapshot
        if (userId != null) {
            report.setCurrentPermissions(permissionSnapshots.get(userId));
        }

        return report;
    }

    // ============ Helper Methods ============

    private String generateEventId(String prefix) {
        return String.format("%s-%d-%d", prefix, System.currentTimeMillis(),
            eventCounter.incrementAndGet());
    }

    private boolean isSensitiveResource(String resource) {
        Set<String> sensitivePatterns = Set.of(
            "user", "password", "credential", "key", "secret",
            "token", "payment", "financial", "pii", "phi"
        );
        String lower = resource.toLowerCase();
        return sensitivePatterns.stream().anyMatch(lower::contains);
    }

    private boolean isPrivilegedPermission(String permission) {
        Set<String> privilegedPermissions = Set.of(
            "ADMIN", "SUPERUSER", "ROOT", "SYSTEM",
            "DELETE_ALL", "MODIFY_SYSTEM", "ACCESS_LOGS",
            "MANAGE_USERS", "MANAGE_ROLES"
        );
        return privilegedPermissions.stream()
            .anyMatch(p -> permission.toUpperCase().contains(p));
    }

    private void updatePermissionSnapshot(String userId, String permission,
            PermissionChangeType changeType) {

        permissionSnapshots.computeIfAbsent(userId, k -> {
            UserPermissionSnapshot snapshot = new UserPermissionSnapshot();
            snapshot.setUserId(userId);
            snapshot.setPermissions(new HashSet<>());
            snapshot.setLastUpdated(Instant.now());
            return snapshot;
        });

        UserPermissionSnapshot snapshot = permissionSnapshots.get(userId);

        switch (changeType) {
            case PERMISSION_GRANTED:
            case ROLE_GRANTED:
                snapshot.getPermissions().add(permission);
                break;
            case PERMISSION_REVOKED:
            case ROLE_REVOKED:
                snapshot.getPermissions().remove(permission);
                break;
            default:
                break;
        }

        snapshot.setLastUpdated(Instant.now());
    }

    private RiskLevel determineRiskLevel(PrivilegedActionType actionType) {
        switch (actionType) {
            case DATABASE_DIRECT_ACCESS:
            case USER_IMPERSONATION:
            case SECURITY_BYPASS:
                return RiskLevel.CRITICAL;
            case CONFIGURATION_CHANGE:
            case KEY_MANAGEMENT:
            case AUDIT_LOG_ACCESS:
                return RiskLevel.HIGH;
            case ADMIN_CONSOLE_ACCESS:
            case SYSTEM_RESTART:
                return RiskLevel.MEDIUM;
            default:
                return RiskLevel.LOW;
        }
    }

    private boolean isApprovalRequired(PrivilegedActionType actionType) {
        return actionType == PrivilegedActionType.DATABASE_DIRECT_ACCESS ||
               actionType == PrivilegedActionType.USER_IMPERSONATION ||
               actionType == PrivilegedActionType.SECURITY_BYPASS ||
               actionType == PrivilegedActionType.KEY_MANAGEMENT;
    }

    private void checkAccessAnomalies(UserAccessEvent event) {
        // Would implement anomaly detection logic here
        // e.g., unusual access patterns, time-based anomalies, etc.
    }

    private void checkBruteForceAttempts(String userId, String sourceIp, boolean success) {
        if (!success) {
            // Count recent failures
            long recentFailures = authenticationEvents.stream()
                .filter(e -> userId.equals(e.getUserId()) &&
                    !e.isSuccess() &&
                    e.getTimestamp().isAfter(Instant.now().minus(Duration.ofMinutes(15))))
                .count();

            if (recentFailures >= FAILED_LOGIN_THRESHOLD) {
                Log.warnf("Possible brute force attack detected for user %s from %s",
                    userId, sourceIp);
                // Would trigger alert here
            }
        }
    }

    private void triggerPrivilegedAccessAlert(PrivilegedAccessEvent event) {
        Log.warnf("High-risk privileged access: %s performed %s on %s",
            event.getUserId(), event.getActionType(), event.getTarget());
        // Would send alert to security team
    }

    private String maskSensitiveValue(String value) {
        if (value == null || value.length() <= 4) {
            return "***";
        }
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }

    // ============ Enums ============

    public enum AccessType {
        READ, WRITE, DELETE, EXECUTE, ADMIN
    }

    public enum PermissionChangeType {
        PERMISSION_GRANTED, PERMISSION_REVOKED,
        ROLE_GRANTED, ROLE_REVOKED,
        SCOPE_CHANGED, ACCESS_LEVEL_MODIFIED
    }

    public enum AuthenticationMethod {
        PASSWORD, MFA, SSO, CERTIFICATE, API_KEY,
        BIOMETRIC, PASSWORD_CHANGE, ADMIN_RESET
    }

    public enum SessionType {
        WEB, API, MOBILE, ADMIN_CONSOLE, SERVICE_ACCOUNT
    }

    public enum SessionEventType {
        CREATED, REFRESHED, TERMINATED, TIMEOUT, REVOKED
    }

    public enum SessionTerminationReason {
        USER_LOGOUT, ADMIN_TERMINATION, IDLE_TIMEOUT,
        MAX_DURATION, SECURITY_EVENT, TOKEN_REVOKED
    }

    public enum PrivilegedActionType {
        ADMIN_CONSOLE_ACCESS, DATABASE_DIRECT_ACCESS,
        CONFIGURATION_CHANGE, USER_IMPERSONATION,
        KEY_MANAGEMENT, SECURITY_BYPASS,
        AUDIT_LOG_ACCESS, SYSTEM_RESTART,
        EMERGENCY_ACCESS, DATA_EXPORT
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    // ============ Inner Classes ============

    public static class UserAccessEvent {
        private String eventId;
        private String userId;
        private String resource;
        private AccessType accessType;
        private String sourceIp;
        private boolean success;
        private boolean sensitiveResource;
        private Instant timestamp;
        private Map<String, Object> additionalInfo = new HashMap<>();

        // Getters and Setters
        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getResource() { return resource; }
        public void setResource(String resource) { this.resource = resource; }
        public AccessType getAccessType() { return accessType; }
        public void setAccessType(AccessType type) { this.accessType = type; }
        public String getSourceIp() { return sourceIp; }
        public void setSourceIp(String ip) { this.sourceIp = ip; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public boolean isSensitiveResource() { return sensitiveResource; }
        public void setSensitiveResource(boolean sensitive) { this.sensitiveResource = sensitive; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public Map<String, Object> getAdditionalInfo() { return additionalInfo; }
        public void setAdditionalInfo(Map<String, Object> info) { this.additionalInfo = info; }
    }

    public static class PermissionChangeEvent {
        private String eventId;
        private String targetUserId;
        private String changedBy;
        private PermissionChangeType changeType;
        private String permission;
        private String scope;
        private String justification;
        private boolean privilegedChange;
        private Set<String> previousPermissions;
        private Set<String> newPermissions;
        private Instant timestamp;

        // Getters and Setters
        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public String getTargetUserId() { return targetUserId; }
        public void setTargetUserId(String userId) { this.targetUserId = userId; }
        public String getChangedBy() { return changedBy; }
        public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
        public PermissionChangeType getChangeType() { return changeType; }
        public void setChangeType(PermissionChangeType type) { this.changeType = type; }
        public String getPermission() { return permission; }
        public void setPermission(String permission) { this.permission = permission; }
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public boolean isPrivilegedChange() { return privilegedChange; }
        public void setPrivilegedChange(boolean privileged) { this.privilegedChange = privileged; }
        public Set<String> getPreviousPermissions() { return previousPermissions; }
        public void setPreviousPermissions(Set<String> perms) { this.previousPermissions = perms; }
        public Set<String> getNewPermissions() { return newPermissions; }
        public void setNewPermissions(Set<String> perms) { this.newPermissions = perms; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public static class AuthenticationEvent {
        private String eventId;
        private String userId;
        private AuthenticationMethod method;
        private boolean success;
        private String sourceIp;
        private String userAgent;
        private String failureReason;
        private boolean mfaUsed;
        private Instant timestamp;
        private Map<String, Object> additionalDetails = new HashMap<>();

        // Getters and Setters
        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public AuthenticationMethod getMethod() { return method; }
        public void setMethod(AuthenticationMethod method) { this.method = method; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getSourceIp() { return sourceIp; }
        public void setSourceIp(String ip) { this.sourceIp = ip; }
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String agent) { this.userAgent = agent; }
        public String getFailureReason() { return failureReason; }
        public void setFailureReason(String reason) { this.failureReason = reason; }
        public boolean isMfaUsed() { return mfaUsed; }
        public void setMfaUsed(boolean mfa) { this.mfaUsed = mfa; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public Map<String, Object> getAdditionalDetails() { return additionalDetails; }
        public void setAdditionalDetails(Map<String, Object> details) { this.additionalDetails = details; }
    }

    public static class SessionEvent {
        private String eventId;
        private String sessionId;
        private String userId;
        private SessionEventType eventType;
        private SessionType sessionType;
        private SessionTerminationReason terminationReason;
        private String sourceIp;
        private String userAgent;
        private Duration sessionDuration;
        private Instant timestamp;

        // Getters and Setters
        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public SessionEventType getEventType() { return eventType; }
        public void setEventType(SessionEventType type) { this.eventType = type; }
        public SessionType getSessionType() { return sessionType; }
        public void setSessionType(SessionType type) { this.sessionType = type; }
        public SessionTerminationReason getTerminationReason() { return terminationReason; }
        public void setTerminationReason(SessionTerminationReason reason) { this.terminationReason = reason; }
        public String getSourceIp() { return sourceIp; }
        public void setSourceIp(String ip) { this.sourceIp = ip; }
        public String getUserAgent() { return userAgent; }
        public void setUserAgent(String agent) { this.userAgent = agent; }
        public Duration getSessionDuration() { return sessionDuration; }
        public void setSessionDuration(Duration duration) { this.sessionDuration = duration; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public static class ActiveSession {
        private String sessionId;
        private String userId;
        private SessionType sessionType;
        private String sourceIp;
        private Instant createdAt;
        private Instant lastActivity;

        // Getters and Setters
        public String getSessionId() { return sessionId; }
        public void setSessionId(String id) { this.sessionId = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public SessionType getSessionType() { return sessionType; }
        public void setSessionType(SessionType type) { this.sessionType = type; }
        public String getSourceIp() { return sourceIp; }
        public void setSourceIp(String ip) { this.sourceIp = ip; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant at) { this.createdAt = at; }
        public Instant getLastActivity() { return lastActivity; }
        public void setLastActivity(Instant at) { this.lastActivity = at; }
    }

    public static class PrivilegedAccessEvent {
        private String eventId;
        private String userId;
        private PrivilegedActionType actionType;
        private String target;
        private String justification;
        private RiskLevel riskLevel;
        private boolean approvalRequired;
        private Instant timestamp;
        private Map<String, Object> actionDetails = new HashMap<>();

        // Getters and Setters
        public String getEventId() { return eventId; }
        public void setEventId(String id) { this.eventId = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public PrivilegedActionType getActionType() { return actionType; }
        public void setActionType(PrivilegedActionType type) { this.actionType = type; }
        public String getTarget() { return target; }
        public void setTarget(String target) { this.target = target; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public RiskLevel getRiskLevel() { return riskLevel; }
        public void setRiskLevel(RiskLevel level) { this.riskLevel = level; }
        public boolean isApprovalRequired() { return approvalRequired; }
        public void setApprovalRequired(boolean required) { this.approvalRequired = required; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public Map<String, Object> getActionDetails() { return actionDetails; }
        public void setActionDetails(Map<String, Object> details) { this.actionDetails = details; }
    }

    public static class UserPermissionSnapshot {
        private String userId;
        private Set<String> permissions = new HashSet<>();
        private Instant lastUpdated;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Set<String> getPermissions() { return permissions; }
        public void setPermissions(Set<String> perms) { this.permissions = perms; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant at) { this.lastUpdated = at; }
    }

    public static class AccessControlStats {
        private long totalAccessEvents;
        private long totalPermissionChanges;
        private long totalAuthenticationEvents;
        private long totalSessionEvents;
        private long totalPrivilegedAccessEvents;
        private long activeSessionCount;
        private double authenticationSuccessRate;
        private Map<RiskLevel, Long> privilegedAccessByRiskLevel = new HashMap<>();
        private Instant generatedAt;

        // Getters and Setters
        public long getTotalAccessEvents() { return totalAccessEvents; }
        public void setTotalAccessEvents(long count) { this.totalAccessEvents = count; }
        public long getTotalPermissionChanges() { return totalPermissionChanges; }
        public void setTotalPermissionChanges(long count) { this.totalPermissionChanges = count; }
        public long getTotalAuthenticationEvents() { return totalAuthenticationEvents; }
        public void setTotalAuthenticationEvents(long count) { this.totalAuthenticationEvents = count; }
        public long getTotalSessionEvents() { return totalSessionEvents; }
        public void setTotalSessionEvents(long count) { this.totalSessionEvents = count; }
        public long getTotalPrivilegedAccessEvents() { return totalPrivilegedAccessEvents; }
        public void setTotalPrivilegedAccessEvents(long count) { this.totalPrivilegedAccessEvents = count; }
        public long getActiveSessionCount() { return activeSessionCount; }
        public void setActiveSessionCount(long count) { this.activeSessionCount = count; }
        public double getAuthenticationSuccessRate() { return authenticationSuccessRate; }
        public void setAuthenticationSuccessRate(double rate) { this.authenticationSuccessRate = rate; }
        public Map<RiskLevel, Long> getPrivilegedAccessByRiskLevel() { return privilegedAccessByRiskLevel; }
        public void setPrivilegedAccessByRiskLevel(Map<RiskLevel, Long> map) { this.privilegedAccessByRiskLevel = map; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }

    public static class AccessControlReport {
        private String reportId;
        private String userId;
        private Instant periodStart;
        private Instant periodEnd;
        private List<UserAccessEvent> accessEvents;
        private List<PermissionChangeEvent> permissionChanges;
        private List<AuthenticationEvent> authenticationEvents;
        private List<PrivilegedAccessEvent> privilegedAccessEvents;
        private UserPermissionSnapshot currentPermissions;
        private Instant generatedAt;

        // Getters and Setters
        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Instant getPeriodStart() { return periodStart; }
        public void setPeriodStart(Instant start) { this.periodStart = start; }
        public Instant getPeriodEnd() { return periodEnd; }
        public void setPeriodEnd(Instant end) { this.periodEnd = end; }
        public List<UserAccessEvent> getAccessEvents() { return accessEvents; }
        public void setAccessEvents(List<UserAccessEvent> events) { this.accessEvents = events; }
        public List<PermissionChangeEvent> getPermissionChanges() { return permissionChanges; }
        public void setPermissionChanges(List<PermissionChangeEvent> changes) { this.permissionChanges = changes; }
        public List<AuthenticationEvent> getAuthenticationEvents() { return authenticationEvents; }
        public void setAuthenticationEvents(List<AuthenticationEvent> events) { this.authenticationEvents = events; }
        public List<PrivilegedAccessEvent> getPrivilegedAccessEvents() { return privilegedAccessEvents; }
        public void setPrivilegedAccessEvents(List<PrivilegedAccessEvent> events) { this.privilegedAccessEvents = events; }
        public UserPermissionSnapshot getCurrentPermissions() { return currentPermissions; }
        public void setCurrentPermissions(UserPermissionSnapshot snapshot) { this.currentPermissions = snapshot; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }
}
