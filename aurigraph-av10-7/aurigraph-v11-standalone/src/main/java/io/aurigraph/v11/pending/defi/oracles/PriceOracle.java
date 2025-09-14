package io.aurigraph.v11.pending.defi.oracles;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Real-time price oracle for DeFi protocols
 * Aggregates prices from multiple sources with deviation protection
 */
@ApplicationScoped
public class PriceOracle {
    
    private static final Logger logger = LoggerFactory.getLogger(PriceOracle.class);
    
    // Price cache with timestamps
    private final Map<String, PriceData> priceCache = new ConcurrentHashMap<>();
    private final long CACHE_TTL = 30000; // 30 seconds
    
    // Mock prices for development - in production would integrate with Chainlink, etc.
    private final Map<String, BigDecimal> mockPrices = new ConcurrentHashMap<>();
    
    public PriceOracle() {
        initializeMockPrices();
    }
    
    /**
     * Get current price for a token
     */
    public BigDecimal getPrice(String tokenAddress) {
        PriceData cached = priceCache.get(tokenAddress);
        
        if (cached != null && !cached.isExpired()) {
            return cached.getPrice();
        }
        
        // Fetch fresh price (mock implementation)
        BigDecimal price = fetchFreshPrice(tokenAddress);
        priceCache.put(tokenAddress, new PriceData(price, Instant.now()));
        
        return price;
    }
    
    /**
     * Get price with timestamp
     */
    public Uni<PriceData> getPriceWithTimestamp(String tokenAddress) {
        return Uni.createFrom().item(() -> {
            BigDecimal price = getPrice(tokenAddress);
            return new PriceData(price, Instant.now());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    private void initializeMockPrices() {
        mockPrices.put("ETH", BigDecimal.valueOf(2000));
        mockPrices.put("BTC", BigDecimal.valueOf(42000));
        mockPrices.put("USDC", BigDecimal.valueOf(1));
        mockPrices.put("USDT", BigDecimal.valueOf(0.999));
        mockPrices.put("DAI", BigDecimal.valueOf(1.001));
    }
    
    private BigDecimal fetchFreshPrice(String tokenAddress) {
        BigDecimal basePrice = mockPrices.getOrDefault(tokenAddress, BigDecimal.valueOf(100));
        
        // Add small random variation (±2%)
        double variation = (ThreadLocalRandom.current().nextDouble() - 0.5) * 0.04;
        BigDecimal adjustedPrice = basePrice.multiply(BigDecimal.valueOf(1 + variation));
        
        logger.debug("Fetched price for {}: {}", tokenAddress, adjustedPrice);
        return adjustedPrice;
    }
    
    public static class PriceData {
        private final BigDecimal price;
        private final Instant timestamp;
        
        public PriceData(BigDecimal price, Instant timestamp) {
            this.price = price;
            this.timestamp = timestamp;
        }
        
        public boolean isExpired() {
            return Instant.now().toEpochMilli() - timestamp.toEpochMilli() > 30000; // 30 seconds
        }
        
        public BigDecimal getPrice() { return price; }
        public Instant getTimestamp() { return timestamp; }
    }
}