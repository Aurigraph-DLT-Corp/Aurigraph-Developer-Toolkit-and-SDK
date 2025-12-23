package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Channel Entity
 *
 * Represents a blockchain channel in the Aurigraph V11 network.
 * Channels enable isolated transaction processing with custom consensus rules,
 * privacy settings, and member management.
 *
 * Part of Sprint 10 - Story 1 (AV11-054)
 *
 * @author Claude Code - Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 10
 */
@Entity
@Table(name = "channels", indexes = {
    @Index(name = "idx_channel_id", columnList = "channel_id", unique = true),
    @Index(name = "idx_channel_name", columnList = "name"),
    @Index(name = "idx_channel_status", columnList = "status"),
    @Index(name = "idx_channel_privacy", columnList = "privacy_level"),
    @Index(name = "idx_channel_created", columnList = "created_at")
})
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "channel_id", nullable = false, unique = true, length = 64)
    private String channelId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "consensus_algorithm", nullable = false, length = 50)
    private String consensusAlgorithm = "HyperRAFT++";

    @Column(name = "consensus_config", columnDefinition = "TEXT")
    private String consensusConfig;

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_level", nullable = false, length = 20)
    private PrivacyLevel privacyLevel = PrivacyLevel.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "isolation_mode", nullable = false, length = 30)
    private IsolationMode isolationMode = IsolationMode.SHARED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChannelStatus status = ChannelStatus.ACTIVE;

    @OneToMany(mappedBy = "channel", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ChannelMember> members = new ArrayList<>();

    @Column(name = "total_transactions", nullable = false)
    private Long totalTransactions = 0L;

    @Column(name = "total_blocks", nullable = false)
    private Long totalBlocks = 0L;

    @Column(name = "current_tps")
    private Double currentTps = 0.0;

    @Column(name = "avg_tps")
    private Double avgTps = 0.0;

    @Column(name = "peak_tps")
    private Double peakTps = 0.0;

    @Column(name = "avg_latency_ms")
    private Double avgLatencyMs = 0.0;

    @Column(name = "last_block_height")
    private Long lastBlockHeight = 0L;

    @Column(name = "last_block_timestamp")
    private Instant lastBlockTimestamp;

    @Column(name = "creator_address", nullable = false)
    private String creatorAddress;

    @Column(name = "max_members")
    private Integer maxMembers = 100;

    @Column(name = "min_validators")
    private Integer minValidators = 3;

    @Column(name = "block_time_ms")
    private Long blockTimeMs = 1000L;

    @Column(name = "max_block_size")
    private Long maxBlockSize = 10485760L; // 10 MB

    @Column(name = "enable_smart_contracts", nullable = false)
    private Boolean enableSmartContracts = true;

    @Column(name = "enable_cross_channel", nullable = false)
    private Boolean enableCrossChannel = false;

    @Column(name = "archived", nullable = false)
    private Boolean archived = false;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "archive_reason", columnDefinition = "TEXT")
    private String archiveReason;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "channel_metadata", joinColumns = @JoinColumn(name = "channel_id"))
    @MapKeyColumn(name = "key")
    @Column(name = "value")
    private Map<String, String> metadata = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();

        // Generate channel ID if not set
        if (channelId == null || channelId.isEmpty()) {
            channelId = generateChannelId();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Constructors
    public Channel() {
    }

    public Channel(String name, String description, String creatorAddress) {
        this.name = name;
        this.description = description;
        this.creatorAddress = creatorAddress;
        this.status = ChannelStatus.ACTIVE;
        this.channelId = generateChannelId();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getConsensusAlgorithm() {
        return consensusAlgorithm;
    }

    public void setConsensusAlgorithm(String consensusAlgorithm) {
        this.consensusAlgorithm = consensusAlgorithm;
    }

    public String getConsensusConfig() {
        return consensusConfig;
    }

    public void setConsensusConfig(String consensusConfig) {
        this.consensusConfig = consensusConfig;
    }

    public PrivacyLevel getPrivacyLevel() {
        return privacyLevel;
    }

    public void setPrivacyLevel(PrivacyLevel privacyLevel) {
        this.privacyLevel = privacyLevel;
    }

    public IsolationMode getIsolationMode() {
        return isolationMode;
    }

    public void setIsolationMode(IsolationMode isolationMode) {
        this.isolationMode = isolationMode;
    }

    public ChannelStatus getStatus() {
        return status;
    }

    public void setStatus(ChannelStatus status) {
        this.status = status;
    }

    public List<ChannelMember> getMembers() {
        return members;
    }

    public void setMembers(List<ChannelMember> members) {
        this.members = members;
    }

    public Long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Long getTotalBlocks() {
        return totalBlocks;
    }

    public void setTotalBlocks(Long totalBlocks) {
        this.totalBlocks = totalBlocks;
    }

    public Double getCurrentTps() {
        return currentTps;
    }

    public void setCurrentTps(Double currentTps) {
        this.currentTps = currentTps;
    }

    public Double getAvgTps() {
        return avgTps;
    }

    public void setAvgTps(Double avgTps) {
        this.avgTps = avgTps;
    }

    public Double getPeakTps() {
        return peakTps;
    }

    public void setPeakTps(Double peakTps) {
        this.peakTps = peakTps;
    }

    public Double getAvgLatencyMs() {
        return avgLatencyMs;
    }

    public void setAvgLatencyMs(Double avgLatencyMs) {
        this.avgLatencyMs = avgLatencyMs;
    }

    public Long getLastBlockHeight() {
        return lastBlockHeight;
    }

    public void setLastBlockHeight(Long lastBlockHeight) {
        this.lastBlockHeight = lastBlockHeight;
    }

    public Instant getLastBlockTimestamp() {
        return lastBlockTimestamp;
    }

    public void setLastBlockTimestamp(Instant lastBlockTimestamp) {
        this.lastBlockTimestamp = lastBlockTimestamp;
    }

    public String getCreatorAddress() {
        return creatorAddress;
    }

    public void setCreatorAddress(String creatorAddress) {
        this.creatorAddress = creatorAddress;
    }

    public Integer getMaxMembers() {
        return maxMembers;
    }

    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }

    public Integer getMinValidators() {
        return minValidators;
    }

    public void setMinValidators(Integer minValidators) {
        this.minValidators = minValidators;
    }

    public Long getBlockTimeMs() {
        return blockTimeMs;
    }

    public void setBlockTimeMs(Long blockTimeMs) {
        this.blockTimeMs = blockTimeMs;
    }

    public Long getMaxBlockSize() {
        return maxBlockSize;
    }

    public void setMaxBlockSize(Long maxBlockSize) {
        this.maxBlockSize = maxBlockSize;
    }

    public Boolean getEnableSmartContracts() {
        return enableSmartContracts;
    }

    public void setEnableSmartContracts(Boolean enableSmartContracts) {
        this.enableSmartContracts = enableSmartContracts;
    }

    public Boolean getEnableCrossChannel() {
        return enableCrossChannel;
    }

    public void setEnableCrossChannel(Boolean enableCrossChannel) {
        this.enableCrossChannel = enableCrossChannel;
    }

    public Boolean getArchived() {
        return archived;
    }

    public void setArchived(Boolean archived) {
        this.archived = archived;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }

    public String getArchiveReason() {
        return archiveReason;
    }

    public void setArchiveReason(String archiveReason) {
        this.archiveReason = archiveReason;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Helper: Add member to channel
     *
     * @param member Channel member to add
     */
    public void addMember(ChannelMember member) {
        if (members.size() >= maxMembers) {
            throw new IllegalStateException("Channel has reached maximum member capacity: " + maxMembers);
        }
        members.add(member);
        member.setChannel(this);
    }

    /**
     * Helper: Remove member from channel
     *
     * @param member Channel member to remove
     */
    public void removeMember(ChannelMember member) {
        members.remove(member);
        member.setChannel(null);
    }

    /**
     * Helper: Get member count
     *
     * @return Number of members in channel
     */
    public int getMemberCount() {
        return members.size();
    }

    /**
     * Helper: Get validator count
     *
     * @return Number of validators in channel
     */
    public long getValidatorCount() {
        return members.stream()
                .filter(m -> m.getNodeType() == ChannelMemberType.VALIDATOR)
                .count();
    }

    /**
     * Helper: Check if channel is active
     *
     * @return true if channel is active
     */
    public boolean isActive() {
        return status == ChannelStatus.ACTIVE && !archived;
    }

    /**
     * Helper: Check if channel is full
     *
     * @return true if channel has reached max members
     */
    public boolean isFull() {
        return members.size() >= maxMembers;
    }

    /**
     * Helper: Check if channel has minimum validators
     *
     * @return true if channel has minimum required validators
     */
    public boolean hasMinimumValidators() {
        return getValidatorCount() >= minValidators;
    }

    /**
     * Helper: Increment transaction count
     */
    public void incrementTransactionCount() {
        this.totalTransactions++;
    }

    /**
     * Helper: Increment block count
     */
    public void incrementBlockCount() {
        this.totalBlocks++;
        this.lastBlockHeight = this.totalBlocks;
        this.lastBlockTimestamp = Instant.now();
    }

    /**
     * Helper: Update TPS metrics
     *
     * @param tps Current TPS value
     */
    public void updateTpsMetrics(Double tps) {
        this.currentTps = tps;

        // Update average TPS (simple moving average)
        if (this.avgTps == 0.0) {
            this.avgTps = tps;
        } else {
            this.avgTps = (this.avgTps * 0.9) + (tps * 0.1);
        }

        // Update peak TPS
        if (tps > this.peakTps) {
            this.peakTps = tps;
        }
    }

    /**
     * Helper: Generate channel ID
     *
     * @return Generated channel ID
     */
    private String generateChannelId() {
        return "ch_" + System.currentTimeMillis() + "_" +
               Integer.toHexString((int)(Math.random() * 1000000));
    }

    @Override
    public String toString() {
        return "Channel{" +
                "id='" + id + '\'' +
                ", channelId='" + channelId + '\'' +
                ", name='" + name + '\'' +
                ", consensusAlgorithm='" + consensusAlgorithm + '\'' +
                ", privacyLevel=" + privacyLevel +
                ", status=" + status +
                ", memberCount=" + members.size() +
                ", totalTransactions=" + totalTransactions +
                ", totalBlocks=" + totalBlocks +
                ", currentTps=" + currentTps +
                '}';
    }
}
