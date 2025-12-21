package io.aurigraph.v11.contracts.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * ContractParameters - Configuration component of a Ricardian ActiveContract
 *
 * Contains the configurable parameters of a contract:
 * - Parties: Stakeholders with roles and token bindings
 * - Financial: Amounts, currencies, payment schedules
 * - Dates: Effective dates, expiry, milestones
 * - Assets: Token bindings (Primary, Secondary, Composite)
 * - Limits: Thresholds and constraints
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
public class ContractParameters {

    @JsonProperty("parametersId")
    private String parametersId;

    @JsonProperty("contractId")
    private String contractId;

    // ==================== Party Configuration ====================

    @JsonProperty("parties")
    private List<PartyConfig> parties = new ArrayList<>();

    @JsonProperty("requiredSignatures")
    private int requiredSignatures;

    @JsonProperty("signatureOrder")
    private SignatureOrderType signatureOrder = SignatureOrderType.ANY_ORDER;

    // ==================== Financial Parameters ====================

    @JsonProperty("financialTerms")
    private FinancialTerms financialTerms;

    @JsonProperty("paymentSchedule")
    private List<PaymentMilestone> paymentSchedule = new ArrayList<>();

    // ==================== Date Configuration ====================

    @JsonProperty("effectiveDate")
    private LocalDate effectiveDate;

    @JsonProperty("expiryDate")
    private LocalDate expiryDate;

    @JsonProperty("executionDate")
    private LocalDate executionDate;

    @JsonProperty("milestones")
    private List<ContractMilestone> milestones = new ArrayList<>();

    @JsonProperty("renewalTerms")
    private RenewalTerms renewalTerms;

    // ==================== Asset Bindings ====================

    @JsonProperty("tokenBindings")
    private TokenBindings tokenBindings;

    @JsonProperty("assetValuation")
    private AssetValuation assetValuation;

    // ==================== Limits & Constraints ====================

    @JsonProperty("limits")
    private ContractLimits limits;

    @JsonProperty("thresholds")
    private Map<String, BigDecimal> thresholds = new HashMap<>();

    // ==================== External Data Sources ====================

    @JsonProperty("dataSources")
    private List<DataSource> dataSources = new ArrayList<>();

    // ==================== Metadata ====================

    @JsonProperty("customParameters")
    private Map<String, Object> customParameters = new LinkedHashMap<>();

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;

    // Default constructor
    public ContractParameters() {
        this.parametersId = "PARAM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.financialTerms = new FinancialTerms();
        this.tokenBindings = new TokenBindings();
        this.limits = new ContractLimits();
    }

    // Constructor with contract ID
    public ContractParameters(String contractId) {
        this();
        this.contractId = contractId;
    }

    // ==================== Nested Classes ====================

    /**
     * Party configuration with role and token binding
     */
    public static class PartyConfig {
        @JsonProperty("partyId")
        private String partyId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("legalName")
        private String legalName;

        @JsonProperty("address")
        private String address; // Blockchain address

        @JsonProperty("role")
        private PartyRole role;

        @JsonProperty("email")
        private String email;

        @JsonProperty("phone")
        private String phone;

        @JsonProperty("jurisdiction")
        private String jurisdiction;

        @JsonProperty("signatureRequired")
        private boolean signatureRequired = true;

        @JsonProperty("signatureOrder")
        private int signatureOrder;

        @JsonProperty("tokenId")
        private String tokenId; // Bound stakeholder token

        @JsonProperty("tokenType")
        private TokenType tokenType;

        @JsonProperty("ownershipPercentage")
        private BigDecimal ownershipPercentage;

        @JsonProperty("kycVerified")
        private boolean kycVerified = false;

        @JsonProperty("kycVerificationId")
        private String kycVerificationId;

        @JsonProperty("metadata")
        private Map<String, String> metadata = new HashMap<>();

        public PartyConfig() {
            this.partyId = "PARTY-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public PartyConfig(String name, String address, PartyRole role) {
            this();
            this.name = name;
            this.address = address;
            this.role = role;
        }

