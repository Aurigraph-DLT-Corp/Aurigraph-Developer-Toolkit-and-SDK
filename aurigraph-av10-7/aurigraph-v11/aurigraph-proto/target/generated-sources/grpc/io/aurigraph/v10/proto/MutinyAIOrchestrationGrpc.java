package io.aurigraph.v10.proto;

import static io.aurigraph.v10.proto.AIOrchestrationGrpc.getServiceDescriptor;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public final class MutinyAIOrchestrationGrpc implements io.quarkus.grpc.MutinyGrpc {

    private MutinyAIOrchestrationGrpc() {
    }

    public static MutinyAIOrchestrationStub newMutinyStub(io.grpc.Channel channel) {
        return new MutinyAIOrchestrationStub(channel);
    }

    /**
     * <pre>
     *  AI Orchestration Service
     * </pre>
     */
    public static class MutinyAIOrchestrationStub extends io.grpc.stub.AbstractStub<MutinyAIOrchestrationStub> implements io.quarkus.grpc.MutinyStub {

        private AIOrchestrationGrpc.AIOrchestrationStub delegateStub;

        private MutinyAIOrchestrationStub(io.grpc.Channel channel) {
            super(channel);
            delegateStub = AIOrchestrationGrpc.newStub(channel);
        }

        private MutinyAIOrchestrationStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            super(channel, callOptions);
            delegateStub = AIOrchestrationGrpc.newStub(channel).build(channel, callOptions);
        }

        @Override
        protected MutinyAIOrchestrationStub build(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            return new MutinyAIOrchestrationStub(channel, callOptions);
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AITaskResponse> submitTask(io.aurigraph.v10.proto.AITask request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::submitTask);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getTaskStatus);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getAIMetrics);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::optimizeConsensus);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToMany(request, delegateStub::streamTaskUpdates);
        }
    }

    /**
     * <pre>
     *  AI Orchestration Service
     * </pre>
     */
    public static abstract class AIOrchestrationImplBase implements io.grpc.BindableService {

        private String compression;

        /**
         * Set whether the server will try to use a compressed response.
         *
         * @param compression the compression, e.g {@code gzip}
         */
        public AIOrchestrationImplBase withCompression(String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AITaskResponse> submitTask(io.aurigraph.v10.proto.AITask request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        @java.lang.Override
        public io.grpc.ServerServiceDefinition bindService() {
            return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor()).addMethod(io.aurigraph.v10.proto.AIOrchestrationGrpc.getSubmitTaskMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.AITask, io.aurigraph.v10.proto.AITaskResponse>(this, METHODID_SUBMIT_TASK, compression))).addMethod(io.aurigraph.v10.proto.AIOrchestrationGrpc.getGetTaskStatusMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.TaskStatusRequest, io.aurigraph.v10.proto.TaskStatus>(this, METHODID_GET_TASK_STATUS, compression))).addMethod(io.aurigraph.v10.proto.AIOrchestrationGrpc.getStreamTaskUpdatesMethod(), asyncServerStreamingCall(new MethodHandlers<io.aurigraph.v10.proto.TaskStreamRequest, io.aurigraph.v10.proto.TaskUpdate>(this, METHODID_STREAM_TASK_UPDATES, compression))).addMethod(io.aurigraph.v10.proto.AIOrchestrationGrpc.getGetAIMetricsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.AIMetricsRequest, io.aurigraph.v10.proto.AIMetrics>(this, METHODID_GET_AIMETRICS, compression))).addMethod(io.aurigraph.v10.proto.AIOrchestrationGrpc.getOptimizeConsensusMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.OptimizationRequest, io.aurigraph.v10.proto.OptimizationResult>(this, METHODID_OPTIMIZE_CONSENSUS, compression))).build();
        }
    }

    private static final int METHODID_SUBMIT_TASK = 0;

    private static final int METHODID_GET_TASK_STATUS = 1;

    private static final int METHODID_STREAM_TASK_UPDATES = 2;

    private static final int METHODID_GET_AIMETRICS = 3;

    private static final int METHODID_OPTIMIZE_CONSENSUS = 4;

    private static final class MethodHandlers<Req, Resp> implements io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>, io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {

        private final AIOrchestrationImplBase serviceImpl;

        private final int methodId;

        private final String compression;

        MethodHandlers(AIOrchestrationImplBase serviceImpl, int methodId, String compression) {
            this.serviceImpl = serviceImpl;
            this.methodId = methodId;
            this.compression = compression;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                case METHODID_SUBMIT_TASK:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.AITask) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AITaskResponse>) responseObserver, compression, serviceImpl::submitTask);
                    break;
                case METHODID_GET_TASK_STATUS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.TaskStatusRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskStatus>) responseObserver, compression, serviceImpl::getTaskStatus);
                    break;
                case METHODID_STREAM_TASK_UPDATES:
                    io.quarkus.grpc.stubs.ServerCalls.oneToMany((io.aurigraph.v10.proto.TaskStreamRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskUpdate>) responseObserver, compression, serviceImpl::streamTaskUpdates);
                    break;
                case METHODID_GET_AIMETRICS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.AIMetricsRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AIMetrics>) responseObserver, compression, serviceImpl::getAIMetrics);
                    break;
                case METHODID_OPTIMIZE_CONSENSUS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.OptimizationRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.OptimizationResult>) responseObserver, compression, serviceImpl::optimizeConsensus);
                    break;
                default:
                    throw new java.lang.AssertionError();
            }
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public io.grpc.stub.StreamObserver<Req> invoke(io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                default:
                    throw new java.lang.AssertionError();
            }
        }
    }
}
