#!/bin/bash
# setup-cron.sh - Set up cron jobs for WTM Project Tracker

echo "Setting up automated runs for WTM Project Tracker..."

# Get the script directory
SCRIPT_DIR="$(dirname "$(realpath "$0")")"

# Create a temporary file for the crontab
TEMP_CRONTAB="$(mktemp)"

# Export current crontab to the temporary file
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "# New crontab" > "$TEMP_CRONTAB"

# Check if the cron jobs already exist
if grep -q "run-daily-report.sh" "$TEMP_CRONTAB"; then
    echo "Daily report cron job already exists. Updating..."
    # Remove existing daily report job
    sed -i '' '/run-daily-report.sh/d' "$TEMP_CRONTAB"
fi

if grep -q "run-weekly-report.sh" "$TEMP_CRONTAB"; then
    echo "Weekly report cron job already exists. Updating..."
    # Remove existing weekly report job
    sed -i '' '/run-weekly-report.sh/d' "$TEMP_CRONTAB"
fi

# Add the new cron jobs
echo "# WTM Project Tracker - Daily report at 8pm every day" >> "$TEMP_CRONTAB"
echo "0 20 * * * \"$SCRIPT_DIR/run-daily-report.sh\" > /dev/null 2>&1" >> "$TEMP_CRONTAB"

echo "# WTM Project Tracker - Weekly report at 9pm every Friday" >> "$TEMP_CRONTAB"
echo "0 21 * * 5 \"$SCRIPT_DIR/run-weekly-report.sh\" > /dev/null 2>&1" >> "$TEMP_CRONTAB"

# Install the new crontab
crontab "$TEMP_CRONTAB"

# Clean up
rm "$TEMP_CRONTAB"

echo "Cron jobs set up successfully!"
echo "Daily report will run at 8:00 PM every day"
echo "Weekly report will run at 9:00 PM every Friday"

# Show the current crontab
echo "\nCurrent crontab entries:"
crontab -l | grep -v "^#" | grep -v "^$"
