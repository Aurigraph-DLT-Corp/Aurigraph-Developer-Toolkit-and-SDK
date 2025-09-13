package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Valuation Token (ERC-20) - Manages real-time asset valuation with multi-oracle price feeds
 * Part of composite token package - wAUR-VALUE-{ID}
 * Integrates with multiple oracle networks for accurate pricing
 */
public class ValuationToken extends SecondaryToken {
    private BigDecimal currentValue;
    private String baseCurrency;
    private List<PricePoint> priceHistory;
    private Map<String, OracleProvider> oracleProviders;
    private BigDecimal volatilityIndex;
    private BigDecimal liquidityScore;
    private Instant lastValuationUpdate;
    private ValuationMethod valuationMethod;
    private Map<String, BigDecimal> oracleWeights;

    public ValuationToken(String tokenId, String compositeId, BigDecimal currentValue, 
                         List<PricePoint> priceHistory) {
        super(tokenId, compositeId, SecondaryTokenType.VALUATION);
        this.currentValue = currentValue != null ? currentValue : BigDecimal.ZERO;
        this.baseCurrency = "USD";
        this.priceHistory = new ArrayList<>(priceHistory);
        this.oracleProviders = new HashMap<>();
        this.volatilityIndex = BigDecimal.ZERO;
        this.liquidityScore = BigDecimal.ZERO;
        this.lastValuationUpdate = Instant.now();
        this.valuationMethod = ValuationMethod.WEIGHTED_AVERAGE;
        this.oracleWeights = initializeDefaultOracleWeights();
        
        // Initialize oracle providers
        initializeOracleProviders();
    }

    /**
     * Update valuation from oracle feeds
     */
    public boolean updateValuation() {
        try {
            List<OraclePrice> oraclePrices = fetchFromAllOracles();
            
            if (oraclePrices.isEmpty()) {
                return false;
            }

            // Calculate weighted average price
            BigDecimal newValue = calculateWeightedPrice(oraclePrices);
            
            // Add to price history
            PricePoint newPricePoint = new PricePoint(
                newValue, Instant.now(), PriceSource.ORACLE_CONSENSUS, 
                calculateConfidence(oraclePrices)
            );
            priceHistory.add(newPricePoint);
            
            // Update current value
            BigDecimal previousValue = this.currentValue;
            this.currentValue = newValue;
            this.lastValuationUpdate = Instant.now();
            
            // Update volatility and liquidity metrics
            updateVolatilityIndex(previousValue, newValue);
            updateLiquidityScore(oraclePrices);
            
            // Trim price history to last 1000 points
            if (priceHistory.size() > 1000) {
                priceHistory = new ArrayList<>(priceHistory.subList(priceHistory.size() - 1000, priceHistory.size()));
            }
            
            setLastUpdated(Instant.now());
            return true;
            
        } catch (Exception e) {
            // Log error and return false
            return false;
        }
    }

    /**
     * Manual valuation update (from professional appraisal)
     */
    public boolean updateValuation(BigDecimal newValue, PriceSource source, String appraiserId) {
        PricePoint manualPricePoint = new PricePoint(
            newValue, Instant.now(), source, BigDecimal.valueOf(95) // High confidence for professional appraisal
        );
        manualPricePoint.setAppraiserId(appraiserId);
        
        priceHistory.add(manualPricePoint);
        
        // Weight manual appraisals more heavily
        if (source == PriceSource.PROFESSIONAL_APPRAISAL) {
            this.currentValue = newValue; // Use appraisal value directly
        } else {
            // Blend with current value for other sources
            this.currentValue = currentValue.multiply(BigDecimal.valueOf(0.7))
                                          .add(newValue.multiply(BigDecimal.valueOf(0.3)));
        }
        
        this.lastValuationUpdate = Instant.now();
        setLastUpdated(Instant.now());
        return true;
    }

    /**
     * Get price history for a specific time period
     */
    public List<PricePoint> getPriceHistory(Instant fromDate, Instant toDate) {
        return priceHistory.stream()
            .filter(point -> point.getTimestamp().isAfter(fromDate) && 
                           point.getTimestamp().isBefore(toDate))
            .toList();
    }

    /**
     * Get price history for last N days
     */
    public List<PricePoint> getPriceHistoryDays(int days) {
        Instant cutoff = Instant.now().minusSeconds(days * 24 * 60 * 60);
        return priceHistory.stream()
            .filter(point -> point.getTimestamp().isAfter(cutoff))
            .toList();
    }

