package io.aurigraph.v11.pending.defi;

import io.aurigraph.v11.pending.defi.models.YieldFarmRewards;
import io.aurigraph.v11.pending.defi.oracles.PriceOracle;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Yield farming and staking service with auto-compounding
 * Manages multiple reward tokens and optimization strategies
 */
@ApplicationScoped
public class YieldFarmingService {
    
    private static final Logger logger = LoggerFactory.getLogger(YieldFarmingService.class);
    
    @Inject
    PriceOracle priceOracle;
    
    // Farm storage
    private final Map<String, YieldFarm> farms = new ConcurrentHashMap<>();
    private final Map<String, List<YieldFarmRewards>> userRewards = new ConcurrentHashMap<>();
    private final Map<String, YieldFarmRewards> allRewards = new ConcurrentHashMap<>();
    
    // Performance tracking
    private final AtomicLong rewardsIdGenerator = new AtomicLong(0);
    private volatile BigDecimal totalStaked = BigDecimal.ZERO;
    
    /**
     * Initialize yield farms with various protocols
     */
    public void initializeFarms() {
        logger.info("Initializing yield farming pools");
        
        // High-yield ETH staking farm
        createFarm("ETH_STAKE", "ETH", BigDecimal.valueOf(0.05), // 5% APR
                  Arrays.asList(
                      new YieldFarmRewards.RewardToken("ETH", "ETH", BigDecimal.valueOf(0.04)),
                      new YieldFarmRewards.RewardToken("FARM", "FARM", BigDecimal.valueOf(0.01))
                  ));
        
        // USDC lending farm
        createFarm("USDC_LEND", "USDC", BigDecimal.valueOf(0.08), // 8% APR
                  Collections.singletonList(
                      new YieldFarmRewards.RewardToken("COMP", "COMP", BigDecimal.valueOf(0.08))
                  ));
        
        // LP token farming
        createFarm("ETH_USDC_LP", "ETH_USDC_LP", BigDecimal.valueOf(0.15), // 15% APR
                  Arrays.asList(
                      new YieldFarmRewards.RewardToken("UNI", "UNI", BigDecimal.valueOf(0.10)),
                      new YieldFarmRewards.RewardToken("SUSHI", "SUSHI", BigDecimal.valueOf(0.05))
                  ));
        
        // Cross-chain yield farm
        createFarm("MULTI_CHAIN", "MATIC", BigDecimal.valueOf(0.25), // 25% APR
                  Collections.singletonList(
                      new YieldFarmRewards.RewardToken("MATIC", "MATIC", BigDecimal.valueOf(0.25))
                  ));
        
        logger.info("Initialized {} yield farms", farms.size());
        startAutoCompounding();
    }
    
    /**
     * Stake tokens in a yield farm
     */
    public YieldFarmRewards stake(String farmId, String userAddress, BigDecimal amount) {
        YieldFarm farm = farms.get(farmId);
        if (farm == null) {
            throw new IllegalArgumentException("Farm not found: " + farmId);
        }
        
        // Create rewards tracking
        String rewardsId = generateRewardsId();
        YieldFarmRewards rewards = new YieldFarmRewards(farmId, userAddress, amount, farm.getStakingToken());
        rewards.setBaseApr(farm.getBaseApr());
        
        // Calculate boost multiplier based on user's other positions
        BigDecimal boostMultiplier = calculateBoostMultiplier(userAddress, farmId);
        rewards.setBoostMultiplier(boostMultiplier);
        rewards.setBoostedApr(farm.getBaseApr().multiply(boostMultiplier));
        
        // Set reward tokens
        rewards.setRewardTokens(new ArrayList<>(farm.getRewardTokens()));
        
        // Set lockup period if applicable
        if (farm.hasLockup()) {
            rewards.setLockupPeriod(farm.getLockupPeriod());
        }
        
        // Update farm stats
        farm.addStaker(userAddress, amount);
        
        // Store rewards
        allRewards.put(rewardsId, rewards);
        userRewards.computeIfAbsent(userAddress, k -> new ArrayList<>()).add(rewards);
        
        // Update global stats
        updateTotalStaked();
        
        logger.debug("User {} staked {} {} in farm {}", userAddress, amount, farm.getStakingToken(), farmId);
        return rewards;
    }
    
