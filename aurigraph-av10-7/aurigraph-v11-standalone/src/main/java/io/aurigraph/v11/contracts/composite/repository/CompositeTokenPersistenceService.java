package io.aurigraph.v11.contracts.composite.repository;

import io.aurigraph.v11.contracts.composite.*;
import io.aurigraph.v11.contracts.composite.VerificationService.VerificationWorkflow;
import io.aurigraph.v11.contracts.composite.VerificationService.WorkflowStatus;
import io.aurigraph.v11.contracts.composite.VerificationService.AuditEntry;
import io.aurigraph.v11.contracts.composite.repository.postgres.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Composite Token Persistence Service
 *
 * Provides a unified interface for composite token persistence that can
 * switch between LevelDB (production) and PostgreSQL (demo mode) based
 * on configuration.
 *
 * Configuration:
 * - aurigraph.composite-token.persistence.mode=leveldb (default, production)
 * - aurigraph.composite-token.persistence.mode=postgres (demo mode)
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Unified Persistence Layer)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class CompositeTokenPersistenceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CompositeTokenPersistenceService.class);

    @ConfigProperty(name = "aurigraph.composite-token.persistence.mode", defaultValue = "leveldb")
    String persistenceMode;

    // LevelDB repositories
    @Inject
    CompositeTokenRepositoryLevelDB levelDbCompositeRepo;

    @Inject
    SecondaryTokenRepositoryLevelDB levelDbSecondaryRepo;

    @Inject
    VerificationWorkflowRepositoryLevelDB levelDbWorkflowRepo;

    // PostgreSQL repositories
    @Inject
    CompositeTokenPostgresRepository postgresCompositeRepo;

    @Inject
    SecondaryTokenPostgresRepository postgresSecondaryRepo;

    @Inject
    VerificationWorkflowPostgresRepository postgresWorkflowRepo;

    @Inject
    VerificationAuditPostgresRepository postgresAuditRepo;

    // ==================== MODE DETECTION ====================

    public boolean isPostgresMode() {
        return "postgres".equalsIgnoreCase(persistenceMode);
    }

    public boolean isLevelDBMode() {
        return !isPostgresMode();
    }

    public String getPersistenceMode() {
        return persistenceMode;
    }

    // ==================== COMPOSITE TOKEN OPERATIONS ====================

    public Uni<CompositeToken> persistCompositeToken(CompositeToken token) {
        LOGGER.debug("Persisting composite token {} using {} mode", token.getCompositeId(), persistenceMode);

        if (isPostgresMode()) {
            return postgresCompositeRepo.persistToken(token);
        } else {
            return levelDbCompositeRepo.persist(token);
        }
    }

    public Uni<Optional<CompositeToken>> findCompositeTokenById(String compositeId) {
        if (isPostgresMode()) {
            return postgresCompositeRepo.findByCompositeId(compositeId);
        } else {
            return levelDbCompositeRepo.findByCompositeId(compositeId);
        }
    }

    public Uni<List<CompositeToken>> findCompositeTokensByOwner(String ownerAddress) {
        if (isPostgresMode()) {
            return postgresCompositeRepo.findByOwner(ownerAddress);
        } else {
            return levelDbCompositeRepo.findByOwner(ownerAddress);
        }
    }

    public Uni<List<CompositeToken>> findCompositeTokensByAssetType(String assetType) {
        if (isPostgresMode()) {
            return postgresCompositeRepo.findByAssetType(assetType);
        } else {
            return levelDbCompositeRepo.findByAssetType(assetType);
        }
    }

    public Uni<List<CompositeToken>> findCompositeTokensByStatus(CompositeTokenStatus status) {
        if (isPostgresMode()) {
            return postgresCompositeRepo.findByStatus(status);
        } else {
            return levelDbCompositeRepo.findByStatus(status);
        }
    }

    public Uni<List<CompositeToken>> listAllCompositeTokens() {
        if (isPostgresMode()) {
            return postgresCompositeRepo.listAllTokens();
        } else {
            return levelDbCompositeRepo.listAll();
        }
    }

    public Uni<Void> deleteCompositeToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresCompositeRepo.deleteByCompositeId(compositeId);
        } else {
            return levelDbCompositeRepo.deleteById(compositeId);
        }
    }

    // ==================== SECONDARY TOKEN OPERATIONS ====================

    public Uni<SecondaryToken> persistSecondaryToken(SecondaryToken token) {
        LOGGER.debug("Persisting secondary token {} using {} mode",
            token.getTokenId(), persistenceMode);

        if (isPostgresMode()) {
            return postgresSecondaryRepo.persistToken(token);
        } else {
            return levelDbSecondaryRepo.persist(token);
        }
    }

    public Uni<List<SecondaryToken>> persistAllSecondaryTokens(String compositeId, List<SecondaryToken> tokens) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.persistAllTokens(compositeId, tokens);
        } else {
            return levelDbSecondaryRepo.persistAll(compositeId, tokens);
        }
    }

    public Uni<Optional<SecondaryToken>> findSecondaryToken(String compositeId, SecondaryTokenType type) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findByCompositeIdAndType(compositeId, type);
        } else {
            return levelDbSecondaryRepo.findByCompositeIdAndType(compositeId, type);
        }
    }

    public Uni<List<SecondaryToken>> findSecondaryTokensByCompositeId(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findByCompositeId(compositeId);
        } else {
            return levelDbSecondaryRepo.findByCompositeId(compositeId);
        }
    }

    public Uni<Void> deleteSecondaryTokensByCompositeId(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.deleteByCompositeId(compositeId);
        } else {
            return levelDbSecondaryRepo.deleteByCompositeId(compositeId);
        }
    }

    // Typed secondary token finders
    public Uni<Optional<OwnerToken>> findOwnerToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findOwnerToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findOwnerToken(compositeId);
        }
    }

    public Uni<Optional<VerificationToken>> findVerificationToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findVerificationToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findVerificationToken(compositeId);
        }
    }

    public Uni<Optional<ValuationToken>> findValuationToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findValuationToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findValuationToken(compositeId);
        }
    }

    public Uni<Optional<CollateralToken>> findCollateralToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findCollateralToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findCollateralToken(compositeId);
        }
    }

    public Uni<Optional<MediaToken>> findMediaToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findMediaToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findMediaToken(compositeId);
        }
    }

    public Uni<Optional<ComplianceToken>> findComplianceToken(String compositeId) {
        if (isPostgresMode()) {
            return postgresSecondaryRepo.findComplianceToken(compositeId);
        } else {
            return levelDbSecondaryRepo.findComplianceToken(compositeId);
        }
    }

    // ==================== VERIFICATION WORKFLOW OPERATIONS ====================

    public Uni<VerificationWorkflow> persistWorkflow(VerificationWorkflow workflow) {
        LOGGER.debug("Persisting workflow {} using {} mode",
            workflow.getWorkflowId(), persistenceMode);

        if (isPostgresMode()) {
            return postgresWorkflowRepo.persistWorkflow(workflow);
        } else {
            return levelDbWorkflowRepo.persist(workflow);
        }
    }

    public Uni<Optional<VerificationWorkflow>> findWorkflowById(String workflowId) {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.findByWorkflowId(workflowId);
        } else {
            return levelDbWorkflowRepo.findById(workflowId);
        }
    }

    public Uni<List<VerificationWorkflow>> findWorkflowsByCompositeId(String compositeId) {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.findByCompositeId(compositeId);
        } else {
            return levelDbWorkflowRepo.findByCompositeId(compositeId);
        }
    }

    public Uni<List<VerificationWorkflow>> findWorkflowsByStatus(WorkflowStatus status) {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.findByStatus(status);
        } else {
            return levelDbWorkflowRepo.findByStatus(status);
        }
    }

    public Uni<List<VerificationWorkflow>> findActiveWorkflows() {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.findActive();
        } else {
            return levelDbWorkflowRepo.findActive();
        }
    }

    public Uni<List<VerificationWorkflow>> listAllWorkflows() {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.listAllWorkflows();
        } else {
            return levelDbWorkflowRepo.listAll();
        }
    }

    public Uni<Void> deleteWorkflow(String workflowId) {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.deleteByWorkflowId(workflowId);
        } else {
            return levelDbWorkflowRepo.deleteById(workflowId);
        }
    }

    // ==================== AUDIT TRAIL OPERATIONS ====================

    public Uni<AuditEntry> persistAuditEntry(AuditEntry entry) {
        if (isPostgresMode()) {
            return postgresAuditRepo.persistEntry(entry);
        } else {
            return levelDbWorkflowRepo.persistAuditEntry(entry);
        }
    }

    public Uni<List<AuditEntry>> findAuditEntriesByWorkflowId(String workflowId) {
        if (isPostgresMode()) {
            return postgresAuditRepo.findByWorkflowId(workflowId);
        } else {
            return levelDbWorkflowRepo.findAuditEntriesByWorkflowId(workflowId);
        }
    }

    // ==================== STATISTICS ====================

    public Uni<Map<String, Object>> getCompositeTokenStatistics() {
        if (isPostgresMode()) {
            return postgresCompositeRepo.getStatistics();
        } else {
            return levelDbCompositeRepo.getStatistics().map(stats -> {
                Map<String, Object> result = new HashMap<>();
                result.put("totalTokens", stats.totalTokens());
                result.put("pendingVerification", stats.pendingVerification());
                result.put("verified", stats.verified());
                result.put("rejected", stats.rejected());
                result.put("byAssetType", stats.byAssetType());
                result.put("byStatus", stats.byStatus());
                result.put("byVerificationLevel", stats.byVerificationLevel());
                return result;
            });
        }
    }

    public Uni<Map<String, Object>> getWorkflowStatistics() {
        if (isPostgresMode()) {
            return postgresWorkflowRepo.getStatistics();
        } else {
            return levelDbWorkflowRepo.getStatistics().map(stats -> {
                Map<String, Object> result = new HashMap<>();
                result.put("totalWorkflows", stats.totalWorkflows());
                result.put("activeWorkflows", stats.activeWorkflows());
                result.put("completedWorkflows", stats.completedWorkflows());
                result.put("rejectedWorkflows", stats.rejectedWorkflows());
                result.put("byStatus", stats.byStatus());
                result.put("byRequiredLevel", stats.byRequiredLevel());
                result.put("averageCompletionTimeMs", stats.averageCompletionTimeMs());
                result.put("successRate", stats.successRate());
                return result;
            });
        }
    }
}
