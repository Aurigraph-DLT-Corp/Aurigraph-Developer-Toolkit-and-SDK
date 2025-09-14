package io.aurigraph.v11.pending.bridge;

import io.aurigraph.v11.pending.bridge.models.ChainInfo;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Bridge Token Registry
 * 
 * Manages token mappings across different blockchain networks for the
 * cross-chain bridge system. Maintains canonical token information,
 * cross-chain mappings, and validation rules.
 * 
 * Features:
 * - Cross-chain token mapping
 * - Token metadata management
 * - Transfer limits and validation
 * - Supported pairs configuration
 * - Token verification and whitelisting
 * - Dynamic token addition/removal
 * - Price feed integration (future)
 */
@ApplicationScoped
public class BridgeTokenRegistry {

    private static final Logger LOG = Logger.getLogger(BridgeTokenRegistry.class);

    @ConfigProperty(name = "aurigraph.bridge.token-registry.auto-discover", defaultValue = "false")
    boolean autoDiscoverTokens;

    @ConfigProperty(name = "aurigraph.bridge.token-registry.require-whitelist", defaultValue = "true")
    boolean requireWhitelist;

    @ConfigProperty(name = "aurigraph.bridge.token-registry.max-transfer-usd", defaultValue = "1000000")
    BigDecimal maxTransferUsd;

    // Token registry storage
    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();
    private final Map<TokenPair, BridgePairInfo> supportedPairs = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> chainTokens = new ConcurrentHashMap<>();

    public BridgeTokenRegistry() {
        initializeDefaultTokens();
    }

    /**
     * Register a new token in the registry
     */
    public Uni<Boolean> registerToken(TokenInfo tokenInfo) {
        return Uni.createFrom().item(() -> {
            try {
                // Validate token information
                if (!isValidTokenInfo(tokenInfo)) {
                    LOG.warnf("Invalid token information for %s", tokenInfo.symbol());
                    return false;
                }

                // Check if token already exists
                if (tokens.containsKey(tokenInfo.tokenId())) {
                    LOG.warnf("Token %s already registered", tokenInfo.symbol());
                    return false;
                }

                // Register token
                tokens.put(tokenInfo.tokenId(), tokenInfo);
                
                // Add to chain mapping
                chainTokens.computeIfAbsent(tokenInfo.chainId(), k -> ConcurrentHashMap.newKeySet())
                          .add(tokenInfo.tokenId());

                LOG.infof("Registered token %s (%s) on chain %s", 
                         tokenInfo.symbol(), tokenInfo.tokenId(), tokenInfo.chainId());
                return true;

            } catch (Exception e) {
                LOG.errorf("Error registering token: %s", e.getMessage());
                return false;
            }
        });
    }

