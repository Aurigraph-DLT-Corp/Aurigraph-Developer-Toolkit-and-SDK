package io.aurigraph.v11.rwa.realestate;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * PropertyTitle - Comprehensive model for real estate property titles
 *
 * Represents a complete property title record with legal description,
 * ownership details, valuation history, and compliance information.
 * Uses Java 21 records for immutability and reduced boilerplate.
 *
 * @version 1.0.0
 * @author Aurigraph V12 RWA Team
 */
public class PropertyTitle {

    // ============================================
    // Core Property Identification
    // ============================================

    /**
     * Property identification record with APN and legal identifiers
     */
    public record PropertyId(
        @JsonProperty("property_id") String propertyId,
        @JsonProperty("apn") String assessorParcelNumber,  // Assessor's Parcel Number
        @JsonProperty("alt_parcel_id") String alternateParcelId,
        @JsonProperty("tax_id") String taxId,
        @JsonProperty("legal_lot") String legalLot,
        @JsonProperty("legal_block") String legalBlock,
        @JsonProperty("subdivision") String subdivision,
        @JsonProperty("plat_book") String platBook,
        @JsonProperty("plat_page") String platPage,
        @JsonProperty("instrument_number") String instrumentNumber,
        @JsonProperty("recording_date") Instant recordingDate
    ) {
        public static PropertyId create(String apn, String taxId) {
            return new PropertyId(
                "PROP-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                apn, null, taxId, null, null, null, null, null, null, Instant.now()
            );
        }
    }

    /**
     * Property type enumeration following industry standards
     */
    public enum PropertyType {
        RESIDENTIAL_SINGLE_FAMILY("Residential - Single Family", "RSF"),
        RESIDENTIAL_MULTI_FAMILY("Residential - Multi Family", "RMF"),
        RESIDENTIAL_CONDO("Residential - Condominium", "RCO"),
        RESIDENTIAL_TOWNHOUSE("Residential - Townhouse", "RTH"),
        RESIDENTIAL_COOP("Residential - Cooperative", "RCP"),
        COMMERCIAL_OFFICE("Commercial - Office", "COF"),
        COMMERCIAL_RETAIL("Commercial - Retail", "CRT"),
        COMMERCIAL_INDUSTRIAL("Commercial - Industrial", "CIN"),
        COMMERCIAL_MIXED_USE("Commercial - Mixed Use", "CMX"),
        COMMERCIAL_WAREHOUSE("Commercial - Warehouse", "CWH"),
        LAND_VACANT("Land - Vacant", "LVA"),
        LAND_AGRICULTURAL("Land - Agricultural", "LAG"),
        LAND_TIMBERLAND("Land - Timberland", "LTI"),
        LAND_MINERAL_RIGHTS("Land - Mineral Rights", "LMR"),
        SPECIAL_PURPOSE("Special Purpose", "SPP"),
        INDUSTRIAL_MANUFACTURING("Industrial - Manufacturing", "IMF"),
        INDUSTRIAL_FLEX("Industrial - Flex Space", "IFL");

        private final String displayName;
        private final String code;

        PropertyType(String displayName, String code) {
            this.displayName = displayName;
            this.code = code;
        }

        public String getDisplayName() { return displayName; }
        public String getCode() { return code; }
    }

    // ============================================
    // Location and Address
    // ============================================

    /**
     * Physical address record with geographic coordinates
     */
    public record PropertyAddress(
        @JsonProperty("street_address") String streetAddress,
        @JsonProperty("street_address_2") String streetAddress2,
        @JsonProperty("city") String city,
        @JsonProperty("county") String county,
        @JsonProperty("state") String state,
        @JsonProperty("state_code") String stateCode,
        @JsonProperty("postal_code") String postalCode,
        @JsonProperty("country") String country,
        @JsonProperty("country_code") String countryCode
    ) {}

