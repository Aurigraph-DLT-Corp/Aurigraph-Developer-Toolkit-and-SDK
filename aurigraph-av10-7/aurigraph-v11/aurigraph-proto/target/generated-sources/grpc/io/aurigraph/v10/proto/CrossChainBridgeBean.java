package io.aurigraph.v10.proto;

import io.grpc.BindableService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.MutinyBean;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class CrossChainBridgeBean extends MutinyCrossChainBridgeGrpc.CrossChainBridgeImplBase implements BindableService, MutinyBean {

    private final CrossChainBridge delegate;

    CrossChainBridgeBean(@GrpcService CrossChainBridge delegate) {
        this.delegate = delegate;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(io.aurigraph.v10.proto.BridgeRequest request) {
        try {
            return delegate.initiateBridge(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request) {
        try {
            return delegate.getBridgeStatus(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request) {
        try {
            return delegate.listSupportedChains(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SwapResponse> executeSwap(io.aurigraph.v10.proto.SwapRequest request) {
        try {
            return delegate.executeSwap(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request) {
        try {
            return delegate.getBridgeMetrics(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }
}
