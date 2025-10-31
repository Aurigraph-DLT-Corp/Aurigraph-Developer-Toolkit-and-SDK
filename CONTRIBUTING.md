# Contributing to Aurigraph SDK

Thank you for your interest in contributing to the Aurigraph SDK! This document provides guidelines and instructions for contributing.

## 🤝 Ways to Contribute

- **Bug Reports** - Report issues you find
- **Feature Requests** - Suggest new functionality
- **Documentation** - Improve guides and examples
- **Code Contributions** - Submit pull requests
- **Community** - Help other developers

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing [GitHub Issues](https://github.com/Aurigraph-DLT/aurigraph-sdk/issues)
2. Update to latest SDK version
3. Reproduce the issue consistently

### Submitting a Bug Report

Provide the following information:

```markdown
**Description**
Brief description of the bug

**Steps to Reproduce**
1. Initialize client with...
2. Call method...
3. Observe...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Node.js version:
- SDK version:
- Platform: macOS/Linux/Windows

**Code Example**
```typescript
// Minimal reproducible example
```
```

## 💡 Suggesting Enhancements

### Before Suggesting

1. Check if feature already exists
2. Check existing [issues](https://github.com/Aurigraph-DLT/aurigraph-sdk/issues)
3. Ensure it aligns with SDK goals

### Enhancement Template

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear and concise description

**Describe alternatives you've considered**
Other solutions or features

**Additional context**
Any other context or examples
```

## 🔨 Setting Up Development

### Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher
- Git

### Setup Steps

```bash
# Clone repository
git clone https://github.com/Aurigraph-DLT/aurigraph-sdk.git
cd aurigraph-sdk

# Install dependencies
npm install

# Verify setup
npm test
```

## 📝 Development Workflow

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or for bugfix
git checkout -b fix/your-bug-name
```

### Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation
- `test/test-name` - Test improvements
- `perf/optimization-name` - Performance improvements

### 2. Make Changes

```bash
# Make your changes
# Keep commits atomic and well-described

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description

Longer description if needed.

Closes #issue-number
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Test improvements
- `perf:` - Performance
- `chore:` - Build/dependency

**Examples**:
```
feat(client): add streaming support for transaction events

fix(auth): handle token expiry correctly

docs(guide): add OAuth 2.0 authentication examples

test(client): improve test coverage for error handling
```

### 4. Create Pull Request

1. Push branch to GitHub
2. Open Pull Request with clear title and description
3. Reference related issues
4. Wait for review and CI checks

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Breaking change

## Related Issues
Closes #issue-number

## Testing
- [ ] Added tests for new functionality
- [ ] Tests pass locally
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where complex
- [ ] Documentation updated
- [ ] No new warnings generated
```

## 📋 Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ❌ Bad
export interface ApiResponse {
  success: boolean;
  data: any;
}

// ✅ Use types
const balance: string = await client.getBalance(address);

// ❌ Avoid any
const balance: any = await client.getBalance(address);

// ✅ Use async/await
async function getStatus() {
  return await client.getNetworkStatus();
}

// ❌ Avoid .then() chains
client.getNetworkStatus().then(status => { ... });
```

### Comments

```typescript
// ✅ Clear comments
/**
 * Get balance for an address
 * @param address - Blockchain address
 * @returns Balance as string in wei
 */
async getBalance(address: string): Promise<string>

// ❌ Obvious comments
// Get balance
async getBalance(address: string): Promise<string>
```

### Formatting

```bash
# Run formatter
npm run format

# Check lint
npm run lint

# Fix lint issues
npm run lint --fix
```

## 🧪 Testing

### Write Tests

```typescript
import { describe, it, expect } from 'vitest';
import { AurigraphClient } from '../src';

describe('AurigraphClient', () => {
  it('should get network status', async () => {
    const client = new AurigraphClient(config);
    const status = await client.getNetworkStatus();

    expect(status.currentHeight).toBeGreaterThan(0);
    expect(status.tps).toBeGreaterThan(0);
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- client.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run watch
```

### Coverage Requirements

- Minimum: 80% line coverage
- Target: 90%+ for critical paths
- New features must have tests

## 📚 Documentation

### Update Documentation

1. **Code Comments** - Add JSDoc comments
2. **Examples** - Add to `examples/` directory
3. **Guides** - Update `docs/` directory
4. **README** - Update root README.md

### Documentation Format

```markdown
# Section

Brief introduction.

## Subsection

Explanation with code examples.

```typescript
// code example
```

### Files to Update

- `README.md` - Quick start and overview
- `docs/DEVELOPER_GUIDE.md` - Detailed guides
- `docs/API_REFERENCE.md` - API documentation
- `examples/` - Working examples

## 🔍 Review Process

### What Reviewers Look For

1. **Correctness** - Code works as intended
2. **Style** - Follows guidelines
3. **Testing** - Has appropriate tests
4. **Documentation** - Updated docs
5. **Performance** - No degradation
6. **Security** - No vulnerabilities

### Making Changes After Review

```bash
# Make requested changes
# Commit with clear message
git commit -m "Address review feedback"

# Push to branch
git push origin feature/your-feature-name

# Don't force push unless explicitly asked
```

## 🚀 Release Process

### Version Numbering

Follows [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., 1.0.0)
- `MAJOR` - Breaking changes
- `MINOR` - New features
- `PATCH` - Bug fixes

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Publish to npm
5. Create GitHub release

## 📞 Need Help?

- **GitHub Issues** - For bug reports and features
- **Email** - support@aurigraph.io
- **Slack** - https://aurigraph.slack.com
- **Discord** - https://discord.gg/aurigraph

## 📖 Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## ✅ Checklist Before Submitting

- [ ] Code follows style guidelines
- [ ] Changes are well-documented
- [ ] Tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No coverage regression
- [ ] PR has clear description
- [ ] Related issues are referenced
- [ ] No breaking changes without reason

---

**Thank you for contributing to Aurigraph SDK! 🙌**
