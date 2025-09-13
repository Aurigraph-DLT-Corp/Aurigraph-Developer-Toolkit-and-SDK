package io.aurigraph.v10.proto;

import io.quarkus.grpc.MutinyService;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public interface QuantumSecurity extends MutinyService {

    /**
     * <pre>
     *  Health &amp; Status
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumSignature> quantumSign(io.aurigraph.v10.proto.SignRequest request);

    /**
     * <pre>
     *  Transaction Processing
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VerificationResult> quantumVerify(io.aurigraph.v10.proto.VerifyRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request);
}
