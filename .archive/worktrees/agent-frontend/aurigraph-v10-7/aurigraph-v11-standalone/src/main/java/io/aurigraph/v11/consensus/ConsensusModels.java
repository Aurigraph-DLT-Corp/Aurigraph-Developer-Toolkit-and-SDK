package io.aurigraph.v11.consensus;

import java.time.Instant;
import java.util.List;

/**
 * Data models and enums for HyperRAFT++ Consensus
 */
public class ConsensusModels {
    
    // Enums
    public enum ConsensusState {
        FOLLOWER,
        CANDIDATE, 
        LEADER
    }
    
    public enum ElectionState {
        FOLLOWER,
        CANDIDATE,
        LEADER
    }
    
    public enum ConsensusEventType {
        LEADER_ELECTED,
        BECAME_FOLLOWER,
        HEARTBEAT_SENT,
        BLOCK_FINALIZED,
        ELECTION_STARTED
    }
    
    public enum ElectionEventType {
        LEADER_ELECTED,
        ELECTION_FAILED,
        VOTE_REQUESTED,
        VOTE_GRANTED
    }
    
    // Core data models
    public static class Transaction {
        private final String id;
        private final String hash;
        private final Object data;
        private final long timestamp;
        private final String from;
        private final String to;
        private final Long amount;
        private final ZKProof zkProof;
        private final String signature;
        
        public Transaction(String id, String hash, Object data, long timestamp,
                         String from, String to, Long amount, ZKProof zkProof, String signature) {
            this.id = id;
            this.hash = hash;
            this.data = data;
            this.timestamp = timestamp;
            this.from = from;
            this.to = to;
            this.amount = amount;
            this.zkProof = zkProof;
            this.signature = signature;
        }
        
        // Getters
        public String getId() { return id; }
        public String getHash() { return hash; }
        public Object getData() { return data; }
        public long getTimestamp() { return timestamp; }
        public String getFrom() { return from; }
        public String getTo() { return to; }
        public Long getAmount() { return amount; }
        public ZKProof getZkProof() { return zkProof; }
        public String getSignature() { return signature; }
    }
    
    public static class TransactionBatch {
        private final String id;
        private final List<Transaction> transactions;
        private final Instant timestamp;
        private final int term;
        private final String nodeId;
        
        private List<Transaction> validatedTransactions;
        private List<Transaction> proovedTransactions;
        private List<ExecutionResult> executionResults;
        private String stateRoot;
        
        public TransactionBatch(String id, List<Transaction> transactions, 
                               Instant timestamp, int term, String nodeId) {
            this.id = id;
            this.transactions = transactions;
            this.timestamp = timestamp;
            this.term = term;
            this.nodeId = nodeId;
        }
        
        // Getters and setters
        public String getId() { return id; }
        public List<Transaction> getTransactions() { return transactions; }
        public Instant getTimestamp() { return timestamp; }
        public int getTerm() { return term; }
        public String getNodeId() { return nodeId; }
        
        public List<Transaction> getValidatedTransactions() { return validatedTransactions; }
        public void setValidatedTransactions(List<Transaction> validatedTransactions) {
            this.validatedTransactions = validatedTransactions;
        }
        
        public List<Transaction> getProovedTransactions() { return proovedTransactions; }
        public void setProovedTransactions(List<Transaction> proovedTransactions) {
            this.proovedTransactions = proovedTransactions;
        }
        
        public List<ExecutionResult> getExecutionResults() { return executionResults; }
        public void setExecutionResults(List<ExecutionResult> executionResults) {
            this.executionResults = executionResults;
        }
        
        public String getStateRoot() { return stateRoot; }
        public void setStateRoot(String stateRoot) { this.stateRoot = stateRoot; }
    }
    
    public static class Block {
        private final long height;
        private final String hash;
        private final String previousHash;
        private final List<Transaction> transactions;
        private final Instant timestamp;
        private final String validator;
        private final ConsensusProof consensusProof;
        
