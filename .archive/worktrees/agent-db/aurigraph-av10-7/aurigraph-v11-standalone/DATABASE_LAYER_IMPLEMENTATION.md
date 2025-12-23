# Database Layer Implementation Guide

## Overview
This document describes the complete PostgreSQL + Panache database layer for Aurigraph V11 Asset Traceability and Registry APIs.

**Version**: V11.4.4
**Author**: agent-db
**Date**: 2025-11-14
**Migration**: V8__initial_registry_schema.sql

---

## Architecture

### Technology Stack
- **ORM**: Hibernate ORM 6.3 with Panache
- **Database**: PostgreSQL 16+
- **Migration**: Flyway
- **JSON Support**: Hypersistence Utils 3.7.3 (JSONB)
- **Primary Keys**: UUID (globally unique)

### Package Structure
```
io.aurigraph.v11.persistence/
├── entities/
│   ├── AssetTraceJpaEntity.java           # Asset lifecycle tracking
│   ├── OwnershipRecordJpaEntity.java      # Ownership transfer history
│   ├── AuditTrailEntryJpaEntity.java      # Complete audit log
│   ├── RegistryEntryJpaEntity.java        # Generic registry
│   ├── SmartContractJpaEntity.java        # Contract lifecycle
│   └── ComplianceCertificationJpaEntity.java  # Multi-level compliance
└── repositories/
    ├── AssetTraceRepository.java          # 20+ query methods
    ├── OwnershipRecordRepository.java     # (placeholder - to be implemented)
    ├── AuditTrailRepository.java          # Append-only audit queries
    ├── RegistryEntryRepository.java       # Generic registry queries
    ├── SmartContractRepository.java       # Contract CRUD
    └── ComplianceCertificationRepository.java  # Compliance queries
```

---

## Database Schema

### Table Summary

| Table | Purpose | Primary Key | Indexes | Foreign Keys |
|-------|---------|-------------|---------|--------------|
| `asset_trace` | Asset lifecycle tracking | UUID | 10 | - |
| `ownership_record` | Ownership transfer history | UUID | 7 | asset_trace(id) |
| `audit_trail_entry` | Complete audit log | UUID | 9 | asset_trace(id) |
| `registry_entry` | Generic registry | UUID | 8 | - |
| `smart_contract` | Smart contract lifecycle | UUID | 9 | - |
| `compliance_certification` | Multi-level compliance | UUID | 10 | - |

**Total**: 6 tables, 53 indexes, 2 foreign key constraints

### Key Features

1. **UUID Primary Keys**
   - Globally unique identifiers
   - Distributed system friendly
   - No ID collision across nodes

2. **JSONB Columns**
   - Flexible schema evolution
   - Performance-optimized JSON storage
   - Native PostgreSQL querying support

3. **Automatic Timestamps**
   - `created_at`: Set on insert (PostgreSQL trigger)
   - `updated_at`: Auto-updated on modification (PostgreSQL trigger)

4. **Soft Delete**
   - `archived` boolean flag
   - `archived_at` timestamp
   - Data retention for compliance

5. **Multi-Tenant Support**
   - `tenant_id` column on all tables
   - Tenant isolation at query level
   - Shared schema, isolated data

---

## Entity Descriptions

### 1. AssetTraceJpaEntity

**Purpose**: Complete asset lifecycle tracking from creation to disposal

**Key Fields**:
- `assetId`: Business identifier (unique, indexed)
- `assetType`: Classification (pharmaceuticals, electronics, food, etc.)
- `status`: Lifecycle state (CREATED, IN_TRANSIT, DELIVERED, ARCHIVED)
- `currentOwnerId`: Current owner reference
- `latitude/longitude`: Geospatial location
- `chainOfCustodyVerified`: Verification flag
- `customAttributes`: Flexible JSONB metadata
- `sensorsData`: IoT sensor readings (temperature, humidity, shock)

**Relationships**:
- One-to-Many: `ownershipHistory` (ownership transfers)
- One-to-Many: `auditTrail` (audit log entries)

**Performance Targets**:
- Query by ID: <50ms
- List queries: <100ms for 100 records
- Bulk operations: 1000+ assets/second

---

### 2. OwnershipRecordJpaEntity

**Purpose**: Immutable ownership transfer history with digital signatures

**Key Fields**:
- `fromOwnerId/toOwnerId`: Transfer parties
- `transferDate`: Transfer timestamp
- `transferType`: SALE, TRANSFER, LEASE, CONSIGNMENT
- `fromOwnerSignature/toOwnerSignature`: Cryptographic signatures
- `blockchainTxHash`: On-chain verification
- `transferMetadata`: JSONB for flexible data

**Immutability**: Records cannot be updated after creation (audit compliance)

**Performance Targets**:
- Write: <100ms
- Query: <50ms for ownership history
- Bulk import: 500+ records/second

---

### 3. AuditTrailEntryJpaEntity

