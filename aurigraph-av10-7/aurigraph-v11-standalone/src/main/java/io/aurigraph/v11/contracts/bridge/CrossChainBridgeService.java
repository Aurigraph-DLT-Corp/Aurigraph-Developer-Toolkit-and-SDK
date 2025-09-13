package io.aurigraph.v11.contracts.bridge;

import io.aurigraph.v11.contracts.composite.*;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;
import io.quarkus.scheduler.Scheduled;

/**
 * Cross-Chain Bridge Service for Composite Tokens
 * Implements LayerZero protocol for atomic cross-chain transfers
 * Sprint 10 - AV11-408 Implementation
 */
@ApplicationScoped
public class CrossChainBridgeService {

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    // Bridge state management
    private final Map<String, BridgeTransaction> activeBridgeTransactions = new ConcurrentHashMap<>();
    private final Map<String, ChainConfig> supportedChains = new ConcurrentHashMap<>();
    private final Map<String, BridgeLiquidity> liquidityPools = new ConcurrentHashMap<>();
    private final AtomicLong bridgeTransactionCounter = new AtomicLong(0);
    
    // LayerZero configuration
    private final String layerZeroEndpoint = "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675"; // Mainnet endpoint
    private final Map<String, Integer> chainIds = initializeChainIds();

    public CrossChainBridgeService() {
        initializeSupportedChains();
    }