        public Block(long height, String hash, String previousHash, 
                    List<Transaction> transactions, Instant timestamp,
                    String validator, ConsensusProof consensusProof) {
            this.height = height;
            this.hash = hash;
            this.previousHash = previousHash;
            this.transactions = transactions;
            this.timestamp = timestamp;
            this.validator = validator;
            this.consensusProof = consensusProof;
        }
        
        // Getters
        public long getHeight() { return height; }
        public String getHash() { return hash; }
        public String getPreviousHash() { return previousHash; }
        public List<Transaction> getTransactions() { return transactions; }
        public Instant getTimestamp() { return timestamp; }
        public String getValidator() { return validator; }
        public ConsensusProof getConsensusProof() { return consensusProof; }
    }
    
    public static class ConsensusProof {
        private final int term;
        private final String signature;
        
        public ConsensusProof(int term, String signature) {
            this.term = term;
            this.signature = signature;
        }
        
        public int getTerm() { return term; }
        public String getSignature() { return signature; }
    }
    
    public static class ZKProof {
        private final String id;
        private final String proofData;
        private final long timestamp;
        private final boolean verified;
        
        public ZKProof(String id, String proofData, long timestamp, boolean verified) {
            this.id = id;
            this.proofData = proofData;
            this.timestamp = timestamp;
            this.verified = verified;
        }
        
        public String getId() { return id; }
        public String getProofData() { return proofData; }
        public long getTimestamp() { return timestamp; }
        public boolean isVerified() { return verified; }
    }
    
    public static class ExecutionResult {
        private final String transactionHash;
        private final boolean success;
        private final long gasUsed;
        private final String message;
        
        public ExecutionResult(String transactionHash, boolean success, long gasUsed, String message) {
            this.transactionHash = transactionHash;
            this.success = success;
            this.gasUsed = gasUsed;
            this.message = message;
        }
        
        public String getTransactionHash() { return transactionHash; }
        public boolean isSuccess() { return success; }
        public long getGasUsed() { return gasUsed; }
        public String getMessage() { return message; }
    }
    
    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        private final long timestamp;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
        
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public long getTimestamp() { return timestamp; }
        
