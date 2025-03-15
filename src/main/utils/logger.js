/**
 * Logger Module
 *
 * This module provides logging functionality for the application.
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Get the app data path
const getAppDataPath = () => {
  try {
    return app.getPath('userData');
  } catch (error) {
    // If app is not ready, use a default path
    return path.join(process.cwd(), 'logs');
  }
};

// Create logs directory if it doesn't exist
const logsDir = path.join(getAppDataPath(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create logs directory:', error);
}

// Log file paths
const LOG_FILE = path.join(logsDir, 'app.log');
const ERROR_LOG_FILE = path.join(logsDir, 'error.log');

/**
 * Write a log entry to file
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
function writeToLogFile(level, message, data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // Write to main log file
    fs.appendFileSync(LOG_FILE, logString);

    // Also write errors to error log
    if (level === 'error') {
      fs.appendFileSync(ERROR_LOG_FILE, logString);
    }
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
function info(message, data) {
  console.log(`[INFO] ${message}`);
  writeToLogFile('info', message, data);
}

/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
function warn(message, data) {
  console.warn(`[WARN] ${message}`);
  writeToLogFile('warn', message, data);
}

/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Error|Object} [error] - Error object or additional data
 */
function error(message, error) {
  console.error(`[ERROR] ${message}`);

  let errorData = {};

  if (error instanceof Error) {
    errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    errorData = error;
  }

  writeToLogFile('error', message, errorData);
}

module.exports = {
  info,
  warn,
  error,
};
