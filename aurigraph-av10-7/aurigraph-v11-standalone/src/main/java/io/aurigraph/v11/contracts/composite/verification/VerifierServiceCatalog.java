package io.aurigraph.v11.contracts.composite.verification;

import io.aurigraph.v11.contracts.composite.VerificationLevel;
import io.aurigraph.v11.contracts.composite.VerifierTier;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Verifier Service Catalog - Defines services offered by third-party verifiers
 *
 * Each verifier can offer multiple services with different rate cards,
 * turnaround times, and specialized capabilities.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification)
 */
public class VerifierServiceCatalog {

    private final String catalogId;
    private final String verifierId;
    private final List<VerifierService> services;
    private final RateCard rateCard;
    private final List<String> certifications;
    private final List<String> assetTypeSpecializations;
    private final List<String> jurisdictions;
    private final ServiceAvailability availability;
    private final Instant createdAt;
    private Instant lastUpdated;
    private boolean isActive;

    public VerifierServiceCatalog(String verifierId) {
        this.catalogId = "CAT-" + UUID.randomUUID().toString().substring(0, 8);
        this.verifierId = verifierId;
        this.services = new ArrayList<>();
        this.rateCard = new RateCard();
        this.certifications = new ArrayList<>();
        this.assetTypeSpecializations = new ArrayList<>();
        this.jurisdictions = new ArrayList<>();
        this.availability = new ServiceAvailability();
        this.createdAt = Instant.now();
        this.lastUpdated = Instant.now();
        this.isActive = true;
    }

    // ==================== SERVICE DEFINITIONS ====================

    /**
     * Individual service offered by a verifier
     */
    public static class VerifierService {
        private String serviceId;
        private String serviceName;
        private ServiceType serviceType;
        private String description;
        private List<String> applicableAssetTypes;
        private VerificationLevel outputLevel;
        private Duration standardTurnaround;
        private Duration expressTurnaround;
        private BigDecimal basePrice;
        private BigDecimal expressMultiplier;
        private List<ServiceDeliverable> deliverables;
        private List<ServiceRequirement> requirements;
        private boolean isActive;
        private int maxConcurrentAssignments;
        private Map<String, Object> customParameters;

        public VerifierService() {
            this.serviceId = "SVC-" + UUID.randomUUID().toString().substring(0, 8);
            this.applicableAssetTypes = new ArrayList<>();
            this.deliverables = new ArrayList<>();
            this.requirements = new ArrayList<>();
            this.customParameters = new HashMap<>();
            this.expressMultiplier = BigDecimal.valueOf(1.5);
            this.maxConcurrentAssignments = 5;
            this.isActive = true;
        }

        // Builder pattern
        public VerifierService serviceName(String name) { this.serviceName = name; return this; }
        public VerifierService serviceType(ServiceType type) { this.serviceType = type; return this; }
        public VerifierService description(String desc) { this.description = desc; return this; }
        public VerifierService outputLevel(VerificationLevel level) { this.outputLevel = level; return this; }
        public VerifierService standardTurnaround(Duration duration) { this.standardTurnaround = duration; return this; }
        public VerifierService expressTurnaround(Duration duration) { this.expressTurnaround = duration; return this; }
        public VerifierService basePrice(BigDecimal price) { this.basePrice = price; return this; }
        public VerifierService expressMultiplier(BigDecimal multiplier) { this.expressMultiplier = multiplier; return this; }
        public VerifierService addAssetType(String type) { this.applicableAssetTypes.add(type); return this; }
        public VerifierService addDeliverable(ServiceDeliverable d) { this.deliverables.add(d); return this; }
        public VerifierService addRequirement(ServiceRequirement r) { this.requirements.add(r); return this; }

