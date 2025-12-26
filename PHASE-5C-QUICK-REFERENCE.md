# Phase 5C: Quick Reference Guide

## TL;DR - Getting Started

### New Developer Setup (1 minute)
```bash
cd Aurigraph-DLT
./scripts/setup-dev-environment.sh
# Done! Pre-commit hook installed and configured
```

### Daily Development Workflow
```bash
# Before committing (30 seconds)
./scripts/run-tests.sh quick

# Then commit normally
git add .
git commit -m "Your message"
# Pre-commit hook validates automatically

# Before pull request (10 minutes)
./scripts/run-tests.sh all
```

---

## What Gets Installed

| Item | What | Why |
|------|------|-----|
| **Pre-commit hook** | `.git/hooks/pre-commit` | Blocks commits with failing tests |
| **Git config** | `push.default=simple` | Safe pushing (current branch only) |
| **Git config** | `pull.ff=only` | Prevents accidental merge commits |

---

## Test Commands

### Quick (30 seconds)
```bash
./scripts/run-tests.sh quick
# or unit
./scripts/run-tests.sh unit
```
**Use**: Before commits, quick validation

### Full Suite (10-15 minutes)
```bash
./scripts/run-tests.sh all
# or full
./scripts/run-tests.sh full
```
**Use**: Before pull requests, complete validation

### Coverage Report (10-15 minutes)
```bash
./scripts/run-tests.sh coverage
```
**Use**: Check test coverage, opens browser

### Integration Tests (2-5 minutes)
```bash
./scripts/run-tests.sh integration
```
**Use**: Test with real services (requires Docker)

### Help
```bash
./scripts/run-tests.sh --help
./scripts/run-tests.sh -h
./scripts/run-tests.sh help
```

---

## Pre-Commit Hook Behavior

### What Happens
```bash
git commit -m "Your message"
# ↓
# Pre-commit hook runs
# ├─ Runs unit tests
# ├─ Takes ~30 seconds
# └─ If pass: commit succeeds
#    If fail: commit BLOCKED with error message
```

### Bypass (Emergency Only)
```bash
git commit --no-verify  # Skips hook checks (NOT RECOMMENDED)
```

---

## File Locations

```
/Aurigraph-DLT/
├── .git/hooks/pre-commit           ← Pre-commit hook
├── scripts/
│   ├── setup-dev-environment.sh    ← Run once (setup)
│   └── run-tests.sh                ← Run frequently (tests)
└── PHASE-5C-PRE-COMMIT-VERIFICATION.md  ← Full documentation
```

---

## Commands You Need

### Setup (Once)
```bash
./scripts/setup-dev-environment.sh
```

### Testing (Frequently)
```bash
./scripts/run-tests.sh quick        # 30s - before commits
./scripts/run-tests.sh all          # 10-15m - before PR
./scripts/run-tests.sh coverage     # 10-15m - check coverage
./scripts/run-tests.sh help         # show all options
```

### Manual Maven (Advanced)
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

./mvnw test -Punit-tests-only      # Unit tests only
./mvnw test -Pintegration-tests    # Integration tests
./mvnw verify -Pfull-test-suite    # All tests + coverage

# View coverage report
open target/site/jacoco/index.html
```

---

## Checklist: Did It Work?

- [ ] `./scripts/setup-dev-environment.sh` - completes successfully
- [ ] `./scripts/run-tests.sh quick` - takes ~30 seconds
- [ ] `cat .git/hooks/pre-commit` - shows hook content
- [ ] `ls -la .git/hooks/pre-commit` - shows executable (rwx--x--x)
- [ ] `git config --local push.default` - shows "simple"
- [ ] `git config --local pull.ff` - shows "only"

✅ All items checked? You're ready to develop!

---

## Common Issues

### "Hook not running"
```bash
chmod +x .git/hooks/pre-commit      # Make executable
./scripts/setup-dev-environment.sh  # Re-run setup
```

### "Tests fail for no reason"
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean test -Punit-tests-only  # Run manually to see actual error
```

### "Docker not found"
```bash
# Docker is optional - unit tests work without it
# Install Docker Desktop if integration tests needed
```

### "Java version wrong"
```bash
java --version  # Should show version 21+
# Install from: https://www.oracle.com/java/technologies/downloads/
```

---

## When to Use What

| Situation | Command | Time |
|-----------|---------|------|
| Before committing | `./scripts/run-tests.sh quick` | 30s |
| Creating feature branch | `./scripts/run-tests.sh all` | 10-15m |
| Before pull request | `./scripts/run-tests.sh all` | 10-15m |
| Check test coverage | `./scripts/run-tests.sh coverage` | 10-15m |
| Need to test with services | `./scripts/run-tests.sh integration` | 2-5m |
| Fresh build | `./scripts/run-tests.sh clean` then `./mvnw package` | 5m |

---

## Questions?

**For complete documentation**: See `PHASE-5C-PRE-COMMIT-VERIFICATION.md`

**For help with scripts**:
```bash
./scripts/run-tests.sh --help
./scripts/setup-dev-environment.sh  # Re-run to verify setup
```

**For Maven issues**:
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw --help
```

---

**Remember**:
- Pre-commit hook runs automatically - no action needed
- Run `./scripts/run-tests.sh quick` before commits
- Run `./scripts/run-tests.sh all` before pull requests
- Use `git commit --no-verify` only in emergencies