    /**
     * Unstake tokens from yield farm
     */
    public BigDecimal unstake(String farmId, String userAddress, BigDecimal amount) {
        YieldFarmRewards rewards = findUserRewards(userAddress, farmId);
        if (rewards == null) {
            throw new IllegalArgumentException("No stake found for user in farm");
        }
        
        if (amount.compareTo(rewards.getStakedAmount()) > 0) {
            throw new IllegalArgumentException("Insufficient staked amount");
        }
        
        if (!rewards.canClaim()) {
            throw new IllegalArgumentException("Stake is still in lockup period");
        }
        
        // Calculate pending rewards before unstaking
        BigDecimal pendingRewards = rewards.calculatePendingRewards();
        
        // Update stake amount
        rewards.setStakedAmount(rewards.getStakedAmount().subtract(amount));
        if (rewards.getStakedAmount().equals(BigDecimal.ZERO)) {
            // Full unstake - remove from tracking
            allRewards.values().remove(rewards);
            userRewards.get(userAddress).remove(rewards);
        }
        
        // Update farm stats
        YieldFarm farm = farms.get(farmId);
        farm.removeStaker(userAddress, amount);
        
        // Update global stats
        updateTotalStaked();
        
        logger.debug("User {} unstaked {} from farm {}", userAddress, amount, farmId);
        return amount.add(pendingRewards); // Return principal + rewards
    }
    
    /**
     * Claim rewards from yield farming
     */
    public BigDecimal claimRewards(String farmId, String userAddress) {
        YieldFarmRewards rewards = findUserRewards(userAddress, farmId);
        if (rewards == null) {
            throw new IllegalArgumentException("No rewards found for user in farm");
        }
        
        if (!rewards.canClaim()) {
            throw new IllegalArgumentException("Rewards are still in lockup/vesting");
        }
        
        BigDecimal pendingRewards = rewards.calculatePendingRewards();
        if (pendingRewards.equals(BigDecimal.ZERO)) {
            return BigDecimal.ZERO;
        }
        
        // Apply vesting if configured
        BigDecimal claimableAmount = pendingRewards;
        if (rewards.getVestingSchedule() != null) {
            claimableAmount = applyVesting(rewards, pendingRewards);
        }
        
        // Update rewards tracking
        rewards.setClaimedRewards(rewards.getClaimedRewards().add(claimableAmount));
        rewards.setLastClaimTime(Instant.now());
        
        logger.debug("User {} claimed {} rewards from farm {}", userAddress, claimableAmount, farmId);
        return claimableAmount;
    }
    