    /**
     * Calculate price change percentage over period
     */
    public BigDecimal getPriceChangePercent(int days) {
        List<PricePoint> recentHistory = getPriceHistoryDays(days);
        
        if (recentHistory.size() < 2) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal oldestPrice = recentHistory.get(0).getPrice();
        BigDecimal newestPrice = recentHistory.get(recentHistory.size() - 1).getPrice();
        
        if (oldestPrice.equals(BigDecimal.ZERO)) {
            return BigDecimal.ZERO;
        }
        
        return newestPrice.subtract(oldestPrice)
                         .divide(oldestPrice, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Get valuation statistics
     */
    public ValuationStats getValuationStats() {
        if (priceHistory.isEmpty()) {
            return new ValuationStats(currentValue, BigDecimal.ZERO, BigDecimal.ZERO, 
                                    BigDecimal.ZERO, 0, lastValuationUpdate);
        }

        List<BigDecimal> prices = priceHistory.stream()
            .map(PricePoint::getPrice)
            .toList();

        BigDecimal minPrice = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        
        BigDecimal avgPrice = prices.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP);

        return new ValuationStats(currentValue, minPrice, maxPrice, avgPrice, 
                                priceHistory.size(), lastValuationUpdate);
    }

    /**
     * Get comparable asset analysis
     */
    public ComparableAnalysis getComparableAnalysis(List<ValuationToken> comparableAssets) {
        if (comparableAssets.isEmpty()) {
            return new ComparableAnalysis(currentValue, BigDecimal.ZERO, 0);
        }

        List<BigDecimal> comparablePrices = comparableAssets.stream()
            .map(ValuationToken::getCurrentValue)
            .toList();

        BigDecimal avgComparablePrice = comparablePrices.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(comparablePrices.size()), 2, RoundingMode.HALF_UP);

        BigDecimal premiumDiscount = currentValue.subtract(avgComparablePrice)
            .divide(avgComparablePrice, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return new ComparableAnalysis(currentValue, avgComparablePrice, 
                                    premiumDiscount, comparablePrices.size());
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        if (updateData.containsKey("currentValue")) {
            this.currentValue = new BigDecimal(updateData.get("currentValue").toString());
        }
        if (updateData.containsKey("baseCurrency")) {
            this.baseCurrency = (String) updateData.get("baseCurrency");
        }
        if (updateData.containsKey("valuationMethod")) {
            this.valuationMethod = ValuationMethod.valueOf((String) updateData.get("valuationMethod"));
        }
        setLastUpdated(Instant.now());
    }

    // Private helper methods
    private void initializeOracleProviders() {
        oracleProviders.put("CHAINLINK", new OracleProvider("CHAINLINK", "https://chainlink.io", true));
        oracleProviders.put("BAND_PROTOCOL", new OracleProvider("BAND_PROTOCOL", "https://bandprotocol.com", true));
        oracleProviders.put("AURIGRAPH_PRICE", new OracleProvider("AURIGRAPH_PRICE", "https://aurigraph.io/oracle", true));
        oracleProviders.put("REAL_ESTATE_MLS", new OracleProvider("REAL_ESTATE_MLS", "https://mls-data.com", true));
        oracleProviders.put("COMMODITY_EXCHANGE", new OracleProvider("COMMODITY_EXCHANGE", "https://exchange.com", false));
    }

    private Map<String, BigDecimal> initializeDefaultOracleWeights() {
        Map<String, BigDecimal> weights = new HashMap<>();
        weights.put("CHAINLINK", BigDecimal.valueOf(0.25));
        weights.put("BAND_PROTOCOL", BigDecimal.valueOf(0.20));
        weights.put("AURIGRAPH_PRICE", BigDecimal.valueOf(0.30));
        weights.put("REAL_ESTATE_MLS", BigDecimal.valueOf(0.15));
        weights.put("COMMODITY_EXCHANGE", BigDecimal.valueOf(0.10));
        return weights;
    }

    private List<OraclePrice> fetchFromAllOracles() {
        List<OraclePrice> prices = new ArrayList<>();
        
        // Simulate oracle data fetching
        for (Map.Entry<String, OracleProvider> entry : oracleProviders.entrySet()) {
            if (entry.getValue().isActive()) {
                // Simulate price fetch with some variance
                BigDecimal simulatedPrice = currentValue.multiply(
                    BigDecimal.valueOf(0.95 + Math.random() * 0.10)
                );
                
                prices.add(new OraclePrice(
                    entry.getKey(),
                    simulatedPrice,
                    Instant.now(),
                    BigDecimal.valueOf(85 + Math.random() * 15) // Confidence 85-100%
                ));
            }
        }
        
        return prices;
    }

    private BigDecimal calculateWeightedPrice(List<OraclePrice> oraclePrices) {
        BigDecimal weightedSum = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;

        for (OraclePrice price : oraclePrices) {
            BigDecimal weight = oracleWeights.getOrDefault(price.getOracleName(), BigDecimal.valueOf(0.1));
            // Adjust weight by confidence
            BigDecimal adjustedWeight = weight.multiply(price.getConfidence().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            
            weightedSum = weightedSum.add(price.getPrice().multiply(adjustedWeight));
            totalWeight = totalWeight.add(adjustedWeight);
        }

        if (totalWeight.equals(BigDecimal.ZERO)) {
            return currentValue; // Fall back to current value
        }

        return weightedSum.divide(totalWeight, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateConfidence(List<OraclePrice> oraclePrices) {
        if (oraclePrices.isEmpty()) {
            return BigDecimal.ZERO;
        }

        // Calculate variance in prices
        BigDecimal avgPrice = oraclePrices.stream()
            .map(OraclePrice::getPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(oraclePrices.size()), 4, RoundingMode.HALF_UP);

        double variance = oraclePrices.stream()
            .mapToDouble(price -> {
                BigDecimal diff = price.getPrice().subtract(avgPrice);
                return diff.multiply(diff).doubleValue();
            })
            .average()
            .orElse(0.0);

        // Convert variance to confidence score (lower variance = higher confidence)
        double confidence = Math.max(0, 100 - (variance / avgPrice.doubleValue() * 1000));
        return BigDecimal.valueOf(Math.min(100, confidence));
    }

    private void updateVolatilityIndex(BigDecimal oldValue, BigDecimal newValue) {
        if (oldValue.equals(BigDecimal.ZERO)) {
            return;
        }

        BigDecimal change = newValue.subtract(oldValue).abs();
        BigDecimal changePercent = change.divide(oldValue, 4, RoundingMode.HALF_UP);
        
        // Update volatility as exponential moving average
        this.volatilityIndex = volatilityIndex.multiply(BigDecimal.valueOf(0.9))
                                            .add(changePercent.multiply(BigDecimal.valueOf(0.1)));
    }

    private void updateLiquidityScore(List<OraclePrice> oraclePrices) {
        // Simple liquidity score based on number of active oracles and price consistency
        int activeOracles = oraclePrices.size();
        BigDecimal oracleScore = BigDecimal.valueOf(Math.min(100, activeOracles * 20));
        
        // Calculate price consistency
        if (oraclePrices.size() > 1) {
            BigDecimal avgPrice = oraclePrices.stream()
                .map(OraclePrice::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(oraclePrices.size()), 4, RoundingMode.HALF_UP);
            
            double variance = oraclePrices.stream()
                .mapToDouble(price -> Math.abs(price.getPrice().subtract(avgPrice).doubleValue()))
                .average()
                .orElse(0.0);
            
            BigDecimal consistencyScore = BigDecimal.valueOf(Math.max(0, 100 - variance));
            this.liquidityScore = oracleScore.multiply(BigDecimal.valueOf(0.7))
                                           .add(consistencyScore.multiply(BigDecimal.valueOf(0.3)));
        } else {
            this.liquidityScore = oracleScore;
        }
    }

    // Getters
    public BigDecimal getCurrentValue() { return currentValue; }
    public String getBaseCurrency() { return baseCurrency; }
    public List<PricePoint> getPriceHistory() { return List.copyOf(priceHistory); }
    public Map<String, OracleProvider> getOracleProviders() { return Map.copyOf(oracleProviders); }
    public BigDecimal getVolatilityIndex() { return volatilityIndex; }
    public BigDecimal getLiquidityScore() { return liquidityScore; }
    public Instant getLastValuationUpdate() { return lastValuationUpdate; }
    public ValuationMethod getValuationMethod() { return valuationMethod; }

    // Setters
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public void setValuationMethod(ValuationMethod valuationMethod) { this.valuationMethod = valuationMethod; }
}

/**
 * Individual price point in history
 */
class PricePoint {
    private final BigDecimal price;
    private final Instant timestamp;
    private final PriceSource source;
    private final BigDecimal confidence;
    private String appraiserId;

    public PricePoint(BigDecimal price, Instant timestamp, PriceSource source, BigDecimal confidence) {
        this.price = price;
        this.timestamp = timestamp;
        this.source = source;
        this.confidence = confidence;
    }

    // Getters
    public BigDecimal getPrice() { return price; }
    public Instant getTimestamp() { return timestamp; }
    public PriceSource getSource() { return source; }
    public BigDecimal getConfidence() { return confidence; }
    public String getAppraiserId() { return appraiserId; }
    public void setAppraiserId(String appraiserId) { this.appraiserId = appraiserId; }
}

/**
 * Oracle price data
 */
class OraclePrice {
    private final String oracleName;
    private final BigDecimal price;
    private final Instant timestamp;
    private final BigDecimal confidence;

    public OraclePrice(String oracleName, BigDecimal price, Instant timestamp, BigDecimal confidence) {
        this.oracleName = oracleName;
        this.price = price;
        this.timestamp = timestamp;
        this.confidence = confidence;
    }

    // Getters
    public String getOracleName() { return oracleName; }
    public BigDecimal getPrice() { return price; }
    public Instant getTimestamp() { return timestamp; }
    public BigDecimal getConfidence() { return confidence; }
}

/**
 * Oracle provider configuration
 */
class OracleProvider {
    private final String name;
    private final String endpoint;
    private boolean active;

    public OracleProvider(String name, String endpoint, boolean active) {
        this.name = name;
        this.endpoint = endpoint;
        this.active = active;
    }

    // Getters and setters
    public String getName() { return name; }
    public String getEndpoint() { return endpoint; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

/**
 * Price source enumeration
 */
enum PriceSource {
    ORACLE_CONSENSUS,        // Multiple oracle average
    PROFESSIONAL_APPRAISAL,  // Licensed appraiser
    MARKET_TRANSACTION,      // Recent comparable sale
    AUTOMATED_VALUATION,     // AVM model
    MANUAL_UPDATE           // Manual price update
}

/**
 * Valuation method enumeration
 */
enum ValuationMethod {
    WEIGHTED_AVERAGE,       // Weighted average of all sources
    ORACLE_ONLY,           // Oracle data only
    APPRAISAL_PRIORITY,    // Professional appraisal takes precedence
    MARKET_BASED,          // Market transaction based
    AI_PREDICTED           // AI model predictions
}

/**
 * Valuation statistics
 */
class ValuationStats {
    private final BigDecimal currentValue;
    private final BigDecimal minValue;
    private final BigDecimal maxValue;
    private final BigDecimal avgValue;
    private final int dataPoints;
    private final Instant lastUpdate;

    public ValuationStats(BigDecimal currentValue, BigDecimal minValue, BigDecimal maxValue, 
                         BigDecimal avgValue, int dataPoints, Instant lastUpdate) {
        this.currentValue = currentValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.avgValue = avgValue;
        this.dataPoints = dataPoints;
        this.lastUpdate = lastUpdate;
    }

    // Getters
    public BigDecimal getCurrentValue() { return currentValue; }
    public BigDecimal getMinValue() { return minValue; }
    public BigDecimal getMaxValue() { return maxValue; }
    public BigDecimal getAvgValue() { return avgValue; }
    public int getDataPoints() { return dataPoints; }
    public Instant getLastUpdate() { return lastUpdate; }
}

/**
 * Comparable analysis result
 */
class ComparableAnalysis {
    private final BigDecimal subjectValue;
    private final BigDecimal averageComparable;
    private final BigDecimal premiumDiscount;
    private final int comparableCount;

    public ComparableAnalysis(BigDecimal subjectValue, BigDecimal averageComparable, 
                            BigDecimal premiumDiscount, int comparableCount) {
        this.subjectValue = subjectValue;
        this.averageComparable = averageComparable;
        this.premiumDiscount = premiumDiscount;
        this.comparableCount = comparableCount;
    }

    // Getters
    public BigDecimal getSubjectValue() { return subjectValue; }
    public BigDecimal getAverageComparable() { return averageComparable; }
    public BigDecimal getPremiumDiscount() { return premiumDiscount; }
    public int getComparableCount() { return comparableCount; }
}