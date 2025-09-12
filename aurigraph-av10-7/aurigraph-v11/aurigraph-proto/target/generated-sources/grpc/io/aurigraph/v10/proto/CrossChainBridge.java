package io.aurigraph.v10.proto;

import io.quarkus.grpc.MutinyService;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public interface CrossChainBridge extends MutinyService {

    /**
     * <pre>
     *  Health &amp; Status
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(io.aurigraph.v10.proto.BridgeRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request);

    /**
     * <pre>
     *  Transaction Processing
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.SwapResponse> executeSwap(io.aurigraph.v10.proto.SwapRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request);
}
