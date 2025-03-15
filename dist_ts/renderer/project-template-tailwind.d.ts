/**
 * Project Tracker - Project Item Template
 *
 * This file contains functions for creating project item elements in the UI.
 * The main function createProjectItem generates a project card that adapts to both
 * grid and list views based on the user's selected view mode.
 *
 * Recent changes:
 * - Optimized layout for list view to be more compact and horizontally oriented
 * - Added green "Well formulated" status with icon
 * - Improved button styling and positioning
 * - Ensured consistent spacing and alignment in both grid and list views
 *
 * TODO for next session:
 * - Test all button functionality:
 *   - Open button should open the project modal
 *   - Move to Waiting button should move active projects to waiting tab
 *   - Restore button should restore archived projects
 * - Verify that the entire card is clickable and opens the project modal
 * - Check that the status indicator (Well formulated/Needs improvement) displays correctly
 */
/**
 * Creates a project item HTML element with Tailwind CSS classes
 * @param {Object} project - The project data
 * @param {string} tabId - The ID of the tab this project belongs to
 * @returns {HTMLElement} - The project item element
 */
export function createProjectItem(project: Object, tabId: string): HTMLElement;
/**
 * Creates a notification element
 * @param {string} message - The notification message
 * @param {string} type - The type of notification (success, error, info)
 * @returns {HTMLElement} - The notification element
 */
export function createNotification(message: string, type?: string): HTMLElement;
