#!/bin/bash
# check-missed-jobs.sh - Check and run missed jobs when computer wakes up

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Get current time
CURRENT_HOUR=$(date +%H)
CURRENT_MINUTE=$(date +%M)
CURRENT_TIME=$((CURRENT_HOUR * 60 + CURRENT_MINUTE))
CURRENT_DAY=$(date +%u) # 1-7, where 1 is Monday and 7 is Sunday

# Daily report time (8:00 PM = 20:00 = 1200 minutes)
DAILY_REPORT_TIME=$((20 * 60))

# Weekly report time (9:00 PM Friday = 21:00 on day 5 = 1260 minutes)
WEEKLY_REPORT_TIME=$((21 * 60))
WEEKLY_REPORT_DAY=5 # Friday

# Get last wake time
LAST_WAKE=$(sysctl -n kern.waketime | cut -d' ' -f1)
LAST_WAKE_DATE=$(date -r $LAST_WAKE +"%Y-%m-%d")
CURRENT_DATE=$(date +"%Y-%m-%d")

# Only proceed if the computer woke up today
if [ "$LAST_WAKE_DATE" = "$CURRENT_DATE" ]; then
    # Convert last wake time to hours and minutes
    LAST_WAKE_HOUR=$(date -r $LAST_WAKE +%H)
    LAST_WAKE_MINUTE=$(date -r $LAST_WAKE +%M)
    LAST_WAKE_TIME=$((LAST_WAKE_HOUR * 60 + LAST_WAKE_MINUTE))
    
    # Check if daily report should have run between last sleep and wake
    if [ $LAST_WAKE_TIME -gt $DAILY_REPORT_TIME ] && [ $CURRENT_TIME -lt $DAILY_REPORT_TIME ]; then
        echo "Computer was asleep during scheduled daily report. Running now..."
        "$SCRIPT_DIR/run-daily-report.sh" > /dev/null 2>&1
        echo "Missed daily report executed at $(date)"
    fi
    
    # Check if weekly report should have run between last sleep and wake (only on Fridays)
    if [ $CURRENT_DAY -eq $WEEKLY_REPORT_DAY ] && [ $LAST_WAKE_TIME -gt $WEEKLY_REPORT_TIME ] && [ $CURRENT_TIME -lt $WEEKLY_REPORT_TIME ]; then
        echo "Computer was asleep during scheduled weekly report. Running now..."
        "$SCRIPT_DIR/run-weekly-report.sh" > /dev/null 2>&1
        echo "Missed weekly report executed at $(date)"
    fi
fi
