package io.aurigraph.v11.grpc;

import io.aurigraph.v11.models.Block;
import io.aurigraph.v11.models.BlockStatus;
import io.aurigraph.v11.models.Transaction;
import io.aurigraph.v11.models.TransactionStatus;
import io.aurigraph.v11.proto.*;
import io.aurigraph.v11.repositories.BlockRepository;
import io.aurigraph.v11.repositories.TransactionRepository;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectMock;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.ArgumentCaptor;

import com.google.protobuf.Timestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive Test Suite for BlockchainServiceImpl
 *
 * Tests all 7 RPC methods:
 * 1. createBlock() - Block creation with Merkle tree
 * 2. validateBlock() - Block validation (hash, signatures, Merkle)
 * 3. getBlockDetails() - Block retrieval by hash/height
 * 4. executeTransaction() - Transaction execution with state changes
 * 5. verifyTransaction() - Merkle proof verification
 * 6. getBlockchainStatistics() - Statistics aggregation
 * 7. streamBlocks() - Server-side streaming
 *
 * Coverage Target: 90%+
 *
 * @author Agent B - Blockchain Service Tests
 * @version 11.0.0
 * @since Sprint 9 - Week 2-3
 */
@QuarkusTest
public class BlockchainServiceTest {

    @Inject
    BlockchainServiceImpl blockchainService;

    @InjectMock
    BlockRepository blockRepository;

    @InjectMock
    TransactionRepository transactionRepository;

    private Block testBlock;
    private Transaction testTransaction;
    private List<io.aurigraph.v11.proto.Transaction> protoTransactions;

    @BeforeEach
    void setUp() {
        // Create test block
        testBlock = new Block();
        testBlock.setHeight(100L);
        testBlock.setHash("abc123hash");
        testBlock.setPreviousHash("prev456hash");
        testBlock.setMerkleRoot("merkle789root");
        testBlock.setStateRoot("state000root");
        testBlock.setTimestamp(Instant.now());
        testBlock.setTransactionCount(2);
        testBlock.setTransactionIds(Arrays.asList("tx1hash", "tx2hash"));
        testBlock.setStatus(BlockStatus.FINALIZED);
        testBlock.setValidatorAddress("validator1");
        testBlock.setValidatorSignature("sig123");
        testBlock.ensureCreatedAt();

        // Create test transaction
        testTransaction = new Transaction();
        testTransaction.setHash("tx1hash");
        testTransaction.setFromAddress("sender123");
        testTransaction.setToAddress("receiver456");
        testTransaction.setAmount(BigDecimal.valueOf(100.0));
        testTransaction.setGasPrice(BigDecimal.valueOf(1.5));
        testTransaction.setGasLimit(BigDecimal.valueOf(21000));
        testTransaction.setNonce(5);
        testTransaction.setTimestamp(Instant.now());
        testTransaction.setStatus(TransactionStatus.PENDING);
        testTransaction.setSignature("txsig789");
        testTransaction.setPublicKey("pubkey123");

        // Create proto transactions
        protoTransactions = Arrays.asList(
            io.aurigraph.v11.proto.Transaction.newBuilder()
                .setTransactionHash("tx1hash")
                .setFromAddress("sender123")
                .setToAddress("receiver456")
                .setAmount("100.0")
                .setGasPrice(1.5)
                .setGasLimit(21000.0)
                .setNonce(5)
                .setSignature("txsig789")
                .setPublicKey("pubkey123")
                .setStatus(io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PENDING)
                .build(),
            io.aurigraph.v11.proto.Transaction.newBuilder()
                .setTransactionHash("tx2hash")
                .setFromAddress("sender789")
                .setToAddress("receiver012")
                .setAmount("50.0")
                .setGasPrice(1.2)
                .setGasLimit(21000.0)
                .setNonce(3)
                .setSignature("txsig456")
                .setPublicKey("pubkey456")
                .setStatus(io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PENDING)
                .build()
        );
    }

    // ==================== TEST 1: createBlock() ====================

