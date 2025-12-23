# Sprint 1 Implementation Guide: Core Versioning Infrastructure
## AV11-601 Secondary Token Versioning - Week 1-2 Detailed Execution Plan

**Sprint**: 1 (Core Infrastructure)
**Duration**: January 6-20, 2026 (10 business days)
**Story Points**: 35 SP
**Team**: 4 developers, 1 tech lead
**Goal**: Establish versioning infrastructure with SecondaryTokenVersion entity, database schema, versioning service, and 50 unit tests

---

## PRE-SPRINT PREPARATION (December 23-27)

### 1. Environment Setup Checklist

#### Development Environment
- [ ] Clone V12 repository: `https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT`
- [ ] Checkout `develop` branch
- [ ] Create feature branch: `feature/AV11-601-versioning`
- [ ] Maven: Latest version (`./mvnw --version` should show 3.8+)
- [ ] Java 21: `java --version` should confirm OpenJDK 21
- [ ] IDE setup: IntelliJ IDEA with Quarkus plugin
- [ ] Docker: `docker --version` for database containers

#### Database Setup
```bash
# Start PostgreSQL 15 for development
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=aurigraph_v12 \
  -e POSTGRES_USER=aurigraph \
  -e POSTGRES_PASSWORD=aurigraph \
  -p 5432:5432 \
  postgres:15

# Verify connection
psql -h localhost -U aurigraph -d aurigraph_v12 -c "SELECT version();"
```

#### Build Verification
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Clean build
./mvnw clean package -DskipTests

# Should produce: target/quarkus-app/quarkus-run.jar
# Build time: ~60s
```

### 2. Team Onboarding

#### Code Review Assignments
- **Reviewer 1**: Tech Lead (all implementation)
- **Reviewer 2**: Backend Developer (secondary)

#### Communication Channels
- **Standup**: 9:00 AM daily (10 min, Slack)
- **Sprint sync**: Monday 10:00 AM (30 min, Zoom)
- **Code review**: Continuous (PR comments)
- **Blockers**: Post in #aurigraph-blockers immediately

#### Knowledge Transfer
- [ ] Read: ARCHITECTURE-DIAGRAMS-AV11-601.md (30 min)
- [ ] Read: WBS-AV11-601-SECONDARY-TOKEN-VERSIONING.md (20 min)
- [ ] Review: PrimaryTokenRegistry.java (reference implementation, 30 min)
- [ ] Review: Story 2 test patterns (20 min)

### 3. Sprint Kickoff Materials

#### Git Setup
```bash
# Create feature branch from develop
git checkout -b feature/AV11-601-sprint1

# Create tracking branch at origin
git push -u origin feature/AV11-601-sprint1

# Local tracking
git branch -vv
```

#### JIRA Setup
- Create story: AV11-601-1 (Core Versioning Infrastructure)
- Create subtasks:
  - AV11-601-1.1: SecondaryTokenVersion entity
  - AV11-601-1.2: Database schema & migration
  - AV11-601-1.3: SecondaryTokenVersioningService
  - AV11-601-1.4: Version state machine
  - AV11-601-1.5: Registry index updates
  - AV11-601-1.6: Unit tests (50 tests)
  - AV11-601-1.7: Code review & merge
  - AV11-601-1.8: Documentation

#### Artifact Preparation
- [ ] Create `/docs/sprint-1-artifacts/` directory
- [ ] Create database schema design doc
- [ ] Create entity relationship diagram (PlantUML)
- [ ] Create API interface specifications

---

## DAY 1-2: Entity Design & Database Schema (Task 1.1 + 1.2)

### Day 1: Domain Model Design (5 SP)

#### Objective
Design SecondaryTokenVersion entity with proper fields, state transitions, and indexing strategy.

#### 1. Entity Interface Definition

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/token/secondary/SecondaryTokenVersion.java`

