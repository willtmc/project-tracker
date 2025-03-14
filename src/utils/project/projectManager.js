const path = require('path');
const { Project, ProjectHistory } = require('../../models/database');
const { FileManager } = require('./fileManager');
const { ProjectParser } = require('./projectParser');
const { AIProjectHelper } = require('./aiProjectHelper');
const { DuplicateDetector } = require('../duplicate/duplicateDetector');

// Project directories from the original Python script
const BASE_DIR = "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents";
const PROJECTS_DIR = path.join(BASE_DIR, "WTM Projects");
const WAITING_DIR = path.join(BASE_DIR, "WTM Projects Waiting");
const ARCHIVE_DIR = path.join(BASE_DIR, "WTM Projects Archive");
const SOMEDAY_DIR = path.join(BASE_DIR, "WTM Projects Someday");

/**
 * Main project management class
 */
class ProjectManager {
  constructor() {
    this.projectDirs = {
      active: PROJECTS_DIR,
      waiting: WAITING_DIR,
      archive: ARCHIVE_DIR,
      someday: SOMEDAY_DIR
    };
    
    this.fileManager = new FileManager(this.projectDirs);
    this.projectParser = new ProjectParser();
    this.aiProjectHelper = new AIProjectHelper();
    this.duplicateDetector = new DuplicateDetector();
  }

  /**
   * Ensure all project directories exist
   * @returns {Promise<void>}
   */
  async ensureDirectoriesExist() {
    return this.fileManager.ensureDirectoriesExist();
  }

  /**
   * Get all projects from all directories
   * @returns {Promise<Object>} - Object with active, waiting, someday, and archive project arrays
   */
  async getAllProjects() {
    console.log('Getting all projects...');
    // Ensure directories exist
    await this.ensureDirectoriesExist();
    
    const projects = {
      active: [],
      waiting: [],
      someday: [],
      archive: []
    };
    
    for (const [status, dir] of Object.entries(this.projectDirs)) {
      console.log(`Loading projects from ${status} directory: ${dir}`);
      try {
        // Check if directory exists before trying to read it
        projects[status] = await this.getProjectsFromDirectory(dir, status);
        console.log(`Loaded ${projects[status].length} ${status} projects`);
      } catch (error) {
        console.error(`Error accessing directory ${dir}:`, error.message);
        // Keep the empty array for this status
      }
    }
    
    return projects;
  }

  /**
   * Get projects from a specific directory
   * @param {string} directory - Directory to read
   * @param {string} status - Project status
   * @returns {Promise<Array>} - Array of project objects
   */
  async getProjectsFromDirectory(directory, status) {
    try {
      // Get all project files in the directory
      const projectFiles = await this.fileManager.getProjectFiles(directory);
      
      const projects = [];
      
      for (const filePath of projectFiles) {
        const filename = path.basename(filePath);
        
        try {
          // Read file content and stats
          const { content, stats } = await this.fileManager.readProjectFile(filePath);
          
          // Parse project content
          const projectData = this.projectParser.parseProjectContent(content);
          const completedTasks = this.projectParser.extractCompletedTasks(content);
          const totalTasks = this.projectParser.countTotalTasks(content);
          const { isWellFormulated, needsImprovement, issues } = this.projectParser.validateProjectStructure(content, filename);
          
          // Update or create project in database
          await Project.upsert({
            filename: filename,
            path: filePath,
            title: projectData.title || this.projectParser.extractProjectName(filename),
            status,
            lastModified: stats.mtime,
            totalTasks,
            completedTasks: completedTasks.length,
            isWellFormulated,
            needsImprovement,
            issues: JSON.stringify(issues)
          });
          
          // Add to results
          projects.push({
            filename: filename,
            path: filePath,
            title: projectData.title || this.projectParser.extractProjectName(filename),
            status,
            lastModified: stats.mtime,
            content,
            totalTasks,
            completedTasks: completedTasks.length,
            completionPercentage: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
            isWellFormulated,
            needsImprovement,
            issues,
            ...projectData
          });
        } catch (error) {
          console.error(`Error processing project file ${filePath}:`, error);
          // Skip this file and continue with the next one
        }
      }
      
      return projects;
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      return [];
    }
  }

