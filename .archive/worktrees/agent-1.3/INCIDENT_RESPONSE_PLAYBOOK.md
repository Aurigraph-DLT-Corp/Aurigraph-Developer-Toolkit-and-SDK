# Incident Response Playbook
**Version:** 1.0.0
**Last Updated:** November 12, 2025
**Status:** Production Ready
**Maintainer:** Aurigraph Operations Team

---

## Table of Contents

1. [Overview](#overview)
2. [Incident Severity Levels](#incident-severity-levels)
3. [Escalation Procedures](#escalation-procedures)
4. [On-Call Procedures](#on-call-procedures)
5. [Communication Templates](#communication-templates)
6. [War Room Setup](#war-room-setup)
7. [Post-Mortem Template](#post-mortem-template)
8. [Incident Response Workflows](#incident-response-workflows)
9. [Runbook Quick Reference](#runbook-quick-reference)

---

## Overview

### Purpose
This playbook provides standardized procedures for responding to incidents affecting the Aurigraph DLT platform. It defines severity levels, escalation paths, communication protocols, and post-incident review processes.

### Scope
- All production systems (V11 Java/Quarkus architecture)
- Critical infrastructure (databases, caching, networking)
- Security incidents
- Performance degradations
- Service outages

### Key Principles
1. **Safety First** - Protect data integrity and user security above all
2. **Communicate Early** - Notify stakeholders as soon as incident is confirmed
3. **Document Everything** - Record all actions and decisions
4. **Learn and Improve** - Conduct post-mortems for all P0/P1 incidents
5. **Blameless Culture** - Focus on systems and processes, not individuals

---

## Incident Severity Levels

### P0 - Critical (Severity 1)
**Impact:** Complete service outage or critical security breach

**Examples:**
- Platform completely unavailable (all API endpoints down)
- Data breach or unauthorized access to production data
- Consensus failure preventing transaction finalization
- Critical security vulnerability being actively exploited
- Data corruption or loss
- Regulatory compliance violation

**Response Time:** Immediate (within 5 minutes)
**Resolution Target:** 1 hour
**Communication:** Immediate notification to all stakeholders
**On-Call:** Page primary and secondary on-call engineers immediately
**Status Page:** Update within 10 minutes

**Initial Actions:**
```bash
# 1. Acknowledge incident in PagerDuty
pagerduty ack --incident-id=<incident-id>

# 2. Create incident channel in Slack
slack create-channel "#incident-$(date +%Y%m%d-%H%M)-p0"

# 3. Start war room (Zoom)
zoom start-meeting --room=aurigraph-incident

# 4. Check service health
curl -s https://dlt.aurigraph.io/q/health
kubectl get pods -n aurigraph-production

# 5. Notify stakeholders immediately
python notify.py --severity=P0 --channel=all
```

---

### P1 - High (Severity 2)
**Impact:** Significant degradation affecting multiple users

**Examples:**
- API response time > 5 seconds
- TPS dropped below 500K (critical threshold)
- Partial service outage (some endpoints down)
- Database performance severely degraded
- Critical feature unavailable (e.g., cross-chain bridge)
- High error rate (>5%)

**Response Time:** 15 minutes
**Resolution Target:** 4 hours
**Communication:** Notify affected teams and management
**On-Call:** Page primary on-call engineer
**Status Page:** Update within 30 minutes

**Initial Actions:**
```bash
# 1. Acknowledge incident
pagerduty ack --incident-id=<incident-id>

# 2. Create incident channel
slack create-channel "#incident-$(date +%Y%m%d-%H%M)-p1"

# 3. Assess impact
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.tps, .errorRate'

# 4. Check recent changes
kubectl rollout history deployment/aurigraph-v11 -n aurigraph-production

# 5. Notify on-call and team lead
python notify.py --severity=P1 --channel=ops-team
```

---

### P2 - Medium (Severity 3)
**Impact:** Minor degradation or isolated issue

**Examples:**
- API response time > 1 second (but < 5 seconds)
- TPS dropped below 700K (warning threshold)
- Non-critical feature degraded
- Elevated error rate (1-5%)
- Single pod/service failure with redundancy
- Monitoring alert requires investigation

**Response Time:** 1 hour
**Resolution Target:** 24 hours
**Communication:** Notify on-call team
**On-Call:** Email/Slack notification to on-call
**Status Page:** Update if user-facing impact

**Initial Actions:**
```bash
# 1. Acknowledge alert
pagerduty ack --incident-id=<incident-id>

# 2. Investigate issue
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --tail=100

# 3. Assess if escalation needed
# If yes, escalate to P1

# 4. Create JIRA ticket
jira create --project=OPS --type=incident --priority=Medium --summary="<description>"
```

---

### P3 - Low (Severity 4)
**Impact:** Minimal or no user impact

**Examples:**
- Informational alerts
- Proactive maintenance needed
- Non-production environment issues
- Documentation updates needed
- Minor performance degradation (<10%)
- Planned maintenance notifications

**Response Time:** Next business day
**Resolution Target:** 1 week
**Communication:** Internal team only
**On-Call:** Create ticket for team
**Status Page:** No update needed

**Initial Actions:**
```bash
# 1. Create JIRA ticket
jira create --project=OPS --type=task --priority=Low --summary="<description>"

# 2. Schedule investigation
# Add to sprint planning or maintenance window

# 3. Document findings in ticket
```

---

## Escalation Procedures

### Escalation Matrix

```
┌─────────────────────────────────────────────────────────┐
│                  Escalation Hierarchy                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  P0/P1 Incident                                          │
│       │                                                  │
│       ├──> Primary On-Call Engineer (0-5 min)           │
│       │         │                                        │
│       │         ├──> Secondary On-Call Engineer (5 min) │
│       │         │         │                              │
│       │         │         ├──> Team Lead (15 min)       │
│       │         │         │         │                    │
│       │         │         │         ├──> VP Eng (30 min)│
│       │         │         │         │         │          │
│       │         │         │         │         └──> CTO   │
│       │         │         │         │                    │
│       │         │         │         └──> CISO (security) │
│       │         │         │                              │
│       │         │         └──> Subject Matter Experts:  │
│       │         │                   - Database Admin     │
│       │         │                   - Security Team      │
│       │         │                   - DevOps Lead        │
│       │         │                                        │
│       │         └──> Vendor Support (if needed)          │
│       │                   - AWS Support                  │
│       │                   - Datadog Support              │
│       │                   - Third-party APIs             │
│       │                                                  │
│       └──> External Communication:                       │
│                - Status page update                      │
│                - Customer notifications                  │
│                - Social media (if needed)                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Escalation Criteria

**Escalate to P0 if:**
- Complete service outage lasting >5 minutes
- Data breach confirmed or highly suspected
- Multiple critical systems affected simultaneously
- User data at risk
- Regulatory compliance issue
- Media attention or viral social media

**Escalate to P1 if:**
- Issue persists >15 minutes without resolution
- Workaround not available
- Impact broader than initially assessed
- Multiple P2 incidents related to same root cause
- Customer complaints escalating

**Escalate to Management if:**
- Incident duration >1 hour (P0) or >4 hours (P1)
- Need executive decision (e.g., full rollback vs. continued troubleshooting)
- PR/Communications support needed
- Legal or compliance implications
- Vendor escalation required

### Escalation Commands

```bash
# Escalate to secondary on-call
pagerduty escalate --incident-id=<incident-id> --level=2

# Escalate to team lead
pagerduty escalate --incident-id=<incident-id> --level=3

# Notify all hands on deck
slack notify --channel=#incident-all-hands --message="All engineers needed for P0 incident"

# Conference bridge
zoom start-meeting --room=aurigraph-war-room --notify-all

# Status page update
curl -X POST https://api.statuspage.io/v1/<page-id>/incidents \
  -H "Authorization: OAuth <token>" \
  -d '{"incident":{"name":"Service Degradation","status":"investigating","impact":"major"}}'
```

---

## On-Call Procedures

### On-Call Rotation

**Primary On-Call:** 7-day rotation, Monday 9am - Monday 9am
**Secondary On-Call:** 7-day rotation, offset by 3.5 days
**Escalation On-Call:** Monthly rotation (team leads)

### On-Call Responsibilities

**Before Your Shift:**
1. Test PagerDuty notifications (push, SMS, voice)
2. Ensure laptop is charged and accessible
3. Verify VPN access and credentials
4. Review runbooks and recent incidents
5. Check calendar for any planned changes or releases
6. Sync with outgoing on-call for any ongoing issues

**During Your Shift:**
1. Acknowledge alerts within 5 minutes (P0/P1)
2. Begin investigation within response time SLA
3. Update incident channel with progress every 15-30 minutes
4. Escalate if unable to resolve within target time
5. Document all actions taken
6. Keep status page updated

**After Your Shift:**
1. Hand off any ongoing incidents to incoming on-call
2. Complete incident reports for all P0/P1 incidents
3. File follow-up JIRA tickets for identified issues
4. Update runbooks with any new findings

### On-Call Tools Checklist

**Required:**
- [ ] Laptop with full battery
- [ ] Smartphone with PagerDuty app
- [ ] VPN client installed and tested
- [ ] kubectl configured with production access
- [ ] AWS CLI with production credentials
- [ ] Slack desktop app
- [ ] Zoom client
- [ ] SSH keys for production servers

**Optional but Recommended:**
- [ ] Backup laptop
- [ ] Portable charger for phone
- [ ] Headset for calls
- [ ] Notepad for quick notes

### On-Call Handoff Procedure

```bash
# 1. Schedule handoff meeting (15 minutes)
# 2. Share screen and walk through:
#    - Current alerts and their status
#    - Ongoing incidents or investigations
#    - Recent deployments or changes
#    - Upcoming maintenance windows
#    - Known issues or workarounds

# 3. Test notification chain
pagerduty test-notification --user=<incoming-on-call-user-id>

# 4. Document handoff in Slack
slack post --channel=#ops-handoff --message="
On-Call Handoff: <YYYY-MM-DD>
Outgoing: @<outgoing-engineer>
Incoming: @<incoming-engineer>
Status: <All Clear | Ongoing: <description>>
Notes: <any-important-notes>
"

# 5. Update on-call schedule
pagerduty update-schedule --user=<incoming-on-call-user-id>
```

### On-Call Compensation

- **Weekday On-Call (M-F):** 2 hours comp time per day
- **Weekend On-Call (Sat-Sun):** 4 hours comp time per day
- **Holiday On-Call:** 8 hours comp time per day
- **Incident Response:** 1.5x hours worked (outside business hours)

---

## Communication Templates

### Template 1: Initial Incident Notification (P0/P1)

**Slack/Email:**
```
INCIDENT ALERT - [P0/P1] <Incident Title>

Severity: P0 / P1
Status: INVESTIGATING
Start Time: <YYYY-MM-DD HH:MM UTC>
Incident Commander: @<name>
Impact: <Brief description of user impact>

Current Actions:
- <Action 1>
- <Action 2>

Incident Channel: #incident-<YYYYMMDD-HHMM>-<severity>
War Room: <zoom-link>

Next Update: <HH:MM UTC>
```

**Status Page:**
```
Title: Service Degradation [or Outage]
Status: Investigating
Impact: Major [or Critical]

We are currently investigating reports of <issue description>. Users may experience <specific impact>. Our team is actively working on a resolution.

Updates will be provided every 30 minutes.
```

**Customer Email (if needed):**
```
Subject: [Aurigraph] Service Impact Notification

Dear Valued Customer,

We are currently experiencing [describe issue] affecting [describe impact]. Our engineering team has been alerted and is actively working on a resolution.

Incident ID: <incident-id>
Start Time: <YYYY-MM-DD HH:MM UTC>
Estimated Resolution: <time or "investigating">

Current Status: <brief update>

We apologize for any inconvenience and appreciate your patience. Updates will be provided at <status-page-url>.

If you have urgent concerns, please contact support@aurigraph.io.

Best regards,
Aurigraph Operations Team
```

---

### Template 2: Incident Update (Progress)

**Slack/Email:**
```
INCIDENT UPDATE - [P0/P1] <Incident Title>

Severity: P0 / P1
Status: INVESTIGATING / FIXING / MONITORING
Time Since Start: <duration>

Progress Update:
- <Update 1>
- <Update 2>
- <Current action>

Root Cause (if identified): <description or "Still investigating">

ETA to Resolution: <time or "Unknown">

Next Update: <HH:MM UTC>
```

**Status Page:**
```
Update (<YYYY-MM-DD HH:MM UTC>):

Our team has identified [root cause / partial cause] and is currently [implementing fix / testing solution]. We expect [progress description].

[Optional: Workaround instructions if available]

Next update in 30 minutes or when significant progress is made.
```

---

### Template 3: Incident Resolution

**Slack/Email:**
```
INCIDENT RESOLVED - [P0/P1] <Incident Title>

Severity: P0 / P1
Status: RESOLVED
Start Time: <YYYY-MM-DD HH:MM UTC>
Resolution Time: <YYYY-MM-DD HH:MM UTC>
Total Duration: <duration>

Resolution Summary:
<Brief description of what was done to resolve>

Root Cause:
<1-2 sentence description>

Impact:
<Description of what was affected>

Preventive Actions:
- <Action 1>
- <Action 2>

Post-Mortem: Will be published within 48 hours at <link>

Thank you to everyone involved: @<person1>, @<person2>, ...
```

**Status Page:**
```
RESOLVED (<YYYY-MM-DD HH:MM UTC>):

The issue has been resolved. All services are operating normally.

Root Cause: <brief description>

We sincerely apologize for the disruption. A detailed post-mortem will be published within 48 hours.

Thank you for your patience.
```

**Customer Email:**
```
Subject: [Aurigraph] Service Restored - Incident Resolved

Dear Valued Customer,

The service disruption reported earlier has been resolved. All systems are now operating normally.

Incident Summary:
- Start Time: <YYYY-MM-DD HH:MM UTC>
- Resolution Time: <YYYY-MM-DD HH:MM UTC>
- Duration: <duration>
- Impact: <brief description>
- Root Cause: <brief description>

Actions Taken:
<Brief description of resolution>

Preventive Measures:
We are implementing the following measures to prevent recurrence:
- <Measure 1>
- <Measure 2>

A detailed post-mortem report will be available at <link> within 48 hours.

We deeply apologize for any inconvenience this may have caused. If you have any questions or concerns, please contact support@aurigraph.io.

Thank you for your patience and continued trust in Aurigraph.

Best regards,
Aurigraph Operations Team
```

---

### Template 4: Planned Maintenance Notification

**Advance Notice (7 days):**
```
Subject: [Aurigraph] Scheduled Maintenance - <YYYY-MM-DD>

Dear Valued Customer,

We will be performing scheduled maintenance to improve system performance and reliability.

Maintenance Window:
- Start: <YYYY-MM-DD HH:MM UTC>
- End: <YYYY-MM-DD HH:MM UTC>
- Duration: <estimated duration>

Expected Impact:
<Description of expected service availability during maintenance>

Reason:
<Brief description of what's being done and why>

We apologize for any inconvenience. If you have concerns, please contact support@aurigraph.io.

Best regards,
Aurigraph Operations Team
```

**Reminder (24 hours before):**
```
Subject: [Aurigraph] Maintenance Reminder - Tomorrow <YYYY-MM-DD>

This is a reminder that scheduled maintenance will begin in 24 hours.

Window: <start-time> to <end-time> UTC
Expected Impact: <description>

Status updates will be available at <status-page-url>.
```

---

### Template 5: Security Incident Notification

**Internal (Immediate):**
```
SECURITY INCIDENT - [P0] <Incident Title>

CONFIDENTIAL - DO NOT FORWARD

Severity: P0
Classification: <Data Breach | Unauthorized Access | DDoS | etc.>
Start Time: <YYYY-MM-DD HH:MM UTC>
Incident Commander: @<name>
Security Lead: @<CISO or Security Lead>

Immediate Actions:
- <Action 1 - e.g., affected accounts locked>
- <Action 2 - e.g., malicious IPs blocked>
- <Action 3 - e.g., forensics initiated>

War Room: <zoom-link>
Incident Channel: #security-incident-<YYYYMMDD-HHMM>

DO NOT discuss this incident in public channels or with external parties until approved by Security Lead.

Next Update: <HH:MM UTC>
```

**External (if required by regulation):**
```
Subject: [Aurigraph] Security Incident Notification

Dear Valued Customer,

We are writing to inform you of a security incident that may have affected your account.

Incident Date: <YYYY-MM-DD>
Discovery Date: <YYYY-MM-DD>

What Happened:
<Description of incident>

Information Potentially Affected:
<List of data types that may have been compromised>

Our Response:
<Description of immediate actions taken>

What We Are Doing:
<Description of ongoing investigation and remediation>

What You Should Do:
<Specific recommendations for affected users>

We take security very seriously and sincerely apologize for this incident.

For questions, please contact security@aurigraph.io.

Sincerely,
Aurigraph Security Team
```

---

## War Room Setup

### Purpose
A war room is a dedicated virtual space for coordinating incident response, bringing together all relevant personnel for real-time collaboration.

### When to Activate War Room
- P0 incidents (always)
- P1 incidents if multiple teams involved
- P1 incidents lasting >30 minutes
- Security incidents (P0/P1)
- Any incident requiring executive involvement

### War Room Components

**1. Incident Command Structure**
```
┌─────────────────────────────────────┐
│      Incident Commander (IC)        │ - Coordinates overall response
│                                     │ - Makes final decisions
└───────────┬─────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────┐
│Technical│   │Communications│
│  Lead   │   │     Lead     │
└────┬────┘   └──────┬───────┘
     │               │
     ▼               ▼
┌─────────┐   ┌─────────────┐
│Engineers│   │Stakeholders │
│  (SMEs) │   │  (updates)  │
└─────────┘   └─────────────┘
```

**2. War Room Roles**

**Incident Commander (IC):**
- Owns the incident end-to-end
- Coordinates response activities
- Makes go/no-go decisions
- Delegates tasks to Technical Lead
- Interfaces with Communications Lead
- Declares incident resolved

**Technical Lead:**
- Oversees technical investigation
- Assigns tasks to engineers
- Reviews proposed solutions
- Provides technical updates to IC
- Ensures proper documentation

**Communications Lead:**
- Manages internal and external communications
- Updates status page
- Coordinates with PR/Marketing (if needed)
- Drafts customer notifications
- Schedules post-mortem meeting

**Subject Matter Experts (SMEs):**
- Provide specialized knowledge (DB, networking, security, etc.)
- Execute technical remediation
- Propose solutions
- Document actions taken

**Scribe:**
- Documents all actions and decisions in real-time
- Maintains incident timeline
- Records war room discussions
- Captures command history
- Creates incident report draft

---

### War Room Setup Procedure

**Step 1: Create Virtual Meeting (Zoom)**
```bash
# Start dedicated Zoom room
zoom start-meeting --room=aurigraph-incident --record=true

# OR use permanent war room URL
zoom join --url=https://zoom.us/j/aurigraph-war-room
```

**Step 2: Create Incident Slack Channel**
```bash
slack create-channel "#incident-$(date +%Y%m%d-%H%M)-<severity>"

# Set channel topic
slack set-topic --channel="#incident-$(date +%Y%m%d-%H%M)-<severity>" \
  --topic="[<severity>] <incident-title> | IC: @<name> | War Room: <zoom-link>"

# Invite key personnel
slack invite --channel="#incident-$(date +%Y%m%d-%H%M)-<severity>" \
  --users="@oncall,@team-lead,@devops-lead"
```

**Step 3: Activate Incident Command**
```
Incident Commander announces in Slack:

"INCIDENT DECLARED - [P0/P1] <Incident Title>

I am Incident Commander for this incident.

Roles:
- IC: @<name>
- Technical Lead: @<name>
- Communications Lead: @<name>
- Scribe: @<name>

War Room: <zoom-link> (join now)
Incident Channel: #incident-<YYYYMMDD-HHMM>-<severity>

All communications should go through this channel. Please join the war room immediately.

First priority: <initial action>
"
```

**Step 4: Set Up Incident Tracking**
```bash
# Create incident Google Doc for real-time collaboration
gdrive create --title="Incident-$(date +%Y%m%d-%H%M)-<severity>" --type=doc

# OR use Confluence page
confluence create --space=OPS --title="Incident-$(date +%Y%m%d-%H%M)"

# Structure:
# - Incident Summary
# - Timeline (continuously updated)
# - Actions Taken
# - Decisions Made
# - Outstanding Questions
```

**Step 5: Start Timer and Checkpoints**
```bash
# Set up regular status updates
while true; do
  sleep 900  # 15 minutes
  slack post --channel="#incident-<YYYYMMDD-HHMM>" \
    --message="@channel 15-minute checkpoint. IC: Please provide status update."
done

# Set up executive escalation timer
(sleep 3600; slack post --channel="#incident-<YYYYMMDD-HHMM>" \
  --message="@IC Incident has lasted 1 hour. Consider executive escalation.") &
```

---

### War Room Meeting Structure

**Opening (First 5 minutes):**
1. IC introduces themselves and confirms roles
2. Quick round-robin: each person states their name and role
3. IC summarizes incident (what we know, what we don't know)
4. IC states initial hypothesis and action plan
5. IC assigns first tasks

**Ongoing (Every 15-30 minutes):**
1. Technical Lead provides status update
2. Each SME reports on their assigned task
3. IC asks for new information or hypotheses
4. IC makes decisions on next actions
5. Communications Lead provides update on external communications
6. Scribe confirms timeline is up to date

**Closing:**
1. IC confirms issue is resolved
2. Verify monitoring shows normal metrics
3. IC assigns post-mortem owner
4. IC thanks everyone for their contributions
5. IC declares incident closed

---

### War Room Best Practices

**DO:**
- Keep communication clear and concise
- Document every action and decision
- Update status regularly (every 15-30 min)
- Escalate when uncertain
- Ask questions if something is unclear
- Take breaks if incident is prolonged (rotate personnel)
- Use clear commands with confirmation (e.g., "Person X, please do Y. Confirm?")

**DON'T:**
- Discuss unrelated topics
- Speculate without evidence
- Blame individuals
- Skip documentation "to save time"
- Make assumptions - verify everything
- Work in silos - collaborate openly
- Panic - stay calm and methodical

---

### War Room Communication Protocols

**Command Confirmation:**
```
IC: "@Alice, please restart the V11 deployment."
Alice: "Acknowledged, restarting V11 deployment now."
[After action]
Alice: "Confirmed, V11 deployment restarted. New pods coming up."
```

**Status Update:**
```
IC: "Status update. Technical Lead, what's our current state?"
Tech Lead: "We've identified the root cause as database connection pool exhaustion.
            We're increasing the pool size now. ETA 5 minutes."
IC: "Understood. Communications Lead, please update status page with 'Fix in progress, ETA 5 minutes.'"
Comms Lead: "Acknowledged, updating status page now."
```

**Decision Point:**
```
IC: "We have two options: A) Increase connection pool, or B) Restart database.
     Technical Lead, what do you recommend?"
Tech Lead: "Option A is lower risk but might take longer. Option B is faster but
            risks brief downtime."
IC: "Given the current impact, I'm deciding on Option A. Execute."
```

---

## Post-Mortem Template

### Purpose
A post-mortem is a blameless analysis of an incident, focused on understanding what happened, why it happened, and how to prevent it in the future.

### Timeline
- **P0 incidents:** Post-mortem published within 48 hours
- **P1 incidents:** Post-mortem published within 1 week
- **P2 incidents:** Post-mortem optional, at team's discretion

### Post-Mortem Document Structure

```markdown
# Post-Mortem: <Incident Title>

**Date:** <YYYY-MM-DD>
**Author:** <Name>
**Reviewers:** <Names>
**Status:** Draft | Review | Published

---

## Executive Summary

<2-3 paragraph summary covering:
- What happened
- Impact (duration, users affected, revenue loss if applicable)
- Root cause (1 sentence)
- Key preventive actions>

---

## Incident Details

### Timeline

All times in UTC.

| Time | Event |
|------|-------|
| YYYY-MM-DD HH:MM | Alert fired: <alert-name> |
| YYYY-MM-DD HH:MM | On-call engineer paged |
| YYYY-MM-DD HH:MM | Incident acknowledged |
| YYYY-MM-DD HH:MM | Investigation began |
| YYYY-MM-DD HH:MM | Root cause identified |
| YYYY-MM-DD HH:MM | Fix implemented |
| YYYY-MM-DD HH:MM | Incident resolved |
| YYYY-MM-DD HH:MM | Post-incident monitoring completed |

**Total Duration:** <X hours Y minutes>

### Impact

**User Impact:**
- Number of users affected: <number or percentage>
- Services impacted: <list>
- User-visible symptoms: <description>

**Business Impact:**
- Transactions lost: <number>
- Revenue impact: <$amount or "minimal">
- SLA violations: <yes/no, details>
- Reputation impact: <description>

**Technical Impact:**
- Services affected: <list>
- Data integrity: <affected / not affected>
- Performance degradation: <metrics>

---

## Root Cause Analysis

### What Happened

<Detailed narrative of the incident from start to finish. Include:
- Initial trigger
- How the issue propagated
- Why safety mechanisms (if any) didn't prevent it
- What made it worse
- What finally resolved it>

### Why It Happened

**Immediate Cause:**
<Technical description of the direct cause>

**Contributing Factors:**
1. <Factor 1 - e.g., inadequate monitoring>
2. <Factor 2 - e.g., lack of redundancy>
3. <Factor 3 - e.g., insufficient testing>

**Root Cause:**
<Deeper systemic issue that allowed this to happen>

### What Went Well

<Positive aspects of the incident response:
- Quick detection
- Effective communication
- Good teamwork
- Successful mitigation>

### What Went Wrong

<Areas for improvement:
- Delayed detection
- Unclear runbooks
- Missing alerts
- Poor communication>

---

## Resolution

### Immediate Actions Taken

1. <Action 1 - e.g., Restarted service>
2. <Action 2 - e.g., Increased resource limits>
3. <Action 3 - e.g., Rolled back deployment>

### Verification

<How we confirmed the issue was resolved:
- Metrics returned to normal
- User reports ceased
- Test transactions successful>

---

## Action Items

### Prevent

<Actions to prevent this specific issue from recurring>

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| <Action description> | @<name> | YYYY-MM-DD | P0/P1/P2 | Open/Done |
| Add connection pool monitoring | @alice | 2025-11-20 | P0 | Open |
| Increase default connection pool size | @bob | 2025-11-15 | P0 | Open |

### Detect

<Actions to improve detection of similar issues>

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| <Action description> | @<name> | YYYY-MM-DD | P0/P1/P2 | Open/Done |
| Add alert for connection pool saturation | @charlie | 2025-11-18 | P1 | Open |
| Implement synthetic transaction monitoring | @dave | 2025-11-25 | P1 | Open |

### Respond

<Actions to improve incident response>

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| <Action description> | @<name> | YYYY-MM-DD | P0/P1/P2 | Open/Done |
| Update runbook with connection pool recovery | @eve | 2025-11-17 | P1 | Open |
| Create database failover procedure | @frank | 2025-11-22 | P2 | Open |

---

## Lessons Learned

### Technical Lessons

1. <Lesson 1 - e.g., Always monitor resource limits>
2. <Lesson 2 - e.g., Implement graceful degradation>
3. <Lesson 3 - e.g., Test failure scenarios regularly>

### Process Lessons

1. <Lesson 1 - e.g., Improve handoff procedures>
2. <Lesson 2 - e.g., Document tribal knowledge>
3. <Lesson 3 - e.g., Run more frequent drills>

---

## Supporting Information

### Metrics

<Include relevant graphs/charts:
- TPS over time
- Error rate over time
- Resource utilization
- API latency>

### Logs

<Include relevant log snippets showing the issue>

```
<log-entries>
```

### Runbooks Used

- <Link to runbook 1>
- <Link to runbook 2>

### References

- Incident Slack Channel: #incident-<YYYYMMDD-HHMM>
- Incident Timeline Doc: <link>
- Related JIRA Tickets: <links>
- Monitoring Dashboard: <link>

---

## Review & Sign-Off

### Reviewers

- [ ] Technical Lead: @<name> - Approved on YYYY-MM-DD
- [ ] Operations Manager: @<name> - Approved on YYYY-MM-DD
- [ ] VP Engineering: @<name> - Approved on YYYY-MM-DD (P0 only)

### Distribution

- Posted to: <team-wiki / eng-all / company-all>
- Discussed in: <team-meeting / all-hands>
- Published on: YYYY-MM-DD

---

**Document Status:** Published
**Last Updated:** YYYY-MM-DD
```

---

### Post-Mortem Meeting

**Schedule:** Within 3-5 days of incident resolution (not immediate)

**Duration:** 60 minutes

**Attendees:**
- Incident Commander
- All responders involved
- Team leads of affected services
- Optional: Management (observer only)

**Agenda:**

1. **Introduction (5 min)**
   - Set context: this is a blameless meeting
   - Goal is learning, not finger-pointing

2. **Timeline Review (15 min)**
   - Walk through incident timeline
   - Each responder adds details
   - Clarify any confusion

3. **Root Cause Discussion (15 min)**
   - Discuss immediate cause
   - Identify contributing factors
   - Dig deeper to find systemic issues

4. **What Went Well / Wrong (10 min)**
   - Celebrate good responses
   - Identify improvement areas

5. **Action Items (10 min)**
   - Brainstorm preventive measures
   - Assign owners and due dates
   - Prioritize actions

6. **Lessons Learned (5 min)**
   - Capture key takeaways
   - Identify patterns across incidents

7. **Wrap-Up (5 min)**
   - Confirm post-mortem owner
   - Set publication deadline
   - Thank everyone for their time

---

## Incident Response Workflows

### Workflow 1: High Error Rate

```
┌─────────────────────────────────────────┐
│     Alert: Error Rate > 1% for 5 min    │
└─────────────┬───────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Acknowledge   │
      │ Alert (P1)    │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐       ┌──────────────┐
      │ Check Logs    │────-->│ Identify     │
      │ (last 15 min) │       │ Error Pattern│
      └───────┬───────┘       └──────┬───────┘
              │                      │
              ▼                      ▼
      ┌───────────────┐       ┌──────────────┐
      │ Check Recent  │       │ Known Error? │
      │ Deployments   │       └──────┬───────┘
      └───────┬───────┘              │
              │              ┌────────┴────────┐
              │              │                 │
              │             YES               NO
              │              │                 │
              ▼              ▼                 ▼
      ┌───────────────┐  ┌─────────┐   ┌──────────────┐
      │ Deployment    │  │ Apply   │   │ Investigate  │
      │ < 1 hour ago? │  │ Known   │   │ New Issue    │
      └───────┬───────┘  │ Fix     │   └──────┬───────┘
              │          └────┬────┘          │
         ┌────┴────┐         │               │
        YES       NO         │               │
         │         │         ▼               ▼
         ▼         │   ┌──────────┐    ┌──────────┐
   ┌──────────┐   │   │ Verify   │    │ Consult  │
   │ Rollback │   │   │ Fix      │    │ Team /   │
   │ Deployment   │   └────┬─────┘    │ Escalate │
   └────┬─────┘   │        │          └────┬─────┘
        │         │        │               │
        └─────┬───┴────────┴───────────────┘
              │
              ▼
       ┌──────────────┐
       │ Apply Fix    │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Monitor for  │
       │ 30 minutes   │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐       ┌─────────────┐
       │ Error Rate   │─ YES─>│  Resolved   │
       │ Normal?      │       │ Close       │
       └──────┬───────┘       │ Incident    │
              │               └─────────────┘
             NO
              │
              ▼
       ┌──────────────┐
       │ Escalate to  │
       │ P0 if needed │
       └──────────────┘
```

---

### Workflow 2: Service Outage

```
┌─────────────────────────────────────────┐
│    Alert: Service Health Check Failed   │
└─────────────┬───────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Acknowledge   │
      │ Alert (P0)    │
      │ Start War Rm  │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │ Verify Outage │
      │ from multiple │
      │ locations     │
      └───────┬───────┘
              │
         ┌────┴────┐
         │         │
       DOWN       UP (false alarm)
         │         │
         ▼         ▼
   ┌──────────┐ ┌─────────┐
   │ Update   │ │ Close   │
   │ Status   │ │ Alert   │
   │ Page     │ │ Analyze │
   └────┬─────┘ └─────────┘
        │
        ▼
   ┌──────────────┐
   │ Check Pods   │
   │ kubectl get  │
   │ pods         │
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
  Running   CrashLoop/Error
     │         │
     ▼         ▼
┌─────────┐ ┌──────────────┐
│ Check   │ │ Check Pod    │
│ Network │ │ Logs         │
│ & LB    │ └──────┬───────┘
└────┬────┘        │
     │             ▼
     │      ┌──────────────┐
     │      │ Identify     │
     │      │ Crash Cause  │
     │      └──────┬───────┘
     │             │
     └─────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Determine    │
    │ Fix Strategy │
    └──────┬───────┘
           │
      ┌────┴─────┐
      │          │
  Rollback    Config Fix
      │          │
      ▼          ▼
 ┌─────────┐ ┌──────────┐
 │ Execute │ │ Apply    │
 │ Rollback│ │ Fix &    │
 │         │ │ Restart  │
 └────┬────┘ └────┬─────┘
      │           │
      └─────┬─────┘
            │
            ▼
     ┌──────────────┐
     │ Verify       │
     │ Service Up   │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ Monitor 1hr  │
     │ Update Status│
     │ Page         │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ Declare      │
     │ Resolved     │
     │ Schedule PM  │
     └──────────────┘
```

---

### Workflow 3: Database Performance Issue

```
┌─────────────────────────────────────────┐
│   Alert: Database CPU > 85% for 10 min  │
└─────────────┬───────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Acknowledge   │
      │ Alert (P1/P2) │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │ Check DB      │
      │ Metrics       │
      └───────┬───────┘
              │
         ┌────┴────┐
         │         │
      Query      I/O or
      CPU high   Connection
         │       bottleneck
         ▼            │
   ┌──────────┐      │
   │ Identify │      │
   │ Slow     │      │
   │ Queries  │      │
   └────┬─────┘      │
        │            │
        ▼            │
   ┌──────────┐     │
   │ Check for│     │
   │ Missing  │     │
   │ Indexes  │     │
   └────┬─────┘     │
        │           │
   ┌────┴────┐      │
   │         │      │
 Missing   Present  │
 Index     Index    │
   │         │      │
   ▼         ▼      ▼
┌───────┐ ┌────────────┐ ┌──────────┐
│ Add   │ │ Analyze    │ │ Check    │
│ Index │ │ Query Plan │ │ Conn     │
│       │ │ & Optimize │ │ Pool     │
└───┬───┘ └─────┬──────┘ └────┬─────┘
    │           │              │
    └─────┬─────┴──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Apply Fix    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Verify DB    │
   │ Performance  │
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
   Normal   Still High
     │         │
     ▼         ▼
 ┌─────────┐ ┌──────────┐
 │ Monitor │ │ Escalate │
 │ & Close │ │ Scale DB │
 └─────────┘ └────┬─────┘
                   │
                   ▼
            ┌──────────────┐
            │ Add Resources│
            │ Or Read      │
            │ Replicas     │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ Re-verify &  │
            │ Close        │
            └──────────────┘
```

---

## Runbook Quick Reference

### Critical Command Cheat Sheet

**Health Checks:**
```bash
# Overall service health
curl https://dlt.aurigraph.io/q/health

# Check TPS
curl https://dlt.aurigraph.io/api/v11/stats | jq '.tps'

# Check error rate
curl https://dlt.aurigraph.io/q/metrics | grep error_rate
```

**Pod Status:**
```bash
# Get pod status
kubectl get pods -n aurigraph-production

# Check pod logs
kubectl logs -n aurigraph-production deployment/aurigraph-v11 --tail=100

# Describe pod for events
kubectl describe pod <pod-name> -n aurigraph-production
```

**Quick Fixes:**
```bash
# Restart deployment
kubectl rollout restart deployment/aurigraph-v11 -n aurigraph-production

# Rollback deployment
kubectl rollout undo deployment/aurigraph-v11 -n aurigraph-production

# Scale deployment
kubectl scale deployment aurigraph-v11 -n aurigraph-production --replicas=5

# Delete failing pod
kubectl delete pod <pod-name> -n aurigraph-production
```

**Database:**
```bash
# Connect to database
kubectl exec -it <postgres-pod> -n aurigraph-production -- psql -U aurigraph

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';
```

**Monitoring:**
```bash
# Check resource usage
kubectl top pods -n aurigraph-production

# Check node resources
kubectl top nodes

# Get metrics
curl https://dlt.aurigraph.io/q/metrics
```

---

### Runbook Links

For detailed procedures, refer to the [Operational Runbooks Master](./OPERATIONAL_RUNBOOKS_MASTER.md):

- **Service Health Monitoring** - Page 6
- **Database Performance** - Page 20
- **Log Analysis** - Page 35
- **Network Diagnosis** - Page 48
- **Security Incidents** - Page 62
- **Performance Tuning** - Page 76
- **Capacity Planning** - Page 91
- **Upgrade Procedures** - Page 104
- **Consensus Operations** - Page 118
- **Cross-Chain Bridge** - Page 131
- **AI/ML Service Management** - Page 144

---

## Appendix

### Incident Severity Decision Tree

```
Is the entire platform down?
│
├─ YES ──> P0 (Critical)
│
└─ NO ──> Is a critical feature completely unavailable?
          │
          ├─ YES ──> Are multiple users affected?
          │         │
          │         ├─ YES ──> P0 (Critical)
          │         └─ NO ──> P1 (High)
          │
          └─ NO ──> Is there significant performance degradation?
                    │
                    ├─ YES (TPS < 500K) ──> P0 (Critical)
                    ├─ YES (TPS < 700K) ──> P1 (High)
                    ├─ YES (Latency > 5s) ──> P1 (High)
                    ├─ YES (Error rate > 5%) ──> P1 (High)
                    │
                    └─ NO ──> Is there a security concern?
                              │
                              ├─ YES (active breach) ──> P0 (Critical)
                              ├─ YES (potential breach) ──> P1 (High)
                              │
                              └─ NO ──> Are users complaining?
                                        │
                                        ├─ YES (multiple) ──> P1 (High)
                                        ├─ YES (few) ──> P2 (Medium)
                                        │
                                        └─ NO ──> P2 or P3 based on impact
```

---

### Contact Directory

**On-Call Rotation:**
```bash
# Check current on-call
pagerduty oncall --schedule=aurigraph-primary

# Or visit:
https://aurigraph.pagerduty.com/schedules
```

**Key Contacts:**

| Role | Primary | Secondary | Phone | Email |
|------|---------|-----------|-------|-------|
| Platform Engineer | TBD | TBD | +1-XXX-XXX-XXXX | ops@aurigraph.io |
| DevOps Lead | TBD | TBD | +1-XXX-XXX-XXXX | devops@aurigraph.io |
| Database Admin | TBD | TBD | +1-XXX-XXX-XXXX | dba@aurigraph.io |
| Security Lead | TBD | TBD | +1-XXX-XXX-XXXX | security@aurigraph.io |
| VP Engineering | TBD | - | +1-XXX-XXX-XXXX | vpeng@aurigraph.io |
| CTO | TBD | - | +1-XXX-XXX-XXXX | cto@aurigraph.io |

**Vendor Support:**

| Vendor | Support URL | Phone | SLA |
|--------|-------------|-------|-----|
| AWS Support | https://console.aws.amazon.com/support | - | Enterprise |
| Datadog | https://help.datadoghq.com | +1-866-329-4466 | 24/7 |
| PagerDuty | https://support.pagerduty.com | +1-844-700-3889 | 24/7 |
| PostgreSQL Support | https://www.postgresql.org/support | - | Community |

---

### Incident Metrics & SLAs

**Target Metrics:**

| Severity | Response Time | Resolution Time | MTTA* | MTTR** |
|----------|---------------|-----------------|-------|--------|
| P0 | 5 minutes | 1 hour | <5 min | <1 hour |
| P1 | 15 minutes | 4 hours | <15 min | <4 hours |
| P2 | 1 hour | 24 hours | <1 hour | <24 hours |
| P3 | 1 business day | 1 week | <1 day | <1 week |

*MTTA = Mean Time To Acknowledge
**MTTR = Mean Time To Resolution

**Monthly Incident Review:**
- Total incidents by severity
- MTTA and MTTR trends
- Repeat incidents (same root cause)
- Action item completion rate
- Post-mortem publication rate
- On-call response quality

---

### Training & Drills

**Incident Response Training:**
- New hire onboarding: 2-hour session
- Quarterly refresher: 1-hour session
- Annual war room simulation: 3-hour drill

**Scheduled Drills:**
- Monthly: Game day simulation (2 hours)
- Quarterly: Cross-team incident drill
- Annual: Full disaster recovery test

**Drill Scenarios:**
- Database failover
- Complete service outage
- Security breach response
- Multi-region failure
- Third-party API outage

---

## Conclusion

This incident response playbook provides comprehensive procedures for managing incidents across all severity levels. Key takeaways:

1. **Severity matters** - P0/P1 require immediate action and coordination
2. **Communication is critical** - Keep stakeholders informed every step
3. **Document everything** - Timelines and actions guide post-mortems
4. **Learn from incidents** - Post-mortems prevent future occurrences
5. **Practice makes perfect** - Regular drills improve response times

Remember: **Incidents are opportunities to improve.** Every incident makes our platform more resilient.

---

**Document Version:** 1.0.0
**Last Updated:** November 12, 2025
**Next Review:** February 12, 2026
**Maintainer:** Aurigraph Operations Team
**Feedback:** ops@aurigraph.io

---

Generated with Claude Code
