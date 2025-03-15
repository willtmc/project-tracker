/**
 * Database Error Handler Module
 *
 * This module provides functions for handling database errors and recovery operations.
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const logger = require('../main/utils/logger');

// Configuration
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '5', 10);
const BACKUP_INTERVAL = parseInt(process.env.BACKUP_INTERVAL || '86400000', 10); // Default: 24 hours

// Store pending operations for retry
let pendingOperation = null;

/**
 * Create a backup of the database
 * @returns {Promise<Object>} Result of the backup operation
 */
async function createBackup() {
  logger.info('Creating database backup');

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      logger.info(`Created backup directory: ${BACKUP_DIR}`);
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `projects-${timestamp}.sqlite`);

    // Check if source database exists
    if (!fs.existsSync(DB_PATH)) {
      logger.error(`Database file not found: ${DB_PATH}`);
      return { success: false, error: 'Database file not found' };
    }

    // Copy database file to backup location
    fs.copyFileSync(DB_PATH, backupPath);
    logger.info(`Database backup created: ${backupPath}`);

    // Clean up old backups
    cleanupOldBackups();

    return {
      success: true,
      backupPath,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating database backup:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old backups, keeping only the most recent ones
 */
function cleanupOldBackups() {
  logger.info(`Cleaning up old backups, keeping ${MAX_BACKUPS} most recent`);

  try {
    // Get all backup files
    const backupFiles = fs
      .readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('projects-') && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first

    // Delete old backups
    if (backupFiles.length > MAX_BACKUPS) {
      logger.info(
        `Found ${backupFiles.length} backups, removing ${backupFiles.length - MAX_BACKUPS} old backups`
      );

      backupFiles.slice(MAX_BACKUPS).forEach(file => {
        fs.unlinkSync(file.path);
        logger.info(`Deleted old backup: ${file.path}`);
      });
    } else {
      logger.info(`Found ${backupFiles.length} backups, no cleanup needed`);
    }
  } catch (error) {
    logger.error('Error cleaning up old backups:', error);
  }
}

/**
 * Get the latest backup file
 * @returns {Object|null} Latest backup file info or null if no backups exist
 */
function getLatestBackup() {
  logger.info('Getting latest database backup');

  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      logger.warn(`Backup directory not found: ${BACKUP_DIR}`);
      return null;
    }

    // Get all backup files
    const backupFiles = fs
      .readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('projects-') && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first

    // Return the latest backup or null if no backups exist
    if (backupFiles.length > 0) {
      logger.info(`Latest backup found: ${backupFiles[0].path}`);
      return backupFiles[0];
    } else {
      logger.warn('No database backups found');
      return null;
    }
  } catch (error) {
    logger.error('Error getting latest backup:', error);
    return null;
  }
}

/**
 * Restore database from the latest backup
 * @returns {Promise<Object>} Result of the restore operation
 */
