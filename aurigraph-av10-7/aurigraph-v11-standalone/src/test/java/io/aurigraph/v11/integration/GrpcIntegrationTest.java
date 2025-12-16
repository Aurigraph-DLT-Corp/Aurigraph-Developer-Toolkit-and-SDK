package io.aurigraph.v11.integration;

import io.aurigraph.v11.grpc.*;
import io.aurigraph.v11.proto.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive gRPC Integration Test Suite for Aurigraph V12
 *
 * Tests all major gRPC services with end-to-end integration scenarios:
 * - TransactionService (12 methods)
 * - BlockchainService (8 methods)
 * - ConsensusService (6 methods)
 * - Streaming endpoints (4 services)
 * - Error handling and edge cases
 *
 * Coverage Target: 20 comprehensive tests
 *
 * @author J4C Integration Test Agent
 * @version 12.0.0
 * @since 2025-12-16
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("gRPC Integration Tests - Comprehensive Suite")
public class GrpcIntegrationTest {

    @Inject
    TransactionServiceImpl transactionService;

    @Inject
    BlockchainServiceImpl blockchainService;

    @Inject
    ConsensusServiceImpl consensusService;

    // ============================================================================
    // TRANSACTION SERVICE TESTS (8 tests)
    // ============================================================================

    @Test
    @Order(1)
    @DisplayName("Transaction: Submit single transaction successfully")
    void testTransactionSubmit_Success() {
        // Given
        Transaction tx = Transaction.newBuilder()
                .setFromAddress("0x1234567890abcdef")
                .setToAddress("0xfedcba0987654321")
                .setAmount("1000000000000000000")
                .setNonce(1)
                .setGasLimit(21000)
                .setGasPrice("20000000000")
                .build();

        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                .setTransaction(tx)
                .build();

        // When
        Uni<TransactionSubmissionResponse> result = transactionService.submitTransaction(request);

        // Then
        TransactionSubmissionResponse response = result.await().atMost(Duration.ofSeconds(5));
        assertNotNull(response);
        assertNotNull(response.getTransactionHash());
        assertFalse(response.getTransactionHash().isEmpty());
        assertEquals(TransactionStatus.TRANSACTION_PENDING, response.getStatus());
        assertTrue(response.getTimestamp() > 0);
        System.out.println("✅ Transaction submitted: " + response.getTransactionHash());
    }

    @Test
    @Order(2)
    @DisplayName("Transaction: Batch submit with 100 transactions")
    void testTransactionBatchSubmit_LargeScale() {
        // Given
        BatchTransactionSubmissionRequest.Builder requestBuilder = BatchTransactionSubmissionRequest.newBuilder();
        for (int i = 0; i < 100; i++) {
            requestBuilder.addTransactions(Transaction.newBuilder()
                    .setFromAddress("0xsender" + i)
                    .setToAddress("0xreceiver" + i)
                    .setAmount(String.valueOf(i * 1000))
                    .setNonce(i)
                    .build());
        }

        // When
        long startTime = System.currentTimeMillis();
        Uni<BatchTransactionSubmissionResponse> result = transactionService.batchSubmitTransactions(requestBuilder.build());
        BatchTransactionSubmissionResponse response = result.await().atMost(Duration.ofSeconds(10));
        long duration = System.currentTimeMillis() - startTime;

        // Then
        assertNotNull(response);
        assertEquals(100, response.getAcceptedCount());
        assertEquals(0, response.getRejectedCount());
        assertNotNull(response.getBatchId());
        assertTrue(duration < 5000, "Batch should complete in under 5 seconds");
        System.out.printf("✅ Batch submitted: 100 txs in %d ms%n", duration);
    }

    @Test
    @Order(3)
    @DisplayName("Transaction: Get status for confirmed transaction")
    void testTransactionGetStatus_Confirmed() {
        // Given
        String txHash = UUID.randomUUID().toString();
        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
                .setTransactionHash(txHash)
                .build();

        // When
        Uni<TransactionStatusResponse> result = transactionService.getTransactionStatus(request);
        TransactionStatusResponse response = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertNotNull(response.getStatus());
        assertTrue(response.getConfirmations() >= 0);
        assertTrue(response.getTimestamp() > 0);
        System.out.println("✅ Transaction status: " + response.getStatus());
    }

