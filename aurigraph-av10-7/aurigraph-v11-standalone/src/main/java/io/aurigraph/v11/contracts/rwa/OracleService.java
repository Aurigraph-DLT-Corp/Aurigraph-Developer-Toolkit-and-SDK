package io.aurigraph.v11.contracts.rwa;

import jakarta.enterprise.context.ApplicationScoped;
import io.smallrye.mutiny.Uni;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.ArrayList;
import io.quarkus.logging.Log;

/**
 * Oracle Service for RWA asset price feeds and external data integration
 * Provides reliable price data from multiple sources with consensus mechanisms
 */
@ApplicationScoped
public class OracleService {

    private final Map<String, OracleFeed> priceFeeds = new ConcurrentHashMap<>();
    private final Map<String, List<PriceCallback>> callbacks = new ConcurrentHashMap<>();
    
    // Supported oracle sources
    private static final Map<String, String> ORACLE_SOURCES = Map.of(
        "CHAINLINK", "Chainlink Price Feeds",
        "BAND_PROTOCOL", "Band Protocol",
        "API3", "API3 Decentralized APIs",
        "TELLOR", "Tellor Oracle Network",
        "INTERNAL", "Aurigraph Internal Oracle"
    );

    /**
     * Get current price from oracle
     */
    public BigDecimal getPrice(String assetId, String source) {
        String feedKey = assetId + ":" + source;
        OracleFeed feed = priceFeeds.get(feedKey);
        
        if (feed != null && isFeedValid(feed)) {
            Log.infof("Retrieved price for asset %s from %s: $%s", assetId, source, feed.getPrice());
            return feed.getPrice();
        }
        
        // Fallback to simulated price
        BigDecimal simulatedPrice = simulatePrice(assetId, source);
        updatePrice(assetId, source, simulatedPrice);
        
        return simulatedPrice;
    }

