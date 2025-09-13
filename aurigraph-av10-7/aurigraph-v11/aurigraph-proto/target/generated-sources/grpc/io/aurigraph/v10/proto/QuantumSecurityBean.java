package io.aurigraph.v10.proto;

import io.grpc.BindableService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.MutinyBean;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class QuantumSecurityBean extends MutinyQuantumSecurityGrpc.QuantumSecurityImplBase implements BindableService, MutinyBean {

    private final QuantumSecurity delegate;

    QuantumSecurityBean(@GrpcService QuantumSecurity delegate) {
        this.delegate = delegate;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request) {
        try {
            return delegate.generateQuantumKeyPair(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumSignature> quantumSign(io.aurigraph.v10.proto.SignRequest request) {
        try {
            return delegate.quantumSign(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VerificationResult> quantumVerify(io.aurigraph.v10.proto.VerifyRequest request) {
        try {
            return delegate.quantumVerify(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request) {
        try {
            return delegate.rotateKeys(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request) {
        try {
            return delegate.getSecurityMetrics(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }
}
