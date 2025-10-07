package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ActiveContract;
import io.aurigraph.v11.contracts.models.ActiveContract.ActiveContractStatus;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Active Contract Service for Aurigraph V11
 *
 * Manages the lifecycle of active contracts including:
 * - Contract creation and activation
 * - Party management
 * - Event tracking and logging
 * - Status transitions
 * - Expiration management
 * - Notification handling
 *
 * @version 3.8.0 (Phase 2 Day 10)
 * @author Aurigraph V11 Development Team
 */
@ApplicationScoped
public class ActiveContractService {

    private static final Logger LOG = Logger.getLogger(ActiveContractService.class);

    @Inject
    ActiveContractRepository repository;

    // Performance metrics
    private final AtomicLong contractsCreated = new AtomicLong(0);
    private final AtomicLong contractsActivated = new AtomicLong(0);
    private final AtomicLong contractsCompleted = new AtomicLong(0);
    private final AtomicLong contractsTerminated = new AtomicLong(0);
    private final AtomicLong eventsRecorded = new AtomicLong(0);

    // Virtual thread executor for high concurrency
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ==================== CONTRACT LIFECYCLE ====================

    /**
     * Create a new active contract
     */
    @Transactional
    public Uni<ActiveContract> createContract(ContractCreationRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Creating active contract: %s", request.name());

            ActiveContract contract = new ActiveContract();
            contract.setContractId(generateContractId());
            contract.setName(request.name());
            contract.setCreatorAddress(request.creatorAddress());
            contract.setContractType(request.contractType());
            contract.setDescription(request.description());
            contract.setMetadata(request.metadata());
            contract.setExpiresAt(request.expiresAt());
            contract.setNotificationEnabled(request.notificationEnabled() != null ? request.notificationEnabled() : true);
            contract.setNotificationRecipients(request.notificationRecipients());

            // Add initial parties
            if (request.parties() != null && !request.parties().isEmpty()) {
                request.parties().forEach(contract::addParty);
            }

            // Always include creator as a party
            contract.addParty(request.creatorAddress());

            repository.persist(contract);
            contractsCreated.incrementAndGet();

            LOG.infof("Active contract created: %s", contract.getContractId());
            return contract;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Activate a contract
     */
    @Transactional
    public Uni<ContractStatusResult> activateContract(String contractId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Activating contract: %s", contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.activate();
            repository.persist(contract);
            contractsActivated.incrementAndGet();

            // Record activation event
            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Contract activated: %s", contractId);
            return new ContractStatusResult(
                    contractId,
                    ActiveContractStatus.ACTIVE,
                    contract.getActivatedAt(),
                    "Contract activated successfully"
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete a contract
     */
    @Transactional
    public Uni<ContractStatusResult> completeContract(String contractId, String completionMessage) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Completing contract: %s", contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.complete();
            repository.persist(contract);
            contractsCompleted.incrementAndGet();

            // Record completion event
            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Contract completed: %s", contractId);
            return new ContractStatusResult(
                    contractId,
                    ActiveContractStatus.COMPLETED,
                    contract.getCompletedAt(),
                    completionMessage != null ? completionMessage : "Contract completed successfully"
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Terminate a contract
     */
    @Transactional
    public Uni<ContractStatusResult> terminateContract(String contractId, String reason) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Terminating contract: %s with reason: %s", contractId, reason);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.terminate(reason);
            repository.persist(contract);
            contractsTerminated.incrementAndGet();

            // Record termination event
            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Contract terminated: %s", contractId);
            return new ContractStatusResult(
                    contractId,
                    ActiveContractStatus.TERMINATED,
                    contract.getTerminatedAt(),
                    reason
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Pause a contract
     */
    @Transactional
    public Uni<ContractStatusResult> pauseContract(String contractId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Pausing contract: %s", contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.pause();
            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Contract paused: %s", contractId);
            return new ContractStatusResult(
                    contractId,
                    ActiveContractStatus.PAUSED,
                    Instant.now(),
                    "Contract paused"
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Resume a paused contract
     */
    @Transactional
    public Uni<ContractStatusResult> resumeContract(String contractId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Resuming contract: %s", contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.resume();
            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Contract resumed: %s", contractId);
            return new ContractStatusResult(
                    contractId,
                    ActiveContractStatus.ACTIVE,
                    Instant.now(),
                    "Contract resumed"
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== PARTY MANAGEMENT ====================

    /**
     * Add a party to a contract
     */
    @Transactional
    public Uni<PartyManagementResult> addParty(String contractId, String partyAddress) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Adding party %s to contract %s", partyAddress, contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            int sizeBefore = contract.getParties().size();
            contract.addParty(partyAddress);
            contract.recordEvent();
            repository.persist(contract);

            boolean added = contract.getParties().size() > sizeBefore;
            if (added) {
                eventsRecorded.incrementAndGet();
            }

            LOG.infof("Party %s to contract %s", added ? "added" : "already exists in", contractId);
            return new PartyManagementResult(
                    contractId,
                    partyAddress,
                    added ? "ADDED" : "EXISTS",
                    contract.getParties(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove a party from a contract
     */
    @Transactional
    public Uni<PartyManagementResult> removeParty(String contractId, String partyAddress) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Removing party %s from contract %s", partyAddress, contractId);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            // Don't allow removing the creator
            if (partyAddress.equals(contract.getCreatorAddress())) {
                throw new IllegalArgumentException("Cannot remove contract creator");
            }

            int sizeBefore = contract.getParties().size();
            contract.removeParty(partyAddress);
            contract.recordEvent();
            repository.persist(contract);

            boolean removed = contract.getParties().size() < sizeBefore;
            if (removed) {
                eventsRecorded.incrementAndGet();
            }

            LOG.infof("Party %s from contract %s", removed ? "removed" : "not found in", contractId);
            return new PartyManagementResult(
                    contractId,
                    partyAddress,
                    removed ? "REMOVED" : "NOT_FOUND",
                    contract.getParties(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all parties in a contract
     */
    public Uni<List<String>> getParties(String contractId) {
        return Uni.createFrom().item(() -> {
            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));
            return List.copyOf(contract.getParties());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== EVENT MANAGEMENT ====================

    /**
     * Record a contract event
     */
    @Transactional
    public Uni<EventRecordResult> recordEvent(String contractId, String eventType, String eventData) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Recording event for contract %s: %s", contractId, eventType);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.recordEvent();
            repository.persist(contract);
            eventsRecorded.incrementAndGet();

            LOG.infof("Event recorded for contract %s", contractId);
            return new EventRecordResult(
                    contractId,
                    eventType,
                    eventData,
                    contract.getEventCount(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Record a contract execution
     */
    @Transactional
    public Uni<ExecutionRecordResult> recordExecution(String contractId, String executionStatus, String executionData) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Recording execution for contract %s: %s", contractId, executionStatus);

            ActiveContract contract = repository.findByContractId(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId));

            contract.recordExecution(executionStatus);
            repository.persist(contract);

            LOG.infof("Execution recorded for contract %s", contractId);
            return new ExecutionRecordResult(
                    contractId,
                    executionStatus,
                    executionData,
                    contract.getExecutionCount(),
                    contract.getLastExecutionAt()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get contract by ID
     */
    public Uni<ActiveContract> getContract(String contractId) {
        return Uni.createFrom().item(() ->
                repository.findByContractId(contractId)
                        .orElseThrow(() -> new IllegalArgumentException("Contract not found: " + contractId))
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * List contracts with pagination
     */
    public Uni<List<ActiveContract>> listContracts(int page, int size) {
        return Uni.createFrom().item(() -> {
            return repository.findAll()
                    .page(page, size)
                    .list();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by status
     */
    public Uni<List<ActiveContract>> getContractsByStatus(ActiveContractStatus status, int limit) {
        return Uni.createFrom().item(() -> {
            return repository.findByStatus(status)
                    .stream()
                    .limit(limit)
                    .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by party
     */
    public Uni<List<ActiveContract>> getContractsByParty(String partyAddress) {
        return Uni.createFrom().item(() -> {
            return repository.findByParty(partyAddress);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get active contracts by party
     */
    public Uni<List<ActiveContract>> getActiveContractsByParty(String partyAddress) {
        return Uni.createFrom().item(() -> {
            return repository.findActiveByParty(partyAddress);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get expired contracts
     */
    public Uni<List<ActiveContract>> getExpiredContracts() {
        return Uni.createFrom().item(() -> {
            return repository.findExpiredContracts();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts expiring soon
     */
    public Uni<List<ActiveContract>> getExpiringContracts(long secondsAhead) {
        return Uni.createFrom().item(() -> {
            Instant expiryThreshold = Instant.now().plusSeconds(secondsAhead);
            return repository.findExpiringBefore(expiryThreshold);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== STATISTICS ====================

    /**
     * Get service statistics
     */
    public Uni<Map<String, Object>> getStatistics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> stats = new HashMap<>();

            stats.put("contractsCreated", contractsCreated.get());
            stats.put("contractsActivated", contractsActivated.get());
            stats.put("contractsCompleted", contractsCompleted.get());
            stats.put("contractsTerminated", contractsTerminated.get());
            stats.put("eventsRecorded", eventsRecorded.get());

            ActiveContractRepository.ContractStatistics contractStats = repository.getStatistics();
            stats.put("contractStatistics", Map.of(
                    "totalContracts", contractStats.totalContracts(),
                    "pendingContracts", contractStats.pendingContracts(),
                    "activeContracts", contractStats.activeContracts(),
                    "pausedContracts", contractStats.pausedContracts(),
                    "completedContracts", contractStats.completedContracts(),
                    "terminatedContracts", contractStats.terminatedContracts(),
                    "totalExecutions", contractStats.totalExecutions(),
                    "totalEvents", contractStats.totalEvents()
            ));

            stats.put("timestamp", Instant.now());

            return stats;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== HELPER METHODS ====================

    private String generateContractId() {
        return "AC_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ==================== DATA MODELS ====================

    public record ContractCreationRequest(
            String name,
            String creatorAddress,
            String contractType,
            String description,
            String metadata,
            Instant expiresAt,
            List<String> parties,
            Boolean notificationEnabled,
            String notificationRecipients
    ) {}

    public record ContractStatusResult(
            String contractId,
            ActiveContractStatus status,
            Instant timestamp,
            String message
    ) {}

    public record PartyManagementResult(
            String contractId,
            String partyAddress,
            String action,
            List<String> currentParties,
            Instant timestamp
    ) {}

    public record EventRecordResult(
            String contractId,
            String eventType,
            String eventData,
            Long totalEvents,
            Instant timestamp
    ) {}

    public record ExecutionRecordResult(
            String contractId,
            String executionStatus,
            String executionData,
            Long totalExecutions,
            Instant timestamp
    ) {}
}