    /**
     * Geographic coordinates with precision
     */
    public record GeoLocation(
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude,
        @JsonProperty("elevation_ft") Double elevationFeet,
        @JsonProperty("geo_precision") String geoPrecision,  // ROOFTOP, RANGE_INTERPOLATED, etc.
        @JsonProperty("census_tract") String censusTract,
        @JsonProperty("census_block") String censusBlock,
        @JsonProperty("fips_code") String fipsCode,
        @JsonProperty("timezone") String timezone
    ) {}

    /**
     * Legal description of property bounds
     */
    public record LegalDescription(
        @JsonProperty("description_type") String descriptionType,  // METES_AND_BOUNDS, LOT_AND_BLOCK, etc.
        @JsonProperty("full_legal") String fullLegalDescription,
        @JsonProperty("abbreviated_legal") String abbreviatedLegal,
        @JsonProperty("acreage") BigDecimal acreage,
        @JsonProperty("square_feet") BigDecimal squareFeet,
        @JsonProperty("lot_dimensions") String lotDimensions,
        @JsonProperty("frontage_feet") BigDecimal frontageFeet,
        @JsonProperty("depth_feet") BigDecimal depthFeet,
        @JsonProperty("zoning_code") String zoningCode,
        @JsonProperty("zoning_description") String zoningDescription,
        @JsonProperty("flood_zone") String floodZone,
        @JsonProperty("fema_flood_zone") String femaFloodZone
    ) {}

    // ============================================
    // Ownership Records
    // ============================================

    /**
     * Owner record with fractional ownership support
     */
    public record Owner(
        @JsonProperty("owner_id") String ownerId,
        @JsonProperty("owner_type") OwnerType ownerType,
        @JsonProperty("entity_name") String entityName,
        @JsonProperty("first_name") String firstName,
        @JsonProperty("last_name") String lastName,
        @JsonProperty("ownership_percentage") BigDecimal ownershipPercentage,
        @JsonProperty("ownership_type") String ownershipType,  // FEE_SIMPLE, JOINT_TENANCY, TENANTS_IN_COMMON, etc.
        @JsonProperty("vesting_type") String vestingType,
        @JsonProperty("acquisition_date") Instant acquisitionDate,
        @JsonProperty("acquisition_price") BigDecimal acquisitionPrice,
        @JsonProperty("wallet_address") String walletAddress,
        @JsonProperty("kyc_verified") Boolean kycVerified,
        @JsonProperty("accredited_investor") Boolean accreditedInvestor,
        @JsonProperty("jurisdiction") String jurisdiction
    ) {}

    /**
     * Owner type enumeration
     */
    public enum OwnerType {
        INDIVIDUAL("Individual"),
        JOINT("Joint Ownership"),
        CORPORATION("Corporation"),
        LLC("Limited Liability Company"),
        PARTNERSHIP("Partnership"),
        TRUST("Trust"),
        ESTATE("Estate"),
        REIT("Real Estate Investment Trust"),
        DST("Delaware Statutory Trust"),
        SYNDICATE("Investment Syndicate"),
        GOVERNMENT("Government Entity"),
        NON_PROFIT("Non-Profit Organization");

        private final String displayName;

        OwnerType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    /**
     * Chain of title entry for ownership history
     */
    public record ChainOfTitleEntry(
        @JsonProperty("entry_id") String entryId,
        @JsonProperty("sequence_number") Integer sequenceNumber,
        @JsonProperty("grantor") String grantor,
        @JsonProperty("grantee") String grantee,
        @JsonProperty("deed_type") DeedType deedType,
        @JsonProperty("instrument_number") String instrumentNumber,
        @JsonProperty("book") String book,
        @JsonProperty("page") String page,
        @JsonProperty("recording_date") Instant recordingDate,
        @JsonProperty("effective_date") Instant effectiveDate,
        @JsonProperty("consideration") BigDecimal consideration,
        @JsonProperty("documentary_stamps") BigDecimal documentaryStamps,
        @JsonProperty("transfer_tax") BigDecimal transferTax,
        @JsonProperty("tx_hash") String transactionHash,
        @JsonProperty("block_number") Long blockNumber,
        @JsonProperty("verified") Boolean verified,
        @JsonProperty("notes") String notes
    ) {}

