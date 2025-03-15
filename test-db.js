const { Sequelize } = require('sequelize');
const path = require('path');

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
      type: Sequelize.STRING,
      primaryKey: true,
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'Projects',
  }
);

async function testDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Count projects
    const count = await Project.count();
    console.log(`Total projects in database: ${count}`);

    // Get projects by status
    const statuses = ['active', 'waiting', 'someday', 'archive'];
    for (const status of statuses) {
      const statusCount = await Project.count({ where: { status } });
      console.log(`${status} projects: ${statusCount}`);
    }

    // Get a sample project
    const sampleProject = await Project.findOne();
    if (sampleProject) {
      console.log('Sample project:', sampleProject.get({ plain: true }));
    } else {
      console.log('No projects found in database.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testDatabase();