**Structure**:
```java
@Entity
@Table(name = "secondary_token_versions")
public class SecondaryTokenVersion {

    // === IDENTITY ===
    @Id
    public UUID id;

    // === RELATIONSHIP ===
    @Column(nullable = false)
    public UUID secondaryTokenId;  // FK to secondary_tokens

    // === VERSION INFO ===
    @Column(nullable = false, unique = true)
    public Integer versionNumber;  // Auto-incrementing

    // === CONTENT ===
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    public Map<String, Object> content;  // Flexible JSONB

    // === STATUS ===
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public SecondaryTokenStatus status;  // CREATED, ACTIVE, REPLACED, ARCHIVED

    // === AUDIT ===
    @Column(nullable = false)
    public String createdBy;

    @Column(nullable = false)
    public Instant createdAt;

    public UUID replacedBy;  // Points to version that replaced this
    public Instant replacedAt;

    // === MERKLE ===
    public String merkleHash;  // SHA256 hash

    // === VVB ===
    @Enumerated(EnumType.STRING)
    public VVBStatus vvbStatus;  // PENDING, APPROVED, REJECTED, TIMEOUT

    public Instant vvbApprovedAt;
    public String vvbResultHash;  // Hash of VVB approval

    // === TIMESTAMPS ===
    @Version
    public Long version;  // Optimistic locking
}

public enum SecondaryTokenStatus {
    CREATED,      // Initial state
    PENDING_VVB,  // Awaiting VVB validation
    APPROVED,     // VVB approved
    ACTIVE,       // Currently active version
    REPLACED,     // Replaced by newer version
    ARCHIVED,     // Moved to cold storage
    REJECTED      // VVB rejected
}

public enum VVBStatus {
    PENDING,    // Awaiting validation
    APPROVED,   // Approved
    REJECTED,   // Rejected
    TIMEOUT     // Validation timed out
}
```

#### 2. Database Schema Design

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/db/migration/V1__create_secondary_token_versions.sql`

```sql
CREATE TABLE secondary_token_versions (
    id UUID PRIMARY KEY,
    secondary_token_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    content JSONB,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    replaced_by UUID,
    replaced_at TIMESTAMP,
    merkle_hash VARCHAR(64),
    vvb_status VARCHAR(50),
    vvb_approved_at TIMESTAMP,
    vvb_result_hash VARCHAR(64),
    version BIGINT DEFAULT 0,  -- Optimistic locking

    -- Primary/Foreign keys
    CONSTRAINT fk_secondary_token_id
        FOREIGN KEY (secondary_token_id)
        REFERENCES secondary_tokens(id),

    -- Unique constraint: one version number per token
    CONSTRAINT uk_token_version_number
        UNIQUE (secondary_token_id, version_number),

    -- Unique constraint: id is natural key
    CONSTRAINT pk_versions
        PRIMARY KEY (id)
);

-- Indexes for performance (O(1) lookups)
CREATE INDEX idx_versions_token_id
    ON secondary_token_versions(secondary_token_id);

CREATE INDEX idx_versions_token_status
    ON secondary_token_versions(secondary_token_id, status);

CREATE INDEX idx_versions_status_created
    ON secondary_token_versions(status, created_at);

CREATE INDEX idx_versions_vvb_status
    ON secondary_token_versions(vvb_status);

