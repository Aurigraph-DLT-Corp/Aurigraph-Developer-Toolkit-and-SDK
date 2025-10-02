#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ JIRA INTEGRATION
# Automated JIRA ticket management for sprint updates
# Agent: DevOps Orchestration Agent
# ================================================================================

import os
import json
from typing import Dict, List, Any, Optional
from jira import JIRA
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JiraIntegration:
    """JIRA integration for Aurex Launchpad development"""
    
    def __init__(self, server_url: str = None, username: str = None, api_token: str = None):
        """Initialize JIRA connection"""
        self.server_url = server_url or os.getenv('JIRA_SERVER_URL')
        self.username = username or os.getenv('JIRA_USERNAME')  
        self.api_token = api_token or os.getenv('JIRA_API_TOKEN')
        self.project_key = os.getenv('JIRA_PROJECT_KEY', 'ARX')  # Aurex Project
        
        if not all([self.server_url, self.username, self.api_token]):
            raise ValueError("Missing JIRA configuration. Set JIRA_SERVER_URL, JIRA_USERNAME, and JIRA_API_TOKEN")
        
        # Initialize JIRA client
        try:
            self.jira = JIRA(
                server=self.server_url,
                basic_auth=(self.username, self.api_token)
            )
            logger.info(f"✅ Connected to JIRA: {self.server_url}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to JIRA: {str(e)}")
            raise
    
    def create_sprint(self, sprint_name: str, board_id: int, duration_weeks: int = 2) -> Dict[str, Any]:
        """Create a new sprint"""
        try:
            start_date = datetime.now()
            end_date = start_date + timedelta(weeks=duration_weeks)
            
            sprint_data = {
                'name': sprint_name,
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'originBoardId': board_id
            }
            
            sprint = self.jira.create_sprint(
                name=sprint_name,
                board_id=board_id,
                startDate=start_date.strftime('%Y-%m-%d'),
                endDate=end_date.strftime('%Y-%m-%d')
            )
            
            logger.info(f"✅ Created sprint: {sprint_name} (ID: {sprint.id})")
            return {
                'id': sprint.id,
                'name': sprint.name,
                'state': sprint.state,
                'startDate': sprint.startDate,
                'endDate': sprint.endDate
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to create sprint: {str(e)}")
            raise
    
    def get_or_create_sprint(self, sprint_name: str, board_id: int) -> Dict[str, Any]:
        """Get existing sprint or create new one"""
        try:
            # Search for existing sprint
            sprints = self.jira.sprints(board_id)
            for sprint in sprints:
                if sprint.name == sprint_name:
                    logger.info(f"✅ Found existing sprint: {sprint_name} (ID: {sprint.id})")
                    return {
                        'id': sprint.id,
                        'name': sprint.name,
                        'state': sprint.state,
                        'startDate': getattr(sprint, 'startDate', None),
                        'endDate': getattr(sprint, 'endDate', None)
                    }
            
            # Create new sprint if not found
            return self.create_sprint(sprint_name, board_id)
            
        except Exception as e:
            logger.error(f"❌ Failed to get/create sprint: {str(e)}")
            raise
    
    def create_epic(self, epic_name: str, description: str = "") -> Dict[str, Any]:
        """Create an epic"""
        try:
            epic_data = {
                'project': {'key': self.project_key},
                'summary': epic_name,
                'description': description,
                'issuetype': {'name': 'Epic'},
                'customfield_10002': epic_name  # Epic Name field
            }
            
            epic = self.jira.create_issue(fields=epic_data)
            
            logger.info(f"✅ Created epic: {epic_name} ({epic.key})")
            return {
                'key': epic.key,
                'id': epic.id,
                'summary': epic.fields.summary,
                'status': epic.fields.status.name
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to create epic: {str(e)}")
            raise
    
    def create_story(self, 
                    summary: str, 
                    description: str, 
                    epic_key: str = None,
                    story_points: int = None,
                    assignee: str = None,
                    sprint_id: int = None) -> Dict[str, Any]:
        """Create a user story"""
        try:
            story_data = {
                'project': {'key': self.project_key},
                'summary': summary,
                'description': description,
                'issuetype': {'name': 'Story'}
            }
            
            # Add epic link if provided
            if epic_key:
                story_data['customfield_10005'] = epic_key  # Epic Link field
            
            # Add story points if provided
            if story_points:
                story_data['customfield_10300'] = story_points  # Story Points field
            
            # Add assignee if provided
            if assignee:
                story_data['assignee'] = {'name': assignee}
            
            story = self.jira.create_issue(fields=story_data)
            
            # Add to sprint if provided
            if sprint_id:
                self.jira.add_issues_to_sprint(sprint_id, [story.key])
            
            logger.info(f"✅ Created story: {summary} ({story.key})")
            return {
                'key': story.key,
                'id': story.id,
                'summary': story.fields.summary,
                'status': story.fields.status.name
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to create story: {str(e)}")
            raise
    
    def update_story_status(self, issue_key: str, status: str) -> bool:
        """Update story status"""
        try:
            issue = self.jira.issue(issue_key)
            
            # Get available transitions
            transitions = self.jira.transitions(issue)
            
            # Find matching transition
            target_transition = None
            for transition in transitions:
                if transition['name'].lower() == status.lower():
                    target_transition = transition['id']
                    break
            
            if target_transition:
                self.jira.transition_issue(issue, target_transition)
                logger.info(f"✅ Updated {issue_key} status to: {status}")
                return True
            else:
                logger.warning(f"⚠️ Status '{status}' not available for {issue_key}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to update story status: {str(e)}")
            return False
    
    def add_issues_to_sprint(self, sprint_id: int, issue_keys: List[str]) -> bool:
        """Add issues to sprint"""
        try:
            self.jira.add_issues_to_sprint(sprint_id, issue_keys)
            logger.info(f"✅ Added {len(issue_keys)} issues to sprint {sprint_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to add issues to sprint: {str(e)}")
            return False

# ================================================================================
# LAUNCHPAD SPRINT SETUP
# ================================================================================

def setup_launchpad_sprint():
    """Setup the 4augustwork sprint with all Launchpad tickets"""
    
    # Initialize JIRA integration
    jira_client = JiraIntegration()
    
    # Sprint and board configuration
    SPRINT_NAME = "4augustwork"
    BOARD_ID = 494  # 4AugustWork board in Aurex project
    
    try:
        # Create or get sprint
        sprint = jira_client.get_or_create_sprint(SPRINT_NAME, BOARD_ID)
        sprint_id = sprint['id']
        
        # Define epics and stories based on implementation
        epics_and_stories = {
            "LP-001": {
                "epic_name": "Core Platform Foundation",
                "epic_description": "Database models, utilities, and core platform infrastructure",
                "stories": [
                    {"summary": "Create BaseModel with UUID primary keys and soft delete", "points": 5, "status": "Done"},
                    {"summary": "Implement TimestampMixin for automatic timestamps", "points": 3, "status": "Done"},
                    {"summary": "Setup DatabaseConfig with connection pooling", "points": 8, "status": "Done"}
                ]
            },
            "LP-002": {
                "epic_name": "Authentication & Security Infrastructure", 
                "epic_description": "Complete RBAC system with JWT authentication and security features",
                "stories": [
                    {"summary": "Implement User authentication model with RBAC", "points": 13, "status": "Done"},
                    {"summary": "Create Organization multi-tenant model", "points": 8, "status": "Done"},
                    {"summary": "Build OrganizationMember with granular permissions", "points": 10, "status": "Done"},
                    {"summary": "Setup JWT RefreshToken management", "points": 5, "status": "Done"},
                    {"summary": "Implement UserSession tracking", "points": 8, "status": "Done"},
                    {"summary": "Create comprehensive AuditLog system", "points": 8, "status": "Done"},
                    {"summary": "Build SecurityEvent monitoring", "points": 8, "status": "Done"},
                    {"summary": "Implement secure password utilities with bcrypt", "points": 13, "status": "Done"}
                ]
            },
            "LP-003": {
                "epic_name": "ESG Assessment Framework",
                "epic_description": "Comprehensive ESG assessment engine supporting GRI, SASB, TCFD, CDP, ISO14064",
                "stories": [
                    {"summary": "Create ESGFrameworkTemplate model supporting multiple standards", "points": 13, "status": "Done"},
                    {"summary": "Build ESGAssessmentSection with hierarchical structure", "points": 10, "status": "Done"},
                    {"summary": "Implement ESGAssessmentQuestion with flexible question types", "points": 15, "status": "Done"},
                    {"summary": "Create ESGAssessment instance model with workflow", "points": 20, "status": "Done"},
                    {"summary": "Build ESGAssessmentResponse with AI scoring", "points": 13, "status": "Done"},
                    {"summary": "Implement AssessmentCollaborator for team workflows", "points": 8, "status": "Done"},
                    {"summary": "Create AssessmentDocument for evidence management", "points": 10, "status": "Done"}
                ]
            },
            "LP-004": {
                "epic_name": "Document Intelligence System",
                "epic_description": "AI-powered document processing with multi-format support and ESG metric extraction",
                "stories": [
                    {"summary": "Build DocumentIntelligenceService with multi-format support", "points": 25, "status": "Done"},
                    {"summary": "Implement PDF text extraction with PyPDF2 and textract", "points": 8, "status": "Done"},
                    {"summary": "Create Excel processing with pandas", "points": 5, "status": "Done"},
                    {"summary": "Build Word document processing with mammoth", "points": 5, "status": "Done"},
                    {"summary": "Implement OCR with Tesseract for images", "points": 8, "status": "Done"},
                    {"summary": "Create AI-powered ESG metric extraction", "points": 20, "status": "Done"},
                    {"summary": "Build OpenAI integration for document analysis", "points": 13, "status": "Done"},
                    {"summary": "Implement BatchDocumentProcessor for concurrent processing", "points": 10, "status": "Done"},
                    {"summary": "Create data quality scoring and insights generation", "points": 15, "status": "Done"}
                ]
            },
            "LP-005": {
                "epic_name": "Reporting & Analytics Dashboard",
                "epic_description": "ESG scoring algorithms, dashboard APIs, and data visualization",
                "stories": [
                    {"summary": "Create ESG score calculation algorithms", "points": 13, "status": "In Progress"},
                    {"summary": "Build dashboard API endpoints", "points": 15, "status": "To Do"},
                    {"summary": "Implement data visualization components", "points": 20, "status": "To Do"}
                ]
            },
            "LP-006": {
                "epic_name": "User Experience Frontend",
                "epic_description": "React TypeScript frontend application with authentication and assessment interfaces",
                "stories": [
                    {"summary": "Setup React TypeScript application", "points": 8, "status": "To Do"},
                    {"summary": "Create authentication UI components", "points": 13, "status": "To Do"},
                    {"summary": "Build assessment interface", "points": 25, "status": "To Do"}
                ]
            },
            "LP-007": {
                "epic_name": "Integration & Infrastructure", 
                "epic_description": "FastAPI application structure and REST API endpoints",
                "stories": [
                    {"summary": "Setup FastAPI application structure", "points": 8, "status": "To Do"},
                    {"summary": "Create API endpoints for authentication", "points": 13, "status": "To Do"},
                    {"summary": "Build ESG assessment APIs", "points": 20, "status": "To Do"}
                ]
            },
            "LP-008": {
                "epic_name": "Quality Assurance Framework",
                "epic_description": "Comprehensive testing framework with unit tests, integration tests, and CI/CD pipeline",
                "stories": [
                    {"summary": "Create unit tests for models", "points": 15, "status": "To Do"},
                    {"summary": "Build integration tests", "points": 13, "status": "To Do"},
                    {"summary": "Setup automated testing pipeline", "points": 8, "status": "To Do"}
                ]
            }
        }
        
        # Create epics and stories
        created_issues = []
        
        for epic_key, epic_data in epics_and_stories.items():
            # Create epic
            epic = jira_client.create_epic(
                epic_data["epic_name"],
                epic_data["epic_description"]
            )
            
            # Create stories for this epic
            for story_data in epic_data["stories"]:
                story = jira_client.create_story(
                    summary=story_data["summary"],
                    description=f"Implementation for {epic_data['epic_name']}",
                    epic_key=epic["key"],
                    story_points=story_data["points"],
                    sprint_id=sprint_id
                )
                
                # Update status if completed
                if story_data["status"] in ["Done", "In Progress"]:
                    jira_client.update_story_status(story["key"], story_data["status"])
                
                created_issues.append(story["key"])
        
        logger.info(f"✅ Successfully created {len(created_issues)} issues in sprint '{SPRINT_NAME}'")
        logger.info(f"Sprint ID: {sprint_id}")
        logger.info(f"Created issues: {', '.join(created_issues)}")
        
        return {
            "sprint": sprint,
            "created_issues": created_issues,
            "total_story_points": sum(
                sum(story["points"] for story in epic_data["stories"]) 
                for epic_data in epics_and_stories.values()
            )
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to setup Launchpad sprint: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Setting up Aurex Launchpad 4augustwork Sprint...")
    
    # Check for required environment variables
    required_vars = ['JIRA_SERVER_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("\nPlease set:")
        print("export JIRA_SERVER_URL='https://yourcompany.atlassian.net'")
        print("export JIRA_USERNAME='your-username'") 
        print("export JIRA_API_TOKEN='your-api-token'")
        print("export JIRA_PROJECT_KEY='LP'  # Optional, defaults to 'LP'")
        exit(1)
    
    try:
        result = setup_launchpad_sprint()
        print(f"✅ Sprint setup completed successfully!")
        print(f"📊 Total Story Points: {result['total_story_points']}")
        print(f"📝 Created Issues: {len(result['created_issues'])}")
        
    except Exception as e:
        print(f"❌ Sprint setup failed: {str(e)}")
        exit(1)