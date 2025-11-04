package io.aurigraph.v11.optimization;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Sprint 15 Phase 2 optimizations
 * Validates all 4 optimizations work correctly together
 */
@QuarkusTest
public class OptimizationIntegrationTest {

    @Inject
    TransactionBatcher transactionBatcher;

    @Inject
    PipelinedConsensusService consensusService;

    @Inject
    PoolManager poolManager;

    @Inject
    NetworkMessageBatcher networkBatcher;

    @Test
    public void testTransactionBatcherInitialized() {
        assertNotNull(transactionBatcher, "TransactionBatcher should be initialized");

        TransactionBatcher.BatcherMetrics metrics = transactionBatcher.getMetrics();
        assertNotNull(metrics, "Batcher metrics should be available");
        assertEquals(0, metrics.queueSize(), "Initial queue should be empty");
    }

    @Test
    public void testTransactionBatcherProcessing() throws Exception {
        // Submit a transaction for batched processing
        TransactionBatcher.TransactionRequest request =
            new TransactionBatcher.TransactionRequest("test_tx_001", 100.0);

        CompletableFuture<String> future = transactionBatcher.submitTransaction(request);

        // Wait for result (with timeout)
        String result = future.get(2, TimeUnit.SECONDS);

        assertNotNull(result, "Transaction should be processed");
        assertTrue(result.contains("validated"), "Result should indicate validation");

        // Check metrics
        TransactionBatcher.BatcherMetrics metrics = transactionBatcher.getMetrics();
        assertTrue(metrics.transactionsProcessed() > 0, "Should have processed at least 1 transaction");
    }

    @Test
    public void testConsensusPipeliningInitialized() {
        assertNotNull(consensusService, "PipelinedConsensusService should be initialized");

        PipelinedConsensusService.PipelineMetrics metrics = consensusService.getMetrics();
        assertNotNull(metrics, "Pipeline metrics should be available");
        assertEquals(0, metrics.validationQueueSize(), "Initial validation queue should be empty");
        assertEquals(0, metrics.aggregationQueueSize(), "Initial aggregation queue should be empty");
    }

    @Test
    public void testConsensusPipelining() throws Exception {
        // Create and process a test block
        PipelinedConsensusService.Block block =
            new PipelinedConsensusService.Block("block_hash_001", 1);

        CompletableFuture<PipelinedConsensusService.Block> future =
            consensusService.processBlock(block);

        // Wait for block to be processed
        PipelinedConsensusService.Block finalizedBlock = future.get(5, TimeUnit.SECONDS);

        assertNotNull(finalizedBlock, "Block should be processed");
        assertTrue(finalizedBlock.isValidated(), "Block should be validated");
        assertTrue(finalizedBlock.isFinalized(), "Block should be finalized");
        assertNotNull(finalizedBlock.getVotes(), "Block should have votes");
        assertTrue(finalizedBlock.getVotes().hasQuorum(), "Block should have quorum");

        // Check metrics
        PipelinedConsensusService.PipelineMetrics metrics = consensusService.getMetrics();
        assertTrue(metrics.blocksProcessed() > 0, "Should have processed at least 1 block");
    }

    @Test
    public void testMemoryPoolingInitialized() {
        assertNotNull(poolManager, "PoolManager should be initialized");
        assertTrue(poolManager.isEnabled(), "Memory pooling should be enabled");

        assertNotNull(poolManager.getTransactionPool(), "Transaction pool should be initialized");
        assertNotNull(poolManager.getValidationPool(), "Validation pool should be initialized");
        assertNotNull(poolManager.getMessagePool(), "Message pool should be initialized");
    }

    @Test
    public void testMemoryPooling() {
        // Test transaction context pool
        ObjectPool<PoolManager.TransactionContext> txPool = poolManager.getTransactionPool();
        PoolManager.TransactionContext ctx = txPool.acquire();
        assertNotNull(ctx, "Should acquire transaction context from pool");

        // Set some data
        ctx.setId("test_tx");
        ctx.setAmount(100L);

        // Release back to pool
        txPool.release(ctx);

        // Check metrics
        ObjectPool.PoolMetrics metrics = txPool.getMetrics();
        assertEquals(1, metrics.totalAcquires(), "Should have 1 acquire");
        assertEquals(1, metrics.totalReleases(), "Should have 1 release");
        assertTrue(metrics.hitRate() > 0, "Should have positive hit rate");

        // Test validation context pool
        ObjectPool<PoolManager.ValidationContext> validationPool = poolManager.getValidationPool();
        PoolManager.ValidationContext validationCtx = validationPool.acquire();
        assertNotNull(validationCtx, "Should acquire validation context from pool");
        validationPool.release(validationCtx);

        // Test message buffer pool
        ObjectPool<PoolManager.MessageBuffer> messagePool = poolManager.getMessagePool();
        PoolManager.MessageBuffer buffer = messagePool.acquire();
        assertNotNull(buffer, "Should acquire message buffer from pool");
        assertTrue(buffer.capacity() > 0, "Buffer should have capacity");
        messagePool.release(buffer);
    }

