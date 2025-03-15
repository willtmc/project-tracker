export class ProjectManager {
    projectDirs: {
        active: string;
        waiting: string;
        archive: string;
        someday: string;
    };
    duplicateDetector: DuplicateDetector;
    /**
     * Ensure all project directories exist
     */
    ensureDirectoriesExist(): Promise<void>;
    /**
     * Get all projects from all directories
     */
    getAllProjects(): Promise<{
        active: never[];
        waiting: never[];
        someday: never[];
        archive: never[];
    }>;
    /**
     * Get projects from a specific directory
     */
    getProjectsFromDirectory(directory: any, status: any): Promise<{
        title: null;
        endState: null;
        tasks: never[];
        additionalInfo: null;
        waitingInput: null;
        filename: string;
        path: string;
        status: any;
        lastModified: Date;
        content: string;
        totalTasks: number;
        completedTasks: number;
        completionPercentage: number;
        isWellFormulated: any;
        needsImprovement: boolean;
        issues: {
            missingTitle: boolean;
            missingEndState: boolean;
            missingTasks: boolean;
            missingAdditionalInfo: boolean;
            filenameDoesNotReflectEndState: boolean;
            insufficientTasks: boolean;
            briefEndState: boolean;
        };
    }[]>;
    /**
     * Parse project content to extract structured data
     */
    parseProjectContent(content: any): {
        title: null;
        endState: null;
        tasks: never[];
        additionalInfo: null;
        waitingInput: null;
    };
    /**
     * Extract completed tasks from content
     */
    extractCompletedTasks(content: any): string[];
    /**
     * Count total tasks in content
     */
    countTotalTasks(content: any): number;
    /**
     * Extract project name from filename
     */
    extractProjectName(filename: any): any;
    /**
     * Validate if project has well-formulated structure
     * Returns an object with isWellFormulated and needsImprovement flags
     */
    validateProjectStructure(content: any, filename?: string): {
        isWellFormulated: any;
        needsImprovement: boolean;
        issues: {
            missingTitle: boolean;
            missingEndState: boolean;
            missingTasks: boolean;
            missingAdditionalInfo: boolean;
            filenameDoesNotReflectEndState: boolean;
            insufficientTasks: boolean;
            briefEndState: boolean;
        };
    };
    /**
     * Update project status (active, waiting, someday, archive)
     */
    updateProjectStatus(projectPath: any, isActive: any, isWaiting: any, waitingInput: any, targetStatus: any): Promise<{
        success: boolean;
        message: any;
    }>;
    /**
     * Validate if a project is well-formulated
     */
    validateProject(projectPath: any): Promise<{
        success: boolean;
        isWellFormulated: any;
        needsImprovement: boolean;
        issues: {
            missingTitle: boolean;
            missingEndState: boolean;
            missingTasks: boolean;
            missingAdditionalInfo: boolean;
            filenameDoesNotReflectEndState: boolean;
            insufficientTasks: boolean;
            briefEndState: boolean;
        };
        projectData: {
            title: null;
            endState: null;
            tasks: never[];
            additionalInfo: null;
            waitingInput: null;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        isWellFormulated?: undefined;
        needsImprovement?: undefined;
        issues?: undefined;
        projectData?: undefined;
    }>;
    /**
     * Reformulate a project using OpenAI
     */
    reformulateProject(projectPath: any, endState: any): Promise<{
        success: boolean;
        message: string;
        reformulatedContent: string | null;
        newFilename: string;
        isWellFormulated: any;
        needsImprovement: boolean;
    } | {
        success: boolean;
        message: any;
        reformulatedContent?: undefined;
        newFilename?: undefined;
        isWellFormulated?: undefined;
        needsImprovement?: undefined;
    }>;
    /**
     * Generate a report of project status and changes
     */
    generateReport(): Promise<{
        success: boolean;
        timestamp: string;
        stats: {
            active: number;
            waiting: number;
            someday: number;
            archive: number;
            total: number;
            completedTasks: number;
            totalTasks: number;
            completionRate: number;
        };
        projects: {
            active: never[];
            waiting: never[];
            someday: never[];
            archive: never[];
        };
        recentHistory: import("sequelize").Model<any, any>[];
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        timestamp?: undefined;
        stats?: undefined;
        projects?: undefined;
        recentHistory?: undefined;
    }>;
    /**
     * Find potential duplicate projects within active projects
     * @returns {Promise<Array>} Array of duplicate groups
     */
    findPotentialDuplicates(): Promise<any[]>;
    /**
     * Merge duplicate projects
     * @param {Array} projectPaths Array of project file paths to merge
     * @returns {Promise<Object>} Result of the merge operation
     */
    mergeDuplicateProjects(projectPaths: any[]): Promise<Object>;
    /**
     * Get all projects with potential duplicates
     * @returns {Promise<Array>} Array of projects with potential duplicates
     */
    getProjectsWithPotentialDuplicates(): Promise<any[]>;
}
import { DuplicateDetector } from "./duplicateDetector";
