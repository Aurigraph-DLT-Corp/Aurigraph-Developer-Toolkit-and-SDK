#!/bin/bash

# Ngrok Authentication Setup
# ===========================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "🔐 Ngrok Authentication Setup for Aurigraph V10"
echo "==============================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ Ngrok is not installed${NC}"
    echo "Install with: brew install ngrok"
    exit 1
fi

echo -e "${GREEN}✅ Ngrok is installed${NC}"
echo ""

# Check if already authenticated
if ngrok config check 2>/dev/null | grep -q "Valid"; then
    echo -e "${GREEN}✅ Ngrok is already authenticated!${NC}"
    echo ""
    echo "You can now run:"
    echo -e "${BLUE}./setup-ngrok.sh start${NC}"
    exit 0
fi

echo -e "${YELLOW}⚠️  Ngrok requires authentication (free account)${NC}"
echo ""
echo "Steps to authenticate:"
echo ""
echo "1. ${BLUE}Sign up for free account:${NC}"
echo "   https://dashboard.ngrok.com/signup"
echo ""
echo "2. ${BLUE}Get your authtoken from:${NC}"
echo "   https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""
echo "3. ${BLUE}Run this command with your token:${NC}"
echo "   ngrok config add-authtoken YOUR_AUTH_TOKEN"
echo ""
echo "----------------------------------------"
echo ""

# Interactive setup
read -p "Do you have an ngrok authtoken? (y/n): " has_token

if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
    echo ""
    echo "Please enter your ngrok authtoken:"
    echo "(You can find it at: https://dashboard.ngrok.com/get-started/your-authtoken)"
    echo ""
    read -p "Authtoken: " authtoken
    
    if [ -n "$authtoken" ]; then
        echo ""
        echo "Adding authtoken..."
        ngrok config add-authtoken "$authtoken"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Authentication successful!${NC}"
            echo ""
            echo "You can now run:"
            echo -e "${BLUE}./setup-ngrok.sh start${NC}"
            echo ""
            echo "This will create a public URL for your Aurigraph deployment."
        else
            echo -e "${RED}❌ Failed to add authtoken${NC}"
            echo "Please check the token and try again."
        fi
    else
        echo -e "${RED}No token provided${NC}"
    fi
else
    echo ""
    echo "To get your free authtoken:"
    echo ""
    echo "1. Open in browser:"
    echo -e "${BLUE}https://dashboard.ngrok.com/signup${NC}"
    echo ""
    echo "2. Sign up with GitHub, Google, or Email"
    echo ""
    echo "3. Copy your authtoken from:"
    echo -e "${BLUE}https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
    echo ""
    echo "4. Run this script again and enter your token"
    echo ""
    echo "Or manually add it with:"
    echo -e "${PURPLE}ngrok config add-authtoken YOUR_TOKEN${NC}"
    
    # Try to open the signup page
    echo ""
    read -p "Open ngrok signup page in browser? (y/n): " open_browser
    
    if [ "$open_browser" = "y" ] || [ "$open_browser" = "Y" ]; then
        open https://dashboard.ngrok.com/signup 2>/dev/null || \
        xdg-open https://dashboard.ngrok.com/signup 2>/dev/null || \
        echo "Please open: https://dashboard.ngrok.com/signup"
    fi
fi

echo ""
echo "----------------------------------------"
echo "After authentication, your public deployment will be available at:"
echo "https://[random-id].ngrok-free.app"
echo ""
echo "The URL will be shown when you run: ./setup-ngrok.sh start"