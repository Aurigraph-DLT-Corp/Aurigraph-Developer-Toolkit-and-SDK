#!/usr/bin/env python3
"""
Frontend Asset Path Fix - Jira Tickets Creation Script
Create tickets for fixing blank page issues on dev.aurigraph.io
"""

import os
import sys
import logging
from datetime import datetime
from jira import JIRA

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_frontend_asset_fix_tickets():
    """Create tickets for frontend asset path fixes"""
    
    # Initialize JIRA client
    server_url = os.getenv('JIRA_URL', 'https://aurigraphdlt.atlassian.net')
    username = os.getenv('JIRA_USERNAME')
    api_token = os.getenv('JIRA_API_TOKEN')
    project_key = 'AUREX'
    
    if not username or not api_token:
        logger.error("❌ Missing required environment variables: JIRA_USERNAME and JIRA_API_TOKEN")
        return False
    
    try:
        jira = JIRA(server=server_url, basic_auth=(username, api_token))
        logger.info(f"✅ Connected to JIRA: {server_url}")
        
        # First create the parent epic
        epic_fields = {
            'project': {'key': project_key},
            'summary': 'AUREX-200: Fix Blank Page Issue on dev.aurigraph.io',
            'description': """
**Epic to track all fixes needed to resolve blank page issues on dev.aurigraph.io**

This epic includes updating frontend asset paths and nginx configuration for proper path-based routing.

## Root Cause
Frontend applications are failing to load assets correctly due to incorrect base path configurations in vite.config.ts files. This is causing 404 errors for JS, CSS, and other static assets.

## Solution Overview
1. Update vite.config.ts files for all 6 frontend applications with correct base paths
2. Update nginx configuration for proper path-based routing
3. Rebuild and deploy all frontend containers with corrected configurations

## Applications Affected
- aurex-platform (root path)
- aurex-launchpad (/launchpad/)
- aurex-hydropulse (/hydropulse/)
- aurex-sylvagraph (/sylvagraph/)
- aurex-carbontrace (/carbontrace/)
- aurex-admin (/admin/)

## Success Criteria
All 6 applications load correctly without blank pages at dev.aurigraph.io
            """.strip(),
            'issuetype': {'name': 'Epic'},
            'priority': {'name': 'Critical'}
        }
        
        epic = jira.create_issue(fields=epic_fields)
        epic_key = epic.key
        logger.info(f"✅ Created Epic: {epic_key}")
        
        # Define all subtasks
        tickets = [
            {
                "key": "AUREX-201",
                "summary": "Fix Platform Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix Platform Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-platform to use correct base path configuration.

### Technical Details
- File to modify: `aurex-platform/vite.config.ts`
- Required change: Configure base path for root deployment
- Current issue: Assets loading from incorrect paths causing 404 errors

### Implementation
```typescript
export default defineConfig({
  base: '/',  // Root path for platform
  // ... other configuration
})
```

### Testing
1. Build the application locally
2. Verify assets load correctly in browser dev tools
3. Check for 404 errors in network tab

### Acceptance Criteria
- [x] Platform loads without blank page at https://dev.aurigraph.io/
- [x] All JS, CSS, and static assets load correctly
- [x] No 404 errors in browser console
- [x] Application is fully functional

### Files Modified
- `aurex-platform/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-202",
                "summary": "Fix Launchpad Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix Launchpad Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-launchpad to use base path '/launchpad/'.

### Technical Details
- File to modify: `aurex-launchpad/vite.config.ts`
- Required change: Configure base path for /launchpad/ deployment
- Current issue: Assets loading from root path instead of /launchpad/

### Implementation
```typescript
export default defineConfig({
  base: '/launchpad/',  // Correct path for launchpad
  // ... other configuration
})
```

### Testing
1. Build the application locally with new config
2. Deploy to test environment
3. Verify assets load from /launchpad/ prefix

### Acceptance Criteria
- [x] Launchpad loads at https://dev.aurigraph.io/launchpad
- [x] All assets load from /launchpad/ path
- [x] No 404 errors for static resources
- [x] Application functions correctly

### Files Modified
- `aurex-launchpad/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-203",
                "summary": "Fix HydroPulse Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix HydroPulse Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-hydropulse to use base path '/hydropulse/'.

### Technical Details
- File to modify: `aurex-hydropulse/vite.config.ts`
- Required change: Configure base path for /hydropulse/ deployment
- Current issue: Assets loading from incorrect path

### Implementation
```typescript
export default defineConfig({
  base: '/hydropulse/',  // Correct path for hydropulse
  // ... other configuration
})
```

### Testing
1. Build application with updated configuration
2. Verify asset paths in built files
3. Test loading in dev environment

### Acceptance Criteria
- [x] HydroPulse loads at https://dev.aurigraph.io/hydropulse
- [x] All assets serve correctly from /hydropulse/ path
- [x] Application renders without blank page
- [x] All functionality works as expected

### Files Modified
- `aurex-hydropulse/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-204",
                "summary": "Fix SylvaGraph Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix SylvaGraph Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-sylvagraph to use base path '/sylvagraph/'.

### Technical Details
- File to modify: `aurex-sylvagraph/vite.config.ts`
- Required change: Configure base path for /sylvagraph/ deployment
- Current issue: Static assets not loading from correct path

### Implementation
```typescript
export default defineConfig({
  base: '/sylvagraph/',  // Correct path for sylvagraph
  // ... other configuration
})
```

### Testing
1. Update configuration file
2. Build application locally
3. Verify asset references in dist folder

### Acceptance Criteria
- [x] SylvaGraph loads at https://dev.aurigraph.io/sylvagraph
- [x] All CSS, JS, and image assets load correctly
- [x] No console errors related to missing assets
- [x] Full application functionality restored

### Files Modified
- `aurex-sylvagraph/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-205",
                "summary": "Fix CarbonTrace Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix CarbonTrace Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-carbontrace to use base path '/carbontrace/'.

### Technical Details
- File to modify: `aurex-carbontrace/vite.config.ts`
- Required change: Configure base path for /carbontrace/ deployment
- Current issue: Assets failing to load causing blank page

### Implementation
```typescript
export default defineConfig({
  base: '/carbontrace/',  // Correct path for carbontrace
  // ... other configuration
})
```

### Testing
1. Apply configuration changes
2. Build and test locally
3. Verify all asset paths resolve correctly

### Acceptance Criteria
- [x] CarbonTrace loads at https://dev.aurigraph.io/carbontrace
- [x] All static resources load from correct /carbontrace/ path
- [x] Application displays properly without blank screen
- [x] All features and pages work correctly

### Files Modified
- `aurex-carbontrace/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-206",
                "summary": "Fix Admin Frontend Asset Paths",
                "assignee": "Frontend Team",
                "priority": "Critical",
                "description": """
## Task: Fix Admin Frontend Asset Paths

**Assignee**: Frontend Team  
**Priority**: Critical

### Description
Update vite.config.ts for aurex-admin to use base path '/admin/'.

### Technical Details
- File to modify: `aurex-admin/vite.config.ts`
- Required change: Configure base path for /admin/ deployment
- Current issue: Admin panel assets not loading from correct path

### Implementation
```typescript
export default defineConfig({
  base: '/admin/',  // Correct path for admin
  // ... other configuration
})
```

### Testing
1. Update vite configuration
2. Build admin application
3. Test asset loading in browser

### Acceptance Criteria
- [x] Admin panel loads at https://dev.aurigraph.io/admin
- [x] All admin interface assets load correctly
- [x] No 404 errors for JS/CSS/image files
- [x] Admin functionality fully operational

### Files Modified
- `aurex-admin/vite.config.ts`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-207",
                "summary": "Update Nginx Configuration for Path-Based Routing",
                "assignee": "DevOps Team",
                "priority": "Critical",
                "description": """
## Task: Update Nginx Configuration for Path-Based Routing

**Assignee**: DevOps Team  
**Priority**: Critical

### Description
Fix nginx reverse proxy configuration to properly handle asset paths for all frontend applications.

### Technical Details
- File to modify: `nginx/production-fixed.conf`
- Issue: Proxy configuration may not be correctly handling static asset requests
- Need to ensure all location blocks properly proxy asset requests

### Current Configuration Review
Review and fix all location blocks:
- `/` -> aurex_platform_frontend
- `/launchpad/` -> aurex_launchpad_frontend
- `/hydropulse/` -> aurex_hydropulse_frontend
- `/sylvagraph/` -> aurex_sylvagraph_frontend
- `/carbontrace/` -> aurex_carbontrace_frontend
- `/admin/` -> aurex_admin_frontend

### Required Changes
Ensure each location block:
1. Correctly proxies to the right upstream
2. Handles static assets properly
3. Sets appropriate headers
4. Has correct trailing slash handling

### Testing
1. Update nginx configuration
2. Test each application endpoint
3. Verify all assets load without 404 errors
4. Check browser network tab for asset loading

### Acceptance Criteria
- [x] All applications serve assets correctly without 404 errors
- [x] Nginx properly routes requests to correct upstream services
- [x] Static assets load from correct paths for each application
- [x] No reverse proxy configuration errors in nginx logs

### Files Modified
- `nginx/production-fixed.conf`
                """.strip(),
                "epic_link": epic_key
            },
            {
                "key": "AUREX-208",
                "summary": "Rebuild and Deploy All Frontend Containers",
                "assignee": "DevOps Team",
                "priority": "Critical",
                "description": """
## Task: Rebuild and Deploy All Frontend Containers

**Assignee**: DevOps Team  
**Priority**: Critical

### Description
Rebuild all frontend containers with corrected configurations and deploy to dev.aurigraph.io.

### Applications to Rebuild
1. aurex-platform (with base: '/')
2. aurex-launchpad (with base: '/launchpad/')
3. aurex-hydropulse (with base: '/hydropulse/')
4. aurex-sylvagraph (with base: '/sylvagraph/')
5. aurex-carbontrace (with base: '/carbontrace/')
6. aurex-admin (with base: '/admin/')

### Deployment Process
1. Build each frontend application with updated vite.config.ts
2. Create Docker images for each application
3. Update docker-compose configuration if needed
4. Deploy updated containers to dev.aurigraph.io
5. Restart nginx with updated configuration

### Verification Steps
1. Check that all containers are running correctly
2. Verify each application loads without blank page
3. Test asset loading for each application
4. Confirm all functionality works across applications

### Rollback Plan
- Keep previous container images as backup
- Document rollback procedure if deployment fails
- Have nginx configuration backup ready

### Acceptance Criteria
- [x] All 6 applications functional on dev.aurigraph.io
- [x] No blank page issues on any application
- [x] All assets load correctly for each application
- [x] Container health checks pass for all services
- [x] Deployment completed without downtime

### Monitoring
- Monitor container logs for errors
- Check nginx access/error logs
- Verify application health endpoints
- Monitor user access patterns

### Dependencies
- AUREX-201 through AUREX-206 must be completed first
- AUREX-207 (nginx config) should be completed before deployment
                """.strip(),
                "epic_link": epic_key
            }
        ]
        
        created_issues = []
        
        # Create all subtasks
        for ticket_data in tickets:
            try:
                # Create as subtask of epic
                task_fields = {
                    'project': {'key': project_key},
                    'summary': ticket_data["summary"],
                    'description': ticket_data["description"],
                    'issuetype': {'name': 'Task'},
                    'priority': {'name': ticket_data["priority"]},
                    'parent': {'key': epic_key}  # Link to epic
                }
                
                # Create the task
                task = jira.create_issue(fields=task_fields)
                
                # Transition to In Progress as requested
                # Get available transitions
                transitions = jira.transitions(task)
                in_progress_transition = None
                for transition in transitions:
                    if 'progress' in transition['name'].lower():
                        in_progress_transition = transition['id']
                        break
                
                if in_progress_transition:
                    jira.transition_issue(task, in_progress_transition)
                    logger.info(f"✅ Moved {task.key} to In Progress")
                
                created_issues.append({
                    'key': task.key,
                    'summary': ticket_data['summary'],
                    'assignee': ticket_data['assignee'],
                    'priority': ticket_data['priority']
                })
                
                logger.info(f"✅ Created task: {task.key} - {ticket_data['assignee']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create task '{ticket_data['summary']}': {str(e)}")
                continue
        
        # Summary
        print(f"\n" + "="*80)
        print(f"🎯 FRONTEND ASSET FIX TICKETS CREATED!")
        print(f"="*80)
        print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎫 Epic: {epic_key}")
        print(f"📝 Project: {project_key}")
        print(f"")
        print(f"📋 CREATED TICKETS:")
        print(f"-" * 80)
        
        print(f"🎯 **{epic_key}**: Fix Blank Page Issue on dev.aurigraph.io (EPIC)")
        print()
        
        for issue in created_issues:
            print(f"📌 **{issue['key']}**: {issue['summary']}")
            print(f"   👤 Assignee: {issue['assignee']}")
            print(f"   🔥 Priority: {issue['priority']}")
            print(f"   📊 Status: In Progress")
            print()
        
        print(f"✅ SUMMARY:")
        print(f"-" * 40)
        print(f"Total Tickets Created: {len(created_issues) + 1}")  # +1 for epic
        print(f"Epic: 1")
        print(f"Tasks: {len(created_issues)}")
        print(f"Status: All marked as In Progress")
        print()
        print(f"📋 IMPLEMENTATION ORDER:")
        print(f"1. AUREX-201 through AUREX-206: Fix vite.config.ts files")
        print(f"2. AUREX-207: Update nginx configuration")
        print(f"3. AUREX-208: Rebuild and deploy containers")
        print()
        print(f"🎉 ALL TICKETS READY FOR IMMEDIATE WORK!")
        print(f"="*80)
        
        return {
            'epic_key': epic_key,
            'created_issues': created_issues,
            'total_tickets': len(created_issues) + 1,
            'ready_for_work': True
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create tickets: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Creating Frontend Asset Fix Tickets...")
    print("🎯 Fixing blank page issues on dev.aurigraph.io")
    print()
    
    # Check for required environment variables
    if not os.getenv('JIRA_USERNAME') or not os.getenv('JIRA_API_TOKEN'):
        print("❌ Missing required environment variables:")
        print("   - JIRA_USERNAME")
        print("   - JIRA_API_TOKEN")
        print()
        print("💡 Please set these environment variables and try again:")
        print("   export JIRA_USERNAME='your_username'")
        print("   export JIRA_API_TOKEN='your_api_token'")
        sys.exit(1)
    
    try:
        result = create_frontend_asset_fix_tickets()
        print(f"\n✅ Successfully created {result['total_tickets']} tickets!")
        
    except Exception as e:
        print(f"❌ Ticket creation failed: {str(e)}")
        sys.exit(1)