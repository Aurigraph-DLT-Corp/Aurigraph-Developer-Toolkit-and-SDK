#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ SIMPLE JIRA INTEGRATION
# Create stories directly in the 4augustwork sprint
# ================================================================================

import os
from jira import JIRA
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_launchpad_stories():
    """Create Launchpad stories directly in the 4augustwork sprint"""
    
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
        
        # Define all stories with their completion status
        stories = [
            # Core Platform Foundation
            {"summary": "[LP-001-1] Create BaseModel with UUID primary keys and soft delete", "points": 5, "status": "Done", "epic": "Core Platform Foundation"},
            {"summary": "[LP-001-2] Implement TimestampMixin for automatic timestamps", "points": 3, "status": "Done", "epic": "Core Platform Foundation"},
            {"summary": "[LP-001-3] Setup DatabaseConfig with connection pooling", "points": 8, "status": "Done", "epic": "Core Platform Foundation"},
            
            # Authentication & Security Infrastructure
            {"summary": "[LP-002-1] Implement User authentication model with RBAC", "points": 13, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-2] Create Organization multi-tenant model", "points": 8, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-3] Build OrganizationMember with granular permissions", "points": 10, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-4] Setup JWT RefreshToken management", "points": 5, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-5] Implement UserSession tracking", "points": 8, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-6] Create comprehensive AuditLog system", "points": 8, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-7] Build SecurityEvent monitoring", "points": 8, "status": "Done", "epic": "Authentication & Security"},
            {"summary": "[LP-002-8] Implement secure password utilities with bcrypt", "points": 13, "status": "Done", "epic": "Authentication & Security"},
            
            # ESG Assessment Framework
            {"summary": "[LP-003-1] Create ESGFrameworkTemplate model supporting multiple standards", "points": 13, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-2] Build ESGAssessmentSection with hierarchical structure", "points": 10, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-3] Implement ESGAssessmentQuestion with flexible question types", "points": 15, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-4] Create ESGAssessment instance model with workflow", "points": 20, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-5] Build ESGAssessmentResponse with AI scoring", "points": 13, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-6] Implement AssessmentCollaborator for team workflows", "points": 8, "status": "Done", "epic": "ESG Assessment Framework"},
            {"summary": "[LP-003-7] Create AssessmentDocument for evidence management", "points": 10, "status": "Done", "epic": "ESG Assessment Framework"},
            
            # Document Intelligence System
            {"summary": "[LP-004-1] Build DocumentIntelligenceService with multi-format support", "points": 25, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-2] Implement PDF text extraction with PyPDF2 and textract", "points": 8, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-3] Create Excel processing with pandas", "points": 5, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-4] Build Word document processing with mammoth", "points": 5, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-5] Implement OCR with Tesseract for images", "points": 8, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-6] Create AI-powered ESG metric extraction", "points": 20, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-7] Build OpenAI integration for document analysis", "points": 13, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-8] Implement BatchDocumentProcessor for concurrent processing", "points": 10, "status": "Done", "epic": "Document Intelligence"},
            {"summary": "[LP-004-9] Create data quality scoring and insights generation", "points": 15, "status": "Done", "epic": "Document Intelligence"},
            
            # Reporting & Analytics Dashboard
            {"summary": "[LP-005-1] Create ESG score calculation algorithms", "points": 13, "status": "In Progress", "epic": "Reporting & Analytics"},
            {"summary": "[LP-005-2] Build dashboard API endpoints", "points": 15, "status": "To Do", "epic": "Reporting & Analytics"},
            {"summary": "[LP-005-3] Implement data visualization components", "points": 20, "status": "To Do", "epic": "Reporting & Analytics"},
            
            # User Experience Frontend
            {"summary": "[LP-006-1] Setup React TypeScript application", "points": 8, "status": "To Do", "epic": "Frontend Development"},
            {"summary": "[LP-006-2] Create authentication UI components", "points": 13, "status": "To Do", "epic": "Frontend Development"},
            {"summary": "[LP-006-3] Build assessment interface", "points": 25, "status": "To Do", "epic": "Frontend Development"},
            
            # Integration & Infrastructure
            {"summary": "[LP-007-1] Setup FastAPI application structure", "points": 8, "status": "To Do", "epic": "Integration & Infrastructure"},
            {"summary": "[LP-007-2] Create API endpoints for authentication", "points": 13, "status": "To Do", "epic": "Integration & Infrastructure"},
            {"summary": "[LP-007-3] Build ESG assessment APIs", "points": 20, "status": "To Do", "epic": "Integration & Infrastructure"},
            
            # Quality Assurance Framework
            {"summary": "[LP-008-1] Create unit tests for models", "points": 15, "status": "To Do", "epic": "Quality Assurance"},
            {"summary": "[LP-008-2] Build integration tests", "points": 13, "status": "To Do", "epic": "Quality Assurance"},
            {"summary": "[LP-008-3] Setup automated testing pipeline", "points": 8, "status": "To Do", "epic": "Quality Assurance"}
        ]
        
        created_issues = []
        
        for story_data in stories:
            try:
                # Create story
                story_fields = {
                    'project': {'key': project_key},
                    'summary': story_data["summary"],
                    'description': f"""
Implementation Details:
- Epic: {story_data["epic"]}  
- Story Points: {story_data["points"]}
- Implementation Status: {story_data["status"]}

Part of the Aurex Launchpad ESG Assessment Platform implementation following the VIBE Autonomous Virtual Agent Framework.
                    """.strip(),
                    'issuetype': {'name': 'Story'}
                }
                
                # Add story points if available
                if story_data["points"]:
                    story_fields['customfield_10300'] = story_data["points"]
                
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
                
                created_issues.append(story.key)
                logger.info(f"✅ Created story: {story.key} - {story_data['summary'][:50]}...")
                
            except Exception as e:
                logger.error(f"❌ Failed to create story '{story_data['summary'][:50]}...': {str(e)}")
                continue
        
        # Summary
        total_points = sum(story["points"] for story in stories)
        completed_points = sum(story["points"] for story in stories if story["status"] == "Done")
        
        logger.info(f"\n🎯 SPRINT SETUP COMPLETE!")
        logger.info(f"📊 Sprint: 4augustwork (ID: {sprint_id})")
        logger.info(f"📝 Created Issues: {len(created_issues)}")
        logger.info(f"🎯 Total Story Points: {total_points}")
        logger.info(f"✅ Completed Story Points: {completed_points}")
        logger.info(f"📈 Completion Rate: {(completed_points/total_points)*100:.1f}%")
        
        print(f"\n📋 Created Issues:")
        for issue_key in created_issues:
            print(f"  - {issue_key}")
        
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
        result = create_launchpad_stories()
        print(f"\n✅ Sprint setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Sprint setup failed: {str(e)}")
        exit(1)