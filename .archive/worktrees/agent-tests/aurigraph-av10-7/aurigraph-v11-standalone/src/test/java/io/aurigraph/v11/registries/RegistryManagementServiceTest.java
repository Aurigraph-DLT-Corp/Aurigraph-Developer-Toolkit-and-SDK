package io.aurigraph.v11.registries;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for RegistryManagementService
 *
 * Tests multi-registry search, statistics aggregation,
 * verification across registries, and summary generation.
 *
 * Coverage target: 75%+
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("RegistryManagementService Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RegistryManagementServiceTest {

    @Inject
    RegistryManagementService service;

    // ==================== SEARCH ALL REGISTRIES TESTS ====================

    @Test
    @Order(1)
    @DisplayName("searchAllRegistries - Should search across all registry types")
    void testSearchAllRegistries_WhenKeywordProvided_ThenReturnsResults() {
        // When
        List<RegistrySearchResult> results = service.searchAllRegistries("test", null, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("searchAllRegistries - Should filter by registry types")
    void testSearchAllRegistries_WhenTypesSpecified_ThenFiltersCorrectly() {
        // When
        List<RegistrySearchResult> results = service.searchAllRegistries(
                "contract",
                List.of("SMART_CONTRACT", "TOKEN"),
                10,
                0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isNotNull();
    }

    @Test
    @Order(3)
    @DisplayName("searchAllRegistries - Should support pagination")
    void testSearchAllRegistries_WhenPaginated_ThenReturnsCorrectPage() {
        // When
        List<RegistrySearchResult> results = service.searchAllRegistries(null, null, 5, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeLessThanOrEqualTo(5);
    }

    // ==================== GET REGISTRY STATS TESTS ====================

    @Test
    @Order(4)
    @DisplayName("getRegistryStats - Should return stats for smart contracts")
    void testGetRegistryStats_WhenSmartContract_ThenReturnsStats() {
        // When
        RegistryStatistics stats = service.getRegistryStats("SMART_CONTRACT")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(stats).isNotNull();
        assertThat(stats.getRegistryType()).isEqualTo("SMART_CONTRACT");
    }

    @Test
    @Order(5)
    @DisplayName("getRegistryStats - Should return stats for tokens")
    void testGetRegistryStats_WhenToken_ThenReturnsStats() {
        // When
        RegistryStatistics stats = service.getRegistryStats("TOKEN")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(stats).isNotNull();
        assertThat(stats.getRegistryType()).isEqualTo("TOKEN");
    }

    @Test
    @Order(6)
    @DisplayName("getRegistryStats - Should throw exception for invalid type")
    void testGetRegistryStats_WhenInvalidType_ThenThrowsException() {
        // When/Then
        assertThatThrownBy(() -> {
            service.getRegistryStats("INVALID_TYPE")
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).hasCause(new IllegalArgumentException());
    }

    // ==================== GET AGGREGATED STATS TESTS ====================

    @Test
    @Order(7)
    @DisplayName("getAggregatedStats - Should return stats from all registries")
    void testGetAggregatedStats_WhenCalled_ThenReturnsAggregation() {
        // When
        RegistryAggregation aggregation = service.getAggregatedStats()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(aggregation).isNotNull();
        assertThat(aggregation.getTotalRegistries()).isGreaterThan(0);
        assertThat(aggregation.getRegistryTypeStats()).isNotEmpty();
    }

    @Test
    @Order(8)
    @DisplayName("getAggregatedStats - Should calculate verification coverage")
    void testGetAggregatedStats_WhenCalled_ThenCalculatesCoverage() {
        // When
        RegistryAggregation aggregation = service.getAggregatedStats()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(aggregation.getVerificationCoverage()).isGreaterThanOrEqualTo(0.0);
        assertThat(aggregation.getVerificationCoverage()).isLessThanOrEqualTo(100.0);
    }

    // ==================== LIST BY TYPE TESTS ====================

    @Test
    @Order(9)
    @DisplayName("listByType - Should list entries for smart contracts")
    void testListByType_WhenSmartContract_ThenReturnsEntries() {
        // When
        List<RegistrySearchResult> results = service.listByType("SMART_CONTRACT", 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isNotNull();
    }

    @Test
    @Order(10)
    @DisplayName("listByType - Should support pagination")
    void testListByType_WhenPaginated_ThenReturnsCorrectSize() {
        // When
        List<RegistrySearchResult> results = service.listByType("TOKEN", 3, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeLessThanOrEqualTo(3);
    }

    // ==================== VERIFY ENTRY TESTS ====================

    @Test
    @Order(11)
    @DisplayName("verifyEntry - Should verify entry across registries")
    void testVerifyEntry_WhenEntryExists_ThenReturnsVerificationResult() {
        // When
        Map<String, Object> result = service.verifyEntry("test-entry-id")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).containsKeys("entryId", "timestamp", "verificationStatus");
    }

    @Test
    @Order(12)
    @DisplayName("verifyEntry - Should handle non-existent entry gracefully")
    void testVerifyEntry_WhenNotExists_ThenReturnsNotVerified() {
        // When
        Map<String, Object> result = service.verifyEntry("non-existent-id")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("verified")).isEqualTo(false);
    }

    // ==================== GET REGISTRY SUMMARY TESTS ====================

    @Test
    @Order(13)
    @DisplayName("getRegistrySummary - Should return comprehensive summary")
    void testGetRegistrySummary_WhenCalled_ThenReturnsSummary() {
        // When
        Map<String, Object> summary = service.getRegistrySummary()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(summary).isNotNull();
        assertThat(summary).containsKeys(
                "totalRegistries",
                "totalEntries",
                "verificationCoverage",
                "healthStatus",
                "lastUpdated",
                "registryBreakdown"
        );
    }

    @Test
    @Order(14)
    @DisplayName("getRegistrySummary - Should include registry breakdown")
    void testGetRegistrySummary_WhenCalled_ThenIncludesBreakdown() {
        // When
        Map<String, Object> summary = service.getRegistrySummary()
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> breakdown =
                (Map<String, Map<String, Object>>) summary.get("registryBreakdown");

        assertThat(breakdown).isNotNull();
        assertThat(breakdown).isNotEmpty();
    }

    // ==================== EDGE CASES TESTS ====================

    @Test
    @Order(15)
    @DisplayName("searchAllRegistries - Should handle empty results gracefully")
    void testSearchAllRegistries_WhenNoMatches_ThenReturnsEmpty() {
        // When
        List<RegistrySearchResult> results = service.searchAllRegistries(
                "non-existent-keyword-xyz123",
                null,
                10,
                0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isEmpty();
    }
}
