/**
 * Check if a project is well-formulated
 * @param {Object} project The project to check
 * @returns {boolean} Whether the project is well-formulated
 */
export function isProjectWellFormulated(project: Object): boolean;
/**
 * Format date for display
 * @param {Date|string} date The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date: Date | string): string;
/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func The function to debounce
 * @param {number} wait The wait time in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func: Function, wait?: number): Function;
/**
 * Escape HTML to prevent XSS
 * @param {string} html The HTML string to escape
 * @returns {string} The escaped HTML string
 */
export function escapeHtml(html: string): string;
/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
export function generateId(): string;
/**
 * Check if a project title starts with an action verb
 * @param {string} title The project title to check
 * @returns {boolean} Whether the title starts with an action verb
 */
export function checkTitleHasAction(title: string): boolean;