-- Analyze for query planner optimization
ANALYZE secondary_token_versions;
```

#### 3. Entity Mapping Validation

**Testing Checklist**:
- [ ] Field types match database columns
- [ ] Indexes created in database
- [ ] Foreign key constraints work
- [ ] JSONB column supports flexible content
- [ ] UUID generation (auto or provided)
- [ ] Optimistic locking with @Version
- [ ] Enum mapping to VARCHAR

#### 4. Documentation

**File**: `docs/sprint-1-artifacts/entity-design.md`
- Entity class diagram (PlantUML)
- Field descriptions
- State transition diagram
- Index strategy rationale

**Effort**: 1 day
**Owner**: Backend Developer
**Review**: Tech Lead (code review)

---

### Day 2: Database Migration & Schema Validation (6 SP)

#### Objective
Create Liquibase migration scripts and validate schema in H2 and PostgreSQL.

#### 1. Liquibase Migration Setup

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/db/changelog/db.changelog-secondary-versions.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="1" author="aurigraph-team">
        <comment>Create secondary_token_versions table</comment>

        <createTable tableName="secondary_token_versions">
            <!-- Columns defined here -->
        </createTable>

        <createIndex tableName="secondary_token_versions"
                     indexName="idx_versions_token_id">
            <column name="secondary_token_id"/>
        </createIndex>

        <!-- Additional indexes -->
    </changeSet>

    <changeSet id="2" author="aurigraph-team">
        <comment>Add rollback procedure</comment>
        <rollback>
            <dropIndex tableName="secondary_token_versions"
                       indexName="idx_versions_token_id"/>
            <dropTable tableName="secondary_token_versions"/>
        </rollback>
    </changeSet>
</databaseChangeLog>
```

#### 2. Schema Validation Testing

**Test H2 Database** (in-memory, fast):
```bash
# Running application with H2 (test profile)
./mvnw -Dquarkus.datasource.db-kind=h2 quarkus:dev

# Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'PUBLIC'
AND table_name = 'SECONDARY_TOKEN_VERSIONS';
```

**Test PostgreSQL** (production-like):
```bash
# Start PostgreSQL container
docker run -d -p 5432:5432 postgres:15

# Run application with PostgreSQL
./mvnw -Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_v12 quarkus:dev

# Verify schema
\d secondary_token_versions  -- in psql
```

**Validation Checklist**:
- [ ] All columns present
- [ ] Data types correct
- [ ] Indexes created
- [ ] Foreign keys working
- [ ] JSONB column functional
- [ ] Migrations run without errors
- [ ] Rollback script tested

#### 3. Migration Documentation

**File**: `docs/sprint-1-artifacts/migration-guide.md`
- Running migrations
- Schema inspection commands
- Rollback procedures
- Troubleshooting guide

**Effort**: 1 day
**Owner**: Database Engineer
**Review**: Tech Lead

---

## DAY 3-4: Versioning Service Implementation (Task 1.3)

### Objective
Implement SecondaryTokenVersioningService with version lifecycle management.

#### 1. Service Interface Definition

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/token/secondary/SecondaryTokenVersioningService.java`

```java
@ApplicationScoped
public class SecondaryTokenVersioningService {

    @Inject
    SecondaryTokenRepository tokenRepo;

    @Inject
    SecondaryTokenVersionRepository versionRepo;

    @Inject
    SecondaryTokenMerkleService merkleService;

    @Inject
    Event<VersionCreatedEvent> versionCreatedEvent;

    @Inject
    Event<VersionActivatedEvent> versionActivatedEvent;

    @Inject
    Event<VersionReplacedEvent> versionReplacedEvent;

    // ===== CREATION =====

