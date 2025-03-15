const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const os = require('os');
const { CONFIG, validateConfig } = require('../config');
const PROJECT_STATUS = require('../constants/projectStatus');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

// Load environment variables
require('dotenv').config();

// Validate configuration
validateConfig();

// Import database error handlers
const databaseErrorHandlers = require('./ipc/databaseErrorHandlers');

// Conditionally import database setup
let setupDatabase, Project, ProjectHistory;
try {
  const db = require('../models/database');
  setupDatabase = db.setupDatabase;
  Project = db.Project;
  ProjectHistory = db.ProjectHistory;
} catch (e) {
  console.error('Error loading database module:', e);
  setupDatabase = async () =>
    console.log('Database setup skipped due to error');
}

// Conditionally import project manager
let ProjectManager;
try {
  const pm = require('../utils/project/projectManager');
  ProjectManager = pm.ProjectManager;
} catch (e) {
  console.error('Error loading project manager module:', e);
  ProjectManager = class MockProjectManager {
    async getAllProjects() {
      return { active: [], waiting: [], someday: [], archive: [] };
    }
    async updateProjectStatus() {
      return { success: false, message: 'ProjectManager not available' };
    }
    async validateProject() {
      return { success: false, message: 'ProjectManager not available' };
    }
    async reformulateProject() {
      return { success: false, message: 'ProjectManager not available' };
    }
    async generateReport() {
      return { success: false, message: 'ProjectManager not available' };
    }
    async findPotentialDuplicates() {
      try {
        console.log('Main process: findPotentialDuplicates called');

        // Get all active projects
        const activeProjects = await this.getProjects({
          status: PROJECT_STATUS.ACTIVE,
        });

        if (!activeProjects.success || !activeProjects.projects) {
          return {
            success: false,
            message: 'Failed to retrieve active projects',
          };
        }

        // Use the consolidated DuplicateDetector to find potential duplicates
        const duplicateDetector = new DuplicateDetector();
        const duplicateGroups = await duplicateDetector.findPotentialDuplicates(
          activeProjects.projects
        );

        return {
          success: true,
          duplicateGroups,
        };
      } catch (error) {
        console.error('Error finding potential duplicates:', error);
        return { success: false, message: error.toString() };
      }
    }
    async mergeDuplicateProjects(projectIds) {
      const { DuplicateDetector } = require('../utils/duplicateDetector');
      try {
        if (!projectIds || !Array.isArray(projectIds) || projectIds.length < 2) {
          return {
            success: false,
            message: 'At least two project IDs are required for merging',
          };
        }

        // Get the projects by their IDs
        const projects = [];
        for (const id of projectIds) {
          try {
            const project = await this.getProjectById(id);
            if (project) {
              projects.push(project);
            }
          } catch (error) {
            console.error(`Error getting project with ID ${id}:`, error);
          }
        }

        if (projects.length < 2) {
          return {
            success: false,
            message: 'Could not find at least two valid projects to merge',
          };
        }

        // Use the DuplicateDetector to merge the projects
        const duplicateDetector = new DuplicateDetector();
        const mergedProject = await duplicateDetector.mergeProjects(projects);

        // Save the merged project
        const result = await this.saveProject(mergedProject);

        // Archive the original projects
        for (const project of projects) {
          if (project.id !== result.id) {
            await this.updateProjectStatus(project.id, 'archived');
          }
        }

        return {
          success: true,
          message: 'Projects merged successfully',
          mergedProject: result,
        };
      } catch (error) {
        console.error('Error merging duplicate projects:', error);
        return { success: false, message: error.toString() };
      }
    }
    async getProjectsWithPotentialDuplicates() {
      return { success: false, message: 'ProjectManager not available' };
    }
    async synchronizeProjects() {
      return { success: false, message: 'ProjectManager not available' };
    }
  };
}

// Conditionally import duplicate detector
let DuplicateDetector;
try {
  const dd = require('../utils/duplicateDetector');
  DuplicateDetector = dd.DuplicateDetector;
} catch (e) {
  console.error('Error loading duplicate detector module:', e);
  DuplicateDetector = class MockDuplicateDetector {
    async findPotentialDuplicates() {
      return { success: false, message: 'DuplicateDetector not available' };
    }
  };
}

let mainWindow;