    @Test
    public void testNetworkBatcherInitialized() {
        assertNotNull(networkBatcher, "NetworkMessageBatcher should be initialized");

        NetworkMessageBatcher.BatcherMetrics metrics = networkBatcher.getMetrics();
        assertNotNull(metrics, "Batcher metrics should be available");
        assertEquals(0, metrics.currentBufferSize(), "Initial buffer should be empty");
    }

    @Test
    public void testNetworkBatching() throws InterruptedException {
        // Send a test message
        NetworkMessageBatcher.NetworkMessage message =
            new NetworkMessageBatcher.NetworkMessage("test_message", "test_payload".getBytes());

        networkBatcher.sendMessage(message);

        // Wait for batch to be flushed (50ms flush interval + buffer)
        Thread.sleep(150);

        // Check metrics
        NetworkMessageBatcher.BatcherMetrics metrics = networkBatcher.getMetrics();
        assertTrue(metrics.messagesBuffered() > 0, "Should have buffered at least 1 message");
    }

    @Test
    public void testAllOptimizationsTogether() throws Exception {
        // Test 1: Transaction batching
        TransactionBatcher.TransactionRequest txRequest =
            new TransactionBatcher.TransactionRequest("integration_tx", 250.0);
        CompletableFuture<String> txFuture = transactionBatcher.submitTransaction(txRequest);

        // Test 2: Consensus pipelining
        PipelinedConsensusService.Block block =
            new PipelinedConsensusService.Block("integration_block", 100);
        CompletableFuture<PipelinedConsensusService.Block> blockFuture =
            consensusService.processBlock(block);

        // Test 3: Memory pooling
        PoolManager.TransactionContext pooledTx = poolManager.getTransactionPool().acquire();
        pooledTx.setId("pooled_tx");

        // Test 4: Network batching
        NetworkMessageBatcher.NetworkMessage netMsg =
            new NetworkMessageBatcher.NetworkMessage("integration_msg", "data".getBytes());
        networkBatcher.sendMessage(netMsg);

        // Wait for async operations to complete
        String txResult = txFuture.get(2, TimeUnit.SECONDS);
        PipelinedConsensusService.Block finalizedBlock = blockFuture.get(5, TimeUnit.SECONDS);

        // Verify all operations succeeded
        assertNotNull(txResult, "Transaction should be processed");
        assertTrue(finalizedBlock.isFinalized(), "Block should be finalized");
        assertNotNull(pooledTx, "Should acquire from pool");

        // Release pooled object
        poolManager.getTransactionPool().release(pooledTx);

        // Verify metrics from all optimizations
        assertTrue(transactionBatcher.getMetrics().transactionsProcessed() > 0);
        assertTrue(consensusService.getMetrics().blocksProcessed() > 0);
        assertTrue(poolManager.getTransactionPool().getMetrics().totalAcquires() > 0);
        assertTrue(networkBatcher.getMetrics().messagesBuffered() > 0);
    }

    @Test
    public void testPerformanceMetrics() {
        // Get metrics from all optimizations
        TransactionBatcher.BatcherMetrics txMetrics = transactionBatcher.getMetrics();
        PipelinedConsensusService.PipelineMetrics consensusMetrics = consensusService.getMetrics();
        PoolManager.PoolManagerMetrics poolMetrics = poolManager.getMetrics();
        NetworkMessageBatcher.BatcherMetrics networkMetrics = networkBatcher.getMetrics();

        // All metrics should be available
        assertNotNull(txMetrics);
        assertNotNull(consensusMetrics);
        assertNotNull(poolMetrics);
        assertNotNull(networkMetrics);

        // Metrics should have non-negative values
        assertTrue(txMetrics.batchesProcessed() >= 0);
        assertTrue(consensusMetrics.blocksProcessed() >= 0);
        assertTrue(networkMetrics.messagesBuffered() >= 0);
    }
}
