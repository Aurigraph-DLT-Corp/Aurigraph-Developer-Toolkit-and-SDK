#!/bin/bash

# Setup Development Environment for Aurigraph V11
# Installs pre-commit hook and configures git

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🚀 Setting up Aurigraph V11 development environment..."
echo ""

# 1. Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"
echo "✅ Git hooks directory ready: $GIT_HOOKS_DIR"

# 2. Install pre-commit hook
PRE_COMMIT_HOOK="$GIT_HOOKS_DIR/pre-commit"
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

set -e

echo "🔍 Running pre-commit quality checks..."

cd aurigraph-av10-7/aurigraph-v11-standalone

echo "  ├─ Running unit tests (unit-tests-only profile)..."
if ! ./mvnw clean test -Punit-tests-only -q -DskipITs 2>/dev/null; then
    echo ""
    echo "❌ COMMIT BLOCKED: Unit tests failed"
    echo ""
    echo "To fix the issues, run:"
    echo "  cd aurigraph-av10-7/aurigraph-v11-standalone"
    echo "  ./mvnw test -Punit-tests-only"
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "  └─ ✅ All unit tests passed"
echo ""
echo "✅ Pre-commit checks completed successfully!"

exit 0
EOF

chmod +x "$PRE_COMMIT_HOOK"
echo "✅ Pre-commit hook installed: $PRE_COMMIT_HOOK"

# 3. Configure git settings for the project
echo ""
echo "Configuring git settings..."
cd "$PROJECT_ROOT"

# Set safer defaults for pushing
git config --local push.default simple || true
git config --local pull.ff only || true

echo "✅ Git configuration updated"

# 4. Verify Java and Maven
echo ""
echo "Verifying development environment..."

if ! command -v java &> /dev/null; then
    echo "⚠️  Java not found. Please install Java 21+"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep 'version' | sed 's/.*version "\([0-9]*\).*/\1/')
if [ -n "$JAVA_VERSION" ] && [ "$JAVA_VERSION" -lt 21 ]; then
    echo "⚠️  Java 21+ required, but found version $JAVA_VERSION"
    exit 1
fi
echo "✅ Java version: $(java -version 2>&1 | grep 'version')"

if ! command -v mvn &> /dev/null; then
    echo "⚠️  Maven not found. Please install Maven 3.9+"
    exit 1
fi
echo "✅ Maven version: $(mvn -version | head -1)"

# 5. Check Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker available: $(docker --version)"
else
    echo "⚠️  Docker not found. Integration tests will be skipped."
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "Quick start commands:"
echo "  cd aurigraph-av10-7/aurigraph-v11-standalone"
echo "  ./mvnw clean test -Punit-tests-only         # Run fast unit tests (30s)"
echo "  ./mvnw test -Pintegration-tests              # Run integration tests (5min)"
echo "  ./mvnw verify -Pfull-test-suite              # Run all tests + coverage (15min)"
echo ""

exit 0
