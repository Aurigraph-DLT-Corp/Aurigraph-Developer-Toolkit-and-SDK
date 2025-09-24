#!/usr/bin/env python3
# ================================================================================
# JIRA FIELD DISCOVERY
# Discover custom fields in JIRA instance
# ================================================================================

import os
from jira import JIRA
import json

def discover_jira_fields():
    """Discover JIRA custom fields for epics and stories"""
    
    # Initialize JIRA client
    server_url = os.getenv('JIRA_SERVER_URL', 'https://aurigraphdlt.atlassian.net')
    username = os.getenv('JIRA_USERNAME', 'yogesh@aurigraph.io')
    api_token = os.getenv('JIRA_API_TOKEN')
    
    try:
        jira = JIRA(
            server=server_url,
            basic_auth=(username, api_token)
        )
        
        print("🔍 Discovering JIRA Custom Fields...")
        
        # Get all fields
        fields = jira.fields()
        
        # Filter for relevant fields
        relevant_fields = {}
        
        for field in fields:
            field_name = field['name'].lower()
            if any(keyword in field_name for keyword in ['epic', 'story', 'points', 'sprint']):
                relevant_fields[field['id']] = {
                    'name': field['name'],
                    'custom': field['custom'],
                    'searchable': field['searchable']
                }
        
        print("📋 Relevant Custom Fields:")
        for field_id, field_info in relevant_fields.items():
            print(f"  {field_id}: {field_info['name']} (Custom: {field_info['custom']})")
        
        # Try to get create metadata for the project
        try:
            print(f"\n🎯 Create metadata for ARX project:")
            create_meta = jira.createmeta(projectKeys='ARX', expand='projects.issuetypes.fields')
            
            for project in create_meta['projects']:
                print(f"Project: {project['name']} ({project['key']})")
                for issue_type in project['issuetypes']:
                    print(f"  Issue Type: {issue_type['name']}")
                    
                    # Check for Epic-specific fields
                    if issue_type['name'].lower() == 'epic':
                        print("    Epic Fields:")
                        for field_id, field_info in issue_type['fields'].items():
                            if 'epic' in field_info['name'].lower():
                                print(f"      {field_id}: {field_info['name']}")
                    
                    # Check for Story-specific fields  
                    elif issue_type['name'].lower() == 'story':
                        print("    Story Fields:")
                        for field_id, field_info in issue_type['fields'].items():
                            if any(keyword in field_info['name'].lower() for keyword in ['story', 'points', 'epic']):
                                print(f"      {field_id}: {field_info['name']}")
        
        except Exception as e:
            print(f"❌ Could not get create metadata: {str(e)}")
        
        return relevant_fields
        
    except Exception as e:
        print(f"❌ Failed to discover fields: {str(e)}")
        return None

if __name__ == "__main__":
    result = discover_jira_fields()
    
    if result:
        print(f"\n💾 Field Discovery Complete!")
        with open('jira_fields.json', 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Results saved to jira_fields.json")