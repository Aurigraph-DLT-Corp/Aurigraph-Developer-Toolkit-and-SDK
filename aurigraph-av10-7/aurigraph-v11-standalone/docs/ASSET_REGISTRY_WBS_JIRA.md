# Asset Registry - WBS and JIRA Tickets

**Feature**: Asset Registry System for Tokenization Platform
**Version**: 12.0.0
**Date**: December 11, 2025
**Epic**: AV12-ASSET-REGISTRY

---

## Epic Summary

The Asset Registry is a core component of the Aurigraph V12 tokenization platform that enables users to register, manage, and track real-world assets through their complete lifecycle from registration to tokenization and sale.

---

## JIRA Epic

### AV12-ASSET-REGISTRY: Asset Registry System

**Type**: Epic
**Priority**: P0 - Critical
**Labels**: `asset-registry`, `tokenization`, `v12`, `backend`, `frontend`
**Sprint**: Sprint 14

**Description**:
Implement a comprehensive Asset Registry system that allows users to:
- Register assets across 12 supported categories
- Track asset lifecycle from draft to sold
- Link assets to tokenization and smart contracts
- Search and discover registered assets
- Manage asset metadata and documentation

---

## JIRA Stories

### AV12-AR-001: Create RegisteredAsset Entity and Enums
**Type**: Story
**Priority**: P0
**Story Points**: 5
**Component**: Backend

**Description**:
Create the core `RegisteredAsset` JPA entity with Panache integration, including:
- AssetCategory enum (12 categories)
- AssetStatus enum (6 statuses)
- Entity fields with proper annotations
- JSONB metadata support

**Acceptance Criteria**:
- [ ] RegisteredAsset entity with UUID primary key
- [ ] AssetCategory enum with 12 categories
- [ ] AssetStatus enum (DRAFT, SUBMITTED, VERIFIED, LISTED, SOLD, ARCHIVED)
- [ ] Panache entity integration
- [ ] Proper JPA annotations

**Files**:
- `src/main/java/io/aurigraph/v11/registry/RegisteredAsset.java`
- `src/main/java/io/aurigraph/v11/registry/AssetCategory.java`
- `src/main/java/io/aurigraph/v11/registry/AssetStatus.java`

---

### AV12-AR-002: Create Flyway Migration for registered_assets Table
**Type**: Story
**Priority**: P0
**Story Points**: 3
**Component**: Database

**Description**:
Create Flyway migration V16 to create the registered_assets table with:
- All required columns
- Proper indexes for performance
- Category and status enums
- JSONB metadata column

**Acceptance Criteria**:
- [ ] Migration V16 creates registered_assets table
- [ ] Indexes on category, status, owner_id, created_at
- [ ] JSONB column for metadata
- [ ] Proper constraints and defaults

**Files**:
- `src/main/resources/db/migration/V16__Create_Registered_Assets_Table.sql`

---

### AV12-AR-003: Implement AssetRegistryService
**Type**: Story
**Priority**: P0
**Story Points**: 8
**Component**: Backend

**Description**:
Create the AssetRegistryService with core CRUD operations:
- registerAsset() - Create new asset
- updateAsset() - Update existing asset
- getAsset() - Retrieve by ID
- listAssets() - Query with filters
- deleteAsset() - Soft delete
- searchAssets() - Full-text search

**Acceptance Criteria**:
- [ ] All CRUD operations implemented
- [ ] Validation for required fields per category
- [ ] Audit logging for all operations
- [ ] Transaction support
- [ ] Error handling

**Files**:
- `src/main/java/io/aurigraph/v11/registry/AssetRegistryService.java`

---

### AV12-AR-004: Create AssetRegistryResource REST API
**Type**: Story
**Priority**: P0
**Story Points**: 5
**Component**: Backend

**Description**:
Create REST API endpoints for Asset Registry:
- POST /api/v11/registry/assets - Register asset
- GET /api/v11/registry/assets/{id} - Get by ID
- PUT /api/v11/registry/assets/{id} - Update
- DELETE /api/v11/registry/assets/{id} - Delete
- GET /api/v11/registry/assets - List with filters
- GET /api/v11/registry/categories - List categories

**Acceptance Criteria**:
- [ ] All endpoints implemented
- [ ] OpenAPI documentation
- [ ] Request/Response DTOs
- [ ] Input validation
- [ ] Proper HTTP status codes

**Files**:
- `src/main/java/io/aurigraph/v11/registry/AssetRegistryResource.java`
- `src/main/java/io/aurigraph/v11/registry/dto/AssetRegistrationRequest.java`
- `src/main/java/io/aurigraph/v11/registry/dto/AssetRegistrationResponse.java`

---

