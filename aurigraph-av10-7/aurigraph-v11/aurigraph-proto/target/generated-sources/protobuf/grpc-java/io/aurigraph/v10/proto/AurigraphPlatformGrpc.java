package io.aurigraph.v10.proto;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Main Aurigraph Platform Service
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: aurigraph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class AurigraphPlatformGrpc {

  private AurigraphPlatformGrpc() {}

  public static final java.lang.String SERVICE_NAME = "aurigraph.v10.AurigraphPlatform";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.HealthRequest,
      io.aurigraph.v10.proto.HealthResponse> getGetHealthMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetHealth",
      requestType = io.aurigraph.v10.proto.HealthRequest.class,
      responseType = io.aurigraph.v10.proto.HealthResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.HealthRequest,
      io.aurigraph.v10.proto.HealthResponse> getGetHealthMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.HealthRequest, io.aurigraph.v10.proto.HealthResponse> getGetHealthMethod;
    if ((getGetHealthMethod = AurigraphPlatformGrpc.getGetHealthMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetHealthMethod = AurigraphPlatformGrpc.getGetHealthMethod) == null) {
          AurigraphPlatformGrpc.getGetHealthMethod = getGetHealthMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.HealthRequest, io.aurigraph.v10.proto.HealthResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetHealth"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.HealthRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.HealthResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetHealth"))
              .build();
        }
      }
    }
    return getGetHealthMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.MetricsRequest,
      io.aurigraph.v10.proto.MetricsResponse> getGetMetricsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetMetrics",
      requestType = io.aurigraph.v10.proto.MetricsRequest.class,
      responseType = io.aurigraph.v10.proto.MetricsResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.MetricsRequest,
      io.aurigraph.v10.proto.MetricsResponse> getGetMetricsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.MetricsRequest, io.aurigraph.v10.proto.MetricsResponse> getGetMetricsMethod;
    if ((getGetMetricsMethod = AurigraphPlatformGrpc.getGetMetricsMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetMetricsMethod = AurigraphPlatformGrpc.getGetMetricsMethod) == null) {
          AurigraphPlatformGrpc.getGetMetricsMethod = getGetMetricsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.MetricsRequest, io.aurigraph.v10.proto.MetricsResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetMetrics"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.MetricsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.MetricsResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetMetrics"))
              .build();
        }
      }
    }
    return getGetMetricsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Transaction,
      io.aurigraph.v10.proto.TransactionResponse> getSubmitTransactionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SubmitTransaction",
      requestType = io.aurigraph.v10.proto.Transaction.class,
      responseType = io.aurigraph.v10.proto.TransactionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Transaction,
      io.aurigraph.v10.proto.TransactionResponse> getSubmitTransactionMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Transaction, io.aurigraph.v10.proto.TransactionResponse> getSubmitTransactionMethod;
    if ((getSubmitTransactionMethod = AurigraphPlatformGrpc.getSubmitTransactionMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getSubmitTransactionMethod = AurigraphPlatformGrpc.getSubmitTransactionMethod) == null) {
          AurigraphPlatformGrpc.getSubmitTransactionMethod = getSubmitTransactionMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.Transaction, io.aurigraph.v10.proto.TransactionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SubmitTransaction"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Transaction.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TransactionResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("SubmitTransaction"))
              .build();
        }
      }
    }
    return getSubmitTransactionMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BatchTransactionRequest,
      io.aurigraph.v10.proto.BatchTransactionResponse> getBatchSubmitTransactionsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "BatchSubmitTransactions",
      requestType = io.aurigraph.v10.proto.BatchTransactionRequest.class,
      responseType = io.aurigraph.v10.proto.BatchTransactionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BatchTransactionRequest,
      io.aurigraph.v10.proto.BatchTransactionResponse> getBatchSubmitTransactionsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BatchTransactionRequest, io.aurigraph.v10.proto.BatchTransactionResponse> getBatchSubmitTransactionsMethod;
    if ((getBatchSubmitTransactionsMethod = AurigraphPlatformGrpc.getBatchSubmitTransactionsMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getBatchSubmitTransactionsMethod = AurigraphPlatformGrpc.getBatchSubmitTransactionsMethod) == null) {
          AurigraphPlatformGrpc.getBatchSubmitTransactionsMethod = getBatchSubmitTransactionsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.BatchTransactionRequest, io.aurigraph.v10.proto.BatchTransactionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "BatchSubmitTransactions"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BatchTransactionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BatchTransactionResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("BatchSubmitTransactions"))
              .build();
        }
      }
    }
    return getBatchSubmitTransactionsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetTransactionRequest,
      io.aurigraph.v10.proto.Transaction> getGetTransactionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetTransaction",
      requestType = io.aurigraph.v10.proto.GetTransactionRequest.class,
      responseType = io.aurigraph.v10.proto.Transaction.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetTransactionRequest,
      io.aurigraph.v10.proto.Transaction> getGetTransactionMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetTransactionRequest, io.aurigraph.v10.proto.Transaction> getGetTransactionMethod;
    if ((getGetTransactionMethod = AurigraphPlatformGrpc.getGetTransactionMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetTransactionMethod = AurigraphPlatformGrpc.getGetTransactionMethod) == null) {
          AurigraphPlatformGrpc.getGetTransactionMethod = getGetTransactionMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.GetTransactionRequest, io.aurigraph.v10.proto.Transaction>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetTransaction"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.GetTransactionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Transaction.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetTransaction"))
              .build();
        }
      }
    }
    return getGetTransactionMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetBlockRequest,
      io.aurigraph.v10.proto.Block> getGetBlockMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetBlock",
      requestType = io.aurigraph.v10.proto.GetBlockRequest.class,
      responseType = io.aurigraph.v10.proto.Block.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetBlockRequest,
      io.aurigraph.v10.proto.Block> getGetBlockMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetBlockRequest, io.aurigraph.v10.proto.Block> getGetBlockMethod;
    if ((getGetBlockMethod = AurigraphPlatformGrpc.getGetBlockMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetBlockMethod = AurigraphPlatformGrpc.getGetBlockMethod) == null) {
          AurigraphPlatformGrpc.getGetBlockMethod = getGetBlockMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.GetBlockRequest, io.aurigraph.v10.proto.Block>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetBlock"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.GetBlockRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Block.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetBlock"))
              .build();
        }
      }
    }
    return getGetBlockMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BlockSubscriptionRequest,
      io.aurigraph.v10.proto.Block> getSubscribeBlocksMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SubscribeBlocks",
      requestType = io.aurigraph.v10.proto.BlockSubscriptionRequest.class,
      responseType = io.aurigraph.v10.proto.Block.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BlockSubscriptionRequest,
      io.aurigraph.v10.proto.Block> getSubscribeBlocksMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BlockSubscriptionRequest, io.aurigraph.v10.proto.Block> getSubscribeBlocksMethod;
    if ((getSubscribeBlocksMethod = AurigraphPlatformGrpc.getSubscribeBlocksMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getSubscribeBlocksMethod = AurigraphPlatformGrpc.getSubscribeBlocksMethod) == null) {
          AurigraphPlatformGrpc.getSubscribeBlocksMethod = getSubscribeBlocksMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.BlockSubscriptionRequest, io.aurigraph.v10.proto.Block>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SubscribeBlocks"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BlockSubscriptionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Block.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("SubscribeBlocks"))
              .build();
        }
      }
    }
    return getSubscribeBlocksMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Block,
      io.aurigraph.v10.proto.ProposalResponse> getProposeBlockMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ProposeBlock",
      requestType = io.aurigraph.v10.proto.Block.class,
      responseType = io.aurigraph.v10.proto.ProposalResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Block,
      io.aurigraph.v10.proto.ProposalResponse> getProposeBlockMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Block, io.aurigraph.v10.proto.ProposalResponse> getProposeBlockMethod;
    if ((getProposeBlockMethod = AurigraphPlatformGrpc.getProposeBlockMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getProposeBlockMethod = AurigraphPlatformGrpc.getProposeBlockMethod) == null) {
          AurigraphPlatformGrpc.getProposeBlockMethod = getProposeBlockMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.Block, io.aurigraph.v10.proto.ProposalResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ProposeBlock"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Block.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ProposalResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("ProposeBlock"))
              .build();
        }
      }
    }
    return getProposeBlockMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Vote,
      io.aurigraph.v10.proto.VoteResponse> getVoteOnProposalMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "VoteOnProposal",
      requestType = io.aurigraph.v10.proto.Vote.class,
      responseType = io.aurigraph.v10.proto.VoteResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Vote,
      io.aurigraph.v10.proto.VoteResponse> getVoteOnProposalMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.Vote, io.aurigraph.v10.proto.VoteResponse> getVoteOnProposalMethod;
    if ((getVoteOnProposalMethod = AurigraphPlatformGrpc.getVoteOnProposalMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getVoteOnProposalMethod = AurigraphPlatformGrpc.getVoteOnProposalMethod) == null) {
          AurigraphPlatformGrpc.getVoteOnProposalMethod = getVoteOnProposalMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.Vote, io.aurigraph.v10.proto.VoteResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "VoteOnProposal"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Vote.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.VoteResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("VoteOnProposal"))
              .build();
        }
      }
    }
    return getVoteOnProposalMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ConsensusStateRequest,
      io.aurigraph.v10.proto.ConsensusState> getGetConsensusStateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetConsensusState",
      requestType = io.aurigraph.v10.proto.ConsensusStateRequest.class,
      responseType = io.aurigraph.v10.proto.ConsensusState.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ConsensusStateRequest,
      io.aurigraph.v10.proto.ConsensusState> getGetConsensusStateMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ConsensusStateRequest, io.aurigraph.v10.proto.ConsensusState> getGetConsensusStateMethod;
    if ((getGetConsensusStateMethod = AurigraphPlatformGrpc.getGetConsensusStateMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetConsensusStateMethod = AurigraphPlatformGrpc.getGetConsensusStateMethod) == null) {
          AurigraphPlatformGrpc.getGetConsensusStateMethod = getGetConsensusStateMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.ConsensusStateRequest, io.aurigraph.v10.proto.ConsensusState>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetConsensusState"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ConsensusStateRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ConsensusState.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetConsensusState"))
              .build();
        }
      }
    }
    return getGetConsensusStateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeRegistration,
      io.aurigraph.v10.proto.NodeRegistrationResponse> getRegisterNodeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RegisterNode",
      requestType = io.aurigraph.v10.proto.NodeRegistration.class,
      responseType = io.aurigraph.v10.proto.NodeRegistrationResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeRegistration,
      io.aurigraph.v10.proto.NodeRegistrationResponse> getRegisterNodeMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeRegistration, io.aurigraph.v10.proto.NodeRegistrationResponse> getRegisterNodeMethod;
    if ((getRegisterNodeMethod = AurigraphPlatformGrpc.getRegisterNodeMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getRegisterNodeMethod = AurigraphPlatformGrpc.getRegisterNodeMethod) == null) {
          AurigraphPlatformGrpc.getRegisterNodeMethod = getRegisterNodeMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.NodeRegistration, io.aurigraph.v10.proto.NodeRegistrationResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RegisterNode"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.NodeRegistration.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.NodeRegistrationResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("RegisterNode"))
              .build();
        }
      }
    }
    return getRegisterNodeMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeStatusRequest,
      io.aurigraph.v10.proto.NodeStatus> getGetNodeStatusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetNodeStatus",
      requestType = io.aurigraph.v10.proto.NodeStatusRequest.class,
      responseType = io.aurigraph.v10.proto.NodeStatus.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeStatusRequest,
      io.aurigraph.v10.proto.NodeStatus> getGetNodeStatusMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeStatusRequest, io.aurigraph.v10.proto.NodeStatus> getGetNodeStatusMethod;
    if ((getGetNodeStatusMethod = AurigraphPlatformGrpc.getGetNodeStatusMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getGetNodeStatusMethod = AurigraphPlatformGrpc.getGetNodeStatusMethod) == null) {
          AurigraphPlatformGrpc.getGetNodeStatusMethod = getGetNodeStatusMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.NodeStatusRequest, io.aurigraph.v10.proto.NodeStatus>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetNodeStatus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.NodeStatusRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.NodeStatus.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("GetNodeStatus"))
              .build();
        }
      }
    }
    return getGetNodeStatusMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeConfig,
      io.aurigraph.v10.proto.ConfigUpdateResponse> getUpdateNodeConfigMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UpdateNodeConfig",
      requestType = io.aurigraph.v10.proto.NodeConfig.class,
      responseType = io.aurigraph.v10.proto.ConfigUpdateResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeConfig,
      io.aurigraph.v10.proto.ConfigUpdateResponse> getUpdateNodeConfigMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.NodeConfig, io.aurigraph.v10.proto.ConfigUpdateResponse> getUpdateNodeConfigMethod;
    if ((getUpdateNodeConfigMethod = AurigraphPlatformGrpc.getUpdateNodeConfigMethod) == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        if ((getUpdateNodeConfigMethod = AurigraphPlatformGrpc.getUpdateNodeConfigMethod) == null) {
          AurigraphPlatformGrpc.getUpdateNodeConfigMethod = getUpdateNodeConfigMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.NodeConfig, io.aurigraph.v10.proto.ConfigUpdateResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UpdateNodeConfig"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.NodeConfig.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ConfigUpdateResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AurigraphPlatformMethodDescriptorSupplier("UpdateNodeConfig"))
              .build();
        }
      }
    }
    return getUpdateNodeConfigMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static AurigraphPlatformStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformStub>() {
        @java.lang.Override
        public AurigraphPlatformStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AurigraphPlatformStub(channel, callOptions);
        }
      };
    return AurigraphPlatformStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static AurigraphPlatformBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformBlockingStub>() {
        @java.lang.Override
        public AurigraphPlatformBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AurigraphPlatformBlockingStub(channel, callOptions);
        }
      };
    return AurigraphPlatformBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static AurigraphPlatformFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AurigraphPlatformFutureStub>() {
        @java.lang.Override
        public AurigraphPlatformFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AurigraphPlatformFutureStub(channel, callOptions);
        }
      };
    return AurigraphPlatformFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Main Aurigraph Platform Service
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * Health &amp; Status
     * </pre>
     */
    default void getHealth(io.aurigraph.v10.proto.HealthRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.HealthResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetHealthMethod(), responseObserver);
    }

    /**
     */
    default void getMetrics(io.aurigraph.v10.proto.MetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.MetricsResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetMetricsMethod(), responseObserver);
    }

    /**
     * <pre>
     * Transaction Processing
     * </pre>
     */
    default void submitTransaction(io.aurigraph.v10.proto.Transaction request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TransactionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSubmitTransactionMethod(), responseObserver);
    }

    /**
     */
    default void batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BatchTransactionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getBatchSubmitTransactionsMethod(), responseObserver);
    }

    /**
     */
    default void getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Transaction> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetTransactionMethod(), responseObserver);
    }

    /**
     * <pre>
     * Block Operations
     * </pre>
     */
    default void getBlock(io.aurigraph.v10.proto.GetBlockRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetBlockMethod(), responseObserver);
    }

    /**
     */
    default void subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSubscribeBlocksMethod(), responseObserver);
    }

    /**
     * <pre>
     * Consensus Operations
     * </pre>
     */
    default void proposeBlock(io.aurigraph.v10.proto.Block request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ProposalResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getProposeBlockMethod(), responseObserver);
    }

    /**
     */
    default void voteOnProposal(io.aurigraph.v10.proto.Vote request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VoteResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getVoteOnProposalMethod(), responseObserver);
    }

    /**
     */
    default void getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConsensusState> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetConsensusStateMethod(), responseObserver);
    }

    /**
     * <pre>
     * Node Management
     * </pre>
     */
    default void registerNode(io.aurigraph.v10.proto.NodeRegistration request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeRegistrationResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRegisterNodeMethod(), responseObserver);
    }

    /**
     */
    default void getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeStatus> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetNodeStatusMethod(), responseObserver);
    }

    /**
     */
    default void updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConfigUpdateResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getUpdateNodeConfigMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service AurigraphPlatform.
   * <pre>
   * Main Aurigraph Platform Service
   * </pre>
   */
  public static abstract class AurigraphPlatformImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return AurigraphPlatformGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service AurigraphPlatform.
   * <pre>
   * Main Aurigraph Platform Service
   * </pre>
   */
  public static final class AurigraphPlatformStub
      extends io.grpc.stub.AbstractAsyncStub<AurigraphPlatformStub> {
    private AurigraphPlatformStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AurigraphPlatformStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AurigraphPlatformStub(channel, callOptions);
    }

    /**
     * <pre>
     * Health &amp; Status
     * </pre>
     */
    public void getHealth(io.aurigraph.v10.proto.HealthRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.HealthResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetHealthMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getMetrics(io.aurigraph.v10.proto.MetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.MetricsResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetMetricsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Transaction Processing
     * </pre>
     */
    public void submitTransaction(io.aurigraph.v10.proto.Transaction request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TransactionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSubmitTransactionMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BatchTransactionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getBatchSubmitTransactionsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Transaction> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetTransactionMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Block Operations
     * </pre>
     */
    public void getBlock(io.aurigraph.v10.proto.GetBlockRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetBlockMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void subscribeBlocks(io.aurigraph.v10.proto.BlockSubscriptionRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSubscribeBlocksMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Consensus Operations
     * </pre>
     */
    public void proposeBlock(io.aurigraph.v10.proto.Block request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ProposalResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getProposeBlockMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void voteOnProposal(io.aurigraph.v10.proto.Vote request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VoteResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getVoteOnProposalMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConsensusState> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetConsensusStateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Node Management
     * </pre>
     */
    public void registerNode(io.aurigraph.v10.proto.NodeRegistration request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeRegistrationResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRegisterNodeMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeStatus> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetNodeStatusMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConfigUpdateResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getUpdateNodeConfigMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service AurigraphPlatform.
   * <pre>
   * Main Aurigraph Platform Service
   * </pre>
   */
  public static final class AurigraphPlatformBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<AurigraphPlatformBlockingStub> {
    private AurigraphPlatformBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AurigraphPlatformBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AurigraphPlatformBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Health &amp; Status
     * </pre>
     */
    public io.aurigraph.v10.proto.HealthResponse getHealth(io.aurigraph.v10.proto.HealthRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetHealthMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.MetricsResponse getMetrics(io.aurigraph.v10.proto.MetricsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetMetricsMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Transaction Processing
     * </pre>
     */
    public io.aurigraph.v10.proto.TransactionResponse submitTransaction(io.aurigraph.v10.proto.Transaction request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSubmitTransactionMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.BatchTransactionResponse batchSubmitTransactions(io.aurigraph.v10.proto.BatchTransactionRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getBatchSubmitTransactionsMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.Transaction getTransaction(io.aurigraph.v10.proto.GetTransactionRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetTransactionMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Block Operations
     * </pre>
     */
    public io.aurigraph.v10.proto.Block getBlock(io.aurigraph.v10.proto.GetBlockRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetBlockMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<io.aurigraph.v10.proto.Block> subscribeBlocks(
        io.aurigraph.v10.proto.BlockSubscriptionRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSubscribeBlocksMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Consensus Operations
     * </pre>
     */
    public io.aurigraph.v10.proto.ProposalResponse proposeBlock(io.aurigraph.v10.proto.Block request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getProposeBlockMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.VoteResponse voteOnProposal(io.aurigraph.v10.proto.Vote request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getVoteOnProposalMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.ConsensusState getConsensusState(io.aurigraph.v10.proto.ConsensusStateRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetConsensusStateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Node Management
     * </pre>
     */
    public io.aurigraph.v10.proto.NodeRegistrationResponse registerNode(io.aurigraph.v10.proto.NodeRegistration request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRegisterNodeMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.NodeStatus getNodeStatus(io.aurigraph.v10.proto.NodeStatusRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetNodeStatusMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.ConfigUpdateResponse updateNodeConfig(io.aurigraph.v10.proto.NodeConfig request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getUpdateNodeConfigMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service AurigraphPlatform.
   * <pre>
   * Main Aurigraph Platform Service
   * </pre>
   */
  public static final class AurigraphPlatformFutureStub
      extends io.grpc.stub.AbstractFutureStub<AurigraphPlatformFutureStub> {
    private AurigraphPlatformFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AurigraphPlatformFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AurigraphPlatformFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Health &amp; Status
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.HealthResponse> getHealth(
        io.aurigraph.v10.proto.HealthRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetHealthMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.MetricsResponse> getMetrics(
        io.aurigraph.v10.proto.MetricsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetMetricsMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Transaction Processing
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.TransactionResponse> submitTransaction(
        io.aurigraph.v10.proto.Transaction request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSubmitTransactionMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.BatchTransactionResponse> batchSubmitTransactions(
        io.aurigraph.v10.proto.BatchTransactionRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getBatchSubmitTransactionsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.Transaction> getTransaction(
        io.aurigraph.v10.proto.GetTransactionRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetTransactionMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Block Operations
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.Block> getBlock(
        io.aurigraph.v10.proto.GetBlockRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetBlockMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Consensus Operations
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.ProposalResponse> proposeBlock(
        io.aurigraph.v10.proto.Block request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getProposeBlockMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.VoteResponse> voteOnProposal(
        io.aurigraph.v10.proto.Vote request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getVoteOnProposalMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.ConsensusState> getConsensusState(
        io.aurigraph.v10.proto.ConsensusStateRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetConsensusStateMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Node Management
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.NodeRegistrationResponse> registerNode(
        io.aurigraph.v10.proto.NodeRegistration request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRegisterNodeMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.NodeStatus> getNodeStatus(
        io.aurigraph.v10.proto.NodeStatusRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetNodeStatusMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.ConfigUpdateResponse> updateNodeConfig(
        io.aurigraph.v10.proto.NodeConfig request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getUpdateNodeConfigMethod(), getCallOptions()), request);
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

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_GET_HEALTH:
          serviceImpl.getHealth((io.aurigraph.v10.proto.HealthRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.HealthResponse>) responseObserver);
          break;
        case METHODID_GET_METRICS:
          serviceImpl.getMetrics((io.aurigraph.v10.proto.MetricsRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.MetricsResponse>) responseObserver);
          break;
        case METHODID_SUBMIT_TRANSACTION:
          serviceImpl.submitTransaction((io.aurigraph.v10.proto.Transaction) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TransactionResponse>) responseObserver);
          break;
        case METHODID_BATCH_SUBMIT_TRANSACTIONS:
          serviceImpl.batchSubmitTransactions((io.aurigraph.v10.proto.BatchTransactionRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BatchTransactionResponse>) responseObserver);
          break;
        case METHODID_GET_TRANSACTION:
          serviceImpl.getTransaction((io.aurigraph.v10.proto.GetTransactionRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Transaction>) responseObserver);
          break;
        case METHODID_GET_BLOCK:
          serviceImpl.getBlock((io.aurigraph.v10.proto.GetBlockRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block>) responseObserver);
          break;
        case METHODID_SUBSCRIBE_BLOCKS:
          serviceImpl.subscribeBlocks((io.aurigraph.v10.proto.BlockSubscriptionRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Block>) responseObserver);
          break;
        case METHODID_PROPOSE_BLOCK:
          serviceImpl.proposeBlock((io.aurigraph.v10.proto.Block) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ProposalResponse>) responseObserver);
          break;
        case METHODID_VOTE_ON_PROPOSAL:
          serviceImpl.voteOnProposal((io.aurigraph.v10.proto.Vote) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VoteResponse>) responseObserver);
          break;
        case METHODID_GET_CONSENSUS_STATE:
          serviceImpl.getConsensusState((io.aurigraph.v10.proto.ConsensusStateRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConsensusState>) responseObserver);
          break;
        case METHODID_REGISTER_NODE:
          serviceImpl.registerNode((io.aurigraph.v10.proto.NodeRegistration) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeRegistrationResponse>) responseObserver);
          break;
        case METHODID_GET_NODE_STATUS:
          serviceImpl.getNodeStatus((io.aurigraph.v10.proto.NodeStatusRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.NodeStatus>) responseObserver);
          break;
        case METHODID_UPDATE_NODE_CONFIG:
          serviceImpl.updateNodeConfig((io.aurigraph.v10.proto.NodeConfig) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ConfigUpdateResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getGetHealthMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.HealthRequest,
              io.aurigraph.v10.proto.HealthResponse>(
                service, METHODID_GET_HEALTH)))
        .addMethod(
          getGetMetricsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.MetricsRequest,
              io.aurigraph.v10.proto.MetricsResponse>(
                service, METHODID_GET_METRICS)))
        .addMethod(
          getSubmitTransactionMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.Transaction,
              io.aurigraph.v10.proto.TransactionResponse>(
                service, METHODID_SUBMIT_TRANSACTION)))
        .addMethod(
          getBatchSubmitTransactionsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.BatchTransactionRequest,
              io.aurigraph.v10.proto.BatchTransactionResponse>(
                service, METHODID_BATCH_SUBMIT_TRANSACTIONS)))
        .addMethod(
          getGetTransactionMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.GetTransactionRequest,
              io.aurigraph.v10.proto.Transaction>(
                service, METHODID_GET_TRANSACTION)))
        .addMethod(
          getGetBlockMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.GetBlockRequest,
              io.aurigraph.v10.proto.Block>(
                service, METHODID_GET_BLOCK)))
        .addMethod(
          getSubscribeBlocksMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.BlockSubscriptionRequest,
              io.aurigraph.v10.proto.Block>(
                service, METHODID_SUBSCRIBE_BLOCKS)))
        .addMethod(
          getProposeBlockMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.Block,
              io.aurigraph.v10.proto.ProposalResponse>(
                service, METHODID_PROPOSE_BLOCK)))
        .addMethod(
          getVoteOnProposalMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.Vote,
              io.aurigraph.v10.proto.VoteResponse>(
                service, METHODID_VOTE_ON_PROPOSAL)))
        .addMethod(
          getGetConsensusStateMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.ConsensusStateRequest,
              io.aurigraph.v10.proto.ConsensusState>(
                service, METHODID_GET_CONSENSUS_STATE)))
        .addMethod(
          getRegisterNodeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.NodeRegistration,
              io.aurigraph.v10.proto.NodeRegistrationResponse>(
                service, METHODID_REGISTER_NODE)))
        .addMethod(
          getGetNodeStatusMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.NodeStatusRequest,
              io.aurigraph.v10.proto.NodeStatus>(
                service, METHODID_GET_NODE_STATUS)))
        .addMethod(
          getUpdateNodeConfigMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.NodeConfig,
              io.aurigraph.v10.proto.ConfigUpdateResponse>(
                service, METHODID_UPDATE_NODE_CONFIG)))
        .build();
  }

  private static abstract class AurigraphPlatformBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    AurigraphPlatformBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return io.aurigraph.v10.proto.Aurigraph.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("AurigraphPlatform");
    }
  }

  private static final class AurigraphPlatformFileDescriptorSupplier
      extends AurigraphPlatformBaseDescriptorSupplier {
    AurigraphPlatformFileDescriptorSupplier() {}
  }

  private static final class AurigraphPlatformMethodDescriptorSupplier
      extends AurigraphPlatformBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    AurigraphPlatformMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (AurigraphPlatformGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new AurigraphPlatformFileDescriptorSupplier())
              .addMethod(getGetHealthMethod())
              .addMethod(getGetMetricsMethod())
              .addMethod(getSubmitTransactionMethod())
              .addMethod(getBatchSubmitTransactionsMethod())
              .addMethod(getGetTransactionMethod())
              .addMethod(getGetBlockMethod())
              .addMethod(getSubscribeBlocksMethod())
              .addMethod(getProposeBlockMethod())
              .addMethod(getVoteOnProposalMethod())
              .addMethod(getGetConsensusStateMethod())
              .addMethod(getRegisterNodeMethod())
              .addMethod(getGetNodeStatusMethod())
              .addMethod(getUpdateNodeConfigMethod())
              .build();
        }
      }
    }
    return result;
  }
}
