package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.TokenBindingService.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Test Suite for TokenBindingService
 *
 * Tests cover:
 * - Primary token binding (100% ownership)
 * - Secondary token binding (percentage shares)
 * - Composite token binding (token bundles)
 * - Token binding retrieval
 * - Token unbinding (lock/release)
 * - Get contracts bound to token
 * - Binding statistics and metrics
 *
 * @version 12.0.0
 * @author Aurigraph V11 Development Team
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TokenBindingServiceTest {

    @Inject
    TokenBindingService tokenBindingService;

    private static final String TEST_CONTRACT_ID = "CONTRACT_001";
    private static final String TEST_TOKEN_ID = "TOKEN_001";
    private static final String TEST_STAKEHOLDER = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    private static final Duration ASYNC_TIMEOUT = Duration.ofSeconds(5);

    @BeforeEach
    void setUp() {
        // Each test gets a fresh state with unique contract IDs
    }

    // ==========================================================================
    // Primary Token Binding Tests
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("Should bind primary token to contract successfully")
    void testBindPrimaryToken() {
        String contractId = "PRIMARY_CONTRACT_001";
        String tokenId = "PRIMARY_TOKEN_001";
        String stakeholder = TEST_STAKEHOLDER;

        TokenBinding result = tokenBindingService.bindPrimaryToken(contractId, tokenId, stakeholder)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertNotNull(result.getBindingId());
        assertTrue(result.getBindingId().startsWith("TB-"));
        assertEquals(contractId, result.getContractId());
        assertEquals(tokenId, result.getTokenId());
        assertEquals(TokenType.PRIMARY, result.getTokenType());
        assertEquals(stakeholder, result.getStakeholder());
        assertEquals(BigDecimal.valueOf(100), result.getPercentage());
        assertEquals(BindingStatus.ACTIVE, result.getStatus());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    @Order(2)
    @DisplayName("Should fail binding primary token with null contract ID")
    void testBindPrimaryTokenNullContractId() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken(null, TEST_TOKEN_ID, TEST_STAKEHOLDER)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(3)
    @DisplayName("Should fail binding primary token with empty contract ID")
    void testBindPrimaryTokenEmptyContractId() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken("", TEST_TOKEN_ID, TEST_STAKEHOLDER)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(4)
    @DisplayName("Should fail binding primary token with null token ID")
    void testBindPrimaryTokenNullTokenId() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken(TEST_CONTRACT_ID, null, TEST_STAKEHOLDER)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(5)
    @DisplayName("Should fail binding primary token with null stakeholder")
    void testBindPrimaryTokenNullStakeholder() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken(TEST_CONTRACT_ID, TEST_TOKEN_ID, null)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    // ==========================================================================
    // Secondary Token Binding Tests
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("Should bind secondary token with valid percentage")
    void testBindSecondaryToken() {
        String contractId = "SECONDARY_CONTRACT_001";
        String tokenId = "SECONDARY_TOKEN_001";
        String stakeholder = TEST_STAKEHOLDER;
        BigDecimal percentage = BigDecimal.valueOf(25);

        TokenBinding result = tokenBindingService.bindSecondaryToken(
                contractId, tokenId, stakeholder, percentage)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertNotNull(result.getBindingId());
        assertEquals(contractId, result.getContractId());
        assertEquals(tokenId, result.getTokenId());
        assertEquals(TokenType.SECONDARY, result.getTokenType());
        assertEquals(stakeholder, result.getStakeholder());
        assertEquals(percentage, result.getPercentage());
        assertEquals(BindingStatus.ACTIVE, result.getStatus());
    }

    @Test
    @Order(11)
    @DisplayName("Should bind multiple secondary tokens with valid total percentage")
    void testBindMultipleSecondaryTokens() {
        String contractId = "SECONDARY_CONTRACT_002";

        // Bind first secondary token with 30%
        TokenBinding first = tokenBindingService.bindSecondaryToken(
                contractId, "SEC_TOKEN_A", "0xStakeholderA", BigDecimal.valueOf(30))
                .await().atMost(ASYNC_TIMEOUT);

        // Bind second secondary token with 40%
        TokenBinding second = tokenBindingService.bindSecondaryToken(
                contractId, "SEC_TOKEN_B", "0xStakeholderB", BigDecimal.valueOf(40))
                .await().atMost(ASYNC_TIMEOUT);

        // Bind third secondary token with 30% (total = 100%)
        TokenBinding third = tokenBindingService.bindSecondaryToken(
                contractId, "SEC_TOKEN_C", "0xStakeholderC", BigDecimal.valueOf(30))
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(first);
        assertNotNull(second);
        assertNotNull(third);
        assertEquals(BigDecimal.valueOf(30), first.getPercentage());
        assertEquals(BigDecimal.valueOf(40), second.getPercentage());
        assertEquals(BigDecimal.valueOf(30), third.getPercentage());
    }

    @Test
    @Order(12)
    @DisplayName("Should fail binding secondary token exceeding 100% total")
    void testBindSecondaryTokenExceedsTotal() {
        String contractId = "SECONDARY_CONTRACT_003";

        // Bind first secondary token with 80%
        tokenBindingService.bindSecondaryToken(
                contractId, "SEC_TOKEN_X", "0xStakeholderX", BigDecimal.valueOf(80))
                .await().atMost(ASYNC_TIMEOUT);

        // Attempt to bind another with 30% (total would be 110%)
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindSecondaryToken(
                    contractId, "SEC_TOKEN_Y", "0xStakeholderY", BigDecimal.valueOf(30))
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(13)
    @DisplayName("Should fail binding secondary token with zero percentage")
    void testBindSecondaryTokenZeroPercentage() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindSecondaryToken(
                    "SECONDARY_CONTRACT_004", "TOKEN_Z", TEST_STAKEHOLDER, BigDecimal.ZERO)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(14)
    @DisplayName("Should fail binding secondary token with negative percentage")
    void testBindSecondaryTokenNegativePercentage() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindSecondaryToken(
                    "SECONDARY_CONTRACT_005", "TOKEN_NEG", TEST_STAKEHOLDER, BigDecimal.valueOf(-10))
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(15)
    @DisplayName("Should fail binding secondary token with percentage over 100")
    void testBindSecondaryTokenOverHundredPercentage() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindSecondaryToken(
                    "SECONDARY_CONTRACT_006", "TOKEN_OVER", TEST_STAKEHOLDER, BigDecimal.valueOf(150))
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    // ==========================================================================
    // Composite Token Binding Tests
    // ==========================================================================

    @Test
    @Order(20)
    @DisplayName("Should bind composite token with multiple components")
    void testBindCompositeToken() {
        String contractId = "COMPOSITE_CONTRACT_001";
        String compositeTokenId = "COMPOSITE_TOKEN_001";
        List<String> componentTokens = Arrays.asList("COMP_A", "COMP_B", "COMP_C");

        TokenBinding result = tokenBindingService.bindCompositeToken(
                contractId, compositeTokenId, componentTokens)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertNotNull(result.getBindingId());
        assertEquals(contractId, result.getContractId());
        assertEquals(compositeTokenId, result.getTokenId());
        assertEquals(TokenType.COMPOSITE, result.getTokenType());
        assertNotNull(result.getComponentTokens());
        assertEquals(3, result.getComponentTokens().size());
        assertTrue(result.getComponentTokens().contains("COMP_A"));
        assertTrue(result.getComponentTokens().contains("COMP_B"));
        assertTrue(result.getComponentTokens().contains("COMP_C"));
        assertEquals(BindingStatus.ACTIVE, result.getStatus());
    }

    @Test
    @Order(21)
    @DisplayName("Should bind composite token with single component")
    void testBindCompositeTokenSingleComponent() {
        String contractId = "COMPOSITE_CONTRACT_002";
        String compositeTokenId = "COMPOSITE_TOKEN_002";
        List<String> componentTokens = Collections.singletonList("SINGLE_COMP");

        TokenBinding result = tokenBindingService.bindCompositeToken(
                contractId, compositeTokenId, componentTokens)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertEquals(1, result.getComponentTokens().size());
        assertEquals("SINGLE_COMP", result.getComponentTokens().get(0));
    }

    @Test
    @Order(22)
    @DisplayName("Should fail binding composite token with null components")
    void testBindCompositeTokenNullComponents() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindCompositeToken(
                    "COMPOSITE_CONTRACT_003", "COMPOSITE_TOKEN_003", null)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(23)
    @DisplayName("Should fail binding composite token with empty components list")
    void testBindCompositeTokenEmptyComponents() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindCompositeToken(
                    "COMPOSITE_CONTRACT_004", "COMPOSITE_TOKEN_004", Collections.emptyList())
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    // ==========================================================================
    // Get Bindings for Contract Tests
    // ==========================================================================

    @Test
    @Order(30)
    @DisplayName("Should get all bindings for contract")
    void testGetTokenBindings() {
        String contractId = "GET_BINDINGS_CONTRACT_001";

        // Create multiple bindings
        tokenBindingService.bindPrimaryToken(contractId, "P_TOKEN", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "S_TOKEN", "0xStakeholder2", BigDecimal.valueOf(25))
                .await().atMost(ASYNC_TIMEOUT);

        // Get all bindings
        List<TokenBinding> bindings = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(bindings);
        assertEquals(2, bindings.size());
    }

    @Test
    @Order(31)
    @DisplayName("Should return empty list for contract with no bindings")
    void testGetTokenBindingsEmptyContract() {
        List<TokenBinding> bindings = tokenBindingService.getTokenBindings("NONEXISTENT_CONTRACT")
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(bindings);
        assertTrue(bindings.isEmpty());
    }

    @Test
    @Order(32)
    @DisplayName("Should get bindings by type")
    void testGetTokenBindingsByType() {
        String contractId = "GET_BINDINGS_BY_TYPE_001";

        // Create mixed bindings
        tokenBindingService.bindPrimaryToken(contractId, "PRIMARY_1", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "SECONDARY_1", "0xS1", BigDecimal.valueOf(20))
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "SECONDARY_2", "0xS2", BigDecimal.valueOf(30))
                .await().atMost(ASYNC_TIMEOUT);

        // Get only PRIMARY bindings
        List<TokenBinding> primaryBindings = tokenBindingService.getTokenBindingsByType(
                contractId, TokenType.PRIMARY)
                .await().atMost(ASYNC_TIMEOUT);

        // Get only SECONDARY bindings
        List<TokenBinding> secondaryBindings = tokenBindingService.getTokenBindingsByType(
                contractId, TokenType.SECONDARY)
                .await().atMost(ASYNC_TIMEOUT);

        assertEquals(1, primaryBindings.size());
        assertEquals(TokenType.PRIMARY, primaryBindings.get(0).getTokenType());

        assertEquals(2, secondaryBindings.size());
        assertTrue(secondaryBindings.stream().allMatch(b -> b.getTokenType() == TokenType.SECONDARY));
    }

    // ==========================================================================
    // Unbind Token (Lock and Release) Tests
    // ==========================================================================

    @Test
    @Order(40)
    @DisplayName("Should lock tokens for contract")
    void testLockTokens() {
        String contractId = "LOCK_CONTRACT_001";

        // Create bindings first
        tokenBindingService.bindPrimaryToken(contractId, "LOCK_TOKEN_1", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "LOCK_TOKEN_2", "0xS1", BigDecimal.valueOf(50))
                .await().atMost(ASYNC_TIMEOUT);

        // Lock tokens
        LockResult result = tokenBindingService.lockTokens(contractId)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertEquals(contractId, result.contractId());
        assertTrue(result.success());
        assertNotNull(result.lockedTokenIds());
        assertEquals(2, result.lockedTokenIds().size());
        assertTrue(result.lockedTokenIds().contains("LOCK_TOKEN_1"));
        assertTrue(result.lockedTokenIds().contains("LOCK_TOKEN_2"));
        assertNotNull(result.timestamp());
    }

    @Test
    @Order(41)
    @DisplayName("Should return failure when locking empty contract")
    void testLockTokensEmptyContract() {
        LockResult result = tokenBindingService.lockTokens("EMPTY_LOCK_CONTRACT")
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertFalse(result.success());
        assertTrue(result.lockedTokenIds().isEmpty());
        assertEquals("No tokens to lock", result.message());
    }

    @Test
    @Order(42)
    @DisplayName("Should release locked tokens")
    void testReleaseTokens() {
        String contractId = "RELEASE_CONTRACT_001";

        // Create and lock bindings
        tokenBindingService.bindPrimaryToken(contractId, "RELEASE_TOKEN_1", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.lockTokens(contractId).await().atMost(ASYNC_TIMEOUT);

        // Release tokens
        ReleaseResult result = tokenBindingService.releaseTokens(contractId)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertEquals(contractId, result.contractId());
        assertTrue(result.success());
        assertNotNull(result.releasedTokenIds());
        assertEquals(1, result.releasedTokenIds().size());
        assertTrue(result.releasedTokenIds().contains("RELEASE_TOKEN_1"));
        assertNotNull(result.timestamp());
    }

    @Test
    @Order(43)
    @DisplayName("Should handle releasing from contract with no locked tokens")
    void testReleaseTokensNoLockedTokens() {
        ReleaseResult result = tokenBindingService.releaseTokens("NO_LOCKED_CONTRACT")
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("No locked tokens to release", result.message());
        assertTrue(result.releasedTokenIds().isEmpty());
    }

    @Test
    @Order(44)
    @DisplayName("Should verify binding status changes after lock and release")
    void testBindingStatusTransitions() {
        String contractId = "STATUS_TRANSITION_CONTRACT_001";

        // Create binding
        TokenBinding initial = tokenBindingService.bindPrimaryToken(
                contractId, "STATUS_TOKEN", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(BindingStatus.ACTIVE, initial.getStatus());

        // Lock
        tokenBindingService.lockTokens(contractId).await().atMost(ASYNC_TIMEOUT);
        List<TokenBinding> afterLock = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(BindingStatus.LOCKED, afterLock.get(0).getStatus());
        assertNotNull(afterLock.get(0).getLockedAt());

        // Release
        tokenBindingService.releaseTokens(contractId).await().atMost(ASYNC_TIMEOUT);
        List<TokenBinding> afterRelease = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(BindingStatus.RELEASED, afterRelease.get(0).getStatus());
        assertNotNull(afterRelease.get(0).getReleasedAt());
    }

    // ==========================================================================
    // Token Ownership Verification Tests
    // ==========================================================================

    @Test
    @Order(50)
    @DisplayName("Should verify token ownership for party")
    void testVerifyTokenOwnership() {
        String contractId = "OWNERSHIP_CONTRACT_001";
        String partyId = TEST_STAKEHOLDER;

        // Create bindings for the party
        tokenBindingService.bindPrimaryToken(contractId, "OWN_TOKEN_1", partyId)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "OWN_TOKEN_2", partyId, BigDecimal.valueOf(50))
                .await().atMost(ASYNC_TIMEOUT);

        // Verify ownership
        OwnershipVerification result = tokenBindingService.verifyTokenOwnership(contractId, partyId)
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertEquals(contractId, result.contractId());
        assertEquals(partyId, result.partyId());
        assertTrue(result.verified());
        assertEquals("All token ownerships verified", result.message());
        assertNotNull(result.tokenResults());
        assertEquals(2, result.tokenResults().size());
        assertTrue(result.tokenResults().stream().allMatch(TokenVerificationResult::verified));
        assertNotNull(result.timestamp());
    }

    @Test
    @Order(51)
    @DisplayName("Should return false for party with no bindings")
    void testVerifyTokenOwnershipNoBindings() {
        OwnershipVerification result = tokenBindingService.verifyTokenOwnership(
                "OWNERSHIP_CONTRACT_002", "UNKNOWN_PARTY")
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(result);
        assertFalse(result.verified());
        assertEquals("No token bindings found for this party", result.message());
        assertTrue(result.tokenResults().isEmpty());
    }

    // ==========================================================================
    // Binding Statistics and Metrics Tests
    // ==========================================================================

    @Test
    @Order(60)
    @DisplayName("Should return binding metrics")
    void testGetMetrics() {
        String contractId = "METRICS_CONTRACT_001";

        // Create some bindings
        tokenBindingService.bindPrimaryToken(contractId, "METRICS_TOKEN_1", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindSecondaryToken(contractId, "METRICS_TOKEN_2", "0xS1", BigDecimal.valueOf(25))
                .await().atMost(ASYNC_TIMEOUT);

        // Lock tokens
        tokenBindingService.lockTokens(contractId).await().atMost(ASYNC_TIMEOUT);

        // Release tokens
        tokenBindingService.releaseTokens(contractId).await().atMost(ASYNC_TIMEOUT);

        // Verify ownership
        tokenBindingService.verifyTokenOwnership(contractId, TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);

        // Get metrics
        Map<String, Object> metrics = tokenBindingService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.containsKey("bindingsCreated"));
        assertTrue(metrics.containsKey("tokensLocked"));
        assertTrue(metrics.containsKey("tokensReleased"));
        assertTrue(metrics.containsKey("ownershipVerifications"));
        assertTrue(metrics.containsKey("totalContractsWithBindings"));
        assertTrue(metrics.containsKey("totalActiveBindings"));
        assertTrue(metrics.containsKey("timestamp"));

        // Verify counts are at least 2 (from this test)
        assertTrue((Long) metrics.get("bindingsCreated") >= 2);
        assertTrue((Long) metrics.get("tokensLocked") >= 2);
        assertTrue((Long) metrics.get("tokensReleased") >= 2);
        assertTrue((Long) metrics.get("ownershipVerifications") >= 1);
    }

    @Test
    @Order(61)
    @DisplayName("Should track bindings created count")
    void testBindingsCreatedMetric() {
        Map<String, Object> beforeMetrics = tokenBindingService.getMetrics();
        long beforeCount = (Long) beforeMetrics.get("bindingsCreated");

        // Create new binding
        tokenBindingService.bindPrimaryToken(
                "METRIC_TRACK_001", "METRIC_TOKEN", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);

        Map<String, Object> afterMetrics = tokenBindingService.getMetrics();
        long afterCount = (Long) afterMetrics.get("bindingsCreated");

        assertEquals(beforeCount + 1, afterCount);
    }

    @Test
    @Order(62)
    @DisplayName("Should track total contracts with bindings")
    void testTotalContractsWithBindingsMetric() {
        // Create bindings in different contracts
        tokenBindingService.bindPrimaryToken(
                "UNIQUE_CONTRACT_A", "TOKEN_A", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        tokenBindingService.bindPrimaryToken(
                "UNIQUE_CONTRACT_B", "TOKEN_B", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);

        Map<String, Object> metrics = tokenBindingService.getMetrics();

        assertTrue((Integer) metrics.get("totalContractsWithBindings") >= 2);
    }

    // ==========================================================================
    // TokenBinding Entity Tests
    // ==========================================================================

    @Test
    @Order(70)
    @DisplayName("Should set and get all TokenBinding properties")
    void testTokenBindingProperties() {
        TokenBinding binding = new TokenBinding();

        binding.setBindingId("TB-TEST-001");
        binding.setContractId("CONTRACT_PROP_001");
        binding.setTokenId("TOKEN_PROP_001");
        binding.setTokenType(TokenType.GOVERNANCE);
        binding.setStakeholder("0xStakeholder");
        binding.setPercentage(BigDecimal.valueOf(75));
        binding.setStatus(BindingStatus.PENDING);

        List<String> components = Arrays.asList("C1", "C2");
        binding.setComponentTokens(components);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("key", "value");
        binding.setMetadata(metadata);

        assertEquals("TB-TEST-001", binding.getBindingId());
        assertEquals("CONTRACT_PROP_001", binding.getContractId());
        assertEquals("TOKEN_PROP_001", binding.getTokenId());
        assertEquals(TokenType.GOVERNANCE, binding.getTokenType());
        assertEquals("0xStakeholder", binding.getStakeholder());
        assertEquals(BigDecimal.valueOf(75), binding.getPercentage());
        assertEquals(BindingStatus.PENDING, binding.getStatus());
        assertEquals(2, binding.getComponentTokens().size());
        assertEquals("value", binding.getMetadata().get("key"));
    }

    // ==========================================================================
    // Edge Cases and Boundary Tests
    // ==========================================================================

    @Test
    @Order(80)
    @DisplayName("Should handle binding exactly 100% for secondary tokens")
    void testSecondaryTokenExactlyHundredPercent() {
        String contractId = "EXACT_100_CONTRACT";

        TokenBinding binding = tokenBindingService.bindSecondaryToken(
                contractId, "TOKEN_100", TEST_STAKEHOLDER, BigDecimal.valueOf(100))
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(binding);
        assertEquals(BigDecimal.valueOf(100), binding.getPercentage());
    }

    @Test
    @Order(81)
    @DisplayName("Should handle fractional percentages for secondary tokens")
    void testSecondaryTokenFractionalPercentage() {
        String contractId = "FRACTIONAL_CONTRACT";

        TokenBinding binding = tokenBindingService.bindSecondaryToken(
                contractId, "FRAC_TOKEN", TEST_STAKEHOLDER, new BigDecimal("33.33"))
                .await().atMost(ASYNC_TIMEOUT);

        assertNotNull(binding);
        assertEquals(new BigDecimal("33.33"), binding.getPercentage());
    }

    @Test
    @Order(82)
    @DisplayName("Should preserve component token order in composite binding")
    void testCompositeTokenOrder() {
        String contractId = "ORDER_CONTRACT";
        List<String> orderedComponents = Arrays.asList("FIRST", "SECOND", "THIRD");

        TokenBinding binding = tokenBindingService.bindCompositeToken(
                contractId, "ORDERED_COMPOSITE", orderedComponents)
                .await().atMost(ASYNC_TIMEOUT);

        assertEquals("FIRST", binding.getComponentTokens().get(0));
        assertEquals("SECOND", binding.getComponentTokens().get(1));
        assertEquals("THIRD", binding.getComponentTokens().get(2));
    }

    @Test
    @Order(83)
    @DisplayName("Should handle whitespace in contract ID")
    void testWhitespaceContractId() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken("   ", TEST_TOKEN_ID, TEST_STAKEHOLDER)
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    @Test
    @Order(84)
    @DisplayName("Should handle whitespace in stakeholder")
    void testWhitespaceStakeholder() {
        assertThrows(TokenBindingException.class, () -> {
            tokenBindingService.bindPrimaryToken(TEST_CONTRACT_ID, TEST_TOKEN_ID, "   ")
                    .await().atMost(ASYNC_TIMEOUT);
        });
    }

    // ==========================================================================
    // All Token Types Tests
    // ==========================================================================

    @Test
    @Order(90)
    @DisplayName("Should verify all TokenType enum values exist")
    void testAllTokenTypes() {
        TokenType[] types = TokenType.values();

        assertEquals(6, types.length);
        assertTrue(Arrays.asList(types).contains(TokenType.PRIMARY));
        assertTrue(Arrays.asList(types).contains(TokenType.SECONDARY));
        assertTrue(Arrays.asList(types).contains(TokenType.COMPOSITE));
        assertTrue(Arrays.asList(types).contains(TokenType.GOVERNANCE));
        assertTrue(Arrays.asList(types).contains(TokenType.UTILITY));
        assertTrue(Arrays.asList(types).contains(TokenType.SECURITY));
    }

    @Test
    @Order(91)
    @DisplayName("Should verify all BindingStatus enum values exist")
    void testAllBindingStatuses() {
        BindingStatus[] statuses = BindingStatus.values();

        assertEquals(5, statuses.length);
        assertTrue(Arrays.asList(statuses).contains(BindingStatus.PENDING));
        assertTrue(Arrays.asList(statuses).contains(BindingStatus.ACTIVE));
        assertTrue(Arrays.asList(statuses).contains(BindingStatus.LOCKED));
        assertTrue(Arrays.asList(statuses).contains(BindingStatus.RELEASED));
        assertTrue(Arrays.asList(statuses).contains(BindingStatus.REVOKED));
    }

    // ==========================================================================
    // Integration-like Tests
    // ==========================================================================

    @Test
    @Order(100)
    @DisplayName("Should simulate complete token binding lifecycle")
    void testCompleteTokenBindingLifecycle() {
        String contractId = "LIFECYCLE_CONTRACT_001";

        // 1. Bind primary token
        TokenBinding primary = tokenBindingService.bindPrimaryToken(
                contractId, "LIFECYCLE_PRIMARY", TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        assertNotNull(primary);
        assertEquals(TokenType.PRIMARY, primary.getTokenType());
        assertEquals(BindingStatus.ACTIVE, primary.getStatus());

        // 2. Bind multiple secondary tokens
        TokenBinding secondary1 = tokenBindingService.bindSecondaryToken(
                contractId, "LIFECYCLE_SEC_1", "0xInvestor1", BigDecimal.valueOf(30))
                .await().atMost(ASYNC_TIMEOUT);
        TokenBinding secondary2 = tokenBindingService.bindSecondaryToken(
                contractId, "LIFECYCLE_SEC_2", "0xInvestor2", BigDecimal.valueOf(20))
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(TokenType.SECONDARY, secondary1.getTokenType());
        assertEquals(TokenType.SECONDARY, secondary2.getTokenType());

        // 3. Bind composite token
        TokenBinding composite = tokenBindingService.bindCompositeToken(
                contractId, "LIFECYCLE_COMPOSITE",
                Arrays.asList("BUNDLE_A", "BUNDLE_B", "BUNDLE_C"))
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(TokenType.COMPOSITE, composite.getTokenType());
        assertEquals(3, composite.getComponentTokens().size());

        // 4. Verify all bindings
        List<TokenBinding> allBindings = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertEquals(4, allBindings.size());

        // 5. Verify by type
        List<TokenBinding> primaryBindings = tokenBindingService.getTokenBindingsByType(
                contractId, TokenType.PRIMARY)
                .await().atMost(ASYNC_TIMEOUT);
        List<TokenBinding> secondaryBindings = tokenBindingService.getTokenBindingsByType(
                contractId, TokenType.SECONDARY)
                .await().atMost(ASYNC_TIMEOUT);
        List<TokenBinding> compositeBindings = tokenBindingService.getTokenBindingsByType(
                contractId, TokenType.COMPOSITE)
                .await().atMost(ASYNC_TIMEOUT);

        assertEquals(1, primaryBindings.size());
        assertEquals(2, secondaryBindings.size());
        assertEquals(1, compositeBindings.size());

        // 6. Verify ownership
        OwnershipVerification verification = tokenBindingService.verifyTokenOwnership(
                contractId, TEST_STAKEHOLDER)
                .await().atMost(ASYNC_TIMEOUT);
        assertTrue(verification.verified());

        // 7. Lock all tokens
        LockResult lockResult = tokenBindingService.lockTokens(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertTrue(lockResult.success());
        assertEquals(4, lockResult.lockedTokenIds().size());

        // 8. Verify locked status
        List<TokenBinding> lockedBindings = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertTrue(lockedBindings.stream().allMatch(b -> b.getStatus() == BindingStatus.LOCKED));

        // 9. Release tokens
        ReleaseResult releaseResult = tokenBindingService.releaseTokens(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertTrue(releaseResult.success());
        assertEquals(4, releaseResult.releasedTokenIds().size());

        // 10. Verify released status
        List<TokenBinding> releasedBindings = tokenBindingService.getTokenBindings(contractId)
                .await().atMost(ASYNC_TIMEOUT);
        assertTrue(releasedBindings.stream().allMatch(b -> b.getStatus() == BindingStatus.RELEASED));

        // 11. Check final metrics
        Map<String, Object> finalMetrics = tokenBindingService.getMetrics();
        assertTrue((Long) finalMetrics.get("bindingsCreated") >= 4);
        assertTrue((Long) finalMetrics.get("tokensLocked") >= 4);
        assertTrue((Long) finalMetrics.get("tokensReleased") >= 4);
    }
}
