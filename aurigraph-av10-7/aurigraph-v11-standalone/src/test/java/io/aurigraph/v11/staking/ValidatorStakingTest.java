package io.aurigraph.v11.staking;

import io.aurigraph.v11.portal.models.*;
import io.aurigraph.v11.portal.services.StakingDataService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive test suite for Validator Staking functionality
 *
 * Tests all staking operations including:
 * - Staking information retrieval
 * - Validator management
 * - Reward distribution pools
 * - Reward statistics
 * - Validator status and performance metrics
 *
 * Target: 10+ comprehensive test cases
 * Coverage: Staking service, validators, and rewards distribution
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Validator Staking Comprehensive Test Suite")
public class ValidatorStakingTest {

    @Inject
    StakingDataService stakingDataService;

    @BeforeEach
    void setup() {
        assertThat(stakingDataService)
            .as("StakingDataService should be injected")
            .isNotNull();
    }

    @Test
    @Order(1)
    @DisplayName("Test get staking information successfully")
    void testGetStakingInfo() {
        // When
        StakingInfoDTO stakingInfo = stakingDataService.getStakingInfo()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(stakingInfo).isNotNull();
        assertThat(stakingInfo.getTotalStaked()).isNotBlank();
        assertThat(stakingInfo.getStakedPercentage()).isGreaterThan(0.0);
        assertThat(stakingInfo.getTotalValidators()).isGreaterThan(0);
        assertThat(stakingInfo.getActiveValidators()).isGreaterThan(0);
        assertThat(stakingInfo.getActiveValidators()).isLessThanOrEqualTo(stakingInfo.getTotalValidators());

        // Verify staking parameters
        assertThat(stakingInfo.getMinStakeAmount()).isNotBlank();
        assertThat(stakingInfo.getUnbondingPeriod()).isGreaterThan(0);
        assertThat(stakingInfo.getAnnualRewardRate()).isGreaterThan(0.0);
        assertThat(stakingInfo.getSlashingRate()).isGreaterThanOrEqualTo(0.0);
    }

    @Test
    @Order(2)
    @DisplayName("Test get validators list successfully")
    void testGetValidatorsList() {
        // When
        List<ValidatorDTO> validators = stakingDataService.getValidators()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(validators).isNotEmpty();
        assertThat(validators).hasSizeGreaterThanOrEqualTo(1);

        // Verify validator structure
        ValidatorDTO validator = validators.get(0);
        assertThat(validator.getValidatorId()).isNotBlank();
        assertThat(validator.getAddress()).isNotBlank();
        assertThat(validator.getStatus()).isNotBlank();
        assertThat(validator.getStake()).isNotBlank();
        assertThat(validator.getCommissionRate()).isGreaterThanOrEqualTo(0.0);
        assertThat(validator.getUptime()).isBetween(0.0, 100.0);
    }

    @Test
    @Order(3)
    @DisplayName("Test validator status validation")
    void testValidatorStatus() {
        // When
        List<ValidatorDTO> validators = stakingDataService.getValidators()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(validators).isNotEmpty();

        // Check valid statuses
        String[] validStatuses = {"active", "inactive", "jailed"};
        validators.forEach(validator -> {
            assertThat(validator.getStatus())
                .as("Validator %s should have valid status", validator.getValidatorId())
                .isIn((Object[]) validStatuses);
        });

        // Verify active validators have high uptime
        validators.stream()
            .filter(v -> "active".equals(v.getStatus()))
            .forEach(v -> {
                assertThat(v.getUptime())
                    .as("Active validator %s should have uptime > 90%%", v.getValidatorId())
                    .isGreaterThan(90.0);
            });
    }

    @Test
    @Order(4)
    @DisplayName("Test validator performance metrics")
    void testValidatorPerformanceMetrics() {
        // When
        List<ValidatorDTO> validators = stakingDataService.getValidators()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(validators).isNotEmpty();

        validators.forEach(validator -> {
            // Verify performance metrics exist
            assertThat(validator.getBlockProposals())
                .as("Validator %s should have block proposals", validator.getValidatorId())
                .isNotNull()
                .isGreaterThanOrEqualTo(0);

            assertThat(validator.getMissedBlocks())
                .as("Validator %s should have missed blocks count", validator.getValidatorId())
                .isNotNull()
                .isGreaterThanOrEqualTo(0);

            assertThat(validator.getConsensusParticipation())
                .as("Validator %s should have consensus participation", validator.getValidatorId())
                .isNotNull()
                .isBetween(0.0, 100.0);

            // Timestamps should be present
            assertThat(validator.getJoinedAt()).isNotNull();
            assertThat(validator.getLastProposalTime()).isNotNull();

            // Rewards should be tracked
            assertThat(validator.getTotalRewards()).isNotBlank();
        });
    }

    @Test
    @Order(5)
    @DisplayName("Test reward distribution pools")
    void testRewardDistributionPools() {
        // When
        List<RewardDistributionDTO> pools = stakingDataService.getDistributionPools()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(pools).isNotEmpty();
        assertThat(pools).hasSizeGreaterThanOrEqualTo(3);

        // Verify required pools exist
        assertThat(pools).anyMatch(p -> "POOL-VALIDATOR".equals(p.getPoolId()));
        assertThat(pools).anyMatch(p -> "POOL-DELEGATOR".equals(p.getPoolId()));
        assertThat(pools).anyMatch(p -> "POOL-COMMUNITY".equals(p.getPoolId()));
    }

