#!/bin/bash
# install-wake-agent.sh - Install the wake agent for checking missed cron jobs

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLIST_FILE="$SCRIPT_DIR/com.willmclemore.projecttracker.wake.plist"
LAUNCHAGENTS_DIR="$HOME/Library/LaunchAgents"

echo "Installing wake agent for WTM Project Tracker..."

# Ensure LaunchAgents directory exists
mkdir -p "$LAUNCHAGENTS_DIR"

# Copy the plist file to LaunchAgents directory
cp "$PLIST_FILE" "$LAUNCHAGENTS_DIR/"

# Unload the agent if it's already loaded
launchctl unload "$LAUNCHAGENTS_DIR/$(basename "$PLIST_FILE")" 2>/dev/null

# Load the agent
launchctl load "$LAUNCHAGENTS_DIR/$(basename "$PLIST_FILE")"

echo "Wake agent installed successfully!"
echo "The system will now check for missed cron jobs when your computer wakes up from sleep."
