package io.aurigraph.v11.token.derived.agricultural;

import io.aurigraph.v11.token.derived.DerivedToken;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * AgriculturalDerivedToken - Derived tokens for agricultural assets
 *
 * Supports 4 types of agricultural derived tokens:
 * - CROP_YIELD: Rights to crop production yields
 * - HARVEST_REVENUE: Rights to harvest sale revenues
 * - CARBON_SEQUESTRATION: Carbon credits from agricultural practices
 * - WATER_RIGHTS: Water usage and allocation rights
 *
 * Integrates with USDA oracles for real-time agricultural data.
 * Supports compliance with USDA organic, regenerative agriculture standards.
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@Entity
@Table(name = "agricultural_derived_tokens", indexes = {
    @Index(name = "idx_ag_farm_id", columnList = "farm_id"),
    @Index(name = "idx_ag_token_type", columnList = "ag_token_type"),
    @Index(name = "idx_ag_crop_type", columnList = "crop_type"),
    @Index(name = "idx_ag_harvest_year", columnList = "harvest_year")
})
@DiscriminatorValue("AGRICULTURAL")
public class AgriculturalDerivedToken extends DerivedToken {

    // =============== AGRICULTURAL SPECIFIC FIELDS ===============

    /**
     * Type of agricultural derived token
     */
    @Column(name = "ag_token_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Agricultural token type is required")
    public AgriculturalTokenType agTokenType;

    /**
     * Farm/operation identifier
     */
    @Column(name = "farm_id", length = 64)
    public String farmId;

    /**
     * Farm name
     */
    @Column(name = "farm_name", length = 256)
    public String farmName;

    /**
     * USDA Farm Service Agency number
     */
    @Column(name = "fsa_farm_number", length = 32)
    public String fsaFarmNumber;

    // =============== LOCATION ===============

    /**
     * County
     */
    @Column(name = "county", length = 100)
    public String county;

    /**
     * State
     */
    @Column(name = "state", length = 50)
    public String state;

    /**
     * Country
     */
    @Column(name = "country", length = 50)
    public String country = "USA";

    /**
     * Geographic latitude
     */
    @Column(name = "latitude", precision = 10, scale = 6)
    public BigDecimal latitude;

    /**
     * Geographic longitude
     */
    @Column(name = "longitude", precision = 10, scale = 6)
    public BigDecimal longitude;

    /**
     * Total acreage
     */
    @Column(name = "total_acreage", precision = 12, scale = 2)
    public BigDecimal totalAcreage;

    // =============== CROP YIELD SPECIFIC ===============

    /**
     * Primary crop type
     */
    @Column(name = "crop_type", length = 50)
    @Enumerated(EnumType.STRING)
    public CropType cropType;

    /**
     * Harvest year/season
     */
    @Column(name = "harvest_year")
    public Integer harvestYear;

    /**
     * Expected yield per acre (in bushels or appropriate unit)
     */
    @Column(name = "expected_yield_per_acre", precision = 12, scale = 4)
    public BigDecimal expectedYieldPerAcre;

    /**
     * Actual yield per acre (after harvest)
     */
    @Column(name = "actual_yield_per_acre", precision = 12, scale = 4)
    public BigDecimal actualYieldPerAcre;

    /**
     * Yield unit (bushels, tons, cwt, etc.)
     */
    @Column(name = "yield_unit", length = 20)
    public String yieldUnit = "bushels";

    /**
     * Total expected yield
     */
    @Column(name = "total_expected_yield", precision = 18, scale = 4)
    public BigDecimal totalExpectedYield;

    /**
     * Total actual yield
     */
    @Column(name = "total_actual_yield", precision = 18, scale = 4)
    public BigDecimal totalActualYield;

    // =============== HARVEST REVENUE SPECIFIC ===============

    /**
     * Price per unit at harvest time
     */
    @Column(name = "price_per_unit", precision = 12, scale = 4)
    public BigDecimal pricePerUnit;

    /**
     * Contract price (if pre-sold)
     */
    @Column(name = "contract_price", precision = 12, scale = 4)
    public BigDecimal contractPrice;