        // Getters
        public String getServiceId() { return serviceId; }
        public String getServiceName() { return serviceName; }
        public ServiceType getServiceType() { return serviceType; }
        public String getDescription() { return description; }
        public List<String> getApplicableAssetTypes() { return applicableAssetTypes; }
        public VerificationLevel getOutputLevel() { return outputLevel; }
        public Duration getStandardTurnaround() { return standardTurnaround; }
        public Duration getExpressTurnaround() { return expressTurnaround; }
        public BigDecimal getBasePrice() { return basePrice; }
        public BigDecimal getExpressMultiplier() { return expressMultiplier; }
        public List<ServiceDeliverable> getDeliverables() { return deliverables; }
        public List<ServiceRequirement> getRequirements() { return requirements; }
        public boolean isActive() { return isActive; }
        public int getMaxConcurrentAssignments() { return maxConcurrentAssignments; }
        public Map<String, Object> getCustomParameters() { return customParameters; }

        public BigDecimal calculatePrice(boolean express) {
            if (express && expressTurnaround != null) {
                return basePrice.multiply(expressMultiplier);
            }
            return basePrice;
        }
    }

    /**
     * Types of verification services
     */
    public enum ServiceType {
        // Document Verification
        DOCUMENT_AUTHENTICATION,
        TITLE_SEARCH,
        LEGAL_REVIEW,
        OWNERSHIP_VERIFICATION,

        // Physical Inspection
        SITE_INSPECTION,
        PHYSICAL_VERIFICATION,
        CONDITION_ASSESSMENT,
        ENVIRONMENTAL_ASSESSMENT,

        // Valuation Services
        MARKET_VALUATION,
        APPRAISAL,
        INCOME_VALUATION,
        REPLACEMENT_COST_VALUATION,
        LIQUIDATION_VALUATION,

        // Technical Assessment
        TECHNICAL_DUE_DILIGENCE,
        ENGINEERING_ASSESSMENT,
        QUALITY_CERTIFICATION,

        // Financial Verification
        FINANCIAL_AUDIT,
        REVENUE_VERIFICATION,
        CASH_FLOW_ANALYSIS,

        // Compliance
        REGULATORY_COMPLIANCE,
        AML_KYC_VERIFICATION,
        SANCTIONS_SCREENING,
        ESG_ASSESSMENT,

        // Specialized
        INTELLECTUAL_PROPERTY_VERIFICATION,
        INSURANCE_VERIFICATION,
        PROVENANCE_VERIFICATION,
        CARBON_CREDIT_VERIFICATION,

        // Comprehensive
        FULL_DUE_DILIGENCE,
        COMPREHENSIVE_AUDIT,
        INSTITUTIONAL_CERTIFICATION
    }

    /**
     * Service deliverables - what the client receives
     */
    public static class ServiceDeliverable {
        private String deliverableId;
        private String name;
        private DeliverableType type;
        private String description;
        private String format;
        private boolean isMandatory;
        private Duration deliveryTime;

        public ServiceDeliverable() {
            this.deliverableId = "DEL-" + UUID.randomUUID().toString().substring(0, 8);
        }

        public ServiceDeliverable name(String name) { this.name = name; return this; }
        public ServiceDeliverable type(DeliverableType type) { this.type = type; return this; }
        public ServiceDeliverable description(String desc) { this.description = desc; return this; }
        public ServiceDeliverable format(String format) { this.format = format; return this; }
        public ServiceDeliverable mandatory(boolean mandatory) { this.isMandatory = mandatory; return this; }
        public ServiceDeliverable deliveryTime(Duration time) { this.deliveryTime = time; return this; }

        // Getters
        public String getDeliverableId() { return deliverableId; }
        public String getName() { return name; }
        public DeliverableType getType() { return type; }
        public String getDescription() { return description; }
        public String getFormat() { return format; }
        public boolean isMandatory() { return isMandatory; }
        public Duration getDeliveryTime() { return deliveryTime; }
    }