**Purpose**: Complete immutable audit log for all operations

**Key Fields**:
- `entityType/entityId`: Audited entity reference
- `actionType`: CRUD operation type
- `beforeState/afterState`: Complete state capture (JSONB)
- `userId`: User attribution
- `ipAddress/userAgent`: Session metadata
- `entryHash/previousEntryHash`: Hash chain for integrity

**Append-Only**: Delete operations are disabled in repository

**Performance Targets**:
- Write: <50ms
- Query: <100ms for audit trail
- Bulk write: 2000+ entries/second

---

### 4. RegistryEntryJpaEntity

**Purpose**: Generic registry for blockchain artifacts and configuration

**Key Fields**:
- `registryKey`: Unique identifier (indexed)
- `entryType`: SMART_CONTRACT, TOKEN, ORACLE, CONFIG, FEATURE_FLAG
- `value`: JSONB payload
- `version`: Version tracking
- `status`: ACTIVE, DEPRECATED, ARCHIVED
- `parentId`: Hierarchical organization

**Use Cases**:
- Smart contract ABI registry
- Token metadata storage
- Oracle endpoint configuration
- Feature flag management

**Performance Targets**:
- Write: <50ms
- Query by key: <30ms
- Bulk operations: 1000+ entries/second

---

### 5. SmartContractJpaEntity

**Purpose**: Complete smart contract lifecycle management

**Key Fields**:
- `contractAddress`: On-chain address (unique, indexed)
- `contractType`: ERC20, ERC721, CUSTOM, RWA_REGISTRY
- `abi`: Contract ABI (JSONB)
- `bytecode/sourceCode`: Contract code
- `isUpgradeable`: Proxy pattern flag
- `linkedAssets`: Associated asset references (JSONB)
- `securityAudit`: Audit results (JSONB)

**Lifecycle States**:
- DEPLOYED → VERIFIED → ACTIVE → PAUSED → DEACTIVATED

**Performance Targets**:
- Write: <100ms
- Query by address: <50ms
- Bulk operations: 500+ contracts/second

---

### 6. ComplianceCertificationJpaEntity

**Purpose**: Multi-level compliance certification system

**Compliance Levels**:
1. **Level 1**: Basic (KYC, basic documentation)
2. **Level 2**: Standard (AML, sanctions screening)
3. **Level 3**: Enhanced (GDPR, SOC2 Type II)
4. **Level 4**: Premium (FDA, industry-specific)
5. **Level 5**: Enterprise (custom frameworks, multi-jurisdiction)

**Key Fields**:
- `complianceLevel`: 1-5 (CHECK constraint)
- `certificationType`: KYC, AML, GDPR, FDA, SOC2, CUSTOM
- `regulatoryFramework`: FDA_21_CFR, GDPR, SOC2_TYPE_II, etc.
- `riskScore`: Calculated risk (0-100)
- `kycVerified/amlVerified`: Compliance flags
- `expiresAt`: Certificate expiry
- `verifierSignatures`: Multi-party verification (JSONB)

**Performance Targets**:
- Write: <100ms
- Query: <50ms
- Bulk operations: 200+ certificates/second

---

## Repository Methods

### AssetTraceRepository (20+ methods)

**Basic CRUD**:
- `findByAssetId(String assetId)`: Lookup by business ID
- `findBySerialNumber(String serialNumber)`: Serial number search
- `findByBlockchainTxHash(String txHash)`: Blockchain reference

**Filtering**:
- `findByAssetType(String assetType)`: Type-based filtering
- `findByStatus(String status)`: Status filtering
- `findByCurrentOwnerId(String ownerId)`: Owner filtering
- `findByBatchId(String batchId)`: Batch filtering
- `findByManufacturer(String manufacturer)`: Manufacturer filtering

**Location Queries**:
- `findByLocation(String location)`: Location search
- `findByLocationBounds(minLat, maxLat, minLon, maxLon)`: Geospatial bounding box

**Compliance**:
- `findVerifiedChainOfCustody()`: Verified assets
- `findByComplianceStatus(String status)`: Compliance filtering
- `findByRegulatoryFramework(String framework)`: Regulatory filtering

**Time-Based**:
- `findCreatedAfter(Instant after)`: Recent assets
- `findUpdatedBetween(Instant start, Instant end)`: Time range
- `findExpiringBetween(Instant start, Instant end)`: Expiry tracking

**Multi-Tenant**:
- `findByTenantId(String tenantId)`: Tenant isolation
- `findActiveByTenantId(String tenantId)`: Non-archived assets

**Archive Management**:
- `findArchived()`: Archived assets
- `archiveAsset(UUID id)`: Soft delete
- `restoreAsset(UUID id)`: Restore

**Complex Queries**:
- `searchAssets(type, status, owner, location, archived)`: Multi-criteria
- `countByAssetType/Status/OwnerId()`: Aggregations
- `findRecentlyUpdated(int days)`: Recent activity

