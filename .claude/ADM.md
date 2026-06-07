# Aurigraph Development Model Harness (#ADM) — Complete Framework

> **Updated**: June 2, 2026 (eve) | **Version**: 3.0.4 — **ADM-169 added**: **Deploy Queue Discipline** (USER MANDATED) — j4C Deployment Agent MUST drain older deploys before starting new. Triggered by the 2026-06-02 V12 deploy incident: 3 deploys queued sequentially over 8-9h because push triggers piled on without queue check. New rule mandates Step 1 queue verification + push-trigger workflows must use `concurrency: cancel-in-progress: true`. See ADM-169 for full procedure. **Also v3.0.4 (cumulative)**: AurexV4 hardening loop; HCE2 reliability arc; Component 13 TDD/MTP Coverage Audit; ADM-111 cosmic-ray standardization; AV11-2913 Crypto Consolidation architecturally complete.
> **Updated**: June 2, 2026 | **Version**: 3.0.3 — **ADM-111 extended**: cosmic-ray (≥8.4.0) is the new Aurigraph-platform-standard Python mutation testing tool for NEW adopters (replaces mutmut for narrow-module-path ratchet baselines). mutmut may stay installed for ad-hoc wide-scope; legacy adopters (HCE2) keep their `[tool.mutmut]` config. mutmut 4.x is **not** released on PyPI (verified AV11-2920 2026-06-02). Canonical reference: `Jeeves4Coder/j4c-api/cosmic-ray.toml`. **Also**: AV11-2913 Crypto Consolidation Epic architecturally complete — Phases 1-4.6 landed across V12 (proto + client + CryptoOps interface, commits b4359bf3..6489eb1d05) + Battua (server impl, commit 23569615). End-to-end V12→Battua sign/verify path exists.
> **Updated**: May 31, 2026 | **Version**: 3.0.2 — **Component 13 added**: TDD/MTP Coverage Audit (quarterly mandate + 5 canonical adversarial RED-test categories: Path-Collision, Fuzz, Security, Chaos, Mutation-Baseline). First baseline audit shipped at `aurigraph-v12/docs/audit/TDD_MTP_Coverage_Audit_2026-05-31.md` — 19 products, 0/19 adversarial-category adoption (universal gap=5 baseline). Templates at `aurigraph-v12/docs/templates/red-tests/`. **3.0.1**: **AurexV4 hardening loop** (ADM-162 → ADM-165): MinIO creds fallback (AV4-737), watchdog two-vantage probe (AV4-738), LLM empty-payload fall-through (AV4-739), dashboard-as-upload-surface (AV4-736). **3.0.0 milestone**: HCE2 reliability arc (ADM-141 → ADM-152), AurexV4 platform hardening (ADM-153 → ADM-156), HCE2 quality gates (ADM-157 → ADM-160). **HCE2:** single Alembic tree, orphan-reconciler, MapLibre style resilience, Open-Meteo ERA5/CMIP6 split, climate Protocols, agent 8xxx + RFC 7807, deploy guards, zero-fallback UI, GHA Node trim, analysis UI primitives, pixel-wise carbon viz, `ENVIRONMENT=test` alias. **AurexV4:** Prisma v7 ESM/CJS bridge, Docker `.prisma/client` copy, j4c-watchdog SSH checkout, deploy `DATABASE_URL` fallback. Earlier: **ADM-140** OpenBao + Harbor; **ADM-139** node observability agent; **ADM-138** Battua Ollama; **ADM-137** LLM_GATEWAY host-gateway; **ADM-136–133** below.
> **NEW (May 27, 2026)**: **v3.0.0** — full numbered sections for ADM-141 → ADM-160 (see below). HCE2 carbon-estimation: dual-alembic consolidation, `OrphanReconciler` Celery sweep, climate pipeline (forecast → ERA5 → CMIP6 → GDD), 50×50 pixel carbon viz, never-render-silent-zeros. AurexV4: Prisma v7 prod deploy (createRequire + `verify:esm`), Docker generated-client path, off-host watchdog without `GITHUB_TOKEN`.
> **NEW (May 20, 2026)**: **ADM-140** — J4C **OpenBao + Harbor** integration plane: `POST /api/v3/integrations/projects` → `j4c-api/app/infra/{openbao,harbor,observability,publisher}.py`. See [ADM-140](#adm-140--j4c-openbao--harbor-integration-plane-mandatory--2026-05-20).
> **NEW (May 20, 2026)**: **Component 12** — **Telemetry & Observability Platform**: unified metrics, logs, and traces for **applications** (OTel SDK / scrape) and **Aurigraph nodes** via a **mandatory embedded runtime agent** in every V12 node process (consensus + P2P + JVM signals, OTLP export with offline buffer). Control plane: J4C `/api/v1/telemetry/*` (J4C-252). Data plane: Prometheus + OTel Collector → Tempo/Loki. See [Component 12](#component-12-telemetry--observability-platform) and `docs/observability/OBSERVABILITY_STANDARDS.md`. **ADM-139**: embedded node agent is not optional in production node images.
> **Updated**: May 18, 2026 | **Version**: 2.12.25 — **Numbered registry**: ADM-056 → ADM-136 (Appendix A + operational sections below). **P0 cross-cuts**: 068 `@J4CDeploymentAgent` deploy binding; 069 sequential task queue; 070 OAuth email-domain allowlist; 071 DB-authoritative three-tier RBAC; 072 stub-mode integration adapters; 073 L1 image–source drift check; 074 RO source bind-mount (rec); 075 fleet `scripts/j4c-agent.py` + `.j4c-agent.json`; **076 / 076-A** kgraph-first reads + ADM file watcher re-ingest; **077–079** project-bound LLM gateway keys, completion-path smoke checks, and reboot-persistent AutoHeal Layer 2 timers; **080** external project-scoped kgraphs; **081** SPA `index.html` no-cache; **082** Express literal-prefix routes before `:id`; **083** web-hook ↔ API-route response-shape co-test; **084** `email_verified_at` is the single source of truth for verified state; **085** onboarding horizontal top-mounted stepper (rec); **086** per-repo operational profile in `docs/<Project>.md` + slim `CLAUDE.md` pointer (AurexV4 `docs/AurexV4.md`); **122** FS-MTP **recursive testing** — #QAQC / @QAQCAgent + #AAT defect-driven re-passes for early plan closure (pairs ADM-116); **123** **Owner deploy** — **subbu@aurigraph.io** / GitHub **`SUBBUAURIGRAPH`** — no duplicate “approve deployment” gate beyond CI + post-deploy smoke (`deploy-j4c-docker.yml`). **Platform**: 067 LLM Gateway (Gemma→Claude, hashed keys); 066 Healthcare CCAA on DLT + **067-A** nginx-gateway edge routing (Traefik labels inert on live DLT). **PR review**: Cursor **Bugbot** per repo — `cursor.com/dashboard/bugbot` (complements Tier-7 SCMAgent, does not replace it). | **Complete Specification**: All 11 components + 0b/0c
> **KMS (OpenBao — J4C)**: **`https://j4c.aurigraph.io/openbao`** — secrets engine (KV v2, AppRole, etc.). Battua and sibling services use this **HTTPS API base** for KMS operations; it is **not** a Docker registry. Operational detail: [`docs/J4C_OPENBAO.md`](docs/J4C_OPENBAO.md). Harbor: [`docs/J4C_HARBOR.md`](docs/J4C_HARBOR.md). #ADMDocs index: [`docs/ADMDOCS_INDEX.md`](docs/ADMDOCS_INDEX.md).
> **Docker image registry (Harbor — J4C)**: **`https://j4c.aurigraph.io/harbor`** — OCI/Docker images (push/pull, projects, replication). **Do not confuse** with the OpenBao KMS URL above.
> **Context Knowledge Graph (J4C)**: **`https://j4c.aurigraph.io/kgraph`** — ADM Component 7 interactive graph (context files, entities, edges). Local/embedded builds may expose **`/knowledge-graph`**; **J4C canonical path is `/kgraph`**. External project graphs use `/api/v3/kgraph/external/*` with project + graph selectors (ADM-080).
> **Harbor (J4C) — extended**: UP (J4C server 151.242.51.57:2244). **Admin credentials**: use org vault / local `credentials.md` (gitignored) — do not embed in this file. Projects: `aurigraph-v12`, `battua`, `library`. Push via `localhost:5001` on J4C. **Known issue**: registry→core notification sink broken after config volume reset — push completes but artifacts don't appear in Harbor UI/API. Requires `prepare` script re-run to regenerate registry `config.yml`. Production images are deployed directly on DLT server via emergency deploy pattern.
> **Observability (J4C)**: **`https://j4c.aurigraph.io/api/v1/telemetry/health`** — Cross-Project Telemetry Plane (Component 12). Grafana/Alertmanager on J4C (`observability` compose profile). **V12 nodes**: **Aurigraph Observability Runtime Agent** embedded in-process (Quarkus extension) — not scrape-only; `/q/metrics` remains a compatibility surface. Do not use J4C Postgres `telemetry_metrics` as the long-term TSDB for node TPS/consensus series.
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
> **NEW (May 12, 2026)**: **FS-MTP recursive testing (ADM-122)** — @QAQCAgent / TestTeam and #AAT execute the **Full-Stack Master Test Plan** in **ordered passes** with **defect-driven expansion**: fast layers first → each failure opens a **targeted sub-wave** (new cases, fixtures, env matrix cells) → **re-run until green** or **JIRA-blocked** with recorded evidence; FS-MTP registry + run history (`/api/v3/mtp`, portal FS-MTP panel) and optional compose **`FS_MTP_AUTOMATION`** preserve continuity between waves (see ADM-076 kgraph health as cheap smoke adjunct).
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
12. [Component 11: DMRV-Verified AI Model Quantization](#component-11-dmrv-verified-ai-model-quantization-mandatory-memorized--apr-13-2026)
13. [Component 12: Telemetry & Observability Platform](#component-12-telemetry--observability-platform)
14. [J4C Framework #ADM Integration](#j4c-framework-adm-integration)
15. [#ReviewAndRefactor macro (USER MANDATED — 2026-06-04)](#reviewandrefactor-macro-mandatory-memorized--2026-06-04--user-mandated)

---

## Overview

**Definition**: Aurigraph Development Model Harness (#ADM) is THE unified development methodology combining requirements analysis, TDD, 4-tier validation, JIRA automation, git workflow, deployment, and runtime resilience—executed autonomously end-to-end.

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

### #ReviewAndRefactor macro (#MANDATORY #MEMORIZED — 2026-06-04 — USER MANDATED)

**Rule**: Any user request phrased as **"review and refactor"** (or close variants — "review, research, refactor", "audit and enhance", "competitor-aware refactor") is a shorthand for a **4-stage workflow**, executed under #ADM + #AAT — never as freestyle edits.

| Stage | What | Output artifact |
|---|---|---|
| 1. **Review** | Read the in-scope code/feature with #PreTaskVerificationGate (6 sources). Map dependencies, current behaviour, test coverage, known #INS-* gotchas. | Review note in `session.md` (current state, gaps, risks) |
| 2. **Research competing products & enhance** | Identify 2-3 leading competing products / OSS analogues for the same surface area. Extract concrete enhancements (UX, perf, security, ergonomics) that apply. Cite sources. | Competitive scan + enhancement candidates list (in `session.md` or `docs/research/<topic>.md`) |
| 3. **Refactor** | Translate Stage 1 gaps + Stage 2 enhancements into concrete WBS items per the WBS-First rule below. Each WBS item = one #AAT cycle. | WBS table with #AAT stream assignment |
| 4. **Execute using #ADM + #AAT** | Run the full pipeline: #PreTaskVerificationGate → Component 0 → TDD (RED first) → 5-stream #AAT → Approver gate → SCMAgent → git → deploy verify → #PhaseReflection (Component 9). No stages skipped, no freestyle commits. | PR(s), JIRA tickets, `session.md` reflection, ratchet metrics (coverage, mutation, etc.) |

**Why memorize**: Without this expansion, "review and refactor" is ambiguous — it can collapse into either (a) a quick read-and-edit (skipping competitor research and AAT) or (b) an open-ended rewrite (skipping WBS and the gate sequence). The macro pins down the contract: **all four stages, in order, every time**.

**Skip criteria**: same as #ADM proper — pure research, single-line docs, <5 LOC hotfix. **No other exemptions.** If the request is "review and refactor X" and X is non-trivial, Stages 2 (competitive research) and 4 (full #ADM+AAT) are non-negotiable.

**Pre-flight checklist** (Maker must produce BEFORE Stage 3 begins):
- [ ] Review note in `session.md` cites file paths + line numbers, not just module names
- [ ] Competitive scan names ≥2 named products/projects + concrete enhancements drawn from each
- [ ] WBS table maps each enhancement → #AAT stream → expected acceptance test
- [ ] #PreTaskVerificationGate run: nothing already shipped under a duplicate name

**Approver gate addition**: when the trigger phrase was "review and refactor", the Approver MUST verify Stages 1-2 evidence exists in `session.md` before APPROVING. Missing competitive scan = automatic REJECT.

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

**Platform integrations (May 2026)**: Full #ADMDocs bundle at `docs/j4c/integrations/` (PRD, Architecture, diagrams, DatabaseDesign, DeploymentGuide) + `docs/J4C_OPENBAO.md`, `docs/J4C_HARBOR.md`, `docs/observability/*`. Master index: [`docs/ADMDOCS_INDEX.md`](docs/ADMDOCS_INDEX.md). ADM decisions: ADM-140, ADM-092, ADM-093.

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

**J4C platform feature bundles** (integrations, observability): see [`docs/ADMDOCS_INDEX.md`](docs/ADMDOCS_INDEX.md) — each feature has its own `docs/<area>/` folder with the five artifacts or an equivalent structured set.

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

**Achievement**: Full integration of Aurigraph Development Model Harness (#ADM) into J4C Framework orchestrator

**Status**: ✅ Design Complete | 📋 Implementation Planned (4 phases, 2-3 weeks)

### Overview

The J4C Framework now includes complete Aurigraph Development Model Harness (#ADM) integration, enabling intelligent task routing through either a full 9-component autonomous pipeline or a streamlined 3-component pipeline based on task complexity.

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

## Component 12: Telemetry & Observability Platform (#MANDATORY #MEMORIZED — May 20, 2026)

> **Rule**: Every Aurigraph **application** and every **DLT node** MUST emit observable signals (metrics minimum; traces + logs where feasible), register with the **J4C Cross-Project Telemetry Plane**, and appear on the **platform Grafana** dashboards with consistent labels. Component 8 (AutoHeal) answers *"is it up?"*; Component 12 answers *"how is it performing and why did it fail?"*
>
> **Scope**: J4C Portal, Publisher, Enterprise Portal, Website V3, Battua, MEV Shield, Healthcare CCAA, **Aurigraph V12** (validators, business nodes, EI nodes), and all future `project_registry` entries.
>
> **References**:
> - J4C-252 epic — `j4c-api/app/routers/telemetry.py`, `j4c-api/app/db/telemetry.py`
> - Integrations orchestrator — `j4c-api/app/infra/orchestrator.py` (extend with `observability` adapter)
> - V12 testnet pattern — `aurigraph-v11-standalone/test/prometheus.testnet.yml`
> - Standards detail — [`docs/observability/OBSERVABILITY_STANDARDS.md`](docs/observability/OBSERVABILITY_STANDARDS.md)

### Purpose & Separation from Component 8

| Concern | Component 8 (AutoHeal) | Component 12 (Observability) |
|---------|----------------------|------------------------------|
| **Question** | Is the process alive? | Is SLO met? What broke? |
| **Signal** | Health checks, 60s failure threshold | Metrics, traces, logs, alerts |
| **Action** | Restart, escalate, JIRA | Dashboards, SLO review, capacity planning |
| **Store** | J4C error API + incident log | Prometheus/Mimir + Tempo + Loki (+ J4C PG for alert state) |

Both are mandatory. A service can pass health checks while failing SLO (high latency, silent errors).

### Architecture (Control Plane + Data Plane)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ APPLICATIONS (tier=application)     AURIGRAPH NODES (tier=node) — MANDATORY   │
│  OTel SDK or /metrics scrape         ┌────────────────────────────────────┐  │
│                                      │ V12 process (validator/business/EI) │  │
│                                      │  HyperRAFT · TX · gRPC · JVM        │  │
│                                      │       ↓ hooks                       │  │
│                                      │  Observability Runtime Agent (in-proc)│  │
│                                      │   · custom consensus/TPS meters     │  │
│                                      │   · OTLP export + local buffer      │  │
│                                      │   · /q/metrics (Micrometer bridge)  │  │
│                                      └──────────────┬─────────────────────┘  │
└───────────────┬────────────────────────────────────┼────────────────────────┘
                │                                    │
                ▼                                    ▼
         ┌─────────────┐                    ┌─────────────┐
         │ OTel        │◄───────────────────│ OTLP + optional│
         │ Collector   │                    │ Prometheus scrape│
         └──────┬──────┘                    └──────────────┘
                │                                   │
                ▼                                   ▼
         ┌─────────────┐  ┌─────────────┐   ┌─────────────┐
         │ Tempo       │  │ Loki        │   │ Alertmanager│
         │ (traces)    │  │ (logs)      │   └──────┬──────┘
         └─────────────┘  └─────────────┘          │
                │                │                 ▼
                └────────┬───────┘          ┌──────────────────┐
                         ▼                │ J4C Telemetry API │
                  ┌─────────────┐         │ alert webhook +   │
                  │ Grafana     │◄────────│ query/SSE       │
                  │ (SSO/IAM)   │         └──────────────────┘
                  └─────────────┘
                         ▲
                         │ register project + telemetry_services row
                  ┌──────┴──────┐
                  │ J4C Portal   │ Integrations · Admin Hub · Agent Hub
                  └─────────────┘
```

**Control plane** (already in repo): `POST /api/v1/telemetry/services`, ingest via `X-J4C-Project-Key`, `POST /api/v1/telemetry/query`, `GET /api/v1/telemetry/health`, Alertmanager webhook → `telemetry_alerts`.

**Data plane** (rollout): Docker Compose profile `observability` on **J4C host** (`j4c.aurigraph.io`) for Prometheus + Grafana + Alertmanager + OTel Collector + Tempo + Loki. **DLT node scrape** may run on `dlt.aurigraph.io` with federation to J4C Grafana, or remote_write from DLT Prometheus — pick one host pair in Phase 0 (see standards doc).

### Mandatory Label Schema (ADM-138)

Every metric, trace, and log stream MUST include these labels (Prometheus) or resource attributes (OTel):

| Label / attribute | Required | Example |
|-------------------|----------|---------|
| `aurigraph.project` | Yes | `battua`, `j4c`, `v12` |
| `aurigraph.env` | Yes | `prod`, `staging`, `testnet` |
| `aurigraph.tier` | Yes | `application` \| `node` |
| `aurigraph.service` | Yes | `j4c-api`, `validator`, `publisher` |
| `aurigraph.node_id` | Nodes only | `validator-3` |
| `aurigraph.node_role` | Nodes only | `VALIDATOR`, `BUSINESS`, `EI` |

**Forbidden** on labels: `user_id`, email, wallet address, full transaction hash, API keys. Use logs/traces for high-cardinality dimensions.

### Golden Signals

**Applications (RED)**

| Signal | Metric examples | Alert threshold (starting point) |
|--------|-------------------|----------------------------------|
| **Rate** | `http_server_requests_seconds_count` | — |
| **Errors** | 5xx rate / total | > 1% for 5m → P2 |
| **Duration** | p95 latency | > 500ms (API), > 2s (batch) for 10m → P2 |

**Nodes (USE + blockchain)**

| Signal | Source | Alert threshold (starting point) |
|--------|--------|----------------------------------|
| **Utilization** | JVM heap, CPU, disk | heap > 85% for 15m → P2 |
| **Saturation** | thread pools, DB connections | pool exhausted → P1 |
| **Errors** | consensus errors, failed txs | sustained increase → P1 |
| **TPS / finality** | custom Micrometer meters | < 50% baseline 15m → P1 |
| **Up** | `up{job="validator-*"}` | any production validator down 2m → P1 |

**`/q/metrics`** remains the Prometheus-compatible scrape surface (Micrometer + agent-enriched meters). **`/q/health`** is Component 8 liveness only — it does **not** replace the observability agent.

### Embedded Node Runtime Agent (#MANDATORY — ADM-139)

> **Rule**: Every production **Aurigraph V12 node** (validator, business, EI/light client archive) MUST ship with the **Aurigraph Observability Runtime Agent** compiled into the node binary. External scrape-only monitoring is **insufficient** — consensus, shard, peer, and finality signals exist inside the process and MUST be collected in-process.

**Why embedded (not sidecar-only)**

| Limitation of scrape-only | What the embedded agent adds |
|---------------------------|------------------------------|
| Only sees HTTP/gRPC Micrometer meters | HyperRAFT++ role, term, replication lag, vote failures |
| Misses pre-HTTP failures (consensus stall) | Transaction pipeline stages, mempool depth, drop reasons |
| No buffering when collector is down | Ring buffer + retry with back-pressure caps |
| Hard to correlate peer events | Structured events → metrics + optional trace spans |
| Fleet config drift per host | Agent reads node identity from env + OpenBao at boot |

**Deployment model**

| Mode | Status | Notes |
|------|--------|-------|
| **In-process (Quarkus extension)** | **Required** | Single native/JVM artifact; GraalVM-friendly; default for all node images |
| **Co-located sidecar** | Optional dev/test | `otel-collector` in same compose service group — never replaces in-process agent |
| **Host-level Promtail only** | Supplemental | Logs only; does not satisfy agent requirement |

**Agent responsibilities** (implementation target: `io.aurigraph.v11.observability` module)

1. **Bootstrap** — On `StartupEvent`: load `node_id`, `node_role`, `cluster_id`, `aurigraph.env` from config; fetch OTLP endpoint + `X-J4C-Project-Key` from OpenBao path `kv/aurigraph/{project}/observability/node` (or env override for testnet).
2. **Instrument** — Register Micrometer meters + OTel SDK meters for:
   - Consensus: leader state, term, commit index lag, election count, failed append entries
   - Transactions: ingest rate, validation failures, ordering latency, TPS (sliding window)
   - Network: peer reachability, gRPC stream counts (integrate with `GrpcMetricsCollector`)
   - Storage: RocksDB compaction stall, WAL size, state DB latency (if exposed)
   - Runtime: JVM heap/GC, virtual-thread pool saturation (Java 21)
3. **Export** — Push OTLP/gRPC (metrics + logs + traces for sync RPC paths) to platform Collector every `observability.export.interval` (default 15s).
4. **Buffer** — When Collector unreachable: retain last N minutes in bounded in-memory buffer; drop oldest on overflow; emit `aurigraph_obs_agent_export_failures_total`.
5. **Heartbeat** — POST agent metadata to J4C (optional REST): version, build sha, last successful export, buffer depth — enables fleet dashboard in Agent Hub.
6. **Expose** — Bridge the same registry to **`/q/metrics`** so Prometheus jobs in `prometheus.testnet.yml` keep working during migration.

**Configuration** (`application.properties` / env)

```properties
aurigraph.observability.enabled=true
aurigraph.observability.agent-id=${AURIGRAPH_NODE_ID}
aurigraph.observability.node-role=${AURIGRAPH_NODE_ROLE}
aurigraph.observability.collector.endpoint=${OTEL_EXPORTER_OTLP_ENDPOINT}
aurigraph.observability.project-key=${J4C_TELEMETRY_PROJECT_KEY}
aurigraph.observability.buffer.max-minutes=5
aurigraph.observability.cardinality.limit=8000
```

**Production gate**: node container/image build MUST fail CI if `aurigraph.observability.enabled=false` on `validator` / `business` / `ei` profiles. Testnet may disable via profile `observability-disabled` with explicit JIRA waiver.

**Fleet registration** (ties to Integrations API)

When `POST /api/v3/integrations/projects` provisions `v12` (or per-cluster project):

| Deliverable | Owner |
|-------------|--------|
| `telemetry_services` row `v12-cluster` (or per env) | observability adapter |
| One-time project key → node env / OpenBao | secrets_once |
| Prometheus `file_sd` or static targets per node port | platform ops |
| Grafana folder **Aurigraph / V12 / Nodes** | platform ops |

Per-node identity MUST be injected at deploy time (`AURIGRAPH_NODE_ID=validator-3`, `AURIGRAPH_NODE_ROLE=VALIDATOR`).

### Project Onboarding (Integrations API)

When an Aurigraph product is registered in J4C, observability is provisioned like Harbor and OpenBao:

```http
POST /api/v3/integrations/projects
{
  "id": "battua",
  "name": "Battua",
  "services": ["openbao", "harbor", "observability", "publisher"]
}
```

**`observability` adapter** (`j4c-api/app/infra/observability.py` — ADM-138/140):

| Step | Action |
|------|--------|
| 1 | Insert `telemetry_services` row (`name` = `j4c-{project_id}` or override) |
| 2 | Return one-time `J4C_TELEMETRY_PROJECT_KEY` + `OTEL_EXPORTER_OTLP_ENDPOINT` in `secrets_once` |
| 3 | Optional write `kv/aurigraph/{project_id}/telemetry` in OpenBao when admin token set |
| 4 | Store metadata in `integration_credentials` |
| 5 | Grafana folder / Prometheus scrape templates — operator follow-up per [`docs/observability/OBSERVABILITY_STANDARDS.md`](docs/observability/OBSERVABILITY_STANDARDS.md) |

**Orchestrator order** (canonical): `openbao` → `harbor` → `observability` → `publisher` (secrets store first, registry second, telemetry third, app integrations last).

### Instrumentation Requirements by Surface

| Surface | Metrics | Traces | Logs | Registration |
|---------|---------|--------|------|--------------|
| **j4c-api** | OTel or `/metrics` | OTel FastAPI + SQLAlchemy | JSON + `trace_id` | `telemetry_services.name=j4c-api` |
| **j4c-react** | Optional RUM (Faro) | Browser → Collector | console → Loki | project label only |
| **publisher** | HTTP metrics endpoint | workflow `trace_id` in audit | structlog → Loki | `publisher` + `product_key` label |
| **V12 node (each process)** | **Embedded runtime agent** + `/q/metrics` | OTel in-agent (consensus + gRPC) | agent → Loki via Collector | `telemetry_services` + per-node labels |
| **New services** | Required before `/deploy` | Required for sync RPC paths | Required | J4C-252 service row |

### Phased Rollout (JIRA epic: J4C-OBS)

| Phase | Duration | Deliverable | Exit criteria |
|-------|----------|-------------|---------------|
| **0 — Standards** | 1 week | `OBSERVABILITY_STANDARDS.md`, label schema, ADM-138/139 | Agent API spec + config contract frozen |
| **1a — Agent core** | 2–3 weeks | `aurigraph-observability-agent` Quarkus module; consensus + TPS meters; OTLP export | Unit + integration tests; testnet 3 nodes reporting |
| **1b — Fleet** | 1–2 weeks | All 11 production targets; Grafana V12 Cluster; `up` + agent heartbeat | Agent version visible; buffer recovery tested |
| **2 — Applications** | 2–4 weeks | OTel on j4c-api + publisher; trace correlation with `X-Request-Id` | RED dashboard per service; p95 visible |
| **3 — Portal UX** | 2 weeks | Admin Hub tile; Integrations checkbox; Agent Hub `/components` | Admin sees health + link to Grafana |
| **4 — Maturity** | ongoing | SLOs, recording rules, 24h load test metrics, federated multi-host | Post-deploy cascade emits synthetic metrics (L2) |

### ADM Pipeline Integration

| ADM Component | Observability hook |
|---------------|-------------------|
| **0 — Design** | PRD lists SLOs + required metrics; cardinality review |
| **1 — TDD** | Tests assert metrics endpoints return 200; no label cardinality explosions |
| **5-6 — Deploy** | L2 smoke includes `GET /api/v1/telemetry/health`; optional `up` check for new scrape targets |
| **7 — Session** | Record Grafana dashboard URLs + alert rule IDs in `session.md` |
| **8 — AutoHeal** | Alertmanager routes to same on-call; distinguish `up==0` (Heal) vs high latency (Observe) |
| **12 — This component** | Gate: new production services MUST register telemetry before Approver sign-off on deploy |

### Deploy & Compose (J4C host)

Add profile to J4C `docker-compose.yml` (names illustrative):

```yaml
# docker compose --profile observability up -d
services:
  prometheus:
    networks: [j4c-network]
    volumes: [./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro]
  grafana:
    networks: [j4c-network]
    environment:
      GF_AUTH_GENERIC_OAUTH_ENABLED: "true"   # Keycloak iam2.aurigraph.io
  alertmanager:
  otel-collector:
  tempo:
  loki:
```

**nginx** (`nginx-prod.conf`): Grafana at `/grafana/` (internal or SSO-gated); **never** expose Prometheus `:9090` publicly. Existing `location /metrics` → j4c-api remains **RFC1918 only**.

**Secrets**: Grafana admin, remote_write tokens, scrape basic-auth → OpenBao `kv/aurigraph/j4c/observability` (see `scripts/j4c/integrations-ops.sh` pattern).

### Storage Policy (J4C-252)

| Data | Primary store | Retention | Notes |
|------|---------------|-----------|-------|
| Time series (high volume) | Prometheus / Mimir | 30d hot, 90d downsampled | Node TPS, HTTP histograms |
| Traces | Tempo | 7d | Cross-service debugging |
| Logs | Loki | 14d | Correlate with `trace_id` |
| Alert state + rules | Postgres `telemetry_*` | 90d alerts | Already in schema |
| Custom low-volume metrics | Postgres `telemetry_metrics` | 30d prune | OK for app-push via API; not for node scrape |

Finish **Prometheus remote-write** protobuf path in `telemetry.py` OR standardize on Collector remote_write — do not run both half-implemented in production.

### Dashboard Pack (minimum)

1. **Platform overview** — all projects `up`, firing alerts, deploy version.
2. **V12 cluster** — 11 nodes by role, TPS, leader map, JVM.
3. **j4c-api** — RED, DB pool, integration adapter failures.
4. **publisher** — workflow queue depth, channel publish errors.
5. **Per-project** — template var `aurigraph.project`.

### Enforcement Checklist (pre-production)

- [ ] `telemetry_services` row exists for the deployable
- [ ] **Embedded observability agent enabled** in node image (`aurigraph.observability.enabled=true`)
- [ ] OTLP reaching Collector; `aurigraph_obs_agent_export_failures_total` near zero
- [ ] Prometheus target added and `up==1` for 24h in staging ( `/q/metrics` )
- [ ] `AURIGRAPH_NODE_ID` + `AURIGRAPH_NODE_ROLE` set in compose/systemd unit
- [ ] Labels pass schema audit (no PII, no unbounded cardinality)
- [ ] At least one P2 alert rule tested (fire → resolve)
- [ ] Grafana dashboard linked in JIRA deploy ticket
- [ ] Component 6 OWASP: Grafana not anonymously admin-accessible on public internet
- [ ] Trace: `X-Request-Id` / W3C `traceparent` documented for the service

### Agent Responsibilities

| Agent | Role |
|-------|------|
| **@QAQCAgent** | Verify scrape targets after deploy; L2/L3 smoke includes telemetry health |
| **@J4CDeploymentAgent** | Bring up `observability` profile; verify Alertmanager → J4C webhook |
| **@Plan** | SLO definitions per epic |
| **DevOps / Platform** | Prometheus rules, Grafana folders, OpenBao secrets |

### Related ADMs

- **ADM-072** — stub-mode adapters until observability stack configured
- **ADM-092** — per-project provisioning via orchestrator (extend with `observability`)
- **ADM-116** — pre-deploy testplan includes observability smoke
- **ADM-122** — FS-MTP may use `/api/v1/telemetry/health` as cheap adjunct
- **ADM-138** — mandatory label schema + no TSDB in J4C Postgres for node metrics
- **ADM-139** — embedded observability runtime agent mandatory in V12 node processes

**Added**: May 20, 2026 | **Canonical location**: `ADM.md` (Component 12) + `docs/observability/OBSERVABILITY_STANDARDS.md`

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

**Project registration is a single atomic call** to J4C: `POST /api/v3/integrations/projects` (`j4c-api/app/routers/integrations.py`) fans out through `j4c-api/app/infra/orchestrator.py` in canonical order **OpenBao → Harbor → observability → publisher**, rolls back in reverse on any failure, and returns one-time secrets via `secrets_once`. Adapters live in `j4c-api/app/infra/{openbao,harbor,observability,publisher}.py`. **LLM Gateway is NOT an integration adapter** (ADM-092) — projects consume `https://j4c.aurigraph.io/llm-gateway` as clients per ADM-067. Harbor + OpenBao run **stub mode** until admin env is set (ADM-072); observability adapter is always enabled (telemetry registry).

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
| J4C, HCE2, Aurex, V12-DLT, AWD | `LLM_GATEWAY_PROJECT_KEYS` JSON in gateway `.env` (seed) → hashed in `/var/lib/llm-gateway/projects.json` | `https://j4c.aurigraph.io/llm-gateway/v1/chat/completions` |
| Battua | Optional — `BATTUA_GEMMA_API_BASE` override + J4C-issued key | **Primary (ADM-138):** host Ollama `http://127.0.0.1:11434/v1`, model `gemma4:latest` |
| Provenews | Optional — env override | **Primary:** host Ollama (see Provenews `gemma_manifest.json`) |

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

**Reference incident**: J4C Portal commit `a03c788f9` — `OpenBaoAdapter.__init__` was crashing on missing `openbao_url` field, which broke `POST /api/v3/integrations/projects` for ALL roles regardless of auth (RBAC guard was firing AFTER adapter instantiation). Fix added the missing Settings fields and confirmed all adapters instantiate cleanly with empty env. Code: `j4c-api/app/infra/{openbao,harbor,observability,publisher}.py`, `j4c-api/app/infra/base.py::ProvisionResult`, `j4c-api/app/config.py::Settings`.

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

**Scope of carve-out:** **Healthcare only** (this entry). **Battua** (**ADM-138**) and **Provenews** (host-Ollama manifest) use local Ollama as primary — not ADM-067. Other projects (HCE2, AWD, V12-DLT, Aurex, J4C) remain on the shared gateway unless they adopt an explicit carve-out.

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

**Rule:** Every Aurigraph project that needs an OpenBao secrets namespace OR a Harbor registry project + robot account MUST be provisioned via the J4C portal's `IntegrationOrchestrator` (`POST /api/v3/integrations/projects` with `services: ["openbao", "harbor"]` — optionally `observability`, `publisher`). Adapter implementations live in `j4c-api/app/infra/{openbao,harbor,observability,publisher}.py` and are the canonical owner of:

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

1. The reference impl is J4C `j4c-api/app/infra/harbor.py`. Search for `_NO_CSRF_HEADERS`, `cookies.clear()`, `_robot_basename`, `_normalize` for the patterns.
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

## ADM-102 — `docker cp` Hot-Patches MUST NOT Be Used as Durable Deploys; Image Rebuild Required After ANY Container Restart (#MANDATORY — May 4, 2026 — USER MANDATED)

**Status:** Applied (2026-05-04). **Pairs with:** ADM-068 (j4c-deployment-agent binding), ADM-098 (schema/env drift gates pre-build).

**Rule:** Incremental backend deploys via `docker cp <local-file> <container>:/app/<path>` followed by `docker compose restart <service>` are **temporary patches only**. They are **silently undone** the next time the container restarts for any reason (manual `docker restart`, GHA `Deploy` workflow `up -d`, host reboot, OOM kill, autoheal Layer 1 `restart: always` recovery). Any backend code change shipped via `docker cp` MUST be followed within the same deploy cycle by a real image rebuild (`docker compose build <service>` against the canonical `git reset --hard origin/main` tree on the deploy host) to bake the patch into the image. If the rebuild step is blocked (e.g., HCE2-376 — sudo not configured for the runner), the deploy is **incomplete** and the ticket MUST stay open until the rebuild lands; the cp-patched container is on borrowed time.

**Why this is here:** Three separate regressions of the same field (`aoi_polygon` on `/api/v1/hyperspectral/analyses/{id}/geospatial`) inside 48 hours on HCE2 (commits `7c32187b` → `e69455f4` → recovery patch on 2026-05-03). Each cycle: developer ships code → @J4CDeploymentAgent does `docker cp` + `docker compose restart backend` → endpoint serves the new field → next deploy or restart wipes the cp'd file → endpoint regresses → recovery deploy → repeat. Root cause was HCE2-376 (passwordless sudo unconfigured for the runner user, blocking `sudo docker compose build`), which forced the agent into cp-only fallback. The fallback "worked" each time but each success was load-bearing on the container *not* restarting. The third regression made it clear: cp-only is not a deploy, it's a hotfix that decays.

**Mandatory verification gate (post-deploy):**
1. After ANY backend code deploy, `git log --oneline -1` on the deploy host MUST match the SHA the agent reported as deployed. If it doesn't, the cp path was used and the rebuild step is owed.
2. The post-deploy probe must include `docker inspect <service> --format '{{.Image}}'` AND a content-hash check on the touched file inside the container vs the canonical file in the repo. Mismatch = pending rebuild.
3. The agent's verdict object MUST include `image_rebuilt: true|false` and `cp_patches_outstanding: <list>`. A `PASS` verdict with `image_rebuilt: false` is a partial; the orchestrator MUST flag it for the next deploy cycle.

**When cp-patches ARE acceptable:**
- A genuine production hotfix where the queue-time of the image rebuild (5–8 min on the HCE2 backend image, ~9.5 GB) is unacceptable and the rebuild is queued to follow within minutes.
- A test of a fix-candidate before committing the rebuild — but the cp MUST be reverted before the next deploy if the candidate is rejected.

**When they are NOT:** as the durable deploy artifact, ever.

**Reference:** Three-regression incident chain in HCE2, 2026-05-02 to 2026-05-03; ticket HCE2-376 (open, assigned `prashanth@aurigraph.io`); recovery deploy session 2026-05-03 captured in `session.md`.

---

## ADM-103 — Self-Hosted CI Runner Sudoers MUST Be Scoped, Not Blanket `NOPASSWD: ALL` (#MANDATORY — May 4, 2026 — USER MANDATED)

**Status:** Applied (2026-05-04). **Pairs with:** ADM-068 (deploy binding), ADM-091 (OpenBao production hardening — same defence-in-depth principle).

**Rule:** When granting `subbu` (or any GHA self-hosted runner user) passwordless sudo, the sudoers entry MUST be **scoped to the explicit commands the workflow invokes**, not blanket `subbu ALL=(ALL) NOPASSWD: ALL`. The canonical form is:

```
# /etc/sudoers.d/<user>-gha-runner — chmod 0440
<user> ALL=(root) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/bin/apt-get, /usr/bin/apt, /opt/<project>/scripts/deploy-incremental.sh
```

Add additional binaries (e.g. `/bin/systemctl` if the deploy restarts a service unit) only when a specific workflow step demands them, and document each addition in the same comment block. After every change run `sudo visudo -c -f /etc/sudoers.d/<user>-gha-runner` and confirm `parsed OK` before logging out — a malformed sudoers file locks out all sudo access.

**Why this is here:** A GHA self-hosted runner with `NOPASSWD: ALL` is functionally a remote root shell for anyone who can push to the watched branch (or trick the runner into executing). The scoped form preserves the runner's blast radius even if a malicious or buggy workflow tries `sudo rm -rf /` or `sudo passwd root`. The cost of being scoped is one line per command added to a workflow — trivial — and the benefit is that a workflow exfil compromise can't escalate to a full host takeover.

**Mandatory checklist for every new self-hosted runner:**
1. Provision the user without sudo by default.
2. Identify every `sudo <cmd>` in the project's `.github/workflows/*.yml` (grep is sufficient).
3. Author the scoped sudoers file with exactly those binaries + documented justification.
4. `chmod 0440` and `visudo -c` validate before exiting the SSH session.
5. Run a dry workflow to confirm each `sudo` call now succeeds.
6. Audit quarterly — workflows accrete `sudo` calls; the sudoers file MUST grow alongside, not be loosened.

**Anti-pattern:** the comfort of `NOPASSWD: ALL` while "we'll lock it down later." Later never comes; the scoping cost is the same on day 1 as day 90, and only on day 1 is the threat surface still small.

**Reference:** HCE2-376 (assigned `prashanth@aurigraph.io`, comment 34732); proposed scoped sudoers for hce201 documented there. Distinct from ADM-091 OpenBao hardening but the same threat model: avoid blanket privilege grants on production-adjacent infrastructure.

---

## ADM-104 — User-Space Vendor-Extracted System Libraries Are an Acceptable Fallback for Self-Hosted Runners When Sudo is Unavailable (#REC — May 4, 2026)

**Status:** Recommendation (2026-05-04). **Pairs with:** ADM-103 (the proper fix, when sudo is available).

**Rule:** When a self-hosted runner needs a system library (`libicu`, `libssl`, `libstdc++` newer than host, etc.) and passwordless sudo is not yet configured (ADM-103 in flight), **`apt-get download` + `dpkg-deb -x` to a user-owned directory + `LD_LIBRARY_PATH` injection in the runner wrapper** is an acceptable interim solution. The runner becomes operational without blocking on sysadmin time. This is NOT a durable end state: once the proper sudo is configured, the user-space libs MUST be removed and `installdependencies.sh` re-run with sudo so the runner consumes the host-managed package.

**Concrete recipe (proven on hce201, 2026-05-03):**

```bash
# 1. Fetch the .deb without sudo (apt-get download writes to cwd as the user)
mkdir -p ~/actions-runner/vendor-libs && cd ~/actions-runner/vendor-libs
apt-get download libicu74

# 2. Extract to user-owned dir (no install, no sudo)
dpkg-deb -x libicu74_*.deb .
ICU_DIR=$(find . -name 'libicuuc.so*' -printf '%h\n' | head -1)

# 3. Wrap the runner so LD_LIBRARY_PATH is set on every start
cat > ~/actions-runner/run-with-icu.sh <<'WRAPPER'
#!/usr/bin/env bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ICU_DIR="$(find "$SCRIPT_DIR/vendor-libs" -name 'libicuuc.so*' -printf '%h\n' | head -1)"
export PATH="$HOME/bin:$PATH"   # also let user-space jq / etc. through
export LD_LIBRARY_PATH="$ICU_DIR:$LD_LIBRARY_PATH"
exec "$SCRIPT_DIR/run.sh" "$@"
WRAPPER
chmod +x ~/actions-runner/run-with-icu.sh
nohup ~/actions-runner/run-with-icu.sh > ~/actions-runner/runner.log 2>&1 &
```

**Cleanup once sudo is available (per ADM-103 closing):**

```bash
sudo ~/actions-runner/bin/installdependencies.sh   # installs libicu system-wide
rm -rf ~/actions-runner/vendor-libs                # drop the workaround
# Optionally restore stock ./run.sh wrapper (or keep run-with-icu.sh — the
# LD_LIBRARY_PATH prefix is harmless once the system libs match)
```

**Why this is "rec" not "mandatory":** the workaround is fragile (runner self-update can break the vendor-extracted ABI; reboot drops the nohup PID) and the real fix is one sudoers line. Use it to unblock CI/CD when sysadmin is hours away, not as steady state.

**Reference:** HCE2-373 closure (2026-05-03) — actions-runner v2.319.1 on Ubuntu 24.04, libicu74 vendor-extracted. Operational notes also live in the project repo at `scripts/gha-health-check.install.md`.

---

## ADM-105 — Healthcare Vitest MUST Run From `web/` cwd; Repo-Root Invocation Pulls In Stale `.claude/worktrees/agent-*/` Test Files (#MANDATORY — May 9, 2026 — USER MANDATED)

**Status:** Applied (2026-05-09). **Pairs with:** ADM-088 (healthcare SPA build recipe), ADM-064 (worktree-isolated AAT pattern). **Triggered by:** Two empirical hits in this session — once when a `cd backend && vitest` slip ran with the wrong cwd; once when running `vitest run` from the healthcare repo root caused 12 spurious test failures because vitest auto-discovered and tried to run `.claude/worktrees/agent-aa1760a67f7acf443/web/src/AntimicrobialCdsPanel.test.tsx` and similar orphaned worktree paths that lack their own `node_modules` and `@testing-library/react`.

**Rule:** Every healthcare SPA test invocation MUST be run from the `web/` subdirectory:

```bash
cd /Users/subbujois/subbuworkingdir/healthcsare/healthcare/web
npx vitest run                # full suite
npx vitest run src/X.test.tsx  # single file
npx tsc --noEmit               # typecheck the SPA package
```

**Forbidden:** `npx vitest run` from the repo root or any other parent of `web/`. The `vitest.config.ts` (which OWNS the test discovery glob and the `node_modules` resolution path) is anchored at `web/` only.

**Why running from repo root breaks:**

1. **Worktree pollution.** ADM-064's `#4ParallelAAT` worktree pattern leaves `.claude/worktrees/agent-{id}/` directories in the repo. Most are cleaned up at agent completion; SOME survive across sessions (failed cleanups, interrupts, manual aborts). Vitest at repo root discovers `*.test.tsx` files INSIDE those orphaned worktrees, which CANNOT resolve their imports (their `node_modules` doesn't exist or is stale), and reports them as test-file-load failures interleaved with the real suite.
2. **Ephemeral footgun:** the failures look like real regressions in the live test files — same paths (`web/src/Foo.test.tsx`), same test names, just sourced from a stale worktree copy. Easy to chase the wrong root cause.
3. **No project-level vitest config exists** at the healthcare repo root. The error message ("Cannot find package '@testing-library/react'") is unhelpful.

**Operational hygiene:**

- The j4c-deployment-agent's "L1 vitest" step MUST `cd web/` before invoking. This is enforced via the `web/package.json` `test` script which runs from the package dir.
- Periodic cleanup: `find .claude/worktrees -maxdepth 1 -type d -mtime +3 -exec rm -rf {} \;` removes orphaned worktrees older than 3 days. Run it from a repo-root cron/systemd-timer or before each long session.
- A `vitest.config.ts` rule at the healthcare repo root that REJECTS running from there (or excludes `.claude/worktrees/**`) would be a structural fix; until it lands, this ADM is the operational rule.

**Reference:** healthcare repo session 587b5a4b May 9, 2026 — observed `12 failed (12) | 4 failed (4)` cascade when `npx vitest run` was invoked from the healthcare repo root; resolved by `cd web/` and re-running, all 11/11 + 7/7 + 10/10 panels passed cleanly.

---

## ADM-106 — Hot-Patched Code That Backs Long-Running Workers Activates at Worker Restart, Not API Container Restart (#MANDATORY — May 9, 2026 — Refines ADM-090)

**Status:** Applied (2026-05-09). **Refines:** ADM-090 (backend hot-patch via `docker cp` preserves long-running workers). **Triggered by:** Deploy 23 — the `app.ecw.cds.build_kg` ordering fix (HC-KG-INGEST-ORDERING) was hot-patched into `dlt-healthcare-api` via `docker cp` per ADM-090. The patch is verifiable in the container (importable, `--help` shows the new flag), but the CURRENTLY-RUNNING `build_kg` workers (PIDs spawned at the prior ralph-loop launch) hold the OLD module in memory and will continue running the alphabetical-first-bug code until they exit.

**Rule:** When ADM-090's hot-patch pattern is used to land a code change that is consumed by a LONG-RUNNING WORKER PROCESS inside the container (not the uvicorn HTTP server), the deploy verdict MUST clearly distinguish two activation gates:

1. **HTTP route activation** — at next `docker restart dlt-healthcare-api` (uvicorn re-imports the module graph). Existing ADM-090 already covers this case.
2. **Worker activation** — at next worker LAUNCH (e.g. `tmux kill-session -t build-kg && bash scripts/ralph-loop-build-kg.sh N`). A `docker restart` of the API container would also kill the workers, but the workers don't auto-relaunch — operator action is required regardless. Existing workers retain the old in-memory module graph and will run the OLD code until they exit naturally OR are killed.

The two gates are independent. The deploy session.md / todo.md MUST list both pending activations separately so the operator doesn't assume a single restart will activate everything.

**Implementation contract:**

- The j4c-deployment-agent's deploy verdict for backend hot-patches that touch worker-consumed modules (currently: `app.ecw.cds.build_kg`, `app.ecw.cds.gemma_extract`, anything imported transitively by build_kg) MUST add a "Pending worker activation" line to its session.md entry, naming the worker-restart command verbatim.
- Per ADM-089, the worker-restart command requires `os.kill` hygiene (the slim base image lacks `kill`) — the deploy report should reference ADM-089's recipe by line, not re-state it.
- The validation criterion (per ADM-100 for HC-KG-INGEST-ORDERING specifically) only fires AFTER worker activation. Don't claim "fix verified" until a fresh ralph-loop run has demonstrated the new behavior.

**Why this matters operationally:** without this distinction, an operator can read "Deploy 23 PASS" and assume the partition fix is now affecting ingest progress. They'd then watch `sources` count for 30 minutes, see no change, and either (a) declare the fix broken and revert, or (b) start hunting a non-existent bug. The truth is mundane — the workers are running old code; relaunching them activates the fix. The session in question observed this exact phenomenon: at deploy 23, sources had been at 10/24 for hours; the deploy was correctly verified PASS via the in-container pytest + `--help` flag check; but progress remained at 10 because the running workers were unaffected.

**Reference:** healthcare repo deploy 23 (commit `bafbc54`, 2026-05-09) — partition fix landed in container, verified importable, but workers PIDs from the 2026-05-08 08:45 UTC ralph-loop launch kept running the pre-fix code. Documented as a session.md entry with the explicit "Pending worker activation: kill+relaunch ralph-loop" line.

---

## ADM-107 — Self-Hosted Runner Health MUST Be Measured by Workflow Failure Rate, Not Just Queue Depth (#MANDATORY — May 4, 2026 — USER MANDATED)

**Status:** Applied (2026-05-04). **Pairs with:** ADM-068 (deploy binding), ADM-097 (workflow_dispatch gate), ADM-103 (scoped sudoers).

**Rule:** A self-hosted GHA runner is **not healthy** simply because (a) it shows `status: online` and (b) the queue depth is 0. Health monitoring MUST also track the **last-N workflow conclusions** for that runner's labels and treat ≥ 3 consecutive `completed failure` runs (with the same error class) as an anomaly equivalent to "queue stuck." Reporting "GHA runner healthy" when the runner is consuming jobs but every job fails is **silent CI breakage** — the failures are real but the alert never fires.

**Why this is here:** On 2026-05-04 the daily HCE2 GHA cron reported "GHA runner healthy" because `hce201` was online and the queue was empty. Both true. But every workflow run since the runner came back online (10/10) had `completed failure` — the runner was consuming jobs and immediately failing them on `sudo: a password is required` (HCE2-376). The cron's binary criterion was insufficient; an honest readout would have flagged the failure storm. The session was rescued only because a human operator inspected `gh run list` directly.

**Mandatory monitoring contract:**

1. **Three signals, all must be checked:**
   - Runner registration / status (`gh api /repos/{owner}/{repo}/actions/runners`).
   - Queue depth (`gh api /repos/{owner}/{repo}/actions/runs?status=queued`).
   - **Recent failure rate** — `gh run list --limit 10 --json conclusion`. If the last 3+ `completed` runs all have `conclusion: failure` AND the failures cluster around the same error string, that's a runner-side or provisioning anomaly, not a code regression.
2. **Anomaly thresholds (any one trips):**
   - Queue depth ≥ 3 (existing rule), OR
   - Runner status != online, OR
   - **3 consecutive `completed failure` runs** since the last `success`.
3. **Reporting form:** even on the green path, the daily probe MUST emit failure-rate metrics (e.g. "Runner online, queue 0, last-10 conclusions: 9 success / 1 failure"). The verbose form costs nothing and catches the case where the binary signals lie.

**Implementation hint** (drop into the daily cron's bash):

```bash
RECENT=$(gh run list --repo "$REPO" --limit 10 --json conclusion --jq '[.[] | .conclusion] | join(",")')
RECENT_3=$(echo "$RECENT" | cut -d, -f1-3)
if [ "$RECENT_3" = "failure,failure,failure" ]; then
  echo "ANOMALY: 3-run failure streak — investigate beyond queue depth"
fi
```

**Reference:** HCE2 daily cron output 2026-05-04 ("GHA runner healthy" while every recent run failed); HCE2-376 (the underlying provisioning gap that caused the failure storm). The cron prompt itself should be updated to include the failure-rate check after this incident.

---

## ADM-108 — Recovery Deploys MUST Probe Live State Before Re-Applying Patches (Idempotency Gate) (#MANDATORY — May 4, 2026 — USER MANDATED)

**Status:** Applied (2026-05-04). **Pairs with:** ADM-068 (deploy binding), ADM-102 (cp is not durable), ADM-090/106 (worker activation gates).

**Rule:** When a recovery deploy is invoked (a deploy that re-applies a previously-shipped patch after a suspected regression OR after an interrupted prior run), the deploy agent MUST first **probe the live system** to verify the patch is actually missing before re-applying. The probe is fixture-specific (an HTTP call, a file-content hash, an `openapi.json` field check, an in-container `python -c "import ..."`) and is documented in the deploy invocation. If the probe shows the patch is already live, the agent reports `NO_OP` and skips the re-apply. Re-applying when the patch is already present wastes effort, restarts containers unnecessarily (which under ADM-102 risks introducing the very regression it's trying to fix), and pollutes deploy logs.

**Why this is here:** On 2026-05-03 a recovery deploy was invoked for HCE2 commit `e69455f4` after the prior run was interrupted by an Anthropic rate limit. The agent's pre-deploy probe (`curl /geospatial | jq 'has("aoi_polygon")'`) returned `true` — the deploy had in fact completed before the limit hit. The agent reported `NO_OP — yesterday's run completed fully before rate-limit hit`. Without the probe, the agent would have re-cp'd the file, restarted the backend container, and (per ADM-102) potentially regressed `aoi_polygon` again as a side effect of the restart. The probe saved one full container-restart cycle and the second-order regression risk that would have come with it.

**Mandatory probe types by change kind:**

| Change kind | Probe |
|---|---|
| Backend API field added / changed | `curl <endpoint> \| jq 'has(...)'` or `.field == expected` |
| Backend behaviour fix (no schema change) | functional smoke that tickles the bug + asserts fixed behaviour |
| Frontend chunk/route added | `curl <html>; grep <chunk-hash>` or `<route>` returns 200 |
| Migration applied | `psql -c "SELECT version FROM alembic_version"` matches expected |
| Config / env change | `docker exec <c> env \| grep <key>` matches expected |
| Image rebuild (per ADM-102) | `docker inspect <c> --format '{{.Image}}'` matches the expected image SHA |
| Worker-consumed module change (per ADM-106) | `docker exec <c> python -c "import <module>; print(<module>.<symbol>)"` returns the expected new value AND a `ps` showing the worker has been relaunched since the patch |

**Agent verdict contract:**

- `PASS` — patch was missing, re-applied, post-deploy probe confirms it's now live.
- `NO_OP` — patch was already live; nothing was done. **This is a green outcome, not a partial.** Surface it in the verdict so the operator can audit that the deploy wasn't redundant.
- `FAIL` — patch was missing, re-apply ran, post-deploy probe still shows it missing. Roll back; do not silently report success.

**Reference:** Recovery deploy of `e69455f4` on 2026-05-03 (NO_OP outcome correctly reported); session log entry "Resume / re-deploy commit e69455f4". The probe-then-deploy pattern is also reflected in the @J4CDeploymentAgent's L1 cascade definition (ADM-068, where L1 = "verify the changed feature actually changed"), but ADM-108 makes the pre-deploy probe explicit so the redundancy detection is at deploy entry, not just at verification exit.

---

## ADM-109 — TDD Discipline: Tests-First, Zero Hardcoded Test Data, Given/When/Then Structure (#MANDATORY — May 4, 2026 — USER MANDATED)

**Status:** Applied (2026-05-04). **Pairs with:** ADM-014 (Tier 5 SCMAgent code review), ADM-068 (deploy binding), ADM-105 (vitest cwd discipline). **Supersedes:** the ad-hoc test conventions per project; the per-project specs (`TDD_STRATEGY.md`, `SPARC_TDD_SPRINT_PLAN.md`, etc.) are the implementation manuals — this ADM is the binding rule that scopes them.

**Rule:** Every Aurigraph project MUST follow Test-Driven Development discipline for net-new code AND for any rewrite of existing code:

1. **Red → Green → Refactor.** Write the failing test first, watch it fail with the expected error message, write the minimum code to pass, then refactor with the test as a safety net. A test that passes on first run is suspect — it either tested the wrong thing or was written after the code.
2. **Zero hardcoded test data.** No literal magic numbers, dates, IDs, paths, or bytestrings inside test bodies. Use:
   - **Pytest fixtures** (`conftest.py`) for shared state.
   - **Factory libraries** (`factory_boy` for Python, `@faker-js/faker` for TS) for generated entities.
   - **Parameterized tests** (`@pytest.mark.parametrize`, `it.each`) when the same assertion runs over a set of values.
   - **Constants module** under `tests/constants.py` (or equivalent) for project-wide shared values like the test user email — never inline. The one acceptable inline literal is a representative example in a docstring.
3. **Given/When/Then structure.** Each test body has three labelled sections (comments are sufficient; assertion library is not required). The test name reflects the GIVEN+WHEN+THEN compactly:
   ```
   def test_carbon_density_clamps_at_500_when_input_exceeds_limit():
       # Given
       est = CarbonEstimator(...)
       # When
       result = est.density(raw_value=999.0)
       # Then
       assert result == 500.0
   ```
4. **One assertion path per test.** Multiple `assert` statements are fine; they MUST all be aspects of the same behaviour. Tests that exercise two unrelated behaviours MUST be split.
5. **No production-bypass mocks.** A test that mocks the function it's testing is verifying the mock, not the code. Allowed: mocks of EXTERNAL boundaries (HTTP, DB, filesystem). Forbidden: mocks of the unit-under-test's own collaborators within the same module.
6. **Fast unit / slow integration / slowest E2E** layered with markers (`@pytest.mark.unit / .integration / .e2e`, `it()` / `it.todo()` / `describe.skip()`) so CI can run unit-only on every PR and the full pyramid pre-deploy.
7. **Coverage thresholds are floors, not goals.** HCE2 currently gates at backend 60%, frontend 65%/55%; raising the floor is allowed, lowering is not without an ADR.

**Why this is here:** A 2026-05-04 audit of the HCE2 test suite (1416 tests collected, 417 SKIPPED at module level due to `pytest.skip()` guards on stale `app.*` imports) showed how silent test rot accumulates: tests that "pass" because they don't run, tests that hardcode `2026-04-15` and break on date changes, tests that mock the SUT itself. The discipline above is what keeps the test suite a real safety net, not a green-checkmark theatre.

**No-hardcoding enforcement (mechanical check):**

```bash
# Detect inline magic in pytest bodies (heuristic — not perfect, but cheap):
grep -rn -E "assert .* == ['\"][a-zA-Z0-9_-]{8,}['\"]" tests/ \
  | grep -v "fixture\|factory\|constants" \
  || echo "PASS: no obvious hardcoded long-string assertions"
```

A pre-commit hook MAY enforce stricter rules (e.g. forbid literal UUIDs, ISO dates, file paths) per project — see project `TDD_STRATEGY.md` for the canonical pattern.

**Scope of "test suite rewrite":** When a sprint mandates a TDD rewrite of an existing module, the order is:

1. Write the new tests (failing) per the contract you want.
2. Run them, confirm they fail with the expected errors.
3. Mark old tests `@pytest.mark.deprecated` (do not delete yet).
4. Rewrite the module to make new tests pass.
5. Confirm new tests green; delete deprecated tests in the SAME commit as the module rewrite.
6. Per ADM-068, deploy through `j4c-deployment-agent`. Per ADM-108, the post-deploy probe verifies the new behaviour is actually live.

**Reference:** HCE2 TDD docs cluster — `backend/docs/testing/TDD_STRATEGY.md`, `backend/docs/planning/SPARC_TDD_SPRINT_PLAN.md`, `backend/TDD_TEST_EXECUTION_GUIDE.md`, `backend/docs/testing/TDD_QUICK_REFERENCE.md`. Audit session 2026-05-04 covered in `docs/TDD_PLAN.md` follow-up sprint plan.

---

---

## ADM-110 — No Hardcoding in Tests or Product Code; Use Named Constants, Fixtures, or Config (#MANDATORY — May 9, 2026 — USER MANDATED — Strengthens ADM-109 §2)

**Status:** Applied (2026-05-09 directive). **Pairs with:** ADM-095 (turbo `^build`), ADM-096 (vitest hookTimeout). **Replaces:** the de facto convention that was inconsistent across packages.

**Rule:** Magic numbers and inline string literals MUST NOT appear in test assertions or product logic where the value carries semantic meaning. Specifically:

1. **Test fixtures** — IDs, emails, role names, dates, percentages, and any value that two tests both assume MUST be declared as `const` at the top of the file (or in a shared `fixtures/` module). Inline `'00000000-...-aa'` UUIDs that recur across files MUST move to a `tests/fixtures/` shared module.
2. **Service code** — TTLs, batch sizes, retry counts, percentile thresholds, rate-limit windows, model names, table-row caps MUST be declared as `const` with a documenting comment explaining the value's origin (PRD, patent, empirical SLA, etc.).
3. **Seed data** — domain-specific values (NAICS codes, sector names, framework dimension keys) MUST live in seed files with named exports, not be re-inlined at consumer sites.
4. **API routes** — error type URIs, problem detail titles, and HTTP status codes MUST resolve through a single problem-doc helper, not be inlined per-route.

**Why:** Sprint hygiene scans (2026-05-09) repeatedly hit the same false-positive pattern — assertions like `expect(x).toBe(0.05)` where `0.05` is "the cache TTL fraction" in one place and "MAPE threshold" in another, with no comment to disambiguate. Tests pass but reviewer can't audit the value's provenance. Worse, when the underlying spec changes (e.g., MAPE bound moves from 5% to 10%), grep-for-`0.05` finds eleven false hits across unrelated files. Naming these values makes change-impact analysis a typecheck error rather than a manual sweep.

**How to apply:** When adding a new test file or service, ensure:
- Top of file: `const TEST_ORG_ID = '...'`, `const HORIZON_MONTHS = 12`, etc., with a one-line comment per non-obvious value.
- Cross-file fixtures: extract to `apps/<pkg>/src/__fixtures__/` (or `packages/database/src/__fixtures__/` for shared seed-style fixtures).
- Code review: reject PRs that introduce new inline magic numbers without a `// reason: …` comment immediately preceding them.

**Sweep policy:** When touching an existing file with hardcoded values, the contributor MAY hoist them to constants as part of the same commit IF doing so doesn't expand the diff beyond ~10 lines. Don't gate small fixes on a comprehensive sweep, but don't add new hardcodes to an already-bad file either.

**Reference:** AurexV4 commit series (2026-05-09 sprint hygiene + Sprint 1/3/5 ships) — repeated pattern of inline UUIDs, `60_000` timeouts, and inline percentile thresholds; this entry codifies the after-state.

---

## ADM-111 — TDD Test Suite MUST Include Mutation Testing: `mutmut` for Python, `stryker` for TypeScript (#MANDATORY — May 9, 2026 — USER MANDATED — Strengthens ADM-109)

**Status:** Applied (2026-05-09 directive — HCE2-377 Sprint 5). **Pairs with:** ADM-109 (TDD Discipline), ADM-110 (No Hardcoding). **Codifies:** the convention that line/branch coverage alone is not a sufficient quality bar — assertion strength must also be measured.

**Rule:** Every Aurigraph project's TDD test suite MUST integrate mutation testing as a parallel quality signal alongside line/branch coverage.

1. **Python projects** — use **`cosmic-ray` (≥8.4.0)** for narrow-module-path ratchet baselines (the gate); `mutmut` (~=3.5.0) MAY be kept installed for ad-hoc wide-scope exploratory runs but MUST NOT be the canonical ratchet tool for new adopters. Config in `<repo>/cosmic-ray.toml`. **Why cosmic-ray over mutmut** (codified 2026-06-02, AV11-2920): mutmut 3.x couples `paths_to_mutate` with file-copy scope — narrow mutation breaks transitive imports on FastAPI / Quarkus-style codebases where the target module imports from `app.config`, `app.middleware.*`, etc. (verified on J4C j4c-api). cosmic-ray runs tests in the real project tree (no sandbox copy), so narrow `module-path` semantics JustWork. **mutmut 4.x is NOT released on PyPI** (verified 2026-06-02; latest available is 3.5.0; the copy/mutate-separation feature exists only on the cosmic-ray side). Score-target rules (≥70% kill rate per-module, ratchet that only shrinks) apply the same to either tool. **Canonical reference adopter**: `Jeeves4Coder/j4c-api/cosmic-ray.toml` + `tests/redtests/test_mutation_baseline_redtest.py` (baseline: 69 mutants, 8 killed, 61 surviving — ratchet ceiling `EXPECTED_MAX_SURVIVING_MUTANTS=61`).

2. **TypeScript projects** — use `@stryker-mutator/core` + `@stryker-mutator/jest-runner` (or `vitest-runner`). Config in `<pkg>/stryker.config.json`. Same narrow-start, expand-by-PR principle. Mutate `src/utils/`, `src/services/api/`, and `src/hooks/` first; UI component mutation testing has poor signal-to-noise and should be deferred.

3. **Score targets** — mutation kill rate ≥ **70%** per-module (HIGH=80, LOW=70, BREAK=60 in stryker thresholds). Below 70% means the tests assert on too few branches; below 60% breaks CI.

4. **Cadence** — nightly cron on `main` (CI workflow), NOT per-PR. Mutation runs are multi-hour; per-PR would block the loop. Results MUST post to JIRA on regression — when the kill rate drops vs. the previous nightly baseline, the j4c-deployment-agent (or equivalent automation) files a bug to the project's tracking board.

5. **Coverage floor stays separate** — mutation testing strengthens but does not replace `--cov-fail-under` / `coverageThreshold`. Both gates run; both MUST pass for CI to be green.

**Why:** A test suite at 95% line coverage can still pass with assertions that are no-ops (e.g., `assert result is not None` when `result` is constructed unconditionally). Mutation testing flips operators and constants in the production code and re-runs the tests; if the suite still passes, the mutated line is "weakly covered" — the line was executed but no assertion would have flagged the change. This is the gap that line/branch coverage cannot detect. Sprint 3 of HCE2-377 added 152 characterization tests across 5 modules; without mutation testing we have no way to know whether those tests are actually load-bearing or just exercise-coverage padding.

**How to apply (per-project bootstrap):**

For Python (cosmic-ray — recommended for NEW adopters; AV11-2920):
- Add `cosmic-ray>=8.4.0` to `requirements-dev.txt`.
- Create `<repo>/cosmic-ray.toml` with:
  ```toml
  [cosmic-ray]
  module-path = "app/<narrow-module-path>.py"
  timeout = 30.0
  test-command = ".venv/bin/python -m pytest tests/<target>.py -x -q --override-ini=addopts= --no-cov --cov-fail-under=0"
  [cosmic-ray.distributor]
  name = "local"
  ```
- Verify locally: `cosmic-ray init cosmic-ray.toml cosmic-ray.sqlite && cosmic-ray exec cosmic-ray.toml cosmic-ray.sqlite && cr-report cosmic-ray.sqlite`.
- Wire nightly cron in `.github/workflows/<quality-or-mutation>.yml` (NOT in PR-trigger workflows per ADM-097).
- Add `cosmic-ray.sqlite` to `.gitignore` — it's a per-run session db.

For Python (mutmut — legacy adopters; HCE2 + projects already on mutmut may stay):
- Existing `[tool.mutmut]` config in `pyproject.toml` remains valid for wide-scope nightly runs.
- New adopters: prefer cosmic-ray unless there's a project-specific reason mutmut wins (rare).

For TypeScript:
- Add `@stryker-mutator/core` and `@stryker-mutator/jest-runner` (or `vitest-runner`) to `devDependencies`.
- Create `stryker.config.json` with `testRunner`, `mutate` glob (start with `src/utils/**`, `src/services/api/**`, `src/hooks/use*.{ts,tsx}`), `coverageAnalysis: "perTest"`, `thresholds: {high: 80, low: 70, break: 60}`.
- Add `"test:mutation": "stryker run"` to `package.json` scripts.
- Same nightly-cron rule as Python — never per-PR.

**Reference:** HCE2-377 Sprint 5 (commit `8a65597e`) — initial bootstrap of mutmut + stryker for HCE2 backend + frontend-v2; mutates the 8 Sprint-3 characterization-tested modules + the 3 frontend util/service/hook directories. First nightly baseline pending CI runner restoration (HCE2-379).

**Carve-outs:**
- **Pure data-fixture modules** (e.g., `tests/factories.py`, seed files) are NOT meaningful mutation targets — exclude via `mutate` glob.
- **Generated code** (gRPC pb2 stubs, OpenAPI clients, prisma client) is NOT a mutation target — exclude.
- **Performance-critical hot loops** that can't tolerate the perTest overhead during CI may opt out via `mutmut: ignore` line markers, but the carve-out must be explicitly noted in the module docstring with a JIRA reference.

---

## ADM-112 — Karate DSL as the API Contract Test Layer Alongside pytest + Vitest + Playwright (#MANDATORY — May 9, 2026 — USER MANDATED)

**Status:** Applied (2026-05-09). **Pairs with:** ADM-Component-1 #TestStackMandate (May 8, 2026), ADM-109/110 (TDD discipline + no-hardcoding), ADM-097 (GHA self-hosted runners), ADM-068 (deploy mandate). **Strengthens** the test pyramid by adding a deterministic API-contract layer that is framework-agnostic and reads as plain text.

**Rule:** Every Aurigraph project that exposes an HTTP/gRPC API MUST add a Karate DSL test suite at `tests/karate/` covering its public surface as the **third active layer** of the #TestStackMandate gate (now 4 layers total: pytest/Vitest unit → Karate API contract → Playwright frontend E2E → mutation gates per ADM-111). Karate is mandatory wherever a project has any externally-callable HTTP endpoint; it is NOT optional, and it is NOT a substitute for pytest's unit/integration coverage. CI failure on the Karate layer is a hard merge gate — same as the other three layers.

**Layout (canonical, every project):**

```
tests/karate/
├── karate-config.js          # env-driven config (NO hardcoding per ADM-110)
├── karate.jar                # standalone runner (auto-downloaded by run.sh)
├── run.sh                    # local + CI entry point
├── README.md
└── features/
    ├── smoke/                # @smoke — public endpoints, no auth, post-deploy probe
    ├── auth/                 # login, callback, RBAC negative paths
    ├── <domain>/             # one dir per Bounded-context (kgraph, integrations, …)
    └── …
```

**Why Karate (selection rationale):**
1. **Framework-agnostic.** Works against any HTTP/gRPC backend (FastAPI, Quarkus, Express, Quarkus). One toolchain across the Aurigraph fleet.
2. **Plain-text Gherkin assertions.** Failures are deterministic and easy to diff in PRs; less brittle than Python/JS HTTP mocks across refactors.
3. **No additional language toolchain.** Standalone JAR + JDK 21 (already installed for the Aurigraph V12 / DLT runners). No Maven/Gradle scaffolding.
4. **Performance baselines via Karate Gatling** (future) without rewriting tests.
5. **Anti-drift.** API contract changes that pytest mocks would silently absorb (e.g., the `/auth/login` `{token}` → `{data:{access_token}}` shape change documented as MEV-Shield #TestStackMandate sub-rule) cannot pass a Karate run that asserts the actual wire shape.

**Behaviour contract:**

1. **Config is env-driven.** `karate-config.js` reads `E2E_BASE_URL`, `E2E_ADMIN_TOKEN`, `E2E_MEMBER_TOKEN`, `KARATE_ENV` from system properties OR environment variables. Hardcoded URLs/tokens in feature files or config are forbidden (per ADM-110).
2. **Tagging discipline.** Use `@smoke`, `@needsAdmin`, `@needsMember`, `@slow` tags. CI selects subsets by tag; default PR run is "everything except `@slow`". The smoke subset MUST run in <30s.
3. **Token-aware skipping.** Features tagged `@needsAdmin` / `@needsMember` MUST `karate.abort()` early when their token is unset, never fail. This lets dev environments without secrets still get partial coverage.
4. **Reports are CI artifacts.** Each run writes to `tests/karate/reports/<TS>/`. CI uploads on failure with 7-day retention. Local runs use the same convention.
5. **Self-hosted runner.** Per #CICD / ADM-097: the `karate` GHA job runs on `[self-hosted, linux]` with JDK 21 from `actions/setup-java@v4`. `ubuntu-latest` is forbidden for production-target Karate runs.
6. **Verdict gate.** The `teststack-verdict` job in `.github/workflows/teststack.yml` MUST aggregate all four layers (pytest, vitest, karate, playwright). Any one red = merge blocked. No override.
7. **Standalone JAR pin.** `run.sh` pins `KARATE_VERSION` (default 1.5.1 as of 2026-05-09). Bumps go through a normal PR with the `tests/karate/run.sh` and karate jar replaced + a Karate report attached to the PR.
8. **No state leakage.** Tests that mutate state (e.g. `@needsAdmin` ingest tests) MUST clean up via Background or a `cleanup.feature` `* call`. State leakage between runs is forbidden — production hosts cannot accumulate test artifacts.
9. **Karate writes test data through the same API as humans.** No backdoor DB seeding for Karate scenarios; the suite is a black-box probe of the deployed surface, never a privileged client.

**Reference impl (J4C portal, this commit):**
- Config: `tests/karate/karate-config.js`
- Runner: `tests/karate/run.sh`
- Seed features: `tests/karate/features/{smoke/healthz,auth/login,kgraph/data,integrations/health}.feature`
- Workflow: `.github/workflows/karate.yml` + Layer 3.5 in `teststack.yml` (`needs: [pytest, vitest]`, before playwright; verdict needs all 4)
- Tag examples: `@smoke` for healthz, `@needsAdmin` for the integrations & kgraph-ingest features.

**Carve-outs:**
- Pure libraries / internal services without an HTTP surface (e.g. a CLI build script) are exempt.
- Greenfield projects in their first 7 days may run with the smoke layer only; the full feature catalogue must land before the project leaves "early access" status.
- Performance contract tests (Gatling profile) are NOT yet mandatory — flagged for a future ADM after the J4C reference suite proves stable for ≥2 sprints.

**Reference:** J4C commit (this entry) introducing `tests/karate/` + `.github/workflows/karate.yml` + `teststack.yml` 4-layer verdict, 2026-05-09. MEV-Shield reference impl and the `auth/login` shape-drift incident that motivated it: ADM Component 1 #TestStackMandate sub-rule "pytest as a value-add even when technically exempt" (May 9, 2026).

---

## ADM-113 — Bidirectional ADM / CLAUDE.md / <project>.md Sync (#MANDATORY — May 10, 2026 — USER MANDATED)

**Status:** Applied (2026-05-10). **Pairs with:** ADM-101 (durable ADM auto-pull + watcher.py atomic-rename), ADM-076/076-A (kgraph-first reads + ADM file watcher re-ingest), ADM-086 (per-repo operational profile in `docs/<Project>.md` + slim `CLAUDE.md` pointer). **Replaces** the implicit assumption that "ADM update" is unidirectional.

**Rule:** Any `ADM update` / `sync ADM` invocation is **bidirectional**. The sync direction is determined by **which side is ahead at run time**, NOT by a fixed source-of-truth. The rule applies to **three file classes** simultaneously:

| File class | Canonical location | Mirrored locations |
|---|---|---|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | `<project>/.claude/CLAUDE.md`, `Jeeves4Coder/CLAUDE.md` |
| `ADM.md` | `~/.claude/ADM.md` | `<project>/.claude/ADM.md`, `Jeeves4Coder/ADM.md` |
| `<project>.md` | `<project>/<project-name>.md` (per ADM-086) | `Jeeves4Coder/<project-name>.md` if J4C-managed |

After every sync, all copies of a given file class MUST be byte-identical (verify with `diff -q`).

**Why:** Multiple agents write directly to different copies — the J4C self-sync watcher, mutation-testing automation, per-project #AAT loops, and the user's manual edits all run on independent schedules. A unidirectional `canonical → J4C` model silently drops content from whichever side ran most recently. The **May 10, 2026 inversion incident** is the precedent: canonical `~/.claude/ADM.md` was at v2.10.7 (7256 lines, behind by ADM-109/110/111/112) while J4C origin/main was at v2.12.4 (7550 lines, ahead). A naive `canonical → J4C` push would have regressed J4C; `git push` was correctly rejected by the remote, the bad local commit was reset, and the sync was reversed J4C → canonical instead.

**How to apply (every "ADM update" invocation):**

1. **Direction-check FIRST.** Before any `cp` or `git push`:
   - Compare `wc -l` across all three copies of the file class.
   - Compare the version-string tail (e.g. `tail -3 ADM.md | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1`).
   - Compare `git log -1 --format=%cI` (committer date) on the J4C side.
   The largest line-count + highest version + most-recent timestamp identifies the **ahead-side** for THIS sync.
2. **Content-aware tiebreak.** If line counts are equal but content differs (concurrent edits), prefer the side with the higher version string. If versions also match, do `diff` and abort with a manual-merge prompt — never auto-pick.
3. **Backup before overwrite.** Each side gets a `.bak-YYYYMMDD` backup before being overwritten. Backups live alongside the file (not in `/tmp`).
4. **Mirror to all locations.** After identifying the ahead-side, `cp` to the other two. Verify byte-identical with `diff -q`.
5. **Git-track project-local.** For `<project>/.claude/ADM.md` (tracked in the project repo), commit on the project's **main branch** (V12, main, etc.) — NEVER on a feature branch. Commit message format: `docs(adm): sync ADM from <ahead-side> — <date> (vX.Y.Z → vA.B.C)`.
6. **Push J4C.** For `Jeeves4Coder/ADM.md`, commit + `git push origin main`. If push is rejected, that's a **direction-check failure** — re-run step 1, do not force-push.
7. **No git for canonical.** `~/.claude/` is not git-tracked; `cp` is the only operation.
8. **Skip-if-equal.** If all copies already byte-match the canonical-ahead, the sync is a no-op — log and exit.
9. **`<project>.md` per ADM-086.** Per-repo state files (`aurigraph-dlt.md`, `mevshield.md`, `j4c-portal.md`, …) follow the same direction-check + mirror discipline within their project tree.

**Detection signals (when to re-check direction):**
- `git push` rejected with `! [rejected] main -> main (fetch first)` → remote moved → reverse direction likely.
- `wc -l` differs between any two copies → one side has accumulated edits → check version tail.
- `~/.claude/ADM.md` modified time newer than J4C `git log -1` time → canonical is ahead → forward-sync.
- `git log origin/main..HEAD` non-empty on J4C local but those commits weren't authored in this session → likely stale local commits → reset to origin first.

**Anti-patterns (forbidden):**
- Hardcoded "canonical → J4C" push without direction check.
- Committing the project-local ADM update on a feature branch (e.g. `feat/wc-wire-s1-kickoff`) — fragments project history; ADM updates belong on `V12`/`main`.
- Force-pushing J4C `origin/main` to "win" — J4C may have a self-sync watcher that already re-synced; `git reset --hard origin/main` is the correct primitive.
- Skipping the `.bak-YYYYMMDD` backup step — without it, accidental regressions are unrecoverable.

**Reference incident (May 10, 2026 — inversion catch):**
- Pre-sync: `~/.claude/ADM.md` v2.10.7 (7256 lines), `Jeeves4Coder/ADM.md` v2.9.6 (5075 lines), J4C origin/main v2.12.4 (7550 lines).
- "ADM update" naively committed `canonical → J4C` overwrite (`9c1b9f5f0`).
- `git push origin main` → REJECTED (`fetch first`).
- Investigation: J4C origin had ADM-109/110/111/112 from the J4C self-sync watcher — canonical was BEHIND.
- Recovery: `git reset --hard 6f0811fcc` (drop bad commit) → `git reset --hard origin/main` (drop 4 stale local-only commits) → `cp J4C/ADM.md ~/.claude/ADM.md` → propagate to `Aurigraph-DLT/.claude/ADM.md`. All three end at v2.12.4 (7550 lines, byte-identical).

**Carve-outs:**
- New rule additions (like THIS one) bypass the bidirectional dance because the adding side IS the canonical-ahead by construction. After adding, the standard sync flow (step 4–6) kicks in.
- Greenfield projects without a `<project>.md` yet (per ADM-086) are exempt from the third file-class until the file is bootstrapped.
- Worktrees (`.claude/worktrees/agent-*/.claude/ADM.md`) are session-scratch only — they MUST NOT participate in the bidirectional sync; they're cleaned by their parent #AAT agent.

---

## ADM-114 — Canonical Name: Aurigraph Development Model Harness (#ADM) (USER MANDATED — 2026-05-10)

**ADM** expands to **Aurigraph Development Model Harness**.

Previous informal expansion "Aurigraph Dev Mode" is retired. All documentation, headers, definitions, and verbal references use the canonical name going forward.

**Why "Harness"**: the word captures that ADM is not just a model or a methodology document — it is an active execution harness: it binds agents, tools, test gates, deployment pipelines, credential management, knowledge graphs, and quality mandates into a single operative framework that runs automatically. "Model" alone (as in a reference architecture) understates what ADM does in practice; "Harness" signals that ADM *drives* the work, not merely *describes* it.

**Scope of change:**
- Line 1 heading: `# Aurigraph Development Model Harness (#ADM) — Complete Framework`
- Overview definition block (line ~57): updated inline
- Two cross-references in the J4C integration section: updated inline
- All future ADM entries, CLAUDE.md references, and verbal usage MUST use the canonical expansion

**Carve-outs:**
- Existing JIRA ticket titles, commit messages, and archived session logs referencing "Dev Mode" are historical artefacts — do NOT retroactively rewrite them.
- The hashtag `#ADM` and the numbered registry `ADM-NNN` are unchanged.

---

## ADM-115 — Token-Optimized Kgraph Access: Task-Scoped Queries Only (USER MANDATED — 2026-05-10)

**Rule:** The J4C Knowledge Graph is purpose-built for **maximum context coverage at minimum token cost**. Access it with **task-scoped precision** — never load entire flat docs when the kgraph can answer the query in a fraction of the tokens.

**Why:** The kgraph is a pre-indexed, semantically structured representation of all Aurigraph architectural knowledge. A targeted neighbor query (`GET /api/v3/kgraph/neighbors/{id}`) returns the exact subgraph relevant to the task in <5KB. Loading `context.md`, `session.md`, or all of `ADM.md` for the same answer can cost 50–200KB of tokens. The kgraph exists precisely to eliminate that waste. (USER MANDATED 2026-05-10 — "read the kgraph as optimally required for the tasks on hand, not the entire context.md")

**Access hierarchy (lowest → highest token cost — stop at the first level that answers):**

1. **`GET /api/v3/kgraph/neighbors/{node_id}`** — fetch the immediate subgraph for a specific entity (ADM entry, component, project, ticket). Use when you know the entity. Typical response: <5KB.
2. **`GET /api/v3/kgraph/data` with client-side filter** — fetch the full snapshot and filter to relevant node types in the response. Use when the entity ID is unknown. Typical response: 20–80KB (still far less than loading flat docs).
3. **`GET /api/v3/kgraph/external/{project}/{graph}`** — per-project code/architecture graphs (ADM-080). Use only for project-specific structural queries (file topology, call graphs).
4. **Flat docs (`context.md`, `session.md`, `ADM.md`)** — **last resort only**, and even then read only the relevant section (use `offset`/`limit` on Read, not full file loads). Use only when the kgraph response is empty, unreachable, or explicitly incomplete for the query.

**Forbidden patterns:**
- Loading `context.md` or `session.md` in full at session start as a substitute for kgraph queries.
- Calling `GET /api/v3/kgraph/data` and processing the entire graph when only 1–3 nodes are relevant.
- Reading all 7000+ lines of `ADM.md` to find a single decision when `neighbors/adm_entry:<sha>` returns that decision's node + edges in one call.
- Treating kgraph as a "nice to have" — it is the **primary and mandatory** context source per ADM-076.

**Query decision tree (before any Read tool call):**
```
"I need context about X"
  → Do I know X's node ID?
      YES → GET /neighbors/{id}               (stop here if sufficient)
      NO  → GET /kgraph/data + filter client-side
              → Still missing? → READ flat doc, specific section only
                  → Still missing? → kgraph may be stale → surface as kgraph gap
```

**Token budget guidance:**
| Access method | Typical tokens | When to use |
|---|---|---|
| `/neighbors/{id}` | ~300–800 | Known entity, focused expansion |
| `/kgraph/data` filtered | ~1,000–4,000 | Unknown entity, type-filtered sweep |
| Flat doc section (offset+limit) | ~500–3,000 | kgraph gap, specific known section |
| Flat doc full load | ~10,000–80,000 | **Forbidden unless kgraph unreachable** |

**Amends ADM-076:** ADM-076 mandated kgraph-first reads. ADM-115 strengthens it with explicit token-optimization discipline: *how* to read the kgraph (task-scoped, neighbor-first) is now as mandatory as *whether* to read it.

---

## ADM-116 — Pre-Deployment #Testplan: Inherit TDD Suite + Functional + Regression + Smoke (#MANDATORY — May 11, 2026 — USER MANDATED)

**Status:** Applied (2026-05-11). **Pairs with:** Component 1 (TDD), ADM-056 / ADM-057 (security + infra gates), ADM-068 / Component 5–6 (deploy + verification cascade), ADM-097 (self-hosted CI), ADM-109–ADM-112 (TDD discipline, Karate contract layer, Playwright E2E mandate, mutation testing per ADM-111). **Clarifies:** The **deploy verification cascade (L1→L4)** is **not** ADM-056; ADM-056 is the **OWASP** gate (see below).

**Rule:** No production deployment proceeds without an **executed #Testplan** that (1) **inherits** automated scope from the **TDD test suite** (unit/integration layers already mandated in Component 1), (2) adds an explicit **functional test plan** (acceptance criteria / role-based flows), (3) defines **regression** coverage for the release delta and unchanged collateral surfaces, and (4) mandates **smoke** gates per the frequency rules below. Execution MUST follow ordinary software-engineering practice: **plan → run → record evidence → go/no-go**.

### 1. Mandatory stack tooling (by language — same toolchain as Component 1)

| Stack | ADM-prescribed tooling |
|-------|-------------------------|
| Node / TypeScript | **Jest or Vitest**, **Supertest** (HTTP/API), **React Testing Library** (UI). |
| Frontend browser E2E | **Playwright** (`@playwright/test`) — ADM labels this **“Frontend E2E (Playwright — ALL projects)”** with Page Object patterns and CI snippets (Component 1). |
| Python (FastAPI) | **pytest**, **pytest-asyncio**, **httpx**; markers for unit / integration / e2e. |
| Java / Quarkus | **JUnit 5**, **Mockito**, **REST Assured**, **TestContainers**. |

**Parallel mandated layers** (where applicable to the project — see ADM-111 / ADM-112): **mutation testing** (Stryker / mutmut) and **Karate** API contract suites at `tests/karate/` are **merge and release gates**, not optional substitutes for unit tests.

### 2. Security & infrastructure gates (numbered ADMs)

- **ADM-056 — OWASP:** Security test stages run **after build** and block deploy until passing (`test:owasp:*` or project-equivalent).
- **ADM-057 — nginx / HTTPS:** Edge validation runs when nginx/TLS/routing changes (`test:nginx:*` or project-equivalent).

### 3. Deploy verification cascade (L1 → L4) — Component 5–6 / @J4CDeploymentAgent

**Do not conflate with ADM-056.** The **L1→L4 cascade** is **functional/regression/E2E depth**, not OWASP:

| Level | Typical scope |
|-------|----------------|
| **L1** | Unit + integration on **changed** components |
| **L2** | **Smoke** on unchanged platform (collateral-damage check) |
| **L3** | **Regression** on full release diff |
| **L4** | **Full E2E** when L3 fails, policy requires it, or enhancement crosses UI/API boundaries |

Failures escalate per deploy-agent / project playbook (JIRA logging, rollback consideration).

### 4. Smoke vs E2E frequency (release hygiene)

- **Smoke:** Run on **every build** in CI where feasible; run **full-platform smoke** as a **pre-deployment go/no-go** on the target environment.
- **E2E (Playwright + fleet harnesses):** Run for **enhancements** that alter user journeys, auth, routing, or cross-service contracts; expand to **full E2E** when the cascade reaches **L4** or release notes demand it.

### 5. Defect handling — JIRA

Every failure during #Testplan execution MUST produce or update a **JIRA** issue (bug/task) with repro, logs, build/deploy correlation, and ownership. Silent deferrals without a ticket are forbidden for production-bound releases.

### 6. #Testplan artifact (every project)

Each repository MUST maintain a **detailed, version-controlled #Testplan** (recommended path: `docs/Testplan.md` or `docs/TESTPLAN.md`) containing at minimum:

- Scope (in-scope paths, roles, environments)
- Inherited automated suites (commands from TDD/CI)
- Functional scenarios (acceptance / exploratory where needed)
- Regression matrix (delta vs baseline)
- Smoke checklist (build + pre-deploy platform)
- Entry/exit criteria and **evidence** (CI run URLs, reports, timestamps)
- Owners and schedule

### 7. Fleet rollout via J4C

Updates to the **canonical #Testplan template** and ADM test-policy changes propagate through **J4C**: ingest per **ADM-113** where applicable; **push to J4C origin** so all downstream project repos can merge or cherry-pick aligned templates. Individual projects remain responsible for repo-specific acceptance criteria and commands.

---

## ADM-117 — ADM Diff: Local vs J4C `origin/main` Latest (#MANDATORY — May 11, 2026 — USER MANDATED)

**Status:** Applied (2026-05-11). **Pairs with:** ADM-113 (bidirectional sync + direction-check), ADM-101 (durable ADM auto-pull / watcher), ADM-086 (footer semver is authoritative when header drift exists).

**Rule:** Before treating an **ADM update** as complete, committing project-local `ADM.md`, or **pushing** ADM to **`Jeeves4Coder`**, every agent MUST **diff the local ADM revision against the latest J4C-published revision on `origin/main`** — not only line counts or footer semver in isolation. Remote may have moved since the last clone; **fetch-first + byte-level compare** prevents silent regressions and complements ADM-113 step 1.

**Scope — which paths participate:**
- **`ADM.md`** at the J4C git repository root (path varies by clone layout; see **nested-repo guard** below).
- Mirrored copies under **`docs/ADM.md`** and **`docs/global-config/ADM.md`** MUST stay byte-identical to root **`ADM.md`** inside J4C after sync; diff those against local copies only **after** confirming root **`ADM.md`** matches `origin/main`.

**Procedure (minimum):**
1. **`git fetch origin`** in the **J4C git repository** (the repo whose `origin` is **`Aurigraph-DLT-Corp/Jeeves4Coder`** or successor remote).
2. **Resolve git root:** `git rev-parse --show-toplevel` — do not assume `<clone>/ADM.md` depth; some layouts use `<clone>/Jeeves4Coder/ADM.md`.
3. **Byte compare** local canonical **`~/.claude/ADM.md`** (and any project-local **`.claude/ADM.md`** about to be committed) against the remote object:
   - `diff -q <(git show origin/main:ADM.md) ~/.claude/ADM.md` — adjust **`origin/main:ADM.md`** if the tracked path differs (e.g. monorepo subfolder — use the path J4C actually tracks).
   - If `diff -q` is unavailable, compare **`shasum -a 256`** (or `wc -c` + `cmp`) of both sides.
4. **Footer semver check:** On both sides, read the **`Last Updated`** tail (footer wins for registry semver when the long header block disagrees — project operational docs cite this discipline).
5. **Interpretation:**
   - **No diff** → local matches **latest J4C** for that path — ADM-113 **skip-if-equal** applies; proceed or no-op.
   - **Diff** → run full **ADM-113 direction-check** (`wc -l`, semver, committer timestamps, content tie-break). Do **not** push until ahead-side is chosen and all mirrors are **`diff -q`** aligned.
6. **Nested-repo guard:** Workstations MAY nest the real repo at **`…/Jeeves4Coder/Jeeves4Coder/`**. Always resolve **`show-toplevel`** before `git show origin/main:…` path assumptions.

**Anti-patterns (forbidden):**
- **`git push`** of ADM without **`git fetch origin`** in the same session (stale **`origin/main`** reference).
- Assuming **`wc -l` equality** implies identical content — concurrent edits can preserve line count; require **`diff -q`** or hash.
- Using only **`HEAD`** without **`origin/main`** — local **`main`** may be ahead/behind remote; the **latest fleet revision** is **`origin/main`** after fetch.

**Carve-outs:**
- **New ADM rows** added only under **`~/.claude/ADM.md`** with no J4C commit yet — local is ahead **by construction**; still **fetch** to prove **`origin/main`** did not gain concurrent edits, then apply ADM-113 steps 4–6.
- **No `origin` remote** (greenfield offline clone) — skip remote diff until **`origin`** exists.

---

## ADM-118 — Missing #Testplan: E2E Plan First, Execute E2E, JIRA, Then Proceed (#MANDATORY — May 11, 2026 — USER MANDATED)

**Status:** Applied (2026-05-11). **Pairs with:** ADM-116 (pre-deployment #Testplan artifact + JIRA on failures), Component 1 (**Playwright** frontend E2E — ALL projects), ADM-112 (Playwright E2E mandate), ADM-068 / Components 5–6 (deploy only after gates). **Does not replace** ADM-116 inherited TDD / functional / regression / smoke scope — this entry adds a **hard ordering rule** when the **#Testplan file itself is absent**.

**Rule:** If the repository **does not yet have** a version-controlled **#Testplan** at the prescribed path (**`docs/Testplan.md`** or **`docs/TESTPLAN.md`**) **or** the file exists but **fails ADM-116 §6 minimum content** (scope, inherited suites, functional scenarios, regression matrix, smoke checklist, evidence, owners — treated as *no plan*), the team MUST **not** proceed with production-bound deployment, release tagging, or “ship” milestones until the following sequence completes:

1. **Author an E2E-first comprehensive test plan** — a written artifact (same paths as ADM-116) that **prioritizes end-to-end coverage**: full critical user journeys (auth → primary workflows → edge exits), environment matrix (local/stage/prod-like), test data / fixtures / roles, prerequisites, **explicit pass/fail criteria**, and linkage to **automated E2E commands** (typically **Playwright**). The plan MUST enumerate scenarios automation will cover and any gaps requiring manual E2E checks.
2. **Execute E2E tests** against the target surface per Component 1 / ADM-112 — run the suite(s) referenced in the plan; capture logs, traces, and reports as **evidence** appended or linked from the #Testplan.
3. **Log every failure to JIRA** immediately (bug/task) with repro, logs, correlation IDs, build/deploy SHA, and owner — same bar as ADM-116 §5; **no silent skips**.
4. **Then proceed** — only after (a) the #Testplan file meets ADM-116 §6, (b) E2E execution for the current delta is **complete** (green **or** all reds ticketed with accepted disposition), and (c) remaining ADM-116 gates (inherited suites, functional/regression/smoke as applicable) are satisfied.

**Ordering rationale:** Without a committed plan, “running E2E” is ad hoc and non-repeatable. **Plan → run → JIRA → proceed** ensures fleet traceability and prevents deploy-agent or release flows from bypassing documented E2E intent.

**Anti-patterns (forbidden):**
- Deploying or releasing while **`docs/Testplan.md`** / **`docs/TESTPLAN.md`** is missing or below ADM-116 §6 minimum — **even if** unit tests pass.
- Creating only unit/integration docs while deferring **E2E plan sections** — ADM-118 requires **E2E comprehensiveness** in the **first** authored plan when none existed.
- Closing E2E failures in chat or internal notes **without** a **JIRA** record.

**Carve-outs:**
- **Pure libraries / headless services with no UI or external HTTP surface** — follow ADM-116 carve-outs; E2E UI plans may be replaced by **API contract / integration journey** plans documented equivalently in #Testplan with **no Playwright** requirement where ADM-112 exempts the project.
- **Hotfix** path still requires a **minimal** #Testplan addendum for the hotfix scope + executed automated checks; waiving E2E entirely requires **explicit** project steering documented in JIRA.

---

## ADM-119 — Feature / Architecture Delta → Update Regression + Master #Testplan (#MANDATORY — May 11, 2026 — USER MANDATED)

**Status:** Applied (2026-05-11). **Pairs with:** ADM-116 (§6 #Testplan artifact incl. regression matrix + smoke), ADM-118 (missing-plan discipline), Component 1 (TDD + Playwright / Karate layers), ADM-112 (Playwright). **Rule:** Every **new feature** or **new architectural component** MUST land together with an **updated regression test plan** and an **updated master #Testplan** — not as a deferred chore.

**Triggers (non-exhaustive — when ANY of these occur, this ADM applies):**
- **Feature:** new user-facing capability, API route surface, workflow, permission path, billing hook, integration, or materially changed business rules.
- **Architectural component:** new module/layer boundary; new runtime dependency (queue, cache, identity broker); routing/TLS/ingress change; DB schema/migration affecting contracts; split monolith boundaries; new deployment unit or sidecar.

**Definitions:**
- **Master #Testplan:** the repository’s authoritative **`docs/Testplan.md`** or **`docs/TESTPLAN.md`** (ADM-116 §6 — scope, inherited suites, functional scenarios, **regression matrix**, smoke checklist, evidence, owners).
- **Regression test plan:** the **regression matrix** (delta vs baseline, unchanged collateral surfaces, rerun cadence) within that same file **or** a **linked** regression appendix **`docs/RegressionTestplan.md`** / **`docs/regression-plan.md`** **only if** the project has explicitly adopted a split layout — in which case **both** files MUST be updated atomically and cross-linked from the master #Testplan.

**Minimum updates (same PR as the change, or the immediate stacked PR before merge to protected `main` — no release between):**
1. **Regression matrix:** add/adjust rows for new/changed surfaces; identify **collateral** areas at risk; specify **who reruns** what after merge.
2. **Master #Testplan:** refresh **scope**, **inherited automated suite commands** (unit/integration/Karate/Playwright as applicable), **functional scenarios** touching the delta, **smoke checklist** if critical paths shift, **evidence** expectations (CI jobs, reports).
3. **Traceability:** reference the **JIRA Epic/Story** driving the change and the **PR** that introduces it.

**Anti-patterns (forbidden):**
- Merging a feature or architectural change with **no diff** to #Testplan regression/master sections — including “TODO follow-up PR”.
- Treating regression updates as **optional documentation** — they are **release hygiene gates**, same class as ADM-116 pre-deploy #Testplan execution.
- Updating only **automated tests** without updating the **written plan** — code and plan drift breaks fleet audits.

**Carve-outs:**
- **Doc-only** edits (typography, comments in markdown, ADR wording) with **zero** behavioral or routing impact — no mandatory matrix expansion (still update #Testplan if the doc corrects test assumptions).
- **Revert-only** PR restoring prior SHA — restore matching #Testplan section from that baseline unless partial revert demands partial plan trim.

---

## ADM-120 — GitHub Release + Release Notes Bound to Every Deployment (#MANDATORY — May 12, 2026 — USER MANDATED)

**Status:** Applied (2026-05-12). **Pairs with:** ADM-068 (`@J4CDeploymentAgent` deploy binding), Components **5–6** (deploy + verification), ADM-073 (image–source drift correlation via immutable tags), ADM-116 / ADM-118 (pre-deploy evidence discipline). **Rule:** Every **deployment** that promotes artifact(s) to an **environment tracked as release-bearing** (typically **staging** and **production**; exact names per project **`docs/<Project>.md`**) MUST be **traceable on GitHub** to a **`Release`** object (GitHub Releases UI — **tag + title + body**) that carries both a **release number** and **release notes**.

**Definitions:**
- **Release number:** the immutable **Git tag** published alongside the GitHub Release (e.g. **`v2.4.1`**, **`2026.05.12.1`** — project adopts **semver** or **dated/build** scheme in its operational profile; the scheme MUST be documented and consistently applied).
- **Release notes:** the GitHub Release **body** (Markdown) listing **what shipped**, **risk/migrations**, **rollback posture**, **JIRA Epic/Story keys**, and the **`git` SHA(s)** / image digest(s) that the deploy agent or pipeline applied.

**Minimum expectations:**
1. **Before or during** the deploy pipeline step that touches the target environment, create or update the GitHub **`Release`** so its tag matches the artifact built from that commit — **no anonymous prod deploys** that cannot be named by tag from the GitHub UI.
2. **Release notes MUST NOT be empty** for production — even a minimal bullet list beats silence; link **`CHANGELOG.md`** only as a supplement, not as a substitute body.
3. **Deploy evidence** (session log, deploy-agent transcript, runbook, or ADM-116 #Testplan attachment) MUST cite **`Release` URL** or **`tag`** so auditors correlate **running bits ↔ GitHub**.

**Anti-patterns (forbidden):**
- Promoting **production** from **`main` HEAD** without a corresponding **GitHub Release + tag** visible on the repo for that promotion window.
- Using **only** a branch tip pointer (“deployed main”) as the sole identifier — tags/releases are mandatory for fleet correlation.
- Shipping **production** with placeholder release bodies (**“TBD”**, empty description) except under **emergency carve-out** below.

**Carve-outs:**
- **Local-only / disposable developer environments** — no GitHub Release required when no shared environment is mutated (document per-project).
- **Emergency production hotfix:** MAY publish **abbreviated** notes within **4 hours** but MUST still create the **tag + Release** immediately with incident ticket, suspect SHA, and “full notes to follow” — then amend body before incident closure.
- **Projects not hosted on GitHub** — substitute **equivalent VCS release artifact** (GitLab Release, Gitea tag + changelog) documented in **`docs/<Project>.md`**; the **same traceability bar** applies.

---

## ADM-121 — J4C Fleet Service-Admin JWTs + Playwright Token-Skip Hygiene (#MANDATORY — May 12, 2026 — USER MANDATED)

**Status:** Applied (2026-05-12). **Pairs with:** ADM-071 (RBAC DB-authoritative roles), ADM-110 / ADM-112 (env-driven E2E tokens), ADM-116 (CI evidence). **Rule:**

1. **Service principals.** For **Aurigraph-classified** fleet projects (registry + monitor defaults per `github_org` / `github_repo` / `*.aurigraph.io` heuristic), J4C exposes **`GET /api/v3/projects/registry/aurigraph-project-candidates`** (superadmin) and **`POST /api/v3/projects/registry/issue-service-admin-tokens`** (superadmin). Each issuance upserts **`project-admin-{project_id}@bots.aurigraph.io`** into **`user_roles`** with role **admin**, then returns signed J4C JWTs (`token_kind=project_service_admin`, `project_id` claim). Optional **`persist_openbao: true`** writes **`j4c_service_admin_jwt`** into **`kv/aurigraph/{project_id}/credentials`**. **Forbidden:** minting via these endpoints without superadmin; storing tokens in git.

2. **Playwright / local E2E.** Helpers that inject `localStorage` JWTs MUST **`test.skip`** when the role’s **`E2E_*_TOKEN`** is unset — **never throw** — so CI and laptops without secrets get a clean **skipped** matrix instead of false failures (see `j4c-react/e2e/_lib/auth.ts`).

**Anti-patterns (forbidden):**
- Using fleet service JWTs for interactive human SSO (bots subdomain is automation-only).
- Dropping **`user_roles` upsert** while issuing admin-scoped tokens (RBAC would downgrade to member).

---

## ADM-122 — FS-MTP Recursive Testing for Early Plan Closure (#MANDATORY — May 12, 2026 — USER MANDATED)

**Status:** Applied (2026-05-12). **Pairs with:** ADM-116 / ADM-118 (#Testplan authoring + execution evidence), ADM-112 / ADM-111 (Karate + pytest/Vitest + mutation gates), Component 1 (TDD), Component 2 (#AAT QA stream), **FS-MTP** implementation (`j4c-api/app/routers/mtp.py`, portal **FS-MTP** panel, `docker-compose.yml` **`FS_MTP_AUTOMATION`**). **Rule:**

**Objective.** Increase **coverage**, **defect yield**, **closure rate**, and **validation & verification (V&V)** for @QAQCAgent / TestTeam and #AAT by running the **Full-Stack Master Test Plan (FS-MTP)** as **recursive execution** — not a single batch run — so problems are found **early** and the **written plan** converges to **complete** before Approver sign-off and deploy.

**Definitions:**
- **FS-MTP**: The **registry + suites + run history** for full-stack quality (API, UI automation where applicable, smoke, regression per ADM-116), exposed via J4C **`/api/v3/mtp`** and recorded in PostgreSQL; optional **background smoke** when **`FS_MTP_AUTOMATION=true`**.
- **Recursive pass**: A **sequence** of test executions where **pass N+1** is intentionally triggered by **outcomes of pass N** — failures → **narrowed scope** (component, route, role, data fixture) → **added or revised cases** → **re-execute** until pass or explicit **JIRA waiver** with risk owner.
- **Early closure**: Achieved when (1) **all suites in scope** for the change have **recorded PASS** in FS-MTP or CI with linked evidence, (2) **open defects** are either fixed and re-verified or **tracked** with severity and deploy gate decision, (3) **#Testplan** and **regression matrix** match the **actual** automated scope (no plan–code drift).

**Mandatory workflow (#QAQC / #AAT):**
1. **Pass A — Smoke & sanity (minutes):** Run the smallest set that proves the environment matches the plan (health, auth sanity, critical path). J4C may use **`GET /api/v3/kgraph/health`** as a **cheap FS-MTP adjunct** (ADM-076) alongside service `/health` probes.
2. **Pass B — Fast automated layers:** Unit + contract (Karate where ADM-112 applies) in dependency order; **fail-fast** allowed only if the team immediately schedules Pass C for the failing module (no silent deferral).
3. **Pass C — Defect-driven depth:** For **each** failure cluster, add **targeted** cases (boundary, negative, concurrency, RBAC matrix cell), update fixtures, and **re-run only the expanded slice plus its upstream smoke** until **green** or **JIRA P0/P1** with Approver-visible block.
4. **Pass D — E2E / journey confirmation:** Playwright (or project-equivalent per ADM-112) against **staged or prod-like** config; **recursive** here means **re-open** failed journeys after backend fixes — do **not** treat E2E as a single terminal sweep.
5. **Pass E — Plan completion gate:** @QAQCAgent verifies **FS-MTP run history** and **CI artifacts** align with **#Testplan** sections; **gaps** require either new automated tests or **documented manual evidence** with date and executor — **empty sections forbidden** where ADM-116 applies.

**Roles:**
- **@QAQCAgent / Test Manager:** Owns **pass scheduling**, evidence bundles, JIRA linkage on failures, and **closure checklist** before Approver.
- **#AAT QA stream:** Owns **test design** concurrent with Maker (Component 2) — ensures recursive passes have **pre-authored** scenarios so re-runs are fast.
- **Approver:** Treats **missing recursive closure** (failures “hand-waved” without JIRA or re-run) as **REJECT** per ADM-116 discipline.

**Anti-patterns (forbidden):**
- **One-shot test fest** — running the full suite once after feature-complete with no **failure-driven** follow-up passes.
- **Silent suite skips** — excluding failing tests from CI to “go green” without JIRA and Approver risk acceptance.
- **FS-MTP / plan drift** — updating code without updating **suites** or **#Testplan** rows touched by the change (violates ADM-116 / ADM-119 intent).

**Carve-outs:**
- **Emergency hotfix** — MAY shorten Pass D to **smoke + focused regression** if ADM-120 emergency carve-out applies; MUST backfill full FS-MTP passes within the incident **follow-up** window defined in project profile.

---

## ADM-123 — Platform-Owner Deploy Authority (subbu@aurigraph.io) — No Duplicate Deployment Approval (#MANDATORY — May 12, 2026 — USER MANDATED)

**Status:** Applied (2026-05-12). **Pairs with:** ADM-068 / Component 5–6 (@J4CDeploymentAgent, CI gates, post-deploy smoke), ADM-120 (release traceability — unchanged), ADM-116 (pre-deploy test evidence). **Does not remove:** #AAT Approver, PR review, SCMAgent, or automated test gates — **only** removes redundant **human “Approve deployment”** queues in CI/CD that duplicate the platform owner’s authority.

**Rule.**

1. **Identity.** **Subbu** is the **platform deploy authority** for Aurigraph-classified fleet work when acting as **`subbu@aurigraph.io`** on trusted operators, or when a GitHub Actions workflow is initiated by GitHub user **`SUBBUAURIGRAPH`** (or future explicitly listed `github.actor` allowlist in the project’s operational profile). Documentation and runbooks may refer to this as **owner deploy**.

2. **No second human in the loop for deploy.** For owner-identified deploys, **do not** require an additional human to click **Approve** in GitHub (or equivalent) **after** merge-ready code has already passed **branch protection**, **required checks**, and **#ADM deploy verification** (smoke / health / FS-MTP where applicable). Approver sign-off on the **change** remains mandatory before merge per Component 2; this rule addresses **deployment promotion** only.

3. **GitHub Actions mechanics.** If a workflow uses `jobs.*.environment` with a GitHub **Environment** that has **Required reviewers**, the run will sit in **“Waiting for approval”** even for the owner. **Remediation (pick one per repo):**  
   - **Preferred:** Remove **`environment:`** from deploy jobs that target J4C self-hosted runners (see **`deploy-j4c-docker.yml`** — deployment URL is still documented in the workflow summary and ADM).  
   - **Alternative:** In **Repo → Settings → Environments → `production`**, remove required reviewers / wait timers for this repository, or use an unprotected environment name dedicated to self-hosted owner deploys.  
   **Enterprise-only** “bypass rules” for specific actors may be used if available; portability favors omitting `environment` or relaxing Environment rules.

4. **Security scope.** This rule **does not** authorize skipping **`main` protection**, **secrets**, **self-hosted runner labels**, or **post-deploy rollback** on failure. It **does** align **ADM** with **single-trusted-operator** reality on the J4C box where the runner and shell access are already under the same administrative control.

**Anti-patterns (forbidden):**
- Using ADM-123 to **skip CI** or **disable smoke tests** “because the owner said so.”
- Adding **outside collaborators** to a bypass list without updating this ADM and the project operational profile.

---

## ADM-124 — j4c-deployment-agent owns Phase 0: commit + push before every deploy (USER MANDATED — 2026-05-13)

**Amends:** ADM-060 (`/deploy` = commit + push + deploy atomic), ADM-068 (j4c-deployment-agent is the only sanctioned deploy path).

**Rule:** After code-complete, the **j4c-deployment-agent** MUST execute Phase 0 (commit + push) as its **first action** before deploying to any remote server. The agent owns the full cycle:

```
Phase 0 (agent-owned):
  1. git add -A (stage all changes)
  2. git commit -m "<conventional-commit generated from diff>"  — skip if working tree is clean
  3. git push origin main  — production always matches main

Phase 1+ (unchanged):
  Incremental deploy to remote server (git pull / docker rebuild per diff classification)
  L0 → L1 → L2 → L3 → L4 test cascade
  3-layer AutoHeal verification
  JIRA bug logging on failure
  session.md + todo.md update
```

**Why this strengthens ADM-060:** ADM-060 defined the commit+push+deploy contract but left it ambiguous whether the **assistant** or the **agent** performs the commit+push. In practice, the assistant committed+pushed manually before invoking the agent — creating a two-step hand-off that could be interrupted or skipped. ADM-124 closes that gap: the agent is the single actor responsible for the entire sequence from dirty working tree to deployed production.

**Behaviour contract:**

1. **Agent Phase 0 is non-optional.** If the working tree is dirty at agent invocation time, the agent commits before deploying. It does NOT ask for confirmation — it generates a terse conventional-commit message from the diff and commits immediately.
2. **If the tree is clean** (no uncommitted changes), Phase 0 is a no-op and the agent proceeds directly to Phase 1.
3. **Push must succeed before deploy.** If `git push` is rejected (e.g. remote has diverged), the agent surfaces the conflict to the user and halts — it does NOT deploy a state that is not on `origin/main`.
4. **The assistant's pre-agent commit step is now redundant.** The assistant MAY still commit+push before invoking the agent (e.g. as part of a longer task), but it is no longer required — the agent will handle it if not done.
5. **Rest of the deployment process is unchanged.** All L0–L4 cascade rules, AutoHeal verification, JIRA logging, session.md/todo.md updates, rollback semantics, and verdict definitions from ADM-068 remain in force.

**Forbidden patterns (post ADM-124):**
- Agent starting Phase 1 (deploy to remote) before Phase 0 is complete.
- Agent deploying a commit that is not yet on `origin/main`.
- Assistant performing the commit+push AND THEN instructing the agent to "skip Phase 0 since already pushed" — the agent's Phase 0 check is idempotent and safe to re-run.

**Carve-outs:**
- **Docs-only ADM sync commits** (ADM-101 / ADM-113) that go through the file-watcher auto-pull path are exempt from agent-owned Phase 0 — the watcher handles them autonomously.
- **Hotfix rollback** scenarios where the agent explicitly reverses a commit to restore a prior state are exempt from the "conventional-commit message" requirement — the agent may use a `revert(...)` message.

---

## ADM-125 — AurexV4 Playwright L4 Auth Suite — FS-MTP Phase 6 Definition (#MANDATORY — 2026-05-14)

**Context:** AurexV4 ships five Playwright spec files under `apps/web/e2e/` that form the **L4 browser E2E layer** of the Full-Stack Master Test Plan (FS-MTP Phase 6). This ADM records the canonical spec contract, QA account model, gate logic, and integration pattern so it is reproducible across environments and session boundaries.

### Spec inventory

| Spec file | Suite name | Auth account | Gate |
|-----------|-----------|--------------|------|
| `l4-smoke.spec.ts` | L4 smoke — public shell | none (unauthenticated) | always runs when `PLAYWRIGHT_E2E=1` |
| `auth-session.spec.ts` | authenticated dashboard shell | `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD` | skip unless `authReady` |
| `onboarding-workspace.spec.ts` | onboarding / workspace landing | same org_admin account | skip unless `authReady` |
| `industry-data-auth.spec.ts` | Industry Data page (auth) | same org_admin account (needs extended nav) | skip unless `authReady`; self-skips if route unreachable |
| `invitations-path-auth.spec.ts` | Invitations / PendingJoin path (auth) | **Path 2** invite-only account | skip unless `authReady`; **self-skips** when account already has org membership or invite has expired |

`authReady = PLAYWRIGHT_E2E === '1' && email.length > 0 && password.length > 0`.

### QA accounts (production — `aurex.in`)

| Account | Email | Role | Covers |
|---------|-------|------|--------|
| QA org_admin | `qa-playwright@aurex.in` | `ORG_ADMIN` | l4-smoke, auth-session, onboarding-workspace, industry-data-auth |
| QA Path 2 | `qa-playwright-path2@aurex.in` | pending invite (no OrgMember row) | invitations-path-auth (separate run) |

Credentials stored in `credentials.md § Playwright L4 E2E` (gitignored). Never committed. Rotate via `apps/api/scripts/update-qa-password.ts` if needed.

### Phase 6 runner

`scripts/fs-mtp-playwright.mjs` — invoked by `pnpm fs-mtp` when `PLAYWRIGHT_E2E=1`.

```
PLAYWRIGHT_E2E=1 \
PLAYWRIGHT_BASE_URL=https://aurex.in \
PLAYWRIGHT_TEST_EMAIL=qa-playwright@aurex.in \
PLAYWRIGHT_TEST_PASSWORD="<from credentials.md>" \
pnpm fs-mtp
```

The runner executes `pnpm exec playwright test --reporter=json` from `apps/web/`, parses `stats.expected / stats.unexpected / stats.skipped`, writes the report to `.cache/fs-mtp/playwright-l4.json`, and gates on **`failed === 0`** (NOT `stats.ok` — Playwright sets `ok=false` on expected skips, which would be a false failure).

### Expected baseline

With `qa-playwright@aurex.in` (org_admin creds): **7 passed / 0 failed / 1 skipped** (invitations-path-auth self-skips as expected — counts as PASS in the gate).  
With `qa-playwright-path2@aurex.in` (Path 2 creds): **1/1** for invitations-path-auth.

### Rules

1. **Phase 6 is opt-in** — `PLAYWRIGHT_E2E=1` must be set explicitly. Omitting it skips Phase 6 cleanly; `pnpm fs-mtp` without it exercises Phases 1–5 only.
2. **Any unexpected failure exits FS-MTP non-zero.** The gate is binary: `failed === 0` ↔ Phase 6 PASS.
3. **Expected self-skips are not failures.** `invitations-path-auth` self-skips when the QA account already has org membership or the invite has expired — this is by design and is counted in `stats.expected` (hence PASS).
4. **Credentials must not be committed.** Use env vars or `credentials.md` (gitignored). CI uses repo secrets.
5. **QA accounts must not be used for production activity.** They exist only to seed test state. Treat them as disposable service accounts.
6. **Baseline: 7/0/1 (org_admin run).** Any drop in `passed` without a corresponding `skipped` increase is a regression — open an AV4 JIRA ticket and do not merge.

**Amends:** ADM-121 (J4C Fleet Playwright token-skip hygiene — Phase 6 runner shares the skip-flag pattern defined there).  
**Pairs with:** ADM-116 (pre-deploy #Testplan), ADM-122 (FS-MTP recursive testing).

---

## ADM-126 — Settings-Only Config in Adapters; Karate Exclusion of SSE/Streaming Endpoints (#MANDATORY — 2026-05-18 — FS-MTP Wave)

**Status:** Applied (2026-05-18). **Pairs with:** ADM-110 (no hardcoding, named constants/fixtures/config), ADM-113 (Karate API contract layer), ADM-122 (FS-MTP recursive testing). **Discovered via:** J4C FS-MTP E2E wave 2026-05-18 — 10 test failures in `test_integrations_harbor.py` + `test_integrations_openbao.py` and Karate SSE timeout.

### Rule 1 — Adapter `__init__` MUST source config from pydantic-settings exclusively

**Rule:** Any service adapter, repository, or component class that reads configuration in its `__init__` method MUST use the `settings` object (pydantic-settings) exclusively. Direct `os.getenv()` fallbacks alongside `settings.*` are **forbidden** because they create test isolation gaps:

```python
# WRONG — os.getenv bypasses monkeypatch.setattr("module.settings", ...)
self._url = (os.getenv("ADAPTER_URL") or "").strip() or settings.adapter_url

# CORRECT — pydantic-settings already reads from env vars at startup
self._url = (settings.adapter_url or "").rstrip("/")
```

pydantic-settings reads every env var at process startup and exposes it through the `settings` singleton. The `os.getenv` fallback is always redundant — it re-reads the same env var that pydantic-settings already processed — and silently overrides test fixtures, causing stub-mode assertions to fail in any environment where the live credentials are set (e.g., production containers).

**Why:** J4C FS-MTP wave 2026-05-18 found 10 test failures: `HarborAdapter` and `OpenBaoAdapter` both used `os.getenv("HARBOR_ADMIN_URL") or settings.harbor_admin_url` pattern in `__init__`. Tests patched `settings` via `monkeypatch.setattr` but the `os.getenv` call still returned live production credentials, so `adapter.enabled` was always `True` and stub-mode paths were never exercised.

**How to apply:** Audit any class `__init__` that reads config — if it contains `os.getenv("FOO") or settings.foo`, collapse to `settings.foo`. The settings object is the single source of truth.

**Carve-out:** `os.getenv` is acceptable for config that is explicitly NOT modelled in pydantic-settings (e.g., one-off feature flags that have not yet been promoted to a settings field). In that case, add the field to settings to keep the pattern consistent.

### Rule 2 — Karate feature files MUST NOT include SSE / long-poll / streaming endpoint scenarios

**Rule:** Any endpoint that returns a persistent open connection (SSE, WebSocket, long-poll, chunked-transfer-encoding streams) MUST be excluded from Karate feature files. Karate's synchronous HTTP engine throws `java.net.SocketTimeoutException` on open streams (even with `configure readTimeout`) and treats the timeout as a test failure rather than yielding the captured status code.

**Coverage alternative for streaming endpoints:**
- **Pass A curl probe**: `curl -s -o /dev/null -m 3 -w "%{http_code}" <url>` — captures the status code before the connection is force-closed. Record result in FS-MTP `smoke` suite.
- **Playwright (`page.request.get`)**: follows redirects, records status code, closes connection automatically after response headers arrive.

**How to apply:** When writing Karate features, search for any `path '/api/v3/kgraph/events'` or similar SSE paths. Replace with a comment explaining why the scenario is absent and reference the Pass A probe that covers it.

### Rule 3 — Auth-gate changes on previously-public endpoints MUST be reflected in FS-MTP contract tests

**Rule:** When an endpoint transitions from public → auth-gated (or vice versa), the Karate and Playwright contract tests for that endpoint MUST be updated in the same commit that changes the auth guard. The contract tests MUST assert the NEW expected status code (e.g., 401 for an anonymous request to a now-auth-gated route) — not the old status code. Silent divergence between the live API and the test contract is a FS-MTP Pass C regression.

**Example (J4C kgraph/data, 2026-05-18):** `GET /api/v3/kgraph/data` was originally public; a prior session added `require_ide_auth`. The Karate `healthz.feature` still expected `status 200`, causing a Pass C failure. Fix: `Then status 401` for the anonymous scenario + add a `@needsAdmin` scenario for the authenticated path.

---

## ADM-127 — Pydantic v2 `ValidationError` IS `ValueError`: narrow `except ValueError` in FastAPI endpoints (#MANDATORY — 2026-05-18)

**Status:** Applied (2026-05-18). **Pairs with:** ADM-109/110 (TDD / no-hardcode, test-first), Component 1 (RED phase must exercise schema validation path). **Root cause:** HCE2-386 — `get_file_versions` returned HTTP 400 "Invalid file ID" for valid UUIDs because a missing `= None` default on a Pydantic `Optional[str]` field raised `ValidationError`; this was caught by a broad `except ValueError` intended only for UUID parse failures.

**Rule:**

In Pydantic v2, `ValidationError` inherits from `ValueError`. Any `except ValueError` that wraps Pydantic schema instantiation, field access, or any service/repo call that internally validates Pydantic models will silently absorb schema failures as user-input errors — masking a 500-class bug as a 400.

**Required pattern:**

```python
# ✅ Correct — UUID parse isolated; Pydantic / service calls outside the ValueError scope
try:
    parsed_id = UUID(id_str)
except ValueError:
    raise HTTPException(status_code=400, detail="Invalid ID format")

try:
    result = service.get(parsed_id)   # may invoke Pydantic validators internally
except HTTPException:
    raise
except Exception as exc:
    logger.error("...", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal error")

# ❌ Forbidden — service call inside except ValueError scope
try:
    parsed_id = UUID(id_str)
    result = repo.get_versions(parsed_id)   # repo constructs Pydantic models
except ValueError:
    raise HTTPException(status_code=400, detail="Invalid ID")  # masks schema error
```

**How to apply:**

- Keep `except ValueError` scope tightly around the parse call only (UUID, int, float conversions).
- Wrap repo / service calls in a **separate** try/except: re-raise `HTTPException`, catch `Exception` as 500.
- In TDD RED phase, write a test that exercises a schema with a missing default **before** writing the exception handler — confirm the test fails with `ValidationError`, not `ValueError`.
- Fleet-wide audit: search for `except ValueError` in FastAPI endpoints and verify none wrap `service.*`, `repo.*`, or `Schema(...)` calls.

---

## ADM-128 — S3/MinIO multipart upload: validate non-last part size at application layer (#MANDATORY — 2026-05-18)

**Status:** Applied (2026-05-18). **Pairs with:** ADM-109/110 (named constants, no magic numbers), ADM-122 (FS-MTP recursive testing). **Root cause:** HCE2-385 — `complete_multipart_upload` returned `EntityTooSmall` 500 for uploads whose non-last chunks were under 5 MiB; `upload_part` reported success, making the failure invisible until finalization.

**Rule:**

S3 and S3-compatible stores (MinIO, GCS, Azure Blob S3-compatible mode) reject non-last multipart upload parts smaller than **5,242,880 bytes (5 MiB)** with `EntityTooSmall`. This rejection is **deferred** — `upload_part` succeeds, `complete_multipart_upload` fails — surfacing as a confusing 500 during finalization rather than a 400 at upload time. Application code MUST validate part sizes **before** calling `upload_part`.

**Required pattern:**

```python
_S3_MIN_PART_BYTES: int = 5 * 1024 * 1024   # module-level named constant — ADM-110

is_last_part = chunk_index == total_chunks - 1
if not is_last_part and len(data) < _S3_MIN_PART_BYTES:
    raise ValueError(
        f"Chunk {chunk_index} is {len(data):,} bytes — "
        f"non-last parts must be ≥ {_S3_MIN_PART_BYTES:,} bytes (5 MiB)."
    )
```

**Key facts:**

- The **last** part has **no minimum size**; it may be 1 byte.
- Only **non-last** parts are constrained: ≥ 5 MiB.
- Use a **named module-level constant** (`_S3_MIN_PART_BYTES`), not `5242880`, in both product code and test fixtures (ADM-110).
- Also define the constant in the E2E/integration test file — use the same name, import or redefine — never hard-code the magic number in assertions.
- Expose the violation as HTTP 400 to callers; they must increase chunk size or restructure the upload.

**How to apply:**

- Any method that calls `upload_part`, `put_object_multipart_part`, or equivalent MUST add this guard immediately after receiving chunk data.
- FS-MTP / E2E tests for chunked upload endpoints MUST include a `test_*_small_non_last_chunk_rejected` case that sends a sub-minimum chunk as part 0 of a 2-part upload and asserts HTTP 400 with the byte count in the error detail.
- Callers (clients, SDKs) SHOULD document the 5 MiB minimum and advise setting chunk size to 8–16 MiB to avoid edge cases near the boundary.

---

## ADM-129 — AI Validation & Verification suite (Suite 7) mandatory in FS-MTP (#MANDATORY — 2026-05-18)

Every AI implementation (algorithm, methodology, prompt pipeline, model inference endpoint) MUST be validated using a dual-evaluator harness (Gemma local + Claude cloud) to ensure outputs conform to stated requirements and minimize deviation from objectives.

**Rule:**

Six test categories are required under `tests/ai_eval/` (TC-AI-01 through TC-AI-06 per FS-MTP §10):

| Test | What it validates |
|------|-------------------|
| TC-AI-01 | Endpoint output satisfies documented acceptance criteria (evaluator score ≥ 0.80) |
| TC-AI-02 | Repeated calls on fixed input produce semantically consistent outputs (similarity ≥ 0.85) |
| TC-AI-03 | Model/prompt changes do not degrade outputs vs. last passing baseline (pairwise Claude eval) |
| TC-AI-04 | Adversarial inputs (prompt injection, OOD, Unicode) produce no 5xx and no unsafe content |
| TC-AI-05 | SOM / planning outputs are within 10 % of optimal objective score; deviation logged |
| TC-AI-06 | KGraph entity/relationship extraction meets precision ≥ 0.85, recall ≥ 0.80 on canonical fixtures |

**Evaluators:**

- **Gemma** (`gemma4:e4b`, `OLLAMA_NUM_PARALLEL ≤ 2` per ADM-099) — local, zero-latency CI gate.
- **Claude** (`claude-sonnet-4-6`) — high-fidelity cross-check; used in nightly regression and pre-release gates.

Evaluator prompts and rubrics are versioned fixtures; changes require a new fixture version and a passing diff test.

**CI schedule:** Nightly cron (`0 2 * * *`) via `.github/workflows/ai-eval-nightly.yml`. Not run on every push — evaluator API calls add too much latency.

**Coverage ratchet (ADM-129-A):** Iteration 1 minimum is **85 %** across all FS-MTP suites (code coverage) and **0.85** evaluator-score floor for AI V&V (TC-AI-01). Each subsequent sprint/release cycle raises the floor toward **100 %**. No PR may lower the committed floor. See FS-MTP §11 for the full schedule and tracking artifact (`docs/COVERAGE_RATCHET.md`).

**Breach action:** TC-AI-01, TC-AI-03, TC-AI-04 failures block PR merge and require a JIRA ticket (`J4C` project). TC-AI-02 and TC-AI-05 produce a warning + trend log entry; TC-AI-05 > 20 % deviation blocks release.

**Why:** AI endpoints whose outputs are never cross-validated against requirements silently drift — prompts change, models update, context windows shift — with no mechanism to detect degradation until users notice. The dual-evaluator approach catches both factual regressions (Gemma fast path) and nuanced alignment failures (Claude deep path).

**How to apply:**

- When a new AI-backed endpoint ships, add a rubric under `tests/ai_eval/rubrics/<endpoint>.md` and a fixture under `tests/ai_eval/fixtures/` in the same PR.
- Baseline snapshots are committed to `tests/ai_eval/baselines/<date>/` on every passing nightly run.
- TC-AI-03 compares new outputs against the most recent committed baseline; never against a previous PR's uncommitted run.
- Deviation log (`tests/ai_eval/deviation_log.jsonl`) is append-only; never rewrite history.

---

## ADM-130 — FastAPI `HTTPBearer` MUST use `auto_error=False` + explicit 401 (#MANDATORY — 2026-05-18)

**Status:** Applied (2026-05-18). **Root cause:** HCE2 auth breakage — all unauthenticated requests returned HTTP 403 instead of 401, breaking frontend refresh recovery logic. **Files:** `backend/app/api/deps.py` (all FastAPI security dependencies).

**Rule:**

`HTTPBearer` in FastAPI MUST always be instantiated with `auto_error=False`. The dependency function MUST perform an explicit `None`-check and raise `HTTP_401_UNAUTHORIZED`. Using the default `auto_error=True` causes FastAPI to return **HTTP 403** (not 401) for any request that lacks an `Authorization: Bearer` header — this is the framework's built-in behavior and it cannot be overridden by exception handlers.

**Required pattern:**

```python
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(
    scheme_name="Bearer",
    description="JWT Bearer token for authentication",
    auto_error=False,                          # MANDATORY — auto_error=True returns 403
)

async def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    # ... token validation follows ...
```

**Why `auto_error=True` breaks auth:**

- FastAPI's `HTTPBearer(auto_error=True)` returns `HTTP_403_FORBIDDEN` when the `Authorization` header is absent, not 401. This is intentional in the framework (it treats "scheme mismatch" as forbidden, not unauthorized).
- Frontend refresh logic fires on 401. A 403 silently fails the refresh attempt, trapping the user in a broken state.
- Additionally: exception handlers and middleware that intercept 401 to redirect to login will never fire for missing-token requests if the scheme returns 403.

**Secondary fix (frontend):**

When `HTTPBearer(auto_error=False)` cannot be deployed immediately, the frontend `directRequest` method MUST treat both 401 AND 403 as refresh triggers:

```typescript
if (response.status === 401 || response.status === 403) {
    // attempt token refresh
}
```

This is a defensive fallback only. The primary fix is always `auto_error=False` in the backend.

**How to apply:**

- Any FastAPI project with JWT auth: find every `HTTPBearer()` call, add `auto_error=False`, add explicit `if not credentials` 401 raise.
- Grep check: `grep -r "HTTPBearer()" backend/` should return 0 hits (all calls must have `auto_error=False`).
- E2E test: `GET /api/v1/protected` with no Authorization header MUST return 401 (not 403).

---

## ADM-131 — React SPA: `RequireAuth` layout route + `hce2:auth-expired` event on refresh failure (#MANDATORY — 2026-05-18)

**Status:** Applied (2026-05-18). **Root cause:** HCE2 persistent 401s on `/api/v1/files/` — authenticated app pages had no route-level auth guard; additionally, React state (`isAuthenticated`) and localStorage tokens can diverge post-expiry with no mechanism to redirect to login. **Files:** `frontend-v2/src/App.tsx`, `frontend-v2/src/lib/api.ts`, `frontend-v2/src/context/AuthContext.tsx`.

**Rule (three-part):**

### Part 1 — `RequireAuth` layout route

All authenticated routes in a React Router v6 SPA MUST nest under a `<Route element={<RequireAuth />}>` layout route. `ProtectedRoute` component wrappers are insufficient — they only run on initial render and do not block API calls during the render phase.

```tsx
function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// In App route tree:
<Route element={<RequireAuth />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/files" element={<FilesPage />} />
  {/* ... all authenticated routes ... */}
</Route>
```

Public routes (`/`, `/login`, `/register`, `/features`, catch-all `*`) MUST remain outside the `RequireAuth` wrapper.

### Part 2 — `hce2:auth-expired` custom event on refresh failure

When `request()` or `directRequest()` in the API client receives a 401/403 and the subsequent token refresh also fails, the client MUST:

1. Clear the access token (`this.clearToken()`)
2. Clear refresh token + user from localStorage
3. Dispatch `new CustomEvent("hce2:auth-expired")` on `window`

```typescript
// On refresh failure in both request() and directRequest():
this.clearToken();
if (typeof window !== "undefined") {
  localStorage.removeItem("hce2_refresh_token");
  localStorage.removeItem("hce2_user");
  window.dispatchEvent(new CustomEvent("hce2:auth-expired"));
}
```

### Part 3 — `AuthContext` event listener

`AuthContext` MUST listen for `hce2:auth-expired` and immediately clear React auth state + redirect:

```tsx
useEffect(() => {
  const handleAuthExpired = () => {
    setUser(null);
    navigate("/login");
  };
  window.addEventListener("hce2:auth-expired", handleAuthExpired);
  return () => window.removeEventListener("hce2:auth-expired", handleAuthExpired);
}, [navigate]);
```

**Why React state diverges from localStorage:**

`isAuthenticated` in React state is set when the component mounts and reflects user state at that moment. If a JWT expires while the user is on a page, `isAuthenticated` remains `true` in React state even though the localStorage token is invalid. When an API call returns 401 and the refresh token is also expired, there was previously no path that set `setUser(null)` — the component stayed rendered with stale auth state and every API call silently returned 401.

The `hce2:auth-expired` event bridges the gap: the API client (which observes the 401/refresh failure) notifies the AuthContext (which owns the React auth state) to force a clean logout.

**How to apply:**

- Any React SPA with JWT auth using React Router v6: wrap all protected routes in `RequireAuth`.
- API client: add the `hce2:auth-expired` dispatch to every code path where both access-token use AND refresh-token use fail.
- AuthContext: add the event listener before `initAuth` so it is registered on first render.
- E2E test: expire the localStorage token manually, navigate to a protected route — browser MUST redirect to `/login` within one API call cycle, not loop on 401.

---

## ADM-132 — Ollama / local-LLM extraction: 5 mandatory hardening rules (#MANDATORY — 2026-05-18)

**Status:** Applied (2026-05-18). **Root cause:** AurexV4 annual-report extraction returned all-null with `confidence: "low"` on every upload. Five independent root causes found and fixed in sequence. **Files:** `apps/api/src/services/financials-extractor.service.ts`, `infrastructure/docker/docker-compose.yml`, `infrastructure/nginx/nginx-https.conf`, `/etc/systemd/system/ollama.service.d/timeout.conf` (on-host).

**Rule (five mandatory parts):**

### Part 1 — `GEMMA_LLM_MODEL` default MUST match the installed model

Docker Compose `GEMMA_LLM_MODEL` default was `gemma3:27b`; only `gemma3:4b` is installed on the production host (4-CPU, 15 GB RAM, no GPU). Every Ollama call returned HTTP 404 `{"error":"model 'gemma3:27b' not found"}`. **Fix:** set default to `gemma3:4b` in `docker-compose.yml` AND write the override into the on-host `.env` so container re-rolls do not revert to the old value.

### Part 2 — Prompt MUST fit within the model's context window

`gemma3:4b` has a **4096-token context limit**. Sending 14,000 characters (≈ 4,200 tokens) overflows it — Ollama silently truncates or generates garbage. **Rule:** keep total prompt (instruction + document excerpt) under **1,500 characters (≈ 450 tokens)** for any gemma3:4b extraction call, leaving ≈ 3,600 tokens for the model response. For document extraction, send HEAD (financial section) + TAIL (sustainability section) from the document, not a single front-truncated window.

### Part 3 — Never use Node.js global `fetch` for slow LLM calls; use `node:http.request`

Node.js 20's global `fetch` is backed by **undici**, which has a hardcoded `bodyTimeout` of **300,000 ms (5 min)**. This timeout fires independently of any `AbortController` signal and cannot be overridden without importing undici directly. Any LLM inference call that takes longer than 5 min will receive `"fetch failed"` — regardless of how the service-level timeout is configured. **Fix:** replace `fetch()` with `http.request` / `https.request` from `node:http` / `node:https`, setting the `timeout` option on the socket. This gives full, explicit control over the connection lifecycle.

### Part 4 — Ollama `OLLAMA_REQUEST_TIMEOUT` MUST be extended for CPU-only hosts

Ollama's default `OLLAMA_REQUEST_TIMEOUT` is **300 s**. On a CPU-only host running `gemma3:4b` at ~0.30–0.46 tok/s, a 100-token response takes 220–330 s — routinely hitting the default. **Fix:** add a systemd drop-in `/etc/systemd/system/ollama.service.d/timeout.conf` with `Environment="OLLAMA_REQUEST_TIMEOUT=600"`. Also set `OLLAMA_NUM_PARALLEL=1` on single-user inference hosts to prevent context-switching slowdowns. Reload and restart: `systemctl daemon-reload && systemctl restart ollama`.

### Part 5 — LLM JSON extraction MUST use best-effort partial-JSON recovery

Even with `num_predict` capping output tokens, the LLM may be cut off mid-token — typically mid-string (`...,"lastField":"` with the opening quote never closed). A raw `JSON.parse()` will throw and the entire extraction returns all-null. **Fix:** implement `parseJsonBestEffort()` that:
1. Tries `JSON.parse()` first.
2. Strips any trailing open string literal: `.replace(/"[^"]*$/, '')`.
3. Strips any remaining incomplete key fragment: key-without-value, key-without-colon, trailing comma.
4. Appends `}` and retries `JSON.parse()`.

This recovers all fully-written fields from a truncated response instead of discarding them.

**Corollary — nginx proxy timeout for LLM-backed endpoints:**

Any nginx `location` block that proxies to a slow LLM endpoint MUST have `proxy_read_timeout` and `proxy_send_timeout` set to match the LLM timeout + 20 % buffer. The default nginx 60 s and typical 120 s `/api/` settings will close the connection before the LLM responds. Add a specific location block for LLM routes (e.g. `/api/v1/me/org/financials/extract`, `/api/v11/agent/chat`) **before** the generic `/api/` block with `proxy_read_timeout 360s; proxy_send_timeout 360s;`.

---

## ADM-133 — Docker BuildKit MTU black hole on cloud NICs (#MANDATORY — 2026-05-18 — J4C Deploy Marathon)

**Status:** Applied (2026-05-18). **Root cause:** J4CSRV01 host `ens3` MTU **1442**; default `docker0` bridge MTU **1500**. BuildKit build containers inherit bridge MTU; ICMP PMTUD is blocked on the provider network → large HTTPS downloads (PyTorch ~186 MB, pnpm bundles) **stall silently** after a few KB. Three consecutive GHA deploys timed out (30 min, then 60 min).

**Rule:**

1. **Permanent fix (preferred):** set `"mtu": 1442` in `/etc/docker/daemon.json`, then `systemctl restart docker`. Verify: `docker network inspect bridge | grep Mtu` → `1442`.
2. **Interim fix (J4C proven):** add `network: host` under each service's `build:` section in `docker-compose.yml` for image builds that pull large packages (`j4c-api`, `j4c-react`). Remove after daemon MTU is corrected.
3. **Do NOT** run `docker builder prune` before every CI build — it wipes layer cache and forces full re-download of torch/pnpm artifacts (compounds MTU pain).
4. **Symptom signature:** build logs show apt/pip/curl progress then freeze mid-download with no error for 30+ minutes.

**Pairs with:** global CLAUDE.md Docker Networking Troubleshooting (MTU 1442 + DNS).

---

## ADM-134 — J4C bind-mount TESTS+CONFIG deploy: `git pull` only (#MANDATORY — 2026-05-19 — Deploy #80/#81)

**Status:** Applied (2026-05-19). **Pairs with:** ADM-068 / ADM-124 (@J4CDeploymentAgent Step 1 classification), ADM-074 (RO bind-mount source).

**Rule:** On J4CSRV01 (`/opt/j4c-portal`), when the deploy diff contains **only** paths under `j4c-api/tests/`, `j4c-react/**/*.test.*`, `pytest.ini`, `vitest.config.ts`, `mutmut.toml`, and other test/coverage config — and **no** `j4c-api/app/**`, `j4c-react/src/**` (non-test), `requirements*.txt`, `Dockerfile*`, or `docker-compose.yml` — classify as **TESTS+CONFIG** and deploy with:

```bash
cd /opt/j4c-portal && git pull --ff-only origin main
```

**No** `docker restart`, **no** image rebuild, **no** `docker cp`. Bind-mounted test trees are visible to pytest/Vitest inside containers immediately after pull.

**L1 verification:** run targeted pytest/Vitest on changed paths from the server checkout (or confirm file presence + `pytest --collect-only` for new modules). L2 platform smoke still runs (HTTP health, kgraph auth gate).

**Proven:** Deploy #80 (coverage ratchet, 27 domain model tests, ConfirmDialog tests, threshold bumps) and Deploy #81 (TC-AI-03 fixture + `mutmut.toml` path fix) — both PASS with git-pull-only.

**Forbidden:** restarting `j4c-api` / `j4c-react` for test-only changes "to be safe" — wastes uptime and triggers unnecessary ADM-076-A re-ingest noise.

---

## ADM-135 — `mutmut` `paths_to_mutate` MUST track live router layout (#MANDATORY — 2026-05-19)

**Status:** Applied (2026-05-19). **Pairs with:** ADM-111 (mutation testing mandate). **Root cause:** J4C `mutmut.toml` still pointed at `app/services/aiml/` after routers moved to `app/api/routers/aiml/` — `mutmut run` completed with **zero mutations** (silent false green).

**Rule:**

1. After any backend package move or router refactor, **grep-verify** `paths_to_mutate` in `mutmut.toml` / `[tool.mutmut]` against `find app -name '*.py'` for the target modules.
2. Post-change smoke: `python3 -m mutmut run --max-children 1` (or project runner) MUST report **>0** mutations attempted on the intended tree; **0 mutations** is a **configuration failure**, not a pass.
3. Commit message when fixing: `fix(mutmut): align paths_to_mutate with app/api/routers/<pkg>/`.

**Proven fix (J4C):** `app/services/aiml/` → `app/api/routers/aiml/` (Deploy #81, commit `e5283f187`).

---

## ADM-136 — TC-AI / kgraph eval fixtures: canonical node types only (#MANDATORY — 2026-05-19)

**Status:** Applied (2026-05-19). **Pairs with:** ADM-129 (Suite 7 TC-AI-01..06), ADM-076 (kgraph-first reads).

**Rule:** All kgraph seed JSON used by AI eval or precision/recall tests (`tests/ai_eval/fixtures/*.json`, `kgraph_seed.json`, ingest modals) MUST use the **canonical type enum** accepted by the kgraph ingest schema — e.g. `ADM_ENTRY`, `PROJECT`, `SESSION`, `COMPONENT`, `PERSON` — **not** informal lowercase aliases (`decision`, `project`, `sprint`).

**Why:** Ingest may accept or coerce types inconsistently; TC-AI-06 (`kgraph_precision_recall`) and graph metrics then **skip or score zero** while the suite appears "green" on collection. Wrong types are a **test-data defect**, not an API defect.

**How to apply:**

1. Before adding TC-AI cases, read `app/kgraph/` (or OpenAPI) for the allowed `type` values.
2. Grep fixtures: `rg -n '"type"' tests/ai_eval/fixtures/`.
3. CI gate (recommended): a unit test that loads each fixture and asserts every `type` ∈ `ALLOWED_KGRAPH_TYPES`.

**Open follow-up:** J4C-276 — update `kgraph_seed.json` from legacy lowercase types to canonical enums.

---

## ADM-140 — J4C OpenBao + Harbor Integration Plane (#MANDATORY — 2026-05-20)

**Status:** Applied. **Pairs with:** ADM-067 (LLM Gateway — not an adapter), ADM-072 (stub mode), ADM-091 (OpenBao file-backed), ADM-092/093 (orchestrator + Harbor CSRF), ADM-138 (observability adapter), Component 12.

### Two platform services — do not conflate

| Service | Public URL | Purpose | Adapter |
|---------|------------|---------|---------|
| **OpenBao KMS** | `https://j4c.aurigraph.io/openbao` | KV v2 secrets, AppRole per project | `OpenBaoAdapter` |
| **Harbor Registry** | `https://j4c.aurigraph.io/harbor` | OCI images, per-project robot CI | `HarborAdapter` |

OpenBao is **not** a container registry. Harbor is **not** a secrets manager. CI pushes images to Harbor; runtimes read secrets from OpenBao.

### Canonical registration API

**Endpoint:** `POST /api/v3/integrations/projects` (admin JWT — `require_role("admin")` on register; auth on list/show/health per route).

**Router:** `j4c-api/app/routers/integrations.py`  
**Orchestrator:** `j4c-api/app/infra/orchestrator.py`  
**Shim:** `j4c-api/app/services/integrations/orchestrator.py` (re-exports infra orchestrator)

**Valid `services`:** `openbao`, `harbor`, `observability`, `publisher`  
**Default when omitted:** all four, in order:

```
openbao → harbor → observability → publisher
```

Atomic provision: any adapter failure triggers rollback of earlier adapters (reverse order). Metadata persisted in `integration_credentials` (JSONB per project+service); **secrets never stored in Postgres** — only returned once in `secrets_once`.

### OpenBao adapter (`j4c-api/app/infra/openbao.py`)

**Enabled when:** `OPENBAO_URL` + `OPENBAO_ADMIN_TOKEN` set (else stub — ADM-072).

**Per project `{project_id}` provisions:**

| Artifact | Path / name |
|----------|-------------|
| ACL policy | `j4c-{project_id}` |
| AppRole | `auth/approle/role/{project_id}` |
| KV namespace | `{OPENBAO_KV_MOUNT}/aurigraph/{project_id}/` (default mount `kv`) |

**`secrets_once` (one-time hand-off):**

- `openbao_role_id`, `openbao_secret_id`
- `openbao_url`, `openbao_kv_mount`, `openbao_kv_path`

**Runtime (J4C itself):** `j4c-api/app/services/openbao_service.py` loads platform secrets at startup via AppRole (`OPENBAO_ROLE_ID` / `OPENBAO_SECRET_ID` in compose). Per-project loaders should read `kv/aurigraph/{project_id}/*` after onboarding.

**Container:** `openbao-kms` in root `docker-compose.yml` — file-backed HCL, no host port; reach via `j4c-network` + nginx `/openbao/` proxy (ADM-091).

**Env (j4c-api integration adapter):**

```env
OPENBAO_URL=https://openbao-kms:8200          # internal Docker DNS
OPENBAO_ADMIN_TOKEN=<root or admin token>
OPENBAO_KV_MOUNT=kv
```

### Harbor adapter (`j4c-api/app/infra/harbor.py`)

**Enabled when:** `HARBOR_ADMIN_URL` + `HARBOR_ADMIN_USER` + `HARBOR_ADMIN_PASSWORD` (else stub — ADM-072).

**Per project provisions:**

| Artifact | Convention |
|----------|------------|
| Harbor project | `{project_id}` lowercased, `_` → `-` |
| Robot (logical name) | `{project_id}-ci` (no `+` in name — ADM-093) |
| Robot username (Harbor returns) | `robot$<project>+{project_id}-ci` |

**`secrets_once`:**

- `harbor_username`, `harbor_password` (robot token)
- `harbor_registry_url`

**CSRF:** `cookies={}` on client + `cookies.clear()` before every mutating call + `X-Harbor-CSRF-Token: ""` (ADM-093).

**CI push target:** `harbor.j4c.aurigraph.io/<project>/...` using project robot — not shared `admin` account.

**Deploy note:** Self-hosted runner pushes via `localhost:5001` HTTP when public Harbor HTTPS has cert/HSTS issues (see header Harbor extended note). Registry→core notification sink may be broken until `prepare` script re-run.

**Env:**

```env
HARBOR_ADMIN_URL=http://localhost:5001    # or internal harbor-core URL
HARBOR_ADMIN_USER=admin
HARBOR_ADMIN_PASSWORD=<from credentials.md>
```

### Related adapters (same orchestrator)

| Service | Adapter | Role |
|---------|---------|------|
| `observability` | `observability.py` | Telemetry API key + optional OpenBao `kv/.../telemetry` |
| `publisher` | `publisher.py` | Publisher recipient list via `PUBLISHER_INTERNAL_URL` |

**LLM Gateway:** NOT in orchestrator (ADM-092). Use ADM-067 shared gateway + per-project keys in gateway store.

### Operator API surface

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v3/integrations/projects` | Register + provision |
| GET | `/api/v3/integrations/projects` | List |
| GET | `/api/v3/integrations/projects/{id}` | Show + stored metadata |
| PATCH | `/api/v3/integrations/projects/{id}` | Update registry fields |
| POST | `/api/v3/integrations/projects/{id}/rotate/{service}` | Rotate OpenBao secret_id or Harbor robot token |
| DELETE | `/api/v3/integrations/projects/{id}` | Deprovision (best-effort) |
| GET | `/api/v3/integrations/health` | Per-adapter reachability (stub vs live) |

### Example register (Battua)

```bash
curl -X POST https://j4c.aurigraph.io/api/v3/integrations/projects \
  -H "Authorization: Bearer $J4C_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "battua",
    "name": "Battua",
    "services": ["openbao", "harbor", "observability"]
  }'
```

Response `provision_results.*.secrets_once` must be copied immediately; re-fetch via rotate endpoints only.

### Portal UI

- **Integrations:** `/integrations` (`j4c-react/src/pages/IntegrationsPage.tsx`)
- **OpenBao console:** `/services/openbao`, `/admin/openbao`
- **Harbor browser:** `/harbor`, `/admin/harbor`
- **Agent Hub:** provision wizard may list `openbao`, `harbor`, `publisher` — add `observability` when UI is updated to match API.

### Verification

```bash
# Adapter health (no admin JWT required on health route — check router)
curl -s https://j4c.aurigraph.io/api/v3/integrations/health | jq .

# OpenBao sealed?
docker exec openbao-kms bao status

# Harbor systeminfo (from runner host)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/v2.0/systeminfo
```

### Cross-references

- ADM-091 — OpenBao production (no `-dev`, unseal timer)
- ADM-092 — orchestrator mandate; no llm-gateway adapter
- ADM-093 — Harbor CSRF + robot naming
- ADM-072 — stub mode until creds configured
- `docs/observability/OBSERVABILITY_STANDARDS.md` — telemetry + OpenBao telemetry path

---

## ADM-137 — J4C internal `LLM_GATEWAY_URL`: host-gateway, not nginx path (#MANDATORY — 2026-05-20)

**Status:** Applied (2026-05-20). **Pairs with:** ADM-067 (LLM Gateway), ADM-132 (gemma3:4b), Gemma routing commits `c02dfb3e2` / `4717ad4d7`.

**Rule:** `j4c-api` container env **`LLM_GATEWAY_URL`** MUST be **`http://172.18.0.1:8080`** (Docker bridge gateway → host-published llm-gateway-api on port 8080). Set **`LLM_GATEWAY_MODEL=gemma3:4b`**.

**Forbidden for in-container callers:** `http://nginx-gateway/llm-gateway` — nginx returns **301 Moved Permanently** to `https://nginx-gateway/...`, which fails inside the container with **TLS hostname mismatch** (cert is for `j4c.aurigraph.io`). Symptom: `llm_client` logs HTTP 301, AIML endpoints skip Gemma or waste minutes on Anthropic fallback.

**Public/browser path (unchanged):** `https://j4c.aurigraph.io/llm-gateway` via `nginx-gateway` — correct for external clients and admin metrics (`LLM_GATEWAY_ADMIN_URL`).

**Verification (from inside `j4c-api`):**
```bash
docker exec j4c-api python3 -c "
import httpx, os
r = httpx.get(os.environ['LLM_GATEWAY_URL']+'/v1/models',
  headers={'Authorization':'Bearer '+os.environ['LLM_GATEWAY_KEY']}, timeout=10)
print(r.status_code, r.text[:80])
"
# Expect: 200 {"object":"list","data":[{"id":"gemma3:4b"...
```

**Proven:** J4CSRV01 2026-05-20 — `172.18.0.1:8080` → 200; `nginx-gateway` path → 301/SSL error; `llm_client.generate('Say OK')` → `OK` in ~35s CPU.

---

## ADM-138 — Battua Wallet Copilot Uses Host-Local Ollama `gemma4:latest` (Carve-Out from ADM-067) (#MANDATORY — May 20, 2026 — USER MANDATED)

**Status:** Applied (2026-05-20). **Amends:** ADM-067 (J4C llm-gateway shared-gateway mandate) for the **Battua** project only. **Pairs with:** ADM-132 (Ollama hardening), ADM-077–079 (project-bound LLM keys when J4C override is used), Battua **ADM-086** profile [`battua.md`](../battua.md), **#ADMDocs** [`docs/BATTUA_GEMMA_AGENT.md`](./BATTUA_GEMMA_AGENT.md), [`docs/BATTUA_DEPLOYMENT.md`](./BATTUA_DEPLOYMENT.md) §16.12.

**Rule:** Battua agentic LLM calls — Wallet Copilot (`POST /api/v11/agent/chat`), T1 suggestions (`POST /api/v11/agent/suggest`), and default research (`POST /api/v11/wallet/ai/research` when `BATTUA_AI_PROVIDER=gemma`) — target **host-local Ollama** at OpenAI-compat base `http://127.0.0.1:11434/v1` with model **`gemma4:latest`**. Implementation: `BattuaGemmaLlmClient`, `BattuaGemmaModelRouter`, manifest `config/battua-gemma-model.json`. The shared `https://j4c.aurigraph.io/llm-gateway` is retained only as an **optional** override via `BATTUA_GEMMA_API_BASE` + J4C-issued `BATTUA_GEMMA_API_KEY` (central billing).

**Why this carves out from ADM-067:** Battua's J4C gateway path rejected Google AI Studio keys on the Gemma Bearer path (401 `invalid api key`) and added cross-project latency for interactive wallet UX. Host Ollama on `battua.io` matches Provenews' transport pattern, keeps prompts on the wallet host, and preserves OpenAI-compat so re-pivot to J4C is one env change.

**Deploy contract (battua.io):**

1. On host: `ollama pull gemma4:latest`.
2. In `/opt/battua/.env`: `BATTUA_GEMMA_AGENT_ENABLED=true`, `BATTUA_GEMMA_API_BASE=http://host.docker.internal:11434/v1`, `BATTUA_AI_PROVIDER=gemma`.
3. `docker compose up -d --force-recreate` for `battua-app`; smoke `GET /api/v11/agent/llm-status` (JWT for chat).
4. NGINX: agent routes need extended `proxy_read_timeout` per ADM-132 corollary when proxying slow LLM responses.

**Optional Gemini research:** `BATTUA_AI_PROVIDER=google` + `BATTUA_GOOGLE_AI_API_KEY` + `BATTUA_GOOGLE_AI_API_BASE=https://generativelanguage.googleapis.com/v1beta` — does not replace the default Gemma agent path.

**Reference:** Battua repo `feat/battua-gemma-agent-model` (local Ollama default, 2026-05-20). *(Registry note: ADM-134 in this file is J4C TESTS+CONFIG deploy — Battua Ollama carve-out is **ADM-138**; Component 12 telemetry label schema is a separate registry entry in §Component 12.)*

---

## ADM-139 — Aurigraph V12 Nodes MUST Embed Observability Runtime Agent (#MANDATORY — 2026-05-20)

**Status:** Specified (implementation backlog J4C-OBS Phase 1a). **Pairs with:** Component 12, ADM-140, ADM-092 (per-project OpenBao paths).

**Rule:** Production Aurigraph node images (validator, business, EI) MUST include the **in-process Observability Runtime Agent**. Scrape of `/q/metrics` alone does **not** satisfy Component 12 for nodes.

**Minimum agent capabilities:**

- In-process hooks on consensus, transaction pipeline, and gRPC (see Component 12 § Embedded Node Runtime Agent).
- OTLP export to platform OTel Collector with bounded offline buffer (default 5 minutes).
- Mandatory resource labels: `aurigraph.project`, `aurigraph.env`, `aurigraph.tier=node`, `aurigraph.node_id`, `aurigraph.node_role`.
- CI fails if `aurigraph.observability.enabled=false` on production node Maven/Gradle profiles.

**Forbidden:** Relying solely on host `node_exporter`, Docker stats, or external Promtail without the embedded agent on blockchain-critical meters.

**Verification (testnet):**

```bash
# Agent registered meters present (examples — exact names in OBSERVABILITY_STANDARDS.md)
curl -s http://localhost:19001/q/metrics | grep -E 'aurigraph_consensus|aurigraph_obs_agent'

# OTLP path — Collector receives resource with node_id label (check Collector debug UI or Grafana Explore)
```

---

## ADM-141 — HCE2: Single Canonical Alembic Revision Tree (#MANDATORY — 2026-05-27)

**Status:** Applied (HCE2 Sprints 5.10–5.22). **Pairs with:** ADM-147 (deploy guards), ADM-113 (ADM sync).

**Rule:** One Alembic head chain under `backend/alembic/versions/`. **Forbidden:** bumping `alembic_version` via raw SQL, duplicate migration trees, or shipping schema changes only in the migrations Docker image without a matching revision file on `main`.

**How to apply:** `alembic revision --autogenerate` → review → `alembic upgrade head` in CI and deploy. Deploy MUST rebuild the migrations image when `versions/` changes (HCE2-413).

---

## ADM-142 — HCE2: Per-Blob `OrphanReconciler` Weekly Celery Sweep (#MANDATORY — 2026-05-27)

**Rule:** Long-running blob/storage pipelines register orphans via a reconciler task (weekly Celery beat). Reconciler deletes or re-links rows whose parent blob is gone — do not leave dangling FK rows that surface as silent zeros in analysis UIs.

---

## ADM-143 — HCE2: Failure-Resilient Inline MapLibre Style (#MANDATORY — 2026-05-27)

**Rule:** Map layers MUST degrade gracefully when tile/style fetch fails (inline fallback style object, user-visible error state). **Forbidden:** blank map with no toast/banner — pairs with ADM-148.

---

## ADM-144 — HCE2: Open-Meteo Forecast vs ERA5 Historical vs CMIP6 Projection Split (#MANDATORY — 2026-05-27)

**Rule:** Climate impact pipeline stages are separate services: **15-day forecast** (Open-Meteo), **historical baseline** (ERA5), **multi-scenario projection** (CMIP6), **GDD growth modifier**. Do not conflate time horizons in one adapter; label each output with `source` + `valid_time` metadata.

---

## ADM-145 — HCE2: Pluggable Forecast / Climate Protocols (#MANDATORY — 2026-05-27)

**Rule:** Forecast and climate integrations implement shared `Protocol` interfaces in Python so tests can stub providers. **Forbidden:** hard-coded Open-Meteo HTTP calls inside route handlers.

---

## ADM-146 — HCE2: Agent 8xxx Error Taxonomy + RFC 7807 Wiring (#MANDATORY — 2026-05-27)

**Rule:** Agent-facing API errors use the **8xxx** code range mapped to RFC 7807 `Problem` responses (`type`, `title`, `status`, `detail`, `code`). **Pairs with:** ADM-052 (AurexV4), ADM-130 (FastAPI bearer).

---

## ADM-147 — HCE2: Pre-Deploy Guard for `api.py`, Migrations Image, `__init__.py` (#MANDATORY — 2026-05-27)

**Rule:** `scripts/deploy/*` (or equivalent) MUST fail fast when: (1) running `api.py` digest ≠ git `main`, (2) new Alembic revisions exist but migrations image was not rebuilt, (3) package `__init__.py` exports drift from router registration. Proven: HCE2-397, HCE2-413.

---

## ADM-148 — HCE2: Zero-Fallback BAN on Analysis Pages (#MANDATORY — 2026-05-27)

**Rule:** Carbon/analysis pages MUST NOT render `0` or empty charts when data is missing — show `EmptyState`, skeleton, or explicit error. **Forbidden:** silent zeros that imply a successful zero-carbon measurement.

---

## ADM-149 — HCE2: Trim Redundant GHA Node.js Matrix Legs (#MANDATORY — 2026-05-27)

**Rule:** Self-hosted workflows run one Node LTS version aligned with production (20.x unless project documents otherwise). Drop duplicate matrix legs that only burn runner minutes without coverage gain.

---

## ADM-150 — HCE2: Analysis UI Primitives — Skeleton, EmptyState, Sticky Tabs (#MANDATORY — 2026-05-27)

**Rule:** New analysis surfaces reuse shared `Skeleton`, `EmptyState`, and sticky tab primitives — no one-off spinners or blank panels.

---

## ADM-151 — HCE2: Pixel-Wise Carbon Stock Visualization (50×50 Grid) (#MANDATORY — 2026-05-27)

**Rule:** 2D/3D carbon stock views use a **50×50** cell grid (2,500 cells) with documented aggregation (mean/sum) and color scale legend. Performance: virtualize or downsample for WebGL; never block main thread >200 ms.

---

## ADM-152 — HCE2: `ENVIRONMENT='test'` Alias for Pytest Settings (#MANDATORY — 2026-05-27)

**Rule:** Settings modules accept `ENVIRONMENT=test` (and `pytest`) interchangeably for DB URL, Redis, and feature flags. **Forbidden:** code paths that only check `os.getenv("ENVIRONMENT") == "pytest"` while CI sets `test`.

---

## ADM-153 — Prisma v7 + Node ESM: `createRequire` CJS Bridge (#MANDATORY — 2026-05-27)

**Status:** Applied (AurexV4 `1ebe0c1a`, AV4-619). **Pairs with:** ADM-094 (regenerate client before tsc), ADM-154 (Docker copy), ADM-132 (Ollama — separate concern).

**Rule:** When `@aurex/database` (or any `"type": "module"` package) upgrades to **Prisma v7**, `@prisma/client` is **CJS-only**. Static ESM `import { PrismaClient } from '@prisma/client'` and `export { Prisma } from '@prisma/client'` **crash at runtime** in compiled `dist/`:

`SyntaxError: Named export 'PrismaClient' not found. The requested module '@prisma/client' is a CommonJS module.`

**Mandatory pattern:**

1. Load runtime values via `createRequire(import.meta.url)('@prisma/client')`.
2. Merge types with `export namespace Prisma { export type InputJsonValue = … }` alongside `export const Prisma = pkg.Prisma` in the **same module** (TypeScript namespace merge).
3. Use `@prisma/adapter-pg` + lazy `Proxy` singleton so tests can `import { prisma }` without `DATABASE_URL` at module load.
4. Move datasource URL to `prisma.config.ts` (v7 forbids `url` in `schema.prisma`).
5. Run **`pnpm run verify:esm`** after every `@aurex/database` build — imports **`dist/index.js`**, not `tsx` on `src/` (**tsx false-greens this class of bug**).

**Forbidden:** Merging Prisma v7 on green `tsx` soak only; shipping without `verify:esm`.

**Reference:** AurexV4 ce11b6e7 rolled back at Gate 5 (ESM crash); fixed in `packages/database/src/prisma-runtime.ts` + `verify:esm` script.

---

## ADM-154 — Docker: Copy Generated `.prisma/client` Beside `@prisma` Scope (#MANDATORY — 2026-05-27)

**Status:** Applied (AurexV4 `apps/api/Dockerfile`, AV4-619). **Pairs with:** ADM-153, ADM-073 (image drift).

**Rule:** `pnpm deploy` flattens `node_modules` but **drops** the generated `.prisma/client` tree. Production images MUST copy the build-stage generated client to **`node_modules/.prisma/client`** (sibling of the `@prisma` scope directory), for **every** `@prisma/client` package path in the deploy tree:

```dockerfile
target="$(dirname "$(dirname "$client_pkg")")/.prisma/client"
```

**Forbidden:** `node_modules/@prisma/.prisma/client` (wrong — v7 `default.js` requires `.prisma/client/default` relative to the scope parent).

**Verification:** `docker run … find /app/node_modules -path '*/.prisma/client/default.js'` MUST return ≥1 path before deploy promote.

**Reference:** MODULE_NOT_FOUND `.prisma/client/default` on AurexV4 prod 2026-05-27.

---

## ADM-155 — Off-Host `j4c-watchdog`: SSH Checkout, No `GITHUB_TOKEN` (#MANDATORY — 2026-05-27)

**Status:** Applied (AurexV4 AV4-727, `.github/workflows/j4c-watchdog.yml`). **Pairs with:** ADM-075 (fleet agent), ADM-107 (runner health).

**Rule:** Scheduled watchdog workflows on **self-hosted runners** MUST NOT depend on `actions/checkout@v4` when the org installation token is revoked/suspended. Use:

- `AUREX_RUNNER_DEPLOY_KEY` (or per-repo secret) materialized to a temp keyfile (`umask 077`, shredded on exit).
- `git fetch` + sparse-checkout of only `scripts/j4c-agent.py`, `.j4c-agent.json`, `infrastructure/docker/docker-compose.yml`.
- System Python (no `actions/setup-python` unless runner lacks it).

**Forbidden:** Host-baked SSH keys tied to a single machine when the runner label lands on a different host (j4cserver01 vs hce2 incident).

---

## ADM-156 — Deploy Migrate: `DATABASE_URL` Fallback from Host `.env` (#MANDATORY — 2026-05-27)

**Status:** Applied (`scripts/deploy/deploy-to-remote.sh`, AurexV4). **Pairs with:** ADM-055, ADM-147.

**Rule:** When `RUN_DB_PUSH=1`, read `DATABASE_URL` from the running API container env. If `docker inspect` returns empty `Config.Env` (rollback/backup images), construct from `${SRC_PATH}/infrastructure/docker/.env` (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`) before failing migrate.

**Forbidden:** Aborting deploy after a successful image build solely because the backup container has no env snapshot.

---

## ADM-157 — mutmut Runner POSIX `env` Prefix (#MANDATORY — 2026-05-27)

**Status:** Applied (HCE2-412). **Pairs with:** ADM-111.

**Rule:** `[tool.mutmut] runner` MUST use `env VAR=val python3 -m pytest …` — not `VAR=val python3 …` — because mutmut 3.x execs the runner without a shell (`FileNotFoundError: 'ADM_AAT_LIGHT=1'` otherwise). Nightly `timeout-minutes` MUST exceed observed wall-clock (HCE2: **360m** after 4h2m cancel).

---

## ADM-158 — Stryker Honest Baseline When Mutate/Test Scopes Are Disjoint (#MANDATORY — 2026-05-27)

**Status:** Applied (HCE2-418). **Pairs with:** ADM-111, ADM-160.

**Rule:** If `mutate` globs have **no** adjacent unit tests, set `thresholds.break` to the measured indirect-coverage floor (HCE2: **15%**, observed 15.74%) until direct tests land. **Forbidden:** `break: 70` with zero co-located tests — false-red nightlies.

---

## ADM-159 — Orchestrator `except` Blocks MUST Log (#MANDATORY — 2026-05-27)

**Status:** Applied (HCE2-416). **Pairs with:** ADM-146, Component 12.

**Rule:** Orchestrator modules MUST NOT return error DTOs from `except Exception` without `logger.exception` / `logger.error` in the same block. HCE2 guard: `test_hce2_416_orchestrator_visibility.py` (static scan + caplog on J4C agent + CI/CD rollback paths).

---

## ADM-160 — Direct Jest Tests for Stryker `mutate` Scope (#MANDATORY — 2026-05-27)

**Status:** Phase 1 applied (HCE2-420, 11/43 files, 77 tests). **Pairs with:** ADM-158, HCE2-419.

**Rule:** Every file in `stryker.config.json` `mutate` globs gets adjacent tests under `__tests__/`. Ratchet `break` 15 → 70 → 75 only after per-scope kill rates justify it.

---

## ADM-161 — Karpathy 4-Principle Coding-Agent Discipline (#REC — 2026-05-27)

**Source:** Karpathy CLAUDE.md (Andrej Karpathy's X post 2026-01-26 → distilled by Forrest Chang / multica-ai; 43k installs in week 1). The four principles below are **fleet-wide recommended defaults** for any coding-agent session — adopted alongside existing ADM mandates (068 deploy binding, 109/110 no-hardcode, 116/122 test-first, etc.), not in place of them.

**The four principles:**

1. **Think Before Coding** — Surface assumptions, tradeoffs, and confusion **before** writing.
   - State what you're assuming explicitly; ask when uncertain.
   - When the request is ambiguous, present **multiple interpretations** rather than picking silently.
   - Mention simpler approaches and push back when warranted.
   - Stop and name confusion rather than proceeding blindly.

2. **Simplicity First** — Write the minimum code that solves what was asked.
   - No speculative features. No "configurability" not requested.
   - Avoid premature abstraction for single-use code.
   - Don't handle scenarios that can't happen.
   - Self-test: *Would a senior engineer call this overcomplicated?* If yes, rewrite.

3. **Surgical Changes** — Modify only what's necessary; preserve existing style and patterns.
   - Don't improve unrelated code, comments, or formatting.
   - Skip refactoring things working fine.
   - Match existing conventions even if you'd choose differently.
   - Remove only imports/variables/functions **your changes** orphaned.
   - Self-test: *Every changed line traces directly to the user's request.*

4. **Goal-Driven Execution** — Define success **before** coding; verify after each step.
   - Convert vague requests into measurable objectives.
   - Write tests first for validation work or bug fixes.
   - State multi-step plans with verification checkpoints.
   - Use strong criteria ("tests pass") over weak ones ("make it work").

**Relationship to existing ADM:**

| Karpathy principle | Existing ADM mandate it pairs with |
|---|---|
| Think Before Coding | ADM-116 / ADM-122 (#PostWaveDocumentation surfaces tradeoffs upstream) |
| Simplicity First | ADM-109 / ADM-110 (no-hardcode, no premature abstraction in tests) |
| Surgical Changes | ADM-068 (deploy intent isolated to changed surface), ADM-102 (no drive-by hot-patches) |
| Goal-Driven Execution | ADM-111 (mutation testing as ground truth), ADM-122 (FS-MTP defect-driven re-passes) |

**Why #REC not #MANDATORY:** the principles are stylistic + behavioral, not architectural. Fleet ADM mandates remain binding; Karpathy's discipline is the **personality** of how an agent shows up in a session. Adopt by default; override with cause documented in PR description.

**Reference repos:**

- `multica-ai/andrej-karpathy-skills` — canonical CLAUDE.md (4 sections, ~65 lines)
- `swarmclawai/andrej-karpathy-skills` — multi-tool port (Codex, Cursor, Gemini, OpenCode, Aider)
- `TheRealSeanDonahoe/agents-md` — AGENTS.md fusion with Boris Cherny's Claude Code workflow

**Suggested project adoption:** 1-line pointer in each project's `CLAUDE.md` (no body duplication — ADM-086 enforces single source of truth):

```markdown
| **ADM-161** | Karpathy 4-principle discipline default — see ADM.md §ADM-161. |
```

## ADM-162 — MinIO creds MUST fall back from MINIO_ROOT_USER/PASSWORD (#MANDATORY — 2026-05-27)

**Status:** Live in `apps/api/src/services/file-store.service.ts` (AurexV4 AV4-737, commit `a2ba24e5`).

**Rule:** The S3/MinIO client factory MUST read `MINIO_ACCESS_KEY` + `MINIO_SECRET_KEY` first, fall back to `MINIO_ROOT_USER` + `MINIO_ROOT_PASSWORD` when those are empty, and **throw** when neither pair is set. No silent `"minioadmin"/"minioadmin"` fallback that masks misconfiguration.

**Why:** `docker-compose.yml` interpolates the MinIO creds at runtime:

```yaml
MINIO_ACCESS_KEY: ${MINIO_ROOT_USER:?MINIO_ROOT_USER required}
MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD required}
```

The AurexV4 deploy path is `docker run --env-file ...` (not `docker compose up`), so compose-side `${var}` interpolation never runs. The container inherits empty `MINIO_ACCESS_KEY/SECRET_KEY`. The pre-fix code defaulted to `"minioadmin"` (MinIO's stock root) but the prod container is provisioned with `MINIO_ROOT_USER=aurex-minio` + a 24-char password — every signed URL was rejected with 403 `InvalidAccessKeyId`. Bucket-init at boot logged `MinIO bucket init failed — file uploads may not work` for ~24h before the dashboard upload flow exposed it.

**Pairs with:** ADM-156 (same pattern, `DATABASE_URL` deriving from `DB_USER`/`DB_PASSWORD`/`DB_NAME`). Both are compose-substitution gaps in env-file deploys.

**Verification:** `docker exec aurex-api sh -c "echo \$MINIO_ACCESS_KEY"` is non-empty; API log shows `"MinIO buckets verified"` on boot, not `InvalidAccessKeyId`. 6 unit tests in `file-store.service.test.ts` cover the truth table.

---

## ADM-163 — Container watchdog MUST probe TWO vantages before restarting the API (#MANDATORY — 2026-05-27)

**Status:** Live in `scripts/deploy/aurex-watchdog.sh` (AurexV4 AV4-738, commit `aaa8cb59`).

**Rule:** The aurex-watchdog systemd timer (every 5 min) MUST probe BOTH:

- **public** = `curl https://<host>/api/v1/health` (through nginx)
- **internal** = `docker exec <nginx-container> curl http://<api-container>:<port>/api/v1/health` (nginx → api directly, bypasses public DNS)

Decision matrix:

| public | internal | action |
|---|---|---|
| 200 | n/a | no-op |
| !=200 | 200 | `nginx -s reload` ONLY (api is fine, nginx upstream is stale) |
| !=200 | !=200 | `docker restart aurex-api` AND `nginx -s reload` (api genuinely sick; new container will need fresh DNS) |

**Why:** Pre-fix watchdog only probed the public URL. After a deploy that rolled the api container (new bridge-network IP), nginx kept the stale upstream IP → public 502 → watchdog ran `docker restart aurex-api` → new IP again → loop. Visible to the user as intermittent 502s from the dashboard upload flow until manual `nginx -s reload`.

**Pairs with:** ADM-082 (variable `proxy_pass` requires nginx reload on container churn — AV4-588). The watchdog now embodies that rule rather than fighting it.

**Verification:** `sudo journalctl -u aurex-watchdog.service --since "1 hour ago"` shows `OK: public health=200` lines and no spurious `docker restart aurex-api` invocations across multiple deploy/roll cycles.

---

## ADM-164 — Derivative chains MUST reject structurally-empty LLM payloads (#MANDATORY — 2026-05-27)

**Status:** Live in `apps/api/src/services/annual-report-insights.service.ts` (AurexV4 AV4-739, commit `d697db06`).

**Rule:** Any save-chain or derivative-artefact endpoint that consumes LLM JSON output MUST check the parsed payload is **materially non-empty** before treating it as success. A payload like `{summary: "", actionItems: []}` from a truncated Ollama response — recovered by `parseJsonBestEffort` as `{}` — MUST NOT be persisted as if the LLM produced useful content. The chain MUST fall through to the next provider, then to a deterministic rule-based synthesizer that always emits at least one artefact.

**Minimum predicate:**

```ts
function isMateriallyEmpty(payload): boolean {
  return payload.summary.trim().length === 0
      && payload.actionItems.length === 0;
}
```

**Corollary to:** ADM-132 (Ollama / local-LLM hardening — `num_predict` truncation handling). ADM-132 covers parser resilience; this ADM covers what to do with structurally-valid-but-semantically-empty parsed results.

**Why:** AV4-739 incident 2026-05-27 ~05:41 UTC. User uploaded BGR Energy annual report via the dashboard drop-zone. Pipeline ran end-to-end (StoredFile created, AnnualReportInsight persisted, NetZeroRoadmap + CAMM assessment spawned), `aurex_llm.runs` audit recorded `status='success'` — but `summary=""` and `action_items_json=[]` because gemma3:4b truncated on the complex prompt. The dashboard widget had nothing to render. Net effect: user sees "upload worked" but no analysis, despite a roadmap + CAMM assessment now visible elsewhere with no narrative.

**Verification:** Pre-fix BGR Energy upload produced `summary=""` + 0 items. Post-fix, the same low-confidence extract falls through to `degradedPayloadFromExtract` which emits 4 disclosure-gap action items based on `scope1/2/3Disclosed=false`. 8 new tests in `annual-report-insights.service.test.ts` cover the truth table (Ollama empty / Gemini empty / both empty / both throw + 4 predicate cases).

---

## ADM-165 — Dashboard surfaces SHOULD include their own upload affordance when they own the downstream artefact (#REC — 2026-05-27)

**Status:** Live in `apps/web/src/components/dashboard/RecentAnnualReportWidget.tsx` (AurexV4 AV4-736, commit `5376cc7f`).

**Recommendation:** When a dashboard widget renders an analysis derived from a user-uploaded artefact (annual report, evidence bundle, PDD, audit document), the widget itself SHOULD be the upload entry point on the dashboard — not a "click here to go to Settings → Financials" link. The widget MUST handle four states inline:

1. **Loading** — skeleton.
2. **No artefact yet (idle)** — drop-zone with drag-and-drop + click-to-browse.
3. **Pipeline in flight** — progress card with phase labels (`uploading` → `extracting` → `saving` → `done`) and the drop-zone hidden so the user can't fire a second upload mid-flight.
4. **Artefact ready** — summary card with a footer "Upload another" affordance.

**Why:** Reduces the upload→analysis loop to a single page. Pre-fix the `/dashboard` widget showed `null` for first-time tenants (no insight yet), forcing a navigation to `/dashboard/settings/financials` to upload, then a navigation back. The dashboard surface is the natural location for the user's mental model of "did my upload turn into something useful?"

**Implementation contract:** the widget reuses the same hook stack the dedicated settings page uses (`useStoreReport` → `useExtractStored` → `useSaveAnnualReportInsight`) so the idempotency + provider-fallback contracts in ADM-164 are preserved. On `saveInsight.onSuccess` the widget invalidates its own read-side query (`['<artefact>-insight', 'latest']`) so the new row flips into view without a page reload.

**#REC not #MANDATORY:** the pattern is a UX recommendation, not a binding architectural rule. Apply when the dashboard widget is the primary surface for the artefact; skip when a dedicated upload page already exists with richer extraction-review UX (e.g. FinancialsPage's ExtractionReviewPanel — useful for power users).

---


## ADM-166 — J4C Publisher SPA ↔ publisher-dashboard JSON API Contract (#MANDATORY — 2026-05-23)

**Status:** Applied (source). **Pairs with:** ADM-140 (`publisher` integration adapter — recipient lists only), ADM-071 (J4C JWT RBAC), ADM-081 (SPA `index.html` no-cache), ADM-068 (`@J4CDeploymentAgent` deploy binding).

### Two different “integrations” surfaces — do not conflate

| Surface | Host / path | Backend | Purpose |
|---------|-------------|---------|---------|
| **Platform project provisioning** | `https://j4c.aurigraph.io/api/v3/integrations/*` | `j4c-api:8000` | OpenBao + Harbor + observability + publisher **list** provision (ADM-140) |
| **Publisher channel credentials + campaigns** | `https://j4c.aurigraph.io/publisher/api/*` | `publisher-dashboard:8766` | Mailchimp/Telegram keys, send campaigns, suppressions, lists |

A `422` on admin key save that hits `/api/admin/integrations/...` (no `/publisher` prefix) is routed to **`j4c-api`** and is the **wrong service**. Canonical admin integrations path:

```
PUT /publisher/api/admin/integrations/{channel}
```

### NGINX routing (J4C Portal stack)

| Prefix | Upstream |
|--------|----------|
| `^~ /publisher/api/` | `publisher-dashboard:8766` (`json_api` router) |
| `^~ /publisher/` (SPA) | `j4c-react:3000` (React hub at `/publisher/campaigns`, `/publisher/admin`, …) |
| `^~ /api/` | `j4c-api:8000` |

**Auth:** React SPA sends J4C HS256 JWT (`localStorage` `j4c_token`). Publisher verifies with `J4C_JWT_SECRET` (must match `j4c-api` `SECRET_KEY`). Roles: `superadmin` / `admin` for admin routes; any authenticated role for campaign CRUD.

### Admin integration config (`integration_configs` SQLite table)

**Router:** `publisher/dashboard/json_api.py` (prefix `/publisher/api`).

| Method | Path | Body |
|--------|------|------|
| GET | `/admin/integrations` | — |
| PUT | `/admin/integrations/{channel}` | **`{ "values": { "<field_key>": "<secret>" } }`** |
| POST | `/admin/integrations/{channel}/test` | — |

**Channels / field keys** (see `publisher/integration_config.py`): `mailchimp` (`api_key`, `server_prefix`, `list_id`), `telegram` (`bot_token`, `default_chat_id`), `hubspot`, `heygen`, `mandrill`, `ga4`, `publisher_auth`, …

**Legacy SPA compatibility (May 2026):** `ConfigValuesBody` also accepts a **flat** JSON object (`{ "bot_token": "…" }`) for bundles deployed before the `{ values: … }` wrapper fix. **Do not** POST masked placeholders (`***abcd`) back — UI must only send user-typed secrets.

**Product-scoped keys:** `PUT /publisher/api/products/{product_key}/integrations/{channel}` uses the same `{ values }` shape (`product_integrations` table).

### Send campaigns (`send_campaigns` table)

**SPA routes:** `/publisher/campaigns`, `/publisher/campaigns/new`, `/publisher/campaigns/:id`, `/publisher/campaigns/:id/edit`.

**API (canonical field names):**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/send-campaigns` | Returns `{ "campaigns": [...], "total": N }` — **never** a bare array |
| POST | `/send-campaigns` | Create draft |
| GET/PUT/DELETE | `/send-campaigns/{id}` | Draft-only edit (PUT → 409 if not `draft`) |
| POST | `/send-campaigns/{id}/send` | Channel fan-out (mailchimp, mandrill, telegram, hubspot, social stubs) |
| POST | `/send-campaigns/{id}/schedule` | Body **`{ "scheduled_at": "<ISO-8601>" }`** required |
| GET | `/send-campaigns/{id}/stats` | Flattens `stats_json` + Mailchimp report when applicable |

**Canonical write shape:**

```json
{
  "name": "Q2 launch",
  "product_key": "aurigraph-dlt",
  "channel": "telegram",
  "list_id": "<recipient-list-uuid>",
  "content": "<html or text>",
  "content_type": "html",
  "target": { "chat_id": "@channel" },
  "subject": "",
  "from_name": "",
  "from_email": ""
}
```

**SPA aliases accepted on create/update** (mapped server-side): `audience_list_id` → `list_id`; `content_html` / `content_text` → `content` + `content_type`; `audience_chat_id` / `audience_target` → `target.chat_id` / `target.link`. Responses include both canonical and alias keys for detail pages.

**Lists API:** `GET /publisher/api/lists` returns `{ "lists": [{ "list_id", "name", "member_count", … }] }` — UI must bind **`list_id`**, not `id`.

**Product integrations status:** `GET /publisher/api/products/{product_key}/integrations` returns `{ "channels": { "mailchimp": { "api_key": { "masked": "…" } } } }` — **object map**, not an array; `.find()` on the response will throw.

### Frontend mapping module

**Source of truth for SPA↔API mapping:** `j4c-react/src/lib/publisherCampaigns.ts` (`mapCampaignToApi`, `mapCampaignFromApi`, `normalizeMailingLists`, `isChannelConfigured`).

### Deploy rule (#MANDATORY)

Publisher Admin + Campaigns fixes require **both** images on J4CSRV01:

1. **`publisher-dashboard`** — Python (`json_api.py`, `integration_config.py`, tests under `publisher/tests/`)
2. **`j4c-react`** — Vite bundle (`PublisherAdminPage`, `CampaignWizardPage`, `CampaignsPage`)

L1 smoke (unauthenticated — expect **401**, not 404/502):

```bash
curl -sk -o /dev/null -w "%{http_code}\n" https://j4c.aurigraph.io/publisher/api/send-campaigns
curl -sk -o /dev/null -w "%{http_code}\n" https://j4c.aurigraph.io/publisher/api/admin/integrations
```

Post-deploy: hard-refresh `/publisher/admin` and `/publisher/campaigns`; verify PUT integrations returns **200** and campaign wizard saves non-empty `content` + `list_id` in DB.

### Tests (publisher)

- `publisher/tests/test_admin_integrations.py` — `{ values }` + flat legacy body
- `publisher/tests/test_send_campaigns.py` — legacy SPA field names + list shape

---


---

## ADM-167 — Cursor `stop` hook is the enforcement mechanism for auto-commit + push (#MANDATORY — 2026-05-25)

**Status:** Applied. **Pairs with:** ADM-068 (`@J4CDeploymentAgent` deploy binding), [`Aurigraph Deployment Agent — Auto-Deploy After Build`](#aurigraph-deployment-agent--auto-deploy-after-build-mandatory--apr-22-2026--user-mandated) (the unnumbered Apr-22 rule that mandates the chain).

### Problem (Macbook2 + any new dev host)

The Apr-22 "Auto-Deploy After Build" rule mandates that after the agent finishes coding, the toolchain must run `git commit && git push && deploy`. The push triggers `.github/workflows/deploy-j4c-docker.yml` automatically via its `on.push.paths` filter (ADM-068), so the rule only needs the **first** step — auto `commit + push` — to be enforced locally.

Until 2026-05-25, that first step had **no enforcement mechanism**: no Cursor hook, no `.git/hooks/post-commit`, no shell wrapper. Result: on hosts that didn't have undocumented user-level automation (e.g. `Macbook2`), the agent would finish coding and the changes would sit in the working tree until the developer remembered to `git commit && git push`. The `/deploy` skill (`.cursor/skills/deploy/SKILL.md`, 2026-05-25) is *invocable* but not *triggered*.

### Decision

A **project-scoped Cursor `stop` hook** is the canonical enforcement point. Checked into the repo at `.cursor/hooks.json` + `.cursor/hooks/auto-commit-push.sh`, it works on **every** machine that clones the repo — Macbook, Macbook2, future hosts — with zero per-host configuration.

```json
// .cursor/hooks.json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "command": ".cursor/hooks/auto-commit-push.sh",
        "timeout": 90,
        "failClosed": false,
        "loop_limit": 1
      }
    ]
  }
}
```

### Safety gates (each bails cleanly — `exit 0` with `{}`)

| Condition | Action |
|-----------|--------|
| Branch != `main` | Skip (feature branches stay manual) |
| Rebase / merge / cherry-pick / revert in progress | Skip |
| Working tree clean | Skip |
| < 20s since last commit (debounce) | Skip |
| Env `CURSOR_AUTO_COMMIT_DISABLE=1` | Skip (per-host kill-switch) |
| `git commit` fails (pre-commit hook) | Leave staged, surface `agent_message` |
| `git push` fails (network / auth) | Keep commit local, surface `agent_message` |

### Forbidden patterns

- **Never** pass `--no-verify` — pre-commit gates (SCMAgent, secret scan, linters) MUST run. A pre-commit hook failure is a hard stop, not a bypass.
- **Never** auto-commit on a feature branch — only `main` is in scope. The hook will refuse.
- **Never** `gh workflow run deploy-j4c-docker.yml` from the hook — the path-filtered `on.push` trigger already runs the deploy when watched paths change. Doing both causes `concurrency.cancel-in-progress: false` to queue a redundant second run.

### Verification

- Local: `echo '{}' | .cursor/hooks/auto-commit-push.sh` (when working tree has changes) — must commit + push + log to `logs/cursor-auto-commit.log`.
- Cursor: open the Hooks settings tab → verify the `stop` hook is listed with `enabled: true` and path resolves to `.cursor/hooks/auto-commit-push.sh`.
- Audit trail: `tail -f logs/cursor-auto-commit.log` (gitignored).

### Rollback / opt-out

- Per machine: `export CURSOR_AUTO_COMMIT_DISABLE=1` in shell rc.
- Per session: delete or rename `.cursor/hooks.json` (but do not commit the deletion — defeats the cross-host guarantee).
- Per repo (permanent): revert this ADM entry and remove the two `.cursor/` artifacts via a documented JIRA ticket.

### Related

- Hook artifacts: [`.cursor/hooks.json`](../../.cursor/hooks.json), [`.cursor/hooks/auto-commit-push.sh`](../../.cursor/hooks/auto-commit-push.sh)
- Deploy workflow: [`.github/workflows/deploy-j4c-docker.yml`](../../.github/workflows/deploy-j4c-docker.yml) (path filter is the actual deploy trigger)
- `/deploy` skill: [`.cursor/skills/deploy/SKILL.md`](../../.cursor/skills/deploy/SKILL.md) (manual escape hatch when push didn't touch a watched path)

---


---

## ADM-168 — CI Workflow Hygiene: Treat Latent Workflow Failures as First-Class Debt (#REC — 2026-05-28)

**Pattern** — When a CI job fails on a commit whose diff does NOT touch the failing code path (app diff is docs-only, tests-only, or unrelated module), the failure is almost always **latent workflow infrastructure debt** that was hidden by an earlier-stage failure short-circuiting the workflow. The discipline:

1. **Don't paper over with retries.** A pipeline that goes red on the same step across three unrelated commits is not flaky — it has an unfixed bug.
2. **Diagnose root cause inside the workflow file.** Path expressions, timeouts, tool-dependency assumptions, threshold drift. The diff IS the bug, even though no developer wrote it on this commit.
3. **Fix the workflow in a tiny, surgical commit.** No app code in the same commit; the bisect signal stays clean for future regressions.
4. **Document the failure mode in the workflow itself** with an inline comment citing the run ID and the fix rationale. Future humans (and agents) need to know *why* the cache mode is min, *why* metadata is parsed with python3 not jq.

**Concrete failure modes observed in HCE2 CI today** (all four landed in commits `3bbaa02e`, `97b00e55`, `5e4490d3`, `5a9f8057`):

| Failure | Surface symptom | Root cause | Fix |
|---|---|---|---|
| Matrix path mismatch | `failed to read dockerfile: open Dockerfile: no such file or directory` | `matrix.component=backend` mapped to `./backend/Dockerfile` but file is at `./Dockerfile.backend` (root) | Per-component context/file mapping, not a uniform expression |
| Mega-image cache export timeout | Job killed at 30:57 after `cache-to: type=gha,mode=max` exported 9.5 GB build cache | `mode=max` writes every intermediate layer; for PyTorch+CUDA bases that's 15+ min — alone enough to trip a 30-min job timeout | Use `mode=min`; trade marginal next-run speedup for reliability |
| Tool PATH ghost on self-hosted runner | `jq: command not found` even though `/usr/bin/jq` exists and `.path` includes `/usr/bin` | Unreproducible PATH state between job invocations on the same self-hosted runner; not worth root-causing under deadline | Eliminate the dependency — swap `jq` for `python3` (guaranteed present) |
| Coverage threshold drift | `Jest: "global" coverage threshold for statements (67%) not met: 63.56%` | New UX components shipped raising the denominator faster than tests raised the numerator | Lower floor to `measured − 5` (rounded), document the climb-back target in-file, file a ratchet JIRA |

**Why:** Three CI failures on three different commits cost ~3-4 hours of babysitting and a polluted git log of "fix(ci): X" commits. Each individual fix was 1-5 lines. The cost was diagnosis. ADM-068 already mandates that deploy verification flows through the agent — this ADM extends the same first-class-debt treatment to CI failures so the discipline applies even when nothing is being deployed.

**How to apply:**
- Sequence the four fixes the same way the agent sequences a deploy: cleanest classification first (matrix/path bug → timeout → dep ghost → threshold drift) so each commit is independently bisectable.
- Add an in-file comment beside every workflow change explaining what previously broke. The comment is the durable artifact; the JIRA closeout is ephemeral.
- File a JIRA only when the fix requires app-code follow-up (e.g. HCE2-419 for coverage ratchet, HCE2-421 for the still-timing-out mutmut nightly). Pure workflow tweaks don't need a ticket.
- Resist the temptation to combine fixes "while you're in there." The four CI fixes today shipped as four atomic commits — each commit message reads as a complete story and each fix is independently revertable.

**Cross-refs:** ADM-068 (deploy through agent), ADM-097 (GHA `deploy` job gated on `workflow_dispatch` only), ADM-098 (deploy scripts run schema/env drift gates before build), ADM-101 (docs-only auto-pull carve-out — applies on the runtime side, not the CI gate side).

---

---

## Component 13: TDD/MTP Coverage Audit (#MANDATORY #MEMORIZED — 2026-05-31 — USER MANDATED)

**Rule**: Every Aurigraph product MUST undergo a quarterly **TDD/MTP Coverage Audit** that determines (a) whether TDD test suites include BOTH RED-phase and GREEN-phase tests, and (b) whether a Master Test Plan (MTP) exists, is current, and has been thoroughly executed. Gaps MUST be reported in a structured gap matrix.

### Why mandated

Programs frequently produce GREEN-only test suites (tests written alongside or after the implementation, going straight to GREEN). This masks two structural defects:

1. **False-green coverage** — tests written by the same author at the same time as the implementation can pass for the wrong reason — matching the implementation rather than the spec.
2. **Drift between spec/MTP and shipped tests** — without quarterly audits, the MTP's test pyramid (L0-L4) drifts from what's actually exercised.

Per `#AAT` Tier 3 Phase 1 mandate: "QA's RED test plan ships at T=0 alongside Maker; not deferred to 'later'." This audit verifies adherence.

### Per-product audit output

Each audited product receives a gap-matrix report at `<product>/docs/audit/TDD_MTP_Coverage_Audit_<date>.md` with:

| Section | Content |
|---------|---------|
| **Per-product test inventory** | Test file counts (unit / IT / contract / scaffold), production-file counts, ratio |
| **TDD-phase classification** | Git-log evidence: tests-only commits (RED candidates) vs paired commits |
| **MTP coverage** | Existence + age + L0-L4 row coverage vs shipped tests |
| **Gap matrix** | Per-product table of missing categories (fuzz, security, chaos, mutation, load, RED-phase, MTP) |
| **Risk-prioritized remediation plan** | High-blast-radius gaps surfaced first (crypto/auth/consensus) |

### 5 RED test category templates (one per gap)

Each audited product MUST have at least one test class for each of the 5 templates documented in **`aurigraph-v12/docs/templates/red-tests/`**:

| RED template | Filename | Asserts (when RED-first written) |
|--------------|----------|----------------------------------|
| **Path-collision** | `PathCollisionRedTest.template.java` | "POST /api/v11/X cannot coexist with another class declaring @Path("/api/v11/X")" — would have RED-flagged S-ONB-1A.3b-2 |
| **Fuzz / property** | `FuzzRedTest.template.java` | "For ANY String inputs, RECORD construction either succeeds OR throws @NotNull/IAE — never returns invalid state" (jqwik) |
| **Security / auth** | `SecurityRedTest.template.java` | "Given a tampered JWT, an @RolesAllowed-protected endpoint returns 401 NOT 200 — written FIRST against existing endpoints" |
| **Chaos / fault-injection** | `ChaosRedTest.template.java` | "Given Postgres connection drop mid-bind, @Transactional rolls back atomically — no torn state" |
| **Mutation baseline** | `MutationBaselineRedTest.template.java` | "PIT/Pitest run captured; surviving-mutants count is the RED baseline; subsequent sprints reduce it" |

These templates are language-stack-agnostic conceptually but ship as JUnit 5 / Java for the V12 reference. Each template:
- Carries a `// TODO(product)` header naming the gap it closes
- Includes 1-3 example test methods demonstrating the assertion pattern
- Is intentionally LEFT FAILING until a per-product slice adapts + GREENs it

### Audit cadence

| Trigger | Owner |
|---------|-------|
| **Quarterly** (T+90 days from last audit) | Approver_T0 per #AAT |
| **Pre-release** for products gated by `/deploy` to production | @QAQCAgent |
| **Post-incident** when a regression slipped past GREEN-only tests | @code-reviewer + @QAQCAgent |
| **On-demand** when user invokes `#TDDAudit` | Any agent |

### Audit script logic

For each Aurigraph product P under `~/subbuworkingdir/`:

1. Detect language stack (Java/Quarkus, TypeScript, Python, etc.)
2. Count production files vs test files (per `#TestStackMandate` patterns)
3. `git log --format='%h %s' --diff-filter=A -- '*Test.java' '*IT.java' '*_test.py' '*.spec.ts'` — classify commits as tests-only (RED candidate) vs paired
4. Locate MTP doc: `docs/mtp/MTP_*.md` or equivalent
5. Cross-reference MTP L0-L4 rows against actual test inventory
6. Identify uncovered categories (fuzz / security / chaos / mutation / load)
7. Emit structured gap matrix

### Gap matrix format (canonical)

```markdown
| Product | Test Files | Prod Files | RED-phase commits | MTP exists | MTP <90d | Fuzz | Security | Chaos | Mutation | Gap score |
|---------|-----------:|-----------:|------------------:|:----------:|:--------:|:----:|:--------:|:-----:|:--------:|----------:|
```

**Gap score** = uncovered categories out of 9 (RED + MTP + 5 RED-test categories + 2 maintenance dimensions).

### Acceptance criteria for "thoroughly tested"

| Criterion | Threshold |
|-----------|-----------|
| GREEN unit test coverage | ≥ 90% line (per Component 1) |
| RED-phase commit ratio | ≥ 10% of feature commits have a preceding tests-only RED commit |
| MTP existence | YES |
| MTP age | ≤ 90 days since last edit |
| L0-L4 coverage | Each L tier has ≥ 1 shipped test class |
| Adversarial test categories | At least 3 of {fuzz, security, chaos, mutation, load} have ≥ 1 shipped test |

Products NOT meeting these criteria are flagged with a remediation sprint plan.

### Cross-references

- `~/.claude/CLAUDE.md` `#TestStackMandate` (May 8, 2026) — test stack composition
- ADM Component 1 — TDD coverage targets
- ADM Component 2 #AAT — Tier 3 QA Phase 1 RED test plan mandate
- ADM-116 — FS-MTP evidence bundle per channel promotion
- **Templates**: `aurigraph-v12/docs/templates/red-tests/` (5 canonical templates)
- **Reference audit**: `aurigraph-v12/docs/audit/TDD_MTP_Coverage_Audit_2026-05-31.md`

---

---

## ADM-169 — Deploy Queue Discipline: j4C Deployment Agent MUST drain older deploys before starting new (#MANDATORY — 2026-06-02 — USER MANDATED)

**Status**: Applied (2026-06-02 directive). **Pairs with**: `/deploy` Step 1 (Pre-deployment infrastructure validation); ADM Component 5 (J4C Deployment Agent); ADM-068 (deploy binding). **Codifies**: a hard-learned lesson from 2026-06-02 when 3 V12 deploys queued back-to-back over 8-9 hours because pushes auto-triggered the workflow + each new push added a queued run without draining the prior one. The dispatcher couldn't keep up; runners stayed busy on stale/zombie work; cancellation propagation was delayed by hours.

**Rule**: Before starting a new deploy on a target, the j4C Deployment Agent (or any deploy mechanism — `/deploy` skill, manual `gh workflow run`, push-triggered workflow) MUST first verify that older deploy workflows for the same target have completed (or been explicitly cancelled). If older deploys exist in `queued` or `in_progress` state, the agent MUST either:

1. **WAIT for them to drain** (preferred) — if the older deploys are in good standing and will complete naturally, let them.
2. **CANCEL older deploys explicitly** — only when older deploys are stale/zombie/known-bad. Use `gh run cancel <id>` or `gh api -X POST .../actions/runs/<id>/cancel` per run. Verify cancel propagation before triggering new deploy.

**NEVER trigger a new deploy that piles on top of unresolved older deploys for the same target.** Doing so produces:
- Cancel-propagation lag (gh API accepts cancel but display doesn't reflect for minutes-to-hours)
- Runner saturation (Workers consumed by stale jobs; dispatcher can't allocate slots)
- Zombie in_progress runs (Worker dies but GitHub doesn't detect for 15-30 min)
- False "infrastructure broken" diagnoses (the queue IS draining; it's just deeply backlogged)

**How to apply**:

1. **`/deploy` skill — Step 1 check** (mandatory): before invoking `@J4CDeploymentAgent`, the skill runs:
   ```bash
   gh run list --workflow=<workflow> --branch=<branch> --status=queued --limit 5
   gh run list --workflow=<workflow> --branch=<branch> --status=in_progress --limit 5
   ```
   If either returns non-empty: BLOCK + report queue state. Operator chooses: wait, cancel-all-older, or proceed (with explicit override flag).

2. **Push-triggered deploy workflows**: MUST include a `concurrency:` block with `cancel-in-progress: true`:
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```
   This cancels older runs in the same group when a new push arrives — preferred over piling up.

3. **For workflows that can't safely `cancel-in-progress: true`** (e.g., live mid-deploys shouldn't be killed): add a head-of-job concurrency check that **early-aborts** if a newer queued run for the same workflow + branch exists:
   ```yaml
   - name: Skip if newer queued
     run: |
       NEWER=$(gh run list --workflow=${{ github.workflow }} --branch=${{ github.ref_name }} --status=queued --limit 1 --json databaseId,createdAt --jq '.[] | select(.createdAt > "${{ github.event.head_commit.timestamp }}") | .databaseId')
       if [ -n "$NEWER" ]; then echo "Newer queued run $NEWER exists; aborting"; exit 0; fi
   ```

4. **Carve-outs** (exempt from this rule):
   - Smoke-test workflows (Upptime, FS-MTP gates, JIRA syncs) — idempotent / read-only, queue ordering doesn't matter
   - Per-PR test workflows — each PR gets its own queue position
   - Manual `workflow_dispatch` with explicit `--ref` override — operator explicitly takes responsibility

**Why this matters beyond the 2026-06-02 incident**:
- aurdlt01 has 3 self-hosted runners shared across 4+ projects (Aurigraph-DLT, Battua, healthcare, etc.). Cross-project queue contention is the norm, not exception.
- A wedged Worker can consume 23+ GB memory + 2d 18h CPU before being detected (the 2026-06-02 zombie was the canonical example).
- Cancel-propagation lag is non-trivial: 3 `gh run cancel` attempts + 1 direct API call took ~2 hours to resolve on a deeply-stuck queue.
- The fix isn't more retries — it's **don't queue more work onto an already-stuck queue**.

**Enforcement**: `/deploy` skill MUST run the Step 1 queue check before invoking `@J4CDeploymentAgent`. Skipping this check is **forbidden** per ADM Component 10 (forbidden actions).

**Reference incident**: 2026-06-02 session. 3 V12 deploys queued sequentially over 8-9 hours; resolved via (a) triple-runner restart + (b) sweep-cancel 17 stale runs + (c) SIGTERM workers + (d) wait for dispatcher reset. Total recovery wall-time: ~30 minutes once intervention started. Could have been avoided entirely with this rule + `concurrency: cancel-in-progress: true` on the V12 deploy workflow.

---

## ADM-170 — #KnowledgeGraphFirst: Orient from Context Graph Before Wide Context Reads (#MANDATORY #MEMORIZED — Apr 26, 2026 — USER MANDATED)

**Rule**: On **Aurigraph-DLT / enterprise-portal / V12** work, **orient from the Context Knowledge Graph BEFORE** doing a full read of project `CLAUDE.md`, `infinitecontext.md`, or a wide sweep of `memory/*.md` / full `ADM.md` passes.

| Do first | Purpose | Where |
|----------|---------|--------|
| **Knowledge graph** | Entity/edge map (projects, servers, #ADM/#AAT, tickets, files) — **route** what to open next | Portal `/knowledge-graph` · API `GET /api/v11/knowledge-graph/data` · indexer: `aurigraph-v12/scripts/context-graph/graph_indexer.py --json-only` · local dev: from `aurigraph-enterprise-portal/`, `npm run graph:index` (writes `knowledge-graph.local.json`) |
| Then | Standards + deep context | Global `~/.claude/CLAUDE.md` → `~/.claude/ADM.md` (targeted sections) → project `CLAUDE.md` → `session.md` / `todo.md` / `infinitecontext.md` (sliced, not whole-file) |

**Why**: Graph is **structured** (nodes/edges + stats). Narrative context files are long prose. Graph-first reduces blind full-file pulls and duplicate re-reads both within a session and across sessions.

**Token impact (honest bounds)**: No fixed % — depends on what you would have read without graph-first.
- **Context priming slice only**: ~30–70% fewer tokens vs "read everything wide" when the alternative was pasting full `ADM.md` + `infinitecontext.md` + many `memory/*.md` chunks — or ~0% if you only ever opened one short `CLAUDE.md`.
- **Whole turn**: smaller savings — implementation + tool I/O dominate; graph-first mainly trims orientation overhead.
- **Session total (N turns)**: ~20–50% lower priming token accumulation when you pay graph orientation **once** then reuse the map. Still not measured in CI — treat as planning guidance, not a guarantee.

**Do not claim exact %** without measuring (log cumulative input tokens: A = graph-first + slices, B = full re-read habit).

**Status:** Applied (Aurigraph-DLT, J4C Portal, all V12 work). **Pairs with:** ADM-076/076-A (kgraph-first reads + ADM file watcher), ADM-171 (Session Startup sequence).

---

## ADM-171 — Session Startup Sequence + `<project-name>.md` Convention (#MANDATORY #MEMORIZED — May 3, 2026 — USER MANDATED)

### Session startup (mandatory read order)

1. **#KnowledgeGraphFirst** (ADM-170) — Aurigraph-DLT / V12 / portal context
2. **Global `~/.claude/CLAUDE.md`** — enterprise standards overview (rules + pointers only)
3. **`~/.claude/ADM.md`** — when implementing features/bugs/deploying; use **targeted sections** after graph orientation
4. **`~/.claude/CLAUDE_example_code.md`** — 134 code examples; reference implementations
5. **`~/.claude/CLAUDE_ARCHIVE.md`** — deprecated patterns; legacy investigation only
6. **Project `CLAUDE.md`** — project-specific RULES + tech stack only (per `<project-name>.md` convention below)
7. **`<project-name>.md`** at project root — project state, session log, deployment state (load after `CLAUDE.md`)
8. **`session.md` / `todo.md` / `infinitecontext.md`** — slice to relevant sections when possible
9. **Credentials**: `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md`
10. **`git log -5 --oneline` + `git status`** — verify branch + uncommitted changes
11. Resume from last known state in `session.md`

### `<project-name>.md` convention (#MANDATORY — May 3, 2026 — USER MANDATED)

**Rule**: Every project MUST have a `<project-name>.md` at the project root for state-y content (project context, session log, component status, deployment state, performance baselines). Project `CLAUDE.md` keeps RULES only.

**Why**: `CLAUDE.md` loads into context on every prompt. Mixing rules with state means re-paying tokens on every turn for content that changes daily. Splitting lets rules stay tight (~5–10 KB) while state grows freely.

**Naming**: kebab-case matching the working-directory name.
- `Aurigraph-DLT/` → `aurigraph-dlt.md`
- `Battua/` → `battua.md`
- `Provenews/` → `provenews.md` (state) + `docs/Provenews.md` (ADM-086 ops profile)
- `glowing-adventure/` (J4C Portal) → `j4c-portal.md` or `glowing-adventure.md`
- `MEV Shield/` → `mev-shield.md`

**Pointer rule**: every project `CLAUDE.md` MUST have a frontmatter line:
> **Project state, session log, deployment state** → [`<project-name>.md`](./<project-name>.md)

**First implemented**: `Aurigraph-DLT/aurigraph-dlt.md` (May 3, 2026). Roll out to all repos when next touched.

**Status:** Applied. **Pairs with:** ADM-086 (per-repo operational profile), ADM-113 (bidirectional sync).

---

## ADM-172 — Agent Framework: Canonical Roster + Dispatch Patterns (#MEMORIZED — 2026-06-04)

**Canonical agent roster:**

| Agent | Role | Invocation |
|-------|------|-----------|
| `@J4cAgents` | Orchestrator | Direct reference |
| `@JIRAAgent` | JIRA lifecycle | Background **after every task** (ADM-115); auth fallback → markdown report in `session.md` |
| `@Plan` | Architecture | `@Plan` or Task tool |
| `@code-explorer` | Codebase analysis | `feature-dev:code-explorer` |
| `@code-architect` | Implementation plans | `feature-dev:code-architect` |
| `@DeveloperAgent` | Feature dev | Direct or Task |
| `@code-reviewer` / `@SCMAgent` | Security/quality + pre-commit review | `pr-review-toolkit:code-reviewer` (foreground, after Approver APPROVED) |
| `@AIMLArchitect` | AI/ML layer | Direct |
| `@frontend-design` | UI/UX | `frontend-design:frontend-design` |
| `@J4CDeploymentAgent` | CI/CD | `/deploy` |
| `@QAQCAgent` | Testing | Task tool |

**V11 Specialists**: CAA, BDA, FDA, SCA, ADA, IBA, QAA, DDA — see `~/.claude/agents/AURIGRAPH-TEAM-AGENTS.md`.

**Key dispatch patterns:**
- **#AAT** = `Approver_T0 → [Maker + Checker + QA concurrent] → Approver_Gate` — Full spec: ADM.md Component 4
- **#AAT uses Agent tool (`run_in_background: true`) — NEVER tmux** (tmux ONLY for #ralph-loop pytest >2 min + remote SSH builds)
- **#4ParallelAAT** — 4 concurrent Bash agents writing to `/tmp/` staging — Full spec: ADM.md Component 4 → #ralph-loop
  - Dual-dep-override: Override BOTH `get_db` AND `get_async_db` in `app.dependency_overrides`
  - Route-conflict pre-check: `grep -n '"/stats/ENDPOINT"'` before every sprint
- **#AgentAnalysisFramework**: 4-agent parallel (explorer + Plan + architect + reviewer)

**Docs**: `~/.claude/agents/ORGANIZATIONAL_AGENTS_FRAMEWORK.md` | `~/.claude/agents/UNIFIED_AGENT_FRAMEWORK.md`

**Status:** Reference. **Pairs with:** ADM Component 4 (#AAT full spec), ADM-115 (#JIRABackfillAfterEveryTask).

---

## ADM-173 — Recursive Improvement Operator Kit (#MANDATORY — Jun 5, 2026)

**Status:** Applied (2026-06-05). **Pairs with:** ADM-113 (bidirectional ADM sync), ADM-170 (KGraph-first), ADM-122 (FS-MTP recursive testing), Component 13 (TDD/MTP audit).

**Rule:** Close the loop from **incident → ADM-ID → test → deploy verify → telemetry**. Target **loop-closure ≥ 90%** (9+/10 recursive improvement AI).

**Operator scripts** (repo root `scripts/`):

| Script | Purpose |
|--------|---------|
| `adm-sync.sh --check \| --sync [--commit]` | ADM-113 direction-check + byte-identical mirror (Global ↔ Repo ↔ J4C) |
| `adm-gate-log.sh <gate> <PASS\|SKIP\|FAIL\|BYPASS> "<reason>"` | Append to `docs/adm/gate-telemetry.jsonl` |
| `adm-loop-scorecard.sh [--write]` | Weekly closure % → `docs/adm/LOOP_CLOSURE_SCORECARD.md` |
| `adm-session-start.sh` | Session start: kgraph probe + ADM drift + scorecard summary |

**Mandatory agent behaviors:**

1. **Session start** — run `adm-session-start.sh` (or equivalent kgraph_health + `adm-sync.sh --check`).
2. **Every gate skip** — `adm-gate-log.sh SCMAgent SKIP "<reason>"` before commit when SCMAgent/org limits block review.
3. **Every `--no-verify`** — human or agent MUST log `adm-gate-log.sh PreCommit BYPASS "<reason>"` in the same session.
4. **Post-incident** — ADM numbered entry + regression test + `adm-sync.sh --sync` within the same sprint.
5. **Weekly** — `adm-loop-scorecard.sh --write`; SKIP count > 2/sprint triggers ADM review item.

**Loop-closure formula (scorecard):**

```
closure% = (adm_sync_commits + ins_entries + iter_commits) × 100
           / (adm_sync + ins + iter + gate_skips + gate_bypasses)
```

**Target grades:** ≥90% = 9+/10 · 75–89% = GOOD · <60% = NEEDS WORK.

**Docs hub:** `docs/adm/README.md`

---

**Last Updated**: 2026-06-05 (v3.1.1 — ADM-173 Recursive Improvement Operator Kit; carried forward v3.1.0 ADM-170–172)
