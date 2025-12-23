#!/bin/bash

# Aurigraph Vizro Dashboard Startup Script

set -e

echo "🚀 Starting Aurigraph Vizro Dashboard..."

# Check if virtual environment exists
if [ ! -d "venv-vizro" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv-vizro
fi

# Activate virtual environment
source venv-vizro/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r vizro-requirements.txt

# Run the dashboard
echo "✅ Starting Vizro dashboard on http://localhost:8050"
python aurigraph_vizro_dashboard.py
