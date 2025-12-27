# Sprint 19 Pre-Flight Checklist - December 25 Evening

**CRITICAL**: Complete this checklist TODAY to ensure smooth execution at 9:00 AM tomorrow (Dec 26)

---

## ✅ VERIFICATION MATERIALS (Check Off as Complete)

### Leadership
- [ ] Read SPRINT-19-VERIFICATION-EXECUTIVE-SUMMARY.md (20 mins)
  - Location: `docs/sprints/SPRINT-19-VERIFICATION-EXECUTIVE-SUMMARY.md`
  - Focus areas: Success criteria, decision framework, timeline
  
- [ ] Review SPRINT-19-PRE-DEPLOYMENT-CHECKLIST-SUMMARY.md (10 mins)
  - Location: `docs/sprints/SPRINT-19-PRE-DEPLOYMENT-CHECKLIST-SUMMARY.md`
  - Understand the 37 items across 9 sections

- [ ] Confirm all 4 agents are available tomorrow 9:00 AM - 1:00 PM (4 hours)
  - Send calendar invites if not already done
  - Confirm each agent has read the quick-start card

### Tech Lead
- [ ] Review SPRINT-19-PRE-DEPLOYMENT-VERIFICATION.md (15 mins)
  - Location: `docs/sprints/SPRINT-19-PRE-DEPLOYMENT-VERIFICATION.md`
  - Section 1: Credentials verification procedures
  
- [ ] Review SPRINT-19-PRE-DEPLOYMENT-VERIFICATION-SECTION2.md (15 mins)
  - Location: `docs/sprints/SPRINT-19-PRE-DEPLOYMENT-VERIFICATION-SECTION2.md`
  - Section 2: Development environment verification

- [ ] Verify your local setup:
  ```bash
  # Check Java version
  java --version  # Should be 21+
  
  # Check Maven
  ./mvnw --version
  
  # Check PostgreSQL
  psql --version
  
  # Verify V12 codebase on V12 branch
  cd aurigraph-av10-7/aurigraph-v11-standalone
  git branch  # Should show V12
  ```

- [ ] Prepare escalation contacts list:
  - JIRA Admin contact + phone
  - GitHub Admin contact + phone
  - Database Admin contact + phone
  - V10 DevOps contact + phone
  - Executive Sponsor contact + phone

### All Agents (Each Independently)
- [ ] Read SPRINT-19-VERIFICATION-QUICK-START.txt (5 mins)
  - Location: `SPRINT-19-VERIFICATION-QUICK-START.txt` (in root)
  - Bookmark this file for quick reference tomorrow

- [ ] Read SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md (10 mins)
  - Location: `docs/sprints/SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md`
  - Understand communication cadence (morning standup, daily status, EOD check-in)

- [ ] Prepare your environment:
  ```bash
  # Test that terminal works
  echo "Terminal OK"
  
  # Verify git access
  git status
  
  # Verify you can cd to V12 directory
  cd aurigraph-av10-7/aurigraph-v11-standalone
  ls -la
  ```

- [ ] Extract credentials from centralized file:
  - Location: `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md`
  - Required credentials for tomorrow:
    - [ ] JIRA API token (for agent access)
    - [ ] GitHub SSH configured (test with `ssh -T git@github.com`)
    - [ ] V10 service token (if applicable to your role)
    - [ ] PostgreSQL credentials for local testing

---

## 🚀 TOMORROW'S EXECUTION SCHEDULE

| Time | Activity | Duration | Location | Responsible |
|------|----------|----------|----------|-------------|
| 8:45 AM | Team standup message posted to Slack | 5 mins | Slack channel | PM |
| 9:00 AM | Section 1 verification starts (credentials) | 60 mins | [Zoom/Teams] | All 4 agents + Tech Lead |
| 10:00 AM | Section 1 expected complete | - | - | - |
| 1:00 PM | Section 2 verification starts (dev environment) | 60 mins | [Zoom/Teams] | All 4 agents + Tech Lead |
| 2:00 PM | Section 2 expected complete | - | - | - |
| 5:00 PM | Daily status report due | - | Email | PM |
| 5:00 PM | EOD Slack update posted | 5 mins | Slack channel | PM |

---

## 📋 PRE-EXECUTION COMMAND REFERENCE

### Start Section 1 (At 9:00 AM)
```bash
cd ~/Aurigraph-DLT
chmod +x scripts/ci-cd/verify-sprint19-credentials.sh
./scripts/ci-cd/verify-sprint19-credentials.sh
```

Expected result: GitHub SSH PASS, others may SKIP (expected if credentials not in env yet)

### Start Section 2 (At 1:00 PM)
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Compile
./mvnw clean compile

