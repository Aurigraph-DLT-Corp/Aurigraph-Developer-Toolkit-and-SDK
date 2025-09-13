package io.aurigraph.v11.contracts.rwa;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import io.quarkus.logging.Log;
import org.bouncycastle.crypto.digests.SHA3Digest;
import org.bouncycastle.util.encoders.Hex;

/**
 * Oracle Service for real-time asset price feeds and external data
 * Provides multi-source price aggregation with reliability scoring
 */
@ApplicationScoped
public class OracleService {

    // Oracle price feeds
    private final Map<String, List<PriceFeed>> priceFeeds = new ConcurrentHashMap<>();
    private final Map<String, OracleProvider> providers = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(0);
    
    // Performance metrics
    private final Map<String, OracleMetrics> metrics = new ConcurrentHashMap<>();

    public OracleService() {
        initializeProviders();
        startPriceUpdater();
    }

    /**
     * Get aggregated price from multiple oracles
     */
    public BigDecimal getPrice(String assetId, String preferredSource) {
        List<PriceFeed> feeds = priceFeeds.get(assetId);
        if (feeds == null || feeds.isEmpty()) {
            Log.warnf("No price feeds available for asset: %s", assetId);
            return getDefaultPrice(assetId);
        }
        
        // Filter by preferred source if specified
        if (preferredSource != null) {
            feeds = feeds.stream()
                .filter(feed -> preferredSource.equals(feed.getSource()))
                .toList();
        }
        
        // Calculate weighted average based on reliability scores
        return calculateWeightedPrice(feeds);
    }

    /**
     * Subscribe to price updates for an asset
     */
    public void subscribeToUpdates(String assetId, String callbackUrl) {
        Log.infof("Subscribing to price updates for %s with callback %s", assetId, callbackUrl);
        
        // Store subscription for callback notifications
        List<PriceFeed> feeds = priceFeeds.computeIfAbsent(assetId, k -> new ArrayList<>());
        
        // Start feeding prices from all providers
        for (OracleProvider provider : providers.values()) {
            if (provider.supportsAsset(assetId)) {
                provider.subscribe(assetId, callbackUrl);
            }
        }
    }