    /**
     * Deed type enumeration
     */
    public enum DeedType {
        WARRANTY_DEED("Warranty Deed", true),
        SPECIAL_WARRANTY_DEED("Special Warranty Deed", true),
        QUITCLAIM_DEED("Quitclaim Deed", false),
        GRANT_DEED("Grant Deed", true),
        BARGAIN_AND_SALE_DEED("Bargain and Sale Deed", false),
        SHERIFFS_DEED("Sheriff's Deed", false),
        TAX_DEED("Tax Deed", false),
        TRUSTEES_DEED("Trustee's Deed", true),
        EXECUTORS_DEED("Executor's Deed", true),
        DEED_IN_LIEU("Deed in Lieu of Foreclosure", false),
        LIFE_ESTATE_DEED("Life Estate Deed", true),
        TRANSFER_ON_DEATH_DEED("Transfer on Death Deed", true);

        private final String displayName;
        private final boolean warrantyProvided;

        DeedType(String displayName, boolean warrantyProvided) {
            this.displayName = displayName;
            this.warrantyProvided = warrantyProvided;
        }

        public String getDisplayName() { return displayName; }
        public boolean isWarrantyProvided() { return warrantyProvided; }
    }

    // ============================================
    // Valuation Records
    // ============================================

    /**
     * Property valuation record
     */
    public record Valuation(
        @JsonProperty("valuation_id") String valuationId,
        @JsonProperty("valuation_type") ValuationType valuationType,
        @JsonProperty("valuation_date") Instant valuationDate,
        @JsonProperty("effective_date") Instant effectiveDate,
        @JsonProperty("value") BigDecimal value,
        @JsonProperty("currency") String currency,
        @JsonProperty("value_per_sqft") BigDecimal valuePerSquareFoot,
        @JsonProperty("land_value") BigDecimal landValue,
        @JsonProperty("improvement_value") BigDecimal improvementValue,
        @JsonProperty("appraiser_name") String appraiserName,
        @JsonProperty("appraiser_license") String appraiserLicense,
        @JsonProperty("appraisal_company") String appraisalCompany,
        @JsonProperty("confidence_score") BigDecimal confidenceScore,
        @JsonProperty("data_source") String dataSource,
        @JsonProperty("oracle_feed_id") String oracleFeedId,
        @JsonProperty("comparable_sales_count") Integer comparableSalesCount,
        @JsonProperty("notes") String notes
    ) {}

    /**
     * Valuation type enumeration
     */
    public enum ValuationType {
        APPRAISAL("Full Appraisal"),
        AVM("Automated Valuation Model"),
        BPO("Broker Price Opinion"),
        CMA("Comparative Market Analysis"),
        TAX_ASSESSMENT("Tax Assessment"),
        PURCHASE_PRICE("Purchase Price"),
        INSURANCE_VALUE("Insurance Value"),
        ORACLE_FEED("Oracle Price Feed"),
        COMPARABLE_SALES("Comparable Sales Analysis"),
        INCOME_APPROACH("Income Capitalization Approach"),
        COST_APPROACH("Cost Approach");

        private final String displayName;

        ValuationType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Compliance and Regulatory
    // ============================================