    @Transactional
    public Uni<SecondaryTokenVersion> createVersion(
        UUID secondaryTokenId,
        Map<String, Object> content,
        String createdBy,
        VersionChangeType changeType) {
        return Uni.createFrom().item(() -> {
            // Validate token exists
            var token = tokenRepo.findByIdOptional(secondaryTokenId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Token not found: " + secondaryTokenId));

            // Get next version number
            var nextVersionNumber = versionRepo
                .findMaxVersionNumberByTokenId(secondaryTokenId)
                .map(max -> max + 1)
                .orElse(1);

            // Create version entity
            var version = new SecondaryTokenVersion();
            version.id = UUID.randomUUID();
            version.secondaryTokenId = secondaryTokenId;
            version.versionNumber = nextVersionNumber;
            version.content = content;
            version.status = SecondaryTokenStatus.CREATED;
            version.createdBy = createdBy;
            version.createdAt = Instant.now();

            // Determine VVB status based on change type
            if (changeType == VersionChangeType.CRITICAL) {
                version.vvbStatus = VVBStatus.PENDING;
                version.status = SecondaryTokenStatus.PENDING_VVB;
            } else {
                version.vvbStatus = VVBStatus.APPROVED;  // Auto-approve
                version.status = SecondaryTokenStatus.CREATED;
            }

            // Compute Merkle hash
            version.merkleHash = merkleService.hashVersion(version);

            // Persist
            versionRepo.persist(version);

            // Fire event for observers
            versionCreatedEvent.fire(new VersionCreatedEvent(
                version.id,
                secondaryTokenId,
                nextVersionNumber,
                changeType,
                createdBy,
                Instant.now()
            ));

            LOG.infof("Created version %d for token %s",
                nextVersionNumber, secondaryTokenId);

            return version;
        });
    }

    // ===== RETRIEVAL =====

    @Transactional(readOnly = true)
    public Uni<SecondaryTokenVersion> getActiveVersion(
        UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            return versionRepo
                .findByTokenIdAndStatus(
                    secondaryTokenId,
                    SecondaryTokenStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException(
                    "No active version for token: " + secondaryTokenId));
        });
    }

    @Transactional(readOnly = true)
    public Uni<List<SecondaryTokenVersion>> getVersionChain(
        UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            return versionRepo
                .findByTokenIdOrderByVersionNumber(secondaryTokenId)
                .list();
        });
    }

    @Transactional(readOnly = true)
    public Uni<SecondaryTokenVersion> getVersion(UUID versionId) {
        return Uni.createFrom().item(() -> {
            return versionRepo.findByIdOptional(versionId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Version not found: " + versionId));
        });
    }

    // ===== LIFECYCLE =====

    @Transactional
    public Uni<Void> activateVersion(UUID versionId) {
        return Uni.createFrom().item(() -> {
            var version = versionRepo.findByIdOptional(versionId)
                .orElseThrow();

            if (version.status != SecondaryTokenStatus.APPROVED) {
                throw new IllegalStateException(
                    "Can only activate APPROVED versions");
            }

            // Transition to ACTIVE
            version.status = SecondaryTokenStatus.ACTIVE;

            // Mark previous active as REPLACED
            var previousActive = versionRepo
                .findByTokenIdAndStatus(
                    version.secondaryTokenId,
                    SecondaryTokenStatus.ACTIVE)
                .ifPresent(prev -> {
                    prev.status = SecondaryTokenStatus.REPLACED;
                    prev.replacedBy = versionId;
                    prev.replacedAt = Instant.now();
                });

            versionRepo.persist(version);

            versionActivatedEvent.fire(new VersionActivatedEvent(
                versionId,
                version.secondaryTokenId,
                Instant.now()
            ));

            return null;
        });
    }

    @Transactional
    public Uni<Void> replaceVersion(
        UUID versionId,
        Map<String, Object> newContent,
        String actor) {
        return Uni.createFrom().item(() -> {
            // Get current active version
            var activeVersion = versionRepo
                .findByTokenIdAndStatus(
                    /* tokenId from versionId lookup */,
                    SecondaryTokenStatus.ACTIVE)
                .orElseThrow();

            // Create new version with new content
            var newVersion = new SecondaryTokenVersion();
            newVersion.id = UUID.randomUUID();
            newVersion.secondaryTokenId = activeVersion.secondaryTokenId;
            newVersion.versionNumber = activeVersion.versionNumber + 1;
            newVersion.content = newContent;
            newVersion.status = SecondaryTokenStatus.PENDING_VVB;
            newVersion.createdBy = actor;
            newVersion.createdAt = Instant.now();

            versionRepo.persist(newVersion);

            versionReplacedEvent.fire(new VersionReplacedEvent(
                activeVersion.id,
                newVersion.id,
                activeVersion.versionNumber,
                newVersion.versionNumber,
                actor,
                Instant.now()
            ));

            return null;
        });
    }

    @Transactional
    public Uni<Void> archiveVersion(UUID versionId, String reason) {
        return Uni.createFrom().item(() -> {
            var version = versionRepo.findByIdOptional(versionId)
                .orElseThrow();

            // Can only archive REPLACED or EXPIRED
            if (version.status != SecondaryTokenStatus.REPLACED &&
                version.status != SecondaryTokenStatus.EXPIRED) {
                throw new IllegalStateException(
                    "Can only archive non-active versions");
            }

            version.status = SecondaryTokenStatus.ARCHIVED;
            versionRepo.persist(version);

            return null;
        });
    }
}
```

#### 2. Repository Interface

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/token/secondary/SecondaryTokenVersionRepository.java`

