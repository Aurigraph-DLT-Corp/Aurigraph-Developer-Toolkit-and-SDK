package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import io.aurigraph.v11.contracts.models.ContractVersion.ChangeType;
import io.aurigraph.v11.contracts.models.ContractVersion.VersionDiff;
import io.aurigraph.v11.contracts.models.ContractVersion.VersionChange;
import io.aurigraph.v11.contracts.models.ContractVersion.ContractSection;
import io.aurigraph.v11.contracts.models.ContractVersion.ChangeOperation;
import io.aurigraph.v11.contracts.models.ContractVersion.VersionStatus;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * ContractVersionService - Version Control System for ActiveContracts
 *
 * Implements Semantic Versioning (SemVer) with:
 * - Major: Breaking changes to contract structure
 * - Minor: Backward-compatible additions
 * - Patch: Bug fixes and clarifications
 *
 * Features:
 * - Full version history tracking
 * - Diff generation between versions
 * - Rollback capability to any previous version
 * - Amendment workflow support
 * - Snapshot storage of contract state at each version
 *
 * @version 12.0.0
 * @author J4C Development Agent - Sprint 3
 */
@ApplicationScoped
public class ContractVersionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ContractVersionService.class);

    @Inject
    ActiveContractService contractService;

    // In-memory storage for versions (will be migrated to LevelDB)
    private final Map<String, List<ContractVersion>> contractVersions = new ConcurrentHashMap<>();
    private final Map<String, ContractVersion> versionById = new ConcurrentHashMap<>();

    // Virtual thread executor for async operations
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ==================== Core Version Management ====================

    /**
     * Create a new version for a contract
     *
     * @param contractId Contract ID
     * @param description Version description
     * @param changeType Type of change (MAJOR, MINOR, PATCH, AMENDMENT, etc.)
     * @return Created version
     */
    public Uni<ContractVersion> createVersion(String contractId, String description, ChangeType changeType) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Creating version for contract: {} with changeType: {}", contractId, changeType);

                // Get current version or create initial
                ContractVersion currentVersion = contract.getCurrentVersion();
                ContractVersion newVersion = new ContractVersion(contractId);

                // Set version numbers based on change type
                if (currentVersion != null) {
                    newVersion.setMajor(currentVersion.getMajor());
                    newVersion.setMinor(currentVersion.getMinor());
                    newVersion.setPatch(currentVersion.getPatch());
                    newVersion.setPreviousVersionId(currentVersion.getVersionId());

                    // Supersede the previous version
                    currentVersion.supersede();
                    versionById.put(currentVersion.getVersionId(), currentVersion);

                    // Increment based on change type
                    switch (changeType) {
                        case MAJOR -> newVersion.incrementMajor();
                        case MINOR -> newVersion.incrementMinor();
                        case PATCH, CORRECTION -> newVersion.incrementPatch();
                        case AMENDMENT -> {
                            newVersion.incrementMinor();
                            newVersion.setAmendment(true);
                            int amendmentCount = countAmendments(contractId) + 1;
                            newVersion.setAmendmentNumber(amendmentCount);
                            newVersion.setParentVersionId(currentVersion.getVersionId());
                        }
                        case INITIAL -> {} // Keep as 1.0.0
                    }
                } else {
                    // First version
                    newVersion.setMajor(1);
                    newVersion.setMinor(0);
                    newVersion.setPatch(0);
                }

                // Set metadata
                newVersion.setDescription(description);
                newVersion.setChangeType(changeType);
                newVersion.setStatus(VersionStatus.DRAFT);

                // Create snapshots of current contract state
                createSnapshots(newVersion, contract);

                // Calculate hashes
                calculateHashes(newVersion);

                // Detect changes if there's a previous version
                if (currentVersion != null) {
                    detectChanges(newVersion, currentVersion);
                }

                // Store version
                storeVersion(contractId, newVersion);

                // Update contract with new version
                contract.getVersions().add(newVersion);
                contract.setCurrentVersion(newVersion);

                LOGGER.info("Version {} created for contract: {}", newVersion.getVersionString(), contractId);
                return newVersion;
            })
            .runSubscriptionOn(executor);
    }

    /**
     * Get all versions for a contract
     *
     * @param contractId Contract ID
     * @return List of versions sorted by version number (newest first)
     */
    public Uni<List<ContractVersion>> getVersions(String contractId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Getting versions for contract: {}", contractId);

            List<ContractVersion> versions = contractVersions.get(contractId);
            if (versions == null || versions.isEmpty()) {
                // Try to get from contract
                return contractService.getContract(contractId)
                    .await().indefinitely()
                    .getVersions();
            }

            // Sort by version number (newest first)
            return versions.stream()
                .sorted((v1, v2) -> v2.compareTo(v1))
                .collect(Collectors.toList());
        }).runSubscriptionOn(executor);
    }

    /**
     * Get a specific version of a contract
     *
     * @param contractId Contract ID
     * @param versionString Version string (e.g., "1.2.3")
     * @return Specific version
     */
    public Uni<ContractVersion> getVersion(String contractId, String versionString) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Getting version {} for contract: {}", versionString, contractId);

            List<ContractVersion> versions = contractVersions.get(contractId);
            if (versions == null) {
                versions = contractService.getContract(contractId)
                    .await().indefinitely()
                    .getVersions();
            }

            return versions.stream()
                .filter(v -> versionString.equals(v.getVersionString()))
                .findFirst()
                .orElseThrow(() -> new VersionNotFoundException(
                    String.format("Version %s not found for contract %s", versionString, contractId)));
        }).runSubscriptionOn(executor);
    }

    /**
     * Compare two versions and generate a diff
     *
     * @param contractId Contract ID
     * @param fromVersion From version string
     * @param toVersion To version string
     * @return Version diff with detailed changes
     */
    public Uni<VersionDiff> compareVersions(String contractId, String fromVersion, String toVersion) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Comparing versions {} -> {} for contract: {}", fromVersion, toVersion, contractId);

            ContractVersion from = getVersion(contractId, fromVersion).await().indefinitely();
            ContractVersion to = getVersion(contractId, toVersion).await().indefinitely();

            return generateDiff(from, to);
        }).runSubscriptionOn(executor);
    }

    /**
     * Rollback contract to a previous version
     *
     * @param contractId Contract ID
     * @param toVersion Target version string to rollback to
     * @return New version created from rollback
     */
    public Uni<ContractVersion> rollback(String contractId, String toVersion) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Rolling back contract {} to version {}", contractId, toVersion);

            // Get the target version
            ContractVersion targetVersion = getVersion(contractId, toVersion).await().indefinitely();

            // Get the current contract
            ActiveContract contract = contractService.getContract(contractId).await().indefinitely();

            // Restore snapshots from target version
            if (targetVersion.getProseSnapshot() != null) {
                contract.setProse(targetVersion.getProseSnapshot());
            }
            if (targetVersion.getParametersSnapshot() != null) {
                contract.setParameters(targetVersion.getParametersSnapshot());
            }
            if (targetVersion.getProgrammingSnapshot() != null) {
                contract.setProgramming(targetVersion.getProgrammingSnapshot());
            }

            // Create a new version for the rollback
            ContractVersion rollbackVersion = new ContractVersion(contractId);
            ContractVersion currentVersion = contract.getCurrentVersion();

            if (currentVersion != null) {
                rollbackVersion.setMajor(currentVersion.getMajor());
                rollbackVersion.setMinor(currentVersion.getMinor());
                rollbackVersion.setPatch(currentVersion.getPatch() + 1);
                rollbackVersion.setPreviousVersionId(currentVersion.getVersionId());
                currentVersion.supersede();
            }

            rollbackVersion.setDescription(String.format("Rollback to version %s", toVersion));
            rollbackVersion.setChangeType(ChangeType.PATCH);
            rollbackVersion.setStatus(VersionStatus.DRAFT);
            rollbackVersion.getMetadata().put("rollbackFrom", currentVersion != null ?
                currentVersion.getVersionString() : "none");
            rollbackVersion.getMetadata().put("rollbackTo", toVersion);

            // Create snapshots
            createSnapshots(rollbackVersion, contract);
            calculateHashes(rollbackVersion);

            // Add rollback as a change
            VersionChange rollbackChange = new VersionChange();
            rollbackChange.setSection(ContractSection.ALL);
            rollbackChange.setChangeType(ChangeOperation.MODIFY);
            rollbackChange.setFieldName("contract");
            rollbackChange.setDescription(String.format("Rolled back from %s to %s",
                currentVersion != null ? currentVersion.getVersionString() : "initial", toVersion));
            rollbackChange.setPreviousValue(currentVersion != null ? currentVersion.getVersionString() : "initial");
            rollbackChange.setNewValue(toVersion);
            rollbackVersion.getChanges().add(rollbackChange);

            // Store version
            storeVersion(contractId, rollbackVersion);

            // Update contract
            contract.getVersions().add(rollbackVersion);
            contract.setCurrentVersion(rollbackVersion);
            contract.setUpdatedAt(Instant.now());
            contract.addAuditEntry(String.format("Rolled back to version %s at %s", toVersion, Instant.now()));

            LOGGER.info("Rollback completed. New version: {}", rollbackVersion.getVersionString());
            return rollbackVersion;
        }).runSubscriptionOn(executor);
    }

    /**
     * Create an amendment from an existing contract version
     *
     * @param contractId Contract ID
     * @param description Amendment description
     * @return Created amendment version
     */
    public Uni<ContractVersion> createAmendment(String contractId, String description) {
        return createVersion(contractId, description, ChangeType.AMENDMENT);
    }

    /**
     * Publish a version (make it effective)
     *
     * @param contractId Contract ID
     * @param versionString Version to publish
     * @return Published version
     */
    public Uni<ContractVersion> publishVersion(String contractId, String versionString) {
        return getVersion(contractId, versionString)
            .map(version -> {
                LOGGER.info("Publishing version {} for contract: {}", versionString, contractId);

                if (version.getStatus() == VersionStatus.PUBLISHED) {
                    throw new VersionValidationException("Version is already published");
                }

                version.publish();
                versionById.put(version.getVersionId(), version);

                // Update in list
                List<ContractVersion> versions = contractVersions.get(contractId);
                if (versions != null) {
                    versions.removeIf(v -> v.getVersionId().equals(version.getVersionId()));
                    versions.add(version);
                }

                LOGGER.info("Version {} published for contract: {}", versionString, contractId);
                return version;
            })
            .runSubscriptionOn(executor);
    }

    /**
     * Approve a version
     *
     * @param contractId Contract ID
     * @param versionString Version to approve
     * @param approver Approver ID
     * @return Updated version
     */
    public Uni<ContractVersion> approveVersion(String contractId, String versionString, String approver) {
        return getVersion(contractId, versionString)
            .map(version -> {
                LOGGER.info("Approving version {} by {} for contract: {}", versionString, approver, contractId);

                version.addApproval(approver);
                versionById.put(version.getVersionId(), version);

                LOGGER.info("Version {} approved by {} for contract: {}", versionString, approver, contractId);
                return version;
            })
            .runSubscriptionOn(executor);
    }

    /**
     * Get version by ID
     *
     * @param versionId Version ID
     * @return Version
     */
    public Uni<ContractVersion> getVersionById(String versionId) {
        return Uni.createFrom().item(() -> {
            ContractVersion version = versionById.get(versionId);
            if (version == null) {
                throw new VersionNotFoundException("Version not found: " + versionId);
            }
            return version;
        });
    }

    /**
     * Get amendment history for a contract
     *
     * @param contractId Contract ID
     * @return List of amendment versions
     */
    public Uni<List<ContractVersion>> getAmendments(String contractId) {
        return getVersions(contractId)
            .map(versions -> versions.stream()
                .filter(ContractVersion::isAmendment)
                .sorted(Comparator.comparingInt(ContractVersion::getAmendmentNumber))
                .collect(Collectors.toList())
            );
    }

    // ==================== Private Helper Methods ====================

    private void createSnapshots(ContractVersion version, ActiveContract contract) {
        // Deep copy snapshots of current contract state
        version.setProseSnapshot(contract.getProse());
        version.setParametersSnapshot(contract.getParameters());
        version.setProgrammingSnapshot(contract.getProgramming());
    }

    private void calculateHashes(ContractVersion version) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // Hash prose
            if (version.getProseSnapshot() != null) {
                String proseContent = version.getProseSnapshot().getFullText();
                version.setProseHash(bytesToHex(digest.digest(proseContent.getBytes())));
            }

            // Hash parameters
            if (version.getParametersSnapshot() != null) {
                String paramContent = version.getParametersSnapshot().toString();
                version.setParametersHash(bytesToHex(digest.digest(paramContent.getBytes())));
            }

            // Hash programming
            if (version.getProgrammingSnapshot() != null) {
                String progContent = version.getProgrammingSnapshot().toString();
                version.setProgrammingHash(bytesToHex(digest.digest(progContent.getBytes())));
            }

            // Combined hash
            String combined = (version.getProseHash() != null ? version.getProseHash() : "") +
                             (version.getParametersHash() != null ? version.getParametersHash() : "") +
                             (version.getProgrammingHash() != null ? version.getProgrammingHash() : "");
            version.setCombinedHash(bytesToHex(digest.digest(combined.getBytes())));

        } catch (NoSuchAlgorithmException e) {
            LOGGER.error("Hash calculation failed: {}", e.getMessage());
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void detectChanges(ContractVersion newVersion, ContractVersion oldVersion) {
        List<VersionChange> changes = new ArrayList<>();

        // Compare prose
        if (proseChanged(newVersion.getProseSnapshot(), oldVersion.getProseSnapshot())) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PROSE);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("prose");
            change.setDescription("Legal text modified");
            change.setPreviousValue(oldVersion.getProseHash());
            change.setNewValue(newVersion.getProseHash());
            changes.add(change);
        }

        // Compare parameters
        if (parametersChanged(newVersion.getParametersSnapshot(), oldVersion.getParametersSnapshot())) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PARAMETERS);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("parameters");
            change.setDescription("Contract parameters modified");
            change.setPreviousValue(oldVersion.getParametersHash());
            change.setNewValue(newVersion.getParametersHash());
            changes.add(change);
        }

        // Compare programming
        if (programmingChanged(newVersion.getProgrammingSnapshot(), oldVersion.getProgrammingSnapshot())) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PROGRAMMING);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("programming");
            change.setDescription("Contract programming logic modified");
            change.setPreviousValue(oldVersion.getProgrammingHash());
            change.setNewValue(newVersion.getProgrammingHash());
            changes.add(change);
        }

        newVersion.setChanges(changes);

        // Generate change summary
        if (!changes.isEmpty()) {
            String summary = changes.stream()
                .map(c -> c.getSection().name())
                .distinct()
                .collect(Collectors.joining(", "));
            newVersion.setChangeSummary("Modified: " + summary);
        }
    }

    private boolean proseChanged(ContractProse newProse, ContractProse oldProse) {
        if (newProse == null && oldProse == null) return false;
        if (newProse == null || oldProse == null) return true;
        return !Objects.equals(newProse.getFullText(), oldProse.getFullText());
    }

    private boolean parametersChanged(ContractParameters newParams, ContractParameters oldParams) {
        if (newParams == null && oldParams == null) return false;
        if (newParams == null || oldParams == null) return true;
        return !Objects.equals(newParams.toString(), oldParams.toString());
    }

    private boolean programmingChanged(ContractProgramming newProg, ContractProgramming oldProg) {
        if (newProg == null && oldProg == null) return false;
        if (newProg == null || oldProg == null) return true;
        return !Objects.equals(newProg.toString(), oldProg.toString());
    }

    private VersionDiff generateDiff(ContractVersion from, ContractVersion to) {
        VersionDiff diff = new VersionDiff();
        diff.setFromVersion(from.getVersionString());
        diff.setToVersion(to.getVersionString());

        List<VersionChange> changes = new ArrayList<>();

        // Compare prose
        boolean proseChanged = !Objects.equals(from.getProseHash(), to.getProseHash());
        diff.setProseChanged(proseChanged);
        if (proseChanged) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PROSE);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("prose");
            change.setDescription("Legal text changed");
            change.setPreviousValue(from.getProseHash());
            change.setNewValue(to.getProseHash());
            changes.add(change);
        }

        // Compare parameters
        boolean paramsChanged = !Objects.equals(from.getParametersHash(), to.getParametersHash());
        diff.setParametersChanged(paramsChanged);
        if (paramsChanged) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PARAMETERS);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("parameters");
            change.setDescription("Parameters changed");
            change.setPreviousValue(from.getParametersHash());
            change.setNewValue(to.getParametersHash());
            changes.add(change);
        }

        // Compare programming
        boolean progChanged = !Objects.equals(from.getProgrammingHash(), to.getProgrammingHash());
        diff.setProgrammingChanged(progChanged);
        if (progChanged) {
            VersionChange change = new VersionChange();
            change.setSection(ContractSection.PROGRAMMING);
            change.setChangeType(ChangeOperation.MODIFY);
            change.setFieldName("programming");
            change.setDescription("Programming logic changed");
            change.setPreviousValue(from.getProgrammingHash());
            change.setNewValue(to.getProgrammingHash());
            changes.add(change);
        }

        diff.setChanges(changes);

        // Count changes by type
        int additions = 0;
        int modifications = 0;
        int deletions = 0;
        for (VersionChange change : changes) {
            switch (change.getChangeType()) {
                case ADD -> additions++;
                case MODIFY -> modifications++;
                case DELETE -> deletions++;
                default -> {}
            }
        }
        diff.setAdditionCount(additions);
        diff.setModificationCount(modifications);
        diff.setDeletionCount(deletions);

        return diff;
    }

    private void storeVersion(String contractId, ContractVersion version) {
        versionById.put(version.getVersionId(), version);
        contractVersions.computeIfAbsent(contractId, k -> new ArrayList<>()).add(version);
    }

    private int countAmendments(String contractId) {
        List<ContractVersion> versions = contractVersions.get(contractId);
        if (versions == null) return 0;
        return (int) versions.stream().filter(ContractVersion::isAmendment).count();
    }

    // ==================== Exception Classes ====================

    public static class VersionNotFoundException extends RuntimeException {
        public VersionNotFoundException(String message) {
            super(message);
        }
    }

    public static class VersionValidationException extends RuntimeException {
        public VersionValidationException(String message) {
            super(message);
        }
    }
}