    /**
     * Get real-time market data for RWA assets
     */
    public Uni<MarketData> getMarketData(String assetId, String assetType) {
        return Uni.createFrom().item(() -> {
            BigDecimal price = getPrice(assetId, null);
            BigDecimal volume = getVolume(assetId);
            BigDecimal volatility = getVolatility(assetId);
            
            return new MarketData(
                assetId,
                assetType,
                price,
                volume,
                volatility,
                Instant.now(),
                getReliabilityScore(assetId)
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get price history for an asset
     */
    public Uni<List<PriceHistory>> getPriceHistory(String assetId, int days) {
        return Uni.createFrom().item(() -> {
            List<PriceHistory> history = new ArrayList<>();
            List<PriceFeed> feeds = priceFeeds.get(assetId);
            
            if (feeds != null) {
                // Generate historical data (simulate for now)
                BigDecimal currentPrice = calculateWeightedPrice(feeds);
                long now = System.currentTimeMillis();
                long dayMs = 24 * 60 * 60 * 1000;
                
                for (int i = days; i >= 0; i--) {
                    // Simulate price variations
                    BigDecimal variation = new BigDecimal(Math.random() * 0.1 - 0.05); // ±5%
                    BigDecimal historicalPrice = currentPrice.multiply(BigDecimal.ONE.add(variation));
                    
                    history.add(new PriceHistory(
                        assetId,
                        historicalPrice,
                        now - (i * dayMs),
                        "AGGREGATED"
                    ));
                }
            }
            
            return history;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Validate oracle data integrity
     */
    public Uni<OracleValidation> validateData(String assetId) {
        return Uni.createFrom().item(() -> {
            List<PriceFeed> feeds = priceFeeds.get(assetId);
            if (feeds == null || feeds.isEmpty()) {
                return new OracleValidation(false, "No price feeds available", 0.0);
            }
            
            // Check price consistency across sources
            double consistency = calculatePriceConsistency(feeds);
            
            // Check freshness of data
            boolean isFresh = feeds.stream().allMatch(feed -> 
                System.currentTimeMillis() - feed.getTimestamp() < 300000 // 5 minutes
            );
            
            boolean isValid = consistency > 0.8 && isFresh;
            String message = isValid ? "Oracle data is valid" : "Oracle data inconsistency detected";
            
            return new OracleValidation(isValid, message, consistency);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get oracle provider statistics
     */
    public Uni<Map<String, OracleMetrics>> getProviderStats() {
        return Uni.createFrom().item(() -> new HashMap<>(metrics))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private methods

    private void initializeProviders() {
        // Initialize oracle providers
        providers.put("CHAINLINK", new ChainlinkProvider());
        providers.put("BAND_PROTOCOL", new BandProtocolProvider());
        providers.put("DIA_DATA", new DiaDataProvider());
        providers.put("API3", new Api3Provider());
        providers.put("TELLOR", new TellorProvider());
        
        // Initialize metrics for each provider
        providers.keySet().forEach(name -> 
            metrics.put(name, new OracleMetrics(name)));
        
        Log.info("Initialized oracle providers: " + String.join(", ", providers.keySet()));
    }

    private void startPriceUpdater() {
        // Simulate price updates (in production, this would connect to real oracles)
        Thread.startVirtualThread(() -> {
            while (true) {
                try {
                    updatePrices();
                    Thread.sleep(10000); // Update every 10 seconds
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }

    private void updatePrices() {
        // Simulate price updates from various sources
        String[] assets = {"BTC", "ETH", "GOLD", "OIL", "CARBON_CREDIT_VCS001", "REAL_ESTATE_NYC001"};
        
        for (String asset : assets) {
            List<PriceFeed> feeds = priceFeeds.computeIfAbsent(asset, k -> new ArrayList<>());
            feeds.clear();
            
            // Add prices from different providers
            for (OracleProvider provider : providers.values()) {
                BigDecimal price = provider.getPrice(asset);
                if (price != null) {
                    feeds.add(new PriceFeed(
                        asset,
                        price,
                        provider.getName(),
                        System.currentTimeMillis(),
                        provider.getReliabilityScore()
                    ));
                    
                    // Update metrics
                    OracleMetrics providerMetrics = metrics.get(provider.getName());
                    if (providerMetrics != null) {
                        providerMetrics.incrementRequests();
                        providerMetrics.updateLatency(provider.getLatency());
                    }
                }
            }
        }
    }

    private BigDecimal calculateWeightedPrice(List<PriceFeed> feeds) {
        if (feeds.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;
        
        for (PriceFeed feed : feeds) {
            BigDecimal weight = new BigDecimal(feed.getReliabilityScore());
            totalWeight = totalWeight.add(weight);
            weightedSum = weightedSum.add(feed.getPrice().multiply(weight));
        }
        
        if (totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        return weightedSum.divide(totalWeight, 8, BigDecimal.ROUND_HALF_UP);
    }

    private BigDecimal getDefaultPrice(String assetId) {
        // Fallback prices for unknown assets
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45000");
            case "ETH" -> new BigDecimal("2500");
            case "GOLD" -> new BigDecimal("2050");
            case "OIL" -> new BigDecimal("85");
            default -> new BigDecimal("100");
        };
    }

    private BigDecimal getVolume(String assetId) {
        // Simulate trading volume
        return new BigDecimal(Math.random() * 1000000);
    }

    private BigDecimal getVolatility(String assetId) {
        // Simulate volatility (0-100)
        return new BigDecimal(Math.random() * 50);
    }

    private double getReliabilityScore(String assetId) {
        List<PriceFeed> feeds = priceFeeds.get(assetId);
        if (feeds == null || feeds.isEmpty()) {
            return 0.0;
        }
        
        return feeds.stream()
            .mapToDouble(PriceFeed::getReliabilityScore)
            .average()
            .orElse(0.0);
    }

    private double calculatePriceConsistency(List<PriceFeed> feeds) {
        if (feeds.size() < 2) {
            return 1.0; // Single feed is consistent by definition
        }
        
        BigDecimal avgPrice = feeds.stream()
            .map(PriceFeed::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(new BigDecimal(feeds.size()), 8, BigDecimal.ROUND_HALF_UP);
        
        // Calculate coefficient of variation
        double variance = feeds.stream()
            .mapToDouble(feed -> {
                double diff = feed.getPrice().subtract(avgPrice).doubleValue();
                return diff * diff;
            })
            .average()
            .orElse(0.0);
        
        double stdDev = Math.sqrt(variance);
        double cv = avgPrice.doubleValue() > 0 ? stdDev / avgPrice.doubleValue() : 1.0;
        
        // Return consistency score (1 - coefficient of variation)
        return Math.max(0.0, 1.0 - cv);
    }
}

// Data classes

class PriceFeed {
    private final String assetId;
    private final BigDecimal price;
    private final String source;
    private final long timestamp;
    private final double reliabilityScore;

    public PriceFeed(String assetId, BigDecimal price, String source, long timestamp, double reliabilityScore) {
        this.assetId = assetId;
        this.price = price;
        this.source = source;
        this.timestamp = timestamp;
        this.reliabilityScore = reliabilityScore;
    }

    public String getAssetId() { return assetId; }
    public BigDecimal getPrice() { return price; }
    public String getSource() { return source; }
    public long getTimestamp() { return timestamp; }
    public double getReliabilityScore() { return reliabilityScore; }
}

class MarketData {
    private final String assetId;
    private final String assetType;
    private final BigDecimal price;
    private final BigDecimal volume;
    private final BigDecimal volatility;
    private final Instant timestamp;
    private final double reliabilityScore;

    public MarketData(String assetId, String assetType, BigDecimal price, BigDecimal volume, 
                     BigDecimal volatility, Instant timestamp, double reliabilityScore) {
        this.assetId = assetId;
        this.assetType = assetType;
        this.price = price;
        this.volume = volume;
        this.volatility = volatility;
        this.timestamp = timestamp;
        this.reliabilityScore = reliabilityScore;
    }

    public String getAssetId() { return assetId; }
    public String getAssetType() { return assetType; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getVolume() { return volume; }
    public BigDecimal getVolatility() { return volatility; }
    public Instant getTimestamp() { return timestamp; }
    public double getReliabilityScore() { return reliabilityScore; }
}

class PriceHistory {
    private final String assetId;
    private final BigDecimal price;
    private final long timestamp;
    private final String source;

    public PriceHistory(String assetId, BigDecimal price, long timestamp, String source) {
        this.assetId = assetId;
        this.price = price;
        this.timestamp = timestamp;
        this.source = source;
    }

    public String getAssetId() { return assetId; }
    public BigDecimal getPrice() { return price; }
    public long getTimestamp() { return timestamp; }
    public String getSource() { return source; }
}

class OracleValidation {
    private final boolean valid;
    private final String message;
    private final double consistencyScore;

    public OracleValidation(boolean valid, String message, double consistencyScore) {
        this.valid = valid;
        this.message = message;
        this.consistencyScore = consistencyScore;
    }

    public boolean isValid() { return valid; }
    public String getMessage() { return message; }
    public double getConsistencyScore() { return consistencyScore; }
}

class OracleMetrics {
    private final String providerName;
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong successfulRequests = new AtomicLong(0);
    private volatile double averageLatency = 0.0;
    private volatile long lastUpdate = System.currentTimeMillis();

    public OracleMetrics(String providerName) {
        this.providerName = providerName;
    }

    public void incrementRequests() {
        totalRequests.incrementAndGet();
        successfulRequests.incrementAndGet();
        lastUpdate = System.currentTimeMillis();
    }

    public void updateLatency(double latency) {
        this.averageLatency = (averageLatency + latency) / 2.0;
    }

    public String getProviderName() { return providerName; }
    public long getTotalRequests() { return totalRequests.get(); }
    public long getSuccessfulRequests() { return successfulRequests.get(); }
    public double getAverageLatency() { return averageLatency; }
    public long getLastUpdate() { return lastUpdate; }
    
    public double getSuccessRate() {
        long total = totalRequests.get();
        return total > 0 ? (double) successfulRequests.get() / total : 0.0;
    }
}

// Oracle Provider Interfaces and Implementations

abstract class OracleProvider {
    protected final String name;
    protected final double reliabilityScore;

    public OracleProvider(String name, double reliabilityScore) {
        this.name = name;
        this.reliabilityScore = reliabilityScore;
    }

    public abstract BigDecimal getPrice(String assetId);
    public abstract boolean supportsAsset(String assetId);
    public abstract void subscribe(String assetId, String callbackUrl);
    
    public String getName() { return name; }
    public double getReliabilityScore() { return reliabilityScore; }
    public double getLatency() { return Math.random() * 100; } // Simulate latency
}

class ChainlinkProvider extends OracleProvider {
    public ChainlinkProvider() {
        super("CHAINLINK", 0.95);
    }

    @Override
    public BigDecimal getPrice(String assetId) {
        // Simulate Chainlink price feed
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45123.45");
            case "ETH" -> new BigDecimal("2567.89");
            case "GOLD" -> new BigDecimal("2048.50");
            default -> null;
        };
    }

    @Override
    public boolean supportsAsset(String assetId) {
        return Set.of("BTC", "ETH", "GOLD", "OIL").contains(assetId);
    }

    @Override
    public void subscribe(String assetId, String callbackUrl) {
        Log.infof("Chainlink: Subscribed to %s with callback %s", assetId, callbackUrl);
    }
}

class BandProtocolProvider extends OracleProvider {
    public BandProtocolProvider() {
        super("BAND_PROTOCOL", 0.90);
    }

    @Override
    public BigDecimal getPrice(String assetId) {
        // Simulate Band Protocol price feed with slight variations
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45098.23");
            case "ETH" -> new BigDecimal("2571.34");
            case "GOLD" -> new BigDecimal("2051.20");
            default -> null;
        };
    }

    @Override
    public boolean supportsAsset(String assetId) {
        return Set.of("BTC", "ETH", "GOLD", "CARBON_CREDIT_VCS001").contains(assetId);
    }

    @Override
    public void subscribe(String assetId, String callbackUrl) {
        Log.infof("Band Protocol: Subscribed to %s with callback %s", assetId, callbackUrl);
    }
}

class DiaDataProvider extends OracleProvider {
    public DiaDataProvider() {
        super("DIA_DATA", 0.85);
    }

    @Override
    public BigDecimal getPrice(String assetId) {
        // Simulate DIA Data price feed
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45156.78");
            case "ETH" -> new BigDecimal("2563.45");
            case "REAL_ESTATE_NYC001" -> new BigDecimal("850000.00");
            default -> null;
        };
    }

    @Override
    public boolean supportsAsset(String assetId) {
        return Set.of("BTC", "ETH", "REAL_ESTATE_NYC001").contains(assetId);
    }

    @Override
    public void subscribe(String assetId, String callbackUrl) {
        Log.infof("DIA Data: Subscribed to %s with callback %s", assetId, callbackUrl);
    }
}

class Api3Provider extends OracleProvider {
    public Api3Provider() {
        super("API3", 0.88);
    }

    @Override
    public BigDecimal getPrice(String assetId) {
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45089.67");
            case "ETH" -> new BigDecimal("2568.12");
            case "OIL" -> new BigDecimal("84.75");
            default -> null;
        };
    }

    @Override
    public boolean supportsAsset(String assetId) {
        return Set.of("BTC", "ETH", "OIL").contains(assetId);
    }

    @Override
    public void subscribe(String assetId, String callbackUrl) {
        Log.infof("API3: Subscribed to %s with callback %s", assetId, callbackUrl);
    }
}

class TellorProvider extends OracleProvider {
    public TellorProvider() {
        super("TELLOR", 0.82);
    }

    @Override
    public BigDecimal getPrice(String assetId) {
        return switch (assetId) {
            case "BTC" -> new BigDecimal("45134.23");
            case "ETH" -> new BigDecimal("2565.78");
            default -> null;
        };
    }

    @Override
    public boolean supportsAsset(String assetId) {
        return Set.of("BTC", "ETH").contains(assetId);
    }

    @Override
    public void subscribe(String assetId, String callbackUrl) {
        Log.infof("Tellor: Subscribed to %s with callback %s", assetId, callbackUrl);
    }
}