```java
@ApplicationScoped
public class SecondaryTokenVersionRepository
    implements PanacheRepository<SecondaryTokenVersion> {

    public Optional<Integer> findMaxVersionNumberByTokenId(UUID tokenId) {
        return find("secondaryTokenId", tokenId)
            .project(Integer.class, "max(versionNumber)")
            .firstResultOptional();
    }

    public List<SecondaryTokenVersion> findByTokenIdOrderByVersionNumber(
        UUID tokenId) {
        return find("secondaryTokenId", tokenId)
            .order("versionNumber")
            .list();
    }

    public Optional<SecondaryTokenVersion> findByTokenIdAndStatus(
        UUID tokenId,
        SecondaryTokenStatus status) {
        return find("secondaryTokenId = ?1 and status = ?2", tokenId, status)
            .firstResultOptional();
    }
}
```

#### 3. CDI Events

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/token/secondary/VersioningEvents.java`

```java
public static class VersionCreatedEvent {
    public final UUID versionId;
    public final UUID tokenId;
    public final Integer versionNumber;
    public final VersionChangeType changeType;
    public final String createdBy;
    public final Instant timestamp;

    public VersionCreatedEvent(UUID versionId, UUID tokenId,
        Integer versionNumber, VersionChangeType changeType,
        String createdBy, Instant timestamp) {
        this.versionId = versionId;
        this.tokenId = tokenId;
        this.versionNumber = versionNumber;
        this.changeType = changeType;
        this.createdBy = createdBy;
        this.timestamp = timestamp;
    }
}

public enum VersionChangeType {
    CRITICAL,        // Ownership, authorization
    INFORMATIONAL,   // Photos, notes
    METADATA         // Tags, status
}
```

#### 4. Testing Strategy

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/test/java/io/aurigraph/v11/token/secondary/SecondaryTokenVersioningServiceTest.java`

```java
@QuarkusTest
class SecondaryTokenVersioningServiceTest {

    @Inject
    SecondaryTokenVersioningService service;

    @Inject
    SecondaryTokenVersionRepository versionRepo;

    @Test
    void testCreateVersion() {
        var version = service.createVersion(
            tokenId,
            Map.of("content", "test"),
            "user@example.com",
            VersionChangeType.CRITICAL
        ).await().indefinitely();

        assertNotNull(version.id);
        assertEquals(1, version.versionNumber);
        assertEquals(SecondaryTokenStatus.PENDING_VVB, version.status);
    }

    // ... more tests
}
```

**Effort**: 2 days
**Owner**: Backend Developer
**Review**: Tech Lead

---

## DAY 5-6: State Machine & Registry Updates (Task 1.4 + 1.5)

### Day 5: Version State Machine

**File**: `SecondaryTokenVersionStateMachine.java`

