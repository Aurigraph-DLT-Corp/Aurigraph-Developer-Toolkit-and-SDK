# Service Update Guide: Integrating Database Layer

## Overview
This guide explains how to integrate the new PostgreSQL + Panache database layer into existing Aurigraph V11 services for Asset Traceability and Registry APIs.

**Target Services**:
- Asset Traceability Service
- Registry Service
- Smart Contract Service
- Compliance Service

**Target Audience**: agent-api, agent-contract, agent-compliance

---

## Integration Steps

### Step 1: Inject Repositories

Replace in-memory storage with Panache repositories using CDI injection.

**Before (In-Memory)**:
```java
@ApplicationScoped
public class AssetTraceabilityService {
    private final Map<String, Asset> assetStore = new ConcurrentHashMap<>();

    public Asset getAsset(String assetId) {
        return assetStore.get(assetId);
    }
}
```

**After (PostgreSQL + Panache)**:
```java
@ApplicationScoped
public class AssetTraceabilityService {

    @Inject
    AssetTraceRepository assetRepo;

    public AssetTraceJpaEntity getAsset(String assetId) {
        return assetRepo.findByAssetId(assetId)
            .orElseThrow(() -> new NotFoundException("Asset not found: " + assetId));
    }
}
```

---

### Step 2: Update Service Methods

#### Create Asset

```java
@Transactional
public AssetTraceJpaEntity createAsset(CreateAssetRequest request) {
    // Create entity
    AssetTraceJpaEntity asset = new AssetTraceJpaEntity();
    asset.setAssetId(request.assetId());
    asset.setAssetType(request.assetType());
    asset.setAssetName(request.assetName());
    asset.setDescription(request.description());
    asset.setStatus("CREATED");
    asset.setCreatedBy(request.userId());
    asset.setTenantId(request.tenantId());

    // Persist
    assetRepo.persist(asset);

    // Create audit trail entry
    createAuditEntry(asset, "ASSET_CREATED");

    return asset;
}
```

#### Update Asset

```java
@Transactional
public AssetTraceJpaEntity updateAsset(UUID id, UpdateAssetRequest request) {
    // Find existing
    AssetTraceJpaEntity asset = assetRepo.findById(id);
    if (asset == null) {
        throw new NotFoundException("Asset not found: " + id);
    }

    // Capture before state for audit
    Map<String, Object> beforeState = captureState(asset);

    // Update fields
    asset.setStatus(request.status());
    asset.setCurrentOwnerId(request.ownerId());
    asset.setCurrentLocation(request.location());
    asset.setUpdatedBy(request.userId());

    // updated_at is set automatically by @PreUpdate

    // Create audit trail
    createAuditEntry(asset, "ASSET_UPDATED", beforeState, captureState(asset));

    return asset;
}
```

#### Transfer Ownership

```java
@Transactional
public OwnershipRecordJpaEntity transferOwnership(TransferRequest request) {
    // Find asset
    AssetTraceJpaEntity asset = assetRepo.findByAssetId(request.assetId())
        .orElseThrow(() -> new NotFoundException("Asset not found"));

    // Create ownership record
    OwnershipRecordJpaEntity ownership = new OwnershipRecordJpaEntity();
    ownership.setAsset(asset);
    ownership.setFromOwnerId(asset.getCurrentOwnerId());
    ownership.setToOwnerId(request.toOwnerId());
    ownership.setTransferDate(Instant.now());
    ownership.setTransferType(request.transferType());
    ownership.setTransferPrice(request.price());
    ownership.setStatus("PENDING");
    ownership.setCreatedBy(request.userId());

    // Persist ownership record
    ownershipRepo.persist(ownership);

    // Update asset owner
    asset.setCurrentOwnerId(request.toOwnerId());

    // Create audit trail
    createAuditEntry(asset, "OWNERSHIP_TRANSFERRED");

    return ownership;
}
```

#### Archive Asset

```java
@Transactional
public void archiveAsset(UUID id, String userId) {
    // Use repository method
    boolean archived = assetRepo.archiveAsset(id);

    if (!archived) {
        throw new NotFoundException("Asset not found: " + id);
    }

    // Create audit trail
    AssetTraceJpaEntity asset = assetRepo.findById(id);
    createAuditEntry(asset, "ASSET_ARCHIVED");
}
```

---

### Step 3: Implement Audit Trail

