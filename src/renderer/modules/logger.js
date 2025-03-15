// Simple logger utility for debugging the renderer process
const fs = require('fs');
const path = require('path');
const { remote } = require('electron');

// Create a log file in the app directory
let logPath;
try {
  // Get app directory
  const appDir = process.cwd();
  logPath = path.join(appDir, 'renderer-debug.log');
} catch (e) {
  // Fallback to temp directory
  logPath = path.join(__dirname, 'renderer-debug.log');
}

// Override console methods to write to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Create write stream
let logStream;
try {
  logStream = fs.createWriteStream(logPath, { flags: 'a' });

  // Add timestamp to beginning of log
  const timestamp = new Date().toISOString();
  logStream.write(
    `\n\n----- LOGGING SESSION STARTED AT ${timestamp} -----\n\n`
  );
} catch (e) {
  // If we can't create log file, just log to console
  console.error('Failed to create log file:', e);
}

// Helper to format args for logging
function formatArgs(args) {
  return args
    .map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return `[Object that couldn't be stringified]`;
        }
      }
      return String(arg);
    })
    .join(' ');
}

// Override console.log
console.log = function () {
  // Call original function
  originalConsoleLog.apply(console, arguments);

  // Write to log file
  if (logStream) {
    const timestamp = new Date().toISOString();
    const message = formatArgs(Array.from(arguments));
    logStream.write(`[${timestamp}] [LOG] ${message}\n`);
  }
};

// Override console.error
console.error = function () {
  // Call original function
  originalConsoleError.apply(console, arguments);

  // Write to log file
  if (logStream) {
    const timestamp = new Date().toISOString();
    const message = formatArgs(Array.from(arguments));
    logStream.write(`[${timestamp}] [ERROR] ${message}\n`);
  }
};

// Override console.warn
console.warn = function () {
  // Call original function
  originalConsoleWarn.apply(console, arguments);

  // Write to log file
  if (logStream) {
    const timestamp = new Date().toISOString();
    const message = formatArgs(Array.from(arguments));
    logStream.write(`[${timestamp}] [WARN] ${message}\n`);
  }
};

// Export some additional logging functions
module.exports = {
  log: console.log,
  error: console.error,
  warn: console.warn,

  // Debug specific component
  debug: function (component, ...args) {
    const message = `[${component}] ${formatArgs(args)}`;
    console.log(message);
  },

  // Log with custom level
  logWithLevel: function (level, ...args) {
    const timestamp = new Date().toISOString();
    const message = formatArgs(args);
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(formattedMessage);

    if (logStream) {
      logStream.write(`${formattedMessage}\n`);
    }
  },

  // Close log stream on app exit
  close: function () {
    if (logStream) {
      const timestamp = new Date().toISOString();
      logStream.write(
        `\n----- LOGGING SESSION ENDED AT ${timestamp} -----\n\n`
      );
      logStream.end();
    }
  },
};
