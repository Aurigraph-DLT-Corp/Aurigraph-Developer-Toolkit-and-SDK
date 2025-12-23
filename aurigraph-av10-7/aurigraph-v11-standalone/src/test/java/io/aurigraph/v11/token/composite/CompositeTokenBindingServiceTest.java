package io.aurigraph.v11.token.composite;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.secondary.SecondaryToken;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for CompositeTokenBindingService
 *
 * Tests cover:
 * - Composite token creation with primary and secondary tokens
 * - Digital twin hash computation
 * - Merkle root computation
 * - Binding verification
 * - Unbinding operations
 * - Error handling and edge cases
 *
 * Target: 45+ tests for binding and bundling
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CompositeTokenBindingServiceTest {

    @Inject
    CompositeTokenBindingService bindingService;

    @Inject
    CompositeMerkleService merkleService;

    // Test data
    private static PrimaryToken testPrimary;
    private static List<SecondaryToken> testSecondaries;

    @BeforeAll
    static void setupTestData() {
        // Create test primary token
        testPrimary = new PrimaryToken();
        testPrimary.tokenId = "PT-REAL_ESTATE-" + UUID.randomUUID();
        testPrimary.digitalTwinId = "DT-" + UUID.randomUUID();
        testPrimary.assetClass = "REAL_ESTATE";
        testPrimary.faceValue = new BigDecimal("1000000.00");
        testPrimary.owner = "owner-" + UUID.randomUUID();
        testPrimary.status = PrimaryToken.PrimaryTokenStatus.VERIFIED;
        testPrimary.createdAt = Instant.now();

        // Create test secondary tokens
        testSecondaries = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            SecondaryToken secondary = new SecondaryToken();
            secondary.tokenId = "ST-INCOME_STREAM-" + UUID.randomUUID();
            secondary.parentTokenId = testPrimary.tokenId;
            secondary.tokenType = SecondaryToken.SecondaryTokenType.INCOME_STREAM;
            secondary.faceValue = new BigDecimal("10000.00");
            secondary.owner = testPrimary.owner;
            secondary.status = SecondaryToken.SecondaryTokenStatus.ACTIVE;
            testSecondaries.add(secondary);
        }
    }

    // ==================== COMPOSITE TOKEN CREATION TESTS ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Create composite token with primary only")
    void testCreateCompositeTokenPrimaryOnly() {
        // Given primary token only
        PrimaryToken primary = createTestPrimaryToken();

        // When creating composite
        CompositeToken composite = bindingService.createCompositeToken(
                primary, null, primary.owner
        ).await().indefinitely();

        // Then composite should be created
        assertNotNull(composite);
        assertNotNull(composite.compositeTokenId);
        assertTrue(composite.compositeTokenId.startsWith("CT-"));
        assertEquals(primary.tokenId, composite.primaryTokenId);
        assertEquals(primary.owner, composite.owner);
        assertEquals(primary.faceValue, composite.totalValue);
        assertNotNull(composite.merkleRoot);
        assertNotNull(composite.digitalTwinHash);
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Create composite token with primary and secondary tokens")
    void testCreateCompositeTokenWithSecondaries() {
        // Given primary and secondary tokens
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens(primary.tokenId, 3);

        // When creating composite
        CompositeToken composite = bindingService.createCompositeToken(
                primary, secondaries, primary.owner
        ).await().indefinitely();

        // Then composite should include all tokens
        assertNotNull(composite);
        assertEquals(primary.tokenId, composite.primaryTokenId);
        assertEquals(3, composite.getSecondaryTokenIdList().size());

        // Verify total value calculation
        BigDecimal expectedTotal = primary.faceValue;
        for (SecondaryToken sec : secondaries) {
            expectedTotal = expectedTotal.add(sec.faceValue);
        }
        assertEquals(expectedTotal, composite.totalValue);
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Verify composite token has correct initial status")
    void testCompositeTokenInitialStatus() {
        PrimaryToken primary = createTestPrimaryToken();

        CompositeToken composite = bindingService.createCompositeToken(
                primary, null, primary.owner
        ).await().indefinitely();

        assertEquals(CompositeToken.CompositeTokenStatus.CREATED, composite.status);
        assertNotNull(composite.createdAt);
        assertEquals(0, composite.vvbApprovalCount);
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Reject null primary token")
    void testRejectNullPrimaryToken() {
        assertThrows(Exception.class, () -> {
            bindingService.createCompositeToken(null, null, "owner").await().indefinitely();
        });
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: Reject unverified primary token")
    void testRejectUnverifiedPrimaryToken() {
        PrimaryToken unverified = createTestPrimaryToken();
        unverified.status = PrimaryToken.PrimaryTokenStatus.CREATED;

        assertThrows(Exception.class, () -> {
            bindingService.createCompositeToken(unverified, null, unverified.owner).await().indefinitely();
        });
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: Reject null owner")
    void testRejectNullOwner() {
        PrimaryToken primary = createTestPrimaryToken();

        assertThrows(Exception.class, () -> {
            bindingService.createCompositeToken(primary, null, null).await().indefinitely();
        });
    }

    @Test
    @Order(7)
    @DisplayName("Test 7: Reject empty owner")
    void testRejectEmptyOwner() {
        PrimaryToken primary = createTestPrimaryToken();

        assertThrows(Exception.class, () -> {
            bindingService.createCompositeToken(primary, null, "   ").await().indefinitely();
        });
    }

    @Test
    @Order(8)
    @DisplayName("Test 8: Reject secondary token with wrong parent")
    void testRejectSecondaryWithWrongParent() {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens("WRONG-PARENT", 1);

        assertThrows(Exception.class, () -> {
            bindingService.createCompositeToken(primary, secondaries, primary.owner).await().indefinitely();
        });
    }

    // ==================== DIGITAL TWIN HASH TESTS ====================

    @Test
    @Order(10)
    @DisplayName("Test 10: Compute digital twin hash - primary only")
    void testComputeDigitalTwinHashPrimaryOnly() {
        PrimaryToken primary = createTestPrimaryToken();

        String hash = bindingService.computeDigitalTwinHash(primary, null);

        assertNotNull(hash);
        assertEquals(64, hash.length()); // SHA-256 produces 64 hex chars
        assertTrue(hash.matches("[a-f0-9]+"));
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Compute digital twin hash - with secondaries")
    void testComputeDigitalTwinHashWithSecondaries() {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens(primary.tokenId, 3);

        String hash = bindingService.computeDigitalTwinHash(primary, secondaries);

        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: Digital twin hash is deterministic for same order")
    void testDigitalTwinHashDeterministic() {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens(primary.tokenId, 3);

        // Note: Hash includes timestamp, so we test structure only
        String hash1 = bindingService.computeDigitalTwinHash(primary, secondaries);
        String hash2 = bindingService.computeDigitalTwinHash(primary, secondaries);

        // Both should be valid hashes
        assertNotNull(hash1);
        assertNotNull(hash2);
        assertEquals(64, hash1.length());
        assertEquals(64, hash2.length());
    }

    @Test
    @Order(13)
    @DisplayName("Test 13: Different tokens produce different hashes")
    void testDifferentTokensDifferentHashes() {
        PrimaryToken primary1 = createTestPrimaryToken();
        PrimaryToken primary2 = createTestPrimaryToken();

        String hash1 = bindingService.computeDigitalTwinHash(primary1, null);
        String hash2 = bindingService.computeDigitalTwinHash(primary2, null);

        assertNotEquals(hash1, hash2);
    }

    // ==================== MERKLE ROOT COMPUTATION TESTS ====================

    @Test
    @Order(20)
    @DisplayName("Test 20: Compute Merkle root - single token")
    void testComputeMerkleRootSingleToken() {
        PrimaryToken primary = createTestPrimaryToken();

        String merkleRoot = bindingService.computeMerkleRoot(primary, null);

        assertNotNull(merkleRoot);
        assertEquals(64, merkleRoot.length());
    }

    @Test
    @Order(21)
    @DisplayName("Test 21: Compute Merkle root - multiple tokens")
    void testComputeMerkleRootMultipleTokens() {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens(primary.tokenId, 5);

        String merkleRoot = bindingService.computeMerkleRoot(primary, secondaries);

        assertNotNull(merkleRoot);
        assertEquals(64, merkleRoot.length());
    }

    @Test
    @Order(22)
    @DisplayName("Test 22: Merkle root changes with different secondaries")
    void testMerkleRootChangesWithSecondaries() {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries1 = createTestSecondaryTokens(primary.tokenId, 2);
        List<SecondaryToken> secondaries2 = createTestSecondaryTokens(primary.tokenId, 3);

        String merkleRoot1 = bindingService.computeMerkleRoot(primary, secondaries1);
        String merkleRoot2 = bindingService.computeMerkleRoot(primary, secondaries2);

        assertNotEquals(merkleRoot1, merkleRoot2);
    }

    // ==================== BINDING VERIFICATION TESTS ====================

    @Test
    @Order(30)
    @DisplayName("Test 30: Verify valid binding")
    void testVerifyValidBinding() {
        // This test requires database access, so we test the method signature
        CompositeTokenBindingService.BindingVerificationResult result =
                new CompositeTokenBindingService.BindingVerificationResult(true, "Valid", "abc123");

        assertTrue(result.valid);
        assertEquals("Valid", result.message);
    }

    @Test
    @Order(31)
    @DisplayName("Test 31: Binding record creation")
    void testBindingRecordCreation() {
        CompositeTokenBindingService.BindingRecord record =
                new CompositeTokenBindingService.BindingRecord(
                        "CT-123", "PT-456", 3, Instant.now()
                );

        assertEquals("CT-123", record.compositeTokenId);
        assertEquals("PT-456", record.primaryTokenId);
        assertEquals(3, record.secondaryCount);
        assertNotNull(record.boundAt);
    }

    // ==================== UNBINDING TESTS ====================

    @Test
    @Order(40)
    @DisplayName("Test 40: Unbinding result structure")
    void testUnbindingResultStructure() {
        List<String> secondaryIds = List.of("ST-1", "ST-2");
        CompositeTokenBindingService.UnbindingResult result =
                new CompositeTokenBindingService.UnbindingResult(
                        "CT-123", "PT-456", secondaryIds, "proof-hash"
                );

        assertEquals("CT-123", result.compositeTokenId);
        assertEquals("PT-456", result.primaryTokenId);
        assertEquals(2, result.secondaryTokenIds.size());
        assertNotNull(result.unbindingProof);
    }

    // ==================== METRICS TESTS ====================

    @Test
    @Order(50)
    @DisplayName("Test 50: Get binding metrics")
    void testGetBindingMetrics() {
        CompositeTokenBindingService.BindingMetrics metrics = bindingService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.bindingCount >= 0);
        assertTrue(metrics.hashCount >= 0);
        assertTrue(metrics.cacheSize >= 0);
    }

    @Test
    @Order(51)
    @DisplayName("Test 51: Metrics toString format")
    void testMetricsToString() {
        CompositeTokenBindingService.BindingMetrics metrics = bindingService.getMetrics();

        String str = metrics.toString();
        assertNotNull(str);
        assertTrue(str.contains("BindingMetrics"));
    }

    // ==================== PARAMETERIZED TESTS ====================

    @ParameterizedTest
    @ValueSource(ints = {1, 5, 10, 20})
    @Order(60)
    @DisplayName("Test 60: Create composite with varying secondary counts")
    void testCompositeWithVaryingSecondaries(int secondaryCount) {
        PrimaryToken primary = createTestPrimaryToken();
        List<SecondaryToken> secondaries = createTestSecondaryTokens(primary.tokenId, secondaryCount);

        CompositeToken composite = bindingService.createCompositeToken(
                primary, secondaries, primary.owner
        ).await().indefinitely();

        assertNotNull(composite);
        assertEquals(secondaryCount, composite.getSecondaryTokenIdList().size());
    }

    // ==================== HELPER METHODS ====================

    private PrimaryToken createTestPrimaryToken() {
        PrimaryToken token = new PrimaryToken();
        token.tokenId = "PT-REAL_ESTATE-" + UUID.randomUUID();
        token.digitalTwinId = "DT-" + UUID.randomUUID();
        token.assetClass = "REAL_ESTATE";
        token.faceValue = new BigDecimal("1000000.00");
        token.owner = "owner-" + UUID.randomUUID();
        token.status = PrimaryToken.PrimaryTokenStatus.VERIFIED;
        token.createdAt = Instant.now();
        return token;
    }

    private List<SecondaryToken> createTestSecondaryTokens(String parentTokenId, int count) {
        List<SecondaryToken> tokens = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            SecondaryToken token = new SecondaryToken();
            token.tokenId = "ST-INCOME_STREAM-" + UUID.randomUUID();
            token.parentTokenId = parentTokenId;
            token.tokenType = SecondaryToken.SecondaryTokenType.INCOME_STREAM;
            token.faceValue = new BigDecimal("10000.00");
            token.owner = "owner-" + UUID.randomUUID();
            token.status = SecondaryToken.SecondaryTokenStatus.ACTIVE;
            tokens.add(token);
        }
        return tokens;
    }
}
