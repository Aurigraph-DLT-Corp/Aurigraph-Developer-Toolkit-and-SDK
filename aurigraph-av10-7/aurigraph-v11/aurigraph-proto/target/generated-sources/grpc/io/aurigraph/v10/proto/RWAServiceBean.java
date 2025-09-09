package io.aurigraph.v10.proto;

import io.grpc.BindableService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.MutinyBean;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class RWAServiceBean extends MutinyRWAServiceGrpc.RWAServiceImplBase implements BindableService, MutinyBean {

    private final RWAService delegate;

    RWAServiceBean(@GrpcService RWAService delegate) {
        this.delegate = delegate;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(io.aurigraph.v10.proto.AssetRegistration request) {
        try {
            return delegate.registerAsset(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Asset> getAsset(io.aurigraph.v10.proto.GetAssetRequest request) {
        try {
            return delegate.getAsset(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request) {
        try {
            return delegate.tokenizeAsset(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ValuationResponse> updateValuation(io.aurigraph.v10.proto.ValuationUpdate request) {
        try {
            return delegate.updateValuation(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request) {
        try {
            return delegate.checkCompliance(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }
}
