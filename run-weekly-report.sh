#!/bin/bash
# run-weekly-report.sh - Run the weekly project report generator

# Directory where the scripts are located
SCRIPT_DIR="$(dirname "$(realpath "$0")")"

# Email address to send reports to
EMAIL="will@mclemoreauction.com"

# Run the Python script with the save and email options
python3 "${SCRIPT_DIR}/project-tracker.py" --save --email "${EMAIL}" --weekly

# Open the reports directory to view the latest report
open "${SCRIPT_DIR}/WTM Project Reports"

echo "Weekly report generation completed"