    /**
     * Compliance status record for regulatory requirements
     */
    public record ComplianceStatus(
        @JsonProperty("status") ComplianceState status,
        @JsonProperty("sec_regulation") SECRegulation secRegulation,
        @JsonProperty("accredited_only") Boolean accreditedInvestorsOnly,
        @JsonProperty("minimum_investment") BigDecimal minimumInvestment,
        @JsonProperty("maximum_investors") Integer maximumInvestors,
        @JsonProperty("current_investors") Integer currentInvestors,
        @JsonProperty("offering_amount") BigDecimal offeringAmount,
        @JsonProperty("amount_raised") BigDecimal amountRaised,
        @JsonProperty("offering_start") Instant offeringStart,
        @JsonProperty("offering_end") Instant offeringEnd,
        @JsonProperty("holding_period_days") Integer holdingPeriodDays,
        @JsonProperty("resale_restrictions") List<String> resaleRestrictions,
        @JsonProperty("blue_sky_compliant") List<String> blueSkyCompliantStates,
        @JsonProperty("aml_verified") Boolean amlVerified,
        @JsonProperty("kyc_verified") Boolean kycVerified,
        @JsonProperty("sanctions_cleared") Boolean sanctionsCleared,
        @JsonProperty("last_compliance_check") Instant lastComplianceCheck
    ) {}

    /**
     * SEC regulation type for securities offerings
     */
    public enum SECRegulation {
        REG_D_506B("Regulation D 506(b)", 35, true, false),
        REG_D_506C("Regulation D 506(c)", -1, true, true),
        REG_A_TIER1("Regulation A+ Tier 1", -1, false, false),
        REG_A_TIER2("Regulation A+ Tier 2", -1, false, false),
        REG_CF("Regulation Crowdfunding", -1, false, false),
        REG_S("Regulation S (Non-US)", -1, false, false),
        EXEMPT_INTRASTATE("Intrastate Exemption", -1, false, false),
        NONE("No SEC Registration Required", -1, false, false);

        private final String displayName;
        private final int maxNonAccreditedInvestors;
        private final boolean accreditedRequired;
        private final boolean generalSolicitationAllowed;

        SECRegulation(String displayName, int maxNonAccredited, boolean accreditedRequired, boolean generalSolicitation) {
            this.displayName = displayName;
            this.maxNonAccreditedInvestors = maxNonAccredited;
            this.accreditedRequired = accreditedRequired;
            this.generalSolicitationAllowed = generalSolicitation;
        }

        public String getDisplayName() { return displayName; }
        public int getMaxNonAccreditedInvestors() { return maxNonAccreditedInvestors; }
        public boolean isAccreditedRequired() { return accreditedRequired; }
        public boolean isGeneralSolicitationAllowed() { return generalSolicitationAllowed; }
    }

    /**
     * Compliance state enumeration
     */
    public enum ComplianceState {
        PENDING_REVIEW("Pending Review"),
        UNDER_REVIEW("Under Review"),
        COMPLIANT("Compliant"),
        NON_COMPLIANT("Non-Compliant"),
        EXEMPT("Exempt"),
        SUSPENDED("Suspended"),
        REVOKED("Revoked");

        private final String displayName;

