---
product: aurigraph-developer-toolkit-sdk
repos: [Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK]
owner: Aurigraph-DLT-Corp platform owner (ASSUMPTION — not stated in repo)
jira: ADTS   # README.md:7 (epic ADTS-3)
last_verified: 2026-11-05
plan: docs/AurigraphDeveloperToolkitSDK-DeploymentPlan.md
plan_synced: 06dc1e145c03b8f2f6c52a13ef7c8eeb16aff1e3 2026-11-05   # git hash-object of the plan file
status: DRAFT   # agent-derived (H1); authorises no release until the Approver confirms
---

# Aurigraph Developer Toolkit & SDK — deployment config (J4C Deployment Agent)

> This is the per-product profile for `@J4CDeploymentAgent`, whose global contract is `~/.claude/agents/j4c-deployment-agent.md`.
> - It may ADD steps. It can never relax the #AAT Step-0 gate, the runner rules or host-proof.
> - Never put secrets here. Registry secrets are GitHub Actions secrets (names only below); values live in `doc/Credentials.md` / OpenBao.

## Product
Client SDKs for the Aurigraph DLT V12 platform (V11 API): TypeScript, Java, Python, Rust, plus Android and iOS sources and a MkDocs docs site (`docs/README.md:1-14`). Consumers are external developers who install the packages from public registries. **This is a library / publish-only product: nothing is deployed to an Aurigraph host.** No Dockerfile, compose file or k8s manifest exists (`git ls-files | grep -iE 'dockerfile|compose'` → empty, 2026-11-05).

## Environments & hosts
| Env | Host | SSH (pointer) | Domains |
|---|---|---|---|
| npm (public) | registry.npmjs.org | none | `@aurigraph/dlt-sdk` (`typescript/package.json:2`) |
| Maven Central (public) | OSSRH `s01.oss.sonatype.org` (`release-java.yml:2`) | none | `io.aurigraph:dlt-sdk` (`java/pom.xml:7-8`) |
| PyPI (public) | pypi.org | none | `aurigraph-sdk` (`python/pyproject.toml:6`) |
| crates.io (public) | crates.io | none | `aurigraph-sdk` (`rust/Cargo.toml:2`) |
| Docs | GitHub Pages | none | `https://sdk.aurigraph.io` (`docs/mkdocs.yml:2`) — no DNS record (curl 000 ×3, `dig` empty, 2026-11-05); Pages not enabled (`gh api repos/<o>/<r>/pages` → 404) |

GitHub environments `production`, `staging` exist with **no protection rules** and are referenced by no workflow (`gh api repos/<o>/<r>/environments`, 2026-11-05). `github-pages` (used by `docs.yml:67-68`) does not exist yet.

## Deploy entry point
- **none — library / publish-only.** There is no host deploy. The publish path is:
  - Packages: push a `v*` tag → fires all four `release-*.yml` at once (`release-npm.yml:11-12`, `release-java.yml:10-11`, `release-pypi.yml:12-13`, `release-crates.yml:10-11`). Each also has `workflow_dispatch` with no inputs. Steps per package: build+test, then `npm publish --access public` (`release-npm.yml:50`), `mvn -B clean deploy -P release` (`release-java.yml:48`), `pypa/gh-action-pypi-publish@release/v1` OIDC (`release-pypi.yml:48`), `cargo publish` (`release-crates.yml:53`). npm also attaches the tarball to the GitHub Release (`release-npm.yml:57-61`).
  - Docs: `.github/workflows/docs.yml` on push to `main` with paths `docs/**` + top-level MDs (`docs.yml:4-14`) or `workflow_dispatch` (`docs.yml:15`); `mkdocs build --strict` then `actions/deploy-pages@v4` (`docs.yml:57,73`).
- Runner label: `[self-hosted, linux]` on every job (`release-*.yml`, `docs.yml:28,66`, `ci.yml:21,47,75`).
- **Environment approval gates: none.** Release jobs declare no `environment:`; `docs.yml` deploy uses `github-pages`, which has no required reviewers (does not exist yet). No human approval gate stands between a tag push and a public publish.

## Runners
| Runner | Host | Labels | Role (CI/deploy) | Prod host? |
|---|---|---|---|---|
| — (none registered) | — | — | — | — |

