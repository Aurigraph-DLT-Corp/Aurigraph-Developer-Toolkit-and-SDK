# Smart Contract Lawyer Skill - Claude Code Specification

**Version**: 1.0.0
**Status**: Ready for Implementation
**Target Integration**: Claude Code Plugin Framework
**Created**: Sprint 19 - Legal & Compliance Infrastructure

---

## 1. Skill Overview

The **Smart Contract Lawyer** skill provides specialized expertise for smart contract legal review, security compliance, and risk assessment. It automates the analysis of smart contract code and documentation to ensure legal compliance, identify liability risks, and provide guidance on contract architecture.

### Primary Use Cases
- 📋 **Smart Contract Audits** - Legal review of contract code before deployment
- 🔒 **Security & Liability** - Identify legal implications of contract vulnerabilities
- 📝 **Documentation** - Generate legal documentation for smart contract terms
- ⚖️ **Compliance** - Ensure compliance with relevant blockchain regulations
- 🏛️ **Governance** - Review contract governance mechanisms and upgrade procedures
- 🤝 **Multi-Chain** - Analyze cross-chain contract interactions and bridge security
- 💼 **Commercial Terms** - Review license terms, usage rights, and commercial restrictions

### Skill Authority
- Expert in blockchain technology, smart contracts, and distributed systems law
- Deep knowledge of Ethereum, Solana, and multi-chain contract standards
- Expertise in contract auditing, formal verification, and formal methods
- Understanding of upgradeable contract patterns and governance
- Knowledge of token standards (ERC-20, ERC-721, ERC-1155, etc.)

---

## 2. Skill Configuration

```yaml
---
title: Smart Contract Lawyer
description: >
  Expert smart contract legal analysis, security compliance review, and
  liability risk assessment for blockchain platforms and DeFi protocols.
skills:
  - smartcontract-lawyer
```

---

## 3. Available Commands

### 3.1 `/review` - Smart Contract Legal Review

**Purpose**: Comprehensive legal review of smart contract code and architecture

**Syntax**:
```
/review [file-path] [options]
```

**Parameters**:
- `file-path` - Path to smart contract file (Solidity, Rust, or other)
- `--chain` - Blockchain platform (ethereum, solana, polygon, arbitrum, base, avalanche)
- `--standard` - Token or contract standard (ERC-20, ERC-721, ERC-1155, SPL, BEP-20)
- `--version` - Solidity/language version for compatibility checks
- `--formal-verification` - Include formal verification concerns

**Example**:
```
/review src/contracts/MyToken.sol --chain ethereum --standard ERC-20 --version 0.8.0
```

**Analysis Includes**:
1. **License Terms** - Review license restrictions and implications
2. **Liability Risk** - Identify high-risk code patterns and liability concerns
3. **Upgrade Mechanisms** - Analyze proxy patterns and upgrade security
4. **Access Control** - Review permission systems and role-based access
5. **Token Economics** - Analyze mint/burn/transfer mechanisms
6. **Governance** - Review voting and governance implementations
7. **Multi-Chain Risk** - Assess cross-chain contract interactions
8. **Formal Properties** - Identify unverified formal properties

---

### 3.2 `/audit` - Deep Security & Legal Audit

**Purpose**: In-depth audit combining security and legal compliance concerns

**Syntax**:
```
/audit [contract-name] [options]
```

**Parameters**:
- `contract-name` - Name of contract to audit
- `--severity-level` - Critical, High, Medium, Low
- `--known-vulnerabilities` - Check against known vulnerability patterns
- `--formal-proof` - Verify formal properties if available

**Analysis Scope**:
- Reentrancy patterns and legal liability
- Integer overflow/underflow risks and contract state violations
- Access control gaps and unauthorized action risks
- Token transfer security and compliance
- Oracle interaction risks
- Emergency pause mechanisms
- Fund recovery options
- Governance vulnerability

---

### 3.3 `/compliance` - Regulatory Compliance Check

**Purpose**: Verify compliance with applicable blockchain regulations and standards

**Syntax**:
```
/compliance [contract-address] [options]
```

**Parameters**:
- `contract-address` - Deployed contract address
- `--jurisdiction` - Target jurisdiction (US, EU, APAC, Global)
- `--regulation` - Specific regulation (MiCA, DFA, Dodd-Frank, etc.)
- `--tokens` - Token/asset types involved (governance, utility, security)