    /**
     * Get token information by token ID
     */
    public Uni<Optional<TokenInfo>> getToken(String tokenId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(tokens.get(tokenId)));
    }

    /**
     * Find token by symbol and chain
     */
    public Uni<Optional<TokenInfo>> findToken(String symbol, String chainId) {
        return Uni.createFrom().item(() -> 
            tokens.values().stream()
                .filter(token -> token.symbol().equalsIgnoreCase(symbol) && 
                               token.chainId().equals(chainId))
                .findFirst()
        );
    }

    /**
     * Get all tokens supported on a specific chain
     */
    public Uni<List<TokenInfo>> getTokensOnChain(String chainId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = chainTokens.getOrDefault(chainId, Set.of());
            return tokenIds.stream()
                .map(tokens::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        });
    }

    /**
     * Add a supported bridge pair
     */
    public Uni<Boolean> addBridgePair(String sourceChain, String targetChain, 
                                     String sourceTokenId, String targetTokenId,
                                     BigDecimal minAmount, BigDecimal maxAmount, 
                                     BigDecimal bridgeFeePercentage) {
        return Uni.createFrom().item(() -> {
            try {
                TokenPair pair = new TokenPair(sourceChain, targetChain, sourceTokenId, targetTokenId);
                
                // Validate tokens exist
                TokenInfo sourceToken = tokens.get(sourceTokenId);
                TokenInfo targetToken = tokens.get(targetTokenId);
                
                if (sourceToken == null || targetToken == null) {
                    LOG.warnf("Cannot add bridge pair - tokens not found: %s -> %s", 
                             sourceTokenId, targetTokenId);
                    return false;
                }

                BridgePairInfo pairInfo = new BridgePairInfo(
                    pair, sourceToken, targetToken, minAmount, maxAmount,
                    bridgeFeePercentage, true, Instant.now()
                );

                supportedPairs.put(pair, pairInfo);

                LOG.infof("Added bridge pair: %s:%s -> %s:%s", 
                         sourceChain, sourceToken.symbol(), 
                         targetChain, targetToken.symbol());
                return true;

            } catch (Exception e) {
                LOG.errorf("Error adding bridge pair: %s", e.getMessage());
                return false;
            }
        });
    }

    /**
     * Check if a bridge pair is supported
     */
    public Uni<Optional<BridgePairInfo>> getBridgePair(String sourceChain, String targetChain,
                                                       String sourceTokenId, String targetTokenId) {
        return Uni.createFrom().item(() -> {
            TokenPair pair = new TokenPair(sourceChain, targetChain, sourceTokenId, targetTokenId);
            return Optional.ofNullable(supportedPairs.get(pair));
        });
    }

    /**
     * Get all supported bridge pairs
     */
    public Uni<List<BridgePairInfo>> getSupportedPairs() {
        return Uni.createFrom().item(() -> new ArrayList<>(supportedPairs.values()));
    }

    /**
     * Get supported pairs for a specific chain
     */
    public Uni<List<BridgePairInfo>> getSupportedPairsForChain(String chainId) {
        return Uni.createFrom().item(() -> 
            supportedPairs.values().stream()
                .filter(pair -> pair.tokenPair().sourceChain().equals(chainId) ||
                              pair.tokenPair().targetChain().equals(chainId))
                .collect(Collectors.toList())
        );
    }

    /**
     * Validate a bridge transfer
     */
    public Uni<ValidationResult> validateTransfer(String sourceChain, String targetChain,
                                                 String sourceTokenId, String targetTokenId,
                                                 BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            // Check if pair is supported
            TokenPair pair = new TokenPair(sourceChain, targetChain, sourceTokenId, targetTokenId);
            BridgePairInfo pairInfo = supportedPairs.get(pair);
            
            if (pairInfo == null) {
                return new ValidationResult(false, "Bridge pair not supported");
            }

            if (!pairInfo.isActive()) {
                return new ValidationResult(false, "Bridge pair is temporarily disabled");
            }

            // Check amount limits
            if (amount.compareTo(pairInfo.minAmount()) < 0) {
                return new ValidationResult(false, 
                    String.format("Amount %s is below minimum %s", amount, pairInfo.minAmount()));
            }

            if (amount.compareTo(pairInfo.maxAmount()) > 0) {
                return new ValidationResult(false, 
                    String.format("Amount %s exceeds maximum %s", amount, pairInfo.maxAmount()));
            }

            // Check token whitelisting
            if (requireWhitelist && !isWhitelisted(sourceTokenId)) {
                return new ValidationResult(false, "Source token is not whitelisted");
            }

            if (requireWhitelist && !isWhitelisted(targetTokenId)) {
                return new ValidationResult(false, "Target token is not whitelisted");
            }

            return new ValidationResult(true, "Transfer validation passed");
        });
    }

    /**
     * Calculate bridge fees for a transfer
     */
    public Uni<FeeCalculation> calculateFees(String sourceChain, String targetChain,
                                           String sourceTokenId, String targetTokenId,
                                           BigDecimal amount) {
        return getBridgePair(sourceChain, targetChain, sourceTokenId, targetTokenId)
            .map(pairOpt -> {
                if (pairOpt.isEmpty()) {
                    return new FeeCalculation(BigDecimal.ZERO, BigDecimal.ZERO, 
                                             BigDecimal.ZERO, "Bridge pair not supported");
                }

                BridgePairInfo pair = pairOpt.get();
                
                // Calculate bridge fee
                BigDecimal bridgeFee = amount.multiply(pair.bridgeFeePercentage())
                                           .divide(BigDecimal.valueOf(100));
                
                // Estimate gas fees (simplified)
                BigDecimal sourceFee = estimateChainFee(sourceChain, amount);
                BigDecimal targetFee = estimateChainFee(targetChain, amount);
                BigDecimal totalGasFee = sourceFee.add(targetFee);
                
                BigDecimal totalFee = bridgeFee.add(totalGasFee);
                
                return new FeeCalculation(bridgeFee, totalGasFee, totalFee, "Success");
            });
    }

    /**
     * Get registry statistics
     */
    public RegistryStats getStats() {
        int totalTokens = tokens.size();
        int totalPairs = supportedPairs.size();
        int activePairs = (int) supportedPairs.values().stream()
            .mapToLong(pair -> pair.isActive() ? 1 : 0)
            .sum();
        
        Map<String, Integer> tokensByChain = chainTokens.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue().size()
            ));

        return new RegistryStats(
            totalTokens, totalPairs, activePairs, tokensByChain,
            autoDiscoverTokens, requireWhitelist, System.currentTimeMillis()
        );
    }

    // Private helper methods

    private void initializeDefaultTokens() {
        LOG.info("Initializing default token registry...");

        // Ethereum tokens
        registerDefaultToken("ethereum", "ETH", "ETH", "0x0000000000000000000000000000000000000000", 18);
        registerDefaultToken("ethereum", "USDC", "USD Coin", "0xA0b86a33E6441c8C0D0a0be4A3CbFfE5CBDB9D5E", 6);
        registerDefaultToken("ethereum", "USDT", "Tether USD", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6);
        registerDefaultToken("ethereum", "DAI", "Dai Stablecoin", "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18);

        // Polygon tokens
        registerDefaultToken("polygon", "MATIC", "Polygon", "0x0000000000000000000000000000000000000000", 18);
        registerDefaultToken("polygon", "USDC", "USD Coin", "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", 6);
        registerDefaultToken("polygon", "USDT", "Tether USD", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", 6);

        // BSC tokens
        registerDefaultToken("bsc", "BNB", "Binance Coin", "0x0000000000000000000000000000000000000000", 18);
        registerDefaultToken("bsc", "BUSD", "Binance USD", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", 18);
        registerDefaultToken("bsc", "USDT", "Tether USD", "0x55d398326f99059fF775485246999027B3197955", 18);

        // Avalanche tokens
        registerDefaultToken("avalanche", "AVAX", "Avalanche", "0x0000000000000000000000000000000000000000", 18);
        registerDefaultToken("avalanche", "USDC", "USD Coin", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", 6);

        // Solana tokens
        registerDefaultToken("solana", "SOL", "Solana", "11111111111111111111111111111111", 9);
        registerDefaultToken("solana", "USDC", "USD Coin", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6);

        // Initialize default bridge pairs
        initializeDefaultPairs();

        LOG.infof("Token registry initialized with %d tokens and %d pairs", 
                 tokens.size(), supportedPairs.size());
    }

    private void registerDefaultToken(String chainId, String symbol, String name, 
                                    String contractAddress, int decimals) {
        String tokenId = chainId + ":" + symbol;
        TokenInfo token = new TokenInfo(
            tokenId, chainId, symbol, name, contractAddress, decimals,
            true, true, Instant.now(), Map.of()
        );
        tokens.put(tokenId, token);
        chainTokens.computeIfAbsent(chainId, k -> ConcurrentHashMap.newKeySet()).add(tokenId);
    }

    private void initializeDefaultPairs() {
        // USDC pairs
        addDefaultPair("ethereum", "polygon", "ethereum:USDC", "polygon:USDC");
        addDefaultPair("ethereum", "bsc", "ethereum:USDC", "bsc:USDT");
        addDefaultPair("polygon", "bsc", "polygon:USDC", "bsc:USDT");
        
        // Native token pairs
        addDefaultPair("ethereum", "bsc", "ethereum:ETH", "bsc:BNB");
        addDefaultPair("ethereum", "avalanche", "ethereum:ETH", "avalanche:AVAX");
        addDefaultPair("ethereum", "solana", "ethereum:ETH", "solana:SOL");
    }

    private void addDefaultPair(String sourceChain, String targetChain, 
                              String sourceTokenId, String targetTokenId) {
        TokenPair pair = new TokenPair(sourceChain, targetChain, sourceTokenId, targetTokenId);
        BridgePairInfo pairInfo = new BridgePairInfo(
            pair,
            tokens.get(sourceTokenId),
            tokens.get(targetTokenId),
            new BigDecimal("0.01"), // minAmount
            new BigDecimal("100000"), // maxAmount
            new BigDecimal("0.3"), // 0.3% bridge fee
            true,
            Instant.now()
        );
        supportedPairs.put(pair, pairInfo);
    }

    private boolean isValidTokenInfo(TokenInfo tokenInfo) {
        return tokenInfo != null &&
               tokenInfo.tokenId() != null && !tokenInfo.tokenId().trim().isEmpty() &&
               tokenInfo.chainId() != null && !tokenInfo.chainId().trim().isEmpty() &&
               tokenInfo.symbol() != null && !tokenInfo.symbol().trim().isEmpty() &&
               tokenInfo.decimals() >= 0 && tokenInfo.decimals() <= 18;
    }

    private boolean isWhitelisted(String tokenId) {
        // In a real implementation, this would check against a whitelist
        // For now, all registered tokens are considered whitelisted
        return tokens.containsKey(tokenId);
    }

    private BigDecimal estimateChainFee(String chainId, BigDecimal amount) {
        // Simplified fee estimation
        return switch (chainId) {
            case "ethereum" -> new BigDecimal("0.005"); // ~$15 at current prices
            case "polygon" -> new BigDecimal("0.001");  // ~$1
            case "bsc" -> new BigDecimal("0.002");      // ~$1.5
            case "avalanche" -> new BigDecimal("0.0015"); // ~$1.2
            case "solana" -> new BigDecimal("0.00001"); // ~$0.001
            default -> new BigDecimal("0.001");
        };
    }

    // Data classes

    public record TokenInfo(
        String tokenId,
        String chainId,
        String symbol,
        String name,
        String contractAddress,
        int decimals,
        boolean isActive,
        boolean isWhitelisted,
        Instant createdAt,
        Map<String, Object> metadata
    ) {}

    public record TokenPair(
        String sourceChain,
        String targetChain,
        String sourceTokenId,
        String targetTokenId
    ) {}

    public record BridgePairInfo(
        TokenPair tokenPair,
        TokenInfo sourceToken,
        TokenInfo targetToken,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        BigDecimal bridgeFeePercentage,
        boolean isActive,
        Instant createdAt
    ) {}

    public record ValidationResult(
        boolean isValid,
        String message
    ) {}

    public record FeeCalculation(
        BigDecimal bridgeFee,
        BigDecimal gasFee,
        BigDecimal totalFee,
        String message
    ) {}

    public record RegistryStats(
        int totalTokens,
        int totalPairs,
        int activePairs,
        Map<String, Integer> tokensByChain,
        boolean autoDiscoverEnabled,
        boolean whitelistRequired,
        long timestamp
    ) {}
}