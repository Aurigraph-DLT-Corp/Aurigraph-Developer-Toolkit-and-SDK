package io.aurigraph.v11.hms;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.hms.HMSIntegrationService.HMSStats;
import io.aurigraph.v11.hms.HMSIntegrationService.RealWorldAsset;
import io.aurigraph.v11.hms.HMSIntegrationService.TokenizationRequest;
import io.aurigraph.v11.hms.HMSIntegrationService.TokenizationResponse;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive test suite for HMSIntegrationService.
 * 
 * Tests:
 * - Asset tokenization
 * - Asset management operations
 * - Asset transfer and ownership
 * - Performance under load
 * - Error handling
 * - Statistics and metrics
 * - Real-world asset validation
 */
@QuarkusTest
class HMSIntegrationServiceTest extends ServiceTestBase {
    
    @Inject
    HMSIntegrationService hmsService;
    
    @Override
    protected Object getServiceUnderTest() {
        return hmsService;
    }
    
    @BeforeEach
    @Override
    protected void setupTestEnvironment() {
        super.setupTestEnvironment();
        // Service starts clean for each test
    }
    
    @Test
    @DisplayName("Service should initialize correctly")
    void testServiceInitialization() {
        assertThat(hmsService)
            .as("HMS Service should not be null")
            .isNotNull();
        
        // Check initial statistics
        HMSStats stats = testReactiveSuccess(hmsService.getStats());
        assertThat(stats.totalAssets)
            .as("Initial asset count should be 0")
            .isEqualTo(0L);
        
        assertThat(stats.totalTransactions)
            .as("Initial transaction count should be 0")
            .isEqualTo(0L);
    }
    
    @Test
    @DisplayName("Should tokenize real-world assets successfully")
    void testAssetTokenization() {
        // Create tokenization request
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("propertyType", "residential");
        metadata.put("location", "San Francisco, CA");
        metadata.put("sqft", 2500);
        
        TokenizationRequest request = new TokenizationRequest(
            "real-estate",
            "owner123",
            BigDecimal.valueOf(500000),
            metadata
        );
        
        // Tokenize the asset
        TokenizationResponse response = testReactiveSuccess(hmsService.tokenizeAsset(request));
        
        // Verify response
        assertThat(response.assetId)
            .as("Asset ID should not be null or empty")
            .isNotNull()
            .isNotEmpty()
            .startsWith("HMS-");
            
        assertThat(response.tokenId)
            .as("Token ID should not be null or empty")
            .isNotNull()
            .isNotEmpty()
            .startsWith("TOKEN-");
            
        assertThat(response.status)
            .as("Status should be SUCCESS")
            .isEqualTo("SUCCESS");
            
        assertThat(response.timestamp)
            .as("Timestamp should not be null")
            .isNotNull();
    }
    
    @Test
    @DisplayName("Should retrieve tokenized assets correctly")
    void testAssetRetrieval() {
        // First tokenize an asset
        TokenizationRequest request = createSampleTokenizationRequest();
        TokenizationResponse response = testReactiveSuccess(hmsService.tokenizeAsset(request));
        
        // Retrieve the asset
        RealWorldAsset asset = testReactiveSuccess(hmsService.getAsset(response.assetId));
        
        // Verify asset properties
        assertThat(asset.assetId)
            .as("Asset ID should match")
            .isEqualTo(response.assetId);
            
        assertThat(asset.assetType)
            .as("Asset type should match")
            .isEqualTo(request.assetType);
            
        assertThat(asset.owner)
            .as("Owner should match")
            .isEqualTo(request.owner);
            
        assertThat(asset.value)
            .as("Value should match")
            .isEqualTo(request.value);
            
        assertThat(asset.status)
            .as("Status should be ACTIVE")
            .isEqualTo("ACTIVE");
            
        assertThat(asset.createdAt)
            .as("Created timestamp should not be null")
            .isNotNull();
    }
    
    @Test
    @DisplayName("Should handle asset not found scenario")
    void testAssetNotFound() {
        String nonExistentAssetId = "HMS-nonexistent";
        
        testReactiveFailure(
            hmsService.getAsset(nonExistentAssetId),
            java.util.NoSuchElementException.class
        );
    }
    
    @Test
    @DisplayName("Should list all assets correctly")
    void testListAssets() {
        // Initially should be empty
        List<RealWorldAsset> initialAssets = testReactiveSuccess(hmsService.listAssets());
        int initialCount = initialAssets.size();
        
        // Tokenize several assets
        int assetsToCreate = 3;
        for (int i = 0; i < assetsToCreate; i++) {
            TokenizationRequest request = new TokenizationRequest(
                "asset-type-" + i,
                "owner-" + i,
                BigDecimal.valueOf(100000 + i * 10000),
                Map.of("index", i)
            );
            testReactiveSuccess(hmsService.tokenizeAsset(request));
        }
        
        // List assets again
        List<RealWorldAsset> assets = testReactiveSuccess(hmsService.listAssets());
        
        assertThat(assets)
            .as("Assets list should contain created assets")
            .hasSize(initialCount + assetsToCreate);
    }
    
