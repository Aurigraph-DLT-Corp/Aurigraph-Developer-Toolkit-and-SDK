package io.aurigraph.v10.proto;

import java.util.function.BiFunction;
import io.quarkus.grpc.MutinyClient;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class RWAServiceClient implements RWAService, MutinyClient<MutinyRWAServiceGrpc.MutinyRWAServiceStub> {

    private final MutinyRWAServiceGrpc.MutinyRWAServiceStub stub;

    public RWAServiceClient(String name, io.grpc.Channel channel, BiFunction<String, MutinyRWAServiceGrpc.MutinyRWAServiceStub, MutinyRWAServiceGrpc.MutinyRWAServiceStub> stubConfigurator) {
        this.stub = stubConfigurator.apply(name, MutinyRWAServiceGrpc.newMutinyStub(channel));
    }

    private RWAServiceClient(MutinyRWAServiceGrpc.MutinyRWAServiceStub stub) {
        this.stub = stub;
    }

    public RWAServiceClient newInstanceWithStub(MutinyRWAServiceGrpc.MutinyRWAServiceStub stub) {
        return new RWAServiceClient(stub);
    }

    @Override
    public MutinyRWAServiceGrpc.MutinyRWAServiceStub getStub() {
        return stub;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(io.aurigraph.v10.proto.AssetRegistration request) {
        return stub.registerAsset(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Asset> getAsset(io.aurigraph.v10.proto.GetAssetRequest request) {
        return stub.getAsset(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request) {
        return stub.tokenizeAsset(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ValuationResponse> updateValuation(io.aurigraph.v10.proto.ValuationUpdate request) {
        return stub.updateValuation(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request) {
        return stub.checkCompliance(request);
    }
}