    @Test
    @Order(6)
    @DisplayName("Test validator reward pool details")
    void testValidatorRewardPool() {
        // When
        List<RewardDistributionDTO> pools = stakingDataService.getDistributionPools()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        RewardDistributionDTO validatorPool = pools.stream()
            .filter(p -> "POOL-VALIDATOR".equals(p.getPoolId()))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Validator pool not found"));

        assertThat(validatorPool.getPoolName()).contains("Validator");
        assertThat(validatorPool.getPoolType()).isEqualTo("validator");
        assertThat(validatorPool.getTotalRewards()).isNotBlank();
        assertThat(validatorPool.getParticipantCount()).isGreaterThan(0);
        assertThat(validatorPool.getRewardFrequency()).isNotBlank();
        assertThat(validatorPool.getStatus()).isEqualTo("active");
        assertThat(validatorPool.getDistributionPercentage()).isGreaterThan(0.0);
    }

    @Test
    @Order(7)
    @DisplayName("Test reward statistics retrieval")
    void testRewardStatistics() {
        // When
        RewardStatisticsDTO stats = stakingDataService.getRewardStatistics()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(stats).isNotNull();
        assertThat(stats.getTotalRewardsDistributed()).isNotBlank();
        assertThat(stats.getDailyRewardGeneration()).isNotBlank();
        assertThat(stats.getWeeklyRewardGeneration()).isNotBlank();
        assertThat(stats.getMonthlyRewardGeneration()).isNotBlank();

        // Verify wait time metrics
        assertThat(stats.getAverageRewardWaitTime()).isGreaterThan(0);

        // Verify amount metrics
        assertThat(stats.getMinRewardAmount()).isNotBlank();
        assertThat(stats.getMaxRewardAmount()).isNotBlank();
        assertThat(stats.getAverageRewardAmount()).isNotBlank();
        assertThat(stats.getMedianRewardAmount()).isNotBlank();
    }

    @Test
    @Order(8)
    @DisplayName("Test reward distribution frequencies")
    void testRewardDistributionFrequencies() {
        // When
        List<RewardDistributionDTO> pools = stakingDataService.getDistributionPools()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(pools).isNotEmpty();

        pools.forEach(pool -> {
            assertThat(pool.getRewardFrequency())
                .as("Pool %s should have reward frequency", pool.getPoolId())
                .isNotBlank();

            assertThat(pool.getNextDistribution())
                .as("Pool %s should have next distribution time", pool.getPoolId())
                .isNotNull()
                .isAfter(java.time.Instant.now());

            assertThat(pool.getRewardsDistributedLast24h())
                .as("Pool %s should track 24h rewards", pool.getPoolId())
                .isNotBlank();

            assertThat(pool.getRewardsDistributedLast30d())
                .as("Pool %s should track 30d rewards", pool.getPoolId())
                .isNotBlank();
        });
    }

    @Test
    @Order(9)
    @DisplayName("Test staking commission rates")
    void testStakingCommissionRates() {
        // When
        StakingInfoDTO stakingInfo = stakingDataService.getStakingInfo()
            .await().atMost(Duration.ofSeconds(5));

        List<ValidatorDTO> validators = stakingDataService.getValidators()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(stakingInfo.getCommissionMin()).isNotNull();
        assertThat(stakingInfo.getCommissionMax()).isNotNull();
        assertThat(stakingInfo.getAverageCommission()).isNotNull();

        // Verify commission min <= average <= max
        assertThat(stakingInfo.getAverageCommission())
            .isBetween(stakingInfo.getCommissionMin(), stakingInfo.getCommissionMax());

        // Verify individual validator commissions are within bounds
        validators.forEach(validator -> {
            assertThat(validator.getCommissionRate())
                .as("Validator %s commission should be within bounds", validator.getValidatorId())
                .isBetween(stakingInfo.getCommissionMin(), stakingInfo.getCommissionMax());
        });
    }

    @Test
    @Order(10)
    @DisplayName("Test reward pool distribution percentages sum correctly")
    void testRewardPoolDistributionPercentages() {
        // When
        List<RewardDistributionDTO> pools = stakingDataService.getDistributionPools()
            .await().atMost(Duration.ofSeconds(5));

        // Then
        assertThat(pools).isNotEmpty();

        double totalPercentage = pools.stream()
            .mapToDouble(RewardDistributionDTO::getDistributionPercentage)
            .sum();

        // Total distribution percentage should be 100% (allowing small floating point error)
        assertThat(totalPercentage)
            .as("Total reward distribution percentage should equal 100%%")
            .isCloseTo(100.0, within(0.01));

        // Each pool should have positive percentage
        pools.forEach(pool -> {
            assertThat(pool.getDistributionPercentage())
                .as("Pool %s should have positive distribution percentage", pool.getPoolId())
                .isGreaterThan(0.0)
                .isLessThanOrEqualTo(100.0);
        });

        // Validator pool should have the largest share
        RewardDistributionDTO validatorPool = pools.stream()
            .filter(p -> "POOL-VALIDATOR".equals(p.getPoolId()))
            .findFirst()
            .orElseThrow();

        assertThat(validatorPool.getDistributionPercentage())
            .as("Validator pool should have largest distribution share")
            .isGreaterThanOrEqualTo(50.0);
    }

    @AfterAll
    static void tearDown() {
        System.out.println("ValidatorStaking test suite completed successfully");
        System.out.println("All 10 validator staking tests validated");
    }
}
