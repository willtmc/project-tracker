/**
 * Utility for checking text similarity between projects
 */
export class SimilarityChecker {
    similarityThreshold: number;
    /**
     * Extract keywords from text
     * @param {string} text - Text to extract keywords from
     * @returns {Array<string>} - Array of keywords
     */
    extractKeywords(text: string): Array<string>;
    /**
     * Check basic text similarity between two projects
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {boolean} - True if projects are similar, false otherwise
     */
    checkBasicTextSimilarity(project1: Object, project2: Object): boolean;
    /**
     * Create a summary of a project for comparison
     * @param {Object} project - Project object
     * @returns {string} - Project summary
     */
    createProjectSummary(project: Object): string;
}
