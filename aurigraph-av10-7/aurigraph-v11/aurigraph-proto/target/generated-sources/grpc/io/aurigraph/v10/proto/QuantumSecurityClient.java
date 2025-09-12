package io.aurigraph.v10.proto;

import java.util.function.BiFunction;
import io.quarkus.grpc.MutinyClient;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class QuantumSecurityClient implements QuantumSecurity, MutinyClient<MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub> {

    private final MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub stub;

    public QuantumSecurityClient(String name, io.grpc.Channel channel, BiFunction<String, MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub, MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub> stubConfigurator) {
        this.stub = stubConfigurator.apply(name, MutinyQuantumSecurityGrpc.newMutinyStub(channel));
    }

    private QuantumSecurityClient(MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub stub) {
        this.stub = stub;
    }

    public QuantumSecurityClient newInstanceWithStub(MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub stub) {
        return new QuantumSecurityClient(stub);
    }

    @Override
    public MutinyQuantumSecurityGrpc.MutinyQuantumSecurityStub getStub() {
        return stub;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request) {
        return stub.generateQuantumKeyPair(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.QuantumSignature> quantumSign(io.aurigraph.v10.proto.SignRequest request) {
        return stub.quantumSign(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VerificationResult> quantumVerify(io.aurigraph.v10.proto.VerifyRequest request) {
        return stub.quantumVerify(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request) {
        return stub.rotateKeys(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request) {
        return stub.getSecurityMetrics(request);
    }
}