**Compliance Verification**:
- **US Regulations**
  - SEC Securities Laws (Howey Test applicability)
  - CFTC Commodity Futures Laws
  - FinCEN AML/KYC requirements
  - OFAC Sanctions Compliance
  - State Money Transmitter Laws

- **EU Regulations (MiCA)**
  - Markets in Crypto-Assets Regulation
  - Stablecoin requirements
  - AML/CFT compliance
  - Operational resilience
  - Environmental sustainability disclosures

- **International Standards**
  - FATF Guidance on Virtual Assets
  - ISO 20022 Standards
  - Basel III Crypto Asset Framework
  - Environmental/ESG Reporting

---

### 3.4 `/upgrade` - Contract Upgrade Safety & Governance

**Purpose**: Review upgrade mechanisms, proxy patterns, and governance procedures

**Syntax**:
```
/upgrade [proxy-address] [implementation-address] [options]
```

**Parameters**:
- `proxy-address` - Proxy contract address
- `implementation-address` - New implementation address
- `--pattern` - Proxy pattern (UUPS, Transparent, Beacon)
- `--governance` - Governance mechanism (multisig, DAO, timelock)
- `--breaking-changes` - Detect breaking API changes

**Review Includes**:
- Proxy pattern security assessment
- Storage layout compatibility
- Function signature compatibility
- Access control continuity
- Governance procedure compliance
- Emergency pause availability
- Rollback procedures
- Time-lock effectiveness

---

### 3.5 `/crosschain` - Multi-Chain & Bridge Security

**Purpose**: Assess legal and security implications of cross-chain interactions

**Syntax**:
```
/crosschain [bridge-contract] [options]
```

**Parameters**:
- `bridge-contract` - Bridge contract address or file
- `--chains` - Involved blockchains (comma-separated)
- `--bridge-type` - Bridge pattern (atomic swap, wrapped asset, liquidity pool)
- `--validator-set` - Validator/relayer set configuration

**Analysis Focus**:
- Validator/relayer failure modes
- Wrapped asset risks (custodial vs. algorithmic)
- Atomic swap security
- Liquidity pool risk
- Slashing/penalty mechanisms
- Governance across chains
- Liability in case of bridge failure
- Insurance/recovery mechanisms

---

### 3.6 `/documentation` - Generate Legal Documentation

**Purpose**: Generate legal documentation and disclaimers for smart contracts

**Syntax**:
```
/documentation [contract-name] [options]
```

**Parameters**:
- `contract-name` - Name of the smart contract
- `--template` - Documentation template (standard, defi, nft, dao, bridge)
- `--jurisdiction` - Target jurisdiction for disclaimers
- `--risk-level` - Contract risk level assessment

**Generated Documents**:
1. **Smart Contract Terms** - Legal terms describing contract functionality
2. **Risk Disclosures** - Explicit risk warnings for users
3. **Disclaimer** - Liability limitations and disclaimers
4. **User Agreement** - Terms users must accept before interaction
5. **Emergency Procedures** - Procedures for emergency pause/recovery
6. **Upgrade Process** - Documentation of upgrade governance
7. **Governance Manual** - Manual for governance participants

---

### 3.7 `/governance` - Governance Structure & Safety

**Purpose**: Review governance mechanisms and voting security

**Syntax**:
```
/governance [governance-contract] [options]
```

**Parameters**:
- `governance-contract` - DAO/governance contract address
- `--voting-mechanism` - Type (simple majority, weighted, quadratic, conviction)
- `--proposal-threshold` - Minimum proposal requirement
- `--voting-period` - Duration of voting periods
- `--execution-delay` - Time-lock before execution

**Governance Review**:
- Voting mechanism security
- Quorum and threshold requirements
- Proposal creation safeguards
- Execution security (time-locks, multi-sig)
- Governance token distribution risks
- Flash loan voting attack mitigation
- Economic incentive alignment
- Governance gridlock prevention

---

### 3.8 `/tokens` - Token Standard & Economics Analysis

**Purpose**: Review token contract implementation and economic design

**Syntax**:
```
/tokens [token-contract] [options]
```

