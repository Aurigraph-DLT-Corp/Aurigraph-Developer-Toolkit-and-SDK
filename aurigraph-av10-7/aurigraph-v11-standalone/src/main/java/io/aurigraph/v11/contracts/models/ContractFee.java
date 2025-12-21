package io.aurigraph.v11.contracts.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * ContractFee - Fee tracking and calculation for ActiveContracts
 *
 * Implements the fee structure as defined in the SPARC plan:
 * - Per-stage fees (upload, prose, parameters, programming, etc.)
 * - Variable fees based on complexity
 * - Discount structures
 * - Fee splitting for multi-party contracts
 * - Escrow support
 *
 * Fee Currency: AURI tokens
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
public class ContractFee {

    @JsonProperty("feeId")
    private String feeId;

    @JsonProperty("contractId")
    private String contractId;

    @JsonProperty("sessionId")
    private String sessionId; // Wizard session ID

    // ==================== Fee Breakdown ====================

    @JsonProperty("documentUploadFee")
    private StageFee documentUploadFee;

    @JsonProperty("proseEditingFee")
    private StageFee proseEditingFee;

    @JsonProperty("parametersFee")
    private StageFee parametersFee;

    @JsonProperty("programmingFee")
    private StageFee programmingFee;

    @JsonProperty("versionControlFee")
    private StageFee versionControlFee;

    @JsonProperty("signatureFee")
    private StageFee signatureFee;

    @JsonProperty("vvbVerificationFee")
    private StageFee vvbVerificationFee;

    @JsonProperty("activationFee")
    private StageFee activationFee;

    // ==================== Totals ====================

    @JsonProperty("subtotal")
    private BigDecimal subtotal = BigDecimal.ZERO;

    @JsonProperty("discounts")
    private List<FeeDiscount> discounts = new ArrayList<>();

    @JsonProperty("discountTotal")
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @JsonProperty("total")
    private BigDecimal total = BigDecimal.ZERO;

    @JsonProperty("currency")
    private String currency = "AURI";

    // ==================== Payment State ====================

    @JsonProperty("status")
    private FeeStatus status = FeeStatus.PENDING;

    @JsonProperty("paidAmount")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @JsonProperty("remainingAmount")
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @JsonProperty("payments")
    private List<FeePayment> payments = new ArrayList<>();

    // ==================== Fee Split (Multi-party) ====================

    @JsonProperty("feeSplit")
    private FeeSplit feeSplit;

    // ==================== Escrow ====================

    @JsonProperty("escrowRequired")
    private boolean escrowRequired = false;

    @JsonProperty("escrowAmount")
    private BigDecimal escrowAmount = BigDecimal.ZERO;

    @JsonProperty("escrowStatus")
    private EscrowStatus escrowStatus;

    @JsonProperty("escrowAddress")
    private String escrowAddress;

    // ==================== Timestamps ====================

    @JsonProperty("estimatedAt")
    private Instant estimatedAt;

    @JsonProperty("expiresAt")
    private Instant expiresAt; // Fee estimate expiration

    @JsonProperty("paidAt")
    private Instant paidAt;

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;

    // Default constructor
    public ContractFee() {
        this.feeId = "FEE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        initializeStageFees();
    }

    // Constructor with contract ID
    public ContractFee(String contractId) {
        this();
        this.contractId = contractId;
    }

    private void initializeStageFees() {
        this.documentUploadFee = new StageFee(FeeStage.DOCUMENT_UPLOAD);
        this.proseEditingFee = new StageFee(FeeStage.PROSE_EDITING);
        this.parametersFee = new StageFee(FeeStage.PARAMETERS);
        this.programmingFee = new StageFee(FeeStage.PROGRAMMING);
        this.versionControlFee = new StageFee(FeeStage.VERSION_CONTROL);
        this.signatureFee = new StageFee(FeeStage.SIGNATURES);
        this.vvbVerificationFee = new StageFee(FeeStage.VVB_VERIFICATION);
        this.activationFee = new StageFee(FeeStage.ACTIVATION);
    }

    // ==================== Nested Classes ====================

