# WTM Project Tracker Development Guide

## Project Overview
The WTM Project Tracker is a Python-based tool that helps track projects across different stages of a workflow, generates daily and weekly reports, and monitors task completion within projects.

## User's Project Management Workflow
1. **Active projects** are kept in the **WTM Projects** folder
2. **Projects waiting on dependencies** from others are moved to the **WTM Projects Waiting** folder and moved back weekly
3. **Completed projects** are moved to the **WTM Projects Archive** folder
4. **Future ideas** or non-active projects are stored in the **WTM Projects Someday** folder

## Implemented Features

### Core Features
- **Project Status Tracking**: Monitors projects across Active, Waiting, Archived, and Someday categories
- **Task Completion Tracking**: Tracks individual tasks within projects and calculates completion percentages
- **Daily Reports**: Generates detailed daily reports with project status changes and completion statistics
- **Weekly Reports**: Provides weekly summaries of project progress and status changes
- **Email Notifications**: Sends beautifully formatted HTML emails with project updates

### Recent Enhancements

#### 1. Enhanced Daily Report
- Added tracking for projects completed by finishing all tasks
- Added tracking for projects completed by being moved to the archive folder
- Implemented waiting projects tracking
  - Projects newly moved to the waiting folder
  - Projects returned from the waiting folder to active projects
- Added a "Waiting Projects Status" section to the daily report
- Added a "Project Waiting Status Changes" section to track movements to/from waiting

#### 2. Someday Projects Tracking
- Implemented functionality to track projects moved to and from the Someday folder
- Enhanced the daily report to include a section for "Project Someday Status Changes"
- Added logic to detect when projects are moved to the Someday folder and when they are activated back into active projects

#### 3. Email Formatting Enhancements
- Implemented beautiful HTML email formatting inspired by Gwern's website design
- Added color-coded progress indicators for project completion percentages
- Created a responsive design with proper typography and visual hierarchy
- Maintained plain text version as fallback for email clients that don't support HTML

#### 4. Test Environment Support
- Added support for test directories to allow for easier testing
- Created test directories for active and someday projects to facilitate testing without affecting the main project structure

## Technical Implementation

### Directory Structure
- Updated the code to process files from all relevant directories:
  - WTM Projects (active projects)
  - WTM Projects Waiting (waiting projects)
  - WTM Projects Archive (completed projects)
  - WTM Projects Someday (future ideas)
  - Test directories (for testing)

### Database Structure
- Added tracking for archived projects via the `archived_projects` set
- Added tracking for waiting projects via the `waiting_projects` set
- Added tracking for someday projects via the `someday_projects` set

### Email Configuration
- The email configuration is stored in a `config.ini` file, which includes:
  - SMTP server: `smtp.gmail.com`
  - SMTP port: `587`
  - Sender email: Configuration-based
  - SMTP password: (stored securely)

## Future Enhancements

### High Priority
1. **Time-in-State Metrics**
   - Add tracking for how long projects spend in each state
   - Particularly useful for the waiting state to identify bottlenecks

2. **Weekly Waiting Report**
   - Create a specialized weekly report focused on waiting projects
   - Help with the weekly process of moving projects from waiting back to active

### Medium Priority
3. **Dependency Tracking**
   - Enhance the waiting projects section to include information about dependencies
   - Add a way to tag or note what each project is waiting on

4. **Project Categorization**
   - Implement a tagging system for projects to categorize them by type or department
   - Add filtering options in reports based on these categories

### Lower Priority
5. **Project History**
   - Implement a history tracking feature showing the movement of projects between folders
   - Provide insights into project lifecycle patterns

6. **Completion Time Metrics**
   - Track how long projects take from creation to completion
   - Calculate average completion times for different types of projects

7. **Command-Line Flags**
   - Add options to customize which sections appear in the report
   - Allow focusing on specific aspects of project management when needed

## Testing Guidelines

### Test Scenarios

1. **Test Project Completion Detection**
   - Create a test project with all tasks completed
   - Run the daily report to verify it's detected as completed

2. **Test Archive Completion Detection**
   - Move a project to the archive folder
   - Run the daily report to verify it's detected as completed by archiving

3. **Test Waiting Project Detection**
   - Move a project to the waiting folder
   - Run the daily report to verify it's detected as newly waiting

4. **Test Return from Waiting Detection**
   - Move a project from waiting back to active projects
   - Run the daily report to verify it's detected as returned from waiting

5. **Test Someday Project Detection**
   - Move a project to the someday folder
   - Run the daily report to verify it's detected as moved to someday

6. **Test Activation from Someday Detection**
   - Move a project from someday back to active projects
   - Run the daily report to verify it's detected as activated from someday

### Test Environment
- Use the test directories for active and someday projects to avoid affecting real project data
- Run the report with the preview flag to test without updating the database

## Known Issues and Limitations
- The preview mode doesn't update the database, so some state transitions won't be detected until a non-preview run is performed
- Large numbers of projects may make the email report lengthy and harder to read

## Development Workflow

1. **Feature Development**
   - Create a new branch for each feature
   - Implement and test the feature in isolation
   - Submit a pull request for review

2. **Testing**
   - Use the test directories to verify functionality
   - Run with preview mode to check report formatting
   - Verify email formatting in different email clients

3. **Deployment**
   - Merge approved pull requests to the main branch
   - Update the production installation
   - Run a test report to verify functionality

## Recent Development Session (March 7, 2025)

### Completed Tasks
- Enhanced the email formatting with beautiful Gwern-inspired design
- Added proper HTML structure with responsive design
- Implemented color-coded progress indicators for project completion
- Created visual hierarchy with section cards and proper typography
- Set up GitHub repository for version control and collaboration

### Next Steps
- Gather feedback on the enhanced email format
- Implement time-in-state metrics for better project flow insights
- Enhance the weekly report with similar project state transition information
- Consider adding data visualization elements to the email reports
