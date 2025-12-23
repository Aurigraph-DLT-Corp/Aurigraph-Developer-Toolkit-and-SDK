package io.aurigraph.v11.token.derived.realestate;

import io.aurigraph.v11.token.derived.DerivedToken;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * RealEstateDerivedToken - Derived tokens for real estate assets
 *
 * Supports 4 types of real estate derived tokens:
 * - RENTAL_INCOME: Rights to rental income from the property
 * - FRACTIONAL_SHARE: Fractional ownership in the property
 * - PROPERTY_APPRECIATION: Rights to property value appreciation
 * - MORTGAGE_COLLATERAL: Property used as mortgage collateral
 *
 * Integrates with property valuation oracles for real-time pricing.
 * Supports compliance with SEC Regulation D, Regulation A+, etc.
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@Entity
@Table(name = "real_estate_derived_tokens", indexes = {
    @Index(name = "idx_re_property_id", columnList = "property_id"),
    @Index(name = "idx_re_token_type", columnList = "re_token_type"),
    @Index(name = "idx_re_apn", columnList = "assessor_parcel_number")
})
@DiscriminatorValue("REAL_ESTATE")
public class RealEstateDerivedToken extends DerivedToken {

    // =============== REAL ESTATE SPECIFIC FIELDS ===============

    /**
     * Type of real estate derived token
     */
    @Column(name = "re_token_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Real estate token type is required")
    public RealEstateTokenType reTokenType;

    /**
     * Property identifier
     */
    @Column(name = "property_id", length = 64)
    public String propertyId;

    /**
     * Assessor's Parcel Number
     */
    @Column(name = "assessor_parcel_number", length = 64)
    public String assessorParcelNumber;

    /**
     * Property type classification
     */
    @Column(name = "property_type", length = 50)
    @Enumerated(EnumType.STRING)
    public PropertyType propertyType;

    // =============== LOCATION ===============

    /**
     * Property street address
     */
    @Column(name = "street_address", length = 256)
    public String streetAddress;

    /**
     * City
     */
    @Column(name = "city", length = 100)
    public String city;

    /**
     * State/Province
     */
    @Column(name = "state", length = 50)
    public String state;

    /**
     * Postal code
     */
    @Column(name = "postal_code", length = 20)
    public String postalCode;

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

    // =============== VALUATION ===============

    /**
     * Total property value (from oracle or appraisal)
     */
    @Column(name = "property_value", precision = 38, scale = 18)
    public BigDecimal propertyValue;

    /**
     * Last appraisal value
     */
    @Column(name = "appraisal_value", precision = 38, scale = 18)
    public BigDecimal appraisalValue;

    /**
     * Appraisal date
     */
    @Column(name = "appraisal_date")
    public Instant appraisalDate;

    /**
     * Property square footage
     */
    @Column(name = "square_feet")
    public Integer squareFeet;

    /**
     * Price per square foot
     */
    @Column(name = "price_per_sqft", precision = 18, scale = 2)
    public BigDecimal pricePerSquareFoot;

    // =============== RENTAL INCOME SPECIFIC ===============

    /**
     * Monthly rental income (for RENTAL_INCOME type)
     */
    @Column(name = "monthly_rent", precision = 18, scale = 2)
    public BigDecimal monthlyRent;

    /**
     * Annual rental income
     */
    @Column(name = "annual_rental_income", precision = 18, scale = 2)
    public BigDecimal annualRentalIncome;

    /**
     * Occupancy rate (0-100)
     */
    @Column(name = "occupancy_rate", precision = 5, scale = 2)
    public BigDecimal occupancyRate;

    /**
     * Cap rate (capitalization rate)
     */
    @Column(name = "cap_rate", precision = 5, scale = 2)
    public BigDecimal capRate;

    // =============== MORTGAGE/COLLATERAL SPECIFIC ===============

    /**
     * Loan-to-value ratio (for MORTGAGE_COLLATERAL)
     */
    @Column(name = "ltv_ratio", precision = 5, scale = 2)
    public BigDecimal ltvRatio;

