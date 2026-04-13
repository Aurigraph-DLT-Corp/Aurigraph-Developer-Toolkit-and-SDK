# Aurigraph SDK Release Process

This document describes how to cut a release and publish the Aurigraph SDK packages.

## Overview

All SDK packages are published automatically when a Git tag matching `v*` is pushed to the repository. Each language has its own release workflow that publishes to the respective package registry.

| Language   | Registry       | Package Name        | Workflow                   |
|------------|----------------|---------------------|----------------------------|
| Java       | Maven Central  | `io.aurigraph:dlt-sdk` | `release-java.yml`      |
| TypeScript | npm            | `@aurigraph/dlt-sdk`   | `release-npm.yml`       |
| Python     | PyPI           | `aurigraph-sdk`        | `release-pypi.yml`      |
| Rust       | crates.io      | `aurigraph-dlt-sdk`    | `release-crates.yml`    |

## Step-by-Step Release

### 1. Bump versions in each SDK

Update version numbers in the following files to the new version (e.g., `1.3.0`):

- **Java**: `java/pom.xml` (`<version>1.3.0</version>`)
- **TypeScript**: `typescript/package.json` (`"version": "1.3.0"`)
- **Python**: `python/pyproject.toml` (`version = "1.3.0"`)
- **Rust** (when added): `rust/Cargo.toml` (`version = "1.3.0"`)

### 2. Commit the version bump

```bash
git add java/pom.xml typescript/package.json python/pyproject.toml
git commit -m "chore: bump SDK versions to 1.3.0"
git push origin main
```

### 3. Create and push the tag

```bash
git tag v1.3.0
git push origin v1.3.0
```

This triggers all `release-*.yml` workflows automatically.

### 4. Monitor the release

- Go to **Actions** tab on GitHub to watch each workflow.
- Each workflow runs tests before publishing.
- Once complete, verify the packages:
  - Maven Central: https://central.sonatype.com/artifact/io.aurigraph/dlt-sdk
  - npm: https://www.npmjs.com/package/@aurigraph/dlt-sdk
  - PyPI: https://pypi.org/project/aurigraph-sdk/

### 5. Create GitHub Release (optional)

The npm workflow automatically attaches a tarball to the GitHub Release. You can add release notes manually via the GitHub UI or CLI:

```bash
gh release create v1.3.0 --generate-notes
```

## Manual Release (workflow_dispatch)

Each release workflow can also be triggered manually from the GitHub Actions UI. This is useful for re-publishing after a failed release or for testing.

1. Go to **Actions** > select the workflow (e.g., `Release Java SDK`)
2. Click **Run workflow**
3. Select the branch/tag and click **Run**

## Setting Up Secrets

Configure these in **Settings > Secrets and variables > Actions** on the GitHub repository.

### Maven Central (Java)

| Secret           | Description                                                    |
|------------------|----------------------------------------------------------------|
| `OSSRH_USERNAME` | Sonatype OSSRH username (from s01.oss.sonatype.org)            |
| `OSSRH_TOKEN`    | Sonatype OSSRH token (generated in Sonatype account settings)  |
| `GPG_PRIVATE_KEY`| ASCII-armored GPG private key (`gpg --armor --export-secret-keys YOUR_KEY_ID`) |
| `GPG_PASSPHRASE` | Passphrase for the GPG key                                     |

**Prerequisites**:
1. Create a Sonatype OSSRH account at https://s01.oss.sonatype.org
2. Claim the `io.aurigraph` group ID (via JIRA ticket or domain verification)
3. Generate a GPG key: `gpg --gen-key` (RSA 4096-bit recommended)
4. Publish the public key: `gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID`
5. Add a `release` profile to `java/pom.xml` with maven-gpg-plugin, nexus-staging-maven-plugin, maven-source-plugin, and maven-javadoc-plugin

### npm (TypeScript)

| Secret      | Description                                              |
|-------------|----------------------------------------------------------|
| `NPM_TOKEN` | Automation token from npmjs.com (Settings > Access Tokens > Generate New Token > Automation) |

**Prerequisites**:
1. Create an npm account at https://www.npmjs.com
2. Create the `@aurigraph` organization (if not already created)
3. Ensure `package.json` contains `"publishConfig": { "registry": "https://registry.npmjs.org/", "access": "public" }`

### PyPI (Python) — Trusted Publishers

No secret needed after initial setup. Uses OIDC (Trusted Publishers).

**One-time setup**:
1. Go to https://pypi.org/manage/project/aurigraph-sdk/settings/publishing/
2. Add a new publisher:
   - Owner: `Aurigraph-DLT-Corp`
   - Repository: `Aurigraph-Developer-Toolkit-and-SDK`
   - Workflow name: `release-pypi.yml`
   - Environment: (leave blank)
3. The workflow's `id-token: write` permission handles the rest

### crates.io (Rust)

| Secret           | Description                                          |
|------------------|------------------------------------------------------|
| `CRATES_IO_TOKEN`| API token from crates.io (Settings > API Tokens)     |

**Prerequisites**:
1. Create an account at https://crates.io (via GitHub login)
2. Generate an API token with publish scope

## Rollback Procedure

### If a bad version is published

**Maven Central**: Releases are immutable. Publish a new patch version with the fix.

**npm**:
```bash
# Unpublish within 72 hours of publish
npm unpublish @aurigraph/dlt-sdk@1.3.0

# Or deprecate (preferred — does not break existing installs)
npm deprecate @aurigraph/dlt-sdk@1.3.0 "Critical bug — use 1.3.1"
```

**PyPI**:
```bash
# Yank the release (hides from pip install, but still accessible by exact version)
# Done via PyPI web UI: Project > Manage > Release > Options > Yank
```

**crates.io**:
```bash
cargo yank --version 1.3.0
```

### If a workflow fails mid-publish

1. Check the workflow logs in GitHub Actions.
2. Fix the issue (usually a test failure or auth problem).
3. Re-run the failed workflow via **workflow_dispatch**, or delete and re-push the tag:
   ```bash
   git tag -d v1.3.0
   git push origin :refs/tags/v1.3.0
   git tag v1.3.0
   git push origin v1.3.0
   ```

## CI Workflow

Every push to `main` and every PR runs the `ci.yml` workflow which validates all SDKs in parallel (compile, test, lint). Releases are gated on these checks passing.

## Security Scanning

The `security-scan.yml` workflow runs weekly (Monday 00:00 UTC) and audits dependencies across all languages. Results for Java (OWASP) are uploaded to the GitHub Security tab. Critical/high CVEs fail the workflow.

## Dependabot

Dependabot is configured (`.github/dependabot.yml`) to open PRs weekly for dependency updates across Maven, npm, pip, and GitHub Actions.
