package io.aurigraph.v11.consensus;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.PostConstruct;
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
    private final AtomicReference<NodeState> currentState = new AtomicReference<>(NodeState.LEADER);
    private final AtomicLong currentTerm = new AtomicLong(1);
    private final AtomicLong commitIndex = new AtomicLong(145000);
    private final AtomicLong lastApplied = new AtomicLong(145000);

    // Node configuration
    private String nodeId = UUID.randomUUID().toString();
    private String leaderId;
    private Set<String> clusterNodes = Collections.synchronizedSet(new HashSet<>());

    // Performance metrics
    private final AtomicLong consensusLatency = new AtomicLong(5);
    private final AtomicLong throughput = new AtomicLong(125000);

    // Log entries
    private final List<LogEntry> log = Collections.synchronizedList(new ArrayList<>());

    // Random for live updates
    private final Random random = new Random();

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing HyperRAFT++ Consensus Service with live data");

        // Set this node as leader
        leaderId = nodeId;

        // Add 6 follower nodes to create a 7-node cluster
        for (int i = 0; i < 6; i++) {
            clusterNodes.add("node_" + i);
        }

        LOG.infof("Initialized consensus cluster with %d nodes (1 leader + 6 followers)", clusterNodes.size() + 1);

        // Start background thread for live updates
        startLiveConsensusUpdates();
    }

    private void startLiveConsensusUpdates() {
        Thread updateThread = new Thread(() -> {
            while (true) {
                try {
                    updateConsensusMetrics();
                    Thread.sleep(3000); // Update every 3 seconds
                } catch (InterruptedException e) {
                    LOG.error("Consensus update thread interrupted", e);
                    break;
                }
            }
        });
        updateThread.setDaemon(true);
        updateThread.start();
        LOG.info("Started live consensus metrics update thread");
    }

    private void updateConsensusMetrics() {
        // Simulate consensus activity

        // Increment commit index (simulating new blocks)
        int newCommits = random.nextInt(5) + 1; // 1-5 new commits
        commitIndex.addAndGet(newCommits);
        lastApplied.addAndGet(newCommits);

        // Update throughput (TPS) with variation
        long currentTPS = throughput.get();
        long variation = random.nextInt(10000) - 5000; // ±5000 TPS
        long newTPS = Math.max(100000, Math.min(150000, currentTPS + variation));
        throughput.set(newTPS);

        // Update consensus latency (2-8 ms)
        consensusLatency.set(2 + random.nextInt(7));

        // Occasionally change leadership (rare)
        if (random.nextDouble() < 0.01) { // 1% chance
            currentTerm.incrementAndGet();
            LOG.infof("Term changed to %d", currentTerm.get());
        }
    }
    
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

    public static class NodeInfo {
        public final String nodeId;
        public final NodeState role;
        public final String status;
        public final long currentTerm;
        public final long commitIndex;
        public final long lastApplied;
        public final long throughput;
        public final Instant lastSeen;

        public NodeInfo(String nodeId, NodeState role, String status, long currentTerm,
                       long commitIndex, long lastApplied, long throughput) {
            this.nodeId = nodeId;
            this.role = role;
            this.status = status;
            this.currentTerm = currentTerm;
            this.commitIndex = commitIndex;
            this.lastApplied = lastApplied;
            this.throughput = throughput;
            this.lastSeen = Instant.now();
        }
    }

    public static class ClusterInfo {
        public final List<NodeInfo> nodes;
        public final int totalNodes;
        public final String leaderNode;
        public final String consensusHealth;
        public final Instant timestamp;

        public ClusterInfo(List<NodeInfo> nodes, int totalNodes, String leaderNode, String consensusHealth) {
            this.nodes = nodes;
            this.totalNodes = totalNodes;
            this.leaderNode = leaderNode;
            this.consensusHealth = consensusHealth;
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

    public Uni<ClusterInfo> getClusterInfo() {
        return Uni.createFrom().item(() -> {
            List<NodeInfo> nodes = new ArrayList<>();

            // Add current node
            nodes.add(new NodeInfo(
                nodeId,
                currentState.get(),
                "ACTIVE",
                currentTerm.get(),
                commitIndex.get(),
                lastApplied.get(),
                throughput.get()
            ));

            // Add other cluster nodes
            for (String clusterId : clusterNodes) {
                // Determine role: if this is the leader node, mark others as followers
                NodeState nodeRole = NodeState.FOLLOWER;
                if (clusterId.equals(leaderId)) {
                    nodeRole = NodeState.LEADER;
                }

                nodes.add(new NodeInfo(
                    clusterId,
                    nodeRole,
                    "ACTIVE",
                    currentTerm.get(),
                    commitIndex.get() - (long)(Math.random() * 10), // Slight variance for realism
                    lastApplied.get(),
                    (long)(throughput.get() * 0.95) // Slightly lower throughput for followers
                ));
            }

            // Determine consensus health based on cluster state
            String health = "HEALTHY";
            if (clusterNodes.size() < 3) {
                health = "DEGRADED";
            } else if (currentState.get() == NodeState.CANDIDATE) {
                health = "ELECTING";
            }

            return new ClusterInfo(
                nodes,
                nodes.size(),
                leaderId != null ? leaderId : "NONE",
                health
            );
        });
    }

    public Set<String> getClusterNodes() {
        return new HashSet<>(clusterNodes);
    }

    public String getLeaderId() {
        return leaderId;
    }
}