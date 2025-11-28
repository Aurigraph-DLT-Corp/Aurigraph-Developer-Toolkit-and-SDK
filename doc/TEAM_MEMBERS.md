# Aurigraph DLT Team Registry

> **Version**: 1.0.0 | **Last Updated**: November 28, 2025
> **Purpose**: Central registry of all team members, agents, and their responsibilities

---

## Quick Reference

| Role | Contact | Slack |
|------|---------|-------|
| **Project Lead** | @subbu | #aurigraph-leadership |
| **On-Call** | PagerDuty | #aurigraph-oncall |
| **DevOps** | @devops-team | #aurigraph-devops |
| **Security** | security@aurigraph.io | #aurigraph-security |

---

## Development Teams

### Core Team (@Aurigraph-DLT-Corp/core-team)

| Name | GitHub | Email | Role | Primary Projects |
|------|--------|-------|------|------------------|
| Subbu Jois | @subbu | sjoish12@gmail.com | Project Lead / Chief Architect | All V12 development |
| *Add team member* | @github-handle | email@domain.com | Role | Projects |

### Frontend Team (@Aurigraph-DLT-Corp/frontend-team)

| Name | GitHub | Email | Role | Primary Projects |
|------|--------|-------|------|------------------|
| *Add team member* | @github-handle | email@domain.com | Frontend Lead | Enterprise Portal |

### DevOps Team (@Aurigraph-DLT-Corp/devops-team)

| Name | GitHub | Email | Role | Primary Projects |
|------|--------|-------|------|------------------|
| *Add team member* | @github-handle | email@domain.com | DevOps Lead | CI/CD, Infrastructure |

### Security Team (@Aurigraph-DLT-Corp/security-team)

| Name | GitHub | Email | Role | Primary Projects |
|------|--------|-------|------|------------------|
| *Add team member* | @github-handle | email@domain.com | Security Lead | Quantum Crypto, Audits |

### QA Team (@Aurigraph-DLT-Corp/qa-team)

| Name | GitHub | Email | Role | Primary Projects |
|------|--------|-------|------|------------------|
| *Add team member* | @github-handle | email@domain.com | QA Lead | Testing, Coverage |

---

## AI Agents (Multi-Agent Framework)

### Backend Agents (Series 1.x)

| Agent ID | Role | Primary Focus | Branch | Status |
|----------|------|---------------|--------|--------|
| **agent-1.1** | REST/gRPC Bridge | API layer, endpoint migration | `feature/1.1-rest-grpc-bridge` | Active |
| **agent-1.2** | Consensus gRPC | HyperRAFT++ consensus | `feature/1.2-consensus-grpc` | Active |
| **agent-1.3** | Contracts gRPC | Smart contract services | `feature/1.3-contract-grpc` | Active |
| **agent-1.4** | Crypto gRPC | Quantum cryptography | `feature/1.4-crypto-grpc` | Active |
| **agent-1.5** | Storage gRPC | LevelDB state storage | `feature/1.5-storage-grpc` | Active |

### RWA Agents (Series 2.x)

| Agent ID | Role | Primary Focus | Branch | Status |
|----------|------|---------------|--------|--------|
| **agent-2.1** | Traceability | Supply chain tracking | `feature/2.1-traceability-grpc` | Active |
| **agent-2.2** | Secondary Token | Token minting/burning | `feature/2.2-secondary-token` | Active |
| **agent-2.3** | Composite Creation | Asset composition | `feature/2.3-composite-creation` | Active |
| **agent-2.4** | Contract Binding | Contract management | `feature/2.4-contract-binding` | Active |
| **agent-2.5** | Merkle Registry | State proofs, RWA | `feature/2.5-merkle-registry` | Active |
| **agent-2.6** | Portal Integration | Frontend integration | `feature/2.6-portal-integration` | Active |

### Infrastructure Agents

| Agent ID | Role | Primary Focus | Branch | Status |
|----------|------|---------------|--------|--------|
| **agent-db** | Database | PostgreSQL, migrations | `feature/database-optimization` | Active |
| **agent-frontend** | Portal UI | React components | `feature/portal-enhancements` | Active |
| **agent-tests** | QA | Test coverage expansion | `feature/test-coverage-expansion` | Active |
| **agent-ws** | WebSocket | Real-time services | `feature/websocket-services` | Active |

### Orchestrator Agents

