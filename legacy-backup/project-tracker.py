#!/usr/bin/env python3
"""
WTM Project Tracker - Daily and Weekly Report Generator

This script tracks:
1. Project movements between folders
2. Completed tasks (checkboxes) within project files
3. Generates both daily and weekly reports

Usage:
    python project_tracker.py --daily   # Generate a daily report
    python project_tracker.py --weekly  # Generate a weekly report
    python project_tracker.py           # Generate both reports
"""

import os
import datetime
import json
import re
from pathlib import Path
import time
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import argparse
import difflib
from collections import defaultdict
import configparser

# Configuration
BASE_DIR = "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents"
PROJECTS_DIR = os.path.join(os.path.expanduser("~"), "Library", "Mobile Documents", "27N4MQEA55~pro~writer", "Documents", "WTM Projects")
WAITING_DIR = os.path.join(os.path.expanduser("~"), "Library", "Mobile Documents", "27N4MQEA55~pro~writer", "Documents", "WTM Projects Waiting")
ARCHIVE_DIR = os.path.join(os.path.expanduser("~"), "Library", "Mobile Documents", "27N4MQEA55~pro~writer", "Documents", "WTM Projects Archive")
SOMEDAY_DIR = os.path.join(os.path.expanduser("~"), "Library", "Mobile Documents", "27N4MQEA55~pro~writer", "Documents", "WTM Projects Someday")
TEST_PROJECTS_DIR = os.path.join(os.path.expanduser("~"), "wills_code", "project_tracker", "projects")
TEST_ACTIVE_DIR = os.path.join(os.path.expanduser("~"), "wills_code", "project_tracker", "projects", "active")
TEST_SOMEDAY_DIR = os.path.join(os.path.expanduser("~"), "wills_code", "project_tracker", "projects", "someday")
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(CURRENT_DIR, "project_tracker_db.json")
REPORTS_DIR = os.path.join(CURRENT_DIR, "WTM Project Reports")
DAILY_REPORTS_DIR = os.path.join(REPORTS_DIR, "Daily")
CONFIG_FILE = os.path.join(CURRENT_DIR, "config.ini")

# Load configuration
def load_config():
    """Load configuration from config.ini file"""
    config = configparser.ConfigParser()
    if os.path.exists(CONFIG_FILE):
        config.read(CONFIG_FILE)
    return config

# Custom JSON encoder to handle sets
class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)

def load_database():
    """Load the project tracking database or create a new one if it doesn't exist."""
    default_db = {
        "last_run": None,
        "projects": {},
        "waiting": {},
        "archive": {},
        "someday": {}
    }
    
    if not os.path.exists(DB_FILE):
        return default_db
    
    try:
        with open(DB_FILE, 'r') as f:
            content = f.read().strip()
            if not content:  # Empty file
                return default_db
            return json.loads(content)
    except (json.JSONDecodeError, FileNotFoundError):
        print(f"Warning: Database file {DB_FILE} is corrupted or invalid. Creating a new one.")
        # Backup the corrupted file
        if os.path.exists(DB_FILE):
            backup_file = f"{DB_FILE}.bak.{int(time.time())}"
            try:
                os.rename(DB_FILE, backup_file)
                print(f"Backed up corrupted database to {backup_file}")
            except Exception as e:
                print(f"Failed to backup corrupted database: {e}")
        return default_db

def save_database(db):
    """Save the project tracking database."""
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, indent=2, cls=SetEncoder)

