package io.aurigraph.v11.services;

import io.aurigraph.v11.models.Node;
import io.aurigraph.v11.models.NodeStatus;
import io.aurigraph.v11.models.NodeType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Node Management Service
 *
 * Manages node lifecycle including registration, heartbeats, and status updates.
 * Handles validator selection and network topology.
 *
 * Part of Sprint 9 - Story 3 (AV11-053)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@ApplicationScoped
public class NodeManagementService {

    @Inject
    EntityManager entityManager;

    /**
     * Register a new node
     *
     * @param address Node address
     * @param nodeType Node type
     * @param hostAddress Host address
     * @param publicKey Node's public key
     * @return Registered node
     */
    @Transactional
    public Node registerNode(String address, NodeType nodeType, String hostAddress, String publicKey) {
        // Check if node already exists
        Optional<Node> existing = getNodeByAddress(address);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Node already registered: " + address);
        }

        Node node = new Node(address, nodeType, hostAddress);
        node.setPublicKey(publicKey);
        node.setStatus(NodeStatus.STARTING);

        entityManager.persist(node);
        return node;
    }

    /**
     * Get node by ID
     *
     * @param id Node ID
     * @return Optional containing node if found
     */
    public Optional<Node> getNodeById(String id) {
        Node node = entityManager.find(Node.class, id);
        return Optional.ofNullable(node);
    }

    /**
     * Get node by address
     *
     * @param address Node address
     * @return Optional containing node if found
     */
    public Optional<Node> getNodeByAddress(String address) {
        List<Node> nodes = entityManager
                .createQuery("SELECT n FROM Node n WHERE n.address = :address", Node.class)
                .setParameter("address", address)
                .getResultList();

        return nodes.isEmpty() ? Optional.empty() : Optional.of(nodes.get(0));
    }

    /**
     * Get all nodes
     *
     * @param limit Maximum results
     * @return List of nodes
     */
    public List<Node> getAllNodes(int limit) {
        return entityManager
                .createQuery("SELECT n FROM Node n ORDER BY n.registeredAt DESC", Node.class)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Get nodes by status
     *
     * @param status Node status
     * @param limit Maximum results
     * @return List of nodes with specified status
     */
    public List<Node> getNodesByStatus(NodeStatus status, int limit) {
        return entityManager
                .createQuery("SELECT n FROM Node n WHERE n.status = :status ORDER BY n.lastHeartbeat DESC", Node.class)
                .setParameter("status", status)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Get nodes by type
     *
     * @param nodeType Node type
     * @param limit Maximum results
     * @return List of nodes of specified type
     */
    public List<Node> getNodesByType(NodeType nodeType, int limit) {
        return entityManager
                .createQuery("SELECT n FROM Node n WHERE n.nodeType = :nodeType ORDER BY n.registeredAt DESC", Node.class)
                .setParameter("nodeType", nodeType)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Get all validator nodes
     *
     * @param limit Maximum results
     * @return List of validator nodes
     */
    public List<Node> getValidatorNodes(int limit) {
        return entityManager
                .createQuery("SELECT n FROM Node n WHERE n.isValidator = true ORDER BY n.validatorRank ASC", Node.class)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Get active validators (online and validating)
     *
     * @param limit Maximum results
     * @return List of active validators
     */
    public List<Node> getActiveValidators(int limit) {
        return entityManager
                .createQuery("SELECT n FROM Node n WHERE n.isValidator = true AND n.status IN ('ONLINE', 'VALIDATING') ORDER BY n.validatorRank ASC", Node.class)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Update node status
     *
     * @param nodeId Node ID
     * @param status New status
     * @return Updated node
     */
    @Transactional
    public Node updateNodeStatus(String nodeId, NodeStatus status) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        node.setStatus(status);
        entityManager.merge(node);
        return node;
    }

    /**
     * Update node heartbeat
     *
     * @param nodeId Node ID
     * @param metrics Node metrics (CPU, memory, etc.)
     * @return Updated node
     */
    @Transactional
    public Node updateHeartbeat(String nodeId, NodeMetrics metrics) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        node.updateHeartbeat();

        if (metrics != null) {
            node.setCpuUsagePercent(metrics.getCpuUsagePercent());
            node.setMemoryUsagePercent(metrics.getMemoryUsagePercent());
            node.setDiskUsagePercent(metrics.getDiskUsagePercent());
            node.setNetworkInMbps(metrics.getNetworkInMbps());
            node.setNetworkOutMbps(metrics.getNetworkOutMbps());
            node.setPeerCount(metrics.getPeerCount());
            node.setLastBlockHeight(metrics.getLastBlockHeight());
        }

        // Auto-update status based on heartbeat
        if (node.getStatus() == NodeStatus.STARTING || node.getStatus() == NodeStatus.SYNCING) {
            node.setStatus(NodeStatus.ONLINE);
        }

        entityManager.merge(node);
        return node;
    }

    /**
     * Promote node to validator
     *
     * @param nodeId Node ID
     * @param stakeAmount Stake amount
     * @return Updated node
     */
    @Transactional
    public Node promoteToValidator(String nodeId, Long stakeAmount) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        if (node.getIsValidator()) {
            throw new IllegalStateException("Node is already a validator");
        }

        node.setIsValidator(true);
        node.setStakeAmount(stakeAmount);
        node.setNodeType(NodeType.VALIDATOR);

        // Assign validator rank
        long validatorCount = countValidators();
        node.setValidatorRank((int) validatorCount + 1);

        entityManager.merge(node);
        return node;
    }

    /**
     * Demote validator to regular node
     *
     * @param nodeId Node ID
     * @return Updated node
     */
    @Transactional
    public Node demoteValidator(String nodeId) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        if (!node.getIsValidator()) {
            throw new IllegalStateException("Node is not a validator");
        }

        node.setIsValidator(false);
        node.setValidatorRank(null);
        node.setNodeType(NodeType.FULL_NODE);

        entityManager.merge(node);
        return node;
    }

    /**
     * Increment node's validated blocks counter
     *
     * @param nodeId Node ID
     */
    @Transactional
    public void incrementBlocksValidated(String nodeId) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node != null) {
            node.incrementBlocksValidated();
            entityManager.merge(node);
        }
    }

    /**
     * Increment node's produced blocks counter
     *
     * @param nodeId Node ID
     */
    @Transactional
    public void incrementBlocksProduced(String nodeId) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node != null) {
            node.incrementBlocksProduced();
            entityManager.merge(node);
        }
    }

    /**
     * Ban a node from the network
     *
     * @param nodeId Node ID
     * @param reason Ban reason
     * @return Updated node
     */
    @Transactional
    public Node banNode(String nodeId, String reason) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        node.setStatus(NodeStatus.BANNED);
        node.getMetadata().put("ban_reason", reason);
        node.getMetadata().put("ban_timestamp", Instant.now().toString());

        entityManager.merge(node);
        return node;
    }

    /**
     * Unban a node
     *
     * @param nodeId Node ID
     * @return Updated node
     */
    @Transactional
    public Node unbanNode(String nodeId) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node == null) {
            throw new IllegalArgumentException("Node not found: " + nodeId);
        }

        if (node.getStatus() != NodeStatus.BANNED) {
            throw new IllegalStateException("Node is not banned");
        }

        node.setStatus(NodeStatus.OFFLINE);
        node.getMetadata().remove("ban_reason");
        node.getMetadata().remove("ban_timestamp");

        entityManager.merge(node);
        return node;
    }

    /**
     * Delete a node
     *
     * @param nodeId Node ID
     */
    @Transactional
    public void deleteNode(String nodeId) {
        Node node = entityManager.find(Node.class, nodeId);
        if (node != null) {
            entityManager.remove(node);
        }
    }

    /**
     * Get node count
     *
     * @return Total number of nodes
     */
    public long getNodeCount() {
        return entityManager
                .createQuery("SELECT COUNT(n) FROM Node n", Long.class)
                .getSingleResult();
    }

    /**
     * Get node count by status
     *
     * @param status Node status
     * @return Count of nodes with specified status
     */
    public long getNodeCountByStatus(NodeStatus status) {
        return entityManager
                .createQuery("SELECT COUNT(n) FROM Node n WHERE n.status = :status", Long.class)
                .setParameter("status", status)
                .getSingleResult();
    }

    /**
     * Count validators
     *
     * @return Number of validators
     */
    public long countValidators() {
        return entityManager
                .createQuery("SELECT COUNT(n) FROM Node n WHERE n.isValidator = true", Long.class)
                .getSingleResult();
    }

    /**
     * Count active validators
     *
     * @return Number of active validators
     */
    public long countActiveValidators() {
        return entityManager
                .createQuery("SELECT COUNT(n) FROM Node n WHERE n.isValidator = true AND n.status IN ('ONLINE', 'VALIDATING')", Long.class)
                .getSingleResult();
    }

    /**
     * Get network statistics
     *
     * @return Network statistics
     */
    public NetworkStats getNetworkStats() {
        long totalNodes = getNodeCount();
        long onlineNodes = getNodeCountByStatus(NodeStatus.ONLINE);
        long validatingNodes = getNodeCountByStatus(NodeStatus.VALIDATING);
        long totalValidators = countValidators();
        long activeValidators = countActiveValidators();

        return new NetworkStats(totalNodes, onlineNodes, validatingNodes, totalValidators, activeValidators);
    }

    /**
     * Find unhealthy nodes
     *
     * @param limit Maximum results
     * @return List of unhealthy nodes
     */
    public List<Node> findUnhealthyNodes(int limit) {
        // Nodes with no recent heartbeat (> 2 minutes)
        Instant cutoffTime = Instant.now().minusSeconds(120);

        return entityManager
                .createQuery("SELECT n FROM Node n WHERE n.status IN ('ONLINE', 'VALIDATING', 'SYNCING') AND n.lastHeartbeat < :cutoff ORDER BY n.lastHeartbeat ASC", Node.class)
                .setParameter("cutoff", cutoffTime)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Node Metrics for heartbeat updates
     */
    public static class NodeMetrics {
        private Double cpuUsagePercent;
        private Double memoryUsagePercent;
        private Double diskUsagePercent;
        private Double networkInMbps;
        private Double networkOutMbps;
        private Integer peerCount;
        private Long lastBlockHeight;

        // Constructors
        public NodeMetrics() {}

        public NodeMetrics(Double cpuUsagePercent, Double memoryUsagePercent, Double diskUsagePercent,
                          Double networkInMbps, Double networkOutMbps, Integer peerCount, Long lastBlockHeight) {
            this.cpuUsagePercent = cpuUsagePercent;
            this.memoryUsagePercent = memoryUsagePercent;
            this.diskUsagePercent = diskUsagePercent;
            this.networkInMbps = networkInMbps;
            this.networkOutMbps = networkOutMbps;
            this.peerCount = peerCount;
            this.lastBlockHeight = lastBlockHeight;
        }

        // Getters and Setters
        public Double getCpuUsagePercent() { return cpuUsagePercent; }
        public void setCpuUsagePercent(Double cpuUsagePercent) { this.cpuUsagePercent = cpuUsagePercent; }

        public Double getMemoryUsagePercent() { return memoryUsagePercent; }
        public void setMemoryUsagePercent(Double memoryUsagePercent) { this.memoryUsagePercent = memoryUsagePercent; }

        public Double getDiskUsagePercent() { return diskUsagePercent; }
        public void setDiskUsagePercent(Double diskUsagePercent) { this.diskUsagePercent = diskUsagePercent; }

        public Double getNetworkInMbps() { return networkInMbps; }
        public void setNetworkInMbps(Double networkInMbps) { this.networkInMbps = networkInMbps; }

        public Double getNetworkOutMbps() { return networkOutMbps; }
        public void setNetworkOutMbps(Double networkOutMbps) { this.networkOutMbps = networkOutMbps; }

        public Integer getPeerCount() { return peerCount; }
        public void setPeerCount(Integer peerCount) { this.peerCount = peerCount; }

        public Long getLastBlockHeight() { return lastBlockHeight; }
        public void setLastBlockHeight(Long lastBlockHeight) { this.lastBlockHeight = lastBlockHeight; }
    }

    /**
     * Network Statistics
     */
    public static class NetworkStats {
        private long totalNodes;
        private long onlineNodes;
        private long validatingNodes;
        private long totalValidators;
        private long activeValidators;

        public NetworkStats(long totalNodes, long onlineNodes, long validatingNodes,
                           long totalValidators, long activeValidators) {
            this.totalNodes = totalNodes;
            this.onlineNodes = onlineNodes;
            this.validatingNodes = validatingNodes;
            this.totalValidators = totalValidators;
            this.activeValidators = activeValidators;
        }

        // Getters
        public long getTotalNodes() { return totalNodes; }
        public long getOnlineNodes() { return onlineNodes; }
        public long getValidatingNodes() { return validatingNodes; }
        public long getTotalValidators() { return totalValidators; }
        public long getActiveValidators() { return activeValidators; }
    }
}
