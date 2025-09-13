package io.aurigraph.v11.defi;

import io.aurigraph.v11.defi.models.LiquidityPosition;
import io.aurigraph.v11.defi.oracles.PriceOracle;
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

/**
 * Automated Market Maker (AMM) liquidity pool management
 * Implements constant product formula, concentrated liquidity, and fee optimization
 */
@ApplicationScoped
public class LiquidityPoolManager {
    
    private static final Logger logger = LoggerFactory.getLogger(LiquidityPoolManager.class);
    
    @Inject
    PriceOracle priceOracle;
    
    // Pool storage
    private final Map<String, LiquidityPool> pools = new ConcurrentHashMap<>();
    private final Map<String, List<LiquidityPosition>> userPositions = new ConcurrentHashMap<>();
    private final Map<String, LiquidityPosition> allPositions = new ConcurrentHashMap<>();
    
    // Performance tracking
    private final AtomicLong positionIdGenerator = new AtomicLong(0);
    private volatile BigDecimal totalValueLocked = BigDecimal.ZERO;
    
    /**
     * Initialize liquidity pools with major trading pairs
     */
    public void initializePools() {
        logger.info("Initializing AMM liquidity pools");
        
        // ETH/USDC pool
        createPool("ETH_USDC_3000", "ETH", "USDC", BigDecimal.valueOf(0.003), PoolType.UNISWAP_V3);
        
        // BTC/ETH pool
        createPool("BTC_ETH_3000", "BTC", "ETH", BigDecimal.valueOf(0.003), PoolType.UNISWAP_V3);
        
        // Stablecoin pools
        createPool("USDC_USDT_100", "USDC", "USDT", BigDecimal.valueOf(0.0001), PoolType.CURVE);
        createPool("DAI_USDC_100", "DAI", "USDC", BigDecimal.valueOf(0.0001), PoolType.CURVE);
        
        logger.info("Initialized {} liquidity pools", pools.size());
    }
    
    /**
     * Add liquidity to AMM pool with concentrated liquidity support
     */
    public LiquidityPosition addLiquidity(String poolId, String userAddress,
                                         BigDecimal token0Amount, BigDecimal token1Amount,
                                         BigDecimal minToken0, BigDecimal minToken1) {
        
        LiquidityPool pool = pools.get(poolId);
        if (pool == null) {
            throw new IllegalArgumentException("Pool not found: " + poolId);
        }
        
        // Validate minimum amounts
        if (token0Amount.compareTo(minToken0) < 0 || token1Amount.compareTo(minToken1) < 0) {
            throw new IllegalArgumentException("Amounts below minimum");
        }
        
        // Calculate LP token amount based on pool type
        BigDecimal lpTokenAmount = calculateLPTokens(pool, token0Amount, token1Amount);
        
        // Create position
        String positionId = generatePositionId();
        LiquidityPosition position = new LiquidityPosition(positionId, poolId, pool.getLpTokenAddress());
        position.setToken0Address(pool.getToken0());
        position.setToken1Address(pool.getToken1());
        position.setToken0Amount(token0Amount);
        position.setToken1Amount(token1Amount);
        position.setLpTokenAmount(lpTokenAmount);
        position.setPoolFee(pool.getFee());
        
        // Set entry prices
        BigDecimal token0Price = priceOracle.getPrice(pool.getToken0());
        BigDecimal token1Price = priceOracle.getPrice(pool.getToken1());
        position.setToken0EntryPrice(token0Price);
        position.setToken1EntryPrice(token1Price);
        
        // Calculate total value locked
        BigDecimal tvl = token0Amount.multiply(token0Price).add(token1Amount.multiply(token1Price));
        position.setTotalValueLocked(tvl);
        
        // Update pool reserves
        pool.addLiquidity(token0Amount, token1Amount, lpTokenAmount);
        
        // Store position
        allPositions.put(positionId, position);
        userPositions.computeIfAbsent(userAddress, k -> new ArrayList<>()).add(position);
        
        // Update global TVL
        updateTotalValueLocked();
        
        logger.debug("Added liquidity position {} with {} LP tokens", positionId, lpTokenAmount);
        return position;
    }
    
