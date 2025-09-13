package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.rwa.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.util.*;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive test suite for Smart Contract Service
 * Tests Ricardian contracts, RWA tokenization, and digital twins
 */
@QuarkusTest
class SmartContractServiceTest {

    @Inject
    SmartContractService smartContractService;
    
    @Inject
    RWATokenizer rwaTokenizer;
    
    @Inject
    AssetValuationService valuationService;
    
    @Inject
    DigitalTwinService digitalTwinService;
    
    @Inject
    OracleService oracleService;

    private String testContractId;
    private String testTokenId;
    private String testTwinId;

    @BeforeEach
    void setUp() {
        // Create test data for each test
        testContractId = null;
        testTokenId = null;
        testTwinId = null;
    }

    @Nested
    @DisplayName("Ricardian Contract Tests")
    class RicardianContractTests {

        @Test
        @DisplayName("Should create Ricardian contract successfully")
        void testCreateRicardianContract() {
            // Given
            String templateId = "CARBON_CREDIT_TEMPLATE";
            String legalText = "This contract represents the transfer of carbon credits...";
            String executableCode = "function transfer(from, to, amount) { return validateTransfer(from, to, amount); }";
            Map<String, String> parameters = Map.of(
                "creditType", "VCS",
                "vintage", "2024",
                "quantity", "100"
            );
            String creatorAddress = "0x1234567890abcdef";
            String assetType = "CARBON_CREDIT";

            // When
            RicardianContract contract = smartContractService.createRicardianContract(
                templateId, legalText, executableCode, parameters, creatorAddress, assetType
            );

            // Then
            assertNotNull(contract);
            assertNotNull(contract.getContractId());
            assertEquals(templateId, contract.getTemplateId());
            assertEquals(legalText, contract.getLegalText());
            assertEquals(executableCode, contract.getExecutableCode());
            assertEquals(creatorAddress, contract.getCreatorAddress());
            assertEquals(assetType, contract.getAssetType());
            assertTrue(contract.isQuantumSafe());
            assertNotNull(contract.getCreatedAt());
            
            testContractId = contract.getContractId();
        }

        @Test
        @DisplayName("Should validate contract parameters")
        void testValidateContract() {
            // Given - create a contract first
            RicardianContract contract = createTestContract();
            
            // When
            boolean isValid = smartContractService.validateContract(
                contract.getContractId(), true, true, false
            );
            
            // Then
            assertTrue(isValid);
        }

        @Test
        @DisplayName("Should execute contract with different triggers")
        void testExecuteContract() {
            // Given
            RicardianContract contract = createTestContract();
            
            // Test manual trigger
            ContractTrigger manualTrigger = ContractTrigger.builder()
                .type(TriggerType.MANUAL)
                .triggeredBy("test-user")
                .build();
            
            ExecutionContext context = ExecutionContext.builder()
                .contractId(contract.getContractId())
                .executorAddress("0x1234")
                .build();
            
            // When
            ExecutionResult result = smartContractService.executeContract(
                contract.getContractId(), manualTrigger, context
            );
            
            // Then
            assertNotNull(result);
            assertTrue(result.isSuccess());
            assertNotNull(result.getCompletedAt());
            assertTrue(result.getGasUsed() > 0);
        }

        @Test
        @DisplayName("Should get contract statistics")
        void testGetContractStats() {
            // Given - create some test contracts
            createTestContract();
            createTestContract();
            
            // When
            var stats = smartContractService.getStats()
                .await().atMost(Duration.ofSeconds(5));
            
            // Then
            assertNotNull(stats);
            assertTrue(stats.getTotalContracts() >= 2);
        }
    }

    @Nested
    @DisplayName("RWA Tokenization Tests")
    class RWATokenizationTests {

