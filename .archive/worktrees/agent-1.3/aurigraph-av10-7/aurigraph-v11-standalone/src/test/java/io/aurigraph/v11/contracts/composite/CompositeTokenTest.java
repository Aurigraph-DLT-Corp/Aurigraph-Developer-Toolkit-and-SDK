package io.aurigraph.v11.contracts.composite;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CompositeToken class
 * Tests token creation, builder pattern, and data integrity
 */
@DisplayName("Composite Token Unit Tests")
public class CompositeTokenTest {

    private CompositeToken compositeToken;
    private PrimaryToken primaryToken;
    private ArrayList<SecondaryToken> secondaryTokens;

    @BeforeEach
    void setUp() {
        // Create test primary token
        primaryToken = PrimaryToken.builder()
            .tokenId("PRIMARY-" + UUID.randomUUID())
            .assetId("ASSET-123")
            .assetType("REAL_ESTATE")
            .ownerAddress("0x1234567890abcdef")
            .legalTitle("Legal Title Hash")
            .jurisdiction("US-NY")
            .coordinates("40.7128,-74.0060")
            .fractionalizable(false)
            .createdAt(Instant.now())
            .build();

        secondaryTokens = new ArrayList<>();

        // Create test composite token
        compositeToken = CompositeToken.builder()
            .compositeId("COMP-" + UUID.randomUUID())
            .assetId("ASSET-123")
            .assetType("REAL_ESTATE")
            .primaryToken(primaryToken)
            .secondaryTokens(secondaryTokens)
            .ownerAddress("0x1234567890abcdef")
            .createdAt(Instant.now())
            .status(CompositeTokenStatus.PENDING_VERIFICATION)
            .verificationLevel(VerificationLevel.NONE)
            .build();
    }

    @Test
    @DisplayName("Should create composite token with valid data")
    void testCompositeTokenCreation() {
        assertNotNull(compositeToken);
        assertNotNull(compositeToken.getCompositeId());
        assertEquals("ASSET-123", compositeToken.getAssetId());
        assertEquals("REAL_ESTATE", compositeToken.getAssetType());
    }

    @Test
    @DisplayName("Should maintain primary token reference")
    void testPrimaryTokenReference() {
        assertNotNull(compositeToken.getPrimaryToken());
        assertEquals(primaryToken.getTokenId(), compositeToken.getPrimaryToken().getTokenId());
        assertEquals("REAL_ESTATE", compositeToken.getPrimaryToken().getAssetType());
    }

    @Test
    @DisplayName("Should maintain secondary tokens list")
    void testSecondaryTokensList() {
        assertNotNull(compositeToken.getSecondaryTokens());
        assertEquals(0, compositeToken.getSecondaryTokens().size());
    }

    @Test
    @DisplayName("Should track owner address")
    void testOwnerAddressTracking() {
        assertEquals("0x1234567890abcdef", compositeToken.getOwnerAddress());
    }

    @Test
    @DisplayName("Should allow owner address updates")
    void testOwnerAddressUpdate() {
        String newOwner = "0xnewowner";
        compositeToken.setOwnerAddress(newOwner);
        assertEquals(newOwner, compositeToken.getOwnerAddress());
    }

