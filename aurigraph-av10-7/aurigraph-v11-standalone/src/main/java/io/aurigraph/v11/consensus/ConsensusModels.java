package io.aurigraph.v11.consensus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Models and data structures for consensus operations
 */
public class ConsensusModels {
    
    /**
     * Performance metrics for consensus operations
     */
    public static class PerformanceMetrics {
        private final double currentTps;
        private final double avgLatency;
        private final double successRate;
        private final Instant timestamp;
        
        public PerformanceMetrics(double currentTps, double avgLatency, double successRate) {
            this.currentTps = currentTps;
            this.avgLatency = avgLatency;
            this.successRate = successRate;
            this.timestamp = Instant.now();
        }
        
        public double currentTps() { return currentTps; }
        public double avgLatency() { return avgLatency; }
        public double successRate() { return successRate; }
        public Instant getTimestamp() { return timestamp; }
    }
    
    /**
     * Consensus state information
     */
    public static class ConsensusState {
        private final String nodeId;
        private final ConsensusRole role;
        private final int term;
        private final long commitIndex;
        
        public enum ConsensusRole {
            FOLLOWER, CANDIDATE, LEADER
        }
        
        public ConsensusState(String nodeId, ConsensusRole role, int term, long commitIndex) {
            this.nodeId = nodeId;
            this.role = role;
            this.term = term;
            this.commitIndex = commitIndex;
        }
        
        public String getNodeId() { return nodeId; }
        public ConsensusRole getRole() { return role; }
        public int getTerm() { return term; }
        public long getCommitIndex() { return commitIndex; }
    }
    
    /**
     * Transaction model for consensus
     */
    public static class Transaction {
        private final String id;
        private final byte[] payload;
        private final Instant timestamp;
        private final double amount;
        
        public Transaction(String id, byte[] payload, double amount) {
            this.id = id;
            this.payload = payload;
            this.amount = amount;
            this.timestamp = Instant.now();
        }
        
        public String getId() { return id; }
        public byte[] getPayload() { return payload; }
        public Instant getTimestamp() { return timestamp; }
        public double getAmount() { return amount; }
    }
    
    /**
     * Block proposal model
     */
    public static class BlockProposal {
        private final String blockId;
        private final List<Transaction> transactions;
        private final String proposerId;
        private final Instant proposedAt;
        
        public BlockProposal(String blockId, List<Transaction> transactions, String proposerId) {
            this.blockId = blockId;
            this.transactions = transactions;
            this.proposerId = proposerId;
            this.proposedAt = Instant.now();
        }
        
        public String getBlockId() { return blockId; }
        public List<Transaction> getTransactions() { return transactions; }
        public String getProposerId() { return proposerId; }
        public Instant getProposedAt() { return proposedAt; }
    }
    
    /**
     * Validation result for consensus operations
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String reason;
        private final Map<String, Object> metadata;
        
        public ValidationResult(boolean valid, String reason, Map<String, Object> metadata) {
            this.valid = valid;
            this.reason = reason;
            this.metadata = metadata;
        }
        
        public boolean isValid() { return valid; }
        public String getReason() { return reason; }
        public Map<String, Object> getMetadata() { return metadata; }
    }
}