  /**
   * Update project status
   * @param {string} projectPath - Project file path
   * @param {boolean} isActive - Whether the project is active
   * @param {boolean} isWaiting - Whether the project is waiting for input
   * @param {string} waitingInput - Optional waiting input to append to file
   * @param {string} targetStatus - Target status (active, waiting, someday, archive)
   * @returns {Promise<Object>} - Result object
   */
  async updateProjectStatus(projectPath, isActive, isWaiting, waitingInput, targetStatus) {
    try {
      console.log(`Updating project status: ${projectPath}`);
      console.log(`isActive: ${isActive}, isWaiting: ${isWaiting}, targetStatus: ${targetStatus}`);
      
      // Determine the target directory based on the status
      let targetDir;
      
      if (isActive) {
        if (isWaiting) {
          targetDir = this.projectDirs.waiting;
          console.log(`Moving to waiting directory: ${targetDir}`);
        } else {
          targetDir = this.projectDirs.active;
          console.log(`Moving to active directory: ${targetDir}`);
        }
      } else {
        if (targetStatus === 'someday') {
          targetDir = this.projectDirs.someday;
          console.log(`Moving to someday directory: ${targetDir}`);
        } else if (targetStatus === 'archive') {
          targetDir = this.projectDirs.archive;
          console.log(`Moving to archive directory: ${targetDir}`);
        } else {
          throw new Error(`Invalid target status: ${targetStatus}`);
        }
      }
      
      // Move the project file to the target directory
      const newPath = await this.fileManager.moveProjectFile(projectPath, targetDir, waitingInput);
      
      // Update the project in the database
      const filename = path.basename(newPath);
      const project = await Project.findOne({ where: { path: projectPath } });
      
      if (project) {
        // Determine the new status based on the parameters
        const newStatus = isActive 
          ? (isWaiting ? 'waiting' : 'active') 
          : (targetStatus || 'archive');
        
        // Create a history record before updating
        await ProjectHistory.create({
          filename: filename,
          previousStatus: project.status,
          newStatus: newStatus,
          timestamp: new Date()
        });
        
        // Update the project
        await project.update({
          path: newPath,
          status: newStatus,
          lastModified: new Date()
        });
      }
      
      return {
        success: true,
        message: `Project moved to ${targetStatus || (isWaiting ? 'waiting' : 'active')} status`,
        newPath
      };
    } catch (error) {
      console.error('Error updating project status:', error);
      return {
        success: false,
        message: `Error updating project status: ${error.message}`
      };
    }
  }

  /**
   * Validate a project
   * @param {string} projectPath - Project file path
   * @returns {Promise<Object>} - Validation results
   */
  async validateProject(projectPath) {
    try {
      // Read the project file
      const { content } = await this.fileManager.readProjectFile(projectPath);
      const filename = path.basename(projectPath);
      
      // Validate the project structure
      const validation = this.projectParser.validateProjectStructure(content, filename);
      
      return {
        success: true,
        ...validation
      };
    } catch (error) {
      console.error('Error validating project:', error);
      return {
        success: false,
        message: `Error validating project: ${error.message}`
      };
    }
  }

  /**
   * Reformulate a project with AI assistance
   * @param {string} projectPath - Path to the project file
   * @param {string} endState - New end state
   * @returns {Promise<Object>} - Result of the reformulation
   */
  async reformulateProject(projectPath, endState) {
    try {
      // Read the project file
      const { content } = await this.fileManager.readProjectFile(projectPath);
      const filename = path.basename(projectPath);
      
      // Parse the project content
      const projectData = this.projectParser.parseProjectContent(content);
      const project = {
        path: projectPath,
        filename,
        title: projectData.title || this.projectParser.extractProjectName(filename),
        content
      };
      
      // Reformulate the project with AI assistance
      const reformulatedContent = await this.aiProjectHelper.reformulateProject(project, endState);
      
      // Write the reformulated content back to the file
      await this.fileManager.writeProjectFile(projectPath, reformulatedContent);
      
      // Update the project in the database
      const dbProject = await Project.findOne({ where: { path: projectPath } });
      if (dbProject) {
        await dbProject.update({
          lastModified: new Date(),
          isWellFormulated: true,
          needsImprovement: false,
          issues: JSON.stringify([])
        });
      }
      
      return {
        success: true,
        message: 'Project reformulated successfully',
        newFilename: filename,
        reformulatedContent: reformulatedContent,
        isWellFormulated: true
      };
    } catch (error) {
      console.error('Error reformulating project:', error);
      return {
        success: false,
        message: 'Error reformulating project: ' + error.message
      };
    }
  }