        @Test
        @DisplayName("Should tokenize carbon credit asset successfully")
        void testTokenizeCarbonCredit() {
            // Given
            RWATokenizationRequest request = new RWATokenizationRequest();
            request.setAssetId("CARBON_CREDIT_VCS_001");
            request.setAssetType("CARBON_CREDIT");
            request.setOwnerAddress("0x1234567890abcdef");
            request.setFractionSize(new BigDecimal("1000"));
            request.setMetadata(Map.of(
                "tons", "500",
                "vintage", "2024",
                "quality", "PREMIUM",
                "region", "US",
                "projectId", "VCS001"
            ));

            // When
            RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
                .await().atMost(Duration.ofSeconds(10));

            // Then
            assertNotNull(result);
            assertTrue(result.isSuccess());
            assertNotNull(result.getToken());
            assertNotNull(result.getDigitalTwin());
            assertTrue(result.getProcessingTime() > 0);
            
            RWAToken token = result.getToken();
            assertEquals("CARBON_CREDIT", token.getAssetType());
            assertEquals("0x1234567890abcdef", token.getOwnerAddress());
            assertTrue(token.getAssetValue().compareTo(BigDecimal.ZERO) > 0);
            assertTrue(token.isQuantumSafe());
            
            testTokenId = token.getTokenId();
        }

        @Test
        @DisplayName("Should tokenize real estate asset successfully")
        void testTokenizeRealEstate() {
            // Given
            RWATokenizationRequest request = new RWATokenizationRequest();
            request.setAssetId("REAL_ESTATE_NYC_001");
            request.setAssetType("REAL_ESTATE");
            request.setOwnerAddress("0xabcdef1234567890");
            request.setFractionSize(new BigDecimal("100000")); // $100k per fraction
            request.setMetadata(Map.of(
                "pricePerUnit", "1200",
                "size", "2500",
                "location", "PRIME_URBAN",
                "propertyType", "COMMERCIAL",
                "address", "123 Manhattan Ave, NYC"
            ));

            // When
            RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
                .await().atMost(Duration.ofSeconds(10));

            // Then
            assertNotNull(result);
            assertTrue(result.isSuccess());
            
            RWAToken token = result.getToken();
            assertEquals("REAL_ESTATE", token.getAssetType());
            assertTrue(token.getAssetValue().compareTo(new BigDecimal("1000000")) > 0); // > $1M
        }

        @Test
        @DisplayName("Should transfer token ownership")
        void testTransferToken() {
            // Given - create a token first
            RWAToken token = createTestToken();
            String fromAddress = token.getOwnerAddress();
            String toAddress = "0x9876543210fedcba";
            BigDecimal amount = token.getTokenSupply();

            // When
            Boolean transferResult = rwaTokenizer.transferToken(
                token.getTokenId(), fromAddress, toAddress, amount
            ).await().atMost(Duration.ofSeconds(5));

            // Then
            assertTrue(transferResult);
            
            // Verify ownership changed
            RWAToken updatedToken = rwaTokenizer.getToken(token.getTokenId())
                .await().atMost(Duration.ofSeconds(5));
            assertEquals(toAddress, updatedToken.getOwnerAddress());
            assertNotNull(updatedToken.getLastTransferAt());
        }

        @Test
        @DisplayName("Should burn token successfully")
        void testBurnToken() {
            // Given
            RWAToken token = createTestToken();
            String ownerAddress = token.getOwnerAddress();

            // When
            Boolean burnResult = rwaTokenizer.burnToken(token.getTokenId(), ownerAddress)
                .await().atMost(Duration.ofSeconds(5));

            // Then
            assertTrue(burnResult);
            
            // Verify token is burned
            RWAToken burnedToken = rwaTokenizer.getToken(token.getTokenId())
                .await().atMost(Duration.ofSeconds(5));
            assertEquals(TokenStatus.BURNED, burnedToken.getStatus());
            assertNotNull(burnedToken.getBurnedAt());
        }

