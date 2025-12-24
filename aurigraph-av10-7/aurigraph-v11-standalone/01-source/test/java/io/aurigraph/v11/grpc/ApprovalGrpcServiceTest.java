package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Story 8, Phase 3: Unit Tests for ApprovalGrpcService
 *
 * Test Coverage:
 * - Unary RPC methods (submit, get, respond)
 * - Server-side streaming
 * - Client-side streaming (batch)
 * - Bidirectional streaming
 * - Health checks
 * - Error handling
 * - Concurrent operations
 * - Event broadcasting
 *
 * Target: 15+ tests, 85%+ code coverage
 */
@QuarkusTest
public class ApprovalGrpcServiceTest {

    @Inject
    private ApprovalGrpcService approvalService;

    @Mock
    private StreamObserver<ApprovalStatus_Message> statusObserver;

    @Mock
    private StreamObserver<ApprovalEvent> eventObserver;

    @Mock
    private StreamObserver<BatchResponse> batchObserver;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================================================================
    // Test 1: submitApprovalRequest - Basic unary RPC
    // ========================================================================
    @Test
    public void testSubmitApprovalRequest() {
        // Arrange
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
            .setPriority(ApprovalPriority.APPROVAL_PRIORITY_HIGH)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("test content"))
            .setContentHash("abc123def456")
            .setRequiredApprovals(3)
            .setTotalValidators(5)
            .build();

        // Act
        approvalService.submitApprovalRequest(request, statusObserver);