  /**
   * Generate a project report with AI assistance
   * @returns {Promise<Object>} - Result object with report
   */
  async generateReport() {
    try {
      // Get all projects
      const projects = await this.getAllProjects();
      
      // Generate the report with AI assistance
      const report = await this.aiProjectHelper.generateReport(projects);
      
      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        message: `Error generating report: ${error.message}`
      };
    }
  }

  /**
   * Find potential duplicate projects
   * @returns {Promise<Object>} - Result object with duplicate groups
   */
  async findPotentialDuplicates() {
    try {
      // Get active projects
      const projects = await this.getAllProjects();
      const activeProjects = [...projects.active, ...projects.waiting];
      
      // Find potential duplicates
      const duplicateGroups = await this.duplicateDetector.findPotentialDuplicates(activeProjects);
      
      return {
        success: true,
        duplicateGroups
      };
    } catch (error) {
      console.error('Error finding potential duplicates:', error);
      return {
        success: false,
        message: `Error finding potential duplicates: ${error.message}`
      };
    }
  }

  /**
   * Merge duplicate projects
   * @param {Array} projectPaths - Array of project file paths to merge
   * @returns {Promise<Object>} - Result object
   */
  async mergeDuplicateProjects(projectPaths) {
    try {
      if (!projectPaths || projectPaths.length < 2) {
        return {
          success: false,
          message: 'At least two projects are required for merging'
        };
      }
      
      // Read all project files
      const projects = [];
      for (const projectPath of projectPaths) {
        const { content } = await this.fileManager.readProjectFile(projectPath);
        const filename = path.basename(projectPath);
        const projectData = this.projectParser.parseProjectContent(content);
        
        projects.push({
          path: projectPath,
          filename,
          title: projectData.title || this.projectParser.extractProjectName(filename),
          content
        });
      }
      
      // Generate merged content
      const mergedContent = await this.duplicateDetector.generateMergedProject(projects[0], projects[1]);
      
      // Write merged content to the first project file
      await this.fileManager.writeProjectFile(projects[0].path, mergedContent);
      
      // Archive the other project files
      for (let i = 1; i < projects.length; i++) {
        await this.updateProjectStatus(projects[i].path, false, false, null, 'archive');
      }
      
      return {
        success: true,
        message: 'Projects merged successfully',
        mergedPath: projects[0].path,
        mergedContent
      };
    } catch (error) {
      console.error('Error merging duplicate projects:', error);
      return {
        success: false,
        message: `Error merging duplicate projects: ${error.message}`
      };
    }
  }

  /**
   * Get projects with potential duplicates
   * @returns {Promise<Object>} - Result object with projects and duplicate info
   */
  async getProjectsWithPotentialDuplicates() {
    try {
      // Get all projects
      const allProjects = await this.getAllProjects();
      const activeProjects = [...allProjects.active, ...allProjects.waiting];
      
      // Find potential duplicates
      const duplicateGroups = await this.duplicateDetector.findPotentialDuplicates(activeProjects);
      
      // Create a map of project paths to duplicate groups
      const duplicateMap = new Map();
      duplicateGroups.forEach(group => {
        group.forEach(project => {
          duplicateMap.set(project.path, {
            hasDuplicates: true,
            duplicateGroup: group.map(p => p.path)
          });
        });
      });
      
      // Add duplicate information to projects
      const projectsWithDuplicateInfo = {};
      
      for (const [status, projects] of Object.entries(allProjects)) {
        projectsWithDuplicateInfo[status] = projects.map(project => {
          const duplicateInfo = duplicateMap.get(project.path) || {
            hasDuplicates: false,
            duplicateGroup: []
          };
          
          return {
            ...project,
            ...duplicateInfo
          };
        });
      }
      
      return {
        success: true,
        projects: projectsWithDuplicateInfo,
        duplicateGroups
      };
    } catch (error) {
      console.error('Error getting projects with potential duplicates:', error);
      return {
        success: false,
        message: `Error getting projects with potential duplicates: ${error.message}`
      };
    }
  }
}

module.exports = { ProjectManager };
