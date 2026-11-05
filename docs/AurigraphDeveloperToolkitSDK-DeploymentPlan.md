# Aurigraph Developer Toolkit & SDK — deployment plan (#ADMDocs Deployment)

**Status: DRAFT.** Agent-derived on 2026-11-05 from repo signals. It authorises no release until the Approver confirms it.
Operational profile (kept in sync with this plan, H2b): [`aurigraph-developer-toolkit-sdk-deployment-config.md`](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/blob/main/aurigraph-developer-toolkit-sdk-deployment-config.md).
Release runbook: [`RELEASE.md`](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/blob/main/RELEASE.md) (see "Stale passages" below).

## 1. What "deployment" means here

This repo is a **library / publish-only product**. Nothing runs on an Aurigraph host: there is no Dockerfile, compose file or k8s manifest (`git ls-files | grep -iE 'dockerfile|compose'` → empty). Shipping means:

1. **Publishing packages** to public registries (npm, Maven Central, PyPI, crates.io) on a `v*` tag.
2. **Publishing the docs site** (MkDocs) to GitHub Pages.

## 2. Topology

| Artifact | Source dir | Registry / target | Workflow |
|---|---|---|---|
| TypeScript SDK `@aurigraph/dlt-sdk` | `typescript/` | npm | `.github/workflows/release-npm.yml` |
| Java SDK `io.aurigraph:dlt-sdk` | `java/` | Maven Central (OSSRH) | `.github/workflows/release-java.yml` |
| Python SDK `aurigraph-sdk` | `python/` | PyPI (Trusted Publishers / OIDC) | `.github/workflows/release-pypi.yml` |
| Rust SDK `aurigraph-sdk` (Cargo.toml name) | `rust/` | crates.io | `.github/workflows/release-crates.yml` |
| Docs site | `docs/` + top-level MDs | GitHub Pages (`site_url: https://sdk.aurigraph.io`) | `.github/workflows/docs.yml` |
| Android SDK | `android/` | none (no publish workflow) | — |
| iOS SDK (SwiftPM) | `ios/` | none (SwiftPM consumes git tags directly; ASSUMPTION) | — |

No containers. No hosts. No SSH.

## 3. Environments

- **Public registries** are the only "production". There is no staging registry flow.
- GitHub environments `production` and `staging` exist with **no protection rules**, and **no workflow references them** (`gh api repos/<o>/<r>/environments`, 2026-11-05).
- `docs.yml` deploy job uses environment `github-pages`, which does not exist yet (GitHub creates it on first Pages deploy). Pages is **not enabled** (`gh api repos/<o>/<r>/pages` → 404).

## 4. Trigger model

- **Packages:** push of a tag matching `v*` fires **all four** `release-*.yml` workflows at once; each also has `workflow_dispatch` with no inputs.
- **Docs:** push to `main` touching `docs/**` or the top-level MDs, or `workflow_dispatch`.
- **CI** (`ci.yml`): push/PR to `main`. Release workflows do **not** depend on CI (no `needs:`/`workflow_run`); each re-runs its own tests before publishing.

## 5. Runners

- Every job uses `runs-on: [self-hosted, linux]`.
- **Registered repo runners: 0** (`gh api repos/<o>/<r>/actions/runners` → `total_count: 0`, 2026-11-05). Org-level runners could not be read (403, needs `admin:org`).
- Consequence: **CI and docs have never run here.** Run history: CI 81 cancelled + 5 queued, Deploy Docs 2 cancelled + 1 queued, Security Scan 29 cancelled; no run has ever succeeded except Dependabot (GitHub-hosted). A tag push today would queue the four release jobs and GitHub would auto-cancel them after 24 h.
- Fixing this needs a runner registered for this repo (or an org runner group granting it), or switching these jobs to GitHub-hosted runners — a workflow change, out of scope for this docs PR, owner decision.

## 6. Scope rules (full vs incremental)

There are no containers, so "incremental" = **only the affected package(s)**, but the workflows do not encode that: every `v*` tag publishes **all** four packages. Per-package release needs either per-package tag prefixes or path filters (workflow change, not done). Until then: one tag = full publish of all four, and any package whose version was not bumped would fail or republish (see config Known hazards).

Docs-only changes to `docs/**` trigger only the Pages workflow.

Never touched by any workflow here: any Aurigraph host, container or the V12 platform (`dlt.aurigraph.io`); `android/`, `ios/` artifacts.

## 7. Rollback and recovery

Registry releases are effectively immutable (from `RELEASE.md` "Rollback Procedure"):
- npm: `npm deprecate @aurigraph/dlt-sdk@<v> "<msg>"` (preferred) or `npm unpublish` within 72 h.
- Maven Central: immutable; publish a new patch version.
- PyPI: yank via web UI.
- crates.io: `cargo yank --version <v>`.
- Docs: re-run `docs.yml` on a previous commit (`workflow_dispatch` on that ref).

There is no auto-rollback.

## 8. Verification

After a publish, assert the new version is served by the registry (n=3):
- npm: `https://registry.npmjs.org/@aurigraph%2Fdlt-sdk` → 200 and `dist-tags.latest` = tag version.
- PyPI: `https://pypi.org/pypi/aurigraph-sdk/json` → 200 and `info.version` = tag version.
- Maven Central: `https://search.maven.org/solrsearch/select?q=g:io.aurigraph+AND+a:dlt-sdk&wt=json` → `numFound` ≥ 1 and `latestVersion` = tag version.
- crates.io: `https://crates.io/api/v1/crates/aurigraph-sdk` → 200 and `crate.max_version` = tag version.
- Docs: `https://sdk.aurigraph.io/` (or the Pages URL) → 200.

Baseline 2026-11-05 (n=3 each): npm 404, PyPI 404, crates.io 404, Maven `numFound: 0`, `sdk.aurigraph.io` no DNS (curl 000), Pages URL 404. **Nothing has ever been published.**

## 9. Stale passages (not synced; owner to fix in a follow-up)

The plan above was derived from the workflows and live probes. These passages elsewhere contradict it:

| File:line | Passage | Live fact |
|---|---|---|
| `RELEASE.md:11` | Java package `io.aurigraph:dlt-sdk` | matches pom; but `docs/README.md:11,22-23` says `io.aurigraph.dlt:aurigraph-sdk` |
| `RELEASE.md:14` | Rust package `aurigraph-dlt-sdk` | `rust/Cargo.toml:2` name = `aurigraph-sdk` |
| `RELEASE.md:25`, `release-crates.yml:3` | Rust "when added" | `rust/` exists; release-crates fires on every `v*` tag, CI rust job still commented out (`ci.yml:104-144`) |
| `RELEASE.md:87` | Java needs a `release` profile | `java/pom.xml` has no `<profiles>` and no `distributionManagement`; `mvn -B clean deploy -P release` cannot publish |
| `RELEASE.md:20-25` | bump all SDKs to one version | versions today: java 1.2.0, ts 1.2.0, python 1.3.0, rust 0.1.0 |
| `RELEASE.md:163` | "Releases are gated on these [CI] checks passing" | no workflow dependency, and CI never runs (0 runners) |
| `docs/README.md:11-14` | Java/TS/Python "Production", Rust "Beta" | not published to any registry |