    /**
     * Mortgage principal amount
     */
    @Column(name = "mortgage_principal", precision = 38, scale = 18)
    public BigDecimal mortgagePrincipal;

    /**
     * Mortgage interest rate
     */
    @Column(name = "mortgage_rate", precision = 6, scale = 4)
    public BigDecimal mortgageRate;

    /**
     * Mortgage maturity date
     */
    @Column(name = "mortgage_maturity")
    public Instant mortgageMaturity;

    /**
     * Lender identifier
     */
    @Column(name = "lender_id", length = 64)
    public String lenderId;

    // =============== FRACTIONAL SHARE SPECIFIC ===============

    /**
     * Total number of shares issued
     */
    @Column(name = "total_shares")
    public Long totalShares;

    /**
     * Number of shares this token represents
     */
    @Column(name = "share_count")
    public Long shareCount;

    /**
     * Price per share
     */
    @Column(name = "share_price", precision = 18, scale = 4)
    public BigDecimal sharePrice;

    // =============== APPRECIATION SPECIFIC ===============

    /**
     * Base value for appreciation calculation
     */
    @Column(name = "base_value", precision = 38, scale = 18)
    public BigDecimal baseValue;

    /**
     * Target appreciation percentage
     */
    @Column(name = "target_appreciation", precision = 6, scale = 2)
    public BigDecimal targetAppreciation;

    /**
     * Appreciation lock period in days
     */
    @Column(name = "appreciation_lock_days")
    public Integer appreciationLockDays;

    // =============== ORACLE CONFIGURATION ===============

    /**
     * Property valuation oracle ID (e.g., Zillow, CoreLogic)
     */
    @Column(name = "valuation_oracle_id", length = 64)
    public String valuationOracleId;

    /**
     * Last oracle valuation
     */
    @Column(name = "oracle_valuation", precision = 38, scale = 18)
    public BigDecimal oracleValuation;

    /**
     * Oracle valuation timestamp
     */
    @Column(name = "oracle_valuation_at")
    public Instant oracleValuationAt;

    // =============== CONSTRUCTORS ===============

    public RealEstateDerivedToken() {
        super();
    }

    public RealEstateDerivedToken(String tokenId, String parentTokenId,
                                   RealEstateTokenType reTokenType,
                                   BigDecimal faceValue, String owner) {
        super(tokenId, parentTokenId, reTokenType.name(), faceValue, owner);
        this.reTokenType = reTokenType;
    }

    // =============== FACTORY METHODS ===============

