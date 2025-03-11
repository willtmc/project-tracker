#!/bin/bash

# Test script for the refactored Project Tracker application
# This script helps verify that the refactored modular structure works correctly

echo "Starting refactored Project Tracker application test..."

# Kill any existing Electron processes
pkill -f electron || true

# Clear terminal
clear

echo "=== Testing Refactored Project Tracker Application ==="
echo "This script will help verify that the modular structure works correctly."
echo ""

# Verify module files exist
echo "Checking for module files..."
MODULES_DIR="./src/renderer/modules"
CORE_MODULES=("projectData.js" "uiManager.js" "tabManager.js" "reviewManager.js" "reportManager.js" "utils.js")
EVENT_MODULES=("events/index.js" "events/projectEvents.js" "events/keyboardShortcuts.js")

MISSING_FILES=false

# Check core modules
for module in "${CORE_MODULES[@]}"; do
  if [ ! -f "$MODULES_DIR/$module" ]; then
    echo "❌ Missing core module: $module"
    MISSING_FILES=true
  else
    echo "✅ Found core module: $module"
  fi
done

# Check event modules
for module in "${EVENT_MODULES[@]}"; do
  if [ ! -f "$MODULES_DIR/$module" ]; then
    echo "❌ Missing event module: $module"
    MISSING_FILES=true
  else
    echo "✅ Found event module: $module"
  fi
done

# Check main renderer file
if [ ! -f "./src/renderer/renderer-new.js" ]; then
  echo "❌ Missing main renderer file: renderer-new.js"
  MISSING_FILES=true
else
  echo "✅ Found main renderer file: renderer-new.js"
  
  # Check if index.html references renderer-new.js
  if grep -q "renderer-new.js" "./src/renderer/index.html"; then
    echo "✅ index.html correctly references renderer-new.js"
  else
    echo "❌ index.html does not reference renderer-new.js"
    MISSING_FILES=true
  fi
fi

if [ "$MISSING_FILES" = true ]; then
  echo ""
  echo "⚠️ Some required files are missing. Please check the output above."
  exit 1
fi

echo ""
echo "All required files are present. Starting the application..."
echo ""

# Start the application
npm start
