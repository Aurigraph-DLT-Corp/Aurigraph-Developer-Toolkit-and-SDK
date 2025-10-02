#!/bin/bash

# Fix FastAPI FieldInfo issues in router files
echo "🔧 Fixing FastAPI FieldInfo compatibility issues..."

ROUTER_DIR="/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/02_Applications/02_aurex-launchpad/backend/routers"

# List of files to fix
files=(
    "scope3_calculator.py"
    "eu_taxonomy_esrs.py"
    "ghg_readiness_evaluator.py"
    "sustainability.py"
    "emissions.py"
)

for file in "${files[@]}"; do
    filepath="$ROUTER_DIR/$file"
    echo "Fixing $file..."
    
    # Add Path to imports if not present
    if ! grep -q "from fastapi import.*Path" "$filepath"; then
        sed -i '' 's/from fastapi import \([^P]*\)BackgroundTasks/from fastapi import \1Path, BackgroundTasks/' "$filepath"
        sed -i '' 's/from fastapi import \([^P]*\)$/from fastapi import \1, Path/' "$filepath"
    fi
    
    # Fix Field(..., ge=..., le=...) to Path(..., ge=..., le=...) for path parameters
    # This pattern looks for function parameters that use Field with ge/le constraints
    sed -i '' 's/: int = Field(\.\.\., ge=\([0-9]*\), le=\([0-9]*\))/: int = Path(..., ge=\1, le=\2)/g' "$filepath"
    sed -i '' 's/: str = Field(\.\.\., min_length=\([0-9]*\), max_length=\([0-9]*\))/: str = Path(..., min_length=\1, max_length=\2)/g' "$filepath"
    
    echo "✅ Fixed $file"
done

echo "🎉 All FastAPI FieldInfo issues fixed!"