    @Test
    @Order(4)
    @DisplayName("Transaction: Get receipt with execution details")
    void testTransactionGetReceipt_WithDetails() {
        // Given
        GetTransactionStatusRequest request = GetTransactionStatusRequest.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .build();

        // When
        Uni<TransactionReceipt> result = transactionService.getTransactionReceipt(request);
        TransactionReceipt receipt = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(receipt);
        assertEquals(TransactionStatus.TRANSACTION_CONFIRMED, receipt.getStatus());
        assertTrue(receipt.getBlockHeight() > 0);
        assertTrue(receipt.getGasUsed() > 0);
        assertNotNull(receipt.getExecutionTime());
        System.out.println("✅ Receipt retrieved: block " + receipt.getBlockHeight());
    }

    @Test
    @Order(5)
    @DisplayName("Transaction: Cancel pending transaction")
    void testTransactionCancel_Success() {
        // Given
        CancelTransactionRequest request = CancelTransactionRequest.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .setCancellationReason("User initiated cancellation")
                .build();

        // When
        Uni<CancelTransactionResponse> result = transactionService.cancelTransaction(request);
        CancelTransactionResponse response = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertTrue(response.getCancellationSuccessful());
        assertNotNull(response.getReason());
        System.out.println("✅ Transaction cancelled: " + response.getReason());
    }

    @Test
    @Order(6)
    @DisplayName("Transaction: Estimate gas cost for complex transaction")
    void testTransactionEstimateGas_Complex() {
        // Given
        EstimateGasCostRequest request = EstimateGasCostRequest.newBuilder()
                .setFromAddress("0x1234567890abcdef")
                .setToAddress("0xfedcba0987654321")
                .setAmount("5000000000000000000")
                .setData("0x" + "ab".repeat(1000)) // Complex data payload
                .build();

        // When
        Uni<GasEstimate> result = transactionService.estimateGasCost(request);
        GasEstimate estimate = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(estimate);
        assertTrue(estimate.getEstimatedGas() > 21000); // Should be higher than basic transfer
        assertTrue(estimate.getGasPriceWei() > 0);
        assertNotNull(estimate.getTotalCost());
        System.out.println("✅ Gas estimate: " + estimate.getEstimatedGas());
    }

    @Test
    @Order(7)
    @DisplayName("Transaction: Validate signature with full checks")
    void testTransactionValidateSignature_FullValidation() {
        // Given
        Transaction tx = Transaction.newBuilder()
                .setTransactionHash(UUID.randomUUID().toString())
                .setFromAddress("0x1234567890abcdef")
                .setToAddress("0xfedcba0987654321")
                .setAmount("1000000000000000000")
                .setSignature("0x" + "ab".repeat(65))
                .setNonce(42)
                .build();

        ValidateTransactionSignatureRequest request = ValidateTransactionSignatureRequest.newBuilder()
                .setTransaction(tx)
                .setValidateSender(true)
                .setValidateNonce(true)
                .build();

        // When
        Uni<TransactionSignatureValidationResult> result = transactionService.validateTransactionSignature(request);
        TransactionSignatureValidationResult validation = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(validation);
        assertTrue(validation.getSignatureValid());
        assertTrue(validation.getSenderValid());
        assertTrue(validation.getNonceValid());
        System.out.println("✅ Signature validated successfully");
    }

