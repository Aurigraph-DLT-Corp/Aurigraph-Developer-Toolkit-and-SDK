# Comprehensive Refactoring Plan
**Project:** Aurigraph DLT V11 Enterprise Portal + Backend
**Date:** October 16, 2025
**Version:** 1.0
**Status:** Draft for Review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Sprint Planning](#2-sprint-planning)
3. [Phase 1: Critical Fixes (Week 1-2)](#3-phase-1-critical-fixes-week-1-2)
4. [Phase 2: Code Quality (Week 3-4)](#4-phase-2-code-quality-week-3-4)
5. [Phase 3: Architecture (Week 5-8)](#5-phase-3-architecture-week-5-8)
6. [Phase 4: Performance (Week 9-12)](#6-phase-4-performance-week-9-12)
7. [Testing Strategy](#7-testing-strategy)
8. [Success Criteria](#8-success-criteria)

---

## 1. Overview

### 1.1 Purpose

This refactoring plan provides a systematic approach to improving the Aurigraph DLT codebase quality, performance, and maintainability. The plan is divided into four phases over 12 weeks, with clear goals and deliverables for each phase.

### 1.2 Scope

**In Scope:**
- Frontend (React/TypeScript Enterprise Portal)
- Backend (Java/Quarkus V11 standalone)
- Documentation updates
- Testing improvements
- Performance optimization

**Out of Scope:**
- V10 TypeScript platform (legacy)
- Infrastructure changes (AWS, Kubernetes)
- Major feature additions
- Breaking API changes

### 1.3 Resources Required

**Team:**
- 2 Frontend Developers (full-time)
- 2 Backend Developers (full-time)
- 1 DevOps Engineer (part-time, 50%)
- 1 QA Engineer (full-time)
- 1 Tech Lead (part-time, 50%)

**Tools:**
- Existing development tools
- SonarQube (for code quality analysis)
- JaCoCo (for Java coverage)
- Vitest (for frontend testing)
- Performance profiling tools

---

## 2. Sprint Planning

### 2.1 Sprint Overview

**Total Duration:** 12 weeks (3 sprints x 4 weeks)

```
Sprint 1 (Weeks 1-4): Critical Fixes + Code Quality
Sprint 2 (Weeks 5-8): Architecture Improvements
Sprint 3 (Weeks 9-12): Performance Optimization
```

### 2.2 Sprint Goals

**Sprint 1:**
- Zero linting errors
- Zero console.log statements
- All TypeScript types properly defined
- Clean build process

**Sprint 2:**
- Implement centralized logging
- Add error boundaries
- Refactor duplicate code
- Improve test coverage to 80%

**Sprint 3:**
- Achieve 2M+ TPS backend performance
- Optimize frontend bundle size
- Complete test coverage to 95%
- Production-ready monitoring

---

## 3. Phase 1: Critical Fixes (Week 1-2)

### 3.1 Goals

- Fix all blocking issues
- Establish clean baseline
- Enable automated quality checks

### 3.2 Tasks

#### Week 1: Frontend Critical Fixes

**Task 1.1: Remove Console.log Statements** (Priority: CRITICAL)
- **Assigned to:** Frontend Dev 1
- **Effort:** 4 hours
- **Files:** 15 files with 31 occurrences

```typescript
// Create centralized logger first
// src/utils/logger.ts
export const logger = {
  debug: (message: string, data?: any) => {
    if (import.meta.env.MODE === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: Error, data?: any) => {
    console.error(`[ERROR] ${message}`, error, data);
    // TODO: Send to error tracking service (Sentry)
  },
};

// Then replace all console.log
// Before:
console.log('User clicked button', user);

// After:
logger.debug('User clicked button', { user });
```

**Acceptance Criteria:**
- [ ] Zero console.log/console.debug/console.warn in production code
- [ ] Logger utility created and tested
- [ ] All logging goes through centralized logger
- [ ] Logger integrates with error tracking (Sentry stub)

**Task 1.2: Fix TypeScript `any` Types** (Priority: HIGH)
- **Assigned to:** Frontend Dev 2
- **Effort:** 6 hours
- **Files:** `types/comprehensive.ts`, `types/rwat.ts`

```typescript
// src/types/comprehensive.ts

// Before:
interface Contract {
  code?: any;
  metadata?: any;
}

// After:
interface SmartContractCode {
  language: 'solidity' | 'javascript' | 'rust';
  source: string;
  compiledBytecode?: string;
  abi?: string;
}

interface ContractMetadata {
  version: string;
  author?: string;
  tags?: string[];
  [key: string]: string | string[] | undefined;
}

interface Contract {
  code?: SmartContractCode;
  metadata?: ContractMetadata;
}
```

**Acceptance Criteria:**
- [ ] Zero `any` types in type definition files
- [ ] All replaced with proper type definitions
- [ ] No TypeScript compilation errors
- [ ] Types properly exported and documented

**Task 1.3: Fix ESLint Configuration** (Priority: MEDIUM)
- **Assigned to:** Frontend Dev 1
- **Effort:** 2 hours

```json
// tsconfig.json - Add vite.config.ts
{
  "include": [
    "src",
    "vite.config.ts"  // Add this line
  ]
}
```

**Acceptance Criteria:**
- [ ] vite.config.ts included in TSConfig
- [ ] No ESLint parsing errors
- [ ] All files pass ESLint checks

#### Week 1: Backend Critical Fixes

**Task 1.4: Fix Maven Dependency Issue** (Priority: CRITICAL)
- **Assigned to:** Backend Dev 1
- **Effort:** 4 hours

```xml
<!-- pom.xml -->
<!-- Option 1: Update to correct version -->
<dependency>
    <groupId>org.jboss.logmanager</groupId>
    <artifactId>jboss-logmanager-ext</artifactId>
    <version>1.2.0.Final</version> <!-- Updated version -->
</dependency>

<!-- Option 2: If unused, remove dependency -->
<!-- Delete the entire dependency block -->
```

**Acceptance Criteria:**
- [ ] Maven build succeeds
- [ ] `./mvnw clean install` completes successfully
- [ ] All tests can run
- [ ] Dependency:analyze works

**Task 1.5: Replace System.out with Logging** (Priority: HIGH)
- **Assigned to:** Backend Dev 2
- **Effort:** 4 hours
- **Files:** 5 Java files

```java
// Before:
System.out.println("Transaction processed: " + txId);
System.err.println("Error: " + exception.getMessage());

// After:
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static final Logger logger = LoggerFactory.getLogger(ClassName.class);

logger.info("Transaction processed: {}", txId);
logger.error("Error processing transaction", exception);
```

**Files to update:**
1. `smartcontract/examples/SDKExamples.java`
2. `contracts/composite/SecondaryTokenEvolution.java`
3. `bridge/adapters/EthereumAdapter.java`
4. `bridge/adapters/SolanaAdapter.java`
5. `crypto/HSMCryptoService.java`

**Acceptance Criteria:**
- [ ] Zero System.out.println/System.err.println
- [ ] All replaced with SLF4J logging
- [ ] Proper log levels used (debug, info, warn, error)
- [ ] Log messages provide sufficient context

#### Week 2: Code Formatting & Cleanup

**Task 1.6: Run Prettier on All Files** (Priority: MEDIUM)
- **Assigned to:** Frontend Dev 1
- **Effort:** 2 hours

```bash
# Run prettier
npm run format

# Verify
npm run lint
```

**Acceptance Criteria:**
- [ ] All Prettier errors resolved
- [ ] Consistent code formatting
- [ ] Pre-commit hook added

**Task 1.7: Remove/Archive Backup Files** (Priority: LOW)
- **Assigned to:** Tech Lead
- **Effort:** 3 hours

**Actions:**
1. Review `application.properties.backup` - document changes, then delete
2. Review `ActiveContractService.java.backup` - merge useful changes, then delete
3. Add `.backup`, `.bak`, `.old` to `.gitignore`
4. Move `archive/` directory to separate branch
5. Update documentation with archive location

**Acceptance Criteria:**
- [ ] No .backup/.bak files in src/
- [ ] .gitignore updated
- [ ] Archive directory moved to branch `archive/phase2-cleanup`
- [ ] Documentation updated

**Task 1.8: Set Up Pre-commit Hooks** (Priority: MEDIUM)
- **Assigned to:** DevOps Engineer
- **Effort:** 2 hours

```bash
# Install husky
npm install --save-dev husky lint-staged

# Configure husky
npx husky-init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run type-check
```

**Acceptance Criteria:**
- [ ] Pre-commit hooks installed
- [ ] Linting runs automatically before commit
- [ ] Type checking runs before commit
- [ ] Commit blocked if errors exist

### 3.3 Phase 1 Deliverables

**By End of Week 2:**
- ✅ Zero console.log statements
- ✅ Zero TypeScript `any` types
- ✅ Zero linting errors
- ✅ Clean Maven build
- ✅ All backup files removed
- ✅ Pre-commit hooks active

**Metrics:**
- ESLint errors: 81 → 0
- TypeScript any usage: 7 → 0
- Console.log statements: 34 → 0
- Build success rate: 95% → 100%

---

## 4. Phase 2: Code Quality (Week 3-4)

### 4.1 Goals

- Improve code maintainability
- Reduce code duplication
- Enhance error handling
- Increase test coverage to 80%

### 4.2 Tasks

#### Week 3: Frontend Refactoring

**Task 2.1: Implement Error Boundaries** (Priority: HIGH)
- **Assigned to:** Frontend Dev 2
- **Effort:** 8 hours

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Result } from 'antd';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={
            process.env.NODE_ENV === 'development'
              ? this.state.error?.message
              : 'An unexpected error occurred. Please try again.'
          }
          extra={
            <Button type="primary" onClick={this.handleReset}>
              Try Again
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

**Acceptance Criteria:**
- [ ] ErrorBoundary component created
- [ ] Applied to all major feature sections
- [ ] Proper error logging integrated
- [ ] User-friendly error messages
- [ ] Development vs production error display

**Task 2.2: Create Mock Data Factory** (Priority: MEDIUM)
- **Assigned to:** Frontend Dev 1
- **Effort:** 6 hours

```typescript
// src/utils/mockData/index.ts
import { Block, Transaction, Validator } from '../types/comprehensive';

export const mockDataFactory = {
  generateBlock: (overrides?: Partial<Block>): Block => ({
    id: `block_${Math.random().toString(36).substr(2, 9)}`,
    height: Math.floor(Math.random() * 1000000),
    timestamp: new Date().toISOString(),
    transactions: Math.floor(Math.random() * 1000),
    hash: '0x' + Math.random().toString(16).substr(2, 64),
    previousHash: '0x' + Math.random().toString(16).substr(2, 64),
    validator: `validator_${Math.floor(Math.random() * 100)}`,
    size: Math.floor(Math.random() * 1000000),
    ...overrides,
  }),

  generateBlocks: (count: number): Block[] =>
    Array.from({ length: count }, (_, i) =>
      mockDataFactory.generateBlock({ height: i })
    ),

  generateTransaction: (overrides?: Partial<Transaction>): Transaction => ({
    id: `tx_${Math.random().toString(36).substr(2, 9)}`,
    from: `0x${Math.random().toString(16).substr(2, 40)}`,
    to: `0x${Math.random().toString(16).substr(2, 40)}`,
    amount: Math.random() * 1000,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.1 ? 'confirmed' : 'pending',
    ...overrides,
  }),

  generateTransactions: (count: number): Transaction[] =>
    Array.from({ length: count }, () =>
      mockDataFactory.generateTransaction()
    ),

  generateValidator: (overrides?: Partial<Validator>): Validator => ({
    id: `validator_${Math.floor(Math.random() * 100)}`,
    address: `0x${Math.random().toString(16).substr(2, 40)}`,
    stake: Math.floor(Math.random() * 1000000),
    status: Math.random() > 0.2 ? 'active' : 'inactive',
    uptime: 0.9 + Math.random() * 0.1,
    blocksProduced: Math.floor(Math.random() * 10000),
    ...overrides,
  }),

  generateValidators: (count: number): Validator[] =>
    Array.from({ length: count }, () =>
      mockDataFactory.generateValidator()
    ),
};
```

**Usage:**
```typescript
// Before: Duplicate mock data in each component
const [blocks] = useState([
  { id: '1', height: 100, ... },
  { id: '2', height: 101, ... },
]);

// After: Use factory
import { mockDataFactory } from '../utils/mockData';

const [blocks] = useState(mockDataFactory.generateBlocks(10));
```

**Acceptance Criteria:**
- [ ] Mock data factory created
- [ ] Covers all major entities (Block, Transaction, Validator, etc.)
- [ ] Used across all components
- [ ] Duplicate mock code removed

**Task 2.3: Standardize API Error Handling** (Priority: HIGH)
- **Assigned to:** Frontend Dev 2
- **Effort:** 8 hours

```typescript
// src/services/apiClient.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../utils/constants';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const apiError = new ApiError(
            error.response.status,
            error.response.data?.message || error.message,
            error.response.data
          );

          logger.error('API error', apiError, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response.status,
          });

          return Promise.reject(apiError);
        }

        if (error.request) {
          const networkError = new ApiError(
            0,
            'Network error. Please check your connection.',
            { originalError: error }
          );
          logger.error('Network error', networkError);
          return Promise.reject(networkError);
        }

        logger.error('Unknown error', error);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Usage in services
export const tokenService = {
  async createToken(data: CreateTokenRequest): Promise<Token> {
    try {
      return await apiClient.post<Token>('/api/v11/tokens', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Failed to create token');
    }
  },
};
```

**Acceptance Criteria:**
- [ ] Centralized API client created
- [ ] All services use API client
- [ ] Consistent error handling
- [ ] Request/response interceptors
- [ ] Auth token management

#### Week 4: Backend Refactoring

**Task 2.4: Extract Configuration Service** (Priority: MEDIUM)
- **Assigned to:** Backend Dev 1
- **Effort:** 6 hours

```java
// Before: Configuration scattered across services
@ConfigProperty(name = "aurigraph.performance.target-tps")
int targetTps;

// After: Centralized configuration
// src/main/java/io/aurigraph/v11/config/AurigraphConfig.java
package io.aurigraph.v11.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "aurigraph")
public interface AurigraphConfig {

    PerformanceConfig performance();
    ConsensusConfig consensus();
    SecurityConfig security();
    AiConfig ai();

    interface PerformanceConfig {
        @WithDefault("2000000")
        int targetTps();

        @WithDefault("10000")
        int batchSize();

        @WithDefault("256")
        int parallelThreads();
    }

    interface ConsensusConfig {
        @WithDefault("true")
        boolean aiOptimizationEnabled();

        @WithDefault("500")
        int timeoutMs();

        @WithDefault("3")
        int minValidators();
    }

    interface SecurityConfig {
        @WithDefault("5")
        int quantumLevel();

        @WithDefault("true")
        boolean hsmEnabled();
    }

    interface AiConfig {
        @WithDefault("true")
        boolean enabled();

        @WithDefault("3000000")
        int targetTps();
    }
}

// Usage
@ApplicationScoped
public class TransactionService {
    @Inject
    AurigraphConfig config;

    public void process() {
        int targetTps = config.performance().targetTps();
        // ...
    }
}
```

**Acceptance Criteria:**
- [ ] Configuration centralized
- [ ] Type-safe configuration access
- [ ] Default values defined
- [ ] All services updated to use config service

**Task 2.5: Add Unit Tests** (Priority: HIGH)
- **Assigned to:** Backend Dev 2 + QA Engineer
- **Effort:** 16 hours

**Test Coverage Targets:**
- Core services: 95%
- Utilities: 90%
- Controllers/Resources: 85%

```java
// Example test structure
@QuarkusTest
public class TransactionServiceTest {

    @Inject
    TransactionService transactionService;

    @Test
    public void testCreateTransaction() {
        // Given
        TransactionRequest request = new TransactionRequest(
            "from_address",
            "to_address",
            1000L
        );

        // When
        Transaction result = transactionService.create(request);

        // Then
        assertNotNull(result.getId());
        assertEquals("from_address", result.getFrom());
        assertEquals("to_address", result.getTo());
        assertEquals(1000L, result.getAmount());
    }

    @Test
    public void testCreateTransaction_InvalidAmount() {
        // Given
        TransactionRequest request = new TransactionRequest(
            "from_address",
            "to_address",
            -1000L // Invalid
        );

        // When/Then
        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.create(request);
        });
    }

    @Test
    public void testBatchProcessing() {
        // Given
        List<Transaction> transactions = generateMockTransactions(1000);

        // When
        Uni<BatchResult> result = transactionService.processBatch(transactions);

        // Then
        result.subscribe().with(
            batchResult -> {
                assertEquals(1000, batchResult.getProcessedCount());
                assertEquals(0, batchResult.getFailedCount());
            }
        );
    }
}
```

**Acceptance Criteria:**
- [ ] Unit tests for all services
- [ ] Test coverage > 80%
- [ ] Integration tests for critical paths
- [ ] Mocking properly configured

### 4.3 Phase 2 Deliverables

**By End of Week 4:**
- ✅ Error boundaries implemented
- ✅ Mock data factory created
- ✅ API error handling standardized
- ✅ Configuration centralized
- ✅ Test coverage > 80%

**Metrics:**
- Code duplication: 20% → 5%
- Test coverage: 15% → 80%
- API error handling: Inconsistent → Standardized
- Configuration: Scattered → Centralized

---

## 5. Phase 3: Architecture (Week 5-8)

### 5.1 Goals

- Implement feature-based architecture
- Improve separation of concerns
- Enhance scalability
- Add comprehensive logging and monitoring

### 5.2 Tasks

#### Week 5-6: Frontend Architecture

**Task 3.1: Implement Feature Modules** (Priority: HIGH)
- **Assigned to:** Frontend Team
- **Effort:** 32 hours

**New Structure:**
```
src/
├── features/
│   ├── blockchain/
│   │   ├── components/
│   │   │   ├── BlockExplorer.tsx
│   │   │   └── TransactionExplorer.tsx
│   │   ├── services/
│   │   │   └── blockchainService.ts
│   │   ├── types/
│   │   │   └── blockchain.types.ts
│   │   ├── hooks/
│   │   │   └── useBlockchain.ts
│   │   └── index.ts
│   │
│   ├── tokenization/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   ├── security/
│   └── contracts/
│
├── shared/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Shared hooks
│   ├── utils/           # Utilities
│   └── types/           # Common types
│
├── core/
│   ├── api/             # API client
│   ├── auth/            # Authentication
│   └── config/          # Configuration
│
└── App.tsx
```

**Migration Steps:**
1. Create feature module structure
2. Move related components to feature modules
3. Extract shared components
4. Update imports
5. Create barrel exports (index.ts)

**Acceptance Criteria:**
- [ ] All features organized into modules
- [ ] Clear separation of concerns
- [ ] Barrel exports for each module
- [ ] No circular dependencies

**Task 3.2: Implement RTK Query for API Caching** (Priority: MEDIUM)
- **Assigned to:** Frontend Dev 1
- **Effort:** 16 hours

```typescript
// src/store/api/tokenApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../utils/constants';

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({ baseURL: API_BASE_URL }),
  tagTypes: ['Token'],
  endpoints: (builder) => ({
    getTokens: builder.query<Token[], void>({
      query: () => '/api/v11/tokens',
      providesTags: ['Token'],
    }),
    getToken: builder.query<Token, string>({
      query: (id) => `/api/v11/tokens/${id}`,
      providesTags: (result, error, id) => [{ type: 'Token', id }],
    }),
    createToken: builder.mutation<Token, CreateTokenRequest>({
      query: (data) => ({
        url: '/api/v11/tokens',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Token'],
    }),
    updateToken: builder.mutation<Token, { id: string; data: Partial<Token> }>({
      query: ({ id, data }) => ({
        url: `/api/v11/tokens/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Token', id }],
    }),
    deleteToken: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v11/tokens/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Token'],
    }),
  }),
});

