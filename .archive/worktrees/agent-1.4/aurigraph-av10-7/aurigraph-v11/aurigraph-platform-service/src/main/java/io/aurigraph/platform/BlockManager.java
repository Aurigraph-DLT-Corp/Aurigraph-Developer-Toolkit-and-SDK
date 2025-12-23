package io.aurigraph.platform;

import io.aurigraph.v10.*;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/**
 * High-performance block manager for Aurigraph V11
 * Handles block storage, retrieval, and streaming
 */
@ApplicationScoped
public class BlockManager {

    private static final Logger LOG = Logger.getLogger(BlockManager.class);
    
    // In-memory block storage for demo
    private final ConcurrentHashMap<String, Block> blocksByHash = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Block> blocksByNumber = new ConcurrentHashMap<>();
    private final AtomicLong currentBlockNumber = new AtomicLong(1000000);
    
    /**
     * Get a block by request (hash or number)
     */
    public Uni<Block> getBlock(GetBlockRequest request) {
        return Uni.createFrom().item(() -> {
            Block block;
            
            if (request.hasBlockNumber()) {
                block = blocksByNumber.get(request.getBlockNumber());
                LOG.debugf("Retrieving block by number: %d", request.getBlockNumber());
            } else {
                block = blocksByHash.get(request.getBlockHash());
                LOG.debugf("Retrieving block by hash: %s", request.getBlockHash());
            }
            
            if (block == null) {
                // Generate a sample block for demo
                long blockNumber = request.hasBlockNumber() ? 
                    request.getBlockNumber() : 
                    ThreadLocalRandom.current().nextLong(1000000, 2000000);
                    
                block = createSampleBlock(blockNumber);
                storeBlock(block);
            }
            
            return block;
        });
    }
    
    /**
     * Subscribe to new blocks (streaming)
     */
    public Multi<Block> subscribeToBlocks(BlockSubscriptionRequest request) {
        LOG.infof("Starting block subscription from block %d", request.getFromBlock());
        
        return Multi.createFrom().ticks().every(Duration.ofSeconds(2))
            .onItem().transform(tick -> {
                long blockNumber = request.getFromBlock() + tick;
                Block block = createSampleBlock(blockNumber);
                storeBlock(block);
                
                LOG.debugf("Streaming block %d to subscriber", blockNumber);
                return block;
            })
            .select().first(10); // Limit to 10 blocks for demo
    }
    
    /**
     * Propose a new block
     */
    public Uni<Boolean> proposeBlock(Block block) {
        return Uni.createFrom().item(() -> {
            // Validate block proposal
            if (block.getNumber() <= currentBlockNumber.get()) {
                LOG.warnf("Block proposal rejected: number %d is not greater than current %d", 
                         block.getNumber(), currentBlockNumber.get());
                return false;
            }
            
            // Store the proposed block
            storeBlock(block);
            currentBlockNumber.set(block.getNumber());
            
            LOG.infof("Block proposal accepted: %d with hash %s", 
                     block.getNumber(), block.getHash());
            return true;
        });
    }
    
    /**
     * Create a sample block for demonstration
     */
    private Block createSampleBlock(long blockNumber) {
        String blockHash = "0x" + generateRandomHash();
        String parentHash = "0x" + generateRandomHash();
        
        // Create sample transaction
        Transaction sampleTx = Transaction.newBuilder()
            .setId("tx_" + blockNumber + "_" + System.currentTimeMillis())
            .setFrom("0x" + generateRandomHash().substring(0, 20))
            .setTo("0x" + generateRandomHash().substring(0, 20))
            .setAmount(ThreadLocalRandom.current().nextDouble(1.0, 1000.0))
            .setNonce(ThreadLocalRandom.current().nextLong(1, 1000))
            .setGasPrice(20.0)
            .setGasLimit(21000)
            .setType("TRANSFER")
            .build();
        
        return Block.newBuilder()
            .setHash(blockHash)
            .setNumber(blockNumber)
            .setParentHash(parentHash)
            .addTransactions(sampleTx)
            .setValidator("validator_" + (blockNumber % 5 + 1))
            .setConsensusData(ConsensusData.newBuilder()
                .setRound(blockNumber)
                .setProposalHash(blockHash)
                .setFinalityScore(0.95)
                .build())
            .build();
    }
    
    /**
     * Store block in memory storage
     */
    private void storeBlock(Block block) {
        blocksByHash.put(block.getHash(), block);
        blocksByNumber.put(block.getNumber(), block);
    }
    
    /**
     * Generate random hash for demo purposes
     */
    private String generateRandomHash() {
        StringBuilder hash = new StringBuilder();
        for (int i = 0; i < 64; i++) {
            hash.append(Integer.toHexString(ThreadLocalRandom.current().nextInt(16)));
        }
        return hash.toString();
    }
    
    /**
     * Get current block number
     */
    public long getCurrentBlockNumber() {
        return currentBlockNumber.get();
    }
    
    /**
     * Get block count
     */
    public int getBlockCount() {
        return blocksByNumber.size();
    }
}