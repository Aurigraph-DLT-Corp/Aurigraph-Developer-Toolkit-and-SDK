package io.aurigraph.v11.contracts.rwa;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.util.*;
import java.time.Duration;
import java.util.concurrent.*;

/**
 * Integration tests for RWA Tokenization system
 * Tests end-to-end tokenization workflows for different asset types
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RWATokenizerIntegrationTest {

    @Inject
    RWATokenizer rwaTokenizer;
    
    @Inject
    AssetValuationService valuationService;
    
    @Inject
    DigitalTwinService digitalTwinService;
    
    @Inject
    OracleService oracleService;

    private static final Map<String, String> createdTokens = new ConcurrentHashMap<>();
    private static final Map<String, String> createdTwins = new ConcurrentHashMap<>();

    @Test
    @Order(1)
    @DisplayName("Integration: Complete Carbon Credit Tokenization Workflow")
    void testCarbonCreditWorkflow() {
        // Phase 1: Create tokenization request
        RWATokenizationRequest request = new RWATokenizationRequest();
        request.setAssetId("CARBON_VERRA_VCS1001");
        request.setAssetType("CARBON_CREDIT");
        request.setOwnerAddress("0x742d35Cc6638C0532925a3b8BC9c08031e0cC1Bf");
        request.setFractionSize(new BigDecimal("100")); // $100 per fraction
        request.setMetadata(Map.of(
            "tons", "10000",
            "vintage", "2024",
            "quality", "PREMIUM",
            "region", "US",
            "projectId", "VERRA-VCS-1001",
            "methodology", "VM0011",
            "projectType", "Improved Forest Management",
            "location", "California, USA",
            "developer", "Green Carbon Solutions",
            "verifier", "SCS Global Services"
        ));
        request.setCertifications(Arrays.asList(
            "VERRA_VCS",
            "CCB_STANDARD",
            "CAR_PROTOCOL"
        ));
        request.setOracleSource("CHAINLINK");

        // Phase 2: Execute tokenization
        RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(15));

        // Verify tokenization success
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertTrue(result.getProcessingTime() > 0);
        
        RWAToken token = result.getToken();
        AssetDigitalTwin digitalTwin = result.getDigitalTwin();
        
        // Verify token properties
        assertNotNull(token.getTokenId());
        assertEquals("CARBON_VERRA_VCS1001", token.getAssetId());
        assertEquals("CARBON_CREDIT", token.getAssetType());
        assertEquals("0x742d35Cc6638C0532925a3b8BC9c08031e0cC1Bf", token.getOwnerAddress());
        assertTrue(token.getAssetValue().compareTo(new BigDecimal("100000")) > 0); // > $100k for 10k tons
        assertEquals(TokenStatus.ACTIVE, token.getStatus());
        assertTrue(token.isQuantumSafe());
        
        // Verify digital twin creation
        assertNotNull(digitalTwin);
        assertEquals("CARBON_VERRA_VCS1001", digitalTwin.getAssetId());
        assertEquals("CARBON_CREDIT", digitalTwin.getAssetType());
        assertEquals(DigitalTwinStatus.ACTIVE, digitalTwin.getStatus());
        
        // Store for later tests
        createdTokens.put("CARBON_CREDIT", token.getTokenId());
        createdTwins.put("CARBON_CREDIT", digitalTwin.getTwinId());
        
        System.out.printf("✓ Carbon Credit tokenized: %s (Value: $%s)%n", 
            token.getTokenId(), token.getAssetValue());
    }

    @Test
    @Order(2)
    @DisplayName("Integration: Complete Real Estate Tokenization Workflow")
    void testRealEstateWorkflow() {
        // Phase 1: Create real estate tokenization request
        RWATokenizationRequest request = new RWATokenizationRequest();
        request.setAssetId("NYC_COMMERCIAL_001");
        request.setAssetType("REAL_ESTATE");
        request.setOwnerAddress("0x8ba1f109551bD432803012645Hac136c21ce473");
        request.setFractionSize(new BigDecimal("250000")); // $250k per fraction
        request.setMetadata(Map.of(
            "pricePerUnit", "2500",
            "size", "5000",
            "location", "PRIME_URBAN",
            "propertyType", "COMMERCIAL",
            "address", "450 Park Avenue, New York, NY 10022",
            "buildingType", "Office Tower",
            "yearBuilt", "2015",
            "floors", "25",
            "tenant", "Fortune 500 Company",
            "leaseExpiry", "2034-12-31",
            "annualRent", "2500000"
        ));
        request.setCertifications(Arrays.asList(
            "LEED_PLATINUM",
            "ENERGY_STAR",
            "NYC_DOB_CERT"
        ));

        // Phase 2: Execute tokenization
        RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(15));

        // Verify tokenization
        assertTrue(result.isSuccess());
        RWAToken token = result.getToken();
        
        assertEquals("REAL_ESTATE", token.getAssetType());
        assertTrue(token.getAssetValue().compareTo(new BigDecimal("10000000")) > 0); // > $10M
        
        createdTokens.put("REAL_ESTATE", token.getTokenId());
        createdTwins.put("REAL_ESTATE", result.getDigitalTwin().getTwinId());
        
        System.out.printf("✓ Real Estate tokenized: %s (Value: $%s)%n", 
            token.getTokenId(), token.getAssetValue());
    }

    @Test
    @Order(3)
    @DisplayName("Integration: Complete Financial Asset Tokenization Workflow")
    void testFinancialAssetWorkflow() {
        // Phase 1: Create financial asset request
        RWATokenizationRequest request = new RWATokenizationRequest();
        request.setAssetId("BOND_TREASURY_001");
        request.setAssetType("FINANCIAL_ASSET");
        request.setOwnerAddress("0x3f87Ff1De58128eF8fcb4c807eCCd48CC6f96Db4");
        request.setFractionSize(new BigDecimal("10000")); // $10k per fraction
        request.setMetadata(Map.of(
            "instrumentType", "BOND",
            "faceValue", "1000000",
            "couponRate", "0.045",
            "yearsToMaturity", "10",
            "marketRate", "0.04",
            "rating", "AAA",
            "issuer", "US Treasury",
            "cusip", "912828XG5",
            "maturityDate", "2034-01-15"
        ));
        request.setCertifications(Arrays.asList(
            "MOODY_AAA",
            "SP_AAA",
            "FITCH_AAA"
        ));

        // Phase 2: Execute tokenization
        RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(15));

        // Verify tokenization
        assertTrue(result.isSuccess());
        RWAToken token = result.getToken();
        
        assertEquals("FINANCIAL_ASSET", token.getAssetType());
        assertTrue(token.getAssetValue().compareTo(new BigDecimal("900000")) > 0); // Bond value
        
        createdTokens.put("FINANCIAL_ASSET", token.getTokenId());
        createdTwins.put("FINANCIAL_ASSET", result.getDigitalTwin().getTwinId());
        
        System.out.printf("✓ Financial Asset tokenized: %s (Value: $%s)%n", 
            token.getTokenId(), token.getAssetValue());
    }

    @Test
    @Order(4)
    @DisplayName("Integration: Cross-Asset Portfolio Management")
    void testCrossAssetPortfolio() {
        // Create portfolio owner
        String portfolioOwner = "0x9f2065a37fcE48C76E9AEA02b6b6D50e2D7e1234";
        
        // Transfer all tokens to portfolio owner
        for (String tokenId : createdTokens.values()) {
            RWAToken token = rwaTokenizer.getToken(tokenId)
                .await().atMost(Duration.ofSeconds(5));
            
            Boolean transferResult = rwaTokenizer.transferToken(
                tokenId, token.getOwnerAddress(), portfolioOwner, token.getTokenSupply()
            ).await().atMost(Duration.ofSeconds(5));
            
            assertTrue(transferResult);
        }
        
        // Verify portfolio composition
        List<RWAToken> portfolioTokens = rwaTokenizer.getTokensByOwner(portfolioOwner)
            .await().atMost(Duration.ofSeconds(5));
        
        assertEquals(3, portfolioTokens.size());
        
        // Calculate total portfolio value
        BigDecimal totalValue = portfolioTokens.stream()
            .map(RWAToken::getAssetValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        assertTrue(totalValue.compareTo(new BigDecimal("10000000")) > 0); // > $10M portfolio
        
        System.out.printf("✓ Portfolio assembled: 3 assets worth $%s%n", totalValue);
    }

    @Test
    @Order(5)
    @DisplayName("Integration: Real-time Valuation Updates")
    void testRealTimeValuationUpdates() {
        String carbonTokenId = createdTokens.get("CARBON_CREDIT");
        assertNotNull(carbonTokenId);
        
        // Get initial valuation
        RWAToken token = rwaTokenizer.getToken(carbonTokenId)
            .await().atMost(Duration.ofSeconds(5));
        BigDecimal initialValue = token.getAssetValue();
        
        // Simulate market price change
        BigDecimal newValue = initialValue.multiply(new BigDecimal("1.15")); // 15% increase
        
        // Update valuation via oracle
        Boolean updateResult = rwaTokenizer.updateValuation(
            carbonTokenId, newValue, "CHAINLINK"
        ).await().atMost(Duration.ofSeconds(5));
        
        assertTrue(updateResult);
        
        // Verify valuation updated
        RWAToken updatedToken = rwaTokenizer.getToken(carbonTokenId)
            .await().atMost(Duration.ofSeconds(5));
        
        assertEquals(newValue.setScale(2, BigDecimal.ROUND_HALF_UP), 
                    updatedToken.getAssetValue().setScale(2, BigDecimal.ROUND_HALF_UP));
        assertNotNull(updatedToken.getLastValuationUpdate());
        
        System.out.printf("✓ Valuation updated: $%s → $%s%n", initialValue, newValue);
    }

    @Test
    @Order(6)
    @DisplayName("Integration: Digital Twin IoT Data Flow")
    void testDigitalTwinIoTDataFlow() {
        String realEstateTwinId = createdTwins.get("REAL_ESTATE");
        assertNotNull(realEstateTwinId);
        
        // Simulate IoT sensor data
        Map<String, Map<String, Object>> sensorData = Map.of(
            "TEMPERATURE", Map.of(
                "value", "22.5",
                "unit", "celsius",
                "location", "Floor 15 - Office Space"
            ),
            "HUMIDITY", Map.of(
                "value", "45",
                "unit", "percent",
                "location", "Floor 15 - Office Space"
            ),
            "ENERGY_CONSUMPTION", Map.of(
                "value", "1250",
                "unit", "kwh",
                "period", "daily"
            ),
            "OCCUPANCY", Map.of(
                "value", "85",
                "unit", "percent",
                "floor", "15"
            )
        );
        
        // Record all sensor readings
        for (Map.Entry<String, Map<String, Object>> entry : sensorData.entrySet()) {
            Boolean recordResult = digitalTwinService.recordSensorData(
                realEstateTwinId, entry.getKey(), entry.getValue()
            ).await().atMost(Duration.ofSeconds(5));
            
            assertTrue(recordResult);
        }
        
        // Verify all data recorded
        AssetDigitalTwin twin = digitalTwinService.getDigitalTwin(realEstateTwinId)
            .await().atMost(Duration.ofSeconds(5));
        
        assertEquals(4, twin.getSensorReadings().size());
        
        System.out.println("✓ IoT data flow complete: 4 sensor types recorded");
    }

    @Test
    @Order(7)
    @DisplayName("Integration: Multi-Asset Performance Benchmarking")
    void testMultiAssetPerformanceBenchmarking() {
        int iterations = 50;
        long startTime = System.nanoTime();
        
        // Create multiple assets concurrently
        List<CompletableFuture<RWATokenizationResult>> futures = new ArrayList<>();
        
        for (int i = 0; i < iterations; i++) {
            String assetType = i % 3 == 0 ? "CARBON_CREDIT" : 
                             i % 3 == 1 ? "REAL_ESTATE" : "FINANCIAL_ASSET";
            
            RWATokenizationRequest request = createBenchmarkRequest("BENCH_" + i, assetType);
            
            CompletableFuture<RWATokenizationResult> future = rwaTokenizer.tokenizeAsset(request)
                .subscribeAsCompletionStage();
            futures.add(future);
        }
        
        // Wait for all to complete
        CompletableFuture<Void> allOf = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0])
        );
        
        try {
            allOf.get(30, TimeUnit.SECONDS); // 30 second timeout
        } catch (Exception e) {
            fail("Benchmark test timed out or failed: " + e.getMessage());
        }
        
        long endTime = System.nanoTime();
        long totalTime = endTime - startTime;
        
        // Verify all succeeded
        List<RWATokenizationResult> results = futures.stream()
            .map(future -> {
                try {
                    return future.get();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            })
            .toList();
        
        assertEquals(iterations, results.size());
        assertTrue(results.stream().allMatch(RWATokenizationResult::isSuccess));
        
        // Performance metrics
        double tokensPerSecond = (double) iterations / (totalTime / 1_000_000_000.0);
        double avgProcessingTime = results.stream()
            .mapToLong(RWATokenizationResult::getProcessingTime)
            .average()
            .orElse(0) / 1_000_000.0; // Convert to milliseconds
        
        System.out.printf("✓ Performance benchmark complete:%n");
        System.out.printf("  - Tokens created: %d%n", iterations);
        System.out.printf("  - Total time: %.2f seconds%n", totalTime / 1_000_000_000.0);
        System.out.printf("  - Throughput: %.2f tokens/second%n", tokensPerSecond);
        System.out.printf("  - Avg processing time: %.2f ms%n", avgProcessingTime);
        
        // Performance assertions
        assertTrue(tokensPerSecond > 10, "Expected > 10 tokens/second, got: " + tokensPerSecond);
        assertTrue(avgProcessingTime < 1000, "Expected < 1s avg processing, got: " + avgProcessingTime + "ms");
    }

    @Test
    @Order(8)
    @DisplayName("Integration: System Statistics and Health Check")
    void testSystemStatisticsAndHealth() {
        // Get tokenizer statistics
        TokenizerStats tokenizerStats = rwaTokenizer.getStats()
            .await().atMost(Duration.ofSeconds(5));
        
        assertNotNull(tokenizerStats);
        assertTrue(tokenizerStats.getTotalTokens() > 50); // From benchmark test
        assertTrue(tokenizerStats.getTotalValue().compareTo(BigDecimal.ZERO) > 0);
        assertFalse(tokenizerStats.getTypeDistribution().isEmpty());
        
        // Get digital twin statistics
        DigitalTwinStats twinStats = digitalTwinService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        
        assertNotNull(twinStats);
        assertTrue(twinStats.getTotalTwins() > 50);
        assertTrue(twinStats.getActiveTwins() > 50);
        
        // Get oracle provider statistics
        Map<String, OracleMetrics> oracleStats = oracleService.getProviderStats()
            .await().atMost(Duration.ofSeconds(5));
        
        assertNotNull(oracleStats);
        assertFalse(oracleStats.isEmpty());
        
        // Verify all oracle providers are responsive
        for (OracleMetrics metrics : oracleStats.values()) {
            assertTrue(metrics.getSuccessRate() > 0.8); // > 80% success rate
            assertTrue(metrics.getAverageLatency() < 1000); // < 1s latency
        }
        
        System.out.printf("✓ System health check passed:%n");
        System.out.printf("  - Total tokens: %d%n", tokenizerStats.getTotalTokens());
        System.out.printf("  - Total value: $%s%n", tokenizerStats.getTotalValue());
        System.out.printf("  - Digital twins: %d%n", twinStats.getTotalTwins());
        System.out.printf("  - Oracle providers: %d%n", oracleStats.size());
    }

    @Test
    @Order(9)
    @DisplayName("Integration: Asset Lifecycle Cleanup")
    void testAssetLifecycleCleanup() {
        // Archive digital twins
        for (String twinId : createdTwins.values()) {
            Boolean archiveResult = digitalTwinService.archiveTwin(twinId)
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(archiveResult);
        }
        
        // Burn remaining tokens (from original 3 assets)
        List<String> originalTokens = Arrays.asList(
            createdTokens.get("CARBON_CREDIT"),
            createdTokens.get("REAL_ESTATE"),
            createdTokens.get("FINANCIAL_ASSET")
        );
        
        String portfolioOwner = "0x9f2065a37fcE48C76E9AEA02b6b6D50e2D7e1234";
        
        for (String tokenId : originalTokens) {
            if (tokenId != null) {
                Boolean burnResult = rwaTokenizer.burnToken(tokenId, portfolioOwner)
                    .await().atMost(Duration.ofSeconds(5));
                assertTrue(burnResult);
                
                // Verify token is burned
                RWAToken burnedToken = rwaTokenizer.getToken(tokenId)
                    .await().atMost(Duration.ofSeconds(5));
                assertEquals(TokenStatus.BURNED, burnedToken.getStatus());
                assertNotNull(burnedToken.getBurnedAt());
            }
        }
        
        System.out.println("✓ Asset lifecycle cleanup complete");
    }

    // Helper methods

    private RWATokenizationRequest createBenchmarkRequest(String assetId, String assetType) {
        RWATokenizationRequest request = new RWATokenizationRequest();
        request.setAssetId(assetId);
        request.setAssetType(assetType);
        request.setOwnerAddress("0x" + Integer.toHexString(assetId.hashCode()));
        request.setFractionSize(new BigDecimal("1000"));
        
        Map<String, Object> metadata = switch (assetType) {
            case "CARBON_CREDIT" -> Map.of(
                "tons", "100",
                "vintage", "2024",
                "quality", "STANDARD"
            );
            case "REAL_ESTATE" -> Map.of(
                "pricePerUnit", "500",
                "size", "1000",
                "location", "URBAN"
            );
            case "FINANCIAL_ASSET" -> Map.of(
                "instrumentType", "EQUITY",
                "shares", "100",
                "pricePerShare", "50"
            );
            default -> Map.of("declaredValue", "50000");
        };
        
        request.setMetadata(metadata);
        return request;
    }
}