/**
 * Start duplicate detection process (for backward compatibility)
 * @returns {Promise<Object>} Result of the duplicate detection
 */
export function startDuplicateDetection(): Promise<Object>;
/**
 * Handle the entire duplicate detection process from start to finish
 * This function will be called directly from the Start Duplicate Detection button
 */
export function handleDuplicateDetection(): Promise<void>;
/**
 * Start reviewing duplicate projects
 */
export function startDuplicateReview(): void;
/**
 * Skip the current duplicate group
 */
export function skipDuplicateGroup(): void;
/**
 * End duplicate review
 */
export function endDuplicateReview(): void;
/**
 * Display the current duplicate group
 */
export function displayDuplicateGroup(): void;
/**
 * Set up event listeners for duplicate review buttons
 */
export function setupDuplicateReviewEventListeners(): void;
/**
 * Merge selected projects
 */
export function mergeSelectedProjects(): Promise<void>;
/**
 * Show the duplicate review container and hide other elements
 */
export function showDuplicateReviewContainer(): boolean;
export declare function isReviewingDuplicates(): boolean;
