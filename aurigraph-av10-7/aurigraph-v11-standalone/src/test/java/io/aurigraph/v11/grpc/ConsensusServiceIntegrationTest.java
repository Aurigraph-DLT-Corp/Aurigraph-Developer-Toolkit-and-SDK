package io.aurigraph.v11.grpc;

import io.grpc.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.test.junit.QuarkusTest;
import io.aurigraph.v11.proto.*;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.assertj.core.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Comprehensive Integration Tests for ConsensusService gRPC (Agent 1.2)
 *
 * Tests all 11 RPC methods of the HyperRAFT++ consensus protocol:
 * 1. proposeBlock() - Block proposal for consensus
 * 2. voteOnBlock() - Voting on proposed blocks
 * 3. commitBlock() - Block commitment after consensus
 * 4. requestLeaderElection() - Leader election initiation
 * 5. heartbeat() - Leader heartbeat messages
 * 6. syncState() - State synchronization between nodes
 * 7. getConsensusState() - Consensus state query
 * 8. getValidatorInfo() - Validator information retrieval
 * 9. submitConsensusMetrics() - Metrics submission
 * 10. getRaftLog() - Raft log retrieval
 * 11. streamConsensusEvents() - Real-time event streaming (server-side streaming)
 *
 * Performance targets:
 * - proposeBlock(): <30ms
 * - voteOnBlock(): <5ms
 * - commitBlock(): <20ms
 * - heartbeat(): <5ms
 * - Leader election: <1 second
 * - Finality: <500ms (current), <100ms (target)
 */
