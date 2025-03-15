/**
 * Initialize review elements
 */
export function initializeReviewElements(): void;
/**
 * Start the project review process
 */
export function startProjectReview(): void;
/**
 * Move to the next project in the review
 */
export function moveToNextProject(): void;
/**
 * Cancel the review process
 */
export function cancelReview(): void;
/**
 * Show the waiting input dialog for a project
 * @param {Object} project The project to move to waiting
 */
export function showWaitingInputDialog(project: Object): void;
/**
 * Set up review event listeners
 */
export function setupReviewEventListeners(): void;
/**
 * Get the current project being reviewed
 * @returns {Object|null} The current project or null if not in review mode
 */
export function getCurrentReviewProject(): Object | null;
/**
 * Check if in review mode
 * @returns {boolean} True if in review mode, false otherwise
 */
export function isReviewMode(): boolean;
/**
 * Start reviewing duplicate projects
 */
export function startDuplicateReview(): Promise<boolean>;
/**
 * Find potential duplicate projects
 * @returns {Promise<boolean>} True if duplicates were found, false otherwise
 */
export function findDuplicateProjects(): Promise<boolean>;
/**
 * Display the current duplicate group
 */
export function displayDuplicateGroup(): void;
/**
 * Merge the current duplicate group
 */
export function mergeDuplicateProjects(): Promise<void>;
/**
 * Skip the current duplicate group
 */
export function skipDuplicateGroup(): void;
/**
 * Move to the next duplicate group
 */
export function moveToNextDuplicateGroup(): void;
/**
 * End the duplicate review process
 */
export function endDuplicateReview(): void;
/**
 * Handle keyboard events during review mode
 * @param {KeyboardEvent} event The keyboard event
 */
export function handleReviewKeydown(event: KeyboardEvent): void;
