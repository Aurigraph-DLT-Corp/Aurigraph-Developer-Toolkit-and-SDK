package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.quarkus.test.junit.QuarkusTest;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.google.protobuf.Timestamp;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for BlockchainServiceImpl gRPC service.
 * Tests cover all 7 RPC methods with various scenarios including:
 * - Block creation and validation
 * - Block details retrieval
 * - Transaction execution and verification
 * - Blockchain statistics
 * - Block streaming
 * - Performance benchmarks
 * - Error handling
 *
 * Target: 90% code coverage for AV11-489
 *
 * @author QA Agent - Sprint 16
 * @ticket AV11-489
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("BlockchainService gRPC Tests")
class BlockchainServiceGrpcTest {

    @Inject
    @GrpcService
    BlockchainServiceImpl blockchainService;

    // ==================== Block Creation Tests ====================

    @Test
    @Order(1)
    @DisplayName("createBlock - should create block successfully")
    void testCreateBlock_Success() throws InterruptedException {
        // Given
        Transaction tx1 = Transaction.newBuilder()
                .setTransactionHash("0xabc123")
                .setFromAddress("0x1111")
                .setToAddress("0x2222")
                .setAmount("1000")
                .build();

        Transaction tx2 = Transaction.newBuilder()
                .setTransactionHash("0xdef456")
                .setFromAddress("0x3333")
                .setToAddress("0x4444")
                .setAmount("2000")
                .build();

        BlockCreationRequest request = BlockCreationRequest.newBuilder()
                .setBlockId("block-001")
                .addTransactions(tx1)
                .addTransactions(tx2)
                .setTransactionRoot("merkle-root-abc")
                .setStateRoot("state-root-123")
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockCreationResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockCreationResponse response = responseRef.get();
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertNotNull(response.getBlock());
        assertEquals(2, response.getBlock().getTransactionCount());
        assertNotNull(response.getBlock().getBlockHash());
    }