        @Test
        @DisplayName("Should get tokenizer statistics")
        void testGetTokenizerStats() {
            // Given - create some tokens
            createTestToken();
            createTestToken();
            
            // When
            TokenizerStats stats = rwaTokenizer.getStats()
                .await().atMost(Duration.ofSeconds(5));
            
            // Then
            assertNotNull(stats);
            assertTrue(stats.getTotalTokens() >= 2);
            assertTrue(stats.getTotalValue().compareTo(BigDecimal.ZERO) > 0);
            assertFalse(stats.getTypeDistribution().isEmpty());
        }
    }

    @Nested
    @DisplayName("Digital Twin Tests")
    class DigitalTwinTests {

        @Test
        @DisplayName("Should create digital twin successfully")
        void testCreateDigitalTwin() {
            // Given
            String assetId = "ASSET_001";
            String assetType = "CARBON_CREDIT";
            Map<String, Object> metadata = Map.of(
                "location", "California, USA",
                "projectType", "Reforestation",
                "certifier", "Verra"
            );

            // When
            AssetDigitalTwin twin = digitalTwinService.createDigitalTwin(assetId, assetType, metadata);

            // Then
            assertNotNull(twin);
            assertNotNull(twin.getTwinId());
            assertEquals(assetId, twin.getAssetId());
            assertEquals(assetType, twin.getAssetType());
            assertEquals(DigitalTwinStatus.ACTIVE, twin.getStatus());
            assertNotNull(twin.getCreatedAt());
            
            testTwinId = twin.getTwinId();
        }

        @Test
        @DisplayName("Should update digital twin metadata")
        void testUpdateDigitalTwin() {
            // Given
            AssetDigitalTwin twin = createTestDigitalTwin();
            Map<String, Object> updates = Map.of(
                "temperature", "25.5",
                "humidity", "60",
                "lastInspection", "2024-01-15"
            );

            // When
            Boolean updateResult = digitalTwinService.updateTwin(twin.getTwinId(), updates)
                .await().atMost(Duration.ofSeconds(5));

            // Then
            assertTrue(updateResult);
            
            // Verify updates
            AssetDigitalTwin updatedTwin = digitalTwinService.getDigitalTwin(twin.getTwinId())
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(updatedTwin.getMetadata().containsKey("temperature"));
            assertNotNull(updatedTwin.getLastUpdated());
        }

        @Test
        @DisplayName("Should record sensor data")
        void testRecordSensorData() {
            // Given
            AssetDigitalTwin twin = createTestDigitalTwin();
            String sensorType = "TEMPERATURE";
            Map<String, Object> sensorData = Map.of(
                "value", "23.5",
                "unit", "celsius",
                "accuracy", "0.1"
            );

            // When
            Boolean recordResult = digitalTwinService.recordSensorData(
                twin.getTwinId(), sensorType, sensorData
            ).await().atMost(Duration.ofSeconds(5));

            // Then
            assertTrue(recordResult);
            
            // Verify sensor data recorded
            AssetDigitalTwin updatedTwin = digitalTwinService.getDigitalTwin(twin.getTwinId())
                .await().atMost(Duration.ofSeconds(5));
            assertFalse(updatedTwin.getSensorReadings().isEmpty());
            
            SensorReading reading = updatedTwin.getSensorReadings().get(0);
            assertEquals(sensorType, reading.getSensorType());
        }

        @Test
        @DisplayName("Should add verification to digital twin")
        void testAddVerification() {
            // Given
            AssetDigitalTwin twin = createTestDigitalTwin();
            String verificationType = "THIRD_PARTY_AUDIT";
            String verifier = "Green Cert Authority";
            Map<String, Object> evidence = Map.of(
                "auditReport", "report-123.pdf",
                "auditDate", "2024-01-10",
                "rating", "AA+"
            );

            // When
            Boolean verificationResult = digitalTwinService.addVerification(
                twin.getTwinId(), verificationType, verifier, evidence
            ).await().atMost(Duration.ofSeconds(5));

            // Then
            assertTrue(verificationResult);
            
            // Verify verification added
            AssetVerification verification = digitalTwinService.getVerificationStatus(twin.getTwinId())
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(verification.isVerified());
            assertFalse(verification.getVerifications().isEmpty());
        }

