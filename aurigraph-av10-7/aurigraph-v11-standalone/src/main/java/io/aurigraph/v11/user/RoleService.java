package io.aurigraph.v11.user;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.UUID;

/**
 * RoleService - Business logic for role management
 *
 * Handles role CRUD operations, permission validation, and default role initialization.
 * Automatically creates default system roles on application startup.
 *
 * @author Backend Development Agent (BDA)
 * @since V11.3.1
 */
@ApplicationScoped
public class RoleService {

    private static final Logger LOG = Logger.getLogger(RoleService.class);

    /**
     * Initialize default roles on application startup
     */
    @Transactional
    void onStart(@Observes StartupEvent ev) {
        LOG.info("Initializing default roles...");
        initializeDefaultRoles();
    }

    /**
     * Create default roles if they don't exist
     */
    private void initializeDefaultRoles() {
        // ADMIN role
        if (Role.findByName(Role.DefaultRoles.ADMIN) == null) {
            Role admin = new Role();
            admin.name = Role.DefaultRoles.ADMIN;
            admin.description = "Full system access with all permissions";
            admin.permissions = Role.Permissions.admin().toJson();
            admin.isSystemRole = true;
            admin.persist();
            LOG.info("Created ADMIN role");
        }

        // USER role
        if (Role.findByName(Role.DefaultRoles.USER) == null) {
            Role user = new Role();
            user.name = Role.DefaultRoles.USER;
            user.description = "Standard user with transaction and contract access";
            user.permissions = Role.Permissions.user().toJson();
            user.isSystemRole = true;
            user.persist();
            LOG.info("Created USER role");
        }

        // DEVOPS role
        if (Role.findByName(Role.DefaultRoles.DEVOPS) == null) {
            Role devops = new Role();
            devops.name = Role.DefaultRoles.DEVOPS;
            devops.description = "DevOps with system and monitoring access";
            devops.permissions = Role.Permissions.devops().toJson();
            devops.isSystemRole = true;
            devops.persist();
            LOG.info("Created DEVOPS role");
        }

        // API_USER role
        if (Role.findByName(Role.DefaultRoles.API_USER) == null) {
            Role apiUser = new Role();
            apiUser.name = Role.DefaultRoles.API_USER;
            apiUser.description = "API access for external integrations";
            apiUser.permissions = Role.Permissions.apiUser().toJson();
            apiUser.isSystemRole = true;
            apiUser.persist();
            LOG.info("Created API_USER role");
        }

        // READONLY role
        if (Role.findByName(Role.DefaultRoles.READONLY) == null) {
            Role readonly = new Role();
            readonly.name = Role.DefaultRoles.READONLY;
            readonly.description = "Read-only access to system resources";
            readonly.permissions = Role.Permissions.readonly().toJson();
            readonly.isSystemRole = true;
            readonly.persist();
            LOG.info("Created READONLY role");
        }

        LOG.info("Default roles initialized successfully");
    }

    /**
     * Create a new custom role
     */
    @Transactional
    public Role createRole(String name, String description, String permissions) {
        LOG.infof("Creating new role: %s", name);

        // Validate input
        validateRoleName(name);

        // Check for duplicates
        if (Role.findByName(name) != null) {
            throw new ValidationException("Role already exists: " + name);
        }

        // Validate permissions JSON
        validatePermissionsJson(permissions);

        Role role = new Role();
        role.name = name;
        role.description = description;
        role.permissions = permissions;
        role.isSystemRole = false;

        role.persist();
        LOG.infof("Role created successfully: %s (ID: %s)", name, role.id);
        return role;
    }

    /**
     * Get role by ID
     */
    public Role findById(UUID id) {
        Role role = Role.findById(id);
        if (role == null) {
            throw new ValidationException("Role not found: " + id);
        }
        return role;
    }

    /**
     * Get role by name
     */
    public Role findByName(String name) {
        return Role.findByName(name);
    }