export const {
  useGetTokensQuery,
  useGetTokenQuery,
  useCreateTokenMutation,
  useUpdateTokenMutation,
  useDeleteTokenMutation,
} = tokenApi;

// Usage in component
function TokenList() {
  const { data: tokens, isLoading, error } = useGetTokensQuery();
  const [createToken] = useCreateTokenMutation();

  if (isLoading) return <Spin />;
  if (error) return <Alert message="Error loading tokens" />;

  return (
    <Table dataSource={tokens} />
  );
}
```

**Acceptance Criteria:**
- [ ] RTK Query implemented for all APIs
- [ ] Automatic caching configured
- [ ] Optimistic updates enabled
- [ ] Loading/error states handled

#### Week 7-8: Backend Architecture

**Task 3.3: Implement Hexagonal Architecture** (Priority: HIGH)
- **Assigned to:** Backend Team
- **Effort:** 40 hours

**New Structure:**
```java
io.aurigraph.v11/
├── domain/                     // Business logic (no dependencies)
│   ├── model/
│   │   ├── Transaction.java
│   │   ├── Block.java
│   │   └── Token.java
│   ├── port/                   // Interfaces
│   │   ├── in/                 // Use cases
│   │   │   ├── CreateTransactionUseCase.java
│   │   │   └── ProcessBlockUseCase.java
│   │   └── out/                // Repository interfaces
│   │       ├── TransactionRepository.java
│   │       └── BlockRepository.java
│   └── service/                // Domain services
│       └── TransactionDomainService.java
│
├── application/                // Application layer
│   ├── service/
│   │   ├── TransactionApplicationService.java
│   │   └── BlockApplicationService.java
│   └── config/
│       └── ApplicationConfig.java
│
├── infrastructure/             // External adapters
│   ├── persistence/
│   │   ├── leveldb/
│   │   │   └── LevelDBTransactionRepository.java
│   │   └── memory/
│   │       └── InMemoryTransactionRepository.java
│   ├── messaging/
│   │   └── KafkaEventPublisher.java
│   └── external/
│       └── EthereumBridgeAdapter.java
│
└── interfaces/                 // API layer
    ├── rest/
    │   ├── TransactionResource.java
    │   └── BlockResource.java
    ├── grpc/
    │   └── TransactionGrpcService.java
    └── dto/
        ├── TransactionDTO.java
        └── BlockDTO.java