        public boolean isRecent() {
            return (System.currentTimeMillis() - timestamp) < 60000; // 1 minute
        }
    }
    
    public static class ZKProofResult {
        private final boolean success;
        private final ZKProof zkProof;
        private final String message;
        
        public ZKProofResult(boolean success, ZKProof zkProof, String message) {
            this.success = success;
            this.zkProof = zkProof;
            this.message = message;
        }
        
        public boolean isSuccess() { return success; }
        public ZKProof getZkProof() { return zkProof; }
        public String getMessage() { return message; }
    }
    
    // Status and metrics classes
    public static class ConsensusStatus {
        private final ConsensusState state;
        private final int term;
        private final String leader;
        private final long commitIndex;
        private final long lastApplied;
        private final String nodeId;
        private final int validatorCount;
        
        public ConsensusStatus(ConsensusState state, int term, String leader,
                              long commitIndex, long lastApplied, 
                              String nodeId, int validatorCount) {
            this.state = state;
            this.term = term;
            this.leader = leader;
            this.commitIndex = commitIndex;
            this.lastApplied = lastApplied;
            this.nodeId = nodeId;
            this.validatorCount = validatorCount;
        }
        
        // Getters
        public ConsensusState getState() { return state; }
        public int getTerm() { return term; }
        public String getLeader() { return leader; }
        public long getCommitIndex() { return commitIndex; }
        public long getLastApplied() { return lastApplied; }
        public String getNodeId() { return nodeId; }
        public int getValidatorCount() { return validatorCount; }
    }
    
    public static class PerformanceMetrics {
        private final double currentTps;
        private final double peakTps;
        private final double avgLatency;
        private final double successRate;
        private final long totalProcessed;
        private final long totalSuccessful;
        
        public PerformanceMetrics(double currentTps, double peakTps, double avgLatency,
                                 double successRate, long totalProcessed, long totalSuccessful) {
            this.currentTps = currentTps;
            this.peakTps = peakTps;
            this.avgLatency = avgLatency;
            this.successRate = successRate;
            this.totalProcessed = totalProcessed;
            this.totalSuccessful = totalSuccessful;
        }
        
        // Getters
        public double getCurrentTps() { return currentTps; }
        public double getPeakTps() { return peakTps; }
        public double getAvgLatency() { return avgLatency; }
        public double getSuccessRate() { return successRate; }
        public long getTotalProcessed() { return totalProcessed; }
        public long getTotalSuccessful() { return totalSuccessful; }
    }
    
    public static class ValidationMetrics {
        private final long totalValidations;
        private final long successfulValidations;
        private final long totalZKProofs;
        private final long successfulZKProofs;
        private final long totalExecutions;
        private final long successfulExecutions;
        private final int cacheSize;
        
        public ValidationMetrics(long totalValidations, long successfulValidations,
                                long totalZKProofs, long successfulZKProofs,
                                long totalExecutions, long successfulExecutions,
                                int cacheSize) {
            this.totalValidations = totalValidations;
            this.successfulValidations = successfulValidations;
            this.totalZKProofs = totalZKProofs;
            this.successfulZKProofs = successfulZKProofs;
            this.totalExecutions = totalExecutions;
            this.successfulExecutions = successfulExecutions;
            this.cacheSize = cacheSize;
        }
        
        // Getters and calculated metrics
        public long getTotalValidations() { return totalValidations; }
        public long getSuccessfulValidations() { return successfulValidations; }
        public long getTotalZKProofs() { return totalZKProofs; }
        public long getSuccessfulZKProofs() { return successfulZKProofs; }
        public long getTotalExecutions() { return totalExecutions; }
        public long getSuccessfulExecutions() { return successfulExecutions; }
        public int getCacheSize() { return cacheSize; }
        
        public double getValidationSuccessRate() {
            return totalValidations > 0 ? (double) successfulValidations / totalValidations * 100 : 100.0;
        }
        
        public double getZKProofSuccessRate() {
            return totalZKProofs > 0 ? (double) successfulZKProofs / totalZKProofs * 100 : 100.0;
        }
        
        public double getExecutionSuccessRate() {
            return totalExecutions > 0 ? (double) successfulExecutions / totalExecutions * 100 : 100.0;
        }
    }
    
    // Event classes
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
    
    public static class ElectionEvent {
        private final ElectionEventType type;
        private final String nodeId;
        private final int term;
        private final long duration;
        private final long timestamp;
        
        public ElectionEvent(ElectionEventType type, String nodeId, int term, long duration) {
            this.type = type;
            this.nodeId = nodeId;
            this.term = term;
            this.duration = duration;
            this.timestamp = System.currentTimeMillis();
        }
        
        public ElectionEventType getType() { return type; }
        public String getNodeId() { return nodeId; }
        public int getTerm() { return term; }
        public long getDuration() { return duration; }
        public long getTimestamp() { return timestamp; }
    }
    
    // Election-related classes
    public static class ElectionResult {
        private final boolean elected;
        private final int term;
        private final String leaderId;
        private final long duration;
        private final String message;
        
        public ElectionResult(boolean elected, int term, String leaderId, long duration, String message) {
            this.elected = elected;
            this.term = term;
            this.leaderId = leaderId;
            this.duration = duration;
            this.message = message;
        }
        
        public boolean isElected() { return elected; }
        public int getTerm() { return term; }
        public String getLeaderId() { return leaderId; }
        public long getDuration() { return duration; }
        public String getMessage() { return message; }
    }
    
    public static class ElectionMetrics {
        private final long totalElections;
        private final long successfulElections;
        private final int currentTerm;
        private final long timeSinceLastHeartbeat;
        private final double averageElectionTime;
        
        public ElectionMetrics(long totalElections, long successfulElections,
                              int currentTerm, long timeSinceLastHeartbeat,
                              double averageElectionTime) {
            this.totalElections = totalElections;
            this.successfulElections = successfulElections;
            this.currentTerm = currentTerm;
            this.timeSinceLastHeartbeat = timeSinceLastHeartbeat;
            this.averageElectionTime = averageElectionTime;
        }
        
        public long getTotalElections() { return totalElections; }
        public long getSuccessfulElections() { return successfulElections; }
        public int getCurrentTerm() { return currentTerm; }
        public long getTimeSinceLastHeartbeat() { return timeSinceLastHeartbeat; }
        public double getAverageElectionTime() { return averageElectionTime; }
        
        public double getElectionSuccessRate() {
            return totalElections > 0 ? (double) successfulElections / totalElections * 100 : 100.0;
        }
    }
    
    public static class VoteRequest {
        private final int term;
        private final String candidateId;
        private final long lastLogIndex;
        private final int lastLogTerm;
        
        public VoteRequest(int term, String candidateId, long lastLogIndex, int lastLogTerm) {
            this.term = term;
            this.candidateId = candidateId;
            this.lastLogIndex = lastLogIndex;
            this.lastLogTerm = lastLogTerm;
        }
        
        public int getTerm() { return term; }
        public String getCandidateId() { return candidateId; }
        public long getLastLogIndex() { return lastLogIndex; }
        public int getLastLogTerm() { return lastLogTerm; }
    }
    
    public static class VoteResponse {
        private final String nodeId;
        private final int term;
        private final boolean voteGranted;
        private final String message;
        
        public VoteResponse(String nodeId, int term, boolean voteGranted, String message) {
            this.nodeId = nodeId;
            this.term = term;
            this.voteGranted = voteGranted;
            this.message = message;
        }
        
        public String getNodeId() { return nodeId; }
        public int getTerm() { return term; }
        public boolean isVoteGranted() { return voteGranted; }
        public String getMessage() { return message; }
    }
    
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
    
    public static class NodeMetrics {
        private final String nodeId;
        private double averageLatency;
        private int failureCount;
        private double connectivityScore;
        private double resourceScore;
        private double reliabilityScore;
        private Instant lastSeen;
        private boolean healthy;
        
        public NodeMetrics(String nodeId) {
            this.nodeId = nodeId;
            this.averageLatency = 50.0; // Default 50ms
            this.failureCount = 0;
            this.connectivityScore = 1.0;
            this.resourceScore = 1.0;
            this.reliabilityScore = 1.0;
            this.lastSeen = Instant.now();
            this.healthy = true;
        }
        
        // Getters
        public String getNodeId() { return nodeId; }
        public double getAverageLatency() { return averageLatency; }
        public int getFailureCount() { return failureCount; }
        public double getConnectivityScore() { return connectivityScore; }
        public double getResourceScore() { return resourceScore; }
        public double getReliabilityScore() { return reliabilityScore; }
        public Instant getLastSeen() { return lastSeen; }
        public boolean isHealthy() { return healthy; }
        
        // Update methods
        public void updateLatency(double latency) {
            this.averageLatency = (this.averageLatency * 0.9) + (latency * 0.1);
            this.lastSeen = Instant.now();
        }
        
        public void recordFailure() {
            this.failureCount++;
            this.reliabilityScore = Math.max(0.1, this.reliabilityScore * 0.9);
        }
        
        public void recordHeartbeat() {
            this.lastSeen = Instant.now();
            this.healthy = true;
            this.connectivityScore = Math.min(1.0, this.connectivityScore + 0.1);
        }
        
        public void setHealthy(boolean healthy) {
            this.healthy = healthy;
            if (!healthy) {
                this.failureCount++;
            }
        }
    }
}