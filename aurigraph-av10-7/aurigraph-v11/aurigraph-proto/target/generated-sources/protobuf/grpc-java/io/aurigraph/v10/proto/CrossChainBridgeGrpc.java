package io.aurigraph.v10.proto;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Cross-Chain Bridge Service
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: aurigraph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class CrossChainBridgeGrpc {

  private CrossChainBridgeGrpc() {}

  public static final java.lang.String SERVICE_NAME = "aurigraph.v10.CrossChainBridge";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeRequest,
      io.aurigraph.v10.proto.BridgeResponse> getInitiateBridgeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "InitiateBridge",
      requestType = io.aurigraph.v10.proto.BridgeRequest.class,
      responseType = io.aurigraph.v10.proto.BridgeResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeRequest,
      io.aurigraph.v10.proto.BridgeResponse> getInitiateBridgeMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeRequest, io.aurigraph.v10.proto.BridgeResponse> getInitiateBridgeMethod;
    if ((getInitiateBridgeMethod = CrossChainBridgeGrpc.getInitiateBridgeMethod) == null) {
      synchronized (CrossChainBridgeGrpc.class) {
        if ((getInitiateBridgeMethod = CrossChainBridgeGrpc.getInitiateBridgeMethod) == null) {
          CrossChainBridgeGrpc.getInitiateBridgeMethod = getInitiateBridgeMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.BridgeRequest, io.aurigraph.v10.proto.BridgeResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "InitiateBridge"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeResponse.getDefaultInstance()))
              .setSchemaDescriptor(new CrossChainBridgeMethodDescriptorSupplier("InitiateBridge"))
              .build();
        }
      }
    }
    return getInitiateBridgeMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeStatusRequest,
      io.aurigraph.v10.proto.BridgeStatus> getGetBridgeStatusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetBridgeStatus",
      requestType = io.aurigraph.v10.proto.BridgeStatusRequest.class,
      responseType = io.aurigraph.v10.proto.BridgeStatus.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeStatusRequest,
      io.aurigraph.v10.proto.BridgeStatus> getGetBridgeStatusMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeStatusRequest, io.aurigraph.v10.proto.BridgeStatus> getGetBridgeStatusMethod;
    if ((getGetBridgeStatusMethod = CrossChainBridgeGrpc.getGetBridgeStatusMethod) == null) {
      synchronized (CrossChainBridgeGrpc.class) {
        if ((getGetBridgeStatusMethod = CrossChainBridgeGrpc.getGetBridgeStatusMethod) == null) {
          CrossChainBridgeGrpc.getGetBridgeStatusMethod = getGetBridgeStatusMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.BridgeStatusRequest, io.aurigraph.v10.proto.BridgeStatus>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetBridgeStatus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeStatusRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeStatus.getDefaultInstance()))
              .setSchemaDescriptor(new CrossChainBridgeMethodDescriptorSupplier("GetBridgeStatus"))
              .build();
        }
      }
    }
    return getGetBridgeStatusMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ListChainsRequest,
      io.aurigraph.v10.proto.SupportedChains> getListSupportedChainsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListSupportedChains",
      requestType = io.aurigraph.v10.proto.ListChainsRequest.class,
      responseType = io.aurigraph.v10.proto.SupportedChains.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ListChainsRequest,
      io.aurigraph.v10.proto.SupportedChains> getListSupportedChainsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ListChainsRequest, io.aurigraph.v10.proto.SupportedChains> getListSupportedChainsMethod;
    if ((getListSupportedChainsMethod = CrossChainBridgeGrpc.getListSupportedChainsMethod) == null) {
      synchronized (CrossChainBridgeGrpc.class) {
        if ((getListSupportedChainsMethod = CrossChainBridgeGrpc.getListSupportedChainsMethod) == null) {
          CrossChainBridgeGrpc.getListSupportedChainsMethod = getListSupportedChainsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.ListChainsRequest, io.aurigraph.v10.proto.SupportedChains>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListSupportedChains"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ListChainsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SupportedChains.getDefaultInstance()))
              .setSchemaDescriptor(new CrossChainBridgeMethodDescriptorSupplier("ListSupportedChains"))
              .build();
        }
      }
    }
    return getListSupportedChainsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SwapRequest,
      io.aurigraph.v10.proto.SwapResponse> getExecuteSwapMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ExecuteSwap",
      requestType = io.aurigraph.v10.proto.SwapRequest.class,
      responseType = io.aurigraph.v10.proto.SwapResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SwapRequest,
      io.aurigraph.v10.proto.SwapResponse> getExecuteSwapMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SwapRequest, io.aurigraph.v10.proto.SwapResponse> getExecuteSwapMethod;
    if ((getExecuteSwapMethod = CrossChainBridgeGrpc.getExecuteSwapMethod) == null) {
      synchronized (CrossChainBridgeGrpc.class) {
        if ((getExecuteSwapMethod = CrossChainBridgeGrpc.getExecuteSwapMethod) == null) {
          CrossChainBridgeGrpc.getExecuteSwapMethod = getExecuteSwapMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.SwapRequest, io.aurigraph.v10.proto.SwapResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ExecuteSwap"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SwapRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SwapResponse.getDefaultInstance()))
              .setSchemaDescriptor(new CrossChainBridgeMethodDescriptorSupplier("ExecuteSwap"))
              .build();
        }
      }
    }
    return getExecuteSwapMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeMetricsRequest,
      io.aurigraph.v10.proto.BridgeMetrics> getGetBridgeMetricsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetBridgeMetrics",
      requestType = io.aurigraph.v10.proto.BridgeMetricsRequest.class,
      responseType = io.aurigraph.v10.proto.BridgeMetrics.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeMetricsRequest,
      io.aurigraph.v10.proto.BridgeMetrics> getGetBridgeMetricsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.BridgeMetricsRequest, io.aurigraph.v10.proto.BridgeMetrics> getGetBridgeMetricsMethod;
    if ((getGetBridgeMetricsMethod = CrossChainBridgeGrpc.getGetBridgeMetricsMethod) == null) {
      synchronized (CrossChainBridgeGrpc.class) {
        if ((getGetBridgeMetricsMethod = CrossChainBridgeGrpc.getGetBridgeMetricsMethod) == null) {
          CrossChainBridgeGrpc.getGetBridgeMetricsMethod = getGetBridgeMetricsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.BridgeMetricsRequest, io.aurigraph.v10.proto.BridgeMetrics>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetBridgeMetrics"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeMetricsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.BridgeMetrics.getDefaultInstance()))
              .setSchemaDescriptor(new CrossChainBridgeMethodDescriptorSupplier("GetBridgeMetrics"))
              .build();
        }
      }
    }
    return getGetBridgeMetricsMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static CrossChainBridgeStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeStub>() {
        @java.lang.Override
        public CrossChainBridgeStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new CrossChainBridgeStub(channel, callOptions);
        }
      };
    return CrossChainBridgeStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static CrossChainBridgeBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeBlockingStub>() {
        @java.lang.Override
        public CrossChainBridgeBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new CrossChainBridgeBlockingStub(channel, callOptions);
        }
      };
    return CrossChainBridgeBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static CrossChainBridgeFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<CrossChainBridgeFutureStub>() {
        @java.lang.Override
        public CrossChainBridgeFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new CrossChainBridgeFutureStub(channel, callOptions);
        }
      };
    return CrossChainBridgeFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Cross-Chain Bridge Service
   * </pre>
   */
  public interface AsyncService {

    /**
     */
    default void initiateBridge(io.aurigraph.v10.proto.BridgeRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getInitiateBridgeMethod(), responseObserver);
    }

    /**
     */
    default void getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeStatus> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetBridgeStatusMethod(), responseObserver);
    }

    /**
     */
    default void listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SupportedChains> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListSupportedChainsMethod(), responseObserver);
    }

    /**
     */
    default void executeSwap(io.aurigraph.v10.proto.SwapRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SwapResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getExecuteSwapMethod(), responseObserver);
    }

    /**
     */
    default void getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeMetrics> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetBridgeMetricsMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service CrossChainBridge.
   * <pre>
   * Cross-Chain Bridge Service
   * </pre>
   */
  public static abstract class CrossChainBridgeImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return CrossChainBridgeGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service CrossChainBridge.
   * <pre>
   * Cross-Chain Bridge Service
   * </pre>
   */
  public static final class CrossChainBridgeStub
      extends io.grpc.stub.AbstractAsyncStub<CrossChainBridgeStub> {
    private CrossChainBridgeStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected CrossChainBridgeStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new CrossChainBridgeStub(channel, callOptions);
    }

    /**
     */
    public void initiateBridge(io.aurigraph.v10.proto.BridgeRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getInitiateBridgeMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeStatus> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetBridgeStatusMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SupportedChains> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListSupportedChainsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void executeSwap(io.aurigraph.v10.proto.SwapRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SwapResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getExecuteSwapMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeMetrics> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetBridgeMetricsMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service CrossChainBridge.
   * <pre>
   * Cross-Chain Bridge Service
   * </pre>
   */
  public static final class CrossChainBridgeBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<CrossChainBridgeBlockingStub> {
    private CrossChainBridgeBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected CrossChainBridgeBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new CrossChainBridgeBlockingStub(channel, callOptions);
    }

    /**
     */
    public io.aurigraph.v10.proto.BridgeResponse initiateBridge(io.aurigraph.v10.proto.BridgeRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getInitiateBridgeMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.BridgeStatus getBridgeStatus(io.aurigraph.v10.proto.BridgeStatusRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetBridgeStatusMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.SupportedChains listSupportedChains(io.aurigraph.v10.proto.ListChainsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListSupportedChainsMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.SwapResponse executeSwap(io.aurigraph.v10.proto.SwapRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getExecuteSwapMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.BridgeMetrics getBridgeMetrics(io.aurigraph.v10.proto.BridgeMetricsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetBridgeMetricsMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service CrossChainBridge.
   * <pre>
   * Cross-Chain Bridge Service
   * </pre>
   */
  public static final class CrossChainBridgeFutureStub
      extends io.grpc.stub.AbstractFutureStub<CrossChainBridgeFutureStub> {
    private CrossChainBridgeFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected CrossChainBridgeFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new CrossChainBridgeFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.BridgeResponse> initiateBridge(
        io.aurigraph.v10.proto.BridgeRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getInitiateBridgeMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.BridgeStatus> getBridgeStatus(
        io.aurigraph.v10.proto.BridgeStatusRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetBridgeStatusMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.SupportedChains> listSupportedChains(
        io.aurigraph.v10.proto.ListChainsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListSupportedChainsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.SwapResponse> executeSwap(
        io.aurigraph.v10.proto.SwapRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getExecuteSwapMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.BridgeMetrics> getBridgeMetrics(
        io.aurigraph.v10.proto.BridgeMetricsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetBridgeMetricsMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_INITIATE_BRIDGE = 0;
  private static final int METHODID_GET_BRIDGE_STATUS = 1;
  private static final int METHODID_LIST_SUPPORTED_CHAINS = 2;
  private static final int METHODID_EXECUTE_SWAP = 3;
  private static final int METHODID_GET_BRIDGE_METRICS = 4;

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
        case METHODID_INITIATE_BRIDGE:
          serviceImpl.initiateBridge((io.aurigraph.v10.proto.BridgeRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeResponse>) responseObserver);
          break;
        case METHODID_GET_BRIDGE_STATUS:
          serviceImpl.getBridgeStatus((io.aurigraph.v10.proto.BridgeStatusRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeStatus>) responseObserver);
          break;
        case METHODID_LIST_SUPPORTED_CHAINS:
          serviceImpl.listSupportedChains((io.aurigraph.v10.proto.ListChainsRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SupportedChains>) responseObserver);
          break;
        case METHODID_EXECUTE_SWAP:
          serviceImpl.executeSwap((io.aurigraph.v10.proto.SwapRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SwapResponse>) responseObserver);
          break;
        case METHODID_GET_BRIDGE_METRICS:
          serviceImpl.getBridgeMetrics((io.aurigraph.v10.proto.BridgeMetricsRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.BridgeMetrics>) responseObserver);
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
          getInitiateBridgeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.BridgeRequest,
              io.aurigraph.v10.proto.BridgeResponse>(
                service, METHODID_INITIATE_BRIDGE)))
        .addMethod(
          getGetBridgeStatusMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.BridgeStatusRequest,
              io.aurigraph.v10.proto.BridgeStatus>(
                service, METHODID_GET_BRIDGE_STATUS)))
        .addMethod(
          getListSupportedChainsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.ListChainsRequest,
              io.aurigraph.v10.proto.SupportedChains>(
                service, METHODID_LIST_SUPPORTED_CHAINS)))
        .addMethod(
          getExecuteSwapMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.SwapRequest,
              io.aurigraph.v10.proto.SwapResponse>(
                service, METHODID_EXECUTE_SWAP)))
        .addMethod(
          getGetBridgeMetricsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.BridgeMetricsRequest,
              io.aurigraph.v10.proto.BridgeMetrics>(
                service, METHODID_GET_BRIDGE_METRICS)))
        .build();
  }

  private static abstract class CrossChainBridgeBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    CrossChainBridgeBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return io.aurigraph.v10.proto.Aurigraph.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("CrossChainBridge");
    }
  }

  private static final class CrossChainBridgeFileDescriptorSupplier
      extends CrossChainBridgeBaseDescriptorSupplier {
    CrossChainBridgeFileDescriptorSupplier() {}
  }

  private static final class CrossChainBridgeMethodDescriptorSupplier
      extends CrossChainBridgeBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    CrossChainBridgeMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (CrossChainBridgeGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new CrossChainBridgeFileDescriptorSupplier())
              .addMethod(getInitiateBridgeMethod())
              .addMethod(getGetBridgeStatusMethod())
              .addMethod(getListSupportedChainsMethod())
              .addMethod(getExecuteSwapMethod())
              .addMethod(getGetBridgeMetricsMethod())
              .build();
        }
      }
    }
    return result;
  }
}
