#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ JIRA DISCOVERY
# Discover available JIRA projects, boards, and configuration
# ================================================================================

import os
from jira import JIRA
import json

def discover_jira_setup():
    """Discover JIRA projects, boards, and configuration"""
    
    # Initialize JIRA client
    server_url = os.getenv('JIRA_SERVER_URL', 'https://aurigraphdlt.atlassian.net')
    username = os.getenv('JIRA_USERNAME', 'yogesh@aurigraph.io')
    api_token = os.getenv('JIRA_API_TOKEN')
    
    print(f"🔗 Connecting to JIRA: {server_url}")
    print(f"👤 Username: {username}")
    
    try:
        jira = JIRA(
            server=server_url,
            basic_auth=(username, api_token)
        )
        print("✅ Successfully connected to JIRA!")
        
        # Get current user info
        current_user = jira.current_user()
        print(f"👤 Current User: {current_user}")
        
        # Discover projects
        print("\n📁 Available Projects:")
        projects = jira.projects()
        for project in projects:
            print(f"  - {project.key}: {project.name}")
            if hasattr(project, 'projectTypeKey'):
                print(f"    Type: {project.projectTypeKey}")
        
        # Try to get boards
        print("\n📋 Available Boards:")
        try:
            boards = jira.boards()
            for board in boards:
                print(f"  - Board ID {board.id}: {board.name}")
                print(f"    Type: {board.type}")
                if hasattr(board, 'location'):
                    print(f"    Project: {board.location.displayName}")
        except Exception as e:
            print(f"  ❌ Cannot access boards: {str(e)}")
            
            # Try alternative approach for boards
            try:
                print("  Trying alternative board discovery...")
                # Get boards via different endpoint
                boards_data = jira._get_json('rest/agile/1.0/board')
                for board_data in boards_data.get('values', []):
                    print(f"  - Board ID {board_data['id']}: {board_data['name']}")
                    print(f"    Type: {board_data['type']}")
            except Exception as e2:
                print(f"  ❌ Alternative board discovery failed: {str(e2)}")
        
        # Check if we have a specific project
        launchpad_project = None
        for project in projects:
            if project.key.upper() in ['LP', 'LAUNCHPAD', 'AUREX']:
                launchpad_project = project
                break
        
        if not launchpad_project:
            # Suggest creating a project
            print(f"\n💡 Suggestion: Create a new project for Aurex Launchpad")
            print(f"   Project Key: LP")
            print(f"   Project Name: Aurex Launchpad")
            print(f"   Project Type: Software")
            
            # Try to create project
            try:
                print(f"\n🚀 Attempting to create 'Aurex Launchpad' project...")
                new_project = jira.create_project(
                    key='LP',
                    name='Aurex Launchpad',
                    projectTypeKey='software',
                    description='Aurex Launchpad ESG Assessment Platform'
                )
                print(f"✅ Created project: {new_project.key} - {new_project.name}")
                launchpad_project = new_project
            except Exception as e:
                print(f"❌ Cannot create project: {str(e)}")
                print(f"   Please create the project manually in JIRA")
        else:
            print(f"\n✅ Found existing project: {launchpad_project.key} - {launchpad_project.name}")
        
        # If we have a project, try to create a board
        if launchpad_project:
            try:
                print(f"\n🚀 Attempting to create Scrum board for project {launchpad_project.key}...")
                board_data = {
                    "name": "Aurex Launchpad Board",
                    "type": "scrum",
                    "location": {
                        "type": "project",
                        "projectKeyOrId": launchpad_project.key
                    }
                }
                
                # Create board via REST API
                board_response = jira._session.post(
                    f"{server_url}/rest/agile/1.0/board",
                    json=board_data
                )
                
                if board_response.status_code == 201:
                    board_info = board_response.json()
                    print(f"✅ Created board: ID {board_info['id']} - {board_info['name']}")
                    return {
                        'project_key': launchpad_project.key,
                        'board_id': board_info['id'],
                        'board_name': board_info['name']
                    }
                else:
                    print(f"❌ Failed to create board: {board_response.status_code}")
                    print(f"   Response: {board_response.text}")
                    
            except Exception as e:
                print(f"❌ Cannot create board: {str(e)}")
        
        # Return configuration for manual setup
        return {
            'projects': [{'key': p.key, 'name': p.name} for p in projects],
            'needs_manual_setup': True
        }
        
    except Exception as e:
        print(f"❌ Failed to connect to JIRA: {str(e)}")
        return None

if __name__ == "__main__":
    print("🔍 Discovering JIRA Configuration...")
    result = discover_jira_setup()
    
    if result:
        print(f"\n📋 Configuration Summary:")
        print(json.dumps(result, indent=2))
    else:
        print(f"\n❌ Discovery failed. Please check your credentials.")