```java
@Inject
AuditTrailRepository auditRepo;

@Transactional
private void createAuditEntry(
        AssetTraceJpaEntity asset,
        String actionType) {
    createAuditEntry(asset, actionType, null, null);
}

@Transactional
private void createAuditEntry(
        AssetTraceJpaEntity asset,
        String actionType,
        Map<String, Object> beforeState,
        Map<String, Object> afterState) {

    AuditTrailEntryJpaEntity audit = new AuditTrailEntryJpaEntity();
    audit.setAsset(asset);
    audit.setEntityType("ASSET");
    audit.setEntityId(asset.getAssetId());
    audit.setActionType(actionType);
    audit.setActionDescription(generateDescription(actionType, asset));
    audit.setUserId(getCurrentUserId());
    audit.setUserName(getCurrentUserName());
    audit.setIpAddress(getCurrentIpAddress());
    audit.setBeforeState(beforeState);
    audit.setAfterState(afterState);
    audit.setSuccess(true);
    audit.setTenantId(asset.getTenantId());

    // Persist (append-only)
    auditRepo.persist(audit);
}

private Map<String, Object> captureState(AssetTraceJpaEntity asset) {
    return Map.of(
        "assetId", asset.getAssetId(),
        "status", asset.getStatus(),
        "ownerId", asset.getCurrentOwnerId(),
        "location", asset.getCurrentLocation(),
        "updatedAt", asset.getUpdatedAt()
    );
}
```

---

### Step 4: Update REST Endpoints

#### Asset Resource

```java
@Path("/api/v11/assets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AssetResource {

    @Inject
    AssetTraceabilityService assetService;

    @GET
    @Path("/{assetId}")
    public Response getAsset(@PathParam("assetId") String assetId) {
        AssetTraceJpaEntity asset = assetService.getAsset(assetId);
        return Response.ok(toDTO(asset)).build();
    }

    @GET
    public Response listAssets(
            @QueryParam("type") String type,
            @QueryParam("status") String status,
            @QueryParam("ownerId") String ownerId,
            @QueryParam("location") String location,
            @QueryParam("archived") @DefaultValue("false") Boolean archived,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        List<AssetTraceJpaEntity> assets = assetService.searchAssets(
            type, status, ownerId, location, archived, page, size);

        return Response.ok(assets.stream()
            .map(this::toDTO)
            .toList()).build();
    }

    @POST
    public Response createAsset(CreateAssetRequest request) {
        AssetTraceJpaEntity asset = assetService.createAsset(request);
        return Response.status(201).entity(toDTO(asset)).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateAsset(
            @PathParam("id") UUID id,
            UpdateAssetRequest request) {
        AssetTraceJpaEntity asset = assetService.updateAsset(id, request);
        return Response.ok(toDTO(asset)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response archiveAsset(@PathParam("id") UUID id) {
        assetService.archiveAsset(id, getCurrentUserId());
        return Response.noContent().build();
    }

    @POST
    @Path("/{assetId}/transfer")
    public Response transferOwnership(
            @PathParam("assetId") String assetId,
            TransferRequest request) {
        request.setAssetId(assetId);
        OwnershipRecordJpaEntity ownership = assetService.transferOwnership(request);
        return Response.status(201).entity(toOwnershipDTO(ownership)).build();
    }

    @GET
    @Path("/{assetId}/ownership-history")
    public Response getOwnershipHistory(@PathParam("assetId") String assetId) {
        List<OwnershipRecordJpaEntity> history = assetService.getOwnershipHistory(assetId);
        return Response.ok(history.stream()
            .map(this::toOwnershipDTO)
            .toList()).build();
    }

    @GET
    @Path("/{assetId}/audit-trail")
    public Response getAuditTrail(@PathParam("assetId") String assetId) {
        List<AuditTrailEntryJpaEntity> trail = assetService.getAuditTrail(assetId);
        return Response.ok(trail.stream()
            .map(this::toAuditDTO)
            .toList()).build();
    }
}
```

---

### Step 5: DTO Mapping

Create DTOs to decouple entities from API responses.

```java
public record AssetDTO(
    UUID id,
    String assetId,
    String assetType,
    String assetName,
    String description,
    String status,
    String currentOwnerId,
    String currentLocation,
    BigDecimal latitude,
    BigDecimal longitude,
    Boolean chainOfCustodyVerified,
    String complianceStatus,
    Map<String, Object> customAttributes,
    Instant createdAt,
    Instant updatedAt
) {
    public static AssetDTO from(AssetTraceJpaEntity entity) {
        return new AssetDTO(
            entity.getId(),
            entity.getAssetId(),
            entity.getAssetType(),
            entity.getAssetName(),
            entity.getDescription(),
            entity.getStatus(),
            entity.getCurrentOwnerId(),
            entity.getCurrentLocation(),
            entity.getLatitude(),
            entity.getLongitude(),
            entity.getChainOfCustodyVerified(),
            entity.getComplianceStatus(),
            entity.getCustomAttributes(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
```

