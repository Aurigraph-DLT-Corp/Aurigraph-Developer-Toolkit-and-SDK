#!/usr/bin/env python3
"""
Aurigraph AV10-7 FastAPI Platform Startup Script
"""

import sys
import os
import subprocess
import asyncio

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import websockets
        import pydantic
        import httpx
        print("✅ All dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies: pip install -r requirements.txt")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Aurigraph AV10-7 FastAPI Platform...")
    print("=" * 60)
    
    if not check_dependencies():
        sys.exit(1)
    
    print("📊 Platform Features:")
    print("   • FastAPI with async support")
    print("   • WebSocket real-time updates") 
    print("   • AV10-24 Advanced Compliance Framework")
    print("   • AV10-32 Optimal Node Density Manager")
    print("   • AV10-34 High-Performance Integration Engine")
    print("   • Pydantic data validation")
    print("   • Auto-generated OpenAPI docs")
    print()
    
    print("🌐 Access Points:")
    print("   • Dashboard: http://localhost:3100")
    print("   • API Docs: http://localhost:3100/docs")
    print("   • WebSocket: ws://localhost:3100/ws")
    print("   • Health Check: http://localhost:3100/health")
    print()
    
    print("⚡ Starting Uvicorn server...")
    print("=" * 60)
    
    # Change to app directory and start the server
    app_dir = os.path.join(os.path.dirname(__file__), 'app')
    os.chdir(app_dir)
    
    # Start the FastAPI server
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=3100,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Shutting down FastAPI platform...")
        print("✅ Platform stopped")
    except Exception as e:
        print(f"❌ Error starting platform: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()