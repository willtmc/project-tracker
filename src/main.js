const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import database error handlers
let databaseErrorHandlers;
try {
  databaseErrorHandlers = require('./main/ipc/databaseErrorHandlers');
} catch (e) {
  console.error('Error loading database error handlers:', e);
  databaseErrorHandlers = {};
}

// Conditionally import database setup
let setupDatabase, Project, ProjectHistory;
try {
  const db = require('./models/database');
  setupDatabase = db.setupDatabase;
  Project = db.Project;
  ProjectHistory = db.ProjectHistory;
} catch (e) {
  console.error('Error loading database module:', e);
  setupDatabase = async () => console.log('Database setup skipped due to error');
}

// Conditionally import project manager
let projectManager;
try {
  const { ProjectManager } = require('./utils');
  projectManager = new ProjectManager();
} catch (e) {
  console.error('Error loading project manager module:', e);
  projectManager = {
    getAllProjects: async () => getMockProjects(),
    updateProjectStatus: async () => ({ success: false, message: 'ProjectManager not available' }),
    validateProject: async () => ({ success: false, message: 'ProjectManager not available' }),
    reformulateProject: async () => ({ success: false, message: 'ProjectManager not available' }),
    generateReport: async () => ({ success: false, message: 'ProjectManager not available' }),
    findPotentialDuplicates: async () => ({ success: false, message: 'ProjectManager not available' }),
    mergeDuplicateProjects: async () => ({ success: false, message: 'ProjectManager not available' }),
    getProjectsWithPotentialDuplicates: async () => ({ success: false, message: 'ProjectManager not available' })
  };
}

// Initialize the database with retry mechanism
try {
  let retryCount = 0;
  const maxRetries = 3;
  
  const initDatabase = async () => {
    try {
      await setupDatabase();
      console.log('Database setup completed successfully');
    } catch (error) {
      retryCount++;
      console.error(`Error during database setup (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying database setup in 2 seconds...`);
        setTimeout(initDatabase, 2000);
      } else {
        console.error('Maximum retry attempts reached. Database setup failed.');
      }
    }
  };
  
  initDatabase();
} catch (e) {
  console.error('Error initializing database:', e);
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index-tailwind.html'));
  
  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // Always open DevTools for debugging
  mainWindow.webContents.openDevTools();

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for project data
ipcMain.handle('get-projects', async () => {
  try {
    console.log('IPC: get-projects called');
    
    // Get all projects directly from the database
    console.log('Querying database for all projects...');
    const dbProjects = await Project.findAll();
    console.log(`Found ${dbProjects.length} projects in database`);
    
    // Group projects by status
    const projects = {
      active: [],
      waiting: [],
      someday: [],
      archive: []
    };
    
    for (const project of dbProjects) {
      const status = project.status || 'active';
      if (!projects[status]) {
        projects[status] = [];
      }
      
      // Convert Sequelize model to plain object
      const plainProject = project.get({ plain: true });
      
      // Parse issues if it's a JSON string
      if (plainProject.issues && typeof plainProject.issues === 'string') {
        try {
          plainProject.issues = JSON.parse(plainProject.issues);
        } catch (e) {
          plainProject.issues = [];
        }
      }
      
      // Add to appropriate status array
      projects[status].push({
        ...plainProject,
        completionPercentage: plainProject.totalTasks > 0 
          ? (plainProject.completedTasks / plainProject.totalTasks) * 100 
          : 0
      });
    }
    
    // Log the number of projects in each status
    for (const [status, statusProjects] of Object.entries(projects)) {
      console.log(`${status} projects: ${statusProjects.length}`);
    }
    
    console.log('Projects loaded from database successfully');
    return projects;
  } catch (error) {
    console.error('IPC: Error getting projects:', error);
    return getMockProjects();
  }
});

ipcMain.handle('save-project', async (event, project) => {
  try {
    console.log('IPC: save-project called', project);
    // Use the project manager to update project status
    const result = await projectManager.updateProjectStatus(project);
    console.log('IPC: save-project completed successfully');
    return result;
  } catch (error) {
    console.error('IPC: Error saving project:', error);
    return { success: false, message: 'Error saving project' };
  }
});

ipcMain.handle('update-project-status', async (event, project) => {
  try {
    console.log('IPC: update-project-status called', project);
    const result = await projectManager.updateProjectStatus(
      project.path,
      project.isActive,
      project.isWaiting,
      project.waitingInput,
      project.targetStatus
    );
    console.log('IPC: update-project-status completed successfully');
    return result;
  } catch (error) {
    console.error('IPC: Error updating project status:', error);
    return { success: false, message: 'Error updating project status' };
  }
});

ipcMain.handle('validate-project', async (event, projectPath) => {
  try {
    return await projectManager.validateProject(projectPath);
  } catch (error) {
    console.error('Error validating project:', error);
    return { success: false, message: 'Error validating project' };
  }
});

ipcMain.handle('reformulate-project', async (event, projectPath, endState) => {
  try {
    return await projectManager.reformulateProject(projectPath, endState);
  } catch (error) {
    console.error('Error reformulating project:', error);
    return { success: false, message: 'Error reformulating project' };
  }
});

ipcMain.handle('generate-report', async () => {
  try {
    return await projectManager.generateReport();
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, message: 'Error generating report' };
  }
});