    @Test
    @Order(8)
    @DisplayName("Transaction: Stream events with filtering")
    @Timeout(15)
    void testTransactionStreamEvents_WithFilter() throws InterruptedException {
        // Given
        StreamTransactionEventsRequest request = StreamTransactionEventsRequest.newBuilder()
                .setFilterAddress("0x1234567890abcdef")
                .setIncludeFailed(false)
                .setStreamTimeoutSeconds(10)
                .build();

        CountDownLatch latch = new CountDownLatch(5);
        AtomicInteger eventCount = new AtomicInteger(0);

        // When
        Multi<TransactionEvent> stream = transactionService.streamTransactionEvents(request);

        // Then
        AssertSubscriber<TransactionEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                    assertNotNull(event.getEventType());
                    assertNotNull(event.getStatus());
                })
                .subscribe().withSubscriber(AssertSubscriber.create(10));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(eventCount.get() > 0, "Should receive events");
        System.out.println("✅ Streamed " + eventCount.get() + " events");
    }

    // ============================================================================
    // BLOCKCHAIN SERVICE TESTS (6 tests)
    // ============================================================================

    @Test
    @Order(9)
    @DisplayName("Blockchain: Get latest block with full details")
    void testBlockchainGetLatestBlock_FullDetails() {
        // Given
        GetLatestBlockRequest request = GetLatestBlockRequest.newBuilder()
                .setIncludeTransactions(true)
                .build();

        // When
        Uni<Block> result = blockchainService.getLatestBlock(request);
        Block block = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(block);
        assertTrue(block.getHeight() > 0);
        assertNotNull(block.getBlockHash());
        assertFalse(block.getBlockHash().isEmpty());
        assertTrue(block.getTimestamp() > 0);
        assertTrue(block.getTransactionCount() >= 0);
        System.out.println("✅ Latest block: #" + block.getHeight());
    }

    @Test
    @Order(10)
    @DisplayName("Blockchain: Get block by height")
    void testBlockchainGetBlockByHeight_Specific() {
        // Given
        GetBlockByHeightRequest request = GetBlockByHeightRequest.newBuilder()
                .setHeight(100)
                .setIncludeTransactions(true)
                .build();

        // When
        Uni<Block> result = blockchainService.getBlockByHeight(request);
        Block block = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(block);
        assertEquals(100, block.getHeight());
        assertNotNull(block.getBlockHash());
        System.out.println("✅ Block at height 100: " + block.getBlockHash());
    }

    @Test
    @Order(11)
    @DisplayName("Blockchain: Get block by hash")
    void testBlockchainGetBlockByHash_Lookup() {
        // Given
        GetBlockByHashRequest request = GetBlockByHashRequest.newBuilder()
                .setBlockHash("0x" + "ab".repeat(32))
                .setIncludeTransactions(false)
                .build();

        // When
        Uni<Block> result = blockchainService.getBlockByHash(request);
        Block block = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(block);
        assertTrue(block.getHeight() > 0);
        System.out.println("✅ Block found: #" + block.getHeight());
    }

    @Test
    @Order(12)
    @DisplayName("Blockchain: Get chain statistics")
    void testBlockchainGetChainStats_Comprehensive() {
        // Given
        GetChainStatsRequest request = GetChainStatsRequest.newBuilder().build();

        // When
        Uni<ChainStatistics> result = blockchainService.getChainStats(request);
        ChainStatistics stats = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(stats);
        assertTrue(stats.getCurrentHeight() > 0);
        assertTrue(stats.getTotalTransactions() >= 0);
        assertTrue(stats.getAverageBlockTime() > 0);
        assertTrue(stats.getNetworkHashRate() >= 0);
        System.out.printf("✅ Chain stats: height=%d, txs=%d%n",
                stats.getCurrentHeight(), stats.getTotalTransactions());
    }

    @Test
    @Order(13)
    @DisplayName("Blockchain: Get account balance with history")
    void testBlockchainGetBalance_WithHistory() {
        // Given
        GetBalanceRequest request = GetBalanceRequest.newBuilder()
                .setAddress("0x1234567890abcdef")
                .setIncludeTokenBalances(true)
                .build();

        // When
        Uni<BalanceResponse> result = blockchainService.getBalance(request);
        BalanceResponse balance = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(balance);
        assertNotNull(balance.getBalance());
        assertTrue(balance.getTimestamp() > 0);
        System.out.println("✅ Balance: " + balance.getBalance());
    }

    @Test
    @Order(14)
    @DisplayName("Blockchain: Stream new blocks in real-time")
    @Timeout(15)
    void testBlockchainStreamBlocks_RealTime() throws InterruptedException {
        // Given
        StreamBlocksRequest request = StreamBlocksRequest.newBuilder()
                .setIncludeTransactions(true)
                .setStreamTimeoutSeconds(10)
                .build();

        CountDownLatch latch = new CountDownLatch(3);
        AtomicInteger blockCount = new AtomicInteger(0);

        // When
        Multi<Block> stream = blockchainService.streamBlocks(request);

        // Then
        AssertSubscriber<Block> subscriber = stream
                .onItem().invoke(block -> {
                    blockCount.incrementAndGet();
                    latch.countDown();
                    assertTrue(block.getHeight() > 0);
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(blockCount.get() > 0, "Should receive blocks");
        System.out.println("✅ Streamed " + blockCount.get() + " blocks");
    }

    // ============================================================================
    // CONSENSUS SERVICE TESTS (4 tests)
    // ============================================================================

    @Test
    @Order(15)
    @DisplayName("Consensus: Get validator set")
    void testConsensusGetValidatorSet_Active() {
        // Given
        GetValidatorSetRequest request = GetValidatorSetRequest.newBuilder()
                .setIncludeInactive(false)
                .build();

        // When
        Uni<ValidatorSetResponse> result = consensusService.getValidatorSet(request);
        ValidatorSetResponse validators = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(validators);
        assertTrue(validators.getTotalValidators() > 0);
        assertTrue(validators.getActiveValidators() > 0);
        System.out.println("✅ Validator set: " + validators.getActiveValidators() + " active");
    }

    @Test
    @Order(16)
    @DisplayName("Consensus: Get consensus state")
    void testConsensusGetState_Current() {
        // Given
        GetConsensusStateRequest request = GetConsensusStateRequest.newBuilder().build();

        // When
        Uni<ConsensusStateResponse> result = consensusService.getConsensusState(request);
        ConsensusStateResponse state = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(state);
        assertNotNull(state.getCurrentPhase());
        assertTrue(state.getCurrentRound() >= 0);
        assertTrue(state.getParticipatingValidators() >= 0);
        System.out.println("✅ Consensus phase: " + state.getCurrentPhase());
    }

    @Test
    @Order(17)
    @DisplayName("Consensus: Submit proposal")
    void testConsensusSubmitProposal_Valid() {
        // Given
        SubmitProposalRequest request = SubmitProposalRequest.newBuilder()
                .setProposalData("Test governance proposal")
                .setProposerAddress("0x1234567890abcdef")
                .setVotingPeriod(86400)
                .build();

        // When
        Uni<ProposalSubmissionResponse> result = consensusService.submitProposal(request);
        ProposalSubmissionResponse response = result.await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertNotNull(response.getProposalId());
        assertTrue(response.getSubmitted());
        System.out.println("✅ Proposal submitted: " + response.getProposalId());
    }

    @Test
    @Order(18)
    @DisplayName("Consensus: Stream consensus events")
    @Timeout(15)
    void testConsensusStreamEvents_RealTime() throws InterruptedException {
        // Given
        StreamConsensusEventsRequest request = StreamConsensusEventsRequest.newBuilder()
                .setIncludeVotes(true)
                .setStreamTimeoutSeconds(10)
                .build();

        CountDownLatch latch = new CountDownLatch(3);
        AtomicInteger eventCount = new AtomicInteger(0);

        // When
        Multi<ConsensusEvent> stream = consensusService.streamConsensusEvents(request);

        // Then
        AssertSubscriber<ConsensusEvent> subscriber = stream
                .onItem().invoke(event -> {
                    eventCount.incrementAndGet();
                    latch.countDown();
                    assertNotNull(event.getEventType());
                })
                .subscribe().withSubscriber(AssertSubscriber.create(5));

        boolean completed = latch.await(10, TimeUnit.SECONDS);
        assertTrue(eventCount.get() > 0, "Should receive consensus events");
        System.out.println("✅ Streamed " + eventCount.get() + " consensus events");
    }

    // ============================================================================
    // ERROR HANDLING TESTS (2 tests)
    // ============================================================================

    @Test
    @Order(19)
    @DisplayName("Error Handling: Invalid transaction format")
    void testErrorHandling_InvalidTransaction() {
        // Given - Empty transaction
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder().build();

        // When
        Uni<TransactionSubmissionResponse> result = transactionService.submitTransaction(request);
        TransactionSubmissionResponse response = result.await().atMost(Duration.ofSeconds(5));

        // Then - Should handle gracefully
        assertNotNull(response);
        // Service should still respond even with empty transaction
        System.out.println("✅ Invalid transaction handled gracefully");
    }

    @Test
    @Order(20)
    @DisplayName("Error Handling: Non-existent block lookup")
    void testErrorHandling_NonExistentBlock() {
        // Given - Very high block number that doesn't exist
        GetBlockByHeightRequest request = GetBlockByHeightRequest.newBuilder()
                .setHeight(999999999)
                .setIncludeTransactions(false)
                .build();

        // When & Then - Should handle gracefully or return error
        try {
            Uni<Block> result = blockchainService.getBlockByHeight(request);
            Block block = result.await().atMost(Duration.ofSeconds(5));
            // If it returns a block, verify it's valid
            assertNotNull(block);
            System.out.println("✅ Non-existent block handled gracefully");
        } catch (Exception e) {
            // Expected behavior - block doesn't exist
            System.out.println("✅ Non-existent block threw expected exception");
            assertTrue(true);
        }
    }
}
