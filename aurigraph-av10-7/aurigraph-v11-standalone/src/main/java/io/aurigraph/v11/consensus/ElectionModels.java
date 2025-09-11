package io.aurigraph.v11.consensus;

import java.time.Instant;

/**
 * Election-related models for HyperRAFT++ consensus
 */
public class ElectionModels {

    /**
     * Election state enumeration
     */
    public enum ElectionState {
        FOLLOWER, CANDIDATE, LEADER
    }

    /**
     * Election event types
     */
    public enum ElectionEventType {
        LEADER_ELECTED,
        ELECTION_FAILED,
        ELECTION_STARTED,
        VOTE_RECEIVED,
        HEARTBEAT_TIMEOUT
    }

    /**
     * Election event
     */
    public static class ElectionEvent {
        private final ElectionEventType type;
        private final String nodeId;
        private final int term;
        private final long duration;
        private final Instant timestamp;

        public ElectionEvent(ElectionEventType type, String nodeId, int term, long duration) {
            this.type = type;
            this.nodeId = nodeId;
            this.term = term;
            this.duration = duration;
            this.timestamp = Instant.now();
        }

        public ElectionEventType getType() { return type; }
        public String getNodeId() { return nodeId; }
        public int getTerm() { return term; }
        public long getDuration() { return duration; }
        public Instant getTimestamp() { return timestamp; }
    }

    /**
     * Election result
     */
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

    /**
     * Vote request message
     */
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

    /**
     * Vote response message
     */
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

    /**
     * Node metrics for leader election decisions
     */
    public static class NodeMetrics {
        private final String nodeId;
        private double averageLatency;
        private int failureCount;
        private double connectivityScore;
        private double resourceScore;
        private double reliabilityScore;
        private Instant lastSeen;
        private boolean healthy;
        private long lastHeartbeat;

        public NodeMetrics(String nodeId) {
            this.nodeId = nodeId;
            this.averageLatency = 50.0; // Default 50ms
            this.failureCount = 0;
            this.connectivityScore = 1.0;
            this.resourceScore = 1.0;
            this.reliabilityScore = 1.0;
            this.lastSeen = Instant.now();
            this.healthy = true;
            this.lastHeartbeat = System.currentTimeMillis();
        }

        public String getNodeId() { return nodeId; }
        public double getAverageLatency() { return averageLatency; }
        public int getFailureCount() { return failureCount; }
        public double getConnectivityScore() { return connectivityScore; }
        public double getResourceScore() { return resourceScore; }
        public double getReliabilityScore() { return reliabilityScore; }
        public Instant getLastSeen() { return lastSeen; }
        public boolean isHealthy() { return healthy; }

        public void updateLatency(double latency) {
            this.averageLatency = (this.averageLatency * 0.8) + (latency * 0.2);
            this.lastSeen = Instant.now();
        }

        public void setHealthy(boolean healthy) {
            this.healthy = healthy;
            if (!healthy) {
                this.failureCount++;
            }
        }

        public void recordHeartbeat() {
            this.lastHeartbeat = System.currentTimeMillis();
            this.lastSeen = Instant.now();
            this.connectivityScore = Math.min(1.0, this.connectivityScore + 0.1);
        }

        public void recordFailure() {
            this.failureCount++;
            this.connectivityScore = Math.max(0.0, this.connectivityScore - 0.2);
            this.reliabilityScore = Math.max(0.0, this.reliabilityScore - 0.1);
        }
    }

    /**
     * Election metrics for monitoring
     */
    public static class ElectionMetrics {
        private final long totalElections;
        private final long successfulElections;
        private final int currentTerm;
        private final long timeSinceLastHeartbeat;
        private final double averageElectionTime;

        public ElectionMetrics(long totalElections, long successfulElections, int currentTerm,
                              long timeSinceLastHeartbeat, double averageElectionTime) {
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

        public double getSuccessRate() {
            return totalElections > 0 ? (double) successfulElections / totalElections : 0.0;
        }
    }
}