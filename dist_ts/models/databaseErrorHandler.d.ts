/**
 * Log a database error to file
 * @param {Error} error - The error to log
 * @param {string} operation - The operation that caused the error
 * @param {Object} context - Additional context information
 */
export function logDatabaseError(error: Error, operation: string, context?: Object): void;
/**
 * Create a backup of the database
 * @param {string} dbPath - Path to the database file
 * @returns {Promise<string>} - Path to the backup file
 */
export function createDatabaseBackup(dbPath: string): Promise<string>;
/**
 * Restore database from backup
 * @param {string} backupPath - Path to the backup file
 * @param {string} dbPath - Path to the database file
 * @returns {Promise<boolean>} - Whether the restore was successful
 */
export function restoreDatabaseFromBackup(backupPath: string, dbPath: string): Promise<boolean>;
/**
 * Check database integrity
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Promise<boolean>} - Whether the database is intact
 */
export function checkDatabaseIntegrity(sequelize: Sequelize): Promise<boolean>;
/**
 * Retry a database operation with exponential backoff
 * @param {Function} operation - The database operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise<any>} - Result of the operation
 */
export function retryOperation(operation: Function, maxRetries?: number, delay?: number): Promise<any>;
/**
 * Safely execute a database operation with error handling and retries
 * @param {Function} operation - The database operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} context - Additional context information
 * @returns {Promise<any>} - Result of the operation
 */
export function safeDbOperation(operation: Function, operationName: string, context?: Object): Promise<any>;
export function scheduleRegularBackups(dbPath: any): void;
import { Sequelize } from "sequelize/types/sequelize";
