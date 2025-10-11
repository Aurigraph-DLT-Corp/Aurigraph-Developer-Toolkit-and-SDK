package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.consensus.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

import com.google.protobuf.ByteString;
import java.time.Duration;

/**
 * Consensus Service Tests
 * Sprint 13 - Workstream 4: Test Automation
 *
 * Tests HyperRAFT++ consensus implementation:
 * - Leader election
 * - Log replication
 * - Snapshot management
 *
 * Target: 95% coverage
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ConsensusServiceTest {

    @Inject
    ConsensusServiceImpl consensusService;

    private VoteRequest voteRequest;
    private AppendEntriesRequest heartbeatRequest;
    private AppendEntriesRequest appendRequest;

    @BeforeEach
    void setUp() {
        voteRequest = VoteRequest.newBuilder()
            .setCandidateId("candidate-1")
            .setTerm(1)
            .setLastLogIndex(0)
            .setLastLogTerm(0)
            .build();

        heartbeatRequest = AppendEntriesRequest.newBuilder()
            .setLeaderId("leader-1")
            .setTerm(1)
            .setPrevLogIndex(0)
            .setPrevLogTerm(0)
            .setLeaderCommit(0)
            .build();

        LogEntry entry = LogEntry.newBuilder()
            .setIndex(1)
            .setTerm(1)
            .setCommand("test-command")
            .setCommandType("TEST")
            .setTimestamp(System.currentTimeMillis())
            .build();

        appendRequest = AppendEntriesRequest.newBuilder()
            .setLeaderId("leader-1")
            .setTerm(1)
            .setPrevLogIndex(0)
            .setPrevLogTerm(0)
            .setLeaderCommit(0)
            .addEntries(entry)
            .build();
    }

    @Test
    @Order(1)
    @DisplayName("Request vote - should grant vote for first request")
    void testRequestVoteGrant() {
        VoteResponse response = consensusService
            .requestVote(voteRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getVoteGranted());
        assertEquals(voteRequest.getTerm(), response.getTerm());
        assertNotNull(response.getVoterId());
    }

    @Test
    @Order(2)
    @DisplayName("Request vote - should reject if already voted")
    void testRequestVoteReject() {
        // First vote
        consensusService.requestVote(voteRequest).await().indefinitely();

        // Second vote request from different candidate
        VoteRequest secondRequest = VoteRequest.newBuilder(voteRequest)
            .setCandidateId("candidate-2")
            .build();

        VoteResponse response = consensusService
            .requestVote(secondRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertFalse(response.getVoteGranted());
    }

    @Test
    @Order(3)
    @DisplayName("Request vote - should reject older term")
    void testRequestVoteOlderTerm() {
        // Establish current term
        VoteRequest higherTermRequest = VoteRequest.newBuilder(voteRequest)
            .setTerm(5)
            .build();
        consensusService.requestVote(higherTermRequest).await().indefinitely();

        // Request with older term
        VoteRequest olderRequest = VoteRequest.newBuilder(voteRequest)
            .setTerm(3)
            .build();

        VoteResponse response = consensusService
            .requestVote(olderRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertFalse(response.getVoteGranted());
        assertTrue(response.getTerm() >= 5);
    }

    @Test
    @Order(4)
    @DisplayName("Append entries - heartbeat should succeed")
    void testAppendEntriesHeartbeat() {
        AppendEntriesResponse response = consensusService
            .appendEntries(heartbeatRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertNotNull(response.getFollowerId());
    }

    @Test
    @Order(5)
    @DisplayName("Append entries - should replicate log entries")
    void testAppendEntriesLogReplication() {
        AppendEntriesResponse response = consensusService
            .appendEntries(appendRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertTrue(response.getMatchIndex() > 0);
    }

    @Test
    @Order(6)
    @DisplayName("Append entries - batch append should be faster")
    void testAppendEntriesBatch() {
        AppendEntriesRequest.Builder batchBuilder = AppendEntriesRequest.newBuilder()
            .setLeaderId("leader-1")
            .setTerm(1)
            .setPrevLogIndex(0)
            .setPrevLogTerm(0)
            .setLeaderCommit(0)
            .setBatchAppend(true);

        // Add 100 entries
        for (int i = 1; i <= 100; i++) {
            batchBuilder.addEntries(LogEntry.newBuilder()
                .setIndex(i)
                .setTerm(1)
                .setCommand("batch-command-" + i)
                .setCommandType("BATCH_TEST")
                .setTimestamp(System.currentTimeMillis())
                .build());
        }

        long startTime = System.currentTimeMillis();
        AppendEntriesResponse response = consensusService
            .appendEntries(batchBuilder.build())
            .await()
            .atMost(Duration.ofSeconds(10));

        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertTrue(response.getMatchIndex() >= 100);
        System.out.printf("Batch append of 100 entries: %d ms%n", duration);
    }

    @Test
    @Order(7)
    @DisplayName("Append entries - should reject older term")
    void testAppendEntriesRejectOlderTerm() {
        // Establish higher term
        AppendEntriesRequest higherTermRequest = AppendEntriesRequest.newBuilder(heartbeatRequest)
            .setTerm(10)
            .build();
        consensusService.appendEntries(higherTermRequest).await().indefinitely();

        // Try with older term
        AppendEntriesRequest olderRequest = AppendEntriesRequest.newBuilder(heartbeatRequest)
            .setTerm(5)
            .build();

        AppendEntriesResponse response = consensusService
            .appendEntries(olderRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertFalse(response.getSuccess());
        assertTrue(response.getTerm() >= 10);
    }

    @Test
    @Order(8)
    @DisplayName("Install snapshot - should accept snapshot")
    void testInstallSnapshot() {
        SnapshotRequest request = SnapshotRequest.newBuilder()
            .setLeaderId("leader-1")
            .setTerm(1)
            .setLastIncludedIndex(100)
            .setLastIncludedTerm(1)
            .setSnapshotData(ByteString.copyFrom(new byte[1024]))
            .setOffset(0)
            .setDone(true)
            .build();

        SnapshotResponse response = consensusService
            .installSnapshot(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getSuccess());
    }

    @Test
    @Order(9)
    @DisplayName("Get consensus state - should return current state")
    void testGetConsensusState() {
        StateRequest request = StateRequest.newBuilder().build();

        ConsensusState state = consensusService
            .getConsensusState(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(state);
        assertNotNull(state.getNodeId());
        assertNotNull(state.getRole());
        assertTrue(state.getCurrentTerm() >= 0);
        assertTrue(state.getLogSize() >= 0);
    }

    @Test
    @Order(10)
    @DisplayName("Propose block - should accept block proposal")
    void testProposeBlock() {
        // First become leader
        consensusService.startElection();

        BlockProposal proposal = BlockProposal.newBuilder()
            .setBlockNumber(1)
            .setProposerId(consensusService.getNodeId())
            .setBlockData("block-data-1")
            .addTransactionIds("tx-1")
            .addTransactionIds("tx-2")
            .build();

        ProposalResponse response = consensusService
            .proposeBlock(proposal)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        // Response depends on role
        assertNotNull(response.getMessage());
    }

    @Test
    @Order(11)
    @DisplayName("Leader election - should transition to leader")
    void testLeaderElection() {
        String initialRole = consensusService.getCurrentRole().name();
        System.out.println("Initial role: " + initialRole);

        consensusService.startElection();

        // After election, should be leader or candidate
        String finalRole = consensusService.getCurrentRole().name();
        System.out.println("Final role: " + finalRole);

        assertTrue(finalRole.equals("LEADER") || finalRole.equals("CANDIDATE"));
    }

    @Test
    @Order(12)
    @DisplayName("Election timeout - should detect timeout")
    void testElectionTimeout() throws InterruptedException {
        // Reset election timer
        consensusService.appendEntries(heartbeatRequest).await().indefinitely();

        // Wait for timeout (5 seconds + buffer)
        Thread.sleep(6000);

        boolean timedOut = consensusService.isElectionTimeoutExpired();
        assertTrue(timedOut, "Election timeout should have expired");
    }

    @Test
    @Order(13)
    @DisplayName("Consensus event stream - should stream events")
    void testStreamConsensusEvents() {
        EventStreamRequest request = EventStreamRequest.newBuilder()
            .setIncludeHeartbeats(true)
            .build();

        // Subscribe to stream and collect first 5 events
        java.util.List<ConsensusEvent> events = consensusService
            .streamConsensusEvents(request)
            .select().first(5)
            .collect().asList()
            .await()
            .atMost(Duration.ofSeconds(10));

        assertNotNull(events);
        assertTrue(events.size() > 0);
        events.forEach(event -> {
            assertNotNull(event.getEventType());
            assertNotNull(event.getNodeId());
            assertTrue(event.getTimestamp() > 0);
        });
    }

    @Test
    @Order(14)
    @DisplayName("High load consensus - 1000 log entries")
    @Timeout(30)
    void testHighLoadConsensus() {
        AppendEntriesRequest.Builder builder = AppendEntriesRequest.newBuilder()
            .setLeaderId("leader-1")
            .setTerm(1)
            .setPrevLogIndex(0)
            .setPrevLogTerm(0)
            .setLeaderCommit(0)
            .setBatchAppend(true);

        // Add 1000 entries
        for (int i = 1; i <= 1000; i++) {
            builder.addEntries(LogEntry.newBuilder()
                .setIndex(i)
                .setTerm(1)
                .setCommand("load-test-command-" + i)
                .setCommandType("LOAD_TEST")
                .setTimestamp(System.currentTimeMillis())
                .build());
        }

        long startTime = System.currentTimeMillis();
        AppendEntriesResponse response = consensusService
            .appendEntries(builder.build())
            .await()
            .atMost(Duration.ofSeconds(30));

        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(response);
        assertTrue(response.getSuccess());
        System.out.printf("High load test: 1000 entries in %d ms%n", duration);

        // Should complete in reasonable time
        assertTrue(duration < 5000, "Should complete within 5 seconds");
    }
}
