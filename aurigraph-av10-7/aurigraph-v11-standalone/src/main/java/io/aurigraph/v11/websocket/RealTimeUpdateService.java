package io.aurigraph.v11.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.websocket.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;

/**
 * Centralized service for broadcasting real-time updates to WebSocket clients
 *
 * This service provides a unified interface for triggering broadcasts across
 * all WebSocket endpoints. It handles JSON serialization and error handling.
 *
 * Usage:
 * <pre>
 * {@code
 * @Inject
 * RealTimeUpdateService realTimeUpdateService;
 *
 * // Broadcast a transaction
 * realTimeUpdateService.broadcastTransaction(txHash, from, to, value, status, gasUsed);
 *
 * // Broadcast validator status
 * realTimeUpdateService.broadcastValidatorStatus(validator, status, votingPower, uptime, lastBlock);
 *
 * // Broadcast metrics
 * realTimeUpdateService.broadcastMetrics(tps, cpu, memory, connections, errorRate);
 * }
 * </pre>
 *
 * @author J4C Backend Agent
 * @version V12.0.0
 * @since December 2025
 */
@ApplicationScoped
public class RealTimeUpdateService {

    private static final Logger LOG = Logger.getLogger(RealTimeUpdateService.class);

    @Inject
    ObjectMapper objectMapper;

    /**
     * Broadcast a new transaction event to all connected clients
     *
     * @param txHash Transaction hash
     * @param from Sender address
     * @param to Recipient address
     * @param value Transaction value
     * @param status Transaction status (PENDING, CONFIRMED, FAILED)
     * @param gasUsed Gas consumed
     */
    public void broadcastTransaction(String txHash, String from, String to, String value, String status, long gasUsed) {
        try {
            TransactionMessage message = new TransactionMessage(
                Instant.now(),
                txHash,
                from,
                to,
                value,
                status,
                gasUsed
            );

            String json = objectMapper.writeValueAsString(message);
            TransactionWebSocket.broadcast(json);

            LOG.debugf("Broadcasted transaction: %s", txHash);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast transaction: %s", txHash);
        }
    }

    /**
     * Broadcast a validator status update
     *
     * @param validator Validator address
     * @param status Validator status (ACTIVE, INACTIVE, JAILED)
     * @param votingPower Validator voting power
     * @param uptime Validator uptime percentage
     * @param lastBlockProposed Last block height proposed
     */
    public void broadcastValidatorStatus(String validator, String status, long votingPower, double uptime, long lastBlockProposed) {
        try {
            ValidatorMessage message = new ValidatorMessage(
                Instant.now(),
                validator,
                status,
                votingPower,
                uptime,
                lastBlockProposed
            );

            String json = objectMapper.writeValueAsString(message);
            ValidatorWebSocket.broadcast(json);

            LOG.debugf("Broadcasted validator status: %s = %s", validator, status);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast validator status: %s", validator);
        }
    }

    /**
     * Broadcast system metrics
     *
     * @param tps Current transactions per second
     * @param cpu CPU usage percentage
     * @param memory Memory usage in MB
     * @param connections Active connection count
     * @param errorRate Error rate percentage
     */
    public void broadcastMetrics(long tps, double cpu, long memory, int connections, double errorRate) {
        try {
            MetricsMessage message = new MetricsMessage(
                Instant.now(),
                tps,
                cpu,
                memory,
                connections,
                errorRate
            );

            String json = objectMapper.writeValueAsString(message);
            MetricsWebSocket.broadcast(json);

            LOG.debugf("Broadcasted metrics: TPS=%d, CPU=%.2f%%, Memory=%dMB", (Object) tps, (Object) cpu, (Object) memory);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast metrics");
        }
    }

    /**
     * Broadcast consensus state change
     *
     * @param round Consensus round number
     * @param step Current consensus step
     * @param proposer Block proposer address
     * @param votes Number of votes received
     * @param status Consensus status
     */
    public void broadcastConsensusUpdate(long round, String step, String proposer, int votes, String status) {
        try {
            ConsensusMessage message = new ConsensusMessage(
                Instant.now(),
                proposer,  // leader
                0L,        // epoch
                round,     // round
                0L,        // term
                status,    // state
                0.0,       // performanceScore
                votes      // activeValidators
            );

            String json = objectMapper.writeValueAsString(message);
            ConsensusWebSocket.broadcast(json);

            LOG.debugf("Broadcasted consensus: round=%d, step=%s", round, step);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast consensus update");
        }
    }

    /**
     * Broadcast network topology change
     *
     * @param peerId Peer ID
     * @param event Event type (CONNECTED, DISCONNECTED, DISCOVERED)
     * @param peerCount Current peer count
     * @param latency Network latency in ms
     */
    public void broadcastNetworkUpdate(String peerId, String event, int peerCount, long latency) {
        try {
            NetworkMessage message = new NetworkMessage(
                Instant.now(),
                peerId,
                "0.0.0.0",  // ip
                true,       // connected (assuming connected for now)
                (int) latency,  // latency
                "12.0.0"    // version
            );

            String json = objectMapper.writeValueAsString(message);
            NetworkWebSocket.broadcast(json);

            LOG.debugf("Broadcasted network: peerId=%s, event=%s", peerId, event);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast network update");
        }
    }

    /**
     * Get connection statistics across all WebSocket endpoints
     *
     * @return Total number of active WebSocket connections
     */
    public int getTotalConnections() {
        int total = 0;
        total += TransactionWebSocket.getConnectionCount();
        total += ValidatorWebSocket.getConnectionCount();
        total += MetricsWebSocket.getConnectionCount();
        total += ConsensusWebSocket.getConnectionCount();
        total += NetworkWebSocket.getConnectionCount();
        return total;
    }

    /**
     * Check if any WebSocket clients are connected
     *
     * @return true if at least one client is connected
     */
    public boolean hasActiveConnections() {
        return getTotalConnections() > 0;
    }

    /**
     * Broadcast a sample transaction (for testing)
     */
    public void broadcastSampleTransaction() {
        TransactionMessage sample = TransactionMessage.sample();
        try {
            String json = objectMapper.writeValueAsString(sample);
            TransactionWebSocket.broadcast(json);
            LOG.info("Broadcasted sample transaction");
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast sample transaction");
        }
    }

    /**
     * Broadcast a sample validator status (for testing)
     */
    public void broadcastSampleValidator() {
        ValidatorMessage sample = ValidatorMessage.sample();
        try {
            String json = objectMapper.writeValueAsString(sample);
            ValidatorWebSocket.broadcast(json);
            LOG.info("Broadcasted sample validator");
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast sample validator");
        }
    }

    /**
     * Broadcast sample metrics (for testing)
     */
    public void broadcastSampleMetrics() {
        MetricsMessage sample = MetricsMessage.sample();
        try {
            String json = objectMapper.writeValueAsString(sample);
            MetricsWebSocket.broadcast(json);
            LOG.info("Broadcasted sample metrics");
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast sample metrics");
        }
    }
}
