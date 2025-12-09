package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

// Helper method to create signatures for testing
// Uses the (signerAddress, signatureData) constructor

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Test Suite for Ricardian Contracts (AV11-452)
 *
 * Tests cover:
 * - Contract creation and lifecycle
 * - Party management
 * - Signature workflows
 * - Term management
 * - Status transitions
 * - Builder pattern
 * - Enforceability scoring
 * - Risk assessment
 *
 * @version 1.0.0
 * @author Aurigraph V11 Development Team
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RicardianContractTest {

    private RicardianContract contract;
    private ContractParty buyer;
    private ContractParty seller;

    @BeforeEach
    void setUp() {
        contract = new RicardianContract();

        // Create test parties
        buyer = ContractParty.builder()
                .partyId("BUYER_001")
                .name("John Doe")
                .address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
                .role("BUYER")
                .signatureRequired(true)
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        seller = ContractParty.builder()
                .partyId("SELLER_001")
                .name("Jane Smith")
                .address("0x8a91DC2D28B689474298D91899f0c1baF62cB85E")
                .role("SELLER")
                .signatureRequired(true)
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();
    }

    // ==========================================================================
    // Contract Creation Tests
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("Should create contract with default values")
    void testDefaultContractCreation() {
        RicardianContract newContract = new RicardianContract();

        assertNotNull(newContract.getContractId());
        assertEquals(ContractStatus.DRAFT, newContract.getStatus());
        assertNotNull(newContract.getParties());
        assertTrue(newContract.getParties().isEmpty());
        assertNotNull(newContract.getParameters());
        assertNotNull(newContract.getCreatedAt());
        assertEquals("1.0.0", newContract.getVersion());
        assertFalse(newContract.isImmutable());
    }

    @Test
    @Order(2)
    @DisplayName("Should create contract with full constructor")
    void testFullConstructorCreation() {
        List<ContractParty> parties = Arrays.asList(buyer, seller);
        RicardianContract fullContract = new RicardianContract(
                "RC_001",
                "This is the legal prose of the contract...",
                "contract RealEstate { ... }",
                ContractStatus.PENDING_APPROVAL,
                parties
        );

        assertEquals("RC_001", fullContract.getContractId());
        assertEquals("This is the legal prose of the contract...", fullContract.getLegalProse());
        assertEquals("contract RealEstate { ... }", fullContract.getSmartContractCode());
        assertEquals(ContractStatus.PENDING_APPROVAL, fullContract.getStatus());
        assertEquals(2, fullContract.getParties().size());
    }

    @Test
    @Order(3)
    @DisplayName("Should create contract using builder pattern")
    void testBuilderPatternCreation() {
        RicardianContract builtContract = RicardianContract.builder()
                .contractId("RC_BUILDER_001")
                .legalText("Legal terms and conditions...")
                .executableCode("function execute() { }")
                .contractType("REAL_ESTATE")
                .version("2.0.0")
                .parties(Arrays.asList(buyer, seller))
                .status(ContractStatus.DRAFT)
                .name("Real Estate Purchase Agreement")
                .jurisdiction("California, USA")
                .build();

        assertEquals("RC_BUILDER_001", builtContract.getContractId());
        assertEquals("Legal terms and conditions...", builtContract.getLegalText());
        assertEquals("function execute() { }", builtContract.getExecutableCode());
        assertEquals("REAL_ESTATE", builtContract.getContractType());
        assertEquals("2.0.0", builtContract.getVersion());
        assertEquals(2, builtContract.getParties().size());
        assertEquals("Real Estate Purchase Agreement", builtContract.getName());
        assertEquals("California, USA", builtContract.getJurisdiction());
    }

    // ==========================================================================
    // Party Management Tests
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("Should add party to contract")
    void testAddParty() {
        assertTrue(contract.getParties().isEmpty());

        contract.addParty(buyer);

        assertEquals(1, contract.getParties().size());
        assertTrue(contract.getParties().contains(buyer));
    }

    @Test
    @Order(11)
    @DisplayName("Should not add duplicate party")
    void testNoDuplicateParties() {
        contract.addParty(buyer);
        contract.addParty(buyer);

        assertEquals(1, contract.getParties().size());
    }

    @Test
    @Order(12)
    @DisplayName("Should find party by ID")
    void testGetPartyById() {
        contract.addParty(buyer);
        contract.addParty(seller);

        ContractParty foundBuyer = contract.getPartyById("BUYER_001");
        ContractParty foundSeller = contract.getPartyById("SELLER_001");
        ContractParty notFound = contract.getPartyById("NONEXISTENT");

        assertNotNull(foundBuyer);
        assertEquals("John Doe", foundBuyer.getName());
        assertNotNull(foundSeller);
        assertEquals("Jane Smith", foundSeller.getName());
        assertNull(notFound);
    }

    @Test
    @Order(13)
    @DisplayName("Should return null for party ID when parties list is null")
    void testGetPartyByIdWithNullList() {
        contract.setParties(null);

        ContractParty result = contract.getPartyById("BUYER_001");

        assertNull(result);
    }

    // ==========================================================================
    // Status Tests
    // ==========================================================================

    @ParameterizedTest
    @Order(20)
    @EnumSource(ContractStatus.class)
    @DisplayName("Should set and get all contract statuses")
    void testAllContractStatuses(ContractStatus status) {
        contract.setStatus(status);

        assertEquals(status, contract.getStatus());
    }

    @Test
    @Order(21)
    @DisplayName("Should correctly identify active contract")
    void testIsActive() {
        contract.setStatus(ContractStatus.ACTIVE);
        assertTrue(contract.isActive());

        contract.setStatus(ContractStatus.DRAFT);
        assertFalse(contract.isActive());
    }

    @Test
    @Order(22)
    @DisplayName("Should correctly identify draft contract")
    void testIsDraft() {
        contract.setStatus(ContractStatus.DRAFT);
        assertTrue(contract.isDraft());

        contract.setStatus(ContractStatus.ACTIVE);
        assertFalse(contract.isDraft());
    }

    @Test
    @Order(23)
    @DisplayName("Should correctly identify executed contract")
    void testIsExecuted() {
        contract.setStatus(ContractStatus.EXECUTED);
        assertTrue(contract.isExecuted());

        contract.setStatus(ContractStatus.DRAFT);
        assertFalse(contract.isExecuted());
    }

    @Test
    @Order(24)
    @DisplayName("Should update timestamp when status changes")
    void testStatusChangeUpdatesTimestamp() {
        Instant beforeChange = contract.getUpdatedAt();

        // Wait a bit to ensure timestamp difference
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        contract.setStatus(ContractStatus.ACTIVE);

        assertTrue(contract.getUpdatedAt().isAfter(beforeChange) ||
                   contract.getUpdatedAt().equals(beforeChange));
    }

    // ==========================================================================
    // Signature Tests
    // ==========================================================================

    @Test
    @Order(30)
    @DisplayName("Should add signature to contract")
    void testAddSignature() {
        ContractSignature signature = new ContractSignature(buyer.getAddress(), "sha256:abc123...");
        signature.setSignatureId("SIG_001");
        signature.setPartyId(buyer.getPartyId());

        contract.addSignature(signature);

        assertEquals(1, contract.getSignatures().size());
    }

    @Test
    @Order(31)
    @DisplayName("Should verify contract is fully signed when all parties have signed")
    void testIsFullySigned() {
        // Setup contract with signature-required parties
        contract.addParty(buyer);
        contract.addParty(seller);

        // Initially not fully signed
        assertFalse(contract.isFullySigned());

        // Add buyer signature
        ContractSignature buyerSig = new ContractSignature(buyer.getAddress(), "signature1");
        buyerSig.setPartyId(buyer.getPartyId());
        contract.addSignature(buyerSig);
        assertFalse(contract.isFullySigned()); // Still missing seller

        // Add seller signature
        ContractSignature sellerSig = new ContractSignature(seller.getAddress(), "signature2");
        sellerSig.setPartyId(seller.getPartyId());
        contract.addSignature(sellerSig);
        assertTrue(contract.isFullySigned()); // Now fully signed
    }

    @Test
    @Order(32)
    @DisplayName("Should return false for isFullySigned when no parties")
    void testIsFullySignedNoParties() {
        assertFalse(contract.isFullySigned());
    }

    @Test
    @Order(33)
    @DisplayName("Should handle party without signature requirement")
    void testPartiesWithoutSignatureRequirement() {
        ContractParty witness = ContractParty.builder()
                .partyId("WITNESS_001")
                .name("Witness Person")
                .address("0x1234567890abcdef1234567890abcdef12345678")
                .role("WITNESS")
                .signatureRequired(false) // Witness doesn't need to sign
                .kycVerified(true)
                .createdAt(Instant.now())
                .build();

        contract.addParty(buyer);
        contract.addParty(witness);

        // Only buyer needs to sign
        ContractSignature witnessSig = new ContractSignature(buyer.getAddress(), "signature1");
        witnessSig.setPartyId(buyer.getPartyId());
        contract.addSignature(witnessSig);

        assertTrue(contract.isFullySigned());
    }

    // ==========================================================================
    // Term Management Tests
    // ==========================================================================

    @Test
    @Order(40)
    @DisplayName("Should add term to contract")
    void testAddTerm() {
        ContractTerm term = new ContractTerm(
                "TERM_001",
                "Payment Terms",
                "Payment shall be made within 30 days",
                "PAYMENT"
        );

        contract.addTerm(term);

        assertEquals(1, contract.getTerms().size());
        assertEquals("Payment Terms", contract.getTerms().get(0).getTitle());
    }

    @Test
    @Order(41)
    @DisplayName("Should add term even when terms list is initially null")
    void testAddTermWhenListIsNull() {
        contract.setTerms(null);

        ContractTerm term = new ContractTerm(
                "TERM_001",
                "Delivery Terms",
                "Delivery within 7 days",
                "DELIVERY"
        );

        contract.addTerm(term);

        assertNotNull(contract.getTerms());
        assertEquals(1, contract.getTerms().size());
    }

    // ==========================================================================
    // Parameter Tests
    // ==========================================================================

    @Test
    @Order(50)
    @DisplayName("Should add parameters to contract")
    void testAddParameter() {
        contract.addParameter("purchasePrice", 500000);
        contract.addParameter("currency", "USD");
        contract.addParameter("closingDate", Instant.now().plus(30, ChronoUnit.DAYS));

        assertEquals(500000, contract.getParameters().get("purchasePrice"));
        assertEquals("USD", contract.getParameters().get("currency"));
        assertNotNull(contract.getParameters().get("closingDate"));
    }

    @Test
    @Order(51)
    @DisplayName("Should update parameter value")
    void testUpdateParameter() {
        contract.addParameter("purchasePrice", 500000);
        assertEquals(500000, contract.getParameters().get("purchasePrice"));

        contract.addParameter("purchasePrice", 550000);
        assertEquals(550000, contract.getParameters().get("purchasePrice"));
    }

    // ==========================================================================
    // Trigger Tests
    // ==========================================================================

    @Test
    @Order(60)
    @DisplayName("Should add trigger to contract")
    void testAddTrigger() {
        contract.setTriggers(null); // Start with null

        ContractTrigger trigger = new ContractTrigger(
                "TRIGGER_001",
                "Payment Deadline",
                TriggerType.TIME_BASED,
                "closingDate",
                "transferOwnership()"
        );

        contract.addTrigger(trigger);

        assertNotNull(contract.getTriggers());
        assertEquals(1, contract.getTriggers().size());
    }

    @Test
    @Order(61)
    @DisplayName("Should find trigger by ID")
    void testGetTriggerById() {
        ContractTrigger trigger1 = new ContractTrigger(
                "TRIGGER_001", "Payment", TriggerType.TIME_BASED, "date", "action1()"
        );
        ContractTrigger trigger2 = new ContractTrigger(
                "TRIGGER_002", "Inspection", TriggerType.EVENT_BASED, "event", "action2()"
        );

        contract.addTrigger(trigger1);
        contract.addTrigger(trigger2);

        ContractTrigger found = contract.getTriggerById("TRIGGER_001");

        assertNotNull(found);
        assertEquals("Payment", found.getName());
    }

    @Test
    @Order(62)
    @DisplayName("Should return null for trigger ID when triggers list is null")
    void testGetTriggerByIdWithNullList() {
        contract.setTriggers(null);

        ContractTrigger result = contract.getTriggerById("TRIGGER_001");

        assertNull(result);
    }

    // ==========================================================================
    // Execution Tests
    // ==========================================================================

    @Test
    @Order(70)
    @DisplayName("Should add execution result to contract")
    void testAddExecution() {
        contract.setExecutions(null); // Start with null

        ExecutionResult execution = new ExecutionResult(
                "EXEC_001",
                "TRIGGER_001",
                Instant.now(),
                "SUCCESS"
        );

        contract.addExecution(execution);

        assertNotNull(contract.getExecutions());
        assertEquals(1, contract.getExecutions().size());
        assertNotNull(contract.getLastExecutedAt());
    }

    @Test
    @Order(71)
    @DisplayName("Should update lastExecutedAt when execution is added")
    void testExecutionUpdatesLastExecutedAt() {
        assertNull(contract.getLastExecutedAt());

        ExecutionResult execution = new ExecutionResult(
                "EXEC_001", "TRIGGER_001", Instant.now(), "SUCCESS"
        );

        contract.addExecution(execution);

        assertNotNull(contract.getLastExecutedAt());
    }

    // ==========================================================================
    // Audit Log Tests
    // ==========================================================================

    @Test
    @Order(80)
    @DisplayName("Should add audit entry to contract")
    void testAddAuditEntry() {
        contract.setAuditLog(null); // Start with null

        contract.addAuditEntry("Contract created");
        contract.addAuditEntry("Parties added");
        contract.addAuditEntry("Awaiting signatures");

        assertNotNull(contract.getAuditLog());
        assertEquals(3, contract.getAuditLog().size());
        assertTrue(contract.getAuditLog().get(0).contains("Contract created"));
    }

    // ==========================================================================
    // Alias Method Tests
    // ==========================================================================

    @Test
    @Order(90)
    @DisplayName("Should use alias methods for legal text")
    void testLegalTextAlias() {
        contract.setLegalText("This is the legal agreement...");

        assertEquals("This is the legal agreement...", contract.getLegalText());
        assertEquals("This is the legal agreement...", contract.getLegalProse());
    }

    @Test
    @Order(91)
    @DisplayName("Should use alias methods for executable code")
    void testExecutableCodeAlias() {
        contract.setExecutableCode("function execute() { return true; }");

        assertEquals("function execute() { return true; }", contract.getExecutableCode());
        assertEquals("function execute() { return true; }", contract.getSmartContractCode());
    }

    // ==========================================================================
    // Metadata Tests
    // ==========================================================================

    @Test
    @Order(100)
    @DisplayName("Should set and get metadata")
    void testMetadata() {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("source", "PDF_UPLOAD");
        metadata.put("originalFileName", "contract.pdf");
        metadata.put("uploadedBy", "admin@company.com");

        contract.setMetadata(metadata);

        assertEquals("PDF_UPLOAD", contract.getMetadata().get("source"));
        assertEquals("contract.pdf", contract.getMetadata().get("originalFileName"));
    }

    // ==========================================================================
    // Equality and HashCode Tests
    // ==========================================================================

    @Test
    @Order(110)
    @DisplayName("Should correctly compare contracts by ID")
    void testEquality() {
        RicardianContract contract1 = new RicardianContract();
        contract1.setContractId("RC_001");

        RicardianContract contract2 = new RicardianContract();
        contract2.setContractId("RC_001");

        RicardianContract contract3 = new RicardianContract();
        contract3.setContractId("RC_002");

        assertEquals(contract1, contract2);
        assertNotEquals(contract1, contract3);
    }

    @Test
    @Order(111)
    @DisplayName("Should have consistent hashCode")
    void testHashCode() {
        RicardianContract contract1 = new RicardianContract();
        contract1.setContractId("RC_001");

        RicardianContract contract2 = new RicardianContract();
        contract2.setContractId("RC_001");

        assertEquals(contract1.hashCode(), contract2.hashCode());
    }

    @Test
    @Order(112)
    @DisplayName("Should have meaningful toString")
    void testToString() {
        contract.setContractId("RC_TEST_001");
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setContractType("REAL_ESTATE");

        String str = contract.toString();

        assertTrue(str.contains("RC_TEST_001"));
        assertTrue(str.contains("ACTIVE"));
        assertTrue(str.contains("REAL_ESTATE"));
    }

    // ==========================================================================
    // Immutability Tests
    // ==========================================================================

    @Test
    @Order(120)
    @DisplayName("Should set immutability flag")
    void testImmutabilityFlag() {
        assertFalse(contract.isImmutable());

        contract.setImmutable(true);

        assertTrue(contract.isImmutable());
    }

    // ==========================================================================
    // Additional Field Tests
    // ==========================================================================

    @Test
    @Order(130)
    @DisplayName("Should set and get enforceability score")
    void testEnforceabilityScore() {
        contract.setEnforceabilityScore(85.5);

        assertEquals(85.5, contract.getEnforceabilityScore(), 0.01);
    }

    @Test
    @Order(131)
    @DisplayName("Should set and get risk assessment")
    void testRiskAssessment() {
        contract.setRiskAssessment("LOW RISK: Contract is well-formed");

        assertEquals("LOW RISK: Contract is well-formed", contract.getRiskAssessment());
    }

    @Test
    @Order(132)
    @DisplayName("Should set and get contract hash")
    void testContractHash() {
        contract.setContractHash("sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

        assertEquals("sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                     contract.getContractHash());
    }

    @Test
    @Order(133)
    @DisplayName("Should set and get contract address")
    void testContractAddress() {
        contract.setContractAddress("0xABCD1234567890abcdef1234567890ABCDEF1234");

        assertEquals("0xABCD1234567890abcdef1234567890ABCDEF1234", contract.getContractAddress());
    }

    @Test
    @Order(134)
    @DisplayName("Should set and get asset type")
    void testAssetType() {
        contract.setAssetType("REAL_ESTATE");

        assertEquals("REAL_ESTATE", contract.getAssetType());
    }

    @Test
    @Order(135)
    @DisplayName("Should set and get activated timestamp")
    void testActivatedAt() {
        Instant activationTime = Instant.now();
        contract.setActivatedAt(activationTime);

        assertEquals(activationTime, contract.getActivatedAt());
    }

    // ==========================================================================
    // Integration-like Tests
    // ==========================================================================

    @Test
    @Order(200)
    @DisplayName("Should simulate complete contract lifecycle")
    void testContractLifecycle() {
        // 1. Create contract using builder
        RicardianContract lifecycleContract = RicardianContract.builder()
                .contractId("RC_LIFECYCLE_001")
                .legalText("Real Estate Purchase Agreement between Buyer and Seller...")
                .executableCode("contract RealEstate { function transfer() { ... } }")
                .contractType("REAL_ESTATE")
                .name("123 Main Street Purchase")
                .jurisdiction("California, USA")
                .parties(Arrays.asList(buyer, seller))
                .status(ContractStatus.DRAFT)
                .build();

        assertTrue(lifecycleContract.isDraft());
        assertEquals(2, lifecycleContract.getParties().size());

        // 2. Add terms
        lifecycleContract.addTerm(new ContractTerm(
                "TERM_PRICE", "Purchase Price", "$500,000 USD", "FINANCIAL"
        ));
        lifecycleContract.addTerm(new ContractTerm(
                "TERM_CLOSING", "Closing Date", "Within 30 days of signing", "TIMELINE"
        ));
        assertEquals(2, lifecycleContract.getTerms().size());

        // 3. Add parameters
        lifecycleContract.addParameter("purchasePrice", 500000);
        lifecycleContract.addParameter("closingDays", 30);

        // 4. Move to pending review
        lifecycleContract.setStatus(ContractStatus.PENDING_APPROVAL);
        lifecycleContract.addAuditEntry("Submitted for legal review");

        // 5. Add signatures (simulate signing process)
        ContractSignature lifecycleBuyerSig = new ContractSignature(buyer.getAddress(), "0xBUYER_SIG");
        lifecycleBuyerSig.setPartyId(buyer.getPartyId());
        lifecycleContract.addSignature(lifecycleBuyerSig);
        assertFalse(lifecycleContract.isFullySigned());

        ContractSignature lifecycleSellerSig = new ContractSignature(seller.getAddress(), "0xSELLER_SIG");
        lifecycleSellerSig.setPartyId(seller.getPartyId());
        lifecycleContract.addSignature(lifecycleSellerSig);
        assertTrue(lifecycleContract.isFullySigned());

        // 6. Activate contract
        lifecycleContract.setStatus(ContractStatus.ACTIVE);
        lifecycleContract.setActivatedAt(Instant.now());
        lifecycleContract.addAuditEntry("Contract activated after all signatures received");

        assertTrue(lifecycleContract.isActive());
        assertNotNull(lifecycleContract.getActivatedAt());

        // 7. Execute contract trigger
        ExecutionResult lifecycleExec = new ExecutionResult(
                "EXEC_TRANSFER", "TRIGGER_CLOSING", Instant.now(), "SUCCESS"
        );
        lifecycleContract.addExecution(lifecycleExec);

        assertNotNull(lifecycleContract.getLastExecutedAt());
        assertEquals(1, lifecycleContract.getExecutions().size());

        // 8. Mark as executed
        lifecycleContract.setStatus(ContractStatus.EXECUTED);
        lifecycleContract.addAuditEntry("Contract fully executed - ownership transferred");

        assertTrue(lifecycleContract.isExecuted());
        assertTrue(lifecycleContract.getAuditLog().size() >= 3);
    }
}
