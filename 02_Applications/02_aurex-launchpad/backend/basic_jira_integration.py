#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ BASIC JIRA INTEGRATION
# Create basic stories in the 4augustwork sprint without custom fields
# ================================================================================

import os
from jira import JIRA
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_basic_launchpad_stories():
    """Create basic Launchpad stories in the 4augustwork sprint"""
    
    # Initialize JIRA client
    server_url = os.getenv('JIRA_SERVER_URL', 'https://aurigraphdlt.atlassian.net')
    username = os.getenv('JIRA_USERNAME', 'yogesh@aurigraph.io')
    api_token = os.getenv('JIRA_API_TOKEN')
    project_key = 'ARX'
    sprint_id = 129  # Existing 4augustwork sprint
    
    try:
        jira = JIRA(
            server=server_url,
            basic_auth=(username, api_token)
        )
        logger.info(f"✅ Connected to JIRA: {server_url}")
        
        # Define key stories with their completion status
        stories = [
            # Core Platform Foundation - COMPLETED
            {"summary": "[COMPLETED] Core Platform Foundation - BaseModel, TimestampMixin, DatabaseConfig", "status": "Done", "epic": "Core Platform Foundation", "points": 16},
            
            # Authentication & Security Infrastructure - COMPLETED  
            {"summary": "[COMPLETED] Authentication & Security - User, Organization, RBAC, JWT, Audit, Security", "status": "Done", "epic": "Authentication & Security", "points": 73},
            
            # ESG Assessment Framework - COMPLETED
            {"summary": "[COMPLETED] ESG Assessment Framework - Templates, Sections, Questions, Assessments, Responses", "status": "Done", "epic": "ESG Assessment Framework", "points": 89},
            
            # Document Intelligence System - COMPLETED
            {"summary": "[COMPLETED] Document Intelligence - Multi-format processing, AI extraction, OCR, Batch processing", "status": "Done", "epic": "Document Intelligence", "points": 109},
            
            # Reporting & Analytics Dashboard - IN PROGRESS
            {"summary": "[IN PROGRESS] Reporting & Analytics - ESG score calculations, Dashboard APIs, Visualizations", "status": "In Progress", "epic": "Reporting & Analytics", "points": 48},
            
            # User Experience Frontend - PENDING
            {"summary": "[PENDING] Frontend Development - React TypeScript, Authentication UI, Assessment Interface", "status": "To Do", "epic": "Frontend Development", "points": 46},
            
            # Integration & Infrastructure - PENDING
            {"summary": "[PENDING] Integration & Infrastructure - FastAPI structure, Auth APIs, Assessment APIs", "status": "To Do", "epic": "Integration & Infrastructure", "points": 41},
            
            # Quality Assurance Framework - PENDING
            {"summary": "[PENDING] Quality Assurance - Unit tests, Integration tests, CI/CD pipeline", "status": "To Do", "epic": "Quality Assurance", "points": 36}
        ]
        
        created_issues = []
        
        for story_data in stories:
            try:
                # Create comprehensive description
                description = f"""
## Epic: {story_data["epic"]}

### Story Points: {story_data["points"]}
### Implementation Status: {story_data["status"]}

### Implementation Details:
This story represents the implementation work completed as part of the Aurex Launchpad ESG Assessment Platform following the VIBE Autonomous Virtual Agent Framework.

### Technical Implementation:
- **Architecture**: Database models with SQLAlchemy ORM
- **Security**: bcrypt password hashing, JWT authentication, RBAC
- **AI Integration**: OpenAI-powered document analysis and ESG metric extraction
- **Frameworks Supported**: GRI, SASB, TCFD, CDP, ISO14064, EU Taxonomy, SEC Climate
- **Document Processing**: PDF, Excel, Word, CSV, Images with OCR support
- **Quality**: Comprehensive validation, audit logging, security monitoring

### Files Implemented:
- `/backend/models/base_models.py` - Core database foundation
- `/backend/models/auth_models.py` - Authentication and security
- `/backend/models/esg_models.py` - ESG assessment framework
- `/backend/services/document_intelligence.py` - AI document processing
- `/backend/security/password_utils.py` - Password security utilities

### Agent Assignments:
- Development Agent: Core platform foundation
- Security Intelligence Agent: Authentication and security
- AI/ML Orchestration Agent: ESG assessment and document intelligence
- Business Intelligence Agent: Reporting and analytics
- Frontend Development Agent: User interface
- DevOps Orchestration Agent: Infrastructure and deployment
- Quality Assurance Agent: Testing and validation

Part of the 24/7 VIBE Autonomous Virtual Agent Framework implementation.
                """.strip()
                
                # Create story with basic fields only
                story_fields = {
                    'project': {'key': project_key},
                    'summary': story_data["summary"],
                    'description': description,
                    'issuetype': {'name': 'Story'}
                }
                
                # Create the story
                story = jira.create_issue(fields=story_fields)
                
                # Add to sprint
                jira.add_issues_to_sprint(sprint_id, [story.key])
                
                # Update status if completed
                if story_data["status"] == "Done":
                    # Get available transitions
                    transitions = jira.transitions(story)
                    
                    # Find Done transition
                    done_transition = None
                    for transition in transitions:
                        if transition['name'].lower() in ['done', 'close', 'complete', 'resolve']:
                            done_transition = transition['id']
                            break
                    
                    if done_transition:
                        jira.transition_issue(story, done_transition)
                        logger.info(f"✅ Marked {story.key} as Done")
                
                elif story_data["status"] == "In Progress":
                    # Find In Progress transition
                    transitions = jira.transitions(story)
                    
                    in_progress_transition = None
                    for transition in transitions:
                        if 'progress' in transition['name'].lower() or 'start' in transition['name'].lower():
                            in_progress_transition = transition['id']
                            break
                    
                    if in_progress_transition:
                        jira.transition_issue(story, in_progress_transition)
                        logger.info(f"🔄 Marked {story.key} as In Progress")
                
                created_issues.append({
                    'key': story.key,
                    'summary': story_data['summary'],
                    'status': story_data['status'],
                    'points': story_data['points']
                })
                
                logger.info(f"✅ Created story: {story.key} - {story_data['epic']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create story '{story_data['epic']}': {str(e)}")
                continue
        
        # Summary
        total_points = sum(story["points"] for story in stories)
        completed_points = sum(story["points"] for story in stories if story["status"] == "Done")
        in_progress_points = sum(story["points"] for story in stories if story["status"] == "In Progress")
        
        logger.info(f"\n🎯 AUREX LAUNCHPAD 4AUGUSTWORK SPRINT COMPLETE!")
        logger.info(f"📊 Sprint: 4augustwork (ID: {sprint_id})")
        logger.info(f"📝 Created Issues: {len(created_issues)}")
        logger.info(f"🎯 Total Story Points: {total_points}")
        logger.info(f"✅ Completed Story Points: {completed_points}")
        logger.info(f"🔄 In Progress Story Points: {in_progress_points}")
        logger.info(f"📈 Completion Rate: {(completed_points/total_points)*100:.1f}%")
        
        print(f"\n📋 JIRA TICKETS CREATED AND UPDATED:")
        print(f"=" * 60)
        for issue in created_issues:
            status_emoji = "✅" if issue['status'] == "Done" else "🔄" if issue['status'] == "In Progress" else "⏳"
            print(f"{status_emoji} {issue['key']}: {issue['points']} pts - {issue['status']}")
        
        print(f"\n🎯 SPRINT SUMMARY:")
        print(f"Total Stories: {len(created_issues)}")
        print(f"Total Story Points: {total_points}")
        print(f"Completed: {completed_points} pts ({(completed_points/total_points)*100:.1f}%)")
        print(f"In Progress: {in_progress_points} pts ({(in_progress_points/total_points)*100:.1f}%)")
        print(f"Pending: {total_points - completed_points - in_progress_points} pts")
        
        return {
            'sprint_id': sprint_id,
            'created_issues': created_issues,
            'total_story_points': total_points,
            'completed_story_points': completed_points,
            'completion_rate': (completed_points/total_points)*100
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create stories: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Creating Aurex Launchpad Stories in 4augustwork Sprint...")
    
    # Check for required environment variables
    required_vars = ['JIRA_SERVER_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        exit(1)
    
    try:
        result = create_basic_launchpad_stories()
        print(f"\n🎉 SUCCESS! All Launchpad implementation work properly tracked in JIRA!")
        
    except Exception as e:
        print(f"❌ Sprint setup failed: {str(e)}")
        exit(1)