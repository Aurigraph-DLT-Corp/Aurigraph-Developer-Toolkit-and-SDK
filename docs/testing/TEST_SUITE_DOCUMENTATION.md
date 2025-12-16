# Aurigraph V12 Test Suite Documentation

**Version**: 12.0.0
**Author**: Testing Team
**Date**: December 2025
**JIRA**: AV11-564

## Executive Summary

This document provides comprehensive documentation of the Aurigraph V12 test suite, covering 151+ tests across frontend E2E testing (Playwright) and backend API testing (Pytest).

## Test Suite Overview

| Component | Framework | Tests | Coverage |
|-----------|-----------|-------|----------|
| Frontend E2E | Playwright | 128 | UI/Integration |
| Backend API | Pytest | 75 | API/Unit |
| Backend Unit | JUnit 5 | 660 | Unit/Integration |
| **Total** | - | **863** | - |

---

## 1. Frontend E2E Tests (Playwright)

### 1.1 Test Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: 4,
  use: {
    baseURL: 'https://dlt.aurigraph.io',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

### 1.2 Test Categories

#### Authentication Tests (`auth.spec.ts`)

| Test | Description | Priority |
|------|-------------|----------|
| `should login with valid credentials` | Basic login flow | High |
| `should reject invalid credentials` | Error handling | High |
| `should refresh expired tokens` | Token refresh | High |
| `should logout successfully` | Logout flow | Medium |
| `should handle session timeout` | Session management | Medium |

#### Dashboard Tests (`dashboard.spec.ts`)

| Test | Description | Priority |
|------|-------------|----------|
| `should display network stats` | Stats rendering | High |
| `should show validator status` | Validator info | High |
| `should display recent transactions` | TX list | Medium |
| `should update in real-time` | WebSocket updates | High |

#### Transaction Tests (`transactions.spec.ts`)

| Test | Description | Priority |
|------|-------------|----------|
| `should submit transaction` | TX submission | Critical |
| `should validate addresses` | Input validation | High |
| `should estimate gas fees` | Fee estimation | High |
| `should show TX history` | History display | Medium |
| `should track pending TX` | Status tracking | High |

#### Feature Flag Tests (`feature-flags.spec.ts`)

| Test | Description | Priority |
|------|-------------|----------|
| `should display enabled features` | Feature visibility | Medium |
| `should hide disabled features` | Feature hiding | Medium |
| `should route correctly` | Navigation | Medium |

#### External Verification Tests (`external-verification.spec.ts`)

| Test | Description | Priority |
|------|-------------|----------|
| `should verify oracle status` | Oracle health | High |
| `should fetch price feeds` | Data feeds | High |
| `should verify documents` | Doc verification | High |
| `should check KYC status` | KYC flow | High |

### 1.3 Running Frontend Tests

```bash
# Run all E2E tests
cd enterprise-portal/enterprise-portal/frontend
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Generate report
npx playwright test --reporter=html
```

---

## 2. Backend API Tests (Pytest)

### 2.1 Test Configuration

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    response = client.post("/api/auth/login", json={
        "username": "test@example.com",
        "password": "testpassword"
    })
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
```

### 2.2 Test Categories

#### API Health Tests (`test_health.py`)

```python
def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_readiness_probe(client):
    """Test readiness probe"""
    response = client.get("/ready")
    assert response.status_code == 200
```

#### Authentication Tests (`test_auth.py`)

```python
def test_login_success(client):
    """Test successful login"""
    response = client.post("/api/auth/login", json={
        "username": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post("/api/auth/login", json={
        "username": "invalid@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
```

#### Transaction Tests (`test_transactions.py`)

```python
def test_submit_transaction(client, auth_headers):
    """Test transaction submission"""
    response = client.post("/api/v11/transactions",
        headers=auth_headers,
        json={
            "from": "0x1234...",
            "to": "0xabcd...",
            "value": "1000000000000000000"
        })
    assert response.status_code in [200, 201]

def test_get_transaction(client, auth_headers):
    """Test get transaction by hash"""
    tx_hash = "0x7890..."
    response = client.get(f"/api/v11/transactions/{tx_hash}",
        headers=auth_headers)
    assert response.status_code in [200, 404]
```

#### Quantum Security Tests (`test_quantum_security.py`)

```python
def test_key_generation(client, auth_headers):
    """Test quantum-resistant key generation"""
    response = client.post("/api/v12/quantum/keys/generate",
        headers=auth_headers,
        json={"algorithm": "CRYSTALS-Kyber"})
    assert response.status_code == 200
    assert "publicKey" in response.json()

def test_signature_verification(client, auth_headers):
    """Test quantum signature verification"""
    response = client.post("/api/v12/quantum/verify",
        headers=auth_headers,
        json={
            "message": "test message",
            "signature": "...",
            "publicKey": "..."
        })
    assert response.status_code in [200, 400]
```

### 2.3 Running Backend Tests

```bash
# Run all Pytest tests
cd aurigraph-fastapi
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test file
python -m pytest tests/api/test_auth.py -v

# Run tests matching pattern
python -m pytest tests/ -k "test_transaction" -v

# Run with parallel execution
python -m pytest tests/ -n auto
```

---

## 3. Backend Unit Tests (JUnit 5)

### 3.1 Test Configuration

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>
```

### 3.2 Test Categories

#### Resource Tests

```java
@QuarkusTest
class TransactionResourceTest {

    @Test
    void testSubmitTransaction() {
        given()
            .contentType(ContentType.JSON)
            .body(new TransactionRequest(...))
            .when().post("/api/v11/transactions")
            .then()
                .statusCode(201)
                .body("txHash", notNullValue());
    }
}
```

#### Service Tests

```java
@QuarkusTest
class TransactionServiceTest {

    @Inject
    TransactionService service;

    @Test
    void testProcessTransaction() {
        Transaction tx = new Transaction();
        tx.setFrom("0x1234...");
        tx.setTo("0xabcd...");

        TransactionReceipt receipt = service.process(tx);

        assertNotNull(receipt);
        assertEquals("CONFIRMED", receipt.getStatus());
    }
}
```

#### gRPC Tests

```java
@QuarkusTest
class ConsensusServiceGrpcTest {

    @GrpcClient
    ConsensusService consensusService;

    @Test
    void testProposeBlock() {
        BlockProposal proposal = BlockProposal.newBuilder()
            .setBlockNumber(12345)
            .build();

        ProposalResponse response = consensusService.proposeBlock(proposal);

        assertTrue(response.getAccepted());
    }
}
```

### 3.3 Running Backend Unit Tests

```bash
# Run all Maven tests
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test

# Run specific test class
./mvnw test -Dtest=TransactionResourceTest

# Run with coverage report
./mvnw test jacoco:report

# Run integration tests
./mvnw verify -Pit
```

---

## 4. Test Environment Setup

### 4.1 Local Development

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d postgres redis

# Set environment variables
export TEST_DATABASE_URL=postgresql://localhost:5432/aurigraph_test
export TEST_REDIS_URL=redis://localhost:6379

# Run tests
npm test        # Frontend
pytest tests/   # Backend Python
./mvnw test     # Backend Java
```

### 4.2 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run Playwright tests
        run: npx playwright test

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
      - name: Run Pytest
        run: pytest tests/ -v

  java-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Java
        uses: actions/setup-java@v3
      - name: Run Maven tests
        run: ./mvnw test
```

---

## 5. Coverage Requirements

### 5.1 Coverage Targets

| Component | Line Coverage | Branch Coverage |
|-----------|--------------|-----------------|
| Critical paths | 95% | 90% |
| Core services | 85% | 80% |
| API endpoints | 80% | 75% |
| Utilities | 70% | 65% |

### 5.2 Coverage Reports

```bash
# Generate coverage reports
npx playwright test --coverage           # Frontend
pytest tests/ --cov-report=html          # Backend Python
./mvnw jacoco:report                     # Backend Java
```

---

## 6. Test Data Management

### 6.1 Fixtures

```python
# Backend fixtures
@pytest.fixture
def sample_transaction():
    return {
        "from": "0x1234567890123456789012345678901234567890",
        "to": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "value": "1000000000000000000",
        "gasPrice": "20000000000",
        "gasLimit": "21000"
    }

@pytest.fixture
def sample_user():
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "securepassword123"
    }
```

### 6.2 Test Database Seeding

```sql
-- test_seed.sql
INSERT INTO users (id, email, username, role) VALUES
  ('uuid-1', 'admin@test.com', 'admin', 'ADMIN'),
  ('uuid-2', 'user@test.com', 'testuser', 'USER');

INSERT INTO transactions (tx_hash, from_address, to_address, value, status) VALUES
  ('0xabc...', '0x123...', '0x456...', '1000000000000000000', 'CONFIRMED');
```

---

## 7. Debugging Tests

### 7.1 Playwright Debug Mode

```bash
# Debug mode with browser
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip

# Screenshot on failure
npx playwright test --screenshot=only-on-failure
```

### 7.2 Pytest Debug Mode

```bash
# Verbose output
pytest tests/ -vvv

# Stop on first failure
pytest tests/ -x

# Drop into debugger on failure
pytest tests/ --pdb

# Show print statements
pytest tests/ -s
```

---

## 8. Test Maintenance

### 8.1 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use fixtures for setup/teardown
3. **Naming**: Use descriptive test names
4. **Documentation**: Document complex test scenarios
5. **Speed**: Keep tests fast (< 5s each)

### 8.2 Test Review Checklist

- [ ] Test covers the intended scenario
- [ ] Assertions are meaningful
- [ ] No hardcoded values (use fixtures)
- [ ] Handles edge cases
- [ ] Has appropriate timeout
- [ ] Cleanup is performed
- [ ] Documentation is updated

---

## 9. Appendix

### A. Common Test Patterns

```typescript
// Page Object Pattern (Playwright)
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
}
```

### B. Mock Services

```python
# Mock external services
@pytest.fixture
def mock_oracle_service(mocker):
    return mocker.patch('app.services.oracle.get_price', return_value={
        'BTC': 50000,
        'ETH': 3000
    })
```

### C. Test Tags

```python
@pytest.mark.slow
@pytest.mark.integration
def test_full_transaction_flow():
    """Integration test for complete TX flow"""
    pass

@pytest.mark.unit
def test_validate_address():
    """Unit test for address validation"""
    pass
```

---

*Generated for AV11-564: Test Suite Documentation*
