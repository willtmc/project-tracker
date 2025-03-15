const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs').promises;

// Load environment variables
dotenv.config();

// Import database and project manager
const { setupDatabase, Project } = require('./src/models/database');
const { ProjectManager } = require('./src/utils');

async function restoreProjects() {
  console.log('Starting project restoration process...');

  try {
    // Step 1: Set up the database
    console.log('Setting up database...');
    await setupDatabase();
    console.log('Database setup complete');

    // Step 2: Initialize project manager
    console.log('Initializing project manager...');
    const projectManager = new ProjectManager();

    // Step 3: Ensure project directories exist
    console.log('Checking project directories...');
    await projectManager.ensureDirectoriesExist();

    // Step 4: Count projects in database
    const dbProjects = await Project.findAll();
    console.log(`Found ${dbProjects.length} projects in database`);

    // Step 5: Force synchronization
    console.log('Forcing synchronization between filesystem and database...');
    const syncResult = await projectManager.synchronizeProjects();
    console.log('Synchronization result:', syncResult);

    // Step 6: Verify projects are loaded
    console.log('Verifying projects are loaded...');
    const projects = await projectManager.getAllProjects();

    // Count projects by status
    let totalProjects = 0;
    for (const [status, statusProjects] of Object.entries(projects)) {
      console.log(`${status} projects: ${statusProjects.length}`);
      totalProjects += statusProjects.length;
    }

    console.log(`Total projects: ${totalProjects}`);
    console.log('Project restoration complete!');

    return {
      success: true,
      totalProjects,
      projectsByStatus: Object.entries(projects).map(([status, projects]) => ({
        status,
        count: projects.length,
      })),
    };
  } catch (error) {
    console.error('Error restoring projects:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the restoration process
restoreProjects()
  .then(result => {
    console.log('Restoration process finished with result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Restoration process failed:', error);
    process.exit(1);
  });
