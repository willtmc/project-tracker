/**
 * Initialize UI elements
 */
export function initializeUI(): void;
/**
 * Render projects to a container
 * @param {Array} projects The projects to render
 * @param {HTMLElement} container The container to render to
 */
export function renderProjects(projects: any[], container: HTMLElement): void;
/**
 * Open project modal
 * @param {Object} project The project to open
 */
export function openProjectModal(project: Object): void;
/**
 * Close project modal
 */
export function closeModal(): void;
/**
 * Show notification
 * @param {string} message The notification message
 * @param {string} type The notification type (info, success, warning, error)
 * @param {number} duration The notification duration in milliseconds
 */
export function showNotification(message: string, type?: string, duration?: number): void;
