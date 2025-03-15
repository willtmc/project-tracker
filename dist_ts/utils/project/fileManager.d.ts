import { Stats } from 'fs';
/**
 * Interface for project directories configuration
 */
interface ProjectDirectories {
    [key: string]: string;
}
/**
 * Interface for operation log entry
 */
interface OperationLogEntry {
    timestamp: string;
    operation: string;
    filePath: string;
    success: boolean;
    error: {
        message: string;
        stack?: string;
    } | null;
}
/**
 * Interface for project file read result
 */
interface ProjectFileResult {
    content: string;
    stats: Stats;
}
/**
 * Utility for managing project files
 */
declare class FileManager {
    private projectDirs;
    private operationLog;
    constructor(projectDirs: ProjectDirectories);
    /**
     * Log a file operation
     * @param {string} operation - The operation being performed
     * @param {string} filePath - The file path involved
     * @param {Error} [error] - Optional error if the operation failed
     */
    logOperation(operation: string, filePath: string, error?: Error | null): void;
    /**
     * Get the operation log
     * @returns {Array} - The operation log
     */
    getOperationLog(): OperationLogEntry[];
    /**
     * Ensure all project directories exist
     * @returns {Promise<void>}
     */
    ensureDirectoriesExist(): Promise<void>;
    /**
     * Move a project file to a different directory
     * @param {string} sourcePath - Source file path
     * @param {string} targetDir - Target directory
     * @param {string} waitingInput - Optional waiting input to append to file
     * @returns {Promise<string>} - New file path
     */
    moveProjectFile(sourcePath: string, targetDir: string, waitingInput?: string | null): Promise<string>;
    /**
     * Get all project files from a directory
     * @param {string} directory - Directory to read
     * @returns {Promise<Array<string>>} - Array of file paths
     */
    getProjectFiles(directory: string): Promise<string[]>;
    /**
     * Read a project file
     * @param {string} filePath - File path
     * @returns {Promise<Object>} - File content and stats
     */
    readProjectFile(filePath: string): Promise<ProjectFileResult>;
    /**
     * Write a project file
     * @param {string} filePath - File path
     * @param {string} content - File content
     * @returns {Promise<void>}
     */
    writeProjectFile(filePath: string, content: string): Promise<void>;
    /**
     * Check if a file exists
     * @param {string} filePath - File path to check
     * @returns {Promise<boolean>} - True if file exists, throws error if not
     */
    fileExists(filePath: string): Promise<boolean>;
}
export { FileManager, ProjectDirectories, OperationLogEntry, ProjectFileResult };
