const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Conditionally import database setup
let setupDatabase, Project, ProjectHistory;
try {
  const db = require('../models/database');
  setupDatabase = db.setupDatabase;
  Project = db.Project;
  ProjectHistory = db.ProjectHistory;
} catch (e) {
  console.error('Error loading database module:', e);
  setupDatabase = async () => console.log('Database setup skipped due to error');
}

// Conditionally import project manager
let ProjectManager;
try {
  const pm = require('../utils/projectManager');
  ProjectManager = pm.ProjectManager;
} catch (e) {
  console.error('Error loading project manager module:', e);
  ProjectManager = class MockProjectManager {
    async getAllProjects() { return { active: [], waiting: [], someday: [], archive: [] }; }
    async updateProjectStatus() { return { success: false, message: 'ProjectManager not available' }; }
    async validateProject() { return { success: false, message: 'ProjectManager not available' }; }
    async reformulateProject() { return { success: false, message: 'ProjectManager not available' }; }
    async generateReport() { return { success: false, message: 'ProjectManager not available' }; }
  };
}

let mainWindow;

// Initialize the database
try {
  setupDatabase();
} catch (e) {
  console.error('Error setting up database:', e);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
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
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message}`);
  });
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
    console.log('Main process: get-projects data structure:', Object.keys(projects));
    console.log(`Main process: active projects: ${projects.active?.length || 0}`);
    return projects; // Return the projects directly without wrapping in success/data
  } catch (error) {
    console.error('Error in get-projects handler:', error);
    return { active: [], waiting: [], someday: [], archive: [] };
  }
});

ipcMain.handle('update-project-status', async (event, project) => {
  try {
    console.log('Main process: update-project-status called', project);
    const projectManager = new ProjectManager();
    
    // Extract necessary data
    const { projectPath, isActive, isWaiting, waitingInput, targetStatus } = project;
    
    // Update the project status
    const result = await projectManager.updateProjectStatus(
      projectPath,
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

ipcMain.handle('change-project-status', async (event, { id, status, waitingInput }) => {
  console.log(`Main process: change-project-status called for project ${id} to status ${status}`);
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
    const { path: projectPath, status, waitingInput, isWellFormulated } = project;
    
    // Determine if project is active or waiting
    const isActive = status === 'active' || status === 'waiting';
    const isWaiting = status === 'waiting';
    
    // Update project status
    const result = await projectManager.updateProjectStatus(projectPath, isActive, isWaiting, waitingInput);
    
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

ipcMain.handle('reformulate-project', async (event, { projectPath, endState }) => {
  try {
    console.log('Main process: reformulate-project called');
    const projectManager = new ProjectManager();
    return await projectManager.reformulateProject(projectPath, endState);
  } catch (error) {
    console.error('Error in reformulate-project handler:', error);
    return { success: false, message: error.toString() };
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