---

### Step 6: Exception Handling

```java
@Provider
public class EntityNotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {

    @Override
    public Response toResponse(NotFoundException exception) {
        return Response.status(404)
            .entity(Map.of(
                "error", "NOT_FOUND",
                "message", exception.getMessage(),
                "timestamp", Instant.now()
            ))
            .build();
    }
}

@Provider
public class ConstraintViolationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        List<String> violations = exception.getConstraintViolations().stream()
            .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
            .toList();

        return Response.status(400)
            .entity(Map.of(
                "error", "VALIDATION_ERROR",
                "violations", violations,
                "timestamp", Instant.now()
            ))
            .build();
    }
}
```

---

### Step 7: Pagination Support

```java
public List<AssetTraceJpaEntity> searchAssets(
        String type, String status, String ownerId,
        String location, Boolean archived,
        int page, int size) {

    // Use Panache pagination
    return assetRepo.searchAssets(type, status, ownerId, location, archived)
        .page(page, size)
        .list();
}

// Advanced pagination with total count
public PaginatedResponse<AssetDTO> searchAssetsPaginated(
        String type, String status, String ownerId,
        String location, Boolean archived,
        int page, int size) {

    // Get paginated results
    List<AssetTraceJpaEntity> assets = assetRepo
        .searchAssets(type, status, ownerId, location, archived)
        .page(page, size)
        .list();

    // Get total count
    long total = assetRepo.countBySearchCriteria(type, status, ownerId, location, archived);

    return new PaginatedResponse<>(
        assets.stream().map(AssetDTO::from).toList(),
        page,
        size,
        total,
        (int) Math.ceil((double) total / size)
    );
}
```

---

### Step 8: Transaction Management

**Important**: Always use `@Transactional` for write operations.

```java
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AssetTraceabilityService {

    @Transactional  // Required for persist/update/delete
    public AssetTraceJpaEntity createAsset(CreateAssetRequest request) {
        // ...
    }

    @Transactional
    public AssetTraceJpaEntity updateAsset(UUID id, UpdateAssetRequest request) {
        // ...
    }

    // Read operations don't need @Transactional
    public AssetTraceJpaEntity getAsset(String assetId) {
        return assetRepo.findByAssetId(assetId)
            .orElseThrow(() -> new NotFoundException("Asset not found"));
    }
}
```

---

## Smart Contract Service Integration

```java
@ApplicationScoped
public class SmartContractService {

    @Inject
    SmartContractRepository contractRepo;

    @Transactional
    public SmartContractJpaEntity registerContract(DeployContractRequest request) {
        SmartContractJpaEntity contract = new SmartContractJpaEntity();
        contract.setContractAddress(request.address());
        contract.setContractType(request.type());
        contract.setContractName(request.name());
        contract.setBlockchainNetwork(request.network());
        contract.setAbi(request.abi());
        contract.setBytecode(request.bytecode());
        contract.setDeploymentTxHash(request.txHash());
        contract.setDeployedAt(Instant.now());
        contract.setOwnerId(request.ownerId());
        contract.setStatus("DEPLOYED");

        contractRepo.persist(contract);
        return contract;
    }

    @Transactional
    public void verifyContract(UUID id, String verifiedBy) {
        SmartContractJpaEntity contract = contractRepo.findById(id);
        if (contract == null) {
            throw new NotFoundException("Contract not found");
        }

        contract.setVerified(true);
        contract.setVerifiedAt(Instant.now());
        contract.setVerifiedBy(verifiedBy);
        contract.setStatus("VERIFIED");
    }
}
```

---

## Compliance Service Integration

