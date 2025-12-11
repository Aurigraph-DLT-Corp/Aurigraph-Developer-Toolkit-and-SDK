package io.aurigraph.v11.contracts.composite;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Contract Library Service - Versioned library for Active and Smart Contract Templates
 *
 * Manages:
 * - Active Contract Templates (business workflows, RBAC, rules)
 * - Smart Contract Templates (blockchain-executable contracts)
 * - Version control and upgrade paths
 * - Template instantiation
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-04
 */
@ApplicationScoped
public class ContractLibraryService {

    // Library version
    public static final String LIBRARY_VERSION = "1.0.0";

    // Template storage with version history
    private final Map<String, ActiveContractTemplate> activeTemplates = new ConcurrentHashMap<>();
    private final Map<String, SmartContractTemplate> smartTemplates = new ConcurrentHashMap<>();

    // Version history: templateId -> List of versions
    private final Map<String, List<String>> activeTemplateVersions = new ConcurrentHashMap<>();
    private final Map<String, List<String>> smartTemplateVersions = new ConcurrentHashMap<>();

    // Category index for quick lookup
    private final Map<ActiveContractTemplate.AssetCategory, List<String>> activeByCategory = new ConcurrentHashMap<>();
    private final Map<ActiveContractTemplate.AssetCategory, List<String>> smartByCategory = new ConcurrentHashMap<>();

    @PostConstruct
    void initialize() {
        Log.info("Initializing Contract Library Service v" + LIBRARY_VERSION);
        initializeActiveContractTemplates();
        initializeSmartContractTemplates();
        Log.infof("Contract Library initialized: %d Active templates, %d Smart templates",
            activeTemplates.size(), smartTemplates.size());
    }

    // ==================== ACTIVE CONTRACT TEMPLATES ====================

    private void initializeActiveContractTemplates() {
        // Real Estate Templates
        registerActiveTemplate(createRealEstateTemplate());
        registerActiveTemplate(createResidentialTemplate());
        registerActiveTemplate(createCommercialTemplate());
        registerActiveTemplate(createIndustrialTemplate());
        registerActiveTemplate(createLandTemplate());

        // Vehicle Templates
        registerActiveTemplate(createVehicleTemplate());
        registerActiveTemplate(createAircraftTemplate());
        registerActiveTemplate(createVesselTemplate());

        // Commodity Templates
        registerActiveTemplate(createCommodityTemplate());
        registerActiveTemplate(createPreciousMetalTemplate());
        registerActiveTemplate(createEnergyTemplate());
        registerActiveTemplate(createAgriculturalTemplate());

        // Intellectual Property Templates
        registerActiveTemplate(createIPTemplate());
        registerActiveTemplate(createPatentTemplate());
        registerActiveTemplate(createTrademarkTemplate());
        registerActiveTemplate(createCopyrightTemplate());

        // Financial Instrument Templates
        registerActiveTemplate(createFinancialTemplate());
        registerActiveTemplate(createBondTemplate());
        registerActiveTemplate(createEquityTemplate());
        registerActiveTemplate(createDerivativeTemplate());

        // Art & Collectibles Templates
        registerActiveTemplate(createArtTemplate());
        registerActiveTemplate(createCollectibleTemplate());
        registerActiveTemplate(createNFTTemplate());

        // Infrastructure Template
        registerActiveTemplate(createInfrastructureTemplate());

        // Environmental Templates
        registerActiveTemplate(createCarbonCreditTemplate());
        registerActiveTemplate(createEnvironmentalTemplate());
    }