**Parameters**:
- `token-contract` - Token contract address or file
- `--standard` - Token standard (ERC-20, ERC-721, ERC-1155, SPL)
- `--behavior` - Special behaviors (burnable, mintable, pausable, capped)
- `--economics` - Analyze token economics (supply, inflation, deflation)

**Token Analysis**:
- Standard compliance verification
- Mint/burn authorization security
- Transfer restrictions
- Allowance/approval security
- Supply cap enforcement
- Inflation/deflation mechanisms
- Fee structures
- Special token behaviors
- Economics sustainability

---

### 3.9 `/formalmethods` - Formal Verification & Properties

**Purpose**: Review formal specifications and verification properties

**Syntax**:
```
/formalmethods [contract-file] [options]
```

**Parameters**:
- `contract-file` - Smart contract file
- `--spec-language` - Specification language (Dafny, TLA+, K-framework)
- `--properties` - Properties to verify (safety, liveness, fairness)
- `--tool` - Verification tool (Mythril, Securify, Slither)

**Formal Analysis**:
- Safety property verification
- Liveness property verification
- Invariant identification
- State transition correctness
- Reentrancy safety (formal proof)
- Integer arithmetic safety
- Access control invariants
- Temporal logic properties
- Model checking feasibility

---

### 3.10 `/recovery` - Emergency & Recovery Procedures

**Purpose**: Review emergency procedures and fund recovery mechanisms

**Syntax**:
```
/recovery [contract-address] [options]
```

**Parameters**:
- `contract-address` - Contract to analyze
- `--recovery-mechanism` - Type (pause, emergency withdraw, multisig recovery)
- `--fund-status` - Status of funds at risk (locked, claimable, recoverable)
- `--recovery-timeline` - Expected recovery period

**Recovery Analysis**:
- Emergency pause mechanism
- Emergency fund withdrawal
- Multisig recovery procedures
- Timelock recovery delays
- Insurance/backstop mechanisms
- Legal recovery procedures
- User claim procedures
- Fund custody during recovery

---

## 4. Integration with Codebase

The Smart Contract Lawyer skill integrates with:

### 4.1 File Integration
```
docs/legal/
├── contracts/
│   ├── SMART_CONTRACT_TERMS.md         # Contract legal terms template
│   ├── RISK_DISCLOSURES.md             # Risk disclosure templates
│   ├── EMERGENCY_PROCEDURES.md         # Emergency response procedures
│   └── UPGRADE_GOVERNANCE.md           # Upgrade governance documentation
├── standards/
│   ├── TOKEN_STANDARD_COMPLIANCE.md    # ERC/SPL compliance checklist
│   ├── PROXY_PATTERNS.md               # Proxy pattern security review
│   └── BRIDGE_SECURITY.md              # Cross-chain bridge security
└── compliance/
    ├── REGULATORY_REQUIREMENTS.md      # Global regulatory mapping
    └── JURISDICTION_GUIDE.md           # Jurisdiction-specific guidance
```

### 4.2 Entity Integration
```
Smart Contract Entities in Codebase:
- DemoRequest (CRM) - Schedule smart contract demos/audits
- Opportunity (CRM) - Track contract deployment opportunities
- Lead (CRM) - Manage client relationships for contracts
- RWARegistry - Real-world asset contract registry
- CrossChainBridge - Multi-chain contract interactions
```

### 4.3 Service Integration
```
Java Services to Integrate:
- SmartContractAuditService - Coordinate audits
- ComplianceReviewService - Regulatory compliance
- GovernanceAnalysisService - DAO governance review
- TokenAnalysisService - Token economics analysis
```

---

## 5. Implementation Guide

### 5.1 Plugin Structure
```
plugins/smart-contract-lawyer/
├── plugin.json                          # Plugin manifest
├── skill.md                             # This skill specification
├── commands/
│   ├── review.md                        # Review command
│   ├── audit.md                         # Audit command
│   ├── compliance.md                    # Compliance command
│   └── [other commands]...
├── templates/
│   ├── smart-contract-terms.liquid      # Contract terms template
│   ├── risk-disclosure.liquid           # Risk disclosure template
│   └── [other templates]...
└── agents/
    ├── review-agent.js                  # Review coordination agent
    ├── compliance-agent.js              # Compliance check agent
    └── [other agents]...
```

