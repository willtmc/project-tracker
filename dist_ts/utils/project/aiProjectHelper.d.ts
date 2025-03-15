/**
 * Utility for AI-assisted project management
 */
export class AIProjectHelper {
    openAIService: OpenAIService;
    /**
     * Reformulate a project with AI assistance
     * @param {Object} project - Project object
     * @param {string} endState - New end state
     * @returns {Promise<string>} - Reformulated project content
     */
    reformulateProject(project: Object, endState: string): Promise<string>;
    /**
     * Generate a project report with AI assistance
     * @param {Object} projects - Projects object with active, waiting, someday, and archive arrays
     * @returns {Promise<string>} - Generated report
     */
    generateReport(projects: Object): Promise<string>;
    /**
     * Prepare project summaries for report generation
     * @param {Array} projects - Array of project objects
     * @param {number} limit - Optional limit on number of projects to include
     * @returns {string} - Formatted project summaries
     */
    prepareProjectSummaries(projects: any[], limit?: number): string;
}
import { OpenAIService } from "../ai/openaiService";
