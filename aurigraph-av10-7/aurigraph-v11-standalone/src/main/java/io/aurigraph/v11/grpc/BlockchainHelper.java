package io.aurigraph.v11.grpc;

import io.aurigraph.v11.models.Block;
import io.aurigraph.v11.models.Transaction;
import io.aurigraph.v11.proto.BlockStreamEvent;
import io.grpc.stub.StreamObserver;
import com.google.protobuf.Timestamp;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * BlockchainHelper - Utility class for BlockchainServiceImpl
 * 
 * Extracted helper methods to improve maintainability and testability.
 * This class handles:
 * - Block hash computation
 * - Proto message conversions
 * - SHA-256 hashing
 * - Stream notifications
 * 
 * @author Aurigraph DLT - Refactoring Agent
 * @version 12.0.0
 * @since December 22, 2025
 */
@ApplicationScoped
public class BlockchainHelper {

    private static final Logger LOG = Logger.getLogger(BlockchainHelper.class);

    /**
     * Computes SHA-256 hash of a block header.
     * 
     * Block hash = SHA-256(height + previousHash + merkleRoot + stateRoot +
     * timestamp)
     * 
     * @param height       Block height
     * @param previousHash Hash of previous block
     * @param merkleRoot   Merkle root of transactions
     * @param stateRoot    State root hash
     * @param timestamp    Block creation timestamp
     * @return Computed block hash (64-character hex string)
     */
    public String computeBlockHash(
            Long height,
            String previousHash,
            String merkleRoot,
            String stateRoot,
            Instant timestamp) {

        String blockHeader = height + previousHash + merkleRoot + stateRoot + timestamp.getEpochSecond();
        return computeSHA256(blockHeader);
    }

    /**
     * Computes SHA-256 hash of input string.
     * 
     * @param input Input string to hash
     * @return SHA-256 hash as 64-character hex string
     */
    public String computeSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            LOG.error("SHA-256 algorithm not available", e);
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Converts Block entity to Proto Block message.
     * 
     * @param block        Block entity from database
     * @param transactions List of proto transactions (optional)
     * @return Proto Block message
     */
    public io.aurigraph.v11.proto.Block convertToProtoBlock(
            Block block,
            List<io.aurigraph.v11.proto.Transaction> transactions) {

        io.aurigraph.v11.proto.Block.Builder builder = io.aurigraph.v11.proto.Block.newBuilder()
                .setBlockHash(block.getHash())
                .setBlockHeight(block.getHeight())
                .setParentHash(block.getPreviousHash() != null ? block.getPreviousHash() : "")
                .setTransactionRoot(block.getMerkleRoot() != null ? block.getMerkleRoot() : "")
                .setStateRoot(block.getStateRoot() != null ? block.getStateRoot() : "")
                .setTransactionCount(block.getTransactionCount() != null ? block.getTransactionCount() : 0)
                .setCreatedAt(Timestamp.newBuilder()
                        .setSeconds(block.getTimestamp().getEpochSecond())
                        .setNanos(block.getTimestamp().getNano())
                        .build());

        // Add transaction hashes
        if (block.getTransactionIds() != null) {
            builder.addAllTransactionHashes(block.getTransactionIds());
        }

        // Add validator info if available
        if (block.getValidatorAddress() != null) {
            builder.setValidatorCount(1);
            builder.addValidatorSignatures(block.getValidatorAddress());
        }

        // Note: blockSizeBytes and consensusAlgorithm fields may not exist in proto
        // Uncomment if they are added to the proto definition later

        return builder.build();
    }

    /**
     * Converts Transaction entity to Proto Transaction message.
     * 
     * @param tx Transaction entity from database
     * @return Proto Transaction message
     */
    public io.aurigraph.v11.proto.Transaction convertToProtoTransaction(Transaction tx) {
        io.aurigraph.v11.proto.Transaction.Builder builder = io.aurigraph.v11.proto.Transaction.newBuilder()
                .setTransactionHash(tx.getHash() != null ? tx.getHash() : "")
                .setFromAddress(tx.getFromAddress() != null ? tx.getFromAddress() : "")
                .setToAddress(tx.getToAddress() != null ? tx.getToAddress() : "")
                .setAmount(String.valueOf(tx.getAmount()))
                .setNonce(0) // Transaction model doesn't have nonce field - using int
                .setGasPrice((double) tx.getGasPrice())
                .setGasLimit((double) tx.getGasLimit());

        // Add status
        if (tx.getStatus() != null) {
            builder.setStatus(convertTransactionStatus(tx.getStatus()));
        }

        // Add timestamp (using timestamp field)
        if (tx.getTimestamp() != null) {
            builder.setCreatedAt(Timestamp.newBuilder()
                    .setSeconds(tx.getTimestamp().getEpochSecond())
                    .setNanos(tx.getTimestamp().getNano())
                    .build());
        }

        // Add signature if available
        if (tx.getSignature() != null) {
            builder.setSignature(tx.getSignature());
        }

        // Add payload as data
        if (tx.getPayload() != null) {
            builder.setData(tx.getPayload());
        }

        return builder.build();
    }

    /**
     * Notifies all active streaming clients of a new block.
     * 
     * @param block         Proto block to broadcast
     * @param activeStreams Map of active stream observers
     */
    public void notifyStreamingClients(
            io.aurigraph.v11.proto.Block block,
            Map<String, StreamObserver<BlockStreamEvent>> activeStreams) {

        if (activeStreams.isEmpty()) {
            return;
        }

        BlockStreamEvent event = BlockStreamEvent.newBuilder()
                .setBlock(block)
                .setTimestamp(Timestamp.newBuilder()
                        .setSeconds(Instant.now().getEpochSecond())
                        .setNanos(Instant.now().getNano())
                        .build())
                .build();

        int notified = 0;
        for (Map.Entry<String, StreamObserver<BlockStreamEvent>> entry : activeStreams.entrySet()) {
            try {
                entry.getValue().onNext(event);
                notified++;
            } catch (Exception e) {
                LOG.warnf("Failed to notify stream %s: %s", entry.getKey(), e.getMessage());
            }
        }

        LOG.debugf("Notified %d streaming clients of new block %d", notified, block.getBlockHeight());
    }

    /**
     * Converts domain TransactionStatus to Proto TransactionStatus.
     * 
     * @param status Domain transaction status
     * @return Proto transaction status
     */
    private io.aurigraph.v11.proto.TransactionStatus convertTransactionStatus(
            io.aurigraph.v11.models.TransactionStatus status) {

        return switch (status) {
            case PENDING -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PENDING;
            case CONFIRMED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_CONFIRMED;
            case FAILED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_FAILED;
            case REJECTED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_REJECTED;
            default -> io.aurigraph.v11.proto.TransactionStatus.UNRECOGNIZED;
        };
    }

    /**
     * Converts byte array to hexadecimal string.
     * 
     * @param bytes Byte array to convert
     * @return Hexadecimal string representation
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
