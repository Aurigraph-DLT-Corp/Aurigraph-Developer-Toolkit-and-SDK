package io.aurigraph.v10.proto;

import io.quarkus.grpc.MutinyService;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public interface RWAService extends MutinyService {

    /**
     * <pre>
     *  Health &amp; Status
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(io.aurigraph.v10.proto.AssetRegistration request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Asset> getAsset(io.aurigraph.v10.proto.GetAssetRequest request);

    /**
     * <pre>
     *  Transaction Processing
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ValuationResponse> updateValuation(io.aurigraph.v10.proto.ValuationUpdate request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request);
}
