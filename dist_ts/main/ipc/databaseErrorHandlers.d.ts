/**
 * Initialize database error IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
export function initializeDatabaseErrorHandlers(mainWindow: Electron.BrowserWindow): void;
/**
 * Send database error notification to renderer
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 * @param {Object} errorData - Error data to send to renderer
 */
export function sendDatabaseErrorNotification(mainWindow: Electron.BrowserWindow, errorData: Object): void;
