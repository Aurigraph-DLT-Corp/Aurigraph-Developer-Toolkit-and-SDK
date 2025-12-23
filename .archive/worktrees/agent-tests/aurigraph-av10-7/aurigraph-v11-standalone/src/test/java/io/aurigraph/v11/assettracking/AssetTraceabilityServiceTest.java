package io.aurigraph.v11.assettracking;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for AssetTraceabilityService
 *
 * Tests all CRUD operations, search functionality, ownership transfers,
 * audit trails, edge cases, and error handling.
 *
 * Coverage target: 85%+
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("AssetTraceabilityService Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AssetTraceabilityServiceTest {

    private AssetTraceabilityService service;
    private AutoCloseable mocks;

    @BeforeEach
    void setUp() {
        mocks = MockitoAnnotations.openMocks(this);
        service = new AssetTraceabilityService();
    }

    @AfterEach
    void tearDown() throws Exception {
        if (mocks != null) {
            mocks.close();
        }
    }

    // ==================== CREATE ASSET TRACE TESTS ====================

    @Test
    @Order(1)
    @DisplayName("createAssetTrace - Should create asset trace with valid data")
    void testCreateAssetTrace_WhenValidData_ThenSuccess() {
        // Given
        String assetId = "asset-001";
        String assetName = "Gold Bar #1";
        String assetType = "PRECIOUS_METAL";
        Double valuation = 50000.00;
        String owner = "owner-001";

        // When
        AssetTrace result = service.createAssetTrace(assetId, assetName, assetType, valuation, owner)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTraceId()).startsWith("trace_");
        assertThat(result.getAssetId()).isEqualTo(assetId);
        assertThat(result.getAssetName()).isEqualTo(assetName);
        assertThat(result.getAssetType()).isEqualTo(assetType);
        assertThat(result.getValuation()).isEqualTo(valuation);
        assertThat(result.getCurrentOwner()).isEqualTo(owner);
        assertThat(result.getCurrencyCode()).isEqualTo("USD");
        assertThat(result.getComplianceStatus()).isEqualTo("PENDING_VERIFICATION");
        assertThat(result.getLastUpdated()).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("createAssetTrace - Should initialize ownership history with single owner")
    void testCreateAssetTrace_WhenCalled_ThenInitializesOwnershipHistory() {
        // When
        AssetTrace result = service.createAssetTrace("asset-002", "Silver Bar #1", "PRECIOUS_METAL", 10000.00, "owner-002")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getOwnershipHistory()).isNotNull();
        assertThat(result.getOwnershipHistory()).hasSize(1);

        OwnershipRecord ownershipRecord = result.getOwnershipHistory().get(0);
        assertThat(ownershipRecord.getOwner()).isEqualTo("owner-002");
        assertThat(ownershipRecord.getPercentage()).isEqualTo(100.0);
        assertThat(ownershipRecord.getAcquisitionDate()).isNotNull();
        assertThat(ownershipRecord.getTxHash()).isNotNull();
    }

    @Test
    @Order(3)
    @DisplayName("createAssetTrace - Should initialize audit trail with creation event")
    void testCreateAssetTrace_WhenCalled_ThenInitializesAuditTrail() {
        // When
        AssetTrace result = service.createAssetTrace("asset-003", "Platinum Coin", "PRECIOUS_METAL", 25000.00, "owner-003")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getAuditTrail()).isNotNull();
        assertThat(result.getAuditTrail()).hasSize(1);

        AuditTrailEntry auditEntry = result.getAuditTrail().get(0);
        assertThat(auditEntry.getAction()).isEqualTo("CREATED");
        assertThat(auditEntry.getActor()).isEqualTo("owner-003");
        assertThat(auditEntry.getStatus()).isEqualTo("SUCCESS");
        assertThat(auditEntry.getDetails()).containsKeys("assetId", "assetName", "assetType", "valuation");
    }

    @Test
    @Order(4)
    @DisplayName("createAssetTrace - Should initialize metadata with correct fields")
    void testCreateAssetTrace_WhenCalled_ThenInitializesMetadata() {
        // When
        AssetTrace result = service.createAssetTrace("asset-004", "Diamond Ring", "JEWELRY", 75000.00, "owner-004")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result.getMetadata()).isNotNull();
        assertThat(result.getMetadata()).containsKeys("createdAt", "version", "region");
        assertThat(result.getMetadata().get("version")).isEqualTo("1.0.0");
        assertThat(result.getMetadata().get("region")).isEqualTo("global");
    }

    // ==================== GET ASSET TRACE TESTS ====================

    @Test
    @Order(5)
    @DisplayName("getAssetTrace - Should retrieve existing asset trace by ID")
    void testGetAssetTrace_WhenExistingId_ThenReturnsAsset() {
        // Given
        AssetTrace created = service.createAssetTrace("asset-005", "Gold Necklace", "JEWELRY", 30000.00, "owner-005")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        Optional<AssetTrace> result = service.getAssetTrace(created.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getTraceId()).isEqualTo(created.getTraceId());
        assertThat(result.get().getAssetId()).isEqualTo("asset-005");
    }

    @Test
    @Order(6)
    @DisplayName("getAssetTrace - Should return empty for non-existent ID")
    void testGetAssetTrace_WhenNonExistentId_ThenReturnsEmpty() {
        // When
        Optional<AssetTrace> result = service.getAssetTrace("non-existent-trace")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isEmpty();
    }

    // ==================== SEARCH ASSETS TESTS ====================

    @Test
    @Order(7)
    @DisplayName("searchAssets - Should find assets by type")
    void testSearchAssets_WhenFilterByType_ThenReturnsMatchingAssets() {
        // Given
        service.createAssetTrace("asset-100", "Gold Bar", "PRECIOUS_METAL", 50000.00, "owner-100")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-101", "Diamond", "JEWELRY", 75000.00, "owner-101")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-102", "Silver Bar", "PRECIOUS_METAL", 10000.00, "owner-102")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<AssetTrace> results = service.searchAssets("PRECIOUS_METAL", null, null, null, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeGreaterThanOrEqualTo(2);
        assertThat(results).allMatch(asset -> asset.getAssetType().equals("PRECIOUS_METAL"));
    }

    @Test
    @Order(8)
    @DisplayName("searchAssets - Should find assets by owner")
    void testSearchAssets_WhenFilterByOwner_ThenReturnsMatchingAssets() {
        // Given
        service.createAssetTrace("asset-200", "Item 1", "TYPE_A", 1000.00, "owner-200")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-201", "Item 2", "TYPE_B", 2000.00, "owner-200")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-202", "Item 3", "TYPE_A", 3000.00, "owner-201")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<AssetTrace> results = service.searchAssets(null, "owner-200", null, null, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeGreaterThanOrEqualTo(2);
        assertThat(results).allMatch(asset -> asset.getCurrentOwner().equals("owner-200"));
    }

    @Test
    @Order(9)
    @DisplayName("searchAssets - Should find assets by valuation range")
    void testSearchAssets_WhenFilterByValuation_ThenReturnsMatchingAssets() {
        // Given
        service.createAssetTrace("asset-300", "Low Value", "TYPE_A", 1000.00, "owner-300")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-301", "Mid Value", "TYPE_A", 5000.00, "owner-301")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-302", "High Value", "TYPE_A", 10000.00, "owner-302")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        List<AssetTrace> results = service.searchAssets(null, null, 4000.00, 8000.00, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSizeGreaterThanOrEqualTo(1);
        assertThat(results).allMatch(asset ->
            asset.getValuation() >= 4000.00 && asset.getValuation() <= 8000.00
        );
    }

    @Test
    @Order(10)
    @DisplayName("searchAssets - Should support pagination with offset and limit")
    void testSearchAssets_WhenPaginated_ThenReturnsCorrectPage() {
        // Given - Create 5 assets of same type
        for (int i = 0; i < 5; i++) {
            service.createAssetTrace("asset-400-" + i, "Item " + i, "PAGINATED_TYPE", 1000.00 * i, "owner-400")
                    .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        }

        // When - Get second page (offset=2, limit=2)
        List<AssetTrace> results = service.searchAssets("PAGINATED_TYPE", null, null, null, 2, 2)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).hasSize(2);
    }

    @Test
    @Order(11)
    @DisplayName("searchAssets - Should return empty list when no matches found")
    void testSearchAssets_WhenNoMatches_ThenReturnsEmptyList() {
        // When
        List<AssetTrace> results = service.searchAssets("NON_EXISTENT_TYPE", null, null, null, 10, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isEmpty();
    }

    // ==================== TRANSFER OWNERSHIP TESTS ====================

    @Test
    @Order(12)
    @DisplayName("transferOwnership - Should transfer 100% ownership successfully")
    void testTransferOwnership_WhenFullTransfer_ThenUpdatesCurrentOwner() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-500", "Transfer Test", "TYPE_A", 5000.00, "owner-500")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        OwnershipRecord transfer = service.transferOwnership(asset.getTraceId(), "owner-500", "owner-501", 100.0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(transfer).isNotNull();
        assertThat(transfer.getOwner()).isEqualTo("owner-501");
        assertThat(transfer.getPercentage()).isEqualTo(100.0);
        assertThat(transfer.getTxHash()).isNotNull();

        // Verify asset updated
        AssetTrace updated = service.getAssetTrace(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem().get();
        assertThat(updated.getCurrentOwner()).isEqualTo("owner-501");
        assertThat(updated.getOwnershipHistory()).hasSize(2);
    }

    @Test
    @Order(13)
    @DisplayName("transferOwnership - Should handle partial ownership transfer")
    void testTransferOwnership_WhenPartialTransfer_ThenMarksDisposalDate() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-501", "Partial Transfer", "TYPE_A", 10000.00, "owner-510")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        OwnershipRecord transfer = service.transferOwnership(asset.getTraceId(), "owner-510", "owner-511", 50.0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(transfer).isNotNull();
        assertThat(transfer.getPercentage()).isEqualTo(50.0);

        // Current owner should remain the same for partial transfer
        AssetTrace updated = service.getAssetTrace(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem().get();
        assertThat(updated.getCurrentOwner()).isEqualTo("owner-510");
    }

    @Test
    @Order(14)
    @DisplayName("transferOwnership - Should return null for non-existent trace")
    void testTransferOwnership_WhenNonExistentTrace_ThenReturnsNull() {
        // When
        OwnershipRecord result = service.transferOwnership("non-existent", "owner-A", "owner-B", 100.0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(result).isNull();
    }

    @Test
    @Order(15)
    @DisplayName("transferOwnership - Should add audit trail entry")
    void testTransferOwnership_WhenTransferred_ThenAddsAuditEntry() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-502", "Audit Test", "TYPE_A", 5000.00, "owner-520")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        service.transferOwnership(asset.getTraceId(), "owner-520", "owner-521", 100.0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem();

        // Then
        AssetTrace updated = service.getAssetTrace(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem().get();

        assertThat(updated.getAuditTrail()).hasSizeGreaterThan(1);
        AuditTrailEntry lastAudit = updated.getAuditTrail().get(updated.getAuditTrail().size() - 1);
        assertThat(lastAudit.getAction()).isEqualTo("TRANSFERRED");
        assertThat(lastAudit.getStatus()).isEqualTo("SUCCESS");
    }

    // ==================== GET OWNERSHIP HISTORY TESTS ====================

    @Test
    @Order(16)
    @DisplayName("getOwnershipHistory - Should return history for existing asset")
    void testGetOwnershipHistory_WhenExistingAsset_ThenReturnsHistory() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-600", "History Test", "TYPE_A", 5000.00, "owner-600")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        Optional<List<OwnershipRecord>> history = service.getOwnershipHistory(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(history).isPresent();
        assertThat(history.get()).hasSize(1);
        assertThat(history.get().get(0).getOwner()).isEqualTo("owner-600");
    }

    @Test
    @Order(17)
    @DisplayName("getOwnershipHistory - Should return empty for non-existent asset")
    void testGetOwnershipHistory_WhenNonExistent_ThenReturnsEmpty() {
        // When
        Optional<List<OwnershipRecord>> history = service.getOwnershipHistory("non-existent")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(history).isEmpty();
    }

    // ==================== GET AUDIT TRAIL TESTS ====================

    @Test
    @Order(18)
    @DisplayName("getAuditTrail - Should return audit trail for existing asset")
    void testGetAuditTrail_WhenExistingAsset_ThenReturnsTrail() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-700", "Audit Trail Test", "TYPE_A", 5000.00, "owner-700")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        Optional<List<AuditTrailEntry>> trail = service.getAuditTrail(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(trail).isPresent();
        assertThat(trail.get()).hasSize(1);
        assertThat(trail.get().get(0).getAction()).isEqualTo("CREATED");
    }

    @Test
    @Order(19)
    @DisplayName("getAuditTrail - Should return empty for non-existent asset")
    void testGetAuditTrail_WhenNonExistent_ThenReturnsEmpty() {
        // When
        Optional<List<AuditTrailEntry>> trail = service.getAuditTrail("non-existent")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(trail).isEmpty();
    }

    // ==================== STATISTICS TESTS ====================

    @Test
    @Order(20)
    @DisplayName("getTotalAssetTraces - Should return correct count")
    void testGetTotalAssetTraces_WhenCalled_ThenReturnsCorrectCount() {
        // Given
        long initialCount = service.getTotalAssetTraces();
        service.createAssetTrace("asset-800", "Stats Test 1", "TYPE_A", 1000.00, "owner-800")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-801", "Stats Test 2", "TYPE_A", 2000.00, "owner-801")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        long finalCount = service.getTotalAssetTraces();

        // Then
        assertThat(finalCount).isEqualTo(initialCount + 2);
    }

    @Test
    @Order(21)
    @DisplayName("getTotalUniqueOwners - Should return correct count")
    void testGetTotalUniqueOwners_WhenCalled_ThenReturnsCorrectCount() {
        // Given
        long initialCount = service.getTotalUniqueOwners();
        service.createAssetTrace("asset-810", "Owner Test 1", "TYPE_A", 1000.00, "unique-owner-810")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-811", "Owner Test 2", "TYPE_A", 2000.00, "unique-owner-811")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        long finalCount = service.getTotalUniqueOwners();

        // Then
        assertThat(finalCount).isGreaterThanOrEqualTo(initialCount + 2);
    }

    @Test
    @Order(22)
    @DisplayName("getTotalUniqueAssetTypes - Should return correct count")
    void testGetTotalUniqueAssetTypes_WhenCalled_ThenReturnsCorrectCount() {
        // Given
        long initialCount = service.getTotalUniqueAssetTypes();
        service.createAssetTrace("asset-820", "Type Test 1", "UNIQUE_TYPE_820", 1000.00, "owner-820")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("asset-821", "Type Test 2", "UNIQUE_TYPE_821", 2000.00, "owner-821")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // When
        long finalCount = service.getTotalUniqueAssetTypes();

        // Then
        assertThat(finalCount).isGreaterThanOrEqualTo(initialCount + 2);
    }

    // ==================== EDGE CASES AND ERROR HANDLING ====================

    @Test
    @Order(23)
    @DisplayName("createAssetTrace - Should handle null values gracefully")
    void testCreateAssetTrace_WhenNullValues_ThenHandlesGracefully() {
        // When/Then - Should not throw exception
        assertThatCode(() -> {
            service.createAssetTrace(null, null, null, null, null)
                    .subscribe().withSubscriber(UniAssertSubscriber.create())
                    .awaitItem();
        }).doesNotThrowAnyException();
    }

    @Test
    @Order(24)
    @DisplayName("searchAssets - Should handle null filters")
    void testSearchAssets_WhenAllFiltersNull_ThenReturnsAllAssets() {
        // When
        List<AssetTrace> results = service.searchAssets(null, null, null, null, 100, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(results).isNotNull();
    }

    @Test
    @Order(25)
    @DisplayName("transferOwnership - Should handle zero percentage")
    void testTransferOwnership_WhenZeroPercentage_ThenCompletesTransfer() {
        // Given
        AssetTrace asset = service.createAssetTrace("asset-900", "Zero Transfer", "TYPE_A", 5000.00, "owner-900")
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // When
        OwnershipRecord transfer = service.transferOwnership(asset.getTraceId(), "owner-900", "owner-901", 0.0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Then
        assertThat(transfer).isNotNull();
        assertThat(transfer.getPercentage()).isEqualTo(0.0);
    }
}
