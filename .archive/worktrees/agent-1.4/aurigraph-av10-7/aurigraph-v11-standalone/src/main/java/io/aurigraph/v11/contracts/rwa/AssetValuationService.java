package io.aurigraph.v11.contracts.rwa;

import jakarta.enterprise.context.ApplicationScoped;
import io.smallrye.mutiny.Uni;
import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.quarkus.logging.Log;

/**
 * AI-driven Asset Valuation Service for RWA tokens
 * Provides real-time asset valuations using multiple data sources and ML algorithms
 */
@ApplicationScoped
public class AssetValuationService {

    private final Map<String, BigDecimal> cachedValuations = new ConcurrentHashMap<>();
    private final Map<String, Long> lastUpdated = new ConcurrentHashMap<>();
    
    // Cache duration in milliseconds (5 minutes)
    private static final long CACHE_DURATION = 300_000;

    /**
     * Get asset valuation using AI-driven pricing models
     */
    public BigDecimal getAssetValuation(String assetType, String assetId, Map<String, Object> metadata) {
        String cacheKey = assetType + ":" + assetId;
        
        // Check cache first
        if (isCacheValid(cacheKey)) {
            Log.infof("Using cached valuation for asset %s", assetId);
            return cachedValuations.get(cacheKey);
        }

        // Calculate valuation based on asset type
        BigDecimal valuation = calculateValuation(assetType, assetId, metadata);
        
        // Cache the result
        cachedValuations.put(cacheKey, valuation);
        lastUpdated.put(cacheKey, System.currentTimeMillis());
        
        Log.infof("Calculated valuation for asset %s: $%s", assetId, valuation);
        return valuation;
    }