```java
@ApplicationScoped
public class SecondaryTokenVersionStateMachine {

    private static final Map<
        SecondaryTokenStatus,
        Set<SecondaryTokenStatus>> VALID_TRANSITIONS = Map.ofEntries(
        Map.entry(CREATED, Set.of(PENDING_VVB, APPROVED, ACTIVE)),
        Map.entry(PENDING_VVB, Set.of(APPROVED, REJECTED)),
        Map.entry(APPROVED, Set.of(ACTIVE, REJECTED)),
        Map.entry(ACTIVE, Set.of(REPLACED, EXPIRED, ARCHIVED)),
        Map.entry(REPLACED, Set.of(ARCHIVED)),
        Map.entry(EXPIRED, Set.of(ARCHIVED)),
        Map.entry(REJECTED, Set.of(ARCHIVED)),
        Map.entry(ARCHIVED, Set.of())
    );

    public boolean canTransition(
        SecondaryTokenStatus fromState,
        SecondaryTokenStatus toState) {
        return VALID_TRANSITIONS
            .getOrDefault(fromState, Set.of())
            .contains(toState);
    }

    public void transitionOrThrow(
        SecondaryTokenVersion version,
        SecondaryTokenStatus toState) {
        if (!canTransition(version.status, toState)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s",
                    version.status, toState));
        }
        version.status = toState;
    }
}
```

**Tests**: 10 tests covering all transitions

### Day 6: Registry Index Updates

**Update**: SecondaryTokenRegistry with version-aware queries

```java
@ApplicationScoped
public class SecondaryTokenRegistry {

    // NEW METHODS FOR VERSIONING

    public Uni<SecondaryTokenVersion> lookupByTypeAndVersion(
        UUID parentTokenId,
        SecondaryTokenType type,
        Integer versionNumber) {
        return Uni.createFrom().item(() -> {
            // Query: token type + version number
        });
    }

    public Uni<List<SecondaryTokenVersion>> getVersionChain(
        UUID parentTokenId,
        SecondaryTokenType type) {
        return Uni.createFrom().item(() -> {
            // Query: all versions of given type, ordered
        });
    }
}
```

**Effort**: 2 days
**Owner**: Backend Developer

---

## DAY 7-8: Unit Tests (Task 1.6)

### Testing Breakdown

**50 Tests Organized as**:
- Entity tests (8): Field mapping, serialization
- Service tests (20): CRUD operations, lifecycle
- State machine tests (10): All transitions
- Registry tests (12): Lookups, performance

**Test Location**: `/src/test/java/io/aurigraph/v11/token/secondary/`

**Coverage Target**: 80%+ lines, 75%+ branches

#### Sample Test Structure

```java
@QuarkusTest
class SecondaryTokenVersionTest {

    @Nested
    @DisplayName("Entity Lifecycle Tests")
    class EntityTests {

        @Test
        @DisplayName("Should create version with all fields")
        void testCreateVersion() { ... }

        // 7 more tests
    }

    @Nested
    @DisplayName("Service Operation Tests")
    class ServiceTests {

        @Test
        @DisplayName("Should create and retrieve version")
        void testCreateAndRetrieve() { ... }

        // 19 more tests
    }
}
```

**Execution**: Run locally
```bash
./mvnw test -Dtest=*SecondaryTokenVersion* -DfailIfNoTests=false
```

**Effort**: 1.5 days
**Owner**: QA Engineer

---

## DAY 9: Code Review & Merge (Task 1.7)

### Review Checklist

**Code Quality**:
- [ ] All tests passing (50/50)
- [ ] Code coverage 80%+
- [ ] No SonarQube issues
- [ ] Javadoc 100% public methods
- [ ] No warnings in build

**Functionality**:
- [ ] Create version works
- [ ] Retrieve operations work
- [ ] State transitions valid
- [ ] Database schema correct
- [ ] Merkle hashing integrates

**Performance**:
- [ ] Entity creation < 50ms
- [ ] Lookups < 5ms
- [ ] No N+1 queries

**Documentation**:
- [ ] Architecture diagram updated
- [ ] API documentation added
- [ ] Javadoc complete

### Merge Process