    public enum DeliverableType {
        VERIFICATION_REPORT,
        VALUATION_REPORT,
        CERTIFICATE,
        ATTESTATION,
        INSPECTION_REPORT,
        PHOTO_DOCUMENTATION,
        VIDEO_DOCUMENTATION,
        LEGAL_OPINION,
        COMPLIANCE_CERTIFICATE,
        AUDIT_REPORT,
        EXECUTIVE_SUMMARY,
        DETAILED_FINDINGS,
        RISK_ASSESSMENT,
        DATA_EXTRACT
    }

    /**
     * Service requirements - what the verifier needs from client
     */
    public static class ServiceRequirement {
        private String requirementId;
        private String name;
        private RequirementType type;
        private String description;
        private boolean isMandatory;
        private List<String> acceptedFormats;
        private String validationRules;

        public ServiceRequirement() {
            this.requirementId = "REQ-" + UUID.randomUUID().toString().substring(0, 8);
            this.acceptedFormats = new ArrayList<>();
        }

        public ServiceRequirement name(String name) { this.name = name; return this; }
        public ServiceRequirement type(RequirementType type) { this.type = type; return this; }
        public ServiceRequirement description(String desc) { this.description = desc; return this; }
        public ServiceRequirement mandatory(boolean mandatory) { this.isMandatory = mandatory; return this; }
        public ServiceRequirement addFormat(String format) { this.acceptedFormats.add(format); return this; }
        public ServiceRequirement validationRules(String rules) { this.validationRules = rules; return this; }

        // Getters
        public String getRequirementId() { return requirementId; }
        public String getName() { return name; }
        public RequirementType getType() { return type; }
        public String getDescription() { return description; }
        public boolean isMandatory() { return isMandatory; }
        public List<String> getAcceptedFormats() { return acceptedFormats; }
        public String getValidationRules() { return validationRules; }
    }

    public enum RequirementType {
        DOCUMENT,
        PHOTO,
        VIDEO,
        ACCESS_PERMISSION,
        CONTACT_INFO,
        FINANCIAL_DATA,
        LEGAL_DOCUMENT,
        IDENTITY_VERIFICATION,
        PHYSICAL_ACCESS,
        DIGITAL_ACCESS,
        THIRD_PARTY_CONSENT,
        CUSTOM_DATA
    }

    // ==================== RATE CARD ====================

    /**
     * Rate Card - Pricing structure for verifier services
     */
    public static class RateCard {
        private String rateCardId;
        private String currency;
        private Map<ServiceType, ServicePricing> servicePricing;
        private Map<VerifierTier, BigDecimal> tierMultipliers;
        private Map<String, BigDecimal> assetTypeMultipliers;
        private Map<String, BigDecimal> jurisdictionMultipliers;
        private List<VolumeDiscount> volumeDiscounts;
        private List<SpecialRate> specialRates;
        private BigDecimal minimumFee;
        private BigDecimal rushFeeMultiplier;
        private BigDecimal weekendMultiplier;
        private BigDecimal complexityMultiplier;
        private Instant effectiveFrom;
        private Instant effectiveTo;

        public RateCard() {
            this.rateCardId = "RC-" + UUID.randomUUID().toString().substring(0, 8);
            this.currency = "USD";
            this.servicePricing = new HashMap<>();
            this.tierMultipliers = new HashMap<>();
            this.assetTypeMultipliers = new HashMap<>();
            this.jurisdictionMultipliers = new HashMap<>();
            this.volumeDiscounts = new ArrayList<>();
            this.specialRates = new ArrayList<>();
            this.minimumFee = BigDecimal.valueOf(500);
            this.rushFeeMultiplier = BigDecimal.valueOf(1.5);
            this.weekendMultiplier = BigDecimal.valueOf(1.25);
            this.complexityMultiplier = BigDecimal.ONE;
            this.effectiveFrom = Instant.now();
            initializeDefaultTierMultipliers();
        }

        private void initializeDefaultTierMultipliers() {
            tierMultipliers.put(VerifierTier.TIER_1, BigDecimal.valueOf(1.0));
            tierMultipliers.put(VerifierTier.TIER_2, BigDecimal.valueOf(1.5));
            tierMultipliers.put(VerifierTier.TIER_3, BigDecimal.valueOf(2.0));
            tierMultipliers.put(VerifierTier.TIER_4, BigDecimal.valueOf(3.0));
        }

