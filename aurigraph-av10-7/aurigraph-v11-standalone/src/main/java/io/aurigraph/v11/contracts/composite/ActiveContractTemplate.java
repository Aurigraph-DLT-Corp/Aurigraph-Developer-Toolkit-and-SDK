package io.aurigraph.v11.contracts.composite;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Active Contract Template - Pre-defined contract configurations per Asset Category
 *
 * Each template defines:
 * - Required secondary token types (documents)
 * - Business rules specific to the asset category
 * - VVB verification requirements
 * - Default workflow configuration
 * - Jurisdiction-specific requirements
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-02
 */
public class ActiveContractTemplate {

    private String templateId;
    private String templateName;
    private String description;
    private AssetType assetType;
    private AssetCategory category;
    private int version;

    // Required Documents
    private List<RequiredDocument> requiredDocuments;

    // Business Rules
    private List<ActiveContract.BusinessRule> defaultRules;

    // Verification
    private int requiredVVBCount;
    private VerificationLevel minimumVerificationLevel;
    private List<String> acceptedVVBTypes;

    // Workflow
    private Duration defaultContractDuration;
    private boolean autoRenewal;
    private List<String> requiredApprovals;

    // Jurisdiction
    private List<String> supportedJurisdictions;
    private Map<String, List<RequiredDocument>> jurisdictionRequirements;

    // Metadata
    private Instant createdAt;
    private boolean active;

    /**
     * Asset Category - Major groupings of asset types
     */
    public enum AssetCategory {
        REAL_ESTATE("Real Estate & Property", "Property-based assets including residential, commercial, and land"),
        VEHICLES("Vehicles & Transport", "Transportation assets including cars, aircraft, and vessels"),
        COMMODITIES("Commodities", "Raw materials and tradeable goods"),
        INTELLECTUAL_PROPERTY("Intellectual Property", "Patents, trademarks, copyrights, and trade secrets"),
        FINANCIAL_INSTRUMENTS("Financial Instruments", "Bonds, equities, and derivatives"),
        ART_COLLECTIBLES("Art & Collectibles", "Artwork, antiques, and digital collectibles"),
        INFRASTRUCTURE("Infrastructure", "Public and private infrastructure assets"),
        ENVIRONMENTAL("Environmental Assets", "Carbon credits and environmental rights"),
        OTHER("Other Assets", "Miscellaneous asset types");

        private final String displayName;
        private final String description;

        AssetCategory(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }

        /**
         * Map AssetType to AssetCategory
         */
        public static AssetCategory fromAssetType(AssetType type) {
            return switch (type) {
                case REAL_ESTATE, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, LAND -> REAL_ESTATE;
                case VEHICLE, AIRCRAFT, VESSEL -> VEHICLES;
                case COMMODITY, PRECIOUS_METAL, ENERGY, AGRICULTURAL -> COMMODITIES;
                case IP, PATENT, TRADEMARK, COPYRIGHT, TRADE_SECRET -> INTELLECTUAL_PROPERTY;
                case FINANCIAL, BOND, EQUITY, DERIVATIVE -> FINANCIAL_INSTRUMENTS;
                case ART, COLLECTIBLE, NFT -> ART_COLLECTIBLES;
                case INFRASTRUCTURE -> INFRASTRUCTURE;
                case CARBON_CREDIT, ENVIRONMENTAL -> ENVIRONMENTAL;
                case OTHER -> OTHER;
            };
        }
    }

    /**
     * Required Document specification
     */
    public static class RequiredDocument {
        private SecondaryTokenType tokenType;
        private String documentName;
        private String description;
        private boolean mandatory;
        private boolean requiresVVBVerification;
        private Duration validityPeriod;
        private List<String> acceptedFormats;

        public RequiredDocument(SecondaryTokenType tokenType, String documentName, boolean mandatory) {
            this.tokenType = tokenType;
            this.documentName = documentName;
            this.mandatory = mandatory;
            this.requiresVVBVerification = false;
            this.acceptedFormats = List.of("PDF", "PNG", "JPG", "DOCX");
        }

        // Builder pattern
        public RequiredDocument description(String description) {
            this.description = description;
            return this;
        }

        public RequiredDocument requiresVerification() {
            this.requiresVVBVerification = true;
            return this;
        }

        public RequiredDocument validFor(Duration period) {
            this.validityPeriod = period;
            return this;
        }

        public RequiredDocument formats(String... formats) {
            this.acceptedFormats = List.of(formats);
            return this;
        }

        // Getters
        public SecondaryTokenType getTokenType() { return tokenType; }
        public String getDocumentName() { return documentName; }
        public String getDescription() { return description; }
        public boolean isMandatory() { return mandatory; }
        public boolean isRequiresVVBVerification() { return requiresVVBVerification; }
        public Duration getValidityPeriod() { return validityPeriod; }
        public List<String> getAcceptedFormats() { return acceptedFormats; }
    }

