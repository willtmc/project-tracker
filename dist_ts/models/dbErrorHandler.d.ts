/**
 * Create a backup of the database
 * @returns {Promise<Object>} Result of the backup operation
 */
export function createBackup(): Promise<Object>;
/**
 * Restore database from the latest backup
 * @returns {Promise<Object>} Result of the restore operation
 */
export function restoreFromLatestBackup(): Promise<Object>;
/**
 * Check if the database file is valid and not corrupted
 * @returns {Promise<boolean>} True if database is valid, false otherwise
 */
export function isDatabaseValid(): Promise<boolean>;
/**
 * Store a pending operation for retry
 * @param {string} type - The type of operation (findByPk, findAll, create, update, destroy)
 * @param {string} model - The model name
 * @param {Object} params - The operation parameters
 */
export function storePendingOperation(type: string, model: string, params: Object): void;
/**
 * Get the current pending operation
 * @returns {Object|null} The pending operation or null if none exists
 */
export function getPendingOperation(): Object | null;
/**
 * Clear the pending operation
 */
export function clearPendingOperation(): void;
/**
 * Retry the pending operation
 * @returns {Promise<Object>} Result of the retry operation
 */
export function retryPendingOperation(): Promise<Object>;
/**
 * Safely execute a database operation with error handling
 * @param {Function} operation - The database operation to execute
 * @param {string} operationType - The type of operation (findByPk, findAll, create, update, destroy)
 * @param {string} modelName - The model name
 * @param {Object} params - The operation parameters
 * @returns {Promise<any>} The result of the operation
 */
export function safeDbOperation(operation: Function, operationType: string, modelName: string, params: Object): Promise<any>;
