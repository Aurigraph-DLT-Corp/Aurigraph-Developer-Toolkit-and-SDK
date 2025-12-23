#!/bin/bash
# Aurigraph Flutter Demo Build Script
# Builds the mobile app for iOS and Android

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Aurigraph Flutter Demo Build        ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check Flutter installation
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}✗ Flutter not found${NC}"
    echo -e "${YELLOW}Please install Flutter from: https://docs.flutter.dev/get-started/install${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Flutter found:${NC} $(flutter --version | head -n 1)"
echo ""

# Show menu
echo "Select build target:"
echo "1. Run on simulator/emulator (dev mode)"
echo "2. Build Android APK (release)"
echo "3. Build Android AAB for Play Store (release)"
echo "4. Build iOS IPA (release)"
echo "5. Clean and rebuild"
echo "6. Install dependencies only"
echo "7. Run tests"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${BLUE}Available devices:${NC}"
        flutter devices
        echo ""
        echo -e "${GREEN}Starting app in dev mode...${NC}"
        flutter run
        ;;
    2)
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${GREEN}Building Android APK...${NC}"
        flutter build apk --release
        echo ""
        echo -e "${GREEN}✓ Build complete!${NC}"
        echo -e "${YELLOW}Output:${NC} build/app/outputs/flutter-apk/app-release.apk"
        ;;
    3)
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${GREEN}Building Android AAB...${NC}"
        flutter build appbundle --release
        echo ""
        echo -e "${GREEN}✓ Build complete!${NC}"
        echo -e "${YELLOW}Output:${NC} build/app/outputs/bundle/release/app-release.aab"
        ;;
    4)
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${GREEN}Building iOS IPA...${NC}"
        flutter build ios --release
        echo ""
        echo -e "${YELLOW}Note:${NC} Open Xcode to create archive and IPA"
        echo -e "${YELLOW}Command:${NC} open ios/Runner.xcworkspace"
        ;;
    5)
        echo -e "${YELLOW}Cleaning project...${NC}"
        flutter clean
        echo ""
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${GREEN}✓ Clean complete! Ready to build.${NC}"
        ;;
    6)
        echo -e "${BLUE}Installing dependencies...${NC}"
        flutter pub get
        echo ""
        echo -e "${GREEN}✓ Dependencies installed${NC}"
        ;;
    7)
        echo -e "${BLUE}Running tests...${NC}"
        cd ../../flutter
        flutter test
        echo ""
        echo -e "${GREEN}✓ Tests complete${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Build Process Complete ✓             ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