`gh api repos/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/actions/runners` → `total_count: 0` (2026-11-05). Org runners unreadable (403, needs `admin:org`), so an org runner group granting this repo is ASSUMPTION-absent; run history confirms nothing picks the jobs up (CI: 81 cancelled + 5 queued, Deploy Docs: 2 cancelled + 1 queued, Security Scan: 29 cancelled, zero successes; `gh run list -L 200`, oldest 2025-12-27). **CI has never run.** Fix = register a runner with `self-hosted,linux` for this repo, or move these jobs to GitHub-hosted runners (workflow change, owner decision; not done here).

## Build & artifact
- Stack: Java 25 Temurin + Maven (`ci.yml:31-35`), Node 20 + npm (`ci.yml:57-60`), Python 3.12 (`ci.yml:85-88`), Rust stable (`release-crates.yml:32`), MkDocs Material (`docs.yml:44`).
- Artifacts: registry packages (above); GitHub Release asset `typescript/aurigraph-dlt-sdk-*.tgz` (`release-npm.yml:61`); Pages artifact `_site` (`docs.yml:57-62`).
- Build identity: the registry version string from each manifest, published under git tag `v<version>`. Current manifest versions: java 1.2.0 (`java/pom.xml:9`), ts 1.2.0 (`typescript/package.json:3`), python 1.3.0 (`python/pyproject.toml:7`), rust 0.1.0 (`rust/Cargo.toml:3`). No tags exist (`git tag -l` empty; `gh release list` empty).

## Change classes & sizing
| Class | What runs | Proof required |
|---|---|---|
| docs (`docs/**`, top-level MDs) | `docs.yml` → Pages | site URL 200 n=3 |
| code (an SDK dir) | CI only; nothing publishes until a tag | CI green on the PR (currently impossible: 0 runners) |
| release (version bump + `v*` tag) | all four `release-*.yml` | each registry serves the new version, n=3 |
| config / migration | n/a (no runtime config, no DB) | — |

## Deployment scope — full vs incremental, per container
No containers. Scope unit = package.

| Signal (changed paths / condition) | Scope | Packages published | Untouched |
|---|---|---|---|
| docs only (`docs.yml:6-14` path filter) | docs site only | none | all packages |
| SDK source, no tag | none (CI only) | none | all |
| `v*` tag push | **full** — the workflows encode no per-package selection | npm, Maven, PyPI, crates.io (all four) | android, ios |
| `workflow_dispatch` on one `release-*.yml` | that package only | the chosen one | the other three |

No incremental per-package tag path exists; adding one needs a workflow change. No speed claim is made for any path.

Never touched by any workflow here: Aurigraph hosts and containers, `dlt.aurigraph.io`, other products' repos, `android/` and `ios/` (no publish workflow).

## Pre-flight
- [ ] A runner carrying `self-hosted,linux` is ONLINE for this repo (`gh api repos/<o>/<r>/actions/runners`). Today: 0 → NO-GO for any release.
- [ ] CI green on the release commit (does not exist yet; release workflows do not enforce it).
- [ ] Environment approval gate: confirm with `gh api repos/<o>/<r>/environments` — today none applies to release jobs; the Approver's explicit "release vX" is the only gate.
- [ ] Every package being released has its manifest version bumped to the tag version (versions currently skewed 1.2.0/1.2.0/1.3.0/0.1.0); a tag publishes all four.
- [ ] Target version not already on the registry (npm/PyPI/crates reject re-publish of a version).
- [ ] Java: `java/pom.xml` has a `release` profile and `distributionManagement` (currently neither → `mvn -B clean deploy -P release` cannot publish).
- [ ] Secrets present by name (never print values): `NPM_TOKEN`, `OSSRH_USERNAME`, `OSSRH_TOKEN`, `GPG_PRIVATE_KEY`, `GPG_PASSPHRASE`, `CRATES_IO_TOKEN`; PyPI Trusted Publisher configured (`RELEASE.md:100-111`). ASSUMPTION — not verified (no secrets read).
- [ ] Docs: Pages enabled and `sdk.aurigraph.io` DNS/CNAME set before relying on the docs URL.

## Verification (prove it)
| Check | Command / URL | Asserted output | n |
|---|---|---|---|
| npm | `curl -s https://registry.npmjs.org/@aurigraph%2Fdlt-sdk` | 200, `dist-tags.latest` = tag version | 3 |
| PyPI | `curl -s https://pypi.org/pypi/aurigraph-sdk/json` | 200, `info.version` = tag version | 3 |
| Maven Central | `curl -s 'https://search.maven.org/solrsearch/select?q=g:io.aurigraph+AND+a:dlt-sdk&wt=json'` | `numFound` ≥ 1, `latestVersion` = tag version | 3 |
| crates.io | `curl -s https://crates.io/api/v1/crates/aurigraph-sdk` | 200, `crate.max_version` = tag version | 3 |
| Docs | `curl -s -o /dev/null -w '%{http_code}' https://sdk.aurigraph.io/` | 200 | 3 |
| Git identity | `git ls-remote --tags origin v<version>` | tag SHA = released commit | 1 |

