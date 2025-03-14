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
- Enhanced duplicate detection with GPT-4o (March 14, 2025)
  * Improved accuracy in identifying potential duplicate projects
  * Better handling of similar project titles with different wording
  * Optimized similarity threshold for more reliable results

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

### Duplicate Detector UI (Immediate Priority)

The duplicate detection functionality is working correctly in the backend, but there is currently no user interface for interacting with the detected duplicates:

1. **Create Duplicate Management UI**: Develop a dedicated interface that displays detected duplicate groups
2. **Implement User Actions**: Add buttons/controls to allow users to:
   * View details of each potential duplicate
   * Select which duplicates to keep or merge
   * Dismiss false positives
3. **Improve Feedback**: Provide clear visual feedback when duplicates are detected and resolved
4. **Persistence**: Ensure user decisions about duplicates are saved and respected in future detection runs

### Testing Plan for List View

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
4. Improve duplicate detection UI and workflow (see Future Improvements)

## Future Improvements

Potential enhancements to consider:

1. Add keyboard shortcuts for common actions
2. Implement drag-and-drop for reordering projects
3. Add more filtering options for the list view
4. Consider adding a compact view option that shows even more projects at once
5. Duplicate detection enhancements:
   * Create a dedicated UI for viewing duplicate groups when the duplicate button is clicked
   * Ensure project content is visible when a user clicks on a project card in duplicate view
   * Implement a "merge mode" that allows users to select projects to merge by:
     - Filtering with search functionality
     - Selecting multiple projects from the same duplicate group
     - Previewing merged content before confirming
   * Add user review and input capabilities for the duplicate detection process

## Application Structure

The application follows an Electron-based architecture with:
- Main process (`src/main/main.js`): Handles application lifecycle and system integration
- Renderer process (`src/renderer/`): Manages UI and user interactions
- Module system for separating concerns (e.g., `workflowManager.js`, `reviewManager.js`)

---

*Last updated: March 14, 2025*