```

**Example Implementation:**
```java
// Domain layer - Pure business logic
// domain/port/in/CreateTransactionUseCase.java
public interface CreateTransactionUseCase {
    Transaction create(CreateTransactionCommand command);
}

// domain/service/TransactionDomainService.java
@ApplicationScoped
public class TransactionDomainService implements CreateTransactionUseCase {

    @Inject
    TransactionRepository repository;  // Port

    @Override
    public Transaction create(CreateTransactionCommand command) {
        // Business logic
        Transaction transaction = Transaction.builder()
            .from(command.from())
            .to(command.to())
            .amount(command.amount())
            .build();

        transaction.validate();  // Domain validation

        return repository.save(transaction);
    }
}

// Infrastructure layer - External implementation
// infrastructure/persistence/leveldb/LevelDBTransactionRepository.java
@ApplicationScoped
public class LevelDBTransactionRepository implements TransactionRepository {

    @Inject
    LevelDB levelDB;

    @Override
    public Transaction save(Transaction transaction) {
        byte[] key = transaction.getId().getBytes();
        byte[] value = serialize(transaction);
        levelDB.put(key, value);
        return transaction;
    }
}

// Interface layer - REST API
// interfaces/rest/TransactionResource.java
@Path("/api/v11/transactions")
public class TransactionResource {

