package io.aurigraph.v11.contracts.composite;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CompositeTokenFactory
 */
@QuarkusTest
public class CompositeTokenFactoryTest {

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    private CompositeTokenRequest testRequest;

    @BeforeEach
    void setUp() {
        testRequest = new CompositeTokenRequest();
        testRequest.setAssetId("ASSET-123456");
        testRequest.setAssetType("REAL_ESTATE");
        testRequest.setOwnerAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
        testRequest.setLegalTitle("123 Main Street, Property Title");
        testRequest.setJurisdiction("United States");
        testRequest.setCoordinates("40.7128,-74.0060");
        testRequest.setFractionalizable(true);
        testRequest.setRequiredVerificationLevel(VerificationLevel.ENHANCED);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("propertyType", "Commercial");
        metadata.put("squareFeet", "10000");
        metadata.put("yearBuilt", "2020");
        testRequest.setMetadata(metadata);
    }

    @Test
    void testCreateCompositeToken() {
        // Act
        CompositeTokenResult result = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();

        // Assert
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getCompositeToken());
        assertTrue(result.getCompositeToken().getCompositeId().startsWith("wAUR-COMPOSITE-"));
        assertEquals("ASSET-123456", result.getCompositeToken().getAssetId());
        assertEquals("REAL_ESTATE", result.getCompositeToken().getAssetType());
        assertEquals("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", 
                    result.getCompositeToken().getOwnerAddress());
        assertEquals(CompositeTokenStatus.PENDING_VERIFICATION, 
                    result.getCompositeToken().getStatus());
    }

    @Test
    void testGetCompositeToken() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();

        // Act
        CompositeToken retrievedToken = compositeTokenFactory.getCompositeToken(compositeId)
            .await().indefinitely();

        // Assert
        assertNotNull(retrievedToken);
        assertEquals(compositeId, retrievedToken.getCompositeId());
        assertEquals("ASSET-123456", retrievedToken.getAssetId());
    }

    @Test
    void testGetSecondaryTokens() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();

        // Act
        List<SecondaryToken> secondaryTokens = compositeTokenFactory.getSecondaryTokens(compositeId)
            .await().indefinitely();

        // Assert
        assertNotNull(secondaryTokens);
        assertEquals(6, secondaryTokens.size()); // Should have 6 secondary tokens
        
        // Verify all token types are present
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.OWNER));
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.COLLATERAL));
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.MEDIA));
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.VERIFICATION));
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.VALUATION));
        assertTrue(secondaryTokens.stream().anyMatch(t -> t.getTokenType() == SecondaryTokenType.COMPLIANCE));
    }

    @Test
    void testGetSpecificSecondaryToken() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();

        // Act
        SecondaryToken ownerToken = compositeTokenFactory.getSecondaryToken(
            compositeId, SecondaryTokenType.OWNER
        ).await().indefinitely();

        // Assert
        assertNotNull(ownerToken);
        assertEquals(SecondaryTokenType.OWNER, ownerToken.getTokenType());
        assertTrue(ownerToken instanceof OwnerToken);
        
        OwnerToken owner = (OwnerToken) ownerToken;
        assertEquals("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", owner.getCurrentOwner());
        assertEquals(BigDecimal.valueOf(100), owner.getOwnershipPercentage());
    }

    @Test
    void testUpdateSecondaryToken() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();
        
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("currentValue", "1500000");
        updateData.put("baseCurrency", "USD");

        // Act
        Boolean updateResult = compositeTokenFactory.updateSecondaryToken(
            compositeId, SecondaryTokenType.VALUATION, updateData
        ).await().indefinitely();

        // Assert
        assertTrue(updateResult);
        
        // Verify the update
        SecondaryToken valuationToken = compositeTokenFactory.getSecondaryToken(
            compositeId, SecondaryTokenType.VALUATION
        ).await().indefinitely();
        
        assertNotNull(valuationToken);
        ValuationToken valuation = (ValuationToken) valuationToken;
        assertEquals(new BigDecimal("1500000"), valuation.getCurrentValue());
        assertEquals("USD", valuation.getBaseCurrency());
    }

    @Test
    void testAddVerificationResult() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();
        
        VerificationResult verificationResult = new VerificationResult(
            "VER-1-ACME-12345",
            "ACME Appraisals",
            "Real Estate Appraiser",
            VerificationLevel.ENHANCED,
            true,
            new BigDecimal("1500000"),
            8,
            "Property verified and in excellent condition"
        );

        // Act
        Boolean addResult = compositeTokenFactory.addVerificationResult(compositeId, verificationResult)
            .await().indefinitely();

        // Assert
        assertTrue(addResult);
        
        // Verify the verification was added
        SecondaryToken verificationToken = compositeTokenFactory.getSecondaryToken(
            compositeId, SecondaryTokenType.VERIFICATION
        ).await().indefinitely();
        
        assertNotNull(verificationToken);
        VerificationToken verification = (VerificationToken) verificationToken;
        assertEquals(1, verification.getVerificationResults().size());
    }

    @Test
    void testTransferCompositeToken() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();
        
        // First, mark the token as verified (required for transfer)
        CompositeToken token = compositeTokenFactory.getCompositeToken(compositeId)
            .await().indefinitely();
        token.setStatus(CompositeTokenStatus.VERIFIED);
        
        String fromAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
        String toAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";

        // Act
        Boolean transferResult = compositeTokenFactory.transferCompositeToken(
            compositeId, fromAddress, toAddress
        ).await().indefinitely();

        // Assert
        assertTrue(transferResult);
        
        // Verify ownership was transferred
        CompositeToken transferredToken = compositeTokenFactory.getCompositeToken(compositeId)
            .await().indefinitely();
        assertEquals(toAddress, transferredToken.getOwnerAddress());
        
        // Verify owner token was updated
        SecondaryToken ownerToken = compositeTokenFactory.getSecondaryToken(
            compositeId, SecondaryTokenType.OWNER
        ).await().indefinitely();
        OwnerToken owner = (OwnerToken) ownerToken;
        assertEquals(toAddress, owner.getCurrentOwner());
    }

    @Test
    void testGetCompositeTokensByType() {
        // Arrange - Create multiple tokens
        testRequest.setAssetType("REAL_ESTATE");
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();
        
        testRequest.setAssetType("COMMODITY");
        testRequest.setAssetId("ASSET-999999");
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();

        // Act
        List<CompositeToken> realEstateTokens = compositeTokenFactory
            .getCompositeTokensByType("REAL_ESTATE")
            .await().indefinitely();

        // Assert
        assertNotNull(realEstateTokens);
        assertTrue(realEstateTokens.size() >= 2);
        assertTrue(realEstateTokens.stream().allMatch(t -> "REAL_ESTATE".equals(t.getAssetType())));
    }

    @Test
    void testGetCompositeTokensByOwner() {
        // Arrange
        String ownerAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
        testRequest.setOwnerAddress(ownerAddress);
        
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();
        
        testRequest.setAssetId("ASSET-789012");
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();

        // Act
        List<CompositeToken> ownerTokens = compositeTokenFactory
            .getCompositeTokensByOwner(ownerAddress)
            .await().indefinitely();

        // Assert
        assertNotNull(ownerTokens);
        assertTrue(ownerTokens.size() >= 2);
        assertTrue(ownerTokens.stream().allMatch(t -> ownerAddress.equals(t.getOwnerAddress())));
    }

    @Test
    void testGetStats() {
        // Arrange - Create some tokens
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();
        
        testRequest.setAssetId("ASSET-999999");
        testRequest.setAssetType("COMMODITY");
        compositeTokenFactory.createCompositeToken(testRequest).await().indefinitely();

        // Act
        CompositeTokenStats stats = compositeTokenFactory.getStats()
            .await().indefinitely();

        // Assert
        assertNotNull(stats);
        assertTrue(stats.getTotalCompositeTokens() >= 2);
        assertNotNull(stats.getTypeDistribution());
        assertNotNull(stats.getStatusDistribution());
        assertTrue(stats.getTotalTokensCreated() >= 2);
        assertNotNull(stats.getTotalValue());
    }

    @Test
    void testTransferUnverifiedTokenFails() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();
        
        String fromAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
        String toAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            compositeTokenFactory.transferCompositeToken(compositeId, fromAddress, toAddress)
                .await().indefinitely();
        });
    }

    @Test
    void testUnauthorizedTransferFails() {
        // Arrange
        CompositeTokenResult createResult = compositeTokenFactory.createCompositeToken(testRequest)
            .await().indefinitely();
        String compositeId = createResult.getCompositeToken().getCompositeId();
        
        // Mark as verified to allow transfer
        CompositeToken token = compositeTokenFactory.getCompositeToken(compositeId)
            .await().indefinitely();
        token.setStatus(CompositeTokenStatus.VERIFIED);
        
        String wrongFromAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"; // Not the owner
        String toAddress = "0x1234567890123456789012345678901234567890";

        // Act & Assert
        assertThrows(CompositeTokenFactory.UnauthorizedTransferException.class, () -> {
            compositeTokenFactory.transferCompositeToken(compositeId, wrongFromAddress, toAddress)
                .await().indefinitely();
        });
    }
}