        // Getters and setters
        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLegalName() { return legalName; }
        public void setLegalName(String legalName) { this.legalName = legalName; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public PartyRole getRole() { return role; }
        public void setRole(PartyRole role) { this.role = role; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
        public boolean isSignatureRequired() { return signatureRequired; }
        public void setSignatureRequired(boolean signatureRequired) { this.signatureRequired = signatureRequired; }
        public int getSignatureOrder() { return signatureOrder; }
        public void setSignatureOrder(int signatureOrder) { this.signatureOrder = signatureOrder; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public TokenType getTokenType() { return tokenType; }
        public void setTokenType(TokenType tokenType) { this.tokenType = tokenType; }
        public BigDecimal getOwnershipPercentage() { return ownershipPercentage; }
        public void setOwnershipPercentage(BigDecimal ownershipPercentage) { this.ownershipPercentage = ownershipPercentage; }
        public boolean isKycVerified() { return kycVerified; }
        public void setKycVerified(boolean kycVerified) { this.kycVerified = kycVerified; }
        public String getKycVerificationId() { return kycVerificationId; }
        public void setKycVerificationId(String kycVerificationId) { this.kycVerificationId = kycVerificationId; }
        public Map<String, String> getMetadata() { return metadata; }
        public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    }

    /**
     * Financial terms of the contract
     */
    public static class FinancialTerms {
        @JsonProperty("totalValue")
        private BigDecimal totalValue;

        @JsonProperty("currency")
        private String currency = "USD";

        @JsonProperty("tokenCurrency")
        private String tokenCurrency = "AURI"; // Settlement token

        @JsonProperty("exchangeRate")
        private BigDecimal exchangeRate;

        @JsonProperty("depositAmount")
        private BigDecimal depositAmount;

        @JsonProperty("escrowRequired")
        private boolean escrowRequired = false;

        @JsonProperty("escrowAmount")
        private BigDecimal escrowAmount;

        @JsonProperty("escrowReleaseCondition")
        private String escrowReleaseCondition;

        @JsonProperty("paymentMethod")
        private PaymentMethod paymentMethod = PaymentMethod.TOKEN_TRANSFER;

        @JsonProperty("lateFeePercentage")
        private BigDecimal lateFeePercentage;

        @JsonProperty("interestRate")
        private BigDecimal interestRate;

        @JsonProperty("penaltyTerms")
        private String penaltyTerms;

        // Getters and setters
        public BigDecimal getTotalValue() { return totalValue; }
        public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getTokenCurrency() { return tokenCurrency; }
        public void setTokenCurrency(String tokenCurrency) { this.tokenCurrency = tokenCurrency; }
        public BigDecimal getExchangeRate() { return exchangeRate; }
        public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
        public BigDecimal getDepositAmount() { return depositAmount; }
        public void setDepositAmount(BigDecimal depositAmount) { this.depositAmount = depositAmount; }
        public boolean isEscrowRequired() { return escrowRequired; }
        public void setEscrowRequired(boolean escrowRequired) { this.escrowRequired = escrowRequired; }
        public BigDecimal getEscrowAmount() { return escrowAmount; }
        public void setEscrowAmount(BigDecimal escrowAmount) { this.escrowAmount = escrowAmount; }
        public String getEscrowReleaseCondition() { return escrowReleaseCondition; }
        public void setEscrowReleaseCondition(String escrowReleaseCondition) { this.escrowReleaseCondition = escrowReleaseCondition; }
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public BigDecimal getLateFeePercentage() { return lateFeePercentage; }
        public void setLateFeePercentage(BigDecimal lateFeePercentage) { this.lateFeePercentage = lateFeePercentage; }
        public BigDecimal getInterestRate() { return interestRate; }
        public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }
        public String getPenaltyTerms() { return penaltyTerms; }
        public void setPenaltyTerms(String penaltyTerms) { this.penaltyTerms = penaltyTerms; }
    }

    /**
     * Payment milestone
     */
    public static class PaymentMilestone {
        @JsonProperty("milestoneId")
        private String milestoneId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("percentage")
        private BigDecimal percentage;

        @JsonProperty("dueDate")
        private LocalDate dueDate;

        @JsonProperty("triggerCondition")
        private String triggerCondition;

        @JsonProperty("status")
        private MilestoneStatus status = MilestoneStatus.PENDING;

        @JsonProperty("paidAt")
        private Instant paidAt;

        @JsonProperty("transactionHash")
        private String transactionHash;

        public PaymentMilestone() {
            this.milestoneId = "PM-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getMilestoneId() { return milestoneId; }
        public void setMilestoneId(String milestoneId) { this.milestoneId = milestoneId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        public String getTriggerCondition() { return triggerCondition; }
        public void setTriggerCondition(String triggerCondition) { this.triggerCondition = triggerCondition; }
        public MilestoneStatus getStatus() { return status; }
        public void setStatus(MilestoneStatus status) { this.status = status; }
        public Instant getPaidAt() { return paidAt; }
        public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
        public String getTransactionHash() { return transactionHash; }
        public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
    }

    /**
     * Contract milestone (non-financial)
     */
    public static class ContractMilestone {
        @JsonProperty("milestoneId")
        private String milestoneId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("targetDate")
        private LocalDate targetDate;

        @JsonProperty("completedDate")
        private LocalDate completedDate;

        @JsonProperty("status")
        private MilestoneStatus status = MilestoneStatus.PENDING;

        @JsonProperty("dependencies")
        private List<String> dependencies = new ArrayList<>();

        @JsonProperty("deliverables")
        private List<String> deliverables = new ArrayList<>();

        public ContractMilestone() {
            this.milestoneId = "CM-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getMilestoneId() { return milestoneId; }
        public void setMilestoneId(String milestoneId) { this.milestoneId = milestoneId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getTargetDate() { return targetDate; }
        public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
        public LocalDate getCompletedDate() { return completedDate; }
        public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
        public MilestoneStatus getStatus() { return status; }
        public void setStatus(MilestoneStatus status) { this.status = status; }
        public List<String> getDependencies() { return dependencies; }
        public void setDependencies(List<String> dependencies) { this.dependencies = dependencies; }
        public List<String> getDeliverables() { return deliverables; }
        public void setDeliverables(List<String> deliverables) { this.deliverables = deliverables; }
    }

    /**
     * Renewal terms for contract
     */
    public static class RenewalTerms {
        @JsonProperty("autoRenew")
        private boolean autoRenew = false;

        @JsonProperty("renewalPeriodMonths")
        private int renewalPeriodMonths;

        @JsonProperty("maxRenewals")
        private int maxRenewals;

        @JsonProperty("renewalNoticedays")
        private int renewalNoticeDays = 30;

        @JsonProperty("priceAdjustmentPercentage")
        private BigDecimal priceAdjustmentPercentage;

        // Getters and setters
        public boolean isAutoRenew() { return autoRenew; }
        public void setAutoRenew(boolean autoRenew) { this.autoRenew = autoRenew; }
        public int getRenewalPeriodMonths() { return renewalPeriodMonths; }
        public void setRenewalPeriodMonths(int renewalPeriodMonths) { this.renewalPeriodMonths = renewalPeriodMonths; }
        public int getMaxRenewals() { return maxRenewals; }
        public void setMaxRenewals(int maxRenewals) { this.maxRenewals = maxRenewals; }
        public int getRenewalNoticeDays() { return renewalNoticeDays; }
        public void setRenewalNoticeDays(int renewalNoticeDays) { this.renewalNoticeDays = renewalNoticeDays; }
        public BigDecimal getPriceAdjustmentPercentage() { return priceAdjustmentPercentage; }
        public void setPriceAdjustmentPercentage(BigDecimal priceAdjustmentPercentage) { this.priceAdjustmentPercentage = priceAdjustmentPercentage; }
    }

    /**
     * Token bindings for stakeholders and assets
     */
    public static class TokenBindings {
        @JsonProperty("primaryToken")
        private TokenBinding primaryToken;

        @JsonProperty("secondaryTokens")
        private List<TokenBinding> secondaryTokens = new ArrayList<>();

        @JsonProperty("compositeTokens")
        private List<CompositeTokenBinding> compositeTokens = new ArrayList<>();

        // Getters and setters
        public TokenBinding getPrimaryToken() { return primaryToken; }
        public void setPrimaryToken(TokenBinding primaryToken) { this.primaryToken = primaryToken; }
        public List<TokenBinding> getSecondaryTokens() { return secondaryTokens; }
        public void setSecondaryTokens(List<TokenBinding> secondaryTokens) { this.secondaryTokens = secondaryTokens; }
        public List<CompositeTokenBinding> getCompositeTokens() { return compositeTokens; }
        public void setCompositeTokens(List<CompositeTokenBinding> compositeTokens) { this.compositeTokens = compositeTokens; }
    }

    /**
     * Individual token binding
     */
    public static class TokenBinding {
        @JsonProperty("tokenId")
        private String tokenId;

        @JsonProperty("tokenType")
        private TokenType tokenType;

        @JsonProperty("assetType")
        private String assetType;

        @JsonProperty("stakeholder")
        private String stakeholder; // Party ID or address

        @JsonProperty("percentage")
        private BigDecimal percentage;

        @JsonProperty("locked")
        private boolean locked = false;

        @JsonProperty("lockUntil")
        private Instant lockUntil;

        // Getters and setters
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public TokenType getTokenType() { return tokenType; }
        public void setTokenType(TokenType tokenType) { this.tokenType = tokenType; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public String getStakeholder() { return stakeholder; }
        public void setStakeholder(String stakeholder) { this.stakeholder = stakeholder; }
        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
        public boolean isLocked() { return locked; }
        public void setLocked(boolean locked) { this.locked = locked; }
        public Instant getLockUntil() { return lockUntil; }
        public void setLockUntil(Instant lockUntil) { this.lockUntil = lockUntil; }
    }

    /**
     * Composite token binding (bundle of tokens)
     */
    public static class CompositeTokenBinding {
        @JsonProperty("compositeTokenId")
        private String compositeTokenId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("componentTokens")
        private List<String> componentTokens = new ArrayList<>();

        @JsonProperty("stakeholder")
        private String stakeholder;

        // Getters and setters
        public String getCompositeTokenId() { return compositeTokenId; }
        public void setCompositeTokenId(String compositeTokenId) { this.compositeTokenId = compositeTokenId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<String> getComponentTokens() { return componentTokens; }
        public void setComponentTokens(List<String> componentTokens) { this.componentTokens = componentTokens; }
        public String getStakeholder() { return stakeholder; }
        public void setStakeholder(String stakeholder) { this.stakeholder = stakeholder; }
    }

    /**
     * Asset valuation
     */
    public static class AssetValuation {
        @JsonProperty("valuationMethod")
        private ValuationMethod valuationMethod;

        @JsonProperty("valuationDate")
        private LocalDate valuationDate;

        @JsonProperty("valuationAmount")
        private BigDecimal valuationAmount;

        @JsonProperty("currency")
        private String currency = "USD";

        @JsonProperty("appraiser")
        private String appraiser;

        @JsonProperty("appraisalDocument")
        private String appraisalDocument;

        @JsonProperty("oracleSource")
        private String oracleSource;

        @JsonProperty("eiNodeId")
        private String eiNodeId;

        // Getters and setters
        public ValuationMethod getValuationMethod() { return valuationMethod; }
        public void setValuationMethod(ValuationMethod valuationMethod) { this.valuationMethod = valuationMethod; }
        public LocalDate getValuationDate() { return valuationDate; }
        public void setValuationDate(LocalDate valuationDate) { this.valuationDate = valuationDate; }
        public BigDecimal getValuationAmount() { return valuationAmount; }
        public void setValuationAmount(BigDecimal valuationAmount) { this.valuationAmount = valuationAmount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getAppraiser() { return appraiser; }
        public void setAppraiser(String appraiser) { this.appraiser = appraiser; }
        public String getAppraisalDocument() { return appraisalDocument; }
        public void setAppraisalDocument(String appraisalDocument) { this.appraisalDocument = appraisalDocument; }
        public String getOracleSource() { return oracleSource; }
        public void setOracleSource(String oracleSource) { this.oracleSource = oracleSource; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
    }

    /**
     * Contract limits and constraints
     */
    public static class ContractLimits {
        @JsonProperty("maxTransactionValue")
        private BigDecimal maxTransactionValue;

        @JsonProperty("minTransactionValue")
        private BigDecimal minTransactionValue;

        @JsonProperty("dailyLimit")
        private BigDecimal dailyLimit;

        @JsonProperty("monthlyLimit")
        private BigDecimal monthlyLimit;

        @JsonProperty("maxExecutions")
        private int maxExecutions;

        @JsonProperty("cooldownPeriodSeconds")
        private long cooldownPeriodSeconds;

        // Getters and setters
        public BigDecimal getMaxTransactionValue() { return maxTransactionValue; }
        public void setMaxTransactionValue(BigDecimal maxTransactionValue) { this.maxTransactionValue = maxTransactionValue; }
        public BigDecimal getMinTransactionValue() { return minTransactionValue; }
        public void setMinTransactionValue(BigDecimal minTransactionValue) { this.minTransactionValue = minTransactionValue; }
        public BigDecimal getDailyLimit() { return dailyLimit; }
        public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }
        public BigDecimal getMonthlyLimit() { return monthlyLimit; }
        public void setMonthlyLimit(BigDecimal monthlyLimit) { this.monthlyLimit = monthlyLimit; }
        public int getMaxExecutions() { return maxExecutions; }
        public void setMaxExecutions(int maxExecutions) { this.maxExecutions = maxExecutions; }
        public long getCooldownPeriodSeconds() { return cooldownPeriodSeconds; }
        public void setCooldownPeriodSeconds(long cooldownPeriodSeconds) { this.cooldownPeriodSeconds = cooldownPeriodSeconds; }
    }

    /**
     * External data source configuration
     */
    public static class DataSource {
        @JsonProperty("sourceId")
        private String sourceId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private DataSourceType type;

        @JsonProperty("eiNodeId")
        private String eiNodeId;

        @JsonProperty("endpoint")
        private String endpoint;

        @JsonProperty("refreshIntervalSeconds")
        private int refreshIntervalSeconds;

        @JsonProperty("lastUpdated")
        private Instant lastUpdated;

        @JsonProperty("status")
        private String status = "ACTIVE";

        public DataSource() {
            this.sourceId = "DS-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getSourceId() { return sourceId; }
        public void setSourceId(String sourceId) { this.sourceId = sourceId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public DataSourceType getType() { return type; }
        public void setType(DataSourceType type) { this.type = type; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public int getRefreshIntervalSeconds() { return refreshIntervalSeconds; }
        public void setRefreshIntervalSeconds(int refreshIntervalSeconds) { this.refreshIntervalSeconds = refreshIntervalSeconds; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // ==================== Enums ====================

    public enum PartyRole {
        OWNER,              // Contract owner/creator
        BUYER,              // Purchasing party
        SELLER,             // Selling party
        INVESTOR,           // Investment party
        GUARANTOR,          // Guarantee provider
        AGENT,              // Agent/broker
        WITNESS,            // Witness to agreement
        VVB,                // Validation and Verification Body
        REGULATOR,          // Regulatory authority
        CUSTODIAN,          // Asset custodian
        ESCROW_AGENT,       // Escrow holder
        BENEFICIARY,        // Beneficiary
        TRUSTEE,            // Trust holder
        AUDITOR,            // Auditor
        CUSTOM              // Custom role
    }

    public enum TokenType {
        PRIMARY,            // Main asset token
        SECONDARY,          // Revenue/rights token
        COMPOSITE,          // Bundle of tokens
        GOVERNANCE,         // Voting rights
        UTILITY,            // Platform utility
        SECURITY,           // Security token
        STABLECOIN          // Stablecoin
    }

    public enum PaymentMethod {
        TOKEN_TRANSFER,     // Direct token transfer
        ESCROW,             // Via escrow
        FIAT_BRIDGE,        // Fiat on/off ramp
        STABLECOIN,         // Stablecoin payment
        MILESTONE_BASED,    // Milestone releases
        STREAMING           // Payment streaming
    }

    public enum MilestoneStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        OVERDUE,
        CANCELLED,
        DISPUTED
    }

    public enum ValuationMethod {
        MARKET_PRICE,       // Current market price
        APPRAISED,          // Third-party appraisal
        ORACLE,             // Oracle data feed
        FIXED,              // Fixed/agreed value
        FORMULA,            // Formula-based
        AVERAGE,            // Time-weighted average
        FLOOR               // Minimum floor price
    }

    public enum DataSourceType {
        STAKEHOLDER,        // Stakeholder-provided data
        EI_NODE,            // EI Node data feed
        ORACLE,             // Blockchain oracle
        API,                // External API
        IOT,                // IoT sensor data
        REGISTRY,           // Registry data (land, carbon, etc.)
        EXCHANGE            // Exchange price feed
    }

    public enum SignatureOrderType {
        ANY_ORDER,          // Signatures can be in any order
        SEQUENTIAL,         // Must follow defined order
        PARALLEL,           // All can sign simultaneously
        CONDITIONAL         // Based on conditions
    }

    // ==================== Utility Methods ====================

    public void addParty(String name, String address, PartyRole role) {
        parties.add(new PartyConfig(name, address, role));
        this.updatedAt = Instant.now();
    }

    public PartyConfig getPartyById(String partyId) {
        return parties.stream()
            .filter(p -> partyId.equals(p.getPartyId()))
            .findFirst()
            .orElse(null);
    }

    public int getPartyCount() {
        return parties.size();
    }

    public int getSignatureRequiredCount() {
        return (int) parties.stream()
            .filter(PartyConfig::isSignatureRequired)
            .count();
    }

    // ==================== Getters and Setters ====================

    public String getParametersId() { return parametersId; }
    public void setParametersId(String parametersId) { this.parametersId = parametersId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public List<PartyConfig> getParties() { return parties; }
    public void setParties(List<PartyConfig> parties) { this.parties = parties; }

    public int getRequiredSignatures() { return requiredSignatures; }
    public void setRequiredSignatures(int requiredSignatures) { this.requiredSignatures = requiredSignatures; }

    public SignatureOrderType getSignatureOrder() { return signatureOrder; }
    public void setSignatureOrder(SignatureOrderType signatureOrder) { this.signatureOrder = signatureOrder; }

    public FinancialTerms getFinancialTerms() { return financialTerms; }
    public void setFinancialTerms(FinancialTerms financialTerms) { this.financialTerms = financialTerms; }

    public List<PaymentMilestone> getPaymentSchedule() { return paymentSchedule; }
    public void setPaymentSchedule(List<PaymentMilestone> paymentSchedule) { this.paymentSchedule = paymentSchedule; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public LocalDate getExecutionDate() { return executionDate; }
    public void setExecutionDate(LocalDate executionDate) { this.executionDate = executionDate; }

    public List<ContractMilestone> getMilestones() { return milestones; }
    public void setMilestones(List<ContractMilestone> milestones) { this.milestones = milestones; }

    public RenewalTerms getRenewalTerms() { return renewalTerms; }
    public void setRenewalTerms(RenewalTerms renewalTerms) { this.renewalTerms = renewalTerms; }

    public TokenBindings getTokenBindings() { return tokenBindings; }
    public void setTokenBindings(TokenBindings tokenBindings) { this.tokenBindings = tokenBindings; }

    public AssetValuation getAssetValuation() { return assetValuation; }
    public void setAssetValuation(AssetValuation assetValuation) { this.assetValuation = assetValuation; }

    public ContractLimits getLimits() { return limits; }
    public void setLimits(ContractLimits limits) { this.limits = limits; }

    public Map<String, BigDecimal> getThresholds() { return thresholds; }
    public void setThresholds(Map<String, BigDecimal> thresholds) { this.thresholds = thresholds; }

    public List<DataSource> getDataSources() { return dataSources; }
    public void setDataSources(List<DataSource> dataSources) { this.dataSources = dataSources; }

    public Map<String, Object> getCustomParameters() { return customParameters; }
    public void setCustomParameters(Map<String, Object> customParameters) { this.customParameters = customParameters; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return String.format("ContractParameters{id='%s', contractId='%s', parties=%d, dataSources=%d}",
            parametersId, contractId, parties.size(), dataSources.size());
    }
}
