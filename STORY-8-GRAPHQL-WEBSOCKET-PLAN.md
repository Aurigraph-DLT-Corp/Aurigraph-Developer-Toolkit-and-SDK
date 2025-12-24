# Story 8: GraphQL API & WebSocket Support - Implementation Plan

**Version**: 1.0  
**Date**: December 24, 2025  
**Status**: PLANNING  
**Estimated Duration**: 5-7 business days  
**Dependencies**: Story 5-7 (v11.0.0 baseline) - COMPLETE ✅

---

## 🎯 Story Objectives

### Primary Goals
1. **GraphQL API**: Enable powerful, flexible querying of approval data
2. **WebSocket Support**: Real-time approval status updates and streaming
3. **Webhook Registry Persistence**: Move from in-memory to PostgreSQL database
4. **Performance**: Maintain <5s consensus time with added features

### Success Criteria
- ✅ GraphQL schema with full CRUD operations on approvals
- ✅ GraphQL subscriptions for real-time updates
- ✅ WebSocket endpoint fully functional
- ✅ Webhook registry persisted in database
- ✅ 15+ new unit tests (GraphQL resolvers)
- ✅ 3+ new E2E tests (WebSocket subscriptions)
- ✅ Code coverage maintained ≥80%
- ✅ Performance targets maintained (<5s consensus time)

---

## 📐 Architecture Design

### GraphQL Schema Structure

```graphql
type Query {
  # Single approval retrieval
  approval(id: ID!): Approval
  
  # Approval list with filtering
  approvals(
    status: ApprovalStatus
    validator: String
    limit: Int = 20
    offset: Int = 0
  ): [Approval!]!
  
  # Aggregated statistics
  approvalStats: ApprovalStatistics!
  
  # Validator performance
  validator(id: String!): ValidatorStats
}

type Subscription {
  # Real-time approval status changes
  approvalStatusChanged(id: ID!): ApprovalEvent!
  
  # Real-time vote submissions
  voteSubmitted(approvalId: ID!): VoteEvent!
  
  # Consensus reached notifications
  consensusReached(approvalId: ID!): ConsensusEvent!
  
  # Webhook delivery status updates
  webhookDeliveryStatus(webhookId: ID!): WebhookEvent!
}

type Mutation {
  # Create approval (existing)
  createApproval(input: CreateApprovalInput!): ApprovalResponse!
  
  # Submit vote (existing)
  submitVote(input: SubmitVoteInput!): VoteResponse!
  
  # Execute approved action (new)
  executeApproval(approvalId: ID!): ExecutionResponse!
  
  # Register webhook (database-backed)
  registerWebhook(url: String!, events: [String!]!): WebhookResponse!
  
  # Unregister webhook
  unregisterWebhook(webhookId: ID!): Boolean!
}

type Approval {
  id: ID!
  status: ApprovalStatus!
  tokenVersionId: String!
  totalValidators: Int!
  votingWindowEnd: DateTime!
  votes: [ValidatorVote!]!
  consensusReachedAt: DateTime
  executedAt: DateTime
  rejectedAt: DateTime
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

### Database Schema for Webhook Registry

```sql
CREATE TABLE IF NOT EXISTS approval_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(2048) NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret_key VARCHAR(256) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_delivery_at TIMESTAMP,
  delivery_success_count INT DEFAULT 0,
  delivery_failure_count INT DEFAULT 0,
  UNIQUE(url)
);

CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES approval_webhooks(id),
  event_type VARCHAR(100) NOT NULL,
  approval_id VARCHAR(255),
  http_status INT,
  response_time_ms INT,
  attempt_number INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON approval_webhooks(is_active);
CREATE INDEX ON webhook_delivery_attempts(webhook_id);
CREATE INDEX ON webhook_delivery_attempts(created_at);
```

### WebSocket Endpoint Architecture

```
/ws/approvals/{approvalId}
├─ Upgrade to WebSocket
├─ Authenticate via JWT
├─ Subscribe to approval events
├─ Receive real-time updates
└─ Maintain 5-minute heartbeat