        @Test
        @DisplayName("Should get digital twin statistics")
        void testGetDigitalTwinStats() {
            // Given - create some twins
            createTestDigitalTwin();
            createTestDigitalTwin();
            
            // When
            DigitalTwinStats stats = digitalTwinService.getStats()
                .await().atMost(Duration.ofSeconds(5));
            
            // Then
            assertNotNull(stats);
            assertTrue(stats.getTotalTwins() >= 2);
            assertTrue(stats.getActiveTwins() >= 2);
        }
    }

    @Nested
    @DisplayName("Asset Valuation Tests")
    class AssetValuationTests {

        @Test
        @DisplayName("Should value carbon credits correctly")
        void testValueCarbonCredits() {
            // Given
            String assetType = "CARBON_CREDIT";
            String assetId = "VCS_CARBON_001";
            Map<String, Object> metadata = Map.of(
                "tons", "1000",
                "vintage", "2024",
                "quality", "PREMIUM",
                "region", "US"
            );

            // When
            BigDecimal valuation = valuationService.getAssetValuation(assetType, assetId, metadata);

            // Then
            assertNotNull(valuation);
            assertTrue(valuation.compareTo(BigDecimal.ZERO) > 0);
            // Premium US carbon credits should be > $40/ton
            assertTrue(valuation.compareTo(new BigDecimal("40000")) > 0);
        }

        @Test
        @DisplayName("Should value real estate correctly")
        void testValueRealEstate() {
            // Given
            String assetType = "REAL_ESTATE";
            String assetId = "NYC_PROPERTY_001";
            Map<String, Object> metadata = Map.of(
                "pricePerUnit", "1500",
                "size", "2000",
                "location", "PRIME_URBAN",
                "propertyType", "COMMERCIAL"
            );

            // When
            BigDecimal valuation = valuationService.getAssetValuation(assetType, assetId, metadata);

            // Then
            assertNotNull(valuation);
            assertTrue(valuation.compareTo(new BigDecimal("1000000")) > 0); // > $1M
        }

        @Test
        @DisplayName("Should handle unknown asset types")
        void testUnknownAssetType() {
            // Given
            String assetType = "UNKNOWN_TYPE";
            String assetId = "UNKNOWN_001";
            Map<String, Object> metadata = Map.of("declaredValue", "50000");

            // When
            BigDecimal valuation = valuationService.getAssetValuation(assetType, assetId, metadata);

            // Then
            assertNotNull(valuation);
            assertEquals(new BigDecimal("50000"), valuation);
        }
    }

    @Nested
    @DisplayName("Oracle Service Tests")
    class OracleServiceTests {

        @Test
        @DisplayName("Should get market data successfully")
        void testGetMarketData() {
            // Given
            String assetId = "BTC";
            String assetType = "CRYPTOCURRENCY";

            // When
            MarketData marketData = oracleService.getMarketData(assetId, assetType)
                .await().atMost(Duration.ofSeconds(10));

            // Then
            assertNotNull(marketData);
            assertEquals(assetId, marketData.getAssetId());
            assertTrue(marketData.getPrice().compareTo(BigDecimal.ZERO) > 0);
            assertTrue(marketData.getReliabilityScore() > 0);
        }

        @Test
        @DisplayName("Should validate oracle data")
        void testValidateOracleData() {
            // Given
            String assetId = "ETH";

            // When
            OracleValidation validation = oracleService.validateData(assetId)
                .await().atMost(Duration.ofSeconds(5));

            // Then
            assertNotNull(validation);
            // Should be valid for well-known assets
            assertTrue(validation.isValid());
            assertTrue(validation.getConsistencyScore() > 0.7);
        }

