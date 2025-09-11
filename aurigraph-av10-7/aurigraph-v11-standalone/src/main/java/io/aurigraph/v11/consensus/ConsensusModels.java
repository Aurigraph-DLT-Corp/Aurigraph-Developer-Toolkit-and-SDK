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
        private final double peakTps;
        private final double avgLatency;
        private final double successRate;
        private final long processedTransactions;
        private final long successfulTransactions;
        private final Instant timestamp;
        
        public PerformanceMetrics(double currentTps, double peakTps, double avgLatency, 
                                 double successRate, long processedTransactions, long successfulTransactions) {
            this.currentTps = currentTps;
            this.peakTps = peakTps;
            this.avgLatency = avgLatency;
            this.successRate = successRate;
            this.processedTransactions = processedTransactions;
            this.successfulTransactions = successfulTransactions;
            this.timestamp = Instant.now();
        }
        
        public double getCurrentTps() { return currentTps; }
        public double getPeakTps() { return peakTps; }
        public double getAvgLatency() { return avgLatency; }
        public double getSuccessRate() { return successRate; }
        public long getProcessedTransactions() { return processedTransactions; }
        public long getSuccessfulTransactions() { return successfulTransactions; }
        public Instant getTimestamp() { return timestamp; }
        
        // Legacy method names for backward compatibility
        public double currentTps() { return currentTps; }
        public double avgLatency() { return avgLatency; }
        public double successRate() { return successRate; }
    }
    
    /**
     * Consensus state enumeration
     */
    public enum ConsensusState {
        FOLLOWER, CANDIDATE, LEADER
    }
    
    /**
     * Consensus state information
     */
    public static class ConsensusStateInfo {
        private final String nodeId;
        private final ConsensusState role;
        private final int term;
        private final long commitIndex;
        
        public ConsensusStateInfo(String nodeId, ConsensusState role, int term, long commitIndex) {
            this.nodeId = nodeId;
            this.role = role;
            this.term = term;
            this.commitIndex = commitIndex;
        }
        
        public String getNodeId() { return nodeId; }
        public ConsensusState getRole() { return role; }
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
        private final String hash;
        private final String from;
        private final String to;
        private final String signature;
        private final Object zkProof;
        
        public Transaction(String id, byte[] payload, double amount) {
            this.id = id;
            this.payload = payload;
            this.amount = amount;
            this.timestamp = Instant.now();
            this.hash = generateHash(id, amount);
            this.from = "default-from";
            this.to = "default-to";
            this.signature = "default-signature";
            this.zkProof = null;
        }
        
        public Transaction(String id, byte[] payload, double amount, String hash, 
                          String from, String to, String signature, Object zkProof) {
            this.id = id;
            this.payload = payload;
            this.amount = amount;
            this.timestamp = Instant.now();
            this.hash = hash;
            this.from = from;
            this.to = to;
            this.signature = signature;
            this.zkProof = zkProof;
        }
        
        private String generateHash(String id, double amount) {
            return "hash_" + id + "_" + amount + "_" + System.nanoTime();
        }
        
        public String getId() { return id; }
        public byte[] getPayload() { return payload; }
        public Instant getTimestamp() { return timestamp; }
        public double getAmount() { return amount; }
        public String getHash() { return hash; }
        public String getFrom() { return from; }
        public String getTo() { return to; }
        public String getSignature() { return signature; }
        public Object getZkProof() { return zkProof; }
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
        private final String type;
        private final List<ValidationEntry> results;
        
        public ValidationResult(String type, List<ValidationEntry> results) {
            this.type = type;
            this.results = results;
        }
        
        public String getType() { return type; }
        public List<ValidationEntry> getResults() { return results; }
    }

    /**
     * Single validation entry result
     */
    public static class ValidationEntry {
        private final boolean valid;
        private final String type;
        private final String error;

        public ValidationEntry(boolean valid, String type, String error) {
            this.valid = valid;
            this.type = type;
            this.error = error;
        }

        public boolean isValid() { return valid; }
        public String getType() { return type; }
        public String getError() { return error; }
    }

    // Additional models for HyperRAFT++ implementation

    /**
     * Consensus event types
     */
    public enum ConsensusEventType {
        LEADER_ELECTED,
        BECAME_FOLLOWER,
        HEARTBEAT_SENT,
        BLOCK_CREATED_V2,
        BLOCK_FINALIZED,
        ENHANCED_METRICS_UPDATED
    }

    /**
     * Consensus event
     */
    public static class ConsensusEvent {
        private final ConsensusEventType type;
        private final String nodeId;
        private final int term;
        private final long timestamp;

        public ConsensusEvent(ConsensusEventType type, String nodeId, int term) {
            this.type = type;
            this.nodeId = nodeId;
            this.term = term;
            this.timestamp = System.currentTimeMillis();
        }

        public ConsensusEventType getType() { return type; }
        public String getNodeId() { return nodeId; }
        public int getTerm() { return term; }
        public long getTimestamp() { return timestamp; }
    }

    /**
     * Transaction batch for processing
     */
    public static class TransactionBatch {
        private final String id;
        private final List<Transaction> transactions;
        private final Instant createdAt;
        private final int term;
        private final String nodeId;
        
        private List<Transaction> validatedTransactions;
        private List<Transaction> proovedTransactions;
        private List<Object> executionResults;
        private String stateRoot;

        public TransactionBatch(String id, List<Transaction> transactions, Instant createdAt, int term, String nodeId) {
            this.id = id;
            this.transactions = transactions;
            this.createdAt = createdAt;
            this.term = term;
            this.nodeId = nodeId;
        }

        public String getId() { return id; }
        public List<Transaction> getTransactions() { return transactions; }
        public Instant getCreatedAt() { return createdAt; }
        public int getTerm() { return term; }
        public String getNodeId() { return nodeId; }
        
        public void setValidatedTransactions(List<Transaction> validatedTransactions) {
            this.validatedTransactions = validatedTransactions;
        }
        
        public void setProovedTransactions(List<Transaction> proovedTransactions) {
            this.proovedTransactions = proovedTransactions;
        }
        
        public void setExecutionResults(List<Object> executionResults) {
            this.executionResults = executionResults;
        }
        
        public void setStateRoot(String stateRoot) {
            this.stateRoot = stateRoot;
        }
        
        public List<Object> getExecutionResults() { return executionResults; }
    }

    /**
     * Block in the blockchain
     */
    public static class Block {
        private final long height;
        private final String hash;
        private final String previousHash;
        private final List<Transaction> transactions;
        private final Instant timestamp;
        private final String validator;
        private final ConsensusProof consensusProof;
        
        private Object zkAggregateProof;
        private Object quantumConsensusProof;
        private int shardId;
        private List<Object> validationResults;

        public Block(long height, String hash, String previousHash, List<Transaction> transactions, 
                     Instant timestamp, String validator, ConsensusProof consensusProof) {
            this.height = height;
            this.hash = hash;
            this.previousHash = previousHash;
            this.transactions = transactions;
            this.timestamp = timestamp;
            this.validator = validator;
            this.consensusProof = consensusProof;
        }

        public long getHeight() { return height; }
        public String getHash() { return hash; }
        public String getPreviousHash() { return previousHash; }
        public List<Transaction> getTransactions() { return transactions; }
        public Instant getTimestamp() { return timestamp; }
        public String getValidator() { return validator; }
        public ConsensusProof getConsensusProof() { return consensusProof; }
        
        public void setZkAggregateProof(Object zkAggregateProof) {
            this.zkAggregateProof = zkAggregateProof;
        }
        
        public void setQuantumConsensusProof(Object quantumConsensusProof) {
            this.quantumConsensusProof = quantumConsensusProof;
        }
        
        public void setShardId(int shardId) {
            this.shardId = shardId;
        }
        
        public void setValidationResults(List<Object> validationResults) {
            this.validationResults = validationResults;
        }
    }

    /**
     * Consensus proof for blocks
     */
    public static class ConsensusProof {
        private final int term;
        private final String stateRoot;
        private final String signature;

        public ConsensusProof(int term, String stateRoot, String signature) {
            this.term = term;
            this.stateRoot = stateRoot;
            this.signature = signature;
        }

        public int getTerm() { return term; }
        public String getStateRoot() { return stateRoot; }
        public String getSignature() { return signature; }
    }

    /**
     * Heartbeat message from leader
     */
    public static class HeartbeatMessage {
        private final int term;
        private final String leaderId;
        private final long commitIndex;
        private final Instant timestamp;

        public HeartbeatMessage(int term, String leaderId, long commitIndex, Instant timestamp) {
            this.term = term;
            this.leaderId = leaderId;
            this.commitIndex = commitIndex;
            this.timestamp = timestamp;
        }

        public int getTerm() { return term; }
        public String getLeaderId() { return leaderId; }
        public long getCommitIndex() { return commitIndex; }
        public Instant getTimestamp() { return timestamp; }
    }

    /**
     * Validation pipeline results
     */
    public static class ValidationResults {
        private List<Transaction> validTransactions;
        private List<Object> zkProofs;
        private List<Object> pipelineResults;

        public List<Transaction> getValidTransactions() { return validTransactions; }
        public List<Object> getZkProofs() { return zkProofs; }
        public List<Object> getPipelineResults() { return pipelineResults; }
        
        public void setValidTransactions(List<Transaction> validTransactions) {
            this.validTransactions = validTransactions;
        }
        
        public void setZkProofs(List<Object> zkProofs) {
            this.zkProofs = zkProofs;
        }
        
        public void setPipelineResults(List<Object> pipelineResults) {
            this.pipelineResults = pipelineResults;
        }
    }

    /**
     * Execution result for transactions
     */
    public static class ExecutionResult {
        private final boolean success;
        private final Transaction transaction;
        private final String hash;
        private final long gasUsed;
        private final String result;
        private final long executionTime;

        public ExecutionResult(boolean success, Transaction transaction, String hash, 
                             long gasUsed, String result, long executionTime) {
            this.success = success;
            this.transaction = transaction;
            this.hash = hash;
            this.gasUsed = gasUsed;
            this.result = result;
            this.executionTime = executionTime;
        }

        public boolean isSuccess() { return success; }
        public Transaction getTransaction() { return transaction; }
        public String getHash() { return hash; }
        public long getGasUsed() { return gasUsed; }
        public String getResult() { return result; }
        public long getExecutionTime() { return executionTime; }
    }

    /**
     * Consensus status information
     */
    public static class ConsensusStatus {
        private final ConsensusState state;
        private final int term;
        private final String leader;
        private final long commitIndex;
        private final long lastApplied;
        private final String nodeId;
        private final int validatorCount;

        public ConsensusStatus(ConsensusState state, int term, String leader,
                              long commitIndex, long lastApplied, String nodeId, int validatorCount) {
            this.state = state;
            this.term = term;
            this.leader = leader;
            this.commitIndex = commitIndex;
            this.lastApplied = lastApplied;
            this.nodeId = nodeId;
            this.validatorCount = validatorCount;
        }

        public ConsensusState getState() { return state; }
        public int getTerm() { return term; }
        public String getLeader() { return leader; }
        public long getCommitIndex() { return commitIndex; }
        public long getLastApplied() { return lastApplied; }
        public String getNodeId() { return nodeId; }
        public int getValidatorCount() { return validatorCount; }
    }

    /**
     * Shard manager for adaptive sharding
     */
    public static class ShardManager {
        private final int shardId;
        private final List<String> validators;
        private final double load;
        private final double efficiency;
        private final double rebalanceThreshold;

        public ShardManager(int shardId, List<String> validators, double load, 
                           double efficiency, double rebalanceThreshold) {
            this.shardId = shardId;
            this.validators = validators;
            this.load = load;
            this.efficiency = efficiency;
            this.rebalanceThreshold = rebalanceThreshold;
        }

        public int getShardId() { return shardId; }
        public List<String> getValidators() { return validators; }
        public double getLoad() { return load; }
        public double getEfficiency() { return efficiency; }
        public double getRebalanceThreshold() { return rebalanceThreshold; }
    }

    /**
     * Quantum consensus proof
     */
    public static class QuantumConsensusProof {
        private final String signature;
        private final boolean valid;
        private final Instant timestamp;

        public QuantumConsensusProof(String signature, boolean valid, Instant timestamp) {
            this.signature = signature;
            this.valid = valid;
            this.timestamp = timestamp;
        }

        public String getSignature() { return signature; }
        public boolean isValid() { return valid; }
        public Instant getTimestamp() { return timestamp; }
    }

    /**
     * Validation dimension for multi-dimensional validation
     */
    public static class ValidationDimension {
        private final String name;
        private final boolean enabled;
        private final long processedCount;
        private final long successCount;

        public ValidationDimension(String name, boolean enabled, long processedCount, long successCount) {
            this.name = name;
            this.enabled = enabled;
            this.processedCount = processedCount;
            this.successCount = successCount;
        }

        public String getName() { return name; }
        public boolean isEnabled() { return enabled; }
        public long getProcessedCount() { return processedCount; }
        public long getSuccessCount() { return successCount; }
    }

    /**
     * ZK Proof for zero-knowledge operations
     */
    public static class ZKProof {
        private final String transactionId;
        private final String proof;

        public ZKProof(String transactionId, String proof) {
            this.transactionId = transactionId;
            this.proof = proof;
        }

        public String getTransactionId() { return transactionId; }
        public String getProof() { return proof; }
    }

    /**
     * Aggregated ZK Proof
     */
    public static class ZKAggregateProof {
        private final String proofType;
        private final int proofCount;
        private final int compressedSize;
        private final double compressionRatio;
        private final long verificationTime;

        public ZKAggregateProof(String proofType, int proofCount, int compressedSize, 
                               double compressionRatio, long verificationTime) {
            this.proofType = proofType;
            this.proofCount = proofCount;
            this.compressedSize = compressedSize;
            this.compressionRatio = compressionRatio;
            this.verificationTime = verificationTime;
        }

        public String getProofType() { return proofType; }
        public int getProofCount() { return proofCount; }
        public int getCompressedSize() { return compressedSize; }
        public double getCompressionRatio() { return compressionRatio; }
        public long getVerificationTime() { return verificationTime; }
    }
}