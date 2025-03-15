const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Database file path
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: console.log,
});

// Define Project model
const Project = sequelize.define(
  'Project',
  {
    filename: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'Projects',
  }
);

// IPC handler for getting projects
ipcMain.handle('test-get-projects', async () => {
  try {
    console.log('IPC: test-get-projects called');

    // Get all projects from database
    const dbProjects = await Project.findAll();
    console.log(`Found ${dbProjects.length} projects in database`);

    // Group projects by status
    const projects = {
      active: [],
      waiting: [],
      someday: [],
      archive: [],
    };

    for (const project of dbProjects) {
      const status = project.status || 'active';
      if (!projects[status]) {
        projects[status] = [];
      }

      // Convert Sequelize model to plain object
      const plainProject = project.get({ plain: true });

      // Add to appropriate status array
      projects[status].push(plainProject);
    }

    console.log('Projects loaded from database successfully');
    return projects;
  } catch (error) {
    console.error('IPC: Error getting projects:', error);
    return { error: error.message };
  }
});

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load a simple HTML file
  mainWindow.loadFile('test.html');

  // Open the DevTools
  mainWindow.webContents.openDevTools();
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