```java
@ApplicationScoped
public class ComplianceService {

    @Inject
    ComplianceCertificationRepository certRepo;

    @Transactional
    public ComplianceCertificationJpaEntity issueCertificate(
            IssueCertificateRequest request) {

        ComplianceCertificationJpaEntity cert = new ComplianceCertificationJpaEntity();
        cert.setCertificateId(generateCertificateId());
        cert.setComplianceLevel(request.level());
        cert.setCertificationType(request.type());
        cert.setEntityId(request.entityId());
        cert.setEntityType(request.entityType());
        cert.setStatus("PENDING");
        cert.setRegulatoryFramework(request.framework());
        cert.setIssuerId(request.issuerId());
        cert.setIssuedAt(Instant.now());
        cert.setExpiresAt(calculateExpiryDate(request.level()));
        cert.setRenewable(true);

        certRepo.persist(cert);
        return cert;
    }

    @Transactional
    public void verifyCertificate(UUID id, String verifiedBy) {
        ComplianceCertificationJpaEntity cert = certRepo.findById(id);
        if (cert == null) {
            throw new NotFoundException("Certificate not found");
        }

        cert.setVerified(true);
        cert.setVerifiedAt(Instant.now());
        cert.setVerifiedBy(verifiedBy);
        cert.setStatus("ACTIVE");
    }

    public List<ComplianceCertificationJpaEntity> getExpiringSoon(int days) {
        return certRepo.findExpiringSoon(days);
    }
}
```

---

## Testing

### Integration Test Example

```java
@QuarkusTest
public class AssetTraceabilityServiceTest {

    @Inject
    AssetTraceabilityService assetService;

    @Inject
    AssetTraceRepository assetRepo;

    @Test
    @Transactional
    public void testCreateAsset() {
        // Given
        CreateAssetRequest request = new CreateAssetRequest(
            "ASSET-TEST-001",
            "PHARMACEUTICAL",
            "Test Drug",
            "Test Description",
            "USER-123",
            "TENANT-001"
        );

        // When
        AssetTraceJpaEntity asset = assetService.createAsset(request);

        // Then
        assertNotNull(asset.getId());
        assertEquals("ASSET-TEST-001", asset.getAssetId());
        assertEquals("PHARMACEUTICAL", asset.getAssetType());
        assertEquals("CREATED", asset.getStatus());
        assertNotNull(asset.getCreatedAt());
    }

    @Test
    @Transactional
    public void testTransferOwnership() {
        // Given
        AssetTraceJpaEntity asset = createTestAsset();
        TransferRequest request = new TransferRequest(
            asset.getAssetId(),
            "NEW-OWNER-001",
            "SALE",
            BigDecimal.valueOf(1000.00),
            "USD",
            "USER-123"
        );

        // When
        OwnershipRecordJpaEntity ownership = assetService.transferOwnership(request);

        // Then
        assertNotNull(ownership.getId());
        assertEquals(asset.getId(), ownership.getAsset().getId());
        assertEquals("NEW-OWNER-001", ownership.getToOwnerId());
        assertEquals("PENDING", ownership.getStatus());

        // Verify asset updated
        AssetTraceJpaEntity updatedAsset = assetRepo.findById(asset.getId());
        assertEquals("NEW-OWNER-001", updatedAsset.getCurrentOwnerId());
    }
}
```

---

## Performance Tips

1. **Use Lazy Loading**: Avoid N+1 queries
   ```java
   @ManyToOne(fetch = FetchType.LAZY)  // Default for @ManyToOne
   ```

2. **Batch Operations**: Use `persist(List<>)` for bulk inserts

3. **Projection**: Fetch only needed columns
   ```java
   assetRepo.find("SELECT a.assetId, a.status FROM AssetTraceJpaEntity a")
   ```

4. **Connection Pooling**: Configure in application.properties
   ```properties
   quarkus.datasource.jdbc.max-size=20
   quarkus.datasource.jdbc.min-size=5
   ```

5. **Caching**: Use Quarkus cache for hot data
   ```java
   @CacheResult(cacheName = "asset-cache")
   public AssetTraceJpaEntity getAsset(String assetId) {
       // ...
   }
   ```

---

## Migration Checklist

- [ ] Replace in-memory storage with repository injection
- [ ] Add `@Transactional` to write operations
- [ ] Implement audit trail for all state changes
- [ ] Create DTOs for API responses
- [ ] Update REST endpoints to use repositories
- [ ] Add pagination support
- [ ] Implement exception handling
- [ ] Write integration tests
- [ ] Update API documentation (OpenAPI)
- [ ] Performance testing with database

---

## Next Steps

1. **agent-api**: Update Asset Traceability endpoints
2. **agent-contract**: Update Smart Contract registry
3. **agent-compliance**: Update Compliance certification
4. **agent-analytics**: Create reporting queries
5. **agent-test**: Add database integration tests

---

**End of Document**