    /**
     * Auto-compound rewards for eligible positions
     */
    public Uni<List<YieldFarmRewards>> autoCompound() {
        return Uni.createFrom().item(() -> {
            List<YieldFarmRewards> compounded = new ArrayList<>();
            
            for (YieldFarmRewards rewards : allRewards.values()) {
                if (rewards.shouldAutoCompound()) {
                    BigDecimal pendingRewards = rewards.calculatePendingRewards();
                    if (pendingRewards.compareTo(BigDecimal.ZERO) > 0) {
                        // Reinvest rewards as additional stake
                        rewards.setStakedAmount(rewards.getStakedAmount().add(pendingRewards));
                        rewards.setLastCompoundTime(Instant.now());
                        compounded.add(rewards);
                        
                        logger.debug("Auto-compounded {} for user {} in farm {}", 
                                   pendingRewards, rewards.getUserAddress(), rewards.getFarmId());
                    }
                }
            }
            
            return compounded;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Find optimal yield distribution across protocols
     */
    public List<YieldFarmRewards> findOptimalYieldDistribution(String userAddress, 
                                                              BigDecimal totalAmount, 
                                                              String baseToken) {
        // Sort farms by effective APR (accounting for boosts and risks)
        List<YieldFarm> sortedFarms = farms.values().stream()
            .filter(farm -> farm.getStakingToken().equals(baseToken))
            .sorted((a, b) -> {
                BigDecimal aprA = a.getBaseApr().multiply(calculateBoostMultiplier(userAddress, a.getFarmId()));
                BigDecimal aprB = b.getBaseApr().multiply(calculateBoostMultiplier(userAddress, b.getFarmId()));
                return aprB.compareTo(aprA); // Descending order
            })
            .collect(Collectors.toList());
        
        List<YieldFarmRewards> distribution = new ArrayList<>();
        BigDecimal remaining = totalAmount;
        
        // Distribute across top farms with risk diversification
        for (int i = 0; i < sortedFarms.size() && remaining.compareTo(BigDecimal.ZERO) > 0; i++) {
            YieldFarm farm = sortedFarms.get(i);
            
            // Allocate portion based on rank and risk tolerance
            BigDecimal allocation;
            if (i == 0) {
                allocation = remaining.multiply(BigDecimal.valueOf(0.6)); // 60% to best
            } else if (i == 1) {
                allocation = remaining.multiply(BigDecimal.valueOf(0.3)); // 30% to second best
            } else {
                allocation = remaining.multiply(BigDecimal.valueOf(0.1)); // 10% to others
            }
            
            allocation = allocation.min(remaining);
            
            if (allocation.compareTo(BigDecimal.ZERO) > 0) {
                YieldFarmRewards rewards = stake(farm.getFarmId(), userAddress, allocation);
                distribution.add(rewards);
                remaining = remaining.subtract(allocation);
            }
        }
        
        logger.info("Optimized yield distribution for {}: {} positions", userAddress, distribution.size());
        return distribution;
    }
    
    /**
     * Find best yield opportunities on specific chain
     */
    public List<YieldFarmRewards> findBestYieldOnChain(String chainId, String baseToken, BigDecimal amount) {
        return farms.values().stream()
            .filter(farm -> farm.getChainId().equals(chainId))
            .filter(farm -> farm.getStakingToken().equals(baseToken))
            .sorted((a, b) -> b.getBaseApr().compareTo(a.getBaseApr()))
            .limit(3)
            .map(farm -> {
                YieldFarmRewards mockRewards = new YieldFarmRewards();
                mockRewards.setFarmId(farm.getFarmId());
                mockRewards.setBaseApr(farm.getBaseApr());
                mockRewards.setStakedAmount(amount);
                return mockRewards;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Get user's yield farming positions
     */
    public List<YieldFarmRewards> getUserRewards(String userAddress) {
        return userRewards.getOrDefault(userAddress, new ArrayList<>());
    }
    
    /**
     * Get total staked across all farms
     */
    public BigDecimal getTotalStaked() {
        return totalStaked;
    }
    
    // Private helper methods
    private void createFarm(String farmId, String stakingToken, BigDecimal baseApr, 
                           List<YieldFarmRewards.RewardToken> rewardTokens) {
        YieldFarm farm = new YieldFarm(farmId, stakingToken, baseApr);
        farm.setRewardTokens(rewardTokens);
        farm.setChainId("ethereum"); // Default chain
        farms.put(farmId, farm);
        
        logger.debug("Created yield farm: {} ({}, {}% APR)", farmId, stakingToken, 
                   baseApr.multiply(BigDecimal.valueOf(100)));
    }
    
    private String generateRewardsId() {
        return "YF_" + rewardsIdGenerator.incrementAndGet() + "_" + System.currentTimeMillis();
    }
    
    private BigDecimal calculateBoostMultiplier(String userAddress, String farmId) {
        // Simple boost calculation based on user's other positions
        List<YieldFarmRewards> userPositions = getUserRewards(userAddress);
        if (userPositions.size() > 1) {
            return BigDecimal.valueOf(1.2); // 20% boost for diversification
        } else if (userPositions.size() == 1) {
            return BigDecimal.valueOf(1.1); // 10% boost for participation
        }
        return BigDecimal.ONE; // No boost
    }
    
    private YieldFarmRewards findUserRewards(String userAddress, String farmId) {
        List<YieldFarmRewards> rewards = userRewards.get(userAddress);
        if (rewards == null) return null;
        
        return rewards.stream()
            .filter(r -> r.getFarmId().equals(farmId))
            .findFirst()
            .orElse(null);
    }
    
    private BigDecimal applyVesting(YieldFarmRewards rewards, BigDecimal totalRewards) {
        YieldFarmRewards.VestingSchedule vesting = rewards.getVestingSchedule();
        if (vesting == null) return totalRewards;
        
        long timeSinceStart = Instant.now().getEpochSecond() - rewards.getStakingStartTime().getEpochSecond();
        
        if (timeSinceStart < vesting.getCliffPeriod()) {
            return BigDecimal.ZERO; // Still in cliff period
        }
        
        if (timeSinceStart >= vesting.getVestingPeriod()) {
            return totalRewards; // Fully vested
        }
        
        // Partial vesting
        BigDecimal vestingRatio = BigDecimal.valueOf(timeSinceStart)
            .divide(BigDecimal.valueOf(vesting.getVestingPeriod()), 4, RoundingMode.HALF_UP);
        
        return totalRewards.multiply(vestingRatio);
    }
    
    private void updateTotalStaked() {
        BigDecimal newTotal = allRewards.values().stream()
            .map(YieldFarmRewards::getStakedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        this.totalStaked = newTotal;
    }
    
    private void startAutoCompounding() {
        // Auto-compound every 5 minutes
        Multi.createFrom().ticks().every(java.time.Duration.ofMinutes(5))
            .subscribe().with(tick -> {
                autoCompound().subscribe().with(
                    compounded -> logger.debug("Auto-compounded {} positions", compounded.size()),
                    error -> logger.error("Auto-compound error", error)
                );
            });
    }
    
    // Inner class for yield farm configuration
    public static class YieldFarm {
        private String farmId;
        private String stakingToken;
        private BigDecimal baseApr;
        private List<YieldFarmRewards.RewardToken> rewardTokens;
        private BigDecimal totalStaked = BigDecimal.ZERO;
        private Set<String> stakers = new HashSet<>();
        private String chainId;
        private boolean hasLockup = false;
        private Long lockupPeriod;
        
        public YieldFarm(String farmId, String stakingToken, BigDecimal baseApr) {
            this.farmId = farmId;
            this.stakingToken = stakingToken;
            this.baseApr = baseApr;
        }
        
        public void addStaker(String userAddress, BigDecimal amount) {
            stakers.add(userAddress);
            totalStaked = totalStaked.add(amount);
        }
        
        public void removeStaker(String userAddress, BigDecimal amount) {
            totalStaked = totalStaked.subtract(amount);
            // Note: not removing from stakers set as they may have remaining stake
        }
        
        // Getters and setters
        public String getFarmId() { return farmId; }
        public String getStakingToken() { return stakingToken; }
        public BigDecimal getBaseApr() { return baseApr; }
        public List<YieldFarmRewards.RewardToken> getRewardTokens() { return rewardTokens; }
        public void setRewardTokens(List<YieldFarmRewards.RewardToken> rewardTokens) { this.rewardTokens = rewardTokens; }
        public BigDecimal getTotalStaked() { return totalStaked; }
        public Set<String> getStakers() { return stakers; }
        public String getChainId() { return chainId; }
        public void setChainId(String chainId) { this.chainId = chainId; }
        public boolean hasLockup() { return hasLockup; }
        public void setHasLockup(boolean hasLockup) { this.hasLockup = hasLockup; }
        public Long getLockupPeriod() { return lockupPeriod; }
        public void setLockupPeriod(Long lockupPeriod) { this.lockupPeriod = lockupPeriod; }
    }
}