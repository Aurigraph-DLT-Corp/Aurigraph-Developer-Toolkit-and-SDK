#!/bin/bash

# Aurigraph FastAPI Quick Start Script
echo "Starting Aurigraph FastAPI Backend..."

# Navigate to FastAPI directory
cd "$(dirname "$0")/aurigraph-fastapi"

# Check Python version
python3 --version

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
if [ "$1" == "install" ] || [ ! -f "venv/installed.flag" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed.flag
fi

# Start based on mode
if [ "$1" == "dev" ]; then
    echo "Starting in development mode with auto-reload..."
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
elif [ "$1" == "prod" ]; then
    echo "Starting in production mode..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
elif [ "$1" == "test" ]; then
    echo "Running FastAPI tests..."
    python3 -m pytest tests/ -v --tb=short
else
    echo "Starting in default mode..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
