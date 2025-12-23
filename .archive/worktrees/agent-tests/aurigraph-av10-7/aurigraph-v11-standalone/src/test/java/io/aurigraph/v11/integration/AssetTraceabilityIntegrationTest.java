package io.aurigraph.v11.integration;

import io.aurigraph.v11.assettracking.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for Asset Traceability workflows
 *
 * Tests end-to-end workflows including asset creation, ownership transfers,
 * audit trail verification, and history tracking.
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@QuarkusTest
@DisplayName("Asset Traceability Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AssetTraceabilityIntegrationTest {

    private AssetTraceabilityService service;

    @BeforeEach
    void setUp() {
        service = new AssetTraceabilityService();
    }

    @Test
    @Order(1)
    @DisplayName("E2E: Create asset → Transfer ownership → Verify history → Audit trail")
    void testCompleteAssetLifecycle() {
        // Step 1: Create asset
        AssetTrace asset = service.createAssetTrace(
                "integration-asset-001",
                "Gold Bar Integration Test",
                "PRECIOUS_METAL",
                100000.00,
                "initial-owner"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(asset).isNotNull();
        assertThat(asset.getCurrentOwner()).isEqualTo("initial-owner");

        // Step 2: Transfer ownership 100%
        OwnershipRecord transfer1 = service.transferOwnership(
                asset.getTraceId(),
                "initial-owner",
                "second-owner",
                100.0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(transfer1.getOwner()).isEqualTo("second-owner");

        // Step 3: Transfer ownership again
        OwnershipRecord transfer2 = service.transferOwnership(
                asset.getTraceId(),
                "second-owner",
                "third-owner",
                100.0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(transfer2.getOwner()).isEqualTo("third-owner");

        // Step 4: Verify ownership history
        Optional<List<OwnershipRecord>> history = service.getOwnershipHistory(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(history).isPresent();
        assertThat(history.get()).hasSize(3);  // Initial + 2 transfers
        assertThat(history.get().get(0).getOwner()).isEqualTo("initial-owner");
        assertThat(history.get().get(1).getOwner()).isEqualTo("second-owner");
        assertThat(history.get().get(2).getOwner()).isEqualTo("third-owner");

        // Step 5: Verify audit trail
        Optional<List<AuditTrailEntry>> auditTrail = service.getAuditTrail(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(auditTrail).isPresent();
        assertThat(auditTrail.get()).hasSize(3);  // CREATED + 2 TRANSFERRED
        assertThat(auditTrail.get()).extracting(AuditTrailEntry::getAction)
                .containsExactly("CREATED", "TRANSFERRED", "TRANSFERRED");

        // Step 6: Verify current state
        Optional<AssetTrace> finalState = service.getAssetTrace(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(finalState).isPresent();
        assertThat(finalState.get().getCurrentOwner()).isEqualTo("third-owner");
    }

    @Test
    @Order(2)
    @DisplayName("E2E: Create multiple assets → Search by filters → Verify results")
    void testMultiAssetSearchWorkflow() {
        // Step 1: Create diverse portfolio
        service.createAssetTrace("portfolio-gold-1", "Gold Bar 1", "PRECIOUS_METAL", 50000.00, "investor-1")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("portfolio-gold-2", "Gold Bar 2", "PRECIOUS_METAL", 75000.00, "investor-1")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("portfolio-diamond-1", "Diamond Ring", "JEWELRY", 100000.00, "investor-2")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();
        service.createAssetTrace("portfolio-silver-1", "Silver Bar", "PRECIOUS_METAL", 10000.00, "investor-3")
                .subscribe().withSubscriber(UniAssertSubscriber.create()).awaitItem();

        // Step 2: Search by asset type
        List<AssetTrace> preciousMetals = service.searchAssets("PRECIOUS_METAL", null, null, null, 100, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(preciousMetals).hasSizeGreaterThanOrEqualTo(3);

        // Step 3: Search by owner
        List<AssetTrace> investor1Assets = service.searchAssets(null, "investor-1", null, null, 100, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(investor1Assets).hasSizeGreaterThanOrEqualTo(2);

        // Step 4: Search by valuation range
        List<AssetTrace> highValueAssets = service.searchAssets(null, null, 60000.00, 150000.00, 100, 0)
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(highValueAssets).hasSizeGreaterThanOrEqualTo(2);
        assertThat(highValueAssets).allMatch(asset ->
                asset.getValuation() >= 60000.00 && asset.getValuation() <= 150000.00
        );
    }

    @Test
    @Order(3)
    @DisplayName("E2E: Partial ownership transfer workflow")
    void testPartialOwnershipTransfer() {
        // Step 1: Create asset
        AssetTrace asset = service.createAssetTrace(
                "partial-asset-001",
                "Shared Property",
                "REAL_ESTATE",
                500000.00,
                "owner-A"
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        // Step 2: Transfer 50% to owner-B
        OwnershipRecord transfer1 = service.transferOwnership(
                asset.getTraceId(),
                "owner-A",
                "owner-B",
                50.0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(transfer1.getPercentage()).isEqualTo(50.0);

        // Step 3: Transfer 30% to owner-C
        OwnershipRecord transfer2 = service.transferOwnership(
                asset.getTraceId(),
                "owner-A",
                "owner-C",
                30.0
        ).subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(transfer2.getPercentage()).isEqualTo(30.0);

        // Step 4: Verify ownership history shows all partial transfers
        Optional<List<OwnershipRecord>> history = service.getOwnershipHistory(asset.getTraceId())
                .subscribe().withSubscriber(UniAssertSubscriber.create())
                .awaitItem()
                .getItem();

        assertThat(history).isPresent();
        assertThat(history.get()).hasSize(3);
        assertThat(history.get().stream().mapToDouble(OwnershipRecord::getPercentage).sum())
                .isEqualTo(180.0);  // 100 + 50 + 30
    }
}
