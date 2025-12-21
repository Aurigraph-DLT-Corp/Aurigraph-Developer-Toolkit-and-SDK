package io.aurigraph.v11.identity;

import io.aurigraph.v11.identity.did.AurigraphDIDMethod;
import io.aurigraph.v11.identity.did.DIDDocument;
import io.aurigraph.v11.identity.did.DIDResolver;
import io.aurigraph.v11.identity.vc.VerifiableCredential;
import io.aurigraph.v11.identity.vc.VerifiablePresentation;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Unit Tests for Decentralized Identity Components
 *
 * Tests cover:
 * - DID Document creation and serialization
 * - Aurigraph DID Method operations
 * - DID Resolution
 * - Verifiable Credential creation and validation
 * - Verifiable Presentation creation
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DecentralizedIdentityTest {

    @Inject
    AurigraphDIDMethod aurigraphDIDMethod;

    @Inject
    DIDResolver didResolver;

    // Test data
    private static String testDid;
    private static final String TEST_NETWORK = "testnet";
    private static final String TEST_PUBLIC_KEY = "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";

    // ==================== DID Document Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test DID Document creation with default context")
    void testDIDDocumentCreation() {
        DIDDocument doc = new DIDDocument();

        assertNotNull(doc.getContext());
        assertTrue(doc.getContext().contains(DIDDocument.DID_CONTEXT_V1));
        assertNotNull(doc.getVerificationMethod());
        assertNotNull(doc.getService());
    }

    @Test
    @Order(2)
    @DisplayName("Test DID Document creation with specific DID")
    void testDIDDocumentWithDID() {
        String did = "did:aurigraph:testnet:abc123";
        DIDDocument doc = DIDDocument.create(did);

        assertEquals(did, doc.getId());
        assertTrue(doc.getController().contains(did));
        assertNotNull(doc.getMetadata());
        assertNotNull(doc.getMetadata().getCreated());
    }

    @Test
    @Order(3)
    @DisplayName("Test Aurigraph DID Document creation")
    void testAurigraphDIDDocumentCreation() {
        DIDDocument doc = DIDDocument.createAurigraph("mainnet", "uniqueId123");

        assertTrue(doc.getId().startsWith("did:aurigraph:mainnet:"));
        assertTrue(doc.getContext().contains(DIDDocument.DID_CONTEXT_V1));
        assertTrue(doc.getContext().contains(DIDDocument.DID_CONTEXT_SECURITY_V2));
    }

    @Test
    @Order(4)
    @DisplayName("Test adding Ed25519 verification method")
    void testAddEd25519VerificationMethod() {
        DIDDocument doc = DIDDocument.create("did:aurigraph:testnet:test1");
        doc.addEd25519VerificationMethod("key-1", TEST_PUBLIC_KEY);

        assertEquals(1, doc.getVerificationMethod().size());
        DIDDocument.VerificationMethod vm = doc.getVerificationMethod().get(0);
        assertEquals("did:aurigraph:testnet:test1#key-1", vm.getId());
        assertEquals("Ed25519VerificationKey2020", vm.getType());
        assertEquals(TEST_PUBLIC_KEY, vm.getPublicKeyMultibase());
    }

    @Test
    @Order(5)
    @DisplayName("Test adding Dilithium verification method")
    void testAddDilithiumVerificationMethod() {
        DIDDocument doc = DIDDocument.create("did:aurigraph:testnet:test2");
        doc.addDilithiumVerificationMethod("key-quantum", TEST_PUBLIC_KEY, 5);

        DIDDocument.VerificationMethod vm = doc.getVerificationMethod().get(0);
        assertEquals("DilithiumVerificationKey2023", vm.getType());
        assertNotNull(vm.getAdditionalProperties());
        assertEquals("NIST Level 5", vm.getAdditionalProperties().get("securityLevel"));
        assertTrue((Boolean) vm.getAdditionalProperties().get("quantumResistant"));
    }

    @Test
    @Order(6)
    @DisplayName("Test adding service endpoints")
    void testAddServiceEndpoints() {
        DIDDocument doc = DIDDocument.create("did:aurigraph:testnet:test3");
        doc.addService("credential-registry", "CredentialRegistry", "https://api.aurigraph.io/credentials");
        doc.addDIDCommService("messaging", "https://didcomm.aurigraph.io/endpoint", null);

        assertEquals(2, doc.getService().size());
    }

    @Test
    @Order(7)
    @DisplayName("Test DID Document JSON-LD serialization")
    void testDIDDocumentSerialization() throws Exception {
        DIDDocument doc = DIDDocument.createAurigraph("testnet", "serialize123");
        doc.addEd25519VerificationMethod("key-1", TEST_PUBLIC_KEY);
        doc.addAuthentication("key-1");
        doc.addService("api", "LinkedDomains", "https://aurigraph.io");

        String jsonLd = doc.toJsonLd();

        assertNotNull(jsonLd);
        assertTrue(jsonLd.contains("\"@context\""));
        assertTrue(jsonLd.contains("did:aurigraph:testnet:serialize123"));
        assertTrue(jsonLd.contains("Ed25519VerificationKey2020"));

        // Test deserialization
        DIDDocument parsed = DIDDocument.fromJsonLd(jsonLd);
        assertEquals(doc.getId(), parsed.getId());
        assertEquals(doc.getVerificationMethod().size(), parsed.getVerificationMethod().size());
    }

    // ==================== Aurigraph DID Method Tests ====================

    @Test
    @Order(10)
    @DisplayName("Test DID validation - valid DID")
    void testValidDIDValidation() {
        assertTrue(aurigraphDIDMethod.isValidDID("did:aurigraph:mainnet:abc123def456abc123def456abc123de"));
        assertTrue(aurigraphDIDMethod.isValidDID("did:aurigraph:testnet:abc123def456abc123def456abc123de"));
        assertTrue(aurigraphDIDMethod.isValidDID("did:aurigraph:devnet:abc123def456abc123def456abc123de"));
    }

    @Test
    @Order(11)
    @DisplayName("Test DID validation - invalid DID")
    void testInvalidDIDValidation() {
        assertFalse(aurigraphDIDMethod.isValidDID(null));
        assertFalse(aurigraphDIDMethod.isValidDID(""));
        assertFalse(aurigraphDIDMethod.isValidDID("did:aurigraph:invalid:abc"));
        assertFalse(aurigraphDIDMethod.isValidDID("did:other:mainnet:abc123"));
        assertFalse(aurigraphDIDMethod.isValidDID("not-a-did"));
    }

    @Test
    @Order(12)
    @DisplayName("Test DID parsing")
    void testDIDParsing() {
        String did = "did:aurigraph:testnet:abc123def456abc123def456abc123de";
        AurigraphDIDMethod.DIDComponents components = aurigraphDIDMethod.parseDID(did);

        assertEquals("aurigraph", components.method());
        assertEquals("testnet", components.network());
        assertEquals("abc123def456abc123def456abc123de", components.uniqueId());
    }

    @Test
    @Order(13)
    @DisplayName("Test DID creation")
    void testDIDCreation() {
        AurigraphDIDMethod.DIDCreationResult result =
                aurigraphDIDMethod.createDID(TEST_NETWORK, TEST_PUBLIC_KEY);

        assertNotNull(result);
        assertNotNull(result.getDid());
        assertTrue(result.getDid().startsWith("did:aurigraph:testnet:"));
        assertNotNull(result.getDocument());
        assertEquals(result.getDid(), result.getDocument().getId());
        assertTrue(result.getDurationMs() >= 0);

        // Store for later tests
        testDid = result.getDid();
    }

    @Test
    @Order(14)
    @DisplayName("Test DID creation with different key types")
    void testDIDCreationWithKeyTypes() {
        // Ed25519
        AurigraphDIDMethod.DIDCreationResult ed25519Result = aurigraphDIDMethod.createDID(
                TEST_NETWORK, TEST_PUBLIC_KEY, null, AurigraphDIDMethod.DIDKeyType.ED25519);
        assertTrue(ed25519Result.getDocument().getVerificationMethod().get(0).getType().contains("Ed25519"));

        // Hybrid
        AurigraphDIDMethod.DIDCreationResult hybridResult = aurigraphDIDMethod.createDID(
                TEST_NETWORK, TEST_PUBLIC_KEY, null, AurigraphDIDMethod.DIDKeyType.HYBRID);
        assertTrue(hybridResult.getDocument().getVerificationMethod().size() >= 2);
    }

    @Test
    @Order(15)
    @DisplayName("Test DID creation with service endpoints")
    void testDIDCreationWithServices() {
        List<AurigraphDIDMethod.ServiceEndpointRequest> services = List.of(
                new AurigraphDIDMethod.ServiceEndpointRequest("api", "APIService", "https://api.example.com"),
                new AurigraphDIDMethod.ServiceEndpointRequest("web", "LinkedDomains", "https://example.com")
        );

        AurigraphDIDMethod.DIDCreationResult result = aurigraphDIDMethod.createDID(
                TEST_NETWORK, TEST_PUBLIC_KEY, services, AurigraphDIDMethod.DIDKeyType.DILITHIUM);

        // Should have provided services plus default Aurigraph services
        assertTrue(result.getDocument().getService().size() >= 2);
    }

    @Test
    @Order(16)
    @DisplayName("Test DID creation - invalid network")
    void testDIDCreationInvalidNetwork() {
        assertThrows(IllegalArgumentException.class, () ->
                aurigraphDIDMethod.createDID("invalidnetwork", TEST_PUBLIC_KEY));
    }

    @Test
    @Order(17)
    @DisplayName("Test DID creation - null public key")
    void testDIDCreationNullPublicKey() {
        assertThrows(IllegalArgumentException.class, () ->
                aurigraphDIDMethod.createDID(TEST_NETWORK, null));
    }

    // ==================== DID Resolution Tests ====================

    @Test
    @Order(20)
    @DisplayName("Test DID resolution - existing DID")
    void testDIDResolution() {
        // First create a DID
        AurigraphDIDMethod.DIDCreationResult created =
                aurigraphDIDMethod.createDID(TEST_NETWORK, TEST_PUBLIC_KEY);

        // Then resolve it
        DIDResolver.ResolutionResult result = didResolver.resolve(created.getDid());

        assertTrue(result.isSuccess());
        assertNotNull(result.getDocument());
        assertEquals(created.getDid(), result.getDocument().getId());
    }

    @Test
    @Order(21)
    @DisplayName("Test DID resolution - non-existent DID")
    void testDIDResolutionNotFound() {
        DIDResolver.ResolutionResult result =
                didResolver.resolve("did:aurigraph:testnet:nonexistent123456789012345678901");

        assertFalse(result.isSuccess());
        assertNull(result.getDocument());
        assertEquals("notFound", result.getMetadata().getError());
    }

    @Test
    @Order(22)
    @DisplayName("Test DID resolution - invalid format")
    void testDIDResolutionInvalidFormat() {
        DIDResolver.ResolutionResult result = didResolver.resolve("not-a-valid-did");

        assertFalse(result.isSuccess());
        assertEquals("invalidDid", result.getMetadata().getError());
    }

    @Test
    @Order(23)
    @DisplayName("Test did:key resolution")
    void testDidKeyResolution() {
        String didKey = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
        DIDResolver.ResolutionResult result = didResolver.resolve(didKey);

        assertTrue(result.isSuccess());
        assertNotNull(result.getDocument());
        assertEquals(didKey, result.getDocument().getId());
    }

    @Test
    @Order(24)
    @DisplayName("Test DID resolution caching")
    void testDIDResolutionCaching() {
        // Create a DID
        AurigraphDIDMethod.DIDCreationResult created =
                aurigraphDIDMethod.createDID(TEST_NETWORK, TEST_PUBLIC_KEY);

        // First resolution - cache miss
        DIDResolver.ResolutionResult result1 = didResolver.resolve(created.getDid());
        assertFalse(result1.isCacheHit());

        // Second resolution - should be cache hit
        DIDResolver.ResolutionResult result2 = didResolver.resolve(created.getDid());
        assertTrue(result2.isCacheHit());
    }

    // ==================== Verifiable Credential Tests ====================

    @Test
    @Order(30)
    @DisplayName("Test Verifiable Credential creation")
    void testVCCreation() {
        String issuerDid = "did:aurigraph:testnet:issuer123";
        String subjectDid = "did:aurigraph:testnet:subject456";
        String credentialId = "urn:uuid:" + UUID.randomUUID();

        VerifiableCredential vc = VerifiableCredential.create(credentialId, issuerDid, subjectDid);

        assertNotNull(vc);
        assertEquals(credentialId, vc.getId());
        assertEquals(issuerDid, vc.getIssuerDid());
        assertEquals(subjectDid, vc.getSubjectDid());
        assertTrue(vc.getType().contains("VerifiableCredential"));
    }

    @Test
    @Order(31)
    @DisplayName("Test KYC Credential creation")
    void testKYCCredentialCreation() {
        VerifiableCredential.KYCCredentialSubject kycSubject = new VerifiableCredential.KYCCredentialSubject();
        kycSubject.setVerificationLevel("ENHANCED");
        kycSubject.setVerifiedAt(Instant.now());
        kycSubject.setJurisdiction("US");
        kycSubject.setVerificationMethod("DocumentVerification");
        kycSubject.setName("John Doe");

        VerifiableCredential vc = VerifiableCredential.createKYCCredential(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject",
                kycSubject
        );

        assertTrue(vc.getType().contains("KYCCredential"));
        assertTrue(vc.getContext().contains(VerifiableCredential.AURIGRAPH_VC_CONTEXT));
    }

    @Test
    @Order(32)
    @DisplayName("Test Membership Credential creation")
    void testMembershipCredentialCreation() {
        VerifiableCredential.MembershipCredentialSubject memberSubject =
                new VerifiableCredential.MembershipCredentialSubject();
        memberSubject.setOrganizationId("org-123");
        memberSubject.setOrganizationName("Aurigraph DLT Corp");
        memberSubject.setMembershipType("PREMIUM");
        memberSubject.setMemberSince(Instant.now());
        memberSubject.setStatus("ACTIVE");
        memberSubject.setRoles(List.of("ADMIN", "DEVELOPER"));

        VerifiableCredential vc = VerifiableCredential.createMembershipCredential(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject",
                memberSubject
        );

        assertTrue(vc.getType().contains("MembershipCredential"));
    }

    @Test
    @Order(33)
    @DisplayName("Test Verifiable Credential validation - valid")
    void testVCValidationValid() {
        VerifiableCredential vc = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject"
        );

        VerifiableCredential.ValidationResult result = vc.validate();
        assertTrue(result.isValid());
        assertTrue(result.errors().isEmpty());
    }

    @Test
    @Order(34)
    @DisplayName("Test Verifiable Credential validation - missing issuer")
    void testVCValidationMissingIssuer() {
        VerifiableCredential vc = new VerifiableCredential();
        vc.setId("urn:uuid:" + UUID.randomUUID());
        vc.setIssuanceDate(Instant.now().toString());
        vc.setCredentialSubject(Map.of("id", "did:example:subject"));
        // No issuer set

        VerifiableCredential.ValidationResult result = vc.validate();
        assertFalse(result.isValid());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("issuer")));
    }

    @Test
    @Order(35)
    @DisplayName("Test Verifiable Credential expiration check")
    void testVCExpirationCheck() {
        VerifiableCredential vc = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject"
        );

        // Not expired
        vc.withExpiration(Instant.now().plusSeconds(3600));
        assertFalse(vc.isExpired());

        // Expired
        vc.setExpirationDate(Instant.now().minusSeconds(3600).toString());
        assertTrue(vc.isExpired());
    }

    @Test
    @Order(36)
    @DisplayName("Test Verifiable Credential JSON-LD serialization")
    void testVCSerialization() throws Exception {
        VerifiableCredential vc = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject"
        );
        vc.addType("TestCredential");
        vc.withExpiration(Instant.now().plusSeconds(86400));

        String jsonLd = vc.toJsonLd();

        assertNotNull(jsonLd);
        assertTrue(jsonLd.contains("VerifiableCredential"));
        assertTrue(jsonLd.contains("TestCredential"));

        // Deserialize
        VerifiableCredential parsed = VerifiableCredential.fromJsonLd(jsonLd);
        assertEquals(vc.getId(), parsed.getId());
    }

    // ==================== Verifiable Presentation Tests ====================

    @Test
    @Order(40)
    @DisplayName("Test Verifiable Presentation creation")
    void testVPCreation() {
        String holderDid = "did:aurigraph:testnet:holder123";
        VerifiablePresentation vp = VerifiablePresentation.create("urn:uuid:" + UUID.randomUUID(), holderDid);

        assertNotNull(vp);
        assertEquals(holderDid, vp.getHolder());
        assertTrue(vp.getType().contains("VerifiablePresentation"));
    }

    @Test
    @Order(41)
    @DisplayName("Test Verifiable Presentation with credentials")
    void testVPWithCredentials() {
        String holderDid = "did:aurigraph:testnet:holder123";

        VerifiableCredential vc1 = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer1",
                holderDid
        );
        vc1.addType("KYCCredential");

        VerifiableCredential vc2 = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer2",
                holderDid
        );
        vc2.addType("MembershipCredential");

        VerifiablePresentation vp = VerifiablePresentation.createFromCredentials(
                holderDid, List.of(vc1, vc2));

        assertEquals(2, vp.getCredentialCount());
        assertTrue(vp.isHolderSubjectOfAllCredentials());
    }

    @Test
    @Order(42)
    @DisplayName("Test Verifiable Presentation validation")
    void testVPValidation() {
        VerifiableCredential vc = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject"
        );

        VerifiablePresentation vp = VerifiablePresentation.createFromCredentials(
                "did:aurigraph:testnet:subject", List.of(vc));

        VerifiablePresentation.ValidationResult result = vp.validate();
        assertTrue(result.isValid());
    }

    @Test
    @Order(43)
    @DisplayName("Test selective disclosure")
    void testSelectiveDisclosure() {
        VerifiableCredential.KYCCredentialSubject kycSubject = new VerifiableCredential.KYCCredentialSubject();
        kycSubject.setVerificationLevel("ENHANCED");
        kycSubject.setVerifiedAt(Instant.now());
        kycSubject.setJurisdiction("US");
        kycSubject.setName("John Doe");
        kycSubject.setDateOfBirth("1990-01-01");

        VerifiableCredential vc = VerifiableCredential.createKYCCredential(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:subject",
                kycSubject
        );

        // Only disclose verification level and jurisdiction
        Set<String> disclosedClaims = Set.of("id", "verificationLevel", "jurisdiction");
        VerifiableCredential disclosed = VerifiablePresentation.selectivelyDisclose(vc, disclosedClaims);

        @SuppressWarnings("unchecked")
        Map<String, Object> subject = (Map<String, Object>) disclosed.getCredentialSubject();

        assertTrue(subject.containsKey("id"));
        assertTrue(subject.containsKey("verificationLevel"));
        assertTrue(subject.containsKey("jurisdiction"));
        assertFalse(subject.containsKey("name"));
        assertFalse(subject.containsKey("dateOfBirth"));
    }

    @Test
    @Order(44)
    @DisplayName("Test Verifiable Presentation JSON-LD serialization")
    void testVPSerialization() throws Exception {
        VerifiableCredential vc = VerifiableCredential.create(
                "urn:uuid:" + UUID.randomUUID(),
                "did:aurigraph:testnet:issuer",
                "did:aurigraph:testnet:holder"
        );

        VerifiablePresentation vp = VerifiablePresentation.createFromCredentials(
                "did:aurigraph:testnet:holder", List.of(vc));

        String jsonLd = vp.toJsonLd();

        assertNotNull(jsonLd);
        assertTrue(jsonLd.contains("VerifiablePresentation"));

        VerifiablePresentation parsed = VerifiablePresentation.fromJsonLd(jsonLd);
        assertEquals(vp.getId(), parsed.getId());
        assertEquals(vp.getHolder(), parsed.getHolder());
    }

    // ==================== Integration Tests ====================

    @Test
    @Order(50)
    @DisplayName("Test full DID lifecycle")
    void testFullDIDLifecycle() {
        // Create
        AurigraphDIDMethod.DIDCreationResult created =
                aurigraphDIDMethod.createDID(TEST_NETWORK, TEST_PUBLIC_KEY);
        String did = created.getDid();
        assertNotNull(did);

        // Resolve
        DIDResolver.ResolutionResult resolved = didResolver.resolve(did);
        assertTrue(resolved.isSuccess());

        // Update
        AurigraphDIDMethod.DIDUpdateRequest updates = new AurigraphDIDMethod.DIDUpdateRequest();
        DIDDocument.ServiceEndpoint newService = new DIDDocument.ServiceEndpoint();
        newService.setId(did + "#new-service");
        newService.setType("NewService");
        newService.setServiceEndpoint("https://new.service.io");
        updates.setAddServices(List.of(newService));

        byte[] proof = new byte[32];
        new java.security.SecureRandom().nextBytes(proof);
        AurigraphDIDMethod.DIDUpdateResult updated = aurigraphDIDMethod.update(did, updates, proof);
        assertEquals("2", updated.getNewVersion());

        // Deactivate
        AurigraphDIDMethod.DIDDeactivationResult deactivated = aurigraphDIDMethod.deactivate(did, proof);
        assertNotNull(deactivated.getDeactivatedAt());

        // Verify deactivation
        DIDResolver.ResolutionResult resolvedAfter = didResolver.resolve(did);
        assertTrue(resolvedAfter.isDeactivated());
    }

    @Test
    @Order(51)
    @DisplayName("Test DID statistics")
    void testDIDStatistics() {
        Map<String, Long> stats = aurigraphDIDMethod.getDIDCountByNetwork();

        assertNotNull(stats);
        assertTrue(stats.containsKey("mainnet"));
        assertTrue(stats.containsKey("testnet"));
        assertTrue(stats.containsKey("devnet"));
    }

    @Test
    @Order(52)
    @DisplayName("Test resolver statistics")
    void testResolverStatistics() {
        DIDResolver.ResolverStatistics stats = didResolver.getStatistics();

        assertNotNull(stats);
        assertTrue(stats.totalResolutions() >= 0);
        assertTrue(stats.cacheHits() >= 0);
        assertTrue(stats.hitRate() >= 0.0 && stats.hitRate() <= 1.0);
    }
}
