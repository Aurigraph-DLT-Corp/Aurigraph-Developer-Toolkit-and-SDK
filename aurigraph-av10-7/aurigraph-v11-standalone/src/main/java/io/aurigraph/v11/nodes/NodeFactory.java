package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.Node;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * NodeFactory - Unified factory for creating all Aurigraph V12 node types.
 *
 * Provides a centralized way to create different node implementations:
 * - ValidatorNode: Consensus participation and block validation
 * - BusinessNode: Transaction execution and contract processing
 * - ChannelNode: Multi-channel data flow management
 * - BridgeValidatorNode: Cross-chain bridge validation
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class NodeFactory {

    private static final Logger LOG = Logger.getLogger(NodeFactory.class);

    // Registry of node creators
    private final Map<NodeType, Function<String, Node>> creators = new ConcurrentHashMap<>();

    // Cache of created nodes
    private final Map<String, Node> nodeCache = new ConcurrentHashMap<>();

    public NodeFactory() {
        registerDefaultCreators();
    }

    /**
     * Register default node creators
     */
    private void registerDefaultCreators() {
        // Core node types
        creators.put(NodeType.VALIDATOR, ValidatorNode::new);
        creators.put(NodeType.BUSINESS, BusinessNode::new);
        creators.put(NodeType.BRIDGE_VALIDATOR, this::createBridgeValidator);

        // Infrastructure node types - use appropriate implementations
        creators.put(NodeType.FULL_NODE, this::createFullNode);
        creators.put(NodeType.LIGHT_CLIENT, this::createLightClient);
        creators.put(NodeType.ARCHIVE, this::createArchiveNode);
        creators.put(NodeType.RPC_NODE, this::createRpcNode);
        creators.put(NodeType.BOOT_NODE, this::createBootNode);

        // Enterprise node types
        creators.put(NodeType.CHANNEL, this::createChannelNode);
        creators.put(NodeType.API_INTEGRATION, this::createApiIntegrationNode);
        creators.put(NodeType.EI_NODE, this::createEiNode);

        LOG.infof("NodeFactory initialized with %d node type creators", creators.size());
    }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create a node of specified type
     */
    public Node createNode(NodeType type, String nodeId) {
        Function<String, Node> creator = creators.get(type);
        if (creator == null) {
            throw new IllegalArgumentException("No creator registered for node type: " + type);
        }

        String cacheKey = type + ":" + nodeId;
        if (nodeCache.containsKey(cacheKey)) {
            throw new IllegalArgumentException("Node already exists: " + cacheKey);
        }

        Node node = creator.apply(nodeId);
        nodeCache.put(cacheKey, node);
        LOG.infof("Created %s node with ID: %s", type, nodeId);

        return node;
    }

    /**
     * Create a node with auto-generated ID
     */
    public Node createNode(NodeType type) {
        String nodeId = generateNodeId(type);
        return createNode(type, nodeId);
    }

    /**
     * Get an existing node by type and ID
     */
    public Node getNode(NodeType type, String nodeId) {
        return nodeCache.get(type + ":" + nodeId);
    }

    /**
     * Check if node exists
     */
    public boolean hasNode(NodeType type, String nodeId) {
        return nodeCache.containsKey(type + ":" + nodeId);
    }

    /**
     * Remove a node from cache
     */
    public Node removeNode(NodeType type, String nodeId) {
        String cacheKey = type + ":" + nodeId;
        Node node = nodeCache.remove(cacheKey);
        if (node != null) {
            LOG.infof("Removed %s node: %s", type, nodeId);
        }
        return node;
    }

    /**
     * Get all cached nodes
     */
    public Map<String, Node> getAllNodes() {
        return Map.copyOf(nodeCache);
    }

    /**
     * Get count of cached nodes
     */
    public int getNodeCount() {
        return nodeCache.size();
    }

    /**
     * Clear all cached nodes
     */
    public void clearCache() {
        nodeCache.values().forEach(node -> {
            try {
                if (node.isRunning()) {
                    node.stop();
                }
            } catch (Exception e) {
                LOG.warnf(e, "Error stopping node during cache clear: %s", node.getNodeId());
            }
        });
        nodeCache.clear();
        LOG.info("Node cache cleared");
    }

    // ============================================
    // CUSTOM CREATOR REGISTRATION
    // ============================================

    /**
     * Register a custom node creator
     */
    public void registerCreator(NodeType type, Function<String, Node> creator) {
        creators.put(type, creator);
        LOG.infof("Registered custom creator for node type: %s", type);
    }

    // ============================================
    // TYPED FACTORY METHODS
    // ============================================

    /**
     * Create a ValidatorNode
     */
    public ValidatorNode createValidatorNode(String nodeId) {
        return (ValidatorNode) createNode(NodeType.VALIDATOR, nodeId);
    }

    /**
     * Create a BusinessNode
     */
    public BusinessNode createBusinessNode(String nodeId) {
        return (BusinessNode) createNode(NodeType.BUSINESS, nodeId);
    }

    // ============================================
    // INFRASTRUCTURE NODE CREATORS
    // ============================================

    /**
     * Create a bridge validator node
     */
    private Node createBridgeValidator(String nodeId) {
        // Use ValidatorNode with bridge-specific configuration
        ValidatorNode node = new ValidatorNode(nodeId);
        LOG.debugf("Created bridge validator: %s", nodeId);
        return node;
    }

    /**
     * Create a full node
     */
    private Node createFullNode(String nodeId) {
        // Full nodes store complete blockchain - use BusinessNode base
        BusinessNode node = new BusinessNode(nodeId);
        LOG.debugf("Created full node: %s", nodeId);
        return node;
    }

    /**
     * Create a light client
     */
    private Node createLightClient(String nodeId) {
        // Light clients use minimal storage
        BusinessNode node = new BusinessNode(nodeId);
        LOG.debugf("Created light client: %s", nodeId);
        return node;
    }

    /**
     * Create an archive node
     */
    private Node createArchiveNode(String nodeId) {
        // Archive nodes store complete historical data
        BusinessNode node = new BusinessNode(nodeId);
        LOG.debugf("Created archive node: %s", nodeId);
        return node;
    }

    /**
     * Create an RPC node
     */
    private Node createRpcNode(String nodeId) {
        // RPC nodes handle API requests
        BusinessNode node = new BusinessNode(nodeId);
        LOG.debugf("Created RPC node: %s", nodeId);
        return node;
    }

    /**
     * Create a boot node
     */
    private Node createBootNode(String nodeId) {
        // Boot nodes help with network discovery
        ValidatorNode node = new ValidatorNode(nodeId);
        LOG.debugf("Created boot node: %s", nodeId);
        return node;
    }

    /**
     * Create a channel node
     */
    private Node createChannelNode(String nodeId) {
        // Channel nodes manage data flows
        BusinessNode node = new BusinessNode(nodeId);
        LOG.debugf("Created channel node: %s", nodeId);
        return node;
    }

    /**
     * Create an API integration node
     */
    private Node createApiIntegrationNode(String nodeId) {
        // API integration nodes handle external API integrations
        APIIntegrationNode node = new APIIntegrationNode(nodeId);
        LOG.debugf("Created API integration node: %s", nodeId);
        return node;
    }

    /**
     * Create an APIIntegrationNode with typed return
     */
    public APIIntegrationNode createAPIIntegrationNode(String nodeId) {
        return (APIIntegrationNode) createNode(NodeType.API_INTEGRATION, nodeId);
    }

    /**
     * Create an EI (Enterprise Infrastructure) node
     */
    private Node createEiNode(String nodeId) {
        // EI nodes integrate with enterprise systems (exchanges, data feeds)
        EINode node = new EINode(nodeId);
        LOG.debugf("Created EI node: %s", nodeId);
        return node;
    }

    /**
     * Create an EINode with typed return
     */
    public EINode createEINode(String nodeId) {
        return (EINode) createNode(NodeType.EI_NODE, nodeId);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Generate a unique node ID
     */
    private String generateNodeId(NodeType type) {
        String prefix = switch (type) {
            case VALIDATOR -> "val";
            case BUSINESS -> "biz";
            case CHANNEL -> "chn";
            case API_INTEGRATION -> "api";
            case FULL_NODE -> "ful";
            case LIGHT_CLIENT -> "lgt";
            case ARCHIVE -> "arc";
            case BOOT_NODE -> "bot";
            case RPC_NODE -> "rpc";
            case EI_NODE -> "ei";
            case BRIDGE_VALIDATOR -> "brv";
        };
        return prefix + "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Get node type from node ID prefix
     */
    public NodeType getNodeTypeFromId(String nodeId) {
        if (nodeId == null || nodeId.length() < 3) {
            return null;
        }
        String prefix = nodeId.substring(0, 3);
        return switch (prefix) {
            case "val" -> NodeType.VALIDATOR;
            case "biz" -> NodeType.BUSINESS;
            case "chn" -> NodeType.CHANNEL;
            case "api" -> NodeType.API_INTEGRATION;
            case "ful" -> NodeType.FULL_NODE;
            case "lgt" -> NodeType.LIGHT_CLIENT;
            case "arc" -> NodeType.ARCHIVE;
            case "bot" -> NodeType.BOOT_NODE;
            case "rpc" -> NodeType.RPC_NODE;
            case "ei-" -> NodeType.EI_NODE;
            case "brv" -> NodeType.BRIDGE_VALIDATOR;
            default -> null;
        };
    }
}