        /**
         * Calculate total price for a service
         */
        public BigDecimal calculatePrice(ServiceType serviceType, String assetType,
                                        String jurisdiction, VerifierTier tier,
                                        BigDecimal assetValue, boolean isRush,
                                        boolean isWeekend, int complexity) {

            ServicePricing pricing = servicePricing.get(serviceType);
            if (pricing == null) {
                return minimumFee;
            }

            BigDecimal basePrice = pricing.calculateBasePrice(assetValue);

            // Apply multipliers
            BigDecimal tierMult = tierMultipliers.getOrDefault(tier, BigDecimal.ONE);
            BigDecimal assetMult = assetTypeMultipliers.getOrDefault(assetType, BigDecimal.ONE);
            BigDecimal jurisdictionMult = jurisdictionMultipliers.getOrDefault(jurisdiction, BigDecimal.ONE);

            BigDecimal total = basePrice
                .multiply(tierMult)
                .multiply(assetMult)
                .multiply(jurisdictionMult);

            // Apply rush and weekend fees
            if (isRush) {
                total = total.multiply(rushFeeMultiplier);
            }
            if (isWeekend) {
                total = total.multiply(weekendMultiplier);
            }

            // Apply complexity multiplier (1-5 scale)
            if (complexity > 1) {
                BigDecimal complexMult = BigDecimal.ONE.add(
                    BigDecimal.valueOf(complexity - 1).multiply(BigDecimal.valueOf(0.1))
                );
                total = total.multiply(complexMult);
            }

            // Ensure minimum fee
            return total.max(minimumFee);
        }

        /**
         * Apply volume discount - finds the highest applicable discount based on order count
         */
        public BigDecimal applyVolumeDiscount(BigDecimal totalAmount, int orderCount) {
            // Find the best applicable discount (highest minOrders that's still <= orderCount)
            VolumeDiscount bestDiscount = null;
            for (VolumeDiscount discount : volumeDiscounts) {
                if (orderCount >= discount.minOrders) {
                    if (bestDiscount == null || discount.minOrders > bestDiscount.minOrders) {
                        bestDiscount = discount;
                    }
                }
            }

            if (bestDiscount != null) {
                return totalAmount.multiply(
                    BigDecimal.ONE.subtract(bestDiscount.discountPercent.divide(BigDecimal.valueOf(100)))
                );
            }
            return totalAmount;
        }

        // Getters and setters
        public String getRateCardId() { return rateCardId; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public Map<ServiceType, ServicePricing> getServicePricing() { return servicePricing; }
        public Map<VerifierTier, BigDecimal> getTierMultipliers() { return tierMultipliers; }
        public Map<String, BigDecimal> getAssetTypeMultipliers() { return assetTypeMultipliers; }
        public Map<String, BigDecimal> getJurisdictionMultipliers() { return jurisdictionMultipliers; }
        public List<VolumeDiscount> getVolumeDiscounts() { return volumeDiscounts; }
        public List<SpecialRate> getSpecialRates() { return specialRates; }
        public BigDecimal getMinimumFee() { return minimumFee; }
        public void setMinimumFee(BigDecimal fee) { this.minimumFee = fee; }
        public BigDecimal getRushFeeMultiplier() { return rushFeeMultiplier; }
        public void setRushFeeMultiplier(BigDecimal mult) { this.rushFeeMultiplier = mult; }
        public Instant getEffectiveFrom() { return effectiveFrom; }
        public Instant getEffectiveTo() { return effectiveTo; }
    }

    /**
     * Service-specific pricing structure
     */
    public static class ServicePricing {
        private ServiceType serviceType;
        private PricingModel pricingModel;
        private BigDecimal flatFee;
        private BigDecimal percentageRate;       // As decimal (0.001 = 0.1%)
        private BigDecimal minimumFee;
        private BigDecimal maximumFee;
        private List<PricingTier> tieredPricing;

