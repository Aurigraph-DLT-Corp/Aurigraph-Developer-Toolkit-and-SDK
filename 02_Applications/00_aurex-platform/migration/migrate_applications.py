"""
Migration Script for Existing Applications
Migrates all applications to use centralized platform services
"""
import os
import sys
import asyncio
from pathlib import Path
import json
import shutil
from typing import Dict, List

class ApplicationMigrator:
    """Migrate existing applications to centralized platform"""
    
    def __init__(self):
        self.base_path = Path("/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform")
        self.applications = [
            "03_Applications/01_aurex-main",
            "03_Applications/02_aurex-launchpad",
            "03_Applications/03_aurex-hydropulse",
            "03_Applications/04_aurex-sylvagraph",
            "03_Applications/05_aurex-carbontrace"
        ]
        self.migration_report = []
    
    async def migrate_authentication(self, app_path: str):
        """Migrate app to use centralized authentication"""
        print(f"🔐 Migrating authentication for {app_path}")
        
        # Update backend main.py to use centralized auth
        backend_main = Path(self.base_path) / app_path / "backend/main.py"
        if backend_main.exists():
            content = backend_main.read_text()
            
            # Replace local auth imports with centralized
            new_content = content.replace(
                'from auth import',
                'from aurex_platform.core.auth import'
            )
            
            # Add platform import
            if "from aurex_platform" not in new_content:
                new_content = "from aurex_platform.core.auth import get_current_user, AuthService\n" + new_content
            
            backend_main.write_text(new_content)
            self.migration_report.append(f"✅ Auth migrated: {app_path}")
    
    async def migrate_database(self, app_path: str):
        """Migrate app to use centralized database layer"""
        print(f"🗄️ Migrating database for {app_path}")
        
        backend_path = Path(self.base_path) / app_path / "backend"
        
        # Create new db config using centralized layer
        db_config = """
from aurex_platform.core.database import db_manager

# Use centralized database management
async def get_db():
    async for session in db_manager.get_session():
        yield session
"""
        
        db_file = backend_path / "database.py"
        db_file.write_text(db_config)
        self.migration_report.append(f"✅ Database migrated: {app_path}")
    
    async def migrate_logging(self, app_path: str):
        """Migrate app to use centralized logging"""
        print(f"📝 Migrating logging for {app_path}")
        
        backend_main = Path(self.base_path) / app_path / "backend/main.py"
        if backend_main.exists():
            content = backend_main.read_text()
            
            # Add centralized logging import
            if "from aurex_platform.core.logging" not in content:
                content = "from aurex_platform.core.logging import get_logger\nlogger = get_logger(__name__)\n" + content
            
            backend_main.write_text(content)
            self.migration_report.append(f"✅ Logging migrated: {app_path}")
    
    async def migrate_audit(self, app_path: str):
        """Add audit trail integration"""
        print(f"📊 Adding audit trail for {app_path}")
        
        # Create audit integration module
        audit_integration = """
from aurex_platform.core.audit import audit_logger

async def log_user_action(user_id: str, action: str, resource: dict):
    await audit_logger.log_event(
        user_id=user_id,
        action=action,
        resource_type=resource.get("type"),
        resource_id=resource.get("id"),
        metadata=resource
    )
"""
        
        backend_path = Path(self.base_path) / app_path / "backend"
        audit_file = backend_path / "audit_integration.py"
        audit_file.write_text(audit_integration)
        self.migration_report.append(f"✅ Audit trail added: {app_path}")
    
    async def update_docker_compose(self, app_path: str):
        """Update docker-compose to use shared network"""
        print(f"🐳 Updating Docker config for {app_path}")
        
        docker_file = Path(self.base_path) / app_path / "docker-compose.yml"
        if docker_file.exists():
            content = docker_file.read_text()
            
            # Add external network
            if "aurex_network" not in content:
                content += """
networks:
  default:
    external:
      name: aurex_network
"""
            docker_file.write_text(content)
            self.migration_report.append(f"✅ Docker config updated: {app_path}")
    
    async def update_environment_vars(self, app_path: str):
        """Update environment variables to use platform services"""
        print(f"🔧 Updating environment variables for {app_path}")
        
        env_template = """
# Platform Services
PLATFORM_URL=http://aurex-platform:8000
AUTH_SERVICE_URL=http://aurex-platform:8000/api/v1/auth
DATABASE_URL=postgresql+asyncpg://aurex:password@postgres:5432/aurex_platform
REDIS_URL=redis://:password@redis:6379
JAEGER_HOST=jaeger
JAEGER_PORT=6831
"""
        
        env_file = Path(self.base_path) / app_path / ".env.platform"
        env_file.write_text(env_template)
        self.migration_report.append(f"✅ Environment vars updated: {app_path}")
    
    async def migrate_application(self, app_path: str):
        """Complete migration for one application"""
        print(f"\n🚀 Starting migration for {app_path}")
        
        try:
            await self.migrate_authentication(app_path)
            await self.migrate_database(app_path)
            await self.migrate_logging(app_path)
            await self.migrate_audit(app_path)
            await self.update_docker_compose(app_path)
            await self.update_environment_vars(app_path)
            
            print(f"✅ Successfully migrated {app_path}\n")
            return True
        except Exception as e:
            print(f"❌ Error migrating {app_path}: {e}\n")
            self.migration_report.append(f"❌ Failed: {app_path} - {e}")
            return False
    
    async def run_migration(self):
        """Run migration for all applications"""
        print("=" * 60)
        print("🎯 AUREX PLATFORM MIGRATION TOOL")
        print("=" * 60)
        
        successful = 0
        failed = 0
        
        for app in self.applications:
            if await self.migrate_application(app):
                successful += 1
            else:
                failed += 1
        
        # Generate migration report
        print("\n" + "=" * 60)
        print("📋 MIGRATION REPORT")
        print("=" * 60)
        
        for item in self.migration_report:
            print(item)
        
        print(f"\n✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        
        # Save report to file
        report_file = Path(self.base_path) / "01_AurexApp/01_00_AurexPlatform/MIGRATION_REPORT.md"
        report_content = f"""# Migration Report

## Summary
- Total Applications: {len(self.applications)}
- Successfully Migrated: {successful}
- Failed: {failed}
- Date: {asyncio.get_event_loop().time()}

## Details
{"".join(f"- {item}\n" for item in self.migration_report)}

## Next Steps
1. Review and test each migrated application
2. Update frontend components to use new auth endpoints
3. Run integration tests
4. Deploy to staging environment
"""
        report_file.write_text(report_content)
        print(f"\n📄 Report saved to: {report_file}")

async def main():
    migrator = ApplicationMigrator()
    await migrator.run_migration()

if __name__ == "__main__":
    asyncio.run(main())