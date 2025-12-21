package io.aurigraph.v11.grpc;

import io.aurigraph.v11.grpc.GrpcStreamManager.StreamType;
import io.aurigraph.v12.streaming.*;
import com.google.protobuf.Timestamp;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.UUID;

/**
 * Centralized service for broadcasting real-time updates via gRPC streams
 *
 * This service replaces RealTimeUpdateService (WebSocket-based) with gRPC streaming.
 * It provides a unified interface for triggering broadcasts across all gRPC streaming endpoints.
 *
 * Key Benefits over WebSocket:
 * - 60-70% bandwidth reduction (Protobuf vs JSON)
 * - Type-safe client generation (TypeScript + Java)
 * - Built-in flow control and backpressure
 * - HTTP/2 multiplexing (multiple streams, one connection)
 *
 * Usage:
 * <pre>
 * {@code
 * @Inject
 * RealTimeGrpcService realTimeGrpcService;
 *
 * // Broadcast a transaction
 * realTimeGrpcService.broadcastTransaction(txHash, from, to, value, status, gasUsed);
 *
 * // Broadcast validator status
 * realTimeGrpcService.broadcastValidatorStatus(validator, status, votingPower, uptime, lastBlock);
 *
 * // Broadcast metrics
 * realTimeGrpcService.broadcastMetrics(tps, cpu, memory, connections, errorRate);
 * }
 * </pre>
 *
 * @author J4C Backend Agent
 * @version V12.0.0
 * @since December 2025
 */
@ApplicationScoped
public class RealTimeGrpcService {

    private static final Logger LOG = Logger.getLogger(RealTimeGrpcService.class);

    @Inject
    GrpcStreamManager streamManager;

    // ========== Transaction Broadcasting ==========

    /**
     * Broadcast a new transaction event to all connected gRPC clients
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
            TransactionEvent event = TransactionEvent.newBuilder()
                .setEventId(generateEventId())
                .setTimestamp(now())
                .setTransactionHash(txHash)
                .setFromAddress(from)
                .setToAddress(to)
                .setAmount(value)
                .setStatus(convertTransactionStatus(status))
                .setEventType("submitted")
                .setGasUsed(gasUsed)
                .build();

            streamManager.broadcast(StreamType.TRANSACTIONS, event);
            LOG.debugf("Broadcasted transaction via gRPC: %s", txHash);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast transaction: %s", txHash);
        }
    }

    /**
     * Broadcast a transaction with full details
     *
     * @param txHash Transaction hash
     * @param from Sender address
     * @param to Recipient address
     * @param value Transaction value
     * @param status Transaction status
     * @param eventType Event type (submitted, validated, confirmed, finalized, failed)
     * @param blockHeight Block height
     * @param blockHash Block hash
     * @param confirmations Number of confirmations
     * @param processingTimeMs Processing time in milliseconds
     * @param gasUsed Gas consumed
     */
    public void broadcastTransactionFull(
        String txHash,
        String from,
        String to,
        String value,
        String status,
        String eventType,
        long blockHeight,
        String blockHash,
        int confirmations,
        long processingTimeMs,
        double gasUsed
    ) {
        try {
            TransactionEvent event = TransactionEvent.newBuilder()
                .setEventId(generateEventId())
                .setTimestamp(now())
                .setTransactionHash(txHash)
                .setFromAddress(from)
                .setToAddress(to)
                .setAmount(value)
                .setStatus(convertTransactionStatus(status))
                .setEventType(eventType)
                .setBlockHeight(blockHeight)
                .setBlockHash(blockHash != null ? blockHash : "")
                .setConfirmations(confirmations)
                .setProcessingTimeMs(processingTimeMs)
                .setGasUsed(gasUsed)
                .build();

            streamManager.broadcast(StreamType.TRANSACTIONS, event);
            LOG.debugf("Broadcasted full transaction via gRPC: %s (status=%s)", txHash, status);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast full transaction: %s", txHash);
        }
    }

    // ========== Validator Broadcasting ==========

