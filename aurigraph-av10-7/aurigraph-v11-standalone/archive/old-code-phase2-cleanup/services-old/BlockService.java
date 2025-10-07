package io.aurigraph.v11.services;

import io.aurigraph.v11.models.Block;
import io.aurigraph.v11.models.BlockStatus;
import io.aurigraph.v11.models.Transaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

/**
 * Block Service
 *
 * Manages block lifecycle including creation, validation, and finalization.
 * Handles block persistence and retrieval operations.
 *
 * Part of Sprint 9 - Story 2 (AV11-052)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@ApplicationScoped
public class BlockService {

    @Inject
    EntityManager entityManager;

    /**
     * Create a new block
     *
     * @param height Block height
     * @param previousHash Hash of previous block
     * @param validatorAddress Address of block validator
     * @return Created block
     */
    @Transactional
    public Block createBlock(Long height, String previousHash, String validatorAddress) {
        Block block = new Block();
        block.setHeight(height);
        block.setPreviousHash(previousHash);
        block.setValidatorAddress(validatorAddress);
        block.setTimestamp(Instant.now());
        block.setStatus(BlockStatus.PENDING);
        block.setTransactionCount(0);
        block.setBlockSize(0L);
        block.setConsensusAlgorithm("HyperRAFT++");

        entityManager.persist(block);
        return block;
    }

    /**
     * Get block by ID
     *
     * @param id Block ID
     * @return Optional containing block if found
     */
    public Optional<Block> getBlockById(String id) {
        Block block = entityManager.find(Block.class, id);
        return Optional.ofNullable(block);
    }

    /**
     * Get block by height
     *
     * @param height Block height
     * @return Optional containing block if found
     */
    public Optional<Block> getBlockByHeight(Long height) {
        List<Block> blocks = entityManager
                .createQuery("SELECT b FROM Block b WHERE b.height = :height", Block.class)
                .setParameter("height", height)
                .getResultList();

        return blocks.isEmpty() ? Optional.empty() : Optional.of(blocks.get(0));
    }

    /**
     * Get block by hash
     *
     * @param hash Block hash
     * @return Optional containing block if found
     */
    public Optional<Block> getBlockByHash(String hash) {
        List<Block> blocks = entityManager
                .createQuery("SELECT b FROM Block b WHERE b.hash = :hash", Block.class)
                .setParameter("hash", hash)
                .getResultList();

        return blocks.isEmpty() ? Optional.empty() : Optional.of(blocks.get(0));
    }

    /**
     * Get latest block
     *
     * @return Optional containing latest block
     */
    public Optional<Block> getLatestBlock() {
        List<Block> blocks = entityManager
                .createQuery("SELECT b FROM Block b ORDER BY b.height DESC", Block.class)
                .setMaxResults(1)
                .getResultList();

        return blocks.isEmpty() ? Optional.empty() : Optional.of(blocks.get(0));
    }

    /**
     * Get blocks by status
     *
     * @param status Block status
     * @param limit Maximum results
     * @return List of blocks
     */
    public List<Block> getBlocksByStatus(BlockStatus status, int limit) {
        return entityManager
                .createQuery("SELECT b FROM Block b WHERE b.status = :status ORDER BY b.height DESC", Block.class)
                .setParameter("status", status)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Get blocks by channel
     *
     * @param channelId Channel ID
     * @param limit Maximum results
     * @return List of blocks
     */
    public List<Block> getBlocksByChannel(String channelId, int limit) {
        return entityManager
                .createQuery("SELECT b FROM Block b WHERE b.channelId = :channelId ORDER BY b.height DESC", Block.class)
                .setParameter("channelId", channelId)
                .setMaxResults(limit)
                .getResultList();
    }

    /**
     * Add transaction to block
     *
     * @param blockId Block ID
     * @param transaction Transaction to add
     * @return Updated block
     */
    @Transactional
    public Block addTransactionToBlock(String blockId, Transaction transaction) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            throw new IllegalArgumentException("Block not found: " + blockId);
        }

        if (block.getStatus() != BlockStatus.PENDING) {
            throw new IllegalStateException("Cannot add transaction to block with status: " + block.getStatus());
        }

        block.addTransaction(transaction);
        block.setBlockSize(block.getBlockSize() + estimateTransactionSize(transaction));

        entityManager.merge(block);
        return block;
    }

    /**
     * Finalize block (calculate hash and merkle root)
     *
     * @param blockId Block ID
     * @return Finalized block
     */
    @Transactional
    public Block finalizeBlock(String blockId) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            throw new IllegalArgumentException("Block not found: " + blockId);
        }

        if (block.getStatus() != BlockStatus.PENDING) {
            throw new IllegalStateException("Block is not in PENDING state");
        }

        // Calculate Merkle root
        String merkleRoot = calculateMerkleRoot(block.getTransactions());
        block.setMerkleRoot(merkleRoot);

        // Calculate block hash
        String blockHash = calculateBlockHash(block);
        block.setHash(blockHash);

        // Update status
        block.setStatus(BlockStatus.PROPOSED);

        entityManager.merge(block);
        return block;
    }

    /**
     * Confirm block (consensus reached)
     *
     * @param blockId Block ID
     * @param validatorSignature Validator's signature
     * @return Confirmed block
     */
    @Transactional
    public Block confirmBlock(String blockId, String validatorSignature) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            throw new IllegalArgumentException("Block not found: " + blockId);
        }

        if (block.getStatus() != BlockStatus.PROPOSED && block.getStatus() != BlockStatus.VALIDATING) {
            throw new IllegalStateException("Block cannot be confirmed from status: " + block.getStatus());
        }

        block.setValidatorSignature(validatorSignature);
        block.setStatus(BlockStatus.CONFIRMED);

        entityManager.merge(block);
        return block;
    }

    /**
     * Finalize block (immutable)
     *
     * @param blockId Block ID
     * @return Finalized block
     */
    @Transactional
    public Block finalizeBlockImmutable(String blockId) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            throw new IllegalArgumentException("Block not found: " + blockId);
        }

        if (block.getStatus() != BlockStatus.CONFIRMED) {
            throw new IllegalStateException("Block must be CONFIRMED before finalizing");
        }

        block.setStatus(BlockStatus.FINALIZED);
        entityManager.merge(block);
        return block;
    }

    /**
     * Reject block
     *
     * @param blockId Block ID
     * @param reason Rejection reason
     * @return Rejected block
     */
    @Transactional
    public Block rejectBlock(String blockId, String reason) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            throw new IllegalArgumentException("Block not found: " + blockId);
        }

        block.setStatus(BlockStatus.REJECTED);
        block.setExtraData(reason);

        entityManager.merge(block);
        return block;
    }

    /**
     * Get block count
     *
     * @return Total number of blocks
     */
    public long getBlockCount() {
        return entityManager
                .createQuery("SELECT COUNT(b) FROM Block b", Long.class)
                .getSingleResult();
    }

    /**
     * Get block count by status
     *
     * @param status Block status
     * @return Count of blocks with specified status
     */
    public long getBlockCountByStatus(BlockStatus status) {
        return entityManager
                .createQuery("SELECT COUNT(b) FROM Block b WHERE b.status = :status", Long.class)
                .setParameter("status", status)
                .getSingleResult();
    }

    /**
     * Calculate Merkle root from transactions
     *
     * @param transactions List of transactions
     * @return Merkle root hash
     */
    private String calculateMerkleRoot(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return hash("empty");
        }

        // Simple Merkle tree implementation
        // In production, use a proper Merkle tree library
        List<String> hashes = transactions.stream()
                .map(tx -> hash(tx.getId()))
                .toList();

        while (hashes.size() > 1) {
            List<String> newHashes = new java.util.ArrayList<>();
            for (int i = 0; i < hashes.size(); i += 2) {
                if (i + 1 < hashes.size()) {
                    newHashes.add(hash(hashes.get(i) + hashes.get(i + 1)));
                } else {
                    newHashes.add(hashes.get(i));
                }
            }
            hashes = newHashes;
        }

        return hashes.get(0);
    }

    /**
     * Calculate block hash
     *
     * @param block Block to hash
     * @return Block hash
     */
    private String calculateBlockHash(Block block) {
        String data = block.getHeight() +
                      block.getPreviousHash() +
                      block.getMerkleRoot() +
                      block.getTimestamp().toString() +
                      block.getValidatorAddress();
        return hash(data);
    }

    /**
     * Hash a string using SHA-256
     *
     * @param data Data to hash
     * @return Hex-encoded hash
     */
    private String hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes());

            // Convert to hex
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Estimate transaction size in bytes
     *
     * @param transaction Transaction
     * @return Estimated size
     */
    private long estimateTransactionSize(Transaction transaction) {
        // Rough estimate: 200 bytes base + payload size
        return 200L;
    }

    /**
     * Verify block integrity
     *
     * @param blockId Block ID
     * @return true if block is valid
     */
    public boolean verifyBlockIntegrity(String blockId) {
        Block block = entityManager.find(Block.class, blockId);
        if (block == null) {
            return false;
        }

        // Verify Merkle root
        String calculatedMerkleRoot = calculateMerkleRoot(block.getTransactions());
        if (!calculatedMerkleRoot.equals(block.getMerkleRoot())) {
            return false;
        }

        // Verify block hash
        String calculatedHash = calculateBlockHash(block);
        if (!calculatedHash.equals(block.getHash())) {
            return false;
        }

        // Verify previous block link
        if (block.getHeight() > 0) {
            Optional<Block> previousBlock = getBlockByHeight(block.getHeight() - 1);
            if (previousBlock.isEmpty() || !previousBlock.get().getHash().equals(block.getPreviousHash())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get block statistics
     *
     * @return Block statistics
     */
    public BlockStats getBlockStats() {
        long totalBlocks = getBlockCount();
        long pendingBlocks = getBlockCountByStatus(BlockStatus.PENDING);
        long confirmedBlocks = getBlockCountByStatus(BlockStatus.CONFIRMED);
        long finalizedBlocks = getBlockCountByStatus(BlockStatus.FINALIZED);

        Optional<Block> latestBlock = getLatestBlock();
        Long latestHeight = latestBlock.map(Block::getHeight).orElse(0L);

        return new BlockStats(totalBlocks, pendingBlocks, confirmedBlocks, finalizedBlocks, latestHeight);
    }

    /**
     * Block Statistics
     */
    public static class BlockStats {
        private long totalBlocks;
        private long pendingBlocks;
        private long confirmedBlocks;
        private long finalizedBlocks;
        private long latestHeight;

        public BlockStats(long totalBlocks, long pendingBlocks, long confirmedBlocks,
                         long finalizedBlocks, long latestHeight) {
            this.totalBlocks = totalBlocks;
            this.pendingBlocks = pendingBlocks;
            this.confirmedBlocks = confirmedBlocks;
            this.finalizedBlocks = finalizedBlocks;
            this.latestHeight = latestHeight;
        }

        // Getters
        public long getTotalBlocks() { return totalBlocks; }
        public long getPendingBlocks() { return pendingBlocks; }
        public long getConfirmedBlocks() { return confirmedBlocks; }
        public long getFinalizedBlocks() { return finalizedBlocks; }
        public long getLatestHeight() { return latestHeight; }
    }
}
