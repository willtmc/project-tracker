/**
 * Database Error Handler
 * 
 * This module provides error handling, logging, and recovery mechanisms for database operations.
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOG_FILE_PATH = path.join(__dirname, '../../logs/database-errors.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log a database error to file
 * @param {Error} error - The error to log
 * @param {string} operation - The operation that caused the error
 * @param {Object} context - Additional context information
 */
function logDatabaseError(error, operation, context = {}) {
  const timestamp = new Date().toISOString();
  const errorMessage = error.toString();
  const stackTrace = error.stack || 'No stack trace available';
  
  const logEntry = {
    timestamp,
    operation,
    errorMessage,
    stackTrace,
    context
  };
  
  const logString = JSON.stringify(logEntry, null, 2) + '\n\n';
  
  try {
    fs.appendFileSync(LOG_FILE_PATH, logString);
    console.error(`Database error logged to ${LOG_FILE_PATH}`);
  } catch (logError) {
    console.error('Failed to log database error to file:', logError);
    console.error('Original error:', errorMessage);
  }
}

/**
 * Create a backup of the database
 * @param {string} dbPath - Path to the database file
 * @returns {Promise<string>} - Path to the backup file
 */
async function createDatabaseBackup(dbPath) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);
  
  try {
    // Check if source database exists
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Source database file not found: ${dbPath}`);
    }
    
    // Copy the database file
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Database backup created at ${backupPath}`);
    
    // Clean up old backups (keep last 5)
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('database-backup-'))
      .map(file => path.join(backupDir, file))
      .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
    
    if (backups.length > 5) {
      backups.slice(5).forEach(oldBackup => {
        try {
          fs.unlinkSync(oldBackup);
          console.log(`Removed old backup: ${oldBackup}`);
        } catch (error) {
          console.error(`Failed to remove old backup ${oldBackup}:`, error);
        }
      });
    }
    
    return backupPath;
  } catch (error) {
    console.error('Error creating database backup:', error);
    logDatabaseError(error, 'createDatabaseBackup', { dbPath });
    throw error;
  }
}

/**
 * Restore database from backup
 * @param {string} backupPath - Path to the backup file
 * @param {string} dbPath - Path to the database file
 * @returns {Promise<boolean>} - Whether the restore was successful
 */
async function restoreDatabaseFromBackup(backupPath, dbPath) {
  try {
    // Check if backup exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Copy the backup file to the database location
    fs.copyFileSync(backupPath, dbPath);
    console.log(`Database restored from backup ${backupPath}`);
    
    return true;
  } catch (error) {
    console.error('Error restoring database from backup:', error);
    logDatabaseError(error, 'restoreDatabaseFromBackup', { backupPath, dbPath });
    return false;
  }
}

/**
 * Check database integrity
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Promise<boolean>} - Whether the database is intact
 */
async function checkDatabaseIntegrity(sequelize) {
  try {
    // Try to authenticate with the database
    await sequelize.authenticate();
    
    // Run a simple query to check if the database is responsive
    await sequelize.query('PRAGMA integrity_check');
    
    return true;
  } catch (error) {
    console.error('Database integrity check failed:', error);
    logDatabaseError(error, 'checkDatabaseIntegrity');
    return false;
  }
}

/**
 * Retry a database operation with exponential backoff
 * @param {Function} operation - The database operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise<any>} - Result of the operation
 */
async function retryOperation(operation, maxRetries = MAX_RETRY_ATTEMPTS, delay = RETRY_DELAY_MS) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        // Wait with exponential backoff before retrying
        const retryDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // If we get here, all retry attempts failed
  logDatabaseError(lastError, 'retryOperation', { maxRetries, delay });
  throw lastError;
}

/**
 * Safely execute a database operation with error handling and retries
 * @param {Function} operation - The database operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} context - Additional context information
 * @returns {Promise<any>} - Result of the operation
 */
async function safeDbOperation(operation, operationName, context = {}) {
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.error(`Database operation '${operationName}' failed after retries:`, error);
    logDatabaseError(error, operationName, context);
    
    // Rethrow with a more user-friendly message
    const userError = new Error(`Database operation failed: ${operationName}. Please try again later.`);
    userError.originalError = error;
    throw userError;
  }
}

// Schedule regular database backups
function scheduleRegularBackups(dbPath) {
  // Create initial backup
  createDatabaseBackup(dbPath).catch(error => {
    console.error('Failed to create initial database backup:', error);
  });
  
  // Schedule regular backups
  setInterval(() => {
    createDatabaseBackup(dbPath).catch(error => {
      console.error('Failed to create scheduled database backup:', error);
    });
  }, BACKUP_INTERVAL_MS);
}

module.exports = {
  logDatabaseError,
  createDatabaseBackup,
  restoreDatabaseFromBackup,
  checkDatabaseIntegrity,
  retryOperation,
  safeDbOperation,
  scheduleRegularBackups
}; 