    @Inject
    CreateTransactionUseCase createTransactionUseCase;

    @POST
    public Uni<TransactionDTO> create(CreateTransactionDTO dto) {
        CreateTransactionCommand command = toCommand(dto);
        Transaction transaction = createTransactionUseCase.create(command);
        return Uni.createFrom().item(toDTO(transaction));
    }
}
```

**Acceptance Criteria:**
- [ ] Clean architecture implemented
- [ ] Domain layer has no external dependencies
- [ ] Ports and adapters pattern followed
- [ ] All tests pass after refactoring

**Task 3.4: Implement Event Sourcing** (Priority: MEDIUM)
- **Assigned to:** Backend Dev 2
- **Effort:** 16 hours

```java
// domain/event/DomainEvent.java
public interface DomainEvent {
    String getId();
    LocalDateTime getTimestamp();
    String getAggregateId();
}

// domain/event/TransactionCreatedEvent.java
@Value
public class TransactionCreatedEvent implements DomainEvent {
    String id;
    LocalDateTime timestamp;
    String aggregateId;
    String from;
    String to;
    long amount;
}

// domain/model/Transaction.java
public class Transaction {
    private List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public void create(String from, String to, long amount) {
        // Business logic
        validateCreate(from, to, amount);

        // Record event
        uncommittedEvents.add(new TransactionCreatedEvent(
            UUID.randomUUID().toString(),
            LocalDateTime.now(),
            this.id,
            from,
            to,
            amount
        ));
    }