### AV12-AR-005: Implement AssetLifecycleService
**Type**: Story
**Priority**: P1
**Story Points**: 5
**Component**: Backend

**Description**:
Create lifecycle management service:
- submitForVerification() - DRAFT -> SUBMITTED
- markVerified() - SUBMITTED -> VERIFIED
- listForSale() - VERIFIED -> LISTED
- markSold() - LISTED -> SOLD
- archive() - Any -> ARCHIVED

**Acceptance Criteria**:
- [ ] All status transitions implemented
- [ ] Validation of allowed transitions
- [ ] Status history tracking
- [ ] Event emission for status changes

**Files**:
- `src/main/java/io/aurigraph/v11/registry/AssetLifecycleService.java`
- `src/main/java/io/aurigraph/v11/registry/AssetStatusHistory.java`

---

### AV12-AR-006: Create Asset Registration UI Components
**Type**: Story
**Priority**: P1
**Story Points**: 8
**Component**: Frontend

**Description**:
Create React components for asset registration:
- AssetRegistrationWizard (5 steps)
- CategorySelector
- AssetDetailsForm
- DocumentUploader
- ReviewAndSubmit

**Acceptance Criteria**:
- [ ] Multi-step wizard component
- [ ] Category-specific form fields
- [ ] Document upload integration
- [ ] Form validation
- [ ] Progress indicator

**Files**:
- `frontend/src/components/registry/AssetRegistrationWizard.tsx`
- `frontend/src/components/registry/CategorySelector.tsx`
- `frontend/src/components/registry/AssetDetailsForm.tsx`

---

### AV12-AR-007: Create Asset Management Dashboard UI
**Type**: Story
**Priority**: P1
**Story Points**: 5
**Component**: Frontend

**Description**:
Create dashboard for managing user's assets:
- MyAssetsList component
- AssetDetailView component
- StatusBadge component
- AssetActions (edit, delete, submit)

**Acceptance Criteria**:
- [ ] List view with filtering
- [ ] Detail view with all asset info
- [ ] Status badges and progress
- [ ] Action buttons

**Files**:
- `frontend/src/components/registry/MyAssetsList.tsx`
- `frontend/src/components/registry/AssetDetailView.tsx`

---

### AV12-AR-008: Unit and Integration Tests
**Type**: Story
**Priority**: P1
**Story Points**: 5
**Component**: Testing

**Description**:
Create comprehensive test suite:
- Unit tests for AssetRegistryService
- Integration tests for REST API
- E2E tests for registration flow

**Acceptance Criteria**:
- [ ] 95% code coverage for service
- [ ] All endpoints tested
- [ ] Error cases covered

**Files**:
- `src/test/java/io/aurigraph/v11/registry/AssetRegistryServiceTest.java`
- `src/test/java/io/aurigraph/v11/registry/AssetRegistryResourceTest.java`

---

### AV12-AR-009: API Documentation
**Type**: Story
**Priority**: P2
**Story Points**: 2
**Component**: Documentation

**Description**:
Create comprehensive API documentation:
- OpenAPI/Swagger annotations
- Usage examples
- Error codes documentation

**Acceptance Criteria**:
- [ ] All endpoints documented
- [ ] Request/Response examples
- [ ] Error codes explained

---

## WBS Summary Table

| ID | Story | Points | Priority | Component |
|----|-------|--------|----------|-----------|
| AV12-AR-001 | Create RegisteredAsset Entity | 5 | P0 | Backend |
| AV12-AR-002 | Create Flyway Migration | 3 | P0 | Database |
| AV12-AR-003 | Implement AssetRegistryService | 8 | P0 | Backend |
| AV12-AR-004 | Create REST API | 5 | P0 | Backend |
| AV12-AR-005 | Implement Lifecycle Service | 5 | P1 | Backend |
| AV12-AR-006 | Asset Registration UI | 8 | P1 | Frontend |
| AV12-AR-007 | Asset Dashboard UI | 5 | P1 | Frontend |
| AV12-AR-008 | Tests | 5 | P1 | Testing |
| AV12-AR-009 | Documentation | 2 | P2 | Docs |
| **TOTAL** | | **46** | | |

---

## Dependencies

- File Attachments (V15) - For document upload
- Contract Library - For smart contract templates
- User Authentication - For owner tracking

## Implementation Order

1. AV12-AR-001 + AV12-AR-002 (Entity + Migration)
2. AV12-AR-003 (Service)
3. AV12-AR-004 (REST API)
4. AV12-AR-005 (Lifecycle)
5. AV12-AR-006 + AV12-AR-007 (Frontend) - Can be parallel
6. AV12-AR-008 (Tests)
7. AV12-AR-009 (Documentation)

---

**Created**: December 11, 2025
**Author**: J4C Development Agent
