# WTM Project Tracker

A modern Electron-based project tracking application designed to help manage projects across different stages of a workflow with an efficient keyboard-driven review process.

## Features

- **Project Status Tracking**: Monitors projects across Active, Waiting, Archived, and Someday categories
- **Streamlined Review Workflow**: Efficiently review projects with keyboard shortcuts (y/a/s/w)
- **Duplicate Detection**: Identify and merge potential duplicate projects using AI-powered similarity detection
- **Modular Architecture**: Clean separation of concerns for improved maintainability
- **Markdown Support**: View and edit project content with Markdown formatting
- **Project Statistics**: Generate reports on project status and completion rates

## Project Structure

The WTM Project Tracker organizes projects into four main categories:

1. **Active Projects**: Current projects that need attention
2. **Waiting Projects**: Projects waiting on dependencies or input from others
3. **Someday Projects**: Future ideas or non-active projects
4. **Archived Projects**: Completed or inactive projects

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **projectData.js**: Handles project data loading, saving, and status updates
- **uiManager.js**: Manages UI elements and rendering of projects
- **tabManager.js**: Handles tab functionality and switching
- **reviewManager.js**: Manages the review process with keyboard shortcuts
- **reportManager.js**: Generates project statistics and reports
- **duplicateDetector.js**: Identifies and merges potential duplicate projects using AI
- **utils.js**: Contains utility functions for common operations

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration:
   ```
   PROJECTS_ROOT_DIR=/path/to/your/projects
   DATABASE_PATH=/path/to/database.sqlite
   ```

## Usage

```bash
npm start
```

## Review Workflow

The application supports a streamlined workflow for reviewing active projects:

1. **Yes (y)** - Keep project in active list and move to next project
2. **Archive (a)** - Archive the project and move text file to archive folder
3. **Someday (s)** - Move to Someday folder and move text file to Someday folder
4. **Waiting (w)** - Ask user for nature of input they're waiting on, append to file, move file to waiting folder

## Using Duplicate Detection

The Project Tracker includes an AI-powered duplicate detection system that helps identify and manage potential duplicate projects:

1. **Finding Duplicates**: Click the "Find Duplicates" button in the header to scan your active projects for potential duplicates.

2. **Reviewing Duplicates**: When potential duplicates are found, you'll be presented with a review interface showing the duplicate projects side by side.

3. **Managing Duplicates**: For each group of potential duplicates, you can:
   - **Merge Projects**: Combine the duplicate projects into a single project, preserving all unique information.
   - **Skip**: Indicate that the projects are not duplicates and move to the next group.
   - **Cancel**: Exit the duplicate review process.

4. **Merged Projects**: After merging, the system will create a consolidated project that contains all the information from the original projects, and the duplicate projects will be archived.

## License

MIT
