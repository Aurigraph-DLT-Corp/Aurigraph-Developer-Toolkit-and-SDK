package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractParty;
import io.aurigraph.v11.contracts.models.ContractSignature;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive Test Suite for VVB Verification Service
 *
 * Tests cover:
 * - Submit contract for VVB review
 * - Get verification status
 * - Approve verification
 * - Reject verification
 * - Get pending verifications
 * - Verifier registration
 * - State flow (FULLY_SIGNED -> VVB_REVIEW -> VVB_APPROVED/VVB_REJECTED ->
 * ACTIVE)
 *
 * @version 1.0.0
 * @author Aurigraph V11 Development Team
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class VVBVerificationServiceTest {

    @Inject
    VVBVerificationService vvbVerificationService;

    @InjectMock
    ActiveContractService contractService;

    private static final String TEST_CONTRACT_ID = "TEST-CONTRACT-001";
    private static final String TEST_VVB_ID = "VVB-TEST-001";
    private static final String TEST_OWNER = "owner@test.com";

    private ActiveContract testContract;

    @BeforeEach
    void setUp() {
        // Create a fully signed test contract
        testContract = createFullySignedContract();

        // Mock the contract service to return our test contract
        when(contractService.getContract(TEST_CONTRACT_ID))
                .thenReturn(Uni.createFrom().item(testContract));
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private ActiveContract createFullySignedContract() {
        ActiveContract contract = new ActiveContract();
        contract.setContractId(TEST_CONTRACT_ID);
        contract.setName("Test VVB Contract");
        contract.setContractType("CARBON_CREDIT");
        contract.setOwner(TEST_OWNER);
        contract.setLegalText("Legal terms and conditions for carbon credit trading...");
        contract.setExecutableCode("function validateCarbonCredit() { return true; }");

        // Add parties that require signatures
        ContractParty buyer = ContractParty.builder()
                .partyId("BUYER_001")
                .name("Carbon Buyer Corp")
                .address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
                .role("BUYER")
                .signatureRequired(true)
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        ContractParty seller = ContractParty.builder()
                .partyId("SELLER_001")
                .name("Green Energy Inc")
                .address("0x8a91DC2D28B689474298D91899f0c1baF62cB85E")
                .role("SELLER")
                .signatureRequired(true)
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        contract.addParty(buyer);
        contract.addParty(seller);

        // Add signatures to make it fully signed
        ContractSignature buyerSig = new ContractSignature(buyer.getAddress(), "0xBUYER_SIGNATURE");
        buyerSig.setPartyId(buyer.getPartyId());
        contract.addSignature(buyerSig);

        ContractSignature sellerSig = new ContractSignature(seller.getAddress(), "0xSELLER_SIGNATURE");
        sellerSig.setPartyId(seller.getPartyId());
        contract.addSignature(sellerSig);

        return contract;
    }

    private ActiveContract createUnsignedContract() {
        ActiveContract contract = new ActiveContract();
        contract.setContractId("UNSIGNED-CONTRACT-001");
        contract.setName("Unsigned Contract");
        contract.setContractType("REAL_ESTATE");
        contract.setOwner(TEST_OWNER);
        contract.setLegalText("Legal terms for unsigned contract");
        contract.setExecutableCode("function execute() { }");

        ContractParty party = ContractParty.builder()
                .partyId("PARTY_001")
                .name("Test Party")
                .address("0x1234567890abcdef")
                .role("OWNER")
                .signatureRequired(true)
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        contract.addParty(party);
        // No signatures added - contract is not fully signed
        return contract;
    }

    private VVBVerificationService.VVBAttestationRequest createAttestationRequest() {
        VVBVerificationService.VVBAttestationRequest request = new VVBVerificationService.VVBAttestationRequest();
        request.setScope("Carbon Credit Verification - Scope 1, 2, 3 emissions");
        request.setFindings("All carbon credits verified and compliant with standards");
        request.setRecommendations("Recommend approval for trading on carbon markets");
        return request;
    }

    // ==========================================================================
    // Submit for VVB Review Tests
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("Should submit fully signed contract for VVB review")
    void testSubmitForReview() {
        VVBVerificationService.VVBReview review = vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertNotNull(review);
        assertNotNull(review.getReviewId());
        assertTrue(review.getReviewId().startsWith("VVB-REV-"));
        assertEquals(TEST_CONTRACT_ID, review.getContractId());
        assertEquals(VVBVerificationService.VVBReviewStatus.PENDING, review.getStatus());
        assertNotNull(review.getSubmittedAt());
        assertEquals("Test VVB Contract", review.getContractName());
        assertEquals("CARBON_CREDIT", review.getContractType());
    }

    @Test
    @Order(2)
    @DisplayName("Should reject submission for unsigned contract")
    void testSubmitForReviewUnsignedContract() {
        ActiveContract unsignedContract = createUnsignedContract();
        when(contractService.getContract("UNSIGNED-CONTRACT-001"))
                .thenReturn(Uni.createFrom().item(unsignedContract));

        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.submitForReview("UNSIGNED-CONTRACT-001")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(3)
    @DisplayName("Should reject duplicate submission for contract already under review")
    void testDuplicateSubmission() {
        // First submission should succeed
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Second submission should fail
        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Get Verification Status Tests
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("Should get verification status for existing review")
    void testGetReviewStatus() {
        // First submit for review
        VVBVerificationService.VVBReview submitted = vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Then get status
        VVBVerificationService.VVBReview status = vvbVerificationService.getReviewStatus(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertNotNull(status);
        assertEquals(submitted.getReviewId(), status.getReviewId());
        assertEquals(VVBVerificationService.VVBReviewStatus.PENDING, status.getStatus());
    }

    @Test
    @Order(11)
    @DisplayName("Should throw exception for non-existent review")
    void testGetStatusForNonExistentReview() {
        assertThrows(VVBVerificationService.VVBReviewNotFoundException.class, () -> {
            vvbVerificationService.getReviewStatus("NON-EXISTENT-CONTRACT")
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Approve Verification Tests
    // ==========================================================================

    @Test
    @Order(20)
    @DisplayName("Should approve verification and create attestation")
    void testApproveVerification() {
        // Submit for review first
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Approve the verification
        VVBVerificationService.VVBAttestationRequest attestation = createAttestationRequest();
        VVBVerificationService.VVBReview review = vvbVerificationService
                .approve(TEST_CONTRACT_ID, TEST_VVB_ID, attestation)
                .await().indefinitely();

        assertNotNull(review);
        assertEquals(VVBVerificationService.VVBReviewStatus.APPROVED, review.getStatus());
        assertNotNull(review.getReviewedAt());
        assertEquals(TEST_VVB_ID, review.getReviewedBy());
        assertNotNull(review.getAttestationId());
        assertTrue(review.getAttestationId().startsWith("VVB-ATT-"));
    }

    @Test
    @Order(21)
    @DisplayName("Should create valid attestation on approval")
    void testAttestationCreation() {
        // Submit and approve
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        VVBVerificationService.VVBAttestationRequest attestationRequest = createAttestationRequest();
        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, attestationRequest)
                .await().indefinitely();

        // Get attestation
        VVBVerificationService.VVBAttestation attestation = vvbVerificationService.getAttestation(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertNotNull(attestation);
        assertEquals(TEST_CONTRACT_ID, attestation.getContractId());
        assertEquals(TEST_VVB_ID, attestation.getVvbId());
        assertTrue(attestation.isValid());
        assertNotNull(attestation.getIssuedAt());
        assertNotNull(attestation.getValidUntil());
        assertTrue(attestation.getValidUntil().isAfter(attestation.getIssuedAt()));
        assertEquals(attestationRequest.getScope(), attestation.getScope());
        assertEquals(attestationRequest.getFindings(), attestation.getFindings());
        assertNotNull(attestation.getSignature());
        assertTrue(attestation.getSignature().startsWith("VVB-SIG-"));
    }

    @Test
    @Order(22)
    @DisplayName("Should reject approval for already approved contract")
    void testApproveAlreadyApproved() {
        // Submit and approve
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();

        // Try to approve again
        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                    .await().indefinitely();
        });
    }

    @Test
    @Order(23)
    @DisplayName("Should reject approval for contract without review")
    void testApproveWithoutReview() {
        assertThrows(VVBVerificationService.VVBReviewNotFoundException.class, () -> {
            vvbVerificationService.approve("NO-REVIEW-CONTRACT", TEST_VVB_ID, createAttestationRequest())
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Reject Verification Tests
    // ==========================================================================

    @Test
    @Order(30)
    @DisplayName("Should reject verification with reason")
    void testRejectVerification() {
        // Submit for review first
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        String rejectionReason = "Carbon credits do not meet verification standards";
        VVBVerificationService.VVBReview review = vvbVerificationService
                .reject(TEST_CONTRACT_ID, TEST_VVB_ID, rejectionReason)
                .await().indefinitely();

        assertNotNull(review);
        assertEquals(VVBVerificationService.VVBReviewStatus.REJECTED, review.getStatus());
        assertNotNull(review.getReviewedAt());
        assertEquals(TEST_VVB_ID, review.getReviewedBy());
        assertEquals(rejectionReason, review.getRejectionReason());
    }

    @Test
    @Order(31)
    @DisplayName("Should reject rejection for already rejected contract")
    void testRejectAlreadyRejected() {
        // Submit and reject
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, "First rejection")
                .await().indefinitely();

        // Try to reject again
        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, "Second rejection")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(32)
    @DisplayName("Should reject rejection for approved contract")
    void testRejectAfterApproval() {
        // Submit and approve
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();

        // Try to reject
        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, "Late rejection")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(33)
    @DisplayName("Cannot approve rejected contract - must submit new review")
    void testApproveAfterRejection() {
        // Submit and reject
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, "Initial rejection")
                .await().indefinitely();

        // Try to approve
        assertThrows(VVBVerificationService.VVBVerificationException.class, () -> {
            vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Verifier Registration Tests
    // ==========================================================================

    @Test
    @Order(40)
    @DisplayName("Should register VVB entity")
    void testRegisterVVB() {
        VVBVerificationService.VVBEntity vvb = vvbVerificationService.registerVVB(
                "VVB-CARBON-001",
                "Carbon Credit Verification Authority",
                VVBVerificationService.VVBType.CARBON_CREDIT);

        assertNotNull(vvb);
        assertEquals("VVB-CARBON-001", vvb.getVvbId());
        assertEquals("Carbon Credit Verification Authority", vvb.getName());
        assertEquals(VVBVerificationService.VVBType.CARBON_CREDIT, vvb.getType());
        assertTrue(vvb.isActive());
        assertNotNull(vvb.getRegisteredAt());
    }

    @Test
    @Order(41)
    @DisplayName("Should register VVBs of different types")
    @ParameterizedTest
    @EnumSource(VVBVerificationService.VVBType.class)
    void testRegisterVVBAllTypes(VVBVerificationService.VVBType type) {
        String vvbId = "VVB-" + type.name() + "-001";
        VVBVerificationService.VVBEntity vvb = vvbVerificationService.registerVVB(
                vvbId,
                type.name() + " Verification Body",
                type);

        assertNotNull(vvb);
        assertEquals(type, vvb.getType());
    }

    @Test
    @Order(42)
    @DisplayName("Should get all registered VVBs")
    void testGetRegisteredVVBs() {
        // Register multiple VVBs
        vvbVerificationService.registerVVB("VVB-A", "VVB Alpha", VVBVerificationService.VVBType.GENERAL);
        vvbVerificationService.registerVVB("VVB-B", "VVB Beta", VVBVerificationService.VVBType.CARBON_CREDIT);
        vvbVerificationService.registerVVB("VVB-C", "VVB Gamma", VVBVerificationService.VVBType.REAL_ESTATE);

        List<VVBVerificationService.VVBEntity> vvbs = vvbVerificationService.getRegisteredVVBs();

        assertNotNull(vvbs);
        assertTrue(vvbs.size() >= 3);
    }

    @Test
    @Order(43)
    @DisplayName("Should auto-register VVB during approval if not registered")
    void testAutoRegisterVVB() {
        // Submit for review
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Approve with unregistered VVB - should auto-register
        String newVvbId = "VVB-AUTO-" + UUID.randomUUID().toString().substring(0, 8);
        vvbVerificationService.approve(TEST_CONTRACT_ID, newVvbId, createAttestationRequest())
                .await().indefinitely();

        // Verify VVB was auto-registered
        List<VVBVerificationService.VVBEntity> vvbs = vvbVerificationService.getRegisteredVVBs();
        boolean found = vvbs.stream().anyMatch(v -> v.getVvbId().equals(newVvbId));
        assertTrue(found);
    }

    // ==========================================================================
    // Metrics Tests
    // ==========================================================================

    @Test
    @Order(50)
    @DisplayName("Should track verification metrics")
    void testMetrics() {
        Map<String, Object> metrics = vvbVerificationService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.containsKey("reviewsSubmitted"));
        assertTrue(metrics.containsKey("reviewsApproved"));
        assertTrue(metrics.containsKey("reviewsRejected"));
        assertTrue(metrics.containsKey("pendingReviews"));
        assertTrue(metrics.containsKey("totalAttestations"));
        assertTrue(metrics.containsKey("registeredVVBs"));
    }

    @Test
    @Order(51)
    @DisplayName("Should update metrics on submit")
    void testMetricsOnSubmit() {
        long initialSubmitted = (long) vvbVerificationService.getMetrics().get("reviewsSubmitted");

        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        long afterSubmit = (long) vvbVerificationService.getMetrics().get("reviewsSubmitted");
        assertEquals(initialSubmitted + 1, afterSubmit);
    }

    @Test
    @Order(52)
    @DisplayName("Should update metrics on approval")
    void testMetricsOnApproval() {
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        long initialApproved = (long) vvbVerificationService.getMetrics().get("reviewsApproved");

        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();

        long afterApproval = (long) vvbVerificationService.getMetrics().get("reviewsApproved");
        assertEquals(initialApproved + 1, afterApproval);
    }

    @Test
    @Order(53)
    @DisplayName("Should update metrics on rejection")
    void testMetricsOnRejection() {
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        long initialRejected = (long) vvbVerificationService.getMetrics().get("reviewsRejected");

        vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, "Test rejection")
                .await().indefinitely();

        long afterRejection = (long) vvbVerificationService.getMetrics().get("reviewsRejected");
        assertEquals(initialRejected + 1, afterRejection);
    }

    // ==========================================================================
    // Attestation Tests
    // ==========================================================================

    @Test
    @Order(60)
    @DisplayName("Should throw exception for non-existent attestation")
    void testGetNonExistentAttestation() {
        assertThrows(VVBVerificationService.VVBAttestationNotFoundException.class, () -> {
            vvbVerificationService.getAttestation("NON-EXISTENT-CONTRACT")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(61)
    @DisplayName("Attestation should be valid for one year")
    void testAttestationValidity() {
        // Submit and approve
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();

        VVBVerificationService.VVBAttestation attestation = vvbVerificationService.getAttestation(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Verify validity period is approximately one year
        long validityDays = java.time.Duration.between(attestation.getIssuedAt(), attestation.getValidUntil()).toDays();
        assertTrue(validityDays >= 364 && validityDays <= 366); // Account for leap years
    }

    // ==========================================================================
    // State Flow Tests
    // ==========================================================================

    @Test
    @Order(70)
    @DisplayName("Should follow complete approval state flow")
    void testApprovalStateFlow() {
        // State 1: FULLY_SIGNED -> Submit for VVB_REVIEW
        VVBVerificationService.VVBReview review = vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.PENDING, review.getStatus());

        // Verify contract metadata updated
        assertTrue(testContract.getMetadata().containsKey("vvbReviewId"));
        assertEquals("PENDING", testContract.getMetadata().get("vvbReviewStatus"));

        // State 2: VVB_REVIEW -> VVB_APPROVED
        review = vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.APPROVED, review.getStatus());

        // Verify contract metadata updated
        assertEquals("APPROVED", testContract.getMetadata().get("vvbReviewStatus"));
        assertTrue(testContract.getMetadata().containsKey("vvbAttestationId"));
    }

    @Test
    @Order(71)
    @DisplayName("Should follow complete rejection state flow")
    void testRejectionStateFlow() {
        // State 1: FULLY_SIGNED -> Submit for VVB_REVIEW
        VVBVerificationService.VVBReview review = vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.PENDING, review.getStatus());

        // State 2: VVB_REVIEW -> VVB_REJECTED
        String reason = "Does not meet compliance standards";
        review = vvbVerificationService.reject(TEST_CONTRACT_ID, TEST_VVB_ID, reason)
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.REJECTED, review.getStatus());

        // Verify contract metadata updated
        assertEquals("REJECTED", testContract.getMetadata().get("vvbReviewStatus"));
        assertEquals(reason, testContract.getMetadata().get("vvbRejectionReason"));
    }

    @Test
    @Order(72)
    @DisplayName("Should add audit entries during state transitions")
    void testAuditEntriesDuringStateFlow() {
        // Clear any existing audit entries
        testContract.setAuditTrail(new ArrayList<>());

        // Submit for review
        vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();

        // Check audit entry for submission
        assertTrue(testContract.getAuditTrail().stream()
                .anyMatch(entry -> entry.contains("Submitted for VVB review")));

        // Approve
        vvbVerificationService.approve(TEST_CONTRACT_ID, TEST_VVB_ID, createAttestationRequest())
                .await().indefinitely();

        // Check audit entry for approval
        assertTrue(testContract.getAuditTrail().stream()
                .anyMatch(entry -> entry.contains("VVB approved by")));
    }

    // ==========================================================================
    // VVB Review Status Enum Tests
    // ==========================================================================

    @Test
    @Order(80)
    @DisplayName("Should have all expected VVB review statuses")
    void testVVBReviewStatuses() {
        VVBVerificationService.VVBReviewStatus[] statuses = VVBVerificationService.VVBReviewStatus.values();

        assertTrue(Arrays.asList(statuses).contains(VVBVerificationService.VVBReviewStatus.PENDING));
        assertTrue(Arrays.asList(statuses).contains(VVBVerificationService.VVBReviewStatus.IN_REVIEW));
        assertTrue(Arrays.asList(statuses).contains(VVBVerificationService.VVBReviewStatus.APPROVED));
        assertTrue(Arrays.asList(statuses).contains(VVBVerificationService.VVBReviewStatus.REJECTED));
        assertTrue(Arrays.asList(statuses).contains(VVBVerificationService.VVBReviewStatus.EXPIRED));
    }

    @Test
    @Order(81)
    @DisplayName("Should have all expected VVB types")
    void testVVBTypes() {
        VVBVerificationService.VVBType[] types = VVBVerificationService.VVBType.values();

        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.GENERAL));
        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.CARBON_CREDIT));
        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.REAL_ESTATE));
        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.FINANCIAL));
        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.ENVIRONMENTAL));
        assertTrue(Arrays.asList(types).contains(VVBVerificationService.VVBType.REGULATORY));
    }

    // ==========================================================================
    // Edge Cases and Error Handling Tests
    // ==========================================================================

    @Test
    @Order(90)
    @DisplayName("Should handle contract service exception")
    void testContractServiceException() {
        when(contractService.getContract("ERROR-CONTRACT"))
                .thenReturn(Uni.createFrom().failure(new RuntimeException("Contract service unavailable")));

        assertThrows(RuntimeException.class, () -> {
            vvbVerificationService.submitForReview("ERROR-CONTRACT")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(91)
    @DisplayName("Should handle null contract from service")
    void testNullContractFromService() {
        when(contractService.getContract("NULL-CONTRACT"))
                .thenReturn(Uni.createFrom().nullItem());

        assertThrows(NullPointerException.class, () -> {
            vvbVerificationService.submitForReview("NULL-CONTRACT")
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // VVB Entity Properties Tests
    // ==========================================================================

    @Test
    @Order(100)
    @DisplayName("Should initialize VVB entity with empty collections")
    void testVVBEntityInitialization() {
        VVBVerificationService.VVBEntity vvb = vvbVerificationService.registerVVB(
                "VVB-INIT-TEST",
                "Initialization Test VVB",
                VVBVerificationService.VVBType.GENERAL);

        assertNotNull(vvb.getCertifications());
        assertTrue(vvb.getCertifications().isEmpty());
        assertNotNull(vvb.getMetadata());
        assertTrue(vvb.getMetadata().isEmpty());
    }

    // ==========================================================================
    // Integration-like Tests
    // ==========================================================================

    @Test
    @Order(200)
    @DisplayName("Should simulate complete VVB verification lifecycle")
    void testCompleteVVBLifecycle() {
        // 1. Register a VVB
        VVBVerificationService.VVBEntity vvb = vvbVerificationService.registerVVB(
                "VVB-LIFECYCLE-001",
                "Carbon Credit Verification Authority",
                VVBVerificationService.VVBType.CARBON_CREDIT);
        assertTrue(vvb.isActive());

        // 2. Submit contract for review
        VVBVerificationService.VVBReview review = vvbVerificationService.submitForReview(TEST_CONTRACT_ID)
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.PENDING, review.getStatus());

        // 3. Check metrics
        Map<String, Object> metrics = vvbVerificationService.getMetrics();
        assertTrue((long) metrics.get("pendingReviews") > 0);

        // 4. Approve the verification
        VVBVerificationService.VVBAttestationRequest attestation = new VVBVerificationService.VVBAttestationRequest();
        attestation.setScope("Full carbon credit verification - Scope 1, 2, 3");
        attestation.setFindings("All 1000 carbon credits verified. Emission reductions confirmed.");
        attestation.setRecommendations("Approved for trading. Annual re-verification required.");

        review = vvbVerificationService.approve(TEST_CONTRACT_ID, vvb.getVvbId(), attestation)
                .await().indefinitely();
        assertEquals(VVBVerificationService.VVBReviewStatus.APPROVED, review.getStatus());

        // 5. Retrieve and verify attestation
        VVBVerificationService.VVBAttestation att = vvbVerificationService.getAttestation(TEST_CONTRACT_ID)
                .await().indefinitely();
        assertNotNull(att);
        assertTrue(att.isValid());
        assertEquals(vvb.getVvbId(), att.getVvbId());
        assertNotNull(att.getSignature());

        // 6. Verify final metrics
        metrics = vvbVerificationService.getMetrics();
        assertTrue((long) metrics.get("reviewsApproved") > 0);
        assertTrue((long) metrics.get("totalAttestations") > 0);
    }
}