    @Test
    @DisplayName("Should transfer asset ownership successfully")
    void testAssetTransfer() {
        // Create and tokenize an asset
        TokenizationRequest request = createSampleTokenizationRequest();
        TokenizationResponse response = testReactiveSuccess(hmsService.tokenizeAsset(request));
        
        // Transfer to new owner
        String newOwner = "new-owner-123";
        Boolean transferResult = testReactiveSuccess(
            hmsService.transferAsset(response.assetId, newOwner));
        
        assertThat(transferResult)
            .as("Transfer should succeed")
            .isTrue();
        
        // Verify ownership change
        RealWorldAsset updatedAsset = testReactiveSuccess(hmsService.getAsset(response.assetId));
        assertThat(updatedAsset.owner)
            .as("Owner should be updated")
            .isEqualTo(newOwner);
    }
    
    @Test
    @DisplayName("Should handle transfer of non-existent asset")
    void testTransferNonExistentAsset() {
        String nonExistentAssetId = "HMS-nonexistent";
        String newOwner = "new-owner";
        
        Boolean transferResult = testReactiveSuccess(
            hmsService.transferAsset(nonExistentAssetId, newOwner));
        
        assertThat(transferResult)
            .as("Transfer of non-existent asset should fail")
            .isFalse();
    }
    
    @Test
    @DisplayName("Should validate assets correctly")
    void testAssetValidation() {
        // Create valid asset
        TokenizationRequest request = createSampleTokenizationRequest();
        TokenizationResponse response = testReactiveSuccess(hmsService.tokenizeAsset(request));
        
        // Validate the asset
        Boolean validationResult = testReactiveSuccess(hmsService.validateAsset(response.assetId));
        
        assertThat(validationResult)
            .as("Valid asset should pass validation")
            .isTrue();
    }
    
    @Test
    @DisplayName("Should handle validation of non-existent asset")
    void testValidateNonExistentAsset() {
        String nonExistentAssetId = "HMS-nonexistent";
        
        Boolean validationResult = testReactiveSuccess(hmsService.validateAsset(nonExistentAssetId));
        
        assertThat(validationResult)
            .as("Non-existent asset should fail validation")
            .isFalse();
    }
    
    @Test
    @DisplayName("Should provide accurate statistics")
    void testStatistics() {
        // Get initial stats
        HMSStats initialStats = testReactiveSuccess(hmsService.getStats());
        
        // Create some assets
        int assetsToCreate = 5;
        BigDecimal totalValue = BigDecimal.ZERO;
        
        for (int i = 0; i < assetsToCreate; i++) {
            BigDecimal assetValue = BigDecimal.valueOf(50000 + i * 10000);
            totalValue = totalValue.add(assetValue);
            
            TokenizationRequest request = new TokenizationRequest(
                "asset-" + i,
                "owner-" + i,
                assetValue,
                Map.of("index", i)
            );
            testReactiveSuccess(hmsService.tokenizeAsset(request));
        }
        
        // Get updated stats
        HMSStats updatedStats = testReactiveSuccess(hmsService.getStats());
        
        assertThat(updatedStats.totalAssets)
            .as("Total assets should reflect created assets")
            .isEqualTo(initialStats.totalAssets + assetsToCreate);
            
        assertThat(updatedStats.totalTransactions)
            .as("Total transactions should reflect tokenization operations")
            .isEqualTo(initialStats.totalTransactions + assetsToCreate);
            
        assertThat(updatedStats.successfulTransactions)
            .as("All transactions should be successful")
            .isEqualTo(initialStats.successfulTransactions + assetsToCreate);
            
        assertThat(updatedStats.failedTransactions)
            .as("No transactions should fail")
            .isEqualTo(initialStats.failedTransactions);
            
        assertThat(updatedStats.averageLatency)
            .as("Average latency should be recorded")
            .isGreaterThanOrEqualTo(0L);
            
        // Verify total value calculation
        BigDecimal expectedTotalValue = initialStats.totalValue.add(totalValue);
        assertThat(updatedStats.totalValue)
            .as("Total value should match expected")
            .isEqualTo(expectedTotalValue);
    }
    
