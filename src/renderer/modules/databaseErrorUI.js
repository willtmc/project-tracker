/**
 * Database Error UI Module
 * 
 * This module provides UI components for handling database errors and recovery.
 */

const { ipcRenderer } = require('electron');
const uiManager = require('./uiManager');

// Database error modal elements
let dbErrorModal;
let dbErrorTitle;
let dbErrorMessage;
let dbErrorRetryBtn;
let dbErrorRestoreBtn;
let dbErrorCloseBtn;

/**
 * Initialize database error UI components
 */
function initializeDatabaseErrorUI() {
  console.log('Initializing database error UI');
  
  // Create database error modal if it doesn't exist
  if (!document.getElementById('database-error-modal')) {
    createDatabaseErrorModal();
  }
  
  // Get database error modal elements
  dbErrorModal = document.getElementById('database-error-modal');
  dbErrorTitle = document.getElementById('database-error-title');
  dbErrorMessage = document.getElementById('database-error-message');
  dbErrorRetryBtn = document.getElementById('database-error-retry-btn');
  dbErrorRestoreBtn = document.getElementById('database-error-restore-btn');
  dbErrorCloseBtn = document.getElementById('database-error-close-btn');
  
  // Set up event listeners
  if (dbErrorRetryBtn) {
    dbErrorRetryBtn.addEventListener('click', () => {
      hideDatabaseErrorModal();
      retryFailedOperation();
    });
  }
  
  if (dbErrorRestoreBtn) {
    dbErrorRestoreBtn.addEventListener('click', () => {
      hideDatabaseErrorModal();
      restoreFromBackup();
    });
  }
  
  if (dbErrorCloseBtn) {
    dbErrorCloseBtn.addEventListener('click', () => {
      hideDatabaseErrorModal();
    });
  }
  
  // Register IPC handlers
  ipcRenderer.on('database-error', (event, { title, message, canRetry, canRestore }) => {
    showDatabaseErrorModal(title, message, canRetry, canRestore);
  });
  
  console.log('Database error UI initialized');
}

/**
 * Create the database error modal
 */
function createDatabaseErrorModal() {
  console.log('Creating database error modal');
  
  // Create modal element
  const modal = document.createElement('div');
  modal.id = 'database-error-modal';
  modal.className = 'modal';
  
  // Create modal content
  modal.innerHTML = `
    <div class="modal-content database-error-content">
      <h2 id="database-error-title">Database Error</h2>
      <div id="database-error-message" class="database-error-message"></div>
      <div class="database-error-actions">
        <button id="database-error-retry-btn" class="btn btn-primary">Retry Operation</button>
        <button id="database-error-restore-btn" class="btn btn-warning">Restore from Backup</button>
        <button id="database-error-close-btn" class="btn btn-secondary">Close</button>
      </div>
    </div>
  `;
  
  // Add modal to the document
  document.body.appendChild(modal);
  
  // Add CSS for the modal
  const style = document.createElement('style');
  style.textContent = `
    .database-error-content {
      max-width: 500px;
    }
    
    .database-error-message {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #dc3545;
      border-radius: 4px;
    }
    
    .database-error-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);
  
  console.log('Database error modal created');
}

/**
 * Show the database error modal
 * @param {string} title - The title of the error
 * @param {string} message - The error message
 * @param {boolean} canRetry - Whether the operation can be retried
 * @param {boolean} canRestore - Whether a backup can be restored
 */
function showDatabaseErrorModal(title, message, canRetry = true, canRestore = true) {
  console.log('Showing database error modal:', title);
  
  if (!dbErrorModal || !dbErrorTitle || !dbErrorMessage) {
    console.error('Database error modal elements not initialized');
    uiManager.showNotification('Database error: ' + message, 'error');
    return;
  }
  
  // Set modal content
  dbErrorTitle.textContent = title || 'Database Error';
  dbErrorMessage.innerHTML = message || 'An error occurred while accessing the database.';
  
  // Show/hide buttons based on capabilities
  if (dbErrorRetryBtn) {
    dbErrorRetryBtn.style.display = canRetry ? 'block' : 'none';
  }
  
  if (dbErrorRestoreBtn) {
    dbErrorRestoreBtn.style.display = canRestore ? 'block' : 'none';
  }
  
  // Show modal
  dbErrorModal.style.display = 'flex';
}

/**
 * Hide the database error modal
 */
function hideDatabaseErrorModal() {
  console.log('Hiding database error modal');
  
  if (dbErrorModal) {
    dbErrorModal.style.display = 'none';
  }
}

/**
 * Retry the failed database operation
 */
function retryFailedOperation() {
  console.log('Retrying failed database operation');
  
  // Show loading notification
  uiManager.showNotification('Retrying database operation...', 'info');
  
  // Send retry request to main process
  ipcRenderer.invoke('retry-database-operation')
    .then(result => {
      if (result.success) {
        uiManager.showNotification('Database operation completed successfully', 'success');
      } else {
        uiManager.showNotification('Failed to retry database operation: ' + result.error, 'error');
      }
    })
    .catch(error => {
      console.error('Error retrying database operation:', error);
      uiManager.showNotification('Error retrying database operation', 'error');
    });
}

/**
 * Restore the database from backup
 */
function restoreFromBackup() {
  console.log('Restoring database from backup');
  
  // Show loading notification
  uiManager.showNotification('Restoring database from backup...', 'info');
  
  // Send restore request to main process
  ipcRenderer.invoke('restore-database-from-backup')
    .then(result => {
      if (result.success) {
        uiManager.showNotification('Database restored successfully', 'success');
      } else {
        uiManager.showNotification('Failed to restore database: ' + result.error, 'error');
      }
    })
    .catch(error => {
      console.error('Error restoring database:', error);
      uiManager.showNotification('Error restoring database', 'error');
    });
}

// Export functions for use in other modules
module.exports = {
  initializeDatabaseErrorUI,
  showDatabaseErrorModal,
  hideDatabaseErrorModal
}; 