        ComplianceState(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Tokenization Details
    // ============================================

    /**
     * Tokenization record for fractional ownership
     */
    public record TokenizationDetails(
        @JsonProperty("token_contract_address") String tokenContractAddress,
        @JsonProperty("token_symbol") String tokenSymbol,
        @JsonProperty("token_name") String tokenName,
        @JsonProperty("token_standard") String tokenStandard,  // ERC-20, ERC-1400, ERC-3643
        @JsonProperty("total_supply") BigDecimal totalSupply,
        @JsonProperty("available_supply") BigDecimal availableSupply,
        @JsonProperty("price_per_token") BigDecimal pricePerToken,
        @JsonProperty("minimum_purchase") BigDecimal minimumPurchase,
        @JsonProperty("maximum_purchase") BigDecimal maximumPurchase,
        @JsonProperty("distribution_type") DistributionType distributionType,
        @JsonProperty("dividend_frequency") String dividendFrequency,
        @JsonProperty("expected_yield") BigDecimal expectedYield,
        @JsonProperty("management_fee") BigDecimal managementFee,
        @JsonProperty("platform_fee") BigDecimal platformFee,
        @JsonProperty("lockup_period_days") Integer lockupPeriodDays,
        @JsonProperty("transferable") Boolean transferable,
        @JsonProperty("whitelist_required") Boolean whitelistRequired,
        @JsonProperty("chain_id") Long chainId,
        @JsonProperty("deployment_tx") String deploymentTransactionHash,
        @JsonProperty("deployment_block") Long deploymentBlockNumber
    ) {}

    /**
     * Distribution type for income
     */
    public enum DistributionType {
        MONTHLY("Monthly Distribution"),
        QUARTERLY("Quarterly Distribution"),
        SEMI_ANNUAL("Semi-Annual Distribution"),
        ANNUAL("Annual Distribution"),
        ON_DEMAND("On-Demand Distribution"),
        ACCUMULATING("Accumulating (No Distribution)");

        private final String displayName;

        DistributionType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Title Insurance
    // ============================================

    /**
     * Title insurance policy record
     */
    public record TitleInsurance(
        @JsonProperty("policy_number") String policyNumber,
        @JsonProperty("policy_type") TitlePolicyType policyType,
        @JsonProperty("insurer") String insurer,
        @JsonProperty("underwriter") String underwriter,
        @JsonProperty("coverage_amount") BigDecimal coverageAmount,
        @JsonProperty("premium_paid") BigDecimal premiumPaid,
        @JsonProperty("effective_date") Instant effectiveDate,
        @JsonProperty("expiration_date") Instant expirationDate,
        @JsonProperty("exceptions") List<String> exceptions,
        @JsonProperty("endorsements") List<String> endorsements,
        @JsonProperty("status") String status
    ) {}

    /**
     * Title policy type enumeration
     */
    public enum TitlePolicyType {
        OWNER("Owner's Policy"),
        LENDER("Lender's Policy"),
        ENHANCED_OWNER("Enhanced Owner's Policy"),
        ALTA("ALTA Policy"),
        CLTA("CLTA Policy");

        private final String displayName;

        TitlePolicyType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Main Title Record
    // ============================================

    /**
     * Complete property title record combining all components
     */
    public record TitleRecord(
        @JsonProperty("title_id") String titleId,
        @JsonProperty("property_id") PropertyId propertyId,
        @JsonProperty("property_type") PropertyType propertyType,
        @JsonProperty("address") PropertyAddress address,
        @JsonProperty("location") GeoLocation location,
        @JsonProperty("legal_description") LegalDescription legalDescription,
        @JsonProperty("current_owners") List<Owner> currentOwners,
        @JsonProperty("chain_of_title") List<ChainOfTitleEntry> chainOfTitle,
        @JsonProperty("current_valuation") Valuation currentValuation,
        @JsonProperty("valuation_history") List<Valuation> valuationHistory,
        @JsonProperty("compliance") ComplianceStatus compliance,
        @JsonProperty("tokenization") TokenizationDetails tokenization,
        @JsonProperty("title_insurance") List<TitleInsurance> titleInsurance,
        @JsonProperty("status") TitleStatus status,
        @JsonProperty("created_at") Instant createdAt,
        @JsonProperty("updated_at") Instant updatedAt,
        @JsonProperty("created_by") String createdBy,
        @JsonProperty("metadata") Map<String, Object> metadata
    ) {
        /**
         * Calculate total ownership percentage
         */
        public BigDecimal totalOwnershipPercentage() {
            if (currentOwners == null || currentOwners.isEmpty()) {
                return BigDecimal.ZERO;
            }
            return currentOwners.stream()
                .map(Owner::ownershipPercentage)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        /**
         * Check if ownership is complete (100%)
         */
        public boolean isOwnershipComplete() {
            return totalOwnershipPercentage().compareTo(new BigDecimal("100")) == 0;
        }

        /**
         * Check if property is tokenized
         */
        public boolean isTokenized() {
            return tokenization != null && tokenization.tokenContractAddress() != null;
        }
    }

    /**
     * Title status enumeration
     */
    public enum TitleStatus {
        DRAFT("Draft"),
        PENDING_VERIFICATION("Pending Verification"),
        TITLE_SEARCH_IN_PROGRESS("Title Search In Progress"),
        CLEAR("Clear Title"),
        CLOUDED("Clouded Title"),
        ENCUMBERED("Encumbered"),
        DISPUTED("Disputed"),
        FORECLOSURE("In Foreclosure"),
        TRANSFERRED("Transferred"),
        TOKENIZED("Tokenized"),
        ARCHIVED("Archived");

        private final String displayName;

        TitleStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Builder for TitleRecord
    // ============================================

    /**
     * Builder class for creating TitleRecord instances
     */
    public static class TitleRecordBuilder {
        private String titleId;
        private PropertyId propertyId;
        private PropertyType propertyType;
        private PropertyAddress address;
        private GeoLocation location;
        private LegalDescription legalDescription;
        private List<Owner> currentOwners;
        private List<ChainOfTitleEntry> chainOfTitle;
        private Valuation currentValuation;
        private List<Valuation> valuationHistory;
        private ComplianceStatus compliance;
        private TokenizationDetails tokenization;
        private List<TitleInsurance> titleInsurance;
        private TitleStatus status;
        private Instant createdAt;
        private Instant updatedAt;
        private String createdBy;
        private Map<String, Object> metadata;

        public TitleRecordBuilder() {
            this.titleId = "TITLE-" + java.util.UUID.randomUUID().toString();
            this.createdAt = Instant.now();
            this.updatedAt = Instant.now();
            this.status = TitleStatus.DRAFT;
            this.currentOwners = List.of();
            this.chainOfTitle = List.of();
            this.valuationHistory = List.of();
            this.titleInsurance = List.of();
            this.metadata = Map.of();
        }

        public TitleRecordBuilder titleId(String titleId) { this.titleId = titleId; return this; }
        public TitleRecordBuilder propertyId(PropertyId propertyId) { this.propertyId = propertyId; return this; }
        public TitleRecordBuilder propertyType(PropertyType propertyType) { this.propertyType = propertyType; return this; }
        public TitleRecordBuilder address(PropertyAddress address) { this.address = address; return this; }
        public TitleRecordBuilder location(GeoLocation location) { this.location = location; return this; }
        public TitleRecordBuilder legalDescription(LegalDescription legalDescription) { this.legalDescription = legalDescription; return this; }
        public TitleRecordBuilder currentOwners(List<Owner> currentOwners) { this.currentOwners = currentOwners; return this; }
        public TitleRecordBuilder chainOfTitle(List<ChainOfTitleEntry> chainOfTitle) { this.chainOfTitle = chainOfTitle; return this; }
        public TitleRecordBuilder currentValuation(Valuation currentValuation) { this.currentValuation = currentValuation; return this; }
        public TitleRecordBuilder valuationHistory(List<Valuation> valuationHistory) { this.valuationHistory = valuationHistory; return this; }
        public TitleRecordBuilder compliance(ComplianceStatus compliance) { this.compliance = compliance; return this; }
        public TitleRecordBuilder tokenization(TokenizationDetails tokenization) { this.tokenization = tokenization; return this; }
        public TitleRecordBuilder titleInsurance(List<TitleInsurance> titleInsurance) { this.titleInsurance = titleInsurance; return this; }
        public TitleRecordBuilder status(TitleStatus status) { this.status = status; return this; }
        public TitleRecordBuilder createdBy(String createdBy) { this.createdBy = createdBy; return this; }
        public TitleRecordBuilder metadata(Map<String, Object> metadata) { this.metadata = metadata; return this; }

        public TitleRecord build() {
            return new TitleRecord(
                titleId, propertyId, propertyType, address, location, legalDescription,
                currentOwners, chainOfTitle, currentValuation, valuationHistory,
                compliance, tokenization, titleInsurance, status,
                createdAt, updatedAt, createdBy, metadata
            );
        }
    }

    public static TitleRecordBuilder builder() {
        return new TitleRecordBuilder();
    }
}
