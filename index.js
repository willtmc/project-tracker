// Main entry point for Electron app
const { app } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
let squirrelStartup = false;
try {
  squirrelStartup = require('electron-squirrel-startup');
} catch (e) {
  // Module might not be available on all platforms
  console.log('electron-squirrel-startup not available');
}

if (squirrelStartup) {
  app.quit();
}

// In development mode, reload the app when source files change
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    console.log('electron-reload error:', e);
  }
}

// Import the main process file
require('./src/main/main');
