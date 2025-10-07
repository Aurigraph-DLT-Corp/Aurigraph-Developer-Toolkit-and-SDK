package io.aurigraph.v11.unit;

import io.aurigraph.v11.hms.HMSIntegrationService;
import io.aurigraph.v11.hms.HMSIntegrationService.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for HMSIntegrationService
 *
 * Simplified integration-style tests for HMS (Healthcare Management System) integration
 * and real-world asset tokenization.
 *
 * @version 3.10.1 (Phase 4 Day 3-4 - Fixed)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class HMSIntegrationServiceTest {

    @Inject
    HMSIntegrationService hmsService;

    // ==================== SERVICE INJECTION ====================

    @Test
    @Order(1)
    @DisplayName("UT-HMS-01: Should inject HMSIntegrationService")
    void testServiceInjection() {
        assertThat(hmsService).isNotNull();
    }

    // ==================== STATISTICS ====================

    @Test
    @Order(2)
    @DisplayName("UT-HMS-02: Should get HMS statistics")
    void testGetStats() {
        assertThatNoException().isThrownBy(() -> {
            HMSStats stats = hmsService.getStats()
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(stats).isNotNull();
            assertThat(stats.totalAssets).isNotNegative();
            assertThat(stats.totalTransactions).isNotNegative();
            assertThat(stats.totalValue).isNotNull();
        });
    }

    // ==================== ASSET TOKENIZATION ====================

    @Test
    @Order(3)
    @DisplayName("UT-HMS-03: Should tokenize asset")
    void testTokenizeAsset() {
        // Arrange
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("location", "Test Location");
        metadata.put("description", "Test asset");

        TokenizationRequest request = new TokenizationRequest(
                "RealEstate",
                "0xTestOwner",
                new BigDecimal("100000.00"),
                metadata
        );

        // Act & Assert
        assertThatNoException().isThrownBy(() -> {
            TokenizationResponse response = hmsService.tokenizeAsset(request)
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(response).isNotNull();
            assertThat(response.assetId).isNotNull();
            assertThat(response.tokenId).isNotNull();
            assertThat(response.status).isEqualTo("SUCCESS");
            assertThat(response.timestamp).isNotNull();
        });
    }

    // ==================== ASSET RETRIEVAL ====================

    @Test
    @Order(4)
    @DisplayName("UT-HMS-04: Should list assets")
    void testListAssets() {
        assertThatNoException().isThrownBy(() -> {
            List<RealWorldAsset> assets = hmsService.listAssets()
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(assets).isNotNull();
        });
    }

    // ==================== ASSET VALIDATION ====================

    @Test
    @Order(5)
    @DisplayName("UT-HMS-05: Should validate non-existent asset")
    void testValidateNonExistentAsset() {
        assertThatNoException().isThrownBy(() -> {
            Boolean isValid = hmsService.validateAsset("non-existent-asset")
                    .await().atMost(Duration.ofSeconds(5));

            assertThat(isValid).isFalse();
        });
    }

    // ==================== VERIFICATION ====================

    @Test
    @Order(6)
    @DisplayName("UT-HMS-06: Should verify service is operational")
    void testServiceOperational() {
        assertThat(hmsService).isNotNull();

        // Verify we can call getStats without errors
        assertThatNoException().isThrownBy(() -> {
            hmsService.getStats().await().atMost(Duration.ofSeconds(5));
        });
    }
}