def get_files_in_directory(directory):
    """Get all text files in a directory with their modification times and content."""
    result = {}
    if not os.path.exists(directory):
        return result
    
    for file in os.listdir(directory):
        if file.endswith('.txt') and not file.startswith('.'):
            file_path = os.path.join(directory, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                
                result[file] = {
                    "mod_time": os.path.getmtime(file_path),
                    "creation_time": os.path.getctime(file_path),
                    "content": content,
                    "completed_tasks": extract_completed_tasks(content),
                    "total_tasks": count_total_tasks(content)
                }
            except Exception as e:
                print(f"Error reading file {file}: {e}")
    
    return result

def extract_completed_tasks(content):
    """Extract completed tasks (checked checkboxes) from file content."""
    # Match common checkbox patterns: 
    # - [x] Task description
    # - [X] Task description
    # - Task description
    # - Task description
    # - [DONE] Task description
    completed_tasks = []
    
    # Look for markdown-style checked checkboxes
    checkbox_patterns = [
        r'- \[x\] (.*?)(?:\n|$)',  # - [x] Task
        r'- \[X\] (.*?)(?:\n|$)',  # - [X] Task
        r'✓ (.*?)(?:\n|$)',        # Task
        r'✅ (.*?)(?:\n|$)',        # Task
        r'\[DONE\] (.*?)(?:\n|$)', # [DONE] Task
        r'- \[DONE\] (.*?)(?:\n|$)' # - [DONE] Task
    ]
    
    for pattern in checkbox_patterns:
        matches = re.findall(pattern, content)
        completed_tasks.extend(matches)
    
    return completed_tasks

def count_total_tasks(content):
    """Count total number of tasks (all checkboxes) in file content."""
    # Match both checked and unchecked checkboxes
    checkbox_patterns = [
        r'- \[[ xX]\] ',  # - [ ] or - [x] or - [X]
        r'✓ ',            # 
        r'✅ ',            # 
        r'\[DONE\] ',     # [DONE]
        r'\[TODO\] ',     # [TODO]
        r'- \[DONE\] ',   # - [DONE]
        r'- \[TODO\] '    # - [TODO]
    ]
    
    total = 0
    for pattern in checkbox_patterns:
        matches = re.findall(pattern, content)
        total += len(matches)
    
    return total

def extract_project_name(filename):
    """Extract a clean project name from the filename."""
    # Remove common prefixes like # or numbers
    clean_name = re.sub(r'^[#\s0-9]+', '', filename)
    # Remove file extension
    clean_name = os.path.splitext(clean_name)[0]
    # Remove common suffixes
    clean_name = re.sub(r'\.(txt|md)$', '', clean_name, flags=re.IGNORECASE)
    return clean_name.strip()

def generate_weekly_report(db, current_files):
    """Generate a report of project movements since the last run."""
    now = datetime.datetime.now()
    last_run = db.get("last_run")
    
    if not last_run:
        print("First run detected. Creating initial database...")
        db["last_run"] = now.isoformat()
        db["projects"] = current_files["projects"]
        db["waiting"] = current_files["waiting"]
        db["archive"] = current_files["archive"]
        db["someday"] = current_files["someday"]
        save_database(db)
        return "Initial database created. Run again next week for a comparative report."
    
    last_run_date = datetime.datetime.fromisoformat(last_run)
    
    # Identify project movements
    completed_projects = []
    new_projects = []
    someday_projects = []
    
    # Projects moved to Archive (completed)
    for filename, info in current_files["archive"].items():
        if filename not in db["archive"] and filename in db["projects"]:
            completed_projects.append({
                "name": extract_project_name(filename),
                "filename": filename
            })
    
    # New projects started (from Waiting or brand new)
    for filename, info in current_files["projects"].items():
        if filename not in db["projects"]:
            if filename in db["waiting"]:
                source = "waiting"
            else:
                source = "new"
            
            new_projects.append({
                "name": extract_project_name(filename),
                "filename": filename,
                "source": source
            })
    
    # Projects moved to Someday
    for filename, info in current_files["someday"].items():
        if filename not in db["someday"] and filename in db["projects"]:
            someday_projects.append({
                "name": extract_project_name(filename),
                "filename": filename
            })
    
    # Generate the report text
    report = f"# WTM Project Weekly Report\n"
    report += f"Report period: {last_run_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}\n\n"
    
    # Add completed projects
    report += f"## Completed Projects ({len(completed_projects)})\n"
    if completed_projects:
        for project in completed_projects:
            report += f"- {project['name']}\n"
    else:
        report += "No projects were completed this week.\n"
    
    report += "\n"
    
    # Add new projects
    report += f"## New Projects Started ({len(new_projects)})\n"
    if new_projects:
        waiting_projects = [p for p in new_projects if p['source'] == 'waiting']
        if waiting_projects:
            report += "### From Waiting:\n"
            for project in waiting_projects:
                report += f"- {project['name']}\n"
            report += "\n"
        
        brand_new = [p for p in new_projects if p['source'] == 'new']
        if brand_new:
            report += "### Brand New:\n"
            for project in brand_new:
                report += f"- {project['name']}\n"
    else:
        report += "No new projects were started this week.\n"
    
    report += "\n"
    
    # Add someday projects
    report += f"## Projects Moved to Someday ({len(someday_projects)})\n"
    if someday_projects:
        for project in someday_projects:
            report += f"- {project['name']}\n"
    else:
        report += "No projects were moved to 'Someday' this week.\n"
    
    # Current project count
    active_count = len(current_files["projects"])
    waiting_count = len(current_files["waiting"])
    someday_count = len(current_files["someday"])
    archive_count = len(current_files["archive"])
    
    report += f"\n## Current Project Status\n"
    report += f"- Active Projects: {active_count}\n"
    report += f"- Waiting Projects: {waiting_count}\n"
    report += f"- Someday Projects: {someday_count}\n"
    report += f"- Archived Projects: {archive_count}\n"
    
    # Update the database
    db["last_run"] = now.isoformat()
    db["projects"] = current_files["projects"]
    db["waiting"] = current_files["waiting"]
    db["archive"] = current_files["archive"]
    db["someday"] = current_files["someday"]
    save_database(db)
    
    return report

def send_email_report(report, recipient, subject=None):
    """Send a report via email."""
    if not recipient:
        print("No email recipient specified. Skipping email.")
        return
    
    # Load email configuration from config file
    config = load_config()
    
    # Get email settings from config file or use defaults
    try:
        smtp_server = config.get('email', 'smtp_server')
        smtp_port = config.getint('email', 'smtp_port')
        sender_email = config.get('email', 'smtp_username')
        password = config.get('email', 'smtp_password')
    except (configparser.NoSectionError, configparser.NoOptionError):
        print("Warning: Email configuration not found or incomplete in config.ini")
        print("Please check your config.ini file for the [email] section with required settings")
        return
    
    if not subject:
        subject = "WTM Project Report"
    
    # Convert markdown to HTML
    html_content = convert_markdown_to_html(report)
    
    # Create the email message
    msg = MIMEMultipart('alternative')
    msg["From"] = sender_email
    msg["To"] = recipient
    msg["Subject"] = subject
    
    # Add plain text version
    msg.attach(MIMEText(report, "plain"))
    
    # Add HTML version
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        # Connect to the SMTP server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Secure the connection
        server.login(sender_email, password)
        
        # Send the email
        server.sendmail(sender_email, recipient, msg.as_string())
        server.quit()
        print(f"Email sent to {recipient}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def convert_markdown_to_html(markdown_text):
    """Convert markdown text to beautiful HTML with Gwern-inspired styling."""
    # Define CSS for beautiful typography and layout
    css = """
    <style>
        body {
            font-family: 'Equity Text', 'Equity Text A', 'Equity Text B', Georgia, serif;
            line-height: 1.6;
            color: #303030;
            max-width: 720px;
            margin: 0 auto;
            padding: 2em;
            background-color: #f9f9f9;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Equity Caps A', 'Equity Caps B', Georgia, serif;
            color: #1a1a1a;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.3;
        }
        h1 {
            font-size: 2em;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 0.3em;
            text-align: center;
        }
        h2 {
            font-size: 1.5em;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 0.2em;
            margin-top: 2em;
        }
        h3 {
            font-size: 1.3em;
            margin-top: 1.6em;
        }
        p {
            margin: 1em 0;
            text-align: justify;
            hyphens: auto;
        }
        ul, ol {
            padding-left: 2em;
            margin: 1em 0;
        }
        li {
            margin: 0.5em 0;
        }
        a {
            color: #2a7ae2;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        code {
            font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', monospace;
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .summary {
            background-color: #f0f7ff;
            border-left: 4px solid #2a7ae2;
            padding: 1em;
            margin: 1.5em 0;
            border-radius: 0 3px 3px 0;
        }
        .project-list {
            list-style-type: none;
            padding-left: 0;
        }
        .project-list li {
            padding: 0.5em 0;
            border-bottom: 1px dotted #e0e0e0;
        }
        .project-progress {
            color: #606060;
            font-size: 0.9em;
        }
        .completion-high {
            color: #2e7d32;
        }
        .completion-medium {
            color: #f57c00;
        }
        .completion-low {
            color: #c62828;
        }
        .date {
            color: #606060;
            font-style: italic;
        }
        .section {
            margin: 2em 0;
            padding: 1em;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
    </style>
    """
    
    # Simple markdown to HTML conversion without using the markdown package
    # Convert headers
    html = markdown_text
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    
    # Convert report date line
    html = re.sub(r'Report date: (.+)', r'<p class="date">Report date: \1</p>', html)
    
    # Convert lists
    lines = html.split('\n')
    formatted_lines = []
    in_list = False
    
    for line in lines:
        if line.strip().startswith('- '):
            if not in_list:
                in_list = True
                if 'tasks (' in line:
                    formatted_lines.append('<ul class="project-list">')
                else:
                    formatted_lines.append('<ul>')
            
            # Format project progress with color coding
            if 'tasks (' in line:
                project_info = re.match(r'- (.+) \((.+)/(.+) tasks, (.+)% complete\)', line.strip())
                if project_info:
                    project_name, completed, total, percentage = project_info.groups()
                    percentage_float = float(percentage)
                    if percentage_float >= 75:
                        completion_class = 'completion-high'
                    elif percentage_float >= 30:
                        completion_class = 'completion-medium'
                    else:
                        completion_class = 'completion-low'
                    
                    formatted_line = f'<li><strong>{project_name}</strong> <span class="project-progress">({completed}/{total} tasks, <span class="{completion_class}">{percentage}% complete</span>)</span></li>'
                    formatted_lines.append(formatted_line)
                else:
                    formatted_lines.append(f'<li>{line.strip()[2:]}</li>')
            else:
                formatted_lines.append(f'<li>{line.strip()[2:]}</li>')
        else:
            if in_list:
                in_list = False
                formatted_lines.append('</ul>')
            formatted_lines.append(line)
    
    if in_list:
        formatted_lines.append('</ul>')
    
    html = '\n'.join(formatted_lines)
    
    # Convert paragraphs (lines with content that aren't headers or lists)
    html = re.sub(r'^([^<>\n].+)$', r'<p>\1</p>', html, flags=re.MULTILINE)
    
    # Convert blank lines to proper spacing
    html = re.sub(r'\n\n+', '\n', html)
    
    # Format summary sections
    html = re.sub(r'<p>\*\*Summary:\*\* (.+)</p>', r'<div class="summary"><p><strong>Summary:</strong> \1</p></div>', html)
    
    # Wrap sections in div
    for section in ['Tasks Completed Today', 'Project Waiting Status Changes', 'Project Someday Status Changes', 'Active Project Task Status', 'Waiting Projects Status', 'Someday Projects Status']:
        section_pattern = f'<h2>{section}</h2>'
        if section_pattern in html:
            html = html.replace(section_pattern, f'<div class="section">{section_pattern}')
            # Find the next h2 or end of document
            next_section_start = html.find('<h2>', html.find(section_pattern) + len(section_pattern))
            if next_section_start != -1:
                html = html[:next_section_start] + '</div>' + html[next_section_start:]
            else:
                html = html + '</div>'
    
    # Assemble the complete HTML document
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WTM Project Report</title>
    {css}
</head>
<body>
    {html}
</body>
</html>
    """
    
    return html

def email_report(report, subject):
    """Email the report to the configured email address."""
    # Configure email settings
    sender_email = "will@mclemoreauction.com"  # Replace with your email
    receiver_email = "will@mclemoreauction.com"  # Replace with recipient email
    
    # Send the report using the send_email_report function
    send_email_report(report, receiver_email, subject)

def save_report_to_file(report):
    """Save the report to a file in a reports directory."""
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    filename = f"project_report_{datetime.datetime.now().strftime('%Y-%m-%d')}.md"
    file_path = os.path.join(REPORTS_DIR, filename)
    
    with open(file_path, 'w') as f:
        f.write(report)
    
    print(f"Report saved to {file_path}")
    return file_path

def generate_daily_report(db, current_files):
    """Generate a daily report focused on completed tasks within projects."""
    now = datetime.datetime.now()
    report = f"# WTM Project Daily Report\nReport date: {now.strftime('%Y-%m-%d')}\n\n"
    
    # Track completed tasks
    completed_tasks = []
    tasks_by_project = defaultdict(list)
    newly_completed_projects = []
    
    # Track projects moved to archive (also considered completed)
    newly_archived_projects = []
    
    # Track projects moved to/from waiting
    newly_waiting_projects = []
    returned_from_waiting_projects = []
    
    # Track projects moved to/from someday
    moved_to_someday_projects = []
    activated_from_someday_projects = []
    
    # Check for recently modified files (within the last 24 hours)
    recent_cutoff = time.time() - (24 * 60 * 60)  # 24 hours ago in seconds
    
    # First load the previous state if it exists
    previous_state = db.get("daily_tasks_state", {})
    previous_completed_projects = db.get("completed_projects", set())
    previous_archived_projects = db.get("archived_projects", set())
    previous_waiting_projects = db.get("waiting_projects", set())
    previous_someday_projects = db.get("someday_projects", set())
    
    current_state = {}
    current_completed_projects = set()
    current_archived_projects = set()
    current_waiting_projects = set()
    current_someday_projects = set()
    
    # Process active projects
    for filename, info in current_files["projects"].items():
        file_path = os.path.join(PROJECTS_DIR, filename)
        project_name = extract_project_name(filename)
        
        # Check if project is complete
        is_complete = info["total_tasks"] > 0 and len(info["completed_tasks"]) == info["total_tasks"]
        
        # If complete, add to current completed projects set
        if is_complete:
            current_completed_projects.add(project_name)
        
        # Check if this project was previously in waiting
        if project_name in previous_waiting_projects:
            returned_from_waiting_projects.append({
                "name": project_name,
                "total_tasks": info["total_tasks"],
                "completed_tasks": len(info["completed_tasks"])
            })
        
        # If the file was modified in the last 24 hours, check for completed tasks
        if info["mod_time"] >= recent_cutoff:
            current_content = info["content"]
            current_completed = set(info["completed_tasks"])
            current_state[filename] = current_completed
            
            # If we have a previous state for this file
            if filename in previous_state:
                previous_completed = set(previous_state[filename])
                # Find new completed tasks (set difference)
                new_completed = current_completed - previous_completed
                
                # Add to our completed tasks list
                for task in new_completed:
                    completed_tasks.append({"project": project_name, "task": task})
                    tasks_by_project[project_name].append(task)
                
                # Check if project was just completed today
                if is_complete and project_name not in previous_completed_projects:
                    newly_completed_projects.append({
                        "name": project_name,
                        "total_tasks": info["total_tasks"]
                    })
            else:
                # First time seeing this file, consider all completed tasks as new
                for task in current_completed:
                    completed_tasks.append({"project": project_name, "task": task})
                    tasks_by_project[project_name].append(task)
                
                # Check if project is already completed on first view
                if is_complete:
                    newly_completed_projects.append({
                        "name": project_name,
                        "total_tasks": info["total_tasks"]
                    })
    
    # Process archived projects - any new ones are considered completed today
    for filename, info in current_files["archive"].items():
        project_name = extract_project_name(filename)
        current_archived_projects.add(project_name)
        
        # If this project was recently archived (within last 24 hours)
        if info["mod_time"] >= recent_cutoff and project_name not in previous_archived_projects:
            # Add to newly archived projects list
            newly_archived_projects.append({
                "name": project_name,
                "total_tasks": info["total_tasks"],
                "completed_tasks": len(info["completed_tasks"])
            })
    
    # Process waiting projects
    for filename, info in current_files["waiting"].items():
        project_name = extract_project_name(filename)
        current_waiting_projects.add(project_name)
        
        # If this project was recently moved to waiting (within last 24 hours)
        if info["mod_time"] >= recent_cutoff and project_name not in previous_waiting_projects:
            # Add to newly waiting projects list
            newly_waiting_projects.append({
                "name": project_name,
                "total_tasks": info["total_tasks"],
                "completed_tasks": len(info["completed_tasks"])
            })
    
    # Process someday projects
    for filename, info in current_files["someday"].items():
        project_name = extract_project_name(filename)
        current_someday_projects.add(project_name)
        
        # If this project was recently modified (within last 24 hours)
        if info["mod_time"] >= recent_cutoff:
            # Check if it's newly added to someday
            if project_name not in previous_someday_projects:
                # Add to moved to someday projects list
                moved_to_someday_projects.append({
                    "name": project_name,
                    "total_tasks": info["total_tasks"],
                    "completed_tasks": len(info["completed_tasks"])
                })
    
    # Check for projects that were in someday but are no longer there
    for project_name in previous_someday_projects:
        # If the project is not in current someday projects but is in active projects
        if project_name not in current_someday_projects and any(project_name == extract_project_name(f) for f in current_files["projects"]):
            # Find the project in active projects
            for filename, info in current_files["projects"].items():
                if project_name == extract_project_name(filename):
                    # Add to activated from someday projects list
                    activated_from_someday_projects.append({
                        "name": project_name,
                        "total_tasks": info["total_tasks"],
                        "completed_tasks": len(info["completed_tasks"])
                    })
                    break
    
    # Generate the task completion report
    if completed_tasks:
        report += f"## Tasks Completed Today ({len(completed_tasks)})\n\n"
        
        for project, tasks in tasks_by_project.items():
            report += f"### {project} ({len(tasks)})\n"
            for task in tasks:
                report += f"- {task}\n"
            report += "\n"
    else:
        report += "## Tasks Completed Today (0)\n\n"
        report += "No tasks were completed in the last 24 hours.\n\n"
    
    # Add newly completed projects section (both from task completion and archiving)
    total_completed = len(newly_completed_projects) + len(newly_archived_projects)
    if total_completed > 0:
        report += f"## Projects Completed Today ({total_completed})\n\n"
        
        # First list projects completed by finishing all tasks
        if newly_completed_projects:
            report += "### Completed by finishing all tasks:\n"
            for project in newly_completed_projects:
                report += f"- {project['name']} ({project['total_tasks']} tasks)\n"
            report += "\n"
        
        # Then list projects completed by archiving
        if newly_archived_projects:
            report += "### Completed by archiving:\n"
            for project in newly_archived_projects:
                completion_percentage = (project['completed_tasks'] / project['total_tasks'] * 100) if project['total_tasks'] > 0 else 0
                report += f"- {project['name']} ({project['completed_tasks']}/{project['total_tasks']} tasks, {completion_percentage:.1f}% complete)\n"
            report += "\n"
    
    # Add waiting projects section
    if newly_waiting_projects or returned_from_waiting_projects:
        report += "## Project Waiting Status Changes\n\n"
        
        if newly_waiting_projects:
            report += f"### New Projects Moved to Waiting ({len(newly_waiting_projects)}):\n"
            for project in newly_waiting_projects:
                completion_percentage = (project['completed_tasks'] / project['total_tasks'] * 100) if project['total_tasks'] > 0 else 0
                report += f"- {project['name']} ({project['completed_tasks']}/{project['total_tasks']} tasks, {completion_percentage:.1f}% complete)\n"
            report += "\n"
        
        if returned_from_waiting_projects:
            report += f"### Projects Returned from Waiting ({len(returned_from_waiting_projects)}):\n"
            for project in returned_from_waiting_projects:
                completion_percentage = (project['completed_tasks'] / project['total_tasks'] * 100) if project['total_tasks'] > 0 else 0
                report += f"- {project['name']} ({project['completed_tasks']}/{project['total_tasks']} tasks, {completion_percentage:.1f}% complete)\n"
            report += "\n"
    
    # Add someday projects section
    if moved_to_someday_projects or activated_from_someday_projects:
        report += "## Project Someday Status Changes\n\n"
        
        if moved_to_someday_projects:
            report += f"### New Projects Moved to Someday ({len(moved_to_someday_projects)}):\n"
            for project in moved_to_someday_projects:
                completion_percentage = (project['completed_tasks'] / project['total_tasks'] * 100) if project['total_tasks'] > 0 else 0
                report += f"- {project['name']} ({project['completed_tasks']}/{project['total_tasks']} tasks, {completion_percentage:.1f}% complete)\n"
            report += "\n"
        
        if activated_from_someday_projects:
            report += f"### Projects Returned from Someday ({len(activated_from_someday_projects)}):\n"
            for project in activated_from_someday_projects:
                completion_percentage = (project['completed_tasks'] / project['total_tasks'] * 100) if project['total_tasks'] > 0 else 0
                report += f"- {project['name']} ({project['completed_tasks']}/{project['total_tasks']} tasks, {completion_percentage:.1f}% complete)\n"
            report += "\n"
    
    # Add a progress summary for active projects
    report += "## Active Project Task Status\n\n"
    
    project_status = []
    for filename, info in current_files["projects"].items():
        if info["total_tasks"] > 0:  # Only include projects with tasks
            project_name = extract_project_name(filename)
            completed = len(info["completed_tasks"])
            total = info["total_tasks"]
            percentage = (completed / total * 100) if total > 0 else 0
            
            # Only include in active projects if not 100% complete
            if percentage < 100:
                project_status.append({
                    "name": project_name,
                    "completed": completed,
                    "total": total,
                    "percentage": percentage
                })
    
    # Sort by completion percentage (descending)
    project_status.sort(key=lambda x: x["percentage"], reverse=True)
    
    if project_status:
        # Add summary of total active projects
        total_tasks = sum(project["total"] for project in project_status)
        completed_tasks = sum(project["completed"] for project in project_status)
        overall_completion = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        report += f"**Summary:** {len(project_status)} active projects with {total_tasks} total tasks. "
        report += f"{completed_tasks} tasks completed ({overall_completion:.1f}% overall completion).\n\n"
        
        for project in project_status:
            report += f"- {project['name']}: {project['completed']}/{project['total']} tasks ({project['percentage']:.1f}%)\n"
    else:
        report += "No active projects with tracked tasks.\n"
    
    # Add a summary of waiting projects
    if current_waiting_projects:
        waiting_projects_info = []
        for filename, info in current_files["waiting"].items():
            if info["total_tasks"] > 0:  # Only include projects with tasks
                project_name = extract_project_name(filename)
                completed = len(info["completed_tasks"])
                total = info["total_tasks"]
                percentage = (completed / total * 100) if total > 0 else 0
                waiting_projects_info.append({
                    "name": project_name,
                    "completed": completed,
                    "total": total,
                    "percentage": percentage
                })
        
        # Sort by completion percentage (descending)
        waiting_projects_info.sort(key=lambda x: x["percentage"], reverse=True)
        
        if waiting_projects_info:
            report += "\n## Waiting Projects Status\n\n"
            total_waiting_tasks = sum(project["total"] for project in waiting_projects_info)
            completed_waiting_tasks = sum(project["completed"] for project in waiting_projects_info)
            waiting_completion = (completed_waiting_tasks / total_waiting_tasks * 100) if total_waiting_tasks > 0 else 0
            
            report += f"**Summary:** {len(waiting_projects_info)} waiting projects with {total_waiting_tasks} total tasks. "
            report += f"{completed_waiting_tasks} tasks completed ({waiting_completion:.1f}% overall completion).\n\n"
            
            for project in waiting_projects_info:
                report += f"- {project['name']}: {project['completed']}/{project['total']} tasks ({project['percentage']:.1f}%)\n"
    
    # Add a summary of someday projects
    if current_someday_projects:
        someday_projects_info = []
        for filename, info in current_files["someday"].items():
            if info["total_tasks"] > 0:  # Only include projects with tasks
                project_name = extract_project_name(filename)
                completed = len(info["completed_tasks"])
                total = info["total_tasks"]
                percentage = (completed / total * 100) if total > 0 else 0
                someday_projects_info.append({
                    "name": project_name,
                    "completed": completed,
                    "total": total,
                    "percentage": percentage
                })
        
        # Sort by completion percentage (descending)
        someday_projects_info.sort(key=lambda x: x["percentage"], reverse=True)
        
        if someday_projects_info:
            report += "\n## Someday Projects Status\n\n"
            total_someday_tasks = sum(project["total"] for project in someday_projects_info)
            completed_someday_tasks = sum(project["completed"] for project in someday_projects_info)
            someday_completion = (completed_someday_tasks / total_someday_tasks * 100) if total_someday_tasks > 0 else 0
            
            report += f"**Summary:** {len(someday_projects_info)} someday projects with {total_someday_tasks} total tasks. "
            report += f"{completed_someday_tasks} tasks completed ({someday_completion:.1f}% overall completion).\n\n"
            
            for project in someday_projects_info:
                report += f"- {project['name']}: {project['completed']}/{project['total']} tasks ({project['percentage']:.1f}%)\n"
    
    # Update the database
    db["daily_tasks_state"] = current_state
    db["completed_projects"] = current_completed_projects
    db["archived_projects"] = current_archived_projects
    db["waiting_projects"] = current_waiting_projects
    db["someday_projects"] = current_someday_projects
    db["last_daily_report"] = now.isoformat()
    save_database(db)
    
    return report

def save_daily_report_to_file(report):
    """Save the daily report to a file in a reports directory."""
    os.makedirs(DAILY_REPORTS_DIR, exist_ok=True)
    
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    filename = f"daily_report_{today}.md"
    file_path = os.path.join(DAILY_REPORTS_DIR, filename)
    
    with open(file_path, 'w') as f:
        f.write(report)
    
    print(f"Daily report saved to {file_path}")
    return file_path

def main():
    """Main function to parse arguments and execute commands."""
    parser = argparse.ArgumentParser(description='WTM Project Tracker')
    
    # Main commands
    parser.add_argument('--daily-report', action='store_true', help='Generate a daily report')
    parser.add_argument('--weekly-report', action='store_true', help='Generate a weekly report')
    parser.add_argument('--monthly-report', action='store_true', help='Generate a monthly report')
    parser.add_argument('--save', action='store_true', help='Save the report to a file')
    parser.add_argument('--email', action='store_true', help='Email the report')
    parser.add_argument('--preview', action='store_true', help='Preview mode - don\'t update database')
    
    args = parser.parse_args()
    
    # Load the database
    db = load_database()
    
    # Process files from both main and test directories
    current_files = {
        "projects": {},
        "archive": {},
        "waiting": {},
        "someday": {}
    }
    
    # Process main projects directory
    if os.path.exists(PROJECTS_DIR):
        project_files = get_files_in_directory(PROJECTS_DIR)
        for filename, info in project_files.items():
            current_files["projects"][filename] = info
    
    # Process test active directory
    if os.path.exists(TEST_ACTIVE_DIR):
        test_project_files = get_files_in_directory(TEST_ACTIVE_DIR)
        for filename, info in test_project_files.items():
            current_files["projects"][filename] = info
    
    # Process archive directory
    if os.path.exists(ARCHIVE_DIR):
        archive_files = get_files_in_directory(ARCHIVE_DIR)
        for filename, info in archive_files.items():
            current_files["archive"][filename] = info
    
    # Process waiting directory
    if os.path.exists(WAITING_DIR):
        waiting_files = get_files_in_directory(WAITING_DIR)
        for filename, info in waiting_files.items():
            current_files["waiting"][filename] = info
    
    # Process someday directory
    if os.path.exists(SOMEDAY_DIR):
        someday_files = get_files_in_directory(SOMEDAY_DIR)
        for filename, info in someday_files.items():
            current_files["someday"][filename] = info
    
    # Process test someday directory
    if os.path.exists(TEST_SOMEDAY_DIR):
        test_someday_files = get_files_in_directory(TEST_SOMEDAY_DIR)
        for filename, info in test_someday_files.items():
            current_files["someday"][filename] = info
    
    # Generate reports based on arguments
    if args.daily_report:
        report = generate_daily_report(db if not args.preview else db.copy(), current_files)
        if args.save:
            save_report(report, "daily")
        if args.email:
            email_report(report, "WTM Project Daily Report")
        print("\n" + "=" * 80 + "\n")
        print(report)
        print("\n" + "=" * 80 + "\n")
        if args.preview:
            print("Preview mode - database not updated.")
        print("Daily report generation completed")
    
    elif args.weekly_report:
        report = generate_weekly_report(db, current_files)
        if args.save:
            save_report(report, "weekly")
        if args.email:
            email_report(report, "WTM Project Weekly Report")
        print(report)
        print("Weekly report generation completed")
    
    elif args.monthly_report:
        report = generate_monthly_report(db, current_files)
        if args.save:
            save_report(report, "monthly")
        if args.email:
            email_report(report, "WTM Project Monthly Report")
        print(report)
        print("Monthly report generation completed")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