async function restoreFromLatestBackup() {
  logger.info('Restoring database from latest backup');

  try {
    // Get the latest backup
    const latestBackup = getLatestBackup();

    if (!latestBackup) {
      logger.error('No backup found to restore from');
      return { success: false, error: 'No backup found' };
    }

    // Create a backup of the current database before restoring
    const currentBackup = await createBackup();

    if (!currentBackup.success) {
      logger.warn(
        'Failed to create backup of current database before restoring'
      );
    }

    // Copy backup file to database location
    fs.copyFileSync(latestBackup.path, DB_PATH);
    logger.info(`Database restored from backup: ${latestBackup.path}`);

    return {
      success: true,
      backupDate: new Date(latestBackup.time).toISOString(),
      message: 'Database restored successfully',
    };
  } catch (error) {
    logger.error('Error restoring database from backup:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if the database file is valid and not corrupted
 * @returns {Promise<boolean>} True if database is valid, false otherwise
 */
async function isDatabaseValid() {
  logger.info('Checking database validity');

  // Check if database file exists
  if (!fs.existsSync(DB_PATH)) {
    logger.error(`Database file not found: ${DB_PATH}`);
    return false;
  }

  try {
    // Create a temporary connection to test the database
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DB_PATH,
      logging: false,
    });

    // Try to authenticate
    await sequelize.authenticate();

    // Try a simple query
    await sequelize.query('SELECT 1+1 as result');

    // Close the connection
    await sequelize.close();

    logger.info('Database is valid');
    return true;
  } catch (error) {
    logger.error('Database validation failed:', error);
    return false;
  }
}

/**
 * Store a pending operation for retry
 * @param {string} type - The type of operation (findByPk, findAll, create, update, destroy)
 * @param {string} model - The model name
 * @param {Object} params - The operation parameters
 */
function storePendingOperation(type, model, params) {
  pendingOperation = { type, model, params, timestamp: Date.now() };
  logger.info(`Stored pending operation: ${type} on ${model}`);
}

/**
 * Get the current pending operation
 * @returns {Object|null} The pending operation or null if none exists
 */
function getPendingOperation() {
  return pendingOperation;
}

/**
 * Clear the pending operation
 */
function clearPendingOperation() {
  pendingOperation = null;
  logger.info('Cleared pending operation');
}

/**
 * Retry the pending operation
 * @returns {Promise<Object>} Result of the retry operation
 */
async function retryPendingOperation() {
  if (!pendingOperation) {
    logger.warn('No pending operation to retry');
    return { success: false, error: 'No pending operation' };
  }

  logger.info(
    `Retrying pending operation: ${pendingOperation.type} on ${pendingOperation.model}`
  );

  try {
    // Import database models dynamically to avoid circular dependencies
    const db = require('./database');
    const model = db[pendingOperation.model];

    if (!model) {
      throw new Error(`Model not found: ${pendingOperation.model}`);
    }

    let result;

    // Execute the operation based on type
    switch (pendingOperation.type) {
      case 'findByPk':
        result = await model.findByPk(
          pendingOperation.params.id,
          pendingOperation.params.options
        );
        break;
      case 'findAll':
        result = await model.findAll(pendingOperation.params.options);
        break;
      case 'create':
        result = await model.create(
          pendingOperation.params.data,
          pendingOperation.params.options
        );
        break;
      case 'update':
        result = await model.update(
          pendingOperation.params.data,
          pendingOperation.params.options
        );
        break;
      case 'destroy':
        result = await model.destroy(pendingOperation.params.options);
        break;
      default:
        throw new Error(`Unknown operation type: ${pendingOperation.type}`);
    }

    // Clear the pending operation on success
    clearPendingOperation();

    return { success: true, result };
  } catch (error) {
    logger.error('Error retrying pending operation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Safely execute a database operation with error handling
 * @param {Function} operation - The database operation to execute
 * @param {string} operationType - The type of operation (findByPk, findAll, create, update, destroy)
 * @param {string} modelName - The model name
 * @param {Object} params - The operation parameters
 * @returns {Promise<any>} The result of the operation
 */
async function safeDbOperation(operation, operationType, modelName, params) {
  try {
    // Execute the operation
    const result = await operation();
    return result;
  } catch (error) {
    logger.error(`Error in database operation ${operationType}:`, error);

    // Store the operation for retry
    storePendingOperation(operationType, modelName, params);

    // Check if it's a database corruption error
    if (
      error.name === 'SequelizeDatabaseError' &&
      (error.message.includes('database disk image is malformed') ||
        error.message.includes('database is locked') ||
        error.message.includes('disk I/O error'))
    ) {
      logger.error('Database corruption detected, attempting recovery');

      // Check if database is valid
      const isValid = await isDatabaseValid();

      if (!isValid) {
        // Attempt to restore from backup
        const restoreResult = await restoreFromLatestBackup();

        if (restoreResult.success) {
          logger.info('Database restored from backup, retrying operation');

          // Retry the operation
          return await retryPendingOperation();
        }
      }
    }

    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Schedule regular database backups
 */
function scheduleRegularBackups() {
  logger.info(
    `Scheduling regular database backups every ${BACKUP_INTERVAL / (1000 * 60 * 60)} hours`
  );

  // Create initial backup
  createBackup().then(result => {
    if (result.success) {
      logger.info('Initial database backup created successfully');
    } else {
      logger.error('Failed to create initial database backup:', result.error);
    }
  });

  // Schedule regular backups
  setInterval(async () => {
    logger.info('Running scheduled database backup');

    const result = await createBackup();

    if (result.success) {
      logger.info('Scheduled database backup created successfully');
    } else {
      logger.error('Failed to create scheduled database backup:', result.error);
    }
  }, BACKUP_INTERVAL);
}

// Start scheduling backups when module is loaded
scheduleRegularBackups();

module.exports = {
  createBackup,
  restoreFromLatestBackup,
  isDatabaseValid,
  storePendingOperation,
  getPendingOperation,
  clearPendingOperation,
  retryPendingOperation,
  safeDbOperation,
};
