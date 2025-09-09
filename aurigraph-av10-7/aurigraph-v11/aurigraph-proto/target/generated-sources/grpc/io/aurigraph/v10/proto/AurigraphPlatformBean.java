package io.aurigraph.v10.proto;

import io.grpc.BindableService;
import io.quarkus.grpc.GrpcService;
import io.quarkus.grpc.MutinyBean;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class AurigraphPlatformBean extends MutinyAurigraphPlatformGrpc.AurigraphPlatformImplBase implements BindableService, MutinyBean {

    private final AurigraphPlatform delegate;

    AurigraphPlatformBean(@GrpcService AurigraphPlatform delegate) {
        this.delegate = delegate;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.HealthResponse> getHealth(io.aurigraph.v10.proto.HealthRequest request) {
        try {
            return delegate.getHealth(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.MetricsResponse> getMetrics(io.aurigraph.v10.proto.MetricsRequest request) {
        try {
            return delegate.getMetrics(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(io.aurigraph.v10.proto.Transaction request) {
        try {
            return delegate.submitTransaction(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request) {
        try {
            return delegate.batchSubmitTransactions(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Transaction> getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request) {
        try {
            return delegate.getTransaction(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Block> getBlock(io.aurigraph.v10.proto.GetBlockRequest request) {
        try {
            return delegate.getBlock(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(io.aurigraph.v10.proto.Block request) {
        try {
            return delegate.proposeBlock(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(io.aurigraph.v10.proto.Vote request) {
        try {
            return delegate.voteOnProposal(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConsensusState> getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request) {
        try {
            return delegate.getConsensusState(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(io.aurigraph.v10.proto.NodeRegistration request) {
        try {
            return delegate.registerNode(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request) {
        try {
            return delegate.getNodeStatus(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request) {
        try {
            return delegate.updateNodeConfig(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }

    @Override
    public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.Block> subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request) {
        try {
            return delegate.subscribeBlocks(request);
        } catch (UnsupportedOperationException e) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }
    }
}
