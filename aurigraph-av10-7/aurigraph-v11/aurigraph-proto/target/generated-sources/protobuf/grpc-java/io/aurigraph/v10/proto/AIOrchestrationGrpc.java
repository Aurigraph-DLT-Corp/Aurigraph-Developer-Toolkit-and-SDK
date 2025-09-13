package io.aurigraph.v10.proto;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * AI Orchestration Service
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.60.0)",
    comments = "Source: aurigraph.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class AIOrchestrationGrpc {

  private AIOrchestrationGrpc() {}

  public static final java.lang.String SERVICE_NAME = "aurigraph.v10.AIOrchestration";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AITask,
      io.aurigraph.v10.proto.AITaskResponse> getSubmitTaskMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SubmitTask",
      requestType = io.aurigraph.v10.proto.AITask.class,
      responseType = io.aurigraph.v10.proto.AITaskResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AITask,
      io.aurigraph.v10.proto.AITaskResponse> getSubmitTaskMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AITask, io.aurigraph.v10.proto.AITaskResponse> getSubmitTaskMethod;
    if ((getSubmitTaskMethod = AIOrchestrationGrpc.getSubmitTaskMethod) == null) {
      synchronized (AIOrchestrationGrpc.class) {
        if ((getSubmitTaskMethod = AIOrchestrationGrpc.getSubmitTaskMethod) == null) {
          AIOrchestrationGrpc.getSubmitTaskMethod = getSubmitTaskMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.AITask, io.aurigraph.v10.proto.AITaskResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SubmitTask"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AITask.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AITaskResponse.getDefaultInstance()))
              .setSchemaDescriptor(new AIOrchestrationMethodDescriptorSupplier("SubmitTask"))
              .build();
        }
      }
    }
    return getSubmitTaskMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStatusRequest,
      io.aurigraph.v10.proto.TaskStatus> getGetTaskStatusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetTaskStatus",
      requestType = io.aurigraph.v10.proto.TaskStatusRequest.class,
      responseType = io.aurigraph.v10.proto.TaskStatus.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStatusRequest,
      io.aurigraph.v10.proto.TaskStatus> getGetTaskStatusMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStatusRequest, io.aurigraph.v10.proto.TaskStatus> getGetTaskStatusMethod;
    if ((getGetTaskStatusMethod = AIOrchestrationGrpc.getGetTaskStatusMethod) == null) {
      synchronized (AIOrchestrationGrpc.class) {
        if ((getGetTaskStatusMethod = AIOrchestrationGrpc.getGetTaskStatusMethod) == null) {
          AIOrchestrationGrpc.getGetTaskStatusMethod = getGetTaskStatusMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.TaskStatusRequest, io.aurigraph.v10.proto.TaskStatus>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetTaskStatus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TaskStatusRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TaskStatus.getDefaultInstance()))
              .setSchemaDescriptor(new AIOrchestrationMethodDescriptorSupplier("GetTaskStatus"))
              .build();
        }
      }
    }
    return getGetTaskStatusMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStreamRequest,
      io.aurigraph.v10.proto.TaskUpdate> getStreamTaskUpdatesMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "StreamTaskUpdates",
      requestType = io.aurigraph.v10.proto.TaskStreamRequest.class,
      responseType = io.aurigraph.v10.proto.TaskUpdate.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStreamRequest,
      io.aurigraph.v10.proto.TaskUpdate> getStreamTaskUpdatesMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.TaskStreamRequest, io.aurigraph.v10.proto.TaskUpdate> getStreamTaskUpdatesMethod;
    if ((getStreamTaskUpdatesMethod = AIOrchestrationGrpc.getStreamTaskUpdatesMethod) == null) {
      synchronized (AIOrchestrationGrpc.class) {
        if ((getStreamTaskUpdatesMethod = AIOrchestrationGrpc.getStreamTaskUpdatesMethod) == null) {
          AIOrchestrationGrpc.getStreamTaskUpdatesMethod = getStreamTaskUpdatesMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.TaskStreamRequest, io.aurigraph.v10.proto.TaskUpdate>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "StreamTaskUpdates"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TaskStreamRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.TaskUpdate.getDefaultInstance()))
              .setSchemaDescriptor(new AIOrchestrationMethodDescriptorSupplier("StreamTaskUpdates"))
              .build();
        }
      }
    }
    return getStreamTaskUpdatesMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AIMetricsRequest,
      io.aurigraph.v10.proto.AIMetrics> getGetAIMetricsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetAIMetrics",
      requestType = io.aurigraph.v10.proto.AIMetricsRequest.class,
      responseType = io.aurigraph.v10.proto.AIMetrics.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AIMetricsRequest,
      io.aurigraph.v10.proto.AIMetrics> getGetAIMetricsMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.AIMetricsRequest, io.aurigraph.v10.proto.AIMetrics> getGetAIMetricsMethod;
    if ((getGetAIMetricsMethod = AIOrchestrationGrpc.getGetAIMetricsMethod) == null) {
      synchronized (AIOrchestrationGrpc.class) {
        if ((getGetAIMetricsMethod = AIOrchestrationGrpc.getGetAIMetricsMethod) == null) {
          AIOrchestrationGrpc.getGetAIMetricsMethod = getGetAIMetricsMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.AIMetricsRequest, io.aurigraph.v10.proto.AIMetrics>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetAIMetrics"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AIMetricsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.AIMetrics.getDefaultInstance()))
              .setSchemaDescriptor(new AIOrchestrationMethodDescriptorSupplier("GetAIMetrics"))
              .build();
        }
      }
    }
    return getGetAIMetricsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<io.aurigraph.v10.proto.OptimizationRequest,
      io.aurigraph.v10.proto.OptimizationResult> getOptimizeConsensusMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "OptimizeConsensus",
      requestType = io.aurigraph.v10.proto.OptimizationRequest.class,
      responseType = io.aurigraph.v10.proto.OptimizationResult.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<io.aurigraph.v10.proto.OptimizationRequest,
      io.aurigraph.v10.proto.OptimizationResult> getOptimizeConsensusMethod() {
    io.grpc.MethodDescriptor<io.aurigraph.v10.proto.OptimizationRequest, io.aurigraph.v10.proto.OptimizationResult> getOptimizeConsensusMethod;
    if ((getOptimizeConsensusMethod = AIOrchestrationGrpc.getOptimizeConsensusMethod) == null) {
      synchronized (AIOrchestrationGrpc.class) {
        if ((getOptimizeConsensusMethod = AIOrchestrationGrpc.getOptimizeConsensusMethod) == null) {
          AIOrchestrationGrpc.getOptimizeConsensusMethod = getOptimizeConsensusMethod =
              io.grpc.MethodDescriptor.<io.aurigraph.v10.proto.OptimizationRequest, io.aurigraph.v10.proto.OptimizationResult>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "OptimizeConsensus"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.OptimizationRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  io.aurigraph.v10.proto.OptimizationResult.getDefaultInstance()))
              .setSchemaDescriptor(new AIOrchestrationMethodDescriptorSupplier("OptimizeConsensus"))
              .build();
        }
      }
    }
    return getOptimizeConsensusMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static AIOrchestrationStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationStub>() {
        @java.lang.Override
        public AIOrchestrationStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AIOrchestrationStub(channel, callOptions);
        }
      };
    return AIOrchestrationStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static AIOrchestrationBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationBlockingStub>() {
        @java.lang.Override
        public AIOrchestrationBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AIOrchestrationBlockingStub(channel, callOptions);
        }
      };
    return AIOrchestrationBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static AIOrchestrationFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<AIOrchestrationFutureStub>() {
        @java.lang.Override
        public AIOrchestrationFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new AIOrchestrationFutureStub(channel, callOptions);
        }
      };
    return AIOrchestrationFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * AI Orchestration Service
   * </pre>
   */
  public interface AsyncService {

    /**
     */
    default void submitTask(io.aurigraph.v10.proto.AITask request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AITaskResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSubmitTaskMethod(), responseObserver);
    }

    /**
     */
    default void getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskStatus> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetTaskStatusMethod(), responseObserver);
    }

    /**
     */
    default void streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskUpdate> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getStreamTaskUpdatesMethod(), responseObserver);
    }

    /**
     */
    default void getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AIMetrics> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetAIMetricsMethod(), responseObserver);
    }

    /**
     */
    default void optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.OptimizationResult> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getOptimizeConsensusMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service AIOrchestration.
   * <pre>
   * AI Orchestration Service
   * </pre>
   */
  public static abstract class AIOrchestrationImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return AIOrchestrationGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service AIOrchestration.
   * <pre>
   * AI Orchestration Service
   * </pre>
   */
  public static final class AIOrchestrationStub
      extends io.grpc.stub.AbstractAsyncStub<AIOrchestrationStub> {
    private AIOrchestrationStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AIOrchestrationStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AIOrchestrationStub(channel, callOptions);
    }

    /**
     */
    public void submitTask(io.aurigraph.v10.proto.AITask request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AITaskResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSubmitTaskMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskStatus> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetTaskStatusMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void streamTaskUpdates(io.aurigraph.v10.proto.TaskStreamRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskUpdate> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getStreamTaskUpdatesMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AIMetrics> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetAIMetricsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request,
        io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.OptimizationResult> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getOptimizeConsensusMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service AIOrchestration.
   * <pre>
   * AI Orchestration Service
   * </pre>
   */
  public static final class AIOrchestrationBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<AIOrchestrationBlockingStub> {
    private AIOrchestrationBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AIOrchestrationBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AIOrchestrationBlockingStub(channel, callOptions);
    }

    /**
     */
    public io.aurigraph.v10.proto.AITaskResponse submitTask(io.aurigraph.v10.proto.AITask request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSubmitTaskMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.TaskStatus getTaskStatus(io.aurigraph.v10.proto.TaskStatusRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetTaskStatusMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<io.aurigraph.v10.proto.TaskUpdate> streamTaskUpdates(
        io.aurigraph.v10.proto.TaskStreamRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getStreamTaskUpdatesMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.AIMetrics getAIMetrics(io.aurigraph.v10.proto.AIMetricsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetAIMetricsMethod(), getCallOptions(), request);
    }

    /**
     */
    public io.aurigraph.v10.proto.OptimizationResult optimizeConsensus(io.aurigraph.v10.proto.OptimizationRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getOptimizeConsensusMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service AIOrchestration.
   * <pre>
   * AI Orchestration Service
   * </pre>
   */
  public static final class AIOrchestrationFutureStub
      extends io.grpc.stub.AbstractFutureStub<AIOrchestrationFutureStub> {
    private AIOrchestrationFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected AIOrchestrationFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new AIOrchestrationFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.AITaskResponse> submitTask(
        io.aurigraph.v10.proto.AITask request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSubmitTaskMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.TaskStatus> getTaskStatus(
        io.aurigraph.v10.proto.TaskStatusRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetTaskStatusMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.AIMetrics> getAIMetrics(
        io.aurigraph.v10.proto.AIMetricsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetAIMetricsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<io.aurigraph.v10.proto.OptimizationResult> optimizeConsensus(
        io.aurigraph.v10.proto.OptimizationRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getOptimizeConsensusMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_SUBMIT_TASK = 0;
  private static final int METHODID_GET_TASK_STATUS = 1;
  private static final int METHODID_STREAM_TASK_UPDATES = 2;
  private static final int METHODID_GET_AIMETRICS = 3;
  private static final int METHODID_OPTIMIZE_CONSENSUS = 4;

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
        case METHODID_SUBMIT_TASK:
          serviceImpl.submitTask((io.aurigraph.v10.proto.AITask) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AITaskResponse>) responseObserver);
          break;
        case METHODID_GET_TASK_STATUS:
          serviceImpl.getTaskStatus((io.aurigraph.v10.proto.TaskStatusRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskStatus>) responseObserver);
          break;
        case METHODID_STREAM_TASK_UPDATES:
          serviceImpl.streamTaskUpdates((io.aurigraph.v10.proto.TaskStreamRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.TaskUpdate>) responseObserver);
          break;
        case METHODID_GET_AIMETRICS:
          serviceImpl.getAIMetrics((io.aurigraph.v10.proto.AIMetricsRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.AIMetrics>) responseObserver);
          break;
        case METHODID_OPTIMIZE_CONSENSUS:
          serviceImpl.optimizeConsensus((io.aurigraph.v10.proto.OptimizationRequest) request,
              (io.grpc.stub.StreamObserver<io.aurigraph.v10.proto.OptimizationResult>) responseObserver);
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
          getSubmitTaskMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.AITask,
              io.aurigraph.v10.proto.AITaskResponse>(
                service, METHODID_SUBMIT_TASK)))
        .addMethod(
          getGetTaskStatusMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.TaskStatusRequest,
              io.aurigraph.v10.proto.TaskStatus>(
                service, METHODID_GET_TASK_STATUS)))
        .addMethod(
          getStreamTaskUpdatesMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.TaskStreamRequest,
              io.aurigraph.v10.proto.TaskUpdate>(
                service, METHODID_STREAM_TASK_UPDATES)))
        .addMethod(
          getGetAIMetricsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.AIMetricsRequest,
              io.aurigraph.v10.proto.AIMetrics>(
                service, METHODID_GET_AIMETRICS)))
        .addMethod(
          getOptimizeConsensusMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              io.aurigraph.v10.proto.OptimizationRequest,
              io.aurigraph.v10.proto.OptimizationResult>(
                service, METHODID_OPTIMIZE_CONSENSUS)))
        .build();
  }

  private static abstract class AIOrchestrationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    AIOrchestrationBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return io.aurigraph.v10.proto.Aurigraph.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("AIOrchestration");
    }
  }

  private static final class AIOrchestrationFileDescriptorSupplier
      extends AIOrchestrationBaseDescriptorSupplier {
    AIOrchestrationFileDescriptorSupplier() {}
  }

  private static final class AIOrchestrationMethodDescriptorSupplier
      extends AIOrchestrationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    AIOrchestrationMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (AIOrchestrationGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new AIOrchestrationFileDescriptorSupplier())
              .addMethod(getSubmitTaskMethod())
              .addMethod(getGetTaskStatusMethod())
              .addMethod(getStreamTaskUpdatesMethod())
              .addMethod(getGetAIMetricsMethod())
              .addMethod(getOptimizeConsensusMethod())
              .build();
        }
      }
    }
    return result;
  }
}
