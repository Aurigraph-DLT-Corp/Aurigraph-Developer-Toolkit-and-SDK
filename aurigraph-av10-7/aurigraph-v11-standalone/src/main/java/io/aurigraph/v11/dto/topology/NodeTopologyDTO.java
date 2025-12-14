package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object for Enhanced Node Topology
 * Contains 17+ metrics for comprehensive node monitoring
 *
 * GitHub Issue: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues/11
 */
public record NodeTopologyDTO(
    // Identity
    @JsonProperty("nodeId") String nodeId,
    @JsonProperty("channelId") String channelId,
    @JsonProperty("nodeType") NodeType nodeType,

    // Performance metrics
    @JsonProperty("timeActiveSeconds") long timeActiveSeconds,
    @JsonProperty("transactionsHandled") long transactionsHandled,
    @JsonProperty("currentTps") double currentTps,

    // Data source
    @JsonProperty("dataSource") DataSource dataSource,

    // Container info
    @JsonProperty("containerId") String containerId,
    @JsonProperty("containerImage") String containerImage,

    // Geographic location
    @JsonProperty("location") LocationDTO location,

    // Staking (for validators)
    @JsonProperty("stakingAmount") String stakingAmount,

    // Resource utilization
    @JsonProperty("cpuPercent") double cpuPercent,
    @JsonProperty("memoryPercent") double memoryPercent,
    @JsonProperty("memoryUsedMb") long memoryUsedMb,
    @JsonProperty("memoryTotalMb") long memoryTotalMb,

    // Device info
    @JsonProperty("isMobile") boolean isMobile,
    @JsonProperty("deviceType") String deviceType,

    // Network metrics
    @JsonProperty("bandwidthMbps") double bandwidthMbps,
    @JsonProperty("latencyMs") double latencyMs,
    @JsonProperty("peersConnected") long peersConnected,

    // Registry status
    @JsonProperty("registryStatus") RegistryStatusDTO registryStatus,

    // Smart contracts
    @JsonProperty("activeContracts") List<ActiveContractDTO> activeContracts,
    @JsonProperty("contractCount") int contractCount,

    // Timestamps
    @JsonProperty("lastUpdated") Instant lastUpdated,
    @JsonProperty("startedAt") Instant startedAt,

    // Health
    @JsonProperty("healthScore") int healthScore,
    @JsonProperty("healthStatus") String healthStatus
) {
    /**
     * Node type enumeration
     */
    public enum NodeType {
        VALIDATOR("V"),
        BUSINESS("B"),
        EXTERNAL_INTEGRATION("EI"),  // Renamed from SLIM - External Integration nodes for API/data feeds
        CHANNEL("C");

        private final String shortCode;

        NodeType(String shortCode) {
            this.shortCode = shortCode;
        }

        public String getShortCode() {
            return shortCode;
        }
    }

    /**
     * Data source enumeration
     */
    public enum DataSource {
        PRIMARY,
        REPLICA
    }

    /**
     * Builder for NodeTopologyDTO
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String nodeId;
        private String channelId;
        private NodeType nodeType;
        private long timeActiveSeconds;
        private long transactionsHandled;
        private double currentTps;
        private DataSource dataSource = DataSource.PRIMARY;
        private String containerId;
        private String containerImage;
        private LocationDTO location;
        private String stakingAmount = "0";
        private double cpuPercent;
        private double memoryPercent;
        private long memoryUsedMb;
        private long memoryTotalMb;
        private boolean isMobile;
        private String deviceType = "server";
        private double bandwidthMbps;
        private double latencyMs;
        private long peersConnected;
        private RegistryStatusDTO registryStatus;
        private List<ActiveContractDTO> activeContracts = List.of();
        private int contractCount;
        private Instant lastUpdated = Instant.now();
        private Instant startedAt;
        private int healthScore = 100;
        private String healthStatus = "healthy";

        public Builder nodeId(String nodeId) { this.nodeId = nodeId; return this; }
        public Builder channelId(String channelId) { this.channelId = channelId; return this; }
        public Builder nodeType(NodeType nodeType) { this.nodeType = nodeType; return this; }
        public Builder timeActiveSeconds(long timeActiveSeconds) { this.timeActiveSeconds = timeActiveSeconds; return this; }
        public Builder transactionsHandled(long transactionsHandled) { this.transactionsHandled = transactionsHandled; return this; }
        public Builder currentTps(double currentTps) { this.currentTps = currentTps; return this; }
        public Builder dataSource(DataSource dataSource) { this.dataSource = dataSource; return this; }
        public Builder containerId(String containerId) { this.containerId = containerId; return this; }
        public Builder containerImage(String containerImage) { this.containerImage = containerImage; return this; }
        public Builder location(LocationDTO location) { this.location = location; return this; }
        public Builder stakingAmount(String stakingAmount) { this.stakingAmount = stakingAmount; return this; }
        public Builder cpuPercent(double cpuPercent) { this.cpuPercent = cpuPercent; return this; }
        public Builder memoryPercent(double memoryPercent) { this.memoryPercent = memoryPercent; return this; }
        public Builder memoryUsedMb(long memoryUsedMb) { this.memoryUsedMb = memoryUsedMb; return this; }
        public Builder memoryTotalMb(long memoryTotalMb) { this.memoryTotalMb = memoryTotalMb; return this; }
        public Builder isMobile(boolean isMobile) { this.isMobile = isMobile; return this; }
        public Builder deviceType(String deviceType) { this.deviceType = deviceType; return this; }
        public Builder bandwidthMbps(double bandwidthMbps) { this.bandwidthMbps = bandwidthMbps; return this; }
        public Builder latencyMs(double latencyMs) { this.latencyMs = latencyMs; return this; }
        public Builder peersConnected(long peersConnected) { this.peersConnected = peersConnected; return this; }
        public Builder registryStatus(RegistryStatusDTO registryStatus) { this.registryStatus = registryStatus; return this; }
        public Builder activeContracts(List<ActiveContractDTO> activeContracts) { this.activeContracts = activeContracts; return this; }
        public Builder contractCount(int contractCount) { this.contractCount = contractCount; return this; }
        public Builder lastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; return this; }
        public Builder startedAt(Instant startedAt) { this.startedAt = startedAt; return this; }
        public Builder healthScore(int healthScore) { this.healthScore = healthScore; return this; }
        public Builder healthStatus(String healthStatus) { this.healthStatus = healthStatus; return this; }

        public NodeTopologyDTO build() {
            return new NodeTopologyDTO(
                nodeId, channelId, nodeType, timeActiveSeconds, transactionsHandled,
                currentTps, dataSource, containerId, containerImage, location,
                stakingAmount, cpuPercent, memoryPercent, memoryUsedMb, memoryTotalMb,
                isMobile, deviceType, bandwidthMbps, latencyMs, peersConnected,
                registryStatus, activeContracts, contractCount, lastUpdated, startedAt,
                healthScore, healthStatus
            );
        }
    }
}
