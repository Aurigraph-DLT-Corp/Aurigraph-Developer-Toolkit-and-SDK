package io.aurigraph.v11.hms;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class HMSIntegrationService {
    
    private static final Logger LOG = Logger.getLogger(HMSIntegrationService.class);
    
    // Performance metrics
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);
    private final AtomicLong averageLatency = new AtomicLong(0);
    
    // Asset registry
    private final Map<String, RealWorldAsset> assetRegistry = new ConcurrentHashMap<>();
    
    public static class RealWorldAsset {
        public final String assetId;
        public final String assetType;
        public final String owner;
        public final BigDecimal value;
        public final Map<String, Object> metadata;
        public final Instant createdAt;
        public final String status;
        
        public RealWorldAsset(String assetId, String assetType, String owner, 
                            BigDecimal value, Map<String, Object> metadata) {
            this.assetId = assetId;
            this.assetType = assetType;
            this.owner = owner;
            this.value = value;
            this.metadata = metadata != null ? metadata : new HashMap<>();
            this.createdAt = Instant.now();
            this.status = "ACTIVE";
        }
    }
    
    public static class TokenizationRequest {
        public final String assetType;
        public final String owner;
        public final BigDecimal value;
        public final Map<String, Object> metadata;
        
        public TokenizationRequest(String assetType, String owner, 
                                  BigDecimal value, Map<String, Object> metadata) {
            this.assetType = assetType;
            this.owner = owner;
            this.value = value;
            this.metadata = metadata;
        }
    }
    
    public static class TokenizationResponse {
        public final String assetId;
        public final String tokenId;
        public final String status;
        public final Instant timestamp;
        
        public TokenizationResponse(String assetId, String tokenId, String status) {
            this.assetId = assetId;
            this.tokenId = tokenId;
            this.status = status;
            this.timestamp = Instant.now();
        }
    }
    
    public static class HMSStats {
        public final long totalAssets;
        public final long totalTransactions;
        public final long successfulTransactions;
        public final long failedTransactions;
        public final long averageLatency;
        public final BigDecimal totalValue;

        public HMSStats(long totalAssets, long totalTransactions,
                       long successfulTransactions, long failedTransactions,
                       long averageLatency, BigDecimal totalValue) {
            this.totalAssets = totalAssets;
            this.totalTransactions = totalTransactions;
            this.successfulTransactions = successfulTransactions;
            this.failedTransactions = failedTransactions;
            this.averageLatency = averageLatency;
            this.totalValue = totalValue;
        }
    }

    public static class HMSOrder {
        public final String orderId;
        public final String status;
        public final Instant timestamp;

        public HMSOrder(String orderId, String status) {
            this.orderId = orderId;
            this.status = status;
            this.timestamp = Instant.now();
        }
    }
    
    public Uni<TokenizationResponse> tokenizeAsset(TokenizationRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();
            totalTransactions.incrementAndGet();
            
            try {
                // Generate unique IDs
                String assetId = "HMS-" + UUID.randomUUID().toString();
                String tokenId = "TOKEN-" + UUID.randomUUID().toString();
                
                // Create and register asset
                RealWorldAsset asset = new RealWorldAsset(
                    assetId,
                    request.assetType,
                    request.owner,
                    request.value,
                    request.metadata
                );
                
                assetRegistry.put(assetId, asset);
                successfulTransactions.incrementAndGet();
                
                // Update latency
                long elapsed = System.currentTimeMillis() - startTime;
                updateAverageLatency(elapsed);
                
                LOG.infof("Successfully tokenized asset %s of type %s", assetId, request.assetType);
                
                return new TokenizationResponse(assetId, tokenId, "SUCCESS");
                
            } catch (Exception e) {
                failedTransactions.incrementAndGet();
                LOG.errorf(e, "Failed to tokenize asset");
                throw new RuntimeException("Tokenization failed", e);
            }
        });
    }
    
    public Uni<RealWorldAsset> getAsset(String assetId) {
        return Uni.createFrom().item(() -> {
            RealWorldAsset asset = assetRegistry.get(assetId);
            if (asset == null) {
                throw new NoSuchElementException("Asset not found: " + assetId);
            }
            return asset;
        });
    }
    
    public Uni<List<RealWorldAsset>> listAssets() {
        return Uni.createFrom().item(() -> new ArrayList<>(assetRegistry.values()));
    }
    
    public Uni<Boolean> transferAsset(String assetId, String newOwner) {
        return Uni.createFrom().item(() -> {
            RealWorldAsset asset = assetRegistry.get(assetId);
            if (asset == null) {
                return false;
            }
            
            // Create new asset with updated owner
            RealWorldAsset updatedAsset = new RealWorldAsset(
                asset.assetId,
                asset.assetType,
                newOwner,
                asset.value,
                asset.metadata
            );
            
            assetRegistry.put(assetId, updatedAsset);
            LOG.infof("Asset %s transferred to %s", assetId, newOwner);
            
            return true;
        });
    }
    
    public Uni<HMSStats> getStats() {
        return Uni.createFrom().item(() -> {
            BigDecimal totalValue = assetRegistry.values().stream()
                .map(asset -> asset.value)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            return new HMSStats(
                assetRegistry.size(),
                totalTransactions.get(),
                successfulTransactions.get(),
                failedTransactions.get(),
                averageLatency.get(),
                totalValue
            );
        });
    }
    
    private void updateAverageLatency(long newLatency) {
        long currentAvg = averageLatency.get();
        long txCount = successfulTransactions.get();
        if (txCount > 0) {
            long newAvg = ((currentAvg * (txCount - 1)) + newLatency) / txCount;
            averageLatency.set(newAvg);
        } else {
            averageLatency.set(newLatency);
        }
    }
    
    public Uni<Boolean> validateAsset(String assetId) {
        return Uni.createFrom().item(() -> {
            RealWorldAsset asset = assetRegistry.get(assetId);
            if (asset == null) {
                return false;
            }
            
            // Perform validation checks
            boolean isValid = asset.value != null && 
                            asset.value.compareTo(BigDecimal.ZERO) > 0 &&
                            asset.owner != null && !asset.owner.isEmpty() &&
                            "ACTIVE".equals(asset.status);
                            
            LOG.infof("Asset %s validation result: %s", assetId, isValid);
            return isValid;
        });
    }
}