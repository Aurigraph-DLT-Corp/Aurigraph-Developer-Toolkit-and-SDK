package io.aurigraph.v10.proto;

import java.util.function.BiFunction;
import io.quarkus.grpc.MutinyClient;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class AIOrchestrationClient implements AIOrchestration, MutinyClient<MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub> {

    private final MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub stub;

    public AIOrchestrationClient(String name, io.grpc.Channel channel, BiFunction<String, MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub, MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub> stubConfigurator) {
        this.stub = stubConfigurator.apply(name, MutinyAIOrchestrationGrpc.newMutinyStub(channel));
    }

    private AIOrchestrationClient(MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub stub) {
        this.stub = stub;
    }

    public AIOrchestrationClient newInstanceWithStub(MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub stub) {
        return new AIOrchestrationClient(stub);
    }

    @Override
    public MutinyAIOrchestrationGrpc.MutinyAIOrchestrationStub getStub() {
        return stub;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AITaskResponse> submitTask(io.aurigraph.v10.proto.AITask request) {
        return stub.submitTask(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request) {
        return stub.getTaskStatus(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request) {
        return stub.getAIMetrics(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request) {
        return stub.optimizeConsensus(request);
    }

    @Override
    public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request) {
        return stub.streamTaskUpdates(request);
    }
}
