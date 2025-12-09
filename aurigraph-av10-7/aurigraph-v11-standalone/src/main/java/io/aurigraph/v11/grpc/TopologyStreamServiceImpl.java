package io.aurigraph.v11.grpc;

import io.aurigraph.v11.dto.topology.*;
import io.aurigraph.v11.dto.topology.NodeTopologyDTO.NodeType;
import io.aurigraph.v11.proto.*;
import io.aurigraph.v11.service.NodeTopologyService;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * gRPC Service Implementation for Enhanced Node Topology Streaming
 * Provides server-side streaming for real-time topology updates
 *
 * GitHub Issue: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues/11
 */
@GrpcService
public class TopologyStreamServiceImpl extends TopologyServiceGrpc.TopologyServiceImplBase {

    private static final Logger LOG = Logger.getLogger(TopologyStreamServiceImpl.class);
    private static final int DEFAULT_UPDATE_INTERVAL_MS = 1000;
    private static final int MIN_UPDATE_INTERVAL_MS = 100;
    private static final int MAX_UPDATE_INTERVAL_MS = 60000;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    @Inject
    NodeTopologyService nodeTopologyService;

    /**
     * Stream full network topology with periodic updates
     * Server-side streaming RPC
     */
    @Override
    public void streamTopology(TopologyStreamRequest request,
                               StreamObserver<TopologyUpdate> responseObserver) {
        LOG.infof("Starting topology stream - channel: %s, type: %s, interval: %dms",
            request.getChannelId(),
            request.getNodeTypeFilter(),
            request.getUpdateIntervalMs());

        AtomicBoolean isActive = new AtomicBoolean(true);
        AtomicInteger sequenceNumber = new AtomicInteger(0);

        int intervalMs = validateInterval(request.getUpdateIntervalMs());
        String channelId = request.getChannelId().isEmpty() ? null : request.getChannelId();
        NodeType nodeTypeFilter = convertNodeType(request.getNodeTypeFilter());

        ScheduledFuture<?> streamTask = scheduler.scheduleAtFixedRate(() -> {
            if (!isActive.get()) {
                return;
            }

            try {
                TopologyUpdateDTO updateDTO = nodeTopologyService.buildTopologyUpdate(channelId, nodeTypeFilter);
                TopologyUpdate protoUpdate = convertToProto(updateDTO, sequenceNumber.incrementAndGet());
                responseObserver.onNext(protoUpdate);

                LOG.debugf("Sent topology update #%d with %d nodes",
                    sequenceNumber.get(), updateDTO.nodes().size());
            } catch (Exception e) {
                LOG.errorf("Error sending topology update: %s", e.getMessage());
                isActive.set(false);
                responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Error generating topology update: " + e.getMessage())
                    .asRuntimeException());
            }
        }, 0, intervalMs, TimeUnit.MILLISECONDS);

