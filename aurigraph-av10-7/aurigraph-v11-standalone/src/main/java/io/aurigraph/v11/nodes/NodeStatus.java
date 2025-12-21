package io.aurigraph.v11.nodes;

/**
 * Unified NodeStatus enumeration for all Aurigraph V12 nodes.
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public enum NodeStatus {

    /**
     * Node is initializing (startup phase)
     */
    INITIALIZING("Initializing", "Node is starting up", false),

    /**
     * Node is connecting to the network
     */
    CONNECTING("Connecting", "Node is connecting to peers", false),

    /**
     * Node is synchronizing blockchain data
     */
    SYNCING("Syncing", "Node is synchronizing blockchain data", false),

    /**
     * Node is running and operational
     */
    RUNNING("Running", "Node is fully operational", true),

    /**
     * Node is in maintenance mode
     */
    MAINTENANCE("Maintenance", "Node is in maintenance mode", false),

    /**
     * Node is stopping
     */
    STOPPING("Stopping", "Node is shutting down", false),

    /**
     * Node is stopped
     */
    STOPPED("Stopped", "Node is not running", false),

    /**
     * Node is in error state
     */
    ERROR("Error", "Node encountered an error", false),

    /**
     * Node is degraded but operational
     */
    DEGRADED("Degraded", "Node is operational but degraded", true),

    /**
     * Node is unreachable
     */
    UNREACHABLE("Unreachable", "Node is not responding", false);

    private final String displayName;
    private final String description;
    private final boolean operational;

    NodeStatus(String displayName, String description, boolean operational) {
        this.displayName = displayName;
        this.description = description;
        this.operational = operational;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if node is operational (can process requests)
     */
    public boolean isOperational() {
        return operational;
    }

    /**
     * Check if node is healthy
     */
    public boolean isHealthy() {
        return this == RUNNING;
    }

    /**
     * Check if node is starting up
     */
    public boolean isStarting() {
        return this == INITIALIZING || this == CONNECTING || this == SYNCING;
    }

    /**
     * Check if node is in error or degraded state
     */
    public boolean hasIssues() {
        return this == ERROR || this == DEGRADED || this == UNREACHABLE;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