    /**
     * Fee for a specific stage
     */
    public static class StageFee {
        @JsonProperty("stage")
        private FeeStage stage;

        @JsonProperty("baseFee")
        private BigDecimal baseFee = BigDecimal.ZERO;

        @JsonProperty("variableFees")
        private List<VariableFee> variableFees = new ArrayList<>();

        @JsonProperty("subtotal")
        private BigDecimal subtotal = BigDecimal.ZERO;

        @JsonProperty("calculated")
        private boolean calculated = false;

        @JsonProperty("calculatedAt")
        private Instant calculatedAt;

        public StageFee() {}

        public StageFee(FeeStage stage) {
            this.stage = stage;
            this.baseFee = getBaseFeForStage(stage);
        }

        private static BigDecimal getBaseFeForStage(FeeStage stage) {
            return switch (stage) {
                case DOCUMENT_UPLOAD -> new BigDecimal("5.00");
                case PROSE_EDITING -> new BigDecimal("10.00");
                case PARAMETERS -> new BigDecimal("8.00");
                case PROGRAMMING -> new BigDecimal("15.00");
                case VERSION_CONTROL -> new BigDecimal("3.00");
                case SIGNATURES -> new BigDecimal("2.00"); // Per signature
                case VVB_VERIFICATION -> new BigDecimal("25.00");
                case ACTIVATION -> new BigDecimal("20.00");
            };
        }

        public void addVariableFee(String description, BigDecimal unitCost, int quantity) {
            VariableFee fee = new VariableFee(description, unitCost, quantity);
            variableFees.add(fee);
            recalculate();
        }

        public void recalculate() {
            BigDecimal variableTotal = variableFees.stream()
                .map(VariableFee::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            this.subtotal = baseFee.add(variableTotal);
            this.calculated = true;
            this.calculatedAt = Instant.now();
        }

        // Getters and setters
        public FeeStage getStage() { return stage; }
        public void setStage(FeeStage stage) { this.stage = stage; }
        public BigDecimal getBaseFee() { return baseFee; }
        public void setBaseFee(BigDecimal baseFee) { this.baseFee = baseFee; }
        public List<VariableFee> getVariableFees() { return variableFees; }
        public void setVariableFees(List<VariableFee> variableFees) { this.variableFees = variableFees; }
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
        public boolean isCalculated() { return calculated; }
        public void setCalculated(boolean calculated) { this.calculated = calculated; }
        public Instant getCalculatedAt() { return calculatedAt; }
        public void setCalculatedAt(Instant calculatedAt) { this.calculatedAt = calculatedAt; }
    }

    /**
     * Variable fee component
     */
    public static class VariableFee {
        @JsonProperty("description")
        private String description;

        @JsonProperty("unitCost")
        private BigDecimal unitCost;

        @JsonProperty("quantity")
        private int quantity;

        @JsonProperty("total")
        private BigDecimal total;

        public VariableFee() {}

        public VariableFee(String description, BigDecimal unitCost, int quantity) {
            this.description = description;
            this.unitCost = unitCost;
            this.quantity = quantity;
            this.total = unitCost.multiply(BigDecimal.valueOf(quantity));
        }

        // Getters and setters
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public BigDecimal getTotal() { return total; }
        public void setTotal(BigDecimal total) { this.total = total; }
    }

    /**
     * Fee discount
     */
    public static class FeeDiscount {
        @JsonProperty("discountId")
        private String discountId;

        @JsonProperty("type")
        private DiscountType type;

        @JsonProperty("description")
        private String description;

        @JsonProperty("percentage")
        private BigDecimal percentage;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("code")
        private String code;

        @JsonProperty("appliedAt")
        private Instant appliedAt;

        public FeeDiscount() {
            this.discountId = "DISC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            this.appliedAt = Instant.now();
        }

        public FeeDiscount(DiscountType type, String description, BigDecimal percentage) {
            this();
            this.type = type;
            this.description = description;
            this.percentage = percentage;
        }

        // Getters and setters
        public String getDiscountId() { return discountId; }
        public void setDiscountId(String discountId) { this.discountId = discountId; }
        public DiscountType getType() { return type; }
        public void setType(DiscountType type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public Instant getAppliedAt() { return appliedAt; }
        public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }
    }

