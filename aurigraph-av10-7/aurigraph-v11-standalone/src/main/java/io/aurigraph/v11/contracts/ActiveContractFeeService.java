package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ActiveContract Fee Service
 *
 * Calculates and manages fees for ActiveContract creation and management.
 * Implements the fee structure from the SPARC plan.
 *
 * Fee Stages:
 * 1. Document Upload: 5.00 AURI + 0.01/KB storage
 * 2. Prose Editing: 10.00 AURI + 0.50/clause
 * 3. Parameters: 8.00 AURI + 1.00/party + 2.00/token binding
 * 4. Programming: 15.00 AURI + 2.00/trigger + 1.00/condition + 1.50/action
 * 5. Version Control: 3.00 AURI + 0.10/change
 * 6. Signatures: 2.00 AURI/signature + 1.00 quantum + 0.50 verification
 * 7. VVB Verification: 25.00 AURI flat
 * 8. Activation: 20.00 AURI + 5.00 merkle + 10.00 marketplace
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@ApplicationScoped
public class ActiveContractFeeService {

    private static final Logger LOG = Logger.getLogger(ActiveContractFeeService.class);

    // Fee storage (in production, use a database)
    private final Map<String, ContractFee> feeStore = new ConcurrentHashMap<>();

    // ==================== Fee Calculation ====================

    /**
     * Calculate complete fee estimate for a contract
     */
    public ContractFee calculateFeeEstimate(String contractId,
                                             ContractProse prose,
                                             ContractParameters parameters,
                                             ContractProgramming programming) {
        LOG.infof("Calculating fee estimate for contract: %s", contractId);

        ContractFee fee = new ContractFee(contractId);

        // Calculate each stage
        calculateDocumentUploadFee(fee, 50); // Default 50KB
        calculateProseEditingFee(fee, prose);
        calculateParametersFee(fee, parameters);
        calculateProgrammingFee(fee, programming);
        calculateVersionControlFee(fee, 10); // Default 10 changes
        calculateSignatureFee(fee, parameters);
        calculateVVBFee(fee, false, false);
        calculateActivationFee(fee, true, false);

        // Apply any applicable discounts
        applyAutomaticDiscounts(fee, contractId);

        // Recalculate totals
        fee.recalculateTotal();

        // Store the fee estimate
        feeStore.put(fee.getFeeId(), fee);

        LOG.infof("Fee estimate calculated: %s AURI for contract %s",
            fee.getTotal(), contractId);

        return fee;
    }

    /**
     * Calculate fee for wizard session (document upload stage)
     */
    public ContractFee calculateDocumentUploadFee(String sessionId, long documentSizeKB, boolean hasTextExtraction) {
        ContractFee fee = new ContractFee();
        fee.setSessionId(sessionId);
        fee.calculateDocumentUploadFee(documentSizeKB, hasTextExtraction);
        feeStore.put(fee.getFeeId(), fee);
        return fee;
    }