    /**
     * Get all roles
     */
    public List<Role> listAllRoles() {
        return Role.listAll();
    }

    /**
     * Get system roles
     */
    public List<Role> listSystemRoles() {
        return Role.findSystemRoles();
    }

    /**
     * Get custom roles
     */
    public List<Role> listCustomRoles() {
        return Role.findCustomRoles();
    }

    /**
     * Update role
     */
    @Transactional
    public Role updateRole(UUID id, String description, String permissions) {
        Role role = findById(id);

        // Cannot update system roles
        if (role.isSystemRole) {
            throw new ValidationException("Cannot modify system role: " + role.name);
        }

        if (description != null && !description.isEmpty()) {
            role.description = description;
        }

        if (permissions != null && !permissions.isEmpty()) {
            validatePermissionsJson(permissions);
            role.permissions = permissions;
        }

        role.persist();
        LOG.infof("Role updated: %s", id);
        return role;
    }

    /**
     * Delete role
     */
    @Transactional
    public void deleteRole(UUID id) {
        Role role = findById(id);

        // Cannot delete system roles
        if (role.isSystemRole) {
            throw new ValidationException("Cannot delete system role: " + role.name);
        }

        // Cannot delete role with active users
        if (role.userCount > 0) {
            throw new ValidationException(
                "Cannot delete role with active users. Current users: " + role.userCount
            );
        }

        role.delete();
        LOG.infof("Role deleted: %s", id);
    }

    /**
     * Get role permissions
     */
    public String getPermissions(UUID id) {
        Role role = findById(id);
        return role.permissions;
    }

    /**
     * Check if role has permission
     */
    public boolean hasPermission(UUID roleId, String resource, String action) {
        Role role = findById(roleId);
        return role.hasPermission(resource, action);
    }

    /**
     * Increment user count for role
     */
    @Transactional
    public void incrementUserCount(UUID roleId) {
        Role role = findById(roleId);
        role.userCount++;
        role.persist();
    }

    /**
     * Decrement user count for role
     */
    @Transactional
    public void decrementUserCount(UUID roleId) {
        Role role = findById(roleId);
        if (role.userCount > 0) {
            role.userCount--;
            role.persist();
        }
    }

    /**
     * Get role statistics
     */
    public RoleStatistics getRoleStatistics(UUID id) {
        Role role = findById(id);
        return new RoleStatistics(
            role.id,
            role.name,
            role.userCount,
            role.isSystemRole,
            role.createdAt
        );
    }

    /**
     * Validate role name
     */
    private void validateRoleName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Role name is required");
        }
        if (name.length() < 2 || name.length() > 50) {
            throw new ValidationException("Role name must be between 2 and 50 characters");
        }
        if (!name.matches("^[A-Z][A-Z0-9_]*$")) {
            throw new ValidationException(
                "Role name must start with uppercase letter and contain only uppercase letters, numbers, and underscores"
            );
        }
    }

    /**
     * Validate permissions JSON format
     */
    private void validatePermissionsJson(String permissions) {
        if (permissions == null || permissions.trim().isEmpty()) {
            throw new ValidationException("Permissions are required");
        }

        // Basic JSON validation
        permissions = permissions.trim();
        if (!permissions.startsWith("{") || !permissions.endsWith("}")) {
            throw new ValidationException("Permissions must be a valid JSON object");
        }

        // Check for balanced braces
        int braceCount = 0;
        for (char c : permissions.toCharArray()) {
            if (c == '{') braceCount++;
            if (c == '}') braceCount--;
        }
        if (braceCount != 0) {
            throw new ValidationException("Invalid JSON format: unbalanced braces");
        }
    }

    /**
     * Role statistics record
     */
    public record RoleStatistics(
        UUID id,
        String name,
        int userCount,
        boolean isSystemRole,
        java.time.Instant createdAt
    ) {}
}
