package io.aurigraph.platform;

import io.aurigraph.v10.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test suite for Aurigraph Platform Service
 * Validates core functionality and performance
 */
@QuarkusTest
class AurigraphPlatformServiceTest {

    @Inject
    AurigraphPlatformService platformService;

    @Test
    void testHealthCheck() {
        // Given
        HealthRequest request = HealthRequest.newBuilder().build();

        // When
        var response = platformService.getHealth(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertEquals("HEALTHY", response.getStatus());
        assertEquals("11.0.0-java-quarkus-graalvm", response.getVersion());
        assertTrue(response.getUptimeSeconds() >= 0);
        assertTrue(response.getComponentsMap().containsKey("grpc"));
        assertTrue(response.getComponentsMap().containsKey("quarkus"));
        assertTrue(response.getComponentsMap().containsKey("graalvm"));
        assertEquals("active", response.getComponentsMap().get("grpc"));
        assertEquals("native", response.getComponentsMap().get("quarkus"));
    }

    @Test
    void testGetMetrics() {
        // Given
        MetricsRequest request = MetricsRequest.newBuilder()
            .addMetricNames("total_requests")
            .addMetricNames("total_transactions")
            .build();

        // When
        var response = platformService.getMetrics(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertTrue(response.getMetricsMap().containsKey("total_requests"));
        assertTrue(response.getMetricsMap().containsKey("total_transactions"));
        assertTrue(response.getMetricsMap().containsKey("uptime_seconds"));
        assertTrue(response.getMetricsMap().containsKey("memory_mb"));
    }

    @Test
    void testTransactionSubmission() {
        // Given
        Transaction transaction = Transaction.newBuilder()
            .setId("test_tx_" + System.currentTimeMillis())
            .setFrom("0x1234567890abcdef")
            .setTo("0xfedcba0987654321")
            .setAmount(100.0)
            .setNonce(1)
            .setGasPrice(20.0)
            .setGasLimit(21000)
            .setType("TRANSFER")
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("test_signature"))
            .build();

        // When
        var response = platformService.submitTransaction(transaction)
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertEquals(transaction.getId(), response.getTransactionId());
        assertEquals("CONFIRMED", response.getStatus());
        assertTrue(response.getBlockNumber() > 0);
        assertTrue(response.getGasUsed() > 0);
        assertEquals("Transaction processed via Quarkus/GraalVM", response.getMessage());
    }

    @Test
    void testBatchTransactionSubmission() {
        // Given
        Transaction tx1 = Transaction.newBuilder()
            .setId("batch_tx_1_" + System.currentTimeMillis())
            .setFrom("0x1111111111111111")
            .setTo("0x2222222222222222")
            .setAmount(50.0)
            .setNonce(1)
            .setGasPrice(20.0)
            .setGasLimit(21000)
            .setType("TRANSFER")
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("signature1"))
            .build();

        Transaction tx2 = Transaction.newBuilder()
            .setId("batch_tx_2_" + System.currentTimeMillis())
            .setFrom("0x3333333333333333")
            .setTo("0x4444444444444444")
            .setAmount(75.0)
            .setNonce(1)
            .setGasPrice(20.0)
            .setGasLimit(21000)
            .setType("TRANSFER")
            .setSignature(com.google.protobuf.ByteString.copyFromUtf8("signature2"))
            .build();

        BatchTransactionRequest request = BatchTransactionRequest.newBuilder()
            .addTransactions(tx1)
            .addTransactions(tx2)
            .setAtomic(true)
            .build();

        // When
        var response = platformService.batchSubmitTransactions(request)
            .await().atMost(Duration.ofSeconds(10));

        // Then
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals(2, response.getResultsCount());
        assertNotNull(response.getBatchId());
        assertTrue(response.getBatchId().startsWith("batch_"));
        
        // Verify individual transaction results
        for (TransactionResponse txResponse : response.getResultsList()) {
            assertEquals("CONFIRMED", txResponse.getStatus());
            assertTrue(txResponse.getGasUsed() > 0);
        }
    }

    @Test
    void testNodeRegistration() {
        // Given
        NodeRegistration registration = NodeRegistration.newBuilder()
            .setNodeId("test_node_" + System.currentTimeMillis())
            .setNodeType("VALIDATOR")
            .setAddress("192.168.1.100")
            .setPort(8080)
            .setPublicKey("test_public_key")
            .addCapabilities("CONSENSUS")
            .addCapabilities("VALIDATION")
            .build();

        // When
        var response = platformService.registerNode(registration)
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals(registration.getNodeId(), response.getNodeId());
        assertEquals("ACTIVE", response.getAssignedRole());
        assertTrue(response.getMessage().contains("Quarkus/GraalVM"));
    }

    @Test
    void testConsensusState() {
        // Given
        ConsensusStateRequest request = ConsensusStateRequest.newBuilder().build();

        // When
        var response = platformService.getConsensusState(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertNotNull(response);
        assertTrue(response.getCurrentRound() > 0);
        assertNotNull(response.getCurrentLeader());
        assertTrue(response.getActiveValidatorsCount() > 0);
        assertTrue(response.getTotalStake() > 0);
        assertNotNull(response.getPhase());
    }

    @Test
    void testPerformanceMetrics() {
        // Submit multiple transactions to test performance
        long startTime = System.currentTimeMillis();
        
        // Submit 10 transactions concurrently
        var futures = java.util.stream.IntStream.range(0, 10)
            .mapToObj(i -> {
                Transaction tx = Transaction.newBuilder()
                    .setId("perf_test_" + i + "_" + System.currentTimeMillis())
                    .setFrom("0xperf" + i)
                    .setTo("0xtest" + i)
                    .setAmount(10.0 + i)
                    .setNonce(i)
                    .setGasPrice(20.0)
                    .setGasLimit(21000)
                    .setType("TRANSFER")
                    .setSignature(com.google.protobuf.ByteString.copyFromUtf8("perf_sig_" + i))
                    .build();
                
                return platformService.submitTransaction(tx);
            })
            .toList();

        // Wait for all transactions to complete
        for (var future : futures) {
            var response = future.await().atMost(Duration.ofSeconds(10));
            assertNotNull(response);
            assertEquals("CONFIRMED", response.getStatus());
        }

        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;

        // Verify performance (should complete 10 transactions in under 1 second)
        assertTrue(totalTime < 1000, "10 transactions should complete in under 1 second, took: " + totalTime + "ms");
        
        // Calculate approximate TPS
        double tps = (10.0 / totalTime) * 1000;
        System.out.println("Approximate TPS for this test: " + tps);
        
        // Should achieve high TPS (this is just a basic test)
        assertTrue(tps > 50, "Should achieve >50 TPS in test environment, got: " + tps);
    }
}