package io.aurigraph.v10.proto;

import java.util.function.BiFunction;
import io.quarkus.grpc.MutinyClient;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class CrossChainBridgeClient implements CrossChainBridge, MutinyClient<MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub> {

    private final MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub stub;

    public CrossChainBridgeClient(String name, io.grpc.Channel channel, BiFunction<String, MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub, MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub> stubConfigurator) {
        this.stub = stubConfigurator.apply(name, MutinyCrossChainBridgeGrpc.newMutinyStub(channel));
    }

    private CrossChainBridgeClient(MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub stub) {
        this.stub = stub;
    }

    public CrossChainBridgeClient newInstanceWithStub(MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub stub) {
        return new CrossChainBridgeClient(stub);
    }

    @Override
    public MutinyCrossChainBridgeGrpc.MutinyCrossChainBridgeStub getStub() {
        return stub;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(io.aurigraph.v10.proto.BridgeRequest request) {
        return stub.initiateBridge(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request) {
        return stub.getBridgeStatus(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request) {
        return stub.listSupportedChains(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SwapResponse> executeSwap(io.aurigraph.v10.proto.SwapRequest request) {
        return stub.executeSwap(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request) {
        return stub.getBridgeMetrics(request);
    }
}