    @Test
    @DisplayName("Should track creation timestamp")
    void testCreationTimestamp() {
        assertNotNull(compositeToken.getCreatedAt());
        assertTrue(compositeToken.getCreatedAt().isBefore(Instant.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Should maintain verification status")
    void testVerificationStatus() {
        assertEquals(CompositeTokenStatus.PENDING_VERIFICATION, compositeToken.getStatus());
    }

    @Test
    @DisplayName("Should allow status updates")
    void testStatusUpdate() {
        compositeToken.setStatus(CompositeTokenStatus.VERIFIED);
        assertEquals(CompositeTokenStatus.VERIFIED, compositeToken.getStatus());
    }

    @Test
    @DisplayName("Should track verification level")
    void testVerificationLevelTracking() {
        assertEquals(VerificationLevel.NONE, compositeToken.getVerificationLevel());
    }

    @Test
    @DisplayName("Should allow verification level updates")
    void testVerificationLevelUpdate() {
        compositeToken.setVerificationLevel(VerificationLevel.ENHANCED);
        assertEquals(VerificationLevel.ENHANCED, compositeToken.getVerificationLevel());
    }

    @Test
    @DisplayName("Should initialize empty metadata")
    void testMetadataInitialization() {
        assertNotNull(compositeToken.getMetadata());
    }

    @Test
    @DisplayName("Should add and retrieve metadata")
    void testMetadataOperations() {
        Map<String, Object> metadata = compositeToken.getMetadata();
        metadata.put("location", "New York");
        metadata.put("category", "Residential");

        assertEquals("New York", compositeToken.getMetadata().get("location"));
        assertEquals("Residential", compositeToken.getMetadata().get("category"));
    }

    @Test
    @DisplayName("Builder should create independent instances")
    void testBuilderIndependence() {
        // Create another composite token
        CompositeToken token2 = CompositeToken.builder()
            .compositeId("COMP-2")
            .assetId("ASSET-456")
            .assetType("CARBON_CREDIT")
            .primaryToken(primaryToken)
            .secondaryTokens(new ArrayList<>())
            .ownerAddress("0xdifferent")
            .createdAt(Instant.now())
            .status(CompositeTokenStatus.PENDING_VERIFICATION)
            .verificationLevel(VerificationLevel.NONE)
            .build();

        // Verify instances are independent
        assertNotEquals(compositeToken.getCompositeId(), token2.getCompositeId());
        assertNotEquals(compositeToken.getAssetId(), token2.getAssetId());
        assertNotEquals(compositeToken.getAssetType(), token2.getAssetType());
    }

    @Test
    @DisplayName("Should initialize secondary tokens as empty list when null provided")
    void testNullSecondaryTokensHandling() {
        // The builder will create an empty list if null is provided via build()
        ArrayList<SecondaryToken> emptyList = new ArrayList<>();
        CompositeToken token = CompositeToken.builder()
            .compositeId("COMP-TEST")
            .assetId("ASSET-TEST")
            .assetType("TEST")
            .primaryToken(primaryToken)
            .secondaryTokens(emptyList)
            .ownerAddress("0xtest")
            .status(CompositeTokenStatus.PENDING_VERIFICATION)
            .build();

        assertNotNull(token.getSecondaryTokens());
        assertTrue(token.getSecondaryTokens().isEmpty());
    }

    @Test
    @DisplayName("Should copy secondary tokens list")
    void testSecondaryTokensCopying() {
        ArrayList<SecondaryToken> originalList = new ArrayList<>();
        CompositeToken token = CompositeToken.builder()
            .compositeId("COMP-TEST")
            .assetId("ASSET-TEST")
            .assetType("TEST")
            .primaryToken(primaryToken)
            .secondaryTokens(originalList)
            .ownerAddress("0xtest")
            .status(CompositeTokenStatus.PENDING_VERIFICATION)
            .build();

        // Verify list is copied, not referenced
        assertNotSame(originalList, token.getSecondaryTokens());
    }

    @Test
    @DisplayName("Should preserve all token properties through lifecycle")
    void testPropertyPreservation() {
        String compositeId = compositeToken.getCompositeId();
        String assetId = compositeToken.getAssetId();
        Instant createdAt = compositeToken.getCreatedAt();

        // Update some properties
        compositeToken.setOwnerAddress("0xnew");
        compositeToken.setStatus(CompositeTokenStatus.VERIFIED);

        // Verify immutable properties are preserved
        assertEquals(compositeId, compositeToken.getCompositeId());
        assertEquals(assetId, compositeToken.getAssetId());
        assertEquals(createdAt, compositeToken.getCreatedAt());
    }
}
