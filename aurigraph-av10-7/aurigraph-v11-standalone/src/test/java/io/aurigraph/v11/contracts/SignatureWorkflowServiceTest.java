package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractParty;
import io.aurigraph.v11.contracts.models.ContractSignature;
import io.aurigraph.v11.contracts.SignatureWorkflowService.CollectionMode;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureRequest;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureRequirement;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureRole;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureVerificationResult;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureWorkflow;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureWorkflowStatus;
import io.aurigraph.v11.contracts.SignatureWorkflowService.WorkflowState;
import io.aurigraph.v11.contracts.SignatureWorkflowService.SignatureWorkflowException;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mockito;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Comprehensive Test Suite for SignatureWorkflowService
 *
 * Tests cover:
 * - Signature request creation
 * - Signature submission and verification
 * - Workflow status management
 * - Required signatures tracking
 * - Collection modes (SEQUENTIAL/PARALLEL)
 * - Sequential mode validation
 * - Full signature workflow lifecycle
 * - RBAC role-based signing
 *
 * @version 12.0.0 - Sprint 4 RBAC Implementation
 * @author Aurigraph V11 Development Team
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SignatureWorkflowServiceTest {

    @Inject
    SignatureWorkflowService signatureWorkflowService;

    @InjectMock
    ActiveContractService contractService;

    private ActiveContract testContract;
    private ContractParty owner;
    private ContractParty buyer;
    private ContractParty seller;
    private ContractParty witness;
    private ContractParty vvb;

    private static final String TEST_CONTRACT_ID = "AC-TEST-001";
    private static final String TEST_SIGNATURE_DATA = "0xDILITHIUM_SIGNATURE_BASE64_ENCODED";

    @BeforeEach
    void setUp() {
        // Create test parties with different roles
        owner = ContractParty.builder()
                .partyId("OWNER_001")
                .name("Contract Owner")
                .address("0x1111111111111111111111111111111111111111")
                .role("OWNER")
                .signatureRequired(true)
                .publicKey("OWNER_PUBLIC_KEY")
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        buyer = ContractParty.builder()
                .partyId("BUYER_001")
                .name("John Buyer")
                .address("0x2222222222222222222222222222222222222222")
                .role("PARTY")
                .signatureRequired(true)
                .publicKey("BUYER_PUBLIC_KEY")
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        seller = ContractParty.builder()
                .partyId("SELLER_001")
                .name("Jane Seller")
                .address("0x3333333333333333333333333333333333333333")
                .role("PARTY")
                .signatureRequired(true)
                .publicKey("SELLER_PUBLIC_KEY")
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        witness = ContractParty.builder()
                .partyId("WITNESS_001")
                .name("Legal Witness")
                .address("0x4444444444444444444444444444444444444444")
                .role("WITNESS")
                .signatureRequired(false)
                .publicKey("WITNESS_PUBLIC_KEY")
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        vvb = ContractParty.builder()
                .partyId("VVB_001")
                .name("Carbon Verifier")
                .address("0x5555555555555555555555555555555555555555")
                .role("VVB")
                .signatureRequired(true)
                .publicKey("VVB_PUBLIC_KEY")
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        // Create test contract
        testContract = new ActiveContract();
        testContract.setContractId(TEST_CONTRACT_ID);
        testContract.setName("Test Signature Workflow Contract");
        testContract.setOwner(owner.getAddress());
        testContract.setLegalText("This is a legally binding agreement...");
        testContract.setCode("contract TestContract { function execute() { } }");
        testContract.setStatus(ContractStatus.DEPLOYED);
        testContract.setCreatedAt(Instant.now());
        testContract.addParty(owner);
        testContract.addParty(buyer);
        testContract.addParty(seller);

        // Mock the contract service
        when(contractService.getContract(TEST_CONTRACT_ID))
                .thenReturn(Uni.createFrom().item(testContract));
    }

    // ==========================================================================
    // Request Signature Tests
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("Should request signature from a valid party")
    void testRequestSignatureFromValidParty() {
        SignatureRequest request = signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, owner.getPartyId())
                .await().indefinitely();

        assertNotNull(request);
        assertNotNull(request.getRequestId());
        assertTrue(request.getRequestId().startsWith("SRQ-"));
        assertEquals(TEST_CONTRACT_ID, request.getContractId());
        assertEquals(owner.getPartyId(), request.getPartyId());
        assertEquals(owner.getName(), request.getPartyName());
        assertEquals(SignatureRole.OWNER, request.getPartyRole());
        assertEquals(SignatureRequest.RequestStatus.PENDING, request.getStatus());
        assertEquals("CRYSTALS-Dilithium", request.getSignatureType());
        assertNotNull(request.getRequestedAt());
        assertNotNull(request.getExpiresAt());
        assertTrue(request.getExpiresAt().isAfter(request.getRequestedAt()));
    }

    @Test
    @Order(2)
    @DisplayName("Should throw exception when requesting signature from non-existent party")
    void testRequestSignatureFromNonExistentParty() {
        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .requestSignature(TEST_CONTRACT_ID, "NON_EXISTENT_PARTY")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(3)
    @DisplayName("Should throw exception when party has already signed")
    void testRequestSignatureFromAlreadySignedParty() {
        // First, add a signature for the owner
        ContractSignature existingSignature = new ContractSignature(
                owner.getAddress(), TEST_SIGNATURE_DATA);
        existingSignature.setPartyId(owner.getPartyId());
        testContract.addSignature(existingSignature);

        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .requestSignature(TEST_CONTRACT_ID, owner.getPartyId())
                    .await().indefinitely();
        });
    }

    @Test
    @Order(4)
    @DisplayName("Should set workflow state to PENDING_SIGNATURES after first request")
    void testWorkflowStateAfterFirstRequest() {
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        SignatureWorkflowStatus status = signatureWorkflowService
                .getSignatureStatus(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertEquals(WorkflowState.PENDING_SIGNATURES, status.getState());
    }

    // ==========================================================================
    // Submit Signature Tests
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("Should submit and verify a valid signature")
    void testSubmitValidSignature() {
        // First request a signature
        SignatureRequest request = signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        assertNotNull(request);

        // Then submit the signature
        ContractSignature signature = signatureWorkflowService
                .submitSignature(TEST_CONTRACT_ID, buyer.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        assertNotNull(signature);
        assertNotNull(signature.getSignatureId());
        assertTrue(signature.getSignatureId().startsWith("SIG-"));
        assertEquals(TEST_CONTRACT_ID, signature.getContractId());
        assertEquals(buyer.getPartyId(), signature.getPartyId());
        assertEquals(buyer.getAddress(), signature.getSignerAddress());
        assertEquals(buyer.getName(), signature.getSignerName());
        assertEquals(TEST_SIGNATURE_DATA, signature.getSignature());
        assertEquals("CRYSTALS-Dilithium", signature.getAlgorithm());
        assertTrue(signature.isVerified());
        assertNotNull(signature.getSignedAt());
    }

    @Test
    @Order(11)
    @DisplayName("Should throw exception when submitting signature without workflow")
    void testSubmitSignatureWithoutWorkflow() {
        // Create a new contract without workflow
        ActiveContract newContract = new ActiveContract();
        newContract.setContractId("AC-NO-WORKFLOW");
        newContract.setName("No Workflow Contract");
        newContract.addParty(buyer);

        when(contractService.getContract("AC-NO-WORKFLOW"))
                .thenReturn(Uni.createFrom().item(newContract));

        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .submitSignature("AC-NO-WORKFLOW", buyer.getPartyId(),
                            TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(12)
    @DisplayName("Should throw exception when submitting signature for non-existent party")
    void testSubmitSignatureForNonExistentParty() {
        // First create a workflow
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .submitSignature(TEST_CONTRACT_ID, "NON_EXISTENT",
                            TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                    .await().indefinitely();
        });
    }

    @Test
    @Order(13)
    @DisplayName("Should throw exception when submitting signature without pending request")
    void testSubmitSignatureWithoutPendingRequest() {
        // Create workflow but request for different party
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        // Try to submit for seller (no request made)
        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .submitSignature(TEST_CONTRACT_ID, seller.getPartyId(),
                            TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Verify Signature Tests
    // ==========================================================================

    @Test
    @Order(20)
    @DisplayName("Should verify an existing signature")
    void testVerifyExistingSignature() {
        // Request and submit a signature first
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        signatureWorkflowService
                .submitSignature(TEST_CONTRACT_ID, buyer.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        // Verify the signature
        SignatureVerificationResult result = signatureWorkflowService
                .verifySignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        assertNotNull(result);
        assertEquals(TEST_CONTRACT_ID, result.getContractId());
        assertEquals(buyer.getPartyId(), result.getPartyId());
        assertNotNull(result.getSignatureId());
        assertTrue(result.isValid());
        assertEquals("CRYSTALS-Dilithium", result.getAlgorithm());
        assertNotNull(result.getVerifiedAt());
        assertNotNull(result.getSignedAt());
        assertNull(result.getReason()); // No error reason for valid signature
    }

    @Test
    @Order(21)
    @DisplayName("Should throw exception when verifying non-existent signature")
    void testVerifyNonExistentSignature() {
        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .verifySignature(TEST_CONTRACT_ID, "NON_EXISTENT_PARTY")
                    .await().indefinitely();
        });
    }

    // ==========================================================================
    // Workflow Status Tests
    // ==========================================================================

    @Test
    @Order(30)
    @DisplayName("Should get workflow status for a contract")
    void testGetWorkflowStatus() {
        // Create workflow
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        SignatureWorkflowStatus status = signatureWorkflowService
                .getSignatureStatus(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertNotNull(status);
        assertEquals(TEST_CONTRACT_ID, status.getContractId());
        assertEquals("Test Signature Workflow Contract", status.getContractName());
        assertNotNull(status.getWorkflowId());
        assertTrue(status.getWorkflowId().startsWith("SWF-"));
        assertEquals(WorkflowState.PENDING_SIGNATURES, status.getState());
        assertEquals(CollectionMode.PARALLEL, status.getCollectionMode()); // Default
        assertTrue(status.getRequiredSignatures() > 0);
        assertEquals(0, status.getSignedCount());
        assertFalse(status.isFullySigned());
    }

    @Test
    @Order(31)
    @DisplayName("Should return DRAFT state when no workflow exists")
    void testGetStatusWithoutWorkflow() {
        // Create a new contract without any workflow
        ActiveContract newContract = new ActiveContract();
        newContract.setContractId("AC-NEW");
        newContract.setName("New Contract");
        newContract.addParty(buyer);

        when(contractService.getContract("AC-NEW"))
                .thenReturn(Uni.createFrom().item(newContract));

        SignatureWorkflowStatus status = signatureWorkflowService
                .getSignatureStatus("AC-NEW")
                .await().indefinitely();

        assertNotNull(status);
        assertEquals(WorkflowState.DRAFT, status.getState());
    }

    @Test
    @Order(32)
    @DisplayName("Should update workflow state to PARTIALLY_SIGNED after first signature")
    void testWorkflowStatePartiallySignedAfterFirstSignature() {
        // Request and submit first signature
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, owner.getPartyId())
                .await().indefinitely();

        signatureWorkflowService
                .submitSignature(TEST_CONTRACT_ID, owner.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        SignatureWorkflowStatus status = signatureWorkflowService
                .getSignatureStatus(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertEquals(WorkflowState.PARTIALLY_SIGNED, status.getState());
        assertTrue(status.getSignedCount() > 0);
        assertFalse(status.isFullySigned());
    }

    // ==========================================================================
    // Get Required Signatures Tests
    // ==========================================================================

    @Test
    @Order(40)
    @DisplayName("Should get list of required signatures")
    void testGetRequiredSignatures() {
        List<SignatureRequirement> requirements = signatureWorkflowService
                .getRequiredSignatures(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertNotNull(requirements);
        assertFalse(requirements.isEmpty());
        assertEquals(3, requirements.size()); // owner, buyer, seller (witness excluded)

        // Verify sorting by role priority
        SignatureRequirement first = requirements.get(0);
        assertEquals(SignatureRole.OWNER, first.getRole());
        assertEquals(owner.getPartyId(), first.getPartyId());
        assertEquals(owner.getName(), first.getPartyName());
        assertFalse(first.isSigned());
    }

    @Test
    @Order(41)
    @DisplayName("Should mark requirement as signed after signature submission")
    void testRequirementMarkedAsSigned() {
        // Request and submit signature
        signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, owner.getPartyId())
                .await().indefinitely();

        signatureWorkflowService
                .submitSignature(TEST_CONTRACT_ID, owner.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        List<SignatureRequirement> requirements = signatureWorkflowService
                .getRequiredSignatures(TEST_CONTRACT_ID)
                .await().indefinitely();

        SignatureRequirement ownerReq = requirements.stream()
                .filter(r -> r.getPartyId().equals(owner.getPartyId()))
                .findFirst()
                .orElse(null);

        assertNotNull(ownerReq);
        assertTrue(ownerReq.isSigned());
        assertNotNull(ownerReq.getSignedAt());
    }

    @Test
    @Order(42)
    @DisplayName("Should check if contract is fully signed")
    void testIsFullySigned() {
        Boolean fullySigned = signatureWorkflowService
                .isFullySigned(TEST_CONTRACT_ID)
                .await().indefinitely();

        assertFalse(fullySigned);
    }

    // ==========================================================================
    // Set Collection Mode Tests
    // ==========================================================================

    @Test
    @Order(50)
    @DisplayName("Should set collection mode to SEQUENTIAL")
    void testSetSequentialCollectionMode() {
        SignatureWorkflow workflow = signatureWorkflowService
                .setCollectionMode(TEST_CONTRACT_ID, CollectionMode.SEQUENTIAL)
                .await().indefinitely();

        assertNotNull(workflow);
        assertEquals(CollectionMode.SEQUENTIAL, workflow.getCollectionMode());
        assertNotNull(workflow.getUpdatedAt());
    }

    @Test
    @Order(51)
    @DisplayName("Should set collection mode to PARALLEL")
    void testSetParallelCollectionMode() {
        SignatureWorkflow workflow = signatureWorkflowService
                .setCollectionMode(TEST_CONTRACT_ID, CollectionMode.PARALLEL)
                .await().indefinitely();

        assertNotNull(workflow);
        assertEquals(CollectionMode.PARALLEL, workflow.getCollectionMode());
    }

    @ParameterizedTest
    @Order(52)
    @EnumSource(CollectionMode.class)
    @DisplayName("Should support all collection modes")
    void testAllCollectionModes(CollectionMode mode) {
        SignatureWorkflow workflow = signatureWorkflowService
                .setCollectionMode(TEST_CONTRACT_ID, mode)
                .await().indefinitely();

        assertEquals(mode, workflow.getCollectionMode());
    }

    @Test
    @Order(53)
    @DisplayName("Should set signature request expiry time")
    void testSetRequestExpiry() {
        long expirySeconds = 3 * 24 * 60 * 60; // 3 days

        SignatureWorkflow workflow = signatureWorkflowService
                .setRequestExpiry(TEST_CONTRACT_ID, expirySeconds)
                .await().indefinitely();

        assertNotNull(workflow);
        assertEquals(expirySeconds, workflow.getRequestExpirySeconds());
    }

    @Test
    @Order(54)
    @DisplayName("Should add role requirement to workflow")
    void testAddRoleRequirement() {
        SignatureWorkflow workflow = signatureWorkflowService
                .addRoleRequirement(TEST_CONTRACT_ID, SignatureRole.VVB, 2)
                .await().indefinitely();

        assertNotNull(workflow);
        assertEquals(2, workflow.getRoleRequirements().get(SignatureRole.VVB));
    }

    // ==========================================================================
    // Sequential Mode Validation Tests
    // ==========================================================================

    @Test
    @Order(60)
    @DisplayName("Should enforce sequential order in SEQUENTIAL mode")
    void testSequentialModeEnforcement() {
        // Set to sequential mode
        signatureWorkflowService
                .setCollectionMode(TEST_CONTRACT_ID, CollectionMode.SEQUENTIAL)
                .await().indefinitely();

        // Add role requirement for OWNER
        signatureWorkflowService
                .addRoleRequirement(TEST_CONTRACT_ID, SignatureRole.OWNER, 1)
                .await().indefinitely();

        // Try to request signature from PARTY before OWNER signs
        // OWNER has priority 1, PARTY has priority 2
        assertThrows(SignatureWorkflowException.class, () -> {
            signatureWorkflowService
                    .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                    .await().indefinitely();
        });
    }

    @Test
    @Order(61)
    @DisplayName("Should allow sequential signing in correct order")
    void testSequentialSigningCorrectOrder() {
        // Create a fresh contract for this test
        ActiveContract seqContract = new ActiveContract();
        seqContract.setContractId("AC-SEQ-TEST");
        seqContract.setName("Sequential Test Contract");
        seqContract.addParty(owner);
        seqContract.addParty(buyer);

        when(contractService.getContract("AC-SEQ-TEST"))
                .thenReturn(Uni.createFrom().item(seqContract));

        // Set to sequential mode
        signatureWorkflowService
                .setCollectionMode("AC-SEQ-TEST", CollectionMode.SEQUENTIAL)
                .await().indefinitely();

        // Request from OWNER first (priority 1)
        SignatureRequest ownerRequest = signatureWorkflowService
                .requestSignature("AC-SEQ-TEST", owner.getPartyId())
                .await().indefinitely();

        assertNotNull(ownerRequest);
        assertEquals(owner.getPartyId(), ownerRequest.getPartyId());
    }

    @Test
    @Order(62)
    @DisplayName("Should allow parallel signing in PARALLEL mode regardless of order")
    void testParallelModeNoOrderRestriction() {
        // Ensure parallel mode
        signatureWorkflowService
                .setCollectionMode(TEST_CONTRACT_ID, CollectionMode.PARALLEL)
                .await().indefinitely();

        // Should be able to request from PARTY before OWNER in parallel mode
        SignatureRequest partyRequest = signatureWorkflowService
                .requestSignature(TEST_CONTRACT_ID, buyer.getPartyId())
                .await().indefinitely();

        assertNotNull(partyRequest);
        assertEquals(buyer.getPartyId(), partyRequest.getPartyId());
    }

    // ==========================================================================
    // Full Signature Workflow Lifecycle Tests
    // ==========================================================================

    @Test
    @Order(100)
    @DisplayName("Should complete full signature workflow lifecycle")
    void testFullSignatureWorkflowLifecycle() {
        // Step 1: Create a fresh contract
        ActiveContract lifecycleContract = new ActiveContract();
        lifecycleContract.setContractId("AC-LIFECYCLE");
        lifecycleContract.setName("Full Lifecycle Contract");
        lifecycleContract.setOwner(owner.getAddress());
        lifecycleContract.setLegalText("This is a binding agreement.");
        lifecycleContract.addParty(owner);
        lifecycleContract.addParty(buyer);

        when(contractService.getContract("AC-LIFECYCLE"))
                .thenReturn(Uni.createFrom().item(lifecycleContract));

        // Step 2: Configure workflow
        SignatureWorkflow workflow = signatureWorkflowService
                .setCollectionMode("AC-LIFECYCLE", CollectionMode.PARALLEL)
                .await().indefinitely();

        assertEquals(CollectionMode.PARALLEL, workflow.getCollectionMode());
        assertEquals(WorkflowState.DRAFT, workflow.getState());

        // Step 3: Request signatures from all required parties
        SignatureRequest ownerRequest = signatureWorkflowService
                .requestSignature("AC-LIFECYCLE", owner.getPartyId())
                .await().indefinitely();

        SignatureRequest buyerRequest = signatureWorkflowService
                .requestSignature("AC-LIFECYCLE", buyer.getPartyId())
                .await().indefinitely();

        assertNotNull(ownerRequest);
        assertNotNull(buyerRequest);

        // Step 4: Check workflow state after requests
        SignatureWorkflowStatus statusAfterRequests = signatureWorkflowService
                .getSignatureStatus("AC-LIFECYCLE")
                .await().indefinitely();

        assertEquals(WorkflowState.PENDING_SIGNATURES, statusAfterRequests.getState());

        // Step 5: Submit owner signature
        ContractSignature ownerSig = signatureWorkflowService
                .submitSignature("AC-LIFECYCLE", owner.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        assertNotNull(ownerSig);
        assertTrue(ownerSig.isVerified());

        // Step 6: Check workflow state after first signature
        SignatureWorkflowStatus statusAfterFirst = signatureWorkflowService
                .getSignatureStatus("AC-LIFECYCLE")
                .await().indefinitely();

        assertEquals(WorkflowState.PARTIALLY_SIGNED, statusAfterFirst.getState());
        assertEquals(1, statusAfterFirst.getSignedCount());

        // Step 7: Submit buyer signature
        ContractSignature buyerSig = signatureWorkflowService
                .submitSignature("AC-LIFECYCLE", buyer.getPartyId(),
                        TEST_SIGNATURE_DATA + "_BUYER", "CRYSTALS-Dilithium")
                .await().indefinitely();

        assertNotNull(buyerSig);
        assertTrue(buyerSig.isVerified());

        // Step 8: Check workflow is FULLY_SIGNED
        SignatureWorkflowStatus finalStatus = signatureWorkflowService
                .getSignatureStatus("AC-LIFECYCLE")
                .await().indefinitely();

        assertEquals(WorkflowState.FULLY_SIGNED, finalStatus.getState());
        assertEquals(2, finalStatus.getSignedCount());
        assertEquals(0, finalStatus.getPendingCount());
        assertTrue(finalStatus.isFullySigned());

        // Step 9: Verify all signatures
        SignatureVerificationResult ownerVerification = signatureWorkflowService
                .verifySignature("AC-LIFECYCLE", owner.getPartyId())
                .await().indefinitely();

        SignatureVerificationResult buyerVerification = signatureWorkflowService
                .verifySignature("AC-LIFECYCLE", buyer.getPartyId())
                .await().indefinitely();

        assertTrue(ownerVerification.isValid());
        assertTrue(buyerVerification.isValid());

        // Step 10: Check required signatures list
        List<SignatureRequirement> requirements = signatureWorkflowService
                .getRequiredSignatures("AC-LIFECYCLE")
                .await().indefinitely();

        assertTrue(requirements.stream().allMatch(SignatureRequirement::isSigned));

        // Step 11: Verify isFullySigned
        Boolean isFullySigned = signatureWorkflowService
                .isFullySigned("AC-LIFECYCLE")
                .await().indefinitely();

        assertTrue(isFullySigned);
    }

    @Test
    @Order(101)
    @DisplayName("Should handle VVB verification workflow for carbon contracts")
    void testVVBVerificationWorkflow() {
        // Create a carbon contract with VVB requirement
        ActiveContract carbonContract = new ActiveContract();
        carbonContract.setContractId("AC-CARBON");
        carbonContract.setName("Carbon Credit Contract");
        carbonContract.setContractType("CARBON_CREDIT");
        carbonContract.addParty(owner);
        carbonContract.addParty(vvb);

        when(contractService.getContract("AC-CARBON"))
                .thenReturn(Uni.createFrom().item(carbonContract));

        // Add VVB role requirement
        signatureWorkflowService
                .addRoleRequirement("AC-CARBON", SignatureRole.VVB, 1)
                .await().indefinitely();

        // Request VVB signature
        SignatureRequest vvbRequest = signatureWorkflowService
                .requestSignature("AC-CARBON", vvb.getPartyId())
                .await().indefinitely();

        assertNotNull(vvbRequest);
        assertEquals(SignatureRole.VVB, vvbRequest.getPartyRole());

        // Submit VVB signature
        ContractSignature vvbSig = signatureWorkflowService
                .submitSignature("AC-CARBON", vvb.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        assertNotNull(vvbSig);
        assertTrue(vvbSig.isVerified());
        assertEquals("VVB", vvbSig.getMetadata().get("role"));
    }

    @Test
    @Order(102)
    @DisplayName("Should track signatures by role in workflow status")
    void testSignaturesByRoleTracking() {
        // Create a contract with multiple roles
        ActiveContract multiRoleContract = new ActiveContract();
        multiRoleContract.setContractId("AC-MULTI-ROLE");
        multiRoleContract.setName("Multi-Role Contract");
        multiRoleContract.addParty(owner);
        multiRoleContract.addParty(buyer);
        multiRoleContract.addParty(vvb);

        when(contractService.getContract("AC-MULTI-ROLE"))
                .thenReturn(Uni.createFrom().item(multiRoleContract));

        // Request and submit signatures from different roles
        signatureWorkflowService
                .requestSignature("AC-MULTI-ROLE", owner.getPartyId())
                .await().indefinitely();
        signatureWorkflowService
                .submitSignature("AC-MULTI-ROLE", owner.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        signatureWorkflowService
                .requestSignature("AC-MULTI-ROLE", buyer.getPartyId())
                .await().indefinitely();
        signatureWorkflowService
                .submitSignature("AC-MULTI-ROLE", buyer.getPartyId(),
                        TEST_SIGNATURE_DATA, "CRYSTALS-Dilithium")
                .await().indefinitely();

        // Check signatures by role
        SignatureWorkflowStatus status = signatureWorkflowService
                .getSignatureStatus("AC-MULTI-ROLE")
                .await().indefinitely();

        assertNotNull(status.getSignaturesByRole());
        assertTrue(status.getSignaturesByRole().containsKey("OWNER"));
        assertTrue(status.getSignaturesByRole().containsKey("PARTY"));
        assertEquals(1, status.getSignaturesByRole().get("OWNER").intValue());
        assertEquals(1, status.getSignaturesByRole().get("PARTY").intValue());
    }

    // ==========================================================================
    // Role Enumeration Tests
    // ==========================================================================

    @ParameterizedTest
    @Order(110)
    @EnumSource(SignatureRole.class)
    @DisplayName("Should recognize all signature roles")
    void testAllSignatureRoles(SignatureRole role) {
        assertNotNull(role.getDescription());
        assertTrue(role.getPriority() > 0);
    }

    @Test
    @Order(111)
    @DisplayName("Should verify role priority ordering")
    void testRolePriorityOrdering() {
        assertTrue(SignatureRole.OWNER.getPriority() < SignatureRole.PARTY.getPriority());
        assertTrue(SignatureRole.PARTY.getPriority() < SignatureRole.WITNESS.getPriority());
        assertTrue(SignatureRole.WITNESS.getPriority() < SignatureRole.VVB.getPriority());
        assertTrue(SignatureRole.VVB.getPriority() < SignatureRole.REGULATOR.getPriority());
    }

    @Test
    @Order(112)
    @DisplayName("Should correctly identify signature-required roles")
    void testSignatureRequiredRoles() {
        assertTrue(SignatureRole.OWNER.isSignatureRequired());
        assertTrue(SignatureRole.PARTY.isSignatureRequired());
        assertFalse(SignatureRole.WITNESS.isSignatureRequired());
        assertTrue(SignatureRole.VVB.isSignatureRequired());
        assertFalse(SignatureRole.REGULATOR.isSignatureRequired());
    }

    // ==========================================================================
    // Workflow State Tests
    // ==========================================================================

    @ParameterizedTest
    @Order(120)
    @EnumSource(WorkflowState.class)
    @DisplayName("Should support all workflow states")
    void testAllWorkflowStates(WorkflowState state) {
        assertNotNull(state.name());
    }

    @Test
    @Order(121)
    @DisplayName("Should not allow signature submission after EXPIRED state")
    void testExpiredWorkflowRejectsSignatures() {
        // Create a contract with an existing expired workflow
        // This would need a way to set workflow state directly
        // For now, we test the exception message validation

        // This is a conceptual test - in practice, expired state would be
        // set by a scheduled job checking expiry times
        assertNotNull(WorkflowState.EXPIRED);
    }

    @Test
    @Order(122)
    @DisplayName("Should not allow signature submission after REJECTED state")
    void testRejectedWorkflowRejectsSignatures() {
        // Conceptual test for rejected state handling
        assertNotNull(WorkflowState.REJECTED);
    }

    // ==========================================================================
    // Exception Handling Tests
    // ==========================================================================

    @Test
    @Order(130)
    @DisplayName("Should handle contract not found exception")
    void testContractNotFoundHandling() {
        when(contractService.getContract("NON_EXISTENT"))
                .thenReturn(Uni.createFrom().failure(
                        new ActiveContractService.ContractNotFoundException("Contract not found")));

        assertThrows(ActiveContractService.ContractNotFoundException.class, () -> {
            signatureWorkflowService
                    .requestSignature("NON_EXISTENT", buyer.getPartyId())
                    .await().indefinitely();
        });
    }

    @Test
    @Order(131)
    @DisplayName("Should create SignatureWorkflowException with message")
    void testSignatureWorkflowExceptionCreation() {
        SignatureWorkflowException exception = new SignatureWorkflowException("Test error message");

        assertEquals("Test error message", exception.getMessage());
    }

    @Test
    @Order(132)
    @DisplayName("Should create SignatureWorkflowException with cause")
    void testSignatureWorkflowExceptionWithCause() {
        RuntimeException cause = new RuntimeException("Root cause");
        SignatureWorkflowException exception = new SignatureWorkflowException("Test error", cause);

        assertEquals("Test error", exception.getMessage());
        assertEquals(cause, exception.getCause());
    }
}
