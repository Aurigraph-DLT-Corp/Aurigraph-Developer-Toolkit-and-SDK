package io.aurigraph.v11.service;

import io.aurigraph.v11.dto.topology.*;
import io.aurigraph.v11.dto.topology.NodeTopologyDTO.NodeType;
import io.aurigraph.v11.dto.topology.NodeTopologyDTO.DataSource;
import io.aurigraph.v11.dto.topology.ActiveContractDTO.ContractStatus;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Service for Enhanced Node Topology
 * Provides node topology data for REST and gRPC endpoints
 *
 * GitHub Issue: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues/11
 */
@ApplicationScoped
public class NodeTopologyService {

    private static final Logger LOG = Logger.getLogger(NodeTopologyService.class);

    // Cache for node topology data (in production, this would be from real node registry)
    private final Map<String, NodeTopologyDTO> nodeCache = new ConcurrentHashMap<>();
    private int updateSequence = 0;

    // Sample locations for geographic distribution
    private static final LocationDTO[] LOCATIONS = {
        LocationDTO.US_EAST,
        LocationDTO.US_WEST,
        LocationDTO.EU_WEST,
        LocationDTO.EU_CENTRAL,
        LocationDTO.APAC_EAST,
        LocationDTO.APAC_SOUTH,
        LocationDTO.INDIA
    };

    // Sample contract names
    private static final String[] CONTRACT_NAMES = {
        "TokenTransfer", "AssetRegistry", "MultiSigWallet", "VotingContract",
        "StakingPool", "LiquidityProvider", "NFTMarketplace", "CrossChainBridge"
    };

    public NodeTopologyService() {
        // Initialize with mock data for development
        initializeMockNodes();
    }

    /**
     * Initialize mock nodes for development/demo purposes
     */
    private void initializeMockNodes() {
        LOG.info("Initializing mock node topology data");

        // Create validators (10)
        for (int i = 1; i <= 10; i++) {
            NodeTopologyDTO node = createMockNode("validator-" + i, "channel-main", NodeType.VALIDATOR, i);
            nodeCache.put(node.nodeId(), node);
        }

        // Create business nodes (20)
        for (int i = 1; i <= 20; i++) {
            String channelId = "channel-" + ((i % 8) + 1);
            NodeTopologyDTO node = createMockNode("business-" + i, channelId, NodeType.BUSINESS, i);
            nodeCache.put(node.nodeId(), node);
        }

        // Create slim nodes (10)
        for (int i = 1; i <= 10; i++) {
            String channelId = "channel-" + ((i % 8) + 1);
            NodeTopologyDTO node = createMockNode("slim-" + i, channelId, NodeType.SLIM, i);
            nodeCache.put(node.nodeId(), node);
        }

        // Create channel coordinator nodes (8)
        for (int i = 1; i <= 8; i++) {
            NodeTopologyDTO node = createMockNode("channel-" + i, "channel-" + i, NodeType.CHANNEL, i);
            nodeCache.put(node.nodeId(), node);
        }

        LOG.infof("Initialized %d mock nodes", nodeCache.size());
    }

    /**
     * Create a mock node with realistic data
     */
    private NodeTopologyDTO createMockNode(String nodeId, String channelId, NodeType nodeType, int seed) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        LocationDTO location = LOCATIONS[seed % LOCATIONS.length];
        Instant startedAt = Instant.now().minusSeconds(random.nextLong(3600, 86400 * 30));

        List<ActiveContractDTO> contracts = new ArrayList<>();
        int contractCount = nodeType == NodeType.VALIDATOR ? random.nextInt(3, 8) :
                           nodeType == NodeType.BUSINESS ? random.nextInt(1, 5) : 0;

        for (int i = 0; i < contractCount; i++) {
            contracts.add(createMockContract(seed * 100 + i));
        }

