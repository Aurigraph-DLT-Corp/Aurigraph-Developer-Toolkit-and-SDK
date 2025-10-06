package io.aurigraph.v11.consensus;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@ApplicationScoped
public class HyperRAFTConsensusService {
    
    private static final Logger LOG = Logger.getLogger(HyperRAFTConsensusService.class);
    
    // Consensus state
    private final AtomicReference<NodeState> currentState = new AtomicReference<>(NodeState.FOLLOWER);
    private final AtomicLong currentTerm = new AtomicLong(0);
    private final AtomicLong commitIndex = new AtomicLong(0);
    private final AtomicLong lastApplied = new AtomicLong(0);
    
    // Node configuration
    private String nodeId = UUID.randomUUID().toString();
    private String leaderId;
    private Set<String> clusterNodes = new HashSet<>();
    
    // Performance metrics
    private final AtomicLong consensusLatency = new AtomicLong(0);
    private final AtomicLong throughput = new AtomicLong(0);
    
    // Log entries
    private final List<LogEntry> log = Collections.synchronizedList(new ArrayList<>());
    
    public enum NodeState {
        FOLLOWER,
        CANDIDATE, 
        LEADER
    }
    
    public static class LogEntry {
        public final long term;
        public final String command;
        public final Instant timestamp;
        
        public LogEntry(long term, String command) {
            this.term = term;
            this.command = command;
            this.timestamp = Instant.now();
        }
    }
    
    public static class ConsensusStats {
        public final String nodeId;
        public final NodeState state;
        public final long currentTerm;
        public final long commitIndex;
        public final String leaderId;
        public final long consensusLatency;
        public final long throughput;
        public final int clusterSize;

        public ConsensusStats(String nodeId, NodeState state, long currentTerm,
                            long commitIndex, String leaderId, long consensusLatency,
                            long throughput, int clusterSize) {
            this.nodeId = nodeId;
            this.state = state;
            this.currentTerm = currentTerm;
            this.commitIndex = commitIndex;
            this.leaderId = leaderId;
            this.consensusLatency = consensusLatency;
            this.throughput = throughput;
            this.clusterSize = clusterSize;
        }
    }

    public static class ConsensusStatus {
        public final String status;
        public final boolean healthy;
        public final long latency;
        public final Instant timestamp;

        public ConsensusStatus(String status, boolean healthy, long latency) {
            this.status = status;
            this.healthy = healthy;
            this.latency = latency;
            this.timestamp = Instant.now();
        }
    }

    public static class PerformanceMetrics {
        public final long tps;
        public final long latency;
        public final Instant timestamp;

        public PerformanceMetrics(long tps, long latency) {
            this.tps = tps;
            this.latency = latency;
            this.timestamp = Instant.now();
        }
    }
    
    public Uni<ConsensusStats> getStats() {
        return Uni.createFrom().item(() -> {
            return new ConsensusStats(
                nodeId,
                currentState.get(),
                currentTerm.get(),
                commitIndex.get(),
                leaderId,
                consensusLatency.get(),
                throughput.get(),
                clusterNodes.size()
            );
        });
    }
    
    public Uni<Boolean> proposeValue(String value) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();
            
            if (currentState.get() != NodeState.LEADER) {
                LOG.warn("Node is not leader, cannot propose value");
                return false;
            }
            
            // Add to log
            LogEntry entry = new LogEntry(currentTerm.get(), value);
            log.add(entry);
            
            // Simulate consensus process
            boolean success = simulateConsensus();
            
            if (success) {
                commitIndex.incrementAndGet();
                throughput.incrementAndGet();
            }
            
            long elapsed = System.currentTimeMillis() - startTime;
            consensusLatency.set(elapsed);
            
            LOG.infof("Consensus completed in %d ms for value: %s", elapsed, value);
            return success;
        });
    }
    
    private boolean simulateConsensus() {
        // Simulate consensus with high success rate
        return Math.random() > 0.01; // 99% success rate
    }
    
    public Uni<Boolean> startElection() {
        return Uni.createFrom().item(() -> {
            currentState.set(NodeState.CANDIDATE);
            currentTerm.incrementAndGet();
            
            LOG.infof("Node %s starting election for term %d", nodeId, currentTerm.get());
            
            // Simulate election process
            boolean wonElection = Math.random() > 0.3; // 70% chance to win
            
            if (wonElection) {
                currentState.set(NodeState.LEADER);
                leaderId = nodeId;
                LOG.infof("Node %s won election and became leader", nodeId);
            } else {
                currentState.set(NodeState.FOLLOWER);
                LOG.infof("Node %s lost election, reverting to follower", nodeId);
            }
            
            return wonElection;
        });
    }
    
    public Uni<Boolean> appendEntries(long term, String leaderId, List<LogEntry> entries) {
        return Uni.createFrom().item(() -> {
            if (term < currentTerm.get()) {
                return false;
            }
            
            currentTerm.set(term);
            this.leaderId = leaderId;
            currentState.set(NodeState.FOLLOWER);
            
            if (entries != null && !entries.isEmpty()) {
                log.addAll(entries);
                commitIndex.addAndGet(entries.size());
            }
            
            return true;
        });
    }
    
    public void addNode(String nodeId) {
        clusterNodes.add(nodeId);
        LOG.infof("Added node %s to cluster, total nodes: %d", nodeId, clusterNodes.size());
    }
    
    public void removeNode(String nodeId) {
        clusterNodes.remove(nodeId);
        LOG.infof("Removed node %s from cluster, total nodes: %d", nodeId, clusterNodes.size());
    }
    
    public String getNodeId() {
        return nodeId;
    }
    
    public NodeState getCurrentState() {
        return currentState.get();
    }
    
    public long getCurrentTerm() {
        return currentTerm.get();
    }
}