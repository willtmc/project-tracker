/**
 * Initialize the application
 */
export function initialize(): Promise<void>;
/**
 * Load and render projects
 */
export function loadAndRenderProjects(): Promise<void>;
/**
 * Process projects for well-formulated status
 * @param {Object} projects The projects object with categories
 */
export function processProjectsForWellFormulated(projects: Object): void;
/**
 * Render projects by category
 * @param {Object} projects The projects object with categories
 */
export function renderProjectsByCategory(projects: Object): void;
/**
 * Set up the debug panel for logging
 */
export function setupDebugPanel(): void;
