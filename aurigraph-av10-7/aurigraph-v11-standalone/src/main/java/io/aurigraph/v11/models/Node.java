package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Node Entity
 *
 * Represents a network node in the Aurigraph V11 blockchain network.
 * Nodes can be validators, full nodes, or light clients.
 *
 * Part of Sprint 9 - Story 3 (AV11-053)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@Entity
@Table(name = "nodes", indexes = {
    @Index(name = "idx_node_address", columnList = "address"),
    @Index(name = "idx_node_status", columnList = "status"),
    @Index(name = "idx_node_type", columnList = "node_type"),
    @Index(name = "idx_node_validator", columnList = "is_validator")
})
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String address;

    @Column(name = "node_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private NodeType nodeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NodeStatus status = NodeStatus.OFFLINE;

    @Column(name = "is_validator", nullable = false)
    private Boolean isValidator = false;

    @Column(name = "validator_rank")
    private Integer validatorRank;

    @Column(name = "stake_amount")
    private Long stakeAmount = 0L;

    @Column(name = "host_address", nullable = false)
    private String hostAddress;

    @Column(name = "p2p_port")
    private Integer p2pPort = 30303;

    @Column(name = "rpc_port")
    private Integer rpcPort = 8545;

    @Column(name = "grpc_port")
    private Integer grpcPort = 9000;

    @Column(name = "public_key", length = 512)
    private String publicKey;

    @Column(name = "node_version", length = 50)
    private String nodeVersion = "11.0.0";

    @Column(name = "consensus_algorithm", length = 50)
    private String consensusAlgorithm = "HyperRAFT++";

    @Column(name = "blocks_validated")
    private Long blocksValidated = 0L;

    @Column(name = "blocks_produced")
    private Long blocksProduced = 0L;

    @Column(name = "transactions_processed")
    private Long transactionsProcessed = 0L;

    @Column(name = "uptime_seconds")
    private Long uptimeSeconds = 0L;

    @Column(name = "last_heartbeat")
    private Instant lastHeartbeat;

    @Column(name = "last_block_height")
    private Long lastBlockHeight = 0L;

    @Column(name = "peer_count")
    private Integer peerCount = 0;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "cpu_usage_percent")
    private Double cpuUsagePercent = 0.0;

    @Column(name = "memory_usage_percent")
    private Double memoryUsagePercent = 0.0;

    @Column(name = "disk_usage_percent")
    private Double diskUsagePercent = 0.0;

    @Column(name = "network_in_mbps")
    private Double networkInMbps = 0.0;

    @Column(name = "network_out_mbps")
    private Double networkOutMbps = 0.0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "node_metadata", joinColumns = @JoinColumn(name = "node_id"))
    @MapKeyColumn(name = "key")
    @Column(name = "value")
    private Map<String, String> metadata = new HashMap<>();

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        registeredAt = Instant.now();
        updatedAt = Instant.now();
        lastHeartbeat = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Constructors
    public Node() {
    }

    public Node(String address, NodeType nodeType, String hostAddress) {
        this.address = address;
        this.nodeType = nodeType;
        this.hostAddress = hostAddress;
        this.status = NodeStatus.OFFLINE;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public NodeType getNodeType() {
        return nodeType;
    }

    public void setNodeType(NodeType nodeType) {
        this.nodeType = nodeType;
    }

    public NodeStatus getStatus() {
        return status;
    }

    public void setStatus(NodeStatus status) {
        this.status = status;
    }

    public Boolean getIsValidator() {
        return isValidator;
    }

    public void setIsValidator(Boolean isValidator) {
        this.isValidator = isValidator;
    }

    public Integer getValidatorRank() {
        return validatorRank;
    }

    public void setValidatorRank(Integer validatorRank) {
        this.validatorRank = validatorRank;
    }

    public Long getStakeAmount() {
        return stakeAmount;
    }

    public void setStakeAmount(Long stakeAmount) {
        this.stakeAmount = stakeAmount;
    }

    public String getHostAddress() {
        return hostAddress;
    }

    public void setHostAddress(String hostAddress) {
        this.hostAddress = hostAddress;
    }

    public Integer getP2pPort() {
        return p2pPort;
    }

    public void setP2pPort(Integer p2pPort) {
        this.p2pPort = p2pPort;
    }

    public Integer getRpcPort() {
        return rpcPort;
    }

    public void setRpcPort(Integer rpcPort) {
        this.rpcPort = rpcPort;
    }

    public Integer getGrpcPort() {
        return grpcPort;
    }

    public void setGrpcPort(Integer grpcPort) {
        this.grpcPort = grpcPort;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getNodeVersion() {
        return nodeVersion;
    }

    public void setNodeVersion(String nodeVersion) {
        this.nodeVersion = nodeVersion;
    }

    public String getConsensusAlgorithm() {
        return consensusAlgorithm;
    }

    public void setConsensusAlgorithm(String consensusAlgorithm) {
        this.consensusAlgorithm = consensusAlgorithm;
    }

    public Long getBlocksValidated() {
        return blocksValidated;
    }

    public void setBlocksValidated(Long blocksValidated) {
        this.blocksValidated = blocksValidated;
    }

    public Long getBlocksProduced() {
        return blocksProduced;
    }

    public void setBlocksProduced(Long blocksProduced) {
        this.blocksProduced = blocksProduced;
    }

    public Long getTransactionsProcessed() {
        return transactionsProcessed;
    }

    public void setTransactionsProcessed(Long transactionsProcessed) {
        this.transactionsProcessed = transactionsProcessed;
    }

    public Long getUptimeSeconds() {
        return uptimeSeconds;
    }

    public void setUptimeSeconds(Long uptimeSeconds) {
        this.uptimeSeconds = uptimeSeconds;
    }

    public Instant getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Instant lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }

    public Long getLastBlockHeight() {
        return lastBlockHeight;
    }

    public void setLastBlockHeight(Long lastBlockHeight) {
        this.lastBlockHeight = lastBlockHeight;
    }

    public Integer getPeerCount() {
        return peerCount;
    }

    public void setPeerCount(Integer peerCount) {
        this.peerCount = peerCount;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getCpuUsagePercent() {
        return cpuUsagePercent;
    }

    public void setCpuUsagePercent(Double cpuUsagePercent) {
        this.cpuUsagePercent = cpuUsagePercent;
    }

    public Double getMemoryUsagePercent() {
        return memoryUsagePercent;
    }

    public void setMemoryUsagePercent(Double memoryUsagePercent) {
        this.memoryUsagePercent = memoryUsagePercent;
    }

    public Double getDiskUsagePercent() {
        return diskUsagePercent;
    }

    public void setDiskUsagePercent(Double diskUsagePercent) {
        this.diskUsagePercent = diskUsagePercent;
    }

    public Double getNetworkInMbps() {
        return networkInMbps;
    }

    public void setNetworkInMbps(Double networkInMbps) {
        this.networkInMbps = networkInMbps;
    }

    public Double getNetworkOutMbps() {
        return networkOutMbps;
    }

    public void setNetworkOutMbps(Double networkOutMbps) {
        this.networkOutMbps = networkOutMbps;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public Instant getRegisteredAt() {
        return registeredAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Helper: Check if node is online
     */
    public boolean isOnline() {
        return status == NodeStatus.ONLINE || status == NodeStatus.SYNCING || status == NodeStatus.VALIDATING;
    }

    /**
     * Helper: Check if node is healthy
     */
    public boolean isHealthy() {
        if (!isOnline()) {
            return false;
        }

        // Check if last heartbeat is recent (within 1 minute)
        if (lastHeartbeat != null) {
            long secondsSinceHeartbeat = Instant.now().getEpochSecond() - lastHeartbeat.getEpochSecond();
            if (secondsSinceHeartbeat > 60) {
                return false;
            }
        }

        // Check resource usage
        return cpuUsagePercent < 90 && memoryUsagePercent < 90 && diskUsagePercent < 90;
    }

    /**
     * Helper: Update heartbeat
     */
    public void updateHeartbeat() {
        this.lastHeartbeat = Instant.now();
    }

    /**
     * Helper: Increment blocks validated
     */
    public void incrementBlocksValidated() {
        this.blocksValidated++;
    }

    /**
     * Helper: Increment blocks produced
     */
    public void incrementBlocksProduced() {
        this.blocksProduced++;
    }

    @Override
    public String toString() {
        return "Node{" +
                "id='" + id + '\'' +
                ", address='" + address + '\'' +
                ", nodeType=" + nodeType +
                ", status=" + status +
                ", isValidator=" + isValidator +
                ", hostAddress='" + hostAddress + '\'' +
                ", lastHeartbeat=" + lastHeartbeat +
                '}';
    }
}
