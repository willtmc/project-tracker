# Project Tracker

A desktop application built with Electron for managing and reviewing projects efficiently. This tool helps you organize projects across different states (active, waiting, someday, archive) and provides a streamlined review workflow.

## Features

- **Project Management**: Create, edit, and organize projects across different states
- **Review Mode**: Efficiently review active projects with keyboard shortcuts
- **Project States**:
  - **Active**: Currently actionable projects
  - **Waiting**: Projects waiting on external input
  - **Someday**: Projects to consider in the future
  - **Archive**: Completed or no longer relevant projects
- **Reporting**: Generate reports on project statistics

## Review Workflow

The application includes a streamlined workflow for reviewing active projects one at a time with single keystroke evaluation:

1. **Yes (y)** - Keep project in active list and move to next project
2. **Archive (a)** - Archive the project and move text file to archive folder
3. **Someday (s)** - Move to Someday folder and move text file to Someday folder
4. **Waiting (w)** - Ask user for nature of input they're waiting on, append to file, move file to waiting folder

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/project-tracker.git

# Navigate to the project directory
cd project-tracker

# Install dependencies
npm install

# Start the application
npm start
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
PROJECTS_ROOT_DIR=/path/to/your/projects/directory
DATABASE_PATH=/path/to/your/database.sqlite
```

## Development

```bash
# Run in development mode with hot reload
npm run dev
```

## Building

```bash
# Build for your current platform
npm run build
```

## License

MIT