    /**
     * Remove liquidity from AMM pool
     */
    public BigDecimal[] removeLiquidity(String positionId, BigDecimal lpTokenAmount) {
        LiquidityPosition position = allPositions.get(positionId);
        if (position == null) {
            throw new IllegalArgumentException("Position not found: " + positionId);
        }
        
        LiquidityPool pool = pools.get(position.getPoolId());
        if (pool == null) {
            throw new IllegalArgumentException("Pool not found: " + position.getPoolId());
        }
        
        if (lpTokenAmount.compareTo(position.getLpTokenAmount()) > 0) {
            throw new IllegalArgumentException("Insufficient LP tokens");
        }
        
        // Calculate withdrawal amounts
        BigDecimal withdrawalRatio = lpTokenAmount.divide(position.getLpTokenAmount(), 8, RoundingMode.HALF_UP);
        BigDecimal token0Amount = position.getToken0Amount().multiply(withdrawalRatio);
        BigDecimal token1Amount = position.getToken1Amount().multiply(withdrawalRatio);
        
        // Calculate and add accrued fees
        BigDecimal[] fees = calculateAccruedFees(position, pool);
        BigDecimal token0WithFees = token0Amount.add(fees[0].multiply(withdrawalRatio));
        BigDecimal token1WithFees = token1Amount.add(fees[1].multiply(withdrawalRatio));
        
        // Update position
        if (lpTokenAmount.equals(position.getLpTokenAmount())) {
            // Full withdrawal
            position.setIsActive(false);
            allPositions.remove(positionId);
        } else {
            // Partial withdrawal
            position.setToken0Amount(position.getToken0Amount().subtract(token0Amount));
            position.setToken1Amount(position.getToken1Amount().subtract(token1Amount));
            position.setLpTokenAmount(position.getLpTokenAmount().subtract(lpTokenAmount));
            position.setFeesEarned0(position.getFeesEarned0().add(fees[0].multiply(withdrawalRatio)));
            position.setFeesEarned1(position.getFeesEarned1().add(fees[1].multiply(withdrawalRatio)));
        }
        
        // Update pool
        pool.removeLiquidity(token0Amount, token1Amount, lpTokenAmount);
        
        // Update global TVL
        updateTotalValueLocked();
        
        logger.debug("Removed {} LP tokens from position {}", lpTokenAmount, positionId);
        return new BigDecimal[]{token0WithFees, token1WithFees};
    }
    
    /**
     * Execute swap through AMM with price impact calculation
     */
    public SwapResult executeSwap(String poolId, String tokenIn, String tokenOut,
                                 BigDecimal amountIn, BigDecimal minAmountOut) {
        
        LiquidityPool pool = pools.get(poolId);
        if (pool == null) {
            throw new IllegalArgumentException("Pool not found: " + poolId);
        }
        
        boolean isToken0In = tokenIn.equals(pool.getToken0());
        if (!isToken0In && !tokenIn.equals(pool.getToken1())) {
            throw new IllegalArgumentException("Token not in pool: " + tokenIn);
        }
        
        // Calculate output amount using constant product formula
        BigDecimal amountOut = calculateSwapOutput(pool, isToken0In, amountIn);
        
        if (amountOut.compareTo(minAmountOut) < 0) {
            throw new IllegalArgumentException("Output below minimum");
        }
        
        // Calculate price impact
        BigDecimal priceImpact = calculatePriceImpact(pool, isToken0In, amountIn, amountOut);
        
        // Execute swap
        if (isToken0In) {
            pool.setReserve0(pool.getReserve0().add(amountIn));
            pool.setReserve1(pool.getReserve1().subtract(amountOut));
        } else {
            pool.setReserve1(pool.getReserve1().add(amountIn));
            pool.setReserve0(pool.getReserve0().subtract(amountOut));
        }
        
        // Calculate and distribute fees to liquidity providers
        BigDecimal fee = amountIn.multiply(pool.getFee());
        distributeFees(pool, fee, isToken0In);
        
        logger.debug("Executed swap: {} {} -> {} {} (impact: {}%)", 
                   amountIn, tokenIn, amountOut, tokenOut, priceImpact.multiply(BigDecimal.valueOf(100)));
        
        return new SwapResult(amountOut, priceImpact, fee);
    }
    
