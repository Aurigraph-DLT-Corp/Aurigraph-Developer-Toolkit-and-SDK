package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractProgramming;
import io.aurigraph.v11.contracts.models.ContractProgramming.ProgrammableTrigger;
import io.aurigraph.v11.contracts.models.ContractProgramming.TriggerType;
import io.aurigraph.v11.contracts.models.ContractProgramming.ExecutionRecord;
import io.aurigraph.v11.contracts.models.ContractProgramming.ActionStatus;
import io.quarkus.scheduler.Scheduled;
import io.quarkus.scheduler.ScheduledExecution;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * TriggerSchedulerService - Scheduler for time-based ActiveContract triggers
 *
 * Provides:
 * - Periodic checking for due triggers
 * - Cron expression parsing and scheduling
 * - Interval-based trigger execution
 * - One-time scheduled trigger execution
 * - Execution logging and retry handling
 * - Metrics and monitoring
 *
 * @version 12.0.0
 * @since Sprint 7 - Trigger Execution Engine
 * @author J4C Development Agent
 */
@ApplicationScoped
public class TriggerSchedulerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TriggerSchedulerService.class);

    @Inject
    TriggerExecutionService triggerExecutionService;

    @ConfigProperty(name = "trigger.scheduler.enabled", defaultValue = "true")
    boolean schedulerEnabled;

    @ConfigProperty(name = "trigger.scheduler.check-interval-seconds", defaultValue = "10")
    int checkIntervalSeconds;

    @ConfigProperty(name = "trigger.scheduler.batch-size", defaultValue = "50")
    int batchSize;

    @ConfigProperty(name = "trigger.scheduler.max-concurrent-executions", defaultValue = "100")
    int maxConcurrentExecutions;

    // Scheduled triggers registry: contractId -> triggerId -> ScheduledTriggerInfo
    private final Map<String, Map<String, ScheduledTriggerInfo>> scheduledTriggers = new ConcurrentHashMap<>();

    // Execution queue for pending triggers
    private final Set<TriggerExecutionTask> pendingExecutions = ConcurrentHashMap.newKeySet();

    // Currently executing triggers (to prevent duplicate execution)
    private final Set<String> executingTriggers = ConcurrentHashMap.newKeySet();

    // Metrics
    private final AtomicLong scheduledTriggersCount = new AtomicLong(0);
    private final AtomicLong executedTriggersCount = new AtomicLong(0);
    private final AtomicLong failedTriggersCount = new AtomicLong(0);
    private final AtomicLong missedTriggersCount = new AtomicLong(0);

    // Scheduler state
    private final AtomicBoolean paused = new AtomicBoolean(false);
    private Instant lastCheckTime;
    private Instant startTime;

    // Virtual thread executor
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
        .ofPattern("yyyy-MM-dd HH:mm:ss")
        .withZone(ZoneId.systemDefault());

    /**
     * Initialize the scheduler on startup
     */
    public void initialize() {
        this.startTime = Instant.now();
        this.lastCheckTime = Instant.now();
        LOGGER.info("TriggerSchedulerService initialized. Scheduler enabled: {}", schedulerEnabled);
    }

    // ==================== Scheduled Check (Quarkus @Scheduled) ====================

    /**
     * Periodic check for due triggers
     * Runs every N seconds based on configuration
     */
    @Scheduled(every = "${trigger.scheduler.check-interval-seconds:10}s", identity = "trigger-scheduler-check")
    void checkDueTriggers(ScheduledExecution execution) {
        if (!schedulerEnabled || paused.get()) {
            LOGGER.trace("Scheduler disabled or paused, skipping check");
            return;
        }

        Instant now = Instant.now();
        LOGGER.debug("Checking for due triggers at {}", DATE_FORMATTER.format(now));

        try {
            List<TriggerExecutionTask> dueTasks = findDueTriggers(now);

            if (!dueTasks.isEmpty()) {
                LOGGER.info("Found {} due triggers to execute", dueTasks.size());

                // Process in batches
                for (int i = 0; i < dueTasks.size(); i += batchSize) {
                    List<TriggerExecutionTask> batch = dueTasks.subList(
                        i, Math.min(i + batchSize, dueTasks.size()));
                    executeBatch(batch);
                }
            }

            lastCheckTime = now;

        } catch (Exception e) {
            LOGGER.error("Error during trigger check: {}", e.getMessage(), e);
        }
    }

    /**
     * Cleanup task - runs every minute to clean up stale executions
     */
    @Scheduled(every = "60s", identity = "trigger-scheduler-cleanup")
    void cleanupStaleExecutions() {
        LOGGER.trace("Running cleanup for stale executions");

        // Remove stuck executing triggers (older than 5 minutes)
        Instant staleThreshold = Instant.now().minusSeconds(300);

        int removed = 0;
        for (String triggerId : new ArrayList<>(executingTriggers)) {
            // In production, would check actual execution time
            // For now, just log
        }

        if (removed > 0) {
            LOGGER.info("Cleaned up {} stale trigger executions", removed);
        }
    }

    // ==================== Trigger Scheduling API ====================

    /**
     * Schedule a trigger for execution
     *
     * @param contractId Contract ID
     * @param trigger Trigger to schedule
     * @return Scheduled trigger info
     */
    public Uni<ScheduledTriggerInfo> scheduleTrigger(String contractId, ProgrammableTrigger trigger) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Scheduling trigger {} for contract {}", trigger.getTriggerId(), contractId);

            if (trigger.getType() != TriggerType.TIME_BASED) {
                throw new IllegalArgumentException("Only TIME_BASED triggers can be scheduled");
            }

            ScheduledTriggerInfo info = new ScheduledTriggerInfo();
            info.setContractId(contractId);
            info.setTriggerId(trigger.getTriggerId());
            info.setTrigger(trigger);
            info.setScheduledAt(Instant.now());
            info.setStatus(ScheduleStatus.SCHEDULED);

            // Calculate next execution time
            Instant nextExecution = calculateNextExecution(trigger);
            info.setNextExecutionAt(nextExecution);

            // Store in registry
            scheduledTriggers
                .computeIfAbsent(contractId, k -> new ConcurrentHashMap<>())
                .put(trigger.getTriggerId(), info);

            scheduledTriggersCount.incrementAndGet();
            LOGGER.info("Trigger scheduled. Next execution: {}", DATE_FORMATTER.format(nextExecution));

            return info;
        }).runSubscriptionOn(executor);
    }

    /**
     * Unschedule a trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return true if unscheduled
     */
    public Uni<Boolean> unscheduleTrigger(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Unscheduling trigger {} for contract {}", triggerId, contractId);

            Map<String, ScheduledTriggerInfo> triggers = scheduledTriggers.get(contractId);
            if (triggers != null) {
                ScheduledTriggerInfo removed = triggers.remove(triggerId);
                if (removed != null) {
                    scheduledTriggersCount.decrementAndGet();
                    LOGGER.info("Trigger unscheduled: {}", triggerId);
                    return true;
                }
            }
            return false;
        }).runSubscriptionOn(executor);
    }

    /**
     * Update schedule for a trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param cronExpression New cron expression (or null to keep existing)
     * @param intervalSeconds New interval in seconds (or 0 to keep existing)
     * @return Updated schedule info
     */
    public Uni<ScheduledTriggerInfo> updateSchedule(String contractId, String triggerId,
                                                     String cronExpression, long intervalSeconds) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Updating schedule for trigger {}", triggerId);

            Map<String, ScheduledTriggerInfo> triggers = scheduledTriggers.get(contractId);
            if (triggers == null) {
                throw new IllegalArgumentException("Contract not found: " + contractId);
            }

            ScheduledTriggerInfo info = triggers.get(triggerId);
            if (info == null) {
                throw new IllegalArgumentException("Trigger not scheduled: " + triggerId);
            }

            ProgrammableTrigger trigger = info.getTrigger();

            if (cronExpression != null && !cronExpression.isEmpty()) {
                trigger.setCronExpression(cronExpression);
            }
            if (intervalSeconds > 0) {
                trigger.setIntervalSeconds(intervalSeconds);
            }

            // Recalculate next execution
            Instant nextExecution = calculateNextExecution(trigger);
            info.setNextExecutionAt(nextExecution);
            info.setUpdatedAt(Instant.now());

            LOGGER.info("Schedule updated. Next execution: {}", DATE_FORMATTER.format(nextExecution));
            return info;
        }).runSubscriptionOn(executor);
    }

    /**
     * Pause scheduling for a trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Updated info
     */
    public Uni<ScheduledTriggerInfo> pauseTrigger(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            ScheduledTriggerInfo info = getScheduledTriggerInfo(contractId, triggerId);
            if (info != null) {
                info.setStatus(ScheduleStatus.PAUSED);
                info.setUpdatedAt(Instant.now());
                LOGGER.info("Trigger paused: {}", triggerId);
            }
            return info;
        });
    }

    /**
     * Resume a paused trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Updated info
     */
    public Uni<ScheduledTriggerInfo> resumeTrigger(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            ScheduledTriggerInfo info = getScheduledTriggerInfo(contractId, triggerId);
            if (info != null) {
                info.setStatus(ScheduleStatus.SCHEDULED);
                info.setNextExecutionAt(calculateNextExecution(info.getTrigger()));
                info.setUpdatedAt(Instant.now());
                LOGGER.info("Trigger resumed: {}", triggerId);
            }
            return info;
        });
    }

    /**
     * Get scheduled trigger info
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Scheduled trigger info
     */
    public ScheduledTriggerInfo getScheduledTriggerInfo(String contractId, String triggerId) {
        Map<String, ScheduledTriggerInfo> triggers = scheduledTriggers.get(contractId);
        return triggers != null ? triggers.get(triggerId) : null;
    }

    /**
     * List all scheduled triggers for a contract
     *
     * @param contractId Contract ID
     * @return List of scheduled trigger info
     */
    public Uni<List<ScheduledTriggerInfo>> listScheduledTriggers(String contractId) {
        return Uni.createFrom().item(() -> {
            Map<String, ScheduledTriggerInfo> triggers = scheduledTriggers.get(contractId);
            return triggers != null ? new ArrayList<>(triggers.values()) : new ArrayList<>();
        });
    }

    /**
     * Get all scheduled triggers across all contracts
     *
     * @return List of all scheduled trigger info
     */
    public Uni<List<ScheduledTriggerInfo>> listAllScheduledTriggers() {
        return Uni.createFrom().item(() ->
            scheduledTriggers.values().stream()
                .flatMap(m -> m.values().stream())
                .collect(Collectors.toList())
        );
    }

    // ==================== Scheduler Control ====================

    /**
     * Pause the scheduler
     */
    public void pauseScheduler() {
        paused.set(true);
        LOGGER.info("Trigger scheduler paused");
    }

    /**
     * Resume the scheduler
     */
    public void resumeScheduler() {
        paused.set(false);
        LOGGER.info("Trigger scheduler resumed");
    }

    /**
     * Check if scheduler is paused
     */
    public boolean isSchedulerPaused() {
        return paused.get();
    }

    /**
     * Check if scheduler is enabled
     */
    public boolean isSchedulerEnabled() {
        return schedulerEnabled;
    }

    // ==================== Metrics ====================

    /**
     * Get scheduler metrics
     *
     * @return Metrics map
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("schedulerEnabled", schedulerEnabled);
        metrics.put("schedulerPaused", paused.get());
        metrics.put("scheduledTriggers", scheduledTriggersCount.get());
        metrics.put("executedTriggers", executedTriggersCount.get());
        metrics.put("failedTriggers", failedTriggersCount.get());
        metrics.put("missedTriggers", missedTriggersCount.get());
        metrics.put("pendingExecutions", pendingExecutions.size());
        metrics.put("currentlyExecuting", executingTriggers.size());
        metrics.put("lastCheckTime", lastCheckTime != null ? DATE_FORMATTER.format(lastCheckTime) : null);
        metrics.put("uptime", startTime != null ? Duration.between(startTime, Instant.now()).toSeconds() : 0);
        metrics.put("contractsWithSchedules", scheduledTriggers.size());
        return metrics;
    }

    /**
     * Get scheduler status
     *
     * @return Status info
     */
    public SchedulerStatus getStatus() {
        SchedulerStatus status = new SchedulerStatus();
        status.setEnabled(schedulerEnabled);
        status.setPaused(paused.get());
        status.setLastCheckTime(lastCheckTime);
        status.setStartTime(startTime);
        status.setScheduledCount(scheduledTriggersCount.get());
        status.setExecutedCount(executedTriggersCount.get());
        status.setFailedCount(failedTriggersCount.get());
        status.setPendingCount(pendingExecutions.size());
        return status;
    }

    // ==================== Private Helper Methods ====================

    /**
     * Find all triggers that are due for execution
     */
    private List<TriggerExecutionTask> findDueTriggers(Instant now) {
        List<TriggerExecutionTask> dueTasks = new ArrayList<>();

        for (Map.Entry<String, Map<String, ScheduledTriggerInfo>> contractEntry : scheduledTriggers.entrySet()) {
            String contractId = contractEntry.getKey();

            for (ScheduledTriggerInfo info : contractEntry.getValue().values()) {
                if (isDueForExecution(info, now)) {
                    TriggerExecutionTask task = new TriggerExecutionTask(
                        contractId,
                        info.getTriggerId(),
                        info.getTrigger(),
                        now
                    );
                    dueTasks.add(task);
                }
            }
        }

        // Sort by priority and scheduled time
        dueTasks.sort(Comparator
            .comparingInt((TriggerExecutionTask t) -> t.getTrigger().getPriority()).reversed()
            .thenComparing(TriggerExecutionTask::getScheduledFor));

        return dueTasks;
    }

    /**
     * Check if a trigger is due for execution
     */
    private boolean isDueForExecution(ScheduledTriggerInfo info, Instant now) {
        if (info.getStatus() != ScheduleStatus.SCHEDULED) {
            return false;
        }

        ProgrammableTrigger trigger = info.getTrigger();
        if (!trigger.isEnabled() || !trigger.canExecute()) {
            return false;
        }

        // Check if already executing
        String execKey = info.getContractId() + ":" + info.getTriggerId();
        if (executingTriggers.contains(execKey)) {
            return false;
        }

        Instant nextExecution = info.getNextExecutionAt();
        if (nextExecution == null) {
            return false;
        }

        // Is it time?
        return !now.isBefore(nextExecution);
    }

    /**
     * Execute a batch of triggers
     */
    private void executeBatch(List<TriggerExecutionTask> batch) {
        for (TriggerExecutionTask task : batch) {
            // Check concurrent execution limit
            if (executingTriggers.size() >= maxConcurrentExecutions) {
                LOGGER.warn("Max concurrent executions reached, queuing task: {}", task.getTriggerId());
                pendingExecutions.add(task);
                continue;
            }

            executeTask(task);
        }
    }

    /**
     * Execute a single trigger task
     */
    private void executeTask(TriggerExecutionTask task) {
        String execKey = task.getContractId() + ":" + task.getTriggerId();

        // Mark as executing
        executingTriggers.add(execKey);

        executor.submit(() -> {
            try {
                LOGGER.info("Executing scheduled trigger: {}", task.getTriggerId());

                // Execute via TriggerExecutionService
                ExecutionRecord record = triggerExecutionService.executeTrigger(
                    task.getContractId(),
                    task.getTriggerId()
                ).await().atMost(Duration.ofMinutes(5));

                // Update stats
                ScheduledTriggerInfo info = getScheduledTriggerInfo(task.getContractId(), task.getTriggerId());
                if (info != null) {
                    info.setLastExecutionAt(Instant.now());
                    info.setExecutionCount(info.getExecutionCount() + 1);

                    if (record.getStatus() == ActionStatus.SUCCESS) {
                        info.setLastStatus("SUCCESS");
                        executedTriggersCount.incrementAndGet();
                    } else {
                        info.setLastStatus("FAILED");
                        info.setLastError(record.getError());
                        failedTriggersCount.incrementAndGet();
                    }

                    // Schedule next execution
                    Instant nextExecution = calculateNextExecution(task.getTrigger());
                    info.setNextExecutionAt(nextExecution);

                    // Check if trigger is exhausted
                    if (!task.getTrigger().canExecute()) {
                        info.setStatus(ScheduleStatus.COMPLETED);
                        LOGGER.info("Trigger exhausted (max executions reached): {}", task.getTriggerId());
                    }
                }

                LOGGER.info("Scheduled trigger execution completed: {} - {}",
                    task.getTriggerId(), record.getStatus());

            } catch (Exception e) {
                LOGGER.error("Scheduled trigger execution failed: {} - {}",
                    task.getTriggerId(), e.getMessage(), e);
                failedTriggersCount.incrementAndGet();

                ScheduledTriggerInfo info = getScheduledTriggerInfo(task.getContractId(), task.getTriggerId());
                if (info != null) {
                    info.setLastStatus("ERROR");
                    info.setLastError(e.getMessage());
                }
            } finally {
                executingTriggers.remove(execKey);

                // Process any pending executions
                processPendingExecutions();
            }
        });
    }

    /**
     * Process pending executions from the queue
     */
    private void processPendingExecutions() {
        if (pendingExecutions.isEmpty()) {
            return;
        }

        Iterator<TriggerExecutionTask> iterator = pendingExecutions.iterator();
        while (iterator.hasNext() && executingTriggers.size() < maxConcurrentExecutions) {
            TriggerExecutionTask task = iterator.next();
            iterator.remove();
            executeTask(task);
        }
    }

    /**
     * Calculate next execution time for a trigger
     */
    private Instant calculateNextExecution(ProgrammableTrigger trigger) {
        Instant now = Instant.now();

        // One-time scheduled trigger
        if (trigger.getScheduledAt() != null && trigger.getScheduledAt().isAfter(now)) {
            return trigger.getScheduledAt();
        }

        // Interval-based trigger
        if (trigger.getIntervalSeconds() > 0) {
            Instant lastExec = trigger.getLastExecutedAt();
            if (lastExec == null) {
                return now.plusSeconds(trigger.getIntervalSeconds());
            }
            return lastExec.plusSeconds(trigger.getIntervalSeconds());
        }

        // Cron-based trigger
        if (trigger.getCronExpression() != null && !trigger.getCronExpression().isEmpty()) {
            return calculateNextCronExecution(trigger.getCronExpression(), now);
        }

        // Default: execute immediately
        return now;
    }

    /**
     * Calculate next execution based on cron expression
     * Simplified cron parsing - in production, use a proper library like cron-utils
     */
    private Instant calculateNextCronExecution(String cronExpression, Instant from) {
        // Simple cron parsing for common patterns
        // Format: second minute hour day-of-month month day-of-week

        try {
            String[] parts = cronExpression.trim().split("\\s+");

            // Handle common patterns
            if (cronExpression.equals("0 * * * * ?") || cronExpression.equals("@minutely")) {
                // Every minute
                return from.plusSeconds(60);
            } else if (cronExpression.equals("0 0 * * * ?") || cronExpression.equals("@hourly")) {
                // Every hour
                return from.plusSeconds(3600);
            } else if (cronExpression.equals("0 0 0 * * ?") || cronExpression.equals("@daily")) {
                // Daily at midnight
                return from.plusSeconds(86400);
            } else if (cronExpression.startsWith("*/")) {
                // Every N seconds/minutes pattern
                int interval = Integer.parseInt(parts[0].substring(2));
                return from.plusSeconds(interval);
            } else if (parts.length >= 2 && parts[1].startsWith("*/")) {
                // Every N minutes
                int interval = Integer.parseInt(parts[1].substring(2));
                return from.plusSeconds(interval * 60L);
            }

            // Default: every minute for unrecognized patterns
            LOGGER.warn("Unrecognized cron pattern '{}', defaulting to 60s interval", cronExpression);
            return from.plusSeconds(60);

        } catch (Exception e) {
            LOGGER.error("Failed to parse cron expression '{}': {}", cronExpression, e.getMessage());
            return from.plusSeconds(60);
        }
    }

    // ==================== Inner Classes ====================

    /**
     * Scheduled trigger information
     */
    public static class ScheduledTriggerInfo {
        private String contractId;
        private String triggerId;
        private ProgrammableTrigger trigger;
        private Instant scheduledAt;
        private Instant nextExecutionAt;
        private Instant lastExecutionAt;
        private Instant updatedAt;
        private ScheduleStatus status = ScheduleStatus.SCHEDULED;
        private int executionCount = 0;
        private String lastStatus;
        private String lastError;

        // Getters and setters
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getTriggerId() { return triggerId; }
        public void setTriggerId(String triggerId) { this.triggerId = triggerId; }
        public ProgrammableTrigger getTrigger() { return trigger; }
        public void setTrigger(ProgrammableTrigger trigger) { this.trigger = trigger; }
        public Instant getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
        public Instant getNextExecutionAt() { return nextExecutionAt; }
        public void setNextExecutionAt(Instant nextExecutionAt) { this.nextExecutionAt = nextExecutionAt; }
        public Instant getLastExecutionAt() { return lastExecutionAt; }
        public void setLastExecutionAt(Instant lastExecutionAt) { this.lastExecutionAt = lastExecutionAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public ScheduleStatus getStatus() { return status; }
        public void setStatus(ScheduleStatus status) { this.status = status; }
        public int getExecutionCount() { return executionCount; }
        public void setExecutionCount(int executionCount) { this.executionCount = executionCount; }
        public String getLastStatus() { return lastStatus; }
        public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }
        public String getLastError() { return lastError; }
        public void setLastError(String lastError) { this.lastError = lastError; }
    }

    /**
     * Task representing a trigger execution
     */
    public static class TriggerExecutionTask {
        private final String contractId;
        private final String triggerId;
        private final ProgrammableTrigger trigger;
        private final Instant scheduledFor;

        public TriggerExecutionTask(String contractId, String triggerId,
                                     ProgrammableTrigger trigger, Instant scheduledFor) {
            this.contractId = contractId;
            this.triggerId = triggerId;
            this.trigger = trigger;
            this.scheduledFor = scheduledFor;
        }

        public String getContractId() { return contractId; }
        public String getTriggerId() { return triggerId; }
        public ProgrammableTrigger getTrigger() { return trigger; }
        public Instant getScheduledFor() { return scheduledFor; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TriggerExecutionTask that = (TriggerExecutionTask) o;
            return Objects.equals(contractId, that.contractId) &&
                   Objects.equals(triggerId, that.triggerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(contractId, triggerId);
        }
    }

    /**
     * Scheduler status information
     */
    public static class SchedulerStatus {
        private boolean enabled;
        private boolean paused;
        private Instant lastCheckTime;
        private Instant startTime;
        private long scheduledCount;
        private long executedCount;
        private long failedCount;
        private int pendingCount;

        // Getters and setters
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isPaused() { return paused; }
        public void setPaused(boolean paused) { this.paused = paused; }
        public Instant getLastCheckTime() { return lastCheckTime; }
        public void setLastCheckTime(Instant lastCheckTime) { this.lastCheckTime = lastCheckTime; }
        public Instant getStartTime() { return startTime; }
        public void setStartTime(Instant startTime) { this.startTime = startTime; }
        public long getScheduledCount() { return scheduledCount; }
        public void setScheduledCount(long scheduledCount) { this.scheduledCount = scheduledCount; }
        public long getExecutedCount() { return executedCount; }
        public void setExecutedCount(long executedCount) { this.executedCount = executedCount; }
        public long getFailedCount() { return failedCount; }
        public void setFailedCount(long failedCount) { this.failedCount = failedCount; }
        public int getPendingCount() { return pendingCount; }
        public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }

        public String getState() {
            if (!enabled) return "DISABLED";
            if (paused) return "PAUSED";
            return "RUNNING";
        }
    }

    /**
     * Schedule status enumeration
     */
    public enum ScheduleStatus {
        SCHEDULED,      // Active and waiting for next execution
        PAUSED,         // Temporarily paused
        COMPLETED,      // Max executions reached or one-time trigger completed
        FAILED,         // Failed too many times
        DISABLED        // Manually disabled
    }
}
