/**
 * Utility for checking project similarity using AI
 */
export class AISimilarityChecker {
    openAIService: OpenAIService;
    /**
     * Check if two projects are similar using OpenAI
     * @param {Object} project1 - First project object
     * @param {Object} project2 - Second project object
     * @returns {Promise<boolean>} - True if projects are similar, false otherwise
     */
    checkProjectSimilarityWithAI(project1: Object, project2: Object): Promise<boolean>;
}
import { OpenAIService } from "../ai/openaiService";
