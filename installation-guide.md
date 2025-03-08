# WTM Project Tracker Installation Guide

This guide will help you set up and use the WTM Project Tracker system, which provides automated daily and weekly reporting on your project workflow. The system tracks:

1. Project movements between your folders ("WTM Projects", "WTM Projects Waiting", "WTM Projects Archive", and "WTM Projects Someday")
2. Task completion within projects using checkboxes in your text files

## What You'll Get

The WTM Project Tracker will:

### Daily Reports
- Track which tasks you completed within each project (using checkboxes)
- Show progress on active projects (percentage of tasks completed)
- Generate daily summaries of what you accomplished
- Save daily reports as markdown files
- Optionally email daily reports to you

### Weekly Reports
- Track which projects you completed (moved to Archive)
- Track which projects you started (moved from Waiting to Projects)
- Track which projects you deferred (moved to Someday)
- Generate comprehensive weekly reports
- Save weekly reports as markdown files
- Optionally email weekly reports to you

## Installation Steps

1. **Copy the Files to Your Documents Directory**

   Save the following files to your iA Writer Documents directory:
   - `project_tracker.py` - The main Python script
   - `run_weekly_report.sh` - Shell script to run the weekly report
   - `run_daily_report.sh` - Shell script to run the daily report
   - `setup.sh` - One-time setup script

2. **Run the Setup Script**

   Open Terminal and run:
   ```bash
   cd "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents"
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure Email Settings (Optional)**

   If you want email reports, edit `run_weekly_report.sh` and change:
   ```bash
   EMAIL="your-email@example.com"
   ```
   
   Then edit `project_tracker.py` to configure your email server settings in the `send_email_report` function:
   ```python
   smtp_server = "smtp.example.com"
   smtp_port = 587
   sender_email = "your-email@example.com"
   password = "your-password"  # Consider using environment variables for security
   ```

4. **Run the Tracker Manually**

   To run the daily report:
   ```bash
   ./run_daily_report.sh
   ```

   To run the weekly report:
   ```bash
   ./run_weekly_report.sh
   ```

5. **Set Up Automatic Reports (Optional)**

   To run reports automatically, add these lines to your crontab:
   ```bash
   crontab -e
   ```
   
   Add these lines:
   ```
   # Run daily report at 6pm every day
   0 18 * * * /Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents/run_daily_report.sh
   
   # Run weekly report every Monday at 9am
   0 9 * * 1 /Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents/run_weekly_report.sh
   ```

## Report Formats

### Daily Report
The daily reports include:
- Tasks completed within the last 24 hours, organized by project
- Progress status for active projects (tasks completed/total tasks)
- Completion percentage for each active project

### Weekly Report
The weekly reports include:
- A list of completed projects (moved to Archive)
- A list of new projects started (from Waiting or brand new)
- A list of projects moved to Someday
- Current project counts across all states

## Customization Options

### Command Line Arguments

The Python script supports these arguments:
- `--email EMAIL` - Send the report to the specified email
- `--save` - Save the report to a file
- `--preview` - Preview the report without updating the database
- `--daily` - Generate only a daily report
- `--weekly` - Generate only a weekly report
  
If neither `--daily` nor `--weekly` is specified, both reports will be generated.

### Additional Metrics

## Troubleshooting

If you encounter issues:

1. Make sure all scripts have execute permissions:
   ```bash
   chmod +x project_tracker.py run_weekly_report.sh
   ```

2. Verify the path to your iA Writer documents:
   ```bash
   ls -la "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents"
   ```

3. Check the permissions on the database file:
   ```bash
   ls -la "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents/project_tracker_db.json"
   ```

## Getting Help

If you need assistance with customizing or extending this system, you can:
1. Review the inline documentation in the Python script
2. Modify the script to add new features or metrics that would be valuable for your workflow