        public ServicePricing() {
            this.tieredPricing = new ArrayList<>();
            this.pricingModel = PricingModel.FLAT_FEE;
        }

        public BigDecimal calculateBasePrice(BigDecimal assetValue) {
            switch (pricingModel) {
                case FLAT_FEE:
                    return flatFee;

                case PERCENTAGE:
                    BigDecimal calculated = assetValue.multiply(percentageRate);
                    if (minimumFee != null) calculated = calculated.max(minimumFee);
                    if (maximumFee != null) calculated = calculated.min(maximumFee);
                    return calculated;

                case TIERED:
                    for (PricingTier tier : tieredPricing) {
                        if (assetValue.compareTo(tier.minValue) >= 0 &&
                            (tier.maxValue == null || assetValue.compareTo(tier.maxValue) < 0)) {
                            return tier.fee;
                        }
                    }
                    return flatFee != null ? flatFee : BigDecimal.ZERO;

                case HYBRID:
                    BigDecimal base = flatFee != null ? flatFee : BigDecimal.ZERO;
                    BigDecimal percent = assetValue.multiply(percentageRate);
                    return base.add(percent);

                default:
                    return flatFee;
            }
        }

        // Builder methods
        public ServicePricing serviceType(ServiceType type) { this.serviceType = type; return this; }
        public ServicePricing pricingModel(PricingModel model) { this.pricingModel = model; return this; }
        public ServicePricing flatFee(BigDecimal fee) { this.flatFee = fee; return this; }
        public ServicePricing percentageRate(BigDecimal rate) { this.percentageRate = rate; return this; }
        public ServicePricing minimumFee(BigDecimal min) { this.minimumFee = min; return this; }
        public ServicePricing maximumFee(BigDecimal max) { this.maximumFee = max; return this; }
        public ServicePricing addTier(PricingTier tier) { this.tieredPricing.add(tier); return this; }

        // Getters
        public ServiceType getServiceType() { return serviceType; }
        public PricingModel getPricingModel() { return pricingModel; }
        public BigDecimal getFlatFee() { return flatFee; }
        public BigDecimal getPercentageRate() { return percentageRate; }
        public BigDecimal getMinimumFee() { return minimumFee; }
        public BigDecimal getMaximumFee() { return maximumFee; }
        public List<PricingTier> getTieredPricing() { return tieredPricing; }
    }

    public enum PricingModel {
        FLAT_FEE,
        PERCENTAGE,
        TIERED,
        HYBRID,
        CUSTOM
    }

    public static class PricingTier {
        public BigDecimal minValue;
        public BigDecimal maxValue;
        public BigDecimal fee;

        public PricingTier(BigDecimal minValue, BigDecimal maxValue, BigDecimal fee) {
            this.minValue = minValue;
            this.maxValue = maxValue;
            this.fee = fee;
        }
    }

    public static class VolumeDiscount {
        public int minOrders;
        public BigDecimal discountPercent;

        public VolumeDiscount(int minOrders, BigDecimal discountPercent) {
            this.minOrders = minOrders;
            this.discountPercent = discountPercent;
        }
    }

    public static class SpecialRate {
        public String clientId;
        public String description;
        public BigDecimal discountPercent;
        public Instant validFrom;
        public Instant validTo;
    }

    // ==================== SERVICE AVAILABILITY ====================

    /**
     * Service availability configuration
     */
    public static class ServiceAvailability {
        private Map<Integer, WorkingHours> weeklySchedule; // Day of week (1-7)
        private List<String> holidays;
        private int maxConcurrentOrders;
        private int currentActiveOrders;
        private Duration averageResponseTime;
        private boolean acceptingNewOrders;
        private List<String> blackoutDates;
        private String timezone;

