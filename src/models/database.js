const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

// Define Project model
const Project = sequelize.define('Project', {
  filename: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'waiting', 'someday', 'archive'),
    defaultValue: 'active'
  },
  isWaiting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  waitingInput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastModified: {
    type: DataTypes.DATE,
    allowNull: false
  },
  totalTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedTasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isWellFormulated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  needsImprovement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  issues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hasPotentialDuplicates: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Define ProjectHistory model to track changes
const ProjectHistory = sequelize.define('ProjectHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  previousStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  previousTasks: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  newTasks: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  previousCompleted: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  newCompleted: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
});

// Setup database function
async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize,
  Project,
  ProjectHistory,
  setupDatabase
};
