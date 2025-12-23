#!/bin/bash
# Quick Start - Run Aurigraph Flutter Demo
# Simply runs the app on the first available device/simulator

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Aurigraph Flutter Demo - Quick Start${NC}"
echo ""

# Check Flutter
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}✗ Flutter not found. Please install Flutter first.${NC}"
    echo "Visit: https://docs.flutter.dev/get-started/install"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
flutter pub get

echo ""
echo -e "${GREEN}🔍 Available devices:${NC}"
flutter devices

echo ""
echo -e "${GREEN}▶️  Starting app...${NC}"
echo ""

# Run the app
flutter run

echo ""
echo -e "${GREEN}✓ App session ended${NC}"
