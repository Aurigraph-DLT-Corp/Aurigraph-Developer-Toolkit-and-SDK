package io.aurigraph.v11.contracts.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.*;

/**
 * ContractVersion - Version control for ActiveContracts
 *
 * Implements Semantic Versioning (SemVer) for contract evolution:
 * - Major: Breaking changes (structure, parties, terms)
 * - Minor: Backward-compatible additions
 * - Patch: Bug fixes, clarifications
 *
 * Features:
 * - Full snapshot of contract state at version creation
 * - Change tracking with diffs
 * - Amendment workflow support
 * - Rollback capability
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
public class ContractVersion {

    @JsonProperty("versionId")
    private String versionId;

    @JsonProperty("contractId")
    private String contractId;

    // ==================== Version Numbers ====================

    @JsonProperty("major")
    private int major = 1;

    @JsonProperty("minor")
    private int minor = 0;

    @JsonProperty("patch")
    private int patch = 0;

    @JsonProperty("versionString")
    private String versionString = "1.0.0";

    @JsonProperty("label")
    private String label; // Optional label (e.g., "alpha", "beta", "final")

    // ==================== Version Metadata ====================

    @JsonProperty("description")
    private String description;

    @JsonProperty("changeType")
    private ChangeType changeType;

    @JsonProperty("changeSummary")
    private String changeSummary;

    @JsonProperty("changes")
    private List<VersionChange> changes = new ArrayList<>();

    // ==================== Snapshots ====================

    @JsonProperty("proseSnapshot")
    private ContractProse proseSnapshot;

    @JsonProperty("parametersSnapshot")
    private ContractParameters parametersSnapshot;

    @JsonProperty("programmingSnapshot")
    private ContractProgramming programmingSnapshot;

    @JsonProperty("proseHash")
    private String proseHash;

    @JsonProperty("parametersHash")
    private String parametersHash;

    @JsonProperty("programmingHash")
    private String programmingHash;

    @JsonProperty("combinedHash")
    private String combinedHash; // Hash of all three

    // ==================== Version State ====================

    @JsonProperty("status")
    private VersionStatus status = VersionStatus.DRAFT;

    @JsonProperty("previousVersionId")
    private String previousVersionId;

    @JsonProperty("parentVersionId")
    private String parentVersionId; // For amendments

    @JsonProperty("isAmendment")
    private boolean isAmendment = false;

    @JsonProperty("amendmentNumber")
    private int amendmentNumber;

    // ==================== Approval ====================

    @JsonProperty("createdBy")
    private String createdBy;

    @JsonProperty("approvedBy")
    private List<String> approvedBy = new ArrayList<>();

    @JsonProperty("approvalRequired")
    private List<String> approvalRequired = new ArrayList<>();

    @JsonProperty("approvedAt")
    private Instant approvedAt;

    // ==================== Timestamps ====================

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("publishedAt")
    private Instant publishedAt;

    @JsonProperty("effectiveAt")
    private Instant effectiveAt;

    @JsonProperty("supersededAt")
    private Instant supersededAt;

    @JsonProperty("archivedAt")
    private Instant archivedAt;

    // ==================== Metadata ====================

    @JsonProperty("metadata")
    private Map<String, String> metadata = new HashMap<>();

    @JsonProperty("tags")
    private List<String> tags = new ArrayList<>();

    // Default constructor
    public ContractVersion() {
        this.versionId = "VER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.createdAt = Instant.now();
    }

    // Constructor with contract ID
    public ContractVersion(String contractId) {
        this();
        this.contractId = contractId;
    }

    // Constructor with version numbers
    public ContractVersion(String contractId, int major, int minor, int patch) {
        this(contractId);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.versionString = String.format("%d.%d.%d", major, minor, patch);
    }

    // ==================== Nested Classes ====================

    /**
     * Individual change within a version
     */
    public static class VersionChange {
        @JsonProperty("changeId")
        private String changeId;

        @JsonProperty("section")
        private ContractSection section;

        @JsonProperty("changeType")
        private ChangeOperation changeType;

        @JsonProperty("path")
        private String path; // JSON path to changed element

        @JsonProperty("fieldName")
        private String fieldName;

        @JsonProperty("previousValue")
        private String previousValue;

        @JsonProperty("newValue")
        private String newValue;

        @JsonProperty("description")
        private String description;

        @JsonProperty("changedBy")
        private String changedBy;

        @JsonProperty("changedAt")
        private Instant changedAt;

        @JsonProperty("approved")
        private boolean approved = false;

        @JsonProperty("approvedBy")
        private String approvedBy;

        public VersionChange() {
            this.changeId = "CHG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            this.changedAt = Instant.now();
        }

        public VersionChange(ContractSection section, ChangeOperation changeType, String fieldName) {
            this();
            this.section = section;
            this.changeType = changeType;
            this.fieldName = fieldName;
        }

        // Getters and setters
        public String getChangeId() { return changeId; }
        public void setChangeId(String changeId) { this.changeId = changeId; }
        public ContractSection getSection() { return section; }
        public void setSection(ContractSection section) { this.section = section; }
        public ChangeOperation getChangeType() { return changeType; }
        public void setChangeType(ChangeOperation changeType) { this.changeType = changeType; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public String getFieldName() { return fieldName; }
        public void setFieldName(String fieldName) { this.fieldName = fieldName; }
        public String getPreviousValue() { return previousValue; }
        public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }
        public String getNewValue() { return newValue; }
        public void setNewValue(String newValue) { this.newValue = newValue; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getChangedBy() { return changedBy; }
        public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
        public Instant getChangedAt() { return changedAt; }
        public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
        public boolean isApproved() { return approved; }
        public void setApproved(boolean approved) { this.approved = approved; }
        public String getApprovedBy() { return approvedBy; }
        public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    }

    /**
     * Diff between two versions
     */
    public static class VersionDiff {
        @JsonProperty("fromVersion")
        private String fromVersion;

        @JsonProperty("toVersion")
        private String toVersion;

        @JsonProperty("changes")
        private List<VersionChange> changes = new ArrayList<>();

        @JsonProperty("proseChanged")
        private boolean proseChanged;

        @JsonProperty("parametersChanged")
        private boolean parametersChanged;

        @JsonProperty("programmingChanged")
        private boolean programmingChanged;

        @JsonProperty("additionCount")
        private int additionCount;

        @JsonProperty("modificationCount")
        private int modificationCount;

        @JsonProperty("deletionCount")
        private int deletionCount;

        @JsonProperty("generatedAt")
        private Instant generatedAt = Instant.now();

        // Getters and setters
        public String getFromVersion() { return fromVersion; }
        public void setFromVersion(String fromVersion) { this.fromVersion = fromVersion; }
        public String getToVersion() { return toVersion; }
        public void setToVersion(String toVersion) { this.toVersion = toVersion; }
        public List<VersionChange> getChanges() { return changes; }
        public void setChanges(List<VersionChange> changes) { this.changes = changes; }
        public boolean isProseChanged() { return proseChanged; }
        public void setProseChanged(boolean proseChanged) { this.proseChanged = proseChanged; }
        public boolean isParametersChanged() { return parametersChanged; }
        public void setParametersChanged(boolean parametersChanged) { this.parametersChanged = parametersChanged; }
        public boolean isProgrammingChanged() { return programmingChanged; }
        public void setProgrammingChanged(boolean programmingChanged) { this.programmingChanged = programmingChanged; }
        public int getAdditionCount() { return additionCount; }
        public void setAdditionCount(int additionCount) { this.additionCount = additionCount; }
        public int getModificationCount() { return modificationCount; }
        public void setModificationCount(int modificationCount) { this.modificationCount = modificationCount; }
        public int getDeletionCount() { return deletionCount; }
        public void setDeletionCount(int deletionCount) { this.deletionCount = deletionCount; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }

        public int getTotalChanges() {
            return additionCount + modificationCount + deletionCount;
        }
    }

    // ==================== Enums ====================

    public enum ChangeType {
        MAJOR,              // Breaking changes
        MINOR,              // Backward-compatible additions
        PATCH,              // Bug fixes/clarifications
        AMENDMENT,          // Formal amendment
        CORRECTION,         // Error correction
        INITIAL             // Initial version
    }

    public enum VersionStatus {
        DRAFT,              // Being edited
        PENDING_REVIEW,     // Awaiting review
        PENDING_APPROVAL,   // Awaiting approval
        APPROVED,           // Approved but not effective
        PUBLISHED,          // Published and effective
        SUPERSEDED,         // Replaced by newer version
        ARCHIVED,           // No longer active
        REJECTED            // Rejected during review
    }

    public enum ContractSection {
        PROSE,              // Legal text section
        PARAMETERS,         // Configuration section
        PROGRAMMING,        // Logic section
        METADATA,           // Metadata section
        ALL                 // Affects all sections
    }

    public enum ChangeOperation {
        ADD,                // New element added
        MODIFY,             // Existing element modified
        DELETE,             // Element removed
        MOVE,               // Element moved
        RENAME              // Element renamed
    }

    // ==================== Utility Methods ====================

    /**
     * Increment major version
     */
    public void incrementMajor() {
        this.major++;
        this.minor = 0;
        this.patch = 0;
        updateVersionString();
    }

    /**
     * Increment minor version
     */
    public void incrementMinor() {
        this.minor++;
        this.patch = 0;
        updateVersionString();
    }

    /**
     * Increment patch version
     */
    public void incrementPatch() {
        this.patch++;
        updateVersionString();
    }

    private void updateVersionString() {
        this.versionString = String.format("%d.%d.%d", major, minor, patch);
    }

    /**
     * Parse version string
     */
    public static ContractVersion fromVersionString(String versionString) {
        String[] parts = versionString.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid version string: " + versionString);
        }
        ContractVersion version = new ContractVersion();
        version.major = Integer.parseInt(parts[0]);
        version.minor = Integer.parseInt(parts[1]);
        version.patch = Integer.parseInt(parts[2]);
        version.versionString = versionString;
        return version;
    }

    /**
     * Compare versions
     */
    public int compareTo(ContractVersion other) {
        if (this.major != other.major) {
            return Integer.compare(this.major, other.major);
        }
        if (this.minor != other.minor) {
            return Integer.compare(this.minor, other.minor);
        }
        return Integer.compare(this.patch, other.patch);
    }

    /**
     * Check if this version is newer than another
     */
    public boolean isNewerThan(ContractVersion other) {
        return this.compareTo(other) > 0;
    }

    /**
     * Add a change record
     */
    public void addChange(ContractSection section, ChangeOperation operation, String fieldName,
                          String previousValue, String newValue, String description) {
        VersionChange change = new VersionChange(section, operation, fieldName);
        change.setPreviousValue(previousValue);
        change.setNewValue(newValue);
        change.setDescription(description);
        changes.add(change);
    }

    /**
     * Check if all required approvals are received
     */
    public boolean hasAllApprovals() {
        return approvedBy.containsAll(approvalRequired);
    }

    /**
     * Add approval
     */
    public void addApproval(String approver) {
        if (!approvedBy.contains(approver)) {
            approvedBy.add(approver);
        }
        if (hasAllApprovals()) {
            this.status = VersionStatus.APPROVED;
            this.approvedAt = Instant.now();
        }
    }

    /**
     * Publish the version
     */
    public void publish() {
        this.status = VersionStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        if (this.effectiveAt == null) {
            this.effectiveAt = Instant.now();
        }
    }

    /**
     * Supersede with a new version
     */
    public void supersede() {
        this.status = VersionStatus.SUPERSEDED;
        this.supersededAt = Instant.now();
    }

    /**
     * Archive the version
     */
    public void archive() {
        this.status = VersionStatus.ARCHIVED;
        this.archivedAt = Instant.now();
    }

    /**
     * Get change count by section
     */
    public int getChangeCountBySection(ContractSection section) {
        return (int) changes.stream()
            .filter(c -> c.getSection() == section)
            .count();
    }

    /**
     * Get change count by operation
     */
    public int getChangeCountByOperation(ChangeOperation operation) {
        return (int) changes.stream()
            .filter(c -> c.getChangeType() == operation)
            .count();
    }

    // ==================== Getters and Setters ====================

    public String getVersionId() { return versionId; }
    public void setVersionId(String versionId) { this.versionId = versionId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public int getMajor() { return major; }
    public void setMajor(int major) {
        this.major = major;
        updateVersionString();
    }

    public int getMinor() { return minor; }
    public void setMinor(int minor) {
        this.minor = minor;
        updateVersionString();
    }

    public int getPatch() { return patch; }
    public void setPatch(int patch) {
        this.patch = patch;
        updateVersionString();
    }

    public String getVersionString() { return versionString; }
    public void setVersionString(String versionString) { this.versionString = versionString; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ChangeType getChangeType() { return changeType; }
    public void setChangeType(ChangeType changeType) { this.changeType = changeType; }

    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }

    public List<VersionChange> getChanges() { return changes; }
    public void setChanges(List<VersionChange> changes) { this.changes = changes; }

    public ContractProse getProseSnapshot() { return proseSnapshot; }
    public void setProseSnapshot(ContractProse proseSnapshot) { this.proseSnapshot = proseSnapshot; }

    public ContractParameters getParametersSnapshot() { return parametersSnapshot; }
    public void setParametersSnapshot(ContractParameters parametersSnapshot) { this.parametersSnapshot = parametersSnapshot; }

    public ContractProgramming getProgrammingSnapshot() { return programmingSnapshot; }
    public void setProgrammingSnapshot(ContractProgramming programmingSnapshot) { this.programmingSnapshot = programmingSnapshot; }

    public String getProseHash() { return proseHash; }
    public void setProseHash(String proseHash) { this.proseHash = proseHash; }

    public String getParametersHash() { return parametersHash; }
    public void setParametersHash(String parametersHash) { this.parametersHash = parametersHash; }

    public String getProgrammingHash() { return programmingHash; }
    public void setProgrammingHash(String programmingHash) { this.programmingHash = programmingHash; }

    public String getCombinedHash() { return combinedHash; }
    public void setCombinedHash(String combinedHash) { this.combinedHash = combinedHash; }

    public VersionStatus getStatus() { return status; }
    public void setStatus(VersionStatus status) { this.status = status; }

    public String getPreviousVersionId() { return previousVersionId; }
    public void setPreviousVersionId(String previousVersionId) { this.previousVersionId = previousVersionId; }

    public String getParentVersionId() { return parentVersionId; }
    public void setParentVersionId(String parentVersionId) { this.parentVersionId = parentVersionId; }

    public boolean isAmendment() { return isAmendment; }
    public void setAmendment(boolean amendment) { isAmendment = amendment; }

    public int getAmendmentNumber() { return amendmentNumber; }
    public void setAmendmentNumber(int amendmentNumber) { this.amendmentNumber = amendmentNumber; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public List<String> getApprovedBy() { return approvedBy; }
    public void setApprovedBy(List<String> approvedBy) { this.approvedBy = approvedBy; }

    public List<String> getApprovalRequired() { return approvalRequired; }
    public void setApprovalRequired(List<String> approvalRequired) { this.approvalRequired = approvalRequired; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }

    public Instant getEffectiveAt() { return effectiveAt; }
    public void setEffectiveAt(Instant effectiveAt) { this.effectiveAt = effectiveAt; }

    public Instant getSupersededAt() { return supersededAt; }
    public void setSupersededAt(Instant supersededAt) { this.supersededAt = supersededAt; }

    public Instant getArchivedAt() { return archivedAt; }
    public void setArchivedAt(Instant archivedAt) { this.archivedAt = archivedAt; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    @Override
    public String toString() {
        return String.format("ContractVersion{id='%s', contractId='%s', version='%s', status=%s, changes=%d}",
            versionId, contractId, versionString, status, changes.size());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ContractVersion that = (ContractVersion) o;
        return Objects.equals(versionId, that.versionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(versionId);
    }
}