    public List<DomainEvent> getUncommittedEvents() {
        return uncommittedEvents;
    }

    public void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }
}

// infrastructure/event/EventStore.java
@ApplicationScoped
public class EventStore {
    public void save(List<DomainEvent> events) {
        events.forEach(event -> {
            // Save to event store (LevelDB/Kafka)
            persistEvent(event);

            // Publish to event bus
            eventBus.publish(event);
        });
    }
}
```

**Acceptance Criteria:**
- [ ] Event sourcing implemented
- [ ] Events stored persistently
- [ ] Event replay capability
- [ ] Audit trail complete

### 5.3 Phase 3 Deliverables

**By End of Week 8:**
- ✅ Feature-based architecture
- ✅ RTK Query implemented
- ✅ Hexagonal architecture
- ✅ Event sourcing foundation

**Metrics:**
- Architecture score: 6/10 → 9/10
- Code modularity: 60% → 90%
- Test coverage: 80% → 85%
- Maintainability index: Good → Excellent

---

## 6. Phase 4: Performance (Week 9-12)

### 6.1 Goals

- Achieve 2M+ TPS backend target
- Optimize frontend bundle size
- Implement production monitoring
- Complete test coverage to 95%

### 6.2 Tasks

#### Week 9-10: Backend Performance

**Task 4.1: Transaction Processing Optimization** (Priority: CRITICAL)
- **Assigned to:** Backend Dev 1
- **Effort:** 24 hours

**Optimization Strategies:**

1. **Increase Batch Sizes**
```java
// Before
@ConfigProperty(name = "consensus.batch.size", defaultValue = "10000")
int batchSize;

