#!/bin/bash
# run-daily-report.sh - Run the daily project report generator

# Directory where the scripts are located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Check if preview mode is requested
if [[ "$1" == "--preview" ]]; then
    # Run in preview mode (don't save to database)
    python3 "${SCRIPT_DIR}/project-tracker.py" --daily-report --email --preview
else
    # Run normally
    python3 "${SCRIPT_DIR}/project-tracker.py" --daily-report --email
    
    # Open the reports directory to view the latest report
    open "${SCRIPT_DIR}/WTM Project Reports/Daily"
fi

echo "Daily report generation completed"
