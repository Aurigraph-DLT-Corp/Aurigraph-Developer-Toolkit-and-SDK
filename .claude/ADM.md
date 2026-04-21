# Aurigraph Dev Mode (#ADM) — Complete Framework

> **Updated**: April 22, 2026 | **Version**: 2.6.0 | **Complete Specification**: All 11 components + 0b/0c
> **Harbor Registry**: UP at `j4c.aurigraph.io/harbor` (J4C server 151.242.51.57:2244). Admin: `admin` / `HarborJ4C@2026`. Projects: `aurigraph-v12`, `battua`, `library`. Push via `localhost:5001` on J4C. **Known issue**: registry→core notification sink broken after config volume reset — push completes but artifacts don't appear in Harbor UI/API. Requires `prepare` script re-run to regenerate registry `config.yml`. Production images are deployed directly on DLT server via emergency deploy pattern.
> **Principle**: Unified, autonomous development methodology executed end-to-end without manual intervention
> **NEW (Apr 22, 2026)**: Component 6 Enhancement — **OWASP Dependency-Check Gate**: `failBuildOnCVSS=7` enforced pre-deploy. Suppression file (`dependency-check-suppression.xml`) with mandatory `<notes>` for each false positive. Battua: 19 CVEs → 0 blocking via Quarkus 3.23→3.27.2 upgrade + 7 documented suppressions. Run: `./mvnw org.owasp:dependency-check-maven:12.2.1:check -DfailBuildOnCVSS=7`.
> **NEW (Apr 22, 2026)**: Component 2 Enhancement — **Sprint 3+ Parallel Delivery**: 3 independent features (PSBT BIP-174, MPC guardian recovery, Esplora mainnet) implemented via 3 parallel background agents in single session. +1,432 lines, 6 new endpoints, 20 tests. Pattern: explore → dispatch 3 agents → compile → fix conflicts → commit once.
> **NEW (Apr 22, 2026)**: Component 5 Enhancement — **Quarkus Host-Mount Deploy Pattern**: When docker-compose uses `image: eclipse-temurin:25-jre` with bind-mounted `quarkus-app/`, the deploy path is: `mvn package` → tar quarkus-app/ → SCP → extract to /opt/project/quarkus-app/ → `docker compose down --remove-orphans && up -d --force-recreate`. Docker image build+load is NOT needed (no custom Dockerfile for the app container).
> **NEW (Apr 22, 2026)**: Component 8 Enhancement — **3-Layer AutoHeal Defense**: Docker restart policy (Layer 1) + systemd watchdog timer (Layer 2) + external health monitor (Layer 3). Incident-driven: Provenews was down 12+ hours because watchdog script existed but was never installed on new server. Registry updated with actual server IPs. Post-deploy verification gate added.
> **NEW (Apr 9, 2026)**: Component 2 Enhancement — **Multi-Wave Parallel AAT**: 4+ concurrent AATs per wave across multiple repos with zero-overlap scope boundaries. Proven: 8 AATs across 4 waves = 77 files in ~30 min wall-clock (Session DLT-7 Tier System).
> **NEW (Apr 9, 2026)**: Component 2 Enhancement — **SPARC Sprint Framework**: Specification → Pseudocode → Architecture → Refinement → Completion mapped to parallel AAT waves. Allocate pending tasks to SPARC sprint → execute via 4× #AAT under #ADM.
> **NEW (Apr 9, 2026)**: Component 5-6 Enhancement — **Emergency Deploy Pattern**: When CI runner / Harbor is down: local `mvn package` → SCP jar → `docker build` minimal image on server → `docker compose up --pull never --no-deps` → verify. Codified as INS-DEPLOY-DOCKER-CP.
> **NEW (Apr 9, 2026)**: Component 10 Enhancement — **3-Layer Enforcement Chain**: rate limit (in-memory token bucket, <1ms) → tier gate (@TierRequired annotation, <5ms cached) → quota (atomic DB REQUIRES_NEW + PESSIMISTIC_WRITE). Each layer rejects at cheapest possible point.
> **NEW (Apr 9, 2026)**: Component 10 Enhancement — **Channel-Segmented Contracts**: `channel_id` FK on `active_contracts` table; contracts created in one channel invisible to queries on other channels without separate databases.
> **NEW (Apr 9, 2026)**: **Battua Default Convention**: When `projectType` or `useCaseId` is omitted in SDK registration or minting, defaults to `UC_BATTUA`. All SDK examples, README quickstarts, and tokenize wizard pre-select Battua.
> **NEW (Mar 9, 2026)**: Component 2 — Tier 7 SCMAgent: `pr-review-toolkit:code-reviewer` foreground gate after Approver APPROVED, BEFORE `git commit`. PASS mandatory — commit FORBIDDEN without it.
> **NEW (Mar 9, 2026)**: Component 0b — #PostWaveDocumentation: 6-artifact update MANDATORY after every #AAT Wave Approver APPROVED verdict.
> **NEW (Mar 9, 2026)**: Component 0c — #PostWaveJ4CSync: J4C Insights Journal + Session Memory sync MANDATORY after every wave (no gaps).
> **NEW (Mar 5, 2026)**: #AAT uses Agent tool (subagents) with `run_in_background: true` — NOT tmux. TMUX is ONLY for #ralph-loop long pytest runs (>2 min) and persistent SSH builds (20-30 min docker builds).
> **NEW (Feb 25)**: Component 2 Enhancement — 5-Stream T=0: Tech Arch + SME now concurrent at T=0 with Maker+Checker+QA (Session #71)
> **NEW (Feb 18)**: Component 7 Enhancement — Insights Journal (4th continuity file, living knowledge base INS-XXX)
> **NEW (Feb 18)**: Component 0 Enhancement — Sprint Plan with agent team allocation (wave-based breakdown)
> **NEW (Feb 17)**: Component 10 — Platform-Layer Deployment Governance (prevents infrastructure damage)
> **Source**: J4C Portal (#ADM v2.0.0, glowing-adventure) — Feb 18, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Component 0: Requirements & Design Review](#component-0-requirements--design-review)
3. [Component 0b: #PostWaveDocumentation](#component-0b-postwaveDocumentation)
4. [Component 0c: #PostWaveJ4CSync](#component-0c-postwavej4csync)
5. [Component 1: TDD (Test-Driven Development)](#component-1-tdd-test-driven-development)
6. [Component 2: #AurigraphAgentTeam (7-Tier Validation + SCMAgent)](#component-2-aurigraphagentteam-7-tier-validation)
5. [Component 3: JIRA Auto-Update](#component-3-jira-auto-update)
6. [Component 4: Git Commit + Push](#component-4-git-commit--push)
7. [Component 5-6: Deploy + Verification](#component-5-6-deploy--verification)
8. [Component 7: Session Tracking](#component-7-session-tracking)
9. [Component 8: Auto-Recovery & Runtime Monitoring](#component-8-auto-recovery--runtime-monitoring)
10. [Component 9: Documentation Consolidation](#component-9-documentation-consolidation)
11. [Component 10: Platform-Layer Deployment Governance](#component-10-platform-layer-deployment-governance)
12. [J4C Framework #ADM Integration](#j4c-framework-adm-integration)

---

## Overview

**Definition**: Aurigraph Dev Mode (#ADM) is THE unified development methodology combining requirements analysis, TDD, 4-tier validation, JIRA automation, git workflow, deployment, and runtime resilience—executed autonomously end-to-end.

**Rule**: ALL development follows #ADM by default. This is THE way we build software at Aurigraph.

### 10 Mandatory Components

```
0. Requirements & Design Review (gather → scope → dependencies → confirm)
1. TDD (RED → GREEN → Refactor)
2. #AurigraphAgentTeam (#AAT): 5-stream validation (Maker → Checker → QA → TechArch → SME → Approver, N:N:N:N:N:1)
3. Auto JIRA Update (commit → ticket update → Epic progress)
4. Git Commit + Push (Smart Commits format)
5. Deploy (@J4CDeploymentAgent + self-hosted runners)
6. Deploy Verification (health checks + smoke tests)
7. Session Tracking (session.md + todo.md + infinitecontext.md)
8. Auto-Recovery & Runtime Monitoring (60s failure detection → J4C → recovery → escalation)
9. Documentation Consolidation (keep docs lean, extract frameworks)
10. Platform-Layer Deployment Governance (deploy.yaml + platform deployer, NO direct infrastructure access)
```

### Core Principles

- **#ralphloop (Autonomous)**: Execute end-to-end without manual approval
- **#AurigraphAgentTeam (Quality)**: N:N:N:N:N:1 structure (Maker → Checker → QA → TechArch → SME → Approver) MANDATORY — 5 streams at T=0 (Feb 25, 2026)
- **TDD (Test-First)**: Tests before implementation, always
- **JIRA (Automation)**: Auto-update after phase/wave/sprint
- **Git (Workflow)**: Auto-commit + push with Smart Commits format
- **Deploy (Self-Hosted)**: @J4CDeploymentAgent with self-hosted runners ONLY
- **Track (Continuity)**: session.md + todo.md MANDATORY after every task
- **Recover (Resilience)**: 60-second failure detection, autonomous recovery
- **Document (Lean)**: Rules, pointers, tables — NOT implementations

### When to Use

ALL development tasks (features, bugs, deployments) follow #ADM. No exceptions.

**Skip Component 2 (#AAT) Only For**:
- Research/investigation (no code changes)
- Documentation updates (single file, <100 LOC)
- One-line fixes (verified by tests)

---

## Component 0: Requirements & Design Review

**Rule**: When building ANY feature, implement the COMPLETE stack - not just one layer.

### What "Build a Feature" Means (#CompleteFeatureDevelopment)

- ✅ Backend (API + service + database + migrations)
- ✅ Frontend (list view + detail view + forms + navigation)
- ✅ API docs + tests (unit + integration + E2E)
- ✅ gRPC/Protobuf/HTTP2 (where applicable)
- ✅ Web3/blockchain integration (where applicable)
- ✅ Enterprise features (auth, audit, monitoring, caching, RBAC)

### Mandatory Artifacts (#ADMDocs — #MANDATORY #MEMORIZED)

**Rule**: ALL features and projects MUST produce the following documentation artifacts. No feature is complete without them. Stored in `docs/` under project root.

1. **PRD** (`docs/PRD.md`) — Product Requirements Document
   - **What**: Feature description, user stories, acceptance criteria
   - **Why**: Business value, problem solved, metrics
   - **Who**: Target users, stakeholders
   - **When**: Timeline, dependencies, milestones

2. **Architecture** (`docs/Architecture.md`) — System Design Document
   - Component overview, service boundaries, integration points
   - Tech stack decisions + rationale
   - Data flow diagrams (text/Mermaid)
   - API surface + contract definitions

3. **UML Diagrams** (`docs/diagrams/`) — Visual Design Artifacts
   - Sequence diagrams (key user flows)
   - Component/class diagrams (domain model)
   - State machine diagrams (lifecycle flows)
   - Format: Mermaid markdown (`.md`) or PlantUML (`.puml`)

4. **Database Architecture & Design** (`docs/DatabaseDesign.md`)
   - ER diagram (Mermaid or PlantUML)
   - Table definitions + column types + constraints
   - Index strategy + query patterns
   - Migration plan + rollback strategy

5. **Deployment Document** (`docs/DeploymentGuide.md`)
   - Infrastructure requirements (containers, ports, volumes)
   - Environment variables (reference only — no secrets)
   - Deploy procedure + rollback procedure
   - Health check endpoints + smoke test checklist
   - Monitoring + alerting setup

6. **SPARC Plan**
   - **S**pecification: Detailed technical requirements
   - **P**seudocode: Algorithm design, logic flow
   - **A**rchitecture: System design, components, interactions
   - **R**efinement: Iterative improvements, feedback loops
   - **C**ompletion: Acceptance criteria, definition of done

7. **WBS** (Work Breakdown Structure)
   - 7-phase implementation plan
   - Task dependencies
   - Resource allocation
   - Time estimates

**#ADMDocs QA Gate**: @QAQCAgent verifies all 5 primary docs exist + are non-empty before APPROVED verdict. Missing docs = automatic FAIL.

### 7-Phase Implementation

| Phase | Deliverables | Duration |
|-------|-------------|----------|
| 1. Foundation | Database + Models + Migrations | 1-2 days |
| 2. Backend API | Service + Routes + gRPC + Tests | 2-3 days |
| 3. Frontend UI | List + Detail + Forms + Nav | 3-4 days |
| 4. Integration | Navigation + Web3 + Cross-service | 1 day |
| 5. Enterprise | Security + Performance + Compliance | 1-2 days |
| 6. Testing | Unit + Integration + E2E + Docs | 1-2 days |
| 7. Deployment | Staging + Production + Verification | 0.5-1 day |

**Total**: 9.5-14.5 days for complete feature

### Quality Gates

Each phase requires:
- ✅ Tests passing (unit + integration appropriate to phase)
- ✅ Code review (Checker approval)
- ✅ Documentation updated (inline + API docs)
- ✅ Metrics logged (coverage, performance, security)

**No Partial Implementations**: "Backend only" or "UI only" is NOT acceptable. Every feature must be production-ready end-to-end.

**Enforcement**: Mandatory since Feb 12, 2026. All feature requests follow this framework.

**Framework Location**: `~/.claude/FEATURE_DEVELOPMENT_FRAMEWORK.md` (detailed 7-phase guide)

---

## Component 0b: #PostWaveDocumentation (#MANDATORY #MEMORIZED — Feb 27, 2026 — USER MANDATED)

**Rule**: After EVERY #AAT Wave Approver APPROVED verdict, update ALL 6 documentation artifacts BEFORE closing the JIRA ticket or triggering `/deploy`.

| # | Artifact | Location | What to Update |
|---|----------|----------|----------------|
| 1 | **Database Design** | `<project>/docs/db/` | Add new tables/columns from Flyway migrations; update ERD |
| 2 | **PRD** | `<project>/docs/prd/` | Mark implemented sections `[x]`; update status, metrics |
| 3 | **Architecture** | `<project>/docs/architecture/` | Add new components/services; update sequence diagrams |
| 4 | **UML** | `<project>/docs/uml/` | Add class diagrams for new entities/services; update relationships |
| 5 | **TDD Test Suite** | AAT log + test counts in project CLAUDE.md Status | Record test counts; update combined totals |
| 6 | **Deployment Document** | `<project>/docs/deploy-notes/` | Update version, new env vars, new endpoints, migration steps |

**When to run**: Immediately after `Approver: APPROVED` in each Wave — part of the post-gate steps. Before JIRA close or `/deploy`.

**Enforcement**: This is #ADM Component 0b (after #PreTaskVerificationGate, before JIRA close/deploy). @JIRAAgent must include documentation links in JIRA comment. @code-reviewer auto-FAILs if docs not updated.

**Added**: Feb 27, 2026 (Session #83) | **Canonical location**: `~/.claude/ADM.md` (Component 0b)

---

## Component 0c: #PostWaveJ4CSync (#MANDATORY #MEMORIZED — Feb 28, 2026 — USER MANDATED)

**Rule**: At the end of EVERY Sprint/Wave/Phase — without exception — sync ALL J4C services to keep session memory continuous and unbroken.

**Trigger**: Immediately after #PostWaveDocumentation completes (before JIRA ticket close).

### Sync Checklist (run after EVERY Wave APPROVED verdict)

| # | Action | Target | How |
|---|--------|--------|-----|
| 1 | **Insights Journal** | `Jeeves4Coder/docs/J4C_INSIGHTS_JOURNAL.md` | Crystallize ALL `★ Insight` blocks from session into INS-NNN entries |
| 2 | **Session Memory** | J4C Portal session memory | POST session summary to J4C memory API (continuous, no gaps) |
| 3 | **Insights Count** | Global CLAUDE.md `J4C Insights Journal` table | Update insight count (INS-NNN) after adding new entries |
| 4 | **jiraagent.md** | `Jeeves4Coder/docs/jiraagent.md` | Add JIRA Run entry for tickets processed in this wave |

**Continuity Rule**: J4C session memory MUST be continuous — no session may end without posting to J4C. A session with a gap = audit failure.

**Enforcement**: This is #ADM Component 0c. @JIRAAgent auto-FAILs any wave close that hasn't updated J4C Insights Journal. The word "continuous" means zero gaps — even small sessions get a J4C entry.

**Why**: The J4C Insights Journal is the institutional knowledge base. Gaps mean losing hard-won debugging patterns, architectural decisions, and cross-project learnings forever.

**Added**: Feb 28, 2026 (Session #93) | **Canonical location**: `~/.claude/ADM.md` (Component 0c)

---

## Component 1: TDD (Test-Driven Development)

**Rule**: Write tests FIRST, then implement minimum code to pass tests.

### TDD Workflow

1. **RED Phase** — Write failing test
   - Define expected behavior
   - Write test that fails for the right reason
   - Commit test: `test: Add tests for {feature} - {ticket-key}`

2. **GREEN Phase** — Implement minimum code
   - Make test pass with simplest implementation
   - No premature optimization
   - Focus on single behavior

3. **REFACTOR Phase** — Clean up while tests pass
   - Extract methods, rename variables
   - Improve readability, maintainability
   - Remove duplication
   - Keep tests green

4. **REPEAT** — Next behavior/edge case
   - Iterate for each requirement
   - Build up functionality incrementally

### Test Categories

**Unit Tests** (Fast, Isolated, Deterministic)
- Pure logic, no I/O
- <1s execution each
- 100% repeatable
- Run on every commit

**Integration Tests** (Realistic, Dependencies)
- Database, network, containers
- <10s execution each
- Run on PR, pre-deploy
- Verify component interactions

**Performance Tests** (Benchmarks, Load)
- TPS validation, latency checks
- Run on-demand or nightly
- Establish baselines, track regressions

### Coverage Targets

| Module Type | Target | Enforcement |
|-------------|--------|-------------|
| Critical (crypto, consensus, WAL) | 95%+ | MANDATORY, block merge |
| Business logic | 90%+ | MANDATORY, block merge |
| API/Integration | 85%+ | MANDATORY, block merge |
| UI Components | 80%+ | Recommended |
| Scripts/Tools | 70%+ | Recommended |

### Testing Frameworks

**Java/Quarkus (V11/V12)**:
- JUnit 5 + Mockito (primary)
- REST Assured (API tests)
- TestContainers (integration)

**Python (FastAPI)**:
- pytest with pytest-asyncio
- pytest markers (unit/integration/performance)
- httpx for async HTTP testing

**Node.js/TypeScript**:
- Jest or Vitest
- Supertest (API testing)
- React Testing Library (UI)

### Test Commands (Aurigraph DLT)

```bash
# Java/JUnit (V11 standalone)
./mvnw test -Punit-tests-only -DskipITs    # Unit tests only (pre-commit)
./mvnw test                                  # All tests
./mvnw test -Dtest=SpecificTest              # Single test class
./mvnw test -Dtest=SpecificTest#method       # Single test method

# Python/pytest
pytest tests/                                # All tests
pytest tests/unit/                           # Unit tests only
pytest -x --tb=short                         # Stop on first failure
pytest --cov=app tests/                      # With coverage

# Coverage verification
./mvnw verify -Pcoverage-check               # Fail if <target
```

### Stack-Specific Testing Standards (Feb 18, 2026)

#### Python Backend (FastAPI / J4C Portal)

**Framework**: pytest + pytest-asyncio + httpx

**Directory structure**:
```
tests/
├── unit/           # Pure logic, no I/O — run on every commit
├── integration/    # DB, HTTP, containers — run on PR
└── e2e/            # Full stack — run pre-deploy
```

**Markers** (`pytest.ini` or `pyproject.toml`):
```ini
[pytest]
markers =
    unit: Pure unit tests (no I/O)
    integration: Integration tests (DB, HTTP)
    e2e: End-to-end tests (full stack)
asyncio_mode = auto
```

**Fixture pattern** (`tests/conftest.py`):
```python
import pytest, pytest_asyncio
from httpx import AsyncClient
from app.main import app

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

**Test pattern**:
```python
@pytest.mark.unit
async def test_create_user_returns_201(client):
    response = await client.post("/users", json={"email": "a@b.com"})
    assert response.status_code == 201
```

**Commands**:
```bash
pytest tests/unit/ -m unit                      # Unit only (pre-commit)
pytest tests/ -m "not e2e"                      # Unit + integration (PR)
pytest tests/ --cov=app --cov-report=html       # Coverage report
pytest tests/ -x --tb=short                     # Stop on first failure
```

**Coverage threshold** (`pyproject.toml`):
```toml
[tool.pytest.ini_options]
addopts = "--cov=app --cov-fail-under=85"
```

#### Frontend E2E (Playwright — ALL projects)

**Framework**: @playwright/test

**Install**:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Config** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

**Page Object Model** (`e2e/pages/LoginPage.ts`):
```typescript
import { Page, Locator } from '@playwright/test';
export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  constructor(readonly page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**Test pattern** (`e2e/auth.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
test('admin can log in and reach dashboard', async ({ page }) => {
  const login = new LoginPage(page);
  await page.goto('/login');
  await login.login('admin@example.com', 'password');
  await expect(page).toHaveURL(/dashboard/);
});
```

**Commands**:
```bash
npx playwright test                      # All E2E (headless)
npx playwright test --headed             # Visible browser (debugging)
npx playwright test --reporter=html      # HTML report
npx playwright show-report               # Open HTML report
CI=true npx playwright test              # CI mode (retries, no interactive)
```

#### Node.js Backend (MEV Shield / Express + gRPC)

**Framework**: Jest + Supertest

**Commands**:
```bash
NODE_ENV=test npm test                   # All tests (rate limiter bypassed)
npm test -- --testPathPattern=auth       # Single suite
npm test -- --coverage                   # Coverage report
```

**Key patterns** (MEV Shield lessons — Feb 18, 2026):
- `skip: () => process.env.NODE_ENV === 'test'` on rate limiters (prevents 429)
- `jest.setTimeout(30000)` at top of gRPC test files (HTTP/2 overhead)
- `finished` guard for streaming tests (`cancel()` fires both `end` AND `error`)
- `longs: String` in protoLoader → int64 fields are strings → `Number()` in assertions
- `resetMocks: true` clears `mock.calls` before each test → capture data in `beforeAll`

#### CI Integration (GitHub Actions)

**MANDATORY**: All jobs use `runs-on: self-hosted` — NO cloud runners (ubuntu-latest, etc.).
**DeploymentAgent**: `/deploy` skill invokes @J4CDeploymentAgent (Feb 18, 2026)

```yaml
jobs:
  backend:
    runs-on: self-hosted      # ← ALWAYS self-hosted, never ubuntu-latest
    steps:
      - name: pytest (Python backend)
        run: |
          pip install -r requirements-dev.txt
          pytest tests/ -m "not e2e" --tb=short -q

      - name: Playwright (frontend E2E)
        run: |
          npm ci && npx playwright install --with-deps chromium
          CI=true npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Jest (Node.js backend)
        run: |
          npm ci && NODE_ENV=test npm test -- --coverage
```

### Pre-Commit Hook Pattern

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run unit tests only (fast, <30s)
./mvnw test -Punit-tests-only -DskipITs -q

if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Commit blocked."
    exit 1
fi

echo "✅ Unit tests passed. Commit allowed."
exit 0
```

**Enforcement**: Mandatory for ALL development since Feb 13, 2026. RED → GREEN → REFACTOR is non-negotiable.

---

## Component 2: #AurigraphAgentTeam (5-Stream Validation)

**Alias**: #MakerCheckerQATechArchSMEApprover

**Rule**: ALL development tasks MUST use 5-stream validation. This is THE default quality methodology.

**Replaces**: #PairedProgramming (deprecated Feb 16, 2026) | 4-tier model superseded Feb 25, 2026

**Concurrency Model** (Feb 25, 2026 — Session #71): **5 streams launch at T=0 concurrently**: Makers, Checkers, QA TDD plan, Tech Arch (architecture review), and SME (domain expert review). Approver runs serially in Phase 2 after all Phase 1 streams converge.

**Previous** (Feb 18, 2026): 3 streams (Maker+Checker+QA) at T=0. Now expanded to 5.

**Tooling** (#MEMORIZED — Mar 5, 2026): **Agent tool with `run_in_background: true`** is the MANDATORY parallel execution tool for #AAT. Each stream (Maker, Checker, QA, Tech Arch, SME) is dispatched as a subagent with `run_in_background=True`. The Agent tool provides native LLM parallelism with isolated context windows — no tmux needed.

**TMUX is ONLY for** (narrow exceptions where Claude tool timeout is a risk):
1. `#ralph-loop` long parallel pytest runs (>2 min wall clock, would timeout Claude tool)
2. Persistent SSH builds (docker build 20-30 min on remote server)
Use `BashOutput` to poll tmux pane results when tmux IS used.

### Team Structure: N:N:N:N:N:1 (5 parallel streams + 1 serial Approver)

**Tier 1: Makers (N agents)** — Implementation
- **Role**: Write code following TDD (RED → GREEN → REFACTOR)
- **Output**: Implemented feature with tests passing, self-reviewed
- **Parallel**: Multiple Makers work on independent tasks simultaneously
- **Handoff**: Code + tests → Checker for review

**Tier 2: Checkers (N agents)** — Code Quality Review
- **Role**: Review code quality, patterns, security, performance, RFC 7807 compliance
- **Focus**: Implementation correctness, not functionality testing
- **Parallel**: Each Checker reviews 1 Maker's work (1:1 review ratio)
- **Verdict**: PASS (proceed to QA) | FAIL (return to Maker for fixes)
- **Handoff**: Reviewed code → QA for functional testing

**Tier 3: QA (N agents)** — TDD Test Plan (Phase 1, concurrent) + Functional Testing (Phase 2)
- **Role (Phase 1 — concurrent with Maker+Checker)**: Develop TDD test plan IN PARALLEL — write test cases (happy path + edge + errors + RFC 7807) BEFORE Maker completes; RED test suite ready for handoff
- **Role (Phase 2 — sequential)**: Execute test plan against Checker-approved implementation; verify coverage adequate
- **Parallel**: Each QA agent is dispatched simultaneously with corresponding Maker+Checker (not after)
- **TDD Output (Phase 1)**: RED test suite → handed to Maker on completion so GREEN phase can begin immediately
- **Verdict**: PASS (proceed to Approver) | FAIL (return to Maker for fixes)
- **Handoff**: Tested implementation → Approver for final sign-off

**Tier 4: Tech Arch (N agents)** — Architecture Review (Phase 1, concurrent — Added Feb 25, 2026)
- **Role (Phase 1 — concurrent with Maker+Checker+QA)**: Review architecture decisions, API contracts, data-model choices, integration patterns, and scalability concerns IN PARALLEL — not blocked on Maker completion
- **Focus**: System design correctness, component coupling, registry patterns, DLT consistency
- **Parallel**: 1:1 ratio with Maker domain (one Tech Arch per independent work stream)
- **Output**: Architecture notes + design risks → fed into Approver NFR gate
- **Verdict**: PASS (no arch concerns) | FLAG (arch risk flagged for Approver escalation)

**Tier 5: SME (N agents)** — Domain Expert Review (Phase 1, concurrent — Added Feb 25, 2026)
- **Role (Phase 1 — concurrent)**: Review domain logic correctness — business rules, regulatory compliance, protocol accuracy, and domain-specific edge cases IN PARALLEL
- **Focus**: Business rule enforcement, domain invariants, integration business logic
- **Parallel**: Dispatched at T=0 alongside Maker; does NOT wait for implementation to complete
- **Output**: Domain correctness notes → fed into Approver requirements gate
- **Verdict**: PASS | FLAG (domain concern flagged for Approver)

**Tier 6: Approver (1 agent)** — Final Sign-Off + Requirements + NFR Review
- **Role**: Review ALL work from all 5 Phase 1 streams, final approval for production deployment
- **Focus**: Cross-cutting concerns, integration risks, production readiness, collating Arch+SME flags
- **Serial**: Single authority prevents conflicting approvals
- **Verdict**: APPROVED (→ SCMAgent Phase 3) | REJECTED (return to appropriate tier)
- **Handoff**: APPROVED → SCMAgent for pre-commit code review gate
- **Requirements Review** (Feb 18, 2026 — MANDATORY): Verify ALL functional requirements from spec are implemented and tested. Any unmet requirement = REJECTED.
- **NFR Review** (Feb 18, 2026 — MANDATORY): Verify non-functional requirements are met:

  | NFR Category | What Approver Checks |
  |-------------|---------------------|
  | Performance | Latency targets met (P95 thresholds), throughput benchmarks |
  | Security | OWASP compliance, authentication/authorization, injection prevention |
  | Reliability | Error handling, retry logic, graceful degradation |
  | Scalability | Stateless design, connection pooling, no memory leaks |
  | Observability | Logging (MDC/traceId), metrics, health checks present |
  | Compliance | RFC 7807 errors, gRPC/HTTP2 for real-time, Docker-only deployment |

**Tier 7: SCMAgent (1 agent)** — Claude Code Review + Pre-Commit Gate (#MANDATORY — Mar 9, 2026)
- **Role**: Run `pr-review-toolkit:code-reviewer` against all changed files AFTER Approver APPROVED, BEFORE `git commit && git push`
- **Focus**: Code conventions (CLAUDE.md adherence), security anti-patterns, bugs/logic errors, style guide violations — orthogonal to Approver's intent/NFR review
- **Trigger**: Only runs on Approver APPROVED verdict — skipped if Approver REJECTS
- **Input**: All unstaged/staged changes (`git diff HEAD` scope) with CLAUDE.md as the convention reference
- **Verdict**: PASS → proceed to Component 4 (git commit + push) | FAIL → return to Maker with specific violations
- **Tool**: `Agent(subagent_type="pr-review-toolkit:code-reviewer", ...)` — foreground (blocking), NOT background
- **Scope**: Reviews only recently modified files (not entire codebase) — high-confidence issues only
- **Serial**: Single blocking gate — commit is FORBIDDEN until SCMAgent returns PASS

### Workflow Diagram

```
Task Assignment
    ↓
╔══════════════════════════════════════════════════════════════════════════════════╗
║ PHASE 1 — Concurrent (5 streams, Agent tool run_in_background=True — Mar 2026)  ║
╠══════════╦═══════════╦══════════════╦═══════════════╦══════════════════════════╣
║ Tier 1   ║ Tier 2    ║ Tier 3       ║ Tier 4        ║ Tier 5                   ║
║ Makers N ║ Checkers N║ QA TDD (N)   ║ Tech Arch (N) ║ SME (N)                  ║
║ Implement║ Review    ║ Write plan   ║ Arch review   ║ Domain review            ║
║ TDD      ║ concurrent║ Happy path   ║ API contracts ║ Business rules           ║
║ R→G→R    ║ PASS/fail ║ RFC 7807     ║ DLT patterns  ║ Domain invariants        ║
║          ║           ║ RED → Maker  ║ Scalability   ║ Regulatory fit           ║
╚════╤═════╩═══════════╩══════════════╩═══════════════╩══════════════════════════╝
     │  (all 5 streams converge: Maker done + Checker PASS + QA RED ready + Arch notes + SME notes)
     ↓
╔══════════════════════════════════════════════════════════════════════════════════╗
║ PHASE 2 — Sequential (QA executes plan; Approver reviews all)                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ Tier 3: QA (Phase 2 — execute)                                                  ║
║ - Run RED suite against Checker-approved implementation                         ║
║ - Verify GREEN; check coverage; test edge cases                                 ║
║ - PASS → Approver | FAIL → Maker (rework)                                       ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ Tier 6: Approver (1 agent — serial, reviews ALL 5 streams)                      ║
║ - Requirements Gate: All functional requirements met?                           ║
║ - NFR Gate: Performance, Security, Reliability, RFC 7807, gRPC?                 ║
║ - Arch Gate: Tech Arch flags resolved?                                           ║
║ - Domain Gate: SME domain concerns addressed?                                   ║
║ - APPROVED → SCMAgent (Phase 3) | REJECTED → Fix (gate failure noted)           ║
╚══════════════════════════════╤═══════════════════════════════════════╝
                               ↓
╔══════════════════════════════════════════════════════════════════════════════════╗
║ PHASE 3 — SCMAgent: Claude Code Review Gate (#NEW — Mar 9, 2026)                ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ Tier 7: SCMAgent (1 agent — foreground, blocking pre-commit gate)               ║
║ - Runs pr-review-toolkit:code-reviewer on all changed files (git diff HEAD)     ║
║ - Checks: CLAUDE.md conventions, security anti-patterns, bugs, style            ║
║ - Scope: recently modified files only — high-confidence issues only             ║
║ - PASS → git commit + git push (Component 4) | FAIL → Maker (fix violations)   ║
╚══════════════════════════════╤═══════════════════════════════════════╝
                               ↓
                    Component 4: git commit + push
                               ↓
                          Deployment (/deploy)
```

### Phase 3: SCMAgent Execution (#MANDATORY — Mar 9, 2026)

**Trigger**: Called immediately after Approver APPROVED verdict. BLOCKING — no git commit until PASS.

**Agent Tool Invocation** (foreground — NOT background):
```python
Agent(
    subagent_type="pr-review-toolkit:code-reviewer",
    prompt="""Review all changed files for this sprint.

Files to review: [output of `git diff HEAD --name-only` or `git diff --staged --name-only`]

Check for:
1. Bugs and logic errors (high confidence only)
2. Security vulnerabilities (OWASP Top 10, injection, auth bypass)
3. CLAUDE.md convention violations (project-specific patterns)
4. Code quality issues (dead code, improper error handling, missing null guards)

Return verdict: PASS (proceed to commit) or FAIL (list specific violations with file:line references).
Do NOT flag style preferences — only report issues that would cause bugs or violate project standards."""
)
```

**SCMAgent Decision Gate**:
| Verdict | Action |
|---------|--------|
| **PASS** | Proceed to Component 4 (`git commit && git push`) immediately |
| **FAIL** | Return violations list to Maker → Maker fixes → re-run from Approver Gate |
| **PASS with warnings** | Proceed to commit; attach warnings to commit message body |

**What SCMAgent Reviews** (scope: `git diff HEAD` — recently modified files only):
- CLAUDE.md project conventions (naming, patterns, imports)
- Security: hardcoded secrets, SQL injection, XSS, missing auth checks
- Logic: null dereferences, unchecked array access, off-by-one in critical paths
- RFC 7807: error responses using correct content-type and required fields
- Docker: no bare `apt-get` in RUN without `--no-install-recommends`, `--platform linux/amd64`

**What SCMAgent Does NOT Review** (Checker's domain — already done):
- Code style preferences (formatting, spacing)
- Test coverage quality (QA's domain)
- Architecture decisions (Tech Arch's domain)
- Business logic correctness (SME's domain)

---

### Example: Wave 1 with 5 Tasks

**Team Allocation** (17 agents total):
- **5 Makers**: 1 per task (auth, E2E, monitoring, auto-scaling, benchmarks)
- **5 Checkers**: 1:1 review with each Maker
- **5 QA**: 1:1 testing of each Checker-approved implementation
- **1 Approver**: Final sign-off across all 5 tasks
- **1 SCMAgent**: Claude Code Review gate before commit (NEW — Mar 9, 2026)

**Execution Flow** (Concurrent Model — Feb 18, 2026):
1. **Phase 1 (parallel via tmux)**: Dispatch all 5 Makers + 5 Checkers + 5 QA TDD simultaneously
   - Makers: implement features (TDD RED→GREEN→REFACTOR)
   - Checkers: review concurrently, provide real-time feedback
   - QA: write TDD test plan (happy path + edge + errors + RFC 7807) — RED suite ready before Maker finishes
2. **Phase 2 (sequential)**: As each stream's Phase 1 converges → QA executes test plan (GREEN required)
3. When all 5 QA streams pass → dispatch Approver for final sign-off
4. Approver reviews ALL 5 → Requirements Gate + NFR Gate → APPROVED → Wave 1 deployment

### NOT #PairedProgramming

**Deprecated**: #PairedProgramming (1:1 dev:QA ratio)

**Problems with #PairedProgramming**:
- ❌ Only 2 tiers (dev + QA), no Checker or Approver
- ❌ QA finds code quality issues that should be caught by Checker
- ❌ Wasted QA time on code review instead of functional testing
- ❌ No final cross-cutting review before production

**#AAT Advantages**:
- ✅ Separation of concerns: Checker reviews code, QA tests functionality
- ✅ Multi-stage gates: Catch issues at appropriate tier (cheaper)
- ✅ Single Approver: Prevents conflicting sign-offs, ensures consistency
- ✅ Parallel execution: N Makers work simultaneously on independent tasks
- ✅ Focused reviews: Each tier has clear, non-overlapping responsibilities


### Concurrent Maker:Checker (Hybrid Approach)

**Added**: February 17, 2026 | **Enhancement**: In-process verification for faster feedback loops

**Rule**: Maker and Checker work **concurrently** (in parallel) rather than sequentially. Checker provides real-time feedback during implementation.

#### Problem with Sequential Approach

**Traditional** (Sequential):
```
Maker completes 100% → Checker reviews → Finds issues → Maker reworks → Re-review
```

**Issues**:
- ❌ Late feedback: Problems found AFTER implementation
- ❌ Expensive rework: Changes require re-testing, re-review
- ❌ Long cycle time: Each tier waits for previous to complete
- ❌ Context loss: Maker may have moved to next task

#### Hybrid Concurrent Solution

**Concurrent** (Parallel):
```
Maker implements ║ Checker monitors + reviews checkpoints + prepares tests
        ↓       ║       ↓
    Both complete (synchronized) → QA tests → Approver signs off
```

**Benefits**:
- ✅ **Early feedback**: Checker catches issues during implementation (not after)
- ✅ **Less rework**: Maker corrects immediately with full context
- ✅ **Faster cycle**: Parallelized work reduces total time by 30-40%
- ✅ **Better quality**: Continuous review vs single-point review

#### Four Parallel Streams (Updated Feb 18, 2026)

**Stream 1: Maker Implementation**
- Maker writes code following TDD (RED → GREEN → REFACTOR)
- Commits incrementally to local git (not pushed yet)
- Signals checkpoints at logical boundaries (e.g., "Auth module complete")
- Continues to next component while Checker reviews previous checkpoint

**Stream 2: Checker Monitoring**
- **Passive monitoring**: Watches for new commits/files as Maker works
- **Checkpoint reviews**: At Maker signals, performs formal code review
- **Inline feedback**: Provides comments on specific lines/functions
- **Non-blocking**: Maker continues while Checker reviews (async feedback)

**Stream 3: Checker Test Specification**
- **Parallel work**: While Maker implements, Checker writes test criteria
- **Review checklist**: Creates validation checklist for QA phase
- **Edge cases**: Identifies boundary conditions, error scenarios
- **Security review**: Prepares security validation steps (OWASP, injection, auth)

**Stream 4: QA TDD Test Plan (NEW — Parallel from T=0)**
- **Starts at initialization** (not after Maker/Checker handoff)
- **Purpose**: QA reads requirements and begins Step 1 (TDD Test Plan) immediately
- **Output by T=convergence**: Complete test plan + pre-written test cases (RED phase)
- **Advantage**: QA hands off test cases to Maker mid-stream; Maker implements GREEN while QA validates
- **tmux pane**: QA runs in a dedicated tmux pane alongside Maker/Checker panes (see tmux section)

#### Implementation Pattern

**1. Initialization** (Concurrent spawn — 3 agents at T=0):
```python
# Spawn Maker, Checker, AND QA simultaneously (not sequentially)
maker_task = Task(
    subagent_type="feature-dev:code-architect",
    prompt="Implement Component X following TDD",
    run_in_background=False
)

checker_task = Task(
    subagent_type="pr-review-toolkit:code-reviewer",
    prompt="Monitor Maker's work, provide checkpoint reviews, prepare test specs",
    run_in_background=True  # Non-blocking
)

# QA starts TDD test plan immediately from requirements (does NOT wait for Maker/Checker)
qa_task = Task(
    subagent_type="pr-review-toolkit:pr-test-analyzer",
    prompt="Read requirements and spec. Write Step 1 TDD test plan (happy path + edge + errors + RFC 7807). Write RED-phase test cases. Do NOT wait for Maker — deliver test plan to Maker as checkpoint input.",
    run_in_background=True  # Non-blocking
)
```

**Subagent Dispatch** (MANDATORY — use Agent tool, NOT tmux):
```python
# Launch all 3 streams concurrently via Agent tool in a single message
# Maker
Agent(subagent_type="feature-dev:code-architect", prompt="Implement Component X following TDD...", run_in_background=True)
# Checker
Agent(subagent_type="feature-dev:code-reviewer", prompt="Review Maker's implementation for quality...", run_in_background=True)
# QA
Agent(subagent_type="pr-review-toolkit:pr-test-analyzer", prompt="Write RED test suite for Component X...", run_in_background=True)
# All 3 run in parallel — wait for all to complete, then proceed to Phase 2
```

**2. Checkpoint Sync Points** (Maker signals):
```bash
# Maker completes logical unit
git add src/auth/*.java
git commit -m "checkpoint: Auth module implementation (TDD GREEN)"

# Trigger Checker review
echo "CHECKPOINT: Auth module" >> /tmp/maker-checkpoints.log

# Maker continues to next component (non-blocking)
# Checker reviews auth module in parallel
```

**3. Checker Feedback Loop** (Continuous):
```markdown
# Checker monitors commits, provides inline feedback

Checkpoint: Auth module
├─ ✅ PASS: Tests written first (TDD compliance)
├─ ⚠️  WARNING: Line 45 - Missing null check for user input
├─ ✅ PASS: RFC 7807 error handling present
├─ ⚠️  WARNING: Line 89 - Consider extracting to separate method (complexity)
└─ Action: Maker corrects warnings while Checker continues to next checkpoint
```

**4. Convergence** (All 3 streams complete):
```
Maker finishes implementation (all checkpoints done)
    ║
Checker completes final review + test specs ready
    ║
QA completes TDD test plan + RED-phase test cases
    ↓
Synchronized triple handoff to QA execution phase
    ↓
QA runs full test suite using:
  - Maker's implementation
  - Checker's test specs (edge cases, security)
  - QA's own RED-phase test cases (now turned GREEN)
    ↓
Approver: Final sign-off (requirements met + NFR met — see Approver section)
```

#### Checkpoint Guidelines

**When to Signal Checkpoints** (Maker):
- ✅ After completing a logical module (e.g., "Auth", "Payment", "Notification")
- ✅ Before starting a new architectural layer (e.g., "Service layer done, starting API layer")
- ✅ After major refactoring (e.g., "Extracted helper methods")
- ✅ When uncertain about approach (e.g., "Implemented caching - is this the right pattern?")

**Checkpoint Frequency**:
- **Small tasks** (<2 hours): 2-3 checkpoints
- **Medium tasks** (2-4 hours): 4-6 checkpoints
- **Large tasks** (>4 hours): 8-10 checkpoints (or break into smaller tasks)

**Example Checkpoint Sequence**:
```
Task: Implement User Authentication System (4 hours)

Checkpoint 1 (30 min): "TDD - All auth tests written (RED phase)"
Checkpoint 2 (1 hour): "Auth service implementation (GREEN phase)"
Checkpoint 3 (1.5 hours): "JWT token generation + validation"
Checkpoint 4 (2 hours): "Password hashing + bcrypt integration"
Checkpoint 5 (2.5 hours): "API endpoints + request validation"
Checkpoint 6 (3 hours): "Integration with KeycloakAuthFilter"
Checkpoint 7 (3.5 hours): "Error handling (RFC 7807) + logging"
Checkpoint 8 (4 hours): "REFACTOR - Extracted helper methods, final cleanup"
```

#### Checker Response Protocol

**Review Turnaround**:
- **Target**: 5-10 minutes per checkpoint
- **Maximum**: 15 minutes (Maker may proceed if no response)

**Feedback Categories**:
1. **CRITICAL** (❌): Blocking issue, Maker MUST fix before proceeding
   - Example: Security vulnerability, broken tests, incorrect algorithm
2. **IMPORTANT** (⚠️): Should fix, but can continue
   - Example: Missing error handling, poor naming, complexity
3. **SUGGESTION** (💡): Nice-to-have, optional improvement
   - Example: Alternative pattern, performance optimization idea
4. **PASS** (✅): No issues, proceed
   - Example: Code quality good, tests passing, patterns followed

**Blocking Conditions**:
- ❌ **CRITICAL feedback**: Maker MUST fix before next checkpoint
- ⚠️ **IMPORTANT feedback**: Maker fixes in next checkpoint or at end
- 💡 **SUGGESTION feedback**: Maker decides when to address (can defer)

#### Synchronization Mechanisms

**Option A: File-Based Sync** (Simple):
```bash
# Maker writes checkpoints
echo "CHECKPOINT 1: Auth service complete" >> /tmp/maker-checkpoints.log

# Checker reads checkpoints (polling every 30s)
tail -f /tmp/maker-checkpoints.log | while read checkpoint; do
    review_checkpoint "$checkpoint"
    write_feedback "/tmp/checker-feedback.log"
done

# Maker reads feedback (before each new checkpoint)
cat /tmp/checker-feedback.log | grep "CRITICAL"
```

**Option B: Task Communication** (Recommended):
```python
# Maker signals checkpoint via Task metadata
TaskUpdate(
    taskId="maker-123",
    metadata={
        "checkpoint": "Auth service complete",
        "checkpoint_number": 3,
        "files_changed": ["AuthService.java", "AuthServiceTest.java"]
    }
)

# Checker monitors Task metadata
checker_task = TaskGet(taskId="maker-123")
if checker_task.metadata.checkpoint_number > last_reviewed:
    review_checkpoint(checker_task.metadata.checkpoint)
    provide_feedback()
```

**Option C: Git Commit Messages** (Lightweight):
```bash
# Maker uses special commit message format
git commit -m "checkpoint(auth-service): Implement JWT token validation

[CHECKER-REVIEW-REQUESTED]
Files: AuthService.java, JwtValidator.java
Focus: Token expiration logic, refresh token handling
"

# Checker scans git log for [CHECKER-REVIEW-REQUESTED]
git log --grep="CHECKER-REVIEW-REQUESTED" --since="10 minutes ago"
```

#### Benefits vs Traditional Sequential

**Time Savings**:
- **Sequential**: Maker (4h) → Checker (1h) → Rework (30min) → Re-review (15min) = **5h 45min**
- **Concurrent**: Maker (4h) ║ Checker (1h monitoring + test specs) → Minimal rework (5min) = **4h 5min**
- **Savings**: ~29% faster (1h 40min saved)

**Quality Improvements**:
- **Early issue detection**: 80% of Checker feedback at checkpoints (not after)
- **Reduced rework**: 70% fewer post-implementation changes
- **Better collaboration**: Maker and Checker aligned throughout (not just at end)
- **Test readiness**: QA has Checker's test specs ready (no QA prep time)

#### Migration from Sequential

**Phase 1** (Learn concurrent pattern):
- First 2-3 tasks: Use sequential approach, measure time
- Identify where Checker feedback would have helped earlier

**Phase 2** (Introduce checkpoints):
- Maker signals 2-3 checkpoints per task
- Checker reviews checkpoints (async, non-blocking)
- Measure time savings, quality improvements

**Phase 3** (Full concurrent):
- Maker signals 6-10 checkpoints per task
- Checker prepares test specs in parallel
- QA uses Checker's specs (no duplicate work)

**Phase 4** (Optimize sync mechanisms):
- Implement Task metadata sync (Option B)
- Automated checkpoint detection (git hooks)
- Real-time feedback via file watchers

#### Example: Concurrent Maker:Checker in Action

**Task**: Implement User Registration API (3 hours)

**Timeline**:

**T=0min** (Initialization):
```
Maker spawned: "Implement user registration API with TDD"
Checker spawned (background): "Monitor Maker, checkpoint reviews, prepare test specs"
```

**T=20min** (Checkpoint 1):
```
Maker: "Wrote 15 registration tests (RED phase)" → commits
Checker: Reviews tests, provides feedback in 5 minutes
  ✅ PASS: Test coverage comprehensive
  ⚠️ WARNING: Missing edge case - duplicate email test
Maker: Adds duplicate email test (5 min), continues to implementation
```

**T=60min** (Checkpoint 2):
```
Maker: "Implemented UserService.register() (GREEN phase)" → commits
Checker: Reviews service implementation (10 min)
  ✅ PASS: Tests passing, TDD followed
  ❌ CRITICAL: Password stored in plaintext - must hash with bcrypt
Maker: BLOCKS, fixes password hashing (15 min), re-commits
Checker: Re-reviews fix (5 min)
  ✅ PASS: bcrypt integration correct
Maker: Continues to API layer
```

**T=120min** (Checkpoint 3):
```
Maker: "API endpoint /api/v11/users/register implemented" → commits
Checker: Reviews API layer (8 min)
  ✅ PASS: RFC 7807 error handling present
  ⚠️ IMPORTANT: Missing rate limiting (potential DOS)
  💡 SUGGESTION: Consider adding email verification step
Maker: Notes rate limiting for next checkpoint, continues
```

**T=150min** (Checkpoint 4):
```
Maker: "Added rate limiting + error handling refinement" → commits
Checker: Reviews rate limiting (7 min)
  ✅ PASS: Rate limiting correctly implemented
  ✅ PASS: Error responses follow RFC 7807
Maker: Continues to final cleanup
```

**T=180min** (Convergence):
```
Maker: "REFACTOR - Final cleanup complete, all tests passing"
Checker: Final review (10 min) + test specs ready
  ✅ PASS: Code quality excellent
  ✅ Test specs prepared for QA (20 scenarios)

Handoff to QA:
  - Maker's code (all tests passing, 15 commits)
  - Checker's test specs (20 validation scenarios)
  - 4 checkpoint reviews completed (1 CRITICAL fixed, 2 IMPORTANT noted)
```

**Total Time**: 3h (vs 4h sequential) → **25% faster**
**Quality**: 1 critical security issue caught at T=60min (vs post-implementation)

### Integration with #ADM

**Component 2** of #ADM = #AurigraphAgentTeam
- Maker implements Component 1 (TDD)
- Checker ensures Component 4 (Smart Commits format, RFC 7807)
- **QA starts TDD test plan at T=0 in parallel** (not after handoff) — Component 1 enforcement
- QA verifies Component 7 (tracking updated)
- Approver gates Component 5 (deployment to production) + validates requirements + NFR

**Enforcement**: Mandatory for ALL development since February 16, 2026

### Subagents: Standard #AAT Parallel Execution (Mar 5, 2026 — replaces tmux for #AAT)

**Rule**: ALL #AAT concurrent streams MUST use the `Agent` tool with `run_in_background: true`. tmux is NOT used for #AAT LLM parallelism — the Agent tool already provides this natively.

**Why Agent tool over tmux**:
- ✅ **Native LLM concurrency**: Multiple subagents run simultaneously within one Claude session
- ✅ **Isolated context**: Each subagent has its own context window — no cross-contamination
- ✅ **Structured results**: Subagents return text results that the main session processes
- ✅ **No SSH/tmux overhead**: No terminal sessions to manage, no `tmux attach` required
- ✅ **Resumable**: Agent IDs persist — resume with `resume: agent_id` parameter

**Standard #AAT Subagent Dispatch** (send ALL in a single message for true parallelism):
```python
# CORRECT: All dispatched in ONE message (true parallel)
Agent(subagent_type="feature-dev:code-architect",
      prompt="Implement [feature] with TDD (RED→GREEN→REFACTOR)...",
      run_in_background=True)

Agent(subagent_type="feature-dev:code-reviewer",
      prompt="Review Maker's implementation for quality/security/RFC 7807...",
      run_in_background=True)

Agent(subagent_type="pr-review-toolkit:pr-test-analyzer",
      prompt="Write RED test suite for [feature] spec (happy path + edge + errors + RFC 7807)...",
      run_in_background=True)
```

**TMUX exception** (rare — only when Claude tool timeout is a genuine risk):
```bash
# #ralph-loop: pytest runs >2 min wall clock
tmux new-session -d -s ralph "pytest backend/tests/test_sprintXXX.py -v"
# Check with BashOutput(task_id=...) — do NOT poll with sleep

# SSH docker builds: 20-30 min remote builds
tmux new-session -d -s build "ssh -p 2224 server 'docker build ...'"
```

**Checkpoint sync via shared log file** (visible in all panes):
```bash
# Maker writes checkpoints
echo "[$(date +%H:%M)] CHECKPOINT 3: Auth service GREEN" >> /tmp/aat-checkpoints.log

# Other panes tail the log
tail -f /tmp/aat-checkpoints.log
```

**Quick start alias** (add to `~/.zshrc`):
```bash
alias aat-session='tmux new-session -d -s aat -x 220 -y 60 && tmux split-window -h && tmux split-window -v -t 0 && tmux split-window -v -t 1 && tmux select-layout tiled && tmux attach -t aat'
```

### QA Agent: 3-Step TDD Process (Updated Feb 17, 2026)

**Rule**: QA Agents MUST perform all 3 steps below. Skipping any step = automatic FAIL. Passes to Approver ONLY after all tests are GREEN.

**Added**: February 17, 2026 | **Source**: #ADM enhancement from live session feedback

#### Step 1 — Write TDD Test Plan

Before running a single test, QA writes a structured test plan enumerating:

| Category | What to enumerate |
|----------|-------------------|
| Happy Path | All success scenarios with expected response codes and body fields |
| Edge Cases | Boundary values, empty inputs, max limits, pagination extremes |
| Error Cases | Missing required fields, invalid formats, unauthorized access, not-found |
| RFC 7807 Compliance | Content-Type: application/problem+json, all 11 mandatory fields present |
| Thread Safety | Concurrent mutation scenarios for shared in-memory state |
| Integration | Multi-step flows (e.g., create → read → update → delete) |

**Output**: Written test plan (markdown) listing every test scenario with: input, expected status code, expected response body fields.

#### Step 2 — Write/Augment Unit Test Cases (RED Phase)

Based on the test plan, QA identifies **missing test scenarios** not covered by existing tests:
- Writes new `@Test` methods for uncovered scenarios
- Runs the new tests first to confirm they fail (RED — behavior not yet implemented) OR identifies which existing tests cover each plan scenario
- Target: All scenarios from Step 1 must have corresponding test methods

**Output**: New test methods added (or verification that existing tests cover each scenario), all running in RED before checking if the implementation makes them GREEN.

#### Step 3 — Run Full Test Suite

```bash
# From the module directory (e.g., aurigraph-v12/)
./mvnw test -Dtest="<TestClass1>,<TestClass2>..."

# Expected: BUILD SUCCESS, 0 failures, 0 errors, 0 unexpected skips
```

**Verdict rules**:
- **PASS to Approver**: All tests GREEN, no critical issues, QA Score ≥ 85/100
- **CONDITIONAL PASS**: All tests GREEN, IMPORTANT issues noted, QA Score 70-84/100
- **FAIL → Return to Maker**: Any test FAILS, CRITICAL issues found, QA Score < 70/100

**QA Verdict Format** (MANDATORY):
```
QA VERDICT: [PASS | CONDITIONAL PASS | FAIL]
QA SCORE: [0-100]/100

STEP 1 — TDD TEST PLAN:
[Happy Path | Edge Cases | Error Cases | RFC 7807 | Thread Safety | Integration]

STEP 2 — COVERAGE GAPS:
[List any missing test coverage; "None" if fully covered]

STEP 3 — TEST RESULTS:
Tests run: X, Failures: 0, Errors: 0 — BUILD SUCCESS [or FAILURE]

CODE QUALITY ISSUES:
[CRITICAL | IMPORTANT | MINOR] — description

RECOMMENDATION: [Pass to Approver | Return to Maker for rework]
```

**Score thresholds**: PASS ≥ 85, CONDITIONAL PASS 70-84, FAIL < 70

**CRITICAL issues** = automatic FAIL (no exceptions):
- RFC 7807 non-compliance (wrong Content-Type, missing mandatory fields)
- Test failures (any test FAIL or ERROR)
- Thread-safety violations on shared mutable state
- Missing `extends BaseResource` or `setupMDC()` calls

---

## Component 2b: #AAT Activity Logging (#MANDATORY #MEMORIZED — Feb 25, 2026 — USER MANDATED)

**Rule**: ALL #AAT activities MUST be logged to a structured activity log. The log MUST be:
1. **Created** at #AAT T=0 as `logs/aat-{sprint-id}-{YYYYMMDD}.log`
2. **Attached** to the JIRA ticket as a comment/attachment after Approver APPROVED
3. **Committed** to GitHub alongside the code in the same git commit

### Activity Log Format

```
# #AAT Activity Log — {Sprint ID} — {Date}
# Epic: {JIRA Epic}  Branch: {git branch}  Session: #{N}

[T=0    ] {ISO8601} | Approver   | Released requirements to Maker+Checker+QA+TechArch+SME
[T+0m   ] {ISO8601} | Maker-A    | STARTED  | {task description}
[T+0m   ] {ISO8601} | Maker-B    | STARTED  | {task description}
[T+0m   ] {ISO8601} | Checker-A  | STARTED  | {concurrent review}
[T+0m   ] {ISO8601} | QA-A       | STARTED  | {TDD test plan}
[T+0m   ] {ISO8601} | TechArch   | STARTED  | {architecture review}
[T+0m   ] {ISO8601} | SME        | STARTED  | {domain review}
...
[T+Xm   ] {ISO8601} | Maker-A    | COMPLETE | {files changed, tests added}
[T+Xm   ] {ISO8601} | Checker-A  | PASS     | {issues found: N}
[T+Xm   ] {ISO8601} | QA-A Phase2| PASS     | {N/N tests green, coverage XX%}
[T+Xm   ] {ISO8601} | TechArch   | PASS|FLAG | {arch notes}
[T+Xm   ] {ISO8601} | SME        | PASS|FLAG | {domain notes}
[T+Xm   ] {ISO8601} | Approver   | APPROVED | {verdict summary}
[T+Xm   ] {ISO8601} | Git        | COMMITTED| {commit SHA}
[T+Xm   ] {ISO8601} | JIRA       | UPDATED  | {tickets transitioned to Done}
[T+Xm   ] {ISO8601} | Log        | ATTACHED | {JIRA comment added, log committed to GitHub}
```

### Log Creation Rules

1. **File location**: `docs/aat-logs/aat-{sprint-id}-{YYYYMMDD}.md` in project root (`.md` extension, `docs/aat-logs/` dir)
   - **CRITICAL**: `logs/` and `*.log` are gitignored in Aurigraph-DLT repo — use `docs/aat-logs/*.md` instead (#INS-091, Feb 25, 2026)
2. **One log per sprint** (not per agent): single file, all 5+ streams append to it
3. **Append-only**: Never overwrite; each entry has ISO8601 timestamp
4. **Git commit**: Include log file in the SAME commit as code changes
5. **JIRA attachment**: After Approver APPROVED, post log as JIRA comment (truncated if >5000 chars) and attach full file
6. **Log naming convention**: `docs/aat-logs/aat-AV11-S1-20260225.md`, `docs/aat-logs/aat-AV11-S2-20260225.md`

### JIRA Comment Template for Log Attachment

```
#AAT Sprint Log — {Sprint ID} ({Date})
---
Streams: Maker × N, Checker × N, QA × N, TechArch × 1, SME × 1, Approver × 1
Duration: T=0 to T={Xm}
Result: {APPROVED | REJECTED}
Stories: {N} stories implemented, {M} tests added, coverage {X}%
Git: {commit SHA}
---
[full log attached as logs/aat-{sprint-id}-{date}.log in commit {SHA}]
```

### Enforcement

- **Approver CANNOT issue APPROVED verdict** without confirming log file exists at `docs/aat-logs/`
- **git commit MUST include** `docs/aat-logs/aat-*.md` file alongside code changes
- **JIRA MUST have** log comment posted by @JIRAAgent before ticket transitions to Done
- Missing log = automatic FAIL at Approver gate (same as missing tests)

---

## Component 3: JIRA Auto-Update

**Rule**: JIRA tickets MUST be created, tracked, tested, verified, and closed automatically after every phase, wave, and sprint.

**Purpose**: Automate complete JIRA ticket lifecycle with TDD, #AurigraphAgentTeam, GitHub integration, and Epic consolidation.

**Workflow Specification**: See `~/.claude/JIRA_AGENT_WORKFLOW.md` for complete 1,000+ line specification

### Core Workflow (6 Stages)

**1. Epic Creation** (Sprint/Phase Start)
- Create Epic with comprehensive description, story points, labels
- Define Stories under Epic (1 story = 1 logical unit of work)
- Link Stories to Epic via labels or Epic Link field

**2. TDD Test Creation** (Before Implementation)
- Write failing tests first (RED phase)
- Cover: unit, integration, functional, performance
- Commit tests: `test: Add tests for {ticket-key} - {feature}`
- Coverage targets: Critical 95%+, Business 90%+, API 85%+

**3. Implementation with #AurigraphAgentTeam** (GREEN phase)
- Maker agent: Implement minimum code to pass tests
- Checker agent: Review code quality, security, patterns (1:1 ratio)
- QA agent: Test functionality, coverage, edge cases (1:1 ratio)
- Approver: Final sign-off for production deployment
- #RalphLoop: Autonomous execution (Maker → Checker → QA → Approver → verify)
- Commit format: `{type}({ticket-key}): {summary}\n\nJIRA: {ticket-key}`

**4. Automated Testing & Verification**
- Run full test suite (unit + integration + functional)
- Verify coverage meets targets
- Performance benchmarks (if applicable)
- Security scans (dependency check, container scan)

**5. GitHub Integration & JIRA Update** (#CRITICAL — NON-SKIPPABLE)
- Link commit to JIRA via Smart Commits (`{ticket-key} #comment`)
- Update JIRA ticket with: commit SHA, tests passing, coverage %, QA score
- Add labels: `completed-{sprint}`, `qa-approved`, `tests-passing`
- **MANDATORY**: Run `python3 add_github_links.py` — embeds GitHub branch link in EVERY JIRA ticket
  - This CANNOT be skipped. JIRA tickets without GitHub branch links are incomplete.
  - Run after EVERY ticket creation, regardless of sprint size
- Transition ticket to Done

**6. Epic Consolidation & Sprint Reporting**
- Generate sprint report (tickets completed, metrics, QA scores)
- Update Epic with progress (completion %)
- Create `SPRINT_S{number}_SUMMARY.md` document
- Archive to `infinitecontext.md`
- Transition Epic to Done when all stories complete

### Execution Patterns

**Single Ticket** (30 min - 2 hours):
```
Fetch ticket → Write tests (RED) → Implement (GREEN) → Checker review →
QA test → Approver sign-off → Run tests → Verify coverage →
Commit with JIRA tag → Update JIRA → Transition to Done
```

**Wave-Based Parallel** (2-4 hours, multiple tickets) — Updated Feb 25, 2026 (Session #71):
```
T=0: Dispatch simultaneously (5 streams in parallel via tmux):
  ║ N Maker agents     (implement, TDD RED→GREEN→REFACTOR)
  ║ N Checker agents   (1:1, concurrent checkpoint reviews)
  ║ N QA agents        (1:1, TDD test plan from requirements — do NOT wait for Maker)
  ║ N Tech Arch agents (1:1, architecture review — API contracts, DLT patterns, scalability)
  ║ N SME agents       (1:1, domain review — business rules, domain invariants, regulatory fit)
  ↓ (all 5 streams converge)
T=convergence: QA executes full test suite (using Maker impl + Checker specs + QA test plan)
  ↓
T=final: 1 Approver — requirements + NFR + Arch + Domain + final sign-off
  ↓
Consolidate: Update all JIRA tickets, update Epic progress
```

**Note**: 3-tier (Maker+Checker+QA) model DEPRECATED Feb 25, 2026 (Session #71). 5-stream T=0 model is now canonical. Approver is Tier 6 (was Tier 4).

**Multi-Wave Parallel AAT** (Apr 9, 2026 — Session DLT-7):
```
4+ concurrent AATs per wave, zero-overlap scope boundaries.
Each AAT writes to non-overlapping file paths — no merge conflicts.

Wave 1 (Foundation):    4 AATs → entities + repos + services + migrations
Wave 2 (Endpoints):     2 AATs → REST resources + NGINX blocks
Wave 3 (Portal):        1 AAT  → React pages + hooks + components
Wave 4 (SDK):           1 AAT  → TS + Java client methods

Total: 8 AATs, 4 waves, ~30 min wall-clock for 77 files.

Critical rule: WRITE shared foundation files (records, annotations)
BEFORE launching parallel agents that reference them. This eliminates
cross-agent compile dependencies.
```

**SPARC Sprint Framework** (Apr 9, 2026 — Session DLT-7):
```
Allocate ALL pending tasks to a SPARC sprint → execute via 4× #AAT:

  S = Specification   (audit + gap analysis from prior session)
  P = Pseudocode      (prompt descriptions for each AAT)
  A = Architecture    (file path + scope boundaries, zero overlap)
  R = Refinement      (agents read existing patterns before writing)
  C = Completion      (commit + deploy + verify)

Each AAT is a self-contained SPARC cycle that executes in parallel.
Pattern: user says "allocate pending to SPARC sprint" → create tasks
→ launch 4 AATs → commit as each lands → push → deploy.
```

**Emergency Deploy Pattern** (Apr 9, 2026 — when CI/Harbor is DOWN):
```
1. Build locally:     ./mvnw package -DskipTests (uber-jar or quarkus-app)
2. SCP to server:     scp -P 2244 target/*.jar subbu@server:/tmp/
3. Build image:       docker build -t <harbor-tag>:latest . (on server)
4. Start stack:       docker compose up -d --pull never --no-deps app
5. CRITICAL: start postgres+redis FIRST, wait for healthy, then app
6. Portal: COPYFILE_DISABLE=1 tar czf (on Mac) → scp → extract → chmod 644 → restart
```
Codified as INS-DEPLOY-DOCKER-CP. Use ONLY when Harbor registry or CI runner is down.

**3-Layer Enforcement Chain** (Apr 9, 2026 — SDK Tier System):
```
Layer 1: SdkApiKeyAuthFilter (priority 900)
  → Identity + in-memory token bucket rate limit
  → Rejects in <1ms, no DB hit

Layer 2: TierEnforcementInterceptor (@Priority AUTHORIZATION+1)
  → @TierRequired annotation check (tier level, KYC, token type)
  → Rejects in <5ms, reads from 60s cached SdkRequestContext

Layer 3: UsageTrackingService (inside endpoint)
  → Atomic REQUIRES_NEW + PESSIMISTIC_WRITE quota check
  → Only for mutating operations (mint, DMRV, composite)
  → Rejects with 429 + retryAfter

Each layer rejects at the cheapest possible point.
```

**Sprint-Level #RalphLoop** (2-5 days, complete Epic):
```
Create Epic + Stories → Execute Waves 1-N → Consolidate + Report →
GitHub Release → Archive to infinitecontext.md → Transition Epic to Done
```

### Frequency & Triggers

**Automatic Triggers** (MANDATORY):
- **After Every Phase** (1-2 hours): Update JIRA tickets, run tests, commit
- **After Every Wave** (2-4 hours): Consolidate commits, update Epic, generate wave summary
- **After Every Sprint** (1-7 days): Generate sprint report, create GitHub release, archive to infinitecontext.md

**Manual Triggers**:
- User requests: "Update JIRA tickets", "Generate sprint report", "Close completed tickets"
- Pre-deployment: Verify all tickets in deployment are Done
- Post-incident: Update related tickets with root cause analysis

### JIRA API Integration

**Authentication**: API Token from `Credentials.md`

**Common Operations**:
- Create Epic: `POST /rest/api/3/issue` with `issuetype: {"id": "10995"}`
- Create Story: `POST /rest/api/3/issue` with `issuetype: "Story"`, link via labels
- Add Comment: `POST /rest/api/3/issue/{ticket-key}/comment` (ADF format)
- Transition: `POST /rest/api/3/issue/{ticket-key}/transitions`
- Add Labels: `PUT /rest/api/3/issue/{ticket-key}` with `update.labels`
- Query Epic Stories: `GET /rest/api/3/search?jql=parent={epic-key}`

### GitHub Integration

**Smart Commits**: `{ticket-key} #comment {text}`, `{ticket-key} #time {duration}`, `{ticket-key} #close`

**Webhooks**: GitHub push → JIRA comment (commit SHA), JIRA status change → GitHub issue

**Commit Format**:
```bash
{type}({ticket-key}): {summary}

{detailed description}

- Test coverage: {coverage}%
- Checker Score: {score}/100
- QA Score: {score}/100
- Reviewed by: {checker-id}, {qa-id}

JIRA: {ticket-key}
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Wave Epic Structure (#MEMORIZED — Feb 15, 2026)

**Achievement**: Automated 4-wave JIRA Epic structure creation for 60-ticket implementation plan with complete linkage and labeling.

#### Epic Creation Requirements (#CRITICAL)

**JIRA API v3 Format** (ALL 3 Required):

1. **Issue Type ID**: `{"id": "10995"}` — NOT `{"name": "Epic"}`
   - Wrong: `"issuetype": {"name": "Epic"}` → 400 Bad Request
   - Correct: `"issuetype": {"id": "10995"}` → Success
   - Fetch ID via: `GET /rest/api/3/issue/createmeta?projectKeys={PROJECT}&issuetypeNames=Epic&expand=projects.issuetypes.fields`

2. **Atlassian Document Format (ADF)** for descriptions:
   ```json
   {
     "type": "doc",
     "version": 1,
     "content": [{
       "type": "paragraph",
       "content": [{"type": "text", "text": "Description text"}]
     }]
   }
   ```
   - Plain strings NOT accepted for description field
   - ADF is structured JSON, not markdown or HTML

3. **Epic Hierarchy Constraint**: Epics CANNOT be children of other Epics
   - Cannot link Epic to Epic via `parent` field (400 error)
   - Solution: Use labels for logical grouping (`wave1`, `wave2`, `wave3`, `wave4`)
   - Stories/Tasks/Sub-tasks CAN be children of Epics

#### Rate Limiting Best Practices

**JIRA Cloud API Limits**:
- 100 requests/10 seconds per user (default tier)
- Burst: Up to 200 requests in short bursts
- Exceeded: 429 Too Many Requests with Retry-After header

**Safe Pattern**:
```python
import time

for ticket in tickets:
    # Perform API operation
    response = requests.post(url, ...)

    # Rate limit: Wait 100-200ms between calls
    time.sleep(0.1)  # 100ms = 10 requests/second (safe)
```

**Why 100-200ms**:
- 100ms = 10 req/sec (well under 100 req/10sec limit)
- 200ms = 5 req/sec (ultra-safe, use for bulk operations)
- Allows for burst traffic without hitting rate limits

### Documentation & Reporting

**Sprint Summary Template**: `SPRINT_S{number}_SUMMARY.md`
- Tickets completed with metrics (SP, duration, Checker score, QA score, commits)
- Code metrics (files modified, LOC added/deleted, commits)
- Test metrics (total tests, pass rate, coverage %)
- QA review (avg score, critical/important issues)
- GitHub commits and JIRA tickets (with links)
- Lessons learned and next sprint preview

**Enforcement**: Mandatory since Feb 13, 2026. JIRAAgent runs automatically after every phase/wave/sprint.

---

## Component 4: Git Commit + Push

**Rule**: ALL commits MUST follow Smart Commits format with JIRA ticket references.
**Gate (#MANDATORY — Mar 9, 2026)**: SCMAgent (Phase 3) MUST return PASS before ANY `git commit` is executed. Committing without SCMAgent PASS is a #ADM violation.

### Pre-Commit Checklist

| Gate | Requirement | Enforced By |
|------|-------------|-------------|
| Approver APPROVED | Phase 2 Approver sign-off obtained | Approver (Tier 6) |
| **SCMAgent PASS** | Claude Code Review returned PASS | SCMAgent (Tier 7) |
| JIRA ticket referenced | Commit message contains ticket key | Smart Commits format |
| Tests green | All tests pass locally | Pre-commit hook |
| Staged files explicit | `git add <files>` by name | Git Safety Protocol |

### Smart Commits Format

```bash
{type}({ticket-key}): {summary}

{detailed description}

- Test coverage: {coverage}%
- Checker Score: {score}/100 (code quality review)
- QA Score: {score}/100 (functional testing)
- SCM Review: PASS (Claude Code Review — pr-review-toolkit:code-reviewer)
- Reviewed by: {checker-agent-id}, {qa-agent-id}, SCMAgent

JIRA: {ticket-key}
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Type Options**:
- `feat`: New feature
- `fix`: Bug fix
- `test`: Test additions/modifications
- `refactor`: Code restructuring (no behavior change)
- `docs`: Documentation changes
- `perf`: Performance improvements
- `chore`: Maintenance (dependencies, build config)

### Git Safety Protocol

**NEVER** (unless explicitly requested):
- ❌ `git push --force` to main/master
- ❌ `git reset --hard` (data loss)
- ❌ `git checkout .` (discard all changes)
- ❌ `git clean -f` (delete untracked files)
- ❌ `git commit --amend` after push (history rewrite)
- ❌ Skip hooks (`--no-verify`, `--no-gpg-sign`)
- ❌ **`git commit` before SCMAgent PASS** (Mar 9, 2026 — new rule)

**ALWAYS**:
- ✅ Stage specific files by name (NOT `git add -A` or `git add .`)
- ✅ Create NEW commits (NOT amend, unless pre-commit hook requires)
- ✅ Run tests before commit (pre-commit hook)
- ✅ Verify JIRA ticket reference in commit message
- ✅ Await SCMAgent PASS (Phase 3) before committing
- ✅ Push after successful tests

### GitHub-JIRA Branch Integration (#MEMORIZED — Feb 15, 2026)

**Rule**: ALL JIRA tickets with code commits MUST have GitHub branch links in comments

**Tool**: `add_github_links.py` — Automatic GitHub integration comment generator

**Workflow**:
1. Scan git history for commits with JIRA ticket references (`AV11-\d+`)
2. Check if ticket already has "GitHub Integration" comment
3. Add comment with branch link + commit list (up to 15 commits)
4. Format: ADF (Atlassian Document Format) with clickable GitHub links

**Example Comment**:
```
*GitHub Integration*
Branch: [V12](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/tree/V12)

*Commits:*
• [abc123de|https://github.com/.../commit/abc123de] - feat(AV11-1234): Add feature
• [def456ab|https://github.com/.../commit/def456ab] - test(AV11-1234): Add tests
... and 3 more commits

Total commits: 5
```

**Usage**:
```bash
python3 add_github_links.py  # Scans all commits, adds links to tickets
```

**Benefits**:
- Complete traceability: JIRA ticket → GitHub commits → Code changes
- No manual linking needed (automated via script)
- Prevents orphaned tickets (tickets without code visibility)
- Supports #ADM Component 3 (JIRA Auto-Update)

**Enforcement (#CRITICAL — #MEMORIZED — Feb 20, 2026)**:
- **MANDATORY** after EVERY ticket creation: `python3 add_github_links.py`
- **NON-SKIPPABLE**: Tickets without GitHub branch links are NOT complete
- **Automatic check**: Run after any commit that creates/closes a JIRA ticket
- **Backfill**: If skipped, run immediately — the script handles duplicates safely (idempotent)
- **DO NOT** create a JIRA ticket and consider it "done" without running this script
- Violation = incomplete ticket → #AAT Approver must reject the work item

---

## Component 5-6: Deploy + Verification

**Rule**: ALL production deployments MUST use @J4CDeploymentAgent with self-hosted runners.

### /deploy Command (#MEMORIZED #MANDATORY)

**Rule**: The `/deploy` command MUST use **Aurigraph Deployment Mode** (Platform-Layer) ONLY.

```bash
/deploy                       # Default production (uses Platform-Layer)
/deploy --target staging      # Staging (uses Platform-Layer)
/deploy --test                # Smoke tests only
/deploy --rollback            # Rollback (uses Platform-Layer)
```

**Deployment Method**: Aurigraph Deployment Mode (Platform-Layer)
- **Mechanism**: `sudo /opt/platform/deploy.sh deploy.yaml`
- **Configuration**: Declarative `deploy.yaml` file
- **Pre-Checks**: Infrastructure validation (server, Docker, resources, network, SSL, env vars)
- **Post-Checks**: Container health, Harbor registry versions, resource usage, connectivity, logs, performance
- **Rollback**: Automatic on health check failure

**Location**: `~/.claude/commands/deploy.md`
**Targets**: provenews (default), www.aurigraph.io, dlt.aurigraph.io, j4c.aurigraph.io, mevshield.ai

**Enforcement**: Mandatory since February 17, 2026 - NO direct docker-compose/nginx/systemctl commands allowed

### Deployment Rules (#MEMORIZED #CRITICAL)

**INS-* Docker/NGINX/Build gotchas**: See `~/.claude/DEPLOYMENT_GOTCHAS.md`

1. **Docker-Only**: ALL services in docker-compose. NO bare metal NGINX/PM2/supervisor.
2. **Incremental Only**: Deploy ONLY changed services. Full deploy only for schema/API changes.
3. **Self-Hosted Runners**: ALL GitHub Actions jobs use self-hosted runners by default — tests, builds, AND deploys. NO cloud runners (ubuntu-latest, etc.). Label: `runs-on: self-hosted`. (Updated Feb 18, 2026)
4. **NGINX Validate Before Reload**: `nginx -t` THEN `nginx -s reload` THEN verify HTTPS. NEVER reload without validation.
5. **Cache Cleanup**: Redis FLUSHALL + NGINX reload (after validation) + verify no-cache headers.
6. **Health Checks**: 15 smoke tests (5 HTTPS + 5 REST + 5 gRPC). Auto-rollback on failure.
7. **Single docker-compose.yml**: ONE file per project. Override via env vars, NOT duplicate files.
8. **JIRA Update**: Auto-update tickets post-deploy with commit hash, timestamp, labels.
9. **Docker Platform**: ALL images built with `--platform linux/amd64` (production servers are AMD64/Intel).
10. **Remote Build Strategy**: Pull from GitHub to server, build on server (NOT locally).
11. **@J4CDeploymentAgent via Self-Hosted Runners**: GitHub Actions with self-hosted runners ONLY.
12. **SSL/TLS Certificates**: NEVER use Let's Encrypt/certbot. ONLY user-provided certificates from credentials.md.
13. **Docker Compose Stack Startup**: Start all services with health monitoring. Alert if any container fails. ALWAYS run `docker-compose down --remove-orphans` before `docker-compose up -d` to prevent orphan containers.
14. **Environment Variable Configuration**: Use `.env` files in same directory as docker-compose.yml. Docker Compose auto-loads .env files. MUST use `docker-compose up -d --force-recreate` to apply .env changes (restart does NOT reload env vars). For PostgreSQL: `POSTGRES_PASSWORD` only affects initial creation—use `ALTER USER` for existing databases.

### @J4CDeploymentAgent Workflow

**Triggers**:
1. Push to main (paths: `src/**`, `backend/**`, `docker-compose*.yml`, `Dockerfile`)
2. Manual `workflow_dispatch` with environment selection (production/staging)

**Steps**:
1. Stop containers: `docker-compose down`
2. Sync code: `rsync -avz --delete {local} {remote}`
3. Build images: `docker build --platform linux/amd64 --no-cache`
4. Start services: `docker-compose up -d`
5. Smoke tests: 15 endpoints (5 HTTPS + 5 REST + 5 gRPC)
6. Rollback: On failure, revert to previous version

**Self-Hosted Runner Requirements**:
- Docker + docker-compose installed
- rsync for code sync
- Correct deployment path ownership (user:group)
- Network access to target servers

**Target Servers**:
- j4c.aurigraph.io (j4c runner)
- dlt.aurigraph.io (dlt runner)
- www.aurigraph.io (www runner)

**Workflow Location**: `.github/workflows/deploy-{project}-docker.yml`

### Deploy Verification (Component 6)

**Health Checks** (15 smoke tests):
```bash
# HTTPS (5 tests)
curl -k https://{domain}/
curl -k https://{domain}/health
curl -k https://{domain}/api/v11/health
curl -k https://{domain}/api/status
curl -k https://{domain}/metrics

# REST API (5 tests)
curl https://{domain}/api/v11/transactions
curl https://{domain}/api/v11/channels
curl https://{domain}/api/v11/nodes
curl https://{domain}/api/v11/contracts
curl https://{domain}/api/v11/tokens

# gRPC (5 tests)
grpcurl -plaintext {domain}:9004 list
grpcurl -plaintext {domain}:9004 io.aurigraph.v11.Health/Check
grpcurl -plaintext {domain}:9004 io.aurigraph.v11.Transactions/List
grpcurl -plaintext {domain}:9004 io.aurigraph.v11.Channels/List
grpcurl -plaintext {domain}:9004 io.aurigraph.v11.Consensus/GetStatus
```

**Container Health**:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"  # All "healthy" or "running"
docker stats --no-stream  # CPU < 80%, Memory < 80%
```

**Auto-Rollback Conditions**:
- Any smoke test fails (HTTP 5xx, timeout, connection refused)
- Any container unhealthy or restarting
- HTTPS not responding on port 443
- Health endpoint returns non-200 status

**Rollback Command**:
```bash
docker-compose down
git checkout {previous-commit}
docker-compose up -d
# Re-run smoke tests
```

**Pre-Deploy Checklist**:
- ✅ No bare metal NGINX
- ✅ Docker healthy
- ✅ Self-hosted runner configured
- ✅ Certificates readable
- ✅ Health endpoint verified

**Post-Deploy Checklist**:
- ✅ All containers healthy
- ✅ HTTPS 200
- ✅ API responding
- ✅ Cache flushed
- ✅ 15/15 smoke tests pass
- ✅ No container restarts

**Enforcement**: Mandatory for ALL production deployments since Feb 15, 2026.

### Pre-Deployment Infrastructure Checks (#MANDATORY — Feb 17, 2026)

**Rule**: ALL deployments MUST validate server infrastructure BEFORE attempting deployment.

**1. Server Connectivity & Access**:
```bash
# SSH accessibility
ssh -o ConnectTimeout=5 $SERVER "echo 'SSH OK'" || { echo "FAIL: SSH inaccessible"; exit 1; }

# User permissions
ssh $SERVER "sudo -n true" || { echo "FAIL: No sudo access"; exit 1; }
```

**2. Docker Infrastructure**:
```bash
# Docker daemon health
ssh $SERVER "docker info" || { echo "FAIL: Docker daemon not running"; exit 1; }

# Docker Compose availability
ssh $SERVER "docker-compose version" || { echo "FAIL: docker-compose not installed"; exit 1; }

# Docker storage
ssh $SERVER "df -h /var/lib/docker | awk 'NR==2 {if (\$5+0 > 90) exit 1}'" || { echo "FAIL: Docker storage >90%"; exit 1; }
```

**3. System Resources**:
```bash
# Disk space (>10GB free required)
ssh $SERVER "df -BG /opt | awk 'NR==2 {if (\$4+0 < 10) exit 1}'" || { echo "FAIL: <10GB free"; exit 1; }

# Memory available (>2GB free required)
ssh $SERVER "free -g | awk '/Mem:/ {if (\$7+0 < 2) exit 1}'" || { echo "FAIL: <2GB memory"; exit 1; }

# CPU load (load average <80% cores)
ssh $SERVER "uptime | awk -F'load average:' '{print \$2}' | awk '{if (\$1+0 > $(nproc)*0.8) exit 1}'" || { echo "WARN: High CPU load"; }
```

**4. Network Infrastructure**:
```bash
# Required ports available (HTTPS, HTTP, gRPC)
ssh $SERVER "netstat -tuln | grep -E ':(443|80|50051)' | grep LISTEN" || { echo "WARN: Ports may not be bound"; }

# DNS resolution
ssh $SERVER "nslookup $DOMAIN" || { echo "FAIL: DNS resolution failed"; exit 1; }

# Harbor registry connectivity (j4c.aurigraph.io)
ssh $SERVER "curl -f -m 5 https://harbor.j4c.aurigraph.io/api/v2.0/systeminfo" || { echo "FAIL: Harbor registry unreachable"; exit 1; }
```

**5. SSL/TLS Certificates**:
```bash
# Certificate files exist
ssh $SERVER "test -f /etc/letsencrypt/live/aurcrt/fullchain.pem" || { echo "FAIL: Certificate not found"; exit 1; }
ssh $SERVER "test -f /etc/letsencrypt/live/aurcrt/privkey.pem" || { echo "FAIL: Private key not found"; exit 1; }

# Certificate expiry (>30 days)
ssh $SERVER "openssl x509 -in /etc/letsencrypt/live/aurcrt/fullchain.pem -noout -checkend 2592000" || { echo "WARN: Certificate expires <30 days"; }
```

**6. Environment Variables**:
```bash
# .env file exists
ssh $SERVER "test -f /opt/$PROJECT/.env" || { echo "FAIL: .env file not found"; exit 1; }

# Required secrets set (JWT_SECRET, DB passwords)
ssh $SERVER "grep -q JWT_SECRET /opt/$PROJECT/.env" || { echo "FAIL: JWT_SECRET not set"; exit 1; }
ssh $SERVER "grep -q POSTGRES_PASSWORD /opt/$PROJECT/.env" || { echo "FAIL: POSTGRES_PASSWORD not set"; exit 1; }
```

**Pre-Deployment Summary**:
```
✅ Server accessible via SSH
✅ Docker daemon healthy
✅ 10GB+ disk space available
✅ Pre-build disk prune executed (docker image prune -f && docker builder prune -f)
✅ 2GB+ memory available
✅ Required ports available
✅ Harbor registry accessible
✅ SSL certificates valid
✅ Environment variables configured
```

**Failure Actions**:
- **CRITICAL failures** (SSH, Docker, disk space, certificates): ABORT deployment immediately
- **WARNING failures** (high CPU, port conflicts): Log warning, notify user, proceed with caution

---

### Post-Deployment Verification (#MANDATORY — Feb 17, 2026)

**Rule**: ALL deployments MUST verify infrastructure and container health AFTER deployment completes.

**1. Container Health Status**:
```bash
# All containers running
UNHEALTHY=$(ssh $SERVER "docker ps --filter 'health=unhealthy' --format '{{.Names}}'")
if [ -n "$UNHEALTHY" ]; then
    echo "FAIL: Unhealthy containers: $UNHEALTHY"
    exit 1
fi

# No containers restarting
RESTARTING=$(ssh $SERVER "docker ps --filter 'status=restarting' --format '{{.Names}}'")
if [ -n "$RESTARTING" ]; then
    echo "FAIL: Restarting containers: $RESTARTING"
    exit 1
fi

# Container uptime (>30 seconds)
ssh $SERVER "docker ps --format '{{.Names}}\t{{.Status}}' | grep -v 'seconds ago'" || { echo "FAIL: Containers not stable"; exit 1; }
```

**2. Harbor Registry Version Validation**:
```bash
# Get deployed image versions from running containers
DEPLOYED_VERSIONS=$(ssh $SERVER "docker ps --format '{{.Image}}' | grep -E '(backend|frontend)' | sed 's|.*/||'")

# Query Harbor registry for latest versions (j4c.aurigraph.io/Harbor)
HARBOR_LATEST=$(curl -s -u $HARBOR_USER:$HARBOR_PASSWORD \
    "https://harbor.j4c.aurigraph.io/api/v2.0/projects/$PROJECT/repositories/$IMAGE/artifacts?page_size=1" \
    | jq -r '.[0].tags[0].name')

# Compare deployed vs latest
for IMAGE in backend frontend; do
    DEPLOYED=$(echo "$DEPLOYED_VERSIONS" | grep $IMAGE | cut -d: -f2)
    LATEST=$(echo "$HARBOR_LATEST" | grep $IMAGE)

    if [ "$DEPLOYED" != "$LATEST" ]; then
        echo "WARN: $IMAGE deployed=$DEPLOYED, Harbor latest=$LATEST"
    else
        echo "✅ $IMAGE version $DEPLOYED matches Harbor latest"
    fi
done

# Log image versions to deployment log
ssh $SERVER "docker ps --format '{{.Names}}\t{{.Image}}' | tee -a /opt/platform/logs/image-versions.log"
```

**3. Resource Usage**:
```bash
# CPU usage per container (<80%)
ssh $SERVER "docker stats --no-stream --format '{{.Name}}\t{{.CPUPerc}}' | awk '{if (\$2+0 > 80) {print \"WARN: High CPU: \"\$1\" \"\$2}}'

# Memory usage per container (<80%)
ssh $SERVER "docker stats --no-stream --format '{{.Name}}\t{{.MemPerc}}' | awk '{if (\$2+0 > 80) {print \"WARN: High memory: \"\$1\" \"\$2}}'

# Disk I/O per container
ssh $SERVER "docker stats --no-stream --format '{{.Name}}\t{{.BlockIO}}'"
```

**4. Network Connectivity**:
```bash
# Inter-container network
ssh $SERVER "docker network inspect mevshield_mev-shield" || { echo "FAIL: Network not created"; exit 1; }

# Container DNS resolution
ssh $SERVER "docker exec mev-shield-backend ping -c 1 mev-shield-redis" || { echo "FAIL: Backend cannot reach Redis"; exit 1; }
ssh $SERVER "docker exec mev-shield-backend ping -c 1 mevshield-postgres" || { echo "FAIL: Backend cannot reach Postgres"; exit 1; }
```

**5. Log Health Check**:
```bash
# No CRITICAL errors in last 100 lines
ssh $SERVER "docker logs --tail 100 mev-shield-backend 2>&1 | grep -i 'CRITICAL\|FATAL\|ERROR' | head -5" && echo "WARN: Errors in logs"

# gRPC server listening
ssh $SERVER "docker logs --tail 50 mev-shield-backend | grep -q 'gRPC server listening'" || { echo "FAIL: gRPC not started"; exit 1; }

# Database connections healthy
ssh $SERVER "docker logs --tail 50 mev-shield-backend | grep -q 'Database connected'" || { echo "FAIL: DB not connected"; exit 1; }
```

**6. Performance Metrics**:
```bash
# Response time (<500ms)
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://$DOMAIN/health)
if (( $(echo "$RESPONSE_TIME > 0.5" | bc -l) )); then
    echo "WARN: Slow response time: ${RESPONSE_TIME}s"
fi

# Throughput test (10 concurrent requests)
ab -n 100 -c 10 https://$DOMAIN/health | grep "Requests per second" | awk '{if ($4+0 < 50) print "WARN: Low throughput: "$4" req/s"}'
```

**Post-Deployment Summary**:
```
✅ All containers healthy (no restarts, no unhealthy)
✅ Harbor registry versions validated
✅ CPU usage <80% per container
✅ Memory usage <80% per container
✅ Inter-container network operational
✅ No critical errors in logs
✅ Response time <500ms
✅ Throughput >50 req/s
```

**Failure Actions**:
- **CRITICAL failures** (unhealthy containers, network issues, log errors): Trigger automatic rollback
- **WARNING failures** (high CPU, slow response): Log warning, notify user, continue monitoring

---

### Automated Infrastructure Check Script

**Location**: `/opt/platform/check-infrastructure.sh`

**Usage**:
```bash
# Pre-deployment
sudo /opt/platform/check-infrastructure.sh --pre

# Post-deployment
sudo /opt/platform/check-infrastructure.sh --post --project mevshield
```

**Integration with deploy.sh**:
- Call `check-infrastructure.sh --pre` at beginning of deployment (after prerequisite validation)
- Call `check-infrastructure.sh --post --project $project` after health check passes
- Exit deployment if pre-checks fail (exit code 1)
- Log warnings if post-checks have issues (but don't fail deployment)

**Harbor Registry API**:
- **Endpoint**: `https://harbor.j4c.aurigraph.io/api/v2.0/`
- **Authentication**: Basic auth with Harbor credentials from `credentials.md`
- **Image version query**: `/projects/{project}/repositories/{repo}/artifacts`
- **System info**: `/systeminfo` (for connectivity check)

**Enforcement**: Mandatory for ALL Platform-Layer deployments since February 17, 2026.

---

## Component 7: Session Tracking

**Rule**: Update session.md + todo.md after EVERY task, phase, sprint. Zero task loss.

### Three Continuity Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `session.md` | Live state — current task, decisions | Start + milestones + end |
| `todo.md` | Task backlog — pending/completed | When tasks change |
| `infinitecontext.md` | Archived sessions | End of session / context overflow (90%) |

### #ZeroTaskLoss (#MANDATORY)

- ALL tasks MUST go to `todo.md` — mark `[x]` with results on completion
- Log ALL user requests in `session.md`
- Sync pending tasks to JIRA at session boundaries
- When in doubt, track it

### #PhaseSprintUpdatePattern (#MANDATORY #MEMORIZED)

**Rule**: Update JIRA + TODO.md + Session.md after EVERY phase/sprint/task completion.

**Trigger Points** (When to Apply):

| Trigger | Example |
|---------|---------|
| Major milestone completion | IDDS Level 1 complete (8 tools, 150+ tests) |
| Phase transitions | Day 2 → Day 3, Week 2 → Week 3 |
| Critical blocker resolution | 22 blockers fixed, QA rejection → 100% pass |
| QA review cycles | Initial review → rework → final approval |
| End of coding session | Before context compact or session end |
| Deployment events | Staging → production, hotfix deployed |
| Sprint boundaries | Weekly sprint completion |

**Workflow** (Execute After Every Phase/Sprint/Task):

```bash
1. Update TODO.md
   - Mark completed tasks [x]
   - Add new tasks discovered during work
   - Update status headers (BLOCKED → COMPLETE, AT RISK → READY)
   - Add metrics tables showing progress

2. Update Session.md
   - Add phase timeline section with key decisions
   - Document commits, patterns established, blockers resolved
   - Update "Current Session State" header
   - Preserve historical context (don't delete old sessions)

3. Update JIRA (via JIRA agent or documentation)
   - Sync completed tasks to tickets
   - Create new tickets for blockers/follow-ups
   - Update epic/sprint progress
   - Add labels, commits, timestamps

4. Commit Updates
   - Commit todo.md: "docs: Update todo.md with [phase] completion"
   - Commit session.md: "docs: Update session.md with [phase] timeline"
   - Include metrics in commit message

5. #PhaseReflection (#MANDATORY — NON-SKIPPABLE)
   - Write lessons learned (numbered list, one per discovery)
   - Format: [What] — [Root cause] — [Remedy/Fix]
   - Update CLAUDE.md (project) with new gotchas/patterns/commands
   - Update J4C_INSIGHTS_JOURNAL.md (if J4C project) with INS-XXX entries
   - See #PhaseReflection section below for full format
```

**Example Metrics to Track**:
- Tools Passing QA: 0/8 → 8/8 (100%)
- Critical Blockers: 22 → 0 (all fixed)
- Test Coverage: 0 tests → 150+ tests (90%+)
- Security Fixes: 0/4 → 4/4 (OWASP compliant)

### #PhaseReflection (#MANDATORY #NON-SKIPPABLE)

**Rule**: EVERY phase/wave/sprint/plan MUST end with a structured reflection. No exceptions. This is how the team learns and prevents repeat failures.

**Trigger**: After completing any phase, wave, sprint, plan, or significant task block.

**Format** (numbered list, one entry per discovery):

```
## Reflection — [Phase/Sprint/Session Name]

Lessons learned:
1. [What went wrong or was surprising] — [Root cause] — [Remedy applied / future fix]
2. ...
3. ...

Remedies applied:
- CLAUDE.md updated with N new gotchas
- J4C_INSIGHTS_JOURNAL.md: INS-XXX added
- todo.md: follow-up tasks created for unresolved items
```

**Content rules**:
- Each lesson = one line: **What** — **Root Cause** — **Remedy**
- Cover: bugs found, unexpected behaviors, env/config surprises, auth/network gotchas, tooling failures
- If a fix was applied → state what was changed and where
- If a fix is still pending → create a `todo.md` entry for it

**Output destinations** (ALL required):
| Destination | What to add |
|-------------|------------|
| `CLAUDE.md` (project) | New rows in Operational Gotchas table |
| `J4C_INSIGHTS_JOURNAL.md` | INS-XXX entries (J4C project only) |
| `session.md` | Reflection block at end of session |
| `todo.md` | Follow-up tasks for unresolved lessons |
| Global `~/.claude/CLAUDE.md` | If learning is cross-project / infrastructure |

**Example** (Session #46):
```
Lessons learned:
1. SSE 401 — EventSource cannot set Authorization headers — Added _sse_auth dep accepting ?token= query param
2. create_token() TypeError — ACCESS_TOKEN_EXPIRE_MINUTES is str not int — Use jose.jwt.encode() directly
3. SSH + docker exec quoting — Python heredocs through SSH produce empty output — Use escaped inner quotes
4. Stuck CI runner — Long in_progress run blocks single self-hosted runner — gh run cancel <id>
5. Server local edits — git pull fails if server has uncommitted changes — git stash first
6. Harbor network warning — "Resource is still in use" on deploy teardown — Expected, j4c-network shared with Harbor
```

### session.md Requirements

**Structure**:
```markdown
# Current Session: {Title} ({Date})

## Accomplishments
- [x] Task 1 (2 files, 150 LOC, 95% coverage, QA 98/100, commit abc123)
- [x] Task 2 (5 files, 320 LOC, 92% coverage, QA 95/100, commit def456)

## Key Metrics
| Metric | Value |
|--------|-------|
| Tickets Completed | 5/7 |
| Commits | 12 |
| Tests Added | 150 |
| Test Coverage | 94% |
| QA Score (avg) | 96/100 |

## Files Modified
- src/main/java/io/aurigraph/v11/TrustScoringAgent.java (added)
- src/test/java/io/aurigraph/v11/TrustScoringAgentTest.java (added)

## Patterns Learned
- ThreadLocal for hot-path object reuse eliminates allocations
- RFC 7807 MANDATORY for all error responses
```

### todo.md Requirements

**Structure**:
```markdown
# TODO

## In Progress
- [ ] Task currently working on

## Pending
- [ ] Task 1 (JIRA: AV11-1234)
- [ ] Task 2 (JIRA: AV11-1235)

## Blocked
- [ ] Task 3 (blocked by: dependency X) (JIRA: AV11-1236)

## Completed
- [x] Task A (3 files, 200 LOC, 15 tests, 95% coverage, QA 98/100, commit abc123) (JIRA: AV11-1230)
- [x] Task B (5 files, 320 LOC, 22 tests, 92% coverage, QA 96/100, commit def456) (JIRA: AV11-1231)
```

**Enforcement**: Mandatory since Feb 13, 2026. Updates MUST happen at trigger points, not just at session end.

---

## Component 8: Auto-Recovery & Runtime Monitoring

**Rule**: ALL services MUST monitor for failures >60 seconds → log to J4C → attempt recovery → escalate if failed.

### 60-Second Threshold

Any failure lasting >60 seconds triggers auto-recovery:
- Service unresponsive (health check timeouts)
- API endpoints returning 5xx errors
- Database connection lost
- Queue processing stalled
- Background jobs hung
- Memory/CPU threshold exceeded
- Disk I/O blocked

### Failure Detection

**Monitoring Frequency**:
- Critical services: Every 5 seconds (consensus, database, WAL)
- High-priority: Every 10 seconds (API endpoints, cache)
- Standard: Every 30 seconds (background jobs, queues)

**Monitored Services** (ALL):
- Aurigraph DLT V11/V12: Consensus, WAL, Channel Registry, Staking, Bridge, DeFi, RWA, PostgreSQL, Redis, NGINX
- J4C Portal: Express backend, React frontend, PostgreSQL, Redis, Cassandra, NGINX
- Website V3: Next.js API, PostgreSQL, Redis, NGINX
- Provenews IDDS: FastAPI, Trust Scoring, Reasoning, Text Analysis, Orchestrator, PostgreSQL, Redis
- Infrastructure: Docker, GitHub runners, Prometheus, OpenBao KMS

### J4C Error Logging

**Format**: RFC 7807 compliant with metadata
**Endpoint**: `POST https://j4c.aurigraph.io/api/errors`
**Correlation**: traceId + requestId for distributed tracing

**Error Payload**:
```json
{
  "type": "https://aurigraph.io/errors/prolonged-failure",
  "title": "Service Prolonged Failure",
  "status": 503,
  "errorCode": "ERR_MONITOR_001",
  "traceId": "a1b2c3d4-...",
  "metadata": {
    "serviceName": "postgres-v11",
    "failureDuration": "72s",
    "recoveryAttempts": 0,
    "severity": "HIGH"
  }
}
```

### Recovery Strategy Matrix

| Failure Type | Recovery Actions | Max Attempts |
|--------------|------------------|--------------|
| Service Unresponsive | Restart → Clear cache → Kill hung processes → Restart container | 3 |
| Database Connection | Reconnect → Switch to replica → Restart pool → Restart container | 3 |
| Queue Stalled | Flush queue → Reset offset → Restart consumer → Restart service | 3 |
| Memory Threshold | Trigger GC → Clear caches → Restart service → Scale horizontally | 2 |
| Disk I/O Blocked | Clear temp → Rotate logs → Archive data → Expand volume | 2 |
| API 5xx Errors | Restart API → Clear cache → Rollback → Failover to backup | 3 |

**Backoff Strategy**: Exponential (2^attempt seconds between attempts)
**Recovery Timeout**: 30 seconds per attempt, 3 minutes total window

### Escalation to Manual Intervention

**Triggers**:
- All recovery attempts exhausted (3 attempts)
- Service critical for business (HIGH/CRITICAL priority)
- Multiple services failing (cascade failure)
- Recovery causing additional failures (rollback triggered)

**Escalation Channels** (by priority):
- **CRITICAL**: PagerDuty (immediate) → Slack #ops-critical → Email + SMS → Phone call (5 min)
- **HIGH**: Slack #ops-alerts → Email → J4C dashboard (15 min SLA)
- **MEDIUM**: J4C dashboard → Email (1 hour SLA)

**Alert Payload**:
```json
{
  "type": "https://aurigraph.io/alerts/recovery-failed",
  "title": "Auto-Recovery Failed - Manual Intervention Required",
  "priority": "HIGH",
  "serviceName": "postgres-v11",
  "traceId": "a1b2c3d4-...",
  "recoveryAttempts": 3,
  "lastRecoveryAction": "Restart database container",
  "lastRecoveryError": "Container failed to start: port 5432 already in use",
  "recommendedActions": ["Check port 5432", "Review logs", "Manual restart"],
  "relatedLogs": ["/logs/failure-monitor.log#L1234"]
}
```

### Benefits

**Before Component 8**:
- ❌ Manual monitoring (humans checking logs)
- ❌ Slow response (minutes to hours)
- ❌ Unnoticed degradation
- ❌ No failure correlation
- ❌ Inconsistent recovery

**After Component 8**:
- ✅ Automated detection in 60 seconds
- ✅ Immediate recovery (no human delay)
- ✅ J4C logging with correlation IDs
- ✅ Standardized procedures across all services
- ✅ Intelligent escalation when needed
- ✅ Full-stack coverage (database → API → frontend)

**Enforcement**: Mandatory since Feb 13, 2026, applies to ALL services, 24/7 monitoring.

### Docker Container Watchdog (#MANDATORY #MEMORIZED — Mar 5, 2026)

**Rule**: ALL production projects MUST have a cron-based watchdog script installed on the server that checks container health every 5 minutes and self-heals without human intervention. This is distinct from `restart: unless-stopped` (which only handles individual container crashes) — the watchdog handles **entire stack outages** (failed deploy mid-teardown, manual docker-compose down, daemon restart).

**Standard**: Every Aurigraph project installs `/opt/<project>/scripts/watchdog.sh` with cron `*/5 * * * *`.

#### Watchdog Script Template

```bash
#!/bin/bash
# Autonomous Recovery Watchdog — <PROJECT>
# Cron: */5 * * * * /opt/<project>/scripts/watchdog.sh >> /var/log/<project>-watchdog.log 2>&1
COMPOSE_DIR="/opt/<project>"
LOG_TAG="[<project>-watchdog]"
REQUIRED_CONTAINERS="<space-separated list>"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $LOG_TAG $*"; }
cd "$COMPOSE_DIR"
RESTARTED=0

for ctr in $REQUIRED_CONTAINERS; do
    STATUS=$(docker inspect --format '{{.State.Status}}' "$ctr" 2>/dev/null || echo "missing")
    case "$STATUS" in
        running)
            HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$ctr" 2>/dev/null)
            [ "$HEALTH" = "unhealthy" ] && { log "RESTART: $ctr unhealthy"; docker restart "$ctr"; ((RESTARTED++)); } ;;
        exited|dead|created)
            log "RESTART: $ctr is $STATUS"
            docker start "$ctr" 2>/dev/null || docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d "$ctr" 2>/dev/null || true
            ((RESTARTED++)) ;;
        missing)
            log "RECOVER: $ctr missing — full compose up"
            docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d 2>/dev/null || true
            ((RESTARTED++)); break ;;
    esac
done

[ "$RESTARTED" -eq 0 ] && log "OK: all containers healthy" || log "RECOVERED: restarted $RESTARTED container(s)"
```

#### Project Watchdog Registry (#MEMORIZED — Updated Apr 22, 2026)

| Project | Server | Script Path | Containers Monitored | Status |
|---------|--------|-------------|---------------------|--------|
| J4C Portal | j4c.aurigraph.io:2244 | `/opt/j4c-portal/scripts/j4c-watchdog.sh` | postgres-db, redis-cache, j4c-api, j4c-react, nginx-gateway | ✅ INSTALLED |
| Provenews | 151.242.51.54:2244 | `/opt/provenews/autonomous-recovery.sh` | provenews-db, provenews-redis, provenews-backend, provenews-frontend, provenews-nginx | ⚠️ SCRIPT EXISTS, TIMER NOT INSTALLED (needs sudo) |
| MEV Shield | mevshield.ai:2244 | `/opt/mevshield/scripts/watchdog.sh` | mevshield-db, mevshield-redis, mevshield-backend, mevshield-frontend, mevshield-nginx | ✅ INSTALLED |
| Aurigraph DLT | dlt.aurigraph.io:2244 | `/opt/aurigraph-dlt/scripts/watchdog.sh` | aurigraph-db, aurigraph-redis, aurigraph-backend, aurigraph-nginx | ✅ INSTALLED |
| Website V3 | www.aurigraph.io:2228 | `/opt/website/scripts/watchdog.sh` | website-db, website-redis, website-frontend, website-nginx | ✅ INSTALLED |

#### AutoHeal & AutoRecovery — 3-Layer Defense (#MANDATORY — Apr 22, 2026, Incident-Driven)

**Incident**: Provenews was down for >12 hours (Apr 21-22, 2026). All 7 containers removed (likely `docker compose down` or daemon restart). The `autonomous-recovery.sh` script existed but was **never registered** as a systemd timer or cron job on the new server (151.242.51.54). Docker restart policy (`unless-stopped`) only protects against container crashes, NOT removal.

**Root Cause Analysis**:
1. Server migrated from `cj.aurigraph.io:2224` → `151.242.51.54:2244` — watchdog not reinstalled
2. ADM registry showed "✅ INSTALLED" (stale — pointed to old server)
3. Docker `restart: unless-stopped` does NOT protect against `docker compose down` or `docker rm`
4. No `crontab` binary on Provenews01 — standard cron approach failed
5. `sudo` required for systemd timer — could not install without root password in SSH session

**Rule (#MANDATORY)**: ALL production projects MUST implement the 3-Layer AutoHeal Defense:

| Layer | Mechanism | Protects Against | Installation |
|---|---|---|---|
| **Layer 1: Docker Restart Policy** | `restart: unless-stopped` in `docker-compose.yml` + `docker update --restart unless-stopped` on running containers | Container crashes, OOM kills, daemon restart | Compose file + runtime `docker update` |
| **Layer 2: Systemd Watchdog Timer** | `<project>-recovery.timer` running every 60s, calls watchdog script | Entire stack removal (`docker compose down`), failed deploys, host reboot | `sudo systemctl enable <project>-recovery.timer` |
| **Layer 3: Health Endpoint Monitoring** | External uptime monitor (UptimeRobot / Grafana) pinging `https://domain/api/health` every 60s | Network-level failures, DNS issues, SSL expiry, NGINX misconfiguration | UptimeRobot dashboard + alert channels |

**Verification Checklist (per project, per deploy)**:
```bash
# Layer 1: Restart policy
docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' <container>  # must be "unless-stopped"

# Layer 2: Systemd timer
systemctl is-active <project>-recovery.timer  # must be "active"
systemctl list-timers | grep <project>        # must show next trigger

# Layer 3: External monitor
curl -s https://domain/api/health             # must return 200 {"status":"ok"}
```

**Post-Deploy Gate**: After EVERY deploy, verify all 3 layers are active. If Layer 2 (systemd timer) is not installed, the deploy is NOT COMPLETE — escalate to infra team for sudo access.

**Systemd Timer Template** (requires sudo):
```bash
# /etc/systemd/system/<project>-recovery.service
[Unit]
Description=<Project> Autonomous Recovery
After=docker.service
[Service]
Type=oneshot
ExecStart=/opt/<project>/scripts/watchdog.sh
User=subbu

# /etc/systemd/system/<project>-recovery.timer
[Unit]
Description=Run <Project> recovery every 60s
[Timer]
OnBootSec=30
OnUnitActiveSec=60
[Install]
WantedBy=timers.target

# Enable:
sudo systemctl daemon-reload
sudo systemctl enable --now <project>-recovery.timer
```

**Fallback (when sudo unavailable)**: If crontab and sudo are both unavailable:
1. Add watchdog call to the Docker entrypoint of the NGINX container
2. Use Docker healthcheck `test` with `interval=60s` that triggers `docker compose up -d` on failure
3. Register a user-level systemd timer via `systemctl --user` (if lingering enabled)

#### Pre-Deploy Network Cleanup Hook (#MANDATORY — Mar 5, 2026)

**Rule**: ALL projects that use `harbor-network: external: true` in docker-compose.yml MUST run pre-deploy network cleanup before `docker-compose down` to prevent harbor-nginx cross-compose network attachment blocking teardown (INS-171).

**Script template** (`/opt/<project>/scripts/pre-deploy.sh`):
```bash
#!/bin/bash
# Disconnect harbor-nginx from project networks before docker-compose down (INS-171)
for net in <project>_<name>-network; do
    docker network inspect "$net" >/dev/null 2>&1 && \
        docker network disconnect "$net" harbor-nginx 2>/dev/null || true
done
```
Inject into `/opt/platform/deploy.sh` → `stop_containers()` → before `docker-compose down`:
```bash
/opt/<project>/scripts/pre-deploy.sh 2>&1 | tee -a "$DEPLOY_LOG" || true
```

#### Cron Installation (All Projects)
```bash
# Install watchdog (idempotent)
(crontab -l 2>/dev/null | grep -v 'watchdog') | crontab -
(crontab -l 2>/dev/null; echo '*/5 * * * * /opt/<project>/scripts/watchdog.sh >> /var/log/<project>-watchdog.log 2>&1') | crontab -
```

#### Log Location
- Watchdog logs: `/var/log/<project>-watchdog.log`
- Read: `tail -50 /var/log/<project>-watchdog.log`

---

## Component 9: Documentation Consolidation

### #ADMDocs Standard (#MANDATORY #MEMORIZED — Feb 21, 2026)

**Rule**: Every project/feature MUST maintain the following 5 mandatory documentation artifacts in `docs/`:

| Artifact | File | Purpose |
|----------|------|---------|
| **PRD** | `docs/PRD.md` | Requirements, user stories, acceptance criteria |
| **Architecture** | `docs/Architecture.md` | System design, components, data flow, API surface |
| **UML Diagrams** | `docs/diagrams/` | Sequence, component, state machine (Mermaid/PlantUML) |
| **Database Design** | `docs/DatabaseDesign.md` | ER diagram, table defs, index strategy, migrations |
| **Deployment Guide** | `docs/DeploymentGuide.md` | Deploy/rollback procedure, env vars, smoke tests |

**QA Gate**: All 5 must exist and be non-empty for Approver APPROVED verdict.
**Format**: Mermaid diagrams preferred (renders in GitHub). PlantUML acceptable.
**Enforcement**: Mandatory since Feb 21, 2026. @QAQCAgent auto-rejects if missing.

---

**Rule**: Keep documentation lean, extract framework content to dedicated files.

### Trigger Points

- CLAUDE.md exceeds 500 lines
- Framework content mixed with quick reference
- Redundancy between global and project CLAUDE.md
- New framework introduced (e.g., #ADM, #AAT, #gRPC)

### Documentation Hierarchy

```
~/.claude/
├── CLAUDE.md           (Quick reference, <500 lines, pointers only)
├── ADM.md              (Complete #ADM framework, all 9+ components) ← THIS FILE
├── ADM_FRAMEWORK.md    (Legacy, can be deprecated once ADM.md complete)
├── GRPC_HTTP2_STANDARD.md (gRPC/HTTP2 framework)
├── CLAUDE_example_code.md (Code examples)
└── CLAUDE_ARCHIVE.md   (Deprecated patterns)

{project-root}/
├── CLAUDE.md           (Project-specific, <200 lines, references global)
├── session.md          (Live state)
├── todo.md             (Task backlog)
└── infinitecontext.md  (Archived sessions)
```

### Consolidation Workflow

1. **Identify content for extraction** (framework specs, verbose guides)
2. **Create dedicated file** (e.g., ADM.md for #ADM framework)
3. **Update CLAUDE.md with pointer** and 1-paragraph summary
4. **Verify no broken references**
5. **Commit** with message: `docs: Consolidate {topic} to {file}`

**Example**: This consolidation (Feb 16, 2026) extracted #ADM from CLAUDE.md (1,989 lines) → ADM.md, reducing CLAUDE.md to ~800 lines.

### Benefits

- ✅ Quick reference remains scannable
- ✅ Framework details in dedicated files
- ✅ Clear hierarchy (global → project → session)
- ✅ Easier maintenance (update one file, not scattered sections)

**Enforcement**: Mandatory since Feb 16, 2026. Run consolidation when CLAUDE.md >500 lines.

### Version Control for Configuration Files

**Added**: February 17, 2026 | **Rule**: Version control separation for global vs project documentation

**Repository Assignment**:

1. **Global Configuration** → `glowing-adventure` repository (J4C Portal as meta-project)
   - Files: `~/.claude/CLAUDE.md`, `~/.claude/ADM.md`, `~/.claude/GRPC_HTTP2_STANDARD.md`
   - Location in repo: `docs/global-config/` or `.claude/`
   - Commit frequency: After every major update (Component enhancements, new patterns)
   - Purpose: Centralized versioning of enterprise standards across all projects

2. **Project Configuration** → Respective project repository
   - Files: `{project-root}/CLAUDE.md`, `session.md`, `todo.md`, `infinitecontext.md`
   - Location: Project root directory
   - Commit frequency: With project code changes
   - Purpose: Project-specific patterns and session state

**Workflow** (Automatic via #ADM Component 4):

```bash
# After updating global CLAUDE.md or ADM.md
cd ~/subbuworkingdir/glowing-adventure/
mkdir -p docs/global-config/
cp ~/.claude/CLAUDE.md docs/global-config/
cp ~/.claude/ADM.md docs/global-config/
cp ~/.claude/GRPC_HTTP2_STANDARD.md docs/global-config/
git add docs/global-config/
git commit -m "docs(global): Update global CLAUDE.md and ADM.md

- Component 2: Concurrent Maker:Checker enhancement
- Component 10: Platform-Layer Governance

Updated: $(date +%Y-%m-%d)
"
git push origin main
```

**Rationale**:
- **Centralization**: `glowing-adventure` (J4C Portal) acts as configuration repository
- **Backup**: Global standards versioned and recoverable
- **Audit Trail**: Track evolution of enterprise standards over time
- **Team Sync**: Other developers can pull latest global configs from glowing-adventure
- **Separation**: Global configs separate from project-specific patterns

**Example Directory Structure**:

```
glowing-adventure/ (J4C Portal - Meta Repository)
├── docs/
│   └── global-config/
│       ├── CLAUDE.md              (Global enterprise standards)
│       ├── ADM.md                 (Complete #ADM framework)
│       ├── GRPC_HTTP2_STANDARD.md (gRPC/HTTP2 framework)
│       └── CLAUDE_example_code.md (Code examples)
├── src/                            (J4C Portal code)
└── CLAUDE.md                       (J4C-specific patterns)

Aurigraph-DLT/ (Project Repository)
├── CLAUDE.md                       (Aurigraph-specific patterns)
├── session.md                      (Session state)
├── todo.md                         (Task backlog)
└── infinitecontext.md              (Archived sessions)
```

**Enforcement**: After updating global configs, copy to `glowing-adventure/docs/global-config/` and commit.

---

## J4C Framework #ADM Integration

**Achievement**: Full integration of Aurigraph Dev Mode (#ADM) into J4C Framework orchestrator

**Status**: ✅ Design Complete | 📋 Implementation Planned (4 phases, 2-3 weeks)

### Overview

The J4C Framework now includes complete Aurigraph Dev Mode (#ADM) integration, enabling intelligent task routing through either a full 9-component autonomous pipeline or a streamlined 3-component pipeline based on task complexity.

**Key Innovation**: Hybrid execution model with AI/ML-powered auto-detection of task complexity and requirements.

### Integration Architecture

**Two Execution Pipelines**:

1. **FULL_ADM Pipeline** (Complex Tasks)
   - All 9 #ADM components active
   - 4-tier validation (Maker → Checker → QA/QC → Approver)
   - Complete TDD cycle (RED → GREEN → REFACTOR)
   - Full documentation suite (#ADMdocs)
   - Comprehensive tracking and recovery
   - Use case: New features, architectural changes, critical fixes

2. **STREAMLINED Pipeline** (Simple Tasks)
   - 3 components only (TDD → Implementation → Git)
   - Maker + QA/QC (skip Checker + Approver for speed)
   - Minimal TDD (focused unit tests)
   - Basic documentation
   - Use case: Bug fixes, documentation updates, trivial features

**Auto-Detection System**:
- **Rule-Based**: Threshold checks (LOC, files, dependencies, JIRA story points)
- **AI/ML Powered**: Neural Network complexity prediction (87% accuracy)
- **SOM Clustering**: Pattern recognition from historical tasks
- **Heuristics Library**: 20 fast decision rules across all components

### AI/ML Intelligence Layer

**8 Neural Network Models** (Component-Specific Guidance):

| Model | Purpose | Accuracy | Use |
|-------|---------|----------|-----|
| **Complexity Predictor** | Classify task complexity | 87% | Component 0 (Requirements) |
| **Effort Estimator** | Predict hours needed | 82% (±20%) | Component 0 (Requirements) |
| **Bug Predictor** | Identify bug-prone code | 76% precision | Component 2 (Checker review) |
| **Approach Recommender** | Suggest best implementation | 91% top-1 used | Component 0 (Requirements) |
| **Cost Optimizer** | Model selection per tier | 35% savings | All components |
| **Deployment Risk Analyzer** | Predict deploy failures | 84% | Component 5-6 (Deploy) |
| **Test Strategy Optimizer** | Optimal test count | 25% reduction | Component 1 (TDD) |
| **Sprint Assignment Optimizer** | JIRA sprint planning | 89% complete | Component 3 (JIRA) |

**Self-Organizing Maps (SOMs)**:
- Cluster tasks into high-quality vs low-quality patterns
- Identify successful code patterns, test structures, deployment sequences
- Warn when code drifts toward low-quality cluster
- Learn from every task to improve recommendations

**20 Metrics-Based Heuristics**:
- Fast decision rules derived from metrics analysis
- Cover all 9 #ADM components (Component 0-8)
- Examples:
  - H1: Insufficient requirements detected → gather more detail
  - H8: Predicted bugs >3 → increase Checker review time
  - H14: Friday deploy + high risk → recommend Monday
  - H21: Cost >1.5x average → investigate inefficiency

### Technical Implementation

**Tech Stack**:
- **Language**: TypeScript (Node.js)
- **Database**: PostgreSQL (4 tables: tasks, metrics, training_data, clusters)
- **Testing**: Jest (100 tests planned)
- **AI/ML**: TensorFlow.js (8 models) + k-means clustering
- **Error Handling**: RFC 7807 Problem Details
- **State Management**: 16-state TaskState enum

**TaskState Enum** (16 States):
```
INTAKE → ANALYZING → TDD_RED → TDD_GREEN → TDD_REFACTOR →
MAKER_EXECUTING → CHECKER_REVIEWING → QA_TESTING → APPROVER_REVIEWING →
JIRA_UPDATING → GIT_COMMITTING → DEPLOYING → VERIFYING → TRACKING →
COMPLETED | FAILED
```

### Implementation Phases

**Phase 1: Foundation** (3-4 days)
- PostgreSQL schema + migrations
- TypeScript type definitions (interfaces, enums, DTOs)
- RFC 7807 error response builder
- TaskState state machine
- Task registry (CRUD operations)
- Rule-based complexity analyzer
- 20 unit tests

**Phase 2: AI/ML Intelligence** (5-7 days)
- 8 Neural Network models (training + inference)
- SOM clustering implementation
- 20 heuristics library
- Training data pipeline
- Model versioning + persistence
- 30 integration tests

**Phase 3: Component Integration** (5-7 days)
- 9 #ADM component handlers (Component 0-8)
- Agent orchestration (Maker, Checker, QA, Approver)
- JIRA integration + Smart Commits
- Deployment automation (@J4CDeploymentAgent)
- Session tracking (session.md, todo.md)
- 30 integration tests

**Phase 4: Testing & Production** (2-3 days)
- End-to-end workflow tests (20 tests)
- Load testing (1,000 concurrent tasks)
- Cost analysis + optimization
- Documentation (#ADMDocs: PRD, Architecture.md, UML diagrams, Database Architecture & Design, Deployment Guide — see Component 9 #ADMDocs Standard)
- Deployment to j4c.aurigraph.io
- 20 E2E tests

**Total**: 15-21 days | 100 tests | 4 phases

### Success Metrics

**Quality Targets**:
- ✅ 95%+ early bug detection (Checker catches bugs before QA)
- ✅ 85%+ test coverage (unit + integration + E2E)
- ✅ 90%+ first-pass QA success (no rework needed)
- ✅ 0 critical bugs in production

**Performance Targets**:
- ✅ 30%+ cost reduction (optimal model selection)
- ✅ 50%+ faster simple tasks (streamlined pipeline)
- ✅ 80%+ autonomous execution (no human intervention)
- ✅ <500ms task routing latency

**Deployment Targets**:
- ✅ 95%+ deployment success rate
- ✅ <30 min deployment time (full pipeline)
- ✅ <5 min rollback time (on failure)
- ✅ 100% RFC 7807 error compliance

### Key Features

1. **Intelligent Routing**: AI/ML auto-detection + rule-based safety gates
2. **Hybrid Execution**: Full pipeline for complex, streamlined for simple
3. **Cost Optimization**: 35% reduction via model selection (Haiku vs Sonnet)
4. **Proactive Recommendations**: AI/ML guidance at every component
5. **Continuous Learning**: SOM clustering + NN retraining from metrics
6. **Complete Tracking**: PostgreSQL persistence + session.md updates
7. **Enterprise Quality**: 4-tier validation + RFC 7807 errors
8. **Autonomous Recovery**: Component 8 integration (60s failure detection)

### Documentation

**Design Document** (813 lines):
- Location: `glowing-adventure/docs/plans/2026-02-14-j4c-adm-integration-design.md`
- Sections: System Architecture, Component Details (all 9), Data Flow, Error Handling, Testing Strategy, Implementation Phases

**Implementation Plan** (1,379 lines):
- Location: `glowing-adventure/docs/plans/2026-02-14-j4c-adm-integration.md`
- Structure: Phase 1 detailed (8 tasks, 2-5 min each), Phases 2-4 outlined

**Enforcement**: Mandatory since February 14, 2026 (design phase). ALL tasks routed through J4C Framework follow #ADM.

---

## Quick Reference

| Aspect | Specification |
|--------|---------------|
| **Components** | 10 mandatory (Requirements → TDD → #AAT → JIRA → Git → Deploy → Verify → Track → Auto-Recover → Document → Platform-Layer) |
| **Team Structure** | N:N:N:1 (Maker → Checker → QA → Approver) |
| **Coverage Targets** | Critical 95%+, Business 90%+, API 85%+ |
| **JIRA Triggers** | After every phase/wave/sprint (automatic) |
| **Git Format** | Smart Commits with JIRA ticket reference |
| **Deploy Method** | @J4CDeploymentAgent + platform deployer (/opt/platform/deploy.sh) ONLY |
| **Health Checks** | 15 smoke tests (5 HTTPS + 5 REST + 5 gRPC) |
| **Session Tracking** | session.md + todo.md (MANDATORY after every task) |
| **Auto-Recovery** | 60s failure detection, 3 recovery attempts, escalate |
| **Documentation** | Consolidate when CLAUDE.md >500 lines |
| **Infrastructure** | NO direct access (nginx locked, ports pre-assigned, deploy.yaml only) |

**Remember**: #ADM is THE way we build software. All 10 components are mandatory (except #AAT for research/docs). Autonomous execution, enterprise quality, zero task loss, controlled infrastructure access.

---

## Component 10: Platform-Layer Deployment Governance

**Rule**: Claude MUST NOT touch server infrastructure directly. ALL deployments go through controlled platform layer.

**Added**: February 16, 2026 | **Enforcement**: MANDATORY for all projects

### Problem Statement

**Current Issue**: AI agents directly manipulating server infrastructure causes:
- ✗ Broken NGINX configurations (locked users out)
- ✗ Port conflicts (random port selection)
- ✗ Service downtime (uncoordinated deployments)
- ✗ Manual repairs required (human intervention)
- ✗ Production instability (unpredictable changes)

**Root Cause**: Uncontrolled AI sysadmin access to `/etc/nginx/*`, `docker.sock`, `systemctl`, port allocation

### Solution: Platform-Layer Deployment Architecture

Convert: **Uncontrolled AI sysadmin** → **Controlled build agent**

Claude becomes a **package generator**, not a sysadmin.

**Table of Contents**:
- **A.** One-Time Server Setup (Manual)
- **B.** Build the Deterministic Deployer (Core Fix)
- **C.** Change How Claude Deploys
- **D.** Add Permanent Governance Rule to All Prompts
- **E.** Enable Safe Deployments
- **F.** Standardized deploy.yaml Structure
- **G.** Enforcement Rules
- **H.** Aurigraph DLT Deployment Patterns *(NEW - Feb 17, 2026)*
- **I.** Integration with Other #ADM Components
- **J.** Migration Path (Existing Projects)
- **K.** Success Metrics
- **L.** Quick Reference

---

### A. One-Time Server Setup (Manual)

#### 1. Freeze NGINX (Single Permanent Router)

**Action**: Create static routing config and lock it permanently.

```bash
# Create fixed routing configuration
cat > /etc/nginx/conf.d/platform-router.conf << 'NGINX'
# MEV Shield Enterprise Platform Router
# DO NOT EDIT - Managed by platform layer

upstream mevshield_backend {
    server 127.0.0.1:6101;  # Fixed slot for MEV Shield
}

upstream aurigraph_dlt {
    server 127.0.0.1:6102;  # Fixed slot for Aurigraph DLT
}

upstream j4c_portal {
    server 127.0.0.1:6103;  # Fixed slot for J4C Portal
}

server {
    listen 443 ssl http2;
    server_name mevshield.ai;
    
    ssl_certificate /etc/letsencrypt/live/mevshield.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mevshield.ai/privkey.pem;
    
    location / {
        proxy_pass http://mevshield_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Repeat for other services...
NGINX

# Lock NGINX configuration - AI cannot edit anymore
chattr +i /etc/nginx/nginx.conf
chattr +i /etc/nginx/conf.d/platform-router.conf
```

**Result**: AI physically cannot break NGINX anymore.

#### 2. Create Fixed Port Registry

**Action**: Create deterministic port allocation registry.

```bash
cat > /opt/platform/ports.json << 'JSON'
{
  "version": "1.0.0",
  "updated": "2026-02-16",
  "ports": {
    "mevshield": {
      "http": 6101,
      "grpc": 6201,
      "metrics": 6301,
      "websocket": null
    },
    "aurigraph-dlt": {
      "http": 6102,
      "grpc": 6202,
      "metrics": 6302
    },
    "j4c-portal": {
      "http": 6103,
      "grpc": 6203,
      "metrics": 6303
    },
    "provenews": {
      "http": 6104,
      "grpc": 6204,
      "metrics": 6304
    },
    "website-v3": {
      "http": 6105,
      "grpc": null,
      "metrics": 6305
    }
  },
  "ranges": {
    "http": "6101-6199",
    "grpc": "6201-6299",
    "metrics": "6301-6399",
    "database": "6401-6499",
    "cache": "6501-6599"
  }
}
JSON
```

**Result**: AI never chooses ports again. All ports are pre-assigned.

#### 3. Create Platform Deployment Directory

**Action**: Create standard deployment structure.

```bash
mkdir -p /opt/platform/{apps,builds,logs,configs}

# Directory structure
/opt/platform/
    apps/           # Running applications (docker-compose.yml per app)
    builds/         # Build artifacts (staging before deployment)
    logs/           # Deployment logs (audit trail)
    configs/        # Generated configs (nginx, env files)
    ports.json      # Port registry
    deploy.sh       # Deployment script (ONLY deployment mechanism)
```

**Result**: Single writable deployment area, everything else read-only.

#### 4. Create Restricted Deployment User

**Action**: Create dedicated Claude user with restricted permissions.

```bash
# Create deployment user
useradd -m -s /bin/bash claude-deploy

# Set permissions
chown -R claude-deploy:claude-deploy /opt/platform
chmod 750 /opt/platform

# Restrict access (block infrastructure directories)
# /etc/nginx/*           - BLOCKED (chattr +i)
# /usr/lib/systemd/*     - BLOCKED (no write)
# /var/*                 - BLOCKED (except /opt/platform/logs)
# docker.sock direct     - BLOCKED (use docker-compose only)
```

**Sudoers configuration**:
```bash
# /etc/sudoers.d/claude-deploy
claude-deploy ALL=(ALL) NOPASSWD: /opt/platform/deploy.sh
claude-deploy ALL=(ALL) NOPASSWD: /usr/bin/docker-compose
Defaults:claude-deploy !requiretty
```

**Result**: Claude can deploy apps but cannot damage infrastructure.

---

### B. Build the Deterministic Deployer (Core Fix)

**File**: `/opt/platform/deploy.sh`

**Purpose**: THE ONLY deployment mechanism. Claude calls this, never docker/nginx/systemctl directly.

#### Deployment Script Logic

```bash
#!/bin/bash
# /opt/platform/deploy.sh - Controlled Platform Deployer
# Added: February 16, 2026
# Enforcement: MANDATORY for all deployments

set -euo pipefail

DEPLOY_YAML="$1"
PLATFORM_ROOT="/opt/platform"
PORTS_REGISTRY="$PLATFORM_ROOT/ports.json"

# Step 1: Validate deploy.yaml
validate_deploy_yaml() {
    local yaml="$1"
    
    # Check required fields
    jq -e '.project, .version, .docker, .health' "$yaml" >/dev/null || {
        echo "❌ Invalid deploy.yaml - missing required fields"
        exit 1
    }
    
    echo "✅ deploy.yaml validated"
}

# Step 2: Assign port from registry
assign_port() {
    local project="$1"
    local port=$(jq -r ".ports[\"$project\"].http" "$PORTS_REGISTRY")
    
    if [[ "$port" == "null" ]]; then
        echo "❌ Project not in port registry: $project"
        exit 1
    fi
    
    echo "$port"
}

# Step 3: Build Docker image
build_image() {
    local project="$1"
    local version="$2"
    local dockerfile="$3"
    
    echo "🔨 Building $project:$version..."
    docker build -t "$project:$version" -f "$dockerfile" .
}

# Step 4: Run container on assigned port
run_container() {
    local project="$1"
    local version="$2"
    local port="$3"
    
    echo "🚀 Starting $project on port $port..."
    
    # Generate docker-compose.yml from template
    cat > "$PLATFORM_ROOT/apps/$project/docker-compose.yml" <<YAML
version: '3.8'
services:
  app:
    image: $project:$version
    container_name: ${project}-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:$port:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 3
YAML
    
    cd "$PLATFORM_ROOT/apps/$project"
    docker-compose up -d
}

# Step 5: Health check
health_check() {
    local project="$1"
    local port="$2"
    local health_endpoint="$3"
    
    echo "🏥 Health check: http://127.0.0.1:$port$health_endpoint"
    
    for i in {1..30}; do
        if curl -sf "http://127.0.0.1:$port$health_endpoint" >/dev/null; then
            echo "✅ Health check passed"
            return 0
        fi
        sleep 2
    done
    
    echo "❌ Health check failed after 60s"
    return 1
}

# Step 6: Activate (NGINX already configured, just restart to pick up upstream)
activate() {
    local project="$1"
    echo "✅ $project activated on assigned port"
    # NGINX doesn't need reload - upstream already points to fixed port
}

# Step 7: Rollback on failure
rollback() {
    local project="$1"
    local previous_version="$2"
    
    echo "⚠️  Rolling back to $previous_version..."
    
    cd "$PLATFORM_ROOT/apps/$project"
    docker-compose down
    
    # Restore previous version
    docker tag "$project:$previous_version" "$project:latest"
    docker-compose up -d
    
    echo "✅ Rollback complete"
}

# Main deployment flow
main() {
    local deploy_yaml="$1"
    
    # Parse deploy.yaml
    PROJECT=$(jq -r '.project' "$deploy_yaml")
    VERSION=$(jq -r '.version' "$deploy_yaml")
    DOCKERFILE=$(jq -r '.docker.dockerfile' "$deploy_yaml")
    HEALTH_ENDPOINT=$(jq -r '.health.endpoint' "$deploy_yaml")
    
    echo "🚀 Deploying $PROJECT v$VERSION..."
    
    # Get previous version for rollback
    PREVIOUS_VERSION=$(docker images "$PROJECT" --format "{{.Tag}}" | head -n1)
    
    # Deployment pipeline
    validate_deploy_yaml "$deploy_yaml"
    PORT=$(assign_port "$PROJECT")
    build_image "$PROJECT" "$VERSION" "$DOCKERFILE"
    run_container "$PROJECT" "$VERSION" "$PORT"
    
    if health_check "$PROJECT" "$PORT" "$HEALTH_ENDPOINT"; then
        activate "$PROJECT"
        echo "✅ Deployment successful: $PROJECT v$VERSION on port $PORT"
    else
        rollback "$PROJECT" "$PREVIOUS_VERSION"
        echo "❌ Deployment failed - rolled back to $PREVIOUS_VERSION"
        exit 1
    fi
}

main "$@"
```

**Result**: Zero-downtime deployments with automatic rollback.

---

### C. Change How Claude Deploys

#### Old Behavior (FORBIDDEN - Remove Permanently)

```bash
# ❌ Claude used to do this (NEVER AGAIN):
claude:
    - edits /etc/nginx/conf.d/*.conf
    - selects random ports (8080, 8082, 3000, etc.)
    - runs docker commands directly
    - restarts systemctl services
    - modifies firewall rules
    - breaks production environment
```

#### New Behavior (MANDATORY)

```bash
# ✅ Claude now ONLY does this:
1. Build code (write code, tests, Dockerfile)
2. Create Dockerfile (following standards)
3. Generate deploy.yaml (declarative config)
4. Call deployment script:

   sudo /opt/platform/deploy.sh deploy.yaml

5. Wait for health check result
6. Report success/failure
```

**Claude's Role**: Package generator, NOT sysadmin.

---

### D. Add Permanent Governance Rule to All Prompts

**Mandatory Rule** (Add to ALL CLAUDE.md files):

```markdown
## Platform-Layer Deployment Governance (#ADM Component 10)

Claude is FORBIDDEN to:
- ❌ Modify /etc/nginx/* (locked with chattr +i)
- ❌ Run systemctl (service management forbidden)
- ❌ Select ports (use ports.json registry)
- ❌ Run docker commands directly (use deploy.sh only)
- ❌ Create docker networks manually
- ❌ Modify firewall rules
- ❌ Touch /var/* directories (except /opt/platform/logs)

Claude is REQUIRED to:
- ✅ Produce deploy.yaml (declarative deployment config)
- ✅ Call /opt/platform/deploy.sh (ONLY deployment mechanism)
- ✅ Wait for health check (60s timeout)
- ✅ Report deployment result (success/failure/rollback)

Violation of these rules = IMMEDIATE STOP + escalate to human operator.
```

---

### E. Enable Safe Deployments

#### Blue-Green Deployment Flow

```
1. Build new image (project:v2.0.0)
   ↓
2. Start new container on assigned port (6101)
   ↓
3. Health check /health endpoint (30 retries × 2s = 60s)
   ↓
4. If SUCCESS:
   - Mark new container as active
   - Stop old container (project:v1.9.0)
   - Keep old image for 24h (rollback window)
   ↓
5. If FAILURE:
   - Stop new container
   - Restore old container (project:v1.9.0)
   - Alert operator
```

**Benefits**:
- ✅ Zero downtime (new container starts before old stops)
- ✅ Automatic rollback (old container preserved)
- ✅ No environment breakage (isolated deployment)
- ✅ No manual repair needed (self-healing)

---

### F. Standardized deploy.yaml Structure

**File**: `deploy.yaml` (generated by Claude for every deployment)

```yaml
# deploy.yaml - Declarative Deployment Configuration
# Generated by: Claude Code (Sonnet 4.5)
# Project: MEV Shield Enterprise Platform
# Version: 2.0.0
# Date: 2026-02-16

version: "1.0"

project: "mevshield"
version: "2.0.0"
environment: "production"

docker:
  dockerfile: "backend-enterprise/Dockerfile"
  context: "."
  platform: "linux/amd64"
  build_args:
    - "NODE_ENV=production"
  
registry:
  enabled: true
  url: "harbor.dlt.aurigraph.io/mevshield/backend"
  tag: "2.0.0"

health:
  endpoint: "/health"
  timeout: 60
  interval: 2
  retries: 30
  expected_status: 200
  expected_body:
    status: "healthy"

ports:
  # Ports assigned from /opt/platform/ports.json
  http: null      # Auto-assigned from registry (6101 for mevshield)
  grpc: null      # Auto-assigned (6201 for mevshield)
  metrics: null   # Auto-assigned (6301 for mevshield)

environment:
  - "NODE_ENV=production"
  - "JWT_SECRET=${JWT_SECRET}"
  - "DATABASE_URL=${DATABASE_URL}"
  - "REDIS_URL=${REDIS_URL}"

volumes:
  - "/opt/platform/apps/mevshield/data:/app/data"
  - "/opt/platform/logs/mevshield:/app/logs"

resources:
  cpu: "2"
  memory: "4G"
  
rollback:
  enabled: true
  previous_version: "1.9.0"
  timeout: 300

notifications:
  slack_webhook: "${SLACK_WEBHOOK_URL}"
  on_success: true
  on_failure: true

metadata:
  git_commit: "d06d1b0a"
  git_branch: "main"
  deployed_by: "claude-code"
  jira_ticket: "MEV-231"
```

---

### G. Enforcement Rules

#### Component 10 Mandatory Checks

**Before Deployment** (Pre-flight):
- ✅ deploy.yaml exists and validates
- ✅ Project in ports.json registry
- ✅ Dockerfile exists and compiles
- ✅ Health endpoint implemented
- ✅ Previous version tagged (for rollback)

**During Deployment**:
- ✅ Build succeeds
- ✅ Container starts
- ✅ Health check passes (60s window)
- ✅ No port conflicts
- ✅ Logs written to /opt/platform/logs

**After Deployment**:
- ✅ Service responding on assigned port
- ✅ NGINX upstream routing works
- ✅ Metrics endpoint accessible
- ✅ Old container stopped (if health passed)
- ✅ Deployment logged with git commit hash

**Rollback Triggers**:
- ❌ Health check fails after 60s
- ❌ Container crashes within 2 minutes
- ❌ Critical error in logs
- ❌ Manual rollback requested

---

### H. Aurigraph DLT Deployment Patterns

**Added**: February 17, 2026 (Post-V12 Consolidation)
**Context**: Aurigraph DLT V12 Platform deployment following Component 10 governance model

#### 1. Aurigraph Port Assignments

**Standard Port Registry** (`/opt/platform/ports.json` — Aurigraph section):

```json
{
  "ports": {
    "aurigraph-v12": {
      "http": 9003,
      "grpc": 9004,
      "metrics": 9090,
      "cluster_node_1": { "http": 9003, "grpc": 9004 },
      "cluster_node_2": { "http": 9013, "grpc": 9014 },
      "cluster_node_3": { "http": 9023, "grpc": 9024 }
    },
    "aurigraph-enterprise-portal": {
      "http": 3000,
      "metrics": 3001
    },
    "aurigraph-website-v3": {
      "http": 5173,
      "metrics": 5174
    }
  }
}
```

**Note**: Port 9003/9004 were standardized during V12 consolidation (Feb 16, 2026) to replace legacy port 9005.

---

#### 2. Aurigraph V12 deploy.yaml Template

**File**: `aurigraph-v12/deploy.yaml`

```yaml
# deploy.yaml - Aurigraph V12 Platform Deployment
# Generated by: Claude Code (Sonnet 4.5)
# Project: Aurigraph DLT V12 Platform (V11 API)
# Version: 12.0.0
# Date: 2026-02-17
# Platform-Layer Governance: Component 10 Compliant

version: "1.0"

project: "aurigraph-v12"
version: "12.0.0"
environment: "production"

# Conservative Consolidation Strategy:
# - Platform Version: V12 (infrastructure/features)
# - API Version: V11 (backward compatibility)
# - Package: io.aurigraph.v11.* (unchanged)
# - REST: /api/v11/* (unchanged)

docker:
  dockerfile: "aurigraph-v12/Dockerfile.production"
  context: "."
  platform: "linux/amd64"
  build_args:
    - "NATIVE_IMAGE=true"           # GraalVM native compilation
    - "QUARKUS_PROFILE=production"
  build_strategy: "on-server"       # CRITICAL: Build on server (not locally)

registry:
  enabled: true
  url: "harbor.dlt.aurigraph.io/aurigraph-v12/platform"
  tag: "12.0.0"
  credentials: "/opt/platform/configs/harbor-credentials.json"

health:
  endpoint: "/api/v11/health"       # V11 API compatibility
  timeout: 60
  interval: 2
  retries: 30
  expected_status: 200
  expected_body:
    status: "healthy"
    version: "11.0.0"               # API version
    platform: "V12"                 # Platform version

ports:
  # Ports from /opt/platform/ports.json (aurigraph-v12 section)
  http: null      # Auto-assigned: 9003
  grpc: null      # Auto-assigned: 9004
  metrics: null   # Auto-assigned: 9090

cluster:
  enabled: true
  topology: "3-node-raft"
  nodes:
    - name: "aurigraph-v12-node-1"
      http_port: 9003
      grpc_port: 9004
      role: "leader"
    - name: "aurigraph-v12-node-2"
      http_port: 9013
      grpc_port: 9014
      role: "follower"
    - name: "aurigraph-v12-node-3"
      http_port: 9023
      grpc_port: 9024
      role: "follower"

environment:
  - "QUARKUS_PROFILE=production"
  - "QUARKUS_HTTP_PORT=9003"
  - "QUARKUS_GRPC_SERVER_PORT=9004"
  - "AURIGRAPH_PERFORMANCE_TARGET_TPS=2000000"
  - "AURIGRAPH_PERFORMANCE_MODE=ENTERPRISE"
  - "AURIGRAPH_WAL_DIR=/var/lib/aurigraph/wal"
  - "AURIGRAPH_WAL_FLUSH_INTERVAL_MS=100"
  - "POSTGRES_URL=${POSTGRES_URL}"
  - "REDIS_URL=${REDIS_URL}"

volumes:
  - "/opt/platform/apps/aurigraph-v12/wal:/var/lib/aurigraph/wal"
  - "/opt/platform/apps/aurigraph-v12/data:/var/lib/aurigraph/data"
  - "/opt/platform/logs/aurigraph-v12:/app/logs"

resources:
  cpu: "8"                          # High performance requirements
  memory: "16G"                     # Native image + WAL subsystem

native_image:
  enabled: true
  gc: "serial"                      # GraalVM serial GC (not G1)
  startup_target: "<1000ms"
  memory_footprint: "<256MB"

rollback:
  enabled: true
  previous_version: "11.0.0"
  timeout: 300
  preserve_wal: true                # CRITICAL: Preserve WAL for recovery

home_channel:
  enabled: true
  topology: "37-nodes"
  distribution:
    validators: 7                   # 7V
    business: 20                    # 20B
    enterprise_integrators: 10      # 10EI

notifications:
  slack_webhook: "${SLACK_WEBHOOK_URL}"
  on_success: true
  on_failure: true
  jira_integration:
    enabled: true
    project: "AV11"
    auto_ticket_on_failure: true

metadata:
  git_commit: "7a89ef5595"          # V12 consolidation Phase 3
  git_branch: "V12"
  deployed_by: "@J4CDeploymentAgent"
  jira_ticket: "AV11-1346"
  consolidation_phase: "complete"
  versioning_strategy: "conservative"
```

---

#### 3. Aurigraph NGINX Configuration (Pre-Locked)

**File**: `/etc/nginx/conf.d/aurigraph-v12.conf` (locked with `chattr +i`)

```nginx
# Aurigraph V12 Platform - NGINX Upstream Configuration
# LOCKED: This file is immutable (chattr +i)
# DO NOT EDIT: Ports are pre-assigned in ports.json

upstream aurigraph_v12_backend {
    # 3-node cluster for high availability
    server 127.0.0.1:9003 max_fails=3 fail_timeout=30s;  # Node 1 (leader)
    server 127.0.0.1:9013 max_fails=3 fail_timeout=30s;  # Node 2
    server 127.0.0.1:9023 max_fails=3 fail_timeout=30s;  # Node 3
}

upstream aurigraph_v12_grpc {
    server 127.0.0.1:9004;  # gRPC node 1
    server 127.0.0.1:9014;  # gRPC node 2
    server 127.0.0.1:9024;  # gRPC node 3
}

server {
    listen 443 ssl http2;
    server_name dlt.aurigraph.io;

    ssl_certificate /etc/nginx/ssl/aurigraph.io.crt;
    ssl_certificate_key /etc/nginx/ssl/aurigraph.io.key;

    # V11 API endpoints (backward compatibility)
    location /api/v11/ {
        proxy_pass http://aurigraph_v12_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # gRPC endpoints
    location /grpc {
        grpc_pass grpc://aurigraph_v12_grpc;
        grpc_connect_timeout 60s;
        grpc_send_timeout 60s;
        grpc_read_timeout 60s;
    }

    # Health check endpoint (for monitoring)
    location /api/v11/health {
        proxy_pass http://aurigraph_v12_backend;
        access_log off;  # Don't log health checks
    }
}
```

**Important**: This file is locked after initial setup. Claude NEVER edits it. Deployments use pre-assigned ports.

---

#### 4. Aurigraph Deployment Command Flow

**Step 1: Claude Generates deploy.yaml** (✅ ALLOWED)

```bash
# In aurigraph-v12/ directory
cat > deploy.yaml <<'YAML'
# ... (deploy.yaml content from section 2 above)
YAML
```

**Step 2: Claude Calls Platform Deployer** (✅ ALLOWED)

```bash
sudo /opt/platform/deploy.sh aurigraph-v12/deploy.yaml
```

**Step 3: Platform Deployer Executes** (Automatic):

```
🚀 Deploying aurigraph-v12 v12.0.0...
✅ deploy.yaml validated
🔨 Building native image (15-20 min)...
   - GraalVM Mandrel 23.1
   - Serial GC (G1 not supported)
   - Target: <1s startup, <256MB memory
✅ Image built: aurigraph-v12:12.0.0
🚀 Starting 3-node cluster...
   - Node 1: 127.0.0.1:9003 (HTTP), 9004 (gRPC)
   - Node 2: 127.0.0.1:9013 (HTTP), 9014 (gRPC)
   - Node 3: 127.0.0.1:9023 (HTTP), 9024 (gRPC)
🏥 Health check: http://127.0.0.1:9003/api/v11/health
   ✅ Attempt 1/30: {"status":"healthy","version":"11.0.0","platform":"V12"}
✅ aurigraph-v12 activated on ports 9003/9004
✅ Deployment successful: aurigraph-v12 v12.0.0
```

**Step 4: Verify Home Channel Integration** (✅ ALLOWED)

```bash
# Claude can check Home Channel status via API
curl http://127.0.0.1:9003/api/v11/nodes/status

# Expected response:
{
  "total_nodes": 37,
  "validators": 7,
  "business_nodes": 20,
  "enterprise_integrators": 10,
  "healthy_nodes": 37,
  "consensus_state": "ACTIVE"
}
```

---

#### 5. Aurigraph-Specific Forbidden Actions

**❌ Claude MUST NEVER do these** (Component 10 violations):

```bash
# ❌ Edit NGINX config (locked)
sudo vim /etc/nginx/conf.d/aurigraph-v12.conf

# ❌ Manually select ports (use ports.json)
docker run -p 8080:9003 aurigraph-v12:latest

# ❌ Direct docker commands (use deploy.sh)
docker-compose -f docker-compose-production-complete.yml up -d

# ❌ Modify systemd services
sudo systemctl restart aurigraph-v12

# ❌ Touch WAL directory directly
sudo rm -rf /var/lib/aurigraph/wal/*

# ❌ Edit application.properties on server
sudo vim /opt/platform/apps/aurigraph-v12/src/main/resources/application.properties
```

**✅ Claude MUST do these instead** (Component 10 compliant):

```bash
# ✅ Generate deploy.yaml
cat > deploy.yaml <<'YAML'
# ... deployment config
YAML

# ✅ Call platform deployer
sudo /opt/platform/deploy.sh deploy.yaml

# ✅ Check deployment status
tail -f /opt/platform/logs/aurigraph-v12/deploy.log

# ✅ Verify health via API
curl http://127.0.0.1:9003/api/v11/health
```

---

#### 6. V12 Consolidation Integration

**Context**: V12 Platform Consolidation completed February 16-17, 2026 (Phases 0-3).

**Key Changes Affecting Deployment**:

1. **Directory Structure** (Phase 1):
   - Old: `aurigraph-av10-7/aurigraph-v11-standalone/`
   - New: `aurigraph-v12/`
   - **Impact**: Update all deployment paths in deploy.yaml

2. **Application Name** (Phase 2):
   - Old: `quarkus.application.name=aurigraph-v11-standalone`
   - New: `quarkus.application.name=aurigraph-v12`
   - **Impact**: Container names update to `aurigraph-v12-*`

3. **Port Standardization** (Phase 2):
   - Old: Port 9005 (development)
   - New: Port 9003 (production standard)
   - **Impact**: NGINX upstream already configured for 9003

4. **Docker Image Tags** (Phase 2):
   - Old: `aurigraph/v11-native-ultra:latest`
   - New: `aurigraph/v12-platform:latest`
   - **Impact**: Harbor registry paths updated

5. **API Compatibility** (Conservative Strategy):
   - Package: `io.aurigraph.v11.*` (UNCHANGED)
   - REST paths: `/api/v11/*` (UNCHANGED)
   - **Impact**: Zero breaking changes for clients

**Deployment Verification Post-Consolidation**:

```bash
# 1. Verify directory structure
ls -la aurigraph-v12/src/main/java/io/aurigraph/v11/

# 2. Verify application.properties
grep "quarkus.application.name" aurigraph-v12/src/main/resources/application.properties
# Expected: quarkus.application.name=aurigraph-v12

# 3. Verify docker-compose
grep "image:" aurigraph-v12/docker-compose-production-complete.yml
# Expected: image: aurigraph/v12-platform:latest

# 4. Verify API endpoints still work
curl http://127.0.0.1:9003/api/v11/health
curl http://127.0.0.1:9003/api/v11/info
curl http://127.0.0.1:9003/api/v11/version
```

---

#### 7. GraalVM Native Image Considerations

**Special Requirements for Aurigraph V12**:

1. **Serial GC (Not G1)**:
   ```properties
   # application.properties
   quarkus.native.additional-build-args=--gc=serial
   ```
   **Reason**: G1GC not supported in GraalVM native-image, must use serial GC.

2. **Build Strategy** (CRITICAL):
   ```yaml
   # deploy.yaml
   docker:
     build_strategy: "on-server"  # NEVER build locally (M1 Mac != AMD64 server)
   ```
   **Reason**: Avoid QEMU overhead, platform mismatches, and slow cross-compilation.

3. **Build Time**:
   - **Development build** (`-Pnative-fast`): ~2 minutes
   - **Production build** (`-Pnative`): ~15-20 minutes
   - **Impact**: Deployment takes 20+ minutes total (acceptable for production)

4. **Memory Requirements**:
   - **Build**: 8GB RAM minimum
   - **Runtime**: <256MB (native image benefit)
   - **Impact**: Server must have 16GB+ RAM for reliable builds

---

#### 8. Self-Hosted Runner Deployment Pattern

**Aurigraph uses @J4CDeploymentAgent** with self-hosted GitHub Actions runners.

**Workflow** (Component 10 Compliant):

```yaml
# .github/workflows/deploy-v12.yml
name: Deploy Aurigraph V12

on:
  push:
    branches: [V12]

jobs:
  deploy:
    runs-on: self-hosted-aurigraph  # Self-hosted runner on dlt.aurigraph.io

    steps:
      - uses: actions/checkout@v4

      - name: Generate deploy.yaml
        run: |
          cat > deploy.yaml <<'YAML'
          # ... (deploy.yaml from section 2)
          YAML

      - name: Deploy via Platform Layer
        run: |
          sudo /opt/platform/deploy.sh deploy.yaml

      - name: Verify Deployment
        run: |
          curl -f http://127.0.0.1:9003/api/v11/health || exit 1

      - name: Update JIRA
        if: success()
        run: |
          # @JIRAAgent updates ticket status
          ./scripts/jira-update.sh AV11-1346 "Deployed v12.0.0"
```

**Benefits**:
- ✅ No SSH credentials needed (runner has local access)
- ✅ Builds happen on server (correct architecture)
- ✅ Component 10 compliant (deploy.sh only)
- ✅ JIRA integration automatic (@JIRAAgent)

---

#### 9. Rollback Scenarios

**Scenario A: Health Check Fails** (Automatic)

```
🏥 Health check: http://127.0.0.1:9003/api/v11/health
   ❌ Attempt 30/30: Connection refused
⚠️  Rolling back to 11.0.0...
✅ Rollback complete (30 seconds)
```

**Scenario B: WAL Corruption Detected** (Automatic)

```
🏥 Health check passed, starting post-deploy verification...
❌ WAL integrity check failed: corrupted batch file detected
⚠️  Rolling back to 11.0.0...
✅ Rollback complete, WAL preserved for analysis
```

**Scenario C: Manual Rollback Requested** (Human-initiated)

```bash
# Human operator requests rollback
sudo /opt/platform/rollback.sh aurigraph-v12 11.0.0

# Platform executes:
# 1. Stop current containers (v12.0.0)
# 2. Restore previous containers (v11.0.0)
# 3. Verify health
# 4. Log rollback event
```

---

#### 10. Quick Reference: Aurigraph V12 Deployment

| Aspect | Value |
|--------|-------|
| **Project** | aurigraph-v12 |
| **Ports** | 9003 (HTTP), 9004 (gRPC), 9090 (metrics) |
| **Cluster** | 3 nodes (9003/9013/9023) |
| **Health Endpoint** | `/api/v11/health` |
| **Platform Version** | V12 (infrastructure) |
| **API Version** | V11 (backward compatibility) |
| **Package Namespace** | `io.aurigraph.v11.*` (UNCHANGED) |
| **REST Paths** | `/api/v11/*` (UNCHANGED) |
| **Native Image** | Yes (GraalVM Mandrel 23.1, serial GC) |
| **Build Strategy** | On-server (NOT local) |
| **Build Time** | 15-20 minutes (production) |
| **Startup Target** | <1 second |
| **Memory Target** | <256MB |
| **Deployment Agent** | @J4CDeploymentAgent (self-hosted runner) |
| **Harbor Registry** | `harbor.dlt.aurigraph.io/aurigraph-v12/platform:12.0.0` |
| **Home Channel** | 37 nodes (7V + 20B + 10EI) |
| **JIRA Project** | AV11 (Smart Commits format) |
| **Rollback Window** | 24 hours (automatic) |

---

### I. Integration with Other #ADM Components

#### Component 5-6: Deploy + Verification

**OLD** (Pre-Component 10):
```bash
# Direct docker/nginx manipulation (FORBIDDEN NOW)
docker-compose down
docker-compose build
docker-compose up -d
nginx -t && nginx -s reload
```

**NEW** (Component 10 Compliant):
```bash
# Generate deploy.yaml
claude generates: deploy.yaml

# Call platform deployer
sudo /opt/platform/deploy.sh deploy.yaml

# Platform deployer handles:
# - Port assignment
# - Build
# - Health check
# - Activation
# - Rollback (if needed)
```

#### Component 8: Auto-Recovery

**Integration**: Platform deployer logs to `/opt/platform/logs/` for Component 8 monitoring.

```bash
# Component 8 autonomous recovery checks deployment logs
tail -f /opt/platform/logs/mevshield/deploy.log

# If deployment failed:
# - Component 8 alerts J4C
# - J4C creates JIRA ticket
# - Escalates to human operator
```

---

### J. Migration Path (Existing Projects)

#### Phase 1: Setup (1-2 hours)
1. Create `/opt/platform/` directory structure
2. Create `ports.json` registry (assign ports to all projects)
3. Lock NGINX config (`chattr +i`)
4. Create `deploy.sh` script
5. Create `claude-deploy` user with restricted permissions

#### Phase 2: Migrate Projects (per project, 1-2 hours each)
1. Generate `deploy.yaml` for each project
2. Test deployment via `deploy.sh` in staging
3. Verify health checks work
4. Update project CLAUDE.md with Component 10 rules
5. Deploy to production using new flow

#### Phase 3: Enforcement (ongoing)
1. Add Component 10 rules to global CLAUDE.md
2. Monitor deployments for rule violations
3. Auto-reject any direct nginx/docker manipulation
4. Audit deployment logs monthly

---

### K. Success Metrics

**Before Component 10** (Legacy):
- ❌ 60% deployment failure rate (nginx breakage)
- ❌ 2-4 hour manual recovery time
- ❌ Production downtime: 30-90 minutes per incident
- ❌ Random port selection causes conflicts
- ❌ No rollback mechanism (manual restoration)

**After Component 10** (Target):
- ✅ 95%+ deployment success rate (automated rollback)
- ✅ <5 min deployment time (zero downtime)
- ✅ <30 sec rollback time (automatic)
- ✅ Zero port conflicts (registry-assigned)
- ✅ Zero manual infrastructure repairs

---

### L. Quick Reference

| Aspect | Rule |
|--------|------|
| **NGINX** | Locked with `chattr +i` — AI cannot edit |
| **Ports** | Pre-assigned in `ports.json` — AI cannot choose |
| **Deployment** | ONLY via `/opt/platform/deploy.sh` |
| **Docker** | ONLY via `docker-compose` (no direct commands) |
| **Systemctl** | FORBIDDEN (no service management) |
| **Rollback** | Automatic (on health check failure) |
| **Downtime** | Zero (blue-green deployment) |
| **Claude's Role** | Package generator (NOT sysadmin) |

---

**Remember**: Component 10 converts uncontrolled AI sysadmin access into controlled platform-layer deployments. Server becomes stable infrastructure. Claude becomes a package generator. Deployments stop breaking permanently.


---

## Component 11: DMRV-Verified AI Model Quantization (#MANDATORY #MEMORIZED — Apr 13, 2026)

> **Rule**: ALL AI/ML models deployed in ANY Aurigraph project MUST be quantized using **Google TurboQuant** (INT4 or INT8) AND the quantization event MUST flow through the **Aurigraph DMRV pipeline** for multi-signatory verification before `/deploy` is permitted.
>
> **Scope**: Applies to ALL Aurigraph projects — DLT V12, J4C Portal, Website V3, Provenews, MEV Shield, Battua, future projects. No exceptions.
>
> **References**:
> - *"TurboQuant: Online Data-Free Quantization via Randomized Rotations"* (Google Research, 2025)
> - Aurigraph DMRV Framework (PCT-AUR-009, production since v12.0.34)
> - NEW patent candidate: **PCT-AUR-023** — DMRV-Verified AI Model Quantization

### Scope (Applies To)

| Production AI Surface | Models Affected | Why Quantization Matters |
|-----------------------|-----------------|--------------------------|
| **NemoClaw AI** (enterprise intelligence) | LLM ensemble (fine-tuned) | 4× memory savings enables self-hosted inference on commodity GPUs |
| **HyperRAFT++ AI Optimizer** | Consensus tuning model | Sub-ms inference required per consensus round — INT8 is 3-5× faster |
| **DMRV Event Classifiers** | Carbon credit verification | Runs on edge/IoT devices — quantized models fit on ARM SoCs |
| **Legal BERT** (contract analysis) | BERT fine-tune for Ricardian compliance | 4× size reduction = deployable in browser via WASM |
| **Contract Template Recommender** | Sentence transformer | Faster embeddings for real-time template matching |

**Exclusions**: Research/experimental models (NOT yet deployed), models used only for training/evaluation.

### Mandatory Quantization Targets

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| **Model size reduction** | ≥ 3.5× (INT4) or ≥ 2× (INT8) | Smaller models = faster cold start + lower memory pressure |
| **Accuracy loss** | ≤ 2% on representative eval set | TurboQuant's rotation approach typically achieves <1% |
| **Inference latency improvement** | ≥ 2× vs FP32 baseline | Verified on target deployment hardware, not synthetic benchmark |
| **Throughput gain** | ≥ 2× tokens/sec or samples/sec | On same hardware |
| **Calibration data** | Zero required | TurboQuant is data-free — no leakage risk |

### Integration Workflow (@AIMLArchitect + DMRV Pipeline)

**Pre-deployment gate** — all models must pass DMRV verification before `/deploy`:

```
┌────────────────────────────────────────────────────────────┐
│  1. MONITORING — Baseline Measurement (FP32)              │
│     • Train/fine-tune model in FP32                        │
│     • Measure accuracy on canonical eval set               │
│     • Measure size, latency, throughput                    │
│     • Hash FP32 artifact → baseline_hash                   │
│     • Emit DMRV event: MODEL_BASELINE_MEASURED            │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  2. QUANTIZATION — Apply TurboQuant                        │
│     • Rotation-based PTQ (Hadamard rotations)              │
│     • INT8 (default) or INT4 (edge/mobile)                 │
│     • Zero calibration data (GDPR-safe)                    │
│     • Hash quantized artifact → quantized_hash             │
│     • Emit DMRV event: QUANTIZATION_APPLIED               │
│       {baseline_hash, quantized_hash, method, precision}   │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  3. REPORTING — Measure Post-Quantization                 │
│     • Accuracy on same eval set                            │
│     • Size, latency, throughput on target hardware         │
│     • Compute deltas vs baseline                           │
│     • Emit DMRV event: POST_QUANT_MEASURED                │
│       {accuracy_delta, size_ratio, latency_ratio,          │
│        throughput_ratio, target_hardware}                  │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  4. VERIFICATION — Multi-Signatory DMRV Attestation       │
│     • Primary verifier: @AIMLArchitect agent               │
│     • Secondary verifier: @QAAgent (independent re-run)    │
│     • Tertiary verifier: @ApproverAgent (ADM gate)        │
│     • Each verifier signs the DMRV event with Ed25519      │
│     • BFT quorum (2-of-3) required for APPROVED status     │
│     • Emit DMRV event: QUANTIZATION_VERIFIED              │
│       {verifiers[], signatures[], quorum_met: true}        │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  5. ON-CHAIN REGISTRATION                                  │
│     • DMRV attestation recorded on Aurigraph DLT           │
│     • assetId pattern: MODEL-<project>-<name>-<version>    │
│     • Channel: compliance-channel (SELECTIVE)              │
│     • Compliance frameworks evaluated: ISO/IEC 23894       │
│       (AI risk mgmt), EU AI Act, NIST AI RMF              │
└───────────────────────┬────────────────────────────────────┘
                        ↓
              /deploy  ← DMRV query returns APPROVED
```

### Approval Gate Checklist

`/deploy` queries the DMRV ledger — NOT a local file. All checks are cryptographically verifiable and replay-proof:

- [ ] **DMRV event `QUANTIZATION_VERIFIED` exists** on-chain for `{project, model, version}`
- [ ] **BFT quorum met** — ≥ 2 of 3 signatory verifiers approved (@AIMLArchitect, @QAAgent, @ApproverAgent)
- [ ] **Event timestamp ≤ 30 days old** — stale attestations force re-verification
- [ ] **Accuracy delta ≤ 2%** — reported by POST_QUANT_MEASURED event
- [ ] **Size reduction ≥ 2× (INT8) or ≥ 3.5× (INT4)**
- [ ] **Latency improvement ≥ 2×** on target hardware
- [ ] **Calibration data: NONE** — TurboQuant data-free property enforced
- [ ] **Baseline hash + quantized hash** both registered on-chain
- [ ] **Compliance frameworks evaluated** — ISO/IEC 23894, EU AI Act, NIST AI RMF
- [ ] **FP32 baseline retained** in Aurigraph DLT artifact store (rollback)

If ANY check fails → `/deploy` is BLOCKED. The DMRV ledger returns a specific `ERR_DMRV_*` code identifying which gate failed.

### Why TurboQuant (vs GPTQ/AWQ/SmoothQuant)

| Method | Calibration data? | Accuracy retention | Speed | Aurigraph fit |
|--------|-------------------|--------------------|-------|---------------|
| **TurboQuant** | None (data-free) | Excellent | Fastest | ✅ Ideal |
| GPTQ | Required (100-1000 samples) | Very good | Slow | ❌ Data leakage risk |
| AWQ | Required | Good | Medium | ❌ Data leakage risk |
| SmoothQuant | Required (activation stats) | Good | Fast | ❌ Data leakage risk |

**Aurigraph Constraint**: Customer PII and compliance data flow through our AI pipelines. Using customer data for calibration creates GDPR/DPA complications. TurboQuant's data-free property eliminates this risk entirely.

### Tooling

**Python (AI/ML layer)**:
```python
from turboquant import quantize

quantized_model = quantize(
    model,
    precision="int8",        # or "int4"
    rotation="hadamard",     # default
    device="cuda",
)
```

**Java (platform runtime)** — TensorFlow Lite or ONNX Runtime with pre-quantized model:
```java
// Load quantized ONNX model via ONNX Runtime
OrtSession session = env.createSession("nemoclaw-int8.onnx", options);
```

### Observability

Every quantized model in production MUST emit these metrics:

| Metric | Type | Purpose |
|--------|------|---------|
| `ai_model_inference_duration_seconds` | Histogram | p50/p95/p99 latency per request |
| `ai_model_accuracy_drift` | Gauge | Compare quantized output to FP32 shadow (sampled) |
| `ai_model_quantization_precision` | Gauge enum | 32, 16, 8, 4 (for rollback triage) |
| `ai_model_size_bytes` | Gauge | Track artifact size over time |

Alert rules:
- `accuracy_drift > 3%` for 5 consecutive samples → **CRITICAL** (model has degraded beyond spec)
- `inference_duration p95 > 2× baseline` → **WARNING** (quantization didn't deliver expected speedup)

### Model Registry (On-Chain via DMRV)

Artifacts live in Aurigraph DLT's artifact storage, metadata lives in DMRV events:

**Artifact Storage** (content-addressable, hash-indexed):
```
aurigraph-dlt://artifacts/ml-models/
├── <baseline_hash>.safetensors     (FP32 — retained indefinitely for rollback)
├── <quantized_hash>.onnx           (production artifact, INT8 or INT4)
└── <eval_set_hash>.jsonl           (frozen eval set — reproducibility)
```

**DMRV Event Chain** (queryable on-chain):
```
Asset ID: MODEL-<project>-<name>-<version>
   Example: MODEL-v12-nemoclaw-ai-v2.1.0

Event Sequence:
  1. MODEL_BASELINE_MEASURED   (FP32 metrics + baseline_hash)
  2. QUANTIZATION_APPLIED       (method=TurboQuant, precision=INT8, quantized_hash)
  3. POST_QUANT_MEASURED        (accuracy_delta, size_ratio, latency_ratio)
  4. QUANTIZATION_VERIFIED      (multi-sig BFT quorum, signatures[])
  5. QUANTIZATION_DEPLOYED      (deployment target, timestamp)
  6. [Optional] QUANTIZATION_REVOKED  (emergency rollback trigger)
```

### Enforcement (Cross-Project)

Every Aurigraph project's `deploy.yaml` MUST include this pre-hook:

```yaml
# deploy.yaml (required in ALL Aurigraph projects with AI models)
pre_deploy_hooks:
  - name: "DMRV-Verified AI Quantization Check"
    command: "scripts/check-ai-quantization-dmrv.sh"
    required: true  # blocks deploy on failure
    inputs:
      project: "${PROJECT_NAME}"
      dlt_endpoint: "https://dlt.aurigraph.io/api/v11"
```

The `check-ai-quantization-dmrv.sh` script queries the DMRV ledger:

```bash
#!/bin/bash
# Queries DMRV for all models listed in ml-models.manifest
for model in $(cat ml-models.manifest); do
    # Query the most recent QUANTIZATION_VERIFIED event
    event=$(curl -s "https://dlt.aurigraph.io/api/v11/dmrv/events" \
      --data-urlencode "assetId=$model" \
      --data-urlencode "eventType=QUANTIZATION_VERIFIED")

    # Verify quorum, timestamp freshness, accuracy thresholds
    if ! jq -e '.quorumMet and (.timestamp | (now - fromdate) < 2592000)' <<<"$event"; then
        echo "❌ Model $model lacks valid DMRV verification"
        exit 1
    fi
done
echo "✅ All models have valid DMRV attestations"
```

**Key property**: The check is **cryptographically verifiable** — verifiers cannot forge `QUANTIZATION_VERIFIED` events without access to the Ed25519 signing keys held by the @AIMLArchitect, @QAAgent, and @ApproverAgent. This is the same security model as carbon credit DMRV attestations.

### Applies to ALL Aurigraph Projects

| Project | AI Surfaces Requiring DMRV Quantization |
|---------|-----------------------------------------|
| **Aurigraph DLT V12** | NemoClaw AI, HyperRAFT++ Optimizer, Legal BERT, Contract Template Recommender |
| **J4C Portal** | Sprint Intelligence (workload-forecast, release-forecast, sprint-plan models) |
| **Website V3** | Analytics recommendation model, newsletter personalization |
| **Provenews** | C2PA verification classifier, content authenticity scorer |
| **MEV Shield** | Composite risk scoring model, sandwich-detection classifier |
| **Battua** | Fraud detection ensemble, transaction categorization model |
| **Future projects** | ANY model that runs in production |

No project-level exemptions. If a project uses an AI model in production, that model MUST have a fresh DMRV-verified quantization attestation on-chain.

### Patent Tie-in

**PCT-AUR-023 (NEW)** — DMRV-Verified AI Model Quantization:

> A method for verifying post-training quantization of machine learning models using a distributed-ledger Digital Monitoring, Reporting, and Verification pipeline, wherein quantization events are (a) cryptographically hashed to bind baseline and quantized artifacts, (b) multi-signatory attested by independent verifier agents using BFT quorum rules, (c) immutably recorded on a permissioned distributed ledger, and (d) queried by deployment pipelines as a gating condition — providing tamper-evident audit trails for AI model compliance with regulatory frameworks including ISO/IEC 23894, EU AI Act, and NIST AI RMF.

**Novelty**: No prior art for DMRV-style cryptographic attestation of AI model quantization. This extends the Aurigraph DMRV framework (originally for carbon/battery/ESG events) into the AI compliance domain. Addresses a growing regulatory gap — EU AI Act requires model provenance documentation but provides no verification mechanism.

**Patentability score**: 9.0/10 (very high novelty, strong compliance tailwind).

### Compliance Mapping

DMRV-verified quantization satisfies multiple regulatory frameworks out of the box:

| Framework | Requirement | How Component 11 Satisfies |
|-----------|-------------|---------------------------|
| **EU AI Act Art. 12** | Technical documentation of AI systems | DMRV event chain provides full model lineage |
| **EU AI Act Art. 13** | Transparency + info to deployers | On-chain metadata queryable by customers |
| **ISO/IEC 23894:2023** | AI risk management — traceability | Cryptographic hash chain from training to deploy |
| **NIST AI RMF 1.0** | Measure function (MP-1 through MP-5) | Accuracy/latency/size metrics on-chain |
| **GDPR Art. 22** | Meaningful info about automated decisions | Model version + quantization method queryable |
| **Aurigraph DPA** | Processor obligations | No customer data in quantization pipeline |

### Rollback Strategy

If a quantized model shows accuracy drift beyond spec in production:
1. **Immediate**: Circuit-breaker routes traffic to FP32 baseline shadow
2. **Short-term**: Rollback to previous quantized version
3. **Long-term**: Retrain FP32, re-quantize, re-validate, redeploy

Always keep the FP32 baseline in the registry — NEVER delete. Storage cost is trivial; rollback capability is priceless.

---

## Infrastructure Standards (#MANDATORY #MEMORIZED)

> Moved from global CLAUDE.md — Feb 19, 2026

---

### #gRPC/HTTP2 Standard

**Rule**: ALL real-time communication MUST use **gRPC/Protobuf/HTTP2** — NOT WebSocket, NOT SSE, NOT long polling.

**Applies To**: All Aurigraph projects (DLT, J4C, Website V3, Provenews, future projects)

**Why gRPC > WebSocket**:

| Reason | gRPC | WebSocket |
|--------|------|-----------|
| Type Safety | Protobuf schemas, compile-time checks | JSON — runtime errors only |
| Performance | Binary, 3-10× faster than JSON | Text/JSON |
| Multiplexing | HTTP/2 — multiple streams on 1 connection | Single stream per connection |
| Tooling | Code gen for Java, Python, TypeScript, Go | Manual client code |
| Consistency | DLT V11/V12 already on gRPC (port 9004) | Fragmented |

**Use Cases**: Real-time monitoring, live failure/recovery events, service-to-service, frontend ↔ backend real-time, cross-chain bridge

**Browser Support**: Use **gRPC-Web** (Envoy proxy) to bridge browser ↔ gRPC backend

**Documentation**: `~/.claude/GRPC_HTTP2_STANDARD.md` (1,100+ lines, complete guide)

**Enforcement**: Mandatory since February 13, 2026

---

### Docker Compose Best Practices

**Rule**: ONE `docker-compose.yml` per project. Override via `.env` files, NOT duplicate compose files.

**Anti-Patterns** (NEVER):
- ❌ `docker-compose.dev.yml` + `docker-compose.prod.yml` — creates config drift
- ❌ `docker-compose.staging.yml` — separate files → deployment confusion
- ❌ Multiple compose files in same directory

**Correct Pattern**: Single `docker-compose.yml` + `.env` files for environment differences.

**Orphan Container Prevention** (MANDATORY — run on every deploy):
```bash
docker-compose down --remove-orphans  # Before: removes stale containers from renamed services
docker-compose up -d --force-recreate --remove-orphans  # After: applies .env changes
```

**Why `--force-recreate`**: Docker `restart` does NOT reload `.env` values — always recreate to apply env changes.

---

### NGINX Deploy Pattern — Bind-Mount Inode Stale (#MANDATORY — Apr 21, 2026)

**Rule**: After overwriting an NGINX config file on a bind-mounted path, the container still serves the **old** content because `cp` creates a new inode. This is INS-089 and has caused 3 production incidents.

**Correct Deploy Sequence**:
```bash
# 1. Backup
cp /opt/<project>/nginx/gateway.conf /opt/<project>/nginx/gateway.conf.bak.$(date +%Y%m%d)

# 2. Overwrite (via SCP or cp)
scp -P 2244 local-nginx.conf subbu@TARGET:/opt/<project>/nginx/gateway.conf

# 3. RESTART container (NOT just reload — inode is stale)
docker restart <nginx-container>

# 4. Wait for health
sleep 5 && docker ps --filter name=<nginx-container> --format "{{.Names}} {{.Status}}"

# 5. Verify (external curl — NOT localhost)
curl -sI https://<domain>/ | grep -i "content-security-policy"
```

**Why NOT `nginx -s reload`**: Reload re-reads the config from the container's virtual filesystem, which still maps to the old inode. Only `docker restart` re-opens the bind mount.

**Why NOT `docker exec nginx -t` alone**: `nginx -t` inside the container tests the **cached** config (old inode), not the new file. It will pass even when the new config has errors — you'll only discover the problem after restart.

---

### SSL Cert Path Verification (#MANDATORY — Apr 21, 2026)

**Rule**: Before deploying ANY NGINX config, verify the SSL certificate paths match what's on the server.

**Gate 0 violation pattern**: Writing `ssl_certificate /etc/nginx/certs/battua.crt` when the server actually has `/etc/nginx/certs/fullchain.pem`. NGINX fails to start, causing downtime.

**Pre-deploy check**:
```bash
# Check actual cert files on server
ssh -p 2244 subbu@TARGET 'ls -la /opt/<project>/nginx/certs/'

# Check what the current working config uses
ssh -p 2244 subbu@TARGET 'grep ssl_certificate /opt/<project>/nginx/gateway.conf'

# Verify your new config uses the same paths
grep ssl_certificate local-nginx.conf
```

**Apply to ALL projects**: battua.io, dlt.aurigraph.io, j4c.aurigraph.io, provenews.com, mevshield.ai

---

### Pentest-Driven Security Hardening Workflow (#RECOMMENDED — Apr 21, 2026)

**Pattern**: Passive pentest → findings doc → prioritized fix → deploy → verify → Phase B active testing.

**Phase A (Passive + Read-Only)**:
1. Run OWASP WSTG passive probes against production (no mutation, no third-party systems)
2. Commit findings to `pentest/results/YYYY-MM-DD-<target>/FINDINGS.md`
3. Commit reproducer script to `probes.sh`
4. Prioritize: P0 → P1 → P2 → P3 by attacker-value ÷ effort

**Fix Priority Order** (proven effective on Battua):
| Order | Category | Typical Fix | Effort |
|-------|----------|-------------|--------|
| 1 | Info exposure (OpenAPI, health topology) | Config flip + NGINX block | 15 min |
| 2 | Missing security headers (CSP, Permissions-Policy) | NGINX add_header | 30 min |
| 3 | Auth gaps (unauthenticated data endpoints) | @Authenticated annotation | 15 min |
| 4 | Rate limiting gaps | NGINX limit_req_zone | 30 min |
| 5 | SPA catch-all noise (200 for .env, .git) | NGINX location block | 20 min |
| 6 | Header cleanup (server_tokens, X-XSS-Protection) | NGINX directives | 10 min |
| 7 | RFC 9116 (security.txt) + robots.txt | NGINX inline return | 10 min |

**Phase B (Active — Local Only)**:
1. Spin up service locally via Docker Compose
2. Run active probes (SQL injection, XSS, IDOR, auth bypass, JWT tampering)
3. Commit findings separately from Phase A

**Verification Suite** (run after every security deploy):
```bash
# F-01 check: dev endpoints blocked
curl -sk -o /dev/null -w "%{http_code}" https://$DOMAIN/q/openapi  # expect 404

# F-02 check: health stripped
curl -sk https://$DOMAIN/q/health | python3 -c "import json,sys; d=json.load(sys.stdin); print('host' not in str(d))"  # expect True

# F-03 check: CSP present
curl -sI https://$DOMAIN/ | grep -qi content-security-policy && echo PASS

# F-05 check: auth required on data endpoints
curl -sk -o /dev/null -w "%{http_code}" https://$DOMAIN/api/v11/wallet/balances  # expect 401

# Sensitive paths blocked
for p in .env .git/config Dockerfile; do
  CODE=$(curl -sk -o /dev/null -w "%{http_code}" "https://$DOMAIN/$p")
  [ "$CODE" = "404" ] && echo "$p: PASS" || echo "$p: FAIL ($CODE)"
done
```

---

### Codebase Verification Before Planning (#MANDATORY — Apr 21, 2026)

**Rule**: Before writing an implementation plan for any feature, verify what already exists in the codebase. Design specs can be stale.

**Incident**: Battua Sprint 1/2 design spec said "awaiting writing-plans" but the code was already ~90% built — all frontend pages, backend resources, services, tests, and Flyway migrations existed. Writing a from-scratch plan would have duplicated 144 tasks that were already done.

**Pre-plan verification**:
```bash
# 1. Check if the feature directories exist
find src -type d -name "*defi*" -o -name "*cbdc*" -o -name "*agent*"

# 2. Check if resource/service classes exist
find src -name "*Resource.java" -o -name "*Service.java" | grep -i <feature>

# 3. Check if tests exist
find src/test -name "*<Feature>*Test*"

# 4. Check if Flyway migrations exist
find src/main/resources/db -name "V*__<feature>*"

# 5. Check frontend pages
find web-portal/src -name "*<Feature>Page*"
```

**If feature is >50% built**: Write a **gap-fill plan** (only what's missing), not a full plan.

---

### Docker Networking Troubleshooting — MTU Mismatch

**Symptom**: Docker builds timeout reaching package repositories (apt-get/apk) but host `curl` succeeds.

**Root Cause**: MTU mismatch — default Docker MTU (1500) exceeds network infrastructure MTU → packet fragmentation.

**Fix** (✅ VERIFIED on dlt.aurigraph.io, j4c.aurigraph.io):
```json
// /etc/docker/daemon.json
{
  "mtu": 1442,
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
```
```bash
sudo systemctl restart docker
```

**Verification**:
```bash
docker run --rm debian:bookworm-slim bash -c "apt-get update && echo SUCCESS"
docker network inspect bridge | grep Mtu
```

**When to Apply**: Any server where Docker apt-get/apk hangs at "Connecting to…" or times out.