// After
@ConfigProperty(name = "consensus.batch.size", defaultValue = "50000")
int batchSize;

// Add dynamic batch sizing
public int calculateOptimalBatchSize() {
    double load = getCurrentLoad();
    if (load > 0.8) {
        return batchSize * 2;  // 100,000
    } else if (load < 0.3) {
        return batchSize / 2;  // 25,000
    }
    return batchSize;
}
```

2. **Parallel Processing Optimization**
```java
// Before: Sequential processing
public void processTransactions(List<Transaction> txs) {
    txs.forEach(this::process);
}

// After: Parallel processing with virtual threads
public Uni<Void> processTransactions(List<Transaction> txs) {
    List<Uni<Void>> unis = txs.stream()
        .map(tx -> Uni.createFrom().item(() -> process(tx))
            .runSubscriptionOn(Infrastructure.getDefaultWorkerPool()))
        .collect(Collectors.toList());

    return Uni.combine().all().unis(unis)
        .discardItems();
}
```

3. **Lock Contention Reduction**
```java
// Before: Single lock
private final Lock lock = new ReentrantLock();

public void update(Transaction tx) {
    lock.lock();
    try {
        // Update logic
    } finally {
        lock.unlock();
    }
}

// After: Striped locks
private final Striped<Lock> locks = Striped.lock(256);

public void update(Transaction tx) {
    Lock lock = locks.get(tx.getId());
    lock.lock();
    try {
        // Update logic
    } finally {
        lock.unlock();
    }
}
```

**Acceptance Criteria:**
- [ ] TPS increased from 776K to 1.5M+
- [ ] Latency maintained < 100ms
- [ ] Memory usage stable
- [ ] No thread starvation

**Task 4.2: gRPC Performance Tuning** (Priority: HIGH)
- **Assigned to:** Backend Dev 2
- **Effort:** 16 hours

```java
// Implement streaming for high-throughput operations
@GrpcService
public class TransactionGrpcService implements TransactionService {

    @Override
    public Multi<TransactionResponse> processBatch(Multi<TransactionRequest> requests) {
        return requests
            .onItem().transform(this::process)
            .onOverflow().buffer(100000)
            .onBackPressure().drop();
    }

