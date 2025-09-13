package io.aurigraph.v10.proto;

import io.quarkus.grpc.MutinyService;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public interface AurigraphPlatform extends MutinyService {

    /**
     * <pre>
     *  Health &amp; Status
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.HealthResponse> getHealth(io.aurigraph.v10.proto.HealthRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.MetricsResponse> getMetrics(io.aurigraph.v10.proto.MetricsRequest request);

    /**
     * <pre>
     *  Transaction Processing
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(io.aurigraph.v10.proto.Transaction request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Transaction> getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request);

    /**
     * <pre>
     *  Block Operations
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Block> getBlock(io.aurigraph.v10.proto.GetBlockRequest request);

    /**
     * <pre>
     *  Consensus Operations
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(io.aurigraph.v10.proto.Block request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(io.aurigraph.v10.proto.Vote request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConsensusState> getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request);

    /**
     * <pre>
     *  Node Management
     * </pre>
     */
    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(io.aurigraph.v10.proto.NodeRegistration request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request);

    io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request);

    io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.Block> subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request);
}