    /**
     * Update fee after prose editing
     */
    public ContractFee updateProseEditingFee(String feeId, ContractProse prose) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        calculateProseEditingFee(fee, prose);
        fee.recalculateTotal();
        return fee;
    }

    /**
     * Update fee after parameters configuration
     */
    public ContractFee updateParametersFee(String feeId, ContractParameters parameters) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        calculateParametersFee(fee, parameters);
        fee.recalculateTotal();
        return fee;
    }

    /**
     * Update fee after programming configuration
     */
    public ContractFee updateProgrammingFee(String feeId, ContractProgramming programming) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        calculateProgrammingFee(fee, programming);
        fee.recalculateTotal();
        return fee;
    }

    // ==================== Individual Stage Calculations ====================

    private void calculateDocumentUploadFee(ContractFee fee, long documentSizeKB) {
        fee.calculateDocumentUploadFee(documentSizeKB, true);
    }

    private void calculateProseEditingFee(ContractFee fee, ContractProse prose) {
        if (prose == null) {
            fee.calculateProseEditingFee(0, 0, false);
            return;
        }

        int clauseCount = prose.getTotalClauseCount();
        int scheduleCount = prose.getSchedules().size();
        boolean usesTemplate = prose.getTemplateId() != null;

        fee.calculateProseEditingFee(clauseCount, scheduleCount, usesTemplate);
    }

    private void calculateParametersFee(ContractFee fee, ContractParameters parameters) {
        if (parameters == null) {
            fee.calculateParametersFee(0, 0, false);
            return;
        }

        int partyCount = parameters.getParties().size();
        int tokenBindings = countTokenBindings(parameters);
        boolean hasValuation = parameters.getAssetValuation() != null;

        fee.calculateParametersFee(partyCount, tokenBindings, hasValuation);
    }

    private void calculateProgrammingFee(ContractFee fee, ContractProgramming programming) {
        if (programming == null) {
            fee.calculateProgrammingFee(0, 0, 0, 0, 0);
            return;
        }

        int triggerCount = programming.getTriggers().size();
        int conditionCount = programming.getConditions().size();
        int actionCount = programming.getActions().size();
        int oracleCount = programming.getOracleConnections().size();
        int eiNodeCount = programming.getEiNodeIntegrations().size();

        fee.calculateProgrammingFee(triggerCount, conditionCount, actionCount, oracleCount, eiNodeCount);
    }

    private void calculateVersionControlFee(ContractFee fee, int changeCount) {
        fee.calculateVersionControlFee(changeCount, false);
    }

    private void calculateSignatureFee(ContractFee fee, ContractParameters parameters) {
        if (parameters == null) {
            fee.calculateSignatureFee(0, true);
            return;
        }

        int signatureCount = parameters.getSignatureRequiredCount();
        fee.calculateSignatureFee(signatureCount, true); // Always use quantum signatures
    }

    private void calculateVVBFee(ContractFee fee, boolean expedited, boolean resubmission) {
        fee.calculateVVBFee(expedited, resubmission);
    }

    private void calculateActivationFee(ContractFee fee, boolean merkleRegistration, boolean marketplaceListing) {
        fee.calculateActivationFee(merkleRegistration, marketplaceListing);
    }

    // ==================== Discount Management ====================

    /**
     * Apply automatic discounts based on contract and user attributes
     */
    private void applyAutomaticDiscounts(ContractFee fee, String contractId) {
        // Volume discount (simulated - in production, check user's contract count)
        // applyVolumeDiscount(fee, contractId);

        // Template discount if using approved template
        // Already applied in prose fee calculation
    }

    /**
     * Apply a discount code
     */
    public ContractFee applyDiscountCode(String feeId, String code) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        // Validate and apply discount code
        ContractFee.DiscountType discountType = validateDiscountCode(code);
        if (discountType != null) {
            BigDecimal percentage = getDiscountPercentage(discountType);
            fee.addDiscount(discountType, "Discount code: " + code, percentage);
            LOG.infof("Applied discount code %s (%s%%) to fee %s", code, percentage, feeId);
        }

        return fee;
    }

    /**
     * Apply staking discount
     */
    public ContractFee applyStakingDiscount(String feeId, BigDecimal stakedAmount) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        // 15% discount for staking 10K+ AURI
        if (stakedAmount.compareTo(new BigDecimal("10000")) >= 0) {
            fee.addDiscount(ContractFee.DiscountType.STAKING, "Staking discount (10K+ AURI)", new BigDecimal("15"));
            LOG.infof("Applied staking discount to fee %s", feeId);
        }

        return fee;
    }

    private ContractFee.DiscountType validateDiscountCode(String code) {
        // In production, validate against database
        if (code.startsWith("PROMO")) {
            return ContractFee.DiscountType.PROMOTIONAL;
        } else if (code.startsWith("REF")) {
            return ContractFee.DiscountType.REFERRAL;
        } else if (code.startsWith("ENT")) {
            return ContractFee.DiscountType.ENTERPRISE;
        }
        return null;
    }

    private BigDecimal getDiscountPercentage(ContractFee.DiscountType type) {
        return switch (type) {
            case VOLUME -> new BigDecimal("10");
            case ENTERPRISE -> new BigDecimal("20");
            case TEMPLATE -> new BigDecimal("15");
            case EARLY_PAYMENT -> new BigDecimal("5");
            case REFERRAL -> new BigDecimal("10");
            case STAKING -> new BigDecimal("15");
            case PROMOTIONAL -> new BigDecimal("10");
        };
    }

    // ==================== Payment Management ====================

    /**
     * Record a payment for a fee
     */
    public ContractFee recordPayment(String feeId, BigDecimal amount, String transactionHash, String fromAddress) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        fee.recordPayment(amount, transactionHash, fromAddress);
        LOG.infof("Recorded payment of %s AURI for fee %s (tx: %s)",
            amount, feeId, transactionHash);

        return fee;
    }

    /**
     * Setup fee split for multi-party contract
     */
    public ContractFee setupFeeSplit(String feeId, ContractFee.SplitMethod method,
                                      List<ContractFee.FeeAllocation> allocations) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            throw new IllegalArgumentException("Fee not found: " + feeId);
        }

        fee.setupFeeSplit(method, allocations);
        LOG.infof("Setup fee split for %s with %d parties", feeId, allocations.size());

        return fee;
    }

    // ==================== Fee Retrieval ====================

    /**
     * Get fee by ID
     */
    public ContractFee getFee(String feeId) {
        return feeStore.get(feeId);
    }

    /**
     * Get fee by contract ID
     */
    public ContractFee getFeeByContractId(String contractId) {
        return feeStore.values().stream()
            .filter(f -> contractId.equals(f.getContractId()))
            .findFirst()
            .orElse(null);
    }

    /**
     * Get fee by session ID
     */
    public ContractFee getFeeBySessionId(String sessionId) {
        return feeStore.values().stream()
            .filter(f -> sessionId.equals(f.getSessionId()))
            .findFirst()
            .orElse(null);
    }

    /**
     * Get fee summary as JSON-compatible map
     */
    public Map<String, Object> getFeeSummary(String feeId) {
        ContractFee fee = feeStore.get(feeId);
        if (fee == null) {
            return null;
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("feeId", fee.getFeeId());
        summary.put("contractId", fee.getContractId());
        summary.put("currency", fee.getCurrency());

        // Breakdown by stage
        Map<String, Object> breakdown = new LinkedHashMap<>();
        addStageSummary(breakdown, "documentUpload", fee.getDocumentUploadFee());
        addStageSummary(breakdown, "proseEditing", fee.getProseEditingFee());
        addStageSummary(breakdown, "parameters", fee.getParametersFee());
        addStageSummary(breakdown, "programming", fee.getProgrammingFee());
        addStageSummary(breakdown, "versionControl", fee.getVersionControlFee());
        addStageSummary(breakdown, "signatures", fee.getSignatureFee());
        addStageSummary(breakdown, "vvbVerification", fee.getVvbVerificationFee());
        addStageSummary(breakdown, "activation", fee.getActivationFee());
        summary.put("breakdown", breakdown);

        summary.put("subtotal", fee.getSubtotal());

        // Discounts
        if (!fee.getDiscounts().isEmpty()) {
            List<Map<String, Object>> discountList = new ArrayList<>();
            for (ContractFee.FeeDiscount discount : fee.getDiscounts()) {
                Map<String, Object> d = new LinkedHashMap<>();
                d.put("type", discount.getType().name());
                d.put("description", discount.getDescription());
                d.put("percentage", discount.getPercentage());
                d.put("amount", discount.getAmount());
                discountList.add(d);
            }
            summary.put("discounts", discountList);
            summary.put("discountTotal", fee.getDiscountTotal());
        }

        summary.put("total", fee.getTotal());
        summary.put("status", fee.getStatus().name());
        summary.put("paidAmount", fee.getPaidAmount());
        summary.put("remainingAmount", fee.getRemainingAmount());
        summary.put("estimatedAt", fee.getEstimatedAt() != null ? fee.getEstimatedAt().toString() : null);
        summary.put("expiresAt", fee.getExpiresAt() != null ? fee.getExpiresAt().toString() : null);

        // Payment options
        Map<String, Boolean> paymentOptions = new LinkedHashMap<>();
        paymentOptions.put("payNow", true);
        paymentOptions.put("payOnActivation", true);
        paymentOptions.put("escrow", fee.getFeeSplit() != null);
        summary.put("paymentOptions", paymentOptions);

        return summary;
    }

    private void addStageSummary(Map<String, Object> breakdown, String stageName, ContractFee.StageFee stageFee) {
        if (stageFee == null || !stageFee.isCalculated()) {
            return;
        }

        Map<String, Object> stage = new LinkedHashMap<>();
        stage.put("baseFee", stageFee.getBaseFee());

        if (!stageFee.getVariableFees().isEmpty()) {
            List<Map<String, Object>> variableFees = new ArrayList<>();
            for (ContractFee.VariableFee vf : stageFee.getVariableFees()) {
                Map<String, Object> v = new LinkedHashMap<>();
                v.put("description", vf.getDescription());
                v.put("unitCost", vf.getUnitCost());
                v.put("quantity", vf.getQuantity());
                v.put("total", vf.getTotal());
                variableFees.add(v);
            }
            stage.put("variableFees", variableFees);
        }

        stage.put("subtotal", stageFee.getSubtotal());
        breakdown.put(stageName, stage);
    }

    // ==================== Helper Methods ====================

    private int countTokenBindings(ContractParameters parameters) {
        int count = 0;
        if (parameters.getTokenBindings() != null) {
            if (parameters.getTokenBindings().getPrimaryToken() != null) {
                count++;
            }
            count += parameters.getTokenBindings().getSecondaryTokens().size();
            count += parameters.getTokenBindings().getCompositeTokens().size();
        }
        return count;
    }

    // ==================== Fee Rate Schedule ====================

    /**
     * Get current fee rate schedule
     */
    public Map<String, Object> getFeeRateSchedule() {
        Map<String, Object> schedule = new LinkedHashMap<>();

        schedule.put("documentUpload", Map.of(
            "baseFee", "5.00 AURI",
            "storageFee", "0.01 AURI/KB",
            "textExtraction", "2.00 AURI"
        ));

        schedule.put("proseEditing", Map.of(
            "baseFee", "10.00 AURI",
            "perClause", "0.50 AURI",
            "perSchedule", "1.00 AURI",
            "legalTemplate", "5.00 AURI"
        ));

        schedule.put("parameters", Map.of(
            "baseFee", "8.00 AURI",
            "perParty", "1.00 AURI",
            "tokenBinding", "2.00 AURI",
            "assetValuation", "3.00 AURI"
        ));

        schedule.put("programming", Map.of(
            "baseFee", "15.00 AURI",
            "perTrigger", "2.00 AURI",
            "perCondition", "1.00 AURI",
            "perAction", "1.50 AURI",
            "oracleIntegration", "5.00 AURI",
            "eiNodeConnection", "3.00 AURI"
        ));

        schedule.put("versionControl", Map.of(
            "baseFee", "3.00 AURI",
            "perChange", "0.10 AURI",
            "amendment", "5.00 AURI"
        ));

        schedule.put("signatures", Map.of(
            "perSignatureRequest", "2.00 AURI",
            "quantumSignature", "1.00 AURI",
            "verification", "0.50 AURI"
        ));

        schedule.put("vvbVerification", Map.of(
            "standardReview", "25.00 AURI",
            "expeditedReview", "50.00 AURI",
            "resubmission", "10.00 AURI"
        ));

        schedule.put("activation", Map.of(
            "baseFee", "20.00 AURI",
            "merkleRegistration", "5.00 AURI",
            "marketplaceListing", "10.00 AURI"
        ));

        schedule.put("discounts", Map.of(
            "volume", "10% (> 10 contracts/month)",
            "enterprise", "20% (Enterprise tier)",
            "template", "15% (Using approved template)",
            "earlyPayment", "5% (Pay within 24 hours)",
            "referral", "10% (Referral program)",
            "staking", "15% (Staking 10K+ AURI)"
        ));

        schedule.put("estimates", Map.of(
            "minimumTotal", "88.00 AURI (simple 2-party contract)",
            "typicalTotal", "150-300 AURI (standard RWA contract)",
            "complexContract", "500+ AURI (multi-party, triggers)"
        ));

        return schedule;
    }
}
