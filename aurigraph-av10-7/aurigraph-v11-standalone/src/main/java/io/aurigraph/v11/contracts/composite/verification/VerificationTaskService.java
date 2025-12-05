package io.aurigraph.v11.contracts.composite.verification;

import io.aurigraph.v11.contracts.composite.VerificationLevel;
import io.aurigraph.v11.contracts.composite.VerifierRegistry;
import io.aurigraph.v11.contracts.composite.VerifierTier;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Verification Task Service - Main orchestration service for third-party verification tasks
 *
 * This service manages the complete lifecycle of verification tasks assigned to third-party
 * verifiers, including:
 *
 * <h3>Core Capabilities:</h3>
 * <ul>
 *   <li><b>Task Lifecycle Management:</b> Create, assign, accept, reject, start, complete, cancel</li>
 *   <li><b>Verifier Matching:</b> Auto-assignment based on specialization, tier, availability, reputation, location</li>
 *   <li><b>Progress Tracking:</b> Milestone completion, phase progression, real-time updates</li>
 *   <li><b>RFI Management:</b> Request for Information creation, linking, and tracking</li>
 *   <li><b>Task Statistics:</b> Workload analysis, overdue tracking, performance metrics</li>
 * </ul>
 *
 * <h3>Integration Points:</h3>
 * <ul>
 *   <li>VerifierRegistry - For verifier selection and assignment</li>
 *   <li>VerificationPaymentService - For payment processing and escrow</li>
 *   <li>RFIRequest - For information requests during verification</li>
 * </ul>
 *
 * <h3>Usage Example:</h3>
 * <pre>
 * // Create a new verification task
 * TaskScope scope = new TaskScope()
 *     .description("Physical inspection of commercial property")
 *     .requiredLevel(VerificationLevel.INSTITUTIONAL)
 *     .assetType("REAL_ESTATE")
 *     .jurisdiction("US-CA");
 *
 * VerificationTask task = taskService.createTask(workflowId, compositeId, scope)
 *     .await().indefinitely();
 *
 * // Find and assign matching verifier
 * List&lt;VerifierMatch&gt; matches = taskService.findMatchingVerifiers(scope)
 *     .await().indefinitely();
 *
 * taskService.assignTask(task.getTaskId(), matches.get(0).verifierId)
 *     .await().indefinitely();
 * </pre>
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification Task Orchestration)
 * @see VerificationTask
 * @see VerifierRegistry
 * @see VerificationPaymentService
 */