    /**
     * Fee payment record
     */
    public static class FeePayment {
        @JsonProperty("paymentId")
        private String paymentId;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("currency")
        private String currency = "AURI";

        @JsonProperty("transactionHash")
        private String transactionHash;

        @JsonProperty("fromAddress")
        private String fromAddress;

        @JsonProperty("toAddress")
        private String toAddress;

        @JsonProperty("paymentMethod")
        private PaymentMethod paymentMethod;

        @JsonProperty("status")
        private PaymentStatus status = PaymentStatus.PENDING;

        @JsonProperty("createdAt")
        private Instant createdAt;

        @JsonProperty("confirmedAt")
        private Instant confirmedAt;

        public FeePayment() {
            this.paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.createdAt = Instant.now();
        }

        // Getters and setters
        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getTransactionHash() { return transactionHash; }
        public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
        public String getFromAddress() { return fromAddress; }
        public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }
        public String getToAddress() { return toAddress; }
        public void setToAddress(String toAddress) { this.toAddress = toAddress; }
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public PaymentStatus getStatus() { return status; }
        public void setStatus(PaymentStatus status) { this.status = status; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getConfirmedAt() { return confirmedAt; }
        public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    }

    /**
     * Fee split configuration for multi-party contracts
     */
    public static class FeeSplit {
        @JsonProperty("method")
        private SplitMethod method = SplitMethod.EQUAL;

        @JsonProperty("allocations")
        private List<FeeAllocation> allocations = new ArrayList<>();

        @JsonProperty("escrowRequired")
        private boolean escrowRequired = true;

        @JsonProperty("escrowReleaseCondition")
        private String escrowReleaseCondition = "ALL_SIGNATURES";

        // Getters and setters
        public SplitMethod getMethod() { return method; }
        public void setMethod(SplitMethod method) { this.method = method; }
        public List<FeeAllocation> getAllocations() { return allocations; }
        public void setAllocations(List<FeeAllocation> allocations) { this.allocations = allocations; }
        public boolean isEscrowRequired() { return escrowRequired; }
        public void setEscrowRequired(boolean escrowRequired) { this.escrowRequired = escrowRequired; }
        public String getEscrowReleaseCondition() { return escrowReleaseCondition; }
        public void setEscrowReleaseCondition(String escrowReleaseCondition) { this.escrowReleaseCondition = escrowReleaseCondition; }
    }

    /**
     * Individual fee allocation for a party
     */
    public static class FeeAllocation {
        @JsonProperty("partyId")
        private String partyId;

        @JsonProperty("partyAddress")
        private String partyAddress;

        @JsonProperty("role")
        private String role;

        @JsonProperty("percentage")
        private BigDecimal percentage;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("paid")
        private boolean paid = false;

        @JsonProperty("paidAt")
        private Instant paidAt;

        @JsonProperty("transactionHash")
        private String transactionHash;

        // Getters and setters
        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }
        public String getPartyAddress() { return partyAddress; }
        public void setPartyAddress(String partyAddress) { this.partyAddress = partyAddress; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public boolean isPaid() { return paid; }
        public void setPaid(boolean paid) { this.paid = paid; }
        public Instant getPaidAt() { return paidAt; }
        public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
        public String getTransactionHash() { return transactionHash; }
        public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
    }

    // ==================== Enums ====================

    public enum FeeStage {
        DOCUMENT_UPLOAD,
        PROSE_EDITING,
        PARAMETERS,
        PROGRAMMING,
        VERSION_CONTROL,
        SIGNATURES,
        VVB_VERIFICATION,
        ACTIVATION
    }

    public enum FeeStatus {
        PENDING,            // Awaiting calculation
        ESTIMATED,          // Estimate generated
        AWAITING_PAYMENT,   // Waiting for payment
        PARTIALLY_PAID,     // Some payments received
        PAID,               // Fully paid
        REFUNDED,           // Payment refunded
        WAIVED              // Fee waived
    }

