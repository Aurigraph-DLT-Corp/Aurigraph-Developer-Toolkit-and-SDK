# Governance User Manual
## Aurigraph V11/V12 Platform Operations & DAO Governance

**Document Type**: Operational Governance Guide
**Timeline**: Q1 2025 (By March 31, 2025)
**Status**: Phase 3 - Strategic Initiative
**Version**: 1.0

---

## Executive Summary

This Governance User Manual provides comprehensive guidance for operating the Aurigraph platform's governance systems, including:
- Validator node operations and management
- DAO governance procedures and voting
- Smart contract upgrade procedures
- Incident response and emergency procedures
- Compliance and regulatory oversight

---

## Part 1: Platform Governance Structure

### 1.1 Multi-Tier Governance Model

```
┌─────────────────────────────────────────────┐
│  Token Holders (Governance Token Voting)    │
│  - Protocol Parameter Changes                │
│  - Major Upgrades (>30% impact)             │
│  - Treasury Management                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  DAO Treasury & Operations                   │
│  - Fund allocation for development           │
│  - Validator incentive management            │
│  - Grant program administration              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Core Team & Validators                      │
│  - Day-to-day operations                     │
│  - Network upgrades                          │
│  - Emergency incident response               │
└──────────────────────────────────────────────┘
```

### 1.2 Governance Token (AUR)

**Token Specification**:
- **Name**: Aurigraph Governance Token
- **Symbol**: AUR
- **Total Supply**: 1,000,000,000 (1B)
- **Decimal Places**: 18
- **Smart Contract**: Ethereum/Aurigraph V11

**Voting Rights**:
- 1 AUR = 1 vote
- Voting power snapshot: Block height -1 (prevent flash loan attacks)
- Quorum requirement: 40% of total supply
- Approval threshold: 60% affirmative votes

**Token Holder Responsibilities**:
- Vote on major governance decisions
- Stake tokens for validator participation
- Participate in DAO discussions
- Review and approve smart contract upgrades

---

## Part 2: Validator Node Operations

### 2.1 Validator Requirements

**Hardware Requirements**:
- CPU: 8-core modern processor (Intel/AMD)
- RAM: 32GB minimum
- Storage: 500GB+ SSD (NVMe recommended)
- Network: 100+ Mbps connection
- Uptime: 99.9% availability target

**Software Requirements**:
- Java 21 JDK
- Quarkus 3.26.2 runtime
- Docker for containerization
- Ubuntu 22.04 LTS or newer

**Operational Requirements**:
- KYC/AML verification (Know Your Customer)
- Regulatory compliance in operating jurisdiction
- $10K minimum stake (locked for 6 months)
- 24/7 operational monitoring capability

### 2.2 Validator Setup Procedures

**Step 1: Environment Preparation**
```bash
# Install Java 21
sudo apt-get update
sudo apt-get install openjdk-21-jdk

# Install Docker
sudo apt-get install docker.io

# Create validator user
sudo useradd -m validator
sudo usermod -aG docker validator
```

**Step 2: Node Installation**
```bash
# Download and verify Aurigraph binary
wget https://releases.aurigraph.io/v11/aurigraph-v11-runner
sha256sum -c aurigraph-v11-runner.sha256

# Set permissions and move to path
chmod +x aurigraph-v11-runner
sudo mv aurigraph-v11-runner /usr/local/bin/
```

**Step 3: Configuration**
- Configure node identity (public key/address)
- Set validator stake amount (minimum $10K)
- Configure peer discovery nodes
- Set up monitoring and alerting

**Step 4: Network Integration**
- Request validator admission from governance
- Sync blockchain state (2-7 days)
- Verify consensus participation
- Monitor block production

### 2.3 Validator Responsibilities

**Core Responsibilities**:
- [ ] Propose and validate blocks on schedule
- [ ] Maintain 99.9% uptime
- [ ] Keep node software updated
- [ ] Participate in governance voting
- [ ] Monitor system health and alerts
- [ ] Respond to security incidents

**Stake Management**:
- Initial stake: $10K minimum (locked 6 months)
- Lockup period: 6 months from deposit
- Slashing for misconduct: Up to 100% of stake
- Rewards: 5% annualized from transaction fees
- Claim rewards: Monthly (automated)

**Governance Participation**:
- Vote on protocol upgrades (if holding AUR tokens)
- Proposal submission: Requires 1K AUR minimum
- Voting period: 7 days typical
- Execution: Upon approval (60%+ affirmative)

---

## Part 3: DAO Governance Procedures

### 3.1 Proposal Submission

**Proposal Types**:

**Type 1: Parameter Changes** (Low-risk)
- Parameters: Block time, gas limits, fee schedules
- Voting period: 3 days
- Approval threshold: 50% + 1
- Execution: Immediate upon approval