    private ActiveContractTemplate createRealEstateTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-RE-001")
            .name("Real Estate Standard Contract")
            .description("Standard active contract for real estate tokenization")
            .assetType(AssetType.REAL_ESTATE)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .acceptVVBTypes("PropertyAppraiser", "LegalVerifier", "TitleCompany")
            .defaultDuration(Duration.ofDays(365 * 10))
            .autoRenewal(true)
            .requiredApprovals("Owner", "VVB", "Legal")
            .jurisdictions("US", "UK", "EU", "UAE", "SG", "IN")
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Property Title Deed", true)
                .description("Official property title document")
                .requiresVerification()
                .validFor(Duration.ofDays(365)))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.OWNER_KYC, "Owner KYC Documents", true)
                .description("Know Your Customer verification"))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Property Appraisal", true)
                .description("Professional property valuation")
                .requiresVerification()
                .validFor(Duration.ofDays(180)))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TAX_RECEIPT, "Property Tax Receipt", true)
                .description("Latest property tax payment receipt"))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSURANCE, "Property Insurance", false)
                .description("Property insurance policy"))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.SURVEY, "Land Survey", false)
                .description("Recent land survey document"))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PHOTO_GALLERY, "Property Photos", true)
                .description("Property photo documentation")
                .formats("PNG", "JPG", "WEBP"))
            .addRule(createValidationRule("PROPERTY_VALUE_CHECK",
                "Verify property value within market range"))
            .addRule(createConditionRule("CLEAR_TITLE",
                "Title must be clear of encumbrances"))
            .addRule(createConstraintRule("FRACTIONAL_MIN",
                "Minimum fraction size: 0.01%"))
            .build();
    }

    private ActiveContractTemplate createResidentialTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-RES-001")
            .name("Residential Property Contract")
            .description("Contract template for residential properties")
            .assetType(AssetType.RESIDENTIAL)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .acceptVVBTypes("ResidentialAppraiser", "TitleCompany")
            .defaultDuration(Duration.ofDays(365 * 5))
            .autoRenewal(true)
            .jurisdictions("US", "UK", "EU", "AU", "CA")
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Property Deed", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.OWNER_KYC, "Owner Verification", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Home Appraisal", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Home Inspection Report", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PHOTO_GALLERY, "Property Photos", true))
            .build();
    }

    private ActiveContractTemplate createCommercialTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-COM-001")
            .name("Commercial Property Contract")
            .description("Contract template for commercial real estate")
            .assetType(AssetType.COMMERCIAL)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .defaultDuration(Duration.ofDays(365 * 10))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Commercial Title", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Commercial Appraisal", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Environmental Assessment", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PERMIT, "Zoning Permits", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.FINANCIAL_STATEMENT, "Income Statement", false))
            .build();
    }

    private ActiveContractTemplate createIndustrialTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-IND-001")
            .name("Industrial Property Contract")
            .assetType(AssetType.INDUSTRIAL)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Industrial Title", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Environmental Compliance", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PERMIT, "Operating Permits", true))
            .build();
    }

    private ActiveContractTemplate createLandTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-LND-001")
            .name("Land Contract")
            .assetType(AssetType.LAND)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Land Title", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.SURVEY, "Land Survey", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Soil Assessment", false))
            .build();
    }

    private ActiveContractTemplate createVehicleTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-VEH-001")
            .name("Vehicle Contract")
            .assetType(AssetType.VEHICLE)
            .vvbRequirements(1, VerificationLevel.ENHANCED)
            .defaultDuration(Duration.ofDays(365 * 5))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Vehicle Title", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.OWNER_KYC, "Owner ID", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Vehicle Inspection", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSURANCE, "Vehicle Insurance", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PHOTO_GALLERY, "Vehicle Photos", true))
            .build();
    }

    private ActiveContractTemplate createAircraftTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-AIR-001")
            .name("Aircraft Contract")
            .assetType(AssetType.AIRCRAFT)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Aircraft Registration", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Airworthiness Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Maintenance Log", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSURANCE, "Aviation Insurance", true))
            .build();
    }

    private ActiveContractTemplate createVesselTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-VSL-001")
            .name("Vessel Contract")
            .assetType(AssetType.VESSEL)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.TITLE_DEED, "Vessel Registration", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Safety Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Marine Survey", true)
                .requiresVerification())
            .build();
    }

    private ActiveContractTemplate createCommodityTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-CMD-001")
            .name("Commodity Contract")
            .assetType(AssetType.COMMODITY)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Commodity Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Quality Inspection", true))
            .build();
    }

    private ActiveContractTemplate createPreciousMetalTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-PM-001")
            .name("Precious Metal Contract")
            .assetType(AssetType.PRECIOUS_METAL)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Assay Certificate", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PROOF_OF_FUNDS, "Custody Proof", true))
            .build();
    }

    private ActiveContractTemplate createEnergyTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-ENG-001")
            .name("Energy Asset Contract")
            .assetType(AssetType.ENERGY)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.LICENSE, "Energy License", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Environmental Permit", true))
            .build();
    }

    private ActiveContractTemplate createAgriculturalTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-AGR-001")
            .name("Agricultural Asset Contract")
            .assetType(AssetType.AGRICULTURAL)
            .vvbRequirements(1, VerificationLevel.ENHANCED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Agricultural Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSPECTION, "Quality Inspection", true))
            .build();
    }

    private ActiveContractTemplate createIPTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-IP-001")
            .name("Intellectual Property Contract")
            .assetType(AssetType.IP)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "IP Registration", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.AGREEMENT, "License Agreement", false))
            .build();
    }

    private ActiveContractTemplate createPatentTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-PAT-001")
            .name("Patent Contract")
            .assetType(AssetType.PATENT)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Patent Certificate", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Patent Valuation", true))
            .build();
    }

    private ActiveContractTemplate createTrademarkTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-TM-001")
            .name("Trademark Contract")
            .assetType(AssetType.TRADEMARK)
            .vvbRequirements(1, VerificationLevel.ENHANCED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Trademark Registration", true))
            .build();
    }

    private ActiveContractTemplate createCopyrightTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-CR-001")
            .name("Copyright Contract")
            .assetType(AssetType.COPYRIGHT)
            .vvbRequirements(1, VerificationLevel.ENHANCED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Copyright Registration", true))
            .build();
    }

    private ActiveContractTemplate createFinancialTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-FIN-001")
            .name("Financial Instrument Contract")
            .assetType(AssetType.FINANCIAL)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Security Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.AUDIT, "Financial Audit", true)
                .requiresVerification())
            .build();
    }

    private ActiveContractTemplate createBondTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-BND-001")
            .name("Bond Contract")
            .assetType(AssetType.BOND)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Bond Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.FINANCIAL_STATEMENT, "Issuer Financials", true))
            .build();
    }

    private ActiveContractTemplate createEquityTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-EQT-001")
            .name("Equity Contract")
            .assetType(AssetType.EQUITY)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Share Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.AUDIT, "Company Audit", true))
            .build();
    }

    private ActiveContractTemplate createDerivativeTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-DRV-001")
            .name("Derivative Contract")
            .assetType(AssetType.DERIVATIVE)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.AGREEMENT, "Derivative Agreement", true))
            .build();
    }

    private ActiveContractTemplate createArtTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-ART-001")
            .name("Art Asset Contract")
            .assetType(AssetType.ART)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Provenance Certificate", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Art Appraisal", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.INSURANCE, "Art Insurance", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PHOTO_GALLERY, "Artwork Photos", true))
            .build();
    }

    private ActiveContractTemplate createCollectibleTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-COL-001")
            .name("Collectible Contract")
            .assetType(AssetType.COLLECTIBLE)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Authentication Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.APPRAISAL, "Collectible Appraisal", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PHOTO_GALLERY, "Item Photos", true))
            .build();
    }

    private ActiveContractTemplate createNFTTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-NFT-001")
            .name("NFT Contract")
            .assetType(AssetType.NFT)
            .vvbRequirements(1, VerificationLevel.ENHANCED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "NFT Certificate", true))
            .build();
    }

    private ActiveContractTemplate createInfrastructureTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-INF-001")
            .name("Infrastructure Contract")
            .assetType(AssetType.INFRASTRUCTURE)
            .vvbRequirements(3, VerificationLevel.INSTITUTIONAL)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.PERMIT, "Operating License", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Environmental Impact", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.FINANCIAL_STATEMENT, "Revenue Projections", true))
            .build();
    }

    private ActiveContractTemplate createCarbonCreditTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-CCR-001")
            .name("Carbon Credit Contract")
            .assetType(AssetType.CARBON_CREDIT)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .acceptVVBTypes("CarbonVerifier", "EnvironmentalAuditor")
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Carbon Credit Certificate", true)
                .requiresVerification())
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.AUDIT, "Carbon Audit Report", true))
            .build();
    }

    private ActiveContractTemplate createEnvironmentalTemplate() {
        return ActiveContractTemplate.builder()
            .templateId("TPL-AC-ENV-001")
            .name("Environmental Asset Contract")
            .assetType(AssetType.ENVIRONMENTAL)
            .vvbRequirements(2, VerificationLevel.CERTIFIED)
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.CERTIFICATE, "Environmental Certificate", true))
            .addRequiredDocument(new ActiveContractTemplate.RequiredDocument(
                SecondaryTokenType.ENVIRONMENTAL, "Impact Assessment", true))
            .build();
    }

    // Helper methods for creating rules
    private ActiveContract.BusinessRule createValidationRule(String name, String description) {
        ActiveContract.BusinessRule rule = new ActiveContract.BusinessRule(
            "RULE-VAL-" + name.hashCode() % 10000,
            name,
            ActiveContract.BusinessRule.RuleType.VALIDATION
        );
        rule.setCondition(description);
        return rule;
    }

    private ActiveContract.BusinessRule createConditionRule(String name, String description) {
        ActiveContract.BusinessRule rule = new ActiveContract.BusinessRule(
            "RULE-CND-" + name.hashCode() % 10000,
            name,
            ActiveContract.BusinessRule.RuleType.CONDITION
        );
        rule.setCondition(description);
        return rule;
    }

    private ActiveContract.BusinessRule createConstraintRule(String name, String description) {
        ActiveContract.BusinessRule rule = new ActiveContract.BusinessRule(
            "RULE-CST-" + name.hashCode() % 10000,
            name,
            ActiveContract.BusinessRule.RuleType.CONSTRAINT
        );
        rule.setCondition(description);
        return rule;
    }

    // ==================== SMART CONTRACT TEMPLATES ====================

    private void initializeSmartContractTemplates() {
        // Create smart contract templates for each asset category
        for (AssetType assetType : AssetType.values()) {
            registerSmartTemplate(createSmartContractTemplate(assetType));
        }
    }

    private SmartContractTemplate createSmartContractTemplate(AssetType assetType) {
        SmartContractTemplate.TokenStandard standard = getTokenStandardForAssetType(assetType);
        boolean fractionalizable = assetType.isDefaultFractionalizable();

        SmartContractTemplate.Builder builder = SmartContractTemplate.builder()
            .templateId("SC-" + assetType.getPrefix() + "-100-001")
            .name(assetType.getDisplayName() + " Smart Contract")
            .description("ERC-compatible smart contract for " + assetType.getDisplayName())
            .version("1.0.0")
            .assetType(assetType)
            .tokenStandard(standard)
            .fractionalizable(fractionalizable, fractionalizable ? 10000 : 1)
            .upgradeable(true, SmartContractTemplate.UpgradePattern.UUPS)
            .deploymentGas(new BigDecimal("2500000"))
            .networks("Ethereum", "Polygon", "Avalanche", "Aurigraph")
            .compliance("ERC-" + (standard == SmartContractTemplate.TokenStandard.ERC_721 ? "721" : "1155"))
            .createdBy("Aurigraph Contract Library");

        // Add standard functions
        addStandardFunctions(builder, assetType, standard);

        // Add standard events
        addStandardEvents(builder, standard);

        // Add access control
        addAccessControl(builder);

        return builder.build();
    }

    private SmartContractTemplate.TokenStandard getTokenStandardForAssetType(AssetType assetType) {
        return switch (assetType) {
            case REAL_ESTATE, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, LAND,
                 VEHICLE, AIRCRAFT, VESSEL, ART, COLLECTIBLE, NFT -> SmartContractTemplate.TokenStandard.ERC_721;
            case COMMODITY, PRECIOUS_METAL, ENERGY, AGRICULTURAL,
                 CARBON_CREDIT, ENVIRONMENTAL -> SmartContractTemplate.TokenStandard.ERC_1155;
            case FINANCIAL, BOND, EQUITY, DERIVATIVE -> SmartContractTemplate.TokenStandard.ERC_20;
            default -> SmartContractTemplate.TokenStandard.ERC_721;
        };
    }

    private void addStandardFunctions(SmartContractTemplate.Builder builder, AssetType assetType,
                                      SmartContractTemplate.TokenStandard standard) {
        // Mint function
        builder.addFunction(
            new SmartContractTemplate.ContractFunction("mint", SmartContractTemplate.ContractFunction.FunctionType.MINT)
                .description("Mint new token for verified asset")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("to", "address", "Recipient address"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("assetId", "string", "Asset identifier"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("merkleRoot", "bytes32", "Composite token Merkle root"))
                .addReturn(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                .modifiers("onlyMinter", "whenNotPaused")
                .gasEstimate(new BigDecimal("150000"))
        );

        // Transfer function
        builder.addFunction(
            new SmartContractTemplate.ContractFunction("transfer", SmartContractTemplate.ContractFunction.FunctionType.TRANSFER)
                .description("Transfer token ownership")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("from", "address"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("to", "address"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                .modifiers("whenNotPaused")
                .gasEstimate(new BigDecimal("65000"))
        );

        // Burn function
        builder.addFunction(
            new SmartContractTemplate.ContractFunction("burn", SmartContractTemplate.ContractFunction.FunctionType.BURN)
                .description("Burn token (asset redemption)")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                .modifiers("onlyOwnerOrApproved", "whenNotPaused")
                .gasEstimate(new BigDecimal("45000"))
        );

        // VVB Verification
        builder.addFunction(
            new SmartContractTemplate.ContractFunction("recordVerification", SmartContractTemplate.ContractFunction.FunctionType.VERIFY)
                .description("Record VVB verification on-chain")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("verifierId", "address"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("verificationHash", "bytes32"))
                .modifiers("onlyVVB")
                .gasEstimate(new BigDecimal("80000"))
        );

        // Fractionalize (if applicable)
        if (assetType.isDefaultFractionalizable()) {
            builder.addFunction(
                new SmartContractTemplate.ContractFunction("fractionalize", SmartContractTemplate.ContractFunction.FunctionType.FRACTIONALIZE)
                    .description("Split token into fractional shares")
                    .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                    .addParam(new SmartContractTemplate.ContractFunction.Parameter("fractions", "uint256"))
                    .addReturn(new SmartContractTemplate.ContractFunction.Parameter("fractionIds", "uint256[]"))
                    .modifiers("onlyOwner", "whenNotPaused")
                    .gasEstimate(new BigDecimal("200000"))
            );

            builder.addFunction(
                new SmartContractTemplate.ContractFunction("merge", SmartContractTemplate.ContractFunction.FunctionType.MERGE)
                    .description("Merge fractional shares back to whole")
                    .addParam(new SmartContractTemplate.ContractFunction.Parameter("fractionIds", "uint256[]"))
                    .addReturn(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                    .modifiers("whenNotPaused")
                    .gasEstimate(new BigDecimal("180000"))
            );
        }

        // Query functions
        builder.addFunction(
            new SmartContractTemplate.ContractFunction("getAssetDetails", SmartContractTemplate.ContractFunction.FunctionType.QUERY)
                .description("Get asset details and verification status")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256"))
                .addReturn(new SmartContractTemplate.ContractFunction.Parameter("assetId", "string"))
                .addReturn(new SmartContractTemplate.ContractFunction.Parameter("merkleRoot", "bytes32"))
                .addReturn(new SmartContractTemplate.ContractFunction.Parameter("verified", "bool"))
                .visibility(SmartContractTemplate.ContractFunction.Visibility.EXTERNAL)
                .gasEstimate(new BigDecimal("25000"))
        );
    }

    private void addStandardEvents(SmartContractTemplate.Builder builder, SmartContractTemplate.TokenStandard standard) {
        builder.addEvent(
            new SmartContractTemplate.ContractEvent("AssetTokenized")
                .description("Emitted when a new asset is tokenized")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("assetId", "string"))
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("owner", "address").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("merkleRoot", "bytes32"))
        );

        builder.addEvent(
            new SmartContractTemplate.ContractEvent("VerificationRecorded")
                .description("Emitted when VVB verification is recorded")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("verifierId", "address").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("verificationHash", "bytes32"))
        );

        builder.addEvent(
            new SmartContractTemplate.ContractEvent("AssetFractionalized")
                .description("Emitted when an asset is fractionalized")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("tokenId", "uint256").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("fractions", "uint256"))
        );

        builder.addEvent(
            new SmartContractTemplate.ContractEvent("FractionsMerged")
                .description("Emitted when fractions are merged")
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("newTokenId", "uint256").indexed())
                .addParam(new SmartContractTemplate.ContractFunction.Parameter("mergedCount", "uint256"))
        );
    }

    private void addAccessControl(SmartContractTemplate.Builder builder) {
        builder.addAccessControl(
            new SmartContractTemplate.AccessControlRule("OWNER_ROLE")
                .description("Full control over contract")
                .allowFunction("mint")
                .allowFunction("burn")
                .allowFunction("fractionalize")
                .allowFunction("pause")
                .allowFunction("unpause")
        );

        builder.addAccessControl(
            new SmartContractTemplate.AccessControlRule("MINTER_ROLE")
                .description("Can mint new tokens")
                .allowFunction("mint")
        );

        builder.addAccessControl(
            new SmartContractTemplate.AccessControlRule("VVB_ROLE")
                .description("VVB verifier role")
                .allowFunction("recordVerification")
        );

        builder.addAccessControl(
            new SmartContractTemplate.AccessControlRule("PAUSER_ROLE")
                .description("Can pause/unpause contract")
                .allowFunction("pause")
                .allowFunction("unpause")
        );
    }

    // ==================== REGISTRATION AND LOOKUP ====================

    private void registerActiveTemplate(ActiveContractTemplate template) {
        activeTemplates.put(template.getTemplateId(), template);

        // Update category index
        activeByCategory.computeIfAbsent(template.getCategory(), k -> new ArrayList<>())
            .add(template.getTemplateId());

        // Update version history
        String baseId = template.getTemplateId().substring(0, template.getTemplateId().lastIndexOf("-"));
        activeTemplateVersions.computeIfAbsent(baseId, k -> new ArrayList<>())
            .add(template.getTemplateId());

        Log.debugf("Registered Active Contract Template: %s", template.getTemplateId());
    }

    private void registerSmartTemplate(SmartContractTemplate template) {
        smartTemplates.put(template.getTemplateId(), template);

        // Update category index
        smartByCategory.computeIfAbsent(template.getCategory(), k -> new ArrayList<>())
            .add(template.getTemplateId());

        // Update version history
        String baseId = template.getTemplateId().substring(0, template.getTemplateId().lastIndexOf("-"));
        smartTemplateVersions.computeIfAbsent(baseId, k -> new ArrayList<>())
            .add(template.getTemplateId());

        Log.debugf("Registered Smart Contract Template: %s", template.getTemplateId());
    }

    // ==================== PUBLIC API ====================

    public Optional<ActiveContractTemplate> getActiveTemplate(String templateId) {
        return Optional.ofNullable(activeTemplates.get(templateId));
    }

    public Optional<SmartContractTemplate> getSmartTemplate(String templateId) {
        return Optional.ofNullable(smartTemplates.get(templateId));
    }

    public Optional<ActiveContractTemplate> getActiveTemplateForAssetType(AssetType assetType) {
        return activeTemplates.values().stream()
            .filter(t -> t.getAssetType() == assetType && t.isActive())
            .findFirst();
    }

    public Optional<SmartContractTemplate> getSmartTemplateForAssetType(AssetType assetType) {
        return smartTemplates.values().stream()
            .filter(t -> t.getAssetType() == assetType && t.isActive())
            .findFirst();
    }

    public List<ActiveContractTemplate> getActiveTemplatesByCategory(ActiveContractTemplate.AssetCategory category) {
        return activeByCategory.getOrDefault(category, List.of()).stream()
            .map(activeTemplates::get)
            .filter(Objects::nonNull)
            .toList();
    }

    public List<SmartContractTemplate> getSmartTemplatesByCategory(ActiveContractTemplate.AssetCategory category) {
        return smartByCategory.getOrDefault(category, List.of()).stream()
            .map(smartTemplates::get)
            .filter(Objects::nonNull)
            .toList();
    }

    public List<SmartContractTemplate> getSmartTemplatesByTokenStandard(SmartContractTemplate.TokenStandard standard) {
        return smartTemplates.values().stream()
            .filter(t -> t.getTokenStandard() == standard && t.isActive())
            .toList();
    }

    public List<ActiveContractTemplate> getAllActiveTemplates() {
        return new ArrayList<>(activeTemplates.values());
    }

    public List<SmartContractTemplate> getAllSmartTemplates() {
        return new ArrayList<>(smartTemplates.values());
    }

    public List<String> getActiveTemplateVersionHistory(String baseTemplateId) {
        return activeTemplateVersions.getOrDefault(baseTemplateId, List.of());
    }

    public List<String> getSmartTemplateVersionHistory(String baseTemplateId) {
        return smartTemplateVersions.getOrDefault(baseTemplateId, List.of());
    }

    /**
     * Create an Active Contract from template
     */
    public Optional<ActiveContract> createContractFromTemplate(String templateId, String ownerAddress) {
        return getActiveTemplate(templateId)
            .map(template -> {
                ActiveContract.Builder builder = ActiveContract.builder()
                    .ownerAddress(ownerAddress)
                    .ruleTemplateId(templateId);

                if (template.getDefaultContractDuration() != null) {
                    builder.effectiveDate(Instant.now())
                        .expirationDate(Instant.now().plus(template.getDefaultContractDuration()));
                }

                ActiveContract contract = builder.build();

                // Add default rules from template
                for (ActiveContract.BusinessRule rule : template.getDefaultRules()) {
                    contract.addBusinessRule(rule);
                }

                return contract;
            });
    }

    /**
     * Get library statistics
     */
    public Map<String, Object> getLibraryStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("libraryVersion", LIBRARY_VERSION);
        stats.put("totalActiveTemplates", activeTemplates.size());
        stats.put("totalSmartTemplates", smartTemplates.size());
        stats.put("activeTemplatesByCategory", activeByCategory.entrySet().stream()
            .collect(Collectors.toMap(e -> e.getKey().name(), e -> e.getValue().size())));
        stats.put("smartTemplatesByCategory", smartByCategory.entrySet().stream()
            .collect(Collectors.toMap(e -> e.getKey().name(), e -> e.getValue().size())));
        return stats;
    }
}