    /**
     * Expected total revenue
     */
    @Column(name = "expected_revenue", precision = 18, scale = 2)
    public BigDecimal expectedRevenue;

    /**
     * Actual total revenue (after sale)
     */
    @Column(name = "actual_revenue", precision = 18, scale = 2)
    public BigDecimal actualRevenue;

    /**
     * Buyer/purchaser identifier
     */
    @Column(name = "buyer_id", length = 64)
    public String buyerId;

    // =============== CARBON SEQUESTRATION SPECIFIC ===============

    /**
     * CO2 equivalent tonnes sequestered
     */
    @Column(name = "co2e_tonnes", precision = 18, scale = 6)
    public BigDecimal co2eTonnes;

    /**
     * Carbon registry identifier (Verra, Gold Standard, etc.)
     */
    @Column(name = "carbon_registry_id", length = 64)
    public String carbonRegistryId;

    /**
     * Carbon credit vintage year
     */
    @Column(name = "vintage_year")
    public Integer vintageYear;

    /**
     * Verification standard
     */
    @Column(name = "verification_standard", length = 50)
    @Enumerated(EnumType.STRING)
    public VerificationStandard verificationStandard;

    /**
     * Third-party verifier
     */
    @Column(name = "verifier", length = 128)
    public String verifier;

    /**
     * Carbon price per tonne
     */
    @Column(name = "carbon_price_per_tonne", precision = 12, scale = 4)
    public BigDecimal carbonPricePerTonne;

    // =============== WATER RIGHTS SPECIFIC ===============

    /**
     * Water right type
     */
    @Column(name = "water_right_type", length = 30)
    @Enumerated(EnumType.STRING)
    public WaterRightType waterRightType;

    /**
     * Annual water allocation (acre-feet)
     */
    @Column(name = "water_allocation_af", precision = 12, scale = 4)
    public BigDecimal waterAllocationAcreFeet;

    /**
     * Priority date for water rights
     */
    @Column(name = "priority_date")
    public Instant priorityDate;

    /**
     * Water source (river, aquifer, etc.)
     */
    @Column(name = "water_source", length = 128)
    public String waterSource;

    /**
     * Water district
     */
    @Column(name = "water_district", length = 128)
    public String waterDistrict;

    /**
     * Beneficial use type
     */
    @Column(name = "beneficial_use", length = 50)
    public String beneficialUse = "Agricultural";

    // =============== ORACLE CONFIGURATION ===============

    /**
     * USDA oracle identifier
     */
    @Column(name = "usda_oracle_id", length = 64)
    public String usdaOracleId;

    /**
     * Last USDA data update
     */
    @Column(name = "usda_data_updated_at")
    public Instant usdaDataUpdatedAt;

    /**
     * Weather data oracle
     */
    @Column(name = "weather_oracle_id", length = 64)
    public String weatherOracleId;

    // =============== CERTIFICATION ===============

    /**
     * USDA Organic certified
     */
    @Column(name = "usda_organic_certified")
    public Boolean usdaOrganicCertified = false;

    /**
     * Regenerative agriculture certified
     */
    @Column(name = "regenerative_certified")
    public Boolean regenerativeCertified = false;

    /**
     * Certification agency
     */
    @Column(name = "certifying_agency", length = 128)
    public String certifyingAgency;

    // =============== CONSTRUCTORS ===============

    public AgriculturalDerivedToken() {
        super();
    }

    public AgriculturalDerivedToken(String tokenId, String parentTokenId,
                                     AgriculturalTokenType agTokenType,
                                     BigDecimal faceValue, String owner) {
        super(tokenId, parentTokenId, agTokenType.name(), faceValue, owner);
        this.agTokenType = agTokenType;
    }

    // =============== FACTORY METHODS ===============

