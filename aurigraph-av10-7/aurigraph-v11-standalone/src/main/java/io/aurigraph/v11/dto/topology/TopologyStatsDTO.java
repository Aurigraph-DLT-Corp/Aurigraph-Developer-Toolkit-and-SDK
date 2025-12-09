package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;

/**
 * Data Transfer Object for Topology Statistics
 */
public record TopologyStatsDTO(
    @JsonProperty("totalNodes") int totalNodes,
    @JsonProperty("validatorCount") int validatorCount,
    @JsonProperty("businessCount") int businessCount,
    @JsonProperty("slimCount") int slimCount,
    @JsonProperty("channelCount") int channelCount,
    @JsonProperty("totalTps") double totalTps,
    @JsonProperty("avgLatencyMs") double avgLatencyMs,
    @JsonProperty("totalContracts") int totalContracts,
    @JsonProperty("nodesByRegion") Map<String, Integer> nodesByRegion,
    @JsonProperty("nodesByType") Map<String, Integer> nodesByType,
    @JsonProperty("avgCpuPercent") double avgCpuPercent,
    @JsonProperty("avgMemoryPercent") double avgMemoryPercent,
    @JsonProperty("healthyNodes") int healthyNodes,
    @JsonProperty("degradedNodes") int degradedNodes,
    @JsonProperty("unhealthyNodes") int unhealthyNodes,
    @JsonProperty("timestamp") Instant timestamp
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalNodes;
        private int validatorCount;
        private int businessCount;
        private int slimCount;
        private int channelCount;
        private double totalTps;
        private double avgLatencyMs;
        private int totalContracts;
        private Map<String, Integer> nodesByRegion = Map.of();
        private Map<String, Integer> nodesByType = Map.of();
        private double avgCpuPercent;
        private double avgMemoryPercent;
        private int healthyNodes;
        private int degradedNodes;
        private int unhealthyNodes;
        private Instant timestamp = Instant.now();

        public Builder totalNodes(int totalNodes) { this.totalNodes = totalNodes; return this; }
        public Builder validatorCount(int validatorCount) { this.validatorCount = validatorCount; return this; }
        public Builder businessCount(int businessCount) { this.businessCount = businessCount; return this; }
        public Builder slimCount(int slimCount) { this.slimCount = slimCount; return this; }
        public Builder channelCount(int channelCount) { this.channelCount = channelCount; return this; }
        public Builder totalTps(double totalTps) { this.totalTps = totalTps; return this; }
        public Builder avgLatencyMs(double avgLatencyMs) { this.avgLatencyMs = avgLatencyMs; return this; }
        public Builder totalContracts(int totalContracts) { this.totalContracts = totalContracts; return this; }
        public Builder nodesByRegion(Map<String, Integer> nodesByRegion) { this.nodesByRegion = nodesByRegion; return this; }
        public Builder nodesByType(Map<String, Integer> nodesByType) { this.nodesByType = nodesByType; return this; }
        public Builder avgCpuPercent(double avgCpuPercent) { this.avgCpuPercent = avgCpuPercent; return this; }
        public Builder avgMemoryPercent(double avgMemoryPercent) { this.avgMemoryPercent = avgMemoryPercent; return this; }
        public Builder healthyNodes(int healthyNodes) { this.healthyNodes = healthyNodes; return this; }
        public Builder degradedNodes(int degradedNodes) { this.degradedNodes = degradedNodes; return this; }
        public Builder unhealthyNodes(int unhealthyNodes) { this.unhealthyNodes = unhealthyNodes; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public TopologyStatsDTO build() {
            return new TopologyStatsDTO(
                totalNodes, validatorCount, businessCount, slimCount, channelCount,
                totalTps, avgLatencyMs, totalContracts, nodesByRegion, nodesByType,
                avgCpuPercent, avgMemoryPercent, healthyNodes, degradedNodes,
                unhealthyNodes, timestamp
            );
        }
    }
}