    /**
     * Broadcast a validator status update
     *
     * @param validatorId Validator ID
     * @param status Validator status (ACTIVE, INACTIVE, JAILED)
     * @param votingPower Validator voting power
     * @param uptime Validator uptime percentage
     * @param lastBlockProposed Last block height proposed
     */
    public void broadcastValidatorStatus(String validatorId, String status, long votingPower, double uptime, long lastBlockProposed) {
        try {
            ValidatorEvent event = ValidatorEvent.newBuilder()
                .setEventId(generateEventId())
                .setTimestamp(now())
                .setValidatorId(validatorId)
                .setValidatorAddress(validatorId)
                .setEventType("status_update")
                .setStatus(ValidatorStatus.newBuilder()
                    .setStatus(convertValidatorStatus(status))
                    .setLastUpdated(now())
                    .build())
                .setStake(votingPower)
                .setReputation(uptime)
                .setBlocksProposed(lastBlockProposed)
                .setUptimePercent(uptime)
                .build();

            streamManager.broadcast(StreamType.VALIDATORS, event);
            LOG.debugf("Broadcasted validator status via gRPC: %s = %s", validatorId, status);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast validator status: %s", validatorId);
        }
    }

    // ========== Metrics Broadcasting ==========

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
            MetricEvent tpsMetric = MetricEvent.newBuilder()
                .setMetricId(generateEventId())
                .setTimestamp(now())
                .setMetricName("tps")
                .setMetricType("gauge")
                .setValue(tps)
                .setUnit("tps")
                .build();

            MetricEvent cpuMetric = MetricEvent.newBuilder()
                .setMetricId(generateEventId())
                .setTimestamp(now())
                .setMetricName("cpu_usage")
                .setMetricType("gauge")
                .setValue(cpu)
                .setUnit("percent")
                .build();

            MetricEvent memoryMetric = MetricEvent.newBuilder()
                .setMetricId(generateEventId())
                .setTimestamp(now())
                .setMetricName("memory_usage")
                .setMetricType("gauge")
                .setValue(memory)
                .setUnit("mb")
                .build();

            MetricEvent connectionsMetric = MetricEvent.newBuilder()
                .setMetricId(generateEventId())
                .setTimestamp(now())
                .setMetricName("active_connections")
                .setMetricType("gauge")
                .setValue(connections)
                .setUnit("count")
                .build();

            // Broadcast each metric
            streamManager.broadcast(StreamType.METRICS, tpsMetric);
            streamManager.broadcast(StreamType.METRICS, cpuMetric);
            streamManager.broadcast(StreamType.METRICS, memoryMetric);
            streamManager.broadcast(StreamType.METRICS, connectionsMetric);

