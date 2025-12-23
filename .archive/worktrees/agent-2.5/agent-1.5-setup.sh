#!/bin/bash

AGENT_NUM="$1"
AGENT_NAME="$2"
WORKTREE_PATH="$3"
AGENT_DIR="$WORKTREE_PATH/enterprise-portal/enterprise-portal/frontend"

echo "🚀 Setting up Agent $AGENT_NUM: $AGENT_NAME"
echo ""

cd "$AGENT_DIR"

echo "✓ Current directory: $(pwd)"
echo "✓ Branch: $(git branch | grep '*')"
echo ""

echo "📦 Dependencies Status:"
if [ -d "node_modules" ]; then
    echo "✓ Dependencies already installed"
else
    echo "📥 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Agent setup complete!"
echo ""
echo "Start development:"
echo "  npm run dev"
echo ""
echo "Build for production:"
echo "  npm run build"
echo ""
echo "Run tests:"
echo "  npm test"
echo ""
echo "Commit when ready:"
echo "  git add ."
echo "  git commit -m 'feat: description'"
echo "  git push origin $(git branch | grep '*' | sed 's/* //')"
echo ""
