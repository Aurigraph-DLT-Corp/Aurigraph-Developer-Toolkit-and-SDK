package io.aurigraph.v10.proto;

import static io.aurigraph.v10.proto.CrossChainBridgeGrpc.getServiceDescriptor;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public final class MutinyCrossChainBridgeGrpc implements io.quarkus.grpc.MutinyGrpc {

    private MutinyCrossChainBridgeGrpc() {
    }

    public static MutinyCrossChainBridgeStub newMutinyStub(io.grpc.Channel channel) {
        return new MutinyCrossChainBridgeStub(channel);
    }

    /**
     * <pre>
     *  Cross-Chain Bridge Service
     * </pre>
     */
    public static class MutinyCrossChainBridgeStub extends io.grpc.stub.AbstractStub<MutinyCrossChainBridgeStub> implements io.quarkus.grpc.MutinyStub {

        private CrossChainBridgeGrpc.CrossChainBridgeStub delegateStub;

        private MutinyCrossChainBridgeStub(io.grpc.Channel channel) {
            super(channel);
            delegateStub = CrossChainBridgeGrpc.newStub(channel);
        }

        private MutinyCrossChainBridgeStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            super(channel, callOptions);
            delegateStub = CrossChainBridgeGrpc.newStub(channel).build(channel, callOptions);
        }

        @Override
        protected MutinyCrossChainBridgeStub build(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            return new MutinyCrossChainBridgeStub(channel, callOptions);
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(io.aurigraph.v10.proto.BridgeRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::initiateBridge);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getBridgeStatus);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::listSupportedChains);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SwapResponse> executeSwap(io.aurigraph.v10.proto.SwapRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::executeSwap);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getBridgeMetrics);
        }
    }

    /**
     * <pre>
     *  Cross-Chain Bridge Service
     * </pre>
     */
    public static abstract class CrossChainBridgeImplBase implements io.grpc.BindableService {

        private String compression;

        /**
         * Set whether the server will try to use a compressed response.
         *
         * @param compression the compression, e.g {@code gzip}
         */
        public CrossChainBridgeImplBase withCompression(String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(io.aurigraph.v10.proto.BridgeRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SwapResponse> executeSwap(io.aurigraph.v10.proto.SwapRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        @java.lang.Override
        public io.grpc.ServerServiceDefinition bindService() {
            return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor()).addMethod(io.aurigraph.v10.proto.CrossChainBridgeGrpc.getInitiateBridgeMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.BridgeRequest, io.aurigraph.v10.proto.BridgeResponse>(this, METHODID_INITIATE_BRIDGE, compression))).addMethod(io.aurigraph.v10.proto.CrossChainBridgeGrpc.getGetBridgeStatusMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.BridgeStatusRequest, io.aurigraph.v10.proto.BridgeStatus>(this, METHODID_GET_BRIDGE_STATUS, compression))).addMethod(io.aurigraph.v10.proto.CrossChainBridgeGrpc.getListSupportedChainsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.ListChainsRequest, io.aurigraph.v10.proto.SupportedChains>(this, METHODID_LIST_SUPPORTED_CHAINS, compression))).addMethod(io.aurigraph.v10.proto.CrossChainBridgeGrpc.getExecuteSwapMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.SwapRequest, io.aurigraph.v10.proto.SwapResponse>(this, METHODID_EXECUTE_SWAP, compression))).addMethod(io.aurigraph.v10.proto.CrossChainBridgeGrpc.getGetBridgeMetricsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.BridgeMetricsRequest, io.aurigraph.v10.proto.BridgeMetrics>(this, METHODID_GET_BRIDGE_METRICS, compression))).build();
        }
    }

    private static final int METHODID_INITIATE_BRIDGE = 0;

    private static final int METHODID_GET_BRIDGE_STATUS = 1;

    private static final int METHODID_LIST_SUPPORTED_CHAINS = 2;

    private static final int METHODID_EXECUTE_SWAP = 3;

    private static final int METHODID_GET_BRIDGE_METRICS = 4;

    private static final class MethodHandlers<Req, Resp> implements io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>, io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {

        private final CrossChainBridgeImplBase serviceImpl;

        private final int methodId;

        private final String compression;

        MethodHandlers(CrossChainBridgeImplBase serviceImpl, int methodId, String compression) {
            this.serviceImpl = serviceImpl;
            this.methodId = methodId;
            this.compression = compression;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                case METHODID_INITIATE_BRIDGE:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.BridgeRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeResponse>) responseObserver, compression, serviceImpl::initiateBridge);
                    break;
                case METHODID_GET_BRIDGE_STATUS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.BridgeStatusRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeStatus>) responseObserver, compression, serviceImpl::getBridgeStatus);
                    break;
                case METHODID_LIST_SUPPORTED_CHAINS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.ListChainsRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SupportedChains>) responseObserver, compression, serviceImpl::listSupportedChains);
                    break;
                case METHODID_EXECUTE_SWAP:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.SwapRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SwapResponse>) responseObserver, compression, serviceImpl::executeSwap);
                    break;
                case METHODID_GET_BRIDGE_METRICS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.BridgeMetricsRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeMetrics>) responseObserver, compression, serviceImpl::getBridgeMetrics);
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
