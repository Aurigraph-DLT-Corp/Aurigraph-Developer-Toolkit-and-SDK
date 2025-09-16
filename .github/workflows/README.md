# Aurigraph V11 GitHub Actions JIRA Integration Workflows

This directory contains comprehensive GitHub Actions workflows for automated JIRA integration and sprint tracking for the Aurigraph V11 project.

## Workflow Overview

### 🚀 Core Workflows

1. **[jira-sprint-tracker.yml](./jira-sprint-tracker.yml)** - Main sprint tracking and progress monitoring
2. **[jira-ticket-sync.yml](./jira-ticket-sync.yml)** - Automated ticket creation and status synchronization
3. **[jira-sprint-reports.yml](./jira-sprint-reports.yml)** - Comprehensive sprint reporting and burndown analysis
4. **[jira-agent-metrics.yml](./jira-agent-metrics.yml)** - Agent utilization tracking and performance metrics
5. **[jira-epic-management.yml](./jira-epic-management.yml)** - Epic and story management with roadmap visualization

## Workflow Triggers

### Automatic Triggers
- **Push to main/feature branches** - Triggers ticket sync and progress updates
- **Pull Request events** - Updates ticket status and adds PR links
- **Scheduled runs** - Daily/weekly reports and regular sync operations

### Manual Triggers
- **Workflow Dispatch** - Manual execution with customizable parameters
- **Issue events** - GitHub issue creation triggers JIRA ticket creation

## Sprint Tracking System

### Complete Sprint Coverage (6 Sprints)

#### ✅ **Sprint 1: Core Model Classes** (Completed)
- Foundation model classes and core architecture
- **Tickets:** AV11-1 through AV11-5
- **Status:** 100% Complete
- **Timeline:** Jan 1-14, 2025

#### ✅ **Sprint 2: Contract & Bridge Services** (Completed)
- Smart contracts and cross-chain bridge implementation
- **Tickets:** AV11-6 through AV11-10
- **Status:** 100% Complete
- **Timeline:** Jan 15-28, 2025

#### ✅ **Sprint 3: API Resources & Integration** (Completed)
- REST APIs and service integration
- **Tickets:** AV11-11 through AV11-15
- **Status:** 100% Complete
- **Timeline:** Jan 29 - Feb 11, 2025

#### ✅ **Sprint 4: Testing & Security** (Completed)
- Comprehensive testing and security implementation
- **Tickets:** AV11-16 through AV11-20
- **Status:** 100% Complete
- **Timeline:** Feb 12-25, 2025

#### 🔄 **Sprint 5: Performance & Deployment** (In Progress)
- Performance optimization and production deployment
- **Tickets:** AV11-21 through AV11-25
- **Status:** ~85% Complete
- **Timeline:** Feb 26 - Mar 11, 2025

#### ⏳ **Sprint 6: Ricardian Smart Contract Framework** (Pending)
- Advanced Ricardian contract framework implementation
- **Tickets:** AV11-26 through AV11-30
- **Status:** 0% Complete
- **Timeline:** Mar 12-25, 2025

## Agent Team Integration

### 10-Agent Development Team
The workflows track and manage the complete Aurigraph development team:

| Agent | Role | Primary Focus |
|-------|------|---------------|
| **CAA** | Chief Architect Agent | System architecture and strategic decisions |
| **BDA** | Backend Development Agent | Core blockchain platform development |
| **FDA** | Frontend Development Agent | User interfaces and dashboards |
| **SCA** | Security & Cryptography Agent | Security implementation and auditing |
| **ADA** | AI/ML Development Agent | AI-driven optimization and analytics |
| **IBA** | Integration & Bridge Agent | Cross-chain and external integrations |
| **QAA** | Quality Assurance Agent | Testing and quality control |
| **DDA** | DevOps & Deployment Agent | CI/CD and infrastructure management |
| **DOA** | Documentation Agent | Technical documentation and knowledge management |
| **PMA** | Project Management Agent | Sprint planning and task coordination |

