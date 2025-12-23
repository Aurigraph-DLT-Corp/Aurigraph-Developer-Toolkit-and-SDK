# Team Notification - Duplicate Tickets Closure

## Slack/Teams Message Template

```
🎯 **Backlog Cleanup Complete - Duplicate Tickets Closed**

Hi Team,

We've successfully completed the duplicate ticket cleanup process for project AV11. Here's what was done:

**📊 Summary:**
- ✅ Closed 5 high-confidence duplicate tickets
- ✅ All duplicates properly linked to main tickets
- ✅ Added 'duplicate-resolved' label for tracking
- ✅ Set resolution to 'Duplicate' for all

**🔗 Closed Tickets:**
• AV11-382 → Duplicate of AV11-408
• AV11-381 → Duplicate of AV11-403
• AV11-380 → Duplicate of AV11-397
• AV11-379 → Duplicate of AV11-390
• AV11-378 → Duplicate of AV11-383

**📋 What This Means:**
- Backlog is now 5 tickets cleaner
- All information consolidated in main tickets
- Sprint planning filters should exclude duplicate-resolved label
- Please review main tickets for any updates needed

**🔍 Quick Links:**
• View all closed duplicates: https://aurigraphdlt.atlassian.net/issues/?jql=project=AV11 AND label=duplicate-resolved
• View clean backlog: https://aurigraphdlt.atlassian.net/issues/?jql=project=AV11 AND status!=Done AND label!=duplicate-resolved
• Full report: See DUPLICATE_TICKETS_CLOSURE_REPORT.md in project root

Questions? Let me know!
```

## Email Template (Alternative)

```
Subject: AV11 Backlog Cleanup - 5 Duplicate Tickets Closed

Hi Team,

I wanted to inform you that we've completed a backlog cleanup exercise for the AV11 project, closing 5 high-confidence duplicate tickets.

CLOSED DUPLICATES:
------------------
1. AV11-382 (Duplicate of AV11-408)
   https://aurigraphdlt.atlassian.net/browse/AV11-382

2. AV11-381 (Duplicate of AV11-403)
   https://aurigraphdlt.atlassian.net/browse/AV11-381

3. AV11-380 (Duplicate of AV11-397)
   https://aurigraphdlt.atlassian.net/browse/AV11-380

4. AV11-379 (Duplicate of AV11-390)
   https://aurigraphdlt.atlassian.net/browse/AV11-379

5. AV11-378 (Duplicate of AV11-383)
   https://aurigraphdlt.atlassian.net/browse/AV11-378

ACTIONS TAKEN:
--------------
✓ Added comments explaining closure reason
✓ Created duplicate link relationships
✓ Added 'duplicate-resolved' label
✓ Changed status to Done
✓ Set resolution to Duplicate

WHAT YOU NEED TO DO:
--------------------
1. Review the main tickets (AV11-408, 403, 397, 390, 383) to ensure all requirements are captured
2. Update your sprint planning filters to exclude tickets with label 'duplicate-resolved'
3. Check if any story point adjustments are needed on main tickets
4. Verify no dependencies are broken

JIRA FILTERS:
-------------
• All closed duplicates:
  project=AV11 AND label=duplicate-resolved AND status=Done

• Clean backlog (excluding closed duplicates):
  project=AV11 AND status!=Done AND label!=duplicate-resolved

For more details, see the full report: DUPLICATE_TICKETS_CLOSURE_REPORT.md

Best regards,
Subbu
```

## JIRA Comment Template (for Main Tickets)

If you want to add comments to the main tickets notifying about consolidated duplicates:

```
📎 **Duplicate Ticket Consolidated**

This ticket has absorbed requirements from the following duplicate ticket(s):
• [AV11-XXX](https://aurigraphdlt.atlassian.net/browse/AV11-XXX)

The duplicate ticket has been:
✓ Closed with status "Done"
✓ Marked with resolution "Duplicate"
✓ Linked to this ticket
✓ Tagged with label "duplicate-resolved"

Please review this ticket to ensure all requirements from the duplicate are captured.
```

## Sprint Planning Notes

Add to your sprint planning document:

```
## Backlog Cleanup - October 29, 2025

**Duplicate Tickets Closed**: 5
- AV11-382, AV11-381, AV11-380, AV11-379, AV11-378

**Updated Filters**:
- Sprint planning should now exclude: `label != duplicate-resolved`
- Active backlog count: ~408 tickets (down from ~413)

**Main Tickets to Review**:
- AV11-408, AV11-403, AV11-397, AV11-390, AV11-383
- Check for story point adjustments
- Verify requirement completeness
```

---

**Usage Instructions:**

1. **For Slack/Teams**: Copy the first template and post to your team channel
2. **For Email**: Use the email template if formal communication is needed
3. **For Main Tickets**: Optionally add comments to the 5 main tickets using the JIRA comment template
4. **For Sprint Planning**: Include the sprint planning notes in your next planning session

**Timing Recommendation:**
- Send notification within 24 hours of closure
- Include link to full report for transparency
- Follow up in next sprint planning meeting

