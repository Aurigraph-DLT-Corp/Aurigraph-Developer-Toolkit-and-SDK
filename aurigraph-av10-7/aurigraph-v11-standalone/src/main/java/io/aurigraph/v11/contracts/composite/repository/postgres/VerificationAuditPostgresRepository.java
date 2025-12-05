package io.aurigraph.v11.contracts.composite.repository.postgres;

import io.aurigraph.v11.contracts.composite.VerificationService.AuditEntry;
import io.aurigraph.v11.contracts.composite.VerificationService.AuditAction;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * PostgreSQL Repository for VerificationAudit persistence
 *
 * Provides audit trail storage for verification workflows.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class VerificationAuditPostgresRepository implements PanacheRepository<VerificationAuditEntity> {

    // ==================== PERSIST OPERATIONS ====================

    @Transactional
    public Uni<AuditEntry> persistEntry(AuditEntry entry) {
        return Uni.createFrom().item(() -> {
            try {
                VerificationAuditEntity entity = toEntity(entry);
                persist(entity);
                return entry;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist audit entry", e);
            }
        });
    }

    @Transactional
    public Uni<List<AuditEntry>> persistEntries(List<AuditEntry> entries) {
        return Uni.createFrom().item(() -> {
            try {
                for (AuditEntry entry : entries) {
                    VerificationAuditEntity entity = toEntity(entry);
                    persist(entity);
                }
                return entries;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist audit entries", e);
            }
        });
    }

    // ==================== FIND OPERATIONS ====================

    public Uni<List<AuditEntry>> findByWorkflowId(String workflowId) {
        return Uni.createFrom().item(() ->
            find("workflowId", workflowId)
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(AuditEntry::timestamp))
                .collect(Collectors.toList())
        );
    }

    public Uni<List<AuditEntry>> findByAction(AuditAction action) {
        return Uni.createFrom().item(() ->
            find("action", action.name())
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(AuditEntry::timestamp).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<AuditEntry>> findByActor(String actor) {
        return Uni.createFrom().item(() ->
            find("actor", actor)
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(AuditEntry::timestamp).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<AuditEntry>> listAllEntries() {
        return Uni.createFrom().item(() ->
            listAll().stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    // ==================== DELETE OPERATIONS ====================

    @Transactional
    public Uni<Void> deleteByWorkflowId(String workflowId) {
        return Uni.createFrom().item(() -> {
            delete("workflowId", workflowId);
            return null;
        });
    }

    // ==================== COUNT OPERATIONS ====================

    public Uni<Long> countByWorkflowId(String workflowId) {
        return Uni.createFrom().item(() ->
            count("workflowId", workflowId)
        );
    }

    // ==================== ENTITY MAPPING ====================

    private VerificationAuditEntity toEntity(AuditEntry entry) {
        VerificationAuditEntity entity = new VerificationAuditEntity();
        entity.entryId = entry.entryId();
        entity.workflowId = entry.workflowId();
        entity.action = entry.action().name();
        entity.actor = entry.actor();
        entity.details = entry.details();  // String details, not Map
        entity.timestamp = entry.timestamp();
        return entity;
    }

    private AuditEntry fromEntity(VerificationAuditEntity entity) {
        return new AuditEntry(
            entity.entryId,
            entity.workflowId,
            AuditAction.valueOf(entity.action),
            entity.actor,
            entity.details,  // String details, not Map
            entity.timestamp
        );
    }
}