Message Format (JSON):
{
  "type": "approval_status_changed|vote_submitted|consensus_reached",
  "approval_id": "...",
  "timestamp": "2025-12-24T...",
  "data": {...}
}
```

---

## 🛠️ Implementation Tasks

### Phase 1: GraphQL Setup (2 days)

#### 1.1 Add GraphQL Dependencies
```xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-graphql</artifactId>
</dependency>
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-smallrye-graphql-client</artifactId>
</dependency>
```

**Files to Create:**
- `src/main/java/io/aurigraph/v11/graphql/ApprovalGraphQLAPI.java`
  - GraphQL Query resolvers
  - GraphQL Mutation resolvers
  - GraphQL Subscription resolvers
- `src/main/java/io/aurigraph/v11/graphql/type/ApprovalType.java`
  - GraphQL type definitions
  - Scalar type mappings
  - Input type definitions

#### 1.2 Implement GraphQL Resolvers
```java
@GraphQLApi
public class ApprovalGraphQLAPI {
  @Inject VVBApprovalService approvalService;
  
  @Query
  public Approval approval(@Name("id") String id) { }
  
  @Query
  public List<Approval> approvals(
    @Name("status") ApprovalStatus status,
    @Name("limit") int limit,
    @Name("offset") int offset
  ) { }
  
  @Query
  public ApprovalStatistics approvalStats() { }
  
  @Mutation
  public ExecutionResponse executeApproval(@Name("approvalId") String id) { }
  
  @Subscription
  public Multi<ApprovalEvent> approvalStatusChanged(@Name("id") String id) { }
}
```

**Tests:**
- GraphQL query parsing
- Resolver execution
- Error handling
- Argument validation

---

### Phase 2: WebSocket Implementation (2 days)

#### 2.1 Create WebSocket Endpoint
```java
@ApplicationScoped
public class ApprovalWebSocketEndpoint {
  @OnOpen
  public void onOpen(Session session, @PathParam String approvalId) { }
  
  @OnMessage
  public void onMessage(String message, Session session) { }
  
  @OnClose
  public void onClose(Session session) { }
  
  @OnError
  public void onError(Session session, Throwable error) { }
}
```

**Features:**
- JWT authentication validation
- Connection heartbeat (5-minute intervals)
- Message routing to subscribers
- Automatic reconnection handling
- Graceful closure with 30-second timeout

#### 2.2 Implement Subscription Broadcasting
```java
@ApplicationScoped
public class ApprovalSubscriptionManager {
  // Map of approval -> connected sessions
  private final Map<String, Set<Session>> subscriptions = new ConcurrentHashMap<>();
  
  public void subscribeToApproval(String approvalId, Session session) { }
  public void unsubscribeFromApproval(String approvalId, Session session) { }
  public void broadcastApprovalEvent(ApprovalEvent event) { }
}
```

**Events Broadcasted:**
- Approval status changes (PENDING → APPROVED/REJECTED)
- Vote submissions
- Consensus reached notifications
- Webhook delivery status updates

**Tests:**
- WebSocket connection establishment
- Authentication validation
- Message broadcasting
- Connection closure and cleanup
- Heartbeat mechanism

---

### Phase 3: Webhook Registry Migration (1.5 days)

#### 3.1 Create Webhook Entity
```java
@Entity
@Table(name = "approval_webhooks")
public class WebhookRegistration {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  public UUID id;
  
  @Column(length = 2048, nullable = false)
  public String url;
  
  @Array
  @Column(nullable = false)
  public String[] events;
  
  @Column(nullable = false)
  public Boolean isActive;
  
  @Column(nullable = false)
  public String secretKey;
  
  @Temporal(TIMESTAMP)
  public LocalDateTime createdAt;
  
  @Temporal(TIMESTAMP)
  public LocalDateTime lastDeliveryAt;
  
  public Integer deliverySuccessCount;
  public Integer deliveryFailureCount;
}
```

#### 3.2 Migrate WebhookService
```java
@ApplicationScoped
public class ApprovalWebhookService {
  @Inject
  WebhookRegistrationRepository webhookRepo;
  