    private ActiveContractTemplate() {
        this.version = 1;
        this.requiredDocuments = new ArrayList<>();
        this.defaultRules = new ArrayList<>();
        this.acceptedVVBTypes = new ArrayList<>();
        this.requiredApprovals = new ArrayList<>();
        this.supportedJurisdictions = new ArrayList<>();
        this.jurisdictionRequirements = new HashMap<>();
        this.createdAt = Instant.now();
        this.active = true;
    }

    /**
     * Builder for ActiveContractTemplate
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private ActiveContractTemplate template = new ActiveContractTemplate();

        public Builder templateId(String templateId) {
            template.templateId = templateId;
            return this;
        }

        public Builder name(String name) {
            template.templateName = name;
            return this;
        }

        public Builder description(String description) {
            template.description = description;
            return this;
        }

        public Builder assetType(AssetType assetType) {
            template.assetType = assetType;
            template.category = AssetCategory.fromAssetType(assetType);
            return this;
        }

        public Builder category(AssetCategory category) {
            template.category = category;
            return this;
        }

        public Builder addRequiredDocument(RequiredDocument doc) {
            template.requiredDocuments.add(doc);
            return this;
        }

        public Builder addRule(ActiveContract.BusinessRule rule) {
            template.defaultRules.add(rule);
            return this;
        }

        public Builder vvbRequirements(int count, VerificationLevel level) {
            template.requiredVVBCount = count;
            template.minimumVerificationLevel = level;
            return this;
        }

        public Builder acceptVVBTypes(String... types) {
            template.acceptedVVBTypes = List.of(types);
            return this;
        }

        public Builder defaultDuration(Duration duration) {
            template.defaultContractDuration = duration;
            return this;
        }

        public Builder autoRenewal(boolean enabled) {
            template.autoRenewal = enabled;
            return this;
        }

        public Builder requiredApprovals(String... approvals) {
            template.requiredApprovals = List.of(approvals);
            return this;
        }

        public Builder jurisdictions(String... jurisdictions) {
            template.supportedJurisdictions = List.of(jurisdictions);
            return this;
        }

        public Builder addJurisdictionRequirement(String jurisdiction, List<RequiredDocument> docs) {
            template.jurisdictionRequirements.put(jurisdiction, docs);
            return this;
        }

        public ActiveContractTemplate build() {
            if (template.templateId == null) {
                template.templateId = "TPL-" + template.assetType.getPrefix() + "-" +
                                     System.currentTimeMillis() % 100000;
            }
            return template;
        }
    }

    // ==================== Getters ====================

    public String getTemplateId() { return templateId; }
    public String getTemplateName() { return templateName; }
    public String getDescription() { return description; }
    public AssetType getAssetType() { return assetType; }
    public AssetCategory getCategory() { return category; }
    public int getVersion() { return version; }
    public List<RequiredDocument> getRequiredDocuments() { return requiredDocuments; }
    public List<ActiveContract.BusinessRule> getDefaultRules() { return defaultRules; }
    public int getRequiredVVBCount() { return requiredVVBCount; }
    public VerificationLevel getMinimumVerificationLevel() { return minimumVerificationLevel; }
    public List<String> getAcceptedVVBTypes() { return acceptedVVBTypes; }
    public Duration getDefaultContractDuration() { return defaultContractDuration; }
    public boolean isAutoRenewal() { return autoRenewal; }
    public List<String> getRequiredApprovals() { return requiredApprovals; }
    public List<String> getSupportedJurisdictions() { return supportedJurisdictions; }
    public Map<String, List<RequiredDocument>> getJurisdictionRequirements() { return jurisdictionRequirements; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isActive() { return active; }

    /**
     * Get all required documents for a specific jurisdiction
     */
    public List<RequiredDocument> getRequiredDocumentsForJurisdiction(String jurisdiction) {
        List<RequiredDocument> docs = new ArrayList<>(requiredDocuments);
        if (jurisdictionRequirements.containsKey(jurisdiction)) {
            docs.addAll(jurisdictionRequirements.get(jurisdiction));
        }
        return docs;
    }

    /**
     * Get mandatory documents only
     */
    public List<RequiredDocument> getMandatoryDocuments() {
        return requiredDocuments.stream()
            .filter(RequiredDocument::isMandatory)
            .toList();
    }

    /**
     * Check if template supports jurisdiction
     */
    public boolean supportsJurisdiction(String jurisdiction) {
        return supportedJurisdictions.isEmpty() || supportedJurisdictions.contains(jurisdiction);
    }
}
