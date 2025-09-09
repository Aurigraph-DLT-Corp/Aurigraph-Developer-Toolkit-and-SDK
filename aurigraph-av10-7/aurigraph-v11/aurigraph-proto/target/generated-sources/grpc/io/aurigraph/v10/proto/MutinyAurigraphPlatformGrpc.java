package io.aurigraph.v10.proto;

import static io.aurigraph.v10.proto.AurigraphPlatformGrpc.getServiceDescriptor;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;

@jakarta.annotation.Generated(value = "by Mutiny Grpc generator", comments = "Source: aurigraph.proto")
public final class MutinyAurigraphPlatformGrpc implements io.quarkus.grpc.MutinyGrpc {

    private MutinyAurigraphPlatformGrpc() {
    }

    public static MutinyAurigraphPlatformStub newMutinyStub(io.grpc.Channel channel) {
        return new MutinyAurigraphPlatformStub(channel);
    }

    /**
     * <pre>
     *  Main Aurigraph Platform Service
     * </pre>
     */
    public static class MutinyAurigraphPlatformStub extends io.grpc.stub.AbstractStub<MutinyAurigraphPlatformStub> implements io.quarkus.grpc.MutinyStub {

        private AurigraphPlatformGrpc.AurigraphPlatformStub delegateStub;

        private MutinyAurigraphPlatformStub(io.grpc.Channel channel) {
            super(channel);
            delegateStub = AurigraphPlatformGrpc.newStub(channel);
        }

        private MutinyAurigraphPlatformStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            super(channel, callOptions);
            delegateStub = AurigraphPlatformGrpc.newStub(channel).build(channel, callOptions);
        }