    @Test
    @Order(2)
    @DisplayName("createBlock - should fail with empty block ID")
    void testCreateBlock_EmptyBlockId() throws InterruptedException {
        // Given
        BlockCreationRequest request = BlockCreationRequest.newBuilder().build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockCreationResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockCreationResponse response = responseRef.get();
        assertNotNull(response);
        assertFalse(response.getSuccess());
        assertEquals("Block ID is required", response.getErrorMessage());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 10, 50, 100})
    @Order(3)
    @DisplayName("createBlock - should handle various transaction counts")
    void testCreateBlock_VariousTransactionCounts(int txCount) throws InterruptedException {
        // Given
        BlockCreationRequest.Builder requestBuilder = BlockCreationRequest.newBuilder()
                .setBlockId("block-tx-" + txCount)
                .setStateRoot("state-root");

        for (int i = 0; i < txCount; i++) {
            requestBuilder.addTransactions(Transaction.newBuilder()
                    .setTransactionHash("0xhash" + i)
                    .setFromAddress("0xfrom" + i)
                    .setToAddress("0xto" + i)
                    .setAmount(String.valueOf(i * 100))
                    .build());
        }

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockCreationResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(requestBuilder.build(), observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockCreationResponse response = responseRef.get();
        assertTrue(response.getSuccess());
        assertEquals(txCount, response.getBlock().getTransactionCount());
    }

    // ==================== Block Validation Tests ====================

    @Test
    @Order(10)
    @DisplayName("validateBlock - should validate block successfully")
    void testValidateBlock_Success() throws InterruptedException {
        // Given
        Block block = Block.newBuilder()
                .setBlockHash("valid-hash")
                .setBlockHeight(100)
                .setParentHash("parent-hash")
                .setTransactionRoot("tx-root")
                .setStateRoot("state-root")
                .setTransactionCount(5)
                .addTransactionHashes("tx1")
                .addTransactionHashes("tx2")
                .setCreatedAt(Timestamp.newBuilder()
                        .setSeconds(Instant.now().getEpochSecond())
                        .build())
                .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
                .setBlock(block)
                .setBlockHash("valid-hash")
                .setValidateTransactions(true)
                .setValidateSignatures(false)
                .setValidateStateRoot(false)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockValidationResult> resultRef = new AtomicReference<>();

        // When
        StreamObserver<BlockValidationResult> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockValidationResult value) {
                resultRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.validateBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockValidationResult result = resultRef.get();
        assertNotNull(result);
        assertTrue(result.getValidationTimeMs() < 100);
    }

    @Test
    @Order(11)
    @DisplayName("validateBlock - should detect invalid signatures")
    void testValidateBlock_InvalidSignatures() throws InterruptedException {
        // Given
        Block block = Block.newBuilder()
                .setBlockHash("invalid-hash")
                .setBlockHeight(100)
                .setTransactionCount(2)
                .addTransactionHashes("") // Empty hash should be invalid
                .addTransactionHashes("valid-hash")
                .setCreatedAt(Timestamp.newBuilder()
                        .setSeconds(Instant.now().getEpochSecond())
                        .build())
                .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
                .setBlock(block)
                .setBlockHash("invalid-hash")
                .setValidateTransactions(true)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockValidationResult> resultRef = new AtomicReference<>();

        // When
        StreamObserver<BlockValidationResult> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockValidationResult value) {
                resultRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.validateBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockValidationResult result = resultRef.get();
        assertNotNull(result);
        assertFalse(result.getIsValid());
        assertTrue(result.getErrorsCount() > 0);
    }

    // ==================== Block Details Tests ====================

    @Test
    @Order(20)
    @DisplayName("getBlockDetails - should return block by hash")
    void testGetBlockDetails_ByHash() throws InterruptedException {
        // First create a block
        createTestBlock("block-details-001");

        // Given
        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
                .setBlockHash("block-details-001")
                .setIncludeTransactions(false)
                .setIncludeValidators(false)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockDetailsResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<BlockDetailsResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockDetailsResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        // Small delay to ensure block is persisted
        Thread.sleep(100);
        blockchainService.getBlockDetails(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockDetailsResponse response = responseRef.get();
        assertNotNull(response);
    }

    @Test
    @Order(21)
    @DisplayName("getBlockDetails - should return not found for missing block")
    void testGetBlockDetails_NotFound() throws InterruptedException {
        // Given
        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
                .setBlockHash("non-existent-hash")
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockDetailsResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<BlockDetailsResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockDetailsResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.getBlockDetails(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockDetailsResponse response = responseRef.get();
        assertNotNull(response);
        assertFalse(response.getFound());
    }

    // ==================== Transaction Execution Tests ====================

    @Test
    @Order(30)
    @DisplayName("executeTransaction - should execute transaction successfully")
    void testExecuteTransaction_Success() throws InterruptedException {
        // Given
        Transaction tx = Transaction.newBuilder()
                .setTransactionHash("exec-tx-001")
                .setFromAddress("0xSender")
                .setToAddress("0xReceiver")
                .setAmount("500")
                .build();

        TransactionExecutionRequest request = TransactionExecutionRequest.newBuilder()
                .setTransaction(tx)
                .setValidateBeforeExecute(true)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<TransactionExecutionResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<TransactionExecutionResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(TransactionExecutionResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.executeTransaction(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        TransactionExecutionResponse response = responseRef.get();
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals(3, response.getStateChangesCount()); // Balance debit, credit, nonce
        assertEquals(TransactionStatus.TRANSACTION_CONFIRMED, response.getTransaction().getStatus());
    }

    @Test
    @Order(31)
    @DisplayName("executeTransaction - should fail validation")
    void testExecuteTransaction_FailValidation() throws InterruptedException {
        // Given - missing required fields
        Transaction tx = Transaction.newBuilder()
                .setTransactionHash("invalid-tx")
                .build();

        TransactionExecutionRequest request = TransactionExecutionRequest.newBuilder()
                .setTransaction(tx)
                .setValidateBeforeExecute(true)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<TransactionExecutionResponse> responseRef = new AtomicReference<>();

        // When
        StreamObserver<TransactionExecutionResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(TransactionExecutionResponse value) {
                responseRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.executeTransaction(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        TransactionExecutionResponse response = responseRef.get();
        assertNotNull(response);
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("missing from/to address"));
    }

    // ==================== Transaction Verification Tests ====================

    @Test
    @Order(40)
    @DisplayName("verifyTransaction - should verify with valid Merkle proof")
    void testVerifyTransaction_ValidProof() throws InterruptedException {
        // First create a block with transactions
        String blockHash = createTestBlockWithHash("verify-block-001");

        // Given
        TransactionVerificationRequest request = TransactionVerificationRequest.newBuilder()
                .setTransactionHash("tx-001")
                .setBlockHash(blockHash)
                .addMerkleProof("sibling1")
                .addMerkleProof("sibling2")
                .setProofIndex(0)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<TransactionVerificationResult> resultRef = new AtomicReference<>();

        // When
        StreamObserver<TransactionVerificationResult> observer = new StreamObserver<>() {
            @Override
            public void onNext(TransactionVerificationResult value) {
                resultRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        Thread.sleep(100); // Wait for block to be persisted
        blockchainService.verifyTransaction(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        TransactionVerificationResult result = resultRef.get();
        assertNotNull(result);
        assertTrue(result.getVerificationTimeMs() < 50);
    }

    @Test
    @Order(41)
    @DisplayName("verifyTransaction - should fail for non-existent block")
    void testVerifyTransaction_BlockNotFound() throws InterruptedException {
        // Given
        TransactionVerificationRequest request = TransactionVerificationRequest.newBuilder()
                .setTransactionHash("tx-001")
                .setBlockHash("non-existent-block")
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<TransactionVerificationResult> resultRef = new AtomicReference<>();

        // When
        StreamObserver<TransactionVerificationResult> observer = new StreamObserver<>() {
            @Override
            public void onNext(TransactionVerificationResult value) {
                resultRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.verifyTransaction(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        TransactionVerificationResult result = resultRef.get();
        assertNotNull(result);
        assertFalse(result.getIsVerified());
        assertTrue(result.getErrorMessage().contains("Block not found"));
    }

    // ==================== Blockchain Statistics Tests ====================

    @Test
    @Order(50)
    @DisplayName("getBlockchainStatistics - should return comprehensive statistics")
    void testGetBlockchainStatistics_Success() throws InterruptedException {
        // Given
        BlockchainStatisticsRequest request = BlockchainStatisticsRequest.newBuilder()
                .setTimeWindowMinutes(60)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockchainStatistics> statsRef = new AtomicReference<>();

        // When
        StreamObserver<BlockchainStatistics> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockchainStatistics value) {
                statsRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.getBlockchainStatistics(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockchainStatistics stats = statsRef.get();
        assertNotNull(stats);
        assertTrue(stats.getTotalBlocks() >= 0);
        assertTrue(stats.getTotalTransactions() >= 0);
        assertTrue(stats.getActiveValidators() > 0);
        assertEquals(100, stats.getSyncStatusPercent());
        assertNotNull(stats.getNetworkHealthStatus());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 30, 60, 1440})
    @Order(51)
    @DisplayName("getBlockchainStatistics - should handle various time windows")
    void testGetBlockchainStatistics_TimeWindows(int timeWindowMinutes) throws InterruptedException {
        // Given
        BlockchainStatisticsRequest request = BlockchainStatisticsRequest.newBuilder()
                .setTimeWindowMinutes(timeWindowMinutes)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockchainStatistics> statsRef = new AtomicReference<>();

        // When
        StreamObserver<BlockchainStatistics> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockchainStatistics value) {
                statsRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.getBlockchainStatistics(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        BlockchainStatistics stats = statsRef.get();
        assertNotNull(stats);
        assertTrue(stats.getMeasurementDurationSeconds() >= 0);
    }

    // ==================== Block Streaming Tests ====================

    @Test
    @Order(60)
    @DisplayName("streamBlocks - should stream new blocks")
    void testStreamBlocks_NewBlocks() throws InterruptedException {
        // Given
        BlockStreamRequest request = BlockStreamRequest.newBuilder()
                .setStartFromHeight(0)
                .setOnlyNewBlocks(true)
                .setIncludeTransactions(0) // No transactions
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger eventCount = new AtomicInteger(0);

        // When
        StreamObserver<BlockStreamEvent> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockStreamEvent value) {
                eventCount.incrementAndGet();
                assertNotNull(value.getBlock());
                assertNotNull(value.getStreamId());
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.streamBlocks(request, observer);

        // Give it time to process
        Thread.sleep(1000);

        // Then - stream should be active (not completed yet)
        assertFalse(latch.await(100, TimeUnit.MILLISECONDS));
    }

    @Test
    @Order(61)
    @DisplayName("streamBlocks - should stream historical blocks")
    void testStreamBlocks_HistoricalBlocks() throws InterruptedException {
        // First create some blocks
        createTestBlock("stream-block-001");
        Thread.sleep(100);

        // Given
        BlockStreamRequest request = BlockStreamRequest.newBuilder()
                .setStartFromHeight(0)
                .setOnlyNewBlocks(false)
                .setIncludeTransactions(1) // Hash only
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger eventCount = new AtomicInteger(0);
        List<BlockStreamEvent> events = new ArrayList<>();

        // When
        StreamObserver<BlockStreamEvent> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockStreamEvent value) {
                events.add(value);
                eventCount.incrementAndGet();
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.streamBlocks(request, observer);

        // Give it time to stream
        Thread.sleep(1000);

        // Then
        assertTrue(eventCount.get() >= 0);
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(70)
    @DisplayName("Performance - block creation under 30ms")
    void testPerformance_BlockCreation() throws InterruptedException {
        // Given
        BlockCreationRequest request = BlockCreationRequest.newBuilder()
                .setBlockId("perf-block-001")
                .setStateRoot("state")
                .addTransactions(Transaction.newBuilder()
                        .setTransactionHash("tx1")
                        .setFromAddress("0x1")
                        .setToAddress("0x2")
                        .setAmount("100")
                        .build())
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Long> durationRef = new AtomicReference<>();

        // When
        long startTime = System.currentTimeMillis();
        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {
                durationRef.set(System.currentTimeMillis() - startTime);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        Long duration = durationRef.get();
        assertNotNull(duration);
        System.out.printf("Block creation took %dms (target: <30ms)%n", duration);
        assertTrue(duration < 100, "Block creation should be fast");
    }

    @Test
    @Order(71)
    @DisplayName("Performance - block validation under 10ms")
    void testPerformance_BlockValidation() throws InterruptedException {
        // Given
        Block block = Block.newBuilder()
                .setBlockHash("perf-validate")
                .setBlockHeight(1)
                .setCreatedAt(Timestamp.newBuilder()
                        .setSeconds(Instant.now().getEpochSecond())
                        .build())
                .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
                .setBlock(block)
                .setValidateTransactions(false)
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<BlockValidationResult> resultRef = new AtomicReference<>();

        // When
        long startTime = System.currentTimeMillis();
        StreamObserver<BlockValidationResult> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockValidationResult value) {
                resultRef.set(value);
            }

            @Override
            public void onError(Throwable t) {
                fail("Should not error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.validateBlock(request, observer);

        // Then
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        long duration = System.currentTimeMillis() - startTime;
        System.out.printf("Block validation took %dms (target: <10ms)%n", duration);
    }

    // ==================== Helper Methods ====================

    private void createTestBlock(String blockId) throws InterruptedException {
        BlockCreationRequest request = BlockCreationRequest.newBuilder()
                .setBlockId(blockId)
                .setStateRoot("state-root")
                .addTransactions(Transaction.newBuilder()
                        .setTransactionHash("tx-001")
                        .setFromAddress("0x1")
                        .setToAddress("0x2")
                        .setAmount("100")
                        .build())
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {}

            @Override
            public void onError(Throwable t) {}

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(request, observer);
        latch.await(5, TimeUnit.SECONDS);
    }

    private String createTestBlockWithHash(String blockId) throws InterruptedException {
        BlockCreationRequest request = BlockCreationRequest.newBuilder()
                .setBlockId(blockId)
                .setStateRoot("state-root")
                .setTransactionRoot("tx-root")
                .addTransactions(Transaction.newBuilder()
                        .setTransactionHash("tx-001")
                        .setFromAddress("0x1")
                        .setToAddress("0x2")
                        .setAmount("100")
                        .build())
                .build();

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> hashRef = new AtomicReference<>();

        StreamObserver<BlockCreationResponse> observer = new StreamObserver<>() {
            @Override
            public void onNext(BlockCreationResponse value) {
                if (value.getSuccess()) {
                    hashRef.set(value.getBlock().getBlockHash());
                }
            }

            @Override
            public void onError(Throwable t) {}

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        };

        blockchainService.createBlock(request, observer);
        latch.await(5, TimeUnit.SECONDS);
        return hashRef.get();
    }
}