# Start Quarkus dev mode (in background or separate terminal)
./mvnw quarkus:dev &

# Wait ~15 seconds, then test
sleep 15
curl -s http://localhost:9003/q/health | jq '.'

# Run tests
./mvnw test

# Test database
PGPASSWORD=aurigraph psql -h localhost -U aurigraph -d aurigraph -c "\dt"
```

---

## 🔧 CRITICAL - PRE-FLIGHT SYSTEM CHECKS

### All Agents
```bash
# Verify terminal access
echo "✓ Terminal"

# Verify git
git --version && echo "✓ Git"

# Verify Java (MUST be 21+)
java --version && echo "✓ Java"

# Verify Maven
./mvnw --version && echo "✓ Maven"

# Verify repo access
cd ~/Aurigraph-DLT && ls -la && echo "✓ Repo access"
```

### Tech Lead Only
```bash
# Verify PostgreSQL running
psql -h localhost -U postgres -c "SELECT 1;" && echo "✓ PostgreSQL"

# Verify V12 codebase
cd aurigraph-av10-7/aurigraph-v11-standalone
git status
git branch

# Verify you can compile
./mvnw clean compile --quiet && echo "✓ Maven compile works"
```

---

## 📞 ESCALATION READINESS

If you encounter ANY issues at 9:00 AM tomorrow:

**First 15 minutes (9:00-9:15)**:
- Post to Slack #aurigraph-v11-migration with error
- Do NOT spend time troubleshooting alone

**15-30 minute mark (9:15-9:30)**:
- Contact Tech Lead directly
- Have screenshot/log ready
- Provide exact error message

**30+ minute mark (9:30+)**:
- Escalate to PM if blocker is section-level (not agent-specific)
- PM escalates to Executive Sponsor if timeline at risk

---

## 💬 COMMUNICATION SETUP

### Slack Channel
- [ ] Joined #aurigraph-v11-migration
- [ ] Have browser/app open tomorrow
- [ ] Notifications enabled for messages from @PM and @TechLead

### Email
- [ ] Confirm you can reach: [PM email]
- [ ] Confirm you can reach: [Tech Lead email]
- [ ] Confirm you can reach: [Escalation contact]

### Video Conference
- [ ] Calendar invite accepted for 9:00 AM call
- [ ] Test your mic/camera/internet
- [ ] Have backup phone number ready

---

## 📊 FINAL READINESS VERIFICATION

**Run this summary check at 6:00 PM today**:

```bash
# 1. All documents in place?
ls -lh docs/sprints/SPRINT-19-*.md && \
ls -lh SPRINT-19-*.txt && \
ls -lh scripts/ci-cd/verify-sprint19-credentials.sh && \
echo "✓ All 9 documents in place"

# 2. Script executable?
test -x scripts/ci-cd/verify-sprint19-credentials.sh && echo "✓ Script executable"

# 3. Can reach Aurigraph-DLT repo?
cd ~/Aurigraph-DLT && git status && echo "✓ Repo accessible"

# 4. V12 codebase ready?
cd aurigraph-av10-7/aurigraph-v11-standalone && git branch && echo "✓ V12 ready"
```

---

## 🎯 TOMORROW'S SUCCESS CRITERIA

By end of day tomorrow (EOD 5:00 PM):

✅ **MUST HAVE**:
- Section 1: At least 5/7 items verified or path to completion clear
- Section 2: At least 4/6 items verified or path to completion clear
- Zero team members blocked without escalation initiated
- Daily status email sent to leadership

🟡 **GOOD TO HAVE**:
- Section 1: 7/7 complete (100%)
- Section 2: 6/6 complete (100%)
- Sections 3-4 started

🔴 **FAIL CONDITION**:
- Sections 1-2 combined <50% (less than 6/13 items passing)
- Critical blocker without escalation contact engaged
- No status report sent

---

## 📝 FINAL NOTES

**Remember**:
1. Dec 26-27 is the CRITICAL PATH - focus on Sections 1-2 only
2. Everything else can be deferred if time-constrained
3. This is verification, not production work - go systematic and documented
4. Report daily - no surprises on Dec 31
5. If stuck, escalate immediately - don't waste time troubleshooting alone

---

## ✨ YOU'RE READY!

All materials are prepared. All scripts are tested. Everything you need is ready.

**Tomorrow at 9:00 AM**: We verify that Aurigraph V12 Sprint 19 is ready to execute.

See you at 9:00 AM! 🚀

---

**Document Created**: December 25, 2025 (Pre-flight checklist)
**Execution Start**: December 26, 2025, 9:00 AM EST
**Critical Gate**: December 27, 2025, EOD (Sections 1-2 MUST be 100%)
**Final Sign-Off**: December 31, 2025, 2:00 PM EST

