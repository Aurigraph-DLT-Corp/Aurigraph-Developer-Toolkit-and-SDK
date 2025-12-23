package io.aurigraph.v11.contracts.composite;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PrimaryToken class
 * Tests ERC-721 primary token functionality
 */
@DisplayName("Primary Token Unit Tests")
public class PrimaryTokenTest {

    private PrimaryToken primaryToken;
    private String testTokenId;
    private String testAssetId;

    @BeforeEach
    void setUp() {
        testTokenId = "PRIMARY-" + UUID.randomUUID();
        testAssetId = "ASSET-" + UUID.randomUUID();

        primaryToken = PrimaryToken.builder()
            .tokenId(testTokenId)
            .compositeId("COMP-123")
            .assetId(testAssetId)
            .assetType("REAL_ESTATE")
            .ownerAddress("0x1234567890abcdef")
            .legalTitle("SHA256HASH123456")
            .jurisdiction("US-NY")
            .coordinates("40.7128,-74.0060")
            .fractionalizable(false)
            .createdAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("Should create primary token with builder")
    void testPrimaryTokenCreation() {
        assertNotNull(primaryToken);
        assertEquals(testTokenId, primaryToken.getTokenId());
        assertEquals(testAssetId, primaryToken.getAssetId());
    }

    @Test
    @DisplayName("Should track token ID")
    void testTokenIdTracking() {
        assertEquals(testTokenId, primaryToken.getTokenId());
    }

    @Test
    @DisplayName("Should track composite ID reference")
    void testCompositeIdReference() {
        assertEquals("COMP-123", primaryToken.getCompositeId());
    }

    @Test
    @DisplayName("Should track asset ID")
    void testAssetIdTracking() {
        assertEquals(testAssetId, primaryToken.getAssetId());
    }

    @ParameterizedTest
    @ValueSource(strings = {"REAL_ESTATE", "CARBON_CREDIT", "COMMODITY", "FINANCIAL"})
    @DisplayName("Should support multiple asset types")
    void testMultipleAssetTypes(String assetType) {
        PrimaryToken token = PrimaryToken.builder()
            .tokenId("TOKEN-" + UUID.randomUUID())
            .assetId(testAssetId)
            .assetType(assetType)
            .build();

        assertEquals(assetType, token.getAssetType());
    }

    @Test
    @DisplayName("Should track owner address")
    void testOwnerAddressTracking() {
        assertEquals("0x1234567890abcdef", primaryToken.getOwnerAddress());
    }

    @Test
    @DisplayName("Should allow owner address updates")
    void testOwnerAddressUpdate() {
        String newOwner = "0xnewowner123";
        primaryToken.setOwnerAddress(newOwner);
        assertEquals(newOwner, primaryToken.getOwnerAddress());
    }

    @Test
    @DisplayName("Should track legal title hash")
    void testLegalTitleTracking() {
        assertEquals("SHA256HASH123456", primaryToken.getLegalTitle());
    }

    @Test
    @DisplayName("Should track jurisdiction")
    void testJurisdictionTracking() {
        assertEquals("US-NY", primaryToken.getJurisdiction());
    }

    @Test
    @DisplayName("Should track GPS coordinates")
    void testCoordinatesTracking() {
        assertEquals("40.7128,-74.0060", primaryToken.getCoordinates());
    }

    @Test
    @DisplayName("Should track fractionalization capability")
    void testFractionalizationFlag() {
        assertFalse(primaryToken.isFractionalizable());
    }

    @Test
    @DisplayName("Should support fractionalizable tokens")
    void testFractionalizableToken() {
        PrimaryToken fractionalToken = PrimaryToken.builder()
            .tokenId("FRAC-TOKEN-" + UUID.randomUUID())
            .assetId(testAssetId)
            .assetType("REAL_ESTATE")
            .fractionalizable(true)
            .build();

        assertTrue(fractionalToken.isFractionalizable());
    }

    @Test
    @DisplayName("Should track creation timestamp")
    void testCreationTimestamp() {
        assertNotNull(primaryToken.getCreatedAt());
        assertTrue(primaryToken.getCreatedAt().isBefore(Instant.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Should initialize metadata")
    void testMetadataInitialization() {
        assertNotNull(primaryToken.getMetadata());
        assertTrue(primaryToken.getMetadata().isEmpty());
    }

    @Test
    @DisplayName("Should handle metadata storage")
    void testMetadataStorage() {
        primaryToken.getMetadata().put("description", "High-value property");
        primaryToken.getMetadata().put("square_feet", "5000");

        assertEquals("High-value property", primaryToken.getMetadata().get("description"));
        assertEquals("5000", primaryToken.getMetadata().get("square_feet"));
    }

    @Test
    @DisplayName("Builder should create independent instances")
    void testBuilderIndependence() {
        PrimaryToken token1 = PrimaryToken.builder()
            .tokenId("TOKEN-1")
            .assetId("ASSET-1")
            .assetType("REAL_ESTATE")
            .ownerAddress("0xowner1")
            .build();

        PrimaryToken token2 = PrimaryToken.builder()
            .tokenId("TOKEN-2")
            .assetId("ASSET-2")
            .assetType("CARBON_CREDIT")
            .ownerAddress("0xowner2")
            .build();

        assertNotEquals(token1.getTokenId(), token2.getTokenId());
        assertNotEquals(token1.getAssetId(), token2.getAssetId());
        assertNotEquals(token1.getAssetType(), token2.getAssetType());
    }

    @Test
    @DisplayName("Should handle complex jurisdictions")
    void testJurisdictionVariations() {
        PrimaryToken token = PrimaryToken.builder()
            .tokenId("TOKEN-" + UUID.randomUUID())
            .assetId(testAssetId)
            .jurisdiction("EU-DE")
            .build();

        assertEquals("EU-DE", token.getJurisdiction());
    }

    @Test
    @DisplayName("Should track all builder parameters")
    void testBuilderCompleteness() {
        PrimaryToken token = PrimaryToken.builder()
            .tokenId("COMPLETE-TOKEN")
            .compositeId("COMP-COMPLETE")
            .assetId("ASSET-COMPLETE")
            .assetType("FINANCIAL")
            .ownerAddress("0xowner")
            .legalTitle("LEGAL-HASH")
            .jurisdiction("US-CA")
            .coordinates("34.0522,-118.2437")
            .fractionalizable(true)
            .createdAt(Instant.now())
            .build();

        assertEquals("COMPLETE-TOKEN", token.getTokenId());
        assertEquals("COMP-COMPLETE", token.getCompositeId());
        assertEquals("ASSET-COMPLETE", token.getAssetId());
        assertEquals("FINANCIAL", token.getAssetType());
        assertEquals("0xowner", token.getOwnerAddress());
        assertEquals("LEGAL-HASH", token.getLegalTitle());
        assertEquals("US-CA", token.getJurisdiction());
        assertEquals("34.0522,-118.2437", token.getCoordinates());
        assertTrue(token.isFractionalizable());
        assertNotNull(token.getCreatedAt());
    }

    @Test
    @DisplayName("Should preserve immutable properties")
    void testPropertyPreservation() {
        String originalTokenId = primaryToken.getTokenId();
        String originalAssetId = primaryToken.getAssetId();
        Instant originalCreatedAt = primaryToken.getCreatedAt();

        // Update mutable property
        primaryToken.setOwnerAddress("0xnew");

        // Verify immutable properties unchanged
        assertEquals(originalTokenId, primaryToken.getTokenId());
        assertEquals(originalAssetId, primaryToken.getAssetId());
        assertEquals(originalCreatedAt, primaryToken.getCreatedAt());
    }

    @Test
    @DisplayName("Should handle null optional fields")
    void testNullOptionalFields() {
        PrimaryToken token = PrimaryToken.builder()
            .tokenId("MIN-TOKEN")
            .assetId("MIN-ASSET")
            .build();

        assertNotNull(token.getTokenId());
        assertNotNull(token.getAssetId());
        assertNotNull(token.getMetadata());
    }

    @Test
    @DisplayName("Should support coordinate formats")
    void testCoordinateFormats() {
        PrimaryToken token1 = PrimaryToken.builder()
            .tokenId("TOKEN-1")
            .coordinates("40.7128,-74.0060")  // Decimal format
            .build();

        PrimaryToken token2 = PrimaryToken.builder()
            .tokenId("TOKEN-2")
            .coordinates("40°42'46.08\"N 74°00'21.60\"W")  // DMS format
            .build();

        assertNotNull(token1.getCoordinates());
        assertNotNull(token2.getCoordinates());
    }

    @Test
    @DisplayName("Should track realistic legal title hashes")
    void testRealWorldLegalTitles() {
        String sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        PrimaryToken token = PrimaryToken.builder()
            .tokenId("REAL-TOKEN")
            .assetId("REAL-ASSET")
            .legalTitle(sha256Hash)
            .build();

        assertEquals(sha256Hash, token.getLegalTitle());
    }
}
