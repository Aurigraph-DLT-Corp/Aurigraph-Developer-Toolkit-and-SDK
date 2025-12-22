package io.aurigraph.v11.rwa.carbon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Carbon Credit Model
 * Represents a carbon credit (carbon offset) unit on the Aurigraph DLT platform.
 *
 * Supports multiple registry standards:
 * - Verra VCS (Verified Carbon Standard) - VCU (Verified Carbon Unit)
 * - Gold Standard - VER (Verified Emission Reduction)
 * - American Carbon Registry (ACR) - ERTs (Emission Reduction Tonnes)
 * - Climate Action Reserve (CAR) - CRT (Climate Reserve Tonnes)
 * - Clean Development Mechanism - CER (Certified Emission Reduction)
 *
 * Compliant with:
 * - Paris Agreement Article 6.2 (Corresponding Adjustments)
 * - ICAO CORSIA (Carbon Offsetting and Reduction Scheme for International Aviation)
 * - SBTi (Science Based Targets initiative) guidelines
 *
 * @author Aurigraph V12 - RWA Development Agent
 * @version 12.0.0
 * @since 2025-12-21
 */
public record CarbonCredit(
    /**
     * Unique credit serial number (e.g., "VCU-123-456-789-2024-001")
     * Format varies by registry but typically includes project ID and vintage
     */
    String creditId,

    /**
     * Reference to the originating carbon project
     */
    String projectId,

    /**
     * The year in which the emission reduction occurred
     * Critical for market value - older vintages typically worth less
     */
    int vintageYear,

    /**
     * Type of carbon credit (VCU, CER, VER, ERT, CRT)
     */
    CreditType creditType,

    /**
     * Current status of the credit
     */
    CreditStatus status,

    /**
     * Issuing registry (Verra, Gold Standard, ACR, CAR, CDM)
     */
    RegistryType registry,

    /**
     * Amount of CO2 equivalent in metric tonnes (typically 1.0 per credit)
     */
    BigDecimal co2eTonnes,

    /**
     * Current holder/owner wallet address
     */
    String ownerAddress,

    /**
     * Original issuance timestamp
     */
    Instant issuedAt,

    /**
     * Retirement details if credit has been retired
     */
    RetirementDetails retirementDetails,

    /**
     * Corresponding adjustment reference for Article 6 compliance
     */
    CorrespondingAdjustment correspondingAdjustment,

    /**
     * On-chain transaction hash for credit creation
     */
    String transactionHash,

    /**
     * Merkle proof for credit authenticity verification
     */
    String merkleRoot,

    /**
     * Extended metadata (project details, methodology, location, etc.)
     */
    Map<String, Object> metadata
) {
    /**
     * Credit types supported across registries
     */
    public enum CreditType {
        /** Verra Verified Carbon Unit */
        VCU("Verified Carbon Unit", "Verra VCS"),

        /** Gold Standard Verified Emission Reduction */
        VER("Verified Emission Reduction", "Gold Standard"),

        /** Clean Development Mechanism Certified Emission Reduction */
        CER("Certified Emission Reduction", "UNFCCC CDM"),

        /** American Carbon Registry Emission Reduction Tonnes */
        ERT("Emission Reduction Tonnes", "ACR"),

        /** Climate Action Reserve Climate Reserve Tonnes */
        CRT("Climate Reserve Tonnes", "CAR"),

        /** EU Allowance Unit */
        EUA("EU Allowance Unit", "EU ETS"),

        /** Removal Unit (carbon removal vs avoidance) */
        RMU("Removal Unit", "Various");

        private final String description;
        private final String standardBody;

        CreditType(String description, String standardBody) {
            this.description = description;
            this.standardBody = standardBody;
        }

        public String getDescription() {
            return description;
        }

        public String getStandardBody() {
            return standardBody;
        }
    }

    /**
     * Credit lifecycle status
     */
    public enum CreditStatus {
        /** Credit issued but not yet active/tradable */
        PENDING("Credit pending verification"),

        /** Credit active and available for trading */
        ACTIVE("Credit active and tradable"),

        /** Credit transferred to new owner (interim state) */
        TRANSFERRED("Credit in transfer"),

        /** Credit listed on marketplace */
        LISTED("Credit listed for sale"),

        /** Credit locked for retirement processing */
        LOCKED("Credit locked for retirement"),

        /** Credit permanently retired - cannot be traded */
        RETIRED("Credit permanently retired"),

        /** Credit cancelled (due to reversal, fraud, etc.) */
        CANCELLED("Credit cancelled"),

        /** Credit expired (past validity period) */
        EXPIRED("Credit expired"),

        /** Credit under investigation for issues */
        SUSPENDED("Credit suspended for review");

        private final String description;

        CreditStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }

        /**
         * Check if credit can be traded in this status
         */
        public boolean isTradable() {
            return this == ACTIVE || this == LISTED;
        }

        /**
         * Check if this is a terminal status (no further transitions)
         */
        public boolean isTerminal() {
            return this == RETIRED || this == CANCELLED || this == EXPIRED;
        }
    }

    /**
     * Supported carbon registries
     */
    public enum RegistryType {
        /** Verra - Verified Carbon Standard */
        VERRA("Verra", "VCS", "https://registry.verra.org"),

        /** Gold Standard */
        GOLD_STANDARD("Gold Standard", "GS", "https://registry.goldstandard.org"),

        /** American Carbon Registry */
        ACR("American Carbon Registry", "ACR", "https://acr2.apx.com"),

        /** Climate Action Reserve */
        CAR("Climate Action Reserve", "CAR", "https://thereserve2.apx.com"),

        /** UNFCCC Clean Development Mechanism */
        CDM("Clean Development Mechanism", "CDM", "https://cdm.unfccc.int"),

        /** European Union Emissions Trading System */
        EU_ETS("EU Emissions Trading System", "EU-ETS", "https://ec.europa.eu"),

        /** Aurigraph Native Registry */
        AURIGRAPH("Aurigraph Carbon Registry", "AUR", "https://carbon.aurigraph.io");

        private final String name;
        private final String code;
        private final String registryUrl;

        RegistryType(String name, String code, String registryUrl) {
            this.name = name;
            this.code = code;
            this.registryUrl = registryUrl;
        }

        public String getName() {
            return name;
        }

        public String getCode() {
            return code;
        }

        public String getRegistryUrl() {
            return registryUrl;
        }
    }

    /**
     * Retirement details for retired credits
     */
    public record RetirementDetails(
        /** Unique retirement certificate ID */
        String retirementId,

        /** Beneficiary name (person/organization claiming the offset) */
        String beneficiaryName,

        /** Beneficiary account/address */
        String beneficiaryAddress,

        /** Purpose/reason for retirement */
        RetirementPurpose purpose,

        /** Custom retirement message/claim */
        String retirementMessage,

        /** Timestamp of retirement */
        Instant retiredAt,

        /** Retirement certificate URL/hash */
        String certificateUrl,

        /** On-chain retirement transaction hash */
        String retirementTxHash,

        /** Optional: Emissions year being offset */
        Integer offsetYear,

        /** Optional: Specific emissions source being offset */
        String emissionsSource
    ) {
        /**
         * Retirement purpose categories
         */
        public enum RetirementPurpose {
            /** Voluntary corporate net-zero commitment */
            CORPORATE_NEUTRALITY("Corporate Carbon Neutrality"),

            /** Product/service carbon footprint offsetting */
            PRODUCT_OFFSET("Product Carbon Offset"),

            /** Regulatory compliance (e.g., CORSIA, EU ETS) */
            COMPLIANCE("Regulatory Compliance"),

            /** Event carbon offsetting */
            EVENT_OFFSET("Event Carbon Offset"),

            /** Individual/personal offsetting */
            PERSONAL_OFFSET("Personal Carbon Offset"),

            /** Reselling prevention (permanent removal from market) */
            VOLUNTARY_CANCELLATION("Voluntary Cancellation"),

            /** Science Based Targets initiative compliance */
            SBTI_COMPLIANCE("SBTi Compliance"),

            /** CORSIA aviation offsetting */
            CORSIA_COMPLIANCE("CORSIA Aviation Offset"),

            /** Supply chain emissions offsetting */
            SCOPE3_OFFSET("Scope 3 Emissions Offset");

            private final String description;

            RetirementPurpose(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }
    }

    /**
     * Corresponding Adjustment for Paris Agreement Article 6.2 compliance
     * Prevents double counting between countries
     */
    public record CorrespondingAdjustment(
        /** Host country making the adjustment */
        String hostCountry,

        /** Acquiring country/entity */
        String acquiringCountry,

        /** Authorization ID from host country */
        String authorizationId,

        /** Whether adjustment has been applied */
        boolean adjustmentApplied,

        /** NDC (Nationally Determined Contribution) period */
        String ndcPeriod,

        /** ITMO (Internationally Transferred Mitigation Outcome) reference */
        String itmoReference,

        /** Timestamp of adjustment application */
        Instant adjustmentTimestamp
    ) {}

    // Compact constructor for validation
    public CarbonCredit {
        Objects.requireNonNull(creditId, "Credit ID cannot be null");
        Objects.requireNonNull(projectId, "Project ID cannot be null");
        Objects.requireNonNull(creditType, "Credit type cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");
        Objects.requireNonNull(registry, "Registry cannot be null");

        if (vintageYear < 2000 || vintageYear > 2100) {
            throw new IllegalArgumentException("Vintage year must be between 2000 and 2100");
        }

        if (co2eTonnes != null && co2eTonnes.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("CO2e tonnes must be positive");
        }

        // Ensure retirement details exist if status is RETIRED
        if (status == CreditStatus.RETIRED && retirementDetails == null) {
            throw new IllegalArgumentException("Retirement details required for retired credits");
        }
    }

    /**
     * Check if this credit is eligible for transfer
     */
    public boolean isTransferable() {
        return status.isTradable() &&
               (correspondingAdjustment == null || correspondingAdjustment.adjustmentApplied());
    }

    /**
     * Check if this credit is eligible for retirement
     */
    public boolean isRetirable() {
        return status == CreditStatus.ACTIVE || status == CreditStatus.LOCKED;
    }

    /**
     * Check if this credit has Article 6 compliance
     */
    public boolean hasArticle6Compliance() {
        return correspondingAdjustment != null && correspondingAdjustment.adjustmentApplied();
    }

    /**
     * Get credit age in years from vintage
     */
    public int getCreditAge() {
        return java.time.Year.now().getValue() - vintageYear;
    }

    /**
     * Create a builder for CarbonCredit
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder pattern for CarbonCredit
     */
    public static class Builder {
        private String creditId;
        private String projectId;
        private int vintageYear;
        private CreditType creditType;
        private CreditStatus status = CreditStatus.PENDING;
        private RegistryType registry;
        private BigDecimal co2eTonnes = BigDecimal.ONE;
        private String ownerAddress;
        private Instant issuedAt = Instant.now();
        private RetirementDetails retirementDetails;
        private CorrespondingAdjustment correspondingAdjustment;
        private String transactionHash;
        private String merkleRoot;
        private Map<String, Object> metadata = Map.of();

        public Builder creditId(String creditId) {
            this.creditId = creditId;
            return this;
        }

        public Builder projectId(String projectId) {
            this.projectId = projectId;
            return this;
        }

        public Builder vintageYear(int vintageYear) {
            this.vintageYear = vintageYear;
            return this;
        }

        public Builder creditType(CreditType creditType) {
            this.creditType = creditType;
            return this;
        }

        public Builder status(CreditStatus status) {
            this.status = status;
            return this;
        }

        public Builder registry(RegistryType registry) {
            this.registry = registry;
            return this;
        }

        public Builder co2eTonnes(BigDecimal co2eTonnes) {
            this.co2eTonnes = co2eTonnes;
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            this.ownerAddress = ownerAddress;
            return this;
        }

        public Builder issuedAt(Instant issuedAt) {
            this.issuedAt = issuedAt;
            return this;
        }

        public Builder retirementDetails(RetirementDetails retirementDetails) {
            this.retirementDetails = retirementDetails;
            return this;
        }

        public Builder correspondingAdjustment(CorrespondingAdjustment correspondingAdjustment) {
            this.correspondingAdjustment = correspondingAdjustment;
            return this;
        }

        public Builder transactionHash(String transactionHash) {
            this.transactionHash = transactionHash;
            return this;
        }

        public Builder merkleRoot(String merkleRoot) {
            this.merkleRoot = merkleRoot;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public CarbonCredit build() {
            return new CarbonCredit(
                creditId, projectId, vintageYear, creditType, status, registry,
                co2eTonnes, ownerAddress, issuedAt, retirementDetails,
                correspondingAdjustment, transactionHash, merkleRoot, metadata
            );
        }
    }
}