        // Handle client disconnect
        io.grpc.Context.current().addListener(context -> {
            LOG.info("Client disconnected from topology stream");
            isActive.set(false);
            streamTask.cancel(true);
        }, Runnable::run);
    }

    /**
     * Stream topology for a specific channel
     */
    @Override
    public void streamChannelTopology(ChannelTopologyRequest request,
                                      StreamObserver<ChannelTopologyUpdate> responseObserver) {
        String channelId = request.getChannelId();
        if (channelId == null || channelId.isEmpty()) {
            responseObserver.onError(io.grpc.Status.INVALID_ARGUMENT
                .withDescription("channel_id is required")
                .asRuntimeException());
            return;
        }

        LOG.infof("Starting channel topology stream for: %s", channelId);

        AtomicBoolean isActive = new AtomicBoolean(true);
        int intervalMs = validateInterval(request.getUpdateIntervalMs());

        ScheduledFuture<?> streamTask = scheduler.scheduleAtFixedRate(() -> {
            if (!isActive.get()) {
                return;
            }

            try {
                java.util.List<NodeTopologyDTO> nodes = nodeTopologyService.getNodesInChannel(channelId);
                double channelTps = nodes.stream().mapToDouble(NodeTopologyDTO::currentTps).sum();
                long channelTx = nodes.stream().mapToLong(NodeTopologyDTO::transactionsHandled).sum();

                ChannelTopologyUpdate.Builder updateBuilder = ChannelTopologyUpdate.newBuilder()
                    .setChannelId(channelId)
                    .setChannelName("Channel " + channelId)
                    .setNodeCount(nodes.size())
                    .setChannelTps(channelTps)
                    .setChannelTransactions(channelTx)
                    .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(java.time.Instant.now().getEpochSecond())
                        .build());

                for (NodeTopologyDTO node : nodes) {
                    updateBuilder.addNodes(convertNodeToProto(node));
                }

                responseObserver.onNext(updateBuilder.build());
            } catch (Exception e) {
                LOG.errorf("Error sending channel topology update: %s", e.getMessage());
                isActive.set(false);
                responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Error generating channel topology: " + e.getMessage())
                    .asRuntimeException());
            }
        }, 0, intervalMs, TimeUnit.MILLISECONDS);

        io.grpc.Context.current().addListener(context -> {
            LOG.infof("Client disconnected from channel %s stream", channelId);
            isActive.set(false);
            streamTask.cancel(true);
        }, Runnable::run);
    }

    /**
     * Get topology for a specific node (unary call)
     */
    @Override
    public void getNodeTopology(NodeTopologyRequest request,
                                StreamObserver<NodeTopologyResponse> responseObserver) {
        String nodeId = request.getNodeId();
        LOG.infof("Getting topology for node: %s", nodeId);

        try {
            java.util.Optional<NodeTopologyDTO> nodeOpt = nodeTopologyService.getNode(nodeId);

            NodeTopologyResponse.Builder responseBuilder = NodeTopologyResponse.newBuilder();

            if (nodeOpt.isPresent()) {
                responseBuilder.setNode(convertNodeToProto(nodeOpt.get()))
                    .setFound(true);
            } else {
                responseBuilder.setFound(false)
                    .setErrorMessage("Node not found: " + nodeId);
            }

            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            LOG.errorf("Error getting node topology: %s", e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                .withDescription("Error getting node topology: " + e.getMessage())
                .asRuntimeException());
        }
    }

    /**
     * Get topology statistics (unary call)
     */
    @Override
    public void getTopologyStats(TopologyStatsRequest request,
                                 StreamObserver<TopologyStatsResponse> responseObserver) {
        LOG.info("Getting topology statistics");

        try {
            TopologyStatsDTO stats = nodeTopologyService.getTopologyStats();

            TopologyStatsResponse.Builder responseBuilder = TopologyStatsResponse.newBuilder()
                .setTotalNodes(stats.totalNodes())
                .setValidatorCount(stats.validatorCount())
                .setBusinessCount(stats.businessCount())
                .setSlimCount(stats.slimCount())
                .setChannelCount(stats.channelCount())
                .setTotalTps(stats.totalTps())
                .setAvgLatencyMs(stats.avgLatencyMs())
                .setTotalContracts(stats.totalContracts())
                .setAvgCpuPercent(stats.avgCpuPercent())
                .setAvgMemoryPercent(stats.avgMemoryPercent())
                .setHealthyNodes(stats.healthyNodes())
                .setDegradedNodes(stats.degradedNodes())
                .setUnhealthyNodes(stats.unhealthyNodes())
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                    .setSeconds(stats.timestamp().getEpochSecond())
                    .build());

            // Add nodes by region
            stats.nodesByRegion().forEach(responseBuilder::putNodesByRegion);

            // Add nodes by type
            stats.nodesByType().forEach(responseBuilder::putNodesByType);

            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            LOG.errorf("Error getting topology stats: %s", e.getMessage());
            responseObserver.onError(io.grpc.Status.INTERNAL
                .withDescription("Error getting topology stats: " + e.getMessage())
                .asRuntimeException());
        }
    }

    // ========== Helper Methods ==========

    private int validateInterval(int requestedInterval) {
        if (requestedInterval <= 0) {
            return DEFAULT_UPDATE_INTERVAL_MS;
        }
        return Math.max(MIN_UPDATE_INTERVAL_MS, Math.min(MAX_UPDATE_INTERVAL_MS, requestedInterval));
    }

    private NodeType convertNodeType(TopologyNodeType protoType) {
        return switch (protoType) {
            case TOPOLOGY_VALIDATOR -> NodeType.VALIDATOR;
            case TOPOLOGY_BUSINESS -> NodeType.BUSINESS;
            case TOPOLOGY_SLIM -> NodeType.SLIM;
            case TOPOLOGY_CHANNEL -> NodeType.CHANNEL;
            default -> null;
        };
    }

    private TopologyNodeType convertToProtoNodeType(NodeType nodeType) {
        return switch (nodeType) {
            case VALIDATOR -> TopologyNodeType.TOPOLOGY_VALIDATOR;
            case BUSINESS -> TopologyNodeType.TOPOLOGY_BUSINESS;
            case SLIM -> TopologyNodeType.TOPOLOGY_SLIM;
            case CHANNEL -> TopologyNodeType.TOPOLOGY_CHANNEL;
        };
    }

    private TopologyUpdate convertToProto(TopologyUpdateDTO dto, int sequence) {
        TopologyUpdate.Builder builder = TopologyUpdate.newBuilder()
            .setTotalNodes(dto.totalNodes())
            .setNetworkTps(dto.networkTps())
            .setTotalTransactions(dto.totalTransactions())
            .setUpdateSequence(sequence)
            .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                .setSeconds(dto.timestamp().getEpochSecond())
                .build());

        for (NodeTopologyDTO node : dto.nodes()) {
            builder.addNodes(convertNodeToProto(node));
        }

        return builder.build();
    }

    private NodeTopology convertNodeToProto(NodeTopologyDTO dto) {
        NodeTopology.Builder builder = NodeTopology.newBuilder()
            .setNodeId(dto.nodeId())
            .setChannelId(dto.channelId() != null ? dto.channelId() : "")
            .setNodeType(convertToProtoNodeType(dto.nodeType()))
            .setTimeActiveSeconds(dto.timeActiveSeconds())
            .setTransactionsHandled(dto.transactionsHandled())
            .setCurrentTps(dto.currentTps())
            .setDataSource(dto.dataSource() == NodeTopologyDTO.DataSource.PRIMARY ?
                TopologyDataSource.TOPOLOGY_PRIMARY : TopologyDataSource.TOPOLOGY_REPLICA)
            .setContainerId(dto.containerId() != null ? dto.containerId() : "")
            .setContainerImage(dto.containerImage() != null ? dto.containerImage() : "")
            .setStakingAmount(dto.stakingAmount() != null ? dto.stakingAmount() : "0")
            .setCpuPercent(dto.cpuPercent())
            .setMemoryPercent(dto.memoryPercent())
            .setMemoryUsedMb(dto.memoryUsedMb())
            .setMemoryTotalMb(dto.memoryTotalMb())
            .setIsMobile(dto.isMobile())
            .setDeviceType(dto.deviceType() != null ? dto.deviceType() : "server")
            .setBandwidthMbps(dto.bandwidthMbps())
            .setLatencyMs(dto.latencyMs())
            .setPeersConnected(dto.peersConnected())
            .setContractCount(dto.contractCount())
            .setHealthScore(dto.healthScore())
            .setHealthStatus(dto.healthStatus() != null ? dto.healthStatus() : "unknown");

        // Add location if present
        if (dto.location() != null) {
            builder.setLocation(Location.newBuilder()
                .setLatitude(dto.location().latitude())
                .setLongitude(dto.location().longitude())
                .setCity(dto.location().city() != null ? dto.location().city() : "")
                .setCountry(dto.location().country() != null ? dto.location().country() : "")
                .setRegion(dto.location().region() != null ? dto.location().region() : "")
                .setDataCenter(dto.location().dataCenter() != null ? dto.location().dataCenter() : "")
                .build());
        }

        // Add registry status if present
        if (dto.registryStatus() != null) {
            builder.setRegistryStatus(RegistryStatus.newBuilder()
                .setRegistered(dto.registryStatus().registered())
                .setVersion(dto.registryStatus().version() != null ? dto.registryStatus().version() : "")
                .setProtocolVersion(dto.registryStatus().protocolVersion() != null ? dto.registryStatus().protocolVersion() : "")
                .setIsHealthy(dto.registryStatus().isHealthy())
                .setLastHeartbeat(com.google.protobuf.Timestamp.newBuilder()
                    .setSeconds(dto.registryStatus().lastHeartbeat() != null ?
                        dto.registryStatus().lastHeartbeat().getEpochSecond() : 0)
                    .build())
                .build());
        }

        // Add active contracts
        if (dto.activeContracts() != null) {
            for (ActiveContractDTO contract : dto.activeContracts()) {
                builder.addActiveContracts(ActiveContract.newBuilder()
                    .setContractAddress(contract.contractAddress() != null ? contract.contractAddress() : "")
                    .setContractName(contract.contractName() != null ? contract.contractName() : "")
                    .setStatus(convertContractStatus(contract.status()))
                    .setExecutionCount(contract.executionCount())
                    .setTotalGasUsed(contract.totalGasUsed() != null ? contract.totalGasUsed() : "0")
                    .setOwnerAddress(contract.ownerAddress() != null ? contract.ownerAddress() : "")
                    .setContractVersion(contract.contractVersion() != null ? contract.contractVersion() : "")
                    .setDeployedAt(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(contract.deployedAt() != null ? contract.deployedAt().getEpochSecond() : 0)
                        .build())
                    .setLastExecution(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(contract.lastExecution() != null ? contract.lastExecution().getEpochSecond() : 0)
                        .build())
                    .build());
            }
        }

        // Add timestamps
        if (dto.lastUpdated() != null) {
            builder.setLastUpdated(com.google.protobuf.Timestamp.newBuilder()
                .setSeconds(dto.lastUpdated().getEpochSecond())
                .build());
        }
        if (dto.startedAt() != null) {
            builder.setStartedAt(com.google.protobuf.Timestamp.newBuilder()
                .setSeconds(dto.startedAt().getEpochSecond())
                .build());
        }

        return builder.build();
    }

    private TopologyContractStatus convertContractStatus(ActiveContractDTO.ContractStatus status) {
        return switch (status) {
            case ACTIVE -> TopologyContractStatus.TOPOLOGY_CONTRACT_ACTIVE;
            case PAUSED -> TopologyContractStatus.TOPOLOGY_CONTRACT_PAUSED;
            case PENDING -> TopologyContractStatus.TOPOLOGY_CONTRACT_PENDING;
            case ERROR -> TopologyContractStatus.TOPOLOGY_CONTRACT_ERROR;
        };
    }
}
