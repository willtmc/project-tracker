/**
 * Unit tests for the Database Error IPC Handlers module
 */

// Mock dependencies
const { ipcMain } = require('electron');
const dbErrorHandler = require('../src/models/dbErrorHandler');
const database = require('../src/models/database');

// Mock electron
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
}));

// Mock the logger to avoid console output during tests
jest.mock('../src/main/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock database module
jest.mock('../src/models/database', () => ({
  authenticate: jest.fn(),
  setupDatabase: jest.fn(),
}));

// Mock dbErrorHandler module
jest.mock('../src/models/dbErrorHandler', () => ({
  getPendingOperation: jest.fn(),
  retryPendingOperation: jest.fn(),
  restoreFromLatestBackup: jest.fn(),
}));

// Import the module under test
const {
  initializeDatabaseErrorHandlers,
  sendDatabaseErrorNotification,
} = require('../src/main/ipc/databaseErrorHandlers');

describe('Database Error IPC Handlers', () => {
  // Create a mock main window for testing
  const mockMainWindow = {
    isDestroyed: jest.fn(() => false),
    webContents: {
      send: jest.fn(),
    },
  };

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabaseErrorHandlers', () => {
    it('should register all required IPC handlers', () => {
      // Execute
      initializeDatabaseErrorHandlers(mockMainWindow);

      // Verify
      expect(ipcMain.handle).toHaveBeenCalledTimes(2);
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'retry-database-operation',
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        'restore-database-from-backup',
        expect.any(Function)
      );
      expect(ipcMain.on).toHaveBeenCalledWith(
        'notify-database-error',
        expect.any(Function)
      );
    });

    it('should handle retry-database-operation successfully', async () => {
      // Setup
      let retryHandler;
      ipcMain.handle.mockImplementation((channel, handler) => {
        if (channel === 'retry-database-operation') {
          retryHandler = handler;
        }
      });

      database.authenticate.mockResolvedValue();
      dbErrorHandler.getPendingOperation.mockReturnValue({
        type: 'findAll',
        model: 'Project',
      });
      dbErrorHandler.retryPendingOperation.mockResolvedValue({
        success: true,
        result: [{ id: 1 }],
      });

      // Initialize to get the handler
      initializeDatabaseErrorHandlers(mockMainWindow);

      // Execute the handler
      const result = await retryHandler({});

      // Verify
      expect(database.authenticate).toHaveBeenCalled();
      expect(dbErrorHandler.getPendingOperation).toHaveBeenCalled();
      expect(dbErrorHandler.retryPendingOperation).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Database operation completed successfully',
        result: { success: true, result: [{ id: 1 }] },
      });
    });

    it('should handle retry-database-operation with no pending operation', async () => {
      // Setup
      let retryHandler;
      ipcMain.handle.mockImplementation((channel, handler) => {
        if (channel === 'retry-database-operation') {
          retryHandler = handler;
        }
      });

      database.authenticate.mockResolvedValue();
      dbErrorHandler.getPendingOperation.mockReturnValue(null);

      // Initialize to get the handler
      initializeDatabaseErrorHandlers(mockMainWindow);

      // Execute the handler
      const result = await retryHandler({});

      // Verify
      expect(database.authenticate).toHaveBeenCalled();
      expect(dbErrorHandler.getPendingOperation).toHaveBeenCalled();
      expect(dbErrorHandler.retryPendingOperation).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Database connection restored',
      });
    });

    it('should handle retry-database-operation failure', async () => {
      // Setup
      let retryHandler;
      ipcMain.handle.mockImplementation((channel, handler) => {
        if (channel === 'retry-database-operation') {
          retryHandler = handler;
        }
      });

      database.authenticate.mockRejectedValue(new Error('Connection failed'));

      // Initialize to get the handler
      initializeDatabaseErrorHandlers(mockMainWindow);

      // Execute the handler
      const result = await retryHandler({});

      // Verify
      expect(database.authenticate).toHaveBeenCalled();
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'database-error',
        expect.any(Object)
      );
      expect(result).toEqual({
        success: false,
        error: 'Connection failed',
      });
    });
  });

  describe('sendDatabaseErrorNotification', () => {
    it('should send error notification to renderer', () => {
      // Setup
      const errorData = {
        title: 'Test Error',
        message: 'Test error message',
        canRetry: true,
        canRestore: true,
      };

      // Execute
      sendDatabaseErrorNotification(mockMainWindow, errorData);

      // Verify
      expect(mockMainWindow.isDestroyed).toHaveBeenCalled();
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'database-error',
        errorData
      );
    });

    it('should not send notification if window is destroyed', () => {
      // Setup
      mockMainWindow.isDestroyed.mockReturnValueOnce(true);

      // Execute
      sendDatabaseErrorNotification(mockMainWindow, { title: 'Test' });

      // Verify
      expect(mockMainWindow.isDestroyed).toHaveBeenCalled();
      expect(mockMainWindow.webContents.send).not.toHaveBeenCalled();
    });

    it('should not send notification if window is null', () => {
      // Execute
      sendDatabaseErrorNotification(null, { title: 'Test' });

      // Verify
      expect(mockMainWindow.webContents.send).not.toHaveBeenCalled();
    });

    it('should use default values for missing error properties', () => {
      // Setup
      const errorData = {
        // Missing title and message
      };

      // Execute
      sendDatabaseErrorNotification(mockMainWindow, errorData);

      // Verify
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'database-error',
        {
          title: 'Database Error',
          message: 'An error occurred while accessing the database',
          canRetry: true,
          canRestore: true,
        }
      );
    });
  });
});