    /**
     * Get reactive asset valuation
     */
    public Uni<BigDecimal> getAssetValuationAsync(String assetType, String assetId, Map<String, Object> metadata) {
        return Uni.createFrom().item(() -> getAssetValuation(assetType, assetId, metadata))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update asset valuation from external oracle
     */
    public void updateValuation(String assetType, String assetId, BigDecimal newValuation, String source) {
        String cacheKey = assetType + ":" + assetId;
        cachedValuations.put(cacheKey, newValuation);
        lastUpdated.put(cacheKey, System.currentTimeMillis());
        
        Log.infof("Updated valuation for asset %s from source %s: $%s", assetId, source, newValuation);
    }

    private boolean isCacheValid(String cacheKey) {
        Long lastUpdate = lastUpdated.get(cacheKey);
        if (lastUpdate == null) {
            return false;
        }
        return (System.currentTimeMillis() - lastUpdate) < CACHE_DURATION;
    }

    private BigDecimal calculateValuation(String assetType, String assetId, Map<String, Object> metadata) {
        // Simulated AI-driven valuation logic - in production this would integrate with:
        // - External market data APIs
        // - Machine learning models
        // - Real estate valuation services
        // - Carbon credit exchanges
        // - Financial asset pricing models
        
        switch (assetType.toUpperCase()) {
            case "CARBON_CREDIT":
                return calculateCarbonCreditValuation(metadata);
            case "REAL_ESTATE":
                return calculateRealEstateValuation(metadata);
            case "FINANCIAL":
                return calculateFinancialAssetValuation(metadata);
            case "ARTWORK":
                return calculateArtworkValuation(metadata);
            case "COMMODITY":
                return calculateCommodityValuation(metadata);
            default:
                return calculateDefaultValuation(metadata);
        }
    }

    private BigDecimal calculateCarbonCreditValuation(Map<String, Object> metadata) {
        // Base price per ton of CO2
        BigDecimal basePrice = new BigDecimal("45.00");
        
        // Apply multipliers based on metadata
        if (metadata.containsKey("certificationLevel")) {
            String level = (String) metadata.get("certificationLevel");
            switch (level.toUpperCase()) {
                case "GOLD":
                    basePrice = basePrice.multiply(new BigDecimal("1.5"));
                    break;
                case "VERIFIED":
                    basePrice = basePrice.multiply(new BigDecimal("1.2"));
                    break;
            }
        }
        
        // Apply quantity if specified
        if (metadata.containsKey("quantity")) {
            Number quantity = (Number) metadata.get("quantity");
            basePrice = basePrice.multiply(new BigDecimal(quantity.toString()));
        }
        
        return basePrice;
    }

    private BigDecimal calculateRealEstateValuation(Map<String, Object> metadata) {
        BigDecimal baseValue = new BigDecimal("500000");
        
        if (metadata.containsKey("location")) {
            String location = (String) metadata.get("location");
            // Location-based multipliers
            if (location.contains("Manhattan") || location.contains("San Francisco")) {
                baseValue = baseValue.multiply(new BigDecimal("3.0"));
            } else if (location.contains("Los Angeles") || location.contains("Boston")) {
                baseValue = baseValue.multiply(new BigDecimal("2.0"));
            }
        }
        
        if (metadata.containsKey("squareFeet")) {
            Number sqFt = (Number) metadata.get("squareFeet");
            BigDecimal pricePerSqFt = new BigDecimal("300");
            baseValue = pricePerSqFt.multiply(new BigDecimal(sqFt.toString()));
        }
        
        return baseValue;
    }

    private BigDecimal calculateFinancialAssetValuation(Map<String, Object> metadata) {
        if (metadata.containsKey("faceValue")) {
            Number faceValue = (Number) metadata.get("faceValue");
            BigDecimal value = new BigDecimal(faceValue.toString());
            
            // Apply market conditions
            if (metadata.containsKey("creditRating")) {
                String rating = (String) metadata.get("creditRating");
                switch (rating.toUpperCase()) {
                    case "AAA":
                        value = value.multiply(new BigDecimal("1.05"));
                        break;
                    case "AA":
                        value = value.multiply(new BigDecimal("1.02"));
                        break;
                    case "BB":
                        value = value.multiply(new BigDecimal("0.95"));
                        break;
                }
            }
            
            return value;
        }
        
        return new BigDecimal("10000");
    }

    private BigDecimal calculateArtworkValuation(Map<String, Object> metadata) {
        BigDecimal baseValue = new BigDecimal("50000");
        
        if (metadata.containsKey("artist")) {
            String artist = (String) metadata.get("artist");
            // Famous artist multipliers
            if (artist.toLowerCase().contains("picasso") || artist.toLowerCase().contains("monet")) {
                baseValue = baseValue.multiply(new BigDecimal("50"));
            } else if (artist.toLowerCase().contains("warhol") || artist.toLowerCase().contains("van gogh")) {
                baseValue = baseValue.multiply(new BigDecimal("25"));
            }
        }
        
        if (metadata.containsKey("year")) {
            Number year = (Number) metadata.get("year");
            int age = 2024 - year.intValue();
            if (age > 100) {
                baseValue = baseValue.multiply(new BigDecimal("2.0"));
            }
        }
        
        return baseValue;
    }

    private BigDecimal calculateCommodityValuation(Map<String, Object> metadata) {
        if (metadata.containsKey("commodity")) {
            String commodity = (String) metadata.get("commodity");
            Number quantity = (Number) metadata.getOrDefault("quantity", 1);
            
            BigDecimal unitPrice;
            switch (commodity.toUpperCase()) {
                case "GOLD":
                    unitPrice = new BigDecimal("2000"); // per ounce
                    break;
                case "SILVER":
                    unitPrice = new BigDecimal("25"); // per ounce
                    break;
                case "OIL":
                    unitPrice = new BigDecimal("80"); // per barrel
                    break;
                case "WHEAT":
                    unitPrice = new BigDecimal("6"); // per bushel
                    break;
                default:
                    unitPrice = new BigDecimal("100");
            }
            
            return unitPrice.multiply(new BigDecimal(quantity.toString()));
        }
        
        return new BigDecimal("1000");
    }

    private BigDecimal calculateDefaultValuation(Map<String, Object> metadata) {
        // Default valuation logic
        if (metadata.containsKey("estimatedValue")) {
            Number value = (Number) metadata.get("estimatedValue");
            return new BigDecimal(value.toString());
        }
        
        return new BigDecimal("5000"); // Default $5,000
    }
}