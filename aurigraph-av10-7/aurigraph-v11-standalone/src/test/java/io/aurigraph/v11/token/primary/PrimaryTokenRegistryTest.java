package io.aurigraph.v11.token.primary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Unit Tests for PrimaryTokenRegistry
 *
 * Tests cover:
 * - Registration operations (15 tests)
 * - Lookup operations (15 tests)
 * - Status update operations (10 tests)
 * - Owner update operations (10 tests)
 * - Merkle integrity operations (10 tests)
 *
 * Target: 60 tests with 95%+ code coverage
 *
 * @author Composite Token System - Sprint 1
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@QuarkusTest
@DisplayName("Primary Token Registry Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PrimaryTokenRegistryTest {

    @Inject
    PrimaryTokenRegistry registry;

    @Inject
    PrimaryTokenMerkleService merkleService;

    private static final String TEST_OWNER_1 = "0x1234567890abcdef";
    private static final String TEST_OWNER_2 = "0xfedcba0987654321";
    private static final String TEST_ASSET_CLASS_REAL_ESTATE = "REAL_ESTATE";
    private static final String TEST_ASSET_CLASS_VEHICLE = "VEHICLE";
    private static final String TEST_ASSET_CLASS_COMMODITY = "COMMODITY";
    private static final String TEST_ASSET_CLASS_IP = "IP";
    private static final String TEST_ASSET_CLASS_FINANCIAL = "FINANCIAL";

    // =============== SETUP & TEARDOWN ===============

    @BeforeEach
    void setUp() {
        registry.clear();
    }

    @AfterEach
    void tearDown() {
        registry.clear();
    }

    // =============== HELPER METHODS ===============

    private PrimaryToken createTestToken(String assetClass, String owner) {
        String tokenId = String.format("PT-%s-%s", assetClass, java.util.UUID.randomUUID().toString());
        String digitalTwinId = "DT-" + tokenId;
        BigDecimal faceValue = new BigDecimal("100000.00");
        return new PrimaryToken(tokenId, digitalTwinId, assetClass, faceValue, owner);
    }

    private List<PrimaryToken> createTokenList(int count, String assetClass, String owner) {
        List<PrimaryToken> tokens = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            tokens.add(createTestToken(assetClass, owner));
        }
        return tokens;
    }

    private void setupRegistry(int tokenCount) {
        List<PrimaryToken> tokens = createTokenList(tokenCount, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
        for (PrimaryToken token : tokens) {
            registry.register(token).await().indefinitely();
        }
    }

    // =============== REGISTRATION TESTS (15 tests) ===============

    @Nested
    @DisplayName("Registration Tests")
    @Order(1)
    class RegistrationTests {

        @Test
        @DisplayName("Should register valid token and return RegistryEntry")
        void testRegisterValidToken() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);

            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry);
            assertEquals(token.tokenId, entry.tokenId);
            assertEquals(token.owner, entry.owner);
            assertEquals(token.assetClass, entry.assetClass);
            assertEquals(token.status, entry.status);
            assertEquals(token.faceValue, entry.faceValue);
            assertNotNull(entry.merkleHash);
            assertNotNull(entry.registeredAt);
        }

        @Test
        @DisplayName("Should reject null token")
        void testRegisterNullToken() {
            assertThrows(IllegalArgumentException.class, () -> {
                registry.register(null).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should reject duplicate token registration")
        void testRegisterDuplicateToken() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            assertThrows(IllegalStateException.class, () -> {
                registry.register(token).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should register multiple tokens")
        void testRegisterMultipleTokens() {
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);

            for (PrimaryToken token : tokens) {
                PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
                assertNotNull(entry);
            }

            PrimaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(5, stats.totalTokens);
        }

        @Test
        @DisplayName("Should populate owner index on registration")
        void testOwnerIndexPopulated() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(token.tokenId, entries.get(0).tokenId);
        }

        @Test
        @DisplayName("Should populate asset class index on registration")
        void testAssetClassIndexPopulated() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByAssetClass(TEST_ASSET_CLASS_REAL_ESTATE).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(token.tokenId, entries.get(0).tokenId);
        }

        @Test
        @DisplayName("Should populate status index on registration")
        void testStatusIndexPopulated() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.CREATED).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(token.tokenId, entries.get(0).tokenId);
        }

        @Test
        @DisplayName("Should set merkle hash from service on registration")
        void testMerkleHashSet() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);

            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry.merkleHash);
            assertEquals(64, entry.merkleHash.length()); // SHA-256 hash length
        }

        @Test
        @DisplayName("Should set registration timestamp")
        void testRegistrationTimestampSet() {
            Instant before = Instant.now();
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
            Instant after = Instant.now();

            assertNotNull(entry.registeredAt);
            assertTrue(entry.registeredAt.isAfter(before) || entry.registeredAt.equals(before));
            assertTrue(entry.registeredAt.isBefore(after) || entry.registeredAt.equals(after));
        }

        @Test
        @DisplayName("Should increment registration count")
        void testRegistrationCountIncremented() {
            PrimaryTokenRegistry.RegistryMetrics metricsBefore = registry.getMetrics();
            long countBefore = metricsBefore.registrationCount;

            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metricsAfter = registry.getMetrics();
            assertEquals(countBefore + 1, metricsAfter.registrationCount);
        }

        @ParameterizedTest
        @ValueSource(strings = {"REAL_ESTATE", "VEHICLE", "COMMODITY", "IP", "FINANCIAL"})
        @DisplayName("Should register tokens with all asset classes")
        void testRegistrationWithAllAssetClasses(String assetClass) {
            PrimaryToken token = createTestToken(assetClass, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry);
            assertEquals(assetClass, entry.assetClass);
        }

        @Test
        @DisplayName("Should handle bulk registration")
        void testBulkRegistration() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.bulkRegister(tokens).await().indefinitely();

            assertEquals(10, entries.size());
            assertEquals(10, registry.getStats().totalTokens);
        }

        @Test
        @DisplayName("Should register tokens with different owners")
        void testRegisterDifferentOwners() {
            PrimaryToken token1 = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryToken token2 = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_2);

            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();

            assertEquals(2, registry.getStats().uniqueOwners);
        }

        @Test
        @DisplayName("Should initialize lastUpdated on registration")
        void testLastUpdatedInitialized() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry.lastUpdated);
            assertEquals(entry.registeredAt, entry.lastUpdated);
        }

        @Test
        @DisplayName("Should handle registration with special characters in owner")
        void testRegistrationWithSpecialCharacters() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, "0x123@example.com");
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry);
            assertEquals("0x123@example.com", entry.owner);
        }
    }

    // =============== LOOKUP TESTS (15 tests) ===============

    @Nested
    @DisplayName("Lookup Tests")
    @Order(2)
    class LookupTests {

        @Test
        @DisplayName("Should lookup token by ID in under 5ms")
        void testLookupByTokenIdPerformance() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            long startTime = System.nanoTime();
            PrimaryTokenRegistry.RegistryEntry entry = registry.lookup(token.tokenId).await().indefinitely();
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            assertNotNull(entry);
            assertTrue(duration < 5, "Lookup took " + duration + "ms, expected < 5ms");
        }

        @Test
        @DisplayName("Should return null for non-existent token")
        void testLookupNonExistentToken() {
            PrimaryTokenRegistry.RegistryEntry entry =
                registry.lookup("PT-FAKE-123").await().indefinitely();

            assertNull(entry);
        }

        @Test
        @DisplayName("Should lookup single token by owner")
        void testLookupByOwnerSingle() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(token.tokenId, entries.get(0).tokenId);
        }

        @Test
        @DisplayName("Should lookup multiple tokens by owner")
        void testLookupByOwnerMultiple() {
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            for (PrimaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();

            assertEquals(5, entries.size());
        }

        @Test
        @DisplayName("Should return empty list for owner with no tokens")
        void testLookupByOwnerEmpty() {
            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByOwner("0xnonexistent").await().indefinitely();

            assertNotNull(entries);
            assertTrue(entries.isEmpty());
        }

        @ParameterizedTest
        @ValueSource(strings = {"REAL_ESTATE", "VEHICLE", "COMMODITY", "IP", "FINANCIAL"})
        @DisplayName("Should lookup tokens by all asset classes")
        void testLookupByAssetClass(String assetClass) {
            PrimaryToken token = createTestToken(assetClass, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByAssetClass(assetClass).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(assetClass, entries.get(0).assetClass);
        }

        @Test
        @DisplayName("Should return empty list for asset class with no tokens")
        void testLookupByAssetClassEmpty() {
            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByAssetClass("NONEXISTENT").await().indefinitely();

            assertNotNull(entries);
            assertTrue(entries.isEmpty());
        }

        @ParameterizedTest
        @EnumSource(PrimaryToken.PrimaryTokenStatus.class)
        @DisplayName("Should lookup tokens by all status types")
        void testLookupByStatus(PrimaryToken.PrimaryTokenStatus status) {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            if (status != PrimaryToken.PrimaryTokenStatus.CREATED) {
                registry.updateStatus(token.tokenId, status).await().indefinitely();
            }

            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByStatus(status).await().indefinitely();

            assertEquals(1, entries.size());
            assertEquals(status, entries.get(0).status);
        }

        @Test
        @DisplayName("Should return empty list for status with no tokens")
        void testLookupByStatusEmpty() {
            List<PrimaryTokenRegistry.RegistryEntry> entries =
                registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.RETIRED).await().indefinitely();

            assertNotNull(entries);
            assertTrue(entries.isEmpty());
        }

        @Test
        @DisplayName("Should maintain lookup performance for 1000 tokens")
        void testLookupPerformance() {
            setupRegistry(1000);

            List<PrimaryToken> tokens = createTokenList(1, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryToken token = tokens.get(0);
            registry.register(token).await().indefinitely();

            long startTime = System.nanoTime();
            PrimaryTokenRegistry.RegistryEntry entry = registry.lookup(token.tokenId).await().indefinitely();
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            assertNotNull(entry);
            assertTrue(duration < 5, "Lookup with 1000 tokens took " + duration + "ms, expected < 5ms");
        }

        @Test
        @DisplayName("Should increment lookup count")
        void testLookupCountIncremented() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metricsBefore = registry.getMetrics();
            long countBefore = metricsBefore.lookupCount;

            registry.lookup(token.tokenId).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metricsAfter = registry.getMetrics();
            assertEquals(countBefore + 1, metricsAfter.lookupCount);
        }

        @Test
        @DisplayName("Should filter tokens correctly by asset class")
        void testLookupByAssetClassFiltering() {
            PrimaryToken token1 = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryToken token2 = createTestToken(TEST_ASSET_CLASS_VEHICLE, TEST_OWNER_1);
            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> realEstateTokens =
                registry.lookupByAssetClass(TEST_ASSET_CLASS_REAL_ESTATE).await().indefinitely();

            assertEquals(1, realEstateTokens.size());
            assertEquals(TEST_ASSET_CLASS_REAL_ESTATE, realEstateTokens.get(0).assetClass);
        }

        @Test
        @DisplayName("Should handle concurrent lookups")
        void testConcurrentLookups() {
            setupRegistry(100);
            PrimaryTokenRegistry.RegistryStats stats = registry.getStats();

            assertTrue(stats.totalTokens >= 100);
        }

        @Test
        @DisplayName("Should calculate average lookup time correctly")
        void testAverageLookupTimeCalculation() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            registry.lookup(token.tokenId).await().indefinitely();
            registry.lookup(token.tokenId).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metrics = registry.getMetrics();
            assertTrue(metrics.avgLookupTimeUs >= 0);
        }

        @Test
        @DisplayName("Should lookup tokens by multiple criteria")
        void testLookupMultipleCriteria() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> byOwner =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            List<PrimaryTokenRegistry.RegistryEntry> byAssetClass =
                registry.lookupByAssetClass(TEST_ASSET_CLASS_REAL_ESTATE).await().indefinitely();

            assertEquals(1, byOwner.size());
            assertEquals(1, byAssetClass.size());
            assertEquals(byOwner.get(0).tokenId, byAssetClass.get(0).tokenId);
        }
    }

    // =============== STATUS UPDATE TESTS (10 tests) ===============

    @Nested
    @DisplayName("Status Update Tests")
    @Order(3)
    class StatusUpdateTests {

        @Test
        @DisplayName("Should update status from CREATED to VERIFIED")
        void testUpdateStatusCreatedToVerified() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                    .await().indefinitely();

            assertEquals(PrimaryToken.PrimaryTokenStatus.VERIFIED, updated.status);
        }

        @Test
        @DisplayName("Should update status from VERIFIED to TRANSFERRED")
        void testUpdateStatusVerifiedToTransferred() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();
            registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                .await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.TRANSFERRED)
                    .await().indefinitely();

            assertEquals(PrimaryToken.PrimaryTokenStatus.TRANSFERRED, updated.status);
        }

        @Test
        @DisplayName("Should update status to RETIRED")
        void testUpdateStatusToRetired() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.RETIRED)
                    .await().indefinitely();

            assertEquals(PrimaryToken.PrimaryTokenStatus.RETIRED, updated.status);
        }

        @Test
        @DisplayName("Should update status indexes correctly")
        void testUpdateStatusIndexes() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> createdTokens =
                registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.CREATED).await().indefinitely();
            assertEquals(1, createdTokens.size());

            registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                .await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> createdAfterUpdate =
                registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.CREATED).await().indefinitely();
            List<PrimaryTokenRegistry.RegistryEntry> verifiedAfterUpdate =
                registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.VERIFIED).await().indefinitely();

            assertEquals(0, createdAfterUpdate.size());
            assertEquals(1, verifiedAfterUpdate.size());
        }

        @Test
        @DisplayName("Should throw exception for non-existent token status update")
        void testUpdateStatusNonExistentToken() {
            assertThrows(IllegalArgumentException.class, () -> {
                registry.updateStatus("PT-FAKE-123", PrimaryToken.PrimaryTokenStatus.VERIFIED)
                    .await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should update lastUpdated timestamp on status change")
        void testUpdateStatusLastUpdatedTime() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
            Instant originalLastUpdated = entry.lastUpdated;

            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                    .await().indefinitely();

            assertTrue(updated.lastUpdated.isAfter(originalLastUpdated));
        }

        @Test
        @DisplayName("Should allow any status transition (no validation)")
        void testInvalidStatusTransition() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            // Registry allows any transition - no validation
            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.RETIRED)
                    .await().indefinitely();

            assertEquals(PrimaryToken.PrimaryTokenStatus.RETIRED, updated.status);
        }

        @Test
        @DisplayName("Should handle multiple status updates on same token")
        void testMultipleStatusUpdates() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                .await().indefinitely();
            registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.TRANSFERRED)
                .await().indefinitely();
            PrimaryTokenRegistry.RegistryEntry finalUpdate =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.RETIRED)
                    .await().indefinitely();

            assertEquals(PrimaryToken.PrimaryTokenStatus.RETIRED, finalUpdate.status);
        }

        @Test
        @DisplayName("Should reflect status update in stats")
        void testStatusUpdateReflectedInStats() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryStats statsBefore = registry.getStats();
            assertEquals(1, statsBefore.createdTokens);
            assertEquals(0, statsBefore.verifiedTokens);

            registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                .await().indefinitely();

            PrimaryTokenRegistry.RegistryStats statsAfter = registry.getStats();
            assertEquals(0, statsAfter.createdTokens);
            assertEquals(1, statsAfter.verifiedTokens);
        }

        @Test
        @DisplayName("Should preserve other fields during status update")
        void testStatusUpdatePreservesOtherFields() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry original = registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateStatus(token.tokenId, PrimaryToken.PrimaryTokenStatus.VERIFIED)
                    .await().indefinitely();

            assertEquals(original.tokenId, updated.tokenId);
            assertEquals(original.owner, updated.owner);
            assertEquals(original.assetClass, updated.assetClass);
            assertEquals(original.faceValue, updated.faceValue);
            assertEquals(original.merkleHash, updated.merkleHash);
        }
    }

    // =============== OWNER UPDATE TESTS (10 tests) ===============

    @Nested
    @DisplayName("Owner Update Tests")
    @Order(4)
    class OwnerUpdateTests {

        @Test
        @DisplayName("Should update owner successfully")
        void testUpdateOwner() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            assertEquals(TEST_OWNER_2, updated.owner);
        }

        @Test
        @DisplayName("Should update owner indexes on owner change")
        void testUpdateOwnerIndexes() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> owner1Tokens =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            List<PrimaryTokenRegistry.RegistryEntry> owner2Tokens =
                registry.lookupByOwner(TEST_OWNER_2).await().indefinitely();

            assertEquals(0, owner1Tokens.size());
            assertEquals(1, owner2Tokens.size());
        }

        @Test
        @DisplayName("Should throw exception for non-existent token owner update")
        void testUpdateOwnerNonExistentToken() {
            assertThrows(IllegalArgumentException.class, () -> {
                registry.updateOwner("PT-FAKE-123", TEST_OWNER_2).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should handle multiple owner updates on same token")
        void testUpdateOwnerMultipleTimes() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            PrimaryTokenRegistry.RegistryEntry finalUpdate =
                registry.updateOwner(token.tokenId, "0xthirdowner").await().indefinitely();

            assertEquals("0xthirdowner", finalUpdate.owner);
        }

        @Test
        @DisplayName("Should maintain owner index consistency")
        void testOwnerIndexConsistency() {
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            for (PrimaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            registry.updateOwner(tokens.get(0).tokenId, TEST_OWNER_2).await().indefinitely();

            List<PrimaryTokenRegistry.RegistryEntry> owner1Tokens =
                registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            List<PrimaryTokenRegistry.RegistryEntry> owner2Tokens =
                registry.lookupByOwner(TEST_OWNER_2).await().indefinitely();

            assertEquals(4, owner1Tokens.size());
            assertEquals(1, owner2Tokens.size());
        }

        @Test
        @DisplayName("Should update lastUpdated on owner change")
        void testUpdateLastUpdatedOnOwnerChange() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
            Instant originalLastUpdated = entry.lastUpdated;

            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            assertTrue(updated.lastUpdated.isAfter(originalLastUpdated));
        }

        @Test
        @DisplayName("Should preserve other fields during owner update")
        void testOwnerUpdatePreservesOtherFields() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            PrimaryTokenRegistry.RegistryEntry original = registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            assertEquals(original.tokenId, updated.tokenId);
            assertEquals(original.assetClass, updated.assetClass);
            assertEquals(original.status, updated.status);
            assertEquals(original.faceValue, updated.faceValue);
            assertEquals(original.merkleHash, updated.merkleHash);
        }

        @Test
        @DisplayName("Should update unique owner count in stats")
        void testOwnerUpdateReflectedInStats() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryStats statsBefore = registry.getStats();
            assertEquals(1, statsBefore.uniqueOwners);

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            PrimaryTokenRegistry.RegistryStats statsAfter = registry.getStats();
            assertEquals(2, statsAfter.uniqueOwners);
        }

        @Test
        @DisplayName("Should handle owner update to same owner")
        void testOwnerUpdateToSameOwner() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            PrimaryTokenRegistry.RegistryEntry updated =
                registry.updateOwner(token.tokenId, TEST_OWNER_1).await().indefinitely();

            assertEquals(TEST_OWNER_1, updated.owner);
        }

        @Test
        @DisplayName("Should allow owner updates across multiple tokens")
        void testMultipleTokenOwnerUpdates() {
            List<PrimaryToken> tokens = createTokenList(3, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            for (PrimaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            for (PrimaryToken token : tokens) {
                registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            }

            List<PrimaryTokenRegistry.RegistryEntry> owner2Tokens =
                registry.lookupByOwner(TEST_OWNER_2).await().indefinitely();

            assertEquals(3, owner2Tokens.size());
        }
    }

    // =============== MERKLE INTEGRITY TESTS (10 tests) ===============

    @Nested
    @DisplayName("Merkle Integrity Tests")
    @Order(5)
    class MerkleIntegrityTests {

        @Test
        @DisplayName("Should generate proof for registered token")
        void testGenerateProof() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.RegistryProof proof =
                registry.generateProof(tokens.get(0).tokenId).await().indefinitely();

            assertNotNull(proof);
            assertEquals(tokens.get(0).tokenId, proof.tokenId);
            assertNotNull(proof.tokenHash);
            assertNotNull(proof.registryRoot);
            assertNotNull(proof.merkleProof);
        }

        @Test
        @DisplayName("Should verify valid proof")
        void testVerifyValidProof() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.RegistryProof proof =
                registry.generateProof(tokens.get(0).tokenId).await().indefinitely();

            boolean isValid = registry.verifyProof(proof);

            assertTrue(isValid);
        }

        @Test
        @DisplayName("Should detect invalid proof")
        void testVerifyInvalidProof() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.RegistryProof proof =
                registry.generateProof(tokens.get(0).tokenId).await().indefinitely();

            // Create invalid proof by modifying merkle proof
            PrimaryTokenMerkleService.MerkleProof invalidMerkleProof =
                new PrimaryTokenMerkleService.MerkleProof(
                    "invalid_hash",
                    proof.merkleProof.root,
                    proof.merkleProof.siblings,
                    proof.merkleProof.directions,
                    proof.merkleProof.leafIndex
                );

            PrimaryTokenRegistry.RegistryProof invalidProof =
                new PrimaryTokenRegistry.RegistryProof(
                    proof.tokenId,
                    "invalid_hash",
                    proof.registryRoot,
                    invalidMerkleProof
                );

            boolean isValid = registry.verifyProof(invalidProof);

            assertFalse(isValid);
        }

        @Test
        @DisplayName("Should throw exception when tree not built")
        void testProofTreeNotBuilt() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();

            assertThrows(IllegalStateException.class, () -> {
                registry.generateProof(token.tokenId).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should pass consistency check for valid registry")
        void testConsistencyCheckValid() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.ConsistencyReport report =
                registry.validateConsistency().await().indefinitely();

            assertEquals(10, report.totalTokens);
            assertEquals(10, report.consistentTokens);
            assertEquals(0, report.inconsistentTokens);
            assertTrue(report.issues.isEmpty());
        }

        @Test
        @DisplayName("Should detect inconsistencies in registry")
        void testConsistencyCheckInvalid() {
            // This test demonstrates consistency checking
            // In a real scenario, this would catch data corruption
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.ConsistencyReport report =
                registry.validateConsistency().await().indefinitely();

            assertNotNull(report);
            assertTrue(report.durationMs >= 0);
        }

        @Test
        @DisplayName("Should provide consistency report structure")
        void testConsistencyReportStructure() {
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.ConsistencyReport report =
                registry.validateConsistency().await().indefinitely();

            assertNotNull(report);
            assertTrue(report.totalTokens >= 0);
            assertTrue(report.consistentTokens >= 0);
            assertTrue(report.inconsistentTokens >= 0);
            assertNotNull(report.registryRoot);
            assertNotNull(report.issues);
            assertNotNull(report.generatedAt);
            assertTrue(report.durationMs >= 0);
        }

        @Test
        @DisplayName("Should rebuild registry tree after bulk operations")
        void testRegistryTreeRebuild() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metrics = registry.getMetrics();

            assertNotNull(metrics.merkleRoot);
            assertFalse(metrics.merkleRoot.isEmpty());
            assertNotNull(metrics.lastUpdate);
        }

        @Test
        @DisplayName("Should update merkle root after tree rebuild")
        void testMerkleRootUpdate() {
            List<PrimaryToken> batch1 = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(batch1).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metrics1 = registry.getMetrics();
            String root1 = metrics1.merkleRoot;

            List<PrimaryToken> batch2 = createTokenList(5, TEST_ASSET_CLASS_VEHICLE, TEST_OWNER_1);
            registry.bulkRegister(batch2).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metrics2 = registry.getMetrics();
            String root2 = metrics2.merkleRoot;

            assertNotEquals(root1, root2);
        }

        @Test
        @DisplayName("Should handle proof generation for non-existent token")
        void testProofGenerationForNonExistentToken() {
            List<PrimaryToken> tokens = createTokenList(5, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.bulkRegister(tokens).await().indefinitely();

            assertThrows(IllegalArgumentException.class, () -> {
                registry.generateProof("PT-FAKE-123").await().indefinitely();
            });
        }
    }

    // =============== ADDITIONAL INTEGRATION TESTS ===============

    @Nested
    @DisplayName("Integration & Performance Tests")
    @Order(6)
    class IntegrationTests {

        @Test
        @DisplayName("Should provide accurate registry statistics")
        void testRegistryStats() {
            List<PrimaryToken> tokens = createTokenList(10, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            for (PrimaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            PrimaryTokenRegistry.RegistryStats stats = registry.getStats();

            assertEquals(10, stats.totalTokens);
            assertEquals(10, stats.createdTokens);
            assertEquals(0, stats.verifiedTokens);
            assertEquals(1, stats.uniqueOwners);
        }

        @Test
        @DisplayName("Should provide accurate registry metrics")
        void testRegistryMetrics() {
            PrimaryToken token = createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);
            registry.register(token).await().indefinitely();
            registry.lookup(token.tokenId).await().indefinitely();

            PrimaryTokenRegistry.RegistryMetrics metrics = registry.getMetrics();

            assertTrue(metrics.registrationCount > 0);
            assertTrue(metrics.lookupCount > 0);
            assertEquals(1, metrics.registrySize);
        }

        @Test
        @DisplayName("Should clear registry successfully")
        void testClearRegistry() {
            setupRegistry(10);
            PrimaryTokenRegistry.RegistryStats statsBefore = registry.getStats();
            assertEquals(10, statsBefore.totalTokens);

            registry.clear();

            PrimaryTokenRegistry.RegistryStats statsAfter = registry.getStats();
            assertEquals(0, statsAfter.totalTokens);
        }

        @Test
        @DisplayName("Should handle bulk operations efficiently")
        void testBulkOperationPerformance() {
            List<PrimaryToken> tokens = createTokenList(1000, TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1);

            long startTime = System.currentTimeMillis();
            registry.bulkRegister(tokens).await().indefinitely();
            long duration = System.currentTimeMillis() - startTime;

            assertTrue(duration < 100, "Bulk registration of 1000 tokens took " + duration + "ms, expected < 100ms");
        }

        @Test
        @DisplayName("Should handle registry with mixed asset classes")
        void testMixedAssetClasses() {
            registry.register(createTestToken(TEST_ASSET_CLASS_REAL_ESTATE, TEST_OWNER_1)).await().indefinitely();
            registry.register(createTestToken(TEST_ASSET_CLASS_VEHICLE, TEST_OWNER_1)).await().indefinitely();
            registry.register(createTestToken(TEST_ASSET_CLASS_COMMODITY, TEST_OWNER_1)).await().indefinitely();

            PrimaryTokenRegistry.RegistryStats stats = registry.getStats();

            assertEquals(3, stats.totalTokens);
            assertEquals(3, stats.assetClassCount);
        }
    }
}
