# WBS: File Attachment Storage with Transaction ID and Hashing

## Project Overview
Implement secure file attachment storage for the Tokenize Asset demo with:
- Filesystem storage organized by transaction ID
- SHA256 hash generation and verification
- Full audit trail linking files to blockchain transactions

---

## Work Breakdown Structure

### 1.0 Backend Implementation (Java/Quarkus)
**Estimated: 3-4 days**

#### 1.1 Data Model & Entity
- [ ] 1.1.1 Create `FileAttachment` JPA entity
- [ ] 1.1.2 Create `FileAttachmentRepository` (Panache)
- [ ] 1.1.3 Add Flyway migration for `file_attachments` table
- [ ] 1.1.4 Define indexes (transaction_id, hash, token_id)

#### 1.2 Hash Generation Service
- [ ] 1.2.1 Create `FileHashService` with SHA256 implementation
- [ ] 1.2.2 Add streaming hash calculation for large files
- [ ] 1.2.3 Add hash verification method
- [ ] 1.2.4 Unit tests for hash service

#### 1.3 Enhanced Upload Endpoints
- [ ] 1.3.1 Modify `FileUploadResource` to accept transaction ID
- [ ] 1.3.2 Add hash calculation on upload
- [ ] 1.3.3 Store metadata in database
- [ ] 1.3.4 Return hash in response
- [ ] 1.3.5 Create transaction-based directory structure: `data/attachments/{transactionId}/`

#### 1.4 New API Endpoints
- [ ] 1.4.1 `POST /api/v11/attachments/{transactionId}` - Upload with transaction link
- [ ] 1.4.2 `GET /api/v11/attachments/transaction/{transactionId}` - List by transaction
- [ ] 1.4.3 `GET /api/v11/attachments/{fileId}` - Get file metadata
- [ ] 1.4.4 `POST /api/v11/attachments/{fileId}/verify` - Verify hash integrity
- [ ] 1.4.5 `GET /api/v11/attachments/{fileId}/download` - Download file
- [ ] 1.4.6 `DELETE /api/v11/attachments/{fileId}` - Delete (soft delete)

#### 1.5 Integration with Token Service
- [ ] 1.5.1 Link attachments to token creation flow
- [ ] 1.5.2 Add attachment hashes to token metadata
- [ ] 1.5.3 Update `RWAApiResource` for attachment support

---

### 2.0 Frontend Implementation (React/TypeScript)
**Estimated: 2-3 days**

#### 2.1 Upload Component Enhancement
- [ ] 2.1.1 Add client-side SHA256 hash calculation (crypto-js)
- [ ] 2.1.2 Show hash preview before upload
- [ ] 2.1.3 Add progress bar for large file uploads
- [ ] 2.1.4 Add transaction ID field binding

#### 2.2 TokenizeAsset.tsx Updates
- [ ] 2.2.1 Integrate new attachment upload API
- [ ] 2.2.2 Store file hashes in form state
- [ ] 2.2.3 Display uploaded file hashes in UI
- [ ] 2.2.4 Add hash verification button

#### 2.3 API Service Updates
- [ ] 2.3.1 Add `uploadAttachment(transactionId, file)` method
- [ ] 2.3.2 Add `getAttachmentsByTransaction(transactionId)` method
- [ ] 2.3.3 Add `verifyAttachment(fileId)` method
- [ ] 2.3.4 Add proper error handling for 401/403

#### 2.4 UI/UX Improvements
- [ ] 2.4.1 File list with hash display
- [ ] 2.4.2 Verification status indicator
- [ ] 2.4.3 Download button with hash check
- [ ] 2.4.4 Error toast notifications

---

### 3.0 Database Schema
**Estimated: 0.5 days**

```sql
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(64) NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(66),  -- blockchain tx hash
    token_id VARCHAR(66),        -- optional token reference
    category VARCHAR(50) DEFAULT 'documents',
    file_size BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions(tx_hash) ON DELETE SET NULL
);

CREATE INDEX idx_attachments_transaction ON file_attachments(transaction_id);
CREATE INDEX idx_attachments_token ON file_attachments(token_id);
CREATE INDEX idx_attachments_hash ON file_attachments(sha256_hash);
CREATE INDEX idx_attachments_uploaded ON file_attachments(uploaded_at);
```

---

### 4.0 Testing
**Estimated: 1-2 days**

#### 4.1 Backend Tests
- [ ] 4.1.1 Unit tests for `FileHashService`
- [ ] 4.1.2 Unit tests for `FileAttachmentRepository`
- [ ] 4.1.3 Integration tests for upload endpoints
- [ ] 4.1.4 Integration tests for verification endpoint

#### 4.2 Frontend Tests
- [ ] 4.2.1 Component tests for file upload
- [ ] 4.2.2 API service mock tests
- [ ] 4.2.3 E2E test for full upload flow

#### 4.3 Security Tests
- [ ] 4.3.1 Path traversal attack prevention
- [ ] 4.3.2 File type validation bypass
- [ ] 4.3.3 Size limit enforcement
- [ ] 4.3.4 Hash collision resistance

---

### 5.0 Documentation
**Estimated: 0.5 days**

- [ ] 5.1 API documentation (OpenAPI/Swagger)
- [ ] 5.2 Developer guide for attachment handling
- [ ] 5.3 User guide for file uploads
- [ ] 5.4 Security considerations document

---

## Summary

| Phase | Tasks | Est. Days |
|-------|-------|-----------|
| 1.0 Backend | 19 tasks | 3-4 |
| 2.0 Frontend | 14 tasks | 2-3 |
| 3.0 Database | 1 task | 0.5 |
| 4.0 Testing | 10 tasks | 1-2 |
| 5.0 Documentation | 4 tasks | 0.5 |
| **Total** | **48 tasks** | **7-10 days** |

---

## Dependencies

1. PostgreSQL database access
2. Filesystem write permissions on server
3. crypto-js npm package for frontend hashing
4. Java MessageDigest for backend hashing

## Risk Factors

- Large file handling (>100MB)
- Concurrent upload race conditions
- Storage space monitoring
- Hash calculation performance on large files