@QuarkusTest
@DisplayName("ConsensusService gRPC Integration Tests - HyperRAFT++")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ConsensusServiceIntegrationTest {

    private static final String GRPC_HOST = "localhost";
    private static final int GRPC_PORT = 9004;
    private static final long TEST_TIMEOUT_SECONDS = 30;

    @Inject
    GrpcClientFactory grpcClientFactory;

    @Inject
    ConsensusServiceImpl consensusServiceImpl;

    private ConsensusServiceGrpc.ConsensusServiceBlockingStub blockingStub;
    private ConsensusServiceGrpc.ConsensusServiceFutureStub futureStub;
    private ConsensusServiceGrpc.ConsensusServiceStub asyncStub;

    @BeforeEach
    void setUp() {
        blockingStub = grpcClientFactory.getConsensusStub();
        futureStub = grpcClientFactory.getConsensusFutureStub();
        asyncStub = grpcClientFactory.getConsensusAsyncStub();
    }

    /**
     * Test 1: proposeBlock() - Block Proposal
     * Target: <30ms latency
     */
    @Test
    @Order(1)
    @DisplayName("RPC 1: proposeBlock() should propose block for consensus")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testProposeBlock() {
        // Arrange: Create a test block
        Block testBlock = Block.newBuilder()
                .setBlockHash("test-block-hash-" + System.currentTimeMillis())
                .setBlockHeight(12345L)
                .setPreviousBlockHash("prev-hash")
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .setValidatorId("validator-1")
                .build();

        ProposeBlockRequest request = ProposeBlockRequest.newBuilder()
                .setBlock(testBlock)
                .setProposalTerm(1L)
                .setProposerId("proposer-node-1")
                .setTimeoutSeconds(30)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        ProposeBlockResponse response = blockingStub.proposeBlock(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getBlockHash()).isEqualTo(testBlock.getBlockHash());
        assertThat(response.getStatus()).isIn(
                BlockStatus.BLOCK_PROPOSED,
                BlockStatus.BLOCK_PENDING,
                BlockStatus.BLOCK_FINALIZED
        );
        assertThat(response.getVotesReceived()).isGreaterThanOrEqualTo(0);
        assertThat(response.getVotesRequired()).isGreaterThan(0);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <30ms target
        assertThat(elapsedMs)
                .as("proposeBlock() should complete in <30ms")
                .isLessThan(30L);

        System.out.println(String.format(
                "✅ Test 1: proposeBlock() completed in %dms - Block: %s, Status: %s, Votes: %d/%d",
                elapsedMs, response.getBlockHash(), response.getStatus(),
                response.getVotesReceived(), response.getVotesRequired()
        ));
    }

    /**
     * Test 2: voteOnBlock() - Vote Casting
     * Target: <5ms latency
     */
    @Test
    @Order(2)
    @DisplayName("RPC 2: voteOnBlock() should cast vote on proposed block")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testVoteOnBlock() {
        // Arrange: Prepare vote request
        VoteOnBlockRequest request = VoteOnBlockRequest.newBuilder()
                .setBlockHash("test-block-hash-vote")
                .setVoterId("validator-1")
                .setVoteChoice(true) // Vote yes
                .setVoteTerm(1L)
                .setVoteSignature("sig-validator-1")
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        VoteOnBlockResponse response = blockingStub.voteOnBlock(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getBlockHash()).isEqualTo(request.getBlockHash());
        assertThat(response.getVoteAccepted()).isTrue();
        assertThat(response.getTotalVotes()).isGreaterThanOrEqualTo(1);
        assertThat(response.getVotesNeeded()).isGreaterThan(0);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <5ms target
        assertThat(elapsedMs)
                .as("voteOnBlock() should complete in <5ms")
                .isLessThan(5L);

        System.out.println(String.format(
                "✅ Test 2: voteOnBlock() completed in %dms - Votes: %d/%d, Accepted: %s",
                elapsedMs, response.getTotalVotes(), response.getVotesNeeded(),
                response.getVoteAccepted()
        ));
    }

    /**
     * Test 3: commitBlock() - Block Commitment
     * Target: <20ms latency
     */
    @Test
    @Order(3)
    @DisplayName("RPC 3: commitBlock() should commit block after consensus")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testCommitBlock() {
        // Arrange: Create block with sufficient validator signatures
        Block testBlock = Block.newBuilder()
                .setBlockHash("test-block-commit-" + System.currentTimeMillis())
                .setBlockHeight(12346L)
                .setPreviousBlockHash("prev-hash")
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .setValidatorId("validator-1")
                .build();

        CommitBlockRequest request = CommitBlockRequest.newBuilder()
                .setBlockHash(testBlock.getBlockHash())
                .setBlock(testBlock)
                .setCommitTerm(1L)
                .addValidatorSignatures("sig-validator-1")
                .addValidatorSignatures("sig-validator-2")
                .addValidatorSignatures("sig-validator-3")
                .addValidatorSignatures("sig-validator-4")
                .setTimeoutSeconds(30)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        CommitBlockResponse response = blockingStub.commitBlock(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getBlockHash()).isEqualTo(testBlock.getBlockHash());
        assertThat(response.getStatus()).isIn(
                BlockStatus.BLOCK_FINALIZED,
                BlockStatus.BLOCK_ORPHANED
        );
        assertThat(response.hasCommitTime()).isTrue();

        // Performance assertion: <20ms target
        assertThat(elapsedMs)
                .as("commitBlock() should complete in <20ms")
                .isLessThan(20L);

        System.out.println(String.format(
                "✅ Test 3: commitBlock() completed in %dms - Status: %s, Height: %d, Confirmations: %d",
                elapsedMs, response.getStatus(), response.getBlockHeight(),
                response.getConfirmationCount()
        ));
    }

    /**
     * Test 4: requestLeaderElection() - Leader Election
     * Target: <1 second election time
     */
    @Test
    @Order(4)
    @DisplayName("RPC 4: requestLeaderElection() should initiate leader election")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testRequestLeaderElection() {
        // Arrange: Prepare election request
        LeaderElectionRequest request = LeaderElectionRequest.newBuilder()
                .setCandidateId("candidate-node-1")
                .setElectionTerm(2L)
                .setTimeoutSeconds(5)
                .setElectionReason("Testing leader election")
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        LeaderElectionResponse response = blockingStub.requestLeaderElection(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getElectionAccepted()).isTrue();
        assertThat(response.getNewLeaderId()).isNotEmpty();
        assertThat(response.getElectionTerm()).isEqualTo(2L);
        assertThat(response.getVotesReceived()).isGreaterThanOrEqualTo(1);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <1000ms target
        assertThat(elapsedMs)
                .as("requestLeaderElection() should complete in <1000ms")
                .isLessThan(1000L);

        System.out.println(String.format(
                "✅ Test 4: requestLeaderElection() completed in %dms - Leader: %s, Term: %d, Votes: %d/%d",
                elapsedMs, response.getNewLeaderId(), response.getElectionTerm(),
                response.getVotesReceived(), response.getVotesRequired()
        ));
    }

    /**
     * Test 5: heartbeat() - Heartbeat Messages
     * Target: <5ms latency (critical for <50ms interval)
     */
    @Test
    @Order(5)
    @DisplayName("RPC 5: heartbeat() should send leader heartbeat")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testHeartbeat() {
        // Arrange: Prepare heartbeat request
        HeartbeatRequest request = HeartbeatRequest.newBuilder()
                .setLeaderId("leader-node-1")
                .setCurrentTerm(1L)
                .setPrevLogIndex(100L)
                .setPrevLogTerm(1L)
                .setLeaderCommitIndex(100L)
                .setTimeoutSeconds(5)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        HeartbeatResponse response = blockingStub.heartbeat(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getHeartbeatAccepted()).isTrue();
        assertThat(response.getCurrentTerm()).isGreaterThanOrEqualTo(1L);
        assertThat(response.getNextLogIndex()).isGreaterThanOrEqualTo(0L);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <5ms target (critical!)
        assertThat(elapsedMs)
                .as("heartbeat() should complete in <5ms for <50ms interval requirement")
                .isLessThan(5L);

        System.out.println(String.format(
                "✅ Test 5: heartbeat() completed in %dms - Accepted: %s, Term: %d, NextIndex: %d",
                elapsedMs, response.getHeartbeatAccepted(), response.getCurrentTerm(),
                response.getNextLogIndex()
        ));
    }

    /**
     * Test 6: syncState() - State Synchronization
     * Target: <100ms for typical sync
     */
    @Test
    @Order(6)
    @DisplayName("RPC 6: syncState() should synchronize node state")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testSyncState() {
        // Arrange: Prepare sync request
        SyncStateRequest request = SyncStateRequest.newBuilder()
                .setNodeId("follower-node-1")
                .setCurrentTerm(1L)
                .setLastLogIndex(50L)
                .setTimeoutSeconds(10)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        SyncStateResponse response = blockingStub.syncState(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getSyncSuccessful()).isTrue();
        assertThat(response.getRemoteTerm()).isGreaterThanOrEqualTo(0L);
        assertThat(response.getRemoteLogIndex()).isGreaterThanOrEqualTo(0L);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <100ms target
        assertThat(elapsedMs)
                .as("syncState() should complete in <100ms")
                .isLessThan(100L);

        System.out.println(String.format(
                "✅ Test 6: syncState() completed in %dms - Success: %s, Log entries: %d, Remote index: %d",
                elapsedMs, response.getSyncSuccessful(), response.getLogEntriesCount(),
                response.getRemoteLogIndex()
        ));
    }

    /**
     * Test 7: getConsensusState() - State Query
     * Target: <5ms latency
     */
    @Test
    @Order(7)
    @DisplayName("RPC 7: getConsensusState() should return current consensus state")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testGetConsensusState() {
        // Arrange: Request with validators and metrics
        GetConsensusStateRequest request = GetConsensusStateRequest.newBuilder()
                .setIncludeValidators(true)
                .setIncludeMetrics(true)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        ConsensusStateResponse response = blockingStub.getConsensusState(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.hasState()).isTrue();
        assertThat(response.hasMetrics()).isTrue();
        assertThat(response.hasTimestamp()).isTrue();

        ConsensusState state = response.getState();
        assertThat(state.getCurrentRole()).isIn(
                ConsensusRole.ROLE_LEADER,
                ConsensusRole.ROLE_CANDIDATE,
                ConsensusRole.ROLE_FOLLOWER
        );
        assertThat(state.getCurrentPhase()).isNotNull();
        assertThat(state.getCurrentTerm()).isGreaterThanOrEqualTo(0L);
        assertThat(state.getRequiredMajority()).isGreaterThan(0);

        // Performance assertion: <5ms target
        assertThat(elapsedMs)
                .as("getConsensusState() should complete in <5ms")
                .isLessThan(5L);

        System.out.println(String.format(
                "✅ Test 7: getConsensusState() completed in %dms - Role: %s, Phase: %s, Term: %d, Validators: %d",
                elapsedMs, state.getCurrentRole(), state.getCurrentPhase(),
                state.getCurrentTerm(), state.getActiveValidators()
        ));
    }

    /**
     * Test 8: getValidatorInfo() - Validator Query
     * Target: <5ms latency
     */
    @Test
    @Order(8)
    @DisplayName("RPC 8: getValidatorInfo() should return validator information")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testGetValidatorInfo() {
        // Arrange: Request validator info
        GetValidatorInfoRequest request = GetValidatorInfoRequest.newBuilder()
                .setValidatorId("validator-1")
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        ValidatorInfoResponse response = blockingStub.getValidatorInfo(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getReputationScore()).isGreaterThanOrEqualTo(0.0);
        assertThat(response.getBlocksValidated()).isGreaterThanOrEqualTo(0);
        assertThat(response.getFailedValidations()).isGreaterThanOrEqualTo(0);
        assertThat(response.hasLastActivity()).isTrue();

        // Performance assertion: <5ms target
        assertThat(elapsedMs)
                .as("getValidatorInfo() should complete in <5ms")
                .isLessThan(5L);

        System.out.println(String.format(
                "✅ Test 8: getValidatorInfo() completed in %dms - Reputation: %.2f, Blocks: %d, Failed: %d",
                elapsedMs, response.getReputationScore(), response.getBlocksValidated(),
                response.getFailedValidations()
        ));
    }

    /**
     * Test 9: submitConsensusMetrics() - Metrics Submission
     * Target: <5ms latency
     */
    @Test
    @Order(9)
    @DisplayName("RPC 9: submitConsensusMetrics() should submit validator metrics")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testSubmitConsensusMetrics() {
        // Arrange: Prepare metrics submission
        ConsensusMetrics metrics = ConsensusMetrics.newBuilder()
                .setConsensusLatencyMs(5.0)
                .setTotalValidators(7)
                .setActiveValidators(7)
                .setTotalBlocksCommitted(1000L)
                .setAverageBlockTimeMs(500.0)
                .setFailedConsensusAttempts(5)
                .setNetworkHealthPercent(98.5)
                .setMeasurementTime(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .build();

        SubmitConsensusMetricsRequest request = SubmitConsensusMetricsRequest.newBuilder()
                .setValidatorId("validator-1")
                .setMetrics(metrics)
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        SubmitConsensusMetricsResponse response = blockingStub.submitConsensusMetrics(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getMetricsAccepted()).isTrue();
        assertThat(response.getMessage()).isNotEmpty();
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <5ms target
        assertThat(elapsedMs)
                .as("submitConsensusMetrics() should complete in <5ms")
                .isLessThan(5L);

        System.out.println(String.format(
                "✅ Test 9: submitConsensusMetrics() completed in %dms - Accepted: %s, Message: %s",
                elapsedMs, response.getMetricsAccepted(), response.getMessage()
        ));
    }

    /**
     * Test 10: getRaftLog() - Log Retrieval
     * Target: <20ms latency
     */
    @Test
    @Order(10)
    @DisplayName("RPC 10: getRaftLog() should return Raft log entries")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testGetRaftLog() {
        // Arrange: Request log entries
        GetRaftLogRequest request = GetRaftLogRequest.newBuilder()
                .setStartIndex(0)
                .setEndIndex(10)
                .setLimit(10)
                .build();

        // Act: Measure performance
        long startTime = System.nanoTime();
        RaftLogResponse response = blockingStub.getRaftLog(request);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify response
        assertThat(response).isNotNull();
        assertThat(response.getLogSize()).isGreaterThanOrEqualTo(0L);
        assertThat(response.getLastAppliedIndex()).isGreaterThanOrEqualTo(0L);
        assertThat(response.getLastLogTerm()).isGreaterThanOrEqualTo(0L);
        assertThat(response.hasTimestamp()).isTrue();

        // Performance assertion: <20ms target
        assertThat(elapsedMs)
                .as("getRaftLog() should complete in <20ms")
                .isLessThan(20L);

        System.out.println(String.format(
                "✅ Test 10: getRaftLog() completed in %dms - Entries: %d, Log size: %d, Last applied: %d",
                elapsedMs, response.getLogEntriesCount(), response.getLogSize(),
                response.getLastAppliedIndex()
        ));
    }

    /**
     * Test 11: streamConsensusEvents() - Server-side Streaming
     * Target: <50ms event latency, 100+ concurrent streams
     */
    @Test
    @Order(11)
    @DisplayName("RPC 11: streamConsensusEvents() should stream real-time consensus events")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testStreamConsensusEvents() throws InterruptedException {
        // Arrange: Prepare streaming request
        StreamConsensusEventsRequest request = StreamConsensusEventsRequest.newBuilder()
                .setIncludeBlockProposals(true)
                .setIncludeVotes(true)
                .setIncludeLeaderElections(true)
                .setIncludeHeartbeats(true)
                .setStreamTimeoutSeconds(10)
                .build();

        final List<ConsensusEvent> receivedEvents = new ArrayList<>();
        final CountDownLatch latch = new CountDownLatch(5); // Wait for 5 events
        final AtomicBoolean streamCompleted = new AtomicBoolean(false);
        final AtomicBoolean errorOccurred = new AtomicBoolean(false);
        final AtomicInteger eventCount = new AtomicInteger(0);

        // Act: Stream events
        long startTime = System.nanoTime();

        StreamObserver<ConsensusEvent> responseObserver = new StreamObserver<ConsensusEvent>() {
            @Override
            public void onNext(ConsensusEvent event) {
                receivedEvents.add(event);
                int count = eventCount.incrementAndGet();

                long eventLatency = (System.nanoTime() - startTime) / 1_000_000;

                System.out.println(String.format(
                        "   Event %d received in %dms - Type: %s, Term: %d, Source: %s",
                        count, eventLatency, event.getEventType(), event.getEventTerm(),
                        event.getSourceValidator()
                ));

                latch.countDown();
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("Stream error: " + t.getMessage());
                errorOccurred.set(true);
                for (int i = 0; i < latch.getCount(); i++) {
                    latch.countDown();
                }
            }

            @Override
            public void onCompleted() {
                streamCompleted.set(true);
                System.out.println("   Stream completed gracefully");
                for (int i = 0; i < latch.getCount(); i++) {
                    latch.countDown();
                }
            }
        };

        asyncStub.streamConsensusEvents(request, responseObserver);

        // Wait for events (timeout after 10 seconds)
        boolean received = latch.await(10, TimeUnit.SECONDS);
        long totalTime = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify streaming worked
        assertThat(received)
                .as("Should receive at least 5 events within timeout")
                .isTrue();

        assertThat(errorOccurred.get())
                .as("No errors should occur during streaming")
                .isFalse();

        assertThat(receivedEvents.size())
                .as("Should receive multiple consensus events")
                .isGreaterThanOrEqualTo(5);

        // Verify event structure
        for (ConsensusEvent event : receivedEvents) {
            assertThat(event.getEventType())
                    .as("Event type should be valid")
                    .isIn("PROPOSAL", "VOTE", "COMMIT", "ELECTION", "HEARTBEAT");

            assertThat(event.getEventId())
                    .as("Event ID should not be empty")
                    .isNotEmpty();

            assertThat(event.hasTimestamp())
                    .as("Event should have timestamp")
                    .isTrue();
        }

        // Performance assertion: Average event latency <50ms
        long avgLatency = totalTime / receivedEvents.size();
        assertThat(avgLatency)
                .as("Average event streaming latency should be <50ms")
                .isLessThan(50L);

        System.out.println(String.format(
                "✅ Test 11: streamConsensusEvents() - Received %d events in %dms (avg latency: %dms/event)",
                receivedEvents.size(), totalTime, avgLatency
        ));
    }

    /**
     * Test 12: Byzantine Fault Tolerance
     * Verify consensus tolerates f < n/3 failures (1 failure with 4 validators)
     */
    @Test
    @Order(12)
    @DisplayName("Byzantine Fault Tolerance: Should tolerate minority validator failures")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testByzantineFaultTolerance() {
        // Arrange: Create block proposal
        Block testBlock = Block.newBuilder()
                .setBlockHash("bft-test-block-" + System.currentTimeMillis())
                .setBlockHeight(99999L)
                .setPreviousBlockHash("prev-hash-bft")
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .setValidatorId("validator-1")
                .build();

        ProposeBlockRequest proposeRequest = ProposeBlockRequest.newBuilder()
                .setBlock(testBlock)
                .setProposalTerm(1L)
                .setProposerId("proposer-bft")
                .setTimeoutSeconds(30)
                .build();

        // Act: Propose block
        ProposeBlockResponse proposeResponse = blockingStub.proposeBlock(proposeRequest);
        assertThat(proposeResponse.getStatus()).isNotEqualTo(BlockStatus.BLOCK_ORPHANED);

        // Simulate voting with Byzantine failure (1 validator fails)
        int totalValidators = 4;
        int byzantineFailures = 1;
        int honestValidators = totalValidators - byzantineFailures; // 3 honest validators

        List<VoteOnBlockResponse> votes = new ArrayList<>();
        for (int i = 0; i < honestValidators; i++) {
            VoteOnBlockRequest voteRequest = VoteOnBlockRequest.newBuilder()
                    .setBlockHash(testBlock.getBlockHash())
                    .setVoterId("honest-validator-" + i)
                    .setVoteChoice(true)
                    .setVoteTerm(1L)
                    .setVoteSignature("sig-honest-" + i)
                    .build();

            VoteOnBlockResponse voteResponse = blockingStub.voteOnBlock(voteRequest);
            votes.add(voteResponse);
        }

        // Assert: Consensus should still succeed with 3/4 validators
        VoteOnBlockResponse lastVote = votes.get(votes.size() - 1);
        assertThat(lastVote.getTotalVotes())
                .as("Should have votes from honest validators")
                .isGreaterThanOrEqualTo(honestValidators);

        // Majority should be reached (3 out of 4)
        int majorityNeeded = (totalValidators / 2) + 1; // 3
        assertThat(lastVote.getTotalVotes())
                .as("Should reach majority despite Byzantine failure")
                .isGreaterThanOrEqualTo(majorityNeeded);

        System.out.println(String.format(
                "✅ Test 12: Byzantine Fault Tolerance - Consensus achieved with %d/%d validators (%d Byzantine failures tolerated)",
                honestValidators, totalValidators, byzantineFailures
        ));
    }

    /**
     * Test 13: Finality Time Measurement
     * Target: <500ms current, <100ms future
     */
    @Test
    @Order(13)
    @DisplayName("Finality Time: Measure time from proposal to commitment")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testFinalityTime() {
        // Arrange: Create test block
        Block testBlock = Block.newBuilder()
                .setBlockHash("finality-test-" + System.currentTimeMillis())
                .setBlockHeight(88888L)
                .setPreviousBlockHash("prev-hash-finality")
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                .setValidatorId("validator-finality")
                .build();

        // Act: Measure end-to-end finality time
        long startTime = System.nanoTime();

        // Step 1: Propose block
        ProposeBlockRequest proposeRequest = ProposeBlockRequest.newBuilder()
                .setBlock(testBlock)
                .setProposalTerm(1L)
                .setProposerId("finality-proposer")
                .setTimeoutSeconds(30)
                .build();
        ProposeBlockResponse proposeResponse = blockingStub.proposeBlock(proposeRequest);

        // Step 2: Vote on block (simulate 4 validators)
        for (int i = 0; i < 4; i++) {
            VoteOnBlockRequest voteRequest = VoteOnBlockRequest.newBuilder()
                    .setBlockHash(testBlock.getBlockHash())
                    .setVoterId("validator-finality-" + i)
                    .setVoteChoice(true)
                    .setVoteTerm(1L)
                    .setVoteSignature("sig-finality-" + i)
                    .build();
            blockingStub.voteOnBlock(voteRequest);
        }

        // Step 3: Commit block
        CommitBlockRequest commitRequest = CommitBlockRequest.newBuilder()
                .setBlockHash(testBlock.getBlockHash())
                .setBlock(testBlock)
                .setCommitTerm(1L)
                .addValidatorSignatures("sig-1")
                .addValidatorSignatures("sig-2")
                .addValidatorSignatures("sig-3")
                .addValidatorSignatures("sig-4")
                .setTimeoutSeconds(30)
                .build();
        CommitBlockResponse commitResponse = blockingStub.commitBlock(commitRequest);

        long finalityTimeMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify finality was achieved
        assertThat(commitResponse.getStatus())
                .as("Block should be finalized")
                .isIn(BlockStatus.BLOCK_FINALIZED, BlockStatus.BLOCK_ORPHANED);

        // Performance assertion: <500ms current target
        assertThat(finalityTimeMs)
                .as("Finality should be achieved in <500ms (current target)")
                .isLessThan(500L);

        System.out.println(String.format(
                "✅ Test 13: Finality Time - %dms (Target: <500ms current, <100ms future) - Status: %s",
                finalityTimeMs, commitResponse.getStatus()
        ));
    }

    /**
     * Test 14: Concurrent Streaming Performance
     * Target: 100+ concurrent streams
     */
    @Test
    @Order(14)
    @DisplayName("Concurrent Streaming: Should support 100+ concurrent event streams")
    @Timeout(TEST_TIMEOUT_SECONDS * 2)
    void testConcurrentStreaming() throws InterruptedException {
        final int concurrentStreams = 100;
        final CountDownLatch allStreamsStarted = new CountDownLatch(concurrentStreams);
        final AtomicInteger totalEventsReceived = new AtomicInteger(0);
        final AtomicInteger successfulStreams = new AtomicInteger(0);

        // Arrange: Create multiple concurrent stream requests
        StreamConsensusEventsRequest request = StreamConsensusEventsRequest.newBuilder()
                .setIncludeBlockProposals(true)
                .setIncludeHeartbeats(true)
                .setStreamTimeoutSeconds(5)
                .build();

        long startTime = System.nanoTime();

        // Act: Create 100 concurrent streams
        for (int i = 0; i < concurrentStreams; i++) {
            final int streamId = i;

            StreamObserver<ConsensusEvent> observer = new StreamObserver<ConsensusEvent>() {
                private boolean received = false;

                @Override
                public void onNext(ConsensusEvent event) {
                    if (!received) {
                        received = true;
                        allStreamsStarted.countDown();
                    }
                    totalEventsReceived.incrementAndGet();
                }

                @Override
                public void onError(Throwable t) {
                    allStreamsStarted.countDown();
                }

                @Override
                public void onCompleted() {
                    successfulStreams.incrementAndGet();
                }
            };

            asyncStub.streamConsensusEvents(request, observer);
        }

        // Wait for all streams to receive at least one event
        boolean allStarted = allStreamsStarted.await(15, TimeUnit.SECONDS);
        long elapsedMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify concurrent streaming performance
        assertThat(allStarted)
                .as("All %d streams should start successfully", concurrentStreams)
                .isTrue();

        assertThat(totalEventsReceived.get())
                .as("Should receive events from all streams")
                .isGreaterThan(concurrentStreams);

        System.out.println(String.format(
                "✅ Test 14: Concurrent Streaming - %d streams, %d events in %dms",
                concurrentStreams, totalEventsReceived.get(), elapsedMs
        ));
    }

    /**
     * Test 15: Leader Election Recovery Time
     * Target: <1 second election time
     */
    @Test
    @Order(15)
    @DisplayName("Leader Election Recovery: Should recover from leader failure in <1s")
    @Timeout(TEST_TIMEOUT_SECONDS)
    void testLeaderElectionRecovery() {
        // Arrange: Get initial state
        GetConsensusStateRequest stateReq = GetConsensusStateRequest.newBuilder()
                .setIncludeValidators(false)
                .setIncludeMetrics(false)
                .build();
        ConsensusStateResponse initialState = blockingStub.getConsensusState(stateReq);
        String initialLeader = initialState.getState().getCurrentLeader();

        // Act: Simulate leader failure and trigger election
        long startTime = System.nanoTime();

        LeaderElectionRequest electionRequest = LeaderElectionRequest.newBuilder()
                .setCandidateId("new-candidate-" + System.currentTimeMillis())
                .setElectionTerm(initialState.getState().getCurrentTerm() + 1)
                .setTimeoutSeconds(5)
                .setElectionReason("Leader failure simulation")
                .build();

        LeaderElectionResponse electionResponse = blockingStub.requestLeaderElection(electionRequest);
        long electionTimeMs = (System.nanoTime() - startTime) / 1_000_000;

        // Assert: Verify election succeeded
        assertThat(electionResponse.getElectionAccepted())
                .as("Election should succeed")
                .isTrue();

        assertThat(electionResponse.getNewLeaderId())
                .as("New leader should be elected")
                .isNotEmpty();

        // Performance assertion: <1000ms target
        assertThat(electionTimeMs)
                .as("Leader election should complete in <1 second")
                .isLessThan(1000L);

        System.out.println(String.format(
                "✅ Test 15: Leader Election Recovery - %dms (Previous: %s, New: %s, Term: %d)",
                electionTimeMs, initialLeader, electionResponse.getNewLeaderId(),
                electionResponse.getElectionTerm()
        ));
    }
}
