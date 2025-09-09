package io.aurigraph.v10.proto;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Real World Assets Service
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: aurigraph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class RWAServiceGrpc {

  private RWAServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "aurigraph.v10.RWAService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AssetRegistration,
      io.aurigraph.v10.proto.AssetRegistrationResponse> getRegisterAssetMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RegisterAsset",
      requestType = io.aurigraph.v10.proto.AssetRegistration.class,
      responseType = io.aurigraph.v10.proto.AssetRegistrationResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AssetRegistration,
      io.aurigraph.v10.proto.AssetRegistrationResponse> getRegisterAssetMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AssetRegistration, io.aurigraph.v10.proto.AssetRegistrationResponse> getRegisterAssetMethod;
    if ((getRegisterAssetMethod = RWAServiceGrpc.getRegisterAssetMethod) == null) {
      synchronized (RWAServiceGrpc.class) {
        if ((getRegisterAssetMethod = RWAServiceGrpc.getRegisterAssetMethod) == null) {
          RWAServiceGrpc.getRegisterAssetMethod = getRegisterAssetMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.AssetRegistration, io.aurigraph.v10.proto.AssetRegistrationResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RegisterAsset"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AssetRegistration.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AssetRegistrationResponse.getDefaultInstance()))
              .setSchemaDescriptor(new RWAServiceMethodDescriptorSupplier("RegisterAsset"))
              .build();
        }
      }
    }
    return getRegisterAssetMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetAssetRequest,
      io.aurigraph.v10.proto.Asset> getGetAssetMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetAsset",
      requestType = io.aurigraph.v10.proto.GetAssetRequest.class,
      responseType = io.aurigraph.v10.proto.Asset.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetAssetRequest,
      io.aurigraph.v10.proto.Asset> getGetAssetMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.GetAssetRequest, io.aurigraph.v10.proto.Asset> getGetAssetMethod;
    if ((getGetAssetMethod = RWAServiceGrpc.getGetAssetMethod) == null) {
      synchronized (RWAServiceGrpc.class) {
        if ((getGetAssetMethod = RWAServiceGrpc.getGetAssetMethod) == null) {
          RWAServiceGrpc.getGetAssetMethod = getGetAssetMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.GetAssetRequest, io.aurigraph.v10.proto.Asset>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetAsset"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.GetAssetRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.Asset.getDefaultInstance()))
              .setSchemaDescriptor(new RWAServiceMethodDescriptorSupplier("GetAsset"))
              .build();
        }
      }
    }
    return getGetAssetMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TokenizationRequest,
      io.aurigraph.v10.proto.TokenizationResponse> getTokenizeAssetMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "TokenizeAsset",
      requestType = io.aurigraph.v10.proto.TokenizationRequest.class,
      responseType = io.aurigraph.v10.proto.TokenizationResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TokenizationRequest,
      io.aurigraph.v10.proto.TokenizationResponse> getTokenizeAssetMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TokenizationRequest, io.aurigraph.v10.proto.TokenizationResponse> getTokenizeAssetMethod;
    if ((getTokenizeAssetMethod = RWAServiceGrpc.getTokenizeAssetMethod) == null) {
      synchronized (RWAServiceGrpc.class) {
        if ((getTokenizeAssetMethod = RWAServiceGrpc.getTokenizeAssetMethod) == null) {
          RWAServiceGrpc.getTokenizeAssetMethod = getTokenizeAssetMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.TokenizationRequest, io.aurigraph.v10.proto.TokenizationResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "TokenizeAsset"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TokenizationRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TokenizationResponse.getDefaultInstance()))
              .setSchemaDescriptor(new RWAServiceMethodDescriptorSupplier("TokenizeAsset"))
              .build();
        }
      }
    }
    return getTokenizeAssetMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ValuationUpdate,
      io.aurigraph.v10.proto.ValuationResponse> getUpdateValuationMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UpdateValuation",
      requestType = io.aurigraph.v10.proto.ValuationUpdate.class,
      responseType = io.aurigraph.v10.proto.ValuationResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ValuationUpdate,
      io.aurigraph.v10.proto.ValuationResponse> getUpdateValuationMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ValuationUpdate, io.aurigraph.v10.proto.ValuationResponse> getUpdateValuationMethod;
    if ((getUpdateValuationMethod = RWAServiceGrpc.getUpdateValuationMethod) == null) {
      synchronized (RWAServiceGrpc.class) {
        if ((getUpdateValuationMethod = RWAServiceGrpc.getUpdateValuationMethod) == null) {
          RWAServiceGrpc.getUpdateValuationMethod = getUpdateValuationMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.ValuationUpdate, io.aurigraph.v10.proto.ValuationResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UpdateValuation"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ValuationUpdate.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ValuationResponse.getDefaultInstance()))
              .setSchemaDescriptor(new RWAServiceMethodDescriptorSupplier("UpdateValuation"))
              .build();
        }
      }
    }
    return getUpdateValuationMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ComplianceRequest,
      io.aurigraph.v10.proto.ComplianceStatus> getCheckComplianceMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CheckCompliance",
      requestType = io.aurigraph.v10.proto.ComplianceRequest.class,
      responseType = io.aurigraph.v10.proto.ComplianceStatus.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ComplianceRequest,
      io.aurigraph.v10.proto.ComplianceStatus> getCheckComplianceMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.ComplianceRequest, io.aurigraph.v10.proto.ComplianceStatus> getCheckComplianceMethod;
    if ((getCheckComplianceMethod = RWAServiceGrpc.getCheckComplianceMethod) == null) {
      synchronized (RWAServiceGrpc.class) {
        if ((getCheckComplianceMethod = RWAServiceGrpc.getCheckComplianceMethod) == null) {
          RWAServiceGrpc.getCheckComplianceMethod = getCheckComplianceMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.ComplianceRequest, io.aurigraph.v10.proto.ComplianceStatus>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CheckCompliance"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ComplianceRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.ComplianceStatus.getDefaultInstance()))
              .setSchemaDescriptor(new RWAServiceMethodDescriptorSupplier("CheckCompliance"))
              .build();
        }
      }
    }
    return getCheckComplianceMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static RWAServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<RWAServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<RWAServiceStub>() {
        @java.lang.Override
        public RWAServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new RWAServiceStub(channel, callOptions);
        }
      };
    return RWAServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static RWAServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<RWAServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<RWAServiceBlockingStub>() {
        @java.lang.Override
        public RWAServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new RWAServiceBlockingStub(channel, callOptions);
        }
      };
    return RWAServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static RWAServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<RWAServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<RWAServiceFutureStub>() {
        @java.lang.Override
        public RWAServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new RWAServiceFutureStub(channel, callOptions);
        }
      };
    return RWAServiceFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Real World Assets Service
   * </pre>
   */
  public interface AsyncService {

    /**
     */
    default void registerAsset(io.aurigraph.v10.proto.AssetRegistration request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AssetRegistrationResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRegisterAssetMethod(), responseObserver);
    }

    /**
     */
    default void getAsset(io.aurigraph.v10.proto.GetAssetRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Asset> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetAssetMethod(), responseObserver);
    }

    /**
     */
    default void tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TokenizationResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getTokenizeAssetMethod(), responseObserver);
    }

    /**
     */
    default void updateValuation(io.aurigraph.v10.proto.ValuationUpdate request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ValuationResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getUpdateValuationMethod(), responseObserver);
    }

    /**
     */
    default void checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ComplianceStatus> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCheckComplianceMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service RWAService.
   * <pre>
   * Real World Assets Service
   * </pre>
   */
  public static abstract class RWAServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return RWAServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service RWAService.
   * <pre>
   * Real World Assets Service
   * </pre>
   */
  public static final class RWAServiceStub
      extends io.grpc.stub.AbstractAsyncStub<RWAServiceStub> {
    private RWAServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected RWAServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new RWAServiceStub(channel, callOptions);
    }

    /**
     */
    public void registerAsset(io.aurigraph.v10.proto.AssetRegistration request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AssetRegistrationResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRegisterAssetMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getAsset(io.aurigraph.v10.proto.GetAssetRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Asset> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetAssetMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TokenizationResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getTokenizeAssetMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void updateValuation(io.aurigraph.v10.proto.ValuationUpdate request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ValuationResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getUpdateValuationMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ComplianceStatus> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCheckComplianceMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service RWAService.
   * <pre>
   * Real World Assets Service
   * </pre>
   */
  public static final class RWAServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<RWAServiceBlockingStub> {
    private RWAServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected RWAServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new RWAServiceBlockingStub(channel, callOptions);
    }

    /**
     */
    public io.aurigraph.v10.proto.AssetRegistrationResponse registerAsset(io.aurigraph.v10.proto.AssetRegistration request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRegisterAssetMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.Asset getAsset(io.aurigraph.v10.proto.GetAssetRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetAssetMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.TokenizationResponse tokenizeAsset(io.aurigraph.v10.proto.TokenizationRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getTokenizeAssetMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.ValuationResponse updateValuation(io.aurigraph.v10.proto.ValuationUpdate request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getUpdateValuationMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.ComplianceStatus checkCompliance(io.aurigraph.v10.proto.ComplianceRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCheckComplianceMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service RWAService.
   * <pre>
   * Real World Assets Service
   * </pre>
   */
  public static final class RWAServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<RWAServiceFutureStub> {
    private RWAServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected RWAServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new RWAServiceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.AssetRegistrationResponse> registerAsset(
        io.aurigraph.v10.proto.AssetRegistration request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRegisterAssetMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.Asset> getAsset(
        io.aurigraph.v10.proto.GetAssetRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetAssetMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.TokenizationResponse> tokenizeAsset(
        io.aurigraph.v10.proto.TokenizationRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getTokenizeAssetMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.ValuationResponse> updateValuation(
        io.aurigraph.v10.proto.ValuationUpdate request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getUpdateValuationMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.ComplianceStatus> checkCompliance(
        io.aurigraph.v10.proto.ComplianceRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCheckComplianceMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_REGISTER_ASSET = 0;
  private static final int METHODID_GET_ASSET = 1;
  private static final int METHODID_TOKENIZE_ASSET = 2;
  private static final int METHODID_UPDATE_VALUATION = 3;
  private static final int METHODID_CHECK_COMPLIANCE = 4;

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
        case METHODID_REGISTER_ASSET:
          serviceImpl.registerAsset((io.aurigraph.v10.proto.AssetRegistration) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AssetRegistrationResponse>) responseObserver);
          break;
        case METHODID_GET_ASSET:
          serviceImpl.getAsset((io.aurigraph.v10.proto.GetAssetRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.Asset>) responseObserver);
          break;
        case METHODID_TOKENIZE_ASSET:
          serviceImpl.tokenizeAsset((io.aurigraph.v10.proto.TokenizationRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TokenizationResponse>) responseObserver);
          break;
        case METHODID_UPDATE_VALUATION:
          serviceImpl.updateValuation((io.aurigraph.v10.proto.ValuationUpdate) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ValuationResponse>) responseObserver);
          break;
        case METHODID_CHECK_COMPLIANCE:
          serviceImpl.checkCompliance((io.aurigraph.v10.proto.ComplianceRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.ComplianceStatus>) responseObserver);
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
          getRegisterAssetMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.AssetRegistration,
              io.aurigraph.v10.proto.AssetRegistrationResponse>(
                service, METHODID_REGISTER_ASSET)))
        .addMethod(
          getGetAssetMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.GetAssetRequest,
              io.aurigraph.v10.proto.Asset>(
                service, METHODID_GET_ASSET)))
        .addMethod(
          getTokenizeAssetMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.TokenizationRequest,
              io.aurigraph.v10.proto.TokenizationResponse>(
                service, METHODID_TOKENIZE_ASSET)))
        .addMethod(
          getUpdateValuationMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.ValuationUpdate,
              io.aurigraph.v10.proto.ValuationResponse>(
                service, METHODID_UPDATE_VALUATION)))
        .addMethod(
          getCheckComplianceMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.ComplianceRequest,
              io.aurigraph.v10.proto.ComplianceStatus>(
                service, METHODID_CHECK_COMPLIANCE)))
        .build();
  }

  private static abstract class RWAServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    RWAServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return io.aurigraph.v10.proto.Aurigraph.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("RWAService");
    }
  }

  private static final class RWAServiceFileDescriptorSupplier
      extends RWAServiceBaseDescriptorSupplier {
    RWAServiceFileDescriptorSupplier() {}
  }

  private static final class RWAServiceMethodDescriptorSupplier
      extends RWAServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    RWAServiceMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (RWAServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new RWAServiceFileDescriptorSupplier())
              .addMethod(getRegisterAssetMethod())
              .addMethod(getGetAssetMethod())
              .addMethod(getTokenizeAssetMethod())
              .addMethod(getUpdateValuationMethod())
              .addMethod(getCheckComplianceMethod())
              .build();
        }
      }
    }
    return result;
  }
}
