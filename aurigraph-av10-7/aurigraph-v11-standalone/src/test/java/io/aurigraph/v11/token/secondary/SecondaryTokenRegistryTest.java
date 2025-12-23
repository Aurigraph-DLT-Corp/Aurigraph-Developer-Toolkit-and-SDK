package io.aurigraph.v11.token.secondary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Unit Tests for SecondaryTokenRegistry
 *
 * Tests cover:
 * - Registration operations (15 tests)
 * - Lookup operations (20 tests) - all 5 indexes
 * - Status update operations (10 tests)
 * - Owner update operations (8 tests)
 * - Parent relationship operations (10 tests) - NEW
 * - Merkle integrity operations (7 tests)
 *
 * Target: 70 tests with 95%+ code coverage
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@QuarkusTest
@DisplayName("Secondary Token Registry Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SecondaryTokenRegistryTest {

    @Inject
    SecondaryTokenRegistry registry;

    @Inject
    SecondaryTokenMerkleService merkleService;

    private static final String TEST_OWNER_1 = "0x1234567890abcdef";
    private static final String TEST_OWNER_2 = "0xfedcba0987654321";
    private static final String TEST_PARENT_1 = "PT-REAL_ESTATE-parent-001";
    private static final String TEST_PARENT_2 = "PT-REAL_ESTATE-parent-002";

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

    private SecondaryToken createTestToken(String parentId, String owner, SecondaryToken.SecondaryTokenType type) {
        SecondaryToken token = new SecondaryToken();
        token.tokenId = String.format("ST-%s-%s", type.name(), UUID.randomUUID().toString());
        token.parentTokenId = parentId;
        token.owner = owner;
        token.tokenType = type;
        token.status = SecondaryToken.SecondaryTokenStatus.ACTIVE;
        token.faceValue = new BigDecimal("10000.00");
        return token;
    }

    private List<SecondaryToken> createTokenList(int count, String parentId, String owner) {
        List<SecondaryToken> tokens = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            SecondaryToken.SecondaryTokenType type = switch (i % 3) {
                case 0 -> SecondaryToken.SecondaryTokenType.INCOME_STREAM;
                case 1 -> SecondaryToken.SecondaryTokenType.COLLATERAL;
                case 2 -> SecondaryToken.SecondaryTokenType.ROYALTY;
                default -> SecondaryToken.SecondaryTokenType.INCOME_STREAM;
            };
            tokens.add(createTestToken(parentId, owner, type));
        }
        return tokens;
    }

    private void setupRegistry(int tokenCount) {
        List<SecondaryToken> tokens = createTokenList(tokenCount, TEST_PARENT_1, TEST_OWNER_1);
        for (SecondaryToken token : tokens) {
            registry.register(token).await().indefinitely();
        }
    }

    // =============== REGISTRATION TESTS (15 tests) ===============

    @Nested
    @DisplayName("Registration Tests")
    @Order(1)
    class RegistrationTests {

        @Test
        @DisplayName("Should register valid income stream token")
        void testRegisterValidIncomeStreamToken() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);

            SecondaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry);
            assertEquals(token.tokenId, entry.tokenId);
            assertEquals(token.parentTokenId, entry.parentTokenId);
            assertEquals(token.owner, entry.owner);
            assertEquals(token.tokenType, entry.tokenType);
            assertEquals(token.status, entry.status);
            assertNotNull(entry.merkleHash);
        }

        @Test
        @DisplayName("Should register collateral token")
        void testRegisterCollateralToken() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.COLLATERAL);
            SecondaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
            assertNotNull(entry);
        }

        @Test
        @DisplayName("Should register royalty token")
        void testRegisterRoyaltyToken() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.ROYALTY);
            SecondaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();
            assertNotNull(entry);
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
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            assertThrows(IllegalStateException.class, () -> {
                registry.register(token).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should register multiple tokens from same parent")
        void testRegisterMultipleFromSameParent() {
            List<SecondaryToken> tokens = createTokenList(5, TEST_PARENT_1, TEST_OWNER_1);

            for (SecondaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            SecondaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(5, stats.totalTokens);
        }

        @Test
        @DisplayName("Should register tokens from different parents")
        void testRegisterFromDifferentParents() {
            SecondaryToken token1 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryToken token2 = createTestToken(TEST_PARENT_2, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);

            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();

            SecondaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(2, stats.totalTokens);
            assertEquals(2, stats.uniqueParents);
        }

        @Test
        @DisplayName("Should populate owner index on registration")
        void testOwnerIndexPopulated() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            assertEquals(1, entries.size());
        }

        @Test
        @DisplayName("Should populate parent index on registration")
        void testParentIndexPopulated() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(1, entries.size());
        }

        @Test
        @DisplayName("Should populate type index on registration")
        void testTypeIndexPopulated() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByType(SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            assertEquals(1, entries.size());
        }

        @Test
        @DisplayName("Should populate status index on registration")
        void testStatusIndexPopulated() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByStatus(SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();
            assertEquals(1, entries.size());
        }

        @Test
        @DisplayName("Should handle bulk registration")
        void testBulkRegistration() {
            List<SecondaryToken> tokens = createTokenList(100, TEST_PARENT_1, TEST_OWNER_1);

            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.bulkRegister(tokens).await().indefinitely();

            assertEquals(100, entries.size());
            SecondaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(100, stats.totalTokens);
        }

        @Test
        @DisplayName("Should compute merkle hash on registration")
        void testMerkleHashComputed() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryTokenRegistry.RegistryEntry entry = registry.register(token).await().indefinitely();

            assertNotNull(entry.merkleHash);
            assertEquals(64, entry.merkleHash.length());
            assertTrue(entry.merkleHash.matches("[a-f0-9]{64}"));
        }
    }

    // =============== LOOKUP TESTS (20 tests) ===============

    @Nested
    @DisplayName("Lookup Tests")
    @Order(2)
    class LookupTests {

        @BeforeEach
        void setup() {
            setupRegistry(10);
        }

        @Test
        @DisplayName("Should lookup token by ID")
        void testLookupByTokenId() {
            List<SecondaryToken> tokens = createTokenList(1, TEST_PARENT_1, TEST_OWNER_1);
            SecondaryToken token = tokens.get(0);
            registry.register(token).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(token.tokenId).await().indefinitely();
            assertNotNull(entry);
            assertEquals(token.tokenId, entry.tokenId);
        }

        @Test
        @DisplayName("Should return null for non-existent token ID")
        void testLookupNonExistentToken() {
            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup("nonexistent").await().indefinitely();
            assertNull(entry);
        }

        @Test
        @DisplayName("Should lookup all tokens by parent")
        void testLookupByParent() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(10, entries.size());
        }

        @Test
        @DisplayName("Should return empty list for non-existent parent")
        void testLookupNonExistentParent() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByParent("nonexistent").await().indefinitely();
            assertEquals(0, entries.size());
        }

        @Test
        @DisplayName("Should lookup all tokens by owner")
        void testLookupByOwner() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            assertEquals(10, entries.size());
        }

        @Test
        @DisplayName("Should lookup tokens by type")
        void testLookupByType() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByType(SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            assertTrue(entries.size() > 0);
        }

        @Test
        @DisplayName("Should lookup tokens by status")
        void testLookupByStatus() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByStatus(SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();
            assertEquals(10, entries.size());
        }

        @Test
        @DisplayName("Should count tokens by parent")
        void testCountByParent() {
            Long count = registry.countByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(10, count);
        }

        @Test
        @DisplayName("Should count zero for non-existent parent")
        void testCountNonExistentParent() {
            Long count = registry.countByParent("nonexistent").await().indefinitely();
            assertEquals(0, count);
        }

        @Test
        @DisplayName("Should count active tokens by parent")
        void testCountActiveByParent() {
            Long count = registry.countActiveByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(10, count);
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9})
        @DisplayName("Should lookup token by index")
        void testLookupVariousIndexes(int index) {
            List<SecondaryToken> tokens = createTokenList(10, TEST_PARENT_1, TEST_OWNER_1);
            for (SecondaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }
            assertNotNull(registry.lookup(tokens.get(index).tokenId).await().indefinitely());
        }

        @Test
        @DisplayName("Should get children by type")
        void testGetChildrenByType() {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.getChildrenByType(TEST_PARENT_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            assertTrue(entries.size() > 0);
        }

        @Test
        @DisplayName("Should filter children correctly")
        void testFilterChildren() {
            List<SecondaryTokenRegistry.RegistryEntry> incomeStreamChildren = registry.getChildrenByType(TEST_PARENT_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            List<SecondaryTokenRegistry.RegistryEntry> collateralChildren = registry.getChildrenByType(TEST_PARENT_1, SecondaryToken.SecondaryTokenType.COLLATERAL).await().indefinitely();

            for (SecondaryTokenRegistry.RegistryEntry entry : incomeStreamChildren) {
                assertEquals(SecondaryToken.SecondaryTokenType.INCOME_STREAM, entry.tokenType);
            }
            for (SecondaryTokenRegistry.RegistryEntry entry : collateralChildren) {
                assertEquals(SecondaryToken.SecondaryTokenType.COLLATERAL, entry.tokenType);
            }
        }

        @Test
        @DisplayName("Should provide consistent lookup results")
        void testLookupConsistency() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry entry1 = registry.lookup(token.tokenId).await().indefinitely();
            SecondaryTokenRegistry.RegistryEntry entry2 = registry.lookup(token.tokenId).await().indefinitely();

            assertEquals(entry1.tokenId, entry2.tokenId);
            assertEquals(entry1.merkleHash, entry2.merkleHash);
        }

        @Test
        @DisplayName("Should handle lookup with special characters in ID")
        void testLookupSpecialCharacters() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(token.tokenId).await().indefinitely();
            assertNotNull(entry);
        }

        @Test
        @DisplayName("Should validate parent exists")
        void testValidateParentExists() {
            Boolean exists = registry.validateParentExists(TEST_PARENT_1).await().indefinitely();
            assertTrue(exists);
        }
    }

    // =============== STATUS UPDATE TESTS (10 tests) ===============

    @Nested
    @DisplayName("Status Update Tests")
    @Order(3)
    class StatusUpdateTests {

        @Test
        @DisplayName("Should update token status from CREATED to ACTIVE")
        void testUpdateStatusCreatedToActive() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            token.status = SecondaryToken.SecondaryTokenStatus.CREATED;
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(SecondaryToken.SecondaryTokenStatus.ACTIVE, updated.status);
        }

        @Test
        @DisplayName("Should update token status from ACTIVE to REDEEMED")
        void testUpdateStatusActiveToRedeemed() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(SecondaryToken.SecondaryTokenStatus.REDEEMED, updated.status);
        }

        @Test
        @DisplayName("Should reject status update for non-existent token")
        void testUpdateStatusNonExistent() {
            assertThrows(IllegalArgumentException.class, () -> {
                registry.updateStatus("nonexistent", SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should update status index correctly")
        void testStatusIndexUpdate() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> active = registry.lookupByStatus(SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();
            List<SecondaryTokenRegistry.RegistryEntry> redeemed = registry.lookupByStatus(SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            assertTrue(active.stream().noneMatch(e -> e.tokenId.equals(token.tokenId)));
            assertTrue(redeemed.stream().anyMatch(e -> e.tokenId.equals(token.tokenId)));
        }

        @Test
        @DisplayName("Should update lastUpdated timestamp on status change")
        void testLastUpdatedTimestamp() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryTokenRegistry.RegistryEntry entry1 = registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();
            SecondaryTokenRegistry.RegistryEntry entry2 = registry.lookup(token.tokenId).await().indefinitely();

            assertTrue(entry2.lastUpdated.isAfter(entry1.registeredAt));
        }

        @ParameterizedTest
        @EnumSource(SecondaryToken.SecondaryTokenStatus.class)
        @DisplayName("Should update to all possible statuses")
        void testUpdateToAllStatuses(SecondaryToken.SecondaryTokenStatus status) {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, status).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(status, updated.status);
        }

        @Test
        @DisplayName("Should handle multiple status updates")
        void testMultipleStatusUpdates() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();
            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(SecondaryToken.SecondaryTokenStatus.REDEEMED, updated.status);
        }

        @Test
        @DisplayName("Should preserve other fields on status update")
        void testPreserveFieldsOnStatusUpdate() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryTokenRegistry.RegistryEntry entry1 = registry.register(token).await().indefinitely();

            registry.updateStatus(token.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();
            SecondaryTokenRegistry.RegistryEntry entry2 = registry.lookup(token.tokenId).await().indefinitely();

            assertEquals(entry1.tokenId, entry2.tokenId);
            assertEquals(entry1.owner, entry2.owner);
            assertEquals(entry1.parentTokenId, entry2.parentTokenId);
        }

        @Test
        @DisplayName("Should count active tokens correctly after status update")
        void testCountActiveAfterStatusUpdate() {
            SecondaryToken token1 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryToken token2 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.COLLATERAL);
            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();

            Long activeCountBefore = registry.countActiveByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(2, activeCountBefore);

            registry.updateStatus(token1.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            Long activeCountAfter = registry.countActiveByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(1, activeCountAfter);
        }
    }

    // =============== OWNER UPDATE TESTS (8 tests) ===============

    @Nested
    @DisplayName("Owner Update Tests")
    @Order(4)
    class OwnerUpdateTests {

        @Test
        @DisplayName("Should update token owner")
        void testUpdateOwner() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(TEST_OWNER_2, updated.owner);
        }

        @Test
        @DisplayName("Should update owner index on transfer")
        void testOwnerIndexUpdate() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();

            List<SecondaryTokenRegistry.RegistryEntry> owner1Tokens = registry.lookupByOwner(TEST_OWNER_1).await().indefinitely();
            List<SecondaryTokenRegistry.RegistryEntry> owner2Tokens = registry.lookupByOwner(TEST_OWNER_2).await().indefinitely();

            assertTrue(owner1Tokens.stream().noneMatch(e -> e.tokenId.equals(token.tokenId)));
            assertTrue(owner2Tokens.stream().anyMatch(e -> e.tokenId.equals(token.tokenId)));
        }

        @Test
        @DisplayName("Should reject owner update for non-existent token")
        void testUpdateOwnerNonExistent() {
            assertThrows(IllegalArgumentException.class, () -> {
                registry.updateOwner("nonexistent", TEST_OWNER_2).await().indefinitely();
            });
        }

        @Test
        @DisplayName("Should preserve other fields on owner update")
        void testPreserveFieldsOnOwnerUpdate() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryTokenRegistry.RegistryEntry entry1 = registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            SecondaryTokenRegistry.RegistryEntry entry2 = registry.lookup(token.tokenId).await().indefinitely();

            assertEquals(entry1.tokenId, entry2.tokenId);
            assertEquals(entry1.parentTokenId, entry2.parentTokenId);
            assertEquals(entry1.tokenType, entry2.tokenType);
        }

        @Test
        @DisplayName("Should handle multiple owner transfers")
        void testMultipleOwnerTransfers() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            String owner3 = "0x3333333333333333";
            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            registry.updateOwner(token.tokenId, owner3).await().indefinitely();

            SecondaryTokenRegistry.RegistryEntry updated = registry.lookup(token.tokenId).await().indefinitely();
            assertEquals(owner3, updated.owner);
        }

        @Test
        @DisplayName("Should update lastUpdated timestamp on owner change")
        void testLastUpdatedOnOwnerChange() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryTokenRegistry.RegistryEntry entry1 = registry.register(token).await().indefinitely();

            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            SecondaryTokenRegistry.RegistryEntry entry2 = registry.lookup(token.tokenId).await().indefinitely();

            assertTrue(entry2.lastUpdated.isAfter(entry1.registeredAt));
        }

        @Test
        @DisplayName("Should correctly count tokens per owner after transfer")
        void testCountPerOwnerAfterTransfer() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            Long owner1CountBefore = (long) registry.lookupByOwner(TEST_OWNER_1).await().indefinitely().size();
            registry.updateOwner(token.tokenId, TEST_OWNER_2).await().indefinitely();
            Long owner1CountAfter = (long) registry.lookupByOwner(TEST_OWNER_1).await().indefinitely().size();

            assertEquals(1, owner1CountBefore);
            assertEquals(0, owner1CountAfter);
        }
    }

    // =============== PARENT RELATIONSHIP TESTS (10 tests) ===============

    @Nested
    @DisplayName("Parent Relationship Tests")
    @Order(5)
    class ParentRelationshipTests {

        @Test
        @DisplayName("Should count tokens by parent")
        void testCountByParent() {
            List<SecondaryToken> tokens = createTokenList(5, TEST_PARENT_1, TEST_OWNER_1);
            for (SecondaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            Long count = registry.countByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(5, count);
        }

        @Test
        @DisplayName("Should count zero for non-existent parent")
        void testCountNonExistentParent() {
            Long count = registry.countByParent("nonexistent").await().indefinitely();
            assertEquals(0, count);
        }

        @Test
        @DisplayName("Should count only active children by parent")
        void testCountActiveChildrenByParent() {
            SecondaryToken token1 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryToken token2 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.COLLATERAL);
            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();

            registry.updateStatus(token1.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            Long activeCount = registry.countActiveByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(1, activeCount);
        }

        @Test
        @DisplayName("Should get children filtered by type")
        void testGetChildrenByType() {
            List<SecondaryToken> incomeTokens = createTokenList(3, TEST_PARENT_1, TEST_OWNER_1);
            for (SecondaryToken token : incomeTokens) {
                token.tokenType = SecondaryToken.SecondaryTokenType.INCOME_STREAM;
                registry.register(token).await().indefinitely();
            }

            List<SecondaryTokenRegistry.RegistryEntry> children = registry.getChildrenByType(TEST_PARENT_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            assertEquals(3, children.size());
        }

        @Test
        @DisplayName("Should return empty list for non-existent parent children")
        void testGetChildrenNonExistentParent() {
            List<SecondaryTokenRegistry.RegistryEntry> children = registry.getChildrenByType("nonexistent", SecondaryToken.SecondaryTokenType.INCOME_STREAM).await().indefinitely();
            assertEquals(0, children.size());
        }

        @Test
        @DisplayName("Should validate parent exists")
        void testValidateParentExists() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            Boolean exists = registry.validateParentExists(TEST_PARENT_1).await().indefinitely();
            assertTrue(exists);
        }

        @Test
        @DisplayName("Should support multiple children per parent")
        void testMultipleChildrenPerParent() {
            List<SecondaryToken> tokens = createTokenList(10, TEST_PARENT_1, TEST_OWNER_1);
            for (SecondaryToken token : tokens) {
                registry.register(token).await().indefinitely();
            }

            List<SecondaryTokenRegistry.RegistryEntry> children = registry.lookupByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(10, children.size());
        }

        @Test
        @DisplayName("Should separate children by parent")
        void testSeparateChildrenByParent() {
            List<SecondaryToken> parent1Children = createTokenList(5, TEST_PARENT_1, TEST_OWNER_1);
            List<SecondaryToken> parent2Children = createTokenList(5, TEST_PARENT_2, TEST_OWNER_1);

            for (SecondaryToken token : parent1Children) {
                registry.register(token).await().indefinitely();
            }
            for (SecondaryToken token : parent2Children) {
                registry.register(token).await().indefinitely();
            }

            List<SecondaryTokenRegistry.RegistryEntry> children1 = registry.lookupByParent(TEST_PARENT_1).await().indefinitely();
            List<SecondaryTokenRegistry.RegistryEntry> children2 = registry.lookupByParent(TEST_PARENT_2).await().indefinitely();

            assertEquals(5, children1.size());
            assertEquals(5, children2.size());
        }

        @Test
        @DisplayName("Should get registry stats including unique parents")
        void testRegistryStatsParents() {
            List<SecondaryToken> parent1Children = createTokenList(5, TEST_PARENT_1, TEST_OWNER_1);
            List<SecondaryToken> parent2Children = createTokenList(3, TEST_PARENT_2, TEST_OWNER_1);

            for (SecondaryToken token : parent1Children) {
                registry.register(token).await().indefinitely();
            }
            for (SecondaryToken token : parent2Children) {
                registry.register(token).await().indefinitely();
            }

            SecondaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(8, stats.totalTokens);
            assertEquals(2, stats.uniqueParents);
        }

        @Test
        @DisplayName("Should handle parent with mixed token types and statuses")
        void testParentWithMixedChildren() {
            SecondaryToken token1 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            SecondaryToken token2 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.COLLATERAL);
            SecondaryToken token3 = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.ROYALTY);

            registry.register(token1).await().indefinitely();
            registry.register(token2).await().indefinitely();
            registry.register(token3).await().indefinitely();

            registry.updateStatus(token2.tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            Long activeCount = registry.countActiveByParent(TEST_PARENT_1).await().indefinitely();
            assertEquals(2, activeCount);

            SecondaryTokenRegistry.RegistryStats stats = registry.getStats();
            assertEquals(3, stats.totalTokens);
            assertEquals(3, stats.tokenTypeCount);
        }
    }

    // =============== MERKLE INTEGRITY TESTS (7 tests) ===============

    @Nested
    @DisplayName("Merkle Integrity Tests")
    @Order(6)
    class MerkleIntegrityTests {

        @Test
        @DisplayName("Should generate merkle proof for registered token")
        void testGenerateMerkleProof() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            SecondaryTokenRegistry.RegistryProof proof = registry.generateProof(token.tokenId).await().indefinitely();
            assertNotNull(proof);
            assertEquals(token.tokenId, proof.tokenId);
        }

        @Test
        @DisplayName("Should verify valid merkle proof")
        void testVerifyMerkleProof() {
            SecondaryToken token = createTestToken(TEST_PARENT_1, TEST_OWNER_1, SecondaryToken.SecondaryTokenType.INCOME_STREAM);
            registry.register(token).await().indefinitely();

            SecondaryTokenRegistry.RegistryProof proof = registry.generateProof(token.tokenId).await().indefinitely();
            assertTrue(registry.verifyProof(proof));
        }

        @Test
        @DisplayName("Should reject null proof")
        void testVerifyNullProof() {
            assertFalse(registry.verifyProof(null));
        }

        @Test
        @DisplayName("Should provide registry metrics")
        void testRegistryMetrics() {
            setupRegistry(100);

            SecondaryTokenRegistry.RegistryMetrics metrics = registry.getMetrics();
            assertNotNull(metrics);
            assertEquals(100, metrics.registrySize);
            assertTrue(metrics.registrationCount > 0);
        }

        @Test
        @DisplayName("Should validate registry consistency")
        void testValidateConsistency() {
            setupRegistry(10);

            SecondaryTokenRegistry.ConsistencyReport report = registry.validateConsistency().await().indefinitely();
            assertNotNull(report);
            assertEquals(10, report.totalTokens);
            assertEquals(10, report.consistentTokens);
            assertEquals(0, report.inconsistentTokens);
            assertTrue(report.issues.isEmpty());
        }

        @Test
        @DisplayName("Should track performance metrics")
        void testPerformanceMetrics() {
            setupRegistry(100);

            SecondaryTokenRegistry.RegistryMetrics metrics = registry.getMetrics();
            assertNotNull(metrics);
            assertTrue(metrics.registrationCount > 0);
            assertTrue(metrics.avgLookupTimeUs >= 0);
        }

        @Test
        @DisplayName("Should clear registry data")
        void testClearRegistry() {
            setupRegistry(10);

            SecondaryTokenRegistry.RegistryStats statsBefore = registry.getStats();
            assertEquals(10, statsBefore.totalTokens);

            registry.clear();

            SecondaryTokenRegistry.RegistryStats statsAfter = registry.getStats();
            assertEquals(0, statsAfter.totalTokens);
        }
    }
}