    @Override
    public Uni<BatchResponse> processOptimizedBatch(BatchRequest request) {
        return Uni.createFrom().item(() -> {
            // Optimized batch processing
            List<Transaction> txs = request.getTransactionsList()
                .stream()
                .parallel()
                .map(this::convertToTransaction)
                .collect(Collectors.toList());

            // Process in chunks
            return processBatchOptimized(txs);
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }
}

// Configure gRPC server options
@ApplicationScoped
public class GrpcServerConfiguration {

    @Produces
    public ServerBuilder<?> configureGrpcServer(ServerBuilder<?> builder) {
        return builder
            .maxInboundMessageSize(100 * 1024 * 1024)  // 100MB
            .maxConcurrentCallsPerConnection(1000)
            .keepAliveTime(30, TimeUnit.SECONDS)
            .keepAliveTimeout(5, TimeUnit.SECONDS)
            .permitKeepAliveTime(10, TimeUnit.SECONDS)
            .executor(Executors.newVirtualThreadPerTaskExecutor());
    }
}
```

**Acceptance Criteria:**
- [ ] gRPC streaming implemented
- [ ] Throughput improved 2x
- [ ] Connection pooling optimized
- [ ] Backpressure handling added

#### Week 11: Frontend Performance

**Task 4.3: Bundle Size Optimization** (Priority: HIGH)
- **Assigned to:** Frontend Dev 1
- **Effort:** 12 hours

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd'],
  },
});
```

```typescript
// Implement lazy loading
// App.tsx
const BlockExplorer = lazy(() => import('./components/comprehensive/BlockExplorer'));
const TransactionExplorer = lazy(() => import('./components/comprehensive/TransactionExplorer'));
const ValidatorDashboard = lazy(() => import('./components/comprehensive/ValidatorDashboard'));

// ... in render
<Suspense fallback={<Spin size="large" />}>
  <Routes>
    <Route path="/blocks" element={<BlockExplorer />} />
    <Route path="/transactions" element={<TransactionExplorer />} />
    <Route path="/validators" element={<ValidatorDashboard />} />
  </Routes>
</Suspense>
```

**Acceptance Criteria:**
- [ ] Initial bundle < 500KB gzipped
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Tree shaking verified

**Task 4.4: Memoization & Re-render Optimization** (Priority: MEDIUM)
- **Assigned to:** Frontend Dev 2
- **Effort:** 12 hours

```typescript
// Before: Component re-renders unnecessarily
function ExpensiveComponent({ data, onUpdate }) {
  const processedData = processLargeDataset(data);

  return (
    <Table
      dataSource={processedData}
      onChange={onUpdate}
    />
  );
}

// After: Optimized with memoization
import React, { useMemo, useCallback } from 'react';

const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(
    () => processLargeDataset(data),
    [data]
  );

  const handleUpdate = useCallback((newData) => {
    onUpdate(newData);
  }, [onUpdate]);

  return (
    <Table
      dataSource={processedData}
      onChange={handleUpdate}
    />
  );
});

ExpensiveComponent.displayName = 'ExpensiveComponent';
export default ExpensiveComponent;
```

**Acceptance Criteria:**
- [ ] React.memo applied to expensive components
- [ ] useMemo for computed values
- [ ] useCallback for event handlers
- [ ] Re-renders reduced by 50%+

#### Week 12: Testing & Monitoring

**Task 4.5: Complete Test Coverage** (Priority: HIGH)
- **Assigned to:** QA Engineer + Developers
- **Effort:** 32 hours

**Coverage Targets:**
- Frontend: 95% lines, 90% branches
- Backend: 95% lines, 90% branches

**Test Types:**
1. Unit tests
2. Integration tests
3. E2E tests
4. Performance tests
5. Security tests

**Acceptance Criteria:**
- [ ] All critical paths covered
- [ ] Edge cases tested
- [ ] Error handling tested
- [ ] Performance regression tests

**Task 4.6: Production Monitoring** (Priority: CRITICAL)
- **Assigned to:** DevOps Engineer
- **Effort:** 16 hours

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-v11'
    static_configs:
      - targets: ['localhost:9003']
    metrics_path: '/q/metrics'

  - job_name: 'aurigraph-frontend'
    static_configs:
      - targets: ['localhost:3000']
```

```java
// Add custom metrics
@ApplicationScoped
public class MetricsService {

    @Inject
    MeterRegistry registry;

    private Counter transactionsProcessed;
    private Timer transactionProcessingTime;
    private Gauge activeSessions;

    @PostConstruct
    void init() {
        transactionsProcessed = registry.counter("aurigraph.transactions.processed");
        transactionProcessingTime = registry.timer("aurigraph.transactions.processing.time");
        activeSessions = registry.gauge("aurigraph.sessions.active", new AtomicInteger(0));
    }

    public void recordTransaction() {
        transactionsProcessed.increment();
    }

    public void recordProcessingTime(long milliseconds) {
        transactionProcessingTime.record(milliseconds, TimeUnit.MILLISECONDS);
    }
}
```

**Acceptance Criteria:**
- [ ] Prometheus metrics configured
- [ ] Grafana dashboards created
- [ ] Alerts configured
- [ ] Log aggregation set up

### 6.3 Phase 4 Deliverables

**By End of Week 12:**
- ✅ Backend TPS: 2M+
- ✅ Frontend bundle < 500KB
- ✅ Test coverage: 95%
- ✅ Production monitoring active

**Metrics:**
- Backend TPS: 776K → 2M+
- Frontend bundle: Unknown → <500KB gzipped
- Test coverage: 80% → 95%
- Monitoring: None → Complete

---

## 7. Testing Strategy

### 7.1 Frontend Testing

**Unit Tests (Vitest)**
```typescript
// Example: services/tokenService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tokenService } from './tokenService';
import { apiClient } from './apiClient';

vi.mock('./apiClient');

describe('TokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create token successfully', async () => {
      const mockToken = { id: '1', name: 'Test Token' };
      vi.mocked(apiClient.post).mockResolvedValue(mockToken);

      const result = await tokenService.createToken({
        name: 'Test Token',
        symbol: 'TST',
      });

      expect(result).toEqual(mockToken);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v11/tokens',
        { name: 'Test Token', symbol: 'TST' }
      );
    });

    it('should handle errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Network error')
      );

      await expect(tokenService.createToken({
        name: 'Test Token',
        symbol: 'TST',
      })).rejects.toThrow('Network error');
    });
  });
});
```

**Component Tests**
```typescript
// Example: components/TokenList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { TokenList } from './TokenList';
import { store } from '../../store';