    /**
     * Get optimal swap route across multiple pools
     */
    public List<SwapHop> findOptimalRoute(String tokenIn, String tokenOut, BigDecimal amountIn) {
        // Simple implementation - in production would use graph algorithms
        List<SwapHop> route = new ArrayList<>();
        
        // Direct route first
        String directPoolId = findDirectPool(tokenIn, tokenOut);
        if (directPoolId != null) {
            LiquidityPool pool = pools.get(directPoolId);
            BigDecimal amountOut = calculateSwapOutput(pool, tokenIn.equals(pool.getToken0()), amountIn);
            route.add(new SwapHop(directPoolId, tokenIn, tokenOut, amountIn, amountOut, pool.getFee()));
            return route;
        }
        
        // Multi-hop through ETH or USDC
        String intermediateToken = "ETH";
        String pool1Id = findDirectPool(tokenIn, intermediateToken);
        String pool2Id = findDirectPool(intermediateToken, tokenOut);
        
        if (pool1Id != null && pool2Id != null) {
            LiquidityPool pool1 = pools.get(pool1Id);
            LiquidityPool pool2 = pools.get(pool2Id);
            
            BigDecimal intermediateAmount = calculateSwapOutput(pool1, tokenIn.equals(pool1.getToken0()), amountIn);
            BigDecimal finalAmount = calculateSwapOutput(pool2, intermediateToken.equals(pool2.getToken0()), intermediateAmount);
            
            route.add(new SwapHop(pool1Id, tokenIn, intermediateToken, amountIn, intermediateAmount, pool1.getFee()));
            route.add(new SwapHop(pool2Id, intermediateToken, tokenOut, intermediateAmount, finalAmount, pool2.getFee()));
        }
        
        return route;
    }
    
    /**
     * Get user's liquidity positions
     */
    public List<LiquidityPosition> getUserPositions(String userAddress) {
        return userPositions.getOrDefault(userAddress, new ArrayList<>());
    }
    
