const fs = require('fs').promises;
const path = require('path');

/**
 * Utility for managing project files
 */
class FileManager {
  constructor(projectDirs) {
    this.projectDirs = projectDirs;
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
      } catch (error) {
        console.log(`Directory does not exist: ${dir}. Error: ${error.message}`);
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
      
      // Delete the original file
      await fs.unlink(sourcePath);
      
      console.log(`Moved project file from ${sourcePath} to ${targetPath}`);
      return targetPath;
    } catch (error) {
      console.error(`Error moving project file:`, error);
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
      return files
        .filter(file => file.endsWith('.txt') && !file.startsWith('.'))
        .map(file => path.join(directory, file));
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
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
        fs.stat(filePath)
      ]);
      
      return { content, stats };
    } catch (error) {
      console.error(`Error reading project file ${filePath}:`, error);
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
      console.log(`Wrote project file ${filePath}`);
    } catch (error) {
      console.error(`Error writing project file ${filePath}:`, error);
      throw error;
    }
  }
}

module.exports = { FileManager };
