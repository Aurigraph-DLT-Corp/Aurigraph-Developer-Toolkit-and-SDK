# Aurigraph DLT Access Control Matrix

> **Version**: 1.0.0 | **Last Updated**: November 28, 2025
> **Purpose**: Define access permissions for repositories, environments, and secrets

---

## Role Definitions

| Role | Description | Team |
|------|-------------|------|
| **Admin** | Full access to all resources | Project Lead |
| **Core Developer** | Write access to backend code | @core-team |
| **Frontend Developer** | Write access to portal code | @frontend-team |
| **DevOps Engineer** | Access to CI/CD and infrastructure | @devops-team |
| **Security Engineer** | Access to security-sensitive code | @security-team |
| **QA Engineer** | Access to test code and environments | @qa-team |
| **AI Agent** | Limited write access to assigned areas | Automated |
| **Read-Only** | View access only | External reviewers |

---

## Repository Access

### Branch Permissions

| Branch | Admin | Core Dev | Frontend Dev | DevOps | Security | QA | Agent |
|--------|-------|----------|--------------|--------|----------|-----|-------|
| `main` | Push | PR Only | PR Only | PR Only | PR Only | PR Only | No |
| `V12` | Push | Push | PR Only | Push | PR Only | PR Only | PR Only |
| `release/*` | Push | PR Only | PR Only | PR Only | PR Only | PR Only | No |
| `feature/*` | Push | Push | Push* | Push | Push | Push | Push** |
| `hotfix/*` | Push | Push | No | Push | Push | No | No |

*Frontend devs can only push to `feature/portal-*` branches
**Agents can only push to their assigned `feature/<agent-id>-*` branches

### Protected Branch Rules

| Branch | Required Reviews | Status Checks | Force Push | Delete |
|--------|-----------------|---------------|------------|--------|
| `main` | 2 | All CI must pass | No | No |
| `V12` | 1 | All CI must pass | No | No |
| `release/*` | 2 | All CI + Security | No | No |

---

## Environment Access

### Development Environment

| Resource | Admin | Core Dev | Frontend Dev | DevOps | Security | QA | Agent |
|----------|-------|----------|--------------|--------|----------|-----|-------|
| Local Dev Server | Full | Full | Full | Full | Full | Full | Full |
| Dev Database | Full | Read/Write | Read | Full | Read | Read/Write | Read |
| Dev Redis | Full | Read/Write | Read | Full | Read | Read/Write | Read |
| Dev Logs | Full | Full | Read | Full | Full | Full | Read |

### Staging Environment

| Resource | Admin | Core Dev | Frontend Dev | DevOps | Security | QA | Agent |
|----------|-------|----------|--------------|--------|----------|-----|-------|
| Staging Server | Full | Read/Deploy | Read/Deploy | Full | Read | Read/Deploy | No |
| Staging Database | Full | Read | Read | Full | Read | Read | No |
| Staging Logs | Full | Read | Read | Full | Full | Read | No |
| Deploy Trigger | Yes | Yes | Yes | Yes | No | Yes | No |

### Production Environment

| Resource | Admin | Core Dev | Frontend Dev | DevOps | Security | QA | Agent |
|----------|-------|----------|--------------|--------|----------|-----|-------|
| Production Server | Full | No | No | Read/Deploy* | Read | No | No |
| Production Database | Full | No | No | Read** | Read | No | No |
| Production Logs | Full | Read | No | Full | Full | Read | No |
| Deploy Trigger | Yes | No | No | Yes* | No | No | No |
| Rollback Trigger | Yes | No | No | Yes | No | No | No |

*Requires approval from Admin
**Read access for troubleshooting only, no direct queries

---

## GitHub Secrets Access

### Repository Secrets

| Secret | Admin | DevOps | Security | CI/CD Only |
|--------|-------|--------|----------|------------|
| `PROD_SSH_KEY` | View/Edit | View | No | Yes |
| `PROD_HOST` | View/Edit | View | No | Yes |
| `PROD_USER` | View/Edit | View | No | Yes |
| `STAGING_SSH_KEY` | View/Edit | View/Edit | No | Yes |
| `SLACK_WEBHOOK_URL` | View/Edit | View/Edit | No | Yes |
| `SECURITY_SLACK_WEBHOOK_URL` | View/Edit | No | View/Edit | Yes |
| `SONAR_TOKEN` | View/Edit | View/Edit | No | Yes |
| `SNYK_TOKEN` | View/Edit | View | View/Edit | Yes |
| `FOSSA_API_KEY` | View/Edit | View | View | Yes |
| `JIRA_API_TOKEN` | View/Edit | No | No | Yes |
| `DATABASE_PASSWORD_PROD` | View/Edit | No | No | Yes |

### Environment Secrets

| Environment | Secrets Owner | Approval Required |
|-------------|---------------|-------------------|
| `development` | DevOps | No |
| `staging` | DevOps | No |
| `production` | Admin + DevOps | Yes (Admin) |

---

## CI/CD Pipeline Access

### Workflow Permissions

| Workflow | Admin | Core Dev | Frontend Dev | DevOps | Security | QA |
|----------|-------|----------|--------------|--------|----------|-----|
| `ci.yml` | Trigger | Trigger | Trigger | Trigger | Trigger | Trigger |
| `deploy.yml` | Trigger | Trigger | Trigger* | Trigger | No | Trigger* |
| `deploy-production.yml` | Trigger | No | No | Trigger** | No | No |
| `security.yml` | Trigger | View | View | Trigger | Trigger | View |
| `multi-agent-ci.yml` | Trigger | Trigger | No | Trigger | No | Trigger |