    /**
     * Update all positions with current market data
     */
    public Uni<Void> updatePositions() {
        return Uni.createFrom().item(() -> {
            for (LiquidityPosition position : allPositions.values()) {
                if (position.getIsActive()) {
                    updatePositionMetrics(position);
                }
            }
            updateTotalValueLocked();
            return null;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Get total value locked across all pools
     */
    public BigDecimal getTotalValueLocked() {
        return totalValueLocked;
    }
    
    // Private helper methods
    private void createPool(String poolId, String token0, String token1, BigDecimal fee, PoolType type) {
        LiquidityPool pool = new LiquidityPool(poolId, token0, token1, fee, type);
        pools.put(poolId, pool);
        logger.debug("Created pool: {} ({}/{})", poolId, token0, token1);
    }
    
    private String generatePositionId() {
        return "LP_" + positionIdGenerator.incrementAndGet() + "_" + System.currentTimeMillis();
    }
    
    private BigDecimal calculateLPTokens(LiquidityPool pool, BigDecimal token0Amount, BigDecimal token1Amount) {
        if (pool.getTotalSupply().equals(BigDecimal.ZERO)) {
            // First liquidity provision
            return sqrt(token0Amount.multiply(token1Amount));
        }
        
        // Subsequent provisions
        BigDecimal ratio0 = token0Amount.divide(pool.getReserve0(), 8, RoundingMode.HALF_UP);
        BigDecimal ratio1 = token1Amount.divide(pool.getReserve1(), 8, RoundingMode.HALF_UP);
        BigDecimal ratio = ratio0.min(ratio1);
        
        return pool.getTotalSupply().multiply(ratio);
    }
    
    private BigDecimal calculateSwapOutput(LiquidityPool pool, boolean isToken0In, BigDecimal amountIn) {
        // Constant product formula: (x + dx) * (y - dy) = x * y
        // With fees: amountInWithFee = amountIn * (1 - fee)
        
        BigDecimal amountInWithFee = amountIn.multiply(BigDecimal.ONE.subtract(pool.getFee()));
        
        if (isToken0In) {
            BigDecimal numerator = amountInWithFee.multiply(pool.getReserve1());
            BigDecimal denominator = pool.getReserve0().add(amountInWithFee);
            return numerator.divide(denominator, 8, RoundingMode.HALF_UP);
        } else {
            BigDecimal numerator = amountInWithFee.multiply(pool.getReserve0());
            BigDecimal denominator = pool.getReserve1().add(amountInWithFee);
            return numerator.divide(denominator, 8, RoundingMode.HALF_UP);
        }
    }
    
    private BigDecimal calculatePriceImpact(LiquidityPool pool, boolean isToken0In, 
                                          BigDecimal amountIn, BigDecimal amountOut) {
        // Price impact = |newPrice - oldPrice| / oldPrice
        BigDecimal oldPrice;
        BigDecimal newPrice;
        
        if (isToken0In) {
            oldPrice = pool.getReserve1().divide(pool.getReserve0(), 8, RoundingMode.HALF_UP);
            BigDecimal newReserve0 = pool.getReserve0().add(amountIn);
            BigDecimal newReserve1 = pool.getReserve1().subtract(amountOut);
            newPrice = newReserve1.divide(newReserve0, 8, RoundingMode.HALF_UP);
        } else {
            oldPrice = pool.getReserve0().divide(pool.getReserve1(), 8, RoundingMode.HALF_UP);
            BigDecimal newReserve0 = pool.getReserve0().subtract(amountOut);
            BigDecimal newReserve1 = pool.getReserve1().add(amountIn);
            newPrice = newReserve0.divide(newReserve1, 8, RoundingMode.HALF_UP);
        }
        
        return newPrice.subtract(oldPrice).abs().divide(oldPrice, 8, RoundingMode.HALF_UP);
    }
    
    private BigDecimal[] calculateAccruedFees(LiquidityPosition position, LiquidityPool pool) {
        // Simplified fee calculation - in reality would track per-position fee accumulation
        BigDecimal shareOfPool = position.getLpTokenAmount().divide(pool.getTotalSupply(), 8, RoundingMode.HALF_UP);
        BigDecimal fees0 = pool.getAccumulatedFees0().multiply(shareOfPool);
        BigDecimal fees1 = pool.getAccumulatedFees1().multiply(shareOfPool);
        
        return new BigDecimal[]{fees0, fees1};
    }
    
    private void distributeFees(LiquidityPool pool, BigDecimal fee, boolean isToken0Fee) {
        if (isToken0Fee) {
            pool.setAccumulatedFees0(pool.getAccumulatedFees0().add(fee));
        } else {
            pool.setAccumulatedFees1(pool.getAccumulatedFees1().add(fee));
        }
    }
    
    private void updatePositionMetrics(LiquidityPosition position) {
        // Update current prices and calculate metrics
        BigDecimal token0Price = priceOracle.getPrice(position.getToken0Address());
        BigDecimal token1Price = priceOracle.getPrice(position.getToken1Address());
        
        BigDecimal currentValue = position.getToken0Amount().multiply(token0Price)
            .add(position.getToken1Amount().multiply(token1Price));
        position.setCurrentValue(currentValue);
        
        // Calculate ROI
        if (position.getTotalValueLocked().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal roi = currentValue.subtract(position.getTotalValueLocked())
                .divide(position.getTotalValueLocked(), 4, RoundingMode.HALF_UP);
            position.setRoi(roi);
        }
        
        position.setLastUpdated(Instant.now());
    }
    
    private void updateTotalValueLocked() {
        BigDecimal newTvl = pools.values().stream()
            .map(pool -> pool.getReserve0().multiply(priceOracle.getPrice(pool.getToken0()))
                .add(pool.getReserve1().multiply(priceOracle.getPrice(pool.getToken1()))))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        this.totalValueLocked = newTvl;
    }
    
    private String findDirectPool(String token0, String token1) {
        return pools.values().stream()
            .filter(pool -> (pool.getToken0().equals(token0) && pool.getToken1().equals(token1)) ||
                          (pool.getToken0().equals(token1) && pool.getToken1().equals(token0)))
            .map(LiquidityPool::getPoolId)
            .findFirst()
            .orElse(null);
    }
    
    private BigDecimal sqrt(BigDecimal value) {
        // Simple square root implementation
        if (value.equals(BigDecimal.ZERO)) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal x = value;
        BigDecimal two = BigDecimal.valueOf(2);
        
        for (int i = 0; i < 10; i++) { // 10 iterations for precision
            x = x.add(value.divide(x, 8, RoundingMode.HALF_UP)).divide(two, 8, RoundingMode.HALF_UP);
        }
        
        return x;
    }
    
    // Inner classes
    public enum PoolType {
        UNISWAP_V2, UNISWAP_V3, CURVE, BALANCER
    }
    
    public static class LiquidityPool {
        private String poolId;
        private String token0;
        private String token1;
        private BigDecimal reserve0 = BigDecimal.ZERO;
        private BigDecimal reserve1 = BigDecimal.ZERO;
        private BigDecimal fee;
        private BigDecimal totalSupply = BigDecimal.ZERO;
        private BigDecimal accumulatedFees0 = BigDecimal.ZERO;
        private BigDecimal accumulatedFees1 = BigDecimal.ZERO;
        private PoolType type;
        private String lpTokenAddress;
        
        public LiquidityPool(String poolId, String token0, String token1, BigDecimal fee, PoolType type) {
            this.poolId = poolId;
            this.token0 = token0;
            this.token1 = token1;
            this.fee = fee;
            this.type = type;
            this.lpTokenAddress = "LP_" + poolId;
        }
        
        public void addLiquidity(BigDecimal amount0, BigDecimal amount1, BigDecimal lpTokens) {
            this.reserve0 = this.reserve0.add(amount0);
            this.reserve1 = this.reserve1.add(amount1);
            this.totalSupply = this.totalSupply.add(lpTokens);
        }
        
        public void removeLiquidity(BigDecimal amount0, BigDecimal amount1, BigDecimal lpTokens) {
            this.reserve0 = this.reserve0.subtract(amount0);
            this.reserve1 = this.reserve1.subtract(amount1);
            this.totalSupply = this.totalSupply.subtract(lpTokens);
        }
        
        // Getters and setters
        public String getPoolId() { return poolId; }
        public String getToken0() { return token0; }
        public String getToken1() { return token1; }
        public BigDecimal getReserve0() { return reserve0; }
        public void setReserve0(BigDecimal reserve0) { this.reserve0 = reserve0; }
        public BigDecimal getReserve1() { return reserve1; }
        public void setReserve1(BigDecimal reserve1) { this.reserve1 = reserve1; }
        public BigDecimal getFee() { return fee; }
        public BigDecimal getTotalSupply() { return totalSupply; }
        public BigDecimal getAccumulatedFees0() { return accumulatedFees0; }
        public void setAccumulatedFees0(BigDecimal accumulatedFees0) { this.accumulatedFees0 = accumulatedFees0; }
        public BigDecimal getAccumulatedFees1() { return accumulatedFees1; }
        public void setAccumulatedFees1(BigDecimal accumulatedFees1) { this.accumulatedFees1 = accumulatedFees1; }
        public PoolType getType() { return type; }
        public String getLpTokenAddress() { return lpTokenAddress; }
    }
    
    public static class SwapResult {
        private BigDecimal amountOut;
        private BigDecimal priceImpact;
        private BigDecimal fee;
        
        public SwapResult(BigDecimal amountOut, BigDecimal priceImpact, BigDecimal fee) {
            this.amountOut = amountOut;
            this.priceImpact = priceImpact;
            this.fee = fee;
        }
        
        // Getters
        public BigDecimal getAmountOut() { return amountOut; }
        public BigDecimal getPriceImpact() { return priceImpact; }
        public BigDecimal getFee() { return fee; }
    }
    
    public static class SwapHop {
        private String poolId;
        private String tokenIn;
        private String tokenOut;
        private BigDecimal amountIn;
        private BigDecimal amountOut;
        private BigDecimal fee;
        
        public SwapHop(String poolId, String tokenIn, String tokenOut, 
                       BigDecimal amountIn, BigDecimal amountOut, BigDecimal fee) {
            this.poolId = poolId;
            this.tokenIn = tokenIn;
            this.tokenOut = tokenOut;
            this.amountIn = amountIn;
            this.amountOut = amountOut;
            this.fee = fee;
        }
        
        // Getters
        public String getPoolId() { return poolId; }
        public String getTokenIn() { return tokenIn; }
        public String getTokenOut() { return tokenOut; }
        public BigDecimal getAmountIn() { return amountIn; }
        public BigDecimal getAmountOut() { return amountOut; }
        public BigDecimal getFee() { return fee; }
    }
}