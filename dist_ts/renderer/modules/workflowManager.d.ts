/**
 * Initialize workflow manager
 */
export function initialize(): void;
/**
 * Start the complete workflow process
 * This initiates the three-phase review process:
 * 1. Duplicate Detection
 * 2. Project Sorting
 * 3. Well-Formulation
 */
export function startWorkflow(): Promise<void>;
/**
 * Move to the next workflow step
 */
export function moveToNextWorkflowStep(): Promise<void>;
/**
 * Complete the workflow process
 */
export function completeWorkflow(): void;
/**
 * Execute the next phase after user confirmation
 */
export function executeNextPhase(): void;
/**
 * Show the phase completion modal
 * @param {string} title - The title for the modal
 * @param {string} message - The message to display
 * @param {string} nextPhaseText - Text for the next phase button
 */
export function showPhaseCompletionModal(title: string, message: string, nextPhaseText?: string): void;
/**
 * Hide the phase completion modal
 */
export function hidePhaseCompletionModal(): void;
export namespace WORKFLOW_STEPS {
    let DUPLICATE_DETECTION: string;
    let PROJECT_SORTING: string;
    let WELL_FORMULATION: string;
    let COMPLETED: string;
}
export function getDuplicateDetector(): any;
export function getReviewManager(): any;
export function getWellFormulationManager(): any;
export declare function getCurrentWorkflowStep(): any;
export declare function isWorkflowInProgress(): boolean;
export declare function resetWorkflow(): void;