ipcMain.handle('find-potential-duplicates', async () => {
  try {
    return await projectManager.findPotentialDuplicates();
  } catch (error) {
    console.error('Error finding potential duplicates:', error);
    return { success: false, message: 'Error finding potential duplicates' };
  }
});

ipcMain.handle('merge-duplicate-projects', async (event, projectPaths) => {
  try {
    return await projectManager.mergeDuplicateProjects(projectPaths);
  } catch (error) {
    console.error('Error merging duplicate projects:', error);
    return { success: false, message: 'Error merging duplicate projects' };
  }
});

ipcMain.handle('get-projects-with-potential-duplicates', async () => {
  try {
    return await projectManager.getProjectsWithPotentialDuplicates();
  } catch (error) {
    console.error('Error getting projects with potential duplicates:', error);
    return { success: false, message: 'Error getting projects with potential duplicates' };
  }
});

// Add a handler for database retry
ipcMain.handle('retry-database-operation', async () => {
  try {
    if (databaseErrorHandlers && databaseErrorHandlers.retryPendingOperation) {
      return await databaseErrorHandlers.retryPendingOperation();
    } else {
      console.error('Database error handlers not available');
      return { success: false, message: 'Database error handlers not available' };
    }
  } catch (error) {
    console.error('Error retrying database operation:', error);
    return { success: false, message: 'Error retrying database operation' };
  }
});

// Helper function to get mock projects (fallback)
function getMockProjects() {
  // Try to read from a JSON file if it exists
  try {
    const dataPath = path.join(app.getPath('userData'), 'projects.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading projects file:', error);
  }

  // Return mock data if file doesn't exist or there's an error
  return [
    {
      id: '1',
      title: 'Complete Project Tracker App',
      content: 'Finish building the Electron-based project tracker application with all planned features.',
      status: 'active',
      lastModified: new Date().toISOString(),
      endState: 'A fully functional project tracker app with dark mode, grid/list views, and project management features.',
      tasks: [
        { id: '1-1', title: 'Set up Electron project', completed: true },
        { id: '1-2', title: 'Create basic UI', completed: true },
        { id: '1-3', title: 'Implement dark mode', completed: false },
        { id: '1-4', title: 'Add project CRUD operations', completed: false },
        { id: '1-5', title: 'Implement view toggle', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Learn Tailwind CSS',
      content: 'Study Tailwind CSS documentation and build sample projects to get comfortable with the utility-first approach.',
      status: 'active',
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      endState: 'Comfortable using Tailwind CSS for all new projects without needing to reference documentation constantly.',
      tasks: [
        { id: '2-1', title: 'Read documentation', completed: true },
        { id: '2-2', title: 'Complete tutorial', completed: true },
        { id: '2-3', title: 'Build sample project', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Research Database Options',
      content: 'Evaluate different database options for storing project data, including SQLite, MongoDB, and simple JSON files.',
      status: 'waiting',
      waitingFor: 'Performance metrics from the team',
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      tasks: [
        { id: '3-1', title: 'Research SQLite', completed: true },
        { id: '3-2', title: 'Research MongoDB', completed: true },
        { id: '3-3', title: 'Research JSON storage', completed: true },
        { id: '3-4', title: 'Create comparison document', completed: false },
        { id: '3-5', title: 'Make final recommendation', completed: false }
      ]
    },
    {
      id: '4',
      title: 'Plan Marketing Strategy',
      content: 'Develop a marketing strategy for the project tracker app, including target audience, messaging, and channels.',
      status: 'someday',
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      tasks: [
        { id: '4-1', title: 'Define target audience', completed: false },
        { id: '4-2', title: 'Create messaging framework', completed: false },
        { id: '4-3', title: 'Identify marketing channels', completed: false }
      ]
    },
    {
      id: '5',
      title: 'Old Project Idea',
      content: 'This was a project idea that is no longer relevant.',
      status: 'archive',
      lastModified: new Date(Date.now() - 345600000).toISOString(),
      endState: 'Project was archived due to changing priorities.',
      tasks: [
        { id: '5-1', title: 'Initial research', completed: true },
        { id: '5-2', title: 'Create project plan', completed: false }
      ]
    }
  ];
} 