describe('TokenList', () => {
  it('should render token list', async () => {
    render(
      <Provider store={store}>
        <TokenList />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Token')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    render(
      <Provider store={store}>
        <TokenList />
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

**E2E Tests (Playwright)**
```typescript
// e2e/token-management.spec.ts
import { test, expect } from '@playwright/test';

test('create and view token', async ({ page }) => {
  // Navigate to token page
  await page.goto('http://localhost:3000/tokens');

  // Click create button
  await page.click('button:has-text("Create Token")');

  // Fill form
  await page.fill('input[name="name"]', 'Test Token');
  await page.fill('input[name="symbol"]', 'TST');
  await page.fill('input[name="totalSupply"]', '1000000');

  // Submit
  await page.click('button:has-text("Submit")');

  // Verify token appears in list
  await expect(page.locator('text=Test Token')).toBeVisible();
  await expect(page.locator('text=TST')).toBeVisible();
});
```

### 7.2 Backend Testing

**Unit Tests (JUnit 5)**
```java
@QuarkusTest
public class TransactionServiceTest {

    @Inject
    TransactionService transactionService;

    @Test
    public void testCreateTransaction() {
        // Given
        CreateTransactionCommand command = new CreateTransactionCommand(
            "from_address",
            "to_address",
            1000L
        );

        // When
        Transaction result = transactionService.create(command);

        // Then
        assertNotNull(result.getId());
        assertEquals("from_address", result.getFrom());
        assertEquals("to_address", result.getTo());
        assertEquals(1000L, result.getAmount());
    }

    @Test
    public void testCreateTransaction_InvalidAmount() {
        // Given
        CreateTransactionCommand command = new CreateTransactionCommand(
            "from_address",
            "to_address",
            -1000L
        );

        // When/Then
        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.create(command);
        });
    }
}
```

**Integration Tests**
```java
@QuarkusIntegrationTest
public class TransactionResourceIT {

    @Test
    public void testCreateTransactionEndpoint() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "from": "address1",
                    "to": "address2",
                    "amount": 1000
                }
                """)
        .when()
            .post("/api/v11/transactions")
        .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("from", equalTo("address1"))
            .body("to", equalTo("address2"))
            .body("amount", equalTo(1000));
    }
}
```

**Performance Tests**
```java
@QuarkusTest
public class PerformanceTest {

    @Test
    public void testHighThroughput() throws Exception {
        int targetTps = 2_000_000;
        int duration = 10; // seconds

        CountDownLatch latch = new CountDownLatch(targetTps * duration);
        AtomicInteger successCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < targetTps * duration; i++) {
            executor.submit(() -> {
                try {
                    transactionService.create(generateMockTransaction());
                    successCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(duration + 5, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();

        double actualTps = (double) successCount.get() / ((endTime - startTime) / 1000.0);

        System.out.println("Actual TPS: " + actualTps);
        assertTrue(actualTps >= targetTps * 0.95, "TPS below target");
    }
}
```

---

## 8. Success Criteria

### 8.1 Phase 1 Success Criteria

- [ ] Zero linting errors
- [ ] Zero console.log statements in production code
- [ ] Zero TypeScript `any` types
- [ ] All backup files removed
- [ ] Pre-commit hooks active and working
- [ ] Maven build succeeds
- [ ] All System.out replaced with logging

### 8.2 Phase 2 Success Criteria

- [ ] Error boundaries implemented across all major features
- [ ] API error handling standardized
- [ ] Mock data factory used across codebase
- [ ] Configuration centralized
- [ ] Test coverage > 80%
- [ ] Code duplication < 5%

### 8.3 Phase 3 Success Criteria

- [ ] Feature-based architecture implemented
- [ ] RTK Query integrated for API calls
- [ ] Hexagonal architecture in backend
- [ ] Event sourcing foundation complete
- [ ] Test coverage > 85%
- [ ] Clean architecture validated

### 8.4 Phase 4 Success Criteria

- [ ] Backend TPS: 2M+ achieved
- [ ] Frontend bundle size < 500KB gzipped
- [ ] Test coverage: 95%
- [ ] Production monitoring active
- [ ] All performance targets met
- [ ] Zero critical bugs

### 8.5 Overall Success Metrics

**Code Quality:**
- ESLint errors: 0
- TypeScript errors: 0
- Code duplication: < 5%
- Maintainability index: A

**Performance:**
- Backend TPS: 2M+
- Frontend load time: < 2s
- API response time: < 100ms

**Testing:**
- Unit test coverage: 95%
- Integration test coverage: 90%
- E2E test coverage: 80%

**Architecture:**
- Clean architecture score: 9/10
- Dependency graph: No cycles
- Module cohesion: High

---

## 9. Risk Mitigation

### 9.1 Technical Risks

**Risk: Refactoring breaks existing functionality**
- Mitigation: Comprehensive test suite, feature flags, gradual rollout

**Risk: Performance degradation during refactoring**
- Mitigation: Performance benchmarks before/after, continuous monitoring

**Risk: Team resistance to architectural changes**
- Mitigation: Thorough documentation, pair programming, code reviews

### 9.2 Schedule Risks

**Risk: Underestimated effort**
- Mitigation: 20% buffer built into estimates, weekly progress reviews

**Risk: Dependencies on external teams**
- Mitigation: Early coordination, clear interfaces, fallback plans

### 9.3 Resource Risks

**Risk: Key developer unavailability**
- Mitigation: Knowledge sharing, documentation, pair programming

**Risk: Competing priorities**
- Mitigation: Executive buy-in, dedicated refactoring time

---

## 10. Conclusion

This refactoring plan provides a structured approach to improving the Aurigraph DLT codebase over 12 weeks. By following this plan, the team will:

1. Establish a clean, maintainable codebase
2. Achieve production-ready performance targets
3. Implement enterprise-grade architecture
4. Build comprehensive test coverage
5. Enable scalable future development

**Next Steps:**
1. Review and approve this plan with stakeholders
2. Allocate resources and set start date
3. Begin Phase 1 execution
4. Weekly progress reviews
5. Adjust plan as needed based on learnings

**Success Factors:**
- Executive support and dedicated time
- Team commitment to quality
- Consistent code review process
- Regular communication and coordination
- Focus on incremental progress

---

**Document Version:** 1.0
**Last Updated:** October 16, 2025
**Next Review:** Weekly during execution
**Approval Required:** Tech Lead, Engineering Manager, Product Owner
