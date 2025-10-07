package io.aurigraph.v11.integration;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.hms.HMSIntegrationService;
import io.aurigraph.v11.hms.HMSIntegrationService.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for HMS (Healthcare Management System) Service
 *
 * Tests the integration of real-world asset tokenization, particularly
 * focused on healthcare assets and data management.
 *
 * Test Scenarios:
 * - Asset tokenization lifecycle
 * - Asset registry management
 * - Asset transfers
 * - Statistics and monitoring
 * - Performance under load
 * - Error handling
 *
 * Phase 3 Day 4: HMS Integration Testing
 * Target: 20 tests
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class HMSServiceIntegrationTest extends ServiceTestBase {

    private static final Logger logger = LoggerFactory.getLogger(HMSServiceIntegrationTest.class);

    @Inject
    HMSIntegrationService hmsService;

    // ==================== Service Initialization Tests ====================

    @Test
    @Order(1)
    @DisplayName("HIT-01: HMS service should be properly injected")
    void testServiceInjection() {
        assertThat(hmsService).isNotNull();
        logger.info("✓ HMS service properly injected");
    }

    @Test
    @Order(2)
    @DisplayName("HIT-02: Should provide HMS statistics")
    void testHMSStats() {
        HMSStats stats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats.totalAssets).isGreaterThanOrEqualTo(0);
        assertThat(stats.totalTransactions).isGreaterThanOrEqualTo(0);
        assertThat(stats.totalValue).isGreaterThanOrEqualTo(BigDecimal.ZERO);

        logger.info("✓ HMS stats: {} assets, {} transactions",
                   stats.totalAssets, stats.totalTransactions);
    }

    // ==================== Asset Tokenization ====================

    @Test
    @Order(3)
    @DisplayName("HIT-03: Should tokenize real-world asset")
    void testTokenizeAsset() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("location", "Building A");
        metadata.put("condition", "excellent");

        TokenizationRequest request = new TokenizationRequest(
            "medical-equipment",
            "0xOwner123",
            new BigDecimal("50000.00"),
            metadata
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(response).isNotNull();
        assertThat(response.assetId).isNotNull().startsWith("HMS-");
        assertThat(response.tokenId).isNotNull().startsWith("TOKEN-");
        assertThat(response.status).isEqualTo("SUCCESS");

        logger.info("✓ Asset tokenized: assetId={}, tokenId={}",
                   response.assetId, response.tokenId);
    }

    @ParameterizedTest
    @CsvSource({
        "medical-equipment, 50000.00",
        "real-estate, 250000.00",
        "pharmaceutical, 10000.00",
        "laboratory-sample, 5000.00"
    })
    @DisplayName("HIT-04: Should tokenize various asset types")
    void testTokenizeVariousAssetTypes(String assetType, String value) {
        TokenizationRequest request = new TokenizationRequest(
            assetType,
            "0xOwner456",
            new BigDecimal(value),
            Map.of("type", assetType)
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(response.status).isEqualTo("SUCCESS");

        logger.info("✓ Tokenized {}: value={}", assetType, value);
    }

    // ==================== Asset Retrieval ====================

    @Test
    @Order(5)
    @DisplayName("HIT-05: Should retrieve asset by ID")
    void testGetAsset() {
        // First tokenize an asset
        TokenizationRequest request = new TokenizationRequest(
            "medical-device",
            "0xOwnerGet",
            new BigDecimal("25000.00"),
            Map.of("serial", "MD-12345")
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        // Then retrieve it
        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset).isNotNull();
        assertThat(asset.assetId).isEqualTo(response.assetId);
        assertThat(asset.assetType).isEqualTo("medical-device");
        assertThat(asset.owner).isEqualTo("0xOwnerGet");
        assertThat(asset.value).isEqualByComparingTo(new BigDecimal("25000.00"));
        assertThat(asset.status).isEqualTo("ACTIVE");

        logger.info("✓ Retrieved asset: type={}, value={}",
                   asset.assetType, asset.value);
    }

    @Test
    @Order(6)
    @DisplayName("HIT-06: Should list all assets")
    void testListAssets() {
        // Tokenize a few assets
        for (int i = 0; i < 3; i++) {
            TokenizationRequest request = new TokenizationRequest(
                "test-asset-" + i,
                "0xOwnerList",
                new BigDecimal("1000.00"),
                Map.of("index", i)
            );

            hmsService.tokenizeAsset(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // List all assets
        List<RealWorldAsset> assets = hmsService.listAssets()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(assets).isNotEmpty();
        assertThat(assets.size()).isGreaterThanOrEqualTo(3);

        logger.info("✓ Listed {} assets", assets.size());
    }

    // ==================== Asset Transfer ====================

    @Test
    @Order(7)
    @DisplayName("HIT-07: Should transfer asset to new owner")
    void testTransferAsset() {
        // Tokenize an asset
        TokenizationRequest request = new TokenizationRequest(
            "property",
            "0xOriginalOwner",
            new BigDecimal("100000.00"),
            Map.of("address", "123 Main St")
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        // Transfer to new owner
        Boolean transferResult = hmsService.transferAsset(
            response.assetId,
            "0xNewOwner"
        ).await().atMost(Duration.ofSeconds(5));

        assertThat(transferResult).isTrue();

        // Verify owner changed
        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset.owner).isEqualTo("0xNewOwner");

        logger.info("✓ Asset transferred: {} -> 0xNewOwner", response.assetId);
    }

    @Test
    @Order(8)
    @DisplayName("HIT-08: Should handle transfer of non-existent asset")
    void testTransferNonExistentAsset() {
        Boolean result = hmsService.transferAsset(
            "non-existent-asset-id",
            "0xNewOwner"
        ).await().atMost(Duration.ofSeconds(5));

        assertThat(result).isFalse();

        logger.info("✓ Non-existent asset transfer correctly handled");
    }

    // ==================== Asset Metadata ====================

    @Test
    @Order(9)
    @DisplayName("HIT-09: Should preserve asset metadata")
    void testAssetMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("manufacturer", "MedCorp");
        metadata.put("model", "XR-2000");
        metadata.put("year", 2024);
        metadata.put("certified", true);

        TokenizationRequest request = new TokenizationRequest(
            "medical-imaging",
            "0xOwnerMeta",
            new BigDecimal("75000.00"),
            metadata
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset.metadata).containsKeys("manufacturer", "model", "year", "certified");
        assertThat(asset.metadata.get("manufacturer")).isEqualTo("MedCorp");
        assertThat(asset.metadata.get("year")).isEqualTo(2024);

        logger.info("✓ Asset metadata preserved: {} fields", asset.metadata.size());
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(10)
    @DisplayName("HIT-10: Should handle multiple tokenization operations efficiently")
    void testMultipleTokenizations() {
        int tokenizationCount = 20;
        long startTime = System.currentTimeMillis();
        int successCount = 0;

        for (int i = 0; i < tokenizationCount; i++) {
            TokenizationRequest request = new TokenizationRequest(
                "batch-asset-" + i,
                "0xBatchOwner",
                new BigDecimal("5000.00"),
                Map.of("batch", i)
            );

            try {
                TokenizationResponse response = hmsService.tokenizeAsset(request)
                    .await().atMost(Duration.ofSeconds(5));

                if ("SUCCESS".equals(response.status)) {
                    successCount++;
                }
            } catch (Exception e) {
                logger.debug("Tokenization {} failed", i);
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        double opsPerSecond = (successCount * 1000.0) / duration;

        logger.info("Tokenized {}/{} assets in {}ms ({} ops/sec)",
                   successCount, tokenizationCount, duration,
                   String.format("%.2f", opsPerSecond));

        assertThat(successCount).isGreaterThanOrEqualTo((int)(tokenizationCount * 0.95)); // 95%+ success
    }

    @Test
    @Order(11)
    @DisplayName("HIT-11: Should handle concurrent tokenization operations")
    void testConcurrentTokenizations() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(30);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < 30; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    TokenizationRequest request = new TokenizationRequest(
                        "concurrent-asset-" + index,
                        "0xConcurrentOwner" + index,
                        new BigDecimal("10000.00"),
                        Map.of("index", index)
                    );

                    TokenizationResponse response = hmsService.tokenizeAsset(request)
                        .await().atMost(Duration.ofSeconds(10));

                    if ("SUCCESS".equals(response.status)) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    logger.debug("Concurrent tokenization {} failed", index);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(60, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isGreaterThan(25); // 83%+ success rate

        logger.info("✓ Concurrent tokenizations: {}/30 successful", successCount.get());
    }

    // ==================== Statistics and Monitoring ====================

    @Test
    @Order(12)
    @DisplayName("HIT-12: Stats should reflect tokenization activity")
    void testStatsReflectActivity() {
        // Get initial stats
        HMSStats initialStats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        long initialCount = initialStats.totalAssets;

        // Tokenize some assets
        for (int i = 0; i < 5; i++) {
            TokenizationRequest request = new TokenizationRequest(
                "stats-test-asset",
                "0xStatsOwner",
                new BigDecimal("15000.00"),
                Map.of()
            );

            hmsService.tokenizeAsset(request)
                .await().atMost(Duration.ofSeconds(5));
        }

        // Get updated stats
        HMSStats updatedStats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(updatedStats.totalAssets).isGreaterThan(initialCount);
        assertThat(updatedStats.successfulTransactions).isGreaterThan(initialStats.successfulTransactions);

        logger.info("✓ Stats updated: {} -> {} assets",
                   initialCount, updatedStats.totalAssets);
    }

    @Test
    @Order(13)
    @DisplayName("HIT-13: Should track total asset value")
    void testTotalAssetValue() {
        HMSStats stats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats.totalValue).isGreaterThanOrEqualTo(BigDecimal.ZERO);

        logger.info("✓ Total asset value tracked: {}", stats.totalValue);
    }

    @Test
    @Order(14)
    @DisplayName("HIT-14: Should track success and failure rates")
    void testSuccessFailureTracking() {
        HMSStats stats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        long totalOps = stats.successfulTransactions + stats.failedTransactions;

        if (totalOps > 0) {
            double successRate = (stats.successfulTransactions * 100.0) / totalOps;
            assertThat(successRate).isGreaterThan(50.0); // At least 50% success

            logger.info("✓ Success rate: {}%", String.format("%.2f", successRate));
        } else {
            logger.info("✓ No transactions yet, rates cannot be calculated");
        }
    }

    // ==================== Error Handling ====================

    @Test
    @Order(15)
    @DisplayName("HIT-15: Should handle retrieval of non-existent asset")
    void testGetNonExistentAsset() {
        assertThatThrownBy(() ->
            hmsService.getAsset("non-existent-id")
                .await().atMost(Duration.ofSeconds(5))
        ).hasMessageContaining("not found");

        logger.info("✓ Non-existent asset query handled correctly");
    }

    // ==================== Value Management ====================

    @Test
    @Order(16)
    @DisplayName("HIT-16: Should handle various asset values")
    void testVariousAssetValues() {
        BigDecimal[] testValues = {
            new BigDecimal("100.00"),
            new BigDecimal("1000.50"),
            new BigDecimal("100000.99"),
            new BigDecimal("1000000.00")
        };

        for (BigDecimal value : testValues) {
            TokenizationRequest request = new TokenizationRequest(
                "value-test-asset",
                "0xValueOwner",
                value,
                Map.of("test-value", value.toString())
            );

            TokenizationResponse response = hmsService.tokenizeAsset(request)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(response.status).isEqualTo("SUCCESS");

            RealWorldAsset asset = hmsService.getAsset(response.assetId)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(asset.value).isEqualByComparingTo(value);
        }

        logger.info("✓ Various asset values handled correctly");
    }

    // ==================== Asset Lifecycle ====================

    @Test
    @Order(17)
    @DisplayName("HIT-17: Should maintain asset timestamps")
    void testAssetTimestamps() {
        TokenizationRequest request = new TokenizationRequest(
            "timestamp-test",
            "0xTimestampOwner",
            new BigDecimal("20000.00"),
            Map.of()
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(response.timestamp).isNotNull();

        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset.createdAt).isNotNull();
        assertThat(asset.createdAt).isBeforeOrEqualTo(java.time.Instant.now());

        logger.info("✓ Asset timestamps maintained");
    }

    @Test
    @Order(18)
    @DisplayName("HIT-18: Should maintain asset status")
    void testAssetStatus() {
        TokenizationRequest request = new TokenizationRequest(
            "status-test",
            "0xStatusOwner",
            new BigDecimal("30000.00"),
            Map.of()
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset.status).isEqualTo("ACTIVE");

        logger.info("✓ Asset status maintained: {}", asset.status);
    }

    // ==================== Advanced Scenarios ====================

    @Test
    @Order(19)
    @DisplayName("HIT-19: Should handle asset with complex metadata")
    void testComplexMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("department", "Cardiology");
        metadata.put("building", "North Wing");
        metadata.put("floor", 3);
        metadata.put("room", "301-A");
        metadata.put("serial_number", "MED-XR-2024-001");
        metadata.put("warranty_expires", "2027-12-31");
        metadata.put("calibrated", true);
        metadata.put("certifications", java.util.List.of("FDA", "CE", "ISO"));

        TokenizationRequest request = new TokenizationRequest(
            "complex-medical-device",
            "0xComplexOwner",
            new BigDecimal("125000.00"),
            metadata
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(response.status).isEqualTo("SUCCESS");

        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(asset.metadata).hasSize(8);
        assertThat(asset.metadata.get("department")).isEqualTo("Cardiology");

        logger.info("✓ Complex metadata handled: {} fields", asset.metadata.size());
    }

    @Test
    @Order(20)
    @DisplayName("HIT-20: Should validate end-to-end HMS workflow")
    void testEndToEndHMSWorkflow() {
        logger.info("Starting end-to-end HMS workflow test");

        // Step 1: Check initial stats
        HMSStats initialStats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        assertThat(initialStats).isNotNull();
        logger.info("Step 1: Initial stats retrieved");

        // Step 2: Tokenize an asset
        Map<String, Object> metadata = Map.of(
            "type", "MRI Machine",
            "location", "Radiology Dept",
            "purchase_date", "2024-01-15"
        );

        TokenizationRequest request = new TokenizationRequest(
            "mri-machine",
            "0xHospitalA",
            new BigDecimal("500000.00"),
            metadata
        );

        TokenizationResponse response = hmsService.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(5));
        assertThat(response.status).isEqualTo("SUCCESS");
        logger.info("Step 2: Asset tokenized: {}", response.assetId);

        // Step 3: Retrieve and verify asset
        RealWorldAsset asset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));
        assertThat(asset.assetId).isEqualTo(response.assetId);
        assertThat(asset.value).isEqualByComparingTo(new BigDecimal("500000.00"));
        logger.info("Step 3: Asset verified");

        // Step 4: Transfer asset
        Boolean transferResult = hmsService.transferAsset(
            response.assetId,
            "0xHospitalB"
        ).await().atMost(Duration.ofSeconds(5));
        assertThat(transferResult).isTrue();
        logger.info("Step 4: Asset transferred");

        // Step 5: Verify transfer
        RealWorldAsset transferredAsset = hmsService.getAsset(response.assetId)
            .await().atMost(Duration.ofSeconds(5));
        assertThat(transferredAsset.owner).isEqualTo("0xHospitalB");
        logger.info("Step 5: Transfer verified");

        // Step 6: Check updated stats
        HMSStats finalStats = hmsService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        assertThat(finalStats.totalAssets).isGreaterThan(initialStats.totalAssets);
        logger.info("Step 6: Final stats validated");

        logger.info("✓ End-to-end HMS workflow completed successfully");
    }
}
