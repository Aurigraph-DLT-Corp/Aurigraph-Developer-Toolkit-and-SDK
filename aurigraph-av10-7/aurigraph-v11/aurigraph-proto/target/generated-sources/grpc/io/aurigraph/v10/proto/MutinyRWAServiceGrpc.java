package io.aurigraph.v10.proto;

import static io.aurigraph.v10.proto.RWAServiceGrpc.getServiceDescriptor;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public final class MutinyRWAServiceGrpc implements io.quarkus.grpc.MutinyGrpc {

    private MutinyRWAServiceGrpc() {
    }

    public static MutinyRWAServiceStub newMutinyStub(io.grpc.Channel channel) {
        return new MutinyRWAServiceStub(channel);
    }

    /**
     * <pre>
     *  Real World Assets Service
     * </pre>
     */
    public static class MutinyRWAServiceStub extends io.grpc.stub.AbstractStub<MutinyRWAServiceStub> implements io.quarkus.grpc.MutinyStub {

        private RWAServiceGrpc.RWAServiceStub delegateStub;

        private MutinyRWAServiceStub(io.grpc.Channel channel) {
            super(channel);
            delegateStub = RWAServiceGrpc.newStub(channel);
        }

        private MutinyRWAServiceStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            super(channel, callOptions);
            delegateStub = RWAServiceGrpc.newStub(channel).build(channel, callOptions);
        }

        @Override
        protected MutinyRWAServiceStub build(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            return new MutinyRWAServiceStub(channel, callOptions);
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(io.aurigraph.v10.proto.AssetRegistration request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::registerAsset);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Asset> getAsset(io.aurigraph.v10.proto.GetAssetRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getAsset);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::tokenizeAsset);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ValuationResponse> updateValuation(io.aurigraph.v10.proto.ValuationUpdate request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::updateValuation);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::checkCompliance);
        }
    }

    /**
     * <pre>
     *  Real World Assets Service
     * </pre>
     */
    public static abstract class RWAServiceImplBase implements io.grpc.BindableService {

        private String compression;

        /**
         * Set whether the server will try to use a compressed response.
         *
         * @param compression the compression, e.g {@code gzip}
         */
        public RWAServiceImplBase withCompression(String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(io.aurigraph.v10.proto.AssetRegistration request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Asset> getAsset(io.aurigraph.v10.proto.GetAssetRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ValuationResponse> updateValuation(io.aurigraph.v10.proto.ValuationUpdate request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        @java.lang.Override
        public io.grpc.ServerServiceDefinition bindService() {
            return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor()).addMethod(io.aurigraph.v10.proto.RWAServiceGrpc.getRegisterAssetMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.AssetRegistration, io.aurigraph.v10.proto.AssetRegistrationResponse>(this, METHODID_REGISTER_ASSET, compression))).addMethod(io.aurigraph.v10.proto.RWAServiceGrpc.getGetAssetMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.GetAssetRequest, io.aurigraph.v10.proto.Asset>(this, METHODID_GET_ASSET, compression))).addMethod(io.aurigraph.v10.proto.RWAServiceGrpc.getTokenizeAssetMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.TokenizationRequest, io.aurigraph.v10.proto.TokenizationResponse>(this, METHODID_TOKENIZE_ASSET, compression))).addMethod(io.aurigraph.v10.proto.RWAServiceGrpc.getUpdateValuationMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.ValuationUpdate, io.aurigraph.v10.proto.ValuationResponse>(this, METHODID_UPDATE_VALUATION, compression))).addMethod(io.aurigraph.v10.proto.RWAServiceGrpc.getCheckComplianceMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.ComplianceRequest, io.aurigraph.v10.proto.ComplianceStatus>(this, METHODID_CHECK_COMPLIANCE, compression))).build();
        }
    }

    private static final int METHODID_REGISTER_ASSET = 0;

    private static final int METHODID_GET_ASSET = 1;

    private static final int METHODID_TOKENIZE_ASSET = 2;

    private static final int METHODID_UPDATE_VALUATION = 3;

    private static final int METHODID_CHECK_COMPLIANCE = 4;

    private static final class MethodHandlers<Req, Resp> implements io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>, io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {

        private final RWAServiceImplBase serviceImpl;

        private final int methodId;

        private final String compression;

        MethodHandlers(RWAServiceImplBase serviceImpl, int methodId, String compression) {
            this.serviceImpl = serviceImpl;
            this.methodId = methodId;
            this.compression = compression;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                case METHODID_REGISTER_ASSET:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.AssetRegistration) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AssetRegistrationResponse>) responseObserver, compression, serviceImpl::registerAsset);
                    break;
                case METHODID_GET_ASSET:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.GetAssetRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Asset>) responseObserver, compression, serviceImpl::getAsset);
                    break;
                case METHODID_TOKENIZE_ASSET:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.TokenizationRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TokenizationResponse>) responseObserver, compression, serviceImpl::tokenizeAsset);
                    break;
                case METHODID_UPDATE_VALUATION:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.ValuationUpdate) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ValuationResponse>) responseObserver, compression, serviceImpl::updateValuation);
                    break;
                case METHODID_CHECK_COMPLIANCE:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.ComplianceRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ComplianceStatus>) responseObserver, compression, serviceImpl::checkCompliance);
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
