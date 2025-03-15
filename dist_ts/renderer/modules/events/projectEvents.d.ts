/**
 * Create a new project
 */
export function createNewProject(): void;
/**
 * Save the current project
 */
export function saveProject(): Promise<void>;
/**
 * Close the project modal
 */
export function closeProjectModal(): void;
/**
 * Setup project event listeners
 */
export function setupProjectEventListeners(): void;
export let isFormDirty: boolean;
export let isProjectModalOpen: boolean;
