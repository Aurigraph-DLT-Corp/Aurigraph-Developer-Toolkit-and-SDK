package io.aurigraph.v11.contracts.rwa;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import io.quarkus.logging.Log;
import io.aurigraph.v11.ai.AIOptimizationService;

/**
 * AI-driven Asset Valuation Service for RWA tokenization
 * Provides real-time valuation using multiple data sources and ML models
 */
@ApplicationScoped
public class AssetValuationService {

    @Inject
    AIOptimizationService aiService;

    // Market data cache
    private final Map<String, MarketData> marketDataCache = new ConcurrentHashMap<>();
    
    // Historical valuation data for ML training
    private final Map<String, List<ValuationHistory>> historicalData = new ConcurrentHashMap<>();

    /**
     * Get AI-driven asset valuation
     */
    public BigDecimal getAssetValuation(String assetType, String assetId, Map<String, Object> metadata) {
        Log.infof("Calculating valuation for asset %s of type %s", assetId, assetType);
        
        BigDecimal baseValue = switch (assetType) {
            case "CARBON_CREDIT" -> valueCarbonCredit(assetId, metadata);
            case "REAL_ESTATE" -> valueRealEstate(assetId, metadata);
            case "FINANCIAL_ASSET" -> valueFinancialAsset(assetId, metadata);
            case "SUPPLY_CHAIN" -> valueSupplyChainAsset(assetId, metadata);
            case "COMMODITY" -> valueCommodity(assetId, metadata);
            case "INTELLECTUAL_PROPERTY" -> valueIntellectualProperty(assetId, metadata);
            case "RENEWABLE_ENERGY" -> valueRenewableEnergy(assetId, metadata);
            default -> getDefaultValuation(assetId, metadata);
        };
        
        // Apply AI-driven adjustments
        BigDecimal aiAdjustment = getAIValuationAdjustment(assetType, baseValue, metadata);
        BigDecimal finalValue = baseValue.multiply(aiAdjustment);
        
        // Record valuation history
        recordValuation(assetId, assetType, finalValue);
        
        Log.infof("Asset %s valued at $%s (base: $%s, AI adjustment: %s)", 
            assetId, finalValue, baseValue, aiAdjustment);
        
        return finalValue;
    }

