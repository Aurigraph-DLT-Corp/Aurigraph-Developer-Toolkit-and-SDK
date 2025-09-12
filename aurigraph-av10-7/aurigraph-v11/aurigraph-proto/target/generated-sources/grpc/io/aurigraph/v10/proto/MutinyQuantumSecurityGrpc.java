package io.aurigraph.v10.proto;

import static io.aurigraph.v10.proto.QuantumSecurityGrpc.getServiceDescriptor;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public final class MutinyQuantumSecurityGrpc implements io.quarkus.grpc.MutinyGrpc {

    private MutinyQuantumSecurityGrpc() {
    }

    public static MutinyQuantumSecurityStub newMutinyStub(io.grpc.Channel channel) {
        return new MutinyQuantumSecurityStub(channel);
    }

    /**
     * <pre>
     *  Quantum Security Service
     * </pre>
     */
    public static class MutinyQuantumSecurityStub extends io.grpc.stub.AbstractStub<MutinyQuantumSecurityStub> implements io.quarkus.grpc.MutinyStub {

        private QuantumSecurityGrpc.QuantumSecurityStub delegateStub;

        private MutinyQuantumSecurityStub(io.grpc.Channel channel) {
            super(channel);
            delegateStub = QuantumSecurityGrpc.newStub(channel);
        }

        private MutinyQuantumSecurityStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            super(channel, callOptions);
            delegateStub = QuantumSecurityGrpc.newStub(channel).build(channel, callOptions);
        }

        @Override
        protected MutinyQuantumSecurityStub build(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            return new MutinyQuantumSecurityStub(channel, callOptions);
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::generateQuantumKeyPair);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumSignature> quantumSign(io.aurigraph.v10.proto.SignRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::quantumSign);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VerificationResult> quantumVerify(io.aurigraph.v10.proto.VerifyRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::quantumVerify);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::rotateKeys);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getSecurityMetrics);
        }
    }

    /**
     * <pre>
     *  Quantum Security Service
     * </pre>
     */
    public static abstract class QuantumSecurityImplBase implements io.grpc.BindableService {

        private String compression;

        /**
         * Set whether the server will try to use a compressed response.
         *
         * @param compression the compression, e.g {@code gzip}
         */
        public QuantumSecurityImplBase withCompression(String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumSignature> quantumSign(io.aurigraph.v10.proto.SignRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VerificationResult> quantumVerify(io.aurigraph.v10.proto.VerifyRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        @java.lang.Override
        public io.grpc.ServerServiceDefinition bindService() {
            return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor()).addMethod(io.aurigraph.v10.proto.QuantumSecurityGrpc.getGenerateQuantumKeyPairMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.KeyGenerationRequest, io.aurigraph.v10.proto.QuantumKeyPair>(this, METHODID_GENERATE_QUANTUM_KEY_PAIR, compression))).addMethod(io.aurigraph.v10.proto.QuantumSecurityGrpc.getQuantumSignMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.SignRequest, io.aurigraph.v10.proto.QuantumSignature>(this, METHODID_QUANTUM_SIGN, compression))).addMethod(io.aurigraph.v10.proto.QuantumSecurityGrpc.getQuantumVerifyMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.VerifyRequest, io.aurigraph.v10.proto.VerificationResult>(this, METHODID_QUANTUM_VERIFY, compression))).addMethod(io.aurigraph.v10.proto.QuantumSecurityGrpc.getRotateKeysMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.KeyRotationRequest, io.aurigraph.v10.proto.KeyRotationResponse>(this, METHODID_ROTATE_KEYS, compression))).addMethod(io.aurigraph.v10.proto.QuantumSecurityGrpc.getGetSecurityMetricsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.SecurityMetricsRequest, io.aurigraph.v10.proto.SecurityMetrics>(this, METHODID_GET_SECURITY_METRICS, compression))).build();
        }
    }

    private static final int METHODID_GENERATE_QUANTUM_KEY_PAIR = 0;

    private static final int METHODID_QUANTUM_SIGN = 1;

    private static final int METHODID_QUANTUM_VERIFY = 2;

    private static final int METHODID_ROTATE_KEYS = 3;

    private static final int METHODID_GET_SECURITY_METRICS = 4;

    private static final class MethodHandlers<Req, Resp> implements io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>, io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {

        private final QuantumSecurityImplBase serviceImpl;

        private final int methodId;

        private final String compression;

        MethodHandlers(QuantumSecurityImplBase serviceImpl, int methodId, String compression) {
            this.serviceImpl = serviceImpl;
            this.methodId = methodId;
            this.compression = compression;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                case METHODID_GENERATE_QUANTUM_KEY_PAIR:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.KeyGenerationRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumKeyPair>) responseObserver, compression, serviceImpl::generateQuantumKeyPair);
                    break;
                case METHODID_QUANTUM_SIGN:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.SignRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumSignature>) responseObserver, compression, serviceImpl::quantumSign);
                    break;
                case METHODID_QUANTUM_VERIFY:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.VerifyRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VerificationResult>) responseObserver, compression, serviceImpl::quantumVerify);
                    break;
                case METHODID_ROTATE_KEYS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.KeyRotationRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.KeyRotationResponse>) responseObserver, compression, serviceImpl::rotateKeys);
                    break;
                case METHODID_GET_SECURITY_METRICS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.SecurityMetricsRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SecurityMetrics>) responseObserver, compression, serviceImpl::getSecurityMetrics);
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
