package io.aurigraph.v11.contracts.composite;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Verification Service for Composite Token Verification Workflows
 *
 * Manages the complete lifecycle of verification workflows including:
 * - Workflow creation and management
 * - Verifier assignment and coordination
 * - Result collection and consensus determination
 * - Audit trail maintenance
 * - Status tracking and notifications
 *
 * @version 11.6.0
 * @since 2025-12-05 - AV12-CT: Composite Token Verification Service
 */
@ApplicationScoped
public class VerificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationService.class);

    // Minimum verifiers required for consensus
    private static final int MIN_CONSENSUS_VERIFIERS = 2;

    // Default timeout for verification workflows (7 days)
    private static final long DEFAULT_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;

    @Inject
    VerifierRegistry verifierRegistry;

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    // Workflow storage
    private final Map<String, VerificationWorkflow> workflows = new ConcurrentHashMap<>();
    private final Map<String, List<String>> workflowsByComposite = new ConcurrentHashMap<>();
    private final Map<String, List<AuditEntry>> auditTrails = new ConcurrentHashMap<>();
    private final AtomicLong workflowCounter = new AtomicLong(0);

    /**
     * Initiate a new verification workflow for a composite token
     */
    public Uni<VerificationWorkflow> initiateVerification(String compositeId, String assetType,
                                                          VerificationLevel requiredLevel,
                                                          int verifierCount, String payerAddress) {
        return Uni.createFrom().item(() -> {
            String workflowId = generateWorkflowId(compositeId);

            LOGGER.info("Initiating verification workflow {} for composite token {}",
                workflowId, compositeId);

            // Create workflow
            VerificationWorkflow workflow = new VerificationWorkflow(
                workflowId,
                compositeId,
                assetType,
                requiredLevel,
                verifierCount,
                payerAddress
            );

            // Store workflow
            workflows.put(workflowId, workflow);
            workflowsByComposite.computeIfAbsent(compositeId, k -> new ArrayList<>()).add(workflowId);

            // Create audit entry
            addAuditEntry(workflowId, AuditAction.WORKFLOW_CREATED,
                "system", "Verification workflow initiated");

            return workflow;
        }).flatMap(workflow ->
            // Request verifiers from registry
            verifierRegistry.requestVerification(
                workflow.getCompositeId(),
                workflow.getAssetType(),
                workflow.getRequiredLevel(),
                workflow.getVerifierCount()
            ).map(requestId -> {
                workflow.setVerifierRequestId(requestId);
                workflow.setStatus(WorkflowStatus.PENDING_VERIFIERS);

                addAuditEntry(workflow.getWorkflowId(), AuditAction.VERIFIERS_REQUESTED,
                    "system", "Requested " + workflow.getVerifierCount() + " verifiers");

                LOGGER.info("Verification workflow {} created with request {}",
                    workflow.getWorkflowId(), requestId);

                return workflow;
            })
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Submit a verification result from a verifier
     */
    public Uni<SubmissionResult> submitVerificationResult(String workflowId, String verifierId,
                                                          VerificationSubmission submission) {
        return Uni.createFrom().item(() -> {
            VerificationWorkflow workflow = workflows.get(workflowId);
            if (workflow == null) {
                return new SubmissionResult(false, "Workflow not found", null);
            }

            // Validate workflow status
            if (workflow.getStatus() == WorkflowStatus.COMPLETED ||
                workflow.getStatus() == WorkflowStatus.REJECTED ||
                workflow.getStatus() == WorkflowStatus.EXPIRED) {
                return new SubmissionResult(false, "Workflow is no longer accepting submissions", null);
            }

            // Check if verifier already submitted
            if (workflow.hasVerifierSubmitted(verifierId)) {
                return new SubmissionResult(false, "Verifier has already submitted a result", null);
            }

            // Create verification result
            VerificationResult result = new VerificationResult(
                UUID.randomUUID().toString(),
                verifierId,
                workflow.getCompositeId(),
                submission.isVerified(),
                submission.getVerificationLevel(),
                submission.getReportSummary(),
                Instant.now()
            );

            // Add supporting documents to result data
            if (submission.getSupportingDocuments() != null) {
                result.getResultData().put("supportingDocuments", submission.getSupportingDocuments());
            }
            if (submission.getFindings() != null) {
                result.getResultData().put("findings", submission.getFindings());
            }

            // Add result to workflow
            workflow.addVerificationResult(verifierId, result);
            workflow.setStatus(WorkflowStatus.IN_PROGRESS);

            // Add audit entry
            addAuditEntry(workflowId, AuditAction.RESULT_SUBMITTED, verifierId,
                String.format("Verification %s: %s",
                    submission.isVerified() ? "PASSED" : "FAILED",
                    submission.getReportSummary()));

            LOGGER.info("Verifier {} submitted result for workflow {}: {}",
                verifierId, workflowId, submission.isVerified() ? "VERIFIED" : "REJECTED");

            // Check for consensus
            ConsensusResult consensus = checkConsensus(workflow);
            if (consensus.isReached()) {
                finalizeWorkflow(workflow, consensus);
            }

            return new SubmissionResult(true, "Result submitted successfully", consensus);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get workflow status
     */
    public Uni<WorkflowStatusResponse> getWorkflowStatus(String workflowId) {
        return Uni.createFrom().item(() -> {
            VerificationWorkflow workflow = workflows.get(workflowId);
            if (workflow == null) {
                return null;
            }

            return new WorkflowStatusResponse(
                workflow.getWorkflowId(),
                workflow.getCompositeId(),
                workflow.getStatus(),
                workflow.getRequiredLevel(),
                workflow.getVerifierCount(),
                workflow.getSubmittedCount(),
                workflow.getPositiveCount(),
                workflow.getNegativeCount(),
                workflow.getCreatedAt(),
                workflow.getCompletedAt(),
                workflow.getFinalLevel(),
                calculateProgress(workflow)
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verification history for a composite token
     */
    public Uni<List<VerificationWorkflow>> getVerificationHistory(String compositeId) {
        return Uni.createFrom().item(() -> {
            List<String> workflowIds = workflowsByComposite.getOrDefault(compositeId, new ArrayList<>());

            return workflowIds.stream()
                .map(workflows::get)
                .filter(Objects::nonNull)
                .sorted((w1, w2) -> w2.getCreatedAt().compareTo(w1.getCreatedAt()))
                .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get audit trail for a workflow
     */
    public Uni<List<AuditEntry>> getAuditTrail(String workflowId) {
        return Uni.createFrom().item(() ->
            auditTrails.getOrDefault(workflowId, new ArrayList<>())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Cancel a verification workflow
     */
    public Uni<Boolean> cancelWorkflow(String workflowId, String reason, String cancelledBy) {
        return Uni.createFrom().item(() -> {
            VerificationWorkflow workflow = workflows.get(workflowId);
            if (workflow == null) {
                return false;
            }

            if (workflow.getStatus() == WorkflowStatus.COMPLETED ||
                workflow.getStatus() == WorkflowStatus.REJECTED) {
                return false; // Cannot cancel finalized workflows
            }

            workflow.setStatus(WorkflowStatus.CANCELLED);
            workflow.setCompletedAt(Instant.now());

            addAuditEntry(workflowId, AuditAction.WORKFLOW_CANCELLED, cancelledBy, reason);

            LOGGER.info("Workflow {} cancelled by {}: {}", workflowId, cancelledBy, reason);

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all active workflows
     */
    public Uni<List<VerificationWorkflow>> getActiveWorkflows() {
        return Uni.createFrom().item(() ->
            workflows.values().stream()
                .filter(w -> w.getStatus() == WorkflowStatus.PENDING_VERIFIERS ||
                            w.getStatus() == WorkflowStatus.IN_PROGRESS)
                .collect(Collectors.toList())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verification service statistics
     */
    public Uni<VerificationStats> getStats() {
        return Uni.createFrom().item(() -> {
            Map<WorkflowStatus, Long> statusCounts = workflows.values().stream()
                .collect(Collectors.groupingBy(
                    VerificationWorkflow::getStatus,
                    Collectors.counting()
                ));

            Map<VerificationLevel, Long> levelCounts = workflows.values().stream()
                .filter(w -> w.getFinalLevel() != null)
                .collect(Collectors.groupingBy(
                    VerificationWorkflow::getFinalLevel,
                    Collectors.counting()
                ));

            long totalWorkflows = workflows.size();
            long completedWorkflows = statusCounts.getOrDefault(WorkflowStatus.COMPLETED, 0L);
            long activeWorkflows = statusCounts.getOrDefault(WorkflowStatus.IN_PROGRESS, 0L) +
                                  statusCounts.getOrDefault(WorkflowStatus.PENDING_VERIFIERS, 0L);

            double successRate = totalWorkflows > 0 ?
                (double) completedWorkflows / totalWorkflows * 100 : 0;

            return new VerificationStats(
                totalWorkflows,
                activeWorkflows,
                completedWorkflows,
                statusCounts,
                levelCounts,
                successRate,
                calculateAverageCompletionTime()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private String generateWorkflowId(String compositeId) {
        return String.format("WF-%s-%d-%d",
            compositeId.substring(Math.max(0, compositeId.length() - 8)),
            System.currentTimeMillis() % 100000,
            workflowCounter.incrementAndGet());
    }

    private void addAuditEntry(String workflowId, AuditAction action, String actor, String details) {
        AuditEntry entry = new AuditEntry(
            UUID.randomUUID().toString(),
            workflowId,
            action,
            actor,
            details,
            Instant.now()
        );

        auditTrails.computeIfAbsent(workflowId, k -> new ArrayList<>()).add(entry);
    }

    private ConsensusResult checkConsensus(VerificationWorkflow workflow) {
        int positiveCount = workflow.getPositiveCount();
        int negativeCount = workflow.getNegativeCount();
        int totalSubmitted = workflow.getSubmittedCount();
        int required = workflow.getVerifierCount();

        // Check if we have enough submissions
        if (totalSubmitted < MIN_CONSENSUS_VERIFIERS) {
            return new ConsensusResult(false, null, "Insufficient submissions");
        }

        // Check for positive consensus (majority verified)
        if (positiveCount >= MIN_CONSENSUS_VERIFIERS && positiveCount > negativeCount) {
            VerificationLevel consensusLevel = workflow.getHighestPositiveLevel();
            return new ConsensusResult(true, consensusLevel, "Positive consensus reached");
        }

        // Check for negative consensus (majority rejected)
        if (negativeCount >= MIN_CONSENSUS_VERIFIERS && negativeCount > positiveCount) {
            return new ConsensusResult(true, null, "Negative consensus - verification rejected");
        }

        // Check if all verifiers have submitted
        if (totalSubmitted >= required) {
            if (positiveCount > negativeCount) {
                return new ConsensusResult(true, workflow.getHighestPositiveLevel(),
                    "All verifiers submitted - positive consensus");
            } else {
                return new ConsensusResult(true, null,
                    "All verifiers submitted - verification rejected");
            }
        }

        return new ConsensusResult(false, null, "Awaiting more submissions");
    }

    private void finalizeWorkflow(VerificationWorkflow workflow, ConsensusResult consensus) {
        workflow.setCompletedAt(Instant.now());

        if (consensus.getConsensusLevel() != null) {
            workflow.setStatus(WorkflowStatus.COMPLETED);
            workflow.setFinalLevel(consensus.getConsensusLevel());

            // Update composite token status
            compositeTokenFactory.addVerificationResult(
                workflow.getCompositeId(),
                new VerificationResult(
                    UUID.randomUUID().toString(),
                    "CONSENSUS",
                    workflow.getCompositeId(),
                    true,
                    consensus.getConsensusLevel(),
                    consensus.getMessage(),
                    Instant.now()
                )
            ).subscribe().with(
                success -> LOGGER.info("Updated composite token {} with verification result",
                    workflow.getCompositeId()),
                error -> LOGGER.error("Failed to update composite token: {}", error.getMessage())
            );

            addAuditEntry(workflow.getWorkflowId(), AuditAction.CONSENSUS_REACHED, "system",
                String.format("Verification completed with level: %s", consensus.getConsensusLevel()));
        } else {
            workflow.setStatus(WorkflowStatus.REJECTED);

            addAuditEntry(workflow.getWorkflowId(), AuditAction.VERIFICATION_REJECTED, "system",
                consensus.getMessage());
        }

        LOGGER.info("Workflow {} finalized with status: {}",
            workflow.getWorkflowId(), workflow.getStatus());
    }

    private double calculateProgress(VerificationWorkflow workflow) {
        if (workflow.getVerifierCount() == 0) return 0;
        return (double) workflow.getSubmittedCount() / workflow.getVerifierCount() * 100;
    }

    private long calculateAverageCompletionTime() {
        List<VerificationWorkflow> completed = workflows.values().stream()
            .filter(w -> w.getStatus() == WorkflowStatus.COMPLETED && w.getCompletedAt() != null)
            .toList();

        if (completed.isEmpty()) return 0;

        long totalMillis = completed.stream()
            .mapToLong(w -> w.getCompletedAt().toEpochMilli() - w.getCreatedAt().toEpochMilli())
            .sum();

        return totalMillis / completed.size();
    }

    // Inner classes for workflow management

    /**
     * Verification Workflow - Tracks the complete verification process
     */
    public static class VerificationWorkflow {
        private final String workflowId;
        private final String compositeId;
        private final String assetType;
        private final VerificationLevel requiredLevel;
        private final int verifierCount;
        private final String payerAddress;
        private final Instant createdAt;
        private final Instant expiresAt;
        private final Map<String, VerificationResult> results;

        private String verifierRequestId;
        private WorkflowStatus status;
        private Instant completedAt;
        private VerificationLevel finalLevel;

        public VerificationWorkflow(String workflowId, String compositeId, String assetType,
                                   VerificationLevel requiredLevel, int verifierCount,
                                   String payerAddress) {
            this.workflowId = workflowId;
            this.compositeId = compositeId;
            this.assetType = assetType;
            this.requiredLevel = requiredLevel;
            this.verifierCount = verifierCount;
            this.payerAddress = payerAddress;
            this.createdAt = Instant.now();
            this.expiresAt = createdAt.plusSeconds(DEFAULT_TIMEOUT_SECONDS);
            this.results = new ConcurrentHashMap<>();
            this.status = WorkflowStatus.CREATED;
        }

        public void addVerificationResult(String verifierId, VerificationResult result) {
            results.put(verifierId, result);
        }

        public boolean hasVerifierSubmitted(String verifierId) {
            return results.containsKey(verifierId);
        }

        public int getSubmittedCount() {
            return results.size();
        }

        public int getPositiveCount() {
            return (int) results.values().stream().filter(VerificationResult::isVerified).count();
        }

        public int getNegativeCount() {
            return (int) results.values().stream().filter(r -> !r.isVerified()).count();
        }

        public VerificationLevel getHighestPositiveLevel() {
            return results.values().stream()
                .filter(VerificationResult::isVerified)
                .map(VerificationResult::getVerificationLevel)
                .max(Enum::compareTo)
                .orElse(VerificationLevel.NONE);
        }

        public List<VerificationResult> getResults() {
            return new ArrayList<>(results.values());
        }

        // Getters and setters
        public String getWorkflowId() { return workflowId; }
        public String getCompositeId() { return compositeId; }
        public String getAssetType() { return assetType; }
        public VerificationLevel getRequiredLevel() { return requiredLevel; }
        public int getVerifierCount() { return verifierCount; }
        public String getPayerAddress() { return payerAddress; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
        public String getVerifierRequestId() { return verifierRequestId; }
        public void setVerifierRequestId(String verifierRequestId) { this.verifierRequestId = verifierRequestId; }
        public WorkflowStatus getStatus() { return status; }
        public void setStatus(WorkflowStatus status) { this.status = status; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public VerificationLevel getFinalLevel() { return finalLevel; }
        public void setFinalLevel(VerificationLevel finalLevel) { this.finalLevel = finalLevel; }
    }

    /**
     * Workflow Status Enum
     */
    public enum WorkflowStatus {
        CREATED,
        PENDING_VERIFIERS,
        IN_PROGRESS,
        COMPLETED,
        REJECTED,
        CANCELLED,
        EXPIRED
    }

    /**
     * Audit Action Enum
     */
    public enum AuditAction {
        WORKFLOW_CREATED,
        VERIFIERS_REQUESTED,
        VERIFIERS_ASSIGNED,
        RESULT_SUBMITTED,
        CONSENSUS_REACHED,
        VERIFICATION_REJECTED,
        WORKFLOW_CANCELLED,
        WORKFLOW_EXPIRED
    }

    /**
     * Audit Entry Record
     */
    public record AuditEntry(
        String entryId,
        String workflowId,
        AuditAction action,
        String actor,
        String details,
        Instant timestamp
    ) {}

    /**
     * Submission Result
     */
    public record SubmissionResult(
        boolean success,
        String message,
        ConsensusResult consensus
    ) {}

    /**
     * Consensus Result
     */
    public record ConsensusResult(
        boolean reached,
        VerificationLevel consensusLevel,
        String message
    ) {
        public boolean isReached() { return reached; }
        public VerificationLevel getConsensusLevel() { return consensusLevel; }
        public String getMessage() { return message; }
    }

    /**
     * Workflow Status Response
     */
    public record WorkflowStatusResponse(
        String workflowId,
        String compositeId,
        WorkflowStatus status,
        VerificationLevel requiredLevel,
        int requiredVerifiers,
        int submittedCount,
        int positiveCount,
        int negativeCount,
        Instant createdAt,
        Instant completedAt,
        VerificationLevel finalLevel,
        double progressPercent
    ) {}

    /**
     * Verification Statistics
     */
    public record VerificationStats(
        long totalWorkflows,
        long activeWorkflows,
        long completedWorkflows,
        Map<WorkflowStatus, Long> statusDistribution,
        Map<VerificationLevel, Long> levelDistribution,
        double successRate,
        long averageCompletionTimeMs
    ) {}
}
