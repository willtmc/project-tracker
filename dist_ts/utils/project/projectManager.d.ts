/**
 * Main project management class
 */
export class ProjectManager {
    projectDirs: {
        active: string;
        waiting: string;
        archive: string;
        someday: string;
    };
    fileManager: FileManager;
    projectParser: ProjectParser;
    aiProjectHelper: AIProjectHelper;
    duplicateDetector: DuplicateDetector;
    /**
     * Ensure all project directories exist
     * @returns {Promise<void>}
     */
    ensureDirectoriesExist(): Promise<void>;
    /**
     * Get all projects from all directories
     * @returns {Promise<Object>} - Object with active, waiting, someday, and archive project arrays
     */
    getAllProjects(): Promise<Object>;
    /**
     * Get projects from a specific directory
     * @param {string} directory - Directory to read
     * @param {string} status - Project status
     * @returns {Promise<Array>} - Array of project objects
     */
    getProjectsFromDirectory(directory: string, status: string): Promise<any[]>;
    /**
     * Update project status
     * @param {string} projectPath - Project file path
     * @param {boolean} isActive - Whether the project is active
     * @param {boolean} isWaiting - Whether the project is waiting for input
     * @param {string} waitingInput - Optional waiting input to append to file
     * @param {string} targetStatus - Target status (active, waiting, someday, archive)
     * @returns {Promise<Object>} - Result object
     */
    updateProjectStatus(projectPath: string, isActive: boolean, isWaiting: boolean, waitingInput: string, targetStatus: string): Promise<Object>;
    /**
     * Validate a project
     * @param {string} projectPath - Project file path
     * @returns {Promise<Object>} - Validation results
     */
    validateProject(projectPath: string): Promise<Object>;
    /**
     * Reformulate a project with AI assistance
     * @param {string} projectPath - Path to the project file
     * @param {string} endState - New end state
     * @returns {Promise<Object>} - Result of the reformulation
     */
    reformulateProject(projectPath: string, endState: string): Promise<Object>;
    /**
     * Generate a project report with AI assistance
     * @returns {Promise<Object>} - Result object with report
     */
    generateReport(): Promise<Object>;
    /**
     * Find potential duplicate projects
     * @returns {Promise<Object>} - Result object with duplicate groups
     */
    findPotentialDuplicates(): Promise<Object>;
    /**
     * Get projects by status
     * @param {string} status - The status of projects to retrieve (active, waiting, someday, archive)
     * @returns {Promise<Array>} - Array of projects with the specified status
     */
    getProjectsByStatus(status: string): Promise<any[]>;
    /**
     * Get projects with potential duplicates
     * @returns {Promise<Object>} - Object containing success status and duplicate groups
     */
    getProjectsWithPotentialDuplicates(): Promise<Object>;
    /**
     * Merge duplicate projects
     * @param {Array<string>} projectIds - Array of project IDs to merge
     * @returns {Promise<Object>} - Object containing success status and merged project
     */
    mergeDuplicateProjects(projectIds: Array<string>): Promise<Object>;
    /**
     * Clean up database entries for files that no longer exist in the filesystem
     * @returns {Promise<Object>} - Result of the cleanup operation
     */
    cleanupDatabaseEntries(): Promise<Object>;
    /**
     * Validate and fix a timestamp to ensure it's not in the future
     * @param {Date} timestamp - The timestamp to validate
     * @returns {Date} - A valid timestamp (current time if the input was in the future)
     */
    validateTimestamp(timestamp: Date): Date;
    /**
     * Fix future-dated timestamps in the database
     * @returns {Promise<Object>} - Result of the fix operation
     */
    fixFutureDatedTimestamps(): Promise<Object>;
    /**
     * Synchronize projects between database and filesystem
     * This method ensures that the database accurately reflects the filesystem state
     * @returns {Promise<Object>} - Result of the synchronization operation
     */
    synchronizeProjects(): Promise<Object>;
    /**
     * Get a project by its ID
     * @param {string} projectId - The ID of the project to retrieve
     * @returns {Promise<Object|null>} - The project object or null if not found
     */
    getProjectById(projectId: string): Promise<Object | null>;
}
import { FileManager } from "./fileManager";
import { ProjectParser } from "./projectParser";
import { AIProjectHelper } from "./aiProjectHelper";
import { DuplicateDetector } from "../duplicate/duplicateDetector";
