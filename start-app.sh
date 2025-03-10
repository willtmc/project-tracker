#!/bin/bash

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Error: .env file not found!"
  echo "Please create a .env file from the .env.template file."
  echo "cp .env.template .env"
  exit 1
fi

# Start the Project Tracker Electron application
cd "$(dirname "$0")"
echo "Starting Project Tracker..."
npm start