  @Inject
  WebhookDeliveryAttemptRepository deliveryRepo;
  
  public UUID registerWebhook(String url, String[] events) {
    // Persist to database instead of in-memory
  }
  
  public void unregisterWebhook(UUID webhookId) {
    // Mark inactive instead of deleting
  }
}
```

**Database Migrations:**
- V33__create_webhook_registry.sql - Create tables
- V34__add_webhook_delivery_tracking.sql - Add delivery tracking
- V35__migrate_webhook_events.sql - Migrate existing webhooks (if any)

**Tests:**
- Webhook creation and retrieval
- Event filtering
- Delivery attempt tracking
- Status aggregation

---

### Phase 4: Integration & Testing (1.5 days)

#### 4.1 GraphQL E2E Tests
```java
@QuarkusTest
public class ApprovalGraphQLE2ETest {
  @Test
  public void testApprovalQuery() { }
  
  @Test
  public void testApprovalSubscription() { }
  
  @Test
  public void testExecuteApprovalMutation() { }
}
```

#### 4.2 WebSocket Integration Tests
```java
@QuarkusTest
public class ApprovalWebSocketE2ETest {
  @Test
  public void testWebSocketConnection() { }
  
  @Test
  public void testRealTimeApprovalUpdate() { }
  
  @Test
  public void testUnauthorizedWebSocketAccess() { }
}
```

#### 4.3 Performance Benchmarks
- GraphQL query response time <1s (target)
- WebSocket message delivery <100ms (target)
- Webhook registry lookup <10ms (target)

---

## 📦 Key Files to Create

### New Classes (6 files)
1. `ApprovalGraphQLAPI.java` - GraphQL resolvers
2. `ApprovalGraphQLTypes.java` - GraphQL type definitions
3. `ApprovalWebSocketEndpoint.java` - WebSocket endpoint
4. `ApprovalSubscriptionManager.java` - Subscription management
5. `WebhookRegistration.java` - JPA entity
6. `WebhookRegistrationRepository.java` - Repository interface

### New Test Files (3 files)
1. `ApprovalGraphQLE2ETest.java` - GraphQL integration tests
2. `ApprovalWebSocketE2ETest.java` - WebSocket integration tests
3. `WebhookRegistryMigrationTest.java` - Migration validation

### Database Migrations (3 files)
1. `V33__create_webhook_registry.sql`
2. `V34__add_webhook_delivery_tracking.sql`
3. `V35__migrate_webhook_events.sql`

### Configuration (1 file)
1. `application.properties` updates for GraphQL/WebSocket config

---

## 🧪 Testing Strategy

### Unit Tests Target: 20+ tests
- GraphQL resolver execution (8 tests)
- WebSocket message handling (6 tests)
- Webhook registry operations (6 tests)

### Integration Tests Target: 10+ tests
- GraphQL query with database (3 tests)
- WebSocket connection flow (4 tests)
- Webhook persistence (3 tests)

### Performance Tests
- GraphQL query latency <1s
- WebSocket message delivery <100ms
- Webhook registry lookup <10ms

### Code Coverage Target
- Maintain ≥80% overall coverage
- Target ≥85% for new GraphQL/WebSocket code

---

## 📊 Metrics & Monitoring

### New Prometheus Metrics
```
# GraphQL Metrics
graphql_query_duration_seconds{operation}
graphql_mutation_duration_seconds{operation}
graphql_subscription_active_count

# WebSocket Metrics
websocket_connections_active
websocket_message_latency_seconds
websocket_connection_duration_seconds