    public enum DiscountType {
        VOLUME,             // High volume discount
        ENTERPRISE,         // Enterprise tier
        TEMPLATE,           // Using approved template
        EARLY_PAYMENT,      // Pay within 24 hours
        REFERRAL,           // Referral program
        STAKING,            // AURI staking discount
        PROMOTIONAL         // Promotional code
    }

    public enum PaymentMethod {
        AURI_TOKEN,         // AURI token payment
        STABLECOIN,         // Stablecoin (USDC, USDT)
        ESCROW,             // Via escrow
        STREAMING           // Payment streaming
    }

    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        CONFIRMED,
        FAILED,
        REFUNDED
    }

    public enum SplitMethod {
        EQUAL,              // Split equally
        PROPORTIONAL,       // Based on ownership percentage
        FIXED,              // Fixed amounts per party
        CUSTOM              // Custom allocation
    }

    public enum EscrowStatus {
        NOT_REQUIRED,
        PENDING_DEPOSIT,
        DEPOSITED,
        PARTIALLY_RELEASED,
        RELEASED,
        REFUNDED
    }

    // ==================== Fee Calculation Methods ====================

    /**
     * Calculate document upload fee
     */
    public void calculateDocumentUploadFee(long documentSizeKB, boolean hasTextExtraction) {
        documentUploadFee = new StageFee(FeeStage.DOCUMENT_UPLOAD);
        documentUploadFee.addVariableFee("Storage", new BigDecimal("0.01"), (int) documentSizeKB);
        if (hasTextExtraction) {
            documentUploadFee.addVariableFee("Text Extraction", new BigDecimal("2.00"), 1);
        }
        documentUploadFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate prose editing fee
     */
    public void calculateProseEditingFee(int clauseCount, int scheduleCount, boolean usesTemplate) {
        proseEditingFee = new StageFee(FeeStage.PROSE_EDITING);
        proseEditingFee.addVariableFee("Per Clause", new BigDecimal("0.50"), clauseCount);
        proseEditingFee.addVariableFee("Per Schedule", new BigDecimal("1.00"), scheduleCount);
        if (usesTemplate) {
            proseEditingFee.addVariableFee("Legal Template", new BigDecimal("5.00"), 1);
        }
        proseEditingFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate parameters fee
     */
    public void calculateParametersFee(int partyCount, int tokenBindings, boolean hasValuation) {
        parametersFee = new StageFee(FeeStage.PARAMETERS);
        parametersFee.addVariableFee("Per Party", new BigDecimal("1.00"), partyCount);
        parametersFee.addVariableFee("Token Binding", new BigDecimal("2.00"), tokenBindings);
        if (hasValuation) {
            parametersFee.addVariableFee("Asset Valuation", new BigDecimal("3.00"), 1);
        }
        parametersFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate programming fee
     */
    public void calculateProgrammingFee(int triggerCount, int conditionCount, int actionCount,
                                        int oracleCount, int eiNodeCount) {
        programmingFee = new StageFee(FeeStage.PROGRAMMING);
        programmingFee.addVariableFee("Per Trigger", new BigDecimal("2.00"), triggerCount);
        programmingFee.addVariableFee("Per Condition", new BigDecimal("1.00"), conditionCount);
        programmingFee.addVariableFee("Per Action", new BigDecimal("1.50"), actionCount);
        programmingFee.addVariableFee("Oracle Integration", new BigDecimal("5.00"), oracleCount);
        programmingFee.addVariableFee("EI Node Connection", new BigDecimal("3.00"), eiNodeCount);
        programmingFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate version control fee
     */
    public void calculateVersionControlFee(int changeCount, boolean isAmendment) {
        versionControlFee = new StageFee(FeeStage.VERSION_CONTROL);
        versionControlFee.addVariableFee("Per Change Logged", new BigDecimal("0.10"), changeCount);
        if (isAmendment) {
            versionControlFee.addVariableFee("Amendment", new BigDecimal("5.00"), 1);
        }
        versionControlFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate signature fee
     */
    public void calculateSignatureFee(int signatureCount, boolean quantumSignatures) {
        signatureFee = new StageFee(FeeStage.SIGNATURES);
        signatureFee.setBaseFee(BigDecimal.ZERO); // No base fee for signatures
        signatureFee.addVariableFee("Signature Request", new BigDecimal("2.00"), signatureCount);
        if (quantumSignatures) {
            signatureFee.addVariableFee("Quantum Signature", new BigDecimal("1.00"), signatureCount);
        }
        signatureFee.addVariableFee("Signature Verification", new BigDecimal("0.50"), signatureCount);
        signatureFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate VVB verification fee
     */
    public void calculateVVBFee(boolean expedited, boolean resubmission) {
        vvbVerificationFee = new StageFee(FeeStage.VVB_VERIFICATION);
        if (expedited) {
            vvbVerificationFee.addVariableFee("Expedited Review", new BigDecimal("50.00"), 1);
        }
        if (resubmission) {
            vvbVerificationFee.addVariableFee("Re-submission", new BigDecimal("10.00"), 1);
        }
        vvbVerificationFee.recalculate();
        recalculateTotal();
    }

    /**
     * Calculate activation fee
     */
    public void calculateActivationFee(boolean merkleRegistration, boolean marketplaceListing) {
        activationFee = new StageFee(FeeStage.ACTIVATION);
        if (merkleRegistration) {
            activationFee.addVariableFee("Merkle Registration", new BigDecimal("5.00"), 1);
        }
        if (marketplaceListing) {
            activationFee.addVariableFee("Marketplace Listing", new BigDecimal("10.00"), 1);
        }
        activationFee.recalculate();
        recalculateTotal();
    }

    /**
     * Recalculate total from all stages
     */
    public void recalculateTotal() {
        this.subtotal = BigDecimal.ZERO;

        if (documentUploadFee != null && documentUploadFee.isCalculated()) {
            subtotal = subtotal.add(documentUploadFee.getSubtotal());
        }
        if (proseEditingFee != null && proseEditingFee.isCalculated()) {
            subtotal = subtotal.add(proseEditingFee.getSubtotal());
        }
        if (parametersFee != null && parametersFee.isCalculated()) {
            subtotal = subtotal.add(parametersFee.getSubtotal());
        }
        if (programmingFee != null && programmingFee.isCalculated()) {
            subtotal = subtotal.add(programmingFee.getSubtotal());
        }
        if (versionControlFee != null && versionControlFee.isCalculated()) {
            subtotal = subtotal.add(versionControlFee.getSubtotal());
        }
        if (signatureFee != null && signatureFee.isCalculated()) {
            subtotal = subtotal.add(signatureFee.getSubtotal());
        }
        if (vvbVerificationFee != null && vvbVerificationFee.isCalculated()) {
            subtotal = subtotal.add(vvbVerificationFee.getSubtotal());
        }
        if (activationFee != null && activationFee.isCalculated()) {
            subtotal = subtotal.add(activationFee.getSubtotal());
        }

        // Apply discounts
        this.discountTotal = BigDecimal.ZERO;
        for (FeeDiscount discount : discounts) {
            BigDecimal discountAmount = subtotal.multiply(discount.getPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            discount.setAmount(discountAmount);
            discountTotal = discountTotal.add(discountAmount);
        }

        this.total = subtotal.subtract(discountTotal);
        this.remainingAmount = total.subtract(paidAmount);
        this.estimatedAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(24 * 60 * 60); // 24 hour expiry
        this.updatedAt = Instant.now();

        if (status == FeeStatus.PENDING) {
            this.status = FeeStatus.ESTIMATED;
        }
    }

    /**
     * Add a discount
     */
    public void addDiscount(DiscountType type, String description, BigDecimal percentage) {
        FeeDiscount discount = new FeeDiscount(type, description, percentage);
        discounts.add(discount);
        recalculateTotal();
    }

    /**
     * Record a payment
     */
    public void recordPayment(BigDecimal amount, String transactionHash, String fromAddress) {
        FeePayment payment = new FeePayment();
        payment.setAmount(amount);
        payment.setTransactionHash(transactionHash);
        payment.setFromAddress(fromAddress);
        payment.setStatus(PaymentStatus.CONFIRMED);
        payment.setConfirmedAt(Instant.now());
        payments.add(payment);

        paidAmount = paidAmount.add(amount);
        remainingAmount = total.subtract(paidAmount);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            status = FeeStatus.PAID;
            paidAt = Instant.now();
        } else {
            status = FeeStatus.PARTIALLY_PAID;
        }
        updatedAt = Instant.now();
    }

    /**
     * Setup fee split for multi-party contract
     */
    public void setupFeeSplit(SplitMethod method, List<FeeAllocation> allocations) {
        this.feeSplit = new FeeSplit();
        this.feeSplit.setMethod(method);
        this.feeSplit.setAllocations(allocations);
        this.escrowRequired = true;
        this.escrowStatus = EscrowStatus.PENDING_DEPOSIT;

        // Calculate each party's share
        for (FeeAllocation allocation : allocations) {
            BigDecimal share = total.multiply(allocation.getPercentage())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            allocation.setAmount(share);
        }
    }

    // ==================== Getters and Setters ====================

    public String getFeeId() { return feeId; }
    public void setFeeId(String feeId) { this.feeId = feeId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public StageFee getDocumentUploadFee() { return documentUploadFee; }
    public void setDocumentUploadFee(StageFee documentUploadFee) { this.documentUploadFee = documentUploadFee; }

    public StageFee getProseEditingFee() { return proseEditingFee; }
    public void setProseEditingFee(StageFee proseEditingFee) { this.proseEditingFee = proseEditingFee; }

    public StageFee getParametersFee() { return parametersFee; }
    public void setParametersFee(StageFee parametersFee) { this.parametersFee = parametersFee; }

    public StageFee getProgrammingFee() { return programmingFee; }
    public void setProgrammingFee(StageFee programmingFee) { this.programmingFee = programmingFee; }

    public StageFee getVersionControlFee() { return versionControlFee; }
    public void setVersionControlFee(StageFee versionControlFee) { this.versionControlFee = versionControlFee; }

    public StageFee getSignatureFee() { return signatureFee; }
    public void setSignatureFee(StageFee signatureFee) { this.signatureFee = signatureFee; }

    public StageFee getVvbVerificationFee() { return vvbVerificationFee; }
    public void setVvbVerificationFee(StageFee vvbVerificationFee) { this.vvbVerificationFee = vvbVerificationFee; }

    public StageFee getActivationFee() { return activationFee; }
    public void setActivationFee(StageFee activationFee) { this.activationFee = activationFee; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public List<FeeDiscount> getDiscounts() { return discounts; }
    public void setDiscounts(List<FeeDiscount> discounts) { this.discounts = discounts; }

    public BigDecimal getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(BigDecimal discountTotal) { this.discountTotal = discountTotal; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public FeeStatus getStatus() { return status; }
    public void setStatus(FeeStatus status) { this.status = status; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }

    public List<FeePayment> getPayments() { return payments; }
    public void setPayments(List<FeePayment> payments) { this.payments = payments; }

    public FeeSplit getFeeSplit() { return feeSplit; }
    public void setFeeSplit(FeeSplit feeSplit) { this.feeSplit = feeSplit; }

    public boolean isEscrowRequired() { return escrowRequired; }
    public void setEscrowRequired(boolean escrowRequired) { this.escrowRequired = escrowRequired; }

    public BigDecimal getEscrowAmount() { return escrowAmount; }
    public void setEscrowAmount(BigDecimal escrowAmount) { this.escrowAmount = escrowAmount; }

    public EscrowStatus getEscrowStatus() { return escrowStatus; }
    public void setEscrowStatus(EscrowStatus escrowStatus) { this.escrowStatus = escrowStatus; }

    public String getEscrowAddress() { return escrowAddress; }
    public void setEscrowAddress(String escrowAddress) { this.escrowAddress = escrowAddress; }

    public Instant getEstimatedAt() { return estimatedAt; }
    public void setEstimatedAt(Instant estimatedAt) { this.estimatedAt = estimatedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return String.format("ContractFee{id='%s', contractId='%s', total=%s %s, status=%s}",
            feeId, contractId, total, currency, status);
    }
}