### 5.2 Skill Activation
```javascript
// In plugin manifest
"skills": [
  {
    "name": "smartcontract-lawyer",
    "description": "Expert smart contract legal analysis and security review",
    "triggers": ["review", "audit", "compliance", "upgrade", "crosschain", "documentation", "governance", "tokens", "formalmethods", "recovery"],
    "dependencies": ["blockchain-lawyer", "ip-lawyer", "privacy-lawyer"],
    "models": ["claude-opus-4-5", "claude-sonnet-4", "claude-haiku-4"]
  }
]
```

### 5.3 Context Integration
```yaml
# docs/legal/smart-contract-context.yaml
smartcontractLawyer:
  domains:
    - ethereumSolidityReview
    - solidityVulnerabilities
    - tokenStandardsCompliance
    - proxyPatterns
    - daoGovernance
    - crosschainBridges
    - formalVerification
    - regulatoryCompliance
    - emergencyProcedures
```

---

## 6. Training & Knowledge Base

### 6.1 Core Competencies

**Smart Contract Security Knowledge**:
- Common vulnerabilities (reentrancy, overflow, access control)
- Formal verification and property-based testing
- Fuzzing and symbolic execution
- Code review methodologies
- Gas optimization and security tradeoffs

**Legal & Regulatory Knowledge**:
- Securities laws applicability (Howey Test)
- Commodity futures laws (CFTC)
- AML/KYC requirements
- MiCA EU regulations
- Cross-border regulatory frameworks

**Blockchain Architecture**:
- EVM and Solana differences
- Proxy patterns (UUPS, Transparent, Beacon)
- Token standards (ERC-20, ERC-721, ERC-1155)
- Oracle security
- Cross-chain communication

**Risk Assessment**:
- Economic risk (flash loans, MEV, frontrunning)
- Technical risk (code vulnerabilities)
- Operational risk (key management, multisig)
- Legal risk (regulatory changes, liability)
- Systemic risk (interconnected protocols)

### 6.2 Training Data Sources

```
Knowledge Sources:
- OpenZeppelin Smart Contract Library (best practices)
- Consensys Smart Contract Weakness Classification (SWC)
- Ethereum Yellow Paper (technical spec)
- SEC Guidance on Virtual Assets
- EU MiCA Regulation text
- Token standards documentation (EIPs, SIPs)
- Formal verification research papers
- Blockchain security audit reports
- DAO governance case studies
```

### 6.3 Case Study Expertise

```
Notable Smart Contracts:
- MakerDAO (stablecoin governance)
- Uniswap V3 (AMM upgrade patterns)
- OpenSea (NFT marketplace)
- Aave (lending protocol governance)
- Compound (DeFi governance)
- WETH (wrapped ETH standard implementation)
- Multicall (utility contract design)
- Safe (multisig wallet)
```

---

## 7. Quality Assurance & Testing

### 7.1 Review Quality Checklist

```
Each review must cover:
☑ Smart contract code analysis
☑ Security vulnerability identification
☑ Legal liability assessment
☑ Regulatory compliance verification
☑ Best practice recommendations
☑ Risk ranking and prioritization
☑ Actionable remediation steps
☑ Formal property identification (if applicable)
```

### 7.2 Accuracy Standards

- **Vulnerability Detection**: ≥95% accuracy for known patterns
- **Compliance Accuracy**: 100% for jurisdictional requirements
- **Risk Assessment**: Consistency with industry standards
- **Legal Analysis**: Aligned with current case law
- **Recommendations**: Actionable and implementable

### 7.3 Audit Trail

Every analysis includes:
- Analysis timestamp and version
- Reviewer credentials/authority
- Jurisdiction and regulation version
- Risk level and confidence score
- Evidence citations
- Remediation tracking

---

## 8. Security & Confidentiality

### 8.1 Confidentiality Handling

```
Contract Code Handling:
- Assume all reviewed code is confidential
- No code snippets in public channels
- No contract addresses in public summaries
- Client-specific reports are confidential
- Aggregate statistics OK (anonymized)
```

### 8.2 Conflict of Interest

```
Cannot review contracts if:
- Involved in contract development
- Have financial interest in contract
- Represent competing protocol
- Have regulatory proceeding involvement
- Have prior engagement with adversary

Disclosure required for:
- Prior engagement with client
- Other clients in same ecosystem
- Financial holdings in related protocols
```