        // Assert
        verify(statusObserver, times(1)).onNext(any(ApprovalStatus_Message.class));
        verify(statusObserver, times(1)).onCompleted();
        verify(statusObserver, never()).onError(any());
    }

    // ========================================================================
    // Test 2: getApprovalStatus - Retrieve existing approval
    // ========================================================================
    @Test
    public void testGetApprovalStatus() {
        // Arrange: Create approval first
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_CONTRACT_DEPLOYMENT)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("content"))
            .setContentHash("hash123")
            .setRequiredApprovals(2)
            .setTotalValidators(4)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Get status
        GetApprovalRequest getRequest = GetApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .build();

        approvalService.getApprovalStatus(getRequest, statusObserver);

        // Assert
        verify(statusObserver, atLeast(2)).onNext(any(ApprovalStatus_Message.class));
        verify(statusObserver, times(2)).onCompleted();
    }

    // ========================================================================
    // Test 3: getApprovalStatus - Not found error handling
    // ========================================================================
    @Test
    public void testGetApprovalStatusNotFound() {
        // Arrange
        GetApprovalRequest request = GetApprovalRequest.newBuilder()
            .setApprovalId("non-existent-id")
            .build();

        // Act
        approvalService.getApprovalStatus(request, statusObserver);

        // Assert
        verify(statusObserver, never()).onNext(any());
        verify(statusObserver, never()).onCompleted();
        verify(statusObserver, times(1)).onError(any(Throwable.class));
    }

    // ========================================================================
    // Test 4: submitValidatorResponse - Approve decision
    // ========================================================================
    @Test
    public void testSubmitValidatorResponseApprove() {
        // Arrange: Create approval
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_PERMISSION_CHANGE)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("content"))
            .setContentHash("hash123")
            .setRequiredApprovals(2)
            .setTotalValidators(3)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Submit approval
        ApprovalResponse response = ApprovalResponse.newBuilder()
            .setApprovalId(approvalId)
            .setValidatorId(UUID.randomUUID().toString())
            .setDecision(ValidatorDecision.VALIDATOR_DECISION_APPROVE)
            .setSignatureAlgorithm("CRYSTALS-Dilithium")
            .build();

        approvalService.submitValidatorResponse(response, statusObserver);

        // Assert
        verify(statusObserver, atLeast(2)).onNext(argThat(status ->
            status.getApprovalId().equals(approvalId) && status.getApprovalsCount() >= 1
        ));
        verify(statusObserver, times(2)).onCompleted();
    }

    // ========================================================================
    // Test 5: submitValidatorResponse - Multiple responses
    // ========================================================================
    @Test
    public void testSubmitMultipleValidatorResponses() {
        // Arrange
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_PROTOCOL_UPGRADE)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("upgrade"))
            .setContentHash("hash456")
            .setRequiredApprovals(3)
            .setTotalValidators(5)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Submit multiple responses
        for (int i = 0; i < 3; i++) {
            ApprovalResponse response = ApprovalResponse.newBuilder()
                .setApprovalId(approvalId)
                .setValidatorId(UUID.randomUUID().toString())
                .setDecision(i < 2 ? ValidatorDecision.VALIDATOR_DECISION_APPROVE :
                              ValidatorDecision.VALIDATOR_DECISION_REJECT)
                .build();

            approvalService.submitValidatorResponse(response, statusObserver);
        }

        // Assert: Verify counts
        verify(statusObserver, atLeast(4)).onNext(any());
    }

    // ========================================================================
    // Test 6: watchApprovalUpdates - Server streaming
    // ========================================================================
    @Test
    public void testWatchApprovalUpdates() {
        // Arrange: Create approval
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_EMERGENCY)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("emergency"))
            .setContentHash("hash789")
            .setRequiredApprovals(1)
            .setTotalValidators(3)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Watch updates
        WatchApprovalRequest watchRequest = WatchApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setIncludeHistory(false)
            .build();

        approvalService.watchApprovalUpdates(watchRequest, eventObserver);

        // Assert: Initial event sent
        verify(eventObserver, atLeast(1)).onNext(any(ApprovalEvent.class));
    }

    // ========================================================================
    // Test 7: streamPendingApprovals - Server streaming list
    // ========================================================================
    @Test
    public void testStreamPendingApprovals() {
        // Arrange: Create multiple approvals
        for (int i = 0; i < 5; i++) {
            ApprovalRequest request = ApprovalRequest.newBuilder()
                .setApprovalId(UUID.randomUUID().toString())
                .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
                .setRequesterId(UUID.randomUUID().toString())
                .setContent(com.google.protobuf.ByteString.copyFromUtf8("test"))
                .setContentHash("hash" + i)
                .setRequiredApprovals(2)
                .setTotalValidators(4)
                .build();

            approvalService.submitApprovalRequest(request, statusObserver);
        }

        // Act
        StreamPendingRequest streamRequest = StreamPendingRequest.newBuilder()
            .setMinPriority(ApprovalPriority.APPROVAL_PRIORITY_LOW)
            .setBatchSize(10)
            .build();

        approvalService.streamPendingApprovals(streamRequest, statusObserver);

        // Assert
        verify(statusObserver, atLeast(5)).onNext(any());
        verify(statusObserver).onCompleted();
    }

    // ========================================================================
    // Test 8: batchSubmitResponses - Client streaming
    // ========================================================================
    @Test
    public void testBatchSubmitResponses() throws InterruptedException {
        // Arrange: Create approval
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("test"))
            .setContentHash("hash123")
            .setRequiredApprovals(3)
            .setTotalValidators(5)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Get batch observer
        StreamObserver<ApprovalResponse> requestObserver =
            approvalService.batchSubmitResponses(batchObserver);

        // Send batch responses
        for (int i = 0; i < 5; i++) {
            ApprovalResponse response = ApprovalResponse.newBuilder()
                .setApprovalId(approvalId)
                .setValidatorId(UUID.randomUUID().toString())
                .setDecision(ValidatorDecision.VALIDATOR_DECISION_APPROVE)
                .build();

            requestObserver.onNext(response);
        }

        requestObserver.onCompleted();

        // Assert
        verify(batchObserver, times(1)).onNext(any(BatchResponse.class));
        verify(batchObserver, times(1)).onCompleted();
    }

    // ========================================================================
    // Test 9: bidirectionalApprovalStream - Bidirectional streaming
    // ========================================================================
    @Test
    public void testBidirectionalApprovalStream() {
        // Arrange
        StreamObserver<ApprovalEvent> eventResponseObserver = mock(StreamObserver.class);

        // Act: Get bidirectional stream observer
        StreamObserver<ApprovalRequest> requestObserver =
            approvalService.bidirectionalApprovalStream(eventResponseObserver);

        // Send approval requests
        String approvalId1 = UUID.randomUUID().toString();
        ApprovalRequest request1 = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId1)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("test1"))
            .setContentHash("hash1")
            .setRequiredApprovals(2)
            .setTotalValidators(4)
            .build();

        requestObserver.onNext(request1);

        // Assert: Event should be sent back
        verify(eventResponseObserver, atLeast(1)).onNext(any(ApprovalEvent.class));

        // Complete stream
        requestObserver.onCompleted();
        verify(eventResponseObserver, times(1)).onCompleted();
    }

    // ========================================================================
    // Test 10: checkHealth - Health check endpoint
    // ========================================================================
    @Test
    public void testCheckHealth() {
        // Arrange
        HealthCheckRequest request = HealthCheckRequest.newBuilder()
            .setServiceName("approval-service")
            .build();

        // Act
        approvalService.checkHealth(request, eventObserver);

        // Assert: Verify health check response (uses different mock, but pattern same)
        StreamObserver<ApprovalServiceHealthCheck> healthObserver = mock(StreamObserver.class);
        approvalService.checkHealth(request, healthObserver);

        verify(healthObserver, times(1)).onNext(argThat(health ->
            health.getHealthStatus() == HealthStatus.HEALTH_SERVING &&
            health.getServiceVersion().contains("story8")
        ));
    }

    // ========================================================================
    // Test 11: submitValidatorResponse - Reject decision
    // ========================================================================
    @Test
    public void testSubmitValidatorResponseReject() {
        // Arrange
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_RISK_MITIGATION)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("test"))
            .setContentHash("hash123")
            .setRequiredApprovals(2)
            .setTotalValidators(3)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Submit rejection
        ApprovalResponse response = ApprovalResponse.newBuilder()
            .setApprovalId(approvalId)
            .setValidatorId(UUID.randomUUID().toString())
            .setDecision(ValidatorDecision.VALIDATOR_DECISION_REJECT)
            .setReason("Security concern")
            .build();

        approvalService.submitValidatorResponse(response, statusObserver);

        // Assert
        verify(statusObserver, atLeast(2)).onNext(argThat(status ->
            status.getApprovalId().equals(approvalId) && status.getRejectionsCount() >= 1
        ));
    }

    // ========================================================================
    // Test 12: submitValidatorResponse - Abstain decision
    // ========================================================================
    @Test
    public void testSubmitValidatorResponseAbstain() {
        // Arrange
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("test"))
            .setContentHash("hash456")
            .setRequiredApprovals(2)
            .setTotalValidators(5)
            .build();

        approvalService.submitApprovalRequest(request, statusObserver);

        // Act: Submit abstention
        ApprovalResponse response = ApprovalResponse.newBuilder()
            .setApprovalId(approvalId)
            .setValidatorId(UUID.randomUUID().toString())
            .setDecision(ValidatorDecision.VALIDATOR_DECISION_ABSTAIN)
            .setReason("Insufficient information")
            .build();

        approvalService.submitValidatorResponse(response, statusObserver);

        // Assert
        verify(statusObserver, atLeast(2)).onNext(argThat(status ->
            status.getApprovalId().equals(approvalId) && status.getAbstentionsCount() >= 1
        ));
    }

    // ========================================================================
    // Test 13: Concurrent approval submissions
    // ========================================================================
    @Test
    public void testConcurrentApprovalSubmissions() throws InterruptedException {
        // Arrange
        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        // Act: Submit approvals concurrently
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    ApprovalRequest request = ApprovalRequest.newBuilder()
                        .setApprovalId(UUID.randomUUID().toString())
                        .setApprovalType(ApprovalType.APPROVAL_TYPE_LARGE_TRANSACTION)
                        .setRequesterId(UUID.randomUUID().toString())
                        .setContent(com.google.protobuf.ByteString.copyFromUtf8("test" + index))
                        .setContentHash("hash" + index)
                        .setRequiredApprovals(2)
                        .setTotalValidators(4)
                        .build();

                    StreamObserver<ApprovalStatus_Message> obs = mock(StreamObserver.class);
                    approvalService.submitApprovalRequest(request, obs);
                    successCount.incrementAndGet();

                } finally {
                    latch.countDown();
                }
            });
        }

        // Wait for all threads
        assertTrue(latch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        // Assert
        assertEquals(threadCount, successCount.get());
    }

    // ========================================================================
    // Test 14: Approval expiration validation
    // ========================================================================
    @Test
    public void testApprovalExpiration() {
        // Arrange
        String approvalId = UUID.randomUUID().toString();
        ApprovalRequest request = ApprovalRequest.newBuilder()
            .setApprovalId(approvalId)
            .setApprovalType(ApprovalType.APPROVAL_TYPE_EMERGENCY)
            .setRequesterId(UUID.randomUUID().toString())
            .setContent(com.google.protobuf.ByteString.copyFromUtf8("urgent"))
            .setContentHash("hash789")
            .setRequiredApprovals(1)
            .setTotalValidators(2)
            // Expires in 1 second (for test purposes)
            .setExpiresAt(com.google.protobuf.Timestamp.newBuilder()
                .setSeconds(System.currentTimeMillis() / 1000 + 1)
                .build())
            .build();

        // Act
        approvalService.submitApprovalRequest(request, statusObserver);

        // Assert: Status should be PENDING
        verify(statusObserver, times(1)).onNext(argThat(status ->
            status.getStatus() == ApprovalStatus.APPROVAL_STATUS_PENDING
        ));
    }

    // ========================================================================
    // Test 15: Error handling for invalid requests
    // ========================================================================
    @Test
    public void testErrorHandling() {
        // Arrange: Attempt to get non-existent approval
        GetApprovalRequest request = GetApprovalRequest.newBuilder()
            .setApprovalId("") // Invalid: empty ID
            .build();

        // Act
        approvalService.getApprovalStatus(request, statusObserver);

        // Assert: Should error
        verify(statusObserver, times(1)).onError(any(Throwable.class));
        verify(statusObserver, never()).onNext(any());
    }
}
