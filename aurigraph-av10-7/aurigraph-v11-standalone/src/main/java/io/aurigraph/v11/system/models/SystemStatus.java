package io.aurigraph.v11.system.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * System Status Entity
 *
 * Tracks comprehensive system health and performance metrics.
 * Monitors consensus, resources, network, and service availability.
 *
 * @version 3.8.0 (Phase 2 Day 12)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "system_status", indexes = {
    @Index(name = "idx_status_timestamp", columnList = "timestamp"),
    @Index(name = "idx_status_node", columnList = "nodeId"),
    @Index(name = "idx_status_health", columnList = "healthStatus")
})
public class SystemStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nodeId", nullable = false, length = 66)
    private String nodeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "healthStatus", nullable = false, length = 30)
    private HealthStatus healthStatus;

    // Timestamps
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "uptime", nullable = false)
    private Long uptime = 0L; // seconds

    @Column(name = "startedAt", nullable = false)
    private Instant startedAt;

    // Performance Metrics
    @Column(name = "tps", precision = 18, scale = 2)
    private BigDecimal tps; // Transactions per second

    @Column(name = "avgLatency", precision = 18, scale = 2)
    private BigDecimal avgLatency; // milliseconds

    @Column(name = "peakTps", precision = 18, scale = 2)
    private BigDecimal peakTps;

    @Column(name = "totalTransactions", nullable = false)
    private Long totalTransactions = 0L;

    @Column(name = "failedTransactions", nullable = false)
    private Long failedTransactions = 0L;

    // Resource Usage
    @Column(name = "cpuUsage", precision = 5, scale = 2)
    private BigDecimal cpuUsage; // percentage

    @Column(name = "memoryUsed", nullable = false)
    private Long memoryUsed = 0L; // bytes

    @Column(name = "memoryTotal", nullable = false)
    private Long memoryTotal = 0L; // bytes

    @Column(name = "diskUsed", nullable = false)
    private Long diskUsed = 0L; // bytes

    @Column(name = "diskTotal", nullable = false)
    private Long diskTotal = 0L; // bytes

    @Column(name = "threadCount", nullable = false)
    private Integer threadCount = 0;

    @Column(name = "activeThreadCount", nullable = false)
    private Integer activeThreadCount = 0;

    // Consensus Metrics
    @Enumerated(EnumType.STRING)
    @Column(name = "consensusStatus", length = 30)
    private ConsensusStatus consensusStatus;

    @Column(name = "blockHeight", nullable = false)
    private Long blockHeight = 0L;

    @Column(name = "blockTime", precision = 18, scale = 2)
    private BigDecimal blockTime; // milliseconds

    @Column(name = "isLeader", nullable = false)
    private Boolean isLeader = false;

    @Column(name = "peerCount", nullable = false)
    private Integer peerCount = 0;

    @Column(name = "activePeers", nullable = false)
    private Integer activePeers = 0;

    // Network Metrics
    @Column(name = "networkBytesIn", nullable = false)
    private Long networkBytesIn = 0L;

    @Column(name = "networkBytesOut", nullable = false)
    private Long networkBytesOut = 0L;

    @Column(name = "networkErrors", nullable = false)
    private Long networkErrors = 0L;

    @Column(name = "connectionCount", nullable = false)
    private Integer connectionCount = 0;

    // Service Availability
    @Column(name = "apiAvailable", nullable = false)
    private Boolean apiAvailable = true;

    @Column(name = "grpcAvailable", nullable = false)
    private Boolean grpcAvailable = true;

    @Column(name = "databaseAvailable", nullable = false)
    private Boolean databaseAvailable = true;

    @Column(name = "cacheAvailable", nullable = false)
    private Boolean cacheAvailable = true;

    // Error Tracking
    @Column(name = "errorCount", nullable = false)
    private Long errorCount = 0L;

    @Column(name = "warningCount", nullable = false)
    private Long warningCount = 0L;

    @Column(name = "lastError", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "lastErrorAt")
    private Instant lastErrorAt;

    // Metadata
    @Column(name = "version", length = 50)
    private String version;

    @Column(name = "environment", length = 50)
    private String environment;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // ==================== CONSTRUCTORS ====================

    public SystemStatus() {
        this.timestamp = Instant.now();
        this.startedAt = Instant.now();
        this.healthStatus = HealthStatus.HEALTHY;
        this.consensusStatus = ConsensusStatus.SYNCED;
        this.totalTransactions = 0L;
        this.failedTransactions = 0L;
        this.errorCount = 0L;
        this.warningCount = 0L;
        this.apiAvailable = true;
        this.grpcAvailable = true;
        this.databaseAvailable = true;
        this.cacheAvailable = true;
        this.isLeader = false;
    }

    public SystemStatus(String nodeId) {
        this();
        this.nodeId = nodeId;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
        updateUptime();
    }

    /**
     * Update uptime in seconds
     */
    public void updateUptime() {
        if (startedAt != null) {
            this.uptime = Instant.now().getEpochSecond() - startedAt.getEpochSecond();
        }
    }

    /**
     * Calculate memory usage percentage
     */
    public BigDecimal getMemoryUsagePercent() {
        if (memoryTotal == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(memoryUsed)
                .divide(BigDecimal.valueOf(memoryTotal), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Calculate disk usage percentage
     */
    public BigDecimal getDiskUsagePercent() {
        if (diskTotal == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(diskUsed)
                .divide(BigDecimal.valueOf(diskTotal), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Calculate transaction success rate
     */
    public BigDecimal getSuccessRate() {
        if (totalTransactions == 0) {
            return BigDecimal.valueOf(100);
        }
        long successful = totalTransactions - failedTransactions;
        return BigDecimal.valueOf(successful)
                .divide(BigDecimal.valueOf(totalTransactions), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Check if system is healthy
     */
    public boolean isHealthy() {
        return healthStatus == HealthStatus.HEALTHY;
    }

    /**
     * Check if consensus is synced
     */
    public boolean isConsensusSynced() {
        return consensusStatus == ConsensusStatus.SYNCED;
    }

    /**
     * Record an error
     */
    public void recordError(String error) {
        this.errorCount++;
        this.lastError = error;
        this.lastErrorAt = Instant.now();
        updateHealthStatus();
    }

    /**
     * Record a warning
     */
    public void recordWarning() {
        this.warningCount++;
        updateHealthStatus();
    }

    /**
     * Update health status based on metrics
     */
    public void updateHealthStatus() {
        // Check critical services
        if (!apiAvailable || !databaseAvailable) {
            this.healthStatus = HealthStatus.CRITICAL;
            return;
        }

        // Check resource usage
        BigDecimal memUsage = getMemoryUsagePercent();
        BigDecimal diskUsage = getDiskUsagePercent();

        if (memUsage.compareTo(BigDecimal.valueOf(90)) > 0 ||
            diskUsage.compareTo(BigDecimal.valueOf(90)) > 0) {
            this.healthStatus = HealthStatus.DEGRADED;
            return;
        }

        // Check error rate
        BigDecimal successRate = getSuccessRate();
        if (successRate.compareTo(BigDecimal.valueOf(95)) < 0) {
            this.healthStatus = HealthStatus.DEGRADED;
            return;
        }

        // Check consensus
        if (consensusStatus != ConsensusStatus.SYNCED) {
            this.healthStatus = HealthStatus.DEGRADED;
            return;
        }

        this.healthStatus = HealthStatus.HEALTHY;
    }

    /**
     * Get status summary
     */
    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("nodeId", nodeId);
        summary.put("health", healthStatus);
        summary.put("uptime", uptime);
        summary.put("tps", tps);
        summary.put("blockHeight", blockHeight);
        summary.put("peerCount", peerCount);
        summary.put("cpuUsage", cpuUsage);
        summary.put("memoryUsagePercent", getMemoryUsagePercent());
        summary.put("diskUsagePercent", getDiskUsagePercent());
        summary.put("successRate", getSuccessRate());
        summary.put("isLeader", isLeader);
        summary.put("consensusStatus", consensusStatus);
        return summary;
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public HealthStatus getHealthStatus() { return healthStatus; }
    public void setHealthStatus(HealthStatus healthStatus) { this.healthStatus = healthStatus; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Long getUptime() { return uptime; }
    public void setUptime(Long uptime) { this.uptime = uptime; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public BigDecimal getTps() { return tps; }
    public void setTps(BigDecimal tps) { this.tps = tps; }

    public BigDecimal getAvgLatency() { return avgLatency; }
    public void setAvgLatency(BigDecimal avgLatency) { this.avgLatency = avgLatency; }

    public BigDecimal getPeakTps() { return peakTps; }
    public void setPeakTps(BigDecimal peakTps) { this.peakTps = peakTps; }

    public Long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(Long totalTransactions) { this.totalTransactions = totalTransactions; }

    public Long getFailedTransactions() { return failedTransactions; }
    public void setFailedTransactions(Long failedTransactions) { this.failedTransactions = failedTransactions; }

    public BigDecimal getCpuUsage() { return cpuUsage; }
    public void setCpuUsage(BigDecimal cpuUsage) { this.cpuUsage = cpuUsage; }

    public Long getMemoryUsed() { return memoryUsed; }
    public void setMemoryUsed(Long memoryUsed) { this.memoryUsed = memoryUsed; }

    public Long getMemoryTotal() { return memoryTotal; }
    public void setMemoryTotal(Long memoryTotal) { this.memoryTotal = memoryTotal; }

    public Long getDiskUsed() { return diskUsed; }
    public void setDiskUsed(Long diskUsed) { this.diskUsed = diskUsed; }

    public Long getDiskTotal() { return diskTotal; }
    public void setDiskTotal(Long diskTotal) { this.diskTotal = diskTotal; }

    public Integer getThreadCount() { return threadCount; }
    public void setThreadCount(Integer threadCount) { this.threadCount = threadCount; }

    public Integer getActiveThreadCount() { return activeThreadCount; }
    public void setActiveThreadCount(Integer activeThreadCount) { this.activeThreadCount = activeThreadCount; }

    public ConsensusStatus getConsensusStatus() { return consensusStatus; }
    public void setConsensusStatus(ConsensusStatus consensusStatus) { this.consensusStatus = consensusStatus; }

    public Long getBlockHeight() { return blockHeight; }
    public void setBlockHeight(Long blockHeight) { this.blockHeight = blockHeight; }

    public BigDecimal getBlockTime() { return blockTime; }
    public void setBlockTime(BigDecimal blockTime) { this.blockTime = blockTime; }

    public Boolean getIsLeader() { return isLeader; }
    public void setIsLeader(Boolean isLeader) { this.isLeader = isLeader; }

    public Integer getPeerCount() { return peerCount; }
    public void setPeerCount(Integer peerCount) { this.peerCount = peerCount; }

    public Integer getActivePeers() { return activePeers; }
    public void setActivePeers(Integer activePeers) { this.activePeers = activePeers; }

    public Long getNetworkBytesIn() { return networkBytesIn; }
    public void setNetworkBytesIn(Long networkBytesIn) { this.networkBytesIn = networkBytesIn; }

    public Long getNetworkBytesOut() { return networkBytesOut; }
    public void setNetworkBytesOut(Long networkBytesOut) { this.networkBytesOut = networkBytesOut; }

    public Long getNetworkErrors() { return networkErrors; }
    public void setNetworkErrors(Long networkErrors) { this.networkErrors = networkErrors; }

    public Integer getConnectionCount() { return connectionCount; }
    public void setConnectionCount(Integer connectionCount) { this.connectionCount = connectionCount; }

    public Boolean getApiAvailable() { return apiAvailable; }
    public void setApiAvailable(Boolean apiAvailable) { this.apiAvailable = apiAvailable; }

    public Boolean getGrpcAvailable() { return grpcAvailable; }
    public void setGrpcAvailable(Boolean grpcAvailable) { this.grpcAvailable = grpcAvailable; }

    public Boolean getDatabaseAvailable() { return databaseAvailable; }
    public void setDatabaseAvailable(Boolean databaseAvailable) { this.databaseAvailable = databaseAvailable; }

    public Boolean getCacheAvailable() { return cacheAvailable; }
    public void setCacheAvailable(Boolean cacheAvailable) { this.cacheAvailable = cacheAvailable; }

    public Long getErrorCount() { return errorCount; }
    public void setErrorCount(Long errorCount) { this.errorCount = errorCount; }

    public Long getWarningCount() { return warningCount; }
    public void setWarningCount(Long warningCount) { this.warningCount = warningCount; }

    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }

    public Instant getLastErrorAt() { return lastErrorAt; }
    public void setLastErrorAt(Instant lastErrorAt) { this.lastErrorAt = lastErrorAt; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    // ==================== ENUM DEFINITIONS ====================

    public enum HealthStatus {
        HEALTHY,        // System operating normally
        DEGRADED,       // System operating with reduced performance
        UNHEALTHY,      // System experiencing significant issues
        CRITICAL,       // System in critical state
        UNKNOWN         // Status cannot be determined
    }

    public enum ConsensusStatus {
        SYNCED,         // Fully synchronized
        SYNCING,        // Synchronization in progress
        OUT_OF_SYNC,    // Not synchronized
        STALLED,        // Synchronization stalled
        DISABLED        // Consensus disabled
    }

    @Override
    public String toString() {
        return String.format("SystemStatus{id=%d, nodeId='%s', health=%s, tps=%s, blockHeight=%d, uptime=%d}",
                id, nodeId, healthStatus, tps, blockHeight, uptime);
    }
}