### 8.3 Expertise Limitations

**Cannot Perform**:
- Tax accounting advice
- Securities registration support
- Legal representation in litigation
- Investment recommendations
- Financial advisory services

**Can Perform**:
- Legal risk analysis
- Compliance documentation
- Security architecture review
- Governance procedure documentation
- Educational content

---

## 9. Success Metrics

### 9.1 Skill Performance KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Review Accuracy | ≥95% | Comparison with independent audits |
| Vulnerability Detection | ≥90% | False negative rate |
| Compliance Completeness | 100% | All regulations addressed |
| Client Satisfaction | ≥4.5/5 | Post-review feedback |
| Average Review Time | <2 hours | Per contract analysis |
| Critical Issue Detection | 100% | No missed high-severity issues |

### 9.2 Impact Metrics

- **Contracts Reviewed**: Number of smart contracts analyzed
- **Vulnerabilities Found**: Critical, high, medium, low categories
- **Compliance Issues Resolved**: Before deployment issues caught
- **Risk Mitigation**: Estimated losses prevented
- **Governance Improvements**: Procedures enhanced

---

## 10. Future Enhancements

### 10.1 Planned Features

**Phase 2**:
- Integration with automated static analysis tools (Slither, Mythril)
- Real-time contract monitoring for deployed contracts
- Governance proposal analysis automation
- Token economics simulation

**Phase 3**:
- Formal verification integration (Dafny, TLA+)
- Machine learning vulnerability detection
- Cross-contract interaction analysis
- Economic security modeling

**Phase 4**:
- AI-powered contract generation from specifications
- Automated remediation suggestions with code
- Real-time contract behavior monitoring
- Predictive risk analysis

### 10.2 Integration Roadmap

```
Q1 2025: Smart Contract Review Framework (MVP)
Q2 2025: Compliance & Regulatory Features
Q3 2025: Formal Methods Integration
Q4 2025: AI-Powered Analysis & Monitoring
```

---

## 11. Related Documentation

**Related Skills**:
- [Blockchain Lawyer Skill](BLOCKCHAIN_LAWYER_SKILL.md) - DLT/blockchain regulations
- [IP Lawyer Skill](IP_LAWYER_SKILL.md) - Code copyright & patent issues
- [Privacy Lawyer Skill](PRIVACY_LAWYER_SKILL.md) - Data & privacy compliance

**Related Guides**:
- [EULA Platform](EULA_PLATFORM.md) - Smart contract license terms
- [Terms Platform](TERMS_AND_CONDITIONS_PLATFORM.md) - Service T&Cs including contracts
- [Regulatory Requirements](../compliance/REGULATORY_REQUIREMENTS.md) - Legal framework

**Technical Documentation**:
- [Aurigraph Smart Contract Architecture](../../aurigraph-av10-7/docs/architecture/contracts/)
- [Cross-Chain Bridge Security](../../aurigraph-av10-7/docs/architecture/bridge/)
- [Token Standards Implementation](../../aurigraph-av10-7/docs/architecture/tokens/)

---

## Appendix A: Jurisdiction-Specific Guidance

### United States

**Primary Regulators**:
- SEC (Securities regulation)
- CFTC (Commodity futures)
- FinCEN (AML/KYC)
- OCC (Banking oversight)
- State regulators (money transmission)

**Key Frameworks**:
- Howey Test (SEC securities definition)
- Commodity Futures Modernization Act
- Bank Secrecy Act (AML)
- State Money Transmitter Laws

### European Union

**Primary Framework**: MiCA (Markets in Crypto-Assets Regulation)

**Key Requirements**:
- Wallet provider regulation
- Stablecoin issuer requirements
- Environmental sustainability disclosures
- Operational resilience (ICT)
- AML/CFT compliance

### Asia-Pacific

**Varies by Jurisdiction**:
- Singapore: MAS regulatory framework
- Hong Kong: SFC stablecoin guidance
- Japan: Payment Services Act
- Australia: CFTL amendments

---

**Document Status**: Ready for Implementation
**Last Updated**: Sprint 19 Legal Infrastructure
**Version**: 1.0.0 (Final)