// Initialize the database
try {
  setupDatabase().catch(error => {
    console.error('Error during database setup:', error);
    logger.error('Database initialization error', error);

    // Send database error notification to renderer when window is ready
    if (mainWindow) {
      databaseErrorHandlers.sendDatabaseErrorNotification(mainWindow, {
        title: 'Database Initialization Error',
        message: `Failed to initialize database: ${error.message}`,
        canRetry: true,
        canRestore: true,
      });
    }
  });
} catch (e) {
  console.error('Error setting up database:', e);
  logger.error('Error setting up database', e);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Log when window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  // Log console messages from renderer
  mainWindow.webContents.on(
    'console-message',
    (event, level, message, line, sourceId) => {
      console.log(`[Renderer Console] ${message}`);
    }
  );

  // Initialize database error handlers
  databaseErrorHandlers.initializeDatabaseErrorHandlers(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for project operations
ipcMain.handle('get-projects', async () => {
  try {
    console.log('Main process: get-projects called');
    const projectManager = new ProjectManager();
    const projects = await projectManager.getAllProjects();
    console.log(
      'Main process: get-projects data structure:',
      Object.keys(projects)
    );
    console.log(
      `Main process: active projects: ${projects.active?.length || 0}`
    );
    return projects; // Return the projects directly without wrapping in success/data
  } catch (error) {
    console.error('Error in get-projects handler:', error);
    return { active: [], waiting: [], someday: [], archive: [] };
  }
});

ipcMain.handle('update-project-status', async (event, projectData) => {
  try {
    const { 
      path: projectPath,
      isActive,
      isWaiting,
      waitingInput,
      status,
    } = projectData;

    if (!projectPath) {
      return { success: false, error: 'Project path is required' };
    }

    // Validate project exists
    const project = await Project.findOne({
      where: { path: projectPath },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Determine the target status
    let targetStatus = status;
    if (!targetStatus) {
      if (!isActive) {
        targetStatus = PROJECT_STATUS.SOMEDAY;
      } else if (isWaiting) {
        targetStatus = PROJECT_STATUS.WAITING;
      } else {
        targetStatus = PROJECT_STATUS.ACTIVE;
      }
    }

    const projectManager = new ProjectManager();
    
    // Update project status
    const result = await projectManager.updateProjectStatus(
      project.path,
      isActive,
      isWaiting,
      waitingInput || null,
      targetStatus
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Error changing project status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  'change-project-status',
  async (event, { id, status, waitingInput }) => {
    console.log(
      `Main process: change-project-status called for project ${id} to status ${status}`
    );
    try {
      if (!id) {
        return { success: false, error: 'Project ID is required' };
      }

      // Get the project from database
      const project = await Project.findByPk(id);
      if (!project) {
        return { success: false, error: `Project with ID ${id} not found` };
      }

      // Initialize project manager
      const projectManager = new ProjectManager();
      await projectManager.ensureDirectoriesExist();

      // Map status to parameters for updateProjectStatus
      let isActive = false;
      let isWaiting = false;

      switch (status) {
        case 'active':
          isActive = true;
          isWaiting = false;
          break;
        case 'waiting':
          isActive = true;
          isWaiting = true;
          break;
        case 'someday':
          isActive = false;
          isWaiting = false;
          break;
        case 'archive':
          isActive = false;
          isWaiting = false;
          break;
        default:
          return { success: false, error: `Invalid status: ${status}` };
      }

      // Update the project status
      const result = await projectManager.updateProjectStatus(
        project.path,
        isActive,
        isWaiting,
        waitingInput || null,
        status
      );

      return { success: true, data: result };
    } catch (error) {
    console.error('Error changing project status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-project', async (event, project) => {
  try {
    console.log('Main process: update-project called');
    const projectManager = new ProjectManager();

    // Extract necessary data
    const {
      path: projectPath,
      status,
      waitingInput,
      isWellFormulated,
    } = project;

    // Determine if project is active or waiting
    const isActive = status === 'active' || status === 'waiting';
    const isWaiting = status === 'waiting';

    // Update project status
    const result = await projectManager.updateProjectStatus(
      projectPath,
      isActive,
      isWaiting,
      waitingInput
    );

    // If the project is well-formulated, update that status in the database
    if (isWellFormulated) {
      // Find the project in the database
      const filename = path.basename(projectPath);
      const projectModel = await Project.findByPk(filename);

      if (projectModel) {
        projectModel.isWellFormulated = true;
        await projectModel.save();
      }
    }

    return { ...result, isWellFormulated };
  } catch (error) {
    console.error('Error in update-project handler:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('validate-project', async (event, { projectPath }) => {
  try {
    console.log('Main process: validate-project called');
    const projectManager = new ProjectManager();
    return await projectManager.validateProject(projectPath);
  } catch (error) {
    console.error('Error in validate-project handler:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('reformulate-project', async (event, { project, endState }) => {
  try {
    console.log('Main process: reformulate-project called', {
      project,
      endState,
    });
    const projectManager = new ProjectManager();

    // Call the project manager to reformulate the project
    const result = await projectManager.reformulateProject(
      project.path,
      endState
    );

    if (result.success) {
      // Extract title from content
      const titleMatch = result.reformulatedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : result.newFilename;

      // Create a project object with the reformulated data
      const reformulatedProject = {
        id: result.newFilename,
        title: title,
        path: project.path.replace(
          path.basename(project.path),
          result.newFilename
        ),
        status: project.status || 'active',
        content: result.reformulatedContent,
        isWellFormulated: result.isWellFormulated,
        lastModified: new Date().toISOString(),
      };

      // Notify the renderer process that the project has been updated
      if (mainWindow) {
        mainWindow.webContents.send('project-saved', reformulatedProject.id);
      }

      return { success: true, project: reformulatedProject };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Error reformulating project:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('generate-report', async () => {
  try {
    console.log('Main process: generate-report called');
    const projectManager = new ProjectManager();
    return await projectManager.generateReport();
  } catch (error) {
    console.error('Error in generate-report handler:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('find-potential-duplicates', async () => {
  try {
    console.log('Main process: find-potential-duplicates called');

    if (!ProjectManager) {
      console.error('ProjectManager is not available');
      return { success: false, message: 'ProjectManager not available' };
    }

    console.log('Creating new ProjectManager instance');
    const projectManager = new ProjectManager();

    console.log('Calling projectManager.findPotentialDuplicates()');

    // Check for debug mode to force duplicates
    const DEBUG_FORCE_DUPLICATES = process.env.DEBUG_FORCE_DUPLICATES || false;

    let result;
    if (DEBUG_FORCE_DUPLICATES) {
      console.log('⚠️ DEBUG MODE: Forcing duplicate groups for testing');

      // Get projects for creating fake duplicates
      const projects = await projectManager.getProjectsByStatus('active');
      console.log(`Found ${projects.length} active projects for testing`);

      // Create sample duplicate groups
      const fakeGroups = [];

      if (projects.length >= 3) {
        fakeGroups.push(projects.slice(0, 3));
      }

      if (projects.length >= 5) {
        fakeGroups.push(projects.slice(3, 5));
      }

      // Add a third fake group
      if (projects.length >= 8) {
        fakeGroups.push(projects.slice(5, 8));
      }

      console.log(
        `Created ${fakeGroups.length} fake duplicate groups for testing`
      );
      result = { success: true, duplicateGroups: fakeGroups };
    } else {
      // Normal operation
      result = await projectManager.findPotentialDuplicates();
    }

    // Log the duplicate groups for debugging
    if (result.success && result.duplicateGroups) {
      console.log(
        `Main process: Found ${result.duplicateGroups.length} duplicate groups`
      );

      // Ensure the duplicate groups are properly structured for the renderer
      // Each group should be an array of project objects with at least title, path, and content
      if (result.duplicateGroups && Array.isArray(result.duplicateGroups)) {
        // Log the structure of each group for debugging
        result.duplicateGroups.forEach((group, groupIndex) => {
          console.log(
            `Main process: Group ${groupIndex + 1} with ${group ? group.length : 0} projects`
          );
          if (group && Array.isArray(group)) {
            group.forEach((project, projectIndex) => {
              console.log(
                `  Project ${projectIndex + 1}:`,
                project ? project.title || 'No title' : 'NULL PROJECT'
              );
            });
          } else {
            console.error(
              `  Invalid group structure: Group is ${group ? typeof group : 'null/undefined'}`
            );
          }
        });

        const sanitizedGroups = result.duplicateGroups
          .map(group => {
            if (!group || !Array.isArray(group)) {
              console.error(`Invalid group structure: ${group}`);
              return []; // Return empty group to avoid errors
            }

            return group.map(project => {
              if (!project) {
                console.error('Empty project in duplicate group');
                return {
                  id: 'unknown',
                  title: 'Error: Corrupt Project Data',
                  path: '',
                  content: '',
                  status: 'active',
                };
              }

              return {
                id:
                  project.id ||
                  project.filename ||
                  path.basename(project.path || ''),
                title: project.title || 'Untitled',
                path: project.path || '',
                content: project.content || '',
                status: project.status || 'active',
              };
            });
          })
          .filter(group => group.length >= 2); // Only include groups with at least 2 projects

        console.log(
          'Main process: Returning sanitized duplicate groups to renderer'
        );
        return { success: true, duplicateGroups: sanitizedGroups };
      } else {
        console.log('Main process: No valid duplicate groups found');
        return {
          success: true,
          duplicateGroups: [],
          message: 'No duplicate projects were found in your project set.',
        };
      }
    } else {
      console.log('Main process: No duplicate groups found or error in result');
      return {
        success: false,
        message: result.message || 'No duplicate groups found',
      };
    }
  } catch (error) {
    console.error('Error in find-potential-duplicates handler:', error);
    return { success: false, message: error.toString() };
  }
});

ipcMain.handle('merge-duplicate-projects', async (event, projectIds) => {
  try {
    console.log(
      'Main process: merge-duplicate-projects called with IDs:',
      projectIds
    );

    if (!Array.isArray(projectIds) || projectIds.length < 2) {
      return {
        success: false,
        message: 'At least two project IDs are required for merging',
      };
    }

    const projectManager = new ProjectManager();
    const result = await projectManager.mergeDuplicateProjects(projectIds);
    return result;
  } catch (error) {
    console.error('Error in merge-duplicate-projects handler:', error);
    return {
      success: false,
      message: `Error merging duplicate projects: ${error.message}`,
    };
  }
});

ipcMain.handle('get-projects-with-duplicates', async () => {
  try {
    console.log('Main process: get-projects-with-duplicates called');

    const projectManager = new ProjectManager();
    const projects = await projectManager.getProjectsWithPotentialDuplicates();
    return projects;
  } catch (error) {
    console.error('Error in get-projects-with-duplicates handler:', error);
    return {
      success: false,
      message: `Error getting projects with duplicates: ${error.message}`,
    };
  }
});

// Add the correct handler name to match the preload.js
ipcMain.handle('get-projects-with-potential-duplicates', async () => {
  try {
    console.log('Main process: get-projects-with-potential-duplicates called');

    const projectManager = new ProjectManager();
    const result = await projectManager.getProjectsWithPotentialDuplicates();
    console.log('Result from getProjectsWithPotentialDuplicates:', result);
    return result;
  } catch (error) {
    console.error(
      'Error in get-projects-with-potential-duplicates handler:',
      error
    );
    return {
      success: false,
      message: `Error getting projects with potential duplicates: ${error.message}`,
    };
  }
});

// Handle project linking
ipcMain.handle(
  'link-projects',
  async (event, { targetId, _sourceId, _line }) => {
    try {
      console.log('Main process: link-projects called');

      if (!ProjectManager) {
        console.error('ProjectManager is not available');
        return { success: false, message: 'ProjectManager not available' };
      }

      const projectManager = new ProjectManager();
      return await projectManager.linkProjects(targetId);
    } catch (error) {
      console.error('Error linking projects:', error);
      return { success: false, message: error.toString() };
    }
  }
);

// Add IPC handler for synchronizing projects
ipcMain.handle('synchronize-projects', async () => {
  try {
    console.log('Main process: synchronize-projects called');
    if (!ProjectManager) {
      return { success: false, message: 'ProjectManager not available' };
    }

    const projectManager = new ProjectManager();
    const result = await projectManager.synchronizeProjects();
    return result;
  } catch (error) {
    console.error('Error synchronizing projects:', error);
    return { success: false, message: error.toString() };
  }
});

// Add IPC handler for getting projects
ipcMain.handle('get-projects', async () => {
  try {
    console.log('Main process: get-projects called');
    if (!ProjectManager) {
      return { success: false, message: 'ProjectManager not available' };
    }

    const projectManager = new ProjectManager();
    const projects = await projectManager.getAllProjects();
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    return { success: false, message: error.toString() };
  }
});

// Handle get-logs request
ipcMain.handle('get-logs', async (event, options = {}) => {
  const { logType = 'app', limit = 100, level = 'all' } = options;
  
  let logFilePath;
  if (logType === 'app') {
    logFilePath = path.join(app.getPath('userData'), 'logs', 'app.log');
  } else if (logType === 'error') {
    logFilePath = path.join(app.getPath('userData'), 'logs', 'error.log');
  } else if (logType === 'renderer') {
    logFilePath = path.join(app.getPath('userData'), 'logs', 'renderer.log');
  } else {
    throw new Error(`Invalid log type: ${logType}`);
  }
  
  // Check if log file exists
  if (!fs.existsSync(logFilePath)) {
    return [];
  }
  
  // Get file stats to determine size
  const stats = await fsPromises.stat(logFilePath);
  const fileSize = stats.size;
  
  // If file is empty, return empty array
  if (fileSize === 0) {
    return [];
  }
  
  // Read from the end of the file to get the most recent logs
  const buffer = Buffer.alloc(Math.min(fileSize, 1024 * 1024)); // Read up to 1MB
  const position = Math.max(0, fileSize - buffer.length);
  const size = buffer.length;
  
  await fsPromises.read(
    fs.openSync(logFilePath, 'r'),
    buffer,
    0,
    size,
    position
  );
  
  // Convert buffer to string and split by newlines
  const data = buffer.toString();
  const lines = data.split('\n').filter(line => line.trim() !== '');
  
  // Process log entries
  const logs = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const line = lines[i];
      const logEntry = JSON.parse(line);
      
      // Filter by level if specified
      if (level !== 'all' && logEntry.level !== level) {
        continue;
      }
      
      logs.push(logEntry);
      
      // Stop once we have enough logs
      if (logs.length >= limit) {
        break;
      }
    } catch (error) {
      // Skip invalid log entries
      console.error('Error parsing log entry:', error);
    }
  }
  
  return logs;
});

// Handle get-analytics-data request
ipcMain.handle('get-analytics-data', async () => {
  try {
    // Get project directories
    const projectsDir = path.join(app.getPath('userData'), 'projects');
    const activeDir = path.join(projectsDir, 'active');
    const waitingDir = path.join(projectsDir, 'waiting');
    const somedayDir = path.join(projectsDir, 'someday');
    const archiveDir = path.join(projectsDir, 'archive');
    
    // Count projects in each directory
    const projectCounts = {
      active: fs.existsSync(activeDir) ? fs.readdirSync(activeDir).filter(file => file.endsWith('.txt')).length : 0,
      waiting: fs.existsSync(waitingDir) ? fs.readdirSync(waitingDir).filter(file => file.endsWith('.txt')).length : 0,
      someday: fs.existsSync(somedayDir) ? fs.readdirSync(somedayDir).filter(file => file.endsWith('.txt')).length : 0,
      archive: fs.existsSync(archiveDir) ? fs.readdirSync(archiveDir).filter(file => file.endsWith('.txt')).length : 0
    };
    
    // Get log file for actions
    const logFilePath = path.join(app.getPath('userData'), 'logs', 'app.log');
    
    // Initialize actions per day
    const actionsPerDay = [];
    const statusChanges = [];
    
    // Check if log file exists
    if (fs.existsSync(logFilePath)) {
      // Read log file
      const logData = await fsPromises.readFile(logFilePath, 'utf8');
      const logLines = logData.split('\n').filter(line => line.trim() !== '');
      
      // Process log entries
      const actionsByDate = {};
      
      for (const line of logLines) {
        try {
          const logEntry = JSON.parse(line);
          const timestamp = new Date(logEntry.timestamp);
          const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Count actions per day
          if (!actionsByDate[date]) {
            actionsByDate[date] = 0;
          }
          actionsByDate[date]++;
          
          // Collect status changes
          if (logEntry.message && logEntry.message.includes('status changed')) {
            // Extract project title and status change details
            const match = logEntry.message.match(/Project "([^"]+)" status changed from (\w+) to (\w+)/);
            if (match) {
              statusChanges.push({
                projectTitle: match[1],
                createdAt: logEntry.timestamp,
                details: {
                  fromStatus: match[2],
                  toStatus: match[3]
                }
              });
            }
          }
        } catch (error) {
          // Skip invalid log entries
          console.error('Error parsing log entry for analytics:', error);
        }
      }
      
      // Convert actions by date to array
      for (const date in actionsByDate) {
        actionsPerDay.push({
          date,
          count: actionsByDate[date]
        });
      }
      
      // Sort status changes by date (newest first)
      statusChanges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Limit to the most recent 50 status changes
      if (statusChanges.length > 50) {
        statusChanges.length = 50;
      }
    }
    
    return {
      projectCounts,
      actionsPerDay,
      statusChanges
    };
  } catch (error) {
    logger.error('Error getting analytics data:', error);
    throw error;
  }
});
