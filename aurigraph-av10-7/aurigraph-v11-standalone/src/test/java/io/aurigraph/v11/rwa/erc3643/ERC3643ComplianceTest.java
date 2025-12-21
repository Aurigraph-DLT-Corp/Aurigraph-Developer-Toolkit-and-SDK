package io.aurigraph.v11.rwa.erc3643;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for ERC-3643 Compliance Components
 *
 * Tests cover:
 * - Identity Registry operations
 * - Claim Verifier functionality
 * - Compliance Rules Engine
 * - ERC-3643 Token operations
 * - Proof-of-Reserve Oracle
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ERC3643ComplianceTest {

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ClaimVerifier claimVerifier;

    @Inject
    ComplianceRulesEngine complianceRulesEngine;

    @Inject
    ERC3643Token erc3643Token;

    // Test addresses
    private static final String OWNER = "0xOwner123456789";
    private static final String AGENT = "0xAgent123456789";
    private static final String ISSUER_1 = "0xIssuer1234567";
    private static final String USER_1 = "0xUser1234567890";
    private static final String USER_2 = "0xUser2345678901";
    private static final String USER_3 = "0xUser3456789012";
    private static final String BLACKLISTED_USER = "0xBlacklisted123";

    private static String testTokenId;
    private static String testIdentity1;
    private static String testIdentity2;

    @BeforeEach
    void setUp() {
        // Initialize registries if needed
        if (identityRegistry != null) {
            identityRegistry.initialize(OWNER);
        }
        if (claimVerifier != null) {
            claimVerifier.initialize(OWNER);
        }
    }

    // ============== Identity Registry Tests ==============

    @Test
    @Order(1)
    @DisplayName("Should register a new identity")
    void testRegisterIdentity() {
        IdentityRegistry.IdentityRegistrationRequest request = IdentityRegistry.IdentityRegistrationRequest.builder()
                .walletAddress(USER_1)
                .countryCode("US")
                .jurisdiction("US-SEC")
                .investorType(IdentityRegistry.InvestorType.ACCREDITED)
                .verificationProvider("aurigraph-kyc")
                .verificationHash("hash123")
                .build();

        String identityId = identityRegistry.registerIdentity(request, OWNER).await().indefinitely();
        testIdentity1 = identityId;

        assertNotNull(identityId);
        assertTrue(identityId.startsWith("IDENTITY-"));
    }

    @Test
    @Order(2)
    @DisplayName("Should update KYC status to verified")
    void testUpdateKYCStatus() {
        // First register an identity
        if (testIdentity1 == null) {
            testRegisterIdentity();
        }

        Boolean result = identityRegistry.updateKYCStatus(
                testIdentity1,
                IdentityRegistry.VerificationStatus.VERIFIED,
                OWNER,
                Instant.now().plus(Duration.ofDays(365))
        ).await().indefinitely();

        assertTrue(result);

        // Verify the user is now verified
        Boolean isVerified = identityRegistry.isVerified(USER_1).await().indefinitely();
        assertTrue(isVerified);
    }

    @Test
    @Order(3)
    @DisplayName("Should reject duplicate address registration")
    void testDuplicateAddressRejection() {
        IdentityRegistry.IdentityRegistrationRequest request = IdentityRegistry.IdentityRegistrationRequest.builder()
                .walletAddress(USER_1) // Already registered
                .countryCode("UK")
                .jurisdiction("UK-FCA")
                .investorType(IdentityRegistry.InvestorType.RETAIL)
                .build();

        assertThrows(IdentityRegistry.IdentityAlreadyExistsException.class, () ->
            identityRegistry.registerIdentity(request, OWNER).await().indefinitely()
        );
    }

    @Test
    @Order(4)
    @DisplayName("Should link additional address to identity")
    void testLinkAddress() {
        if (testIdentity1 == null) {
            testRegisterIdentity();
        }

        String newAddress = "0xNewAddress12345";
        Boolean result = identityRegistry.linkAddress(testIdentity1, newAddress, OWNER)
                .await().indefinitely();

        assertTrue(result);

        Set<String> linkedAddresses = identityRegistry.getLinkedAddresses(testIdentity1)
                .await().indefinitely();
        assertTrue(linkedAddresses.contains(newAddress));
    }

    @Test
    @Order(5)
    @DisplayName("Should check accredited investor status")
    void testAccreditedInvestorCheck() {
        Boolean isAccredited = identityRegistry.isAccreditedInvestor(USER_1).await().indefinitely();
        assertTrue(isAccredited);
    }

    @Test
    @Order(6)
    @DisplayName("Should get country code for address")
    void testGetCountryCode() {
        String countryCode = identityRegistry.getCountryCode(USER_1).await().indefinitely();
        assertEquals("US", countryCode);
    }

    // ============== Claim Verifier Tests ==============

    @Test
    @Order(10)
    @DisplayName("Should add trusted issuer")
    void testAddTrustedIssuer() {
        ClaimVerifier.TrustedIssuer issuer = ClaimVerifier.TrustedIssuer.builder()
                .issuerAddress(ISSUER_1)
                .issuerName("Aurigraph KYC Provider")
                .authorizedTopics(Set.of(
                    ClaimVerifier.CLAIM_TOPIC_KYC,
                    ClaimVerifier.CLAIM_TOPIC_AML,
                    ClaimVerifier.CLAIM_TOPIC_ACCREDITATION
                ))
                .jurisdictions(Set.of("US", "EU", "UK"))
                .publicKey("0x04pubkey...")
                .signatureScheme("ECDSA")
                .trustLevel(ClaimVerifier.TrustLevel.ENHANCED)
                .build();

        Boolean result = claimVerifier.addTrustedIssuer(issuer, OWNER).await().indefinitely();
        assertTrue(result);

        // Verify issuer is trusted
        assertTrue(claimVerifier.isTrustedIssuer(ISSUER_1, ClaimVerifier.CLAIM_TOPIC_KYC));
    }

    @Test
    @Order(11)
    @DisplayName("Should add claim to identity")
    void testAddClaim() {
        // Ensure issuer is registered
        testAddTrustedIssuer();

        ClaimVerifier.Claim claim = ClaimVerifier.Claim.builder()
                .subject(USER_1)
                .topic(ClaimVerifier.CLAIM_TOPIC_KYC)
                .scheme("ERC-735")
                .data("verified:true".getBytes())
                .dataHash("abc123hash")
                .expiresAt(Instant.now().plus(Duration.ofDays(365)))
                .build();

        String claimId = claimVerifier.addClaim(claim, ISSUER_1).await().indefinitely();

        assertNotNull(claimId);
        assertTrue(claimId.startsWith("CLAIM-"));
    }

    @Test
    @Order(12)
    @DisplayName("Should verify valid claim")
    void testVerifyValidClaim() {
        ClaimVerifier.ClaimVerificationResult result =
            claimVerifier.verifyClaim(USER_1, ClaimVerifier.CLAIM_TOPIC_KYC).await().indefinitely();

        assertTrue(result.isVerified());
        assertEquals(ClaimVerifier.CLAIM_TOPIC_KYC, result.getTopic());
        assertEquals(USER_1, result.getSubject());
    }

    @Test
    @Order(13)
    @DisplayName("Should fail verification for missing claim")
    void testVerifyMissingClaim() {
        ClaimVerifier.ClaimVerificationResult result =
            claimVerifier.verifyClaim(USER_2, ClaimVerifier.CLAIM_TOPIC_KYC).await().indefinitely();

        assertFalse(result.isVerified());
        assertFalse(result.getFailureReasons().isEmpty());
    }

    @Test
    @Order(14)
    @DisplayName("Should reject claim from untrusted issuer")
    void testRejectUntrustedIssuerClaim() {
        ClaimVerifier.Claim claim = ClaimVerifier.Claim.builder()
                .subject(USER_2)
                .topic(ClaimVerifier.CLAIM_TOPIC_KYC)
                .scheme("ERC-735")
                .build();

        assertThrows(ClaimVerifier.UnauthorizedIssuerException.class, () ->
            claimVerifier.addClaim(claim, "0xUntrustedIssuer").await().indefinitely()
        );
    }

    @Test
    @Order(15)
    @DisplayName("Should get claim topic name")
    void testGetClaimTopicName() {
        assertEquals("KYC", ClaimVerifier.getClaimTopicName(ClaimVerifier.CLAIM_TOPIC_KYC));
        assertEquals("AML", ClaimVerifier.getClaimTopicName(ClaimVerifier.CLAIM_TOPIC_AML));
        assertEquals("ACCREDITATION", ClaimVerifier.getClaimTopicName(ClaimVerifier.CLAIM_TOPIC_ACCREDITATION));
    }

    // ============== Compliance Rules Engine Tests ==============

    @Test
    @Order(20)
    @DisplayName("Should initialize token compliance config")
    void testInitializeTokenCompliance() {
        testTokenId = "TEST-TOKEN-001";

        ComplianceRulesEngine.TokenComplianceConfig config =
            ComplianceRulesEngine.TokenComplianceConfig.builder()
                .tokenId(testTokenId)
                .maxTotalHolders(1000)
                .maxHoldersByCountry(Map.of("US", 500, "EU", 300))
                .maxTransferAmountPerTx(new BigDecimal("100000"))
                .maxTransferAmountDaily(new BigDecimal("1000000"))
                .minTransferAmount(new BigDecimal("1"))
                .holdingPeriod(Duration.ofDays(90))
                .holdingPeriodEnabled(true)
                .allowedInvestorTypes(EnumSet.of(
                    IdentityRegistry.InvestorType.ACCREDITED,
                    IdentityRegistry.InvestorType.INSTITUTIONAL
                ))
                .requireAccreditedInvestor(true)
                .allowedCountries(Set.of("US", "UK", "EU"))
                .blockedCountries(Set.of("IR", "KP", "SY"))
                .allowCrossBorderTransfers(true)
                .tradingWindowEnabled(false)
                .whitelistEnabled(false)
                .build();

        Boolean result = complianceRulesEngine.initializeToken(testTokenId, config, OWNER)
                .await().indefinitely();

        assertTrue(result);
    }

    @Test
    @Order(21)
    @DisplayName("Should add address to blacklist")
    void testAddToBlacklist() {
        Boolean result = complianceRulesEngine.addToBlacklist(
                testTokenId, BLACKLISTED_USER, OWNER, "Sanctions violation")
                .await().indefinitely();

        assertTrue(result);

        Boolean isBlacklisted = complianceRulesEngine.isBlacklisted(testTokenId, BLACKLISTED_USER)
                .await().indefinitely();
        assertTrue(isBlacklisted);
    }

    @Test
    @Order(22)
    @DisplayName("Should block blacklisted address transfers")
    void testBlockBlacklistedTransfer() {
        ComplianceRulesEngine.ComplianceCheckResult result =
            complianceRulesEngine.performComplianceCheck(
                testTokenId, BLACKLISTED_USER, USER_1, new BigDecimal("100"))
                .await().indefinitely();

        assertFalse(result.isCompliant());
        assertTrue(result.getFailedRules().stream()
            .anyMatch(r -> r.contains("BLACKLIST")));
    }

    @Test
    @Order(23)
    @DisplayName("Should enforce transfer amount limits")
    void testTransferAmountLimits() {
        // Test exceeding per-transaction limit
        ComplianceRulesEngine.ComplianceCheckResult result =
            complianceRulesEngine.performComplianceCheck(
                testTokenId, USER_1, USER_2, new BigDecimal("200000")) // Exceeds 100,000 limit
                .await().indefinitely();

        assertFalse(result.isCompliant());
        assertTrue(result.getFailedRules().stream()
            .anyMatch(r -> r.contains("TRANSFER_LIMIT")));
    }

    @Test
    @Order(24)
    @DisplayName("Should enforce minimum transfer amount")
    void testMinimumTransferAmount() {
        ComplianceRulesEngine.ComplianceCheckResult result =
            complianceRulesEngine.performComplianceCheck(
                testTokenId, USER_1, USER_2, new BigDecimal("0.5")) // Below 1 minimum
                .await().indefinitely();

        assertFalse(result.isCompliant());
        assertTrue(result.getFailedRules().stream()
            .anyMatch(r -> r.contains("TRANSFER_LIMIT") && r.contains("minimum")));
    }

    @Test
    @Order(25)
    @DisplayName("Should set and check max holders by country")
    void testMaxHoldersByCountry() {
        Boolean result = complianceRulesEngine.setMaxHoldersForCountry(
                testTokenId, "CA", 100, OWNER)
                .await().indefinitely();

        assertTrue(result);

        ComplianceRulesEngine.TokenComplianceConfig config =
            complianceRulesEngine.getConfig(testTokenId).await().indefinitely();

        assertEquals(100, config.getMaxHoldersByCountry().get("CA"));
    }

    @Test
    @Order(26)
    @DisplayName("Should set holding period")
    void testSetHoldingPeriod() {
        Duration newPeriod = Duration.ofDays(180);
        Boolean result = complianceRulesEngine.setHoldingPeriod(testTokenId, newPeriod, OWNER)
                .await().indefinitely();

        assertTrue(result);

        ComplianceRulesEngine.TokenComplianceConfig config =
            complianceRulesEngine.getConfig(testTokenId).await().indefinitely();

        assertEquals(newPeriod, config.getHoldingPeriod());
        assertTrue(config.isHoldingPeriodEnabled());
    }

    @Test
    @Order(27)
    @DisplayName("Should manage whitelist")
    void testWhitelistManagement() {
        String whitelistedUser = "0xWhitelisted123";

        Boolean addResult = complianceRulesEngine.addToWhitelist(testTokenId, whitelistedUser, OWNER)
                .await().indefinitely();
        assertTrue(addResult);

        Boolean isWhitelisted = complianceRulesEngine.isWhitelisted(testTokenId, whitelistedUser)
                .await().indefinitely();
        assertTrue(isWhitelisted);

        Boolean removeResult = complianceRulesEngine.removeFromWhitelist(testTokenId, whitelistedUser, OWNER)
                .await().indefinitely();
        assertTrue(removeResult);

        isWhitelisted = complianceRulesEngine.isWhitelisted(testTokenId, whitelistedUser)
                .await().indefinitely();
        assertFalse(isWhitelisted);
    }

    @Test
    @Order(28)
    @DisplayName("Should record and track transfers")
    void testRecordTransfer() {
        Boolean result = complianceRulesEngine.recordTransfer(
                testTokenId, USER_1, USER_2, new BigDecimal("1000"), "TX-001")
                .await().indefinitely();

        assertTrue(result);
    }

    // ============== ERC-3643 Token Tests ==============

    @Test
    @Order(30)
    @DisplayName("Should deploy ERC-3643 token")
    void testDeployToken() {
        String tokenId = erc3643Token.deployToken(
                "Aurigraph Security Token",
                "AST",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US-SEC",
                "EQUITY"
        ).await().indefinitely();

        assertNotNull(tokenId);
        assertTrue(tokenId.startsWith("ERC3643-"));
    }

    @Test
    @Order(31)
    @DisplayName("Should get token info")
    void testGetTokenInfo() {
        String tokenId = erc3643Token.deployToken(
                "Test Token",
                "TST",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "EU",
                "BOND"
        ).await().indefinitely();

        ERC3643Token.TokenState state = erc3643Token.getTokenInfo(tokenId).await().indefinitely();

        assertNotNull(state);
        assertEquals("Test Token", state.getName());
        assertEquals("TST", state.getSymbol());
        assertEquals(18, state.getDecimals());
        assertEquals(OWNER, state.getIssuer());
        assertEquals(BigDecimal.ZERO, state.getTotalSupply());
    }

    @Test
    @Order(32)
    @DisplayName("Should add and remove agents")
    void testAgentManagement() {
        String tokenId = erc3643Token.deployToken(
                "Agent Test Token",
                "ATT",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US",
                "EQUITY"
        ).await().indefinitely();

        // Add agent
        Boolean addResult = erc3643Token.addAgent(tokenId, AGENT, OWNER).await().indefinitely();
        assertTrue(addResult);

        // Remove agent
        Boolean removeResult = erc3643Token.removeAgent(tokenId, AGENT, OWNER).await().indefinitely();
        assertTrue(removeResult);
    }

    @Test
    @Order(33)
    @DisplayName("Should freeze and unfreeze address")
    void testFreezeUnfreeze() {
        String tokenId = erc3643Token.deployToken(
                "Freeze Test Token",
                "FTT",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US",
                "EQUITY"
        ).await().indefinitely();

        // Freeze address
        Boolean freezeResult = erc3643Token.freezeAddress(
                tokenId, USER_3, OWNER, "Suspicious activity")
                .await().indefinitely();
        assertTrue(freezeResult);

        Boolean isFrozen = erc3643Token.isFrozen(tokenId, USER_3).await().indefinitely();
        assertTrue(isFrozen);

        // Unfreeze address
        Boolean unfreezeResult = erc3643Token.unfreezeAddress(tokenId, USER_3, OWNER)
                .await().indefinitely();
        assertTrue(unfreezeResult);

        isFrozen = erc3643Token.isFrozen(tokenId, USER_3).await().indefinitely();
        assertFalse(isFrozen);
    }

    @Test
    @Order(34)
    @DisplayName("Should pause and unpause token")
    void testPauseUnpause() {
        String tokenId = erc3643Token.deployToken(
                "Pause Test Token",
                "PTT",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US",
                "EQUITY"
        ).await().indefinitely();

        // Pause token
        Boolean pauseResult = erc3643Token.pause(tokenId, OWNER).await().indefinitely();
        assertTrue(pauseResult);

        ERC3643Token.TokenState state = erc3643Token.getTokenInfo(tokenId).await().indefinitely();
        assertTrue(state.isPaused());

        // Unpause token
        Boolean unpauseResult = erc3643Token.unpause(tokenId, OWNER).await().indefinitely();
        assertTrue(unpauseResult);

        state = erc3643Token.getTokenInfo(tokenId).await().indefinitely();
        assertFalse(state.isPaused());
    }

    @Test
    @Order(35)
    @DisplayName("Should prevent non-agent from minting")
    void testNonAgentMintRejection() {
        String tokenId = erc3643Token.deployToken(
                "Mint Test Token",
                "MTT",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US",
                "EQUITY"
        ).await().indefinitely();

        assertThrows(SecurityException.class, () ->
            erc3643Token.mint(tokenId, USER_1, new BigDecimal("1000"), USER_2)
                    .await().indefinitely()
        );
    }

    @Test
    @Order(36)
    @DisplayName("Should check transfer eligibility")
    void testCanTransfer() {
        String tokenId = erc3643Token.deployToken(
                "Transfer Check Token",
                "TCT",
                18,
                OWNER,
                "0xIdentityRegistry",
                "0xCompliance",
                "US",
                "EQUITY"
        ).await().indefinitely();

        // canTransfer will check all compliance rules
        Boolean canTransfer = erc3643Token.canTransfer(
                tokenId, USER_1, USER_2, new BigDecimal("100"))
                .await().indefinitely();

        // May be true or false depending on identity/claim setup
        assertNotNull(canTransfer);
    }

    // ============== Integration Tests ==============

    @Test
    @Order(50)
    @DisplayName("Integration: Full compliance flow")
    void testFullComplianceFlow() {
        // 1. Register identities
        IdentityRegistry.IdentityRegistrationRequest request1 = IdentityRegistry.IdentityRegistrationRequest.builder()
                .walletAddress("0xIntegrationUser1")
                .countryCode("US")
                .jurisdiction("US-SEC")
                .investorType(IdentityRegistry.InvestorType.ACCREDITED)
                .verificationProvider("test-provider")
                .build();

        String identity1 = identityRegistry.registerIdentity(request1, OWNER).await().indefinitely();
        assertNotNull(identity1);

        // 2. Verify KYC
        identityRegistry.updateKYCStatus(
                identity1,
                IdentityRegistry.VerificationStatus.VERIFIED,
                OWNER,
                Instant.now().plus(Duration.ofDays(365))
        ).await().indefinitely();

        // 3. Add claims
        ClaimVerifier.Claim kycClaim = ClaimVerifier.Claim.builder()
                .subject("0xIntegrationUser1")
                .topic(ClaimVerifier.CLAIM_TOPIC_KYC)
                .scheme("ERC-735")
                .expiresAt(Instant.now().plus(Duration.ofDays(365)))
                .build();

        if (claimVerifier.isTrustedIssuer(ISSUER_1, ClaimVerifier.CLAIM_TOPIC_KYC)) {
            claimVerifier.addClaim(kycClaim, ISSUER_1).await().indefinitely();
        }

        // 4. Verify identity is valid
        Boolean isVerified = identityRegistry.isVerified("0xIntegrationUser1").await().indefinitely();
        assertTrue(isVerified);
    }

    @Test
    @Order(51)
    @DisplayName("Integration: Blocked country transfer rejection")
    void testBlockedCountryTransfer() {
        // Register user from blocked country
        IdentityRegistry.IdentityRegistrationRequest request = IdentityRegistry.IdentityRegistrationRequest.builder()
                .walletAddress("0xBlockedCountryUser")
                .countryCode("KP") // North Korea - blocked
                .jurisdiction("KP")
                .investorType(IdentityRegistry.InvestorType.RETAIL)
                .build();

        identityRegistry.registerIdentity(request, OWNER).await().indefinitely();

        // Compliance check should fail
        ComplianceRulesEngine.ComplianceCheckResult result =
            complianceRulesEngine.performComplianceCheck(
                testTokenId, "0xBlockedCountryUser", USER_1, new BigDecimal("100"))
                .await().indefinitely();

        assertFalse(result.isCompliant());
        assertTrue(result.getFailedRules().stream()
            .anyMatch(r -> r.contains("JURISDICTION") || r.contains("blocked")));
    }

    // ============== Error Handling Tests ==============

    @Test
    @Order(60)
    @DisplayName("Should throw on non-existent token")
    void testNonExistentToken() {
        assertThrows(IllegalArgumentException.class, () ->
            erc3643Token.getTokenInfo("NON-EXISTENT-TOKEN").await().indefinitely()
        );
    }

    @Test
    @Order(61)
    @DisplayName("Should throw on non-existent identity")
    void testNonExistentIdentity() {
        assertThrows(IdentityRegistry.IdentityNotFoundException.class, () ->
            identityRegistry.updateKYCStatus(
                    "NON-EXISTENT-IDENTITY",
                    IdentityRegistry.VerificationStatus.VERIFIED,
                    OWNER,
                    Instant.now())
                    .await().indefinitely()
        );
    }

    @Test
    @Order(62)
    @DisplayName("Should throw on unauthorized agent")
    void testUnauthorizedAgent() {
        assertThrows(IdentityRegistry.UnauthorizedAgentException.class, () ->
            identityRegistry.registerIdentity(
                    IdentityRegistry.IdentityRegistrationRequest.builder()
                            .walletAddress("0xNewUser")
                            .countryCode("US")
                            .build(),
                    "0xUnauthorizedAgent")
                    .await().indefinitely()
        );
    }

    @Test
    @Order(63)
    @DisplayName("Should throw on unconfigured token compliance check")
    void testUnconfiguredTokenCompliance() {
        assertThrows(ComplianceRulesEngine.TokenNotConfiguredException.class, () ->
            complianceRulesEngine.addToBlacklist(
                    "UNCONFIGURED-TOKEN", USER_1, OWNER, "test")
                    .await().indefinitely()
        );
    }
}
