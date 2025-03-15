// manual-sync.js
// Script to manually trigger project synchronization and reload

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database setup
let setupDatabase;
try {
  setupDatabase = require('./src/models/database').setupDatabase;
  console.log('Database module loaded successfully');
} catch (error) {
  console.error('Failed to load database module:', error);
  process.exit(1);
}

// Import ProjectManager
let ProjectManager;
try {
  ProjectManager = require('./src/utils/project/projectManager').ProjectManager;
  console.log('ProjectManager module loaded successfully');
} catch (error) {
  console.error('Failed to load ProjectManager module:', error);
  process.exit(1);
}

async function manualSync() {
  console.log('Starting manual synchronization process...');

  try {
    // Setup database
    console.log('Setting up database...');
    await setupDatabase();
    console.log('Database setup complete');

    // Initialize ProjectManager
    console.log('Initializing ProjectManager...');
    const projectManager = new ProjectManager();

    // Ensure directories exist
    console.log('Ensuring project directories exist...');
    await projectManager.ensureDirectoriesExist();

    // Force synchronization
    console.log('Forcing synchronization between filesystem and database...');
    const syncResult = await projectManager.synchronizeProjects();
    console.log('Synchronization result:', syncResult);

    // Get all projects to verify
    console.log('Verifying projects are loaded...');
    const projects = await projectManager.getAllProjects();

    // Count projects by status
    let activeCount = projects.active ? projects.active.length : 0;
    let waitingCount = projects.waiting ? projects.waiting.length : 0;
    let somedayCount = projects.someday ? projects.someday.length : 0;
    let archiveCount = projects.archive ? projects.archive.length : 0;
    let totalCount = activeCount + waitingCount + somedayCount + archiveCount;

    console.log('Projects loaded:');
    console.log(`- Active: ${activeCount}`);
    console.log(`- Waiting: ${waitingCount}`);
    console.log(`- Someday: ${somedayCount}`);
    console.log(`- Archive: ${archiveCount}`);
    console.log(`- Total: ${totalCount}`);

    console.log('Manual synchronization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during manual synchronization:', error);
    process.exit(1);
  }
}

// Run the sync process
manualSync();