            LOG.debugf("Broadcasted metrics via gRPC: TPS=%d, CPU=%.2f%%, Memory=%dMB", Long.valueOf(tps), Double.valueOf(cpu), Long.valueOf(memory));
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast metrics");
        }
    }

    // ========== Consensus Broadcasting ==========

    /**
     * Broadcast consensus state change
     *
     * @param round Consensus round number
     * @param phase Current consensus phase
     * @param proposer Block proposer address
     * @param votes Number of votes received
     * @param status Consensus status
     */
    public void broadcastConsensusUpdate(long round, String phase, String proposer, int votes, String status) {
        try {
            ConsensusEvent event = ConsensusEvent.newBuilder()
                .setEventId(generateEventId())
                .setTimestamp(now())
                .setRound(round)
                .setTerm(0)
                .setPhase(phase)
                .setProposerId(proposer)
                .setLeaderId(proposer)
                .setVotesFor(votes)
                .setVotesAgainst(0)
                .setVotesRequired((int) Math.ceil(votes * 0.67))
                .setConsensusReached(status.equalsIgnoreCase("COMMITTED"))
                .setResult(status)
                .build();

            streamManager.broadcast(StreamType.CONSENSUS, event);
            LOG.debugf("Broadcasted consensus via gRPC: round=%d, phase=%s", round, phase);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast consensus update");
        }
    }

    // ========== Network Broadcasting ==========

    /**
     * Broadcast network topology change
     *
     * @param nodeId Node ID
     * @param event Event type (CONNECTED, DISCONNECTED, DISCOVERED)
     * @param totalNodes Current total node count
     * @param latency Network latency in ms
     */
    public void broadcastNetworkUpdate(String nodeId, String event, int totalNodes, long latency) {
        try {
            NetworkEvent networkEvent = NetworkEvent.newBuilder()
                .setEventId(generateEventId())
                .setTimestamp(now())
                .setEventType(event.toLowerCase())
                .setNodeId(nodeId)
                .setTotalNodes(totalNodes)
                .setActiveNodes(totalNodes)
                .setPeerConnections(totalNodes - 1)
                .setAverageLatencyMs(latency)
                .setNetworkHealthScore(95.0)
                .build();

            streamManager.broadcast(StreamType.NETWORK, networkEvent);
            LOG.debugf("Broadcasted network via gRPC: nodeId=%s, event=%s", nodeId, event);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast network update");
        }
    }

    // ========== Unified Broadcasting ==========

    /**
     * Broadcast a unified event to all stream types
     *
     * @param streamType Target stream type
     * @param event Unified event
     */
    public void broadcastUnified(String streamType, UnifiedEvent event) {
        try {
            StreamType type = StreamType.valueOf(streamType.toUpperCase());
            streamManager.broadcast(type, event);
            LOG.debugf("Broadcasted unified event via gRPC: type=%s", streamType);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to broadcast unified event");
        }
    }

    // ========== Statistics ==========

    /**
     * Get connection statistics across all gRPC streams
     *
     * @return Total number of active gRPC stream connections
     */
    public int getTotalConnections() {
        return streamManager.getTotalStreamCount();
    }

    /**
     * Check if any gRPC stream clients are connected
     *
     * @return true if at least one client is connected
     */
    public boolean hasActiveConnections() {
        return streamManager.hasAnyActiveStreams();
    }

    /**
     * Get stream statistics
     *
     * @return Statistics for all stream types
     */
    public java.util.Map<String, Object> getStreamStats() {
        return streamManager.getAllStats();
    }

    // ========== Sample Data (for testing) ==========

    /**
     * Broadcast a sample transaction (for testing)
     */
    public void broadcastSampleTransaction() {
        broadcastTransaction(
            "0x" + UUID.randomUUID().toString().replace("-", ""),
            "0xSender123",
            "0xReceiver456",
            "1.5",
            "CONFIRMED",
            21000
        );
        LOG.info("Broadcasted sample transaction via gRPC");
    }

    /**
     * Broadcast a sample validator status (for testing)
     */
    public void broadcastSampleValidator() {
        broadcastValidatorStatus(
            "validator-" + UUID.randomUUID().toString().substring(0, 8),
            "ACTIVE",
            100000,
            99.5,
            12345678
        );
        LOG.info("Broadcasted sample validator via gRPC");
    }

    /**
     * Broadcast sample metrics (for testing)
     */
    public void broadcastSampleMetrics() {
        broadcastMetrics(
            1500000,  // TPS
            45.2,     // CPU
            2048,     // Memory MB
            125,      // Connections
            0.02      // Error rate
        );
        LOG.info("Broadcasted sample metrics via gRPC");
    }

    // ========== Private Helper Methods ==========

    private String generateEventId() {
        return UUID.randomUUID().toString();
    }

    private Timestamp now() {
        Instant instant = Instant.now();
        return Timestamp.newBuilder()
            .setSeconds(instant.getEpochSecond())
            .setNanos(instant.getNano())
            .build();
    }

    private io.aurigraph.v11.proto.TransactionStatus convertTransactionStatus(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PENDING;
            case "CONFIRMED", "SUCCESS" -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_CONFIRMED;
            case "FAILED", "ERROR" -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_FAILED;
            case "FINALIZED" -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_FINALIZED;
            default -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_UNKNOWN;
        };
    }

    private ValidatorStatus.Status convertValidatorStatus(String status) {
        return switch (status.toUpperCase()) {
            case "REGISTERED" -> ValidatorStatus.Status.REGISTERED;
            case "ACTIVE" -> ValidatorStatus.Status.ACTIVE;
            case "INACTIVE" -> ValidatorStatus.Status.INACTIVE;
            case "SLASHED", "JAILED" -> ValidatorStatus.Status.SLASHED;
            case "REMOVED" -> ValidatorStatus.Status.REMOVED;
            default -> ValidatorStatus.Status.UNKNOWN;
        };
    }
}
