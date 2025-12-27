# 🛠️ Aurigraph SDK Projects - ASAP Sprint

**Epic**: AV11-906 (SDK Development)
**Team**: @SDKDevTeam
**Status**: ✅ READY TO START
**Timeline**: 4 Weeks (ASAP)

---

## 📦 Project Overview

Build production-grade SDK libraries for Aurigraph V11 across TypeScript/JavaScript, Python, and Go, with **Real-World Asset Tokenization (RWAT)** support, gRPC, and wallet integration utilities.

### 🌍 RWAT Capabilities

The Aurigraph SDKs provide native support for tokenizing real-world assets (RWA) from 3rd party sources:
- **Asset Registration**: Register any real-world asset (real estate, commodities, art, carbon credits, etc.)
- **Token Creation**: Create fungible or non-fungible tokens backed by real assets
- **Fractional Ownership**: Enable fractional ownership of high-value assets
- **Oracle Integration**: Connect to data oracles for asset valuation and verification
- **Smart Contracts**: Deploy asset-backed smart contracts
- **Compliance**: Built-in KYC/AML and regulatory compliance hooks

## 📁 Project Structure

```
sdks/
├── typescript/          # TypeScript/JavaScript SDK
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── python/              # Python SDK (asyncio)
│   ├── aurigraph/
│   ├── tests/
│   ├── setup.py
│   └── README.md
├── go/                  # Go SDK
│   ├── aurigraph/
│   ├── tests/
│   ├── go.mod
│   └── README.md
└── README.md            # This file
```

## 🚀 Getting Started

### 1. TypeScript/JavaScript SDK (AV11-910)
```bash
cd sdks/typescript
npm install
npm run build
npm test
npm publish
```

### 2. Python SDK (AV11-911)
```bash
cd sdks/python
pip install -e .
python -m pytest
python setup.py sdist bdist_wheel
twine upload dist/*
```

### 3. Go SDK (AV11-912)
```bash
cd sdks/go
go test ./...
go build
git tag v1.0.0
git push --tags
```

### 4. gRPC Protocol Wrapper (AV11-913)
- Protobuf definitions in `proto/`
- Code generation for TS, Python, Go
- gRPC service wrappers

### 5. Wallet Integration (AV11-914)
- Key management utilities
- Transaction signing
- Mnemonic support

## 📋 Tickets

| Ticket | Task | Status |
|--------|------|--------|
| AV11-910 | TypeScript/JavaScript Client | 🔵 Todo |
| AV11-911 | Python SDK (async) | 🔵 Todo |
| AV11-912 | Go Client Library | 🔵 Todo |
| AV11-913 | gRPC Protocol Wrapper | 🔵 Todo |
| AV11-914 | Wallet Integration Module | 🔵 Todo |

## 📚 Architecture

See [`docs/architecture/SDK_ARCHITECTURE.md`](../docs/architecture/SDK_ARCHITECTURE.md) for:
- Detailed architecture overview
- API contracts
- Type definitions
- Usage examples
- Testing strategy

## 🎯 Success Criteria

- ✅ All 3 SDKs published (npm, PyPI, Go)
- ✅ 80%+ test coverage each
- ✅ Complete documentation
- ✅ Working examples
- ✅ gRPC support
- ✅ Wallet utilities included

## 🔗 Quick Links

- **JIRA Epic**: [AV11-906](https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/issues/AV11-906)
- **Architecture**: [`docs/architecture/SDK_ARCHITECTURE.md`](../docs/architecture/SDK_ARCHITECTURE.md)
- **Sprint Coordination**: [`SPRINT_COORDINATION.md`](../SPRINT_COORDINATION.md)
- **Team**: @SDKDevTeam

---

**Status**: ✅ Ready to start
**Timeline**: 4 weeks
**Target**: January 24, 2025
