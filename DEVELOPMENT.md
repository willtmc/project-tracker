# Project Tracker Development Roadmap

This document tracks current issues, planned features, and development tasks for the Project Tracker application.

## Current Issues

- [x] Application launcher needs improvement (currently using a basic script)
- [x] Need proper application packaging for macOS distribution

## Planned Features

- [ ] Improved UI/UX for the review workflow
- [x] Data backup and sync capabilities
- [ ] Search functionality across all projects
- [ ] Tagging system for better project organization
- [ ] Due date tracking and notifications
- [ ] Customizable keyboard shortcuts
- [ ] Dark mode support
- [x] 1. Error handling for SQLite database operations
- [x] 2. Implement auto-recovery for database corruption

## Technical Improvements

- [x] Create proper macOS application bundle with custom icon
- [x] Implement proper error handling and logging
  * [x] Add structured error logging for database operations
  * [x] Implement graceful error recovery for database failures
  * [x] Create user-friendly error messages
- [ ] Add automated tests
  * Unit tests for database operations
  * Integration tests for workflow functions
- [ ] Optimize performance for large numbers of projects
- [ ] Implement data migration tools for version upgrades
- [x] Database integrity and recovery system
  * [x] Regular database integrity checks
  * [x] Automatic backup creation before risky operations
  * [x] Recovery tools for corrupted databases

## User-Requested Enhancements

- [x] Abandon workflow and allow workflow functions to be carried out individually with buttons
- [x] Make buttons in UI follow workflow from left to right
  * Remove Duplicates
  * Sort Projects by Status
  * Formulate Projects
  * View Report
- [x] Remove report and sort from project type UI area

## Development Notes

### Application Structure

The application follows an Electron-based architecture with:
- Main process (`src/main/main.js`): Handles application lifecycle and system integration
- Renderer process (`src/renderer/`): Manages UI and user interactions
- Module system for separating concerns (e.g., `workflowManager.js`, `reviewManager.js`)

### Database Error Handling and Recovery

The application now includes a robust database error handling and recovery system:
- Automatic database backups at regular intervals
- Database integrity checks before operations
- Error detection and recovery for database corruption
- User-friendly error UI for database issues
- Ability to retry failed operations after recovery
- Automatic restoration from backups when corruption is detected

### Next Development Sprint

1. ~~Improve application packaging and distribution~~ (Completed)
2. ~~Implement database integrity checks and auto-recovery system~~ (Completed)
3. Enhance the review workflow UI
4. Add automated tests for database operations
5. Implement search functionality across all projects

---

*Last updated: March 15, 2025*