| Agent ID | Role | Primary Focus | Configuration |
|----------|------|---------------|---------------|
| **CAA** | Chief Architect Agent | Architecture oversight | `.env.agent-framework` |
| **BDA** | Backend Dev Agent | Java backend services | `.env.agent-framework` |
| **FDA** | Frontend Dev Agent | React portal | `.env.agent-framework` |
| **SCA** | Security & Crypto Agent | Quantum crypto, audits | `.env.agent-framework` |
| **ADA** | AI/ML Optimization Agent | ML optimization | `.env.agent-framework` |
| **IBA** | Integration & Bridge Agent | Cross-chain bridge | `.env.agent-framework` |
| **QAA** | Quality Assurance Agent | Testing | `.env.agent-framework` |
| **DDA** | DevOps & Deployment Agent | CI/CD | `.env.agent-framework` |
| **DOA** | Documentation Agent | Technical docs | `.env.agent-framework` |
| **PMA** | Project Manager Agent | JIRA, sprint tracking | `.env.agent-framework` |

---

## Projects Registry

### Active Projects

| Project | Code | Lead | Team | Status | Repository Path |
|---------|------|------|------|--------|-----------------|
| **Aurigraph V12** | AV12 | @subbu | Core Team | Active | `/aurigraph-av10-7/aurigraph-v11-standalone` |
| **Enterprise Portal** | EP | @frontend-lead | Frontend Team | Active | `/enterprise-portal` |
| **Cross-Chain Bridge** | CCB | @bridge-lead | Core Team | Active | `/aurigraph-av10-7/aurigraph-v11/crosschain-bridge` |
| **RWA Registry** | RWA | @rwa-lead | Core Team | Active | gRPC services in V12 |
| **Quantum Crypto** | QC | @security-lead | Security Team | Active | `/crypto` package |

### Project JIRA Mapping

| Project | JIRA Project | Board URL |
|---------|--------------|-----------|
| V12 Core | AV11 | https://aurigraphdlt.atlassian.net/jira/software/projects/AV11 |
| Portal | EP | *To be created* |
| Bridge | CCB | *To be created* |

---

## Communication Channels

### Slack Channels

| Channel | Purpose | Members |
|---------|---------|---------|
| `#aurigraph-general` | General discussion | All team |
| `#aurigraph-dev` | Development discussion | Developers |
| `#aurigraph-agents` | Agent coordination | AI Agents |
| `#aurigraph-devops` | DevOps & infrastructure | DevOps team |
| `#aurigraph-security` | Security discussions | Security team |
| `#aurigraph-oncall` | On-call coordination | On-call rotation |
| `#aurigraph-alerts` | Automated alerts | All team |
| `#aurigraph-help` | Help & questions | All team |

### Meeting Schedule

| Meeting | Frequency | Time (UTC) | Attendees |
|---------|-----------|------------|-----------|
| Daily Standup | Daily | 09:00 | All team |
| Sprint Planning | Bi-weekly | Monday 10:00 | All team |
| Sprint Review | Bi-weekly | Friday 15:00 | All team |
| Architecture Review | Weekly | Wednesday 14:00 | Core Team |
| Security Review | Weekly | Thursday 14:00 | Security Team |

---

## On-Call Rotation

### Current Week

| Day | Primary | Secondary |
|-----|---------|-----------|
| Monday | *Name* | *Name* |
| Tuesday | *Name* | *Name* |
| Wednesday | *Name* | *Name* |
| Thursday | *Name* | *Name* |
| Friday | *Name* | *Name* |
| Weekend | *Name* | *Name* |

### Escalation Path

```
Level 1: On-Call Engineer (15 min response)
    ↓
Level 2: Team Lead (30 min response)
    ↓
Level 3: Project Lead (@subbu) (1 hour response)
    ↓
Level 4: Executive (as needed)
```

---

## Adding New Team Members

### Checklist for New Members

1. [ ] Add to this file (`TEAM_MEMBERS.md`)
2. [ ] Add to GitHub team (@Aurigraph-DLT-Corp/*)
3. [ ] Add to Slack channels
4. [ ] Add to JIRA project
5. [ ] Setup credentials (`doc/Credentials.md`)
6. [ ] Run onboarding script (`scripts/onboard-developer.sh`)
7. [ ] Complete environment validation
8. [ ] Assign to agent/worktree (if applicable)
9. [ ] Add to on-call rotation (if applicable)

### Template for New Member Entry

```markdown
| Name | @github-handle | email@domain.com | Role Title | Project Names |
```

---

## External Contacts

### Vendors & Partners

| Organization | Contact | Email | Purpose |
|--------------|---------|-------|---------|
| *Vendor Name* | *Contact Name* | email@vendor.com | *Purpose* |

### Consultants

| Name | Company | Email | Expertise |
|------|---------|-------|-----------|
| *Consultant Name* | *Company* | email@company.com | *Area of expertise* |

---

*To update this registry, submit a PR with changes or contact the Project Lead.*

*Last Updated: November 28, 2025*
