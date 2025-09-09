package io.aurigraph.v10.proto;

import java.util.function.BiFunction;
import io.quarkus.grpc.MutinyClient;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public class AurigraphPlatformClient implements AurigraphPlatform, MutinyClient<MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub> {

    private final MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub stub;

    public AurigraphPlatformClient(String name, io.grpc.Channel channel, BiFunction<String, MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub, MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub> stubConfigurator) {
        this.stub = stubConfigurator.apply(name, MutinyAurigraphPlatformGrpc.newMutinyStub(channel));
    }

    private AurigraphPlatformClient(MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub stub) {
        this.stub = stub;
    }

    public AurigraphPlatformClient newInstanceWithStub(MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub stub) {
        return new AurigraphPlatformClient(stub);
    }

    @Override
    public MutinyAurigraphPlatformGrpc.MutinyAurigraphPlatformStub getStub() {
        return stub;
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.HealthResponse> getHealth(io.aurigraph.v10.proto.HealthRequest request) {
        return stub.getHealth(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.MetricsResponse> getMetrics(io.aurigraph.v10.proto.MetricsRequest request) {
        return stub.getMetrics(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(io.aurigraph.v10.proto.Transaction request) {
        return stub.submitTransaction(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request) {
        return stub.batchSubmitTransactions(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Transaction> getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request) {
        return stub.getTransaction(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Block> getBlock(io.aurigraph.v10.proto.GetBlockRequest request) {
        return stub.getBlock(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(io.aurigraph.v10.proto.Block request) {
        return stub.proposeBlock(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(io.aurigraph.v10.proto.Vote request) {
        return stub.voteOnProposal(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConsensusState> getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request) {
        return stub.getConsensusState(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(io.aurigraph.v10.proto.NodeRegistration request) {
        return stub.registerNode(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request) {
        return stub.getNodeStatus(request);
    }

    @Override
    public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request) {
        return stub.updateNodeConfig(request);
    }

    @Override
    public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.Block> subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request) {
        return stub.subscribeBlocks(request);
    }
}
