package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object for Topology Update
 * Used for streaming real-time topology updates
 */
public record TopologyUpdateDTO(
    @JsonProperty("nodes") List<NodeTopologyDTO> nodes,
    @JsonProperty("totalNodes") long totalNodes,
    @JsonProperty("networkTps") double networkTps,
    @JsonProperty("totalTransactions") long totalTransactions,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("updateSequence") int updateSequence
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<NodeTopologyDTO> nodes = List.of();
        private long totalNodes;
        private double networkTps;
        private long totalTransactions;
        private Instant timestamp = Instant.now();
        private int updateSequence;

        public Builder nodes(List<NodeTopologyDTO> nodes) { this.nodes = nodes; return this; }
        public Builder totalNodes(long totalNodes) { this.totalNodes = totalNodes; return this; }
        public Builder networkTps(double networkTps) { this.networkTps = networkTps; return this; }
        public Builder totalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public Builder updateSequence(int updateSequence) { this.updateSequence = updateSequence; return this; }

        public TopologyUpdateDTO build() {
            return new TopologyUpdateDTO(nodes, totalNodes, networkTps, totalTransactions, timestamp, updateSequence);
        }
    }
}
