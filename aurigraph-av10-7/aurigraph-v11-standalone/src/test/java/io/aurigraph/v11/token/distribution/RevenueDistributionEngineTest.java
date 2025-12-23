package io.aurigraph.v11.token.distribution;

import io.aurigraph.v11.token.distribution.RevenueDistributionEngine.*;
import io.aurigraph.v11.token.derived.DerivedToken.DistributionFrequency;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for RevenueDistributionEngine
 *
 * Tests cover:
 * - Distribution configuration validation
 * - Multi-party distribution calculations
 * - Pro-rata investor distributions
 * - Schedule management
 * - Batch operations
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RevenueDistributionEngineTest {

    private RevenueDistributionEngine engine;

    @BeforeEach
    void setUp() {
        engine = new RevenueDistributionEngine();
    }

    // =============== DISTRIBUTION CONFIG TESTS ===============

    @Test
    @Order(1)
    @DisplayName("Config: Should create default config")
    void testDefaultDistributionConfig() {
        DistributionConfig config = DistributionConfig.defaultConfig("ASSET-001", "manager-wallet");

        assertNotNull(config);
        assertEquals("ASSET-001", config.assetId());
        assertEquals(RevenueDistributionEngine.DEFAULT_INVESTOR_SHARE, config.investorSharePercent());
        assertEquals(RevenueDistributionEngine.DEFAULT_MANAGER_SHARE, config.managerSharePercent());
        assertEquals(RevenueDistributionEngine.DEFAULT_PLATFORM_SHARE, config.platformSharePercent());
        assertEquals("manager-wallet", config.managerAddress());
        assertEquals("platform-treasury", config.platformAddress());
        assertTrue(config.autoDistribute());
    }

    @Test
    @Order(2)
    @DisplayName("Config: Should reject shares not summing to 100%")
    void testConfigRejectsInvalidShares() {
        assertThrows(IllegalArgumentException.class, () -> new DistributionConfig(
                "ASSET-001",
                new BigDecimal("60.00"),
                new BigDecimal("30.00"),
                new BigDecimal("5.00"), // Sum = 95%, not 100%
                "manager",
                "platform",
                DistributionFrequency.MONTHLY,
                1,
                true
        ));
    }

    @Test
    @Order(3)
    @DisplayName("Config: Should accept custom valid shares")
    void testConfigAcceptsValidCustomShares() {
        DistributionConfig config = new DistributionConfig(
                "ASSET-001",
                new BigDecimal("80.00"),
                new BigDecimal("15.00"),
                new BigDecimal("5.00"), // Sum = 100%
                "manager",
                "platform",
                DistributionFrequency.QUARTERLY,
                15,
                false
        );

        assertEquals(new BigDecimal("80.00"), config.investorSharePercent());
        assertEquals(DistributionFrequency.QUARTERLY, config.frequency());
        assertEquals(15, config.distributionDayOfMonth());
        assertFalse(config.autoDistribute());
    }

    // =============== DISTRIBUTION CALCULATION TESTS ===============

    @Test
    @Order(4)
    @DisplayName("Calculate: Should distribute 70/25/5 by default")
    void testDefaultDistributionSplit() {
        DistributionConfig config = DistributionConfig.defaultConfig("ASSET-001", "manager");

        List<TokenHolder> holders = List.of(
                new TokenHolder("TOKEN-001", "investor-1", new BigDecimal("100.00"))
        );

        DistributionBreakdown breakdown = engine.calculateDistribution(
                new BigDecimal("100000.00"),
                config,
                holders
        );

        assertNotNull(breakdown);
        assertEquals(new BigDecimal("100000.00"), breakdown.totalRevenue());

        // 70% to investors
        assertTrue(breakdown.investorTotal().compareTo(new BigDecimal("70000")) == 0);
        // 25% to manager
        assertTrue(breakdown.managerAmount().compareTo(new BigDecimal("25000")) == 0);
        // 5% to platform
        assertTrue(breakdown.platformAmount().compareTo(new BigDecimal("5000")) == 0);
    }

    @Test
    @Order(5)
    @DisplayName("Calculate: Should distribute pro-rata to multiple investors")
    void testProRataDistribution() {
        DistributionConfig config = DistributionConfig.defaultConfig("ASSET-001", "manager");

        List<TokenHolder> holders = List.of(
                new TokenHolder("TOKEN-001", "investor-1", new BigDecimal("50.00")),
                new TokenHolder("TOKEN-002", "investor-2", new BigDecimal("30.00")),
                new TokenHolder("TOKEN-003", "investor-3", new BigDecimal("20.00"))
        );

        DistributionBreakdown breakdown = engine.calculateDistribution(
                new BigDecimal("100000.00"),
                config,
                holders
        );

        assertNotNull(breakdown);
        assertEquals(3, breakdown.investorDistributions().size());

        // Investor 1: 50% of 70000 = 35000
        // Investor 2: 30% of 70000 = 21000
        // Investor 3: 20% of 70000 = 14000
        BigDecimal total = breakdown.investorDistributions().stream()
                .map(InvestorDistribution::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total investor distributions should equal investor share
        assertEquals(0, total.compareTo(breakdown.investorTotal()));
    }

    @Test
    @Order(6)
    @DisplayName("Calculate: Should reject non-positive revenue")
    void testRejectsNonPositiveRevenue() {
        DistributionConfig config = DistributionConfig.defaultConfig("ASSET-001", "manager");
        List<TokenHolder> holders = List.of(
                new TokenHolder("TOKEN-001", "investor-1", new BigDecimal("100.00"))
        );

        assertThrows(IllegalArgumentException.class, () ->
                engine.calculateDistribution(BigDecimal.ZERO, config, holders));

        assertThrows(IllegalArgumentException.class, () ->
                engine.calculateDistribution(new BigDecimal("-1000"), config, holders));
    }

    @Test
    @Order(7)
    @DisplayName("Calculate: Should handle empty token holders")
    void testEmptyTokenHolders() {
        DistributionConfig config = DistributionConfig.defaultConfig("ASSET-001", "manager");

        DistributionBreakdown breakdown = engine.calculateDistribution(
                new BigDecimal("100000.00"),
                config,
                List.of()
        );

        assertNotNull(breakdown);
        assertTrue(breakdown.investorDistributions().isEmpty());
    }

    // =============== SCHEDULE MANAGEMENT TESTS ===============

    @Test
    @Order(8)
    @DisplayName("Schedule: Should calculate next daily distribution")
    void testNextDailyDistribution() {
        Instant now = Instant.now();
        Instant next = engine.calculateNextDistributionDate(DistributionFrequency.DAILY, now);

        assertNotNull(next);
        assertEquals(1, ChronoUnit.DAYS.between(now, next));
    }

    @Test
    @Order(9)
    @DisplayName("Schedule: Should calculate next monthly distribution")
    void testNextMonthlyDistribution() {
        Instant now = Instant.now();
        Instant next = engine.calculateNextDistributionDate(DistributionFrequency.MONTHLY, now);

        assertNotNull(next);
        assertEquals(30, ChronoUnit.DAYS.between(now, next));
    }

    @Test
    @Order(10)
    @DisplayName("Schedule: Should calculate next quarterly distribution")
    void testNextQuarterlyDistribution() {
        Instant now = Instant.now();
        Instant next = engine.calculateNextDistributionDate(DistributionFrequency.QUARTERLY, now);

        assertNotNull(next);
        assertEquals(90, ChronoUnit.DAYS.between(now, next));
    }

    @Test
    @Order(11)
    @DisplayName("Schedule: Should calculate next annual distribution")
    void testNextAnnualDistribution() {
        Instant now = Instant.now();
        Instant next = engine.calculateNextDistributionDate(DistributionFrequency.ANNUAL, now);

        assertNotNull(next);
        assertEquals(365, ChronoUnit.DAYS.between(now, next));
    }

    @Test
    @Order(12)
    @DisplayName("Schedule: On-demand should return null")
    void testOnDemandDistributionReturnsNull() {
        Instant next = engine.calculateNextDistributionDate(
                DistributionFrequency.ON_DEMAND, Instant.now());
        assertNull(next);
    }

    // =============== RECORD TYPE TESTS ===============

    @Test
    @Order(13)
    @DisplayName("TokenHolder: Should store ownership data")
    void testTokenHolderRecord() {
        TokenHolder holder = new TokenHolder(
                "TOKEN-001",
                "0xinvestor",
                new BigDecimal("25.50")
        );

        assertEquals("TOKEN-001", holder.tokenId());
        assertEquals("0xinvestor", holder.ownerAddress());
        assertEquals(new BigDecimal("25.50"), holder.ownershipPercent());
    }

    @Test
    @Order(14)
    @DisplayName("DistributionResult: Should create success result")
    void testDistributionResultSuccess() {
        Instant now = Instant.now();
        DistributionResult result = DistributionResult.success(
                "TOKEN-001", new BigDecimal("5000.00"), now);

        assertTrue(result.success());
        assertEquals("TOKEN-001", result.tokenId());
        assertEquals(new BigDecimal("5000.00"), result.amount());
        assertEquals(now, result.distributedAt());
        assertNull(result.errorMessage());
    }

    @Test
    @Order(15)
    @DisplayName("DistributionResult: Should create failure result")
    void testDistributionResultFailure() {
        DistributionResult result = DistributionResult.failure("TOKEN-001", "Token not active");

        assertFalse(result.success());
        assertEquals("TOKEN-001", result.tokenId());
        assertEquals(BigDecimal.ZERO, result.amount());
        assertNull(result.distributedAt());
        assertEquals("Token not active", result.errorMessage());
    }

    @Test
    @Order(16)
    @DisplayName("BatchDistributionResult: Should track success/failure counts")
    void testBatchDistributionResult() {
        List<DistributionResult> results = List.of(
                DistributionResult.success("T1", new BigDecimal("1000"), Instant.now()),
                DistributionResult.success("T2", new BigDecimal("2000"), Instant.now()),
                DistributionResult.failure("T3", "Error")
        );

        BatchDistributionResult batch = new BatchDistributionResult(
                "PARENT-001",
                3,
                2,
                new BigDecimal("10000"),
                new BigDecimal("3000"),
                results,
                null
        );

        assertFalse(batch.isFullySuccessful());
        assertEquals(1, batch.getFailureCount());
        assertEquals(2, batch.successCount());
    }

    @Test
    @Order(17)
    @DisplayName("DistributionStats: Should store aggregate stats")
    void testDistributionStats() {
        Instant last = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant next = Instant.now().plus(1, ChronoUnit.DAYS);

        DistributionStats stats = new DistributionStats(
                "PARENT-001",
                10,
                8,
                new BigDecimal("500000.00"),
                last,
                next
        );

        assertEquals("PARENT-001", stats.parentTokenId());
        assertEquals(10, stats.totalTokens());
        assertEquals(8, stats.activeTokens());
        assertEquals(new BigDecimal("500000.00"), stats.totalDistributed());
        assertEquals(last, stats.lastDistribution());
        assertEquals(next, stats.nextDistribution());
    }

    // =============== DEFAULT VALUES TESTS ===============

    @Test
    @Order(18)
    @DisplayName("Constants: Should have correct default percentages")
    void testDefaultPercentages() {
        assertEquals(new BigDecimal("70.00"), RevenueDistributionEngine.DEFAULT_INVESTOR_SHARE);
        assertEquals(new BigDecimal("25.00"), RevenueDistributionEngine.DEFAULT_MANAGER_SHARE);
        assertEquals(new BigDecimal("5.00"), RevenueDistributionEngine.DEFAULT_PLATFORM_SHARE);

        // Should sum to 100
        BigDecimal total = RevenueDistributionEngine.DEFAULT_INVESTOR_SHARE
                .add(RevenueDistributionEngine.DEFAULT_MANAGER_SHARE)
                .add(RevenueDistributionEngine.DEFAULT_PLATFORM_SHARE);
        assertEquals(0, total.compareTo(BigDecimal.valueOf(100)));
    }

    @Test
    @Order(19)
    @DisplayName("InvestorDistribution: Should contain all distribution data")
    void testInvestorDistributionRecord() {
        InvestorDistribution dist = new InvestorDistribution(
                "TOKEN-001",
                "0xowner",
                new BigDecimal("10.00"),
                new BigDecimal("7000.00")
        );

        assertEquals("TOKEN-001", dist.tokenId());
        assertEquals("0xowner", dist.ownerAddress());
        assertEquals(new BigDecimal("10.00"), dist.ownershipPercent());
        assertEquals(new BigDecimal("7000.00"), dist.amount());
    }

    @Test
    @Order(20)
    @DisplayName("DistributionBreakdown: Should contain complete breakdown")
    void testDistributionBreakdownRecord() {
        List<InvestorDistribution> investors = List.of(
                new InvestorDistribution("T1", "0x1", new BigDecimal("100"), new BigDecimal("70000"))
        );

        DistributionBreakdown breakdown = new DistributionBreakdown(
                "ASSET-001",
                new BigDecimal("100000"),
                new BigDecimal("70000"),
                new BigDecimal("25000"),
                new BigDecimal("5000"),
                "manager",
                "platform",
                investors,
                Instant.now()
        );

        assertEquals("ASSET-001", breakdown.assetId());
        assertEquals(new BigDecimal("100000"), breakdown.totalRevenue());
        assertEquals("manager", breakdown.managerAddress());
        assertEquals(1, breakdown.investorDistributions().size());
        assertNotNull(breakdown.calculatedAt());
    }
}
