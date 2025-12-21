package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.Node;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * GenericNodeService - Abstract base class for all node services.
 *
 * Provides common functionality for managing nodes including:
 * - Lifecycle management (start, stop, restart)
 * - Health monitoring
 * - Metrics collection
 * - Multi-node management
 *
 * @param <T> The type of node this service manages
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public abstract class GenericNodeService<T extends Node> {

    private static final Logger LOG = Logger.getLogger(GenericNodeService.class);

    protected final Map<String, T> nodes = new ConcurrentHashMap<>();
    protected final AtomicBoolean initialized = new AtomicBoolean(false);

    /**
     * Initialize the service
     */
    @PostConstruct
    public void init() {
        if (initialized.compareAndSet(false, true)) {
            LOG.infof("Initializing %s", getClass().getSimpleName());
            doInit();
        }
    }

    /**
     * Cleanup on shutdown
     */
    @PreDestroy
    public void cleanup() {
        LOG.infof("Cleaning up %s", getClass().getSimpleName());
        nodes.values().forEach(node -> {
            try {
                node.stop();
            } catch (Exception e) {
                LOG.warnf(e, "Error stopping node %s", node.getNodeId());
            }
        });
        nodes.clear();
        doCleanup();
    }

    /**
     * Service-specific initialization
     */
    protected void doInit() {
        // Override in subclasses if needed
    }

    /**
     * Service-specific cleanup
     */
    protected void doCleanup() {
        // Override in subclasses if needed
    }

    /**
     * Create a new node instance
     */
    protected abstract T createNode(String nodeId);

    // ============================================
    // NODE LIFECYCLE
    // ============================================

    /**
     * Create and register a new node
     */
    public Uni<T> createAndRegister(String nodeId) {
        return Uni.createFrom().item(() -> {
            if (nodes.containsKey(nodeId)) {
                throw new IllegalArgumentException("Node already exists: " + nodeId);
            }
            T node = createNode(nodeId);
            nodes.put(nodeId, node);
            LOG.infof("Created node: %s", nodeId);
            return node;
        });
    }

    /**
     * Start a node
     */
    public Uni<Boolean> start(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.get(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            node.start();
            LOG.infof("Started node: %s", nodeId);
            return true;
        });
    }

    /**
     * Stop a node
     */
    public Uni<Boolean> stop(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.get(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            node.stop();
            LOG.infof("Stopped node: %s", nodeId);
            return true;
        });
    }

    /**
     * Restart a node
     */
    public Uni<Boolean> restart(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.get(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            node.restart();
            LOG.infof("Restarted node: %s", nodeId);
            return true;
        });
    }

    /**
     * Remove a node
     */
    public Uni<Boolean> remove(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.remove(nodeId);
            if (node == null) {
                return false;
            }
            if (node.isRunning()) {
                node.stop();
            }
            LOG.infof("Removed node: %s", nodeId);
            return true;
        });
    }

    // ============================================
    // HEALTH & METRICS
    // ============================================

    /**
     * Get node health
     */
    public Uni<NodeHealth> healthCheck(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.get(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            return node.healthCheck();
        });
    }

    /**
     * Get node metrics
     */
    public Uni<NodeMetrics> getMetrics(String nodeId) {
        return Uni.createFrom().item(() -> {
            T node = nodes.get(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            return node.getMetrics();
        });
    }

    /**
     * Get all nodes health
     */
    public Uni<Map<String, NodeHealth>> healthCheckAll() {
        return Uni.createFrom().item(() -> {
            Map<String, NodeHealth> results = new ConcurrentHashMap<>();
            nodes.forEach((id, node) -> {
                try {
                    results.put(id, node.healthCheck());
                } catch (Exception e) {
                    LOG.warnf(e, "Error checking health for node %s", id);
                }
            });
            return results;
        });
    }

    /**
     * Get all nodes metrics
     */
    public Uni<Map<String, NodeMetrics>> getMetricsAll() {
        return Uni.createFrom().item(() -> {
            Map<String, NodeMetrics> results = new ConcurrentHashMap<>();
            nodes.forEach((id, node) -> {
                try {
                    results.put(id, node.getMetrics());
                } catch (Exception e) {
                    LOG.warnf(e, "Error getting metrics for node %s", id);
                }
            });
            return results;
        });
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Get a node by ID
     */
    public T getNode(String nodeId) {
        return nodes.get(nodeId);
    }

    /**
     * Get all nodes
     */
    public Map<String, T> getAllNodes() {
        return Map.copyOf(nodes);
    }

    /**
     * Get node count
     */
    public int getNodeCount() {
        return nodes.size();
    }

    /**
     * Check if node exists
     */
    public boolean hasNode(String nodeId) {
        return nodes.containsKey(nodeId);
    }

    /**
     * Get running node count
     */
    public long getRunningNodeCount() {
        return nodes.values().stream().filter(Node::isRunning).count();
    }

    /**
     * Get healthy node count
     */
    public long getHealthyNodeCount() {
        return nodes.values().stream().filter(Node::isHealthy).count();
    }
}