# Webhook Metrics
webhook_registrations_total
webhook_delivery_latency_seconds{status}
webhook_active_subscriptions
```

### Alert Rules
1. GraphQL query latency >1s (WARNING)
2. WebSocket disconnections >5% in 5min (WARNING)
3. Webhook delivery failures >1% (WARNING)
4. Subscription manager memory >500MB (CRITICAL)

---

## 🔄 CI/CD Updates

### New Pipeline Stage
- **GraphQL Validation**: Validate schema syntax and resolver mappings
- **WebSocket Tests**: E2E WebSocket connectivity tests
- **Database Migration Tests**: Validate webhook registry migration

### Deployment Checklist Updates
- [ ] GraphQL schema documentation available
- [ ] WebSocket URL registered in API docs
- [ ] Webhook registry migration tested
- [ ] Subscription limits configured
- [ ] WebSocket idle timeout configured (5 minutes)

---

## 📚 Documentation

### API Documentation Updates
1. **GraphQL Playground**: Auto-generated from schema
2. **WebSocket Guide**: Connection, authentication, message format
3. **Webhook Registry API**: Database-backed webhook management
4. **Migration Guide**: From in-memory to database webhooks

### Examples Provided
```graphql
# Example Query
query {
  approvals(status: PENDING, limit: 10) {
    id
    status
    totalValidators
    votes { validatorId choice }
  }
}

# Example Subscription
subscription {
  approvalStatusChanged(id: "abc-123") {
    approvalId
    newStatus
    timestamp
  }
}
```

```javascript
// WebSocket Example
const ws = new WebSocket('wss://dlt.aurigraph.io/ws/approvals/abc-123');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Update:', msg.type, msg.data);
};
```

---

## 🚀 Timeline

**Sprint: 5-7 Business Days**

| Day | Phase | Deliverables |
|-----|-------|--------------|
| 1-2 | Phase 1 | GraphQL schema, resolvers, basic tests |
| 3-4 | Phase 2 | WebSocket endpoint, subscription manager, tests |
| 5 | Phase 3 | Database migration, webhook entity, tests |
| 6-7 | Phase 4 | Integration, E2E tests, documentation |

---

## ⚠️ Risk Mitigation

### Technical Risks
1. **GraphQL N+1 Query Problem**
   - Mitigation: Use DataLoader for batch loading
   - Testing: Query complexity analyzer

2. **WebSocket Memory Leaks**
   - Mitigation: Automatic connection cleanup, memory monitoring
   - Testing: Long-running connection stress tests

3. **Database Webhook Registry Performance**
   - Mitigation: Indexed queries, caching for active webhooks
   - Testing: Load testing with 1000+ webhooks

### Operational Risks
1. **Breaking Changes to Existing API**
   - Mitigation: REST API remains unchanged, GraphQL is additive
   - Testing: Backward compatibility tests

2. **Webhook Registration Data Loss**
   - Mitigation: Database backup before migration, rollback procedure
   - Testing: Migration testing in staging environment

---

## 📝 Success Criteria Checklist

- [ ] GraphQL API fully functional (Query, Mutation, Subscription)
- [ ] WebSocket endpoint accepts connections and broadcasts events
- [ ] Webhook registry migrated to database with 100% data integrity
- [ ] 20+ new unit tests added (GraphQL, WebSocket, migration)
- [ ] 10+ integration/E2E tests passing
- [ ] Code coverage ≥80%
- [ ] Performance targets met (<5s consensus, <1s GraphQL, <100ms WebSocket)
- [ ] Documentation updated with examples
- [ ] CI/CD pipeline updated for Story 8 artifacts
- [ ] Staging deployment validated
- [ ] Ready for production deployment

---

## 🎓 Architecture Benefits

**GraphQL Advantages:**
- Flexible querying (clients specify exact fields needed)
- Reduced over-fetching (only request needed data)
- Real-time subscriptions (true push notifications)
- Self-documenting API (schema inspection available)

**WebSocket Benefits:**
- Lower latency than polling (real-time updates)
- Reduced bandwidth (only changes sent)
- Bidirectional communication (client ↔ server)
- Better scalability (connection pooling)

**Database-Backed Webhooks:**
- Persistence across restarts
- Historical tracking of webhook deliveries
- Multi-instance webhook synchronization
- Audit trail for webhook operations

---

*Generated*: December 24, 2025  
*Status*: Ready for Implementation  
*Dependencies*: Story 5-7 Complete ✅
