package io.aurigraph.v10.proto;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Quantum Security Service
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: aurigraph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class QuantumSecurityGrpc {

  private QuantumSecurityGrpc() {}

  public static final java.lang.String SERVICE_NAME = "aurigraph.v10.QuantumSecurity";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyGenerationRequest,
      io.aurigraph.v10.proto.QuantumKeyPair> getGenerateQuantumKeyPairMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GenerateQuantumKeyPair",
      requestType = io.aurigraph.v10.proto.KeyGenerationRequest.class,
      responseType = io.aurigraph.v10.proto.QuantumKeyPair.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyGenerationRequest,
      io.aurigraph.v10.proto.QuantumKeyPair> getGenerateQuantumKeyPairMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyGenerationRequest, io.aurigraph.v10.proto.QuantumKeyPair> getGenerateQuantumKeyPairMethod;
    if ((getGenerateQuantumKeyPairMethod = QuantumSecurityGrpc.getGenerateQuantumKeyPairMethod) == null) {
      synchronized (QuantumSecurityGrpc.class) {
        if ((getGenerateQuantumKeyPairMethod = QuantumSecurityGrpc.getGenerateQuantumKeyPairMethod) == null) {
          QuantumSecurityGrpc.getGenerateQuantumKeyPairMethod = getGenerateQuantumKeyPairMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.KeyGenerationRequest, io.aurigraph.v10.proto.QuantumKeyPair>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GenerateQuantumKeyPair"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.KeyGenerationRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.QuantumKeyPair.getDefaultInstance()))
              .setSchemaDescriptor(new QuantumSecurityMethodDescriptorSupplier("GenerateQuantumKeyPair"))
              .build();
        }
      }
    }
    return getGenerateQuantumKeyPairMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SignRequest,
      io.aurigraph.v10.proto.QuantumSignature> getQuantumSignMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "QuantumSign",
      requestType = io.aurigraph.v10.proto.SignRequest.class,
      responseType = io.aurigraph.v10.proto.QuantumSignature.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SignRequest,
      io.aurigraph.v10.proto.QuantumSignature> getQuantumSignMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SignRequest, io.aurigraph.v10.proto.QuantumSignature> getQuantumSignMethod;
    if ((getQuantumSignMethod = QuantumSecurityGrpc.getQuantumSignMethod) == null) {
      synchronized (QuantumSecurityGrpc.class) {
        if ((getQuantumSignMethod = QuantumSecurityGrpc.getQuantumSignMethod) == null) {
          QuantumSecurityGrpc.getQuantumSignMethod = getQuantumSignMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.SignRequest, io.aurigraph.v10.proto.QuantumSignature>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "QuantumSign"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SignRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.QuantumSignature.getDefaultInstance()))
              .setSchemaDescriptor(new QuantumSecurityMethodDescriptorSupplier("QuantumSign"))
              .build();
        }
      }
    }
    return getQuantumSignMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.VerifyRequest,
      io.aurigraph.v10.proto.VerificationResult> getQuantumVerifyMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "QuantumVerify",
      requestType = io.aurigraph.v10.proto.VerifyRequest.class,
      responseType = io.aurigraph.v10.proto.VerificationResult.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.VerifyRequest,
      io.aurigraph.v10.proto.VerificationResult> getQuantumVerifyMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.VerifyRequest, io.aurigraph.v10.proto.VerificationResult> getQuantumVerifyMethod;
    if ((getQuantumVerifyMethod = QuantumSecurityGrpc.getQuantumVerifyMethod) == null) {
      synchronized (QuantumSecurityGrpc.class) {
        if ((getQuantumVerifyMethod = QuantumSecurityGrpc.getQuantumVerifyMethod) == null) {
          QuantumSecurityGrpc.getQuantumVerifyMethod = getQuantumVerifyMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.VerifyRequest, io.aurigraph.v10.proto.VerificationResult>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "QuantumVerify"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.VerifyRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.VerificationResult.getDefaultInstance()))
              .setSchemaDescriptor(new QuantumSecurityMethodDescriptorSupplier("QuantumVerify"))
              .build();
        }
      }
    }
    return getQuantumVerifyMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyRotationRequest,
      io.aurigraph.v10.proto.KeyRotationResponse> getRotateKeysMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RotateKeys",
      requestType = io.aurigraph.v10.proto.KeyRotationRequest.class,
      responseType = io.aurigraph.v10.proto.KeyRotationResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyRotationRequest,
      io.aurigraph.v10.proto.KeyRotationResponse> getRotateKeysMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.KeyRotationRequest, io.aurigraph.v10.proto.KeyRotationResponse> getRotateKeysMethod;
    if ((getRotateKeysMethod = QuantumSecurityGrpc.getRotateKeysMethod) == null) {
      synchronized (QuantumSecurityGrpc.class) {
        if ((getRotateKeysMethod = QuantumSecurityGrpc.getRotateKeysMethod) == null) {
          QuantumSecurityGrpc.getRotateKeysMethod = getRotateKeysMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.KeyRotationRequest, io.aurigraph.v10.proto.KeyRotationResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RotateKeys"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.KeyRotationRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.KeyRotationResponse.getDefaultInstance()))
              .setSchemaDescriptor(new QuantumSecurityMethodDescriptorSupplier("RotateKeys"))
              .build();
        }
      }
    }
    return getRotateKeysMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SecurityMetricsRequest,
      io.aurigraph.v10.proto.SecurityMetrics> getGetSecurityMetricsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetSecurityMetrics",
      requestType = io.aurigraph.v10.proto.SecurityMetricsRequest.class,
      responseType = io.aurigraph.v10.proto.SecurityMetrics.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SecurityMetricsRequest,
      io.aurigraph.v10.proto.SecurityMetrics> getGetSecurityMetricsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.SecurityMetricsRequest, io.aurigraph.v10.proto.SecurityMetrics> getGetSecurityMetricsMethod;
    if ((getGetSecurityMetricsMethod = QuantumSecurityGrpc.getGetSecurityMetricsMethod) == null) {
      synchronized (QuantumSecurityGrpc.class) {
        if ((getGetSecurityMetricsMethod = QuantumSecurityGrpc.getGetSecurityMetricsMethod) == null) {
          QuantumSecurityGrpc.getGetSecurityMetricsMethod = getGetSecurityMetricsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.SecurityMetricsRequest, io.aurigraph.v10.proto.SecurityMetrics>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetSecurityMetrics"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SecurityMetricsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.SecurityMetrics.getDefaultInstance()))
              .setSchemaDescriptor(new QuantumSecurityMethodDescriptorSupplier("GetSecurityMetrics"))
              .build();
        }
      }
    }
    return getGetSecurityMetricsMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static QuantumSecurityStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityStub>() {
        @java.lang.Override
        public QuantumSecurityStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new QuantumSecurityStub(channel, callOptions);
        }
      };
    return QuantumSecurityStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static QuantumSecurityBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityBlockingStub>() {
        @java.lang.Override
        public QuantumSecurityBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new QuantumSecurityBlockingStub(channel, callOptions);
        }
      };
    return QuantumSecurityBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static QuantumSecurityFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<QuantumSecurityFutureStub>() {
        @java.lang.Override
        public QuantumSecurityFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new QuantumSecurityFutureStub(channel, callOptions);
        }
      };
    return QuantumSecurityFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Quantum Security Service
   * </pre>
   */
  public interface AsyncService {

    /**
     */
    default void generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumKeyPair> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGenerateQuantumKeyPairMethod(), responseObserver);
    }

    /**
     */
    default void quantumSign(io.aurigraph.v10.proto.SignRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumSignature> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getQuantumSignMethod(), responseObserver);
    }

    /**
     */
    default void quantumVerify(io.aurigraph.v10.proto.VerifyRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VerificationResult> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getQuantumVerifyMethod(), responseObserver);
    }

    /**
     */
    default void rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.KeyRotationResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRotateKeysMethod(), responseObserver);
    }

    /**
     */
    default void getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SecurityMetrics> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetSecurityMetricsMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service QuantumSecurity.
   * <pre>
   * Quantum Security Service
   * </pre>
   */
  public static abstract class QuantumSecurityImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return QuantumSecurityGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service QuantumSecurity.
   * <pre>
   * Quantum Security Service
   * </pre>
   */
  public static final class QuantumSecurityStub
      extends io.grpc.stub.AbstractAsyncStub<QuantumSecurityStub> {
    private QuantumSecurityStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected QuantumSecurityStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new QuantumSecurityStub(channel, callOptions);
    }

    /**
     */
    public void generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumKeyPair> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGenerateQuantumKeyPairMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void quantumSign(io.aurigraph.v10.proto.SignRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumSignature> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getQuantumSignMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void quantumVerify(io.aurigraph.v10.proto.VerifyRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VerificationResult> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getQuantumVerifyMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.KeyRotationResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRotateKeysMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SecurityMetrics> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetSecurityMetricsMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service QuantumSecurity.
   * <pre>
   * Quantum Security Service
   * </pre>
   */
  public static final class QuantumSecurityBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<QuantumSecurityBlockingStub> {
    private QuantumSecurityBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected QuantumSecurityBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new QuantumSecurityBlockingStub(channel, callOptions);
    }

    /**
     */
    public io.aurigraph.v10.proto.QuantumKeyPair generateQuantumKeyPair(io.aurigraph.v10.proto.KeyGenerationRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGenerateQuantumKeyPairMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.QuantumSignature quantumSign(io.aurigraph.v10.proto.SignRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getQuantumSignMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.VerificationResult quantumVerify(io.aurigraph.v10.proto.VerifyRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getQuantumVerifyMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.KeyRotationResponse rotateKeys(io.aurigraph.v10.proto.KeyRotationRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRotateKeysMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.SecurityMetrics getSecurityMetrics(io.aurigraph.v10.proto.SecurityMetricsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetSecurityMetricsMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service QuantumSecurity.
   * <pre>
   * Quantum Security Service
   * </pre>
   */
  public static final class QuantumSecurityFutureStub
      extends io.grpc.stub.AbstractFutureStub<QuantumSecurityFutureStub> {
    private QuantumSecurityFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected QuantumSecurityFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new QuantumSecurityFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.QuantumKeyPair> generateQuantumKeyPair(
        io.aurigraph.v10.proto.KeyGenerationRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGenerateQuantumKeyPairMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.QuantumSignature> quantumSign(
        io.aurigraph.v10.proto.SignRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getQuantumSignMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.VerificationResult> quantumVerify(
        io.aurigraph.v10.proto.VerifyRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getQuantumVerifyMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.KeyRotationResponse> rotateKeys(
        io.aurigraph.v10.proto.KeyRotationRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRotateKeysMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.SecurityMetrics> getSecurityMetrics(
        io.aurigraph.v10.proto.SecurityMetricsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetSecurityMetricsMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_GENERATE_QUANTUM_KEY_PAIR = 0;
  private static final int METHODID_QUANTUM_SIGN = 1;
  private static final int METHODID_QUANTUM_VERIFY = 2;
  private static final int METHODID_ROTATE_KEYS = 3;
  private static final int METHODID_GET_SECURITY_METRICS = 4;

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
        case METHODID_GENERATE_QUANTUM_KEY_PAIR:
          serviceImpl.generateQuantumKeyPair((io.aurigraph.v10.proto.KeyGenerationRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumKeyPair>) responseObserver);
          break;
        case METHODID_QUANTUM_SIGN:
          serviceImpl.quantumSign((io.aurigraph.v10.proto.SignRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.QuantumSignature>) responseObserver);
          break;
        case METHODID_QUANTUM_VERIFY:
          serviceImpl.quantumVerify((io.aurigraph.v10.proto.VerifyRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.VerificationResult>) responseObserver);
          break;
        case METHODID_ROTATE_KEYS:
          serviceImpl.rotateKeys((io.aurigraph.v10.proto.KeyRotationRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.KeyRotationResponse>) responseObserver);
          break;
        case METHODID_GET_SECURITY_METRICS:
          serviceImpl.getSecurityMetrics((io.aurigraph.v10.proto.SecurityMetricsRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.SecurityMetrics>) responseObserver);
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
          getGenerateQuantumKeyPairMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.KeyGenerationRequest,
              io.aurigraph.v10.proto.QuantumKeyPair>(
                service, METHODID_GENERATE_QUANTUM_KEY_PAIR)))
        .addMethod(
          getQuantumSignMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.SignRequest,
              io.aurigraph.v10.proto.QuantumSignature>(
                service, METHODID_QUANTUM_SIGN)))
        .addMethod(
          getQuantumVerifyMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.VerifyRequest,
              io.aurigraph.v10.proto.VerificationResult>(
                service, METHODID_QUANTUM_VERIFY)))
        .addMethod(
          getRotateKeysMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.KeyRotationRequest,
              io.aurigraph.v10.proto.KeyRotationResponse>(
                service, METHODID_ROTATE_KEYS)))
        .addMethod(
          getGetSecurityMetricsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.SecurityMetricsRequest,
              io.aurigraph.v10.proto.SecurityMetrics>(
                service, METHODID_GET_SECURITY_METRICS)))
        .build();
  }

  private static abstract class QuantumSecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    QuantumSecurityBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return io.aurigraph.v10.proto.Aurigraph.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("QuantumSecurity");
    }
  }

  private static final class QuantumSecurityFileDescriptorSupplier
      extends QuantumSecurityBaseDescriptorSupplier {
    QuantumSecurityFileDescriptorSupplier() {}
  }

  private static final class QuantumSecurityMethodDescriptorSupplier
      extends QuantumSecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    QuantumSecurityMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (QuantumSecurityGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new QuantumSecurityFileDescriptorSupplier())
              .addMethod(getGenerateQuantumKeyPairMethod())
              .addMethod(getQuantumSignMethod())
              .addMethod(getQuantumVerifyMethod())
              .addMethod(getRotateKeysMethod())
              .addMethod(getGetSecurityMetricsMethod())
              .build();
        }
      }
    }
    return result;
  }
}
