const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dbErrorHandler = require('./databaseErrorHandler');
const { CONFIG } = require('../config');

// Database file path from centralized config
const DB_PATH = CONFIG.databasePath;

// Initialize Sequelize with SQLite and connection pool settings
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false,
  pool: {
    max: 10, // Maximum number of connection pool
    min: 0, // Minimum number of connection pool
    acquire: 30000, // Maximum time (ms) to acquire a connection
    idle: 10000, // Maximum time (ms) that a connection can be idle
  },
  retry: {
    max: 3, // Maximum retry attempts
    match: [
      // Error types to retry
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /SQLITE_CONSTRAINT/,
      /SQLITE_IOERR/,
    ],
  },
  // Additional SQLite-specific options
  dialectOptions: {
    // Enable WAL mode for better concurrency
    pragma: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: -64000, // 64MB in pages
      foreign_keys: 'ON',
    },
  },
});

// Define Project model
const Project = sequelize.define('Project', {
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
    type: DataTypes.ENUM('active', 'waiting', 'someday', 'archive'),
    defaultValue: 'active',
  },
  isWaiting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  waitingInput: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastModified: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completedTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isWellFormulated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  needsImprovement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  issues: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hasPotentialDuplicates: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Define ProjectHistory model to track changes
const ProjectHistory = sequelize.define('ProjectHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  previousStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  previousTasks: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  newTasks: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  previousCompleted: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  newCompleted: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});

// Setup database function with error handling and recovery
async function setupDatabase() {
  try {
    // Check if database file exists
    const dbExists = fs.existsSync(DB_PATH);

    // If database exists, check its integrity
    if (dbExists) {
      const isIntact = await dbErrorHandler.checkDatabaseIntegrity(sequelize);

      // If database is corrupted, try to restore from backup
      if (!isIntact) {
        console.error(
          'Database integrity check failed. Attempting to restore from backup...'
        );

        // Create a backup of the corrupted database for analysis
        const corruptedBackupPath = path.join(
          __dirname,
          '../../backups',
          `corrupted-database-${Date.now()}.sqlite`
        );
        fs.copyFileSync(DB_PATH, corruptedBackupPath);
        console.log(`Corrupted database backed up to ${corruptedBackupPath}`);

        // Find the most recent backup
        const backupDir = path.join(__dirname, '../../backups');
        if (fs.existsSync(backupDir)) {
          const backups = fs
            .readdirSync(backupDir)
            .filter(file => file.startsWith('database-backup-'))
            .map(file => path.join(backupDir, file))
            .sort(
              (a, b) =>
                fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime()
            );

          if (backups.length > 0) {
            const restored = await dbErrorHandler.restoreDatabaseFromBackup(
              backups[0],
              DB_PATH
            );
            if (restored) {
              console.log('Database restored from backup. Continuing setup...');
            } else {
              console.error(
                'Failed to restore database from backup. Creating a new database...'
              );
              // Rename the corrupted database
              fs.renameSync(DB_PATH, `${DB_PATH}.corrupted.${Date.now()}`);
            }
          } else {
            console.error('No backups found. Creating a new database...');
            // Rename the corrupted database
            fs.renameSync(DB_PATH, `${DB_PATH}.corrupted.${Date.now()}`);
          }
        } else {
          console.error(
            'No backup directory found. Creating a new database...'
          );
          // Rename the corrupted database
          fs.renameSync(DB_PATH, `${DB_PATH}.corrupted.${Date.now()}`);
        }
      }
    }

    // Authenticate with the database
    await dbErrorHandler.safeDbOperation(
      () => sequelize.authenticate(),
      'authenticate'
    );
    console.log('Database connection has been established successfully.');

    // Sync all models
    await dbErrorHandler.safeDbOperation(() => sequelize.sync(), 'sync');
    console.log('All models were synchronized successfully.');

    // Schedule regular backups
    dbErrorHandler.scheduleRegularBackups(DB_PATH);

    // Create an initial backup if none exists
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir) || fs.readdirSync(backupDir).length === 0) {
      await dbErrorHandler.createDatabaseBackup(DB_PATH);
    }
  } catch (error) {
    console.error('Unable to set up the database:', error);
    dbErrorHandler.logDatabaseError(error, 'setupDatabase');

    // Rethrow with a user-friendly message
    throw new Error(
      'Failed to set up the database. Please restart the application or contact support.'
    );
  }
}

// Enhanced findByPk with error handling
async function findProjectByPk(pk, options = {}) {
  return dbErrorHandler.safeDbOperation(
    () => Project.findByPk(pk, options),
    'findProjectByPk',
    { pk, options }
  );
}

// Enhanced findAll with error handling
async function findAllProjects(options = {}) {
  return dbErrorHandler.safeDbOperation(
    () => Project.findAll(options),
    'findAllProjects',
    { options }
  );
}

// Enhanced create with error handling
async function createProject(data) {
  return dbErrorHandler.safeDbOperation(
    () => Project.create(data),
    'createProject',
    { data }
  );
}

// Enhanced update with error handling
async function updateProject(data, options) {
  return dbErrorHandler.safeDbOperation(
    () => Project.update(data, options),
    'updateProject',
    { data, options }
  );
}

// Enhanced destroy with error handling
async function destroyProject(options) {
  return dbErrorHandler.safeDbOperation(
    () => Project.destroy(options),
    'destroyProject',
    { options }
  );
}

// Enhanced upsert with error handling
async function upsertProject(values, options) {
  return dbErrorHandler.safeDbOperation(
    () => Project.upsert(values, options),
    'upsertProject',
    { values, options }
  );
}

// Enhanced findOne with error handling
async function findOneProject(options) {
  return dbErrorHandler.safeDbOperation(
    () => Project.findOne(options),
    'findOneProject',
    { options }
  );
}

// Export the enhanced database interface
module.exports = {
  sequelize,
  Project: {
    ...Project,
    findByPk: findProjectByPk,
    findAll: findAllProjects,
    findOne: findOneProject,
    create: createProject,
    update: updateProject,
    destroy: destroyProject,
    upsert: upsertProject,
  },
  ProjectHistory,
  setupDatabase,
  DB_PATH,
};