    /**
     * Value carbon credits based on market conditions
     */
    private BigDecimal valueCarbonCredit(String assetId, Map<String, Object> metadata) {
        // Base price per ton of CO2
        BigDecimal basePricePerTon = new BigDecimal("45.00");
        
        // Get quantity from metadata
        BigDecimal tons = new BigDecimal(metadata.getOrDefault("tons", "100").toString());
        
        // Apply quality multipliers
        BigDecimal qualityMultiplier = getQualityMultiplier(metadata);
        
        // Apply regional pricing
        BigDecimal regionalMultiplier = getRegionalMultiplier(metadata);
        
        // Apply vintage adjustment (newer credits worth more)
        BigDecimal vintageMultiplier = getVintageMultiplier(metadata);
        
        // Calculate total value
        return basePricePerTon
            .multiply(tons)
            .multiply(qualityMultiplier)
            .multiply(regionalMultiplier)
            .multiply(vintageMultiplier)
            .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value real estate based on location, size, and market conditions
     */
    private BigDecimal valueRealEstate(String assetId, Map<String, Object> metadata) {
        // Base price per square foot/meter
        BigDecimal basePricePerUnit = new BigDecimal(metadata.getOrDefault("pricePerUnit", "250").toString());
        
        // Get property size
        BigDecimal size = new BigDecimal(metadata.getOrDefault("size", "1000").toString());
        
        // Location multiplier (prime locations worth more)
        BigDecimal locationMultiplier = getLocationMultiplier(metadata);
        
        // Property type multiplier
        BigDecimal typeMultiplier = getPropertyTypeMultiplier(metadata);
        
        // Market condition adjustment
        BigDecimal marketAdjustment = getMarketConditionAdjustment("REAL_ESTATE");
        
        // Calculate total value
        return basePricePerUnit
            .multiply(size)
            .multiply(locationMultiplier)
            .multiply(typeMultiplier)
            .multiply(marketAdjustment)
            .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value financial assets (stocks, bonds, derivatives)
     */
    private BigDecimal valueFinancialAsset(String assetId, Map<String, Object> metadata) {
        String instrumentType = (String) metadata.getOrDefault("instrumentType", "EQUITY");
        
        BigDecimal value = switch (instrumentType) {
            case "EQUITY" -> valueEquity(metadata);
            case "BOND" -> valueBond(metadata);
            case "DERIVATIVE" -> valueDerivative(metadata);
            case "FUND" -> valueFund(metadata);
            default -> new BigDecimal(metadata.getOrDefault("nominalValue", "10000").toString());
        };
        
        // Apply risk adjustment
        BigDecimal riskAdjustment = getRiskAdjustment(metadata);
        
        return value.multiply(riskAdjustment).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value supply chain assets (inventory, logistics, etc.)
     */
    private BigDecimal valueSupplyChainAsset(String assetId, Map<String, Object> metadata) {
        BigDecimal baseValue = new BigDecimal(metadata.getOrDefault("baseValue", "50000").toString());
        
        // Apply quality score
        BigDecimal qualityScore = new BigDecimal(metadata.getOrDefault("qualityScore", "0.95").toString());
        
        // Apply demand factor
        BigDecimal demandFactor = new BigDecimal(metadata.getOrDefault("demandFactor", "1.1").toString());
        
        // Apply perishability discount
        BigDecimal perishabilityDiscount = getPerishabilityDiscount(metadata);
        
        return baseValue
            .multiply(qualityScore)
            .multiply(demandFactor)
            .multiply(perishabilityDiscount)
            .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value commodities (gold, oil, agricultural products)
     */
    private BigDecimal valueCommodity(String assetId, Map<String, Object> metadata) {
        String commodityType = (String) metadata.getOrDefault("commodityType", "GOLD");
        BigDecimal quantity = new BigDecimal(metadata.getOrDefault("quantity", "100").toString());
        
        // Get spot price from market data
        BigDecimal spotPrice = getSpotPrice(commodityType);
        
        // Apply storage cost discount
        BigDecimal storageCostAdjustment = new BigDecimal("0.98"); // 2% storage cost
        
        // Apply futures premium/discount
        BigDecimal futuresAdjustment = getFuturesAdjustment(commodityType);
        
        return spotPrice
            .multiply(quantity)
            .multiply(storageCostAdjustment)
            .multiply(futuresAdjustment)
            .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value intellectual property (patents, trademarks, copyrights)
     */
    private BigDecimal valueIntellectualProperty(String assetId, Map<String, Object> metadata) {
        // Base value from revenue potential
        BigDecimal annualRevenue = new BigDecimal(metadata.getOrDefault("annualRevenue", "100000").toString());
        
        // Years remaining on protection
        int yearsRemaining = Integer.parseInt(metadata.getOrDefault("yearsRemaining", "10").toString());
        
        // Apply discount rate for NPV calculation
        BigDecimal discountRate = new BigDecimal("0.1"); // 10% discount rate
        
        // Calculate NPV of future cash flows
        BigDecimal npv = calculateNPV(annualRevenue, yearsRemaining, discountRate);
        
        // Apply market demand multiplier
        BigDecimal marketDemand = new BigDecimal(metadata.getOrDefault("marketDemand", "1.2").toString());
        
        return npv.multiply(marketDemand).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Value renewable energy assets (solar farms, wind turbines)
     */
    private BigDecimal valueRenewableEnergy(String assetId, Map<String, Object> metadata) {
        // Capacity in MW
        BigDecimal capacity = new BigDecimal(metadata.getOrDefault("capacityMW", "10").toString());
        
        // Value per MW installed
        BigDecimal valuePerMW = new BigDecimal("1500000"); // $1.5M per MW
        
        // Capacity factor (actual vs theoretical production)
        BigDecimal capacityFactor = new BigDecimal(metadata.getOrDefault("capacityFactor", "0.35").toString());
        
        // Government incentive multiplier
        BigDecimal incentiveMultiplier = new BigDecimal(metadata.getOrDefault("incentives", "1.2").toString());
        
        // Age depreciation
        BigDecimal ageDepreciation = getAgeDepreciation(metadata);
        
        return capacity
            .multiply(valuePerMW)
            .multiply(capacityFactor)
            .multiply(incentiveMultiplier)
            .multiply(ageDepreciation)
            .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Default valuation for unknown asset types
     */
    private BigDecimal getDefaultValuation(String assetId, Map<String, Object> metadata) {
        return new BigDecimal(metadata.getOrDefault("declaredValue", "10000").toString());
    }

    /**
     * Apply AI-driven valuation adjustments
     */
    private BigDecimal getAIValuationAdjustment(String assetType, BigDecimal baseValue, Map<String, Object> metadata) {
        // Use AI service to predict market trends
        Map<String, Object> aiInput = new HashMap<>();
        aiInput.put("assetType", assetType);
        aiInput.put("baseValue", baseValue.toString());
        aiInput.put("metadata", metadata);
        aiInput.put("historicalData", getHistoricalData(assetType));
        
        // AI returns adjustment factor (0.8 to 1.2 typically)
        // For now, simulate with market conditions
        return getMarketSentimentAdjustment(assetType);
    }

    // Helper methods

    private BigDecimal getQualityMultiplier(Map<String, Object> metadata) {
        String quality = (String) metadata.getOrDefault("quality", "STANDARD");
        return switch (quality) {
            case "PREMIUM" -> new BigDecimal("1.3");
            case "STANDARD" -> new BigDecimal("1.0");
            case "BASIC" -> new BigDecimal("0.8");
            default -> new BigDecimal("1.0");
        };
    }

    private BigDecimal getRegionalMultiplier(Map<String, Object> metadata) {
        String region = (String) metadata.getOrDefault("region", "US");
        return switch (region) {
            case "EU" -> new BigDecimal("1.2");
            case "US" -> new BigDecimal("1.15");
            case "ASIA" -> new BigDecimal("1.05");
            case "AFRICA" -> new BigDecimal("0.95");
            default -> new BigDecimal("1.0");
        };
    }

    private BigDecimal getVintageMultiplier(Map<String, Object> metadata) {
        int year = Integer.parseInt(metadata.getOrDefault("vintage", "2024").toString());
        int currentYear = 2024;
        int age = currentYear - year;
        
        if (age <= 0) return new BigDecimal("1.1"); // Future/current vintage premium
        if (age <= 2) return new BigDecimal("1.0");
        if (age <= 5) return new BigDecimal("0.9");
        return new BigDecimal("0.8"); // Older credits worth less
    }

    private BigDecimal getLocationMultiplier(Map<String, Object> metadata) {
        String location = (String) metadata.getOrDefault("location", "SUBURBAN");
        return switch (location) {
            case "PRIME_URBAN" -> new BigDecimal("2.5");
            case "URBAN" -> new BigDecimal("1.8");
            case "SUBURBAN" -> new BigDecimal("1.2");
            case "RURAL" -> new BigDecimal("0.8");
            default -> new BigDecimal("1.0");
        };
    }

    private BigDecimal getPropertyTypeMultiplier(Map<String, Object> metadata) {
        String type = (String) metadata.getOrDefault("propertyType", "RESIDENTIAL");
        return switch (type) {
            case "COMMERCIAL" -> new BigDecimal("1.3");
            case "INDUSTRIAL" -> new BigDecimal("1.1");
            case "RESIDENTIAL" -> new BigDecimal("1.0");
            case "AGRICULTURAL" -> new BigDecimal("0.7");
            default -> new BigDecimal("1.0");
        };
    }

    private BigDecimal getMarketConditionAdjustment(String market) {
        // Simulate market conditions (would connect to real market data)
        return new BigDecimal("1.05"); // 5% positive market
    }

    private BigDecimal getRiskAdjustment(Map<String, Object> metadata) {
        int riskScore = Integer.parseInt(metadata.getOrDefault("riskScore", "5").toString());
        // Lower risk = higher value
        return new BigDecimal("1.5").subtract(new BigDecimal(riskScore).multiply(new BigDecimal("0.05")));
    }

    private BigDecimal getPerishabilityDiscount(Map<String, Object> metadata) {
        boolean perishable = Boolean.parseBoolean(metadata.getOrDefault("perishable", "false").toString());
        if (!perishable) return BigDecimal.ONE;
        
        int daysRemaining = Integer.parseInt(metadata.getOrDefault("daysRemaining", "30").toString());
        if (daysRemaining > 60) return new BigDecimal("0.95");
        if (daysRemaining > 30) return new BigDecimal("0.90");
        if (daysRemaining > 7) return new BigDecimal("0.80");
        return new BigDecimal("0.60");
    }

    private BigDecimal getSpotPrice(String commodityType) {
        // Simulated spot prices (would connect to real commodity exchanges)
        return switch (commodityType) {
            case "GOLD" -> new BigDecimal("2050.00"); // per ounce
            case "SILVER" -> new BigDecimal("25.50"); // per ounce
            case "OIL" -> new BigDecimal("85.00"); // per barrel
            case "WHEAT" -> new BigDecimal("250.00"); // per metric ton
            case "COPPER" -> new BigDecimal("9500.00"); // per metric ton
            default -> new BigDecimal("100.00");
        };
    }

    private BigDecimal getFuturesAdjustment(String commodityType) {
        // Contango or backwardation adjustment
        return switch (commodityType) {
            case "GOLD", "SILVER" -> new BigDecimal("1.02"); // Slight contango
            case "OIL" -> new BigDecimal("0.98"); // Slight backwardation
            default -> BigDecimal.ONE;
        };
    }

    private BigDecimal calculateNPV(BigDecimal annualCashFlow, int years, BigDecimal discountRate) {
        BigDecimal npv = BigDecimal.ZERO;
        BigDecimal discountFactor = BigDecimal.ONE.add(discountRate);
        
        for (int i = 1; i <= years; i++) {
            BigDecimal presentValue = annualCashFlow.divide(
                discountFactor.pow(i), 2, RoundingMode.HALF_UP
            );
            npv = npv.add(presentValue);
        }
        
        return npv;
    }

    private BigDecimal getAgeDepreciation(Map<String, Object> metadata) {
        int age = Integer.parseInt(metadata.getOrDefault("ageYears", "0").toString());
        int expectedLife = Integer.parseInt(metadata.getOrDefault("expectedLife", "25").toString());
        
        if (age >= expectedLife) return new BigDecimal("0.1"); // Salvage value
        
        BigDecimal remainingLife = new BigDecimal(expectedLife - age).divide(new BigDecimal(expectedLife), 2, RoundingMode.HALF_UP);
        return remainingLife;
    }

    private BigDecimal getMarketSentimentAdjustment(String assetType) {
        // Simulate market sentiment (would use real sentiment analysis)
        return switch (assetType) {
            case "CARBON_CREDIT" -> new BigDecimal("1.15"); // Positive sentiment
            case "REAL_ESTATE" -> new BigDecimal("1.05");
            case "FINANCIAL_ASSET" -> new BigDecimal("1.02");
            default -> BigDecimal.ONE;
        };
    }

    private List<ValuationHistory> getHistoricalData(String assetType) {
        return historicalData.getOrDefault(assetType, new ArrayList<>());
    }

    private void recordValuation(String assetId, String assetType, BigDecimal value) {
        ValuationHistory history = new ValuationHistory(assetId, value, System.currentTimeMillis());
        historicalData.computeIfAbsent(assetType, k -> new ArrayList<>()).add(history);
    }

    // Inner classes

    private static class MarketData {
        String assetType;
        BigDecimal lastPrice;
        long timestamp;
        
        MarketData(String assetType, BigDecimal lastPrice) {
            this.assetType = assetType;
            this.lastPrice = lastPrice;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private static class ValuationHistory {
        String assetId;
        BigDecimal value;
        long timestamp;
        
        ValuationHistory(String assetId, BigDecimal value, long timestamp) {
            this.assetId = assetId;
            this.value = value;
            this.timestamp = timestamp;
        }
    }

    /**
     * Value equity instruments
     */
    private BigDecimal valueEquity(Map<String, Object> metadata) {
        BigDecimal shares = new BigDecimal(metadata.getOrDefault("shares", "100").toString());
        BigDecimal pricePerShare = new BigDecimal(metadata.getOrDefault("pricePerShare", "50").toString());
        return shares.multiply(pricePerShare);
    }

    /**
     * Value bond instruments
     */
    private BigDecimal valueBond(Map<String, Object> metadata) {
        BigDecimal faceValue = new BigDecimal(metadata.getOrDefault("faceValue", "1000").toString());
        BigDecimal couponRate = new BigDecimal(metadata.getOrDefault("couponRate", "0.05").toString());
        int yearsToMaturity = Integer.parseInt(metadata.getOrDefault("yearsToMaturity", "10").toString());
        BigDecimal marketRate = new BigDecimal(metadata.getOrDefault("marketRate", "0.04").toString());
        
        // Simple bond pricing
        BigDecimal couponPayment = faceValue.multiply(couponRate);
        BigDecimal bondValue = calculateNPV(couponPayment, yearsToMaturity, marketRate);
        bondValue = bondValue.add(faceValue.divide(BigDecimal.ONE.add(marketRate).pow(yearsToMaturity), 2, RoundingMode.HALF_UP));
        
        return bondValue;
    }

    /**
     * Value derivative instruments
     */
    private BigDecimal valueDerivative(Map<String, Object> metadata) {
        String derivativeType = (String) metadata.getOrDefault("derivativeType", "OPTION");
        BigDecimal notional = new BigDecimal(metadata.getOrDefault("notional", "10000").toString());
        BigDecimal marketValue = new BigDecimal(metadata.getOrDefault("marketValue", "500").toString());
        
        return switch (derivativeType) {
            case "OPTION" -> marketValue;
            case "FUTURE" -> notional.multiply(new BigDecimal("0.05")); // Margin requirement
            case "SWAP" -> marketValue.abs(); // Absolute value of swap
            default -> marketValue;
        };
    }

    /**
     * Value fund instruments
     */
    private BigDecimal valueFund(Map<String, Object> metadata) {
        BigDecimal units = new BigDecimal(metadata.getOrDefault("units", "1000").toString());
        BigDecimal nav = new BigDecimal(metadata.getOrDefault("nav", "15").toString()); // Net Asset Value
        return units.multiply(nav);
    }
}