Baseline 2026-11-05 (n=3): npm 404 404 404; PyPI 404 404 404; crates.io 404 404 404 (also `aurigraph-dlt-sdk` 404 ×3); Maven `numFound: 0` for group `io.aurigraph`; `sdk.aurigraph.io` 000 ×3; Pages URL 404 ×3. Nothing is published.

## Rollback
No auto-rollback; registries are append-only (`RELEASE.md` "Rollback Procedure"):
- npm: `npm deprecate @aurigraph/dlt-sdk@<v> "<msg>"` (preferred) or `npm unpublish @aurigraph/dlt-sdk@<v>` within 72 h.
- Maven Central: immutable; ship a new patch version.
- PyPI: yank via the web UI.
- crates.io: `cargo yank --version <v>`.
- Docs: `workflow_dispatch` `docs.yml` on the previous good ref.
- Failed mid-publish: re-run only the failed `release-*.yml` via `workflow_dispatch`. Do not delete and re-push a tag that already published any package (it re-fires all four).

## Known hazards
- **No runner (0 registered):** every job queues and is auto-cancelled; a tag push today publishes nothing and gives no error until GitHub's 24 h queue cancel.
- **No approval gate:** tag push → public publish with no `environment:` reviewers. `production`/`staging` environments exist but are unused.
- **One tag publishes all four packages** with skewed manifest versions (1.2.0/1.2.0/1.3.0/0.1.0); the tag version will not match most manifests.
- **Java publish is broken by config:** no `release` profile, no `distributionManagement` in `java/pom.xml` (grep `<profiles>` → none); OSSRH `s01` is the legacy host (ASSUMPTION: Sonatype migrated to Central Portal).
- **Rust publishes untested by CI:** `rust/` exists but `ci.yml:104-144` rust job is commented; `release-crates.yml:3` still says "activate when rust/ is added" yet fires on `v*`.
- **Name drift:** crate is `aurigraph-sdk` (`rust/Cargo.toml:2`) vs `aurigraph-dlt-sdk` in `RELEASE.md:14` and `docs/README.md:14`; Java coords `io.aurigraph:dlt-sdk` (pom) vs `io.aurigraph.dlt:aurigraph-sdk` (`docs/README.md:11,22-23`).
- **Docs claim "Production"** for Java/TS/Python (`docs/README.md:11-13`) while no registry has any version (#GoLiveRealityGate).
- **Ghost workflows in history:** "Security - SAST, Dependency & Container Scanning" (27 failures) and "Sprint 21 - Enhanced gRPC Services Deployment" (5 failures) have runs but no file on `main`.

## Out of scope / never
- Never deploy to, or SSH into, any Aurigraph host for this product.
- Never push a `v*` tag without the Approver's explicit release instruction (it publishes publicly and irreversibly).
- Never print or commit registry tokens / GPG keys.
- Never change `.github/workflows/*` from a docs PR.

## Waivers
- none

## Heuristics
<!-- Maintained by @J4CDeploymentAgent after every run (H3). Heuristics may only TIGHTEN a deploy; promotion to Pre-flight/Known hazards needs the Approver (H4). -->
| date | signal | observation | evidence | effect | confidence (n) |
|---|---|---|---|---|---|

## Deploy KPIs
<!-- One row per run (Objective: fast, error-free, efficient). Trend line every 5 runs. -->
| date | SHA | class | queue wait | dispatch→swap | swap→verified | lead time | result | pre-flight catches | notes |
|---|---|---|---|---|---|---|---|---|---|

## Deployment log
Append-only: [`aurigraph-developer-toolkit-sdk-deployment-log.md`](./aurigraph-developer-toolkit-sdk-deployment-log.md).

## Plan sync
- Plan: [`docs/AurigraphDeveloperToolkitSDK-DeploymentPlan.md`](./docs/AurigraphDeveloperToolkitSDK-DeploymentPlan.md), created in the same PR from the same facts; sync fact set (H2b) agrees.
- Not synced: `RELEASE.md` and `docs/README.md` contain stale passages, listed in the plan §9. They are left for an owner follow-up.

## Change log
- 2026-11-05 created (bootstrap, DRAFT) from workflows, manifests, `gh api` runners/environments/pages and registry probes.
