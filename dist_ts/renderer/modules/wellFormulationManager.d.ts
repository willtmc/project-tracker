/**
 * Initialize well-formulation elements
 */
export function initializeWellFormulationElements(): void;
/**
 * Set up well-formulation event listeners
 */
export function setupWellFormulationEventListeners(): void;
/**
 * Start the well-formulation check process
 */
export function startWellFormulationCheck(): Promise<void>;
/**
 * Reformulate the current project
 */
export function reformulateCurrentProject(): Promise<void>;
/**
 * Complete the well-formulation check process
 */
export function completeWellFormulationCheck(): void;
/**
 * Check if in well-formulation mode
 * @returns {boolean} True if in well-formulation mode, false otherwise
 */
export function isWellFormulationMode(): boolean;
/**
 * Find projects that need improvement in their formulation
 * @param {Array} projects - The list of projects to check
 * @returns {Array} - Projects that need improvement
 */
export function findProjectsNeedingImprovement(projects: any[]): any[];
