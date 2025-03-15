"use strict";
const path = require('path');
const { Project, ProjectHistory } = require('../../models/database');
const { FileManager } = require('./fileManager');
const { ProjectParser } = require('./projectParser');
const { AIProjectHelper } = require('./aiProjectHelper');
const { DuplicateDetector } = require('../duplicate/duplicateDetector');
// Project directories from the original Python script
const BASE_DIR = '/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents';
const PROJECTS_DIR = path.join(BASE_DIR, 'WTM Projects');
const WAITING_DIR = path.join(BASE_DIR, 'WTM Projects Waiting');
const ARCHIVE_DIR = path.join(BASE_DIR, 'WTM Projects Archive');
const SOMEDAY_DIR = path.join(BASE_DIR, 'WTM Projects Someday');
/**
 * Main project management class
 */
class ProjectManager {
    constructor() {
        this.projectDirs = {
            active: PROJECTS_DIR,
            waiting: WAITING_DIR,
            archive: ARCHIVE_DIR,
            someday: SOMEDAY_DIR,
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
            archive: [],
        };
        for (const [status, dir] of Object.entries(this.projectDirs)) {
            console.log(`Loading projects from ${status} directory: ${dir}`);
            try {
                // Check if directory exists before trying to read it
                projects[status] = await this.getProjectsFromDirectory(dir, status);
                console.log(`Loaded ${projects[status].length} ${status} projects`);
            }
            catch (error) {
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
                    // Validate the lastModified timestamp
                    const validLastModified = this.validateTimestamp(stats.mtime);
                    // Parse project content
                    const projectData = this.projectParser.parseProjectContent(content);
                    const completedTasks = this.projectParser.extractCompletedTasks(content);
                    const totalTasks = this.projectParser.countTotalTasks(content);
                    const { isWellFormulated, needsImprovement, issues } = this.projectParser.validateProjectStructure(content, filename);
                    // Update or create project in database
                    await Project.upsert({
                        filename: filename,
                        path: filePath,
                        title: projectData.title ||
                            this.projectParser.extractProjectName(filename),
                        status,
                        lastModified: validLastModified,
                        totalTasks,
                        completedTasks: completedTasks.length,
                        isWellFormulated,
                        needsImprovement,
                        issues: JSON.stringify(issues),
                    });
                    // Add to results
                    projects.push({
                        filename,
                        path: filePath,
                        title: projectData.title ||
                            this.projectParser.extractProjectName(filename),
                        status,
                        lastModified: validLastModified,
                        totalTasks,
                        completedTasks: completedTasks.length,
                        completionPercentage: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
                        isWellFormulated,
                        needsImprovement,
                        issues,
                        ...projectData,
                    });
                }
                catch (error) {
                    console.error(`Error processing project file ${filePath}:`, error);
                }
            }
            return projects;
        }
        catch (error) {
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
                }
                else {
                    targetDir = this.projectDirs.active;
                    console.log(`Moving to active directory: ${targetDir}`);
                }
            }
            else {
                if (targetStatus === 'someday') {
                    targetDir = this.projectDirs.someday;
                    console.log(`Moving to someday directory: ${targetDir}`);
                }
                else if (targetStatus === 'archive') {
                    targetDir = this.projectDirs.archive;
                    console.log(`Moving to archive directory: ${targetDir}`);
                }
                else {
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
                    ? isWaiting
                        ? 'waiting'
                        : 'active'
                    : targetStatus || 'archive';
                // Create a history record before updating
                await ProjectHistory.create({
                    filename: filename,
                    previousStatus: project.status,
                    newStatus: newStatus,
                    timestamp: new Date(),
                });
                // Update the project
                await project.update({
                    path: newPath,
                    status: newStatus,
                    lastModified: new Date(),
                });
            }
            return {
                success: true,
                message: `Project moved to ${targetStatus || (isWaiting ? 'waiting' : 'active')} status`,
                newPath,
            };
        }
        catch (error) {
            console.error('Error updating project status:', error);
            return {
                success: false,
                message: `Error updating project status: ${error.message}`,
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
                ...validation,
            };
        }
        catch (error) {
            console.error('Error validating project:', error);
            return {
                success: false,
                message: `Error validating project: ${error.message}`,
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
                content,
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
                    issues: JSON.stringify([]),
                });
            }
            return {
                success: true,
                message: 'Project reformulated successfully',
                newFilename: filename,
                reformulatedContent: reformulatedContent,
                isWellFormulated: true,
            };
        }
        catch (error) {
            console.error('Error reformulating project:', error);
            return {
                success: false,
                message: 'Error reformulating project: ' + error.message,
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
                report,
            };
        }
        catch (error) {
            console.error('Error generating report:', error);
            return {
                success: false,
                message: `Error generating report: ${error.message}`,
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
                duplicateGroups,
            };
        }
        catch (error) {
            console.error('Error finding potential duplicates:', error);
            return {
                success: false,
                message: `Error finding potential duplicates: ${error.message}`,
            };
        }
    }
    /**
     * Get projects by status
     * @param {string} status - The status of projects to retrieve (active, waiting, someday, archive)
     * @returns {Promise<Array>} - Array of projects with the specified status
     */
    async getProjectsByStatus(status) {
        console.log(`Getting projects with status: ${status}`);
        // Get all projects
        const allProjects = await this.getAllProjects();
        // Return projects with the specified status
        if (status in allProjects) {
            console.log(`Found ${allProjects[status].length} projects with status ${status}`);
            return allProjects[status];
        }
        else {
            console.warn(`Invalid status: ${status}`);
            return [];
        }
    }
    /**
     * Get projects with potential duplicates
     * @returns {Promise<Object>} - Object containing success status and duplicate groups
     */
    async getProjectsWithPotentialDuplicates() {
        try {
            console.log('Getting projects with potential duplicates...');
            // Get active projects
            const allProjects = await this.getAllProjects();
            const activeProjects = [...allProjects.active, ...allProjects.waiting];
            console.log(`Found ${activeProjects.length} active projects`);
            // Find potential duplicates
            const duplicateGroups = await this.duplicateDetector.findPotentialDuplicates(activeProjects);
            console.log(`Found ${duplicateGroups.length} potential duplicate groups`);
            if (duplicateGroups.length > 0) {
                return {
                    success: true,
                    duplicateGroups,
                    hasDuplicates: true,
                    message: `Found ${duplicateGroups.length} potential duplicate groups`,
                };
            }
            else {
                return {
                    success: true,
                    duplicateGroups: [],
                    hasDuplicates: false,
                    message: 'No potential duplicates found',
                };
            }
        }
        catch (error) {
            console.error('Error getting projects with potential duplicates:', error);
            return {
                success: false,
                duplicateGroups: [],
                hasDuplicates: false,
                message: `Error getting projects with potential duplicates: ${error.message}`,
            };
        }
    }
    /**
     * Merge duplicate projects
     * @param {Array<string>} projectIds - Array of project IDs to merge
     * @returns {Promise<Object>} - Object containing success status and merged project
     */
    async mergeDuplicateProjects(projectIds) {
        try {
            console.log(`Merging duplicate projects with IDs: ${projectIds.join(', ')}`);
            if (!projectIds || projectIds.length < 2) {
                return {
                    success: false,
                    message: 'At least two project IDs are required for merging',
                };
            }
            // Get the projects by their IDs
            const projects = [];
            for (const projectId of projectIds) {
                try {
                    const project = await this.getProjectById(projectId);
                    if (project) {
                        projects.push(project);
                    }
                    else {
                        console.warn(`Project with ID ${projectId} not found`);
                    }
                }
                catch (error) {
                    console.error(`Error getting project with ID ${projectId}:`, error);
                }
            }
            if (projects.length < 2) {
                return {
                    success: false,
                    message: 'Could not find at least two valid projects to merge',
                };
            }
            console.log(`Found ${projects.length} projects to merge`);
            // Generate merged content using the duplicate detector
            const mergedContent = await this.duplicateDetector.generateMergedProject(projects[0], projects[1]);
            // Create a new project with the merged content
            const primaryProject = projects[0];
            const mergedProject = {
                ...primaryProject,
                title: `Merged: ${primaryProject.title}`,
                content: mergedContent,
                lastModified: new Date().toISOString(),
            };
            // Save the merged project
            await this.saveProject(mergedProject);
            // Delete the original projects
            for (const project of projects) {
                await this.deleteProject(project.id);
            }
            return {
                success: true,
                mergedProject,
                message: `Successfully merged ${projects.length} projects`,
            };
        }
        catch (error) {
            console.error('Error merging duplicate projects:', error);
            return {
                success: false,
                message: `Error merging duplicate projects: ${error.message}`,
            };
        }
    }
    /**
     * Clean up database entries for files that no longer exist in the filesystem
     * @returns {Promise<Object>} - Result of the cleanup operation
     */
    async cleanupDatabaseEntries() {
        console.log('Cleaning up database entries for non-existent files...');
        try {
            // Get all projects from the database
            const dbProjects = await Project.findAll();
            console.log(`Found ${dbProjects.length} projects in database`);
            let removedCount = 0;
            let errorCount = 0;
            // Check each project file
            for (const project of dbProjects) {
                const filePath = project.path;
                try {
                    // Check if the file exists
                    await this.fileManager.fileExists(filePath);
                }
                catch (error) {
                    // File doesn't exist, remove from database
                    console.log(`File not found: ${filePath}. Removing from database.`);
                    try {
                        // Create history record before deletion
                        await ProjectHistory.create({
                            filename: project.filename,
                            previousStatus: project.status,
                            newStatus: 'deleted',
                            timestamp: new Date(),
                        });
                        // Delete the project from the database
                        await Project.destroy({ where: { filename: project.filename } });
                        removedCount++;
                        console.log(`Removed database entry for ${project.filename}`);
                    }
                    catch (deleteError) {
                        console.error(`Error removing database entry for ${project.filename}:`, deleteError);
                        errorCount++;
                    }
                }
            }
            console.log(`Database cleanup completed. Removed ${removedCount} entries. Errors: ${errorCount}`);
            return {
                success: true,
                message: `Database cleanup completed. Removed ${removedCount} entries. Errors: ${errorCount}`,
                removedCount,
                errorCount,
            };
        }
        catch (error) {
            console.error('Error cleaning up database entries:', error);
            return {
                success: false,
                message: `Error cleaning up database entries: ${error.message}`,
                error,
            };
        }
    }
    /**
     * Validate and fix a timestamp to ensure it's not in the future
     * @param {Date} timestamp - The timestamp to validate
     * @returns {Date} - A valid timestamp (current time if the input was in the future)
     */
    validateTimestamp(timestamp) {
        const now = new Date();
        // Check if timestamp is valid
        if (!timestamp || isNaN(timestamp.getTime())) {
            console.warn('Invalid timestamp detected, using current time instead');
            return now;
        }
        // Check if timestamp is in the future
        if (timestamp > now) {
            console.warn(`Future timestamp detected: ${timestamp.toISOString()}, using current time instead`);
            return now;
        }
        return timestamp;
    }
    /**
     * Fix future-dated timestamps in the database
     * @returns {Promise<Object>} - Result of the fix operation
     */
    async fixFutureDatedTimestamps() {
        console.log('Fixing future-dated timestamps in the database...');
        try {
            const now = new Date();
            // Get all projects from the database
            const dbProjects = await Project.findAll();
            console.log(`Found ${dbProjects.length} projects in database`);
            let fixedCount = 0;
            let errorCount = 0;
            // Check each project's timestamps
            for (const project of dbProjects) {
                const lastModified = new Date(project.lastModified);
                // Check if lastModified is in the future
                if (lastModified > now) {
                    console.log(`Future-dated timestamp detected for ${project.filename}: ${lastModified.toISOString()}`);
                    try {
                        // Update the project with the current timestamp
                        await Project.update({ lastModified: now }, { where: { filename: project.filename } });
                        fixedCount++;
                        console.log(`Fixed timestamp for ${project.filename}`);
                    }
                    catch (updateError) {
                        console.error(`Error fixing timestamp for ${project.filename}:`, updateError);
                        errorCount++;
                    }
                }
            }
            console.log(`Timestamp fix completed. Fixed ${fixedCount} entries. Errors: ${errorCount}`);
            return {
                success: true,
                message: `Timestamp fix completed. Fixed ${fixedCount} entries. Errors: ${errorCount}`,
                fixedCount,
                errorCount,
            };
        }
        catch (error) {
            console.error('Error fixing future-dated timestamps:', error);
            return {
                success: false,
                message: `Error fixing future-dated timestamps: ${error.message}`,
                error,
            };
        }
    }
    /**
     * Synchronize projects between database and filesystem
     * This method ensures that the database accurately reflects the filesystem state
     * @returns {Promise<Object>} - Result of the synchronization operation
     */
    async synchronizeProjects() {
        console.log('Starting project synchronization between database and filesystem...');
        try {
            // Step 1: Clean up database entries for non-existent files
            const cleanupResult = await this.cleanupDatabaseEntries();
            console.log('Database cleanup completed:', cleanupResult);
            // Step 2: Fix future-dated timestamps
            const timestampResult = await this.fixFutureDatedTimestamps();
            console.log('Timestamp fix completed:', timestampResult);
            // Step 3: Reload all projects from filesystem to ensure database is up-to-date
            const projects = await this.getAllProjects();
            console.log('Projects reloaded from filesystem');
            // Step 4: Verify synchronization
            const dbProjects = await Project.findAll();
            const dbProjectCount = dbProjects.length;
            let fileCount = 0;
            for (const status of Object.keys(this.projectDirs)) {
                try {
                    const files = await this.fileManager.getProjectFiles(this.projectDirs[status]);
                    fileCount += files.length;
                }
                catch (error) {
                    console.error(`Error counting files in ${status} directory:`, error);
                }
            }
            const syncStatus = {
                databaseProjects: dbProjectCount,
                filesystemProjects: fileCount,
                inSync: dbProjectCount === fileCount,
            };
            console.log('Synchronization verification:', syncStatus);
            return {
                success: true,
                message: 'Project synchronization completed',
                cleanupResult,
                timestampResult,
                syncStatus,
            };
        }
        catch (error) {
            console.error('Error during project synchronization:', error);
            return {
                success: false,
                message: `Error during project synchronization: ${error.message}`,
                error,
            };
        }
    }
    /**
     * Get a project by its ID
     * @param {string} projectId - The ID of the project to retrieve
     * @returns {Promise<Object|null>} - The project object or null if not found
     */
    async getProjectById(projectId) {
        try {
            console.log(`Getting project with ID: ${projectId}`);
            // Query the database for the project
            const project = await Project.findOne({ where: { id: projectId } });
            if (!project) {
                console.log(`No project found with ID: ${projectId}`);
                return null;
            }
            console.log(`Found project with ID: ${projectId}`);
            return project;
        }
        catch (error) {
            console.error(`Error getting project with ID ${projectId}:`, error);
            throw error;
        }
    }
}
module.exports = { ProjectManager };
//# sourceMappingURL=projectManager.js.map