        @Test
        @DisplayName("Should get price history")
        void testGetPriceHistory() {
            // Given
            String assetId = "GOLD";
            int days = 30;

            // When
            List<PriceHistory> history = oracleService.getPriceHistory(assetId, days)
                .await().atMost(Duration.ofSeconds(5));

            // Then
            assertNotNull(history);
            assertFalse(history.isEmpty());
            assertEquals(days + 1, history.size()); // Including today
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should handle high-throughput tokenization")
        void testHighThroughputTokenization() {
            // Given
            int tokenCount = 100;
            long startTime = System.nanoTime();
            
            // When - create multiple tokens concurrently
            List<RWATokenizationResult> results = new ArrayList<>();
            for (int i = 0; i < tokenCount; i++) {
                RWATokenizationRequest request = createTokenizationRequest("ASSET_" + i);
                RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
                    .await().atMost(Duration.ofSeconds(30));
                results.add(result);
            }
            
            long endTime = System.nanoTime();
            long totalTime = endTime - startTime;
            
            // Then
            assertEquals(tokenCount, results.size());
            assertTrue(results.stream().allMatch(RWATokenizationResult::isSuccess));
            
            // Performance assertion - should handle > 10 tokens/second
            double tokensPerSecond = (double) tokenCount / (totalTime / 1_000_000_000.0);
            assertTrue(tokensPerSecond > 10, "Expected > 10 tokens/second, got: " + tokensPerSecond);
        }

        @Test
        @DisplayName("Should handle concurrent contract executions")
        void testConcurrentContractExecution() {
            // Given
            RicardianContract contract = createTestContract();
            int executionCount = 50;
            
            // When - execute contract multiple times concurrently
            List<ExecutionResult> results = new ArrayList<>();
            for (int i = 0; i < executionCount; i++) {
                ContractTrigger trigger = ContractTrigger.builder()
                    .type(TriggerType.MANUAL)
                    .triggeredBy("test-user-" + i)
                    .build();
                
                ExecutionContext context = ExecutionContext.builder()
                    .contractId(contract.getContractId())
                    .executorAddress("0x" + i)
                    .build();
                
                ExecutionResult result = smartContractService.executeContract(
                    contract.getContractId(), trigger, context
                );
                results.add(result);
            }
            
            // Then
            assertEquals(executionCount, results.size());
            assertTrue(results.stream().allMatch(ExecutionResult::isSuccess));
        }
    }

    // Helper methods

    private RicardianContract createTestContract() {
        return smartContractService.createRicardianContract(
            "TEST_TEMPLATE",
            "Test legal text for contract",
            "function test() { return true; }",
            Map.of("param1", "value1"),
            "0x1234567890abcdef",
            "CARBON_CREDIT"
        );
    }

    private RWAToken createTestToken() {
        RWATokenizationRequest request = createTokenizationRequest("TEST_ASSET");
        RWATokenizationResult result = rwaTokenizer.tokenizeAsset(request)
            .await().atMost(Duration.ofSeconds(10));
        return result.getToken();
    }

    private AssetDigitalTwin createTestDigitalTwin() {
        return digitalTwinService.createDigitalTwin(
            "TEST_ASSET",
            "CARBON_CREDIT",
            Map.of("location", "Test Location")
        );
    }

    private RWATokenizationRequest createTokenizationRequest(String assetId) {
        RWATokenizationRequest request = new RWATokenizationRequest();
        request.setAssetId(assetId);
        request.setAssetType("CARBON_CREDIT");
        request.setOwnerAddress("0x1234567890abcdef");
        request.setFractionSize(new BigDecimal("1000"));
        request.setMetadata(Map.of(
            "tons", "100",
            "vintage", "2024",
            "quality", "STANDARD"
        ));
        return request;
    }
}