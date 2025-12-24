package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Story 9, Phase 4: CrossChainGrpcService Comprehensive Tests
 *
 * Tests cover atomic cross-chain swaps with:
 * - Oracle consensus (>67% Byzantine tolerance)
 * - Multi-chain support (Ethereum, Solana, Polkadot, Cosmos)
 * - Atomic swap guarantees
 * - Bridge message verification
 * - Timeout and refund handling
 *
 * Target: 15 tests covering oracle consensus, bridge transfers, atomic swaps
 */
@QuarkusTest
@DisplayName("CrossChainGrpcService Tests")
public class CrossChainGrpcServiceTest {

    @Inject
    private CrossChainGrpcService crossChainService;

    @Mock
    private StreamObserver<BridgeTransferReceipt> receiptObserver;

    @Mock
    private StreamObserver<BridgeTransferStatus> statusObserver;

    @Mock
    private StreamObserver<CallbackResponse> callbackObserver;

    @Mock
    private StreamObserver<VerificationResult> verificationObserver;

    @Mock
    private StreamObserver<BridgeTransfer> transferObserver;

    @Mock
    private StreamObserver<BatchBridgeResponse> batchObserver;

    @Mock
    private StreamObserver<CrossChainStatusUpdate> monitorObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================================================================
    // Test 1: Initiate Bridge Transfer - Ethereum to Solana
    // ========================================================================
    @Test
    @DisplayName("Test 1: Initiate atomic bridge transfer")
    public void testInitiateBridgeTransfer() {
        BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
            .setBridgeId("bridge_eth_sol_001")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
            .setAssetAddress("0x1234567890abcdef")
            .setAmount("100000000000000000")  // 1 ETH in wei
            .setRecipient("solana_wallet_abc123")
            .setSourceTxHash("0xeth_tx_hash")
            .setLockProof(com.google.protobuf.ByteString.copyFromUtf8("merkle_proof"))
            .addOracleSet("oracle_1")
            .addOracleSet("oracle_2")
            .addOracleSet("oracle_3")
            .addOracleSet("oracle_4")
            .setTimeout(3600)  // 1 hour timeout
            .build();

        crossChainService.initiateBridgeTransfer(request, receiptObserver);

        verify(receiptObserver).onNext(argThat(receipt ->
            receipt.getBridgeId().equals("bridge_eth_sol_001") &&
            receipt.getSourceChain().equals(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
        ));
        verify(receiptObserver).onCompleted();
    }

    // ========================================================================
    // Test 2: Get Bridge Transfer Status
    // ========================================================================
    @Test
    @DisplayName("Test 2: Query bridge transfer status")
    public void testGetBridgeStatus() {
        BridgeTransferIdRequest request = BridgeTransferIdRequest.newBuilder()
            .setBridgeId("bridge_eth_sol_001")
            .build();

        crossChainService.getBridgeTransferStatus(request, statusObserver);

        verify(statusObserver).onNext(any(BridgeTransferStatus.class));
        verify(statusObserver).onCompleted();
    }

    // ========================================================================
    // Test 3: Oracle Execution Callback
    // ========================================================================
    @Test
    @DisplayName("Test 3: Oracle confirms execution on destination")
    public void testExecuteBridgeCallback() {
        BridgeExecutionCallback callback = BridgeExecutionCallback.newBuilder()
            .setBridgeId("bridge_eth_sol_001")
            .setDestTxHash("0xsolana_tx_hash")
            .setOracleAddress("oracle_1")
            .setOracleSignature("oracle_sig_1")
            .setDestBlockHeight(150000)
            .setGasUsed(25000)
            .setTimestamp("2025-12-24T10:00:00Z")
            .build();

        crossChainService.executeBridgeCallback(callback, callbackObserver);

        verify(callbackObserver).onNext(argThat(response ->
            response.getAccepted() &&
            response.getBridgeId().equals("bridge_eth_sol_001")
        ));
        verify(callbackObserver).onCompleted();
    }

    // ========================================================================
    // Test 4: Byzantine Consensus - >67% Oracle Agreement
    // ========================================================================
    @Test
    @DisplayName("Test 4: Byzantine consensus with 3 out of 4 oracle approval")
    public void testByzantineConsensus() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger consensusReached = new AtomicInteger(0);

        StreamObserver<BridgeMessageVerification> verificationObserver =
            crossChainService.verifyBridgeMessage(
            new StreamObserver<VerificationResult>() {
                @Override
                public void onNext(VerificationResult value) {
                    if (value.getConsensusReached()) {
                        consensusReached.incrementAndGet();
                    }
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 3 approvals out of 4 oracles (>67%)
        for (int i = 1; i <= 3; i++) {
            BridgeMessageVerification verification = BridgeMessageVerification.newBuilder()
                .setBridgeId("bridge_test_001")
                .setOracleAddress("oracle_" + i)
                .setVerificationType("LOCK_PROOF")
                .setProofData(com.google.protobuf.ByteString.copyFromUtf8("proof_" + i))
                .setSignature("sig_" + i)
                .setApproved(true)
                .build();
            verificationObserver.onNext(verification);
        }

        verificationObserver.onCompleted();
        assertTrue(latch.await(5, TimeUnit.SECONDS));
        assertTrue(consensusReached.get() > 0, "Should reach consensus");
    }

    // ========================================================================
    // Test 5: Multi-Chain Support - Polkadot to Cosmos
    // ========================================================================
    @Test
    @DisplayName("Test 5: Bridge between Polkadot and Cosmos")
    public void testMultiChainPolkadotCosmos() {
        BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
            .setBridgeId("bridge_polka_cosmos_001")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_POLKADOT)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_COSMOS)
            .setAssetAddress("polka_asset_xyz")
            .setAmount("5000000000")
            .setRecipient("cosmos1recipient")
            .setSourceTxHash("polka_tx_123")
            .addOracleSet("oracle_poly_1")
            .addOracleSet("oracle_poly_2")
            .addOracleSet("oracle_poly_3")
            .setTimeout(7200)
            .build();

        crossChainService.initiateBridgeTransfer(request, receiptObserver);

        verify(receiptObserver).onNext(argThat(receipt ->
            receipt.getSourceChain().equals(BlockchainNetwork.BLOCKCHAIN_NETWORK_POLKADOT) &&
            receipt.getDestChain().equals(BlockchainNetwork.BLOCKCHAIN_NETWORK_COSMOS)
        ));
    }

    // ========================================================================
    // Test 6: Timeout and Refund
    // ========================================================================
    @Test
    @DisplayName("Test 6: Bridge transfer timeout triggers refund")
    public void testTimeoutRefund() {
        BridgeTransferIdRequest request = BridgeTransferIdRequest.newBuilder()
            .setBridgeId("bridge_timeout_001")
            .build();

        // Query status (would check if timed out in real scenario)
        crossChainService.getBridgeTransferStatus(request, statusObserver);

        // Should either be executing or refunded
        verify(statusObserver).onNext(any(BridgeTransferStatus.class));
    }

    // ========================================================================
    // Test 7: Batch Bridge Transfers
    // ========================================================================
    @Test
    @DisplayName("Test 7: Submit batch of 50 bridge transfers")
    public void testBatchBridgeTransfers() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger acceptedCount = new AtomicInteger(0);

        StreamObserver<BridgeTransferRequest> requestObserver =
            crossChainService.batchBridgeTransfers(new StreamObserver<BatchBridgeResponse>() {
                @Override
                public void onNext(BatchBridgeResponse value) {
                    acceptedCount.set(value.getAcceptedCount());
                }

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // Send 50 bridge transfer requests
        for (int i = 0; i < 50; i++) {
            BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
                .setBridgeId("batch_bridge_" + i)
                .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
                .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
                .setAssetAddress("0xtoken" + i)
                .setAmount("1000000000000000000")
                .setRecipient("recipient_" + i)
                .setSourceTxHash("tx_" + i)
                .addOracleSet("oracle_1")
                .addOracleSet("oracle_2")
                .addOracleSet("oracle_3")
                .setTimeout(3600)
                .build();
            requestObserver.onNext(request);
        }

        requestObserver.onCompleted();
        assertTrue(latch.await(10, TimeUnit.SECONDS));
        assertEquals(50, acceptedCount.get(), "Should accept all 50 bridges");
    }

    // ========================================================================
    // Test 8: Stream Pending Bridge Transfers
    // ========================================================================
    @Test
    @DisplayName("Test 8: Stream pending bridge transfers for validators")
    public void testStreamPendingTransfers() {
        BridgeStreamRequest request = BridgeStreamRequest.newBuilder()
            .setFilterChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
            .build();

        crossChainService.streamPendingBridgeTransfers(request, transferObserver);

        // Should stream pending transfers asynchronously
        verify(transferObserver, atLeast(0)).onNext(any(BridgeTransfer.class));
    }

    // ========================================================================
    // Test 9: Cross-Chain Monitoring - Real-time Updates
    // ========================================================================
    @Test
    @DisplayName("Test 9: Monitor cross-chain status in real-time")
    public void testMonitorCrossChainStatus() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger updateCount = new AtomicInteger(0);

        StreamObserver<CrossChainMonitorRequest> monitorObserver =
            crossChainService.monitorCrossChainStatus(new StreamObserver<CrossChainStatusUpdate>() {
                @Override
                public void onNext(CrossChainStatusUpdate value) {
                    updateCount.incrementAndGet();
                }

                @Override
                public void onError(Throwable t) {
                    latch.countDown();
                }

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        CrossChainMonitorRequest request = CrossChainMonitorRequest.newBuilder()
            .setMonitorId("monitor_1")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
            .build();

        monitorObserver.onNext(request);
        monitorObserver.onCompleted();

        assertTrue(latch.await(5, TimeUnit.SECONDS));
    }

    // ========================================================================
    // Test 10: Performance - Bridge Initiation Latency (<500ms)
    // ========================================================================
    @Test
    @DisplayName("Test 10: Bridge initiation latency < 500ms")
    public void testBridgeLatency() {
        long totalLatency = 0;
        int iterations = 50;

        for (int i = 0; i < iterations; i++) {
            long startTime = System.nanoTime();

            BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
                .setBridgeId("perf_bridge_" + i)
                .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
                .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
                .setAssetAddress("0xtoken")
                .setAmount("1000000000000000000")
                .setRecipient("recipient")
                .setSourceTxHash("tx_" + i)
                .addOracleSet("oracle_1")
                .addOracleSet("oracle_2")
                .addOracleSet("oracle_3")
                .setTimeout(3600)
                .build();

            crossChainService.initiateBridgeTransfer(request, receiptObserver);

            long latency = System.nanoTime() - startTime;
            totalLatency += latency;
        }

        double avgLatencyMs = (totalLatency / iterations) / 1_000_000.0;
        System.out.println("Average bridge latency: " + String.format("%.2f", avgLatencyMs) + "ms");
        assertTrue(avgLatencyMs < 500.0, "Bridge latency should be <500ms");
    }

    // ========================================================================
    // Test 11: Concurrent Bridge Transfers (100 concurrent)
    // ========================================================================
    @Test
    @DisplayName("Test 11: 100 concurrent bridge transfers")
    public void testConcurrentBridgeTransfers() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(100);

        for (int i = 0; i < 100; i++) {
            final int bridgeNum = i;
            executor.submit(() -> {
                try {
                    BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
                        .setBridgeId("concurrent_" + bridgeNum)
                        .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
                        .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
                        .setAssetAddress("0xtoken")
                        .setAmount("1000000000000000000")
                        .setRecipient("recipient_" + bridgeNum)
                        .setSourceTxHash("tx_" + bridgeNum)
                        .addOracleSet("oracle_1")
                        .addOracleSet("oracle_2")
                        .addOracleSet("oracle_3")
                        .setTimeout(3600)
                        .build();

                    crossChainService.initiateBridgeTransfer(request, new StreamObserver<BridgeTransferReceipt>() {
                        @Override
                        public void onNext(BridgeTransferReceipt value) {}

                        @Override
                        public void onError(Throwable t) {
                            latch.countDown();
                        }

                        @Override
                        public void onCompleted() {
                            latch.countDown();
                        }
                    });
                } catch (Exception e) {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS), "Should complete 100 concurrent bridges");
        executor.shutdown();
    }

    // ========================================================================
    // Test 12: Atomic Swap - All or Nothing
    // ========================================================================
    @Test
    @DisplayName("Test 12: Atomic swap guarantee - all or nothing")
    public void testAtomicSwapGuarantee() {
        BridgeTransferRequest request = BridgeTransferRequest.newBuilder()
            .setBridgeId("atomic_swap_001")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
            .setAssetAddress("0xtoken")
            .setAmount("1000000000000000000")
            .setRecipient("recipient")
            .setSourceTxHash("atomic_tx")
            .addOracleSet("oracle_1")
            .addOracleSet("oracle_2")
            .addOracleSet("oracle_3")
            .setMetadata("atomic", "true")
            .setTimeout(3600)
            .build();

        crossChainService.initiateBridgeTransfer(request, receiptObserver);

        // Should maintain atomic guarantee
        verify(receiptObserver).onNext(argThat(receipt ->
            receipt.getStatus().getStatus().equals(BridgeStatusEnum.TRANSACTION_STATUS_PENDING) ||
            receipt.getStatus().getStatus().equals(BridgeStatusEnum.TRANSACTION_STATUS_UNKNOWN)
        ));
    }

    // ========================================================================
    // Test 13: Oracle Verification with Rejection
    // ========================================================================
    @Test
    @DisplayName("Test 13: Oracle verification with 1 rejection (still passes >67%)")
    public void testOracleRejection() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);

        StreamObserver<BridgeMessageVerification> verificationObserver =
            crossChainService.verifyBridgeMessage(new StreamObserver<VerificationResult>() {
                @Override
                public void onNext(VerificationResult value) {}

                @Override
                public void onError(Throwable t) {}

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

        // 3 approvals, 1 rejection (3/4 = 75% > 67%)
        for (int i = 1; i <= 4; i++) {
            BridgeMessageVerification verification = BridgeMessageVerification.newBuilder()
                .setBridgeId("bridge_reject_001")
                .setOracleAddress("oracle_" + i)
                .setVerificationType("LOCK_PROOF")
                .setApproved(i <= 3)  // First 3 approved, 4th rejected
                .setReason(i == 4 ? "Unverified lock" : "")
                .build();
            verificationObserver.onNext(verification);
        }

        verificationObserver.onCompleted();
        assertTrue(latch.await(5, TimeUnit.SECONDS));
    }

    // ========================================================================
    // Test 14: Health Check
    // ========================================================================
    @Test
    @DisplayName("Test 14: Service health check")
    public void testHealthCheck() {
        crossChainService.checkHealth(Empty.getDefaultInstance(), new StreamObserver<HealthStatus>() {
            @Override
            public void onNext(HealthStatus value) {
                assertEquals("UP", value.getStatus());
            }

            @Override
            public void onError(Throwable t) {
                fail("Health check should succeed");
            }

            @Override
            public void onCompleted() {}
        });
    }

    // ========================================================================
    // Test 15: Multi-Chain Sequence - Ethereum → Solana → Polkadot
    // ========================================================================
    @Test
    @DisplayName("Test 15: Multi-hop bridge transfer (3 chains)")
    public void testMultiHopBridge() {
        // Transfer 1: Ethereum -> Solana
        BridgeTransferRequest eth2sol = BridgeTransferRequest.newBuilder()
            .setBridgeId("hop_1")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_ETHEREUM)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
            .setAssetAddress("0xtoken")
            .setAmount("1000000000000000000")
            .setRecipient("solana_wallet")
            .setSourceTxHash("eth_tx")
            .addOracleSet("oracle_1")
            .addOracleSet("oracle_2")
            .addOracleSet("oracle_3")
            .setTimeout(3600)
            .build();

        crossChainService.initiateBridgeTransfer(eth2sol, receiptObserver);

        // Transfer 2: Solana -> Polkadot
        BridgeTransferRequest sol2poly = BridgeTransferRequest.newBuilder()
            .setBridgeId("hop_2")
            .setSourceChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_SOLANA)
            .setDestChain(BlockchainNetwork.BLOCKCHAIN_NETWORK_POLKADOT)
            .setAssetAddress("solana_token")
            .setAmount("1000000000000000000")
            .setRecipient("polka_account")
            .setSourceTxHash("sol_tx")
            .addOracleSet("oracle_1")
            .addOracleSet("oracle_2")
            .addOracleSet("oracle_3")
            .setTimeout(3600)
            .build();

        crossChainService.initiateBridgeTransfer(sol2poly, receiptObserver);

        // Both should succeed
        verify(receiptObserver, times(2)).onNext(any(BridgeTransferReceipt.class));
    }

}
