/**
 * Utility for parsing project content
 */
export class ProjectParser {
    /**
     * Extract project name from filename
     * @param {string} filename - Project filename
     * @returns {string} - Extracted project name
     */
    extractProjectName(filename: string): string;
    /**
     * Parse project content to extract structured data
     * @param {string} content - Project content
     * @returns {Object} - Structured project data
     */
    parseProjectContent(content: string): Object;
    /**
     * Extract completed tasks from content
     * @param {string} content - Project content
     * @returns {Array} - Array of completed tasks
     */
    extractCompletedTasks(content: string): any[];
    /**
     * Count total tasks in content
     * @param {string} content - Project content
     * @returns {number} - Total number of tasks
     */
    countTotalTasks(content: string): number;
    /**
     * Validate project structure
     * @param {string} content - Project content
     * @param {string} filename - Project filename
     * @returns {Object} - Validation results
     */
    validateProjectStructure(content: string, filename: string): Object;
}
