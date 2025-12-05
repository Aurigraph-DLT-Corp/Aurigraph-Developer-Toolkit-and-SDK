package io.aurigraph.v11.contracts.composite.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.contracts.composite.VerificationLevel;
import io.aurigraph.v11.contracts.composite.VerificationService.VerificationWorkflow;
import io.aurigraph.v11.contracts.composite.VerificationService.WorkflowStatus;
import io.aurigraph.v11.contracts.composite.VerificationService.AuditEntry;
import io.aurigraph.v11.storage.LevelDBService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Verification Workflow Repository - LevelDB Implementation
 *
 * Provides per-node embedded storage for VerificationWorkflow entities using LevelDB.
 * Also stores audit trail entries for each workflow.
 *
 * Key structure:
 * - workflow:{workflowId} -> VerificationWorkflow
 * - workflow-by-composite:{compositeId}:{workflowId} -> workflowId (index)
 * - audit:{workflowId}:{entryId} -> AuditEntry
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: LevelDB Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class VerificationWorkflowRepositoryLevelDB {

    private static final String WORKFLOW_PREFIX = "workflow:";
    private static final String COMPOSITE_INDEX_PREFIX = "workflow-by-composite:";
    private static final String AUDIT_PREFIX = "audit:";

    @Inject
    LevelDBService levelDB;

    @Inject
    ObjectMapper objectMapper;

    // ==================== WORKFLOW CRUD OPERATIONS ====================

    /**
     * Persist a verification workflow
     */
    public Uni<VerificationWorkflow> persist(VerificationWorkflow workflow) {
        return Uni.createFrom().item(() -> {
            try {
                // Store workflow
                String key = WORKFLOW_PREFIX + workflow.getWorkflowId();
                String value = objectMapper.writeValueAsString(workflow);
                levelDB.put(key, value).await().indefinitely();

                // Store composite index
                String indexKey = COMPOSITE_INDEX_PREFIX + workflow.getCompositeId() + ":" + workflow.getWorkflowId();
                levelDB.put(indexKey, workflow.getWorkflowId()).await().indefinitely();

                return workflow;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist verification workflow", e);
            }
        });
    }

    /**
     * Find workflow by ID
     */
    public Uni<Optional<VerificationWorkflow>> findById(String workflowId) {
        return Uni.createFrom().item(() -> {
            try {
                String key = WORKFLOW_PREFIX + workflowId;
                String value = levelDB.get(key).await().indefinitely();
                if (value == null) {
                    return Optional.empty();
                }
                VerificationWorkflow workflow = objectMapper.readValue(value, VerificationWorkflow.class);
                return Optional.of(workflow);
            } catch (Exception e) {
                throw new RuntimeException("Failed to find workflow by ID", e);
            }
        });
    }

    /**
     * Delete workflow by ID
     */
    public Uni<Void> deleteById(String workflowId) {
        return findById(workflowId).flatMap(opt -> {
            if (opt.isEmpty()) {
                return Uni.createFrom().voidItem();
            }
            VerificationWorkflow workflow = opt.get();
            try {
                // Delete workflow
                String key = WORKFLOW_PREFIX + workflowId;
                levelDB.delete(key).await().indefinitely();

                // Delete composite index
                String indexKey = COMPOSITE_INDEX_PREFIX + workflow.getCompositeId() + ":" + workflowId;
                levelDB.delete(indexKey).await().indefinitely();

                // Delete audit entries
                deleteAuditEntriesForWorkflow(workflowId).await().indefinitely();

                return Uni.createFrom().voidItem();
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete workflow", e);
            }
        });
    }

    // ==================== WORKFLOW QUERIES ====================

    /**
     * Find all workflows for a composite token
     */
    public Uni<List<VerificationWorkflow>> findByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            try {
                String prefix = COMPOSITE_INDEX_PREFIX + compositeId + ":";
                Map<String, String> indexEntries = levelDB.scanByPrefix(prefix).await().indefinitely();

                List<VerificationWorkflow> workflows = new ArrayList<>();
                for (String workflowId : indexEntries.values()) {
                    findById(workflowId).await().indefinitely()
                        .ifPresent(workflows::add);
                }

                return workflows.stream()
                    .sorted(Comparator.comparing(VerificationWorkflow::getCreatedAt).reversed())
                    .collect(Collectors.toList());
            } catch (Exception e) {
                throw new RuntimeException("Failed to find workflows by composite ID", e);
            }
        });
    }

    /**
     * Find all workflows by status
     */
    public Uni<List<VerificationWorkflow>> findByStatus(WorkflowStatus status) {
        return listAll().map(workflows -> workflows.stream()
            .filter(w -> w.getStatus() == status)
            .sorted(Comparator.comparing(VerificationWorkflow::getCreatedAt).reversed())
            .collect(Collectors.toList()));
    }

    /**
     * Find active workflows (pending or in progress)
     */
    public Uni<List<VerificationWorkflow>> findActive() {
        return listAll().map(workflows -> workflows.stream()
            .filter(w -> w.getStatus() == WorkflowStatus.PENDING_VERIFIERS ||
                        w.getStatus() == WorkflowStatus.IN_PROGRESS)
            .sorted(Comparator.comparing(VerificationWorkflow::getCreatedAt).reversed())
            .collect(Collectors.toList()));
    }

    /**
     * Find completed workflows
     */
    public Uni<List<VerificationWorkflow>> findCompleted() {
        return findByStatus(WorkflowStatus.COMPLETED);
    }

    /**
     * Find expired workflows
     */
    public Uni<List<VerificationWorkflow>> findExpired() {
        Instant now = Instant.now();
        return listAll().map(workflows -> workflows.stream()
            .filter(w -> w.getExpiresAt() != null && w.getExpiresAt().isBefore(now) &&
                        w.getStatus() != WorkflowStatus.COMPLETED &&
                        w.getStatus() != WorkflowStatus.REJECTED &&
                        w.getStatus() != WorkflowStatus.CANCELLED)
            .collect(Collectors.toList()));
    }

    /**
     * Find workflows by verification level
     */
    public Uni<List<VerificationWorkflow>> findByRequiredLevel(VerificationLevel level) {
        return listAll().map(workflows -> workflows.stream()
            .filter(w -> w.getRequiredLevel() == level)
            .sorted(Comparator.comparing(VerificationWorkflow::getCreatedAt).reversed())
            .collect(Collectors.toList()));
    }

    /**
     * List all workflows
     */
    public Uni<List<VerificationWorkflow>> listAll() {
        return Uni.createFrom().item(() -> {
            try {
                Map<String, String> entries = levelDB.scanByPrefix(WORKFLOW_PREFIX).await().indefinitely();

                List<VerificationWorkflow> workflows = new ArrayList<>();
                for (String value : entries.values()) {
                    workflows.add(objectMapper.readValue(value, VerificationWorkflow.class));
                }
                return workflows;
            } catch (Exception e) {
                throw new RuntimeException("Failed to list all workflows", e);
            }
        });
    }

    /**
     * Count workflows by status
     */
    public Uni<Long> countByStatus(WorkflowStatus status) {
        return findByStatus(status).map(list -> (long) list.size());
    }

    /**
     * Count all workflows
     */
    public Uni<Long> count() {
        return listAll().map(list -> (long) list.size());
    }

    // ==================== AUDIT TRAIL OPERATIONS ====================

    /**
     * Persist an audit entry
     */
    public Uni<AuditEntry> persistAuditEntry(AuditEntry entry) {
        return Uni.createFrom().item(() -> {
            try {
                String key = AUDIT_PREFIX + entry.workflowId() + ":" + entry.entryId();
                String value = objectMapper.writeValueAsString(entry);
                levelDB.put(key, value).await().indefinitely();
                return entry;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist audit entry", e);
            }
        });
    }

    /**
     * Persist multiple audit entries
     */
    public Uni<List<AuditEntry>> persistAuditEntries(List<AuditEntry> entries) {
        return Uni.createFrom().item(() -> {
            try {
                Map<String, String> puts = new HashMap<>();
                for (AuditEntry entry : entries) {
                    String key = AUDIT_PREFIX + entry.workflowId() + ":" + entry.entryId();
                    puts.put(key, objectMapper.writeValueAsString(entry));
                }
                levelDB.batchWrite(puts, null).await().indefinitely();
                return entries;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist audit entries", e);
            }
        });
    }

    /**
     * Find all audit entries for a workflow
     */
    public Uni<List<AuditEntry>> findAuditEntriesByWorkflowId(String workflowId) {
        return Uni.createFrom().item(() -> {
            try {
                String prefix = AUDIT_PREFIX + workflowId + ":";
                Map<String, String> entries = levelDB.scanByPrefix(prefix).await().indefinitely();

                List<AuditEntry> auditEntries = new ArrayList<>();
                for (String value : entries.values()) {
                    auditEntries.add(objectMapper.readValue(value, AuditEntry.class));
                }

                return auditEntries.stream()
                    .sorted(Comparator.comparing(AuditEntry::timestamp))
                    .collect(Collectors.toList());
            } catch (Exception e) {
                throw new RuntimeException("Failed to find audit entries", e);
            }
        });
    }

    /**
     * Delete all audit entries for a workflow
     */
    public Uni<Void> deleteAuditEntriesForWorkflow(String workflowId) {
        return Uni.createFrom().item(() -> {
            try {
                String prefix = AUDIT_PREFIX + workflowId + ":";
                List<String> keys = levelDB.getKeysByPrefix(prefix).await().indefinitely();
                if (!keys.isEmpty()) {
                    levelDB.batchWrite(null, keys).await().indefinitely();
                }
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete audit entries", e);
            }
        });
    }

    // ==================== STATISTICS ====================

    /**
     * Get workflow statistics
     */
    public Uni<WorkflowStatistics> getStatistics() {
        return listAll().map(workflows -> {
            long total = workflows.size();

            Map<WorkflowStatus, Long> byStatus = workflows.stream()
                .collect(Collectors.groupingBy(
                    VerificationWorkflow::getStatus,
                    Collectors.counting()
                ));

            Map<VerificationLevel, Long> byRequiredLevel = workflows.stream()
                .collect(Collectors.groupingBy(
                    VerificationWorkflow::getRequiredLevel,
                    Collectors.counting()
                ));

            long active = byStatus.getOrDefault(WorkflowStatus.PENDING_VERIFIERS, 0L) +
                         byStatus.getOrDefault(WorkflowStatus.IN_PROGRESS, 0L);
            long completed = byStatus.getOrDefault(WorkflowStatus.COMPLETED, 0L);
            long rejected = byStatus.getOrDefault(WorkflowStatus.REJECTED, 0L);

            // Calculate average completion time for completed workflows
            long avgCompletionTime = (long) workflows.stream()
                .filter(w -> w.getStatus() == WorkflowStatus.COMPLETED && w.getCompletedAt() != null)
                .mapToLong(w -> w.getCompletedAt().toEpochMilli() - w.getCreatedAt().toEpochMilli())
                .average()
                .orElse(0);

            double successRate = total > 0 ? (double) completed / total * 100 : 0;

            return new WorkflowStatistics(
                total,
                active,
                completed,
                rejected,
                byStatus,
                byRequiredLevel,
                avgCompletionTime,
                successRate
            );
        });
    }

    // ==================== DATA MODELS ====================

    public record WorkflowStatistics(
        long totalWorkflows,
        long activeWorkflows,
        long completedWorkflows,
        long rejectedWorkflows,
        Map<WorkflowStatus, Long> byStatus,
        Map<VerificationLevel, Long> byRequiredLevel,
        long averageCompletionTimeMs,
        double successRate
    ) {}
}
