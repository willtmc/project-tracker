/**
 * Initialize database error UI components
 */
export function initializeDatabaseErrorUI(): void;
/**
 * Show the database error modal
 * @param {string} title - The title of the error
 * @param {string} message - The error message
 * @param {boolean} canRetry - Whether the operation can be retried
 * @param {boolean} canRestore - Whether a backup can be restored
 */
export function showDatabaseErrorModal(title: string, message: string, canRetry?: boolean, canRestore?: boolean): void;
/**
 * Hide the database error modal
 */
export function hideDatabaseErrorModal(): void;