**Type 2: Standard Upgrades** (Medium-risk)
- Smart contract modifications
- Protocol bug fixes
- Non-critical feature additions
- Voting period: 7 days
- Approval threshold: 60%
- Execution: 2-day timelock

**Type 3: Major Upgrades** (High-risk)
- Consensus algorithm changes
- Economic model changes
- Bridge security upgrades
- Voting period: 14 days
- Approval threshold: 75%
- Execution: 7-day timelock

**Proposal Requirements**:
- Proposer stake: 1,000 AUR
- Proposal fee: 100 AUR (burned)
- Detailed technical specification
- Risk assessment document
- Implementation code review

### 3.2 Governance Voting Procedure

**Voting Process**:

**Phase 1: Discussion Period (7 days)**
- Proposal posted to governance forum
- Community discussion and feedback
- Core team technical review
- Proposed modifications documented

**Phase 2: Voting Period (3-14 days depending on type)**
- On-chain voting opens
- Token holders vote (delegated voting allowed)
- Vote snapshot: Block -1 (anti-manipulation)
- Early execution: If 75%+ reached before end

**Phase 3: Timelock (0-7 days depending on type)**
- Approved proposal in timelock
- Community can review final implementation
- Emergency pause available for critical issues
- Automatic execution at timelock expiry

**Phase 4: Execution**
- Smart contract upgrade deployed
- Parameters updated on-chain
- Network upgrade coordinated (if needed)
- Success verified and announced

### 3.3 Voting Rights & Delegation

**Voting Power Calculation**:
```
Voting Power = AUR Balance at Snapshot Block

Delegation:
delegated_to = 0x1234... (Ethereum address)
voting_power_lost = AUR balance
voting_power_gained_by_delegate += AUR balance
```

**Self-Delegation**:
- Default: No delegation (holder votes directly)
- Must explicitly delegate to participate
- Revoke delegation to regain voting power

**Proxy Voting**:
- Holders can delegate to trusted address
- Delegate votes on holder's behalf
- Holder can revoke delegation anytime
- No reward/penalty for delegates

---

## Part 4: Smart Contract Upgrades

### 4.1 Upgrade Process

**Step 1: Development & Testing**
- [ ] Feature/bug fix developed in branch
- [ ] Unit tests written (>95% coverage)
- [ ] Integration tests created
- [ ] Code review by 2+ team members
- [ ] Formal verification (high-risk contracts)

**Step 2: Staging Environment**
- [ ] Deploy to staging testnet
- [ ] Run full test suite
- [ ] Monitor for 1+ week
- [ ] Gather feedback from developers
- [ ] Document any issues found

**Step 3: Governance Submission**
- [ ] Create governance proposal
- [ ] Submit technical specification
- [ ] Provide risk assessment
- [ ] Include implementation code
- [ ] Publish for community review

**Step 4: Community Review**
- [ ] Technical discussion (7 days)
- [ ] Formal voting (3-14 days)
- [ ] Security review comments
- [ ] Final modifications

**Step 5: Execution**
- [ ] Timelock period (0-7 days)
- [ ] Final security verification
- [ ] Deploy to mainnet
- [ ] Verify contract functionality
- [ ] Announce upgrade completion

### 4.2 Emergency Upgrades

**Emergency Criteria**:
- Active exploit threatening funds
- Critical consensus failure
- Security vulnerability requiring immediate patch
- Network-threatening bug

**Emergency Procedures**:
- [ ] Activate emergency pause (Multisig only)
- [ ] Propose emergency upgrade
- [ ] Reduced voting period (1 day)
- [ ] Reduced quorum requirement (25%)
- [ ] Timelock waived (for critical fixes)
- [ ] Post-upgrade formal review

**Post-Emergency Actions**:
- [ ] Full incident investigation
- [ ] Root cause analysis
- [ ] Governance discussion on improvements
- [ ] Regular voting to confirm emergency actions

---

## Part 5: Incident Response & Emergency Procedures

### 5.1 Severity Classifications

**Severity Level 1: CRITICAL**
- Active exploit causing fund loss
- Consensus failure (network halted)
- Bridge failure with locked funds
- Requires: Immediate emergency pause + emergency upgrade

**Severity Level 2: HIGH**
- High-risk vulnerability (no active exploit)
- Major performance degradation (>50% throughput loss)
- Data integrity issue affecting transactions
- Requires: Emergency upgrade (1-day vote)

**Severity Level 3: MEDIUM**
- Medium-risk vulnerability
- Network performance impact (<50% degradation)
- Single validator failure
- Requires: Expedited standard upgrade (3-day vote)

**Severity Level 4: LOW**
- Low-risk bug requiring correction
- Minor performance issue
- Documentation updates
- Requires: Standard upgrade process (7-day vote)

### 5.2 Emergency Pause Procedure