        return NodeTopologyDTO.builder()
            .nodeId(nodeId)
            .channelId(channelId)
            .nodeType(nodeType)
            .timeActiveSeconds(Instant.now().getEpochSecond() - startedAt.getEpochSecond())
            .transactionsHandled(random.nextLong(100000, 10000000))
            .currentTps(random.nextDouble(1000, 100000))
            .dataSource(seed % 3 == 0 ? DataSource.REPLICA : DataSource.PRIMARY)
            .containerId("docker-" + UUID.randomUUID().toString().substring(0, 12))
            .containerImage("aurigraph/v11:" + "12.0.0")
            .location(location)
            .stakingAmount(nodeType == NodeType.VALIDATOR ? String.valueOf(random.nextLong(100000, 1000000)) : "0")
            .cpuPercent(random.nextDouble(10, 80))
            .memoryPercent(random.nextDouble(30, 70))
            .memoryUsedMb(random.nextLong(512, 2048))
            .memoryTotalMb(4096)
            .isMobile(false)
            .deviceType("server")
            .bandwidthMbps(random.nextDouble(100, 1000))
            .latencyMs(random.nextDouble(5, 50))
            .peersConnected(random.nextLong(10, 50))
            .registryStatus(RegistryStatusDTO.builder()
                .registered(true)
                .lastHeartbeat(Instant.now().minusSeconds(random.nextLong(1, 30)))
                .version("12.0.0")
                .protocolVersion("1.0")
                .isHealthy(random.nextDouble() > 0.05)
                .build())
            .activeContracts(contracts)
            .contractCount(contracts.size())
            .lastUpdated(Instant.now())
            .startedAt(startedAt)
            .healthScore(random.nextInt(85, 100))
            .healthStatus(random.nextDouble() > 0.1 ? "healthy" : "degraded")
            .build();
    }

    /**
     * Create a mock smart contract
     */
    private ActiveContractDTO createMockContract(int seed) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        String contractName = CONTRACT_NAMES[seed % CONTRACT_NAMES.length];
        Instant deployedAt = Instant.now().minusSeconds(random.nextLong(86400, 86400 * 180));

        // Generate mock Ethereum-style addresses (40 hex chars)
        // UUID without dashes is 32 chars, so we use two UUIDs concatenated
        String contractAddr = (UUID.randomUUID().toString() + UUID.randomUUID().toString())
            .replace("-", "").substring(0, 40);
        String ownerAddr = (UUID.randomUUID().toString() + UUID.randomUUID().toString())
            .replace("-", "").substring(0, 40);

        return ActiveContractDTO.builder()
            .contractAddress("0x" + contractAddr)
            .contractName(contractName)
            .status(random.nextDouble() > 0.9 ? ContractStatus.PAUSED : ContractStatus.ACTIVE)
            .executionCount(random.nextLong(1000, 1000000))
            .totalGasUsed(String.valueOf(random.nextLong(1000000, 100000000)))
            .deployedAt(deployedAt)
            .lastExecution(Instant.now().minusSeconds(random.nextLong(1, 3600)))
            .ownerAddress("0x" + ownerAddr)
            .contractVersion("1." + random.nextInt(0, 5) + ".0")
            .build();
    }

    /**
     * Get all nodes with full topology data
     */
    public List<NodeTopologyDTO> getAllNodes() {
        refreshNodeMetrics();
        // Filter out null values to prevent serialization errors
        return nodeCache.values().stream()
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Get nodes filtered by type
     */
    public List<NodeTopologyDTO> getNodesByType(NodeType type) {
        return nodeCache.values().stream()
            .filter(java.util.Objects::nonNull)
            .filter(node -> node.nodeType() == type)
            .collect(Collectors.toList());
    }

    /**
     * Get nodes in a specific channel
     */
    public List<NodeTopologyDTO> getNodesInChannel(String channelId) {
        return nodeCache.values().stream()
            .filter(java.util.Objects::nonNull)
            .filter(node -> channelId.equals(node.channelId()))
            .collect(Collectors.toList());
    }

    /**
     * Get single node by ID
     */
    public Optional<NodeTopologyDTO> getNode(String nodeId) {
        return Optional.ofNullable(nodeCache.get(nodeId));
    }

    /**
     * Get topology statistics
     */
    public TopologyStatsDTO getTopologyStats() {
        List<NodeTopologyDTO> nodes = getAllNodes();

        int validatorCount = (int) nodes.stream().filter(n -> n.nodeType() == NodeType.VALIDATOR).count();
        int businessCount = (int) nodes.stream().filter(n -> n.nodeType() == NodeType.BUSINESS).count();
        int slimCount = (int) nodes.stream().filter(n -> n.nodeType() == NodeType.SLIM).count();
        int channelCount = (int) nodes.stream().filter(n -> n.nodeType() == NodeType.CHANNEL).count();

        double totalTps = nodes.stream().mapToDouble(NodeTopologyDTO::currentTps).sum();
        double avgLatency = nodes.stream().mapToDouble(NodeTopologyDTO::latencyMs).average().orElse(0);
        double avgCpu = nodes.stream().mapToDouble(NodeTopologyDTO::cpuPercent).average().orElse(0);
        double avgMemory = nodes.stream().mapToDouble(NodeTopologyDTO::memoryPercent).average().orElse(0);

        int totalContracts = nodes.stream().mapToInt(NodeTopologyDTO::contractCount).sum();

        Map<String, Integer> nodesByRegion = nodes.stream()
            .collect(Collectors.groupingBy(
                n -> n.location() != null ? n.location().region() : "unknown",
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));

        Map<String, Integer> nodesByType = nodes.stream()
            .collect(Collectors.groupingBy(
                n -> n.nodeType().name(),
                Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
            ));

        int healthyNodes = (int) nodes.stream().filter(n -> "healthy".equals(n.healthStatus())).count();
        int degradedNodes = (int) nodes.stream().filter(n -> "degraded".equals(n.healthStatus())).count();
        int unhealthyNodes = nodes.size() - healthyNodes - degradedNodes;

        return TopologyStatsDTO.builder()
            .totalNodes(nodes.size())
            .validatorCount(validatorCount)
            .businessCount(businessCount)
            .slimCount(slimCount)
            .channelCount(channelCount)
            .totalTps(totalTps)
            .avgLatencyMs(avgLatency)
            .totalContracts(totalContracts)
            .nodesByRegion(nodesByRegion)
            .nodesByType(nodesByType)
            .avgCpuPercent(avgCpu)
            .avgMemoryPercent(avgMemory)
            .healthyNodes(healthyNodes)
            .degradedNodes(degradedNodes)
            .unhealthyNodes(unhealthyNodes)
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Get active contracts across all nodes
     */
    public List<ActiveContractDTO> getAllActiveContracts() {
        return nodeCache.values().stream()
            .filter(java.util.Objects::nonNull)
            .map(NodeTopologyDTO::activeContracts)
            .filter(java.util.Objects::nonNull)
            .flatMap(List::stream)
            .distinct()
            .collect(Collectors.toList());
    }

    /**
     * Get contracts for specific node
     */
    public List<ActiveContractDTO> getNodeContracts(String nodeId) {
        NodeTopologyDTO node = nodeCache.get(nodeId);
        if (node == null || node.activeContracts() == null) {
            return List.of();
        }
        return node.activeContracts();
    }

    /**
     * Build TopologyUpdate for streaming
     */
    public TopologyUpdateDTO buildTopologyUpdate(String channelId, NodeType typeFilter) {
        refreshNodeMetrics();

        List<NodeTopologyDTO> nodes = nodeCache.values().stream()
            .filter(java.util.Objects::nonNull)
            .filter(node -> channelId == null || channelId.equals(node.channelId()))
            .filter(node -> typeFilter == null || node.nodeType() == typeFilter)
            .collect(Collectors.toList());

        double networkTps = nodes.stream().mapToDouble(NodeTopologyDTO::currentTps).sum();
        long totalTransactions = nodes.stream().mapToLong(NodeTopologyDTO::transactionsHandled).sum();

        return TopologyUpdateDTO.builder()
            .nodes(nodes)
            .totalNodes(nodes.size())
            .networkTps(networkTps)
            .totalTransactions(totalTransactions)
            .timestamp(Instant.now())
            .updateSequence(++updateSequence)
            .build();
    }

    /**
     * Refresh node metrics with simulated changes (for demo)
     */
    private void refreshNodeMetrics() {
        if (nodeCache.isEmpty()) {
            LOG.warn("Node cache is empty, re-initializing mock nodes");
            initializeMockNodes();
            return;
        }

        ThreadLocalRandom random = ThreadLocalRandom.current();

        for (Map.Entry<String, NodeTopologyDTO> entry : nodeCache.entrySet()) {
            try {
                NodeTopologyDTO old = entry.getValue();
                if (old == null) {
                    LOG.warnf("Null node found in cache for key: %s", entry.getKey());
                    continue;
                }

                // Safely get startedAt with fallback
                Instant startedAt = old.startedAt() != null ? old.startedAt() : Instant.now().minusSeconds(3600);
                long timeActive = Instant.now().getEpochSecond() - startedAt.getEpochSecond();

                // Safely get registryStatus
                String version = "12.0.0";
                String protocolVersion = "1.0";
                if (old.registryStatus() != null) {
                    version = old.registryStatus().version() != null ? old.registryStatus().version() : "12.0.0";
                    protocolVersion = old.registryStatus().protocolVersion() != null ? old.registryStatus().protocolVersion() : "1.0";
                }

                // Simulate metric changes
                NodeTopologyDTO updated = NodeTopologyDTO.builder()
                    .nodeId(old.nodeId())
                    .channelId(old.channelId())
                    .nodeType(old.nodeType())
                    .timeActiveSeconds(timeActive)
                    .transactionsHandled(old.transactionsHandled() + random.nextLong(100, 1000))
                    .currentTps(old.currentTps() * (0.95 + random.nextDouble() * 0.1))
                    .dataSource(old.dataSource())
                    .containerId(old.containerId())
                    .containerImage(old.containerImage())
                    .location(old.location())
                    .stakingAmount(old.stakingAmount())
                    .cpuPercent(Math.max(5, Math.min(95, old.cpuPercent() + random.nextDouble(-5, 5))))
                    .memoryPercent(Math.max(20, Math.min(90, old.memoryPercent() + random.nextDouble(-3, 3))))
                    .memoryUsedMb(old.memoryUsedMb())
                    .memoryTotalMb(old.memoryTotalMb())
                    .isMobile(old.isMobile())
                    .deviceType(old.deviceType())
                    .bandwidthMbps(old.bandwidthMbps())
                    .latencyMs(Math.max(1, old.latencyMs() + random.nextDouble(-2, 2)))
                    .peersConnected(old.peersConnected())
                    .registryStatus(RegistryStatusDTO.builder()
                        .registered(true)
                        .lastHeartbeat(Instant.now())
                        .version(version)
                        .protocolVersion(protocolVersion)
                        .isHealthy(random.nextDouble() > 0.02)
                        .build())
                    .activeContracts(old.activeContracts() != null ? old.activeContracts() : List.of())
                    .contractCount(old.contractCount())
                    .lastUpdated(Instant.now())
                    .startedAt(startedAt)
                    .healthScore(Math.max(0, Math.min(100, old.healthScore() + random.nextInt(-2, 3))))
                    .healthStatus(old.healthScore() > 70 ? "healthy" : old.healthScore() > 40 ? "degraded" : "unhealthy")
                    .build();

                entry.setValue(updated);
            } catch (Exception e) {
                LOG.warnf(e, "Error refreshing metrics for node %s", entry.getKey());
            }
        }
    }

    /**
     * Get list of unique channel IDs
     */
    public List<String> getChannelIds() {
        return nodeCache.values().stream()
            .map(NodeTopologyDTO::channelId)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }
}
