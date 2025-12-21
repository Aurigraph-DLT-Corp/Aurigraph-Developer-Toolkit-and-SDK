package io.aurigraph.v11.consensus.dag;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * DAG Node for Transaction Ordering
 * Sprint 5: Performance Optimization - DAG-Based Transaction Ordering
 *
 * Represents a transaction node in the DAG (Directed Acyclic Graph) with:
 * - Parent references for establishing order dependencies
 * - Timestamp and validation status tracking
 * - Cumulative weight calculation for finality
 * - Thread-safe operations for parallel processing
 *
 * Performance Target: Support 5M TPS with <100ms finality
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
public class DAGNode implements Comparable<DAGNode> {

    // Node identity
    private final String transactionId;
    private final byte[] transactionData;
    private final Instant timestamp;
    private final String sender;
    private final long nonce;

    // DAG structure - parent references
    private final Set<String> parentIds;
    private final Set<DAGNode> parents;
    private final Set<DAGNode> children;

    // Read/Write sets for conflict detection
    private final Set<String> readSet;
    private final Set<String> writeSet;

    // Validation state
    private final AtomicReference<ValidationStatus> validationStatus;
    private volatile byte[] signature;
    private volatile String validatorId;
    private volatile Instant validationTimestamp;

    // Weight and ordering
    private final AtomicLong cumulativeWeight;
    private final AtomicInteger depth;
    private volatile boolean finalized;
    private volatile Instant finalityTimestamp;

    // Metrics
    private volatile long creationTimeNanos;
    private volatile long validationTimeNanos;
    private volatile long finalizationTimeNanos;

    /**
     * Validation status for the DAG node
     */
    public enum ValidationStatus {
        PENDING,       // Not yet validated
        VALIDATING,    // Currently being validated
        VALID,         // Successfully validated
        INVALID,       // Failed validation
        CONFLICTING,   // Has conflicts with other transactions
        FINALIZED      // Finalized and committed
    }

    /**
     * Builder for DAGNode with fluent API
     */
    public static class Builder {
        private String transactionId;
        private byte[] transactionData = new byte[0];
        private Instant timestamp = Instant.now();
        private String sender = "";
        private long nonce = 0L;
        private Set<String> parentIds = new HashSet<>();
        private Set<String> readSet = new HashSet<>();
        private Set<String> writeSet = new HashSet<>();
        private byte[] signature = null;

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public Builder transactionData(byte[] data) {
            this.transactionData = data != null ? data.clone() : new byte[0];
            return this;
        }

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp != null ? timestamp : Instant.now();
            return this;
        }

        public Builder sender(String sender) {
            this.sender = sender != null ? sender : "";
            return this;
        }

        public Builder nonce(long nonce) {
            this.nonce = nonce;
            return this;
        }

        public Builder parentIds(Set<String> parentIds) {
            this.parentIds = parentIds != null ? new HashSet<>(parentIds) : new HashSet<>();
            return this;
        }

        public Builder addParentId(String parentId) {
            if (parentId != null) {
                this.parentIds.add(parentId);
            }
            return this;
        }

        public Builder readSet(Set<String> readSet) {
            this.readSet = readSet != null ? new HashSet<>(readSet) : new HashSet<>();
            return this;
        }

        public Builder writeSet(Set<String> writeSet) {
            this.writeSet = writeSet != null ? new HashSet<>(writeSet) : new HashSet<>();
            return this;
        }

        public Builder addRead(String address) {
            if (address != null) {
                this.readSet.add(address);
            }
            return this;
        }

        public Builder addWrite(String address) {
            if (address != null) {
                this.writeSet.add(address);
            }
            return this;
        }

        public Builder signature(byte[] signature) {
            this.signature = signature != null ? signature.clone() : null;
            return this;
        }