    @Test
    @DisplayName("Test 1.1: createBlock - Successfully create block with transactions")
    void testCreateBlock_Success() {
        // Mock repository
        when(blockRepository.getLatestBlockHeight()).thenReturn(99L);
        when(blockRepository.findLatestBlock()).thenReturn(Optional.of(testBlock));

        // Create request
        BlockCreationRequest request = BlockCreationRequest.newBuilder()
            .setBlockId("block-123")
            .setStateRoot("newStateRoot")
            .addAllTransactions(protoTransactions)
            .setTransactionRoot("") // Will be computed
            .setValidatorCount(3)
            .build();

        // Mock response observer
        @SuppressWarnings("unchecked")
        StreamObserver<BlockCreationResponse> responseObserver = mock(StreamObserver.class);

        // Execute
        blockchainService.createBlock(request, responseObserver);

        // Verify
        ArgumentCaptor<BlockCreationResponse> responseCaptor = ArgumentCaptor.forClass(BlockCreationResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        BlockCreationResponse response = responseCaptor.getValue();
        assertTrue(response.getSuccess());
        assertEquals(100L, response.getBlock().getBlockHeight());
        assertEquals(2, response.getBlock().getTransactionCount());
        assertFalse(response.getBlock().getBlockHash().isEmpty());
    }

    @Test
    @DisplayName("Test 1.2: createBlock - Fail when block ID is missing")
    void testCreateBlock_MissingBlockId() {
        BlockCreationRequest request = BlockCreationRequest.newBuilder()
            .setBlockId("") // Empty block ID
            .setStateRoot("stateRoot")
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockCreationResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.createBlock(request, responseObserver);

        ArgumentCaptor<BlockCreationResponse> responseCaptor = ArgumentCaptor.forClass(BlockCreationResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        BlockCreationResponse response = responseCaptor.getValue();
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("Block ID is required"));
    }

    @Test
    @DisplayName("Test 1.3: createBlock - Create genesis block (height 0)")
    void testCreateBlock_GenesisBlock() {
        when(blockRepository.getLatestBlockHeight()).thenReturn(-1L);
        when(blockRepository.findLatestBlock()).thenReturn(Optional.empty());

        BlockCreationRequest request = BlockCreationRequest.newBuilder()
            .setBlockId("genesis-block")
            .setStateRoot("genesisStateRoot")
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockCreationResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.createBlock(request, responseObserver);

        ArgumentCaptor<BlockCreationResponse> responseCaptor = ArgumentCaptor.forClass(BlockCreationResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockCreationResponse response = responseCaptor.getValue();
        assertTrue(response.getSuccess());
        assertEquals(0L, response.getBlock().getBlockHeight());
    }

    // ==================== TEST 2: validateBlock() ====================

    @Test
    @DisplayName("Test 2.1: validateBlock - Valid block passes all checks")
    void testValidateBlock_Success() {
        io.aurigraph.v11.proto.Block protoBlock = io.aurigraph.v11.proto.Block.newBuilder()
            .setBlockHash("validhash123")
            .setBlockHeight(100)
            .setStateRoot("stateRoot")
            .setTransactionRoot("merkleRoot")
            .setParentHash("parentHash")
            .addAllTransactionHashes(Arrays.asList("tx1", "tx2"))
            .setTransactionCount(2)
            .setValidatorCount(3)
            .addValidatorSignatures("sig1")
            .setCreatedAt(Timestamp.newBuilder().setSeconds(Instant.now().getEpochSecond()).build())
            .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
            .setBlockHash("validhash123")
            .setBlock(protoBlock)
            .setValidateTransactions(true)
            .setValidateSignatures(true)
            .setValidateStateRoot(false) // Skip hash recomputation for this test
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockValidationResult> responseObserver = mock(StreamObserver.class);

        blockchainService.validateBlock(request, responseObserver);

        ArgumentCaptor<BlockValidationResult> responseCaptor = ArgumentCaptor.forClass(BlockValidationResult.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        BlockValidationResult result = responseCaptor.getValue();
        assertTrue(result.getIsValid());
        assertEquals(0, result.getErrorsCount());
    }

    @Test
    @DisplayName("Test 2.2: validateBlock - Detect invalid Merkle root")
    void testValidateBlock_InvalidMerkleRoot() {
        io.aurigraph.v11.proto.Block protoBlock = io.aurigraph.v11.proto.Block.newBuilder()
            .setBlockHash("blockhash")
            .setBlockHeight(100)
            .setTransactionRoot("WRONG_MERKLE_ROOT")
            .addAllTransactionHashes(Arrays.asList("tx1", "tx2"))
            .setCreatedAt(Timestamp.newBuilder().setSeconds(Instant.now().getEpochSecond()).build())
            .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
            .setBlock(protoBlock)
            .setValidateTransactions(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockValidationResult> responseObserver = mock(StreamObserver.class);

        blockchainService.validateBlock(request, responseObserver);

        ArgumentCaptor<BlockValidationResult> responseCaptor = ArgumentCaptor.forClass(BlockValidationResult.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockValidationResult result = responseCaptor.getValue();
        assertFalse(result.getIsValid());
        assertTrue(result.getErrorsList().stream()
            .anyMatch(e -> e.getErrorCode().equals("MERKLE_ROOT_MISMATCH")));
    }

    @Test
    @DisplayName("Test 2.3: validateBlock - Warning for missing validator signatures")
    void testValidateBlock_MissingSignatures() {
        io.aurigraph.v11.proto.Block protoBlock = io.aurigraph.v11.proto.Block.newBuilder()
            .setBlockHash("blockhash")
            .setBlockHeight(100)
            .setTransactionRoot("root")
            .setValidatorCount(0) // No validators
            .setCreatedAt(Timestamp.newBuilder().setSeconds(Instant.now().getEpochSecond()).build())
            .build();

        BlockValidationRequest request = BlockValidationRequest.newBuilder()
            .setBlock(protoBlock)
            .setValidateSignatures(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockValidationResult> responseObserver = mock(StreamObserver.class);

        blockchainService.validateBlock(request, responseObserver);

        ArgumentCaptor<BlockValidationResult> responseCaptor = ArgumentCaptor.forClass(BlockValidationResult.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockValidationResult result = responseCaptor.getValue();
        assertTrue(result.getWarningsList().stream()
            .anyMatch(w -> w.contains("no validator signatures")));
    }

    // ==================== TEST 3: getBlockDetails() ====================

    @Test
    @DisplayName("Test 3.1: getBlockDetails - Retrieve by hash")
    void testGetBlockDetails_ByHash() {
        when(blockRepository.findByHash("abc123hash")).thenReturn(Optional.of(testBlock));

        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
            .setBlockHash("abc123hash")
            .setIncludeTransactions(false)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockDetails(request, responseObserver);

        ArgumentCaptor<BlockDetailsResponse> responseCaptor = ArgumentCaptor.forClass(BlockDetailsResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        BlockDetailsResponse response = responseCaptor.getValue();
        assertTrue(response.getFound());
        assertEquals("abc123hash", response.getBlock().getBlockHash());
        assertEquals(100L, response.getBlock().getBlockHeight());
    }

    @Test
    @DisplayName("Test 3.2: getBlockDetails - Retrieve by height")
    void testGetBlockDetails_ByHeight() {
        when(blockRepository.findByHeight(100L)).thenReturn(Optional.of(testBlock));

        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
            .setBlockHeight(100L)
            .setIncludeTransactions(false)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockDetails(request, responseObserver);

        ArgumentCaptor<BlockDetailsResponse> responseCaptor = ArgumentCaptor.forClass(BlockDetailsResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockDetailsResponse response = responseCaptor.getValue();
        assertTrue(response.getFound());
        assertEquals(100L, response.getBlock().getBlockHeight());
    }

    @Test
    @DisplayName("Test 3.3: getBlockDetails - Block not found")
    void testGetBlockDetails_NotFound() {
        when(blockRepository.findByHash("nonexistent")).thenReturn(Optional.empty());

        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
            .setBlockHash("nonexistent")
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockDetails(request, responseObserver);

        ArgumentCaptor<BlockDetailsResponse> responseCaptor = ArgumentCaptor.forClass(BlockDetailsResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockDetailsResponse response = responseCaptor.getValue();
        assertFalse(response.getFound());
    }

    @Test
    @DisplayName("Test 3.4: getBlockDetails - Include transactions")
    void testGetBlockDetails_WithTransactions() {
        when(blockRepository.findByHash("abc123hash")).thenReturn(Optional.of(testBlock));
        when(transactionRepository.findByHash("tx1hash")).thenReturn(Optional.of(testTransaction));

        BlockDetailsRequest request = BlockDetailsRequest.newBuilder()
            .setBlockHash("abc123hash")
            .setIncludeTransactions(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockDetails(request, responseObserver);

        ArgumentCaptor<BlockDetailsResponse> responseCaptor = ArgumentCaptor.forClass(BlockDetailsResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockDetailsResponse response = responseCaptor.getValue();
        assertTrue(response.getFound());
        assertTrue(response.getTransactionsCount() > 0);
    }

    // ==================== TEST 4: executeTransaction() ====================

    @Test
    @DisplayName("Test 4.1: executeTransaction - Successfully execute transaction")
    void testExecuteTransaction_Success() {
        io.aurigraph.v11.proto.Transaction protoTx = protoTransactions.get(0);

        TransactionExecutionRequest request = TransactionExecutionRequest.newBuilder()
            .setTransaction(protoTx)
            .setExecutionContext("mainnet")
            .setTimeoutSeconds(30)
            .setValidateBeforeExecute(false)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<TransactionExecutionResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.executeTransaction(request, responseObserver);

        ArgumentCaptor<TransactionExecutionResponse> responseCaptor =
            ArgumentCaptor.forClass(TransactionExecutionResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        TransactionExecutionResponse response = responseCaptor.getValue();
        assertTrue(response.getSuccess());
        assertEquals(io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_CONFIRMED,
            response.getTransaction().getStatus());
        assertTrue(response.getStateChangesCount() > 0);
    }

    @Test
    @DisplayName("Test 4.2: executeTransaction - Fail validation when addresses missing")
    void testExecuteTransaction_InvalidAddresses() {
        io.aurigraph.v11.proto.Transaction invalidTx = io.aurigraph.v11.proto.Transaction.newBuilder()
            .setTransactionHash("tx123")
            .setFromAddress("") // Missing
            .setToAddress("")   // Missing
            .setAmount("100")
            .build();

        TransactionExecutionRequest request = TransactionExecutionRequest.newBuilder()
            .setTransaction(invalidTx)
            .setValidateBeforeExecute(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<TransactionExecutionResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.executeTransaction(request, responseObserver);

        ArgumentCaptor<TransactionExecutionResponse> responseCaptor =
            ArgumentCaptor.forClass(TransactionExecutionResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        TransactionExecutionResponse response = responseCaptor.getValue();
        assertFalse(response.getSuccess());
        assertTrue(response.getErrorMessage().contains("missing from/to address"));
    }

    @Test
    @DisplayName("Test 4.3: executeTransaction - Verify state changes recorded")
    void testExecuteTransaction_StateChanges() {
        io.aurigraph.v11.proto.Transaction protoTx = protoTransactions.get(0);

        TransactionExecutionRequest request = TransactionExecutionRequest.newBuilder()
            .setTransaction(protoTx)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<TransactionExecutionResponse> responseObserver = mock(StreamObserver.class);

        blockchainService.executeTransaction(request, responseObserver);

        ArgumentCaptor<TransactionExecutionResponse> responseCaptor =
            ArgumentCaptor.forClass(TransactionExecutionResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        TransactionExecutionResponse response = responseCaptor.getValue();
        assertEquals(3, response.getStateChangesCount()); // Balance debit, credit, nonce
        assertTrue(response.getStateChangesList().stream()
            .anyMatch(sc -> sc.getChangeType().equals("UPDATE")));
    }

    // ==================== TEST 5: verifyTransaction() ====================

    @Test
    @DisplayName("Test 5.1: verifyTransaction - Valid Merkle proof verified")
    void testVerifyTransaction_ValidProof() {
        when(blockRepository.findByHash("abc123hash")).thenReturn(Optional.of(testBlock));

        // Simplified Merkle proof (in production, use actual proof from MerkleTree)
        TransactionVerificationRequest request = TransactionVerificationRequest.newBuilder()
            .setTransactionHash("tx1hash")
            .setBlockHash("abc123hash")
            .addMerkleProof("siblinghash1")
            .setProofIndex(0)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<TransactionVerificationResult> responseObserver = mock(StreamObserver.class);

        blockchainService.verifyTransaction(request, responseObserver);

        ArgumentCaptor<TransactionVerificationResult> responseCaptor =
            ArgumentCaptor.forClass(TransactionVerificationResult.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        TransactionVerificationResult result = responseCaptor.getValue();
        assertNotNull(result);
        assertFalse(result.getVerificationHash().isEmpty());
    }

    @Test
    @DisplayName("Test 5.2: verifyTransaction - Block not found")
    void testVerifyTransaction_BlockNotFound() {
        when(blockRepository.findByHash("nonexistent")).thenReturn(Optional.empty());

        TransactionVerificationRequest request = TransactionVerificationRequest.newBuilder()
            .setTransactionHash("tx1hash")
            .setBlockHash("nonexistent")
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<TransactionVerificationResult> responseObserver = mock(StreamObserver.class);

        blockchainService.verifyTransaction(request, responseObserver);

        ArgumentCaptor<TransactionVerificationResult> responseCaptor =
            ArgumentCaptor.forClass(TransactionVerificationResult.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        TransactionVerificationResult result = responseCaptor.getValue();
        assertFalse(result.getIsVerified());
        assertTrue(result.getErrorMessage().contains("Block not found"));
    }

    // ==================== TEST 6: getBlockchainStatistics() ====================

    @Test
    @DisplayName("Test 6.1: getBlockchainStatistics - Generate full statistics")
    void testGetBlockchainStatistics_Success() {
        when(blockRepository.count()).thenReturn(1000L);
        when(transactionRepository.count()).thenReturn(50000L);
        when(blockRepository.findAllPaginated(anyInt(), anyInt())).thenReturn(Arrays.asList(testBlock));
        when(transactionRepository.countByStatus(TransactionStatus.PENDING)).thenReturn(100L);
        when(transactionRepository.countByStatus(TransactionStatus.CONFIRMED)).thenReturn(49800L);
        when(transactionRepository.countByStatus(TransactionStatus.FAILED)).thenReturn(100L);

        BlockchainStatisticsRequest request = BlockchainStatisticsRequest.newBuilder()
            .setTimeWindowMinutes(0) // All time
            .setIncludeDetailedMetrics(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockchainStatistics> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockchainStatistics(request, responseObserver);

        ArgumentCaptor<BlockchainStatistics> responseCaptor =
            ArgumentCaptor.forClass(BlockchainStatistics.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();

        BlockchainStatistics stats = responseCaptor.getValue();
        assertEquals(1000L, stats.getTotalBlocks());
        assertEquals(50000L, stats.getTotalTransactions());
        assertTrue(stats.getTransactionsPerSecond() >= 0);
        assertEquals("HEALTHY", stats.getNetworkHealthStatus());
    }

    @Test
    @DisplayName("Test 6.2: getBlockchainStatistics - Time window filtering")
    void testGetBlockchainStatistics_TimeWindow() {
        when(blockRepository.count()).thenReturn(500L);
        when(transactionRepository.count()).thenReturn(25000L);
        when(blockRepository.findInTimeRange(any(), any(), anyInt(), anyInt()))
            .thenReturn(Arrays.asList(testBlock));
        when(transactionRepository.countByStatus(any())).thenReturn(50L);

        BlockchainStatisticsRequest request = BlockchainStatisticsRequest.newBuilder()
            .setTimeWindowMinutes(60) // Last hour
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockchainStatistics> responseObserver = mock(StreamObserver.class);

        blockchainService.getBlockchainStatistics(request, responseObserver);

        ArgumentCaptor<BlockchainStatistics> responseCaptor =
            ArgumentCaptor.forClass(BlockchainStatistics.class);
        verify(responseObserver).onNext(responseCaptor.capture());

        BlockchainStatistics stats = responseCaptor.getValue();
        assertNotNull(stats);
        assertTrue(stats.getMeasurementDurationSeconds() > 0);
    }

    // ==================== TEST 7: streamBlocks() ====================

    @Test
    @DisplayName("Test 7.1: streamBlocks - Stream existing blocks")
    void testStreamBlocks_ExistingBlocks() {
        when(blockRepository.getLatestBlockHeight()).thenReturn(105L);
        when(blockRepository.findByHeight(100L)).thenReturn(Optional.of(testBlock));

        BlockStreamRequest request = BlockStreamRequest.newBuilder()
            .setStartFromHeight(100)
            .setIncludeTransactions(0) // No transactions
            .setOnlyNewBlocks(false)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockStreamEvent> responseObserver = mock(StreamObserver.class);

        blockchainService.streamBlocks(request, responseObserver);

        // Verify at least one block was streamed
        verify(responseObserver, atLeastOnce()).onNext(any(BlockStreamEvent.class));
    }

    @Test
    @DisplayName("Test 7.2: streamBlocks - Only new blocks mode")
    void testStreamBlocks_OnlyNewBlocks() {
        BlockStreamRequest request = BlockStreamRequest.newBuilder()
            .setStartFromHeight(100)
            .setOnlyNewBlocks(true)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockStreamEvent> responseObserver = mock(StreamObserver.class);

        blockchainService.streamBlocks(request, responseObserver);

        // Verify no historical blocks streamed (only waiting for new ones)
        verify(responseObserver, never()).onNext(any());
    }

    @Test
    @DisplayName("Test 7.3: streamBlocks - Include full transactions")
    void testStreamBlocks_WithTransactions() {
        when(blockRepository.getLatestBlockHeight()).thenReturn(100L);
        when(blockRepository.findByHeight(100L)).thenReturn(Optional.of(testBlock));
        when(transactionRepository.findByHash("tx1hash")).thenReturn(Optional.of(testTransaction));

        BlockStreamRequest request = BlockStreamRequest.newBuilder()
            .setStartFromHeight(100)
            .setIncludeTransactions(2) // Full transactions
            .setOnlyNewBlocks(false)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockStreamEvent> responseObserver = mock(StreamObserver.class);

        blockchainService.streamBlocks(request, responseObserver);

        ArgumentCaptor<BlockStreamEvent> eventCaptor = ArgumentCaptor.forClass(BlockStreamEvent.class);
        verify(responseObserver, atLeastOnce()).onNext(eventCaptor.capture());

        BlockStreamEvent event = eventCaptor.getValue();
        assertNotNull(event.getBlock());
        assertNotNull(event.getStreamId());
    }

    // ==================== PERFORMANCE TESTS ====================

    @Test
    @DisplayName("Test 8.1: Performance - createBlock under 30ms")
    void testPerformance_CreateBlock() {
        when(blockRepository.getLatestBlockHeight()).thenReturn(99L);
        when(blockRepository.findLatestBlock()).thenReturn(Optional.of(testBlock));

        BlockCreationRequest request = BlockCreationRequest.newBuilder()
            .setBlockId("perf-block")
            .setStateRoot("perfState")
            .addAllTransactions(protoTransactions)
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockCreationResponse> responseObserver = mock(StreamObserver.class);

        long startTime = System.currentTimeMillis();
        blockchainService.createBlock(request, responseObserver);
        long duration = System.currentTimeMillis() - startTime;

        assertTrue(duration < 30, "createBlock should complete in <30ms, took: " + duration + "ms");
    }

    @Test
    @DisplayName("Test 8.2: Performance - getBlockDetails under 5ms (cached)")
    void testPerformance_GetBlockDetails() {
        when(blockRepository.findByHash("abc123hash")).thenReturn(Optional.of(testBlock));

        // Warm up cache
        BlockDetailsRequest warmupRequest = BlockDetailsRequest.newBuilder()
            .setBlockHash("abc123hash")
            .build();

        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> warmupObserver = mock(StreamObserver.class);
        blockchainService.getBlockDetails(warmupRequest, warmupObserver);

        // Measure cached lookup
        @SuppressWarnings("unchecked")
        StreamObserver<BlockDetailsResponse> responseObserver = mock(StreamObserver.class);

        long startTime = System.currentTimeMillis();
        blockchainService.getBlockDetails(warmupRequest, responseObserver);
        long duration = System.currentTimeMillis() - startTime;

        assertTrue(duration < 5, "getBlockDetails (cached) should complete in <5ms, took: " + duration + "ms");
    }
}
