package io.aurigraph.v11.contracts.composite;

import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import io.quarkus.logging.Log;
import io.quarkus.scheduler.Scheduled;

/**
 * Verification Service - Orchestrates third-party verification workflows
 * Manages verification lifecycle, consensus calculation, and payment distribution
 */
@ApplicationScoped
public class VerificationService {

    @Inject
    VerifierRegistry verifierRegistry;
    
    @Inject
    CompositeTokenFactory compositeTokenFactory;

    // Verification workflow tracking
    private final Map<String, VerificationWorkflow> activeWorkflows = new ConcurrentHashMap<>();
    private final Map<String, VerificationEscrow> escrowAccounts = new ConcurrentHashMap<>();
    private final Map<String, List<VerificationEvent>> auditTrail = new ConcurrentHashMap<>();

    /**
     * Initiate verification workflow for a composite token
     */
    public Uni<VerificationWorkflow> initiateVerification(String compositeId, VerificationRequest request) {
        return Uni.createFrom().item(() -> {
            // Create workflow ID
            String workflowId = generateWorkflowId(compositeId);
            
            // Calculate verification fee based on tier
            BigDecimal verificationFee = calculateVerificationFee(request.getRequiredLevel(), request.getAssetValue());
            
            // Create escrow account for verification payments
            VerificationEscrow escrow = new VerificationEscrow(
                workflowId,
                verificationFee,
                request.getPayerAddress(),
                request.getRequiredLevel()
            );
            escrowAccounts.put(workflowId, escrow);
            
            // Create verification workflow
            VerificationWorkflow workflow = new VerificationWorkflow(
                workflowId,
                compositeId,
                request.getAssetType(),
                request.getRequiredLevel(),
                request.getVerifierCount(),
                verificationFee,
                Instant.now()
            );
            
            activeWorkflows.put(workflowId, workflow);
            
            // Record event
            recordEvent(workflowId, VerificationEventType.WORKFLOW_INITIATED, 
                       "Verification workflow initiated for " + compositeId);
            
            Log.infof("Initiated verification workflow %s for composite token %s", workflowId, compositeId);
            
            return workflow;
        })
        .call(workflow -> {
            // Request verifiers from registry
            return verifierRegistry.requestVerification(
                workflow.getCompositeId(),
                workflow.getAssetType(),
                workflow.getRequiredLevel(),
                workflow.getRequiredVerifierCount()
            ).onItem().invoke(requestId -> {
                workflow.setVerificationRequestId(requestId);
                workflow.setStatus(VerificationWorkflowStatus.VERIFIERS_ASSIGNED);
                
                recordEvent(workflow.getWorkflowId(), VerificationEventType.VERIFIERS_ASSIGNED,
                           "Verifiers assigned to request: " + requestId);
            });
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Submit verification result from a verifier
     */
    public Uni<Boolean> submitVerificationResult(String workflowId, String verifierId, 
                                               VerificationSubmission submission) {
        return Uni.createFrom().item(() -> {
            VerificationWorkflow workflow = activeWorkflows.get(workflowId);
            if (workflow == null) {
                throw new IllegalArgumentException("Workflow not found: " + workflowId);
            }
            
            // Validate submission
            if (!validateSubmission(submission)) {
                throw new InvalidSubmissionException("Invalid verification submission");
            }
            
            // Create verification result
            VerificationResult result = new VerificationResult(
                verifierId,
                submission.getVerifierName(),
                submission.getVerifierType(),
                workflow.getRequiredLevel(),
                submission.isAssetVerified(),
                submission.getEstimatedValue(),
                submission.getConditionRating(),
                submission.getReportSummary()
            );
            
            // Add supporting documents
            for (VerificationDocument doc : submission.getSupportingDocuments()) {
                result.getDetailedFindings().put(doc.getDocumentType(), doc.getIpfsHash());
            }
            
            workflow.addVerificationResult(result);
            
            // Record event
            recordEvent(workflowId, VerificationEventType.RESULT_SUBMITTED,
                       String.format("Verification result submitted by %s: %s", 
                           verifierId, submission.isAssetVerified() ? "VERIFIED" : "REJECTED"));
            
            // Check for consensus
            if (workflow.hasReachedConsensus()) {
                processConsensus(workflow);
            }
            
            return true;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Process consensus once reached
     */
    private Uni<Void> processConsensus(VerificationWorkflow workflow) {
        return Uni.createFrom().item(() -> {
            VerificationConsensusResult consensus = workflow.calculateConsensus();
            
            if (consensus.isConsensusReached()) {
                workflow.setStatus(VerificationWorkflowStatus.CONSENSUS_REACHED);
                
                // Update composite token with verification results
                String compositeId = workflow.getCompositeId();
                
                // Add all verification results to the composite token
                for (VerificationResult result : workflow.getVerificationResults()) {
                    compositeTokenFactory.addVerificationResult(compositeId, result)
                        .await().indefinitely();
                }
                
                // Distribute payments to verifiers
                distributePayments(workflow, consensus);
                
                recordEvent(workflow.getWorkflowId(), VerificationEventType.CONSENSUS_REACHED,
                           String.format("Consensus reached: %s with %d%% confidence", 
                               consensus.getConsensusOutcome(), 
                               consensus.getConfidenceLevel().intValue()));
                               
                Log.infof("Consensus reached for workflow %s: %s", 
                    workflow.getWorkflowId(), consensus.getConsensusOutcome());
            } else {
                workflow.setStatus(VerificationWorkflowStatus.NO_CONSENSUS);
                
                // Trigger dispute resolution
                initiateDisputeResolution(workflow);
                
                recordEvent(workflow.getWorkflowId(), VerificationEventType.NO_CONSENSUS,
                           "No consensus reached - initiating dispute resolution");
            }
            
            return null;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Distribute payments to verifiers based on tier and performance
     */
    private void distributePayments(VerificationWorkflow workflow, VerificationConsensusResult consensus) {
        VerificationEscrow escrow = escrowAccounts.get(workflow.getWorkflowId());
        if (escrow == null) {
            Log.warnf("No escrow account found for workflow %s", workflow.getWorkflowId());
            return;
        }
        
        BigDecimal totalFee = escrow.getTotalAmount();
        Map<String, BigDecimal> paymentDistribution = new HashMap<>();
        
        // Calculate payment for each verifier based on tier
        for (VerificationResult result : workflow.getVerificationResults()) {
            BigDecimal tierPercentage = getTierCompensationPercentage(workflow.getRequiredLevel());
            BigDecimal verifierPayment = totalFee.multiply(tierPercentage).divide(
                BigDecimal.valueOf(workflow.getVerificationResults().size()), 
                2, java.math.RoundingMode.HALF_UP
            );
            
            // Bonus for consensus alignment
            if (result.isVerified() == consensus.isPositiveConsensus()) {
                verifierPayment = verifierPayment.multiply(BigDecimal.valueOf(1.1)); // 10% bonus
            }
            
            paymentDistribution.put(result.getVerifierId(), verifierPayment);
        }
        
        // Process payments
        escrow.distributePayments(paymentDistribution);
        escrow.setStatus(EscrowStatus.DISTRIBUTED);
        
        recordEvent(workflow.getWorkflowId(), VerificationEventType.PAYMENTS_DISTRIBUTED,
                   String.format("Payments distributed to %d verifiers", paymentDistribution.size()));
    }

    /**
     * Initiate dispute resolution for failed consensus
     */
    private void initiateDisputeResolution(VerificationWorkflow workflow) {
        // Escalate to higher tier verifiers
        VerificationLevel nextLevel = getNextVerificationLevel(workflow.getRequiredLevel());
        
        if (nextLevel != null) {
            workflow.setStatus(VerificationWorkflowStatus.DISPUTE_RESOLUTION);
            
            // Request additional verification from higher tier
            VerificationRequest escalationRequest = new VerificationRequest(
                workflow.getAssetType(),
                nextLevel,
                workflow.getAssetValue(),
                workflow.getPayerAddress(),
                1 // Single arbiter for dispute
            );
            
            initiateVerification(workflow.getCompositeId(), escalationRequest)
                .subscribe().with(
                    escalatedWorkflow -> {
                        workflow.setEscalatedWorkflowId(escalatedWorkflow.getWorkflowId());
                        recordEvent(workflow.getWorkflowId(), VerificationEventType.DISPUTE_ESCALATED,
                                   "Dispute escalated to " + nextLevel + " tier");
                    },
                    error -> Log.errorf("Failed to escalate dispute: %s", error.getMessage())
                );
        } else {
            // Maximum escalation reached - require DAO governance
            workflow.setStatus(VerificationWorkflowStatus.DAO_GOVERNANCE_REQUIRED);
            recordEvent(workflow.getWorkflowId(), VerificationEventType.DAO_ESCALATION,
                       "Escalated to DAO governance for resolution");
        }
    }

    /**
     * Get verification workflow status
     */
    public Uni<VerificationWorkflow> getWorkflowStatus(String workflowId) {
        return Uni.createFrom().item(() -> activeWorkflows.get(workflowId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verification history for a composite token
     */
    public Uni<List<VerificationWorkflow>> getVerificationHistory(String compositeId) {
        return Uni.createFrom().item(() -> {
            return activeWorkflows.values().stream()
                .filter(workflow -> compositeId.equals(workflow.getCompositeId()))
                .sorted(Comparator.comparing(VerificationWorkflow::getInitiatedAt).reversed())
                .toList();
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get audit trail for a workflow
     */
    public Uni<List<VerificationEvent>> getAuditTrail(String workflowId) {
        return Uni.createFrom().item(() -> 
            auditTrail.getOrDefault(workflowId, new ArrayList<>())
        )
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Cancel verification workflow
     */
    public Uni<Boolean> cancelWorkflow(String workflowId, String reason) {
        return Uni.createFrom().item(() -> {
            VerificationWorkflow workflow = activeWorkflows.get(workflowId);
            if (workflow == null) {
                return false;
            }
            
            if (workflow.getStatus() == VerificationWorkflowStatus.COMPLETED ||
                workflow.getStatus() == VerificationWorkflowStatus.CONSENSUS_REACHED) {
                throw new IllegalStateException("Cannot cancel completed workflow");
            }
            
            workflow.setStatus(VerificationWorkflowStatus.CANCELLED);
            
            // Refund escrow
            VerificationEscrow escrow = escrowAccounts.get(workflowId);
            if (escrow != null && escrow.getStatus() != EscrowStatus.DISTRIBUTED) {
                escrow.refund();
                escrow.setStatus(EscrowStatus.REFUNDED);
            }
            
            recordEvent(workflowId, VerificationEventType.WORKFLOW_CANCELLED,
                       "Workflow cancelled: " + reason);
            
            return true;
        })
        .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Scheduled task to check for expired workflows
     */
    @Scheduled(every = "1h")
    void checkExpiredWorkflows() {
        Instant expirationCutoff = Instant.now().minusSeconds(7 * 24 * 60 * 60); // 7 days
        
        activeWorkflows.values().stream()
            .filter(workflow -> workflow.getInitiatedAt().isBefore(expirationCutoff))
            .filter(workflow -> workflow.getStatus() == VerificationWorkflowStatus.PENDING ||
                              workflow.getStatus() == VerificationWorkflowStatus.VERIFIERS_ASSIGNED)
            .forEach(workflow -> {
                workflow.setStatus(VerificationWorkflowStatus.EXPIRED);
                
                // Refund escrow
                VerificationEscrow escrow = escrowAccounts.get(workflow.getWorkflowId());
                if (escrow != null) {
                    escrow.refund();
                    escrow.setStatus(EscrowStatus.REFUNDED);
                }
                
                recordEvent(workflow.getWorkflowId(), VerificationEventType.WORKFLOW_EXPIRED,
                           "Workflow expired after 7 days");
                
                Log.infof("Expired workflow %s", workflow.getWorkflowId());
            });
    }

    // Helper methods

    private String generateWorkflowId(String compositeId) {
        return String.format("VWFL-%s-%d",
            compositeId.substring(compositeId.lastIndexOf('-') + 1),
            System.nanoTime() % 1000000);
    }

    private BigDecimal calculateVerificationFee(VerificationLevel level, BigDecimal assetValue) {
        BigDecimal percentage = getTierCompensationPercentage(level);
        return assetValue.multiply(percentage).multiply(BigDecimal.valueOf(5)); // For 5 verifiers
    }

    private BigDecimal getTierCompensationPercentage(VerificationLevel level) {
        return switch (level) {
            case NONE -> BigDecimal.ZERO;
            case BASIC -> BigDecimal.valueOf(0.0005); // 0.05%
            case ENHANCED -> BigDecimal.valueOf(0.001); // 0.1%
            case CERTIFIED -> BigDecimal.valueOf(0.0015); // 0.15%
            case INSTITUTIONAL -> BigDecimal.valueOf(0.002); // 0.2%
        };
    }

    private VerificationLevel getNextVerificationLevel(VerificationLevel current) {
        return switch (current) {
            case NONE, BASIC -> VerificationLevel.ENHANCED;
            case ENHANCED -> VerificationLevel.CERTIFIED;
            case CERTIFIED -> VerificationLevel.INSTITUTIONAL;
            case INSTITUTIONAL -> null; // Maximum level
        };
    }

    private boolean validateSubmission(VerificationSubmission submission) {
        return submission != null &&
               submission.getVerifierName() != null &&
               submission.getReportSummary() != null &&
               submission.getConditionRating() >= 1 &&
               submission.getConditionRating() <= 10;
    }

    private void recordEvent(String workflowId, VerificationEventType eventType, String description) {
        VerificationEvent event = new VerificationEvent(
            eventType,
            description,
            Instant.now()
        );
        
        auditTrail.computeIfAbsent(workflowId, k -> new ArrayList<>()).add(event);
    }

    // Exception classes
    public static class InvalidSubmissionException extends RuntimeException {
        public InvalidSubmissionException(String message) { super(message); }
    }
}

/**
 * Verification workflow tracking
 */
class VerificationWorkflow {
    private final String workflowId;
    private final String compositeId;
    private final String assetType;
    private final VerificationLevel requiredLevel;
    private final int requiredVerifierCount;
    private final BigDecimal verificationFee;
    private final Instant initiatedAt;
    private VerificationWorkflowStatus status;
    private String verificationRequestId;
    private List<VerificationResult> verificationResults;
    private String escalatedWorkflowId;
    private Instant completedAt;

    public VerificationWorkflow(String workflowId, String compositeId, String assetType,
                              VerificationLevel requiredLevel, int requiredVerifierCount,
                              BigDecimal verificationFee, Instant initiatedAt) {
        this.workflowId = workflowId;
        this.compositeId = compositeId;
        this.assetType = assetType;
        this.requiredLevel = requiredLevel;
        this.requiredVerifierCount = requiredVerifierCount;
        this.verificationFee = verificationFee;
        this.initiatedAt = initiatedAt;
        this.status = VerificationWorkflowStatus.PENDING;
        this.verificationResults = new ArrayList<>();
    }

    public void addVerificationResult(VerificationResult result) {
        verificationResults.add(result);
    }

    public boolean hasReachedConsensus() {
        return verificationResults.size() >= (requiredVerifierCount / 2 + 1); // Simple majority
    }

    public VerificationConsensusResult calculateConsensus() {
        if (verificationResults.isEmpty()) {
            return new VerificationConsensusResult(false, false, BigDecimal.ZERO, "NO_RESULTS");
        }

        long verifiedCount = verificationResults.stream()
            .filter(VerificationResult::isVerified)
            .count();

        boolean consensusReached = verifiedCount >= (requiredVerifierCount * 0.6); // 60% threshold
        boolean positiveConsensus = verifiedCount > (verificationResults.size() / 2);
        
        BigDecimal confidence = BigDecimal.valueOf(
            (double) Math.max(verifiedCount, verificationResults.size() - verifiedCount) / 
            verificationResults.size() * 100
        );

        String outcome = consensusReached ? 
            (positiveConsensus ? "VERIFIED" : "REJECTED") : "NO_CONSENSUS";

        return new VerificationConsensusResult(consensusReached, positiveConsensus, confidence, outcome);
    }

    // Getters and setters
    public String getWorkflowId() { return workflowId; }
    public String getCompositeId() { return compositeId; }
    public String getAssetType() { return assetType; }
    public VerificationLevel getRequiredLevel() { return requiredLevel; }
    public int getRequiredVerifierCount() { return requiredVerifierCount; }
    public BigDecimal getVerificationFee() { return verificationFee; }
    public Instant getInitiatedAt() { return initiatedAt; }
    
    public VerificationWorkflowStatus getStatus() { return status; }
    public void setStatus(VerificationWorkflowStatus status) { this.status = status; }
    
    public String getVerificationRequestId() { return verificationRequestId; }
    public void setVerificationRequestId(String verificationRequestId) { this.verificationRequestId = verificationRequestId; }
    
    public List<VerificationResult> getVerificationResults() { return List.copyOf(verificationResults); }
    
    public String getEscalatedWorkflowId() { return escalatedWorkflowId; }
    public void setEscalatedWorkflowId(String escalatedWorkflowId) { this.escalatedWorkflowId = escalatedWorkflowId; }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}

/**
 * Verification request parameters
 */
class VerificationRequest {
    private final String assetType;
    private final VerificationLevel requiredLevel;
    private final BigDecimal assetValue;
    private final String payerAddress;
    private final int verifierCount;

    public VerificationRequest(String assetType, VerificationLevel requiredLevel,
                             BigDecimal assetValue, String payerAddress, int verifierCount) {
        this.assetType = assetType;
        this.requiredLevel = requiredLevel;
        this.assetValue = assetValue;
        this.payerAddress = payerAddress;
        this.verifierCount = verifierCount;
    }

    // Getters
    public String getAssetType() { return assetType; }
    public VerificationLevel getRequiredLevel() { return requiredLevel; }
    public BigDecimal getAssetValue() { return assetValue; }
    public String getPayerAddress() { return payerAddress; }
    public int getVerifierCount() { return verifierCount; }
}

/**
 * Verification submission from verifier
 */
class VerificationSubmission {
    private String verifierName;
    private String verifierType;
    private boolean assetVerified;
    private BigDecimal estimatedValue;
    private int conditionRating;
    private String reportSummary;
    private List<VerificationDocument> supportingDocuments;

    // Getters and setters
    public String getVerifierName() { return verifierName; }
    public void setVerifierName(String verifierName) { this.verifierName = verifierName; }
    
    public String getVerifierType() { return verifierType; }
    public void setVerifierType(String verifierType) { this.verifierType = verifierType; }
    
    public boolean isAssetVerified() { return assetVerified; }
    public void setAssetVerified(boolean assetVerified) { this.assetVerified = assetVerified; }
    
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(BigDecimal estimatedValue) { this.estimatedValue = estimatedValue; }
    
    public int getConditionRating() { return conditionRating; }
    public void setConditionRating(int conditionRating) { this.conditionRating = conditionRating; }
    
    public String getReportSummary() { return reportSummary; }
    public void setReportSummary(String reportSummary) { this.reportSummary = reportSummary; }
    
    public List<VerificationDocument> getSupportingDocuments() { 
        return supportingDocuments != null ? List.copyOf(supportingDocuments) : new ArrayList<>(); 
    }
    public void setSupportingDocuments(List<VerificationDocument> supportingDocuments) { 
        this.supportingDocuments = new ArrayList<>(supportingDocuments); 
    }
}

/**
 * Verification supporting document
 */
class VerificationDocument {
    private final String documentType;
    private final String ipfsHash;
    private final String description;

    public VerificationDocument(String documentType, String ipfsHash, String description) {
        this.documentType = documentType;
        this.ipfsHash = ipfsHash;
        this.description = description;
    }

    // Getters
    public String getDocumentType() { return documentType; }
    public String getIpfsHash() { return ipfsHash; }
    public String getDescription() { return description; }
}

/**
 * Verification consensus result
 */
class VerificationConsensusResult {
    private final boolean consensusReached;
    private final boolean positiveConsensus;
    private final BigDecimal confidenceLevel;
    private final String consensusOutcome;

    public VerificationConsensusResult(boolean consensusReached, boolean positiveConsensus,
                                     BigDecimal confidenceLevel, String consensusOutcome) {
        this.consensusReached = consensusReached;
        this.positiveConsensus = positiveConsensus;
        this.confidenceLevel = confidenceLevel;
        this.consensusOutcome = consensusOutcome;
    }

    // Getters
    public boolean isConsensusReached() { return consensusReached; }
    public boolean isPositiveConsensus() { return positiveConsensus; }
    public BigDecimal getConfidenceLevel() { return confidenceLevel; }
    public String getConsensusOutcome() { return consensusOutcome; }
}

/**
 * Verification escrow account
 */
class VerificationEscrow {
    private final String workflowId;
    private final BigDecimal totalAmount;
    private final String payerAddress;
    private final VerificationLevel tier;
    private EscrowStatus status;
    private Map<String, BigDecimal> distributions;

    public VerificationEscrow(String workflowId, BigDecimal totalAmount, 
                            String payerAddress, VerificationLevel tier) {
        this.workflowId = workflowId;
        this.totalAmount = totalAmount;
        this.payerAddress = payerAddress;
        this.tier = tier;
        this.status = EscrowStatus.LOCKED;
        this.distributions = new HashMap<>();
    }

    public void distributePayments(Map<String, BigDecimal> paymentDistribution) {
        this.distributions = new HashMap<>(paymentDistribution);
        this.status = EscrowStatus.DISTRIBUTED;
    }

    public void refund() {
        this.status = EscrowStatus.REFUNDED;
    }

    // Getters and setters
    public String getWorkflowId() { return workflowId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getPayerAddress() { return payerAddress; }
    public VerificationLevel getTier() { return tier; }
    public EscrowStatus getStatus() { return status; }
    public void setStatus(EscrowStatus status) { this.status = status; }
    public Map<String, BigDecimal> getDistributions() { return Map.copyOf(distributions); }
}

/**
 * Verification audit event
 */
class VerificationEvent {
    private final VerificationEventType eventType;
    private final String description;
    private final Instant timestamp;

    public VerificationEvent(VerificationEventType eventType, String description, Instant timestamp) {
        this.eventType = eventType;
        this.description = description;
        this.timestamp = timestamp;
    }

    // Getters
    public VerificationEventType getEventType() { return eventType; }
    public String getDescription() { return description; }
    public Instant getTimestamp() { return timestamp; }
}

// Enumerations

enum VerificationWorkflowStatus {
    PENDING,                    // Workflow created, awaiting verifier assignment
    VERIFIERS_ASSIGNED,         // Verifiers assigned, awaiting results
    IN_PROGRESS,               // Verification in progress
    CONSENSUS_REACHED,         // Consensus achieved
    NO_CONSENSUS,              // No consensus reached
    DISPUTE_RESOLUTION,        // In dispute resolution
    DAO_GOVERNANCE_REQUIRED,   // Requires DAO governance
    COMPLETED,                 // Workflow completed
    CANCELLED,                 // Workflow cancelled
    EXPIRED                    // Workflow expired
}

enum VerificationEventType {
    WORKFLOW_INITIATED,        // Workflow started
    VERIFIERS_ASSIGNED,        // Verifiers assigned
    RESULT_SUBMITTED,          // Result received
    CONSENSUS_REACHED,         // Consensus achieved
    NO_CONSENSUS,              // No consensus
    DISPUTE_ESCALATED,         // Dispute escalated
    DAO_ESCALATION,           // DAO governance required
    PAYMENTS_DISTRIBUTED,      // Payments made
    WORKFLOW_CANCELLED,        // Workflow cancelled
    WORKFLOW_EXPIRED          // Workflow expired
}

enum EscrowStatus {
    LOCKED,                    // Funds locked in escrow
    DISTRIBUTED,               // Funds distributed to verifiers
    REFUNDED,                  // Funds refunded to payer
    DISPUTED                   // Under dispute
}