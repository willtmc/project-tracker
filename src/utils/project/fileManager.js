const fs = require('fs').promises;
const path = require('path');

/**
 * Utility for managing project files
 */
class FileManager {
  constructor(projectDirs) {
    this.projectDirs = projectDirs;
    this.operationLog = [];
  }

  /**
   * Log a file operation
   * @param {string} operation - The operation being performed
   * @param {string} filePath - The file path involved
   * @param {Error} [error] - Optional error if the operation failed
   */
  logOperation(operation, filePath, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      filePath,
      success: !error,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : null,
    };

    this.operationLog.push(logEntry);

    // Keep log size manageable
    if (this.operationLog.length > 1000) {
      this.operationLog = this.operationLog.slice(-1000);
    }

    // Log to console
    if (error) {
      console.error(
        `[${timestamp}] File operation failed: ${operation} on ${filePath}`,
        error
      );
    } else {
      console.log(
        `[${timestamp}] File operation succeeded: ${operation} on ${filePath}`
      );
    }
  }

  /**
   * Get the operation log
   * @returns {Array} - The operation log
   */
  getOperationLog() {
    return this.operationLog;
  }

  /**
   * Ensure all project directories exist
   * @returns {Promise<void>}
   */
  async ensureDirectoriesExist() {
    console.log('Ensuring project directories exist...');
    for (const [status, dir] of Object.entries(this.projectDirs)) {
      try {
        await fs.access(dir);
        console.log(`Directory exists: ${dir}`);
        this.logOperation('check_directory', dir);
      } catch (error) {
        console.log(
          `Directory does not exist: ${dir}. Error: ${error.message}`
        );
        this.logOperation('check_directory', dir, error);
        // Don't create directories, just log the error
      }
    }
    console.log('All directories checked');
  }

  /**
   * Move a project file to a different directory
   * @param {string} sourcePath - Source file path
   * @param {string} targetDir - Target directory
   * @param {string} waitingInput - Optional waiting input to append to file
   * @returns {Promise<string>} - New file path
   */
  async moveProjectFile(sourcePath, targetDir, waitingInput = null) {
    try {
      // Get the filename from the source path
      const filename = path.basename(sourcePath);
      const targetPath = path.join(targetDir, filename);

      // Read the file content
      let content = await fs.readFile(sourcePath, 'utf8');
      this.logOperation('read_file', sourcePath);

      // If waiting input is provided, append it to the file
      if (waitingInput) {
        // Check if Waiting on Inputs section already exists
        if (content.includes('## Waiting on Inputs')) {
          // Replace the existing section
          content = content.replace(
            /## Waiting on Inputs[\s\S]*?(?=\n##|$)/,
            `## Waiting on Inputs\n${waitingInput}\n`
          );
        } else {
          // Add a new section
          content += `\n\n## Waiting on Inputs\n${waitingInput}`;
        }
      }

      // Write the file to the target directory
      await fs.writeFile(targetPath, content, 'utf8');
      this.logOperation('write_file', targetPath);

      // Delete the original file
      await fs.unlink(sourcePath);
      this.logOperation('delete_file', sourcePath);

      console.log(`Moved project file from ${sourcePath} to ${targetPath}`);
      return targetPath;
    } catch (error) {
      console.error(`Error moving project file:`, error);
      this.logOperation('move_file', `${sourcePath} to ${targetDir}`, error);
      throw error;
    }
  }

  /**
   * Get all project files from a directory
   * @param {string} directory - Directory to read
   * @returns {Promise<Array<string>>} - Array of file paths
   */
  async getProjectFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const projectFiles = files
        .filter(file => file.endsWith('.txt') && !file.startsWith('.'))
        .map(file => path.join(directory, file));

      this.logOperation('list_directory', directory);
      return projectFiles;
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      this.logOperation('list_directory', directory, error);
      return [];
    }
  }

  /**
   * Read a project file
   * @param {string} filePath - File path
   * @returns {Promise<Object>} - File content and stats
   */
  async readProjectFile(filePath) {
    try {
      const [content, stats] = await Promise.all([
        fs.readFile(filePath, 'utf8'),
        fs.stat(filePath),
      ]);

      this.logOperation('read_file', filePath);
      return { content, stats };
    } catch (error) {
      console.error(`Error reading project file ${filePath}:`, error);
      this.logOperation('read_file', filePath, error);
      throw error;
    }
  }

  /**
   * Write a project file
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {Promise<void>}
   */
  async writeProjectFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      this.logOperation('write_file', filePath);
      console.log(`Wrote project file ${filePath}`);
    } catch (error) {
      console.error(`Error writing project file ${filePath}:`, error);
      this.logOperation('write_file', filePath, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   * @param {string} filePath - File path to check
   * @returns {Promise<boolean>} - True if file exists, throws error if not
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath, fs.constants.F_OK);
      this.logOperation('check_file', filePath);
      return true;
    } catch (error) {
      this.logOperation('check_file', filePath, error);
      throw new Error(`File does not exist: ${filePath}`);
    }
  }
}

module.exports = { FileManager };
