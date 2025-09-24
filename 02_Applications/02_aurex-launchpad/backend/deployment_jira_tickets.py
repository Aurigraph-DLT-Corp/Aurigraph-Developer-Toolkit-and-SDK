#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ DEPLOYMENT JIRA TICKETS
# Create deployment tickets following VIBE coding standards
# Agent: DevOps Orchestration Agent
# ================================================================================

import os
from jira import JIRA
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_deployment_tickets():
    """Create deployment tickets following VIBE standards - create tickets first, then deploy"""
    
    # Initialize JIRA client
    server_url = os.getenv('JIRA_SERVER_URL', 'https://aurigraphdlt.atlassian.net')
    username = os.getenv('JIRA_USERNAME', 'yogesh@aurigraph.io')
    api_token = os.getenv('JIRA_API_TOKEN')
    project_key = 'ARX'
    sprint_id = 129  # 4augustwork sprint
    
    try:
        jira = JIRA(
            server=server_url,
            basic_auth=(username, api_token)
        )
        logger.info(f"✅ Connected to JIRA: {server_url}")
        
        # Define deployment stories following VIBE framework
        deployment_stories = [
            {
                "summary": "LP-009: Local Development Environment Setup - Docker, Database, Environment Configuration",
                "description": """
## Epic: Local Development Deployment
### Status: PENDING ⏳
### Story Points: 13
### VIBE Framework: Velocity-focused local setup with integrity checks

### Implementation Scope:
- **Docker Configuration**: Create docker-compose.yml for local development
- **Database Setup**: PostgreSQL container with initial schema
- **Environment Configuration**: .env files and configuration management
- **Service Dependencies**: Redis, OpenAI API, external service configurations
- **Development Tools**: Hot reload, debugging, logging configuration

### Technical Requirements:
- 🐳 **Docker Compose**: Multi-service container orchestration
- 🗄️ **PostgreSQL**: Database with connection pooling
- 🔧 **Environment Variables**: Secure configuration management
- 📝 **Logging**: Structured logging with log levels
- 🔄 **Hot Reload**: FastAPI development server with auto-reload
- 🧪 **Testing Environment**: Isolated test database and services

### Deliverables:
- `docker-compose.yml` - Local development services
- `docker-compose.override.yml` - Development-specific overrides
- `.env.example` - Environment template
- `scripts/local-setup.sh` - Automated local setup script
- `README.md` - Local development documentation

### Agent: DevOps Orchestration Agent
### VIBE Principle: Velocity in local setup, Integrity in configuration
### Estimated Effort: 1.5 days
                """.strip(),
                "story_points": 13,
                "original_estimate": "1d 4h",
                "remaining_estimate": "1d 4h",
                "status": "To Do",
                "epic": "Local Development Deployment"
            },
            {
                "summary": "LP-010: FastAPI Application Structure - Main App, Routers, Middleware, Database Integration",
                "description": """
## Epic: FastAPI Application Deployment
### Status: PENDING ⏳
### Story Points: 21
### VIBE Framework: Balance of comprehensive API structure with rapid deployment

### Implementation Scope:
- **FastAPI Main Application**: Application factory pattern with dependency injection
- **Router Organization**: Modular routing for auth, assessments, documents, analytics
- **Middleware Configuration**: CORS, security headers, request logging, error handling
- **Database Integration**: SQLAlchemy session management and connection pooling
- **API Documentation**: OpenAPI/Swagger documentation with examples

### Technical Requirements:
- 🚀 **FastAPI Framework**: Async web framework with automatic OpenAPI generation
- 🗄️ **SQLAlchemy Integration**: Database ORM with async support
- 🔐 **JWT Authentication**: Secure API authentication middleware
- 📚 **API Documentation**: Auto-generated OpenAPI docs with examples
- 🛡️ **Security Middleware**: CORS, rate limiting, security headers
- 📊 **Request Logging**: Structured API request/response logging

### API Endpoints:
- 🔐 **Authentication**: `/api/v1/auth/*` - Login, register, token management
- 📊 **Assessments**: `/api/v1/assessments/*` - ESG assessment CRUD operations
- 📄 **Documents**: `/api/v1/documents/*` - Document upload and processing
- 📈 **Analytics**: `/api/v1/analytics/*` - Reporting and dashboard data
- 👥 **Organizations**: `/api/v1/organizations/*` - Multi-tenant management
- ⚙️ **Admin**: `/api/v1/admin/*` - Administrative operations

### Deliverables:
- `main.py` - FastAPI application factory
- `routers/` - Modular API routers
- `middleware/` - Custom middleware components
- `dependencies.py` - Dependency injection utilities
- API documentation and examples

### Agent: API Development Agent + DevOps Orchestration Agent
### VIBE Principle: Excellence in API design with velocity in implementation
### Estimated Effort: 2.5 days
                """.strip(),
                "story_points": 21,
                "original_estimate": "2d 4h",
                "remaining_estimate": "2d 4h",
                "status": "To Do",
                "epic": "FastAPI Application Deployment"
            },
            {
                "summary": "LP-011: Database Migration and Schema Setup - Alembic, Initial Data, Seed Scripts",
                "description": """
## Epic: Database Deployment
### Status: PENDING ⏳
### Story Points: 8
### VIBE Framework: Integrity-focused database setup with automated migrations

### Implementation Scope:
- **Alembic Configuration**: Database migration management
- **Schema Creation**: All model tables with proper indexes and constraints
- **Initial Data Seeding**: Default ESG frameworks, user roles, system data
- **Migration Scripts**: Version-controlled database changes
- **Database Utilities**: Backup, restore, and maintenance scripts

### Technical Requirements:
- 🗄️ **Alembic Migrations**: Version-controlled database schema changes
- 📊 **Schema Creation**: All models properly mapped to database tables
- 🌱 **Data Seeding**: Initial ESG frameworks (GRI, SASB, TCFD, CDP, ISO14064)
- 🔍 **Indexes**: Optimized database indexes for performance
- 🔒 **Constraints**: Foreign key constraints and data validation
- 📈 **Performance**: Query optimization and connection pooling

### Database Components:
- **Authentication Tables**: Users, organizations, roles, permissions
- **ESG Assessment Tables**: Frameworks, sections, questions, responses
- **Document Tables**: Document metadata, processing status, extracted data
- **Audit Tables**: Comprehensive audit logging and security events
- **Analytics Tables**: Aggregated data for reporting and dashboards

### Deliverables:
- `alembic/` - Migration configuration and scripts
- `migrations/` - Version-controlled schema changes
- `seeds/` - Initial data seeding scripts
- `scripts/db-setup.sh` - Database initialization script
- Database documentation and ERD

### Agent: Database Specialist Agent + DevOps Orchestration Agent
### VIBE Principle: Integrity in data structure with velocity in deployment
### Estimated Effort: 1 day
                """.strip(),
                "story_points": 8,
                "original_estimate": "1d",
                "remaining_estimate": "1d",
                "status": "To Do",
                "epic": "Database Deployment"
            },
            {
                "summary": "LP-012: Production Server Deployment - Dev Server Setup, SSL, Nginx, Security",
                "description": """
## Epic: Production Server Deployment
### Status: PENDING ⏳
### Story Points: 18
### VIBE Framework: Excellence in production deployment with comprehensive security

### Implementation Scope:
- **Server Configuration**: dev.aurigraph.io production environment setup
- **SSL/TLS Setup**: HTTPS certificates and security configuration
- **Nginx Configuration**: Reverse proxy, load balancing, static file serving
- **Process Management**: Systemd services, auto-restart, monitoring
- **Security Hardening**: Firewall, fail2ban, security headers, rate limiting

### Production Environment:
- **Server**: dev.aurigraph.io:2224 (SSH access)
- **Web Access**: HTTP (80) and HTTPS (443)
- **Database**: PostgreSQL with production configuration
- **File Storage**: Secure document storage with proper permissions
- **Logging**: Centralized logging with log rotation

### Technical Requirements:
- 🌐 **Nginx**: Reverse proxy with SSL termination
- 🔒 **SSL/TLS**: Let's Encrypt certificates with auto-renewal
- 🛡️ **Security**: Firewall rules, fail2ban, security headers
- 📊 **Monitoring**: Health checks, performance monitoring, alerting
- 🔄 **Process Management**: Systemd services with auto-restart
- 📝 **Logging**: Centralized logging with proper rotation

### Security Measures:
- 🔐 **HTTPS Only**: Force SSL redirect and HSTS headers
- 🛡️ **Firewall**: UFW configuration with minimal open ports
- 🚫 **Rate Limiting**: API rate limiting and DDoS protection
- 🔍 **Monitoring**: Failed login attempts and security events
- 📊 **Health Checks**: Application and database health monitoring
- 🔄 **Backup**: Automated database and file backups

### Deliverables:
- `nginx/` - Nginx configuration files
- `systemd/` - Service configuration files
- `scripts/deploy.sh` - Deployment automation script
- `scripts/health-check.sh` - Health monitoring script
- Production deployment documentation

### Agent: DevOps Orchestration Agent + Security Intelligence Agent
### VIBE Principle: Excellence in security with balance of performance
### Estimated Effort: 2 days
                """.strip(),
                "story_points": 18,
                "original_estimate": "2d",
                "remaining_estimate": "2d",
                "status": "To Do",
                "epic": "Production Server Deployment"
            },
            {
                "summary": "LP-013: Environment Configuration and Secrets Management - Environment Variables, API Keys, Security",
                "description": """
## Epic: Environment Configuration
### Status: PENDING ⏳
### Story Points: 5
### VIBE Framework: Integrity-focused security configuration with velocity in setup

### Implementation Scope:
- **Environment Variables**: Secure configuration for all environments
- **Secrets Management**: API keys, database credentials, JWT secrets
- **Configuration Validation**: Environment validation and error handling
- **Security Best Practices**: Secret rotation, access control, encryption
- **Documentation**: Configuration guide and security procedures

### Configuration Components:
- **Database Configuration**: Connection strings, pool settings, credentials
- **API Keys**: OpenAI, external service integrations, webhook secrets
- **JWT Configuration**: Secret keys, token expiration, refresh policies
- **File Storage**: Upload paths, size limits, security settings
- **Logging Configuration**: Log levels, output formats, destinations
- **Feature Flags**: Environment-specific feature toggles

### Security Requirements:
- 🔐 **Secret Management**: Encrypted storage of sensitive configuration
- 🔄 **Secret Rotation**: Automated rotation of API keys and tokens
- 🛡️ **Access Control**: Principle of least privilege for configuration access
- 📊 **Audit Logging**: Configuration changes and access logging
- 🚫 **No Hardcoded Secrets**: All secrets externalized from code
- ✅ **Validation**: Configuration validation at startup

### Deliverables:
- `.env.example` - Environment template with documentation
- `config/` - Configuration management utilities
- `scripts/setup-secrets.sh` - Secret management script
- Configuration validation and error handling
- Security configuration documentation

### Agent: Security Intelligence Agent + DevOps Orchestration Agent
### VIBE Principle: Integrity in security with velocity in configuration
### Estimated Effort: 0.5 days
                """.strip(),
                "story_points": 5,
                "original_estimate": "4h",
                "remaining_estimate": "4h",
                "status": "To Do",
                "epic": "Environment Configuration"
            },
            {
                "summary": "LP-014: Deployment Testing and Health Checks - Integration Testing, Monitoring, Alerts",
                "description": """
## Epic: Deployment Testing and Monitoring
### Status: PENDING ⏳
### Story Points: 8
### VIBE Framework: Excellence in testing with comprehensive monitoring

### Implementation Scope:
- **Integration Testing**: End-to-end deployment testing
- **Health Check Endpoints**: Application and database health monitoring
- **Performance Testing**: Load testing and performance validation
- **Monitoring Setup**: Application performance monitoring and alerting
- **Deployment Validation**: Automated deployment verification

### Testing Components:
- 🧪 **Integration Tests**: Full application stack testing
- 🔍 **Health Checks**: `/health` endpoint with detailed status
- 📊 **Performance Tests**: API response time and throughput testing
- 🚨 **Alerting**: Email/SMS alerts for critical issues
- 📈 **Metrics**: Application metrics collection and visualization
- 🔄 **Automated Testing**: Post-deployment test suite execution

### Health Check Coverage:
- **Database Connectivity**: PostgreSQL connection and query testing
- **External Services**: OpenAI API, email service, file storage
- **Application Services**: All API endpoints and core functionality
- **Security Services**: Authentication, authorization, audit logging
- **Performance Metrics**: Response time, memory usage, CPU utilization
- **Data Integrity**: Database consistency and backup verification

### Monitoring and Alerting:
- 📊 **Application Metrics**: Response time, error rates, throughput
- 🗄️ **Database Metrics**: Connection pool, query performance, disk usage
- 🔒 **Security Metrics**: Failed logins, suspicious activity, rate limiting
- 📈 **Business Metrics**: Assessment completions, document processing, user activity
- 🚨 **Alert Thresholds**: Critical, warning, and info level alerts
- 📱 **Notification Channels**: Email, SMS, Slack integration

### Deliverables:
- `tests/integration/` - End-to-end integration tests
- `monitoring/` - Health check and monitoring configuration
- `scripts/performance-test.sh` - Performance testing script
- `alerts/` - Alerting configuration and templates
- Deployment testing documentation

### Agent: Quality Assurance Agent + DevOps Orchestration Agent
### VIBE Principle: Excellence in testing with comprehensive monitoring
### Estimated Effort: 1 day
                """.strip(),
                "story_points": 8,
                "original_estimate": "1d",
                "remaining_estimate": "1d",
                "status": "To Do",
                "epic": "Deployment Testing and Monitoring"
            }
        ]
        
        created_issues = []
        
        for story_data in deployment_stories:
            try:
                # Create story with time tracking
                story_fields = {
                    'project': {'key': project_key},
                    'summary': story_data["summary"],
                    'description': story_data["description"],
                    'issuetype': {'name': 'Story'},
                    'timetracking': {
                        'originalEstimate': story_data["original_estimate"],
                        'remainingEstimate': story_data["remaining_estimate"]
                    }
                }
                
                # Create the story
                story = jira.create_issue(fields=story_fields)
                
                # Add to sprint
                jira.add_issues_to_sprint(sprint_id, [story.key])
                logger.info(f"✅ Added {story.key} to sprint {sprint_id}")
                
                created_issues.append({
                    'key': story.key,
                    'summary': story_data['summary'],
                    'status': story_data['status'],
                    'points': story_data['story_points'],
                    'epic': story_data['epic']
                })
                
                logger.info(f"✅ Created deployment story: {story.key} - {story_data['epic']} ({story_data['story_points']} pts)")
                
            except Exception as e:
                logger.error(f"❌ Failed to create deployment story '{story_data['epic']}': {str(e)}")
                continue
        
        # Summary
        total_points = sum(story["story_points"] for story in deployment_stories)
        
        print(f"\n" + "="*80)
        print(f"🎯 AUREX LAUNCHPAD DEPLOYMENT TICKETS - VIBE COMPLIANT!")
        print(f"="*80)
        print(f"📊 Sprint: 4augustwork (ID: {sprint_id})")
        print(f"📝 Project: Aurex (ARX)")  
        print(f"🗓️ Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"")
        print(f"📋 DEPLOYMENT JIRA TICKETS CREATED:")
        print(f"-" * 80)
        
        for issue in created_issues:
            print(f"⏳ {issue['key']}: {issue['points']} pts - {issue['status']}")
            print(f"   📁 {issue['epic']}")
            print()
        
        print(f"🎯 DEPLOYMENT SUMMARY:")
        print(f"-" * 40)
        print(f"Total Deployment Stories: {len(created_issues)}")
        print(f"Total Story Points: {total_points}")
        print(f"⏳ All Pending: {total_points} pts (Ready for execution)")
        print()
        print(f"🔄 VIBE FRAMEWORK COMPLIANCE:")
        print(f"✅ Velocity: Optimized deployment process")
        print(f"✅ Integrity: Comprehensive testing and validation")
        print(f"✅ Balance: Local and production deployment")
        print(f"✅ Excellence: Enterprise-grade security and monitoring")
        print()
        print(f"📋 NEXT STEPS:")
        print(f"1. Execute LP-009: Local Development Environment Setup")
        print(f"2. Execute LP-010: FastAPI Application Structure")
        print(f"3. Execute LP-011: Database Migration and Schema Setup")
        print(f"4. Execute LP-012: Production Server Deployment")
        print(f"5. Execute LP-013: Environment Configuration")
        print(f"6. Execute LP-014: Deployment Testing and Health Checks")
        print()
        print(f"🎉 DEPLOYMENT TICKETS CREATED - READY TO EXECUTE!")
        print(f"="*80)
        
        return {
            'sprint_id': sprint_id,
            'created_issues': created_issues,
            'total_story_points': total_points,
            'deployment_ready': True
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create deployment tickets: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Creating Aurex Launchpad Deployment Tickets...")
    print("📊 Following VIBE Framework: Create tickets first, then deploy!")
    print()
    
    # Check for required environment variables
    required_vars = ['JIRA_SERVER_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        exit(1)
    
    try:
        result = create_deployment_tickets()
        
    except Exception as e:
        print(f"❌ Deployment ticket creation failed: {str(e)}")
        exit(1)