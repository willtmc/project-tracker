/**
 * Database Error IPC Handlers
 * 
 * This module provides IPC handlers for database error recovery operations.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dbErrorHandler = require('../../models/dbErrorHandler');
const database = require('../../models/database');
const logger = require('../utils/logger');

/**
 * Initialize database error IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function initializeDatabaseErrorHandlers(mainWindow) {
  logger.info('Initializing database error IPC handlers');

  // Handler for retrying failed database operations
  ipcMain.handle('retry-database-operation', async (event) => {
    logger.info('Received request to retry database operation');
    
    try {
      // Attempt to reconnect to the database
      await database.authenticate();
      
      // Check if there's a pending operation to retry
      const pendingOperation = dbErrorHandler.getPendingOperation();
      
      if (!pendingOperation) {
        logger.info('No pending database operation to retry');
        return { success: true, message: 'Database connection restored' };
      }
      
      // Retry the pending operation
      logger.info(`Retrying pending database operation: ${pendingOperation.type}`);
      const result = await dbErrorHandler.retryPendingOperation();
      
      return { 
        success: true, 
        message: 'Database operation completed successfully',
        result
      };
    } catch (error) {
      logger.error('Failed to retry database operation:', error);
      
      // Notify renderer about the error
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('database-error', {
          title: 'Retry Failed',
          message: `Failed to retry database operation: ${error.message}`,
          canRetry: true,
          canRestore: true
        });
      }
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  // Handler for restoring database from backup
  ipcMain.handle('restore-database-from-backup', async (event) => {
    logger.info('Received request to restore database from backup');
    
    try {
      // Attempt to restore the database from backup
      const result = await dbErrorHandler.restoreFromLatestBackup();
      
      if (result.success) {
        logger.info('Database restored successfully from backup');
        
        // Reinitialize database connection
        await database.setupDatabase();
        
        // Notify renderer about successful restoration
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('database-restored', {
            message: 'Database has been restored from backup'
          });
        }
        
        return { 
          success: true, 
          message: 'Database restored successfully',
          backupDate: result.backupDate
        };
      } else {
        throw new Error(result.error || 'Failed to restore database from backup');
      }
    } catch (error) {
      logger.error('Failed to restore database from backup:', error);
      
      // Notify renderer about the error
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('database-error', {
          title: 'Restore Failed',
          message: `Failed to restore database: ${error.message}`,
          canRetry: false,
          canRestore: false
        });
      }
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  });

  // Handler for database error notifications
  ipcMain.on('notify-database-error', (event, errorData) => {
    logger.info('Received database error notification');
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('database-error', errorData);
    }
  });

  logger.info('Database error IPC handlers initialized');
}

/**
 * Send database error notification to renderer
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 * @param {Object} errorData - Error data to send to renderer
 */
function sendDatabaseErrorNotification(mainWindow, errorData) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    logger.warn('Cannot send database error notification: Main window not available');
    return;
  }
  
  logger.info('Sending database error notification to renderer');
  
  mainWindow.webContents.send('database-error', {
    title: errorData.title || 'Database Error',
    message: errorData.message || 'An error occurred while accessing the database',
    canRetry: errorData.canRetry !== false,
    canRestore: errorData.canRestore !== false
  });
}

module.exports = {
  initializeDatabaseErrorHandlers,
  sendDatabaseErrorNotification
}; 