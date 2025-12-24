package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import jakarta.inject.Singleton;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

/**
 * Sprint 15: ApprovalGrpcService - Story 8 Migration
 *
 * gRPC implementation of approval workflow for large transactions.
 * Replaces REST endpoints with native gRPC for better performance.
 */
@Singleton
public class ApprovalGrpcService extends ApprovalGrpcServiceGrpc.ApprovalGrpcServiceImplBase {

    private static final Logger LOG = Logger.getLogger(ApprovalGrpcService.class.getName());

    private final ConcurrentHashMap<String, ApprovalData> approvals = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<StreamObserver<ApprovalStatusUpdate_Message>> subscribers = new CopyOnWriteArrayList<>();
    private final AtomicLong totalApprovals = new AtomicLong(0);
    private final ExecutorService executor = Executors.newFixedThreadPool(10);

    private static class ApprovalData {
        String approvalId;
        ApprovalType type;
        int requiredApprovals;
        Set<String> approvedBy = ConcurrentHashMap.newKeySet();
        ApprovalStatusEnum status = ApprovalStatusEnum.APPROVAL_STATUS_PENDING;
        long createdAt = System.currentTimeMillis();
    }

    @Override
    public void submitApprovalRequest(ApprovalRequest request, StreamObserver<ApprovalReceipt> responseObserver) {
        try {
            ApprovalData approval = new ApprovalData();
            approval.approvalId = request.getApprovalId();
            approval.type = request.getApprovalType();
            approval.requiredApprovals = request.getRequiredApprovals();

            approvals.put(request.getApprovalId(), approval);
            totalApprovals.incrementAndGet();

            ApprovalReceipt receipt = ApprovalReceipt.newBuilder()
                .setApprovalId(request.getApprovalId())
                .setApprovalType(request.getApprovalType())
                .setAccepted(true)
                .setMessage("Approval request submitted")
                .setRequiredApprovals(request.getRequiredApprovals())
                .setCurrentApprovals(0)
                .setTimestamp(Instant.now().toString())
                .build();

            responseObserver.onNext(receipt);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void getApprovalStatus(ApprovalIdRequest request, StreamObserver<ApprovalStatus_Message> responseObserver) {
        try {
            ApprovalData approval = approvals.get(request.getApprovalId());
            if (approval == null) {
                responseObserver.onError(new Exception("Approval not found"));
                return;
            }

            ApprovalStatus_Message status = ApprovalStatus_Message.newBuilder()
                .setApprovalId(approval.approvalId)
                .setStatus(approval.status)
                .setApprovalsReceived(approval.approvedBy.size())
                .setApprovalsRequired(approval.requiredApprovals)
                .setUpdatedAt(Instant.now().toString())
                .build();

            responseObserver.onNext(status);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void submitApprovalVote(ApprovalVote_Message request, StreamObserver<VoteResponse_Message> responseObserver) {
        try {
            ApprovalData approval = approvals.get(request.getApprovalId());
            if (approval == null) {
                responseObserver.onError(new Exception("Approval not found"));
                return;
            }

            if (request.getApproved()) {
                approval.approvedBy.add(request.getApproverId());
            }

            boolean finalized = approval.approvedBy.size() >= approval.requiredApprovals;
            if (finalized) {
                approval.status = ApprovalStatusEnum.APPROVAL_STATUS_APPROVED;
            }

            VoteResponse_Message response = VoteResponse_Message.newBuilder()
                .setApprovalId(request.getApprovalId())
                .setVoteRecorded(true)
                .setCurrentApprovals(approval.approvedBy.size())
                .setApprovalFinalized(finalized)
                .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

            if (finalized) {
                broadcastUpdate(request.getApprovalId(), approval.status, approval.approvedBy.size());
            }
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void streamApprovalUpdates(WebhookSubscription request, StreamObserver<ApprovalStatusUpdate_Message> responseObserver) {
        subscribers.add(responseObserver);
        LOG.info("Approval subscriber connected");
    }

    @Override
    public void checkHealth(Empty request, StreamObserver<HealthStatus> responseObserver) {
        HealthStatus health = HealthStatus.newBuilder()
            .setServiceName("ApprovalGrpcService")
            .setStatus("UP")
            .setUptimeSeconds((System.currentTimeMillis() / 1000))
            .build();
        responseObserver.onNext(health);
        responseObserver.onCompleted();
    }

    private void broadcastUpdate(String approvalId, ApprovalStatusEnum status, int approvals) {
        ApprovalStatusUpdate_Message update = ApprovalStatusUpdate_Message.newBuilder()
            .setApprovalId(approvalId)
            .setStatus(status)
            .setCurrentApprovals(approvals)
            .setTimestamp(Instant.now().toString())
            .build();

        for (StreamObserver<ApprovalStatusUpdate_Message> subscriber : subscribers) {
            try {
                subscriber.onNext(update);
            } catch (Exception e) {
                subscribers.remove(subscriber);
            }
        }
    }
}