    /**
     * Bridge composite token to another chain
     */
    public Uni<BridgeResult> bridgeCompositeToken(BridgeRequest request) {
        return Uni.createFrom().item(() -> {
            String bridgeId = generateBridgeId(request);
            
            Log.infof("Initiating bridge transaction %s from %s to %s", 
                bridgeId, request.getSourceChain(), request.getDestinationChain());
            
            // Validate request
            if (!validateBridgeRequest(request)) {
                throw new InvalidBridgeRequestException("Invalid bridge request parameters");
            }
            
            // Check liquidity on destination chain
            if (!checkLiquidity(request.getDestinationChain(), request.getAmount())) {
                throw new InsufficientLiquidityException("Insufficient liquidity on destination chain");
            }
            
            // Create bridge transaction
            BridgeTransaction transaction = new BridgeTransaction(
                bridgeId,
                request.getCompositeId(),
                request.getSourceChain(),
                request.getDestinationChain(),
                request.getFromAddress(),
                request.getToAddress(),
                request.getAmount(),
                BridgeStatus.INITIATED,
                Instant.now()
            );
            
            activeBridgeTransactions.put(bridgeId, transaction);
            
            // Lock tokens on source chain
            lockTokensOnSource(transaction);
            
            // Initiate LayerZero message
            initiateLayerZeroTransfer(transaction);
            
            // Calculate fees
            BridgeFees fees = calculateBridgeFees(request);
            
            return new BridgeResult(
                bridgeId,
                true,
                "Bridge transaction initiated",
                fees,
                getEstimatedTime(request.getSourceChain(), request.getDestinationChain())
            );
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete bridge transaction on destination chain
     */
    public Uni<Boolean> completeBridgeTransaction(String bridgeId, String proof) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction transaction = activeBridgeTransactions.get(bridgeId);
            
            if (transaction == null) {
                throw new IllegalArgumentException("Bridge transaction not found: " + bridgeId);
            }
            
            // Verify LayerZero proof
            if (!verifyLayerZeroProof(proof, transaction)) {
                throw new InvalidProofException("Invalid LayerZero proof");
            }
            
            // Mint tokens on destination chain
            mintTokensOnDestination(transaction);
            
            // Update transaction status
            transaction.setStatus(BridgeStatus.COMPLETED);
            transaction.setCompletedAt(Instant.now());
            
            // Update liquidity pools
            updateLiquidityPools(transaction);
            
            Log.infof("Bridge transaction %s completed successfully", bridgeId);
            
            return true;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get bridge transaction status
     */
    public Uni<BridgeTransaction> getBridgeStatus(String bridgeId) {
        return Uni.createFrom().item(() -> activeBridgeTransactions.get(bridgeId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get supported chains
     */
    public Uni<List<ChainConfig>> getSupportedChains() {
        return Uni.createFrom().item(() -> new ArrayList<>(supportedChains.values()))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add liquidity to bridge pool
     */
    public Uni<LiquidityResult> addLiquidity(LiquidityRequest request) {
        return Uni.createFrom().item(() -> {
            String poolId = request.getChain() + "-POOL";
            
            BridgeLiquidity pool = liquidityPools.computeIfAbsent(poolId, 
                k -> new BridgeLiquidity(poolId, request.getChain()));
            
            pool.addLiquidity(request.getProvider(), request.getAmount());
            
            // Calculate LP tokens
            BigDecimal lpTokens = calculateLPTokens(request.getAmount(), pool);
            
            return new LiquidityResult(
                poolId,
                lpTokens,
                pool.getTotalLiquidity(),
                pool.getUtilization()
            );
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove liquidity from bridge pool
     */
    public Uni<LiquidityResult> removeLiquidity(LiquidityRequest request) {
        return Uni.createFrom().item(() -> {
            String poolId = request.getChain() + "-POOL";
            BridgeLiquidity pool = liquidityPools.get(poolId);
            
            if (pool == null) {
                throw new IllegalArgumentException("Liquidity pool not found");
            }
            
            BigDecimal removed = pool.removeLiquidity(request.getProvider(), request.getAmount());
            
            return new LiquidityResult(
                poolId,
                removed.negate(),
                pool.getTotalLiquidity(),
                pool.getUtilization()
            );
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get bridge statistics
     */
    public Uni<BridgeStats> getBridgeStats() {
        return Uni.createFrom().item(() -> {
            Map<String, Integer> transactionsByChain = new HashMap<>();
            Map<BridgeStatus, Integer> statusDistribution = new HashMap<>();
            BigDecimal totalVolume = BigDecimal.ZERO;
            
            for (BridgeTransaction tx : activeBridgeTransactions.values()) {
                // Count by destination chain
                transactionsByChain.merge(tx.getDestinationChain(), 1, Integer::sum);
                
                // Count by status
                statusDistribution.merge(tx.getStatus(), 1, Integer::sum);
                
                // Sum volume
                if (tx.getAmount() != null) {
                    totalVolume = totalVolume.add(tx.getAmount());
                }
            }
            
            return new BridgeStats(
                activeBridgeTransactions.size(),
                transactionsByChain,
                statusDistribution,
                totalVolume,
                supportedChains.size(),
                calculateTotalLiquidity()
            );
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Emergency pause bridge operations
     */
    public Uni<Boolean> pauseBridge(String reason) {
        return Uni.createFrom().item(() -> {
            Log.warnf("Bridge operations paused: %s", reason);
            
            // Mark all chains as paused
            for (ChainConfig chain : supportedChains.values()) {
                chain.setPaused(true);
            }
            
            // Cancel pending transactions
            for (BridgeTransaction tx : activeBridgeTransactions.values()) {
                if (tx.getStatus() == BridgeStatus.INITIATED || 
                    tx.getStatus() == BridgeStatus.PENDING) {
                    tx.setStatus(BridgeStatus.CANCELLED);
                }
            }
            
            return true;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Resume bridge operations
     */
    public Uni<Boolean> resumeBridge() {
        return Uni.createFrom().item(() -> {
            Log.infof("Bridge operations resumed");
            
            for (ChainConfig chain : supportedChains.values()) {
                chain.setPaused(false);
            }
            
            return true;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Scheduled task to check pending transactions
     */
    @Scheduled(every = "30s")
    void checkPendingTransactions() {
        for (BridgeTransaction tx : activeBridgeTransactions.values()) {
            if (tx.getStatus() == BridgeStatus.PENDING) {
                // Check if transaction has timed out
                if (tx.getInitiatedAt().isBefore(Instant.now().minusSeconds(600))) { // 10 minutes
                    tx.setStatus(BridgeStatus.TIMEOUT);
                    Log.warnf("Bridge transaction %s timed out", tx.getBridgeId());
                }
            }
        }
    }

    // Private helper methods

    private void initializeSupportedChains() {
        // Ethereum Mainnet
        supportedChains.put("ETHEREUM", new ChainConfig(
            "ETHEREUM", 1, "Ethereum Mainnet", 
            "https://mainnet.infura.io/v3/", true, false
        ));
        
        // Polygon
        supportedChains.put("POLYGON", new ChainConfig(
            "POLYGON", 137, "Polygon Network",
            "https://polygon-rpc.com", true, false
        ));
        
        // Binance Smart Chain
        supportedChains.put("BSC", new ChainConfig(
            "BSC", 56, "Binance Smart Chain",
            "https://bsc-dataseed.binance.org", true, false
        ));
        
        // Avalanche
        supportedChains.put("AVALANCHE", new ChainConfig(
            "AVALANCHE", 43114, "Avalanche C-Chain",
            "https://api.avax.network/ext/bc/C/rpc", true, false
        ));
        
        // Arbitrum
        supportedChains.put("ARBITRUM", new ChainConfig(
            "ARBITRUM", 42161, "Arbitrum One",
            "https://arb1.arbitrum.io/rpc", true, false
        ));
    }

    private Map<String, Integer> initializeChainIds() {
        Map<String, Integer> ids = new HashMap<>();
        ids.put("ETHEREUM", 101);
        ids.put("POLYGON", 109);
        ids.put("BSC", 102);
        ids.put("AVALANCHE", 106);
        ids.put("ARBITRUM", 110);
        return ids;
    }

    private String generateBridgeId(BridgeRequest request) {
        return String.format("BRIDGE-%s-%s-%d",
            request.getSourceChain().substring(0, 3),
            request.getDestinationChain().substring(0, 3),
            bridgeTransactionCounter.incrementAndGet());
    }

    private boolean validateBridgeRequest(BridgeRequest request) {
        // Check if chains are supported
        if (!supportedChains.containsKey(request.getSourceChain()) ||
            !supportedChains.containsKey(request.getDestinationChain())) {
            return false;
        }
        
        // Check if chains are not paused
        ChainConfig sourceChain = supportedChains.get(request.getSourceChain());
        ChainConfig destChain = supportedChains.get(request.getDestinationChain());
        
        if (sourceChain.isPaused() || destChain.isPaused()) {
            return false;
        }
        
        // Validate addresses
        if (request.getFromAddress() == null || request.getToAddress() == null) {
            return false;
        }
        
        // Validate amount
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        
        return true;
    }

    private boolean checkLiquidity(String chain, BigDecimal amount) {
        String poolId = chain + "-POOL";
        BridgeLiquidity pool = liquidityPools.get(poolId);
        
        if (pool == null) {
            return false;
        }
        
        return pool.hasAvailableLiquidity(amount);
    }

    private void lockTokensOnSource(BridgeTransaction transaction) {
        // Lock tokens in bridge contract on source chain
        Log.infof("Locking tokens for bridge transaction %s", transaction.getBridgeId());
        transaction.setStatus(BridgeStatus.LOCKED);
    }

    private void initiateLayerZeroTransfer(BridgeTransaction transaction) {
        // Send LayerZero message to destination chain
        Log.infof("Initiating LayerZero transfer for %s", transaction.getBridgeId());
        transaction.setStatus(BridgeStatus.PENDING);
    }

    private boolean verifyLayerZeroProof(String proof, BridgeTransaction transaction) {
        // Verify LayerZero proof
        // In production, this would verify cryptographic proof from LayerZero
        return proof != null && proof.length() > 0;
    }

    private void mintTokensOnDestination(BridgeTransaction transaction) {
        // Mint equivalent tokens on destination chain
        Log.infof("Minting tokens on destination chain for %s", transaction.getBridgeId());
    }

    private void updateLiquidityPools(BridgeTransaction transaction) {
        // Update liquidity pools after successful bridge
        String sourcePoolId = transaction.getSourceChain() + "-POOL";
        String destPoolId = transaction.getDestinationChain() + "-POOL";
        
        BridgeLiquidity sourcePool = liquidityPools.get(sourcePoolId);
        BridgeLiquidity destPool = liquidityPools.get(destPoolId);
        
        if (sourcePool != null) {
            sourcePool.recordOutflow(transaction.getAmount());
        }
        
        if (destPool != null) {
            destPool.recordInflow(transaction.getAmount());
        }
    }

    private BridgeFees calculateBridgeFees(BridgeRequest request) {
        BigDecimal baseFee = BigDecimal.valueOf(0.001); // 0.1% base fee
        BigDecimal gasEstimate = estimateGasCost(request.getSourceChain(), request.getDestinationChain());
        BigDecimal layerZeroFee = BigDecimal.valueOf(0.0005); // 0.05% LayerZero fee
        
        BigDecimal totalFee = request.getAmount()
            .multiply(baseFee.add(layerZeroFee))
            .add(gasEstimate);
        
        return new BridgeFees(baseFee, gasEstimate, layerZeroFee, totalFee);
    }

    private BigDecimal estimateGasCost(String sourceChain, String destChain) {
        // Estimate gas cost based on chain pair
        Map<String, BigDecimal> gasPrices = Map.of(
            "ETHEREUM", BigDecimal.valueOf(50),
            "POLYGON", BigDecimal.valueOf(0.1),
            "BSC", BigDecimal.valueOf(5),
            "AVALANCHE", BigDecimal.valueOf(25),
            "ARBITRUM", BigDecimal.valueOf(1)
        );
        
        BigDecimal sourceGas = gasPrices.getOrDefault(sourceChain, BigDecimal.TEN);
        BigDecimal destGas = gasPrices.getOrDefault(destChain, BigDecimal.TEN);
        
        return sourceGas.add(destGas);
    }

    private long getEstimatedTime(String sourceChain, String destChain) {
        // Estimate time in seconds based on chain finality
        Map<String, Long> finalityTimes = Map.of(
            "ETHEREUM", 900L, // 15 minutes
            "POLYGON", 120L,  // 2 minutes
            "BSC", 45L,       // 45 seconds
            "AVALANCHE", 60L, // 1 minute
            "ARBITRUM", 60L   // 1 minute
        );
        
        Long sourceTime = finalityTimes.getOrDefault(sourceChain, 300L);
        Long destTime = finalityTimes.getOrDefault(destChain, 300L);
        
        return sourceTime + destTime + 60; // Add 1 minute for LayerZero processing
    }

    private BigDecimal calculateLPTokens(BigDecimal amount, BridgeLiquidity pool) {
        if (pool.getTotalLiquidity().equals(BigDecimal.ZERO)) {
            return amount; // First liquidity provider gets 1:1
        }
        
        // Calculate proportional LP tokens
        BigDecimal totalSupply = pool.getTotalLPTokens();
        BigDecimal poolValue = pool.getTotalLiquidity();
        
        return amount.multiply(totalSupply).divide(poolValue, 6, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalLiquidity() {
        return liquidityPools.values().stream()
            .map(BridgeLiquidity::getTotalLiquidity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Exception classes
    public static class InvalidBridgeRequestException extends RuntimeException {
        public InvalidBridgeRequestException(String message) { super(message); }
    }
    
    public static class InsufficientLiquidityException extends RuntimeException {
        public InsufficientLiquidityException(String message) { super(message); }
    }
    
    public static class InvalidProofException extends RuntimeException {
        public InvalidProofException(String message) { super(message); }
    }
}

// Supporting classes

class BridgeRequest {
    private String compositeId;
    private String sourceChain;
    private String destinationChain;
    private String fromAddress;
    private String toAddress;
    private BigDecimal amount;
    private Map<String, Object> metadata;

    // Getters and setters
    public String getCompositeId() { return compositeId; }
    public void setCompositeId(String compositeId) { this.compositeId = compositeId; }
    
    public String getSourceChain() { return sourceChain; }
    public void setSourceChain(String sourceChain) { this.sourceChain = sourceChain; }
    
    public String getDestinationChain() { return destinationChain; }
    public void setDestinationChain(String destinationChain) { this.destinationChain = destinationChain; }
    
    public String getFromAddress() { return fromAddress; }
    public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }
    
    public String getToAddress() { return toAddress; }
    public void setToAddress(String toAddress) { this.toAddress = toAddress; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}

class BridgeTransaction {
    private final String bridgeId;
    private final String compositeId;
    private final String sourceChain;
    private final String destinationChain;
    private final String fromAddress;
    private final String toAddress;
    private final BigDecimal amount;
    private BridgeStatus status;
    private final Instant initiatedAt;
    private Instant completedAt;

    public BridgeTransaction(String bridgeId, String compositeId, String sourceChain,
                           String destinationChain, String fromAddress, String toAddress,
                           BigDecimal amount, BridgeStatus status, Instant initiatedAt) {
        this.bridgeId = bridgeId;
        this.compositeId = compositeId;
        this.sourceChain = sourceChain;
        this.destinationChain = destinationChain;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.status = status;
        this.initiatedAt = initiatedAt;
    }

    // Getters and setters
    public String getBridgeId() { return bridgeId; }
    public String getCompositeId() { return compositeId; }
    public String getSourceChain() { return sourceChain; }
    public String getDestinationChain() { return destinationChain; }
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public BigDecimal getAmount() { return amount; }
    
    public BridgeStatus getStatus() { return status; }
    public void setStatus(BridgeStatus status) { this.status = status; }
    
    public Instant getInitiatedAt() { return initiatedAt; }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}

class BridgeResult {
    private final String bridgeId;
    private final boolean success;
    private final String message;
    private final BridgeFees fees;
    private final long estimatedTime;

    public BridgeResult(String bridgeId, boolean success, String message, 
                       BridgeFees fees, long estimatedTime) {
        this.bridgeId = bridgeId;
        this.success = success;
        this.message = message;
        this.fees = fees;
        this.estimatedTime = estimatedTime;
    }

    // Getters
    public String getBridgeId() { return bridgeId; }
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public BridgeFees getFees() { return fees; }
    public long getEstimatedTime() { return estimatedTime; }
}

class BridgeFees {
    private final BigDecimal baseFee;
    private final BigDecimal gasCost;
    private final BigDecimal layerZeroFee;
    private final BigDecimal totalFee;

    public BridgeFees(BigDecimal baseFee, BigDecimal gasCost, 
                     BigDecimal layerZeroFee, BigDecimal totalFee) {
        this.baseFee = baseFee;
        this.gasCost = gasCost;
        this.layerZeroFee = layerZeroFee;
        this.totalFee = totalFee;
    }

    // Getters
    public BigDecimal getBaseFee() { return baseFee; }
    public BigDecimal getGasCost() { return gasCost; }
    public BigDecimal getLayerZeroFee() { return layerZeroFee; }
    public BigDecimal getTotalFee() { return totalFee; }
}

class ChainConfig {
    private final String name;
    private final int chainId;
    private final String displayName;
    private final String rpcEndpoint;
    private boolean enabled;
    private boolean paused;

    public ChainConfig(String name, int chainId, String displayName, 
                      String rpcEndpoint, boolean enabled, boolean paused) {
        this.name = name;
        this.chainId = chainId;
        this.displayName = displayName;
        this.rpcEndpoint = rpcEndpoint;
        this.enabled = enabled;
        this.paused = paused;
    }

    // Getters and setters
    public String getName() { return name; }
    public int getChainId() { return chainId; }
    public String getDisplayName() { return displayName; }
    public String getRpcEndpoint() { return rpcEndpoint; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isPaused() { return paused; }
    public void setPaused(boolean paused) { this.paused = paused; }
}

class BridgeLiquidity {
    private final String poolId;
    private final String chain;
    private BigDecimal totalLiquidity;
    private BigDecimal availableLiquidity;
    private BigDecimal totalLPTokens;
    private final Map<String, BigDecimal> providerBalances;
    private BigDecimal utilization;

    public BridgeLiquidity(String poolId, String chain) {
        this.poolId = poolId;
        this.chain = chain;
        this.totalLiquidity = BigDecimal.ZERO;
        this.availableLiquidity = BigDecimal.ZERO;
        this.totalLPTokens = BigDecimal.ZERO;
        this.providerBalances = new HashMap<>();
        this.utilization = BigDecimal.ZERO;
    }

    public void addLiquidity(String provider, BigDecimal amount) {
        totalLiquidity = totalLiquidity.add(amount);
        availableLiquidity = availableLiquidity.add(amount);
        providerBalances.merge(provider, amount, BigDecimal::add);
        updateUtilization();
    }

    public BigDecimal removeLiquidity(String provider, BigDecimal amount) {
        BigDecimal balance = providerBalances.getOrDefault(provider, BigDecimal.ZERO);
        BigDecimal toRemove = amount.min(balance);
        
        totalLiquidity = totalLiquidity.subtract(toRemove);
        availableLiquidity = availableLiquidity.subtract(toRemove);
        providerBalances.put(provider, balance.subtract(toRemove));
        updateUtilization();
        
        return toRemove;
    }

    public boolean hasAvailableLiquidity(BigDecimal amount) {
        return availableLiquidity.compareTo(amount) >= 0;
    }

    public void recordOutflow(BigDecimal amount) {
        availableLiquidity = availableLiquidity.subtract(amount);
        updateUtilization();
    }

    public void recordInflow(BigDecimal amount) {
        availableLiquidity = availableLiquidity.add(amount);
        updateUtilization();
    }

    private void updateUtilization() {
        if (totalLiquidity.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal used = totalLiquidity.subtract(availableLiquidity);
            utilization = used.divide(totalLiquidity, 4, java.math.RoundingMode.HALF_UP)
                             .multiply(BigDecimal.valueOf(100));
        } else {
            utilization = BigDecimal.ZERO;
        }
    }

    // Getters
    public String getPoolId() { return poolId; }
    public String getChain() { return chain; }
    public BigDecimal getTotalLiquidity() { return totalLiquidity; }
    public BigDecimal getAvailableLiquidity() { return availableLiquidity; }
    public BigDecimal getTotalLPTokens() { return totalLPTokens; }
    public Map<String, BigDecimal> getProviderBalances() { return new HashMap<>(providerBalances); }
    public BigDecimal getUtilization() { return utilization; }
}

class LiquidityRequest {
    private String chain;
    private String provider;
    private BigDecimal amount;

    // Getters and setters
    public String getChain() { return chain; }
    public void setChain(String chain) { this.chain = chain; }
    
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}

class LiquidityResult {
    private final String poolId;
    private final BigDecimal lpTokens;
    private final BigDecimal totalLiquidity;
    private final BigDecimal utilization;

    public LiquidityResult(String poolId, BigDecimal lpTokens, 
                          BigDecimal totalLiquidity, BigDecimal utilization) {
        this.poolId = poolId;
        this.lpTokens = lpTokens;
        this.totalLiquidity = totalLiquidity;
        this.utilization = utilization;
    }

    // Getters
    public String getPoolId() { return poolId; }
    public BigDecimal getLpTokens() { return lpTokens; }
    public BigDecimal getTotalLiquidity() { return totalLiquidity; }
    public BigDecimal getUtilization() { return utilization; }
}

class BridgeStats {
    private final int totalTransactions;
    private final Map<String, Integer> transactionsByChain;
    private final Map<BridgeStatus, Integer> statusDistribution;
    private final BigDecimal totalVolume;
    private final int supportedChains;
    private final BigDecimal totalLiquidity;

    public BridgeStats(int totalTransactions, Map<String, Integer> transactionsByChain,
                      Map<BridgeStatus, Integer> statusDistribution, BigDecimal totalVolume,
                      int supportedChains, BigDecimal totalLiquidity) {
        this.totalTransactions = totalTransactions;
        this.transactionsByChain = transactionsByChain;
        this.statusDistribution = statusDistribution;
        this.totalVolume = totalVolume;
        this.supportedChains = supportedChains;
        this.totalLiquidity = totalLiquidity;
    }

    // Getters
    public int getTotalTransactions() { return totalTransactions; }
    public Map<String, Integer> getTransactionsByChain() { return transactionsByChain; }
    public Map<BridgeStatus, Integer> getStatusDistribution() { return statusDistribution; }
    public BigDecimal getTotalVolume() { return totalVolume; }
    public int getSupportedChains() { return supportedChains; }
    public BigDecimal getTotalLiquidity() { return totalLiquidity; }
}

enum BridgeStatus {
    INITIATED,    // Bridge request initiated
    LOCKED,       // Tokens locked on source chain
    PENDING,      // LayerZero message sent
    COMPLETED,    // Bridge completed successfully
    FAILED,       // Bridge failed
    CANCELLED,    // Bridge cancelled
    TIMEOUT       // Bridge timed out
}