        @Override
        protected MutinyAurigraphPlatformStub build(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
            return new MutinyAurigraphPlatformStub(channel, callOptions);
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.HealthResponse> getHealth(io.aurigraph.v10.proto.HealthRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getHealth);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.MetricsResponse> getMetrics(io.aurigraph.v10.proto.MetricsRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getMetrics);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(io.aurigraph.v10.proto.Transaction request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::submitTransaction);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::batchSubmitTransactions);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Transaction> getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getTransaction);
        }

        /**
         * <pre>
         *  Block Operations
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Block> getBlock(io.aurigraph.v10.proto.GetBlockRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getBlock);
        }

        /**
         * <pre>
         *  Consensus Operations
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(io.aurigraph.v10.proto.Block request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::proposeBlock);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(io.aurigraph.v10.proto.Vote request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::voteOnProposal);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConsensusState> getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getConsensusState);
        }

        /**
         * <pre>
         *  Node Management
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(io.aurigraph.v10.proto.NodeRegistration request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::registerNode);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::getNodeStatus);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToOne(request, delegateStub::updateNodeConfig);
        }

        public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.Block> subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request) {
            return io.quarkus.grpc.stubs.ClientCalls.oneToMany(request, delegateStub::subscribeBlocks);
        }
    }

    /**
     * <pre>
     *  Main Aurigraph Platform Service
     * </pre>
     */
    public static abstract class AurigraphPlatformImplBase implements io.grpc.BindableService {

        private String compression;

        /**
         * Set whether the server will try to use a compressed response.
         *
         * @param compression the compression, e.g {@code gzip}
         */
        public AurigraphPlatformImplBase withCompression(String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * <pre>
         *  Health &amp; Status
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.HealthResponse> getHealth(io.aurigraph.v10.proto.HealthRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.MetricsResponse> getMetrics(io.aurigraph.v10.proto.MetricsRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Transaction Processing
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(io.aurigraph.v10.proto.Transaction request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Transaction> getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Block Operations
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.Block> getBlock(io.aurigraph.v10.proto.GetBlockRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Consensus Operations
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(io.aurigraph.v10.proto.Block request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(io.aurigraph.v10.proto.Vote request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConsensusState> getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        /**
         * <pre>
         *  Node Management
         * </pre>
         */
        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(io.aurigraph.v10.proto.NodeRegistration request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Uni<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        public io.smallrye.mutiny.Multi<io.aurigraph.v10.proto.Block> subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request) {
            throw new io.grpc.StatusRuntimeException(io.grpc.Status.UNIMPLEMENTED);
        }

        @java.lang.Override
        public io.grpc.ServerServiceDefinition bindService() {
            return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor()).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetHealthMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.HealthRequest, io.aurigraph.v10.proto.HealthResponse>(this, METHODID_GET_HEALTH, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetMetricsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.MetricsRequest, io.aurigraph.v10.proto.MetricsResponse>(this, METHODID_GET_METRICS, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getSubmitTransactionMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.Transaction, io.aurigraph.v10.proto.TransactionResponse>(this, METHODID_SUBMIT_TRANSACTION, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getBatchSubmitTransactionsMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.BatchTransactionRequest, io.aurigraph.v10.proto.BatchTransactionResponse>(this, METHODID_BATCH_SUBMIT_TRANSACTIONS, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetTransactionMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.GetTransactionRequest, io.aurigraph.v10.proto.Transaction>(this, METHODID_GET_TRANSACTION, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetBlockMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.GetBlockRequest, io.aurigraph.v10.proto.Block>(this, METHODID_GET_BLOCK, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getSubscribeBlocksMethod(), asyncServerStreamingCall(new MethodHandlers<io.aurigraph.v10.proto.BlockSubscriptionRequest, io.aurigraph.v10.proto.Block>(this, METHODID_SUBSCRIBE_BLOCKS, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getProposeBlockMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.Block, io.aurigraph.v10.proto.ProposalResponse>(this, METHODID_PROPOSE_BLOCK, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getVoteOnProposalMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.Vote, io.aurigraph.v10.proto.VoteResponse>(this, METHODID_VOTE_ON_PROPOSAL, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetConsensusStateMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.ConsensusStateRequest, io.aurigraph.v10.proto.ConsensusState>(this, METHODID_GET_CONSENSUS_STATE, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getRegisterNodeMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.NodeRegistration, io.aurigraph.v10.proto.NodeRegistrationResponse>(this, METHODID_REGISTER_NODE, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getGetNodeStatusMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.NodeStatusRequest, io.aurigraph.v10.proto.NodeStatus>(this, METHODID_GET_NODE_STATUS, compression))).addMethod(io.aurigraph.v10.proto.AurigraphPlatformGrpc.getUpdateNodeConfigMethod(), asyncUnaryCall(new MethodHandlers<io.aurigraph.v10.proto.NodeConfig, io.aurigraph.v10.proto.ConfigUpdateResponse>(this, METHODID_UPDATE_NODE_CONFIG, compression))).build();
        }
    }

    private static final int METHODID_GET_HEALTH = 0;

    private static final int METHODID_GET_METRICS = 1;

    private static final int METHODID_SUBMIT_TRANSACTION = 2;

    private static final int METHODID_BATCH_SUBMIT_TRANSACTIONS = 3;

    private static final int METHODID_GET_TRANSACTION = 4;

    private static final int METHODID_GET_BLOCK = 5;

    private static final int METHODID_SUBSCRIBE_BLOCKS = 6;

    private static final int METHODID_PROPOSE_BLOCK = 7;

    private static final int METHODID_VOTE_ON_PROPOSAL = 8;

    private static final int METHODID_GET_CONSENSUS_STATE = 9;

    private static final int METHODID_REGISTER_NODE = 10;

    private static final int METHODID_GET_NODE_STATUS = 11;

    private static final int METHODID_UPDATE_NODE_CONFIG = 12;

    private static final class MethodHandlers<Req, Resp> implements io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>, io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>, io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {

        private final AurigraphPlatformImplBase serviceImpl;

        private final int methodId;

        private final String compression;

        MethodHandlers(AurigraphPlatformImplBase serviceImpl, int methodId, String compression) {
            this.serviceImpl = serviceImpl;
            this.methodId = methodId;
            this.compression = compression;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                case METHODID_GET_HEALTH:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.HealthRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.HealthResponse>) responseObserver, compression, serviceImpl::getHealth);
                    break;
                case METHODID_GET_METRICS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.MetricsRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.MetricsResponse>) responseObserver, compression, serviceImpl::getMetrics);
                    break;
                case METHODID_SUBMIT_TRANSACTION:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.Transaction) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TransactionResponse>) responseObserver, compression, serviceImpl::submitTransaction);
                    break;
                case METHODID_BATCH_SUBMIT_TRANSACTIONS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.BatchTransactionRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BatchTransactionResponse>) responseObserver, compression, serviceImpl::batchSubmitTransactions);
                    break;
                case METHODID_GET_TRANSACTION:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.GetTransactionRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Transaction>) responseObserver, compression, serviceImpl::getTransaction);
                    break;
                case METHODID_GET_BLOCK:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.GetBlockRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block>) responseObserver, compression, serviceImpl::getBlock);
                    break;
                case METHODID_SUBSCRIBE_BLOCKS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToMany((io.aurigraph.v10.proto.BlockSubscriptionRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block>) responseObserver, compression, serviceImpl::subscribeBlocks);
                    break;
                case METHODID_PROPOSE_BLOCK:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.Block) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ProposalResponse>) responseObserver, compression, serviceImpl::proposeBlock);
                    break;
                case METHODID_VOTE_ON_PROPOSAL:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.Vote) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VoteResponse>) responseObserver, compression, serviceImpl::voteOnProposal);
                    break;
                case METHODID_GET_CONSENSUS_STATE:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.ConsensusStateRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConsensusState>) responseObserver, compression, serviceImpl::getConsensusState);
                    break;
                case METHODID_REGISTER_NODE:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.NodeRegistration) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeRegistrationResponse>) responseObserver, compression, serviceImpl::registerNode);
                    break;
                case METHODID_GET_NODE_STATUS:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.NodeStatusRequest) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeStatus>) responseObserver, compression, serviceImpl::getNodeStatus);
                    break;
                case METHODID_UPDATE_NODE_CONFIG:
                    io.quarkus.grpc.stubs.ServerCalls.oneToOne((io.aurigraph.v10.proto.NodeConfig) request, (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConfigUpdateResponse>) responseObserver, compression, serviceImpl::updateNodeConfig);
                    break;
                default:
                    throw new java.lang.AssertionError();
            }
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("unchecked")
        public io.grpc.stub.StreamObserver<Req> invoke(io.grpc.stub.StreamObserver<Resp> responseObserver) {
            switch(methodId) {
                default:
                    throw new java.lang.AssertionError();
            }
        }
    }
}
