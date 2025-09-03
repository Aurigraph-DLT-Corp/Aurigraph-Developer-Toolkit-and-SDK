#!/bin/bash

# 🔧 Git Hooks Setup for Aurigraph-DLT Development
# Sets up pre-commit hooks for code quality and consistency

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    log_success "Git repository detected"
}

# Install husky if not already installed
install_husky() {
    log_header "Installing Husky Git Hooks"
    
    # Check if husky is installed in AV10-7
    if [ -d "aurigraph-av10-7" ]; then
        cd aurigraph-av10-7
        
        if ! npm list husky > /dev/null 2>&1; then
            log_info "Installing husky..."
            npm install --save-dev husky
        else
            log_success "Husky already installed"
        fi
        
        # Initialize husky
        log_info "Initializing husky..."
        npx husky install
        
        cd ..
    else
        log_warning "aurigraph-av10-7 directory not found, skipping husky setup"
    fi
}

# Create pre-commit hook
create_pre_commit_hook() {
    log_header "Creating Pre-commit Hook"
    
    if [ -d "aurigraph-av10-7" ]; then
        cd aurigraph-av10-7
        
        # Create .husky directory if it doesn't exist
        mkdir -p .husky
        
        # Create pre-commit hook
        cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Check if we're in the AV10-7 directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in AV10-7 directory, skipping checks"
    exit 0
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 passed${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# 1. TypeScript compilation check
echo -e "${BLUE}🔧 Checking TypeScript compilation...${NC}"
npm run typecheck
check_command "TypeScript compilation"

# 2. ESLint check
echo -e "${BLUE}🔍 Running ESLint...${NC}"
npm run lint
check_command "ESLint"

# 3. Prettier check
echo -e "${BLUE}💅 Checking code formatting...${NC}"
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json}"
check_command "Prettier formatting"

# 4. Unit tests
echo -e "${BLUE}🧪 Running unit tests...${NC}"
npm run test:unit
check_command "Unit tests"

# 5. Security audit
echo -e "${BLUE}🔒 Running security audit...${NC}"
npm audit --audit-level moderate
check_command "Security audit"

echo -e "${GREEN}🎉 All pre-commit checks passed!${NC}"
EOF

        # Make the hook executable
        chmod +x .husky/pre-commit
        
        cd ..
        log_success "Pre-commit hook created"
    fi
}

# Create commit-msg hook for conventional commits
create_commit_msg_hook() {
    log_header "Creating Commit Message Hook"
    
    if [ -d "aurigraph-av10-7" ]; then
        cd aurigraph-av10-7
        
        # Install commitlint if not already installed
        if ! npm list @commitlint/cli > /dev/null 2>&1; then
            log_info "Installing commitlint..."
            npm install --save-dev @commitlint/cli @commitlint/config-conventional
        fi
        
        # Create commitlint config if it doesn't exist
        if [ ! -f "commitlint.config.js" ]; then
            cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Reverting changes
        'quantum',  // Quantum-specific features
        'consciousness', // Consciousness interface changes
        'rwa',      // Real World Assets changes
        'security', // Security improvements
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
EOF
            log_success "Commitlint config created"
        fi
        
        # Create commit-msg hook
        cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Validating commit message..."

# Run commitlint
npx --no-install commitlint --edit "$1"

if [ $? -eq 0 ]; then
    echo "✅ Commit message is valid"
else
    echo "❌ Commit message validation failed"
    echo ""
    echo "📝 Commit message format:"
    echo "   <type>(<scope>): <subject>"
    echo ""
    echo "🏷️  Valid types:"
    echo "   feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
    echo "   quantum, consciousness, rwa, security"
    echo ""
    echo "📋 Examples:"
    echo "   feat(quantum): add parallel universe processing"
    echo "   fix(consciousness): resolve welfare monitoring issue"
    echo "   docs(rwa): update tokenization specifications"
    echo "   test(api): add integration tests for quantum endpoints"
    exit 1
fi
EOF

        # Make the hook executable
        chmod +x .husky/commit-msg
        
        cd ..
        log_success "Commit message hook created"
    fi
}

# Create pre-push hook
create_pre_push_hook() {
    log_header "Creating Pre-push Hook"
    
    if [ -d "aurigraph-av10-7" ]; then
        cd aurigraph-av10-7
        
        # Create pre-push hook
        cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 passed${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# 1. Build check
echo -e "${BLUE}🏗️ Building project...${NC}"
npm run build
check_command "Build"

# 2. Integration tests
echo -e "${BLUE}🧪 Running integration tests...${NC}"
npm run test:integration
check_command "Integration tests"

# 3. Security tests
echo -e "${BLUE}🔒 Running security tests...${NC}"
npm run test:security
check_command "Security tests"

# 4. Performance tests (if available)
if npm run | grep -q "test:performance"; then
    echo -e "${BLUE}⚡ Running performance tests...${NC}"
    npm run test:performance
    check_command "Performance tests"
fi

echo -e "${GREEN}🎉 All pre-push checks passed! Ready to push.${NC}"
EOF

        # Make the hook executable
        chmod +x .husky/pre-push
        
        cd ..
        log_success "Pre-push hook created"
    fi
}

# Setup lint-staged for staged files only
setup_lint_staged() {
    log_header "Setting up Lint-staged"
    
    if [ -d "aurigraph-av10-7" ]; then
        cd aurigraph-av10-7
        
        # Install lint-staged if not already installed
        if ! npm list lint-staged > /dev/null 2>&1; then
            log_info "Installing lint-staged..."
            npm install --save-dev lint-staged
        fi
        
        # Add lint-staged configuration to package.json if not exists
        if ! grep -q "lint-staged" package.json; then
            log_info "Adding lint-staged configuration..."
            
            # Create temporary file with lint-staged config
            cat > .lint-staged.config.js << 'EOF'
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  '*.{js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
    'git add'
  ],
  '*.sol': [
    'solhint --fix',
    'prettier --write',
    'git add'
  ]
};
EOF
            log_success "Lint-staged configuration created"
        fi
        
        cd ..
    fi
}

# Main execution
main() {
    log_header "🔧 Setting up Git Hooks for Aurigraph-DLT"
    
    check_git_repo
    install_husky
    create_pre_commit_hook
    create_commit_msg_hook
    create_pre_push_hook
    setup_lint_staged
    
    log_header "🎉 Git Hooks Setup Complete!"
    log_success "Git hooks have been configured successfully!"
    log_info "The following hooks are now active:"
    echo -e "  ${GREEN}✅${NC} Pre-commit: TypeScript, ESLint, Prettier, Unit tests, Security audit"
    echo -e "  ${GREEN}✅${NC} Commit-msg: Conventional commit format validation"
    echo -e "  ${GREEN}✅${NC} Pre-push: Build, Integration tests, Security tests"
    echo ""
    log_info "Example commit messages:"
    echo -e "  ${YELLOW}feat(quantum): add parallel universe processing${NC}"
    echo -e "  ${YELLOW}fix(consciousness): resolve welfare monitoring issue${NC}"
    echo -e "  ${YELLOW}docs(rwa): update tokenization specifications${NC}"
}

# Run main function
main "$@"
