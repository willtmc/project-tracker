/**
 * Configuration Module
 *
 * This module centralizes all environment variables and configuration settings
 * for the application. It reads from process.env and provides fallbacks or
 * throws meaningful errors when required variables are missing.
 */

const path = require('path');
const fs = require('fs');

/**
 * Get environment variable with fallback
 * @param {string} name - Environment variable name
 * @param {string} fallback - Fallback value if not set
 * @param {boolean} required - Whether the variable is required
 * @returns {string} - The environment variable value or fallback
 */
function getEnv(name, fallback = '', required = false) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      throw new Error(
        `Required environment variable ${name} is not set. Please check your .env file.`
      );
    }
    console.warn(
      `Warning: Environment variable ${name} not set. Using fallback value.`
    );
    return fallback;
  }
  return value;
}

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Configuration object with all environment variables
const CONFIG = {
  // Project directories
  projectsRootDir: getEnv(
    'PROJECTS_ROOT_DIR',
    path.join(
      process.env.HOME || process.env.USERPROFILE,
      'Documents',
      'Projects'
    )
  ),
  
  // Database configuration
  databasePath: getEnv(
    'DATABASE_PATH',
    path.join(__dirname, '../database.sqlite')
  ),
  
  // Backup configuration
  backupDir: ensureDirectoryExists(
    getEnv('BACKUP_DIR', path.join(__dirname, '../backups'))
  ),
  
  // Logs configuration
  logsDir: ensureDirectoryExists(
    getEnv('LOGS_DIR', path.join(__dirname, '../logs'))
  ),
  
  // OpenAI configuration
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
  },
  
  // Email configuration (optional)
  email: {
    smtpServer: getEnv('SMTP_SERVER'),
    smtpPort: getEnv('SMTP_PORT', '587'),
    smtpUsername: getEnv('SMTP_USERNAME'),
    smtpPassword: getEnv('SMTP_PASSWORD'),
    recipientEmail: getEnv('RECIPIENT_EMAIL'),
  },
  
  // Project status directories (derived from projectsRootDir)
  get projectDirectories() {
    return {
      active: path.join(this.projectsRootDir, 'WTM Projects'),
      waiting: path.join(this.projectsRootDir, 'WTM Projects Waiting'),
      someday: path.join(this.projectsRootDir, 'WTM Projects Someday'),
      archive: path.join(this.projectsRootDir, 'WTM Projects Archive'),
    };
  },
  
  // Database log file path (derived from logsDir)
  get databaseErrorLogPath() {
    return path.join(this.logsDir, 'database-errors.log');
  },
};

/**
 * Validate the configuration
 */
function validateConfig() {
  // Check if projects root directory exists
  if (!fs.existsSync(CONFIG.projectsRootDir)) {
    console.error(
      `Error: Projects root directory does not exist: ${CONFIG.projectsRootDir}`
    );
    console.error(
      'Please create this directory or update the PROJECTS_ROOT_DIR environment variable.'
    );
    throw new Error('Projects root directory does not exist');
  }

  // Ensure project directories exist
  Object.values(CONFIG.projectDirectories).forEach(ensureDirectoryExists);

  // Check if database directory exists (create parent directory if needed)
  const dbDir = path.dirname(CONFIG.databasePath);
  ensureDirectoryExists(dbDir);

  // Log configuration
  console.log('Configuration loaded successfully:');
  console.log(`- Projects Root: ${CONFIG.projectsRootDir}`);
  console.log(`- Database Path: ${CONFIG.databasePath}`);
  console.log(`- Backup Directory: ${CONFIG.backupDir}`);
  console.log(`- Logs Directory: ${CONFIG.logsDir}`);
  console.log(`- OpenAI API Key: ${CONFIG.openai.apiKey ? 'Set' : 'Not Set'}`);
}

module.exports = { CONFIG, getEnv, validateConfig };
