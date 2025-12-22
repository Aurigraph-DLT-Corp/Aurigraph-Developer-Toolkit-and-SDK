package io.aurigraph.v11.token.hybrid;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * TokenOperator - ERC-1400/ERC-777 compliant operator management
 *
 * Implements operator permissions following ERC-1400 and ERC-777 standards.
 * Operators can perform actions on behalf of token holders, including
 * transfers, issuances, and redemptions with proper authorization.
 *
 * Key Features:
 * - Authorized operators per holder
 * - Default operators (token-wide)
 * - Operator permissions by scope
 * - Operator delegation and revocation
 * - Controller (issuer) privileges
 * - Operator action logging
 *
 * Use Cases:
 * - Custodians managing client tokens
 * - Issuers performing forced transfers (regulatory)
 * - Authorized agents executing trades
 * - Transfer agents handling corporate actions
 *
 * @author Aurigraph V12 Token Team
 * @since V12.0.0
 */
@ApplicationScoped
public class TokenOperator {

    // Operators by holder: tokenId -> holderAddress -> Set<operatorAddress>
    private final Map<String, Map<String, Set<String>>> operatorsByHolder = new ConcurrentHashMap<>();

    // Operator details: tokenId -> operatorAddress -> OperatorInfo
    private final Map<String, Map<String, OperatorInfo>> operatorInfo = new ConcurrentHashMap<>();

    // Default operators (token-wide): tokenId -> Set<operatorAddress>
    private final Map<String, Set<String>> defaultOperators = new ConcurrentHashMap<>();

    // Controllers (issuers with force-transfer rights): tokenId ->
    // Set<controllerAddress>
    private final Map<String, Set<String>> controllers = new ConcurrentHashMap<>();

    // Operator permissions: tokenId -> operatorAddress -> holderAddress ->
    // Set<Permission>
    private final Map<String, Map<String, Map<String, Set<OperatorPermission>>>> operatorPermissions = new ConcurrentHashMap<>();

    // Operator action log: tokenId -> List<OperatorAction>
    private final Map<String, List<OperatorAction>> operatorActionLog = new ConcurrentHashMap<>();

    /**
     * Authorize an operator for a specific holder
     * ERC-777: authorizeOperator
     */
    public Uni<OperatorResult> authorizeOperator(AuthorizeOperatorRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Authorizing operator %s for holder %s on token %s",
                    request.operator(), request.holder(), request.tokenId());

            validateOperatorRequest(request);

            // Add to operators set
            operatorsByHolder.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(request.holder(), k -> ConcurrentHashMap.newKeySet())
                    .add(request.operator());

            // Store operator info
            OperatorInfo info = new OperatorInfo(
                    request.operator(),
                    request.tokenId(),
                    request.operatorType(),
                    request.name(),
                    request.description(),
                    request.contact(),
                    request.metadata(),
                    Instant.now(),
                    request.expiryDate(),
                    OperatorStatus.ACTIVE,
                    request.holder());

            operatorInfo.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .put(request.operator() + ":" + request.holder(), info);

            // Set permissions
            Set<OperatorPermission> permissions = request.permissions() != null ? new HashSet<>(request.permissions())
                    : EnumSet.of(OperatorPermission.TRANSFER); // Default permission

            operatorPermissions.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(request.operator(), k -> new ConcurrentHashMap<>())
                    .put(request.holder(), permissions);

