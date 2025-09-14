package io.aurigraph.v11.contracts.rwa;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;
import org.bouncycastle.crypto.digests.SHA3Digest;
import org.bouncycastle.util.encoders.Hex;

/**
 * High-performance RWA (Real World Asset) Tokenizer for Aurigraph V11
 * Creates wAUR tokens backed by real-world assets with digital twins
 * Features: Oracle integration, AI valuation, quantum-safe security
 */
@ApplicationScoped
public class RWATokenizer {

    @Inject
    AssetValuationService valuationService;

    @Inject
    OracleService oracleService;

    @Inject
    DigitalTwinService digitalTwinService;

    // High-performance token registry
    private final Map<String, RWAToken> tokenRegistry = new ConcurrentHashMap<>();
    private final Map<String, AssetDigitalTwin> digitalTwins = new ConcurrentHashMap<>();
    private final AtomicLong tokenCounter = new AtomicLong(0);
    
    // Performance metrics
    private final AtomicLong totalTokensCreated = new AtomicLong(0);
    private final AtomicLong totalValueTokenized = new AtomicLong(0);

    /**
     * Tokenize a real-world asset into wAUR tokens
     */
    public Uni<RWATokenizationResult> tokenizeAsset(RWATokenizationRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            Log.infof("Tokenizing RWA: %s of type %s", request.getAssetId(), request.getAssetType());
            
            // Generate unique token ID
            String tokenId = generateTokenId(request);
            
            // Create digital twin for the asset
            AssetDigitalTwin digitalTwin = createDigitalTwin(request);
            digitalTwins.put(tokenId, digitalTwin);
            
            // Get real-time asset valuation
            BigDecimal assetValue = getAssetValuation(request);
            
            // Calculate token supply based on asset value and fraction
            BigDecimal tokenSupply = calculateTokenSupply(assetValue, request.getFractionSize());
            
            // Create RWA token
            RWAToken token = RWAToken.builder()
                .tokenId(tokenId)
                .assetId(request.getAssetId())
                .assetType(request.getAssetType())
                .assetValue(assetValue)
                .tokenSupply(tokenSupply)
                .ownerAddress(request.getOwnerAddress())
                .digitalTwinId(digitalTwin.getTwinId())
                .metadata(request.getMetadata())
                .createdAt(Instant.now())
                .status(TokenStatus.ACTIVE)
                .quantumSafe(true)
                .build();
            
            // Store in registry
            tokenRegistry.put(tokenId, token);
            
            // Update metrics
            totalTokensCreated.incrementAndGet();
            totalValueTokenized.addAndGet(assetValue.longValue());
            
            long endTime = System.nanoTime();
            
            RWATokenizationResult result = new RWATokenizationResult(
                token, digitalTwin, true, 
                "Asset successfully tokenized", endTime - startTime
            );
            
            Log.infof("Successfully tokenized asset %s into token %s with value $%s in %d ns", 
                request.getAssetId(), tokenId, assetValue, endTime - startTime);
            
            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Transfer RWA token ownership
     */
    public Uni<Boolean> transferToken(String tokenId, String fromAddress, String toAddress, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            RWAToken token = tokenRegistry.get(tokenId);
            if (token == null) {
                throw new TokenNotFoundException("Token not found: " + tokenId);
            }
            
            // Validate ownership
            if (!fromAddress.equals(token.getOwnerAddress())) {
                throw new UnauthorizedTransferException("Unauthorized transfer attempt");
            }
            
            // For simplicity, transfer full ownership (fractional transfers in future sprint)
            if (amount.compareTo(token.getTokenSupply()) != 0) {
                throw new IllegalArgumentException("Partial transfers not yet supported");
            }
            
            // Update ownership
            token.setOwnerAddress(toAddress);
            token.setLastTransferAt(Instant.now());
            
            // Record transfer in digital twin
            AssetDigitalTwin digitalTwin = digitalTwins.get(tokenId);
            if (digitalTwin != null) {
                digitalTwin.recordOwnershipChange(fromAddress, toAddress, amount);
            }
            
            Log.infof("Token %s transferred from %s to %s", tokenId, fromAddress, toAddress);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get token by ID
     */
    public Uni<RWAToken> getToken(String tokenId) {
        return Uni.createFrom().item(() -> tokenRegistry.get(tokenId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get digital twin for a token
     */
    public Uni<AssetDigitalTwin> getDigitalTwin(String tokenId) {
        return Uni.createFrom().item(() -> digitalTwins.get(tokenId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get tokens by asset type
     */
    public Uni<List<RWAToken>> getTokensByType(String assetType) {
        return Uni.createFrom().item(() -> {
            return tokenRegistry.values().stream()
                .filter(token -> assetType.equals(token.getAssetType()))
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get tokens by owner
     */
    public Uni<List<RWAToken>> getTokensByOwner(String ownerAddress) {
        return Uni.createFrom().item(() -> {
            return tokenRegistry.values().stream()
                .filter(token -> ownerAddress.equals(token.getOwnerAddress()))
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update asset valuation (called by oracles)
     */
    public Uni<Boolean> updateValuation(String tokenId, BigDecimal newValue, String oracleSource) {
        return Uni.createFrom().item(() -> {
            RWAToken token = tokenRegistry.get(tokenId);
            if (token == null) {
                return false;
            }
            
            BigDecimal oldValue = token.getAssetValue();
            token.setAssetValue(newValue);
            token.setLastValuationUpdate(Instant.now());
            
            // Update digital twin with valuation history
            AssetDigitalTwin digitalTwin = digitalTwins.get(tokenId);
            if (digitalTwin != null) {
                digitalTwin.recordValuationUpdate(oldValue, newValue, oracleSource);
            }
            
            Log.infof("Updated valuation for token %s from $%s to $%s (source: %s)", 
                tokenId, oldValue, newValue, oracleSource);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get tokenizer statistics
     */
    public Uni<TokenizerStats> getStats() {
        return Uni.createFrom().item(() -> {
            Map<String, Long> typeDistribution = new HashMap<>();
            BigDecimal totalValue = BigDecimal.ZERO;
            
            for (RWAToken token : tokenRegistry.values()) {
                String type = token.getAssetType();
                typeDistribution.merge(type, 1L, Long::sum);
                totalValue = totalValue.add(token.getAssetValue());
            }
            
            return new TokenizerStats(
                tokenRegistry.size(),
                totalValue,
                typeDistribution,
                digitalTwins.size(),
                totalTokensCreated.get(),
                totalValueTokenized.get()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Burn tokens (destroy asset-backed tokens)
     */
    public Uni<Boolean> burnToken(String tokenId, String ownerAddress) {
        return Uni.createFrom().item(() -> {
            RWAToken token = tokenRegistry.get(tokenId);
            if (token == null) {
                throw new TokenNotFoundException("Token not found: " + tokenId);
            }
            
            if (!ownerAddress.equals(token.getOwnerAddress())) {
                throw new UnauthorizedTransferException("Only owner can burn token");
            }
            
            // Mark token as burned
            token.setStatus(TokenStatus.BURNED);
            token.setBurnedAt(Instant.now());
            
            // Update digital twin
            AssetDigitalTwin digitalTwin = digitalTwins.get(tokenId);
            if (digitalTwin != null) {
                digitalTwin.recordBurn(ownerAddress);
            }
            
            Log.infof("Token %s burned by owner %s", tokenId, ownerAddress);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods
    
    private String generateTokenId(RWATokenizationRequest request) {
        SHA3Digest digest = new SHA3Digest(256);
        String input = request.getAssetId() + request.getAssetType() + 
                      System.nanoTime() + tokenCounter.incrementAndGet();
        byte[] inputBytes = input.getBytes();
        digest.update(inputBytes, 0, inputBytes.length);
        byte[] hash = new byte[32];
        digest.doFinal(hash, 0);
        return "wAUR-" + Hex.toHexString(hash).substring(0, 16).toUpperCase();
    }
    
    private AssetDigitalTwin createDigitalTwin(RWATokenizationRequest request) {
        return digitalTwinService.createDigitalTwin(
            request.getAssetId(),
            request.getAssetType(),
            request.getMetadata()
        );
    }
    
    private BigDecimal getAssetValuation(RWATokenizationRequest request) {
        // Use AI-driven valuation service
        return valuationService.getAssetValuation(
            request.getAssetType(),
            request.getAssetId(),
            request.getMetadata()
        );
    }
    
    private BigDecimal calculateTokenSupply(BigDecimal assetValue, BigDecimal fractionSize) {
        if (fractionSize == null || fractionSize.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ONE; // Single token for entire asset
        }
        return assetValue.divide(fractionSize, java.math.RoundingMode.UP);
    }

    // Exception classes
    public static class TokenNotFoundException extends RuntimeException {
        public TokenNotFoundException(String message) { super(message); }
    }
    
    public static class UnauthorizedTransferException extends RuntimeException {
        public UnauthorizedTransferException(String message) { super(message); }
    }
}

/**
 * RWA Tokenization Request
 */
class RWATokenizationRequest {
    private String assetId;
    private String assetType; // CARBON_CREDIT, REAL_ESTATE, FINANCIAL, etc.
    private String ownerAddress;
    private BigDecimal fractionSize; // For fractional ownership
    private Map<String, Object> metadata;
    private List<String> certifications; // Asset certifications/verifications
    private String oracleSource; // Preferred oracle for valuation

    // Getters and setters
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    
    public BigDecimal getFractionSize() { return fractionSize; }
    public void setFractionSize(BigDecimal fractionSize) { this.fractionSize = fractionSize; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public List<String> getCertifications() { return certifications; }
    public void setCertifications(List<String> certifications) { this.certifications = certifications; }
    
    public String getOracleSource() { return oracleSource; }
    public void setOracleSource(String oracleSource) { this.oracleSource = oracleSource; }
}

/**
 * RWA Tokenization Result
 */
class RWATokenizationResult {
    private final RWAToken token;
    private final AssetDigitalTwin digitalTwin;
    private final boolean success;
    private final String message;
    private final long processingTime;

    public RWATokenizationResult(RWAToken token, AssetDigitalTwin digitalTwin, 
                                boolean success, String message, long processingTime) {
        this.token = token;
        this.digitalTwin = digitalTwin;
        this.success = success;
        this.message = message;
        this.processingTime = processingTime;
    }

    // Getters
    public RWAToken getToken() { return token; }
    public AssetDigitalTwin getDigitalTwin() { return digitalTwin; }
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public long getProcessingTime() { return processingTime; }
}

/**
 * Tokenizer Statistics
 */
class TokenizerStats {
    private final int totalTokens;
    private final BigDecimal totalValue;
    private final Map<String, Long> typeDistribution;
    private final int digitalTwins;
    private final long totalTokensCreated;
    private final long totalValueTokenized;

    public TokenizerStats(int totalTokens, BigDecimal totalValue, 
                         Map<String, Long> typeDistribution, int digitalTwins,
                         long totalTokensCreated, long totalValueTokenized) {
        this.totalTokens = totalTokens;
        this.totalValue = totalValue;
        this.typeDistribution = typeDistribution;
        this.digitalTwins = digitalTwins;
        this.totalTokensCreated = totalTokensCreated;
        this.totalValueTokenized = totalValueTokenized;
    }

    // Getters
    public int getTotalTokens() { return totalTokens; }
    public BigDecimal getTotalValue() { return totalValue; }
    public Map<String, Long> getTypeDistribution() { return typeDistribution; }
    public int getDigitalTwins() { return digitalTwins; }
    public long getTotalTokensCreated() { return totalTokensCreated; }
    public long getTotalValueTokenized() { return totalValueTokenized; }
}