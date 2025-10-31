package io.aurigraph.v11.portal;

import io.aurigraph.v11.portal.models.*;
import io.aurigraph.v11.portal.services.*;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Portal Phase 2 data services
 * Tests all 7 data service implementations with realistic scenarios
 *
 * Uses PortalIntegrationTestProfile to disable old API resources
 * and prevent endpoint conflicts with PortalAPIGateway
 */
@QuarkusTest
@TestProfile(PortalIntegrationTestProfile.class)
@DisplayName("Portal Phase 2 Data Services Integration Tests")
public class PortalDataServicesIntegrationTest {

    @Inject
    BlockchainDataService blockchainDataService;

    @Inject
    TokenDataService tokenDataService;

    @Inject
    AnalyticsDataService analyticsDataService;

    @Inject
    NetworkDataService networkDataService;

    @Inject
    RWADataService rwaDataService;

    @Inject
    ContractDataService contractDataService;

    @Inject
    StakingDataService stakingDataService;

    @BeforeEach
    void setUp() {
        assertNotNull(blockchainDataService, "BlockchainDataService should be injected");
        assertNotNull(tokenDataService, "TokenDataService should be injected");
        assertNotNull(analyticsDataService, "AnalyticsDataService should be injected");
        assertNotNull(networkDataService, "NetworkDataService should be injected");
        assertNotNull(rwaDataService, "RWADataService should be injected");
        assertNotNull(contractDataService, "ContractDataService should be injected");
        assertNotNull(stakingDataService, "StakingDataService should be injected");
    }

    // ============================================================
    // BLOCKCHAIN DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch blockchain health status")
    void testGetHealthStatus() {
        UniAssertSubscriber<HealthStatusDTO> subscriber = blockchainDataService.getHealthStatus()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        HealthStatusDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("healthy", result.getStatus());
        assertNotNull(result.getTimestamp());
        assertNotNull(result.getChainHeight());
        assertTrue(result.getChainHeight() > 0);
    }

    @Test
    @DisplayName("Should fetch system information")
    void testGetSystemInfo() {
        UniAssertSubscriber<SystemInfoDTO> subscriber = blockchainDataService.getSystemInfo()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        SystemInfoDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("11.0.0", result.getVersion());
        assertEquals("production", result.getEnvironment());
        assertNotNull(result.getJavaVersion());
    }

    @Test
    @DisplayName("Should fetch blockchain metrics")
    void testGetBlockchainMetrics() {
        UniAssertSubscriber<BlockchainMetricsDTO> subscriber = blockchainDataService.getBlockchainMetrics()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        BlockchainMetricsDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("healthy", result.getStatus());
        assertTrue(result.getTps() > 700000);
        assertTrue(result.getAvgBlockTime() > 2.0);
        assertTrue(result.getActiveNodes() > 0);
    }

