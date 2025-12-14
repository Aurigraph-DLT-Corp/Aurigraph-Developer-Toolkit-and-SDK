# Aurigraph V12 Architecture Diagrams

**Version**: 12.0.0
**Date**: December 12, 2025
**Author**: J4C Architecture Agent
**Status**: Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Backend Services Architecture](#2-backend-services-architecture)
3. [File Storage & CDN Architecture](#3-file-storage--cdn-architecture)
4. [Asset Tokenization Flow](#4-asset-tokenization-flow)
5. [External Verification Integration](#5-external-verification-integration)
6. [Database Schema (ER Diagram)](#6-database-schema-er-diagram)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Infrastructure Deployment](#8-infrastructure-deployment)
9. [Security Architecture](#9-security-architecture)

---

## 1. System Overview

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[React Frontend<br/>Enterprise Portal]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end

    subgraph "Gateway Layer"
        NGINX[Nginx<br/>Load Balancer]
        CDN_PROXY[CDN Proxy<br/>/cdn/*]
    end

    subgraph "Application Layer"
        QUARKUS[Quarkus Backend<br/>Port 9003]
        GRPC[gRPC Server<br/>Port 9001]
    end

    subgraph "Service Layer"
        TOKEN[Token Service]
        ASSET[Asset Registry<br/>Service]
        FILE[File Attachment<br/>Service]
        VERIFY[Verification<br/>Service]
        CONTRACT[Smart Contract<br/>Library]
        REFERRAL[Referral<br/>Service]
    end

    subgraph "Storage Layer"
        PG[(PostgreSQL<br/>j4c_db)]
        MINIO[MinIO<br/>Object Storage]
        REDIS[(Redis Cache)]
    end

    subgraph "External Services"
        IAM[Keycloak IAM<br/>iam2.aurigraph.io]
        LAND[Land Registry<br/>Adapter]
        KYC[KYC Verification<br/>Adapter]
        VVB[VVB Verification<br/>Adapter]
    end

    WEB --> NGINX
    MOBILE --> NGINX
    API_CLIENT --> NGINX

    NGINX --> QUARKUS
    NGINX --> CDN_PROXY
    CDN_PROXY --> MINIO

    QUARKUS --> TOKEN
    QUARKUS --> ASSET
    QUARKUS --> FILE
    QUARKUS --> VERIFY
    QUARKUS --> CONTRACT
    QUARKUS --> REFERRAL

    TOKEN --> PG
    ASSET --> PG
    FILE --> PG
    FILE --> MINIO
    CONTRACT --> PG
    REFERRAL --> PG

    VERIFY --> LAND
    VERIFY --> KYC
    VERIFY --> VVB

    QUARKUS --> IAM
    QUARKUS --> REDIS

    classDef storage fill:#e1f5fe,stroke:#01579b
    classDef service fill:#e8f5e9,stroke:#2e7d32
    classDef external fill:#fff3e0,stroke:#e65100
    classDef gateway fill:#f3e5f5,stroke:#7b1fa2

    class PG,MINIO,REDIS storage
    class TOKEN,ASSET,FILE,VERIFY,CONTRACT,REFERRAL service
    class IAM,LAND,KYC,VVB external
    class NGINX,CDN_PROXY gateway
```

### 1.2 Component Summary

| Component | Technology | Port | Description |
|-----------|------------|------|-------------|
| **Frontend** | React 18 + TypeScript | 3000 | Enterprise Portal Dashboard |
| **Backend** | Quarkus 3.29 + Java 21 | 9003 | REST API Services |
| **gRPC** | gRPC-Java | 9001 | High-performance RPC |
| **Database** | PostgreSQL 16 | 5432 | Primary Data Store |
| **Object Storage** | MinIO | 9000/9090 | File/Document Storage |
| **CDN** | Nginx | 443 | CDN Proxy at /cdn/* |
| **Cache** | Redis 7 | 6379 | Session & Query Cache |
| **IAM** | Keycloak 23 | 8080 | Identity Management |

---

## 2. Backend Services Architecture

### 2.1 Service Class Diagram

```mermaid
classDiagram
    class AurigraphResource {
        +health()
        +info()
        +performance()
    }

    class TokenResource {
        +createToken()
        +getToken()
        +listTokens()
        +burnToken()
    }

    class AssetRegistryResource {
        +registerAsset()
        +getAsset()
        +updateAssetStatus()
        +listAssets()
        +linkAttachments()
    }

    class FileAttachmentResource {
        +uploadFile()
        +downloadFile()
        +verifyHash()
        +listAttachments()
        +deleteFile()
    }

    class VerificationResource {
        +listServices()
        +verifyAsset()
        +getVerificationStatus()
        +submitManualVerification()
    }

    class SmartContractResource {
        +listContracts()
        +getContractByType()
        +createContract()
        +executeContract()
    }

    class ReferralResource {
        +createReferralCode()
        +validateCode()
        +trackReferral()
        +getReferralStats()
    }

    AurigraphResource --> TokenResource
    AurigraphResource --> AssetRegistryResource
    AssetRegistryResource --> FileAttachmentResource
    AssetRegistryResource --> VerificationResource
    TokenResource --> SmartContractResource
```

### 2.2 Service Layer Sequence

```mermaid
sequenceDiagram
    participant Client
    participant API as REST API
    participant Service as Business Service
    participant Repo as Repository
    participant DB as PostgreSQL
    participant MinIO as MinIO Storage

    Client->>API: POST /api/v11/assets/register
    API->>Service: registerAsset(dto)
    Service->>Repo: save(entity)
    Repo->>DB: INSERT INTO registered_assets
    DB-->>Repo: asset_id
    Repo-->>Service: RegisteredAsset
    Service->>MinIO: uploadAttachments()
    MinIO-->>Service: cdn_urls[]
    Service-->>API: AssetResponse
    API-->>Client: 201 Created
```

---

## 3. File Storage & CDN Architecture

### 3.1 MinIO CDN Integration

```mermaid
graph LR
    subgraph "Client"
        BROWSER[Web Browser]
        FORM[Upload Form]
    end

    subgraph "Nginx Proxy"
        NGINX[Nginx<br/>dlt.aurigraph.io]
        CDN_ROUTE[/cdn/* Route]
    end

    subgraph "MinIO Cluster"
        MINIO_API[MinIO API<br/>Port 9000]
        MINIO_CONSOLE[Console<br/>Port 9090]
        BUCKET_ATT[attachments<br/>Bucket]
        BUCKET_DOC[documents<br/>Bucket]
        BUCKET_ASSET[assets<br/>Bucket]
    end

    subgraph "Backend"
        QUARKUS[Quarkus<br/>FileAttachmentResource]
        HASH_SVC[FileHashService<br/>SHA256]
    end

    subgraph "Storage"
        DISK[/home/subbu/minio-data<br/>Persistent Volume]
    end

    BROWSER --> NGINX
    FORM --> NGINX
    NGINX --> QUARKUS
    NGINX --> CDN_ROUTE
    CDN_ROUTE --> MINIO_API

    QUARKUS --> HASH_SVC
    QUARKUS --> MINIO_API

    MINIO_API --> BUCKET_ATT
    MINIO_API --> BUCKET_DOC
    MINIO_API --> BUCKET_ASSET

    BUCKET_ATT --> DISK
    BUCKET_DOC --> DISK
    BUCKET_ASSET --> DISK

    classDef storage fill:#ffecb3,stroke:#ff6f00
    classDef service fill:#e8f5e9,stroke:#2e7d32

    class DISK,BUCKET_ATT,BUCKET_DOC,BUCKET_ASSET storage
    class QUARKUS,HASH_SVC service
```

### 3.2 File Upload Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Frontend
    participant API as FileAttachmentResource
    participant HashSvc as FileHashService
    participant MinIO as MinIO Storage
    participant DB as PostgreSQL

    User->>Frontend: Select file(s)
    Frontend->>Frontend: Calculate SHA256 (client-side)
    Frontend->>API: POST /api/v11/attachments/upload
    Note over Frontend,API: multipart/form-data<br/>file + sha256Hash + category

    API->>HashSvc: verifyHash(file, clientHash)
    HashSvc->>HashSvc: Calculate SHA256
    HashSvc-->>API: hashMatch: true/false

    alt Hash Mismatch
        API-->>Frontend: 400 Bad Request
    else Hash Match
        API->>MinIO: putObject(bucket, file)
        MinIO-->>API: cdn_url
        API->>DB: INSERT file_attachment
        DB-->>API: attachment_id
        API-->>Frontend: 201 Created<br/>{fileId, cdnUrl, sha256Hash}
    end

    Frontend-->>User: Upload Success
```

### 3.3 CDN URL Structure

```
Production CDN URLs:
├── https://dlt.aurigraph.io/cdn/attachments/{hash}_{filename}
├── https://dlt.aurigraph.io/cdn/documents/{hash}_{filename}
└── https://dlt.aurigraph.io/cdn/assets/{hash}_{filename}

MinIO Internal URLs:
├── http://localhost:9000/attachments/{hash}_{filename}
├── http://localhost:9000/documents/{hash}_{filename}
└── http://localhost:9000/assets/{hash}_{filename}
```

---

## 4. Asset Tokenization Flow

### 4.1 Complete Tokenization Process

```mermaid
flowchart TB
    subgraph "Phase 1: Asset Registration"
        A1[User Submits<br/>Asset Details] --> A2[Upload Supporting<br/>Documents]
        A2 --> A3[SHA256 Hash<br/>Verification]
        A3 --> A4[Store in MinIO<br/>+ PostgreSQL]
        A4 --> A5[Asset Registered<br/>Status: PENDING]
    end

    subgraph "Phase 2: Verification"
        A5 --> B1{Verification<br/>Type?}
        B1 -->|Real Estate| B2[Land Registry<br/>Adapter]
        B1 -->|KYC Required| B3[KYC Verification<br/>Adapter]
        B1 -->|Carbon Credit| B4[VVB Verification<br/>Adapter]
        B1 -->|Demo/Manual| B5[Manual Verification<br/>Adapter]

        B2 --> B6[External API Call]
        B3 --> B6
        B4 --> B6
        B5 --> B7[Admin Approval]

        B6 --> B8{Verified?}
        B7 --> B8
        B8 -->|Yes| B9[Status: VERIFIED]
        B8 -->|No| B10[Status: REJECTED]
    end

    subgraph "Phase 3: Tokenization"
        B9 --> C1[Select Contract<br/>Template]
        C1 --> C2[Configure Token<br/>Parameters]
        C2 --> C3[Generate<br/>Blockchain TX]
        C3 --> C4[Mint Token]
        C4 --> C5[Token Created<br/>Status: ACTIVE]
    end

    subgraph "Phase 4: Trading"
        C5 --> D1[List on<br/>Marketplace]
        D1 --> D2[Fractional<br/>Ownership]
        D2 --> D3[Secondary<br/>Trading]
    end

    classDef phase1 fill:#e3f2fd,stroke:#1565c0
    classDef phase2 fill:#e8f5e9,stroke:#2e7d32
    classDef phase3 fill:#fff3e0,stroke:#e65100
    classDef phase4 fill:#f3e5f5,stroke:#7b1fa2

    class A1,A2,A3,A4,A5 phase1
    class B1,B2,B3,B4,B5,B6,B7,B8,B9,B10 phase2
    class C1,C2,C3,C4,C5 phase3
    class D1,D2,D3 phase4
```

### 4.2 Asset Categories (12 Types)

```mermaid
mindmap
  root((Asset<br/>Categories))
    Real Estate
      Commercial Property
      Residential Property
      Land
    Financial
      Bonds
      Securities
      Receivables
    Physical
      Commodities
      Art & Collectibles
      Vehicles
    Environmental
      Carbon Credits
      Renewable Energy
      Water Rights
```

---

## 5. External Verification Integration

### 5.1 Verification Adapter Architecture

```mermaid
graph TB
    subgraph "Verification Service"
        VS[VerificationService]
        FACTORY[AdapterFactory]
    end

    subgraph "Adapters"
        LAND[LandRegistryAdapter]
        KYC[KYCVerificationAdapter]
        VVB[VVBVerificationAdapter]
        MANUAL[ManualVerificationAdapter]
    end

    subgraph "External Systems"
        LAND_API[Land Registry API<br/>Govt. Database]
        KYC_API[KYC Provider<br/>Identity Verification]
        VVB_API[VVB Registry<br/>Carbon Standards]
        ADMIN[Admin Dashboard<br/>Manual Review]
    end

    VS --> FACTORY
    FACTORY --> LAND
    FACTORY --> KYC
    FACTORY --> VVB
    FACTORY --> MANUAL

    LAND --> LAND_API
    KYC --> KYC_API
    VVB --> VVB_API
    MANUAL --> ADMIN

    classDef adapter fill:#e1f5fe,stroke:#01579b
    classDef external fill:#fff3e0,stroke:#e65100

    class LAND,KYC,VVB,MANUAL adapter
    class LAND_API,KYC_API,VVB_API,ADMIN external
```

### 5.2 Verification Sequence

```mermaid
sequenceDiagram
    participant Client
    participant API as VerificationResource
    participant Service as VerificationService
    participant Factory as AdapterFactory
    participant Adapter as ExternalAdapter
    participant External as External System

    Client->>API: POST /api/v11/verification/verify
    Note over Client,API: {assetId, verificationType, documents[]}

    API->>Service: verifyAsset(request)
    Service->>Factory: getAdapter(verificationType)
    Factory-->>Service: ConcreteAdapter

    Service->>Adapter: verify(asset, documents)
    Adapter->>External: API Call / Webhook
    External-->>Adapter: VerificationResult

    alt Verification Success
        Adapter-->>Service: VERIFIED
        Service->>Service: updateAssetStatus(VERIFIED)
    else Verification Failed
        Adapter-->>Service: REJECTED + reason
        Service->>Service: updateAssetStatus(REJECTED)
    else Pending Review
        Adapter-->>Service: PENDING_REVIEW
        Service->>Service: queueForManualReview()
    end

    Service-->>API: VerificationResponse
    API-->>Client: {status, verificationId, details}
```

---

## 6. Database Schema (ER Diagram)

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    REGISTERED_ASSETS ||--o{ FILE_ATTACHMENTS : "has many"
    REGISTERED_ASSETS ||--o{ ASSET_VERIFICATIONS : "has many"
    TOKENS ||--o{ REGISTERED_ASSETS : "tokenizes"
    USERS ||--o{ REGISTERED_ASSETS : "owns"
    USERS ||--o{ REFERRALS : "creates"
    SMART_CONTRACTS ||--o{ TOKENS : "governs"

    REGISTERED_ASSETS {
        uuid id PK
        string asset_id UK
        string category
        string asset_name
        text description
        string owner_id FK
        string status
        jsonb metadata
        jsonb valuation
        timestamp created_at
        timestamp verified_at
    }

    FILE_ATTACHMENTS {
        bigint id PK
        string file_id UK
        string original_name
        string stored_name
        string transaction_id FK
        string token_id FK
        string category
        bigint file_size
        string sha256_hash
        string mime_type
        string storage_path
        string cdn_url
        timestamp uploaded_at
        string uploaded_by
        boolean verified
        boolean deleted
    }

    ASSET_VERIFICATIONS {
        uuid id PK
        uuid asset_id FK
        string verification_type
        string status
        string external_ref
        jsonb response_data
        timestamp verified_at
        string verified_by
    }

    TOKENS {
        uuid id PK
        string token_id UK
        string asset_id FK
        string contract_id FK
        string token_type
        bigint total_supply
        bigint circulating
        string status
        timestamp minted_at
    }

    SMART_CONTRACTS {
        uuid id PK
        string contract_type
        string name
        text description
        text template_code
        jsonb default_params
        boolean is_active
    }

    USERS {
        uuid id PK
        string keycloak_id UK
        string email UK
        string name
        string phone
        string kyc_status
        timestamp created_at
    }

    REFERRALS {
        uuid id PK
        string code UK
        uuid referrer_id FK
        uuid referred_id FK
        string status
        timestamp created_at
    }
```

### 6.2 Key Tables Summary

| Table | Rows (Est.) | Description |
|-------|-------------|-------------|
| `registered_assets` | 10K+ | Asset registry with 12 categories |
| `file_attachments` | 50K+ | Files with SHA256 hashes + CDN URLs |
| `asset_verifications` | 10K+ | External verification records |
| `tokens` | 5K+ | Minted tokens linked to assets |
| `smart_contracts` | 100+ | Contract templates (7 types) |
| `users` | 1K+ | Platform users |
| `referrals` | 500+ | Referral tracking |

---

## 7. CI/CD Pipeline

### 7.1 Pipeline Flow

```mermaid
flowchart LR
    subgraph "Source"
        GIT[GitHub<br/>V12 Branch]
    end

    subgraph "CI Stage"
        BUILD[Maven Build<br/>JVM + Native]
        TEST[Unit Tests<br/>+ Integration]
        SCAN[Security Scan<br/>+ SonarQube]
    end

    subgraph "Artifact"
        JAR[JAR Artifact<br/>12.0.0-runner.jar]
        DOCKER[Docker Image<br/>ghcr.io/aurigraph]
    end

    subgraph "Deploy Stage"
        STAGING[Staging<br/>Deployment]
        SMOKE[Smoke Tests<br/>Health Checks]
        PROD[Production<br/>Blue-Green]
    end

    subgraph "Monitor"
        HEALTH[Health Checks<br/>/api/v11/health]
        METRICS[Prometheus<br/>Metrics]
        ALERTS[Alert Manager]
    end

    GIT --> BUILD
    BUILD --> TEST
    TEST --> SCAN
    SCAN --> JAR
    JAR --> DOCKER
    DOCKER --> STAGING
    STAGING --> SMOKE
    SMOKE --> PROD
    PROD --> HEALTH
    HEALTH --> METRICS
    METRICS --> ALERTS

    classDef ci fill:#e3f2fd,stroke:#1565c0
    classDef deploy fill:#e8f5e9,stroke:#2e7d32
    classDef monitor fill:#fff3e0,stroke:#e65100

    class BUILD,TEST,SCAN ci
    class STAGING,SMOKE,PROD deploy
    class HEALTH,METRICS,ALERTS monitor
```

### 7.2 Deployment Strategy

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant BUILD as Build Server
    participant STAGING as Staging
    participant PROD as Production
    participant LB as Load Balancer

    GH->>BUILD: Trigger on Push to V12
    BUILD->>BUILD: mvn clean package
    BUILD->>BUILD: Run Tests (95%+ coverage)
    BUILD->>BUILD: Build JAR

    BUILD->>STAGING: SCP JAR to Staging
    STAGING->>STAGING: Restart Services
    STAGING->>STAGING: Health Check

    Note over STAGING: Smoke Tests Pass

    BUILD->>PROD: SCP JAR to Production
    PROD->>PROD: Blue Instance Updated
    PROD->>PROD: Health Check (Blue)

    alt Blue Healthy
        LB->>LB: Switch Traffic to Blue
        Note over LB,PROD: Zero Downtime
        PROD->>PROD: Update Green Instance
    else Blue Unhealthy
        LB->>LB: Keep Traffic on Green
        PROD->>PROD: Rollback Blue
        GH->>GH: Alert: Deployment Failed
    end
```

---

## 8. Infrastructure Deployment

### 8.1 Production Infrastructure

```mermaid
graph TB
    subgraph "DNS & CDN"
        DNS[dlt.aurigraph.io<br/>DNS]
    end

    subgraph "Load Balancer"
        NGINX[Nginx<br/>SSL Termination]
    end

    subgraph "Application Tier"
        QUARKUS1[Quarkus Node 1<br/>Port 9003]
        QUARKUS2[Quarkus Node 2<br/>Port 9003]
        QUARKUS3[Quarkus Node 3<br/>Port 9003]
    end

    subgraph "Container Cluster"
        BUS1[Business Node 1-5]
        BUS2[Business Node 6-10]
        BUS3[Business Node 11-20]
        VAL[Validator Nodes 1-3]
        SLIM[External Integration (EI) Nodes 1-5]
    end

    subgraph "Data Tier"
        PG[(PostgreSQL<br/>Master)]
        REDIS[(Redis<br/>Cache)]
        MINIO[MinIO<br/>Storage]
    end

    subgraph "External Services"
        IAM[Keycloak<br/>iam2.aurigraph.io]
    end

    DNS --> NGINX
    NGINX --> QUARKUS1
    NGINX --> QUARKUS2
    NGINX --> QUARKUS3

    QUARKUS1 --> BUS1
    QUARKUS2 --> BUS2
    QUARKUS3 --> BUS3

    BUS1 --> VAL
    BUS2 --> VAL
    BUS3 --> VAL

    QUARKUS1 --> PG
    QUARKUS2 --> PG
    QUARKUS3 --> PG

    QUARKUS1 --> REDIS
    QUARKUS1 --> MINIO
    QUARKUS1 --> IAM

    classDef app fill:#e3f2fd,stroke:#1565c0
    classDef data fill:#e8f5e9,stroke:#2e7d32
    classDef infra fill:#fff3e0,stroke:#e65100

    class QUARKUS1,QUARKUS2,QUARKUS3 app
    class PG,REDIS,MINIO data
    class BUS1,BUS2,BUS3,VAL,SLIM infra
```

### 8.2 Docker Container Layout

```
dlt.aurigraph.io Container Status:
├── aurigraph-business-[1-20]     # Business logic nodes
│   └── Port mapping: 19011-19030
├── aurigraph-validator-[1-3]     # Consensus validators
│   └── Port mapping: 19001-19003
├── aurigraph-ei-[1-5]          # Lightweight nodes
│   └── Port mapping: 19041-19045
├── minio                         # Object storage
│   └── Ports: 9000 (API), 9090 (Console)
├── postgres                      # Database
│   └── Port: 5432
└── redis                         # Cache
    └── Port: 6379
```

---

## 9. Security Architecture

### 9.1 Security Layers

```mermaid
flowchart TB
    subgraph "Edge Security"
        WAF[Web Application<br/>Firewall]
        SSL[SSL/TLS 1.3<br/>Termination]
        DDOS[DDoS<br/>Protection]
    end

    subgraph "Authentication"
        KEYCLOAK[Keycloak<br/>IAM]
        JWT[JWT Token<br/>Validation]
        RBAC[Role-Based<br/>Access Control]
    end

    subgraph "Application Security"
        INPUT[Input<br/>Validation]
        HASH[SHA256<br/>File Hashing]
        AUDIT[Audit<br/>Logging]
    end

    subgraph "Data Security"
        ENCRYPT[Data<br/>Encryption]
        BACKUP[Automated<br/>Backups]
        SECRETS[Secret<br/>Management]
    end

    WAF --> SSL
    SSL --> DDOS
    DDOS --> KEYCLOAK
    KEYCLOAK --> JWT
    JWT --> RBAC
    RBAC --> INPUT
    INPUT --> HASH
    HASH --> AUDIT
    AUDIT --> ENCRYPT
    ENCRYPT --> BACKUP
    BACKUP --> SECRETS

    classDef edge fill:#ffcdd2,stroke:#c62828
    classDef auth fill:#fff3e0,stroke:#e65100
    classDef app fill:#e8f5e9,stroke:#2e7d32
    classDef data fill:#e3f2fd,stroke:#1565c0

    class WAF,SSL,DDOS edge
    class KEYCLOAK,JWT,RBAC auth
    class INPUT,HASH,AUDIT app
    class ENCRYPT,BACKUP,SECRETS data
```

### 9.2 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Keycloak as Keycloak IAM
    participant API as Quarkus API
    participant DB as PostgreSQL

    User->>Frontend: Login Request
    Frontend->>Keycloak: Redirect to /auth
    Keycloak->>Keycloak: Authenticate User
    Keycloak-->>Frontend: JWT Access Token

    Frontend->>API: API Request + JWT
    API->>API: Validate JWT Signature
    API->>API: Check Token Expiry
    API->>API: Extract Roles/Claims

    alt Token Valid
        API->>DB: Execute Query
        DB-->>API: Result
        API-->>Frontend: 200 OK + Data
    else Token Invalid/Expired
        API-->>Frontend: 401 Unauthorized
        Frontend->>Keycloak: Refresh Token
    end
```

---

## Appendix A: API Endpoints Summary

### Core APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v11/health` | GET | Health check |
| `/api/v11/info` | GET | Application info |
| `/api/v11/tokens` | GET/POST | Token management |
| `/api/v11/assets/register` | POST | Register asset |
| `/api/v11/assets/{id}` | GET/PUT | Asset CRUD |
| `/api/v11/attachments/upload` | POST | File upload |
| `/api/v11/attachments/{fileId}` | GET | File download |
| `/api/v11/verification/services` | GET | List verifiers |
| `/api/v11/verification/verify` | POST | Verify asset |
| `/api/v11/contracts/smart` | GET | List contracts |
| `/api/v11/referrals` | GET/POST | Referral management |

### CDN Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cdn/attachments/{file}` | GET | Attachment CDN |
| `/cdn/documents/{file}` | GET | Document CDN |
| `/cdn/assets/{file}` | GET | Asset media CDN |

---

## Appendix B: Version History

| Version | Date | Changes |
|---------|------|---------|
| 12.0.0 | 2025-12-12 | Initial V12 architecture diagrams |
| - | - | Added MinIO CDN integration diagrams |
| - | - | Added File Attachments flow |
| - | - | Added Asset Registry diagrams |
| - | - | Added External Verification adapters |
| - | - | Added Database ER diagram |
| - | - | Added CI/CD pipeline flow |
| - | - | Added Security architecture |

---

**Document Status**: Production
**Next Review**: 2026-01-12
**Maintainer**: J4C Architecture Agent
