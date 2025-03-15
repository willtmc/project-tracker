/**
 * Utility for detecting duplicate projects
 */
export class DuplicateDetector {
    similarityChecker: SimilarityChecker;
    aiSimilarityChecker: AISimilarityChecker;
    openAIService: OpenAIService;
    /**
     * Find potential duplicate projects within active projects
     * @param {Array} activeProjects - Array of active project objects
     * @returns {Promise<Array>} - Array of duplicate groups, each containing similar projects
     */
    findPotentialDuplicates(activeProjects: any[]): Promise<any[]>;
    /**
     * Find duplicates using basic text similarity (fallback method)
     * @param {Array} projects - Array of project objects
     * @returns {Array} - Array of duplicate groups
     */
    findDuplicatesWithBasicSimilarity(projects: any[]): any[];
    /**
     * Check if two projects are similar
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {Promise<boolean>} - True if projects are similar, false otherwise
     */
    checkProjectSimilarity(project1: Object, project2: Object): Promise<boolean>;
    /**
     * Generate a merged project from two similar projects
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {Promise<Object>} - Merged project content
     */
    generateMergedProject(project1: Object, project2: Object): Promise<Object>;
}
import { SimilarityChecker } from "./similarityChecker";
import { AISimilarityChecker } from "./aiSimilarityChecker";
import { OpenAIService } from "../ai/openaiService";
