export class DuplicateDetector {
    similarityThreshold: number;
    /**
     * Find potential duplicate projects within active projects
     * @param {Array} activeProjects - Array of active project objects
     * @returns {Promise<Array>} - Array of duplicate groups, each containing similar projects
     */
    findPotentialDuplicates(activeProjects: any[]): Promise<any[]>;
    /**
     * Check if two projects are similar using OpenAI
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {Promise<boolean>} - True if projects are similar, false otherwise
     */
    checkProjectSimilarityWithAI(project1: Object, project2: Object): Promise<boolean>;
    /**
     * Create a summary of a project for comparison
     * @param {Object} project - Project object
     * @returns {string} - Project summary
     */
    createProjectSummary(project: Object): string;
    /**
     * Basic text similarity check as fallback
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {boolean} - True if projects are similar, false otherwise
     */
    checkBasicTextSimilarity(project1: Object, project2: Object): boolean;
    /**
     * Extract meaningful keywords from text
     * @param {string} text - Text to extract keywords from
     * @returns {Array} - Array of keywords
     */
    extractKeywords(text: string): any[];
    /**
     * Calculate string similarity using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Similarity score between 0 and 1
     */
    calculateStringSimilarity(str1: string, str2: string): number;
    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} - Levenshtein distance
     */
    levenshteinDistance(str1: string, str2: string): number;
    /**
     * Merge duplicate projects
     * @param {Array} projects - Array of projects to merge
     * @returns {Promise<Object>} - Merged project
     */
    mergeProjects(projects: any[]): Promise<Object>;
    /**
     * Combine content from multiple projects using AI
     * @param {Array} projects - Array of projects to combine
     * @returns {Promise<string>} - Combined content
     */
    combineProjectContents(projects: any[]): Promise<string>;
    /**
     * Basic method to combine project contents without AI
     * @param {Array} projects - Array of projects to combine
     * @returns {string} - Combined content
     */
    basicCombineContents(projects: any[]): string;
    /**
     * Extract sections from project content
     * @param {string} content - Project content
     * @returns {Object} - Object with section names as keys and content as values
     */
    extractSections(content: string): Object;
}