    @Test
    @DisplayName("Should fetch blockchain statistics")
    void testGetBlockchainStats() {
        UniAssertSubscriber<BlockchainStatsDTO> subscriber = blockchainDataService.getBlockchainStats()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        BlockchainStatsDTO result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.getTotalBlocks() > 0);
        assertTrue(result.getTotalTransactions() > 0);
        assertTrue(result.getActiveValidators() > 0);
    }

    @Test
    @DisplayName("Should fetch latest blocks")
    void testGetLatestBlocks() {
        UniAssertSubscriber<List<BlockDTO>> subscriber = blockchainDataService.getLatestBlocks(5)
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<BlockDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.size() <= 5);
        assertFalse(result.isEmpty());

        BlockDTO firstBlock = result.get(0);
        assertNotNull(firstBlock.getBlockHeight());
        assertNotNull(firstBlock.getBlockHash());
        assertNotNull(firstBlock.getTimestamp());
    }

    @Test
    @DisplayName("Should fetch validators")
    void testGetValidators() {
        UniAssertSubscriber<List<ValidatorDTO>> subscriber = blockchainDataService.getValidators()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<ValidatorDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertEquals(16, result.size());

        ValidatorDTO validator = result.get(0);
        assertNotNull(validator.getValidatorId());
        assertEquals("active", validator.getStatus());
        assertTrue(validator.getUptime() > 99.0);
    }

    @Test
    @DisplayName("Should fetch validator details")
    void testGetValidatorDetails() {
        UniAssertSubscriber<ValidatorDetailDTO> subscriber = blockchainDataService.getValidatorDetails("validator-1")
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        ValidatorDetailDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("validator-1", result.getValidatorId());
        assertEquals("active", result.getStatus());
        assertNotNull(result.getDelegators());
    }

    @Test
    @DisplayName("Should fetch transactions")
    void testGetTransactions() {
        UniAssertSubscriber<List<TransactionDTO>> subscriber = blockchainDataService.getTransactions(10)
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<TransactionDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.size() <= 10);
        assertFalse(result.isEmpty());

        TransactionDTO tx = result.get(0);
        assertNotNull(tx.getTxHash());
        assertNotNull(tx.getFrom());
        assertEquals("confirmed", tx.getStatus());
    }

    // ============================================================
    // TOKEN DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch all tokens")
    void testGetAllTokens() {
        UniAssertSubscriber<List<TokenDTO>> subscriber = tokenDataService.getAllTokens()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<TokenDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertTrue(result.size() >= 4);

        // Check for main token
        TokenDTO aurToken = result.stream()
            .filter(t -> "AUR".equals(t.getSymbol()))
            .findFirst()
            .orElse(null);

        assertNotNull(aurToken);
        assertEquals("Aurigraph", aurToken.getName());
        assertEquals("native", aurToken.getType());
    }

    @Test
    @DisplayName("Should fetch token statistics")
    void testGetTokenStatistics() {
        UniAssertSubscriber<TokenStatisticsDTO> subscriber = tokenDataService.getTokenStatistics()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        TokenStatisticsDTO result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.getTotalTokens() > 0);
        assertTrue(result.getTotalTokenHolders() > 0);
        assertTrue(result.getRwaTokenCount() > 0);
    }

    // ============================================================
    // RWA DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch RWA tokens")
    void testGetRWATokens() {
        UniAssertSubscriber<List<RWATokenDTO>> subscriber = rwaDataService.getRWATokens()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<RWATokenDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertFalse(result.isEmpty());

        RWATokenDTO realEstate = result.stream()
            .filter(t -> "AURREAL".equals(t.getTokenId()))
            .findFirst()
            .orElse(null);

        assertNotNull(realEstate);
        assertEquals("real-estate", realEstate.getAssetType());
        assertEquals("verified", realEstate.getVerificationStatus());
    }

    @Test
    @DisplayName("Should fetch RWA pools")
    void testGetRWAPools() {
        UniAssertSubscriber<List<RWAPoolDTO>> subscriber = rwaDataService.getRWAPools()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<RWAPoolDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.size() >= 3);

        RWAPoolDTO pool = result.get(0);
        assertNotNull(pool.getPoolId());
        assertTrue(pool.getApyPercentage() > 0);
    }

    // ============================================================
    // ANALYTICS DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch analytics data")
    void testGetAnalytics() {
        UniAssertSubscriber<AnalyticsDTO> subscriber = analyticsDataService.getAnalytics()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        AnalyticsDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("24h", result.getPeriod());
        assertTrue(result.getTotalTransactions() > 0);
        assertTrue(result.getUniqueUsers() > 0);
    }

    @Test
    @DisplayName("Should fetch ML metrics")
    void testGetMLMetrics() {
        UniAssertSubscriber<MLMetricsDTO> subscriber = analyticsDataService.getMLMetrics()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        MLMetricsDTO result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.getModelAccuracy() > 90);
        assertTrue(result.getModelAccuracy() <= 100);
    }

    // ============================================================
    // NETWORK DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch network health")
    void testGetNetworkHealth() {
        UniAssertSubscriber<NetworkHealthDTO> subscriber = networkDataService.getNetworkHealth()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        NetworkHealthDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("healthy", result.getStatus());
        assertTrue(result.getUptime() > 99.0);
        assertTrue(result.getActiveNodes() > 0);
    }

    @Test
    @DisplayName("Should fetch system configuration")
    void testGetSystemConfig() {
        UniAssertSubscriber<SystemConfigDTO> subscriber = networkDataService.getSystemConfig()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        SystemConfigDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals(3, result.getBlockTime());
        assertTrue(result.getMaxValidators() > 0);
        assertTrue(result.getMaxGasPerBlock() > 0);
    }

    @Test
    @DisplayName("Should fetch system status")
    void testGetSystemStatus() {
        UniAssertSubscriber<SystemStatusDTO> subscriber = networkDataService.getSystemStatus()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        SystemStatusDTO result = subscriber.getItem();

        assertNotNull(result);
        assertEquals("excellent", result.getSystemHealth());
        assertTrue(result.getCpuUsage() > 0);
        assertTrue(result.getCpuUsage() <= 100);
    }

    @Test
    @DisplayName("Should fetch audit trail")
    void testGetAuditTrail() {
        UniAssertSubscriber<List<AuditTrailDTO>> subscriber = networkDataService.getAuditTrail(5)
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<AuditTrailDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertFalse(result.isEmpty());

        AuditTrailDTO entry = result.get(0);
        assertNotNull(entry.getId());
        assertNotNull(entry.getEventType());
        assertNotNull(entry.getTimestamp());
    }

    // ============================================================
    // CONTRACT DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch Ricardian contracts")
    void testGetRicardianContracts() {
        UniAssertSubscriber<List<RicardianContractDTO>> subscriber = contractDataService.getRicardianContracts()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<RicardianContractDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertFalse(result.isEmpty());

        RicardianContractDTO contract = result.get(0);
        assertNotNull(contract.getContractId());
        assertEquals("verified", contract.getVerificationStatus());
    }

    @Test
    @DisplayName("Should fetch contract templates")
    void testGetContractTemplates() {
        UniAssertSubscriber<List<ContractTemplateDTO>> subscriber = contractDataService.getContractTemplates()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<ContractTemplateDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertFalse(result.isEmpty());

        ContractTemplateDTO template = result.get(0);
        assertNotNull(template.getTemplateId());
        assertEquals("verified", template.getStatus());
    }

    // ============================================================
    // STAKING DATA SERVICE TESTS
    // ============================================================

    @Test
    @DisplayName("Should fetch staking information")
    void testGetStakingInfo() {
        UniAssertSubscriber<StakingInfoDTO> subscriber = stakingDataService.getStakingInfo()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        StakingInfoDTO result = subscriber.getItem();

        assertNotNull(result);
        assertTrue(result.getStakedPercentage() > 40);
        assertTrue(result.getActiveValidators() > 0);
    }

    @Test
    @DisplayName("Should fetch reward distribution pools")
    void testGetDistributionPools() {
        UniAssertSubscriber<List<RewardDistributionDTO>> subscriber = stakingDataService.getDistributionPools()
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitItem().assertCompleted();
        List<RewardDistributionDTO> result = subscriber.getItem();

        assertNotNull(result);
        assertEquals(4, result.size());

        // Verify distribution percentages sum to 100%
        double totalPercentage = result.stream()
            .mapToDouble(RewardDistributionDTO::getDistributionPercentage)
            .sum();
        assertEquals(100.0, totalPercentage, 0.1);
    }
}
