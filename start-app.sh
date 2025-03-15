#!/bin/bash

# Start the Project Tracker Electron application
echo "Starting Project Tracker..."
# Run in production mode with output redirected to dev/null to avoid console logs
NODE_ENV=production npm start > /dev/null 2>&1
