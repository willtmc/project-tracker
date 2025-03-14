# Project Tracker Development Roadmap

This document tracks current issues, planned features, and development tasks for the Project Tracker application.

## Completed Work

### Application Improvements
- Application launcher improvements
- Proper application packaging for macOS distribution
- Create proper macOS application bundle with custom icon
- Dark mode support
- Data backup and sync capabilities

### Database Enhancements
- Error handling for SQLite database operations
- Implement auto-recovery for database corruption
- Database integrity and recovery system
  * Regular database integrity checks
  * Automatic backup creation before risky operations
  * Recovery tools for corrupted databases
- Implement proper error handling and logging
  * Add structured error logging for database operations
  * Implement graceful error recovery for database failures
  * Create user-friendly error messages

### UI Enhancements
- Abandon workflow and allow workflow functions to be carried out individually with buttons
- Make buttons in UI follow workflow from left to right
  * Remove Duplicates
  * Sort Projects by Status
  * Formulate Projects
  * View Report
- Remove report and sort from project type UI area
- List view optimization (March 14, 2025)
  * Compact horizontal layout for more space-efficient display
  * Green "Well formulated" status with icon on the same line
  * Replaced tiny icons with proper buttons for better usability
  * Consistent spacing and alignment in both grid and list views
  * Eliminated duplicate content that was previously showing in both views

## Planned Features

- Improved UI/UX for the review workflow
- Search functionality across all projects
- Due date tracking and notifications
- Customizable keyboard shortcuts

## Technical Improvements Needed

- Add automated tests
  * Unit tests for database operations
  * Integration tests for workflow functions
- Optimize performance for large numbers of projects
- Implement data migration tools for version upgrades

## Current Development Focus

### Testing Plan for List View (Next Session)

We need to thoroughly test all button functionality:

1. **Open Button**: Verify it opens the project modal with the correct project data
2. **Move to Waiting Button**: Confirm it moves active projects to the waiting tab
3. **Restore Button**: Test that it properly restores archived projects
4. **Card Clickability**: Ensure the entire card is clickable and opens the project modal
5. **Status Indicator**: Check that the "Well formulated"/"Needs improvement" status displays correctly
6. **Responsive Layout**: Test the layout at different screen sizes to ensure it adapts properly

### Next Development Sprint

1. Enhance the review workflow UI
2. Add automated tests for database operations
3. Implement search functionality across all projects

## Future Improvements

Potential enhancements to consider:

1. Add keyboard shortcuts for common actions
2. Implement drag-and-drop for reordering projects
3. Add more filtering options for the list view
4. Consider adding a compact view option that shows even more projects at once

## Application Structure

The application follows an Electron-based architecture with:
- Main process (`src/main/main.js`): Handles application lifecycle and system integration
- Renderer process (`src/renderer/`): Manages UI and user interactions
- Module system for separating concerns (e.g., `workflowManager.js`, `reviewManager.js`)

---

*Last updated: March 15, 2025*