        public ServiceAvailability() {
            this.weeklySchedule = new HashMap<>();
            this.holidays = new ArrayList<>();
            this.blackoutDates = new ArrayList<>();
            this.maxConcurrentOrders = 10;
            this.currentActiveOrders = 0;
            this.averageResponseTime = Duration.ofHours(24);
            this.acceptingNewOrders = true;
            this.timezone = "UTC";
            initializeDefaultSchedule();
        }

        private void initializeDefaultSchedule() {
            // Monday to Friday 9 AM - 6 PM
            for (int day = 1; day <= 5; day++) {
                weeklySchedule.put(day, new WorkingHours(9, 0, 18, 0));
            }
        }

        public boolean isAvailable() {
            return acceptingNewOrders && currentActiveOrders < maxConcurrentOrders;
        }

        public int getRemainingCapacity() {
            return maxConcurrentOrders - currentActiveOrders;
        }

        // Getters and setters
        public Map<Integer, WorkingHours> getWeeklySchedule() { return weeklySchedule; }
        public List<String> getHolidays() { return holidays; }
        public int getMaxConcurrentOrders() { return maxConcurrentOrders; }
        public void setMaxConcurrentOrders(int max) { this.maxConcurrentOrders = max; }
        public int getCurrentActiveOrders() { return currentActiveOrders; }
        public void incrementActiveOrders() { this.currentActiveOrders++; }
        public void decrementActiveOrders() { if (currentActiveOrders > 0) currentActiveOrders--; }
        public Duration getAverageResponseTime() { return averageResponseTime; }
        public void setAverageResponseTime(Duration time) { this.averageResponseTime = time; }
        public boolean isAcceptingNewOrders() { return acceptingNewOrders; }
        public void setAcceptingNewOrders(boolean accepting) { this.acceptingNewOrders = accepting; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String tz) { this.timezone = tz; }
    }

    public static class WorkingHours {
        public int startHour;
        public int startMinute;
        public int endHour;
        public int endMinute;

        public WorkingHours(int startHour, int startMinute, int endHour, int endMinute) {
            this.startHour = startHour;
            this.startMinute = startMinute;
            this.endHour = endHour;
            this.endMinute = endMinute;
        }
    }

    // ==================== CATALOG METHODS ====================

    public void addService(VerifierService service) {
        services.add(service);
        this.lastUpdated = Instant.now();
    }

    public void removeService(String serviceId) {
        services.removeIf(s -> s.getServiceId().equals(serviceId));
        this.lastUpdated = Instant.now();
    }

    public Optional<VerifierService> getService(String serviceId) {
        return services.stream()
            .filter(s -> s.getServiceId().equals(serviceId))
            .findFirst();
    }

    public List<VerifierService> getServicesByType(ServiceType type) {
        return services.stream()
            .filter(s -> s.getServiceType() == type && s.isActive())
            .toList();
    }

    public List<VerifierService> getServicesForAssetType(String assetType) {
        return services.stream()
            .filter(s -> s.getApplicableAssetTypes().contains(assetType) && s.isActive())
            .toList();
    }

    public void addCertification(String certification) {
        certifications.add(certification);
        this.lastUpdated = Instant.now();
    }

    public void addSpecialization(String assetType) {
        assetTypeSpecializations.add(assetType);
        this.lastUpdated = Instant.now();
    }

    public void addJurisdiction(String jurisdiction) {
        jurisdictions.add(jurisdiction);
        this.lastUpdated = Instant.now();
    }

    // Getters
    public String getCatalogId() { return catalogId; }
    public String getVerifierId() { return verifierId; }
    public List<VerifierService> getServices() { return services; }
    public RateCard getRateCard() { return rateCard; }
    public List<String> getCertifications() { return certifications; }
    public List<String> getAssetTypeSpecializations() { return assetTypeSpecializations; }
    public List<String> getJurisdictions() { return jurisdictions; }
    public ServiceAvailability getAvailability() { return availability; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastUpdated() { return lastUpdated; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { this.isActive = active; this.lastUpdated = Instant.now(); }
}