## Configuration Requirements

### Required GitHub Secrets

```yaml
secrets:
  JIRA_API_TOKEN: "Your JIRA API token"
  GITHUB_TOKEN: "Automatically provided by GitHub Actions"
```

### JIRA Configuration
- **JIRA Base URL:** `https://aurigraphdlt.atlassian.net`
- **Project Key:** `AV11`
- **Email:** `subbu@aurigraphdlt.com`

## Workflow Features

### 1. Sprint Tracker (jira-sprint-tracker.yml)
- **Frequency:** Every 4 hours during work days + on code changes
- **Features:**
  - Real-time sprint progress calculation
  - Agent utilization matrix
  - Burndown chart generation
  - Performance metrics tracking
  - Automated PR comments with sprint status

### 2. Ticket Sync (jira-ticket-sync.yml)
- **Frequency:** On every push, PR, and issue event
- **Features:**
  - Auto-creation of missing tickets (AV11-1 through AV11-30)
  - Status synchronization based on Git activity
  - Agent assignment based on commit content
  - GitHub-JIRA linking with web links
  - Automated comments with GitHub activity

### 3. Sprint Reports (jira-sprint-reports.yml)
- **Frequency:** Daily at 9 AM UTC, Weekly on Fridays at 5 PM UTC
- **Features:**
  - Daily progress reports
  - Weekly comprehensive reviews
  - Monthly trend analysis
  - Sprint completion reports
  - All-sprints overview
  - Burndown charts and velocity metrics
  - GitHub release creation for weekly reports

### 4. Agent Metrics (jira-agent-metrics.yml)
- **Frequency:** Every 6 hours + daily comprehensive reports
- **Features:**
  - Individual agent performance tracking
  - Git activity correlation
  - Utilization score calculation
  - Quality and efficiency metrics
  - Collaboration analysis
  - Interactive HTML dashboard
  - Performance recommendations

### 5. Epic Management (jira-epic-management.yml)
- **Frequency:** On epic/story branch changes + manual triggers
- **Features:**
  - 10 comprehensive epics management
  - Story-to-epic auto-linking
  - Epic progress tracking
  - Visual roadmap generation
  - Dependency analysis
  - Interactive epic dashboard
  - Repository structure analysis

## Output Artifacts

### Generated Reports
- **Sprint Progress Reports** - Markdown format with comprehensive metrics
- **Agent Performance Reports** - JSON data + HTML dashboards
- **Epic Management Reports** - Progress tracking and roadmaps
- **Burndown Charts** - Text-based and visual representations
- **Velocity Metrics** - Team and individual velocity analysis

### Interactive Dashboards
- **Agent Metrics Dashboard** - Real-time agent performance visualization
- **Epic Dashboard** - Epic progress and roadmap visualization
- **Sprint Progress Dashboard** - Sprint status and burndown charts

### Archive Retention
- **Sprint Reports:** 90 days
- **Agent Metrics:** 60 days
- **Epic Management:** 90 days
- **Ticket Sync:** 30 days

## Usage Examples

### Manual Workflow Execution

#### Generate Comprehensive Sprint Report
```bash
# Via GitHub UI: Actions → JIRA Sprint Reports → Run workflow
# Parameters:
#   - report_type: weekly
#   - target_sprint: 5
#   - include_burndown: true
#   - include_velocity: true
```

#### Update Agent Metrics
```bash
# Via GitHub UI: Actions → JIRA Agent Metrics → Run workflow
# Parameters:
#   - metric_type: utilization
#   - time_period: week
#   - agent_filter: all
```

#### Manage Epic Structure
```bash
# Via GitHub UI: Actions → JIRA Epic Management → Run workflow
# Parameters:
#   - management_action: sync_all
#   - epic_scope: all
#   - auto_link: true
```

### Automatic Triggers

