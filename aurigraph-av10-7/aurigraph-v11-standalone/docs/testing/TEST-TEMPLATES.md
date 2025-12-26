# Test Templates - Aurigraph V11 TDD Framework

This document provides copy-paste-ready test templates for all test types in Aurigraph DLT V11. Use these templates as starting points for implementing new tests.

---

## Table of Contents

1. [Unit Test Templates](#unit-test-templates)
   - [GraphQL Query/Mutation Tests](#graphql-querymutation-tests)
   - [GraphQL Subscription Tests](#graphql-subscription-tests)
   - [Service Layer Tests](#service-layer-tests)
   - [Reactive Uni Tests](#reactive-uni-tests)
   - [Reactive Multi Tests](#reactive-multi-tests)

2. [Integration Test Templates](#integration-test-templates)
   - [Base Integration Test Class](#base-integration-test-class)
   - [Database Integration Tests](#database-integration-tests)
   - [End-to-End Workflow Tests](#end-to-end-workflow-tests)

3. [Test Data Builder Pattern](#test-data-builder-pattern)
   - [Fluent Builder Examples](#fluent-builder-examples)

4. [Performance Test Template](#performance-test-template)

5. [Contract Test Template](#contract-test-template)

---

## Unit Test Templates

### GraphQL Query/Mutation Tests

**Use Case**: Testing GraphQL query and mutation resolvers with mocked dependencies.

**File**: `src/test/java/io/aurigraph/v11/graphql/ApprovalGraphQLAPITest.java`

```java
package io.aurigraph.v11.graphql;

import io.aurigraph.v11.testing.builders.ApprovalRequestTestBuilder;
import io.aurigraph.v11.token.secondary.*;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@QuarkusTest
@DisplayName("ApprovalGraphQLAPI - GraphQL Query/Mutation Tests")
class ApprovalGraphQLAPITest {

    @Inject
    ApprovalGraphQLAPI approvalGraphQLAPI;

    @InjectMock
    VVBApprovalService approvalService;

    @InjectMock
    VVBApprovalRegistry approvalRegistry;

    @InjectMock
    ApprovalStateValidator stateValidator;

    private UUID testApprovalId;
    private VVBApprovalRequest testApproval;

    @BeforeEach
    void setUp() {
        testApprovalId = UUID.randomUUID();
        testApproval = new ApprovalRequestTestBuilder()
            .withId(testApprovalId)
            .withStatus(ApprovalStatus.PENDING)
            .build();
    }

    // ============================================================================
    // QUERY TESTS
    // ============================================================================

    @Test
    @DisplayName("Query: getApproval returns approval for valid ID")
    void testGetApproval_ValidId_ReturnsApprovalDTO() {
        // Arrange: Mock the database lookup
        when(approvalService.getApprovalById(testApprovalId))
            .thenReturn(Uni.createFrom().item(testApproval));

        // Act: Execute GraphQL query
        Uni<ApprovalDTO> result = 
            approvalGraphQLAPI.getApproval(testApprovalId.toString());

        // Assert: Verify the result
        ApprovalDTO resultItem = result.await().indefinitely();
        
        assertThat(resultItem)
            .isNotNull()
            .extracting(ApprovalDTO::getId)
            .isEqualTo(testApprovalId.toString());

        verify(approvalService).getApprovalById(testApprovalId);
    }

    @Test
    @DisplayName("Query: getApproval throws exception for invalid ID")
    void testGetApproval_InvalidId_ThrowsException() {
        // Arrange: Mock database returning null
        when(approvalService.getApprovalById(any(UUID.class)))
            .thenReturn(Uni.createFrom().nullItem());

        // Act & Assert: Execute and expect exception
        assertThatThrownBy(() ->
            approvalGraphQLAPI.getApproval(UUID.randomUUID().toString())
                .await().indefinitely()
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Approval not found");
    }

    @Test
    @DisplayName("Query: getApprovals filters and paginates correctly")
    void testGetApprovals_WithFilters_ReturnsFilteredList() {
        // Arrange: Create test data
        List<VVBApprovalRequest> testApprovals = List.of(
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.PENDING)
                .build(),
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.APPROVED)
                .build(),
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.REJECTED)
                .build()
        );

        when(approvalService.getAllApprovals())
            .thenReturn(Uni.createFrom().item(testApprovals));

        // Act: Query with filters
        Uni<List<ApprovalDTO>> result = 
            approvalGraphQLAPI.getApprovals(
                ApprovalStatus.PENDING,
                10,
                0
            );

        // Assert: Verify filtering
        List<ApprovalDTO> resultItems = result.await().indefinitely();
        assertThat(resultItems)
            .isNotEmpty()
            .allMatch(dto -> dto.getStatus().equals("PENDING"));
    }

    @Test
    @DisplayName("Query: getApprovalStatistics returns accurate counts")
    void testGetApprovalStatistics_ReturnsAccurateStats() {
        // Arrange
        List<VVBApprovalRequest> testApprovals = List.of(
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.PENDING).build(),
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.APPROVED).build(),
            new ApprovalRequestTestBuilder()
                .withStatus(ApprovalStatus.PENDING).build()
        );

        when(approvalService.getAllApprovals())
            .thenReturn(Uni.createFrom().item(testApprovals));

        // Act
        Uni<ApprovalStatisticsDTO> result = 
            approvalGraphQLAPI.getApprovalStatistics();

        // Assert
        ApprovalStatisticsDTO stats = result.await().indefinitely();
        assertThat(stats)
            .isNotNull()
            .satisfies(s -> {
                assertThat(s.getTotal()).isEqualTo(3);
                assertThat(s.getPending()).isEqualTo(2);
                assertThat(s.getApproved()).isEqualTo(1);
            });
    }

    // ============================================================================
    // MUTATION TESTS
    // ============================================================================

    @Test
    @DisplayName("Mutation: executeApproval executes successfully")
    void testExecuteApproval_ValidRequest_ExecutesSuccessfully() {
        // Arrange
        testApproval.status = ApprovalStatus.APPROVED;
        
        when(approvalService.getApprovalById(testApprovalId))
            .thenReturn(Uni.createFrom().item(testApproval));
        doNothing().when(stateValidator)
            .validateExecutionPrerequisites(any());

        // Act
        Uni<ExecutionResponseDTO> result = 
            approvalGraphQLAPI.executeApproval(testApprovalId.toString());

        // Assert
        ExecutionResponseDTO response = result.await().indefinitely();
        assertThat(response)
            .extracting(ExecutionResponseDTO::getSuccess)
            .isEqualTo(true);
    }

    @Test
    @DisplayName("Mutation: registerWebhook registers successfully")
    void testRegisterWebhook_ValidUrl_RegistersSuccessfully() {
        // Act
        Uni<WebhookResponseDTO> result = 
            approvalGraphQLAPI.registerWebhook(
                "https://example.com/webhook",
                List.of("APPROVAL_STATUS_CHANGED", "CONSENSUS_REACHED")
            );

        // Assert
        WebhookResponseDTO response = result.await().indefinitely();
        assertThat(response)
            .extracting(WebhookResponseDTO::getSuccess)
            .isEqualTo(true);
        assertThat(response.getWebhookId())
            .isNotNull()
            .isNotEmpty();
    }

    @Test
    @DisplayName("Mutation: unregisterWebhook removes webhook")
    void testUnregisterWebhook_ValidId_UnregistersSuccessfully() {
        // Act
        Uni<Boolean> result = 
            approvalGraphQLAPI.unregisterWebhook(UUID.randomUUID().toString());

        // Assert
        Boolean success = result.await().indefinitely();
        assertThat(success).isTrue();
    }

}
```

### GraphQL Subscription Tests

**Use Case**: Testing real-time GraphQL subscriptions with reactive streams.

```java
package io.aurigraph.v11.graphql;

import io.aurigraph.v11.testing.builders.ApprovalRequestTestBuilder;
import io.aurigraph.v11.token.secondary.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.*;

@QuarkusTest
@DisplayName("ApprovalGraphQLAPI - GraphQL Subscription Tests")
class ApprovalGraphQLAPISubscriptionTest {

    @Inject
    ApprovalGraphQLAPI approvalGraphQLAPI;

    @Inject
    ApprovalSubscriptionManager subscriptionManager;

    private UUID testApprovalId;

    @BeforeEach
    void setUp() {
        testApprovalId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Subscription: approvalStatusChanged delivers events to subscribers")
    void testApprovalStatusChanged_SubscribesAndReceivesUpdates() throws InterruptedException {
        // Arrange: Create a subscription
        Multi<ApprovalEventDTO> subscription = 
            approvalGraphQLAPI.approvalStatusChanged(testApprovalId.toString());

        AtomicReference<ApprovalEventDTO> receivedEvent = new AtomicReference<>();
        CountDownLatch eventReceived = new CountDownLatch(1);

        // Act: Subscribe to events
        subscription
            .subscribe()
            .with(
                event -> {
                    receivedEvent.set(event);
                    eventReceived.countDown();
                }
            );

        // Broadcast an event
        subscriptionManager.broadcastApprovalStatusChange(
            testApprovalId.toString(),
            ApprovalStatus.APPROVED
        );

        // Assert: Event received within timeout
        assertThat(eventReceived.await(5, TimeUnit.SECONDS))
            .isTrue();
        
        assertThat(receivedEvent.get())
            .isNotNull()
            .extracting(ApprovalEventDTO::getEventType)
            .isEqualTo("STATUS_CHANGED");
    }

    @Test
    @DisplayName("Subscription: voteSubmitted delivers vote events")
    void testVoteSubmitted_ReceivesVoteEvents() throws InterruptedException {
        // Arrange
        Multi<VoteEventDTO> subscription = 
            approvalGraphQLAPI.voteSubmitted(testApprovalId.toString());

        AtomicReference<VoteEventDTO> receivedVote = new AtomicReference<>();
        CountDownLatch voteReceived = new CountDownLatch(1);

        // Act: Subscribe
        subscription
            .subscribe()
            .with(vote -> {
                receivedVote.set(vote);
                voteReceived.countDown();
            });

        // Broadcast a vote
        ValidatorVote testVote = new ValidatorVote(
            UUID.randomUUID().toString(),
            VoteChoice.YES
        );
        subscriptionManager.broadcastVoteSubmitted(
            testApprovalId.toString(),
            testVote
        );

        // Assert
        assertThat(voteReceived.await(5, TimeUnit.SECONDS))
            .isTrue();
        assertThat(receivedVote.get())
            .isNotNull()
            .extracting(VoteEventDTO::getChoice)
            .isEqualTo("YES");
    }

    @Test
    @DisplayName("Subscription: Multiple subscribers receive same event")
    void testSubscription_MultipleSubscribers_AllReceiveEvents() throws InterruptedException {
        // Arrange: Create two subscriptions
        Multi<ApprovalEventDTO> subscription1 = 
            approvalGraphQLAPI.approvalStatusChanged(testApprovalId.toString());
        Multi<ApprovalEventDTO> subscription2 = 
            approvalGraphQLAPI.approvalStatusChanged(testApprovalId.toString());

        CountDownLatch events = new CountDownLatch(2);

        // Act: Both subscribe
        subscription1.subscribe().with(__ -> events.countDown());
        subscription2.subscribe().with(__ -> events.countDown());

        // Broadcast event
        subscriptionManager.broadcastApprovalStatusChange(
            testApprovalId.toString(),
            ApprovalStatus.APPROVED
        );

        // Assert: Both subscribers receive
        assertThat(events.await(5, TimeUnit.SECONDS))
            .isTrue();
    }

}
```

### Service Layer Tests

**Use Case**: Testing service layer business logic with mocked dependencies.

```java
package io.aurigraph.v11.token.secondary;

import io.aurigraph.v11.testing.builders.ApprovalRequestTestBuilder;
import io.aurigraph.v11.testing.builders.ValidatorVoteTestBuilder;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@QuarkusTest
@DisplayName("VVBApprovalService - Service Layer Tests")
class VVBApprovalServiceTest {

    @Inject
    VVBApprovalService approvalService;

    @InjectMock
    ApprovalWebhookService webhookService;

    @InjectMock
    ApprovalExecutionService executionService;

    private UUID testApprovalId;
    private VVBApprovalRequest testApproval;

    @BeforeEach
    void setUp() {
        testApprovalId = UUID.randomUUID();
        testApproval = new ApprovalRequestTestBuilder()
            .withId(testApprovalId)
            .withStatus(ApprovalStatus.PENDING)
            .build();
    }

    @Test
    @DisplayName("Service: submitVote records vote and checks consensus")
    void testSubmitVote_ValidVote_UpdatesVotingRecord() {
        // Arrange
        ValidatorVote vote = new ValidatorVoteTestBuilder()
            .withValidatorId(UUID.randomUUID().toString())
            .withVote(VoteChoice.YES)
            .build();

        when(webhookService.deliverWebhook(any(), any()))
            .thenReturn(Uni.createFrom().voidItem());

        // Act
        Uni<Void> result = approvalService.submitVote(
            testApprovalId.toString(),
            vote
        );

        // Assert
        result.await().indefinitely();
        
        // Verify vote was recorded
        assertThat(approvalService.getVotes(testApprovalId.toString()))
            .contains(vote);
    }

    @Test
    @DisplayName("Service: Byzantine consensus with >2/3 approvals")
    void testByzantineConsensus_MoreThanTwoThirdsApprove_ConsensusReached() {
        // Arrange: Create 5 validators
        List<ValidatorVote> votes = List.of(
            new ValidatorVoteTestBuilder()
                .withValidatorId("validator-1")
                .withVote(VoteChoice.YES).build(),
            new ValidatorVoteTestBuilder()
                .withValidatorId("validator-2")
                .withVote(VoteChoice.YES).build(),
            new ValidatorVoteTestBuilder()
                .withValidatorId("validator-3")
                .withVote(VoteChoice.YES).build(),
            new ValidatorVoteTestBuilder()
                .withValidatorId("validator-4")
                .withVote(VoteChoice.NO).build(),
            new ValidatorVoteTestBuilder()
                .withValidatorId("validator-5")
                .withVote(VoteChoice.NO).build()
        );

        // Act: Submit votes
        votes.forEach(vote ->
            approvalService.submitVote(testApprovalId.toString(), vote)
                .await().indefinitely()
        );

        // Assert: Consensus should be APPROVED (3/5 = 60% > 2/3)
        VVBApprovalRequest result = approvalService
            .getApprovalById(testApprovalId)
            .await().indefinitely();

        assertThat(result.status)
            .isEqualTo(ApprovalStatus.APPROVED);
    }

}
```

### Reactive Uni Tests

**Use Case**: Testing methods that return `Uni<T>` (single async values).

```java
@Test
@DisplayName("Reactive: Uni.flatMap chains multiple async operations")
void testUniChain_SequentialAsyncCalls_CompletesSuccessfully() {
    // Arrange
    UUID approvalId = UUID.randomUUID();
    
    // Act: Chain async operations
    Uni<ApprovalStatus> result = approvalService
        .getApprovalById(approvalId)  // Uni<VVBApprovalRequest>
        .flatMap(approval -> 
            approvalService.submitVote(
                approvalId.toString(),
                new ValidatorVote("validator-1", VoteChoice.YES)
            ).map(__ -> approval.status)  // Uni<ApprovalStatus>
        );

    // Assert: Result should be PENDING (status before consensus)
    ApprovalStatus status = result.await().indefinitely();
    assertThat(status).isEqualTo(ApprovalStatus.PENDING);
}

@Test
@DisplayName("Reactive: Uni.onFailure handles exceptions gracefully")
void testUniError_OnFailure_CatchesExceptionAndReturnsFallback() {
    // Arrange
    UUID invalidId = UUID.randomUUID();
    
    // Act: Handle error with fallback
    Uni<ApprovalDTO> result = approvalService
        .getApprovalById(invalidId)
        .onFailure().recoverWithItem(() -> 
            new ApprovalDTO(null) // Fallback
        );

    // Assert: Should return fallback instead of throwing
    ApprovalDTO dto = result.await().indefinitely();
    assertThat(dto).isNotNull();
}

@Test
@DisplayName("Reactive: Uni.timeout fails if operation exceeds timeout")
void testUniTimeout_LongRunningOperation_FailsWithTimeoutException() {
    // Act: Add timeout to operation
    Uni<String> slowOperation = Uni.createFrom()
        .item(() -> {
            try {
                Thread.sleep(2000); // Simulate slow DB call
                return "done";
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        })
        .ifNoItem().after(java.time.Duration.ofMillis(500))
        .failWith(new TimeoutException("Operation timed out"));

    // Assert: Should fail with timeout
    assertThatThrownBy(() ->
        slowOperation.await().indefinitely()
    ).isInstanceOf(TimeoutException.class);
}
```

### Reactive Multi Tests

**Use Case**: Testing methods that return `Multi<T>` (multiple async values / streams).

```java
@Test
@DisplayName("Reactive: Multi.subscribe receives all stream items")
void testMultiStream_SubscribeCollectsAllItems() throws InterruptedException {
    // Arrange
    UUID approvalId = UUID.randomUUID();
    List<ApprovalEventDTO> receivedEvents = new java.util.ArrayList<>();
    CountDownLatch streamComplete = new CountDownLatch(1);

    // Act: Subscribe to stream
    subscriptionManager
        .subscribeToApprovalStatusChanges(approvalId.toString())
        .subscribe()
        .with(
            event -> receivedEvents.add(event),
            failure -> {},
            () -> streamComplete.countDown()
        );

    // Broadcast multiple events
    subscriptionManager.broadcastApprovalStatusChange(
        approvalId.toString(),
        ApprovalStatus.PENDING
    );
    subscriptionManager.broadcastApprovalStatusChange(
        approvalId.toString(),
        ApprovalStatus.APPROVED
    );

    // Emit completion signal
    streamComplete.countDown();

    // Assert: Verify all items received
    assertThat(receivedEvents)
        .hasSize(2)
        .extracting(ApprovalEventDTO::getEventType)
        .allMatch(type -> type.equals("STATUS_CHANGED"));
}

@Test
@DisplayName("Reactive: Multi.filter transforms stream")
void testMultiFilter_FiltersStreamItems() {
    // Arrange
    Multi<Integer> numbers = Multi.createFrom()
        .items(1, 2, 3, 4, 5);

    // Act: Filter for even numbers
    List<Integer> evenNumbers = numbers
        .filter(n -> n % 2 == 0)
        .collect()
        .asList()
        .await().indefinitely();

    // Assert
    assertThat(evenNumbers)
        .containsExactly(2, 4);
}

@Test
@DisplayName("Reactive: Multi.onOverflow buffers overflow events")
void testMultiOverflow_BufferHandlesLargeStream() {
    // Arrange
    BroadcastProcessor<String> processor = BroadcastProcessor.create();
    
    // Act: Subscribe with buffer
    List<String> items = new java.util.ArrayList<>();
    processor
        .onOverflow().buffer(100)  // Buffer up to 100 items
        .subscribe()
        .with(items::add);

    // Emit many events
    for (int i = 0; i < 150; i++) {
        processor.onNext("event-" + i);
    }

    // Assert: Buffer handled overflow
    assertThat(items)
        .hasSizeGreaterThan(0)
        .hasSizeLessThanOrEqualTo(150);
}
```

---

## Integration Test Templates

### Base Integration Test Class

**Use Case**: Base class for all integration tests with Testcontainers setup.

**File**: `src/test/java/io/aurigraph/v11/integration/AbstractIntegrationTest.java`

```java
package io.aurigraph.v11.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.testcontainers.containers.DockerComposeContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.File;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.awaitility.Awaitility.await;

/**
 * Base class for all integration tests.
 * 
 * Provides:
 * - PostgreSQL 16 database
 * - Kafka 7.6 message broker
 * - Redis 7 cache
 * - JWT token generation
 * - Database cleanup utilities
 */
@Testcontainers
@QuarkusTest
@QuarkusTestResource(IntegrationTestResourceProvider.class)
public abstract class AbstractIntegrationTest {

    protected static final String API_BASE_URL = "http://localhost:9003";
    protected static final int POSTGRES_PORT = 5432;
    protected static final int KAFKA_PORT = 9092;
    protected static final int REDIS_PORT = 6379;

    @Container
    public static DockerComposeContainer<?> testEnvironment =
        new DockerComposeContainer<>(
            new File("src/test/resources/docker-compose.integration.yml")
        )
        .withExposedService("postgres", POSTGRES_PORT)
        .withExposedService("kafka", KAFKA_PORT)
        .withExposedService("redis", REDIS_PORT)
        .withLocalCompose(true)
        .waitingFor("postgres", 
            org.testcontainers.containers.wait.strategy
                .Wait.forHealthcheck())
        .waitingFor("kafka",
            org.testcontainers.containers.wait.strategy
                .Wait.forHealthcheck())
        .waitingFor("redis",
            org.testcontainers.containers.wait.strategy
                .Wait.forHealthcheck());

    protected RequestSpecification spec;

    @BeforeEach
    void setUpIntegration() {
        RestAssured.baseURI = API_BASE_URL;
        this.spec = new RequestSpecBuilder()
            .setContentType("application/json")
            .addHeader("Authorization", "Bearer " + generateTestToken())
            .build();
    }

    /**
     * Generate a valid JWT token for testing.
     */
    protected String generateTestToken() {
        return Jwt.issuer("https://aurigraph.io")
            .subject("test-user")
            .claim("email", "test@aurigraph.io")
            .claim("roles", List.of("admin", "validator"))
            .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
            .sign();
    }

    /**
     * Generate a token with specific roles.
     */
    protected String generateTokenWithRoles(String... roles) {
        return Jwt.issuer("https://aurigraph.io")
            .subject("test-user")
            .claim("roles", List.of(roles))
            .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
            .sign();
    }

    /**
     * Wait for an async condition with timeout.
     */
    protected void waitFor(java.util.function.BooleanSupplier condition) {
        await()
            .timeout(java.time.Duration.ofSeconds(10))
            .pollInterval(java.time.Duration.ofMillis(100))
            .untilAsserted(() -> {
                if (!condition.getAsBoolean()) {
                    throw new AssertionError("Condition not met within timeout");
                }
            });
    }

    /**
     * Helper: Make a GET request and expect success.
     */
    protected <T> T getRequest(String path, Class<T> responseType) {
        return RestAssured.given(spec)
            .get(path)
            .then()
            .statusCode(200)
            .extract()
            .as(responseType);
    }

    /**
     * Helper: Make a POST request with body and expect success.
     */
    protected <T> T postRequest(String path, Object body, Class<T> responseType) {
        return RestAssured.given(spec)
            .body(body)
            .post(path)
            .then()
            .statusCode(201)
            .extract()
            .as(responseType);
    }

    /**
     * Clean up test data after each test.
     */
    protected void cleanupTestData() {
        // Delete test approvals
        RestAssured.given(spec)
            .delete("/api/v11/test/approvals")
            .then()
            .statusCode(204);

        // Flush Redis cache
        RestAssured.given(spec)
            .post("/api/v11/test/redis/flush")
            .then()
            .statusCode(204);
    }

}
```

### Database Integration Tests

**Use Case**: Testing database operations with real PostgreSQL.

```java
package io.aurigraph.v11.integration;

import io.aurigraph.v11.testing.builders.ApprovalRequestTestBuilder;
import io.aurigraph.v11.token.secondary.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static io.restassured.RestAssured.*;
import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.*;

@DisplayName("Integration: Approval Workflow with Real Database")
class ApprovalDatabaseIntegrationTest extends AbstractIntegrationTest {

    private UUID testApprovalId;

    @BeforeEach
    void setUp() {
        testApprovalId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        cleanupTestData();
    }

    @Test
    @DisplayName("Integration: Create approval persists to database")
    void testCreateApproval_SavesToDatabaseAndRetrievable() {
        // Arrange: Create approval request body
        ApprovalRequest request = new ApprovalRequest(
            testApprovalId.toString(),
            "version-123",
            List.of("validator-1", "validator-2", "validator-3"),
            300  // 5 minute timeout
        );

        // Act: POST to create approval
        String approvalId = given(spec)
            .body(request)
            .post("/api/v11/approvals")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        // Assert: Verify in database via GET
        given(spec)
            .get("/api/v11/approvals/" + approvalId)
            .then()
            .statusCode(200)
            .body("id", equalTo(approvalId))
            .body("status", equalTo("PENDING"))
            .body("totalValidators", equalTo(3));
    }

    @Test
    @DisplayName("Integration: Vote submission updates database state")
    void testVoteSubmission_UpdatesDatabaseAndAffectsConsensus() {
        // Arrange: Create approval first
        String approvalId = given(spec)
            .body(new ApprovalRequest(
                testApprovalId.toString(),
                "version-123",
                List.of("validator-1", "validator-2", "validator-3"),
                300
            ))
            .post("/api/v11/approvals")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        // Act: Submit 3 YES votes (consensus threshold)
        for (String validatorId : List.of("validator-1", "validator-2", "validator-3")) {
            given(spec)
                .body(new VoteRequest(validatorId, "YES"))
                .post("/api/v11/approvals/" + approvalId + "/vote")
                .then()
                .statusCode(200);
        }

        // Assert: Approval should now be APPROVED
        given(spec)
            .get("/api/v11/approvals/" + approvalId)
            .then()
            .statusCode(200)
            .body("status", equalTo("APPROVED"));
    }

    @Test
    @DisplayName("Integration: List approvals with pagination")
    void testListApprovals_PaginationWorks() {
        // Arrange: Create 5 approvals
        for (int i = 0; i < 5; i++) {
            given(spec)
                .body(new ApprovalRequest(
                    UUID.randomUUID().toString(),
                    "version-" + i,
                    List.of("validator-1"),
                    300
                ))
                .post("/api/v11/approvals")
                .then()
                .statusCode(201);
        }

        // Act & Assert: Get page 1 (limit 2)
        List<String> page1Ids = given(spec)
            .queryParam("limit", 2)
            .queryParam("offset", 0)
            .get("/api/v11/approvals")
            .then()
            .statusCode(200)
            .extract()
            .path("id");

        assertThat(page1Ids).hasSize(2);

        // Get page 2 (limit 2, offset 2)
        List<String> page2Ids = given(spec)
            .queryParam("limit", 2)
            .queryParam("offset", 2)
            .get("/api/v11/approvals")
            .then()
            .statusCode(200)
            .extract()
            .path("id");

        assertThat(page2Ids)
            .hasSize(2)
            .doesNotContainAnyElementsOf(page1Ids);
    }

}
```

### End-to-End Workflow Tests

**Use Case**: Testing complete workflows from start to finish.

```java
package io.aurigraph.v11.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static io.restassured.RestAssured.*;
import static org.assertj.core.api.Assertions.*;

@DisplayName("Integration: End-to-End VVB Approval Workflow")
class VVBApprovalWorkflowIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Integration: Complete workflow: Create → Vote → Consensus → Execute")
    void testCompleteApprovalWorkflow_EndToEnd() throws InterruptedException {
        // Step 1: Create approval
        String approvalId = given(spec)
            .body(new ApprovalRequest(
                UUID.randomUUID().toString(),
                "token-version-123",
                List.of("validator-1", "validator-2", "validator-3"),
                300
            ))
            .post("/api/v11/approvals")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        assertThat(approvalId).isNotNull();

        // Step 2: Subscribe to status changes via WebSocket
        CountDownLatch statusChanged = new CountDownLatch(1);
        // (In real test, would connect to WebSocket endpoint)

        // Step 3: Submit votes
        given(spec)
            .body(new VoteRequest("validator-1", "YES"))
            .post("/api/v11/approvals/" + approvalId + "/vote")
            .then()
            .statusCode(200);

        given(spec)
            .body(new VoteRequest("validator-2", "YES"))
            .post("/api/v11/approvals/" + approvalId + "/vote")
            .then()
            .statusCode(200);

        given(spec)
            .body(new VoteRequest("validator-3", "YES"))
            .post("/api/v11/approvals/" + approvalId + "/vote")
            .then()
            .statusCode(200);

        // Step 4: Verify consensus reached
        given(spec)
            .get("/api/v11/approvals/" + approvalId)
            .then()
            .statusCode(200)
            .body("status", equalTo("APPROVED"))
            .body("consensusReachedAt", notNullValue());

        // Step 5: Execute approval
        String executionResult = given(spec)
            .post("/api/v11/approvals/" + approvalId + "/execute")
            .then()
            .statusCode(200)
            .extract()
            .path("executionId");

        assertThat(executionResult).isNotNull();

        // Step 6: Verify execution completed
        given(spec)
            .get("/api/v11/executions/" + executionResult)
            .then()
            .statusCode(200)
            .body("status", equalTo("COMPLETED"))
            .body("tokenVersionStatus", equalTo("ACTIVE"));
    }

}
```

---

## Test Data Builder Pattern

### Fluent Builder Examples

**Use Case**: Creating complex test objects with readable, fluent API.

**File**: `src/test/java/io/aurigraph/v11/testing/builders/ApprovalRequestTestBuilder.java`

```java
package io.aurigraph.v11.testing.builders;

import io.aurigraph.v11.token.secondary.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.*;

/**
 * Fluent builder for VVBApprovalRequest test objects.
 * 
 * Usage:
 * VVBApprovalRequest approval = new ApprovalRequestTestBuilder()
 *     .withId(approvalId)
 *     .withStatus(ApprovalStatus.PENDING)
 *     .withValidators("validator-1", "validator-2")
 *     .build();
 */
public class ApprovalRequestTestBuilder {

    private UUID id = UUID.randomUUID();
    private UUID tokenVersionId = UUID.randomUUID();
    private ApprovalStatus status = ApprovalStatus.PENDING;
    private List<String> validators = List.of(
        "validator-1",
        "validator-2",
        "validator-3"
    );
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private Instant expiresAt = Instant.now().plusSeconds(300);
    private int consensusThreshold = 2; // 2/3 validators

    public ApprovalRequestTestBuilder withId(UUID id) {
        this.id = id;
        return this;
    }

    public ApprovalRequestTestBuilder withTokenVersionId(UUID tokenVersionId) {
        this.tokenVersionId = tokenVersionId;
        return this;
    }

    public ApprovalRequestTestBuilder withStatus(ApprovalStatus status) {
        this.status = status;
        return this;
    }

    public ApprovalRequestTestBuilder withValidators(String... validators) {
        this.validators = List.of(validators);
        return this;
    }

    public ApprovalRequestTestBuilder withValidators(List<String> validators) {
        this.validators = validators;
        return this;
    }

    public ApprovalRequestTestBuilder withConsensusThreshold(int threshold) {
        this.consensusThreshold = threshold;
        return this;
    }

    public ApprovalRequestTestBuilder withCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public ApprovalRequestTestBuilder withExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
        return this;
    }

    public ApprovalRequestTestBuilder approved() {
        this.status = ApprovalStatus.APPROVED;
        return this;
    }

    public ApprovalRequestTestBuilder rejected() {
        this.status = ApprovalStatus.REJECTED;
        return this;
    }

    public ApprovalRequestTestBuilder expired() {
        this.status = ApprovalStatus.EXPIRED;
        this.expiresAt = Instant.now().minusSeconds(1);
        return this;
    }

    public VVBApprovalRequest build() {
        VVBApprovalRequest approval = new VVBApprovalRequest();
        approval.id = id;
        approval.tokenVersionId = tokenVersionId;
        approval.status = status;
        approval.validators = validators;
        approval.requiredConsensusCount = consensusThreshold;
        approval.createdAt = createdAt;
        approval.updatedAt = updatedAt;
        approval.expiresAt = expiresAt;
        return approval;
    }

}
```

**File**: `src/test/java/io/aurigraph/v11/testing/builders/ValidatorVoteTestBuilder.java`

```java
package io.aurigraph.v11.testing.builders;

import io.aurigraph.v11.token.secondary.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Fluent builder for ValidatorVote test objects.
 */
public class ValidatorVoteTestBuilder {

    private String validatorId = UUID.randomUUID().toString();
    private VoteChoice vote = VoteChoice.YES;
    private LocalDateTime submittedAt = LocalDateTime.now();
    private String justification = "Test vote";

    public ValidatorVoteTestBuilder withValidatorId(String validatorId) {
        this.validatorId = validatorId;
        return this;
    }

    public ValidatorVoteTestBuilder withVote(VoteChoice vote) {
        this.vote = vote;
        return this;
    }

    public ValidatorVoteTestBuilder approves() {
        this.vote = VoteChoice.YES;
        return this;
    }

    public ValidatorVoteTestBuilder rejects() {
        this.vote = VoteChoice.NO;
        return this;
    }

    public ValidatorVoteTestBuilder abstains() {
        this.vote = VoteChoice.ABSTAIN;
        return this;
    }

    public ValidatorVoteTestBuilder withJustification(String justification) {
        this.justification = justification;
        return this;
    }

    public ValidatorVote build() {
        ValidatorVote vote = new ValidatorVote(validatorId, this.vote);
        vote.submittedAt = submittedAt;
        vote.justification = justification;
        return vote;
    }

}
```

---

## Performance Test Template

**Use Case**: Measuring TPS, latency, and throughput under load.

```java
package io.aurigraph.v11.performance;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.stream.IntStream;

@DisplayName("Performance: Approval Service Throughput")
public class ApprovalServicePerformanceTest {

    @Test
    @DisplayName("Performance: Measure vote submission throughput (TPS)")
    void testVoteSubmissionThroughput() throws Exception {
        // Configuration
        int warmupIterations = 3;
        int measurementIterations = 5;
        int threadCount = 8;

        Options opt = new OptionsBuilder()
            .include(VoteSubmissionBenchmark.class.getSimpleName())
            .warmupIterations(warmupIterations)
            .measurementIterations(measurementIterations)
            .threads(threadCount)
            .forks(1)
            .resultFormat(org.openjdk.jmh.results.format.ResultFormatType.JSON)
            .result("performance-test-results.json")
            .build();

        new Runner(opt).run();
    }

}

@State(Scope.Benchmark)
class VoteSubmissionBenchmark {

    private ApprovalService approvalService;
    private UUID approvalId;
    private int validatorCounter = 0;

    @Setup(Level.Trial)
    public void setup() {
        approvalService = new ApprovalService();
        approvalId = UUID.randomUUID();
        
        // Create approval with many validators
        approvalService.createApproval(
            approvalId.toString(),
            "version-123",
            IntStream.range(0, 100)
                .mapToObj(i -> "validator-" + i)
                .toList(),
            300
        );
    }

    @Benchmark
    @BenchmarkMode(Mode.Throughput)
    @OutputTimeUnit(java.util.concurrent.TimeUnit.SECONDS)
    public void benchmarkVoteSubmission() {
        ValidatorVote vote = new ValidatorVote(
            "validator-" + (validatorCounter++ % 100),
            VoteChoice.YES
        );
        
        approvalService.submitVote(
            approvalId.toString(),
            vote
        ).await().indefinitely();
    }

}
```

---

## Contract Test Template

**Use Case**: Testing API contracts and GraphQL schema compliance.

```java
package io.aurigraph.v11.contract;

import au.com.dius.pact.consumer.dsl.PactBuilder;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.core.model.PactSpecVersion;
import au.com.dius.pact.core.model.RequestResponsePact;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(PactConsumerTestExt.class)
@DisplayName("Contract: ApprovalGraphQLAPI - GraphQL Schema Compliance")
class ApprovalGraphQLContractTest {

    @Test
    @DisplayName("Contract: getApproval query matches expected schema")
    @PactTestFor(providerName = "ApprovalGraphQLProvider", port = "8080")
    void testGetApprovalQueryContract(MockServer mockServer) {
        // Arrange: Define expected response
        RequestResponsePact pact = PactBuilder.consumer("ApprovalGraphQLConsumer")
            .hasExpectation()
                .upon_receiving("a request for approval data")
                .path("/graphql")
                .method("POST")
                .body(
                    "{\n" +
                    "  \"query\": \"query { approval(id: \\\"123\\\") { id status createdAt } }\"\n" +
                    "}"
                )
            .willRespondWith()
                .status(200)
                .body(
                    "{\n" +
                    "  \"data\": {\n" +
                    "    \"approval\": {\n" +
                    "      \"id\": \"123\",\n" +
                    "      \"status\": \"PENDING\",\n" +
                    "      \"createdAt\": \"2025-12-26T12:00:00Z\"\n" +
                    "    }\n" +
                    "  }\n" +
                    "}"
                )
            .toPact();

        // Act & Assert: Execute GraphQL query and verify response matches contract
        var response = mockServer.executeGraphQL(
            "query { approval(id: \"123\") { id status createdAt } }"
        );

        assertThat(response)
            .extracting("approval.id")
            .isEqualTo("123");
    }

}
```

---

## Key Testing Patterns Summary

| Pattern | Use Case | Key Example |
|---------|----------|-------------|
| **@Test + Uni.await()** | Unit test async Uni<T> | `result.await().indefinitely()` |
| **CountDownLatch + Multi** | Unit test async Multi<T> | `multi.subscribe().with(item -> latch.countDown())` |
| **@InjectMock** | Mock dependencies | `@InjectMock VVBApprovalService service` |
| **BroadcastProcessor** | Test GraphQL subscriptions | `processor.onNext(event)` |
| **Test Builders** | Create complex test data | `new ApprovalRequestTestBuilder().withStatus(...).build()` |
| **RestAssured** | Integration tests | `given(spec).get("/api/v11/approvals").then().statusCode(200)` |
| **AbstractIntegrationTest** | Database integration | Extends base with PostgreSQL/Kafka/Redis |
| **JMH Benchmarks** | Performance testing | Measure TPS, latency under load |
| **Pact** | Contract testing | Verify API schema compliance |

---

## Notes for Test Implementation

1. **Test Isolation**: Every test should be independent and pass in any order
2. **Naming Convention**: Use `testSubject_Condition_ExpectedResult()` format
3. **Arrange-Act-Assert**: Structure every test with these three sections
4. **Mocking Strategy**:
   - Unit tests: Mock all external dependencies (@InjectMock)
   - Integration tests: Use real infrastructure (Testcontainers)
5. **Async Testing**:
   - Uni<T>: Always use `.await().indefinitely()` for blocking
   - Multi<T>: Use CountDownLatch or AssertSubscriber for verification
6. **Performance Tests**: Run separately with `mvnw test -Dgroups=performance`
7. **Coverage**: Aim for 95% line coverage, 90% branch coverage

---

**Generated**: December 26, 2025
**Status**: Ready for P1-2 test implementation