            // Log action
            logAction(request.tokenId(), new OperatorAction(
                    UUID.randomUUID().toString(),
                    request.tokenId(),
                    request.operator(),
                    request.holder(),
                    OperatorActionType.AUTHORIZE,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Operator authorized"));

            Log.infof("Operator %s authorized for holder %s with permissions: %s",
                    request.operator(), request.holder(), permissions);

            return new OperatorResult(
                    true,
                    request.operator(),
                    request.holder(),
                    request.tokenId(),
                    "Operator authorized successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Revoke an operator for a specific holder
     * ERC-777: revokeOperator
     */
    public Uni<OperatorResult> revokeOperator(String tokenId, String holder, String operator, String revoker) {
        return Uni.createFrom().item(() -> {
            Log.infof("Revoking operator %s for holder %s on token %s", operator, holder, tokenId);

            // Verify revoker has authority (must be holder or controller)
            if (!holder.equals(revoker) && !isController(tokenId, revoker)) {
                throw new OperatorException("Only holder or controller can revoke operators");
            }

            Map<String, Set<String>> holderOperators = operatorsByHolder.get(tokenId);
            if (holderOperators != null) {
                Set<String> operators = holderOperators.get(holder);
                if (operators != null) {
                    operators.remove(operator);
                }
            }

            // Update operator info status
            Map<String, OperatorInfo> infos = operatorInfo.get(tokenId);
            if (infos != null) {
                OperatorInfo info = infos.get(operator + ":" + holder);
                if (info != null) {
                    infos.put(operator + ":" + holder, info.withStatus(OperatorStatus.REVOKED));
                }
            }

            // Remove permissions
            Map<String, Map<String, Set<OperatorPermission>>> tokenPerms = operatorPermissions.get(tokenId);
            if (tokenPerms != null) {
                Map<String, Set<OperatorPermission>> opPerms = tokenPerms.get(operator);
                if (opPerms != null) {
                    opPerms.remove(holder);
                }
            }

            // Log action
            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    operator,
                    holder,
                    OperatorActionType.REVOKE,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Operator revoked by " + revoker));

            return new OperatorResult(
                    true,
                    operator,
                    holder,
                    tokenId,
                    "Operator revoked successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add a default operator (token-wide)
     */
    public Uni<OperatorResult> addDefaultOperator(String tokenId, String operator, AddDefaultOperatorRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Adding default operator %s for token %s", operator, tokenId);

            // Only controllers can add default operators
            if (!isController(tokenId, request.addedBy())) {
                throw new OperatorException("Only controllers can add default operators");
            }

            defaultOperators.computeIfAbsent(tokenId, k -> ConcurrentHashMap.newKeySet())
                    .add(operator);

            // Store operator info with null holder (indicates default operator)
            OperatorInfo info = new OperatorInfo(
                    operator,
                    tokenId,
                    request.operatorType(),
                    request.name(),
                    request.description(),
                    request.contact(),
                    request.metadata(),
                    Instant.now(),
                    request.expiryDate(),
                    OperatorStatus.ACTIVE,
                    null // Default operator - applies to all
            );

            operatorInfo.computeIfAbsent(tokenId, k -> new ConcurrentHashMap<>())
                    .put(operator + ":default", info);

            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    operator,
                    null,
                    OperatorActionType.ADD_DEFAULT,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Default operator added by " + request.addedBy()));

            return new OperatorResult(
                    true,
                    operator,
                    null,
                    tokenId,
                    "Default operator added successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove a default operator
     */
    public Uni<OperatorResult> removeDefaultOperator(String tokenId, String operator, String removedBy) {
        return Uni.createFrom().item(() -> {
            Log.infof("Removing default operator %s from token %s", operator, tokenId);

            if (!isController(tokenId, removedBy)) {
                throw new OperatorException("Only controllers can remove default operators");
            }

            Set<String> defaults = defaultOperators.get(tokenId);
            if (defaults != null) {
                defaults.remove(operator);
            }

            Map<String, OperatorInfo> infos = operatorInfo.get(tokenId);
            if (infos != null) {
                infos.remove(operator + ":default");
            }

            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    operator,
                    null,
                    OperatorActionType.REMOVE_DEFAULT,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Default operator removed by " + removedBy));

            return new OperatorResult(
                    true,
                    operator,
                    null,
                    tokenId,
                    "Default operator removed successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add a controller (issuer with force-transfer rights)
     */
    public Uni<OperatorResult> addController(String tokenId, String controller, String addedBy) {
        return Uni.createFrom().item(() -> {
            Log.infof("Adding controller %s for token %s", controller, tokenId);

            controllers.computeIfAbsent(tokenId, k -> ConcurrentHashMap.newKeySet())
                    .add(controller);

            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    controller,
                    null,
                    OperatorActionType.ADD_CONTROLLER,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Controller added by " + addedBy));

            return new OperatorResult(
                    true,
                    controller,
                    null,
                    tokenId,
                    "Controller added successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove a controller
     */
    public Uni<OperatorResult> removeController(String tokenId, String controller, String removedBy) {
        return Uni.createFrom().item(() -> {
            Log.infof("Removing controller %s from token %s", controller, tokenId);

            Set<String> tokenControllers = controllers.get(tokenId);
            if (tokenControllers != null) {
                // Ensure at least one controller remains
                if (tokenControllers.size() <= 1) {
                    throw new OperatorException("Cannot remove last controller");
                }
                tokenControllers.remove(controller);
            }

            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    controller,
                    null,
                    OperatorActionType.REMOVE_CONTROLLER,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Controller removed by " + removedBy));

            return new OperatorResult(
                    true,
                    controller,
                    null,
                    tokenId,
                    "Controller removed successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if an address is an operator for a holder
     * ERC-777: isOperatorFor
     */
    public Uni<Boolean> isOperatorFor(String tokenId, String operator, String holder) {
        return Uni.createFrom().item(() -> {
            // Check if operator is a default operator
            Set<String> defaults = defaultOperators.get(tokenId);
            if (defaults != null && defaults.contains(operator)) {
                return true;
            }

            // Check if operator is authorized for this holder
            Map<String, Set<String>> holderOperators = operatorsByHolder.get(tokenId);
            if (holderOperators == null) {
                return false;
            }
            Set<String> operators = holderOperators.get(holder);
            if (operators == null) {
                return false;
            }

            if (operators.contains(operator)) {
                // Check if operator is not expired
                Map<String, OperatorInfo> infos = operatorInfo.get(tokenId);
                if (infos != null) {
                    OperatorInfo info = infos.get(operator + ":" + holder);
                    if (info != null && info.status() == OperatorStatus.ACTIVE) {
                        if (info.expiryDate() == null || info.expiryDate().isAfter(Instant.now())) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if an address is a controller
     * ERC-1400: isControllable
     */
    public Uni<Boolean> isControllable(String tokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenControllers = controllers.get(tokenId);
            return tokenControllers != null && !tokenControllers.isEmpty();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if address is a controller
     */
    public boolean isController(String tokenId, String address) {
        Set<String> tokenControllers = controllers.get(tokenId);
        return tokenControllers != null && tokenControllers.contains(address);
    }

    /**
     * Check if operator has specific permission
     */
    public Uni<Boolean> hasPermission(String tokenId, String operator, String holder, OperatorPermission permission) {
        return Uni.createFrom().item(() -> {
            // Controllers have all permissions
            if (isController(tokenId, operator)) {
                return true;
            }

            // Check default operator permissions
            Set<String> defaults = defaultOperators.get(tokenId);
            if (defaults != null && defaults.contains(operator)) {
                // Default operators typically have all standard permissions
                return true;
            }

            // Check specific permissions
            Map<String, Map<String, Set<OperatorPermission>>> tokenPerms = operatorPermissions.get(tokenId);
            if (tokenPerms == null) {
                return false;
            }
            Map<String, Set<OperatorPermission>> opPerms = tokenPerms.get(operator);
            if (opPerms == null) {
                return false;
            }
            Set<OperatorPermission> perms = opPerms.get(holder);
            return perms != null && perms.contains(permission);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all operators for a holder
     */
    public Uni<List<String>> getOperatorsFor(String tokenId, String holder) {
        return Uni.createFrom().item(() -> {
            List<String> operators = new ArrayList<>();

            // Add default operators
            Set<String> defaults = defaultOperators.get(tokenId);
            if (defaults != null) {
                operators.addAll(defaults);
            }

            // Add holder-specific operators
            Map<String, Set<String>> holderOperators = operatorsByHolder.get(tokenId);
            if (holderOperators != null) {
                Set<String> ops = holderOperators.get(holder);
                if (ops != null) {
                    operators.addAll(ops);
                }
            }

            return (List<String>) operators.stream().distinct().collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all controllers for a token
     */
    public Uni<List<String>> getControllers(String tokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenControllers = controllers.get(tokenId);
            if (tokenControllers == null) {
                return (List<String>) Collections.<String>emptyList();
            }
            return (List<String>) new ArrayList<>(tokenControllers);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get default operators for a token
     */
    public Uni<List<String>> getDefaultOperators(String tokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> defaults = defaultOperators.get(tokenId);
            if (defaults == null) {
                return (List<String>) Collections.<String>emptyList();
            }
            return (List<String>) new ArrayList<>(defaults);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get operator info
     */
    public Uni<Optional<OperatorInfo>> getOperatorInfo(String tokenId, String operator, String holder) {
        return Uni.createFrom().item(() -> {
            Map<String, OperatorInfo> infos = operatorInfo.get(tokenId);
            if (infos == null) {
                return Optional.<OperatorInfo>empty();
            }
            String key = holder != null ? operator + ":" + holder : operator + ":default";
            return Optional.ofNullable(infos.get(key));
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get operator permissions for a holder
     */
    public Uni<Set<OperatorPermission>> getPermissions(String tokenId, String operator, String holder) {
        return Uni.createFrom().item(() -> {
            // Controllers have all permissions
            if (isController(tokenId, operator)) {
                return (Set<OperatorPermission>) EnumSet.allOf(OperatorPermission.class);
            }

            Map<String, Map<String, Set<OperatorPermission>>> tokenPerms = operatorPermissions.get(tokenId);
            if (tokenPerms == null) {
                return (Set<OperatorPermission>) Collections.<OperatorPermission>emptySet();
            }
            Map<String, Set<OperatorPermission>> opPerms = tokenPerms.get(operator);
            if (opPerms == null) {
                return (Set<OperatorPermission>) Collections.<OperatorPermission>emptySet();
            }
            Set<OperatorPermission> perms = opPerms.get(holder);
            return perms != null ? new HashSet<>(perms)
                    : (Set<OperatorPermission>) Collections.<OperatorPermission>emptySet();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update operator permissions
     */
    public Uni<OperatorResult> updatePermissions(
            String tokenId,
            String operator,
            String holder,
            Set<OperatorPermission> newPermissions,
            String updater) {

        return Uni.createFrom().item(() -> {
            Log.infof("Updating permissions for operator %s (holder: %s) on token %s",
                    operator, holder, tokenId);

            // Verify updater has authority
            if (!holder.equals(updater) && !isController(tokenId, updater)) {
                throw new OperatorException("Only holder or controller can update permissions");
            }

            operatorPermissions.computeIfAbsent(tokenId, k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(operator, k -> new ConcurrentHashMap<>())
                    .put(holder, new HashSet<>(newPermissions));

            logAction(tokenId, new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    operator,
                    holder,
                    OperatorActionType.UPDATE_PERMISSIONS,
                    null,
                    null,
                    null,
                    Instant.now(),
                    "Permissions updated to: " + newPermissions));

            return new OperatorResult(
                    true,
                    operator,
                    holder,
                    tokenId,
                    "Permissions updated successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Log an operator action
     */
    public Uni<Void> logOperatorAction(
            String tokenId,
            String operator,
            String holder,
            OperatorActionType actionType,
            String from,
            String to,
            String amount,
            String details) {

        return Uni.createFrom().item(() -> {
            OperatorAction action = new OperatorAction(
                    UUID.randomUUID().toString(),
                    tokenId,
                    operator,
                    holder,
                    actionType,
                    from,
                    to,
                    amount,
                    Instant.now(),
                    details);
            logAction(tokenId, action);
            return null;
        }).replaceWithVoid().runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get operator action history
     */
    public Uni<List<OperatorAction>> getOperatorActionHistory(String tokenId) {
        return Uni.createFrom().item(() -> {
            List<OperatorAction> actions = operatorActionLog.get(tokenId);
            if (actions == null) {
                return (List<OperatorAction>) Collections.<OperatorAction>emptyList();
            }
            return (List<OperatorAction>) new ArrayList<>(actions);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get operator actions by operator
     */
    public Uni<List<OperatorAction>> getActionsByOperator(String tokenId, String operator) {
        return Uni.createFrom().item(() -> {
            List<OperatorAction> actions = operatorActionLog.get(tokenId);
            if (actions == null) {
                return (List<OperatorAction>) Collections.<OperatorAction>emptyList();
            }
            return actions.stream()
                    .filter(a -> operator.equals(a.operator()))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private void validateOperatorRequest(AuthorizeOperatorRequest request) {
        if (request.tokenId() == null || request.tokenId().isBlank()) {
            throw new OperatorException("Token ID is required");
        }
        if (request.operator() == null || request.operator().isBlank()) {
            throw new OperatorException("Operator address is required");
        }
        if (request.holder() == null || request.holder().isBlank()) {
            throw new OperatorException("Holder address is required");
        }
        if (request.operator().equals(request.holder())) {
            throw new OperatorException("Cannot authorize self as operator");
        }
    }

    private void logAction(String tokenId, OperatorAction action) {
        operatorActionLog.computeIfAbsent(tokenId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(action);
    }

    // Record types for operator management

    /**
     * Operator information
     */
    public record OperatorInfo(
            String operatorAddress,
            String tokenId,
            OperatorType operatorType,
            String name,
            String description,
            String contact,
            Map<String, Object> metadata,
            Instant authorizedAt,
            Instant expiryDate,
            OperatorStatus status,
            String forHolder // null for default operators
    ) {
        public OperatorInfo withStatus(OperatorStatus newStatus) {
            return new OperatorInfo(
                    operatorAddress, tokenId, operatorType, name, description, contact,
                    metadata, authorizedAt, expiryDate, newStatus, forHolder);
        }
    }

    /**
     * Request to authorize an operator
     */
    public record AuthorizeOperatorRequest(
            String tokenId,
            String operator,
            String holder,
            OperatorType operatorType,
            String name,
            String description,
            String contact,
            Map<String, Object> metadata,
            Instant expiryDate,
            List<OperatorPermission> permissions) {
    }

    /**
     * Request to add a default operator
     */
    public record AddDefaultOperatorRequest(
            OperatorType operatorType,
            String name,
            String description,
            String contact,
            Map<String, Object> metadata,
            Instant expiryDate,
            String addedBy) {
    }

    /**
     * Operator types
     */
    public enum OperatorType {
        CUSTODIAN, // Custodian managing assets
        TRANSFER_AGENT, // Transfer agent for corporate actions
        BROKER_DEALER, // Licensed broker-dealer
        EXCHANGE, // Exchange platform
        MARKET_MAKER, // Market maker
        FUND_MANAGER, // Fund/asset manager
        ADMINISTRATOR, // Fund administrator
        REGISTRAR, // Token registrar
        ISSUER_AGENT, // Agent of the issuer
        COMPLIANCE, // Compliance officer
        OTHER
    }

    /**
     * Operator status
     */
    public enum OperatorStatus {
        PENDING, // Pending approval
        ACTIVE, // Active and authorized
        SUSPENDED, // Temporarily suspended
        REVOKED, // Revoked authorization
        EXPIRED // Authorization expired
    }

    /**
     * Operator permissions
     */
    public enum OperatorPermission {
        TRANSFER, // Can transfer tokens on behalf of holder
        TRANSFER_FROM, // Can transfer from any partition
        ISSUE, // Can receive new issuances
        REDEEM, // Can redeem/burn tokens
        FORCE_TRANSFER, // Can force transfer (controller only)
        MANAGE_PARTITIONS, // Can manage partitions
        MANAGE_DOCUMENTS, // Can manage documents
        SIGN_DOCUMENTS, // Can sign documents
        VIEW_DOCUMENTS, // Can view private documents
        RECEIVE_DIVIDENDS, // Can receive dividend payments
        VOTE, // Can vote on holder's behalf
        DELEGATE, // Can delegate to sub-operators
        FULL_CONTROL // Full control over holder's tokens
    }

    /**
     * Operator action types for audit log
     */
    public enum OperatorActionType {
        AUTHORIZE,
        REVOKE,
        ADD_DEFAULT,
        REMOVE_DEFAULT,
        ADD_CONTROLLER,
        REMOVE_CONTROLLER,
        UPDATE_PERMISSIONS,
        TRANSFER,
        ISSUE,
        REDEEM,
        FORCE_TRANSFER,
        SIGN_DOCUMENT,
        VOTE
    }

    /**
     * Operator action record for audit
     */
    public record OperatorAction(
            String actionId,
            String tokenId,
            String operator,
            String holder,
            OperatorActionType actionType,
            String from,
            String to,
            String amount,
            Instant timestamp,
            String details) {
    }

    /**
     * Operator result
     */
    public record OperatorResult(
            boolean success,
            String operator,
            String holder,
            String tokenId,
            String message) {
    }

    /**
     * Operator exception
     */
    public static class OperatorException extends RuntimeException {
        public OperatorException(String message) {
            super(message);
        }
    }
}