```bash
# Push to feature branch
git push origin feature/AV11-601-sprint1

# Create PR
gh pr create \
  --title "feat: Implement secondary token versioning core infrastructure" \
  --body "Implements SecondaryTokenVersion entity, database schema, and versioning service with state machine and registry integration."

# Wait for reviews (max 24 hours)
# Once approved:
git merge --no-ff develop
git push origin develop
```

**Effort**: 0.5 days
**Owner**: Tech Lead

---

## DAY 10: Documentation & Handoff (Task 1.8)

### Deliverables

**Architecture Documentation**:
- [ ] Entity relationship diagram
- [ ] State machine diagram
- [ ] Component interaction diagram
- [ ] Database schema visualization

**API Documentation**:
- [ ] Service method signatures
- [ ] CDI event descriptions
- [ ] Repository query methods

**Developer Guide**:
- [ ] How to create a version
- [ ] How to retrieve versions
- [ ] How to implement state transitions
- [ ] Common patterns and pitfalls

**Deployment Guide**:
- [ ] Database migration procedure
- [ ] Rollback procedure
- [ ] Health check commands

### Handoff to Sprint 2

**Knowledge Transfer**:
- [ ] VVB team reviews versioning architecture
- [ ] Audit trail team understands events
- [ ] Everyone can run tests locally

**Repository State**:
- [ ] Feature branch merged to develop
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Ready for Sprint 2 dependency

**Effort**: 1 day
**Owner**: Tech Lead

---

## SPRINT 1 SUCCESS CRITERIA

### Must Have (Critical Path)
- ✅ SecondaryTokenVersion entity (250 LOC)
- ✅ Database schema created & validated
- ✅ SecondaryTokenVersioningService (400 LOC)
- ✅ Version state machine
- ✅ Registry integration
- ✅ 50 unit tests (80%+ coverage)
- ✅ Code reviewed and merged

### Should Have (Important)
- ✅ Javadoc 100% complete
- ✅ Architecture diagrams
- ✅ Integration with existing registry

### Nice to Have (Stretch)
- ⚡ Performance benchmarks established
- ⚡ Database optimization indices

---

## CONTINGENCY PLANS

### If Behind Schedule

**Day 3-4**:
- If DB schema slow: Simplify JSONB approach (use separate columns)
- If service complex: Break into smaller services

**Day 5-6**:
- If state machine testing slow: Use parameterized tests
- If registry integration slow: Defer to Sprint 2

**Day 7-8**:
- If tests failing: Focus on critical path tests first
- If coverage low: Add targeted tests for high-value paths

### If Critical Issue Found

**Response Plan**:
1. Immediately notify tech lead
2. Create JIRA bug ticket
3. Pull request with fix
4. Extended testing for regression
5. Document in retrospective

---

## DAILY STANDUP TEMPLATE

**Format**: 10 minutes, async in Slack

```
Yesterday:
- Completed: [Task, LOC written, tests added]
- Blockers: [Any blockers]

Today:
- Working on: [Next task]
- Expected output: [LOC, tests, documentation]

Risks:
- [Any risks identified]
```

**Example**:
```
Yesterday:
- Completed AV11-601-1.1: SecondaryTokenVersion entity (250 LOC)
- Added 8 unit tests for entity mapping
- No blockers

Today:
- Working on AV11-601-1.2: Database schema & migration
- Expected: Liquibase XML, test on H2 and PostgreSQL
- No blockers expected

Risks: None
```

---

## REVIEW CHECKLIST FOR TECH LEAD

- [ ] Code quality (no issues, 80%+ coverage)
- [ ] Tests all passing
- [ ] Performance verified (<50ms, <5ms)
- [ ] Database working on H2 and PostgreSQL
- [ ] Javadoc complete
- [ ] Documentation ready for handoff
- [ ] Ready to gate (all criteria met)

---

**Sprint 1 Status**: Ready to Execute
**Team Assignment**: Confirmed
**Infrastructure**: Set up
**Dependencies**: Resolved
**Go-Live**: January 6, 2026

