#!/bin/bash
# HydroPulse Test Environment Setup Script

echo "🚀 Setting up HydroPulse Test Environment..."
echo "============================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if PostgreSQL is running
echo "🐘 Checking PostgreSQL connection..."
python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='localhost',
        port='5432', 
        database='postgres',
        user='postgres',
        password='postgres'
    )
    print('✅ PostgreSQL connection successful')
    conn.close()
except Exception as e:
    print(f'❌ PostgreSQL connection failed: {e}')
    print('Please ensure PostgreSQL is running and accessible')
"

# Create database if it doesn't exist
echo "🗄️ Setting up database..."
python3 -c "
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host='localhost',
        port='5432',
        database='postgres', 
        user='postgres',
        password='postgres'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute('SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s', ('aurex_hydropulse',))
    exists = cursor.fetchone()
    
    if not exists:
        print('Creating aurex_hydropulse database...')
        cursor.execute('CREATE DATABASE aurex_hydropulse')
        print('✅ Database created successfully')
    else:
        print('✅ Database already exists')
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'❌ Database setup failed: {e}')
    print('Please ensure PostgreSQL is running with user: postgres, password: postgres')
"

# Initialize database with test data
echo "📋 Initializing database with test users and roles..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aurex_hydropulse"
python3 -c "
import sys
import os
sys.path.append('app')
from app.core.init_db import init_database
init_database()
"

echo ""
echo "🎉 Test environment setup complete!"
echo ""
echo "🚀 To start the API server:"
echo "   source venv/bin/activate"
echo "   cd app && python main.py"
echo ""
echo "🧪 To run user tests:"
echo "   source venv/bin/activate"  
echo "   python test_users.py"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:8002/api/docs"
echo ""
echo "🔑 Test Users (password: password123):"
echo "   • admin@aurigraph.io - Super Admin"
echo "   • ceo@aurigraph.io - Business Owner"
echo "   • pm.maharashtra@aurigraph.io - Project Manager"
echo "   • field.pune@aurigraph.io - Field Coordinator"
echo "   • analyst.carbon@aurigraph.io - Data Analyst"
echo "   • viewer.investor@aurigraph.io - Viewer"