package io.aurigraph.v10.proto;

import io.quarkus.grpc.MutinyService;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public interface AIOrchestration extends MutinyService {

    /**
     * <pre>
     *  Health &amp; Status
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AITaskResponse> submitTask(io.aurigraph.v10.proto.AITask request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request);

    /**
     * <pre>
     *  Transaction Processing
     * </pre>
     */
    io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request);
}
