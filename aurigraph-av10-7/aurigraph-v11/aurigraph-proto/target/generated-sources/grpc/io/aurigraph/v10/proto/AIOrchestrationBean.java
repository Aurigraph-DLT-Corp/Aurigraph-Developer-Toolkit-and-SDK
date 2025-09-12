package io.aurigraph.v10.proto;

import io.grpc.BindableService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.MutinyBean;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class AIOrchestrationBean extends MutinyAIOrchestrationGrpc.AIOrchestrationImplBase implements BindableService, MutinyBean {

    private final AIOrchestration delegate;

    AIOrchestrationBean(@GrpcService AIOrchestration delegate) {
        this.delegate = delegate;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AITaskResponse> submitTask(io.aurigraph.v10.proto.AITask request) {
        try {
            return delegate.submitTask(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request) {
        try {
            return delegate.getTaskStatus(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request) {
        try {
            return delegate.getAIMetrics(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request) {
        try {
            return delegate.optimizeConsensus(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request) {
        try {
            return delegate.streamTaskUpdates(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }
}