    /**
     * Create a crop yield token
     */
    public static AgriculturalDerivedToken createCropYieldToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            String farmId, CropType cropType, int harvestYear,
            BigDecimal acreage, BigDecimal expectedYieldPerAcre) {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                tokenId, parentTokenId, AgriculturalTokenType.CROP_YIELD, faceValue, owner
        );
        token.farmId = farmId;
        token.cropType = cropType;
        token.harvestYear = harvestYear;
        token.totalAcreage = acreage;
        token.expectedYieldPerAcre = expectedYieldPerAcre;
        token.totalExpectedYield = acreage.multiply(expectedYieldPerAcre)
                .setScale(4, RoundingMode.HALF_UP);
        token.distributionFrequency = DistributionFrequency.ANNUAL;
        return token;
    }

    /**
     * Create a harvest revenue token
     */
    public static AgriculturalDerivedToken createHarvestRevenueToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            String farmId, CropType cropType, int harvestYear,
            BigDecimal expectedYield, BigDecimal pricePerUnit, BigDecimal revenueShare) {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                tokenId, parentTokenId, AgriculturalTokenType.HARVEST_REVENUE, faceValue, owner
        );
        token.farmId = farmId;
        token.cropType = cropType;
        token.harvestYear = harvestYear;
        token.totalExpectedYield = expectedYield;
        token.pricePerUnit = pricePerUnit;
        token.expectedRevenue = expectedYield.multiply(pricePerUnit)
                .setScale(2, RoundingMode.HALF_UP);
        token.revenueSharePercent = revenueShare;
        token.distributionFrequency = DistributionFrequency.ANNUAL;
        return token;
    }

    /**
     * Create a carbon sequestration token
     */
    public static AgriculturalDerivedToken createCarbonSequestrationToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            String farmId, BigDecimal co2eTonnes, int vintageYear,
            VerificationStandard standard, BigDecimal pricePerTonne) {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                tokenId, parentTokenId, AgriculturalTokenType.CARBON_SEQUESTRATION, faceValue, owner
        );
        token.farmId = farmId;
        token.co2eTonnes = co2eTonnes;
        token.vintageYear = vintageYear;
        token.verificationStandard = standard;
        token.carbonPricePerTonne = pricePerTonne;
        token.currentValue = co2eTonnes.multiply(pricePerTonne).setScale(2, RoundingMode.HALF_UP);
        return token;
    }

    /**
     * Create a water rights token
     */
    public static AgriculturalDerivedToken createWaterRightsToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            String farmId, WaterRightType waterRightType,
            BigDecimal allocationAcreFeet, String waterSource) {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                tokenId, parentTokenId, AgriculturalTokenType.WATER_RIGHTS, faceValue, owner
        );
        token.farmId = farmId;
        token.waterRightType = waterRightType;
        token.waterAllocationAcreFeet = allocationAcreFeet;
        token.waterSource = waterSource;
        token.distributionFrequency = DistributionFrequency.ANNUAL;
        return token;
    }

    // =============== ABSTRACT METHOD IMPLEMENTATIONS ===============

    @Override
    public String getCategory() {
        return "AGRICULTURAL";
    }

    @Override
    public ValidationResult validateSpecific() {
        ValidationResult result = new ValidationResult();

        if (agTokenType == null) {
            result.addError("Agricultural token type is required");
            return result;
        }

        switch (agTokenType) {
            case CROP_YIELD -> validateCropYield(result);
            case HARVEST_REVENUE -> validateHarvestRevenue(result);
            case CARBON_SEQUESTRATION -> validateCarbonSequestration(result);
            case WATER_RIGHTS -> validateWaterRights(result);
        }

        return result;
    }

    private void validateCropYield(ValidationResult result) {
        if (farmId == null || farmId.trim().isEmpty()) {
            result.addError("Farm ID is required for crop yield tokens");
        }
        if (cropType == null) {
            result.addError("Crop type is required for crop yield tokens");
        }
        if (harvestYear == null || harvestYear < 2000 || harvestYear > 2100) {
            result.addError("Valid harvest year is required (2000-2100)");
        }
        if (expectedYieldPerAcre == null || expectedYieldPerAcre.signum() <= 0) {
            result.addError("Expected yield per acre must be positive");
        }
    }

    private void validateHarvestRevenue(ValidationResult result) {
        if (farmId == null || farmId.trim().isEmpty()) {
            result.addError("Farm ID is required for harvest revenue tokens");
        }
        if (totalExpectedYield == null || totalExpectedYield.signum() <= 0) {
            result.addError("Expected yield must be positive for harvest revenue tokens");
        }
        if (pricePerUnit == null || pricePerUnit.signum() <= 0) {
            result.addError("Price per unit must be positive");
        }
    }

    private void validateCarbonSequestration(ValidationResult result) {
        if (co2eTonnes == null || co2eTonnes.signum() <= 0) {
            result.addError("CO2e tonnes must be positive for carbon sequestration tokens");
        }
        if (vintageYear == null || vintageYear < 2000 || vintageYear > 2100) {
            result.addError("Valid vintage year is required (2000-2100)");
        }
        if (verificationStandard == null) {
            result.addError("Verification standard is required for carbon tokens");
        }
    }

    private void validateWaterRights(ValidationResult result) {
        if (waterRightType == null) {
            result.addError("Water right type is required");
        }
        if (waterAllocationAcreFeet == null || waterAllocationAcreFeet.signum() <= 0) {
            result.addError("Water allocation must be positive");
        }
        if (waterSource == null || waterSource.trim().isEmpty()) {
            result.addError("Water source is required");
        }
    }

    @Override
    public BigDecimal calculateYield() {
        if (agTokenType == null) {
            return BigDecimal.ZERO;
        }
        return switch (agTokenType) {
            case CROP_YIELD -> calculateCropYieldReturn();
            case HARVEST_REVENUE -> calculateHarvestRevenueReturn();
            case CARBON_SEQUESTRATION -> calculateCarbonReturn();
            case WATER_RIGHTS -> calculateWaterRightsReturn();
        };
    }

    private BigDecimal calculateCropYieldReturn() {
        if (actualYieldPerAcre != null && expectedYieldPerAcre != null
            && expectedYieldPerAcre.signum() > 0) {
            return actualYieldPerAcre.subtract(expectedYieldPerAcre)
                    .divide(expectedYieldPerAcre, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateHarvestRevenueReturn() {
        if (actualRevenue != null && expectedRevenue != null
            && expectedRevenue.signum() > 0) {
            return actualRevenue.subtract(expectedRevenue)
                    .divide(expectedRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        if (revenueSharePercent != null && faceValue != null && faceValue.signum() > 0) {
            BigDecimal expectedShare = expectedRevenue != null ?
                expectedRevenue.multiply(revenueSharePercent).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;
            return expectedShare.divide(faceValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateCarbonReturn() {
        if (co2eTonnes != null && carbonPricePerTonne != null && faceValue != null
            && faceValue.signum() > 0) {
            BigDecimal carbonValue = co2eTonnes.multiply(carbonPricePerTonne);
            return carbonValue.divide(faceValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateWaterRightsReturn() {
        // Water rights typically don't have a direct yield but may have lease value
        if (currentValue != null && faceValue != null && faceValue.signum() > 0) {
            return currentValue.subtract(faceValue)
                    .divide(faceValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    @Override
    public List<String> getOracleFeeds() {
        List<String> feeds = new ArrayList<>();
        feeds.add("ORACLE_USDA_NASS");
        feeds.add("ORACLE_USDA_PRICES");

        switch (agTokenType) {
            case CROP_YIELD, HARVEST_REVENUE -> {
                feeds.add("ORACLE_WEATHER");
                feeds.add("ORACLE_CROP_PRICES");
                if (cropType != null) {
                    feeds.add("ORACLE_" + cropType.name() + "_FUTURES");
                }
            }
            case CARBON_SEQUESTRATION -> {
                feeds.add("ORACLE_VERRA");
                feeds.add("ORACLE_GOLD_STANDARD");
                feeds.add("ORACLE_CARBON_PRICES");
            }
            case WATER_RIGHTS -> {
                feeds.add("ORACLE_WATER_MARKETS");
                feeds.add("ORACLE_DROUGHT_INDEX");
            }
        }

        return feeds;
    }

    // =============== QUERY METHODS ===============

    public static List<AgriculturalDerivedToken> findByAgTokenType(AgriculturalTokenType type) {
        return find("ag_token_type", type).list();
    }

    public static List<AgriculturalDerivedToken> findByFarmId(String farmId) {
        return find("farm_id", farmId).list();
    }

    public static List<AgriculturalDerivedToken> findByCropType(CropType cropType) {
        return find("crop_type", cropType).list();
    }

    public static List<AgriculturalDerivedToken> findByHarvestYear(int year) {
        return find("harvest_year", year).list();
    }

    public static List<AgriculturalDerivedToken> findByVintageYear(int year) {
        return find("vintage_year", year).list();
    }

    // =============== ENUMS ===============

    /**
     * Types of agricultural derived tokens
     */
    public enum AgriculturalTokenType {
        CROP_YIELD("Crop Yield", "Rights to crop production yields"),
        HARVEST_REVENUE("Harvest Revenue", "Rights to harvest sale revenues"),
        CARBON_SEQUESTRATION("Carbon Sequestration", "Carbon credits from agricultural practices"),
        WATER_RIGHTS("Water Rights", "Water usage and allocation rights");

        private final String displayName;
        private final String description;

        AgriculturalTokenType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * Common crop types
     */
    public enum CropType {
        CORN("Corn", "bu"),
        SOYBEANS("Soybeans", "bu"),
        WHEAT("Wheat", "bu"),
        RICE("Rice", "cwt"),
        COTTON("Cotton", "lbs"),
        BARLEY("Barley", "bu"),
        SORGHUM("Sorghum", "bu"),
        OATS("Oats", "bu"),
        ALFALFA("Alfalfa", "tons"),
        HAY("Hay", "tons"),
        PEANUTS("Peanuts", "lbs"),
        SUNFLOWER("Sunflower", "lbs"),
        SUGAR_BEETS("Sugar Beets", "tons"),
        POTATOES("Potatoes", "cwt"),
        GRAPES("Grapes", "tons"),
        ALMONDS("Almonds", "lbs"),
        WALNUTS("Walnuts", "lbs");

        private final String displayName;
        private final String defaultUnit;

        CropType(String displayName, String defaultUnit) {
            this.displayName = displayName;
            this.defaultUnit = defaultUnit;
        }

        public String getDisplayName() { return displayName; }
        public String getDefaultUnit() { return defaultUnit; }
    }

    /**
     * Carbon verification standards
     */
    public enum VerificationStandard {
        VERRA_VCS("Verra VCS", "Verified Carbon Standard"),
        GOLD_STANDARD("Gold Standard", "Gold Standard for the Global Goals"),
        ACR("ACR", "American Carbon Registry"),
        CAR("CAR", "Climate Action Reserve"),
        USDA_CIG("USDA CIG", "Conservation Innovation Grants"),
        SOIL_CARBON_STANDARD("SCS", "Soil Carbon Standard"),
        REGENERATIVE_ORGANIC("ROC", "Regenerative Organic Certified");

        private final String code;
        private final String fullName;

        VerificationStandard(String code, String fullName) {
            this.code = code;
            this.fullName = fullName;
        }

        public String getCode() { return code; }
        public String getFullName() { return fullName; }
    }

    /**
     * Water right types
     */
    public enum WaterRightType {
        RIPARIAN("Riparian", "Rights based on land adjacent to water"),
        PRIOR_APPROPRIATION("Prior Appropriation", "First in time, first in right"),
        CORRELATIVE("Correlative", "Shared proportional rights"),
        GROUNDWATER("Groundwater", "Rights to underground aquifer"),
        SURFACE_WATER("Surface Water", "Rights to rivers, streams, lakes"),
        STORAGE("Storage", "Rights to stored water in reservoirs");

        private final String displayName;
        private final String description;

        WaterRightType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }
}