    @ParameterizedTest
    @ValueSource(ints = {10, 50, 100})
    @DisplayName("Should handle multiple tokenizations efficiently")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testMultipleTokenizations(int tokenizationCount) {
        long startTime = System.currentTimeMillis();
        int successfulTokenizations = 0;
        
        for (int i = 0; i < tokenizationCount; i++) {
            try {
                TokenizationRequest request = new TokenizationRequest(
                    "batch-asset-" + i,
                    "batch-owner-" + i,
                    BigDecimal.valueOf(10000 + i),
                    Map.of("batchIndex", i)
                );
                
                TokenizationResponse response = hmsService.tokenizeAsset(request)
                    .await().atMost(java.time.Duration.ofSeconds(5));
                    
                if ("SUCCESS".equals(response.status)) {
                    successfulTokenizations++;
                }
            } catch (Exception e) {
                logger.debug("Tokenization {} failed: {}", i, e.getMessage());
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        double successRate = (double) successfulTokenizations / tokenizationCount * 100;
        double tps = calculateTPS(successfulTokenizations, duration);
        
        logger.info("Multiple tokenizations test - Success: {}/{} ({}%), TPS: {}", 
                   successfulTokenizations, tokenizationCount, 
                   String.format("%.2f", successRate), String.format("%.2f", tps));
        
        assertThat(successRate)
            .as("Should have high success rate for tokenizations")
            .isGreaterThanOrEqualTo(95.0); // 95% minimum success rate
            
        assertThat(tps)
            .as("Should achieve reasonable throughput")
            .isGreaterThan(100.0); // Minimum 100 TPS for HMS operations
    }
    
    @Test
    @DisplayName("Should maintain performance under concurrent operations")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentOperations() {
        // Test concurrent tokenizations
        testConcurrentExecution(() -> 
            hmsService.tokenizeAsset(createSampleTokenizationRequest()), 25);
        
        // Test concurrent stat requests
        testConcurrentExecution(() -> hmsService.getStats(), 50);
        
        // Test concurrent asset listings
        testConcurrentExecution(() -> hmsService.listAssets(), 25);
    }
    
    @Test
    @DisplayName("Should handle edge cases gracefully")
    void testEdgeCases() {
        // Test with null metadata
        TokenizationRequest requestWithNullMetadata = new TokenizationRequest(
            "test-asset",
            "test-owner",
            BigDecimal.valueOf(100000),
            null
        );
        
        assertThatCode(() -> {
            testReactiveSuccess(hmsService.tokenizeAsset(requestWithNullMetadata));
        }).as("Should handle null metadata gracefully")
          .doesNotThrowAnyException();
        
        // Test with zero value
        TokenizationRequest requestWithZeroValue = new TokenizationRequest(
            "zero-asset",
            "zero-owner",
            BigDecimal.ZERO,
            Map.of("type", "test")
        );
        
        assertThatCode(() -> {
            testReactiveSuccess(hmsService.tokenizeAsset(requestWithZeroValue));
        }).as("Should handle zero value gracefully")
          .doesNotThrowAnyException();
    }
    
    @Test
    @DisplayName("Should handle service lifecycle correctly")
    void testServiceLifecycle() {
        // Test initial state
        testServiceInitialization();
        
        // Test operations
        testReactiveSuccess(hmsService.getStats());
        testReactiveSuccess(hmsService.listAssets());
        
        // Test cleanup (if applicable)
        testServiceCleanup();
    }
    
    @Override
    protected void validateServiceStatistics(Object stats) {
        assertThat(stats)
            .as("Statistics should be HMSStats instance")
            .isInstanceOf(HMSStats.class);
            
        HMSStats hmsStats = (HMSStats) stats;
        
        assertThat(hmsStats.totalAssets)
            .as("Total assets should be non-negative")
            .isNotNegative();
            
        assertThat(hmsStats.totalTransactions)
            .as("Total transactions should be non-negative")
            .isNotNegative();
            
        assertThat(hmsStats.successfulTransactions)
            .as("Successful transactions should be non-negative")
            .isNotNegative();
            
        assertThat(hmsStats.failedTransactions)
            .as("Failed transactions should be non-negative")
            .isNotNegative();
            
        assertThat(hmsStats.averageLatency)
            .as("Average latency should be non-negative")
            .isNotNegative();
            
        assertThat(hmsStats.totalValue)
            .as("Total value should not be null")
            .isNotNull()
            .as("Total value should be non-negative")
            .isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }
    
    /**
     * Helper method to create a sample tokenization request
     */
    private TokenizationRequest createSampleTokenizationRequest() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "real-estate");
        metadata.put("location", "Test Location");
        metadata.put("description", "Sample asset for testing");
        
        return new TokenizationRequest(
            "sample-asset",
            "sample-owner",
            BigDecimal.valueOf(250000),
            metadata
        );
    }
}