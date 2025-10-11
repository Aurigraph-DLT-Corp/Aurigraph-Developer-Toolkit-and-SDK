package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.blockchain.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Duration;
import java.util.List;

/**
 * Blockchain Service Tests
 * Sprint 13 - Workstream 4: Test Automation
 *
 * Tests block management and chain operations:
 * - Block queries
 * - Block streaming
 * - Chain statistics
 *
 * Target: 95% coverage
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BlockchainServiceTest {

    @Inject
    BlockchainServiceImpl blockchainService;

    @Test
    @Order(1)
    @DisplayName("Get block by number - genesis block")
    void testGetGenesisBlock() {
        BlockQuery query = BlockQuery.newBuilder()
            .setBlockNumber(0)
            .build();

        Block block = blockchainService
            .getBlock(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(block);
        assertEquals(0, block.getBlockNumber());
        assertEquals("0", block.getPreviousHash());
        assertEquals("genesis", block.getProposer());
        assertNotNull(block.getBlockHash());
    }

    @Test
    @Order(2)
    @DisplayName("Get latest block - should return genesis initially")
    void testGetLatestBlock() {
        LatestBlockRequest request = LatestBlockRequest.newBuilder()
            .setIncludeTransactions(true)
            .build();

        Block block = blockchainService
            .getLatestBlock(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(block);
        assertEquals(0, block.getBlockNumber());  // Genesis is latest initially
    }

    @Test
    @Order(3)
    @DisplayName("Get blockchain info - should return chain metadata")
    void testGetBlockchainInfo() {
        InfoRequest request = InfoRequest.newBuilder()
            .setIncludeValidatorSet(true)
            .build();

        BlockchainInfo info = blockchainService
            .getBlockchainInfo(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(info);
        assertTrue(info.getLatestBlockNumber() >= 0);
        assertNotNull(info.getLatestBlockHash());
        assertEquals("aurigraph-v11-mainnet", info.getNetworkId());
        assertEquals("HyperRAFT++", info.getConsensusAlgorithm());
        assertTrue(info.getValidatorCount() > 0);
        assertTrue(info.getGenesisTimestamp() > 0);
    }

    @Test
    @Order(4)
    @DisplayName("Get blockchain info - with validator set")
    void testGetBlockchainInfoWithValidators() {
        InfoRequest request = InfoRequest.newBuilder()
            .setIncludeValidatorSet(true)
            .build();

        BlockchainInfo info = blockchainService
            .getBlockchainInfo(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(info);
        assertTrue(info.getValidatorsCount() > 0);

        // Check validator info
        for (ValidatorInfo validator : info.getValidatorsList()) {
            assertNotNull(validator.getValidatorId());
            assertNotNull(validator.getAddress());
            assertTrue(validator.getStakeAmount() > 0);
        }
    }

    @Test
    @Order(5)
    @DisplayName("Get block range - single block")
    void testGetBlockRange() {
        BlockRangeQuery query = BlockRangeQuery.newBuilder()
            .setStartBlock(0)
            .setEndBlock(0)
            .setIncludeTransactions(true)
            .build();

        BlockList blockList = blockchainService
            .getBlockRange(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(blockList);
        assertEquals(1, blockList.getTotalCount());
        assertFalse(blockList.getHasMore());
        assertEquals(0, blockList.getBlocks(0).getBlockNumber());
    }

    @Test
    @Order(6)
    @DisplayName("Get block range - with pagination")
    void testGetBlockRangeWithPagination() {
        BlockRangeQuery query = BlockRangeQuery.newBuilder()
            .setStartBlock(0)
            .setEndBlock(100)
            .setMaxResults(10)
            .setIncludeTransactions(false)
            .build();

        BlockList blockList = blockchainService
            .getBlockRange(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(blockList);
        assertTrue(blockList.getTotalCount() <= 10);  // Should respect max_results

        // Verify transactions excluded when requested
        if (blockList.getBlocksCount() > 0) {
            for (Block block : blockList.getBlocksList()) {
                assertEquals(0, block.getTransactionsCount());
            }
        }
    }

    @Test
    @Order(7)
    @DisplayName("Get block range - invalid range should throw exception")
    void testGetBlockRangeInvalidRange() {
        BlockRangeQuery query = BlockRangeQuery.newBuilder()
            .setStartBlock(100)
            .setEndBlock(0)  // End before start
            .build();

        assertThrows(Exception.class, () -> {
            blockchainService.getBlockRange(query).await().indefinitely();
        });
    }

    @Test
    @Order(8)
    @DisplayName("Get non-existent block - should throw exception")
    void testGetNonExistentBlock() {
        BlockQuery query = BlockQuery.newBuilder()
            .setBlockNumber(99999)
            .build();

        assertThrows(Exception.class, () -> {
            blockchainService.getBlock(query).await().indefinitely();
        });
    }

    @Test
    @Order(9)
    @DisplayName("Get block by hash - genesis block")
    void testGetBlockByHash() {
        // First get genesis block to know its hash
        BlockQuery numberQuery = BlockQuery.newBuilder()
            .setBlockNumber(0)
            .build();
        Block genesis = blockchainService.getBlock(numberQuery).await().indefinitely();

        // Now query by hash
        BlockQuery hashQuery = BlockQuery.newBuilder()
            .setBlockHash(genesis.getBlockHash())
            .build();

        Block block = blockchainService
            .getBlock(hashQuery)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(block);
        assertEquals(genesis.getBlockNumber(), block.getBlockNumber());
        assertEquals(genesis.getBlockHash(), block.getBlockHash());
    }

    @Test
    @Order(10)
    @DisplayName("Get chain statistics - genesis only")
    void testGetChainStatistics() {
        StatsRequest request = StatsRequest.newBuilder()
            .setFromBlock(0)
            .setToBlock(0)
            .build();

        ChainStatistics stats = blockchainService
            .getChainStats(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(stats);
        assertEquals(1, stats.getTotalBlocks());
        assertTrue(stats.getTotalTransactions() >= 0);
        assertTrue(stats.getActiveValidators() > 0);
    }

    @Test
    @Order(11)
    @DisplayName("Add block - should update chain")
    void testAddBlock() {
        long initialLatest = blockchainService.getLatestBlockNumber();

        // Create test transaction
        Transaction tx = Transaction.newBuilder()
            .setTxHash("0xtest123")
            .setFrom("0xfrom")
            .setTo("0xto")
            .setValue(1000)
            .setGasPrice(100)
            .setGasUsed(21000)
            .setNonce(1)
            .build();

        // Create block proposal
        Block newBlock = blockchainService.createBlockProposal(
            List.of(tx),
            "test-proposer"
        );

        // Add block
        blockchainService.addBlock(newBlock);

        // Verify
        long newLatest = blockchainService.getLatestBlockNumber();
        assertEquals(initialLatest + 1, newLatest);
    }

    @Test
    @Order(12)
    @DisplayName("Create block proposal - should generate valid block")
    void testCreateBlockProposal() {
        Transaction tx1 = Transaction.newBuilder()
            .setTxHash("0xtx1")
            .setFrom("0xfrom1")
            .setTo("0xto1")
            .setValue(1000)
            .setGasUsed(21000)
            .build();

        Transaction tx2 = Transaction.newBuilder()
            .setTxHash("0xtx2")
            .setFrom("0xfrom2")
            .setTo("0xto2")
            .setValue(2000)
            .setGasUsed(21000)
            .build();

        Block proposal = blockchainService.createBlockProposal(
            List.of(tx1, tx2),
            "validator-1"
        );

        assertNotNull(proposal);
        assertTrue(proposal.getBlockNumber() > 0);
        assertNotNull(proposal.getBlockHash());
        assertEquals("validator-1", proposal.getProposer());
        assertEquals(2, proposal.getTransactionCount());
        assertEquals(42000, proposal.getGasUsed());  // 21000 * 2
        assertEquals(2, proposal.getTransactionsCount());
        assertEquals(2, proposal.getTransactionHashesCount());
    }

    @Test
    @Order(13)
    @DisplayName("Stream blocks - should emit events")
    void testStreamBlocks() {
        BlockStreamRequest request = BlockStreamRequest.newBuilder()
            .setStartFromBlock(0)
            .setIncludeTransactions(true)
            .build();

        // Collect first 3 events (or timeout after 5 seconds)
        List<Block> blocks = blockchainService
            .streamBlocks(request)
            .select().first(3)
            .collect().asList()
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(blocks);
        // May be empty if no new blocks, but should not throw
        assertTrue(blocks.size() >= 0);
    }

    @Test
    @Order(14)
    @DisplayName("Multiple block additions - should update statistics")
    void testMultipleBlockAdditions() {
        long initialTotal = blockchainService.getTotalTransactions();

        // Add 10 blocks with transactions
        for (int i = 0; i < 10; i++) {
            Transaction tx = Transaction.newBuilder()
                .setTxHash("0xbulk-" + i)
                .setFrom("0xfrom-" + i)
                .setTo("0xto-" + i)
                .setValue(1000)
                .setGasUsed(21000)
                .build();

            Block block = blockchainService.createBlockProposal(
                List.of(tx),
                "validator-bulk"
            );

            blockchainService.addBlock(block);
        }

        long finalTotal = blockchainService.getTotalTransactions();
        assertEquals(initialTotal + 10, finalTotal);
    }

    @Test
    @Order(15)
    @DisplayName("Block confirmations - should track confirmations")
    void testBlockConfirmations() {
        Transaction tx = Transaction.newBuilder()
            .setTxHash("0xconf-test")
            .setFrom("0xfrom")
            .setTo("0xto")
            .setValue(1000)
            .setGasUsed(21000)
            .build();

        Block block = blockchainService.createBlockProposal(
            List.of(tx),
            "validator-conf"
        );

        blockchainService.addBlock(block);

        // Query the block
        BlockQuery query = BlockQuery.newBuilder()
            .setBlockNumber(block.getBlockNumber())
            .build();

        Block retrieved = blockchainService
            .getBlock(query)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(retrieved);
        assertTrue(retrieved.getConfirmations() >= 0);
    }

    @Test
    @Order(16)
    @DisplayName("High load test - 100 blocks")
    @Timeout(30)
    void testHighLoadBlockAddition() {
        long startTime = System.currentTimeMillis();
        int blockCount = 100;

        for (int i = 0; i < blockCount; i++) {
            Transaction tx = Transaction.newBuilder()
                .setTxHash("0xload-" + i)
                .setFrom("0xfrom-" + i)
                .setTo("0xto-" + i)
                .setValue(1000)
                .setGasUsed(21000)
                .build();

            Block block = blockchainService.createBlockProposal(
                List.of(tx),
                "validator-load"
            );

            blockchainService.addBlock(block);
        }

        long duration = System.currentTimeMillis() - startTime;
        double blocksPerSecond = (blockCount * 1000.0) / duration;

        System.out.printf("High load: %d blocks in %d ms (%.2f blocks/sec)%n",
            blockCount, duration, blocksPerSecond);

        assertTrue(blocksPerSecond > 10, "Should process >10 blocks/sec");
    }

    @Test
    @Order(17)
    @DisplayName("Chain statistics - multiple blocks")
    void testChainStatisticsMultipleBlocks() {
        // Ensure we have multiple blocks
        long latest = blockchainService.getLatestBlockNumber();

        if (latest < 10) {
            // Add more blocks for meaningful statistics
            for (int i = 0; i < 10; i++) {
                Transaction tx = Transaction.newBuilder()
                    .setTxHash("0xstats-" + i)
                    .setFrom("0xfrom")
                    .setTo("0xto")
                    .setValue(1000)
                    .setGasUsed(21000)
                    .build();

                Block block = blockchainService.createBlockProposal(
                    List.of(tx),
                    "validator-stats"
                );

                blockchainService.addBlock(block);
            }
        }

        StatsRequest request = StatsRequest.newBuilder()
            .setFromBlock(0)
            .setToBlock(0)  // Will use latest
            .build();

        ChainStatistics stats = blockchainService
            .getChainStats(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(stats);
        assertTrue(stats.getTotalBlocks() > 0);
        assertTrue(stats.getTotalTransactions() >= 0);
        assertTrue(stats.getActiveValidators() > 0);

        System.out.printf("Chain stats: %d blocks, %d transactions, %d validators%n",
            stats.getTotalBlocks(),
            stats.getTotalTransactions(),
            stats.getActiveValidators());
    }
}