**Emergency Pause Trigger**:
- Multisig requirement: 5-of-9 core team members
- Authorization: CTO + CFO + 3 validators
- Duration: Maximum 48 hours
- Override: 90% governance vote can override pause

**Activation Steps**:
```
1. Verify incident severity (CRITICAL classification)
2. Gather 5+ authorized signatories
3. Call pauseNetwork() on governance contract
4. Broadcast pause announcement
5. Monitor pause effects
6. Prepare emergency upgrade
7. Submit for voting
8. Execute upgrade after approval
9. Resume network operations
```

**Post-Pause Actions**:
- [ ] Root cause analysis (24 hours)
- [ ] Fix implementation (24-48 hours)
- [ ] Governance proposal submission (48 hours)
- [ ] Expedited voting (1 day)
- [ ] Upgrade execution
- [ ] Formal incident report within 7 days

---

## Part 6: Validator Disputes & Slashing

### 6.1 Slashing Conditions

**Slashing: 10% of Stake**
- Signing conflicting blocks
- Missing block production (>2 consecutive slots)
- Invalid consensus participation

**Slashing: 50% of Stake**
- Double voting in proposal
- Attempting consensus takeover (Byzantine fault)
- Security breach of validator key

**Slashing: 100% of Stake**
- Malicious block production (intentional)
- Stealing validator rewards
- Collusion with other validators for attacks

### 6.2 Dispute Resolution

**Process**:
1. **Evidence Submission** (48 hours window)
   - Accuser submits evidence on-chain
   - Includes transaction hashes and signatures
   - Pays dispute fee (100 AUR)

2. **Evidence Verification** (3 days)
   - Validators vote on evidence validity
   - Consensus required (75%)
   - If invalid, fee returned to accuser

3. **Slashing Execution** (7 days)
   - Valid evidence → Slash stake
   - Slashed funds → Community Treasury
   - Validator can appeal

4. **Appeal Process** (14 days)
   - Governance vote on appeal
   - Requires 75% for reversal
   - Successful appeal → Reinstate stake
   - Failed appeal → Slashing confirmed

---

## Part 7: Compliance & Oversight

### 7.1 Regulatory Compliance

**AML/KYC Requirements**:
- [ ] Validators must provide identity verification
- [ ] Beneficial ownership disclosure
- [ ] Source of funds verification
- [ ] Screening against sanctions lists

**Reporting Obligations**:
- [ ] Annual compliance certification
- [ ] Regulatory filings per jurisdiction
- [ ] Treasury audit and publication
- [ ] Governance statistics reporting

### 7.2 Governance Monitoring

**Dashboard & Metrics**:
- Voting participation rate (target: >50%)
- Quorum achievement (target: 40%+)
- Proposal submission rate (monitoring)
- Slashing events (zero target)
- Emergency pauses (zero target)

**Regular Reviews**:
- Monthly: Validator participation and health
- Quarterly: Governance effectiveness review
- Annually: System audits and improvements
- Annually: Regulatory compliance verification

---

## Part 8: Communication & Transparency

### 8.1 Governance Communication

**Channels**:
- Forum: https://discourse.aurigraph.io/governance
- Discord: #governance channel
- Twitter: @AurigraphGov (announcements)
- Email: governance@aurigraph.io

**Announcement Timeline**:
- Proposal submission: Public announcement
- Voting start: 48-hour notice
- Voting end: Results announcement
- Execution: Pre-execution notice (24 hours)
- Completion: Post-execution report

### 8.2 Transparency Reports

**Monthly Reports Include**:
- Governance voting statistics
- Validator network health metrics
- Treasury fund movements
- Slashing events (if any)
- Emergency actions taken (if any)

**Annual Reports Include**:
- Comprehensive governance analysis
- Validator participation trends
- Proposal approval rates
- Treasury audit results
- Regulatory compliance status

---

## Appendix A: Governance Addresses

| Component | Address | Type |
|---|---|---|
| Governance Token (AUR) | 0xAUR... | ERC-20 |
| Governance Contract | 0xGov... | Proxy |
| Treasury Contract | 0xTreasury... | Multisig |
| Timelock | 0xLock... | TimelockController |

---

## Appendix B: Voting Guide

**How to Vote**:
1. Hold AUR tokens (self-delegated or via delegation)
2. Monitor governance forum for proposals
3. Vote on governance contract UI
4. Confirm transaction

**Vote Options**:
- [ ] For (approve)
- [ ] Against (reject)
- [ ] Abstain (no opinion)

**Vote Delegation**:
```solidity
// Delegate voting power to another address
aur.delegate(0xDelegate_Address);

// Revoke delegation
aur.delegate(0xYourOwnAddress);
```

---

**Document Status**: Ready for Implementation
**Phase**: 3 - Strategic Initiative
**Timeline**: Q1 2025
**Next Review**: Q2 2025

Generated with Claude Code