---

## Migration Details

### V8__initial_registry_schema.sql

**Location**: `src/main/resources/db/migration/V8__initial_registry_schema.sql`

**Features**:
- Creates 6 tables with complete schema
- 53 indexes for query optimization
- 2 foreign key constraints
- 4 auto-update triggers for `updated_at`
- Table and column comments
- Permission grants for `aurigraph` user

**Execution**:
- Automatic on application startup (Flyway)
- Idempotent (IF NOT EXISTS clauses)
- Rollback support via Flyway

---

## Configuration

### application.properties

```properties
# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=aurigraph2025
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_demos

# Hibernate ORM
quarkus.hibernate-orm.database.generation=update
quarkus.hibernate-orm.log.sql=false
quarkus.hibernate-orm.packages=io.aurigraph.v11.persistence.entities

# Flyway Migration
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.clean-disabled=false
quarkus.flyway.repair-on-migrate=true
```

### pom.xml Dependencies

```xml
<!-- Hibernate ORM with Panache -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-hibernate-orm-panache</artifactId>
</dependency>

<!-- PostgreSQL JDBC Driver -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-jdbc-postgresql</artifactId>
</dependency>

<!-- Flyway for migrations -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-flyway</artifactId>
</dependency>

<!-- Hypersistence Utils for JSONB -->
<dependency>
    <groupId>io.hypersistence</groupId>
    <artifactId>hypersistence-utils-hibernate-63</artifactId>
    <version>3.7.3</version>
</dependency>
```

---

## Performance Optimization

### Indexes

**Strategy**: Cover common query patterns
- Primary keys: UUID with B-tree index
- Foreign keys: Automatic indexes
- Filter columns: status, type, owner, tenant
- Time columns: created_at, updated_at, expires_at
- Business identifiers: asset_id, serial_number, certificate_id

**Total Indexes**: 53 across 6 tables

### Query Optimization Tips

1. **Use Indexes**: Filter on indexed columns (status, type, owner)
2. **Limit Results**: Use Panache pagination (`page(pageIndex, pageSize)`)
3. **Projection**: Select only needed columns (future optimization)
4. **Batch Operations**: Use batch inserts for bulk data
5. **Connection Pooling**: Configure max pool size (default: 20)

### JSONB Performance

- **Indexing**: Create GIN indexes for JSONB columns if needed
- **Querying**: Use PostgreSQL JSONB operators (`->>`, `@>`, `?`)
- **Size**: Keep JSONB payloads <1MB for optimal performance

---

## Testing

### Database Setup

```bash
# Create PostgreSQL database
createdb aurigraph_demos

# Create application user
psql -d aurigraph_demos -c "CREATE USER aurigraph WITH PASSWORD 'aurigraph2025';"
psql -d aurigraph_demos -c "GRANT ALL PRIVILEGES ON DATABASE aurigraph_demos TO aurigraph;"
```

### Running Migrations

```bash
# Automatic on startup
./mvnw quarkus:dev

# Manual migration
./mvnw flyway:migrate

# Rollback
./mvnw flyway:clean  # WARNING: Deletes all data
```

### Sample Queries

```java
// Inject repository
@Inject
AssetTraceRepository assetRepo;

// Find by asset ID
Optional<AssetTraceJpaEntity> asset = assetRepo.findByAssetId("ASSET-001");

// Search assets
List<AssetTraceJpaEntity> assets = assetRepo.searchAssets(
    "PHARMACEUTICAL",
    "IN_TRANSIT",
    "OWNER-123",
    null,
    false
);

// Archive asset
boolean archived = assetRepo.archiveAsset(assetId);
```

---

## Troubleshooting

### Common Issues

1. **Migration Failed**
   - Check PostgreSQL connection
   - Verify database user permissions
   - Review Flyway migration logs

2. **JSONB Type Not Found**
   - Verify `hypersistence-utils` dependency
   - Check Hibernate version compatibility

3. **Foreign Key Violations**
   - Ensure parent records exist before insert
   - Use cascading deletes where appropriate

4. **Slow Queries**
   - Check index usage with `EXPLAIN ANALYZE`
   - Review connection pool settings
   - Consider additional indexes for custom queries

---

## Future Enhancements

1. **Read Replicas**: PostgreSQL streaming replication
2. **Sharding**: Horizontal partitioning by tenant_id
3. **Caching**: Redis cache for hot data
4. **Full-Text Search**: PostgreSQL FTS or Elasticsearch
5. **Time-Series**: TimescaleDB for sensor data
6. **GIS Support**: PostGIS for advanced geospatial queries

---

## References

- [Hibernate ORM with Panache](https://quarkus.io/guides/hibernate-orm-panache)
- [Flyway Migrations](https://quarkus.io/guides/flyway)
- [Hypersistence Utils](https://github.com/vladmihalcea/hypersistence-utils)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**End of Document**