#### On Code Push
```bash
git push origin main
# Automatically triggers:
# - Sprint progress update
# - Ticket status sync
# - Agent activity tracking
```

#### On Pull Request
```bash
# PR creation/merge automatically:
# - Updates related tickets
# - Adds PR links to JIRA
# - Updates agent metrics
# - Comments sprint progress on PR
```

## Integration Points

### JIRA Integration
- **Ticket Management:** Full CRUD operations on AV11 project tickets
- **Sprint Tracking:** Active and closed sprint monitoring
- **Agent Assignment:** Label-based and content-based assignment
- **Progress Tracking:** Real-time completion percentage calculation

### GitHub Integration
- **Repository Analysis:** File change tracking and feature detection
- **Commit Analysis:** Agent mention extraction and activity correlation
- **PR Integration:** Automatic linking and status updates
- **Issue Integration:** GitHub issue to JIRA ticket creation

### External Systems
- **Performance Metrics:** TPS tracking and optimization monitoring
- **Quality Metrics:** Test coverage and quality score calculation
- **Infrastructure Metrics:** Deployment and monitoring integration

## Monitoring and Alerting

### Success Monitoring
- All workflows include comprehensive logging
- Success/failure notifications via GitHub Actions
- Artifact generation for audit trails

### Error Handling
- Graceful degradation on JIRA API failures
- Retry mechanisms for transient failures
- Detailed error logging and reporting

### Performance Monitoring
- Workflow execution time tracking
- API call optimization
- Rate limiting compliance

## Customization

### Adding New Agents
1. Update agent definitions in all workflows
2. Add agent keywords for auto-assignment
3. Update dashboard visualizations
4. Add agent-specific metrics

### Adding New Sprints
1. Update sprint definitions in tracking workflows
2. Add new ticket ranges (AV11-31+)
3. Update epic management scope
4. Adjust timeline calculations

### Custom Reports
1. Modify report generation scripts
2. Add custom JIRA queries
3. Update dashboard components
4. Add new artifact outputs

## Troubleshooting

### Common Issues

#### JIRA API Authentication
```bash
# Check JIRA_API_TOKEN secret is set
# Verify token permissions in JIRA
# Test with curl:
curl -u email:token https://aurigraphdlt.atlassian.net/rest/api/3/myself
```

#### Missing Tickets
```bash
# Run ticket sync workflow manually
# Check ticket creation logs
# Verify project permissions
```

#### Performance Issues
```bash
# Monitor workflow execution times
# Check API rate limits
# Review query optimization
```

## Best Practices

### Workflow Management
1. **Regular Monitoring:** Check workflow runs daily
2. **Artifact Review:** Download and review reports weekly
3. **Error Investigation:** Address failures promptly
4. **Performance Optimization:** Monitor execution times

### JIRA Management
1. **Consistent Labeling:** Use standardized agent labels
2. **Ticket Hygiene:** Regular cleanup of auto-created tickets
3. **Sprint Planning:** Align JIRA sprints with workflow expectations
4. **Permission Management:** Ensure adequate API permissions

### Repository Management
1. **Commit Messages:** Include agent mentions for accurate tracking
2. **Branch Naming:** Use consistent naming for automatic categorization
3. **PR Descriptions:** Include relevant ticket references
4. **Issue Management:** Use GitHub issues for automatic JIRA creation

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly:** Review generated reports and dashboards
- **Monthly:** Update agent assignments and epic progress
- **Quarterly:** Review and optimize workflow performance
- **As Needed:** Add new features and integrations

### Version Updates
- Monitor GitHub Actions marketplace for updated actions
- Test workflow changes in development branches
- Update JIRA API calls for new API versions
- Maintain compatibility with repository structure changes

---

**Generated:** $(date)
**Version:** 1.0.0
**Last Updated:** September 15, 2025

*This documentation covers the complete JIRA integration system for Aurigraph V11. For specific workflow details, refer to individual workflow files.*