    /**
     * Create a rental income token
     */
    public static RealEstateDerivedToken createRentalIncomeToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            BigDecimal monthlyRent, BigDecimal revenueShare) {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                tokenId, parentTokenId, RealEstateTokenType.RENTAL_INCOME, faceValue, owner
        );
        token.monthlyRent = monthlyRent;
        token.annualRentalIncome = monthlyRent.multiply(BigDecimal.valueOf(12));
        token.revenueSharePercent = revenueShare;
        token.distributionFrequency = DistributionFrequency.MONTHLY;
        return token;
    }

    /**
     * Create a fractional share token
     */
    public static RealEstateDerivedToken createFractionalShareToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            Long totalShares, Long shareCount, BigDecimal propertyValue) {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                tokenId, parentTokenId, RealEstateTokenType.FRACTIONAL_SHARE, faceValue, owner
        );
        token.totalShares = totalShares;
        token.shareCount = shareCount;
        token.propertyValue = propertyValue;
        token.sharePrice = propertyValue.divide(BigDecimal.valueOf(totalShares), 4, RoundingMode.HALF_UP);
        token.revenueSharePercent = BigDecimal.valueOf(shareCount)
                .divide(BigDecimal.valueOf(totalShares), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return token;
    }

    /**
     * Create a property appreciation token
     */
    public static RealEstateDerivedToken createAppreciationToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            BigDecimal baseValue, BigDecimal targetAppreciation, int lockDays) {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                tokenId, parentTokenId, RealEstateTokenType.PROPERTY_APPRECIATION, faceValue, owner
        );
        token.baseValue = baseValue;
        token.targetAppreciation = targetAppreciation;
        token.appreciationLockDays = lockDays;
        token.distributionFrequency = DistributionFrequency.ANNUAL;
        return token;
    }

    /**
     * Create a mortgage collateral token
     */
    public static RealEstateDerivedToken createMortgageCollateralToken(
            String tokenId, String parentTokenId, BigDecimal faceValue, String owner,
            BigDecimal propertyValue, BigDecimal mortgagePrincipal, BigDecimal mortgageRate,
            Instant maturityDate, String lenderId) {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                tokenId, parentTokenId, RealEstateTokenType.MORTGAGE_COLLATERAL, faceValue, owner
        );
        token.propertyValue = propertyValue;
        token.mortgagePrincipal = mortgagePrincipal;
        token.mortgageRate = mortgageRate;
        token.mortgageMaturity = maturityDate;
        token.lenderId = lenderId;
        token.ltvRatio = mortgagePrincipal.divide(propertyValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return token;
    }

    // =============== ABSTRACT METHOD IMPLEMENTATIONS ===============

    @Override
    public String getCategory() {
        return "REAL_ESTATE";
    }

    @Override
    public ValidationResult validateSpecific() {
        ValidationResult result = new ValidationResult();

        if (reTokenType == null) {
            result.addError("Real estate token type is required");
            return result;
        }

        switch (reTokenType) {
            case RENTAL_INCOME -> validateRentalIncome(result);
            case FRACTIONAL_SHARE -> validateFractionalShare(result);
            case PROPERTY_APPRECIATION -> validateAppreciation(result);
            case MORTGAGE_COLLATERAL -> validateMortgageCollateral(result);
        }

        return result;
    }

    private void validateRentalIncome(ValidationResult result) {
        if (monthlyRent == null || monthlyRent.signum() <= 0) {
            result.addError("Monthly rent must be positive for rental income tokens");
        }
        if (revenueSharePercent == null) {
            result.addError("Revenue share percentage is required for rental income tokens");
        }
    }

    private void validateFractionalShare(ValidationResult result) {
        if (totalShares == null || totalShares <= 0) {
            result.addError("Total shares must be positive for fractional share tokens");
        }
        if (shareCount == null || shareCount <= 0) {
            result.addError("Share count must be positive for fractional share tokens");
        }
        if (shareCount != null && totalShares != null && shareCount > totalShares) {
            result.addError("Share count cannot exceed total shares");
        }
    }

    private void validateAppreciation(ValidationResult result) {
        if (baseValue == null || baseValue.signum() <= 0) {
            result.addError("Base value must be positive for appreciation tokens");
        }
        if (targetAppreciation == null || targetAppreciation.signum() < 0) {
            result.addError("Target appreciation must be non-negative");
        }
    }

    private void validateMortgageCollateral(ValidationResult result) {
        if (propertyValue == null || propertyValue.signum() <= 0) {
            result.addError("Property value must be positive for mortgage collateral tokens");
        }
        if (mortgagePrincipal == null || mortgagePrincipal.signum() <= 0) {
            result.addError("Mortgage principal must be positive");
        }
        if (ltvRatio != null && ltvRatio.compareTo(BigDecimal.valueOf(100)) > 0) {
            result.addError("LTV ratio cannot exceed 100%");
        }
        if (lenderId == null || lenderId.trim().isEmpty()) {
            result.addError("Lender ID is required for mortgage collateral tokens");
        }
    }

    @Override
    public BigDecimal calculateYield() {
        if (reTokenType == null) {
            return BigDecimal.ZERO;
        }
        return switch (reTokenType) {
            case RENTAL_INCOME -> calculateRentalYield();
            case FRACTIONAL_SHARE -> calculateShareYield();
            case PROPERTY_APPRECIATION -> calculateAppreciationYield();
            case MORTGAGE_COLLATERAL -> calculateMortgageYield();
        };
    }

    private BigDecimal calculateRentalYield() {
        if (annualRentalIncome == null || faceValue == null || faceValue.signum() == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal effectiveIncome = annualRentalIncome;
        if (occupancyRate != null) {
            effectiveIncome = annualRentalIncome.multiply(occupancyRate)
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        }
        if (revenueSharePercent != null) {
            effectiveIncome = effectiveIncome.multiply(revenueSharePercent)
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        }
        return effectiveIncome.divide(faceValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateShareYield() {
        if (shareCount == null || totalShares == null || totalShares == 0) {
            return BigDecimal.ZERO;
        }
        if (annualRentalIncome != null && propertyValue != null && propertyValue.signum() > 0) {
            return annualRentalIncome.divide(propertyValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return capRate != null ? capRate : BigDecimal.ZERO;
    }

    private BigDecimal calculateAppreciationYield() {
        if (currentValue == null || baseValue == null || baseValue.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return currentValue.subtract(baseValue)
                .divide(baseValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateMortgageYield() {
        return mortgageRate != null ? mortgageRate : BigDecimal.ZERO;
    }

    @Override
    public List<String> getOracleFeeds() {
        List<String> feeds = new ArrayList<>();
        feeds.add("ORACLE_PROPERTY_VALUE");
        feeds.add("ORACLE_ZILLOW_ZESTIMATE");
        feeds.add("ORACLE_CORELOGIC");

        if (reTokenType == RealEstateTokenType.RENTAL_INCOME) {
            feeds.add("ORACLE_RENTAL_RATES");
            feeds.add("ORACLE_OCCUPANCY");
        } else if (reTokenType == RealEstateTokenType.MORTGAGE_COLLATERAL) {
            feeds.add("ORACLE_INTEREST_RATES");
            feeds.add("ORACLE_MORTGAGE_RATES");
        }

        return feeds;
    }

    // =============== QUERY METHODS ===============

    public static List<RealEstateDerivedToken> findByReTokenType(RealEstateTokenType type) {
        return find("re_token_type", type).list();
    }

    public static List<RealEstateDerivedToken> findByPropertyId(String propertyId) {
        return find("property_id", propertyId).list();
    }

    public static List<RealEstateDerivedToken> findByCity(String city) {
        return find("city", city).list();
    }

    public static List<RealEstateDerivedToken> findByState(String state) {
        return find("state", state).list();
    }

    // =============== ENUMS ===============

    /**
     * Types of real estate derived tokens
     */
    public enum RealEstateTokenType {
        RENTAL_INCOME("Rental Income", "Rights to rental income from the property"),
        FRACTIONAL_SHARE("Fractional Share", "Fractional ownership in the property"),
        PROPERTY_APPRECIATION("Property Appreciation", "Rights to property value appreciation"),
        MORTGAGE_COLLATERAL("Mortgage Collateral", "Property used as mortgage collateral");

        private final String displayName;
        private final String description;

        RealEstateTokenType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * Property type classification
     */
    public enum PropertyType {
        RESIDENTIAL_SINGLE_FAMILY("Residential - Single Family"),
        RESIDENTIAL_MULTI_FAMILY("Residential - Multi Family"),
        RESIDENTIAL_CONDO("Residential - Condominium"),
        COMMERCIAL_OFFICE("Commercial - Office"),
        COMMERCIAL_RETAIL("Commercial - Retail"),
        COMMERCIAL_INDUSTRIAL("Commercial - Industrial"),
        COMMERCIAL_MIXED_USE("Commercial - Mixed Use"),
        LAND_VACANT("Land - Vacant"),
        LAND_AGRICULTURAL("Land - Agricultural");

        private final String displayName;

        PropertyType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() { return displayName; }
    }
}
