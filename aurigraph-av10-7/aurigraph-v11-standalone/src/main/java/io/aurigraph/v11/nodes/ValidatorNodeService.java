package io.aurigraph.v11.nodes;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ValidatorNodeService - Service for managing ValidatorNode instances.
 *
 * Extends GenericNodeService to provide validator-specific functionality:
 * - Consensus coordination
 * - Block proposal management
 * - Staking operations
 * - Peer connectivity
 * - Leader election
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class ValidatorNodeService extends GenericNodeService<ValidatorNode> {

    private static final Logger LOG = Logger.getLogger(ValidatorNodeService.class);

    // Track leader node
    private volatile String currentLeaderId = null;

    @Override
    protected ValidatorNode createNode(String nodeId) {
        return new ValidatorNode(nodeId);
    }

    @Override
    protected void doInit() {
        LOG.info("ValidatorNodeService initialized");
    }

    @Override
    protected void doCleanup() {
        currentLeaderId = null;
        LOG.info("ValidatorNodeService cleaned up");
    }

    // ============================================
    // CONSENSUS OPERATIONS
    // ============================================

    /**
     * Elect a leader from active validators
     */
    public Uni<String> electLeader() {
        return Uni.createFrom().item(() -> {
            // Step down current leader
            if (currentLeaderId != null) {
                ValidatorNode currentLeader = getNode(currentLeaderId);
                if (currentLeader != null) {
                    currentLeader.stepDown();
                }
            }

            // Find the validator with highest stake
            ValidatorNode bestCandidate = null;
            BigDecimal highestStake = BigDecimal.ZERO;

            for (ValidatorNode node : getAllNodes().values()) {
                if (node.isRunning() && node.isHealthy()) {
                    if (node.getStakedAmount().compareTo(highestStake) > 0) {
                        highestStake = node.getStakedAmount();
                        bestCandidate = node;
                    }
                }
            }

            if (bestCandidate != null) {
                bestCandidate.becomeLeader();
                currentLeaderId = bestCandidate.getNodeId();
                LOG.infof("Elected leader: %s with stake %s", currentLeaderId, highestStake);
            }

            return currentLeaderId;
        });
    }

    /**
     * Get current leader
     */
    public ValidatorNode getLeader() {
        if (currentLeaderId == null) {
            return null;
        }
        return getNode(currentLeaderId);
    }

    /**
     * Propose a block through the leader
     */
    public Uni<Boolean> proposeBlock(List<String> transactions) {
        return Uni.createFrom().item(() -> {
            ValidatorNode leader = getLeader();
            if (leader == null) {
                LOG.warn("No leader available to propose block");
                return false;
            }

            long blockHeight = leader.getCurrentBlockHeight();
            return leader.validateBlock(blockHeight, transactions);
        });
    }

    /**
     * Vote on a block across all validators
     */
    public Uni<Boolean> voteOnBlock(long blockHeight, boolean approve) {
        return Uni.createFrom().item(() -> {
            for (ValidatorNode node : getAllNodes().values()) {
                if (node.isRunning()) {
                    node.voteOnBlock(blockHeight, node.getNodeId(), approve);
                }
            }

            // Check if quorum is reached
            ValidatorNode leader = getLeader();
            if (leader != null) {
                return leader.hasQuorum(blockHeight);
            }
            return false;
        });
    }

    // ============================================
    // STAKING OPERATIONS
    // ============================================

    /**
     * Stake tokens on a validator
     */
    public Uni<Boolean> stake(String nodeId, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            ValidatorNode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Validator not found: " + nodeId);
            }
            node.stake(amount);
            return true;
        });
    }

    /**
     * Unstake tokens from a validator
     */
    public Uni<Boolean> unstake(String nodeId, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            ValidatorNode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Validator not found: " + nodeId);
            }
            node.unstake(amount);
            return true;
        });
    }

    /**
     * Get total staked amount across all validators
     */
    public BigDecimal getTotalStaked() {
        return getAllNodes().values().stream()
            .map(ValidatorNode::getStakedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ============================================
    // PEER MANAGEMENT
    // ============================================

    /**
     * Connect all validators to each other
     */
    public Uni<Integer> connectAllPeers() {
        return Uni.createFrom().item(() -> {
            int connections = 0;
            List<ValidatorNode> nodes = List.copyOf(getAllNodes().values());

            for (int i = 0; i < nodes.size(); i++) {
                for (int j = i + 1; j < nodes.size(); j++) {
                    ValidatorNode node1 = nodes.get(i);
                    ValidatorNode node2 = nodes.get(j);

                    node1.connectPeer(node2.getNodeId());
                    node2.connectPeer(node1.getNodeId());
                    connections += 2;
                }
            }

            LOG.infof("Connected %d peer relationships", connections);
            return connections;
        });
    }

    /**
     * Get all connected peers for a validator
     */
    public Set<String> getPeers(String nodeId) {
        ValidatorNode node = getNode(nodeId);
        if (node == null) {
            return Set.of();
        }
        return node.getConnectedPeers();
    }

    // ============================================
    // MEMPOOL OPERATIONS
    // ============================================

    /**
     * Add transaction to all validator mempools
     */
    public Uni<Integer> broadcastToMempool(String transactionId) {
        return Uni.createFrom().item(() -> {
            int added = 0;
            for (ValidatorNode node : getAllNodes().values()) {
                if (node.isRunning() && node.addToMempool(transactionId)) {
                    added++;
                }
            }
            return added;
        });
    }

    /**
     * Get aggregate mempool size
     */
    public int getTotalMempoolSize() {
        return getAllNodes().values().stream()
            .mapToInt(ValidatorNode::getMempoolSize)
            .sum();
    }

    // ============================================
    // METRICS & STATUS
    // ============================================

    /**
     * Get network-wide validator statistics
     */
    public Map<String, Object> getNetworkStats() {
        Map<String, Object> stats = new ConcurrentHashMap<>();

        long totalValidated = getAllNodes().values().stream()
            .mapToLong(ValidatorNode::getValidatedTransactions)
            .sum();

        long totalBlockHeight = getAllNodes().values().stream()
            .mapToLong(ValidatorNode::getCurrentBlockHeight)
            .max()
            .orElse(0);

        int totalPeers = getAllNodes().values().stream()
            .mapToInt(n -> n.getConnectedPeers().size())
            .sum() / 2; // Divide by 2 since connections are bidirectional

        stats.put("totalValidators", getNodeCount());
        stats.put("runningValidators", getRunningNodeCount());
        stats.put("healthyValidators", getHealthyNodeCount());
        stats.put("totalValidatedTransactions", totalValidated);
        stats.put("currentBlockHeight", totalBlockHeight);
        stats.put("totalStaked", getTotalStaked().toString());
        stats.put("totalPeerConnections", totalPeers);
        stats.put("currentLeader", currentLeaderId);
        stats.put("mempoolSize", getTotalMempoolSize());

        return stats;
    }
}