        public DAGNode build() {
            if (transactionId == null || transactionId.isEmpty()) {
                throw new IllegalArgumentException("Transaction ID is required");
            }
            return new DAGNode(this);
        }
    }

    private DAGNode(Builder builder) {
        this.transactionId = builder.transactionId;
        this.transactionData = builder.transactionData;
        this.timestamp = builder.timestamp;
        this.sender = builder.sender;
        this.nonce = builder.nonce;
        this.parentIds = ConcurrentHashMap.newKeySet();
        this.parentIds.addAll(builder.parentIds);
        this.parents = ConcurrentHashMap.newKeySet();
        this.children = ConcurrentHashMap.newKeySet();
        this.readSet = ConcurrentHashMap.newKeySet();
        this.readSet.addAll(builder.readSet);
        this.writeSet = ConcurrentHashMap.newKeySet();
        this.writeSet.addAll(builder.writeSet);
        this.signature = builder.signature;

        this.validationStatus = new AtomicReference<>(ValidationStatus.PENDING);
        this.cumulativeWeight = new AtomicLong(1L); // Initial weight of 1
        this.depth = new AtomicInteger(0);
        this.finalized = false;

        this.creationTimeNanos = System.nanoTime();
    }

    /**
     * Static factory method for creating a new builder
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Create a genesis node (no parents)
     */
    public static DAGNode createGenesisNode(String transactionId, byte[] data) {
        return builder()
            .transactionId(transactionId)
            .transactionData(data)
            .timestamp(Instant.EPOCH)
            .build();
    }

    // Getters

    public String getTransactionId() {
        return transactionId;
    }

    public byte[] getTransactionData() {
        return transactionData.clone();
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getSender() {
        return sender;
    }

    public long getNonce() {
        return nonce;
    }

    public Set<String> getParentIds() {
        return Collections.unmodifiableSet(new HashSet<>(parentIds));
    }

    public Set<DAGNode> getParents() {
        return Collections.unmodifiableSet(new HashSet<>(parents));
    }

    public Set<DAGNode> getChildren() {
        return Collections.unmodifiableSet(new HashSet<>(children));
    }

    public Set<String> getReadSet() {
        return Collections.unmodifiableSet(new HashSet<>(readSet));
    }

    public Set<String> getWriteSet() {
        return Collections.unmodifiableSet(new HashSet<>(writeSet));
    }

    public ValidationStatus getValidationStatus() {
        return validationStatus.get();
    }

    public byte[] getSignature() {
        return signature != null ? signature.clone() : null;
    }

    public String getValidatorId() {
        return validatorId;
    }

    public Instant getValidationTimestamp() {
        return validationTimestamp;
    }

    public long getCumulativeWeight() {
        return cumulativeWeight.get();
    }

    public int getDepth() {
        return depth.get();
    }

    public boolean isFinalized() {
        return finalized;
    }

    public Instant getFinalityTimestamp() {
        return finalityTimestamp;
    }

    // Parent/Child management

    /**
     * Add a parent node and establish bidirectional link
     */
    public void addParent(DAGNode parent) {
        if (parent != null && !parent.getTransactionId().equals(this.transactionId)) {
            parentIds.add(parent.getTransactionId());
            parents.add(parent);
            parent.children.add(this);

            // Update depth
            int parentDepth = parent.getDepth();
            depth.updateAndGet(current -> Math.max(current, parentDepth + 1));
        }
    }

    /**
     * Remove a parent node
     */
    public void removeParent(DAGNode parent) {
        if (parent != null) {
            parentIds.remove(parent.getTransactionId());
            parents.remove(parent);
            parent.children.remove(this);
        }
    }

    /**
     * Check if this node has a specific parent
     */
    public boolean hasParent(String parentId) {
        return parentIds.contains(parentId);
    }

    /**
     * Check if this node has any parents
     */
    public boolean hasParents() {
        return !parentIds.isEmpty();
    }

    /**
     * Get the number of parents
     */
    public int getParentCount() {
        return parentIds.size();
    }

    /**
     * Get the number of children
     */
    public int getChildCount() {
        return children.size();
    }

    // Validation operations

    /**
     * Set validation status atomically
     * @return true if status was updated, false if already in target state
     */
    public boolean setValidationStatus(ValidationStatus expected, ValidationStatus newStatus) {
        return validationStatus.compareAndSet(expected, newStatus);
    }

    /**
     * Force set validation status
     */
    public void forceValidationStatus(ValidationStatus newStatus) {
        validationStatus.set(newStatus);
    }

    /**
     * Mark as validated
     */
    public boolean markValidated(String validatorId, byte[] signature) {
        if (validationStatus.compareAndSet(ValidationStatus.VALIDATING, ValidationStatus.VALID)) {
            this.validatorId = validatorId;
            this.signature = signature != null ? signature.clone() : null;
            this.validationTimestamp = Instant.now();
            this.validationTimeNanos = System.nanoTime();
            return true;
        }
        return false;
    }

    /**
     * Mark as invalid
     */
    public boolean markInvalid(String reason) {
        ValidationStatus current = validationStatus.get();
        if (current == ValidationStatus.PENDING || current == ValidationStatus.VALIDATING) {
            validationStatus.set(ValidationStatus.INVALID);
            this.validationTimestamp = Instant.now();
            return true;
        }
        return false;
    }

    /**
     * Mark as conflicting
     */
    public boolean markConflicting() {
        ValidationStatus current = validationStatus.get();
        if (current != ValidationStatus.FINALIZED) {
            validationStatus.set(ValidationStatus.CONFLICTING);
            return true;
        }
        return false;
    }

    /**
     * Check if the node is valid (validated and not conflicting)
     */
    public boolean isValid() {
        ValidationStatus status = validationStatus.get();
        return status == ValidationStatus.VALID || status == ValidationStatus.FINALIZED;
    }

    /**
     * Check if the node is ready for processing
     */
    public boolean isReady() {
        return validationStatus.get() == ValidationStatus.PENDING;
    }

    // Weight and finality operations

    /**
     * Add to cumulative weight
     * Weight increases as more children reference this node
     */
    public long addWeight(long weight) {
        return cumulativeWeight.addAndGet(weight);
    }

    /**
     * Calculate and update weight based on children
     * Recursive calculation using path compression
     */
    public long calculateCumulativeWeight() {
        long weight = 1L; // Self weight

        for (DAGNode child : children) {
            weight += child.getCumulativeWeight();
        }

        cumulativeWeight.set(weight);
        return weight;
    }

    /**
     * Check if this node can be finalized
     * A node can be finalized when:
     * 1. It is validated
     * 2. All parents are finalized
     * 3. Cumulative weight exceeds threshold
     */
    public boolean canFinalize(long weightThreshold) {
        if (finalized) {
            return false; // Already finalized
        }

        if (validationStatus.get() != ValidationStatus.VALID) {
            return false; // Not validated
        }

        // Check if all parents are finalized
        for (DAGNode parent : parents) {
            if (!parent.isFinalized()) {
                return false;
            }
        }

        // Check weight threshold
        return cumulativeWeight.get() >= weightThreshold;
    }

    /**
     * Finalize this node
     */
    public boolean finalize(long finalityWeight) {
        if (!finalized && validationStatus.compareAndSet(ValidationStatus.VALID, ValidationStatus.FINALIZED)) {
            this.finalized = true;
            this.finalityTimestamp = Instant.now();
            this.finalizationTimeNanos = System.nanoTime();
            this.cumulativeWeight.set(finalityWeight);
            return true;
        }
        return false;
    }

    // Conflict detection

    /**
     * Check if this node conflicts with another node
     * Conflict exists if:
     * - Write-Write: Both write to same address
     * - Read-Write: One reads, other writes to same address
     */
    public boolean conflictsWith(DAGNode other) {
        if (other == null || other.getTransactionId().equals(this.transactionId)) {
            return false;
        }

        // Check write-write conflicts
        for (String addr : writeSet) {
            if (other.writeSet.contains(addr)) {
                return true;
            }
        }

        // Check read-write conflicts (this reads, other writes)
        for (String addr : readSet) {
            if (other.writeSet.contains(addr)) {
                return true;
            }
        }

        // Check write-read conflicts (this writes, other reads)
        for (String addr : writeSet) {
            if (other.readSet.contains(addr)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if this node has any address overlap with another
     */
    public boolean hasAddressOverlap(DAGNode other) {
        if (other == null) {
            return false;
        }

        Set<String> allAddresses = new HashSet<>();
        allAddresses.addAll(readSet);
        allAddresses.addAll(writeSet);

        for (String addr : other.readSet) {
            if (allAddresses.contains(addr)) {
                return true;
            }
        }

        for (String addr : other.writeSet) {
            if (allAddresses.contains(addr)) {
                return true;
            }
        }

        return false;
    }

    // Metrics

    /**
     * Get time from creation to validation in nanoseconds
     */
    public long getValidationLatencyNanos() {
        if (validationTimeNanos == 0) {
            return -1;
        }
        return validationTimeNanos - creationTimeNanos;
    }

    /**
     * Get time from creation to finalization in nanoseconds
     */
    public long getFinalizationLatencyNanos() {
        if (finalizationTimeNanos == 0) {
            return -1;
        }
        return finalizationTimeNanos - creationTimeNanos;
    }

    /**
     * Get time from creation to finalization in milliseconds
     */
    public double getFinalizationLatencyMs() {
        long nanos = getFinalizationLatencyNanos();
        return nanos >= 0 ? nanos / 1_000_000.0 : -1.0;
    }

    // Comparable implementation for priority queue ordering

    @Override
    public int compareTo(DAGNode other) {
        // Primary: by timestamp (earlier first)
        int timeCompare = this.timestamp.compareTo(other.timestamp);
        if (timeCompare != 0) {
            return timeCompare;
        }

        // Secondary: by depth (shallower first)
        int depthCompare = Integer.compare(this.depth.get(), other.depth.get());
        if (depthCompare != 0) {
            return depthCompare;
        }

        // Tertiary: by cumulative weight (higher weight first)
        int weightCompare = Long.compare(other.cumulativeWeight.get(), this.cumulativeWeight.get());
        if (weightCompare != 0) {
            return weightCompare;
        }

        // Final: by transaction ID
        return this.transactionId.compareTo(other.transactionId);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        DAGNode other = (DAGNode) obj;
        return transactionId.equals(other.transactionId);
    }

    @Override
    public int hashCode() {
        return transactionId.hashCode();
    }

    @Override
    public String toString() {
        return String.format(
            "DAGNode{txId=%s, status=%s, depth=%d, weight=%d, parents=%d, children=%d, finalized=%b}",
            transactionId,
            validationStatus.get(),
            depth.get(),
            cumulativeWeight.get(),
            parentIds.size(),
            children.size(),
            finalized
        );
    }

    /**
     * Get a compact representation for logging
     */
    public String toCompactString() {
        return String.format("%s[%s,d=%d,w=%d]",
            transactionId.substring(0, Math.min(8, transactionId.length())),
            validationStatus.get().name().substring(0, 3),
            depth.get(),
            cumulativeWeight.get()
        );
    }
}
