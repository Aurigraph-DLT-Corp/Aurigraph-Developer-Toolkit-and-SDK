package io.aurigraph.v11.rwa.carbon;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Carbon Project Model
 * Represents a carbon offset project that generates carbon credits.
 *
 * Supports various project types and methodologies across registries:
 * - Avoided deforestation (REDD+)
 * - Renewable energy (solar, wind, hydro)
 * - Energy efficiency
 * - Methane capture (landfill, agriculture)
 * - Afforestation/Reforestation
 * - Blue carbon (coastal ecosystems)
 * - Direct Air Capture (DAC)
 *
 * Compliant with:
 * - Verra VCS methodologies
 * - Gold Standard methodologies
 * - CDM methodologies
 * - Article 6.4 Sustainable Development Mechanism
 *
 * @author Aurigraph V12 - RWA Development Agent
 * @version 12.0.0
 * @since 2025-12-21
 */
public record CarbonProject(
    /**
     * Unique project identifier (e.g., "VCS-1234" or "GS-5678")
     */
    String projectId,

    /**
     * Human-readable project name
     */
    String projectName,

    /**
     * Detailed project description
     */
    String description,

    /**
     * Project type/category
     */
    ProjectType projectType,

    /**
     * Applied methodology (e.g., "VM0007", "ACM0002")
     */
    Methodology methodology,

    /**
     * Registry where project is registered
     */
    CarbonCredit.RegistryType registry,

    /**
     * Current verification status
     */
    VerificationStatus verificationStatus,

    /**
     * Project proponent/developer
     */
    ProjectProponent proponent,

    /**
     * Geographic location data
     */
    GeoLocation location,

    /**
     * Project crediting period
     */
    CreditingPeriod creditingPeriod,

    /**
     * Estimated annual emission reductions (tCO2e)
     */
    BigDecimal estimatedAnnualReductions,

    /**
     * Total credits issued to date
     */
    BigDecimal totalCreditsIssued,

    /**
     * Total credits retired to date
     */
    BigDecimal totalCreditsRetired,

    /**
     * Total credits available for trading
     */
    BigDecimal availableCredits,

    /**
     * Co-benefits provided by the project
     */
    List<CoBenefit> coBenefits,

    /**
     * UN Sustainable Development Goals alignment
     */
    Set<SDGGoal> sdgAlignment,

    /**
     * Project documentation references
     */
    ProjectDocumentation documentation,

    /**
     * MRV (Monitoring, Reporting, Verification) details
     */
    MRVDetails mrvDetails,

    /**
     * Additionality assessment
     */
    AdditionalityAssessment additionality,

    /**
     * Project creation timestamp
     */
    Instant createdAt,

    /**
     * Last update timestamp
     */
    Instant updatedAt,

    /**
     * Extended metadata
     */
    Map<String, Object> metadata
) {
    /**
     * Project type categories
     */
    public enum ProjectType {
        // Nature-Based Solutions
        AVOIDED_DEFORESTATION("Avoided Deforestation (REDD+)", "Nature-Based", true),
        AFFORESTATION("Afforestation/Reforestation", "Nature-Based", true),
        IMPROVED_FOREST_MANAGEMENT("Improved Forest Management", "Nature-Based", true),
        BLUE_CARBON("Blue Carbon (Coastal Ecosystems)", "Nature-Based", true),
        SOIL_CARBON("Soil Carbon Sequestration", "Nature-Based", true),
        PEATLAND_RESTORATION("Peatland Restoration", "Nature-Based", true),

        // Renewable Energy
        SOLAR_ENERGY("Solar Energy", "Renewable Energy", false),
        WIND_ENERGY("Wind Energy", "Renewable Energy", false),
        HYDROPOWER("Hydropower", "Renewable Energy", false),
        GEOTHERMAL("Geothermal Energy", "Renewable Energy", false),
        BIOMASS_ENERGY("Biomass Energy", "Renewable Energy", false),

        // Energy Efficiency
        INDUSTRIAL_EFFICIENCY("Industrial Energy Efficiency", "Energy Efficiency", false),
        BUILDING_EFFICIENCY("Building Energy Efficiency", "Energy Efficiency", false),
        TRANSPORT_EFFICIENCY("Transport Efficiency", "Energy Efficiency", false),
        COOKSTOVE("Clean Cookstoves", "Energy Efficiency", false),

        // Waste Management
        LANDFILL_GAS("Landfill Gas Capture", "Waste Management", false),
        METHANE_AVOIDANCE("Methane Avoidance", "Waste Management", false),
        WASTE_TO_ENERGY("Waste to Energy", "Waste Management", false),
        COMPOSTING("Composting", "Waste Management", false),

        // Agricultural
        RICE_CULTIVATION("Rice Cultivation Emission Reduction", "Agriculture", false),
        LIVESTOCK_METHANE("Livestock Methane Reduction", "Agriculture", false),
        FERTILIZER_MANAGEMENT("Fertilizer Management", "Agriculture", false),

        // Industrial
        INDUSTRIAL_GAS("Industrial Gas Destruction (HFC/N2O)", "Industrial", false),
        CEMENT_EMISSION("Cement Emission Reduction", "Industrial", false),
        FUGITIVE_EMISSIONS("Fugitive Emissions Reduction", "Industrial", false),

        // Carbon Removal (CDR)
        DIRECT_AIR_CAPTURE("Direct Air Capture (DAC)", "Carbon Removal", true),
        ENHANCED_WEATHERING("Enhanced Weathering", "Carbon Removal", true),
        BIOCHAR("Biochar", "Carbon Removal", true),
        BECCS("Bioenergy with Carbon Capture (BECCS)", "Carbon Removal", true);

        private final String description;
        private final String category;
        private final boolean isRemoval;

        ProjectType(String description, String category, boolean isRemoval) {
            this.description = description;
            this.category = category;
            this.isRemoval = isRemoval;
        }

        public String getDescription() {
            return description;
        }

        public String getCategory() {
            return category;
        }

        /**
         * Whether this is a carbon removal project (vs avoidance/reduction)
         */
        public boolean isRemoval() {
            return isRemoval;
        }
    }

    /**
     * Verification status of the project
     */
    public enum VerificationStatus {
        /** Initial registration, not yet validated */
        REGISTERED("Project registered, pending validation"),

        /** Under validation by VVB */
        UNDER_VALIDATION("Under validation by VVB"),

        /** Project design validated */
        VALIDATED("Project design validated"),

        /** Under verification for credit issuance */
        UNDER_VERIFICATION("Under verification"),

        /** Verified and credits can be issued */
        VERIFIED("Verified - credits can be issued"),

        /** Project listed and actively issuing credits */
        ACTIVE("Active - issuing credits"),

        /** Verification failed */
        REJECTED("Verification rejected"),

        /** Project suspended due to issues */
        SUSPENDED("Project suspended"),

        /** Crediting period ended */
        COMPLETED("Crediting period completed"),

        /** Project cancelled/withdrawn */
        CANCELLED("Project cancelled");

        private final String description;

        VerificationStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }

        /**
         * Check if project can issue credits in this status
         */
        public boolean canIssueCredits() {
            return this == VERIFIED || this == ACTIVE;
        }
    }

    /**
     * Applied methodology details
     */
    public record Methodology(
        /** Methodology ID (e.g., "VM0007", "ACM0002") */
        String methodologyId,

        /** Full methodology name */
        String name,

        /** Methodology version */
        String version,

        /** Issuing body (Verra, Gold Standard, CDM) */
        String issuingBody,

        /** Methodology scope */
        String scope,

        /** Applicability conditions */
        List<String> applicabilityConditions,

        /** Baseline calculation approach */
        String baselineApproach,

        /** Monitoring requirements */
        String monitoringRequirements
    ) {}

    /**
     * Project proponent (developer) information
     */
    public record ProjectProponent(
        /** Organization name */
        String organizationName,

        /** Legal entity type */
        String entityType,

        /** Country of registration */
        String country,

        /** Contact information */
        String contactEmail,

        /** Website */
        String website,

        /** Registry account ID */
        String registryAccountId,

        /** Wallet address for credit receipts */
        String walletAddress
    ) {}

    /**
     * Geographic location with GeoJSON support
     */
    public record GeoLocation(
        /** Country */
        String country,

        /** Region/State/Province */
        String region,

        /** Specific location name */
        String locationName,

        /** Latitude (decimal degrees) */
        Double latitude,

        /** Longitude (decimal degrees) */
        Double longitude,

        /** Total project area in hectares */
        BigDecimal areaHectares,

        /** GeoJSON boundary (for nature-based projects) */
        String geoJsonBoundary,

        /** Nested jurisdictional level (for REDD+) */
        String jurisdiction
    ) {
        /**
         * Check if location has valid coordinates
         */
        public boolean hasValidCoordinates() {
            return latitude != null && longitude != null &&
                   latitude >= -90 && latitude <= 90 &&
                   longitude >= -180 && longitude <= 180;
        }
    }

    /**
     * Project crediting period
     */
    public record CreditingPeriod(
        /** Start date of crediting */
        LocalDate startDate,

        /** End date of crediting */
        LocalDate endDate,

        /** Whether period is renewable */
        boolean renewable,

        /** Number of renewal periods allowed */
        int renewalPeriods,

        /** Current period number (1 = first) */
        int currentPeriod
    ) {
        /**
         * Check if currently within crediting period
         */
        public boolean isActive() {
            LocalDate now = LocalDate.now();
            return !now.isBefore(startDate) && !now.isAfter(endDate);
        }

        /**
         * Get remaining years in current period
         */
        public long remainingYears() {
            return java.time.temporal.ChronoUnit.YEARS.between(LocalDate.now(), endDate);
        }
    }

    /**
     * Project co-benefits beyond carbon reduction
     */
    public record CoBenefit(
        /** Co-benefit type */
        CoBenefitType type,

        /** Description of the benefit */
        String description,

        /** Quantified impact if measurable */
        String quantifiedImpact,

        /** Third-party verification of co-benefit */
        boolean thirdPartyVerified,

        /** Certification standard (e.g., CCB, SD VISta) */
        String certificationStandard
    ) {
        public enum CoBenefitType {
            BIODIVERSITY("Biodiversity Conservation"),
            WATER("Water Resources Protection"),
            SOIL("Soil Conservation"),
            AIR_QUALITY("Air Quality Improvement"),
            EMPLOYMENT("Job Creation"),
            INCOME("Income Generation"),
            HEALTH("Health Benefits"),
            EDUCATION("Educational Opportunities"),
            GENDER_EQUALITY("Gender Equality"),
            COMMUNITY_DEVELOPMENT("Community Development"),
            FOOD_SECURITY("Food Security"),
            ENERGY_ACCESS("Clean Energy Access"),
            TECHNOLOGY_TRANSFER("Technology Transfer"),
            CLIMATE_ADAPTATION("Climate Adaptation");

            private final String description;

            CoBenefitType(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }
    }

    /**
     * UN Sustainable Development Goals
     */
    public enum SDGGoal {
        SDG_1("No Poverty"),
        SDG_2("Zero Hunger"),
        SDG_3("Good Health and Well-being"),
        SDG_4("Quality Education"),
        SDG_5("Gender Equality"),
        SDG_6("Clean Water and Sanitation"),
        SDG_7("Affordable and Clean Energy"),
        SDG_8("Decent Work and Economic Growth"),
        SDG_9("Industry, Innovation and Infrastructure"),
        SDG_10("Reduced Inequalities"),
        SDG_11("Sustainable Cities and Communities"),
        SDG_12("Responsible Consumption and Production"),
        SDG_13("Climate Action"),
        SDG_14("Life Below Water"),
        SDG_15("Life on Land"),
        SDG_16("Peace, Justice and Strong Institutions"),
        SDG_17("Partnerships for the Goals");

        private final String description;

        SDGGoal(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Project documentation references
     */
    public record ProjectDocumentation(
        /** Project Design Document (PDD) hash/URL */
        String pddReference,

        /** Validation report hash/URL */
        String validationReport,

        /** Verification reports list */
        List<String> verificationReports,

        /** Monitoring reports list */
        List<String> monitoringReports,

        /** Environmental impact assessment */
        String environmentalImpactAssessment,

        /** Social impact assessment */
        String socialImpactAssessment,

        /** Stakeholder consultation report */
        String stakeholderConsultation,

        /** IPFS/Arweave permanent storage hashes */
        Map<String, String> permanentStorageHashes
    ) {}

    /**
     * MRV (Monitoring, Reporting, Verification) details
     */
    public record MRVDetails(
        /** Monitoring frequency */
        MonitoringFrequency monitoringFrequency,

        /** Last monitoring date */
        LocalDate lastMonitoringDate,

        /** Next verification due date */
        LocalDate nextVerificationDue,

        /** Assigned VVB (Validation/Verification Body) */
        String assignedVVB,

        /** Remote sensing/IoT integration */
        boolean hasRemoteSensing,

        /** Data collection methods */
        List<String> dataCollectionMethods,

        /** Baseline recalculation interval (years) */
        int baselineRecalculationInterval,

        /** Uncertainty quantification (%) */
        BigDecimal uncertaintyPercent
    ) {
        public enum MonitoringFrequency {
            CONTINUOUS("Continuous IoT monitoring"),
            DAILY("Daily"),
            WEEKLY("Weekly"),
            MONTHLY("Monthly"),
            QUARTERLY("Quarterly"),
            SEMI_ANNUALLY("Semi-annually"),
            ANNUALLY("Annually");

            private final String description;

            MonitoringFrequency(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }
    }

    /**
     * Additionality assessment details
     */
    public record AdditionalityAssessment(
        /** Assessment approach used */
        AdditionalityApproach approach,

        /** Investment analysis result */
        String investmentAnalysis,

        /** Barrier analysis result */
        String barrierAnalysis,

        /** Common practice analysis */
        String commonPracticeAnalysis,

        /** Prior consideration demonstration */
        LocalDate priorConsiderationDate,

        /** Overall additionality confirmed */
        boolean additionalityConfirmed,

        /** Assessment date */
        LocalDate assessmentDate,

        /** Assessor/VVB */
        String assessor
    ) {
        public enum AdditionalityApproach {
            INVESTMENT_ANALYSIS("Investment Analysis"),
            BARRIER_ANALYSIS("Barrier Analysis"),
            COMBINED("Combined Investment and Barrier Analysis"),
            POSITIVE_LIST("Positive List"),
            ACTIVITY_PENETRATION("Activity Penetration"),
            PERFORMANCE_BENCHMARK("Performance Benchmark");

            private final String description;

            AdditionalityApproach(String description) {
                this.description = description;
            }

            public String getDescription() {
                return description;
            }
        }
    }

    // Compact constructor for validation
    public CarbonProject {
        Objects.requireNonNull(projectId, "Project ID cannot be null");
        Objects.requireNonNull(projectName, "Project name cannot be null");
        Objects.requireNonNull(projectType, "Project type cannot be null");
        Objects.requireNonNull(verificationStatus, "Verification status cannot be null");
        Objects.requireNonNull(registry, "Registry cannot be null");

        if (estimatedAnnualReductions != null && estimatedAnnualReductions.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Estimated annual reductions cannot be negative");
        }
    }

    /**
     * Check if project can issue new credits
     */
    public boolean canIssueCredits() {
        return verificationStatus.canIssueCredits() &&
               (creditingPeriod == null || creditingPeriod.isActive());
    }

    /**
     * Get credit utilization ratio
     */
    public BigDecimal getCreditUtilization() {
        if (totalCreditsIssued == null || totalCreditsIssued.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (totalCreditsRetired == null) {
            return BigDecimal.ZERO;
        }
        return totalCreditsRetired.divide(totalCreditsIssued, 4, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Check if project is a carbon removal type
     */
    public boolean isRemovalProject() {
        return projectType.isRemoval();
    }

    /**
     * Create a builder for CarbonProject
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder pattern for CarbonProject
     */
    public static class Builder {
        private String projectId;
        private String projectName;
        private String description;
        private ProjectType projectType;
        private Methodology methodology;
        private CarbonCredit.RegistryType registry;
        private VerificationStatus verificationStatus = VerificationStatus.REGISTERED;
        private ProjectProponent proponent;
        private GeoLocation location;
        private CreditingPeriod creditingPeriod;
        private BigDecimal estimatedAnnualReductions;
        private BigDecimal totalCreditsIssued = BigDecimal.ZERO;
        private BigDecimal totalCreditsRetired = BigDecimal.ZERO;
        private BigDecimal availableCredits = BigDecimal.ZERO;
        private List<CoBenefit> coBenefits = List.of();
        private Set<SDGGoal> sdgAlignment = Set.of(SDGGoal.SDG_13);
        private ProjectDocumentation documentation;
        private MRVDetails mrvDetails;
        private AdditionalityAssessment additionality;
        private Instant createdAt = Instant.now();
        private Instant updatedAt = Instant.now();
        private Map<String, Object> metadata = Map.of();

        public Builder projectId(String projectId) {
            this.projectId = projectId;
            return this;
        }

        public Builder projectName(String projectName) {
            this.projectName = projectName;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder projectType(ProjectType projectType) {
            this.projectType = projectType;
            return this;
        }

        public Builder methodology(Methodology methodology) {
            this.methodology = methodology;
            return this;
        }

        public Builder registry(CarbonCredit.RegistryType registry) {
            this.registry = registry;
            return this;
        }

        public Builder verificationStatus(VerificationStatus verificationStatus) {
            this.verificationStatus = verificationStatus;
            return this;
        }

        public Builder proponent(ProjectProponent proponent) {
            this.proponent = proponent;
            return this;
        }

        public Builder location(GeoLocation location) {
            this.location = location;
            return this;
        }

        public Builder creditingPeriod(CreditingPeriod creditingPeriod) {
            this.creditingPeriod = creditingPeriod;
            return this;
        }

        public Builder estimatedAnnualReductions(BigDecimal estimatedAnnualReductions) {
            this.estimatedAnnualReductions = estimatedAnnualReductions;
            return this;
        }

        public Builder totalCreditsIssued(BigDecimal totalCreditsIssued) {
            this.totalCreditsIssued = totalCreditsIssued;
            return this;
        }

        public Builder totalCreditsRetired(BigDecimal totalCreditsRetired) {
            this.totalCreditsRetired = totalCreditsRetired;
            return this;
        }

        public Builder availableCredits(BigDecimal availableCredits) {
            this.availableCredits = availableCredits;
            return this;
        }

        public Builder coBenefits(List<CoBenefit> coBenefits) {
            this.coBenefits = coBenefits;
            return this;
        }

        public Builder sdgAlignment(Set<SDGGoal> sdgAlignment) {
            this.sdgAlignment = sdgAlignment;
            return this;
        }

        public Builder documentation(ProjectDocumentation documentation) {
            this.documentation = documentation;
            return this;
        }

        public Builder mrvDetails(MRVDetails mrvDetails) {
            this.mrvDetails = mrvDetails;
            return this;
        }

        public Builder additionality(AdditionalityAssessment additionality) {
            this.additionality = additionality;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public CarbonProject build() {
            return new CarbonProject(
                projectId, projectName, description, projectType, methodology,
                registry, verificationStatus, proponent, location, creditingPeriod,
                estimatedAnnualReductions, totalCreditsIssued, totalCreditsRetired,
                availableCredits, coBenefits, sdgAlignment, documentation,
                mrvDetails, additionality, createdAt, updatedAt, metadata
            );
        }
    }
}