*Staging only
**Requires approval

### Deployment Approvals

| Environment | Required Approvers | Minimum Approvals |
|-------------|-------------------|-------------------|
| Staging | Any team member | 0 (auto-deploy) |
| Production | Admin, DevOps Lead | 1 |
| Hotfix to Production | Admin | 1 |

---

## Database Access

### PostgreSQL Roles

| Role | Permissions | Assigned To |
|------|-------------|-------------|
| `aurigraph_admin` | SUPERUSER | Admin only |
| `aurigraph_app` | SELECT, INSERT, UPDATE, DELETE on all tables | Application |
| `aurigraph_readonly` | SELECT on all tables | QA, Monitoring |
| `aurigraph_migration` | DDL + DML | CI/CD only |

### Database Access by Environment

| Environment | Admin | Core Dev | DevOps | QA | Application |
|-------------|-------|----------|--------|-----|-------------|
| Dev | `aurigraph_admin` | `aurigraph_app` | `aurigraph_admin` | `aurigraph_readonly` | `aurigraph_app` |
| Staging | `aurigraph_admin` | `aurigraph_readonly` | `aurigraph_admin` | `aurigraph_readonly` | `aurigraph_app` |
| Production | `aurigraph_admin` | No access | `aurigraph_readonly` | No access | `aurigraph_app` |

---

## External Service Access

### Third-Party Services

| Service | Admin | DevOps | Security | Developer |
|---------|-------|--------|----------|-----------|
| **JIRA** | Admin | Project Admin | View | Contributor |
| **GitHub** | Owner | Admin | Write | Write |
| **Slack** | Workspace Owner | Admin | Member | Member |
| **PagerDuty** | Admin | Admin | Responder | Viewer |
| **Grafana** | Admin | Editor | Viewer | Viewer |
| **Prometheus** | Admin | Admin | Viewer | Viewer |
| **SonarQube** | Admin | Admin | Viewer | Viewer |
| **Snyk** | Admin | Admin | Admin | Viewer |

### IAM (Keycloak) Roles

| Realm | Admin | DevOps | Developer | Application |
|-------|-------|--------|-----------|-------------|
| `AWD` | realm-admin | manage-users | view-users | Client credentials |
| `AurCarbonTrace` | realm-admin | manage-users | No access | Client credentials |
| `AurHydroPulse` | realm-admin | manage-users | No access | Client credentials |

---

## Agent-Specific Permissions

### AI Agent Access Matrix

| Agent | Repository Areas | Branch Pattern | Secrets | Deploy |
|-------|-----------------|----------------|---------|--------|
| `agent-1.1` | `/api/`, `/grpc/` | `feature/1.1-*` | None | No |
| `agent-1.2` | `/consensus/` | `feature/1.2-*` | None | No |
| `agent-1.3` | `/contracts/` | `feature/1.3-*` | None | No |
| `agent-1.4` | `/crypto/` | `feature/1.4-*` | None | No |
| `agent-1.5` | `/storage/` | `feature/1.5-*` | None | No |
| `agent-2.1` | `/traceability/` | `feature/2.1-*` | None | No |
| `agent-2.2` | `/token/` | `feature/2.2-*` | None | No |
| `agent-2.3` | `/composite/` | `feature/2.3-*` | None | No |
| `agent-2.4` | `/contracts/` | `feature/2.4-*` | None | No |
| `agent-2.5` | `/rwa/`, `/registry/` | `feature/2.5-*` | None | No |
| `agent-2.6` | `/enterprise-portal/` | `feature/2.6-*` | None | No |
| `agent-db` | `/db/migration/`, `/repositories/` | `feature/db-*` | None | No |
| `agent-frontend` | `/enterprise-portal/` | `feature/portal-*` | None | No |
| `agent-tests` | `/src/test/` | `feature/test-*` | None | No |
| `agent-ws` | `/websocket/`, `/channels/` | `feature/ws-*` | None | No |

---

## Audit Requirements

### Access Review Schedule

| Resource Type | Review Frequency | Reviewer |
|---------------|------------------|----------|
| Repository access | Monthly | Admin |
| Environment access | Monthly | DevOps Lead |
| Secrets access | Quarterly | Security Lead |
| Database access | Quarterly | Admin + Security |
| Third-party services | Quarterly | Admin |

### Logging Requirements

| Action | Log Location | Retention |
|--------|--------------|-----------|
| Repository access | GitHub Audit Log | 90 days |
| Secret access | GitHub Audit Log | 90 days |
| Production SSH | Server auth.log | 1 year |
| Database queries | PostgreSQL logs | 30 days |
| CI/CD runs | GitHub Actions logs | 90 days |

---

## Access Request Process

### Requesting New Access

1. Create issue using template: `.github/ISSUE_TEMPLATE/access-request.md`
2. Specify: Resource, Access Level, Justification, Duration
3. Get approval from resource owner (see matrix above)
4. DevOps implements access
5. Access logged in this document

### Emergency Access

1. Contact on-call via PagerDuty
2. On-call grants temporary access (max 24 hours)
3. Create access request issue within 24 hours
4. Temporary access auto-expires

### Revoking Access

1. Update this document
2. Remove from GitHub team/permissions
3. Rotate any shared credentials
4. Update third-party service access
5. Log revocation reason

---

## Compliance Notes

- All production access must follow least-privilege principle
- No shared accounts in production
- All access changes must be documented
- Quarterly access reviews are mandatory
- Security team must approve any access to crypto/security code

---

*Last Updated: November 28, 2025*
*Next Review: December 28, 2025*
