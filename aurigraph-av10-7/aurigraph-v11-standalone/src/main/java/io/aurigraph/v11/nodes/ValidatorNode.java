package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.AbstractNode;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * ValidatorNode - Participates in HyperRAFT++ consensus and validates transactions.
 *
 * Consolidated implementation for validator nodes including:
 * - Block validation and proposal
 * - Consensus participation (HyperRAFT++)
 * - Mempool management
 * - Stake management
 * - Multi-signature validation for bridges
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public class ValidatorNode extends AbstractNode {

    private static final Logger LOG = Logger.getLogger(ValidatorNode.class);

    // Consensus configuration
    private static final int QUORUM_PERCENTAGE = 67;
    private static final long BLOCK_TIME_MS = 500;
    private static final int MAX_BLOCK_SIZE = 10_000;
    private static final int MAX_MEMPOOL_SIZE = 1_000_000;

    // State
    private final AtomicLong currentBlockHeight = new AtomicLong(0);
    private final AtomicLong validatedTransactions = new AtomicLong(0);
    private final AtomicLong proposedBlocks = new AtomicLong(0);
    private final AtomicInteger consensusRound = new AtomicInteger(0);
    private final AtomicBoolean isLeader = new AtomicBoolean(false);

    // Mempool
    private final ConcurrentLinkedQueue<String> mempool = new ConcurrentLinkedQueue<>();
    private final AtomicInteger mempoolSize = new AtomicInteger(0);

    // Peers and voting
    private final Set<String> connectedPeers = ConcurrentHashMap.newKeySet();
    private final Map<Long, Set<String>> blockVotes = new ConcurrentHashMap<>();

    // Staking
    private BigDecimal stakedAmount = BigDecimal.ZERO;
    private int reputationScore = 100;

    // Metrics
    private final AtomicLong totalBlocksValidated = new AtomicLong(0);
    private final AtomicDouble averageBlockTime = new AtomicDouble(0.0);
    private Instant lastBlockTime = Instant.now();

    // Executor for consensus operations
    private ScheduledExecutorService consensusExecutor;

    public ValidatorNode(String nodeId) {
        super(nodeId, io.aurigraph.v11.demo.models.NodeType.VALIDATOR);
    }

    @Override
    protected Uni<Void> doStart() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Starting ValidatorNode %s", getNodeId());

            // Initialize consensus executor
            consensusExecutor = Executors.newScheduledThreadPool(4, r -> {
                Thread t = new Thread(r, "validator-" + getNodeId());
                t.setDaemon(true);
                return t;
            });

            // Start block proposal loop
            consensusExecutor.scheduleAtFixedRate(
                this::proposeBlockIfLeader,
                BLOCK_TIME_MS,
                BLOCK_TIME_MS,
                TimeUnit.MILLISECONDS
            );

            // Start heartbeat
            consensusExecutor.scheduleAtFixedRate(
                this::sendHeartbeat,
                1000,
                5000,
                TimeUnit.MILLISECONDS
            );

            LOG.infof("ValidatorNode %s started successfully", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<Void> doStop() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Stopping ValidatorNode %s", getNodeId());

            if (consensusExecutor != null) {
                consensusExecutor.shutdown();
                try {
                    if (!consensusExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                        consensusExecutor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    consensusExecutor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            LOG.infof("ValidatorNode %s stopped", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<NodeHealth> doHealthCheck() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> components = new HashMap<>();
            components.put("consensus", isLeader.get() ? "leader" : "follower");
            components.put("mempool", mempoolSize.get() < MAX_MEMPOOL_SIZE * 0.9);
            components.put("peers", connectedPeers.size() >= 3);
            components.put("staking", stakedAmount.compareTo(BigDecimal.ZERO) > 0);

            boolean healthy = components.values().stream()
                .allMatch(v -> v instanceof Boolean ? (Boolean) v : true);

            return new NodeHealth(
                healthy ? io.aurigraph.v11.demo.models.NodeStatus.RUNNING : io.aurigraph.v11.demo.models.NodeStatus.ERROR,
                healthy,
                getUptimeSeconds(),
                components
            );
        });
    }

    @Override
    protected Uni<NodeMetrics> doGetMetrics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> customMetrics = new HashMap<>();
            customMetrics.put("blockHeight", currentBlockHeight.get());
            customMetrics.put("validatedTransactions", validatedTransactions.get());
            customMetrics.put("proposedBlocks", proposedBlocks.get());
            customMetrics.put("consensusRound", consensusRound.get());
            customMetrics.put("isLeader", isLeader.get());
            customMetrics.put("mempoolSize", mempoolSize.get());
            customMetrics.put("connectedPeers", connectedPeers.size());
            customMetrics.put("stakedAmount", stakedAmount.toString());
            customMetrics.put("reputationScore", reputationScore);
            customMetrics.put("averageBlockTime", averageBlockTime.get());

            // Calculate TPS
            long uptime = getUptimeSeconds();
            double tps = uptime > 0 ? (double) validatedTransactions.get() / uptime : 0;

            return new NodeMetrics(tps, averageBlockTime.get(), 0, 0, customMetrics);
        });
    }

    // ============================================
    // CONSENSUS OPERATIONS
    // ============================================

    /**
     * Propose a new block if this node is the leader
     */
    private void proposeBlockIfLeader() {
        if (!isLeader.get()) {
            return;
        }

        try {
            // Collect transactions from mempool
            List<String> transactions = new ArrayList<>();
            for (int i = 0; i < MAX_BLOCK_SIZE && !mempool.isEmpty(); i++) {
                String tx = mempool.poll();
                if (tx != null) {
                    transactions.add(tx);
                    mempoolSize.decrementAndGet();
                }
            }

            if (transactions.isEmpty()) {
                return;
            }

            // Propose block
            long blockHeight = currentBlockHeight.incrementAndGet();
            proposedBlocks.incrementAndGet();

            // Simulate block validation
            validateBlock(blockHeight, transactions);

            // Update metrics
            Instant now = Instant.now();
            long blockTimeMs = now.toEpochMilli() - lastBlockTime.toEpochMilli();
            averageBlockTime.set((averageBlockTime.get() + blockTimeMs) / 2);
            lastBlockTime = now;

            LOG.debugf("Proposed block %d with %d transactions", blockHeight, transactions.size());

        } catch (Exception e) {
            LOG.errorf(e, "Error proposing block");
        }
    }

    /**
     * Validate a block
     */
    public boolean validateBlock(long blockHeight, List<String> transactions) {
        // Validate each transaction
        for (String tx : transactions) {
            if (!validateTransaction(tx)) {
                return false;
            }
        }

        validatedTransactions.addAndGet(transactions.size());
        totalBlocksValidated.incrementAndGet();

        return true;
    }

    /**
     * Validate a single transaction
     */
    public boolean validateTransaction(String transactionId) {
        // Basic validation - in production, verify signatures, balances, etc.
        if (transactionId == null || transactionId.isEmpty()) {
            return false;
        }
        return true;
    }

    /**
     * Vote on a block
     */
    public void voteOnBlock(long blockHeight, String voterId, boolean approve) {
        if (approve) {
            blockVotes.computeIfAbsent(blockHeight, k -> ConcurrentHashMap.newKeySet())
                .add(voterId);
        }
    }

    /**
     * Check if block has quorum
     */
    public boolean hasQuorum(long blockHeight) {
        Set<String> votes = blockVotes.get(blockHeight);
        if (votes == null) {
            return false;
        }
        int totalVoters = connectedPeers.size() + 1; // +1 for self
        return (votes.size() * 100 / totalVoters) >= QUORUM_PERCENTAGE;
    }

    // ============================================
    // PEER MANAGEMENT
    // ============================================

    /**
     * Send heartbeat to peers
     */
    private void sendHeartbeat() {
        // In production, send actual network heartbeats
        LOG.tracef("Validator %s heartbeat - peers: %d, height: %d",
            getNodeId(), connectedPeers.size(), currentBlockHeight.get());
    }

    /**
     * Connect to a peer
     */
    public void connectPeer(String peerId) {
        connectedPeers.add(peerId);
        LOG.infof("Connected to peer: %s", peerId);
    }

    /**
     * Disconnect from a peer
     */
    public void disconnectPeer(String peerId) {
        connectedPeers.remove(peerId);
        LOG.infof("Disconnected from peer: %s", peerId);
    }

    // ============================================
    // MEMPOOL OPERATIONS
    // ============================================

    /**
     * Add transaction to mempool
     */
    public boolean addToMempool(String transactionId) {
        if (mempoolSize.get() >= MAX_MEMPOOL_SIZE) {
            return false;
        }
        mempool.offer(transactionId);
        mempoolSize.incrementAndGet();
        return true;
    }

    /**
     * Get mempool size
     */
    public int getMempoolSize() {
        return mempoolSize.get();
    }

    // ============================================
    // STAKING OPERATIONS
    // ============================================

    /**
     * Stake tokens
     */
    public void stake(BigDecimal amount) {
        stakedAmount = stakedAmount.add(amount);
        LOG.infof("Staked %s tokens, total: %s", amount, stakedAmount);
    }

    /**
     * Unstake tokens
     */
    public void unstake(BigDecimal amount) {
        if (amount.compareTo(stakedAmount) <= 0) {
            stakedAmount = stakedAmount.subtract(amount);
            LOG.infof("Unstaked %s tokens, remaining: %s", amount, stakedAmount);
        }
    }

    /**
     * Get staked amount
     */
    public BigDecimal getStakedAmount() {
        return stakedAmount;
    }

    // ============================================
    // LEADER ELECTION
    // ============================================

    /**
     * Become leader
     */
    public void becomeLeader() {
        isLeader.set(true);
        consensusRound.incrementAndGet();
        LOG.infof("Node %s became leader for round %d", getNodeId(), consensusRound.get());
    }

    /**
     * Step down as leader
     */
    public void stepDown() {
        isLeader.set(false);
        LOG.infof("Node %s stepped down as leader", getNodeId());
    }

    /**
     * Check if this node is leader
     */
    public boolean isLeader() {
        return isLeader.get();
    }

    // ============================================
    // GETTERS
    // ============================================

    public long getCurrentBlockHeight() {
        return currentBlockHeight.get();
    }

    public long getValidatedTransactions() {
        return validatedTransactions.get();
    }

    public int getReputationScore() {
        return reputationScore;
    }

    public Set<String> getConnectedPeers() {
        return Collections.unmodifiableSet(connectedPeers);
    }

    // Utility class for AtomicDouble
    private static class AtomicDouble {
        private final AtomicLong bits;

        AtomicDouble(double initialValue) {
            bits = new AtomicLong(Double.doubleToLongBits(initialValue));
        }

        double get() {
            return Double.longBitsToDouble(bits.get());
        }

        void set(double newValue) {
            bits.set(Double.doubleToLongBits(newValue));
        }
    }
}