@ApplicationScoped
public class VerificationTaskService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationTaskService.class);

    // Default SLA settings
    private static final Duration DEFAULT_TASK_TIMEOUT = Duration.ofDays(14);
    private static final Duration OVERDUE_WARNING_THRESHOLD = Duration.ofDays(2);
    private static final int MAX_ASSIGNMENT_ATTEMPTS = 3;

    @Inject
    VerifierRegistry verifierRegistry;

    @Inject
    VerificationPaymentService paymentService;

    // Storage
    private final Map<String, VerificationTask> tasks = new ConcurrentHashMap<>();
    private final Map<String, List<String>> tasksByWorkflow = new ConcurrentHashMap<>();
    private final Map<String, List<String>> tasksByVerifier = new ConcurrentHashMap<>();
    private final Map<String, List<String>> tasksByComposite = new ConcurrentHashMap<>();
    private final Map<String, String> rfiToTaskMapping = new ConcurrentHashMap<>();
    private final AtomicLong taskCounter = new AtomicLong(0);

    // ==================== TASK LIFECYCLE MANAGEMENT ====================

    /**
     * Create a new verification task
     *
     * @param workflowId Verification workflow ID
     * @param compositeId Composite token ID
     * @param scope Task scope defining requirements
     * @return Uni containing the created task
     */
    public Uni<VerificationTask> createTask(String workflowId, String compositeId,
                                            VerificationTask.TaskScope scope) {
        return Uni.createFrom().item(() -> {
            String assetId = extractAssetId(compositeId);

            VerificationTask task = new VerificationTask(workflowId, compositeId, assetId);
            task.setScope(scope);
            task.setCreatedBy("system");

            // Set up timeline
            VerificationTask.TaskTimeline timeline = new VerificationTask.TaskTimeline()
                .createdAt(Instant.now())
                .dueDate(Instant.now().plus(DEFAULT_TASK_TIMEOUT))
                .targetCompletionDate(Instant.now().plus(DEFAULT_TASK_TIMEOUT))
                .estimatedDuration(DEFAULT_TASK_TIMEOUT);
            task.setTimeline(timeline);

            // Set priority based on verification level
            task.setPriority(determinePriority(scope.getRequiredLevel()));

            // Store task
            tasks.put(task.getTaskId(), task);
            tasksByWorkflow.computeIfAbsent(workflowId, k -> new ArrayList<>()).add(task.getTaskId());
            tasksByComposite.computeIfAbsent(compositeId, k -> new ArrayList<>()).add(task.getTaskId());

            LOGGER.info("Created verification task: {} for workflow: {}, composite: {}",
                task.getTaskId(), workflowId, compositeId);

            return task;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Assign a task to a specific verifier
     *
     * @param taskId Task ID
     * @param verifierId Verifier ID
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> assignTask(String taskId, String verifierId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for assignment: {}", taskId);
                return false;
            }

            if (task.getStatus() != VerificationTask.TaskStatus.CREATED &&
                task.getStatus() != VerificationTask.TaskStatus.PENDING_ASSIGNMENT) {
                LOGGER.warn("Task {} is in {} state, cannot assign", taskId, task.getStatus());
                return false;
            }

            // Get verifier details from registry
            return verifierRegistry.get(verifierId)
                .map(verifier -> {
                    if (verifier == null) {
                        LOGGER.warn("Verifier not found: {}", verifierId);
                        return false;
                    }

                    // Assign task
                    task.assignToVerifier(
                        verifierId,
                        verifier.getName(),
                        verifier.getTier()
                    );

                    // Track assignment
                    tasksByVerifier.computeIfAbsent(verifierId, k -> new ArrayList<>()).add(taskId);

                    LOGGER.info("Assigned task {} to verifier {} ({})",
                        taskId, verifier.getName(), verifier.getTier());

                    return true;
                })
                .await().indefinitely();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verifier accepts the assigned task
     *
     * @param taskId Task ID
     * @param verifierId Verifier ID (for validation)
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> acceptTask(String taskId, String verifierId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for acceptance: {}", taskId);
                return false;
            }

            if (!task.getVerifierId().equals(verifierId)) {
                LOGGER.warn("Verifier {} cannot accept task {} assigned to {}",
                    verifierId, taskId, task.getVerifierId());
                return false;
            }

            if (task.getStatus() != VerificationTask.TaskStatus.ASSIGNED) {
                LOGGER.warn("Task {} is in {} state, cannot accept", taskId, task.getStatus());
                return false;
            }

            task.accept();
            LOGGER.info("Task {} accepted by verifier {}", taskId, verifierId);

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verifier rejects the assigned task
     *
     * @param taskId Task ID
     * @param verifierId Verifier ID (for validation)
     * @param reason Rejection reason
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> rejectTask(String taskId, String verifierId, String reason) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for rejection: {}", taskId);
                return false;
            }

            if (!task.getVerifierId().equals(verifierId)) {
                LOGGER.warn("Verifier {} cannot reject task {} assigned to {}",
                    verifierId, taskId, task.getVerifierId());
                return false;
            }

            task.reject(reason);

            // Remove from verifier's task list
            List<String> verifierTasks = tasksByVerifier.get(verifierId);
            if (verifierTasks != null) {
                verifierTasks.remove(taskId);
            }

            LOGGER.info("Task {} rejected by verifier {}: {}", taskId, verifierId, reason);

            // Optionally auto-reassign to another verifier
            // This would be implemented based on business rules

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Start work on an accepted task
     *
     * @param taskId Task ID
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> startTask(String taskId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for start: {}", taskId);
                return false;
            }

            if (task.getStatus() != VerificationTask.TaskStatus.ACCEPTED) {
                LOGGER.warn("Task {} is in {} state, cannot start", taskId, task.getStatus());
                return false;
            }

            task.start();
            LOGGER.info("Task {} started by verifier {}", taskId, task.getVerifierId());

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete a task
     *
     * @param taskId Task ID
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> completeTask(String taskId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for completion: {}", taskId);
                return false;
            }

            if (task.getStatus() != VerificationTask.TaskStatus.IN_PROGRESS &&
                task.getStatus() != VerificationTask.TaskStatus.PENDING_APPROVAL) {
                LOGGER.warn("Task {} is in {} state, cannot complete", taskId, task.getStatus());
                return false;
            }

            // Verify all mandatory deliverables are submitted
            boolean allDeliverablesSubmitted = task.getDeliverables().stream()
                .filter(VerificationTask.TaskDeliverable::isMandatory)
                .allMatch(d -> d.getStatus() == VerificationTask.TaskDeliverable.DeliverableStatus.APPROVED ||
                              d.getStatus() == VerificationTask.TaskDeliverable.DeliverableStatus.SUBMITTED);

            if (!allDeliverablesSubmitted) {
                LOGGER.warn("Task {} cannot be completed - missing mandatory deliverables", taskId);
                return false;
            }

            task.complete();
            LOGGER.info("Task {} completed by verifier {}", taskId, task.getVerifierId());

            // Trigger payment release (if payment service is configured)
            if (task.getPricing() != null) {
                triggerPaymentRelease(task);
            }

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Cancel a task
     *
     * @param taskId Task ID
     * @param reason Cancellation reason
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> cancelTask(String taskId, String reason) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for cancellation: {}", taskId);
                return false;
            }

            if (task.getStatus() == VerificationTask.TaskStatus.COMPLETED) {
                LOGGER.warn("Cannot cancel completed task: {}", taskId);
                return false;
            }

            task.cancel(reason, "system");
            LOGGER.info("Task {} cancelled: {}", taskId, reason);

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== VERIFIER MATCHING ====================

    /**
     * Find matching verifiers for a task scope
     *
     * Auto-assignment logic based on:
     * - Specialization match
     * - Tier compatibility
     * - Availability
     * - Reputation score
     * - Geographic location
     *
     * @param scope Task scope
     * @return Uni<List<VerifierMatch>> list of matching verifiers, sorted by best fit
     */
    public Uni<List<VerifierMatch>> findMatchingVerifiers(VerificationTask.TaskScope scope) {
        return verifierRegistry.getAll().map(verifiers -> {
            List<VerifierMatch> matches = new ArrayList<>();
            String assetType = scope.getAssetType();
            VerificationLevel requiredLevel = scope.getRequiredLevel();
            String jurisdiction = scope.getJurisdiction();

            for (var verifier : verifiers) {
                // Check if verifier is active
                if (verifier.getStatus() != io.aurigraph.v11.contracts.composite.VerifierStatus.ACTIVE) {
                    continue;
                }

                // Calculate match score
                VerifierMatch match = new VerifierMatch();
                match.verifierId = verifier.getVerifierId();
                match.verifierName = verifier.getName();
                match.tier = verifier.getTier();
                match.reputation = verifier.getSuccessRate();
                match.matchScore = BigDecimal.ZERO;

                // Specialization match (40% weight)
                if (assetType != null && verifier.getSpecialization().contains(assetType)) {
                    match.matchScore = match.matchScore.add(BigDecimal.valueOf(40));
                    match.specializationMatch = true;
                }

                // Tier compatibility (30% weight)
                int tierMatch = calculateTierCompatibility(requiredLevel, verifier.getTier());
                match.matchScore = match.matchScore.add(BigDecimal.valueOf(tierMatch * 30));
                match.tierCompatible = tierMatch > 0;

                // Reputation (20% weight)
                BigDecimal reputationScore = verifier.getSuccessRate()
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(20));
                match.matchScore = match.matchScore.add(reputationScore);

                // Availability (10% weight)
                int currentWorkload = getVerifierActiveTaskCount(verifier.getVerifierId());
                int maxCapacity = 10; // Should be configurable
                if (currentWorkload < maxCapacity) {
                    BigDecimal availabilityScore = BigDecimal.valueOf(
                        (maxCapacity - currentWorkload) * 10.0 / maxCapacity
                    );
                    match.matchScore = match.matchScore.add(availabilityScore);
                    match.available = true;
                }

                // Jurisdiction match (bonus) - check if verifier specialization matches jurisdiction
                // Note: ThirdPartyVerifier doesn't have regions, so we skip this for now
                // In future, add operatingRegions field to ThirdPartyVerifier
                if (jurisdiction != null && verifier.getSpecialization() != null &&
                    verifier.getSpecialization().toLowerCase().contains(jurisdiction.toLowerCase())) {
                    match.matchScore = match.matchScore.add(BigDecimal.valueOf(10));
                    match.locationMatch = true;
                }

                // Set estimated turnaround
                match.estimatedTurnaround = estimateTurnaround(verifier, scope);

                // Only include verifiers with minimum match score
                if (match.matchScore.compareTo(BigDecimal.valueOf(30)) >= 0) {
                    matches.add(match);
                }
            }

            // Sort by match score (descending)
            matches.sort((m1, m2) -> m2.matchScore.compareTo(m1.matchScore));

            LOGGER.info("Found {} matching verifiers for asset type: {}, level: {}",
                matches.size(), assetType, requiredLevel);

            return matches;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== PROGRESS TRACKING ====================

    /**
     * Update task progress
     *
     * @param taskId Task ID
     * @param progress Progress percentage (0-100)
     * @param phase Current phase name
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> updateProgress(String taskId, BigDecimal progress, String phase) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for progress update: {}", taskId);
                return false;
            }

            if (progress.compareTo(BigDecimal.ZERO) < 0 || progress.compareTo(BigDecimal.valueOf(100)) > 0) {
                LOGGER.warn("Invalid progress value: {}", progress);
                return false;
            }

            task.updateProgress(progress, phase);
            LOGGER.debug("Task {} progress updated: {}% - {}", taskId, progress, phase);

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete a milestone
     *
     * @param taskId Task ID
     * @param milestoneId Milestone ID
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> completeMilestone(String taskId, String milestoneId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for milestone completion: {}", taskId);
                return false;
            }

            task.completeMilestone(milestoneId, task.getVerifierId());
            LOGGER.info("Milestone {} completed for task {}", milestoneId, taskId);

            // Check if milestone-based payment should be released
            if (task.getPricing() != null && task.getPricing().getPaymentTerms() != null) {
                VerificationTask.PaymentTerms terms = task.getPricing().getPaymentTerms();
                if (terms.paymentType == VerificationTask.PaymentTerms.PaymentType.MILESTONE_BASED) {
                    // Trigger milestone payment
                    triggerMilestonePayment(task, milestoneId);
                }
            }

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get task progress report
     *
     * @param taskId Task ID
     * @return Uni<TaskProgressReport> progress report
     */
    public Uni<TaskProgressReport> getTaskProgress(String taskId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                return null;
            }

            TaskProgressReport report = new TaskProgressReport();
            report.taskId = taskId;
            report.status = task.getStatus();
            report.progressPercent = task.getProgressPercent();
            report.currentPhase = task.getCurrentPhase();
            report.completedMilestones = (int) task.getMilestones().stream()
                .filter(m -> m.getStatus() == VerificationTask.TaskMilestone.MilestoneStatus.COMPLETED)
                .count();
            report.totalMilestones = task.getMilestones().size();
            report.completedDeliverables = (int) task.getDeliverables().stream()
                .filter(d -> d.getStatus() == VerificationTask.TaskDeliverable.DeliverableStatus.APPROVED)
                .count();
            report.totalDeliverables = task.getDeliverables().size();
            report.daysRemaining = task.getTimeline() != null ?
                task.getTimeline().getRemainingTime().toDays() : 0;
            report.isOverdue = task.getTimeline() != null && task.getTimeline().isOverdue();
            report.rfiCount = task.getRfiIds().size();
            report.lastUpdated = task.getLastUpdated();

            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== RFI MANAGEMENT ====================

    /**
     * Create a new RFI request for a task
     *
     * @param taskId Task ID
     * @param rfiRequest RFI request details
     * @return Uni<RFIRequest> created RFI
     */
    public Uni<RFIRequest> createRFI(String taskId, RFIRequest rfiRequest) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                throw new IllegalArgumentException("Task not found: " + taskId);
            }

            // Link RFI to task
            task.linkRfi(rfiRequest.getRfiId());
            rfiToTaskMapping.put(rfiRequest.getRfiId(), taskId);

            LOGGER.info("Created RFI {} for task {}", rfiRequest.getRfiId(), taskId);

            return rfiRequest;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Link an existing RFI to a task
     *
     * @param taskId Task ID
     * @param rfiId RFI ID
     * @return Uni<Boolean> indicating success
     */
    public Uni<Boolean> linkRFIToTask(String taskId, String rfiId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                LOGGER.warn("Task not found for RFI linking: {}", taskId);
                return false;
            }

            task.linkRfi(rfiId);
            rfiToTaskMapping.put(rfiId, taskId);

            LOGGER.info("Linked RFI {} to task {}", rfiId, taskId);

            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all RFIs for a task
     *
     * @param taskId Task ID
     * @return Uni<List<String>> list of RFI IDs
     */
    public Uni<List<String>> getTaskRFIs(String taskId) {
        return Uni.createFrom().item(() -> {
            VerificationTask task = tasks.get(taskId);
            if (task == null) {
                return (List<String>) new ArrayList<String>();
            }

            return (List<String>) new ArrayList<String>(task.getRfiIds());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== TASK STATISTICS ====================

    /**
     * Get overall task statistics
     *
     * @return Uni<TaskStatistics> statistics
     */
    public Uni<TaskStatistics> getTaskStats() {
        return Uni.createFrom().item(() -> {
            TaskStatistics stats = new TaskStatistics();

            stats.totalTasks = tasks.size();
            stats.activeTasks = (int) tasks.values().stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.IN_PROGRESS ||
                            t.getStatus() == VerificationTask.TaskStatus.ACCEPTED)
                .count();
            stats.completedTasks = (int) tasks.values().stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.COMPLETED)
                .count();
            stats.pendingAssignment = (int) tasks.values().stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.CREATED ||
                            t.getStatus() == VerificationTask.TaskStatus.PENDING_ASSIGNMENT)
                .count();
            stats.overdueTasks = (int) tasks.values().stream()
                .filter(t -> t.getTimeline() != null && t.getTimeline().isOverdue())
                .count();

            // Calculate average completion time
            List<VerificationTask> completed = tasks.values().stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.COMPLETED &&
                            t.getTimeline() != null &&
                            t.getTimeline().getActualDuration() != null)
                .toList();

            if (!completed.isEmpty()) {
                long totalMillis = completed.stream()
                    .mapToLong(t -> t.getTimeline().getActualDuration().toMillis())
                    .sum();
                stats.avgCompletionDays = (totalMillis / completed.size()) / (24 * 60 * 60 * 1000);
            }

            // Status distribution
            stats.statusDistribution = tasks.values().stream()
                .collect(Collectors.groupingBy(
                    VerificationTask::getStatus,
                    Collectors.counting()
                ));

            return stats;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get verifier workload
     *
     * @param verifierId Verifier ID
     * @return Uni<VerifierWorkload> workload information
     */
    public Uni<VerifierWorkload> getVerifierWorkload(String verifierId) {
        return Uni.createFrom().item(() -> {
            List<String> verifierTaskIds = tasksByVerifier.getOrDefault(verifierId, Collections.emptyList());
            List<VerificationTask> verifierTasks = verifierTaskIds.stream()
                .map(tasks::get)
                .filter(Objects::nonNull)
                .toList();

            VerifierWorkload workload = new VerifierWorkload();
            workload.verifierId = verifierId;
            workload.totalAssigned = verifierTasks.size();
            workload.activeTasks = (int) verifierTasks.stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.IN_PROGRESS ||
                            t.getStatus() == VerificationTask.TaskStatus.ACCEPTED)
                .count();
            workload.completedTasks = (int) verifierTasks.stream()
                .filter(t -> t.getStatus() == VerificationTask.TaskStatus.COMPLETED)
                .count();
            workload.overdueTasks = (int) verifierTasks.stream()
                .filter(t -> t.getTimeline() != null && t.getTimeline().isOverdue())
                .count();

            // Calculate capacity utilization (assuming max 10 concurrent)
            int maxCapacity = 10;
            workload.capacityUtilization = workload.activeTasks * 100.0 / maxCapacity;
            workload.isAvailable = workload.activeTasks < maxCapacity;

            return workload;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get overdue tasks
     *
     * @return Uni<List<VerificationTask>> list of overdue tasks
     */
    public Uni<List<VerificationTask>> getOverdueTasks() {
        return Uni.createFrom().item(() -> {
            return tasks.values().stream()
                .filter(t -> t.getTimeline() != null && t.getTimeline().isOverdue())
                .filter(t -> t.getStatus() != VerificationTask.TaskStatus.COMPLETED &&
                            t.getStatus() != VerificationTask.TaskStatus.CANCELLED)
                .sorted((t1, t2) -> {
                    Instant due1 = t1.getTimeline().getDueDate();
                    Instant due2 = t2.getTimeline().getDueDate();
                    return due1.compareTo(due2);
                })
                .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get tasks by workflow
     *
     * @param workflowId Workflow ID
     * @return Uni<List<VerificationTask>> list of tasks
     */
    public Uni<List<VerificationTask>> getTasksByWorkflow(String workflowId) {
        return Uni.createFrom().item(() -> {
            List<String> taskIds = tasksByWorkflow.getOrDefault(workflowId, Collections.emptyList());
            return taskIds.stream()
                .map(tasks::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get task by ID
     *
     * @param taskId Task ID
     * @return Uni<VerificationTask> task or null if not found
     */
    public Uni<VerificationTask> getTask(String taskId) {
        return Uni.createFrom().item(() -> tasks.get(taskId))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private String extractAssetId(String compositeId) {
        // Extract asset ID from composite ID
        // Implementation depends on composite ID format
        return compositeId.replaceFirst("^COMP-", "");
    }

    private VerificationTask.TaskPriority determinePriority(VerificationLevel level) {
        return switch (level) {
            case INSTITUTIONAL -> VerificationTask.TaskPriority.HIGH;
            case CERTIFIED -> VerificationTask.TaskPriority.HIGH;
            case ENHANCED -> VerificationTask.TaskPriority.NORMAL;
            case BASIC -> VerificationTask.TaskPriority.LOW;
            default -> VerificationTask.TaskPriority.NORMAL;
        };
    }

    private int calculateTierCompatibility(VerificationLevel level, VerifierTier tier) {
        // Map verification level to required tier
        VerifierTier requiredTier = switch (level) {
            case INSTITUTIONAL -> VerifierTier.TIER_4;
            case CERTIFIED -> VerifierTier.TIER_3;
            case ENHANCED -> VerifierTier.TIER_2;
            case BASIC -> VerifierTier.TIER_1;
            default -> VerifierTier.TIER_1;
        };

        // Calculate compatibility (0 = incompatible, 1 = exact match, 0.5 = one tier up)
        if (tier == requiredTier) {
            return 1;
        } else if (tier.ordinal() > requiredTier.ordinal()) {
            // Higher tier than required is acceptable
            return 1;
        } else {
            // Lower tier is not acceptable
            return 0;
        }
    }

    private int getVerifierActiveTaskCount(String verifierId) {
        List<String> verifierTaskIds = tasksByVerifier.getOrDefault(verifierId, Collections.emptyList());
        return (int) verifierTaskIds.stream()
            .map(tasks::get)
            .filter(Objects::nonNull)
            .filter(t -> t.getStatus() == VerificationTask.TaskStatus.IN_PROGRESS ||
                        t.getStatus() == VerificationTask.TaskStatus.ACCEPTED)
            .count();
    }

    private Duration estimateTurnaround(io.aurigraph.v11.contracts.composite.ThirdPartyVerifier verifier,
                                       VerificationTask.TaskScope scope) {
        // Base turnaround by tier
        Duration base = switch (verifier.getTier()) {
            case TIER_4 -> Duration.ofDays(3);
            case TIER_3 -> Duration.ofDays(5);
            case TIER_2 -> Duration.ofDays(7);
            case TIER_1 -> Duration.ofDays(10);
        };

        // Adjust based on current workload
        int workload = getVerifierActiveTaskCount(verifier.getVerifierId());
        if (workload > 5) {
            base = base.plus(Duration.ofDays(workload - 5));
        }

        return base;
    }

    private void triggerPaymentRelease(VerificationTask task) {
        // Integrate with payment service to release payment
        LOGGER.info("Triggering payment release for task: {}", task.getTaskId());
        // Implementation would call paymentService.releaseFromEscrow() or similar
    }

    private void triggerMilestonePayment(VerificationTask task, String milestoneId) {
        // Integrate with payment service for milestone-based payment
        LOGGER.info("Triggering milestone payment for task: {}, milestone: {}",
            task.getTaskId(), milestoneId);
        // Implementation would call paymentService.releaseMilestonePayment() or similar
    }

    // ==================== INNER CLASSES ====================

    /**
     * Verifier Match Result
     */
    public static class VerifierMatch {
        public String verifierId;
        public String verifierName;
        public VerifierTier tier;
        public BigDecimal matchScore = BigDecimal.ZERO;
        public BigDecimal reputation = BigDecimal.ZERO;
        public boolean specializationMatch;
        public boolean tierCompatible;
        public boolean available;
        public boolean locationMatch;
        public Duration estimatedTurnaround;

        @Override
        public String toString() {
            return String.format("VerifierMatch{id=%s, name=%s, tier=%s, score=%.2f, reputation=%.2f}",
                verifierId, verifierName, tier, matchScore, reputation);
        }
    }

    /**
     * Task Progress Report
     */
    public static class TaskProgressReport {
        public String taskId;
        public VerificationTask.TaskStatus status;
        public BigDecimal progressPercent;
        public String currentPhase;
        public int completedMilestones;
        public int totalMilestones;
        public int completedDeliverables;
        public int totalDeliverables;
        public long daysRemaining;
        public boolean isOverdue;
        public int rfiCount;
        public Instant lastUpdated;

        public double getMilestoneCompletionRate() {
            return totalMilestones > 0 ? (double) completedMilestones / totalMilestones * 100 : 0;
        }

        public double getDeliverableCompletionRate() {
            return totalDeliverables > 0 ? (double) completedDeliverables / totalDeliverables * 100 : 0;
        }
    }

    /**
     * Task Statistics
     */
    public static class TaskStatistics {
        public int totalTasks;
        public int activeTasks;
        public int completedTasks;
        public int pendingAssignment;
        public int overdueTasks;
        public long avgCompletionDays;
        public Map<VerificationTask.TaskStatus, Long> statusDistribution;

        public double getCompletionRate() {
            return totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0;
        }

        public double getOverdueRate() {
            return activeTasks > 0 ? (double) overdueTasks / activeTasks * 100 : 0;
        }
    }

    /**
     * Verifier Workload Information
     */
    public static class VerifierWorkload {
        public String verifierId;
        public int totalAssigned;
        public int activeTasks;
        public int completedTasks;
        public int overdueTasks;
        public double capacityUtilization;
        public boolean isAvailable;

        public int getRemainingCapacity() {
            int maxCapacity = 10; // Should be configurable
            return Math.max(0, maxCapacity - activeTasks);
        }

        public double getCompletionRate() {
            return totalAssigned > 0 ? (double) completedTasks / totalAssigned * 100 : 0;
        }
    }
}