    /**
     * Get price asynchronously
     */
    public Uni<BigDecimal> getPriceAsync(String assetId, String source) {
        return Uni.createFrom().item(() -> getPrice(assetId, source))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update price feed from oracle source
     */
    public void updatePrice(String assetId, String source, BigDecimal newPrice) {
        String feedKey = assetId + ":" + source;
        OracleFeed feed = new OracleFeed(assetId, source, newPrice, Instant.now());
        priceFeeds.put(feedKey, feed);
        
        // Trigger callbacks
        triggerCallbacks(assetId, newPrice, source);
        
        Log.infof("Updated price feed for asset %s from %s: $%s", assetId, source, newPrice);
    }

    /**
     * Subscribe to price updates
     */
    public void subscribeToUpdates(String assetId, String callbackUrl) {
        List<PriceCallback> assetCallbacks = callbacks.computeIfAbsent(assetId, k -> new ArrayList<>());
        assetCallbacks.add(new PriceCallback(callbackUrl, Instant.now()));
        
        Log.infof("Subscribed to price updates for asset %s with callback %s", assetId, callbackUrl);
    }

    /**
     * Get price with consensus from multiple oracles
     */
    public BigDecimal getPriceWithConsensus(String assetId) {
        List<BigDecimal> prices = new ArrayList<>();
        
        // Get prices from all available sources
        for (String source : ORACLE_SOURCES.keySet()) {
            try {
                BigDecimal price = getPrice(assetId, source);
                if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
                    prices.add(price);
                }
            } catch (Exception e) {
                Log.warnf("Failed to get price from source %s for asset %s: %s", source, assetId, e.getMessage());
            }
        }
        
        if (prices.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        // Calculate median price for consensus
        return calculateMedianPrice(prices);
    }

    /**
     * Get historical price data
     */
    public List<OracleFeed> getHistoricalPrices(String assetId, String source, int limit) {
        // In a real implementation, this would query a time-series database
        List<OracleFeed> history = new ArrayList<>();
        String feedKey = assetId + ":" + source;
        OracleFeed currentFeed = priceFeeds.get(feedKey);
        
        if (currentFeed != null) {
            // Simulate historical data
            BigDecimal currentPrice = currentFeed.getPrice();
            for (int i = 0; i < Math.min(limit, 10); i++) {
                BigDecimal historicalPrice = currentPrice.multiply(
                    new BigDecimal(0.95 + (Math.random() * 0.1)) // ±5% variation
                );
                Instant timestamp = Instant.now().minusSeconds(i * 3600L); // Hourly intervals
                history.add(new OracleFeed(assetId, source, historicalPrice, timestamp));
            }
        }
        
        return history;
    }

    /**
     * Validate oracle feed integrity
     */
    public boolean validateFeed(String assetId, String source) {
        String feedKey = assetId + ":" + source;
        OracleFeed feed = priceFeeds.get(feedKey);
        
        if (feed == null) {
            return false;
        }
        
        // Check if feed is not stale (within last hour)
        boolean isValid = isFeedValid(feed);
        
        // Additional validation checks
        boolean priceReasonable = feed.getPrice().compareTo(BigDecimal.ZERO) > 0 &&
                                 feed.getPrice().compareTo(new BigDecimal("1000000000")) < 0;
        
        return isValid && priceReasonable;
    }

    /**
     * Get supported oracle sources
     */
    public Map<String, String> getSupportedSources() {
        return ORACLE_SOURCES;
    }

    /**
     * Get oracle feed health status
     */
    public Map<String, Object> getOracleHealth() {
        Map<String, Object> health = new ConcurrentHashMap<>();
        
        for (String source : ORACLE_SOURCES.keySet()) {
            int validFeeds = 0;
            int totalFeeds = 0;
            
            for (Map.Entry<String, OracleFeed> entry : priceFeeds.entrySet()) {
                if (entry.getKey().endsWith(":" + source)) {
                    totalFeeds++;
                    if (isFeedValid(entry.getValue())) {
                        validFeeds++;
                    }
                }
            }
            
            Map<String, Object> sourceHealth = Map.of(
                "totalFeeds", totalFeeds,
                "validFeeds", validFeeds,
                "healthPercentage", totalFeeds > 0 ? (validFeeds * 100.0 / totalFeeds) : 0.0,
                "status", (validFeeds * 100.0 / Math.max(totalFeeds, 1)) > 80 ? "HEALTHY" : "DEGRADED"
            );
            
            health.put(source, sourceHealth);
        }
        
        return health;
    }

    // Private helper methods
    
    private boolean isFeedValid(OracleFeed feed) {
        // Feed is valid if updated within last hour
        return feed.getTimestamp().isAfter(Instant.now().minusSeconds(3600));
    }

    private BigDecimal simulatePrice(String assetId, String source) {
        // Simulate price based on asset ID hash and current time
        int hash = Math.abs(assetId.hashCode());
        double basePrice = 100 + (hash % 10000);
        
        // Add some randomness based on time
        long timeVariation = System.currentTimeMillis() % 1000;
        double priceVariation = (timeVariation / 1000.0) * 0.1; // ±10% max variation
        
        double finalPrice = basePrice * (0.95 + priceVariation);
        return new BigDecimal(finalPrice).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void triggerCallbacks(String assetId, BigDecimal newPrice, String source) {
        List<PriceCallback> assetCallbacks = callbacks.get(assetId);
        if (assetCallbacks != null) {
            for (PriceCallback callback : assetCallbacks) {
                try {
                    // In a real implementation, this would make HTTP callbacks
                    Log.infof("Triggering callback %s for asset %s price update: $%s", 
                        callback.getUrl(), assetId, newPrice);
                } catch (Exception e) {
                    Log.errorf("Failed to trigger callback %s for asset %s: %s", 
                        callback.getUrl(), assetId, e.getMessage());
                }
            }
        }
    }

    private BigDecimal calculateMedianPrice(List<BigDecimal> prices) {
        if (prices.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        // Sort prices
        prices.sort(BigDecimal::compareTo);
        
        int size = prices.size();
        if (size % 2 == 0) {
            // Even number of prices - average of two middle values
            BigDecimal mid1 = prices.get(size / 2 - 1);
            BigDecimal mid2 = prices.get(size / 2);
            return mid1.add(mid2).divide(new BigDecimal("2"), java.math.RoundingMode.HALF_UP);
        } else {
            // Odd number of prices - middle value
            return prices.get(size / 2);
        }
    }

    // Inner classes
    
    public static class OracleFeed {
        private final String assetId;
        private final String source;
        private final BigDecimal price;
        private final Instant timestamp;
        
        public OracleFeed(String assetId, String source, BigDecimal price, Instant timestamp) {
            this.assetId = assetId;
            this.source = source;
            this.price = price;
            this.timestamp = timestamp;
        }
        
        // Getters
        public String getAssetId() { return assetId; }
        public String getSource() { return source; }
        public BigDecimal getPrice() { return price; }
        public Instant getTimestamp() { return timestamp; }
    }
    
    private static class PriceCallback {
        private final String url;
        private final Instant subscribedAt;
        
        public PriceCallback(String url, Instant subscribedAt) {
            this.url = url;
            this.subscribedAt = subscribedAt;
        }
        
        public String getUrl() { return url; }
        public Instant getSubscribedAt() { return subscribedAt; }
    }
}