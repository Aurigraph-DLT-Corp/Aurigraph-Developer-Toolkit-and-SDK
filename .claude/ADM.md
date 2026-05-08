# Aurigraph Dev Mode (#ADM) — Complete Framework

> **Updated**: May 5, 2026 | **Version**: 2.10.7 — **Numbered registry**: ADM-056 → ADM-086 (Appendix A + operational sections below). **P0 cross-cuts**: 068 `@J4CDeploymentAgent` deploy binding; 069 sequential task queue; 070 OAuth email-domain allowlist; 071 DB-authoritative three-tier RBAC; 072 stub-mode integration adapters; 073 L1 image–source drift check; 074 RO source bind-mount (rec); 075 fleet `scripts/j4c-agent.py` + `.j4c-agent.json`; **076 / 076-A** kgraph-first reads + ADM file watcher re-ingest; **077–079** project-bound LLM gateway keys, completion-path smoke checks, and reboot-persistent AutoHeal Layer 2 timers; **080** external project-scoped kgraphs; **081** SPA `index.html` no-cache; **082** Express literal-prefix routes before `:id`; **083** web-hook ↔ API-route response-shape co-test; **084** `email_verified_at` is the single source of truth for verified state; **085** onboarding horizontal top-mounted stepper (rec); **086** per-repo operational profile in `docs/<Project>.md` + slim `CLAUDE.md` pointer (AurexV4 `docs/AurexV4.md`). **Platform**: 067 LLM Gateway (Gemma→Claude, hashed keys); 066 Healthcare CCAA on DLT + **067-A** nginx-gateway edge routing (Traefik labels inert on live DLT). **PR review**: Cursor **Bugbot** per repo — `cursor.com/dashboard/bugbot` (complements Tier-7 SCMAgent, does not replace it). | **Complete Specification**: All 11 components + 0b/0c
> **KMS (OpenBao — J4C)**: **`https://j4c.aurigraph.io/openbao`** — secrets engine (KV v2, AppRole, etc.). Battua and sibling services use this **HTTPS API base** for KMS operations; it is **not** a Docker registry. Operational detail: `docs/J4C_OPENBAO.md`.
> **Docker image registry (Harbor — J4C)**: **`https://j4c.aurigraph.io/harbor`** — OCI/Docker images (push/pull, projects, replication). **Do not confuse** with the OpenBao KMS URL above.
> **Context Knowledge Graph (J4C)**: **`https://j4c.aurigraph.io/kgraph`** — ADM Component 7 interactive graph (context files, entities, edges). Local/embedded builds may expose **`/knowledge-graph`**; **J4C canonical path is `/kgraph`**. External project graphs use `/api/v3/kgraph/external/*` with project + graph selectors (ADM-080).
> **Harbor (J4C) — extended**: UP (J4C server 151.242.51.57:2244). **Admin credentials**: use org vault / local `credentials.md` (gitignored) — do not embed in this file. Projects: `aurigraph-v12`, `battua`, `library`. Push via `localhost:5001` on J4C. **Known issue**: registry→core notification sink broken after config volume reset — push completes but artifacts don't appear in Harbor UI/API. Requires `prepare` script re-run to regenerate registry `config.yml`. Production images are deployed directly on DLT server via emergency deploy pattern.
> **Principle**: Unified, autonomous development methodology executed end-to-end without manual intervention
> **NEW (Apr 27, 2026)**: Component 5-6 — **Healthcare CCAA (Critical Care) on Aurigraph DLT**: Ship as a **separate** Docker Compose project (`name: healthcare-dlt` — not the main `Aurigraph-DLT` `docker compose` tree) on the **same** host as Traefik, joining the external `dlt-frontend` network. Public URL: **`https://dlt.aurigraph.io/healthcare/`** (static UI + FastAPI; API under `/healthcare/v1/…`, `URL_PREFIX=/healthcare`). **Deploy** from dev laptop: `scripts/deploy-dlt.sh` (default `rsync` → `/opt/healthcare-dlt`, `SERVER_PORT=2244` for `ssh -p 2244 subbu@dlt.aurigraph.io`). Traefik labels: **API router priority 100** (`PathPrefix /healthcare/v1` + `/healthcare/healthz`), **static router priority 10** (`PathPrefix /healthcare`) so APIs win. **Live edge (ADM-067-A):** `dlt.aurigraph.io` uses **`aurigraph-nginx-gateway`**, not Traefik — add `location` blocks to `dlt.conf`; SPA must not use a global **401 → `/login`** axios interceptor on public marketing routes (OWASP gate Apr 22). Repo: `healthcsare/healthcare` (FastAPI + React; optional Go calc parity). *Note: J4C Harbor on host `151.242.51.57:2244` is a different service than DLT SSH — do not conflate; both may use 2244 on different hosts.*
> **NEW (Apr 22, 2026)**: Component 6 Enhancement — **OWASP Web Security Audit Gate**: Pre-deploy HTTP security header audit MANDATORY for all web-facing projects. Checklist: (1) `server_tokens off` + `app.disable('x-powered-by')` — no version disclosure, (2) HSTS with `preload`, (3) CSP without `unsafe-eval` (remove for Vite/Webpack prod builds), (4) Permissions-Policy blocking camera/mic/geo/payment, (5) COOP `same-origin` + CORP `same-origin`, (6) No deprecated headers (remove X-XSS-Protection), (7) Single CORS authority (NGINX strips backend CORS via `proxy_hide_header`), (8) API error routes return proper HTTP status (not 500 from response_model mismatch), (9) No global 401→/login redirect in API client interceptors (AuthContext `/auth/me` returns 401 for all unauthenticated visitors — interceptor must NOT navigate). Proven: Website V3 audit found 12 issues, all fixed in one PR (#29).
> **NEW (Apr 22, 2026)**: Component 6 Enhancement — **OWASP Dependency-Check Gate**: `failBuildOnCVSS=7` enforced pre-deploy. Suppression file (`dependency-check-suppression.xml`) with mandatory `<notes>` for each false positive. Battua: 19 CVEs → 0 blocking via Quarkus 3.23→3.27.2 upgrade + 7 documented suppressions. Run: `./mvnw org.owasp:dependency-check-maven:12.2.1:check -DfailBuildOnCVSS=7`.
> **NEW (Apr 22, 2026)**: Component 2 Enhancement — **Sprint 3+ Parallel Delivery**: 3 independent features (PSBT BIP-174, MPC guardian recovery, Esplora mainnet) implemented via 3 parallel background agents in single session. +1,432 lines, 6 new endpoints, 20 tests. Pattern: explore → dispatch 3 agents → compile → fix conflicts → commit once.
> **NEW (Apr 22, 2026)**: Component 5 Enhancement — **Quarkus Host-Mount Deploy Pattern**: When docker-compose uses `image: eclipse-temurin:25-jre` with bind-mounted `quarkus-app/`, the deploy path is: `mvn package` → tar quarkus-app/ → SCP → extract to /opt/project/quarkus-app/ → `docker compose down --remove-orphans && up -d --force-recreate`. Docker image build+load is NOT needed (no custom Dockerfile for the app container).
> **NEW (Apr 22, 2026)**: Component 5-6 Enhancement — **Deployment Agent Post-Deploy Test Cascade**: 4-level test cascade after every deploy: L1 (unit+integration on changed features) → L2 (smoke on unchanged platform) → L3 (regression on all changes) → L4 (full E2E). All failures auto-logged to JIRA as bug tickets. If >3 bugs, auto-create regression fix sprint. Escalation rules: L2 fail = collateral damage sprint, L3 fail = architecture review, L4 fail = consider rollback.
> **NEW (Apr 24, 2026)**: Component 7 Enhancement — **Context Knowledge Graph**: Interactive force-directed graph visualization of all context files (CLAUDE.md, MEMORY.md, todo.md, session.md, infinitecontext.md, ADM.md). Python indexer extracts 560+ entities (projects, servers, tech, standards, tickets, patterns, components, people) across 112 files, building 5000+ edges. **J4C deployment**: **`https://j4c.aurigraph.io/kgraph`**. React portal may also use route `/knowledge-graph`; canvas-based renderer, type filtering, pan/zoom/drag, node selection. Backend endpoint `GET /api/v11/knowledge-graph/data`. Plugin: `~/.claude/plugins/context-graph/`. Enables visual exploration of cross-project knowledge topology and entity relationships.
> **NEW (Apr 22, 2026)**: Component 0 Enhancement — **Discovery & Audit Phase + Ralph Loops + Domain Agents**: Cherry-picked from "SaaS Engineering Factory" methodology. Mandatory repo scan before coding, quality benchmarking (Stripe/Linear/Vercel-grade), Ralph verification loops (detect→fix→validate→re-check), and domain-specific agent teams (Frontend/Backend/DevOps Maker+Checker). Implementation guardrails: preserve business logic, avoid unnecessary rewrites, reduce duplication, strong typing.
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

### When to Use — #ADM Auto-Trigger (#MANDATORY #MEMORIZED — Apr 22, 2026 — USER MANDATED)

**Rule**: As soon as ANY new feature, change request, bug fix, or enhancement is requested, #ADM is the **default process that kicks in automatically** — no opt-in required, no manual activation.

**#AAT Workload Scaling**: The number of concurrent #AAT streams scales with the workload:

| Workload | #AAT Count | Pattern | Example |
|----------|-----------|---------|---------|
| Single file / hotfix | 1 #AAT | Maker+Checker+QA (serial) | 1-line bug fix, config change |
| Small feature (1-3 files) | 1 #AAT | Maker+Checker+QA+TechArch (concurrent) | New endpoint, new test class |
| Medium feature (4-10 files) | 2 #AAT | 2 parallel streams, each with full validation | New resource + service + entity + tests |
| Large feature (10+ files) | 4 #AAT | #4ParallelAAT pattern | Multi-module feature, regulatory framework |
| Epic / multi-sprint | 6 #AAT | 6 parallel streams, wave-based breakdown | CLARITY Act, DTCC, TrustX |

**Auto-trigger sequence**: User request → **WBS Decomposition** → #PreTaskVerificationGate → Component 0 (scope) → dispatch N #AAT streams (one per WBS item) → Component 1-10 pipeline.

**No manual activation needed**: The moment a task is identified as code-producing work, #ADM Components 0-10 engage.

### WBS-First Decomposition (#MANDATORY — Apr 22, 2026 — USER MANDATED)

**Rule**: BEFORE dispatching ANY #AAT, EVERY incoming task — whether feature, change request, bug, issue, or enhancement — MUST be decomposed into a Work Breakdown Structure (WBS). Each WBS item becomes an independent #AAT work unit.

**Why**: A single monolithic #AAT trying to solve a multi-faceted request produces fragile, untestable, hard-to-review work. WBS decomposition ensures each #AAT has a single clear objective, testable output, and reviewable scope.

**WBS Decomposition Process**:
```
1. RECEIVE  — new task/requirement/bug/change request
2. ANALYZE  — identify all affected layers (frontend, backend, DB, infra, docs)
3. DECOMPOSE — break into atomic WBS items (each independently testable)
4. SEQUENCE — identify dependencies (which WBS items block others)
5. DISPATCH — assign each WBS item to an #AAT stream
6. TRACK    — each WBS item → JIRA ticket → #AAT → Approver gate → merge
```

**WBS Item Criteria** (each item must satisfy ALL):
- **Single responsibility**: one module, one concern, one deliverable
- **Independently testable**: can write unit/integration tests for this item alone
- **Independently reviewable**: Checker can verify without seeing other items
- **Time-bounded**: completable within one #AAT cycle (< 2 hours)
- **Has acceptance criteria**: clear definition of done

**Example — "Fix fake news scoring" decomposes to**:
```
WBS-1: Domain credibility database (290 domains)         → #AAT-1 (Backend Maker)
WBS-2: Retrain IDDS classifier (8 features, 500 samples) → #AAT-2 (ML Maker)
WBS-3: Vague attribution detector (40 patterns)           → #AAT-3 (Backend Maker)
WBS-4: Batch test 88 Wikipedia domains                    → #AAT-4 (QA Maker)
WBS-5: Update registry API (content_url binding)           → #AAT-5 (Backend Maker)
WBS-6: Update frontend feature pages                       → #AAT-6 (Frontend Maker)
```
Each WBS item runs through full #AAT: Maker → Checker → QA → Approver. Items 1-4 can run in parallel (no dependencies). Items 5-6 depend on 1-3.

**WBS for different request types**:

| Request Type | WBS Pattern | Example |
|---|---|---|
| **Bug fix** | Reproduce → Root cause → Fix → Test → Verify | "Registration 500" → WBS: create audit_logs table, make audit non-fatal, test |
| **Feature** | Design → Backend → Frontend → Integration → Test → Deploy | "Token Topology" → WBS: shared component, detail modal, registry integration, ledger integration |
| **Change request** | Impact analysis → Modify → Regression test → Deploy | "Extend JWT to 24h" → WBS: update auth.py constants, update tokenRefresh.ts, test login flow |
| **Security issue** | Scan → Classify → Fix → Re-scan → Deploy | "OWASP audit" → WBS: bandit scan, fix MD5, fix XML, fix auth, fix deps, re-scan |
| **Integration** | API design → Client → Server → Test → Deploy | "Battua integration" → WBS: BattuaClient, wallet linking, reward distribution, earnings dashboard |

**Enforcement**: The Approver MUST verify that WBS decomposition was performed before approving. A single #AAT solving >3 unrelated concerns is automatically REJECTED — decompose and re-submit.

**Skip #ADM entirely ONLY for**:
- Pure research/investigation (no code changes)
- Single-file documentation updates (<100 LOC)
- One-line fixes (already verified by existing tests)

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

### Discovery & Audit Phase (#MANDATORY — Apr 22, 2026, Cherry-picked from SaaS Engineering Factory)

**Rule**: Before ANY feature/project implementation begins, run a Discovery & Audit phase. Do NOT jump to coding.

**Discovery (SPARC-S)**:
1. **Scan repository** — routes, layouts, services, models, configs, CI/CD
2. **Classify current state** — Frontend (components, pages, state), Backend (APIs, services, DB), DevOps (Docker, CI, monitoring)
3. **Generate** `SYSTEM_ARCHITECTURE_SUMMARY.md` — living document, updated each sprint

**Audit (SPARC-P)**:
1. **Frontend audit** — layout hierarchy, design consistency, component reuse, responsive, accessibility, UI states
2. **Backend audit** — service boundaries, API consistency, error handling, validation, query performance, security
3. **DevOps audit** — deployment reliability, config management, logging, observability, environment isolation
4. **Classify issues**: CRITICAL → HIGH → MEDIUM → LOW
5. **Generate** `SYSTEM_AUDIT_REPORT.md` with issue counts per severity

**Quality Benchmarking**: Target Stripe/Linear/Vercel/Notion-grade quality:
- Premium SaaS UX (no placeholder text, no broken states, no layout jank)
- Clean backend architecture (typed, validated, documented)
- Reliable APIs (consistent error format, rate limiting, pagination)
- Stable infrastructure (observability, auto-recovery, rollback)

**Implementation Rules** (guardrails during SPARC-A/Act phase):
- Preserve working business logic — avoid unnecessary rewrites
- Create reusable components — reduce duplication
- Maintain strong typing (TypeScript strict, Python type hints)
- Remove unused code safely — verify before deleting
- Ensure consistent patterns — one way to do each thing

### Ralph Verification Loops (#MANDATORY — Apr 22, 2026)

**Rule**: ALL critical/high issues discovered in Audit must be resolved through Ralph loops.

Each Ralph loop:
1. **Detect** — identify remaining issues (re-run audit checks)
2. **Implement** — fix the highest-severity issues first
3. **Validate** — run tests, smoke tests, OWASP scan
4. **Re-check** — re-run detection; if issues remain, loop again

**Exit criteria**: Zero CRITICAL + zero HIGH issues. MEDIUM issues documented for next sprint.

**Loop limit**: Max 5 Ralph loops per sprint. If still failing after 5, escalate to Architecture review.

### Domain-Specific Agent Teams (#MEMORIZED — Apr 22, 2026)

**Enhancement**: When working on full-stack features, the generic Maker/Checker can be specialized into domain agents:

| Agent | Domain | Specialization |
|---|---|---|
| **Frontend Discovery** | UI/UX | Scan routes, layouts, components, design system gaps |
| **Backend Discovery** | API/Services | Scan endpoints, models, validation, security |
| **DevOps Discovery** | Infrastructure | Scan Docker, CI/CD, monitoring, deployment |
| **Frontend Maker** | UI implementation | Components, pages, state, responsive, a11y |
| **Backend Maker** | API implementation | Routes, services, models, migrations |
| **DevOps Maker** | Infrastructure | Dockerfiles, CI workflows, monitoring |

These map to the standard #AAT roles: each domain Maker has a corresponding domain Checker. The Approver remains singular and cross-domain.

**When to use domain agents**: Projects with >3 concurrent changes across Frontend + Backend + DevOps. For single-layer changes, use standard Maker/Checker.

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

### #TestStackMandate (#MANDATORY #MEMORIZED — May 8, 2026 — USER MANDATED)

**Rule**: Every #ADM project's TDD suite MUST include **pytest** AND **Playwright** as first-class members, in addition to the language-native unit framework (Jest/Vitest for Node.js/TypeScript, JUnit for Java/Quarkus). Pytest and Playwright are NOT optional add-ons — they are required layers of the test pyramid.

| Layer | Framework | Mandatory When |
|-------|-----------|----------------|
| Unit (language-native) | Jest / Vitest / JUnit / pytest | Always — based on language |
| Unit (Python) | **pytest** + pytest-asyncio | Project contains any Python code |
| Functional / Integration | pytest (Python) · Jest+supertest (Node) · TestContainers (Java) | Always |
| Frontend E2E | **Playwright** (`playwright test`) | Project ships a user-facing frontend |
| TDD RED phase | All applicable layers above must have RED tests written by QA Tier 3 BEFORE Maker GREEN phase begins | Always |

**Skip rule** (the ONLY exemptions):
- Pytest skipped when project has **zero** Python source files
- Playwright skipped when project has **zero** user-facing UI

**Coverage targets** (already in this component) apply to pytest output identically to Jest/JUnit: 95% critical, 90% business logic, 85% API/integration. Playwright coverage is measured as **flow coverage** — every user-reachable route + every primary CTA must have at least one E2E test.

**CI enforcement** (#ADM Component 5): GitHub Actions self-hosted runners MUST execute `pytest tests/ -m "not e2e" --tb=short -q` on every PR for Python paths and `playwright test --reporter=line` on every PR for frontend paths. Both must PASS before any merge to `main`. CI failure on either is a hard gate — no override.

**Approver gate** (#AAT Component 2 Tier 6): Approver verdict APPROVED is **forbidden** if applicable pytest or Playwright suites are missing OR red. Missing-suite verdict = REJECTED with reason "TestStackMandate violation".

**Why memorize**: This rule closes the historical gap where a project shipped with strong Jest/JUnit unit coverage but zero pytest (Python paths) or zero Playwright (UI flows) — manual smoke tests passed in dev but regressions slipped past CI. Mandating both as canonical layers makes the top of the pyramid deterministic and gateable.

#### Reference implementation (MEV Shield, May 9, 2026)

The first project to ship a fully #TestStackMandate-compliant TDD suite. Use as the canonical example when standing up the mandate elsewhere.

| Layer | Framework | Tests | Wall-time | Source |
|-------|-----------|------:|----------:|--------|
| Backend unit | Jest (Node native) | **1,051** | 9.5s | `backend-enterprise/tests/` |
| **API contract** ⭐ | **pytest + httpx** | **24** | 1.5s | `tests/api/` |
| Frontend E2E | Playwright | **158** | 108s | `tests/e2e/` |
| **Combined** | | **1,233** | ~120s | 0 fail · 0 skip |

Repo: `Aurigraph-DLT-Corp/MEV-Shield` at commit `e0026cb9`.

#### Sub-rule: pytest as a value-add even when technically exempt

**Rule**: Even when a project's stack triggers the skip exemption ("zero Python source files"), strongly consider adding pytest as an **API-contract layer** that exercises the deployed HTTPS surface from outside the runtime. **Recommended, not mandatory**, when exempt.

**Why**: pytest at the contract layer catches things the language-native unit suite can't:
- Real TLS/proxy/CDN behavior (not mocked)
- JSON serialization edge cases at wire-level
- Header behaviors (CORS, CSP, security headers)
- Cross-language consumer perspective on the API contract — reveals contract drift the SPA might silently absorb
- De-risks language-native unit tests accidentally over-stubbing reality

**Contract**: pytest at the API-contract layer COMPLEMENTS Jest/JUnit (internals, mocked) and Playwright (UI flows). It does NOT replace either. ~70× faster per test than Playwright (HTTP-only, no browser) — right efficiency profile for fast contract-drift feedback.

**Layer slot**:
```
[ Unit (Jest/JUnit/Vitest, mocked) ] ← internals
[ API contract (pytest + httpx)     ] ← deployed surface, over-the-wire
[ Frontend E2E (Playwright)          ] ← UI flows, browser-driven
```

**MEV Shield example**: Project is Node-only (zero Python source) so pytest is exempt under the skip rule. Suite was added anyway as 24 contract tests (auth gates + envelope shapes + agentic-AI surface). Caught real contract drift on `/auth/login` response shape (`{ data: { access_token }}` not `{ token }`) that mock-based Jest tests had silently absorbed.

#### Sub-rule: worker-scoped admin session for production-target E2E

**Rule**: When Playwright E2E tests target a production environment with rate-limited auth (e.g. `AUTH_RATE_LIMIT_MAX=30/15min`), authentication MUST be performed at **worker scope**, not per-test scope. Production rate-limiters are a real-world property worth testing through, not a test-infrastructure bug.

**Why**: Per-test login attempts cascade — a 158-test suite × 1 login-per-test = 158 attempts in <2 minutes, far exceeding most rate-limit windows. Result: false-failure cascades, retry storms, hours debugging "test infrastructure" problems that are actually rate-limit math.

**Pattern** (Playwright `test.extend()` with `scope: 'worker'`):
```typescript
type WorkerFixtures = { workerSession: AdminSession | null };

export const test = base.extend<Fixtures, WorkerFixtures>({
  workerSession: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: PROD_URL });
      let sess: AdminSession | null = null;
      try { sess = await new AdminApi(ctx).session(); }
      catch { /* rate-limited; tests skip gracefully */ }
      await use(sess);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],
  adminPage: async ({ page, workerSession }, use) => {
    if (!workerSession) { test.skip(true, 'auth unavailable'); return; }
    await attachAdminSession(page, workerSession);
    await use(page);
  },
});
```

**Result**: 2 logins per E2E run (workers=2 in config) instead of 50+. Stays well under the rate-limit ceiling. Tests dependent on auth skip gracefully if the worker login fails (rather than cascade-failing the whole suite).

**MEV Shield example**: Before this pattern, full-suite runs against `https://mevshield.ai` exhausted the rate limiter and produced 7+ false failures per run. After: 158/158 GREEN consistently.

**Companion**: pytest's `admin_session` fixture must use `scope="session"` for the same reason. Per pytest run = 1 login.

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
- **#TestStackMandate (May 8, 2026 — USER MANDATED)**: QA's RED test plan MUST include **pytest** cases for any Python path AND **Playwright** cases for any user-visible UI flow, in addition to the language-native unit framework. Skipping either layer when applicable code exists = QA verdict FAIL with reason "TestStackMandate violation". Full spec: Component 1 → "#TestStackMandate".

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
- **#TestStackMandate gate (May 8, 2026 — MANDATORY)**: Approver verdict APPROVED is **forbidden** when applicable pytest or Playwright suites are missing OR red. Decision matrix: project has Python code AND no pytest tests → REJECTED. Project has UI AND no Playwright tests for new user-visible flows → REJECTED. Both suites green = gate passes for this dimension. Full spec: Component 1 → "#TestStackMandate".
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

**Rule**: ALL production deployments MUST follow the full CI/CD lifecycle via self-hosted runners.

### Full CI/CD Lifecycle (#MANDATORY #MEMORIZED — Apr 22, 2026 — USER MANDATED)

**Rule**: Deployment is the FINAL step in a mandatory pipeline. NO step may be skipped.

```
SCMAgent Code Review → git commit → git push → GitHub Actions (self-hosted runner) → Deploy to server → Smoke Tests → JIRA Update
```

**Pipeline Steps (sequential, non-skippable)**:

| Step | Gate | Tool | Blocks On |
|------|------|------|-----------|
| 1. **Code Review** | SCMAgent PASS | `pr-review-toolkit:code-reviewer` | Any FAIL = no commit |
| 2. **git commit** | Pre-commit hooks PASS | `git commit` (never `--no-verify`) | Hook failure = fix + retry |
| 3. **git push** | Push to remote branch | `git push origin <branch>` | Auth/network failure = retry |
| 4. **GitHub Actions Build** | Self-hosted runner picks up | `.github/workflows/deploy-*.yml` | Build failure = fix code, re-push |
| 5. **Deploy to Server** | Runner deploys via deploy.sh | `sudo /opt/platform/deploy.sh` | Health check failure = auto-rollback |
| 6. **Smoke Tests** | 15/15 PASS | Automated in workflow | Any fail = rollback + JIRA bug |
| 7. **JIRA Update** | Deployment recorded | @JIRAAgent or manual | Comment with commit SHA + timestamp |

**FORBIDDEN shortcuts**:
- `docker cp` + `docker restart` for production deploys (emergency-only, must be followed by proper CI/CD deploy)
- `scp` + manual server-side build (emergency-only pattern INS-DEPLOY-DOCKER-CP)
- Direct `docker compose up` on server without going through GitHub Actions
- Any deploy that skips code review or git push

**Self-Hosted Runner Requirement**: ALL GitHub Actions jobs (`build`, `deploy`, `test`, `smoke`) use `runs-on: self-hosted`. Cloud runners (`ubuntu-latest`) are FORBIDDEN. The runner on each server pulls code from GitHub, builds locally, and deploys — code flows GitHub → Server, never Local → Server.

**Emergency Exception**: When the self-hosted runner or GitHub Actions is down, the emergency deploy pattern (INS-DEPLOY-DOCKER-CP: local build → SCP → docker cp) is permitted with mandatory follow-up: create a JIRA ticket to re-deploy via proper CI/CD within 24 hours.

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
2. **Partial & Incremental Deployment (#MANDATORY — Apr 22, 2026)**: Deploy ONLY what changed. Full stack rebuild is the LAST resort, not the default.

   **Decision matrix**:
   | Change Type | Deploy Method | Example |
   |---|---|---|
   | Python source file only | `docker cp` + `docker restart` | Fix a route, update a service |
   | Frontend dist only | `scp dist/` + `docker cp` + `nginx -s reload` | UI change, component fix |
   | Config/env change | `docker compose up -d --force-recreate --no-deps <service>` | .env update, fusion.yaml |
   | New pip dependency | Full image rebuild (backend only) | Adding defusedxml, upgrading nltk |
   | DB migration only | `psql < migration.sql` (no container restart) | New table, index, column |
   | Multi-service schema change | Full `docker compose down --remove-orphans && up -d` | Breaking API change |

   **`docker cp` hot-patch pattern** (zero-downtime for Python changes):
   ```bash
   scp -P 2244 backend/app/api/routes/changed_file.py server:/tmp/
   ssh -p 2244 server "docker cp /tmp/changed_file.py container:/app/app/api/routes/ && docker restart container"
   ```
   **When NOT to use `docker cp`**: New dependencies (pip/npm), Dockerfile changes, base image updates.

   **`--no-deps` flag**: Restart ONLY the target service, not its dependencies:
   ```bash
   docker compose up -d --pull never --force-recreate --no-deps backend  # only backend, not db/redis
   ```

   **Rationale**: Full rebuilds on a 38GB server take 15-20 min, consume 4GB+ disk for build cache, and risk ENOSPC failures. Partial deploys take <30 seconds and use zero extra disk.
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
ssh $SERVER "curl -f -m 5 https://j4c.aurigraph.io/harbor/api/v2.0/systeminfo" || { echo "FAIL: Harbor registry unreachable"; exit 1; }
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

# Query Harbor registry for latest versions (https://j4c.aurigraph.io/harbor)
HARBOR_LATEST=$(curl -s -u $HARBOR_USER:$HARBOR_PASSWORD \
    "https://j4c.aurigraph.io/harbor/api/v2.0/projects/$PROJECT/repositories/$IMAGE/artifacts?page_size=1" \
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

### Aurigraph Deployment Agent — Auto-Deploy After Build (#MANDATORY — Apr 22, 2026 — USER MANDATED)

**Rule**: After EVERY successful build (git commit + push), the Deployment Agent MUST automatically deploy incremental changes to the remote server, then follow the full ADM post-deploy pipeline.

**Complete Deployment Agent Flow**:
```
Build Complete (git push)
  ↓
Step 1: Classify change scope
  ↓
Step 2: Incremental deploy (partial — NOT full rebuild)
  ↓
Step 3: Post-deploy test cascade (Levels 0-4)
  ↓
Step 4: JIRA update + bug logging
  ↓
Step 5: Session tracking (session.md, todo.md)
  ↓
Step 6: AutoHeal verification (3-layer check)
```

**Step 1 — Classify Change Scope** (determines deploy method):
```
git diff --name-only HEAD~1 HEAD → classify files into:

  BACKEND_SOURCE  (.py in app/)        → docker cp + restart
  FRONTEND_DIST   (.tsx/.ts in src/)   → pnpm build + scp dist/ + nginx reload
  CONFIG          (.env, .yaml, .yml)  → docker compose up --force-recreate --no-deps
  MIGRATION       (.sql in migrations/)→ psql < migration.sql (no restart)
  DEPENDENCY      (requirements*.txt)  → full image rebuild (backend only)
  DOCKERFILE      (Dockerfile*)        → full image rebuild
  INFRA           (docker-compose.yml) → docker compose down --remove-orphans + up -d
  DOCS_ONLY       (.md, docs/)         → NO deploy needed
```

**Step 2 — Incremental Deploy** (per Rule 2 — Partial & Incremental):
```bash
# Auto-generated deploy script based on change classification
CHANGED=$(git diff --name-only HEAD~1 HEAD)

# Backend source only → hot-patch
if echo "$CHANGED" | grep -q 'backend/app/.*\.py' && ! echo "$CHANGED" | grep -q 'requirements'; then
    for f in $(echo "$CHANGED" | grep 'backend/app/.*\.py'); do
        scp -P $SSH_PORT "$f" $SERVER:/tmp/
        CONTAINER_PATH=$(echo "$f" | sed 's|backend/|/app/|')
        ssh -p $SSH_PORT $SERVER "docker cp /tmp/$(basename $f) $BACKEND_CONTAINER:$CONTAINER_PATH"
    done
    ssh -p $SSH_PORT $SERVER "docker restart $BACKEND_CONTAINER"

# Frontend only → build + deploy dist
elif echo "$CHANGED" | grep -q 'frontend/src/.*\.tsx\|frontend/src/.*\.ts' && ! echo "$CHANGED" | grep -q 'package.json'; then
    cd frontend && pnpm build
    scp -P $SSH_PORT -r dist/ $SERVER:/tmp/provenews-dist/
    ssh -p $SSH_PORT $SERVER "docker cp /tmp/provenews-dist/. $FRONTEND_CONTAINER:/app/dist/ && \
        docker exec $NGINX_CONTAINER nginx -s reload"

# Migration only → apply SQL
elif echo "$CHANGED" | grep -q 'migrations/.*\.sql'; then
    for sql in $(echo "$CHANGED" | grep 'migrations/.*\.sql'); do
        scp -P $SSH_PORT "$sql" $SERVER:/tmp/
        ssh -p $SSH_PORT $SERVER "docker exec -i $DB_CONTAINER psql -U $DB_USER < /tmp/$(basename $sql)"
    done

# Dependency change → full image rebuild
elif echo "$CHANGED" | grep -q 'requirements.*\.txt\|Dockerfile'; then
    # Trigger GHA self-hosted runner deploy OR manual build
    gh workflow run "Deploy" --ref main || echo "GHA unavailable — manual deploy required"

# Docs only → skip deploy
elif echo "$CHANGED" | grep -qv '\.py\|\.tsx\|\.ts\|\.sql\|\.yml\|\.yaml\|\.txt\|Dockerfile'; then
    echo "Docs-only change — no deploy needed"
fi
```

**Steps 3-6**: Continue with the existing ADM post-deploy pipeline (Test Cascade → JIRA → Session → AutoHeal) as defined below.

**Enforcement**: The Deployment Agent runs automatically via GHA self-hosted runner on `push` to `main`. For manual deploys (when GHA is unavailable), the developer MUST run the same sequence. Skipping the post-deploy pipeline is FORBIDDEN — a deploy without test cascade is an incomplete deploy.

### Aurigraph Deployment Agent — Post-Deploy Test Cascade (#MANDATORY — Apr 22, 2026)

**Rule**: After EVERY deployment, the Deployment Agent MUST run a 4-level test cascade. Infrastructure health (above) is Level 0. This section defines Levels 1-4.

**Test Cascade Flow**:
```
Level 0: Infrastructure Health (15 smoke tests)
  ↓ PASS
Level 1: Unit + Integration tests on CHANGED features/components
  ↓ PASS → done
  ↓ FAIL ↓
Level 2: Smoke tests on UNCHANGED platform (detect collateral damage)
  ↓ PASS → fix Level 1 failures only
  ↓ FAIL ↓
Level 3: Regression tests on ALL changes in this deploy
  ↓ PASS → fix Level 1+2 failures
  ↓ FAIL ↓
Level 4: Full E2E test suite (nuclear option)
  ↓ results → JIRA bug tickets → next sprint plan
```

**Level 1 — Changed Feature Tests (runs always)**:
```bash
# Identify changed files from deploy commit
CHANGED=$(git diff --name-only HEAD~1 HEAD)

# Run unit tests for changed backend modules
CHANGED_PY=$(echo "$CHANGED" | grep 'backend/.*\.py' | sed 's|backend/||')
for module in $CHANGED_PY; do
    TEST_FILE="tests/$(echo $module | sed 's|app/|test_|; s|/|_|g')"
    [ -f "backend/$TEST_FILE" ] && pytest "backend/$TEST_FILE" -v --tb=short
done

# Run frontend tests for changed components
CHANGED_TSX=$(echo "$CHANGED" | grep 'frontend/.*\.tsx')
if [ -n "$CHANGED_TSX" ]; then
    cd frontend && pnpm test --run --reporter=verbose 2>&1 | tail -20
fi
```

**Level 2 — Platform Smoke Tests (runs if Level 1 fails)**:
```bash
# Test UNCHANGED critical paths to detect collateral damage
DOMAIN=$DEPLOY_DOMAIN

# Auth flow
curl -s -X POST https://$DOMAIN/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.com","password":"SmokeTest1"}' | grep -q 'access_token' && echo "✓ Auth" || echo "✗ Auth BROKEN"

# Registry (public)
curl -s "https://$DOMAIN/api/v1/facttrace/registry?page=1&page_size=1" | grep -q '"total"' && echo "✓ Registry" || echo "✗ Registry BROKEN"

# Newsfeed
curl -s "https://$DOMAIN/api/v1/newsfeed?page_size=1" | grep -q 'articles\|total' && echo "✓ Newsfeed" || echo "✗ Newsfeed BROKEN"

# CLARITY compliance
curl -s "https://$DOMAIN/api/v1/compliance/clarity" | grep -q 'overall_status' && echo "✓ CLARITY" || echo "✗ CLARITY BROKEN"

# IDDS pipeline (submit + verify score)
REPORT_ID=$(curl -s -X POST "https://$DOMAIN/api/v1/facttrace/create-order" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"tier":"IDDS","content_text":"Smoke test: RBI held repo rate at 6.5 percent."}' | python3 -c 'import sys,json; print(json.load(sys.stdin).get("report_id","FAIL"))')
[ "$REPORT_ID" != "FAIL" ] && echo "✓ IDDS pipeline" || echo "✗ IDDS pipeline BROKEN"
```

**Level 3 — Regression Tests (runs if Level 2 fails)**:
```bash
# Full backend test suite on changed modules + their dependents
pytest backend/ -x --tb=short -q --ignore=backend/tests/test_sprint*.py 2>&1 | tail -10

# Frontend component tests
cd frontend && pnpm test --run 2>&1 | tail -10
```

**Level 4 — Full E2E Suite (runs if Level 3 fails)**:
```bash
# Nuclear option: run entire Playwright E2E suite against production
cd frontend && npx playwright test --reporter=list 2>&1

# Collect all results
PLAYWRIGHT_EXIT=$?
```

**JIRA Bug Logging (#MANDATORY after any test failure)**:

After the test cascade completes, the Deployment Agent MUST:

1. **Log all failures to JIRA** — one ticket per unique failure:
   ```
   Summary: [Deploy Bug] <test_name> — <error_message>
   Type: Bug
   Priority: HIGH (Level 1-2 failures) or CRITICAL (Level 3-4 failures)
   Labels: deploy-regression, sprint-<N>
   Description: Commit, test output, stack trace, affected endpoint
   ```

2. **Plan next sprint** — if >3 bugs found:
   ```
   Create Epic: "Deploy Regression Fix Sprint — <date>"
   Link all bug tickets to epic
   Set sprint goal: zero regression bugs
   Assign to: Maker agents (domain-specific per Component 0)
   ```

3. **Update session tracking**:
   - `session.md` — deploy outcome + test results + bug count
   - `todo.md` — add regression fix tasks
   - JIRA — comment on deploy ticket with test cascade summary

**Test Cascade Decision Log** (generated per deploy):
```json
{
  "deploy_commit": "<sha>",
  "timestamp": "<ISO>",
  "level_0_infrastructure": "PASS (15/15 smoke)",
  "level_1_changed_features": "PASS|FAIL (X/Y tests)",
  "level_2_platform_smoke": "PASS|FAIL|SKIPPED",
  "level_3_regression": "PASS|FAIL|SKIPPED",
  "level_4_full_e2e": "PASS|FAIL|SKIPPED",
  "bugs_filed": 0,
  "jira_tickets": [],
  "next_action": "NONE|FIX_SPRINT|ROLLBACK"
}
```

**Escalation Rules**:
- Level 1 fail + Level 2 pass → fix changed features only (normal bug fix)
- Level 2 fail → collateral damage detected → regression sprint
- Level 3 fail → systemic issue → architecture review + regression sprint
- Level 4 fail → consider rollback + emergency sprint

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
- **Endpoint**: `https://j4c.aurigraph.io/harbor/api/v2.0/`
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

### Claude Token Efficiency & Context Management (#MANDATORY — Apr 22, 2026)

**Rule**: ALL Aurigraph developers using Claude Code / Claude Chat MUST follow these practices to maximize output quality while minimizing token waste. These are operational best practices — not optional tips.

**Source**: Adapted from Ruben Hassid (how-to-ai.guide), validated against Aurigraph production usage patterns.

#### Before You Type

| Practice | Rule | Rationale |
|---|---|---|
| **Convert files before uploading** | Extract PDF/DOCX to `.md` text BEFORE uploading. One PDF page = 1,500-3,000 tokens wasted on raw binary. | `.md` text extract saves 60-80% of tokens vs raw file upload |
| **Pick the right model** | Haiku for drafts/scaffolding. Sonnet for implementation. Opus for architecture/complex reasoning. | Don't burn Opus tokens on boilerplate — Haiku is 60x cheaper |
| **Turn off features you don't need** | Web search, connectors, Extended Thinking add tokens to EVERY response. Default OFF, enable per task. | Each feature adds 500-2,000 tokens per response even when unused |
| **Plan in Chat, Build in Code** | Use Chat (cheap) for architecture, design, trade-off analysis. Use Claude Code (expensive) for implementation only. | Planning in Code wastes implementation-tier tokens on thinking |

#### During the Chat

| Practice | Rule | Rationale |
|---|---|---|
| **Batch tasks into one message** | 3 separate prompts = 3 full context reloads. 1 prompt with 3 tasks = 1 reload. | Each new message re-reads the ENTIRE conversation history |
| **Edit, don't reply** | If Claude's response is wrong, click Edit on YOUR message and regenerate. It replaces the old exchange. | Stacking follow-ups grows context geometrically; editing keeps it flat |
| **Target sections, not full redos** | Say "only redo section 3" not "redo the whole thing". Add: "No commentary. Just the output." | Targeted regeneration uses 10-20% of the tokens vs full redo |
| **Use "Ask Me Questions"** | A 15-word prompt with selectable options costs almost nothing. A 500-word instruction gets re-read every time. | Short prompts with Claude-generated options = cheapest interaction pattern |

#### After the Chat

| Practice | Rule | Rationale |
|---|---|---|
| **Compact every 15-20 messages** | 20 messages ≈ 105K tokens. 30 messages ≈ 232K tokens. Run `/compact` or summarize → new chat → paste. | Token cost grows linearly with conversation length — compact resets it |
| **New topic = new chat** | Old messages are dead weight. Claude re-reads your first message while working on the final task. | Starting fresh eliminates context pollution from unrelated early messages |
| **Use Projects for recurring files** | Upload `CLAUDE.md`, `ADM.md`, `infinitecontext.md` once to a Project. Every new chat references them without re-reading. | Project files are cached — not re-tokenized per conversation |
| **Set up Preferences & Styles** | Personal Preferences + Custom Style eliminates 3-5 setup messages per chat. One setup, permanent savings. | Configuration messages are the most wasteful — they repeat every session |

**#ADM-Specific Token Efficiency**:
- **#AAT subagents** already use isolated context windows (Agent tool) — each Maker/Checker/QA has its own context, no cross-pollution
- **`run_in_background: true`** runs agents in parallel without growing the parent context
- **`/compact` before deploy**: Always compact context before running `/deploy` — the deploy sequence is long and benefits from a clean context
- **Session files** (`session.md`, `todo.md`, `infinitecontext.md`): These ARE the "Project files" — they persist across sessions without re-reading

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

### Battua Session 3 Operational Learnings (Apr 22, 2026)

**1. OWASP Remediation Workflow** (Component 6):
```
Scan → Triage (real vs false positive) → Upgrade BOM → Suppress FP with <notes> → Re-scan → Verify BUILD SUCCESS
```
- Quarkus BOM is the primary security lever — one version bump fixed 12/19 CVEs
- OWASP DC v10.x crashes on NVD CVSSv4 `SAFETY` enum — use v12.1.0+
- `./mvnw org.owasp:dependency-check-maven:12.2.1:check` runs without Quarkus build phase (avoids gRPC codegen issues)

**2. Hibernate Column Naming Gotcha** (Component 1):
- Quarkus default: `addressCount` → `addresscount` (lowercase, NO underscores)
- PostgreSQL migration creates: `address_count` (snake_case)
- Fix: Explicit `@Column(name = "address_count")` on EVERY field, or configure `PhysicalNamingStrategy`
- Pattern: match existing entities in the project — if they use `@Column(name=...)`, do the same

**3. JIRA Bulk Backfill via REST API** (Component 3):
- Background agent creates 20+ tickets in one dispatch using `curl -u email:token` + Atlassian REST API v3
- Transition to Done via `/rest/api/3/issue/{key}/transitions`
- Add commit comments via `/rest/api/3/issue/{key}/comment`
- Pattern: query latest ticket → create in batch → transition → comment → report

**4. Notabene SPI Provider Pattern** (Component 2):
- `TravelRuleProvider` interface → `NotabeneTravelRuleProvider` implementation
- Stub mode: empty config properties → `isConfigured()` returns false → stub response
- OAuth2 token cached for `expires_in - 3600` seconds (refresh 1hr before expiry)
- CAIP-19 asset identifiers required (not raw symbols) — use `Caip19AssetMapper.toCaip19()`
- Webhook receiver MUST always return 200 (even on errors) to prevent retry storms

**5. gRPC Codegen Race Condition** (Component 1):
- Symptom: `cannot access io.aurigraph.battua.grpc.ValidatorInfo — class file truncated at offset 0`
- Cause: Parallel agents editing files while Maven compiles → stale `.class` files in `target/`
- Fix: `find target -name "*.class" -delete` then rebuild, OR `mvn clean compile` (retry once)

**6. Fire-and-Forget Admin Analytics** (Component 2):
- Public pages (e.g., /scan-btc) POST scan results to admin endpoint (best-effort, `.catch(() => {})`)
- Admin endpoint persists to DB for aggregate reporting (`/admin/scan-reports/summary`)
- Privacy: truncate addresses to `first8...last4` before persistence
- Pattern: no auth on POST (public), X-Admin-Token on GET (admin reads)

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


---
---

# Appendix A: Numbered ADM Registry (ADM-056 through ADM-080)

> **Source**: `~/.claude/ADM.md` (personal numbered-ADM registry) — synced 2026-04-27.
> These entries are the *numbered operational ADMs* from the personal registry.
> They complement the framework spec above — the framework spec describes
> *components* (Component 0..10), whereas these are individually numbered
> *rules/decisions* (ADM-001..066). Both coexist; they document different slices.

## ADM-056: OWASP Testing Integration

### 🛡️ **Mandatory OWASP Security Testing After Every Build**
*Automated security validation to prevent vulnerabilities reaching production*

#### **Integration Points (MANDATORY)**

**🔨 Build Pipeline Integration**
- [ ] **Post-Build Trigger**: OWASP tests run automatically after successful build completion
- [ ] **Pre-Deploy Gate**: Deployment blocked until OWASP tests pass
- [ ] **CI/CD Integration**: GitHub Actions workflow includes OWASP validation stage
- [ ] **Failure Handling**: Build marked as failed if critical vulnerabilities detected

**🎯 Test Coverage Requirements**
```bash
# OWASP Top 10 Test Categories (ALL MANDATORY)
1. Injection Attacks (SQL, NoSQL, Command, LDAP, XPath)
2. Broken Authentication (password policy, session management, MFA)
3. Sensitive Data Exposure (credentials, PII, tokens in responses)
4. XML External Entities (XXE prevention)
5. Broken Access Control (RBAC, authorization bypass)
6. Security Misconfiguration (headers, HTTPS, server info)
7. Cross-Site Scripting (XSS - reflected, stored, DOM-based)
8. Insecure Deserialization (object injection, pickle attacks)
9. Known Vulnerable Components (dependency scanning)
10. Insufficient Logging & Monitoring (security event tracking)
```

#### **Test Suite Implementation**

**📁 Test Files Structure**
```
tests/security/
├── owasp-injection-tests.js           # SQL, NoSQL, Command injection
├── owasp-authentication-tests.js      # Auth bypass, session security
├── owasp-data-exposure-tests.js       # Sensitive data leakage
├── owasp-xxe-tests.js                 # XML external entity attacks
├── owasp-access-control-tests.js      # Authorization, RBAC bypass
├── owasp-security-config-tests.js     # Headers, SSL, misconfigs
├── owasp-xss-tests.js                 # Cross-site scripting
├── owasp-deserialization-tests.js     # Object injection attacks
├── owasp-component-security-tests.js  # Dependency vulnerabilities
└── owasp-logging-tests.js             # Security monitoring
```

**⚡ Test Execution Framework**
```bash
# Automated OWASP test execution
npm run test:owasp:all                 # Run all OWASP tests
npm run test:owasp:critical            # Run only critical severity tests
npm run test:owasp:injection           # Run injection-specific tests
npm run test:owasp:auth                # Run authentication tests
```

#### **Pass/Fail Criteria (NON-NEGOTIABLE)**

**🚫 Build Failure Conditions**
- **Critical Severity**: ANY critical vulnerability = immediate build failure
- **SQL Injection**: ANY successful injection = immediate build failure  
- **Authentication Bypass**: ANY auth bypass = immediate build failure
- **XSS**: ANY successful XSS execution = immediate build failure
- **CSRF**: ANY successful CSRF attack = immediate build failure

**✅ Pass Requirements**
- **Injection Prevention**: 100% of injection attempts blocked
- **Authentication Security**: All auth endpoints secure (no bypass)
- **Data Protection**: No sensitive data in responses
- **Security Headers**: All required headers present (HSTS, CSP, etc.)
- **Access Control**: RBAC enforced across all protected endpoints

#### **Reporting & Documentation**

**📊 Test Results Format**
```json
{
  "owasp_test_results": {
    "timestamp": "2026-04-22T19:40:00Z",
    "build_id": "main-900bcfa6e",
    "overall_status": "PASS/FAIL",
    "categories": {
      "injection": {"status": "PASS", "tests": 15, "passed": 15, "failed": 0},
      "authentication": {"status": "FAIL", "tests": 12, "passed": 10, "failed": 2},
      "data_exposure": {"status": "PASS", "tests": 8, "passed": 8, "failed": 0}
    },
    "critical_issues": [],
    "recommendations": []
  }
}
```

**🔔 Notification Requirements**
- **Slack Integration**: Post OWASP test results to #security channel
- **JIRA Integration**: Auto-create security tickets for failures
- **Email Alerts**: Notify security team of critical failures
- **Dashboard**: Real-time OWASP compliance dashboard

#### **CI/CD Pipeline Integration**

**GitHub Actions Workflow**
```yaml
name: OWASP Security Testing
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  owasp-security-tests:
    runs-on: self-hosted
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Build application
        run: pnpm run build
        
      - name: Run OWASP Security Tests
        run: |
          npm run test:owasp:all
          npm run test:security:headers
          npm run test:security:ssl
          
      - name: Generate Security Report
        run: npm run security:report
        
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        with:
          name: owasp-test-results
          path: tests/security/reports/
          
      - name: Fail on Critical Issues
        run: |
          if [ -f "security-critical-issues.json" ]; then
            echo "Critical security issues found - failing build"
            exit 1
          fi
```

#### **Compliance Scoring**

**🎯 Security Score Requirements**
- **Minimum Pass Score**: 85% across all OWASP categories
- **Critical Issues**: 0 critical vulnerabilities allowed
- **High Issues**: Max 2 high-severity issues per build
- **Authentication**: 100% pass rate required
- **Injection Prevention**: 100% pass rate required

#### **Emergency Bypass Procedures**

**🚨 Critical Production Hotfixes Only**
- **Security Lead Approval**: Required for any OWASP test bypass
- **Temporary Bypass**: Max 24 hours before full compliance required
- **Documentation**: Detailed justification and remediation plan
- **Monitoring**: Enhanced security monitoring during bypass period

#### **Integration Examples**

**Build Script Integration**
```bash
#!/bin/bash
# Post-build OWASP validation

echo "🛡️  Running mandatory OWASP security tests..."

# Run OWASP test suite
npm run test:owasp:all || {
  echo "❌ OWASP tests failed - blocking deployment"
  exit 1
}

echo "✅ OWASP tests passed - proceeding with deployment"
```

**Deployment Gate Integration**
```bash
# In deployment script
if [ ! -f "owasp-test-results-pass.json" ]; then
  echo "❌ OWASP tests not passed - deployment blocked"
  exit 1
fi
```

#### **Success Metrics**

**📈 KPIs to Track**
- **Build Security Score**: Target 95%+ OWASP compliance
- **Vulnerability Detection**: <2 hours from code commit to security validation
- **Critical Issue Response**: <4 hours from detection to resolution
- **False Positive Rate**: <5% (to maintain developer productivity)

**Last Updated**: 2026-04-22 (OWASP integration framework established)

---

## ADM-057: NGINX/HTTPS Post-Deployment Testing

### 🔒 **Automated HTTPS & Proxy Validation After Every Deployment**
*Comprehensive infrastructure testing to ensure SSL, routing, and security compliance*

#### **Mandatory Test Categories (ALL REQUIRED)**

**🔐 SSL/TLS Certificate Validation**
- [ ] **Certificate Validity**: Expiration dates, CA trust chain verification
- [ ] **Certificate Coverage**: All required domains/subdomains included
- [ ] **Protocol Compliance**: TLS 1.2+ only, deprecated protocols blocked
- [ ] **Cipher Suite Security**: Strong ciphers only (ECDHE, AES256-GCM)
- [ ] **Certificate Transparency**: CT log compliance verification

**🌐 HTTPS Configuration Testing**
```bash
# SSL Labs A+ Grade Requirements
- Perfect Forward Secrecy: REQUIRED
- HSTS Header: max-age=31536000; includeSubDomains
- Protocol Support: TLS 1.2 and 1.3 only
- Cipher Strength: 256-bit minimum
- Certificate Chain: Complete and valid
```

**🔄 nginx Proxy Routing Validation**
- [ ] **API Routing**: `/api/v1/*` endpoints proxy correctly to backend
- [ ] **Static File Serving**: Frontend assets served with proper headers
- [ ] **Fallback Routing**: SPA routing (404 → index.html) working
- [ ] **Request Headers**: Proper proxy headers (X-Real-IP, X-Forwarded-For)
- [ ] **Response Format**: JSON from API endpoints, HTML from frontend

#### **Test Execution Framework**

**📁 Test Suite Structure**
```
tests/infrastructure/
├── nginx-ssl-tests.js              # SSL certificate and protocol testing
├── nginx-headers-tests.js          # Security headers validation
├── nginx-routing-tests.js          # Proxy routing and fallback testing
├── nginx-performance-tests.js      # HTTPS performance benchmarks
├── nginx-security-tests.js         # nginx security configuration
└── nginx-availability-tests.js     # Uptime and health monitoring
```

**⚡ Automated Test Commands**
```bash
# Post-deployment HTTPS validation suite
npm run test:nginx:ssl             # SSL certificate and protocol tests
npm run test:nginx:headers         # Security headers validation
npm run test:nginx:routing         # Proxy routing verification
npm run test:nginx:performance     # HTTPS performance benchmarks
npm run test:nginx:all             # Complete nginx test suite
```

#### **Critical Test Scenarios**

**🔒 SSL/Certificate Tests**
```javascript
// Example test structure
describe('SSL Certificate Validation', () => {
  test('Certificate expires in >30 days', async () => {
    const cert = await getCertificateInfo('https://aurex.in');
    expect(cert.daysUntilExpiry).toBeGreaterThan(30);
  });
  
  test('All domains covered by certificate', async () => {
    const domains = ['aurex.in', 'www.aurex.in', 'api.aurex.in'];
    for (const domain of domains) {
      const result = await validateSSL(domain);
      expect(result.valid).toBe(true);
    }
  });
  
  test('SSL Labs grade A+ achieved', async () => {
    const grade = await getSSLLabsGrade('aurex.in');
    expect(grade).toBe('A+');
  });
});
```

**🛡️ Security Headers Tests**
```javascript
describe('HTTPS Security Headers', () => {
  test('HSTS header properly configured', async () => {
    const response = await fetch('https://aurex.in');
    const hsts = response.headers.get('strict-transport-security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });
  
  test('Content Security Policy header present', async () => {
    const response = await fetch('https://aurex.in');
    const csp = response.headers.get('content-security-policy');
    expect(csp).toContain("default-src 'self'");
  });
});
```

**🔄 Routing & Proxy Tests**
```javascript
describe('nginx Proxy Routing', () => {
  test('API endpoints return JSON not HTML', async () => {
    const response = await fetch('https://api.aurex.in/api/v1/health');
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
  
  test('SPA routing fallback works', async () => {
    const response = await fetch('https://aurex.in/non-existent-route');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Aurex'); // Should serve index.html
  });
});
```

#### **Performance Benchmarks**

**⚡ HTTPS Performance Requirements**
- **SSL Handshake Time**: <500ms (95th percentile)
- **First Byte Time**: <100ms for API endpoints  
- **Static Asset Loading**: <200ms for frontend resources
- **Concurrent Connections**: Support 1000+ simultaneous users
- **HTTP/2 Support**: Multiplexing enabled and functional

**📊 Performance Test Implementation**
```bash
# Performance validation commands
curl -w "%{time_connect} %{time_appconnect} %{time_total}\n" https://aurex.in
curl -w "SSL: %{time_appconnect}s Total: %{time_total}s\n" https://api.aurex.in/api/v1/health

# Expected results:
# SSL handshake: <0.5s
# API response: <0.1s total time
# Static assets: <0.2s
```

#### **Deployment Integration**

**🚀 Post-Deployment Hook**
```bash
#!/bin/bash
# Automatic HTTPS testing after deployment

echo "🔒 Running post-deployment HTTPS validation..."

# Wait for services to be ready
sleep 10

# Run nginx/HTTPS test suite
npm run test:nginx:all || {
  echo "❌ HTTPS validation failed - rolling back deployment"
  ./scripts/rollback-deployment.sh
  exit 1
}

echo "✅ HTTPS validation passed - deployment confirmed"

# Optional: Update monitoring dashboard
curl -X POST "https://monitoring.aurex.in/api/deployment-success" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"'$(date -Iseconds)'","tests_passed":true}'
```

**🔔 CI/CD Pipeline Integration**
```yaml
name: Post-Deployment HTTPS Validation
on:
  deployment_status

jobs:
  nginx-https-tests:
    if: github.event.deployment_status.state == 'success'
    runs-on: self-hosted
    steps:
      - name: Wait for deployment readiness
        run: sleep 30
        
      - name: Validate SSL certificates
        run: |
          npm run test:nginx:ssl
          npm run test:nginx:headers
          
      - name: Test proxy routing
        run: npm run test:nginx:routing
        
      - name: Performance benchmarks  
        run: npm run test:nginx:performance
        
      - name: Report results
        run: |
          if [ $? -eq 0 ]; then
            echo "✅ HTTPS validation passed"
          else
            echo "❌ HTTPS validation failed - consider rollback"
            exit 1
          fi
```

#### **Failure Response Procedures**

**🚨 Critical Failure Scenarios**
- **SSL Certificate Expired**: Immediate auto-renewal trigger + alert
- **Security Headers Missing**: Deployment rollback + nginx config fix
- **Proxy Routing Broken**: API unavailable - immediate rollback required
- **Performance Degradation**: >2x slower than baseline - investigate + optimize

**📞 Escalation Matrix**
- **SSL Issues**: Infrastructure team + Security lead
- **Routing Problems**: Backend team + DevOps lead  
- **Performance Issues**: Performance team + Architecture lead
- **Security Headers**: Security team + Frontend lead

#### **Monitoring & Alerting**

**📈 Continuous Monitoring**
```bash
# Scheduled monitoring checks (every 5 minutes)
*/5 * * * * /scripts/check-https-health.sh

# Certificate expiration monitoring (daily)
0 9 * * * /scripts/check-certificate-expiry.sh

# Performance monitoring (hourly)
0 * * * * /scripts/benchmark-https-performance.sh
```

**🔔 Alert Conditions**
- **Certificate expires in <30 days**: Warning alert
- **Certificate expires in <7 days**: Critical alert  
- **SSL Labs grade drops below A**: Warning alert
- **API response time >500ms**: Performance alert
- **Security headers missing**: Security alert

#### **Compliance Requirements**

**✅ Pass Criteria (ALL MUST PASS)**
- **SSL Grade**: A+ on SSL Labs or equivalent
- **Certificate Validity**: >30 days remaining
- **Security Headers**: All required headers present and correct
- **Proxy Routing**: 100% API endpoints returning JSON
- **Performance**: All benchmarks within acceptable ranges
- **HTTP Redirect**: All HTTP traffic redirects to HTTPS

**❌ Failure Conditions**
- **Any SSL certificate invalid or expired**
- **Missing critical security headers (HSTS, CSP)**
- **API endpoints returning HTML instead of JSON**
- **SSL handshake time >1 second**
- **Any HTTP endpoint serving content (should redirect)**

#### **Reporting Dashboard**

**📊 Real-time HTTPS Health Dashboard**
```
NGINX/HTTPS Status Dashboard
============================
🔒 SSL Certificate: ✅ Valid (expires 2026-07-20)
🛡️ Security Headers: ✅ All present (HSTS, CSP, X-Frame-Options)
🔄 API Routing: ✅ All endpoints returning JSON
⚡ Performance: ✅ <100ms API, <500ms SSL handshake
🌐 Domains: ✅ aurex.in, api.aurex.in, www.aurex.in

Last Test: 2026-04-22 19:45:00 UTC
Status: ALL SYSTEMS OPERATIONAL
```

#### **Success Metrics**

**🎯 KPIs to Track**
- **HTTPS Uptime**: 99.9% target
- **SSL Certificate Renewals**: 100% automated success rate
- **Security Header Compliance**: 100% across all endpoints  
- **API Routing Accuracy**: 100% JSON responses from API endpoints
- **Performance SLA**: <100ms API response time (95th percentile)

#### **Documentation Requirements**

**📚 Required Documentation**
- **nginx Configuration**: Complete config with comments
- **SSL Certificate Management**: Renewal procedures and automation
- **Security Headers Explanation**: Why each header is required
- **Proxy Routing Logic**: How requests are routed to backend services
- **Performance Baselines**: Expected response times and thresholds

**Last Updated**: 2026-04-22 (NGINX/HTTPS testing framework established)

---

## ADM-055: Pre/Post Deployment Gating Checklist

### 🛡️ **Deployment Quality Gates Framework**
*Mandatory validation to prevent service outages and system failures*

#### **🔍 PRE-DEPLOYMENT GATES (MANDATORY)**

### **Gate 1: Infrastructure Readiness**

**🗄️ Database Validation**
- [ ] **Database Connection Test**
  ```bash
  docker exec <db_container> pg_isready -U <username> -d <database>
  ```
- [ ] **Database User Exists**
  ```bash
  docker exec <db_container> psql -U postgres -c "\du" | grep <app_user>
  ```
- [ ] **Database Schema Exists**
  ```bash
  docker exec <db_container> psql -U <user> -d <database> -c "\dt"
  ```
- [ ] **Required Tables Present**
  ```bash
  # Verify core tables exist: users, user_sessions, roles, audit_logs
  docker exec <db_container> psql -U <user> -d <database> -c "\d users"
  ```
- [ ] **Table Columns Match Model**
  ```bash
  # Verify columns match SQLAlchemy model expectations
  docker exec <db_container> psql -U <user> -d <database> -c "\d+ users"
  ```

**🔐 Authentication System Validation**
- [ ] **Password Hashing Service Available**
- [ ] **JWT Secret Keys Configured**
  ```bash
  docker exec <api_container> printenv | grep JWT_SECRET
  ```
- [ ] **Session Storage Ready**
- [ ] **Role/Permission Tables Populated**

**🌐 Network & DNS Validation**
- [ ] **SSL Certificates Valid** (>30 days remaining)
  ```bash
  openssl x509 -in <cert_file> -noout -dates
  ```
- [ ] **DNS Resolution Working**
  ```bash
  nslookup <domain>
  dig <api_domain>
  ```
- [ ] **Port Availability**
  ```bash
  netstat -tulpn | grep :<port>
  ```

### **Gate 2: Application Health**

**🚀 Container Health Checks**
- [ ] **All Containers Running**
  ```bash
  docker ps --filter "status=running" | grep <project>
  ```
- [ ] **Container Resource Limits**
  ```bash
  docker stats --no-stream <containers>
  ```
- [ ] **Volume Mounts Accessible**
  ```bash
  docker exec <container> ls -la <mount_path>
  ```

**🔧 Service Dependencies**
- [ ] **Database Connectivity from API**
  ```bash
  docker exec <api_container> nc -zv <db_host> <db_port>
  ```
- [ ] **Redis/Cache Connectivity**
  ```bash
  docker exec <api_container> redis-cli -h <redis_host> ping
  ```
- [ ] **External API Endpoints Accessible**

**📝 Configuration Validation**
- [ ] **Environment Variables Set**
- [ ] **Configuration Files Present**
- [ ] **Secrets/Credentials Available**

### **Gate 3: Core Functionality**

**🔑 Authentication Flow Test**
- [ ] **Wrong Password Rejected**
  ```bash
  curl -X POST <api>/auth/login -d '{"email":"test@test.com","password":"wrong"}'
  # Expected: {"detail":"Invalid email or password"}
  ```
- [ ] **Non-existent User Rejected**
  ```bash
  curl -X POST <api>/auth/login -d '{"email":"fake@test.com","password":"any"}'
  # Expected: {"detail":"Invalid email or password"}
  ```
- [ ] **Valid Credentials Process** (even if session creation fails)
- [ ] **Session Validation Works**
  ```bash
  curl -H "Authorization: Bearer <token>" <api>/protected-endpoint
  ```

**🌍 CORS Configuration**
- [ ] **OPTIONS Preflight Works**
  ```bash
  curl -X OPTIONS -H "Origin: <frontend_domain>" <api>/auth/login
  # Expected: 200 OK with CORS headers
  ```
- [ ] **Access-Control-Allow-Origin Header Present**
- [ ] **Access-Control-Allow-Methods Includes Required Methods**
- [ ] **Access-Control-Allow-Headers Includes Content-Type**

**🔗 API Endpoint Validation**
- [ ] **Health Endpoint Responds**
  ```bash
  curl <api>/health
  # Expected: {"status":"healthy"}
  ```
- [ ] **Core API Routes Registered**
- [ ] **Error Handling Returns Proper Status Codes**

### **Gate 4: Security Posture**

**🛡️ Security Headers**
- [ ] **HSTS Header Present**
  ```bash
  curl -I <domain> | grep "Strict-Transport-Security"
  ```
- [ ] **X-Frame-Options Set**
- [ ] **X-Content-Type-Options Set**
- [ ] **Content Security Policy Configured**

**🔒 SSL/TLS Configuration**
- [ ] **HTTPS Enforced** (HTTP redirects to HTTPS)
- [ ] **SSL Grade A/A+** (SSL Labs test)
- [ ] **Certificate Chain Complete**
- [ ] **Strong Cipher Suites Only**

---

#### **✅ POST-DEPLOYMENT VERIFICATION (MANDATORY)**

### **Gate 5: Service Health Monitoring**

**📊 System Health**
- [ ] **All Services Responding** (2 minutes post-deployment)
- [ ] **Memory Usage Normal** (<80% of limits)
- [ ] **CPU Usage Stable** (<70% average)
- [ ] **Disk Space Available** (>20% free)

**🔍 Error Monitoring**
- [ ] **No 500 Errors** in first 5 minutes
- [ ] **Application Logs Clean** (no FATAL/ERROR entries)
- [ ] **Database Connection Pool Healthy**

### **Gate 6: End-to-End Functionality**

**🔑 Authentication Verification**
- [ ] **Full Login Flow Works**
  ```bash
  # Test complete user journey
  curl -X POST <api>/auth/login -d '{"email":"<test_user>","password":"<password>"}'
  # Expected: Success response with token OR clear error message
  ```
- [ ] **Session Management Functional**
- [ ] **Protected Routes Accessible**
- [ ] **Logout Process Works**

**🌐 Frontend-Backend Integration**
- [ ] **Frontend Loads Successfully**
  ```bash
  curl -I <frontend_domain>
  # Expected: HTTP 200 OK
  ```
- [ ] **API Calls from Frontend Work** (no CORS errors)
- [ ] **Static Assets Load** (JS, CSS, images)
- [ ] **No Console Errors** in browser dev tools

### **Gate 7: Performance Verification**

**⚡ Response Time Validation**
- [ ] **API Health Endpoint** <100ms
  ```bash
  curl -w "%{time_total}" <api>/health
  ```
- [ ] **Authentication Endpoint** <500ms
- [ ] **Static Assets** <200ms
- [ ] **Database Queries** <100ms average

**📈 Load Testing**
- [ ] **Concurrent User Test** (10+ simultaneous requests)
- [ ] **Memory Leaks Check** (sustained load for 5 minutes)
- [ ] **Connection Pool Stability**

### **Gate 8: Business Continuity**

**🔄 Rollback Readiness**
- [ ] **Previous Version Backup Available**
- [ ] **Database Migrations Reversible**
- [ ] **Configuration Rollback Prepared**
- [ ] **DNS Failover Ready** (if applicable)

**📞 Incident Response**
- [ ] **Monitoring Alerts Active**
- [ ] **Log Aggregation Working**
- [ ] **Error Notification Systems Enabled**
- [ ] **Emergency Contact List Updated**

---

#### **🚨 FAILURE HANDLING PROTOCOLS**

### **Pre-Deployment Gate Failures**

**Gate 1-2 Failures (Infrastructure/Health)**
- **Action**: STOP deployment immediately
- **Resolution**: Fix infrastructure issues before proceeding
- **Timeline**: No deployment until ALL infrastructure gates pass

**Gate 3-4 Failures (Functionality/Security)**
- **Action**: BLOCK deployment
- **Resolution**: Fix code/configuration issues
- **Rollback**: Not applicable (deployment never started)

### **Post-Deployment Gate Failures**

**Gate 5 Failures (Health Monitoring)**
- **Action**: Automatic rollback within 5 minutes
- **Alert**: Immediate notification to development team
- **Investigation**: Required within 1 hour

**Gate 6-7 Failures (Functionality/Performance)**
- **Action**: Rollback within 10 minutes if critical
- **Decision Matrix**: 
  - Critical business function broken → Immediate rollback
  - Performance degradation → Monitor for 30 minutes, then decide
  - Non-critical feature broken → Fix in hotfix

**Gate 8 Failures (Business Continuity)**
- **Action**: Immediate incident response activation
- **Communication**: Stakeholder notification required
- **Resolution**: Follow incident management procedures

---

#### **📋 GATE EXECUTION CHECKLIST**

### **Pre-Deployment (30-45 minutes)**
```bash
# Gate 1: Infrastructure (10 min)
□ Run database connectivity tests
□ Verify SSL certificates
□ Check DNS resolution
□ Validate container resources

# Gate 2: Application Health (10 min)  
□ Verify all containers running
□ Test service dependencies
□ Validate configuration files

# Gate 3: Core Functionality (15 min)
□ Test authentication endpoints
□ Verify CORS configuration  
□ Validate API responses

# Gate 4: Security (10 min)
□ Check security headers
□ Verify SSL configuration
□ Test HTTPS enforcement
```

### **Post-Deployment (20-30 minutes)**
```bash
# Gate 5: Health Monitoring (5 min)
□ Monitor service metrics
□ Check error rates  
□ Verify resource usage

# Gate 6: End-to-End (15 min)
□ Test complete user workflows
□ Verify frontend-backend integration
□ Check browser console for errors

# Gate 7: Performance (5 min) 
□ Measure response times
□ Test concurrent users
□ Monitor database performance

# Gate 8: Business Continuity (5 min)
□ Confirm rollback readiness
□ Activate monitoring alerts
□ Update incident response tools
```

---

#### **🎯 SUCCESS CRITERIA**

### **Deployment Approved When:**
- ✅ ALL 8 gates pass completely
- ✅ Zero critical issues identified  
- ✅ Performance metrics within acceptable range
- ✅ Security posture maintained/improved
- ✅ Business functionality verified working
- ✅ Rollback procedures tested and ready

### **Common Failure Patterns to Watch:**

**Database Issues** (40% of failures)
- Missing tables/columns
- Wrong user permissions
- Connection pool exhaustion
- Schema migration errors

**Authentication Failures** (25% of failures)  
- Session creation errors
- JWT configuration issues
- Role/permission mismatches
- Password hashing problems

**Network/CORS Issues** (20% of failures)
- CORS preflight blocks
- SSL certificate problems
- DNS resolution failures
- Security header conflicts

**Configuration Drift** (15% of failures)
- Environment variable mismatches
- Missing configuration files
- Secret rotation issues
- Service dependency changes

---

#### **📈 METRICS & MONITORING**

### **Gate Effectiveness Tracking**
- **Gate Failure Rate**: Target <5% overall
- **Pre-Deployment Catch Rate**: Target >90% of issues
- **Post-Deployment Rollback Rate**: Target <2%
- **Mean Time to Recovery**: Target <15 minutes

### **Continuous Improvement**
- Weekly gate effectiveness review
- Monthly failure pattern analysis  
- Quarterly gate refinement based on new failure modes
- Annual comprehensive gate framework audit

**Last Updated**: 2026-04-22 (From authentication system deployment learnings)

---

## ADM-059: Jira ↔ GitHub Traceability as Default Activity

### 🔗 **Standing Rule**
*Closing a Jira ticket without a GitHub commit link is a partial close.*

Every Jira ticket transitioned to Done — in any project, not just AV4 — must also receive a **Jira Remote Link** in the sidebar pointing at the shipping commit on `main`. Comments alone are not sufficient: they rot, get buried, and aren't a first-class traceability channel in the Jira UI. The sidebar Web Link is.

**Why (2026-04-24):** During the AurexV4 go-live push the user said literally: *"repeat the same for all tickets. it is default activity. #memorize."* This elevates what was a one-time back-fill into a permanent workflow rule.

### 🛠 **How to apply**

1. **Derive the commit.** When closing a ticket, identify the commit that shipped the work:
   - Easiest: the commit just pushed.
   - Fallback: `git log origin/main --grep='AV4-<N>' --oneline`
   - If the ticket is a subtask whose parent story shipped in one commit, inherit the parent's SHA.

2. **Verify the commit is on main:**
   ```bash
   git merge-base --is-ancestor <sha> origin/main   # exit 0 → on main
   ```
   Never link to a SHA that isn't pushed. Push first, link after.

3. **Add the Remote Link:**
   ```
   POST https://{site}.atlassian.net/rest/api/3/issue/{KEY}/remotelink
   {
     "globalId": "github-commit-<sha>",
     "object": {
       "url": "https://github.com/<org>/<repo>/commit/<sha>",
       "title": "GitHub · <sha>",
       "summary": "Shipping commit on main",
       "icon": { "url16x16": "https://github.com/favicon.ico", "title": "GitHub" }
     }
   }
   ```
   The `globalId` is an idempotency key — re-running updates the link in place instead of creating a duplicate.

4. **Rate-limit:** ~10 req/s (`sleep 0.1`) to stay friendly with Atlassian Cloud.

5. **Repo mapping:**
   - **AurexV4** → `https://github.com/Aurigraph-DLT-Corp/Aurex-V4`
   - Pick the correct origin when operating in other repos.

### 🚫 **Don'ts**

- Don't link planning or grooming tickets that have no code output (Sprint 0 stories, spike tickets). Skip cleanly.
- Don't invent a SHA just to satisfy the rule. If the mapping is unknown and can't be recovered from commit messages, leave the ticket link-less.
- Don't rely on Jira comments to carry the GitHub URL — use Remote Links. Comments are for narrative; Remote Links are for traceability.

### 📊 **Current compliance (AurexV4)**

- 88/303 Done tickets carry verified GitHub Remote Links at time of directive (commits `0213af8` through `4e56620`)
- Automated scan-and-link job will run against the remaining Sprint 0/1/2 tickets

---

## ADM-058: AurexV4 2026-04-23 Session — Sprint 2 delivery + hierarchy + 6× AAT parallel execution

### Single-session batch of 18 commits, all shipped to aurex.in

**Phase 1 — Sprint 2 delivery + tooling (10 commits):**

- **Sprint 2 complete** (`db971c4`): analytics aggregations, baselines CRUD, targets with SBTi pathways + progress, async report generation + download. Backend + frontend together.
- **Org hierarchy + rollup** (`5e23c9a`, `03e696f`): parent/subsidiary relationships, optional rollup across analytics and report generation, include-subsidiaries UI toggle.
- **Deploy script alignment** (`8652d27`): `scripts/deploy/deploy-to-remote.sh` rewritten to match the actual aurex.in host layout (ADM-043 compliance).
- **ESLint v9 flat-config migration** (`69b2931`): repo moves to flat config, schema smoke tests added, pre-deploy gates (ADM-055 gates 1-4) now pass cleanly.
- **Bug fixes**: emissions persistence + auth events (`0d1a74a`), sidebar dropdown clipping via portal (`01b5531`), missing `POST /users` endpoint (`9c6008d`), case-insensitive role checks (`c489ac1`).
- **Build hygiene**: `.dockerignore` to exclude `node_modules` from Docker build context (`49c3428`).

**Phase 2 — 6× AAT parallel execution under ADM-032/ADM-038 precedent (8 commits):**

Six specialized Task subagents dispatched in isolated git worktrees, one message, merged back via cherry-pick:

- **AAT1** (`81df912`) — RBAC backend: `Role` enum extended (MAKER/CHECKER/APPROVER/AUDITOR), `requireOrgRole` middleware, emissions status transitions role-gated via transition table (DRAFT→PENDING, PENDING→VERIFIED, any→REJECTED).
- **AAT2** (`09e5faa`) — CSV export (AV4-261): `GET /emissions/export` with RFC-4180-compliant encoder, subsidiary rollup, handwritten (no new deps).
- **AAT3** (`e3472ea`) — Audit Log API (AV4-223): `recordAudit` + paginated `GET /audit-logs`, admin-only, new `AuditLogsPage` with filter bar.
- **AAT4** (`04bb188`) — CSV bulk import (AV4-255): `ImportJob` model + `ImportJobStatus` enum, POST /imports/emissions accepts text/csv or JSON.
- **AAT5** (`2276f51`) — Per-org member management UI (AV4-301 frontend): "Members" drawer on `/admin/organizations` with 9-role dropdown covering the workflow roles.
- **AAT6** (`80d3fa6`) — Docs + WBS reconciliation + this ADM entry.
- **Two post-merge fixes** (`0764d11`, `d9a4e31`): BOM char in regex flagged by ESLint no-irregular-whitespace; `updateEmissionStatusSchema` broadened to accept `PENDING` for the new Maker→Checker transition.

### Playbook for 6× AAT parallel execution (repeatable under ADM-038)

1. Scope 6 narrow, file-disjoint slices per agent; flag unavoidable overlaps up-front (in this session: schema.prisma touched by AAT1 + AAT4 on disjoint lines).
2. Each agent gets `isolation: "worktree"` and a self-contained prompt including file allow-list, commit message template, and typecheck/test gate requirement. Never "based on your findings, implement X" — include concrete files and paths.
3. Agents commit in their own worktree and return branch + SHA. Main thread cherry-picks in low-risk-first order (docs → isolated services → shared-file edits → schema edits).
4. Expect 1–2 post-merge fixes: subagents lack session context on pre-existing schemas/lint rules. Budget ~15min for reconciliation.
5. Single deploy with `RUN_DB_PUSH=1` when any agent changed `schema.prisma`.

### Outcome

- Sprint 1 + Sprint 2 fully shipped; RBAC foundation + audit log + bulk import + CSV export now live.
- 7 Jira tickets auto-created as Done (AV4-302..308) for session work not on the WBS; the 6-AAT batch adds coverage for AV4-223/AV4-261/AV4-255 and the AV4-301 backend+UI split.
- AV4-301 remains "To Do" as the full RBAC epic umbrella (audit-trail for transitions is the remaining chunk).

**Last Updated**: 2026-04-23 (AurexV4 Sprint 2 delivery + 6× AAT parallel execution)

---

## ADM-060: `/deploy` = git commit + push + deploy (atomic)

**Status:** Applied (2026-04-24)
**Supersedes:** The `/deploy` command's earlier "Do not push to git. This command deploys what's already on main" guardrail.
**Reinforces:** ADM-053 (push-deploy-everything), ADM-059 (Jira ↔ GitHub Remote Links).

### 📜 **The rule**

`/deploy` is a **single atomic operation** that encompasses:

1. `git commit` — if the working tree is dirty, generate a terse conventional-commit message from the diff and commit.
2. `git push origin main` — push the resulting SHA upstream.
3. Run the standard deploy pipeline (typecheck → build → tar → docker build → swap container → health gate → SSL gate → post-deploy validation).

The deployed container **always matches `main`**. Uncommitted local changes are never shipped to prod. Prod state and git state are invariant-linked by the `/deploy` contract.

### 🧭 **Why this matters**

Before ADM-060, the deploy script tarred the local source tree (including uncommitted edits) and shipped it to remote. This meant:

- Prod could drift silently from `main`.
- ADM-59 Remote Links had no shipping commit to reference (the "shipping SHA" wasn't on `main`).
- Rolling back via `git revert` on `main` didn't actually revert prod — the uncommitted code stayed live.
- Auditors walking `main` → prod would find mismatches.

ADM-060 eliminates this class of drift by making "deploy uncommitted code" structurally impossible through the `/deploy` path.

### 🛠️ **How `/deploy` implements the rule (Phase 0)**

Added to `.claude/commands/deploy.md` **before** Phase 1:

1. `git status --short` → check for uncommitted edits.
2. If clean → report "working tree clean, deploying `<sha>`" and jump to Phase 1.
3. If dirty:
   a. Typecheck the target package(s). **ABORT if typecheck fails** — don't commit broken code.
   b. Generate a conventional-commit message from `git diff --stat` + `git diff`. Subject ≤70 chars, optional 1-3 bullet body on the *why*, with the `Co-Authored-By: Claude…` trailer.
   c. Stage **specific paths only** (`git add <paths>`, never `git add -A` — a secret or build artefact must not slip in).
   d. Commit + `git push origin main`.
   e. Record the new SHA; this is the commit that ADM-59 Remote Links reference and that Phase 5 reports.

### ✅ **Invariants after `/deploy` completes**

- `git -C <repo> status --short` is empty.
- `origin/main` points at the commit that's live in prod.
- The shipping SHA passes `git merge-base --is-ancestor <sha> origin/main` (ADM-59 link condition).

### 🚫 **Don'ts**

- Don't bypass Phase 0 by tarring and shipping a dirty tree directly. If `/deploy` auto-commit fails (hook rejection, etc.), fix the underlying issue and re-run — don't shortcut.
- Don't `git add -A` — always stage explicit paths.
- Don't push any branch other than `main` from `/deploy`. Feature-branch deploys go through PRs + CI, not this pipeline.

### 📍 **Precedent**

Formalised on 2026-04-24 after a deploy session where nav changes (`DashboardSidebar.tsx`, `DashboardTopbar.tsx`) were initially shipped from an uncommitted local tree. The agent paused, surfaced the drift risk, and got user approval to commit + push + deploy as a single flow — which became the new contract. Commit: `a6a8c38 feat(web): expose new features in top nav`.

---

## ADM-061: Graphify as Default Codebase-Navigation Aid

**Status:** Applied (2026-04-25)

### 📜 **The rule**

`graphify` is the default codebase-navigation aid for projects with non-trivial structure. Install once globally (`pipx install graphifyy` + `graphify install`), then opt-in per-project (`graphify claude install`). On architecture or codebase questions, prefer the graph over raw-file scans.

### 🛠️ **Setup**

1. Global: `pipx install graphifyy` + `graphify install` (writes skill to `~/.claude/skills/graphify/SKILL.md`).
2. Per-project: `graphify claude install` writes:
   - A `## graphify` section into the project `CLAUDE.md`.
   - A Glob/Grep PreToolUse hook in `.claude/settings.json` that injects `graphify-out/GRAPH_REPORT.md` as additional context when the graph exists.
3. Build the graph: `graphify .` from project root.
4. Refresh on code changes: `graphify update .` (AST-only, no API cost).

### ✅ **Why**

- The hook is a no-op until `graphify-out/graph.json` exists, so it's safe to install per-project ahead of time.
- Reduces token cost on architecture/codebase queries by replacing raw-file scans with graph-guided traversal.
- AST-only refresh means continuous sync is cheap.

### 📍 **Precedent**

Adopted 2026-04-25 after AurexV4 architecture queries (god-node identification, community structure) repeatedly burned tokens on raw scans. Graph-guided answers for the same questions were 5-10× cheaper.

---

## ADM-062: Gemini Deep Research as Canonical Regulatory-Drift Scanner

**Status:** Applied (2026-04-26)
**Reinforces:** ADM-053 (push-deploy-everything), ADM-063 (compliance triage).

### 📜 **The rule**

Regulatory landscape monitoring (BCR, A6.4 PACM, SEBI BRSR, ICVCM, CORSIA, Verra, DPDP, RBI PA, PMLA, EU CSRD/CBAM) goes through **Gemini Deep Research** with Google Search grounding, persisted to `RegulatoryResearchRun` for audit, and triaged via ADM-063.

### 🛠️ **Implementation**

- Adapter: `apps/api/src/services/research/gemini-deep-research.ts` (calls `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`).
- Auth: `GOOGLE_AI_API_KEY` *or* `GEMINI_API_KEY` (research adapter accepts either; admin Interactions API uses `GEMINI_API_KEY` only).
- Tools: `[{google_search: {}}]` for grounding (returns 30-60+ source URLs per run via vertexaisearch redirect proxy).
- Default model: **`gemini-2.5-flash`**. Free-tier `gemini-2.5-pro` is rate-limited to **0** input tokens at the time of writing — do not default to it without billing.
- `maxOutputTokens: 32000` for batched runs.
- Persisted via `RegulatoryResearchRun` model + admin route `POST /api/v1/admin/research/run`.
- Weekly cron: `.github/workflows/gemini-regulatory-research.yml` (Mon 02:00 UTC).

### ⚠️ **Two API gotchas (codified)**

1. **Cannot combine `responseMimeType:"application/json"` with the `google_search` tool.** API rejects with HTTP 400 "Tool use with a response mime type: 'application/json' is unsupported." Solution: rely on prompt-based JSON output, parse the response yourself.
2. **The 16K `maxOutputTokens` cap silently truncates with `finishReason: MAX_TOKENS`.** When the expected output spans >5 areas, **split prompts by topic** into 2-3 batches. Empirically: a single 10-area prompt got truncated at 16K with 14 partial findings; the same content split into 2 prompts (5 areas each) returned 10 + 14 complete findings cleanly with `finishReason: STOP`.

### 📍 **Precedent**

Formalised on 2026-04-26 during the AV4-416..439 regulatory gap analysis. First run hit MAX_TOKENS truncation; second run (split into Batch A + Batch B) returned 24 unique findings (deduped from 8+10+14) cleanly. 60+ source URLs preserved across batches.

---

## ADM-063: Compliance-Blocker Triage on Regulatory Findings

**Status:** Applied (2026-04-27)
**Pairs with:** ADM-062 (Gemini regulatory drift scanner), ADM-064 (parallel AAT worktree isolation).

### 📜 **The rule**

Every regulatory gap finding produced by ADM-062 (or any compliance audit) is routed into one of two tracks:

1. **Engineering-tractable** — schema, service, route, UI changes that an engineer can ship without external dependencies. Track via Jira labels `regulatory-gap`, `gap-<area>`, `severity-<P0|P1|P2>`. Priority field mapped (P0→Highest, P1→High, P2→Medium). Ship via AAT waves per ADM-064.
2. **Legal / Compliance / Vendor blocker** — requires external action engineering can't take alone (RBI Payment Aggregator license, FIU-IND PMLA registration, BCR vendor outreach, FEMA opinion, DPDP SDF assessment, etc.). Tag with `compliance-blocker` label and post a structured deferral memo on the ticket.

### 🛠️ **Deferral memo format**

Every `compliance-blocker` ticket gets a comment with these fields:

- **Why deferred:** the action engineering cannot take.
- **Owner:** who acts (Legal Counsel — India payments / Compliance team / Vendor account team / etc.).
- **Blocked until:** the trigger that resumes engineering work (e.g. "Legal opinion on SDF status", "FIU-IND registration approved").
- **Engineering scaffold:** what code (if any) was shipped to support the eventual compliance work — so when the blocker clears, integration is days not months.

### ✅ **Sprint planning impact**

JQL for engineering sprint planning excludes `compliance-blocker`:
```
project = AV4 AND labels = "regulatory-gap" AND labels NOT IN ("compliance-blocker") AND statusCategory != Done
```

Compliance/legal owners get a separate JQL view (`labels = "compliance-blocker"`).

### 📍 **Precedent**

AV4-416..439 batch (2026-04-26/27): 24 findings → 14 engineering tickets shipped (R1-R4 waves, 5,888 lines, 137 new tests) + 6 compliance memos posted. Engineering throughput was uncluttered by legal blockers; compliance had a clean backlog with concrete owners and resume-triggers.

---

## ADM-064: Parallel AAT Worktree Isolation for Shared-Schema Feature Ships

**Status:** Applied (2026-04-27)
**Pairs with:** ADM-063 (compliance triage routes to AAT waves).
**Reinforces:** ADM-038 / ADM-039 (parallel AAT execution), ADM-058 (multi-AAT delivery).

### 📜 **The rule**

When N parallel AATs each need to extend a shared file (typically `packages/database/prisma/schema.prisma`, but also `apps/api/src/index.ts` for route mounting, or `packages/database/src/seed-master-data.ts` for seed data), launch each agent via the Agent tool with **`isolation: "worktree"`**. Each agent commits on its own branch in its own git worktree; the orchestrator cherry-picks each commit onto `main` sequentially with gates between picks.

### 🛠️ **Workflow**

1. **Brief** each AAT with explicit "files you may modify" + "files you must NOT touch (other AATs are working there)" sections — prevents collisions on filename, not just on hunks.
2. **Launch** each AAT with `isolation: "worktree"`. Each gets a dedicated git worktree under `.claude/worktrees/agent-<id>/`.
3. **Cherry-pick sequentially** as each completes:
   - `git cherry-pick <sha>` onto main.
   - Regenerate Prisma client between cherry-picks: `pnpm exec prisma generate`.
   - Run `pnpm --filter @aurex/api typecheck` as a gate.
   - Run scoped tests for the cherry-picked work as a gate.
4. **Deploy** after every 1-2 commits (`RUN_DB_PUSH=1 ./scripts/deploy/deploy-to-remote.sh` if schema diffed).
5. **Auto-merge usually works** on schema.prisma because each AAT extends a different model section. Manual merge resolution would mean the briefs were too overlapping — fix the briefs, not the merge.

### ✅ **Why worktrees, not branches**

- Branches share a working tree; if AAT-1 stages a file AAT-2 also wants, AAT-2 sees uncommitted state from AAT-1.
- Worktrees give each AAT its own checkout root. Their working trees are physically separate. Cross-contamination is impossible.
- Cleanup: worktree is auto-removed if the agent makes no changes; otherwise the path + branch are returned in the agent result for the orchestrator to clean up.

### 📍 **Precedent**

AV4-416..439 regulatory-gap batch (2026-04-26/27): 4 parallel AATs (R1 carbon-market labels, R2 BRSR XSD/assurance, R3 DPDP module, R4 CSRD retirement granularity) all extended `schema.prisma`. Total: 5,888 lines + 137 new tests across 14 Jira tickets, **zero manual merge resolution**, two deploys (one per cherry-pick pair). Wall-clock ≈ 25 min from dispatch to all-shipped.

---

## ADM-065: Soft-Gated Linear Setup Journey on Dashboard

**Status:** Applied (2026-04-27)
**Pairs with:** Component 0 (Requirements & Design Review), feature ergonomics work.

### 📜 **The rule**

User onboarding for a multi-feature platform follows an **explicit linear setup journey** surfaced as a numbered checklist on the dashboard, with **soft gating** — each step lists prior steps as prerequisites, but no hard 412/403 backend block prevents power users from skipping ahead. The journey is the recommended path, not a forced one.

### 🛠️ **Implementation pattern**

For AurexV4 the journey is **6 steps** (commit `6e8c867`, 2026-04-27):

1. **Register the organisation** — captures org root (name, region, sector).
2. **Add subsidiaries** — multi-org tenants only; single-org tenants click "skip / not applicable".
3. **Invite users + assign RBAC roles** — least-privilege early.
4. **Upload organisational financials** — fiscal year, currency, revenue, employees. Anchors entity-level ESG context (BRSR P9, CSRD ESRS-2, intensity KPIs).
5. **Add first emission entry** — first measured GHG record.
6. **Generate first report** — first analytical/compliance output.

The dashboard `NextStepsWidget` renders all six with completion checks, dimming unavailable steps until prior steps are done. Header shows `"Get started — N of 6 steps complete"`. Once all six are done, the widget collapses into a single `"Set up complete"` line.

### ✅ **Why soft gating beats hard gating**

- **Power users self-route.** Someone migrating from a CSV doesn't want to be forced through the wizard before they can paste their data.
- **Dashboard is the canonical guide.** The widget is the single source of truth for "what to do next" — no scattered tooltips or splash screens.
- **Engineering simplicity.** No middleware needs to track 6 onboarding gates; the widget reads existing API surfaces (onboarding row, org tree, users, financials, emissions count, reports count) and infers state.
- **Backwards compatibility.** Existing users (who completed the legacy 3-step wizard) don't get re-prompted — the widget infers their journey from current data shape.

### 🚫 **What soft gating does NOT mean**

- **Auth and quota gates stay hard.** ADM-040 (rate limits), ADM-041 (CORS+JWT), and tier-quota 429s are independent of journey gating.
- **Subscription EXPIRED gates stay hard** (Aurex's 402 write-block). The setup journey is about feature discovery, not entitlement.

### 📍 **Precedent**

Formalised on 2026-04-27 in commit `6e8c867 feat(flow): rework setup journey to 6 explicit steps`. Tester feedback (2026-04-25) explicitly called out: "the features created need better understanding how this work in the application." The earlier 5-step `NextStepsWidget` (Wave 9a) was a first cut; this 6-step rework adds the **subsidiaries** + **financials** steps that were tester pain points and reorders the others to match the actual sequential dependency graph.

### 🛠️ **Companion: OrganizationFinancials as canonical entity-level financial dimensions**

Step 4 of the journey writes to a new `OrganizationFinancials` table (1:1 with `Organization`). This table is the **single source of truth** for entity-level financial dimensions used across:

- BRSR P9 + CSRD ESRS-2 entity disclosures
- Emissions-intensity KPIs (tCO2e per ₹revenue, per employee FTE)
- Auditor reasonable-assurance context

Captured fields: `fiscalYear`, `fiscalYearStartMonth` (default April for India FY), `currency` (ISO 4217), `annualRevenue` (Decimal), `totalAssets`, `employeeCount`, `contractorCount`, `industrySector` (free-text override of `Org.industry`), `reportingScope` (`standalone | consolidated`), `notes`. `ORG_ADMIN+` write gate; any member reads.

Endpoint: `GET / PUT / DELETE /api/v1/me/org/financials`. Editable any time post-onboarding via `/dashboard/settings/financials`.

---

## ADM-067: Aurigraph LLM Gateway + Canonical Project Registration

**Status:** Applied (2026-04-28)
**Pairs with:** Component 0 (Multi-project tooling), Component 6 (Security — single key surface), Component 7 (Insights/observability — usage attribution).
**Reinforces:** OpenBao (KMS) + Harbor (registry) as the canonical platform services projects bind to at registration time.

### **The rule**

Every Aurigraph project's LLM calls go through **one** shared gateway at **`https://j4c.aurigraph.io/llm-gateway`** (repo: `Aurigraph-DLT-Corp/llm-gateway`). Default model **Gemma 3-12B int4 on CPU via Ollama**, automatic fallback to **Anthropic Claude Haiku 4.5** on timeout / 5xx / rate-limit / transport error. The gateway is OpenAI-compatible (`POST /v1/chat/completions`, `Authorization: Bearer <project-key>`), so any project drops in via the `openai` SDK with a custom `base_url` — no provider-specific code in callers.

**Project registration is a single atomic call** to J4C: `POST /api/v3/integrations/projects` (J4C router `j4c-api/app/routers/integrations.py`) fans out to OpenBao → Harbor → llm-gateway in declared order, rolls back in reverse on any failure, and returns one-time secrets via `secrets_once`. Per-service adapters live in `j4c-api/app/services/integrations/{openbao,harbor,llm_gateway}.py`. llm-gateway adapter is **real**; Harbor + OpenBao adapters are **stubs** until `HARBOR_ADMIN_*` and `OPENBAO_ADMIN_TOKEN` are set in `j4c-api/.env` (flipping each from stub to real is a single-file change with no caller impact).

### **Contract**

- **One Anthropic key, one place.** After Phase 5 (decommission playbook in `llm-gateway/docs/PHASE_5_DECOMMISSION.md`) the only host that knows `ANTHROPIC_API_KEY` is the gateway server. Per-project `.env` files hold only `LLM_GATEWAY_URL` + `LLM_GATEWAY_KEY`. `scripts/check_residual_anthropic.sh` is the gate — exit 1 = blocker.
- **Hashed bearer keys.** `gateway/app/store.py` persists SHA-256 hashes only; raw keys are returned exactly once on `POST /admin/projects` or `/admin/projects/{id}/rotate`. JSON-file store at `LLM_GATEWAY_STORE_PATH` (default `/var/lib/llm-gateway/projects.json`), atomic writes via `tempfile + os.replace`. Auto-seeds from `LLM_GATEWAY_PROJECT_KEYS` env on first start (back-compat).
- **Two-tier auth.** Project keys hit `/v1/*`; admin operations require a separate `LLM_GATEWAY_ADMIN_KEY` and hit `/admin/*`. Project keys cannot reach `/admin/*`.
- **Per-project usage log.** Every gateway call writes one JSON-line to `usage.jsonl` with `project_id`, `provider`, `_fallback_used`, `elapsed_ms`, token counts. One-liner cost-attribution lives in `docs/PROJECT_KEYS.md`.
- **Smoke gate before any decommission.** `scripts/smoke_test_integrated.py --project <id>` must PASS (and by default rejects fallback-only success — pass `--allow-fallback` to relax) before removing any project's local `ANTHROPIC_API_KEY`.

### **Why this shape**

- **One key surface = one revocation surface.** Compromising any one project's `.env` only burns that project's bearer key; the underlying Anthropic key never leaves the gateway server.
- **Stub adapters keep the orchestrator real-from-day-one.** OpenBao + Harbor adapters return placeholder metadata when their admin tokens aren't set, so registration calls succeed end-to-end before those services are wired up. Real provisioning lights up service-by-service as ops sets each token — no breaking-change rollouts.
- **Open-weights default + frontier fallback** matches the cost shape: cheap routine calls land on local Gemma, hard reasoning falls through to Claude, and the fallback rate is the gateway's primary health metric.

### **Precedent**

Session 2026-04-27/28:
- `Aurigraph-DLT-Corp/llm-gateway` (commits `0ef95a9` → `fb85cf0`) — Phase 1 scaffold (vLLM/Ollama + FastAPI gateway), Phase 2 admin/store/CLI (`gateway/app/{admin,store,auth}.py`, `scripts/llmctl.py`), Phase 5 prep (`docs/PHASE_5_DECOMMISSION.md`, `scripts/smoke_test_integrated.py`, `scripts/check_residual_anthropic.sh`).
- `Aurigraph-DLT-Corp/Jeeves4Coder` PR #23 (J4C call-site swap, 11 sites), PR #24 (J4C integrations API + adapter package).
- Audit-only PRs: `cj#7` (Provenews — 1 real swap), `HCE2#2`, `AWD2#31`, `Battua#5`, `Aurigraph-DLT#33` — each ships an `LLM_GATEWAY_AUDIT.md` + a language-appropriate `LlmGatewayService` template.

### **Numbered keys + endpoints (registry)**

| Project | Key location | Endpoint |
|---|---|---|
| J4C, Battua, Provenews, HCE2, Aurex, V12-DLT, AWD | `LLM_GATEWAY_PROJECT_KEYS` JSON in gateway `.env` (seed) → hashed in `/var/lib/llm-gateway/projects.json` | `https://j4c.aurigraph.io/llm-gateway/v1/chat/completions` |

Rotation: `scripts/llmctl.py projects rotate <id>` (returns new raw key once). All rotations are also logged via the gateway's usage log.

---

## ADM-066: Healthcare CCAA on DLT (Separate Compose + `/healthcare` Subpath)

**Status:** Applied (2026-04-27)  
**Pairs with:** Component 5-6 (Deploy + Verification), DLT Traefik on `dlt.aurigraph.io`.  
**Reinforces:** ADM-055 (pre/post deploy gating at project level); isolation from the main V11/portal `docker compose` tree.

### **The rule**

The **healthcare** use case (Critical Care AI Assistant — CCAA) deploys to **`https://dlt.aurigraph.io/healthcare/`** as an **independent** Compose project (`name: healthcare-dlt`), not as a service block inside the monolithic `Aurigraph-DLT/docker-compose.yml`. Two containers: **`healthcare-api`** (Uvicorn/FastAPI) and **`healthcare-web`** (nginx for Vite `base=/healthcare/`). Both connect to the **existing** Traefik user-defined network (`*dlt-frontend*`, name resolved at deploy time via `DLT_NETWORK_NAME` or `docker network ls`).

### **Contract**

- **Path prefix** — In containers: `URL_PREFIX=/healthcare` so routes are `/healthcare/healthz`, `/healthcare/v1/calc/qsofa`, etc.
- **Traefik** — API routes use **priority 100**; static UI uses **priority 10** on `PathPrefix(/healthcare)` so `/healthcare/v1/...` never falls through to nginx first.
- **Deploy transport** — Default **`ssh -p 2244 subbu@dlt.aurigraph.io`**, `rsync` to `REMOTE_DIR` (default `/opt/healthcare-dlt`), then `docker compose -f docker-compose.dlt.yml up -d --build` on the server.

### **Why a separate project**

- Avoids merge churn and image/version coupling with the main DLT V11 stack.
- Clear blast radius: `docker compose -p healthcare-dlt down` does not stop portal/API.
- Same operational pattern as other **sidecar** services on a shared edge (Traefik).

### **Precedent**

Session 2026-04-27: `healthcsare/healthcare` — FastAPI + React prototype, J4C creds import script, PRD/WBS/ARCH; DLT deliverable in `docker-compose.dlt.yml`, `deploy/Dockerfile.*`, `scripts/deploy-dlt.sh`.

---

## ADM-067-A: DLT Edge Is `aurigraph-nginx-gateway`, Not Traefik (ADM-066 Amendment)

**Status:** Applied (2026-04-28)
**Amends:** ADM-066 (Traefik labels are inert on the live DLT host). **Numbering note:** distinct from **ADM-067** (LLM Gateway); this entry is **067-A** to avoid duplicate anchors.
**Pairs with:** existing nginx config at `/opt/platform/apps/aurigraph-v12/nginx/dlt.conf` bind-mounted into `aurigraph-nginx-gateway`.

### **The reality**

The `dlt.aurigraph.io` host runs a single edge container `aurigraph-nginx-gateway` (image `nginx:1.27-alpine`) — **not Traefik**. Traefik labels in `docker-compose.dlt.yml` are silently ignored. To expose `/healthcare/*` publicly, a `location` block must be added to `dlt.conf` and nginx reloaded inside the gateway container.

### **The contract**

- **Edge network:** `dlt-docker_aurigraph-dlt` (override via `DLT_NETWORK_NAME` when invoking compose).
- **Gateway config file:** `/opt/platform/apps/aurigraph-v12/nginx/dlt.conf` on host (RO bind-mount).
- **Reload path:** `docker exec aurigraph-nginx-gateway nginx -t && nginx -s reload` (`subbu` is in `docker` group; no sudo).
- **Routing block for healthcare:**
  - `location ~ ^/healthcare/(v1/|healthz$)` → `http://dlt-healthcare-api:8000` (regex priority over prefix)
  - `location /healthcare/` → `http://dlt-healthcare-web:80`
  - `location = /healthcare` → 301 to `/healthcare/`
- **Backup before reload:** `cp dlt.conf dlt.conf.bak.$(date +%s)`; rollback if `nginx -t` fails.

### **Deploy path (verified 2026-04-28)**

```bash
DLT_NETWORK_NAME=dlt-docker_aurigraph-dlt \
DOCKER_DEFAULT_PLATFORM=linux/amd64 \
REMOTE_DIR=/home/subbu/healthcare-dlt \
./scripts/deploy-dlt.sh
```

`/opt/healthcare-dlt` requires sudo (root-owned `/opt`); use `~/healthcare-dlt`. `rsync` is **not** installed on the DLT host — `scripts/deploy-dlt.sh` should be amended to fall back to `tar | ssh 'tar xzf -'` (or install rsync via the host's package process). The script's auto-detect of `dlt-frontend` was removed in favor of honoring a pre-set `DLT_NETWORK_NAME` (commit `acba862`).

### **Self-hosted runner caveat**

The self-hosted runner on `aurdlt01` is registered to `Aurigraph-DLT-Corp/Aurigraph-DLT`, not the healthcare repo, so `.github/workflows/deploy-healthcare-dlt.yml` runs queue indefinitely. Re-register at the **org level** (`Aurigraph-DLT-Corp`) to serve all repos with one runner.

### **Future direction**

Option to migrate the DLT edge to Traefik exists but is invasive — would replace `aurigraph-nginx-gateway` and require all DLT-resident apps' compose files to be re-validated. **Status quo decision:** keep nginx-gateway; new apps add a `location` block to `dlt.conf` rather than relying on Traefik labels.

### **Precedent**

Session 2026-04-28: healthcare CCAA went live at `https://dlt.aurigraph.io/healthcare/` via this path. Verified: `/healthcare/healthz` (200), `/healthcare/v1/calc/qsofa` (sample → score 3), `/healthcare/v1/cds/evaluate` (Sepsis differential surfaced).

---

## Project-Specific ADM Logs

Project-specific architecture decisions live in the project repos, not in this global registry:

- **HCE2**: `~/subbuworkingdir/HCE2/docs/ADM_LOG.md` — HCE2-numbered ADMs (HCE2-ADM-001..014) covering Sprint 34-37 backlog, Docker import paths, dashboard wiring, nav simplification, ML lib upgrade, async DB, MinIO, Mandrill SMTP, platform audit, PWA fix, citations, reports refactor.
- **Healthcare (CCAA)**: deploy + stack decisions are **ADM-066** + edge routing **ADM-067-A** in this file; implementation lives in `~/subbuworkingdir/healthcsare/healthcare` (`requirement.txt`, `docs/`, `docker-compose.dlt.yml`).
- **Aurex / AurexV4**: covered in this global registry (ADM-058 onward) since Aurex deployment patterns drive cross-repo standards.

This separation keeps the global registry focused on cross-cutting decisions (deployment workflow, AAT, J4C framework, traceability standards) while project-specific implementation memos live alongside their code.

---

## ADM-068 — Aurigraph Deployment Agent: BINDING across every Aurigraph project (#MANDATORY — Apr 30, 2026 — USER MANDATED)

**Strengthens the Apr 22 mandate (Auto-Deploy After Build + 4-Level Test Cascade). The earlier rule was "skipping is forbidden". The actual behaviour observed in HCE2 on 2026-04-29 was ~30 manual SSH-and-rebuild deploys with the agent and the L0–L4 cascade silently skipped, because the `/deploy` skill text listed bash steps and the assistant followed them literally. This entry closes that gap.**

**Rule:** Every deploy on every Aurigraph project (HCE2, Aurigraph V12, AurexV3, Website V3, Battua, Healthcare CCAA, all future projects) goes through `@J4CDeploymentAgent` / the `j4c-deployment-agent` subagent. The agent is the **single allowed entry point** for any production deploy.

**Enforcement points:**

1. **Assistant behaviour (binding):**
   - When the user invokes `/deploy`, says "deploy", says "ship", or pushes a commit that needs to land on a server, the **very first** tool call is `Agent(subagent_type="j4c-deployment-agent", ...)`. Manual `ssh ... docker compose build` is FORBIDDEN as a top-level action.
   - When the user says "verify" or "audit a deploy", spawn the agent retroactively against the head commit.
   - Per-project `/deploy` skills must delegate to the agent. If a project's `/deploy` skill text only lists bash steps, that text is informational — it must NOT be executed by the assistant; the agent runs it via its own flow.

2. **CI/CD (binding):**
   - `git push origin main` triggers the agent via the project's GHA workflow on a self-hosted runner. When the runner is offline, the user or the assistant invokes the subagent directly — same sequence, same gates.

3. **Project ADM logs (binding):** every project ADM_LOG.md (or equivalent) must contain an adoption entry referencing this ADM-068. HCE2 = HCE2-ADM-023. Other Aurigraph projects must add the equivalent at their next deploy.

**The cascade and gates (unchanged from Apr 22 spec; reproduced here so this entry is self-contained):**

- **Diff classification** picks deploy mode: backend / frontend / migration / config / dependency / infra / docs-only.
- **Incremental by default.** Full image rebuild only for `requirements*.txt`, `Dockerfile*`, or `docker-compose.yml`.
- **L0 → L1 → L2 → L3 → L4** test cascade. L0 = 15 infra smoke. L1 = unit+integration on changed components. L2 = smoke on unchanged platform (collateral damage). L3 = regression on full diff. L4 = full E2E (only when L3 fails).
- **JIRA bug logging** on every failure. Correct project: HCE2 (HCE2-xxx), AV11 (Aurigraph V12), AVX (AurexV3), WV3 (Website V3), etc.
- **3-Layer AutoHeal verification** after every deploy: Docker `restart: always` (Layer 1) + systemd watchdog timer (Layer 2) + external health probe (Layer 3). All three must pass for a deploy to be ADM-compliant. Missing watchdog or probe → JIRA tickets created automatically (e.g. HCE2-347/348 created 2026-04-29).
- **Session tracking:** `session.md` + `todo.md` updated by the agent automatically.
- **Rollback** triggers automatically on CRITICAL infra failures.

**Verdict semantics (added by this ADM):**

| Verdict | Meaning |
|---|---|
| **PASS** | L0–L1 PASS *and* AutoHeal Layers 1–3 all PASS. Deploy is ADM-compliant. |
| **PARTIAL** | Functional pass (containers + auth + endpoints OK) but one or more AutoHeal layers missing. Deploy works but is not ADM-compliant; outstanding JIRA tickets must be resolved before declaring "done". |
| **FAIL** | L0 fail OR L1 fail with no AutoHeal recovery. Rollback. |

A deploy with verdict "PARTIAL" is **not** complete. It must be tracked to PASS via the linked JIRA tickets.

**Why this exists:** the Apr 22 mandate was documented but not enforceable — the assistant could and did read it, agree with it, then deploy manually anyway. ADM-068 makes the agent invocation the assistant's **first** action on any deploy intent, with no parallel "manual path" available. There is no opt-out.

---

## ADM-069 — Sequence tasks; never abandon an in-flight task on a new prompt (#MANDATORY — May 1, 2026 — USER MANDATED)

**Rule:** When the user sends a new instruction while a previously-issued task is mid-execution, the assistant MUST complete the in-flight task to a clean stopping point first, then queue the new task next. Context-switching mid-task is FORBIDDEN.

**Behaviour contract:**

1. **Acknowledge immediately.** When a new instruction arrives mid-task, acknowledge in one sentence ("queued — finishing X first") so the user has explicit confirmation it's not lost. Do NOT silently continue without surfacing the new task.
2. **Finish to a clean boundary.** "Clean stopping point" means the in-flight task has reached one of: a committed-and-pushed code state, a successful deploy verdict, or an explicit failure/rollback. Mid-edit / mid-build / mid-deploy is NOT a clean boundary; finish through.
3. **Then process the queue in arrival order.** Newer items behind any earlier-queued items, FIFO. The assistant may batch related items if it makes the work shorter (e.g., two consecutive cleanup requests merged into one pass) but must never reorder.
4. **Surface the queue.** At the start of each new task in the queue, the assistant restates the remaining queue so the user can see what's coming and redirect if needed.
5. **Hard interrupts override.** If the user explicitly says "stop", "cancel", "abort", "skip" — immediately halt the current task (rolling back if a destructive op is in progress) and process the new instruction as the next item.

**What this prevents:** the user observed today (2026-05-01) that mid-N2O/CH4 implementation a follow-up instruction ("research SOC via drone hyperspectral") was issued, and the assistant indicated stopping the current task. That is exactly the pattern this ADM forbids.

**What this does NOT change:** ADM-068 still binds — deploy intent always routes through `j4c-deployment-agent` first. ADM-069 is about ordering across multiple sequential user tasks, not about which agent handles a given task.

**Memorialised in:**
- `~/.claude/CLAUDE.md` — global instruction snippet so the rule is loaded into every session.
- HCE2 `claude.md` — project-level reminder.
- HCE2 project memory `feedback_task_sequencing.md` — feedback memory persists across sessions.

---

## ADM-070 — Email-Domain Allowlist for Aurigraph Web Properties (#MANDATORY — May 1, 2026 — USER MANDATED)

**Rule:** Every Aurigraph web property that authenticates via OAuth (Google, GitHub, etc.) MUST enforce an email-domain allowlist at the OAuth callback BEFORE any session token is issued. Default policy: only `@aurigraph.io` accounts pass.

**Why:** Without an allowlist, OAuth providers will accept any verified email — turning a portal into a vector for credential stuffing, social engineering against external accounts, or unauthorized lateral access. The allowlist is the single highest-leverage access control: it eliminates the attack surface of "any Google account on the planet."

**Behaviour contract:**

1. Env: `ALLOWED_EMAIL_DOMAINS=aurigraph.io` (csv; empty = allow-all for backward compat).
2. In each OAuth callback handler — AFTER fetching the user profile, BEFORE issuing the JWT:
   - Resolve the verified primary email (Google: `email_verified=true`; GitHub: requires `/user/emails` follow-up call with `primary=true AND verified=true`)
   - If domain not in allowlist → redirect to `/login?error=domain_not_allowed&email=<urlencoded>`. Do NOT issue a JWT.
3. The Login page reads `email` from the query string and renders it inline ("`foo@gmail.com` is not an aurigraph.io account…") so the user sees what was rejected.

**Reference**: J4C Portal commits `3e03efb6e` (allowlist + RBAC introduction), `38881af20` (login page email-inline UX). Code: `j4c-api/app/middleware/auth.py::is_email_allowed`, `j4c-api/app/routers/auth.py`, `j4c-react/src/pages/Login.tsx`.

---

## ADM-071 — Three-Tier RBAC with DB-Authoritative Role Lookup (#MANDATORY — May 1, 2026 — USER MANDATED)

**Rule:** Aurigraph web properties needing privilege separation MUST implement a three-tier RBAC model — `superadmin > admin > member` (rank 3 > 2 > 1) — with role hierarchy enforced by rank comparison. The DB is the single source of truth for a user's effective role; the JWT `role` claim is informational only.

**Why:** Trusting the JWT claim alone allows revocation lag (e.g., a demoted user keeps their old token until expiry). Re-resolving from the DB on every request makes role changes take effect immediately. Hierarchical rank check (`actual_rank >= min_rank`) means routes declaring `require_role("admin")` automatically grant access to superadmins — no need to enumerate every privileged role at every site.

**Behaviour contract:**

1. **Roles**:
   - `superadmin` (rank 3) — full access + manages user roles
   - `admin` (rank 2) — full platform access except role management
   - `member` (rank 1) — read-only on shared resources, mutate own data

2. **Hierarchy** via `_ROLE_RANK = {"superadmin": 3, "admin": 2, "member": 1}`:
   - `require_role("admin")` accepts admin OR superadmin
   - `require_role("superadmin")` accepts only superadmin
   - Tokens missing the `role` claim default to `member` (backward compat)

3. **DB lookup on every request** — middleware reads the JWT, extracts `email`, queries `user_roles` table for the effective role. Cached per-request in `request.state` to avoid duplicate queries within one handler. JWT `role` claim is treated as a hint, never as the source of truth.

4. **Bootstrap-only superadmin** — superadmins are minted ONLY via `INITIAL_SUPERADMIN_EMAILS` env at app startup. PUT `/api/v3/users/roles/{email}` MUST refuse `role=superadmin` with `400 ROLE_NOT_ALLOWED_VIA_API`. DELETE MUST refuse removing a superadmin row with `409 CANNOT_DEMOTE_SUPERADMIN` (lockout protection).

5. **Schema**:
   ```sql
   CREATE TABLE user_roles (
     email       TEXT PRIMARY KEY,
     role        TEXT NOT NULL CHECK (role IN ('superadmin','admin','member')),
     granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     granted_by  TEXT,
     CONSTRAINT email_lower CHECK (email = lower(email))
   );
   CREATE INDEX idx_user_roles_role ON user_roles(role);
   ```

**Reference**: J4C Portal commits `3e03efb6e` (admin/member tier), `b9abbd926` (superadmin tier), `38881af20` (image-drift fix-forward proving the guard works). Code: `j4c-api/app/middleware/auth.py::require_role`, `j4c-api/app/db/rbac.py`, `j4c-api/app/routers/users.py`, `j4c-react/src/lib/api.ts::isAdmin/isSuperadmin`.

---

## ADM-072 — Stub-Mode Adapter Pattern for External Integrations (#MANDATORY — May 1, 2026 — USER MANDATED)

**Rule:** Every external-service adapter (LLM gateway, Vault/KMS, container registry, etc.) MUST handle the "credentials not configured yet" case via stub mode. The adapter MUST NEVER raise an exception during `__init__`; it MUST set `self.enabled = bool(<required-creds>)` and return placeholder ProvisionResults when disabled.

**Why:** Orchestrators typically eagerly instantiate all adapters at startup. A constructor exception in any one adapter brings down the entire integrations endpoint for ALL services, including the ones that ARE configured. Defensive `__init__` plus opt-in stub behaviour keeps the orchestrator usable on day one and lights up real provisioning incrementally as ops sets each token.

**Behaviour contract:**

1. Adapter `__init__` reads required creds from `Settings`. If any required field is empty, set `self.enabled = False`. **Never raise.**

2. `health()`:
   ```python
   if not self.enabled:
       return {"reachable": False, "reason": "<service> admin token not configured (STUB MODE)"}
   ```

3. `provision(project_id, project_name, **opts)`:
   ```python
   if not self.enabled:
       return ProvisionResult(
           service="<name>",
           api_key=None,
           metadata={"mode": "stub", "reason": "<creds> not set"},
           no_secrets=True,
       )
   # ... real implementation below the guard
   ```

4. `rotate()` and `deprovision()` follow the same pattern.

5. Settings MUST include all required fields with empty-string defaults (so Pydantic doesn't `AttributeError` on access). Example for J4C:
   ```python
   openbao_url: str = ""
   openbao_admin_token: str = ""
   harbor_admin_url: str = ""
   harbor_admin_user: str = ""
   harbor_admin_password: str = ""
   ```

**Reference incident**: J4C Portal commit `a03c788f9` — `OpenBaoAdapter.__init__` was crashing on missing `openbao_url` field, which broke `POST /api/v3/integrations/projects` for ALL roles regardless of auth (RBAC guard was firing AFTER adapter instantiation). Fix added the missing Settings fields and confirmed all three adapters instantiate cleanly with empty env. Code: `j4c-api/app/services/integrations/{harbor,openbao,llm_gateway}.py`, `j4c-api/app/services/integrations/base.py::ProvisionResult`, `j4c-api/app/config.py::Settings`.

---

## ADM-073 — Image-Drift Detection in Deploy Verification Cascade (#MANDATORY — May 1, 2026 — USER MANDATED)

**Rule:** The L1 (changed-features) layer of the @J4CDeploymentAgent's L0–L4 cascade MUST verify that the running container's code matches the on-disk repo source for the changed files. Image drift between the host and the container is a class of bug that masks every higher-layer test.

**Why:** When a service uses `docker cp` for fast iteration (hot-patching files into a running container without rebuild) and later gets `docker compose up -d --force-recreate`'d, the container reverts to the IMAGE's baked source. The host file still shows the new code; the container runs the old code. Cascade L2/L3/L4 still pass (because they hit the running container, which is internally consistent), but the host repo and the running container have diverged. The bug surfaces only when someone explicitly diffs the source on the host vs the container.

**Reference incident**: RBAC ship verification post `b9abbd926`. The host had `Depends(require_role("admin"))` on `POST /api/v3/integrations/projects`, but the container had the older `Depends(require_auth)`. RBAC guard was missing. A member JWT 500'd (downstream SQL crash) instead of 403'ing. Fix: full j4c-api image rebuild (`38881af20`) so the container's baked source matched master HEAD.

**Behaviour contract:**

1. The cascade's L1 step MUST include an explicit drift check for any file in the diff classification:
   ```bash
   for f in <changed-backend-files>; do
     diff <(host file) <(docker exec <container> cat /app/$f) || echo "DRIFT in $f"
   done
   ```
2. If drift is found → fail L1, force a rebuild + recreate, re-run L1.
3. Prefer source bind-mounts (see ADM-074) to eliminate drift as a class — the host file becomes the live source, no image rebuild required.

**Where it lives:** Built into the @J4CDeploymentAgent cascade definition (per-project agent guides). Reference commits: `a03c788f9` (adapter Settings fix that surfaced the drift), `38881af20` (rebuild fix-forward).

---

## ADM-074 — Source Bind-Mount for Incremental Backend Deploys (#RECOMMENDED — May 1, 2026)

**Rule:** Backend services with frequent source-code iteration SHOULD bind-mount their `app/` source into the running container as read-only (`./service/app:/app/app:ro`). This makes `docker compose up -d --force-recreate <service>` sufficient to pick up code changes — no image rebuild required.

**Why:** Image rebuilds for a one-line code change are slow (multi-minute pip / npm install / docker layer cache invalidation) and brittle (cache misses cause rebuild loops). Bind-mounting the source layer makes incremental deploy ~5 seconds. Production safety is preserved because the image still ships baked source as the fallback — a clean `docker compose up -d <service>` from a fresh checkout still works.

**Trade-off:** A bind-mount inverts the dependency direction — in dev, the host is authoritative. In prod this can mask the "what's in the image" question. Mitigations:
1. Bind-mount is **read-only** (`:ro`) — code can't be edited from inside the container.
2. ADM-073 image-drift check catches accidental skews.
3. The image is still a valid fallback if the bind-mount path is missing or wrong.

**Behaviour contract:**

1. In `docker-compose.yml`, under the service's `volumes:` block:
   ```yaml
   - ./service/app:/app/app:ro
   - ./service/tests:/app/tests:ro
   ```

2. After the change, `docker compose up -d --force-recreate <service>` and verify:
   ```bash
   docker exec <container> stat /app/app/main.py  # shows host inode
   docker exec <container> python3 -c "import app.main"  # imports work
   ```

3. Apply per-service after a few weeks of frequent iteration. Don't pre-mount every service — only the ones where image-rebuild cost has been observed to slow the team down.

**Reference**: J4C Portal Sprint 1 commit `e3d346bd0` — `j4c-api/app` + `j4c-api/tests` bind-mounted; eliminates the `docker cp` workaround pattern that caused the ADM-073 image-drift incident.

---

## ADM-075 — Activate J4C Agent across every Aurigraph project + start central data collection (#MANDATORY — May 1, 2026 — USER MANDATED)

**Strengthens ADM-068.** ADM-068 mandated the `j4c-deployment-agent` for *deploy-time* verification. Between deploys, the fleet was invisible — the agent only ran when the assistant invoked it. ADM-075 closes that gap: every project must run the agent on a recurring schedule from an off-host vantage and post reports to a central J4C server, so drift, outages, and AutoHeal regressions are caught between deploys, not after.

**Rule:** Every Aurigraph project (HCE2, AurexV4, AurexV3, Aurigraph V12, Website V3, Healthcare CCAA, Battua, MEV-Shield, J4C Portal itself, all future projects) must:

1. **Vendor `scripts/j4c-agent.py` from HCE2** (canonical home — `Aurigraph-DLT-Corp/HCE2:scripts/j4c-agent.py`). Agent improvements flow upstream to HCE2 first, then back-vendor to consumers (ADM-068 already mandates this for deploy use; ADM-075 makes it project-wide).
2. **Maintain a `.j4c-agent.json`** at the repo root with:
   - `server.host` = the production target (NOT staging unless the project has no prod yet)
   - `health_endpoints[]` = at least the public health endpoint + 2 user-facing routes
   - `expected_containers[]` = every running service in prod docker-compose
   - `autoheal.layer1_compose_file` = relative path to the prod compose
   - `autoheal.layer2_systemd_unit` / `layer3_extprobe_unit` = the on-host watchdog/probe unit names
   - `j4c_central.grpc_endpoint` = the production J4C AgentReportService URL (currently `j4c.aurigraph.io` — exact gRPC port to be confirmed by the J4C platform team; until then it stays `null` and the agent runs in `doctor` mode only)
3. **Schedule the agent off-host** via one of:
   - **Vector A**: systemd user timer on dev4 / j4c.aurigraph.io / any machine that is NOT the target server, every 5 min. Files: `scripts/deploy/aurex-j4c-watchdog.{sh,service,timer}` (rename per project).
   - **Vector B**: GitHub Actions cron `*/5 * * * *` on a self-hosted runner that is NOT on the target. Workflow file: `.github/workflows/j4c-watchdog.yml`.
   - Pick exactly one. Running both produces duplicate alerts.
4. **Wire alerts via the project's existing transport** (Mandrill for AurexV4 / Website V3 / Healthcare; Slack for HCE2; etc.). Alert on `verdict=FAIL` by default; `AUREX_J4C_ALERT_ON=any` if PARTIAL is also actionable.
5. **Switch to `report` mode** (gRPC POST to J4C central) once `j4c_central.grpc_endpoint` is confirmed live. Until then, `doctor` mode + per-project alerting is the bridge.

**Why:**

- **Single source of truth**: HCE2 is canonical. Sub-projects vendor a copy. Patches flow upstream first (PR to HCE2), then back-vendor — never the other way around. Fork-style divergence is the failure mode this prevents.
- **Off-host vantage**: an on-host probe (the existing `aurex-external-probe.timer` pattern) cannot catch a full-host outage. The J4C agent run from a different machine catches DNS, ISP, cert, and machine-level failures the on-host probe is blind to.
- **Continuous, not deploy-time**: ADM-068's deploy-time agent run leaves a 1-hour to 1-week gap between deploys where regressions aren't seen. 5-min cadence reduces MTTD to the timer interval.
- **Central data collection**: per-project alerting tells you "this one box is sick"; central reporting via the gRPC `AgentReportService` aggregates the entire fleet — historical drift, cross-project AutoHeal compliance, deploy-frequency vs failure-rate trends. Operating without it is operating one project at a time.

**Behaviour contract:**

1. **Agent canonical patches** (ANY change to `scripts/j4c-agent.py`):
   - Branch in HCE2 → PR → merge → all consumer projects update by `cp` from HCE2 main + commit referencing the upstream SHA.
   - Patches that arrive bottom-up (e.g. AurexV4's Layer 1 `unless-stopped` fix on 2026-05-01) MUST be PR'd back to HCE2 within the same session that introduces them. The agent must not diverge across projects.
2. **Per-project `.j4c-agent.json` is NOT shared** — each project tunes its own server, endpoints, and autoheal config. The agent code is universal; the config is local.
3. **Adoption sequencing:** projects activate in order of operational maturity:
   - **Phase 1 — In production with known autoheal**: HCE2 (already), AurexV4 (this ADM), Healthcare CCAA, Website V3.
   - **Phase 2 — In production but autoheal-incomplete**: J4C Portal, MEV-Shield. Activate `doctor` mode (no central post) + use the agent's verdict to drive AutoHeal install per ADM-068.
   - **Phase 3 — Pre-prod**: Aurigraph V12, AurexV3, Battua. Activate against staging until prod ships.
4. **Verdict cadence:** at the schedule interval, the agent emits PASS / PARTIAL / FAIL. PARTIAL is the steady state for projects without remote `.git` (per the ADM-075 patch to the agent that makes deploy-section drift FAIL → PARTIAL on missing-`.git`). Alerting only on FAIL is the recommended default; PARTIAL trends are visible in the central log without paging.
5. **Operator action required to activate**: each project's first agent run is operator-driven (initial scp + systemctl enable, or first GH Actions secret set). Subsequent runs are automatic.

**Reference**:
- AurexV4 commits — `aab1f28` (vendor agent from HCE2), `cff6ebc` (off-host watchdog wrapper + systemd timer + GHA workflow + AUTOHEAL.md rewrite), `f5ed123` (in-session fix to the watchdog DIGEST bash-quoting bug).
- AurexV4 patches to the agent itself (to be back-PR'd to HCE2 per the canonical-source rule):
  1. Layer 1 check counts `restart: unless-stopped` and `restart: on-failure` as healthy restart policies, not just `restart: always`. ADM-055 makes `unless-stopped` the default for AurexV4 (and HCE2's compose uses it too) — the original Layer 1 check produced false PARTIAL on every run.
  2. Deploy section: missing remote `.git` (common when the deploy script tar's source over without preserving `.git`) returns PARTIAL with the error, not FAIL. Drift detection unavailable ≠ deploy broken.
- Reference docs:  ~/.claude/ADM.md §ADM-068 (deploy-time mandate), `Aurigraph-DLT-Corp/HCE2/scripts/j4c-agent.py` (canonical agent source), `proto/j4c_agent.proto` (central gRPC schema).

---

## ADM-076 — Knowledge Graph as Canonical Knowledge Source for Aurigraph Projects (#MANDATORY — May 2, 2026 — USER MANDATED)

**Rule:** The J4C Knowledge Graph at `https://j4c.aurigraph.io/kgraph` (backed by `/api/v3/kgraph/*` on `j4c-api`) is the **canonical, real-time-updated representation of architectural knowledge** for every Aurigraph project. Sessions, tools, and humans MUST read the Knowledge Graph FIRST when looking for architectural state, decision history, component relationships, or session-derived facts. Falling back to flat docs (`context.md`, `session.md`, individual ADM files) is permitted ONLY when the kgraph cannot answer the query.

**Why:** Aurigraph's architectural surface area now spans 9+ projects, 75+ ADM entries, and many cross-cutting subsystems (RBAC, llm-gateway, kgraph, integrations adapters, watchdog/AutoHeal, deploy cascade). Linear documents (`context.md`, `session.md`, `ADM.md`) bury that signal in chronology; the assistant ends up re-reading thousands of lines to answer a simple "what's connected to ADM-068". The kgraph already represents these as nodes and edges — querying it is two orders of magnitude faster and produces a structurally-correct answer instead of a textually-similar one.

**Behaviour contract for sessions / agents / Claude:**

1. **First read** at session start: `GET https://j4c.aurigraph.io/api/v3/kgraph/health` → confirms graph is live and returns current node/edge counts. If unreachable, fall back to flat docs and surface the kgraph outage.

2. **For architectural queries** ("what's the RBAC model", "what does ADM-068 enforce", "what depends on the llm-gateway"):
   - First call `GET /api/v3/kgraph/data` (full graph snapshot) or `GET /api/v3/kgraph/neighbors/{node_id}` (focused expansion).
   - Render the node + neighbors as the answer. Cite the source ADM entries by ID.
   - Read `context.md` / `session.md` / individual ADM markdown files **only if** the kgraph response is empty or incomplete.

3. **For session-history queries** ("what changed yesterday", "what was the last deploy"):
   - Kgraph is augmented with `SESSION` and `FILE` node types over time. Query by node type first.
   - Fall back to `git log` / `session.md` only when kgraph yields nothing.

4. **For mutations** (recording a new ADM, a new decision, a new project relationship): write the canonical artifact (ADM.md, session.md, etc.) AND ingest it into the kgraph via `POST /api/v3/kgraph/ingest/adm` (admin-gated). The kgraph and the flat doc are kept consistent at write time, not retroactively.

5. **Real-time updates** (see ADM-076-A below): the j4c-api watches `docs/global-config/ADM.md` for changes and re-ingests on modification, so the kgraph never lags the canonical ADM.

**Per-project deployment:**

- The J4C portal hosts the canonical kgraph instance.
- Other projects (DLT V12, AurexV3 → Aurex-V4, HCE2, Website V3, Battua, MEV Shield, Provenews, AWD2) consume the J4C kgraph via authenticated `/api/v3/kgraph/*` HTTP calls — they do NOT each run their own kgraph.
- Each project's own session.md / context.md remains useful for project-specific *operational* state (containers, ports, deploy paths) but should NOT duplicate ADM content.

**Reference**: J4C Portal commits — `81a95a8f2` (kgraph subsystem), `b2a8fc8e2` (auto-ingest at startup + sklearn fallback), `c8de05a22` (ingest modal), `38881af20` (DELETE node), `e3d346bd0` (DELETE edge). Code: `j4c-api/app/kgraph/{storage,subsystem,router,ingest,gnn,config}.py`. Frontend: `j4c-react/src/pages/KnowledgeGraphPage.tsx`.

---

## ADM-076-A — Real-Time Knowledge Graph Updates via ADM File Watcher (#MANDATORY — May 2, 2026 — USER MANDATED)

**Rule:** The J4C kgraph MUST stay synchronized with the canonical `~/.claude/ADM.md` (and the four J4C copies) in real time. A file watcher inside `j4c-api` watches the bind-mounted `/app/data/adm.md` and triggers a re-ingest within 2 seconds of any modification.

**Why:** Without realtime sync, the kgraph drifts from the canonical ADM the moment a new ADM entry is appended. Drift defeats ADM-076 — the assistant reads the kgraph thinking it's authoritative, but it's stale by hours or days. The auto-ingest-at-startup pattern (b2a8fc8e2) only catches changes at container restart.

**Behaviour contract:**

1. `j4c-api` startup spawns a background `watchfiles`-based watcher on `/app/data/adm.md` (path is bind-mounted from `docs/global-config/ADM.md`).
2. On `modified` or `created` events, the watcher debounces by 500ms (to coalesce rapid editor saves) and calls the existing `_subsystem.ingest_adm(file_text)` path.
3. Each successful re-ingest emits an SSE event on `GET /api/v3/kgraph/events` — frontend subscribers (the Knowledge Graph page) receive `{"type": "kgraph.updated", "counts": {...}, "ts": "..."}` and refresh their local data without manual reload.
4. The watcher logs each ingest with a counter delta (`+N nodes, +M edges`) to stdout for observability.
5. If `watchfiles` is unavailable (alpine-slim image), fall back to a 30-second polling loop comparing file mtime — degrades gracefully without losing the contract.

**Reference**: Implementation pending (Sprint 2+). When shipped, reference the deploy commit here.

---

## ADM-077 — Project-Bound LLM Gateway Keys and Deploy-Time Env Verification (#MANDATORY — May 3, 2026)

**Rule:** Every Aurigraph service that calls the J4C LLM Gateway MUST use a project-specific `LLM_GATEWAY_KEY` bound to its canonical `project_id`. Generic or stale keys from seed `.env` files are forbidden. Deploy verification MUST prove the running container has both `LLM_GATEWAY_URL` and the expected project key before the service is marked healthy.

**Why:** Wave A found DLT V12 running without `LLM_GATEWAY_KEY` in the `aurigraph-v12-app` environment. Wave B fixed it by rotating a `dlt-v12` gateway key, patching the live compose env block, force-recreating the app, and smoking `https://j4c.aurigraph.io/llm-gateway/v1/models` with that key. This turns "LLM env exists somewhere" into a project-bound runtime contract.

**Behaviour contract:**

1. Each project gets exactly one canonical gateway project id, for example `dlt-v12`, `aurex-v4`, `provenews`, `website-v3`, `hce2`, or `j4c`.
2. `LLM_GATEWAY_URL` and `LLM_GATEWAY_KEY` must be passed through the production runtime boundary (`docker-compose.yml`, systemd unit, or `docker run` env). A host `.env` entry alone is not sufficient.
3. L1 deploy verification MUST inspect the running process/container env and then execute a gateway-auth smoke:
   ```bash
   docker exec <container> printenv LLM_GATEWAY_KEY | head -c 12
   curl -fsS -H "Authorization: Bearer $LLM_GATEWAY_KEY" "$LLM_GATEWAY_URL/v1/models"
   ```
4. The J4C usage log must attribute calls to the project id. Missing attribution is a failed migration even if the HTTP call succeeds.
5. Direct provider keys (`ANTHROPIC_API_KEY`, OpenAI keys, etc.) must be absent from migrated application containers unless the project has an explicitly documented exception.

**Reference:** 2026-05-03 Wave B deploy: DLT V12 key rotation and env fix-forward; Aurex-V4 first-time integration; Provenews Phase 5 gateway migration.

---

## ADM-078 — LLM Gateway Completion-Path Smoke Is Required, Not Just Model Listing (#MANDATORY — May 3, 2026)

**Rule:** LLM Gateway verification MUST include a real completion/chat-completion request on the exact path the application uses. `/v1/models` proves authentication and reachability only; it does not prove the provider execution path works.

**Why:** Wave B proved project keys and `/v1/models` for Provenews, but the translation path still degraded because Gemma returned 404 on `/v1/chat/completions` and Claude fallback returned 502 due to zero Anthropic credit balance. The integration was correct and graceful, but provider readiness was not proven by the model-list smoke.

**Behaviour contract:**

1. L1 changed-feature checks for any LLM migration must run:
   - Auth smoke: `GET /v1/models`
   - Completion smoke: `POST /v1/chat/completions` or the exact project endpoint if different
   - Application smoke: the feature route that triggers the LLM path
2. If the app has a deterministic fallback, the fallback may pass user-facing smoke, but provider-path failure must be reported as PARTIAL with root cause.
3. Provider health issues are tracked centrally:
   - Gemma OpenAI-compatible `/v1/chat/completions` path returning 404
   - Claude fallback unavailable while Anthropic credit balance is zero
4. The deploy is PASS only when the application contract is satisfied and the provider-path status is explicitly classified. Silent fallback without operator visibility is forbidden.

**Reference:** Provenews Phase 5 decommission on 2026-05-03: Anthropic SDK removed, gateway attribution confirmed, graceful passthrough on provider 502/404 classified as provider-readiness gap.

---

## ADM-079 — AutoHeal Layer 2 Timers Must Be Reboot-Persistent (#MANDATORY — May 3, 2026)

**Rule:** Installing a systemd watchdog timer is incomplete until reboot persistence is verified. For user-level timers, `loginctl show-user <user> -p Linger` MUST report `Linger=yes`; otherwise the timer may stop after logout or reboot. Prefer system-level timers for production watchdogs unless user-level isolation is required.

**Why:** Wave B installed `aurigraph-v12-watchdog.timer` and it was `active (waiting)`, but `Linger=no` meant it would not survive a server reboot. Wave A/B also exposed missing Layer 2 timers for Website V3, HCE2, and Provenews. ADM Layer 2 must be durable, not merely active in the current login session.

**Behaviour contract:**

1. Layer 2 verification MUST include both timer state and reboot persistence:
   ```bash
   systemctl --user status <project>-watchdog.timer
   loginctl show-user <deploy-user> -p Linger
   ```
   or, for system units:
   ```bash
   systemctl is-enabled <project>-watchdog.timer
   systemctl is-active <project>-watchdog.timer
   ```
2. If `Linger=no` for a user timer, the deploy verdict is PARTIAL until `loginctl enable-linger <user>` is run or the timer is migrated to a system unit.
3. AutoHeal reporting must classify all three layers independently:
   - Layer 1: Docker restart policy
   - Layer 2: reboot-persistent watchdog timer
   - Layer 3: external probe or autoheal container
4. Missing Layer 2 on a production project is a tracked operational gap even when the app health endpoint is green.

**Reference:** 2026-05-03 Wave A/B AutoHeal checks: DLT V12 timer active but not reboot-persistent; Provenews no watchdog timer; Website V3 and HCE2 missing Layer 2 timers and Layer 3 autoheal containers.

---

## ADM-080 — External Project Graphs as a Parallel J4C KGraph Subsystem (#MANDATORY — May 3, 2026)

**Rule:** The canonical ADM/decision kgraph and per-project external graphs MUST remain separate graph domains under the same `/kgraph` product surface. External graphs (graphify code maps, document graphs, research graphs, or other untyped graph payloads) MUST be stored project-scoped and graph-name-scoped under `/api/v3/kgraph/external/{project}/{graph_name}` rather than coerced into the typed ADM schema.

**Why:** Graphify output for AurexV4 has 2,407 nodes, 3,698 edges, inferred/extracted confidence metadata, communities, and hyperedges. Mapping it into the ADM schema would either pollute the canonical decision graph or discard the metadata that makes graphify useful. A parallel external-graphs subsystem preserves graph-native shape while still giving users a single J4C `/kgraph` UI with project and graph selectors.

**Behaviour contract:**

1. Canonical ADM/decision graph endpoints remain `/api/v3/kgraph/data`, `/nodes`, `/edges`, `/analytics/*`, and `/ingest/*`.
2. External graph endpoints are:
   - `GET /api/v3/kgraph/external/projects`
   - `GET /api/v3/kgraph/external/{project}/graphs`
   - `GET /api/v3/kgraph/external/{project}/{graph_name}`
   - `GET /api/v3/kgraph/external/{project}/{graph_name}/data`
   - `POST /api/v3/kgraph/external/{project}/{graph_name}` (admin only)
   - `DELETE /api/v3/kgraph/external/{project}/{graph_name}` (admin only)
3. External graph payloads MUST preserve `nodes`, `edges`, optional `hyperedges`, optional community metadata, and graphify confidence/source fields. NetworkX `links` output must be transformed to `edges` before ingestion or seeding.
4. The `/kgraph` UI MUST expose source selection (`Canonical ADM` vs `External per-project`) plus project and graph selectors. Canonical-only mutations and analytics must be hidden or disabled when an external graph is selected.
5. Production deploys SHOULD bundle critical external graphs as startup seeds when persistence is still in-memory. First required seed: `aurexv4/code-architecture` with 2,407 nodes, 3,698 edges, and 6 hyperedges.
6. Deploy verification for this subsystem MUST prove:
   ```bash
   GET /api/v3/kgraph/external/projects
   GET /api/v3/kgraph/external/aurexv4/graphs
   GET /api/v3/kgraph/external/aurexv4/code-architecture/data
   ```
   and confirm the expected AurexV4 counts.
7. Long-term storage MAY move from in-memory to Postgres JSONB/object storage, but the endpoint contract and graph-native payload shape are stable.

**Reference:** J4C commits `87cc51ad1` (external subsystem + UI selectors) and `1b82d8dcc` (AurexV4 startup seed + Docker build stabilization), May 3, 2026.

---

## ADM-081 — SPA `index.html` MUST Be `Cache-Control: no-cache, must-revalidate` (#MANDATORY — May 4, 2026)

**Rule:** Every nginx serving an Aurex/Aurigraph SPA front end MUST set `Cache-Control: no-cache, must-revalidate` on `index.html`. Hashed bundle assets (Vite content-hashed `index-XXXX.js`/`.css`/etc.) keep their existing `expires 30d; public, immutable`. The two policies must coexist in the same `location /` block, with `index.html` overriding via `location = /index.html`.

**Why:** Without an explicit `Cache-Control` on the HTML shell, browsers fall back to heuristic caching driven by `Last-Modified` — sometimes serving a stale `index.html` for hours. The stale shell references a hashed bundle from a prior build, which the deploy has already removed, so users either see the previous build or hit a 404 on the bundle. Symptom observed in production (`aurex.in` deploys 2026-05-04): three iterative onboarding rebuilds shipped, but the user kept seeing the old wizard. Forensics confirmed `Last-Modified` was fresh on the server and the bundle hash was new — the browser was simply not revalidating because no cache directive was set.

**Behaviour contract:**

1. nginx config for any Aurex/Aurigraph SPA host MUST include:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
       expires 30d;
       add_header Cache-Control "public, immutable";
     }
     location = /index.html {
       add_header Cache-Control "no-cache, must-revalidate" always;
       expires off;
     }
   }
   ```
2. Conditional GETs via `ETag` / `Last-Modified` keep this cheap (304 when unchanged).
3. Repo-side nginx templates MUST stay reconciled with the live config. Drift between repo template and live config triggered a redundant deploy in the 2026-05-04 forensics.
4. Post-deploy L1 verification for any web-asset deploy MUST include:
   ```
   curl -sSI https://<host>/        # Cache-Control: no-cache, must-revalidate
   curl -sSI https://<host>/assets/index-<hash>.js  # public, immutable
   ```

**Reference:** AurexV4 commits `fdefc66` (live nginx surgical patch) and `d715be3` (repo template reconciliation), May 4, 2026.

---

## ADM-082 — Express Literal-Prefix Routes MUST Be Declared Before Parameter Routes (#MANDATORY — May 4, 2026)

**Rule:** Any Express router that exposes a literal-prefix endpoint sharing a path level with a `:id` parameter route MUST declare the literal first. Concretely: `/current` before `/:id`, `/me` before `/:id`, `/tree` before `/:id`, `/search` before `/:id`. The same rule applies one level deeper: `/current/members` before `/:id/members`, `/current/teams` before `/:id/teams`.

**Why:** Express matches in declaration order. Declaring `/:id` first causes literal paths to match the parameter route with `req.params.id = "current"`, which downstream services almost always 500 on (Prisma `P2023` invalid UUID, JSON Schema rejecting non-UUID, etc.). The user-visible failure is a 500, not a 404, which obscures the real cause and burns a deploy cycle to diagnose. Symptom observed 2026-05-04: `GET /api/v1/organizations/current` and `/current/members` returned 500 because `/:id` was declared before `/current`, and `getOrgById("current", userId)` crashed in Prisma. Page-level result: "Failed to load organization" + "Failed to load members" with no actionable error to the user.

**Behaviour contract:**

1. Every router with a `:id` parameter route MUST be reviewed against this rule before review/merge.
2. Tests for parametrised routers MUST include at least one literal-vs-param ambiguity check (e.g. `GET /:resource/current` returns 200 or 401, never 500).
3. When refactoring, prefer a comment block above the literal route explaining the order constraint:
   ```ts
   // Mounted BEFORE `/:id` so Express does not match "current" as a UUID
   // (which previously 500'd in the service layer on Prisma UUID parsing).
   router.get('/current', ...)
   router.get('/:id', ...)
   ```
4. Where literal-prefix routes are introduced, also clarify the auth contract: `/current` typically resolves the active org via `requireOrgScope`, not via `req.params.id`. Mixing the two without an explicit guard is forbidden.

**Reference:** AurexV4 commit `4a3309e`, May 4, 2026.

---

## ADM-083 — Web-Hook ↔ API-Route Response-Shape Contract MUST Be Co-Tested (#MANDATORY — May 4, 2026)

**Rule:** Every TanStack Query hook that consumes an API route MUST have a matching contract test that exercises the actual response shape. The contract has two halves:
- **Wrapper convention** (`{ data: T }` envelope vs. unwrapped `T`) MUST be consistent for every related hook in the same domain.
- **Casing convention** (camelCase vs snake_case) MUST be enforced at the route layer, not silently absorbed in the hook.

If a route returns `{ data: org }` but the hook expects an unwrapped `Organization`, the page renders blank with no errors and no signal to the user — only the empty-state fallback fires. This is harder to debug than a 500.

**Why:** During the 2026-05-04 organization-page fix, two distinct shape mismatches caused silent or noisy failures:
- `useOrganization()` consumed `org.id` directly but the existing `/:id` route returned `{ data: org }`. The page worked only because nothing in production currently calls `useOrganization(uuid)` — only the new `/current` path needed the unwrapped shape.
- `useOrgMembers()` consumed `{ data, total, page, page_size }` flat with snake_case, but the service returned `{ data, pagination: {page, pageSize, total, totalPages} }` camelCase nested. The route MUST flatten before responding.

Without a contract test, these mismatches surface as the WORST kind of bug: no 500, just an empty page or "Failed to load" toast that points at the wrong cause.

**Behaviour contract:**

1. Every web hook in `apps/web/src/hooks/` that fetches data MUST have a matching backend integration test in `apps/api/src/routes/*.test.ts` that asserts:
   - The exact wrapper shape (envelope or unwrapped)
   - The exact casing (camelCase or snake_case)
   - The exact field names the hook consumes
2. Field-shape adapters belong in the route, not the hook. Routes are the contract boundary; hooks should not paper over backend inconsistencies.
3. New routes that share a domain with existing routes MUST match the dominant convention. If a new route can't match (e.g. legacy snake_case), the route MUST emit BOTH camelCase and snake_case keys (alias) until the mismatch is removed.
4. Code review checklist for any new route or new hook: "Does this hook's response type match what the route returns? Is there a test that proves it?" — must be answered YES before merge.

**Reference:** AurexV4 commit `4a3309e`, May 4, 2026 (`/organizations/current` + `/current/members` shape adapters).

---

## ADM-084 — Single Source of Truth for User-Verified State Is `email_verified_at`, Not `is_verified` (#MANDATORY — May 4, 2026)

**Rule:** Any code that reads or writes a user's verified state MUST treat `users.email_verified_at` (timestamp) as the single source of truth. The boolean `users.is_verified` is a derived/cached value and MUST never be written without also writing `email_verified_at = now()` in the same transaction. UI components MUST read `email_verified_at` (not `is_verified`) to decide whether to show "Verify your email" banners or gate verified-only features.

**Why:** During 2026-05-04 forensics on `subbu@aurex.in`, the user record showed `is_verified = true` but `email_verified_at IS NULL` and zero rows in `email_verifications`. The user had been set "verified" via a manual DB poke or admin override that bypassed `verifyToken()`. Consequences:
1. Welcome email NEVER fired for this user — because `sendWelcomeEmailBestEffort()` is gated on the `verifyToken()` code path, not on `is_verified`.
2. The dashboard banner "Verify your email — we sent a verification link to subbu@aurex.in" rendered indefinitely — because the banner reads `email_verified_at`.
3. Verification token history could not be audited — because no token was ever issued.

Split truth between `is_verified` and `email_verified_at` is a long-term operational hazard. The two MUST be written together or not at all.

**Behaviour contract:**

1. `verifyToken()` in `email-verification.service.ts` is the only sanctioned write path for verification state. Manual DB updates require a follow-up `UPDATE … SET email_verified_at = NOW()` in the same statement, never just `is_verified = true`.
2. Frontend components MUST source their "verified?" decision from `email_verified_at`, not `is_verified`. Banner copy may say "verified" but the gating field is the timestamp.
3. A migration SHOULD add a CHECK constraint or trigger: `is_verified = true` requires `email_verified_at IS NOT NULL`.
4. Audits: any user row with `is_verified = true AND email_verified_at IS NULL` MUST be flagged as inconsistent. Repair script: set `email_verified_at = users.created_at` (or a known good timestamp) and confirm the welcome email path either fired or is intentionally skipped.

**Reference:** AurexV4 forensics 2026-05-04 on user `27f1ff33-5131-49d3-b94f-81789753c3fa` (subbu@aurex.in).

---

## ADM-085 — Onboarding Visual Language: Horizontal Top-Mounted Stepper Across All Surfaces (#RECOMMENDED — May 4, 2026)

**Rule:** All onboarding-related surfaces in Aurex/Aurigraph apps SHOULD use a horizontal top-mounted breadcrumb stepper as the primary progress indicator. The pattern: state circles (✓ done / number active / number muted), a horizontal connector line through the circles, per-step label below the circle, optional 1-line subtitle/summary, and "Locked" italic for upcoming gated steps. Vertical left-rail steppers are explicitly NOT preferred — user feedback 2026-05-04 was clear ("i prefer the wizrd in V3 ... with horizontal breadcrumb on top than vertical").

**Why:** Onboarding spans multiple surfaces (a new-user welcome screen, a multi-step form wizard, a dashboard "Get started" widget) that historically diverged visually. The 2026-05-04 session shipped four iterative redesigns to converge on the V3-style horizontal stepper. Locking the convention prevents future redesigns from re-litigating the same choice.

**Behaviour contract:**

1. Components that satisfy this convention in AurexV4:
   - `OnboardingPage` wizard → `HorizontalStepper` (3 steps)
   - `OnboardingPage` `WelcomeJourney` → `HorizontalJourneyStepper` (6 steps)
   - `Dashboard` `NextStepsWidget` → horizontal stepper + "Next:" CTA panel (6 steps)
2. Visual primitives reused across all three:
   - State circle: 24–28px diameter, 2px border, color tokens — green `#10b981` (done), dark green `#1a5d3d` (active), muted `var(--border-primary)` (upcoming).
   - Connector line: 2px height, runs at the circle's vertical centre, green if predecessor is done, muted otherwise.
   - Subtitle: per-step generic hint OR live user-entered summary (e.g. `Acme Corp — SME · India` once Step 1 has data).
3. Active row gets a green-tinted background `rgba(26, 93, 61, 0.06)` and bold label.
4. Completed rows are clickable to back-navigate; upcoming rows are non-interactive.
5. Narrow viewports MUST handle 6-column layouts via `overflowX: auto` with `minWidth: 720–840px` so the stepper scrolls horizontally rather than stacking.
6. Active step CTA goes inline (per-row) for 3-step wizards, OR in a dedicated "Next:" panel below the stepper for 6-step roadmaps with sparse activity.

**Reference:** AurexV4 commits `39b62a0` (wizard + WelcomeJourney horizontal), `7a0e6dd` (NextStepsWidget horizontal), May 4, 2026.

---

## ADM-086 — Per-Repo Operational Profile in `docs/<Project>.md` + Slim `CLAUDE.md` (#MANDATORY — May 5, 2026)

**Rule:** Each Aurigraph monorepo **MAY NOT** carry a long copy of the full ADM registry in root `CLAUDE.md`. Instead:

1. **`CLAUDE.md`** at the repo root is a **pointer stub** only—read order, 3–6 non-negotiables, and links to global + project docs.
2. **Operational profile** (topology, layout, project-specific commands, Jira project keys, coverage targets, scripts) lives in **`docs/<Project>.md`** (e.g. AurexV4 → **`docs/AurexV4.md`** in `Aurigraph-DLT-Corp/Aurex-V4`). Name the file after the product or repo's primary public name.
3. **ADM remains canonical** for numbered decisions—do not duplicate the ADM table in the project profile; **reference ADM IDs** and the kgraph.

**Why:** Duplicated ADM excerpts in every repo drift from `~/.claude/ADM.md`, inflate token cost, and contradict **kgraph-first** (ADM-076). Aurigraph DLT-family repos already moved to slim `CLAUDE.md` + dedicated profile docs; AurexV4 aligns May 5, 2026.

**Behaviour contract:**

1. Agents and humans read **`~/.claude/CLAUDE.md`**, **`~/.claude/ADM.md`**, and the kgraph before deep-diving into a repo's `docs/<Project>.md`.
2. Project profiles **MUST** state the deploy mandate (ADM-068 / `j4c-deployment-agent`) and **MUST NOT** relitigate global ADM text—**link or cite ADM IDs** only.
3. Global **`~/.claude/CLAUDE.md`** "Per-project supplements" table **MUST** point at `docs/<Project>.md` where that profile exists, not at a bloated `CLAUDE.md`.

**Reference:** AurexV4 consolidation—root `CLAUDE.md` slimmed; full operational detail in `docs/AurexV4.md` (commit stream May 5, 2026).

---

## ADM-087 — Healthcare CCAA Runs Its Own In-Stack Ollama (Partial Carve-Out from ADM-067) (#MANDATORY — May 5, 2026 — USER MANDATED)

**Status:** Applied (2026-05-05). **Amends:** ADM-067 (J4C llm-gateway shared-gateway mandate) for the healthcare project specifically. **Pairs with:** ADM-066 (Healthcare CCAA isolation), ADM-067-A (DLT edge nginx-gateway).

**Rule:** Healthcare CCAA's LLM calls (currently only `backend/app/ecw/cds/gemma_extract.py` / `build_kg` ingest, with future scope for `/v1/nlp/parse` + `/v1/voice/transcribe` if reactivated) target a **stack-local Ollama** running `gemma4:e4b` on the same DLT host as the healthcare-api, healthcare-db, and healthcare-web containers (compose service `healthcare-llm`, private bridge network `healthcare-internal`, no public port). The shared `https://j4c.aurigraph.io/llm-gateway` is retained as a fallback target via env override (`LLM_GATEWAY_BASE_URL`, `LLM_GATEWAY_KEY`) but is no longer the primary path.

**Why this carves out from ADM-067:** ADM-067's gateway hit two operational walls for healthcare's batch-ingest workload — Anthropic-fallback billing exhaustion (gemma3 primary times out under long clinical pages, falls through to Claude Haiku, burns project credits) and gemma3:4b inference timeouts on the shared box. Healthcare's ingest is **offline / non-interactive** (`build_kg` CLI), so the J4C gateway's hot-path fallback economics don't fit the workload. A dedicated `gemma4:e4b` on healthcare's own host (78 GB RAM, 10-core Skylake CPU, no GPU — confirmed adequate at ~5 GB resident, ~1-2 GB working set per AAT-4) keeps ingest local, predictable, and decoupled from cross-project contention. The OpenAI-compat shape is preserved (`ll_gateway` adapter unchanged), so a re-pivot to ADM-067 is one env-flip away — no caller code references the model name or transport.

**Scope of carve-out:** **Healthcare only.** All other Aurigraph projects (Battua, Provenews, HCE2, AWD, V12-DLT, Aurex, J4C itself) remain on ADM-067's shared gateway. This is **not** a precedent for per-project LLM hosts at fleet scale; it's a project-level escape hatch for a workload mismatch.

**Hardening (per AAT-1/3/4 reviews, deployed 2026-05-05):**

1. Image pinned: `ollama/ollama:0.23.0` + `pull_policy: missing` (no version drift; no on-disk-format risk on the named volume `healthcare-llm-models`).
2. Resource caps: `memory: 16G / cpus: 8.0` limit, `6G / 4.0` reservation. Protects co-resident Postgres from OOM-killer collateral if a long prompt runs the KV cache up.
3. Healthcheck greps for `gemma4:e4b` (not just daemon liveness) with `start_period: 600s` to tolerate the first-pull window on a cold volume.
4. Private bridge network `healthcare-internal` — Ollama has no auth on `/api/*`, so isolation from V12 / J4C / other tenants on the host is the security boundary. `internal: false` accepted because Ollama needs egress for `ollama pull`.
5. CPU tuning: `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, `OLLAMA_KEEP_ALIVE=30m`, `OLLAMA_NUM_THREADS=8`, `OMP_NUM_THREADS=8`, `OLLAMA_FLASH_ATTENTION=1`.
6. `LL_GATEWAY_TIMEOUT_SEC=240` — empirically validated against 180s timeout on cold-start + ~3K-char clinical-page extraction.
7. HC-79 structured-logging on every `gemma_extract` failure path so auth / network / timeout / shape failures are distinguishable on the first run, not after a corpus pass.

**Rollback:** `git revert` the docker-compose Ollama additions + `scripts/deploy-dlt.sh` pull step, then restore `LLM_GATEWAY_BASE_URL` / `LLM_GATEWAY_MODEL` lines in `/home/subbu/healthcare-dlt/.env`. The `healthcare-llm-models` volume can be retained (idle ~10 GB) for fast re-enable. Rollback is < 5 min and has no schema or data implications.

**Open follow-ups (not blocking):**

- Replace tag-pin with digest-pin (`gemma4:e4b@sha256:...`) for HIPAA-grade audit trail (per-ingest weight provenance in `persistence.py`).
- Tighten healthcheck to a small `/api/show` POST once shipping non-CDS LLM-dependent request paths.
- Reactivate `internal: true` on `healthcare-internal` once `ollama pull` is moved to a sidecar / pre-baked layer.

**Reference:** healthcare repo commits May 5, 2026 — `c804510` (initial Ollama service), `5205964` (timeout intermediate fix), AAT hardening rollout commit (this entry).

---

## ADM-088 — Healthcare SPA Rebuild MUST Set `VITE_BASE=/healthcare/` and Deploy to `/usr/share/nginx/html/healthcare/` (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-081 (SPA `index.html` no-cache headers), ADM-073 (image-drift detection in deploy verify). **Triggered by:** Repeat deploy-recipe failures observed in deploys 18 (`48887a4`, LiteraturePanel) and 19 (`5026e8a`, StatisticsPanel + DrugMonographPanel) where the agent's first build attempt left asset paths at `/assets/...` instead of `/healthcare/assets/...`, requiring an immediate corrective rebuild.

**Rule:** Every incremental SPA rebuild for the healthcare repo MUST run with `VITE_BASE=/healthcare/ npm run build` (or set `base: '/healthcare/'` in `vite.config.ts`, but env-injection is the canonical path so the same `dist/` is reusable in dev and prod). The `docker cp` target in the web container is `/usr/share/nginx/html/healthcare/`, NOT the nginx root `/usr/share/nginx/html/`. Both rules are non-negotiable: the SPA loads under the `/healthcare/` URL prefix on `dlt.aurigraph.io` (per the V12 / multi-tenant nginx layout that ADM-067-A established), so any asset path that doesn't carry `/healthcare/` resolves against the wrong root and 404s the entire bundle.

**Why this is a recurring failure mode:** the canonical `vite build` output drops everything at root-relative `/assets/index-{hash}.js`, which is correct for a SPA served at the origin root but wrong for healthcare which is path-prefixed. The asymmetry between bare `npm run build` (works in local dev when Vite serves at `/`) and the prod requirement is invisible until the bundle is served and a browser hits `/assets/index-{hash}.js` — at which point the V12 marketing site (which OWNS the origin root) returns its own HTML or a 404, the SPA never hydrates, and the user sees an empty `#root` div. The `docker cp` target asymmetry compounds the problem: even with the right `VITE_BASE`, copying to nginx root puts the new files alongside the V12 marketing site files rather than under the healthcare subdir nginx is configured to serve.

**Required deploy recipe (deploy-script-canonical):**

```bash
# 1. Local build with VITE_BASE injected
VITE_BASE=/healthcare/ npm --prefix web run build

# 2. Stage to remote /tmp
scp -P 2244 -r web/dist/. subbu@dlt.aurigraph.io:/tmp/hc-dist-staging/

# 3. Copy into the WEB container's healthcare subdir (NOT nginx root)
ssh -p 2244 subbu@dlt.aurigraph.io \
  "docker cp /tmp/hc-dist-staging/. dlt-healthcare-web:/usr/share/nginx/html/healthcare/"

# 4. Reload nginx (no container restart needed)
ssh -p 2244 subbu@dlt.aurigraph.io \
  "docker exec dlt-healthcare-web nginx -s reload"

# 5. Verify VITE_BASE prefix is correct in the served index.html
curl -fsS https://dlt.aurigraph.io/healthcare/ | grep 'src="/healthcare/assets/'
```

The `j4c-deployment-agent` MUST follow this recipe verbatim for any healthcare SPA-only deploy. Skipping step 5's verification has been the trigger for both deploy-18 and deploy-19's rework.

**Scope of mandate:** Healthcare project only. Other Aurigraph projects either (a) serve at the origin root (no prefix needed — Aurigraph V12, J4C portal in their own roots), or (b) have their own per-project recipe in their respective `docs/<Project>.md` operational profile.

**Verification:** ADM-081's `Cache-Control: no-cache, must-revalidate` on `index.html` is what prevents browsers from holding the wrong-prefix bundle after a corrective redeploy. Without ADM-081, even a correct rebuild would not visibly heal until the browser cache expired.

**Reference:** healthcare repo deploy verifications `48887a4` + `5026e8a` (May 8, 2026); j4c-deployment-agent retry transcripts both runs.

---

## ADM-089 — Docker-exec'd Processes Survive `tmux kill-session`; Use `os.kill` from Inside the Container (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-068 (j4c-deployment-agent as the only sanctioned deploy path), ADM-087 (Healthcare CCAA in-stack Ollama). **Triggered by:** A 4-worker `ralph-loop-build-kg.sh` run on dlt that hit Gemma JSON-decode errors and was meant to be killed and relaunched at `--num-workers 2`. After `tmux kill-session -t build-kg`, the new `--num-workers 2` ralph-loop spawned 2 fresh workers, but the prior 4 workers (`/proc/347, 353, 359, 360`) remained alive inside `dlt-healthcare-api`, producing 6 concurrent workers contending for a 2-parallel Ollama queue.

**Rule:** When the ingest-orchestrator pattern uses `tmux` panes that run `docker exec dlt-healthcare-api python -m app.ecw.cds.build_kg ...`, killing the tmux session does NOT kill the python processes inside the container. The tmux pane's stdin/stdout pipe is severed, but the docker-exec'd process is reparented to the container's PID 1 (or kept alive if it traps SIGTERM, which `python -u` does for in-flight HTTP calls to Ollama). Operationally, this means **every ingest restart MUST be preceded by an in-container PID enumeration + targeted kill of any stale build_kg processes**.

**The required pre-launch hygiene routine:**

```bash
# 1. Enumerate live build_kg processes inside the API container.
#    Note: `ps` is NOT installed in the dlt-healthcare-api image (Python slim);
#    enumerate via /proc/[0-9]*/cmdline.
ssh -p 2244 subbu@dlt.aurigraph.io 'docker exec dlt-healthcare-api sh -c \
  "for p in /proc/[0-9]*; do c=\$(cat \$p/cmdline 2>/dev/null | tr -d \"\\0\"); \
   case \$c in *build_kg*) echo \"\$p: \$c\";; esac; done"'

# 2. If stale workers exist, kill them via python's os.kill.
#    (kill / killall / pkill are also NOT installed in the slim base image.)
ssh -p 2244 subbu@dlt.aurigraph.io 'docker exec dlt-healthcare-api python -c "
import os, signal
for pid in (PID1, PID2, ...):
    try: os.kill(pid, signal.SIGKILL); print(f\"killed {pid}\")
    except ProcessLookupError: print(f\"{pid} already gone\")
"'

# 3. Verify only intended workers remain. Re-run step 1.

# 4. THEN launch the new ralph-loop session.
```

**Why this matters operationally:** without this hygiene, a 4-worker → 2-worker reduction (or any `OLLAMA_NUM_PARALLEL` change accompanied by a tmux kill) silently produces an over-saturated queue. The prior 4 workers hammer the new Ollama configuration while the new 2 workers also queue requests; effective parallelism becomes 6, far above the model's stable ceiling, and the json-decode-error / empty-body / gateway-timeout cycle that prompted the kill resumes — falsely attributing the cause to the new worker count.

**Why standard tools are absent in the API image:** the healthcare-api image is built on `python:3.14-slim`, which omits `ps`, `kill`, `pgrep`, `killall`, and most of `procps-ng`. This is a security/footprint posture (no shell tooling on the production attack surface) and it's not going to change. Operations against worker processes must therefore use either `/proc` enumeration OR `python -c "import os..."` invocations — both of which work because the python interpreter is the one tool guaranteed present.

**Codification path:** the `scripts/ralph-loop-build-kg.sh` launcher SHOULD gain a Phase 0 step that enumerates and kills any stale build_kg processes before the OLLAMA_NUM_PARALLEL update + tmux relaunch. Until that lands, the j4c-deployment-agent and any human operator MUST run the sequence above by hand on every relaunch.

**Reference:** healthcare repo session 587b5a4b May 8, 2026 — observed when 6 workers (4 zombie + 2 new) appeared in `/proc` listing after a `tmux kill-session` + `ralph-loop 2` cycle; remediated via `os.kill` from python.

---

## ADM-090 — Backend Hot-Patch via `docker cp` Preserves Long-Running Workers in the Same Container (#RECOMMENDED — May 8, 2026)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-074 (source bind-mount for incremental backend deploys; this is the no-bind-mount alternative), ADM-068 (j4c-deployment-agent), ADM-073 (image-drift detection). **Triggered by:** A 6-deploy run during this session (deploys 14, 15, 16, 17, 20) where backend Python changes had to land while build_kg ingest workers were ACTIVELY running inside `dlt-healthcare-api`. A normal `docker compose restart dlt-healthcare-api` would kill the workers and lose hours of ingest progress.

**Rule:** When backend changes are pure-Python edits (no `requirements*.txt`, no `Dockerfile*`, no migration, no compose change), the j4c-deployment-agent MAY use `docker cp` to copy modified `.py` files into the running container WITHOUT restarting the container. Routes added by the new code DO NOT activate immediately — uvicorn is run without `--reload` in healthcare prod, so the import graph is frozen at process start. The new routes are "staged" and become live at the next `docker restart dlt-healthcare-api`. This pattern is intentional: it lets the deploy land safely while a long-running side-process (build_kg ingest) keeps progressing, and defers the route activation to a coordinated cutover.

**Required protocol for staged deploys:**

1. **Diff classification gate** — proceed only when `git diff` shows ONLY pure-Python changes inside `backend/app/`. ANY change to `requirements*.txt`, `Dockerfile*`, `docker-compose*.yml`, or `backend/migrations/` rules out this pattern and forces a full restart.
2. **Hot-patch** — `scp` modified `.py` files to remote `/tmp/`, then `docker cp` into the matching path under `/app/app/` inside the container. Test files go to `/app/tests/`.
3. **In-container pytest** — run the new test file from inside the container so DB connectivity and config-from-env are real. Expect 80–95% pass rate; 1–4 route tests will fail with 404 because uvicorn hasn't reloaded the URL routing table. These failures are EXPECTED and should be filed as `HC-BKG-TE-{leaf}` JIRA tickets in pre-authorized state, NOT as regressions.
4. **Document staging** — the deploy verdict is `PARTIAL` (not `PASS`), and `session.md` MUST list every staged route by URL. The `todo.md` MUST track the "pending coordinated API restart" obligation.
5. **Coordinated cutover** — at the end of the long-running side-process (or when the operator decides to interrupt), a single `docker restart dlt-healthcare-api` activates ALL staged routes simultaneously. This is the ONLY supported activation path; piecemeal restart-per-route is not.

**Why this is RECOMMENDED, not MANDATORY:** the standard ADM-074 source bind-mount pattern (where `/app/app` is bind-mounted to the host repo and uvicorn auto-reloads on file change) is preferable for normal day-to-day backend work because routes activate immediately. The hot-patch pattern in this ADM is an explicit fallback for the specific case where (a) the deploy host doesn't have a clean source bind-mount, AND (b) a long-running worker inside the API container would lose state on restart. Build_kg ingest is the canonical instance; future similar workers (e.g., RAG index builds, KGE training jobs if/when implemented) will follow the same pattern.

**Operational ceilings:** at most 5 staged routes should accumulate before forcing a coordinated cutover. Beyond that, the divergence between live behavior and what the test suite asserts grows untenable, and the JIRA backlog of `HC-BKG-TE-*` "expected pre-restart 404" tickets becomes noise. The session that triggered this ADM had exactly 5 staged routes (`/v1/cds/literature`, `/v1/cds/statistics`, `/v1/cds/drugs/{id}/pd-profile`, `/v1/cds/drugs/{id}/toxicity-profile`, `/v1/cds/kg/graph`) at the recommended-cutover threshold.

**Reference:** healthcare repo deploys 14 (`7cdee68`), 15 (`f7c3c3a`), 16 (`a188b58`), 17 (`af42c67`), 20 (`016256d`) — all `PARTIAL`-verdict staged-route deploys (May 8, 2026). HC-82 / HC-83 / HC-84 are the canonical "expected pre-restart 404" JIRA tickets generated by this pattern.

---

## ADM-091 — OpenBao Production Hardening: `-dev` Mode Forbidden; File-Backed + Operator-Held Unseal Keys Mandatory (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-052 (OpenBao KMS introduction), ADM-068 (deploy mandate).

**Rule:** No production OpenBao instance MAY run with the `-dev` flag (or `dev_mode` config). All OpenBao deployments MUST use file storage (`storage "file" { path = ... }`) or an equivalent persistent backend, with explicit `bao operator init` and Shamir 3-of-5 unseal. Unseal keys + root token MUST be persisted to `/root/openbao-unseal-keys.txt` mode 600 root:root on the host (operator-held; no automated key escrow yet). A systemd `${PROJECT}-bao-unseal.service` + `.timer` (1-min cadence, `OnBootSec=2min`) MUST auto-unseal on container restart. Client code that authenticates via AppRole MUST retry login with exponential backoff (recommended 5 attempts at 5s/10s/20s/40s/60s = ~135s total) so a host reboot does not leave the client in degraded fallback-only mode for the entire session.

**Why:** The J4C OpenBao instance was running with `-dev` (in-memory) for weeks; every container restart silently wiped all secrets. The compose carried a `volumes: openbao-file:/openbao/file` mount that the `-dev` flag actively ignores — the volume accumulated stale data from a previous file-backed init that nobody could unseal. Forensics on 2026-05-08 ("OpenBao is blank") found 392K of orphaned data with no recoverable unseal keys; the only path forward was a fresh init + re-population of all secrets. Without a documented retry-with-backoff in clients, the host-reboot startup race (openbao starts sealed → client tries AppRole login → fails immediately → "OpenBao client unavailable, falling back to env vars" cached for the session) silently degraded production for a 2-min window after every reboot.

**Behaviour contract:**

1. **Compose:** `command: ["server", "-config=/openbao/config/openbao.hcl"]` — never `-dev`. The HCL specifies `storage "file"`, `disable_mlock = true` (Docker volume incompatibility), TLS disabled at OpenBao layer (NGINX terminates), `cap_add: IPC_LOCK`. The bind-mount path is `<deploy>/openbao/openbao.hcl:/openbao/config/openbao.hcl:ro`.
2. **No host port binding** for OpenBao. Reachability is via Docker DNS on the project's network (e.g. `j4c-network`) and via the project's outer NGINX path-prefix proxy (e.g. `https://<host>/openbao/`). Operator API access is `docker exec <container> bao ...`.
3. **Unseal keys file:** `/root/openbao-unseal-keys.txt` mode 600 owner root:root. Format: leading `#` comment lines + `bao operator init -format=json` JSON body (5-share, 3-threshold). The unseal script `/usr/local/sbin/${PROJECT}-bao-unseal.sh` MUST tolerate `bao status` exit-code 2 (sealed) and use `set -uo pipefail` (NOT `set -e`).
4. **Healthcheck:** `/v1/sys/health` (default) returns 503 when sealed → docker healthcheck flips to unhealthy. Watchdogs MUST NOT auto-recreate openbao on unhealthy during the post-restart unseal window — the host-side timer is the source of truth for recovery.
5. **AppRole client retry:** Code that constructs an OpenBao client at module load / app startup MUST wrap the AppRole login in a retry loop. Reference impl in J4C: `j4c-api/app/services/openbao_service.py` (5 attempts, exponential backoff 5/10/20/40/60s). Single-shot AppRole login is forbidden in any production path.
6. **Per-host scope:** Each Aurigraph host that runs an OpenBao instance manages its own keys file. There is no fleet-wide shared root. Cross-host KMS federation is NOT in scope yet.

**Reference:** J4C commits `043acf428` (file-backed migration P0), `663d3930c` (drop public 8200 binding), `7753130e7` (AppRole retry-with-backoff), 2026-05-08. Forensics: J4C-214 + JIRA comment 35577.

---

## ADM-092 — Per-Project Provisioning of OpenBao + Harbor Goes Through the J4C Orchestrator; LLM-Gateway Is NOT a Per-Project Adapter (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-067 (J4C llm-gateway shared mandate), ADM-068 (deploy mandate), ADM-091 (OpenBao production hardening).

**Rule:** Every Aurigraph project that needs an OpenBao secrets namespace OR a Harbor registry project + robot account MUST be provisioned via the J4C portal's `IntegrationOrchestrator` (`POST /api/v3/integrations/projects` with `services: ["openbao", "harbor"]`). Adapter implementations live in `j4c-portal/j4c-api/app/services/integrations/{openbao,harbor}.py` and are the canonical owner of:

- per-project OpenBao policy `j4c-{project_id}` granting CRUD on `kv/data/aurigraph/{project_id}/*`
- per-project AppRole `{project_id}` bound to that policy
- per-project KV namespace at `kv/aurigraph/{project_id}/...`
- per-project Harbor project `{project_id}` (lowercase, hyphenated; underscores forbidden)
- per-project Harbor robot scoped to that project, name `{project_id}-ci`

`provision()` MUST be idempotent (re-running rotates the robot token + regenerates AppRole secret_id; old creds remain valid until manually revoked). `rotate()` and `deprovision()` MUST exist and be callable from the API. Bootstrap secrets are returned ONCE in `ProvisionResult.secrets_once` and are NOT persisted in the j4c-portal database — a re-fetch requires `POST /api/v3/integrations/projects/{id}/rotate/{service}`.

The **LLM Gateway is internal J4C infrastructure**, NOT a per-project provisionable backend. It MUST NOT appear in `_DEFAULT_ORDER` or `_adapters()` in `orchestrator.py`. Projects consume the LLM Gateway as clients with a shared key (per ADM-067), not as tenants of a J4C-owned per-project resource.

**Why:** Before this work, OpenBao + Harbor admin creds were a single shared admin pair (`admin/HarborJ4C@2026`) bootstrapped manually per project. Each project had network reach to all other projects' images and secrets; revocation required out-of-band edits with no audit trail. The May 8, 2026 work onboarded 7 Aurigraph projects (j4c-portal, aurigraph-v12, aurex-v4, aurigraph-website, hce2, battua, provenews) with project-scoped AppRoles + project-scoped Harbor robots in a single orchestrator pass, recording metadata in j4c-portal and surfacing one-shot bootstrap creds via `secrets_once`. Mixing llm-gateway into the same adapter set was a category error — the gateway is a service projects CALL, not a service the J4C orchestrator manages tenancy of — and was removed in the same session (commit `c235b4b3f`).

**Behaviour contract:**

1. **No direct admin Basic Auth pushes** for new project onboarding — operators MUST go through `POST /api/v3/integrations/projects`.
2. **Idempotency:** Re-provisioning an existing project rotates the robot token and regenerates the AppRole secret_id. The orchestrator reuses the existing Harbor project if present and only deletes it on rollback if `metadata.project_existed == false`.
3. **Bootstrap hand-off:** Bootstrap secrets land at `/root/onboarding-secrets-<ts>/{project}__{service}.json` mode 600 + `{project}__handoff.md` mode 600 + `README.md` on the j4c host. Per-target distribution to project deploy `.env` files uses an idempotent guard: marker line `# === Aurigraph onboarding env block` skips re-application. After all projects pick up creds, the `/root/onboarding-secrets-<ts>/` directory MUST be deleted.
4. **Naming:** OpenBao policy `j4c-{project_id}`, AppRole `{project_id}` (no `j4c-` prefix on the role), KV path `kv/aurigraph/{project_id}/...`. Harbor project `{project_id}` (lowercase, hyphens only), robot logical name `{project_id}-ci` (Harbor automatically prefixes `robot$<project>+`).
5. **Per-project secret-loader:** Each project's runtime SHOULD migrate from plain `.env` reads to OpenBao reads at `kv/aurigraph/{project_id}/*` using the AppRole creds from the bootstrap. The mirror reference impl is J4C's `app/services/openbao_service.py`. This is project-owner-driven work, not part of the orchestrator's responsibility.
6. **CI registry login:** Each project's CI/CD MUST switch from any shared `admin/HarborJ4C@2026` reference to the project's own `robot$<project>+<project>-ci/<robot_token>` for `docker push` to harbor.j4c.aurigraph.io. Tracked per-project, not in J4C.
7. **No code in J4C orchestrator references llm_gateway as an adapter.** The standalone `/llm-gateway` operator console (`LlmGatewayPage.tsx`) and the secret-loader's gateway client integration are explicitly NOT covered by this rule — those are gateway-level admin and gateway-as-client concerns, separate from per-project adapter registration.

**Reference:** J4C commits `c235b4b3f` (drop llm_gateway from adapter set), `ce824bf39` (real provision/rotate/deprovision for OpenBao + Harbor), 2026-05-08. Onboarding receipts: JIRA J4C-215 comments 35580 (bulk onboarding), 35581 (hand-off notes), 35582 (env distribution).

---

## ADM-093 — Harbor 2.x Admin API Integration: cookies={} Per Request, No `+` in Robot Names (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-092 (J4C orchestrator).

**Rule:** Any code that drives the Harbor 2.x admin API via Basic Auth (the J4C `HarborAdapter`, deploy scripts, ad-hoc operator tooling) MUST:

1. **Clear cookies before every mutating request.** Harbor's `/api/v2.0/*` endpoints set a session cookie on any GET; subsequent POST/PATCH/DELETE requests carrying that cookie trigger CSRF protection (HTTP 403, body `{"errors":[{"code":"FORBIDDEN","message":"CSRF token invalid"}]}`). Basic-auth-only requests are exempt from CSRF — clearing the cookie jar restores the basic-auth-only path. In `httpx.AsyncClient`, set `cookies={}` at construction AND call `client.cookies.clear()` immediately before every non-GET call. A new client per call is acceptable but slower.
2. **Robot names MUST NOT contain `+`.** Harbor's robot-create endpoint rejects `+` in the `name` field as illegal characters (`{"code":"BAD_REQUEST","message":"robot name is not in lower case or contains illegal characters"}`). Use `-` (hyphen) as the suffix separator. The convention `{project_id}-ci` is canonical for J4C-orchestrator-provisioned project robots. Harbor's response will return the full robot username as `robot$<project_name>+<base_name>` — the `robot$` prefix and the `+<project_name>` segment are added by Harbor server-side and are not under client control.
3. **Project names are lowercase, hyphenated.** Underscores rejected. Normalize project_id with `.lower().replace("_", "-")` before sending to Harbor.

**Why:** The May 8, 2026 implementation of `HarborAdapter.provision()` hit both 1 and 2 in immediate succession. CSRF was the first blocker — even with `cookies={}` set at client construction, httpx still accumulated cookies from each Set-Cookie response across the client's lifetime; only a per-request `cookies.clear()` actually keeps the basic-auth requests session-less. The `+` rejection blocked the original `{project}+ci` naming convention chosen to mirror typical Harbor docs. Both required source patches and a redeploy; documenting them as ADM prevents the same wall hits in any future Harbor admin tooling (operator runbooks, CI scripts, Battua/Provenews future provisioning).

**Behaviour contract:**

1. The reference impl is J4C `j4c-api/app/services/integrations/harbor.py` after commit `ce824bf39`. Search for `_NO_CSRF_HEADERS`, `cookies.clear()`, `_robot_basename`, `_normalize` for the patterns.
2. Operator scripts that call Harbor outside the J4C orchestrator (e.g. ad-hoc `docker exec j4c-api python3 ...`, manual cURL) MUST follow the same patterns or risk CSRF 403 on the second mutating call.
3. The empty `X-Harbor-CSRF-Token: ""` header is also set defensively; it is harmless without a session cookie and may help in edge cases where some Harbor middleware versions check for the header's presence regardless of cookie state.
4. If Harbor upgrades to a version where Basic Auth is no longer exempt from CSRF (not announced as of 2026-05-08), this ADM MUST be revisited and the orchestrator must obtain a real CSRF token via a paired session.

**Reference:** J4C commit `ce824bf39` (HarborAdapter real impl). Concrete failure traces: JIRA J4C-215 comment 35580.

---

---

## ADM-094 — Self-Hosted CI Runners MUST Regenerate Prisma Client Before Any tsc Step (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08, AurexV4 commit `27aa276`). **Pairs with:** ADM-073 (image-drift detection), ADM-098 (pre-deploy schema/env drift gates).

**Rule:** Every CI workflow job that runs against a self-hosted runner AND compiles TypeScript that imports from `@prisma/client` MUST invoke `pnpm --filter @aurex/database exec prisma generate` (or the project's equivalent) **after** `pnpm install --frozen-lockfile` and **before** any `tsc` / `pnpm typecheck` / `pnpm test` / `pnpm build` step.

**Why:** Self-hosted runners cache `node_modules` across runs. When `schema.prisma` adds a new model, the cached `node_modules/.pnpm/@prisma+client@*/client/default` is stale — `pnpm install --frozen-lockfile` does NOT trigger `prisma generate`, and the AurexV4 monorepo has no `postinstall` hook for it. Result: silent regression where every CI run after a schema change fails with `TS2305 Module '"@prisma/client"' has no exported member 'X'` for every newly-added model. Caught on 2026-05-08 — every CI run since the 2026-05-07 CAMM master-data tables landed had been failing at lint-typecheck for the same reason; the failure was misdiagnosed as a "stalled runner" until the actual error output was inspected.

**How to apply:** For every job in `.github/workflows/*.yml` that has `pnpm install` followed by anything that compiles TS, add the regenerate step in between. Affected jobs in AurexV4: `lint-typecheck`, `test`, `build`, `owasp-security`. The `deploy` job is exempt — it consumes pre-built artifacts.

**Verification:** After the change, lint-typecheck should succeed with no `TS2305` errors. Run id `25542842049` (commit `27aa276`) was the first green run; preceding `25542001563` (commit `74e53be`) had the symptom.

**Reference:** AurexV4 commit `27aa276` ("fix(ci): regenerate Prisma client before tsc steps").

---

## ADM-095 — Turbo `test` Tasks MUST Use `^build` (Upstream Workspace Build), Not `build` (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08, AurexV4 commits `48a2ca2` + `d2df323`). **Pairs with:** ADM-094 (CI cache hygiene).

**Rule:** In `turbo.json`, every task that runs cross-package code at runtime (`test`, `test:integration`, `test:e2e`, `test:owasp*`) MUST declare `"dependsOn": ["^build"]` so upstream workspace package builds run before the task. `"dependsOn": ["build"]` (without `^`) only builds the SAME package; it does not walk the workspace dependency graph. Additionally, every test package that imports from another workspace package — even via relative-path import (`'../../../apps/api/src/index.ts'`) — MUST declare that package in its own `package.json` `devDependencies` (`"@aurex/api": "workspace:*"` etc.), because turbo only follows declared edges.

**Why:** AurexV4's `tests/integration/src/api.test.ts` dynamic-imports `apps/api/src/index.ts` via relative path; `apps/api` declares `@aurigraph/dlt-sdk` as a workspace dep, and the SDK is a `tsc`-built package whose entrypoint is `dist/index.js`. With `dependsOn: ["build"]` and no declared workspace deps in the test package, turbo built nothing upstream, so vitest hit `Failed to resolve entry for package "@aurigraph/dlt-sdk". The package may have incorrect main/module/exports specified in its package.json` — misleading error pointing at the SDK rather than the missing graph edge. Found on 2026-05-08 after ADM-094 unblocked the lint-typecheck job and the test job ran for the first time in days.

**How to apply:** Audit every `turbo.json` for tasks whose `dependsOn` is `["build"]`; convert to `["^build"]` (or `["^build", "build"]` if the task also needs the same-package's build artifacts). Audit every test/e2e package's `package.json` for missing workspace devDeps that match its imports. The `lint` and `typecheck` tasks already follow this pattern correctly in most projects — copy their config.

**Reference:** AurexV4 commits `48a2ca2` (turbo `^build`) + `d2df323` (workspace deps for `@aurex/integration-tests`).

---

## ADM-096 — Vitest `hookTimeout` MUST Match `testTimeout` on Constrained CI Runners (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08, AurexV4 commit `0a36e1e`).

**Rule:** When a vitest setup does heavy work in `beforeAll`/`beforeEach` (cold-importing a full app graph via `tsx`, dynamic ESM resolution across many files, etc.), the `hookTimeout` config MUST be set explicitly to match `testTimeout`. Vitest's default `hookTimeout` is 10s regardless of how `testTimeout` is configured — they are independent knobs.

**Why:** AurexV4's integration-test `beforeAll` cold-imports `apps/api/src/index.ts` (the full Express app graph) through `tsx` on a 4-CPU self-hosted runner (j4c.aurigraph.io). That exceeded 10s repeatedly. The error surface — `Hook timed out in 10000ms` — does not name the timeout source; easy to misread as the app failing to boot rather than the harness's clock running out. Cost: ~30 min of debugging chasing the wrong tail before isolating the timeout type.

**How to apply:** Any `vitest.config.ts` with a non-trivial `beforeAll` that imports app source must set `hookTimeout: 60_000` (or a value that matches the slowest expected setup). Don't leave it implicit; the implicit default is a footgun that only fires on slow boxes.

**Reference:** AurexV4 commit `0a36e1e` (`tests/integration/vitest.config.ts`).

---

## ADM-097 — GHA `deploy` Jobs MUST Be Gated on `workflow_dispatch` Only (Strengthens ADM-068) (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08, AurexV4 commit `b137c72`). **Strengthens:** ADM-068 (`j4c-deployment-agent` is the only sanctioned deploy path).

**Rule:** Any `.github/workflows/*.yml` job that calls `deploy-to-remote.sh`, `deploy-dlt.sh`, or any other production-deploy script MUST be gated on `if: github.event_name == 'workflow_dispatch'` so it never fires automatically on push. Production deploys go through the `j4c-deployment-agent` subagent, which performs diff classification, the L0–L4 test cascade, JIRA bug logging on failure, session/todo updates, and 3-layer AutoHeal verification. A GHA job that runs the deploy script directly skips ALL of those.

**Why:** AurexV4's `ci.yml` had a `deploy` job with `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` — this had been dormant for weeks because the upstream lint/test/build jobs were failing for unrelated reasons (see ADM-094 / ADM-095 / ADM-096). Once those fixes landed and the upstream jobs went green, the deploy job was about to start auto-firing on every push to `main`, bypassing the agent's mandated cascade. Caught at commit `b137c72` and gated to `workflow_dispatch`. The script + checks remain wired up for emergency manual fires (where the operator opts in via the GitHub UI / `gh workflow run`), but auto-deploys are blocked.

**How to apply:** Audit every Aurigraph project's `.github/workflows/*.yml` for production-deploy jobs. Either delete them or gate to `workflow_dispatch`. In particular, watch for previously-dormant deploy jobs that re-activate when CI is fixed for unrelated reasons — a passing CI suite should NEVER trigger a production deploy without the agent.

**Reference:** AurexV4 commit `b137c72` (`fix(ci): owasp non-blocking + disable on-push deploy job`).

---

## ADM-098 — Deploy Scripts MUST Run Schema-Drift + Env-Drift Gates Before Image Build (#MANDATORY — May 8, 2026)

**Status:** Applied (2026-05-08, AurexV4 commits `de13ca2` schema gate + `fefe394` env gate). **Pairs with:** ADM-073 (image-drift detection), ADM-077 (env verification), ADM-094 (Prisma client regeneration).

**Rule:** `deploy-to-remote.sh` (or every project's equivalent) MUST run two pre-flight drift gates after the infrastructure-readiness check and before any image build:

1. **Schema drift gate (Gate 1.5):** `sha256sum` the local `packages/database/prisma/schema.prisma` against the running API container's copy (`docker exec ${API_CONTAINER} sha256sum /app/packages/database/prisma/schema.prisma`). If they differ and `RUN_DB_PUSH` is not set to `1`, abort with the explicit message naming both hashes and the required flag.

2. **Env drift gate (Gate 1.4):** Extract `^[A-Z_][A-Z0-9_]*=` keys from the checked-in canonical `infrastructure/docker/.env.example` and compare against the on-host `.env` keys (read-only — values stay private; just `grep` the keyset). Missing keys abort with the exact list. `SKIP_ENV_DRIFT=1` is the only escape hatch.

The canonical `.env.example` MUST be a strict superset of every key the on-host `.env` uses; new env vars are added to the example first, then propagated to the host.

**Why:** Two production incidents on consecutive days demonstrated the silent-failure mode:

- 2026-05-07: AV4-528 — CAMM master-data tables (`MaturityFramework`, `AssessmentQuestion`, etc.) shipped without `RUN_DB_PUSH=1`. Image rolled cleanly, runtime then crashed on missing columns. Root cause: the deploy agent had to manually set the flag from the brief — error-prone manual step, no enforcement.
- 2026-05-08: AV4-530 — On-host `/home/subbu/aurexv4-src/infrastructure/docker/.env` had stale DB creds and was missing keys the repo template didn't cover. Configuration drifted silently.

Both incidents bypass the existing image-drift detection (ADM-073) because they're database/env state, not image hash. Explicit pre-deploy comparison against on-host state forces operator attention; both gates abort BEFORE the long image build, so failure cost is seconds.

**How to apply:** Every Aurigraph project with a Prisma schema + on-host `.env` adopts both gates. Steps for each project:

- Make `infrastructure/docker/.env.example` (or equivalent) the canonical key list.
- Add Gate 1.4 (env-drift) and Gate 1.5 (schema-drift) to the deploy script BEFORE web-asset build / image rebuild.
- Document the `RUN_DB_PUSH=1` and `SKIP_ENV_DRIFT=1` opt-outs in the script's header comment.
- Have `j4c-deployment-agent` log a JIRA bug if either gate aborts on a deploy that the brief said should succeed.

**Reference:** AurexV4 commits `de13ca2` (schema gate, closes AV4-528) + `fefe394` (env gate + canonical `.env.example`, closes AV4-530).

---

## ADM-099 — `OLLAMA_NUM_PARALLEL` for `gemma4:e4b` on Healthcare DLT Host MUST NOT Exceed 2 (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08). **Amends:** ADM-087 step 5 (which pinned `OLLAMA_NUM_PARALLEL=1` for the in-stack Ollama; this ADM lifts the ceiling to 2 for batch-ingest workloads but explicitly forbids 4). **Pairs with:** ADM-068 (j4c-deployment-agent), ADM-089 (docker-exec process survival).

**Rule:** When `scripts/ralph-loop-build-kg.sh N` is launched on the healthcare dlt host (`subbu@dlt.aurigraph.io`), `N` MUST be 1 or 2 — never 3 or 4. The launcher script writes `OLLAMA_NUM_PARALLEL=N` into `/home/subbu/healthcare-dlt/.env` and recreates `dlt-healthcare-llm` with that concurrency, which directly maps to gemma4:e4b's KV-cache parallelism. Above 2, the model produces structurally invalid JSON (mid-array truncation, `empty_body` responses) under load on this hardware (8-core Skylake CPU, no GPU, 16GB memory cap per ADM-087).

**Empirical findings driving the ceiling:**

- `N=4` (initial 4-worker run): all 4 workers contend for a 4-way Ollama queue, but the underlying CPU can really only saturate ~2 streams before per-request latency blows past `LL_GATEWAY_TIMEOUT_SEC`. Symptoms after ~80 minutes of runtime: `gemma_extract gateway_error: timed out (page_chars=3670)`, `gemma_extract json_decode_error from _raw: Expecting ',' delimiter at line 226 column 3 (char 4984)` (truncated JSON arrays mid-output), `gemma_extract empty_body: response had no extractable text`. Two of four workers also went silent for 60+ minutes — they were blocked on Ollama responses that never arrived because the model's effective concurrency had collapsed.
- `N=2` (relaunched run): substantially healthier — both workers committed nodes/edges steadily, LLM CPU sustained at 700–760% (8 threads pegged, 2 streams). Some `json_decode_error` events still occur but at a much lower rate, and workers don't hang.
- `N=1` (ADM-087 default): safest baseline; halves throughput but eliminates the contention entirely. Used when a single-PDF ingest is acceptable (rare).

**The model file is the constraint, not the tunable:** `gemma4:e4b` is ~9 GB resident with a single-stream KV cache that scales linearly with parallelism. With OLLAMA_NUM_PARALLEL=4, the working-set memory pressure plus GC pauses during cache eviction exceed what an 8-core CPU can mask — context generation completes but token streaming stalls past the 240–2000s gateway window.

**Hardware-class generalization:** this 2-stream ceiling is bound to the gemma4:e4b model + 8-core Skylake + 16GB cap combination. A different model (e.g., gemma3:1b — smaller KV footprint) or different hardware (GPU, more cores, more memory) would shift the ceiling. Operators changing ANY of those three should re-empirically-validate the ceiling before bumping `N`. The ralph-loop launcher SHOULD gain a guardrail that refuses `N > 2` unless an explicit `RALPH_LOOP_OVERRIDE_NUM_PARALLEL=1` env flag is set.

**Reference:** healthcare repo session 587b5a4b May 8, 2026 — observed initial 4-worker run (08:45 UTC launch, 6h+ chewing without new sources) → kill-and-relaunch at 2 workers (different commit but same fixture). The 4-worker run produced ZERO net-new sources beyond the 7 baseline; the 2-worker run also struggled to advance past baseline due to ADM-100's processing-order bug.

---

## ADM-100 — `build_kg` Corpus Ordering MUST Process Uningested PDFs First, Not Alphabetical (#MANDATORY — May 8, 2026 — USER MANDATED)

**Status:** Applied (2026-05-08). **Pairs with:** ADM-099 (OLLAMA_NUM_PARALLEL ceiling), ADM-089 (process survival on tmux kill), ADM-090 (staged-route deploy pattern).

**Rule:** `app.ecw.cds.build_kg` MUST sort its PDF processing queue so that **PDFs with no existing nodes/edges in the live KG are processed before PDFs that already have any KG presence**. The current implementation iterates `os.listdir(src)` in directory order (which on most filesystems is insertion order or alphabetical) and re-extracts every assigned PDF on every run, with idempotent upserts no-op'ing the already-ingested content. On a multi-hour ingest, this means the first PDF a worker is assigned dominates wallclock — and if the alphabetically-first PDFs happen to all be already-ingested, **the new PDFs never get processed in any reasonable time window**.

**Implementation contract:** before a worker enters its hash-split processing loop, it MUST query `kg.stats().sources` (or equivalent), partition its assigned PDF set into `(new, already_ingested)` buckets, and process the `new` bucket FIRST. The `already_ingested` bucket is processed second only if the operator explicitly opts in (e.g. `--reextract-existing` flag) — otherwise it's skipped entirely. Skipping is safe because `upsert_node` and `upsert_edge` are idempotent with `ON CONFLICT DO UPDATE` / `ON CONFLICT DO NOTHING`, so re-extraction adds value only when the LLM happens to find a fresh evidence quote on a re-pass; that's a marginal gain that should never block new-source ingest.

**Why this is a real bug, not a UX nit:** in the May 8 healthcare ingest session, the 17 net-new PDFs were assigned across the 4-worker (then 2-worker) hash split such that EVERY worker's alphabetically-first PDF was a baseline PDF (already-ingested). With each "first PDF" taking 4+ hours of CPU-only Gemma calls, no worker reached its assigned new PDFs in the entire 6-hour observation window. Net new-source progress: **zero**, despite ~700% sustained LLM CPU. The fix is small (a `kg.stats().sources` membership check + sort), but the operational impact is large (24-PDF ingest goes from ~30+ hours to ~3–6 hours).

**JIRA:** filed as `HC-KG-INGEST-ORDERING` (HIGH). The fix should land alongside the next healthcare backend slice. Until it lands, every operator-launched ralph-loop SHOULD pre-stage PDFs by manually moving the uningested files to filenames that sort before the baseline ones (e.g., `00_` prefix). That's a band-aid; the real fix is the code change.

**Validation criteria for the fix:** after deployment, a fresh ralph-loop run on the same 24-PDF corpus + 7-baseline-already-ingested KG state MUST commit at least 1 new `source_doc` within the first 30 minutes of runtime. Failing that benchmark means the partition logic is wrong.

**Reference:** healthcare repo session 587b5a4b May 8, 2026 — observed across deploys 14 → 21, KG state at session terminal: `sources=9/24` (only 2 net-new beyond baseline-7 in 6+ hours of ingest), worker logs frozen on alphabetical-first baseline PDFs.

---

## ADM-101 — Docs-Only Diffs to Canonical Reference Files (`ADM.md`, `INS.md`, kgraph seeds) MUST Auto-Pull on Read-Side Hosts; Carve-Out from ADM-097 (#MANDATORY — May 9, 2026 — USER MANDATED)

**Status:** Applied (2026-05-09). **Pairs with:** ADM-076 (kgraph-first), ADM-076-A (kgraph file watcher), ADM-097 (GHA deploy gated on workflow_dispatch). **Carves out from:** ADM-097 (only for docs-only diffs).

**Rule:** Changes to canonical reference files that are read by running services as the source of operational truth — explicitly `ADM.md`, `INS.md`, and `j4c-api/app/kgraph/external_seeds/*.json` — MUST propagate to every read-side host's bind-mounted file within 5 minutes of being pushed to the canonical branch on GitHub. This propagation does NOT count as a "deploy" under ADM-068 / ADM-097: no L0–L4 cascade, no image rebuild, no service restart, no `workflow_dispatch` is required. The receiving file watcher (ADM-076-A) is responsible for re-ingesting into the kgraph; nothing else needs to happen.

**Why ADM-097 created the hole:** ADM-097 (May 8, 2026) gated GHA `deploy` jobs on `workflow_dispatch` only to prevent accidental deploys. This was correct for code/compose/migration diffs. But the side effect was that pure docs-only commits (3 ADM-sync commits 2026-05-08) sat on `origin/main` for 12+ hours without reaching `/opt/j4c-portal/` on the j4c host. The kgraph at `https://j4c.aurigraph.io/api/v3/kgraph/data` stayed at the pre-ADM-091 snapshot (29 ADM nodes) while canonical advanced to ADM-100 (48 entries) — a 19-entry kgraph drift. Operators reading kgraph for "current state" got wrong answers; the ADM-076-A watcher had nothing to watch because the file on disk wasn't moving. Diagnosed and resolved 2026-05-09 by manual `git pull` (kgraph immediately repopulated to 49 ADM nodes).

**Behaviour contract:**

1. **Diff classification preserved.** Docs-only = a diff that touches ONLY `ADM.md`, `docs/ADM.md`, `docs/global-config/ADM.md`, `INS.md`, `docs/INS.md`, `j4c-api/app/kgraph/external_seeds/*.json`, or any `*.md` outside source-of-record code paths. ANY touch to `j4c-api/app/**/*.py`, `j4c-react/src/**`, `*/Dockerfile*`, `docker-compose*.yml`, `requirements*.txt`, `package.json`, `pnpm-lock.yaml`, `*.sql` migration files, or `*.yml` workflow files DISQUALIFIES the diff from this carve-out — those go through ADM-097's workflow_dispatch gate.
2. **Implementation choice (one of):**
   - (preferred) A separate GHA workflow `docs-sync.yml` triggered on `push` (NOT `workflow_dispatch`) with a path filter on the canonical doc paths, that SSHs to read-side hosts and runs `cd <deploy> && git pull --rebase` — no `docker compose` calls, no service restart.
   - A host-side cron / systemd timer (e.g. `j4c-docs-sync.timer`, `*/5 * * * *`) on each read-side host that runs `git fetch && git diff --quiet origin/main <doc-paths>` and pulls only if the diff is docs-only.
   - A GitHub webhook → small `j4c-portal` endpoint that authenticates the push event and triggers the same conditional pull.
3. **Watcher contract (ADM-076-A) is unchanged.** The kgraph watcher already does the right thing once the file on disk changes; the carve-out is purely about getting the file there.
4. **Auditing.** Each docs-only auto-pull MUST log to host journal with the commit SHA and the doc paths that changed. A 24h-window query like `journalctl -u j4c-docs-sync.timer --since "1 day ago"` should show every propagation. Failures (auth, rebase conflicts) MUST page or file a JIRA ticket — silent staleness is exactly what this ADM exists to prevent.
5. **What is still forbidden by ADM-097.** A workflow_dispatch deploy with code/migration/compose changes still runs the full L0–L4 cascade. A docs-only auto-pull MUST refuse to run if the diff includes any non-docs path (defense in depth so a compromised webhook can't sneak code through).

**Operational note (2026-05-09):** The implementation is not yet shipped. Until it is, operators MUST run `cd /opt/j4c-portal && git pull --rebase` on j4c (and analogous on every other host that reads canonical docs) after any ADM-sync commit. Track as a follow-up task; the ADM is binding and gates how the implementation will be reviewed when it lands.

**Reference:** Diagnostic session 2026-05-09 (this session); kgraph drift observed at 29 nodes vs canonical 48 entries; resolved by manual pull at commit `9c35e2402`. Carve-out justification documented in `~/.claude/ADM.md` ADM-097 entry as a known limitation that ADM-101 closes.

---

**Last Updated**: 2026-05-09 (v2.11.7 — ADM-101 docs-only diffs auto-pull carve-out from ADM-097; v2.11.6: ADM-099/100 healthcare LLM ceilings + corpus ordering; v2.11.5: ADM-094..098 CI/deploy hardening; v2.11.1: ADM-091/092/093 OpenBao+Harbor production; v2.11.0: ADM-088/089/090 healthcare deploy recipes)
